import test from "node:test";
import assert from "node:assert/strict";
import {
  addEntry,
  archive,
  chronological,
  current,
  emptyFields,
  journalSchema,
  mergeJournals,
  newJournal,
  parseArchive,
  planMerge,
  reviseEntry,
  searchEntries,
  workspaceSchema,
} from "../shared/journal.ts";
const entry = (message = "Reconnaissance au pont") => ({
  ...emptyFields(),
  message,
});
const journal = () => addEntry(newJournal("Exercice fictif"), entry(), "Alpha");
test("archive roundtrip preserves all fields, authors and complete revision history", () => {
  let value = journal();
  const id = value.entries[0].id;
  value = reviseEntry(
    value,
    id,
    {
      ...current(value.entries[0]),
      message: "Évacuation confirmée",
      status: "Terminé",
      notes: "λ & <script> 🙂\nDeuxième ligne",
      coordinates: "MN95 2 500 000 / 1 117 000",
      dueAt: "2026-10-25T02:30:00+02:00",
      tags: ["relève", "école"],
    },
    "Bravo",
    "Confirmation radio",
  );
  assert.deepEqual(
    parseArchive(JSON.parse(JSON.stringify(archive(value)))).journal,
    value,
  );
  assert.equal(
    value.entries[0].revisions[0].fields.message,
    "Reconnaissance au pont",
  );
  assert.equal(value.entries[0].revisions[1].author, "Bravo");
});
test("correction does not mutate the original and needs a reason", () => {
  const value = journal();
  const before = JSON.stringify(value);
  assert.throws(() =>
    reviseEntry(value, value.entries[0].id, entry("Corrigé"), "Bravo", "  "),
  );
  reviseEntry(
    value,
    value.entries[0].id,
    entry("Corrigé"),
    "Bravo",
    "Correction du lieu",
  );
  assert.equal(JSON.stringify(value), before);
});
test("closed journals reject additions, corrections and merges", () => {
  const value = { ...journal(), closedAt: new Date().toISOString() };
  assert.throws(() => addEntry(value, entry(), "Alpha"));
  assert.throws(() =>
    reviseEntry(value, value.entries[0].id, entry(), "Alpha", "Test"),
  );
  assert.throws(() => mergeJournals(value, newJournal("Autre")));
});
test("stable entry numbering is independent of the event date", () => {
  let value = journal();
  value = addEntry(
    value,
    {
      ...entry("Observation plus ancienne"),
      happenedAt: "2020-01-01T00:00:00Z",
    },
    "Bravo",
  );
  const ordered = chronological(value.entries);
  assert.equal(ordered[0].number, 2);
  assert.equal(ordered[1].number, 1);
});
test("search is insensitive to accents and spans source, notes and location", () => {
  const value = addEntry(
    newJournal("Test"),
    {
      ...entry("Évacuation école"),
      location: "Genève",
      source: "Alpha",
      notes: "Contrôle terminé",
    },
    "Beta",
  );
  assert.equal(
    searchEntries(value.entries, "ecole geneve ALPHA termine").length,
    1,
  );
  assert.equal(searchEntries(value.entries, "absent").length, 0);
});
test("unknown archive versions and fields fail closed", () => {
  assert.throws(() => parseArchive({ ...archive(journal()), version: 2 }));
  assert.throws(() =>
    parseArchive({
      ...archive(journal()),
      remoteUrl: "https://invalid.example",
    }),
  );
  assert.throws(() =>
    parseArchive({
      ...archive(journal()),
      journal: { ...journal(), title: "" },
    }),
  );
});
test("duplicate entry identities, numbers and revisions are rejected", () => {
  const value = journal(),
    e = value.entries[0];
  assert.equal(
    journalSchema.safeParse({ ...value, entries: [e, { ...e, number: 2 }] })
      .success,
    false,
  );
  assert.equal(
    journalSchema.safeParse({
      ...value,
      entries: [e, { ...e, id: crypto.randomUUID() }],
    }).success,
    false,
  );
  assert.equal(
    journalSchema.safeParse({
      ...value,
      entries: [{ ...e, revisions: [...e.revisions, ...e.revisions] }],
    }).success,
    false,
  );
});
test("workspace requires unique journals and a valid active journal", () => {
  const value = journal();
  const base = {
    version: 1,
    author: "Alpha",
    activeId: value.id,
    journals: [value],
  };
  assert.equal(workspaceSchema.safeParse(base).success, true);
  assert.equal(
    workspaceSchema.safeParse({ ...base, activeId: crypto.randomUUID() })
      .success,
    false,
  );
  assert.equal(
    workspaceSchema.safeParse({ ...base, journals: [value, value] }).success,
    false,
  );
});
test("merge imports new entries, preserves authors and renumbers locally", () => {
  const target = journal(),
    incoming = journal();
  const result = mergeJournals(target, incoming);
  assert.equal(result.entries.length, 2);
  assert.equal(result.entries[1].id, incoming.entries[0].id);
  assert.equal(result.entries[1].number, 2);
  assert.deepEqual(result.entries[1].revisions, incoming.entries[0].revisions);
  assert.deepEqual(mergeJournals(result, incoming), result);
});
test("divergent revisions block the entire merge without partial writes", () => {
  const value = journal();
  let incoming = reviseEntry(
    value,
    value.entries[0].id,
    entry("Autre version"),
    "Beta",
    "Reçu par radio",
  );
  incoming = addEntry(incoming, entry("Entrée nouvelle"), "Beta");
  const before = JSON.stringify(value);
  const plan = planMerge(value, incoming);
  assert.equal(plan.conflicts.length, 1);
  assert.equal(plan.added.length, 1);
  assert.throws(() => mergeJournals(value, incoming), /divergent/);
  assert.equal(JSON.stringify(value), before);
});
test("merge idempotence holds across many overlapping subsets", () => {
  let full = newJournal("Fictif");
  for (let i = 0; i < 35; i++)
    full = addEntry(full, entry(`Message ${i}`), "Alpha");
  for (let k = 1; k <= 30; k++) {
    const subset = {
      ...full,
      entries: full.entries.filter((_, i) => (i + k) % 3 !== 0),
    };
    const merged = mergeJournals(subset, full);
    assert.equal(merged.entries.length, 35);
    assert.equal(new Set(merged.entries.map((e) => e.number)).size, 35);
    assert.deepEqual(mergeJournals(merged, full), merged);
    assert.deepEqual(
      new Set(merged.entries.map((e) => e.id)),
      new Set(full.entries.map((e) => e.id)),
    );
  }
});

test("recovery snapshots accept an unfinished draft and reject orphan drafts", () => {
  const j = journal();
  const draft = emptyFields();
  const snapshot = {
    version: 1,
    author: "Alpha",
    activeId: j.id,
    journals: [j],
    drafts: { [j.id]: draft },
  };
  assert.deepEqual(workspaceSchema.parse(snapshot).drafts[j.id], draft);
  assert.equal(
    workspaceSchema.safeParse({
      ...snapshot,
      drafts: { [crypto.randomUUID()]: draft },
    }).success,
    false,
  );
});
