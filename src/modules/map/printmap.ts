import type { jsPDF } from "jspdf";
import type { Journal } from "../../../shared/journal";
import type { Place } from "../../../shared/ops";
import { fromMN95, toMN95 } from "../../../shared/coordinates";
import { renderMap } from "./render";
import {
  builtinInfo,
  customId,
  isCustom,
  OFFICIAL,
  symbolName,
} from "./builtins";
import { loadCatalog } from "./symbols";
import { formatDateTime } from "../../../shared/i18n/core.ts";
import { enumLabel } from "../../../shared/i18n/enums.ts";
import { t, tn } from "./i18n-2.ts";
import { effectiveColor } from "./geoformats";
import { layerKey, placesOf, sortMaps } from "./maps";
import { project, unproject, type LatLng } from "./projection";
import {
  PX_PER_MM,
  clipSegment,
  gridLabel,
  gridSpacing,
  gridValues,
  printLayout,
  printZoom,
  scaleBar,
  scaleLabel,
  type Orientation,
  type Paper,
} from "./printscale";

// Print to scale: A4 / A3 PDF with the map at an exact scale, the Swiss
// grid, a legend of the symbols shown, north arrow, scale bar, time stamp,
// event name and classification.

export type PrintOptions = {
  journal: Journal;
  mapId: string;
  mapName: string;
  center: LatLng;
  scale: number;
  paper: Paper;
  orientation: Orientation;
  base: string;
  overlays: { url: string; opacity: number }[];
  grid: boolean;
  title: string;
  author: string;
};

type RGB = [number, number, number];
const INK: RGB = [17, 20, 39];
const MUTED: RGB = [98, 106, 118];

async function pdf(paper: Paper, orientation: Orientation): Promise<jsPDF> {
  const [{ jsPDF }, regular, semibold] = await Promise.all([
    import("jspdf"),
    import("../../journal/pdf-font-regular.ts"),
    import("../../journal/pdf-font-semibold.ts"),
  ]);
  const doc = new jsPDF({
    orientation,
    unit: "mm",
    format: paper.toLowerCase(),
  });
  doc.addFileToVFS("Plex-Regular.ttf", regular.default);
  doc.addFileToVFS("Plex-Semibold.ttf", semibold.default);
  doc.addFont("Plex-Regular.ttf", "Plex", "normal");
  doc.addFont("Plex-Semibold.ttf", "Plex", "bold");
  doc.setFont("Plex", "normal");
  return doc;
}

const font = (doc: jsPDF, size: number, bold = false, rgb: RGB = INK) => {
  doc.setFont("Plex", bold ? "bold" : "normal");
  doc.setFontSize(size);
  doc.setTextColor(...rgb);
};

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/** A symbol as a small PNG for the legend. */
async function legendIcon(journal: Journal, symbol: string, color: string) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 64;
  const ctx = canvas.getContext("2d")!;
  let src = "";
  if (OFFICIAL.test(symbol))
    src = `${import.meta.env.BASE_URL}symbols/${symbol}.svg`;
  else if (isCustom(symbol))
    src =
      journal.ops.symbols.find((s) => s.id === customId(symbol))?.image ?? "";
  const img = src ? await loadImage(src) : null;
  if (img) {
    const k = Math.min(
      60 / (img.naturalWidth || 60),
      60 / (img.naturalHeight || 60),
    );
    const w = (img.naturalWidth || 60) * k;
    const h = (img.naturalHeight || 60) * k;
    ctx.drawImage(img, 32 - w / 2, 32 - h / 2, w, h);
  } else {
    ctx.beginPath();
    ctx.arc(32, 32, 20, 0, Math.PI * 2);
    ctx.fillStyle = builtinInfo(symbol)?.color ?? color;
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#ffffff";
    ctx.stroke();
  }
  return canvas.toDataURL("image/png");
}

const hexRgb = (hex: string): RGB => [
  parseInt(hex.slice(1, 3), 16) || 0,
  parseInt(hex.slice(3, 5), 16) || 0,
  parseInt(hex.slice(5, 7), 16) || 0,
];

