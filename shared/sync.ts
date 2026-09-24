import {
  journalSchema,
  workspaceSchema,
  type Deletion,
  type Entry,
  type Journal,
  type Revision,
  type Workspace,
} from "./journal.ts";
import { callsignKey, radioSchema, type Radio } from "./radio.ts";
import { COLLECTIONS, type Ops } from "./ops.ts";

// Live synchronisation between posts without a database.
//
// Each post keeps the whole session. A local change stamps the records it
// touched (journal.sync.clock) and records removals (journal.sync.removed).
// Posts exchange full journals; mergeJournal() combines two versions the same
// way on every post, whatever the order, so all posts converge:
// - journal entries: union of versions (revisions are append-only);
// - deleted entries: union, a deletion wins over the entry;
// - every other record: the most recent change wins, a removal wins over an
//   older change;
// - duplicate entry numbers: the oldest entry keeps its number.

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

/** Record the local changes between two versions of a journal. */
export function stampJournal(
  previous: Journal | undefined,
  next: Journal,
  at = new Date().toISOString(),
): Journal {
  if (previous === next) return next;
  const clock = { ...next.sync.clock };
  const removed = { ...next.sync.removed };
  let changed = false;
  const touch = (key: string) => {
    clock[key] = at;
    delete removed[key];
    changed = true;
  };
  if (!previous) {
    touch("meta");
    touch("settings");
    for (const [, items] of keyed(next)) items.forEach((i) => touch(i.id));
  } else {
    if (!same(metaOf(previous), metaOf(next))) touch("meta");
    if (!same(previous.ops.settings, next.ops.settings)) touch("settings");
    const before = new Map(keyed(previous));
    for (const [name, items] of keyed(next)) {
      const old = before.get(name)!;
      if (old === items) continue;
      const map = new Map(old.map((i) => [i.id, i]));
      for (const item of items) {
        const prior = map.get(item.id);
        if (!prior || !same(prior, item)) touch(item.id);
        map.delete(item.id);
      }
      for (const id of map.keys()) {
        removed[id] = at;
        delete clock[id];
        changed = true;
      }
    }
  }
  return changed ? { ...next, sync: { clock, removed } } : next;
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
  const journals = next.journals.map((j) => {
    const stamped = stampJournal(old.get(j.id), j, at);
    if (stamped !== j) changed = true;
    return stamped;
  });
  let gone = next.gone;
  const kept = new Set(next.journals.map((j) => j.id));
  for (const id of old.keys())
    if (!kept.has(id)) {
      gone = { ...gone, [id]: at };
      changed = true;
    }
  return changed ? { ...next, journals, gone } : next;
}

const later = (a = "", b = "") => (a > b ? a : b);
/** Deterministic winner between two versions of the same record. */
function pick<T>(a: T, b: T, stampA = "", stampB = ""): T {
  if (stampA !== stampB) return stampA > stampB ? a : b;
  const ja = JSON.stringify(a);
  const jb = JSON.stringify(b);
  return ja >= jb ? a : b;
}

function mergeKeyed<T extends Keyed>(
  mine: T[],
  theirs: T[],
  clockA: Clock,
  clockB: Clock,
  removed: Record<string, string>,
): T[] {
  const result = new Map<string, T>();
  const stamp = (id: string) => later(clockA.clock[id], clockB.clock[id]) || "";
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
    (item) => !removed[item.id] || stamp(item.id) > removed[item.id],
  );
}

