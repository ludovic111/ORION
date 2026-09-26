import { useState } from "react";
import {
  AlarmClockPlus,
  Check,
  FileText,
  History,
  Megaphone,
  Pencil,
  Reply,
  Trash2,
  UserCheck,
} from "lucide-react";
import {
  current,
  dateTime,
  needsFollowUp,
  numberLabel,
  time,
  type Entry,
  type Fields,
} from "../../shared/journal";
import { thread } from "../../shared/workflow";
import { columns } from "../../shared/interchange";
import { enumLabel } from "../../shared/i18n/enums.ts";
import { Modal } from "./Modal";
import { openAssign, openDiffusion } from "../post/bus";
import { EntryForm } from "./EntryForm";
import { ENUM_COLUMNS, t, tn } from "./i18n.ts";
export function EntryDetail({
  entry,
  author,
  readOnly,
  onClose,
  onRevise,
  onReply,
  onPrint,
  onDelete,
  onSnooze,
  onOpen,
  entries,
  mode = "view",
}: {
  entry: Entry;
  author: string;
  readOnly: boolean;
  onClose: () => void;
  onRevise: (fields: Fields, reason: string) => void;
  onReply: () => void;
  onPrint: () => void;
  onDelete: (reason: string) => void;
  onSnooze: (minutes: number) => void;
  onOpen: (id: string) => void;
  entries: Entry[];
  mode?: "view" | "edit" | "delete";
}) {
  const [editing, setEditing] = useState(mode === "edit" && !readOnly);
  const [deleting, setDeleting] = useState(mode === "delete" && !readOnly);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [history, setHistory] = useState(false);
  const f = current(entry);
  const linked = thread(entries, entry);
  return (
    <Modal
      wide
      title={`${numberLabel(entry)} · ${enumLabel(f.type)}`}
      onClose={() => {
        if (
          !editing ||
          window.confirm(t("Abandonner cette modification non enregistrée ?"))
        )
          onClose();
      }}
    >
      {editing ? (
        <EntryForm
          initial={f}
          author={author}
          onSave={(fields, reason) => {
            onRevise(fields, reason);
            setEditing(false);
          }}
          onCancel={() => setEditing(false)}
        />
      ) : (
        <>
          <div className="detail-meta">
            <span
              className={`tag ${f.priority === "Urgent" ? "crit solid" : f.priority === "Important" ? "warn solid" : ""}`}
            >
              {enumLabel(f.priority)}
            </span>
            <span className="tag">{enumLabel(f.status)}</span>
            <span className="mono">{dateTime(f.happenedAt)}</span>
          </div>
          <p className="detail-message">{f.message}</p>
          <dl className="detail-grid">
            {columns
              .filter(
                ([, value, key]) =>
                  value(entry) &&
                  ![
                    "N°",
                    "Message",
                    "Priorité",
                    "Statut",
                    "Type",
                    "Événement (ISO)",
                    "Identifiant",
                  ].includes(key),
              )
              .map(([label, value, key]) => (
                <div key={key}>
                  <dt>{label.replace(" (ISO)", "")}</dt>
                  <dd>
                    {key.includes("(ISO)")
                      ? dateTime(value(entry))
                      : ENUM_COLUMNS.has(key)
                        ? enumLabel(value(entry))
                        : value(entry)}
                  </dd>
                </div>
              ))}
          </dl>
          <div className="action-row">
            <button onClick={onPrint}>
              <FileText size={14} />
              {t("Fiche A4")}
            </button>
            {!readOnly && (
              <>
                <button onClick={() => setEditing(true)}>
                  <Pencil size={14} />
                  {t("Modifier")}
                </button>
                <button onClick={onReply}>
                  <Reply size={14} />
                  {t("Consigner une suite")}
                </button>
                <button
                  onClick={() =>
                    openDiffusion({
                      title: `${numberLabel(entry)} ${f.message.split("\n")[0].slice(0, 200)}`,
                      body: f.action,
                      target: `entry:${entry.id}`,
                      priority: f.priority,
                    })
                  }
                >
                  <Megaphone size={14} />
                  {t("Diffuser")}
                </button>
                <button
                  onClick={() => openAssign({ target: `entry:${entry.id}` })}
                >
                  <UserCheck size={14} />
                  {t("Attribuer")}
                </button>
                {["À traiter", "En cours"].includes(f.status) && (
                  <button
                    onClick={() =>
                      onRevise(
                        { ...f, status: "Terminé" },
                        t("Suivi marqué terminé par l’opérateur"),
                      )
                    }
                  >
                    <Check size={14} />
                    {t("Terminer le suivi")}
                  </button>
                )}
                {needsFollowUp(entry) && (
                  <button
                    onClick={() => onSnooze(15)}
                    title={t("Reporter l’échéance de 15 minutes")}
                  >
                    <AlarmClockPlus size={14} />
                    {f.dueAt
                      ? t("Échéance +15 min")
                      : t("Échéance dans 15 min")}
                  </button>
                )}
              </>
            )}
            <button
              onClick={() => setHistory(!history)}
              aria-expanded={history}
            >
              <History size={14} />
              {tn(entry.revisions.length, "{n} version", "{n} versions")}
            </button>
            {!readOnly && (
              <button
                className="danger push-right"
                onClick={() => setDeleting(!deleting)}
                aria-expanded={deleting}
              >
                <Trash2 size={14} />
                {t("Supprimer")}
              </button>
            )}
          </div>
          {deleting && (
            <form
              className="delete-panel"
              onSubmit={(e) => {
                e.preventDefault();
                setError("");
                try {
                  onDelete(reason);
                } catch (err) {
                  setError((err as Error).message);
                }
              }}
            >
              <p>
                {t(
                  "Supprimer définitivement {n} ? Son contenu et son historique sont effacés ; restent au journal le numéro, l’auteur, l’heure et le motif de la suppression. Pour une information erronée, préférez « Modifier » ou le suivi « Annulé ».",
                  { n: numberLabel(entry) },
                )}
              </p>
              <label>
                <span>
                  {t("Motif de la suppression")}{" "}
                  <span className="required">*</span>
                </span>
                <input
                  required
                  autoFocus
                  data-autofocus
                  maxLength={1000}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={t("Saisie en double, mauvais journal")}
                />
              </label>
              {error && (
                <p className="error" role="alert">
                  {error}
                </p>
              )}
              <div className="action-row">
                <button type="button" onClick={() => setDeleting(false)}>
                  {t("Annuler")}
                </button>
                <button className="danger solid" disabled={!reason.trim()}>
                  <Trash2 size={14} />
                  {t("Supprimer {n}", { n: numberLabel(entry) })}
                </button>
              </div>
            </form>
          )}
          {linked.length > 0 && (
            <section className="thread">
              <h3 className="section-label">
                {t("Fil · {n} entrées liées", { n: linked.length })}
              </h3>
              <ol>
                {linked.map((e) => {
                  const g = current(e);
                  return (
                    <li key={e.id}>
                      <button
                        className="thread-item"
                        aria-current={e.id === entry.id ? "true" : undefined}
                        disabled={e.id === entry.id}
                        onClick={() => onOpen(e.id)}
                      >
                        <span className="mono">{numberLabel(e)}</span>
                        <span className="mono muted">{time(g.happenedAt)}</span>
                        <span className="tag">{enumLabel(g.type)}</span>
                        <span className="thread-text">{g.message}</span>
                        <span className="state">{enumLabel(g.status)}</span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </section>
          )}
          {history && (
            <section className="history">
              <h3 className="label">
                {t("Versions · auteurs déclarés, non signés")}
              </h3>
              {[...entry.revisions].reverse().map((revision, i) => (
                <details key={revision.id}>
                  <summary>
                    {t("Version {n}", { n: entry.revisions.length - i })} ·{" "}
                    {dateTime(revision.at)} · {revision.author}
                  </summary>
                  <p>{revision.reason}</p>
                  <dl className="detail-grid">
                    {Object.entries(revision.fields)
                      .filter(([, value]) => String(value))
                      .map(([key, value]) => (
                        <div key={key}>
                          <dt>{fieldLabel(key)}</dt>
                          <dd>
                            {key.endsWith("At")
                              ? dateTime(String(value))
                              : Array.isArray(value)
                                ? value.join(", ")
                                : ENUM_FIELDS.has(key)
                                  ? enumLabel(String(value))
                                  : value}
                          </dd>
                        </div>
                      ))}
                  </dl>
                </details>
              ))}
            </section>
          )}
        </>
      )}
    </Modal>
  );
}
/** Fields holding fixed schema values (shown with enumLabel). */
const ENUM_FIELDS = new Set([
  "type",
  "channel",
  "priority",
  "reliability",
  "status",
]);
/** Name of a field of an entry, in the language of the post. */
function fieldLabel(key: string): string {
  switch (key) {
    case "happenedAt":
      return t("Événement");
    case "receivedAt":
      return t("Réception");
    case "type":
      return t("Nature");
    case "message":
      return t("Message");
    case "source":
      return t("Émetteur");
    case "recipient":
      return t("Destinataire");
    case "channel":
      return t("Canal");
    case "priority":
      return t("Priorité");
    case "reliability":
      return t("Confirmation");
    case "location":
      return t("Lieu");
    case "coordinates":
      return t("Coordonnées");
    case "action":
      return t("Mesure / décision");
    case "assignee":
      return t("Responsable");
    case "dueAt":
      return t("Échéance");
    case "status":
      return t("Suivi");
    case "resources":
      return t("Moyens / besoins");
    case "reference":
      return t("Référence");
    case "notes":
      return t("Observations");
    case "tags":
      return t("Mots-clés");
    default:
      return key;
  }
}
