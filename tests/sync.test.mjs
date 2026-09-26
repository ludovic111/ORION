import test from "node:test";
import assert from "node:assert/strict";
import {
  addEntry,
  current,
  deleteEntry,
  emptyFields,
  journalSchema,
  newJournal,
  numberLabel,
  reviseEntry,
} from "../shared/journal.ts";
import { removeRecords, upsert } from "../shared/ops.ts";
import {
  digest,
  mergeJournal,
  mergeWorkspace,
  stampJournal,
  stampWorkspace,
} from "../shared/sync.ts";
import { addLink, edges, items, neighbours, ref } from "../shared/links.ts";

const fields = (message, extra = {}) => ({
  ...emptyFields(),
  message,
  ...extra,
});
const at = (minute) =>
  new Date(Date.UTC(2026, 8, 24, 10, minute)).toISOString();
/** A local change: stamped as the app does it. */
const change = (before, after, minute) =>
  stampJournal(before, after, at(minute));
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

test("two posts adding entries converge, the oldest entry keeps the bare number", async () => {
  const base = change(undefined, newJournal("Crue"), 0);
  const a = addEntry(base, fields("Poste A"), "A");
  await new Promise((r) => setTimeout(r, 5));
  const b = addEntry(base, fields("Poste B"), "B");
  assert.equal(a.entries[0].number, 1);
  assert.equal(b.entries[0].number, 1);
  const ab = mergeJournal(a, b);
  const ba = mergeJournal(b, a);
  assert.equal(await digest(ab), await digest(ba));
  const labels = Object.fromEntries(
    ab.entries.map((e) => [current(e).message, numberLabel(e)]),
  );
  // Numbers are never changed: the later entry is told apart by a suffix.
  assert.equal(labels["Poste A"], "#001");
  assert.match(labels["Poste B"], /^#001·[A-Z]$/);
  assert.equal(await digest(mergeJournal(ab, ab)), await digest(ab));
});

test("revisions from both posts are kept and deletions win", async () => {
  const base = addEntry(newJournal("Crue"), fields("Départ"), "A");
  const id = base.entries[0].id;
  const a = reviseEntry(base, id, fields("Départ confirmé"), "A", "Confirmé");
  const b = reviseEntry(
    base,
    id,
    fields("Départ, 3 véhicules"),
    "B",
    "Précision",
  );
  const ab = mergeJournal(a, b);
  assert.equal(ab.entries[0].revisions.length, 3);
  const gone = deleteEntry(a, id, "A", "Doublon");
  const merged = mergeJournal(gone, b);
  assert.equal(merged.entries.length, 0);
  assert.equal(merged.deleted.length, 1);
});

test("records: latest change wins, removal wins over older changes", async () => {
  const empty = change(undefined, newJournal("Crue"), 0);
  const created = change(
    empty,
    withOps(empty, upsert(empty.ops, "resources", resource("TP 1"), "A")),
    1,
  );
  const id = created.ops.resources[0].id;
  const edit = (j, status, minute) =>
    change(
      j,
      withOps(
        j,
        upsert(j.ops, "resources", { ...j.ops.resources[0], status }, "A"),
      ),
      minute,
    );
  const a = edit(created, "Engagé", 5);
  const b = edit(created, "En route", 3);
  assert.equal(mergeJournal(a, b).ops.resources[0].status, "Engagé");
  assert.equal(mergeJournal(b, a).ops.resources[0].status, "Engagé");

  const removed = change(
    created,
    withOps(created, removeRecords(created.ops, [id])),
    4,
  );
  assert.equal(mergeJournal(removed, b).ops.resources.length, 0);
  assert.equal(mergeJournal(b, removed).ops.resources.length, 0);
  // A later change brings the record back.
  assert.equal(mergeJournal(removed, a).ops.resources.length, 1);
});

test("journal header follows the latest change and unknown journals are added", () => {
  const base = change(undefined, newJournal("Crue"), 0);
  const renamed = change(base, { ...base, title: "Crue de l’Arve" }, 2);
  const merged = mergeJournal(base, renamed);
  assert.equal(merged.title, "Crue de l’Arve");
  const other = change(undefined, newJournal("Exercice"), 1);
  const workspace = {
    version: 1,
    author: "A",
    journals: [base],
    activeId: base.id,
  };
  const next = mergeWorkspace(workspace, { journals: [renamed, other] });
  assert.equal(next.journals.length, 2);
  assert.equal(next.activeId, base.id);
  assert.equal(next.author, "A");
});

test("removed journals stay removed across posts", () => {
  const one = newJournal("Un");
  const two = newJournal("Deux");
  const before = {
    version: 1,
    author: "A",
    journals: [one, two],
    activeId: one.id,
  };
  const after = stampWorkspace(before, { ...before, journals: [one] });
  assert.ok(after.gone[two.id]);
  const merged = mergeWorkspace(after, { journals: [one, two] });
  assert.deepEqual(
    merged.journals.map((j) => j.title),
    ["Un"],
  );
});

test("links: explicit and implicit links are found in both directions", () => {
  let journal = newJournal("Crue");
  journal = addEntry(
    journal,
    fields("Demande de pompes", { source: "Pionnier 1" }),
    "A",
  );
  let ops = upsert(
    journal.ops,
    "resources",
    { ...resource("Pionnier 1") },
    "A",
  );
  ops = upsert(
    ops,
    "places",
    {
      label: "Tonne-pompe",
      kind: "point",
      symbol: "",
      color: "",
      layer: "Moyens",
      points: [[46.2, 6.15]],
      notes: "",
    },
    "A",
  );
  const place = ops.places[0];
  const res = ops.resources[0];
  ops = addLink(
    ops,
    ref("place", place.id),
    ref("resource", res.id),
    "position",
    "A",
  );
  journal = withOps(journal, ops);
  const all = edges(journal);
  const aroundResource = neighbours(journal, ref("resource", res.id), all);
  assert.ok(aroundResource.some((n) => n.ref === ref("place", place.id)));
  // The entry names the resource as its sender.
  assert.ok(
    aroundResource.some((n) => n.ref === ref("entry", journal.entries[0].id)),
  );
  assert.equal(items(journal).length, 3);
});
