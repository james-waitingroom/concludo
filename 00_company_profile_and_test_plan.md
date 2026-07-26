# Kestrel Systems, Inc. — Fictional Company Profile & Contract Test Suite

## Company Overview (for grounding all contracts)

**Kestrel Systems, Inc.** is a B2B SaaS company selling a workflow automation and approvals platform for finance and operations teams. Founded 2019, Series B, ~$18M ARR, ~140 employees. Customers are mid-market companies (200–2,000 employees).

**Product/pricing structure (mirrors real-world SaaS complexity):**
- **Core Platform subscription** — per-seat annual pricing, tiered (Standard/Pro/Enterprise), billed annually in advance
- **Implementation & Onboarding Services** — one-time professional services fee; sometimes bundled, sometimes separately negotiated; sometimes basic configuration (not distinct customization), sometimes deep integration work (could be non-distinct if it significantly modifies the platform)
- **Premium Support** — optional add-on tier, annual, can be included at signing (deferred start) or added later (true modification)
- **Usage-based API/Transaction fees** — variable consideration, billed monthly in arrears based on transaction volume, sometimes with volume discounts/tiers
- **Training & Enablement Services** — smaller professional services line, sold standalone or bundled
- **Data Migration Services** — one-time, sometimes bundled with implementation, sometimes separate

**Standard commission plan:** AEs earn 8% of Total Contract Value (TCV) on new logos, 4% on renewals/expansions, paid 50% at signing / 50% at the start of any deferred-start obligation or on the contract anniversary, per Kestrel's comp plan doc. Commissions are "incremental costs to obtain a contract" per policy (would not have been incurred but for successful execution).

**Standard contract mechanics:** 90-day termination-for-convenience notice period is standard; whether prepaid fees are refundable on termination varies by contract (intentionally, to test variable consideration judgments). Contracts are a mix of a Master Subscription Agreement (MSA) + Order Form structure, and a small number of single-document "simple" contracts.

---

## Purpose of This Test Suite

15 contracts, each engineered to isolate and stress-test specific ASC 606 / ASC 340-40 judgments identified in the Kestrel Accounting Intelligence product design. Each contract includes:
1. The contract text itself (realistic length and structure)
2. A gold-standard answer key: every fact that should be extracted (with source location), every judgment that should be made (with correct conclusion, reasoning, and confidence tier), and the expected recognition/commission schedule outcome

This suite exists to validate two separate system layers independently:
- **Extraction accuracy** — can the system correctly pull structured facts from realistic (and in #15, deliberately messy) contract language?
- **Judgment accuracy** — given correct facts, does the reasoning engine reach the technically correct ASC 606/340-40 conclusion, citing the right factors?

---

## Contract Index & What Each One Tests

| # | Contract Name | Primary Judgment(s) Under Test |
|---|---|---|
| 1 | Meridian Health — Standard Platform Only | Baseline/control: single PO, no allocation needed |
| 2 | Brightwell Logistics — Platform + Distinct Implementation | Distinctness (positive case); SSP with observable comparables |
| 3 | Corvus Manufacturing — Platform + Non-Distinct Implementation | Distinctness (negative case) — significant customization/integration |
| 4 | Halden Financial — Platform + Deferred-Start Premium Support | Multiple POs at inception, one with future start date (not a modification) |
| 5 | Rivergate Partners — Cold-Start SSP (New Deliverable Type) | SSP with zero comparables — benchmark-only tier |
| 6 | Solstice Retail Group — Bundled Discount Requiring Residual Approach | SSP allocation via residual method; permissibility check |
| 7 | Nordholm Industries — Usage-Based Fees + Rebate | Variable consideration estimation (expected value vs. most likely amount) |
| 8 | Castellan Public Schools — Termination Clause w/ Partial Refund | Variable consideration from refundable termination rights |
| 9 | Brightwell Logistics — Year 2 Seat Expansion (Modification A) | Modification: separate contract treatment |
| 10 | Corvus Manufacturing — Year 2 Discounted Upsell (Modification B) | Modification: termination of old + creation of new contract |
| 11 | Halden Financial — Year 2 Scope Change (Modification C) | Modification: cumulative catch-up adjustment |
| 12 | Piermont Analytics — MSA + Order Form with Numeric Mismatch | Extraction/reconciliation: multi-document conflict flag |
| 13 | Meridian Health — Standard Commission Capitalization | ASC 340-40 baseline: capitalize & amortize over contract term |
| 14 | Brightwell Logistics — Commission with Expected Renewal | ASC 340-40: amortization period exceeds initial contract term |
| 15 | Fenwick & Vale Co-Op — Adversarial/Messy Contract | Extraction stress test: ambiguous auto-renewal, conflicting dates, scanned-quality artifacts, redline vs. summary conflict |

---

## Build Sequence for This Document Set

1. This profile document (done)
2. Contracts 1–15, each as a standalone text file styled as a realistic executed contract
3. Answer key for each contract (paired file)
4. Master summary document (Word) combining: company profile, index, and full answer keys — formatted for handoff to engineering
