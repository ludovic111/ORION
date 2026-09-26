import type { jsPDF } from "jspdf";
import { pdfDocument } from "../print/pdf.ts";
import { qrMatrix } from "../print/qr.ts";
import { coverFacts, type Column, type Dossier, type Kpi } from "./dossier.ts";
import { DOCUMENT_ROWS, type DocumentOptions } from "./docx.ts";
import { enumLabel } from "../../shared/i18n/enums.ts";
import { t } from "./i18n.ts";

// PDF dossier (A4 portrait or landscape): cover with the verification QR
// code, table of contents with page numbers, one chapter per part, tables,
// map images, header and footer (stamp, page x / y) on every page and a
// translucent diagonal watermark.

type Doc = jsPDF;
type RGB = [number, number, number];
const INK: RGB = [27, 31, 58];
const MUTED: RGB = [95, 102, 128];
const RULE: RGB = [212, 216, 228];
const FILL: RGB = [238, 240, 248];
const ACCENT: RGB = [92, 69, 255];
const TONES: Record<string, RGB> = {
  ok: [12, 155, 105],
  warn: [184, 110, 0],
  crit: [216, 33, 74],
};
const M = 14;
const TOP = 26;

function font(doc: Doc, size: number, bold = false, rgb: RGB = INK) {
  doc.setFont("Plex", bold ? "bold" : "normal");
  doc.setFontSize(size);
  doc.setTextColor(...rgb);
}
const lh = (size: number) => size * 0.3528 * 1.3;

function drawQr(doc: Doc, text: string, x: number, y: number, size: number) {
  const matrix = qrMatrix(text);
  const cell = size / (matrix.length + 2);
  doc.setFillColor(255, 255, 255);
  doc.rect(x, y, size, size, "F");
  doc.setFillColor(0, 0, 0);
  matrix.forEach((row, r) =>
    row.forEach((dark, c) => {
      if (dark)
        doc.rect(
          x + (c + 1) * cell,
          y + (r + 1) * cell,
          cell + 0.01,
          cell + 0.01,
          "F",
        );
    }),
  );
}

type Entry = { level: 1 | 2; label: string; page: number };

/**
 * Place of every line of the table of contents: page (from its first page)
 * and baseline. Chapters take 7.6 mm, their tables and maps 4.8 mm; the
 * first page starts below the title.
 */
export function tocLayout(levels: (1 | 2)[], bottom: number) {
  const at: { page: number; y: number }[] = [];
  let page = 0;
  let y = TOP + 16;
  for (const level of levels) {
    const before = level === 1 ? 1.6 : 0;
    if (y + before > bottom - 2) {
      page++;
      y = TOP + 4;
    }
    y += before;
    at.push({ page, y });
    y += level === 1 ? 6 : 4.8;
  }
  return { at, pages: page + 1 };
}

