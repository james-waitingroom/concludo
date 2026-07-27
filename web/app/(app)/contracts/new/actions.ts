"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabaseServer";
import { getPrimaryCompany } from "@/lib/membership";

/**
 * Step 1 of ingestion: create the contract row (small payload, RLS-scoped).
 * The PDF itself is uploaded directly from the browser to Supabase Storage, so it never
 * passes through a serverless function — avoiding Vercel's ~4.5MB request body limit.
 */
export async function createContractRecord(input: {
  name: string;
  customer: string;
}): Promise<{ error?: string; contractId?: string; companyId?: string }> {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "You are not signed in." };

  const companyId = await getPrimaryCompany(user.id);
  if (!companyId) return { error: "Your account is not assigned to a company." };

  const name = input.name.trim();
  const customer = input.customer.trim();
  if (!name || !customer) return { error: "Contract name and customer are required." };

  const ins = await supabase
    .from("contracts")
    .insert({ company_id: companyId, name, customer, status: "in_review", source_origin: "upload" })
    .select("id")
    .single();
  if (ins.error) return { error: ins.error.message };

  return { contractId: ins.data.id as string, companyId };
}

/** Step 2: record the storage path after the browser finishes uploading the PDF. */
export async function finalizeContractSource(input: {
  contractId: string;
  path: string;
  fileName: string;
}): Promise<{ error?: string; ok?: boolean }> {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "You are not signed in." };
  if (!input.fileName.toLowerCase().endsWith(".pdf")) return { error: "Only PDF source documents are allowed." };

  const upd = await supabase
    .from("contracts")
    .update({ source_file_path: input.path, source_file_name: input.fileName })
    .eq("id", input.contractId);
  if (upd.error) return { error: upd.error.message };

  revalidatePath("/contracts");
  return { ok: true };
}
