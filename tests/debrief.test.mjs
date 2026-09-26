import test from "node:test";
import assert from "node:assert/strict";
import {
  addEntry,
  emptyFields,
  newJournal,
  reviseEntry,
  current,
} from "../shared/journal.ts";
import { upsert } from "../shared/ops.ts";
import {
  deadlines,
  debriefMetrics,
  entriesPerHour,
  median,
  minutesLabel,
  whoDidWhat,
} from "../shared/debrief.ts";
import { demoWorkspace } from "../src/journal/demo.ts";
import { buildDossier } from "../src/export/dossier.ts";

const MIN = 60_000;
const T0 = Date.parse("2026-09-26T08:00:00Z");
const iso = (m) => new Date(T0 + m * MIN).toISOString();

/** Fixture: three entries with due dates, two messages, two people. */
function fixture() {
  let j = newJournal("RETEX", { mode: "Intervention" });
  const entry = (m, by, patch) => {
    j = addEntry(
      j,
      { ...emptyFields(), happenedAt: iso(m), receivedAt: iso(m), ...patch },
      by,
    );
    const e = j.entries.at(-1);
    e.createdAt = iso(m);
    e.revisions[0].at = iso(m);
    return e.id;
  };
  // Closed 10 min late.
  const late = entry(0, "Alice", {
    message: "Reconnaissance du pont",
    status: "À traiter",
    dueAt: iso(20),
  });
  // Closed in time.
  const kept = entry(5, "Bob", {
    message: "Commander des sacs",
    status: "À traiter",
    dueAt: iso(60),
  });
  // Still open, 30 min past due at T0 + 90.
  entry(70, "Alice", {
    message: "Rapport à la commune",
    status: "En cours",
    dueAt: iso(60),
  });
  const close = (id, m, by) => {
    const e = j.entries.find((x) => x.id === id);
    j = reviseEntry(j, id, { ...current(e), status: "Terminé" }, by, "Fait");
    j.entries.find((x) => x.id === id).revisions.at(-1).at = iso(m);
  };
  close(late, 30, "Bob");
  close(kept, 40, "Alice");
  // Messages: one treated after 12 min (history), one never treated.
  const received = (m, subject) => {
    j = {
      ...j,
      ops: upsert(
        j.ops,
        "messages",
        {
          receivedAt: iso(m),
          from: "Police",
          to: "PC",
          via: "Radio",
          priority: "Normal",
          category: "",
          subject,
          body: "",
          location: "",
          coordinates: "",
          replyNeeded: false,
          replyBy: "",
          status: "Nouveau",
          entryId: "",
          handledBy: "",
          notes: "",
          tags: [],
        },
        "Bob",
      ),
    };
    return j.ops.messages.at(-1);
  };
  const treated = received(10, "Route fermée");
  received(50, "Information");
  j = {
    ...j,
    history: [
      {
        id: crypto.randomUUID(),
        at: iso(22),
        by: "Bob",
        action: "update",
        scope: "ops.messages",
        target: treated.id,
        state: { ...treated, status: "Transmis" },
        rev: 0,
        note: "",
      },
    ],
  };
  return j;
}

test("deadlines: late, kept and still open past due", () => {
  const d = deadlines(fixture(), T0 + 90 * MIN);
  assert.deepEqual(
    d.map((x) => x.delay),
    [10, 0, 30],
  );
  assert.equal(d[0].closed, T0 + 30 * MIN);
  assert.equal(d[2].closed, null);
});

test("debrief metrics of a fixture journal", () => {
  const m = debriefMetrics(fixture(), T0 + 90 * MIN);
  assert.equal(m.overdue, 2);
  assert.equal(m.totalDelay, 40);
  assert.equal(m.messages, 2);
  assert.equal(m.treated, 1);
  assert.equal(m.medianTreatment, 12);
  const bucket = (label) => m.treatment.find((b) => b.label === label).count;
  assert.equal(bucket("5 à 15 min"), 1);
  assert.equal(bucket("pas encore traités"), 1);
  // No scenario: no inject.
  assert.equal(m.injects.length, 0);
  assert.equal(m.medianReaction, null);
  // Entries per Zurich hour, empty hours included.
  assert.deepEqual(
    m.perHour.map((h) => h.count),
    [2, 1],
  );
  assert.equal(m.perHour[0].hour, "2026-09-26 10");
});

test("who did what counts entries, corrections and messages", () => {
  const people = whoDidWhat(fixture());
  const alice = people.find((p) => p.name === "Alice");
  const bob = people.find((p) => p.name === "Bob");
  assert.equal(alice.entries, 2);
  assert.equal(alice.revisions, 1);
  assert.equal(bob.entries, 1);
  assert.equal(bob.revisions, 1);
  assert.equal(bob.messages, 1);
});

test("small helpers: median, labels, empty hours", () => {
  assert.equal(median([]), null);
  assert.equal(median([5, 1, 3]), 3);
  assert.equal(median([1, 2, 3, 10]), 3);
  assert.equal(minutesLabel(null), "—");
  assert.equal(minutesLabel(12), "12 min");
  assert.equal(minutesLabel(125), "2 h 05");
  const j = fixture();
  j.entries[2].createdAt = iso(250);
  const hours = entriesPerHour(j);
  assert.deepEqual(
    hours.map((h) => h.count),
    [2, 0, 0, 0, 1],
  );
});

test("the dossier chapter « Exercice et débriefing » of the demonstration", async () => {
  const now = Date.parse("2026-09-26T14:07:30Z");
  const j = demoWorkspace(now).journals[0];
  const m = debriefMetrics(j, now);
  assert.equal(m.delivered, 5);
  assert.ok(m.people.length >= 3);
  const d = await buildDossier(
    j,
    { sections: ["exercise"], viewAt: null },
    { author: "Test" },
  );
  assert.equal(d.chapters.length, 1);
  const chapter = d.chapters[0];
  assert.equal(chapter.title, "Exercice et débriefing");
  const ids = chapter.blocks
    .filter((b) => b.kind === "table")
    .map((b) => b.table.id);
  assert.ok(ids.includes("debrief-injects"));
  assert.ok(ids.includes("debrief-people"));
  const texts = chapter.blocks.filter((b) => b.kind === "text");
  assert.ok(
    texts.some(
      (t) => t.title === "Points positifs" && t.body.includes("quittances"),
    ),
  );
  assert.ok(texts.some((t) => t.title === "Points à améliorer"));
});
