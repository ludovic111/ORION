import { useCallback, useEffect, useRef, useState } from "react";
import {
  LayoutGrid,
  BookOpen,
  Map,
  Truck,
  Network,
  Radio,
  FileText,
  Settings,
  LockKeyhole,
  LogOut,
  Search,
  Bell,
  ChevronRight,
  Clock,
  TriangleAlert,
  RefreshCw,
  Plus,
  Check,
  Archive,
  ArrowUpRight,
  Edit3,
} from "lucide-react";
import { api, downloadExport, setCsrf } from "./api";
import type {
  Data,
  Kind,
  Operation,
  RecordItem,
  Session,
  SymbolItem,
} from "./types";
import { dateTime, recordTitle, roleLabels, shortId } from "./types";
import { Badge, Empty, Modal, Panel, Status } from "./components";
import { Login } from "./Login";
import { MapView } from "./MapView";
import { RecordForm, kindNames } from "./RecordForm";
import { OperationForm } from "./OperationForm";
import { Admin } from "./Admin";
import {
  Dashboard,
  Journal,
  Links,
  Reports,
  Resources,
  Symbols,
  Transmissions,
  type ViewProps,
} from "./Views";
const pages = [
  ["situation", "Situation générale", LayoutGrid],
  ["journal", "Journal d’intervention", BookOpen],
  ["map", "Carte de conduite", Map],
  ["resources", "Moyens et partenaires", Truck],
  ["links", "Analyse des liaisons", Network],
  ["transmissions", "Transmissions", Radio],
  ["reports", "Rapports", FileText],
  ["admin", "Administration", Settings],
] as const;
const dataLabels: Record<string, string> = {
  title: "Message",
  name: "Désignation",
  type: "Type",
  priority: "Priorité",
  source: "Émetteur",
  status: "Statut",
  assignee: "Attribué à",
  location: "Localisation",
  decision: "Décision",
  reliability: "Fiabilité",
  validated: "Validation",
  organization: "Organisation",
  specialty: "Spécialité",
  personnel: "Personnel",
  contact: "Contact",
  eta: "Arrivée prévue",
  lat: "Latitude WGS84",
  lng: "Longitude WGS84",
  category: "Calque",
  notes: "Observations",
  label: "Relation",
  channel: "Canal",
  sender: "Émetteur",
  recipient: "Destinataire",
  situation: "Situation",
  actions: "Actions",
  needs: "Besoins",
  outlook: "Évolution",
  total: "Total",
  available: "Disponible",
};
export default function App() {
  const [session, setSession] = useState<Session | null>(null),
    [loading, setLoading] = useState(true),
    [operations, setOperations] = useState<Operation[]>([]),
    [opId, setOpId] = useState(""),
    [records, setRecords] = useState<RecordItem[]>([]),
    [symbols, setSymbols] = useState<SymbolItem[]>([]),
    [page, setPage] = useState(location.hash.slice(1) || "situation"),
    [error, setError] = useState(""),
    [toast, setToast] = useState(""),
    [now, setNow] = useState(new Date()),
    [synced, setSynced] = useState<Date | null>(null);
  const [form, setForm] = useState<{
      kind: Kind;
      item?: RecordItem;
      preset?: Data;
    } | null>(null),
    [readItem, setReadItem] = useState<RecordItem | null>(null),
    [newOperation, setNewOperation] = useState(false),
    [closing, setClosing] = useState(false),
    [mapSelected, setMapSelected] = useState<RecordItem | null>(null),
    [categories, setCategories] = useState([
      "Effets",
      "Moyens",
      "Mesures",
      "Dangers",
    ]),
    [search, setSearch] = useState(""),
    [notifications, setNotifications] = useState(false);
  const currentOp = useRef(opId);
  currentOp.current = opId;
  const refreshGeneration = useRef(0);
  const searchRef = useRef<HTMLInputElement>(null);
  const operation = operations.find((o) => o.id === opId) ?? null;
  const canWrite =
    !!session &&
    session.user.role !== "viewer" &&
    operation?.status === "active";
  const canLead =
    !!session && ["admin", "command", "chief"].includes(session.user.role);
  const canClose =
    !!session && ["admin", "command"].includes(session.user.role);
  function navigate(value: string) {
    setPage(value);
    location.hash = value;
    setSearch("");
    setNotifications(false);
  }
  const refresh = useCallback(async () => {
    const generation = ++refreshGeneration.current;
    const id = currentOp.current;
    try {
      const ops = await api<Operation[]>("/operations");
      const chosen = ops.some((o) => o.id === id) ? id : (ops[0]?.id ?? "");
      const rows = chosen
        ? await api<RecordItem[]>(`/operations/${chosen}/records`)
        : [];
      if (generation !== refreshGeneration.current) return;
      setOperations(ops);
      setOpId(chosen);
      setRecords(rows);
      setSynced(new Date());
      setError("");
    } catch (e) {
      if (generation === refreshGeneration.current)
        setError((e as Error).message);
    }
  }, []);
  useEffect(() => {
    const expired = () => {
      ++refreshGeneration.current;
      currentOp.current = "";
      setOpId("");
      setSession(null);
      setRecords([]);
      setOperations([]);
      setForm(null);
      setReadItem(null);
      setMapSelected(null);
      setCsrf("");
    };
    window.addEventListener("orion:expired", expired);
    api<Session>("/session")
      .then((s) => {
        setCsrf(s.csrf);
        setSession(s);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    fetch("/symbols/catalog.json")
      .then((r) => r.json())
      .then(setSymbols)
      .catch(() => setError("Bibliothèque de signes indisponible."));
    const interval = setInterval(() => setNow(new Date()), 1000);
    const hash = () => setPage(location.hash.slice(1) || "situation");
    window.addEventListener("hashchange", hash);
    return () => {
      window.removeEventListener("orion:expired", expired);
      window.removeEventListener("hashchange", hash);
      clearInterval(interval);
    };
  }, []);
  useEffect(() => {
    if (!session?.authenticated) return;
    void refresh();
    const interval = setInterval(refresh, 15000);
    return () => clearInterval(interval);
  }, [session, opId, refresh]);
  useEffect(() => {
    if (!session?.authenticated) return;
    let last = 0;
    const activity = () => {
      if (Date.now() - last > 60000) {
        last = Date.now();
        void api("/activity", "POST", {}).catch(() => {});
      }
    };
    window.addEventListener("pointerdown", activity);
    window.addEventListener("keydown", activity);
    return () => {
      window.removeEventListener("pointerdown", activity);
      window.removeEventListener("keydown", activity);
    };
  }, [session]);
  useEffect(() => {
    const listener = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === "Escape") {
        setSearch("");
        setNotifications(false);
      }
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, []);
  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => setToast(""), 5000);
    return () => clearTimeout(timeout);
  }, [toast]);
  function changeOperation(id: string) {
    ++refreshGeneration.current;
    currentOp.current = id;
    setOpId(id);
    setRecords([]);
    setMapSelected(null);
    setSearch("");
  }
  async function logout() {
    try {
      await api("/logout", "POST", {});
      ++refreshGeneration.current;
      currentOp.current = "";
      setOpId("");
      setSession(null);
      setRecords([]);
      setOperations([]);
      setForm(null);
      setReadItem(null);
      setMapSelected(null);
      setCsrf("");
    } catch (e) {
      setError((e as Error).message);
    }
  }
  function edit(kind: Kind, item?: RecordItem, preset?: Data) {
    const allowed =
      canWrite &&
      (!["report"].includes(kind) || canLead) &&
      (!(item?.data.validated || item?.data.type === "Ordre") || canLead);
    if (!allowed) {
      if (item) setReadItem(item);
      return;
    }
    setForm({ kind, item, preset });
  }
  async function update(item: RecordItem, data: Data) {
    await api(`/operations/${item.operation_id}/records/${item.id}`, "PUT", {
      kind: item.kind,
      data,
      version: item.version,
    });
    await refresh();
    setToast("Modification enregistrée et historisée.");
  }
  async function save(data: Data) {
    if (!form || !operation) return;
    if (form.item) await update(form.item, data);
    else {
      await api(`/operations/${operation.id}/records`, "POST", {
        kind: form.kind,
        data,
      });
      await refresh();
      setToast("Objet enregistré dans le dossier.");
    }
  }
  async function exportData() {
    try {
      await downloadExport(opId);
      setToast("Export du dossier téléchargé et journalisé.");
    } catch (e) {
      setError((e as Error).message);
    }
  }
  async function changeStatus() {
    if (!operation) return;
    try {
      await api(`/operations/${opId}`, "PATCH", {
        status: operation.status === "active" ? "closed" : "active",
        version: operation.version,
      });
      await refresh();
      setClosing(false);
      setToast("Statut du dossier mis à jour.");
    } catch (e) {
      setError((e as Error).message);
    }
  }
  if (loading)
    return (
      <div className="loading">
        <img src="/orion.svg" alt="" />
        Ouverture d’ORION…
      </div>
    );
  if (!session?.authenticated)
    return (
      <Login
        session={session}
        onLogin={(s) => {
          setSession(s);
          setCsrf(s.csrf);
        }}
      />
    );
  const props: ViewProps | null = operation
    ? {
        records,
        operation,
        canWrite,
        canLead,
        onEdit: edit,
        onNavigate: navigate,
        onUpdate: update,
      }
    : null;
  const pageTitle =
    page === "symbols"
      ? "Signes conventionnels"
      : (pages.find((p) => p[0] === page)?.[1] ?? "Situation générale");
  const results = search.trim()
    ? records
        .filter(
          (r) =>
            r.kind !== "link" &&
            `${recordTitle(r)} ${r.data.location ?? ""} ${shortId(r)}`
              .toLowerCase()
              .includes(search.toLowerCase()),
        )
        .slice(0, 12)
    : [];
  const urgent = records.filter(
    (r) =>
      ["journal", "transmission"].includes(r.kind) &&
      r.data.priority === "P1" &&
      !["Traité", "Clos", "Accusé reçu"].includes(r.data.status ?? ""),
  );
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Aller au contenu
      </a>
      <nav className="rail" aria-label="Navigation principale">
        <button
          className="rail-logo"
          onClick={() => navigate("situation")}
          aria-label="ORION — accueil"
        >
          <img src="/orion.svg" alt="" />
        </button>
        {pages
          .filter((p) => p[0] !== "admin" || session.user.role === "admin")
          .map(([id, title, Icon]) => (
            <button
              key={id}
              className={
                page === id || (id === "map" && page === "symbols")
                  ? "active"
                  : ""
              }
              aria-label={title}
              title={title}
              onClick={() => navigate(id)}
            >
              <Icon size={20} />
            </button>
          ))}
        <div className="rail-spacer" />
        <button
          aria-label="Verrouiller la session"
          title="Verrouiller la session"
          onClick={logout}
        >
          <LockKeyhole size={19} />
        </button>
        <button
          aria-label="Se déconnecter"
          title="Se déconnecter"
          onClick={logout}
        >
          <LogOut size={19} />
        </button>
      </nav>
      <div className="app-body">
        <header className="app-header">
          <div className="header-brand">
            ORION <span>/ Aide à la conduite</span>
          </div>
          <div className="breadcrumb">
            <ChevronRight size={14} />
            {pageTitle}
          </div>
          <div className="header-space" />
          <div className="global-search">
            <Search size={15} />
            <input
              ref={searchRef}
              aria-label="Rechercher dans le dossier"
              placeholder="Rechercher un objet, une adresse, un événement…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <kbd>⌘K</kbd>
            {search && (
              <div className="search-results">
                {results.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => {
                      edit(r.kind, r);
                      setSearch("");
                    }}
                  >
                    <Badge>{shortId(r)}</Badge>
                    <span>{recordTitle(r)}</span>
                  </button>
                ))}
                {!results.length && (
                  <Empty>Aucun résultat dans ce dossier.</Empty>
                )}
              </div>
            )}
          </div>
          <Badge tone={operation?.mode === "real" ? "red" : "amber"}>
            <TriangleAlert size={12} />
            {operation?.mode === "real" ? "RÉEL" : "EXERCICE"}
          </Badge>
          <div className="clock mono">
            <Clock size={13} />
            {now.toLocaleString("fr-CH", { timeZone: "Europe/Zurich" })}
          </div>
          <button
            className="notification-btn icon-btn"
            aria-label="Notifications prioritaires"
            onClick={() => setNotifications(!notifications)}
          >
            <Bell size={18} />
            {urgent.length > 0 && <i />}
          </button>
          <div className="user-menu">
            <div className="avatar">
              {session.user.name
                .replace(/^(Cap|Lt|Maj|Sgt) /, "")
                .split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("")}
            </div>
            <div>
              <strong>{session.user.name}</strong>
              <small>
                {roleLabels[session.user.role]} ·{" "}
                {session.demo ? "Exercice local" : "ORION"}
              </small>
            </div>
          </div>
          {notifications && (
            <div className="notifications">
              <h3>Messages prioritaires</h3>
              {urgent.map((r) => (
                <button
                  key={r.id}
                  onClick={() => {
                    edit(r.kind, r);
                    setNotifications(false);
                  }}
                >
                  <Status value="P1" />
                  {recordTitle(r)}
                </button>
              ))}
              {!urgent.length && <Empty>Aucun message P1 en attente.</Empty>}
            </div>
          )}
        </header>
        <main id="main" className={`main-content page-${page}`}>
          <div className="workspace-heading">
            <div>
              <div className="heading-row">
                <h1>
                  {page === "situation"
                    ? (operation?.name ?? "Dossiers d’engagement")
                    : pageTitle}
                </h1>
                {operation && (
                  <Badge tone={operation.status === "closed" ? "muted" : "red"}>
                    {operation.status === "closed"
                      ? "DOSSIER CLÔTURÉ"
                      : operation.level >= 3
                        ? "ÉVÉNEMENT MAJEUR"
                        : `NIVEAU ${operation.level}`}
                  </Badge>
                )}
              </div>
              <div className="workspace-meta">
                <select
                  aria-label="Dossier d’engagement"
                  value={opId}
                  onChange={(e) => changeOperation(e.target.value)}
                >
                  {!operations.length && (
                    <option value="">Aucun dossier</option>
                  )}
                  {operations.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                      {o.status === "closed" ? " · clôturé" : ""}
                    </option>
                  ))}
                </select>
                {operation && (
                  <span>
                    {operation.commander} · {operation.phase}
                  </span>
                )}
              </div>
            </div>
            <div className="actions workspace-actions">
              {canLead && (
                <button
                  className="primary"
                  onClick={() => setNewOperation(true)}
                >
                  <Plus size={15} />
                  Nouvel événement
                </button>
              )}
              {page === "situation" && operation && (
                <>
                  <button disabled={!canWrite} onClick={() => edit("journal")}>
                    <BookOpen size={15} />
                    Entrée journal
                  </button>
                  <button onClick={() => navigate("reports")}>
                    <FileText size={15} />
                    Rapport de situation
                  </button>
                </>
              )}
              {canClose && operation && page !== "situation" && (
                <button
                  title={
                    operation.status === "active"
                      ? "Clôturer le dossier"
                      : "Rouvrir le dossier"
                  }
                  aria-label={
                    operation.status === "active"
                      ? "Clôturer le dossier"
                      : "Rouvrir le dossier"
                  }
                  onClick={() => setClosing(true)}
                >
                  <Archive size={16} />
                </button>
              )}
            </div>
          </div>
          {session.demo && (
            <div className="exercise-note">
              <span>EXERCICE · Données fictives</span>
              <span>Aucune alerte réelle ni transmission automatique.</span>
              <span className="sync-indicator">
                <i className={error ? "offline" : ""} />
                {synced
                  ? `Actualisé à ${synced.toLocaleTimeString("fr-CH")}`
                  : "Connexion…"}
                <button
                  aria-label="Actualiser les données"
                  className="text-button"
                  onClick={refresh}
                >
                  <RefreshCw size={12} />
                </button>
              </span>
            </div>
          )}
          {error && (
            <div className="error" role="alert">
              {error} Les données affichées peuvent être anciennes.{" "}
              <button onClick={refresh}>Réessayer</button>
            </div>
          )}
          {page === "admin" && session.user.role === "admin" ? (
            <Admin
              operations={operations}
              operation={operation}
              user={session.user}
              onRefresh={refresh}
            />
          ) : page === "symbols" ? (
            <Symbols
              symbols={symbols}
              canWrite={canWrite}
              onUse={(s) =>
                edit("map", undefined, { symbol: s.id, name: s.name })
              }
            />
          ) : !props ? (
            <Panel>
              <Empty>
                {operations.length
                  ? "Chargement du dossier…"
                  : "Aucun dossier accessible. Créez un événement ou demandez une affectation à votre administrateur."}
              </Empty>
            </Panel>
          ) : page === "journal" ? (
            <Journal {...props} />
          ) : page === "resources" ? (
            <Resources {...props} />
          ) : page === "links" ? (
            <Links {...props} />
          ) : page === "transmissions" ? (
            <Transmissions {...props} />
          ) : page === "reports" ? (
            <Reports {...props} onExport={exportData} />
          ) : page === "map" ? (
            <div className="full-map-layout">
              <Panel className="full-map-panel">
                <MapView
                  records={records}
                  selected={mapSelected}
                  categories={categories}
                  canWrite={canWrite}
                  onSelect={setMapSelected}
                  onAdd={(d) => edit("map", undefined, d)}
                />
              </Panel>
              <div className="map-sidebar">
                <Panel title="Objet sélectionné">
                  <div className="panel-body">
                    {mapSelected ? (
                      <>
                        <Badge tone="blue">{shortId(mapSelected)}</Badge>
                        <h3>{mapSelected.data.name}</h3>
                        <dl>
                          <dt>Coordonnées WGS84</dt>
                          <dd className="mono">
                            {mapSelected.data.lat?.toFixed(5)} /{" "}
                            {mapSelected.data.lng?.toFixed(5)}
                          </dd>
                          <dt>Organisation</dt>
                          <dd>{mapSelected.data.organization}</dd>
                          <dt>Observations</dt>
                          <dd>{mapSelected.data.notes || "Aucune"}</dd>
                        </dl>
                        <button
                          onClick={() =>
                            edit(
                              "map",
                              records.find((r) => r.id === mapSelected.id) ??
                                mapSelected,
                            )
                          }
                        >
                          <Edit3 size={14} />
                          {canWrite ? "Modifier" : "Consulter"}
                        </button>
                      </>
                    ) : (
                      <p className="muted">
                        Sélectionnez un signe sur la carte pour consulter sa
                        fiche.
                      </p>
                    )}
                  </div>
                </Panel>
                <Panel title="Calques opérationnels">
                  <div className="panel-body layer-list">
                    {["Effets", "Moyens", "Mesures", "Dangers"].map((v, i) => (
                      <label className="check" key={v}>
                        <input
                          type="checkbox"
                          checked={categories.includes(v)}
                          onChange={(e) =>
                            setCategories((c) =>
                              e.target.checked
                                ? [...c, v]
                                : c.filter((x) => x !== v),
                            )
                          }
                        />
                        <span className={["red", "blue", "", "amber"][i]}>
                          ●
                        </span>
                        {v}
                        <small>
                          {
                            records.filter(
                              (r) => r.kind === "map" && r.data.category === v,
                            ).length
                          }
                        </small>
                      </label>
                    ))}
                  </div>
                </Panel>
                <button onClick={() => navigate("symbols")}>
                  Bibliothèque OFPP <ArrowUpRight size={14} />
                </button>
                {canWrite && (
                  <button className="primary" onClick={() => edit("map")}>
                    <Plus size={15} />
                    Ajouter un objet
                  </button>
                )}
                <p className="help">
                  Les signes officiels conservent leurs couleurs. Les catégories
                  servent à filtrer les objets du dossier.
                </p>
              </div>
            </div>
          ) : (
            <Dashboard {...props} />
          )}
        </main>
        <footer className="app-footer">
          <span>ORION 0.1 · Projet indépendant pour l’aide à la conduite</span>
          <span>
            {session.demo
              ? "Démonstration locale"
              : "Instance institutionnelle"}{" "}
            ·{" "}
            <a href="/source/orion-source.tar.gz" download>
              Code source AGPL-3.0
            </a>
          </span>
        </footer>
      </div>
      {toast && (
        <div className="toast" role="status">
          <Check size={16} />
          {toast}
        </div>
      )}
      {form && (
        <RecordForm
          {...form}
          symbols={symbols}
          records={records}
          canValidate={canLead}
          onClose={() => setForm(null)}
          onSave={save}
        />
      )}{" "}
      {newOperation && (
        <OperationForm
          demo={session.demo}
          onClose={() => setNewOperation(false)}
          onCreated={(id) => {
            changeOperation(id);
            navigate("situation");
            setToast("Dossier créé. Configurez les accès dans Administration.");
          }}
        />
      )}
      {readItem && (
        <Modal
          title={kindNames[readItem.kind]}
          onClose={() => setReadItem(null)}
        >
          <div className="read-only-detail">
            <Badge>Consultation</Badge>
            <h3>{recordTitle(readItem)}</h3>
            <dl>
              {Object.entries(readItem.data)
                .filter(([k]) => dataLabels[k])
                .map(([k, v]) => (
                  <div key={k}>
                    <dt>{dataLabels[k]}</dt>
                    <dd>
                      {typeof v === "boolean"
                        ? v
                          ? "Oui"
                          : "Non"
                        : String(v) || "—"}
                    </dd>
                  </div>
                ))}
            </dl>
          </div>
        </Modal>
      )}
      {closing && operation && (
        <Modal
          title={
            operation.status === "active"
              ? "Clôturer le dossier"
              : "Rouvrir le dossier"
          }
          onClose={() => setClosing(false)}
        >
          <div className="panel-body">
            <p>{operation.name}</p>
            <p>
              {operation.status === "active"
                ? "La clôture bloque les nouvelles écritures et conserve les données en consultation. Un membre du commandement peut rouvrir le dossier."
                : "La réouverture autorisera les écritures selon les droits des utilisateurs."}
            </p>
          </div>
          <div className="modal-actions">
            <button onClick={() => setClosing(false)}>Annuler</button>
            <button className="primary" onClick={changeStatus}>
              Confirmer
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
