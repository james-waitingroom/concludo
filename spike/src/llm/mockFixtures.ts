/**
 * Hand-authored mock extractions so the pipeline (validation, diff, escalation gate, report) is
 * fully exercisable with NO API key. Fixtures exist for the three gate contracts:
 *   - 1  (Meridian)  — clean baseline, no conflicts
 *   - 12 (Piermont)  — three-way seat-count mismatch, resolved by a precedence clause (flag + resolve)
 *   - 15 (Fenwick)   — adversarial: internal contradictions / illegible / missing → BLOCKING escalation
 * Every other contract returns a STUB that the report flags as "run with a key for real extraction".
 *
 * These are illustrative of the *expected* extraction, curated from the gold answer keys — they are
 * how we prove the harness works before a real model is wired in.
 */
import type { ExtractedContract, Confidence } from "../schema.js";

const STUB_MARKER = "__STUB__";

/** Terse provenanced-fact helper for authoring fixtures. */
function pv<T>(value: T, clause: string, quote: string, confidence: Confidence = "high") {
  return { value, source: { clause, quote }, confidence };
}

const meridian: ExtractedContract = {
  customer: pv("Meridian Health Systems, Inc.", "Preamble", "and Meridian Health Systems, Inc. (\"Customer\")"),
  effective_date: pv("March 3, 2025", "Preamble", "entered into as of March 3, 2025 (\"Effective Date\")"),
  term_start: pv("April 1, 2025", "Section 2", "commencing on April 1, 2025"),
  term_end: pv("March 31, 2028", "Section 2", "ending March 31, 2028"),
  term_months: pv(36, "Section 2", "thirty-six (36) months"),
  renewal_terms: pv(
    "Auto-renews for successive 12-month periods; 60 days' written non-renewal notice",
    "Section 2",
    "automatically renew for successive twelve (12) month periods",
  ),
  line_items: [
    {
      description: pv("Platform Subscription — Pro Tier (per-seat annual license)", "Exhibit A", "Platform Subscription — Pro Tier"),
      quantity: pv(250, "Exhibit A", "250 seats"),
      unit_price: pv(480, "Exhibit A", "$480/seat"),
      annual_total: pv(120000, "Exhibit A", "$120,000"),
    },
  ],
  annual_fee: pv(120000, "Exhibit A", "Total Annual Fee: $120,000"),
  tcv: pv(360000, "Exhibit A", "Total Contract Value (3-year term): $360,000"),
  termination_terms: pv(
    "90 days' convenience notice; prepaid non-refundable on customer-initiated termination; pro-rata refund only on Kestrel uncured breach",
    "Section 4",
    "Either party may terminate this Agreement for convenience upon ninety (90) days' written notice.",
  ),
  billing_basis: "advance",
  billing_schedule: [
    { due_date: pv("March 3, 2025 (at signing)", "Exhibit A", "$120,000 due at signing"), amount: pv(120000, "Exhibit A", "$120,000 due at signing"), description: "Year 1 (Apr 1, 2025–Mar 31, 2026)", basis: "advance", estimated: false },
    { due_date: pv("April 1, 2026", "Exhibit A", "$120,000 due Apr 1, 2026"), amount: pv(120000, "Exhibit A", "$120,000 due Apr 1, 2026"), description: "Year 2", basis: "advance", estimated: false },
    { due_date: pv("April 1, 2027", "Exhibit A", "$120,000 due Apr 1, 2027"), amount: pv(120000, "Exhibit A", "$120,000 due Apr 1, 2027"), description: "Year 3", basis: "advance", estimated: false },
  ],
  variable_consideration_notes: [],
  precedence_clause: null,
  secondary_source_note: "Sales comp reference (internal, not part of executed contract): AE D. Alvarez, new logo.",
  commission: {
    payee: pv("D. Alvarez", "Sales Comp Reference", "AE: D. Alvarez"),
    rate_pct: pv(8, "Sales Comp Reference", "8% of TCV"),
    amount: pv(28800, "Sales Comp Reference", "8% of TCV = $28,800"),
    payment_schedule: pv("50% at signing, 50% at 12-month anniversary (Apr 1, 2026)", "Sales Comp Reference", "50% ($14,400) at signing, 50% ($14,400) at 12-month anniversary"),
    basis_note: "new logo, 8% of TCV",
  },
  extraction_conflicts: [],
  extractor_notes: null,
};

