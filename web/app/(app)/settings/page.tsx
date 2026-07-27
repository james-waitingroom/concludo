import { supabaseServer } from "@/lib/supabaseServer";
import { getPrimaryCompany } from "@/lib/membership";
import { changePasswordAction } from "./actions";
import ThemeToggle from "./ThemeToggle";

export const dynamic = "force-dynamic";

const INTEGRATIONS = [
  { name: "Salesforce", desc: "Sync contracts & CRM opportunities" },
  { name: "HubSpot", desc: "Import deals as contract sources" },
  { name: "NetSuite", desc: "Post revenue & journal entries" },
  { name: "QuickBooks", desc: "Export recognized revenue" },
  { name: "Stripe", desc: "Reconcile invoiced & paid amounts" },
  { name: "Google Drive", desc: "Pull contract documents" },
];

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
    <div className="content wide">
      <div className="eyebrow">Account</div>
      <h1>Settings</h1>
      <div className="sub">Manage your profile, security, appearance, and workspace preferences.</div>

      {searchParams.error ? <div className="auth-err" style={{ marginTop: 16 }}>{searchParams.error}</div> : null}
      {searchParams.message ? <div className="auth-msg" style={{ marginTop: 16 }}>{searchParams.message}</div> : null}

      <div className="setgrid">
        <div className="panel">
          <h2>Profile</h2>
          <div className="field"><span>Full name</span><input value={fullName || "—"} disabled /></div>
          <div className="field"><span>Email</span><input value={user?.email ?? ""} disabled /></div>
          <small className="hint">Your name and email are set by your Concludo administrator.</small>
        </div>

        <div className="panel">
          <h2>Security</h2>
          <form action={changePasswordAction}>
            <label className="field"><span>New password</span><input name="password" type="password" minLength={8} required autoComplete="new-password" /></label>
            <label className="field"><span>Confirm password</span><input name="confirm" type="password" minLength={8} required autoComplete="new-password" /></label>
            <div className="formactions"><button className="btn primary" type="submit">Change password</button></div>
          </form>
        </div>

        <div className="panel">
          <h2>Appearance</h2>
          <div className="field" style={{ gap: 8 }}><span>Theme</span><ThemeToggle /></div>
          <small className="hint">System follows your device setting.</small>
        </div>

        <div className="panel">
          <h2>Organization</h2>
          <div className="field"><span>Company</span><input value={companyName} disabled /></div>
          <div className="field"><span>Your role</span><input value={role} disabled /></div>
          <small className="hint">Membership and roles are managed in the Concludo admin console.</small>
        </div>

        <div className="panel">
          <h2>Revenue preferences</h2>
          <label className="field"><span>Functional currency</span>
            <select className="select" defaultValue="USD" disabled><option>USD</option><option>EUR</option><option>GBP</option></select>
          </label>
          <label className="field"><span>Fiscal year end</span>
            <select className="select" defaultValue="December" disabled><option>December</option><option>March</option><option>June</option><option>September</option></select>
          </label>
          <small className="hint">Enabled with the reporting module.</small>
        </div>

        <div className="panel">
          <h2>Notifications</h2>
          <label className="checkrow"><input type="checkbox" defaultChecked disabled /> Contract needs review</label>
          <label className="checkrow" style={{ marginTop: 10 }}><input type="checkbox" defaultChecked disabled /> Judgment escalated</label>
          <label className="checkrow" style={{ marginTop: 10 }}><input type="checkbox" disabled /> Weekly revenue summary</label>
          <small className="hint" style={{ marginTop: 10, display: "block" }}>Delivery arrives with the reporting module.</small>
        </div>

        <div className="panel span2">
          <h2>Integrations</h2>
          <div className="sub" style={{ marginTop: -6, marginBottom: 14 }}>Connect your CRM, GL, and billing systems. To be developed.</div>
          <div className="intgrid">
            {INTEGRATIONS.map((i) => (
              <div className="intcard" key={i.name}>
                <div className="intname">{i.name}</div>
                <div className="intdesc">{i.desc}</div>
                <span className="intsoon">Coming soon</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
