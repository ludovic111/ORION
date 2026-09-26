import test from "node:test";
import assert from "node:assert/strict";
import {
  addEntry,
  current,
  emptyFields,
  journalSchema,
  newJournal,
  overdue,
} from "../shared/journal.ts";
import { upsert } from "../shared/ops.ts";
import { mergeJournal, stampJournal } from "../shared/sync.ts";
import { fromZurichInput, toZurichInput } from "../shared/time.ts";
import {
  BUILTIN_TEMPLATES,
  duplicateTemplate,
  findTemplate,
  progress,
  saveTemplate,
  startChecklist,
  templateRecordId,
  templates,
  tickId,
  tickStep,
  ticksOf,
  untickStep,
} from "../shared/checklists.ts";
import {
  canMove,
  createRequest,
  lateMinutes,
  moveRequest,
  requestLate,
} from "../shared/requests.ts";
import {
  checkIn,
  checkOut,
  dutyBoard,
  dutyOf,
  planShifts,
  shiftWarnings,
} from "../shared/presence.ts";
import {
  composeSituationPoint,
  lastReportTime,
  pointText,
} from "../shared/situation-point.ts";
import {
  defaultSince,
  handoverSummary,
  summaryTables,
  summaryText,
} from "../shared/handover-summary.ts";
import {
  alertIdFor,
  alertKey,
  applyThresholds,
  crossings,
  entryIdFor,
} from "../shared/thresholds.ts";
import { dueReminders, nextDue } from "../shared/reminders.ts";
import { items, edges } from "../shared/links.ts";

const Z = (wall) => Date.parse(fromZurichInput(wall));
const iso = (ms) => new Date(ms).toISOString();
const HOUR = 3_600_000;

// ---------- Checklists ----------

test("every built-in checklist is valid, with unique step keys and practical steps", () => {
  const keys = new Set();
  for (const t of BUILTIN_TEMPLATES) {
    assert.ok(!keys.has(t.key), t.key);
    keys.add(t.key);
    assert.ok(t.steps.length >= 8, `${t.name}: ${t.steps.length} steps`);
    assert.equal(new Set(t.steps.map((s) => s.id)).size, t.steps.length);
    assert.ok(
      t.steps.some((s) => s.minutes > 0),
      `${t.name} has a timer`,
    );
    assert.ok(
      t.steps.every((s) => s.role),
      `${t.name}: every step has a role`,
    );
  }
  for (const key of [
    "ouverture-pc",
    "crue",
    "blackout",
    "canicule",
    "abc",
    "tempete",
    "seisme",
    "recherche",
    "accueil",
  ])
    assert.ok(keys.has(key), key);
});

test("a built-in template can be changed, hidden, duplicated; the override id is deterministic", () => {
  let j = newJournal("Listes");
  const crue = findTemplate(j.ops, "builtin:crue");
  const edited = saveTemplate(
    j.ops,
    { ...crue, name: "Crue de l’Arve", steps: crue.steps.slice(0, 3) },
    "A",
  );
  assert.equal(edited.id, templateRecordId("crue"));
  const view = findTemplate(edited.ops, "builtin:crue");
  assert.equal(view.name, "Crue de l’Arve");
  assert.equal(view.steps.length, 3);
  assert.ok(view.changed);
  // Two posts editing the same built-in list write the same record.
  const other = saveTemplate(j.ops, { ...crue, name: "Autre nom" }, "B");
  assert.equal(other.id, edited.id);
  const copy = duplicateTemplate(edited.ops, view, "A");
  const own = findTemplate(copy.ops, copy.id);
  assert.equal(own.builtIn, "");
  assert.match(own.name, /copie/);
  assert.equal(templates(copy.ops).length, BUILTIN_TEMPLATES.length + 1);
});

