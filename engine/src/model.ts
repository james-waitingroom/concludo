/**
 * Concludo core domain model (PRD Section 4). Step 2 implements only the entities the first judgment
 * chain needs: Company → Contract → PerformanceObligation → Judgment.
 *
 * Two PRD design principles are structural here, not bolted on later:
 *   - Provenance on every extracted fact (§2.1): facts are `Provenanced<T>`.
 *   - Judgments are immutable and versioned, never edited in place (§2.2): a Judgment carries
 *     `supersedes` / `superseded_by` links and a `status`; a reassessment creates a NEW row and marks
 *     the old one `superseded`. See store.ts for the mechanics.
 */

// ---- Provenance (PRD §2.1) --------------------------------------------------------------------
export type Confidence = "high" | "medium" | "low";

export interface Provenance {
  clause: string; // section/heading label, e.g. "Section 3" or "Exhibit A"
  quote: string;  // verbatim supporting text span
}

export interface Provenanced<T> {
  value: T;
  source: Provenance;
  confidence: Confidence;
}

// ---- Confidence tiering for SSP (PRD §5.4) ----------------------------------------------------
export type ConfidenceTier = "observed_high" | "observed_low" | "benchmark_only";

// ---- Judgment (PRD §4.2, the central entity) --------------------------------------------------
export type JudgmentType =
  | "contract_combination"
  | "distinctness"
  | "ssp_method"
  | "recognition_pattern"
  | "variable_consideration"
  | "modification_type"
  | "commission_capitalization"
  | "amortization_period";

export type JudgmentStatus = "proposed" | "under_review" | "approved" | "superseded";

export interface RejectedAlternative {
  alternative: string;
  why_rejected: string; // PRD §2.7: every judgment must show why other treatments were rejected
}

export interface ProposedConclusion {
  value: string;
  reasoning_steps: string[];
  rejected_alternatives: RejectedAlternative[];
}

export interface HumanDecision {
  approved_by: string;
  decision: "accepted" | "overridden";
  override_reason: string | null; // required if overridden
  timestamp: string;
}

export interface Judgment {
  id: string;
  contract_id: string;
  performance_obligation_id: string | null; // null for contract-level judgments
  judgment_type: JudgmentType;
  standard_ref: string[]; // specific ASC citations
  contract_evidence: Provenance[];
  ai_proposed_conclusion: ProposedConclusion;
  /**
   * Machine-consumable form of the conclusion that the deterministic layer applies (e.g.
   * { is_distinct: true } or { method, ssp_value }). The prose lives in ai_proposed_conclusion;
   * this is the typed value code acts on, so math never has to parse reasoning text.
   */
  structured: Record<string, unknown> | null;
  confidence_tier: ConfidenceTier | null;
  sensitivity_note: string | null; // what changes if this had gone the other way
  human_decision: HumanDecision | null;
  status: JudgmentStatus;
  // Immutable-versioning links (never edit in place):
  supersedes: string | null;    // id of the version this replaces
  superseded_by: string | null;  // id of the version that replaced this
  created_at: string;
}

// ---- Performance obligation (PRD §4.2) --------------------------------------------------------
export interface SSP {
  method: "market_assessment" | "cost_plus_margin" | "residual";
  value: number;
  confidence_tier: ConfidenceTier;
  support_refs: Provenance[];
}

export interface RecognitionPattern {
  type: "point_in_time" | "over_time";
  method: string; // e.g. "ratable (straight-line)", "cost-to-cost"
}

export interface PerformanceObligation {
  id: string;
  contract_id: string;
  description: string;
  // Judgment outputs — never raw/assumed fields:
  is_distinct: boolean | null;
  standalone_ssp: SSP | null;         // the standalone selling price for this PO
  allocated_price: number | null;     // derived from relative-SSP allocation across all POs
  recognition: RecognitionPattern | null;
  // Service period for recognition (may differ from the contract term — deferred starts etc.):
  start_month: string | null; // "YYYY-MM"
  end_month: string | null;   // "YYYY-MM" (inclusive); null = duration not yet known
  /**
   * Observable standalone-pricing evidence for this deliverable (the ObservablePriceHistory corpus of
   * PRD §5.4, in note form for now). Load-bearing input to the SSP-method judgment — without it the
   * model cannot know whether comparable data exists.
   */
  observable_pricing: string | null;
  /** Count of comparable standalone observations. The confidence TIER is derived deterministically
   *  from this count (10+ → observed_high, 1–9 → observed_low, 0 → benchmark_only), not classified by
   *  the LLM — tiering from a count is arithmetic, not judgment (PRD §2.3). */
  comparable_count: number | null;
}

// ---- Contract (PRD §4.2) ----------------------------------------------------------------------
export interface Contract {
  id: string;
  company_id: string;
  customer: string;
  effective_date: string;
  term_start_month: string | null;
  term_end_month: string | null;
  term_months: number | null;
  transaction_price: number; // total consideration to allocate across POs
  /** Contract terms that drive judgments beyond pricing (termination, right to payment, alternative
   *  use, etc.) — e.g. the over-time recognition criteria in ASC 606-10-25-27(c) depend on these. */
  key_terms: string[];
  performance_obligations: PerformanceObligation[];
}
