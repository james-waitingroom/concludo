"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabaseServer";
import { getPrimaryCompany } from "@/lib/membership";

const PROVISIONS = [
  { determination_type: "Contract combination & distinctness", company_position: "Implementation and onboarding are combined with the platform when they significantly customize or integrate the SaaS; otherwise treated as distinct.", standard_citation: "ASC 606-10-25-19 to 25-22" },
  { determination_type: "Standalone selling price method", company_position: "SSP established by market assessment first, then cost-plus-margin; the residual method is used only where price is highly variable or uncertain.", standard_citation: "ASC 606-10-32-31 to 32-35" },
  { determination_type: "Recognition pattern", company_position: "Subscription/SaaS is recognized ratably over the term; distinct one-time services are recognized at the point control transfers.", standard_citation: "ASC 606-10-25-27" },
  { determination_type: "Commission capitalization", company_position: "Incremental costs of obtaining a contract are capitalized and amortized over the period of benefit, using the one-year practical expedient where applicable.", standard_citation: "ASC 340-40-25-1" },
  { determination_type: "Variable consideration", company_position: "Usage-based fees and rebates are estimated and included only to the extent a significant reversal is not probable (the constraint).", standard_citation: "ASC 606-10-32-11" },
];

const GAPS = [
  { type: "compliance", severity: "critical", description: "The policy recognizes one-time implementation and onboarding fees in full at contract signing. This conflicts with over-time recognition where the work has no alternative use and there is an enforceable right to payment for performance completed to date.", standard_citation: "ASC 606-10-25-27(c)" },
  { type: "compliance", severity: "warning", description: "The policy expenses sales commissions as incurred. Incremental costs of obtaining a contract must be capitalized and amortized over the period of benefit, unless the amortization period is one year or less.", standard_citation: "ASC 340-40-25-1" },
  { type: "coverage", severity: "info", description: "No treatment for usage-based fees with retroactive volume rebates. The policy has no provision for estimating this variable consideration or applying the constraint.", standard_citation: "ASC 606-10-32-11" },
  { type: "coverage", severity: "info", description: "No standalone-selling-price method hierarchy. Absent a stated method priority, allocations are inconsistent and harder to defend.", standard_citation: "ASC 606-10-32-31 to 32-35" },
] as const;

/**
 * Persist a policy from the onboarding flow.
 *   kind "uploaded"          → the company's existing policy, analyzed → provisions + tracked gap flags
 *   kind "system_generated"  → a starter policy drafted from example contracts → provisions only (provisional)
 */
export async function createPolicy(kind: "uploaded" | "system_generated"): Promise<{ error?: string; ok?: boolean }> {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "You are not signed in." };
  const companyId = await getPrimaryCompany(user.id);
  if (!companyId) return { error: "Your account is not assigned to a company." };

  const pol = await supabase
    .from("policies")
    .insert({ company_id: companyId, standard: "ASC_606", version: 1, source: kind, effective_date: new Date().toISOString().slice(0, 10) })
    .select("id")
    .single();
  if (pol.error) return { error: pol.error.message };
  const policyId = pol.data.id as string;

  const prov = await supabase.from("policy_provisions").insert(PROVISIONS.map((p) => ({ ...p, policy_id: policyId })));
  if (prov.error) return { error: prov.error.message };

  if (kind === "uploaded") {
    const gaps = await supabase.from("gap_flags").insert(GAPS.map((g) => ({ ...g, policy_id: policyId, status: "open" })));
    if (gaps.error) return { error: gaps.error.message };
  }

  revalidatePath("/policies");
  return { ok: true };
}
