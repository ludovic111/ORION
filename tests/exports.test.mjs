import test from "node:test";
import assert from "node:assert/strict";
import { unzipSync, strFromU8 } from "fflate";
import { addEntry, emptyFields, newJournal } from "../shared/journal.ts";
import {
  docx,
  exportFormats,
  makeExport,
  ods,
  xlsx,
} from "../src/journal/exports.ts";
import { decrypt } from "../shared/crypto.ts";
const journal = addEntry(
  newJournal("Exercice de test"),
  {
    ...emptyFields(),
    message: "=1+1\nÉvacuation à Genève <script>",
    source: "Alpha & Bravo",
    notes: "Notes complètes",
    location: "École du secteur",
  },
  "Test",
);
test("XLSX is a real OOXML package with literal strings, filter and frozen header", () => {
  const files = unzipSync(xlsx(journal));
  const sheet = strFromU8(files["xl/worksheets/sheet1.xml"]);
  assert.ok(files["[Content_Types].xml"]);
  assert.ok(files["xl/workbook.xml"]);
  assert.match(sheet, /t="inlineStr"/);
  assert.match(sheet, /state="frozen"/);
  assert.match(sheet, /autoFilter/);
  assert.ok(!sheet.includes("<f>"));
  assert.ok(sheet.includes("&lt;script&gt;"));
});
test("ODS uses real OpenDocument entries and literal string cells", () => {
  const files = unzipSync(ods(journal));
  assert.equal(
    strFromU8(files.mimetype),
    "application/vnd.oasis.opendocument.spreadsheet",
  );
  assert.ok(files["META-INF/manifest.xml"]);
  const content = strFromU8(files["content.xml"]);
  assert.ok(content.includes('office:value-type="string"'));
  assert.ok(!content.includes("table:formula"));
});
test("DOCX has valid package parts, preserves newlines and escapes XML", () => {
  const files = unzipSync(docx(journal));
  const content = strFromU8(files["word/document.xml"]);
  assert.ok(files["_rels/.rels"]);
  assert.match(content, /<w:br\/>/);
  assert.ok(content.includes("Alpha &amp; Bravo"));
  assert.ok(content.includes("Notes complètes"));
});
test("every advertised export produces a nonempty file", async () => {
  for (const { id } of exportFormats) {
    const blob = await makeExport(journal, id, "archive de test uniquement");
    assert.ok(blob.size > 100, id);
    if (id === "pdf") assert.equal((await blob.text()).slice(0, 5), "%PDF-");
    if (id === "orion")
      assert.deepEqual(
        (
          await decrypt(
            JSON.parse(await blob.text()),
            "archive de test uniquement",
          )
        ).value.journal,
        journal,
      );
  }
});
