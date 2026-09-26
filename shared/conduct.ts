import { z } from "zod";

// Records of the conduct of the operation, next to the journal: structured
// orders, diffusions with read receipts, assignments to a function or a
// person, liaisons with another command post and what crossed them.
//
// Every record carries its own id, creation, modification and author, like
// the other collections of shared/ops.ts (which gathers them in opsSchema):
// they sync, merge (latest change wins, per record), archive and appear in
// the history. Receipts (acks) are only ever created, never changed: two
// posts acknowledging at the same time give two receipts, both kept.

const text = (max = 500) => z.string().max(max);
const instant = z.iso.datetime({ offset: true });
const optionalInstant = z.union([instant, z.literal("")]);
const optionalId = z.union([z.uuid(), z.literal("")]);
const record = {
  id: z.uuid(),
  createdAt: instant,
  updatedAt: instant,
  by: text(120),
};
/** "kind:uuid" (same form as the links of shared/links.ts). */
export const anyRef = z
  .string()
  .max(60)
  .regex(
    /^[a-z]{2,20}:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  );

// ---------- Orders ----------

export const ORDER_STATUSES = ["Brouillon", "Émis", "Annulé"] as const;
export const ORDER_KINDS = [
  "Ordre d’engagement",
  "Ordre complémentaire",
  "Ordre préparatoire",
  "Ordre de relève",
] as const;

/** One line of chapter 3 (Missions): who does what, by when. */
export const orderMissionSchema = z
  .object({
    id: z.uuid(),
    /** Unit, cell or team ("Section appui", "Équipe Bravo"). */
    unit: text(200),
    task: text(4000),
    /** Function in charge (for "Mes tâches"). */
    role: text(120).default(""),
    dueAt: optionalInstant.default(""),
    /** Resources, people, entries… this mission uses. */
    refs: z.array(anyRef).max(20).default([]),
    done: z.boolean().default(false),
  })
  .strict();

// Swiss order scheme (armée / PCi): 1 Orientation, 2 Intention,
// 3 Missions, 4 Dispositions particulières, 5 Emplacements et liaisons.
export const orderSchema = z
  .object({
    ...record,
    // Given at creation and never changed; told apart like the entries when
    // two posts give the same one (see orderLabels in shared/orders.ts).
    number: z.number().int().positive(),
    node: z
      .string()
      .regex(/^[0-9a-z]{8}$/)
      .optional(),
    kind: text(80).default("Ordre d’engagement"),
    /** Order this one complements (ordre complémentaire). */
    baseId: optionalId.default(""),
    title: text(200).min(1),
    status: z.enum(ORDER_STATUSES).default("Brouillon"),
    issuedAt: optionalInstant.default(""),
    /** Who signs the order (chef d’intervention…). */
    issuer: text(200).default(""),
    // 1 Orientation
    situation: text(8000).default(""),
    danger: text(8000).default(""),
    neighbours: text(4000).default(""),
    // 2 Intention
    intention: text(8000).default(""),
    // 3 Missions
    missions: z.array(orderMissionSchema).max(60).default([]),
    // 4 Dispositions particulières
    logistics: text(4000).default(""),
    medical: text(4000).default(""),
    safety: text(4000).default(""),
    // 5 Emplacements et liaisons
    pc: text(1000).default(""),
    radio: text(4000).default(""),
    reports: text(2000).default(""),
    /** Functions, cells, posts or command posts that receive it. */
    distribution: z.array(text(120).min(1)).max(50).default([]),
    /** Diffusion created when the order was issued. */
    broadcastId: optionalId.default(""),
    /** Journal entry "Ordre n° X émis". */
    entryId: optionalId.default(""),
    notes: text(4000).default(""),
    /** Command post it came from (received through a liaison). */
    source: text(200).default(""),
  })
  .strict();

// ---------- Diffusion and read receipts ----------

export const ACK_KINDS = ["Lu", "Compris"] as const;
export const BROADCAST_ACKS = ["Lu", "Compris", "Aucun"] as const;
export const BROADCAST_PRIORITIES = ["Normal", "Important", "Urgent"] as const;

