import Link from "next/link";
import { supabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

const money = (n: number) => "$" + Number(n).toLocaleString("en-US");

export default async function DashboardPage() {
  const db = supabaseServer();
  const { data: contracts } = await db.from("contracts").select("status,transaction_price");
  const { data: policies } = await db.from("policies").select("id");

  const rows = contracts ?? [];
  const tcv = rows.reduce((s, r) => s + Number(r.transaction_price ?? 0), 0);
  const count = (st: string) => rows.filter((r) => r.status === st).length;

  const stats = [
    { label: "Contracts", value: rows.length, href: "/contracts" },
    { label: "Total contract value", value: money(tcv) },
    { label: "In review", value: count("in_review") },
    { label: "Policies", value: policies?.length ?? 0, href: "/policies" },
  ];

  return (
    <div className="content">
      <div className="eyebrow">Home</div>
      <h1>Dashboard</h1>
      <div className="sub">A snapshot of your revenue recognition workspace.</div>

      <div className="statgrid">
        {stats.map((s) => (
          <div className="stat" key={s.label}>
            <div className="statlabel">{s.label}</div>
            <div className="statvalue">{s.value}</div>
            {s.href ? <Link href={s.href} className="statlink">View →</Link> : null}
          </div>
        ))}
      </div>

      <div className="sec">
        <h2>Contract status</h2>
        <div className="card" style={{ padding: 20 }}>
          <div className="bars">
            {[
              { k: "active", label: "Active", n: count("active") },
              { k: "in_review", label: "In Review", n: count("in_review") },
              { k: "denied", label: "Denied", n: count("denied") },
            ].map((b) => (
              <div className="barrow" key={b.k}>
                <span className={`pill ${b.k}`}><span className="d"></span>{b.label}</span>
                <div className="bartrack"><div className={`barfill ${b.k}`} style={{ width: `${rows.length ? (b.n / rows.length) * 100 : 0}%` }} /></div>
                <span className="mono barnum">{b.n}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
