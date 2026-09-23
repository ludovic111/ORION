import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  BookOpen,
  Check,
  Download,
  FileText,
  FileUp,
  ListFilter,
  LockKeyhole,
  LogOut,
  Menu,
  Plus,
  Radio as RadioIcon,
  RefreshCw,
  Search,
  Shield,
  Settings2,
  Square,
  SquareCheck,
  SquareMinus,
  X,
} from "lucide-react";
import {
  addEntry,
  chronological,
  dateTime,
  deleteEntry,
  current,
  day,
  emptyFields,
  mergeJournals,
  needsFollowUp,
  numberLabel,
  overdue,
  reviseEntry,
  searchEntries,
  updateRadio,
  workspaceSchema,
  type Fields,
  type Journal,
} from "../shared/journal";
import { radioSummary, type Radio } from "../shared/radio";
import { demoWorkspace } from "./journal/demo";
import { useWorkspace } from "./journal/useWorkspace";
import { EntryForm } from "./journal/EntryForm";
import { EntryDetail } from "./journal/EntryDetail";
import { JournalRow } from "./journal/JournalRow";
import { JournalSetup } from "./journal/JournalSetup";
import { Landing } from "./journal/Landing";
import { Modal } from "./journal/Modal";
import { Privacy } from "./journal/Privacy";
import { Settings } from "./journal/SessionSettings";
import { Handover } from "./journal/Handover";
import { ExportModal, ImportModal } from "./journal/Transfer";
import { RadioView } from "./radio/RadioView";
import { PrintPreview, type PrintJob } from "./print/PrintPreview";
import { Clock } from "./ui/Clock";
import { Mark } from "./ui/Mark";
import { Num, useSlider } from "./ui/motion";

type Dialog =
  | "create"
  | "export"
  | "import"
  | "settings"
  | "privacy"
  | "handover"
  | "compose"
  | "deleted"
  | null;
type Filter = "all" | "follow" | "urgent" | "decisions";
type Module = "journal" | "radio";
const moduleFromHash = (): Module =>
  location.hash === "#radio" ? "radio" : "journal";

