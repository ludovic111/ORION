import type { Journal, Workspace } from "./journal.ts";
import { digest, isSlice, sliceJournal } from "./sync.ts";
import { versionVector, type VersionVector } from "./stamps.ts";
import { later } from "./hlc.ts";

// Decisions of the synchronisation protocol (used by src/sync/useSync.ts),
// kept free of the network so that they can be tested.
//
// - A hello carries, per journal, its digest and its version vector.
// - The answer to a hello is, per journal that differs: the whole journal
//   when the peer does not have it, else only what it lacks (sliceJournal
//   against its vector). A peer whose digest did not move since our last
//   partial answer (its vector claimed more than it had, e.g. after a lost
//   message) gets the whole journal, at most once a minute.
// - A local change leaves as the difference with what was already sent.

export type Summary = Record<string, { d: string; w: VersionVector }>;
/** What this post remembers of one peer. */
export type PeerMemory = {
  /** Digest the peer had when we last sent it a partial journal. */
  partial: Map<string, string>;
  /** When we last sent it a whole journal. */
  whole: Map<string, number>;
};
export const newMemory = (): PeerMemory => ({
  partial: new Map(),
  whole: new Map(),
});
export const FULL_INTERVAL = 60_000;

export async function summarise(journals: Journal[]): Promise<Summary> {
  return Object.fromEntries(
    await Promise.all(
      journals.map(
        async (j) =>
          [j.id, { d: await digest(j), w: versionVector(j) }] as const,
      ),
    ),
  );
}

/** What to send a peer after its hello, and whether we differ at all. */
export async function answerHello(
  journals: Journal[],
  gone: Workspace["gone"],
  theirs: Summary,
  memory: PeerMemory,
  now = Date.now(),
): Promise<{ send: Journal[]; differ: boolean }> {
  const send: Journal[] = [];
  let differ = false;
  for (const j of journals) {
    const t = theirs[j.id];
    const mine = await digest(j);
    if (t && t.d === mine) continue;
    differ = true;
    if (!t) {
      send.push(j);
      continue;
    }
    const stale =
      memory.partial.get(j.id) === t.d &&
      now - (memory.whole.get(j.id) ?? -Infinity) > FULL_INTERVAL;
    if (stale) {
      send.push(j);
      memory.whole.set(j.id, now);
    } else {
      const slice = sliceJournal(j, t.w ?? {});
      if (slice) send.push(slice);
    }
    memory.partial.set(j.id, t.d);
  }
  // Journals the peer has and we do not (unless removed here).
  const own = new Set(journals.map((j) => j.id));
  for (const id of Object.keys(theirs))
    if (!own.has(id) && !gone?.[id]) differ = true;
  return { send, differ };
}

/** Latest stamps of two vectors. */
export const vvMax = (a: VersionVector = {}, b: VersionVector = {}) => {
  const out = { ...a };
  for (const [n, s] of Object.entries(b)) out[n] = later(out[n], s);
  return out;
};

/**
 * The local changes of `ids` not sent yet: a slice against what was
 * announced, or the whole journal the first time. Updates `announced`.
 */
export function localChanges(
  journals: Journal[],
  ids: string[],
  announced: Map<string, VersionVector>,
): Journal[] {
  const out: Journal[] = [];
  // A journal removed here and added again leaves whole.
  const present = new Set(journals.map((j) => j.id));
  for (const id of [...announced.keys()])
    if (!present.has(id)) announced.delete(id);
  for (const j of journals) {
    if (!ids.includes(j.id)) continue;
    const sent = announced.get(j.id);
    const part = sent ? sliceJournal(j, sent) : j;
    if (part) out.push(part);
    announced.set(j.id, vvMax(sent, versionVector(j)));
  }
  return out;
}

/** Ids of the journals of a message that are only parts (slices). */
export const partialIds = (journals: Journal[]) =>
  journals.filter(isSlice).map((j) => j.id);

/**
 * Journals of a received message that can be merged: a part of a journal
 * this post does not have would show an incomplete journal; it is left out
 * (`missing`), and the sender is asked for the whole one.
 */
export function usable(
  localIds: Iterable<string>,
  journals: Journal[],
  partial: string[] = [],
): { journals: Journal[]; missing: string[] } {
  const own = new Set(localIds);
  const parts = new Set(partial);
  const missing = journals
    .filter((j) => parts.has(j.id) && !own.has(j.id))
    .map((j) => j.id);
  return {
    journals: missing.length
      ? journals.filter((j) => !missing.includes(j.id))
      : journals,
    missing,
  };
}

/** What the others were told by a received message. */
export function noteReceived(
  journals: Journal[],
  announced: Map<string, VersionVector>,
) {
  for (const j of journals)
    announced.set(j.id, vvMax(announced.get(j.id), versionVector(j)));
}
