import { z } from "zod";
import { messageHighWater, type Journal } from "./journal.ts";
import { stableId } from "./history.ts";
import { fromZurichWall, zurichWall } from "./time.ts";
import { getLang } from "./i18n/core.ts";
import { enumLabel } from "./i18n/enums.ts";
import { t as tr } from "./i18n/exercise.ts";
import {
  INJECT_CHANNELS,
  INJECT_DELIVERIES,
  INJECT_TIMINGS,
  MESSAGE_PRIORITIES,
  injectEffectSchema,
  upsert,
  type Inject,
  type InjectEffect,
  type Ops,
  type Scenario,
} from "./ops.ts";

// Exercises: a scenario of timed injects written by the direction of the
// exercise, delivered at their time as incoming messages (or read out by
// the direction), and the reaction of the players measured afterwards.
// Never in an intervention journal: every entry point checks isExercise().

const MINUTE = 60_000;

export const isExercise = (journal: Pick<Journal, "mode">) =>
  journal.mode === "Exercice";

/** The scenario of a journal (the first one; one per journal in practice). */
export const scenarioOf = (ops: Pick<Ops, "scenarios">): Scenario | undefined =>
  [...ops.scenarios].sort((a, b) => a.createdAt.localeCompare(b.createdAt))[0];

/** Injects of a scenario (all injects when the scenario is unknown). */
export const injectsOf = (ops: Pick<Ops, "injects">, scenario?: Scenario) =>
  ops.injects.filter(
    (i) => !scenario || !i.scenarioId || i.scenarioId === scenario.id,
  );

// ---------- Schedule ----------

type Timing = Pick<Inject, "timing" | "offset" | "clock" | "day">;

/**
 * Time an inject is due (ms), or null before the start of the exercise.
 * "offset": T0 + minutes (real minutes, also across a change of hour).
 * "clock": hh:mm Zurich time on the day `day` of the exercise (0: the day
 * of T0), exact across the changes of hour (shared/time.ts).
 */
export function dueAt(inject: Timing, startAt: string | number): number | null {
  const start = typeof startAt === "number" ? startAt : Date.parse(startAt);
  if (!Number.isFinite(start)) return null;
  if (inject.timing === "offset") return start + inject.offset * MINUTE;
  const m = /^(\d{2}):(\d{2})$/.exec(inject.clock);
  if (!m) return null;
  const w = zurichWall(start);
  const date = new Date(Date.UTC(w.year, w.month - 1, w.day + inject.day));
  return fromZurichWall({
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
    hour: Number(m[1]),
    minute: Number(m[2]),
    second: 0,
  });
}

/** "T+01:25" for a time relative to T0 (negative: "T-00:05"). */
export function tPlus(at: number, start: number): string {
  const minutes = Math.round((at - start) / MINUTE);
  const sign = minutes < 0 ? "-" : "+";
  const abs = Math.abs(minutes);
  return `T${sign}${String(Math.floor(abs / 60)).padStart(2, "0")}:${String(abs % 60).padStart(2, "0")}`;
}

export type Scheduled = { inject: Inject; due: number | null };

/** Injects in the order they are due (not yet scheduled ones last). */
export function schedule(
  injects: Inject[],
  scenario: Pick<Scenario, "startAt"> | undefined,
): Scheduled[] {
  return injects
    .map((inject) => ({ inject, due: dueAt(inject, scenario?.startAt ?? "") }))
    .sort(
      (a, b) =>
        (a.due ?? Infinity) - (b.due ?? Infinity) ||
        a.inject.order - b.inject.order ||
        a.inject.id.localeCompare(b.inject.id),
    );
}

/** Injects due at `now`, not delivered nor skipped, in order. */
export function dueInjects(
  ops: Pick<Ops, "injects" | "scenarios">,
  now: number,
): Inject[] {
  const scenario = scenarioOf(ops);
  if (!scenario?.startAt || scenario.endedAt) return [];
  return schedule(injectsOf(ops, scenario), scenario)
    .filter(
      ({ inject, due }) =>
        due !== null && due <= now && !inject.deliveredAt && !inject.skipped,
    )
    .map(({ inject }) => inject);
}

// ---------- Delivery ----------

/** Id of the message of an inject: the same on every post (no duplicate). */
export const injectMessageId = (injectId: string) =>
  stableId(`orion-aic-inject-message:${injectId}`);

const same = (a: string, b: string) =>
  a.trim().toLocaleLowerCase("fr") === b.trim().toLocaleLowerCase("fr");

