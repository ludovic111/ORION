import {
  current,
  needsFollowUp,
  numberLabel,
  overdue,
  time,
  type Journal,
} from "./journal.ts";
import type { ForecastData } from "./ops.ts";
import { openChecklists, progress } from "./checklists.ts";
import { lateMinutes, openRequests, requestLabel } from "./requests.ts";
import { dutyBoard, formatDuration } from "./presence.ts";
import { latestForecast } from "./thresholds.ts";
import { isReport } from "./reminders.ts";

// Point de situation prepared before a rapport de conduite: a draft built
// from what the journal already knows (key facts, resources, open
// missions, checklists, requests, weather, what happened since the last
// report). Deterministic, no AI: the operator reads, corrects and completes
// it, then prints it or records it.

export type PointSection = { id: string; title: string; text: string };
export type SituationPoint = {
  title: string;
  at: number;
  since: number;
  sections: PointSection[];
};

const HOUR = 3_600_000;
const iso = (ms: number) => new Date(ms).toISOString();
const firstLine = (s: string) =>
  (s.split("\n").find((l) => l.trim()) ?? "").trim();
const clip = (s: string, n = 110) =>
  s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s;
const list = (lines: string[], empty = "—") =>
  lines.length ? lines.map((l) => `– ${l}`).join("\n") : empty;

/**
 * Start of the period covered: the last report held (or passed) before
 * `at`, else the opening of the journal.
 */
export function lastReportTime(
  journal: Pick<Journal, "ops" | "createdAt">,
  at: number,
  exclude = "",
): number {
  const past = journal.ops.agenda
    .filter((a) => a.id !== exclude && isReport(a) && Date.parse(a.at) < at)
    .map((a) => Date.parse(a.at));
  const opened = Date.parse(journal.createdAt);
  return past.length ? Math.max(...past) : opened;
}

/** Weather in the next hours: temperatures, rain, gusts. */
export function forecastOutlook(
  data: ForecastData,
  from: number,
  hours = 12,
): string {
  const next = data.hours.filter(
    (h) => h.at >= from - HOUR && h.at < from + hours * HOUR,
  );
  if (!next.length) return "";
  const nums = (pick: (h: (typeof next)[number]) => number | null) =>
    next.map(pick).filter((v): v is number => v !== null);
  const temps = nums((h) => h.temperature);
  const rain = nums((h) => h.precipitation).reduce((n, v) => n + v, 0);
  const gusts = nums((h) => h.gusts);
  const parts = [
    temps.length &&
      `${Math.round(Math.min(...temps))} à ${Math.round(Math.max(...temps))} °C`,
    `pluie ${Math.round(rain * 10) / 10} mm`,
    gusts.length && `rafales jusqu’à ${Math.round(Math.max(...gusts))} km/h`,
  ].filter(Boolean);
  return `Prochaines ${hours} h : ${parts.join(", ")}.`;
}

