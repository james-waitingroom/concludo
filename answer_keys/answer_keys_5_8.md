# ANSWER KEYS — Contracts 5–8

---

## ANSWER KEY 5: Rivergate Partners (Cold-Start SSP)

**Extraction — Expected Facts:**
| Field | Value | Source |
|---|---|---|
| Customer | Rivergate Partners LLC | Preamble |
| Effective Date | April 2, 2025 | Preamble |
| Term | May 1, 2025 – April 30, 2028 (36 months) | Section 2 |
| Platform | 350 seats, Enterprise Tier, $650/seat/yr = $227,500/yr | Exhibit A |
| Copilot Module | $85,000/yr flat, first commercial sale, no prior comparables | Section 3, Exhibit A |
| TCV | $937,500 | Exhibit A |
| Commission | 8% × $937,500 = $75,000; 50/50 | Sales Comp Reference |

**Judgments Expected:**
1. **Distinctness of Copilot Module**: **Distinct.** Explicit contract language: operates independently, customer derives substantial standalone benefit from core Platform without it, capable of standalone use. Confidence: high (language is clear even though pricing is not).
2. **SSP — Platform**: Observable/extensive comparables. Confidence: **observed_high**.
3. **SSP — Copilot Module**: **No observable comparable pricing exists** — first commercial sale, no market data, no prior transactions. This is the core test: system must correctly identify **zero comparables** and select the **`benchmark_only`** confidence tier, not fabricate false confidence.
   - Correct method selection: cost-plus-margin is the only one of the three ASC 606 methods with any real input available here (per the internal note: Product Management's cost-plus modeling). Market assessment is unusable (no market). Residual is not appropriate/permitted here since this isn't a case of highly variable/uncertain standalone pricing for one component while others are reliably observable in a way that supports residual — rather, it's simply a new product with no data at all; using residual here would just be backing into a number, not a properly-supported application of the method under ASC 606-10-32-34(c)'s narrow conditions. Correct system behavior: propose cost-plus-margin (using the $85,000 internal modeling as the starting point) explicitly flagged as **benchmark_only / provisional**, with mandatory disclosure language about reassessment as the pricing corpus develops.
   - Expected system output should include the specific disclosure: "This determination was made in the absence of company-specific or observable market pricing data... Management should reassess this estimate as the Company's own pricing history develops" (or substantively similar language), and should note this SSP judgment is a strong candidate for the `ReassessmentTrigger` mechanism as more Copilot deals close.
4. **Allocation**: Both POs' SSPs equal their stated contract prices in this case (no bundled discount) — so allocated price = stated price, but the **Copilot SSP itself carries a `benchmark_only` confidence tag** even though no re-allocation math is actually needed here. This is an important nuance: confidence tier is about the *quality of the SSP determination*, independent of whether the allocation math is trivial.
5. **Recognition pattern**: Both POs — ratably over 36 months (both are stand-ready access obligations).

**Expected Schedule:**
- Platform: $227,500/yr ($18,958.33/month) over 36 months.
- Copilot: $255,000 total ($85,000/yr, $7,083.33/month) over 36 months — flagged low/provisional confidence on the underlying SSP determination, though the recognition mechanics themselves are straightforward once price is set.

---

## ANSWER KEY 6: Solstice Retail Group (Residual Approach)

**Extraction — Expected Facts:**
| Field | Value | Source |
|---|---|---|
| Customer | Solstice Retail Group, Inc. | Preamble |
| Effective Date | August 20, 2025 | Preamble |
| Term | Sept 15, 2025 – Sept 14, 2028 (36 months) | Section 2 |
| Platform | 500 seats, $650/seat/yr = $325,000/yr — **observable SSP** | Exhibit A |
| Implementation | ~90 hrs, standard rate $600/hr = $54,000 list — **NOT independently observable in this bundle** | Exhibit A, Section 3 |
| Advanced Analytics | $60,000/yr list — **observable SSP** (11 comparable standalone sales) | Exhibit A |
| Sum of standalone list prices (3yr) | $1,209,000 | Exhibit A |
| Actual bundle price (3yr) | $943,020 (22% discount) | Exhibit A |
| Commission | 8% × $943,020 = $75,441.60; 50/50 | Sales Comp Reference |

**Judgments Expected:**
1. **Distinctness**: All three components (Platform, Implementation, Advanced Analytics) are distinct — standard configuration-only implementation (not customization, per Section 3-style language pattern established in Contract 2), Advanced Analytics is a standalone-usable add-on module. Three POs total.
2. **SSP determination per PO — this is the core test**:
   - Platform: **Observable** (extensive comparable sales) → SSP = $325,000/yr standalone rate. Confidence: `observed_high`.
   - Advanced Analytics: **Observable** (11 comparable standalone sales, consistent pricing) → SSP = $60,000/yr standalone rate. Confidence: `observed_high`.
   - Implementation Services: **NOT independently observable in this specific bundled transaction** — contract explicitly states this combination has never been sold itemized/unbundled before, so while a generic list rate exists ($600/hr), the contract's own language flags that its specific contribution to *this* bundle price cannot be reliably disaggregated from the other components using direct observation. This is the trigger condition for residual method eligibility per ASC 606-10-32-34(c) — pricing that is highly variable or uncertain because it hasn't been sold separately before in this configuration.
3. **Correct method selection**: **Residual approach applies specifically to Implementation Services only** — allocate the two observable SSPs (Platform, Advanced Analytics) at their standalone amounts, and the **residual** (bundle price minus the two observable allocations) is allocated to Implementation Services. System should explicitly reason through *why* residual is permitted here (uncertain/unobservable standalone price for this one component) rather than defaulting to residual for convenience — and should explicitly reject using residual for the other two components, since they have perfectly good observable SSPs and residual should never be applied to a component with reliable observable pricing.
4. **Calculation check** (system should compute, not the AI "guess"):
   - Platform observable SSP (3yr): $975,000
   - Advanced Analytics observable SSP (3yr): $180,000
   - Sum of observable SSPs: $1,155,000
   - Bundle price: $943,020
   - Residual allocated to Implementation: $943,020 − $1,155,000 = **−$211,980** — this produces a **negative residual**, which is not permitted (a PO cannot be allocated negative consideration). 
   - **This is an intentional edge case**: when the residual approach produces a negative or unreasonably low result, ASC 606-10-32-33 through 35 guidance requires reverting to another method (e.g., adjusted market assessment or cost-plus for Implementation, or reconsidering whether the observable SSPs of the *other* components should themselves be adjusted/discounted proportionally). Correct system behavior: **flag this as a residual-method failure**, do not silently produce a negative allocation, and propose falling back to a cost-plus-margin or proportional-discount method for Implementation Services instead, clearly documented as a judgment requiring human review given the residual method's inapplicability here. This tests whether the system correctly recognizes when its own default method choice fails, rather than mechanically applying it anyway.

**Expected Schedule:**
- Given the residual failure above, exact allocated dollar amounts for Implementation depend on the human-reviewed fallback method chosen — the key test is whether the system **catches the negative-residual problem and flags it**, not whether it independently invents the "correct" final number.
- Platform and Advanced Analytics revenue recognized ratably over 36 months at their observable-SSP-based allocated amounts (adjusted proportionally if the fallback method also proportionally discounts all three components — a defensible alternative approach worth the system proposing as an option).

---

## ANSWER KEY 7: Nordholm Industries (Variable Consideration — Usage + Rebate)

**Extraction — Expected Facts:**
| Field | Value | Source |
|---|---|---|
| Customer | Nordholm Industries AB (US Operations) | Preamble |
| Effective Date | May 5, 2025 | Preamble |
| Term | June 1, 2025 – May 31, 2028 (36 months) | Section 2 |
| Platform (fixed) | 200 seats, $500/seat/yr = $100,000/yr | Exhibit A |
| Usage Fee | $0.015/transaction, billed monthly in arrears | Section 3, Exhibit A |
| Rebate | $0.002/transaction retroactive if annual volume > 5,000,000 | Section 3 |
| Probability estimates | 65% Year 1, 80% Years 2–3 | Section 3 |
| Commission | Platform-only basis: 8% × $300,000 = $24,000; usage-based portion trued up quarterly | Sales Comp Reference |

**Judgments Expected:**
1. **Fixed Platform fee**: Not variable consideration — standard fixed-fee PO, recognized ratably over 36 months, same treatment as prior contracts. Confidence: high.
2. **Usage-based fees — variable consideration classification**: This is genuinely variable consideration under ASC 606-10-32-5 through 32-14 (amount depends on future transaction volume, unknown at contract inception). Two acceptable estimation methods exist: **expected value** (probability-weighted) or **most likely amount**. System should reason through which is more appropriate: expected value is generally more appropriate when there's a range of possible outcomes (as here, with a continuous distribution of possible transaction volumes), whereas most-likely-amount suits binary outcomes. This is a genuinely variable, continuous-range scenario → **expected value method is the more appropriate and defensible choice**, though this itself should be flagged as a judgment worth explicit disclosure (both methods are technically permitted, and the choice affects the number).
3. **Usage-based fee recognition — practical note**: Many companies apply the **variable consideration allocation exception** (ASC 606-10-32-40) for usage-based fees tied to a stand-ready obligation, recognizing them as invoiced/as usage occurs each month, rather than estimating and recognizing variable consideration upfront — this is common and often appropriate when the variable fee relates specifically to that period's usage (a form of the "each distinct time increment" practical approach used for usage-based royalty-like fees). System should flag both approaches as potentially applicable and note that, in practice, month-by-month recognition as usage occurs is the more common and operationally simpler treatment for this fact pattern, **but the rebate creates a wrinkle** (see next point) that pure "recognize as invoiced" doesn't fully solve.
4. **The rebate — this is the harder, core test**: The retroactive volume rebate is a **variable consideration constraint issue** — even if usage fees are recognized as invoiced monthly, the *rebate* (which claws back $0.002/transaction retroactively across the whole year if the threshold is hit) means the company **cannot recognize the full $0.015/transaction as revenue each month without considering the probable retroactive reduction**, per the constraint on variable consideration (ASC 606-10-32-11) — revenue should only be recognized to the extent it's **probable that a significant reversal will not occur** once uncertainty resolves. Given the stated 65-80% probability of hitting the rebate threshold, this is not a remote/immaterial possibility — the system should flag that recognizing the full undiscounted $0.015/transaction rate monthly, without any accrual for the probable rebate, would overstate revenue given the high stated probability of the rebate being triggered.
5. **Correct treatment**: Each month, revenue should be recognized at the **expected net rate** reflecting the probability-weighted rebate — i.e., approximately $0.015 − (probability × $0.002) per transaction, updated as actual cumulative volume and updated probability assessments develop through the year, with a true-up as the year progresses and actual results become known (reducing estimation uncertainty as more of the year's actual volume is known). This should be flagged as requiring **quarterly (or more frequent) reassessment** as actual volume accumulates.

**Expected Schedule:**
- Platform: $100,000/yr ($8,333.33/month) ratably.
- Usage fees: recognized monthly based on actual transactions × ($0.015 minus probability-weighted expected rebate), with explicit quarterly true-up as actual cumulative volume becomes known and probability estimates are refreshed. Exact dollar figures depend on actual usage data not provided in this synthetic contract — the key test is whether the system **correctly identifies the constraint issue and proposes an expected-value net rate with a true-up mechanism**, rather than either (a) ignoring the rebate entirely and recognizing gross fees, or (b) failing to recognize any usage revenue due to "uncertainty" (which would be equally wrong — the constraint doesn't mean zero recognition, it means constrained/net recognition).

---

## ANSWER KEY 8: Castellan Public Schools (Termination w/ Partial Refund)

**Extraction — Expected Facts:**
| Field | Value | Source |
|---|---|---|
| Customer | Castellan Unified School District | Preamble |
| Effective Date | October 1, 2025 | Preamble |
| Term | Nov 1, 2025 – Oct 31, 2028 (36 months) | Section 2 |
| Platform | 150 seats, $400/seat/yr = $60,000/yr full year | Exhibit A |
| Termination right | Non-Appropriation Termination, fiscal-year aligned, pro-rata refund of prepaid fees | Section 3 |
| Probability estimate | 10-15% cumulative across term, low in early years | Section 3 |
| TCV (no termination) | ~$196,667 | Exhibit A |
| Commission | 8% × $196,667 ≈ $15,733.60; 50/50 | Sales Comp Reference |

**Judgments Expected:**
1. **Variable consideration from the refund right**: Unlike Contract 1's standard uncured-breach refund (not variable consideration), **this refund right IS a form of variable consideration** — because it's a customer-side, non-performance-related right to a refund (contingent on a future event — budget non-appropriation — unrelated to Kestrel's performance), which functions economically similarly to a right of return / cancellation option affecting the total transaction price Kestrel can expect to actually collect and retain. This is a good contrast case to Contract 1: the key differentiator the system must correctly identify is that Contract 1's refund trigger was tied to *Kestrel's own breach* (not variable consideration — standard performance assurance), while Contract 8's refund trigger is tied to an *independent, uncertain future event* (customer's budget appropriation), which does create a variable consideration/constraint question about total expected transaction price.
2. **Estimation approach**: Given the stated low probability (10-15%) of Non-Appropriation Termination, and that appropriation for the first full year is already secured at signing, this is a case where the constraint (ASC 606-10-32-11) is likely satisfied — i.e., it's probable that a significant revenue reversal will **not** occur, given the low stated probability, especially in the near term. System should reason: transaction price should reflect a modest reduction (or no reduction, if immaterial) for the estimated probability-weighted refund exposure, with explicit disclosure of the judgment and the probability basis, rather than either ignoring the clause entirely or over-constraining revenue recognition given the low actual risk.
3. **Public-sector nuance flag**: The system should recognize and flag that this fact pattern (government/public-sector non-appropriation clauses) is common in public-sector SaaS contracts and often *does not* rise to a level requiring a material revenue constraint if history/appropriation status supports low realistic risk — but should still be explicitly documented as an evaluated judgment (not silently ignored), since it is a real contractual contingency distinct from Kestrel's standard commercial terms, and the contract explicitly acknowledges as much ("unique to Customer's status... not Kestrel's standard commercial termination provision").
4. **Recognition pattern**: Ratably over the term absent the above constraint consideration — straightforward stand-ready obligation, standard monthly recognition once the (likely immaterial, but documented) variable consideration judgment is resolved.

**Expected Schedule:**
- Recognize approximately $60,000/yr ratably (prorated for partial periods per the fiscal-year billing structure), with an explicit, documented (likely immaterial given low probability) adjustment or disclosure addressing the Non-Appropriation Termination variable consideration judgment — the key test is whether the system **identifies and reasons through this as a distinct variable-consideration question**, correctly distinguishing it from Contract 1's non-variable breach-refund clause, rather than treating all termination/refund clauses identically.
