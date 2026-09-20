import { useEffect, useState, type FormEvent } from "react";
import {
  ShieldCheck,
  Database,
  LockKeyhole,
  ArrowRight,
  TriangleAlert,
} from "lucide-react";
import QRCode from "qrcode";
import { api, setCsrf } from "./api";
import type { Session } from "./types";
import { Field } from "./components";
export function Login({
  onLogin,
  session,
}: {
  onLogin: (s: Session) => void;
  session: Session | null;
}) {
  const [demo, setDemo] = useState(false),
    [preview, setPreview] = useState(false),
    [hostedPreview, setHostedPreview] = useState(false),
    [previewExpiry, setPreviewExpiry] = useState(""),
    [invitation, setInvitation] = useState(() =>
      location.hash.startsWith("#invitation=") ? location.hash.slice(12) : "",
    ),
    [name, setName] = useState(""),
    [loaded, setLoaded] = useState(false),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [code, setCode] = useState("");
  const [setup, setSetup] = useState<{ secret: string; uri: string } | null>(
      null,
    ),
    [qr, setQr] = useState("");
  useEffect(() => {
    if (location.hash.startsWith("#invitation="))
      history.replaceState(null, "", location.pathname + location.search);
    api<{
      demo: boolean;
      preview: boolean;
      hostedPreview?: boolean;
      previewExpiresAt?: string;
    }>("/config")
      .then((c) => {
        setDemo(c.demo);
        setPreview(c.preview);
        setHostedPreview(!!c.hostedPreview);
        setPreviewExpiry(c.previewExpiresAt ?? "");
        setLoaded(true);
      })
      .catch(() => setError("Le serveur est indisponible."));
  }, []);
  async function run(action: () => Promise<Session>) {
    setError("");
    setBusy(true);
    try {
      const s = await action();
      setCsrf(s.csrf);
      setPassword("");
      setCode("");
      if (preview) {
        setInvitation("");
        location.hash = "situation";
      }
      onLogin(s);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function enroll() {
    setError("");
    try {
      const result = await api<{ secret: string; uri: string }>(
        "/mfa/setup",
        "POST",
        {},
      );
      setSetup(result);
      setQr(await QRCode.toDataURL(result.uri, { margin: 2, width: 220 }));
    } catch (e) {
      setError((e as Error).message);
    }
  }
  function submit(e: FormEvent) {
    e.preventDefault();
    void run(() =>
      session
        ? api<Session>("/mfa/confirm", "POST", { code })
        : api<Session>("/login", "POST", { email, password, code }),
    );
  }
  return (
    <div className="login">
      <section className="login-brand">
        <div className="brand-lockup">
          <img src="/orion.svg" alt="" />
          <div>
            ORION<small>AIDE À LA CONDUITE · PCi GE</small>
          </div>
        </div>
        <div className="login-intro">
          <h1>
            Plateforme d’aide
            <br />à la conduite
          </h1>
          <p>
            Suivi de la situation, journal d’intervention, cartes de conduite et
            gestion des moyens pour la protection civile genevoise.
          </p>
          <ul>
            <li>
              <Database size={18} />
              {preview
                ? "Espace de test · scénario fictif prêt à utiliser"
                : "Hébergement autonome · vos données, votre infrastructure"}
            </li>
            <li>
              <ShieldCheck size={18} />
              {preview
                ? "Un prénom suffit · chaque testeur a son exercice"
                : "Second facteur · droits par rôle · modifications historisées"}
            </li>
            <li>
              <LockKeyhole size={18} />
              Accès limité aux dossiers attribués
            </li>
          </ul>
        </div>
        <div className="login-foot">
          ORION 0.3 · Logiciel libre AGPL-3.0 · Projet indépendant
        </div>
      </section>
      <section className="login-form">
        <div className="login-card">
          <img className="login-mark" src="/orion.svg" alt="ORION" />
          <h2>
            {preview
              ? "Essayer ORION"
              : session
                ? "Sécuriser votre compte"
                : "Connexion"}
          </h2>
          <p className="muted">
            {preview
              ? "Ouvrez votre exercice Crue de l’Arve en un clic. Vous pourrez aussi créer un dossier d’engagement."
              : session
                ? "Activez votre application d’authentification pour accéder aux dossiers."
                : "Accès réservé au personnel autorisé."}
          </p>
          {!loaded ? (
            <p className="muted" role="status">
              {error
                ? "Rechargez la page pour réessayer."
                : "Connexion au serveur…"}
            </p>
          ) : preview ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void run(() =>
                  api<Session>(
                    invitation ? "/preview/enter" : "/preview/start",
                    "POST",
                    invitation
                      ? { token: invitation, syntheticOnly: true }
                      : { name: name.trim(), syntheticOnly: true },
                  ),
                );
              }}
            >
              {!invitation && (
                <Field label="Prénom ou pseudonyme">
                  <input
                    required
                    name="displayName"
                    autoComplete="off"
                    spellCheck={false}
                    maxLength={80}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex. Alex"
                    aria-describedby="test-access-help"
                  />
                </Field>
              )}
              <p className="help" id="test-access-help">
                {invitation
                  ? "Votre lien personnel ouvre votre exercice existant."
                  : "Un pseudonyme suffit. Votre nom sert uniquement à identifier vos saisies dans cet espace de test."}
              </p>
              <div className="invitation-notice">
                <strong>
                  Exercice uniquement · aucune donnée d’intervention réelle
                </strong>
                <p>
                  En ouvrant l’exercice, vous confirmez utiliser uniquement des
                  informations fictives.
                </p>
                <details>
                  <summary>À propos de cet essai</summary>
                  <p>
                    {hostedPreview
                      ? "Démonstration hébergée par Cloudflare, indépendante du poste de présentation."
                      : "Démonstration temporaire via Cloudflare, disponible tant que le poste de présentation reste connecté."}{" "}
                    Cet hébergement n’est pas celui de l’État et ne garantit pas
                    une résidence des données en Suisse.
                  </p>
                  <p>
                    Le prénom ou pseudonyme et les saisies sont enregistrés pour
                    cet essai. Aucun nom complet n’est nécessaire. Les données
                    ne sont pas effacées automatiquement à l’expiration ;
                    adressez toute demande à la personne qui présente ORION.
                  </p>
                  <p>
                    Votre session reste disponible dans ce navigateur pendant 8
                    heures au maximum, avec expiration après 30 minutes sans
                    activité. Après déconnexion, saisir à nouveau un nom crée un
                    nouvel exercice.
                  </p>
                  {previewExpiry && (
                    <p>
                      Fin de l’essai :{" "}
                      {new Date(previewExpiry).toLocaleString("fr-CH", {
                        timeZone: "Europe/Zurich",
                      })}{" "}
                      (heure suisse).
                    </p>
                  )}
                </details>
              </div>
              <button
                className="primary full-width"
                disabled={busy || (!invitation && !name.trim())}
              >
                {busy ? "Ouverture…" : "Ouvrir mon exercice"}
                <ArrowRight size={16} />
              </button>
            </form>
          ) : session && !setup ? (
            <button className="primary" onClick={enroll}>
              Configurer le second facteur
            </button>
          ) : (
            <form onSubmit={submit}>
              {!session && (
                <>
                  <Field label="Identifiant professionnel">
                    <input
                      type="email"
                      autoComplete="username"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="prenom.nom@organisation.ch"
                    />
                  </Field>
                  <Field label="Mot de passe">
                    <input
                      type="password"
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      maxLength={128}
                    />
                  </Field>
                </>
              )}
              {setup && (
                <div className="mfa-setup">
                  <img
                    src={qr}
                    alt="QR code à scanner avec votre application d’authentification"
                  />
                  <p>Scannez le QR code, ou saisissez cette clé :</p>
                  <code>{setup.secret}</code>
                </div>
              )}
              <Field
                label={
                  session
                    ? "Code à 6 chiffres"
                    : "Code d’authentification (si déjà activé)"
                }
              >
                <input
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  value={code}
                  required={!!session}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="000000"
                />
              </Field>
              <button className="primary full-width" disabled={busy}>
                {busy
                  ? "Connexion…"
                  : session
                    ? "Activer et continuer"
                    : "Se connecter"}
                <ArrowRight size={16} />
              </button>
            </form>
          )}
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          {demo && !preview && !session && (
            <div className="demo-login">
              <div>
                <TriangleAlert size={16} />
                <span>Exercice local · données entièrement fictives</span>
              </div>
              <button
                onClick={() => run(() => api<Session>("/demo", "POST", {}))}
                disabled={busy}
              >
                Ouvrir la démonstration
                <ArrowRight size={15} />
              </button>
            </div>
          )}
          <p className="login-support">
            {preview
              ? "Projet indépendant · aucune affiliation ou homologation officielle."
              : "Accès perdu ? Contactez l’administrateur de votre organisation."}
          </p>
          {session && (
            <button
              onClick={async () => {
                await api("/logout", "POST", {});
                window.location.reload();
              }}
            >
              Revenir à la connexion
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
