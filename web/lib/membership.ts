import { supabaseAdmin } from "./supabaseAdmin";

/**
 * Look up the company a user has been assigned to. Does NOT create anything —
 * access is granted only when a Concludo admin has already placed the user in a
 * company (via the admin console / company_members). Returns the company id or null.
 *
 * Uses the admin client (keyed by user_id) to avoid RLS recursion on company_members.
 */
export async function getPrimaryCompany(userId: string): Promise<string | null> {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("company_members")
    .select("company_id")
    .eq("user_id", userId)
    .limit(1);
  if (error) throw error;
  return data && data[0] ? (data[0].company_id as string) : null;
}
