import { useState } from "react";
import { ArrowRight, BookOpen } from "lucide-react";
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
      className="setup-form"
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
        Nom de l’intervention <span className="required">*</span>
        <input
          required
          maxLength={200}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex. Crue de l’Arve · secteur Carouge"
          autoFocus
        />
      </label>
      <div className="form-pair">
        <label>
          Votre nom ou indicatif <span className="required">*</span>
          <input
            required
            maxLength={120}
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="Ex. Opérateur Alpha"
          />
        </label>
        <label>
          Type de journal
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
        <summary>
          Préciser le cadre <span>Facultatif</span>
        </summary>
        <div className="details-fields">
          <label>
            Organisation
            <input
              maxLength={200}
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              placeholder="PCi, compagnie, cellule…"
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
            <span>
              Activer la reprise après crash{" "}
              <small>
                Recommandé · sauvegarde automatique chiffrée sur ce poste.
              </small>
            </span>
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
              <small>
                Propre à cette session, sans création de compte. Nécessaire
                après fermeture ou crash. ORION ne peut pas la récupérer.
              </small>
            </div>
          ) : (
            <p className="hint">
              Mode temporaire : les données seront perdues si cet onglet se
              ferme ou plante. Exportez régulièrement.
            </p>
          )}
        </div>
      )}
      {mode === "Intervention" && (
        <p className="hint">
          Pour un engagement réel, utilisez un poste et une installation
          autorisés par votre organisation. ORION est un projet indépendant,
          sans homologation institutionnelle.
        </p>
      )}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <button type="submit" className="primary large" disabled={busy}>
        <BookOpen size={17} />
        {busy ? "Protection de la session…" : "Ouvrir le journal"}
        <ArrowRight size={17} />
      </button>
    </form>
  );
}
