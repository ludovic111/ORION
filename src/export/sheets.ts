import { xml } from "../../shared/interchange.ts";
import { XML_HEAD, zip } from "./bytes.ts";
import { coverFacts, tablesOf, type Column, type Dossier } from "./dossier.ts";
import type { DocumentStamp } from "./stamp.ts";
import { locale } from "../../shared/i18n/core.ts";
import { t } from "./i18n.ts";

// Spreadsheets: Excel (.xlsx, ECMA-376) and OpenDocument (.ods). One sheet
// per table of the dossier plus a cover sheet with the metadata and the
// stamp. Frozen header row, filters, column widths, printable pages. Every
// cell is literal text: nothing is ever evaluated as a formula.

export type SheetData = {
  name: string;
  columns: Column[];
  rows: string[][];
  /** Cover sheet: first column in bold, no filter. */
  cover?: boolean;
};
export type BookInfo = {
  title: string;
  subject: string;
  author: string;
  created: string;
  stamp: DocumentStamp;
  watermark: string;
};

const MAX_CELL = 32767;
const FORBIDDEN = /[\\/?*[\]:\u0000-\u001f\u007f]/g;

/** Longest start of a text within `max` UTF-16 units, whole characters only. */
function cut(value: string, max: number) {
  let out = "";
  for (const ch of value) {
    if (out.length + ch.length > max) break;
    out += ch;
  }
  return out;
}
/** A name without forbidden characters nor apostrophes at its ends. */
const clean = (value: string) =>
  value
    .replace(FORBIDDEN, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^'+|'+$/g, "")
    .trim();

/**
 * Valid, unique sheet names (Excel and OpenDocument): forbidden characters
 * removed and 31 units at most (whole characters) before deduplication.
 */
export function sheetNames(wanted: string[]): string[] {
  const used = new Set<string>();
  return wanted.map((w) => {
    let base = clean(cut(clean(w), 31)) || t("Feuille");
    // "History" is reserved by Excel.
    if (base.toLowerCase() === "history") base = t("Historique");
    let name = base;
    for (let i = 2; used.has(name.toLowerCase()); i++) {
      const suffix = ` (${i})`;
      name = `${clean(cut(base, 31 - suffix.length))}${suffix}`;
    }
    used.add(name.toLowerCase());
    return name;
  });
}

/** The sheets of a dossier: cover, then one per table. */
export function dossierSheets(
  dossier: Dossier,
  stamp: DocumentStamp,
  watermark: string,
): SheetData[] {
  const tables = tablesOf(dossier);
  const names = sheetNames([
    t("Couverture"),
    ...tables.map((x) => x.table.sheet),
  ]);
  const cover: SheetData = {
    name: names[0],
    cover: true,
    columns: [
      { label: t("Propriété"), weight: 1 },
      { label: t("Valeur"), weight: 3 },
    ],
    rows: [
      [t("Opération"), dossier.cover.title],
      ...coverFacts(dossier.cover),
      [t("Document n°"), stamp.id],
      [t("Empreinte du contenu"), stamp.fingerprint],
      [t("Vérification"), stamp.qr],
      ...(watermark ? [[t("Mention"), watermark]] : []),
      ["", ""],
      [t("Feuilles"), t("Contenu")],
      ...tables.map((x, i) => [
        names[i + 1],
        `${x.chapter.number}. ${x.chapter.title} · ${x.table.title} · ${x.table.caption}`,
      ]),
    ],
  };
  return [
    cover,
    ...tables.map((x, i) => ({
      name: names[i + 1],
      columns: x.table.columns,
      rows: x.table.rows,
    })),
  ];
}

/** Width of each column, in characters. */
function widths(sheet: SheetData): number[] {
  return sheet.columns.map((c, i) => {
    const sample = sheet.rows
      .slice(0, 400)
      .map((r) => Math.max(0, ...(r[i] ?? "").split("\n").map((l) => l.length)))
      .sort((a, b) => a - b);
    const typical = sample[Math.floor(sample.length * 0.9)] ?? 0;
    const min = (c.weight ?? 1) >= 3 ? 36 : 8;
    return Math.round(
      Math.min(64, Math.max(min, c.label.length + 3, typical + 2)),
    );
  });
}

