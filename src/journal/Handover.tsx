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
import { Modal } from "./Modal";
export function Handover({
  journal,
  onClose,
  onExport,
  onTakeOver,
}: {
  journal: Journal;
  onClose: () => void;
  onExport: () => void;
  onTakeOver: () => void;
}) {
  const pending = chronological(journal.entries.filter(needsFollowUp));
  const unconfirmed = journal.entries.filter(
    (e) =>
      current(e).reliability !== "Confirmé" && current(e).status !== "Annulé",
  );
  return (
    <Modal title="Passer la relève" onClose={onClose} wide>
      <p className="modal-intro">
        Un point de passage à relire avec la personne qui prend la suite.
        Calculé à partir du journal, sans génération par IA.
      </p>
      <div className="handover-stats">
        <div>
          <strong>{pending.length}</strong>
          <span>Suites à donner</span>
        </div>
        <div>
          <strong>{pending.filter((e) => overdue(e)).length}</strong>
          <span>Échéances dépassées</span>
        </div>
        <div>
          <strong>{unconfirmed.length}</strong>
          <span>Informations à confirmer</span>
        </div>
      </div>
      <h3>Les points ouverts</h3>
      {!pending.length && (
        <p className="muted">Aucun suivi en attente dans ce journal.</p>
      )}
      <ol className="handover-list">
        {pending.map((e) => (
          <li key={e.id}>
            <span className="mono">{numberLabel(e)}</span>
            <div>
              <strong>{current(e).message}</strong>
              <p>{current(e).action || "Aucune mesure précisée."}</p>
              <small>
                {current(e).assignee || "Responsable non précisé"} ·{" "}
                {current(e).dueAt
                  ? dateTime(current(e).dueAt)
                  : "Sans échéance"}{" "}
                · {current(e).status}
              </small>
            </div>
          </li>
        ))}
      </ol>
      <div className="inset">
        <h3>Pour reprendre sur un autre poste</h3>
        <p>
          Exportez une archive ORION, transmettez le fichier par un canal
          autorisé, puis importez-le sur le poste suivant. Partagez la phrase
          secrète séparément.
        </p>
      </div>
      <div className="modal-actions">
        <button onClick={onTakeOver} disabled={!!journal.closedAt}>
          Consigner la relève
        </button>
        <button className="primary" onClick={onExport}>
          <Download size={16} />
          Exporter pour la relève
        </button>
      </div>
    </Modal>
  );
}
