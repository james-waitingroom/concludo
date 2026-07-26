/**
 * Supabase client for the engine (server-side).
 *
 * The engine is a trusted backend, so it uses the SERVICE ROLE key, which bypasses row-level security.
 * NEVER ship this key to a browser — a future frontend uses the ANON key plus user auth and the RLS
 * policies in supabase/migrations/0001_init.sql.
 *
 * Credentials come from the environment (see engine/.env.example). This module lazily constructs the
 * client so importing it doesn't throw when Supabase isn't configured (e.g. the mock-only chain run).
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (client) return client;
  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) {
    throw new Error(
      "Supabase not configured — set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (see engine/.env.example).",
    );
  }
  client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return client;
}

export const CONTRACT_SOURCES_BUCKET = "contract-sources";

/** Storage path for a contract's source document: '<company>/<contract>/<filename>'. */
export function sourcePath(companyId: string, contractId: string, filename: string): string {
  return `${companyId}/${contractId}/${filename}`;
}