test("template → instance → tick writes an entry, records who and when, and a timer opens a follow-up", () => {
  let j = newJournal("Crue");
  const template = findTemplate(j.ops, "builtin:crue");
  const started = startChecklist(
    j.ops,
    template,
    "PC",
    iso(Z("2026-09-26T08:00")),
  );
  j = journalSchema.parse({ ...j, ops: started.ops });
  const list = j.ops.checklists[0];
  assert.equal(list.steps.length, template.steps.length);
  // Changing the template later does not change the running list.
  const changed = saveTemplate(j.ops, { ...template, steps: [] }, "PC");
  assert.equal(changed.ops.checklists[0].steps.length, template.steps.length);

  // A step with a timer: entry "à traiter" due X minutes later.
  const timed = list.steps.find((s) => s.minutes > 0);
  const at = iso(Z("2026-09-26T08:10"));
  j = tickStep(j, list.id, timed.id, { author: "Sgt A", at });
  const tick = j.ops.checklistTicks[0];
  assert.equal(tick.id, tickId(list.id, timed.id));
  assert.equal(tick.who, "Sgt A");
  assert.equal(tick.at, at);
  const entry = j.entries.find((e) => e.id === tick.entryId);
  assert.equal(current(entry).status, "À traiter");
  assert.equal(
    Date.parse(current(entry).dueAt),
    Z("2026-09-26T08:10") + timed.minutes * 60_000,
  );
  assert.equal(current(entry).assignee, timed.role);
  assert.ok(
    overdue(entry, Z("2026-09-26T08:10") + (timed.minutes + 1) * 60_000),
  );

  // A step without log and without timer: no entry; forcing log writes one.
  const quiet = list.steps.find((s) => !s.log && !s.minutes);
  const before = j.entries.length;
  j = tickStep(j, list.id, quiet.id, { author: "Sgt A" });
  assert.equal(j.entries.length, before);
  const plain = list.steps.find((s) => s.log && !s.minutes);
  j = tickStep(j, list.id, plain.id, { author: "Sgt A", log: false });
  assert.equal(j.entries.length, before);
  const p = progress(j, list, Z("2026-09-26T08:15"));
  assert.equal(p.done, 3);
  assert.equal(p.total, list.steps.length);

  // Untick keeps the record (merge-friendly) but marks it not done.
  const ops = untickStep(j.ops, list.id, plain.id, "Sgt B");
  assert.equal(ticksOf(ops, list).get(plain.id).done, false);
  assert.equal(progress({ ...j, ops }, list).done, 2);
  // The list and its ticks are items of the graph, linked to the entry.
  const graph = items(j);
  assert.ok(graph.some((i) => i.ref === `checklist:${list.id}`));
  assert.ok(
    edges(j).some(
      (e) =>
        (e.a === `checklist:${list.id}` && e.b === `entry:${tick.entryId}`) ||
        (e.b === `checklist:${list.id}` && e.a === `entry:${tick.entryId}`),
    ),
  );
});

test("two posts ticking different steps at once both keep their tick (merge commutative, idempotent)", () => {
  let base = newJournal("Merge");
  const t = findTemplate(base.ops, "builtin:ouverture-pc");
  base = stampJournal(
    undefined,
    journalSchema.parse({
      ...base,
      ops: startChecklist(base.ops, t, "PC", iso(Z("2026-09-26T08:00"))).ops,
    }),
    iso(Z("2026-09-26T08:00")),
    "PC",
  );
  const list = base.ops.checklists[0];
  const a = stampJournal(
    base,
    {
      ...base,
      ops: tickStep(base, list.id, list.steps[2].id, { author: "A" }).ops,
    },
    iso(Z("2026-09-26T08:05")),
    "A",
  );
  const b = stampJournal(
    base,
    {
      ...base,
      ops: tickStep(base, list.id, list.steps[4].id, { author: "B" }).ops,
    },
    iso(Z("2026-09-26T08:05")),
    "B",
  );
  const ab = mergeJournal(a, b);
  const ba = mergeJournal(b, a);
  assert.equal(ab.ops.checklistTicks.length, 2);
  assert.deepEqual(
    ab.ops.checklistTicks.map((x) => x.id).sort(),
    ba.ops.checklistTicks.map((x) => x.id).sort(),
  );
  assert.deepEqual(mergeJournal(ab, ab).ops, ab.ops);
  assert.deepEqual(
    mergeJournal(ab, a).ops.checklistTicks,
    ab.ops.checklistTicks,
  );
});

// ---------- Requests ----------

