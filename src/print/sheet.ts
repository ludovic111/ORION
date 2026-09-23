import {
  current,
  dateTime,
  numberLabel,
  type Entry,
  type Journal,
} from "../../shared/journal.ts";

export type SheetField = {
  label: string;
  value: string;
  span?: number;
  tall?: boolean;
  mono?: boolean;
  strong?: boolean;
};
export type SheetSection = { title: string; rows: SheetField[][] };
export type MessageSheet = {
  number: string;
  type: string;
  priority: string;
  status: string;
  revised: boolean;
  cancelled: boolean;
  sections: SheetSection[];
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

export function messageSheet(entry: Entry): MessageSheet {
  const f = current(entry);
  const last = entry.revisions.at(-1)!;
  const revised = entry.revisions.length > 1;
  return {
    number: numberLabel(entry),
    type: f.type,
    priority: f.priority,
    status: f.status,
    revised,
    cancelled: f.status === "Annulé",
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

export const printedAt = () => dateTime(new Date().toISOString());
