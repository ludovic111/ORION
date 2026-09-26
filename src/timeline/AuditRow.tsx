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
import { fieldLabel, formatValue, initials, personHue } from "./format";
import { getLang, locale, rich } from "../i18n";
import { t, tn } from "./i18n.ts";
import "./timeline.css";

const ICONS = { create: Plus, update: Pencil, remove: Minus };
// "Alpha a créé la carte X": one sentence per action (word order differs).
const SENTENCES = {
  create: "<0/> a créé <1/> <2/>",
  update: "<0/> a modifié <1/> <2/>",
  remove: "<0/> a supprimé <1/> <2/>",
} as const;
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
  const who = item.by || t("Inconnu");
  const whoEl = <strong>{who}</strong>;
  // Nouns keep their capital in German.
  const kind = scopeInfo(item.scope).label;
  const kindText = getLang() === "de" ? kind : kind.toLocaleLowerCase(locale());
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
          {showTitle
            ? rich(t(SENTENCES[item.action]), [
                whoEl,
                <span className="audit-kind">{kindText}</span>,
                onOpen ? (
                  <button className="link audit-title" onClick={onOpen}>
                    {item.title}
                  </button>
                ) : (
                  <span className="audit-title">{item.title}</span>
                ),
              ])
            : rich(
                item.action === "create"
                  ? t("<0/> a créé <1>cet élément</1>")
                  : item.action === "remove"
                    ? t("<0/> a supprimé <1>cet élément</1>")
                    : tn(
                        fields.length,
                        "<0/> a modifié <1>{n} champ</1>",
                        "<0/> a modifié <1>{n} champs</1>",
                      ),
                [whoEl, <span className="audit-kind" />],
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
                  {tn(
                    fields.length - shown.length,
                    "+ {n} autre",
                    "+ {n} autres",
                  )}
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
                {t("Voir l’opération à ce moment")}
              </button>
            )}
            {onRestore && (
              <button className="small" onClick={onRestore}>
                <RotateCcw size={12} />
                {t("Restaurer cette version")}
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
