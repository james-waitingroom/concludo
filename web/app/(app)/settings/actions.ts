"use server";

import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabaseServer";

export async function changePasswordAction(formData: FormData) {
  const supabase = supabaseServer();
  const pw = String(formData.get("password") || "");
  const pw2 = String(formData.get("confirm") || "");
  if (pw.length < 8) redirect("/settings?error=" + encodeURIComponent("Password must be at least 8 characters."));
  if (pw !== pw2) redirect("/settings?error=" + encodeURIComponent("Passwords do not match."));
  const { error } = await supabase.auth.updateUser({ password: pw });
  redirect("/settings?" + (error ? "error=" + encodeURIComponent(error.message) : "message=" + encodeURIComponent("Password changed.")));
}
