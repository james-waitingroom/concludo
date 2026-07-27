import { supabaseServer } from "@/lib/supabaseServer";
import { getPrimaryCompany } from "@/lib/membership";
import { updateProfileAction, changePasswordAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function SettingsPage({ searchParams }: { searchParams: { error?: string; message?: string } }) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  const fullName = (user?.user_metadata?.full_name as string) ?? "";

  const companyId = user ? await getPrimaryCompany(user.id) : null;
  let companyName = "—";
  let role = "—";
  if (companyId) {
    const [{ data: co }, { data: mem }] = await Promise.all([
      supabase.from("companies").select("name").eq("id", companyId).single(),
      supabase.from("company_members").select("role").eq("company_id", companyId).eq("user_id", user!.id).single(),
    ]);
    companyName = co?.name ?? "—";
    role = mem?.role ?? "—";
  }

  return (
    <div className="content" style={{ maxWidth: 720 }}>
      <div className="eyebrow">Account</div>
      <h1>Settings</h1>
      <div className="sub">Manage your profile, security, and workspace preferences.</div>

      {searchParams.error ? <div className="auth-err" style={{ marginTop: 16 }}>{searchParams.error}</div> : null}
      {searchParams.message ? <div className="auth-msg" style={{ marginTop: 16 }}>{searchParams.message}</div> : null}

      <div className="sec">
        <h2>Profile</h2>
        <form action={updateProfileAction} className="card formcard">
          <label className="field"><span>Display name</span><input name="full_name" defaultValue={fullName} placeholder="Your name" /></label>
          <label className="field"><span>Email</span><input value={user?.email ?? ""} disabled /><small className="hint">Email changes are managed by your administrator.</small></label>
          <div className="formactions"><button className="btn primary" type="submit">Save profile</button></div>
        </form>
      </div>

      <div className="sec">
        <h2>Security</h2>
        <form action={changePasswordAction} className="card formcard">
          <label className="field"><span>New password</span><input name="password" type="password" minLength={8} required autoComplete="new-password" /></label>
          <label className="field"><span>Confirm password</span><input name="confirm" type="password" minLength={8} required autoComplete="new-password" /></label>
          <div className="formactions"><button className="btn primary" type="submit">Change password</button></div>
        </form>
      </div>

      <div className="sec">
        <h2>Organization</h2>
        <div className="card formcard">
          <div className="attrs" style={{ padding: 0, gridTemplateColumns: "repeat(2,1fr)" }}>
            <div className="attr"><div className="k">Company</div><div className="v">{companyName}</div></div>
            <div className="attr"><div className="k">Your role</div><div className="v">{role}</div></div>
          </div>
          <small className="hint">Company membership and roles are managed in the Concludo admin console.</small>
        </div>
      </div>

      <div className="sec">
        <h2>Revenue preferences</h2>
        <div className="card formcard">
          <label className="field"><span>Functional currency</span>
            <select className="select" defaultValue="USD" disabled>
              <option>USD</option><option>EUR</option><option>GBP</option>
            </select>
          </label>
          <label className="field"><span>Fiscal year end</span>
            <select className="select" defaultValue="December" disabled>
              <option>December</option><option>March</option><option>June</option><option>September</option>
            </select>
          </label>
          <small className="hint">Workspace-level accounting defaults. Editing these will be enabled with the reporting module.</small>
        </div>
      </div>

      <div className="sec">
        <h2>Notifications</h2>
        <div className="card formcard">
          <label className="checkrow"><input type="checkbox" defaultChecked disabled /> Email me when a contract needs review</label>
          <label className="checkrow"><input type="checkbox" defaultChecked disabled /> Email me when a judgment is escalated</label>
          <label className="checkrow"><input type="checkbox" disabled /> Weekly revenue summary</label>
          <small className="hint">Notification delivery is coming with the reporting module.</small>
        </div>
      </div>
    </div>
  );
}