test("request state machine: transitions, journal entries, resource on arrival", () => {
  let j = newJournal("Demandes");
  const at = (w) => iso(Z(`2026-09-26T${w}`));
  const made = createRequest(
    j,
    {
      title: "Groupe électrogène 20 kVA",
      kind: "Matériel",
      quantity: 2,
      unit: "",
      requester: "Chef logistique",
      provider: "Canton",
      contact: "Centrale cantonale",
      destination: "PC Carouge",
      reason: "Alimentation de secours du PC",
      priority: "Important",
      requestedAt: at("09:00"),
      eta: at("10:00"),
      notes: "",
    },
    "PC",
  );
  j = made.journal;
  const request = () => j.ops.requests.find((r) => r.id === made.id);
  assert.equal(request().status, "Demandé");
  const first = j.entries.find((e) => e.id === request().entryId);
  assert.equal(current(first).type, "Demande");
  assert.equal(current(first).status, "À traiter");
  assert.equal(current(first).dueAt, at("10:00"));

  assert.ok(canMove("Demandé", "Accordé"));
  assert.ok(!canMove("Demandé", "Arrivé"));
  assert.throws(() => moveRequest(j, made.id, "Libéré", "PC"), /ne peut pas/);

  j = moveRequest(j, made.id, "Accordé", "PC", {
    at: at("09:10"),
    eta: at("10:30"),
  });
  j = moveRequest(j, made.id, "En route", "PC", { at: at("10:00") });
  assert.equal(request().status, "En route");
  assert.equal(request().eta, at("10:30"));
  // The request entry follows the new expected arrival.
  assert.equal(
    current(j.entries.find((e) => e.id === first.id)).dueAt,
    at("10:30"),
  );
  // ETA warning once exceeded.
  assert.ok(!requestLate(request(), Z("2026-09-26T10:29")));
  assert.ok(requestLate(request(), Z("2026-09-26T10:45")));
  assert.equal(lateMinutes(request(), Z("2026-09-26T10:45")), 15);

  j = moveRequest(j, made.id, "Arrivé", "PC", { at: at("10:50") });
  assert.ok(!requestLate(request(), Z("2026-09-26T11:00")));
  const resource = j.ops.resources.find((r) => r.id === request().resourceId);
  assert.equal(resource.name, "Groupe électrogène 20 kVA");
  assert.equal(resource.count, 2);
  assert.equal(resource.organization, "Canton");
  assert.equal(resource.status, "Disponible");
  // The request entry is closed, every move is in the journal.
  assert.equal(
    current(j.entries.find((e) => e.id === first.id)).status,
    "Terminé",
  );
  assert.deepEqual(
    request().steps.map((s) => s.status),
    ["Demandé", "Accordé", "En route", "Arrivé"],
  );
  assert.equal(j.entries.length, 4);
  assert.ok(
    j.entries.slice(1).every((e) => current(e).reference.includes("#001")),
  );
  j = moveRequest(j, made.id, "Libéré", "PC", { at: at("18:00") });
  assert.equal(
    j.ops.resources.find((r) => r.id === resource.id).status,
    "De retour",
  );
});

// ---------- Presences ----------

test("duty time counts real hours across the autumn change of hour (DST)", () => {
  const rules = { dutyHours: 12, restHours: 8 };
  const who = { memberId: "", name: "Sgt A" };
  // 25 October 2026: clocks go back at 03:00. 00:00 → 12:00 is 13 hours.
  const autumn = dutyOf(
    [{ in: fromZurichInput("2026-10-25T00:00"), out: "" }],
    Z("2026-10-25T12:00"),
    rules,
    who,
  );
  assert.equal(autumn.span, 13 * HOUR);
  assert.ok(autumn.over);
  assert.match(autumn.warnings[0], /13 h 00/);
  // 29 March 2026: clocks go forward at 02:00. 00:00 → 12:00 is 11 hours.
  const spring = dutyOf(
    [{ in: fromZurichInput("2026-03-29T00:00"), out: "" }],
    Z("2026-03-29T12:00"),
    rules,
    who,
  );
  assert.equal(spring.span, 11 * HOUR);
  assert.ok(!spring.over);
});

test("a rest shorter than the minimum does not reset the duty counter and is reported", () => {
  const rules = { dutyHours: 12, restHours: 8 };
  const who = { memberId: "", name: "Cpl B" };
  const d = dutyOf(
    [
      {
        in: fromZurichInput("2026-09-25T20:00"),
        out: fromZurichInput("2026-09-26T02:00"),
      },
      { in: fromZurichInput("2026-09-26T06:00"), out: "" },
    ],
    Z("2026-09-26T09:00"),
    rules,
    who,
  );
  assert.equal(d.since, Z("2026-09-25T20:00"));
  assert.equal(d.span, 13 * HOUR);
  assert.equal(d.worked, 9 * HOUR);
  assert.ok(d.over);
  assert.deepEqual(d.shortRest, { gap: 4 * HOUR, back: Z("2026-09-26T06:00") });
  assert.equal(d.warnings.length, 2);
  // A full rest starts a new period.
  const rested = dutyOf(
    [
      {
        in: fromZurichInput("2026-09-25T20:00"),
        out: fromZurichInput("2026-09-26T02:00"),
      },
      { in: fromZurichInput("2026-09-26T11:00"), out: "" },
    ],
    Z("2026-09-26T12:00"),
    rules,
    who,
  );
  assert.equal(rested.span, HOUR);
  assert.deepEqual(rested.warnings, []);
});