export function colName(index: number): string {
  let name = "";
  for (index++; index > 0; index = Math.floor((index - 1) / 26))
    name = String.fromCharCode(65 + ((index - 1) % 26)) + name;
  return name;
}
const quoteSheet = (name: string) => `'${name.replaceAll("'", "''")}'`;
const cellText = (s: string) =>
  xml(s.length > MAX_CELL ? s.slice(0, MAX_CELL) : s);
const w3c = (iso: string) => iso.replace(/\.\d{3}Z$/, "Z");

// ---------- Excel ----------

const NS = {
  main: "http://schemas.openxmlformats.org/spreadsheetml/2006/main",
  r: "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
  pkg: "http://schemas.openxmlformats.org/package/2006/relationships",
  ct: "http://schemas.openxmlformats.org/package/2006/content-types",
};
const REL =
  "http://schemas.openxmlformats.org/officeDocument/2006/relationships";

/** Core and extended properties, shared with Word. */
export function docProps(info: BookInfo) {
  return {
    "docProps/core.xml": `${XML_HEAD}<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>${xml(info.title)}</dc:title><dc:subject>${xml(info.subject)}</dc:subject><dc:creator>${xml(info.author)}</dc:creator><cp:keywords>orion aic</cp:keywords><dc:description>${xml(info.stamp.label)}</dc:description><dc:identifier>${xml(info.stamp.qr)}</dc:identifier><cp:lastModifiedBy>${xml(info.author)}</cp:lastModifiedBy><dcterms:created xsi:type="dcterms:W3CDTF">${w3c(info.created)}</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">${w3c(info.created)}</dcterms:modified></cp:coreProperties>`,
    "docProps/app.xml": `${XML_HEAD}<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><Application>orion aic</Application><DocSecurity>0</DocSecurity><ScaleCrop>false</ScaleCrop><Company>${xml(info.subject)}</Company><LinksUpToDate>false</LinksUpToDate><SharedDoc>false</SharedDoc><HyperlinksChanged>false</HyperlinksChanged><AppVersion>16.0000</AppVersion></Properties>`,
  };
}
export const PROPS_RELS = `<Relationship Id="rIdCore" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rIdApp" Type="${REL}/extended-properties" Target="docProps/app.xml"/>`;
export const PROPS_TYPES = `<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>`;

const XLSX_STYLES = `${XML_HEAD}<styleSheet xmlns="${NS.main}"><fonts count="3"><font><sz val="10"/><color theme="1"/><name val="Calibri"/><family val="2"/><scheme val="minor"/></font><font><b/><sz val="10"/><color rgb="FFFFFFFF"/><name val="Calibri"/><family val="2"/><scheme val="minor"/></font><font><b/><sz val="10"/><color theme="1"/><name val="Calibri"/><family val="2"/><scheme val="minor"/></font></fonts><fills count="4"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF1B1F3A"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFEEF0F8"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left/><right/><top/><bottom style="thin"><color rgb="FFD4D8E4"/></bottom><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="5"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="49" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf><xf numFmtId="49" fontId="1" fillId="2" borderId="0" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf><xf numFmtId="49" fontId="2" fillId="3" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf><xf numFmtId="49" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles><dxfs count="0"/><tableStyles count="0" defaultTableStyle="TableStyleMedium2" defaultPivotStyle="PivotStyleLight16"/></styleSheet>`;

/**
 * Text of a header or footer section: & is a code there (written &&) and a
 * whole header or footer holds 255 characters at most. Cut the raw text by
 * whole characters first, then escape it for XML.
 */
const hf = (s: string, max: number) => {
  let out = "";
  for (const ch of s.replace(/[\u0000-\u001f]/g, " ")) {
    const piece = ch === "&" ? "&&" : ch;
    if (out.length + piece.length > max) break;
    out += piece;
  }
  return xml(out);
};

