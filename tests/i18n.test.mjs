import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  LANGS,
  formatDate,
  formatDateTime,
  formatTime,
  getLang,
  langOf,
  pick,
  setLang,
} from "../shared/i18n/core.ts";
import { enumLabel } from "../shared/i18n/enums.ts";
import { t as common } from "../shared/i18n/common.ts";

const root = fileURLToPath(new URL("..", import.meta.url));

// Every dictionary: src/**/i18n.ts, src/**/i18n-*.ts and shared/i18n/*.ts.
function dictionaryFiles() {
  const out = [];
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      const path = join(dir, name);
      if (statSync(path).isDirectory()) walk(path);
      else if (/^i18n(-[\w-]+)?\.ts$/.test(name)) out.push(path);
    }
  };
  walk(join(root, "src"));
  for (const name of readdirSync(join(root, "shared/i18n")))
    if (name.endsWith(".ts") && !["core.ts", "seeds.ts"].includes(name))
      out.push(join(root, "shared/i18n", name));
  return out.sort();
}

const isEntry = (v) =>
  v && typeof v === "object" && typeof v.de === "string" && "it" in v;
const isDict = (v) =>
  v &&
  typeof v === "object" &&
  !Array.isArray(v) &&
  Object.keys(v).length > 0 &&
  Object.values(v).every(isEntry);

async function dictionaries() {
  const found = [];
  for (const file of dictionaryFiles()) {
    const module = await import(pathToFileURL(file).href);
    const seen = new Set();
    for (const [name, value] of Object.entries(module))
      if (isDict(value) && !seen.has(value)) {
        seen.add(value);
        found.push({ file: relative(root, file), name, dict: value });
      }
  }
  return found;
}

