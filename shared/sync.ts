import {
  createdKey,
  journalSchema,
  nodeOr,
  numberLabel,
  assignSuffixes,
  suffixes,
  workspaceSchema,
  type Deletion,
  type Entry,
  type Journal,
  type Revision,
  type Workspace,
} from "./journal.ts";
import { callsignKey, radioSchema, type Radio } from "./radio.ts";
import { COLLECTIONS, type Message, type Ops } from "./ops.ts";
import {
  appendHistory,
  mergeHistory,
  stableStringify,
  titleOf,
  type Change,
} from "./history.ts";
import { eventKey, type HistoryEvent } from "./events.ts";
import { blobsOf } from "./blobs.ts";
import { later, localNode, tick } from "./hlc.ts";
import {
  deletionStamp,
  eventStamp,
  maxStamp,
  boundOf,
  setBound,
  revisionStamp,
  unseen,
  versionVector,
  type VersionVector,
} from "./stamps.ts";
import { resolveReference } from "./workflow.ts";

// Live synchronisation between posts without a database.
//
// Each post keeps the whole session. A local change stamps the records it
// touched (journal.sync.clock) and records removals (journal.sync.removed)
// with a hybrid logical clock (shared/hlc.ts): a change made after seeing
// another one is always later, whatever the clocks of the posts. Posts
// exchange what the other lacks (sliceJournal); mergeJournal() combines two
// versions the same way on every post, whatever the order, so all posts
// converge (commutative, associative, idempotent):
// - journal entries: union of versions (append-only), ordered by stamp;
// - deleted entries: union, a deletion wins over the entry;
// - every other record: the latest stamp wins, a removal wins over an
//   older change and loses to a later one;
// - entry and message numbers are never changed: two entries created at the
//   same time on two posts keep their number and are told apart by a suffix
//   (#007, #007·B), see suffixes() in shared/journal.ts.

type Keyed = { id: string };
type Clock = Journal["sync"];

const META = [
  "title",
  "organization",
  "location",
  "reference",
  "mode",
  "classification",
  "createdAt",
  "closedAt",
] as const;
const metaOf = (j: Journal) =>
  Object.fromEntries(META.map((k) => [k, j[k]])) as Pick<
    Journal,
    (typeof META)[number]
  >;

const same = (a: unknown, b: unknown) =>
  a === b || JSON.stringify(a) === JSON.stringify(b);

/** Every keyed collection of a journal except entries, by name. */
function keyed(j: Journal): [string, Keyed[]][] {
  return [
    ["radio.talkgroups", j.radio.talkgroups],
    ["radio.stations", j.radio.stations],
    ["radio.terminals", j.radio.terminals],
    ["radio.checks", j.radio.checks],
    ...COLLECTIONS.map((c) => [`ops.${c}`, j.ops[c]] as [string, Keyed[]]),
  ];
}

/** Latest stamp of `next`, knowing that of `previous` (cheap when possible). */
function latestOf(previous: Journal | undefined, next: Journal): string {
  if (!previous) return maxStamp(next);
  let top = boundOf(previous);
  const see = (s: string) => {
    if (s > top) top = s;
  };
  if (next.sync !== previous.sync) {
    Object.values(next.sync.clock).forEach(see);
    Object.values(next.sync.removed).forEach(see);
  }
  if (next.entries !== previous.entries)
    for (const e of next.entries)
      for (const r of e.revisions) see(revisionStamp(r));
  if (next.deleted !== previous.deleted)
    for (const d of next.deleted) see(deletionStamp(d));
  if (next.history !== previous.history)
    for (const e of next.history) see(eventStamp(e));
  return top;
}

/**
 * Stamp the versions and deletions of entries written on this post: their
 * clock, the version they were written from, the entries they cite.
 */