export async function dossierPdf(
  dossier: Dossier,
  o: DocumentOptions,
): Promise<Blob> {
  const [doc, { autoTable }] = await Promise.all([
    pdfDocument(o.orientation),
    import("jspdf-autotable"),
  ]);
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const inner = W - M * 2;
  const BOTTOM = H - 17;
  const c = dossier.cover;
  const toc: Entry[] = [];
  const page = () => doc.getNumberOfPages();
  let y = TOP;
  const room = (need: number) => {
    if (y + need > BOTTOM) {
      doc.addPage();
      y = TOP;
    }
  };

  // ---------- Cover ----------
  doc.setFillColor(...INK);
  doc.rect(0, 0, W, 5, "F");
  doc.setFillColor(...ACCENT);
  doc.rect(0, 5, W * 0.38, 1.2, "F");
  font(doc, 7, true, ACCENT);
  doc.text(
    `ORION AIC  ·  ${t("dossier de l’opération").toUpperCase()}`,
    M,
    22,
    { charSpace: 0.4 },
  );
  font(doc, 26, true);
  const title = doc.splitTextToSize(c.title, inner) as string[];
  doc.text(title, M, 34);
  y = 34 + title.length * lh(26);
  font(doc, 12, false, MUTED);
  const sub = [c.organization, c.location].filter(Boolean).join("  ·  ");
  if (sub) {
    doc.text(doc.splitTextToSize(sub, inner) as string[], M, y);
    y += lh(12) + 2;
  }
  if (o.watermark) {
    font(doc, 10, true, TONES.crit);
    doc.text(o.watermark, M, y + 2);
    y += 6;
  }
  y += 4;
  autoTable(doc, {
    startY: y,
    body: [
      ...coverFacts(c),
      [t("Document n°"), o.stamp.id],
      [t("Empreinte"), o.stamp.fingerprint],
    ],
    theme: "grid",
    styles: {
      font: "Plex",
      fontSize: 8.5,
      cellPadding: 2,
      textColor: INK,
      lineColor: RULE,
      lineWidth: 0.2,
      overflow: "linebreak",
    },
    columnStyles: {
      0: { cellWidth: 44, fontStyle: "bold", fillColor: FILL },
    },
    margin: { left: M, right: M, top: TOP, bottom: 20 },
  });
  y = lastY(doc) + 8;
  // Contents at a glance.
  font(doc, 7, true, MUTED);
  if (y + 20 < H - 70) {
    doc.text(t("Contenu").toUpperCase(), M, y, { charSpace: 0.4 });
    y += 4;
    for (const ch of dossier.chapters) {
      if (y > H - 72) break;
      font(doc, 8.5, true);
      doc.text(`${ch.number}. ${ch.title}`, M, y);
      font(doc, 8, false, MUTED);
      doc.text(
        doc.splitTextToSize(ch.summary, inner - 60)[0] as string,
        M + 58,
        y,
      );
      y += 4.6;
    }
  }
  verification(doc, o, M, H - 62, inner);

  // ---------- Table of contents (filled at the end) ----------
  // Its entries are known now (one per chapter, map and table): reserve
  // exactly the pages the same layout will use.
  const layout = tocLayout(
    dossier.chapters.flatMap((ch) => [
      1 as const,
      ...ch.blocks.filter((b) => b.kind !== "text").map(() => 2 as const),
    ]),
    BOTTOM,
  );
  const tocStart = page() + 1;
  for (let i = 0; i < layout.pages; i++) doc.addPage();

  // ---------- Chapters ----------
  for (const ch of dossier.chapters) {
    doc.addPage();
    y = TOP;
    toc.push({ level: 1, label: `${ch.number}. ${ch.title}`, page: page() });
    font(doc, 7, true, ACCENT);
    doc.text(t("Partie {n}", { n: ch.number }).toUpperCase(), M, y + 2, {
      charSpace: 0.4,
    });
    font(doc, 18, true);
    doc.text(ch.title, M, y + 10);
    doc.setDrawColor(...INK);
    doc.setLineWidth(0.6);
    doc.line(M, y + 13, W - M, y + 13);
    y += 18;
    y = kpis(doc, ch.kpis, y, inner) + 3;
    for (const b of ch.blocks) {
      if (b.kind === "text") {
        room(14);
        font(doc, 10, true);
        doc.text(b.title, M, y + 3);
        y += 7;
        font(doc, 9);
        for (const line of doc.splitTextToSize(b.body, inner) as string[]) {
          room(lh(9));
          font(doc, 9);
          doc.text(line, M, y + 2.5);
          y += lh(9);
        }
        if (b.meta) {
          room(5);
          font(doc, 7, false, MUTED);
          doc.text(b.meta, M, y + 3);
          y += 5;
        }
        y += 4;
      } else if (b.kind === "map") {
        const image = o.maps[b.mapId];
        let w = inner;
        let h = 0;
        if (image) {
          const size = image;
          h = (w * size.height) / size.width;
          const max = BOTTOM - TOP - 16;
          if (h > max) {
            w = (w * max) / h;
            h = max;
          }
        }
        room(h + 16);
        const heading = t("Carte · {title}", { title: b.title });
        toc.push({ level: 2, label: heading, page: page() });
        font(doc, 10, true);
        doc.text(heading, M, y + 3);
        y += 6;
        if (image) {
          doc.addImage(
            image.jpeg ?? image.png,
            image.jpeg ? "JPEG" : "PNG",
            M + (inner - w) / 2,
            y,
            w,
            h,
            undefined,
            "FAST",
          );
          doc.setDrawColor(...RULE);
          doc.setLineWidth(0.2);
          doc.rect(M + (inner - w) / 2, y, w, h);
          y += h + 2;
        }
        font(doc, 7, false, MUTED);
        doc.text(
          doc.splitTextToSize(
            [b.caption, image?.attribution].filter(Boolean).join("  ·  "),
            inner,
          )[0] as string,
          M,
          y + 3,
        );
        y += 8;
      } else {
        const tbl = b.table;
        const view = tbl.compact ?? tbl;
        room(22);
        toc.push({ level: 2, label: tbl.title, page: page() });
        font(doc, 7.5, true);
        doc.text(tbl.title.toUpperCase(), M, y + 3, { charSpace: 0.3 });
        font(doc, 7, false, MUTED);
        doc.text(tbl.caption, W - M, y + 3, { align: "right" });
        y += 5;
        const rows = view.rows.slice(0, DOCUMENT_ROWS);
        autoTable(doc, {
          startY: y,
          head: [view.columns.map((col) => col.label)],
          body: rows.length
            ? rows
            : [
                [
                  {
                    content: t("Aucun élément."),
                    colSpan: view.columns.length,
                  },
                ],
              ],
          theme: "grid",
          styles: {
            font: "Plex",
            fontSize: view.columns.length > 8 ? 6.5 : 7.5,
            cellPadding: 1.5,
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
          alternateRowStyles: { fillColor: [248, 249, 252] },
          columnStyles: widths(view.columns, inner),
          margin: { left: M, right: M, top: TOP, bottom: 20 },
        });
        y = lastY(doc) + 3;
        if (view.rows.length > rows.length) {
          font(doc, 7, false, MUTED);
          doc.text(
            t("… {n} lignes de plus dans les exports tableur.", {
              n: view.rows.length - rows.length,
            }),
            M,
            y + 2,
          );
          y += 4;
        }
        y += 5;
      }
    }
  }

  // ---------- Verification (last page) ----------
  room(64);
  y += 4;
  font(doc, 12, true);
  doc.text(t("Vérification de ce document"), M, y + 4);
  y += 8;
  verification(doc, o, M, y, inner);

  // ---------- Table of contents ----------
  doc.setPage(tocStart);
  font(doc, 18, true);
  doc.text(t("Sommaire"), M, TOP + 8);
  toc.forEach((e, i) => {
    const spot = layout.at[i];
    doc.setPage(tocStart + spot.page);
    const ty = spot.y;
    const size = e.level === 1 ? 10 : 8.5;
    const x = e.level === 1 ? M : M + 6;
    font(doc, size, e.level === 1, e.level === 1 ? INK : MUTED);
    const label = doc.splitTextToSize(e.label, inner - 30)[0] as string;
    doc.text(label, x, ty);
    const number = String(e.page);
    doc.text(number, W - M, ty, { align: "right" });
    const from = x + doc.getTextWidth(label) + 2;
    const to = W - M - doc.getTextWidth(number) - 2;
    doc.setDrawColor(...RULE);
    doc.setLineWidth(0.2);
    doc.setLineDashPattern([0.4, 1], 0);
    if (to > from) doc.line(from, ty, to, ty);
    doc.setLineDashPattern([], 0);
    doc.link(x, ty - size * 0.3528, W - M - x, size * 0.3528 * 1.4, {
      pageNumber: e.page,
    });
  });

  // ---------- Every page: header, footer, watermark ----------
  const total = page();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    if (i > 1) {
      font(doc, 6.5, true, MUTED);
      doc.text(`ORION AIC  ·  ${c.title.toUpperCase()}`.slice(0, 90), M, 14, {
        charSpace: 0.3,
      });
      doc.text(
        `${enumLabel(c.mode).toUpperCase()} · ${enumLabel(c.classification).toUpperCase()}`,
        W - M,
        14,
        { align: "right", charSpace: 0.3 },
      );
      font(doc, 7, false, MUTED);
      doc.text(c.shown, W - M, 18, { align: "right" });
      doc.setDrawColor(...INK);
      doc.setLineWidth(0.4);
      doc.line(M, 20, W - M, 20);
    }
    doc.setDrawColor(...RULE);
    doc.setLineWidth(0.2);
    doc.line(M, H - 11, W - M, H - 11);
    font(doc, 6.5, false, MUTED);
    doc.text(
      doc.splitTextToSize(o.stamp.label, inner - 24)[0] as string,
      M,
      H - 7,
    );
    doc.text(`${i} / ${total}`, W - M, H - 7, { align: "right" });
    if (o.watermark) watermark(doc, o.watermark, W, H);
  }
  return doc.output("blob");
}

