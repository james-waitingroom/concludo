import Link from "next/link";
import { supabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

const money = (n: number) => "$" + Number(n).toLocaleString("en-US");

export default async function RevenueOverviewPage() {
  const db = supabaseServer();
  const { data: contracts } = await db.from("contracts").select("id,name,customer,transaction_price,status").order("transaction_price", { ascending: false });

  const rows = contracts ?? [];
  const tcv = rows.reduce((s, r) => s + Number(r.transaction_price ?? 0), 0);
  const active = rows.filter((r) => r.status === "active");
  const activeTcv = active.reduce((s, r) => s + Number(r.transaction_price ?? 0), 0);

  const stats = [
    { label: "Total contract value", value: money(tcv) },
    { label: "Active contract value", value: money(activeTcv) },
    { label: "Active contracts", value: active.length },
    { label: "Awaiting review", value: rows.filter((r) => r.status === "in_review").length },
  ];

  return (
    <div className="content">
      <div className="eyebrow">Revenue</div>
      <h1>Overview</h1>
      <div className="sub">ASC 606 revenue across your contract portfolio.</div>

      <div className="statgrid">
        {stats.map((s) => (
          <div className="stat" key={s.label}>
            <div className="statlabel">{s.label}</div>
            <div className="statvalue">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="sec">
        <div className="list-head">
          <h2 style={{ margin: 0 }}>Largest contracts</h2>
          <Link href="/contracts" className="btn">All contracts</Link>
        </div>
        <div className="card" style={{ marginTop: 14 }}>
          <div className="tscroll">
            <table>
              <thead><tr><th>Contract</th><th>Customer</th><th className="r">Value</th></tr></thead>
              <tbody>
                {rows.slice(0, 8).map((c) => (
                  <tr className="row" key={c.id}>
                    <td><Link href={`/contracts/${c.id}`} style={{ display: "block" }} className="name">{c.name}</Link></td>
                    <td><Link href={`/contracts/${c.id}`} style={{ display: "block" }}>{c.customer}</Link></td>
                    <td className="r mono"><Link href={`/contracts/${c.id}`} style={{ display: "block" }}>{money(Number(c.transaction_price ?? 0))}</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
