/**
 * Connectivity check — run after configuring engine/.env and applying the migrations.
 *   npm run db:check
 * Confirms the engine can reach Supabase and that the schema is present, by upserting a demo
 * company and reading the contracts table. Uses the service role (bypasses RLS).
 */
import dotenv from "dotenv";
dotenv.config();

import { getSupabase } from "./supabase.js";

async function main(): Promise<void> {
  const db = getSupabase();

  // 1) Can we reach the DB and read the schema?
  const found = await db.from("companies").select("id,name").eq("name", "ACME Inc.").limit(1);
  if (found.error) throw found.error;

  // 2) Upsert a demo company so there's a visible result.
  let company = found.data?.[0];
  if (!company) {
    const created = await db
      .from("companies")
      .insert({ name: "ACME Inc.", industry_segment: "Software / SaaS" })
      .select("id,name")
      .single();
    if (created.error) throw created.error;
    company = created.data;
  }

  // 3) Confirm a downstream table is reachable.
  const contracts = await db.from("contracts").select("*", { count: "exact", head: true });
  if (contracts.error) throw contracts.error;

  console.log("\x1b[32m✓ Connected to Supabase.\x1b[0m");
  console.log("  companies row:", company);
  console.log("  contracts table reachable — rows:", contracts.count ?? 0);
  console.log("\nAll good. The engine can read and write the database.");
}

main().catch((e: unknown) => {
  let msg: string;
  if (e instanceof Error) msg = e.message;
  else if (e && typeof e === "object") {
    const o = e as Record<string, unknown>;
    msg = [o.message, o.code && `(code ${o.code})`, o.hint, o.details].filter(Boolean).join(" · ") || JSON.stringify(e);
  } else msg = String(e);
  console.error("\x1b[31m✗ Check failed:\x1b[0m", msg);
  console.error("  → Confirm engine/.env has SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY, and that you ran the migrations.");
  process.exitCode = 1;
});
