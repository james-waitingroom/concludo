/**
 * Machine-readable expectations for the spike's diff harness — curated from the gold-standard answer
 * keys. This is deliberately NOT a parse of the prose answer keys (that's an NLP task in itself and
 * only meaningful once the judgment engine exists). It encodes the objective, extractable gate fields
 * plus the expected escalation behavior per contract.
 *
 * `escalation`:
 *   - 'none'             normal contract; should extract cleanly, no blocking conflict.
 *   - 'flag_and_resolve' conflicts MUST be surfaced, but the contract's own precedence clause resolves
 *                        them to a definite controlling value (Contract 12). NOT blocking.
 *   - 'blocking'         genuinely unresolvable in the executed document; MUST halt before judgment
 *                        (Contract 15). Certain fields MUST remain null (no fabrication).
 *
 * `expected_pos` is informational only — number of performance obligations is a judgment-layer output
 * (distinctness), not extractable, so the harness displays it but does not gate on it.
 * `partial: true` marks contracts whose expectations are intentionally light (modifications / the
 * commission-focused docs 13–14), so a run doesn't over-report mismatches for fields we don't assert.
 */
export type EscalationMode = "none" | "flag_and_resolve" | "blocking";

export interface Expectation {
  id: number;
  escalation: EscalationMode;
  customer?: string;
  effective_date?: string;
  term_start?: string;
  term_end?: string;
  term_months?: number;
  annual_fee?: number;
  tcv?: number;
  /** Fields that MUST be null (system must not fabricate them). Used by the adversarial contract. */
  expect_null?: Array<"tcv" | "term_months" | "term_start" | "term_end" | "annual_fee">;
  expected_pos?: number;
  partial?: boolean;
  notes?: string;
}

export const EXPECTATIONS: Record<number, Expectation> = {
  1: {
    id: 1, escalation: "none",
    customer: "Meridian Health Systems, Inc.",
    effective_date: "March 3, 2025", term_start: "April 1, 2025", term_end: "March 31, 2028",
    term_months: 36, annual_fee: 120000, tcv: 360000, expected_pos: 1,
    notes: "Baseline/control: single PO, no allocation. Should NOT invent a distinctness judgment.",
  },
  2: {
    id: 2, escalation: "none",
    customer: "Brightwell Logistics, LLC",
    effective_date: "June 14, 2025", term_start: "July 1, 2025", term_end: "June 30, 2028",
    term_months: 36, tcv: 768000, expected_pos: 2,
    notes: "Distinct implementation (positive case); implementation must NOT be recognized at signing.",
  },
  3: {
    id: 3, escalation: "none",
    customer: "Corvus Manufacturing Corp.",
    effective_date: "September 9, 2025", term_months: 36, tcv: 1480000, expected_pos: 1,
    notes: "Non-distinct integration → single combined PO. Milestone billing ≠ recognition. Term starts at Go-Live (TBD).",
  },
  4: {
    id: 4, escalation: "none",
    customer: "Halden Financial Group",
    effective_date: "January 12, 2025", term_start: "February 1, 2025", term_end: "January 31, 2028",
    term_months: 36, tcv: 522000, expected_pos: 2,
    notes: "Deferred-start Premium Support (Years 2–3) — NOT a modification. Two POs, netted at contract level.",
  },
  5: {
    id: 5, escalation: "none",
    customer: "Rivergate Partners LLC",
    effective_date: "April 2, 2025", term_start: "May 1, 2025", term_end: "April 30, 2028",
    term_months: 36, tcv: 937500, expected_pos: 2,
    notes: "Cold-start SSP on Copilot Module → benchmark_only tier (judgment layer).",
  },
  6: {
    id: 6, escalation: "none",
    customer: "Solstice Retail Group, Inc.",
    effective_date: "August 20, 2025", term_start: "September 15, 2025", term_end: "September 14, 2028",
    term_months: 36, tcv: 943020, expected_pos: 3,
    notes: "Residual method w/ negative-residual failure (judgment layer). Extraction should be clean.",
  },
  7: {
    id: 7, escalation: "none",
    customer: "Nordholm Industries AB (US Operations)",
    effective_date: "May 5, 2025", term_start: "June 1, 2025", term_end: "May 31, 2028",
    term_months: 36, expected_pos: 2,
    notes: "Usage fees billed in arrears + retroactive rebate → variable consideration. TCV not fixed (variable).",
  },
  8: {
    id: 8, escalation: "none",
    customer: "Castellan Unified School District",
    effective_date: "October 1, 2025", term_start: "November 1, 2025", term_end: "October 31, 2028",
    term_months: 36, expected_pos: 1,
    notes: "Non-appropriation termination refund → variable consideration (contrast Contract 1). Prorated billing; TCV ~approx.",
  },
  // Amendments carry two legitimate dates — the amendment's signing/execution date and the date the
  // change takes effect — and "effective_date" is genuinely ambiguous between them (the model picks
  // inconsistently across 9/10/11). We don't assert it here; customer + escalation behavior suffice.
  9: {
    id: 9, escalation: "none", partial: true,
    customer: "Brightwell Logistics",
    notes: "Modification A → SEPARATE CONTRACT. Amendment doc; expectations intentionally light.",
  },
  10: {
    id: 10, escalation: "none", partial: true,
    customer: "Corvus Manufacturing",
    notes: "Modification B → TERMINATION + NEW CONTRACT (steep discount, not SSP). Amendment doc.",
  },
  11: {
    id: 11, escalation: "none", partial: true,
    customer: "Halden Financial",
    notes: "Modification C → CUMULATIVE CATCH-UP (non-distinct scope increase). Amendment doc.",
  },
  12: {
    id: 12, escalation: "flag_and_resolve",
    customer: "Piermont Analytics, Inc.",
    effective_date: "February 6, 2026", term_start: "March 1, 2026",
    term_months: 36, annual_fee: 155000, tcv: 465000, expected_pos: 1,
    notes: "Three-way seat mismatch (275/310/275). Precedence clause resolves to 310 → $465k. CRM is stale; must not drive commission.",
  },
  13: {
    id: 13, escalation: "none", partial: true,
    customer: "Meridian Health Systems",
    notes: "ASC 340-40 commission baseline. Contract doc embeds its own expected outcome.",
  },
  14: {
    id: 14, escalation: "none", partial: true,
    customer: "Brightwell Logistics",
    notes: "ASC 340-40 amortization extended beyond initial term (non-commensurate renewal). Embeds own expected outcome.",
  },
  15: {
    id: 15, escalation: "blocking",
    customer: "Fenwick & Vale Purchasing Co-Op",
    expect_null: ["tcv", "term_months"],
    notes: "Adversarial: 24-vs-36-month contradiction, blank notice period, illegible text, range seat count. MUST block, MUST NOT fabricate TCV/term.",
  },
};

export function expectationFor(id: number): Expectation | undefined {
  return EXPECTATIONS[id];
}
