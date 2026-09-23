import test from "node:test";
import assert from "node:assert/strict";
import {
  archive,
  journalSchema,
  mergeJournals,
  newJournal,
  parseArchive,
  planMerge,
  updateRadio,
} from "../shared/journal.ts";
import {
  activeAssignment,
  emptyRadio,
  issueTerminal,
  planRadioMerge,
  radioSchema,
  radioSummary,
  stationStatus,
  removeTalkgroup,
  removeTerminal,
  returnTerminal,
  terminalSeries,
  terminalState,
} from "../shared/radio.ts";

const group = (name = "PCI CONDUITE") => ({
  id: crypto.randomUUID(),
  name,
  number: "",
  usage: "Conduite",
  mode: "Groupe",
  notes: "",
});
const handout = (holder = "Sgt Fictif", callsign = "Chef sct 1") => ({
  holder,
  callsign,
  role: "Chef de section",
  unit: "Section 1",
  accessories: "Micro-haut-parleur",
  battery: "Pleine",
  issuedAt: "2026-09-23T08:00:00+02:00",
  issuedBy: "Poste radio",
  notes: "",
});
const stocked = () =>
  terminalSeries(emptyRadio(), "R-", 1, 3, {
    kind: "Portatif",
    model: "TPH700",
  });

test("journals without a radio plan still load and gain an empty plan", () => {
  const legacy = { ...newJournal("Ancien") };
  delete legacy.radio;
  const parsed = journalSchema.parse(legacy);
  assert.deepEqual(parsed.radio, emptyRadio());
  const roundtrip = parseArchive(JSON.parse(JSON.stringify(archive(parsed))));
  assert.deepEqual(roundtrip.journal, parsed);
});

test("terminal series skips labels already in use and pads numbers", () => {
  const radio = terminalSeries(stocked(), "R-", 2, 3, {
    kind: "Portatif",
    model: "TPH700",
  });
  assert.deepEqual(
    radio.terminals.map((t) => t.label),
    ["R-01", "R-02", "R-03", "R-04"],
  );
  assert.throws(() =>
    terminalSeries(radio, "R-", 1, 0, { kind: "Portatif", model: "" }),
  );
});

test("issue and return keep a full custody history per terminal", () => {
  const g = group();
  let radio = { ...stocked(), talkgroups: [g] };
  const id = radio.terminals[0].id;
  radio = issueTerminal(radio, id, handout("Sgt A"));
  assert.equal(stationStatus(radio, " chef  SCT 1").terminal.label, "R-01");
  assert.equal(terminalState(radio.terminals[0]), "En service");
  assert.throws(() => issueTerminal(radio, id, handout("Sgt B")), /déjà remis/);
  assert.throws(
    () =>
      returnTerminal(
        radio,
        id,
        "2026-09-23T07:00:00+02:00",
        "Poste",
        "Opérationnel",
      ),
    /précède/,
  );
  radio = returnTerminal(
    radio,
    id,
    "2026-09-23T12:00:00+02:00",
    "Poste",
    "À recharger",
  );
  assert.equal(activeAssignment(radio.terminals[0]), undefined);
  assert.equal(terminalState(radio.terminals[0]), "À recharger");
  radio = issueTerminal(radio, id, handout("Sgt B"));
  assert.equal(radio.terminals[0].assignments.length, 2);
  assert.equal(radio.terminals[0].assignments[0].holder, "Sgt A");
  assert.equal(radioSummary(radio).issued, 1);
  assert.throws(() => removeTerminal(radio, id), /historique/);
});

test("defective terminals cannot be issued", () => {
  const radio = stocked();
  radio.terminals[1].condition = "Défectueux";
  assert.throws(
    () => issueTerminal(radio, radio.terminals[1].id, handout()),
    /défectueux/,
  );
});

test("the plan rejects dangling talkgroups and duplicate terminal numbers", () => {
  const radio = stocked();
  assert.equal(
    radioSchema.safeParse({
      ...radio,
      terminals: [
        ...radio.terminals,
        { ...radio.terminals[0], id: crypto.randomUUID(), label: "r-01" },
      ],
    }).success,
    false,
  );
  assert.equal(
    radioSchema.safeParse({
      ...radio,
      checks: [
        {
          id: crypto.randomUUID(),
          at: "2026-09-23T08:00:00+02:00",
          by: "Poste",
          callsign: "ALPHA 1",
          talkgroupId: crypto.randomUUID(),
          result: "3",
          notes: "",
        },
      ],
    }).success,
    false,
  );
});

test("talkgroups used by radio checks stay in the plan; others detach from stations", () => {
  const used = group(),
    spare = group("RESERVE");
  let radio = { ...stocked(), talkgroups: [used, spare] };
  radio.checks = [
    {
      id: crypto.randomUUID(),
      at: "2026-09-23T08:00:00+02:00",
      by: "Poste",
      callsign: "Chef sct 1",
      talkgroupId: used.id,
      result: "3",
      notes: "",
    },
  ];
  radio.stations = [
    {
      id: crypto.randomUUID(),
      callsign: "Chef sct 1",
      role: "",
      unit: "",
      primary: used.id,
      fallback: spare.id,
      notes: "",
    },
  ];
  assert.equal(stationStatus(radio, "CHEF SCT 1").check.result, "3");
  assert.throws(() => removeTalkgroup(radio, used.id), /reste au plan/);
  radio = removeTalkgroup(radio, spare.id);
  assert.equal(radio.stations[0].fallback, "");
  assert.equal(
    radioSchema.safeParse({
      ...radio,
      stations: [
        ...radio.stations,
        {
          ...radio.stations[0],
          id: crypto.randomUUID(),
          callsign: "chef SCT 1",
        },
      ],
    }).success,
    false,
  );
});

test("a return recorded on another post completes the same handout on merge", () => {
  const base = stocked();
  const id = base.terminals[0].id;
  const issued = issueTerminal(base, id, handout());
  const returned = returnTerminal(
    issued,
    id,
    "2026-09-23T10:00:00+02:00",
    "Poste B",
    "Opérationnel",
  );
  const plan = planRadioMerge(issued, returned);
  assert.equal(plan.conflicts, 0);
  assert.equal(plan.updated, 1);
  assert.equal(plan.radio.terminals[0].assignments[0].returnedBy, "Poste B");
  assert.deepEqual(planRadioMerge(returned, issued).radio, returned);
});

test("divergent terminal records block the journal merge", () => {
  const base = stocked();
  const id = base.terminals[0].id;
  const one = issueTerminal(base, id, handout("Sgt A"));
  const two = issueTerminal(base, id, handout("Sgt B"));
  let target = updateRadio(newJournal("Poste A"), one);
  const incoming = { ...target, radio: two };
  assert.equal(planMerge(target, incoming).radio.conflicts, 1);
  assert.throws(() => mergeJournals(target, incoming), /divergent/);
  target = updateRadio(target, base);
  const merged = mergeJournals(target, { ...target, radio: one });
  assert.equal(merged.radio.terminals[0].assignments[0].holder, "Sgt A");
});

test("closed journals keep their radio plan read-only", () => {
  const closed = { ...newJournal("Clos"), closedAt: new Date().toISOString() };
  assert.throws(() => updateRadio(closed, stocked()), /clôturé/);
});
