import { dateTime } from "../../shared/journal.ts";
import {
  activeAssignment,
  stationStatus,
  terminalState,
  type Radio,
} from "../../shared/radio.ts";
import { enumLabel } from "../../shared/i18n/enums.ts";
import { accessoriesLabel, checkLabel, t, terminalStateLabel } from "./i18n.ts";

export type SheetTable = {
  id: string;
  title: string;
  caption: string;
  head: string[];
  body: string[][];
  /** Column widths in mm (landscape A4: 269 mm usable, portrait: 182 mm). */
  widths?: number[];
};

const or = (value: string) => value.trim() || "—";

export function talkgroupLabel(radio: Radio, id: string) {
  const group = radio.talkgroups.find((g) => g.id === id);
  if (!group) return "—";
  return group.number ? `${group.number} · ${group.name}` : group.name;
}

export function radioTables(radio: Radio): SheetTable[] {
  const history = radio.terminals
    .flatMap((term) => term.assignments.map((a) => ({ term, a })))
    .sort((x, y) => Date.parse(x.a.issuedAt) - Date.parse(y.a.issuedAt));
  return [
    {
      id: "plan",
      title: t("Plan du réseau radio"),
      caption: t("{n} noms d’appel", { n: radio.stations.length }),
      head: [
        t("Nom d’appel"),
        t("Fonction"),
        t("Section"),
        t("Titulaire"),
        t("Terminal · RFSI"),
        t("Principal"),
        t("Alternative"),
        t("Sur le réseau"),
        t("Dernier contrôle"),
        t("Remarques"),
      ],
      widths: [30, 30, 24, 28, 30, 30, 30, 18, 24, 25],
      body: radio.stations.map((s) => {
        const status = stationStatus(radio, s.callsign);
        return [
          s.callsign,
          or(s.role),
          or(s.unit),
          status.assignment ? status.assignment.holder : "—",
          status.terminal
            ? [status.terminal.label, status.terminal.rfsi]
                .filter(Boolean)
                .join(" · ")
            : "—",
          talkgroupLabel(radio, s.primary),
          talkgroupLabel(radio, s.fallback),
          status.terminal ? t("Oui") : t("Non"),
          status.check
            ? `${checkLabel(status.check.result)}\n${dateTime(status.check.at)}`
            : "—",
          or(s.notes),
        ];
      }),
    },
    {
      id: "groups",
      title: t("Groupes et canaux"),
      caption: t("TKG · mode direct · relais"),
      head: [t("N°"), t("Désignation"), t("Mode"), t("Emploi"), t("Remarques")],
      widths: [24, 70, 24, 30, 121],
      body: radio.talkgroups.map((g) => [
        or(g.number),
        g.name,
        enumLabel(g.mode),
        enumLabel(g.usage),
        or(g.notes),
      ]),
    },
    {
      id: "terminals",
      title: t("Terminaux"),
      caption: t("{n} appareils", { n: radio.terminals.length }),
      head: [
        t("N°"),
        t("Type"),
        "RFSI",
        t("N° de série"),
        t("État"),
        t("Détenteur"),
        t("Nom d’appel"),
        t("Remis le"),
        t("Batterie"),
        t("Accessoires"),
      ],
      widths: [16, 28, 26, 26, 22, 32, 28, 26, 18, 47],
      body: radio.terminals.map((term) => {
        const a = activeAssignment(term);
        return [
          term.label,
          [term.model, enumLabel(term.kind)].filter(Boolean).join(" · "),
          or(term.rfsi),
          or(term.serial),
          terminalStateLabel(terminalState(term)),
          a ? [a.holder, a.role].filter(Boolean).join("\n") : "—",
          a ? or(a.callsign) : "—",
          a ? `${dateTime(a.issuedAt)}\n${a.issuedBy}` : "—",
          a ? enumLabel(a.battery) : "—",
          a ? or(accessoriesLabel(a.accessories)) : "—",
        ];
      }),
    },
    {
      id: "custody",
      title: t("Registre des remises"),
      caption: t("{n} quittances", { n: history.length }),
      head: [
        t("Terminal"),
        t("Détenteur"),
        t("Nom d’appel"),
        t("Remise"),
        t("Accessoires"),
        t("Retour (terminal)"),
        t("État au retour"),
        t("Remarques"),
      ],
      widths: [18, 36, 28, 34, 45, 34, 24, 50],
      body: history.map(({ term, a }) => [
        term.label,
        [a.holder, a.role, a.unit].filter(Boolean).join("\n"),
        or(a.callsign),
        `${dateTime(a.issuedAt)}\n${a.issuedBy} · ${t("batt. {level}", { level: enumLabel(a.battery).toLowerCase() })}`,
        or(accessoriesLabel(a.accessories)),
        a.returnedAt
          ? `${dateTime(a.returnedAt)}\n${a.returnedBy}`
          : t("En cours (remise)"),
        a.returnCondition ? enumLabel(a.returnCondition) : "—",
        or(a.notes),
      ]),
    },
    {
      id: "checks",
      title: t("Contrôles de liaison"),
      caption: t("Audibilité THREE · TWO · ONE"),
      head: [
        t("Heure"),
        t("Nom d’appel"),
        t("Groupe / canal"),
        t("Audibilité"),
        t("Par"),
        t("Remarques"),
      ],
      widths: [30, 40, 50, 34, 40, 75],
      body: radio.checks.map((c) => [
        dateTime(c.at),
        c.callsign,
        talkgroupLabel(radio, c.talkgroupId),
        checkLabel(c.result),
        c.by,
        or(c.notes),
      ]),
    },
  ];
}
