import test from "node:test";
import assert from "node:assert/strict";
import { strFromU8, unzipSync } from "fflate";
import { fullScope } from "../src/export/scope.ts";
import { buildDossier } from "../src/export/dossier.ts";
import { fingerprintOf, makeStamp } from "../src/export/stamp.ts";
import { dossierOds, dossierXlsx, sheetNames } from "../src/export/sheets.ts";
import { dossierDocx } from "../src/export/docx.ts";
import { dossierOdt } from "../src/export/odt.ts";
import { dossierHtml } from "../src/export/html.ts";
import {
  dossierDelimited,
  dossierJson,
  dossierMarkdown,
  dossierText,
} from "../src/export/text.ts";
import { agendaIcs, contactsVcf, fold } from "../src/export/calendar.ts";
import { matrixPng, pngSize, qrPng } from "../src/export/bytes.ts";
import { dossierPdf } from "../src/export/pdf.ts";
import { FORMATS, formatFromPreset } from "../src/export/formats.ts";
import { operation } from "./export-fixture.mjs";

const { journal, ids } = operation();
const dossier = await buildDossier(journal, fullScope(), {
  author: "Opérateur Test",
  versions: true,
});
const stamp = makeStamp(
  crypto.randomUUID(),
  await fingerprintOf(dossier.journal),
  "Opérateur Test",
  new Date().toISOString(),
);
const map = matrixPng(
  Array.from({ length: 40 }, (_, r) =>
    Array.from({ length: 40 }, (_, c) => (r * c) % 5 === 0),
  ),
  6,
  0,
);
const options = (orientation = "portrait") => ({
  stamp,
  watermark: "EXERCICE · CONFIDENTIEL",
  orientation,
  maps: {
    [ids.map1]: { png: map, width: 240, height: 240, attribution: "© test" },
    [ids.map2]: { png: map, width: 240, height: 240, attribution: "© test" },
  },
});

/** Well-formed XML: balanced tags, quoted attributes, known entities. */
function wellFormed(text, name) {
  assert.ok(text.startsWith("<?xml"), `${name}: declaration`);
  const stack = [];
  const re =
    /<(\/?)([A-Za-z_][\w.:-]*)((?:\s+[\w.:-]+="[^"<]*")*)\s*(\/?)>|<\?[^>]*\?>|<!\[CDATA\[[\s\S]*?\]\]>|<!--[\s\S]*?-->/g;
  let last = 0;
  let m;
  while ((m = re.exec(text))) {
    const between = text.slice(last, m.index);
    assert.ok(!/[<>]/.test(between), `${name}: stray bracket near ${m.index}`);
    for (const e of between.matchAll(/&([^;\s]*);?/g))
      assert.match(
        e[0],
        /^&(amp|lt|gt|quot|apos|#\d+|#x[0-9a-f]+);$/i,
        `${name}: entity ${e[0]}`,
      );
    last = re.lastIndex;
    if (!m[2]) continue;
    if (m[1]) assert.equal(stack.pop(), m[2], `${name}: </${m[2]}>`);
    else if (!m[4]) stack.push(m[2]);
  }
  assert.ok(!/[<>]/.test(text.slice(last)), `${name}: trailing`);
  assert.equal(stack.length, 0, `${name}: unclosed ${stack.join(",")}`);
}

/** Every XML part is well formed, every relationship target exists. */
function checkPackage(bytes, label) {
  const files = unzipSync(bytes);
  for (const [name, data] of Object.entries(files))
    if (/\.(xml|rels)$/.test(name))
      wellFormed(strFromU8(data), `${label} ${name}`);
  return files;
}
function checkOoxml(bytes, label) {
  const files = checkPackage(bytes, label);
  const types = strFromU8(files["[Content_Types].xml"]);
  for (const name of Object.keys(files)) {
    if (name === "[Content_Types].xml" || name.endsWith(".rels")) continue;
    const ext = name.split(".").pop();
    assert.ok(
      types.includes(`PartName="/${name}"`) ||
        types.includes(`Extension="${ext}"`),
      `${label}: content type of ${name}`,
    );
  }
  for (const [name, data] of Object.entries(files)) {
    if (!name.endsWith(".rels")) continue;
    const dir = name.replace(/_rels\/[^/]*\.rels$/, "");
    for (const [, target, mode] of strFromU8(data).matchAll(
      /Target="([^"]+)"(\s+TargetMode="External")?/g,
    ))
      if (!mode)
        assert.ok(files[dir + target], `${label}: ${name} → ${target}`);
  }
  return files;
}
/** mimetype first and stored, manifest lists every file. */
function checkOdf(bytes, mime, label) {
  const files = checkPackage(bytes, label);
  const view = new DataView(bytes.buffer, bytes.byteOffset);
  assert.equal(view.getUint32(0, true), 0x04034b50);
  assert.equal(view.getUint16(8, true), 0, "mimetype stored");
  assert.equal(strFromU8(bytes.subarray(30, 38)), "mimetype");
  assert.equal(strFromU8(files.mimetype), mime);
  const manifest = strFromU8(files["META-INF/manifest.xml"]);
  for (const name of Object.keys(files))
    if (name !== "mimetype" && !name.startsWith("META-INF/"))
      assert.ok(
        manifest.includes(`full-path="${name}"`),
        `${label}: manifest ${name}`,
      );
  return files;
}

