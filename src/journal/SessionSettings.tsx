import { useState } from "react";
import { Download, LockKeyhole } from "lucide-react";
import {
  dateTime,
  now,
  type Journal,
  type Workspace,
} from "../../shared/journal";
export function SessionPanel({
  workspace,
  journal,
  persistent,
  stored,
  onClose,
  onProtect,
  onUpdate,
  onJournal,
  onEnd,
  onFinish,
  onExport,
}: {
  workspace: Workspace;
  journal: Journal;
  persistent: boolean;
  stored: boolean;
  onClose: () => void;
  onProtect: (password: string) => Promise<void>;
  onUpdate: (value: Workspace) => void;
  onJournal: (value: Journal) => void;
  onEnd: () => void;
  onFinish: () => Promise<void>;
  onExport: () => void;
}) {
  const [author, setAuthor] = useState(workspace.author);
  const [password, setPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");
  return (
    <>
      <form
        className="settings-section"
        onSubmit={(e) => {
          e.preventDefault();
          const value = author.trim();
          if (!value) return;
          onUpdate({ ...workspace, author: value });
          setDone(
            "Opérateur modifié. Les saisies existantes gardent leur auteur.",
          );
        }}
      >
        <h3 className="section-label">Opérateur</h3>
        <div className="inline-field">
          <input
            aria-label="Opérateur"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            required
            maxLength={120}
          />
          <button>Appliquer</button>
        </div>
        <small>Déclaratif, sans authentification.</small>
      </form>
      <div className="settings-section">
        <h3 className="section-label">Sauvegarde locale</h3>
        {persistent ? (
          <>
            <p className="success">Active · chiffrée sur ce poste.</p>
            <p className="muted">
              Ne remplace pas une archive : le nettoyage du navigateur l’efface.
            </p>
            <button onClick={onEnd}>
              <LockKeyhole size={14} />
              Verrouiller
            </button>
          </>
        ) : stored ? (
          <p className="muted">
            Un espace chiffré existe déjà sur ce poste. Exportez cette session,
            déverrouillez l’espace existant, puis importez.
          </p>
        ) : (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setError("");
              setBusy(true);
              try {
                if (password !== repeat)
                  throw new Error("Les phrases secrètes ne correspondent pas.");
                await onProtect(password);
                setPassword("");
                setRepeat("");
                setDone("Reprise après crash activée.");
              } catch (err) {
                setError((err as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            <p className="hint warn">
              Session temporaire. Activez uniquement sur un poste autorisé.
            </p>
            <label>
              Phrase de récupération · 12 caractères min.
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
            <small>Irrécupérable. À conserver séparément des archives.</small>
            <button className="primary" disabled={busy}>
              {busy ? "Chiffrement…" : "Activer"}
            </button>
          </form>
        )}
      </div>
      <div className="settings-section">
        <h3 className="section-label">Clôture · {journal.title}</h3>
        <p className="muted">
          {journal.closedAt
            ? `Clôturé le ${dateTime(journal.closedAt)}.`
            : "Bloque saisies, corrections et plan radio. Lecture et export restent possibles."}
        </p>
        <div className="action-row">
          <button onClick={onExport}>
            <Download size={14} />
            Exporter
          </button>
          <button
            onClick={() => {
              if (
                window.confirm(
                  journal.closedAt
                    ? "Rouvrir ce journal et autoriser de nouvelles saisies ?"
                    : "Clôturer ce journal ? Vous pourrez le rouvrir depuis cet écran.",
                )
              ) {
                onJournal({
                  ...journal,
                  closedAt: journal.closedAt ? "" : now(),
                });
                onClose();
              }
            }}
          >
            {journal.closedAt ? "Rouvrir le journal" : "Clôturer le journal"}
          </button>
        </div>
      </div>
      <div className="settings-section">
        <h3 className="section-label">Libérer le poste</h3>
        <p className="muted">
          Efface la session et sa sauvegarde locale. Les fichiers exportés ne
          sont pas touchés.
        </p>
        <button
          className="danger"
          onClick={async () => {
            setError("");
            try {
              await onFinish();
            } catch (err) {
              setError((err as Error).message);
            }
          }}
        >
          Effacer la session
        </button>
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {done && (
        <p className="success" role="status">
          {done}
        </p>
      )}
    </>
  );
}
