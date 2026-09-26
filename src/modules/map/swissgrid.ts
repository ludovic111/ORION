// Swiss grid (MN95) drawn over the map: kilometre lines, or every 100 m
// when zoomed in, each with its label. Pure: tested in node.

import { fromMN95, toMN95 } from "../../../shared/coordinates.ts";

type LatLng = [number, number];
export type GridLine = {
  axis: "east" | "north";
  value: number;
  points: LatLng[];
};

/** Spacing of the grid at a zoom level, in metres (null: too far out). */
export function gridSpacingForZoom(zoom: number): number | null {
  if (zoom >= 16) return 100;
  if (zoom >= 13) return 1000;
  if (zoom >= 9) return 10000;
  return null;
}

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

/**
 * Grid lines crossing the view [[south, west], [north, east]], each as a
 * few points (the lines of the Swiss grid are slightly curved in Web
 * Mercator). Empty outside the Swiss grid or with too many lines.
 */
export function gridLines(
  bounds: [LatLng, LatLng],
  spacing: number,
  maxLines = 80,
): GridLine[] {
  const [[south, west], [north, east]] = bounds;
  // Part of the view inside the domain of the MN95 formulas.
  const s = clamp(south, 45.4, 48.3);
  const n = clamp(north, 45.4, 48.3);
  const w = clamp(west, 5.2, 11);
  const e = clamp(east, 5.2, 11);
  if (s >= n || w >= e) return [];
  let minE = Infinity;
  let maxE = -Infinity;
  let minN = Infinity;
  let maxN = -Infinity;
  for (let i = 0; i <= 4; i++)
    for (let j = 0; j <= 4; j++) {
      const p = toMN95(s + ((n - s) * i) / 4, w + ((e - w) * j) / 4);
      minE = Math.min(minE, p.east);
      maxE = Math.max(maxE, p.east);
      minN = Math.min(minN, p.north);
      maxN = Math.max(maxN, p.north);
    }
  minE = Math.max(minE, 2400000);
  maxE = Math.min(maxE, 2900000);
  minN = Math.max(minN, 1000000);
  maxN = Math.min(maxN, 1400000);
  const values = (a: number, b: number) => {
    const out: number[] = [];
    for (let v = Math.ceil(a / spacing) * spacing; v <= b; v += spacing)
      out.push(v);
    return out;
  };
  const eastValues = values(minE, maxE);
  const northValues = values(minN, maxN);
  if (eastValues.length + northValues.length > maxLines) return [];
  const steps = 8;
  const lines: GridLine[] = [];
  const at = (x: number, y: number): LatLng => {
    const { lat, lng } = fromMN95(x, y);
    return [lat, lng];
  };
  for (const v of eastValues) {
    const points: LatLng[] = [];
    for (let k = 0; k <= steps; k++)
      points.push(at(v, minN + ((maxN - minN) * k) / steps));
    lines.push({ axis: "east", value: v, points });
  }
  for (const v of northValues) {
    const points: LatLng[] = [];
    for (let k = 0; k <= steps; k++)
      points.push(at(minE + ((maxE - minE) * k) / steps, v));
    lines.push({ axis: "north", value: v, points });
  }
  return lines;
}