test("sheet names are valid and unique", () => {
  const names = sheetNames([
    "Couverture",
    "Journal",
    "journal",
    "Carte Secteur : pont [nord] / sud avec un nom très long",
    "History",
    "'x'",
  ]);
  assert.equal(new Set(names.map((n) => n.toLowerCase())).size, names.length);
  for (const n of names) {
    assert.ok(n.length <= 31, n);
    assert.ok(!/[\\/?*[\]:]/.test(n), n);
    assert.ok(!n.startsWith("'"), n);
  }
  assert.equal(names[2], "journal (2)");
  assert.equal(names[4], "Historique");
});

test("Excel: one sheet per table, frozen header, filters, literal text", () => {
  const files = checkOoxml(dossierXlsx(dossier, stamp, "EXERCICE"), "xlsx");
  const workbook = strFromU8(files["xl/workbook.xml"]);
  const sheets = [...workbook.matchAll(/<sheet name="([^"]+)"/g)];
  assert.ok(sheets.length > 15);
  assert.equal(sheets[0][1], "Couverture");
  assert.ok(workbook.includes("_xlnm._FilterDatabase"));
  const cover = strFromU8(files["xl/worksheets/sheet1.xml"]);
  assert.ok(cover.includes(stamp.qr));
  const journalSheet = sheets.findIndex((s) => s[1] === "Journal") + 1;
  const sheet = strFromU8(files[`xl/worksheets/sheet${journalSheet}.xml`]);
  assert.match(sheet, /state="frozen"/);
  assert.match(sheet, /<autoFilter ref="A1:V3"\/>/);
  assert.ok(sheet.includes("&lt;b&gt;Début&lt;/b&gt; &amp; suite"));
  assert.ok(!sheet.includes("<f>"));
  assert.ok(files["docProps/core.xml"]);
});

test("OpenDocument spreadsheet mirrors the Excel sheets", () => {
  const files = checkOdf(
    dossierOds(dossier, stamp, "EXERCICE"),
    "application/vnd.oasis.opendocument.spreadsheet",
    "ods",
  );
  const content = strFromU8(files["content.xml"]);
  assert.ok((content.match(/<table:table /g) ?? []).length > 15);
  assert.ok(content.includes("table:database-range"));
  assert.ok(!content.includes("table:formula"));
  assert.ok(strFromU8(files["settings.xml"]).includes("VerticalSplitMode"));
});

test("Word: styles, headings, table of contents, images, header and footer", () => {
  for (const orientation of ["portrait", "landscape"]) {
    const files = checkOoxml(
      dossierDocx(dossier, options(orientation)),
      "docx",
    );
    const doc = strFromU8(files["word/document.xml"]);
    assert.equal(
      (doc.match(/<w:pStyle w:val="Heading1"\/>/g) ?? []).length,
      13,
    );
    assert.ok(doc.includes(' TOC \\o "1-2" \\h \\z \\u '));
    assert.ok(doc.includes("<w:tblHeader/>"));
    assert.ok(doc.includes("Crue ; test, « Arve »"));
    assert.equal(
      orientation === "landscape",
      doc.includes('w:orient="landscape"'),
    );
    const media = Object.keys(files).filter((f) => f.startsWith("word/media/"));
    assert.equal(media.length, 4); // two QR codes and two maps
    for (const m of media) assert.equal(pngSize(files[m]).width > 0, true);
    const header = strFromU8(files["word/header1.xml"]);
    assert.ok(header.includes("PowerPlusWaterMarkObject"));
    assert.ok(header.includes('string="EXERCICE · CONFIDENTIEL"'));
    const footer = strFromU8(files["word/footer1.xml"]);
    assert.ok(footer.includes(stamp.label));
    assert.ok(footer.includes(" NUMPAGES "));
    assert.ok(
      strFromU8(files["word/styles.xml"]).includes('w:styleId="Heading2"'),
    );
  }
});

