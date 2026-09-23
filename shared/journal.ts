import { z } from "zod";
import {
  emptyRadio,
  planRadioMerge,
  radioSchema,
  type Radio,
} from "./radio.ts";

export const TYPES = [
  "Renseignement",
  "Décision",
  "Mission",
  "Demande",
  "Quittance",
  "Observation",
  "Relève",
] as const;
export const PRIORITIES = ["Normal", "Important", "Urgent"] as const;
export const STATUSES = [
  "Consigné",
  "À traiter",
  "En cours",
  "Terminé",
  "Annulé",
] as const;
export const CHANNELS = [
  "Radio",
  "Téléphone",
  "Sur place",
  "E-mail",
  "Message",
  "Autre",
] as const;
export const RELIABILITIES = [
  "Non confirmé",
  "Confirmé",
  "À vérifier",
] as const;
const text = (max = 500) => z.string().max(max);
const instant = z.iso.datetime({ offset: true });
const optionalInstant = z.union([instant, z.literal("")]);
export const fieldsSchema = z
  .object({
    happenedAt: instant,
    receivedAt: instant,
    type: z.enum(TYPES),
    message: text(12000).min(1),
    source: text(),
    recipient: text(),
    channel: z.enum(CHANNELS),
    priority: z.enum(PRIORITIES),
    reliability: z.enum(RELIABILITIES),
    location: text(),
    coordinates: text(150),
    action: text(12000),
    assignee: text(),
    dueAt: optionalInstant,
    status: z.enum(STATUSES),
    resources: text(4000),
    reference: text(1000),
    notes: text(12000),
    tags: z.array(text(60).min(1)).max(20),
  })
  .strict();
export const revisionSchema = z
  .object({
    id: z.uuid(),
    at: instant,
    author: text(120).min(1),
    reason: text(1000).min(1),
    fields: fieldsSchema,
  })
  .strict();
export const entrySchema = z
  .object({
    id: z.uuid(),
    number: z.number().int().positive(),
    createdAt: instant,
    createdBy: text(120).min(1),
    origin: text(500),
    revisions: z.array(revisionSchema).min(1).max(500),
  })
  .strict();
// A deleted entry leaves only this trace: its content is gone, its number is
// never reused, and merges do not bring it back.
export const deletionSchema = z
  .object({
    id: z.uuid(),
    number: z.number().int().positive(),
    at: instant,
    by: text(120).min(1),
    reason: text(1000).min(1),
  })
  .strict();
export const journalSchema = z
  .object({
    id: z.uuid(),
    title: text(200).min(1),
    organization: text(200),
    location: text(300),
    reference: text(200),
    mode: z.enum(["Exercice", "Intervention"]),
    classification: z.enum(["Interne", "Confidentiel"]),
    createdAt: instant,
    closedAt: optionalInstant,
    entries: z.array(entrySchema).max(10000),
    radio: radioSchema.default(emptyRadio),
    deleted: z.array(deletionSchema).max(10000).default([]),
  })
  .strict()
  .superRefine((journal, ctx) => {
    const gone = new Set(journal.deleted.map((d) => d.id));
    if (gone.size !== journal.deleted.length)
      ctx.addIssue({ code: "custom", message: "Suppressions dupliquées." });
    if (journal.entries.some((e) => gone.has(e.id)))
      ctx.addIssue({
        code: "custom",
        message: "Une entrée supprimée figure encore au journal.",
      });
    for (const key of ["id", "number"] as const) {
      const values = journal.entries.map((entry) => entry[key]);
      if (new Set(values).size !== values.length)
        ctx.addIssue({
          code: "custom",
          message: `Entrées avec ${key} dupliqué.`,
        });
    }
    for (const entry of journal.entries) {
      if (
        new Set(entry.revisions.map((r) => r.id)).size !==
        entry.revisions.length
      )
        ctx.addIssue({ code: "custom", message: "Révisions dupliquées." });
    }
  });
export const draftSchema = fieldsSchema.extend({ message: text(12000) });
export const workspaceSchema = z
  .object({
    version: z.literal(1),
    author: text(120).min(1),
    journals: z.array(journalSchema).min(1).max(100),
    activeId: z.uuid(),
    drafts: z.record(z.uuid(), draftSchema).optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (
      value.drafts &&
      Object.keys(value.drafts).some(
        (id) => !value.journals.some((j) => j.id === id),
      )
    )
      ctx.addIssue({ code: "custom", message: "Brouillon sans journal." });
    if (!value.journals.some((j) => j.id === value.activeId))
      ctx.addIssue({ code: "custom", message: "Journal actif absent." });
    if (new Set(value.journals.map((j) => j.id)).size !== value.journals.length)
      ctx.addIssue({ code: "custom", message: "Journaux dupliqués." });
  });
