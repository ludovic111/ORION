import { z } from "zod";

// Hybrid logical clock (HLC) stamps.
//
// Every change a post makes is stamped. A stamp is the ISO time of the wall
// clock followed by a counter and the id of the post (node) that made it:
//
//   2026-09-24T10:05:00.000Z.0003.k3f9x2ab
//
// A new stamp is always later than every stamp the post has seen for the
// same journal (max(wall clock, last seen + 1)). So a post whose clock is
// 5 minutes late still wins when it edits after seeing a change made by a
// post whose clock is 5 minutes early: the order follows causality, not
// the clocks. The node id breaks the remaining ties, the same way on every
// post.
//
// Stamps compare as strings. Stamps written before 2.1 are plain ISO times
// ("…000Z"): they are a prefix of any HLC of the same millisecond, so they
// sort before it, and canonicalStamp() rewrites the other ISO forms (no
// milliseconds, offsets) into that prefix form.

const WALL = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const HLC =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\.[0-9a-f]{4}\.[0-9a-z]{8}$/;
export const NODE = /^[0-9a-z]{8}$/;

/** Random id of this post (8 characters). */
export function randomNode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return [...bytes]
    .map((b) => "0123456789abcdefghijklmnopqrstuv"[b & 31])
    .join("");
}

let node = randomNode();
/** Id of this post, written in its stamps. */
export const localNode = () => node;
/** Keep the same node id across reloads (stored with the session). */
export function setLocalNode(id: string | undefined) {
  if (id && NODE.test(id)) node = id;
}

/** Canonical form of a stamp; "" when it is not a stamp at all. */
export function canonicalStamp(value: string): string {
  if (HLC.test(value) || WALL.test(value)) return value;
  const t = Date.parse(value);
  if (Number.isNaN(t)) return "";
  const iso = new Date(t).toISOString();
  return WALL.test(iso) ? iso : "";
}
export const isStamp = (value: unknown) =>
  typeof value === "string" && value.length <= 64 && !!canonicalStamp(value);

/** A stamp in a schema: old ISO times are accepted and made canonical. */
export const stampSchema = z
  .string()
  .max(64)
  .refine(isStamp, "Horodatage invalide.")
  .transform(canonicalStamp);

export type Parts = { wall: number; counter: number; node: string };
/** Wall time, counter (-1 for an old ISO stamp) and node of a stamp. */
export function parts(stamp: string): Parts {
  const s = canonicalStamp(stamp);
  if (!s) return { wall: 0, counter: -1, node: "" };
  const wall = Date.parse(s.slice(0, 24));
  if (s.length === 24) return { wall, counter: -1, node: "" };
  return {
    wall,
    counter: parseInt(s.slice(25, 29), 16),
    node: s.slice(30),
  };
}
export const nodeOf = (stamp: string) =>
  stamp.length > 24 ? stamp.slice(30) : "";

/**
 * Next stamp after `last` (the latest stamp seen), not earlier than the
 * wall clock `wall`.
 */
export function tick(
  last: string | undefined,
  wall: number | string = Date.now(),
  by = node,
): string {
  const w = typeof wall === "number" ? wall : Date.parse(wall);
  const now = Number.isNaN(w) ? Date.now() : w;
  const p = last ? parts(last) : { wall: -Infinity, counter: -1 };
  let ms = Math.max(now, p.wall);
  let counter = ms === p.wall ? p.counter + 1 : 0;
  if (counter > 0xffff) {
    ms += 1;
    counter = 0;
  }
  return `${new Date(ms).toISOString()}.${counter.toString(16).padStart(4, "0")}.${NODE.test(by) ? by : node}`;
}

/** Later of two stamps ("" counts as the earliest). */
export const later = (a = "", b = "") => (a > b ? a : b);
