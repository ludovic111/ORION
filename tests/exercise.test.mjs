import test from "node:test";
import assert from "node:assert/strict";
import {
  addEntry,
  emptyFields,
  journalSchema,
  newJournal,
} from "../shared/journal.ts";
import { addLink, ref } from "../shared/links.ts";
import { upsert } from "../shared/ops.ts";
import {
  blankInject,
  deliverInject,
  dueAt,
  dueInjects,
  exportScenario,
  importScenario,
  injectMessageId,
  isExercise,
  parseScenarioFile,
  reactionOf,
  reactions,
  scenarioOf,
  tPlus,
} from "../shared/exercise.ts";
import { ARVE_PAST, ARVE_SCENARIO } from "../shared/scenario-arve.ts";
import { toZurichInput } from "../shared/time.ts";
import { demoStart, demoWorkspace } from "../src/journal/demo.ts";

const MIN = 60_000;
const inject = (patch) => ({ ...blankInject(0), title: "Test", ...patch });

test("T+ injects are due T0 + minutes, also across a change of hour", () => {
  const t0 = Date.parse("2026-09-26T08:00:00Z");
  assert.equal(dueAt(inject({ offset: 90 }), t0), t0 + 90 * MIN);
  assert.equal(dueAt(inject({ offset: 0 }), new Date(t0).toISOString()), t0);
  assert.equal(dueAt(inject({ offset: 5 }), ""), null);
  // Night of the autumn change (25 Oct 2026, 03:00 CEST → 02:00 CET):
  // T+180 from 00:30 is three real hours later, 02:30 on the Zurich clock.
  const night = Date.parse("2026-10-24T22:30:00Z"); // 00:30 CEST
  const due = dueAt(inject({ offset: 180 }), night);
  assert.equal(due - night, 180 * MIN);
  assert.equal(toZurichInput(due, "time"), "02:30");
  assert.equal(tPlus(t0 + 85 * MIN, t0), "T+01:25");
  assert.equal(tPlus(t0 - 5 * MIN, t0), "T-00:05");
});

test("clock injects are read in Zurich time on the day of the exercise, DST exact", () => {
  // T0 on Saturday 24 Oct 2026 at 22:00 Zurich (CEST, UTC+2).
  const t0 = Date.parse("2026-10-24T20:00:00Z");
  const same = dueAt(inject({ timing: "clock", clock: "23:15", day: 0 }), t0);
  assert.equal(new Date(same).toISOString(), "2026-10-24T21:15:00.000Z");
  // Next day at 08:00: winter time (UTC+1) after the night change.
  const next = dueAt(inject({ timing: "clock", clock: "08:00", day: 1 }), t0);
  assert.equal(new Date(next).toISOString(), "2026-10-25T07:00:00.000Z");
  // Spring: 02:30 does not exist on 29 March 2026, it moves to 03:30.
  const spring = Date.parse("2026-03-28T20:00:00Z");
  const skipped = dueAt(
    inject({ timing: "clock", clock: "02:30", day: 1 }),
    spring,
  );
  assert.equal(toZurichInput(skipped, "time"), "03:30");
  // A clock inject without a time is never due.
  assert.equal(dueAt(inject({ timing: "clock", clock: "" }), t0), null);
});

function exerciseJournal(startAt) {
  let j = newJournal("Exercice test", { mode: "Exercice" });
  j = { ...j, ops: importScenario(j.ops, ARVE_SCENARIO, "Direction") };
  const s = scenarioOf(j.ops);
  j = {
    ...j,
    ops: upsert(j.ops, "scenarios", { ...s, startAt }, "Direction"),
  };
  return journalSchema.parse(j);
}

