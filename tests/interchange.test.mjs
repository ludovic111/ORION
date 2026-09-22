import test from "node:test";
import assert from "node:assert/strict";
import {
  addEntry,
  current,
  emptyFields,
  newJournal,
  archive,
} from "../shared/journal.ts";
import {
  asHtml,
  columns,
  delimited,
  importCsv,
  importJson,
  parseDelimited,
  rows,
  spreadsheetText,
  xml,
} from "../shared/interchange.ts";
const sample = () =>
  addEntry(
    newJournal("Exercice <fictif>"),
    {
      ...emptyFields(),
      message: '=HYPERLINK("https://example.invalid")\nÉvacuation; école',
      source: 'Équipe "Alpha"',
      notes: "'apostrophe\tœuvre & <script>alert(1)</script>",
    },
    "Opérateur",
  );
test("CSV preserves multiline, Unicode, quotes and formula-looking values", () => {
  const journal = sample();
  const exported = delimited(rows(journal));
  const result = importCsv(exported, "Copie");
  assert.deepEqual(
    current(result.journal.entries[0]),
    current(journal.entries[0]),
  );
  assert.equal(result.journal.entries[0].createdBy, "Opérateur");
});
test("TSV roundtrip preserves embedded tabs and quoted delimiters", () => {
  const table = [
    ["a", "b"],
    ["a\tb", "ligne\r\nsuivante"],
    ['"text"', "=1+2"],
  ];
  assert.deepEqual(parseDelimited(delimited(table, "\t")), table);
});
test("delimited roundtrip property over a deterministic corpus of special characters", () => {
  let seed = 173;
  const characters = [
    "a",
    "é",
    "œ",
    "🙂",
    ";",
    ",",
    "\t",
    "\r",
    "\n",
    '"',
    "'",
    "=",
    "+",
    "-",
    "@",
    "<",
    ">",
    "\uFEFF",
    " ",
  ];
  const next = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed;
  };
  for (let attempt = 0; attempt < 150; attempt++) {
    const table = [
      ["A", "B", "C"],
      ...Array.from({ length: 5 }, () =>
        Array.from({ length: 3 }, () =>
          Array.from(
            { length: (next() % 50) + 1 },
            () => characters[next() % characters.length],
          ).join(""),
        ),
      ),
    ];
    for (const separator of [";", ",", "\t"])
      assert.deepEqual(
        parseDelimited(delimited(table, separator), separator),
        table,
      );
  }
});
test("CSV rejects unclosed quotes, malformed columns, oversized fields and unknown headers", () => {
  assert.throws(() => parseDelimited('a;b\n"unfinished'));
  assert.throws(() => parseDelimited('a;b\n"hello"x;test'));
  assert.throws(() => parseDelimited("a;b\n" + "x".repeat(20001)));
  assert.throws(() => importCsv("Message;Événement (ISO)\nhello", "Test"));
  assert.throws(() => importCsv("Unexpected;Other\n1;2", "Test"));
  assert.throws(() =>
    importCsv(
      "Message;Message;Événement (ISO)\na;b;2026-09-22T10:00:00Z",
      "Test",
    ),
  );
});
test("formula payloads are neutralized, including leading whitespace and quotes", () => {
  for (const value of [
    "=1+1",
    " +cmd",
    "\t@SUM(A1)",
    "-2",
    "@SUM(A1)",
    "\r=1",
    "'text",
    "\uFEFF=1",
  ])
    assert.equal(spreadsheetText(value)[0], "'");
  assert.equal(spreadsheetText("Évacuation normale"), "Évacuation normale");
});
test("HTML escapes content and forbids scripts / external resources", () => {
  const text = asHtml(sample());
  assert.ok(text.includes("&lt;script&gt;"));
  assert.ok(!text.includes("<script>"));
  assert.ok(text.includes("default-src 'none'"));
  assert.ok(text.includes("Équipe &quot;Alpha&quot;"));
  assert.equal(xml("a\u0001<&"), "a&lt;&amp;");
});
test("native JSON import preserves revisions and fields", () => {
  const value = sample();
  assert.deepEqual(importJson(archive(value)).archive.journal, value);
});
test("ORION 0.3 migration includes only journal records and surfaces its limits", () => {
  const old = {
    format: "orion-export-v1",
    operation: { title: "Ancien exercice" },
    records: [
      {
        kind: "journal",
        data: {
          title: "Message antérieur",
          priority: "Urgent",
          status: "Traité",
          source: "Alpha",
        },
        created_at: "2026-09-20T10:00:00Z",
        created_by: "Beta",
      },
      {
        kind: "resource",
        data: { name: "Véhicule" },
        created_at: "2026-09-20T10:00:00Z",
      },
    ],
  };
  const result = importJson(old);
  assert.equal(result.archive.journal.entries.length, 1);
  assert.equal(current(result.archive.journal.entries[0]).status, "Terminé");
  assert.match(result.notice, /Ancien format/);
});
test("all entry fields have an export column", () => {
  const value = sample();
  const f = current(value.entries[0]);
  assert.ok(columns.length > Object.keys(f).length);
  for (const field of Object.values(f).filter(
    (v) => typeof v === "string" && v.length,
  ))
    assert.ok(rows(value)[1].includes(field), `missing ${field}`);
});

test("CSV import handles 1000 rows without changing their order or content", () => {
  const table = [
    ["Message", "Événement (ISO)"],
    ...Array.from({ length: 1000 }, (_, i) => [
      `Message ${i}`,
      "2026-09-22T10:00:00Z",
    ]),
  ];
  const result = importCsv(delimited(table), "Grand journal");
  assert.equal(result.journal.entries.length, 1000);
  assert.equal(current(result.journal.entries[999]).message, "Message 999");
  assert.equal(result.journal.entries[999].number, 1000);
});
