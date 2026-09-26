import { dateTime, type Journal } from "../../shared/journal.ts";
import { debriefMetrics, minutesLabel } from "../../shared/debrief.ts";
import { isExercise, scenarioOf, tPlus } from "../../shared/exercise.ts";
import type { Block, Kpi, Table } from "./dossier.ts";
import { formatTime } from "../../shared/i18n/core.ts";
import { enumLabel } from "../../shared/i18n/enums.ts";
import { t, tn, type Key } from "./i18n.ts";

// Chapter « Exercice et débriefing » of the dossier (every format: PDF,
// Word, OpenDocument, spreadsheets…): scenario and reactions to the
// injects, deadlines, time to treat the messages, entries per hour, who did
// what, and the notes « points positifs / à améliorer ».

const hhmm = (ms: number | null) => (ms === null ? "" : formatTime(ms));
const table = (x: Table): Block => ({ kind: "table", table: x });
const cols = (...list: [Key, number?][]) =>
  list.map(([label, weight]) => ({ label: t(label), weight: weight ?? 1 }));
/** Indicator counting items: singular or plural label (French: 0 and 1). */
const count = (n: number, one: Key, other: Key, tone?: Kpi["tone"]): Kpi => ({
  label: tn(n, one, other),
  value: String(n),
  ...(tone ? { tone } : {}),
});

/**
 * `base` is the whole journal at the time shown (its history gives the
 * treatment times), `journal` the part exported (its notes).
 */