const lastY = (doc: Doc) =>
  (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable
    .finalY;

function widths(columns: Column[], inner: number) {
  const sum = columns.reduce((n, c) => n + (c.weight ?? 1), 0);
  return Object.fromEntries(
    columns.map((c, i) => [i, { cellWidth: ((c.weight ?? 1) / sum) * inner }]),
  );
}

function kpis(doc: Doc, list: Kpi[], y: number, inner: number) {
  if (!list.length) return y;
  const w = Math.min(38, (inner - (list.length - 1) * 3) / list.length);
  list.forEach((k, i) => {
    const x = M + i * (w + 3);
    doc.setFillColor(...FILL);
    doc.roundedRect(x, y, w, 13, 1.5, 1.5, "F");
    font(doc, 13, true, k.tone && k.value !== "0" ? TONES[k.tone] : INK);
    doc.text(k.value, x + 3, y + 6.5);
    font(doc, 6.5, false, MUTED);
    doc.text(doc.splitTextToSize(k.label, w - 5)[0] as string, x + 3, y + 10.8);
  });
  return y + 17;
}

function verification(
  doc: Doc,
  o: DocumentOptions,
  x: number,
  y: number,
  inner: number,
) {
  doc.setDrawColor(...RULE);
  doc.setLineWidth(0.3);
  doc.roundedRect(x, y, inner, 44, 2, 2);
  drawQr(doc, o.stamp.qr, x + 4, y + 4, 36);
  font(doc, 7, true, ACCENT);
  doc.text(t("Vérifier ce document").toUpperCase(), x + 46, y + 9, {
    charSpace: 0.4,
  });
  font(doc, 8.5, false, INK);
  doc.text(
    doc.splitTextToSize(
      o.stamp.key
        ? t(
            "Ce code identifie l’export n° {id}, l’empreinte SHA-256 de son contenu et sa signature par la clé {key} ({alg}). Le fichier PDF est signé lui aussi. Dans orion aic, Traçabilité → Vérifier un document : déposer le PDF ou saisir le texte de ce code.",
            { id: o.stamp.id, key: o.stamp.key, alg: o.stamp.alg },
          )
        : t(
            "Ce code identifie l’export n° {id} et l’empreinte de son contenu ({fingerprint}). L’empreinte SHA-256 du fichier est inscrite au registre des exports de l’opération : dans orion aic, Traçabilité → Vérifier un document.",
            { id: o.stamp.id, fingerprint: o.stamp.fingerprint },
          ),
      inner - 52,
    ) as string[],
    x + 46,
    y + 15,
  );
  font(doc, 6.5, false, MUTED);
  doc.text(
    doc.splitTextToSize(o.stamp.label, inner - 52)[0] as string,
    x + 46,
    y + 39,
  );
}

function watermark(doc: Doc, text: string, W: number, H: number) {
  const GState = (doc as unknown as { GState: new (p: object) => unknown })
    .GState;
  doc.saveGraphicsState();
  doc.setGState(new GState({ opacity: 0.09 }));
  doc.setFont("Plex", "bold");
  doc.setFontSize(100);
  const angle = Math.atan2(H, W);
  const target = Math.hypot(W, H) * 0.72;
  const size = Math.min(140, (100 * target) / doc.getTextWidth(text));
  doc.setFontSize(size);
  doc.setTextColor(...INK);
  const w = doc.getTextWidth(text);
  const cap = size * 0.3528 * 0.7;
  const x = W / 2 - (w / 2) * Math.cos(angle) + (cap / 2) * Math.sin(angle);
  const y = H / 2 + (w / 2) * Math.sin(angle) + (cap / 2) * Math.cos(angle);
  doc.text(text, x, y, { angle: (angle * 180) / Math.PI });
  doc.restoreGraphicsState();
}
