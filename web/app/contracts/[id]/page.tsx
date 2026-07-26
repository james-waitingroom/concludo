import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

const money = (n: number | null) => (n == null ? "—" : "$" + Number(n).toLocaleString("en-US"));
const STATUS_LABEL: Record<string, string> = {
  draft: "Memo draft", in_review: "In review", active: "Active", amended: "Amended", terminated: "Terminated", blocked: "Blocked",
};

function Attr({ k, v }: { k: string; v: React.ReactNode }) {
  const empty = v == null || v === "";
  return (
    <div className="attr">
      <div className="k">{k}</div>
      <div className={`v${empty ? " empty" : ""}`}>{empty ? "—" : v}</div>
    </div>
  );
}

export default async function ContractDetail({ params }: { params: { id: string } }) {
  const db = supabaseServer();
  const { data: c } = await db.from("contracts").select("*").eq("id", params.id).single();
  if (!c) notFound();

  const { data: pos } = await db
    .from("performance_obligations")
    .select("description,is_distinct,ssp_method,ssp_value,ssp_confidence_tier,allocated_price,recognition_type,recognition_method")
    .eq("contract_id", params.id);

  const { data: judgments } = await db
    .from("judgments")
    .select("judgment_type,standard_ref,ai_proposed_conclusion,confidence_tier,status")
    .eq("contract_id", params.id)
    .eq("status", "approved")
    .order("created_at");

  const hasAnalysis = (judgments?.length ?? 0) > 0;

  return (
    <div className="content">
      <div className="crumb"><Link href="/contracts">Contracts</Link> / {c.customer}</div>

      <div className="card">
        <div className="record-head">
          <div>
            <div className="eyebrow">Revenue · Contract</div>
            <div className="titlerow">
              <h1>{c.name}</h1>
              <span className={`pill ${c.status}`}><span className="d"></span>{STATUS_LABEL[c.status] ?? c.status}</span>
              <span className="refchip">{String(c.id).slice(0, 8)}</span>
            </div>
            <div className="sub">{c.customer}</div>
          </div>
          <span className="spacer"></span>
          {c.source_file_path ? (
            <a className="dlbtn" href={`/api/contracts/${c.id}/source`}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 3v12M8 11l4 4 4-4"/><path d="M5 21h14"/></svg>
              Download source
            </a>
          ) : null}
        </div>
        <div className="attrs">
          <Attr k="Standard" v={c.standard} />
          <Attr k="Source document" v={c.source_file_name} />
          <Attr k="Entity" v={c.entity} />
          <Attr k="Currency" v={c.currency} />
          <Attr k="Total Contract Value" v={<span className="mono">{money(c.transaction_price)}</span>} />
          <Attr k="Effective date" v={c.effective_date} />
          <Attr k="Term (months)" v={c.term_months} />
          <Attr k="Performance obligations" v={pos?.length ?? 0} />
        </div>
      </div>

      {(pos?.length ?? 0) > 0 && (
        <div className="sec">
          <h2>Performance obligations &amp; allocation</h2>
          <div className="card">
            <div className="tscroll">
              <table>
                <thead>
                  <tr>
                    <th>Performance obligation</th>
                    <th>Distinct</th>
                    <th>SSP method</th>
                    <th className="r">SSP</th>
                    <th>Recognition</th>
                    <th className="r">Allocated</th>
                  </tr>
                </thead>
                <tbody>
                  {(pos ?? []).map((p, i) => (
                    <tr key={i}>
                      <td>{p.description}</td>
                      <td>{p.is_distinct == null ? "—" : p.is_distinct ? "Yes" : "No"}</td>
                      <td>{p.ssp_method ?? "—"}</td>
                      <td className="r mono">{money(p.ssp_value)}</td>
                      <td>{p.recognition_type ? `${p.recognition_type}` : "—"}</td>
                      <td className="r mono">{money(p.allocated_price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <div className="sec">
        <h2>Judgment chain {hasAnalysis ? `· ${judgments!.length} approved` : ""}</h2>
        {hasAnalysis ? (
          (judgments ?? []).map((j, i) => {
            const conc = (j.ai_proposed_conclusion as { value?: string; reasoning_steps?: string[] }) ?? {};
            return (
              <div className="jcard" key={i}>
                {j.confidence_tier ? <span className="badge">{j.confidence_tier}</span> : null}
                <div className="jtype">{j.judgment_type.replace(/_/g, " ")}</div>
                <div className="jconc">{conc.value}</div>
                {Array.isArray(j.standard_ref) && j.standard_ref.length > 0 && (
                  <div>{j.standard_ref.map((s: string, k: number) => <span className="chip" key={k}>{s}</span>)}</div>
                )}
                {Array.isArray(conc.reasoning_steps) && conc.reasoning_steps.length > 0 && (
                  <ul className="steps">{conc.reasoning_steps.map((s, k) => <li key={k}>{s}</li>)}</ul>
                )}
              </div>
            );
          })
        ) : (
          <div className="empty-note">
            No judgments stored for this contract yet. Run <code>npm run db:persist</code> in the engine
            to generate and store its chain (Brightwell is wired up as the first worked example).
          </div>
        )}
      </div>
    </div>
  );
}
