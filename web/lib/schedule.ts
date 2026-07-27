/**
 * Deterministic revenue recognition schedule from performance obligations.
 * Pure math — never an LLM (PRD §2.3). Over-time POs spread ratably across their months;
 * point-in-time POs recognize fully in their start month. POs missing a recognition period
 * are returned as "unscheduled" (e.g. an implementation whose delivery period isn't yet known).
 */
export type POForSchedule = {
  description: string;
  allocated_price: number | null;
  recognition_type: string | null;
  start_month: string | null; // 'YYYY-MM'
  end_month: string | null;
};

export type ScheduleRow = { month: string; recognized: number; cumulative: number };
export type ScheduleResult = {
  total: number;
  scheduledTotal: number;
  recognizedToDate: number;
  deferred: number;
  rows: ScheduleRow[];
  unscheduled: { description: string; amount: number; reason: string }[];
};

function monthsBetween(start: string, end: string): string[] {
  const [sy, sm] = start.split("-").map(Number);
  const [ey, em] = end.split("-").map(Number);
  const out: string[] = [];
  let y = sy, m = sm;
  while (y < ey || (y === ey && m <= em)) {
    out.push(`${y}-${String(m).padStart(2, "0")}`);
    m += 1; if (m > 12) { m = 1; y += 1; }
  }
  return out;
}

const currentMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

export function computeSchedule(pos: POForSchedule[]): ScheduleResult {
  const perMonth = new Map<string, number>();
  const unscheduled: ScheduleResult["unscheduled"] = [];
  let total = 0;

  for (const po of pos) {
    const amount = Number(po.allocated_price ?? 0);
    total += amount;
    if (amount === 0) continue;

    if (po.recognition_type === "point_in_time") {
      if (!po.start_month) { unscheduled.push({ description: po.description, amount, reason: "transfer date not yet known" }); continue; }
      perMonth.set(po.start_month, (perMonth.get(po.start_month) ?? 0) + amount);
    } else {
      // over_time (or unspecified over-time) — needs a start and end month
      if (!po.start_month || !po.end_month) { unscheduled.push({ description: po.description, amount, reason: "recognition period not yet confirmed" }); continue; }
      const months = monthsBetween(po.start_month, po.end_month);
      const per = Math.floor((amount / months.length) * 100) / 100;
      months.forEach((mo, i) => {
        const val = i === months.length - 1 ? Math.round((amount - per * (months.length - 1)) * 100) / 100 : per;
        perMonth.set(mo, (perMonth.get(mo) ?? 0) + val);
      });
    }
  }

  const sortedMonths = Array.from(perMonth.keys()).sort();
  const rows: ScheduleRow[] = [];
  let cumulative = 0;
  for (const mo of sortedMonths) {
    cumulative = Math.round((cumulative + (perMonth.get(mo) ?? 0)) * 100) / 100;
    rows.push({ month: mo, recognized: Math.round((perMonth.get(mo) ?? 0) * 100) / 100, cumulative });
  }

  const nowM = currentMonth();
  const recognizedToDate = rows.filter((r) => r.month <= nowM).reduce((s, r) => s + r.recognized, 0);
  const scheduledTotal = rows.reduce((s, r) => s + r.recognized, 0);

  return {
    total: Math.round(total * 100) / 100,
    scheduledTotal: Math.round(scheduledTotal * 100) / 100,
    recognizedToDate: Math.round(recognizedToDate * 100) / 100,
    deferred: Math.round((scheduledTotal - recognizedToDate) * 100) / 100,
    rows,
    unscheduled,
  };
}
