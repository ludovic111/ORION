import {
  current,
  dateTime,
  numberLabel,
  type Entry,
  type Journal,
} from "../../shared/journal.ts";
import type { Message } from "../../shared/ops.ts";
import {
  callsignKey,
  type Assignment,
  type Radio,
  type Terminal,
} from "../../shared/radio.ts";
import { enumLabel } from "../../shared/i18n/enums.ts";
import { t } from "./i18n.ts";

export type SheetField = {
  label: string;
  value: string;
  span?: number;
  tall?: boolean;
  mono?: boolean;
  strong?: boolean;
};
export type SheetSection = { title: string; rows: SheetField[][] };
/** A one-record A4 form: fiche message, quittance de remise radio. */
export type FormSheet = {
  kind: string;
  idLabel: string;
  number: string;
  boxes: { label: string; value: string; alert?: boolean }[];
  note?: { text: string; alert?: boolean };
  sections: SheetSection[];
  visa: { title: string; labels: string[] }[];
  footer: string;
};

export type SheetHeader = {
  title: string;
  organization: string;
  location: string;
  reference: string;
  mode: string;
  classification: string;
};
export const sheetHeader = (journal: Journal): SheetHeader => ({
  title: journal.title,
  organization: journal.organization,
  location: journal.location,
  reference: journal.reference,
  mode: journal.mode,
  classification: journal.classification,
});

const or = (value: string) => value.trim() || "—";

export function messageSheet(entry: Entry): FormSheet {
  const f = current(entry);
  const last = entry.revisions.at(-1)!;
  const revised = entry.revisions.length > 1;
  const cancelled = f.status === "Annulé";
  return {
    kind: t("Fiche message"),
    idLabel: t("Message"),
    number: numberLabel(entry),
    boxes: [
      { label: t("Nature"), value: enumLabel(f.type) },
      {
        label: t("Priorité"),
        value: enumLabel(f.priority),
        alert: f.priority === "Urgent",
      },
      { label: t("Suivi"), value: enumLabel(f.status) },
    ],
    note: cancelled
      ? {
          text: t("ENTRÉE ANNULÉE · conservée pour la traçabilité"),
          alert: true,
        }
      : revised
        ? {
            text: t(
              "VERSION {n} · état actuel ; versions antérieures dans l’archive orion aic",
              { n: entry.revisions.length },
            ),
          }
        : undefined,
    visa: [
      {
        title: t("Visa"),
        labels: [t("Traité par"), t("Date / heure"), t("Signature")],
      },
    ],
    footer: t("message {n}", { n: numberLabel(entry) }),
    sections: [
      {
        title: t("Transmission"),
        rows: [
          [
            {
              label: t("Événement"),
              value: dateTime(f.happenedAt),
              mono: true,
            },
            {
              label: t("Réception"),
              value: dateTime(f.receivedAt),
              mono: true,
            },
            {
              label: t("Enregistrement"),
              value: dateTime(entry.createdAt),
              mono: true,
            },
            { label: t("Canal"), value: enumLabel(f.channel) },
          ],
          [
            { label: t("Émetteur"), value: or(f.source), span: 2 },
            { label: t("Destinataire"), value: or(f.recipient), span: 2 },
          ],
        ],
      },
      {
        title: t("Message"),
        rows: [
          [{ label: t("Texte"), value: f.message, tall: true, strong: true }],
        ],
      },
      {
        title: t("Localisation"),
        rows: [
          [
            { label: t("Lieu / secteur"), value: or(f.location), span: 2 },
            { label: t("Coordonnées"), value: or(f.coordinates), mono: true },
            { label: t("Confirmation"), value: enumLabel(f.reliability) },
          ],
        ],
      },
      {
        title: t("Conduite"),
        rows: [
          [
            {
              label: t("Mesure / décision / mission"),
              value: or(f.action),
              tall: true,
            },
          ],
          [
            { label: t("Responsable"), value: or(f.assignee), span: 2 },
            {
              label: t("Échéance"),
              value: f.dueAt ? dateTime(f.dueAt) : "—",
              mono: true,
            },
            { label: t("Suivi"), value: enumLabel(f.status) },
          ],
          [{ label: t("Moyens engagés / besoins"), value: or(f.resources) }],
        ],
      },
      {
        title: t("Compléments"),
        rows: [
          [
            {
              label: t("Référence / entrée liée"),
              value: or(f.reference),
              span: 2,
            },
            {
              label: t("Mots-clés"),
              value: f.tags.length ? f.tags.join(", ") : "—",
              span: 2,
            },
          ],
          [{ label: t("Observations"), value: or(f.notes) }],
        ],
      },
      {
        title: t("Traçabilité"),
        rows: [
          [
            { label: t("Saisi par"), value: entry.createdBy },
            {
              label: t("Version"),
              value: `${entry.revisions.length}`,
              mono: true,
            },
            {
              label: t("Dernière modification"),
              value: revised ? `${dateTime(last.at)} · ${last.author}` : "—",
              span: 2,
            },
          ],
          ...(revised ? [[{ label: t("Motif"), value: last.reason }]] : []),
          [
            { label: t("Origine"), value: or(entry.origin), span: 2 },
            { label: t("Identifiant"), value: entry.id, mono: true, span: 2 },
          ],
        ],
      },
    ],
  };
}

