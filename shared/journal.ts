import { z } from "zod";
import {
  emptyRadio,
  planRadioMerge,
  radioSchema,
  type Radio,
} from "./radio.ts";
import { emptyOps, opsSchema } from "./ops.ts";
import {
  COMPACT_FROM,
  MAX_HISTORY,
  capHistory,
  eventSchema,
  thinHistory,
  type HistoryEvent,
} from "./events.ts";
import { NODE, canonicalStamp, stampSchema } from "./hlc.ts";
import { signatureBlockSchema, signingKeySchema } from "./signature.ts";
import {
  BLOB_KEY,
  DATA_IMAGE,
  IMAGE_FIELDS,
  blobKey,
  blobsOf,
  internState,
  resolveState,
} from "./blobs.ts";

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
    // Hybrid logical clock (shared/hlc.ts): orders the versions of an entry
    // whatever the clocks of the posts. Versions written before 2.1 have none
    // (their time counts).
    hlc: stampSchema.optional(),
    // Version this one was written from: two versions from the same base
    // were written at the same time on two posts (see conflicts()).
    base: z.uuid().optional(),
    // Entries cited in the reference field ("Suite de #007"), resolved when
    // the version was written, so that a later collision of numbers does not
    // change what the version refers to.
    refs: z.array(z.uuid()).max(50).optional(),
  })
  .strict();
const SUFFIX = /^[A-Z]{1,3}$/;
export const entrySchema = z
  .object({
    id: z.uuid(),
    // Given at creation and never changed. Two posts adding an entry at the
    // same time may both give #007: both keep it, told apart by `suffix`.
    number: z.number().int().positive(),
    createdAt: instant,
    createdBy: text(120).min(1),
    origin: text(500),
    revisions: z.array(revisionSchema).min(1).max(500),
    // Post that created the entry (shared/hlc.ts).
    node: z.string().regex(NODE).optional(),
    // Derived, the same on every post: "B" in "#007·B" when another entry
    // (or deleted entry) created earlier holds #007. See assignSuffixes().
    suffix: z.string().regex(SUFFIX).optional(),
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
    hlc: stampSchema.optional(),
    // Creation of the deleted entry and its post: a deleted entry keeps its
    // place among entries sharing its number, so their labels do not change.
    createdAt: instant.optional(),
    node: z.string().regex(NODE).optional(),
  })
  .strict();
export const syncSchema = z
  .object({
    // Last change of each record id ("meta" for the journal header,
    // "settings" for the référentiels), as a hybrid logical clock stamp.
    clock: z.record(z.string().max(80), stampSchema),
    // Removal of each record id.
    removed: z.record(z.string().max(80), stampSchema),
    // History compaction watermark (see shared/events.ts).
    compacted: stampSchema.optional(),
  })
  .strict();
const journalObject = z
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
    ops: opsSchema.default(emptyOps),
    // Live synchronisation: stamps of the changes (see shared/sync.ts).
    sync: syncSchema.default(() => ({ clock: {}, removed: {} })),
    // Every change of every record except the entries (whose versions are
    // kept in their revisions): see shared/history.ts. Capped at
    // MAX_HISTORY by compaction, not by the schema, so that an old large
    // session still opens.
    history: z.array(eventSchema).default([]),
    // Images, once each, by SHA-256 (see shared/blobs.ts).
    blobs: z
      .record(z.string().regex(BLOB_KEY), z.string().max(600_000))
      .default(() => ({})),
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
    const ids = journal.entries.map((entry) => entry.id);
    if (new Set(ids).size !== ids.length)
      ctx.addIssue({ code: "custom", message: "Entrées avec id dupliqué." });
    // Numbers may repeat (two posts at the same time): normalizeJournal()
    // gives each such entry its own label.
    for (const entry of journal.entries) {
      if (
        new Set(entry.revisions.map((r) => r.id)).size !==
        entry.revisions.length
      )
        ctx.addIssue({ code: "custom", message: "Révisions dupliquées." });
    }
    for (const value of Object.values(journal.blobs))
      if (!DATA_IMAGE.test(value))
        ctx.addIssue({ code: "custom", message: "Image invalide." });
  });
