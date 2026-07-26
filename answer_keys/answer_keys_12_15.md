# ANSWER KEYS — Contracts 12–15

---

## ANSWER KEY 12: Piermont Analytics (MSA/Order Form Numeric Mismatch)

**This is primarily an extraction/reconciliation test, not an ASC 606 judgment test.**

**Extraction — Expected Facts (and expected conflict flags):**
| Field | Value | Source | Conflict? |
|---|---|---|---|
| Customer | Piermont Analytics, Inc. | Preamble | No |
| MSA Execution Date | February 6, 2026 | Preamble | No |
| Order Form Date | February 9, 2026 | Exhibit A | **Flag: Order Form dated 3 days after MSA** — should be extracted as a fact, not silently normalized away |
| Seat count — MSA body | ~275 seats (approximate/anticipated language) | Section 1 | **Conflicting with Exhibit A** |
| Seat count — Order Form (controlling) | 310 seats | Exhibit A | **Controls per Section 1's precedence clause** |
| Seat count — CRM record | 275 seats | Sales Comp Reference | **Stale — predates final Order Form** |
| Annual Fee — Order Form | $155,000 | Exhibit A | Controlling figure |
| TCV — Order Form | $465,000 | Exhibit A | Controlling figure |
| TCV — CRM (stale) | $412,500 | Sales Comp Reference | **Should NOT be used for commission calc** |

**Expected System Behavior (this is the core test):**
1. **Precedence clause recognition**: The system must correctly extract and apply Section 1's explicit precedence rule ("Exhibit A shall control... as to fees and quantities") — this is itself an extraction target, not something to assume by default. A system that doesn't specifically look for and apply a stated precedence clause will not know which of the two seat counts to trust.
2. **Three-way conflict flag**: system should identify **three different seat-count figures** (275 in MSA body language, 310 in the controlling Order Form, 275 again in the stale CRM record) and correctly determine, via the precedence clause, that **310 is the correct, controlling figure** — while still surfacing all three as a reconciliation record for human visibility, not silently resolving and hiding the discrepancy.
3. **CRM staleness detection**: system should flag that the CRM record's last-updated timestamp (Feb 6) predates the controlling Order Form's execution (Feb 9), and should **not** use the CRM figures for the commission calculation — commission should be computed on the actual executed TCV ($465,000), not the stale CRM TCV ($412,500). This directly tests the "don't trust secondary/CRM data over the primary executed document" principle from our design discussion.
4. **No ASC 606 judgment complexity beyond this** — single PO (Platform Subscription only), same structure as Contract 1, once the correct seat count/fee is established. The judgment layer here should be straightforward; the test is entirely about whether extraction correctly reconciles conflicting sources using the contract's own stated precedence rules.

**Expected Schedule:**
- Single PO, $465,000 TCV, recognized ratably over 36 months from March 1, 2026 ($12,916.67/month).
- Commission: 8% × $465,000 = $37,200 (not the stale $412,500-based figure), 50/50 signing/anniversary.

---

## ANSWER KEY 13 & 14: See dedicated commission-focused documents (Contracts 13 and 14 already contain full expected judgment outcomes embedded directly in their source documents, since they are themselves structured as combined fact-pattern-plus-expected-policy-application documents, unlike Contracts 1–12 and 15 which separate the contract from its answer key). No separate answer key file is needed for 13/14 — refer to the "Expected Judgment Outcome for This Contract" section within each source document.

---

## ANSWER KEY 15: Fenwick & Vale Co-Op (Adversarial Extraction Stress Test)

**This is purely an extraction-quality test. There is intentionally no clean "correct" ASC 606 judgment to reach — the correct system behavior is to recognize ambiguity and escalate, not to guess.**

**Expected System Behavior — What "Passing" Looks Like:**

1. **Term length conflict**: system must detect and flag that Section 1 states 24 months while Section 8 (referenced but not fully quoted in this excerpt) references "the initial 36-month term" — a direct internal contradiction with **no resolving amendment in the executed document itself.** System should NOT pick one arbitrarily and proceed; it should surface this as a **blocking extraction conflict** requiring human resolution before any judgment or recognition schedule is built.
2. **Missing notice period**: Section 3 references an auto-renewal notice period left blank in the original document. System should flag this as a **missing required field**, not silently assume a default (e.g., don't assume "60 days" just because that's been the common pattern in other contracts in this suite — that would be fabricating a fact not present in this specific document).
3. **Illegible/obscured text**: Section 4's termination refund carve-out is cut off/illegible. System should flag this explicitly as **"extraction incomplete — source text illegible/obscured"** rather than omitting the field silently or guessing plausible boilerplate language.
4. **Seat count ambiguity**: Section 5 gives a range (180-220), Schedule 1 gives a specific figure (195) that falls within the range, and a handwritten margin note appears to confirm 195 — but the note itself states the confirmation is "pending" a formal document update that was never completed. System should extract 195 as the **most likely correct figure** but explicitly flag the **lower reliability** of this conclusion given it rests partly on an unresolved handwritten annotation rather than a clean contractual statement, and should note the range-vs-fixed-number tension explicitly rather than treating Schedule 1's figure as unambiguously authoritative on its own.
5. **TCV cannot be computed with confidence**: because the term-length conflict (24 vs. 36 months) directly drives which TCV figure is correct ($165,750 vs. $248,625), and this conflict is unresolved in the executed document, **system should refuse to auto-generate a definitive TCV or recognition schedule**, and instead should generate an **exception/escalation record** — this is the single most important test in this whole contract: does the system correctly recognize when it does NOT have enough reliable information to proceed, versus forcing an answer anyway. A system that picks 36 months because "the sales rep's forwarded email said so" is also failing the test in a different way — the email is **not part of the executed legal document** and should be treated as supplementary context/evidence for a human resolving the conflict, not as authoritative extraction input on its own. It's appropriate for the system to surface the email as relevant supporting context for a human reviewer, but not to treat it as if it were contract language.
6. **Illegible signature date and missing title field**: minor but real extraction robustness tests — system should flag the partially illegible date and the blank title field as low-confidence/incomplete extractions rather than fabricating plausible values.
7. **Commission**: correctly should NOT be calculated or finalized, consistent with the contract's own internal note flagging this for manual review — system should propagate that same "do not finalize" status into its own commission Judgment record rather than computing a number based on either possible TCV interpretation.

**What the Extraction Confidence/Validation Layer (Stage 3/4 from our pipeline design) Should Produce for This Contract:**
- A high volume of **deterministic validation failures**: date inconsistency, missing required field (notice period), internal contradiction (term length), unresolved reconciling documentation (handwritten note, unsigned confirmation email).
- This contract should **not** proceed automatically into the Judgment engine at all — it should stop at the Stage 5 human-confirmation gate in the extraction pipeline, fully populated with every flagged issue, before any ASC 606 reasoning is attempted on top of unreliable facts. This directly validates the "extraction before judgment" gating principle from the build-sequencing discussion — this contract is designed to test that gate specifically, not to produce a gold-standard downstream accounting answer at all.
