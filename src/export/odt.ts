import { xml } from "../../shared/interchange.ts";
import { XML_HEAD, qrPng, zip } from "./bytes.ts";
import { coverFacts, type Column, type Dossier } from "./dossier.ts";
import { DOCUMENT_ROWS, mapBytes, type DocumentOptions } from "./docx.ts";
import {
  ODF_NS,
  bookInfo,
  odfLanguage,
  odfManifest,
  odfMeta,
  odfText,
} from "./sheets.ts";
import { enumLabel } from "../../shared/i18n/enums.ts";
import { t } from "./i18n.ts";

// OpenDocument text (.odt) of a dossier: same content as the Word file.
// Named styles (Heading 1/2 with outline levels), table of contents, tables
// with repeated header rows, map images, header with a watermark shape,
// footer with the stamp and page numbers.

const INK = "#1b1f3a";
const MUTED = "#5f6680";
const ACCENT = "#5c45ff";

const p = (value: string, style = "Standard") =>
  `<text:p text:style-name="${style}">${odfText(value)}</text:p>`;

function table(
  name: string,
  columns: Column[],
  rows: string[][],
  widthCm: number,
  header = true,
  firstBold = false,
) {
  const sum = columns.reduce((n, c) => n + (c.weight ?? 1), 0);
  const cols = columns
    .map(
      (c, i) =>
        `<style:style style:name="${name}.C${i}" style:family="table-column"><style:table-column-properties style:column-width="${(((c.weight ?? 1) / sum) * widthCm).toFixed(2)}cm"/></style:style>`,
    )
    .join("");
  const cell = (value: string, style: string, paragraph: string) =>
    `<table:table-cell table:style-name="${style}" office:value-type="string">${
      value
        ? value
            .split("\n")
            .map((line) => p(line, paragraph))
            .join("")
        : `<text:p text:style-name="${paragraph}"/>`
    }</table:table-cell>`;
  const body = `<table:table table:name="${name}" table:style-name="${name}">${columns
    .map((_, i) => `<table:table-column table:style-name="${name}.C${i}"/>`)
    .join("")}${
    header
      ? `<table:table-header-rows><table:table-row>${columns.map((c) => cell(c.label, "CellHead", "Table_20_Heading")).join("")}</table:table-row></table:table-header-rows>`
      : ""
  }${rows
    .map(
      (r) =>
        `<table:table-row>${columns
          .map((_, i) =>
            cell(
              r[i] ?? "",
              firstBold && i === 0 ? "CellLabel" : "CellBody",
              firstBold && i === 0 ? "Table_20_Label" : "Table_20_Contents",
            ),
          )
          .join("")}</table:table-row>`,
    )
    .join("")}</table:table>`;
  const style = `<style:style style:name="${name}" style:family="table"><style:table-properties style:width="${widthCm.toFixed(2)}cm" table:align="margins" fo:margin-bottom="0.3cm"/></style:style>${cols}`;
  return { style, body };
}

const watermarkStyle = (size: number) =>
  `<style:style style:name="Watermark" style:family="graphic"><style:graphic-properties draw:stroke="none" draw:fill="none" draw:opacity="100%" draw:textarea-horizontal-align="center" draw:textarea-vertical-align="middle" style:run-through="background" style:wrap="run-through" style:number-wrapped-paragraphs="no-limit" style:vertical-pos="middle" style:vertical-rel="page" style:horizontal-pos="center" style:horizontal-rel="page" draw:wrap-influence-on-position="once-concurrent" style:flow-with-text="false"/></style:style><style:style style:name="WatermarkText" style:family="paragraph"><style:paragraph-properties fo:text-align="center"/><style:text-properties fo:font-size="${size}pt" fo:font-weight="bold" fo:color="#c9ccd8" style:font-name="Calibri"/></style:style>`;
const watermarkSize = (value: string, landscape: boolean) =>
  Math.min(
    80,
    Math.round(
      ((landscape ? 24 : 17) * 72) / 2.54 / Math.max(value.length, 6) / 0.62,
    ),
  );

/** Rotated by 40° around its corner, then moved so that it sits in the middle of the page. */
function watermark(value: string, landscape: boolean) {
  const w = landscape ? 24 : 17;
  const h = 4;
  return `<draw:custom-shape text:anchor-type="paragraph" draw:z-index="0" draw:name="Filigrane" draw:style-name="Watermark" draw:text-style-name="WatermarkText" svg:width="${w}cm" svg:height="${h}cm" draw:transform="rotate (0.6981317) translate (${landscape ? "2.6cm 15.7cm" : "0.9cm 17.8cm"})"><text:p text:style-name="WatermarkText">${xml(value)}</text:p><draw:enhanced-geometry svg:viewBox="0 0 21600 21600" draw:type="rectangle" draw:enhanced-path="M 0 0 L 21600 0 21600 21600 0 21600 0 0 Z N"/></draw:custom-shape>`;
}

