# ANSWER KEYS — Contracts 9–11 (Modifications)

---

## ANSWER KEY 9: Brightwell Logistics — Modification A (Separate Contract)

**Extraction — Expected Facts:**
| Field | Value | Source |
|---|---|---|
| Original Contract Reference | MSA dated June 14, 2025 (Contract 2) | Background |
| Amendment Date | July 8, 2026 | Preamble |
| Additional Seats | 150, Enterprise Tier | Section 1 |
| Pricing | $600/seat/yr — matches standard list, matches original contract's rate, matches other standalone comparable sales | Section 1 |
| Effective Date of Addition | August 1, 2026 | Section 1 |
| Term of Addition | Co-terminus, ~23 months (Aug 2026–June 2028) | Section 2 |
| Commission | 4% (expansion rate) × incremental TCV = $6,900, paid 100% upfront | Sales Comp Reference |

**Judgment Expected — Modification Type Determination (the core test):**

This is the **"separate contract"** bucket under ASC 606-10-25-10 through 12. Reasoning chain the system should produce:
1. **Is the additional good/service distinct?** Yes — additional Platform seats are the same type of distinct good already established as a PO in the original contract; adding more of the same distinct good is straightforwardly distinct.
2. **Does the additional consideration reflect the standalone selling price of the additional goods/services, adjusted as appropriate for the circumstances of the contract?** Yes — the contract explicitly states the $600/seat/yr rate matches Kestrel's then-current standard list price for this volume tier and matches pricing offered to other standalone customers in the same period. No discount was applied.
3. **Conclusion**: Both conditions for "separate contract" treatment are met → **this modification should be accounted for as a wholly separate contract**, with **no reallocation, no cumulative catch-up, and no impact whatsoever on the original contract's existing performance obligations or recognition schedule.**
4. **System should explicitly reject the other two modification treatments** in its reasoning trace: not "termination + new contract" (because pricing does reflect SSP, so there's no need to combine remaining consideration and reallocate), and not "cumulative catch-up" (because the added seats are a distinct good, not a change to an existing single PO's scope).
5. **Practical implication for the system**: this new "separate contract" should essentially be modeled and run through the Contract → PerformanceObligation → Judgment pipeline **exactly as if it were a brand-new, independent contract** — because that is precisely what ASC 606 requires. The `related_contracts` link back to the original Brightwell MSA should exist for reporting/relationship rollup purposes only, not for any accounting mechanics.

**Expected Schedule:**
- New, independent PO: 150 seats × $600/seat/yr = $90,000/yr, recognized ratably over ~23 months starting August 1, 2026.
- Original contract's existing 400-seat PO and its recognition schedule: **completely unaffected**, continues exactly as originally scheduled.
- Commission: New, separate commission calculation (4% expansion rate per comp plan) capitalized and amortized as its own asset, independent of the original contract's commission asset/schedule — amortization period should be evaluated independently too (over the ~23-month remaining/co-terminus period for this specific incremental asset, subject to its own renewal-commensurate-rate test if relevant).

---

## ANSWER KEY 10: Corvus Manufacturing — Modification B (Termination + New Contract)

**Extraction — Expected Facts:**
| Field | Value | Source |
|---|---|---|
| Original Contract Reference | MSA dated September 9, 2025 (Contract 3) | Background |
| Amendment Date | November 3, 2026 | Preamble |
| Additional Seats | 300, Enterprise Tier | Section 1 |
| Additional Seats Pricing | $420/seat/yr vs. $650/seat/yr standard list (35% discount) | Section 2 |
| Advanced Analytics Module | $45,000/yr flat vs. $70,000/yr standard list (36% discount) | Section 2 |
| Effective Date | December 1, 2026 | Section 1 |
| Commission | 4% expansion rate, flagged for manual comp review re: discount treatment | Sales Comp Reference |

**Judgment Expected — Modification Type Determination (the core test):**