function stampEntries(
  previous: Journal | undefined,
  next: Journal,
  first: string,
  at: string,
): { journal: Journal; last: string } {
  let cursor = first;
  const step = () => {
    const value = cursor;
    cursor = tick(cursor, at);
    return value;
  };
  if (
    previous &&
    previous.entries === next.entries &&
    previous.deleted === next.deleted
  )
    return { journal: next, last: cursor };
  const before = new Map(previous?.entries.map((e) => [e.id, e]));
  let changed = false;
  const entries = next.entries.map((e) => {
    const old = before.get(e.id);
    if (old === e) return e;
    const known = new Set(old?.revisions.map((r) => r.id));
    // A version is written here when the entry existed, or when it is new
    // with its single first version (an imported entry keeps its own).
    const written = !!old || e.revisions.length === 1;
    let touched = false;
    const revisions = e.revisions.map((r, i): Revision => {
      if (!written || known.has(r.id) || r.hlc) return r;
      touched = true;
      const refs = resolveReference(r.fields.reference, next.entries, e.id).map(
        (x) => x.id,
      );
      return {
        ...r,
        hlc: step(),
        ...(i > 0 ? { base: e.revisions[i - 1].id } : {}),
        ...(refs.length ? { refs } : {}),
      };
    });
    if (!touched) return e;
    changed = true;
    return {
      ...e,
      revisions,
      ...(!old && !e.node ? { node: localNode() } : {}),
    };
  });
  const gone = new Set(previous?.deleted.map((d) => d.id));
  const deleted = next.deleted.map((d): Deletion => {
    if (gone.has(d.id) || d.hlc) return d;
    changed = true;
    const entry = before.get(d.id);
    return {
      ...d,
      hlc: step(),
      ...(entry ? { createdAt: entry.createdAt } : {}),
      ...(entry?.node ? { node: entry.node } : {}),
    };
  });
  // A deletion now dated may change which entry keeps a shared number.
  const stamped = changed ? { ...next, entries, deleted } : next;
  return {
    journal:
      deleted !== next.deleted && deleted.some((d, i) => d !== next.deleted[i])
        ? (assignSuffixes(stamped) as Journal)
        : stamped,
    last: cursor,
  };
}

/**
 * Record the local changes between two versions of a journal: stamps for
 * the synchronisation and events for the history (signed by `by`). `after`:
 * a stamp the changes must follow (the removal of a journal imported again).
 */
export function stampJournal(
  previous: Journal | undefined,
  next: Journal,
  at = new Date().toISOString(),
  by = "",
  after = "",
): Journal {
  if (previous === next) return next;
  const top = later(latestOf(previous, next), after);
  const stamp = tick(top, at);
  const clock = { ...next.sync.clock };
  const removed = { ...next.sync.removed };
  const changes: Change[] = [];
  let changed = false;
  const touch = (key: string) => {
    const base = clock[key] ?? "";
    clock[key] = stamp;
    delete removed[key];
    changed = true;
    return base;
  };
  if (!previous) {
    touch("meta");
    touch("settings");
    changes.push({
      scope: "meta",
      target: "meta",
      prior: undefined,
      item: metaOf(next),
      base: "",
    });
    for (const [name, items] of keyed(next))
      items.forEach((i) => {
        touch(i.id);
        changes.push({
          scope: name,
          target: i.id,
          prior: undefined,
          item: i,
          base: "",
        });
      });
  } else {
    if (!same(metaOf(previous), metaOf(next))) {
      changes.push({
        scope: "meta",
        target: "meta",
        prior: metaOf(previous),
        item: metaOf(next),
        base: touch("meta"),
      });
    }
    if (!same(previous.ops.settings, next.ops.settings)) {
      changes.push({
        scope: "settings",
        target: "settings",
        prior: previous.ops.settings,
        item: next.ops.settings,
        base: touch("settings"),
      });
    }
    const beforeLists = new Map(keyed(previous));
    for (const [name, items] of keyed(next)) {
      const old = beforeLists.get(name)!;
      if (old === items) continue;
      const map = new Map(old.map((i) => [i.id, i]));
      for (const item of items) {
        const prior = map.get(item.id);
        if (!prior || !same(prior, item))
          changes.push({
            scope: name,
            target: item.id,
            prior,
            item,
            base: touch(item.id),
          });
        map.delete(item.id);
      }
      for (const [id, prior] of map) {
        const base = clock[id] ?? "";
        removed[id] = stamp;
        delete clock[id];
        changed = true;
        changes.push({ scope: name, target: id, prior, item: null, base });
      }
    }
  }
  const { journal: withEntries, last } = stampEntries(
    previous,
    next,
    tick(stamp, at),
    at,
  );
  if (withEntries !== next) changed = true;
  if (!changed) return next;
  const result = appendHistory(
    { ...withEntries, sync: { ...next.sync, clock, removed } },
    changes,
    at,
    by,
    last,
  );
  setBound(result, tick(last, at));
  return result;
}

