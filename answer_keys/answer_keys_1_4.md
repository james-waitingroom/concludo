# ANSWER KEYS — Contracts 1–4

---

## ANSWER KEY 1: Meridian Health Systems (Baseline/Control)

**Extraction — Expected Facts:**
| Field | Value | Source |
|---|---|---|
| Customer | Meridian Health Systems, Inc. | Preamble |
| Effective Date | March 3, 2025 | Preamble |
| Term Start | April 1, 2025 | Section 2 |
| Term End | March 31, 2028 (36 months) | Section 2 |
| Renewal | Auto-renews 12-month periods, 60 days' non-renewal notice | Section 2 |
| Line Items | Platform Subscription Pro Tier, 250 seats, $480/seat | Exhibit A |
| Annual Fee | $120,000 | Exhibit A |
| TCV | $360,000 | Exhibit A |
| Termination | 90 days convenience; prepaid non-refundable on customer-initiated; pro-rata refund only on Kestrel uncured breach | Section 4 |
| Commission | 8% new logo = $28,800; 50/50 signing/12-mo anniversary | Sales Comp Reference |

**Judgments Expected:**
1. **Contract identification**: Single contract, standard MSA + Order Form. Confidence: high.
2. **Performance obligations**: One PO only (Platform Subscription). No allocation judgment needed — 100% of transaction price allocated to the single PO. This is the control case: the system should NOT invent a distinctness judgment where there's only one deliverable.
3. **Variable consideration**: None. The uncured-breach refund right is not variable consideration in the ASC 606 sense (standard warranty-type protection, not a discount/rebate/refund tied to performance uncertainty) — this should NOT be flagged as a variable consideration issue. Confidence: high.
4. **Recognition pattern**: Over time, ratably over 36 months (customer simultaneously receives and consumes benefit of platform access, ASC 606-10-25-27(a)).
5. **SSP allocation**: Not applicable (single PO).

**Expected Schedule:**
- Monthly revenue recognition: $360,000 / 36 = $10,000/month, straight-line, April 2025–March 2028.
- Deferred revenue balance rolls down accordingly from each annual prepayment.

---

## ANSWER KEY 2: Brightwell Logistics (Distinct Implementation)

**Extraction — Expected Facts:**
| Field | Value | Source |
|---|---|---|
| Customer | Brightwell Logistics, LLC | Preamble |
| Effective Date | June 14, 2025 | Preamble |
| Term | July 1, 2025 – June 30, 2028 (36 months) | Section 2 |
| Platform | 400 seats, Enterprise Tier, $600/seat/yr = $240,000/yr | Exhibit A |
| Implementation Fee | $48,000 one-time | Exhibit A |
| TCV | $768,000 | Exhibit A |
| Comparable pricing | 14 standalone implementation sales at $560–640/hr | Exhibit A note |
| Commission | 8% × $768,000 = $61,440; 50/50 | Sales Comp Reference |

