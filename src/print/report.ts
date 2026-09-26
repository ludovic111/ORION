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
  activeAssignment,
  batteryDue,
  radioSummary,
} from "../../shared/radio.ts";
import { journalAt } from "../../shared/history.ts";
import { talkgroupLabel, type SheetTable } from "./radio-sheet.ts";
import { enumLabel } from "../../shared/i18n/enums.ts";
import { checkLabel, t, tn } from "./i18n.ts";

export type ReportRange = { from: string; to: string; chronology: boolean };

const clip = (text: string, max = 280) =>
  text.length > max ? `${text.slice(0, max - 1)}…` : text;
const or = (value: string) => value.trim() || "—";

/** Rapport de situation over a period; open points are those at `range.to`. */
export function situationReport(
  journal: Journal,
  range: ReportRange,
): SheetTable[] {
  const from = Date.parse(range.from);
  const to = Date.parse(range.to);
  if (!(from <= to)) throw new Error(t("La période est invalide."));
  const inRange = (e: Entry) => {
    const at = Date.parse(current(e).happenedAt);
    return at >= from && at <= to;
  };
  const period = chronological(journal.entries.filter(inRange));
  // Open points, radios and terminals as they were at the end of the period
  // (reconstructed from the history), not as they are now.
  const atEnd = to >= Date.now() ? journal : journalAt(journal, to);
  const open = chronological(atEnd.entries.filter(needsFollowUp));
  const late = open.filter((e) => overdue(e, to));
  const radio = radioSummary(atEnd.radio);
  const checks = journal.radio.checks.filter((c) => {
    const at = Date.parse(c.at);
    return at >= from && at <= to;
  });
  const weak = checks.filter((c) => c.result === "1" || c.result === "0");
  const issued = atEnd.radio.terminals.filter(activeAssignment);
  const of = (...types: string[]) =>
    period.filter((e) => types.includes(current(e).type));
  const row = (e: Entry) => [dateTime(current(e).happenedAt), numberLabel(e)];
  const tables: SheetTable[] = [
    {
      id: "summary",
      title: t("Synthèse"),
      caption: `${dateTime(range.from)} → ${dateTime(range.to)}`,
      head: [t("Indicateur"), t("Valeur"), t("Indicateur"), t("Valeur")],
      widths: [55, 36, 55, 36],
      body: [
        [
          t("Entrées sur la période"),
          String(period.length),
          t("Points ouverts"),
          String(open.length),
        ],
        [
          t("Décisions et missions"),
          String(of("Décision", "Mission").length),
          t("Échéances dépassées"),
          String(late.length),
        ],
        [
          t("Demandes"),
          String(of("Demande").length),
          t("Radios en service"),
          `${radio.issued} / ${radio.terminals}`,
        ],
        [
          t("Entrées urgentes"),
          String(period.filter((e) => current(e).priority === "Urgent").length),
          t("Liaisons faibles ou nulles"),
          String(weak.length),
        ],
      ],
    },
    {
      id: "highlights",
      title: t("Faits marquants"),
      caption: t("Priorité importante ou urgente"),
      head: [t("Heure"), t("N°"), t("Nature"), t("Émetteur"), t("Message")],
      widths: [26, 14, 24, 30, 88],
      body: period
        .filter((e) => current(e).priority !== "Normal")
        .map((e) => [
          ...row(e),
          `${enumLabel(current(e).type)}\n${enumLabel(current(e).priority)}`,
          or(current(e).source),
          clip(current(e).message),
        ]),
    },
    {
      id: "decisions",
      title: t("Décisions et missions"),
      caption: t("{n} sur la période", {
        n: of("Décision", "Mission").length,
      }),
      head: [
        t("Heure"),
        t("N°"),
        t("Décision / mission"),
        t("Responsable"),
        t("Suivi"),
      ],
      widths: [26, 14, 92, 30, 20],
      body: of("Décision", "Mission").map((e) => [
        ...row(e),
        clip(
          [current(e).message, current(e).action].filter(Boolean).join("\n"),
        ),
        or(current(e).assignee),
        enumLabel(current(e).status),
      ]),
    },
    {
      id: "requests",
      title: t("Demandes"),
      caption: t("{n} sur la période", { n: of("Demande").length }),
      head: [
        t("Heure"),
        t("N°"),
        t("Demande"),
        t("Moyens / besoins"),
        t("Suivi"),
      ],
      widths: [26, 14, 72, 50, 20],
      body: of("Demande").map((e) => [
        ...row(e),
        clip(current(e).message),
        or(current(e).resources),
        enumLabel(current(e).status),
      ]),
    },
    {
      id: "open",
      title: t("Points ouverts"),
      caption: t("État à {at}", { at: dateTime(range.to) }),
      head: [
        t("N°"),
        t("Message / mesure"),
        t("Responsable"),
        t("Échéance"),
        t("Suivi"),
      ],
      widths: [14, 94, 30, 26, 18],
      body: open.map((e) => [
        numberLabel(e),
        clip(
          [current(e).message, current(e).action].filter(Boolean).join("\n"),
        ),
        or(current(e).assignee),
        current(e).dueAt
          ? `${dateTime(current(e).dueAt)}${overdue(e, to) ? `\n${t("DÉPASSÉE")}` : ""}`
          : "—",
        enumLabel(current(e).status),
      ]),
    },
    {
      id: "resources",
      title: t("Moyens engagés et besoins"),
      caption: t("Entrées renseignant des moyens"),
      head: [t("Heure"), t("N°"), t("Moyens / besoins"), t("Lieu")],
      widths: [26, 14, 100, 42],
      body: period
        .filter((e) => current(e).resources.trim())
        .map((e) => [...row(e), current(e).resources, or(current(e).location)]),
    },
    {
      id: "radio",
      title: t("État radio"),
      caption: t("{terminals} · {checks} sur la période", {
        terminals: tn(
          issued.length,
          "{n} terminal remis",
          "{n} terminaux remis",
        ),
        checks: tn(checks.length, "{n} contrôle", "{n} contrôles"),
      }),
      head: [
        t("Terminal"),
        t("Détenteur"),
        t("Nom d’appel"),
        t("Remis le"),
        t("Remarque"),
      ],
      widths: [20, 46, 40, 32, 44],
      body: [
        ...issued.map((term) => {
          const a = activeAssignment(term)!;
          return [
            term.label,
            a.holder,
            or(a.callsign),
            dateTime(a.issuedAt),
            batteryDue(term, to) ? t("Batterie à contrôler") : "—",
          ];
        }),
        ...weak.map((c) => [
          t("Liaison"),
          c.by,
          c.callsign,
          dateTime(c.at),
          `${checkLabel(c.result)} · ${talkgroupLabel(journal.radio, c.talkgroupId)}`,
        ]),
      ],
    },
  ];
  if (range.chronology)
    tables.push({
      id: "chronology",
      title: t("Chronologie"),
      caption: tn(period.length, "{n} entrée", "{n} entrées"),
      head: [t("Heure"), t("N°"), t("Nature"), t("Émetteur"), t("Message")],
      widths: [26, 14, 24, 30, 88],
      body: period.map((e) => [
        ...row(e),
        enumLabel(current(e).type),
        or(current(e).source),
        clip(current(e).message, 400),
      ]),
    });
  return tables;
}