test("OpenDocument text: same content, pictures in the manifest", () => {
  const files = checkOdf(
    dossierOdt(dossier, options()),
    "application/vnd.oasis.opendocument.text",
    "odt",
  );
  const content = strFromU8(files["content.xml"]);
  assert.equal(
    (content.match(/<text:h text:style-name="Heading_20_1"/g) ?? []).length,
    14,
  );
  assert.ok(content.includes("<text:table-of-content"));
  assert.ok(content.includes("<table:table-header-rows>"));
  assert.equal(
    Object.keys(files).filter((f) => f.startsWith("Pictures/")).length,
    4,
  );
  const styles = strFromU8(files["styles.xml"]);
  assert.ok(styles.includes("Filigrane"));
  assert.ok(styles.includes("<text:page-count>"));
  assert.ok(styles.includes(stamp.label));
});

test("HTML: standalone, no script, watermark, QR and table of contents", () => {
  const html = dossierHtml(dossier, options());
  assert.ok(html.startsWith("<!doctype html>"));
  assert.ok(!/<script/i.test(html));
  assert.ok(html.includes("default-src 'none'"));
  assert.ok(html.includes('class="wm"'));
  assert.ok(html.includes("<svg"));
  assert.ok(html.includes('href="#part-13"'));
  assert.ok(html.includes("data:image/png;base64,"));
  assert.ok(html.includes("&lt;b&gt;Début&lt;/b&gt;"));
  assert.ok(html.includes(stamp.label));
});

test("text formats: Markdown, plain text, JSON, CSV and TSV", () => {
  const md = dossierMarkdown(dossier, options());
  assert.ok(md.includes("Reconnaissance du pont \\| niveau"));
  assert.ok(md.includes("## 13. Traçabilité"));
  const txt = dossierText(dossier, options());
  assert.ok(
    txt.includes("Nom : Tonne-pompe 1") ||
      txt.includes("Désignation : Tonne-pompe 1"),
  );
  const data = JSON.parse(dossierJson(dossier, options()));
  assert.equal(data.format, "orion-dossier");
  assert.equal(data.document.verify, stamp.qr);
  assert.equal(data.chapters.length, 13);
  const csv = dossierDelimited(dossier, stamp, ";");
  assert.ok(csv.zip);
  const files = unzipSync(csv.zip);
  assert.ok(files["LISEZMOI.txt"]);
  const resources = Object.entries(files).find(([n]) => n.includes("moyens"));
  const text = strFromU8(resources[1]);
  assert.deepEqual([...resources[1].subarray(0, 3)], [0xef, 0xbb, 0xbf]);
  assert.ok(text.includes('"\'=SUM(A1)"'));
  assert.ok(text.split("\r\n")[0].includes('";"'));
  const tsv = dossierDelimited(dossier, stamp, "\t");
  assert.ok(tsv.files[0].name.endsWith(".tsv"));
});

test("calendar: RFC 5545 folding, escaping and UTC times", () => {
  const ics = agendaIcs(journal, journal.ops.agenda, stamp);
  const lines = ics.split("\r\n");
  assert.equal(lines[0], "BEGIN:VCALENDAR");
  assert.equal(lines.at(-1), "");
  for (const l of lines) assert.ok(new TextEncoder().encode(l).length <= 75, l);
  const unfolded = ics.replace(/\r\n /g, "");
  assert.ok(
    unfolded.includes("SUMMARY:Rapport de conduite\\, point \\; décisions"),
  );
  assert.match(unfolded, /DTSTART:20260920T083000Z/);
  assert.match(unfolded, /DTEND:20260920T090000Z/);
  assert.equal((ics.match(/BEGIN:VEVENT/g) ?? []).length, 1);
  assert.equal(fold("é".repeat(60)).split("\r\n ")[0].length, 37);
});

test("contacts: vCard 4.0 with escaped values", () => {
  const vcf = contactsVcf(journal.ops.contacts, stamp);
  const lines = vcf.split("\r\n");
  for (const l of lines) assert.ok(new TextEncoder().encode(l).length <= 75, l);
  const unfolded = vcf.replace(/\r\n /g, "");
  assert.ok(unfolded.includes("BEGIN:VCARD\r\nVERSION:4.0"));
  assert.ok(unfolded.includes("FN:Dupont\\, Jean\\; chef"));
  assert.ok(unfolded.includes("ORG:Commune\\, voirie"));
  assert.ok(
    unfolded.includes("TEL;VALUE=text;TYPE=work,voice;PREF=1:+41 22 000 00 00"),
  );
  assert.ok(unfolded.includes("NOTE:Ligne 1\\nLigne 2"));
  assert.ok(unfolded.includes(`UID:urn:uuid:${journal.ops.contacts[0].id}`));
});

