import { xml } from "../../shared/interchange.ts";
import { XML_HEAD, qrPng, zip } from "./bytes.ts";
import { coverFacts, type Column, type Dossier } from "./dossier.ts";
import { PROPS_RELS, PROPS_TYPES, bookInfo, docProps } from "./sheets.ts";
import type { DocumentStamp } from "./stamp.ts";
import { locale } from "../../shared/i18n/core.ts";
import { enumLabel } from "../../shared/i18n/enums.ts";
import { t } from "./i18n.ts";

// Word document (.docx, ECMA-376 transitional) of a dossier: real styles
// (Title, Heading 1/2, tables with repeated header rows), table of contents
// field, embedded map images, header with the watermark shape and footer
// with the stamp and page numbers.

export type MapPicture = {
  png: Uint8Array;
  /** Same picture in JPEG, much lighter in a PDF (optional). */
  jpeg?: Uint8Array;
  width: number;
  height: number;
  attribution: string;
};
export type DocumentOptions = {
  stamp: DocumentStamp;
  watermark: string;
  orientation: "portrait" | "landscape";
  /** Map images by map id ("" for the main map). */
  maps: Record<string, MapPicture>;
};

/** Bytes of a map for a document: the JPEG copy when there is one. */
export const mapBytes = (m: MapPicture) =>
  m.jpeg
    ? { data: m.jpeg, ext: "jpeg", mime: "image/jpeg" }
    : { data: m.png, ext: "png", mime: "image/png" };

/** Longest tables are cut in documents; spreadsheets keep every row. */
export const DOCUMENT_ROWS = 20_000;

const NS_W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
const NS_R =
  "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
const REL = NS_R;
const NAMESPACES = `xmlns:w="${NS_W}" xmlns:r="${NS_R}" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w10="urn:schemas-microsoft-com:office:word"`;

const INK = "1B1F3A";
const MUTED = "5F6680";
const ACCENT = "5C45FF";

// ---------- Runs and paragraphs ----------

type RunStyle = {
  bold?: boolean;
  color?: string;
  size?: number;
  style?: string;
};
function run(text: string, s: RunStyle = {}) {
  const props = [
    s.style && `<w:rStyle w:val="${s.style}"/>`,
    s.bold && "<w:b/><w:bCs/>",
    s.color && `<w:color w:val="${s.color}"/>`,
    s.size && `<w:sz w:val="${s.size * 2}"/><w:szCs w:val="${s.size * 2}"/>`,
  ]
    .filter(Boolean)
    .join("");
  const body = text
    .split("\n")
    .map((line) => `<w:t xml:space="preserve">${xml(line)}</w:t>`)
    .join("<w:br/>");
  return `<w:r>${props ? `<w:rPr>${props}</w:rPr>` : ""}${body}</w:r>`;
}
function para(content: string, style = "", extra = "") {
  const props = `${style ? `<w:pStyle w:val="${style}"/>` : ""}${extra}`;
  return `<w:p>${props ? `<w:pPr>${props}</w:pPr>` : ""}${content}</w:p>`;
}
const text = (value: string, style = "", s: RunStyle = {}) =>
  para(value ? run(value, s) : "", style);

let bookmark = 0;
const heading = (value: string, level: 1 | 2, anchor: string) => {
  const id = ++bookmark;
  return para(
    `<w:bookmarkStart w:id="${id}" w:name="${anchor}"/>${run(value)}<w:bookmarkEnd w:id="${id}"/>`,
    `Heading${level}`,
  );
};

// ---------- Tables ----------

