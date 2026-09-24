import type { jsPDF } from "jspdf";
import {
  PAGE_H,
  PAGE_W,
  type BoxShape,
  type DeckImages,
  type ImageShape,
  type InkStroke,
  type Para,
  type Palette,
  type SlideLayout,
  type TableShape,
} from "./layout.ts";
import { hexColor } from "./text.ts";

// PDF slides: one 16:9 page per slide (960 × 540 pt), IBM Plex embedded,
// the same shapes as the other formats. Printable handout of a briefing.

export type PdfMeta = { title: string; author: string; palette: Palette };

const K = 960 / PAGE_W; // pt per px
const LH = 1.18;

const rgb = (value: string) =>
  [0, 2, 4].map((i) =>
    parseInt(hexColor(value, "808080").slice(i, i + 2), 16),
  ) as [number, number, number];

async function slideDocument(): Promise<jsPDF> {
  const [{ jsPDF }, regular, semibold] = await Promise.all([
    import("jspdf"),
    import("../journal/pdf-font-regular.ts"),
    import("../journal/pdf-font-semibold.ts"),
  ]);
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "pt",
    format: [960, 540],
  });
  doc.addFileToVFS("Plex-Regular.ttf", regular.default);
  doc.addFileToVFS("Plex-Semibold.ttf", semibold.default);
  doc.addFont("Plex-Regular.ttf", "Plex", "normal");
  doc.addFont("Plex-Semibold.ttf", "Plex", "bold");
  doc.setFont("Plex", "normal");
  return doc;
}

function opacity(doc: jsPDF, value: number) {
  doc.setGState(
    new (doc as unknown as { GState: new (o: object) => unknown }).GState({
      opacity: value,
      "stroke-opacity": value,
    }),
  );
}

type Line = {
  runs: { text: string; bold: boolean; color: string; size: number }[];
  width: number;
};

/** Lines of a paragraph at its own width, measured with the real font. */
function layoutPara(
  doc: jsPDF,
  p: Para,
  width: number,
): { lines: Line[]; size: number } {
  const measure = (text: string, bold: boolean, size: number) => {
    doc.setFont("Plex", bold ? "bold" : "normal");
    doc.setFontSize(size * K);
    return doc.getTextWidth(text) + text.length * (p.spacing ?? 0) * K;
  };
  const runs = p.runs.map((r) => ({
    text: r.text,
    bold: r.bold ?? !!p.bold,
    color: r.color ?? p.color,
    size: r.size ?? p.size,
  }));
  const size = Math.max(...runs.map((r) => r.size));
  const total = runs.reduce((w, r) => w + measure(r.text, r.bold, r.size), 0);
  if (
    runs.length > 1 &&
    total <= width &&
    !runs.some((r) => r.text.includes("\n"))
  )
    return { lines: [{ runs, width: total }], size };
  // Several styles on several lines: the first style is used for all.
  const first = runs[0];
  doc.setFont("Plex", first.bold ? "bold" : "normal");
  doc.setFontSize(first.size * K);
  const text = runs.map((r) => r.text).join("");
  const split = doc.splitTextToSize(text, width) as string[];
  return {
    lines: split.map((t) => ({
      runs: [{ ...first, text: t }],
      width: measure(t, first.bold, first.size),
    })),
    size: first.size,
  };
}

function drawText(doc: jsPDF, s: BoxShape) {
  if (!s.paras?.length) return;
  const pad = (s.pad ?? 0) * K;
  const x = s.x * K + pad;
  const w = s.w * K - pad * 2;
  const blocks = s.paras.map((p) => ({ p, ...layoutPara(doc, p, w) }));
  const height = blocks.reduce(
    (h, b) => h + b.lines.length * b.size * K * LH + (b.p.after ?? 0) * K,
    0,
  );
  const inner = s.h * K - pad * 2;
  let y = s.y * K + pad;
  if (s.valign === "m") y += (inner - height) / 2;
  if (s.valign === "b") y += inner - height;
  for (const b of blocks) {
    if (b.p.alpha !== undefined) opacity(doc, b.p.alpha);
    for (const line of b.lines) {
      const lh = b.size * K * LH;
      const baseline = y + lh * 0.8;
      let lx = x;
      if (b.p.align === "c") lx = x + (w - line.width) / 2;
      if (b.p.align === "r") lx = x + w - line.width;
      for (const r of line.runs) {
        doc.setFont("Plex", r.bold ? "bold" : "normal");
        doc.setFontSize(r.size * K);
        doc.setTextColor(...rgb(r.color));
        doc.text(r.text, lx, baseline, {
          charSpace: (b.p.spacing ?? 0) * K,
          baseline: "alphabetic",
        });
        lx += doc.getTextWidth(r.text) + r.text.length * (b.p.spacing ?? 0) * K;
      }
      y += lh;
    }
    y += (b.p.after ?? 0) * K;
    if (b.p.alpha !== undefined) opacity(doc, 1);
  }
}

function drawRotated(doc: jsPDF, s: BoxShape) {
  // Watermark: one line turned around the centre of the box.
  const p = s.paras?.[0];
  if (!p) return;
  const text = p.runs.map((r) => r.text).join("");
  doc.setFont("Plex", p.bold ? "bold" : "normal");
  doc.setFontSize(p.size * K);
  const tw = doc.getTextWidth(text) + text.length * (p.spacing ?? 0) * K;
  const a = (-(s.rot ?? 0) * Math.PI) / 180;
  const cx = (s.x + s.w / 2) * K;
  const cy = (s.y + s.h / 2) * K;
  const down = p.size * K * 0.35;
  const x = cx - (tw / 2) * Math.cos(a) + down * Math.sin(a);
  const y = cy + (tw / 2) * Math.sin(a) + down * Math.cos(a);
  if (p.alpha !== undefined) opacity(doc, p.alpha);
  doc.setTextColor(...rgb(p.color));
  doc.text(text, x, y, {
    angle: (a * 180) / Math.PI,
    charSpace: (p.spacing ?? 0) * K,
  });
  opacity(doc, 1);
}

