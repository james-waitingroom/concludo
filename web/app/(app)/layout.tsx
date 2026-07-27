import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { supabaseServer } from "@/lib/supabaseServer";
import { getPrimaryCompany } from "@/lib/membership";
import { isPlatformAdmin } from "@/lib/platformAdmin";
import { signOutAction } from "@/app/login/actions";
import Sidebar from "@/components/Sidebar";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const companyId = await getPrimaryCompany(user.id);
  if (!companyId) {
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

  const [admin, { data: company }] = await Promise.all([
    isPlatformAdmin(user.id),
    supabase.from("companies").select("*").eq("id", companyId).single(),
  ]);

  const fullName = (user.user_metadata?.full_name as string) ?? "";
  const firstName = fullName.trim().split(/\s+/)[0] || (user.email ?? "").split("@")[0];

  return (
    <div className="app">
      <Sidebar
        userEmail={user.email ?? ""}
        displayName={firstName}
        isAdmin={admin}
        companyName={company?.name ?? ""}
        companyLogo={(company?.logo as string) ?? null}
      />
      <main className="main">{children}</main>
    </div>
  );
}
