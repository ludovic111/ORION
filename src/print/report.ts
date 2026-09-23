import {
  chronological,
  current,
  dateTime,
  needsFollowUp,
  numberLabel,
  overdue,
  type Entry,
  type Journal,
} from "../../shared/journal.ts";
import {
  CHECK_LABELS,
  activeAssignment,
  batteryDue,
  radioSummary,
} from "../../shared/radio.ts";
import { talkgroupLabel, type SheetTable } from "./radio-sheet.ts";

export type ReportRange = { from: string; to: string; chronology: boolean };

const clip = (text: string, max = 280) =>
  text.length > max ? `${text.slice(0, max - 1)}…` : text;
const or = (value: string) => value.trim() || "—";
const plural = (n: number, one: string, many: string) =>
  `${n} ${n > 1 ? many : one}`;

/** Rapport de situation over a period; open points are those at `range.to`. */
export function situationReport(
  journal: Journal,
  range: ReportRange,
): SheetTable[] {
  const from = Date.parse(range.from);
  const to = Date.parse(range.to);
  if (!(from <= to)) throw new Error("La période est invalide.");
  const inRange = (e: Entry) => {
    const at = Date.parse(current(e).happenedAt);
    return at >= from && at <= to;
  };
  const period = chronological(journal.entries.filter(inRange));
  const open = chronological(journal.entries.filter(needsFollowUp));
  const late = open.filter((e) => overdue(e, to));
  const radio = radioSummary(journal.radio);
  const checks = journal.radio.checks.filter((c) => {
    const at = Date.parse(c.at);
    return at >= from && at <= to;
  });
  const weak = checks.filter((c) => c.result === "1" || c.result === "0");
  const issued = journal.radio.terminals.filter(activeAssignment);
  const of = (...types: string[]) =>
    period.filter((e) => types.includes(current(e).type));
  const row = (e: Entry) => [dateTime(current(e).happenedAt), numberLabel(e)];
  const tables: SheetTable[] = [
    {
      id: "summary",
      title: "Synthèse",
      caption: `${dateTime(range.from)} → ${dateTime(range.to)}`,
      head: ["Indicateur", "Valeur", "Indicateur", "Valeur"],
      widths: [55, 36, 55, 36],
      body: [
        [
          "Entrées sur la période",
          String(period.length),
          "Points ouverts",
          String(open.length),
        ],
        [
          "Décisions et missions",
          String(of("Décision", "Mission").length),
          "Échéances dépassées",
          String(late.length),
        ],
        [
          "Demandes",
          String(of("Demande").length),
          "Radios en service",
          `${radio.issued} / ${radio.terminals}`,
        ],
        [
          "Entrées urgentes",
          String(period.filter((e) => current(e).priority === "Urgent").length),
          "Liaisons faibles ou nulles",
          String(weak.length),
        ],
      ],
    },
    {
      id: "highlights",
      title: "Faits marquants",
      caption: "Priorité importante ou urgente",
      head: ["Heure", "N°", "Nature", "Émetteur", "Message"],
      widths: [26, 14, 24, 30, 88],
      body: period
        .filter((e) => current(e).priority !== "Normal")
        .map((e) => [
          ...row(e),
          `${current(e).type}\n${current(e).priority}`,
          or(current(e).source),
          clip(current(e).message),
        ]),
    },
    {
      id: "decisions",
      title: "Décisions et missions",
      caption: `${of("Décision", "Mission").length} sur la période`,
      head: ["Heure", "N°", "Décision / mission", "Responsable", "Suivi"],
      widths: [26, 14, 92, 30, 20],
      body: of("Décision", "Mission").map((e) => [
        ...row(e),
        clip(
          [current(e).message, current(e).action].filter(Boolean).join("\n"),
        ),
        or(current(e).assignee),
        current(e).status,
      ]),
    },
    {
      id: "requests",
      title: "Demandes",
      caption: `${of("Demande").length} sur la période`,
      head: ["Heure", "N°", "Demande", "Moyens / besoins", "Suivi"],
      widths: [26, 14, 72, 50, 20],
      body: of("Demande").map((e) => [
        ...row(e),
        clip(current(e).message),
        or(current(e).resources),
        current(e).status,
      ]),
    },
    {
      id: "open",
      title: "Points ouverts",
      caption: `État à ${dateTime(range.to)}`,
      head: ["N°", "Message / mesure", "Responsable", "Échéance", "Suivi"],
      widths: [14, 94, 30, 26, 18],
      body: open.map((e) => [
        numberLabel(e),
        clip(
          [current(e).message, current(e).action].filter(Boolean).join("\n"),
        ),
        or(current(e).assignee),
        current(e).dueAt
          ? `${dateTime(current(e).dueAt)}${overdue(e, to) ? "\nDÉPASSÉE" : ""}`
          : "—",
        current(e).status,
      ]),
    },
    {
      id: "resources",
      title: "Moyens engagés et besoins",
      caption: "Entrées renseignant des moyens",
      head: ["Heure", "N°", "Moyens / besoins", "Lieu"],
      widths: [26, 14, 100, 42],
      body: period
        .filter((e) => current(e).resources.trim())
        .map((e) => [...row(e), current(e).resources, or(current(e).location)]),
    },
    {
      id: "radio",
      title: "État radio",
      caption: `${plural(issued.length, "terminal remis", "terminaux remis")} · ${plural(checks.length, "contrôle", "contrôles")} sur la période`,
      head: ["Terminal", "Détenteur", "Nom d’appel", "Remis le", "Remarque"],
      widths: [20, 46, 40, 32, 44],
      body: [
        ...issued.map((t) => {
          const a = activeAssignment(t)!;
          return [
            t.label,
            a.holder,
            or(a.callsign),
            dateTime(a.issuedAt),
            batteryDue(t, to) ? "Batterie à contrôler" : "—",
          ];
        }),
        ...weak.map((c) => [
          "Liaison",
          c.by,
          c.callsign,
          dateTime(c.at),
          `${CHECK_LABELS[c.result]} · ${talkgroupLabel(journal.radio, c.talkgroupId)}`,
        ]),
      ],
    },
  ];
  if (range.chronology)
    tables.push({
      id: "chronology",
      title: "Chronologie",
      caption: plural(period.length, "entrée", "entrées"),
      head: ["Heure", "N°", "Nature", "Émetteur", "Message"],
      widths: [26, 14, 24, 30, 88],
      body: period.map((e) => [
        ...row(e),
        current(e).type,
        or(current(e).source),
        clip(current(e).message, 400),
      ]),
    });
  return tables;
}
