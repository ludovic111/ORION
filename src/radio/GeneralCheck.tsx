import { useState } from "react";
import { now } from "../../shared/journal";
import {
  CHECK_LABELS,
  CHECK_RESULTS,
  stationStatus,
  type Radio,
  type RadioCheck,
} from "../../shared/radio";
import { Modal } from "../journal/Modal";
import { talkgroupLabel } from "../print/radio-sheet";

type Result = (typeof CHECK_RESULTS)[number];

/** Roll call of every call sign: one click per answer, saved together. */
export function GeneralCheck({
  radio,
  author,
  onClose,
  onSave,
}: {
  radio: Radio;
  author: string;
  onClose: () => void;
  onSave: (checks: RadioCheck[], log: boolean) => void;
}) {
  const [group, setGroup] = useState("");
  const [results, setResults] = useState<Record<string, Result>>({});
  const [log, setLog] = useState(true);
  const done = Object.keys(results).length;
  return (
    <Modal title="Contrôle de liaison général" onClose={onClose} wide>
      <div className="form-pair">
        <label>
          Groupe / canal
          <select value={group} onChange={(e) => setGroup(e.target.value)}>
            <option value="">Groupe principal de chaque station</option>
            {radio.talkgroups.map((g) => (
              <option key={g.id} value={g.id}>
                {talkgroupLabel(radio, g.id)}
              </option>
            ))}
          </select>
        </label>
        <p className="hint">
          « À … de …, contrôle de liaison, répondez. » Noter l’audibilité de
          chaque réponse. Les stations sans réponse notée ne sont pas
          enregistrées.
        </p>
      </div>
      <table className="grid dense roll-call">
        <thead>
          <tr>
            <th>Nom d’appel</th>
            <th>Titulaire · terminal</th>
            <th>Groupe</th>
            <th>Audibilité</th>
          </tr>
        </thead>
        <tbody>
          {radio.stations.map((s) => {
            const status = stationStatus(radio, s.callsign);
            return (
              <tr key={s.id} className={results[s.id] ? "noted" : ""}>
                <td>
                  <strong>{s.callsign}</strong>
                  {s.role && <div className="muted">{s.role}</div>}
                </td>
                <td>
                  {status.terminal ? (
                    `${status.assignment?.holder} · ${status.terminal.label}`
                  ) : (
                    <span className="tag dim">Hors réseau</span>
                  )}
                </td>
                <td className="mono muted">
                  {talkgroupLabel(radio, group || s.primary)}
                </td>
                <td>
                  <div className="score-picker" role="group">
                    {CHECK_RESULTS.map((r) => (
                      <button
                        type="button"
                        key={r}
                        className={`score-button score-${r}`}
                        aria-pressed={results[s.id] === r}
                        title={CHECK_LABELS[r]}
                        onClick={() =>
                          setResults((previous) => {
                            const next = { ...previous };
                            if (next[s.id] === r) delete next[s.id];
                            else next[s.id] = r;
                            return next;
                          })
                        }
                      >
                        {r === "0" ? "✕" : r}
                      </button>
                    ))}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {!radio.stations.length && (
        <p className="muted">Aucun nom d’appel au plan du réseau.</p>
      )}
      <label className="check-label">
        <input
          type="checkbox"
          checked={log}
          onChange={(e) => setLog(e.target.checked)}
        />
        <span>Consigner le résultat au journal (une entrée de synthèse)</span>
      </label>
      <div className="modal-actions">
        <span className="mono muted push-left">
          {done} / {radio.stations.length} notés
        </span>
        <button type="button" onClick={onClose}>
          Annuler
        </button>
        <button
          className="primary"
          disabled={!done}
          onClick={() => {
            const at = now();
            onSave(
              radio.stations
                .filter((s) => results[s.id])
                .map((s) => ({
                  id: crypto.randomUUID(),
                  at,
                  by: author,
                  callsign: s.callsign,
                  talkgroupId: group || s.primary,
                  result: results[s.id],
                  notes: "Contrôle général",
                })),
              log,
            );
            onClose();
          }}
        >
          Enregistrer {done} contrôle{done > 1 ? "s" : ""}
        </button>
      </div>
    </Modal>
  );
}
