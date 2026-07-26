"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

export default function ResetPasswordPage() {
  const [checking, setChecking] = useState(true);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | undefined>();
  const [msg, setMsg] = useState<string | undefined>();

  // On load, establish the recovery session from the link (PKCE ?code=... or hash token).
  useEffect(() => {
    const supabase = supabaseBrowser();
    (async () => {
      const code = new URL(window.location.href).searchParams.get("code");
      if (code) {
        try { await supabase.auth.exchangeCodeForSession(code); } catch { /* may already be consumed */ }
      }
      const { data } = await supabase.auth.getSession();
      if (data.session) setReady(true);
      else setErr("This reset link is invalid or has expired. Request a new one.");
      setChecking(false);
    })();
  }, []);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(undefined);
    const form = e.currentTarget;
    const pw = (form.elements.namedItem("password") as HTMLInputElement).value;
    const pw2 = (form.elements.namedItem("confirm") as HTMLInputElement).value;
    if (pw.length < 8) { setErr("Password must be at least 8 characters."); return; }
    if (pw !== pw2) { setErr("Passwords do not match."); return; }

    setBusy(true);
    const supabase = supabaseBrowser();
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) { setErr(error.message); return; }
    setMsg("Password updated. Redirecting to sign in…");
    setTimeout(() => {
      window.location.href = "/login?message=" + encodeURIComponent("Password updated. Please sign in.");
    }, 1200);
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="brand" style={{ padding: "0 0 18px" }}><span className="glyph">C</span> Concludo</div>
        <h1 style={{ fontSize: 20 }}>Set a new password</h1>
        <p className="sub" style={{ marginBottom: 18 }}>Choose a new password for your account.</p>

        {err ? <div className="auth-err">{err}</div> : null}
        {msg ? <div className="auth-msg">{msg}</div> : null}

        {checking ? (
          <p className="sub">Verifying your link…</p>
        ) : ready ? (
          <form className="auth-form" onSubmit={submit}>
            <label className="field"><span>New password</span><input name="password" type="password" required minLength={8} autoComplete="new-password" /></label>
            <label className="field"><span>Confirm password</span><input name="confirm" type="password" required minLength={8} autoComplete="new-password" /></label>
            <div className="auth-actions">
              <button className="btn primary" type="submit" style={{ flex: 1 }} disabled={busy}>{busy ? "Updating…" : "Update password"}</button>
            </div>
          </form>
        ) : (
          <a className="btn" href="/auth/forgot" style={{ width: "100%" }}>Request a new link</a>
        )}
      </div>
    </div>
  );
}
