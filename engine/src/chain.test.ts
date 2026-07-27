import { describe, it, expect } from "vitest";
import { runChain } from "./run.js";
import { brightwell } from "./facts.js";
import { round2 } from "./ssp.js";

// End-to-end deterministic pipeline on the Brightwell worked example, in MOCK mode ($0, no API key).
describe("runChain — Brightwell (mock)", () => {
  it("runs in mock mode and approves the full proposed chain", async () => {
    const r = await runChain(brightwell, { forceMock: true });
    expect(r.mode).toBe("mock");
    expect(r.approved.length).toBe(5);
  });

  it("allocates the transaction price across POs so the total ties out exactly", async () => {
    const r = await runChain(brightwell, { forceMock: true });
    const total = round2(r.allocations.reduce((a, x) => a + x.allocated, 0));
    expect(total).toBe(r.contract.transaction_price);
  });

  it("schedules the ratable platform revenue and ESCALATES the implementation (unknown end date)", async () => {
    const r = await runChain(brightwell, { forceMock: true });
    const scheduled = r.schedules.filter((s) => s.lines.length > 0);
    const escalated = r.schedules.filter((s) => s.flags.length > 0 && s.lines.length === 0);

    // Platform subscription recognizes month-by-month and sums to its allocated amount.
    expect(scheduled.length).toBeGreaterThanOrEqual(1);
    for (const s of scheduled) {
      const po = r.contract.performance_obligations.find((p) => p.id === s.po_id)!;
      expect(round2(s.lines.reduce((a, l) => a + l.amount, 0))).toBe(round2(po.allocated_price!));
    }

    // Implementation services (no stated delivery period) is held back, not guessed.
    expect(escalated.length).toBe(1);
  });
});