test("the injects due are those whose time has come, once, in order", () => {
  const t0 = Date.parse("2026-09-26T08:00:00Z");
  const j = exerciseJournal(new Date(t0).toISOString());
  assert.equal(dueInjects(j.ops, t0 - MIN).length, 0);
  const due = dueInjects(j.ops, t0 + 31 * MIN);
  assert.deepEqual(
    due.map((i) => i.title),
    ["Niveau de l’Arve en hausse", "Appel d’un riverain inquiet"],
  );
  // Delivered: no longer due; its message has a stable id and a number.
  let ops = deliverInject(j, due[0].id, "Direction", t0 + 31 * MIN);
  const again = deliverInject({ ...j, ops }, due[0].id, "Direction");
  assert.equal(again, ops, "delivering twice changes nothing");
  const message = ops.messages.find((m) => m.id === injectMessageId(due[0].id));
  assert.equal(message.subject, "Niveau de l’Arve en hausse");
  assert.equal(message.status, "Nouveau");
  assert.equal(message.number, 1);
  assert.equal(message.replyNeeded, true);
  assert.deepEqual(
    dueInjects(ops, t0 + 31 * MIN).map((i) => i.title),
    ["Appel d’un riverain inquiet"],
  );
  // Read out by the direction: no message, marked delivered.
  ops = deliverInject({ ...j, ops }, due[1].id, "Direction", t0 + 32 * MIN);
  assert.equal(ops.messages.length, 1);
  assert.ok(ops.injects.find((i) => i.id === due[1].id).deliveredAt);
  // Ended scenario: nothing is due any more.
  const ended = upsert(
    ops,
    "scenarios",
    { ...scenarioOf(ops), endedAt: new Date(t0 + 40 * MIN).toISOString() },
    "Direction",
  );
  assert.equal(dueInjects(ended, t0 + 300 * MIN).length, 0);
});

test("the effects of an inject change the resources, facts and weather", () => {
  const t0 = Date.parse("2026-09-26T08:00:00Z");
  let j = exerciseJournal(new Date(t0).toISOString());
  j = {
    ...j,
    ops: upsert(
      j.ops,
      "facts",
      {
        label: "Niveau de l’Arve (Acacias)",
        value: "+ 45",
        unit: "cm",
        category: "",
        note: "",
        order: 0,
      },
      "Test",
    ),
  };
  const byTitle = (t) => j.ops.injects.find((i) => i.title === t).id;
  let ops = deliverInject(j, byTitle("Seuil d’alerte 2 atteint"), "D");
  assert.equal(ops.facts.length, 1);
  assert.equal(ops.facts[0].value, "+ 60");
  ops = deliverInject({ ...j, ops }, byTitle("Réserve en route"), "D");
  const reserve = ops.resources.find(
    (r) => r.name === "Section appui (réserve)",
  );
  assert.equal(reserve.status, "En route");
  ops = deliverInject({ ...j, ops }, byTitle("Fortes pluies annoncées"), "D");
  assert.equal(ops.observations.length, 1);
  assert.equal(ops.observations[0].precipitation, "12 mm/h");
  journalSchema.parse({ ...j, ops });
});

test("reaction time: message treated, written to the journal, linked, or marked", () => {
  const t0 = Date.parse("2026-09-26T08:00:00Z");
  let j = exerciseJournal(new Date(t0).toISOString());
  const first = j.ops.injects.find((i) => i.offset === 8);
  const delivered = t0 + 8 * MIN;
  j = { ...j, ops: deliverInject(j, first.id, "D", delivered) };
  const messageId = injectMessageId(first.id);
  // Not yet treated: late once the 10 minutes have passed.
  let r = reactionOf(
    j,
    j.ops.injects.find((i) => i.id === first.id),
    j.ops.scenarios[0].startAt,
    delivered + 15 * MIN,
  );
  assert.equal(r.reacted, null);
  assert.equal(r.late, true);
  assert.equal(r.delay, 5);
  // Status changed at +4 min (seen in the history).
  const message = j.ops.messages.find((m) => m.id === messageId);
  j = {
    ...j,
    history: [
      {
        id: crypto.randomUUID(),
        at: new Date(delivered + 4 * MIN).toISOString(),
        by: "Opérateur",
        action: "update",
        scope: "ops.messages",
        target: messageId,
        state: { ...message, status: "En traitement" },
        rev: 0,
        note: "",
      },
    ],
  };
  r = reactionOf(
    j,
    j.ops.injects.find((i) => i.id === first.id),
    j.ops.scenarios[0].startAt,
    delivered + 30 * MIN,
  );
  assert.equal(r.minutes, 4);
  assert.equal(r.late, false);
  assert.equal(r.how, "message en traitement");
  // An entry linked earlier (+2 min) wins.
  j = addEntry(
    j,
    { ...emptyFields(), message: "Reconnaissance demandée" },
    "Op",
  );
  const entry = j.entries.at(-1);
  j = {
    ...j,
    ops: addLink(
      j.ops,
      ref("message", messageId),
      ref("entry", entry.id),
      "",
      "Op",
    ),
  };
  j.ops.links[0].createdAt = new Date(delivered + 2 * MIN).toISOString();
  r = reactionOf(
    j,
    j.ops.injects.find((i) => i.id === first.id),
    j.ops.scenarios[0].startAt,
    delivered + 30 * MIN,
  );
  assert.equal(r.minutes, 2);
  assert.equal(r.how, "entrée liée");
  // A manual mark by the direction, earlier still.
  const marked = {
    ...j.ops.injects.find((i) => i.id === first.id),
    reactedAt: new Date(delivered + MIN).toISOString(),
    reactionNote: "Réponse radio",
  };
  r = reactionOf(j, marked, j.ops.scenarios[0].startAt, delivered + 30 * MIN);
  assert.equal(r.minutes, 1);
  assert.equal(r.how, "Réponse radio");
});