function gridWidths(columns: Column[], total: number) {
  const sum = columns.reduce((n, c) => n + (c.weight ?? 1), 0);
  return columns.map((c) => Math.floor(((c.weight ?? 1) / sum) * total));
}
function table(
  columns: Column[],
  rows: string[][],
  width: number,
  header = true,
  firstBold = false,
) {
  const grid = gridWidths(columns, width);
  const cell = (value: string, i: number, head: boolean) =>
    `<w:tc><w:tcPr><w:tcW w:w="${grid[i]}" w:type="dxa"/>${head ? `<w:shd w:val="clear" w:color="auto" w:fill="${INK}"/>` : firstBold && i === 0 ? '<w:shd w:val="clear" w:color="auto" w:fill="EEF0F8"/>' : ""}</w:tcPr>${text(value, head ? "TableHead" : "TableText", firstBold && i === 0 ? { bold: true } : {})}</w:tc>`;
  const border = (side: string) =>
    `<w:${side} w:val="single" w:sz="4" w:space="0" w:color="D4D8E4"/>`;
  return `<w:tbl><w:tblPr><w:tblW w:w="${width}" w:type="dxa"/><w:tblBorders>${["top", "left", "bottom", "right", "insideH", "insideV"].map(border).join("")}</w:tblBorders><w:tblLayout w:type="fixed"/><w:tblCellMar><w:top w:w="40" w:type="dxa"/><w:left w:w="80" w:type="dxa"/><w:bottom w:w="40" w:type="dxa"/><w:right w:w="80" w:type="dxa"/></w:tblCellMar><w:tblLook w:val="04A0" w:firstRow="1" w:lastRow="0" w:firstColumn="0" w:lastColumn="0" w:noHBand="0" w:noVBand="1"/></w:tblPr><w:tblGrid>${grid.map((w) => `<w:gridCol w:w="${w}"/>`).join("")}</w:tblGrid>${
    header
      ? `<w:tr><w:trPr><w:cantSplit/><w:tblHeader/></w:trPr>${columns.map((c, i) => cell(c.label, i, true)).join("")}</w:tr>`
      : ""
  }${rows
    .map(
      (r) =>
        `<w:tr><w:trPr><w:cantSplit/></w:trPr>${columns.map((_, i) => cell(r[i] ?? "", i, false)).join("")}</w:tr>`,
    )
    .join("")}</w:tbl>`;
}

// ---------- Pictures ----------

const EMU_PER_TWIP = 635;
function picture(
  rid: string,
  id: number,
  name: string,
  cx: number,
  cy: number,
  description: string,
) {
  return `<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${cx}" cy="${cy}"/><wp:effectExtent l="0" t="0" r="0" b="0"/><wp:docPr id="${id}" name="${xml(name)}" descr="${xml(description)}"/><wp:cNvGraphicFramePr><a:graphicFrameLocks noChangeAspect="1"/></wp:cNvGraphicFramePr><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic><pic:nvPicPr><pic:cNvPr id="${id}" name="${xml(name)}"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="${rid}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>`;
}

// ---------- Header, footer, watermark ----------

// Standard text-path shape type (as written by Word for its watermarks).
const TEXT_SHAPE = `<v:shapetype id="_x0000_t136" coordsize="21600,21600" o:spt="136" adj="10800" path="m@7,l@8,m@5,21600l@6,21600e"><v:formulas><v:f eqn="sum #0 0 10800"/><v:f eqn="prod #0 2 1"/><v:f eqn="sum 21600 0 @1"/><v:f eqn="sum 0 0 @2"/><v:f eqn="sum 21600 0 @3"/><v:f eqn="if @0 @3 0"/><v:f eqn="if @0 21600 @1"/><v:f eqn="if @0 0 @2"/><v:f eqn="if @0 @4 21600"/><v:f eqn="mid @5 @6"/><v:f eqn="mid @8 @5"/><v:f eqn="mid @7 @8"/><v:f eqn="mid @6 @7"/><v:f eqn="sum @6 0 @5"/></v:formulas><v:path textpathok="t" o:connecttype="custom" o:connectlocs="@9,0;@10,10800;@11,21600;@12,10800" o:connectangles="270,180,90,0"/><v:textpath on="t" fitshape="t"/><v:handles><v:h position="#0,bottomRight" xrange="6629,14971"/></v:handles><o:lock v:ext="edit" text="t" shapetype="t"/></v:shapetype>`;