function applyEffect(
  ops: Ops,
  effect: InjectEffect,
  author: string,
  at: string,
): Ops {
  if (effect.kind === "resource") {
    const found = ops.resources.find((r) => same(r.name, effect.name));
    return upsert(
      ops,
      "resources",
      found
        ? {
            ...found,
            status: effect.status,
            location: effect.location || found.location,
          }
        : {
            name: effect.name,
            kind: "",
            organization: "",
            callsign: "",
            count: 1,
            status: effect.status,
            location: effect.location,
            mission: "",
            eta: "",
            contact: "",
            notes: tr("Créé par un inject d’exercice."),
          },
      author,
    );
  }
  if (effect.kind === "fact") {
    const found = ops.facts.find((f) => same(f.label, effect.label));
    return upsert(
      ops,
      "facts",
      found
        ? { ...found, value: effect.value, unit: effect.unit || found.unit }
        : {
            label: effect.label,
            value: effect.value,
            unit: effect.unit,
            category: "",
            note: "",
            order: ops.facts.length,
          },
      author,
    );
  }
  return upsert(
    ops,
    "observations",
    {
      at,
      place: effect.place,
      temperature: effect.temperature,
      wind: effect.wind,
      precipitation: effect.precipitation,
      visibility: "",
      conditions: effect.conditions,
      notes: tr("Observation transmise par un inject d’exercice."),
    },
    author,
  );
}

/**
 * Deliver an inject: its message arrives in Messages (delivery "message"),
 * its effects are applied (resource status, key fact, weather observation)
 * and it is marked delivered. Idempotent: an inject already delivered is
 * left as is, and the message id is derived from the inject so that two
 * posts delivering at once create the same message.
 */
export function deliverInject(
  journal: Pick<Journal, "ops" | "history">,
  injectId: string,
  author: string,
  now = Date.now(),
): Ops {
  let ops = journal.ops;
  const inject = ops.injects.find((i) => i.id === injectId);
  if (!inject || inject.deliveredAt) return ops;
  const at = new Date(now).toISOString();
  let messageId = "";
  if (inject.delivery === "message") {
    messageId = injectMessageId(inject.id);
    if (!ops.messages.some((m) => m.id === messageId))
      ops = upsert(
        ops,
        "messages",
        {
          id: messageId,
          createdAt: at,
          receivedAt: at,
          from: inject.from,
          to: inject.to,
          via: inject.via,
          priority: inject.priority,
          category: inject.category,
          subject: inject.title,
          body: inject.body,
          location: "",
          coordinates: "",
          replyNeeded: inject.deadline > 0,
          replyBy: inject.deadline
            ? new Date(now + inject.deadline * MINUTE).toISOString()
            : "",
          status: "Nouveau",
          entryId: "",
          handledBy: "",
          notes: "",
          tags: ["exercice"],
          number: messageHighWater({ ...journal, ops }) + 1,
        },
        author,
      );
  }
  for (const effect of inject.effects)
    ops = applyEffect(ops, effect, author, at);
  const latest = ops.injects.find((i) => i.id === injectId)!;
  return upsert(
    ops,
    "injects",
    { ...latest, deliveredAt: at, messageId },
    author,
  );
}

// ---------- Reaction ----------

export type Reaction = {
  inject: Inject;
  due: number | null;
  delivered: number | null;
  /** First reaction of the players (ms), if any. */
  reacted: number | null;
  /** What counted as the reaction. */
  how: string;
  /** Minutes from delivery to reaction. */
  minutes: number | null;
  /** Deadline (ms) when the inject has one. */
  deadline: number | null;
  /** Reaction after the deadline, or none and the deadline passed. */
  late: boolean;
  /** Minutes past the deadline (0 when on time). */
  delay: number;
};

type ReactionSource = Pick<Journal, "ops" | "history" | "entries">;

/** "message en traitement": state of a message, in the language of the post. */
const messageHow = (status: string) =>
  tr("message {status}", {
    status:
      getLang() === "de" ? enumLabel(status) : enumLabel(status).toLowerCase(),
  });

