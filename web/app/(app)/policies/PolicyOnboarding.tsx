"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createPolicy } from "./actions";

type Stage = "onboard" | "upload" | "analyzing" | "report" | "generated";
type Path = "have" | "none";

const REPORT = [
  { kind: "critical", tag: "Compliance conflict", head: "Implementation fees recognized at contract signing", body: "The policy recognizes one-time implementation and onboarding fees in full at signing. This conflicts with over-time recognition where the work has no alternative use and there is an enforceable right to payment for performance completed to date.", cite: "ASC 606-10-25-27(c)" },
  { kind: "warning", tag: "Compliance conflict", head: "Commission costs expensed as incurred", body: "The policy expenses sales commissions as incurred. Incremental costs of obtaining a contract must be capitalized and amortized over the period of benefit, unless the amortization period is one year or less.", cite: "ASC 340-40-25-1" },
  { kind: "info", tag: "Coverage gap", head: "No treatment for usage-based fees with retroactive rebates", body: "Contracts in your portfolio include usage fees with volume rebates that claw back retroactively. The policy has no provision for estimating this variable consideration or applying the constraint.", cite: "ASC 606-10-32-11" },
  { kind: "info", tag: "Coverage gap", head: "No standalone-selling-price method hierarchy", body: "The policy does not state how SSP is established or when the residual method is permitted, so allocations are inconsistent and harder to defend.", cite: "ASC 606-10-32-31 to 32-35" },
];

const DRAFT = [
  "Contract combination & distinctness — ASC 606-10-25-19 to 25-22",
  "Standalone selling price method (market → cost-plus → residual) — ASC 606-10-32-31 to 32-35",
  "Recognition pattern (ratable SaaS; point-in-time services) — ASC 606-10-25-27",
  "Commission capitalization & amortization — ASC 340-40-25-1",
  "Variable consideration & the constraint — ASC 606-10-32-11",
];

