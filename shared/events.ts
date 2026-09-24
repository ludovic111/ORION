import { z } from "zod";

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
  })
  .strict();
export type HistoryEvent = z.infer<typeof eventSchema>;
