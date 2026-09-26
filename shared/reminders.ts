import type { AgendaItem, ExportLog, Ops } from "./ops.ts";
import type { Reminder, ReminderAction } from "./conduct-schemas.ts";
import { formatTime } from "./i18n/core.ts";
import { t as tr } from "./i18n/reminders.ts";

// Export and print reminders, scheduled in the application only (no
// server): "every 2 h, export the archive", "30 min before each rapport de
// conduite, print the situation". A reminder is due from its due time until
// it is done: an operator marks it done, or a matching export appears in
// the export log (the export centre writes every file and print there).

const MINUTE = 60_000;

export const ACTION_LABEL: Record<ReminderAction, string> = {
  get export() {
    return tr("Exporter l’archive");
  },
  get print() {
    return tr("Imprimer la situation");
  },
  get point() {
    return tr("Préparer le point de situation");
  },
  get other() {
    return tr("Autre");
  },
};

/** Meetings counted as reports: kind or title says "rapport". */
export const isReport = (item: Pick<AgendaItem, "kind" | "title">) =>
  /rapport/i.test(`${item.kind} ${item.title}`);

// "Impression (HTML)" (also a log written in German or Italian).
const printed = (e: Pick<ExportLog, "format">) =>
  /^(impression|druck|stampa)/i.test(e.format);

/** An export of the log counts for the reminder. */
export function matches(
  action: ReminderAction,
  e: Pick<ExportLog, "format">,
): boolean {
  if (action === "export") return !printed(e);
  if (action === "print") return printed(e) || /pdf/i.test(e.format);
  return false;
}

export type DueReminder = {
  reminder: Reminder;
  /** Time it became due (ms). */
  dueAt: number;
  /** Why now ("toutes les 2 h", "avant le rapport de 14:00"). */
  reason: string;
  /** Report it prepares, if any. */
  agendaId: string;
};

/** Done since `t`: marked done, or a matching export recorded. */
export function doneSince(
  reminder: Reminder,
  exports: Pick<ExportLog, "format" | "at">[],
  t: number,
): boolean {
  if (reminder.doneAt && Date.parse(reminder.doneAt) >= t) return true;
  return exports.some(
    (e) => Date.parse(e.at) >= t && matches(reminder.action, e),
  );
}

const hhmm = (ms: number) => formatTime(ms);

/** Last periodic due time at or before `at` (null before the first one). */
export function lastPeriodic(reminder: Reminder, at: number): number | null {
  if (!reminder.every) return null;
  const anchor = Date.parse(reminder.createdAt);
  const step = reminder.every * MINUTE;
  if (at < anchor + step) return null;
  return anchor + Math.floor((at - anchor) / step) * step;
}

/** Reminders due now, oldest first. */
export function dueReminders(
  ops: Pick<Ops, "reminders" | "exports" | "agenda">,
  at = Date.now(),
): DueReminder[] {
  const out: DueReminder[] = [];
  for (const r of ops.reminders) {
    if (!r.active) continue;
    const periodic = lastPeriodic(r, at);
    if (periodic !== null && !doneSince(r, ops.exports, periodic))
      out.push({
        reminder: r,
        dueAt: periodic,
        reason:
          r.every >= 60 && r.every % 60 === 0
            ? tr("toutes les {n} h", { n: r.every / 60 })
            : tr("toutes les {n} min", { n: r.every }),
        agendaId: "",
      });
    if (r.before)
      for (const item of ops.agenda) {
        if (item.done || !isReport(item)) continue;
        const start = Date.parse(item.at);
        const due = start - r.before * MINUTE;
        // Due from `before` minutes ahead until the report has started.
        if (at < due || at > start + 15 * MINUTE) continue;
        if (doneSince(r, ops.exports, due)) continue;
        out.push({
          reminder: r,
          dueAt: due,
          reason: tr("avant « {title} » de {time}", {
            title: item.title,
            time: hhmm(start),
          }),
          agendaId: item.id,
        });
      }
  }
  return out.sort((a, b) => a.dueAt - b.dueAt);
}

/** Next time a reminder will be due (for the settings), or null. */
export function nextDue(
  reminder: Reminder,
  agenda: AgendaItem[],
  at = Date.now(),
): number | null {
  const times: number[] = [];
  if (reminder.every) {
    const anchor = Date.parse(reminder.createdAt);
    const step = reminder.every * MINUTE;
    times.push(
      at < anchor
        ? anchor + step
        : anchor + (Math.floor((at - anchor) / step) + 1) * step,
    );
  }
  if (reminder.before)
    for (const item of agenda)
      if (!item.done && isReport(item)) {
        const due = Date.parse(item.at) - reminder.before * MINUTE;
        if (due > at) times.push(due);
      }
  return times.length ? Math.min(...times) : null;
}

export const STANDARD_REMINDERS: Pick<
  Reminder,
  "title" | "action" | "every" | "before" | "notes"
>[] = [
  // Written into the journal in the language of the post that adds them.
  {
    get title() {
      return tr("Exporter l’archive chiffrée");
    },
    action: "export",
    every: 120,
    before: 0,
    get notes() {
      return tr("Une archive .orionaic à jour sur une clé ou un autre poste.");
    },
  },
  {
    get title() {
      return tr("Imprimer la situation pour le rapport");
    },
    action: "print",
    every: 0,
    before: 30,
    notes: "",
  },
  {
    get title() {
      return tr("Préparer le point de situation");
    },
    action: "point",
    every: 0,
    before: 45,
    notes: "",
  },
];