function watermarkRun(value: string, landscape: boolean) {
  const width = landscape ? 640 : 470;
  const height = Math.round(width / Math.max(4, value.length * 0.62));
  return `<w:r><w:rPr><w:noProof/></w:rPr><w:pict>${TEXT_SHAPE}<v:shape id="PowerPlusWaterMarkObject1" o:spid="_x0000_s1025" type="#_x0000_t136" style="position:absolute;margin-left:0;margin-top:0;width:${width}pt;height:${height}pt;rotation:315;z-index:-251657216;mso-position-horizontal:center;mso-position-horizontal-relative:margin;mso-position-vertical:center;mso-position-vertical-relative:margin" o:allowincell="f" fillcolor="#b4b8c8" stroked="f"><v:fill opacity=".35"/><v:textpath style="font-family:&quot;Calibri&quot;;font-size:1pt;font-weight:bold" string="${xml(value)}"/><w10:wrap anchorx="margin" anchory="margin"/></v:shape></w:pict></w:r>`;
}

// ---------- Styles ----------

const rPr = (size: number, color = "", bold = false) =>
  `<w:rPr>${bold ? "<w:b/><w:bCs/>" : ""}${color ? `<w:color w:val="${color}"/>` : ""}<w:sz w:val="${size * 2}"/><w:szCs w:val="${size * 2}"/></w:rPr>`;
