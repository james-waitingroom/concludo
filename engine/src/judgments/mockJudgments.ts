/**
 * Hand-authored judgment proposals for Contract 2, curated from gold answer key 2. These stand in for
 * real Claude proposals so the whole chain runs at $0. A future `RealProposer` (same shape) would call
 * Claude with the extracted facts and return the same Judgment structure — swap without touching the
 * deterministic pipeline. Every judgment carries reasoning steps AND rejected alternatives (PRD §2.7).
 */
import type { Judgment, JudgmentType, ProposedConclusion, ConfidenceTier, Provenance } from "../model.js";
import { newJudgmentId, nowIso } from "../store.js";
import { PO_PLATFORM, PO_IMPL } from "../facts.js";

function judgment(args: {
  contractId: string;
  poId: string | null;
  type: JudgmentType;
  standardRef: string[];
  evidence: Provenance[];
  conclusion: ProposedConclusion;
  structured: Record<string, unknown>;
  tier?: ConfidenceTier | null;
  sensitivity?: string | null;
}): Judgment {
  return {
    id: newJudgmentId(),
    contract_id: args.contractId,
    performance_obligation_id: args.poId,
    judgment_type: args.type,
    standard_ref: args.standardRef,
    contract_evidence: args.evidence,
    ai_proposed_conclusion: args.conclusion,
    structured: args.structured,
    confidence_tier: args.tier ?? null,
    sensitivity_note: args.sensitivity ?? null,
    human_decision: null,
    status: "proposed",
    supersedes: null,
    superseded_by: null,
    created_at: nowIso(),
  };
}