**Judgments Expected:**
1. **Distinctness of Implementation Services**: **Distinct.** Reasoning: (a) capable of being distinct — Customer can use and benefit from the Platform independently, using default configuration, per Section 3's explicit statement; (b) separately identifiable — implementation does not significantly modify/customize the Platform's functionality, no integration/customization language present. Both distinctness criteria (ASC 606-10-25-19) met → separate PO. Confidence: **high** — explicit contract language directly supports both prongs.
2. **SSP — Implementation Services**: Observable/comparable pricing exists (14 prior standalone sales at consistent per-hour rates). SSP method: **adjusted market assessment / observable comparable pricing**, not residual (residual not needed or appropriate since comparables exist). Confidence tier: **observed_high** (14 comparables, consistent range).
3. **SSP — Platform Subscription**: Extensive observable comparable pricing (standard per-seat list price). Confidence: **observed_high**.
4. **Recognition pattern — Platform**: Over time, ratably over 36 months.
5. **Recognition pattern — Implementation**: Over time (not point-in-time), since Kestrel has a right to payment for performance completed to date and no alternative use exists for the configuration work — recognized over the implementation delivery period (should be flagged: contract doesn't state an explicit implementation duration; system should flag this as a **missing fact requiring clarification** — e.g., "implementation delivery period not explicitly stated; recommend confirming expected duration for recognition timing, estimated ~80 hours of effort suggests a short delivery window, likely 4-8 weeks").

**Expected Schedule:**
- Platform: $240,000/yr recognized ratably monthly ($20,000/month) over 36 months.
- Implementation: $48,000 recognized over the (to-be-confirmed) implementation period, not recognized entirely at signing — this is the key "common mistake" this contract is designed to test against (naive systems often recognize services fees at contract signing).

---

## ANSWER KEY 3: Corvus Manufacturing (Non-Distinct Implementation)

**Extraction — Expected Facts:**
| Field | Value | Source |
|---|---|---|
| Customer | Corvus Manufacturing Corp. | Preamble |
| Effective Date | September 9, 2025 | Preamble |
| Term | 36 months from Go-Live (Go-Live date variable/TBD) | Section 2, Exhibit A |
| Platform | 600 seats, Enterprise Tier, $650/seat/yr = $390,000/yr, **billing begins at Go-Live** | Exhibit A |
| Integration Services | $310,000, milestone billed ($100K/$130K/$80K) | Exhibit A |
| TCV | $1,480,000 | Exhibit A |
| Commission | 8% × $1,480,000 = $118,400; 50/50 signing/Go-Live | Sales Comp Reference |

**Judgments Expected:**
1. **Distinctness of Custom Integration & Deployment Services**: **NOT distinct.** Reasoning: explicit contract language states Platform is "not usable in a manner that provides its intended benefit" until integration is substantially complete (fails "capable of being distinct" and/or "separately identifiable" — Customer cannot benefit from the Platform on its own). This is the direct negative-case contrast to Contract 2. The custom workflow logic modification and custom reporting also indicate significant customization of the Platform itself (another distinctness disqualifier per ASC 606-10-25-21). Confidence: **high** — explicit, unambiguous contract language.
2. **Combined single PO**: Platform + Integration Services should be treated as a **single combined performance obligation**, recognized together based on the pattern of transfer for the combined bundle (likely over-time based on cost-to-cost or another input method reflecting the integration effort, transitioning into the ongoing Platform access period).
3. **Recognition pattern**: Over time, using an appropriate measure of progress (e.g., cost-to-cost for the integration-heavy early period). This should be flagged as a **judgment requiring further input** — the contract doesn't provide enough detail (e.g., estimated total costs) to fully automate the measure of progress; system should propose cost-to-cost as the method and request supporting cost data.
4. **Milestone billing ≠ revenue recognition timing**: System should NOT recognize revenue at each milestone invoice date — milestone billing is a payment/invoicing mechanic, not a recognition trigger. This is an important "don't confuse billing schedule with recognition schedule" test case.
5. **Transaction price**: Total combined PO price = $1,480,000 (since it's one PO, no SSP allocation is needed between Platform and Integration Services — allocation only matters across *distinct* POs).

**Expected Schedule:**
- No separate implementation revenue recognized at any milestone date.
- Single combined-PO revenue recognition begins at contract inception (or per accounting policy, potentially at start of integration work) and continues on a cost-to-cost or similar progress basis through the point where the "Go-Live"-triggered ongoing Platform term takes over — this is genuinely complex and should be flagged in the memo as warranting careful measure-of-progress documentation.

---

## ANSWER KEY 4: Halden Financial (Deferred-Start Premium Support)

**Extraction — Expected Facts:**
| Field | Value | Source |
|---|---|---|
| Customer | Halden Financial Group | Preamble |
| Effective Date | January 12, 2025 | Preamble |
| Term | Feb 1, 2025 – Jan 31, 2028 (36 months) | Section 2 |
| Platform | 300 seats, Pro Tier, $500/seat/yr = $150,000/yr, Years 1–3 | Exhibit A |
| Premium Support | $36,000/yr, **Years 2–3 only** (starts Feb 1, 2026) | Section 3, Exhibit A |
| TCV | $522,000 | Exhibit A |
| Commission | 8% × $522,000 = $41,760; 50/50 signing/Year 2 start | Sales Comp Reference |

**Judgments Expected:**
1. **Not a modification**: Premium Support is specified in the **original** contract at signing, merely with a deferred start date — this is critical to flag correctly. System should NOT create an `Amendment` record or treat this as a contract modification; it is an originally-contracted PO with a future service period.
2. **Distinctness of Premium Support**: **Distinct.** It's a separately identifiable support service, priced consistently with standalone list pricing ($120/seat/yr matches standard rate card per the contract note), not integrated/interdependent with the core Platform in a way that would make it non-distinct.
3. **SSP — Premium Support**: Observable — matches standard list price exactly, no discount applied. Confidence: **observed_high**.
4. **Number of POs**: **Two POs** — Platform Subscription (full 36-month term) and Premium Support (24-month term, Years 2–3 only, distinct start date).
5. **Allocation**: Since both POs have observable SSP equal to their stated contract price (no bundled discount), allocated price = stated price for each. No residual method needed.
6. **Recognition pattern — Platform**: Ratably over 36 months from Feb 1, 2025.
7. **Recognition pattern — Premium Support**: Ratably over its own 24-month service period, **starting Feb 1, 2026, not before** — even though the contract was fully executed and largely paid for (in part) at the earlier signing date. System should correctly NOT begin recognizing Premium Support revenue until the service period actually begins, regardless of contract execution date.

**Expected Schedule:**
- Platform: $150,000/yr ($12,500/month) recognized Feb 2025–Jan 2028.
- Premium Support: $36,000/yr ($3,000/month) recognized **only** Feb 2026–Jan 2028 (24 months) — zero revenue recognized for this PO in Year 1.
- Commission: Full $41,760 capitalized at signing (Jan 12, 2025) regardless of the deferred service start of one PO — capitalization timing is driven by contract execution/commission being earned, not by the service start date of any individual PO. This is worth flagging as its own confirmatory judgment note in the memo.