/** Stamp every journal changed by a local update of the workspace. */
export function stampWorkspace(
  previous: Workspace | null,
  next: Workspace,
): Workspace {
  if (!previous || previous === next) return next;
  const at = new Date().toISOString();
  const old = new Map(previous.journals.map((j) => [j.id, j]));
  let changed = false;
  const gone = { ...(previous.gone ?? {}), ...(next.gone ?? {}) };
  const journals = next.journals.map((j) => {
    const before = old.get(j.id);
    // A journal removed earlier and added again (import): its changes follow
    // the removal, so it comes back on every post.
    const stamped = stampJournal(
      before,
      j,
      at,
      next.author,
      before ? "" : (gone[j.id] ?? ""),
    );
    if (stamped !== j) changed = true;
    return stamped;
  });
  const kept = new Set(next.journals.map((j) => j.id));
  let removals: Record<string, string> | undefined;
  for (const [id, journal] of old)
    if (!kept.has(id)) {
      removals = removals ?? { ...next.gone };
      removals[id] = tick(later(maxStamp(journal), gone[id]), at);
      changed = true;
    }
  if (!changed) return next;
  return { ...next, journals, gone: removals ?? next.gone };
}

/** Deterministic winner between two versions of the same record. */
function pick<T>(a: T, b: T, stampA = "", stampB = ""): T {
  if (stampA !== stampB) return stampA > stampB ? a : b;
  if (a === b) return a;
  const ja = stableStringify(a);
  const jb = stableStringify(b);
  return ja >= jb ? a : b;
}

function mergeKeyed<T extends Keyed>(
  mine: T[],
  theirs: T[],
  clockA: Clock,
  clockB: Clock,
  clock: Record<string, string>,
  removed: Record<string, string>,
): T[] {
  const result = new Map<string, T>();
  for (const item of mine) result.set(item.id, item);
  for (const item of theirs) {
    const own = result.get(item.id);
    result.set(
      item.id,
      own
        ? pick(own, item, clockA.clock[item.id], clockB.clock[item.id])
        : item,
    );
  }
  // An item exists unless a removal is at least as recent as its last change.
  return [...result.values()].filter(
    (item) => !removed[item.id] || (clock[item.id] ?? "") > removed[item.id],
  );
}

/** Entry without its versions and derived label: what `pick` compares. */
const baseOf = (e: Entry) => {
  const { revisions: _r, suffix: _s, ...rest } = e;
  return rest;
};

/** Most versions kept per entry: the first one and the latest ones. */
const MAX_REVISIONS = 500;

export function mergeEntries(
  mine: Journal,
  theirs: Journal,
): { entries: Entry[]; deleted: Deletion[] } {
  const deletions = new Map<string, Deletion>();
  for (const d of [...mine.deleted, ...theirs.deleted]) {
    const known = deletions.get(d.id);
    if (!known) {
      deletions.set(d.id, d);
      continue;
    }
    // The first deletion is kept.
    const a = deletionStamp(known);
    const b = deletionStamp(d);
    deletions.set(
      d.id,
      a !== b
        ? a < b
          ? known
          : d
        : stableStringify(known) <= stableStringify(d)
          ? known
          : d,
    );
  }
  const byId = new Map<string, Entry>();
  for (const entry of [...mine.entries, ...theirs.entries]) {
    if (deletions.has(entry.id)) continue;
    const known = byId.get(entry.id);
    if (!known) {
      byId.set(entry.id, entry);
      continue;
    }
    if (known === entry) continue;
    const revisions = new Map<string, Revision>();
    for (const r of [...known.revisions, ...entry.revisions]) {
      const other = revisions.get(r.id);
      revisions.set(
        r.id,
        other && other !== r
          ? stableStringify(other) >= stableStringify(r)
            ? other
            : r
          : r,
      );
    }
    const order = (x: Revision, y: Revision) => {
      const a = revisionStamp(x);
      const b = revisionStamp(y);
      return a !== b ? (a < b ? -1 : 1) : x.id < y.id ? -1 : 1;
    };
    // The first version (the entry as written) stays first, then the others
    // in the order of their stamps.
    const first = [known.revisions[0], entry.revisions[0]].sort(order)[0];
    const rest = [...revisions.values()]
      .filter((r) => r.id !== first.id)
      .sort(order);
    const kept = [first, ...rest.slice(-(MAX_REVISIONS - 1))];
    const base = pick(baseOf(known), baseOf(entry));
    byId.set(entry.id, { ...base, revisions: kept });
  }
  const entries = [...byId.values()]
    .map((e) => {
      if (!e.suffix) return e;
      const { suffix: _s, ...rest } = e;
      return rest;
    })
    .sort(
      (a, b) =>
        a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id),
    );
  const deleted = [...deletions.values()].sort((a, b) =>
    a.id.localeCompare(b.id),
  );
  return { entries, deleted };
}

