import { upsert, type Member, type Ops } from "./ops.ts";
import { addZurichWall } from "./time.ts";
import type { Presence, Shift } from "./conduct-schemas.ts";
import { formatTime } from "./i18n/core.ts";
import { t } from "./i18n/presence.ts";

// Roll-call and plan de relève. Durations are real elapsed time (ms between
// two instants), so a night across the change of hour counts 13 or 11 hours
// on the wall clock correctly; the planned shifts are laid out in Zurich
// wall-clock time (08:00–20:00 stays 08:00–20:00 on the day of the change).

export const DEFAULT_DUTY_HOURS = 12;
export const DEFAULT_REST_HOURS = 8;
const HOUR = 3_600_000;

export type Rules = { dutyHours: number; restHours: number };
export const presenceRules = (ops: Pick<Ops, "settings">): Rules => ({
  dutyHours: ops.settings.presence?.dutyHours ?? DEFAULT_DUTY_HOURS,
  restHours: ops.settings.presence?.restHours ?? DEFAULT_REST_HOURS,
});

/** "12 h 05", "45 min". */
export function formatDuration(ms: number) {
  const m = Math.max(0, Math.round(ms / 60_000));
  const h = Math.floor(m / 60);
  return h ? `${h} h ${String(m % 60).padStart(2, "0")}` : `${m} min`;
}
const hhmm = (at: number) => formatTime(at);

/** The stay not closed yet of a person (the latest one if several). */
export const openPresence = (
  ops: Pick<Ops, "presences">,
  memberId: string,
): Presence | undefined =>
  ops.presences
    .filter((p) => p.memberId === memberId && !p.out)
    .sort((a, b) => b.in.localeCompare(a.in))[0];

/** Arrival of a person at the command post. */
export function checkIn(
  ops: Ops,
  member: Pick<Member, "id" | "name">,
  author: string,
  at = new Date().toISOString(),
  via = "Bouton",
): Ops {
  if (openPresence(ops, member.id)) return ops;
  let next = upsert(
    ops,
    "presences",
    {
      memberId: member.id,
      name: member.name,
      in: at,
      out: "",
      via,
      note: "",
    },
    author,
  );
  const m = next.members.find((x) => x.id === member.id);
  if (m && m.status !== "Présent")
    next = upsert(next, "members", { ...m, status: "Présent" }, author);
  return next;
}

/** Departure: closes every open stay of the person. */
export function checkOut(
  ops: Ops,
  memberId: string,
  author: string,
  at = new Date().toISOString(),
): Ops {
  let next = ops;
  for (const p of ops.presences)
    if (p.memberId === memberId && !p.out)
      next = upsert(
        next,
        "presences",
        { ...p, out: at < p.in ? p.in : at },
        author,
      );
  const m = next.members.find((x) => x.id === memberId);
  if (m && next !== ops && m.status === "Présent")
    next = upsert(next, "members", { ...m, status: "Relevé" }, author);
  return next;
}

export type Duty = {
  memberId: string;
  name: string;
  present: boolean;
  /** Start of the current period of duty (short rests do not end it). */
  since: number | null;
  /** Arrival of the current (or last) stay. */
  stay: number | null;
  /** Length of the current (or last) period of duty, rests included. */
  span: number;
  /** Time actually present during this period. */
  worked: number;
  /** End of the last period (absent people). */
  lastOut: number | null;
  /** Rest since the last departure (absent people). */
  resting: number;
  /** Rest shorter than the minimum inside the current period. */
  shortRest: { gap: number; back: number } | null;
  over: boolean;
  warnings: string[];
};

type Interval = [number, number];

function union(list: Interval[]): Interval[] {
  const sorted = [...list].sort((a, b) => a[0] - b[0]);
  const out: Interval[] = [];
  for (const [a, b] of sorted) {
    const last = out[out.length - 1];
    if (last && a <= last[1]) last[1] = Math.max(last[1], b);
    else out.push([a, b]);
  }
  return out;
}

/**
 * Time on duty of one person from their stays. Stays separated by less than
 * the minimum rest belong to the same period: the counter does not start
 * again after a short break, and the short rest is reported.
 */
export function dutyOf(
  stays: Pick<Presence, "in" | "out">[],
  at: number,
  rules: Rules,
  who: { memberId: string; name: string },
): Duty {
  const rest = rules.restHours * HOUR;
  const intervals = union(
    stays
      .map((p): Interval => {
        const a = Date.parse(p.in);
        const b = p.out ? Date.parse(p.out) : at;
        return [a, Math.max(a, b)];
      })
      // A stay recorded a moment "after" `at` (clock of another post, or
      // the minute shown) still counts.
      .filter(([a]) => Number.isFinite(a)),
  );
  const present = stays.some((p) => !p.out);
  const empty: Duty = {
    ...who,
    present: false,
    since: null,
    stay: null,
    span: 0,
    worked: 0,
    lastOut: null,
    resting: 0,
    shortRest: null,
    over: false,
    warnings: [],
  };
  if (!intervals.length) return empty;
  // Periods: intervals chained by rests shorter than the minimum.
  let start = 0;
  let shortRest: Duty["shortRest"] = null;
  for (let i = 1; i < intervals.length; i++) {
    const gap = intervals[i][0] - intervals[i - 1][1];
    if (gap >= rest) {
      start = i;
      shortRest = null;
    } else if (gap > 0) shortRest = { gap, back: intervals[i][0] };
  }
  const period = intervals.slice(start);
  const since = period[0][0];
  const end = period[period.length - 1][1];
  const span = (present ? Math.max(at, end) : end) - since;
  const worked = period.reduce((n, [a, b]) => n + (b - a), 0);
  const over = span > rules.dutyHours * HOUR;
  const warnings: string[] = [];
  if (over)
    warnings.push(
      t(
        present
          ? "En service {duration} d’affilée depuis {since} (maximum {max} h)"
          : "A servi {duration} d’affilée depuis {since} (maximum {max} h)",
        {
          duration: formatDuration(span),
          since: hhmm(since),
          max: rules.dutyHours,
        },
      ),
    );
  if (shortRest)
    warnings.push(
      t(
        "Repos de {duration} seulement avant la reprise à {back} (minimum {min} h)",
        {
          duration: formatDuration(shortRest.gap),
          back: hhmm(shortRest.back),
          min: rules.restHours,
        },
      ),
    );
  return {
    ...who,
    present,
    since,
    stay: period[period.length - 1][0],
    span,
    worked,
    lastOut: present ? null : end,
    resting: present ? 0 : at - end,
    shortRest,
    over,
    warnings,
  };
}

