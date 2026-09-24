import test from "node:test";
import assert from "node:assert/strict";
import { journalSchema, parseArchive, archive } from "../shared/journal.ts";
import { fullScope } from "../src/export/scope.ts";
import {
  archiveJournal,
  buildDossier,
  changeDetail,
  resolveScope,
  sectionCount,
  sectionItems,
  tablesOf,
} from "../src/export/dossier.ts";
import {
  autoWatermark,
  fingerprintOf,
  makeStamp,
  matchVerify,
  parseVerify,
  registerScope,
} from "../src/export/stamp.ts";
import { at, operation } from "./export-fixture.mjs";

const { journal, ids } = operation();
const table = (dossier, id) =>
  tablesOf(dossier).find((t) => t.table.id === id)?.table;

test("the dossier of the whole operation has one chapter per part, in order", async () => {
  const d = await buildDossier(journal, fullScope(), {
    author: "Test",
    versions: true,
  });
  assert.equal(d.chapters.length, 13);
  assert.deepEqual(
    d.chapters.map((c) => c.number),
    Array.from({ length: 13 }, (_, i) => i + 1),
  );
  assert.equal(d.cover.shown, "État actuel");
  assert.equal(d.cover.classification, "Confidentiel");
  assert.match(d.cover.scope, /Opération complète/);
  const entries = table(d, "entries");
  assert.equal(entries.rows.length, 2);
  assert.equal(entries.compact.rows.length, entries.rows.length);
  assert.equal(entries.columns.length, entries.rows[0].length);
  // Versions and deletions.
  const versions = table(d, "versions");
  assert.equal(versions.rows.length, 3);
  assert.ok(
    versions.rows.some((r) => /État : À traiter → En cours/.test(r[5])),
  );
  assert.equal(table(d, "deleted").rows[0][3], "Doublon");
  // Resources: summary and state.
  const resources = d.chapters.find((c) => c.id === "resources");
  assert.match(resources.summary, /2 moyens · 1 engagé/);
  // Missions: overdue at the time shown.
  const missions = table(d, "missions");
  assert.equal(missions.rows.length, 1);
  assert.equal(missions.rows[0][8], "EN RETARD");
  // One map block per map, objects filtered by map.
  const maps = d.chapters
    .find((c) => c.id === "map")
    .blocks.filter((b) => b.kind === "map");
  assert.deepEqual(
    maps.map((m) => [m.mapId, m.objects]),
    [
      [ids.map1, 0],
      [ids.map2, 1],
    ],
  );
  // Weather: forecast text and days (its hours are past now).
  assert.equal(table(d, "forecast-days").rows.length, 1);
  assert.equal(table(d, "forecast-hours"), undefined);
  assert.match(
    d.chapters.find((c) => c.id === "weather").blocks[0].body,
    /Pluie, 11,2 °C/,
  );
  // Trace: chronological, with the change of state in the details.
  const trail = table(d, "trail");
  assert.ok(trail.rows.length > 5);
  assert.ok(
    trail.rows.some(
      (r) => r[1] === "Bob" && /État : Disponible → Engagé/.test(r[5]),
    ),
  );
  // Every table is rectangular.
  for (const { table: t } of tablesOf(d)) {
    for (const r of t.rows) assert.equal(r.length, t.columns.length, t.id);
    if (t.compact)
      for (const r of t.compact.rows)
        assert.equal(r.length, t.compact.columns.length, t.id);
  }
});

test("a past version shows the operation as it was at that time", async () => {
  const d = await buildDossier(
    journal,
    { ...fullScope(), viewAt: Date.parse(at(8)) },
    { author: "Test" },
  );
  assert.match(d.cover.shown, /^Version du/);
  const resources = table(d, "resources");
  const tp = resources.rows.find((r) => r[0] === "Tonne-pompe 1");
  assert.equal(tp[5], "Disponible");
  // A deleted entry never comes back (its content is gone); the contact
  // does not exist yet.
  assert.equal(table(d, "entries").rows.length, 2);
  assert.equal(table(d, "deleted"), undefined);
  assert.equal(table(d, "contacts").rows.length, 0);
  assert.equal(table(d, "versions"), undefined);
  assert.equal(sectionCount(d.journal, "contacts"), 0);
  // At 08:12 the forecast of 08:11 gives the next hours.
  const later = await buildDossier(
    journal,
    { sections: ["weather"], viewAt: Date.parse(at(12)) },
    { author: "Test" },
  );
  assert.equal(table(later, "forecast-hours").rows.length, 3);
});