const piermont: ExtractedContract = {
  customer: pv("Piermont Analytics, Inc.", "Preamble", "and Piermont Analytics, Inc. (\"Customer\")"),
  effective_date: pv("February 6, 2026", "Preamble", "entered into as of February 6, 2026"),
  term_start: pv("March 1, 2026", "Section 2", "commencing March 1, 2026"),
  term_end: null,
  term_months: pv(36, "Section 2", "thirty-six (36) months"),
  renewal_terms: null,
  line_items: [
    {
      description: pv("Platform Subscription — Pro Tier (per-seat annual license)", "Exhibit A", "Platform Subscription — Pro Tier"),
      quantity: pv(310, "Exhibit A", "310 seats"),
      unit_price: pv(500, "Exhibit A", "$500/seat"),
      annual_total: pv(155000, "Exhibit A", "$155,000"),
    },
  ],
  annual_fee: pv(155000, "Exhibit A", "Total Annual Fee: $155,000"),
  tcv: pv(465000, "Exhibit A", "Total Contract Value (3-year term): $465,000"),
  termination_terms: pv("90-day termination for convenience; prepaid fees non-refundable", "Section 4", "Standard 90-day termination for convenience; prepaid fees non-refundable."),
  billing_basis: "advance",
  billing_schedule: [],
  variable_consideration_notes: [],
  precedence_clause: pv(
    "In the event of conflict between the body of this Agreement and Exhibit A, Exhibit A shall control as to fees and quantities",
    "Preamble / Section 1",
    "the terms of Exhibit A shall control as to fees and quantities",
  ),
  secondary_source_note:
    "CRM Opportunity LG-OPP-88213 (last updated Feb 6, 2026, before final Order Form): 275 seats, $137,500 annual, $412,500 TCV. STALE — predates the Feb 9 controlling Order Form; must not be used for commission.",
  commission: {
    payee: pv("J. Whitfield", "Sales Comp Reference", "AE: J. Whitfield"),
    rate_pct: pv(8, "Sales Comp Reference", "8% × $465,000"),
    amount: pv(37200, "Sales Comp Reference", "8% × $465,000 = $37,200"),
    payment_schedule: pv("50% at signing, 50% at 12-month anniversary", "Sales Comp Reference", "50% at signing / 50% at 12-month anniversary"),
    basis_note: "computed on actual executed TCV $465,000, NOT the stale CRM $412,500",
  },
  extraction_conflicts: [
    {
      field: "seat_count",
      kind: "source_mismatch",
      description:
        "Three different seat counts appear: MSA body ~275 (anticipated), Order Form 310 (controlling), CRM 275 (stale). Precedence clause resolves to 310; all three surfaced for human visibility.",
      competing_values: ["275 (MSA body, anticipated)", "310 (Order Form, controlling)", "275 (CRM record, stale)"],
      blocking: false,
    },
    {
      field: "tcv_commission_basis",
      kind: "source_mismatch",
      description: "CRM TCV ($412,500) disagrees with executed Order Form TCV ($465,000). Executed contract controls; CRM is stale (updated before the Order Form).",
      competing_values: ["$465,000 (Order Form, controlling)", "$412,500 (CRM, stale)"],
      blocking: false,
    },
  ],
  extractor_notes:
    "Order Form (Exhibit A) executed Feb 9, 2026 — three days after the MSA (Feb 6). Precedence clause applied to resolve fees/quantities in favor of Exhibit A.",
};

