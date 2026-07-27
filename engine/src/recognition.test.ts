import { describe, it, expect } from "vitest";
import { recognize, monthsInclusive } from "./recognition.js";
import { round2 } from "./ssp.js";
import type { PerformanceObligation, RecognitionPattern } from "./model.js";

function po(over: Partial<PerformanceObligation>): PerformanceObligation {
  return {
    id: "po", contract_id: "c", description: "po", is_distinct: true, standalone_ssp: null,
    allocated_price: null, recognition: null, start_month: null, end_month: null,
    observable_pricing: null, comparable_count: null, ...over,
  };
}
const overTime: RecognitionPattern = { type: "over_time", method: "ratable (straight-line)" };
const pointInTime: RecognitionPattern = { type: "point_in_time", method: "on transfer" };

describe("monthsInclusive", () => {
  it("enumerates inclusive months across a year boundary", () => {
    expect(monthsInclusive("2025-11", "2026-02")).toEqual(["2025-11", "2025-12", "2026-01", "2026-02"]);
  });
});

describe("recognize", () => {
  it("spreads an over-time PO straight-line and sums exactly to the allocated price", () => {
    const r = recognize(po({ allocated_price: 720000, recognition: overTime, start_month: "2025-07", end_month: "2028-06" }));
    expect(r.flags).toEqual([]);
    expect(r.lines).toHaveLength(36);
    expect(round2(r.lines.reduce((a, l) => a + l.amount, 0))).toBe(720000);
  });

  it("ESCALATES an over-time PO whose end month is unknown — no fabricated schedule", () => {
    const r = recognize(po({ allocated_price: 48000, recognition: overTime, start_month: "2025-07", end_month: null }));
    expect(r.lines).toEqual([]);
    expect(r.flags.length).toBeGreaterThan(0);
    expect(r.flags[0]).toMatch(/END not stated/i);
  });

  it("recognizes a point-in-time PO in the transfer month", () => {
    const r = recognize(po({ allocated_price: 90000, recognition: pointInTime, end_month: "2025-09" }));
    expect(r.flags).toEqual([]);
    expect(r.lines).toEqual([{ period: "2025-09", amount: 90000 }]);
  });

  it("ESCALATES a point-in-time PO whose transfer month is unknown (no front-loading at signing)", () => {
    const r = recognize(po({ allocated_price: 90000, recognition: pointInTime, start_month: "2025-01", end_month: null }));
    expect(r.lines).toEqual([]);
    expect(r.flags.length).toBeGreaterThan(0);
  });

  it("flags when the allocation or recognition pattern hasn't been determined yet", () => {
    expect(recognize(po({ allocated_price: null, recognition: overTime })).flags.length).toBeGreaterThan(0);
    expect(recognize(po({ allocated_price: 1000, recognition: null })).flags.length).toBeGreaterThan(0);
  });
});
