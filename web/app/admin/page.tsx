import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { createTenantAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminHome({ searchParams }: { searchParams: { error?: string; message?: string } }) {
  const db = supabaseAdmin();
  const [{ data: companies }, { data: members }, { data: contracts }] = await Promise.all([
    db.from("companies").select("id,name,industry_segment,created_at").order("name"),
    db.from("company_members").select("company_id"),
    db.from("contracts").select("company_id"),
  ]);
  const countBy = (rows: { company_id: string }[] | null, id: string) => (rows ?? []).filter((r) => r.company_id === id).length;

  return (
    <div className="content">
      <div className="eyebrow">Concludo control plane</div>
      <h1>Tenants</h1>
      <div className="sub">Companies using Concludo — {companies?.length ?? 0} total.</div>

      {searchParams.error ? <div className="auth-err" style={{ marginTop: 16 }}>{searchParams.error}</div> : null}
      {searchParams.message ? <div className="auth-msg" style={{ marginTop: 16 }}>{searchParams.message}</div> : null}

      <div className="card" style={{ marginTop: 20 }}>
        <div className="tscroll">
          <table>
            <thead>
              <tr><th>Company</th><th className="r">Users</th><th className="r">Contracts</th><th>Created</th><th></th></tr>
            </thead>
            <tbody>
              {(companies ?? []).map((c) => (
                <tr className="row" key={c.id}>
                  <td>
                    <Link href={`/admin/${c.id}`} style={{ display: "block" }}>
                      <span className="name">{c.name}</span>
                      <span className="cid">{c.industry_segment ?? "—"}</span>
                    </Link>
                  </td>
                  <td className="r mono">{countBy(members, c.id)}</td>
                  <td className="r mono">{countBy(contracts, c.id)}</td>
                  <td>{new Date(c.created_at).toLocaleDateString()}</td>
                  <td className="r"><Link href={`/admin/${c.id}`}><span className="chev">›</span></Link></td>
                </tr>
              ))}
              {(companies?.length ?? 0) === 0 && (
                <tr><td colSpan={5} style={{ color: "var(--muted)" }}>No tenants yet. Create one below.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="sec">
        <h2>Create tenant</h2>
        <form action={createTenantAction} className="card formcard" style={{ maxWidth: 520 }}>
          <label className="field"><span>Company name</span><input name="name" required placeholder="e.g. Northwind Trading Co." /></label>
          <label className="field"><span>Industry segment (optional)</span><input name="industry_segment" placeholder="e.g. Logistics SaaS" /></label>
          <div className="formactions"><button className="btn primary" type="submit">Create tenant</button></div>
        </form>
      </div>
    </div>
  );
}
