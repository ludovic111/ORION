import {
  formatMN95,
  fromMN03,
  fromMN95,
  isMN03,
  isMN95,
  toMN95,
} from "../../../shared/coordinates.ts";
import { formatNumber, getLang } from "../../../shared/i18n/core.ts";

export type LatLng = [number, number];

// WGS84 ellipsoid: lengths and bearings are geodesics on the ellipsoid
// (Vincenty), not great circles on a sphere of equatorial radius.
const A = 6378137;
const F = 1 / 298.257223563;
const B = A * (1 - F);
/** Radius of the sphere of the same area as the ellipsoid. */
const AUTHALIC = 6371007.181;
const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;

export const insideSwitzerland = (lat: number, lng: number) =>
  lat > 45.7 && lat < 47.9 && lng > 5.9 && lng < 10.6;

/**
 * Geodesic distance and initial bearing between two points (Vincenty's
 * inverse formula; falls back to a spherical estimate for the nearly
 * antipodal points where it does not converge).
 */
export function inverse(
  a: LatLng,
  b: LatLng,
): { distance: number; bearing: number } {
  if (a[0] === b[0] && a[1] === b[1]) return { distance: 0, bearing: 0 };
  const L = rad(b[1] - a[1]);
  const U1 = Math.atan((1 - F) * Math.tan(rad(a[0])));
  const U2 = Math.atan((1 - F) * Math.tan(rad(b[0])));
  const sinU1 = Math.sin(U1);
  const cosU1 = Math.cos(U1);
  const sinU2 = Math.sin(U2);
  const cosU2 = Math.cos(U2);
  let lambda = L;
  let sinSigma = 0;
  let cosSigma = 0;
  let sigma = 0;
  let cos2Alpha = 0;
  let cos2SigmaM = 0;
  let sinLambda = 0;
  let cosLambda = 0;
  for (let i = 0; i < 200; i++) {
    sinLambda = Math.sin(lambda);
    cosLambda = Math.cos(lambda);
    const x = cosU2 * sinLambda;
    const y = cosU1 * sinU2 - sinU1 * cosU2 * cosLambda;
    sinSigma = Math.sqrt(x * x + y * y);
    if (sinSigma === 0) return { distance: 0, bearing: 0 };
    cosSigma = sinU1 * sinU2 + cosU1 * cosU2 * cosLambda;
    sigma = Math.atan2(sinSigma, cosSigma);
    const sinAlpha = (cosU1 * cosU2 * sinLambda) / sinSigma;
    cos2Alpha = 1 - sinAlpha * sinAlpha;
    cos2SigmaM = cos2Alpha ? cosSigma - (2 * sinU1 * sinU2) / cos2Alpha : 0;
    const C = (F / 16) * cos2Alpha * (4 + F * (4 - 3 * cos2Alpha));
    const previous = lambda;
    lambda =
      L +
      (1 - C) *
        F *
        sinAlpha *
        (sigma +
          C *
            sinSigma *
            (cos2SigmaM + C * cosSigma * (-1 + 2 * cos2SigmaM * cos2SigmaM)));
    if (Math.abs(lambda - previous) < 1e-12) {
      const u2 = (cos2Alpha * (A * A - B * B)) / (B * B);
      const AA =
        1 + (u2 / 16384) * (4096 + u2 * (-768 + u2 * (320 - 175 * u2)));
      const BB = (u2 / 1024) * (256 + u2 * (-128 + u2 * (74 - 47 * u2)));
      const deltaSigma =
        BB *
        sinSigma *
        (cos2SigmaM +
          (BB / 4) *
            (cosSigma * (-1 + 2 * cos2SigmaM * cos2SigmaM) -
              (BB / 6) *
                cos2SigmaM *
                (-3 + 4 * sinSigma * sinSigma) *
                (-3 + 4 * cos2SigmaM * cos2SigmaM)));
      const bearing = deg(
        Math.atan2(
          cosU2 * sinLambda,
          cosU1 * sinU2 - sinU1 * cosU2 * cosLambda,
        ),
      );
      return {
        distance: B * AA * (sigma - deltaSigma),
        bearing: (bearing + 360) % 360,
      };
    }
  }
  // No convergence (antipodal points): haversine on the authalic sphere.
  const dLat = rad(b[0] - a[0]);
  const dLng = rad(b[1] - a[1]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLng / 2) ** 2;
  const bearing = deg(
    Math.atan2(
      Math.sin(dLng) * Math.cos(rad(b[0])),
      Math.cos(rad(a[0])) * Math.sin(rad(b[0])) -
        Math.sin(rad(a[0])) * Math.cos(rad(b[0])) * Math.cos(dLng),
    ),
  );
  return {
    distance: 2 * AUTHALIC * Math.asin(Math.min(1, Math.sqrt(h))),
    bearing: (bearing + 360) % 360,
  };
}

