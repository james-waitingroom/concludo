/**
 * Console reporting for the spike run. Kept dependency-free (raw ANSI). The report is the actual
 * deliverable of Step 1: it should make "where does extraction break?" legible at a glance.
 */
import type { DiffResult } from "./diff.js";
import type { ValidationResult, Check } from "./validate.js";
import type { ClientMode } from "./llm/client.js";
import { EXPECTATIONS } from "./expectations.js";

const c = {
  reset: "\x1b[0m", bold: "\x1b[1m", dim: "\x1b[2m",
  green: "\x1b[32m", red: "\x1b[31m", yellow: "\x1b[33m", cyan: "\x1b[36m", gray: "\x1b[90m", magenta: "\x1b[35m",
};

function verdictBadge(v: DiffResult["verdict"]): string {
  switch (v) {
    case "PASS": return `${c.green}${c.bold}✓ PASS${c.reset}`;
    case "FAIL": return `${c.red}${c.bold}✗ FAIL${c.reset}`;
    case "STUB": return `${c.gray}○ STUB${c.reset}`;
  }
}

function checkGlyph(s: Check["status"]): string {
  switch (s) {
    case "pass": return `${c.green}✓${c.reset}`;
    case "fail": return `${c.red}✗${c.reset}`;
    case "warn": return `${c.yellow}!${c.reset}`;
    case "skip": return `${c.gray}–${c.reset}`;
  }
}

export function printBanner(mode: ClientMode, model: string | null): void {
  const line = "─".repeat(72);
  console.log(`\n${c.cyan}${c.bold}Concludo — Extraction Spike${c.reset}  ${c.dim}(PRD §7 Step 1)${c.reset}`);
  console.log(c.gray + line + c.reset);
  if (mode === "mock") {
    console.log(`${c.yellow}⚠ MOCK MODE${c.reset} — no ANTHROPIC_API_KEY set.`);
    console.log(`${c.dim}  Contracts 1, 12, 15 use hand-authored fixtures; the rest show STUB.${c.reset}`);
    console.log(`${c.dim}  Add a key (see README) to run all 15 through real Claude extraction.${c.reset}`);
  } else {
    console.log(`${c.green}● REAL MODE${c.reset} — extracting with ${c.bold}${model}${c.reset} via tool-use.`);
  }
  console.log(c.gray + line + c.reset);
}

export function printContract(
  id: number, name: string, d: DiffResult, v: ValidationResult,
): void {
  const exp = EXPECTATIONS[id];
  console.log(`\n${c.bold}Contract ${id}${c.reset} — ${name}  ${verdictBadge(d.verdict)}`);
  if (exp?.notes) console.log(`  ${c.dim}${exp.notes}${c.reset}`);

  // Escalation line
  const escWord = { none: "none expected", flag_and_resolve: "flag & resolve", blocking: "BLOCKING expected" }[d.escalationExpected];
  const escColor = d.escalationExpected === "blocking" ? c.magenta : d.escalationExpected === "flag_and_resolve" ? c.yellow : c.gray;
  const actual = d.blocking ? `${c.magenta}BLOCKED${c.reset}` : `${c.dim}proceed${c.reset}`;
  console.log(`  ${c.gray}escalation:${c.reset} ${escColor}${escWord}${c.reset} → actual ${actual} ${c.dim}(${d.conflictCount} conflict${d.conflictCount === 1 ? "" : "s"})${c.reset}`);

  if (d.verdict === "STUB") {
    console.log(`  ${c.gray}${d.issues[0]}${c.reset}`);
    return;
  }

  // Field diffs
  for (const f of d.fields) {
    const glyph = f.match ? `${c.green}✓${c.reset}` : `${c.red}✗${c.reset}`;
    const got = f.match ? `${c.dim}${f.got}${c.reset}` : `${c.red}${f.got}${c.reset} ${c.dim}(exp ${f.expected})${c.reset}`;
    console.log(`    ${glyph} ${f.field.padEnd(22)} ${got}`);
  }

  // Validation checks (only show non-pass to keep it tight, plus a count of passes)
  const passes = v.checks.filter((x) => x.status === "pass").length;
  const notable = v.checks.filter((x) => x.status !== "pass" && x.status !== "skip");
  if (notable.length) {
    console.log(`  ${c.gray}validation:${c.reset} ${c.green}${passes} passed${c.reset}, ${notable.length} notable:`);
    for (const chk of notable) console.log(`    ${checkGlyph(chk.status)} ${chk.name} — ${c.dim}${chk.detail}${c.reset}`);
  } else {
    console.log(`  ${c.gray}validation:${c.reset} ${c.green}${passes} passed, 0 issues${c.reset}`);
  }

  // Conflicts
  if (v.conflicts.length) {
    console.log(`  ${c.gray}conflicts:${c.reset}`);
    for (const cf of v.conflicts) {
      const b = cf.blocking ? `${c.magenta}[BLOCKING]${c.reset} ` : "";
      console.log(`    ${c.yellow}▸${c.reset} ${b}${c.bold}${cf.kind}${c.reset} on ${cf.field}: ${c.dim}${cf.description}${c.reset}`);
    }
  }

  // Failure reasons
  if (d.verdict === "FAIL") {
    console.log(`  ${c.red}${c.bold}why fail:${c.reset}`);
    for (const iss of d.issues) console.log(`    ${c.red}•${c.reset} ${iss}`);
  }
}

export function printSummary(results: DiffResult[]): void {
  const line = "─".repeat(72);
  const evaluated = results.filter((r) => r.verdict !== "STUB");
  const pass = evaluated.filter((r) => r.verdict === "PASS").length;
  const fail = evaluated.filter((r) => r.verdict === "FAIL").length;
  const stub = results.filter((r) => r.verdict === "STUB").length;

  console.log(`\n${c.gray}${line}${c.reset}`);
  console.log(`${c.bold}Summary${c.reset}`);
  console.log(`  ${c.green}${pass} passed${c.reset}   ${c.red}${fail} failed${c.reset}   ${c.gray}${stub} stub (not evaluated)${c.reset}   of ${results.length} contracts`);

  // The gate: contracts 12 & 15.
  const gate = [12, 15].map((id) => results.find((r) => r.id === id)).filter(Boolean) as DiffResult[];
  if (gate.length) {
    console.log(`\n  ${c.bold}Escalation gate (PRD §8):${c.reset}`);
    for (const g of gate) {
      const ok = g.verdict === "PASS";
      const badge = g.verdict === "STUB" ? `${c.gray}stub${c.reset}` : ok ? `${c.green}✓${c.reset}` : `${c.red}✗${c.reset}`;
      console.log(`    ${badge} Contract ${g.id}: expected ${g.escalationExpected}, ${g.blocking ? "blocked" : "proceeded"} with ${g.conflictCount} conflict(s)`);
    }
  }
  console.log(`${c.gray}${line}${c.reset}\n`);
}