/** First time a message left the state « Nouveau » (ms), if ever. */
export function treatedAt(
  journal: Pick<Journal, "ops" | "history" | "entries">,
  messageId: string,
): { at: number; how: string } | null {
  const message = journal.ops.messages.find((m) => m.id === messageId);
  const candidates: { at: number; how: string }[] = [];
  for (const e of journal.history) {
    if (e.scope !== "ops.messages" || e.target !== messageId || !e.state)
      continue;
    const status = (e.state as { status?: string }).status;
    if (status && status !== "Nouveau")
      candidates.push({
        at: Date.parse(e.at),
        how: messageHow(status),
      });
  }
  if (message && message.status !== "Nouveau" && !candidates.length)
    candidates.push({
      at: Date.parse(message.updatedAt),
      how: messageHow(message.status),
    });
  const entryId = message?.entryId;
  if (entryId) {
    const entry = journal.entries.find((x) => x.id === entryId);
    if (entry)
      candidates.push({
        at: Date.parse(entry.createdAt),
        how: tr("inscrit au journal"),
      });
  }
  const self = `message:${messageId}`;
  for (const l of journal.ops.links)
    if (l.a === self || l.b === self)
      candidates.push({
        at: Date.parse(l.createdAt),
        how: (l.a === self ? l.b : l.a).startsWith("entry:")
          ? tr("entrée liée")
          : tr("élément lié"),
      });
  const valid = candidates.filter((c) => Number.isFinite(c.at));
  if (!valid.length) return null;
  return valid.reduce((a, b) => (b.at < a.at ? b : a));
}

/**
 * Reaction to an inject: the manual mark of the direction, or the first
 * sign on the message it created (treated, written to the journal, linked
 * to an entry or a mission).
 */
export function reactionOf(
  journal: ReactionSource,
  inject: Inject,
  startAt: string,
  now = Date.now(),
): Reaction {
  const due = dueAt(inject, startAt);
  const delivered = inject.deliveredAt ? Date.parse(inject.deliveredAt) : null;
  const found: { at: number; how: string }[] = [];
  if (inject.reactedAt)
    found.push({
      at: Date.parse(inject.reactedAt),
      how: inject.reactionNote || tr("marquée par la direction"),
    });
  if (inject.messageId) {
    const t = treatedAt(journal, inject.messageId);
    if (t) found.push(t);
  }
  const first = found
    .filter(
      (f) =>
        Number.isFinite(f.at) &&
        (delivered === null || f.at >= delivered - MINUTE),
    )
    .reduce<{ at: number; how: string } | null>(
      (a, b) => (!a || b.at < a.at ? b : a),
      null,
    );
  const reacted =
    delivered !== null && first ? Math.max(first.at, delivered) : null;
  const minutes =
    reacted !== null && delivered !== null
      ? Math.round((reacted - delivered) / MINUTE)
      : null;
  const deadline =
    delivered !== null && inject.deadline > 0
      ? delivered + inject.deadline * MINUTE
      : null;
  const end = reacted ?? now;
  const late = deadline !== null && end > deadline;
  return {
    inject,
    due,
    delivered,
    reacted,
    how: first?.how ?? "",
    minutes,
    deadline,
    late,
    delay:
      late && deadline !== null ? Math.round((end - deadline) / MINUTE) : 0,
  };
}

/** Reactions of every inject of the journal's scenario, in order. */
export function reactions(
  journal: ReactionSource,
  now = Date.now(),
): Reaction[] {
  const scenario = scenarioOf(journal.ops);
  const startAt = scenario?.startAt ?? "";
  return schedule(injectsOf(journal.ops, scenario), scenario).map(
    ({ inject }) => reactionOf(journal, inject, startAt, now),
  );
}

// ---------- Scenario files (JSON) ----------

export const SCENARIO_FORMAT = "orion-aic-scenario";

const text = (max = 500) => z.string().max(max);
export const scenarioInjectSchema = z
  .object({
    title: text(200).min(1),
    timing: z.enum(INJECT_TIMINGS).default("offset"),
    offset: z
      .number()
      .int()
      .min(0)
      .max(60 * 24 * 14)
      .default(0),
    clock: z
      .union([z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/), z.literal("")])
      .default(""),
    day: z.number().int().min(0).max(14).default(0),
    from: text(200).default(""),
    to: text(200).default(""),
    via: z.enum(INJECT_CHANNELS).default("Message"),
    priority: z.enum(MESSAGE_PRIORITIES).default("Normal"),
    category: text(80).default(""),
    body: text(12000).default(""),
    delivery: z.enum(INJECT_DELIVERIES).default("message"),
    expected: text(4000).default(""),
    deadline: z
      .number()
      .int()
      .min(0)
      .max(24 * 60)
      .default(0),
    effects: z.array(injectEffectSchema).max(10).default([]),
  })
  .strict()
  .refine((i) => i.timing === "offset" || i.clock !== "", {
    error: () =>
      tr("Une heure (hh:mm) est requise pour un inject à heure fixe."),
  });
