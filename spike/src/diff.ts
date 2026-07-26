/**
 * Diff harness: compare an extraction against the curated expectations and the validation result,
 * and render a verdict. This encodes the PRD's pass/fail gate (Section 8):
 *   - contracts 1–11, 13–14: extract the right facts and DON'T escalate;
 *   - contract 12: surface the conflict AND resolve it via the precedence clause (flag_and_resolve);
 *   - contract 15: BLOCK rather than guess, and don't fabricate TCV/term.
 */
import type { ExtractedContract } from "./schema.js";
import { isStub } from "./llm/mockFixtures.js";
import type { Expectation } from "./expectations.js";
import type { ValidationResult } from "./validate.js";

export type Verdict = "PASS" | "FAIL" | "STUB";

export interface FieldDiff {
  field: string;
  expected: string;
  got: string;
  match: boolean;
}

export interface DiffResult {
  id: number;
  verdict: Verdict;
  escalationExpected: Expectation["escalation"];
  blocking: boolean;
  conflictCount: number;
  fields: FieldDiff[];
  issues: string[]; // reasons a FAIL occurred, or noteworthy warnings
}

const MONEY_TOLERANCE = 0.5;

function normStr(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

/** Loose string match: equal after normalization, or one contains the other (handles "Inc." etc.). */
function strMatch(expected: string, got: string): boolean {
  const a = normStr(expected), b = normStr(got);
  return a === b || a.includes(b) || b.includes(a);
}

/** Timezone-safe y/m/d extraction. Bare ISO dates (YYYY-MM-DD) are read from the string directly —
 *  never via `new Date()`, which would parse them as UTC and shift the day in a non-UTC timezone. */
function ymd(s: string): { y: number; m: number; d: number } | null {
  const clean = s.replace(/\(.*?\)/g, "").trim();
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(clean);
  if (iso) return { y: +iso[1]!, m: +iso[2]!, d: +iso[3]! };
  const dt = new Date(clean); // "March 3, 2025" etc. — parsed in local time, no offset ambiguity
  if (Number.isNaN(dt.getTime())) return null;
  return { y: dt.getFullYear(), m: dt.getMonth() + 1, d: dt.getDate() };
}

function dateMatch(expected: string, got: string): boolean {
  const de = ymd(expected), dg = ymd(got);
  if (de && dg) return de.y === dg.y && de.m === dg.m && de.d === dg.d;
  return strMatch(expected, got);
}

/** Pull the comparable primitive for a field out of the extraction (unwrapping provenance). */
function extractedValue(x: ExtractedContract, field: string): number | string | null {
  switch (field) {
    case "customer": return x.customer?.value ?? null;
    case "effective_date": return x.effective_date?.value ?? null;
    case "term_start": return x.term_start?.value ?? null;
    case "term_end": return x.term_end?.value ?? null;
    case "term_months": return x.term_months?.value ?? null;
    case "annual_fee": return x.annual_fee?.value ?? null;
    case "tcv": return x.tcv?.value ?? null;
    default: return null;
  }
}

const DATE_FIELDS = new Set(["effective_date", "term_start", "term_end"]);
const NUMBER_FIELDS = new Set(["term_months", "annual_fee", "tcv"]);

export function diff(
  x: ExtractedContract,
  exp: Expectation,
  validation: ValidationResult,
): DiffResult {
  const issues: string[] = [];
  const fields: FieldDiff[] = [];
  const blocking = validation.blocking;
  const conflictCount = validation.conflicts.length;

  if (isStub(x)) {
    return {
      id: exp.id, verdict: "STUB", escalationExpected: exp.escalation,
      blocking, conflictCount, fields,
      issues: ["No hand-authored fixture — run with ANTHROPIC_API_KEY for real extraction."],
    };
  }

  // --- Field-level comparison against asserted expectations ------------------------------------
  const assertable = ["customer", "effective_date", "term_start", "term_end", "term_months", "annual_fee", "tcv"] as const;
  for (const field of assertable) {
    const expected = (exp as unknown as Record<string, unknown>)[field];
    if (expected == null) continue;
    const got = extractedValue(x, field);
    let match: boolean;
    if (got == null) {
      match = false;
    } else if (NUMBER_FIELDS.has(field)) {
      match = Math.abs(Number(got) - Number(expected)) <= MONEY_TOLERANCE;
    } else if (DATE_FIELDS.has(field)) {
      match = dateMatch(String(expected), String(got));
    } else {
      match = strMatch(String(expected), String(got));
    }
    fields.push({ field, expected: String(expected), got: got == null ? "∅" : String(got), match });
    if (!match) issues.push(`Field '${field}': expected ${JSON.stringify(expected)}, got ${JSON.stringify(got)}.`);
  }

  // --- Fields that MUST be null (no fabrication) -----------------------------------------------
  for (const field of exp.expect_null ?? []) {
    const got = extractedValue(x, field);
    const ok = got == null;
    fields.push({ field: `${field} (must be null)`, expected: "null", got: got == null ? "null" : String(got), match: ok });
    if (!ok) issues.push(`Field '${field}' must NOT be fabricated but got ${JSON.stringify(got)}.`);
  }

  // --- Escalation gate -------------------------------------------------------------------------
  switch (exp.escalation) {
    case "none":
      if (blocking) issues.push("Escalation: BLOCKED but this contract should extract cleanly (no blocking conflict expected).");
      break;
    case "flag_and_resolve":
      if (conflictCount === 0) issues.push("Escalation: expected conflicts to be surfaced (flag_and_resolve) but none were.");
      if (blocking) issues.push("Escalation: BLOCKED, but the precedence clause should RESOLVE this to a controlling value (should not block).");
      break;
    case "blocking":
      if (!blocking) issues.push("Escalation: expected a BLOCKING escalation but the contract was allowed to proceed — this is the 'don't guess' gate.");
      break;
  }

  const fieldFail = fields.some((f) => !f.match);
  const verdict: Verdict = issues.length === 0 && !fieldFail ? "PASS" : "FAIL";
  return { id: exp.id, verdict, escalationExpected: exp.escalation, blocking, conflictCount, fields, issues };
}
