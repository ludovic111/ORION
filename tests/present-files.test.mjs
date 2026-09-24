import test from "node:test";
import assert from "node:assert/strict";
import { strFromU8, unzipSync } from "fflate";
import { buildDeck } from "../src/present/deck.ts";
import { DARK, LIGHT, layoutDeck } from "../src/present/layout.ts";
import { writePptx } from "../src/present/pptx.ts";
import { writeOdp } from "../src/present/odp.ts";
import { writeHtml } from "../src/present/html.ts";
import { writePdfSlides } from "../src/present/pdfslides.ts";
import { pngSize, qrPng } from "../src/present/png.ts";
import { briefingJournal, fakeMap } from "./present-fixture.mjs";

// Slide files written in node, unzipped and checked part by part: every XML
// part well-formed, every relationship resolved, every animated shape
// present, the PowerPoint element order respected.

const { journal, at } = briefingJournal();
const deck = buildDeck(journal, {
  at,
  live: true,
  presenter: "Cap Fictif",
  audience: "Autorités <communales> & préfet",
  full: journal,
  since: Date.parse(journal.createdAt) + 30 * 60_000,
});
const images = { qr: qrPng("https://orionaic.xyz/v/test#1a2b") };
for (const s of deck.slides)
  if (s.kind === "map") images[s.id] = fakeMap(1920, 1080);
const layout = (palette, animations = true) =>
  layoutDeck(deck, {
    palette,
    footer: "orion aic · export test · empreinte 1a2b3c4d",
    images: new Set(Object.keys(images)),
    animations,
    watermark: "EXERCICE",
  });
const meta = (palette) => ({
  title: deck.title,
  author: "Cap Fictif",
  palette,
});

