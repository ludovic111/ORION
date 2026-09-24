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
    kind: "Fiche message",
    idLabel: "Message",
    number: numberLabel(entry),
    boxes: [
      { label: "Nature", value: f.type },
      { label: "Priorité", value: f.priority, alert: f.priority === "Urgent" },
      { label: "Suivi", value: f.status },
    ],
    note: cancelled
      ? { text: "ENTRÉE ANNULÉE · conservée pour la traçabilité", alert: true }
      : revised
        ? {
            text: `VERSION ${entry.revisions.length} · état actuel ; versions antérieures dans l’archive orion aic`,
          }
        : undefined,
    visa: [
      { title: "Visa", labels: ["Traité par", "Date / heure", "Signature"] },
    ],
    footer: `message ${numberLabel(entry)}`,
    sections: [
      {
        title: "Transmission",
        rows: [
          [
            { label: "Événement", value: dateTime(f.happenedAt), mono: true },
            { label: "Réception", value: dateTime(f.receivedAt), mono: true },
            {
              label: "Enregistrement",
              value: dateTime(entry.createdAt),
              mono: true,
            },
            { label: "Canal", value: f.channel },
          ],
          [
            { label: "Émetteur", value: or(f.source), span: 2 },
            { label: "Destinataire", value: or(f.recipient), span: 2 },
          ],
        ],
      },
      {
        title: "Message",
        rows: [
          [{ label: "Texte", value: f.message, tall: true, strong: true }],
        ],
      },
      {
        title: "Localisation",
        rows: [
          [
            { label: "Lieu / secteur", value: or(f.location), span: 2 },
            { label: "Coordonnées", value: or(f.coordinates), mono: true },
            { label: "Confirmation", value: f.reliability },
          ],
        ],
      },
      {
        title: "Conduite",
        rows: [
          [
            {
              label: "Mesure / décision / mission",
              value: or(f.action),
              tall: true,
            },
          ],
          [
            { label: "Responsable", value: or(f.assignee), span: 2 },
            {
              label: "Échéance",
              value: f.dueAt ? dateTime(f.dueAt) : "—",
              mono: true,
            },
            { label: "Suivi", value: f.status },
          ],
          [{ label: "Moyens engagés / besoins", value: or(f.resources) }],
        ],
      },
      {
        title: "Compléments",
        rows: [
          [
            {
              label: "Référence / entrée liée",
              value: or(f.reference),
              span: 2,
            },
            {
              label: "Mots-clés",
              value: f.tags.length ? f.tags.join(", ") : "—",
              span: 2,
            },
          ],
          [{ label: "Observations", value: or(f.notes) }],
        ],
      },
      {
        title: "Traçabilité",
        rows: [
          [
            { label: "Saisi par", value: entry.createdBy },
            {
              label: "Version",
              value: `${entry.revisions.length}`,
              mono: true,
            },
            {
              label: "Dernière modification",
              value: revised ? `${dateTime(last.at)} · ${last.author}` : "—",
              span: 2,
            },
          ],
          ...(revised ? [[{ label: "Motif", value: last.reason }]] : []),
          [
            { label: "Origine", value: or(entry.origin), span: 2 },
            { label: "Identifiant", value: entry.id, mono: true, span: 2 },
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
    kind: "Quittance de remise radio",
    idLabel: "Terminal",
    number: terminal.label,
    boxes: [
      { label: "Modèle", value: terminal.model || "—" },
      { label: "RFSI", value: terminal.rfsi || "—" },
      {
        label: "Statut",
        value: returned ? "Rendu" : "Remis",
        alert: assignment.returnCondition === "Manquant",
      },
    ],
    sections: [
      {
        title: "Terminal",
        rows: [
          [
            { label: "N° interne", value: terminal.label, mono: true },
            { label: "Type", value: terminal.kind },
            { label: "N° de série", value: or(terminal.serial), mono: true },
            { label: "RFSI", value: or(terminal.rfsi), mono: true },
          ],
        ],
      },
      {
        title: "Détenteur",
        rows: [
          [
            {
              label: "Grade, nom",
              value: assignment.holder,
              span: 2,
              strong: true,
            },
            { label: "Nom d’appel", value: or(assignment.callsign), span: 2 },
          ],
          [
            { label: "Fonction", value: or(assignment.role), span: 2 },
            { label: "Section", value: or(assignment.unit) },
            {
              label: "Groupe principal",
              value: station ? talkgroupName(radio, station.primary) : "—",
            },
          ],
        ],
      },
      {
        title: "Remise",
        rows: [
          [
            {
              label: "Heure",
              value: dateTime(assignment.issuedAt),
              mono: true,
            },
            { label: "Remis par", value: assignment.issuedBy },
            { label: "Batterie", value: assignment.battery },
            { label: "État", value: terminal.condition },
          ],
          [
            {
              label: "Accessoires remis",
              value: listed.length
                ? listed.map((a) => `[  ] ${a}`).join("   ")
                : "Aucun",
            },
          ],
          [{ label: "Remarques", value: or(assignment.notes) }],
        ],
      },
      {
        title: "Retour",
        rows: [
          [
            {
              label: "Heure",
              value: returned ? dateTime(assignment.returnedAt) : "",
              mono: true,
            },
            { label: "Reçu par", value: returned ? assignment.returnedBy : "" },
            { label: "État au retour", value: assignment.returnCondition },
            { label: "Complet", value: returned ? "" : "[  ] oui    [  ] non" },
          ],
        ],
      },
    ],
    visa: [
      {
        title: "Signatures",
        labels: ["Détenteur (remise)", "Remettant", "Détenteur (retour)"],
      },
    ],
    footer: `quittance ${terminal.label} · ${assignment.holder}`,
  };
}

const talkgroupName = (radio: Radio, id: string) => {
  const group = radio.talkgroups.find((g) => g.id === id);
  return group ? [group.number, group.name].filter(Boolean).join(" · ") : "—";
};

export const printedAt = () => dateTime(new Date().toISOString());

/** Standard A4 message form (formule de message) for the intake. */
export function intakeSheet(message: Message, number: number): FormSheet {
  const urgent = message.priority === "Urgent";
  return {
    kind: "Formule de message",
    idLabel: "Message",
    number: `M${String(number).padStart(3, "0")}`,
    boxes: [
      { label: "Priorité", value: message.priority, alert: urgent },
      { label: "Catégorie", value: or(message.category) },
      { label: "État", value: message.status },
    ],
    note: message.replyNeeded
      ? {
          text: `RÉPONSE ATTENDUE${message.replyBy ? ` AVANT ${dateTime(message.replyBy)}` : ""}`,
          alert: true,
        }
      : undefined,
    sections: [
      {
        title: "Transmission",
        rows: [
          [
            { label: "De", value: or(message.from), strong: true, span: 2 },
            { label: "À", value: or(message.to), strong: true, span: 2 },
          ],
          [
            {
              label: "Reçu le",
              value: dateTime(message.receivedAt),
              mono: true,
            },
            { label: "Canal", value: or(message.via) },
            { label: "Reçu par", value: or(message.by) },
          ],
        ],
      },
      {
        title: "Message",
        rows: [
          [{ label: "Objet", value: or(message.subject), strong: true }],
          [{ label: "Texte", value: or(message.body), tall: true }],
        ],
      },
      {
        title: "Lieu",
        rows: [
          [
            { label: "Lieu / secteur", value: or(message.location), span: 2 },
            {
              label: "Coordonnées",
              value: or(message.coordinates),
              mono: true,
            },
          ],
        ],
      },
      {
        title: "Traitement",
        rows: [
          [
            { label: "Traité par", value: or(message.handledBy) },
            { label: "Mots-clés", value: or(message.tags.join(", ")) },
          ],
          [{ label: "Remarques", value: or(message.notes) }],
        ],
      },
    ],
    visa: [
      {
        title: "Visa",
        labels: ["Reçu par", "Synthèse / journal", "Transmis à", "Heure"],
      },
    ],
    footer: `message M${String(number).padStart(3, "0")}`,
  };
}
