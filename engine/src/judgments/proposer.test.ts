import { describe, it, expect } from "vitest";
import { tierFromCount } from "./proposer.js";

// Confidence tiering is deterministic arithmetic from a comparable count, NOT an LLM classification
// (PRD §2.3): 10+ observations → observed_high, 1–9 → observed_low, 0/unknown → benchmark_only.
describe("tierFromCount (deterministic confidence tiering)", () => {
  it("returns benchmark_only when there are no observations or the count is unknown", () => {
    expect(tierFromCount(null)).toBe("benchmark_only");
    expect(tierFromCount(0)).toBe("benchmark_only");
    expect(tierFromCount(-3)).toBe("benchmark_only");
  });

  it("returns observed_low for 1–9 comparable observations", () => {
    expect(tierFromCount(1)).toBe("observed_low");
    expect(tierFromCount(9)).toBe("observed_low");
  });

  it("returns observed_high at the 10-observation threshold and above", () => {
    expect(tierFromCount(10)).toBe("observed_high");
    expect(tierFromCount(25)).toBe("observed_high");
  });
});
