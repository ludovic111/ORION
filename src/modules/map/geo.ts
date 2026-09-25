import { formatMN95, fromMN95, toMN95 } from "../../../shared/coordinates.ts";

export type LatLng = [number, number];

const R = 6378137;
const rad = (d: number) => (d * Math.PI) / 180;

export const insideSwitzerland = (lat: number, lng: number) =>
  lat > 45.7 && lat < 47.9 && lng > 5.9 && lng < 10.6;

/** Great-circle length of a path, in metres. */
export function lengthOf(points: LatLng[]) {
  let sum = 0;
  for (let i = 1; i < points.length; i++) {
    const [a, b] = [points[i - 1], points[i]];
    const dLat = rad(b[0] - a[0]);
    const dLng = rad(b[1] - a[1]);
    const h =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLng / 2) ** 2;
    sum += 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
  }
  return sum;
}

/** Area of a closed polygon on the sphere, in square metres. */
export function areaOf(points: LatLng[]) {
  if (points.length < 3) return 0;
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const p1 = points[i];
    const p2 = points[(i + 1) % points.length];
    area +=
      rad(p2[1] - p1[1]) * (2 + Math.sin(rad(p1[0])) + Math.sin(rad(p2[0])));
  }
  return Math.abs((area * R * R) / 2);
}

const number = (n: number, digits = 0) =>
  n.toLocaleString("fr-CH", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  });

export function formatDistance(m: number) {
  if (m < 1000) return `${number(m)} m`;
  return `${number(m / 1000, m < 10000 ? 2 : 1)} km`;
}

export function formatArea(m2: number) {
  if (m2 < 10000) return `${number(m2)} m²`;
  if (m2 < 1000000) return `${number(m2 / 10000, 2)} ha`;
  return `${number(m2 / 1000000, 2)} km²`;
}

export const formatWgs = (lat: number, lng: number) =>
  `${lat.toFixed(5)}, ${lng.toFixed(5)}`;

/** MN95 inside Switzerland, latitude / longitude elsewhere. */
export function formatPosition(lat: number, lng: number) {
  if (insideSwitzerland(lat, lng)) {
    try {
      return formatMN95(lat, lng);
    } catch {
      // Falls back to WGS84 below.
    }
  }
  return formatWgs(lat, lng);
}

/** "E 2 500 000 · N 1 117 000", or "" outside the Swiss grid. */
export function mn95Label(lat: number, lng: number) {
  try {
    return formatMN95(lat, lng);
  } catch {
    return "";
  }
}

export function mn95Text(lat: number, lng: number) {
  try {
    const { east, north } = toMN95(lat, lng);
    return `${Math.round(east)} / ${Math.round(north)}`;
  } catch {
    return "";
  }
}

/**
 * Coordinates typed by an operator: MN95 ("2 500 000 / 1 117 000",
 * "E 2'500'000 N 1'117'000"), MN03 ("500000 117000") or latitude, longitude
 * ("46.2, 6.14"). Returns null when the text is not a position.
 */
export function parseCoordinates(input: string): LatLng | null {
  // Drop reference frame names, whose digits are not coordinates.
  let text = input
    .replace(/\b(?:MN|LV)\s?(?:95|03)\b|\bCH\s?1903\+?|\bWGS\s?84\b/gi, " ")
    .trim();
  if (!text) return null;
  // Join digit groups: 2 500 000 · 2'500'000 · 2’500’000.
  let previous = "";
  while (previous !== text) {
    previous = text;
    text = text.replace(/(\d)[\s'’](?=\d{3}(?!\d))/g, "$1");
  }
  // A decimal comma only after one to three digits ("46,2044").
  const numbers = text.match(/-?\d{1,3},\d+(?!\d)|-?\d+(?:\.\d+)?/g);
  if (!numbers || numbers.length !== 2) return null;
  const [a, b] = numbers.map((d) => Number(d.replace(",", ".")));
  const large = Math.abs(a) > 1000 || Math.abs(b) > 1000;
  if (large) {
    let [east, north] = a > b ? [a, b] : [b, a];
    if (east < 1000000) {
      east += 2000000;
      north += 1000000;
    }
    try {
      const { lat, lng } = fromMN95(east, north);
      return [lat, lng];
    } catch {
      return null;
    }
  }
  // Degrees need decimals: "12, 5" is more likely a street number than a position.
  if (!numbers.some((d) => /[.,]/.test(d))) return null;
  if (Math.abs(a) > 90 && Math.abs(b) <= 90) return valid([b, a]);
  // Swiss habit: "6.14, 46.2" → swap.
  if (a >= 5 && a <= 11 && b >= 45 && b <= 48) return valid([b, a]);
  return valid([a, b]);
}

const valid = ([lat, lng]: LatLng): LatLng | null =>
  Math.abs(lat) <= 90 && Math.abs(lng) <= 180 && !(lat === 0 && lng === 0)
    ? [lat, lng]
    : null;

/**
 * Circle of `radius` metres around `center`, as a closed polygon of `steps`
 * vertices (great-circle destinations, so the radius holds at any
 * latitude). Used for the perimeters: an area like any other.
 */
export function circlePoints(
  center: LatLng,
  radius: number,
  steps = 72,
): LatLng[] {
  const d = radius / R;
  const lat1 = rad(center[0]);
  const lng1 = rad(center[1]);
  const deg = (r: number) => (r * 180) / Math.PI;
  const round = (n: number) => Math.round(n * 1e6) / 1e6;
  const out: LatLng[] = [];
  for (let i = 0; i < steps; i++) {
    const t = (2 * Math.PI * i) / steps;
    const lat2 = Math.asin(
      Math.sin(lat1) * Math.cos(d) + Math.cos(lat1) * Math.sin(d) * Math.cos(t),
    );
    const lng2 =
      lng1 +
      Math.atan2(
        Math.sin(t) * Math.sin(d) * Math.cos(lat1),
        Math.cos(d) - Math.sin(lat1) * Math.sin(lat2),
      );
    out.push([round(deg(lat2)), round(deg(lng2))]);
  }
  return out;
}
