import test from "node:test";
import assert from "node:assert/strict";
import {
  addEntry,
  current,
  deleteEntry,
  emptyFields,
  journalSchema,
  newJournal,
  reviseEntry,
} from "../shared/journal.ts";
import { removeRecords, upsert } from "../shared/ops.ts";
import { digest, mergeJournal, stampJournal } from "../shared/sync.ts";
import {
  auditTrail,
  changesBetween,
  diffStates,
  journalAt,
  moments,
  restoreState,
  stableId,
  trailOf,
} from "../shared/history.ts";

const at = (minute) =>
  new Date(Date.UTC(2026, 8, 24, 10, minute)).toISOString();
const change = (before, after, minute, by = "A") =>
  stampJournal(before, after, at(minute), by);
const withOps = (journal, ops) => journalSchema.parse({ ...journal, ops });
const resource = (name, status = "Disponible") => ({
  name,
  kind: "Véhicule",
  organization: "",
  callsign: "",
  count: 1,
  status,
  location: "",
  mission: "",
  eta: "",
  contact: "",
  notes: "",
});
const place = (label, lat = 46.2, lng = 6.14) => ({
  label,
  kind: "point",
  symbol: "b:pc",
  color: "",
  layer: "Emplacements",
  points: [[lat, lng]],
  notes: "",
});

test("every change is recorded with its author, time and state", () => {
  const base = change(undefined, newJournal("Crue"), 0);
  const id = crypto.randomUUID();
  const created = change(
    base,
    withOps(
      base,
      upsert(base.ops, "resources", { ...resource("TP 1"), id }, "A"),
    ),
    1,
    "Alice",
  );
  const moved = change(
    created,
    withOps(
      created,
      upsert(
        created.ops,
        "resources",
        { ...created.ops.resources[0], status: "Engagé" },
        "B",
      ),
    ),
    5,
    "Bob",
  );
  const removed = change(
    moved,
    withOps(moved, removeRecords(moved.ops, [id])),
    9,
    "Chloé",
  );
  const events = removed.history.filter((e) => e.target === id);
  assert.deepEqual(
    events.map((e) => [e.action, e.by, e.at]),
    [
      ["create", "Alice", at(1)],
      ["update", "Bob", at(5)],
      ["remove", "Chloé", at(9)],
    ],
  );
  assert.equal(events[1].state.status, "Engagé");
  const trail = trailOf(removed, id);
  assert.equal(trail[0].action, "remove");
  assert.equal(trail[1].previous.status, "Disponible");
  assert.deepEqual(
    diffStates(trail[1].previous, trail[1].state).map((d) => d.key),
    ["status"],
  );
});

test("quick successive edits by the same person fold into one event", () => {
  const base = change(undefined, newJournal("Crue"), 0);
  const id = crypto.randomUUID();
  let j = change(
    base,
    withOps(
      base,
      upsert(base.ops, "resources", { ...resource("TP"), id }, "A"),
    ),
    1,
  );
  const edit = (journal, count, seconds, by = "A") =>
    stampJournal(
      journal,
      withOps(
        journal,
        upsert(
          journal.ops,
          "resources",
          { ...journal.ops.resources[0], count },
          by,
        ),
      ),
      new Date(Date.parse(at(3)) + seconds * 1000).toISOString(),
      by,
    );
  j = edit(j, 2, 0);
  j = edit(j, 3, 5);
  j = edit(j, 4, 10);
  let events = j.history.filter((e) => e.target === id);
  assert.equal(events.length, 2);
  assert.equal(events[1].state.count, 4);
  assert.equal(events[1].rev, 2);
  j = edit(j, 5, 12, "B");
  j = edit(j, 6, 60);
  events = j.history.filter((e) => e.target === id);
  assert.equal(events.length, 4);
});