This is the **"termination of old contract + creation of new contract"** bucket under ASC 606-10-25-13. Reasoning chain the system should produce:
1. **Is the additional good/service distinct?** Yes — additional seats and the Advanced Analytics module are distinct goods (same reasoning pattern as prior contracts: seats are the same distinct good type; Advanced Analytics has been established elsewhere in this test suite, per Contract 6, as a standalone-usable, distinct module).
2. **Does the additional consideration reflect standalone selling price?** **No** — the contract explicitly states both components are priced at substantial discounts (35% and 36% respectively) relative to standard list/standalone pricing, specifically because of competitive/retention pressure, not because of a legitimate SSP adjustment for volume or customer-specific circumstances that would still count as "reflecting SSP, adjusted for circumstances." A steep, competitively-motivated discount **does not** meet the "reflects SSP" test.
3. **Conclusion**: Distinct goods, but price does not reflect SSP → **treat as termination of the existing contract and creation of a new contract**, per ASC 606-10-25-13.
4. **Mechanics the system must get right**: 
   - Determine the **remaining, unrecognized transaction price** from the original contract as of the modification date (November 3/December 1, 2026) — this is a calculated, mechanical figure derived directly from the existing recognition schedule (remaining deferred revenue for the original PO(s) as of the modification date), not something requiring new judgment.
   - **Combine** that remaining amount with the new consideration from the modification (the discounted additional seats + Advanced Analytics fees).
   - **Reallocate** the combined remaining consideration across **all remaining performance obligations** (the original Platform PO's remaining term, the new additional seats, and the new Advanced Analytics module) based on their relative SSPs as of the modification date — this requires a fresh SSP allocation exercise, treating the "new contract" (remaining original obligations + new elements) as its own allocation universe.
   - This reallocation is applied **prospectively only** — nothing already recognized under the original contract is restated. This should be explicitly stated in the memo, since prospective-only treatment is a common point of confusion.
5. **System should flag**: because the discount was justified as a customer-retention/competitive-response decision rather than a documented SSP-consistent price, this determination itself should carry a note in the memo explaining why the price-reflects-SSP test failed, citing the specific discount percentages as evidence.

**Expected Schedule:**
- Original contract's Platform PO: recognize revenue as originally scheduled up through the modification date (Nov 3/Dec 1, 2026) — no restatement of prior periods.
- From the modification date forward: new combined transaction price = (remaining original PO consideration) + ($126,000/yr new seats × remaining term) + ($45,000/yr Advanced Analytics × remaining term), reallocated across all remaining/new POs based on relative SSP (existing seats' SSP at $650/seat/yr, new seats and Advanced Analytics's SSPs also at their **standalone list rates**, not the discounted contract rates, for allocation purposes) — meaning the discount effectively gets spread proportionally across all remaining POs' recognized revenue, rather than being isolated entirely to the newly added elements. This is the somewhat counterintuitive but technically correct mechanical outcome of this modification type, and is worth the system explicitly calling out as a "non-obvious" consequence in the generated memo.

---

## ANSWER KEY 11: Halden Financial — Modification C (Cumulative Catch-Up)

**Extraction — Expected Facts:**
| Field | Value | Source |
|---|---|---|
| Original Contract Reference | MSA dated January 12, 2025 (Contract 4) | Background |
| Amendment Date | March 15, 2026 | Preamble |
| Seat Change | 300 → 375 seats (+75), same $500/seat/yr rate | Section 1 |
| Effective Date | April 1, 2026 (mid-Year-2) | Section 1 |
| Nature | Explicitly stated as increase to same existing single PO, not a new/separate deliverable | Background |
| Commission | 4% expansion rate on incremental annualized fee = $1,500, 100% upfront | Sales Comp Reference |

**Judgment Expected — Modification Type Determination (the core test):**

This is the **"cumulative catch-up"** bucket under ASC 606-10-25-13(b), for modifications that are **part of the existing, single, not-yet-fully-satisfied performance obligation** — i.e., the added scope is not distinct from the remaining goods/services already being provided under that PO.

1. **Is the additional good/service distinct from the remaining goods/services in the existing PO?** **No** — the contract explicitly states the added seats are not a new/separate deliverable, but rather an increase within the **same single stand-ready Platform access performance obligation** already being delivered. This is a materially different fact pattern from Modifications A and B (both of which involved genuinely distinct additional goods).
2. **Conclusion**: Because the additional goods/services are not distinct from the remainder of the existing (partially satisfied, over-time) PO, this modification is accounted for as if it were **part of the original contract** — the effect is recognized as a **cumulative catch-up adjustment to revenue** on the modification date, per ASC 606-10-25-13(b), recalculating the measure of progress and the transaction price for the (now-modified) single PO and adjusting revenue in the period of modification for the difference between revenue recognized to date and the revenue that would have been recognized to date under the new, updated terms.
3. **System should explicitly reject** the "separate contract" and "termination + new contract" treatments in its reasoning trace — both require the added goods/services to be distinct, which this contract's own language rules out.
4. **This is the highest-risk modification type for a P&L surprise** — the system's memo should isolate and clearly label the one-time catch-up adjustment amount, separate from the ongoing/routine period's recognition, exactly as flagged in our earlier design discussion (a Controller needs to see this cleanly separated, not buried inside a routine monthly JE).

**Calculation the system should perform:**
- Original PO transaction price (300 seats × $500/seat/yr × remaining term from contract inception): the total transaction price for the Platform PO increases by the incremental annualized amount for the remaining term following the modification.
- Recalculate the **total** (modified) transaction price for the Platform PO across its full original term (Feb 2025–Jan 2028), incorporating the new 375-seat count for the period from the modification date forward (the seat increase itself is prospective — 300 seats for Feb 2025–Mar 2026, 375 seats from Apr 2026 forward — the system should not increase seat-based revenue retroactively for periods before the seats actually increased, since the modification itself only takes effect April 1, 2026).
- **Recalculate the measure of progress**: as of the modification date, determine revenue that *should* have been recognized to date under the now-updated total transaction price and total obligation, compare to revenue *actually* recognized to date (based on the original 300-seat pricing), and recognize the **difference as an immediate cumulative catch-up adjustment** in the period of modification.
- Because the seat increase here is prospective-effective (not retroactive to contract inception) and priced at the same per-seat rate as the original agreement, the actual catch-up adjustment in this specific fact pattern may be small or immaterial in dollar terms — but the system should still perform and disclose the calculation explicitly, since the **type of modification treatment matters for correctness and audit defensibility even when the dollar impact happens to be small in this particular instance.** This is an intentional nuance: the *type* of judgment (cumulative catch-up mechanics) is being tested here, independent of whether the dollar magnitude is large.
- Premium Support PO: unaffected by this Amendment, continues on its own existing (already-established, Contract 4) schedule at the increased 375-seat count from the modification date forward, applying the same per-seat rate consistency logic.

**Expected Schedule:**
- Platform PO: revenue recognized at original 300-seat-based rate through March 31, 2026; cumulative catch-up adjustment recorded in April 2026 reflecting updated total obligation; then ratable recognition at the new 375-seat-based rate for the remaining term.
- Premium Support PO: unaffected structurally, seat count in its own per-seat calculation updates to 375 from April 1, 2026 forward per Section 4 of the Amendment.
