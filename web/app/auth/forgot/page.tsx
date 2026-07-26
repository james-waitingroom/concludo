"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | undefined>();

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(undefined);
    setBusy(true);
    const email = (e.currentTarget.elements.namedItem("email") as HTMLInputElement).value.trim();
    const supabase = supabaseBrowser();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset`,
    });
    setBusy(false);
    if (error) { setErr(error.message); return; }
    // Always show success (don't reveal whether the address has an account).
    setSent(true);
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="brand" style={{ padding: "0 0 18px" }}><span className="glyph">C</span> Concludo</div>
        <h1 style={{ fontSize: 20 }}>Reset your password</h1>
        <p className="sub" style={{ marginBottom: 18 }}>We&apos;ll email you a link to set a new password.</p>

        {err ? <div className="auth-err">{err}</div> : null}

        {sent ? (
          <>
            <div className="auth-msg">If an account exists for that email, a reset link is on its way. Check your inbox.</div>
            <a className="btn" href="/login" style={{ width: "100%", marginTop: 16 }}>Back to sign in</a>
          </>
        ) : (
          <form className="auth-form" onSubmit={submit}>
            <label className="field"><span>Email</span><input name="email" type="email" required autoComplete="email" /></label>
            <div className="auth-actions">
              <button className="btn primary" type="submit" style={{ flex: 1 }} disabled={busy}>{busy ? "Sending…" : "Send reset link"}</button>
            </div>
            <a className="crumb" href="/login" style={{ marginTop: 4 }}>Back to sign in</a>
          </form>
        )}
      </div>
    </div>
  );
}
