import type { jsPDF } from "jspdf";
import type { Entry, Journal } from "../../shared/journal.ts";
import { radioTables, type SheetTable } from "./radio-sheet.ts";
import {
  messageSheet,
  printedAt,
  sheetHeader,
  type FormSheet,
  type SheetField,
  type SheetHeader,
} from "./sheet.ts";
import { terminalUrl } from "../../shared/radio.ts";
import { qrMatrix } from "./qr.ts";
import { situationReport, type ReportRange } from "./report.ts";

type Doc = jsPDF;
type RGB = [number, number, number];
const INK: RGB = [16, 19, 24];
const MUTED: RGB = [98, 106, 118];
const RULE: RGB = [196, 201, 208];
const FILL: RGB = [242, 244, 246];
const RED: RGB = [178, 34, 34];
const PAGE = { w: 210, h: 297, m: 14 };
const WIDTH = PAGE.w - PAGE.m * 2;
const BOTTOM = PAGE.h - 16;

export async function pdfDocument(
  orientation: "portrait" | "landscape" = "portrait",
): Promise<Doc> {
  const [{ jsPDF }, regular, semibold] = await Promise.all([
    import("jspdf"),
    import("../journal/pdf-font-regular.ts"),
    import("../journal/pdf-font-semibold.ts"),
  ]);
  const doc = new jsPDF({ orientation, unit: "mm", format: "a4" });
  doc.addFileToVFS("Plex-Regular.ttf", regular.default);
  doc.addFileToVFS("Plex-Semibold.ttf", semibold.default);
  doc.addFont("Plex-Regular.ttf", "Plex", "normal");
  doc.addFont("Plex-Semibold.ttf", "Plex", "bold");
  doc.setFont("Plex", "normal");
  doc.setLineHeightFactor(1.3);
  return doc;
}

const color = (doc: Doc, rgb: RGB) => {
  doc.setTextColor(...rgb);
  doc.setDrawColor(...rgb);
};
function font(doc: Doc, size: number, bold = false, rgb: RGB = INK) {
  doc.setFont("Plex", bold ? "bold" : "normal");
  doc.setFontSize(size);
  doc.setTextColor(...rgb);
}
const lineHeight = (size: number) => size * 0.3528 * 1.3;

function chip(
  doc: Doc,
  text: string,
  right: number,
  y: number,
  strong = false,
) {
  font(doc, 7, true, strong ? [255, 255, 255] : INK);
  const w = doc.getTextWidth(text) + 4;
  doc.setDrawColor(...INK);
  doc.setLineWidth(0.25);
  if (strong) {
    doc.setFillColor(...INK);
    doc.rect(right - w, y - 3.4, w, 4.8, "FD");
  } else doc.rect(right - w, y - 3.4, w, 4.8);
  doc.text(text, right - w + 2, y);
  return right - w - 1.5;
}

const pageWidth = (doc: Doc) => doc.internal.pageSize.getWidth();
const pageHeight = (doc: Doc) => doc.internal.pageSize.getHeight();

/** Document band shared by every ORION print. Returns the y below it. */
export function drawBand(
  doc: Doc,
  header: SheetHeader,
  kind: string,
  extra = "",
): number {
  const top = PAGE.m;
  const W = pageWidth(doc);
  const inner = W - PAGE.m * 2;
  font(doc, 6.5, true, MUTED);
  doc.text(`ORION  ·  ${kind.toUpperCase()}`, PAGE.m, top + 2, {
    charSpace: 0.35,
  });
  let x = W - PAGE.m;
  x = chip(
    doc,
    header.classification.toUpperCase(),
    x,
    top + 2.4,
    header.classification === "Confidentiel",
  );
  chip(
    doc,
    header.mode.toUpperCase(),
    x,
    top + 2.4,
    header.mode === "Intervention",
  );
  font(doc, 13, true);
  const title = doc.splitTextToSize(header.title, inner - 60)[0] as string;
  doc.text(title, PAGE.m, top + 9.5);
  font(doc, 8, false, MUTED);
  if (header.reference)
    doc.text(`Réf. ${header.reference}`, W - PAGE.m, top + 9.5, {
      align: "right",
    });
  const context = [header.organization, header.location, extra]
    .filter(Boolean)
    .join("  ·  ");
  if (context)
    doc.text(
      doc.splitTextToSize(context, inner)[0] as string,
      PAGE.m,
      top + 14,
    );
  doc.setDrawColor(...INK);
  doc.setLineWidth(0.6);
  doc.line(PAGE.m, top + 17, W - PAGE.m, top + 17);
  return top + 17;
}

