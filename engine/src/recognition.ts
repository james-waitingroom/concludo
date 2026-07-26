/**
 * Revenue-recognition schedule computation — deterministic (PRD §2.3, §5.3e). Given an approved
 * recognition pattern and a PO's allocated price + service period, produce a per-month schedule.
 *
 * Load-bearing principle (PRD §2.5): recognition timing is NOT billing timing. This module knows only
 * the service period and the recognition pattern — it never looks at when invoices are due.
 *
 * Escalate, don't guess (PRD §2.6): an over-time PO whose service-period end is unknown produces NO
 * fabricated monthly figures — it returns a flag instead.
 */
import type { PerformanceObligation } from "./model.js";
import { round2 } from "./ssp.js";

export interface ScheduleLine {
  period: string; // "YYYY-MM"
  amount: number;
}

export interface RecognitionResult {
  po_id: string;
  lines: ScheduleLine[];
  flags: string[]; // non-empty means something needs human input before this schedule is complete
}

/** Enumerate inclusive month labels from start to end, e.g. ("2025-07", "2025-09") → Jul,Aug,Sep. */
export function monthsInclusive(startMonth: string, endMonth: string): string[] {
  const [sy, sm] = startMonth.split("-").map(Number) as [number, number];
  const [ey, em] = endMonth.split("-").map(Number) as [number, number];
  const out: string[] = [];
  let y = sy, m = sm;
  while (y < ey || (y === ey && m <= em)) {
    out.push(`${y}-${String(m).padStart(2, "0")}`);
    m += 1;
    if (m > 12) { m = 1; y += 1; }
  }
  return out;
}

export function recognize(po: PerformanceObligation): RecognitionResult {
  const flags: string[] = [];
  if (po.allocated_price == null) {
    return { po_id: po.id, lines: [], flags: ["allocated_price not set — run SSP allocation first"] };
  }
  if (po.recognition == null) {
    return { po_id: po.id, lines: [], flags: ["recognition pattern not determined (judgment pending)"] };
  }

  if (po.recognition.type === "point_in_time") {
    // Recognized in the single month control transfers (completion), modeled as end_month. Do NOT fall
    // back to the service start when the transfer month is unknown — that would front-load revenue.
    // (A PO that transfers at inception should set end_month == start_month.) Escalate-don't-guess.
    const transferMonth = po.end_month;
    if (!transferMonth) {
      return {
        po_id: po.id,
        lines: [],
        flags: [`point-in-time PO transfer/completion month not stated — cannot schedule $${po.allocated_price.toLocaleString()} until the month control transfers is confirmed`],
      };
    }
    return { po_id: po.id, lines: [{ period: transferMonth, amount: round2(po.allocated_price) }], flags };
  }

  // over_time, straight-line
  if (!po.start_month) return { po_id: po.id, lines: [], flags: ["over-time PO has no service start month"] };
  if (!po.end_month) {
    // Do NOT fabricate a period. Flag for human input — exactly the escalate-don't-guess rule.
    return {
      po_id: po.id,
      lines: [],
      flags: [`over-time PO service-period END not stated in contract — recognition period must be confirmed before scheduling $${po.allocated_price.toLocaleString()}`],
    };
  }

  const months = monthsInclusive(po.start_month, po.end_month);
  const per = round2(po.allocated_price / months.length);
  const lines: ScheduleLine[] = months.map((period) => ({ period, amount: per }));
  // Assign rounding residual to the final month so the schedule sums exactly to allocated_price.
  const scheduled = round2(lines.reduce((acc, l) => acc + l.amount, 0));
  const residual = round2(po.allocated_price - scheduled);
  if (residual !== 0 && lines.length > 0) {
    lines[lines.length - 1]!.amount = round2(lines[lines.length - 1]!.amount + residual);
  }
  return { po_id: po.id, lines, flags };
}