/** The draft of the point de situation at `at`, covering since `since`. */
export function composeSituationPoint(
  journal: Journal,
  {
    at = Date.now(),
    since,
    title,
  }: { at?: number; since?: number; title?: string } = {},
): SituationPoint {
  const from = since ?? lastReportTime(journal, at);
  const o = journal.ops;
  const sections: PointSection[] = [];
  const add = (id: string, t: string, text: string) =>
    sections.push({ id, title: t, text });

  // Situation générale: the board of that name, then the key facts.
  const general = o.boards.find((b) =>
    /situation g[ée]n[ée]rale/i.test(b.title),
  );
  add("general", "Situation générale", general?.body.trim() || "—");
  const facts = [...o.facts]
    .filter((f) => f.value.trim())
    .sort((a, b) => a.order - b.order)
    .map((f) => `${f.label} : ${f.value}${f.unit ? ` ${f.unit}` : ""}`);
  add("facts", "Renseignements clés", list(facts));

  // Since the last report.
  const recent = journal.entries.filter(
    (e) => Date.parse(e.createdAt) >= from && Date.parse(e.createdAt) <= at,
  );
  const decisions = recent
    .filter((e) => current(e).type === "Décision")
    .map((e) => `${numberLabel(e)} ${clip(firstLine(current(e).message))}`);
  const byType = new Map<string, number>();
  for (const e of recent) {
    const t = current(e).type;
    byType.set(t, (byType.get(t) ?? 0) + 1);
  }
  const messages = o.messages.filter(
    (m) => Date.parse(m.receivedAt) >= from && Date.parse(m.receivedAt) <= at,
  ).length;
  add(
    "since",
    `Depuis ${time(iso(from))}`,
    [
      `${recent.length} entrée(s) au journal${
        byType.size
          ? ` (${[...byType].map(([t, n]) => `${n} ${t.toLowerCase()}`).join(", ")})`
          : ""
      }, ${messages} message(s) reçu(s).`,
      decisions.length ? `Décisions :\n${list(decisions)}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
  );

  // Resources.
  const engaged = o.resources.filter((r) => r.status === "Engagé");
  const moving = o.resources.filter(
    (r) => r.status === "En route" || r.status === "Alerté",
  );
  const out = o.resources.filter((r) => r.status === "Hors service");
  const people = engaged
    .filter((r) => /personn|équipe|section|groupe/i.test(`${r.kind} ${r.name}`))
    .reduce((n, r) => n + r.count, 0);
  add(
    "resources",
    "Moyens engagés",
    [
      `${engaged.length} engagé(s)${people ? `, dont ${people} personne(s)` : ""} · ${moving.length} alerté(s) ou en route · ${o.resources.filter((r) => r.status === "Disponible").length} disponible(s)${out.length ? ` · ${out.length} hors service` : ""}.`,
      list(
        [
          ...engaged.map(
            (r) =>
              `${r.name}${r.count > 1 ? ` (${r.count})` : ""}${r.location ? ` · ${r.location}` : ""}${r.mission ? ` · ${clip(r.mission, 70)}` : ""}`,
          ),
          ...moving.map(
            (r) =>
              `${r.name} · ${r.status.toLowerCase()}${r.eta ? `, arrivée ${time(r.eta)}` : ""}`,
          ),
        ],
        "",
      ),
    ]
      .filter(Boolean)
      .join("\n"),
  );

  // Open missions, overdue first.
  const open = journal.entries
    .filter(needsFollowUp)
    .sort(
      (a, b) =>
        Number(overdue(b, at)) - Number(overdue(a, at)) ||
        (current(a).dueAt || "9").localeCompare(current(b).dueAt || "9"),
    );
  const late = open.filter((e) => overdue(e, at)).length;
  add(
    "missions",
    "Missions et points ouverts",
    [
      `${open.length} ouvert(s), dont ${late} en retard.`,
      list(
        open.slice(0, 15).map((e) => {
          const f = current(e);
          return `${numberLabel(e)} ${clip(firstLine(f.message), 80)}${f.assignee ? ` · ${f.assignee}` : ""}${f.dueAt ? ` · échéance ${time(f.dueAt)}${overdue(e, at) ? " (en retard)" : ""}` : ""}`;
        }),
        "",
      ),
      open.length > 15 ? `… et ${open.length - 15} autre(s).` : "",
    ]
      .filter(Boolean)
      .join("\n"),
  );

  // Checklists.
  const lists = openChecklists(o).map((c) => {
    const p = progress(journal, c, at);
    return `${c.title} : ${p.done}/${p.total} étapes${p.late ? `, ${p.late} contrôle(s) en retard` : ""}${p.next ? ` · prochaine : ${clip(p.next.text, 70)}` : " · terminée"}`;
  });
  add(
    "checklists",
    "Listes de contrôle",
    list(lists, "Aucune liste en cours."),
  );

  // Requests for resources.
  const requests = openRequests(o).map((r) => {
    const late = lateMinutes(r, at);
    return `${requestLabel(r)}${r.provider ? ` (${r.provider})` : ""} · ${r.status.toLowerCase()}${r.eta ? `, arrivée ${time(r.eta)}` : ""}${late ? ` · retard ${formatDuration(late * 60_000)}` : ""}`;
  });
  add(
    "requests",
    "Demandes de moyens en cours",
    list(requests, "Aucune demande en attente."),
  );

  // Weather.
  const forecast = latestForecast(o);
  const alerts = o.alerts.filter((a) => !a.to || Date.parse(a.to) >= at);
  const newAlerts = o.alerts.filter(
    (a) => Date.parse(a.createdAt) >= from && Date.parse(a.createdAt) <= at,
  );
  add(
    "weather",
    "Météo",
    [
      forecast
        ? `${forecastOutlook(forecast.data, at)} (prévision ${forecast.data.model}, reçue à ${time(forecast.fetchedAt)})`
        : "Aucune prévision reçue.",
      alerts.length
        ? `Alertes en vigueur ou à venir :\n${list(alerts.map((a) => `${a.hazard} · degré ${a.level}${a.region ? ` · ${a.region}` : ""}`))}`
        : "Aucune alerte en vigueur.",
      newAlerts.length
        ? `${newAlerts.length} nouvelle(s) alerte(s) depuis ${time(iso(from))}.`
        : "",
    ]
      .filter(Boolean)
      .join("\n"),
  );

  // Team.
  const duty = dutyBoard(o, at);
  const present = duty.filter((d) => d.present).length;
  const warnings = duty.flatMap((d) =>
    d.warnings.map((w) => `${d.name} : ${w}`),
  );
  if (o.presences.length || o.members.length)
    add(
      "team",
      "Personnel",
      [
        o.presences.length
          ? `${present} personne(s) présente(s) au PC.`
          : `${o.members.filter((m) => m.status === "Présent").length} personne(s) présente(s).`,
        warnings.length ? `À relever :\n${list(warnings)}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
    );

  // Next meeting and what the operator adds.
  const next = o.agenda
    .filter((a) => !a.done && Date.parse(a.at) > at)
    .sort((a, b) => a.at.localeCompare(b.at))[0];
  add("needs", "Besoins et décisions à prendre", "—");
  add(
    "next",
    "Prochain point",
    next
      ? `${next.title} à ${time(next.at)}${next.location ? ` · ${next.location}` : ""}`
      : "—",
  );
  return {
    title: title ?? `Point de situation de ${time(iso(at))}`,
    at,
    since: from,
    sections,
  };
}

/** Plain text of a point (journal entry, board, copy). */
export const pointText = (p: Pick<SituationPoint, "title" | "sections">) =>
  [p.title, ...p.sections.map((s) => `${s.title}\n${s.text}`)].join("\n\n");
