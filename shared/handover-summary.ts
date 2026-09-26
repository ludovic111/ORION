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
import { getLang } from "./i18n/core.ts";
import { enumLabel } from "./i18n/enums.ts";
import { t, tn } from "./i18n/handover-summary.ts";

// "Que s'est-il passé depuis HH:MM ?" — the summary of a handover,
// computed from the journal and its history only (deterministic, no AI):
// new entries by type, decisions, messages received and treated, missions
// opened and closed, changes of resources, requests, checklists, alerts,
// what is late and what stays open. The texts are in the language of the
// post; the figures (types, states) keep the stored French values.

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
/** A fixed value inside a sentence: lower case, except German nouns. */
const lower = (value: string) => {
  const label = enumLabel(value);
  return getLang() === "de" ? label : label.toLowerCase();
};
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
    .filter((ms) => ms < at);
  const opened = Date.parse(journal.createdAt);
  return last.length ? Math.max(...last) : Math.max(opened, at - 8 * 3_600_000);
}

export function handoverSummary(
  journal: Journal,
  since: number,
  at = Date.now(),
): HandoverSummary {
  const inRange = (ms: number) => ms >= since && ms <= at;
  const created = journal.entries.filter((e) =>
    inRange(Date.parse(e.createdAt)),
  );
  const counts = new Map<string, number>();
  for (const e of created) {
    const type = current(e).type;
    counts.set(type, (counts.get(type) ?? 0) + 1);
  }
  const byTime = (a: Line, b: Line) => a.at - b.at;

  // Missions: opened (created open, or reopened) and closed in the period,
  // from the versions of the entries.
  const opened: Line[] = [];
  const closed: Line[] = [];
  for (const e of journal.entries) {
    let previous: Fields | null = null;
    for (const r of e.revisions) {
      const when = Date.parse(r.at);
      const was = previous?.status ?? "";
      const now = r.fields.status;
      if (inRange(when)) {
        if (OPEN.includes(now) && !OPEN.includes(was))
          opened.push(
            entryLine(
              e,
              when,
              r.fields.assignee ? ` · ${r.fields.assignee}` : "",
            ),
          );
        if (CLOSED.includes(now) && OPEN.includes(was))
          closed.push(entryLine(e, when, ` · ${lower(now)}`));
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
    const when = Date.parse(item.at);
    if (item.scope === "ops.messages") {
      const done = ["Transmis", "Classé"];
      if (
        item.action !== "remove" &&
        done.includes(String(after.status)) &&
        !done.includes(String(before.status ?? ""))
      )
        treated++;
    } else if (item.scope === "ops.resources") {
      const name = String(after.name ?? before.name ?? t("Moyen"));
      if (item.action === "create")
        resources.push({
          ref: `resource:${item.target}`,
          text: t("{name} : ajouté ({status})", {
            name,
            status: enumLabel(String(after.status ?? "")),
          }),
          at: when,
        });
      else if (item.action === "remove")
        resources.push({
          ref: "",
          text: t("{name} : retiré", { name }),
          at: when,
        });
      else if (before.status && before.status !== after.status)
        resources.push({
          ref: `resource:${item.target}`,
          text: t("{name} : {before} → {after}", {
            name,
            before: enumLabel(String(before.status)),
            after: enumLabel(String(after.status)),
          }),
          at: when,
        });
    } else if (item.scope === "ops.requests") {
      if (item.action === "remove") continue;
      if (item.action === "create" || before.status !== after.status)
        requests.push({
          ref: `request:${item.target}`,
          text: t("{label} : {status}", {
            label: requestLabel({
              quantity: Number(after.quantity ?? 0),
              unit: String(after.unit ?? ""),
              title: String(after.title ?? t("Demande")),
            }),
            status: lower(String(after.status ?? "")),
          }),
          at: when,
        });
    } else if (item.scope === "ops.checklistTicks") {
      if (item.action === "remove" || !after.done || before.done) continue;
      const list = titles.get(String(after.checklistId));
      const step = list?.steps.find((s) => s.id === after.stepId);
      checklists.push({
        ref: list ? `checklist:${list.id}` : "",
        text: t("{list} : {step} ({who})", {
          list: list?.title ?? t("Liste"),
          step: clip(step?.text ?? t("étape"), 80),
          who: String(after.who ?? item.by),
        }),
        at: when,
      });
    } else if (item.scope === "ops.alerts" && item.action === "create")
      alerts.push({
        ref: `alert:${item.target}`,
        text: t("{hazard} · degré {level}", {
          hazard: String(after.hazard ?? t("Alerte")),
          level: String(after.level ?? ""),
        }),
        at: when,
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
      `${f.assignee ? ` · ${f.assignee}` : ""}${f.dueAt ? t(" · échéance {time}", { time: time(f.dueAt) }) : ""}`,
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
        entryLine(e, Date.parse(e.createdAt), ` · ${lower(current(e).type)}`),
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
    { title: t("Décisions"), lines: s.decisions },
    { title: t("Missions ouvertes"), lines: s.missions.opened },
    { title: t("Missions closes"), lines: s.missions.closed },
    { title: t("Moyens"), lines: s.resources },
    { title: t("Demandes de moyens"), lines: s.requests },
    { title: t("Listes de contrôle"), lines: s.checklists },
    { title: t("Alertes météo"), lines: s.alerts },
    { title: t("En retard"), lines: s.overdue },
    { title: t("Points ouverts"), lines: s.open },
  ].filter((p) => p.lines.length);
}

/** One line of figures: entries by type and messages. */
export function summaryHeadline(s: HandoverSummary): string {
  const total = s.entries.reduce((n, e) => n + e.count, 0);
  const { received, treated, waiting } = s.messages;
  return `${tn(total, "{n} entrée(s) (1)", "{n} entrée(s)")}${
    s.entries.length
      ? ` (${s.entries.map((e) => `${e.count} ${lower(e.type)}`).join(", ")})`
      : ""
  } · ${tn(received, "{n} message(s) reçu(s) (1)", "{n} message(s) reçu(s)")}, ${tn(
    treated,
    "{n} traité(s) (1)",
    "{n} traité(s)",
  )}, ${t("{n} en attente", { n: waiting })}.`;
}

/** Plain text, for the handover entry, a copy or an e-mail. */
export function summaryText(s: HandoverSummary): string {
  const head = t("Depuis {since} (jusqu’à {at}) : {headline}", {
    since: time(iso(s.since)),
    at: time(iso(s.at)),
    headline: summaryHeadline(s),
  });
  const parts = summaryParts(s).map(
    (p) =>
      `${t("{title} :", { title: p.title })}\n${p.lines.map((l) => `– ${time(iso(l.at))} ${l.text}`).join("\n")}`,
  );
  return [head, ...parts].join("\n\n");
}

/** Tables for the A4 print. */
export function summaryTables(s: HandoverSummary): SummaryTable[] {
  return [
    {
      id: "figures",
      title: t("Depuis {time}", { time: time(iso(s.since)) }),
      caption: summaryHeadline(s),
      head: [t("Type d’entrée"), t("Nombre")],
      body: s.entries.map((e) => [enumLabel(e.type), String(e.count)]),
      widths: [140, 42],
    },
    ...summaryParts(s).map((p, i) => ({
      id: `part-${i}`,
      title: p.title,
      caption: tn(p.lines.length, "{n} élément(s) (1)", "{n} élément(s)"),
      head: [t("Heure"), t("Détail")],
      body: p.lines.map((l) => [time(iso(l.at)), l.text]),
      widths: [22, 160],
    })),
  ];
}