test("the time machine rebuilds records, removals and entry versions", () => {
  let j = change(undefined, newJournal("Crue"), 0);
  const pc = crypto.randomUUID();
  const extra = crypto.randomUUID();
  j = change(
    j,
    withOps(j, upsert(j.ops, "places", { ...place("PC front"), id: pc }, "A")),
    1,
  );
  j = change(
    j,
    withOps(
      j,
      upsert(
        j.ops,
        "places",
        { ...j.ops.places[0], points: [[46.3, 6.2]] },
        "A",
      ),
    ),
    30,
  );
  j = change(
    j,
    withOps(
      j,
      upsert(j.ops, "places", { ...place("Barrage"), id: extra }, "B"),
    ),
    40,
    "B",
  );
  j = change(j, withOps(j, removeRecords(j.ops, [pc])), 50, "C");
  const early = journalAt(j, at(10));
  assert.equal(early.ops.places.length, 1);
  assert.deepEqual(early.ops.places[0].points, [[46.2, 6.14]]);
  const mid = journalAt(j, at(45));
  assert.deepEqual(mid.ops.places.map((p) => p.label).sort(), [
    "Barrage",
    "PC front",
  ]);
  assert.deepEqual(mid.ops.places.find((p) => p.id === pc).points, [
    [46.3, 6.2],
  ]);
  const late = journalAt(j, at(55));
  assert.deepEqual(
    late.ops.places.map((p) => p.label),
    ["Barrage"],
  );
  assert.equal(journalAt(j, at(0)).ops.places.length, 0);
  assert.ok(moments(j).length >= 4);
  assert.equal(changesBetween(j, at(20), at(45)).length, 2);
});

test("entries show only their versions of the chosen time", async () => {
  const base = newJournal("Crue");
  const one = addEntry(base, { ...emptyFields(), message: "Première" }, "A");
  await new Promise((r) => setTimeout(r, 15));
  const cut = new Date().toISOString();
  await new Promise((r) => setTimeout(r, 15));
  const id = one.entries[0].id;
  const revised = reviseEntry(
    one,
    id,
    { ...current(one.entries[0]), message: "Corrigée" },
    "B",
    "Précision",
  );
  await new Promise((r) => setTimeout(r, 5));
  const two = addEntry(revised, { ...emptyFields(), message: "Seconde" }, "A");
  const past = journalAt(two, cut);
  assert.equal(past.entries.length, 1);
  assert.equal(current(past.entries[0]).message, "Première");
  await new Promise((r) => setTimeout(r, 5));
  const gone = deleteEntry(two, two.entries[1].id, "C", "Doublon");
  // A deleted entry leaves only its deletion trace.
  const trail = auditTrail(gone).filter((i) => i.scope === "entries");
  assert.deepEqual(
    trail.map((i) => i.action),
    ["remove", "update", "create"],
  );
  assert.equal(trail[0].note, "Doublon");
});

test("histories merge the same way on every post", async () => {
  const base = change(undefined, newJournal("Crue"), 0);
  const id = crypto.randomUUID();
  const shared = change(
    base,
    withOps(
      base,
      upsert(base.ops, "resources", { ...resource("TP"), id }, "A"),
    ),
    1,
  );
  const a = change(
    shared,
    withOps(
      shared,
      upsert(
        shared.ops,
        "resources",
        { ...shared.ops.resources[0], count: 4 },
        "A",
      ),
    ),
    5,
    "A",
  );
  const b = change(
    shared,
    withOps(
      shared,
      upsert(shared.ops, "places", { ...place("PC arrière") }, "B"),
    ),
    6,
    "B",
  );
  const ab = mergeJournal(a, b);
  const ba = mergeJournal(b, a);
  assert.deepEqual(
    ab.history.map((e) => e.id),
    ba.history.map((e) => e.id),
  );
  assert.equal(await digest(ab), await digest(ba));
  assert.deepEqual(mergeJournal(ab, ab).history, ab.history);
  assert.equal(
    ab.history.length,
    new Set([...a.history, ...b.history].map((e) => e.id)).size,
  );
});

