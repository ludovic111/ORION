import { useState } from "react";
import { BellRing, Check, Clock3 } from "lucide-react";
import { time } from "../../shared/journal";
import { upsert } from "../../shared/ops";
import {
  ACTION_LABEL,
  dueReminders,
  type DueReminder,
} from "../../shared/reminders";
import { useApp } from "./context";
import { SituationPointDialog } from "../modules/situation/SituationPoint";
import "../ui/conduct.css";
import { t } from "./i18n.ts";

const SNOOZE = 15 * 60_000;
const PRINT_SECTIONS = [
  "situation",
  "missions",
  "resources",
  "weather",
  "agenda",
] as const;

/**
 * Reminders due now (export, print, point de situation), at the bottom of
 * the screen with their action in one click. Scheduled in the page: no
 * server, nothing sent. "Plus tard" is kept on this post only.
 */
export function ReminderBar() {
  const {
    live,
    viewAt,
    readOnly,
    now,
    exportCenter,
    updateOps,
    author,
    canWrite,
  } = useApp();
  const [snoozed, setSnoozed] = useState<Record<string, number>>({});
  const [point, setPoint] = useState<string | null>(null);
  if (viewAt !== null || readOnly) return null;
  const due = dueReminders(live.ops, now).filter(
    (d) => (snoozed[`${d.reminder.id}|${d.dueAt}`] ?? 0) < now,
  );
  const key = (d: DueReminder) => `${d.reminder.id}|${d.dueAt}`;
  const markDone = (d: DueReminder) => {
    if (!canWrite()) return;
    updateOps((o) => {
      const r = o.reminders.find((x) => x.id === d.reminder.id);
      return r
        ? upsert(
            o,
            "reminders",
            { ...r, doneAt: new Date().toISOString() },
            author,
          )
        : o;
    });
  };
  const act = (d: DueReminder) => {
    const a = d.reminder.action;
    if (a === "export") exportCenter({ format: "orion" });
    else if (a === "print")
      exportCenter({ sections: [...PRINT_SECTIONS], format: "pdf" });
    else if (a === "point") setPoint(d.agendaId);
    else markDone(d);
  };
  return (
    <>
      {due.length > 0 && (
        <div className="rm-bar" role="region" aria-label={t("Rappels")}>
          {due.slice(0, 3).map((d) => (
            <div key={key(d)} className="rm-item" role="status">
              <BellRing size={16} />
              <span className="rm-text">
                <strong>{d.reminder.title}</strong>
                <small>
                  {t("Prévu à {time}", {
                    time: time(new Date(d.dueAt).toISOString()),
                  })}{" "}
                  · {d.reason}
                </small>
              </span>
              <span className="rm-buttons">
                <button
                  className="small icon-button"
                  title={t("Plus tard (15 min)")}
                  aria-label={t("Me le rappeler dans 15 minutes")}
                  onClick={() =>
                    setSnoozed((s) => ({ ...s, [key(d)]: Date.now() + SNOOZE }))
                  }
                >
                  <Clock3 size={14} />
                </button>
                <button
                  className="small"
                  title={t("Marquer comme fait")}
                  onClick={() => markDone(d)}
                >
                  <Check size={13} />
                  {t("Fait")}
                </button>
                {d.reminder.action !== "other" && (
                  <button className="small primary" onClick={() => act(d)}>
                    {ACTION_LABEL[d.reminder.action]}
                  </button>
                )}
              </span>
            </div>
          ))}
        </div>
      )}
      {point !== null && (
        <SituationPointDialog agendaId={point} onClose={() => setPoint(null)} />
      )}
    </>
  );
}
