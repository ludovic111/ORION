import { z } from "zod";
import { stampSchema } from "./hlc.ts";

// One change of one record of a journal: who, what, when, and the state of
// the record after the change. The history is append-only and travels with
// the journal (archives and live synchronisation), so every post can show
// who did what and rebuild the whole operation as it was at any time.
//
// Kept apart from history.ts so that journal.ts can use the schema without
// an import cycle.

export const HISTORY_ACTIONS = ["create", "update", "remove"] as const;
export type HistoryAction = (typeof HISTORY_ACTIONS)[number];

export const eventSchema = z
  .object({
    id: z.uuid(),
    at: z.iso.datetime({ offset: true }),
    by: z.string().max(120),
    action: z.enum(HISTORY_ACTIONS),
    // "ops.places", "radio.stations", "meta", "settings"…
    scope: z.string().max(40),
    // Record id, or "meta" / "settings".
    target: z.string().max(80),
    // The record after the change; null when removed.
    state: z.unknown(),
    // Successive quick edits by the same person are folded into one event;
    // the highest revision wins when two posts disagree.
    rev: z.number().int().min(0).default(0),
    note: z.string().max(500).default(""),
    // Hybrid logical clock of the change (shared/hlc.ts): orders the events
    // of a record whatever the clocks of the posts, and tells a peer which
    // events it lacks. Events written before 2.1 have none (their time
    // counts).
    hlc: stampSchema.optional(),
    // Stamp of the version the change was made from ("" for a new record):
    // two changes made from the same version were concurrent.
    base: z.string().max(64).optional(),
  })
  .strict();
export type HistoryEvent = z.infer<typeof eventSchema>;

// ---------- Compaction ----------
//
// The history grows with every change. Once it is large, intermediate
// versions older than a watermark (journal.sync.compacted, advanced by
// appendHistory and merged as a maximum) are thinned: for each record, only
// the last version of each 15-minute step is kept, of each 2-hour step after
// 7 days and of each day after 30 days. Creations and removals are always
// kept, so the time machine still shows when each record appeared and
// disappeared, with coarser steps in between. The steps are aligned on fixed
// times, so thinning is the same on every post and merges stay commutative,
// associative and idempotent: thin(A ∪ B) = thin(thin(A) ∪ B).

/** Most events a journal keeps. */
export const MAX_HISTORY = 500_000;
/** Below this size, the history is never thinned. */
export const COMPACT_FROM = 5_000;
const MINUTES_15 = 15 * 60_000;
const HOURS_2 = 2 * 3_600_000;
const DAY = 86_400_000;

const time = (iso: string) => {
  const t = Date.parse(iso);
  return Number.isNaN(t) ? 0 : t;
};
/** Order key of an event: its stamp (or time), then its id. */
export const eventKey = (e: Pick<HistoryEvent, "hlc" | "at" | "id">) =>
  `${e.hlc ?? new Date(time(e.at)).toISOString()}|${e.id}`;

function bucket(at: number, watermark: number): string | null {
  const age = watermark - at;
  if (age <= 0) return null;
  const width = age > 30 * DAY ? DAY : age > 7 * DAY ? HOURS_2 : MINUTES_15;
  return `${width}:${Math.floor(at / width)}`;
}

/** The history thinned before a watermark (see above). */
export function thinHistory(
  history: HistoryEvent[],
  watermark: string | undefined,
): HistoryEvent[] {
  const w = watermark ? time(watermark.slice(0, 24)) : 0;
  if (!w) return history;
  const newest = new Map<string, HistoryEvent>();
  let candidates = 0;
  for (const e of history) {
    if (e.action !== "update") continue;
    const b = bucket(time(e.at), w);
    if (b === null) continue;
    candidates++;
    const k = `${e.target}|${b}`;
    const known = newest.get(k);
    if (!known || eventKey(e) > eventKey(known)) newest.set(k, e);
  }
  if (candidates === newest.size) return history;
  return history.filter((e) => {
    if (e.action !== "update") return true;
    const b = bucket(time(e.at), w);
    return b === null || newest.get(`${e.target}|${b}`) === e;
  });
}

/**
 * Last resort when thinning is not enough: drop the oldest intermediate
 * versions (never a creation or a removal) down to the limit.
 */
export function capHistory(
  history: HistoryEvent[],
  limit = MAX_HISTORY,
): HistoryEvent[] {
  if (history.length <= limit) return history;
  const updates = history
    .filter((e) => e.action === "update")
    .sort((a, b) => (eventKey(a) < eventKey(b) ? -1 : 1));
  const drop = new Set(updates.slice(0, history.length - limit));
  return history.filter((e) => !drop.has(e));
}