export async function printMap(
  o: PrintOptions,
): Promise<{ blob: Blob; name: string }> {
  const layout = printLayout(o.paper, o.orientation);
  const { frame, head, foot, page } = layout;
  const zoom = printZoom(o.center[0], o.scale);
  const widthPx = frame.w * PX_PER_MM;
  const heightPx = frame.h * PX_PER_MM;
  await loadCatalog();
  const image = await renderMap(o.journal, {
    mapId: o.mapId,
    width: widthPx,
    height: heightPx,
    scale: 2,
    view: { lat: o.center[0], lng: o.center[1], zoom },
    base: o.base,
    overlays: o.overlays,
    bare: true,
  });

  // Paper millimetres ↔ positions.
  const k = 2 ** zoom;
  const [cx, cy] = project(o.center);
  const toMm = (p: LatLng): [number, number] => {
    const [x, y] = project(p);
    return [
      frame.x + ((x - cx) * k + widthPx / 2) / PX_PER_MM,
      frame.y + ((y - cy) * k + heightPx / 2) / PX_PER_MM,
    ];
  };
  const toLatLng = (mx: number, my: number): LatLng =>
    unproject([
      cx + ((mx - frame.x) * PX_PER_MM - widthPx / 2) / k,
      cy + ((my - frame.y) * PX_PER_MM - heightPx / 2) / k,
    ]);

  const doc = await pdf(o.paper, o.orientation);
  doc.setLineHeightFactor(1.25);

  /* Title band */
  font(doc, 13, true);
  doc.text(o.title || o.mapName, head.x, head.y + 5.5, {
    maxWidth: head.w * 0.62,
  });
  font(doc, 8.5, false, MUTED);
  doc.text(
    [o.journal.title, o.journal.location].filter(Boolean).join(" · "),
    head.x,
    head.y + 10.5,
    { maxWidth: head.w * 0.62 },
  );
  const classification = enumLabel(
    o.journal.classification || "",
  ).toUpperCase();
  font(doc, 8, true);
  if (classification) {
    const w = doc.getTextWidth(classification) + 4;
    doc.setDrawColor(...INK);
    doc.setLineWidth(0.3);
    doc.rect(head.x + head.w - w, head.y + 1.2, w, 5.4);
    doc.text(classification, head.x + head.w - w + 2, head.y + 5.1);
  }
  font(doc, 12, true);
  doc.text(scaleLabel(o.scale), head.x + head.w, head.y + 11.5, {
    align: "right",
  });

  /* Map */
  doc.addImage(
    image.dataUrl,
    "PNG",
    frame.x,
    frame.y,
    frame.w,
    frame.h,
    undefined,
    "FAST",
  );

  /* Swiss grid, vector, clipped to the frame */
  if (o.grid) {
    const spacing = gridSpacing(o.scale);
    try {
      const corners = [
        toLatLng(frame.x, frame.y),
        toLatLng(frame.x + frame.w, frame.y),
        toLatLng(frame.x, frame.y + frame.h),
        toLatLng(frame.x + frame.w, frame.y + frame.h),
      ].map(([lat, lng]) => toMN95(lat, lng));
      let minE = Infinity;
      let maxE = -Infinity;
      let minN = Infinity;
      let maxN = -Infinity;
      for (const c of corners) {
        minE = Math.min(minE, c.east);
        maxE = Math.max(maxE, c.east);
        minN = Math.min(minN, c.north);
        maxN = Math.max(maxN, c.north);
      }
      const line = (points: LatLng[]) => {
        const mm = points.map(toMm);
        const kept: [number, number][] = [];
        for (let i = 1; i < mm.length; i++) {
          const seg = clipSegment(mm[i - 1], mm[i], frame);
          if (!seg) continue;
          doc.line(seg[0][0], seg[0][1], seg[1][0], seg[1][1]);
          kept.push(...seg);
        }
        return kept;
      };
      const at = (e: number, n: number): LatLng => {
        const p = fromMN95(e, n);
        return [p.lat, p.lng];
      };
      doc.setLineWidth(0.15);
      doc.setDrawColor(40, 44, 60);
      font(doc, 6, true);
      const plate = (
        text: string,
        x: number,
        y: number,
        align: "left" | "right" | "center",
      ) => {
        const w = doc.getTextWidth(text) + 1.6;
        const left =
          align === "left" ? x : align === "right" ? x - w : x - w / 2;
        doc.setFillColor(255, 255, 255);
        doc.rect(left, y - 2.4, w, 3.1, "F");
        doc.text(text, left + 0.8, y);
      };
      for (const e of gridValues(minE, maxE, spacing)) {
        const pts = Array.from({ length: 13 }, (_, i) =>
          at(e, minN + ((maxN - minN) * i) / 12),
        );
        const kept = line(pts);
        if (kept.length) {
          const top = kept.reduce((a, b) => (b[1] < a[1] ? b : a));
          const bottom = kept.reduce((a, b) => (b[1] > a[1] ? b : a));
          plate(gridLabel(e, spacing), top[0], frame.y + 3, "center");
          plate(
            gridLabel(e, spacing),
            bottom[0],
            frame.y + frame.h - 1,
            "center",
          );
        }
      }
      for (const n of gridValues(minN, maxN, spacing)) {
        const pts = Array.from({ length: 13 }, (_, i) =>
          at(minE + ((maxE - minE) * i) / 12, n),
        );
        const kept = line(pts);
        if (kept.length) {
          const left = kept.reduce((a, b) => (b[0] < a[0] ? b : a));
          const right = kept.reduce((a, b) => (b[0] > a[0] ? b : a));
          plate(gridLabel(n, spacing), frame.x + 1, left[1] + 1, "left");
          plate(
            gridLabel(n, spacing),
            frame.x + frame.w - 1,
            right[1] + 1,
            "right",
          );
        }
      }
    } catch {
      // Outside the Swiss grid: no grid.
    }
  }

  /* Frame, north arrow */
  doc.setDrawColor(...INK);
  doc.setLineWidth(0.4);
  doc.rect(frame.x, frame.y, frame.w, frame.h);
  const nx = frame.x + frame.w - 9;
  const ny = frame.y + 13;
  doc.setFillColor(255, 255, 255);
  doc.circle(nx, ny, 5.5, "F");
  doc.setFillColor(...INK);
  doc.triangle(nx, ny - 4.2, nx + 2, ny + 1, nx - 2, ny + 1, "F");
  font(doc, 6.5, true);
  doc.text("N", nx, ny + 3.9, { align: "center" });

  /* Scale bar */
  const bar = scaleBar(o.scale, Math.min(60, foot.w * 0.28));
  const bx = foot.x;
  const by = foot.y + 10;
  font(doc, 14, true);
  doc.text(scaleLabel(o.scale), bx, foot.y + 5.5);
  const quarter = bar.mm / 4;
  for (let i = 0; i < 4; i++) {
    if (i % 2) doc.setFillColor(255, 255, 255);
    else doc.setFillColor(...INK);
    doc.rect(bx + i * quarter, by, quarter, 1.6, "FD");
  }
  font(doc, 6.5, false, MUTED);
  doc.text("0", bx, by + 4.6, { align: "center" });
  doc.text(bar.label, bx + bar.mm, by + 4.6, { align: "center" });
  const [clat, clng] = o.center;
  let centre = "";
  try {
    const c = toMN95(clat, clng);
    centre = t("Centre E {east} · N {north}", {
      east: gridLabel(Math.round(c.east), 1),
      north: gridLabel(Math.round(c.north), 1),
    });
  } catch {
    centre = t("Centre {lat}, {lng}", {
      lat: clat.toFixed(5),
      lng: clng.toFixed(5),
    });
  }
  doc.text(centre, bx, by + 9);
  if (o.grid)
    doc.text(
      t("Quadrillage MN95 : {spacing}", {
        spacing:
          gridSpacing(o.scale) >= 1000 ? "1 km" : `${gridSpacing(o.scale)} m`,
      }),
      bx,
      by + 12.5,
    );

  /* Legend: symbols and layers shown in the frame */
  const maps = sortMaps(o.journal.ops.maps ?? []);
  const record = maps.find((m) => m.id === o.mapId);
  let places = placesOf(o.journal.ops.places, maps, record ? record.id : "");
  if (record?.hidden.length) {
    const hidden = new Set(record.hidden);
    places = places.filter((p) => !hidden.has(layerKey(p)));
  }
  const inFrame = (p: Place) =>
    p.points.some((pt) => {
      const [x, y] = toMm(pt);
      return (
        x >= frame.x &&
        x <= frame.x + frame.w &&
        y >= frame.y &&
        y <= frame.y + frame.h
      );
    });
  const symbols = new Map<string, Place>();
  const layers = new Map<string, string>();
  for (const p of places) {
    if (!inFrame(p)) continue;
    if (p.kind === "point" && p.symbol && !symbols.has(p.symbol))
      symbols.set(p.symbol, p);
    if (p.kind === "line" || p.kind === "area")
      if (!layers.has(layerKey(p) || t("Sans calque")))
        layers.set(layerKey(p) || t("Sans calque"), effectiveColor(p));
  }
  const lx = foot.x + foot.w * 0.3;
  const lw = foot.w * 0.42;
  font(doc, 7.5, true);
  doc.text(t("Légende"), lx, foot.y + 3);
  const rowH = 5;
  const cols = 2;
  const colW = lw / cols;
  const capacity = Math.max(1, Math.floor((foot.h - 6) / rowH) * cols);
  const items: { icon?: string; color?: string; label: string }[] = [];
  for (const [symbol, p] of symbols)
    items.push({
      icon: await legendIcon(o.journal, symbol, effectiveColor(p)),
      label:
        symbolName(symbol, o.journal.ops.symbols ?? []) ||
        p.label ||
        t("Signe"),
    });
  for (const [layer, color] of layers) items.push({ color, label: layer });
  font(doc, 6.8, false);
  items.slice(0, capacity).forEach((item, i) => {
    const x = lx + (i % cols) * colW;
    const y = foot.y + 6 + Math.floor(i / cols) * rowH;
    if (item.icon) doc.addImage(item.icon, "PNG", x, y - 0.4, 4, 4);
    else if (item.color) {
      doc.setDrawColor(...hexRgb(item.color));
      doc.setLineWidth(1.1);
      doc.line(x, y + 1.6, x + 4, y + 1.6);
    }
    doc.setTextColor(...INK);
    doc.text(
      doc.splitTextToSize(item.label, colW - 7)[0] ?? "",
      x + 5.5,
      y + 2.7,
    );
  });
  if (!items.length) {
    font(doc, 6.8, false, MUTED);
    doc.text(t("Aucun objet dans le cadre."), lx, foot.y + 8);
  } else if (items.length > capacity) {
    font(doc, 6.5, false, MUTED);
    doc.text(
      tn(items.length - capacity, "… et {n} autre", "… et {n} autres"),
      lx,
      foot.y + foot.h - 0.5,
    );
  }

  /* Time stamp, sources */
  const rx = foot.x + foot.w;
  const stamp = formatDateTime(Date.now());
  font(doc, 7, true);
  doc.text(t("Imprimé le {stamp}", { stamp }), rx, foot.y + 3, {
    align: "right",
  });
  font(doc, 6.5, false, MUTED);
  const lines = [
    o.author ? t("par {author}", { author: o.author }) : "",
    t("Carte : {name}", { name: o.mapName }),
    o.orientation === "portrait"
      ? t("{paper} portrait · imprimer à 100 %", { paper: o.paper })
      : t("{paper} paysage · imprimer à 100 %", { paper: o.paper }),
    t("Fond {source}", { source: image.attribution || "—" }),
    "orion aic",
  ].filter(Boolean);
  lines.forEach((l, i) =>
    doc.text(l, rx, foot.y + 7 + i * 3.3, {
      align: "right",
      maxWidth: foot.w * 0.26,
    }),
  );
  if (classification) {
    font(doc, 6.5, true);
    doc.text(classification, page.w / 2, page.h - 4, { align: "center" });
  }

  const slug = (o.title || o.mapName)
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase()
    .slice(0, 40);
  return {
    blob: doc.output("blob"),
    name: `${t("carte")}-${slug || t("situation")}-1-${o.scale}-${o.paper.toLowerCase()}.pdf`,
  };
}
