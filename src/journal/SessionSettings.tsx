import { useState } from "react";
import {
  Download,
  FolderClosed,
  HardDrive,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";
import {
  dateTime,
  now,
  type Journal,
  type Workspace,
} from "../../shared/journal";
import { Modal } from "./Modal";
export function Settings({
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
    <Modal
      title="Le poste et le journal"
      onClose={() => {
        if (!busy) onClose();
      }}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const value = author.trim();
          if (!value) return;
          onUpdate({ ...workspace, author: value });
          setDone(
            "Opérateur mis à jour. Les anciennes saisies gardent leur auteur.",
          );
        }}
      >
        <label>
          Opérateur actuel
          <input
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            required
            maxLength={120}
          />
        </label>
        <button>Changer d’opérateur</button>
        <small>
          Ce nom identifie les saisies ; il ne constitue pas une
          authentification.
        </small>
      </form>
      <div className="settings-section">
        <h3>
          <HardDrive size={17} />
          Reprise après crash
        </h3>
        {persistent ? (
          <>
            <p className="success">Reprise automatique chiffrée activée.</p>
            <p>
              Exportez régulièrement une archive. Le nettoyage du navigateur ou
              la perte du poste peut supprimer votre espace.
            </p>
            <button onClick={onEnd}>
              <LockKeyhole size={16} />
              Verrouiller l’espace
            </button>
          </>
        ) : stored ? (
          <p>
            Un espace chiffré existe déjà. Exportez cette session, puis
            déverrouillez cet espace pour y importer votre journal.
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
            <p>
              Choisissez cette option sur un poste que vous êtes autorisé à
              utiliser pour conserver ces données.
            </p>
            <label>
              Phrase secrète · 12 caractères minimum
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
            <small>
              Elle ne peut pas être récupérée. Conservez-la séparément de vos
              archives.
            </small>
            <button className="primary" disabled={busy}>
              <ShieldCheck size={16} />
              {busy ? "Chiffrement…" : "Activer la sauvegarde chiffrée"}
            </button>
          </form>
        )}
      </div>
      <div className="settings-section">
        <h3>
          <FolderClosed size={17} />
          Fin de l’intervention
        </h3>
        <p>
          {journal.closedAt
            ? `Clôturé le ${dateTime(journal.closedAt)}. Le journal reste exportable.`
            : "Clôturer empêche les nouvelles saisies. Le journal reste consultable et exportable."}
        </p>
        <div className="action-row">
          <button onClick={onExport}>
            <Download size={16} />
            Exporter le journal
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
        <h3>Terminer et libérer le poste</h3>
        <p>
          Après export de chaque journal, effacez la session et sa sauvegarde de
          reprise de ce navigateur. Les fichiers téléchargés restent à votre
          disposition.
        </p>
        <button
          className="danger-button"
          onClick={async () => {
            setError("");
            try {
              await onFinish();
            } catch (err) {
              setError((err as Error).message);
            }
          }}
        >
          Terminer et effacer la session
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
    </Modal>
  );
}
