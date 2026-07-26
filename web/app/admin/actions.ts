"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabaseServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isPlatformAdmin } from "@/lib/platformAdmin";

/** Every control-plane action re-verifies platform-admin — never trust the layout alone. */
async function requireAdmin() {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!(await isPlatformAdmin(user.id))) redirect("/contracts");
}

export async function createTenantAction(formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") || "").trim();
  const industry = String(formData.get("industry_segment") || "").trim() || null;
  if (!name) redirect("/admin?error=" + encodeURIComponent("Company name is required."));

  const db = supabaseAdmin();
  const { data, error } = await db.from("companies").insert({ name, industry_segment: industry }).select("id").single();
  if (error) redirect("/admin?error=" + encodeURIComponent(error.message));

  revalidatePath("/admin");
  redirect(`/admin/${data!.id}?message=` + encodeURIComponent("Tenant created."));
}

export async function provisionUserAction(formData: FormData) {
  await requireAdmin();
  const companyId = String(formData.get("companyId") || "");
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const role = String(formData.get("role") || "member");
  const back = (q: string) => redirect(`/admin/${companyId}?${q}`);
  if (!email || !password) back("error=" + encodeURIComponent("Email and temporary password are required."));

  const db = supabaseAdmin();
  const created = await db.auth.admin.createUser({ email, password, email_confirm: true });
  if (created.error) back("error=" + encodeURIComponent(created.error.message));
  const userId = created.data.user!.id;

  const mem = await db
    .from("company_members")
    .upsert({ company_id: companyId, user_id: userId, role }, { onConflict: "company_id,user_id" });
  if (mem.error) back("error=" + encodeURIComponent(mem.error.message));

  revalidatePath(`/admin/${companyId}`);
  back("message=" + encodeURIComponent(`Provisioned ${email} and added to this tenant.`));
}

export async function assignUserAction(formData: FormData) {
  await requireAdmin();
  const companyId = String(formData.get("companyId") || "");
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const role = String(formData.get("role") || "member");
  const back = (q: string) => redirect(`/admin/${companyId}?${q}`);
  if (!email) back("error=" + encodeURIComponent("Email is required."));

  const db = supabaseAdmin();
  const list = await db.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const u = (list.data?.users ?? []).find((x) => (x.email ?? "").toLowerCase() === email);
  if (!u) back("error=" + encodeURIComponent("No existing user with that email. Provision them as a new user instead."));

  const mem = await db
    .from("company_members")
    .upsert({ company_id: companyId, user_id: u!.id, role }, { onConflict: "company_id,user_id" });
  if (mem.error) back("error=" + encodeURIComponent(mem.error.message));

  revalidatePath(`/admin/${companyId}`);
  back("message=" + encodeURIComponent(`Assigned ${email} to this tenant.`));
}

export async function resetPasswordAction(formData: FormData) {
  await requireAdmin();
  const companyId = String(formData.get("companyId") || "");
  const userId = String(formData.get("userId") || "");
  const password = String(formData.get("password") || "");
  const back = (q: string) => redirect(`/admin/${companyId}?${q}`);
  if (password.length < 8) back("error=" + encodeURIComponent("New password must be at least 8 characters."));

  const db = supabaseAdmin();
  const { error } = await db.auth.admin.updateUserById(userId, { password });
  if (error) back("error=" + encodeURIComponent(error.message));

  back("message=" + encodeURIComponent("Password reset. Share the new one securely."));
}

export async function removeMemberAction(formData: FormData) {
  await requireAdmin();
  const companyId = String(formData.get("companyId") || "");
  const userId = String(formData.get("userId") || "");
  const db = supabaseAdmin();
  const { error } = await db.from("company_members").delete().eq("company_id", companyId).eq("user_id", userId);
  if (error) redirect(`/admin/${companyId}?error=` + encodeURIComponent(error.message));

  revalidatePath(`/admin/${companyId}`);
  redirect(`/admin/${companyId}?message=` + encodeURIComponent("Access removed."));
}
