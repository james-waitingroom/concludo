import { supabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

const date = (d: string | null) => (d ? new Date(d + "T00:00:00").toLocaleDateString("en-US") : "—");
const SOURCE_LABEL: Record<string, string> = { uploaded: "Uploaded", system_generated: "System-generated", hybrid: "Hybrid" };

export default async function PoliciesPage() {
  const db = supabaseServer();
  const { data: policies, error } = await db
    .from("policies")
    .select("id,standard,version,source,effective_date,created_at")
    .order("created_at", { ascending: false });

  const { data: provisions } = await db.from("policy_provisions").select("policy_id");
  const provCount = (id: string) => (provisions ?? []).filter((p) => p.policy_id === id).length;

  return (
    <div className="content">
      <div className="eyebrow">Revenue · Policies</div>
      <h1>Policies</h1>
      <div className="sub">Your accounting policy positions — the company&apos;s stated treatment for each judgment area.</div>

      {error ? (
        <div className="empty-note" style={{ marginTop: 24 }}>Couldn&apos;t load policies: {error.message}</div>
      ) : (policies?.length ?? 0) === 0 ? (
        <div className="empty-note" style={{ marginTop: 24 }}>
          No policies yet. Policies capture how your company applies ASC 606/340-40 — distinctness,
          SSP method, recognition patterns, and commission treatment. Once defined, Concludo checks
          each contract&apos;s judgments against them and flags gaps.
        </div>
      ) : (
        <div className="card" style={{ marginTop: 20 }}>
          <div className="tscroll">
            <table>
              <thead>
                <tr><th>Standard</th><th>Version</th><th>Source</th><th className="r">Provisions</th><th>Effective</th></tr>
              </thead>
              <tbody>
                {(policies ?? []).map((p) => (
                  <tr key={p.id}>
                    <td className="name">{p.standard?.replace("_", " ")}</td>
                    <td className="mono">v{p.version}</td>
                    <td>{SOURCE_LABEL[p.source] ?? p.source}</td>
                    <td className="r mono">{provCount(p.id)}</td>
                    <td>{date(p.effective_date)}</td>
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
