import Link from "next/link";
import { supabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic"; // always read fresh from the DB

const money = (n: number | null) => (n == null ? "—" : "$" + Number(n).toLocaleString("en-US"));
const STATUS_LABEL: Record<string, string> = {
  draft: "Memo draft", in_review: "In review", active: "Active", amended: "Amended", terminated: "Terminated", blocked: "Blocked",
};

export default async function ContractsPage() {
  const db = supabaseServer();
  const { data, error } = await db
    .from("contracts")
    .select("id,name,customer,transaction_price,status")
    .order("name");

  return (
    <div className="content">
      <div className="list-head">
        <div>
          <div className="eyebrow">ACME Inc.</div>
          <h1>Contracts</h1>
          <div className="sub">Live from your Supabase database — {data?.length ?? 0} contracts.</div>
        </div>
        <Link href="/contracts/new" className="addbtn"><span className="plus">+</span> Add contract</Link>
      </div>

      {error ? (
        <div className="empty-note" style={{ marginTop: 24 }}>
          Couldn&apos;t load contracts: {error.message}
        </div>
      ) : (
        <div className="card" style={{ marginTop: 20 }}>
          <div className="tscroll">
            <table>
              <thead>
                <tr>
                  <th>Contract Name</th>
                  <th>Customer</th>
                  <th className="r">Total Contract Value</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {(data ?? []).map((c) => (
                  <tr className="row" key={c.id} style={{ cursor: "pointer" }}>
                    <td>
                      <Link href={`/contracts/${c.id}`} style={{ display: "block" }}>
                        <span className="name">{c.name}</span>
                        <span className="cid">{String(c.id).slice(0, 8)}</span>
                      </Link>
                    </td>
                    <td><Link href={`/contracts/${c.id}`} style={{ display: "block" }}>{c.customer}</Link></td>
                    <td className="r mono"><Link href={`/contracts/${c.id}`} style={{ display: "block" }}>{money(c.transaction_price)}</Link></td>
                    <td>
                      <Link href={`/contracts/${c.id}`} style={{ display: "block" }}>
                        <span className={`pill ${c.status}`}><span className="d"></span>{STATUS_LABEL[c.status] ?? c.status}</span>
                      </Link>
                    </td>
                    <td className="r"><Link href={`/contracts/${c.id}`}><span className="chev">›</span></Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
