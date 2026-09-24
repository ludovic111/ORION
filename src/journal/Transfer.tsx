import { useState } from "react";
import { Download, FileCheck2, FileUp, LockKeyhole } from "lucide-react";
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
const suffixes: Partial<Record<ExportFormat, string>> = {
  sheets: "fiches",
  radio: "radio",
};
export function ExportModal({
  journal,
  author,
  onClose,
  onBackup,
}: {
  journal: Journal;
  author: string;
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
      const blob = await makeExport(journal, format, password, author);
      const name = fileName(
        journal,
        exportFormats.find((f) => f.id === format)!.extension,
        suffixes[format],
      );
      download(blob, name);
      if (format === "orion" || format === "json") onBackup();
      setDone(`${name} · vérifiez le dossier de téléchargement.`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title="Exporter"
      onClose={() => {
        if (!busy) onClose();
      }}
      wide
    >
      <p className="modal-intro mono">
        {journal.title} · {journal.entries.length} entrées ·{" "}
        {journal.radio.terminals.length} terminaux · journal entier, sans filtre
      </p>
      <form onSubmit={submit} className="stack">
        {[...new Set(exportFormats.map((f) => f.group))].map((group) => (
          <fieldset className="format-group" key={group}>
            <legend className="section-label">{group}</legend>
            <div className="format-grid">
              {exportFormats
                .filter((f) => f.group === group)
                .map((f) => (
                  <label className="format" key={f.id}>
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
          </fieldset>
        ))}
        {format === "orion" ? (
          <div className="inset">
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
              <LockKeyhole size={11} /> 12 caractères min. Transmise par un
              autre canal que le fichier. Irrécupérable.
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
              <span>Fichier en clair : je choisis où il est conservé.</span>
            </label>
            {format !== "json" && (
              <small>
                État actuel uniquement, non réimportable sans perte.
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
            <Download size={14} />
            {busy ? "Préparation…" : "Télécharger"}
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
  onImport: (journal: Journal, merge: boolean, author?: string) => void;
}) {
  const [author, setAuthor] = useState("");
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
        setNotice("CSV : entrées recréées sans leurs versions antérieures.");
      } else {
        const value = JSON.parse(text);
        if (value?.format === "orion-encrypted") setEncrypted(value);
        else accept(value);
      }
    } catch (err) {
      setError(
        err instanceof SyntaxError
          ? "Ce fichier n’est pas un fichier JSON / orion aic valide."
          : (err as Error).message,
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title="Importer"
      onClose={() => {
        if (!busy) onClose();
      }}
    >
      <label className="dropzone">
        <FileUp size={20} />
        <strong>Choisir un fichier</strong>
        <span className="mono">
          .orionaic · .orion · .json · .csv · .tsv · 32 Mo max · lu localement
        </span>
        <input
          type="file"
          accept=".orionaic,.orion,.json,.csv,.tsv"
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
            Phrase de l’archive
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
            <LockKeyhole size={14} />
            Déchiffrer
          </button>
        </form>
      )}
      {candidate && (
        <div className="import-preview">
          <span className="section-label">Fichier valide</span>
          <h3>{candidate.journal.title}</h3>
          <p className="mono">
            {candidate.journal.entries.length} entrées ·{" "}
            {candidate.journal.radio.terminals.length} terminaux ·{" "}
            {candidate.journal.mode} · {candidate.journal.classification}
          </p>
          <p className="muted">{notice}</p>
          {!target && (
            <label>
              <span>
                Opérateur sur ce poste <span className="required">*</span>
              </span>
              <input
                value={author}
                maxLength={120}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Nom ou fonction"
              />
            </label>
          )}
          <label className="check-label">
            <input
              type="radio"
              name="import-mode"
              checked={!merge}
              onChange={() => setMerge(false)}
            />
            <span>
              Journal séparé <small>Le journal actuel reste intact.</small>
            </span>
          </label>
          {target && (
            <label className="check-label">
              <input
                type="radio"
                name="import-mode"
                checked={merge}
                onChange={() => setMerge(true)}
                disabled={
                  !!target.closedAt ||
                  !!plan?.conflicts.length ||
                  !!plan?.radio.conflicts
                }
              />
              <span>
                Fusionner dans « {target.title} »
                <small className="mono">
                  +{plan?.added.length} entrées · {plan?.duplicates.length}{" "}
                  identiques · −{plan?.removed.length} supprimées ailleurs ·{" "}
                  {plan?.conflicts.length} conflits · radio +{plan?.radio.added}{" "}
                  / ~{plan?.radio.updated} / {plan?.radio.conflicts} conflits
                </small>
              </span>
            </label>
          )}
          {(!!plan?.conflicts.length || !!plan?.radio.conflicts) && (
            <p className="hint warn">
              Versions divergentes : importez en journal séparé pour comparer.
            </p>
          )}
          <div className="modal-actions">
            <button onClick={onClose}>Annuler</button>
            <button
              className="primary"
              disabled={!target && !author.trim()}
              onClick={() => {
                try {
                  onImport(candidate.journal, merge, author.trim());
                  onClose();
                } catch (err) {
                  setError((err as Error).message);
                }
              }}
            >
              <FileUp size={14} />
              {merge ? "Fusionner" : "Importer"}
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
    </Modal>
  );
}