test("check-in and check-out through the team, with configurable rules", () => {
  let j = newJournal("Présences");
  j = journalSchema.parse({
    ...j,
    ops: upsert(
      j.ops,
      "members",
      {
        name: "Fictif A",
        grade: "Sgt",
        role: "",
        cellId: "",
        callsign: "",
        phone: "",
        email: "",
        status: "Absent",
        from: "",
        to: "",
        notes: "",
      },
      "PC",
    ),
  });
  const m = j.ops.members[0];
  let ops = checkIn(j.ops, m, "PC", fromZurichInput("2026-09-26T06:00"), "QR");
  assert.equal(ops.members[0].status, "Présent");
  // Checking in twice keeps one open stay.
  assert.equal(checkIn(ops, m, "PC").presences.length, 1);
  let board = dutyBoard(ops, Z("2026-09-26T16:00"));
  assert.equal(board[0].present, true);
  assert.equal(board[0].over, false);
  ops = {
    ...ops,
    settings: { ...ops.settings, presence: { dutyHours: 8, restHours: 8 } },
  };
  board = dutyBoard(ops, Z("2026-09-26T16:00"));
  assert.equal(board[0].over, true);
  ops = checkOut(ops, m.id, "PC", fromZurichInput("2026-09-26T16:30"));
  assert.equal(ops.presences[0].out, fromZurichInput("2026-09-26T16:30"));
  assert.equal(ops.members[0].status, "Relevé");
  board = dutyBoard(ops, Z("2026-09-26T18:00"));
  assert.equal(board[0].present, false);
  assert.equal(board[0].resting, 1.5 * HOUR);
});

test("shift plans follow the Zurich wall clock and warn on long duty or short rest", () => {
  // Three 12 h shifts from 08:00 on the day clocks go back.
  const plan = planShifts(Z("2026-10-24T20:00"), 12, 3, "Relève");
  assert.deepEqual(
    plan.map((s) => toZurichInput(s.start)),
    ["2026-10-24T20:00", "2026-10-25T08:00", "2026-10-25T20:00"],
  );
  // The night shift across the change lasts 13 real hours.
  assert.equal(Date.parse(plan[0].end) - Date.parse(plan[0].start), 13 * HOUR);
  const members = [{ id: "11111111-1111-4111-8111-111111111111", name: "A" }];
  const shifts = plan.map((s, i) => ({
    ...s,
    id: `s${i}`,
    memberIds: i !== 1 ? [members[0].id] : [],
  }));
  const warnings = shiftWarnings(shifts, members, {
    dutyHours: 12,
    restHours: 8,
  });
  // Night shift of 13 h is too long; 12 h rest before the third is fine.
  assert.equal(warnings.length, 1);
  assert.match(warnings[0].text, /13 h 00/);
  const back = shiftWarnings(
    [
      {
        id: "a",
        title: "Jour",
        start: fromZurichInput("2026-09-26T08:00"),
        end: fromZurichInput("2026-09-26T14:00"),
        memberIds: [members[0].id],
      },
      {
        id: "b",
        title: "Soir",
        start: fromZurichInput("2026-09-26T18:00"),
        end: fromZurichInput("2026-09-26T22:00"),
        memberIds: [members[0].id],
      },
    ],
    members,
    { dutyHours: 12, restHours: 8 },
  );
  // 4 h of rest only, and 08:00–22:00 counts as 14 h in a row.
  assert.equal(back.length, 2);
  assert.match(back[0].text, /repos de 4 h 00/);
  assert.match(back[1].text, /14 h 00 de service/);
});

// ---------- Point de situation ----------

