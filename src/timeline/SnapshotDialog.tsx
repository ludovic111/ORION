import { useMemo, useState } from "react";
import { Clock3, Snowflake, Trash2 } from "lucide-react";
import { dateTime, time } from "../../shared/journal";
import { removeRecords } from "../../shared/ops";
import { useApp } from "../app/context";
import { Modal } from "../journal/Modal";
import { DateTimeField, TextField } from "../ui/fields";

/**
 * Freeze a point of situation: a named moment ("Point de situation 14:00")
 * that the time machine, the presentations and the exports offer directly.
 */
export function SnapshotDialog({
  at,
  onClose,
}: {
  /** Moment frozen (ms); default: now. */
  at?: number;
  onClose: () => void;
}) {
  const { live, record, setViewAt, updateOps, toast } = useApp();
  const initial = new Date(at ?? Date.now()).toISOString();
  const [title, setTitle] = useState(`Point de situation ${time(initial)}`);
  const [when, setWhen] = useState(initial);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const list = useMemo(
    () => [...live.ops.snapshots].sort((a, b) => b.at.localeCompare(a.at)),
    [live.ops.snapshots],
  );
  function save(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Donnez un nom à ce point de situation.");
      return;
    }
    if (Date.parse(when) > Date.now() + 60_000) {
      setError("Un point de situation fige un moment passé ou présent.");
      return;
    }
    record("snapshots", { title: title.trim(), at: when, notes });
    toast(
      `« ${title.trim()} » figé. Retrouvez-le dans la machine à remonter le temps, les exports et les présentations.`,
    );
    onClose();
  }
  return (
    <Modal title="Figer un point de situation" onClose={onClose}>
      <p className="modal-intro">
        Donne un nom à un moment de l’opération. Il reste consultable tel quel,
        même si tout change ensuite, et se choisit en un clic pour présenter,
        comparer ou exporter.
      </p>
      <form className="stack" onSubmit={save}>
        <TextField
          label="Nom"
          value={title}
          onChange={setTitle}
          maxLength={200}
          required
        />
        <DateTimeField
          label="Moment figé"
          value={when}
          onChange={setWhen}
          required
        />
        <TextField
          label="Remarques"
          rows={2}
          value={notes}
          onChange={setNotes}
          maxLength={4000}
          placeholder="Ex. état présenté au rapport de conduite de 14 h"
        />
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <div className="modal-actions">
          <button type="button" onClick={onClose}>
            Annuler
          </button>
          <button className="primary">
            <Snowflake size={14} />
            Figer
          </button>
        </div>
      </form>
      {list.length > 0 && (
        <>
          <h3 className="section-label">Points déjà figés</h3>
          <ul className="snapshot-list">
            {list.map((s) => (
              <li key={s.id}>
                <Snowflake size={14} />
                <span>
                  <strong>{s.title}</strong>
                  <small className="mono">
                    {dateTime(s.at)} · {s.by || "—"}
                  </small>
                </span>
                <button
                  className="small"
                  onClick={() => {
                    setViewAt(Date.parse(s.at));
                    onClose();
                  }}
                >
                  <Clock3 size={12} />
                  Revoir
                </button>
                <button
                  className="icon-button"
                  aria-label={`Supprimer ${s.title}`}
                  title="Supprimer ce point (l’historique en garde la trace)"
                  onClick={() => {
                    try {
                      updateOps((ops) => removeRecords(ops, [s.id]));
                    } catch (err) {
                      toast((err as Error).message);
                    }
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </Modal>
  );
}
