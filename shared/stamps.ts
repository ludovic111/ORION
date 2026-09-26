import type { Deletion, Journal, Revision } from "./journal.ts";
import type { HistoryEvent } from "./events.ts";
import { canonicalStamp, nodeOf, tick } from "./hlc.ts";

// Every stamp a journal holds: the clock of each record, removals, versions
// and deletions of entries, history events. The latest one is where the
// hybrid logical clock of a post continues from for this journal; the latest
// one of each post (the version vector) tells a peer what this post has.

const wallStamp = (at: string) => canonicalStamp(at);
export const revisionStamp = (r: Pick<Revision, "hlc" | "at">) =>
  r.hlc ?? wallStamp(r.at);
export const deletionStamp = (d: Pick<Deletion, "hlc" | "at">) =>
  d.hlc ?? wallStamp(d.at);
export const eventStamp = (e: Pick<HistoryEvent, "hlc" | "at">) =>
  e.hlc ?? wallStamp(e.at);

/** Call `visit` with every stamp of a journal. */
export function eachStamp(journal: Journal, visit: (stamp: string) => void) {
  for (const s of Object.values(journal.sync.clock)) visit(s);
  for (const s of Object.values(journal.sync.removed)) visit(s);
  for (const e of journal.entries)
    for (const r of e.revisions) visit(revisionStamp(r));
  for (const d of journal.deleted) visit(deletionStamp(d));
  for (const e of journal.history) visit(eventStamp(e));
}

const latest = new WeakMap<Journal, string>();
/** Latest stamp of a journal ("" when it has none). */
export function maxStamp(journal: Journal): string {
  let value = latest.get(journal);
  if (value === undefined) {
    let top = "";
    eachStamp(journal, (s) => {
      if (s > top) top = s;
    });
    value = top;
    latest.set(journal, value);
  }
  return value;
}

// A stamp at least as late as every stamp of a journal, known without
// scanning it (set when this post stamped it). Enough to continue the clock;
// maxStamp() stays exact for the decisions every post must take alike.
const bounds = new WeakMap<Journal, string>();
export const setBound = (journal: Journal, stamp: string) =>
  bounds.set(journal, stamp);
export const boundOf = (journal: Journal) =>
  bounds.get(journal) ?? maxStamp(journal);

/** Next stamp for a change of this journal on this post. */
export const nextStamp = (
  journal: Journal,
  at: string | number = Date.now(),
  after = "",
) => {
  const top = boundOf(journal);
  return tick(top > after ? top : after, at);
};

export type VersionVector = Record<string, string>;
const vectors = new WeakMap<Journal, VersionVector>();
/** Latest stamp of each post in a journal ("" for stamps before 2.1). */
export function versionVector(journal: Journal): VersionVector {
  let value = vectors.get(journal);
  if (!value) {
    const vv: VersionVector = {};
    eachStamp(journal, (s) => {
      const n = nodeOf(s);
      if (!vv[n] || s > vv[n]) vv[n] = s;
    });
    value = vv;
    vectors.set(journal, value);
  }
  return value;
}
/** Whether a peer that has `vv` may lack the change stamped `stamp`. */
export const unseen = (stamp: string, vv: VersionVector) =>
  stamp > (vv[nodeOf(stamp)] ?? "");