export default function App() {
  const store = useWorkspace();
  const { workspace, setWorkspace } = store;
  const [module, setModule] = useState<Module>(moduleFromHash);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [entryId, setEntryId] = useState<string | null>(null);
  const [entryMode, setEntryMode] = useState<"view" | "edit" | "delete">(
    "view",
  );
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [newest, setNewest] = useState(true);
  const [date, setDate] = useState("");
  const [limit, setLimit] = useState(100);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [print, setPrint] = useState<PrintJob | null>(null);
  const [showNav, setShowNav] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);
  const [offlineReady, setOfflineReady] = useState(false);
  const [updateReady, setUpdateReady] = useState(false);
  const [minute, setMinute] = useState(Date.now());
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");
  const [draft, setDraft] = useState(false);
  const [preset, setPreset] = useState<Fields | undefined>();
  const [formGeneration, setFormGeneration] = useState(0);
  const [backups, setBackups] = useState<Record<string, string>>({});
  const search = useRef<HTMLInputElement>(null);
  const modulesSlider = useSlider<HTMLElement>(
    `${module}-${workspace?.activeId}`,
  );
  const filterSlider = useSlider<HTMLDivElement>(
    `${filter}-${module}-${workspace?.activeId}`,
  );
  const journal = workspace?.journals.find((j) => j.id === workspace.activeId);
  const selected = journal?.entries.find((e) => e.id === entryId);
  const dirty = journal && backups[journal.id] !== JSON.stringify(journal);
  const draftExists = draft || !!workspace?.drafts?.[workspace.activeId];
  const hasDraft = useRef(draftExists);
  hasDraft.current = draftExists;
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    const hash = () => setModule(moduleFromHash());
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    window.addEventListener("hashchange", hash);
    const timer = setInterval(() => setMinute(Date.now()), 30000);
    let checkUpdates: ReturnType<typeof setInterval> | undefined;
    if ("serviceWorker" in navigator && import.meta.env.PROD) {
      const controlled = !!navigator.serviceWorker.controller;
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (controlled) setUpdateReady(true);
      });
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          checkUpdates = setInterval(
            () => void registration.update().catch(() => {}),
            15 * 60_000,
          );
          return navigator.serviceWorker.ready;
        })
        .then(() => setOfflineReady(true))
        .catch(() => {});
    }
    return () => {
      clearInterval(timer);
      clearInterval(checkUpdates);
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
      window.removeEventListener("hashchange", hash);
    };
  }, []);
  useEffect(() => {
    const timer = setTimeout(() => setToast(""), 5000);
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
        go("journal");
        requestAnimationFrame(() => search.current?.focus());
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
    setPicked(new Set());
  }, [journal?.id]);
  const follow = journal?.entries.filter(needsFollowUp) ?? [];
  const late = follow.filter((e) => overdue(e, minute));
  const urgent =
    journal?.entries.filter((e) => current(e).priority === "Urgent").length ??
    0;
  const decisions =
    journal?.entries.filter((e) => current(e).type === "Décision").length ?? 0;
  const pickedEntries = chronological(
    journal?.entries.filter((e) => picked.has(e.id)) ?? [],
  );
  function go(value: Module) {
    history.replaceState(
      null,
      "",
      value === "radio" ? "#radio" : location.pathname + location.search,
    );
    setModule(value);
    setShowNav(false);
  }
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
  function saveRadio(radio: Radio, log?: Partial<Fields>) {
    if (!journal || !workspace) return;
    let value = updateRadio(journal, radio);
    if (log)
      value = addEntry(
        value,
        {
          ...emptyFields(),
          type: "Observation",
          channel: "Sur place",
          reliability: "Confirmé",
          tags: ["radio"],
          ...log,
        },
        workspace.author,
      );
    updateJournal(value);
    if (log) setToast(`Consigné au journal : ${log.message}`);
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
    setToast(`Entrée ${numberLabel(updated.entries.at(-1)!)} consignée.`);
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
    resetView();
  }
  function resetView() {
    setQuery("");
    setFilter("all");
    setDate("");
    setEntryId(null);
    setShowNav(false);
  }
  function importJournal(value: Journal, merge: boolean, author?: string) {
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
        author: author || "Opérateur",
        journals: [value],
        activeId: value.id,
      });
    resetView();
    setToast(merge ? "Entrées fusionnées." : "Journal importé.");
  }
  function compose() {
    if (journal?.closedAt) return;
    go("journal");
    if (matchMedia("(min-width: 1200px)").matches)
      requestAnimationFrame(() =>
        document.getElementById("quick-message")?.focus(),
      );
    else setDialog("compose");
  }
  async function closeSession() {
    if (!store.persistent && !discardDraft()) return;
    if (
      !store.persistent &&
      !window.confirm(
        "Session temporaire : son contenu sera retiré de la mémoire. Vérifiez vos exports. Fermer la session ?",
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
  function openEntry(id: string, mode: "view" | "edit" | "delete" = "view") {
    setEntryMode(mode);
    setEntryId(id);
  }
  function togglePick(id: string) {
    setPicked((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  if (store.loading)
    return (
      <div className="boot">
        <Mark />
        <span>ORION</span>
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
        )}
        {dialog === "privacy" && <Privacy onClose={() => setDialog(null)} />}
      </>
    );
  const radio = radioSummary(journal.radio);
  const shownIds = visible.slice(0, limit).map((e) => e.id);
  const allShownPicked =
    shownIds.length > 0 && shownIds.every((id) => picked.has(id));
  return (
    <div className="shell">
      <a href="#main" className="skip-link">
        Aller au contenu
      </a>
      <header className="topbar">
        <button
          className="icon-button nav-toggle"
          aria-label="Ouvrir la navigation"
          onClick={() => setShowNav(true)}
        >
          <Menu size={18} />
        </button>
        <div className="topbar-brand">
          <Mark />
          <span>ORION</span>
        </div>
        <nav
          className="modules slider"
          aria-label="Modules"
          ref={modulesSlider.ref}
        >
          <span className="slider-pill" ref={modulesSlider.pill} />
          <button
            aria-current={module === "journal" ? "page" : undefined}
            onClick={() => go("journal")}
          >
            <BookOpen size={14} />
            Journal
            <span className="count">{journal.entries.length}</span>
          </button>
          <button
            aria-current={module === "radio" ? "page" : undefined}
            onClick={() => go("radio")}
          >
            <RadioIcon size={14} />
            <span className="wide-only">Réseau radio</span>
            <span className="narrow-only">Radio</span>
            <span className="count">
              {radio.issued}/{radio.terminals}
            </span>
          </button>
        </nav>
        <div className="topbar-status">
          <span
            className={`status-chip ${store.saveState === "error" ? "crit" : store.persistent ? "ok" : "warn"}`}
            title={
              store.persistent
                ? "Sauvegarde chiffrée sur ce poste"
                : "Session temporaire : exportez avant de fermer"
            }
          >
            <span className="dot" />
            {store.saveState === "error"
              ? "Échec sauvegarde"
              : store.saveState === "saving"
                ? "Sauvegarde…"
                : store.persistent
                  ? "Chiffré local"
                  : "Temporaire"}
          </span>
          <span
            className={`status-chip ${online ? "" : "warn"}`}
            title={
              offlineReady
                ? "Application disponible hors ligne"
                : "Mode hors ligne actif après un premier chargement de la version construite"
            }
          >
            <span className="dot" />
            {!online
              ? "Hors ligne"
              : offlineReady
                ? "Hors ligne prêt"
                : "En ligne"}
          </span>
          <Clock />
          <button
            className="operator"
            onClick={() => setDialog("settings")}
            title="Opérateur et session"
          >
            <span className="avatar">
              {workspace.author.slice(0, 2).toUpperCase()}
            </span>
            <span className="operator-name">{workspace.author}</span>
            <Settings2 size={13} />
          </button>
          <button
            className="icon-button"
            title={store.persistent ? "Verrouiller" : "Fermer la session"}
            aria-label={store.persistent ? "Verrouiller" : "Fermer la session"}
            onClick={() => void closeSession()}
          >
            {store.persistent ? (
              <LockKeyhole size={16} />
            ) : (
              <LogOut size={16} />
            )}
          </button>
        </div>
      </header>
      <aside className={`rail ${showNav ? "open" : ""}`}>
        <div className="rail-head">
          <span className="label">Journaux · session</span>
          <button
            className="icon-button"
            aria-label="Nouveau journal"
            title="Nouveau journal"
            onClick={() => {
              if (discardDraft()) setDialog("create");
            }}
          >
            <Plus size={15} />
          </button>
          <button
            className="icon-button rail-close"
            onClick={() => setShowNav(false)}
            aria-label="Fermer la navigation"
          >
            <X size={16} />
          </button>
        </div>
        <nav aria-label="Journaux" className="rail-list">
          {workspace.journals.map((j) => (
            <button
              className="rail-item"
              aria-current={j.id === journal.id ? "true" : undefined}
              key={j.id}
              onClick={() => {
                if (j.id === journal.id || !discardDraft()) return;
                setWorkspace((previous) =>
                  previous ? { ...previous, activeId: j.id } : previous,
                );
                resetView();
              }}
            >
              <strong>{j.title}</strong>
              <small>
                {j.closedAt ? "CLÔTURÉ" : j.mode.toUpperCase()} ·{" "}
                {j.entries.length} ENT · {j.radio.terminals.length} TERM
              </small>
            </button>
          ))}
        </nav>
        <div className="rail-foot">
          <button className="rail-tool" onClick={openImport}>
            <FileUp size={14} />
            Importer
          </button>
          <button className="rail-tool" onClick={() => setDialog("export")}>
            <Download size={14} />
            Exporter
            {dirty && <span className="pip" title="Aucune archive récente" />}
          </button>
          <button className="rail-tool" onClick={() => setDialog("privacy")}>
            <Shield size={14} />
            Sécurité et données
          </button>
          <a
            className="rail-version"
            href="/source/orion-source.tar.gz"
            download
          >
            ORION 1.1 · AGPL-3.0 · source
          </a>
        </div>
      </aside>
      {showNav && (
        <button
          className="scrim"
          aria-label="Fermer la navigation"
          onClick={() => setShowNav(false)}
        />
      )}
      <main id="main" className="main">
        <section className="page-head">
          <div className="page-title">
            <div className="kicker">
              <span className={`state ${journal.closedAt ? "closed" : "open"}`}>
                {journal.closedAt ? "Clôturé" : "Ouvert"}
              </span>
              <span>{journal.mode}</span>
              <span>{journal.classification}</span>
              {journal.reference && (
                <span className="mono">{journal.reference}</span>
              )}
            </div>
            <h1>{journal.title}</h1>
            <p className="meta">
              {[journal.organization, journal.location, day(journal.createdAt)]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
          <div className="page-actions">
            {module === "journal" ? (
              <>
                <button onClick={() => setDialog("handover")}>Relève</button>
                <button onClick={() => setDialog("export")}>
                  <Download size={14} />
                  Exporter
                </button>
                <button
                  className="primary"
                  disabled={!!journal.closedAt}
                  onClick={compose}
                >
                  <Plus size={15} />
                  Nouvelle entrée
                </button>
              </>
            ) : (
              <button
                onClick={() =>
                  setPrint({ kind: "radio", journal, author: workspace.author })
                }
              >
                <FileText size={14} />
                Plan A4
              </button>
            )}
          </div>
        </section>
        {updateReady && (
          <div className="banner info" role="status">
            <RefreshCw size={15} />
            <span>Nouvelle version d’ORION disponible.</span>
            <button
              className="link"
              onClick={() => {
                if (
                  store.persistent ||
                  window.confirm(
                    "Session temporaire : recharger efface son contenu. Exportez d’abord. Recharger ?",
                  )
                )
                  location.reload();
              }}
            >
              Recharger
            </button>
          </div>
        )}
        {(error || store.error) && (
          <div className="banner crit" role="alert">
            <AlertTriangle size={15} />
            <span>{error || store.error}</span>
            <button className="link" onClick={() => setDialog("export")}>
              Exporter une copie
            </button>
          </div>
        )}
        {module === "journal" ? (
          <>
            <dl className="metrics">
              <div>
                <dt>Entrées</dt>
                <dd>
                  <Num value={journal.entries.length} />
                </dd>
              </div>
              <div className={follow.length ? "warn" : ""}>
                <dt>À suivre</dt>
                <dd>
                  <Num value={follow.length} />
                </dd>
              </div>
              <div className={late.length ? "crit" : ""}>
                <dt>Échéances dépassées</dt>
                <dd>
                  <Num value={late.length} />
                </dd>
              </div>
              <div className={urgent ? "crit" : ""}>
                <dt>Urgent</dt>
                <dd>
                  <Num value={urgent} />
                </dd>
              </div>
              <div>
                <dt>Radios en service</dt>
                <dd>
                  <Num value={radio.issued} />
                  <small>/{radio.terminals}</small>
                </dd>
              </div>
              <div className={dirty ? "warn" : ""}>
                <dt>Archive</dt>
                <dd className="text">
                  <button className="link" onClick={() => setDialog("export")}>
                    {dirty ? "À exporter" : "À jour"}
                  </button>
                </dd>
              </div>
            </dl>
            <div className="journal-layout">
              <section className="panel journal-panel" aria-label="Entrées">
                <div className="toolbar">
                  <div
                    className="segmented slider"
                    role="group"
                    aria-label="Filtrer"
                    ref={filterSlider.ref}
                  >
                    <span className="slider-pill" ref={filterSlider.pill} />
                    {(
                      [
                        ["all", "Tout", journal.entries.length],
                        ["follow", "À suivre", follow.length],
                        ["urgent", "Urgent", urgent],
                        ["decisions", "Décisions", decisions],
                      ] as const
                    ).map(([value, label, count]) => (
                      <button
                        aria-pressed={filter === value}
                        key={value}
                        onClick={() => setFilter(value)}
                      >
                        {label}
                        <span>{count}</span>
                      </button>
                    ))}
                  </div>
                  <div className="search">
                    <Search size={14} />
                    <input
                      ref={search}
                      aria-label="Rechercher"
                      placeholder="Rechercher"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                    {query ? (
                      <button
                        className="icon-button"
                        aria-label="Effacer la recherche"
                        onClick={() => setQuery("")}
                      >
                        <X size={13} />
                      </button>
                    ) : (
                      <kbd>⌘K</kbd>
                    )}
                  </div>
                  <label className="date-filter">
                    <ListFilter size={14} />
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      aria-label="Filtrer par jour (heure suisse)"
                    />
                  </label>
                  <button
                    className="icon-button"
                    title={
                      newest ? "Plus récentes d’abord" : "Ordre chronologique"
                    }
                    aria-label={
                      newest
                        ? "Afficher en ordre chronologique"
                        : "Afficher les plus récentes d’abord"
                    }
                    onClick={() => setNewest(!newest)}
                  >
                    {newest ? <ArrowDown size={15} /> : <ArrowUp size={15} />}
                  </button>
                </div>
                {picked.size > 0 && (
                  <div
                    className="selection-bar"
                    role="region"
                    aria-label="Sélection"
                  >
                    <span className="mono">
                      {picked.size} sélectionnée{picked.size > 1 ? "s" : ""}
                    </span>
                    <button
                      className="primary"
                      onClick={() =>
                        setPrint({
                          kind: "messages",
                          journal,
                          entries: pickedEntries,
                        })
                      }
                    >
                      <FileText size={14} />
                      Fiches A4
                    </button>
                    <button onClick={() => setPicked(new Set())}>
                      Désélectionner
                    </button>
                  </div>
                )}
                <div className="table-scroll">
                  <table className="grid journal-grid">
                    <thead>
                      <tr>
                        <th className="pick">
                          <button
                            className="check"
                            aria-label={
                              allShownPicked
                                ? "Désélectionner les entrées affichées"
                                : "Sélectionner les entrées affichées"
                            }
                            onClick={() =>
                              setPicked((previous) => {
                                const next = new Set(previous);
                                shownIds.forEach((id) =>
                                  allShownPicked
                                    ? next.delete(id)
                                    : next.add(id),
                                );
                                return next;
                              })
                            }
                          >
                            {allShownPicked ? (
                              <SquareCheck size={15} />
                            ) : picked.size ? (
                              <SquareMinus size={15} />
                            ) : (
                              <Square size={15} />
                            )}
                          </button>
                        </th>
                        <th>Heure · N°</th>
                        <th>Message</th>
                        <th>Émetteur</th>
                        <th>Suivi</th>
                        <th>
                          <span className="sr-only">Actions</span>
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
                            entry={entry}
                            newDay={newDay}
                            picked={picked.has(entry.id)}
                            onPick={() => togglePick(entry.id)}
                            onOpen={() => openEntry(entry.id)}
                            onEdit={() => openEntry(entry.id, "edit")}
                            onDelete={() => openEntry(entry.id, "delete")}
                            readOnly={!!journal.closedAt}
                            at={minute}
                          />
                        );
                      })}
                    </tbody>
                  </table>
                  {!visible.length && (
                    <div className="empty">
                      <p>
                        {journal.entries.length
                          ? "Aucune entrée ne correspond."
                          : "Journal vide."}
                      </p>
                      {journal.entries.length ? (
                        <button
                          onClick={() => {
                            setQuery("");
                            setFilter("all");
                            setDate("");
                          }}
                        >
                          Retirer les filtres
                        </button>
                      ) : (
                        !journal.closedAt && (
                          <button className="primary" onClick={compose}>
                            <Plus size={14} />
                            Première entrée
                          </button>
                        )
                      )}
                    </div>
                  )}
                </div>
                <footer className="panel-foot">
                  <span>
                    {visible.length}
                    {visible.length !== journal.entries.length &&
                      ` / ${journal.entries.length}`}{" "}
                    entrée{visible.length !== 1 ? "s" : ""}
                  </span>
                  {journal.deleted.length > 0 && (
                    <button
                      className="link"
                      onClick={() => setDialog("deleted")}
                    >
                      {journal.deleted.length} supprimée
                      {journal.deleted.length > 1 ? "s" : ""}
                    </button>
                  )}
                  <span>Europe/Zurich</span>
                </footer>
                {visible.length > limit && (
                  <button
                    className="load-more"
                    onClick={() => setLimit(limit + 100)}
                  >
                    Afficher 100 de plus
                  </button>
                )}
              </section>
              <aside className="panel composer">
                {journal.closedAt ? (
                  <div className="closed">
                    <LockKeyhole size={18} />
                    <strong>Journal clôturé</strong>
                    <p>Lecture et export uniquement.</p>
                    <button onClick={() => setDialog("settings")}>
                      Rouvrir
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
                    draftLabel={
                      workspace.drafts?.[journal.id]?.message
                        ? store.persistent
                          ? "Brouillon sauvegardé"
                          : "Brouillon non sauvegardé"
                        : ""
                    }
                  />
                )}
              </aside>
            </div>
          </>
        ) : (
          <RadioView
            journal={journal}
            author={workspace.author}
            readOnly={!!journal.closedAt}
            onSave={saveRadio}
            onError={setError}
          />
        )}
      </main>
      {toast && (
        <div className="toast" role="status">
          <Check size={14} />
          {toast}
        </div>
      )}
      {selected && (
        <EntryDetail
          key={`${selected.id}-${entryMode}`}
          entry={selected}
          mode={entryMode}
          onDelete={(reason) => {
            updateJournal(
              deleteEntry(journal, selected.id, workspace.author, reason),
            );
            setPicked((previous) => {
              const next = new Set(previous);
              next.delete(selected.id);
              return next;
            });
            setEntryId(null);
            setToast(`Entrée ${numberLabel(selected)} supprimée.`);
          }}
          author={workspace.author}
          readOnly={!!journal.closedAt}
          onClose={() => setEntryId(null)}
          onPrint={() => {
            setEntryId(null);
            setPrint({ kind: "messages", journal, entries: [selected] });
          }}
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
            setToast("Modification enregistrée. Version précédente conservée.");
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
      {print && <PrintPreview job={print} onClose={() => setPrint(null)} />}
      {dialog === "create" && (
        <Modal title="Nouveau journal" onClose={() => setDialog(null)}>
          <JournalSetup author={workspace.author} onCreate={create} />
        </Modal>
      )}
      {dialog === "export" && (
        <ExportModal
          journal={journal}
          author={workspace.author}
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
      {dialog === "deleted" && (
        <Modal title="Entrées supprimées" onClose={() => setDialog(null)}>
          <table className="grid dense">
            <thead>
              <tr>
                <th>N°</th>
                <th>Supprimée le</th>
                <th>Par</th>
                <th>Motif</th>
              </tr>
            </thead>
            <tbody>
              {[...journal.deleted].reverse().map((d) => (
                <tr key={d.id}>
                  <td className="mono">#{String(d.number).padStart(3, "0")}</td>
                  <td className="mono">{dateTime(d.at)}</td>
                  <td>{d.by}</td>
                  <td>{d.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Modal>
      )}
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
                  ? "Clôture du journal."
                  : "Réouverture du journal.",
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
                `Exportez d’abord une archive ORION ou JSON de chaque journal (${unexported.length} restant${unexported.length > 1 ? "s" : ""}).`,
              );
            if (
              window.prompt(
                "Archives vérifiées ? Saisissez TERMINER pour effacer la session de ce poste.",
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
          at={minute}
          onClose={() => setDialog(null)}
          onExport={() => setDialog("export")}
          onOpen={(id) => {
            setDialog(null);
            openEntry(id);
          }}
          onTakeOver={() => {
            if (!discardDraft()) return;
            setPreset({
              ...emptyFields(),
              type: "Relève",
              reliability: "Confirmé",
              message: `Relève. ${follow.length} suite(s) à donner, dont ${late.length} en retard. ${radio.issued} radio(s) en service.`,
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
              key={preset?.reference || preset?.type || "new"}
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
