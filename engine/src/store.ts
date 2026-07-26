/**
 * In-memory judgment store enforcing PRD §2.2: judgments are immutable and versioned, never edited in
 * place. A reassessment or override does not mutate the old row — it appends a new judgment and marks
 * the old one `superseded`, keeping the original reasoning permanently retrievable.
 *
 * This is an in-memory stand-in for the eventual append-only table; the API is what matters — there is
 * deliberately no `update()` method.
 */
import type { Judgment } from "./model.js";

let counter = 0;
export function newJudgmentId(): string {
  counter += 1;
  return `jdg_${String(counter).padStart(4, "0")}`;
}

export class JudgmentStore {
  private readonly byId = new Map<string, Judgment>();

  /** Append a brand-new judgment. */
  add(j: Judgment): Judgment {
    if (this.byId.has(j.id)) throw new Error(`Judgment ${j.id} already exists — judgments are immutable.`);
    this.byId.set(j.id, { ...j });
    return this.byId.get(j.id)!;
  }

  /**
   * Record a reassessment: create `replacement` as a new row and mark `oldId` superseded, linking the
   * two. The old judgment's original reasoning is retained unchanged. Returns the new judgment.
   */
  supersede(oldId: string, replacement: Judgment): Judgment {
    const old = this.byId.get(oldId);
    if (!old) throw new Error(`Cannot supersede unknown judgment ${oldId}.`);
    if (old.status === "superseded") throw new Error(`Judgment ${oldId} is already superseded.`);
    // The only permitted "change" to an existing row: flip status + set the forward link. Nothing else.
    this.byId.set(oldId, { ...old, status: "superseded", superseded_by: replacement.id });
    const created = { ...replacement, supersedes: oldId };
    this.byId.set(created.id, created);
    return created;
  }

  /** Approve a judgment by superseding it with an identical row carrying the human decision. */
  approve(id: string, approvedBy: string): Judgment {
    const j = this.get(id);
    const decided: Judgment = {
      ...j,
      id: newJudgmentId(),
      status: "approved",
      human_decision: { approved_by: approvedBy, decision: "accepted", override_reason: null, timestamp: nowIso() },
      supersedes: null,
      superseded_by: null,
      created_at: nowIso(),
    };
    return this.supersede(id, decided);
  }

  get(id: string): Judgment {
    const j = this.byId.get(id);
    if (!j) throw new Error(`No judgment ${id}.`);
    return j;
  }

  all(): Judgment[] {
    return [...this.byId.values()];
  }

  /** Current (non-superseded) approved judgments — the only ones schedules/memos may derive from. */
  approved(): Judgment[] {
    return this.all().filter((j) => j.status === "approved" && j.superseded_by === null);
  }
}

export function nowIso(): string {
  return new Date().toISOString();
}
