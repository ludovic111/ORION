import { useState } from "react";
import { FileUp, History, LockKeyhole } from "lucide-react";
import {
  dateTime,
  planMerge,
  type Archive,
  type Journal,
} from "../../shared/journal";
import { firstMoment, moments } from "../../shared/history";
import {
  importCsv,
  importJson,
  MAX_IMPORT_BYTES,
} from "../../shared/interchange";
import { decrypt } from "../../shared/crypto";
import { Modal } from "./Modal";
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
  // What the time machine can replay once imported.
  const replay = candidate
    ? (() => {
        const steps = moments(candidate.journal);
        return {
          steps: steps.length,
          events: candidate.journal.history.length,
          from: firstMoment(candidate.journal),
          to: steps.length
            ? new Date(steps[steps.length - 1]).toISOString()
            : "",
        };
      })()
    : null;
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
        if (value?.format === "orion-dossier")
          throw new Error(
            "Ce fichier contient les tableaux d’un export (JSON données), pas une archive. Importez l’archive orion aic (.orionaic) ou l’archive JSON réimportable.",
          );
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
      <p className="modal-intro">
        Une archive orion aic (.orionaic ou JSON réimportable) contient toute
        l’opération et son historique. Importée dans un journal séparé, elle
        permet à chacun de la rejouer pas à pas avec la machine à remonter le
        temps.
      </p>
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
          {replay && (
            <p className="hint">
              <History size={12} />{" "}
              {replay.steps > 1
                ? `Rejouable : ${replay.steps} moments de changement, du ${dateTime(replay.from)} au ${dateTime(replay.to)}${replay.events ? ` · ${replay.events} changements d’éléments` : " · versions des entrées seulement"}.`
                : "Aucun historique à rejouer : l’état du fichier est importé tel quel."}
            </p>
          )}
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
              Journal séparé
              <small>
                Le journal actuel reste intact. Idéal pour relire ou rejouer
                l’opération.
              </small>
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
