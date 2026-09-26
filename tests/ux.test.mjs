import test from "node:test";
import assert from "node:assert/strict";
import {
  addEntry,
  current,
  emptyFields,
  newJournal,
  overdue,
  reviseEntry,
} from "../shared/journal.ts";
import { fromZurichInput, toZurichInput } from "../shared/time.ts";
import {
  CLOSED_READ_ONLY,
  PAST_READ_ONLY,
  writeRefusal,
} from "../src/app/gate.ts";
import { demoStart, demoWorkspace } from "../src/journal/demo.ts";
import { situationReport } from "../src/print/report.ts";

test("the write gate refuses the past and closed journals, with a reason", () => {
  assert.equal(writeRefusal({ closedAt: "", viewAt: null }), null);
  assert.equal(writeRefusal({ viewAt: null }), null);
  assert.equal(
    writeRefusal({ closedAt: "", viewAt: Date.now() - 1000 }),
    PAST_READ_ONLY,
  );
  assert.equal(
    writeRefusal({ closedAt: "2026-09-26T10:00:00Z", viewAt: null }),
    CLOSED_READ_ONLY,
  );
  // Reopening a closed journal is the one write allowed on it…
  assert.equal(
    writeRefusal(
      { closedAt: "2026-09-26T10:00:00Z", viewAt: null },
      { allowClosed: true },
    ),
    null,
  );
  // …but never from the past.
  assert.equal(
    writeRefusal(
      { closedAt: "2026-09-26T10:00:00Z", viewAt: 0 },
      { allowClosed: true },
    ),
    PAST_READ_ONLY,
  );
  assert.match(PAST_READ_ONLY, /^Lecture seule : vous consultez le passé/);
  assert.match(CLOSED_READ_ONLY, /^Journal clôturé — rouvrez-le pour écrire/);
});

for (const hour of ["00:30", "08:00", "18:30"]) {
  test(`the demonstration started 2 h 30 before an opening at ${hour}`, () => {
    const now = Date.parse(fromZurichInput(`2026-09-26T${hour}`)) + 17_000;
    const start = demoStart(now);
    assert.equal(start % 300_000, 0);
    assert.ok(now - start >= 150 * 60_000 && now - start < 155 * 60_000);
    const workspace = demoWorkspace(now);
    const journal = workspace.journals[0];
    const first = Date.parse(current(journal.entries[0]).happenedAt);
    assert.equal(first, start);
    // Nothing is recorded in the future…
    for (const e of journal.history) assert.ok(Date.parse(e.at) <= now, e.at);
    for (const e of journal.entries)
      assert.ok(Date.parse(current(e).happenedAt) <= now);
    // …and the late due dates are recent, not hours old.
    const late = journal.entries.filter((e) => overdue(e, now));
    assert.ok(late.length > 0);
    for (const e of late)
      assert.ok(now - Date.parse(current(e).dueAt) < 2 * 3_600_000);
    if (hour === "00:30")
      // The exercise began the evening before.
      assert.equal(toZurichInput(start), "2026-09-25T22:00");
    else
      assert.equal(
        toZurichInput(start),
        `2026-09-26T${hour === "08:00" ? "05:30" : "16:00"}`,
      );
  });
}

test("the situation report counts the open points as they were at the end of the period", () => {
  const T0 = Date.parse("2026-09-26T06:00:00Z");
  const T1 = T0 + 3_600_000;
  const T2 = T0 + 2 * 3_600_000;
  const T3 = T0 + 3 * 3_600_000;
  const iso = (t) => new Date(t).toISOString();
  let j = newJournal("Période fictive");
  j = addEntry(
    j,
    {
      ...emptyFields(),
      message: "Contrôler la digue",
      status: "À traiter",
      happenedAt: iso(T0),
      receivedAt: iso(T0),
      dueAt: iso(T0 + 30 * 60_000),
    },
    "PC",
  );
  const id = j.entries[0].id;
  j = reviseEntry(
    j,
    id,
    { ...current(j.entries[0]), status: "Terminé" },
    "PC",
    "Digue contrôlée",
  );
  // Recorded at T0, closed at T2.
  j = {
    ...j,
    createdAt: iso(T0 - 60_000),
    entries: j.entries.map((e) => ({
      ...e,
      createdAt: iso(T0),
      revisions: e.revisions.map((r, i) => ({ ...r, at: iso(i ? T2 : T0) })),
    })),
  };
  const report = (to) =>
    Object.fromEntries(
      situationReport(j, {
        from: iso(T0 - 60_000),
        to: iso(to),
        chronology: false,
      }).map((t) => [t.id, t]),
    );
  const atT1 = report(T1);
  assert.equal(atT1.open.body.length, 1);
  assert.equal(atT1.summary.body[0][3], "1");
  // Late at the end of the period (due 06:30, still open at 07:00).
  assert.equal(atT1.summary.body[1][3], "1");
  assert.match(atT1.open.body[0][3], /DÉPASSÉE/);
  const atT3 = report(T3);
  assert.equal(atT3.open.body.length, 0);
  assert.equal(atT3.summary.body[0][3], "0");
});