const byId = (a: Keyed, b: Keyed) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);

/**
 * Keep the radio plan valid after combining two versions. Renamings are
 * decided in order of ids, the same on every post; the lists keep their
 * order.
 */
export function repairRadio(radio: Radio): Radio {
  const groups = new Set(radio.talkgroups.map((g) => g.id));
  const seenCall = new Set<string>();
  const callsigns = new Map<string, string>();
  for (const s of [...radio.stations].sort(byId)) {
    let callsign = s.callsign;
    for (let n = 2; seenCall.has(callsignKey(callsign)); n++)
      callsign = `${s.callsign} (${n})`;
    seenCall.add(callsignKey(callsign));
    callsigns.set(s.id, callsign);
  }
  const stations = radio.stations.map((s) => ({
    ...s,
    callsign: callsigns.get(s.id)!,
    primary: groups.has(s.primary) ? s.primary : "",
    fallback: groups.has(s.fallback) ? s.fallback : "",
  }));
  const seenLabel = new Set<string>();
  const labels = new Map<string, string>();
  for (const t of [...radio.terminals].sort(byId)) {
    let label = t.label;
    for (let n = 2; seenLabel.has(label.trim().toLocaleUpperCase("fr")); n++)
      label = `${t.label}-${n}`;
    seenLabel.add(label.trim().toLocaleUpperCase("fr"));
    labels.set(t.id, label);
  }
  const terminals = radio.terminals.map((t) => {
    // Two open remises from two posts: the older one is closed.
    const assignments = [...t.assignments].sort(
      (a, b) => a.issuedAt.localeCompare(b.issuedAt) || byId(a, b),
    );
    const fixed = assignments.map((a, i) =>
      i < assignments.length - 1 && !a.returnedAt
        ? {
            ...a,
            returnedAt: assignments[i + 1].issuedAt,
            returnedBy: a.issuedBy,
            returnCondition: "Opérationnel" as const,
            notes: [a.notes, "Retour déduit à la synchronisation."]
              .filter(Boolean)
              .join("\n"),
          }
        : a,
    );
    return { ...t, label: labels.get(t.id)!, assignments: fixed };
  });
  const checks = radio.checks
    .map((c) => (groups.has(c.talkgroupId) ? c : { ...c, talkgroupId: "" }))
    .sort((a, b) => a.at.localeCompare(b.at) || byId(a, b));
  return radioSchema.parse({ ...radio, stations, terminals, checks });
}

/** Combine two versions of the same journal. Commutative and idempotent. */
export function mergeJournal(mine: Journal, theirs: Journal): Journal {
  if (mine === theirs) return mine;
  const a = mine.sync;
  const b = theirs.sync;
  const removed: Record<string, string> = { ...a.removed };
  for (const [k, v] of Object.entries(b.removed))
    removed[k] = later(removed[k], v);
  const clock: Record<string, string> = { ...a.clock };
  for (const [k, v] of Object.entries(b.clock)) clock[k] = later(clock[k], v);
  for (const [k, v] of Object.entries(removed))
    if (clock[k] && clock[k] <= v) delete clock[k];
    else if (clock[k]) delete removed[k];
  // The journal header and the référentiels: latest change wins; their
  // stamps are never removed.
  const meta = pick(metaOf(mine), metaOf(theirs), a.clock.meta, b.clock.meta);
  const settings = pick(
    mine.ops.settings,
    theirs.ops.settings,
    a.clock.settings,
    b.clock.settings,
  );
  const m = <T extends Keyed>(x: T[], y: T[]) =>
    mergeKeyed(x, y, a, b, clock, removed);
  const radio = repairRadio({
    talkgroups: m(mine.radio.talkgroups, theirs.radio.talkgroups),
    stations: m(mine.radio.stations, theirs.radio.stations),
    terminals: m(mine.radio.terminals, theirs.radio.terminals),
    checks: m(mine.radio.checks, theirs.radio.checks),
  });
  const ops = Object.fromEntries(
    COLLECTIONS.map((c) => [
      c,
      m(mine.ops[c] as Keyed[], theirs.ops[c] as Keyed[]),
    ]),
  ) as Omit<Ops, "settings">;
  const members = new Set(ops.cells.map((c) => c.id));
  ops.members = ops.members.map((x) =>
    x.cellId && !members.has(x.cellId) ? { ...x, cellId: "" } : x,
  );
  const { entries, deleted } = mergeEntries(mine, theirs);
  const compacted = later(a.compacted, b.compacted) || undefined;
  return journalSchema.parse({
    ...mine,
    ...meta,
    id: mine.id,
    entries,
    deleted,
    radio,
    ops: { ...ops, settings },
    sync: compacted ? { clock, removed, compacted } : { clock, removed },
    history: mergeHistory(mine.history, theirs.history),
    blobs: { ...theirs.blobs, ...mine.blobs },
  });
}

