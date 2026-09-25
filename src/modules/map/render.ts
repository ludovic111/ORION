import { createElement } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import type { Journal } from "../../../shared/journal";
import type { Place } from "../../../shared/ops";
import { BASES, SWISS_BOUNDS, isBase } from "./bases";
import { builtinInfo, customId, isCustom, OFFICIAL } from "./builtins";
import { effectiveColor } from "./geoformats";
import { hexColor, layerKey, placesOf, sortMaps } from "./maps";
import { iconOf } from "./symbols";

// Offscreen rendering of a situation map to an image (PNG), for the exports,
// the slides and the comparisons. Owned by the map module. Web Mercator
// maths on a canvas; tiles and symbols are loaded with CORS so the canvas is
// never tainted.

export type MapRenderOptions = {
  /** Map (ops.maps id) to draw; "" or undefined: every object. */
  mapId?: string;
  /** Size of the image in CSS pixels. */
  width: number;
  height: number;
  /** Pixel ratio of the image (default 2). */
  scale?: number;
  /** Background: "color", "gray", "aerial", "night", "osm" or "none". */
  base?: string;
  /** Frame every object of the map (default) or the map's saved view. */
  fit?: "objects" | "view";
  /** Draw the labels of the objects (default true). */
  labels?: boolean;
  /** Restrict to these place ids. */
  places?: string[];
  /**
   * Room kept free when framing the objects, in CSS pixels (a title, a
   * legend drawn over the image). Default: 9 % of the shortest side.
   */
  inset?: { top?: number; right?: number; bottom?: number; left?: number };
};
export type MapImage = {
  blob: Blob;
  dataUrl: string;
  /** Pixel size of the image. */
  width: number;
  height: number;
  /** [[south, west], [north, east]] */
  bounds: [[number, number], [number, number]];
  attribution: string;
};

type LatLng = [number, number];
const TILE = 256;
const MAX_ZOOM = 18;
const TIMEOUT = 12000;
const SWITZERLAND: [LatLng, LatLng] = [
  [45.82, 5.96],
  [47.81, 10.49],
];
const INK = "#111427";
const SANS =
  'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
const DISPLAY = '"IBM Plex Sans", system-ui, sans-serif';

/* ---------- Web Mercator ---------- */

