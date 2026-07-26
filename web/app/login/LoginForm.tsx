"use client";

import { signInAction } from "./actions";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

export default function LoginForm({ error, message }: { error?: string; message?: string }) {
  async function google() {
    const supabase = supabaseBrowser();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  return (
    <div className="auth-card">
      <div className="brand" style={{ padding: "0 0 18px" }}>
        <span className="glyph">C</span> Concludo
      </div>
      <h1 style={{ fontSize: 20 }}>Sign in</h1>
      <p className="sub" style={{ marginBottom: 18 }}>Access your revenue recognition workspace. Accounts are provisioned by your Concludo administrator.</p>

      {error ? <div className="auth-err">{error}</div> : null}
      {message ? <div className="auth-msg">{message}</div> : null}

      <form className="auth-form">
        <label className="field"><span>Email</span><input name="email" type="email" required autoComplete="email" /></label>
        <label className="field"><span>Password</span><input name="password" type="password" required minLength={6} autoComplete="current-password" /></label>
        <div className="auth-actions">
          <button className="btn primary" formAction={signInAction} style={{ flex: 1 }}>Sign in</button>
        </div>
        <a className="crumb" href="/auth/forgot" style={{ marginTop: 2 }}>Forgot password?</a>
      </form>

      <div className="auth-divider"><span>or</span></div>

      <button className="btn google" onClick={google} type="button">
        <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M22.5 12.2c0-.7-.06-1.4-.18-2.05H12v3.9h5.9a5.05 5.05 0 0 1-2.19 3.31v2.74h3.54c2.07-1.9 3.25-4.72 3.25-7.9z"/><path fill="#34A853" d="M12 23c2.95 0 5.43-.98 7.24-2.65l-3.54-2.74c-.98.66-2.24 1.05-3.7 1.05-2.85 0-5.26-1.92-6.12-4.5H2.22v2.83A11 11 0 0 0 12 23z"/><path fill="#FBBC05" d="M5.88 14.16a6.6 6.6 0 0 1 0-4.32V7.01H2.22a11 11 0 0 0 0 9.98l3.66-2.83z"/><path fill="#EA4335" d="M12 5.38c1.6 0 3.05.55 4.19 1.64l3.14-3.14A11 11 0 0 0 12 1 11 11 0 0 0 2.22 7.01l3.66 2.83C6.74 7.3 9.15 5.38 12 5.38z"/></svg>
        Continue with Google
      </button>
    </div>
  );
}