test("the point de situation gathers facts, resources, open missions, lists, requests and weather", () => {
  let j = newJournal("Point");
  j = { ...j, createdAt: fromZurichInput("2026-09-26T06:00") };
  let ops = j.ops;
  ops = upsert(
    ops,
    "facts",
    {
      label: "Personnes évacuées",
      value: "12",
      unit: "pers.",
      category: "Personnes",
      note: "",
      order: 0,
    },
    "PC",
  );
  ops = upsert(
    ops,
    "boards",
    {
      title: "Situation générale",
      body: "Crue de l’Arve, niveau en hausse.",
      order: 0,
    },
    "PC",
  );
  ops = upsert(
    ops,
    "resources",
    {
      name: "Équipe Bravo",
      kind: "Personnel",
      organization: "PCi",
      callsign: "",
      count: 6,
      status: "Engagé",
      location: "Pont des Acacias",
      mission: "Barrage",
      eta: "",
      contact: "",
      notes: "",
    },
    "PC",
  );
  ops = upsert(
    ops,
    "agenda",
    {
      at: fromZurichInput("2026-09-26T08:00"),
      minutes: 30,
      title: "Rapport de conduite",
      kind: "Rapport de conduite",
      location: "",
      participants: "",
      notes: "",
      done: true,
    },
    "PC",
  );
  ops = upsert(
    ops,
    "agenda",
    {
      at: fromZurichInput("2026-09-26T12:00"),
      minutes: 30,
      title: "Rapport de conduite",
      kind: "Rapport de conduite",
      location: "Salle",
      participants: "",
      notes: "",
      done: false,
    },
    "PC",
  );
  const t = findTemplate(ops, "builtin:crue");
  ops = startChecklist(ops, t, "PC", fromZurichInput("2026-09-26T07:00")).ops;
  j = journalSchema.parse({ ...j, ops });
  j = tickStep(j, j.ops.checklists[0].id, t.steps[1].id, {
    author: "PC",
    at: fromZurichInput("2026-09-26T08:30"),
  });
  j = createRequest(
    j,
    {
      title: "Motopompe",
      kind: "Matériel",
      quantity: 4,
      unit: "",
      requester: "",
      provider: "SIS",
      contact: "",
      destination: "",
      reason: "",
      priority: "Normal",
      requestedAt: fromZurichInput("2026-09-26T09:00"),
      eta: fromZurichInput("2026-09-26T10:00"),
      notes: "",
    },
    "PC",
  ).journal;
  j = addEntry(
    j,
    {
      ...emptyFields(),
      type: "Décision",
      message: "Fermer la passerelle.",
      happenedAt: fromZurichInput("2026-09-26T09:30"),
      receivedAt: fromZurichInput("2026-09-26T09:30"),
    },
    "PC",
  );
  j = addEntry(
    j,
    {
      ...emptyFields(),
      type: "Mission",
      status: "À traiter",
      message: "Poser des barrières",
      dueAt: fromZurichInput("2026-09-26T10:30"),
    },
    "PC",
  );
  // Recorded when they happened (the fixture is built now).
  j = {
    ...j,
    entries: j.entries.map((e) => ({ ...e, createdAt: current(e).happenedAt })),
  };
  const at = Z("2026-09-26T11:30");
  assert.equal(lastReportTime(j, at), Z("2026-09-26T08:00"));
  const point = composeSituationPoint(j, {
    at,
    since: Date.parse(j.createdAt),
  });
  const text = pointText(point);
  const section = (id) => point.sections.find((s) => s.id === id).text;
  assert.match(section("general"), /Crue de l’Arve/);
  assert.match(section("facts"), /Personnes évacuées : 12 pers\./);
  assert.match(section("resources"), /Équipe Bravo \(6\) · Pont des Acacias/);
  assert.match(section("missions"), /Poser des barrières.*en retard/);
  assert.match(section("checklists"), /Crue \/ inondation : 1\/12 étapes/);
  assert.match(
    section("requests"),
    /4 × Motopompe \(SIS\) · demandé.*retard 1 h 30/,
  );
  assert.match(section("since"), /Fermer la passerelle/);
  assert.match(section("next"), /Rapport de conduite à 12:00 · Salle/);
  assert.match(text, /^Point de situation de 11:30/);
});

// ---------- Handover summary ----------

