/**
 * Swappable extraction client. One method: `extract(contract) -> ExtractedContract`.
 *
 * - No ANTHROPIC_API_KEY  -> MockClient (hand-authored fixtures; the whole pipeline still runs).
 * - Key present           -> RealClient: Claude with the Zod schema as a tool `input_schema`
 *                            (schema-constrained / tool-use), result validated back through Zod.
 *
 * The factory `makeExtractionClient()` picks automatically, so nothing downstream cares which is live.
 */
import Anthropic from "@anthropic-ai/sdk";
import { zodToJsonSchema } from "zod-to-json-schema";
import { ExtractedContract } from "../schema.js";
import { EXTRACTION_SYSTEM_PROMPT, EXTRACTION_TOOL_NAME } from "./prompt.js";
import { mockExtraction } from "./mockFixtures.js";
import type { TestContract } from "../contracts.js";

export type ClientMode = "mock" | "real";

export interface ExtractionClient {
  readonly mode: ClientMode;
  extract(contract: TestContract): Promise<ExtractedContract>;
}

class MockClient implements ExtractionClient {
  readonly mode = "mock" as const;
  async extract(contract: TestContract): Promise<ExtractedContract> {
    return mockExtraction(contract.id);
  }
}

class RealClient implements ExtractionClient {
  readonly mode = "real" as const;
  private anthropic: Anthropic;
  private model: string;
  private inputSchema: Record<string, unknown>;

  constructor(apiKey: string, model: string) {
    this.anthropic = new Anthropic({ apiKey });
    this.model = model;
    // Anthropic tool input_schema must be plain JSON Schema (draft 2020-12), not OpenAPI. Inline all
    // sub-schemas ($refStrategy: "none" — no $ref/definitions, which the API rejects) and drop the
    // draft-07 $schema marker so the API treats it as 2020-12.
    const json = zodToJsonSchema(ExtractedContract, { $refStrategy: "none" }) as Record<string, unknown>;
    delete json.$schema;
    delete json.$ref;
    delete json.definitions;
    this.inputSchema = json;
  }

  async extract(contract: TestContract): Promise<ExtractedContract> {
    // Defensive parsing + one retry. Newer models occasionally return a tool-call payload that drifts
    // in shape (a field as the wrong JSON type, or truncated). A single re-ask almost always yields a
    // conformant payload — a real product lesson for Step 2: never discard a contract on transient
    // shape drift; retry, and lenient-parse the rest.
    const MAX_ATTEMPTS = 2;
    let lastError = "";
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      const res = await this.anthropic.messages.create({
        model: this.model,
        // 16000 gives headroom so Sonnet 5's adaptive thinking can't consume the budget and truncate
        // the tool call (which surfaced as an all-fields-undefined schema error at 8000).
        max_tokens: 16000,
        system: EXTRACTION_SYSTEM_PROMPT,
        tools: [
          {
            name: EXTRACTION_TOOL_NAME,
            description: "Record the structured extraction for this contract.",
            input_schema: this.inputSchema as Anthropic.Tool.InputSchema,
          },
        ],
        tool_choice: { type: "tool", name: EXTRACTION_TOOL_NAME },
        messages: [
          {
            role: "user",
            content: `Extract the structured facts from the following contract. Escalate rather than guess where the document is contradictory, illegible, or incomplete.\n\n--- CONTRACT ${contract.id}: ${contract.name} ---\n\n${contract.text}`,
          },
        ],
      });

      const toolUse = res.content.find((b) => b.type === "tool_use");
      if (!toolUse || toolUse.type !== "tool_use") {
        lastError = `model did not call ${EXTRACTION_TOOL_NAME}`;
        continue;
      }

      const parsed = ExtractedContract.safeParse(toolUse.input);
      if (parsed.success) return parsed.data;
      lastError = parsed.error.toString();
    }

    throw new Error(
      `Contract ${contract.id}: extraction failed after ${MAX_ATTEMPTS} attempts:\n${lastError}`,
    );
  }
}

export function makeExtractionClient(): ExtractionClient {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) return new MockClient();
  const model = process.env.ANTHROPIC_MODEL?.trim() || "claude-opus-4-8";
  return new RealClient(apiKey, model);
}
