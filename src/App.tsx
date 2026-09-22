import { JournalRow } from "./journal/JournalRow";
import { Landing } from "./journal/Landing";
import { Settings } from "./journal/SessionSettings";
import { Handover } from "./journal/Handover";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowDown,
  ArrowDownToLine,
  ArrowRight,
  ArrowUp,
  BookOpen,
  Check,
  ChevronRight,
  CircleHelp,
  Download,
  FileUp,
  FolderClosed,
  HardDrive,
  ListFilter,
  LockKeyhole,
  LogOut,
  MapPin,
  Menu,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
  Signal,
  X,
} from "lucide-react";
import {
  addEntry,
  chronological,
  current,
  day,
  emptyFields,
  mergeJournals,
  needsFollowUp,
  numberLabel,
  overdue,
  reviseEntry,
  searchEntries,
  time,
  workspaceSchema,
  type Fields,
  type Journal,
} from "../shared/journal";
import { demoWorkspace } from "./journal/demo";
import { useWorkspace } from "./journal/useWorkspace";
import { EntryForm } from "./journal/EntryForm";
import { EntryDetail } from "./journal/EntryDetail";
import { JournalSetup } from "./journal/JournalSetup";
import { Modal } from "./journal/Modal";
import { Privacy } from "./journal/Privacy";
import { ExportModal, ImportModal } from "./journal/Transfer";

type Dialog =
  | "create"
  | "export"
  | "import"
  | "settings"
  | "privacy"
  | "handover"
  | "compose"
  | null;
