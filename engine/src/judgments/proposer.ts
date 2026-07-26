/**
 * Swappable judgment proposer. One method: `propose(contract) -> Judgment[]`.
 *
 *   No ANTHROPIC_API_KEY  -> MockProposer (hand-authored gold judgments; $0).
 *   Key present           -> RealProposer: Claude proposes the ASC 606 judgment chain via tool-use.
 *
 * The deterministic pipeline downstream (allocate → recognize → memo) is identical either way — this
 * is the single seam between "LLM proposes judgments" and "code executes the math" (PRD §2.3).
 *
 * Reliability patterns are carried over from the Step-1 spike: plain JSON-Schema tool input (draft
 * 2020-12, not OpenAPI), generous max_tokens so adaptive thinking can't truncate the tool call, and a
 * defensive parse + one retry rather than discarding the whole proposal on transient shape drift.
 */
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import type { Contract, Judgment, JudgmentType, ConfidenceTier } from "../model.js";
import { newJudgmentId, nowIso } from "../store.js";
import { proposeBrightwellJudgments } from "./mockJudgments.js";

export type ProposerMode = "mock" | "real";

export interface JudgmentProposer {
  readonly mode: ProposerMode;
  propose(contract: Contract): Promise<Judgment[]>;
}

// ---- Tool-output schema the model fills in --------------------------------------------------------
const ProposedJudgment = z.object({
  judgment_type: z.enum([
    "contract_combination", "distinctness", "ssp_method", "recognition_pattern",
    "variable_consideration", "modification_type", "commission_capitalization", "amortization_period",
  ]),
  performance_obligation_id: z.string().nullable().describe("Exact PO id from the provided list, or null for a contract-level judgment."),
  standard_ref: z.array(z.string()).describe("Specific ASC citation(s), e.g. 'ASC 606-10-25-19'."),
  conclusion_summary: z.string(),
  reasoning_steps: z.array(z.string()),
  rejected_alternatives: z.array(z.object({ alternative: z.string(), why_rejected: z.string() })),
  confidence_tier: z.enum(["observed_high", "observed_low", "benchmark_only"]).nullable(),
  sensitivity_note: z.string().nullable(),
  contract_evidence: z.array(z.object({ clause: z.string(), quote: z.string() })),
  structured: z.object({
    is_distinct: z.boolean().nullable().optional(),
    ssp_method: z.enum(["market_assessment", "cost_plus_margin", "residual"]).nullable().optional(),
    ssp_value: z.number().nullable().optional(),
    recognition_type: z.enum(["over_time", "point_in_time"]).nullable().optional(),
    recognition_method: z.string().nullable().optional(),
  }).describe("Machine-usable conclusion the deterministic engine consumes."),
});
const ProposalOutput = z.object({ judgments: z.array(ProposedJudgment).catch([]) });
type ProposedJudgmentT = z.infer<typeof ProposedJudgment>;

// ---- Deterministic confidence tiering (PRD §2.3 / §5.4) — from a count, not the LLM ---------------
export function tierFromCount(count: number | null): ConfidenceTier {
  if (count == null || count <= 0) return "benchmark_only";
  return count >= 10 ? "observed_high" : "observed_low";
}

// ---- Mapping model output -> engine Judgment ------------------------------------------------------
function toStructured(p: ProposedJudgmentT): Record<string, unknown> {
  const s = p.structured;
  switch (p.judgment_type) {
    case "distinctness": return { is_distinct: s.is_distinct };
    case "ssp_method": return { method: s.ssp_method, ssp_value: s.ssp_value };
    case "recognition_pattern": return { type: s.recognition_type, method: s.recognition_method };
    default: return { ...s };
  }
}

function toJudgment(contract: Contract, p: ProposedJudgmentT): Judgment {
  const po = contract.performance_obligations.find((x) => x.id === p.performance_obligation_id);
  const knownPo = po != null;
  // Confidence tier is code-derived from the comparable count for SSP judgments, and null otherwise.
  const tier = p.judgment_type === "ssp_method" ? tierFromCount(po?.comparable_count ?? null) : null;
  return {
    id: newJudgmentId(),
    contract_id: contract.id,
    performance_obligation_id: knownPo ? p.performance_obligation_id : null,
    judgment_type: p.judgment_type as JudgmentType,
    standard_ref: p.standard_ref,
    contract_evidence: p.contract_evidence,
    ai_proposed_conclusion: {
      value: p.conclusion_summary,
      reasoning_steps: p.reasoning_steps,
      rejected_alternatives: p.rejected_alternatives,
    },
    structured: toStructured(p),
    confidence_tier: tier,
    sensitivity_note: p.sensitivity_note,
    human_decision: null,
    status: "proposed",
    supersedes: null,
    superseded_by: null,
    created_at: nowIso(),
  };
}