export default function PolicyOnboarding() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("onboard");
  const [path, setPath] = useState<Path>("have");
  const [fileName, setFileName] = useState("");
  const [err, setErr] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);
  const [doneSteps, setDoneSteps] = useState(0);

  const steps = path === "have"
    ? ["Parsing policy into provisions", "Mapping each provision to ASC 606 / 340-40", "Detecting compliance conflicts & coverage gaps"]
    : ["Reading example contracts", "Extracting the fact patterns they exercise", "Drafting provisions grounded in the standard"];

  useEffect(() => {
    if (stage !== "analyzing") return;
    setDoneSteps(0);
    let i = 0;
    const t = setInterval(() => {
      i += 1;
      setDoneSteps(i);
      if (i >= steps.length) {
        clearInterval(t);
        setTimeout(() => setStage(path === "have" ? "report" : "generated"), 500);
      }
    }, 750);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  function pickFile(e: React.ChangeEvent<HTMLInputElement>) {
    setErr(undefined);
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.name.toLowerCase().endsWith(".pdf") || f.type !== "application/pdf") {
      setErr("Only PDF files are accepted.");
      e.target.value = "";
      return;
    }
    setFileName(f.name);
  }

  function start(p: Path) { setPath(p); setFileName(""); setErr(undefined); setStage("upload"); }

  function analyze() {
    if (!fileName) { setErr(path === "have" ? "Please upload your policy document to continue." : "Please upload at least one example contract."); return; }
    setStage("analyzing");
  }

  async function persist(kind: "uploaded" | "system_generated") {
    setBusy(true);
    const res = await createPolicy(kind);
    setBusy(false);
    if (res.error) { setErr(res.error); return; }
    router.refresh();
  }

  if (stage === "onboard") {
    return (
      <>
        <div className="choicegrid">
          <button className="choice" onClick={() => start("have")}>
            <div className="cic"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M6 3h9l4 4v14H6z" /><path d="M14 3v5h5" /><path d="M9 13h6M9 17h6" /></svg></div>
            <h3>I have a policy</h3>
            <p>Upload your revenue recognition policy. We&apos;ll parse it into provisions and check each against US GAAP, flagging compliance conflicts and coverage gaps.</p>
            <span className="go">Upload policy →</span>
          </button>
          <button className="choice" onClick={() => start("none")}>
            <div className="cic"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M12 5v14M5 12h14" /></svg></div>
            <h3>I don&apos;t have one yet</h3>
            <p>Upload a few example contracts and we&apos;ll draft a starter policy grounded in the standard and your own fact patterns — recommended as your policy of record, pending review.</p>
            <span className="go">Draft a starter policy →</span>
          </button>
        </div>
      </>
    );
  }

  if (stage === "upload") {
    return (
      <div className="card formcard" style={{ maxWidth: 560, marginTop: 22 }}>
        <h2 style={{ margin: 0 }}>{path === "have" ? "Upload your revenue policy" : "Set up a starter policy"}</h2>
        <p className="sub" style={{ margin: 0 }}>{path === "have" ? "We'll parse it into provisions and check each against ASC 606 / 340-40." : "Upload a couple of example contracts to ground the draft."}</p>
        {err ? <div className="auth-err">{err}</div> : null}
        <label className="dropzone" style={{ cursor: "pointer", display: "block" }}>
          <div className="dt">{path === "have" ? "Drop a policy document" : "Drop example contracts"}</div>
          <div className="ds">PDF only</div>
          {fileName ? <div className="fname">{fileName}</div> : null}
          <input type="file" accept="application/pdf" onChange={pickFile} style={{ display: "none" }} />
        </label>
        <div className="formactions">
          <button className="btn" onClick={() => setStage("onboard")}>Back</button>
          <button className="btn primary" onClick={analyze}>{path === "have" ? "Analyze policy" : "Draft policy"}</button>
        </div>
      </div>
    );
  }

  if (stage === "analyzing") {
    return (
      <div className="card" style={{ padding: 22, marginTop: 22, maxWidth: 560 }}>
        <h2 style={{ marginTop: 0 }}>{path === "have" ? "Analyzing your policy" : "Drafting a policy"}</h2>
        <div className="analyzing">
          {steps.map((s, i) => (
            <div className={`astep${i < doneSteps ? " done" : ""}`} key={i}>
              <span className="sp" />
              <span>{s}…</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (stage === "report") {
    return (
      <div style={{ marginTop: 22 }}>
        <div className="empty-note" style={{ textAlign: "left", marginBottom: 18 }}>
          Illustrative preview. Automated policy analysis ships with the engine&apos;s policy module —
          for now this shows the kind of conflicts and gaps Concludo surfaces. Tracking them creates real gap flags.
        </div>
        {err ? <div className="auth-err" style={{ marginBottom: 12 }}>{err}</div> : null}
        <h2>Compliance conflicts &amp; coverage gaps</h2>
        {REPORT.map((g, i) => (
          <div className={`gapcard ${g.kind}`} key={i}>
            <div className="gaptop"><span className={`gaptag ${g.kind}`}>{g.tag}</span></div>
            <div className="gaphead">{g.head}</div>
            <div className="gapbody">{g.body}</div>
            <span className="gapcite">{g.cite}</span>
          </div>
        ))}
        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <button className="btn primary" disabled={busy} onClick={() => persist("uploaded")}>{busy ? "Saving…" : "Adopt policy & track these gaps"}</button>
          <button className="btn" onClick={() => setStage("onboard")}>Start over</button>
        </div>
      </div>
    );
  }

  // generated
  return (
    <div style={{ marginTop: 22 }}>
      <div style={{ marginBottom: 14 }}><span className="provisional">✦ System-generated · provisional</span></div>
      {err ? <div className="auth-err" style={{ marginBottom: 12 }}>{err}</div> : null}
      <h2>Draft policy — provisions</h2>
      <div className="card" style={{ padding: 20 }}>
        <ul className="steps">
          {DRAFT.map((d, i) => <li key={i}>{d}</li>)}
        </ul>
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
        <button className="btn primary" disabled={busy} onClick={() => persist("system_generated")}>{busy ? "Saving…" : "Adopt as policy of record"}</button>
        <button className="btn" onClick={() => setStage("onboard")}>Start over</button>
      </div>
    </div>
  );
}