function xlsxSheet(sheet: SheetData, info: BookInfo, first: boolean) {
  const last = colName(Math.max(sheet.columns.length, 1) - 1);
  const height = sheet.rows.length + 1;
  const row = (values: string[], r: number, style: (c: number) => number) =>
    `<row r="${r}">${values
      .map((v, c) =>
        v
          ? `<c r="${colName(c)}${r}" s="${style(c)}" t="inlineStr"><is><t xml:space="preserve">${cellText(v)}</t></is></c>`
          : `<c r="${colName(c)}${r}" s="${style(c)}"/>`,
      )
      .join("")}</row>`;
  const body = [
    row(
      sheet.columns.map((c) => c.label),
      1,
      () => 2,
    ),
    ...sheet.rows.map((values, i) =>
      row(values, i + 2, (c) =>
        sheet.cover && c === 0 ? 3 : sheet.cover ? 4 : 1,
      ),
    ),
  ].join("");
  const cols = widths(sheet)
    .map(
      (w, i) =>
        `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`,
    )
    .join("");
  const landscape = sheet.columns.length > 5;
  return `${XML_HEAD}<worksheet xmlns="${NS.main}" xmlns:r="${NS.r}"><sheetPr><pageSetUpPr fitToPage="1"/></sheetPr><dimension ref="A1:${last}${height}"/><sheetViews><sheetView ${first ? 'tabSelected="1" ' : ""}workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/><selection pane="bottomLeft" activeCell="A2" sqref="A2"/></sheetView></sheetViews><sheetFormatPr defaultRowHeight="15"/><cols>${cols}</cols><sheetData>${body}</sheetData>${sheet.cover ? "" : `<autoFilter ref="A1:${last}${height}"/>`}<pageMargins left="0.4" right="0.4" top="0.7" bottom="0.7" header="0.3" footer="0.3"/><pageSetup paperSize="9" orientation="${landscape ? "landscape" : "portrait"}" fitToWidth="1" fitToHeight="0"/><headerFooter><oddHeader>&amp;L${hf(info.title, 180)}&amp;R${hf(info.watermark, 60)}</oddHeader><oddFooter>&amp;L${hf(info.stamp.label, 200)}&amp;R${hf(t("Page"), 20)} &amp;P / &amp;N</oddFooter></headerFooter></worksheet>`;
}

export function xlsxBook(sheets: SheetData[], info: BookInfo): Uint8Array {
  const n = sheets.length;
  const parts: Record<string, string> = {
    "[Content_Types].xml": `${XML_HEAD}<Types xmlns="${NS.ct}"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${sheets
      .map(
        (_, i) =>
          `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`,
      )
      .join("")}${PROPS_TYPES}</Types>`,
    "_rels/.rels": `${XML_HEAD}<Relationships xmlns="${NS.pkg}"><Relationship Id="rId1" Type="${REL}/officeDocument" Target="xl/workbook.xml"/>${PROPS_RELS}</Relationships>`,
    ...docProps(info),
    "xl/workbook.xml": `${XML_HEAD}<workbook xmlns="${NS.main}" xmlns:r="${NS.r}"><workbookPr/><bookViews><workbookView xWindow="0" yWindow="0" windowWidth="28800" windowHeight="16000" activeTab="0"/></bookViews><sheets>${sheets
      .map(
        (s, i) =>
          `<sheet name="${xml(s.name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`,
      )
      .join("")}</sheets><definedNames>${sheets
      .map((s, i) =>
        s.cover
          ? ""
          : `<definedName name="_xlnm._FilterDatabase" localSheetId="${i}" hidden="1">${xml(quoteSheet(s.name))}!$A$1:$${colName(s.columns.length - 1)}$${s.rows.length + 1}</definedName>`,
      )
      .join("")}${sheets
      .map(
        (s, i) =>
          `<definedName name="_xlnm.Print_Titles" localSheetId="${i}">${xml(quoteSheet(s.name))}!$1:$1</definedName>`,
      )
      .join("")}</definedNames></workbook>`,
    "xl/_rels/workbook.xml.rels": `${XML_HEAD}<Relationships xmlns="${NS.pkg}">${sheets
      .map(
        (_, i) =>
          `<Relationship Id="rId${i + 1}" Type="${REL}/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`,
      )
      .join(
        "",
      )}<Relationship Id="rId${n + 1}" Type="${REL}/styles" Target="styles.xml"/></Relationships>`,
    "xl/styles.xml": XLSX_STYLES,
  };
  sheets.forEach((s, i) => {
    parts[`xl/worksheets/sheet${i + 1}.xml`] = xlsxSheet(s, info, i === 0);
  });
  return zip(parts);
}

// ---------- OpenDocument ----------

const ODF_NS = `xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" xmlns:style="urn:oasis:names:tc:opendocument:xmlns:style:1.0" xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0" xmlns:table="urn:oasis:names:tc:opendocument:xmlns:table:1.0" xmlns:draw="urn:oasis:names:tc:opendocument:xmlns:drawing:1.0" xmlns:fo="urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:meta="urn:oasis:names:tc:opendocument:xmlns:meta:1.0" xmlns:number="urn:oasis:names:tc:opendocument:xmlns:datastyle:1.0" xmlns:svg="urn:oasis:names:tc:opendocument:xmlns:svg-compatible:1.0" xmlns:config="urn:oasis:names:tc:opendocument:xmlns:config:1.0"`;
export { ODF_NS };

