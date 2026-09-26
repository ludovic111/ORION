import test from "node:test";
import assert from "node:assert/strict";
import {
  addEntry,
  deleteEntry,
  emptyFields,
  journalSchema,
  mergeJournals,
  newJournal,
} from "../shared/journal.ts";
import { upsert } from "../shared/ops.ts";
import { mergeJournal, stampJournal } from "../shared/sync.ts";
import { journalAt, restoreState, auditTrail } from "../shared/history.ts";
import {
  COMPACT_FROM,
  MAX_HISTORY,
  capHistory,
  thinHistory,
} from "../shared/events.ts";
import { parseTolerant } from "../shared/tolerant.ts";

const T0 = Date.UTC(2026, 8, 24, 10, 0);
const at = (minute) => new Date(T0 + minute * 60_000).toISOString();
const withOps = (journal, ops) => journalSchema.parse({ ...journal, ops });
const image = (n) =>
  `data:image/png;base64,${Buffer.alloc(200_000, n).toString("base64")}`;

test("a symbol edited many times keeps its image once, and the time machine shows it", () => {
  let j = stampJournal(undefined, newJournal("Carte"), at(0), "A");
  const id = crypto.randomUUID();
  const symbol = (name, img) => ({
    id,
    createdAt: at(0),
    updatedAt: at(0),
    by: "A",
    name,
    group: "",
    image: img,
  });
  j = stampJournal(
    j,
    withOps(j, upsert(j.ops, "symbols", symbol("PC", image(1)), "A")),
    at(1),
    "A",
  );
  for (let i = 2; i < 12; i++)
    j = stampJournal(
      j,
      withOps(j, upsert(j.ops, "symbols", symbol(`PC ${i}`, image(1)), "A")),
      at(i),
      "A",
    );
  j = stampJournal(
    j,
    withOps(j, upsert(j.ops, "symbols", symbol("PC final", image(2)), "A")),
    at(20),
    "A",
  );
  const events = j.history.filter((e) => e.scope === "ops.symbols");
  assert.ok(events.length >= 10);
  for (const e of events) assert.match(e.state.image, /^blob:[0-9a-f]{64}$/);
  assert.equal(Object.keys(j.blobs).length, 2);
  // The journal is about two images large, not eleven.
  const size = JSON.stringify(journalSchema.parse(j)).length;
  assert.ok(size < 5 * image(1).length, `${size}`);
  // The time machine rebuilds each version with its image.
  assert.equal(journalAt(j, at(5)).ops.symbols[0].image, image(1));
  assert.equal(journalAt(j, at(25)).ops.symbols[0].image, image(2));
  assert.equal(j.ops.symbols[0].image, image(2));
  // Restoring an old version brings its image back.
  const old = auditTrail(j).find(
    (i) => i.scope === "ops.symbols" && i.state?.name === "PC",
  );
  const restored = restoreState(j, old, "A", at(30));
  assert.equal(restored.ops.symbols[0].image, image(1));
  // Two posts converge on the same store.
  assert.deepEqual(
    mergeJournal(j, restored).blobs,
    mergeJournal(restored, j).blobs,
  );
});

test("histories of sessions before 2.1 move their images to the store", () => {
  const j = newJournal("Ancien");
  const img = image(3);
  const events = [1, 2, 3].map((n) => ({
    id: crypto.randomUUID(),
    at: at(n),
    by: "A",
    action: n === 1 ? "create" : "update",
    scope: "ops.symbols",
    target: "0b1a4c64-8b7e-4c4c-9e0e-1a2b3c4d5e6f",
    state: {
      id: "0b1a4c64-8b7e-4c4c-9e0e-1a2b3c4d5e6f",
      name: `S${n}`,
      image: img,
    },
    rev: 0,
    note: "",
  }));
  const parsed = journalSchema.parse({ ...j, history: events });
  assert.equal(Object.keys(parsed.blobs).length, 1);
  assert.ok(parsed.history.every((e) => e.state.image.startsWith("blob:")));
  assert.deepEqual(journalSchema.parse(parsed), parsed);
});

/** Synthetic history: `n` updates of `targets` records, one per minute. */
function synthetic(n, targets = 10, start = T0) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const target = `t${i % targets}`;
    out.push({
      id: crypto.randomUUID(),
      at: new Date(start + i * 60_000).toISOString(),
      by: "A",
      action: i < targets ? "create" : "update",
      scope: "ops.resources",
      target,
      state: { i },
      rev: 0,
      note: "",
    });
  }
  return out;
}