type Filter = "all" | "follow" | "urgent" | "decisions";
export default function App() {
  const store = useWorkspace();
  const { workspace, setWorkspace } = store;
  const [dialog, setDialog] = useState<Dialog>(null);
  const [entryId, setEntryId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [newest, setNewest] = useState(true);
  const [date, setDate] = useState("");
  const [limit, setLimit] = useState(100);
  const [showNav, setShowNav] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);
  const [offlineReady, setOfflineReady] = useState(false);
  const [clock, setClock] = useState(new Date());
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");
  const [draft, setDraft] = useState(false);
  const [preset, setPreset] = useState<Fields | undefined>();
  const [formGeneration, setFormGeneration] = useState(0);
  const [backups, setBackups] = useState<Record<string, string>>({});
  const search = useRef<HTMLInputElement>(null);
  const journal = workspace?.journals.find((j) => j.id === workspace.activeId);
  const selected = journal?.entries.find((e) => e.id === entryId);
  const dirty = journal && backups[journal.id] !== JSON.stringify(journal);
  const draftExists = draft || !!workspace?.drafts?.[workspace.activeId];
  const hasDraft = useRef(draftExists);
  hasDraft.current = draftExists;
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    const timer = setInterval(() => setClock(new Date()), 30000);
    if ("serviceWorker" in navigator && import.meta.env.PROD)
      navigator.serviceWorker
        .register("/sw.js")
        .then(() => navigator.serviceWorker.ready)
        .then(() => setOfflineReady(true))
        .catch(() => {});
    return () => {
      clearInterval(timer);
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  useEffect(() => {
    const timer = setTimeout(() => setToast(""), 6000);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    const before = (e: BeforeUnloadEvent) => {
      if (hasDraft.current && !store.persistent) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", before);
    return () => window.removeEventListener("beforeunload", before);
  }, [store.persistent]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        search.current?.focus();
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  const visible = useMemo(() => {
    let entries = searchEntries(journal?.entries ?? [], query);
    if (filter === "follow") entries = entries.filter(needsFollowUp);
    if (filter === "urgent")
      entries = entries.filter((e) => current(e).priority === "Urgent");
    if (filter === "decisions")
      entries = entries.filter((e) => current(e).type === "Décision");
    if (date)
      entries = entries.filter(
        (e) =>
          new Date(current(e).happenedAt).toLocaleDateString("sv-SE", {
            timeZone: "Europe/Zurich",
          }) === date,
      );
    const sorted = chronological(entries);
    return newest ? sorted.reverse() : sorted;
  }, [journal, query, filter, date, newest]);
  useEffect(() => setLimit(100), [query, filter, date, journal?.id]);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [journal?.id]);
  const follow = journal?.entries.filter(needsFollowUp) ?? [];
  const late = follow.filter((e) => overdue(e, clock.getTime()));
  function discardDraft() {
    if (
      draftExists &&
      !window.confirm(
        "Une entrée n’est pas encore consignée. Abandonner cette saisie ?",
      )
    )
      return false;
    setDraft(false);
    if (journal)
      setWorkspace((previous) => {
        if (!previous) return previous;
        const drafts = { ...previous.drafts };
        delete drafts[journal.id];
        return { ...previous, drafts };
      });
    setFormGeneration((value) => value + 1);
    return true;
  }
  function updateJournal(value: Journal) {
    if (!workspace) return;
    setWorkspace(
      workspaceSchema.parse({
        ...workspace,
        journals: workspace.journals.map((j) =>
          j.id === value.id ? value : j,
        ),
      }),
    );
  }
  function saveDraft(fields: Fields) {
    if (!journal) return;
    setDraft(true);
    setWorkspace((previous) =>
      previous
        ? { ...previous, drafts: { ...previous.drafts, [journal.id]: fields } }
        : previous,
    );
  }
  function add(fields: Fields) {
    if (!journal || !workspace) return;
    const updated = addEntry(journal, fields, workspace.author);
    const drafts = { ...workspace.drafts };
    delete drafts[journal.id];
    setWorkspace({
      ...workspace,
      drafts,
      journals: workspace.journals.map((j) =>
        j.id === journal.id ? updated : j,
      ),
    });
    setDraft(false);
    setFormGeneration((value) => value + 1);
    setToast("Entrée consignée.");
  }
  async function create(value: Journal, author: string, password?: string) {
    if (workspace)
      setWorkspace(
        workspaceSchema.parse({
          ...workspace,
          author,
          journals: [...workspace.journals, value],
          activeId: value.id,
        }),
      );
    else if (password)
      await store.startProtected(
        { version: 1, author, journals: [value], activeId: value.id },
        password,
      );
    else
      store.start({
        version: 1,
        author,
        journals: [value],
        activeId: value.id,
      });
    setDialog(null);
    setQuery("");
    setFilter("all");
    setDate("");
    setShowNav(false);
  }
  function importJournal(value: Journal, merge: boolean) {
    if (workspace && journal) {
      if (merge) updateJournal(mergeJournals(journal, value));
      else {
        const copy = {
          ...value,
          id: workspace.journals.some((j) => j.id === value.id)
            ? crypto.randomUUID()
            : value.id,
        };
        setWorkspace(
          workspaceSchema.parse({
            ...workspace,
            journals: [...workspace.journals, copy],
            activeId: copy.id,
          }),
        );
      }
    } else
      store.start({
        version: 1,
        author: "Opérateur",
        journals: [value],
        activeId: value.id,
      });
    setFilter("all");
    setQuery("");
    setDate("");
    setToast("Journal importé. Les données sont disponibles sur ce poste.");
  }
  function compose() {
    if (journal?.closedAt) return;
    if (matchMedia("(min-width: 1200px)").matches)
      document.getElementById("quick-message")?.focus();
    else setDialog("compose");
  }
  async function closeSession() {
    if (!store.persistent && !discardDraft()) return;
    if (
      !store.persistent &&
      !window.confirm(
        "Cette session est temporaire. Vérifiez vos exports avant de fermer : son contenu sera retiré de la mémoire. Fermer la session ?",
      )
    )
      return;
    try {
      await store.close();
      setDialog(null);
      setEntryId(null);
      setBackups({});
      setDraft(false);
      setToast("");
    } catch (err) {
      setError((err as Error).message);
    }
  }
  const openImport = () => {
    if (discardDraft()) setDialog("import");
  };
  if (store.loading)
    return (
      <div className="loading-screen">
        <span className="brand-mark">O</span>
        <p>Ouverture d’ORION…</p>
      </div>
    );
  if (!workspace || !journal)
    return (
      <>
        <Landing
          stored={!!store.stored}
          onCreate={create}
          onDemo={() => store.start(demoWorkspace())}
          onImport={openImport}
          onPrivacy={() => setDialog("privacy")}
          onUnlock={store.unlock}
          onForget={store.forget}
          error={store.error}
        />
        {dialog === "import" && (
          <ImportModal
            onClose={() => setDialog(null)}
            onImport={importJournal}
          />
        )}{" "}
        {dialog === "privacy" && <Privacy onClose={() => setDialog(null)} />}
      </>
    );
  return (
    <div className="app-shell">
      <a href="#journal-main" className="skip-link">
        Aller au journal
      </a>
      <aside className={`sidebar ${showNav ? "open" : ""}`}>
        <div className="brand">
          <span className="brand-mark">
            O<span />
          </span>
          <div>
            ORION<small>JOURNAL D’INTERVENTION</small>
          </div>
          <button
            className="icon-button mobile-nav-close"
            onClick={() => setShowNav(false)}
            aria-label="Fermer la navigation"
          >
            <X size={18} />
          </button>
        </div>
        <div className="sidebar-section-heading">
          <span>CETTE SESSION</span>
          <button
            className="icon-button"
            aria-label="Nouveau journal"
            onClick={() => {
              if (discardDraft()) setDialog("create");
            }}
          >
            <Plus size={16} />
          </button>
        </div>
        <nav aria-label="Journaux">
          {workspace.journals.map((j) => (
            <button
              className={`journal-link ${j.id === journal.id ? "active" : ""}`}
              key={j.id}
              onClick={() => {
                if (j.id === journal.id || !discardDraft()) return;
                setWorkspace((previous) =>
                  previous ? { ...previous, activeId: j.id } : previous,
                );
                setFilter("all");
                setQuery("");
                setDate("");
                setEntryId(null);
                setShowNav(false);
              }}
            >
              <BookOpen size={17} />
              <span>
                <strong>{j.title}</strong>
                <small>
                  {j.closedAt ? "Clôturé" : j.mode} · {j.entries.length} entrées
                </small>
              </span>
              {j.id === journal.id && <span className="active-dot" />}
            </button>
          ))}
        </nav>
        <button
          className="sidebar-add"
          onClick={() => {
            if (discardDraft()) setDialog("create");
          }}
        >
          <Plus size={16} />
          Nouveau journal
        </button>
        <div className="sidebar-bottom">
          <div className="local-card">
            <span className="local-icon">
              <ShieldCheck size={17} />
            </span>
            <strong>Sur ce poste uniquement</strong>
            <p>
              {store.persistent
                ? "Chaque saisie est sauvegardée et chiffrée pour reprendre après un crash."
                : "Session temporaire. Exportez votre journal avant de quitter."}
            </p>
            <button
              className="text-button"
              onClick={() =>
                setDialog(store.persistent ? "privacy" : "settings")
              }
            >
              {store.persistent
                ? "Confidentialité"
                : "Activer la reprise après crash"}
              <ChevronRight size={13} />
            </button>
          </div>
          <button className="sidebar-tool" onClick={openImport}>
            <FileUp size={17} />
            Importer un journal
          </button>
          <button className="sidebar-tool" onClick={() => setDialog("privacy")}>
            <CircleHelp size={17} />
            Confidentialité & aide
          </button>
          <a
            className="sidebar-source"
            href="/source/orion-source.tar.gz"
            download
          >
            ORION 1.0 <span>Code ouvert ↗</span>
          </a>
        </div>
      </aside>
      {showNav && (
        <button
          className="nav-scrim"
          aria-label="Fermer la navigation"
          onClick={() => setShowNav(false)}
        />
      )}
      <div className="workspace">
        <header className="topbar">
          <div className="breadcrumbs">
            <button
              className="icon-button nav-toggle"
              aria-label="Ouvrir la navigation"
              onClick={() => setShowNav(true)}
            >
              <Menu size={19} />
            </button>
            <BookOpen size={16} />
            <span>Journaux</span>
            <ChevronRight size={13} />
            <strong>{journal.title}</strong>
          </div>
          <div className="topbar-right">
            <span
              className={`connection ${!online ? "offline" : ""}`}
              title={
                offlineReady
                  ? "L’application est disponible hors ligne sur ce navigateur."
                  : "Ouvrez une fois la version construite en ligne pour préparer le mode hors ligne."
              }
            >
              <Signal size={14} />
              {!online
                ? "Hors ligne"
                : offlineReady
                  ? "Prêt hors ligne"
                  : "Sur ce poste"}
            </span>
            <span className="clock">
              {time(clock.toISOString())}
              <small>CH</small>
            </span>
            <button className="operator" onClick={() => setDialog("settings")}>
              <span className="avatar">
                {workspace.author.slice(0, 2).toUpperCase()}
              </span>
              <span>{workspace.author}</span>
              <Settings2 size={14} />
            </button>
            <button
              className="icon-button"
              title={
                store.persistent ? "Verrouiller l’espace" : "Fermer la session"
              }
              aria-label={
                store.persistent ? "Verrouiller l’espace" : "Fermer la session"
              }
              onClick={() => void closeSession()}
            >
              {store.persistent ? (
                <LockKeyhole size={17} />
              ) : (
                <LogOut size={17} />
              )}
            </button>
          </div>
        </header>
        <main id="journal-main">
          <div className="journal-heading">
            <div>
              <div className="eyebrow">
                <span
                  className={`status-dot ${journal.closedAt ? "closed" : ""}`}
                />
                {journal.closedAt ? "JOURNAL CLÔTURÉ" : "JOURNAL OUVERT"}
                <span className="meta-divider" />
                {journal.mode.toUpperCase()}
                <span className="badge subdued">{journal.classification}</span>
              </div>
              <h1>{journal.title}</h1>
              <div className="journal-context">
                {journal.location && (
                  <span>
                    <MapPin size={14} />
                    {journal.location}
                  </span>
                )}
                {journal.organization && <span>{journal.organization}</span>}
                <span>{day(journal.createdAt)}</span>
                {journal.reference && (
                  <span className="mono">{journal.reference}</span>
                )}
              </div>
            </div>
            <div className="heading-actions">
              <button onClick={() => setDialog("handover")}>
                <ArrowRight size={16} />
                Passer la relève
              </button>
              <button onClick={() => setDialog("export")}>
                <Download size={16} />
                Exporter
              </button>
              <button
                className="primary"
                disabled={!!journal.closedAt}
                onClick={compose}
              >
                <Plus size={17} />
                Nouvelle entrée
              </button>
            </div>
          </div>
          {(error || store.error) && (
            <div className="error banner" role="alert">
              <AlertCircle size={17} />
              {error || store.error}
              <button
                className="text-button"
                onClick={() => setDialog("export")}
              >
                Exporter une copie
              </button>
            </div>
          )}
          <div className="journal-status">
            <div>
              <span className="mono">
                {String(journal.entries.length).padStart(2, "0")}
              </span>{" "}
              entrées
              <span className="meta-divider" />
              <button
                className="text-button"
                onClick={() => setFilter("follow")}
              >
                <span className={follow.length ? "amber-text" : ""}>
                  {follow.length}
                </span>{" "}
                suites à donner
                {late.length > 0 && (
                  <span className="overdue-count">{late.length} en retard</span>
                )}
              </button>
            </div>
            <div>
              <span
                className={`save-indicator ${store.saveState === "error" ? "red-text" : ""}`}
              >
                {store.saveState === "saved" ? (
                  <Check size={13} />
                ) : (
                  <HardDrive size={13} />
                )}
                {store.saveState === "saved"
                  ? "Sauvegardé sur ce poste"
                  : store.saveState === "saving"
                    ? "Sauvegarde en cours…"
                    : store.saveState === "error"
                      ? "Échec de sauvegarde"
                      : "Session temporaire"}
              </span>
              <button
                className="text-button backup-indicator"
                onClick={() => setDialog("export")}
              >
                <ArrowDownToLine size={13} />
                {dirty ? "Copie de sécurité à faire" : "Archive téléchargée"}
              </button>
            </div>
          </div>
          <div className="journal-layout">
            <section className="journal-panel" aria-label="Entrées du journal">
              <div
                className="filter-tabs"
                role="group"
                aria-label="Filtrer les entrées"
              >
                {(
                  [
                    ["all", "Tout le journal", journal.entries.length],
                    ["follow", "À suivre", follow.length],
                    [
                      "urgent",
                      "Urgent",
                      journal.entries.filter(
                        (e) => current(e).priority === "Urgent",
                      ).length,
                    ],
                    [
                      "decisions",
                      "Décisions",
                      journal.entries.filter(
                        (e) => current(e).type === "Décision",
                      ).length,
                    ],
                  ] as const
                ).map(([value, label, count]) => (
                  <button
                    aria-pressed={filter === value}
                    className={filter === value ? "selected" : ""}
                    key={value}
                    onClick={() => setFilter(value)}
                  >
                    {label}
                    <span>{count}</span>
                  </button>
                ))}
              </div>
              <div className="table-toolbar">
                <div className="search-field">
                  <Search size={16} />
                  <input
                    ref={search}
                    aria-label="Rechercher dans le journal"
                    placeholder="Rechercher un message, un lieu, un indicatif…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                  {query ? (
                    <button
                      className="icon-button"
                      aria-label="Effacer la recherche"
                      onClick={() => setQuery("")}
                    >
                      <X size={14} />
                    </button>
                  ) : (
                    <kbd>⌘ K</kbd>
                  )}
                </div>
                <label className="date-filter">
                  <ListFilter size={15} />
                  <span className="sr-only">Filtrer par date en Suisse</span>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    aria-label="Filtrer par date en Suisse"
                  />
                </label>
                <button
                  className="icon-button"
                  title={
                    newest
                      ? "Afficher les plus anciennes en premier"
                      : "Afficher les plus récentes en premier"
                  }
                  aria-label={
                    newest
                      ? "Afficher les plus anciennes en premier"
                      : "Afficher les plus récentes en premier"
                  }
                  onClick={() => setNewest(!newest)}
                >
                  {newest ? <ArrowDown size={17} /> : <ArrowUp size={17} />}
                </button>
              </div>
              <div className="table-container">
                <table className="journal-table">
                  <thead>
                    <tr>
                      <th>HEURE / N°</th>
                      <th>ÉVÉNEMENT</th>
                      <th>ÉMETTEUR</th>
                      <th>SUIVI</th>
                      <th>
                        <span className="sr-only">Ouvrir</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.slice(0, limit).map((entry, index) => {
                      const f = current(entry);
                      const newDay =
                        index === 0 ||
                        day(current(visible[index - 1]).happenedAt) !==
                          day(f.happenedAt);
                      return (
                        <JournalRow
                          key={entry.id}
                          {...{ entry, newDay }}
                          onOpen={() => setEntryId(entry.id)}
                          at={clock.getTime()}
                        />
                      );
                    })}
                  </tbody>
                </table>
                {!visible.length && (
                  <div className="empty-state">
                    <BookOpen size={30} />
                    <h2>
                      {journal.entries.length
                        ? "Aucune entrée correspondante"
                        : "Votre journal commence ici"}
                    </h2>
                    <p>
                      {journal.entries.length
                        ? "Essayez un autre mot ou retirez les filtres."
                        : "Un appel, un fait observé, une décision. Consignez la première information."}
                    </p>
                    <button
                      onClick={() => {
                        if (journal.entries.length) {
                          setQuery("");
                          setFilter("all");
                          setDate("");
                        } else compose();
                      }}
                    >
                      {journal.entries.length
                        ? "Effacer les filtres"
                        : "Consigner la première entrée"}
                      <ArrowRight size={15} />
                    </button>
                  </div>
                )}
              </div>
              <footer className="table-footer">
                <span>
                  {visible.length} entrée{visible.length !== 1 ? "s" : ""}{" "}
                  {visible.length !== journal.entries.length &&
                    `sur ${journal.entries.length}`}
                  <span className="meta-divider" />
                  Heures Europe/Zurich
                </span>
                <span>
                  {newest ? "Plus récentes en premier" : "Ordre chronologique"}
                </span>
              </footer>
              {visible.length > limit && (
                <button
                  className="load-more"
                  onClick={() => setLimit(limit + 100)}
                >
                  Afficher 100 entrées de plus
                </button>
              )}
            </section>
            <aside className="composer-panel">
              {workspace.drafts?.[journal.id]?.message && (
                <p className="draft-status">
                  {store.persistent
                    ? "Brouillon inclus dans la reprise locale"
                    : "Brouillon non consigné"}
                </p>
              )}
              {journal.closedAt ? (
                <div className="closed-panel">
                  <FolderClosed size={28} />
                  <h2>Journal clôturé</h2>
                  <p>Consultation et export restent disponibles.</p>
                  <button onClick={() => setDialog("settings")}>
                    Gérer le journal
                  </button>
                </div>
              ) : (
                <EntryForm
                  key={`${journal.id}-${formGeneration}`}
                  author={workspace.author}
                  preset={workspace.drafts?.[journal.id]}
                  onDraft={saveDraft}
                  onSave={(fields) => add(fields)}
                  compact
                />
              )}
              <div className="composer-note">
                <ShieldCheck size={15} />
                <span>Reste sur ce poste. Aucun envoi automatique.</span>
              </div>
            </aside>
          </div>
          <footer className="workspace-footer">
            <span>
              ORION <span>·</span> Une trace claire, du premier message à la
              relève.
            </span>
            <button
              className="text-button"
              onClick={() => setDialog("privacy")}
            >
              Code ouvert · données locales
            </button>
          </footer>
        </main>
      </div>
      {toast && (
        <div className="toast" role="status">
          <Check size={16} />
          {toast}
        </div>
      )}
      {selected && (
        <EntryDetail
          key={selected.id}
          entry={selected}
          author={workspace.author}
          readOnly={!!journal.closedAt}
          onClose={() => setEntryId(null)}
          onRevise={(fields, reason) => {
            updateJournal(
              reviseEntry(
                journal,
                selected.id,
                fields,
                workspace.author,
                reason,
              ),
            );
            setToast(
              "Modification enregistrée. La version précédente est conservée.",
            );
          }}
          onReply={() => {
            if (!discardDraft()) return;
            setPreset({
              ...emptyFields(),
              type: "Quittance",
              source: workspace.author,
              recipient: current(selected).source,
              location: current(selected).location,
              reference: `Suite de ${numberLabel(selected)}`,
            });
            setEntryId(null);
            setDialog("compose");
          }}
        />
      )}
      {dialog === "create" && (
        <Modal title="Nouveau journal" onClose={() => setDialog(null)}>
          <JournalSetup author={workspace.author} onCreate={create} />
        </Modal>
      )}
      {dialog === "export" && (
        <ExportModal
          journal={journal}
          onClose={() => setDialog(null)}
          onBackup={() =>
            setBackups((prev) => ({
              ...prev,
              [journal.id]: JSON.stringify(journal),
            }))
          }
        />
      )}
      {dialog === "import" && (
        <ImportModal
          target={journal}
          onClose={() => setDialog(null)}
          onImport={importJournal}
        />
      )}
      {dialog === "privacy" && <Privacy onClose={() => setDialog(null)} />}
      {dialog === "settings" && (
        <Settings
          workspace={workspace}
          journal={journal}
          persistent={store.persistent}
          stored={!!store.stored}
          onClose={() => setDialog(null)}
          onProtect={store.protect}
          onUpdate={(value) => setWorkspace(workspaceSchema.parse(value))}
          onJournal={(value) => {
            const reopened = { ...journal, closedAt: "" };
            const noted = addEntry(
              reopened,
              {
                ...emptyFields(),
                type: "Observation",
                message: value.closedAt
                  ? "Clôture du journal par l’opérateur."
                  : "Réouverture du journal par l’opérateur.",
                reliability: "Confirmé",
              },
              workspace.author,
            );
            updateJournal({ ...noted, closedAt: value.closedAt });
          }}
          onEnd={() => void closeSession()}
          onFinish={async () => {
            if (!discardDraft()) return;
            const unexported = workspace.journals.filter(
              (j) => backups[j.id] !== JSON.stringify(j),
            );
            if (unexported.length)
              throw new Error(
                `Exportez une archive récente de chaque journal avant de terminer (${unexported.length} à exporter).`,
              );
            if (
              window.prompt(
                "Les archives téléchargées doivent avoir été vérifiées. Pour effacer cette session du poste, saisissez TERMINER.",
              ) === "TERMINER"
            ) {
              await store.finish();
              setDialog(null);
              setBackups({});
              setError("");
              setToast("Session effacée de ce poste.");
            }
          }}
          onExport={() => setDialog("export")}
        />
      )}
      {dialog === "handover" && (
        <Handover
          journal={journal}
          onClose={() => setDialog(null)}
          onExport={() => setDialog("export")}
          onTakeOver={() => {
            if (!discardDraft()) return;
            setPreset({
              ...emptyFields(),
              type: "Relève",
              reliability: "Confirmé",
              message: `Relève du journal. ${follow.length} suite(s) à donner, dont ${late.length} en retard.`,
              notes:
                "Relire les entrées en attente et préciser les consignes transmises.",
            });
            setDialog("compose");
          }}
        />
      )}
      {dialog === "compose" && (
        <Modal
          title={
            preset?.type === "Relève"
              ? "Consigner la relève"
              : "Nouvelle entrée"
          }
          onClose={() => {
            if (discardDraft()) {
              setDialog(null);
              setPreset(undefined);
            }
          }}
        >
          <div onInput={() => setDraft(true)}>
            <EntryForm
              key={preset?.reference || "new"}
              author={workspace.author}
              preset={preset ?? workspace.drafts?.[journal.id]}
              onDraft={saveDraft}
              onSave={(fields) => {
                add(fields);
                setDialog(null);
                setPreset(undefined);
              }}
            />
          </div>
        </Modal>
      )}
    </div>
  );
}
