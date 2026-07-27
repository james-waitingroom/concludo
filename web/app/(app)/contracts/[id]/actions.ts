"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabaseServer";

async function actor() {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, email: user?.email ?? "unknown", signedIn: !!user };
}

/** Approve a proposed judgment — allowed by the immutability trigger (only status + human_decision change). */
export async function approveJudgment(input: { id: string; contractId: string }): Promise<{ error?: string }> {
  const { supabase, email, signedIn } = await actor();
  if (!signedIn) return { error: "Not signed in." };
  const { error } = await supabase
    .from("judgments")
    .update({ status: "approved", human_decision: { decision: "approved", approved_by: email, timestamp: new Date().toISOString() } })
    .eq("id", input.id);
  if (error) return { error: error.message };
  revalidatePath(`/contracts/${input.contractId}`);
  return {};
}

/** Reopen an approved judgment for re-review. */
export async function reopenJudgment(input: { id: string; contractId: string }): Promise<{ error?: string }> {
  const { supabase, signedIn } = await actor();
  if (!signedIn) return { error: "Not signed in." };
  const { error } = await supabase.from("judgments").update({ status: "proposed", human_decision: null }).eq("id", input.id);
  if (error) return { error: error.message };
  revalidatePath(`/contracts/${input.contractId}`);
  return {};
}

/**
 * Override a judgment's conclusion. Judgments are immutable, so this creates a NEW version
 * (with the human's conclusion), marks it approved, and supersedes the original — building the
 * audit trail exactly as the PRD requires.
 */
export async function overrideJudgment(input: { id: string; contractId: string; newValue: string; reason: string }): Promise<{ error?: string }> {
  const { supabase, email, signedIn } = await actor();
  if (!signedIn) return { error: "Not signed in." };
  if (!input.newValue.trim() || !input.reason.trim()) return { error: "A revised conclusion and a reason are required." };

  const { data: old, error: readErr } = await supabase.from("judgments").select("*").eq("id", input.id).single();
  if (readErr || !old) return { error: readErr?.message ?? "Judgment not found." };

  const conclusion = { ...(old.ai_proposed_conclusion as Record<string, unknown>), value: input.newValue, human_override: input.reason };
  const ins = await supabase
    .from("judgments")
    .insert({
      contract_id: old.contract_id,
      performance_obligation_id: old.performance_obligation_id,
      judgment_type: old.judgment_type,
      standard_ref: old.standard_ref,
      contract_evidence: old.contract_evidence,
      ai_proposed_conclusion: conclusion,
      structured: old.structured,
      confidence_tier: old.confidence_tier,
      sensitivity_note: old.sensitivity_note,
      human_decision: { decision: "override", override_reason: input.reason, approved_by: email, timestamp: new Date().toISOString() },
      status: "approved",
      supersedes: old.id,
    })
    .select("id")
    .single();
  if (ins.error) return { error: ins.error.message };

  const upd = await supabase.from("judgments").update({ status: "superseded", superseded_by: ins.data.id }).eq("id", old.id);
  if (upd.error) return { error: upd.error.message };

  revalidatePath(`/contracts/${input.contractId}`);
  return {};
}
