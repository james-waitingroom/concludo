"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { createContractRecord, finalizeContractSource } from "./actions";

export default function NewContractForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | undefined>();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(undefined);
    const form = e.currentTarget;
    const name = (form.elements.namedItem("name") as HTMLInputElement).value.trim();
    const customer = (form.elements.namedItem("customer") as HTMLInputElement).value.trim();
    const file = (form.elements.namedItem("file") as HTMLInputElement).files?.[0];

    if (!name || !customer) { setErr("Contract name and customer are required."); return; }
    if (!file) { setErr("Please attach the contract PDF."); return; }
    if (!file.name.toLowerCase().endsWith(".pdf") || file.type !== "application/pdf") { setErr("Only PDF files are accepted."); return; }

    setBusy(true);

    const created = await createContractRecord({ name, customer });
    if (created.error) { setErr(created.error); setBusy(false); return; }
    const contractId = created.contractId!;
    const companyId = created.companyId!;

    const path = `${companyId}/${contractId}/${file.name}`;
    const supabase = supabaseBrowser();
    const up = await supabase.storage
      .from("contract-sources")
      .upload(path, file, { contentType: "application/pdf", upsert: true });
    if (up.error) { setErr("Upload failed: " + up.error.message); setBusy(false); return; }

    const fin = await finalizeContractSource({ contractId, path, fileName: file.name });
    if (fin.error) { setErr(fin.error); setBusy(false); return; }

    router.push(`/contracts/${contractId}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="card formcard">
      {err ? <div className="auth-err">{err}</div> : null}
      <label className="field">
        <span>Contract name</span>
        <input name="name" required placeholder="e.g. Platform + Distinct Implementation" />
      </label>
      <label className="field">
        <span>Customer</span>
        <input name="customer" required placeholder="e.g. Aldermarsh Logistics, LLC" />
      </label>
      <label className="field">
        <span>Source PDF</span>
        <input name="file" type="file" accept="application/pdf" required />
        <small className="hint">PDF only. Uploaded directly to secure storage; extraction and judgments run separately.</small>
      </label>
      <div className="formactions">
        <Link href="/contracts" className="btn">Cancel</Link>
        <button className="btn primary" type="submit" disabled={busy}>{busy ? "Adding…" : "Add contract"}</button>
      </div>
    </form>
  );
}