export function drawFooters(doc: Doc, label: string) {
  const count = doc.getNumberOfPages();
  const stamp = printedAt();
  const W = pageWidth(doc),
    H = pageHeight(doc);
  for (let i = 1; i <= count; i++) {
    doc.setPage(i);
    doc.setDrawColor(...RULE);
    doc.setLineWidth(0.2);
    doc.line(PAGE.m, H - 11, W - PAGE.m, H - 11);
    font(doc, 6.5, false, MUTED);
    doc.text(label, PAGE.m, H - 7.5);
    doc.text(`Édité le ${stamp} · Europe/Zurich`, W / 2, H - 7.5, {
      align: "center",
    });
    doc.text(`${i} / ${count}`, W - PAGE.m, H - 7.5, { align: "right" });
  }
}

const PAD = 1.8;
const LABEL = 6;
const VALUE = 9;

const valueSize = (field: SheetField) => (field.strong ? 10 : VALUE);

function fieldLines(doc: Doc, field: SheetField, width: number): string[] {
  font(doc, valueSize(field), field.strong);
  return field.value
    ? (doc.splitTextToSize(field.value, width - PAD * 2) as string[])
    : [];
}

function drawField(
  doc: Doc,
  field: SheetField,
  x: number,
  y: number,
  w: number,
  h: number,
  lines: string[],
) {
  doc.setDrawColor(...RULE);
  doc.setLineWidth(0.2);
  doc.rect(x, y, w, h);
  font(doc, LABEL, true, MUTED);
  doc.text(field.label.toUpperCase(), x + PAD, y + PAD + 1.7, {
    charSpace: 0.2,
  });
  font(doc, valueSize(field), field.strong, field.value === "—" ? MUTED : INK);
  doc.text(lines, x + PAD, y + PAD + 6.2);
}

type Layout = { y: number; top: number; onBreak: () => number };

function ensure(doc: Doc, layout: Layout, height: number) {
  if (layout.y + height <= BOTTOM) return;
  doc.addPage();
  layout.y = layout.onBreak();
}

function sectionTitle(doc: Doc, layout: Layout, title: string, next = 11) {
  ensure(doc, layout, 7.1 + next);
  layout.y += 3.5;
  font(doc, 6.5, true);
  doc.text(title.toUpperCase(), PAGE.m, layout.y + 2.2, { charSpace: 0.35 });
  layout.y += 3.6;
}

function drawRow(doc: Doc, layout: Layout, row: SheetField[]) {
  const spans = row.map((f) => f.span ?? 1);
  const total = spans.reduce((a, b) => a + b, 0);
  let x = PAGE.m;
  const cells = row.map((field, i) => {
    const w = (WIDTH * spans[i]) / total;
    const cell = { field, x, w, lines: fieldLines(doc, field, w) };
    x += w;
    return cell;
  });
  const lh = lineHeight(row.length === 1 ? valueSize(row[0]) : VALUE);
  const need = (n: number, tall?: boolean) =>
    Math.max(PAD * 2 + 5 + n * lh, tall ? 26 : 11);
  if (row.length === 1) {
    // Long single fields flow across pages line by line.
    const { field } = cells[0];
    let lines = cells[0].lines;
    let started = false;
    let moved = false;
    while (lines.length) {
      const room = Math.floor((BOTTOM - layout.y - PAD * 2 - 5) / lh);
      const whole = need(lines.length, field.tall);
      const keepTogether =
        !started && !moved && whole > BOTTOM - layout.y && whole <= 70;
      if (room < 3 || keepTogether) {
        doc.addPage();
        layout.y = layout.onBreak();
        moved = true;
        continue;
      }
      const part = lines.slice(0, room);
      const h = need(part.length, field.tall && !started);
      const label = started ? `${field.label} (suite)` : field.label;
      drawField(doc, { ...field, label }, PAGE.m, layout.y, WIDTH, h, part);
      layout.y += h;
      lines = lines.slice(room);
      started = true;
    }
    return;
  }
  const h = Math.max(...cells.map((c) => need(c.lines.length, c.field.tall)));
  ensure(doc, layout, h);
  for (const c of cells)
    drawField(doc, c.field, c.x, layout.y, c.w, h, c.lines);
  layout.y += h;
}