export function debriefChapter(
  base: Journal,
  journal: Journal,
  shownAt: number,
): { kpis: Kpi[]; blocks: Block[] } {
  const m = debriefMetrics(base, shownAt);
  const blocks: Block[] = [];
  const kpis: Kpi[] = [];
  const exercise = isExercise(base);
  const scenario = scenarioOf(base.ops);
  const start = scenario?.startAt ? Date.parse(scenario.startAt) : null;

  if (exercise && scenario) {
    blocks.push({
      kind: "text",
      title: t("Scénario : {title}", { title: scenario.title }),
      body: scenario.description || "—",
      meta: [
        scenario.startAt
          ? t("Début (T0) {date}", { date: dateTime(scenario.startAt) })
          : t("Pas encore commencé"),
        scenario.endedAt
          ? t("fin {date}", { date: dateTime(scenario.endedAt) })
          : "",
      ]
        .filter(Boolean)
        .join(" · "),
    });
    kpis.push(
      count(m.delivered, "inject joué", "injects joués"),
      count(
        m.lateInjects,
        "inject en retard",
        "injects en retard",
        m.lateInjects ? "crit" : undefined,
      ),
      {
        label: t("réaction médiane"),
        value: minutesLabel(m.medianReaction),
      },
    );
    if (m.injects.length)
      blocks.push(
        table({
          id: "debrief-injects",
          title: t("Injects et réactions"),
          sheet: t("Injects"),
          caption: t("{n} joués sur {total}", {
            n: m.delivered,
            total: m.injects.length,
          }),
          columns: cols(
            ["Prévu", 0.9],
            ["Inject", 2.4],
            ["Émetteur → destinataire", 1.8],
            ["Réaction attendue", 2.4],
            ["Joué", 0.7],
            ["Réaction", 1.6],
            ["État", 1],
          ),
          rows: m.injects.map((r) => [
            r.due === null
              ? ""
              : `${start !== null ? tPlus(r.due, start) : ""} ${hhmm(r.due)}`.trim(),
            r.inject.delivery === "read"
              ? t("{title} (lu par la direction)", { title: r.inject.title })
              : r.inject.title,
            `${r.inject.from || "—"} → ${r.inject.to || "—"} · ${enumLabel(r.inject.via)}`,
            r.inject.deadline
              ? t("{expected} (délai {n} min)", {
                  expected: r.inject.expected,
                  n: r.inject.deadline,
                })
              : r.inject.expected,
            r.inject.skipped ? t("non joué") : hhmm(r.delivered),
            r.reacted !== null
              ? `${hhmm(r.reacted)} · ${minutesLabel(r.minutes)} · ${r.how}`
              : "",
            r.delivered === null
              ? r.inject.skipped
                ? t("non joué")
                : t("à venir")
              : r.late
                ? t("en retard de {delay}", { delay: minutesLabel(r.delay) })
                : r.reacted !== null
                  ? t("à temps")
                  : t("sans réaction"),
          ]),
        }),
      );
  }

  kpis.push(
    count(
      m.overdue,
      "échéance dépassée",
      "échéances dépassées",
      m.overdue ? "warn" : undefined,
    ),
    { label: t("retard cumulé"), value: minutesLabel(m.totalDelay) },
    {
      label: t("traitement médian des messages"),
      value: minutesLabel(m.medianTreatment),
    },
  );
  const late = m.deadlines.filter((d) => d.delay > 0);
  if (m.deadlines.length)
    blocks.push(
      table({
        id: "debrief-deadlines",
        title: t("Échéances"),
        sheet: t("Échéances"),
        caption: tn(
          late.length,
          "{n} dépassée sur {total} · retard cumulé {delay}",
          "{n} dépassées sur {total} · retard cumulé {delay}",
          { total: m.deadlines.length, delay: minutesLabel(m.totalDelay) },
        ),
        columns: cols(
          ["N°", 0.5],
          ["Entrée", 3.2],
          ["Échéance", 1.2],
          ["Close", 1.2],
          ["Retard", 0.8],
        ),
        rows: m.deadlines.map((d) => [
          `#${String(d.number).padStart(3, "0")}`,
          d.label,
          dateTime(new Date(d.due).toISOString()),
          d.closed === null
            ? t("ouverte")
            : dateTime(new Date(d.closed).toISOString()),
          d.delay ? minutesLabel(d.delay) : t("à temps"),
        ]),
      }),
    );
  if (m.messages)
    blocks.push(
      table({
        id: "debrief-treatment",
        title: t("Temps de traitement des messages"),
        sheet: t("Traitement"),
        caption: t("{n} traités sur {total} · médiane {median}", {
          n: m.treated,
          total: m.messages,
          median: minutesLabel(m.medianTreatment),
        }),
        columns: cols(
          ["Délai entre réception et traitement", 3],
          ["Messages", 1],
        ),
        rows: m.treatment.map((b) => [b.label, String(b.count)]),
      }),
    );
  if (m.perHour.length)
    blocks.push(
      table({
        id: "debrief-hours",
        title: t("Entrées au journal par heure"),
        sheet: t("Par heure"),
        caption: t("{n} entrées", { n: base.entries.length }),
        columns: cols(["Heure (Zurich)", 2], ["Entrées", 1]),
        rows: m.perHour.map((h) => [
          t("{hour} h", { hour: h.hour }),
          String(h.count),
        ]),
      }),
    );
  if (m.people.length)
    blocks.push(
      table({
        id: "debrief-people",
        title: t("Qui a fait quoi"),
        sheet: t("Personnes"),
        caption: tn(m.people.length, "{n} personne", "{n} personnes"),
        columns: cols(
          ["Personne", 2.4],
          ["Entrées", 0.8],
          ["Corrections", 0.8],
          ["Messages", 0.8],
          ["Autres changements", 1],
        ),
        rows: m.people.map((p) => [
          p.name,
          String(p.entries),
          String(p.revisions),
          String(p.messages),
          String(p.changes - p.messages),
        ]),
      }),
    );
  const notes = [...journal.ops.retex].sort((a, b) => a.order - b.order);
  for (const kind of ["positif", "amélioration"] as const) {
    const list = notes.filter((n) => n.kind === kind);
    blocks.push({
      kind: "text",
      title:
        kind === "positif" ? t("Points positifs") : t("Points à améliorer"),
      body: list.length
        ? list
            .map(
              (n) =>
                `• ${n.topic ? t("{label} : {value}", { label: n.topic, value: "" }) : ""}${n.text}${n.owner ? ` (${t("suivi : {name}", { name: n.owner })})` : ""}`,
            )
            .join("\n")
        : "—",
      meta: tn(list.length, "{n} point", "{n} points"),
    });
  }
  return { kpis, blocks };
}

/** Items of the part, for the export centre count. */
export const debriefCount = (journal: Journal) =>
  journal.ops.retex.length +
  journal.ops.injects.length +
  journal.ops.scenarios.length;
