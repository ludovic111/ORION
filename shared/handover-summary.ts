import {
  current,
  needsFollowUp,
  numberLabel,
  overdue,
  time,
  type Entry,
  type Fields,
  type Journal,
} from "./journal.ts";
import { auditTrail } from "./history.ts";
import { requestLabel } from "./requests.ts";

// "Que s'est-il passé depuis HH:MM ?" — the summary of a handover,
// computed from the journal and its history only (deterministic, no AI):
// new entries by type, decisions, messages received and treated, missions
// opened and closed, changes of resources, requests, checklists, alerts,
// what is late and what stays open.

export type Line = { ref: string; text: string; at: number };
export type HandoverSummary = {
  since: number;
  at: number;
  entries: { type: string; count: number }[];
  newEntries: Line[];
  decisions: Line[];
  messages: { received: number; treated: number; waiting: number };
  missions: { opened: Line[]; closed: Line[] };
  resources: Line[];
  requests: Line[];
  checklists: Line[];
  alerts: Line[];
  overdue: Line[];
  open: Line[];
};

const OPEN = ["À traiter", "En cours"];
const CLOSED = ["Terminé", "Annulé"];
const firstLine = (s: string) =>
  (s.split("\n").find((l) => l.trim()) ?? "").trim();
const clip = (s: string, n = 100) =>
  s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s;
const iso = (ms: number) => new Date(ms).toISOString();
const entryLine = (e: Entry, at: number, suffix = ""): Line => ({
  ref: `entry:${e.id}`,
  text: `${numberLabel(e)} ${clip(firstLine(current(e).message))}${suffix}`,
  at,
});

/** Default start: the last handover recorded, else 8 hours ago. */
export function defaultSince(journal: Journal, at = Date.now()): number {
  const last = journal.entries
    .filter((e) => current(e).type === "Relève")
    .map((e) => Date.parse(e.createdAt))
    .filter((t) => t < at);
  const opened = Date.parse(journal.createdAt);
  return last.length ? Math.max(...last) : Math.max(opened, at - 8 * 3_600_000);
}

export function handoverSummary(
  journal: Journal,
  since: number,
  at = Date.now(),
): HandoverSummary {
  const inRange = (t: number) => t >= since && t <= at;
  const created = journal.entries.filter((e) =>
    inRange(Date.parse(e.createdAt)),
  );
  const counts = new Map<string, number>();
  for (const e of created) {
    const t = current(e).type;
    counts.set(t, (counts.get(t) ?? 0) + 1);
  }
  const byTime = (a: Line, b: Line) => a.at - b.at;

  // Missions: opened (created open, or reopened) and closed in the period,
  // from the versions of the entries.
  const opened: Line[] = [];
  const closed: Line[] = [];
  for (const e of journal.entries) {
    let previous: Fields | null = null;
    for (const r of e.revisions) {
      const t = Date.parse(r.at);
      const was = previous?.status ?? "";
      const now = r.fields.status;
      if (inRange(t)) {
        if (OPEN.includes(now) && !OPEN.includes(was))
          opened.push(
            entryLine(e, t, r.fields.assignee ? ` · ${r.fields.assignee}` : ""),
          );
        if (CLOSED.includes(now) && OPEN.includes(was))
          closed.push(entryLine(e, t, ` · ${now.toLowerCase()}`));
      }
      previous = r.fields;
    }
  }

  // Records, from the history (state before and after each change).
  const trail = auditTrail(journal).filter((i) => inRange(Date.parse(i.at)));
  const state = (v: unknown) => (v ?? {}) as Record<string, unknown>;
  let treated = 0;
  const resources: Line[] = [];
  const requests: Line[] = [];
  const checklists: Line[] = [];
  const alerts: Line[] = [];
  const titles = new Map(journal.ops.checklists.map((c) => [c.id, c]));
  for (const item of trail) {
    const after = state(item.state);
    const before = state(item.previous);
    const t = Date.parse(item.at);
    if (item.scope === "ops.messages") {
      const done = ["Transmis", "Classé"];
      if (
        item.action !== "remove" &&
        done.includes(String(after.status)) &&
        !done.includes(String(before.status ?? ""))
      )
        treated++;
    } else if (item.scope === "ops.resources") {
      const name = String(after.name ?? before.name ?? "Moyen");
      if (item.action === "create")
        resources.push({
          ref: `resource:${item.target}`,
          text: `${name} : ajouté (${String(after.status ?? "")})`,
          at: t,
        });
      else if (item.action === "remove")
        resources.push({ ref: "", text: `${name} : retiré`, at: t });
      else if (before.status && before.status !== after.status)
        resources.push({
          ref: `resource:${item.target}`,
          text: `${name} : ${String(before.status)} → ${String(after.status)}`,
          at: t,
        });
    } else if (item.scope === "ops.requests") {
      if (item.action === "remove") continue;
      if (item.action === "create" || before.status !== after.status)
        requests.push({
          ref: `request:${item.target}`,
          text: `${requestLabel({
            quantity: Number(after.quantity ?? 0),
            unit: String(after.unit ?? ""),
            title: String(after.title ?? "Demande"),
          })} : ${String(after.status ?? "").toLowerCase()}`,
          at: t,
        });
    } else if (item.scope === "ops.checklistTicks") {
      if (item.action === "remove" || !after.done || before.done) continue;
      const list = titles.get(String(after.checklistId));
      const step = list?.steps.find((s) => s.id === after.stepId);
      checklists.push({
        ref: list ? `checklist:${list.id}` : "",
        text: `${list?.title ?? "Liste"} : ${clip(step?.text ?? "étape", 80)} (${String(after.who ?? item.by)})`,
        at: t,
      });
    } else if (item.scope === "ops.alerts" && item.action === "create")
      alerts.push({
        ref: `alert:${item.target}`,
        text: `${String(after.hazard ?? "Alerte")} · degré ${String(after.level ?? "")}`,
        at: t,
      });
  }

  const waiting = journal.ops.messages.filter(
    (m) => m.status === "Nouveau" || m.status === "En traitement",
  ).length;
  const open = journal.entries.filter(needsFollowUp);
  const dueLine = (e: Entry) => {
    const f = current(e);
    return entryLine(
      e,
      f.dueAt ? Date.parse(f.dueAt) : Date.parse(e.createdAt),
      `${f.assignee ? ` · ${f.assignee}` : ""}${f.dueAt ? ` · échéance ${time(f.dueAt)}` : ""}`,
    );
  };
  return {
    since,
    at,
    entries: [...counts]
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count || a.type.localeCompare(b.type)),
    newEntries: created
      .map((e) =>
        entryLine(
          e,
          Date.parse(e.createdAt),
          ` · ${current(e).type.toLowerCase()}`,
        ),
      )
      .sort(byTime),
    decisions: created
      .filter((e) => current(e).type === "Décision")
      .map((e) => entryLine(e, Date.parse(e.createdAt)))
      .sort(byTime),
    messages: {
      received: journal.ops.messages.filter((m) =>
        inRange(Date.parse(m.receivedAt)),
      ).length,
      treated,
      waiting,
    },
    missions: { opened: opened.sort(byTime), closed: closed.sort(byTime) },
    resources: resources.sort(byTime),
    requests: requests.sort(byTime),
    checklists: checklists.sort(byTime),
    alerts: alerts.sort(byTime),
    overdue: open
      .filter((e) => overdue(e, at))
      .map(dueLine)
      .sort(byTime),
    open: open
      .filter((e) => !overdue(e, at))
      .map(dueLine)
      .sort(byTime),
  };
}

