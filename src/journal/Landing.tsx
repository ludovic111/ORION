import { useState } from "react";
import {
  ArrowRight,
  FileUp,
  LockKeyhole,
  Moon,
  Play,
  Sun,
  Wifi,
} from "lucide-react";
import { LangSwitch, rich, type Lang } from "../i18n";
import type { Journal } from "../../shared/journal";
import { codeProblem, normalizeCode, validCode } from "../../shared/room";
import type { SyncStatus } from "../sync/useSync";
import { Brand } from "../ui/Mark";
import { JournalSetup } from "./JournalSetup";
import { CONTACT_EMAIL, feedbackLink } from "../app/contact";
import { t } from "./i18n.ts";

export type JoinRequest = { code: string; author: string; password?: string };

// What the tool holds, as a table of contents: plain words, no badges.
// A function: read in the language of the post each time it is shown.
const contents = (): [string, string][] => [
  [t("Journal"), t("Main courante horodatée, suivis, retards, relèves.")],
  [t("Messages"), t("Formule de message, tri, synthèse et impression A4.")],
  [t("Carte"), t("Fonds swisstopo, signes OFPP, zones, périmètres, mesures.")],
  [t("Moyens et équipe"), t("Engagements, états, présences et fonctions.")],
  [t("Radio"), t("Plan de réseau Polycom et contrôles de liaison.")],
  [
    t("Renseignements"),
    t("Chiffres clés, météo, agenda et rythme de conduite."),
  ],
  [t("Liens"), t("Chaque élément se relie aux autres, dans les deux sens.")],
  [t("Multi-postes"), t("Synchronisation chiffrée entre les postes du PC.")],
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
  lang,
  onLang,
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
  lang: Lang;
  onLang: (lang: Lang) => void;
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
        <span className="landing-version">{t("version 2.0")}</span>
        <button className="link push" onClick={onPrivacy}>
          {t("Sécurité et données")}
        </button>
        <LangSwitch value={lang} onChange={onLang} />
        <button
          className="icon-button"
          onClick={onTheme}
          aria-label={theme === "light" ? t("Thème sombre") : t("Thème clair")}
        >
          {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
        </button>
      </header>
      <main className="landing-main">
        <section className="hero reveal">
          <h1>
            {t("Tenir la conduite")}
            <span className="ember-dot">.</span>
          </h1>
          <p className="lead">
            {t(
              "Le journal, les messages, la carte, les moyens, l’équipe et la radio d’un poste de conduite de protection civile, au même endroit. Tout reste dans le navigateur, chiffré et sans compte ; les postes d’un même PC se synchronisent en direct.",
            )}
          </p>
          <dl className="hero-index stagger">
            {contents().map(([term, what]) => (
              <div key={term}>
                <dt>{term}</dt>
                <dd>{what}</dd>
              </div>
            ))}
          </dl>
          <div className="hero-actions">
            <button className="spark" onClick={onDemo}>
              <Play size={14} />
              {t("Ouvrir l’exercice de démonstration")}
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
                {t("Reprendre")}
              </button>
            )}
            <button aria-pressed={tab === "new"} onClick={() => setTab("new")}>
              {t("Nouvelle session")}
            </button>
            <button
              aria-pressed={tab === "join"}
              onClick={() => setTab("join")}
            >
              <Wifi size={14} />
              {t("Rejoindre")}
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
                    {t("Une session chiffrée est enregistrée sur ce poste.")}
                  </p>
                  <label>
                    {t("Phrase de récupération")}
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
                    {busy ? t("Déchiffrement…") : t("Déverrouiller")}
                    <ArrowRight size={15} />
                  </button>
                </form>
                <details className="danger-zone">
                  <summary>{t("Phrase perdue")}</summary>
                  <p>
                    {t(
                      "Irrécupérable. Reprenez depuis une archive, ou effacez l’espace local de ce navigateur.",
                    )}
                  </p>
                  <button
                    className="danger"
                    onClick={async () => {
                      // The word to type follows the language of the post;
                      // the French word is accepted everywhere.
                      const word = t("EFFACER");
                      const answer = window
                        .prompt(
                          t(
                            "Effacement définitif de l’espace chiffré de ce navigateur. Saisissez {word}.",
                            { word },
                          ),
                        )
                        ?.trim();
                      if (answer === word || answer === "EFFACER") {
                        try {
                          await onForget();
                          setTab("new");
                        } catch (err) {
                          setFailure((err as Error).message);
                        }
                      }
                    }}
                  >
                    {t("Effacer l’espace local")}
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
                          ? t("Réception de la session…")
                          : t("En attente d’un autre poste")
                        : t("Connexion…")}
                    </h3>
                    <p>
                      {rich(t("Code <0>{code}</0>.", { code: joining.code }), [
                        <b className="mono" />,
                      ])}{" "}
                      {syncStatus === "live" && !relayCount
                        ? t(
                            "Aucun poste n’a encore ouvert cette session : vérifiez le code, ou activez la synchronisation sur le poste qui a la session.",
                          )
                        : t(
                            "La session arrive dès qu’un poste qui l’a est en ligne.",
                          )}
                    </p>
                  </div>
                  <button onClick={onCancelJoin}>{t("Annuler")}</button>
                </div>
              ) : (
                <form
                  className="stack"
                  onSubmit={(e) => {
                    e.preventDefault();
                    setFailure("");
                    if (!validCode(code)) {
                      setFailure(codeProblem(code));
                      return;
                    }
                    if (protect && secret !== repeat) {
                      setFailure(
                        t("Les phrases de récupération ne correspondent pas."),
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
                    {t(
                      "Un autre poste a partagé sa session (Réglages → Synchronisation). Saisissez son code ou scannez son QR code.",
                    )}
                  </p>
                  <label>
                    {t("Code de session")}
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
                    {t("Votre nom ou fonction")}
                    <input
                      required
                      maxLength={120}
                      value={author}
                      autoFocus={!!code}
                      onChange={(e) => setAuthor(e.target.value)}
                      placeholder={t("ex. Sgt Muller, opérateur journal")}
                    />
                  </label>
                  {!stored && (
                    <label className="check-label">
                      <input
                        type="checkbox"
                        checked={protect}
                        onChange={(e) => setProtect(e.target.checked)}
                      />
                      <span>{t("Sauvegarde chiffrée sur ce poste")}</span>
                    </label>
                  )}
                  {protect && !stored && (
                    <div className="form-pair">
                      <label>
                        {t("Phrase de récupération")}
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
                        {t("Répéter")}
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
                      {t(
                        "Une session est déjà enregistrée sur ce poste : celle-ci restera temporaire (exportez régulièrement).",
                      )}
                    </p>
                  )}
                  <button className="primary large">
                    {t("Rejoindre la session")}
                    <ArrowRight size={15} />
                  </button>
                </form>
              ))}
          </div>
          <footer className="panel-foot">
            <span>{t("Fichier .orionaic, .orion, .json ou .csv")}</span>
            <button onClick={onImport}>
              <FileUp size={14} />
              {t("Importer")}
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
          {t(
            "Logiciel indépendant. Sans affiliation ni homologation OFPP ou État de Genève.",
          )}
        </span>
        <span className="landing-foot-links">
          <a href={feedbackLink("Accueil")}>
            {t("Une idée, un besoin ? {email}", { email: CONTACT_EMAIL })}
          </a>
          <a href="/source/orion-aic-source.tar.gz" download>
            {t("Code source · AGPL-3.0")}
          </a>
        </span>
      </footer>
    </div>
  );
}