export function handoutSheet(
  terminal: Terminal,
  assignment: Assignment,
  radio: Radio,
): FormSheet {
  const station = radio.stations.find(
    (s) => callsignKey(s.callsign) === callsignKey(assignment.callsign),
  );
  const returned = !!assignment.returnedAt;
  const listed = assignment.accessories
    .split(",")
    .map((a) => a.trim())
    .filter(Boolean);
  return {
    kind: t("Quittance de remise radio"),
    idLabel: t("Terminal"),
    number: terminal.label,
    boxes: [
      { label: t("Modèle"), value: terminal.model || "—" },
      { label: "RFSI", value: terminal.rfsi || "—" },
      {
        label: t("Statut"),
        value: returned ? t("Rendu") : t("Remis"),
        alert: assignment.returnCondition === "Manquant",
      },
    ],
    sections: [
      {
        title: t("Terminal"),
        rows: [
          [
            { label: t("N° interne"), value: terminal.label, mono: true },
            { label: t("Type"), value: enumLabel(terminal.kind) },
            { label: t("N° de série"), value: or(terminal.serial), mono: true },
            { label: "RFSI", value: or(terminal.rfsi), mono: true },
          ],
        ],
      },
      {
        title: t("Détenteur"),
        rows: [
          [
            {
              label: t("Grade, nom"),
              value: assignment.holder,
              span: 2,
              strong: true,
            },
            {
              label: t("Nom d’appel"),
              value: or(assignment.callsign),
              span: 2,
            },
          ],
          [
            { label: t("Fonction"), value: or(assignment.role), span: 2 },
            { label: t("Section"), value: or(assignment.unit) },
            {
              label: t("Groupe principal"),
              value: station ? talkgroupName(radio, station.primary) : "—",
            },
          ],
        ],
      },
      {
        title: t("Remise"),
        rows: [
          [
            {
              label: t("Heure"),
              value: dateTime(assignment.issuedAt),
              mono: true,
            },
            { label: t("Remis par"), value: assignment.issuedBy },
            { label: t("Batterie"), value: enumLabel(assignment.battery) },
            { label: t("État"), value: enumLabel(terminal.condition) },
          ],
          [
            {
              label: t("Accessoires remis"),
              value: listed.length
                ? listed.map((a) => `[  ] ${enumLabel(a)}`).join("   ")
                : t("Aucun"),
            },
          ],
          [{ label: t("Remarques"), value: or(assignment.notes) }],
        ],
      },
      {
        title: t("Retour (terminal)"),
        rows: [
          [
            {
              label: t("Heure"),
              value: returned ? dateTime(assignment.returnedAt) : "",
              mono: true,
            },
            {
              label: t("Reçu par"),
              value: returned ? assignment.returnedBy : "",
            },
            {
              label: t("État au retour"),
              value: enumLabel(assignment.returnCondition),
            },
            {
              label: t("Complet"),
              value: returned ? "" : t("[  ] oui    [  ] non"),
            },
          ],
        ],
      },
    ],
    visa: [
      {
        title: t("Signatures"),
        labels: [
          t("Détenteur (remise)"),
          t("Remettant"),
          t("Détenteur (retour)"),
        ],
      },
    ],
    footer: t("quittance {label} · {holder}", {
      label: terminal.label,
      holder: assignment.holder,
    }),
  };
}

const talkgroupName = (radio: Radio, id: string) => {
  const group = radio.talkgroups.find((g) => g.id === id);
  return group ? [group.number, group.name].filter(Boolean).join(" · ") : "—";
};

export const printedAt = () => dateTime(new Date().toISOString());

/** Standard A4 message form (formule de message) for the intake. */
export function intakeSheet(
  message: Message,
  number: number | string,
): FormSheet {
  const urgent = message.priority === "Urgent";
  return {
    kind: t("Formule de message"),
    idLabel: t("Message"),
    // A label ("013·B") when two posts gave the same number.
    number:
      typeof number === "string"
        ? `M${number}`
        : `M${String(number).padStart(3, "0")}`,
    boxes: [
      {
        label: t("Priorité"),
        value: enumLabel(message.priority),
        alert: urgent,
      },
      { label: t("Catégorie"), value: or(message.category) },
      { label: t("État"), value: enumLabel(message.status) },
    ],
    note: message.replyNeeded
      ? {
          text: message.replyBy
            ? t("RÉPONSE ATTENDUE AVANT {at}", {
                at: dateTime(message.replyBy),
              })
            : t("RÉPONSE ATTENDUE"),
          alert: true,
        }
      : undefined,
    sections: [
      {
        title: t("Transmission"),
        rows: [
          [
            { label: t("De"), value: or(message.from), strong: true, span: 2 },
            { label: t("À"), value: or(message.to), strong: true, span: 2 },
          ],
          [
            {
              label: t("Reçu le"),
              value: dateTime(message.receivedAt),
              mono: true,
            },
            { label: t("Canal"), value: enumLabel(or(message.via)) },
            { label: t("Reçu par"), value: or(message.by) },
          ],
        ],
      },
      {
        title: t("Message"),
        rows: [
          [{ label: t("Objet"), value: or(message.subject), strong: true }],
          [{ label: t("Texte"), value: or(message.body), tall: true }],
        ],
      },
      {
        title: t("Lieu"),
        rows: [
          [
            {
              label: t("Lieu / secteur"),
              value: or(message.location),
              span: 2,
            },
            {
              label: t("Coordonnées"),
              value: or(message.coordinates),
              mono: true,
            },
          ],
        ],
      },
      {
        title: t("Traitement"),
        rows: [
          [
            { label: t("Traité par"), value: or(message.handledBy) },
            { label: t("Mots-clés"), value: or(message.tags.join(", ")) },
          ],
          [{ label: t("Remarques"), value: or(message.notes) }],
        ],
      },
    ],
    visa: [
      {
        title: t("Visa"),
        labels: [
          t("Reçu par"),
          t("Synthèse / journal"),
          t("Transmis à"),
          t("Heure"),
        ],
      },
    ],
    footer: t("message {n}", { n: `M${String(number).padStart(3, "0")}` }),
  };
}
