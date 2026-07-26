/**
 * Data-access layer for contracts + their source documents (Supabase).
 * Server-side only — uses the service-role client from supabase.js.
 */
import { getSupabase, CONTRACT_SOURCES_BUCKET, sourcePath } from "./supabase.js";

export interface NewContract {
  name: string;
  customer: string;
  transaction_price: number | null;
  status?: string;                 // one of the contract_status enum values
  effective_date?: string | null;  // 'YYYY-MM-DD'
  term_months?: number | null;
}

/** Return the company id for `name`, creating the company if it doesn't exist. */
export async function getOrCreateCompany(name: string, industry?: string): Promise<string> {
  const db = getSupabase();
  const existing = await db.from("companies").select("id").eq("name", name).limit(1);
  if (existing.error) throw existing.error;
  if (existing.data && existing.data[0]) return existing.data[0].id as string;
  const created = await db.from("companies").insert({ name, industry_segment: industry ?? null }).select("id").single();
  if (created.error) throw created.error;
  return created.data.id as string;
}

/** Insert a contract row and return its id. */
export async function createContract(companyId: string, c: NewContract): Promise<{ id: string }> {
  const db = getSupabase();
  const res = await db
    .from("contracts")
    .insert({
      company_id: companyId,
      name: c.name,
      customer: c.customer,
      transaction_price: c.transaction_price,
      status: c.status ?? "draft",
      effective_date: c.effective_date ?? null,
      term_months: c.term_months ?? null,
      entity: "ACME Inc. — Top Level",
    })
    .select("id")
    .single();
  if (res.error) throw res.error;
  return { id: res.data.id as string };
}

/**
 * Upload a source document to the private bucket and link it to the contract.
 * `bytes` is the real file (a user-uploaded or CRM-fetched PDF in production; here, the .md source).
 */
export async function uploadSource(
  companyId: string,
  contractId: string,
  filename: string,
  bytes: Uint8Array | ArrayBuffer,
  contentType: string,
): Promise<string> {
  const db = getSupabase();
  const path = sourcePath(companyId, contractId, filename);
  const up = await db.storage.from(CONTRACT_SOURCES_BUCKET).upload(path, bytes, { contentType, upsert: true });
  if (up.error) throw up.error;
  const upd = await db
    .from("contracts")
    .update({ source_file_path: path, source_file_name: filename, source_origin: "upload" })
    .eq("id", contractId);
  if (upd.error) throw upd.error;
  return path;
}

/** A time-limited URL to download a contract's source document (server-minted). */
export async function getSignedSourceUrl(path: string, expiresInSeconds = 300): Promise<string> {
  const db = getSupabase();
  const res = await db.storage.from(CONTRACT_SOURCES_BUCKET).createSignedUrl(path, expiresInSeconds);
  if (res.error) throw res.error;
  return res.data.signedUrl;
}

export async function listContracts(companyId: string) {
  const db = getSupabase();
  const res = await db
    .from("contracts")
    .select("id,name,customer,transaction_price,status,source_file_name")
    .eq("company_id", companyId)
    .order("name");
  if (res.error) throw res.error;
  return res.data;
}

/** Remove all contracts for a company (demo re-seeding). Cascades to POs/judgments. */
export async function deleteContractsForCompany(companyId: string): Promise<number> {
  const db = getSupabase();
  const res = await db.from("contracts").delete().eq("company_id", companyId).select("id");
  if (res.error) throw res.error;
  return res.data ? res.data.length : 0;
}
