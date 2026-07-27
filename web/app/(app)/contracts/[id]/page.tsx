import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabaseServer";
import { computeSchedule, type POForSchedule } from "@/lib/schedule";
import JudgmentChain, { type J } from "./JudgmentChain";

export const dynamic = "force-dynamic";

const money = (n: number | null) => (n == null ? "—" : "$" + Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
const money0 = (n: number) => "$" + Math.round(n).toLocaleString("en-US");
const date = (d: string | null) => (d ? new Date(d + "T00:00:00").toLocaleDateString("en-US") : "—");
const STATUS_LABEL: Record<string, string> = { active: "Active", in_review: "In Review", denied: "Denied" };
const ORIGIN_LABEL: Record<string, string> = { upload: "Manual upload", crm: "CRM integration" };

function Attr({ k, v }: { k: string; v: React.ReactNode }) {
  const empty = v == null || v === "";
  return (<div className="attr"><div className="k">{k}</div><div className={`v${empty ? " empty" : ""}`}>{empty ? "—" : v}</div></div>);
}

export default async function ContractDetail({ params }: { params: { id: string } }) {
  const db = supabaseServer();
  const { data: c } = await db.from("contracts").select("*").eq("id", params.id).single();
  if (!c) notFound();

  const { data: pos } = await db
    .from("performance_obligations")
    .select("description,is_distinct,ssp_method,ssp_value,allocated_price,recognition_type,start_month,end_month")
    .eq("contract_id", params.id);

  const { data: judgmentsRaw } = await db
    .from("judgments")
    .select("id,judgment_type,standard_ref,contract_evidence,ai_proposed_conclusion,confidence_tier,sensitivity_note,human_decision,status")
    .eq("contract_id", params.id)
    .order("created_at");

  const all = (judgmentsRaw ?? []) as J[];
  const latest = all.filter((j) => j.status !== "superseded");
  const pending = latest.filter((j) => j.status === "proposed" || j.status === "under_review").length;
  const approved = latest.filter((j) => j.status === "approved").length;
  const supersededCount = all.length - latest.length;

  const schedule = computeSchedule((pos ?? []) as POForSchedule[]);

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
        </div>
        <div className="attrs">
          <Attr k="Total Contract Value" v={<span className="mono">{money(c.transaction_price)}</span>} />
          <Attr k="Currency" v={c.currency} />
          <Attr k="Standard" v={c.standard?.replace("_", " ")} />
          <Attr k="Status" v={STATUS_LABEL[c.status] ?? c.status} />
          <Attr k="Customer" v={c.customer} />
          <Attr k="Entity" v={c.entity} />
          <Attr k="Effective date" v={date(c.effective_date)} />
          <Attr k="Term (months)" v={c.term_months} />
          <Attr k="Contract start date" v={date(c.term_start)} />
          <Attr k="Contract end date" v={date(c.term_end)} />
          <Attr k="Source" v={ORIGIN_LABEL[c.source_origin ?? ""] ?? c.source_origin} />
          <Attr k="Source document" v={c.source_file_path ? (
            <a className="filelink" href={`/api/contracts/${c.id}/source`}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 3H6v18h12V7z" /><path d="M14 3v4h4" /></svg>
              {c.source_file_name ?? "Download PDF"}
            </a>) : null} />
        </div>
      </div>

      {(pending > 0 || schedule.unscheduled.length > 0) && (
        <div className="callouts">
          {pending > 0 && (
            <div className="callout review">
              <b>{pending} judgment{pending === 1 ? "" : "s"} awaiting your review.</b> Approve each proposed conclusion or override it with reasoning — overrides are recorded on the audit trail.
            </div>
          )}
          {schedule.unscheduled.map((u, i) => (
            <div className="callout escalate" key={i}>
              <b>Escalation — {u.description}.</b> {money0(u.amount)} can&apos;t be scheduled: {u.reason}. This is held back rather than guessed.
            </div>
          ))}
        </div>
      )}

      {(pos?.length ?? 0) > 0 && (
        <div className="sec">
          <h2>Performance obligations &amp; allocation</h2>
          <div className="card">
            <div className="tscroll">
              <table>
                <thead><tr><th>Performance obligation</th><th>Distinct</th><th>SSP method</th><th className="r">SSP</th><th>Recognition</th><th className="r">Allocated</th></tr></thead>
                <tbody>
                  {(pos ?? []).map((p, i) => (
                    <tr key={i}>
                      <td>{p.description}</td>
                      <td>{p.is_distinct == null ? "—" : p.is_distinct ? "Yes" : "No"}</td>
                      <td>{p.ssp_method ?? "—"}</td>
                      <td className="r mono">{money(p.ssp_value)}</td>
                      <td>{p.recognition_type ?? "—"}</td>
                      <td className="r mono">{money(p.allocated_price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {schedule.rows.length > 0 && (
        <div className="sec">
          <h2>Revenue recognition schedule</h2>
          <div className="statgrid" style={{ marginTop: 0, marginBottom: 16 }}>
            <div className="stat"><div className="statlabel">Scheduled revenue</div><div className="statvalue">{money0(schedule.scheduledTotal)}</div></div>
            <div className="stat"><div className="statlabel">Recognized to date</div><div className="statvalue">{money0(schedule.recognizedToDate)}</div></div>
            <div className="stat"><div className="statlabel">Deferred</div><div className="statvalue">{money0(schedule.deferred)}</div></div>
            <div className="stat"><div className="statlabel">Held (unscheduled)</div><div className="statvalue">{money0(schedule.unscheduled.reduce((s, u) => s + u.amount, 0))}</div></div>
          </div>
          <div className="card">
            <div className="tscroll" style={{ maxHeight: 340, overflowY: "auto" }}>
              <table>
                <thead><tr><th>Month</th><th className="r">Recognized</th><th className="r">Cumulative</th><th className="r">% complete</th></tr></thead>
                <tbody>
                  {schedule.rows.map((r) => (
                    <tr key={r.month}>
                      <td className="mono">{r.month}</td>
                      <td className="r mono">{money0(r.recognized)}</td>
                      <td className="r mono">{money0(r.cumulative)}</td>
                      <td className="r mono">{schedule.scheduledTotal ? Math.round((r.cumulative / schedule.scheduledTotal) * 100) : 0}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <div className="sec">
        <h2>Judgment chain {latest.length > 0 ? `· ${approved} approved · ${pending} pending` : ""}{supersededCount > 0 ? ` · ${supersededCount} superseded` : ""}</h2>
        {latest.length > 0 ? (
          <JudgmentChain contractId={c.id} judgments={latest} />
        ) : (
          <div className="empty-note">
            No judgments stored for this contract yet. Run <code>npm run db:persist</code> in the engine to generate its chain.
          </div>
        )}
      </div>
    </div>
  );
}
