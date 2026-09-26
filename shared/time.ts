/**
 * Wall-clock time of the command post: Europe/Zurich, whatever the time zone
 * of the browser. Every display of the application already uses this zone;
 * the date inputs (`datetime-local`, `date`, `time`) read and write it too,
 * so a post set to another zone (a borrowed laptop, a phone abroad) shows and
 * records the same hours as the others. Conversions go through Intl and are
 * exact across the changes of hour (DST).
 */
export const ZONE = "Europe/Zurich";

const MINUTE = 60_000;
const HOUR = 3_600_000;

export type WallTime = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

let formatter: Intl.DateTimeFormat | null = null;
const parts = () =>
  (formatter ??= new Intl.DateTimeFormat("en-GB", {
    timeZone: ZONE,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }));

/** Zurich wall-clock time of an instant. */
export function zurichWall(at: number): WallTime {
  const out: Record<string, number> = {};
  for (const p of parts().formatToParts(new Date(at)))
    if (p.type !== "literal") out[p.type] = Number(p.value);
  return {
    year: out.year,
    month: out.month,
    day: out.day,
    hour: out.hour === 24 ? 0 : out.hour,
    minute: out.minute,
    second: out.second,
  };
}

const naive = (w: WallTime) =>
  Date.UTC(w.year, w.month - 1, w.day, w.hour, w.minute, w.second);

/** Offset of Zurich from UTC at an instant, in ms (+1 h or +2 h). */
export function zurichOffset(at: number): number {
  const whole = Math.floor(at / 1000) * 1000;
  return naive(zurichWall(whole)) - whole;
}

/**
 * Instant of a Zurich wall-clock time. A time skipped by the spring change
 * (02:30 on the last Sunday of March) moves forward by the gap, like the
 * browsers do (03:30); a time repeated in autumn takes its first occurrence.
 */
export function fromZurichWall(w: WallTime): number {
  const guess = naive(w);
  const before = zurichOffset(guess - 12 * HOUR);
  const after = zurichOffset(guess + 12 * HOUR);
  const matches = [guess - before, guess - after].filter(
    (t) => naive(zurichWall(t)) === guess,
  );
  return matches.length ? Math.min(...matches) : guess - before;
}

const pad = (n: number, size = 2) => String(n).padStart(size, "0");

export type InputKind = "datetime" | "date" | "time";

/** Value of a date input (`datetime-local`, `date` or `time`) in Zurich time. */
export function toZurichInput(
  value: string | number | null | undefined,
  kind: InputKind = "datetime",
): string {
  if (value === "" || value === null || value === undefined) return "";
  const at = typeof value === "number" ? value : Date.parse(value);
  if (!Number.isFinite(at)) return "";
  const w = zurichWall(at);
  const date = `${pad(w.year, 4)}-${pad(w.month)}-${pad(w.day)}`;
  const time = `${pad(w.hour)}:${pad(w.minute)}`;
  return kind === "date" ? date : kind === "time" ? time : `${date}T${time}`;
}

const INPUT = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?$/;

/** Instant (ms) of a date input value read as Zurich time; NaN if invalid. */
export function zurichInputMs(value: string): number {
  const m = INPUT.exec(value.trim());
  if (!m) return NaN;
  const w: WallTime = {
    year: Number(m[1]),
    month: Number(m[2]),
    day: Number(m[3]),
    hour: Number(m[4] ?? 0),
    minute: Number(m[5] ?? 0),
    second: Number(m[6] ?? 0),
  };
  if (
    w.month < 1 ||
    w.month > 12 ||
    w.day < 1 ||
    w.day > 31 ||
    w.hour > 23 ||
    w.minute > 59 ||
    w.second > 59
  )
    return NaN;
  return fromZurichWall(w);
}

/** ISO string of a date input value read as Zurich time; "" if empty. */
export function fromZurichInput(value: string): string {
  if (!value) return "";
  const at = zurichInputMs(value);
  return Number.isFinite(at) ? new Date(at).toISOString() : "";
}

/** Zurich day of an instant, "YYYY-MM-DD". */
export const zurichDate = (at: number) => toZurichInput(at, "date");

/** Hour (0–23) in Zurich. */
export const zurichHour = (at: number) => zurichWall(at).hour;

/** Midnight in Zurich of the day of an instant. */
export function zurichMidnight(at: number): number {
  const w = zurichWall(at);
  return fromZurichWall({ ...w, hour: 0, minute: 0, second: 0 });
}

/**
 * Adds minutes of wall-clock time in Zurich: 08:00 plus 24 h is 08:00 the
 * next day, also across a change of hour (then 23 or 25 hours later).
 */
export function addZurichWall(at: number, minutes: number): number {
  const w = zurichWall(at);
  const shifted = new Date(naive(w) + Math.round(minutes * MINUTE));
  return fromZurichWall({
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
    hour: shifted.getUTCHours(),
    minute: shifted.getUTCMinutes(),
    second: shifted.getUTCSeconds(),
  });
}

/**
 * Times of a recurring meeting: `count` occurrences every `hours` of Zurich
 * wall-clock time from `first` (ms). Two occurrences falling on the same
 * instant (the hour skipped in spring) are kept once.
 */
export function recurrence(
  first: number,
  hours: number,
  count: number,
): number[] {
  const out: number[] = [];
  for (let k = 0; k < count; k++) {
    const t = addZurichWall(first, k * hours * 60);
    if (!out.includes(t)) out.push(t);
  }
  return out;
}
