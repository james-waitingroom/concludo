/**
 * Run the Brightwell judgment chain and persist it to Supabase — closing the loop
 * (facts → judgments → stored in the DB).
 *   npm run db:persist          # mock judgments ($0)
 *   npm run db:persist -- --real # live Claude proposals
 * Requires `npm run db:seed` first (the Brightwell contract row must exist).
 */
import dotenv from "dotenv";
dotenv.config();

import { runChain } from "../run.js";
import { brightwell } from "../facts.js";
import { getOrCreateCompany } from "./contracts.js";
import { findContractByName, persistAnalysis } from "./judgments.js";
import { getSupabase } from "./supabase.js";

const CONTRACT_NAME = "Platform + Distinct Implementation"; // Brightwell, from the seed

async function main(): Promise<void> {
  const forceMock = !process.argv.slice(2).includes("--real"); // mock by default to avoid API spend

  const companyId = await getOrCreateCompany("ACME Inc.", "Software / SaaS");
  const contractId = await findContractByName(companyId, CONTRACT_NAME);
  if (!contractId) throw new Error(`Contract "${CONTRACT_NAME}" not found — run 'npm run db:seed' first.`);

  const chain = await runChain(brightwell, { forceMock });
  const { pos, judgments } = await persistAnalysis(contractId, chain);

  console.log(`\x1b[32m✓ Persisted analysis for Brightwell\x1b[0m (${chain.mode} judgments)`);
  console.log(`  ${pos} performance obligations, ${judgments} judgment rows written.`);

  // Read it back so you can see the stored ledger.
  const db = getSupabase();
  const view = await db
    .from("judgments")
    .select("judgment_type,status,confidence_tier")
    .eq("contract_id", contractId)
    .order("created_at");
  if (view.error) throw view.error;
  const approved = view.data.filter((r) => r.status === "approved");
  const superseded = view.data.filter((r) => r.status === "superseded");
  console.log(`  Ledger in DB: ${view.data.length} rows (${approved.length} approved, ${superseded.length} superseded — the audit trail).`);
  for (const r of approved) console.log(`    • ${r.judgment_type}${r.confidence_tier ? " (" + r.confidence_tier + ")" : ""} — approved`);
}

main().catch((e: unknown) => {
  const o = e as Record<string, unknown>;
  const msg = e instanceof Error ? e.message : [o?.message, o?.code && `(code ${o.code})`, o?.details].filter(Boolean).join(" · ") || String(e);
  console.error("\x1b[31m✗ Persist failed:\x1b[0m", msg);
  process.exitCode = 1;
});