export function dossierOdt(dossier: Dossier, o: DocumentOptions): Uint8Array {
  const mime = "application/vnd.oasis.opendocument.text";
  const landscape = o.orientation === "landscape";
  const page = landscape ? { w: 29.7, h: 21 } : { w: 21, h: 29.7 };
  const margin = 1.8;
  const width = page.w - margin * 2;
  const auto: string[] = [];
  const body: string[] = [];
  const pictures: Record<string, Uint8Array> = {};
  const types: [string, string][] = [];
  const qr = () => ({ data: qrPng(o.stamp.qr), ext: "png", mime: "image/png" });
  let n = 0;
  const image = (
    picture: { data: Uint8Array; ext: string; mime: string },
    wCm: number,
    hCm: number,
    name: string,
    style = "Standard",
  ) => {
    n++;
    const path = `Pictures/image${n}.${picture.ext}`;
    pictures[path] = picture.data;
    types.push([path, picture.mime]);
    return `<text:p text:style-name="${style}"><draw:frame draw:style-name="Picture" draw:name="${xml(name)} ${n}" text:anchor-type="as-char" svg:width="${wCm.toFixed(2)}cm" svg:height="${hCm.toFixed(2)}cm" draw:z-index="${n}"><draw:image xlink:href="${path}" xlink:type="simple" xlink:show="embed" xlink:actuate="onLoad"/><svg:title>${xml(name)}</svg:title></draw:frame></text:p>`;
  };
  let tables = 0;
  const addTable = (
    columns: Column[],
    rows: string[][],
    header = true,
    firstBold = false,
  ) => {
    const made = table(
      `Tableau${++tables}`,
      columns,
      rows,
      width,
      header,
      firstBold,
    );
    auto.push(made.style);
    body.push(made.body);
  };
  const c = dossier.cover;

  // Cover.
  body.push(p(`orion aic · ${t("dossier de l’opération")}`, "Kicker"));
  body.push(p(c.title, "Title"));
  body.push(
    p(
      [c.organization, c.location].filter(Boolean).join(" · ") || c.shown,
      "Subtitle",
    ),
  );
  if (o.watermark) body.push(p(o.watermark, "Mention"));
  addTable(
    [
      { label: t("Propriété"), weight: 1 },
      { label: t("Valeur"), weight: 2.6 },
    ],
    [
      ...coverFacts(c),
      [t("Document n°"), o.stamp.id],
      [t("Empreinte"), o.stamp.fingerprint],
    ],
    false,
    true,
  );
  body.push(image(qr(), 3, 3, t("QR de vérification")));
  body.push(
    p(
      `${t("Vérification : ce code identifie l’export et l’empreinte de son contenu. Dans orion aic, Traçabilité → Vérifier un document.")}\n${o.stamp.label}`,
      "Caption",
    ),
  );

  // Table of contents (LibreOffice updates the page numbers on demand).
  const index: string[] = [];
  const toc = (label: string, level: 1 | 2) =>
    index.push(p(label, level === 1 ? "Contents_20_1" : "Contents_20_2"));
  for (const ch of dossier.chapters) {
    toc(`${ch.number}. ${ch.title}`, 1);
    for (const b of ch.blocks)
      if (b.kind === "map") toc(t("Carte · {title}", { title: b.title }), 2);
      else if (b.kind === "table") toc(b.table.title, 2);
  }
  body.push(
    `<text:table-of-content text:style-name="Sect1" text:protected="true" text:name="Sommaire"><text:table-of-content-source text:outline-level="2" text:use-index-marks="false"><text:index-title-template text:style-name="Contents_20_Heading">${odfText(t("Sommaire"))}</text:index-title-template>${[
      1, 2,
    ]
      .map(
        (level) =>
          `<text:table-of-content-entry-template text:outline-level="${level}" text:style-name="Contents_20_${level}"><text:index-entry-link-start text:style-name="Index_20_Link"/><text:index-entry-text/><text:index-entry-tab-stop style:type="right" style:leader-char="."/><text:index-entry-page-number/><text:index-entry-link-end/></text:table-of-content-entry-template>`,
      )
      .join(
        "",
      )}</text:table-of-content-source><text:index-body><text:index-title text:style-name="Sect1" text:name="Sommaire_Head">${p(t("Sommaire"), "Contents_20_Heading")}</text:index-title>${index.join("")}</text:index-body></text:table-of-content>`,
  );

  // Chapters.
  for (const ch of dossier.chapters) {
    body.push(
      `<text:h text:style-name="Heading_20_1" text:outline-level="1">${odfText(`${ch.number}. ${ch.title}`)}</text:h>`,
    );
    if (ch.summary) body.push(p(ch.summary, "Summary"));
    for (const b of ch.blocks) {
      if (b.kind === "text") {
        body.push(
          `<text:h text:style-name="Heading_20_3" text:outline-level="3">${odfText(b.title)}</text:h>`,
        );
        body.push(...b.body.split("\n").map((line) => p(line)));
        if (b.meta) body.push(p(b.meta, "Caption"));
        continue;
      }
      const title =
        b.kind === "map"
          ? t("Carte · {title}", { title: b.title })
          : b.table.title;
      body.push(
        `<text:h text:style-name="Heading_20_2" text:outline-level="2">${odfText(title)}</text:h>`,
      );
      if (b.kind === "map") {
        const picture = o.maps[b.mapId];
        if (picture) {
          const size = picture;
          let w = width;
          let h = (w * size.height) / size.width;
          const max = page.h - 7;
          if (h > max) {
            w = (w * max) / h;
            h = max;
          }
          body.push(
            image(
              mapBytes(picture),
              w,
              h,
              t("Carte {title}", { title: b.title }),
              "Centered",
            ),
          );
        }
        body.push(
          p(
            [b.caption, picture?.attribution].filter(Boolean).join(" · "),
            "Caption",
          ),
        );
        continue;
      }
      const tbl = b.table;
      const view = tbl.compact ?? tbl;
      body.push(p(tbl.caption, "Caption"));
      const rows = view.rows.slice(0, DOCUMENT_ROWS);
      if (rows.length) addTable(view.columns, rows);
      else body.push(p(t("Aucun élément."), "Caption"));
      if (view.rows.length > rows.length)
        body.push(
          p(
            t(
              "… {n} lignes de plus dans les exports tableur (Excel, OpenDocument, CSV).",
              { n: view.rows.length - rows.length },
            ),
            "Caption",
          ),
        );
    }
  }

  // Verification at the end.
  body.push(
    `<text:h text:style-name="Heading_20_1" text:outline-level="1">${odfText(t("Vérification de ce document"))}</text:h>`,
  );
  body.push(
    p(
      t(
        "Ce document a été produit par orion aic. Son contenu a l’empreinte {fingerprint} ; l’export porte le numéro {id}. L’empreinte SHA-256 du fichier est inscrite au registre des exports de l’opération. Pour vérifier un exemplaire, déposez le fichier dans orion aic (Traçabilité → Vérifier un document) ou scannez le code ci-dessous.",
        { fingerprint: o.stamp.fingerprint, id: o.stamp.id },
      ),
    ),
  );
  body.push(image(qr(), 3, 3, t("QR de vérification")));
  body.push(p(o.stamp.label, "Caption"));

  const content = `${XML_HEAD}<office:document-content ${ODF_NS} office:version="1.3"><office:font-face-decls><style:font-face style:name="Calibri" svg:font-family="Calibri, Carlito" style:font-family-generic="swiss" style:font-pitch="variable"/></office:font-face-decls><office:automatic-styles><style:style style:name="Picture" style:family="graphic"><style:graphic-properties style:vertical-pos="top" style:vertical-rel="baseline" fo:border="none" style:mirror="none" fo:clip="rect(0cm, 0cm, 0cm, 0cm)" draw:luminance="0%" draw:contrast="0%" draw:red="0%" draw:green="0%" draw:blue="0%" draw:gamma="100%" draw:color-inversion="false" draw:image-opacity="100%" draw:color-mode="standard"/></style:style><style:style style:name="Sect1" style:family="section"><style:section-properties style:editable="false"><style:columns fo:column-count="1" fo:column-gap="0cm"/></style:section-properties></style:style><style:style style:name="CellHead" style:family="table-cell"><style:table-cell-properties fo:background-color="${INK}" fo:padding="0.08cm" fo:border="0.5pt solid #d4d8e4"/></style:style><style:style style:name="CellBody" style:family="table-cell"><style:table-cell-properties style:vertical-align="top" fo:padding="0.08cm" fo:border="0.5pt solid #d4d8e4"/></style:style><style:style style:name="CellLabel" style:family="table-cell"><style:table-cell-properties style:vertical-align="top" fo:background-color="#eef0f8" fo:padding="0.08cm" fo:border="0.5pt solid #d4d8e4"/></style:style>${auto.join("")}</office:automatic-styles><office:body><office:text>${body.join("")}</office:text></office:body></office:document-content>`;
  const paragraph = (
    name: string,
    display: string,
    props: string,
    text: string,
    extra = "",
  ) =>
    `<style:style style:name="${name}" style:display-name="${display}" style:family="paragraph" style:parent-style-name="Standard"${extra}><style:paragraph-properties ${props}/><style:text-properties ${text}/></style:style>`;
  const bold =
    'fo:font-weight="bold" style:font-weight-asian="bold" style:font-weight-complex="bold"';
  const styles = `${XML_HEAD}<office:document-styles ${ODF_NS} office:version="1.3"><office:font-face-decls><style:font-face style:name="Calibri" svg:font-family="Calibri, Carlito" style:font-family-generic="swiss" style:font-pitch="variable"/></office:font-face-decls><office:styles><style:default-style style:family="paragraph"><style:paragraph-properties style:tab-stop-distance="1.25cm"/><style:text-properties style:font-name="Calibri" fo:font-size="10pt" ${odfLanguage()} fo:hyphenate="false"/></style:default-style><style:default-style style:family="table"><style:table-properties table:border-model="collapsing"/></style:default-style><style:default-style style:family="graphic"><style:graphic-properties draw:shadow="hidden"/></style:default-style><style:style style:name="Standard" style:family="paragraph" style:class="text"><style:paragraph-properties fo:margin-top="0cm" fo:margin-bottom="0.14cm" fo:line-height="115%"/></style:style>${paragraph(
    "Heading",
    "Heading",
    'fo:margin-top="0.4cm" fo:margin-bottom="0.2cm" fo:keep-with-next="always"',
    `fo:color="${INK}" ${bold}`,
    ' style:next-style-name="Standard" style:class="text"',
  )}<style:style style:name="Heading_20_1" style:display-name="Heading 1" style:family="paragraph" style:parent-style-name="Heading" style:next-style-name="Standard" style:default-outline-level="1" style:class="text"><style:paragraph-properties fo:break-before="page" fo:margin-top="0cm" fo:margin-bottom="0.25cm" fo:border-bottom="1.5pt solid ${INK}" fo:padding-bottom="0.1cm"/><style:text-properties fo:font-size="18pt" ${bold}/></style:style><style:style style:name="Heading_20_2" style:display-name="Heading 2" style:family="paragraph" style:parent-style-name="Heading" style:next-style-name="Standard" style:default-outline-level="2" style:class="text"><style:paragraph-properties fo:margin-top="0.5cm" fo:margin-bottom="0.15cm"/><style:text-properties fo:font-size="12pt" ${bold}/></style:style><style:style style:name="Heading_20_3" style:display-name="Heading 3" style:family="paragraph" style:parent-style-name="Heading" style:next-style-name="Standard" style:default-outline-level="3" style:class="text"><style:paragraph-properties fo:margin-top="0.4cm" fo:margin-bottom="0.1cm"/><style:text-properties fo:font-size="11pt" ${bold}/></style:style>${paragraph(
    "Title",
    "Title",
    'fo:margin-top="2cm" fo:margin-bottom="0.2cm"',
    `fo:font-size="28pt" fo:color="${INK}" ${bold}`,
    ' style:class="chapter"',
  )}${paragraph("Subtitle", "Subtitle", 'fo:margin-bottom="0.5cm"', `fo:font-size="13pt" fo:color="${MUTED}"`, ' style:class="chapter"')}${paragraph(
    "Kicker",
    "Kicker",
    'fo:margin-bottom="0.1cm"',
    `fo:font-size="8pt" fo:color="${ACCENT}" fo:text-transform="uppercase" fo:letter-spacing="0.05cm" ${bold}`,
  )}${paragraph("Mention", "Mention", 'fo:margin-bottom="0.3cm"', `fo:font-size="12pt" fo:color="#b22222" ${bold}`)}${paragraph(
    "Summary",
    "Summary",
    'fo:margin-bottom="0.35cm" fo:background-color="#eef0f8" fo:padding="0.12cm"',
    `fo:font-size="10pt" fo:color="${INK}" ${bold}`,
  )}${paragraph("Caption", "Caption", 'fo:margin-top="0.05cm" fo:margin-bottom="0.25cm"', `fo:font-size="8pt" fo:color="${MUTED}"`, ' style:class="extra"')}${paragraph(
    "Centered",
    "Centered",
    'fo:text-align="center" fo:margin-bottom="0.1cm"',
    "",
  )}${paragraph("Table_20_Contents", "Table Contents", 'fo:margin-bottom="0cm" fo:line-height="100%"', 'fo:font-size="8pt"', ' style:class="extra"')}${paragraph(
    "Table_20_Label",
    "Table Label",
    'fo:margin-bottom="0cm" fo:line-height="100%"',
    `fo:font-size="8pt" ${bold}`,
    ' style:class="extra"',
  )}${paragraph("Table_20_Heading", "Table Heading", 'fo:margin-bottom="0cm" fo:line-height="100%" fo:keep-with-next="always"', `fo:font-size="8pt" fo:color="#ffffff" ${bold}`, ' style:class="extra"')}${paragraph(
    "Contents_20_Heading",
    "Contents Heading",
    'fo:break-before="page" fo:margin-bottom="0.3cm"',
    `fo:font-size="18pt" fo:color="${INK}" ${bold}`,
    ' style:class="index"',
  )}${paragraph("Contents_20_1", "Contents 1", `fo:margin-top="0.2cm" fo:margin-bottom="0.05cm"`, `fo:font-size="11pt" ${bold}`, ' style:class="index"')}${paragraph(
    "Contents_20_2",
    "Contents 2",
    'fo:margin-left="0.6cm" fo:margin-bottom="0.02cm"',
    `fo:font-size="9pt" fo:color="${MUTED}"`,
    ' style:class="index"',
  )}${paragraph("Header", "Header", 'fo:margin-bottom="0cm"', `fo:font-size="8pt" fo:color="${MUTED}"`, ' style:class="extra"')}${paragraph(
    "Footer",
    "Footer",
    'fo:margin-bottom="0cm"',
    `fo:font-size="7pt" fo:color="${MUTED}"`,
    ' style:class="extra"',
  )}<style:style style:name="Index_20_Link" style:display-name="Index Link" style:family="text"/>${watermarkStyle(watermarkSize(o.watermark, landscape))}</office:styles><office:automatic-styles><style:style style:name="HeaderTabs" style:family="paragraph" style:parent-style-name="Header"><style:paragraph-properties><style:tab-stops><style:tab-stop style:position="${width.toFixed(2)}cm" style:type="right"/></style:tab-stops></style:paragraph-properties></style:style><style:style style:name="FooterTabs" style:family="paragraph" style:parent-style-name="Footer"><style:paragraph-properties><style:tab-stops><style:tab-stop style:position="${width.toFixed(2)}cm" style:type="right"/></style:tab-stops></style:paragraph-properties></style:style><style:page-layout style:name="pm1"><style:page-layout-properties fo:page-width="${page.w}cm" fo:page-height="${page.h}cm" style:print-orientation="${landscape ? "landscape" : "portrait"}" fo:margin-top="1cm" fo:margin-bottom="1cm" fo:margin-left="${margin}cm" fo:margin-right="${margin}cm"/><style:header-style><style:header-footer-properties fo:min-height="0.8cm" fo:margin-bottom="0.4cm"/></style:header-style><style:footer-style><style:header-footer-properties fo:min-height="0.8cm" fo:margin-top="0.4cm"/></style:footer-style></style:page-layout></office:automatic-styles><office:master-styles><style:master-page style:name="Standard" style:page-layout-name="pm1"><style:header><text:p text:style-name="HeaderTabs">${o.watermark ? watermark(o.watermark, landscape) : ""}${odfText(`orion aic · ${c.title}`)}<text:tab/>${odfText(`${enumLabel(c.mode).toUpperCase()} · ${enumLabel(c.classification).toUpperCase()}`)}</text:p></style:header><style:footer><text:p text:style-name="FooterTabs">${odfText(o.stamp.label)}<text:tab/>${odfText(t("Page"))} <text:page-number text:select-page="current">1</text:page-number> / <text:page-count>1</text:page-count></text:p></style:footer></style:master-page></office:master-styles></office:document-styles>`;
  return zip(
    {
      mimetype: mime,
      "content.xml": content,
      "styles.xml": styles,
      "meta.xml": odfMeta(bookInfo(dossier, o.stamp, o.watermark)),
      ...pictures,
      "META-INF/manifest.xml": odfManifest(mime, types, false),
    },
    ["mimetype"],
  );
}