export const archiveSchema = z
  .object({
    format: z.literal("orion-journal"),
    version: z.literal(1),
    exportedAt: instant,
    journal: journalSchema,
  })
  .strict();
export type Fields = z.infer<typeof fieldsSchema>;
export type Revision = z.infer<typeof revisionSchema>;
export type Entry = z.infer<typeof entrySchema>;
export type Journal = z.infer<typeof journalSchema>;
export type Deletion = z.infer<typeof deletionSchema>;
export type Workspace = z.infer<typeof workspaceSchema>;
export type Archive = z.infer<typeof archiveSchema>;
export const current = (entry: Entry): Fields =>
  entry.revisions[entry.revisions.length - 1].fields;
export const now = () => new Date().toISOString();
export function emptyFields(): Fields {
  const at = now();
  return {
    happenedAt: at,
    receivedAt: at,
    type: "Renseignement",
    message: "",
    source: "",
    recipient: "",
    channel: "Radio",
    priority: "Normal",
    reliability: "Non confirmé",
    location: "",
    coordinates: "",
    action: "",
    assignee: "",
    dueAt: "",
    status: "Consigné",
    resources: "",
    reference: "",
    notes: "",
    tags: [],
  };
}
export function newJournal(
  title: string,
  metadata: Partial<
    Pick<
      Journal,
      "organization" | "location" | "reference" | "mode" | "classification"
    >
  > = {},
): Journal {
  return journalSchema.parse({
    id: crypto.randomUUID(),
    title: title.trim() || "Nouveau journal",
    organization: "",
    location: "",
    reference: "",
    mode: "Exercice",
    classification: "Interne",
    createdAt: now(),
    closedAt: "",
    entries: [],
    ...metadata,
  });
}
export function makeEntry(
  number: number,
  origin: string,
  fields: Fields,
  author: string,
): Entry {
  const at = now();
  return entrySchema.parse({
    id: crypto.randomUUID(),
    number,
    createdAt: at,
    createdBy: author,
    origin,
    revisions: [
      {
        id: crypto.randomUUID(),
        at,
        author,
        reason: "Saisie initiale",
        fields,
      },
    ],
  });
}
export function addEntry(
  journal: Journal,
  fields: Fields,
  author: string,
): Journal {
  if (journal.closedAt)
    throw new Error(
      "Ce journal est clôturé. Rouvrez-le avant de saisir une entrée.",
    );
  const entry = makeEntry(
    lastNumber(journal) + 1,
    journal.title,
    fields,
    author,
  );
  return journalSchema.parse({
    ...journal,
    entries: [...journal.entries, entry],
  });
}
export function reviseEntry(
  journal: Journal,
  id: string,
  fields: Fields,
  author: string,
  reason: string,
): Journal {
  if (journal.closedAt) throw new Error("Ce journal est clôturé.");
  if (!journal.entries.some((e) => e.id === id))
    throw new Error("Entrée introuvable.");
  if (!reason.trim()) throw new Error("Indiquez le motif de la modification.");
  return journalSchema.parse({
    ...journal,
    entries: journal.entries.map((e) =>
      e.id === id
        ? {
            ...e,
            revisions: [
              ...e.revisions,
              {
                id: crypto.randomUUID(),
                at: now(),
                author,
                reason: reason.trim(),
                fields,
              },
            ],
          }
        : e,
    ),
  });
}
export function deleteEntry(
  journal: Journal,
  id: string,
  author: string,
  reason: string,
): Journal {
  if (journal.closedAt) throw new Error("Ce journal est clôturé.");
  const entry = journal.entries.find((e) => e.id === id);
  if (!entry) throw new Error("Entrée introuvable.");
  if (!reason.trim()) throw new Error("Indiquez le motif de la suppression.");
  return journalSchema.parse({
    ...journal,
    entries: journal.entries.filter((e) => e.id !== id),
    deleted: [
      ...journal.deleted,
      {
        id,
        number: entry.number,
        at: now(),
        by: author,
        reason: reason.trim(),
      },
    ],
  });
}
export function updateRadio(journal: Journal, radio: Radio): Journal {
  if (journal.closedAt) throw new Error("Ce journal est clôturé.");
  return journalSchema.parse({ ...journal, radio });
}
export const archive = (journal: Journal): Archive => ({
  format: "orion-journal",
  version: 1,
  exportedAt: now(),
  journal,
});
export function parseArchive(input: unknown): Archive {
  const parsed = archiveSchema.safeParse(input);
  if (!parsed.success)
    throw new Error(
      "Fichier ORION invalide ou version non prise en charge. Le journal actuel est intact.",
    );
  return parsed.data;
}
function sameEntry(a: Entry, b: Entry) {
  // Local numbering and journal names may differ after a transfer.
  return (
    JSON.stringify({ ...a, number: 0, origin: "" }) ===
    JSON.stringify({ ...b, number: 0, origin: "" })
  );
}
/** Highest number ever used, deleted entries included. */
export const lastNumber = (journal: Journal) =>
  Math.max(
    0,
    ...journal.entries.map((e) => e.number),
    ...journal.deleted.map((d) => d.number),
  );