/**
 * Point reached from `from` after `distance` metres along the geodesic of
 * initial `bearing` (degrees clockwise from north): Vincenty's direct
 * formula.
 */
export function destination(
  from: LatLng,
  bearing: number,
  distance: number,
): LatLng {
  const alpha1 = rad(bearing);
  const sinAlpha1 = Math.sin(alpha1);
  const cosAlpha1 = Math.cos(alpha1);
  const tanU1 = (1 - F) * Math.tan(rad(from[0]));
  const cosU1 = 1 / Math.sqrt(1 + tanU1 * tanU1);
  const sinU1 = tanU1 * cosU1;
  const sigma1 = Math.atan2(tanU1, cosAlpha1);
  const sinAlpha = cosU1 * sinAlpha1;
  const cos2Alpha = 1 - sinAlpha * sinAlpha;
  const u2 = (cos2Alpha * (A * A - B * B)) / (B * B);
  const AA = 1 + (u2 / 16384) * (4096 + u2 * (-768 + u2 * (320 - 175 * u2)));
  const BB = (u2 / 1024) * (256 + u2 * (-128 + u2 * (74 - 47 * u2)));
  let sigma = distance / (B * AA);
  let cos2SigmaM = 0;
  let sinSigma = 0;
  let cosSigma = 0;
  for (let i = 0; i < 200; i++) {
    cos2SigmaM = Math.cos(2 * sigma1 + sigma);
    sinSigma = Math.sin(sigma);
    cosSigma = Math.cos(sigma);
    const deltaSigma =
      BB *
      sinSigma *
      (cos2SigmaM +
        (BB / 4) *
          (cosSigma * (-1 + 2 * cos2SigmaM * cos2SigmaM) -
            (BB / 6) *
              cos2SigmaM *
              (-3 + 4 * sinSigma * sinSigma) *
              (-3 + 4 * cos2SigmaM * cos2SigmaM)));
    const previous = sigma;
    sigma = distance / (B * AA) + deltaSigma;
    if (Math.abs(sigma - previous) < 1e-12) break;
  }
  const x = sinU1 * sinSigma - cosU1 * cosSigma * cosAlpha1;
  const lat2 = Math.atan2(
    sinU1 * cosSigma + cosU1 * sinSigma * cosAlpha1,
    (1 - F) * Math.sqrt(sinAlpha * sinAlpha + x * x),
  );
  const lambda = Math.atan2(
    sinSigma * sinAlpha1,
    cosU1 * cosSigma - sinU1 * sinSigma * cosAlpha1,
  );
  const C = (F / 16) * cos2Alpha * (4 + F * (4 - 3 * cos2Alpha));
  const L =
    lambda -
    (1 - C) *
      F *
      sinAlpha *
      (sigma +
        C *
          sinSigma *
          (cos2SigmaM + C * cosSigma * (-1 + 2 * cos2SigmaM * cos2SigmaM)));
  const lng = ((((from[1] + deg(L) + 540) % 360) + 360) % 360) - 180;
  return [deg(lat2), lng];
}

/** Geodesic length of a path, in metres. */
export function lengthOf(points: LatLng[]) {
  let sum = 0;
  for (let i = 1; i < points.length; i++)
    sum += inverse(points[i - 1], points[i]).distance;
  return sum;
}

/** Initial bearing from a to b, degrees clockwise from north. */
export const bearingOf = (a: LatLng, b: LatLng) => inverse(a, b).bearing;

/** Planar area of a ring (shoelace), any unit. */
function shoelace(xy: [number, number][]) {
  let s = 0;
  for (let i = 0, j = xy.length - 1; i < xy.length; j = i++)
    s += (xy[j][0] + xy[i][0]) * (xy[j][1] - xy[i][1]);
  return Math.abs(s / 2);
}

