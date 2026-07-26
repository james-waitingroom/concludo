/**
 * Deterministic validation pass — PRD §5.1 stage 3 and §2.3 ("deterministic math never runs through
 * the LLM"). This is plain, testable code that does NOT call a model. It:
 *   - recomputes line-item totals vs. the stated annual fee,
 *   - checks that term_months is consistent with term_start/term_end,
 *   - checks required fields are present,
 *   - folds in the model's own extraction_conflicts,
 * and decides whether the contract must ESCALATE (blocking) before reaching the judgment engine.
 *
 * A `warn` never blocks; a `fail` on a critical check, or any blocking conflict, sets `blocking`.
 */
import type { ExtractedContract, ExtractionConflict } from "./schema.js";

export type CheckStatus = "pass" | "fail" | "warn" | "skip";

export interface Check {
  name: string;
  status: CheckStatus;
  detail: string;
}

export interface ValidationResult {
  checks: Check[];
  /** Conflicts surfaced by the extractor plus any this pass derived. */
  conflicts: ExtractionConflict[];
  /** True if the contract must not proceed into the judgment engine without human resolution. */
  blocking: boolean;
}

const MONEY_TOLERANCE = 0.5; // dollars

/** Parse dates like "April 1, 2025". Returns null if unparseable. */
function parseDate(s: string | null | undefined): Date | null {
  if (!s) return null;
  // Grab a "Month Day, Year" or "Month Year" chunk out of possibly-annotated text.
  const m = /([A-Za-z]+)\s+(\d{1,2},\s*)?(\d{4})/.exec(s);
  if (!m) return null;
  const d = new Date(`${m[1]} ${m[2] ?? "1, "}${m[3]}`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function monthsBetween(a: Date, b: Date): number {
  return (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
}

export function validate(x: ExtractedContract): ValidationResult {
  const checks: Check[] = [];
  const conflicts: ExtractionConflict[] = [...x.extraction_conflicts];

  // --- Required fields -------------------------------------------------------------------------
  // annual_fee is intentionally NOT required: bundle-priced, multi-PO, and commission-only documents
  // legitimately have no single annual fee. It's used opportunistically in the math checks below.
  const required: Array<[string, unknown]> = [
    ["customer", x.customer],
    ["effective_date", x.effective_date],
  ];
  for (const [name, val] of required) {
    checks.push(
      val == null
        ? { name: `required:${name}`, status: "fail", detail: `Missing required field '${name}'.` }
        : { name: `required:${name}`, status: "pass", detail: "present" },
    );
  }

  // --- Line items sum to annual fee ------------------------------------------------------------
  if (x.annual_fee != null && x.line_items.length > 0) {
    const summable = x.line_items.every((li) => li.annual_total?.value != null);
    if (summable) {
      const sum = x.line_items.reduce((acc, li) => acc + (li.annual_total!.value ?? 0), 0);
      const diff = Math.abs(sum - x.annual_fee.value);
      checks.push(
        diff <= MONEY_TOLERANCE
          ? { name: "math:line_items_sum", status: "pass", detail: `Line items sum to stated annual fee ($${sum.toLocaleString()}).` }
          : { name: "math:line_items_sum", status: "fail", detail: `Line items sum to $${sum.toLocaleString()} but annual fee is $${x.annual_fee.value.toLocaleString()} (Δ $${diff.toLocaleString()}).` },
      );
    } else {
      checks.push({ name: "math:line_items_sum", status: "skip", detail: "Some line items missing annual_total." });
    }
  } else {
    checks.push({ name: "math:line_items_sum", status: "skip", detail: "No annual fee or no line items to reconcile." });
  }

  // --- Quantity × unit price = line total (per item) -------------------------------------------
  for (const [i, li] of x.line_items.entries()) {
    const q = li.quantity?.value, u = li.unit_price?.value, t = li.annual_total?.value;
    if (q != null && u != null && t != null) {
      const diff = Math.abs(q * u - t);
      checks.push(
        diff <= MONEY_TOLERANCE
          ? { name: `math:line_item[${i}]`, status: "pass", detail: `${q} × $${u} = $${t.toLocaleString()}.` }
          : { name: `math:line_item[${i}]`, status: "warn", detail: `${q} × $${u} = $${(q * u).toLocaleString()} ≠ stated $${t.toLocaleString()}.` },
      );
    }
  }

  // --- Term consistency: months vs start/end dates ---------------------------------------------
  const start = parseDate(x.term_start?.value ?? null);
  const end = parseDate(x.term_end?.value ?? null);
  const months = x.term_months?.value ?? null;
  if (start && end && months != null) {
    const computed = monthsBetween(start, end);
    // end date is typically the last day of the final month, so allow ±1.
    const ok = Math.abs(computed + 1 - months) <= 1 || Math.abs(computed - months) <= 1;
    checks.push(
      ok
        ? { name: "dates:term_consistency", status: "pass", detail: `Stated ${months} months is consistent with ${x.term_start!.value} → ${x.term_end!.value}.` }
        : { name: "dates:term_consistency", status: "fail", detail: `Stated ${months} months but dates span ~${computed + 1} months.` },
    );
  } else {
    checks.push({ name: "dates:term_consistency", status: "skip", detail: "Insufficient term data to check (may itself be flagged as a conflict)." });
  }

  // --- TCV plausibility: annual_fee × years ≈ tcv (advance-billed, single-rate case) ------------
  if (x.annual_fee != null && x.tcv != null && months != null && months % 12 === 0) {
    const years = months / 12;
    const expected = x.annual_fee.value * years;
    const diff = Math.abs(expected - x.tcv.value);
    // Only a warn: multi-PO / deferred-start / ramped contracts legitimately break this.
    checks.push(
      diff <= MONEY_TOLERANCE
        ? { name: "math:tcv_vs_annual", status: "pass", detail: `TCV $${x.tcv.value.toLocaleString()} = annual × ${years}yr.` }
        : { name: "math:tcv_vs_annual", status: "warn", detail: `TCV $${x.tcv.value.toLocaleString()} ≠ annual × ${years}yr ($${expected.toLocaleString()}) — expected for multi-PO/deferred/ramped contracts.` },
    );
  }

  // --- Escalation decision ---------------------------------------------------------------------
  const criticalFail = checks.some((c) => c.status === "fail");
  const blockingConflict = conflicts.some((c) => c.blocking);
  const blocking = blockingConflict;

  if (criticalFail && !blockingConflict) {
    // A hard validation failure with no explicit blocking conflict still deserves surfacing.
    checks.push({ name: "escalation", status: "warn", detail: "Validation failures present; route to human confirmation before judgment." });
  }

  return { checks, conflicts, blocking };
}
