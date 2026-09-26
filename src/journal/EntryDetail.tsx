import { useState } from "react";
import {
  AlarmClockPlus,
  Check,
  FileText,
  History,
  Pencil,
  Reply,
  Trash2,
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
import { Modal } from "./Modal";
import { EntryForm } from "./EntryForm";
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
      title={`${numberLabel(entry)} · ${f.type}`}
      onClose={() => {
        if (
          !editing ||
          window.confirm("Abandonner cette modification non enregistrée ?")
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
              {f.priority}
            </span>
            <span className="tag">{f.status}</span>
            <span className="mono">{dateTime(f.happenedAt)}</span>
          </div>
          <p className="detail-message">{f.message}</p>
          <dl className="detail-grid">
            {columns
              .filter(
                ([label, value]) =>
                  value(entry) &&
                  ![
                    "N°",
                    "Message",
                    "Priorité",
                    "Statut",
                    "Type",
                    "Événement (ISO)",
                    "Identifiant",
                  ].includes(label),
              )
              .map(([label, value]) => (
                <div key={label}>
                  <dt>{label.replace(" (ISO)", "")}</dt>
                  <dd>
                    {label.includes("(ISO)")
                      ? dateTime(value(entry))
                      : value(entry)}
                  </dd>
                </div>
              ))}
          </dl>
          <div className="action-row">
            <button onClick={onPrint}>
              <FileText size={14} />
              Fiche A4
            </button>
            {!readOnly && (
              <>
                <button onClick={() => setEditing(true)}>
                  <Pencil size={14} />
                  Modifier
                </button>
                <button onClick={onReply}>
                  <Reply size={14} />
                  Consigner une suite
                </button>
                {["À traiter", "En cours"].includes(f.status) && (
                  <button
                    onClick={() =>
                      onRevise(
                        { ...f, status: "Terminé" },
                        "Suivi marqué terminé par l’opérateur",
                      )
                    }
                  >
                    <Check size={14} />
                    Terminer le suivi
                  </button>
                )}
                {needsFollowUp(entry) && (
                  <button
                    onClick={() => onSnooze(15)}
                    title="Reporter l’échéance de 15 minutes"
                  >
                    <AlarmClockPlus size={14} />
                    {f.dueAt ? "Échéance +15 min" : "Échéance dans 15 min"}
                  </button>
                )}
              </>
            )}
            <button
              onClick={() => setHistory(!history)}
              aria-expanded={history}
            >
              <History size={14} />
              {entry.revisions.length} version
              {entry.revisions.length > 1 ? "s" : ""}
            </button>
            {!readOnly && (
              <button
                className="danger push-right"
                onClick={() => setDeleting(!deleting)}
                aria-expanded={deleting}
              >
                <Trash2 size={14} />
                Supprimer
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
                Supprimer définitivement {numberLabel(entry)} ? Son contenu et
                son historique sont effacés ; restent au journal le numéro,
                l’auteur, l’heure et le motif de la suppression. Pour une
                information erronée, préférez « Modifier » ou le suivi « Annulé
                ».
              </p>
              <label>
                <span>
                  Motif de la suppression <span className="required">*</span>
                </span>
                <input
                  required
                  autoFocus
                  data-autofocus
                  maxLength={1000}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Saisie en double, mauvais journal"
                />
              </label>
              {error && (
                <p className="error" role="alert">
                  {error}
                </p>
              )}
              <div className="action-row">
                <button type="button" onClick={() => setDeleting(false)}>
                  Annuler
                </button>
                <button className="danger solid" disabled={!reason.trim()}>
                  <Trash2 size={14} />
                  Supprimer {numberLabel(entry)}
                </button>
              </div>
            </form>
          )}
          {linked.length > 0 && (
            <section className="thread">
              <h3 className="section-label">
                Fil · {linked.length} entrées liées
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
                        <span className="tag">{g.type}</span>
                        <span className="thread-text">{g.message}</span>
                        <span className="state">{g.status}</span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </section>
          )}
          {history && (
            <section className="history">
              <h3 className="label">Versions · auteurs déclarés, non signés</h3>
              {[...entry.revisions].reverse().map((revision, i) => (
                <details key={revision.id}>
                  <summary>
                    Version {entry.revisions.length - i} ·{" "}
                    {dateTime(revision.at)} · {revision.author}
                  </summary>
                  <p>{revision.reason}</p>
                  <dl className="detail-grid">
                    {Object.entries(revision.fields)
                      .filter(([, value]) => String(value))
                      .map(([key, value]) => (
                        <div key={key}>
                          <dt>{fieldLabels[key] || key}</dt>
                          <dd>
                            {key.endsWith("At")
                              ? dateTime(String(value))
                              : Array.isArray(value)
                                ? value.join(", ")
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
const fieldLabels: Record<string, string> = {
  happenedAt: "Événement",
  receivedAt: "Réception",
  type: "Nature",
  message: "Message",
  source: "Émetteur",
  recipient: "Destinataire",
  channel: "Canal",
  priority: "Priorité",
  reliability: "Confirmation",
  location: "Lieu",
  coordinates: "Coordonnées",
  action: "Mesure / décision",
  assignee: "Responsable",
  dueAt: "Échéance",
  status: "Suivi",
  resources: "Moyens / besoins",
  reference: "Référence",
  notes: "Observations",
  tags: "Mots-clés",
};
