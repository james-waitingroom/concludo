"use server";

import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabaseServer";

export async function signInAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const supabase = supabaseServer();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect("/login?error=" + encodeURIComponent(error.message));
  redirect("/contracts");
}

// Note: no sign-up action. Accounts are provisioned by Concludo admins in the Supabase
// dashboard (Authentication → Users → Add user); self-service signup is disabled.

export async function signOutAction() {
  const supabase = supabaseServer();
  await supabase.auth.signOut();
  redirect("/login");
}