const placeholders = (text) =>
  [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
const tags = (text) =>
  [...text.matchAll(/<\/?(\d+)\/?>/g)].map((m) => m[0]).sort();

test("every dictionary has a non-empty German and Italian text for each key", async () => {
  const all = await dictionaries();
  assert.ok(all.length >= 3, "dictionaries found");
  const problems = [];
  for (const { file, name, dict } of all)
    for (const [key, entry] of Object.entries(dict)) {
      for (const lang of ["de", "it"])
        if (typeof entry[lang] !== "string" || !entry[lang].trim())
          problems.push(`${file} ${name} « ${key} » : ${lang} vide`);
      if (entry.fr !== undefined && !String(entry.fr).trim())
        problems.push(`${file} ${name} « ${key} » : fr vide`);
    }
  assert.deepEqual(problems, []);
});

test("placeholders and markup tags match in the three languages", async () => {
  const problems = [];
  for (const { file, dict } of await dictionaries())
    for (const [key, entry] of Object.entries(dict)) {
      const fr = entry.fr ?? key;
      for (const lang of ["de", "it"]) {
        if (
          JSON.stringify(placeholders(entry[lang])) !==
          JSON.stringify(placeholders(fr))
        )
          problems.push(`${file} « ${key} » : paramètres ${lang}`);
        if (JSON.stringify(tags(entry[lang])) !== JSON.stringify(tags(fr)))
          problems.push(`${file} « ${key} » : balises ${lang}`);
      }
    }
  assert.deepEqual(problems, []);
});

test("no sentence is left in French in both German and Italian", async () => {
  const problems = [];
  for (const { file, dict } of await dictionaries())
    for (const [key, entry] of Object.entries(dict)) {
      const fr = entry.fr ?? key;
      if (
        entry.de === fr &&
        entry.it === fr &&
        /[a-zà-ÿ’]{4,} [a-zà-ÿ’]{3,} [a-zà-ÿ’]{3,}/i.test(fr)
      )
        problems.push(`${file} « ${key} »`);
    }
  assert.deepEqual(problems, []);
});

test("the language of a browser: de* and it*, otherwise French", () => {
  assert.equal(langOf("de-CH"), "de");
  assert.equal(langOf("de"), "de");
  assert.equal(langOf("gsw"), "de");
  assert.equal(langOf("it-CH"), "it");
  assert.equal(langOf("fr-CH"), "fr");
  assert.equal(langOf("en-US"), "fr");
  assert.equal(langOf(""), "fr");
  assert.deepEqual([...LANGS], ["fr", "de", "it"]);
});

test("switching the language changes the labels at once", async () => {
  const { MODULES, moduleInfo } = await import("../src/app/modules.ts");
  assert.equal(getLang(), "fr");
  const before = MODULES.map((m) => m.label);
  assert.equal(moduleInfo("journal").label, "Journal d’intervention");
  assert.equal(common("Enregistrer"), "Enregistrer");
  assert.equal(enumLabel("Engagé"), "Engagé");
  try {
    setLang("de");
    assert.equal(moduleInfo("journal").label, "Einsatzjournal");
    assert.equal(moduleInfo("map").short, "Karte");
    assert.equal(common("Enregistrer"), "Speichern");
    assert.equal(enumLabel("Engagé"), "Im Einsatz");
    assert.equal(enumLabel("À traiter"), "Zu bearbeiten");
    setLang("it");
    assert.equal(moduleInfo("journal").label, "Diario d’intervento");
    assert.equal(common("Annuler"), "Annulla");
    assert.equal(enumLabel("Urgent"), "Urgente");
    assert.notDeepEqual(
      MODULES.map((m) => m.label),
      before,
    );
  } finally {
    setLang("fr");
  }
  assert.deepEqual(
    MODULES.map((m) => m.label),
    before,
  );
});

test("a text that is not a fixed value is never translated", () => {
  try {
    setLang("de");
    for (const text of ["PC front", "Reconnaissance au pont", "Chef AIC", ""])
      assert.equal(enumLabel(text), text);
  } finally {
    setLang("fr");
  }
});

test("dates are dd.mm.yyyy and hours 24 h, Zurich time, in every language", () => {
  const at = Date.parse("2026-03-05T19:04:09Z");
  try {
    for (const lang of LANGS) {
      setLang(lang);
      assert.equal(formatDate(at), "05.03.2026");
      assert.equal(formatTime(at), "20:04");
      assert.equal(formatTime(at, true), "20:04:09");
      assert.equal(formatDateTime(at), "05.03.2026 20:04");
    }
    // Summer time.
    assert.equal(formatTime(Date.parse("2026-07-01T22:30:00Z")), "00:30");
  } finally {
    setLang("fr");
  }
});

test("a missing translation falls back to French", () => {
  const dict = { Carte: { de: "", it: "Carta" } };
  assert.equal(pick(dict, "Carte", "de"), "Carte");
  assert.equal(pick(dict, "Carte", "it"), "Carta");
  assert.equal(pick(dict, "Inconnu", "it"), "Inconnu");
});

test("stored data stays as written; a new journal takes the language of its post", async () => {
  const { addEntry, current, emptyFields, newJournal } =
    await import("../shared/journal.ts");
  const { journalLang, listValues, standardBoards } =
    await import("../shared/ops.ts");
  const french = addEntry(
    newJournal("Crue"),
    { ...emptyFields(), message: "Reconnaissance au pont", source: "PC front" },
    "Alpha",
  );
  assert.equal(journalLang(french.ops), "fr");
  try {
    setLang("de");
    // A French journal seen on a German post: same texts, same référentiels.
    const entry = current(french.entries[0]);
    assert.equal(entry.message, "Reconnaissance au pont");
    assert.equal(entry.source, "PC front");
    assert.equal(listValues(french.ops, "recipients")[0], "PC front");
    assert.equal(standardBoards(french.ops)[0], "Situation générale");
    // A journal created on the German post: German defaults for every post.
    const german = newJournal("Hochwasser");
    assert.equal(journalLang(german.ops), "de");
    setLang("fr");
    assert.equal(listValues(german.ops, "recipients")[0], "KP Front");
    assert.equal(listValues(german.ops, "resourceKinds")[0], "Fahrzeug");
    // A référentiel edited in the journal is kept as edited.
    const edited = {
      ...german.ops,
      settings: {
        ...german.ops.settings,
        lists: { recipients: ["PC Carouge"] },
      },
    };
    assert.deepEqual(listValues(edited, "recipients"), ["PC Carouge"]);
    setLang("it");
    assert.equal(listValues(newJournal("Piena").ops, "channels")[0], "Radio");
    assert.equal(
      listValues(newJournal("Piena").ops, "cellKinds")[0],
      "PC avanzato",
    );
  } finally {
    setLang("fr");
  }
});

test("the demonstration exercise is generated in the language of the post, with every link resolved", async () => {
  const { demoWorkspace } = await import("../src/journal/demo.ts");
  const at = Date.parse("2026-05-10T10:00:00Z");
  const shape = (ws) =>
    ws.journals.map(({ entries, ops: o }) => {
      const has = (c) => new Set(o[c].map((r) => r.id));
      const resources = has("resources");
      const members = has("members");
      const messages = has("messages");
      return {
        entries: entries.length,
        counts: [
          "messages",
          "resources",
          "requests",
          "presences",
          "shifts",
          "injects",
          "places",
          "facts",
          "orders",
          "checklists",
        ].map((c) => o[c].length),
        requests: o.requests.filter(
          (r) => !r.resourceId || resources.has(r.resourceId),
        ).length,
        presences: o.presences.filter(
          (p) => !p.memberId || members.has(p.memberId),
        ).length,
        shifts: o.shifts
          .flatMap((s) => s.memberIds)
          .every((id) => members.has(id)),
        injects: o.injects.filter(
          (i) => i.messageId && messages.has(i.messageId),
        ).length,
      };
    });
  try {
    const fr = demoWorkspace(at);
    for (const lang of ["de", "it"]) {
      setLang(lang);
      const ws = demoWorkspace(at);
      assert.deepEqual(shape(ws), shape(fr), lang);
      const j = ws.journals[0];
      assert.equal(j.ops.settings.lang, lang);
      assert.notEqual(j.title, fr.journals[0].title);
      assert.notEqual(
        j.ops.messages[0].subject,
        fr.journals[0].ops.messages[0].subject,
      );
      // Fixed values stay French codes.
      assert.deepEqual(
        j.ops.resources.map((r) => r.status),
        fr.journals[0].ops.resources.map((r) => r.status),
      );
    }
  } finally {
    setLang("fr");
  }
});
