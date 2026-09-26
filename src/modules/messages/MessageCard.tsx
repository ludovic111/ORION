import { useRef, useState } from "react";
import {
  Archive,
  ArrowRight,
  BookOpen,
  Hand,
  MoreHorizontal,
  Pencil,
  Printer,
  RotateCcw,
  Timer,
  User,
  Zap,
} from "lucide-react";
import { time } from "../../../shared/journal";
import { ref } from "../../../shared/links";
import type { Message } from "../../../shared/ops";
import { useApp } from "../../app/context";
import { HoverCard, LinkChip } from "../../ui/links";
import { Popover } from "../../ui/Popover";
import type { MessageActions } from "./actions";
import { PRIORITY_TONE, countdown } from "./model";
import { enumLabel } from "../../../shared/i18n/enums.ts";
import { t } from "./i18n.ts";

export type CardHandlers = {
  onEdit: (m: Message) => void;
  onSynth: (m: Message) => void;
};

/** "Réponse attendue" badge with its countdown. */
export function ReplyBadge({ m }: { m: Message }) {
  const { now } = useApp();
  if (!m.replyNeeded || m.status === "Classé" || m.status === "Transmis")
    return null;
  if (!m.replyBy)
    return (
      <span className="pill warn">
        <Timer size={11} />
        {t("Réponse attendue")}
      </span>
    );
  const c = countdown(m.replyBy, now);
  return (
    <span
      className={`pill ${c.late ? "crit msg-late" : "warn"}`}
      title={t("Réponse attendue avant {time}", { time: time(m.replyBy) })}
    >
      <Timer size={11} />
      {c.late
        ? t("Réponse en retard de {time}", { time: c.span })
        : t("Réponse dans {time}", { time: c.span })}
    </span>
  );
}

/** Actions of a message: the obvious ones as buttons, the rest in a menu. */
export function MessageButtons({
  m,
  actions,
  onEdit,
  onSynth,
  compact = false,
}: CardHandlers & { m: Message; actions: MessageActions; compact?: boolean }) {
  const { readOnly } = useApp();
  const [menu, setMenu] = useState<HTMLElement | null>(null);
  const open = m.status === "Nouveau" || m.status === "En traitement";
  return (
    <div className="msg-actions">
      {!readOnly && m.status === "Nouveau" && !compact && (
        <button className="small" onClick={() => actions.take(m)}>
          <Hand size={13} />
          {t("Prendre en charge")}
        </button>
      )}
      {!readOnly && open && !m.entryId && (
        <button className="small msg-synth-button" onClick={() => onSynth(m)}>
          <BookOpen size={13} />
          {compact ? t("Journal") : t("Inscrire au journal")}
        </button>
      )}
      {!readOnly && open && !m.entryId && (
        <button
          className="small icon-button"
          aria-label={t("Inscrire tel quel au journal, sans relecture")}
          title={t("Inscrire tel quel (sans relecture)")}
          onClick={() => actions.transcribe(m)}
        >
          <Zap size={14} />
        </button>
      )}
      {!readOnly && !open && !compact && (
        <button className="small" onClick={() => actions.reopen(m)}>
          <RotateCcw size={13} />
          {t("Rouvrir")}
        </button>
      )}
      <button
        className="small icon-button"
        aria-label={t("Autres actions")}
        title={t("Autres actions")}
        aria-haspopup="menu"
        aria-expanded={!!menu}
        onClick={(e) => setMenu(menu ? null : e.currentTarget)}
      >
        <MoreHorizontal size={15} />
      </button>
      {menu && (
        <Popover anchor={menu} onClose={() => setMenu(null)} align="end">
          {!readOnly && m.status === "Nouveau" && (
            <button data-close onClick={() => actions.take(m)}>
              <Hand size={14} />
              {t("Prendre en charge")}
            </button>
          )}
          {!readOnly && m.status !== "Classé" && (
            <button data-close onClick={() => actions.classify(m)}>
              <Archive size={14} />
              <span>
                {t("Classer")}
                <small>{t("sans inscription au journal")}</small>
              </span>
            </button>
          )}
          {!readOnly && !open && (
            <button data-close onClick={() => actions.reopen(m)}>
              <RotateCcw size={14} />
              {t("Rouvrir")}
            </button>
          )}
          <button data-close onClick={() => actions.printSheet([m])}>
            <Printer size={14} />
            {t("Fiche A4")}
          </button>
          <hr />
          <button data-close onClick={() => onEdit(m)}>
            <Pencil size={14} />
            {readOnly ? t("Voir la fiche") : t("Modifier ou supprimer")}
          </button>
        </Popover>
      )}
    </div>
  );
}

export function MessageCard({
  m,
  actions,
  onEdit,
  onSynth,
  fresh,
}: CardHandlers & { m: Message; actions: MessageActions; fresh: boolean }) {
  const { readOnly } = useApp();
  const [hover, setHover] = useState<{ x: number; y: number } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const leave = () => {
    clearTimeout(timer.current);
    setHover(null);
  };
  return (
    <article
      className={`msg-card prio-${m.priority}${fresh ? " fresh" : ""}`}
      draggable={!readOnly}
      onDragStart={(e) => {
        leave();
        e.dataTransfer.setData("text/orion-message", m.id);
        e.dataTransfer.effectAllowed = "move";
        e.currentTarget.classList.add("dragging");
      }}
      onDragEnd={(e) => e.currentTarget.classList.remove("dragging")}
      onMouseLeave={leave}
    >
      <button
        className="msg-card-main"
        onClick={() => onEdit(m)}
        onMouseEnter={(e) => {
          const box = e.currentTarget.getBoundingClientRect();
          clearTimeout(timer.current);
          timer.current = setTimeout(
            () => setHover({ x: box.left, y: box.bottom + 6 }),
            600,
          );
        }}
        onMouseLeave={leave}
      >
        <span className="msg-card-top">
          <span className="msg-num mono">{actions.label(m)}</span>
          <span className="mono muted">{time(m.receivedAt)}</span>
          {m.priority !== "Normal" && (
            <span className={`pill ${PRIORITY_TONE[m.priority]}`}>
              {enumLabel(m.priority)}
            </span>
          )}
          {m.category && (
            <span className="pill plain msg-cat">{m.category}</span>
          )}
        </span>
        <span className="msg-route">
          <strong>{m.from || "—"}</strong>
          <ArrowRight size={12} />
          <strong>{m.to || "—"}</strong>
          {m.via && <small>· {m.via}</small>}
        </span>
        {m.subject && <span className="msg-subject">{m.subject}</span>}
        {m.body && <span className="msg-excerpt">{m.body}</span>}
      </button>
      {(m.replyNeeded || m.handledBy || m.entryId) && (
        <div className="msg-card-meta">
          <ReplyBadge m={m} />
          {m.handledBy && (
            <span className="msg-handler" title={t("Traité par")}>
              <User size={11} />
              {m.handledBy}
            </span>
          )}
          {m.entryId && <LinkChip target={ref("entry", m.entryId)} />}
        </div>
      )}
      <MessageButtons
        m={m}
        actions={actions}
        onEdit={onEdit}
        onSynth={onSynth}
      />
      {hover && (
        <HoverCard target={ref("message", m.id)} x={hover.x} y={hover.y} />
      )}
    </article>
  );
}