/** Whether a journal is removed from the session (see Workspace.gone). */
export const isGone = (journal: Journal, gone: Workspace["gone"]) =>
  !!gone?.[journal.id] && maxStamp(journal) <= gone[journal.id];

/** Combine a remote session into the local one (local-only fields kept). */
export function mergeWorkspace(
  local: Workspace,
  remote: Pick<Workspace, "journals" | "gone">,
): Workspace {
  const gone: Record<string, string> = { ...local.gone };
  for (const [k, v] of Object.entries(remote.gone ?? {}))
    gone[k] = later(gone[k], v);
  const incoming = new Map(remote.journals.map((j) => [j.id, j]));
  const journals: Journal[] = [];
  for (const j of local.journals) {
    const other = incoming.get(j.id);
    incoming.delete(j.id);
    journals.push(other ? mergeJournal(j, other) : j);
  }
  for (const j of incoming.values()) journals.push(j);
  // A journal changed after its removal comes back; the others go. A session
  // always keeps one journal: when every journal is removed, the local ones
  // stay until another journal arrives (the removals are recorded anyway).
  let kept = journals.filter((j) => !isGone(j, gone));
  if (!kept.length) {
    const own = new Set(local.journals.map((j) => j.id));
    kept = journals.filter((j) => own.has(j.id));
  }
  const activeId = kept.some((j) => j.id === local.activeId)
    ? local.activeId
    : kept[0].id;
  const drafts = local.drafts
    ? Object.fromEntries(
        Object.entries(local.drafts).filter(([id]) =>
          kept.some((j) => j.id === id),
        ),
      )
    : undefined;
  return workspaceSchema.parse({
    ...local,
    journals: kept,
    activeId,
    drafts,
    gone: Object.keys(gone).length ? gone : undefined,
  });
}

// ---------- What a peer lacks ----------

/**
 * The part of a journal a peer with version vector `vv` may lack: records,
 * versions, deletions and events stamped after what it has seen of each
 * post. A valid journal on its own (a subset); merging it gives the same
 * result as merging the whole journal. null when there is nothing to send.
 */
const slices = new WeakSet<Journal>();
/** Whether a journal was made by sliceJournal (a part, not the whole). */
export const isSlice = (journal: Journal) => slices.has(journal);

export function sliceJournal(
  journal: Journal,
  vv: VersionVector,
): Journal | null {
  const fresh = (s: string | undefined) => !!s && unseen(s, vv);
  const clock: Record<string, string> = {};
  const removed: Record<string, string> = {};
  for (const [k, s] of Object.entries(journal.sync.clock))
    if (fresh(s)) clock[k] = s;
  for (const [k, s] of Object.entries(journal.sync.removed))
    if (fresh(s)) removed[k] = s;
  const keep = <T extends Keyed>(list: T[]) =>
    list.filter((i) => clock[i.id] !== undefined);
  const entries = journal.entries.filter((e) =>
    e.revisions.some((r) => fresh(revisionStamp(r))),
  );
  const deleted = journal.deleted.filter((d) => fresh(deletionStamp(d)));
  const history = journal.history.filter((e) => fresh(eventStamp(e)));
  const ops = Object.fromEntries(
    COLLECTIONS.map((c) => [c, keep(journal.ops[c] as Keyed[])]),
  ) as Omit<Ops, "settings">;
  const radio = {
    talkgroups: keep(journal.radio.talkgroups),
    stations: keep(journal.radio.stations),
    terminals: keep(journal.radio.terminals),
    checks: keep(journal.radio.checks),
  };
  if (
    !Object.keys(clock).length &&
    !Object.keys(removed).length &&
    !entries.length &&
    !deleted.length &&
    !history.length
  )
    return null;
  const used = new Set<string>();
  for (const e of history) blobsOf(e.scope, e.state, used);
  for (const s of ops.symbols) blobsOf("ops.symbols", s, used);
  const blobs: Record<string, string> = {};
  for (const k of used) if (journal.blobs[k]) blobs[k] = journal.blobs[k];
  const slice: Journal = {
    ...journal,
    entries,
    deleted,
    radio,
    ops: { ...ops, settings: journal.ops.settings },
    sync: journal.sync.compacted
      ? { clock, removed, compacted: journal.sync.compacted }
      : { clock, removed },
    history,
    blobs,
  };
  slices.add(slice);
  return slice;
}

