import { toMN95 } from "./coordinates.ts";
import { toZurichInput } from "./time.ts";

// Live positions of the teams (« Positions en direct »). A phone or tablet
// that chose to share its position sends it as an ephemeral message
// (shared/ephemeral.ts): encrypted with the session key, forwarded by the
// relay, kept in memory by the other posts only while it is recent. Nothing
// reaches a journal, the history or an archive unless an operator records it
// on purpose (journal entry, map object, saved track).
//
// Everything here is free of the browser and of the network: the throttling
// of the sender, the envelope, the staleness and the trails are tested.

/** Kind of the ephemeral message. */
export const LIVE_KIND = "pos";
/** A position leaves at least this often while sharing (heartbeat). */
export const SEND_EVERY = 15_000;
/** …and sooner after a move of MOVE_METRES, but never more often than this. */
export const MIN_INTERVAL = 5_000;
export const MOVE_METRES = 25;
/** Shown as old after this delay (grey, « il y a 3 min »). */
export const STALE_AFTER = 2 * 60_000;
/** Removed from the map after this delay. */
export const GONE_AFTER = 30 * 60_000;
/** Length of the trail kept in memory behind each team. */
export const TRAIL_MS = 30 * 60_000;
const TRAIL_POINTS = 600;
/** Recorded track (explicit « Enregistrer la trace »). */
const TRACK_POINTS = 20_000;
/** Largest line of a map object (shared/ops.ts placeSchema). */
export const LINE_POINTS = 2000;
export const LABEL_MAX = 80;
const REF =
  /^(cell|resource|member):[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** One reading of the device (Geolocation API), `t` in ms of this post. */
export type Fix = {
  lat: number;
  lng: number;
  /** Accuracy radius, metres. */
  acc: number;
  /** Degrees clockwise from north, null when unknown or standing. */
  hdg: number | null;
  /** Metres per second, null when unknown. */
  spd: number | null;
  t: number;
};
/** What a post shares: a fix and the team it stands for. */
export type Position = Fix & {
  label: string;
  /** Record the post stands for (`cell:…`, `resource:…`), or "". */
  ref: string;
};
export type TrailPoint = [lat: number, lng: number, at: number];
/** A team seen on the map. */
export type Unit = Position & {
  /** Id of the sending page. */
  peer: string;
  /** Operator of the sending post. */
  name: string;
  /** Last message received (clock of this post). */
  heard: number;
  trail: TrailPoint[];
  /** The position of this very post. */
  self?: boolean;
};
export type Units = Map<string, Unit>;

const R = 6_371_008.8;
const rad = (d: number) => (d * Math.PI) / 180;
/** Distance in metres (haversine). */
export function distance(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/* ---------- Sender: when to send ---------- */

export type Sent = { lat: number; lng: number; at: number } | null;
/**
 * Whether a fix leaves now: always the first one; then every SEND_EVERY,
 * or after a move of MOVE_METRES once MIN_INTERVAL has passed.
 */
export function shouldSend(
  last: Sent,
  fix: { lat: number; lng: number },
  now: number,
): boolean {
  if (!last) return true;
  const elapsed = now - last.at;
  if (elapsed >= SEND_EVERY) return true;
  if (elapsed < MIN_INTERVAL) return false;
  return distance(last, fix) >= MOVE_METRES;
}

/* ---------- Envelope ---------- */

const round = (n: number, digits: number) => {
  const f = 10 ** digits;
  return Math.round(n * f) / f;
};
export const cleanLabel = (label: string) =>
  label.replace(/\s+/g, " ").trim().slice(0, LABEL_MAX);

/**
 * The value of the ephemeral message, as small as possible. The age of the
 * fix travels instead of its time: the clocks of the posts may differ.
 */
export type Envelope =
  | {
      /** lat, lng, accuracy (m), heading (°) or null, speed (m/s) or null, age (ms). */
      p: [number, number, number, number | null, number | null, number];
      l: string;
      r?: string;
    }
  | { end: 1 };

export function encodePosition(pos: Position, now: number): Envelope {
  const out: Envelope = {
    p: [
      round(pos.lat, 6),
      round(pos.lng, 6),
      Math.max(0, Math.round(pos.acc)),
      pos.hdg === null || !Number.isFinite(pos.hdg)
        ? null
        : Math.round(((pos.hdg % 360) + 360) % 360) % 360,
      pos.spd === null || !Number.isFinite(pos.spd) ? null : round(pos.spd, 1),
      Math.max(0, Math.min(GONE_AFTER, Math.round(now - pos.t))),
    ],
    l: cleanLabel(pos.label),
  };
  if (pos.ref) out.r = pos.ref;
  return out;
}
export const END: Envelope = { end: 1 };

const num = (v: unknown, min: number, max: number) =>
  typeof v === "number" && Number.isFinite(v) && v >= min && v <= max;

/**
 * A received envelope: the position (its time on the clock of this post),
 * "end" when the post stopped sharing, null when malformed.
 */
export function decodePosition(
  raw: unknown,
  now: number,
): Position | "end" | null {
  if (!raw || typeof raw !== "object") return null;
  const v = raw as Record<string, unknown>;
  if (v.end === 1) return "end";
  const p = v.p;
  if (!Array.isArray(p) || p.length !== 6) return null;
  const [lat, lng, acc, hdg, spd, age] = p as unknown[];
  if (
    !num(lat, -90, 90) ||
    !num(lng, -180, 180) ||
    !num(acc, 0, 100_000) ||
    !(hdg === null || num(hdg, 0, 360)) ||
    !(spd === null || num(spd, 0, 1000)) ||
    !num(age, 0, GONE_AFTER)
  )
    return null;
  const label = typeof v.l === "string" ? cleanLabel(v.l) : "";
  const ref = typeof v.r === "string" && REF.test(v.r) ? v.r : "";
  return {
    lat: lat as number,
    lng: lng as number,
    acc: acc as number,
    hdg: hdg as number | null,
    spd: spd as number | null,
    t: now - (age as number),
    label,
    ref,
  };
}

/* ---------- Receiver: units, trails, staleness ---------- */

export type Freshness = "live" | "stale" | "gone";
export function freshness(at: number, now: number): Freshness {
  const age = now - at;
  return age >= GONE_AFTER ? "gone" : age >= STALE_AFTER ? "stale" : "live";
}

/** « à l’instant », « il y a 40 s », « il y a 3 min », « il y a 1 h 05 ». */
export function ageText(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000));
  if (s < 10) return "à l’instant";
  if (s < 60) return `il y a ${s} s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `il y a ${m} min`;
  return `il y a ${Math.floor(m / 60)} h ${String(m % 60).padStart(2, "0")}`;
}

function extendTrail(trail: TrailPoint[], pos: Position, now: number) {
  const kept = trail.filter((p) => now - p[2] < TRAIL_MS);
  const last = kept[kept.length - 1];
  if (
    !last ||
    (pos.t > last[2] &&
      (distance({ lat: last[0], lng: last[1] }, pos) >= 3 ||
        pos.t - last[2] >= 60_000))
  )
    kept.push([pos.lat, pos.lng, pos.t]);
  return kept.slice(-TRAIL_POINTS);
}

/** Units after a message of `peer` (a new Map; the old one is unchanged). */
export function receivePosition(
  units: Units,
  from: { peer: string; name: string; self?: boolean },
  pos: Position | "end",
  now: number,
): Units {
  const next = new Map(units);
  if (pos === "end") {
    next.delete(from.peer);
    return next;
  }
  const before = units.get(from.peer);
  // A late message (older fix) only says that the post is still there.
  if (before && pos.t < before.t) {
    next.set(from.peer, { ...before, heard: now, name: from.name });
    return next;
  }
  next.set(from.peer, {
    ...pos,
    peer: from.peer,
    name: from.name,
    heard: now,
    trail: extendTrail(before?.trail ?? [], pos, now),
    ...(from.self ? { self: true } : {}),
  });
  return next;
}

/** Units without the gone ones and without trail points too old. */
export function pruneUnits(units: Units, now: number): Units {
  let changed = false;
  const next: Units = new Map();
  for (const [peer, u] of units) {
    if (freshness(u.t, now) === "gone") {
      changed = true;
      continue;
    }
    const trail = u.trail.filter((p) => now - p[2] < TRAIL_MS);
    if (trail.length !== u.trail.length) changed = true;
    next.set(peer, trail.length === u.trail.length ? u : { ...u, trail });
  }
  return changed ? next : units;
}

/* ---------- Recorded track (explicit) ---------- */

/** The track with one more fix (skipping jitter under 5 m). */
export function addToTrack(track: TrailPoint[], fix: Fix): TrailPoint[] {
  const last = track[track.length - 1];
  if (last && distance({ lat: last[0], lng: last[1] }, fix) < 5) return track;
  const next = [...track, [fix.lat, fix.lng, fix.t] as TrailPoint];
  return next.length > TRACK_POINTS ? next.slice(-TRACK_POINTS) : next;
}

/** Length of a track in metres. */
export function trackLength(track: TrailPoint[]): number {
  let total = 0;
  for (let i = 1; i < track.length; i++)
    total += distance(
      { lat: track[i - 1][0], lng: track[i - 1][1] },
      { lat: track[i][0], lng: track[i][1] },
    );
  return total;
}

/**
 * Points of a map line for a track: at most LINE_POINTS, the first and the
 * last kept, rounded like the other map objects.
 */
export function trackLine(track: TrailPoint[]): [number, number][] {
  const pts = track.map(([lat, lng]) => [round(lat, 6), round(lng, 6)]) as [
    number,
    number,
  ][];
  if (pts.length <= LINE_POINTS) return pts;
  const out: [number, number][] = [];
  const step = (pts.length - 1) / (LINE_POINTS - 1);
  for (let i = 0; i < LINE_POINTS; i++) out.push(pts[Math.round(i * step)]);
  return out;
}

/* ---------- Written on purpose ---------- */

/** MN95 text of a position (as typed in the coordinates of an entry). */
export function mn95Of(lat: number, lng: number): string {
  try {
    const { east, north } = toMN95(lat, lng);
    return `${Math.round(east)} / ${Math.round(north)}`;
  } catch {
    return "";
  }
}

/** Fields of the journal entry « Consigner la position au journal ». */
export function positionEntry(unit: Position & { name?: string }) {
  const at = new Date(unit.t).toISOString();
  const mn95 = mn95Of(unit.lat, unit.lng);
  const where = mn95
    ? `MN95 ${mn95}`
    : `WGS84 ${unit.lat.toFixed(5)}, ${unit.lng.toFixed(5)}`;
  const label = unit.label || unit.name || "Équipe";
  return {
    happenedAt: at,
    type: "Renseignement" as const,
    message: `Position de ${label} à ${toZurichInput(unit.t, "time")} : ${where} (précision ± ${Math.round(unit.acc)} m, position GPS partagée en direct).`,
    source: label,
    channel: "Autre" as const,
    coordinates: mn95 || `${unit.lat.toFixed(6)}, ${unit.lng.toFixed(6)}`,
    tags: ["Position GPS"],
  };
}
