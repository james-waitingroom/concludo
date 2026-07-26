/**
 * Persist a contract's judgment chain (POs + the immutable judgment ledger) to Supabase.
 * The DB trigger keeps judgments immutable, so `supersedes` is set at insert time and only
 * `superseded_by` is patched in a second pass (that column is not immutable).
 */
import { getSupabase } from "./supabase.js";
import type { ChainResult } from "../run.js";

export async function findContractByName(companyId: string, name: string): Promise<string | null> {
  const db = getSupabase();
  const res = await db.from("contracts").select("id").eq("company_id", companyId).eq("name", name).limit(1);
  if (res.error) throw res.error;
  return res.data && res.data[0] ? (res.data[0].id as string) : null;
}

/** Remove existing POs + judgments for a contract so a re-run is clean (judgments first — FK order). */
export async function clearContractAnalysis(contractId: string): Promise<void> {
  const db = getSupabase();
  const dj = await db.from("judgments").delete().eq("contract_id", contractId);
  if (dj.error) throw dj.error;
  const dp = await db.from("performance_obligations").delete().eq("contract_id", contractId);
  if (dp.error) throw dp.error;
}

export async function persistAnalysis(contractId: string, chain: ChainResult): Promise<{ pos: number; judgments: number }> {
  const db = getSupabase();
  await clearContractAnalysis(contractId);

  // 1) Performance obligations — map engine id → db uuid.
  const poIdMap = new Map<string, string>();
  for (const po of chain.contract.performance_obligations) {
    const res = await db
      .from("performance_obligations")
      .insert({
        contract_id: contractId,
        description: po.description,
        is_distinct: po.is_distinct,
        ssp_method: po.standalone_ssp?.method ?? null,
        ssp_value: po.standalone_ssp?.value ?? null,
        ssp_confidence_tier: po.standalone_ssp?.confidence_tier ?? null,
        allocated_price: po.allocated_price,
        recognition_type: po.recognition?.type ?? null,
        recognition_method: po.recognition?.method ?? null,
        start_month: po.start_month,
        end_month: po.end_month,
        observable_pricing: po.observable_pricing,
        comparable_count: po.comparable_count,
      })
      .select("id")
      .single();
    if (res.error) throw res.error;
    poIdMap.set(po.id, res.data.id as string);
  }

  // 2) Judgments — insert in store order so a superseded row exists before the row that supersedes it.
  const jIdMap = new Map<string, string>();
  const all = chain.store.all();
  for (const j of all) {
    const res = await db
      .from("judgments")
      .insert({
        contract_id: contractId,
        performance_obligation_id: j.performance_obligation_id ? (poIdMap.get(j.performance_obligation_id) ?? null) : null,
        judgment_type: j.judgment_type,
        standard_ref: j.standard_ref,
        contract_evidence: j.contract_evidence,
        ai_proposed_conclusion: j.ai_proposed_conclusion,
        structured: j.structured,
        confidence_tier: j.confidence_tier,
        sensitivity_note: j.sensitivity_note,
        human_decision: j.human_decision,
        status: j.status,
        supersedes: j.supersedes ? (jIdMap.get(j.supersedes) ?? null) : null,
        superseded_by: null,
      })
      .select("id")
      .single();
    if (res.error) throw res.error;
    jIdMap.set(j.id, res.data.id as string);
  }

  // 3) Backfill superseded_by (updatable — not blocked by the immutability trigger).
  for (const j of all) {
    if (!j.superseded_by) continue;
    const upd = await db.from("judgments").update({ superseded_by: jIdMap.get(j.superseded_by)! }).eq("id", jIdMap.get(j.id)!);
    if (upd.error) throw upd.error;
  }

  return { pos: poIdMap.size, judgments: jIdMap.size };
}
