// Elevation profile of a line: swisstopo's free profile service
// (api3.geo.admin.ch, swissALTI3D), statistics computed here, kept on the
// post for an offline second look.

import { toMN95 } from "../../../shared/coordinates.ts";
import { simplifyTo } from "./maps.ts";

type LatLng = [number, number];
export type ProfilePoint = { dist: number; alt: number };
export type Profile = {
  points: ProfilePoint[];
  /** When the profile was computed (ms). */
  at: number;
};
export type ProfileStats = {
  length: number;
  min: number;
  max: number;
  climb: number;
  descent: number;
  /** Steepest segment, in percent (absolute value). */
  maxSlope: number;
  /** Mean slope over the whole line (end minus start), in percent. */
  meanSlope: number;
};

const URL = "https://api3.geo.admin.ch/rest/services/profile.json";
const CACHE_KEY = "orion.map.profiles";
const CACHE_SIZE = 40;

/** Distance, heights, cumulated climb and descent, slopes. */
export function profileStats(points: readonly ProfilePoint[]): ProfileStats {
  let min = Infinity;
  let max = -Infinity;
  let climb = 0;
  let descent = 0;
  let maxSlope = 0;
  for (let i = 0; i < points.length; i++) {
    const { alt, dist } = points[i];
    if (alt < min) min = alt;
    if (alt > max) max = alt;
    if (!i) continue;
    const dz = alt - points[i - 1].alt;
    if (dz > 0) climb += dz;
    else descent -= dz;
  }
  // Slopes over at least 20 m: a couple of metres between samples would
  // turn the noise of the terrain model into walls.
  for (let i = 0, j = 0; i < points.length; i++) {
    while (j < points.length && points[j].dist - points[i].dist < 20) j++;
    if (j >= points.length) break;
    const dx = points[j].dist - points[i].dist;
    maxSlope = Math.max(
      maxSlope,
      Math.abs(((points[j].alt - points[i].alt) / dx) * 100),
    );
  }
  if (!maxSlope && points.length > 1) {
    // Line shorter than 20 m: end to end.
    const dx = points[points.length - 1].dist - points[0].dist;
    if (dx > 0)
      maxSlope = Math.abs(
        ((points[points.length - 1].alt - points[0].alt) / dx) * 100,
      );
  }
  const first = points[0];
  const last = points[points.length - 1];
  const length = last ? last.dist : 0;
  return {
    length,
    min: min === Infinity ? 0 : min,
    max: max === -Infinity ? 0 : max,
    climb,
    descent,
    maxSlope,
    meanSlope:
      first && last && length > 0 ? ((last.alt - first.alt) / length) * 100 : 0,
  };
}

/** Key of a line in the cache: its vertices, rounded to the metre. */
export function profileKey(points: readonly LatLng[]) {
  let h = 2166136261;
  const text = points
    .map(([a, b]) => `${a.toFixed(5)},${b.toFixed(5)}`)
    .join(";");
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return `${points.length}:${(h >>> 0).toString(36)}`;
}

function readCache(): Record<string, Profile> {
  try {
    const v = JSON.parse(localStorage.getItem(CACHE_KEY) ?? "{}");
    return v && typeof v === "object" ? v : {};
  } catch {
    return {};
  }
}

/** Profile already computed on this post, if any. */
export function cachedProfile(points: readonly LatLng[]): Profile | null {
  const hit = readCache()[profileKey(points)];
  return hit && Array.isArray(hit.points) ? hit : null;
}

function remember(points: readonly LatLng[], profile: Profile) {
  try {
    const cache = readCache();
    cache[profileKey(points)] = profile;
    const keys = Object.keys(cache).sort((a, b) => cache[a].at - cache[b].at);
    for (const k of keys.slice(0, Math.max(0, keys.length - CACHE_SIZE)))
      delete cache[k];
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Storage full or unavailable: the profile is shown, not kept.
  }
}

/**
 * Ask swisstopo for the profile of a line (Switzerland only). Throws with
 * a French message when the service cannot answer.
 */
export async function fetchProfile(
  line: readonly LatLng[],
  signal?: AbortSignal,
): Promise<Profile> {
  let path: [number, number][];
  try {
    path = simplifyTo(
      line.map(([lat, lng]) => {
        const { east, north } = toMN95(lat, lng);
        return [Math.round(east * 10) / 10, Math.round(north * 10) / 10] as [
          number,
          number,
        ];
      }),
      800,
      0.5,
    );
  } catch {
    throw new Error(
      "Profil disponible en Suisse seulement (modèle swissALTI3D).",
    );
  }
  if (typeof navigator !== "undefined" && navigator.onLine === false)
    throw new Error("Hors ligne : le profil sera calculé au retour du réseau.");
  // The service only accepts the geometry as a JSON body.
  const body = JSON.stringify({ type: "LineString", coordinates: path });
  let response: Response;
  try {
    response = await fetch(
      `${URL}?sr=2056&nb_points=300&distinct_points=true`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        signal,
      },
    );
  } catch (err) {
    if ((err as Error).name === "AbortError") throw err;
    throw new Error("Le service de profil de swisstopo ne répond pas.");
  }
  if (!response.ok)
    throw new Error(
      `Le service de profil a refusé la ligne (${response.status}).`,
    );
  const data = (await response.json()) as {
    dist?: number;
    alts?: Record<string, number>;
  }[];
  const points: ProfilePoint[] = [];
  for (const p of Array.isArray(data) ? data : []) {
    const alt = Number(p.alts?.COMB ?? p.alts?.DTM2 ?? p.alts?.DTM25);
    const dist = Number(p.dist);
    if (Number.isFinite(alt) && Number.isFinite(dist))
      points.push({ dist, alt });
  }
  if (points.length < 2) throw new Error("Profil vide : ligne trop courte ?");
  const profile = { points, at: Date.now() };
  remember(line, profile);
  return profile;
}