/** Paragraphs of a text in ODF: line breaks, tabs and repeated spaces. */
export function odfText(value: string): string {
  return xml(value)
    .replaceAll("\t", "<text:tab/>")
    .replaceAll("\n", "<text:line-break/>")
    .replace(/ {2,}/g, (m) => ` <text:s text:c="${m.length - 1}"/>`);
}

/** Language attributes of an OpenDocument style: the language of the post. */
export function odfLanguage() {
  const [language, country] = locale().split("-");
  return `fo:language="${language}" fo:country="${country}"`;
}

export function odfMeta(info: BookInfo) {
  return `${XML_HEAD}<office:document-meta ${ODF_NS} office:version="1.3"><office:meta><meta:generator>orion aic</meta:generator><dc:title>${xml(info.title)}</dc:title><dc:subject>${xml(info.subject)}</dc:subject><dc:description>${xml(info.stamp.label)}</dc:description><meta:keyword>orion aic</meta:keyword><meta:initial-creator>${xml(info.author)}</meta:initial-creator><dc:creator>${xml(info.author)}</dc:creator><meta:creation-date>${w3c(info.created).replace("Z", "")}</meta:creation-date><dc:date>${w3c(info.created).replace("Z", "")}</dc:date><meta:user-defined meta:name="${xml(t("Vérification"))}">${xml(info.stamp.qr)}</meta:user-defined></office:meta></office:document-meta>`;
}

export function odfManifest(
  mime: string,
  extra: [string, string][] = [],
  settings = true,
) {
  return `${XML_HEAD}<manifest:manifest xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0" manifest:version="1.3"><manifest:file-entry manifest:full-path="/" manifest:version="1.3" manifest:media-type="${mime}"/><manifest:file-entry manifest:full-path="content.xml" manifest:media-type="text/xml"/><manifest:file-entry manifest:full-path="styles.xml" manifest:media-type="text/xml"/><manifest:file-entry manifest:full-path="meta.xml" manifest:media-type="text/xml"/>${settings ? '<manifest:file-entry manifest:full-path="settings.xml" manifest:media-type="text/xml"/>' : ""}${extra
    .map(
      ([path, type]) =>
        `<manifest:file-entry manifest:full-path="${path}" manifest:media-type="${type}"/>`,
    )
    .join("")}</manifest:manifest>`;
}

const cm = (chars: number) => `${(chars * 0.2 + 0.3).toFixed(2)}cm`;
const cellAddress = (sheet: string, col: number, row: number) =>
  `${quoteSheet(sheet)}.${colName(col)}${row}`;

