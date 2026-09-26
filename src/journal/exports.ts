import { zipSync, strToU8 } from "fflate";
import {
  archive,
  chronological,
  current,
  dateTime,
  type Journal,
} from "../../shared/journal.ts";
import {
  MAX_IMPORT_BYTES,
  asHtml,
  asText,
  columns,
  delimited,
  rows,
  xml,
} from "../../shared/interchange.ts";
import { deriveKey, encrypt } from "../../shared/crypto.ts";
import { enumLabel } from "../../shared/i18n/enums.ts";
import { ENUM_COLUMNS, t } from "./i18n.ts";
/** Value of a journal column for a document to read (fixed values translated). */
const shown = (key: string, value: string) =>
  ENUM_COLUMNS.has(key) ? enumLabel(value) : value;
// Names and details are getters: read in the language of the post.
export const exportFormats = [
  {
    id: "orion",
    get name() {
      return t("Archive orion aic");
    },
    extension: ".orionaic",
    get detail() {
      return t("Chiffrée. Journal, versions et plan radio. Réimportable.");
    },
    get group() {
      return t("Archive");
    },
  },
  {
    id: "json",
    get name() {
      return t("Archive JSON");
    },
    extension: ".json",
    get detail() {
      return t("En clair. Journal, versions et plan radio. Réimportable.");
    },
    get group() {
      return t("Archive");
    },
  },
  {
    id: "sheets",
    get name() {
      return t("Fiches messages A4");
    },
    extension: ".pdf",
    get detail() {
      return t("Une fiche par entrée, ordre chronologique.");
    },
    get group() {
      return t("Impression");
    },
  },
  {
    id: "pdf",
    get name() {
      return t("Journal PDF");
    },
    extension: ".pdf",
    get detail() {
      return t("Tableau chronologique paginé A4.");
    },
    get group() {
      return t("Impression");
    },
  },
  {
    id: "radio",
    get name() {
      return t("Plan du réseau radio");
    },
    extension: ".pdf",
    get detail() {
      return t("Noms d’appel, groupes, terminaux, remises, contrôles.");
    },
    get group() {
      return t("Impression");
    },
  },
  {
    id: "xlsx",
    name: "Excel",
    extension: ".xlsx",
    get detail() {
      return t("Filtres, en-tête figé.");
    },
    get group() {
      return t("Bureautique");
    },
  },
  {
    id: "docx",
    name: "Word",
    extension: ".docx",
    get detail() {
      return t("Document modifiable.");
    },
    get group() {
      return t("Bureautique");
    },
  },
  {
    id: "ods",
    name: "OpenDocument",
    extension: ".ods",
    get detail() {
      return t("Tableur LibreOffice.");
    },
    get group() {
      return t("Bureautique");
    },
  },
  {
    id: "csv",
    name: "CSV",
    extension: ".csv",
    get detail() {
      return t("UTF-8, point-virgule.");
    },
    get group() {
      return t("Texte");
    },
  },
  {
    id: "tsv",
    name: "TSV",
    extension: ".tsv",
    get detail() {
      return t("UTF-8, tabulation.");
    },
    get group() {
      return t("Texte");
    },
  },
  {
    id: "html",
    name: "HTML",
    extension: ".html",
    get detail() {
      return t("Page autonome.");
    },
    get group() {
      return t("Texte");
    },
  },
  {
    id: "txt",
    get name() {
      return t("Texte");
    },
    extension: ".txt",
    get detail() {
      return t("Texte brut.");
    },
    get group() {
      return t("Texte");
    },
  },
  {
    id: "md",
    name: "Markdown",
    extension: ".md",
    get detail() {
      return t("Texte structuré.");
    },
    get group() {
      return t("Texte");
    },
  },
] as const;
export type ExportFormat = (typeof exportFormats)[number]["id"];
const declaration = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
function zip(files: Record<string, string>) {
  return zipSync(
    Object.fromEntries(
      Object.entries(files).map(([path, text]) => [path, strToU8(text)]),
    ),
    { level: 6 },
  );
}
function colName(index: number): string {
  let name = "";
  for (index++; index > 0; index = Math.floor((index - 1) / 26))
    name = String.fromCharCode(65 + ((index - 1) % 26)) + name;
  return name;
}
export function xlsx(journal: Journal): Uint8Array {
  const table = rows(journal);
  const cells = table
    .map(
      (row, r) =>
        `<row r="${r + 1}">${row.map((value, c) => `<c r="${colName(c)}${r + 1}" t="inlineStr" s="${r === 0 ? 1 : 0}"><is><t xml:space="preserve">${xml(value)}</t></is></c>`).join("")}</row>`,
    )
    .join("");
  return zip({
    "[Content_Types].xml": `${declaration}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`,
    "_rels/.rels": `${declaration}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
    "xl/workbook.xml": `${declaration}<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${xml(t("Journal"))}" sheetId="1" r:id="rId1"/></sheets></workbook>`,
    "xl/_rels/workbook.xml.rels": `${declaration}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`,
    "xl/styles.xml": `${declaration}<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF172536"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment wrapText="1" vertical="top"/></xf><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`,
    "xl/worksheets/sheet1.xml": `${declaration}<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols><col min="1" max="28" width="24" customWidth="1"/><col min="5" max="5" width="70" customWidth="1"/></cols><sheetData>${cells}</sheetData><autoFilter ref="A1:${colName(columns.length - 1)}${table.length}"/></worksheet>`,
  });
}
export function ods(journal: Journal): Uint8Array {
  const mime = "application/vnd.oasis.opendocument.spreadsheet";
  const content = `${declaration}<office:document-content xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" xmlns:table="urn:oasis:names:tc:opendocument:xmlns:table:1.0" xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0" office:version="1.3"><office:body><office:spreadsheet><table:table table:name="${xml(t("Journal"))}">${rows(
    journal,
  )
    .map(
      (row) =>
        `<table:table-row>${row.map((v) => `<table:table-cell office:value-type="string"><text:p>${xml(v).replaceAll("\n", "<text:line-break/>").replaceAll("\t", "<text:tab/>")}</text:p></table:table-cell>`).join("")}</table:table-row>`,
    )
    .join(
      "",
    )}</table:table></office:spreadsheet></office:body></office:document-content>`;
  return zipSync({
    mimetype: [strToU8(mime), { level: 0 }],
    "content.xml": strToU8(content),
    "META-INF/manifest.xml": strToU8(
      `${declaration}<manifest:manifest xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0" manifest:version="1.3"><manifest:file-entry manifest:full-path="/" manifest:media-type="${mime}"/><manifest:file-entry manifest:full-path="content.xml" manifest:media-type="text/xml"/></manifest:manifest>`,
    ),
  });
}
export function docx(journal: Journal): Uint8Array {
  const paragraph = (value: string, bold = false) =>
    `<w:p><w:pPr><w:spacing w:after="100"/></w:pPr><w:r>${bold ? "<w:rPr><w:b/></w:rPr>" : ""}${value
      .split("\n")
      .map((s) => `<w:t xml:space="preserve">${xml(s)}</w:t>`)
      .join("<w:br/>")}</w:r></w:p>`;
  const body = [
    paragraph(journal.title, true),
    paragraph(
      `${journal.organization} · ${journal.location} · ${enumLabel(journal.mode)} · ${enumLabel(journal.classification)}`,
    ),
    paragraph(
      t("Réf. {reference} · Export {date} · Europe/Zurich", {
        reference: journal.reference,
        date: dateTime(new Date().toISOString()),
      }),
    ),
    paragraph(
      t(
        "État actuel des entrées ; historique complet dans l’archive orion aic.",
      ),
    ),
    ...chronological(journal.entries).flatMap((e) => [
      paragraph(
        `#${e.number} · ${dateTime(current(e).happenedAt)} · ${enumLabel(current(e).type)}`,
        true,
      ),
      ...columns
        .filter(([, value]) => value(e))
        .map(([label, value, key]) =>
          paragraph(
            t("{label} : {value}", { label, value: shown(key, value(e)) }),
          ),
        ),
    ]),
  ].join("");
  return zip({
    "[Content_Types].xml": `${declaration}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`,
    "_rels/.rels": `${declaration}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`,
    "word/document.xml": `${declaration}<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${body}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1000" w:right="1000" w:bottom="1000" w:left="1000"/></w:sectPr></w:body></w:document>`,
  });
}
export async function makeExport(
  journal: Journal,
  format: ExportFormat,
  password = "",
  author = "",
): Promise<Blob> {
  if (format === "sheets") {
    const { messagesPdf } = await import("../print/pdf.ts");
    return messagesPdf(journal, chronological(journal.entries));
  }
  if (format === "radio") {
    const { radioPdf } = await import("../print/pdf.ts");
    return radioPdf(journal, author || "—");
  }
  if (format === "orion" || format === "json") {
    const value =
      format === "orion"
        ? await encrypt(archive(journal), await deriveKey(password))
        : archive(journal);
    const blob = new Blob(
      [JSON.stringify(value, null, format === "json" ? 2 : undefined)],
      { type: "application/json" },
    );
    if (blob.size > MAX_IMPORT_BYTES)
      throw new Error(
        t(
          "Cette archive dépasse la limite d’import de 32 Mo. Exportez les formats de lecture et répartissez le journal avant de créer une archive transférable.",
        ),
      );
    return blob;
  }
  if (format === "xlsx")
    return new Blob([xlsx(journal) as Uint8Array<ArrayBuffer>], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
  if (format === "ods")
    return new Blob([ods(journal) as Uint8Array<ArrayBuffer>], {
      type: "application/vnd.oasis.opendocument.spreadsheet",
    });
  if (format === "docx")
    return new Blob([docx(journal) as Uint8Array<ArrayBuffer>], {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
  if (format === "pdf") {
    const [{ pdfDocument }, { autoTable }] = await Promise.all([
      import("../print/pdf.ts"),
      import("jspdf-autotable"),
    ]);
    const doc = await pdfDocument();
    doc.setFontSize(20);
    doc.text(doc.splitTextToSize(journal.title, 180), 15, 20);
    const heading = doc.splitTextToSize(
      `${journal.organization} · ${journal.location}\n${enumLabel(journal.mode)} · ${enumLabel(journal.classification)} · ${journal.reference}\n${t("Export {date} · Europe/Zurich", { date: dateTime(new Date().toISOString()) })}\n${t("État actuel ; historique complet dans l’archive orion aic.")}`,
      180,
    );
    const startY = 22 + doc.splitTextToSize(journal.title, 180).length * 8;
    doc.setFontSize(9);
    doc.text(heading, 15, startY);
    autoTable(doc, {
      startY: startY + heading.length * 5 + 5,
      head: [[t("N° / Événement"), t("Message et informations"), t("Suivi")]],
      body: chronological(journal.entries).map((e) => {
        const f = current(e);
        return [
          `#${e.number}\n${dateTime(f.happenedAt)}\n${enumLabel(f.type)}\n${enumLabel(f.priority)}`,
          `${f.message}\n\n${columns
            .filter(
              ([, value, key]) =>
                ![
                  "N°",
                  "Événement (ISO)",
                  "Type",
                  "Message",
                  "Priorité",
                  "Statut",
                  "Responsable",
                  "Échéance (ISO)",
                  "Mesure / décision",
                ].includes(key) && value(e),
            )
            .map(([label, value, key]) =>
              t("{label} : {value}", { label, value: shown(key, value(e)) }),
            )
            .join("\n")}`,
          `${enumLabel(f.status)}\n${f.assignee}\n${f.dueAt ? t("Échéance : {date}", { date: dateTime(f.dueAt) }) : ""}\n${f.action}`,
        ];
      }),
      styles: {
        font: "Plex",
        fontSize: 8,
        cellPadding: 3,
        overflow: "linebreak",
        valign: "top",
      },
      headStyles: { fillColor: [16, 19, 24] },
      columnStyles: {
        0: { cellWidth: 32 },
        1: { cellWidth: 105 },
        2: { cellWidth: 43 },
      },
      margin: { left: 15, right: 15, bottom: 18 },
    });
    for (let i = 1; i <= doc.getNumberOfPages(); i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(
        `orion aic · ${enumLabel(journal.classification)} · ${i} / ${doc.getNumberOfPages()}`,
        15,
        288,
      );
    }
    return doc.output("blob");
  }
  const type =
    format === "html"
      ? "text/html"
      : format === "csv"
        ? "text/csv"
        : "text/plain";
  const text =
    format === "csv" || format === "tsv"
      ? delimited(rows(journal), format === "tsv" ? "\t" : ";")
      : format === "html"
        ? asHtml(journal)
        : asText(journal, format === "md");
  return new Blob([text], { type: `${type};charset=utf-8` });
}
export function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
export const fileName = (journal: Journal, extension: string, suffix = "") =>
  `orion-aic-${suffix ? suffix + "-" : ""}${journal.title
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-zA-Z0-9-]+/g, "-")
    .slice(0, 70)}-${new Date().toISOString().slice(0, 10)}${extension}`;
