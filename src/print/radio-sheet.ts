import { dateTime } from "../../shared/journal.ts";
import {
  CHECK_LABELS,
  activeAssignment,
  stationStatus,
  terminalState,
  type Radio,
} from "../../shared/radio.ts";

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
    .flatMap((t) => t.assignments.map((a) => ({ t, a })))
    .sort((x, y) => Date.parse(x.a.issuedAt) - Date.parse(y.a.issuedAt));
  return [
    {
      id: "plan",
      title: "Plan du réseau radio",
      caption: `${radio.stations.length} noms d’appel`,
      head: [
        "Nom d’appel",
        "Fonction",
        "Section",
        "Titulaire",
        "Terminal · RFSI",
        "Principal",
        "Alternative",
        "Sur le réseau",
        "Dernier contrôle",
        "Remarques",
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
          status.terminal ? "Oui" : "Non",
          status.check
            ? `${CHECK_LABELS[status.check.result]}\n${dateTime(status.check.at)}`
            : "—",
          or(s.notes),
        ];
      }),
    },
    {
      id: "groups",
      title: "Groupes et canaux",
      caption: "TKG · mode direct · relais",
      head: ["N°", "Désignation", "Mode", "Emploi", "Remarques"],
      widths: [24, 70, 24, 30, 121],
      body: radio.talkgroups.map((g) => [
        or(g.number),
        g.name,
        g.mode,
        g.usage,
        or(g.notes),
      ]),
    },
    {
      id: "terminals",
      title: "Terminaux",
      caption: `${radio.terminals.length} appareils`,
      head: [
        "N°",
        "Type",
        "RFSI",
        "N° de série",
        "État",
        "Détenteur",
        "Nom d’appel",
        "Remis le",
        "Batterie",
        "Accessoires",
      ],
      widths: [16, 28, 26, 26, 22, 32, 28, 26, 18, 47],
      body: radio.terminals.map((t) => {
        const a = activeAssignment(t);
        return [
          t.label,
          [t.model, t.kind].filter(Boolean).join(" · "),
          or(t.rfsi),
          or(t.serial),
          terminalState(t),
          a ? [a.holder, a.role].filter(Boolean).join("\n") : "—",
          a ? or(a.callsign) : "—",
          a ? `${dateTime(a.issuedAt)}\n${a.issuedBy}` : "—",
          a ? a.battery : "—",
          a ? or(a.accessories) : "—",
        ];
      }),
    },
    {
      id: "custody",
      title: "Registre des remises",
      caption: `${history.length} quittances`,
      head: [
        "Terminal",
        "Détenteur",
        "Nom d’appel",
        "Remise",
        "Accessoires",
        "Retour",
        "État au retour",
        "Remarques",
      ],
      widths: [18, 36, 28, 34, 45, 34, 24, 50],
      body: history.map(({ t, a }) => [
        t.label,
        [a.holder, a.role, a.unit].filter(Boolean).join("\n"),
        or(a.callsign),
        `${dateTime(a.issuedAt)}\n${a.issuedBy} · batt. ${a.battery.toLowerCase()}`,
        or(a.accessories),
        a.returnedAt
          ? `${dateTime(a.returnedAt)}\n${a.returnedBy}`
          : "En cours",
        a.returnCondition || "—",
        or(a.notes),
      ]),
    },
    {
      id: "checks",
      title: "Contrôles de liaison",
      caption: "Audibilité THREE · TWO · ONE",
      head: [
        "Heure",
        "Nom d’appel",
        "Groupe / canal",
        "Audibilité",
        "Par",
        "Remarques",
      ],
      widths: [30, 40, 50, 34, 40, 75],
      body: radio.checks.map((c) => [
        dateTime(c.at),
        c.callsign,
        talkgroupLabel(radio, c.talkgroupId),
        CHECK_LABELS[c.result],
        c.by,
        or(c.notes),
      ]),
    },
  ];
}
