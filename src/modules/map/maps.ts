import type { OpsMap, Place } from "../../../shared/ops.ts";

// Several maps per operation. Pure helpers shared by the module, the
// renderer and the geographic exports (no DOM, no React).

/** Implicit main map while the operation has no map record. */
export const MAIN_MAP = "";
export const MAIN_NAME = "Carte principale";

const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("fr");

export const layerKey = (p: Pick<Place, "layer">) => p.layer.trim();

/** Style family of a layer (colours of lines, areas and the legend). */
export function toneOf(layer: string) {
  const n = norm(layer.trim());
  if (n.startsWith("danger")) return "danger";
  if (n.startsWith("effet")) return "effect";
  if (n.startsWith("moyen")) return "means";
  if (n.startsWith("mesure")) return "measure";
  if (n.startsWith("emplacement")) return "site";
  return "other";
}
export type Tone = ReturnType<typeof toneOf>;

/** Ink of each layer family on a light background (images, files). */
export const TONE_COLOR: Record<Tone, string> = {
  effect: "#d91f2c",
  danger: "#c77700",
  means: "#1f6fe0",
  measure: "#0f9960",
  site: "#0891b2",
  other: "#6d4aff",
};

// Colour names an operator (or a partner file) may use.
const NAMED: Record<string, string> = {
  black: "#000000",
  noir: "#000000",
  white: "#ffffff",
  blanc: "#ffffff",
  red: "#ff0000",
  rouge: "#e5243b",
  orange: "#ff8a00",
  yellow: "#ffff00",
  jaune: "#f5c400",
  green: "#008000",
  vert: "#1faa59",
  lime: "#00ff00",
  blue: "#0000ff",
  bleu: "#1f6fe0",
  navy: "#000080",
  cyan: "#00ffff",
  aqua: "#00ffff",
  magenta: "#ff00ff",
  fuchsia: "#ff00ff",
  purple: "#800080",
  violet: "#7b5cff",
  pink: "#ffc0cb",
  rose: "#ff4fb3",
  brown: "#a52a2a",
  brun: "#92400e",
  marron: "#92400e",
  gray: "#808080",
  grey: "#808080",
  gris: "#808080",
};

/**
 * A colour as "#rrggbb": accepts #rgb, #rgba, #rrggbb, #rrggbbaa and a few
 * names; "" for anything else (never free text in styles or files).
 */
export function hexColor(value: unknown): string {
  if (typeof value !== "string") return "";
  const v = value.trim().toLowerCase();
  if (NAMED[v]) return NAMED[v];
  if (/^#[0-9a-f]{6}$/.test(v)) return v;
  if (/^#[0-9a-f]{8}$/.test(v)) return v.slice(0, 7);
  if (/^#[0-9a-f]{3,4}$/.test(v))
    return `#${[...v.slice(1, 4)].map((c) => c + c).join("")}`;
  return "";
}

/** Maps in their display order. */
export const sortMaps = (maps: OpsMap[]) =>
  [...maps].sort(
    (a, b) =>
      a.order - b.order ||
      a.createdAt.localeCompare(b.createdAt) ||
      a.id.localeCompare(b.id),
  );

/**
 * Is the object drawn on this map? Objects without maps, or whose maps all
 * disappeared, are on every map. MAIN_MAP (no map record yet) shows all.
 */
export function onMap(
  place: Pick<Place, "maps">,
  mapId: string,
  known?: Set<string>,
): boolean {
  if (!mapId || !place.maps?.length) return true;
  if (place.maps.includes(mapId)) return true;
  return known ? !place.maps.some((id) => known.has(id)) : false;
}

/** Objects of a map ("" : every object). */
export function placesOf(
  places: Place[],
  maps: OpsMap[],
  mapId: string,
): Place[] {
  if (!mapId) return places;
  const known = new Set(maps.map((m) => m.id));
  if (!known.has(mapId)) return places;
  return places.filter((p) => onMap(p, mapId, known));
}

/**
 * Objects left on every map by the earlier versions: drawn on the only
 * map before a second one was created, they appeared on the new map too.
 * Returns them with the map they most likely belong to (the oldest).
 */
export function strayObjects(
  places: Place[],
  maps: OpsMap[],
): { places: Place[]; home: OpsMap | null } {
  if (maps.length < 2) return { places: [], home: null };
  const byAge = [...maps].sort(
    (a, b) => a.createdAt.localeCompare(b.createdAt) || a.order - b.order,
  );
  const [home, second] = byAge;
  return {
    home,
    places: places.filter(
      (p) => !p.maps.length && p.createdAt < second.createdAt,
    ),
  };
}

/**
 * Maps of the objects once a new map is added: the new map starts empty.
 * With no or one map record, objects "on every map" were simply the
 * objects of that map: they are tied to it. With several maps, "every
 * map" was chosen on purpose and stays. `takeFrom`: a map whose objects
 * are shown on the new map as well.
 */
export function mapsForNewMap(
  places: Place[],
  existing: string[],
  newId: string,
  takeFrom: string | null,
): Place[] {
  const known = new Set(existing);
  return places.map((p) => {
    let maps = p.maps;
    const orphan = !maps.some((id) => known.has(id));
    const shownOnTake =
      takeFrom !== null && (orphan || maps.includes(takeFrom));
    if (orphan && existing.length <= 1) maps = [...existing];
    if (shownOnTake && maps.length) maps = [...maps, newId];
    return maps === p.maps ? p : { ...p, maps };
  });
}

/** Douglas–Peucker simplification of a path in any planar coordinates. */
export function simplify<T extends [number, number]>(
  points: T[],
  tolerance: number,
): T[] {
  if (points.length < 3) return points.slice();
  const keep = new Uint8Array(points.length);
  keep[0] = keep[points.length - 1] = 1;
  const stack: [number, number][] = [[0, points.length - 1]];
  const t2 = tolerance * tolerance;
  while (stack.length) {
    const [first, last] = stack.pop()!;
    const [ax, ay] = points[first];
    const [bx, by] = points[last];
    const dx = bx - ax;
    const dy = by - ay;
    const len = dx * dx + dy * dy;
    let worst = -1;
    let index = -1;
    for (let i = first + 1; i < last; i++) {
      const [px, py] = points[i];
      let t = len ? ((px - ax) * dx + (py - ay) * dy) / len : 0;
      t = Math.max(0, Math.min(1, t));
      const ex = ax + t * dx - px;
      const ey = ay + t * dy - py;
      const d = ex * ex + ey * ey;
      if (d > worst) {
        worst = d;
        index = i;
      }
    }
    if (index > 0 && worst > t2) {
      keep[index] = 1;
      stack.push([first, index], [index, last]);
    }
  }
  return points.filter((_, i) => keep[i]);
}

/** Simplify until at most `max` points remain (tolerance grows). */
export function simplifyTo<T extends [number, number]>(
  points: T[],
  max: number,
  tolerance: number,
): T[] {
  let out = simplify(points, tolerance);
  let t = tolerance;
  while (out.length > max && t < 1e9) {
    t *= 2;
    out = simplify(points, t);
  }
  if (out.length > max) {
    // Degenerate input: keep evenly spaced points.
    const step = (points.length - 1) / (max - 1);
    out = Array.from({ length: max }, (_, i) => points[Math.round(i * step)]);
  }
  return out;
}
