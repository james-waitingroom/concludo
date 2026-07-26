/**
 * Standalone-selling-price allocation — deterministic arithmetic (PRD §2.3, §5.4). The LLM chooses the
 * SSP *method* and value per PO (a judgment); this code mechanically allocates the transaction price
 * across POs by relative SSP. No model calls here.
 *
 *   allocated_i = transaction_price * ssp_i / sum(ssp)
 *
 * When the SSPs already sum to the transaction price (no bundle discount), each allocation equals its
 * SSP. Rounding residual (from cents) is assigned to the largest PO so the allocations sum exactly.
 */
import type { PerformanceObligation } from "./model.js";

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export interface Allocation {
  po_id: string;
  ssp: number;
  allocated: number;
}

export function allocateByRelativeSSP(
  transactionPrice: number,
  pos: PerformanceObligation[],
): Allocation[] {
  const withSsp = pos.filter((p) => p.standalone_ssp != null);
  if (withSsp.length === 0) throw new Error("Cannot allocate: no PO has an SSP.");
  const sumSsp = withSsp.reduce((acc, p) => acc + p.standalone_ssp!.value, 0);
  if (sumSsp <= 0) throw new Error("Cannot allocate: total SSP is non-positive.");

  const allocations: Allocation[] = withSsp.map((p) => ({
    po_id: p.id,
    ssp: p.standalone_ssp!.value,
    allocated: round2((transactionPrice * p.standalone_ssp!.value) / sumSsp),
  }));

  // Push any rounding residual onto the largest allocation so the total ties out exactly.
  const allocatedSum = round2(allocations.reduce((acc, a) => acc + a.allocated, 0));
  const residual = round2(transactionPrice - allocatedSum);
  if (residual !== 0) {
    const largest = allocations.reduce((a, b) => (b.allocated > a.allocated ? b : a));
    largest.allocated = round2(largest.allocated + residual);
  }
  return allocations;
}
