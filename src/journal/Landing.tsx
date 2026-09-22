import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Clock3,
  FileUp,
  HardDrive,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";
import type { Journal } from "../../shared/journal";
import { JournalSetup } from "./JournalSetup";
export function Landing({
  stored,
  onCreate,
  onDemo,
  onImport,
  onPrivacy,
  onUnlock,
  onForget,
  error,
}: {
  stored: boolean;
  onCreate: (
    journal: Journal,
    author: string,
    password?: string,
  ) => Promise<void> | void;
  onDemo: () => void;
  onImport: () => void;
  onPrivacy: () => void;
  onUnlock: (password: string) => Promise<void>;
  onForget: () => Promise<void>;
  error: string;
}) {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState("");
  const [temporary, setTemporary] = useState(false);
  return (
    <div className="landing">
      <header>
        <a className="brand" href="/">
          <span className="brand-mark">
            O<span />
          </span>
          <div>
            ORION<small>JOURNAL D’INTERVENTION</small>
          </div>
        </a>
        <button className="text-button" onClick={onPrivacy}>
          <ShieldCheck size={15} />
          Confidentialité & code ouvert
        </button>
      </header>
      <main className="landing-main">
        <section className="landing-copy">
          <p className="eyebrow">
            <span className="status-dot" />
            PRÊT QUAND VOUS L’ÊTES
          </p>
          <h1>
            Les faits.
            <br />
            Les décisions.
            <br />
            <span>Une trace claire.</span>
          </h1>
          <p className="landing-description">
            Le journal d’intervention qui suit le rythme du terrain. Ouvrez,
            consignez, passez le relais.
          </p>
          <div className="landing-points">
            <div>
              <Clock3 size={18} />
              <span>
                <strong>Immédiat</strong>Sans compte. Sans installation.
              </span>
            </div>
            <div>
              <ShieldCheck size={18} />
              <span>
                <strong>Maîtrisé</strong>Vos données restent sur votre poste.
              </span>
            </div>
            <div>
              <ArrowRight size={18} />
              <span>
                <strong>Portable</strong>Un journal complet à transmettre et
                reprendre.
              </span>
            </div>
          </div>
          <button className="demo-link" onClick={onDemo}>
            Explorer un journal d’exemple <ArrowRight size={16} />
          </button>
          <small className="demo-note">
            Scénario fictif · aucune donnée réelle
          </small>
        </section>
        <section className="start-card">
          {stored && !temporary ? (
            <>
              <span className="icon-square">
                <LockKeyhole size={22} />
              </span>
              <h2>Reprendre la session</h2>
              <p className="muted">
                Une sauvegarde de session est présente sur ce poste.
              </p>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setBusy(true);
                  setFailure("");
                  try {
                    await onUnlock(password);
                  } catch (err) {
                    setFailure((err as Error).message);
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                <label>
                  Phrase secrète
                  <input
                    type="password"
                    required
                    value={password}
                    minLength={12}
                    maxLength={256}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    autoFocus
                  />
                </label>
                <button className="primary large" disabled={busy}>
                  <LockKeyhole size={16} />
                  {busy ? "Déverrouillage…" : "Reprendre mon journal"}
                  <ArrowRight size={16} />
                </button>
              </form>
              <button
                className="text-button"
                onClick={() => setTemporary(true)}
              >
                Ouvrir une autre session temporaire
              </button>
              <details className="recovery">
                <summary>Phrase de récupération oubliée ?</summary>
                <p>
                  ORION ne peut pas la récupérer. Reprenez une archive avec sa
                  phrase secrète, ou effacez l’espace local si vous disposez
                  d’une sauvegarde.
                </p>
                <button
                  className="danger-button"
                  onClick={async () => {
                    if (
                      window.prompt(
                        "Pour effacer uniquement l’espace chiffré de ce navigateur, saisissez EFFACER. Cette action est irréversible sans votre archive.",
                      ) === "EFFACER"
                    ) {
                      try {
                        await onForget();
                      } catch (err) {
                        setFailure((err as Error).message);
                      }
                    }
                  }}
                >
                  Effacer l’espace local
                </button>
              </details>
            </>
          ) : (
            <>
              <p className="eyebrow">NOUVELLE SESSION</p>
              <h2>Ouvrir un journal</h2>
              <p className="muted">
                Une session pour votre intervention, sans compte.
              </p>
              <JournalSetup recovery={!stored} onCreate={onCreate} />
              <div className="start-storage-note">
                <HardDrive size={17} />
                <p>
                  Aucune donnée sur un serveur.
                  <br />
                  <span>
                    La reprise locale protège cette session. Exportez puis
                    effacez le poste en fin d’intervention.
                  </span>
                </p>
              </div>
              {stored && (
                <button
                  className="text-button"
                  onClick={() => setTemporary(false)}
                >
                  <ArrowLeft size={13} />
                  Reprendre la session sauvegardée
                </button>
              )}
            </>
          )}
          <div className="start-import">
            <span>Vous avez déjà un journal ?</span>
            <button onClick={onImport}>
              <FileUp size={16} />
              Importer un fichier
            </button>
          </div>
          {(failure || error) && (
            <p className="error" role="alert">
              {failure || error}
            </p>
          )}
        </section>
      </main>
      <footer>
        <span>
          Projet indépendant · sans affiliation ni homologation
          institutionnelle.
        </span>
        <a href="/source/orion-source.tar.gz" download>
          AGPL-3.0 · Télécharger le code source ↗
        </a>
      </footer>
    </div>
  );
}
