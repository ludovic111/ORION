import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { newJournal, type Journal } from "../../shared/journal";
export function JournalSetup({
  author: initialAuthor = "",
  recovery = false,
  onCreate,
}: {
  author?: string;
  recovery?: boolean;
  onCreate: (
    journal: Journal,
    author: string,
    password?: string,
  ) => Promise<void> | void;
}) {
  const [protect, setProtect] = useState(recovery);
  const [password, setPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [busy, setBusy] = useState(false);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState(initialAuthor);
  const [organization, setOrganization] = useState("");
  const [location, setLocation] = useState("");
  const [reference, setReference] = useState("");
  const [mode, setMode] = useState<Journal["mode"]>("Exercice");
  const [classification, setClassification] =
    useState<Journal["classification"]>("Interne");
  const [error, setError] = useState("");
  return (
    <form
      className="stack"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        try {
          if (protect && password !== repeat)
            throw new Error(
              "Les phrases de récupération ne correspondent pas.",
            );
          await onCreate(
            newJournal(title, {
              organization,
              location,
              reference,
              mode,
              classification,
            }),
            author.trim(),
            protect ? password : undefined,
          );
        } catch (err) {
          setError((err as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <label>
        <span>
          Événement <span className="required">*</span>
        </span>
        <input
          required
          maxLength={200}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Crue de l’Arve · secteur Carouge"
          autoFocus
          data-autofocus
        />
      </label>
      <div className="form-pair">
        <label>
          <span>
            Opérateur <span className="required">*</span>
          </span>
          <input
            required
            maxLength={120}
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="Nom ou fonction"
          />
        </label>
        <label>
          Mode
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as Journal["mode"])}
          >
            <option>Exercice</option>
            <option>Intervention</option>
          </select>
        </label>
      </div>
      <details>
        <summary>Organisation, lieu, référence</summary>
        <div className="details-fields">
          <label>
            Organisation
            <input
              maxLength={200}
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              placeholder="OPC / ORPC, compagnie"
            />
          </label>
          <label>
            Lieu / secteur
            <input
              maxLength={300}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </label>
          <div className="form-pair">
            <label>
              Référence
              <input
                maxLength={200}
                value={reference}
                onChange={(e) => setReference(e.target.value)}
              />
            </label>
            <label>
              Diffusion
              <select
                value={classification}
                onChange={(e) =>
                  setClassification(e.target.value as Journal["classification"])
                }
              >
                <option>Interne</option>
                <option>Confidentiel</option>
              </select>
            </label>
          </div>
        </div>
      </details>
      {recovery && (
        <div className="recovery-choice">
          <label className="check-label">
            <input
              type="checkbox"
              checked={protect}
              onChange={(e) => setProtect(e.target.checked)}
            />
            <span>Sauvegarde chiffrée sur ce poste</span>
          </label>
          {protect ? (
            <div className="details-fields">
              <div className="form-pair">
                <label>
                  Phrase de récupération
                  <input
                    type="password"
                    required
                    minLength={12}
                    maxLength={256}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    placeholder="12 caractères minimum"
                  />
                </label>
                <label>
                  Répéter la phrase
                  <input
                    type="password"
                    required
                    minLength={12}
                    maxLength={256}
                    value={repeat}
                    onChange={(e) => setRepeat(e.target.value)}
                    autoComplete="new-password"
                  />
                </label>
              </div>
              <small>Demandée après fermeture ou crash. Irrécupérable.</small>
            </div>
          ) : (
            <p className="hint warn">
              Temporaire : perdu à la fermeture de l’onglet. Exportez
              régulièrement.
            </p>
          )}
        </div>
      )}
      {mode === "Intervention" && (
        <p className="hint">
          Engagement réel : poste et installation autorisés par votre
          organisation uniquement.
        </p>
      )}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <button type="submit" className="primary large" disabled={busy}>
        {busy ? "Chiffrement…" : "Ouvrir le journal"}
        <ArrowRight size={15} />
      </button>
    </form>
  );
}
