import {
  current,
  needsFollowUp,
  numberLabel,
  overdue,
  type Journal,
} from "../../shared/journal.ts";
import { t } from "./i18n.ts";

// What the wall screen shows, chosen from the live journal: open points
// (late first), the next report with its countdown, key facts, resources
// engaged, latest entries, alerts in force. Pure: tested in node.

export type WallPoint = {
  id: string;
  label: string;
  text: string;
  assignee: string;
  due: number | null;
  late: boolean;
};
export type WallData = {
  title: string;
  location: string;
  exercise: boolean;
  open: WallPoint[];
  openCount: number;
  lateCount: number;
  next: { title: string; at: number; minutes: number; live: boolean } | null;
  facts: { id: string; label: string; value: string; unit: string }[];
  engaged: {
    id: string;
    name: string;
    status: string;
    count: number;
    location: string;
  }[];
  engagedCount: number;
  latest: {
    id: string;
    label: string;
    at: number;
    text: string;
    priority: string;
  }[];
  newMessages: number;
  alerts: { id: string; hazard: string; level: string; region: string }[];
};

const ENGAGED = ["Engagé", "En route", "Alerté"];
// Agenda titles are data, in the language of the journal.
const REPORT =
  /rapport|orientation|point de situation|orientierung|orientamento|punto della situazione/i;

export function wallData(
  journal: Pick<Journal, "title" | "location" | "mode" | "entries" | "ops">,
  now: number,
  limits = { open: 6, latest: 8, facts: 8, resources: 8 },
): WallData {
  const follow = journal.entries.filter(needsFollowUp);
  const open = follow
    .map((e): WallPoint => {
      const f = current(e);
      const due = f.dueAt ? Date.parse(f.dueAt) : null;
      return {
        id: e.id,
        label: numberLabel(e),
        text: f.message.split("\n")[0],
        assignee: f.assignee,
        due: due !== null && Number.isFinite(due) ? due : null,
        late: overdue(e, now),
      };
    })
    .sort(
      (a, b) =>
        Number(b.late) - Number(a.late) ||
        (a.due ?? Infinity) - (b.due ?? Infinity) ||
        a.label.localeCompare(b.label),
    );
  // Next meeting of the rhythm of conduct: a report first, else any.
  const coming = journal.ops.agenda
    .filter((a) => !a.done)
    .map((a) => {
      const at = Date.parse(a.at);
      return { a, at, end: at + a.minutes * 60_000 };
    })
    .filter((x) => Number.isFinite(x.at) && x.end >= now)
    .sort((x, y) => x.at - y.at);
  const report =
    coming.find((x) => REPORT.test(`${x.a.kind} ${x.a.title}`)) ?? coming[0];
  const facts = [...journal.ops.facts]
    .filter((f) => f.value.trim())
    .sort((a, b) => a.order - b.order)
    .slice(0, limits.facts)
    .map((f) => ({ id: f.id, label: f.label, value: f.value, unit: f.unit }));
  const engagedAll = journal.ops.resources
    .filter((r) => ENGAGED.includes(r.status))
    .sort(
      (a, b) =>
        ENGAGED.indexOf(a.status) - ENGAGED.indexOf(b.status) ||
        a.name.localeCompare(b.name, "fr"),
    );
  const latest = [...journal.entries]
    .sort(
      (a, b) =>
        Date.parse(current(b).happenedAt) - Date.parse(current(a).happenedAt) ||
        b.number - a.number,
    )
    .slice(0, limits.latest)
    .map((e) => ({
      id: e.id,
      label: numberLabel(e),
      at: Date.parse(current(e).happenedAt),
      text: current(e).message.split("\n")[0],
      priority: current(e).priority,
    }));
  const alerts = journal.ops.alerts
    .filter((a) => {
      const from = a.from ? Date.parse(a.from) : -Infinity;
      const to = a.to ? Date.parse(a.to) : Infinity;
      return from <= now && now <= to;
    })
    .sort((a, b) => Number(b.level) - Number(a.level))
    .map((a) => ({
      id: a.id,
      hazard: a.hazard,
      level: a.level,
      region: a.region,
    }));
  return {
    title: journal.title,
    location: journal.location,
    exercise: journal.mode === "Exercice",
    open: open.slice(0, limits.open),
    openCount: open.length,
    lateCount: open.filter((p) => p.late).length,
    next: report
      ? {
          title: report.a.title,
          at: report.at,
          minutes: Math.ceil((report.at - now) / 60_000),
          live: report.at <= now,
        }
      : null,
    facts,
    engaged: engagedAll.slice(0, limits.resources).map((r) => ({
      id: r.id,
      name: r.name,
      status: r.status,
      count: r.count,
      location: r.location,
    })),
    engagedCount: engagedAll.length,
    latest,
    newMessages: journal.ops.messages.filter((m) => m.status === "Nouveau")
      .length,
    alerts,
  };
}

/**
 * Burn-in protection: the whole screen moves by a few pixels every
 * `period`, along a fixed closed path (same position for the same time).
 */
export function burnShift(now: number, period = 120_000, amplitude = 6) {
  const PATH = [
    [0, 0],
    [1, 0.5],
    [0.5, 1],
    [-0.5, 1],
    [-1, 0.5],
    [-1, -0.5],
    [-0.5, -1],
    [0.5, -1],
    [1, -0.5],
  ];
  const [x, y] = PATH[Math.floor(now / period) % PATH.length];
  return { x: Math.round(x * amplitude), y: Math.round(y * amplitude) };
}

/** "dans 12 min", "dans 1 h 05", "en cours". */
export function countdown(minutes: number, live: boolean): string {
  if (live) return t("en cours");
  if (minutes <= 0) return t("maintenant");
  if (minutes < 60) return t("dans {n} min", { n: minutes });
  return t("dans {h} h {m}", {
    h: Math.floor(minutes / 60),
    m: String(minutes % 60).padStart(2, "0"),
  });
}
