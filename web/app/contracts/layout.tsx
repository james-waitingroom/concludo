import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { supabaseServer } from "@/lib/supabaseServer";
import { getPrimaryCompany } from "@/lib/membership";
import { signOutAction } from "../login/actions";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const companyId = await getPrimaryCompany(user.id);
  if (!companyId) {
    // Authenticated, but no Concludo admin has assigned this user to a company yet.
    return (
      <div className="auth-wrap">
        <div className="auth-card">
          <div className="brand" style={{ padding: "0 0 14px" }}><span className="glyph">C</span> Concludo</div>
          <h1 style={{ fontSize: 19 }}>No workspace assigned</h1>
          <p className="sub" style={{ marginBottom: 18 }}>
            Your account (<b>{user.email}</b>) isn&apos;t assigned to a company yet. Your Concludo
            administrator needs to grant access before you can continue.
          </p>
          <form action={signOutAction}><button className="btn" type="submit" style={{ width: "100%" }}>Sign out</button></form>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <aside className="side">
        <div className="brand"><span className="glyph">C</span> Concludo</div>
        <div className="navlabel">Workspace</div>
        <a className="navitem active" href="/contracts">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 17h6"/></svg>
          Contracts
        </a>
        <div className="sidefoot">
          <div style={{ marginBottom: 8 }}>Signed in as<br /><b style={{ color: "var(--ink)" }}>{user.email}</b></div>
          <form action={signOutAction}><button className="signout" type="submit">Sign out</button></form>
        </div>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
