/**
 * Extraction schema for the Concludo spike.
 *
 * PRD §2.1 (Provenance on every extracted fact) and §7 closing note demand that provenance +
 * confidence live in the very first extraction function — "inexpensive now, expensive to retrofit".
 * So every atomic fact is wrapped as `Provenanced<T>`: the value plus where it came from plus how
 * sure we are. Escalation (PRD §2.6) is a first-class output, not an exception: `extraction_conflicts`
 * captures contradictions/illegibility/missing-required so the pipeline can refuse to guess.
 *
 * This is spike code. The shapes here are deliberately lightweight — enough to learn where real
 * extraction breaks, not the eventual product schema.
 */
import { z } from "zod";

/** Self-reported reliability of a single extracted fact. */
export const Confidence = z.enum(["high", "medium", "low"]);
export type Confidence = z.infer<typeof Confidence>;

/**
 * Where a fact came from. Source docs are markdown (not paginated), so `page` is optional; `clause`
 * is the section/heading label and `quote` is the verbatim supporting span. `quote` is required —
 * a fact with no quotable source is exactly what PRD §2.1 forbids.
 */
export const SourceRef = z.object({
  clause: z.string().describe("Section/heading/label where the fact appears, e.g. 'Section 2' or 'Exhibit A'."),
  quote: z.string().describe("Verbatim text span from the document that supports this value."),
  page: z.number().int().positive().nullable().optional(),
});
export type SourceRef = z.infer<typeof SourceRef>;

/** Wrap any value schema as a provenanced fact: { value, source, confidence }. */
export function provenanced<T extends z.ZodTypeAny>(value: T) {
  return z.object({
    value,
    source: SourceRef,
    confidence: Confidence,
  });
}

/** A single contract-derived scheduled invoice (PRD §5.9 BillingSchedule.scheduled_invoices). */
export const ScheduledInvoice = z.object({
  due_date: provenanced(z.string()).describe("When this invoice is due, as stated in the contract."),
  amount: provenanced(z.number().nullable()),
  description: z.string(),
  basis: z.enum(["advance", "arrears", "milestone", "usage_actual", "hybrid"]),
  estimated: z.boolean().describe("True for usage-based/estimated entries that are not yet fixed."),
});

/** A single Order Form / fee-schedule line item. */
export const LineItem = z.object({
  description: provenanced(z.string()),
  // Inner value may be null (e.g. usage-based lines have no fixed quantity/unit price), and the whole
  // field may be null. Both representations are accepted so the model can't produce a schema error.
  quantity: provenanced(z.number().nullable()).nullable(),
  unit_price: provenanced(z.number().nullable()).nullable(),
  annual_total: provenanced(z.number().nullable()).nullable(),
});

/** Commission fact pattern for the ASC 340-40 chain (extraction only — no judgment here). */
export const Commission = z.object({
  payee: provenanced(z.string()).nullable(),
  rate_pct: provenanced(z.number().nullable()).nullable(),
  amount: provenanced(z.number().nullable()).nullable(),
  payment_schedule: provenanced(z.string()).nullable(),
  basis_note: z.string().nullable().describe("e.g. 'new logo 8% of TCV' or 'pending resolution of TCV'."),
});

/**
 * A detected conflict / gap that must escalate rather than be silently resolved (PRD §2.6, §5.1).
 * `blocking: true` means the contract must NOT proceed into the judgment engine.
 */
export const ExtractionConflict = z.object({
  field: z.string().describe("Which fact or area the conflict concerns, e.g. 'term_length'."),
  kind: z.enum([
    "internal_contradiction",   // two contract sections disagree, no resolving amendment
    "source_mismatch",          // primary contract vs. secondary/CRM disagree
    "missing_required",         // a required field is absent/blank
    "illegible",                // source text obscured/cut off/unreadable
    "ambiguous_value",          // a range or unresolved annotation instead of a fixed value
  ]),
  description: z.string(),
  competing_values: z.array(z.string()).describe("The distinct candidate values in play, if any."),
  blocking: z.boolean().describe("True if this conflict must halt progression into the judgment engine."),
});
export type ExtractionConflict = z.infer<typeof ExtractionConflict>;

/**
 * The full extracted fact set for one contract. Optional/nullable throughout: the adversarial
 * contract (15) is *supposed* to leave fields null and populate conflicts instead.
 */
export const ExtractedContract = z.object({
  customer: provenanced(z.string()).nullable(),
  effective_date: provenanced(z.string()).nullable(),
  term_start: provenanced(z.string()).nullable(),
  term_end: provenanced(z.string()).nullable(),
  term_months: provenanced(z.number()).nullable(),
  renewal_terms: provenanced(z.string()).nullable(),

  // .catch([]) on array fields: newer models occasionally emit an array field as a stringified value
  // or the wrong shape. Coerce to an empty array rather than throwing away the whole extraction.
  line_items: z.array(LineItem).catch([]),
  annual_fee: provenanced(z.number()).nullable(),
  tcv: provenanced(z.number()).nullable(),

  termination_terms: provenanced(z.string()).nullable(),
  // .catch(null): newer models sometimes emit an enum value wrapped in literal quotes ("\"hybrid\"");
  // rather than fail the whole extraction on that JSON-escaping quirk, coerce an unrecognized value to null.
  billing_basis: z.enum(["advance", "arrears", "milestone", "usage_actual", "hybrid"]).nullable().catch(null),
  billing_schedule: z.array(ScheduledInvoice).catch([]),

  /** Notes on any consideration that may be variable (usage fees, rebates, refundable rights). */
  variable_consideration_notes: z.array(z.string()).catch([]),

  /** A precedence clause the contract states for resolving conflicts (PRD §5.1, Contract 12). */
  precedence_clause: provenanced(z.string()).nullable(),

  /** Secondary/CRM source facts, kept separate — never silently preferred over the contract. */
  secondary_source_note: z.string().nullable(),

  commission: Commission.nullable(),

  extraction_conflicts: z.array(ExtractionConflict).catch([]),

  /** Free-text summary of what the extractor was unsure about. Useful spike signal. */
  extractor_notes: z.string().nullable().optional(),
});
export type ExtractedContract = z.infer<typeof ExtractedContract>;