function drawForm(doc: Doc, header: SheetHeader, sheet: FormSheet) {
  const continuation = () => {
    const top = drawBand(doc, header, sheet.kind);
    font(doc, 8, true);
    doc.text(
      `${sheet.idLabel.toUpperCase()} ${sheet.number} · suite`,
      PAGE.m,
      top + 6,
    );
    return top + 9;
  };
  let y = drawBand(doc, header, sheet.kind);
  y += 5;
  font(doc, 6.5, true, MUTED);
  doc.text(sheet.idLabel.toUpperCase(), PAGE.m, y + 1.5, { charSpace: 0.35 });
  font(doc, 24, true);
  doc.text(sheet.number, PAGE.m, y + 11);
  const bw = 34;
  sheet.boxes.forEach(({ label, value, alert }, i) => {
    const x = PAGE.w - PAGE.m - bw * (sheet.boxes.length - i);
    doc.setLineWidth(0.25);
    if (alert) {
      doc.setFillColor(...RED);
      doc.setDrawColor(...RED);
      doc.rect(x, y, bw, 12, "FD");
    } else {
      doc.setDrawColor(...INK);
      doc.rect(x, y, bw, 12);
    }
    font(doc, 6, true, alert ? [255, 255, 255] : MUTED);
    doc.text(label.toUpperCase(), x + 2, y + 3.6, { charSpace: 0.2 });
    font(doc, 10, true, alert ? [255, 255, 255] : INK);
    doc.text(doc.splitTextToSize(value, bw - 4)[0] as string, x + 2, y + 9.4);
  });
  y += 14;
  if (sheet.note) {
    doc.setFillColor(...FILL);
    doc.rect(PAGE.m, y, WIDTH, 6, "F");
    font(doc, 7.5, true, sheet.note.alert ? RED : INK);
    doc.text(sheet.note.text, PAGE.m + 2, y + 4.1);
    y += 7;
  }
  const layout: Layout = { y, top: PAGE.m + 26, onBreak: continuation };
  for (const section of sheet.sections) {
    sectionTitle(
      doc,
      layout,
      section.title,
      section.rows[0].some((f) => f.tall) ? 26 : 11,
    );
    for (const row of section.rows) drawRow(doc, layout, row);
  }
  for (const visa of sheet.visa) {
    sectionTitle(doc, layout, visa.title, 17);
    const w = WIDTH / visa.labels.length;
    visa.labels.forEach((label, i) =>
      drawField(doc, { label, value: "" }, PAGE.m + w * i, layout.y, w, 17, []),
    );
    layout.y += 17;
  }
  color(doc, INK);
}

export async function formsPdf(
  journal: Journal,
  sheets: FormSheet[],
  label: string,
) {
  if (!sheets.length) throw new Error("Aucun document à produire.");
  const doc = await pdfDocument();
  const header = sheetHeader(journal);
  sheets.forEach((sheet, i) => {
    if (i) doc.addPage();
    drawForm(doc, header, sheet);
  });
  drawFooters(
    doc,
    `${journal.title} · ${sheets.length === 1 ? sheets[0].footer : label}`,
  );
  return doc.output("blob");
}

export async function messagesPdf(journal: Journal, entries: Entry[]) {
  if (!entries.length) throw new Error("Aucune entrée sélectionnée.");
  return formsPdf(
    journal,
    entries.map(messageSheet),
    `${entries.length} messages`,
  );
}