/** Canonical form: order of records does not matter. */
function canonical(value: unknown): unknown {
  if (Array.isArray(value)) {
    const items = value.map(canonical);
    return items.every(
      (i) => i && typeof i === "object" && "id" in (i as object),
    )
      ? [...items].sort((x, y) =>
          String((x as Keyed).id).localeCompare(String((y as Keyed).id)),
        )
      : items;
  }
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((k) => [k, canonical((value as Record<string, unknown>)[k])]),
    );
  return value;
}

const digests = new WeakMap<Journal, Promise<string>>();
/**
 * Short fingerprint of a journal; equal on posts that agree. History events
 * count by id, version and stamp, images by hash: their contents follow.
 */
export function digest(journal: Journal): Promise<string> {
  let value = digests.get(journal);
  if (!value) {
    value = (async () => {
      const light = {
        ...journal,
        history: journal.history.map((e) => ({
          id: e.id,
          r: e.rev,
          k: eventKey(e),
        })),
        blobs: Object.keys(journal.blobs).sort(),
      };
      const bytes = new TextEncoder().encode(JSON.stringify(canonical(light)));
      const hash = await crypto.subtle.digest("SHA-256", bytes);
      return [...new Uint8Array(hash).slice(0, 12)]
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    })();
    digests.set(journal, value);
  }
  return value;
}

// ---------- Labels of messages ----------

type MessageLike = Pick<Message, "id" | "createdAt"> & {
  number?: number;
  node?: string;
};
const messageIndex = new WeakMap<
  Journal["ops"]["messages"],
  WeakMap<HistoryEvent[], Map<string, string>>
>();
/**
 * Labels of the messages ("013", "013·B"): numbers given at reception,
 * suffixed when two posts gave the same one at the same time. Removed
 * messages keep their place (from their history), so labels never move.
 */
export function messageLabels(journal: Pick<Journal, "ops" | "history">) {
  const byHistory =
    messageIndex.get(journal.ops.messages) ??
    new WeakMap<HistoryEvent[], Map<string, string>>();
  messageIndex.set(journal.ops.messages, byHistory);
  const known = byHistory.get(journal.history);
  if (known) return known;
  const items = new Map<string, MessageLike>();
  for (const e of journal.history)
    if (
      e.scope === "ops.messages" &&
      e.state &&
      typeof e.state === "object" &&
      !items.has(e.target)
    ) {
      const s = e.state as MessageLike;
      if (typeof s.number === "number" && typeof s.createdAt === "string")
        items.set(e.target, { ...s, id: e.target });
    }
  for (const m of journal.ops.messages) items.set(m.id, m);
  const numbered = [...items.values()].filter(
    (m): m is MessageLike & { number: number } => !!m.number,
  );
  const extra = suffixes(
    numbered.map((m) => ({
      id: m.id,
      number: m.number,
      key: createdKey(m.createdAt),
      node: nodeOr(m.node, m.id),
    })),
  );
  const out = new Map<string, string>();
  for (const m of journal.ops.messages)
    if (m.number)
      out.set(
        m.id,
        `${String(m.number).padStart(3, "0")}${extra.has(m.id) ? `·${extra.get(m.id)}` : ""}`,
      );
  byHistory.set(journal.history, out);
  return out;
}

// ---------- What the merges did ----------

