import LoginForm from "./LoginForm";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: { error?: string; message?: string } }) {
  // Single-tenant deployments show that company's logo on login. With multiple tenants a shared
  // login can't assume one company's branding, so fall back to the Concludo mark.
  let companyLogo: string | null = null;
  let companyName: string | null = null;
  try {
    const { data } = await supabaseAdmin().from("companies").select("name,logo");
    if (data && data.length === 1) {
      companyLogo = (data[0].logo as string) ?? null;
      companyName = (data[0].name as string) ?? null;
    }
  } catch {
    /* logo column may not exist yet — fall back to Concludo brand */
  }

  return (
    <div className="auth-wrap">
      <LoginForm error={searchParams.error} message={searchParams.message} companyLogo={companyLogo} companyName={companyName} />
    </div>
  );
}