test("PDF dossier: pages, table of contents, stamp", async () => {
  const blob = await dossierPdf(dossier, options());
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const text = new TextDecoder("latin1").decode(bytes);
  assert.equal(text.slice(0, 5), "%PDF-");
  const pages = (text.match(/\/Type \/Page\b/g) ?? []).length;
  assert.ok(pages >= 15, `${pages} pages`);
  const landscape = await dossierPdf(dossier, options("landscape"));
  assert.ok(landscape.size > 10_000);
});

test("QR codes are real PNG images", () => {
  const png = qrPng(stamp.qr);
  assert.deepEqual([...png.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
  const { width, height } = pngSize(png);
  assert.equal(width, height);
  assert.ok(width > 200);
});

test("catalogue: unique ids, every group used, presets", () => {
  assert.equal(new Set(FORMATS.map((f) => f.id)).size, FORMATS.length);
  assert.equal(formatFromPreset("orionaic"), "orion");
  assert.equal(formatFromPreset("pptx"), "pptx");
  assert.equal(formatFromPreset("inconnu"), null);
});

test("sheet names: characters removed and cut before deduplication", () => {
  const long = "Carte 🗺️🗺️🗺️🗺️🗺️🗺️🗺️🗺️🗺️🗺️🗺️🗺️🗺️🗺️";
  const names = sheetNames([long, long, "a:b", "a/b", "'''", "x\u0001y"]);
  assert.equal(new Set(names.map((n) => n.toLowerCase())).size, names.length);
  for (const n of names) {
    assert.ok(n.length <= 31, n);
    assert.ok(!/[\uD800-\uDBFF]$/.test(n.replace(/ \(\d+\)$/, "")), n);
    assert.ok(!/[\\/?*[\]:\u0000-\u001f]/.test(n), n);
  }
  assert.deepEqual(names.slice(2), ["a b", "a b (2)", "Feuille", "x y"]);
});

test("Excel header and footer stay well formed with long texts", () => {
  const title = "L’opération « d’Arve » & d'autres ".repeat(20);
  const files = checkOoxml(
    dossierXlsx(
      { ...dossier, cover: { ...dossier.cover, title } },
      { ...stamp, label: `${stamp.label} & d'autres `.repeat(10) },
      "EXERCICE",
    ),
    "xlsx",
  );
  const sheet = strFromU8(files["xl/worksheets/sheet2.xml"]);
  const unescape = (s) =>
    s
      .replaceAll("&apos;", "'")
      .replaceAll("&quot;", '"')
      .replaceAll("&lt;", "<")
      .replaceAll("&gt;", ">")
      .replaceAll("&amp;", "&");
  for (const part of ["oddHeader", "oddFooter"]) {
    const text = unescape(
      sheet.match(new RegExp(`<${part}>(.*?)</${part}>`))[1],
    );
    assert.ok(text.length <= 255, `${part}: ${text.length}`);
  }
});

test("PDF table of contents: reserved pages fit every line", async () => {
  const { tocLayout } = await import("../src/export/pdf.ts");
  const levels = Array.from({ length: 13 }, () => [
    1, 2, 2, 2, 2, 2, 2, 2,
  ]).flat();
  const { at, pages } = tocLayout(levels, 297 - 17);
  assert.ok(pages >= 2);
  assert.equal(Math.max(...at.map((a) => a.page)) + 1, pages);
  for (const a of at) assert.ok(a.y <= 297 - 17, `${a.y}`);
  // Many maps: the dossier still starts its first chapter after the TOC.
  const many = {
    ...dossier,
    chapters: dossier.chapters.map((c) =>
      c.id === "map"
        ? {
            ...c,
            blocks: Array.from({ length: 60 }, (_, i) => ({
              kind: "map",
              mapId: `m${i}`,
              title: `Carte ${i}`,
              caption: "",
              objects: 0,
            })),
          }
        : c,
    ),
  };
  const blob = await dossierPdf(many, { ...options(), maps: {} });
  assert.equal(
    new TextDecoder("latin1")
      .decode(new Uint8Array(await blob.arrayBuffer()))
      .slice(0, 5),
    "%PDF-",
  );
});