export const broadcastSchema = z
  .object({
    ...record,
    sentAt: instant,
    title: text(300).min(1),
    body: text(8000).default(""),
    kind: text(60).default("Information"),
    priority: z.enum(BROADCAST_PRIORITIES).default("Normal"),
    /** Item diffused (order, entry, message…), if any. */
    target: z.union([anyRef, z.literal("")]).default(""),
    /** Functions, cells, posts or command posts ("Tous": everyone). */
    recipients: z.array(text(120).min(1)).min(1).max(50),
    /** Receipt asked of each recipient. */
    ack: z.enum(BROADCAST_ACKS).default("Lu"),
    /** Minutes after which a missing receipt is flagged (0: never). */
    deadline: z
      .number()
      .int()
      .min(0)
      .max(24 * 60)
      .default(10),
    /** Function and name of the sender, as shown to the recipients. */
    sender: text(240).default(""),
    /** Follow-up stopped (no more reminders). */
    closedAt: optionalInstant.default(""),
    /** Command post it came from (received through a liaison). */
    source: text(200).default(""),
  })
  .strict();

// A receipt: one per recipient satisfied. Never modified.
export const ackSchema = z
  .object({
    ...record,
    broadcastId: z.uuid(),
    /** Recipient of the diffusion this receipt answers ("Logistique"). */
    recipient: text(120).min(1),
    kind: z.enum(ACK_KINDS),
    at: instant,
    /** Name and function of the post that acknowledged. */
    post: text(120).default(""),
    role: text(120).default(""),
    note: text(1000).default(""),
    /** Command post it came from (received through a liaison). */
    source: text(200).default(""),
  })
  .strict();

// ---------- Assignments ----------

// Any item (entry, message, rendez-vous, moyen…) assigned to a function
// and/or a person, shown in "Mes tâches" of the posts concerned.
export const assignmentSchema = z
  .object({
    ...record,
    target: anyRef,
    role: text(120).default(""),
    person: text(160).default(""),
    dueAt: optionalInstant.default(""),
    done: z.boolean().default(false),
    note: text(2000).default(""),
  })
  .strict();

// ---------- Liaison with another command post ----------

export const liaisonSchema = z
  .object({
    ...record,
    /** The other command post ("PC arrière"). */
    name: text(120).min(1),
    /** How this command post is named on the other side ("PC front"). */
    self: text(120).min(1),
    /**
     * Liaison code (same form as a session code, another room). Emptied
     * when the liaison is closed.
     */
    code: text(24).default(""),
    openedAt: instant,
    closedAt: optionalInstant.default(""),
    notes: text(2000).default(""),
  })
  .strict();

export const EXCHANGE_KINDS = ["message", "broadcast", "ack"] as const;
// What crossed a liaison, both ways. Outgoing: waits until the other
// command post confirms reception (deliveredAt). Incoming: its id is the id
// of the envelope, so that several posts receiving it keep one.
export const exchangeSchema = z
  .object({
    ...record,
    liaisonId: z.uuid(),
    direction: z.enum(["out", "in"]),
    kind: z.enum(EXCHANGE_KINDS),
    title: text(300).default(""),
    /** Record sent or created ("broadcast:…", "message:…"). */
    target: z.union([anyRef, z.literal("")]).default(""),
    /** Envelope sent (JSON, see shared/liaison.ts). */
    payload: text(80_000).default(""),
    sentAt: optionalInstant.default(""),
    deliveredAt: optionalInstant.default(""),
  })
  .strict();

export type Order = z.infer<typeof orderSchema>;
export type OrderMission = z.infer<typeof orderMissionSchema>;
export type Broadcast = z.infer<typeof broadcastSchema>;
export type Ack = z.infer<typeof ackSchema>;
export type Assignment = z.infer<typeof assignmentSchema>;
export type Liaison = z.infer<typeof liaisonSchema>;
export type Exchange = z.infer<typeof exchangeSchema>;

/** Standard values of the référentiels added by these features. */
export const CONDUCT_LISTS: Record<
  string,
  { label: string; values: string[] }
> = {
  postRoles: {
    label: "Fonctions des postes",
    values: [
      "Chef d’intervention",
      "Chef situation",
      "Aide à la conduite",
      "Logistique",
      "Télématique",
      "Personnel / admin",
      "Liaison",
    ],
  },
  orderKinds: {
    label: "Types d’ordre",
    values: [...ORDER_KINDS],
  },
  broadcastKinds: {
    label: "Types de diffusion",
    values: ["Information", "Consigne", "Ordre", "Message", "Alerte"],
  },
};