type JournalData = z.infer<typeof journalObject>;
// Parsing also brings older data up to date (see normalizeJournal()).
export const journalSchema = journalObject.transform((j) =>
  normalizeJournal(j),
);
export const draftSchema = fieldsSchema.extend({ message: text(12000) });
export const workspaceSchema = z
  .object({
    version: z.literal(1),
    author: text(120).min(1),
    journals: z.array(journalSchema).min(1).max(100),
    activeId: z.uuid(),
    drafts: z.record(z.uuid(), draftSchema).optional(),
    // Journals removed from the session, kept so a synchronised post does not
    // bring them back.
    // Journals removed from the session, with the stamp of the removal, kept
    // so that a synchronised post does not bring them back. A journal
    // changed after its removal (imported again, edited) comes back.
    gone: z.record(z.uuid(), stampSchema).optional(),
    // Session code of the live synchronisation, kept on this post only.
    room: z.string().max(40).optional(),
    // Id of this post in the stamps (shared/hlc.ts), kept on this post only.
    node: z.string().regex(NODE).optional(),
    // Key pair signing the exports of this post (shared/signature.ts), kept
    // in the encrypted session only, never synchronised nor exported.
    signing: signingKeySchema.optional(),
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
    // Signature of the post that exported it (shared/signature.ts).
    signature: signatureBlockSchema.optional(),
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
  journal: packJournal(journal),
});
export function parseArchive(input: unknown): Archive {
  const parsed = archiveSchema.safeParse(input);
  if (!parsed.success)
    throw new Error(
      "Fichier orion aic invalide ou version non prise en charge. Le journal actuel est intact.",
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
  const added = plan.added.map((e) => {
    const { suffix: _suffix, ...rest } = e;
    return { ...rest, number: ++number, origin: e.origin || incoming.title };
  });
  // Numbers already used here: a deletion coming from the file keeps its
  // number only if it is free, otherwise it takes the next one (a trace
  // must never show the number of a live entry).
  const used = new Set([
    ...target.entries.map((e) => e.number),
    ...target.deleted.map((d) => d.number),
    ...added.map((e) => e.number),
  ]);
  const deletions = incoming.deleted
    .filter((d) => !known.has(d.id))
    .map((d) => {
      const own = target.entries.find((e) => e.id === d.id);
      if (own)
        return {
          ...d,
          number: own.number,
          createdAt: own.createdAt,
          node: own.node,
        };
      const free = !used.has(d.number);
      const value = free ? d.number : ++number;
      used.add(value);
      number = Math.max(number, value);
      return { ...d, number: value };
    });
  return journalSchema.parse({
    ...target,
    radio: plan.radio.radio,
    deleted: [...target.deleted, ...deletions],
    entries: [...target.entries.filter((e) => !removed.has(e.id)), ...added],
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
export const numberLabel = (entry: Pick<Entry, "number" | "suffix">) =>
  `#${String(entry.number).padStart(3, "0")}${entry.suffix ? `·${entry.suffix}` : ""}`;

// ---------- Labels of numbers shared by several posts ----------

// Letters of the suffixes: no I or O (read as 1 and 0).
const LETTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ";
function hashText(text: string) {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
}
/** Suffixes a post may use, shortest first ("K", "KD", "KDW"). */
export function suffixesOf(node: string): string[] {
  const out: string[] = [];
  let s = "";
  for (let i = 0; i < 3; i++) {
    s += LETTERS[hashText(`${node}:${i}`) % LETTERS.length];
    out.push(s);
  }
  return out;
}
export type Numbered = {
  id: string;
  number: number;
  /** Creation stamp: the earliest keeps the bare number. */
  key: string;
  node: string;
};
/**
 * Labels of items sharing a number: the earliest created (then smallest id)
 * keeps the bare number, each other one gets a suffix derived from the post
 * that created it. The same on every post, whatever the order of arrival;
 * an item created later never changes the label of an earlier one.
 */
export function suffixes(items: Numbered[]): Map<string, string> {
  const groups = new Map<number, Numbered[]>();
  for (const item of items) {
    const list = groups.get(item.number);
    if (list) list.push(item);
    else groups.set(item.number, [item]);
  }
  const out = new Map<string, string>();
  for (const list of groups.values()) {
    if (list.length < 2) continue;
    list.sort((a, b) =>
      a.key !== b.key ? (a.key < b.key ? -1 : 1) : a.id < b.id ? -1 : 1,
    );
    const taken = new Set<string>();
    list.forEach((item, i) => {
      if (i === 0) return;
      const own = suffixesOf(item.node);
      let suffix = own.find((s) => !taken.has(s));
      for (let n = 0; !suffix; n++) {
        const candidate = `${own[1]}${LETTERS[n % LETTERS.length]}${n >= LETTERS.length ? LETTERS[Math.floor(n / LETTERS.length) % LETTERS.length] : ""}`;
        if (!taken.has(candidate) && candidate.length <= 3) suffix = candidate;
        if (n > LETTERS.length * LETTERS.length) suffix = `${own[0]}ZZ`;
      }
      taken.add(suffix);
      out.set(item.id, suffix);
    });
  }
  return out;
}
/** Post of an item: its own, or one derived from its id. */
export const nodeOr = (node: string | undefined, id: string) =>
  node ?? id.replace(/-/g, "").slice(0, 8);
export const createdKey = (at: string | undefined) =>
  at ? canonicalStamp(at) : "";

/** Entry suffixes of a journal (derived from entries and deletions). */
function assignSuffixes(j: JournalData): JournalData {
  const numbers = new Set<number>();
  let collision = false;
  for (const e of j.entries) {
    if (numbers.has(e.number)) collision = true;
    numbers.add(e.number);
  }
  for (const d of j.deleted) {
    if (numbers.has(d.number)) collision = true;
    numbers.add(d.number);
  }
  if (!collision && !j.entries.some((e) => e.suffix)) return j;
  const labels = collision
    ? suffixes([
        ...j.entries.map((e) => ({
          id: e.id,
          number: e.number,
          key: createdKey(e.createdAt),
          node: nodeOr(e.node, e.id),
        })),
        ...j.deleted.map((d) => ({
          id: d.id,
          number: d.number,
          key: createdKey(d.createdAt),
          node: nodeOr(d.node, d.id),
        })),
      ])
    : new Map<string, string>();
  let changed = false;
  const entries = j.entries.map((e) => {
    const suffix = labels.get(e.id);
    if (suffix === e.suffix) return e;
    changed = true;
    if (!suffix) {
      const { suffix: _old, ...rest } = e;
      return rest;
    }
    return { ...e, suffix };
  });
  return changed ? { ...j, entries } : j;
}

// ---------- Messages numbered at reception ----------

const highWater = new WeakMap<HistoryEvent[], number>();
/** Highest message number ever given, removed messages included. */
export function messageHighWater(j: {
  ops: { messages: { number?: number }[] };
  history: HistoryEvent[];
}) {
  let top = highWater.get(j.history);
  if (top === undefined) {
    top = 0;
    for (const e of j.history)
      if (
        e.scope === "ops.messages" &&
        e.state &&
        typeof e.state === "object"
      ) {
        const n = (e.state as { number?: unknown }).number;
        if (typeof n === "number" && n > top) top = n;
      }
    highWater.set(j.history, top);
  }
  for (const m of j.ops.messages)
    if (m.number && m.number > top) top = m.number;
  return top;
}
const received = (iso: string) => {
  const t = Date.parse(iso);
  return Number.isNaN(t) ? 0 : t;
};
/**
 * Number the messages that have none: in order of reception after the
 * highest number ever given. Messages received before 2.1 get the number
 * they were shown with (their rank by time of reception).
 */
function numberMessages(j: JournalData): JournalData {
  const missing = j.ops.messages.filter((m) => !m.number);
  if (!missing.length) return j;
  let top = messageHighWater(j);
  const order = [...missing].sort(
    (a, b) =>
      received(a.receivedAt) - received(b.receivedAt) ||
      a.createdAt.localeCompare(b.createdAt) ||
      a.id.localeCompare(b.id),
  );
  const numbers = new Map(order.map((m) => [m.id, ++top]));
  return {
    ...j,
    ops: {
      ...j.ops,
      messages: j.ops.messages.map((m) =>
        m.number ? m : { ...m, number: numbers.get(m.id)! },
      ),
    },
  };
}

// ---------- Images ----------

/**
 * Images kept once: history states refer to them by hash, live symbols show
 * them. Images nothing refers to any more are dropped.
 */
function storeImages(j: JournalData): JournalData {
  let blobs = j.blobs;
  const own = () => {
    if (blobs === j.blobs) blobs = { ...j.blobs };
    return blobs;
  };
  let history = j.history;
  for (let i = 0; i < history.length; i++) {
    const e = history[i];
    if (!IMAGE_FIELDS[e.scope]) continue;
    const fresh: Record<string, string> = {};
    const state = internState(e.scope, e.state, fresh);
    if (state !== e.state) {
      for (const [key, value] of Object.entries(fresh))
        if (blobs[key] === undefined) own()[key] = value;
      if (history === j.history) history = [...history];
      history[i] = { ...e, state };
    }
  }
  let symbols = j.ops.symbols;
  symbols.forEach((s, i) => {
    if (s.image.startsWith("data:")) {
      const key = blobKey(s.image);
      if (blobs[key] === undefined) own()[key] = s.image;
      return;
    }
    const resolved = resolveState("ops.symbols", s, blobs) as typeof s;
    if (resolved !== s) {
      if (symbols === j.ops.symbols) symbols = [...symbols];
      symbols[i] = resolved;
    }
  });
  const used = new Set<string>();
  for (const e of history) blobsOf(e.scope, e.state, used);
  for (const s of symbols) blobsOf("ops.symbols", s, used);
  for (const key of Object.keys(blobs)) if (!used.has(key)) delete own()[key];
  if (blobs === j.blobs && history === j.history && symbols === j.ops.symbols)
    return j;
  return {
    ...j,
    blobs,
    history,
    ops: symbols === j.ops.symbols ? j.ops : { ...j.ops, symbols },
  };
}

/**
 * Bring a parsed journal up to date, the same way on every post: thin and
 * cap the history, keep images once, number the messages received before
 * 2.1, label entries sharing a number. Idempotent.
 */
export function normalizeJournal(j: JournalData): JournalData {
  let out = j;
  if (out.sync.compacted && out.history.length > COMPACT_FROM) {
    const history = thinHistory(out.history, out.sync.compacted);
    if (history !== out.history) out = { ...out, history };
  }
  if (out.history.length > MAX_HISTORY)
    out = { ...out, history: capHistory(out.history) };
  out = storeImages(out);
  out = numberMessages(out);
  out = assignSuffixes(out);
  return out;
}

/**
 * A journal as stored or sent: images only in journal.blobs, symbols refer
 * to them. Parsing it (journalSchema) puts the images back.
 */
export function packJournal(journal: Journal): Journal {
  if (!journal.ops.symbols.some((s) => s.image.startsWith("data:")))
    return journal;
  return {
    ...journal,
    ops: {
      ...journal.ops,
      symbols: journal.ops.symbols.map((s) => {
        if (!s.image.startsWith("data:")) return s;
        const key = blobKey(s.image);
        return journal.blobs[key] ? { ...s, image: `blob:${key}` } : s;
      }),
    },
  };
}
export const packWorkspace = (workspace: Workspace): Workspace => ({
  ...workspace,
  journals: workspace.journals.map(packJournal),
});