// ---- Mock --------------------------------------------------------------------------------------
class MockProposer implements JudgmentProposer {
  readonly mode = "mock" as const;
  async propose(contract: Contract): Promise<Judgment[]> {
    if (contract.id === "contract_2") return proposeBrightwellJudgments();
    throw new Error(`MockProposer has no fixture for ${contract.id} — add one or run with a key.`);
  }
}

// ---- Real --------------------------------------------------------------------------------------
const SYSTEM_PROMPT = `You are an ASC 606 revenue-recognition judgment engine for Concludo. Given the structured facts of a \
contract, you PROPOSE the accounting judgments — you do NOT compute allocation or schedule arithmetic \
(a separate deterministic engine does that). Call the \`record_judgments\` tool once with the full \
judgment chain for this contract.

Produce, in dependency order:
1. A distinctness judgment for each performance obligation whose separateness is genuinely in question \
(apply the two-part test: capable of being distinct AND separately identifiable — ASC 606-10-25-19/21). \
Do NOT invent a distinctness judgment where a deliverable is obviously the sole/primary obligation.
2. An ssp_method judgment for each performance obligation: choose market_assessment (observable \
comparables), cost_plus_margin, or residual — and state WHY the others were rejected. Use the PO's \
\`observable_pricing\` field: when it describes comparable standalone sales, market_assessment applies. \
Residual is permitted only where a PO's standalone price is highly variable/uncertain (ASC \
606-10-32-34(c)), never merely for convenience. Set structured.ssp_value to the standalone selling \
price on the SAME basis as the transaction price (i.e. full-term dollars). Do NOT set confidence_tier \
yourself — the system derives it deterministically from the comparable count; leave it null.
3. A recognition_pattern judgment for each PO: over_time or point_in_time, with the measure of progress. \
Recognition is over_time if ANY of the ASC 606-10-25-27 criteria are met — including (c): the entity's \
performance creates an asset with no alternative use to the entity AND the entity has an enforceable \
right to payment for performance completed to date. Consult \`key_terms\` for these facts. Recognition \
timing is NOT billing timing.

Rules:
- Every judgment MUST include reasoning_steps AND rejected_alternatives (why the other treatments fail).
- Reference performance_obligation_id using the EXACT ids given; use null only for contract-level judgments.
- Cite specific ASC references. Add a sensitivity_note where the conclusion is a close call or an input \
(e.g. a service period) is unstated.
- Do NOT do arithmetic beyond copying/stating an SSP figure. Never fabricate a value not supported by \
the facts — if an input needed for a schedule is unstated, say so in the sensitivity_note rather than guessing.`;

class RealProposer implements JudgmentProposer {
  readonly mode = "real" as const;
  private anthropic: Anthropic;
  private model: string;
  private inputSchema: Record<string, unknown>;

  constructor(apiKey: string, model: string) {
    this.anthropic = new Anthropic({ apiKey });
    this.model = model;
    const json = zodToJsonSchema(ProposalOutput, { $refStrategy: "none" }) as Record<string, unknown>;
    delete json.$schema; delete json.$ref; delete json.definitions;
    this.inputSchema = json;
  }

  async propose(contract: Contract): Promise<Judgment[]> {
    const facts = {
      contract_id: contract.id,
      customer: contract.customer,
      effective_date: contract.effective_date,
      term: { start_month: contract.term_start_month, end_month: contract.term_end_month, months: contract.term_months },
      transaction_price: contract.transaction_price,
      key_terms: contract.key_terms,
      performance_obligations: contract.performance_obligations.map((po) => ({
        id: po.id,
        description: po.description,
        service_period: { start_month: po.start_month, end_month: po.end_month },
        observable_pricing: po.observable_pricing,
      })),
    };

    const MAX_ATTEMPTS = 2;
    let lastError = "";
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      const res = await this.anthropic.messages.create({
        model: this.model,
        max_tokens: 16000,
        system: SYSTEM_PROMPT,
        tools: [{ name: "record_judgments", description: "Record the proposed ASC 606 judgment chain.", input_schema: this.inputSchema as Anthropic.Tool.InputSchema }],
        tool_choice: { type: "tool", name: "record_judgments" },
        messages: [{ role: "user", content: `Propose the ASC 606 judgment chain for this contract.\n\nFACTS:\n${JSON.stringify(facts, null, 2)}` }],
      });
      const toolUse = res.content.find((b) => b.type === "tool_use");
      if (!toolUse || toolUse.type !== "tool_use") { lastError = "model did not call record_judgments"; continue; }
      const parsed = ProposalOutput.safeParse(toolUse.input);
      if (parsed.success) return parsed.data.judgments.map((p) => toJudgment(contract, p));
      lastError = parsed.error.toString();
    }
    throw new Error(`Judgment proposal for ${contract.id} failed after ${MAX_ATTEMPTS} attempts:\n${lastError}`);
  }
}

export function makeProposer(forceMock = false): JudgmentProposer {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (forceMock || !apiKey) return new MockProposer();
  const model = process.env.ANTHROPIC_MODEL?.trim() || "claude-sonnet-5";
  return new RealProposer(apiKey, model);
}
