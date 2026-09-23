import type { jsPDF } from "jspdf";
import type { Entry, Journal } from "../../shared/journal.ts";
import { radioTables } from "./radio-sheet.ts";
import {
  messageSheet,
  printedAt,
  sheetHeader,
  type SheetField,
  type SheetHeader,
} from "./sheet.ts";

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
  return doc.splitTextToSize(field.value || "—", width - PAD * 2) as string[];
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

function drawMessage(doc: Doc, journal: Journal, entry: Entry) {
  const header = sheetHeader(journal);
  const sheet = messageSheet(entry);
  const continuation = () => {
    const top = drawBand(doc, header, "Fiche message");
    font(doc, 8, true);
    doc.text(`MESSAGE ${sheet.number} · suite`, PAGE.m, top + 6);
    return top + 9;
  };
  let y = drawBand(doc, header, "Fiche message");
  y += 5;
  font(doc, 6.5, true, MUTED);
  doc.text("MESSAGE", PAGE.m, y + 1.5, { charSpace: 0.35 });
  font(doc, 24, true);
  doc.text(sheet.number, PAGE.m, y + 11);
  const boxes: [string, string, boolean][] = [
    ["Nature", sheet.type, false],
    ["Priorité", sheet.priority, sheet.priority === "Urgent"],
    ["Suivi", sheet.status, false],
  ];
  const bw = 34;
  boxes.forEach(([label, value, alert], i) => {
    const x = PAGE.w - PAGE.m - bw * (boxes.length - i);
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
    doc.text(value, x + 2, y + 9.4);
  });
  y += 14;
  if (sheet.revised || sheet.cancelled) {
    doc.setFillColor(...FILL);
    doc.rect(PAGE.m, y, WIDTH, 6, "F");
    font(doc, 7.5, true, sheet.cancelled ? RED : INK);
    doc.text(
      sheet.cancelled
        ? "ENTRÉE ANNULÉE · conservée pour la traçabilité"
        : `VERSION ${entry.revisions.length} · état actuel ; versions antérieures dans l’archive ORION`,
      PAGE.m + 2,
      y + 4.1,
    );
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
  sectionTitle(doc, layout, "Visa", 17);
  const visa = ["Traité par", "Date / heure", "Signature"];
  visa.forEach((label, i) =>
    drawField(
      doc,
      { label, value: "" },
      PAGE.m + (WIDTH / 3) * i,
      layout.y,
      WIDTH / 3,
      17,
      [],
    ),
  );
  color(doc, INK);
}

export async function messagesPdf(journal: Journal, entries: Entry[]) {
  if (!entries.length) throw new Error("Aucune entrée sélectionnée.");
  const doc = await pdfDocument();
  entries.forEach((entry, i) => {
    if (i) doc.addPage();
    drawMessage(doc, journal, entry);
  });
  drawFooters(
    doc,
    entries.length === 1
      ? `${journal.title} · message ${messageSheet(entries[0]).number}`
      : `${journal.title} · ${entries.length} messages`,
  );
  return doc.output("blob");
}

export async function radioPdf(journal: Journal, author: string) {
  const [doc, { autoTable }] = await Promise.all([
    pdfDocument("landscape"),
    import("jspdf-autotable"),
  ]);
  const header = sheetHeader(journal);
  const band = () =>
    drawBand(doc, header, "Plan du réseau radio", `Établi par ${author}`);
  let y = band() + 4;
  for (const table of radioTables(journal.radio)) {
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
  drawFooters(doc, `${journal.title} · plan du réseau radio`);
  return doc.output("blob");
}
