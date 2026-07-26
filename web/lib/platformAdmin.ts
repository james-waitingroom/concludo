import { supabaseAdmin } from "./supabaseAdmin";

/**
 * Is this user a Concludo platform administrator (control-plane access)?
 * Checked against the platform_admins table via the service-role client — the anon key
 * and tenant sessions can never read that table (RLS-enabled, no policies).
 * This is entirely separate from tenant membership (company_members).
 */
export async function isPlatformAdmin(userId: string): Promise<boolean> {
  const db = supabaseAdmin();
  const { data, error } = await db.from("platform_admins").select("user_id").eq("user_id", userId).limit(1);
  if (error) throw error;
  return !!(data && data[0]);
}
