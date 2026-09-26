import { Pencil, Square, SquareCheck, Trash2 } from "lucide-react";
import {
  current,
  dateTime,
  day,
  needsFollowUp,
  numberLabel,
  overdue,
  time,
  type Journal,
} from "../../shared/journal";
import { referencedNumbers } from "../../shared/workflow";
import { enumLabel } from "../../shared/i18n/enums.ts";
import { t } from "./i18n.ts";

export const typeTone = (type: string) =>
  type === "Décision" || type === "Mission"
    ? "accent"
    : type === "Demande"
      ? "warn"
      : type === "Quittance"
        ? "ok"
        : "";

export function JournalRow({
  entry,
  newDay,
  picked,
  onPick,
  onOpen,
  onEdit,
  onDelete,
  readOnly,
  at,
  fresh = false,
}: {
  entry: Journal["entries"][number];
  newDay: boolean;
  picked: boolean;
  onPick: () => void;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
  readOnly: boolean;
  at: number;
  fresh?: boolean;
}) {
  const f = current(entry);
  const late = overdue(entry, at);
  return (
    <>
      {newDay && (
        <tr className="day-row">
          <td colSpan={6}>{day(f.happenedAt)}</td>
        </tr>
      )}
      <tr
        className={[
          f.priority === "Urgent" ? "urgent" : "",
          f.status === "Annulé" ? "cancelled" : "",
          picked ? "picked" : "",
          fresh ? "fresh" : "",
        ].join(" ")}
      >
        <td className="pick">
          <button
            className="check"
            aria-pressed={picked}
            aria-label={t("Sélectionner l’entrée {n}", { n: entry.number })}
            onClick={onPick}
          >
            {picked ? <SquareCheck size={15} /> : <Square size={15} />}
          </button>
        </td>
        <td className="when">
          <strong>{time(f.happenedAt)}</strong>
          <span>{numberLabel(entry)}</span>
          {entry.revisions.length > 1 && (
            <small title={t("{n} versions", { n: entry.revisions.length })}>
              v{entry.revisions.length}
            </small>
          )}
        </td>
        <td className="what">
          <div className="tags">
            <span className={`tag ${typeTone(f.type)}`}>
              {enumLabel(f.type)}
            </span>
            {f.priority !== "Normal" && (
              <span
                className={`tag ${f.priority === "Urgent" ? "crit" : "warn"} solid`}
              >
                {enumLabel(f.priority)}
              </span>
            )}
            {f.reliability !== "Confirmé" && (
              <span className="tag dim">{enumLabel(f.reliability)}</span>
            )}
            {referencedNumbers(f).map((n) => (
              <span className="tag dim link-tag" key={n}>
                ↳ #{String(n).padStart(3, "0")}
              </span>
            ))}
          </div>
          <button className="row-open" onClick={onOpen}>
            {f.message}
          </button>
          {f.location && <span className="where">{f.location}</span>}
        </td>
        <td className="who">
          <strong>{f.source || "—"}</strong>
          <span>{enumLabel(f.channel)}</span>
        </td>
        <td className="follow">
          <span
            className={`state ${f.status === "Terminé" ? "ok" : needsFollowUp(entry) ? (late ? "crit" : "warn") : ""}`}
          >
            {enumLabel(f.status)}
          </span>
          {f.assignee && <small>{f.assignee}</small>}
          {f.dueAt && needsFollowUp(entry) && (
            <small className={late ? "crit-text" : ""}>
              {late
                ? t("Retard · {date}", { date: dateTime(f.dueAt) })
                : t("Éch. {date}", { date: dateTime(f.dueAt) })}
            </small>
          )}
        </td>
        <td className="row-actions">
          {!readOnly && (
            <>
              <button
                className="icon-button"
                title={t("Modifier")}
                aria-label={t("Modifier l’entrée {n}", { n: entry.number })}
                onClick={onEdit}
              >
                <Pencil size={13} />
              </button>
              <button
                className="icon-button danger-icon"
                title={t("Supprimer")}
                aria-label={t("Supprimer l’entrée {n}", { n: entry.number })}
                onClick={onDelete}
              >
                <Trash2 size={13} />
              </button>
            </>
          )}
        </td>
      </tr>
    </>
  );
}
