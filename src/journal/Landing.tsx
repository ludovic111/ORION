import { useState } from "react";
import { ArrowLeft, ArrowRight, FileUp, LockKeyhole } from "lucide-react";
import type { Journal } from "../../shared/journal";
import { Mark } from "../ui/Mark";
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
      <header className="landing-bar">
        <span className="topbar-brand">
          <Mark />
          <span>orion aic</span>
        </span>
        <span className="landing-version">1.2</span>
        <button className="link" onClick={onPrivacy}>
          Sécurité et données
        </button>
      </header>
      <main className="landing-main">
        <section className="landing-system" aria-label="Système">
          <h1>
            Journal d’intervention
            <br />
            Plan du réseau radio
          </h1>
          <dl className="spec">
            <div>
              <dt>Stockage</dt>
              <dd>Ce poste · AES-256-GCM</dd>
            </div>
            <div>
              <dt>Serveur</dt>
              <dd>Aucun</dd>
            </div>
            <div>
              <dt>Compte</dt>
              <dd>Aucun</dd>
            </div>
            <div>
              <dt>Transfert</dt>
              <dd>Archive .orionaic chiffrée</dd>
            </div>
            <div>
              <dt>Impression</dt>
              <dd>Fiches message A4 · plan radio A4</dd>
            </div>
            <div>
              <dt>Radio</dt>
              <dd>Polycom · noms d’appel, TKG, terminaux, remises</dd>
            </div>
          </dl>
          <button className="demo" onClick={onDemo}>
            Ouvrir l’exercice de démonstration
            <ArrowRight size={14} />
          </button>
        </section>
        <section className="panel start">
          {stored && !temporary ? (
            <>
              <header className="panel-head">
                <LockKeyhole size={14} />
                <span className="label">Reprendre la session</span>
              </header>
              <form
                className="stack"
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
                  Phrase de récupération
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
                  {busy ? "Déchiffrement…" : "Déverrouiller"}
                  <ArrowRight size={15} />
                </button>
              </form>
              <div className="start-links">
                <button className="link" onClick={() => setTemporary(true)}>
                  Nouvelle session temporaire
                </button>
              </div>
              <details className="danger-zone">
                <summary>Phrase perdue</summary>
                <p>
                  Irrécupérable. Reprenez depuis une archive, ou effacez
                  l’espace local de ce navigateur.
                </p>
                <button
                  className="danger"
                  onClick={async () => {
                    if (
                      window.prompt(
                        "Effacement définitif de l’espace chiffré de ce navigateur. Saisissez EFFACER.",
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
              <header className="panel-head">
                <span className="label">Nouvelle session</span>
                {stored && (
                  <button className="link" onClick={() => setTemporary(false)}>
                    <ArrowLeft size={12} />
                    Session enregistrée
                  </button>
                )}
              </header>
              <JournalSetup recovery={!stored} onCreate={onCreate} />
            </>
          )}
          <footer className="panel-foot">
            <span>Fichier .orionaic, .json ou .csv</span>
            <button onClick={onImport}>
              <FileUp size={14} />
              Importer
            </button>
          </footer>
          {(failure || error) && (
            <p className="error" role="alert">
              {failure || error}
            </p>
          )}
        </section>
      </main>
      <footer className="landing-foot">
        <span>
          Logiciel indépendant. Sans affiliation ni homologation OFPP ou État de
          Genève.
        </span>
        <a href="/source/orion-aic-source.tar.gz" download>
          Code source · AGPL-3.0
        </a>
      </footer>
    </div>
  );
}
