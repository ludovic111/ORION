import test from "node:test";
import assert from "node:assert/strict";
import { addEntry, emptyFields, newJournal } from "../shared/journal.ts";
import { upsert } from "../shared/ops.ts";
import { burnShift, countdown, wallData } from "../src/wall/select.ts";
import { demoWorkspace } from "../src/journal/demo.ts";

const MIN = 60_000;
const T0 = Date.parse("2026-09-26T08:00:00Z");
const iso = (m) => new Date(T0 + m * MIN).toISOString();

function fixture() {
  let j = newJournal("Mur", { mode: "Exercice", location: "Carouge" });
  const add = (m, patch) => {
    j = addEntry(
      j,
      { ...emptyFields(), happenedAt: iso(m), receivedAt: iso(m), ...patch },
      "Op",
    );
  };
  add(0, { message: "Ouverture" });
  add(5, { message: "Pont à vérifier", status: "À traiter", dueAt: iso(20) });
  add(10, { message: "Sacs de sable", status: "En cours", dueAt: iso(120) });
  add(15, { message: "Urgent : route", priority: "Urgent" });
  const put = (collection, value) => {
    j = { ...j, ops: upsert(j.ops, collection, value, "Op") };
  };
  const agenda = (m, title, kind, done = false) =>
    put("agenda", {
      at: iso(m),
      minutes: 30,
      title,
      kind,
      location: "",
      participants: "",
      notes: "",
      done,
    });
  agenda(40, "Café", "Autre");
  agenda(60, "Rapport de conduite", "Rapport de conduite");
  agenda(25, "Orientation passée", "Orientation", true);
  const resource = (name, status) =>
    put("resources", {
      name,
      kind: "",
      organization: "",
      callsign: "",
      count: 2,
      status,
      location: "",
      mission: "",
      eta: "",
      contact: "",
      notes: "",
    });
  resource("Bravo", "Engagé");
  resource("Alpha", "En route");
  resource("Motopompes", "Disponible");
  put("facts", {
    label: "Évacués",
    value: "12",
    unit: "pers.",
    category: "",
    note: "",
    order: 1,
  });
  put("facts", {
    label: "Blessés",
    value: "",
    unit: "",
    category: "",
    note: "",
    order: 0,
  });
  put("alerts", {
    level: "3",
    hazard: "Crues",
    region: "Arve",
    from: iso(-60),
    to: iso(600),
    source: "",
    notes: "",
  });
  put("alerts", {
    level: "4",
    hazard: "Vent",
    region: "",
    from: iso(600),
    to: "",
    source: "",
    notes: "",
  });
  return j;
}

test("wall data: late points first, next report, engaged resources, facts", () => {
  const d = wallData(fixture(), T0 + 30 * MIN);
  assert.equal(d.exercise, true);
  assert.equal(d.openCount, 2);
  assert.equal(d.lateCount, 1);
  assert.equal(d.open[0].text, "Pont à vérifier");
  assert.equal(d.open[0].late, true);
  // The report is preferred to an earlier ordinary meeting.
  assert.equal(d.next.title, "Rapport de conduite");
  assert.equal(d.next.minutes, 30);
  assert.equal(d.next.live, false);
  assert.deepEqual(
    d.engaged.map((r) => r.name),
    ["Bravo", "Alpha"],
  );
  assert.equal(d.engagedCount, 2);
  // Facts without a value are left out.
  assert.deepEqual(
    d.facts.map((f) => f.label),
    ["Évacués"],
  );
  // Latest entries, newest first.
  assert.equal(d.latest[0].text, "Urgent : route");
  assert.equal(d.latest[0].priority, "Urgent");
  // Only alerts in force.
  assert.deepEqual(
    d.alerts.map((a) => a.hazard),
    ["Crues"],
  );
});

test("wall data: meeting in progress, nothing planned, limits", () => {
  const j = fixture();
  const during = wallData(j, T0 + 70 * MIN);
  assert.equal(during.next.title, "Rapport de conduite");
  assert.equal(during.next.live, true);
  const after = wallData(j, T0 + 200 * MIN);
  assert.equal(after.next, null);
  const few = wallData(j, T0, { open: 1, latest: 2, facts: 1, resources: 1 });
  assert.equal(few.open.length, 1);
  assert.equal(few.latest.length, 2);
  assert.equal(few.engaged.length, 1);
  assert.equal(few.engagedCount, 2);
});

test("countdown and burn-in shift", () => {
  assert.equal(countdown(12, false), "dans 12 min");
  assert.equal(countdown(65, false), "dans 1 h 05");
  assert.equal(countdown(0, false), "maintenant");
  assert.equal(countdown(-5, true), "en cours");
  const seen = new Set();
  for (let k = 0; k < 9; k++) {
    const s = burnShift(k * 120_000);
    assert.ok(Math.abs(s.x) <= 6 && Math.abs(s.y) <= 6);
    seen.add(`${s.x},${s.y}`);
  }
  assert.equal(seen.size, 9, "moves through nine positions");
  assert.deepEqual(burnShift(0), burnShift(9 * 120_000), "then starts again");
  assert.deepEqual(
    burnShift(1000),
    burnShift(119_000),
    "still within a period",
  );
});

test("wall data of the demonstration", () => {
  const now = Date.parse("2026-09-26T14:07:30Z");
  const d = wallData(demoWorkspace(now).journals[0], now);
  assert.equal(d.title, "Crue de l’Arve");
  assert.ok(d.openCount > 0);
  assert.ok(d.engagedCount > 0);
  assert.ok(d.latest.length > 0);
});
