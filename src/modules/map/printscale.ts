// Print to scale: paper layout, ground extent, zoom of the rendering,
// Swiss grid lines and scale bar. Pure (no DOM): tested in node.

import { resolutionAt, zoomFor } from "./projection.ts";

export type Paper = "A4" | "A3";
export type Orientation = "portrait" | "landscape";
export const PAPERS: Record<Paper, [number, number]> = {
  A4: [210, 297],
  A3: [297, 420],
};
export const SCALES = [5000, 10000, 25000, 50000] as const;
/** CSS pixels of the rendered map per millimetre of paper (≈ 100 dpi × 2). */
export const PX_PER_MM = 4;

export type Rect = { x: number; y: number; w: number; h: number };
export type PrintLayout = {
  page: { w: number; h: number };
  /** Map frame on the page, millimetres from the top left corner. */
  frame: Rect;
  /** Title band above the frame. */
  head: Rect;
  /** Legend, scale and notes below the frame. */
  foot: Rect;
};

const MARGIN = 10;
const HEAD = 13;

/** Page, map frame, title band and legend band of a print. */
export function printLayout(
  paper: Paper,
  orientation: Orientation,
): PrintLayout {
  const [a, b] = PAPERS[paper];
  const [w, h] = orientation === "portrait" ? [a, b] : [b, a];
  const foot = Math.round(h * (orientation === "portrait" ? 0.15 : 0.19));
  const inner = w - MARGIN * 2;
  const frameH = h - MARGIN * 2 - HEAD - foot - 3;
  return {
    page: { w, h },
    head: { x: MARGIN, y: MARGIN, w: inner, h: HEAD },
    frame: { x: MARGIN, y: MARGIN + HEAD, w: inner, h: frameH },
    foot: { x: MARGIN, y: MARGIN + HEAD + frameH + 3, w: inner, h: foot },
  };
}

/** Ground covered by a frame at a scale, in metres. */
export const groundOf = (frame: Pick<Rect, "w" | "h">, scale: number) => ({
  w: (frame.w / 1000) * scale,
  h: (frame.h / 1000) * scale,
});

/**
 * Zoom of the CSS pixels of the rendering (PX_PER_MM per millimetre) so
 * that the paper shows the ground at `scale`, at the latitude of the
 * centre (Web Mercator scale varies by 0.1 % over 5 km: negligible).
 */
export function printZoom(lat: number, scale: number, pxPerMm = PX_PER_MM) {
  return zoomFor(lat, scale / 1000 / pxPerMm);
}

/** Scale actually obtained on paper for a zoom (check of printZoom). */
export const scaleOf = (lat: number, zoom: number, pxPerMm = PX_PER_MM) =>
  resolutionAt(lat, zoom) * pxPerMm * 1000;

/** Spacing of the Swiss grid printed at a scale: 2 to 5 cm on paper. */
export function gridSpacing(scale: number) {
  if (scale <= 5000) return 100;
  if (scale <= 12500) return 250;
  if (scale <= 30000) return 1000;
  return 1000;
}

/** Grid values between two coordinates, multiples of `spacing`. */
export function gridValues(min: number, max: number, spacing: number) {
  const out: number[] = [];
  const first = Math.ceil(min / spacing) * spacing;
  for (let v = first; v <= max && out.length < 400; v += spacing) out.push(v);
  return out;
}

/** "2'600" (km) or "2'600'250" (m): the label of a grid line. */
export function gridLabel(value: number, spacing: number) {
  const group = (n: number) =>
    String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, "'");
  return spacing >= 1000 ? group(value / 1000) : group(value);
}

/** Scale bar: the longest round length (1, 2, 5 × 10ⁿ m) under `maxMm`. */
export function scaleBar(scale: number, maxMm: number) {
  const maxMetres = (maxMm / 1000) * scale;
  const exp = 10 ** Math.floor(Math.log10(maxMetres));
  const metres =
    [5, 2, 1].map((k) => k * exp).find((v) => v <= maxMetres) ?? exp;
  return {
    metres,
    mm: (metres * 1000) / scale,
    label: metres >= 1000 ? `${metres / 1000} km` : `${metres} m`,
  };
}

/** "1:25'000" */
export const scaleLabel = (scale: number) =>
  `1:${String(scale).replace(/\B(?=(\d{3})+(?!\d))/g, "'")}`;

/**
 * Part of the segment a–b inside the rectangle (Liang–Barsky), or null.
 */
export function clipSegment(
  a: [number, number],
  b: [number, number],
  r: Rect,
): [[number, number], [number, number]] | null {
  let t0 = 0;
  let t1 = 1;
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const edges: [number, number][] = [
    [-dx, a[0] - r.x],
    [dx, r.x + r.w - a[0]],
    [-dy, a[1] - r.y],
    [dy, r.y + r.h - a[1]],
  ];
  for (const [p, q] of edges) {
    if (p === 0) {
      if (q < 0) return null;
    } else {
      const t = q / p;
      if (p < 0) {
        if (t > t1) return null;
        if (t > t0) t0 = t;
      } else {
        if (t < t0) return null;
        if (t < t1) t1 = t;
      }
    }
  }
  return [
    [a[0] + t0 * dx, a[1] + t0 * dy],
    [a[0] + t1 * dx, a[1] + t1 * dy],
  ];
}
