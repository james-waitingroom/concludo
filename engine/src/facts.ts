/**
 * Structured input facts for the worked example: Contract 2, Brightwell Logistics (distinct
 * implementation, observable SSP). In the full product these come from the Step-1 extraction pipeline;
 * here we use the gold facts so the judgment chain is exercised in isolation from extraction noise.
 *
 * The judgment-derived fields (is_distinct, standalone_ssp, allocated_price, recognition) start null —
 * the chain fills them in from approved judgments. Only raw contract facts are provided here.
 */
import type { Contract, PerformanceObligation } from "./model.js";

export const PO_PLATFORM = "po_platform";
export const PO_IMPL = "po_impl";

const platform: PerformanceObligation = {
  id: PO_PLATFORM,
  contract_id: "contract_2",
  description: "Platform Subscription — Enterprise Tier, 400 seats @ $600/seat/yr",
  is_distinct: null,
  standalone_ssp: null,
  allocated_price: null,
  recognition: null,
  start_month: "2025-07",
  end_month: "2028-06", // 36-month subscription term
  observable_pricing: "Standard per-seat list price with extensive comparable sales at the $600/seat/yr Enterprise Tier rate (broad rate-card history).",
  comparable_count: 40,
};

const implementation: PerformanceObligation = {
  id: PO_IMPL,
  contract_id: "contract_2",
  description: "Implementation & Onboarding Services ($48,000 one-time)",
  is_distinct: null,
  standalone_ssp: null,
  allocated_price: null,
  recognition: null,
  start_month: "2025-07",
  end_month: null, // delivery period not stated in the contract — deliberately left unknown
  observable_pricing: "14 prior standalone implementation sales at $560–640/hr; the $48,000 fee is consistent with this observable per-hour range.",
  comparable_count: 14,
};

export const brightwell: Contract = {
  id: "contract_2",
  company_id: "kestrel",
  customer: "Brightwell Logistics, LLC",
  effective_date: "June 14, 2025",
  term_start_month: "2025-07",
  term_end_month: "2028-06",
  term_months: 36,
  transaction_price: 768000, // TCV: $720,000 platform (3yr) + $48,000 implementation
  key_terms: [
    "Customer can use and benefit from the Platform independently using its default configuration; the implementation does not customize or modify the Platform's functionality.",
    "Kestrel has an enforceable right to payment for implementation performance completed to date if the contract is terminated.",
    "The implementation configuration work has no alternative use to Kestrel (it is specific to this customer).",
  ],
  performance_obligations: [platform, implementation],
};
