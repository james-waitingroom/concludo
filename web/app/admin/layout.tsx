import { notFound, redirect } from "next/navigation";
import type { ReactNode } from "react";
import Link from "next/link";
import { supabaseServer } from "@/lib/supabaseServer";
import { isPlatformAdmin } from "@/lib/platformAdmin";
import { signOutAction } from "../login/actions";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  // A non-admin (including any tenant user) gets a 404 — the control plane doesn't reveal itself.
  if (!(await isPlatformAdmin(user.id))) notFound();

  return (
    <div className="app">
      <aside className="side">
        <div className="brand"><span className="glyph">C</span> Concludo <span className="admintag">admin</span></div>
        <div className="navlabel">Control plane</div>
        <Link className="navitem active" href="/admin">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 21h18"/><path d="M5 21V7l7-4 7 4v14"/><path d="M9 21v-6h6v6"/></svg>
          Tenants
        </Link>
        <a className="navitem" href="/contracts">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5"/></svg>
          Tenant app
        </a>
        <div className="sidefoot">
          <div style={{ marginBottom: 8 }}>Platform admin<br /><b style={{ color: "var(--ink)" }}>{user.email}</b></div>
          <form action={signOutAction}><button className="signout" type="submit">Sign out</button></form>
        </div>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
