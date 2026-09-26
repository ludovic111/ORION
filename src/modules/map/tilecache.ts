// Offline map tiles: pure rules shared by the service worker (inlined in
// dist/sw.js at build time, types stripped) and by the page (offline
// sectors). No imports, no DOM: plain functions and constants only.

/** Hosts whose tiles the service worker keeps. */
export const TILE_HOSTS = [
  "wmts.geo.admin.ch",
  "wms.geo.admin.ch",
  "tile.openstreetmap.org",
];
/** Tiles seen while browsing: one least-recently-used cache per bucket. */
export const LRU_PREFIX = "orion-aic-tiles-";
/** Tiles of an offline sector: one cache per sector, never trimmed. */
export const SECTOR_PREFIX = "orion-aic-sector-";
/** Single cache of the previous versions (read, then emptied on use). */
export const LEGACY_TILES = "orion-aic-tiles";
/** Header recording when a tile entered (or was last moved in) a cache. */
export const STAMP_HEADER = "x-orion-cached-at";

/**
 * Budget of each bucket, in tiles. The backgrounds no longer compete: an
 * hour on the aerial view never pushes out the colour map of the sector.
 */
export const TILE_BUDGETS: Record<string, number> = {
  color: 3000,
  gray: 2500,
  aerial: 2000,
  osm: 1500,
  overlay: 2500,
};
/** Average weight of a tile, for the size shown before a download. */
export const TILE_BYTES: Record<string, number> = {
  color: 24000,
  gray: 17000,
  aerial: 40000,
  osm: 16000,
  overlay: 8000,
};

/** Bucket of a tile URL, or "" when the URL is not a map tile. */
export function tileBucket(url: string): string {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return "";
  }
  if (u.hostname === "tile.openstreetmap.org") return "osm";
  if (u.hostname === "wms.geo.admin.ch") return "overlay";
  if (u.hostname !== "wmts.geo.admin.ch") return "";
  const layer = u.pathname.split("/")[2] ?? "";
  if (layer === "ch.swisstopo.pixelkarte-farbe") return "color";
  if (layer === "ch.swisstopo.pixelkarte-grau") return "gray";
  if (layer === "ch.swisstopo.swissimage") return "aerial";
  return "overlay";
}

/**
 * A tile read from a cache is moved to the recent end at most every six
 * hours: the order of the cache stays close to the order of use without a
 * write for every tile shown.
 */
export const TOUCH_AFTER = 6 * 3600 * 1000;
export function needsTouch(stamp: string | null, now: number): boolean {
  const at = Number(stamp);
  return !stamp || !Number.isFinite(at) || now - at > TOUCH_AFTER;
}

/**
 * Keys to delete so that at most `max` remain, least recently used first
 * (`keys` in cache order: oldest insertion first; a touched tile is
 * re-inserted, so it moves to the end).
 */
export function evictionPlan(keys: readonly string[], max: number): string[] {
  const extra = keys.length - Math.max(0, max);
  return extra > 0 ? keys.slice(0, extra) : [];
}

/**
 * Shell caches to delete once a new version is active. The last `keep`
 * versions stay, so that a tab opened before the update still finds the
 * code-split chunks of its own version.
 */
export function shellPlan(
  history: readonly string[],
  current: string,
  existing: readonly string[],
  keep = 3,
): { history: string[]; remove: string[] } {
  const next = [...history.filter((n) => n !== current), current].slice(-keep);
  const remove = existing.filter(
    (n) =>
      (n.startsWith("orion-aic-shell-") || n.startsWith("orion-shell-")) &&
      !next.includes(n),
  );
  return { history: next, remove };
}

/* ---------- Tiles of an area ---------- */

export type Bounds = [[number, number], [number, number]];

const lngToX = (lng: number, n: number) => Math.floor(((lng + 180) / 360) * n);
const latToY = (lat: number, n: number) => {
  const r = (Math.max(-85.05, Math.min(85.05, lat)) * Math.PI) / 180;
  return Math.floor(
    ((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * n,
  );
};

/** Tile index range covering [[south, west], [north, east]] at zoom z. */
export function tileRange(bounds: Bounds, z: number) {
  const [[south, west], [north, east]] = bounds;
  const n = 2 ** z;
  const clamp = (v: number) => Math.max(0, Math.min(n - 1, v));
  return {
    x0: clamp(lngToX(west, n)),
    x1: clamp(lngToX(east, n)),
    y0: clamp(latToY(north, n)),
    y1: clamp(latToY(south, n)),
  };
}

/** Number of tiles of an area over a zoom range (inclusive). */
export function tileCount(bounds: Bounds, zMin: number, zMax: number) {
  let total = 0;
  for (let z = zMin; z <= zMax; z++) {
    const r = tileRange(bounds, z);
    total += (r.x1 - r.x0 + 1) * (r.y1 - r.y0 + 1);
  }
  return total;
}

/** Every tile of an area, lowest zoom first. */
export function* tilesOf(
  bounds: Bounds,
  zMin: number,
  zMax: number,
): Generator<[number, number, number]> {
  for (let z = zMin; z <= zMax; z++) {
    const r = tileRange(bounds, z);
    for (let y = r.y0; y <= r.y1; y++)
      for (let x = r.x0; x <= r.x1; x++) yield [z, x, y];
  }
}

export const tileUrl = (template: string, z: number, x: number, y: number) =>
  template
    .replace("{z}", String(z))
    .replace("{x}", String(x))
    .replace("{y}", String(y));

/** Estimated size of a download, in bytes. */
export function estimateBytes(tiles: number, bucket: string) {
  return tiles * (TILE_BYTES[bucket] ?? 20000);
}