const fenwick: ExtractedContract = {
  customer: pv("Fenwick & Vale Purchasing Co-Op", "Preamble", "and Fenwick & Vale Purchasing Co-Op (\"Customer\")"),
  effective_date: pv("May 2025 (day illegible)", "Preamble", "this ____ day of May 2025 (handwritten correction)", "low"),
  term_start: null,
  term_end: null,
  term_months: null,
  renewal_terms: null,
  line_items: [
    {
      description: pv("Platform Subscription (Standard Tier)", "Schedule 1", "Platform Subscription: 195 seats @ $425/seat/annum", "low"),
      quantity: pv(195, "Schedule 1", "195 seats", "low"),
      unit_price: pv(425, "Schedule 1", "$425/seat/annum"),
      annual_total: pv(82875, "Schedule 1", "= $82,875 per year"),
    },
  ],
  annual_fee: pv(82875, "Schedule 1", "Total Year 1 Fee: $82,875"),
  tcv: null,
  termination_terms: null,
  billing_basis: null,
  billing_schedule: [],
  variable_consideration_notes: [],
  precedence_clause: null,
  secondary_source_note:
    "Forwarded sales email claims '36 months, 195 seats' was the real deal, but says a corrected term must be documented via a separate confirmation email that is not yet countersigned. Supplementary context only — NOT authoritative extraction input.",
  commission: {
    payee: pv("T. Osei", "Sales Comp Reference", "AE: T. Osei"),
    rate_pct: null,
    amount: null,
    payment_schedule: null,
    basis_note: "PENDING — commission must not be finalized until the term-length/TCV conflict is resolved (per the contract's own internal note).",
  },
  extraction_conflicts: [
    {
      field: "term_months",
      kind: "internal_contradiction",
      description: "Section 1 states 24 months; Section 8 (Renewal) references 'the initial 36-month term'. No amendment reconciles them in the executed document.",
      competing_values: ["24 months (Section 1)", "36 months (Section 8, Renewal)"],
      blocking: true,
    },
    {
      field: "tcv",
      kind: "internal_contradiction",
      description: "TCV cannot be computed: the unresolved 24-vs-36-month term drives two different TCVs. System must not auto-generate a definitive TCV.",
      competing_values: ["$165,750 (24 months)", "$248,625 (36 months)"],
      blocking: true,
    },
    {
      field: "renewal_notice_period",
      kind: "missing_required",
      description: "Auto-renewal notice period left blank in the original; no notice period stated anywhere. Must not assume a default (e.g. 60 days).",
      competing_values: [],
      blocking: false,
    },
    {
      field: "termination_refund",
      kind: "illegible",
      description: "Section 4 termination refund carve-out is cut off / obscured (coffee stain per customer cover email). Source text unreadable.",
      competing_values: [],
      blocking: false,
    },
    {
      field: "seat_count",
      kind: "ambiguous_value",
      description: "Section 5 gives a range (180–220); Schedule 1 gives 195; a handwritten margin note confirms 195 but is 'pending' a never-completed document update. Extracted 195 at low confidence.",
      competing_values: ["180–220 (Section 5, range)", "195 (Schedule 1 + pending handwritten note)"],
      blocking: false,
    },
    {
      field: "signature_date",
      kind: "illegible",
      description: "Kestrel signatory date partially illegible ('5/1_/2025'); signatory title field left blank.",
      competing_values: [],
      blocking: false,
    },
  ],
  extractor_notes:
    "Adversarial document. Do NOT proceed into the judgment engine — multiple blocking conflicts. Forwarded sales email is not part of the executed contract and was not used to resolve the term.",
};

const FIXTURES: Record<number, ExtractedContract> = {
  1: meridian,
  12: piermont,
  15: fenwick,
};

/** A clearly-marked stub for contracts without a hand-authored fixture. */
function stub(): ExtractedContract {
  return {
    customer: null,
    effective_date: null,
    term_start: null,
    term_end: null,
    term_months: null,
    renewal_terms: null,
    line_items: [],
    annual_fee: null,
    tcv: null,
    termination_terms: null,
    billing_basis: null,
    billing_schedule: [],
    variable_consideration_notes: [],
    precedence_clause: null,
    secondary_source_note: null,
    commission: null,
    extraction_conflicts: [],
    extractor_notes: STUB_MARKER,
  };
}

export function isStub(x: ExtractedContract): boolean {
  return x.extractor_notes === STUB_MARKER;
}

export function mockExtraction(contractId: number): ExtractedContract {
  return FIXTURES[contractId] ?? stub();
}
