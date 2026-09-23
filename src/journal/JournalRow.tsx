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
          Date.now() - Date.parse(entry.createdAt) < 4000 ? "fresh" : "",
        ].join(" ")}
      >
        <td className="pick">
          <button
            className="check"
            aria-pressed={picked}
            aria-label={`Sélectionner l’entrée ${entry.number}`}
            onClick={onPick}
          >
            {picked ? <SquareCheck size={15} /> : <Square size={15} />}
          </button>
        </td>
        <td className="when">
          <strong>{time(f.happenedAt)}</strong>
          <span>{numberLabel(entry)}</span>
          {entry.revisions.length > 1 && (
            <small title={`${entry.revisions.length} versions`}>
              v{entry.revisions.length}
            </small>
          )}
        </td>
        <td className="what">
          <div className="tags">
            <span className={`tag ${typeTone(f.type)}`}>{f.type}</span>
            {f.priority !== "Normal" && (
              <span
                className={`tag ${f.priority === "Urgent" ? "crit" : "warn"} solid`}
              >
                {f.priority}
              </span>
            )}
            {f.reliability !== "Confirmé" && (
              <span className="tag dim">{f.reliability}</span>
            )}
          </div>
          <button className="row-open" onClick={onOpen}>
            {f.message}
          </button>
          {f.location && <span className="where">{f.location}</span>}
        </td>
        <td className="who">
          <strong>{f.source || "—"}</strong>
          <span>{f.channel}</span>
        </td>
        <td className="follow">
          <span
            className={`state ${f.status === "Terminé" ? "ok" : needsFollowUp(entry) ? (late ? "crit" : "warn") : ""}`}
          >
            {f.status}
          </span>
          {f.assignee && <small>{f.assignee}</small>}
          {f.dueAt && needsFollowUp(entry) && (
            <small className={late ? "crit-text" : ""}>
              {late ? "Retard · " : "Éch. "}
              {dateTime(f.dueAt)}
            </small>
          )}
        </td>
        <td className="row-actions">
          {!readOnly && (
            <>
              <button
                className="icon-button"
                title="Modifier"
                aria-label={`Modifier l’entrée ${entry.number}`}
                onClick={onEdit}
              >
                <Pencil size={13} />
              </button>
              <button
                className="icon-button danger-icon"
                title="Supprimer"
                aria-label={`Supprimer l’entrée ${entry.number}`}
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
