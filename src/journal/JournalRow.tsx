import { ChevronRight, Clock3, MapPin, Radio } from "lucide-react";
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
export function JournalRow({
  entry,
  newDay,
  onOpen,
  at,
}: {
  entry: Journal["entries"][number];
  newDay: boolean;
  onOpen: () => void;
  at: number;
}) {
  const f = current(entry);
  return (
    <>
      {newDay && (
        <tr className="day-row">
          <td colSpan={5}>{day(f.happenedAt)}</td>
        </tr>
      )}
      <tr className={f.priority === "Urgent" ? "urgent-row" : ""}>
        <td className="time-cell">
          <strong>{time(f.happenedAt)}</strong>
          <span>{numberLabel(entry)}</span>
          {entry.revisions.length > 1 && <small>corrigé</small>}
        </td>
        <td className="message-cell">
          <div className="entry-badges">
            <span
              className={`type-label type-${f.type === "Décision" ? "decision" : f.type === "Quittance" ? "receipt" : "info"}`}
            >
              {f.type}
            </span>
            {f.priority !== "Normal" && (
              <span
                className={`badge ${f.priority === "Urgent" ? "red" : "amber"}`}
              >
                {f.priority}
              </span>
            )}
            {f.reliability !== "Confirmé" && (
              <span className="unconfirmed">{f.reliability}</span>
            )}
          </div>
          <button className="message-button" onClick={onOpen}>
            {f.message}
          </button>
          {f.location && (
            <span className="row-location">
              <MapPin size={12} />
              {f.location}
            </span>
          )}
        </td>
        <td className="source-cell">
          <strong>{f.source || "—"}</strong>
          <span>
            <Radio size={11} />
            {f.channel}
          </span>
        </td>
        <td className="follow-cell">
          <span
            className={`follow-label ${f.status === "Terminé" ? "done" : needsFollowUp(entry) ? "pending" : ""}`}
          >
            <span />
            {f.status}
          </span>
          {f.assignee && <small>{f.assignee}</small>}
          {f.dueAt && needsFollowUp(entry) && (
            <small className={overdue(entry, at) ? "red-text" : ""}>
              <Clock3 size={11} />
              {dateTime(f.dueAt)}
              {overdue(entry, at) && " · retard"}
            </small>
          )}
        </td>
        <td>
          <button
            className="icon-button row-open"
            aria-label={`Ouvrir l’entrée ${entry.number}`}
            onClick={onOpen}
          >
            <ChevronRight size={17} />
          </button>
        </td>
      </tr>
    </>
  );
}
