/**
 * Loads the 15 test contracts from ../contracts/*.md (relative to the repo root, one level up
 * from spike/). Each file is named like `01_meridian_health.md`; we key by the numeric id.
 */
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONTRACTS_DIR = join(__dirname, "..", "..", "contracts");

export interface TestContract {
  id: number;          // 1..15
  slug: string;        // e.g. "meridian_health"
  file: string;        // absolute path
  name: string;        // first-line title, cleaned
  text: string;        // full markdown
}

export function loadContracts(): TestContract[] {
  const files = readdirSync(CONTRACTS_DIR).filter((f) => f.endsWith(".md"));
  const contracts: TestContract[] = [];

  for (const file of files) {
    const match = /^(\d+)_(.+)\.md$/.exec(file);
    if (!match) continue;
    const id = Number(match[1]);
    const slug = match[2]!;
    const path = join(CONTRACTS_DIR, file);
    const text = readFileSync(path, "utf8");
    const firstLine = text.split("\n", 1)[0] ?? "";
    const name = firstLine.replace(/^#+\s*/, "").replace(/^CONTRACT\s+\d+:\s*/i, "").trim();
    contracts.push({ id, slug, file: path, name, text });
  }

  return contracts.sort((a, b) => a.id - b.id);
}

export function loadContract(id: number): TestContract {
  const c = loadContracts().find((c) => c.id === id);
  if (!c) throw new Error(`No contract with id ${id}`);
  return c;
}
