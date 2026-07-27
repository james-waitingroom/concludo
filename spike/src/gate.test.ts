import { describe, it, expect, beforeAll } from "vitest";
import { loadContract } from "./contracts.js";
import { makeExtractionClient } from "./llm/client.js";
import { validate } from "./validate.js";
import { expectationFor } from "./expectations.js";
import { diff } from "./diff.js";

// The PRD's load-bearing gate (Sections 7–8), asserted on hand-authored mock fixtures — no API key,
// no cost. The three curated cases exercise the whole "escalate, don't guess" spectrum:
//   1  (Meridian, clean)         → extract cleanly, DON'T escalate
//   12 (Piermont, MSA vs order)  → SURFACE the conflict, then RESOLVE via precedence (not blocking)
//   15 (Fenwick, adversarial)    → BLOCK rather than fabricate a value
beforeAll(() => { delete process.env.ANTHROPIC_API_KEY; });

async function run(id: number) {
  const client = makeExtractionClient();
  expect(client.mode).toBe("mock");
  const extraction = await client.extract(loadContract(id));
  const validation = validate(extraction);
  return { validation, d: diff(extraction, expectationFor(id)!, validation) };
}

describe("escalation gate (mock extraction, no API key)", () => {
  it("contract 1 (Meridian — clean) extracts correctly and does NOT escalate", async () => {
    const { validation, d } = await run(1);
    expect(validation.blocking).toBe(false);
    expect(d.verdict).toBe("PASS");
  });

  it("contract 12 (Piermont) SURFACES the conflict and RESOLVES it via precedence (flag-and-resolve, not blocking)", async () => {
    const { validation, d } = await run(12);
    expect(d.conflictCount).toBeGreaterThan(0);
    expect(validation.blocking).toBe(false);
    expect(d.verdict).toBe("PASS");
  });

  it("contract 15 (Fenwick — adversarial) BLOCKS rather than guessing", async () => {
    const { validation, d } = await run(15);
    expect(validation.blocking).toBe(true);
    expect(d.verdict).toBe("PASS");
  });
});