export function odsBook(sheets: SheetData[], info: BookInfo): Uint8Array {
  const mime = "application/vnd.oasis.opendocument.spreadsheet";
  const columnStyles = new Map<string, string>();
  const columnStyle = (width: string) => {
    if (!columnStyles.has(width))
      columnStyles.set(width, `co${columnStyles.size + 1}`);
    return columnStyles.get(width)!;
  };
  const cell = (value: string, style: string) =>
    value
      ? `<table:table-cell table:style-name="${style}" office:value-type="string" calcext:value-type="string"><text:p>${odfText(value.slice(0, MAX_CELL))}</text:p></table:table-cell>`
      : `<table:table-cell table:style-name="${style}"/>`;
  const tables = sheets
    .map((s) => {
      const columns = widths(s)
        .map(
          (w, i) =>
            `<table:table-column table:style-name="${columnStyle(cm(w))}" table:default-cell-style-name="${s.cover && i === 0 ? "ceLabel" : "ceBody"}"/>`,
        )
        .join("");
      const head = `<table:table-header-rows><table:table-row table:style-name="roHead">${s.columns.map((c) => cell(c.label, "ceHead")).join("")}</table:table-row></table:table-header-rows>`;
      const rows = s.rows
        .map(
          (r) =>
            `<table:table-row table:style-name="roBody">${s.columns
              .map((_, c) =>
                cell(r[c] ?? "", s.cover && c === 0 ? "ceLabel" : "ceBody"),
              )
              .join("")}</table:table-row>`,
        )
        .join("");
      return `<table:table table:name="${xml(s.name)}" table:style-name="ta1">${columns}${head}${rows}</table:table>`;
    })
    .join("");
  const ranges = sheets
    .map((s, i) =>
      s.cover
        ? ""
        : `<table:database-range table:name="__Anonymous_Sheet_DB__${i}" table:target-range-address="${xml(`${cellAddress(s.name, 0, 1)}:${cellAddress(s.name, s.columns.length - 1, s.rows.length + 1)}`)}" table:display-filter-buttons="true"/>`,
    )
    .join("");
  const content = `${XML_HEAD}<office:document-content ${ODF_NS} xmlns:calcext="urn:org:documentfoundation:names:experimental:calc:xmlns:calcext:1.0" office:version="1.3"><office:font-face-decls><style:font-face style:name="Calibri" svg:font-family="Calibri, Carlito" style:font-family-generic="swiss"/></office:font-face-decls><office:automatic-styles>${[
    ...columnStyles,
  ]
    .map(
      ([width, name]) =>
        `<style:style style:name="${name}" style:family="table-column"><style:table-column-properties fo:break-before="auto" style:column-width="${width}"/></style:style>`,
    )
    .join(
      "",
    )}<style:style style:name="roHead" style:family="table-row"><style:table-row-properties style:row-height="0.7cm" fo:break-before="auto" style:use-optimal-row-height="false"/></style:style><style:style style:name="roBody" style:family="table-row"><style:table-row-properties fo:break-before="auto" style:use-optimal-row-height="true"/></style:style><style:style style:name="ta1" style:family="table" style:master-page-name="Default"><style:table-properties table:display="true" style:writing-mode="lr-tb"/></style:style><style:style style:name="ceHead" style:family="table-cell" style:parent-style-name="Default"><style:table-cell-properties fo:background-color="#1b1f3a" style:vertical-align="middle" fo:wrap-option="wrap" fo:padding="0.06cm"/><style:text-properties fo:color="#ffffff" fo:font-weight="bold" style:font-weight-asian="bold" style:font-weight-complex="bold"/></style:style><style:style style:name="ceBody" style:family="table-cell" style:parent-style-name="Default"><style:table-cell-properties style:vertical-align="top" fo:wrap-option="wrap" fo:border-bottom="0.5pt solid #d4d8e4" fo:padding="0.04cm"/></style:style><style:style style:name="ceLabel" style:family="table-cell" style:parent-style-name="Default"><style:table-cell-properties fo:background-color="#eef0f8" style:vertical-align="top" fo:wrap-option="wrap" fo:border-bottom="0.5pt solid #d4d8e4" fo:padding="0.04cm"/><style:text-properties fo:font-weight="bold" style:font-weight-asian="bold" style:font-weight-complex="bold"/></style:style></office:automatic-styles><office:body><office:spreadsheet>${tables}<table:database-ranges>${ranges}</table:database-ranges></office:spreadsheet></office:body></office:document-content>`;
  const styles = `${XML_HEAD}<office:document-styles ${ODF_NS} office:version="1.3"><office:font-face-decls><style:font-face style:name="Calibri" svg:font-family="Calibri, Carlito" style:font-family-generic="swiss"/></office:font-face-decls><office:styles><style:default-style style:family="table-cell"><style:paragraph-properties style:tab-stop-distance="1.25cm"/><style:text-properties style:font-name="Calibri" fo:font-size="10pt" ${odfLanguage()}/></style:default-style><style:style style:name="Default" style:family="table-cell"/></office:styles><office:automatic-styles><style:page-layout style:name="pm1"><style:page-layout-properties fo:page-width="29.7cm" fo:page-height="21cm" style:print-orientation="landscape" fo:margin-top="1cm" fo:margin-bottom="1cm" fo:margin-left="1cm" fo:margin-right="1cm" style:scale-to-X="1" style:scale-to-Y="0" style:print-page-order="ttb"/><style:header-style><style:header-footer-properties fo:min-height="0.6cm" fo:margin-bottom="0.2cm"/></style:header-style><style:footer-style><style:header-footer-properties fo:min-height="0.6cm" fo:margin-top="0.2cm"/></style:footer-style></style:page-layout></office:automatic-styles><office:master-styles><style:master-page style:name="Default" style:page-layout-name="pm1"><style:header><style:region-left><text:p>${xml(info.title)}</text:p></style:region-left><style:region-right><text:p>${xml(info.watermark)}</text:p></style:region-right></style:header><style:footer><style:region-left><text:p>${xml(info.stamp.label)}</text:p></style:region-left><style:region-right><text:p>${odfText(t("Page"))} <text:page-number>1</text:page-number> / <text:page-count>1</text:page-count></text:p></style:region-right></style:footer></style:master-page></office:master-styles></office:document-styles>`;
  const item = (name: string, type: string, value: string | number) =>
    `<config:config-item config:name="${name}" config:type="${type}">${value}</config:config-item>`;
  const settings = `${XML_HEAD}<office:document-settings ${ODF_NS} office:version="1.3"><office:settings><config:config-item-set config:name="ooo:view-settings"><config:config-item-map-indexed config:name="Views"><config:config-item-map-entry>${item("ViewId", "string", "view1")}<config:config-item-map-named config:name="Tables">${sheets
    .map(
      (s) =>
        `<config:config-item-map-entry config:name="${xml(s.name)}">${item("CursorPositionX", "int", 0)}${item("CursorPositionY", "int", 1)}${item("HorizontalSplitMode", "short", 0)}${item("VerticalSplitMode", "short", 2)}${item("HorizontalSplitPosition", "int", 0)}${item("VerticalSplitPosition", "int", 1)}${item("ActiveSplitRange", "short", 2)}${item("PositionLeft", "int", 0)}${item("PositionRight", "int", 0)}${item("PositionTop", "int", 0)}${item("PositionBottom", "int", 1)}</config:config-item-map-entry>`,
    )
    .join(
      "",
    )}</config:config-item-map-named>${item("ActiveTable", "string", xml(sheets[0].name))}</config:config-item-map-entry></config:config-item-map-indexed></config:config-item-set></office:settings></office:document-settings>`;
  return zip(
    {
      mimetype: mime,
      "content.xml": content,
      "styles.xml": styles,
      "meta.xml": odfMeta(info),
      "settings.xml": settings,
      "META-INF/manifest.xml": odfManifest(mime),
    },
    ["mimetype"],
  );
}

/** Book information of a dossier. */
export const bookInfo = (
  dossier: Dossier,
  stamp: DocumentStamp,
  watermark: string,
): BookInfo => ({
  title: dossier.cover.title,
  subject: [dossier.cover.organization, dossier.cover.shown]
    .filter(Boolean)
    .join(" · "),
  author: dossier.cover.author,
  created: dossier.cover.exportedAt,
  stamp,
  watermark,
});

export const dossierXlsx = (
  dossier: Dossier,
  stamp: DocumentStamp,
  watermark: string,
) =>
  xlsxBook(
    dossierSheets(dossier, stamp, watermark),
    bookInfo(dossier, stamp, watermark),
  );
export const dossierOds = (
  dossier: Dossier,
  stamp: DocumentStamp,
  watermark: string,
) =>
  odsBook(
    dossierSheets(dossier, stamp, watermark),
    bookInfo(dossier, stamp, watermark),
  );
