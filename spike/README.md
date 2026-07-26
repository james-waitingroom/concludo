# Concludo — Extraction Spike

**Throwaway spike, not product code.** This implements Step 1 of the PRD build sequence (§7): ingest
each of the 15 test contracts, extract structured facts with **mandatory provenance + confidence**,
run a **deterministic validation pass**, and diff against curated expectations — to learn *where
extraction breaks* before any schema/product work.

The load-bearing outcome is the **escalation gate** (PRD §8): contracts **12** and **15** must
*escalate* rather than produce a confident guess.

## Run it (no API key needed)

```bash
cd spike
npm install
npm run spike
```

With no `ANTHROPIC_API_KEY`, the spike runs in **MOCK mode**: contracts 1, 12, and 15 use
hand-authored fixtures (curated from the gold answer keys) so the whole pipeline — validation, the
escalation gate, the diff, the report — is exercisable today. The other contracts show `STUB`.

Other commands:

```bash
npm run typecheck            # tsc --noEmit
npm run spike -- --only 15   # just the adversarial contract
npm run spike -- --only 12,15
```

Exit code is non-zero if any evaluated contract FAILs (so it can gate CI).

## Run against real Claude

1. Get a key at <https://console.anthropic.com/settings/keys>.
2. `cp .env.example .env` and paste your key into `ANTHROPIC_API_KEY`.
   - PowerShell alternative for one session: `$env:ANTHROPIC_API_KEY = "sk-ant-..."`
3. `npm run spike`

Now all 15 contracts run through Claude with the extraction schema as a **tool `input_schema`**
(schema-constrained / tool-use); the model's output is validated back through Zod. Read the report to
see **where real extraction actually breaks** — which is the entire point of this step.

Optional: `ANTHROPIC_MODEL` overrides the model (defaults to `claude-opus-4-8`).

## How to read the report

Per contract you get:
- a **verdict** (`PASS` / `FAIL` / `STUB`),
- the **escalation line** — what was expected (`none` / `flag & resolve` / `BLOCKING`) vs. what
  happened (`proceed` / `BLOCKED`) and how many conflicts were raised,
- **field diffs** against the expected gate facts (customer, dates, term, fees, TCV),
- **validation checks** (line-item sums, term-date consistency, required fields — all deterministic,
  no LLM),
- **conflicts** raised, with `[BLOCKING]` marked,
- **why fail** reasons when applicable.

The summary ends with the **escalation gate** status for contracts 12 & 15.

## Files

| File | Role |
|---|---|
| `src/schema.ts` | Zod extraction schema; every fact is `{value, source:{clause,quote}, confidence}` |
| `src/llm/prompt.ts` | Extraction system prompt (escalate-don't-guess) |
| `src/llm/client.ts` | Swappable client — `MockClient` / `RealClient` (auto-selected on key presence) |
| `src/llm/mockFixtures.ts` | Hand-authored extractions for the gate contracts 1, 12, 15 |
| `src/contracts.ts` | Loads `../contracts/*.md` |
| `src/validate.ts` | Deterministic validation + escalation decision |
| `src/expectations.ts` | Machine-readable expected gate facts + escalation mode per contract |
| `src/diff.ts` | Extraction vs. expectations → verdict |
| `src/report.ts` | Console report |
| `src/runSpike.ts` | CLI runner |

## What this spike is NOT

No judgment engine (distinctness/SSP/recognition/modifications/commissions), no persistence or
versioning, no review UI, no policy/gap detection, no balances/JE export — those are later PRD steps.
The diff is against a **curated expectations table** of objective gate fields, not a full parse of the
prose answer keys (which only becomes meaningful once the judgment engine exists).