test("scenario files: export, strict import, portable (no run kept)", () => {
  const t0 = Date.parse("2026-09-26T08:00:00Z");
  const j = exerciseJournal(new Date(t0).toISOString());
  const ops = deliverInject(j, j.ops.injects[0].id, "D", t0 + 9 * MIN);
  const file = exportScenario(ops, "2026-09-26T10:00:00.000Z");
  assert.equal(file.format, "orion-aic-scenario");
  assert.equal(file.injects.length, ARVE_SCENARIO.injects.length);
  assert.ok(!("deliveredAt" in file.injects[0]));
  // Round trip through JSON text.
  const back = parseScenarioFile(JSON.stringify(file));
  assert.deepEqual(back.injects, file.injects);
  // Import into a fresh journal: new ids, nothing delivered.
  const fresh = importScenario(
    newJournal("B", { mode: "Exercice" }).ops,
    back,
    "D",
  );
  assert.equal(fresh.injects.length, file.injects.length);
  assert.ok(fresh.injects.every((i) => !i.deliveredAt && i.scenarioId));
  assert.equal(
    new Set(fresh.injects.map((i) => i.id)).size,
    fresh.injects.length,
  );
  // Defaults filled for a minimal file.
  const minimal = parseScenarioFile({
    format: "orion-aic-scenario",
    version: 1,
    title: "Mini",
    injects: [{ title: "Un", offset: 5 }],
  });
  assert.equal(minimal.injects[0].via, "Message");
  assert.equal(minimal.injects[0].delivery, "message");
  // Errors in French, never a crash.
  assert.throws(() => parseScenarioFile("{"), /pas un scénario JSON/);
  assert.throws(
    () => parseScenarioFile({ format: "autre" }),
    /orion-aic-scenario/,
  );
  assert.throws(
    () =>
      parseScenarioFile({
        format: "orion-aic-scenario",
        version: 1,
        title: "X",
        injects: [{ title: "Heure", timing: "clock" }],
      }),
    /heure/,
  );
  assert.throws(
    () =>
      parseScenarioFile({
        format: "orion-aic-scenario",
        version: 1,
        title: "X",
        injects: [{ title: "Y", unknown: 1 }],
      }),
    /Scénario invalide/,
  );
});

test("the living demonstration: past injects played, next ones in a few minutes", () => {
  const now = Date.parse("2026-09-26T14:07:30Z");
  const ws = demoWorkspace(now);
  const j = ws.journals[0];
  assert.ok(isExercise(j));
  const scenario = scenarioOf(j.ops);
  assert.equal(scenario.autoplay, true);
  assert.equal(Date.parse(scenario.startAt), demoStart(now));
  const past = ARVE_SCENARIO.injects.filter((i) => i.offset < ARVE_PAST).length;
  assert.equal(j.ops.injects.filter((i) => i.deliveredAt).length, past);
  // The first message of the scenario is the demo message already there.
  const first = j.ops.injects.find(
    (i) => i.title === "Niveau de l’Arve en hausse",
  );
  assert.ok(j.ops.messages.some((m) => m.id === first.messageId));
  // Nothing due at opening; the first live inject within 2 to 3 minutes,
  // then one every few minutes.
  assert.equal(dueInjects(j.ops, now).length, 0);
  const next = j.ops.injects
    .filter((i) => !i.deliveredAt)
    .map((i) => dueAt(i, scenario.startAt))
    .sort((a, b) => a - b);
  assert.ok(next[0] - now > 60_000 && next[0] - now <= 3 * MIN, "first soon");
  for (let k = 1; k < next.length; k++)
    assert.ok(next[k] - next[k - 1] <= 10 * MIN, "then every few minutes");
  // Reactions of the past injects are measured.
  const r = reactions(j, now);
  assert.ok(r.some((x) => x.reacted !== null));
  assert.ok(r.some((x) => x.late));
});

test("an intervention journal is never an exercise", () => {
  assert.equal(isExercise(newJournal("I", { mode: "Intervention" })), false);
  assert.equal(isExercise(newJournal("E", { mode: "Exercice" })), true);
});