export async function tablesPdf(
  journal: Journal,
  options: {
    kind: string;
    extra: string;
    tables: SheetTable[];
    orientation: "portrait" | "landscape";
    footer: string;
  },
) {
  const [doc, { autoTable }] = await Promise.all([
    pdfDocument(options.orientation),
    import("jspdf-autotable"),
  ]);
  const header = sheetHeader(journal);
  const band = () => drawBand(doc, header, options.kind, options.extra);
  let y = band() + 4;
  for (const table of options.tables) {
    if (y > pageHeight(doc) - 40) {
      doc.addPage();
      y = band() + 4;
    }
    font(doc, 7, true);
    doc.text(table.title.toUpperCase(), PAGE.m, y + 2.5, { charSpace: 0.35 });
    font(doc, 7, false, MUTED);
    doc.text(table.caption, pageWidth(doc) - PAGE.m, y + 2.5, {
      align: "right",
    });
    autoTable(doc, {
      startY: y + 4.5,
      head: [table.head],
      body: table.body.length
        ? table.body
        : [[{ content: "—", colSpan: table.head.length }]],
      theme: "grid",
      styles: {
        font: "Plex",
        fontSize: 7.5,
        cellPadding: 1.6,
        textColor: INK,
        lineColor: RULE,
        lineWidth: 0.2,
        overflow: "linebreak",
        valign: "top",
      },
      headStyles: {
        fillColor: INK,
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 6.5,
      },
      columnStyles: table.widths
        ? Object.fromEntries(table.widths.map((w, i) => [i, { cellWidth: w }]))
        : {},
      margin: { left: PAGE.m, right: PAGE.m, top: PAGE.m + 22, bottom: 16 },
      didDrawPage: (data) => {
        if (data.pageNumber > 1) band();
      },
    });
    y =
      (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable
        .finalY + 7;
  }
  drawFooters(doc, `${journal.title} · ${options.footer}`);
  return doc.output("blob");
}

export const radioPdf = (journal: Journal, author: string) =>
  tablesPdf(journal, {
    kind: "Plan du réseau radio",
    extra: `Établi par ${author}`,
    tables: radioTables(journal.radio),
    orientation: "landscape",
    footer: "plan du réseau radio",
  });

export const reportPdf = (
  journal: Journal,
  author: string,
  range: ReportRange,
) =>
  tablesPdf(journal, {
    kind: "Rapport de situation",
    extra: `Établi par ${author}`,
    tables: situationReport(journal, range),
    orientation: "portrait",
    footer: "rapport de situation",
  });

/** A4 sheet of 3 × 7 QR labels, one per terminal. */
export async function labelsPdf(journal: Journal, origin: string) {
  if (!journal.radio.terminals.length) throw new Error("Aucun terminal.");
  const doc = await pdfDocument();
  const cols = 3,
    rows = 7,
    w = 60,
    h = 36,
    left = (PAGE.w - cols * w) / 2,
    top = 18;
  journal.radio.terminals.forEach((terminal, i) => {
    const slot = i % (cols * rows);
    if (i && slot === 0) doc.addPage();
    const x = left + (slot % cols) * w;
    const y = top + Math.floor(slot / cols) * h;
    doc.setDrawColor(...RULE);
    doc.setLineWidth(0.1);
    doc.setLineDashPattern([1, 1], 0);
    doc.rect(x, y, w, h);
    doc.setLineDashPattern([], 0);
    const matrix = qrMatrix(terminalUrl(origin, terminal));
    const size = 28,
      cell = size / matrix.length;
    doc.setFillColor(...INK);
    matrix.forEach((line, r) =>
      line.forEach((dark, c) => {
        if (dark) doc.rect(x + 4 + c * cell, y + 4 + r * cell, cell, cell, "F");
      }),
    );
    font(doc, 6, true, MUTED);
    doc.text("ORION · RADIO", x + 35, y + 8, { charSpace: 0.3 });
    font(doc, 16, true);
    doc.text(terminal.label, x + 35, y + 16);
    font(doc, 7, false, MUTED);
    doc.text(
      doc.splitTextToSize(
        [terminal.model, terminal.rfsi && `RFSI ${terminal.rfsi}`]
          .filter(Boolean)
          .join("\n"),
        22,
      ),
      x + 35,
      y + 21,
    );
  });
  drawFooters(doc, `${journal.title} · étiquettes radio`);
  return doc.output("blob");
}