/** Position at zoom 0, in pixels of a 256 px world. */
function project([lat, lng]: LatLng): [number, number] {
  const s = Math.sin((Math.max(-85.05, Math.min(85.05, lat)) * Math.PI) / 180);
  return [
    ((lng + 180) / 360) * TILE,
    (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * TILE,
  ];
}
function unproject([x, y]: [number, number]): LatLng {
  const lng = (x / TILE) * 360 - 180;
  const n = Math.PI - (2 * Math.PI * y) / TILE;
  const lat = (180 / Math.PI) * Math.atan(Math.sinh(n));
  return [lat, lng];
}

/* ---------- Resources ---------- */

// Tiles and symbols already loaded, most recently used last: repeated
// renders (wall display, slides) do not fetch them again.
const IMAGE_CACHE = 600;
const images = new Map<string, Promise<HTMLImageElement | null>>();
function image(src: string): Promise<HTMLImageElement | null> {
  const known = images.get(src);
  if (known) {
    images.delete(src);
    images.set(src, known);
    return known;
  }
  const p = new Promise<HTMLImageElement | null>((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
  images.set(src, p);
  // Failures are retried next time.
  p.then((img) => {
    if (!img && images.get(src) === p) images.delete(src);
  });
  while (images.size > IMAGE_CACHE)
    images.delete(images.keys().next().value as string);
  return p;
}

type IconShape = { path: Path2D; fill: boolean };
const icons = new Map<string, IconShape[] | null>();
/** Outline of a lucide icon (24 × 24 units), read from its rendered SVG. */
function iconShapes(name: string): IconShape[] | null {
  if (icons.has(name)) return icons.get(name)!;
  const Icon = iconOf(name);
  let out: IconShape[] | null = null;
  if (Icon) {
    const host = document.createElement("div");
    const root = createRoot(host);
    try {
      flushSync(() => root.render(createElement(Icon, { size: 24 })));
      const svg = host.querySelector("svg");
      out = [];
      for (const el of Array.from(svg?.children ?? [])) {
        const n = (k: string) => Number(el.getAttribute(k) ?? 0);
        const fill =
          !!el.getAttribute("fill") && el.getAttribute("fill") !== "none";
        let p: Path2D | null = new Path2D();
        switch (el.tagName.toLowerCase()) {
          case "path":
            p = new Path2D(el.getAttribute("d") ?? "");
            break;
          case "circle":
            p.arc(n("cx"), n("cy"), n("r"), 0, Math.PI * 2);
            break;
          case "ellipse":
            p.ellipse(n("cx"), n("cy"), n("rx"), n("ry"), 0, 0, Math.PI * 2);
            break;
          case "rect": {
            const r = n("rx") || n("ry");
            if (r && "roundRect" in p)
              p.roundRect(n("x"), n("y"), n("width"), n("height"), r);
            else p.rect(n("x"), n("y"), n("width"), n("height"));
            break;
          }
          case "line":
            p.moveTo(n("x1"), n("y1"));
            p.lineTo(n("x2"), n("y2"));
            break;
          case "polyline":
          case "polygon": {
            const pts = (el.getAttribute("points") ?? "")
              .trim()
              .split(/[\s,]+/)
              .map(Number);
            for (let i = 0; i + 1 < pts.length; i += 2)
              if (i) p.lineTo(pts[i], pts[i + 1]);
              else p.moveTo(pts[i], pts[i + 1]);
            if (el.tagName.toLowerCase() === "polygon") p.closePath();
            break;
          }
          default:
            p = null;
        }
        if (p) out.push({ path: p, fill });
      }
    } catch {
      out = null;
    } finally {
      root.unmount();
    }
  }
  icons.set(name, out);
  return out;
}

/* ---------- Drawing helpers ---------- */

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function haloText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  scale: number,
  color = INK,
  halo = "rgba(255,255,255,0.95)",
) {
  ctx.lineJoin = "round";
  ctx.lineWidth = 3.5 * scale;
  ctx.strokeStyle = halo;
  ctx.strokeText(text, x, y);
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

function clip(ctx: CanvasRenderingContext2D, text: string, max: number) {
  if (ctx.measureText(text).width <= max) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(`${t}…`).width > max)
    t = t.slice(0, -1);
  return `${t.trimEnd()}…`;
}

/** Label under a symbol: white plate, dark ink (as on the live map). */
function plateLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  top: number,
  scale: number,
  size: number,
) {
  const px = 11.5 * Math.min(2, Math.max(0.85, size)) * scale;
  ctx.font = `600 ${px}px ${SANS}`;
  const label = clip(ctx, text, 190 * scale * Math.max(1, size));
  const w = ctx.measureText(label).width + 14 * scale;
  const h = px * 1.45;
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.3)";
  ctx.shadowBlur = 4 * scale;
  ctx.shadowOffsetY = 1 * scale;
  ctx.fillStyle = "rgba(255,255,255,0.93)";
  roundRect(ctx, x - w / 2, top, w, h, 7 * scale);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = INK;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, x, top + h / 2 + 0.5 * scale);
}

function dashOf(p: Place, scale: number): number[] {
  const w = p.weight * scale;
  if (p.dash === "dash") return [w * 3, w * 2.2];
  if (p.dash === "dot") return [0.01, w * 2];
  return [];
}

/** Point halfway along a path. */
function middle(points: [number, number][]): [number, number] {
  let total = 0;
  for (let i = 1; i < points.length; i++)
    total += Math.hypot(
      points[i][0] - points[i - 1][0],
      points[i][1] - points[i - 1][1],
    );
  let left = total / 2;
  for (let i = 1; i < points.length; i++) {
    const [a, b] = [points[i - 1], points[i]];
    const d = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (d >= left && d > 0) {
      const t = left / d;
      return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    }
    left -= d;
  }
  return points[0];
}

/* ---------- Renderer ---------- */

