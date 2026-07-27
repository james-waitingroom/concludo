"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { approveJudgment, reopenJudgment, overrideJudgment } from "./actions";

type Evidence = { clause?: string; quote?: string };
type Conclusion = { value?: string; reasoning_steps?: string[]; rejected_alternatives?: { alternative: string; why_rejected: string }[]; human_override?: string };
type Decision = { decision?: string; approved_by?: string; override_reason?: string } | null;
export type J = {
  id: string;
  judgment_type: string;
  standard_ref: string[] | null;
  contract_evidence: Evidence[] | null;
  ai_proposed_conclusion: Conclusion | null;
  confidence_tier: string | null;
  sensitivity_note: string | null;
  human_decision: Decision;
  status: string;
};

const TIER: Record<string, string> = { observed_high: "Observed · high", observed_low: "Observed · low", benchmark_only: "Benchmark only" };
const STATUS: Record<string, { label: string; cls: string }> = {
  proposed: { label: "Proposed", cls: "in_review" },
  under_review: { label: "Under review", cls: "in_review" },
  approved: { label: "Approved", cls: "active" },
  superseded: { label: "Superseded", cls: "denied" },
};

export default function JudgmentChain({ contractId, judgments }: { contractId: string; judgments: J[] }) {
  return (
    <div>
      {judgments.map((j) => <JudgmentCard key={j.id} contractId={contractId} j={j} />)}
    </div>
  );
}

function JudgmentCard({ contractId, j }: { contractId: string; j: J }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | undefined>();
  const [editing, setEditing] = useState(false);
  const conc = j.ai_proposed_conclusion ?? {};
  const st = STATUS[j.status] ?? { label: j.status, cls: "in_review" };
  const isOverride = j.human_decision?.decision === "override";

  async function run(fn: () => Promise<{ error?: string }>) {
    setBusy(true); setErr(undefined);
    const res = await fn();
    setBusy(false);
    if (res.error) { setErr(res.error); return; }
    setEditing(false);
    router.refresh();
  }

  return (
    <div className="jcard">
      <div className="jhead">
        <span className="jtype">{j.judgment_type.replace(/_/g, " ")}</span>
        <span className={`pill ${st.cls}`}><span className="d" />{st.label}</span>
        {j.confidence_tier ? <span className="badge">{TIER[j.confidence_tier] ?? j.confidence_tier}</span> : null}
        {isOverride ? <span className="ovbadge">Human override</span> : null}
      </div>

      <div className="jconc">{conc.value}</div>

      {Array.isArray(j.standard_ref) && j.standard_ref.length > 0 && (
        <div>{j.standard_ref.map((s, k) => <span className="chip" key={k}>{s}</span>)}</div>
      )}

      {Array.isArray(j.contract_evidence) && j.contract_evidence.length > 0 && (
        <div className="prov">
          <div className="provlabel">Evidence from the contract</div>
          {j.contract_evidence.map((e, k) => (
            <div className="quote" key={k}><span className="qclause">{e.clause}</span>“{e.quote}”</div>
          ))}
        </div>
      )}

      {Array.isArray(conc.reasoning_steps) && conc.reasoning_steps.length > 0 && (
        <ul className="steps">{conc.reasoning_steps.map((s, k) => <li key={k}>{s}</li>)}</ul>
      )}

      {Array.isArray(conc.rejected_alternatives) && conc.rejected_alternatives.length > 0 && (
        <div className="rejected">
          <div className="provlabel">Alternatives considered &amp; rejected</div>
          {conc.rejected_alternatives.map((r, k) => (
            <div className="rej" key={k}><b>{r.alternative}</b> — {r.why_rejected}</div>
          ))}
        </div>
      )}

      {j.sensitivity_note ? <div className="sensnote"><b>Sensitivity.</b> {j.sensitivity_note}</div> : null}

      {isOverride && j.human_decision?.override_reason ? (
        <div className="decision override"><b>Override</b> by {j.human_decision.approved_by}: {j.human_decision.override_reason}</div>
      ) : j.status === "approved" && j.human_decision ? (
        <div className="decision"><b>Approved</b> by {j.human_decision.approved_by}</div>
      ) : null}

      {err ? <div className="auth-err" style={{ marginTop: 10 }}>{err}</div> : null}

      {editing ? (
        <OverrideForm
          initial={conc.value ?? ""}
          busy={busy}
          onCancel={() => setEditing(false)}
          onSave={(newValue, reason) => run(() => overrideJudgment({ id: j.id, contractId, newValue, reason }))}
        />
      ) : (
        <div className="jactions">
          {j.status === "approved" ? (
            <button className="btn" disabled={busy} onClick={() => run(() => reopenJudgment({ id: j.id, contractId }))}>Reopen</button>
          ) : (
            <>
              <button className="btn primary" disabled={busy} onClick={() => run(() => approveJudgment({ id: j.id, contractId }))}>Approve</button>
              <button className="btn" disabled={busy} onClick={() => setEditing(true)}>Override</button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function OverrideForm({ initial, busy, onSave, onCancel }: { initial: string; busy: boolean; onSave: (v: string, r: string) => void; onCancel: () => void }) {
  const [value, setValue] = useState(initial);
  const [reason, setReason] = useState("");
  return (
    <div className="overrideform">
      <label className="field"><span>Revised conclusion</span><textarea value={value} onChange={(e) => setValue(e.target.value)} rows={2} /></label>
      <label className="field"><span>Reason for override (recorded on the audit trail)</span><textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} placeholder="Why the AI conclusion is being changed…" /></label>
      <div className="jactions">
        <button className="btn primary" disabled={busy} onClick={() => onSave(value, reason)}>Save override</button>
        <button className="btn" disabled={busy} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}
