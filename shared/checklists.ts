import {
  addEntry,
  emptyFields,
  journalSchema,
  overdue,
  time,
  type Entry,
  type Journal,
} from "./journal.ts";
import { upsert, type Ops } from "./ops.ts";
import { stableId } from "./history.ts";
import { BUILTIN_TEMPLATES } from "./checklist-library.ts";
import type {
  Checklist,
  ChecklistStep,
  ChecklistTemplate,
  ChecklistTick,
} from "./conduct-schemas.ts";

export { BUILTIN_TEMPLATES } from "./checklist-library.ts";

// Checklists by type of event: templates (built in, changed or created in
// the journal), lists started for the operation, and ticks.
//
// Merge: a started list copies the steps of its template, so changing a
// template never changes a running list. Each tick is its own record whose
// id derives from the list and the step (tickId), so two posts ticking two
// steps at once both keep their tick, and the same step ticked on two posts
// is one record (latest wins).

export type TemplateView = {
  /** "builtin:<key>" or the id of a template of the journal. */
  id: string;
  name: string;
  event: string;
  description: string;
  steps: ChecklistStep[];
  /** Key of the built-in list it comes from ("" for a list of the journal). */
  builtIn: string;
  /** Record of the journal holding it (a changed built-in, or an own list). */
  recordId: string;
  hidden: boolean;
  /** Built-in list changed in the journal. */
  changed: boolean;
  order: number;
};

export const builtinRef = (key: string) => `builtin:${key}`;
/** Id of the record that overrides a built-in list: the same on every post. */
export const templateRecordId = (key: string) =>
  stableId(`checklist-template|${key}`);
/** Id of the tick of a step: the same on every post. */
export const tickId = (checklistId: string, stepId: string) =>
  stableId(`checklist-tick|${checklistId}|${stepId}`);
/** New key for a step added by an operator. */
export const newStepId = () =>
  `n${crypto.randomUUID().replace(/-/g, "").slice(0, 10)}`;

/** Every template: built-in lists (as changed in the journal) and own lists. */
export function templates(ops: Ops): TemplateView[] {
  const own = ops.checklistTemplates;
  const out: TemplateView[] = BUILTIN_TEMPLATES.map((b, i) => {
    const override = own.find((t) => t.builtIn === b.key);
    return {
      id: builtinRef(b.key),
      name: override?.name ?? b.name,
      event: override?.event ?? b.event,
      description: override?.description ?? b.description,
      steps: override?.steps ?? b.steps,
      builtIn: b.key,
      recordId: override?.id ?? "",
      hidden: override?.hidden ?? false,
      changed: !!override,
      order: override?.order ?? i,
    };
  });
  for (const t of own)
    if (!t.builtIn || !BUILTIN_TEMPLATES.some((b) => b.key === t.builtIn))
      out.push({
        id: t.id,
        name: t.name,
        event: t.event,
        description: t.description,
        steps: t.steps,
        builtIn: "",
        recordId: t.id,
        hidden: t.hidden,
        changed: false,
        order: t.order || 100,
      });
  return out.sort(
    (a, b) => a.order - b.order || a.name.localeCompare(b.name, "fr"),
  );
}

export const findTemplate = (ops: Ops, id: string) =>
  templates(ops).find((t) => t.id === id);

/** Save a template: a built-in list becomes its override record. */
export function saveTemplate(
  ops: Ops,
  view: Pick<
    TemplateView,
    "id" | "name" | "event" | "description" | "steps" | "builtIn" | "hidden"
  > & { order?: number },
  author: string,
): { ops: Ops; id: string } {
  const id = view.builtIn
    ? templateRecordId(view.builtIn)
    : view.id && !view.id.startsWith("builtin:")
      ? view.id
      : crypto.randomUUID();
  const value: Omit<ChecklistTemplate, "createdAt" | "updatedAt" | "by"> = {
    id,
    name: view.name.trim() || "Liste sans nom",
    event: view.event,
    description: view.description,
    steps: view.steps.filter((s) => s.text.trim()),
    builtIn: view.builtIn,
    hidden: view.hidden,
    order: view.order ?? 100,
  };
  return { ops: upsert(ops, "checklistTemplates", value, author), id };
}

/** Copy of a template as a new own list ("Copie de …"). */
export function duplicateTemplate(
  ops: Ops,
  view: TemplateView,
  author: string,
): { ops: Ops; id: string } {
  return saveTemplate(
    ops,
    {
      ...view,
      id: "",
      builtIn: "",
      hidden: false,
      name: `${view.name} (copie)`,
      steps: view.steps.map((s) => ({ ...s })),
    },
    author,
  );
}

/** Start a list for the operation from a template. */
export function startChecklist(
  ops: Ops,
  template: Pick<TemplateView, "id" | "name" | "event" | "steps">,
  author: string,
  at: string,
  extra: { title?: string; location?: string; notes?: string } = {},
): { ops: Ops; id: string } {
  const id = crypto.randomUUID();
  const value: Omit<Checklist, "createdAt" | "updatedAt" | "by"> = {
    id,
    templateId: template.id,
    title: (extra.title ?? template.name).trim() || template.name,
    event: template.event,
    startedAt: at,
    closedAt: "",
    steps: template.steps.map((s) => ({ ...s })),
    location: extra.location ?? "",
    notes: extra.notes ?? "",
  };
  return { ops: upsert(ops, "checklists", value, author), id };
}