export type Collision = {
  kind: "collision";
  journalId: string;
  scope: "entries" | "ops.messages";
  number: number;
  items: { id: string; label: string; by: string; at: string; gone: boolean }[];
};
export type Concurrent = {
  kind: "concurrent";
  journalId: string;
  scope: string;
  target: string;
  title: string;
  /** The version shown now. */
  kept: { id: string; at: string; by: string; state: unknown };
  /** Versions written at the same time from the same base, not shown. */
  overwritten: { id: string; at: string; by: string; state: unknown }[];
};
export type Conflict = Collision | Concurrent;

const conflictCache = new WeakMap<Journal, Conflict[]>();
/**
 * Numbers shared by several entries or messages, and changes written at the
 * same time on two posts from the same version (one of them is not shown
 * any more; both stay in the history).
 */
export function conflicts(journal: Journal): Conflict[] {
  const known = conflictCache.get(journal);
  if (known) return known;
  const out: Conflict[] = [];
  // Entries sharing a number.
  const byNumber = new Map<number, Collision["items"]>();
  const push = (n: number, item: Collision["items"][number]) =>
    byNumber.set(n, [...(byNumber.get(n) ?? []), item]);
  for (const e of journal.entries)
    push(e.number, {
      id: e.id,
      label: numberLabel(e),
      by: e.createdBy,
      at: e.createdAt,
      gone: false,
    });
  for (const d of journal.deleted)
    push(d.number, {
      id: d.id,
      label: `#${String(d.number).padStart(3, "0")}`,
      by: d.by,
      at: d.createdAt ?? d.at,
      gone: true,
    });
  for (const [number, items] of byNumber)
    if (items.length > 1)
      out.push({
        kind: "collision",
        journalId: journal.id,
        scope: "entries",
        number,
        items,
      });
  // Messages sharing a number.
  const labels = messageLabels(journal);
  const messages = new Map<number, Collision["items"]>();
  for (const m of journal.ops.messages)
    if (m.number)
      messages.set(m.number, [
        ...(messages.get(m.number) ?? []),
        {
          id: m.id,
          label: `M${labels.get(m.id) ?? String(m.number).padStart(3, "0")}`,
          by: m.by,
          at: m.createdAt,
          gone: false,
        },
      ]);
  for (const [number, items] of messages)
    if (items.length > 1)
      out.push({
        kind: "collision",
        journalId: journal.id,
        scope: "ops.messages",
        number,
        items,
      });
  // Concurrent changes of a record: events made from the same base.
  const siblings = new Map<string, HistoryEvent[]>();
  for (const e of journal.history) {
    if (e.base === undefined || e.base === "" || e.action === "create")
      continue;
    const k = `${e.target}|${e.base}`;
    siblings.set(k, [...(siblings.get(k) ?? []), e]);
  }
  for (const list of siblings.values()) {
    if (list.length < 2) continue;
    list.sort((x, y) => (eventKey(x) < eventKey(y) ? -1 : 1));
    const kept = list[list.length - 1];
    out.push({
      kind: "concurrent",
      journalId: journal.id,
      scope: kept.scope,
      target: kept.target,
      title: titleOf(kept.scope, kept.state ?? list[0].state),
      kept: { id: kept.id, at: kept.at, by: kept.by, state: kept.state },
      overwritten: list
        .slice(0, -1)
        .map((e) => ({ id: e.id, at: e.at, by: e.by, state: e.state })),
    });
  }
  // Versions of an entry written from the same version.
  for (const e of journal.entries) {
    const bases = new Map<string, Revision[]>();
    for (const r of e.revisions)
      if (r.base) bases.set(r.base, [...(bases.get(r.base) ?? []), r]);
    for (const list of bases.values()) {
      if (list.length < 2) continue;
      list.sort((x, y) => (revisionStamp(x) < revisionStamp(y) ? -1 : 1));
      const kept = list[list.length - 1];
      out.push({
        kind: "concurrent",
        journalId: journal.id,
        scope: "entries",
        target: e.id,
        title: `${numberLabel(e)} ${kept.fields.message.split("\n")[0].slice(0, 70)}`,
        kept: {
          id: kept.id,
          at: kept.at,
          by: kept.author,
          state: kept.fields,
        },
        overwritten: list.slice(0, -1).map((r) => ({
          id: r.id,
          at: r.at,
          by: r.author,
          state: r.fields,
        })),
      });
    }
  }
  conflictCache.set(journal, out);
  return out;
}
