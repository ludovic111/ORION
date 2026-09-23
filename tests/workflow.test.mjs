import test from "node:test";
import assert from "node:assert/strict";
import {
  addEntry,
  current,
  emptyFields,
  newJournal,
  reviseEntry,
  updateRadio,
} from "../shared/journal.ts";
import {
  TEMPLATES,
  applyTemplate,
  closableBy,
  referencedNumbers,
  snooze,
  thread,
} from "../shared/workflow.ts";
import {
  batteryDue,
  emptyRadio,
  findTerminal,
  issueTerminal,
  scannedLabel,
  terminalSeries,
  terminalUrl,
} from "../shared/radio.ts";
import { situationReport } from "../src/print/report.ts";
import { handoutSheet, messageSheet } from "../src/print/sheet.ts";
import { qrMatrix } from "../src/print/qr.ts";

const fields = (message, extra = {}) => ({
  ...emptyFields(),
  message,
  ...extra,
});
const journal = () => {
  let j = newJournal("Fil fictif");
  j = addEntry(
    j,
    fields("Mission : fermer l’accès", {
      type: "Mission",
      status: "À traiter",
    }),
    "PC",
  );
  j = addEntry(
    j,
    fields("Question sur la mission", { reference: "Suite de #001" }),
    "PC",
  );
  j = addEntry(j, fields("Sans lien"), "PC");
  return j;
};

test("references are read from the reference field in any common form", () => {
  assert.deepEqual(
    referencedNumbers({ reference: "Suite de #003, voir #12 et # 4" }),
    [3, 12, 4],
  );
  assert.deepEqual(
    referencedNumbers({ reference: "Suite de l’entrée #003 #003" }),
    [3],
  );
  assert.deepEqual(referencedNumbers({ reference: "Réf. 2026-09 #0" }), []);
});

test("a thread follows references in both directions and transitively", () => {
  let j = journal();
  j = addEntry(
    j,
    fields("Quittance", { type: "Quittance", reference: "#002" }),
    "PC",
  );
  const [mission, question, alone, receipt] = j.entries;
  assert.deepEqual(
    thread(j.entries, receipt).map((e) => e.number),
    [1, 2, 4],
  );
  assert.deepEqual(
    thread(j.entries, mission).map((e) => e.id),
    [mission.id, question.id, receipt.id],
  );
  assert.deepEqual(thread(j.entries, alone), []);
});

test("a quittance offers to close only the open entries it cites", () => {
  const j = journal();
  const receipt = fields("Accès fermé", {
    type: "Quittance",
    reference: "Suite de #001, #003",
  });
  assert.deepEqual(
    closableBy(j, receipt).map((e) => e.number),
    [1],
  );
  assert.deepEqual(closableBy(j, { ...receipt, type: "Renseignement" }), []);
  const done = reviseEntry(
    j,
    j.entries[0].id,
    { ...current(j.entries[0]), status: "Terminé" },
    "PC",
    "Fait",
  );
  assert.deepEqual(closableBy(done, receipt), []);
});

test("snooze pushes the deadline from now or from a later deadline", () => {
  const at = Date.parse("2026-09-23T10:00:00Z");
  assert.equal(snooze("", 15, at), "2026-09-23T10:15:00.000Z");
  assert.equal(
    snooze("2026-09-23T09:00:00Z", 15, at),
    "2026-09-23T10:15:00.000Z",
  );
  assert.equal(
    snooze("2026-09-23T11:00:00Z", 15, at),
    "2026-09-23T11:15:00.000Z",
  );
});

test("templates fill the fields they define and keep the rest", () => {
  const base = fields("", { source: "Patrouille Alpha", tags: ["crue"] });
  const request = applyTemplate(
    base,
    TEMPLATES.find((t) => t.id === "request"),
  );
  assert.equal(request.type, "Demande");
  assert.equal(request.status, "À traiter");
  assert.equal(request.source, "Patrouille Alpha");
  assert.match(request.message, /Moyens : /);
  const check = applyTemplate(
    base,
    TEMPLATES.find((t) => t.id === "check"),
  );
  assert.deepEqual(check.tags, ["crue", "radio"]);
});

test("batteries are due after eight hours in service; QR labels resolve to terminals", () => {
  let radio = terminalSeries(emptyRadio(), "R-", 1, 2, {
    kind: "Portatif",
    model: "TPH900",
  });
  radio = issueTerminal(radio, radio.terminals[0].id, {
    holder: "Sgt Fictif",
    callsign: "PC front",
    role: "",
    unit: "",
    accessories: "Microtel, Chargeur",
    battery: "Pleine",
    issuedAt: "2026-09-23T08:00:00Z",
    issuedBy: "PC",
    notes: "",
  });
  const [issued, spare] = radio.terminals;
  assert.equal(batteryDue(issued, Date.parse("2026-09-23T15:59:00Z")), false);
  assert.equal(batteryDue(issued, Date.parse("2026-09-23T16:00:00Z")), true);
  assert.equal(batteryDue(spare, Date.parse("2026-09-24T00:00:00Z")), false);
  const url = terminalUrl("https://orion.example", issued);
  assert.equal(url, "https://orion.example/#scan=R-01");
  assert.equal(scannedLabel(url), "R-01");
  assert.equal(findTerminal(radio, url).id, issued.id);
  assert.equal(findTerminal(radio, " r-02 ").id, spare.id);
  assert.equal(findTerminal(radio, "R-99"), undefined);
  assert.ok(qrMatrix(url).length >= 21);
  const sheet = handoutSheet(issued, issued.assignments[0], radio);
  assert.equal(sheet.number, "R-01");
  assert.match(JSON.stringify(sheet), /\[  \] Microtel/);
});

test("the situation report covers the period and lists open points at its end", () => {
  let j = journal();
  j = updateRadio(
    j,
    terminalSeries(emptyRadio(), "R-", 1, 1, { kind: "Portatif", model: "" }),
  );
  const at = (e) => current(e).happenedAt;
  const tables = situationReport(j, {
    from: at(j.entries[0]),
    to: new Date(Date.parse(at(j.entries[2])) + 1000).toISOString(),
    chronology: true,
  });
  const byId = Object.fromEntries(tables.map((t) => [t.id, t]));
  assert.equal(byId.summary.body[0][1], "3");
  assert.equal(byId.decisions.body.length, 1);
  assert.equal(byId.open.body.length, 1);
  assert.equal(byId.chronology.body.length, 3);
  assert.throws(
    () =>
      situationReport(j, {
        from: at(j.entries[2]),
        to:
          at(j.entries[0]) === at(j.entries[2])
            ? "2000-01-01T00:00:00Z"
            : at(j.entries[0]),
        chronology: false,
      }),
    /invalide/,
  );
  assert.equal(messageSheet(j.entries[1]).boxes[0].value, "Renseignement");
});