/** Duty of every person of the team (and of stays without a person). */
export function dutyBoard(
  ops: Pick<Ops, "presences" | "members" | "settings">,
  at = Date.now(),
): Duty[] {
  const rules = presenceRules(ops);
  const byMember = new Map<string, Presence[]>();
  for (const p of ops.presences) {
    const key = p.memberId || `name:${p.name}`;
    byMember.set(key, [...(byMember.get(key) ?? []), p]);
  }
  const out: Duty[] = ops.members.map((m) =>
    dutyOf(byMember.get(m.id) ?? [], at, rules, {
      memberId: m.id,
      name: m.name,
    }),
  );
  for (const [key, stays] of byMember)
    if (key.startsWith("name:") || !ops.members.some((m) => m.id === key))
      out.push(
        dutyOf(stays, at, rules, {
          memberId: key.startsWith("name:") ? "" : key,
          name: stays[0].name || t("Personne retirée"),
        }),
      );
  return out;
}

/** Can the person come back now (rest long enough)? Time when they can. */
export function restedAt(duty: Duty, rules: Rules): number | null {
  if (duty.present || duty.lastOut === null) return null;
  return duty.lastOut + rules.restHours * HOUR;
}

// ---------- Plan de relève ----------

/** Shifts laid out one after the other in Zurich wall-clock time. */
export function planShifts(
  first: number,
  hours: number,
  count: number,
  title = t("Relève"),
): { title: string; start: string; end: string }[] {
  const out: { title: string; start: string; end: string }[] = [];
  let start = first;
  for (let k = 0; k < count; k++) {
    const end = addZurichWall(start, hours * 60);
    out.push({
      title: `${title} ${k + 1}`,
      start: new Date(start).toISOString(),
      end: new Date(end).toISOString(),
    });
    start = end;
  }
  return out;
}

export type ShiftWarning = { memberId: string; shiftId: string; text: string };

/**
 * Problems of the plan: a person planned longer than the maximum in a row
 * (shifts chained by short rests count together), or with a rest shorter
 * than the minimum between two shifts.
 */
export function shiftWarnings(
  shifts: Pick<Shift, "id" | "start" | "end" | "memberIds" | "title">[],
  members: Pick<Member, "id" | "name">[],
  rules: Rules,
): ShiftWarning[] {
  const out: ShiftWarning[] = [];
  const name = (id: string) => members.find((m) => m.id === id)?.name ?? "?";
  const rest = rules.restHours * HOUR;
  const byMember = new Map<string, typeof shifts>();
  for (const s of shifts)
    for (const id of s.memberIds)
      byMember.set(id, [...(byMember.get(id) ?? []), s]);
  for (const [id, list] of byMember) {
    const sorted = [...list].sort((a, b) => a.start.localeCompare(b.start));
    let chainStart = Date.parse(sorted[0].start);
    let chainEnd = Date.parse(sorted[0].end);
    let reported = false;
    const check = (shiftId: string) => {
      if (!reported && chainEnd - chainStart > rules.dutyHours * HOUR) {
        out.push({
          memberId: id,
          shiftId,
          text: t(
            "{name} : {duration} de service d’affilée (maximum {max} h)",
            {
              name: name(id),
              duration: formatDuration(chainEnd - chainStart),
              max: rules.dutyHours,
            },
          ),
        });
        reported = true;
      }
    };
    check(sorted[0].id);
    for (let i = 1; i < sorted.length; i++) {
      const a = Date.parse(sorted[i].start);
      const b = Date.parse(sorted[i].end);
      const gap = a - chainEnd;
      if (gap >= rest) {
        chainStart = a;
        chainEnd = b;
        reported = false;
      } else {
        if (gap > 0)
          out.push({
            memberId: id,
            shiftId: sorted[i].id,
            text: t(
              "{name} : repos de {duration} seulement avant « {title} » (minimum {min} h)",
              {
                name: name(id),
                duration: formatDuration(gap),
                title: sorted[i].title,
                min: rules.restHours,
              },
            ),
          });
        chainEnd = Math.max(chainEnd, b);
      }
      check(sorted[i].id);
    }
  }
  return out;
}

/** Shift running at a time, and the next one. */
export function currentShifts(
  shifts: Shift[],
  at = Date.now(),
): { now: Shift[]; next: Shift | null } {
  const sorted = [...shifts].sort((a, b) => a.start.localeCompare(b.start));
  return {
    now: sorted.filter(
      (s) => Date.parse(s.start) <= at && at < Date.parse(s.end),
    ),
    next: sorted.find((s) => Date.parse(s.start) > at) ?? null,
  };
}
