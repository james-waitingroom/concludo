import { supabaseServer } from "@/lib/supabaseServer";
import PolicyOnboarding from "./PolicyOnboarding";

export const dynamic = "force-dynamic";

const date = (d: string | null) => (d ? new Date(d + "T00:00:00").toLocaleDateString("en-US") : "—");
const SOURCE_LABEL: Record<string, string> = { uploaded: "Uploaded", system_generated: "System-generated", hybrid: "Hybrid" };

export default async function PoliciesPage() {
  const db = supabaseServer();
  const { data: policies } = await db
    .from("policies")
    .select("id,standard,version,source,effective_date,created_at")
    .order("created_at", { ascending: false })
    .limit(1);

  const policy = policies?.[0];

  return (
    <div className="content">
      <div className="eyebrow">Revenue · Policies</div>
      <h1>Revenue Recognition Policy</h1>
      <div className="sub">
        Your Policy is the standing set of positions Concludo applies to every contract — and the source of each technical memo.
      </div>

      {!policy ? (
        <PolicyOnboarding />
      ) : (
        <PolicyDetail policyId={policy.id} standard={policy.standard} version={policy.version} source={policy.source} effective={policy.effective_date} />
      )}
    </div>
  );
}

async function PolicyDetail({ policyId, standard, version, source, effective }: { policyId: string; standard: string; version: number; source: string; effective: string | null }) {
  const db = supabaseServer();
  const [{ data: provisions }, { data: gaps }] = await Promise.all([
    db.from("policy_provisions").select("determination_type,company_position,standard_citation").eq("policy_id", policyId),
    db.from("gap_flags").select("type,severity,description,standard_citation,status").eq("policy_id", policyId),
  ]);

  const sevClass = (s: string | null) => (s === "critical" ? "critical" : s === "warning" ? "warning" : "info");

  return (
    <>
      <div className="card" style={{ marginTop: 20, padding: 0 }}>
        <div className="attrs">
          <div className="attr"><div className="k">Standard</div><div className="v">{standard?.replace("_", " ")}</div></div>
          <div className="attr"><div className="k">Version</div><div className="v mono">v{version}</div></div>
          <div className="attr"><div className="k">Source</div><div className="v">{source === "system_generated" ? <span className="provisional">✦ System-generated · provisional</span> : SOURCE_LABEL[source] ?? source}</div></div>
          <div className="attr"><div className="k">Effective</div><div className="v">{date(effective)}</div></div>
        </div>
      </div>

      <div className="sec">
        <h2>Provisions</h2>
        <div className="card">
          <div className="tscroll">
            <table>
              <thead><tr><th>Determination</th><th>Company position</th><th>Citation</th></tr></thead>
              <tbody>
                {(provisions ?? []).map((p, i) => (
                  <tr key={i}>
                    <td className="name" style={{ whiteSpace: "nowrap" }}>{p.determination_type}</td>
                    <td>{p.company_position}</td>
                    <td><span className="gapcite">{p.standard_citation}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {(gaps?.length ?? 0) > 0 && (
        <div className="sec">
          <h2>Tracked gaps · {gaps!.length}</h2>
          {(gaps ?? []).map((g, i) => (
            <div className={`gapcard ${sevClass(g.severity)}`} key={i}>
              <div className="gaptop">
                <span className={`gaptag ${sevClass(g.severity)}`}>{g.type === "compliance" ? "Compliance conflict" : "Coverage gap"}</span>
                <span className="resultcount" style={{ marginLeft: "auto" }}>{g.status}</span>
              </div>
              <div className="gapbody">{g.description}</div>
              <span className="gapcite">{g.standard_citation}</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