function ringArea(points: LatLng[]) {
  if (points.length < 3) return 0;
  // Swiss extent: the MN95 plane (conformal, scale within 0.02 %).
  let swiss = true;
  for (const [lat, lng] of points)
    if (!insideSwitzerland(lat, lng)) {
      swiss = false;
      break;
    }
  if (swiss) {
    const xy: [number, number][] = [];
    for (const [lat, lng] of points) {
      const { east, north } = toMN95(lat, lng);
      xy.push([east, north]);
    }
    return shoelace(xy);
  }
  // Elsewhere: sphere of the same area as the ellipsoid.
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const p1 = points[i];
    const p2 = points[(i + 1) % points.length];
    area +=
      rad(p2[1] - p1[1]) * (2 + Math.sin(rad(p1[0])) + Math.sin(rad(p2[0])));
  }
  return Math.abs((area * AUTHALIC * AUTHALIC) / 2);
}

/** Area of a closed polygon, holes removed, in square metres. */
export function areaOf(points: LatLng[], holes: LatLng[][] = []) {
  let area = ringArea(points);
  for (const h of holes) area -= ringArea(h);
  return Math.max(0, area);
}

const number = (n: number, digits = 0) =>
  formatNumber(n, {
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

/* ---------- Coordinates typed by an operator ---------- */

const valid = ([lat, lng]: LatLng): LatLng | null =>
  Number.isFinite(lat) &&
  Number.isFinite(lng) &&
  Math.abs(lat) <= 90 &&
  Math.abs(lng) <= 180 &&
  !(lat === 0 && lng === 0)
    ? [lat, lng]
    : null;

/** Unicode primes, curly quotes and frame names folded to plain text. */
function normalize(input: string) {
  return input
    .replace(
      /\b(?:MN|LV)\s?(?:95|03)\b|\bCH\s?1903\+?|\bWGS\s?84\b|\bEPSG:?\s?\d+/gi,
      " ",
    )
    .replace(/[′’‘`´]/g, "'")
    .replace(/[″“”]|''/g, '"')
    .replace(/º/g, "°")
    .replace(/ | | /g, " ")
    .trim();
}

/**
 * Swiss grid: MN95 (2 600 000 / 1 200 000) or MN03 (600 000 / 200 000),
 * digit groups joined by spaces or apostrophes, the two numbers separated
 * by anything else (slash, dash, comma, letters) or only by a space. A
 * third number (altitude) is ignored.
 */
function parseSwiss(text: string): LatLng | null {
  // Only digits, separators and the letters of "E … N …", "y = … x = …".
  if (/[°"]/.test(text)) return null;
  if (/[a-df-mo-wz]/i.test(text.replace(/\b(?:est|nord|east|north)\b/gi, "")))
    return null;
  // Chunks split by explicit separators; inside a chunk, digit groups.
  const chunks = text
    .split(/[/;,|:=·•\-–—]|\s*\b(?:[ENyx]|est|nord|east|north)\b\s*/i)
    .map((c) => c.trim())
    .filter(Boolean);
  const groups: string[][] = chunks.map((c) =>
    c.split(/[\s']+/).filter(Boolean),
  );
  if (groups.some((g) => g.some((d) => !/^\d+(?:\.\d+)?$/.test(d))))
    return null;
  // Every way of reading the digit groups as two numbers: first the
  // explicit chunks, then splits inside one chunk.
  const numberOf = (parts: string[]) => {
    // Groups after the first have three digits (thousands); decimals
    // only on the last.
    for (let i = 1; i < parts.length; i++)
      if (!/^\d{3}(?:\.\d+)?$/.test(parts[i])) return NaN;
    for (let i = 0; i < parts.length - 1; i++)
      if (parts[i].includes(".")) return NaN;
    return Number(parts.join(""));
  };
  const readings: [number, number][] = [];
  const flat: { digits: string; chunk: number }[] = [];
  groups.forEach((g, chunk) =>
    g.forEach((digits) => flat.push({ digits, chunk })),
  );
  for (let i = 1; i < flat.length; i++) {
    const first = flat.slice(0, i);
    if (new Set(first.map((f) => f.chunk)).size > 1) break;
    for (let j = i + 1; j <= flat.length; j++) {
      const second = flat.slice(i, j);
      if (new Set(second.map((f) => f.chunk)).size > 1) break;
      const a = numberOf(first.map((f) => f.digits));
      const b = numberOf(second.map((f) => f.digits));
      if (Number.isFinite(a) && Number.isFinite(b)) readings.push([a, b]);
    }
  }
  for (const [a, b] of readings) {
    // East first, as written on Swiss maps; the other order is accepted.
    for (const [east, north] of [
      [a, b],
      [b, a],
    ]) {
      try {
        if (isMN95(east, north)) {
          const { lat, lng } = fromMN95(east, north);
          return [lat, lng];
        }
        if (isMN03(east, north) && north >= 50000) {
          const { lat, lng } = fromMN03(east, north);
          return [lat, lng];
        }
      } catch {
        // Next reading.
      }
    }
  }
  return null;
}

type Angle = { value: number; hemi: string };

/**
 * Degrees, minutes and seconds, or degrees and decimal minutes, with
 * symbols (46°56'53"N) or hemisphere letters (46 56 53 N 7 26 51 E).
 */
function parseAngles(text: string): LatLng | null {
  const hasUnits = /[°'"]/.test(text);
  const letter = /(?<![a-z])[NSEWO](?![a-z])/i;
  if (!hasUnits && !letter.test(text)) return null;
  const tokens = [
    ...text.matchAll(
      /(-?\d+(?:[.,]\d+)?)\s*([°'"])?|(?<![a-z])([NSEWO])(?![a-z])/gi,
    ),
  ];
  // "N 46° 56' E 7° 26'" (letter first) or "46° 56' N 7° 26' E".
  const prefixStyle = !!tokens[0]?.[3];
  const angles: Angle[] = [];
  let parts: number[] = [];
  let units: string[] = [];
  let sign = 1;
  let hemi = "";
  let broken = false;
  const close = () => {
    if (!parts.length) return;
    let value = 0;
    parts.forEach((p, i) => {
      const u = units[i] || (i === 0 ? "°" : i === 1 ? "'" : '"');
      // Minutes and seconds stay below 60.
      if (u !== "°" && p >= 60) broken = true;
      value += u === "°" ? p : u === "'" ? p / 60 : p / 3600;
    });
    angles.push({ value: sign * value, hemi: hemi.toUpperCase() });
    parts = [];
    units = [];
    sign = 1;
    hemi = "";
  };
  const order: Record<string, number> = { "°": 0, "'": 1, '"': 2 };
  for (const t of tokens) {
    if (t[3]) {
      if (prefixStyle) {
        close();
        hemi = t[3];
      } else if (parts.length) {
        hemi = t[3];
        close();
      }
      continue;
    }
    const raw = t[1];
    const unit = t[2] ?? "";
    const last = units[units.length - 1];
    // A new degree value, or a unit that does not follow the previous one,
    // starts a new angle.
    if (
      parts.length &&
      (unit === "°" ||
        (unit && last && order[unit] <= order[last]) ||
        parts.length >= 3)
    ) {
      const keep = prefixStyle ? "" : hemi;
      close();
      hemi = keep;
    }
    if (!parts.length && raw.startsWith("-")) sign = -1;
    parts.push(Math.abs(Number(raw.replace(",", "."))));
    units.push(unit);
  }
  close();
  if (broken || angles.length < 2) return null;
  const [first, second] = angles;
  const signed = (a: Angle) =>
    a.hemi === "S" || a.hemi === "W" || a.hemi === "O"
      ? -Math.abs(a.value)
      : a.value;
  const isLng = (a: Angle) =>
    a.hemi === "E" || a.hemi === "W" || a.hemi === "O";
  const isLat = (a: Angle) => a.hemi === "N" || a.hemi === "S";
  if (isLng(first) || isLat(second))
    return valid([signed(second), signed(first)]);
  if (isLat(first) || isLng(second))
    return valid([signed(first), signed(second)]);
  return orderDegrees(first.value, second.value);
}

/** Latitude, longitude; Swiss habit "6.14, 46.2" is swapped. */
function orderDegrees(a: number, b: number): LatLng | null {
  if (Math.abs(a) > 90 && Math.abs(b) <= 90) return valid([b, a]);
  if (a >= 5 && a <= 11 && b >= 45 && b <= 48) return valid([b, a]);
  return valid([a, b]);
}

function parseDecimal(text: string): LatLng | null {
  // A decimal comma only after one to three digits ("46,2044").
  const numbers = text.match(/-?\d{1,3},\d+(?!\d)|-?\d+(?:\.\d+)?/g);
  if (!numbers || numbers.length < 2 || numbers.length > 3) return null;
  const [a, b] = numbers.slice(0, 2).map((d) => Number(d.replace(",", ".")));
  // Degrees need decimals: "12, 5" is more likely a street number than a
  // position.
  if (!numbers.slice(0, 2).some((d) => /[.,]/.test(d))) return null;
  if (Math.abs(a) > 180 || Math.abs(b) > 180) return null;
  return orderDegrees(a, b);
}

/**
 * Coordinates typed by an operator. Accepts MN95 ("2 600 000 / 1 200 000",
 * "E 2'600'000 N 1'200'000", "2600000-1200000"), MN03 ("600 000 200 000"),
 * decimal degrees ("46.948, 7.447", "46.948 7.447 520" — the altitude is
 * ignored), degrees and minutes or degrees, minutes and seconds
 * ("46°56'53"N 7°26'51"E"). Returns null when the text is not a position.
 */
export function parseCoordinates(input: string): LatLng | null {
  const text = normalize(input);
  if (!text || !/\d/.test(text)) return null;
  return parseSwiss(text) ?? parseAngles(text) ?? parseDecimal(text);
}

/* ---------- Perimeters ---------- */

const round6 = (n: number) => Math.round(n * 1e6) / 1e6;

/**
 * Circle of `radius` metres around `center`, as a closed polygon of `steps`
 * vertices (geodesic destinations, so the radius holds at any latitude).
 * Used for the perimeters: an area like any other.
 */
export function circlePoints(
  center: LatLng,
  radius: number,
  steps = 72,
): LatLng[] {
  const out: LatLng[] = [];
  for (let i = 0; i < steps; i++) {
    const [lat, lng] = destination(center, (360 * i) / steps, radius);
    out.push([round6(lat), round6(lng)]);
  }
  return out;
}

/** "100, 300 1000" → [100, 300, 1000] (metres, sorted, 5 m to 100 km). */
export function parseRadii(text: string): number[] {
  const out = new Set<number>();
  for (const m of text.matchAll(/(\d+(?:[.,]\d+)?)\s*(km|m)?/gi)) {
    const n =
      Number(m[1].replace(",", ".")) *
      (m[2]?.toLowerCase() === "km" ? 1000 : 1);
    if (Number.isFinite(n) && n >= 5 && n <= 100000) out.add(Math.round(n));
  }
  return [...out].sort((a, b) => a - b).slice(0, 12);
}

/**
 * Wedge from `apex` towards `bearing` (degrees clockwise from north), of
 * total opening `angle` degrees and radius `length` metres: a plume, a
 * wind sector, a danger cone.
 */
export function sectorPoints(
  apex: LatLng,
  bearing: number,
  angle: number,
  length: number,
): LatLng[] {
  const opening = Math.min(359, Math.max(1, angle));
  const steps = Math.max(4, Math.ceil(opening / 5));
  const out: LatLng[] = [[round6(apex[0]), round6(apex[1])]];
  for (let i = 0; i <= steps; i++) {
    const b = bearing - opening / 2 + (opening * i) / steps;
    const [lat, lng] = destination(apex, b, length);
    out.push([round6(lat), round6(lng)]);
  }
  return out;
}

/**
 * Compass name of a bearing in the language of the post: N, NNE, NE… in
 * French and Italian (O: ouest, ovest), N, NNO, NO… in German (O: Ost).
 */
export function compass(bearing: number) {
  const names = getLang() === "de" ? GERMAN_COMPASS : FRENCH_COMPASS;
  return names[Math.round((((bearing % 360) + 360) % 360) / 22.5) % 16];
}
const GERMAN_COMPASS = [
  "N",
  "NNO",
  "NO",
  "ONO",
  "O",
  "OSO",
  "SO",
  "SSO",
  "S",
  "SSW",
  "SW",
  "WSW",
  "W",
  "WNW",
  "NW",
  "NNW",
];
const FRENCH_COMPASS = [
  "N",
  "NNE",
  "NE",
  "ENE",
  "E",
  "ESE",
  "SE",
  "SSE",
  "S",
  "SSO",
  "SO",
  "OSO",
  "O",
  "ONO",
  "NO",
  "NNO",
];