export const scenarioFileSchema = z
  .object({
    format: z.literal(SCENARIO_FORMAT),
    version: z.literal(1),
    title: text(200).min(1),
    description: text(4000).default(""),
    exportedAt: z.iso.datetime({ offset: true }).optional(),
    injects: z.array(scenarioInjectSchema).max(2000),
  })
  .strict();
export type ScenarioFile = z.infer<typeof scenarioFileSchema>;
export type ScenarioInject = z.infer<typeof scenarioInjectSchema>;

/** Scenario file of a journal: the injects without their run (portable). */
export function exportScenario(
  ops: Pick<Ops, "scenarios" | "injects">,
  at = new Date().toISOString(),
): ScenarioFile {
  const scenario = scenarioOf(ops);
  return {
    format: SCENARIO_FORMAT,
    version: 1,
    title: scenario?.title ?? tr("Scénario"),
    description: scenario?.description ?? "",
    exportedAt: at,
    injects: schedule(injectsOf(ops, scenario), scenario).map(
      ({ inject: i }) => ({
        title: i.title,
        timing: i.timing,
        offset: i.offset,
        clock: i.clock,
        day: i.day,
        from: i.from,
        to: i.to,
        via: i.via,
        priority: i.priority,
        category: i.category,
        body: i.body,
        delivery: i.delivery,
        expected: i.expected,
        deadline: i.deadline,
        effects: i.effects,
      }),
    ),
  };
}

/** Read a scenario file (text or parsed JSON); throws a French message. */
export function parseScenarioFile(input: unknown): ScenarioFile {
  let value = input;
  if (typeof input === "string") {
    try {
      value = JSON.parse(input);
    } catch {
      throw new Error(tr("Ce fichier n’est pas un scénario JSON lisible."));
    }
  }
  if (
    !value ||
    typeof value !== "object" ||
    (value as { format?: unknown }).format !== SCENARIO_FORMAT
  )
    throw new Error(
      tr(
        "Ce fichier n’est pas un scénario orion aic (format « orion-aic-scenario »).",
      ),
    );
  const parsed = scenarioFileSchema.safeParse(value);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw new Error(
      tr("Scénario invalide{path} : {reason}.", {
        path: issue?.path.length ? ` (${issue.path.join(".")})` : "",
        reason: issue?.message ?? tr("format inconnu"),
      }),
    );
  }
  return parsed.data;
}

/**
 * Put a scenario file into a journal: the scenario is replaced (title,
 * description) and its injects are added (new ids, not delivered). With
 * `replace`, the injects not yet delivered are removed first.
 */
export function importScenario(
  ops: Ops,
  file: ScenarioFile,
  author: string,
  { replace = true }: { replace?: boolean } = {},
): Ops {
  let next = ops;
  const existing = scenarioOf(next);
  next = upsert(
    next,
    "scenarios",
    existing
      ? { ...existing, title: file.title, description: file.description }
      : {
          title: file.title,
          description: file.description,
          startAt: "",
          endedAt: "",
          autoplay: false,
        },
    author,
  );
  const scenario = scenarioOf(next)!;
  if (replace)
    next = {
      ...next,
      injects: next.injects.filter((i) => i.deliveredAt),
    };
  const base = next.injects.reduce((n, i) => Math.max(n, i.order + 1), 0);
  file.injects.forEach((i, k) => {
    next = upsert(
      next,
      "injects",
      {
        ...i,
        scenarioId: scenario.id,
        order: base + k,
        deliveredAt: "",
        messageId: "",
        reactedAt: "",
        reactionRef: "",
        reactionNote: "",
        skipped: false,
      },
      author,
    );
  });
  return next;
}

/** A new inject with sensible defaults (T0 + offset). */
export function blankInject(
  order: number,
  offset = 0,
): Omit<Inject, "id" | "createdAt" | "updatedAt" | "by"> {
  return {
    scenarioId: "",
    order,
    title: "",
    timing: "offset",
    offset,
    clock: "",
    day: 0,
    from: "",
    to: "",
    via: "Message",
    priority: "Normal",
    category: "Renseignement",
    body: "",
    delivery: "message",
    expected: "",
    deadline: 0,
    effects: [],
    deliveredAt: "",
    messageId: "",
    reactedAt: "",
    reactionRef: "",
    reactionNote: "",
    skipped: false,
  };
}