// Functions, not constants: the language of the post can change.
const styles = () =>
  `${XML_HEAD}<w:styles xmlns:w="${NS_W}"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:eastAsia="Calibri" w:cs="Calibri"/><w:sz w:val="20"/><w:szCs w:val="20"/><w:lang w:val="${locale()}" w:eastAsia="en-US" w:bidi="ar-SA"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="80" w:line="264" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>
<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style>
<w:style w:type="character" w:default="1" w:styleId="DefaultParagraphFont"><w:name w:val="Default Paragraph Font"/><w:uiPriority w:val="1"/><w:semiHidden/><w:unhideWhenUsed/></w:style>
<w:style w:type="table" w:default="1" w:styleId="TableNormal"><w:name w:val="Normal Table"/><w:uiPriority w:val="99"/><w:semiHidden/><w:unhideWhenUsed/><w:tblPr><w:tblInd w:w="0" w:type="dxa"/><w:tblCellMar><w:top w:w="0" w:type="dxa"/><w:left w:w="108" w:type="dxa"/><w:bottom w:w="0" w:type="dxa"/><w:right w:w="108" w:type="dxa"/></w:tblCellMar></w:tblPr></w:style>
<w:style w:type="numbering" w:default="1" w:styleId="NoList"><w:name w:val="No List"/><w:uiPriority w:val="99"/><w:semiHidden/><w:unhideWhenUsed/></w:style>
<w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:uiPriority w:val="10"/><w:qFormat/><w:pPr><w:spacing w:before="600" w:after="120"/></w:pPr>${rPr(28, INK, true)}</w:style>
<w:style w:type="paragraph" w:styleId="Subtitle"><w:name w:val="Subtitle"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:uiPriority w:val="11"/><w:qFormat/><w:pPr><w:spacing w:after="240"/></w:pPr>${rPr(13, MUTED)}</w:style>
<w:style w:type="paragraph" w:styleId="Kicker"><w:name w:val="Kicker"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:spacing w:before="0" w:after="60"/></w:pPr><w:rPr><w:b/><w:bCs/><w:caps/><w:color w:val="${ACCENT}"/><w:spacing w:val="20"/><w:sz w:val="16"/><w:szCs w:val="16"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:uiPriority w:val="9"/><w:qFormat/><w:pPr><w:keepNext/><w:keepLines/><w:pageBreakBefore/><w:pBdr><w:bottom w:val="single" w:sz="8" w:space="4" w:color="${INK}"/></w:pBdr><w:spacing w:before="0" w:after="120"/><w:outlineLvl w:val="0"/></w:pPr>${rPr(18, INK, true)}</w:style>
<w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:uiPriority w:val="9"/><w:unhideWhenUsed/><w:qFormat/><w:pPr><w:keepNext/><w:keepLines/><w:spacing w:before="280" w:after="80"/><w:outlineLvl w:val="1"/></w:pPr>${rPr(12, INK, true)}</w:style>
<w:style w:type="paragraph" w:styleId="Caption"><w:name w:val="caption"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:uiPriority w:val="35"/><w:unhideWhenUsed/><w:qFormat/><w:pPr><w:spacing w:before="40" w:after="160"/></w:pPr>${rPr(8, MUTED)}</w:style>
<w:style w:type="paragraph" w:styleId="Summary"><w:name w:val="Summary"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:shd w:val="clear" w:color="auto" w:fill="EEF0F8"/><w:spacing w:before="60" w:after="200"/></w:pPr>${rPr(10, INK, true)}</w:style>
<w:style w:type="paragraph" w:styleId="TableHead"><w:name w:val="Table Heading"/><w:basedOn w:val="Normal"/><w:qFormat/><w:pPr><w:keepNext/><w:spacing w:after="0" w:line="240" w:lineRule="auto"/></w:pPr>${rPr(8, "FFFFFF", true)}</w:style>
<w:style w:type="paragraph" w:styleId="TableText"><w:name w:val="Table Text"/><w:basedOn w:val="Normal"/><w:qFormat/><w:pPr><w:spacing w:after="0" w:line="240" w:lineRule="auto"/></w:pPr>${rPr(8)}</w:style>
<w:style w:type="paragraph" w:styleId="TOCHeading"><w:name w:val="TOC Heading"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:uiPriority w:val="39"/><w:unhideWhenUsed/><w:qFormat/><w:pPr><w:keepNext/><w:pageBreakBefore/><w:spacing w:after="160"/></w:pPr>${rPr(18, INK, true)}</w:style>
<w:style w:type="paragraph" w:styleId="TOC1"><w:name w:val="toc 1"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:uiPriority w:val="39"/><w:unhideWhenUsed/><w:pPr><w:spacing w:before="120" w:after="40"/></w:pPr>${rPr(11, INK, true)}</w:style>
<w:style w:type="paragraph" w:styleId="TOC2"><w:name w:val="toc 2"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:uiPriority w:val="39"/><w:unhideWhenUsed/><w:pPr><w:spacing w:after="20"/><w:ind w:left="400"/></w:pPr>${rPr(9, MUTED)}</w:style>
<w:style w:type="paragraph" w:styleId="Header"><w:name w:val="header"/><w:basedOn w:val="Normal"/><w:uiPriority w:val="99"/><w:unhideWhenUsed/><w:pPr><w:tabs><w:tab w:val="center" w:pos="4536"/><w:tab w:val="right" w:pos="9072"/></w:tabs><w:spacing w:after="0"/></w:pPr>${rPr(8, MUTED)}</w:style>
<w:style w:type="paragraph" w:styleId="Footer"><w:name w:val="footer"/><w:basedOn w:val="Normal"/><w:uiPriority w:val="99"/><w:unhideWhenUsed/><w:pPr><w:tabs><w:tab w:val="center" w:pos="4536"/><w:tab w:val="right" w:pos="9072"/></w:tabs><w:spacing w:after="0"/></w:pPr>${rPr(7, MUTED)}</w:style>
<w:style w:type="character" w:styleId="Hyperlink"><w:name w:val="Hyperlink"/><w:basedOn w:val="DefaultParagraphFont"/><w:uiPriority w:val="99"/><w:unhideWhenUsed/><w:rPr><w:color w:val="${ACCENT}"/><w:u w:val="single"/></w:rPr></w:style>
</w:styles>`.replaceAll("\n", "");

