export const dynamic = "force-dynamic";

export default function EquityPage() {
  return (
    <div className="content">
      <div className="eyebrow">Equity</div>
      <h1>Overview</h1>
      <div className="sub">Stock-based compensation (ASC 718) and equity accounting.</div>

      <div className="empty-note" style={{ marginTop: 24 }}>
        <b style={{ color: "var(--ink)" }}>Coming soon.</b><br />
        The Equity module will handle stock-based compensation expense, grant tracking, and
        vesting schedules — mirroring the judgment-and-provenance approach used for revenue.
      </div>
    </div>
  );
}