/** Returns the proposed judgment chain for Brightwell (contract_2), in dependency order. */
export function proposeBrightwellJudgments(): Judgment[] {
  return [
    // 1. Distinctness of Implementation Services (the contested PO) — both prongs met → distinct.
    judgment({
      contractId: "contract_2",
      poId: PO_IMPL,
      type: "distinctness",
      standardRef: ["ASC 606-10-25-19", "ASC 606-10-25-21"],
      evidence: [
        { clause: "Section 3", quote: "Customer can use and benefit from the Platform independently using its default configuration." },
        { clause: "Exhibit A", quote: "Implementation & Onboarding Services — $48,000 one-time" },
      ],
      conclusion: {
        value: "distinct",
        reasoning_steps: [
          "Prong 1 (capable of being distinct): the contract states the customer can use and benefit from the Platform on its own using default configuration, so the implementation is not required for the customer to obtain benefit from the Platform.",
          "Prong 2 (separately identifiable): the implementation does not significantly modify or customize the Platform's functionality and is not highly interdependent with it; no integration/customization language is present.",
          "Both ASC 606-10-25-19 prongs are satisfied, so Implementation Services is a separate performance obligation.",
        ],
        rejected_alternatives: [
          { alternative: "Not distinct — combine with Platform into a single PO", why_rejected: "Would require the Platform to be unusable without the implementation or the implementation to significantly customize the Platform; the contract states the opposite (customer benefits from default configuration)." },
        ],
      },
      structured: { is_distinct: true },
      tier: null,
      sensitivity: "If Implementation were judged non-distinct, it would be combined with the Platform into a single over-time PO and the $48,000 would be recognized over the combined transfer pattern rather than over the implementation delivery period.",
    }),

    // 2. SSP — Platform (observable list pricing).
    judgment({
      contractId: "contract_2",
      poId: PO_PLATFORM,
      type: "ssp_method",
      standardRef: ["ASC 606-10-32-32"],
      evidence: [{ clause: "Exhibit A", quote: "400 seats, Enterprise Tier, $600/seat/yr = $240,000/yr" }],
      conclusion: {
        value: "market_assessment — observable standalone list price; SSP = $720,000 over the 36-month term ($240,000/yr)",
        reasoning_steps: [
          "Extensive observable comparable pricing exists for the per-seat Platform subscription (standard rate card).",
          "Adjusted market assessment applies directly; residual is neither needed nor permitted where a reliable observable SSP exists.",
        ],
        rejected_alternatives: [
          { alternative: "Residual approach", why_rejected: "Residual is permitted only where standalone price is highly variable/uncertain (ASC 606-10-32-34(c)); Platform pricing is observable, so residual is not appropriate." },
        ],
      },
      structured: { method: "market_assessment", ssp_value: 720000 },
      tier: "observed_high",
      sensitivity: null,
    }),

    // 3. SSP — Implementation (observable comparable per-hour pricing, 14 prior standalone sales).
    judgment({
      contractId: "contract_2",
      poId: PO_IMPL,
      type: "ssp_method",
      standardRef: ["ASC 606-10-32-32"],
      evidence: [{ clause: "Exhibit A note", quote: "14 standalone implementation sales at $560–640/hr" }],
      conclusion: {
        value: "market_assessment — observable comparable pricing (14 prior standalone sales); SSP = $48,000",
        reasoning_steps: [
          "14 prior standalone implementation sales at a consistent per-hour range provide observable comparable pricing.",
          "Adjusted market assessment applies; the contract's $48,000 fee is consistent with the observable range.",
        ],
        rejected_alternatives: [
          { alternative: "Residual approach", why_rejected: "Comparable observations exist, so standalone price is not highly variable/uncertain; residual is not appropriate." },
          { alternative: "Cost-plus-margin", why_rejected: "Direct observable market data is available and preferred over an estimated cost build-up." },
        ],
      },
      structured: { method: "market_assessment", ssp_value: 48000 },
      tier: "observed_high",
      sensitivity: null,
    }),

    // 4. Recognition pattern — Platform (over time, ratable).
    judgment({
      contractId: "contract_2",
      poId: PO_PLATFORM,
      type: "recognition_pattern",
      standardRef: ["ASC 606-10-25-27(a)"],
      evidence: [{ clause: "Section 1", quote: "Kestrel will provide Customer access to the Kestrel Platform for the Subscription Term." }],
      conclusion: {
        value: "over_time — ratable (straight-line) over the 36-month term",
        reasoning_steps: [
          "The customer simultaneously receives and consumes the benefit of platform access as Kestrel performs (ASC 606-10-25-27(a)).",
          "A time-based measure of progress (straight-line) faithfully depicts the stand-ready obligation.",
        ],
        rejected_alternatives: [
          { alternative: "Point in time", why_rejected: "Access is a continuous stand-ready service, not a good transferred at a point in time." },
        ],
      },
      structured: { type: "over_time", method: "ratable (straight-line)" },
      tier: null,
      sensitivity: null,
    }),

    // 5. Recognition pattern — Implementation (over time; duration not stated → flagged).
    judgment({
      contractId: "contract_2",
      poId: PO_IMPL,
      type: "recognition_pattern",
      standardRef: ["ASC 606-10-25-27(c)"],
      evidence: [{ clause: "Exhibit A", quote: "Implementation & Onboarding Services — $48,000 one-time" }],
      conclusion: {
        value: "over_time — over the implementation delivery period (NOT at signing)",
        reasoning_steps: [
          "Kestrel has a right to payment for performance completed to date and the configuration work has no alternative use, indicating over-time recognition (ASC 606-10-25-27(c)).",
          "This must NOT be recognized in full at contract signing — a common error for services fees.",
          "The contract does not state the implementation delivery period; the recognition period must be confirmed before a schedule can be produced.",
        ],
        rejected_alternatives: [
          { alternative: "Point in time at signing", why_rejected: "Services are delivered over a period; recognizing at signing would front-load revenue ahead of performance." },
        ],
      },
      structured: { type: "over_time", method: "over delivery period" },
      tier: null,
      sensitivity: "Recognition timing depends on the (currently unstated) delivery period; the total $48,000 is unaffected, but its spread across periods cannot be determined until the duration is confirmed.",
    }),
  ];
}