/** Ticks of a list, by step (only the steps it still has). */
export function ticksOf(
  ops: Pick<Ops, "checklistTicks">,
  checklist: Pick<Checklist, "id" | "steps">,
): Map<string, ChecklistTick> {
  const steps = new Set(checklist.steps.map((s) => s.id));
  const out = new Map<string, ChecklistTick>();
  for (const t of ops.checklistTicks)
    if (t.checklistId === checklist.id && steps.has(t.stepId))
      out.set(t.stepId, t);
  return out;
}

export type Progress = {
  done: number;
  total: number;
  /** 0 to 1. */
  ratio: number;
  /** First step not ticked. */
  next: ChecklistStep | null;
  /** Follow-ups opened by ticks whose control time is past. */
  late: number;
  complete: boolean;
};

export function progress(
  journal: Pick<Journal, "ops" | "entries">,
  checklist: Checklist,
  at = Date.now(),
): Progress {
  const ticks = ticksOf(journal.ops, checklist);
  const done = checklist.steps.filter((s) => ticks.get(s.id)?.done).length;
  const total = checklist.steps.length;
  const entries = new Map(journal.entries.map((e) => [e.id, e]));
  let late = 0;
  for (const t of ticks.values()) {
    const e = t.done && t.entryId ? entries.get(t.entryId) : undefined;
    if (e && overdue(e, at)) late++;
  }
  return {
    done,
    total,
    ratio: total ? done / total : 0,
    next: checklist.steps.find((s) => !ticks.get(s.id)?.done) ?? null,
    late,
    complete: total > 0 && done === total,
  };
}

/** Lists still running (not closed), newest first. */
export const openChecklists = (ops: Ops) =>
  ops.checklists
    .filter((c) => !c.closedAt)
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt));

const addMinutes = (iso: string, minutes: number) =>
  new Date(Date.parse(iso) + minutes * 60_000).toISOString();

/**
 * Tick a step: records who and when, and, when the step says so (or has a
 * control timer), writes a journal entry. A step with "contrôle dans X min"
 * opens a follow-up ("À traiter") due X minutes later.
 */
export function tickStep(
  journal: Journal,
  checklistId: string,
  stepId: string,
  {
    author,
    at = new Date().toISOString(),
    log,
    note = "",
  }: { author: string; at?: string; log?: boolean; note?: string },
): Journal {
  const checklist = journal.ops.checklists.find((c) => c.id === checklistId);
  if (!checklist) throw new Error("Liste de contrôle introuvable.");
  const step = checklist.steps.find((s) => s.id === stepId);
  if (!step) throw new Error("Étape introuvable.");
  const writes = log ?? step.log;
  let next = journal;
  let entryId = "";
  if (writes || step.minutes > 0) {
    const due = step.minutes > 0 ? addMinutes(at, step.minutes) : "";
    next = addEntry(
      next,
      {
        ...emptyFields(),
        happenedAt: at,
        receivedAt: at,
        type: due ? "Mission" : "Observation",
        channel: "Sur place",
        reliability: "Confirmé",
        status: due ? "À traiter" : "Consigné",
        message: `${checklist.title} : ${step.text}${due ? `. Contrôle à ${time(due)}.` : "."}`,
        action: due ? `Contrôler : ${step.text}` : "",
        assignee: step.role,
        dueAt: due,
        notes: note,
        tags: ["liste de contrôle"],
      },
      author,
    );
    entryId = next.entries[next.entries.length - 1].id;
  }
  const tick: Omit<ChecklistTick, "createdAt" | "updatedAt" | "by"> = {
    id: tickId(checklistId, stepId),
    checklistId,
    stepId,
    done: true,
    at,
    who: author,
    entryId,
    note,
  };
  return journalSchema.parse({
    ...next,
    ops: upsert(next.ops, "checklistTicks", tick, author),
  });
}

/** Untick a step (the entry already written stays in the journal). */
export function untickStep(
  ops: Ops,
  checklistId: string,
  stepId: string,
  author: string,
  at = new Date().toISOString(),
): Ops {
  const id = tickId(checklistId, stepId);
  const known = ops.checklistTicks.find((t) => t.id === id);
  if (!known) return ops;
  return upsert(
    ops,
    "checklistTicks",
    { ...known, done: false, at, who: author },
    author,
  );
}

/** Close or reopen a list. */
export function setChecklistClosed(
  ops: Ops,
  checklistId: string,
  closedAt: string,
  author: string,
): Ops {
  const c = ops.checklists.find((x) => x.id === checklistId);
  if (!c) throw new Error("Liste de contrôle introuvable.");
  return upsert(ops, "checklists", { ...c, closedAt }, author);
}

/** The entry written by the tick of a step, if any. */
export function tickEntry(
  journal: Pick<Journal, "entries">,
  tick: ChecklistTick | undefined,
): Entry | undefined {
  return tick?.entryId
    ? journal.entries.find((e) => e.id === tick.entryId)
    : undefined;
}
