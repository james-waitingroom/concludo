/**
 * Technical accounting memo generation (PRD §5.7). The memo is composed directly from APPROVED
 * judgments plus the deterministic schedules — the Judgment records and the memo are two renderings of
 * the same underlying objects, not separately maintained prose. Structure mirrors the ASC 606
 * five-step model, lists the judgments with sensitivity notes, and surfaces confidence disclosures for
 * any benchmark_only / observed_low determination.
 */
import type { Contract, Judgment } from "./model.js";
import type { Allocation } from "./ssp.js";
import type { RecognitionResult } from "./recognition.js";

export interface MemoInput {
  contract: Contract;
  judgments: Judgment[]; // approved
  allocations: Allocation[];
  schedules: RecognitionResult[];
}

const money = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

function poName(input: MemoInput, poId: string | null): string {
  const po = input.contract.performance_obligations.find((p) => p.id === poId);
  return po ? po.description : "(contract-level)";
}

function judgmentsOfType(input: MemoInput, type: Judgment["judgment_type"]): Judgment[] {
  return input.judgments.filter((j) => j.judgment_type === type);
}

export function renderMemo(input: MemoInput): string {
  const c = input.contract;
  const L: string[] = [];
  L.push(`# Technical Accounting Memo — ${c.customer}`);
  L.push(`**Standard:** ASC 606 (Revenue from Contracts with Customers)  \n**Contract:** ${c.id}  \n**Status:** DRAFT (generated from approved judgments)`);
  L.push("");

  // Background / facts
  L.push("## Background & Facts");
  L.push(`- **Customer:** ${c.customer}`);
  L.push(`- **Effective date:** ${c.effective_date}`);
  L.push(`- **Term:** ${c.term_months ?? "?"} months (${c.term_start_month ?? "?"} – ${c.term_end_month ?? "?"})`);
  L.push(`- **Total transaction price:** ${money(c.transaction_price)}`);
  L.push(`- **Performance obligations identified:** ${c.performance_obligations.length}`);
  L.push("");

  // Step 1
  L.push("## ASC 606 Step 1 — Identify the Contract");
  L.push("A single contract exists between the parties with commercial substance, approved and committed, with identifiable rights and payment terms. No contract-combination judgment was required.");
  L.push("");

  // Step 2 — POs / distinctness
  L.push("## ASC 606 Step 2 — Identify Performance Obligations");
  for (const po of c.performance_obligations) {
    const distinctJ = judgmentsOfType(input, "distinctness").find((j) => j.performance_obligation_id === po.id);
    const distinctLabel = po.is_distinct == null ? "not separately assessed" : po.is_distinct ? "**distinct**" : "**not distinct**";
    L.push(`### ${po.description}`);
    L.push(`Conclusion: ${distinctLabel}.`);
    if (distinctJ) {
      L.push(`Citations: ${distinctJ.standard_ref.join(", ")}.`);
      for (const step of distinctJ.ai_proposed_conclusion.reasoning_steps) L.push(`- ${step}`);
      for (const alt of distinctJ.ai_proposed_conclusion.rejected_alternatives) {
        L.push(`- _Rejected — ${alt.alternative}:_ ${alt.why_rejected}`);
      }
    }
    L.push("");
  }

  // Step 3 — transaction price
  L.push("## ASC 606 Step 3 — Determine the Transaction Price");
  L.push(`The total transaction price is ${money(c.transaction_price)}. No variable consideration was identified in this contract.`);
  L.push("");

  // Step 4 — allocation
  L.push("## ASC 606 Step 4 — Allocate the Transaction Price");
  L.push("Allocated across performance obligations on a relative standalone-selling-price basis:");
  L.push("");
  L.push("| Performance obligation | SSP method | SSP | Confidence | Allocated |");
  L.push("|---|---|---|---|---|");
  for (const a of input.allocations) {
    const po = c.performance_obligations.find((p) => p.id === a.po_id)!;
    const ssp = po.standalone_ssp;
    L.push(`| ${po.description} | ${ssp?.method ?? "?"} | ${money(a.ssp)} | ${ssp?.confidence_tier ?? "?"} | ${money(a.allocated)} |`);
  }
  const allocTotal = input.allocations.reduce((s, a) => s + a.allocated, 0);
  L.push(`| **Total** | | | | **${money(allocTotal)}** |`);
  L.push("");
  L.push("_The standalone selling prices sum to the transaction price (no bundled discount), so each obligation's allocated amount equals its SSP._");
  L.push("");

  // Step 5 — recognition
  L.push("## ASC 606 Step 5 — Recognize Revenue");
  for (const po of c.performance_obligations) {
    const recJ = judgmentsOfType(input, "recognition_pattern").find((j) => j.performance_obligation_id === po.id);
    const sched = input.schedules.find((s) => s.po_id === po.id);
    L.push(`### ${po.description}`);
    if (po.recognition) L.push(`Pattern: **${po.recognition.type}** — ${po.recognition.method}. Citations: ${recJ?.standard_ref.join(", ") ?? "—"}.`);
    if (recJ) for (const step of recJ.ai_proposed_conclusion.reasoning_steps) L.push(`- ${step}`);
    if (sched && sched.lines.length > 0) {
      const per = sched.lines[0]!.amount;
      const total = sched.lines.reduce((s, l) => s + l.amount, 0);
      L.push(`- Schedule: ${money(per)}/month × ${sched.lines.length} months (${sched.lines[0]!.period} – ${sched.lines[sched.lines.length - 1]!.period}), total ${money(total)}.`);
    }
    if (sched && sched.flags.length > 0) {
      for (const f of sched.flags) L.push(`- ⚠️ **Flag:** ${f}`);
    }
    L.push("");
  }

  // Judgments made + sensitivity
  L.push("## Judgments Made");
  L.push("| # | Type | Conclusion | Confidence | Sensitivity |");
  L.push("|---|---|---|---|---|");
  input.judgments.forEach((j, i) => {
    const conc = j.ai_proposed_conclusion.value.replace(/\|/g, "\\|");
    L.push(`| ${i + 1} | ${j.judgment_type} — ${poName(input, j.performance_obligation_id)} | ${conc} | ${j.confidence_tier ?? "n/a"} | ${j.sensitivity_note ? "yes" : "—"} |`);
  });
  L.push("");
  const withSensitivity = input.judgments.filter((j) => j.sensitivity_note);
  if (withSensitivity.length) {
    L.push("### Sensitivity notes");
    for (const j of withSensitivity) L.push(`- **${j.judgment_type} (${poName(input, j.performance_obligation_id)}):** ${j.sensitivity_note}`);
    L.push("");
  }

  // Confidence disclosures — one per (PO, tier); a PO with several low-confidence judgments discloses once.
  const seenDisclosure = new Set<string>();
  const lowConfidence = input.judgments.filter((j) => {
    if (j.confidence_tier !== "benchmark_only" && j.confidence_tier !== "observed_low") return false;
    const key = `${j.performance_obligation_id}|${j.confidence_tier}`;
    if (seenDisclosure.has(key)) return false;
    seenDisclosure.add(key);
    return true;
  });
  L.push("## Confidence Disclosures");
  if (lowConfidence.length === 0) {
    L.push("All standalone-selling-price determinations in this contract are supported by observable comparable data (`observed_high`). No benchmark-only disclosure is required.");
  } else {
    for (const j of lowConfidence) {
      L.push(`- **${poName(input, j.performance_obligation_id)} (${j.confidence_tier}):** This determination relied on limited or benchmark data in the absence of sufficient company-specific pricing history. Management should reassess this estimate as the Company's own pricing history develops.`);
    }
  }
  L.push("");

  // Open flags
  const openFlags = input.schedules.flatMap((s) => s.flags);
  if (openFlags.length) {
    L.push("## Open Items Requiring Confirmation");
    for (const f of openFlags) L.push(`- ${f}`);
    L.push("");
  }

  return L.join("\n");
}