test("the handover summary is computed from the history of the journal", () => {
  const at = (w) => fromZurichInput(`2026-09-26T${w}`);
  let j = stampJournal(
    undefined,
    { ...newJournal("Relève"), createdAt: at("06:00") },
    at("06:00"),
    "A",
  );
  const step = (next, when, by = "A") =>
    (j = stampJournal(j, journalSchema.parse(next), at(when), by));
  step(
    addEntry(
      j,
      { ...emptyFields(), type: "Renseignement", message: "Arve en hausse" },
      "A",
    ),
    "07:00",
  );
  step(
    {
      ...j,
      ops: upsert(
        j.ops,
        "resources",
        {
          name: "Tonne-pompe",
          kind: "Véhicule",
          organization: "SIS",
          callsign: "",
          count: 1,
          status: "Alerté",
          location: "",
          mission: "",
          eta: "",
          contact: "",
          notes: "",
        },
        "A",
      ),
    },
    "07:10",
  );
  const pump = j.ops.resources[0];
  // Handover at 08:00: everything after counts.
  step(
    addEntry(j, { ...emptyFields(), type: "Relève", message: "Relève" }, "A"),
    "08:00",
  );
  j = {
    ...j,
    entries: j.entries.map((e, i) =>
      i === 1
        ? { ...e, createdAt: at("08:00") }
        : i === 0
          ? { ...e, createdAt: at("07:00") }
          : e,
    ),
  };
  step(
    {
      ...j,
      ops: upsert(j.ops, "resources", { ...pump, status: "Engagé" }, "B"),
    },
    "08:30",
    "B",
  );
  step(
    addEntry(
      j,
      { ...emptyFields(), type: "Décision", message: "Évacuer le camping" },
      "B",
    ),
    "08:40",
    "B",
  );
  step(
    addEntry(
      j,
      {
        ...emptyFields(),
        type: "Mission",
        status: "À traiter",
        message: "Fermer la passerelle",
        assignee: "Équipe Bravo",
        dueAt: at("09:00"),
      },
      "B",
    ),
    "08:45",
    "B",
  );
  step(
    {
      ...j,
      ops: upsert(
        j.ops,
        "messages",
        {
          receivedAt: at("08:50"),
          from: "Police",
          to: "PC",
          via: "Radio",
          priority: "Normal",
          category: "",
          subject: "Route fermée",
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
        "B",
      ),
    },
    "08:50",
    "B",
  );
  const msg = j.ops.messages[0];
  step(
    { ...j, ops: upsert(j.ops, "messages", { ...msg, status: "Classé" }, "B") },
    "08:55",
    "B",
  );
  // Created times of the entries follow the stamps of the fixture.
  j = {
    ...j,
    entries: j.entries.map((e, i) => ({
      ...e,
      createdAt: [at("07:00"), at("08:00"), at("08:40"), at("08:45")][i],
      revisions: e.revisions.map((r) => ({
        ...r,
        at: [at("07:00"), at("08:00"), at("08:40"), at("08:45")][i],
      })),
    })),
  };
  const now = Z("2026-09-26T09:30");
  const since = defaultSince(j, now);
  assert.equal(since, Z("2026-09-26T08:00"));
  const s = handoverSummary(j, since, now);
  assert.deepEqual(s.entries, [
    { type: "Décision", count: 1 },
    { type: "Mission", count: 1 },
    { type: "Relève", count: 1 },
  ]);
  assert.equal(s.decisions.length, 1);
  assert.match(s.decisions[0].text, /Évacuer le camping/);
  assert.equal(s.missions.opened.length, 1);
  assert.deepEqual(
    s.resources.map((r) => r.text),
    ["Tonne-pompe : Alerté → Engagé"],
  );
  assert.deepEqual(s.messages, { received: 1, treated: 1, waiting: 0 });
  assert.equal(s.overdue.length, 1);
  assert.match(
    s.overdue[0].text,
    /Fermer la passerelle · Équipe Bravo · échéance 09:00/,
  );
  const text = summaryText(s);
  assert.match(text, /^Depuis 08:00 \(jusqu’à 09:30\) : 3 entrée\(s\)/);
  assert.match(text, /Moyens :\n– 08:30 Tonne-pompe : Alerté → Engagé/);
  assert.ok(summaryTables(s).length >= 4);
  // Same input, same summary.
  assert.deepEqual(handoverSummary(j, since, now), s);
});

// ---------- Weather thresholds ----------

const forecastAt = (fetched, hours) => ({
  id: crypto.randomUUID(),
  createdAt: iso(fetched),
  updatedAt: iso(fetched),
  by: "B",
  fetchedAt: iso(fetched),
  place: "Carouge (GE)",
  lat: 46.18,
  lng: 6.14,
  data: {
    model: "Test",
    current: {
      at: fetched,
      temperature: 10,
      humidity: 80,
      precipitation: 0,
      code: 3,
      wind: 10,
      direction: 200,
      gusts: 20,
    },
    hours: hours.map(([t, gusts, rain]) => ({
      at: t,
      temperature: 12,
      precipitation: rain,
      probability: 50,
      code: 63,
      wind: 20,
      gusts,
    })),
    days: [],
  },
});

const withThreshold = (j, extra = {}) =>
  journalSchema.parse({
    ...j,
    ops: upsert(
      j.ops,
      "thresholds",
      {
        id: "22222222-2222-4222-8222-222222222222",
        metric: "gusts",
        value: 60,
        level: "3",
        label: "",
        region: "",
        active: true,
        followUp: true,
        ...extra,
      },
      "PC",
    ),
  });

test("thresholds: crossings per Zurich day, alert and follow-up created once, deterministic keys", () => {
  const start = Z("2026-09-26T10:00");
  const f = forecastAt(start, [
    [Z("2026-09-26T09:00"), 90, 0], // past: ignored
    [Z("2026-09-26T14:00"), 55, 2],
    [Z("2026-09-26T15:00"), 72, 6],
    [Z("2026-09-26T16:00"), 65, 4],
    [Z("2026-09-27T03:00"), 61, 0],
  ]);
  const c = crossings({ metric: "gusts", value: 60 }, f.data, start);
  assert.deepEqual(
    c.map((x) => [x.day, toZurichInput(x.first), x.peak]),
    [
      ["2026-09-26", "2026-09-26T15:00", 72],
      ["2026-09-27", "2026-09-27T03:00", 61],
    ],
  );
  // Rain over 24 h is a running sum: still 12 mm at 03:00 the next day.
  const rain = crossings({ metric: "rain24h", value: 12 }, f.data, start);
  assert.deepEqual(
    rain.map((x) => [x.day, x.peak]),
    [
      ["2026-09-26", 12],
      ["2026-09-27", 12],
    ],
  );
  let j = withThreshold({
    ...newJournal("Seuils"),
    ops: { ...newJournal("x").ops, forecasts: [f] },
  });
  const t = j.ops.thresholds[0];
  assert.equal(alertKey(t.id, "2026-09-26"), `seuil|${t.id}|2026-09-26`);
  const once = applyThresholds(j, f, "PC", start);
  assert.equal(once.created.length, 2);
  const alert = once.journal.ops.alerts.find(
    (a) => a.id === alertIdFor(t.id, "2026-09-26"),
  );
  assert.ok(alert);
  assert.match(alert.notes, /Pic : 72 km\/h à 15:00/);
  const entry = once.journal.entries.find(
    (e) => e.id === entryIdFor(t.id, "2026-09-26"),
  );
  assert.equal(current(entry).status, "À traiter");
  // Again: nothing new.
  const twice = applyThresholds(once.journal, f, "PC", start + 60_000);
  assert.equal(twice.created.length, 0);
  assert.equal(twice.journal, once.journal);
  // An alert removed by an operator is not recreated.
  const removed = {
    ...once.journal,
    ops: { ...once.journal.ops, alerts: [] },
    sync: { ...once.journal.sync, removed: { [alert.id]: iso(start + 5000) } },
  };
  assert.equal(
    applyThresholds(removed, f, "PC", start).journal.ops.alerts.filter(
      (a) => a.id === alert.id,
    ).length,
    0,
  );
});

test("two posts crossing the same threshold create one alert and one entry after merging", () => {
  const start = Z("2026-09-26T10:00");
  const f = forecastAt(start, [[Z("2026-09-26T15:00"), 80, 0]]);
  let base = withThreshold({
    ...newJournal("Seuils"),
    ops: { ...newJournal("x").ops, forecasts: [f] },
  });
  base = stampJournal(undefined, base, iso(start), "PC");
  const a = stampJournal(
    base,
    applyThresholds(base, f, "A", start).journal,
    iso(start + 1000),
    "A",
  );
  const b = stampJournal(
    base,
    applyThresholds(base, f, "B", start + 5000).journal,
    iso(start + 2000),
    "B",
  );
  const ab = mergeJournal(a, b);
  const ba = mergeJournal(b, a);
  for (const m of [ab, ba]) {
    assert.equal(m.ops.alerts.length, 1);
    assert.equal(m.entries.length, 1);
    assert.equal(m.ops.links.length, 1);
  }
  assert.deepEqual(ab.ops.alerts, ba.ops.alerts);
  assert.deepEqual(
    ab.entries.map((e) => e.id),
    ba.entries.map((e) => e.id),
  );
  assert.deepEqual(mergeJournal(ab, ab).ops, ab.ops);
});

// ---------- Merge of the new collections ----------

test("new collections merge commutatively and idempotently", () => {
  const t0 = Z("2026-09-26T08:00");
  let base = stampJournal(undefined, newJournal("Collections"), iso(t0), "PC");
  const put = (j, c, v, by, when) =>
    stampJournal(
      j,
      journalSchema.parse({ ...j, ops: upsert(j.ops, c, v, by) }),
      iso(when),
      by,
    );
  const a = put(
    put(
      base,
      "shifts",
      {
        title: "Jour",
        start: iso(t0),
        end: iso(t0 + 12 * HOUR),
        memberIds: [],
        people: "A, B",
        notes: "",
      },
      "A",
      t0 + 1000,
    ),
    "reminders",
    {
      title: "Exporter",
      action: "export",
      every: 120,
      before: 0,
      active: true,
      doneAt: "",
      notes: "",
    },
    "A",
    t0 + 2000,
  );
  const b = put(
    put(
      base,
      "presences",
      {
        memberId: "",
        name: "Fictif",
        in: iso(t0),
        out: "",
        via: "QR",
        note: "",
      },
      "B",
      t0 + 1500,
    ),
    "thresholds",
    {
      metric: "tmax",
      value: 32,
      level: "3",
      label: "",
      region: "",
      active: true,
      followUp: false,
    },
    "B",
    t0 + 2500,
  );
  const ab = mergeJournal(a, b);
  const ba = mergeJournal(b, a);
  for (const c of ["shifts", "reminders", "presences", "thresholds"]) {
    assert.equal(ab.ops[c].length, 1, c);
    assert.deepEqual(ab.ops[c], ba.ops[c], c);
  }
  assert.deepEqual(mergeJournal(ab, b).ops, ab.ops);
  assert.deepEqual(mergeJournal(mergeJournal(a, b), ab).ops, ab.ops);
  // Concurrent edits of the same request: the later stamp wins on both sides.
  let r = createRequest(
    base,
    {
      title: "Bâches",
      kind: "",
      quantity: 10,
      unit: "pce",
      requester: "",
      provider: "",
      contact: "",
      destination: "",
      reason: "",
      priority: "Normal",
      requestedAt: iso(t0),
      eta: "",
      notes: "",
    },
    "PC",
    { log: false },
  );
  const withRequest = stampJournal(base, r.journal, iso(t0 + 100), "PC");
  const x = stampJournal(
    withRequest,
    moveRequest(withRequest, r.id, "Accordé", "A", { log: false }),
    iso(t0 + 3000),
    "A",
  );
  const y = stampJournal(
    withRequest,
    moveRequest(withRequest, r.id, "Refusé", "B", { log: false }),
    iso(t0 + 4000),
    "B",
  );
  assert.deepEqual(
    mergeJournal(x, y).ops.requests,
    mergeJournal(y, x).ops.requests,
  );
  assert.equal(mergeJournal(x, y).ops.requests[0].status, "Refusé");
});

// ---------- Reminders ----------

test("reminders: periodic export and before each report, satisfied by the export log", () => {
  const t0 = Z("2026-09-26T08:00");
  let ops = newJournal("R").ops;
  ops = upsert(
    ops,
    "reminders",
    {
      id: "33333333-3333-4333-8333-333333333333",
      createdAt: iso(t0),
      title: "Exporter",
      action: "export",
      every: 120,
      before: 0,
      active: true,
      doneAt: "",
      notes: "",
    },
    "PC",
  );
  ops = {
    ...ops,
    reminders: ops.reminders.map((r) => ({ ...r, createdAt: iso(t0) })),
  };
  ops = upsert(
    ops,
    "reminders",
    {
      title: "Imprimer",
      action: "print",
      every: 0,
      before: 30,
      active: true,
      doneAt: "",
      notes: "",
    },
    "PC",
  );
  ops = upsert(
    ops,
    "agenda",
    {
      at: iso(Z("2026-09-26T12:00")),
      minutes: 30,
      title: "Rapport de conduite",
      kind: "Rapport de conduite",
      location: "",
      participants: "",
      notes: "",
      done: false,
    },
    "PC",
  );
  assert.deepEqual(dueReminders(ops, Z("2026-09-26T09:59")), []);
  let due = dueReminders(ops, Z("2026-09-26T10:05"));
  assert.equal(due.length, 1);
  assert.equal(due[0].dueAt, Z("2026-09-26T10:00"));
  // An export after the due time satisfies it; a print does not.
  const log = (at, format) =>
    upsert(
      ops,
      "exports",
      {
        at: iso(at),
        format,
        scope: "",
        viewAt: "",
        name: "x",
        sha256: "0".repeat(64),
        bytes: 1,
        fingerprint: "",
      },
      "PC",
    );
  assert.equal(
    dueReminders(
      log(Z("2026-09-26T10:03"), "Impression (HTML)"),
      Z("2026-09-26T10:05"),
    ).length,
    1,
  );
  ops = log(Z("2026-09-26T10:03"), "Archive orion aic");
  assert.equal(dueReminders(ops, Z("2026-09-26T10:05")).length, 0);
  // Before the report: from 11:30 on, until printed.
  due = dueReminders(ops, Z("2026-09-26T11:35"));
  assert.deepEqual(
    due.map((d) => d.reminder.title),
    ["Imprimer"],
  );
  assert.match(due[0].reason, /avant « Rapport de conduite » de 12:00/);
  assert.equal(
    dueReminders(
      log(Z("2026-09-26T11:40"), "Impression (HTML)"),
      Z("2026-09-26T11:45"),
    ).filter((d) => d.reminder.title === "Imprimer").length,
    0,
  );
  assert.equal(
    nextDue(ops.reminders[0], ops.agenda, Z("2026-09-26T10:05")),
    Z("2026-09-26T12:00"),
  );
});