const settings = () =>
  `${XML_HEAD}<w:settings xmlns:w="${NS_W}"><w:zoom w:percent="100"/><w:defaultTabStop w:val="708"/><w:hyphenationZone w:val="425"/><w:characterSpacingControl w:val="doNotCompress"/><w:compat><w:compatSetting w:name="compatibilityMode" w:uri="http://schemas.microsoft.com/office/word" w:val="15"/><w:compatSetting w:name="overrideTableStyleFontSizeAndJustification" w:uri="http://schemas.microsoft.com/office/word" w:val="1"/><w:compatSetting w:name="enableOpenTypeFeatures" w:uri="http://schemas.microsoft.com/office/word" w:val="1"/><w:compatSetting w:name="doNotFlipMirrorIndents" w:uri="http://schemas.microsoft.com/office/word" w:val="1"/></w:compat><w:themeFontLang w:val="${locale()}"/></w:settings>`;

const FONT_TABLE = `${XML_HEAD}<w:fonts xmlns:w="${NS_W}"><w:font w:name="Calibri"><w:panose1 w:val="020F0502020204030204"/><w:charset w:val="00"/><w:family w:val="swiss"/><w:pitch w:val="variable"/></w:font></w:fonts>`;

// ---------- Document ----------

export function dossierDocx(dossier: Dossier, o: DocumentOptions): Uint8Array {
  bookmark = 0;
  const landscape = o.orientation === "landscape";
  const page = landscape ? { w: 16838, h: 11906 } : { w: 11906, h: 16838 };
  const margin = 1000;
  const width = page.w - margin * 2;
  const media: Record<string, Uint8Array> = {};
  const rels: string[] = [];
  let picture_ = 0;
  const addPicture = (data: Uint8Array, ext = "png") => {
    picture_++;
    const rid = `rIdImg${picture_}`;
    media[`word/media/image${picture_}.${ext}`] = data;
    rels.push(
      `<Relationship Id="${rid}" Type="${REL}/image" Target="media/image${picture_}.${ext}"/>`,
    );
    return { rid, id: 100 + picture_ };
  };
  const c = dossier.cover;
  const body: string[] = [];

  // Cover.
  body.push(text(`orion aic · ${t("dossier de l’opération")}`, "Kicker"));
  body.push(text(c.title, "Title"));
  body.push(
    text(
      [c.organization, c.location].filter(Boolean).join(" · ") || c.shown,
      "Subtitle",
    ),
  );
  if (o.watermark) body.push(text(o.watermark, "Summary", { color: "B22222" }));
  body.push(
    table(
      [
        { label: t("Propriété"), weight: 1 },
        { label: t("Valeur"), weight: 2.6 },
      ],
      [
        ...coverFacts(c),
        [t("Document n°"), o.stamp.id],
        [t("Empreinte"), o.stamp.fingerprint],
      ],
      width,
      false,
      true,
    ),
  );
  body.push(text("", ""));
  const qr = addPicture(qrPng(o.stamp.qr));
  body.push(
    para(
      picture(
        qr.rid,
        qr.id,
        t("QR de vérification"),
        1080000,
        1080000,
        o.stamp.qr,
      ),
    ),
  );
  body.push(
    text(
      `${t("Vérification : ce code identifie l’export et l’empreinte de son contenu. Dans orion aic, Traçabilité → Vérifier un document.")}\n${o.stamp.label}`,
      "Caption",
    ),
  );

  // Table of contents: a real Word field (update it with F9 for page numbers).
  body.push(text(t("Sommaire"), "TOCHeading"));
  const entries = dossier.chapters.flatMap((ch) => [
    {
      level: 1,
      label: `${ch.number}. ${ch.title}`,
      anchor: `_Chap${ch.number}`,
    },
    ...ch.blocks.flatMap((b, i) =>
      b.kind === "text"
        ? []
        : [
            {
              level: 2,
              label:
                b.kind === "map"
                  ? t("Carte · {title}", { title: b.title })
                  : b.table.title,
              anchor: `_Chap${ch.number}_${i + 1}`,
            },
          ],
    ),
  ]);
  entries.forEach((e, i) => {
    const link = `<w:hyperlink w:anchor="${e.anchor}" w:history="1">${run(e.label, { style: "Hyperlink" })}</w:hyperlink>`;
    const begin =
      i === 0
        ? `<w:r><w:fldChar w:fldCharType="begin"/></w:r><w:r><w:instrText xml:space="preserve"> TOC \\o "1-2" \\h \\z \\u </w:instrText></w:r><w:r><w:fldChar w:fldCharType="separate"/></w:r>`
        : "";
    body.push(para(begin + link, `TOC${e.level}`));
  });
  body.push(
    para(
      `${entries.length ? "" : `<w:r><w:fldChar w:fldCharType="begin"/></w:r><w:r><w:instrText xml:space="preserve"> TOC \\o "1-2" \\h \\z \\u </w:instrText></w:r><w:r><w:fldChar w:fldCharType="separate"/></w:r>`}<w:r><w:fldChar w:fldCharType="end"/></w:r>`,
    ),
  );

  // Chapters.
  for (const ch of dossier.chapters) {
    body.push(heading(`${ch.number}. ${ch.title}`, 1, `_Chap${ch.number}`));
    if (ch.summary) body.push(text(ch.summary, "Summary"));
    ch.blocks.forEach((b, i) => {
      const anchor = `_Chap${ch.number}_${i + 1}`;
      if (b.kind === "text") {
        body.push(text(b.title, "Heading2"));
        body.push(text(b.body));
        if (b.meta) body.push(text(b.meta, "Caption"));
      } else if (b.kind === "map") {
        body.push(heading(t("Carte · {title}", { title: b.title }), 2, anchor));
        const image = o.maps[b.mapId];
        if (image) {
          const size = image;
          const cx = width * EMU_PER_TWIP;
          const maxCy = (landscape ? 7600 : 11000) * EMU_PER_TWIP;
          let cy = Math.round((cx * size.height) / size.width);
          let w = cx;
          if (cy > maxCy) {
            w = Math.round((w * maxCy) / cy);
            cy = maxCy;
          }
          const bytes = mapBytes(image);
          const p = addPicture(bytes.data, bytes.ext);
          body.push(
            para(
              picture(
                p.rid,
                p.id,
                t("Carte {title}", { title: b.title }),
                w,
                cy,
                b.title,
              ),
              "",
              '<w:jc w:val="center"/>',
            ),
          );
        }
        body.push(
          text(
            [b.caption, image?.attribution].filter(Boolean).join(" · "),
            "Caption",
          ),
        );
      } else {
        const tbl = b.table;
        const view = tbl.compact ?? tbl;
        body.push(heading(tbl.title, 2, anchor));
        body.push(text(tbl.caption, "Caption"));
        const rows = view.rows.slice(0, DOCUMENT_ROWS);
        body.push(
          rows.length
            ? table(view.columns, rows, width)
            : text(t("Aucun élément."), "Caption"),
        );
        if (view.rows.length > rows.length)
          body.push(
            text(
              t(
                "… {n} lignes de plus dans les exports tableur (Excel, OpenDocument, CSV).",
                { n: view.rows.length - rows.length },
              ),
              "Caption",
            ),
          );
        body.push(text(""));
      }
    });
  }

  // Verification block at the end.
  body.push(text(t("Vérification de ce document"), "TOCHeading"));
  body.push(
    text(
      t(
        "Ce document a été produit par orion aic. Son contenu a l’empreinte {fingerprint} ; l’export porte le numéro {id}. L’empreinte SHA-256 du fichier est inscrite au registre des exports de l’opération. Pour vérifier un exemplaire, déposez le fichier dans orion aic (Traçabilité → Vérifier un document) ou scannez le code ci-dessous.",
        { fingerprint: o.stamp.fingerprint, id: o.stamp.id },
      ),
    ),
  );
  const qr2 = addPicture(qrPng(o.stamp.qr));
  body.push(
    para(
      picture(
        qr2.rid,
        qr2.id,
        t("QR de vérification"),
        1080000,
        1080000,
        o.stamp.qr,
      ),
    ),
  );
  body.push(text(o.stamp.label, "Caption"));

  const header = `${XML_HEAD}<w:hdr ${NAMESPACES}>${para(
    `${o.watermark ? watermarkRun(o.watermark, landscape) : ""}${run(`orion aic · ${c.title}`)}<w:r><w:tab/></w:r><w:r><w:tab/></w:r>${run(`${enumLabel(c.mode).toUpperCase()} · ${enumLabel(c.classification).toUpperCase()}`, { bold: true })}`,
    "Header",
    `<w:tabs><w:tab w:val="clear" w:pos="4536"/><w:tab w:val="clear" w:pos="9072"/><w:tab w:val="center" w:pos="${Math.round(width / 2)}"/><w:tab w:val="right" w:pos="${width}"/></w:tabs>`,
  )}</w:hdr>`;
  const field = (code: string) =>
    `<w:r><w:fldChar w:fldCharType="begin"/></w:r><w:r><w:instrText xml:space="preserve"> ${code} </w:instrText></w:r><w:r><w:fldChar w:fldCharType="separate"/></w:r><w:r><w:t>1</w:t></w:r><w:r><w:fldChar w:fldCharType="end"/></w:r>`;
  const footer = `${XML_HEAD}<w:ftr ${NAMESPACES}>${para(
    `${run(o.stamp.label)}<w:r><w:tab/></w:r>${run(`${t("Page")} `)}${field("PAGE")}${run(" / ")}${field("NUMPAGES")}`,
    "Footer",
    `<w:tabs><w:tab w:val="clear" w:pos="4536"/><w:tab w:val="clear" w:pos="9072"/><w:tab w:val="right" w:pos="${width}"/></w:tabs>`,
  )}</w:ftr>`;
  const section = `<w:sectPr><w:headerReference w:type="default" r:id="rIdHeader"/><w:footerReference w:type="default" r:id="rIdFooter"/><w:pgSz w:w="${page.w}" w:h="${page.h}"${landscape ? ' w:orient="landscape"' : ""}/><w:pgMar w:top="1300" w:right="${margin}" w:bottom="1200" w:left="${margin}" w:header="560" w:footer="560" w:gutter="0"/><w:cols w:space="708"/><w:docGrid w:linePitch="360"/></w:sectPr>`;
  const document = `${XML_HEAD}<w:document ${NAMESPACES}><w:body>${body.join("")}${section}</w:body></w:document>`;
  const info = bookInfo(dossier, o.stamp, o.watermark);
  return zip({
    "[Content_Types].xml": `${XML_HEAD}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Default Extension="jpeg" ContentType="image/jpeg"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/><Override PartName="/word/fontTable.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.fontTable+xml"/><Override PartName="/word/header1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/><Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/>${PROPS_TYPES}</Types>`,
    "_rels/.rels": `${XML_HEAD}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${REL}/officeDocument" Target="word/document.xml"/>${PROPS_RELS}</Relationships>`,
    ...docProps(info),
    "word/document.xml": document,
    "word/_rels/document.xml.rels": `${XML_HEAD}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdStyles" Type="${REL}/styles" Target="styles.xml"/><Relationship Id="rIdSettings" Type="${REL}/settings" Target="settings.xml"/><Relationship Id="rIdFonts" Type="${REL}/fontTable" Target="fontTable.xml"/><Relationship Id="rIdHeader" Type="${REL}/header" Target="header1.xml"/><Relationship Id="rIdFooter" Type="${REL}/footer" Target="footer1.xml"/>${rels.join("")}</Relationships>`,
    "word/styles.xml": styles(),
    "word/settings.xml": settings(),
    "word/fontTable.xml": FONT_TABLE,
    "word/header1.xml": header,
    "word/footer1.xml": footer,
    ...media,
  });
}
