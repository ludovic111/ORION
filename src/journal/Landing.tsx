import { useState } from "react";
import {
  Activity,
  ArrowRight,
  BookOpen,
  FileUp,
  Inbox,
  LockKeyhole,
  Map,
  Moon,
  Network,
  Radio,
  Sparkles,
  Sun,
  Users,
  Wifi,
} from "lucide-react";
import type { Journal } from "../../shared/journal";
import { normalizeCode, validCode } from "../../shared/room";
import type { SyncStatus } from "../sync/useSync";
import { Brand } from "../ui/Mark";
import { JournalSetup } from "./JournalSetup";

export type JoinRequest = { code: string; author: string; password?: string };

const FEATURES = [
  { icon: BookOpen, label: "Journal d’intervention", h: 212 },
  { icon: Inbox, label: "Messages et synthèse", h: 265 },
  { icon: Map, label: "Carte de situation", h: 160 },
  { icon: Users, label: "Équipe et postes", h: 330 },
  { icon: Radio, label: "Réseau radio Polycom", h: 120 },
  { icon: Activity, label: "Renseignements clés", h: 250 },
  { icon: Network, label: "Tout est relié", h: 285 },
  { icon: Wifi, label: "Multi-postes en direct", h: 190 },
];

export function Landing({
  stored,
  joinCode,
  joining,
  syncStatus,
  relayCount,
  onJoin,
  onCancelJoin,
  onCreate,
  onDemo,
  onImport,
  onPrivacy,
  onUnlock,
  onForget,
  theme,
  onTheme,
  error,
}: {
  stored: boolean;
  joinCode: string;
  joining: JoinRequest | null;
  syncStatus: SyncStatus;
  relayCount: number;
  onJoin: (request: JoinRequest) => void;
  onCancelJoin: () => void;
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
  theme: string;
  onTheme: () => void;
  error: string;
}) {
  const [tab, setTab] = useState<"resume" | "new" | "join">(
    joinCode ? "join" : stored ? "resume" : "new",
  );
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState("");
  const [code, setCode] = useState(normalizeCode(joinCode));
  const [author, setAuthor] = useState("");
  const [protect, setProtect] = useState(!stored);
  const [secret, setSecret] = useState("");
  const [repeat, setRepeat] = useState("");
  return (
    <div className="landing">
      <header className="landing-bar">
        <Brand size={28} />
        <span className="pill plain">2.0</span>
        <button className="link push" onClick={onPrivacy}>
          Sécurité et données
        </button>
        <button
          className="icon-button"
          onClick={onTheme}
          aria-label={theme === "light" ? "Thème sombre" : "Thème clair"}
        >
          {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
        </button>
      </header>
      <main className="landing-main">
        <section className="hero reveal">
          <h1>
            Aide à la conduite,
            <br />
            <span className="gradient-text">tout relié.</span>
          </h1>
          <p className="lead">
            Journal d’intervention, messages, carte, moyens, équipe, radio,
            météo et rythme de conduite dans un seul outil. Local et chiffré,
            sans compte ni base de données, synchronisé en direct entre les
            postes d’un même poste de conduite.
          </p>
          <div className="hero-features stagger">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  className="hero-feature"
                  key={f.label}
                  style={{ ["--h" as string]: f.h }}
                >
                  <Icon size={17} />
                  {f.label}
                </div>
              );
            })}
          </div>
          <div className="hero-actions">
            <button className="spark" onClick={onDemo}>
              <Sparkles size={15} />
              Ouvrir l’exercice de démonstration
              <ArrowRight size={14} />
            </button>
          </div>
        </section>
        <section
          className="panel start spot reveal"
          style={{ animationDelay: "120ms" }}
        >
          <div className="tabs" role="tablist">
            {stored && (
              <button
                aria-pressed={tab === "resume"}
                onClick={() => setTab("resume")}
              >
                <LockKeyhole size={14} />
                Reprendre
              </button>
            )}
            <button aria-pressed={tab === "new"} onClick={() => setTab("new")}>
              Nouvelle session
            </button>
            <button
              aria-pressed={tab === "join"}
              onClick={() => setTab("join")}
            >
              <Wifi size={14} />
              Rejoindre
            </button>
          </div>
          <div className="start-body">
            {tab === "resume" && stored && (
              <>
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
                  <p className="muted">
                    Une session chiffrée est enregistrée sur ce poste.
                  </p>
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
                          setTab("new");
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
            )}
            {tab === "new" && (
              <JournalSetup recovery={!stored} onCreate={onCreate} />
            )}
            {tab === "join" &&
              (joining ? (
                <div
                  className="stack"
                  style={{ alignItems: "center", textAlign: "center" }}
                >
                  <div className="empty-state" style={{ padding: "12px 0" }}>
                    <div className="orbit">
                      <Wifi size={28} />
                    </div>
                    <h3>
                      {syncStatus === "live"
                        ? relayCount
                          ? "Réception de la session…"
                          : "En attente d’un autre poste"
                        : "Connexion…"}
                    </h3>
                    <p>
                      Code <b className="mono">{joining.code}</b>.{" "}
                      {syncStatus === "live" && !relayCount
                        ? "Aucun poste n’a encore ouvert cette session : vérifiez le code, ou activez la synchronisation sur le poste qui a la session."
                        : "La session arrive dès qu’un poste qui l’a est en ligne."}
                    </p>
                  </div>
                  <button onClick={onCancelJoin}>Annuler</button>
                </div>
              ) : (
                <form
                  className="stack"
                  onSubmit={(e) => {
                    e.preventDefault();
                    setFailure("");
                    if (!validCode(code)) {
                      setFailure("Code incomplet : 4 groupes de 4 caractères.");
                      return;
                    }
                    if (protect && secret !== repeat) {
                      setFailure(
                        "Les phrases de récupération ne correspondent pas.",
                      );
                      return;
                    }
                    onJoin({
                      code: normalizeCode(code),
                      author: author.trim(),
                      password: protect ? secret : undefined,
                    });
                  }}
                >
                  <p className="muted">
                    Un autre poste a partagé sa session (Réglages →
                    Synchronisation). Saisissez son code ou scannez son QR code.
                  </p>
                  <label>
                    Code de session
                    <input
                      required
                      value={code}
                      className="mono"
                      placeholder="ABCD-EFGH-JKMN-PQRS"
                      onChange={(e) => setCode(normalizeCode(e.target.value))}
                      autoFocus={!code}
                      style={{ fontSize: 17, letterSpacing: "0.08em" }}
                    />
                  </label>
                  <label>
                    Votre nom ou fonction
                    <input
                      required
                      maxLength={120}
                      value={author}
                      autoFocus={!!code}
                      onChange={(e) => setAuthor(e.target.value)}
                      placeholder="ex. Sgt Muller, opérateur journal"
                    />
                  </label>
                  {!stored && (
                    <label className="check-label">
                      <input
                        type="checkbox"
                        checked={protect}
                        onChange={(e) => setProtect(e.target.checked)}
                      />
                      <span>Sauvegarde chiffrée sur ce poste</span>
                    </label>
                  )}
                  {protect && !stored && (
                    <div className="form-pair">
                      <label>
                        Phrase de récupération
                        <input
                          type="password"
                          required
                          minLength={12}
                          maxLength={256}
                          value={secret}
                          onChange={(e) => setSecret(e.target.value)}
                          autoComplete="new-password"
                        />
                      </label>
                      <label>
                        Répéter
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
                  )}
                  {stored && (
                    <p className="hint warn">
                      Une session est déjà enregistrée sur ce poste : celle-ci
                      restera temporaire (exportez régulièrement).
                    </p>
                  )}
                  <button className="primary large">
                    Rejoindre la session
                    <ArrowRight size={15} />
                  </button>
                </form>
              ))}
          </div>
          <footer className="panel-foot">
            <span>Fichier .orionaic, .orion, .json ou .csv</span>
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
