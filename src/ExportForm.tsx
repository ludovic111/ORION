import { useState, type FormEvent } from "react";
import { Field, Modal } from "./components";
export function ExportForm({
  onClose,
  onExport,
}: {
  onClose: () => void;
  onExport: (purpose: string, recipient: string) => Promise<void>;
}) {
  const [purpose, setPurpose] = useState(""),
    [recipient, setRecipient] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await onExport(purpose, recipient);
      onClose();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title="Diffuser le dossier"
      subtitle="La finalité et le destinataire sont enregistrés dans l’audit. Vérifiez leur habilitation avant de transmettre le fichier."
      onClose={onClose}
    >
      <form onSubmit={submit}>
        <div className="form-grid">
          <Field label="Finalité de l’export" wide>
            <textarea
              required
              minLength={5}
              maxLength={500}
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
            />
          </Field>
          <Field label="Destinataire / fonction habilitée" wide>
            <input
              required
              minLength={3}
              maxLength={200}
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
            />
          </Field>
        </div>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <div className="modal-actions">
          <button type="button" onClick={onClose}>
            Annuler
          </button>
          <button className="primary" disabled={busy}>
            {busy ? "Préparation…" : "Télécharger et journaliser"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