function drawBox(doc: jsPDF, s: BoxShape) {
  if (s.rot) return drawRotated(doc, s);
  const x = s.x * K,
    y = s.y * K,
    w = s.w * K,
    h = s.h * K;
  if (s.fill || s.line) {
    const style = s.fill && s.line ? "FD" : s.fill ? "F" : "S";
    if (s.fill) doc.setFillColor(...rgb(s.fill));
    if (s.line) {
      doc.setDrawColor(...rgb(s.line));
      doc.setLineWidth((s.lineW ?? 2) * K);
    }
    if (s.soft && s.fill && s.ellipse) {
      // Soft glow: stacked translucent ellipses.
      const steps = 8;
      opacity(doc, (s.alpha ?? 1) / steps);
      for (let i = 0; i < steps; i++) {
        const f = 1 - i * 0.07;
        doc.ellipse(x + w / 2, y + h / 2, (w / 2) * f, (h / 2) * f, "F");
      }
      opacity(doc, 1);
      return;
    }
    if (s.alpha !== undefined && s.alpha < 1) opacity(doc, s.alpha);
    if (s.ellipse) doc.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, style);
    else if (s.radius) {
      const r = Math.min(s.radius * K, w / 2, h / 2);
      doc.roundedRect(x, y, w, h, r, r, style);
    } else doc.rect(x, y, w, h, style);
    opacity(doc, 1);
    // A translucent card keeps an opaque outline.
    if (s.fill && s.line && s.alpha !== undefined && s.alpha < 1) {
      if (s.radius) {
        const r = Math.min(s.radius * K, w / 2, h / 2);
        doc.roundedRect(x, y, w, h, r, r, "S");
      } else doc.rect(x, y, w, h, "S");
    }
  }
  drawText(doc, s);
}

function drawImage(doc: jsPDF, s: ImageShape, images: DeckImages) {
  const image = images[s.key];
  if (!image) return;
  const x = s.x * K,
    y = s.y * K,
    w = s.w * K,
    h = s.h * K;
  // Cover the box, cropped by a clipping rectangle.
  const scale = Math.max(w / image.width, h / image.height);
  const iw = image.width * scale,
    ih = image.height * scale;
  doc.saveGraphicsState();
  doc.rect(x, y, w, h, null);
  doc.clip();
  doc.discardPath();
  doc.addImage(
    image.bytes,
    "PNG",
    x + (w - iw) / 2,
    y + (h - ih) / 2,
    iw,
    ih,
    s.key,
    "FAST",
  );
  doc.restoreGraphicsState();
}

function drawTable(doc: jsPDF, s: TableShape, p: Palette) {
  const head = s.size * 1.25 + 30;
  let y = s.y;
  s.rows.forEach((row, ri) => {
    const isHead = s.header && ri === 0;
    const h = isHead ? head : s.rowH;
    let x = s.x;
    row.forEach((c, ci) => {
      drawBox(doc, {
        type: "box",
        name: "Cellule",
        x,
        y,
        w: s.cols[ci],
        h,
        fill: isHead ? p.surface2 : ri % 2 ? p.surface : p.bg,
        valign: "m",
        pad: 14,
        paras: [
          {
            runs: [{ text: c.text, bold: c.bold || isHead, color: c.color }],
            size: isHead ? Math.max(16, s.size - 4) : s.size,
            color: c.color ?? p.text,
            align: c.align,
          },
        ],
      });
      x += s.cols[ci];
    });
    doc.setDrawColor(...rgb(p.line));
    doc.setLineWidth(1);
    doc.line(s.x * K, (y + h) * K, x * K, (y + h) * K);
    y += h;
  });
}

function drawInk(doc: jsPDF, strokes: InkStroke[]) {
  for (const s of strokes) {
    if (s.points.length < 2) continue;
    doc.setDrawColor(...rgb(s.color));
    doc.setLineCap("round");
    doc.setLineJoin("round");
    if (s.tool === "marker") opacity(doc, 0.35);
    for (let i = 1; i < s.points.length; i++) {
      const [x0, y0, p0] = s.points[i - 1];
      const [x1, y1, p1] = s.points[i];
      const pressure = s.tool === "marker" ? 1 : 0.4 + ((p0 + p1) / 2) * 0.8;
      doc.setLineWidth(s.width * pressure * K);
      doc.line(x0 * K, y0 * K, x1 * K, y1 * K);
    }
    opacity(doc, 1);
  }
}

/** The PDF of the laid-out slides, one page per slide. */
export async function writePdfSlides(
  slides: SlideLayout[],
  images: DeckImages,
  meta: PdfMeta,
  /** Annotations drawn over the slides, by slide id. */
  ink: Record<string, InkStroke[]> = {},
): Promise<Uint8Array> {
  const doc = await slideDocument();
  doc.setProperties({
    title: meta.title,
    author: meta.author,
    creator: "orion aic",
  });
  slides.forEach((slide, i) => {
    if (i) doc.addPage([960, 540], "landscape");
    doc.setFillColor(...rgb(slide.background));
    doc.rect(0, 0, PAGE_W * K, PAGE_H * K, "F");
    for (const s of slide.shapes) {
      if (s.type === "image") drawImage(doc, s, images);
      else if (s.type === "table") drawTable(doc, s, meta.palette);
      else drawBox(doc, s);
    }
    drawInk(doc, ink[slide.id] ?? []);
  });
  return new Uint8Array(doc.output("arraybuffer"));
}
