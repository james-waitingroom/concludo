/**
 * CLI entry point for the extraction spike.
 *
 *   npm run spike                 # run all 15 contracts
 *   npm run spike -- --only 12    # run just contract 12
 *   npm run spike -- --only 12,15 # run a subset
 *
 * Orchestrates: load contract → extract (mock or real) → deterministic validate → diff vs
 * expectations → report. Exit code is non-zero if any evaluated contract FAILs, so this can gate CI.
 */
import "dotenv/config";
import { loadContracts } from "./contracts.js";
import { makeExtractionClient } from "./llm/client.js";
import { validate } from "./validate.js";
import { diff, type DiffResult } from "./diff.js";
import { expectationFor } from "./expectations.js";
import { printBanner, printContract, printSummary } from "./report.js";

function parseOnly(argv: string[]): Set<number> | null {
  const idx = argv.indexOf("--only");
  if (idx === -1) return null;
  const raw = argv[idx + 1];
  if (!raw) return null;
  return new Set(raw.split(",").map((s) => Number(s.trim())).filter((n) => Number.isFinite(n)));
}

async function main(): Promise<void> {
  const only = parseOnly(process.argv.slice(2));
  const client = makeExtractionClient();
  const model = client.mode === "real" ? process.env.ANTHROPIC_MODEL?.trim() || "claude-opus-4-8" : null;

  printBanner(client.mode, model);

  const contracts = loadContracts().filter((k) => (only ? only.has(k.id) : true));
  if (contracts.length === 0) {
    console.error("No contracts matched. Check --only ids or the contracts/ directory.");
    process.exitCode = 2;
    return;
  }

  const results: DiffResult[] = [];
  for (const contract of contracts) {
    const exp = expectationFor(contract.id);
    if (!exp) {
      console.warn(`(no expectation for contract ${contract.id}; skipping)`);
      continue;
    }
    let extraction;
    try {
      extraction = await client.extract(contract);
    } catch (err) {
      console.error(`\nContract ${contract.id} — extraction ERROR: ${(err as Error).message}`);
      results.push({
        id: contract.id, verdict: "FAIL", escalationExpected: exp.escalation,
        blocking: false, conflictCount: 0, fields: [],
        issues: [`Extraction threw: ${(err as Error).message}`],
      });
      continue;
    }
    const validation = validate(extraction);
    const d = diff(extraction, exp, validation);
    results.push(d);
    printContract(contract.id, contract.name, d, validation);
  }

  printSummary(results);

  const failed = results.some((r) => r.verdict === "FAIL");
  // Set exitCode and let the event loop drain naturally — calling process.exit() while the HTTP
  // client still holds keep-alive sockets triggers a libuv teardown assertion on Windows.
  process.exitCode = failed ? 1 : 0;
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
