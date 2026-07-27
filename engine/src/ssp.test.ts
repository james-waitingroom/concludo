import { describe, it, expect } from "vitest";
import { allocateByRelativeSSP, round2 } from "./ssp.js";
import type { PerformanceObligation, SSP } from "./model.js";

function po(id: string, sspValue: number | null): PerformanceObligation {
  const ssp: SSP | null = sspValue == null ? null : { method: "market_assessment", value: sspValue, confidence_tier: "observed_high", support_refs: [] };
  return {
    id, contract_id: "c", description: id, is_distinct: true, standalone_ssp: ssp,
    allocated_price: null, recognition: null, start_month: null, end_month: null,
    observable_pricing: null, comparable_count: null,
  };
}

const sum = (ns: number[]) => round2(ns.reduce((a, b) => a + b, 0));

describe("allocateByRelativeSSP", () => {
  it("with no bundle discount, each allocation equals its SSP and the total ties out", () => {
    const allocs = allocateByRelativeSSP(768000, [po("platform", 720000), po("impl", 48000)]);
    expect(allocs.map((a) => a.allocated)).toEqual([720000, 48000]);
    expect(sum(allocs.map((a) => a.allocated))).toBe(768000);
  });

  it("spreads a bundle discount across POs by relative SSP", () => {
    // SSPs total 200k but the customer pays 150k — a 25% discount applied proportionally.
    const allocs = allocateByRelativeSSP(150000, [po("a", 100000), po("b", 100000)]);
    expect(allocs.map((a) => a.allocated)).toEqual([75000, 75000]);
    expect(sum(allocs.map((a) => a.allocated))).toBe(150000);
  });

  it("always sums exactly to the transaction price even when the split doesn't divide evenly", () => {
    const allocs = allocateByRelativeSSP(100, [po("a", 100), po("b", 200), po("c", 33)]);
    expect(sum(allocs.map((a) => a.allocated))).toBe(100);
  });

  it("throws rather than guessing when no PO has an SSP", () => {
    expect(() => allocateByRelativeSSP(100000, [po("a", null)])).toThrow(/no PO has an SSP/);
  });
});
