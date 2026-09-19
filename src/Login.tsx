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
    api<{ demo: boolean }>("/config")
      .then((c) => setDemo(c.demo))
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
              Hébergement autonome · vos données, votre infrastructure
            </li>
            <li>
              <ShieldCheck size={18} />
              Second facteur · droits par rôle · modifications historisées
            </li>
            <li>
              <LockKeyhole size={18} />
              Accès limité aux dossiers attribués
            </li>
          </ul>
        </div>
        <div className="login-foot">
          ORION 0.1 · Logiciel libre AGPL-3.0 · Projet indépendant
        </div>
      </section>
      <section className="login-form">
        <div className="login-card">
          <img className="login-mark" src="/orion.svg" alt="ORION" />
          <h2>{session ? "Sécuriser votre compte" : "Connexion"}</h2>
          <p className="muted">
            {session
              ? "Activez votre application d’authentification pour accéder aux dossiers."
              : "Accès réservé au personnel autorisé."}
          </p>
          {session && !setup ? (
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
          {demo && !session && (
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
            Accès perdu ? Contactez l’administrateur de votre organisation.
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