function mergeEntries(
  mine: Journal,
  theirs: Journal,
): { entries: Entry[]; deleted: Deletion[] } {
  const deletions = new Map<string, Deletion>();
  for (const d of [...mine.deleted, ...theirs.deleted]) {
    const known = deletions.get(d.id);
    // The first deletion is kept.
    deletions.set(
      d.id,
      !known
        ? d
        : known.at !== d.at
          ? known.at < d.at
            ? known
            : d
          : pick(known, d),
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
    const revisions = new Map<string, Revision>();
    for (const r of [...known.revisions, ...entry.revisions])
      revisions.set(r.id, r);
    const base = pick(known, entry);
    byId.set(entry.id, {
      ...base,
      revisions: [...revisions.values()]
        .sort((x, y) => x.at.localeCompare(y.at) || x.id.localeCompare(y.id))
        .slice(-500),
    });
  }
  // Numbers: the oldest entry keeps a disputed number, the others follow the
  // highest number ever used, in creation order.
  const entries = [...byId.values()].sort(
    (a, b) =>
      a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id),
  );
  const deleted = [...deletions.values()];
  const taken = new Set(deleted.map((d) => d.number));
  let top = Math.max(
    0,
    ...entries.map((e) => e.number),
    ...deleted.map((d) => d.number),
  );
  const numbered = entries.map((e) => {
    if (!taken.has(e.number)) {
      taken.add(e.number);
      return e;
    }
    return { ...e, number: ++top };
  });
  return { entries: numbered, deleted };
}

/** Keep the radio plan valid after combining two versions. */
export function repairRadio(radio: Radio): Radio {
  const groups = new Set(radio.talkgroups.map((g) => g.id));
  const seenCall = new Set<string>();
  const stations = radio.stations.map((s) => {
    let callsign = s.callsign;
    for (let n = 2; seenCall.has(callsignKey(callsign)); n++)
      callsign = `${s.callsign} (${n})`;
    seenCall.add(callsignKey(callsign));
    return {
      ...s,
      callsign,
      primary: groups.has(s.primary) ? s.primary : "",
      fallback: groups.has(s.fallback) ? s.fallback : "",
    };
  });
  const seenLabel = new Set<string>();
  const terminals = radio.terminals.map((t) => {
    let label = t.label;
    for (let n = 2; seenLabel.has(label.trim().toLocaleUpperCase("fr")); n++)
      label = `${t.label}-${n}`;
    seenLabel.add(label.trim().toLocaleUpperCase("fr"));
    // Two open remises from two posts: the older one is closed.
    const assignments = [...t.assignments].sort((a, b) =>
      a.issuedAt.localeCompare(b.issuedAt),
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
    return { ...t, label, assignments: fixed };
  });
  const checks = radio.checks
    .map((c) => (groups.has(c.talkgroupId) ? c : { ...c, talkgroupId: "" }))
    .sort((a, b) => a.at.localeCompare(b.at));
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
  const meta = pick(metaOf(mine), metaOf(theirs), a.clock.meta, b.clock.meta);
  const settings = pick(
    mine.ops.settings,
    theirs.ops.settings,
    a.clock.settings,
    b.clock.settings,
  );
  const m = <T extends Keyed>(x: T[], y: T[]) =>
    mergeKeyed(x, y, a, b, removed);
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
  return journalSchema.parse({
    ...mine,
    ...meta,
    entries,
    deleted,
    radio,
    ops: { ...ops, settings },
    sync: { clock, removed },
  });
}

/** Combine a remote session into the local one (local-only fields kept). */
export function mergeWorkspace(
  local: Workspace,
  remote: Pick<Workspace, "journals" | "gone">,
): Workspace {
  const gone = { ...local.gone };
  for (const [k, v] of Object.entries(remote.gone ?? {}))
    gone[k] = later(gone[k], v);
  const incoming = new Map(remote.journals.map((j) => [j.id, j]));
  const journals: Journal[] = [];
  for (const j of local.journals) {
    const other = incoming.get(j.id);
    incoming.delete(j.id);
    journals.push(other ? mergeJournal(j, other) : j);
  }
  for (const j of incoming.values()) if (!gone[j.id]) journals.push(j);
  const kept = journals.filter((j) => !gone[j.id]);
  if (!kept.length) return local;
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

/** Short fingerprint of a journal; equal on posts that agree. */
export async function digest(journal: Journal): Promise<string> {
  const bytes = new TextEncoder().encode(JSON.stringify(canonical(journal)));
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(hash).slice(0, 12)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
