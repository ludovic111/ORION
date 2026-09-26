import { z } from "zod";

// Records of the conduct follow-up tools: checklists by type of event,
// requests for resources, presences and shifts, weather thresholds and
// export / print reminders. They live in journal.ops like every other
// record (shared/ops.ts): they are synchronised, archived, versioned in the
// history and merged record by record (latest stamp wins).
//
// Kept apart from ops.ts (which imports them) so the logic files
// (checklists.ts, requests.ts…) can import ops.ts without a cycle.

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

// ---------- Checklists ----------

/** Key of a step, stable inside its list ("s04", or random for new steps). */
export const STEP_ID = /^[a-z0-9-]{1,40}$/;
export const checklistStepSchema = z
  .object({
    id: z.string().regex(STEP_ID),
    text: text(500).min(1),
    // Function responsible (référentiel "roles"), free text accepted.
    role: text(120),
    // "Contrôle dans X min": ticking the step creates a follow-up due then.
    minutes: z.number().int().min(0).max(1440),
    // Ticking the step writes a journal entry.
    log: z.boolean(),
  })
  .strict();

/**
 * A template of the journal: a list created by the operators, or a built-in
 * list changed (`builtIn` is then its key and the id is derived from it, so
 * two posts editing the same built-in list merge into one record).
 */
export const checklistTemplateSchema = z
  .object({
    ...record,
    name: text(160).min(1),
    event: text(120),
    description: text(1000),
    steps: z.array(checklistStepSchema).max(80),
    builtIn: text(60).default(""),
    // A built-in list hidden from the choice.
    hidden: z.boolean().default(false),
    order: z.number().int().default(0),
  })
  .strict();

/** A list started for the operation: a copy of the steps of its template. */
export const checklistSchema = z
  .object({
    ...record,
    // "builtin:<key>" or the id of a template of the journal.
    templateId: text(80),
    title: text(200).min(1),
    event: text(120),
    startedAt: instant,
    closedAt: optionalInstant,
    steps: z.array(checklistStepSchema).max(80),
    location: text(300),
    notes: text(2000),
  })
  .strict();

/**
 * One step ticked. Its id is derived from the list and the step
 * (tickId()), so two posts ticking the same step merge into one record and
 * two different steps ticked at the same time never overwrite each other.
 */
export const checklistTickSchema = z
  .object({
    ...record,
    checklistId: z.uuid(),
    stepId: z.string().regex(STEP_ID),
    done: z.boolean(),
    at: instant,
    who: text(120),
    entryId: optionalId,
    note: text(500),
  })
  .strict();

// ---------- Requests for resources ----------

export const REQUEST_STATUSES = [
  "Demandé",
  "Accordé",
  "Refusé",
  "En route",
  "Arrivé",
  "Libéré",
  "Annulé",
] as const;
export type RequestStatus = (typeof REQUEST_STATUSES)[number];

export const requestStepSchema = z
  .object({
    at: instant,
    status: z.enum(REQUEST_STATUSES),
    by: text(120),
    note: text(500),
    entryId: optionalId,
  })
  .strict();

export const requestSchema = z
  .object({
    ...record,
    // What is asked for ("Groupe électrogène 20 kVA").
    title: text(200).min(1),
    // Type of resource (référentiel "resourceKinds").
    kind: text(80),
    quantity: z.number().int().min(0).max(100000),
    unit: text(40),
    requester: text(200),
    // Organisation asked (référentiel "organizations") and its contact.
    provider: text(200),
    contact: text(200),
    destination: text(300),
    reason: text(2000),
    priority: z.enum(["Normal", "Important", "Urgent"]).default("Normal"),
    status: z.enum(REQUEST_STATUSES),
    requestedAt: instant,
    // Expected arrival: a warning shows when it is past.
    eta: optionalInstant,
    // Resource created or attached on arrival.
    resourceId: optionalId,
    // Journal entry of the request (closed when the request ends).
    entryId: optionalId,
    steps: z.array(requestStepSchema).max(60).default([]),
    notes: text(2000),
  })
  .strict();

// ---------- Presences and shifts ----------

/** One stay at the command post: arrival, departure. */
export const presenceSchema = z
  .object({
    ...record,
    memberId: optionalId,
    // Name at the time (kept when the person is removed from the team).
    name: text(160),
    in: instant,
    out: optionalInstant,
    // "Bouton", "QR", "Saisie".
    via: text(40),
    note: text(500),
  })
  .strict();

/** A shift of the plan de relève. */
export const shiftSchema = z
  .object({
    ...record,
    title: text(120).min(1),
    start: instant,
    end: instant,
    memberIds: z.array(z.uuid()).max(200).default([]),
    // People not in the team module, free text.
    people: text(1000),
    notes: text(1000),
  })
  .strict();

// ---------- Weather thresholds ----------

export const THRESHOLD_METRICS = [
  "gusts",
  "wind",
  "rain1h",
  "rain24h",
  "tmax",
  "tmin",
] as const;
export type ThresholdMetric = (typeof THRESHOLD_METRICS)[number];

export const thresholdSchema = z
  .object({
    ...record,
    metric: z.enum(THRESHOLD_METRICS),
    value: z.number().min(-60).max(1000),
    level: z.enum(["1", "2", "3", "4", "5"]),
    label: text(120),
    region: text(200),
    active: z.boolean(),
    // Also write an entry "à suivre" in the journal when crossed.
    followUp: z.boolean(),
  })
  .strict();

// ---------- Reminders ----------

export const REMINDER_ACTIONS = ["export", "print", "point", "other"] as const;
export type ReminderAction = (typeof REMINDER_ACTIONS)[number];

export const reminderSchema = z
  .object({
    ...record,
    title: text(200).min(1),
    action: z.enum(REMINDER_ACTIONS),
    // Every N minutes (0: not periodic).
    every: z.number().int().min(0).max(1440),
    // N minutes before each rapport de conduite (0: not tied to reports).
    before: z.number().int().min(0).max(600),
    active: z.boolean(),
    // Last time an operator marked it done.
    doneAt: optionalInstant,
    notes: text(1000),
  })
  .strict();

export type ChecklistStep = z.infer<typeof checklistStepSchema>;
export type ChecklistTemplate = z.infer<typeof checklistTemplateSchema>;
export type Checklist = z.infer<typeof checklistSchema>;
export type ChecklistTick = z.infer<typeof checklistTickSchema>;
export type ResourceRequest = z.infer<typeof requestSchema>;
export type RequestStep = z.infer<typeof requestStepSchema>;
export type Presence = z.infer<typeof presenceSchema>;
export type Shift = z.infer<typeof shiftSchema>;
export type Threshold = z.infer<typeof thresholdSchema>;
export type Reminder = z.infer<typeof reminderSchema>;
