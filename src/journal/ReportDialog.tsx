import { useState } from "react";
import { FileText } from "lucide-react";
import { current, type Journal } from "../../shared/journal";
import type { ReportRange } from "../print/report";
import { fromInput, localInput } from "../ui/fields";
import { Modal } from "./Modal";

export function ReportDialog({
  journal,
  onClose,
  onPreview,
}: {
  journal: Journal;
  onClose: () => void;
  onPreview: (range: ReportRange) => void;
}) {
  // Earliest fact of the journal, including back-dated entries.
  const start = Math.min(
    Date.parse(journal.createdAt),
    ...journal.entries.map((e) => Date.parse(current(e).happenedAt)),
  );
  const since = (hours: number) =>
    new Date(Math.max(start, Date.now() - hours * 3_600_000)).toISOString();
  const [from, setFrom] = useState(since(4));
  const [to, setTo] = useState(new Date().toISOString());
  const [chronology, setChronology] = useState(false);
  const [preset, setPreset] = useState("4 h");
  const [error, setError] = useState("");
  return (
    <Modal title="Rapport de situation" onClose={onClose}>
      <form
        className="stack"
        onSubmit={(e) => {
          e.preventDefault();
          if (!from || !to || Date.parse(from) > Date.parse(to)) {
            setError("La fin doit suivre le début.");
            return;
          }
          onPreview({ from, to, chronology });
        }}
      >
        <div className="chips-field" role="group" aria-label="Période">
          {(
            [
              ["1 h", 1],
              ["4 h", 4],
              ["12 h", 12],
              ["24 h", 24],
              ["Tout", 100_000],
            ] as const
          ).map(([label, hours]) => (
            <button
              type="button"
              className="chip"
              key={label}
              aria-pressed={preset === label}
              onClick={() => {
                setPreset(label);
                setFrom(since(hours));
                setTo(new Date().toISOString());
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="form-pair">
          <label>
            Début
            <input
              type="datetime-local"
              required
              value={localInput(from)}
              onChange={(e) => {
                setPreset("");
                setFrom(fromInput(e.target.value));
              }}
            />
          </label>
          <label>
            Fin
            <input
              type="datetime-local"
              required
              value={localInput(to)}
              onChange={(e) => {
                setPreset("");
                setTo(fromInput(e.target.value));
              }}
            />
          </label>
        </div>
        <label className="check-label">
          <input
            type="checkbox"
            checked={chronology}
            onChange={(e) => setChronology(e.target.checked)}
          />
          <span>Ajouter la chronologie complète de la période</span>
        </label>
        <p className="hint">
          Synthèse, faits marquants, décisions et missions, demandes, points
          ouverts, moyens engagés, état radio.
        </p>
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
            <FileText size={14} />
            Aperçu A4
          </button>
        </div>
      </form>
    </Modal>
  );
}
