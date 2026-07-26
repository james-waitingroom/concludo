/**
 * Seed the 15 example contracts into Supabase (company "ACME Inc.").
 *   npm run db:seed
 * Idempotent: clears ACME's existing contracts first, then inserts fresh rows and uploads each
 * contract's real source file (the .md in ../contracts) into the private storage bucket.
 */
import dotenv from "dotenv";
dotenv.config();

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { getOrCreateCompany, createContract, uploadSource, listContracts, deleteContractsForCompany } from "./contracts.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONTRACTS_DIR = join(__dirname, "..", "..", "..", "contracts"); // engine/src/db -> concludo/contracts

interface Seed {
  name: string; customer: string; value: number | null; status: string; eff: string | null; file: string;
}

const SEED: Seed[] = [
  { name: "Standard Platform Subscription",      customer: "Meridian Health Systems, Inc.",    value: 360000,  status: "draft",     eff: "2025-03-03", file: "01_meridian_health.md" },
  { name: "Platform + Distinct Implementation",  customer: "Brightwell Logistics, LLC",        value: 768000,  status: "in_review", eff: "2025-06-14", file: "02_brightwell_logistics.md" },
  { name: "Platform + Custom Integration",       customer: "Corvus Manufacturing Corp.",       value: 1480000, status: "draft",     eff: "2025-09-09", file: "03_corvus_manufacturing.md" },
  { name: "Platform + Deferred Premium Support", customer: "Halden Financial Group",           value: 522000,  status: "draft",     eff: "2025-01-12", file: "04_halden_financial.md" },
  { name: "Platform + Copilot (cold-start SSP)", customer: "Rivergate Partners LLC",           value: 937500,  status: "draft",     eff: "2025-04-02", file: "05_rivergate_partners.md" },
  { name: "Bundled Discount (residual method)",  customer: "Solstice Retail Group, Inc.",      value: 943020,  status: "draft",     eff: "2025-08-20", file: "06_solstice_retail.md" },
  { name: "Usage-Based Fees + Rebate",           customer: "Nordholm Industries AB",           value: 300000,  status: "draft",     eff: "2025-05-05", file: "07_nordholm_industries.md" },
  { name: "Non-Appropriation Termination",       customer: "Castellan Unified School District", value: 196667, status: "draft",     eff: "2025-10-01", file: "08_castellan_schools.md" },
  { name: "Year-2 Seat Expansion (Mod A)",       customer: "Brightwell Logistics, LLC",        value: 172500,  status: "draft",     eff: "2026-07-08", file: "09_brightwell_modification_a.md" },
  { name: "Year-2 Discounted Upsell (Mod B)",    customer: "Corvus Manufacturing Corp.",       value: 313500,  status: "draft",     eff: "2026-11-03", file: "10_corvus_modification_b.md" },
  { name: "Year-2 Scope Change (Mod C)",         customer: "Halden Financial Group",           value: 37500,   status: "draft",     eff: "2026-03-15", file: "11_halden_modification_c.md" },
  { name: "MSA + Order Form Mismatch",           customer: "Piermont Analytics, Inc.",         value: 465000,  status: "in_review", eff: "2026-02-06", file: "12_piermont_analytics.md" },
  { name: "Commission Capitalization (340-40)",  customer: "Meridian Health Systems, Inc.",    value: 360000,  status: "draft",     eff: "2025-03-03", file: "13_meridian_commission_baseline.md" },
  { name: "Commission w/ Expected Renewal",      customer: "Brightwell Logistics, LLC",        value: 768000,  status: "draft",     eff: "2025-06-14", file: "14_brightwell_commission_renewal.md" },
  { name: "Adversarial / Messy Contract",        customer: "Fenwick & Vale Purchasing Co-Op",  value: null,    status: "blocked",   eff: null,         file: "15_fenwick_vale_adversarial.md" },
];

async function main(): Promise<void> {
  const companyId = await getOrCreateCompany("ACME Inc.", "Software / SaaS");
  const removed = await deleteContractsForCompany(companyId);
  if (removed > 0) console.log(`Cleared ${removed} existing contract(s) for ACME Inc.`);

  for (const s of SEED) {
    const { id } = await createContract(companyId, {
      name: s.name, customer: s.customer, transaction_price: s.value, status: s.status, effective_date: s.eff, term_months: 36,
    });
    const bytes = new Uint8Array(readFileSync(join(CONTRACTS_DIR, s.file)));
    await uploadSource(companyId, id, s.file, bytes, "text/markdown");
    const val = s.value == null ? "—" : "$" + s.value.toLocaleString();
    console.log(`  \x1b[32m✓\x1b[0m ${s.name.padEnd(38)} ${s.customer.padEnd(34)} ${val.padStart(12)}   + ${s.file}`);
  }

  const rows = await listContracts(companyId);
  console.log(`\n\x1b[32m✓ Seeded ${rows.length} contracts into Supabase\x1b[0m (company ACME Inc., ${companyId}).`);
  console.log("  Source files uploaded to the 'contract-sources' bucket.");
}

main().catch((e: unknown) => {
  const o = e as Record<string, unknown>;
  const msg = e instanceof Error ? e.message : [o?.message, o?.code && `(code ${o.code})`, o?.details].filter(Boolean).join(" · ") || String(e);
  console.error("\x1b[31m✗ Seed failed:\x1b[0m", msg);
  process.exitCode = 1;
});