/** Minimal XML well-formedness check: tags balanced, attributes quoted, entities valid. */
function wellFormed(xml, name) {
  let rest = xml.replace(/^<\?xml[^?]*\?>\s*/, "");
  const stack = [];
  const tag =
    /<(\/?)([A-Za-z_][\w.:-]*)((?:\s+[\w.:-]+\s*=\s*(?:"[^"<]*"|'[^'<]*'))*)\s*(\/?)>/y;
  let i = 0;
  let root = 0;
  while (i < rest.length) {
    const lt = rest.indexOf("<", i);
    const text = rest.slice(i, lt < 0 ? rest.length : lt);
    assert.ok(
      !/&(?!(amp|lt|gt|quot|apos|#\d+|#x[0-9a-f]+);)/i.test(text),
      `${name}: raw & in text`,
    );
    if (lt < 0) break;
    if (rest.startsWith("<!--", lt)) {
      i = rest.indexOf("-->", lt) + 3;
      continue;
    }
    tag.lastIndex = lt;
    const m = tag.exec(rest);
    assert.ok(m, `${name}: malformed tag near ${rest.slice(lt, lt + 80)}`);
    const [, close, tagName, attrs, self] = m;
    for (const a of attrs.matchAll(/\s([\w.:-]+)\s*=/g)) {
      const count = [
        ...attrs.matchAll(
          new RegExp(`\\s${a[1].replace(/[.:-]/g, "\\$&")}\\s*=`, "g"),
        ),
      ].length;
      assert.equal(
        count,
        1,
        `${name}: duplicate attribute ${a[1]} on ${tagName}`,
      );
    }
    if (close)
      assert.equal(
        stack.pop(),
        tagName,
        `${name}: </${tagName}> closes the wrong element`,
      );
    else if (!self) {
      if (!stack.length) root++;
      stack.push(tagName);
    } else if (!stack.length) root++;
    i = tag.lastIndex;
  }
  assert.equal(stack.length, 0, `${name}: unclosed ${stack.join(" > ")}`);
  assert.equal(root, 1, `${name}: one root element`);
}

const REL_TYPES = /^http:\/\/schemas\.openxmlformats\.org\//;

test("PowerPoint: a complete OOXML package, well-formed and fully linked", () => {
  const bytes = writePptx(layout(DARK), images, meta(DARK), true);
  const files = unzipSync(bytes);
  const names = Object.keys(files);
  assert.equal(names[0], "[Content_Types].xml");
  const xmlParts = names.filter(
    (n) => n.endsWith(".xml") || n.endsWith(".rels"),
  );
  for (const n of xmlParts) wellFormed(strFromU8(files[n]), n);

  const types = strFromU8(files["[Content_Types].xml"]);
  for (const n of names.filter(
    (n) => n.endsWith(".xml") && n !== "[Content_Types].xml",
  ))
    assert.ok(types.includes(`PartName="/${n}"`), `content type of ${n}`);
  assert.ok(types.includes('Extension="png"'));

  // Every relationship points to an existing part.
  for (const n of names.filter((n) => n.endsWith(".rels"))) {
    const base = n.replace(/_rels\/[^/]*\.rels$/, "");
    for (const [, type, target] of strFromU8(files[n]).matchAll(
      /Type="([^"]+)" Target="([^"]+)"/g,
    )) {
      assert.match(type, REL_TYPES);
      const parts = `${base}${target}`.split("/");
      const path = [];
      for (const p of parts) p === ".." ? path.pop() : path.push(p);
      assert.ok(files[path.join("/")], `${n} → ${target}`);
    }
  }

  const pres = strFromU8(files["ppt/presentation.xml"]);
  assert.match(pres, /<p:sldSz cx="12192000" cy="6858000"\/>/);
  assert.match(
    pres,
    /<p:sldMasterIdLst>.*<p:notesMasterIdLst>.*<p:sldIdLst>.*<p:sldSz.*<p:notesSz/,
  );
  const slides = names.filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n));
  assert.equal(slides.length, deck.slides.length);
  assert.equal(
    names.filter((n) => /^ppt\/notesSlides\/notesSlide\d+\.xml$/.test(n))
      .length,
    slides.length,
  );
  assert.ok(
    files["ppt/notesMasters/notesMaster1.xml"] && files["ppt/theme/theme2.xml"],
  );

  let tables = 0;
  let pictures = 0;
  for (const n of slides) {
    const xml = strFromU8(files[n]);
    // Schema order of a slide.
    const order = ["<p:cSld", "<p:clrMapOvr", "<p:transition", "<p:timing"].map(
      (t) => xml.indexOf(t),
    );
    assert.ok(
      order.every((p, k) => p > 0 && (k === 0 || p > order[k - 1])),
      `${n}: element order`,
    );
    // Shape ids unique, every animation target exists.
    const ids = [...xml.matchAll(/<p:cNvPr id="(\d+)"/g)].map((m) => m[1]);
    assert.equal(new Set(ids).size, ids.length, `${n}: unique shape ids`);
    const targets = [...xml.matchAll(/<p:spTgt spid="(\d+)"/g)].map(
      (m) => m[1],
    );
    assert.ok(targets.length > 0, `${n}: animated`);
    for (const t of targets) assert.ok(ids.includes(t), `${n}: target ${t}`);
    const builds = [...xml.matchAll(/<p:bldP spid="(\d+)"/g)].map((m) => m[1]);
    for (const b of builds)
      assert.ok(
        new RegExp(`<p:sp><p:nvSpPr><p:cNvPr id="${b}"`).test(xml),
        `${n}: bldP ${b} on a shape`,
      );
    // Time node ids unique; the sequence starts by itself with the slide.
    const tn = [...xml.matchAll(/<p:cTn id="(\d+)"/g)].map((m) => m[1]);
    assert.equal(new Set(tn).size, tn.length, `${n}: unique time nodes`);
    assert.match(
      xml,
      /nodeType="tmRoot".*nodeType="mainSeq".*<p:cond evt="onBegin" delay="0"><p:tn val="2"\/>.*nodeType="afterEffect"/,
    );
    // Text properties: fill before font, as the schema wants.
    assert.ok(!/<a:latin[^>]*\/><a:solidFill>/.test(xml), `${n}: rPr order`);
    tables += (xml.match(/<a:tbl>/g) ?? []).length;
    pictures += (xml.match(/<p:pic>/g) ?? []).length;
    assert.ok(xml.includes("EXERCICE"), `${n}: watermark`);
  }
  assert.ok(tables >= 2, "real tables");
  assert.ok(pictures >= 3, "maps and QR code as pictures");
  const notes = strFromU8(files["ppt/notesSlides/notesSlide1.xml"]);
  assert.ok(notes.includes("Autorités &lt;communales&gt; &amp; préfet"));
  assert.ok(files["ppt/media/image1.png"]);

  // Without animations: neither transitions nor timing.
  const plain = unzipSync(
    writePptx(layout(LIGHT, false), images, meta(LIGHT), false),
  );
  const first = strFromU8(plain["ppt/slides/slide2.xml"]);
  assert.ok(!first.includes("<p:timing") && !first.includes("<p:transition"));
});

test("OpenDocument: mimetype first and stored, manifest complete, animations targeted", () => {
  const bytes = writeOdp(layout(DARK), images, meta(DARK), true);
  // First local file header: name "mimetype", method 0 (stored).
  const view = new DataView(bytes.buffer, bytes.byteOffset);
  assert.equal(view.getUint32(0, true), 0x04034b50);
  assert.equal(view.getUint16(8, true), 0);
  assert.equal(strFromU8(bytes.subarray(30, 38)), "mimetype");
  const files = unzipSync(bytes);
  assert.equal(
    strFromU8(files.mimetype),
    "application/vnd.oasis.opendocument.presentation",
  );
  for (const n of Object.keys(files).filter((n) => n.endsWith(".xml")))
    wellFormed(strFromU8(files[n]), n);
  const manifest = strFromU8(files["META-INF/manifest.xml"]);
  for (const n of Object.keys(files).filter(
    (n) => n !== "mimetype" && n !== "META-INF/manifest.xml",
  ))
    assert.ok(
      manifest.includes(`manifest:full-path="${n}"`),
      `manifest lists ${n}`,
    );
  const content = strFromU8(files["content.xml"]);
  assert.equal(
    (content.match(/<draw:page /g) ?? []).length,
    deck.slides.length,
  );
  const ids = new Set(
    [...content.matchAll(/xml:id="([^"]+)"/g)].map((m) => m[1]),
  );
  const targets = [...content.matchAll(/smil:targetElement="([^"]+)"/g)].map(
    (m) => m[1],
  );
  assert.ok(targets.length > deck.slides.length);
  for (const t of targets) assert.ok(ids.has(t), `target ${t}`);
  assert.match(content, /smil:type="fade"/);
  assert.match(content, /presentation:node-type="after-previous"/);
  assert.equal(
    (content.match(/<presentation:notes>/g) ?? []).length,
    deck.slides.length,
  );
  // Every style used is declared.
  const declared = new Set(
    [...content.matchAll(/style:name="([^"]+)"/g)].map((m) => m[1]),
  );
  for (const [, used] of content.matchAll(
    /(?:draw|text|presentation):style-name="([^"]+)"/g,
  ))
    assert.ok(declared.has(used), `style ${used}`);
});

