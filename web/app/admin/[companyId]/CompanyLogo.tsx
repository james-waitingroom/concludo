"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setCompanyLogoAction } from "../actions";

export default function CompanyLogo({ companyId, current, initial }: { companyId: string; current: string | null; initial: string }) {
  const router = useRouter();
  const [preview, setPreview] = useState<string | null>(current);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | undefined>();

  function pick(e: React.ChangeEvent<HTMLInputElement>) {
    setErr(undefined);
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) { setErr("Please choose an image file."); return; }
    if (f.size > 500 * 1024) { setErr("Image is too large (max 500KB). Use a smaller, square image."); return; }
    const reader = new FileReader();
    reader.onload = () => { setPreview(String(reader.result)); setDirty(true); };
    reader.readAsDataURL(f);
  }

  async function save(dataUrl: string | null) {
    setBusy(true);
    const res = await setCompanyLogoAction({ companyId, dataUrl });
    setBusy(false);
    if (res.error) { setErr(res.error); return; }
    setDirty(false);
    router.refresh();
  }

  return (
    <div>
      {err ? <div className="auth-err" style={{ marginBottom: 12 }}>{err}</div> : null}
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div className="logopreview">
          {preview ? <img src={preview} alt="Company logo" /> : <span>{initial}</span>}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <label className="btn" style={{ cursor: "pointer" }}>
            Choose image
            <input type="file" accept="image/png,image/jpeg,image/svg+xml" onChange={pick} style={{ display: "none" }} />
          </label>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn primary" disabled={!dirty || busy || !preview} onClick={() => save(preview)}>{busy ? "Saving…" : "Save logo"}</button>
            {current ? <button className="btn" disabled={busy} onClick={() => { setPreview(null); save(null); }}>Remove</button> : null}
          </div>
        </div>
      </div>
      <small className="hint" style={{ marginTop: 10, display: "block" }}>Square PNG or SVG works best. Shown in the tenant&apos;s sidebar. Max 500KB.</small>
    </div>
  );
}
