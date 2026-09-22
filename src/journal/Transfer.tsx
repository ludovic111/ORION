import { useState } from "react";
import {
  Download,
  FileCheck2,
  FileUp,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";
import { planMerge, type Archive, type Journal } from "../../shared/journal";
import {
  importCsv,
  importJson,
  MAX_IMPORT_BYTES,
} from "../../shared/interchange";
import { decrypt } from "../../shared/crypto";
import {
  download,
  exportFormats,
  fileName,
  makeExport,
  type ExportFormat,
} from "./exports";
import { Modal } from "./Modal";
export function ExportModal({
  journal,
  onClose,
  onBackup,
}: {
  journal: Journal;
  onClose: () => void;
  onBackup: () => void;
}) {
  const [format, setFormat] = useState<ExportFormat>("orion");
  const [password, setPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setDone("");
    setBusy(true);
    try {
      if (format === "orion" && password !== repeat)
        throw new Error("Les deux phrases secrètes ne correspondent pas.");
      const blob = await makeExport(journal, format, password);
      const name = fileName(
        journal,
        exportFormats.find((f) => f.id === format)!.extension,
      );
      download(blob, name);
      if (format === "orion" || format === "json") onBackup();
      setDone(
        `Téléchargement demandé : ${name}. Vérifiez sa présence dans vos téléchargements.`,
      );
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title="Exporter le journal"
      onClose={() => {
        if (!busy) onClose();
      }}
      wide
    >
      <p className="modal-intro">
        <strong>{journal.title}</strong> · {journal.entries.length} entrées ·
        Journal entier, quels que soient les filtres.
      </p>
      <form onSubmit={submit}>
        <div className="export-grid">
          {exportFormats.map((f) => (
            <label
              className={`export-choice ${format === f.id ? "selected" : ""}`}
              key={f.id}
            >
              <input
                type="radio"
                name="format"
                value={f.id}
                checked={format === f.id}
                onChange={() => {
                  setFormat(f.id);
                  setDone("");
                  setAcknowledged(false);
                }}
              />
              <span>
                <strong>
                  {f.name}
                  <code>{f.extension}</code>
                </strong>
                <small>{f.detail}</small>
              </span>
            </label>
          ))}
        </div>
        {format === "orion" ? (
          <div className="inset">
            <p>
              <LockKeyhole size={16} />
              Archive protégée par une phrase secrète
            </p>
            <div className="form-pair">
              <label>
                Phrase secrète
                <input
                  type="password"
                  required
                  minLength={12}
                  maxLength={256}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>
              <label>
                Répéter la phrase
                <input
                  type="password"
                  required
                  minLength={12}
                  maxLength={256}
                  autoComplete="new-password"
                  value={repeat}
                  onChange={(e) => setRepeat(e.target.value)}
                />
              </label>
            </div>
            <small>
              12 caractères minimum. Transmettez la phrase par un canal distinct
              du fichier. Elle ne peut pas être récupérée par ORION.
            </small>
          </div>
        ) : (
          <div className="inset">
            <label className="check-label">
              <input
                required
                type="checkbox"
                checked={acknowledged}
                onChange={(e) => setAcknowledged(e.target.checked)}
              />
              <span>
                Je comprends que ce fichier contient les données du journal en
                clair et je choisis où le conserver ou le transmettre.
              </span>
            </label>
            {!["json"].includes(format) && (
              <small>
                Ce format contient l’état actuel des entrées. Pour conserver les
                versions précédentes et reprendre le journal, utilisez ORION ou
                JSON.
              </small>
            )}
          </div>
        )}
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        {done && (
          <p role="status" className="success">
            <FileCheck2 size={18} />
            {done}
          </p>
        )}
        <div className="modal-actions">
          <button type="button" onClick={onClose} disabled={busy}>
            Fermer
          </button>
          <button className="primary" disabled={busy}>
            <Download size={16} />
            {busy ? "Préparation…" : "Télécharger le journal"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
export function ImportModal({
  target,
  onClose,
  onImport,
}: {
  target?: Journal;
  onClose: () => void;
  onImport: (journal: Journal, merge: boolean) => void;
}) {
  const [candidate, setCandidate] = useState<Archive | null>(null);
  const [encrypted, setEncrypted] = useState<unknown>(null);
  const [password, setPassword] = useState("");
  const [notice, setNotice] = useState("");
  const [filename, setFilename] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [merge, setMerge] = useState(false);
  const plan =
    candidate && target ? planMerge(target, candidate.journal) : null;
  function accept(value: unknown) {
    const result = importJson(value);
    setCandidate(result.archive);
    setNotice(result.notice);
    setEncrypted(null);
  }
  async function read(file?: File) {
    if (!file) return;
    setError("");
    setCandidate(null);
    setEncrypted(null);
    setMerge(false);
    setFilename(file.name);
    setBusy(true);
    try {
      if (file.size > MAX_IMPORT_BYTES)
        throw new Error("Ce fichier dépasse 32 Mo.");
      const text = await file.text();
      if (/\.(csv|tsv)$/i.test(file.name)) {
        setCandidate(importCsv(text, file.name.replace(/\.[^.]+$/, "")));
        setNotice(
          "CSV : les entrées sont recréées, sans les versions précédentes. Pour un transfert fidèle, utilisez une archive ORION ou JSON.",
        );
      } else {
        const value = JSON.parse(text);
        if (value?.format === "orion-encrypted") setEncrypted(value);
        else accept(value);
      }
    } catch (err) {
      setError(
        err instanceof SyntaxError
          ? "Ce fichier n’est pas un fichier JSON / ORION valide."
          : (err as Error).message,
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title="Importer un journal"
      onClose={() => {
        if (!busy) onClose();
      }}
    >
      <p className="modal-intro">
        Reprenez un journal reçu d’un collègue ou votre propre sauvegarde. Le
        fichier est lu uniquement sur ce poste.
      </p>
      <label className="dropzone">
        <FileUp size={28} />
        <strong>Choisir un fichier</strong>
        <span>ORION · JSON · CSV · TSV · 32 Mo maximum</span>
        <input
          type="file"
          accept=".orion,.json,.csv,.tsv"
          disabled={busy}
          onChange={(e) => void read(e.target.files?.[0])}
        />
      </label>
      {filename && <p className="file-caption">{filename}</p>}
      {!!encrypted && (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError("");
            try {
              accept((await decrypt(encrypted, password)).value);
              setPassword("");
            } catch (err) {
              setError((err as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <label>
            Phrase secrète du fichier
            <input
              type="password"
              required
              minLength={12}
              maxLength={256}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="off"
            />
          </label>
          <button className="primary" disabled={busy}>
            <LockKeyhole size={16} />
            Déchiffrer l’archive
          </button>
        </form>
      )}
      {candidate && (
        <div className="import-preview">
          <p className="eyebrow">
            <ShieldCheck size={14} />
            Fichier vérifié · prêt à importer
          </p>
          <h3>{candidate.journal.title}</h3>
          <p>
            {candidate.journal.entries.length} entrées ·{" "}
            {candidate.journal.mode} · {candidate.journal.classification}
          </p>
          <p className="muted">{notice}</p>
          <label className="check-label">
            <input
              type="radio"
              name="import-mode"
              checked={!merge}
              onChange={() => setMerge(false)}
            />
            <span>
              Ouvrir comme journal séparé{" "}
              <small>Le journal actuel reste intact.</small>
            </span>
          </label>
          {target && (
            <label className="check-label">
              <input
                type="radio"
                name="import-mode"
                checked={merge}
                onChange={() => setMerge(true)}
                disabled={!!target.closedAt || !!plan?.conflicts.length}
              />
              <span>
                Fusionner dans « {target.title} »
                <small>
                  {plan?.added.length} nouvelles · {plan?.duplicates.length}{" "}
                  identiques ignorées · {plan?.conflicts.length} conflits
                </small>
              </span>
            </label>
          )}
          {!!plan?.conflicts.length && (
            <p className="warning">
              Des entrées ont été modifiées différemment. Importez un journal
              séparé pour conserver les deux versions.
            </p>
          )}
          <div className="modal-actions">
            <button onClick={onClose}>Annuler</button>
            <button
              className="primary"
              onClick={() => {
                try {
                  onImport(candidate.journal, merge);
                  onClose();
                } catch (err) {
                  setError((err as Error).message);
                }
              }}
            >
              <FileUp size={16} />
              {merge
                ? "Fusionner les nouvelles entrées"
                : "Importer le journal"}
            </button>
          </div>
        </div>
      )}
      {busy && <p role="status">Lecture du fichier…</p>}
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      <p className="hint">
        Excel, Word et PDF sont des exports de lecture. Pour réimporter sans
        perdre l’historique, demandez le fichier ORION ou JSON.
      </p>
    </Modal>
  );
}
