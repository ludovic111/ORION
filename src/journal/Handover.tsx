import { Download } from "lucide-react";
import {
  chronological,
  current,
  dateTime,
  needsFollowUp,
  numberLabel,
  overdue,
  type Journal,
} from "../../shared/journal";
import { activeAssignment, radioSummary } from "../../shared/radio";
import { Modal } from "./Modal";

export function Handover({
  journal,
  at,
  onClose,
  onExport,
  onOpen,
  onTakeOver,
}: {
  journal: Journal;
  at: number;
  onClose: () => void;
  onExport: () => void;
  onOpen: (id: string) => void;
  onTakeOver: () => void;
}) {
  const pending = chronological(journal.entries.filter(needsFollowUp));
  const unconfirmed = journal.entries.filter(
    (e) =>
      current(e).reliability !== "Confirmé" && current(e).status !== "Annulé",
  );
  const radio = radioSummary(journal.radio);
  const issued = journal.radio.terminals.filter(activeAssignment);
  return (
    <Modal title="Relève" onClose={onClose} wide>
      <dl className="metrics compact">
        <div className={pending.length ? "warn" : ""}>
          <dt>Suites à donner</dt>
          <dd>{pending.length}</dd>
        </div>
        <div className={pending.some((e) => overdue(e, at)) ? "crit" : ""}>
          <dt>Échéances dépassées</dt>
          <dd>{pending.filter((e) => overdue(e, at)).length}</dd>
        </div>
        <div>
          <dt>À confirmer</dt>
          <dd>{unconfirmed.length}</dd>
        </div>
        <div>
          <dt>Radios en service</dt>
          <dd>
            {radio.issued}
            <small>/{radio.terminals}</small>
          </dd>
        </div>
      </dl>
      <h3 className="section-label">Points ouverts</h3>
      {pending.length ? (
        <table className="grid dense">
          <thead>
            <tr>
              <th>N°</th>
              <th>Message · mesure</th>
              <th>Responsable</th>
              <th>Échéance</th>
            </tr>
          </thead>
          <tbody>
            {pending.map((e) => {
              const f = current(e);
              return (
                <tr key={e.id} className={overdue(e, at) ? "urgent" : ""}>
                  <td className="mono">
                    <button className="link" onClick={() => onOpen(e.id)}>
                      {numberLabel(e)}
                    </button>
                  </td>
                  <td>
                    <strong>{f.message}</strong>
                    {f.action && <div className="muted">{f.action}</div>}
                  </td>
                  <td>{f.assignee || "—"}</td>
                  <td className={`mono ${overdue(e, at) ? "crit-text" : ""}`}>
                    {f.dueAt ? dateTime(f.dueAt) : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <p className="muted">Aucun.</p>
      )}
      {issued.length > 0 && (
        <>
          <h3 className="section-label">Terminaux remis</h3>
          <table className="grid dense">
            <thead>
              <tr>
                <th>Terminal</th>
                <th>Détenteur</th>
                <th>Nom d’appel</th>
                <th>Remis</th>
              </tr>
            </thead>
            <tbody>
              {issued.map((t) => {
                const a = activeAssignment(t)!;
                return (
                  <tr key={t.id}>
                    <td className="mono">{t.label}</td>
                    <td>{a.holder}</td>
                    <td>{a.callsign || "—"}</td>
                    <td className="mono">{dateTime(a.issuedAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </>
      )}
      <p className="hint">
        Autre poste : archive .orionaic, phrase transmise par un canal séparé.
      </p>
      <div className="modal-actions">
        <button onClick={onTakeOver} disabled={!!journal.closedAt}>
          Consigner la relève
        </button>
        <button className="primary" onClick={onExport}>
          <Download size={14} />
          Exporter
        </button>
      </div>
    </Modal>
  );
}
