/**
 * Step 2 runner (PRD §7): run one contract through a full ASC 606 judgment chain.
 *
 *   facts → propose judgments → human-approve → apply → allocate (relative SSP) → recognize → memo
 *
 * `runChain()` is the reusable pipeline (also used by the DB-persist path); `main()` runs Brightwell
 * and prints the trace + memo. Runs at $0 in mock mode; the deterministic layer is pure code.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import dotenv from "dotenv";
import type { Contract, Judgment, SSP } from "./model.js";
import { JudgmentStore } from "./store.js";
import { makeProposer, type ProposerMode } from "./judgments/proposer.js";
import { brightwell } from "./facts.js";
import { allocateByRelativeSSP, type Allocation } from "./ssp.js";
import { recognize, type RecognitionResult } from "./recognition.js";
import { renderMemo } from "./memo.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load engine/.env, then fall back to the spike's .env so the key is reused without copying it.
dotenv.config({ quiet: true });
dotenv.config({ path: join(__dirname, "..", "..", "spike", ".env"), quiet: true });

function clone<T>(x: T): T {
  return structuredClone(x);
}

/** Apply an approved judgment's structured conclusion onto the relevant PO. */
function applyJudgment(contract: Contract, j: Judgment): void {
  const po = contract.performance_obligations.find((p) => p.id === j.performance_obligation_id);
  const s = j.structured ?? {};
  switch (j.judgment_type) {
    case "distinctness":
      if (po) po.is_distinct = Boolean(s.is_distinct);
      break;
    case "ssp_method":
      if (po) po.standalone_ssp = { method: s.method as SSP["method"], value: Number(s.ssp_value), confidence_tier: j.confidence_tier ?? "observed_low", support_refs: j.contract_evidence };
      break;
    case "recognition_pattern":
      if (po) po.recognition = { type: s.type as "over_time" | "point_in_time", method: String(s.method) };
      break;
    default:
      break;
  }
}

export interface ChainResult {
  contract: Contract;
  store: JudgmentStore;
  approved: Judgment[];
  allocations: Allocation[];
  schedules: RecognitionResult[];
  mode: ProposerMode;
}

/** The full judgment chain for one contract. Does not print or write files. */
export async function runChain(input: Contract, opts: { forceMock?: boolean } = {}): Promise<ChainResult> {
  const contract = clone(input);
  const store = new JudgmentStore();
  const proposer = makeProposer(opts.forceMock ?? false);

  const proposals = await proposer.propose(contract);
  const approved: Judgment[] = [];
  for (const p of proposals) {
    store.add(p);
    const decided = store.approve(p.id, "controller@acme");
    approved.push(decided);
    applyJudgment(contract, decided);
  }

  const allocations = allocateByRelativeSSP(contract.transaction_price, contract.performance_obligations);
  for (const a of allocations) {
    const po = contract.performance_obligations.find((p) => p.id === a.po_id)!;
    po.allocated_price = a.allocated;
  }

  const schedules = contract.performance_obligations.map((po) => recognize(po));
  return { contract, store, approved, allocations, schedules, mode: proposer.mode };
}

async function main(): Promise<void> {
  const forceMock = process.argv.slice(2).includes("--mock");
  const model = process.env.ANTHROPIC_MODEL?.trim() || "claude-sonnet-5";

  const { contract, store, approved, allocations, schedules, mode } = await runChain(brightwell, { forceMock });

  console.log(`\n\x1b[36m\x1b[1mConcludo Engine — Judgment Chain\x1b[0m  \x1b[2m(PRD §7 Step 2)\x1b[0m`);
  console.log("\x1b[90m" + "─".repeat(72) + "\x1b[0m");
  console.log(`Contract: \x1b[1m${contract.customer}\x1b[0m (${contract.id}) — transaction price $${contract.transaction_price.toLocaleString()}`);
  console.log(mode === "real"
    ? `Judgment source: \x1b[32mREAL — Claude (${model}) proposing judgments via tool-use\x1b[0m`
    : `Judgment source: \x1b[33mMOCK (hand-authored proposals — $0; add a key or drop --mock to go live)\x1b[0m`);
  console.log("\x1b[90m" + "─".repeat(72) + "\x1b[0m");

  for (const decided of approved) {
    const poLabel = decided.performance_obligation_id ?? "contract-level";
    console.log(`  \x1b[32m✓\x1b[0m proposed → approved  \x1b[1m${decided.judgment_type}\x1b[0m (${poLabel})  \x1b[2m${decided.ai_proposed_conclusion.value}\x1b[0m`);
  }

  console.log(`\n\x1b[1mSSP allocation\x1b[0m (relative SSP):`);
  for (const a of allocations) {
    const po = contract.performance_obligations.find((p) => p.id === a.po_id)!;
    console.log(`  ${po.description}\n     SSP $${a.ssp.toLocaleString()} → allocated \x1b[1m$${a.allocated.toLocaleString()}\x1b[0m`);
  }

  console.log(`\n\x1b[1mRecognition schedules\x1b[0m:`);
  for (const s of schedules) {
    const po = contract.performance_obligations.find((p) => p.id === s.po_id)!;
    if (s.lines.length > 0) {
      const per = s.lines[0]!.amount;
      const total = s.lines.reduce((acc, l) => acc + l.amount, 0);
      console.log(`  ${po.description}\n     $${per.toLocaleString()}/mo × ${s.lines.length} (${s.lines[0]!.period}–${s.lines[s.lines.length - 1]!.period}), total $${total.toLocaleString()}`);
    } else {
      console.log(`  ${po.description}`);
    }
    for (const f of s.flags) console.log(`     \x1b[33m⚠ ${f}\x1b[0m`);
  }

  const memo = renderMemo({ contract, judgments: approved, allocations, schedules });
  const outDir = join(__dirname, "..", "out");
  mkdirSync(outDir, { recursive: true });
  const memoPath = join(outDir, `${contract.id}_memo.md`);
  writeFileSync(memoPath, memo, "utf8");

  console.log("\n\x1b[90m" + "─".repeat(72) + "\x1b[0m");
  console.log(`\x1b[1mLedger:\x1b[0m ${store.all().length} judgment rows (${store.approved().length} current-approved, rest superseded for the audit trail)`);
  console.log(`\x1b[1mMemo:\x1b[0m written to ${memoPath}`);
  console.log("\x1b[90m" + "─".repeat(72) + "\x1b[0m\n");
  console.log(memo);
}

// Only run main() when invoked directly (not when imported by the persist script).
if (process.argv[1] && process.argv[1].endsWith("run.ts")) {
  main().catch((err) => { console.error(err); process.exitCode = 1; });
}
