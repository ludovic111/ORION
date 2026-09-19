import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  Database,
  ShieldCheck,
  RefreshCw,
  FileDown,
  UserPlus,
  CheckCircle2,
  Upload,
} from "lucide-react";
import { api } from "./api";
import { Badge, Empty, Field, Modal, Panel } from "./components";
import type { AuditItem, Operation, Role, User } from "./types";
import { dateTime, roleLabels } from "./types";
type Status = {
  database: string;
  latencyMs: number;
  tls: boolean;
  mode: string;
  mfaRequired: boolean;
  sessionIdleMinutes: number;
  audit: string;
  version: string;
  mapOnline: boolean;
};
type ImportRow = { kind: string; data: Record<string, unknown> };
export function Admin({
  operations,
  operation,
  user,
  onRefresh,
}: {
  operations: Operation[];
  operation: Operation | null;
  user: User;
  onRefresh: () => Promise<void>;
}) {
  const [page, setPage] = useState("sources"),
    [status, setStatus] = useState<Status | null>(null),
    [users, setUsers] = useState<User[]>([]),
    [audit, setAudit] = useState<AuditItem[]>([]),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [editing, setEditing] = useState<User | "new" | null>(null),
    [batch, setBatch] = useState<ImportRow[] | null>(null),
    [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    try {
      const [s, u, a] = await Promise.all([
        api<Status>("/admin/status"),
        api<User[]>("/admin/users"),
        api<AuditItem[]>("/admin/audit"),
      ]);
      setStatus(s);
      setUsers(u);
      setAudit(a);
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  async function verify() {
    setBusy(true);
    try {
      const r = await api<{ valid: boolean; entries: number; head: string }>(
        "/admin/audit/verify",
      );
      setMessage(
        r.valid
          ? `Chaîne vérifiée : ${r.entries} écritures. Empreinte : ${r.head}`
          : "ÉCHEC : la chaîne présente une incohérence.",
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function importFile(file?: File) {
    if (!file) return;
    setBatch(null);
    setMessage("");
    try {
      if (file.size > 240000)
        throw new Error("Fichier trop volumineux (240 Ko maximum).");
      const data = JSON.parse(await file.text());
      if (
        !Array.isArray(data.records) ||
        !data.records.length ||
        data.records.length > 200
      )
        throw new Error(
          "Le fichier doit contenir de 1 à 200 objets dans « records ».",
        );
      if (
        !data.records.every(
          (r: ImportRow) =>
            ["resource", "stock", "map"].includes(r.kind) &&
            r.data &&
            typeof r.data === "object",
        )
      )
        throw new Error("Types autorisés : resource, stock, map.");
      setBatch(data.records);
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  }
  async function confirmImport() {
    if (!batch || !operation) return;
    setBusy(true);
    try {
      const result = await api<{ imported: number }>(
        `/operations/${operation.id}/import`,
        "POST",
        { records: batch },
      );
      setMessage(`${result.imported} objets importés dans ${operation.name}.`);
      setBatch(null);
      await onRefresh();
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <h2>Administration</h2>
        {[
          ["sources", "Sources de données"],
          ["users", "Utilisateurs et rôles"],
          ["audit", "Journal d’audit"],
          ["deployment", "Hébergement et sécurité"],
        ].map(([v, l]) => (
          <button
            key={v}
            className={page === v ? "active" : ""}
            onClick={() => {
              setPage(v);
              setMessage("");
              setError("");
            }}
          >
            {l}
          </button>
        ))}
        <div className="security-summary">
          <ShieldCheck size={20} />
          <h3>Politique d’accès</h3>
          <p>Second facteur TOTP</p>
          <p>Sessions : 30 min d’inactivité</p>
          <p>Verrouillage après 5 échecs</p>
          <p>Droits explicites par dossier</p>
          <p>Aucune télémétrie externe</p>
        </div>
      </aside>
      <div className="admin-content">
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        {message && (
          <p className="notice" role="status">
            {message}
          </p>
        )}
        {page === "sources" && (
          <>
            <div className="page-toolbar">
              <div>
                <h2>Sources de données</h2>
                <p className="muted">
                  Vos données restent dans l’infrastructure où ORION est
                  déployé.
                </p>
              </div>
              <button onClick={load}>
                <RefreshCw size={15} />
                Tester la connexion
              </button>
            </div>
            <Panel
              title="Base principale ORION"
              action={
                <Badge tone={status ? "green" : "muted"}>
                  {status ? "Connectée" : "Vérification…"}
                </Badge>
              }
            >
              <div className="connection-card">
                <Database size={36} />
                <div>
                  <h3>{status?.database ?? "Chargement…"}</h3>
                  <p>
                    {status?.mode} · dernière mesure : {status?.latencyMs} ms
                  </p>
                  <p className="muted">
                    La connexion est configurée côté serveur. Aucun mot de passe
                    de base de données ne transite dans le navigateur.
                  </p>
                </div>
              </div>
              <div className="config-facts">
                <span>
                  Chiffrement de la liaison DB{" "}
                  <strong>
                    {status?.tls
                      ? "TLS avec vérification du certificat"
                      : "Base locale / environnement de développement"}
                  </strong>
                </span>
                <span>
                  Configuration institution{" "}
                  <code>DATABASE_URL + DATABASE_CA_FILE</code>
                </span>
                <span>
                  Écritures{" "}
                  <strong>API ORION · contrôles de rôle et audit</strong>
                </span>
              </div>
            </Panel>
            <div className="two-columns">
              <Panel title="Cartographie officielle">
                <div className="panel-body">
                  <h3>
                    swisstopo ·{" "}
                    {status?.mapOnline ? "haute définition" : "fonds locaux"}
                  </h3>
                  <p>
                    Carte nationale couleur, noir et blanc, affichage sombre et
                    SWISSIMAGE.
                  </p>
                  <Badge tone="green">Servis par votre instance</Badge>
                  <p className="help">
                    {status?.mapOnline
                      ? "Relais HD activé : les tuiles officielles sont chargées à la demande. Le fournisseur peut connaître le secteur consulté et des métadonnées réseau, mais ne reçoit pas les objets opérationnels. Le cache local reste disponible en secours."
                      : "Cache local : canton de Genève et Céligny, niveaux 11 à 14. Aucun secteur consulté n’est transmis au fournisseur. Le périmètre et les mises à jour se gèrent dans le script de préparation des fonds."}
                  </p>
                  <a
                    href="https://docs.geo.admin.ch/visualize-data/xyz.html"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Documentation officielle swisstopo
                  </a>
                </div>
              </Panel>
              <Panel title="Connecteurs externes">
                <div className="panel-body">
                  <p>SITG, MétéoSuisse, alertes et annuaire de l’État</p>
                  <Badge>Non configurés</Badge>
                  <p className="help">
                    Ces systèmes nécessitent un contrat d’interface, des droits
                    d’accès et une validation avec l’institution. Aucun flux
                    actif n’est simulé.
                  </p>
                </div>
              </Panel>
            </div>
            <Panel title="Importer les données de l’institution">
              <div className="panel-body">
                <p>
                  Ajout de moyens, stocks ou objets cartographiques dans le
                  dossier sélectionné. Validation serveur et import atomique :
                  une ligne invalide annule tout le lot.
                </p>
                <div className="actions">
                  <label className="file-button">
                    <Upload size={15} />
                    Choisir un fichier JSON
                    <input
                      type="file"
                      accept="application/json,.json"
                      onChange={(e) => void importFile(e.target.files?.[0])}
                    />
                  </label>
                  <a className="button" href="/import-example.json" download>
                    <FileDown size={15} />
                    Exemple de fichier
                  </a>
                </div>
                {batch && (
                  <div className="import-preview">
                    <h3>
                      {batch.length} objets à ajouter ·{" "}
                      {operation?.name ?? "Sélectionnez un dossier"}
                    </h3>
                    <table>
                      <thead>
                        <tr>
                          <th>Type</th>
                          <th>Désignation</th>
                        </tr>
                      </thead>
                      <tbody>
                        {batch.map((r, i) => (
                          <tr key={i}>
                            <td>{r.kind}</td>
                            <td>
                              {String(
                                r.data.name ?? r.data.title ?? "Sans nom",
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="actions">
                      <button onClick={() => setBatch(null)}>Annuler</button>
                      <button
                        className="primary"
                        disabled={
                          busy || !operation || operation.status === "closed"
                        }
                        onClick={confirmImport}
                      >
                        Importer ces {batch.length} objets
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </Panel>
          </>
        )}
        {page === "users" && (
          <>
            <div className="page-toolbar">
              <div>
                <h2>Utilisateurs et rôles</h2>
                <p className="muted">
                  {users.length} comptes · attribution explicite des droits,
                  indépendante du grade
                </p>
              </div>
              <button className="primary" onClick={() => setEditing("new")}>
                <UserPlus size={15} />
                Nouvel utilisateur
              </button>
            </div>
            <Panel className="table-panel">
              <table>
                <thead>
                  <tr>
                    <th>Utilisateur</th>
                    <th>Identifiant</th>
                    <th>Rôle</th>
                    <th>Dossiers</th>
                    <th>MFA</th>
                    <th>Statut</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td>{u.name}</td>
                      <td>{u.email}</td>
                      <td>{roleLabels[u.role]}</td>
                      <td>
                        {u.role === "admin"
                          ? "Tous"
                          : (u.operationIds?.length ?? 0)}
                      </td>
                      <td>
                        <Badge tone={u.mfa_enabled ? "green" : "amber"}>
                          {u.mfa_enabled ? "Activé" : "À activer"}
                        </Badge>
                      </td>
                      <td>
                        <Badge tone={u.active ? "green" : "red"}>
                          {u.active ? "Actif" : "Suspendu"}
                        </Badge>
                      </td>
                      <td>
                        <button
                          disabled={u.id === user.id}
                          onClick={() => setEditing(u)}
                        >
                          Gérer
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Panel>
            <p className="help">
              La modification des droits révoque immédiatement les sessions du
              compte. Les administrateurs ont accès à tous les dossiers ; les
              autres rôles doivent recevoir une affectation.
            </p>
          </>
        )}
        {page === "audit" && (
          <>
            <div className="page-toolbar">
              <div>
                <h2>Journal d’audit</h2>
                <p className="muted">
                  500 dernières écritures · ajout seul · chaîne d’empreintes
                  SHA-256
                </p>
              </div>
              <div className="actions">
                <button onClick={load}>
                  <RefreshCw size={15} />
                  Actualiser
                </button>
                <button className="primary" onClick={verify} disabled={busy}>
                  <CheckCircle2 size={15} />
                  Vérifier l’intégrité
                </button>
              </div>
            </div>
            <Panel className="table-panel">
              <table>
                <thead>
                  <tr>
                    <th>Horodatage</th>
                    <th>Acteur</th>
                    <th>Action</th>
                    <th>Objet</th>
                    <th>Empreinte</th>
                  </tr>
                </thead>
                <tbody>
                  {audit.map((a) => (
                    <tr key={a.id}>
                      <td className="mono nowrap">{dateTime(a.at)}</td>
                      <td>
                        {users.find((u) => u.id === a.actor)?.name ?? a.actor}
                      </td>
                      <td className="mono">{a.action}</td>
                      <td className="mono">{a.target?.slice(0, 8) ?? "—"}</td>
                      <td>
                        <details>
                          <summary className="mono">
                            {a.hash.slice(0, 12)}…
                          </summary>
                          <pre>{JSON.stringify(a.detail, null, 2)}</pre>
                        </details>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!audit.length && <Empty>Aucune écriture.</Empty>}
            </Panel>
            <p className="help">
              La chaîne détecte une altération ; elle ne remplace pas un
              archivage externe WORM. Les administrateurs de la base restent
              dans le périmètre de confiance.
            </p>
          </>
        )}
        {page === "deployment" && (
          <>
            <h2>Hébergement et sécurité</h2>
            <Panel title="Déploiement autonome">
              <div className="panel-body">
                <p>
                  ORION fonctionne sur un serveur de l’institution avec
                  PostgreSQL. Le navigateur communique uniquement avec cette
                  instance.
                </p>
                <dl>
                  <dt>Authentification</dt>
                  <dd>
                    Mots de passe scrypt, TOTP obligatoire hors démonstration
                  </dd>
                  <dt>Sessions</dt>
                  <dd>
                    Cookies HttpOnly, SameSite strict, expiration et protection
                    CSRF
                  </dd>
                  <dt>Données</dt>
                  <dd>
                    Droits par dossier, requêtes paramétrées, validation des
                    entrées
                  </dd>
                  <dt>Audit</dt>
                  <dd>
                    Écritures et exports historisés, ajout seul, vérification
                    d’intégrité
                  </dd>
                  <dt>Chiffrement au repos</dt>
                  <dd>
                    À configurer sur le stockage de l’institution ; secrets TOTP
                    chiffrés par l’application
                  </dd>
                  <dt>Sauvegardes</dt>
                  <dd>
                    À planifier sur l’infrastructure, avec contrôle régulier de
                    restauration
                  </dd>
                </dl>
              </div>
            </Panel>
            <Panel title="Préparation d’un pilote institutionnel">
              <div className="panel-body">
                <p>
                  Le code est fourni sous licence AGPL-3.0. L’installation,
                  l’intégration, la formation et le support peuvent constituer
                  l’offre commerciale.
                </p>
                <p>
                  Avant un usage opérationnel : recette métier avec la PCi,
                  revue de sécurité indépendante, politique de conservation,
                  validation LIPAD et procédures de continuité avec
                  l’institution.
                </p>
                <p>
                  Aucune certification, homologation de l’État ou conformité
                  juridique n’est présumée.
                </p>
                <a
                  href="/source/orion-source.tar.gz"
                  download
                  className="button"
                >
                  <FileDown size={15} />
                  Code source de cette version
                </a>
              </div>
            </Panel>
          </>
        )}
      </div>
      {editing && (
        <UserForm
          item={editing}
          operations={operations}
          onClose={() => setEditing(null)}
          onSaved={load}
        />
      )}
    </div>
  );
}
function UserForm({
  item,
  operations,
  onClose,
  onSaved,
}: {
  item: User | "new";
  operations: Operation[];
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const initial = item === "new" ? null : item;
  const [name, setName] = useState(initial?.name ?? ""),
    [email, setEmail] = useState(initial?.email ?? ""),
    [password, setPassword] = useState(""),
    [role, setRole] = useState<Role>(initial?.role ?? "viewer"),
    [active, setActive] = useState(initial?.active ?? true),
    [opIds, setOpIds] = useState<string[]>(initial?.operationIds ?? []),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (initial)
        await api(`/admin/users/${initial.id}`, "PATCH", {
          active,
          role,
          operationIds: opIds,
        });
      else
        await api("/admin/users", "POST", {
          name,
          email,
          password,
          role,
          operationIds: opIds,
        });
      await onSaved();
      onClose();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title={initial ? `Droits de ${initial.name}` : "Nouvel utilisateur"}
      onClose={onClose}
    >
      <form onSubmit={submit}>
        <div className="form-grid">
          {!initial && (
            <>
              <Field label="Nom et fonction">
                <input
                  required
                  maxLength={200}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </Field>
              <Field label="E-mail professionnel">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Field>
              <Field label="Mot de passe initial (14 caractères minimum)" wide>
                <input
                  type="password"
                  autoComplete="new-password"
                  minLength={14}
                  maxLength={128}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </Field>
            </>
          )}
          <Field label="Rôle applicatif">
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
            >
              {Object.entries(roleLabels).map(([v, l]) => (
                <option value={v} key={v}>
                  {l}
                </option>
              ))}
            </select>
          </Field>
          {initial && (
            <label className="check">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
              />
              Compte actif
            </label>
          )}
          <div className="full">
            <h3>Dossiers autorisés</h3>
            {role === "admin" ? (
              <p className="notice">
                Le rôle Administrateur donne accès à tous les dossiers.
              </p>
            ) : (
              operations.map((op) => (
                <label className="check" key={op.id}>
                  <input
                    type="checkbox"
                    checked={opIds.includes(op.id)}
                    onChange={(e) =>
                      setOpIds((p) =>
                        e.target.checked
                          ? [...p, op.id]
                          : p.filter((v) => v !== op.id),
                      )
                    }
                  />
                  {op.name}
                </label>
              ))
            )}
          </div>
          <p className="help full">
            Le second facteur sera configuré à la première connexion.
            Communiquez les accès par le canal sécurisé de l’institution.
          </p>
        </div>
        {error && <p className="error">{error}</p>}
        <div className="modal-actions">
          <button type="button" onClick={onClose}>
            Annuler
          </button>
          <button type="submit" className="primary" disabled={busy}>
            {busy
              ? "Enregistrement…"
              : initial
                ? "Mettre à jour les droits"
                : "Créer le compte"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