test("compaction thins old versions, keeps creations, and merges the same way", () => {
  const history = synthetic(3000);
  const mark = new Date(T0 + 2000 * 60_000).toISOString();
  const thin = thinHistory(history, mark);
  assert.ok(thin.length < history.length);
  // Creations are all kept, and everything after the watermark.
  assert.equal(thin.filter((e) => e.action === "create").length, 10);
  assert.ok(
    history
      .filter((e) => Date.parse(e.at) >= Date.parse(mark))
      .every((e) => thin.includes(e)),
  );
  // Thinning is idempotent and thin(A ∪ B) = thin(thin(A) ∪ B).
  assert.deepEqual(thinHistory(thin, mark), thin);
  const a = history.filter((_, i) => i % 2 === 0);
  const b = history.filter((_, i) => i % 3 === 0);
  const ids = (list) => list.map((e) => e.id).sort();
  const union = (x, y) => [
    ...new Map([...x, ...y].map((e) => [e.id, e])).values(),
  ];
  assert.deepEqual(
    ids(thinHistory(union(thinHistory(a, mark), b), mark)),
    ids(thinHistory(union(a, b), mark)),
  );
  // A later watermark is coarser, and composes.
  const later = new Date(T0 + 2900 * 60_000).toISOString();
  assert.deepEqual(
    ids(thinHistory(thin, later)),
    ids(thinHistory(history, later)),
  );
  // The cap never drops a creation.
  const capped = capHistory(history, 500);
  assert.equal(capped.length, 500);
  assert.equal(capped.filter((e) => e.action === "create").length, 10);
});

test("a large history is compacted when recorded and still opens beyond the cap", () => {
  let j = newJournal("Longue");
  j = journalSchema.parse({
    ...j,
    history: synthetic(COMPACT_FROM + 500, 5, T0 - 3 * 86_400_000),
  });
  const res = {
    name: "TP",
    kind: "",
    organization: "",
    callsign: "",
    count: 1,
    status: "Disponible",
    location: "",
    mission: "",
    eta: "",
    contact: "",
    notes: "",
  };
  const next = stampJournal(
    j,
    withOps(j, upsert(j.ops, "resources", res, "A")),
    new Date(T0).toISOString(),
    "A",
  );
  assert.ok(next.sync.compacted);
  assert.ok(next.history.length < j.history.length);
  assert.equal(
    next.history.filter((e) => e.action === "create").length,
    j.history.filter((e) => e.action === "create").length + 1,
  );
  // More events than the cap still open (then are capped).
  const big = synthetic(MAX_HISTORY + 10, 1000);
  const parsed = journalSchema.safeParse({
    ...newJournal("Énorme"),
    history: big,
  });
  assert.equal(parsed.success, true);
  assert.equal(parsed.data.history.length, MAX_HISTORY);
});

test("fields of a newer version are dropped, known fields still checked", () => {
  const j = addEntry(
    newJournal("Futur"),
    { ...emptyFields(), message: "Test" },
    "A",
  );
  const future = {
    ...j,
    futureField: { x: 1 },
    entries: j.entries.map((e) => ({
      ...e,
      colour: "rouge",
      revisions: e.revisions.map((r) => ({ ...r, signature: "…" })),
    })),
    sync: { ...j.sync, vector: {} },
  };
  assert.equal(journalSchema.safeParse(future).success, false);
  const tolerant = parseTolerant(journalSchema, future);
  assert.equal(tolerant.success, true);
  assert.equal(tolerant.data.entries[0].colour, undefined);
  const broken = { ...future, title: "" };
  assert.equal(parseTolerant(journalSchema, broken).success, false);
});

test("importing a file never gives a deletion the number of a live entry", () => {
  const fields = (m) => ({ ...emptyFields(), message: m });
  let target = addEntry(newJournal("Ici"), fields("Un"), "A");
  target = addEntry(target, fields("Deux"), "A");
  let incoming = addEntry(newJournal("Ailleurs"), fields("X"), "B");
  incoming = addEntry(incoming, fields("Y"), "B");
  incoming = deleteEntry(incoming, incoming.entries[1].id, "B", "Erreur");
  const merged = mergeJournals(target, incoming);
  const live = new Set(merged.entries.map((e) => e.number));
  for (const d of merged.deleted)
    assert.ok(!live.has(d.number), `#${d.number}`);
  assert.deepEqual(
    merged.entries.map((e) => e.number),
    [1, 2, 3],
  );
  // Merging with the synchronisation rules keeps every number too.
  const again = mergeJournal(merged, merged);
  assert.deepEqual(again.entries.map((e) => e.number).sort(), [1, 2, 3]);
});