test("HTML slides: one self-contained file, one section per slide", () => {
  const html = writeHtml(layout(DARK), images, meta(DARK));
  assert.match(html, /^<!doctype html>/);
  assert.equal(
    (html.match(/<section class="slide/g) ?? []).length,
    deck.slides.length,
  );
  assert.ok(!/(src|href)="https?:/.test(html), "no external resource");
  assert.match(html, /data:image\/png;base64,/);
  assert.match(html, /@keyframes e-rise/);
  assert.ok(html.includes("Autorités &lt;communales&gt; &amp; préfet"));
});

test("PDF slides: one 16:9 page per slide, annotations drawn", async () => {
  const pdf = await writePdfSlides(layout(LIGHT, false), images, meta(LIGHT), {
    facts: [
      {
        tool: "pen",
        color: "FF3B5C",
        width: 7,
        points: [
          [100, 100, 0.5],
          [300, 200, 0.8],
        ],
      },
    ],
  });
  const text = new TextDecoder("latin1").decode(pdf);
  assert.equal(text.slice(0, 5), "%PDF-");
  assert.equal(
    (text.match(/\/Type \/Page\b/g) ?? []).length,
    deck.slides.length,
  );
  assert.match(text, /\/MediaBox \[0 0 960\.?\d* 540\.?\d*\]/);
});

test("PNG writer: valid header and size", () => {
  const qr = qrPng("orion aic");
  assert.deepEqual(
    [...qr.bytes.subarray(0, 8)],
    [137, 80, 78, 71, 13, 10, 26, 10],
  );
  assert.deepEqual(pngSize(qr.bytes), { width: qr.width, height: qr.height });
});

test("colours typed in records never reach the files unchecked", async () => {
  const { hexColor, cssColor } = await import("../src/present/text.ts");
  assert.equal(hexColor("#3fdcff", "000000"), "3FDCFF");
  assert.equal(hexColor("#abc", "000000"), "AABBCC");
  assert.equal(hexColor("red", "112233"), "112233");
  assert.equal(hexColor('"><img src=//x>', "nope"), "808080");
  assert.equal(cssColor('a"b'), "");
  const hostile = '"><img src=//x>';
  const tainted = {
    ...journal,
    ops: {
      ...journal.ops,
      places: journal.ops.places.map((p, i) => ({
        ...p,
        color: i % 2 ? hostile : "red",
      })),
      cells: journal.ops.cells.map((c) => ({ ...c, color: 'a"b' })),
    },
  };
  const d = buildDeck(tainted, {
    at,
    live: true,
    presenter: "",
    full: tainted,
  });
  for (const s of d.slides) {
    if (s.kind === "map")
      for (const l of s.legend)
        for (const it of l.items) assert.equal(it.color, "");
    if (s.kind === "team") for (const c of s.cells) assert.equal(c.color, "");
  }
  const slides = layoutDeck(d, {
    palette: DARK,
    footer: "",
    images: new Set(),
    animations: true,
  });
  const html = writeHtml(slides, {}, meta(DARK));
  assert.ok(!html.includes("<img src=//x>"));
  for (const bytes of [
    writePptx(slides, {}, meta(DARK), true),
    writeOdp(slides, {}, meta(DARK), true),
  ]) {
    const files = unzipSync(bytes);
    for (const n of Object.keys(files).filter((n) => n.endsWith(".xml")))
      wellFormed(strFromU8(files[n]), n);
  }
  const pdf = await writePdfSlides(slides, {}, meta(DARK));
  assert.equal(new TextDecoder("latin1").decode(pdf.slice(0, 5)), "%PDF-");
});
