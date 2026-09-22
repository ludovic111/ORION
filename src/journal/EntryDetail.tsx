import { useState } from "react";
import { Check, History, Pencil, Reply } from "lucide-react";
import {
  current,
  dateTime,
  numberLabel,
  type Entry,
  type Fields,
} from "../../shared/journal";
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
}: {
  entry: Entry;
  author: string;
  readOnly: boolean;
  onClose: () => void;
  onRevise: (fields: Fields, reason: string) => void;
  onReply: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [history, setHistory] = useState(false);
  const f = current(entry);
  return (
    <Modal
      wide
      title={`${numberLabel(entry)} · ${f.type}`}
      onClose={() => {
        if (
          !editing ||
          window.confirm("Abandonner cette correction non enregistrée ?")
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
          <div className="entry-detail-meta">
            <span
              className={`badge ${f.priority === "Urgent" ? "red" : f.priority === "Important" ? "amber" : ""}`}
            >
              {f.priority}
            </span>
            <span className="badge">{f.status}</span>
            <span>{dateTime(f.happenedAt)} · Europe/Zurich</span>
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
            {!readOnly && (
              <>
                <button onClick={() => setEditing(true)}>
                  <Pencil size={15} />
                  Corriger / mettre à jour
                </button>
                <button onClick={onReply}>
                  <Reply size={15} />
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
                    <Check size={15} />
                    Terminer le suivi
                  </button>
                )}
              </>
            )}
            <button
              onClick={() => setHistory(!history)}
              aria-expanded={history}
            >
              <History size={15} />
              {entry.revisions.length} version
              {entry.revisions.length > 1 ? "s" : ""}
            </button>
          </div>
          {history && (
            <section className="history">
              <h3>Historique des versions</h3>
              <p className="muted">
                Les noms sont déclaratifs. Cet historique local n’est pas une
                signature certifiée.
              </p>
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
