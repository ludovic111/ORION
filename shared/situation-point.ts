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
import { getLang } from "./i18n/core.ts";
import { enumLabel } from "./i18n/enums.ts";
import { t, tn } from "./i18n/situation-point.ts";

// Point de situation prepared before a rapport de conduite: a draft built
// from what the journal already knows (key facts, resources, open
// missions, checklists, requests, weather, what happened since the last
// report). Deterministic, no AI: the operator reads, corrects and completes
// it, then prints it or records it. Written in the language of the post.

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
/** A fixed value inside a sentence: lower case, except German nouns. */
const lower = (value: string) => {
  const label = enumLabel(value);
  return getLang() === "de" ? label : label.toLowerCase();
};
/** Board holding the general situation, in any language of the seeds. */
const GENERAL = /situation g[ée]n[ée]rale|allgemeine lage|situazione generale/i;

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
      t("{min} à {max} °C", {
        min: Math.round(Math.min(...temps)),
        max: Math.round(Math.max(...temps)),
      }),
    t("pluie {mm} mm", { mm: Math.round(rain * 10) / 10 }),
    gusts.length &&
      t("rafales jusqu’à {kmh} km/h", {
        kmh: Math.round(Math.max(...gusts)),
      }),
  ].filter(Boolean);
  return t("Prochaines {hours} h : {parts}.", {
    hours,
    parts: parts.join(", "),
  });
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
  const add = (id: string, heading: string, text: string) =>
    sections.push({ id, title: heading, text });

  // Situation générale: the board of that name, then the key facts.
  const general = o.boards.find((b) => GENERAL.test(b.title));
  add("general", t("Situation générale"), general?.body.trim() || "—");
  const facts = [...o.facts]
    .filter((f) => f.value.trim())
    .sort((a, b) => a.order - b.order)
    .map((f) =>
      t("{label} : {value}", {
        label: f.label,
        value: `${f.value}${f.unit ? ` ${f.unit}` : ""}`,
      }),
    );
  add("facts", t("Renseignements clés"), list(facts));

  // Since the last report.
  const recent = journal.entries.filter(
    (e) => Date.parse(e.createdAt) >= from && Date.parse(e.createdAt) <= at,
  );
  const decisions = recent
    .filter((e) => current(e).type === "Décision")
    .map((e) => `${numberLabel(e)} ${clip(firstLine(current(e).message))}`);
  const byType = new Map<string, number>();
  for (const e of recent) {
    const type = current(e).type;
    byType.set(type, (byType.get(type) ?? 0) + 1);
  }
  const messages = o.messages.filter(
    (m) => Date.parse(m.receivedAt) >= from && Date.parse(m.receivedAt) <= at,
  ).length;
  add(
    "since",
    t("Depuis {time}", { time: time(iso(from)) }),
    [
      `${tn(
        recent.length,
        "{n} entrée(s) au journal (1)",
        "{n} entrée(s) au journal",
      )}${
        byType.size
          ? ` (${[...byType].map(([type, n]) => `${n} ${lower(type)}`).join(", ")})`
          : ""
      }, ${tn(messages, "{n} message(s) reçu(s) (1)", "{n} message(s) reçu(s)")}.`,
      decisions.length ? `${t("Décisions :")}\n${list(decisions)}` : "",
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
  const available = o.resources.filter((r) => r.status === "Disponible");
  const people = engaged
    .filter((r) => /personn|équipe|section|groupe/i.test(`${r.kind} ${r.name}`))
    .reduce((n, r) => n + r.count, 0);
  add(
    "resources",
    t("Moyens engagés"),
    [
      `${tn(engaged.length, "{n} engagé(s) (1)", "{n} engagé(s)")}${
        people
          ? tn(people, ", dont {n} personne(s) (1)", ", dont {n} personne(s)")
          : ""
      } · ${tn(
        moving.length,
        "{n} alerté(s) ou en route (1)",
        "{n} alerté(s) ou en route",
      )} · ${tn(
        available.length,
        "{n} disponible(s) (1)",
        "{n} disponible(s)",
      )}${out.length ? ` · ${t("{n} hors service", { n: out.length })}` : ""}.`,
      list(
        [
          ...engaged.map(
            (r) =>
              `${r.name}${r.count > 1 ? ` (${r.count})` : ""}${r.location ? ` · ${r.location}` : ""}${r.mission ? ` · ${clip(r.mission, 70)}` : ""}`,
          ),
          ...moving.map(
            (r) =>
              `${r.name} · ${lower(r.status)}${r.eta ? t(", arrivée {time}", { time: time(r.eta) }) : ""}`,
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
    t("Missions et points ouverts"),
    [
      tn(
        open.length,
        "{n} ouvert(s), dont {late} en retard. (1)",
        "{n} ouvert(s), dont {late} en retard.",
        { late },
      ),
      list(
        open.slice(0, 15).map((e) => {
          const f = current(e);
          return `${numberLabel(e)} ${clip(firstLine(f.message), 80)}${f.assignee ? ` · ${f.assignee}` : ""}${f.dueAt ? `${t(" · échéance {time}", { time: time(f.dueAt) })}${overdue(e, at) ? t(" (en retard)") : ""}` : ""}`;
        }),
        "",
      ),
      open.length > 15
        ? tn(open.length - 15, "… et {n} autre(s). (1)", "… et {n} autre(s).")
        : "",
    ]
      .filter(Boolean)
      .join("\n"),
  );

  // Checklists.
  const lists = openChecklists(o).map((c) => {
    const p = progress(journal, c, at);
    return `${t("{title} : {done}/{total} étapes", {
      title: c.title,
      done: p.done,
      total: p.total,
    })}${
      p.late
        ? tn(
            p.late,
            ", {n} contrôle(s) en retard (1)",
            ", {n} contrôle(s) en retard",
          )
        : ""
    }${p.next ? t(" · prochaine : {step}", { step: clip(p.next.text, 70) }) : t(" · terminée")}`;
  });
  add(
    "checklists",
    t("Listes de contrôle"),
    list(lists, t("Aucune liste en cours.")),
  );

  // Requests for resources.
  const requests = openRequests(o).map((r) => {
    const minutes = lateMinutes(r, at);
    return `${requestLabel(r)}${r.provider ? ` (${r.provider})` : ""} · ${lower(r.status)}${r.eta ? t(", arrivée {time}", { time: time(r.eta) }) : ""}${minutes ? t(" · retard {duration}", { duration: formatDuration(minutes * 60_000) }) : ""}`;
  });
  add(
    "requests",
    t("Demandes de moyens en cours"),
    list(requests, t("Aucune demande en attente.")),
  );

  // Weather.
  const forecast = latestForecast(o);
  const alerts = o.alerts.filter((a) => !a.to || Date.parse(a.to) >= at);
  const newAlerts = o.alerts.filter(
    (a) => Date.parse(a.createdAt) >= from && Date.parse(a.createdAt) <= at,
  );
  add(
    "weather",
    t("Météo"),
    [
      forecast
        ? t("{outlook} (prévision {model}, reçue à {time})", {
            outlook: forecastOutlook(forecast.data, at),
            model: forecast.data.model,
            time: time(forecast.fetchedAt),
          })
        : t("Aucune prévision reçue."),
      alerts.length
        ? `${t("Alertes en vigueur ou à venir :")}\n${list(
            alerts.map(
              (a) =>
                `${t("{hazard} · degré {level}", { hazard: a.hazard, level: a.level })}${a.region ? ` · ${a.region}` : ""}`,
            ),
          )}`
        : t("Aucune alerte en vigueur."),
      newAlerts.length
        ? tn(
            newAlerts.length,
            "{n} nouvelle(s) alerte(s) depuis {time}. (1)",
            "{n} nouvelle(s) alerte(s) depuis {time}.",
            { time: time(iso(from)) },
          )
        : "",
    ]
      .filter(Boolean)
      .join("\n"),
  );

  // Team.
  const duty = dutyBoard(o, at);
  const present = duty.filter((d) => d.present).length;
  const warnings = duty.flatMap((d) =>
    d.warnings.map((w) => t("{name} : {text}", { name: d.name, text: w })),
  );
  if (o.presences.length || o.members.length) {
    const members = o.members.filter((m) => m.status === "Présent").length;
    add(
      "team",
      t("Personnel"),
      [
        o.presences.length
          ? tn(
              present,
              "{n} personne(s) présente(s) au PC. (1)",
              "{n} personne(s) présente(s) au PC.",
            )
          : tn(
              members,
              "{n} personne(s) présente(s). (1)",
              "{n} personne(s) présente(s).",
            ),
        warnings.length ? `${t("À relever :")}\n${list(warnings)}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
    );
  }

  // Next meeting and what the operator adds.
  const next = o.agenda
    .filter((a) => !a.done && Date.parse(a.at) > at)
    .sort((a, b) => a.at.localeCompare(b.at))[0];
  add("needs", t("Besoins et décisions à prendre"), "—");
  add(
    "next",
    t("Prochain point"),
    next
      ? `${t("{title} à {time}", { title: next.title, time: time(next.at) })}${next.location ? ` · ${next.location}` : ""}`
      : "—",
  );
  return {
    title: title ?? t("Point de situation de {time}", { time: time(iso(at)) }),
    at,
    since: from,
    sections,
  };
}

/** Plain text of a point (journal entry, board, copy). */
export const pointText = (p: Pick<SituationPoint, "title" | "sections">) =>
  [p.title, ...p.sections.map((s) => `${s.title}\n${s.text}`)].join("\n\n");
