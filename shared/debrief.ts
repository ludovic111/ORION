import { current, type Journal } from "./journal.ts";
import { reactions, treatedAt, type Reaction } from "./exercise.ts";
import { toZurichInput } from "./time.ts";
import { t as tr } from "./i18n/debrief.ts";

// Debriefing (RETEX) of a journal: what the timeline says about the
// conduct, measured the same way on every post. Reaction to the injects
// (exercises), deadlines kept or missed, time to treat the messages,
// entries per hour and who did what.

const MINUTE = 60_000;

export type Deadline = {
  entryId: string;
  number: number;
  label: string;
  due: number;
  /** When the entry was closed (Terminé / Annulé), if it was. */
  closed: number | null;
  /** Minutes past the due date (0: kept). */
  delay: number;
};

export type Bucket = { label: string; min: number; max: number; count: number };

export type Person = {
  name: string;
  entries: number;
  revisions: number;
  messages: number;
  changes: number;
};

export type DebriefMetrics = {
  now: number;
  injects: Reaction[];
  /** Injects delivered / with a reaction / late. */
  delivered: number;
  reacted: number;
  lateInjects: number;
  /** Median minutes from delivery to reaction (null: none yet). */
  medianReaction: number | null;
  deadlines: Deadline[];
  overdue: number;
  /** Minutes past due, added up. */
  totalDelay: number;
  messages: number;
  treated: number;
  medianTreatment: number | null;
  treatment: Bucket[];
  /** Zurich hour ("2026-09-24 14") and number of entries recorded. */
  perHour: { hour: string; count: number }[];
  people: Person[];
};

export function median(values: number[]): number | null {
  if (!values.length) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = s.length >> 1;
  return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2);
}

const bucket = (
  label: Parameters<typeof tr>[0],
  min: number,
  max: number,
): Omit<Bucket, "count"> => ({
  get label() {
    return tr(label);
  },
  min,
  max,
});
const BUCKETS: Omit<Bucket, "count">[] = [
  bucket("moins de 5 min", 0, 5),
  bucket("5 à 15 min", 5, 15),
  bucket("15 à 30 min", 15, 30),
  bucket("30 à 60 min", 30, 60),
  bucket("plus d’une heure", 60, Infinity),
];

/** Entries with a due date: kept, late, or still open past due. */
export function deadlines(
  journal: Pick<Journal, "entries">,
  now: number,
): Deadline[] {
  const out: Deadline[] = [];
  for (const e of journal.entries) {
    const f = current(e);
    if (!f.dueAt) continue;
    const due = Date.parse(f.dueAt);
    if (!Number.isFinite(due)) continue;
    const closing = e.revisions.find((r) =>
      ["Terminé", "Annulé"].includes(r.fields.status),
    );
    const closed = closing ? Date.parse(closing.at) : null;
    const open = ["À traiter", "En cours"].includes(f.status);
    const end = closed ?? (open ? now : due);
    out.push({
      entryId: e.id,
      number: e.number,
      label: f.message.split("\n")[0].slice(0, 120),
      due,
      closed,
      delay: Math.max(0, Math.round((end - due) / MINUTE)),
    });
  }
  return out.sort((a, b) => a.due - b.due);
}

/** Zurich hour of an instant, "YYYY-MM-DD HH". */
const hourOf = (at: number) => toZurichInput(at).replace("T", " ").slice(0, 13);

export function entriesPerHour(
  journal: Pick<Journal, "entries">,
): { hour: string; count: number }[] {
  const times = journal.entries
    .map((e) => Date.parse(e.createdAt))
    .filter(Number.isFinite)
    .sort((a, b) => a - b);
  if (!times.length) return [];
  const counts = new Map<string, number>();
  for (const t of times)
    counts.set(hourOf(t), (counts.get(hourOf(t)) ?? 0) + 1);
  // Every hour between the first and the last, empty ones included.
  const out: { hour: string; count: number }[] = [];
  const seen = new Set<string>();
  for (
    let t = Math.floor(times[0] / 3_600_000) * 3_600_000;
    t <= times[times.length - 1];
    t += 3_600_000
  ) {
    const h = hourOf(t);
    if (seen.has(h)) continue;
    seen.add(h);
    out.push({ hour: h, count: counts.get(h) ?? 0 });
  }
  return out;
}

export function whoDidWhat(
  journal: Pick<Journal, "entries" | "history">,
): Person[] {
  const people = new Map<string, Person>();
  const of = (name: string) => {
    const key = name.trim() || "—";
    let p = people.get(key);
    if (!p) {
      p = { name: key, entries: 0, revisions: 0, messages: 0, changes: 0 };
      people.set(key, p);
    }
    return p;
  };
  for (const e of journal.entries) {
    of(e.createdBy).entries++;
    for (const r of e.revisions.slice(1)) of(r.author).revisions++;
  }
  for (const h of journal.history) {
    if (h.scope === "meta" || h.scope === "settings") continue;
    const p = of(h.by);
    p.changes++;
    if (h.scope === "ops.messages") p.messages++;
  }
  return [...people.values()].sort(
    (a, b) =>
      b.entries +
        b.revisions +
        b.changes -
        (a.entries + a.revisions + a.changes) ||
      a.name.localeCompare(b.name, "fr"),
  );
}

export function debriefMetrics(
  journal: Pick<Journal, "entries" | "history" | "ops">,
  now = Date.now(),
): DebriefMetrics {
  const injects = reactions(journal, now);
  const played = injects.filter((r) => r.delivered !== null);
  const reactionTimes = played.flatMap((r) =>
    r.minutes === null ? [] : [r.minutes],
  );
  const due = deadlines(journal, now);
  const late = due.filter((d) => d.delay > 0);
  const times: number[] = [];
  let untreated = 0;
  for (const m of journal.ops.messages) {
    const t = treatedAt(journal, m.id);
    if (!t) {
      untreated++;
      continue;
    }
    times.push(Math.max(0, (t.at - Date.parse(m.receivedAt)) / MINUTE));
  }
  const treatment: Bucket[] = BUCKETS.map((b) => ({
    ...b,
    count: times.filter((t) => t >= b.min && t < b.max).length,
  }));
  treatment.push({
    label: tr("pas encore traités"),
    min: Infinity,
    max: Infinity,
    count: untreated,
  });
  return {
    now,
    injects,
    delivered: played.length,
    reacted: reactionTimes.length,
    lateInjects: injects.filter((r) => r.late).length,
    medianReaction: median(reactionTimes),
    deadlines: due,
    overdue: late.length,
    totalDelay: late.reduce((n, d) => n + d.delay, 0),
    messages: journal.ops.messages.length,
    treated: times.length,
    medianTreatment: median(times.map(Math.round)),
    treatment,
    perHour: entriesPerHour(journal),
    people: whoDidWhat(journal),
  };
}

/** "1 h 05" or "12 min". */
export function minutesLabel(minutes: number | null): string {
  if (minutes === null) return "—";
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, "0")}`;
}