export type SummaryTable = {
  id: string;
  title: string;
  caption: string;
  head: string[];
  body: string[][];
  widths?: number[];
};

/** The parts of a summary that have content, as titled lists. */
export function summaryParts(
  s: HandoverSummary,
): { title: string; lines: Line[] }[] {
  return [
    { title: "Décisions", lines: s.decisions },
    { title: "Missions ouvertes", lines: s.missions.opened },
    { title: "Missions closes", lines: s.missions.closed },
    { title: "Moyens", lines: s.resources },
    { title: "Demandes de moyens", lines: s.requests },
    { title: "Listes de contrôle", lines: s.checklists },
    { title: "Alertes météo", lines: s.alerts },
    { title: "En retard", lines: s.overdue },
    { title: "Points ouverts", lines: s.open },
  ].filter((p) => p.lines.length);
}

/** One line of figures: entries by type and messages. */
export function summaryHeadline(s: HandoverSummary): string {
  const total = s.entries.reduce((n, e) => n + e.count, 0);
  return `${total} entrée(s)${
    s.entries.length
      ? ` (${s.entries.map((e) => `${e.count} ${e.type.toLowerCase()}`).join(", ")})`
      : ""
  } · ${s.messages.received} message(s) reçu(s), ${s.messages.treated} traité(s), ${s.messages.waiting} en attente.`;
}

/** Plain text, for the handover entry, a copy or an e-mail. */
export function summaryText(s: HandoverSummary): string {
  const head = `Depuis ${time(iso(s.since))} (jusqu’à ${time(iso(s.at))}) : ${summaryHeadline(s)}`;
  const parts = summaryParts(s).map(
    (p) =>
      `${p.title} :\n${p.lines.map((l) => `– ${time(iso(l.at))} ${l.text}`).join("\n")}`,
  );
  return [head, ...parts].join("\n\n");
}

/** Tables for the A4 print. */
export function summaryTables(s: HandoverSummary): SummaryTable[] {
  return [
    {
      id: "figures",
      title: `Depuis ${time(iso(s.since))}`,
      caption: summaryHeadline(s),
      head: ["Type d’entrée", "Nombre"],
      body: s.entries.map((e) => [e.type, String(e.count)]),
      widths: [140, 42],
    },
    ...summaryParts(s).map((p, i) => ({
      id: `part-${i}`,
      title: p.title,
      caption: `${p.lines.length} élément(s)`,
      head: ["Heure", "Détail"],
      body: p.lines.map((l) => [time(iso(l.at)), l.text]),
      widths: [22, 160],
    })),
  ];
}
