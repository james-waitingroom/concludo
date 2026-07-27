import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { provisionUserAction, assignUserAction, removeMemberAction, resetPasswordAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function TenantDetail({
  params,
  searchParams,
}: {
  params: { companyId: string };
  searchParams: { error?: string; message?: string };
}) {
  const db = supabaseAdmin();
  const { data: company } = await db.from("companies").select("*").eq("id", params.companyId).single();
  if (!company) notFound();

  const { data: memberRows } = await db.from("company_members").select("user_id,role").eq("company_id", params.companyId);
  const { data: userList } = await db.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const emailById = new Map((userList?.users ?? []).map((u) => [u.id, u.email] as const));
  const members = (memberRows ?? []).map((m) => ({ ...m, email: emailById.get(m.user_id) ?? m.user_id }));

  return (
    <div className="content" style={{ maxWidth: 820 }}>
      <div className="crumb"><Link href="/admin">Tenants</Link> / {company.name}</div>
      <h1>{company.name}</h1>
      <div className="sub">{company.industry_segment ?? "—"} · {members.length} user{members.length === 1 ? "" : "s"}</div>

      {searchParams.error ? <div className="auth-err" style={{ marginTop: 16 }}>{searchParams.error}</div> : null}
      {searchParams.message ? <div className="auth-msg" style={{ marginTop: 16 }}>{searchParams.message}</div> : null}

      <div className="sec">
        <h2>Users with access</h2>
        <div className="card">
          <div className="tscroll">
            <table>
              <thead><tr><th>Email</th><th>Role</th><th>Reset password</th><th></th></tr></thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.user_id}>
                    <td><span className="name">{m.email}</span><span className="cid">{m.user_id}</span></td>
                    <td>{m.role}</td>
                    <td>
                      <form action={resetPasswordAction} className="inline-form">
                        <input type="hidden" name="companyId" value={params.companyId} />
                        <input type="hidden" name="userId" value={m.user_id} />
                        <input name="password" type="text" required minLength={8} placeholder="new temp password" className="inline-input" />
                        <button className="btn" type="submit">Reset</button>
                      </form>
                    </td>
                    <td className="r">
                      <form action={removeMemberAction}>
                        <input type="hidden" name="companyId" value={params.companyId} />
                        <input type="hidden" name="userId" value={m.user_id} />
                        <button className="linkbtn" type="submit">Remove</button>
                      </form>
                    </td>
                  </tr>
                ))}
                {members.length === 0 && <tr><td colSpan={4} style={{ color: "var(--muted)" }}>No users yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="sec">
        <h2>Provision a new user</h2>
        <div className="sub" style={{ marginTop: -8, marginBottom: 12 }}>Creates the account and grants access to this tenant. Share the temporary password securely.</div>
        <form action={provisionUserAction} className="card formcard" style={{ maxWidth: 520 }}>
          <input type="hidden" name="companyId" value={params.companyId} />
          <label className="field"><span>Full name</span><input name="full_name" required placeholder="e.g. Jordan Rivera" /></label>
          <label className="field"><span>Email</span><input name="email" type="email" required placeholder="person@company.com" /></label>
          <label className="field"><span>Temporary password</span><input name="password" type="text" required minLength={8} placeholder="min 8 characters" /></label>
          <label className="field"><span>Role</span>
            <select name="role" defaultValue="member" className="select">
              <option value="member">member</option>
              <option value="admin">admin</option>
            </select>
          </label>
          <div className="formactions"><button className="btn primary" type="submit">Create &amp; grant access</button></div>
        </form>
      </div>

      <div className="sec">
        <h2>Grant access to an existing user</h2>
        <div className="sub" style={{ marginTop: -8, marginBottom: 12 }}>For someone who already has a Concludo account (e.g. works with multiple tenants).</div>
        <form action={assignUserAction} className="card formcard" style={{ maxWidth: 520 }}>
          <input type="hidden" name="companyId" value={params.companyId} />
          <label className="field"><span>Email</span><input name="email" type="email" required placeholder="person@company.com" /></label>
          <label className="field"><span>Role</span>
            <select name="role" defaultValue="member" className="select">
              <option value="member">member</option>
              <option value="admin">admin</option>
            </select>
          </label>
          <div className="formactions"><button className="btn" type="submit">Grant access</button></div>
        </form>
      </div>
    </div>
  );
}