test("a record older than the history gets the same baseline on every post", () => {
  const id = crypto.randomUUID();
  const legacy = withOps(
    newJournal("Ancien"),
    upsert(
      newJournal("x").ops,
      "resources",
      { ...resource("TP"), id },
      "Ancien",
    ),
  );
  const edit = (by, count, minute) =>
    change(
      legacy,
      withOps(
        legacy,
        upsert(
          legacy.ops,
          "resources",
          { ...legacy.ops.resources[0], count },
          by,
        ),
      ),
      minute,
      by,
    );
  const a = edit("A", 2, 3);
  const b = edit("B", 3, 4);
  const baseA = a.history.find((e) => e.note);
  const baseB = b.history.find((e) => e.note);
  assert.equal(baseA.id, baseB.id);
  assert.equal(baseA.state.count, 1);
  assert.equal(baseA.by, "Ancien");
  const merged = mergeJournal(a, b);
  assert.equal(merged.history.filter((e) => e.target === id).length, 3);
  assert.match(stableId("x"), /^[0-9a-f]{8}-[0-9a-f]{4}-8[0-9a-f]{3}-[89ab]/);
});

test("restoring a version adds one signed event and brings the record back", () => {
  let j = change(undefined, newJournal("Crue"), 0);
  const id = crypto.randomUUID();
  j = change(
    j,
    withOps(j, upsert(j.ops, "resources", { ...resource("TP"), id }, "A")),
    1,
  );
  j = change(j, withOps(j, removeRecords(j.ops, [id])), 5, "B");
  assert.equal(j.ops.resources.length, 0);
  const version = trailOf(j, id).find((i) => i.action === "create");
  const restored = restoreState(j, version, "C", at(8));
  const stamped = change(j, restored, 8, "C");
  assert.equal(stamped.ops.resources.length, 1);
  const events = stamped.history.filter((e) => e.target === id);
  assert.equal(events.length, 3);
  assert.equal(events[2].by, "C");
  assert.match(events[2].note, /Restauration/);
  assert.equal(stamped.sync.removed[id], undefined);
});

test("a quick edit right after a creation is its own version", () => {
  const base = change(undefined, newJournal("Crue"), 0);
  const id = crypto.randomUUID();
  const created = stampJournal(
    base,
    withOps(
      base,
      upsert(base.ops, "resources", { ...resource("TP"), id }, "A"),
    ),
    at(1),
    "A",
  );
  const edited = stampJournal(
    created,
    withOps(
      created,
      upsert(
        created.ops,
        "resources",
        { ...created.ops.resources[0], status: "Engagé" },
        "A",
      ),
    ),
    new Date(Date.parse(at(1)) + 5000).toISOString(),
    "A",
  );
  const events = edited.history.filter((e) => e.target === id);
  assert.deepEqual(
    events.map((e) => e.action),
    ["create", "update"],
  );
  assert.equal(events[0].at, at(1));
});

test("a baseline is always older than the change it precedes", () => {
  const id = crypto.randomUUID();
  const future = new Date(Date.parse(at(30))).toISOString();
  const legacy = withOps(newJournal("Ancien"), {
    ...newJournal("x").ops,
    resources: [
      {
        ...resource("TP"),
        id,
        createdAt: future,
        updatedAt: future,
        by: "Ancien",
      },
    ],
  });
  const next = change(
    legacy,
    withOps(
      legacy,
      upsert(
        legacy.ops,
        "resources",
        { ...legacy.ops.resources[0], count: 9 },
        "A",
      ),
    ),
    10,
  );
  const [baseline, edit] = next.history.filter((e) => e.target === id);
  assert.ok(Date.parse(baseline.at) < Date.parse(edit.at));
  assert.equal(journalAt(next, at(11)).ops.resources[0].count, 9);
});

test("restoring a version that no longer fits the journal is refused", () => {
  let j = change(undefined, newJournal("Crue"), 0);
  j = change(j, withOps(j, { ...j.ops, settings: { ...j.ops.settings } }), 1);
  assert.throws(
    () =>
      restoreState(
        j,
        {
          scope: "settings",
          target: "settings",
          state: { lists: 3 },
          at: at(1),
        },
        "A",
      ),
    /compatible/,
  );
});

test("forecasts are thinned to one per hour after a day", async () => {
  const { thinForecasts } = await import("../shared/ops.ts");
  const now = Date.parse(at(0));
  const f = (minutesAgo) => ({
    id: crypto.randomUUID(),
    fetchedAt: new Date(now - minutesAgo * 60_000).toISOString(),
    place: "Carouge",
  });
  const list = [f(10), f(20), f(26 * 60), f(26 * 60 + 10), f(27 * 60)];
  const kept = thinForecasts(list, now);
  assert.equal(kept.length, 4);
});