test("a selection keeps only the chosen items", async () => {
  const scope = {
    sections: ["resources", "map"],
    items: { resources: [ids.pio] },
    viewAt: null,
  };
  const d = await buildDossier(journal, scope, { author: "Test" });
  assert.deepEqual(
    d.chapters.map((c) => c.id),
    ["map", "resources"],
  );
  assert.deepEqual(
    table(d, "resources").rows.map((r) => r[0]),
    ["Pionniers"],
  );
  assert.match(d.cover.scope, /Moyens, Cartes \(1 élément choisi\)/);
  assert.equal(sectionItems(journal, "resources").length, 2);
  assert.equal(sectionItems(journal, "radio").length, 0);
});

test("change details name the fields and their values", () => {
  assert.equal(
    changeDetail(
      { status: "A", count: 1, id: "x" },
      { status: "B", count: 1, id: "y" },
    ),
    "État : A → B",
  );
  assert.match(
    changeDetail({}, { dueAt: at(5) }),
    /Échéance : ∅ → 20\.09\.2026/,
  );
});

test("fingerprint, stamp and verification code", async () => {
  const whole = resolveScope(journal, fullScope()).journal;
  const f1 = await fingerprintOf(whole);
  assert.match(f1, /^[0-9a-f]{16}$/);
  assert.equal(await fingerprintOf(structuredClone(whole)), f1);
  const other = resolveScope(journal, {
    ...fullScope(),
    viewAt: Date.parse(at(8)),
  }).journal;
  assert.notEqual(await fingerprintOf(other), f1);
  const id = crypto.randomUUID();
  const stamp = makeStamp(id, f1, "Opérateur", at(20));
  assert.match(
    stamp.label,
    /^orion aic · export [0-9A-F]{8} · empreinte [0-9a-f]{16} · 20\.09\.2026 10:20 · Opérateur$/,
  );
  assert.deepEqual(parseVerify(stamp.qr), { id, fingerprint: f1 });
  assert.deepEqual(parseVerify(`  ${stamp.qr.toUpperCase()} `), {
    id,
    fingerprint: f1,
  });
  assert.equal(parseVerify("n’importe quoi"), null);
  const logs = [
    {
      id: crypto.randomUUID(),
      scope: registerScope("Moyens · état actuel", id),
      fingerprint: f1,
    },
    { id: crypto.randomUUID(), scope: "Autre", fingerprint: f1 },
    { id: crypto.randomUUID(), scope: "Autre", fingerprint: "0".repeat(16) },
  ];
  const found = matchVerify(logs, { id, fingerprint: f1 });
  assert.equal(found.byDocument.length, 1);
  assert.equal(found.sameContent.length, 1);
  assert.equal(autoWatermark(journal), "EXERCICE · CONFIDENTIEL");
  assert.equal(
    autoWatermark({ mode: "Intervention", classification: "Interne" }),
    "",
  );
});

test("archives keep the history of the parts chosen and re-import", () => {
  const whole = archiveJournal(journal, fullScope());
  assert.equal(whole.history.length, journal.history.length);
  const parsed = parseArchive(JSON.parse(JSON.stringify(archive(whole))));
  assert.equal(parsed.journal.entries.length, 2);
  const resourcesOnly = archiveJournal(journal, {
    sections: ["resources"],
    viewAt: null,
  });
  journalSchema.parse(resourcesOnly);
  assert.ok(resourcesOnly.history.length > 0);
  assert.ok(
    resourcesOnly.history.every(
      (e) =>
        e.scope === "ops.resources" ||
        e.scope === "meta" ||
        e.scope === "settings",
    ),
  );
  assert.equal(resourcesOnly.entries.length, 0);
  assert.equal(resourcesOnly.ops.contacts.length, 0);
  // At a past time: history cut at that time.
  const past = archiveJournal(journal, {
    ...fullScope(),
    viewAt: Date.parse(at(8)),
  });
  assert.ok(past.history.every((e) => Date.parse(e.at) <= Date.parse(at(8))));
  journalSchema.parse(past);
});

test("traceability covers only what the export covers", async () => {
  const whole = await buildDossier(journal, fullScope(), { author: "Test" });
  const all = table(whole, "trail").rows;
  assert.ok(all.some((r) => r[3] === "Contact"));
  assert.ok(all.some((r) => r[3] === "Entrée"));
  const part = await buildDossier(
    journal,
    {
      sections: ["resources", "trace"],
      items: { resources: [ids.tp] },
      viewAt: null,
    },
    { author: "Test" },
  );
  const rows = table(part, "trail").rows;
  assert.ok(rows.length > 0);
  // Only the chosen resource, the journal header and the référentiels.
  assert.ok(
    rows.every((r) =>
      ["Moyen", "Propriétés du journal", "Référentiels et réglages"].includes(
        r[3],
      ),
    ),
    rows.map((r) => r[3]).join(","),
  );
  assert.ok(rows.every((r) => r[3] !== "Moyen" || r[4] === "Tonne-pompe 1"));
  assert.ok(
    part.journal.history.every(
      (e) =>
        !e.scope.startsWith("ops.") ||
        (e.scope === "ops.resources" && e.target === ids.tp),
    ),
  );
});
