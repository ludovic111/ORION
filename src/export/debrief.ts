import { dateTime, type Journal } from "../../shared/journal.ts";
import { debriefMetrics, minutesLabel } from "../../shared/debrief.ts";
import { isExercise, scenarioOf, tPlus } from "../../shared/exercise.ts";
import type { Block, Kpi, Table } from "./dossier.ts";

// Chapter « Exercice et débriefing » of the dossier (every format: PDF,
// Word, OpenDocument, spreadsheets…): scenario and reactions to the
// injects, deadlines, time to treat the messages, entries per hour, who did
// what, and the notes « points positifs / à améliorer ».

const hhmm = (ms: number | null) =>
  ms === null
    ? ""
    : new Date(ms).toLocaleTimeString("fr-CH", {
        timeZone: "Europe/Zurich",
        hour: "2-digit",
        minute: "2-digit",
      });
const table = (t: Table): Block => ({ kind: "table", table: t });
const cols = (...list: [string, number?][]) =>
  list.map(([label, weight]) => ({ label, weight: weight ?? 1 }));

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
      title: `Scénario : ${scenario.title}`,
      body: scenario.description || "—",
      meta: [
        scenario.startAt
          ? `Début (T0) ${dateTime(scenario.startAt)}`
          : "Pas encore commencé",
        scenario.endedAt ? `fin ${dateTime(scenario.endedAt)}` : "",
      ]
        .filter(Boolean)
        .join(" · "),
    });
    kpis.push(
      { label: "injects joués", value: String(m.delivered) },
      {
        label: "injects en retard",
        value: String(m.lateInjects),
        tone: m.lateInjects ? "crit" : undefined,
      },
      { label: "réaction médiane", value: minutesLabel(m.medianReaction) },
    );
    if (m.injects.length)
      blocks.push(
        table({
          id: "debrief-injects",
          title: "Injects et réactions",
          sheet: "Injects",
          caption: `${m.delivered} joués sur ${m.injects.length}`,
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
            `${r.inject.title}${r.inject.delivery === "read" ? " (lu par la direction)" : ""}`,
            `${r.inject.from || "—"} → ${r.inject.to || "—"} · ${r.inject.via}`,
            `${r.inject.expected}${r.inject.deadline ? ` (délai ${r.inject.deadline} min)` : ""}`,
            r.inject.skipped ? "non joué" : hhmm(r.delivered),
            r.reacted !== null
              ? `${hhmm(r.reacted)} · ${minutesLabel(r.minutes)} · ${r.how}`
              : "",
            r.delivered === null
              ? r.inject.skipped
                ? "non joué"
                : "à venir"
              : r.late
                ? `en retard de ${minutesLabel(r.delay)}`
                : r.reacted !== null
                  ? "à temps"
                  : "sans réaction",
          ]),
        }),
      );
  }

  kpis.push(
    {
      label: "échéances dépassées",
      value: String(m.overdue),
      tone: m.overdue ? "warn" : undefined,
    },
    { label: "retard cumulé", value: minutesLabel(m.totalDelay) },
    {
      label: "traitement médian des messages",
      value: minutesLabel(m.medianTreatment),
    },
  );
  const late = m.deadlines.filter((d) => d.delay > 0);
  if (m.deadlines.length)
    blocks.push(
      table({
        id: "debrief-deadlines",
        title: "Échéances",
        sheet: "Échéances",
        caption: `${late.length} dépassée${late.length > 1 ? "s" : ""} sur ${m.deadlines.length} · retard cumulé ${minutesLabel(m.totalDelay)}`,
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
            ? "ouverte"
            : dateTime(new Date(d.closed).toISOString()),
          d.delay ? minutesLabel(d.delay) : "à temps",
        ]),
      }),
    );
  if (m.messages)
    blocks.push(
      table({
        id: "debrief-treatment",
        title: "Temps de traitement des messages",
        sheet: "Traitement",
        caption: `${m.treated} traités sur ${m.messages} · médiane ${minutesLabel(m.medianTreatment)}`,
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
        title: "Entrées au journal par heure",
        sheet: "Par heure",
        caption: `${base.entries.length} entrées`,
        columns: cols(["Heure (Zurich)", 2], ["Entrées", 1]),
        rows: m.perHour.map((h) => [`${h.hour} h`, String(h.count)]),
      }),
    );
  if (m.people.length)
    blocks.push(
      table({
        id: "debrief-people",
        title: "Qui a fait quoi",
        sheet: "Personnes",
        caption: `${m.people.length} personne${m.people.length > 1 ? "s" : ""}`,
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
      title: kind === "positif" ? "Points positifs" : "Points à améliorer",
      body: list.length
        ? list
            .map(
              (n) =>
                `• ${n.topic ? `${n.topic} : ` : ""}${n.text}${n.owner ? ` (suivi : ${n.owner})` : ""}`,
            )
            .join("\n")
        : "—",
      meta: `${list.length} point${list.length > 1 ? "s" : ""}`,
    });
  }
  return { kpis, blocks };
}

/** Items of the part, for the export centre count. */
export const debriefCount = (journal: Journal) =>
  journal.ops.retex.length +
  journal.ops.injects.length +
  journal.ops.scenarios.length;
