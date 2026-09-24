import { useState, type CSSProperties } from "react";
import {
  ArrowRight,
  Clock3,
  History,
  Minus,
  Pencil,
  Plus,
  RotateCcw,
} from "lucide-react";
import { dateTime } from "../../shared/journal";
import { diffStates, scopeInfo, type AuditItem } from "../../shared/history";
import {
  ACTION_LABELS,
  fieldLabel,
  formatValue,
  initials,
  personHue,
} from "./format";
import "./timeline.css";

const ICONS = { create: Plus, update: Pencil, remove: Minus };
const SHOWN_ON_CREATE = 5;

/** Fields worth showing for a change. */
function details(item: AuditItem) {
  if (item.action === "update") return diffStates(item.previous, item.state);
  if (item.action === "create")
    return diffStates(null, item.state)
      .filter((d) => formatValue(d.key, d.after) !== "—")
      .slice(0, SHOWN_ON_CREATE);
  return [];
}

/** One change: who, what, when, and the fields that changed. */
export function AuditRow({
  item,
  showTitle = true,
  onOpen,
  onTime,
  onRestore,
}: {
  item: AuditItem;
  showTitle?: boolean;
  onOpen?: () => void;
  onTime?: () => void;
  onRestore?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const Icon = ICONS[item.action];
  const fields = details(item);
  const shown = open ? fields : fields.slice(0, 3);
  const who = item.by || "Inconnu";
  return (
    <li className={`audit-row ${item.action}`}>
      <span
        className="audit-avatar"
        style={{ "--h": personHue(who) } as CSSProperties}
        title={who}
      >
        {initials(who)}
        <i>
          <Icon size={9} strokeWidth={3} />
        </i>
      </span>
      <div className="audit-main">
        <div className="audit-line">
          <strong>{who}</strong> {ACTION_LABELS[item.action]}{" "}
          {showTitle ? (
            <>
              <span className="audit-kind">
                {scopeInfo(item.scope).label.toLocaleLowerCase("fr")}
              </span>{" "}
              {onOpen ? (
                <button className="link audit-title" onClick={onOpen}>
                  {item.title}
                </button>
              ) : (
                <span className="audit-title">{item.title}</span>
              )}
            </>
          ) : (
            <span className="audit-kind">
              {item.action === "create"
                ? "cet élément"
                : item.action === "remove"
                  ? "cet élément"
                  : `${fields.length} champ${fields.length > 1 ? "s" : ""}`}
            </span>
          )}
          <time className="mono" dateTime={item.at}>
            {dateTime(item.at)}
          </time>
        </div>
        {item.note && <div className="audit-note">{item.note}</div>}
        {shown.length > 0 && (
          <ul className="audit-diff">
            {shown.map((d) => (
              <li key={d.key}>
                <span className="audit-field">{fieldLabel(d.key)}</span>
                {item.action === "update" && (
                  <>
                    <del>{formatValue(d.key, d.before, 90)}</del>
                    <ArrowRight size={11} />
                  </>
                )}
                <ins>{formatValue(d.key, d.after, 140)}</ins>
              </li>
            ))}
            {fields.length > shown.length && (
              <li>
                <button className="link" onClick={() => setOpen(true)}>
                  + {fields.length - shown.length} autre
                  {fields.length - shown.length > 1 ? "s" : ""}
                </button>
              </li>
            )}
          </ul>
        )}
        {(onTime || onRestore) && (
          <div className="audit-actions">
            {onTime && (
              <button className="small" onClick={onTime}>
                <Clock3 size={12} />
                Voir l’opération à ce moment
              </button>
            )}
            {onRestore && (
              <button className="small" onClick={onRestore}>
                <RotateCcw size={12} />
                Restaurer cette version
              </button>
            )}
          </div>
        )}
      </div>
    </li>
  );
}

export function AuditEmpty({ text }: { text: string }) {
  return (
    <p className="audit-empty muted">
      <History size={14} />
      {text}
    </p>
  );
}