/** Draw a map of the journal. Never throws for missing tiles. */
export async function renderMap(
  journal: Journal,
  options: MapRenderOptions,
): Promise<MapImage> {
  const scale = Math.max(0.5, Math.min(4, options.scale ?? 2));
  const cssW = Math.max(40, Math.round(options.width));
  const cssH = Math.max(40, Math.round(options.height));
  const W = Math.round(cssW * scale);
  const H = Math.round(cssH * scale);
  const labels = options.labels !== false;

  const maps = sortMaps(journal.ops.maps ?? []);
  const record = options.mapId
    ? maps.find((m) => m.id === options.mapId)
    : undefined;
  let places = placesOf(journal.ops.places, maps, record ? record.id : "");
  if (record?.hidden.length) {
    const hidden = new Set(record.hidden);
    places = places.filter((p) => !hidden.has(layerKey(p)));
  }
  if (options.places) {
    const only = new Set(options.places);
    places = places.filter((p) => only.has(p.id));
  }
  const baseId =
    options.base === "none"
      ? "none"
      : isBase(options.base)
        ? options.base
        : record && isBase(record.base)
          ? record.base
          : "color";

  /* View: centre (zoom 0 pixels) and zoom (CSS pixels). */
  let center: [number, number];
  let zoom: number;
  const saved =
    record ??
    (!options.mapId || !maps.length ? journal.ops.settings.mapCenter : null);
  const pts = places.flatMap((p) => p.points);
  const fitTo = (list: LatLng[], maxZoom: number) => {
    const xy = list.map(project);
    const xs = xy.map((p) => p[0]);
    const ys = xy.map((p) => p[1]);
    const [minX, maxX, minY, maxY] = [
      Math.min(...xs),
      Math.max(...xs),
      Math.min(...ys),
      Math.max(...ys),
    ];
    const pad = Math.max(36, Math.min(cssW, cssH) * 0.09);
    const inset = options.inset ?? {};
    const top = inset.top ?? pad;
    const right = inset.right ?? pad;
    const bottom = inset.bottom ?? pad;
    const left = inset.left ?? pad;
    const freeW = Math.max(40, cssW - left - right);
    const freeH = Math.max(40, cssH - top - bottom);
    const dx = Math.max(maxX - minX, 1e-9);
    const dy = Math.max(maxY - minY, 1e-9);
    const z = Math.log2(Math.min(freeW / dx, freeH / dy));
    zoom = Math.max(1, Math.min(maxZoom, z));
    // Centre of the free area, shifted back to the centre of the image.
    const k = 2 ** zoom;
    center = [
      (minX + maxX) / 2 - (left - right) / 2 / k,
      (minY + maxY) / 2 - (top - bottom) / 2 / k,
    ];
  };
  if (options.fit === "view" && saved)
    ((center = project([saved.lat, saved.lng])),
      (zoom = Math.min(MAX_ZOOM, saved.zoom)));
  else if (pts.length === 1) ((center = project(pts[0])), (zoom = 16));
  else if (pts.length) fitTo(pts, MAX_ZOOM);
  else if (saved)
    ((center = project([saved.lat, saved.lng])),
      (zoom = Math.min(MAX_ZOOM, saved.zoom)));
  else fitTo(SWITZERLAND, MAX_ZOOM);
  // TypeScript: assigned in every branch above.
  center = center!;
  zoom = zoom!;

  // Device pixels.
  const zDev = zoom + Math.log2(scale);
  const worldDev = TILE * 2 ** zDev;
  const ox = (center[0] / TILE) * worldDev - W / 2;
  const oy = (center[1] / TILE) * worldDev - H / 2;
  const toPx = (p: LatLng): [number, number] => {
    const [x, y] = project(p);
    return [(x / TILE) * worldDev - ox, (y / TILE) * worldDev - oy];
  };
  const toLatLng = (x: number, y: number) =>
    unproject([((x + ox) / worldDev) * TILE, ((y + oy) / worldDev) * TILE]);

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  try {
    await document.fonts?.load(`700 15px ${DISPLAY}`);
  } catch {
    // Fallback fonts are fine.
  }

  /* Background */
  const deadline = new Promise<void>((r) => setTimeout(r, TIMEOUT));
  ctx.fillStyle = baseId === "none" ? "#f1f3f7" : "#dfe3ea";
  ctx.fillRect(0, 0, W, H);
  let attribution = "";
  if (baseId !== "none") {
    const base = BASES[baseId];
    attribution = base.swiss
      ? "© swisstopo"
      : "© les contributeurs d’OpenStreetMap";
    let tz = Math.max(1, Math.min(base.native, Math.round(zDev)));
    const range = (z: number) => {
      const ts = TILE * 2 ** (zDev - z);
      return {
        ts,
        x0: Math.floor(ox / ts),
        x1: Math.floor((ox + W) / ts),
        y0: Math.max(0, Math.floor(oy / ts)),
        y1: Math.min(2 ** z - 1, Math.floor((oy + H) / ts)),
      };
    };
    let r = range(tz);
    while ((r.x1 - r.x0 + 1) * (r.y1 - r.y0 + 1) > 360 && tz > 1)
      r = range(--tz);
    const n = 2 ** tz;
    const [[south, west], [north, east]] = SWISS_BOUNDS;
    // Tiles arrived before the deadline; later ones are ignored.
    const arrived: { img: HTMLImageElement; x: number; y: number }[] = [];
    let late = false;
    const jobs: Promise<void>[] = [];
    for (let ty = r.y0; ty <= r.y1; ty++)
      for (let tx = r.x0; tx <= r.x1; tx++) {
        const wx = ((tx % n) + n) % n;
        if (base.swiss) {
          const [tn, tw] = unproject([(tx / n) * TILE, (ty / n) * TILE]);
          const [ts, te] = unproject([
            ((tx + 1) / n) * TILE,
            ((ty + 1) / n) * TILE,
          ]);
          if (ts > north || tn < south || te < west || tw > east) continue;
        }
        const src = base.url
          .replace("{z}", String(tz))
          .replace("{x}", String(wx))
          .replace("{y}", String(ty));
        const x = tx * r.ts - ox;
        const y = ty * r.ts - oy;
        jobs.push(
          image(src).then((img) => {
            if (img && !late) arrived.push({ img, x, y });
          }),
        );
      }
    await Promise.race([Promise.all(jobs), deadline]);
    late = true;
    // Slightly larger than the cell: no hairline between tiles.
    for (const t of arrived)
      ctx.drawImage(t.img, t.x, t.y, r.ts + 0.5, r.ts + 0.5);
    if (baseId === "night") {
      const data = ctx.getImageData(0, 0, W, H);
      const d = data.data;
      for (let i = 0; i < d.length; i += 4) {
        const v = 255 - (d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11);
        d[i] = 16 + v * 0.3;
        d[i + 1] = 19 + v * 0.36;
        d[i + 2] = 30 + v * 0.46;
      }
      ctx.putImageData(data, 0, 0);
    }
  }
  const dark = baseId === "night" || baseId === "aerial";

  /* Symbols needed */
  const sources = new Map<string, Promise<HTMLImageElement | null>>();
  for (const p of places) {
    if (p.kind !== "point") continue;
    let src = "";
    if (OFFICIAL.test(p.symbol))
      src = `${import.meta.env.BASE_URL}symbols/${p.symbol}.svg`;
    else if (isCustom(p.symbol))
      src =
        journal.ops.symbols.find((s) => s.id === customId(p.symbol))?.image ??
        "";
    if (src && !sources.has(p.symbol)) sources.set(p.symbol, image(src));
  }
  const loaded = new Map<string, HTMLImageElement | null>();
  let symbolsLate = false;
  await Promise.race([
    Promise.all(
      [...sources].map(async ([k, v]) => {
        const img = await v;
        if (!symbolsLate) loaded.set(k, img);
      }),
    ),
    deadline,
  ]);
  symbolsLate = true;

  /* Areas and lines */
  const shapes = places.filter((p) => p.kind === "area" || p.kind === "line");
  for (const p of shapes) {
    const color = effectiveColor(p);
    const xy = p.points.map(toPx);
    ctx.beginPath();
    xy.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    if (p.kind === "area") {
      ctx.closePath();
      ctx.globalAlpha = 0.16;
      ctx.fillStyle = color;
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.setLineDash(dashOf(p, scale));
    ctx.lineWidth = p.weight * scale;
    ctx.strokeStyle = color;
    ctx.globalAlpha = 0.95;
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.setLineDash([]);
  }
  if (labels)
    for (const p of shapes) {
      if (!p.label) continue;
      const xy = p.points.map(toPx);
      const [x, y] =
        p.kind === "area"
          ? [
              xy.reduce((s, q) => s + q[0], 0) / xy.length,
              xy.reduce((s, q) => s + q[1], 0) / xy.length,
            ]
          : middle(xy);
      ctx.font = `700 ${12.5 * scale}px ${DISPLAY}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      haloText(
        ctx,
        clip(ctx, p.label, 260 * scale),
        x,
        y,
        scale,
        dark ? "#fff" : INK,
        dark ? "rgba(0,0,0,0.9)" : "rgba(255,255,255,0.95)",
      );
    }

  /* Points and texts, north first so that southern marks overlap them. */
  const marks = places
    .filter((p) => p.kind === "point" || p.kind === "text")
    .sort((a, b) => b.points[0][0] - a.points[0][0]);
  for (const p of marks) {
    const [x, y] = toPx(p.points[0]);
    if (x < -300 || y < -300 || x > W + 300 || y > H + 300) continue;
    const rot = (p.rotation * Math.PI) / 180;
    if (p.kind === "text") {
      const px = 15 * p.size * scale;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);
      ctx.font = `700 ${px}px ${DISPLAY}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const lines = (p.label || "Texte").split("\n").slice(0, 12);
      const lh = px * 1.15;
      const color = hexColor(p.color) || INK;
      if (p.boxed) {
        const w =
          Math.max(...lines.map((l) => ctx.measureText(l).width)) + px * 0.8;
        const h = lh * lines.length + px * 0.45;
        ctx.save();
        ctx.shadowColor = "rgba(0,0,0,0.3)";
        ctx.shadowBlur = 5 * scale;
        ctx.shadowOffsetY = 1 * scale;
        ctx.fillStyle = "rgba(255,255,255,0.92)";
        roundRect(ctx, -w / 2, -h / 2, w, h, Math.min(8 * scale, h / 3));
        ctx.fill();
        ctx.restore();
        ctx.fillStyle = color;
        lines.forEach((l, i) =>
          ctx.fillText(l, 0, (i - (lines.length - 1) / 2) * lh),
        );
      } else
        lines.forEach((l, i) =>
          haloText(
            ctx,
            l,
            0,
            (i - (lines.length - 1) / 2) * lh,
            scale * Math.max(1, p.size * 0.8),
            color,
          ),
        );
      ctx.restore();
      continue;
    }
    const box = 34 * p.size * scale;
    const img = loaded.get(p.symbol);
    const b =
      builtinInfo(p.symbol) ?? (img ? undefined : builtinInfo("b:point"));
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    if (b) {
      const color = hexColor(p.color) || b.color;
      const shapes = b.icon ? iconShapes(b.icon) : null;
      if (p.frame || !shapes) {
        const r = shapes ? box / 2 : box * 0.31;
        ctx.save();
        ctx.shadowColor = "rgba(0,0,0,0.4)";
        ctx.shadowBlur = 6 * scale;
        ctx.shadowOffsetY = 2 * scale;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.restore();
        ctx.lineWidth = 2 * scale;
        ctx.strokeStyle = "#fff";
        ctx.stroke();
      }
      if (shapes) {
        const k = (box * (p.frame ? 0.55 : 0.86)) / 24;
        ctx.save();
        ctx.scale(k, k);
        ctx.translate(-12, -12);
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        if (!p.frame) {
          ctx.lineWidth = 2.4 + (3 * scale) / k;
          ctx.strokeStyle = "rgba(255,255,255,0.95)";
          for (const s of shapes) ctx.stroke(s.path);
        }
        ctx.lineWidth = p.frame ? 2.2 : 2.4;
        ctx.strokeStyle = p.frame ? "#fff" : color;
        ctx.fillStyle = ctx.strokeStyle;
        for (const s of shapes) {
          if (s.fill) ctx.fill(s.path);
          ctx.stroke(s.path);
        }
        ctx.restore();
      }
    } else if (img) {
      if (p.frame) {
        ctx.save();
        ctx.shadowColor = "rgba(0,0,0,0.35)";
        ctx.shadowBlur = 5 * scale;
        ctx.shadowOffsetY = 1 * scale;
        ctx.fillStyle = "#fff";
        roundRect(ctx, -box / 2, -box / 2, box, box, box * 0.26);
        ctx.fill();
        ctx.restore();
      }
      {
        const inner = p.frame ? box - 6 * scale * p.size : box;
        const k = Math.min(
          inner / (img.naturalWidth || inner),
          inner / (img.naturalHeight || inner),
        );
        const w = (img.naturalWidth || inner) * k;
        const h = (img.naturalHeight || inner) * k;
        if (!p.frame) {
          // White glow, then the symbol: readable on aerial imagery.
          ctx.save();
          ctx.shadowColor = "rgba(255,255,255,0.95)";
          ctx.shadowBlur = 3 * scale;
          ctx.drawImage(img, -w / 2, -h / 2, w, h);
          ctx.restore();
          ctx.save();
          ctx.shadowColor = "rgba(0,0,0,0.35)";
          ctx.shadowBlur = 3 * scale;
          ctx.shadowOffsetY = 1 * scale;
          ctx.drawImage(img, -w / 2, -h / 2, w, h);
          ctx.restore();
        } else ctx.drawImage(img, -w / 2, -h / 2, w, h);
      }
    }
    ctx.restore();
    if (labels && p.label)
      plateLabel(ctx, p.label, x, y + box / 2 + 4 * scale, scale, p.size);
  }

  /* Scale bar, north arrow, attribution */
  const [clat] = toLatLng(W / 2, H / 2);
  const metresPerPx =
    (156543.03392 * Math.cos((clat * Math.PI) / 180)) / 2 ** zDev;
  const target = 110 * scale * metresPerPx;
  const exp = 10 ** Math.floor(Math.log10(target));
  const nice = [5, 2, 1].map((k) => k * exp).find((v) => v <= target) ?? exp;
  const barW = nice / metresPerPx;
  const m = 14 * scale;
  ctx.font = `600 ${10.5 * scale}px ${SANS}`;
  ctx.textAlign = "left";
  ctx.textBaseline = "bottom";
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  roundRect(
    ctx,
    m - 6 * scale,
    H - m - 26 * scale,
    barW + 12 * scale,
    30 * scale,
    6 * scale,
  );
  ctx.fill();
  ctx.fillStyle = INK;
  ctx.fillRect(m, H - m - 6 * scale, barW, 3 * scale);
  ctx.fillRect(m, H - m - 10 * scale, 1.5 * scale, 7 * scale);
  ctx.fillRect(
    m + barW - 1.5 * scale,
    H - m - 10 * scale,
    1.5 * scale,
    7 * scale,
  );
  ctx.fillText(
    nice >= 1000 ? `${nice / 1000} km` : `${nice} m`,
    m,
    H - m - 11 * scale,
  );

  const nx = W - m - 16 * scale;
  const ny = m + 18 * scale;
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.3)";
  ctx.shadowBlur = 5 * scale;
  ctx.beginPath();
  ctx.arc(nx, ny, 16 * scale, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.fill();
  ctx.restore();
  ctx.beginPath();
  ctx.moveTo(nx, ny - 12 * scale);
  ctx.lineTo(nx + 5 * scale, ny + 1 * scale);
  ctx.lineTo(nx - 5 * scale, ny + 1 * scale);
  ctx.closePath();
  ctx.fillStyle = "#e5243b";
  ctx.fill();
  ctx.font = `700 ${9.5 * scale}px ${SANS}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = INK;
  ctx.fillText("N", nx, ny + 7.5 * scale);

  if (attribution) {
    ctx.font = `500 ${10 * scale}px ${SANS}`;
    const w = ctx.measureText(attribution).width + 12 * scale;
    ctx.fillStyle = "rgba(255,255,255,0.82)";
    ctx.fillRect(W - w, H - 17 * scale, w, 17 * scale);
    ctx.fillStyle = "#3a3f55";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillText(attribution, W - 6 * scale, H - 8.5 * scale);
  }

  // Drawing is finished: nothing reaches the canvas any more.
  const dataUrl = canvas.toDataURL("image/png");
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Image de carte impossible."))),
      "image/png",
    ),
  );
  const [north, west] = toLatLng(0, 0);
  const [south, east] = toLatLng(W, H);
  return {
    blob,
    dataUrl,
    width: W,
    height: H,
    bounds: [
      [south, west],
      [north, east],
    ],
    attribution,
  };
}