export function planMerge(target: Journal, incoming: Journal) {
  const known = new Map(target.entries.map((e) => [e.id, e]));
  const deletedHere = new Set(target.deleted.map((d) => d.id));
  const deletedThere = new Set(incoming.deleted.map((d) => d.id));
  // Entries of this journal that the incoming file records as deleted.
  const removed = target.entries.filter((e) => deletedThere.has(e.id));
  const entries = incoming.entries
    .filter((e) => !deletedHere.has(e.id) && !deletedThere.has(e.id))
    .reduce<{
      added: Entry[];
      duplicates: Entry[];
      conflicts: Entry[];
    }>(
      (plan, entry) => {
        const existing = known.get(entry.id);
        if (!existing) plan.added.push(entry);
        else if (sameEntry(existing, entry)) plan.duplicates.push(entry);
        else plan.conflicts.push(entry);
        return plan;
      },
      { added: [], duplicates: [], conflicts: [] },
    );
  return {
    ...entries,
    removed,
    radio: planRadioMerge(target.radio, incoming.radio),
  };
}
export function mergeJournals(target: Journal, incoming: Journal): Journal {
  if (target.closedAt)
    throw new Error("Rouvrez le journal avant de fusionner.");
  const plan = planMerge(target, incoming);
  if (plan.conflicts.length || plan.radio.conflicts)
    throw new Error(
      "Des versions divergent. Importez ce fichier dans un journal séparé pour les comparer.",
    );
  let number = lastNumber(target);
  const removed = new Set(plan.removed.map((e) => e.id));
  const known = new Set(target.deleted.map((d) => d.id));
  return journalSchema.parse({
    ...target,
    radio: plan.radio.radio,
    deleted: [
      ...target.deleted,
      ...incoming.deleted
        .filter((d) => !known.has(d.id))
        .map((d) => ({
          ...d,
          number: target.entries.find((e) => e.id === d.id)?.number ?? d.number,
        })),
    ],
    entries: [
      ...target.entries.filter((e) => !removed.has(e.id)),
      ...plan.added.map((e) => ({
        ...e,
        number: ++number,
        origin: e.origin || incoming.title,
      })),
    ],
  });
}
export const needsFollowUp = (entry: Entry) =>
  ["À traiter", "En cours"].includes(current(entry).status);
export const overdue = (entry: Entry, at = Date.now()) =>
  needsFollowUp(entry) &&
  !!current(entry).dueAt &&
  Date.parse(current(entry).dueAt) < at;
export function searchEntries(entries: Entry[], query: string) {
  const normalized = (s: string) =>
    s
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLocaleLowerCase("fr");
  const terms = normalized(query).split(/\s+/).filter(Boolean);
  return entries.filter((e) => {
    const haystack = normalized(
      [e.number, e.createdBy, ...Object.values(current(e))].join(" "),
    );
    return terms.every((term) => haystack.includes(term));
  });
}
export const chronological = (entries: Entry[]) =>
  [...entries].sort(
    (a, b) =>
      Date.parse(current(a).happenedAt) - Date.parse(current(b).happenedAt) ||
      a.number - b.number,
  );
export const dateTime = (value: string) =>
  value
    ? new Date(value).toLocaleString("fr-CH", {
        timeZone: "Europe/Zurich",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";
export const time = (value: string) =>
  new Date(value).toLocaleTimeString("fr-CH", {
    timeZone: "Europe/Zurich",
    hour: "2-digit",
    minute: "2-digit",
  });
export const day = (value: string) =>
  new Date(value).toLocaleDateString("fr-CH", {
    timeZone: "Europe/Zurich",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
export const numberLabel = (entry: Entry) =>
  `#${String(entry.number).padStart(3, "0")}`;
