import {
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AlertTriangle,
  BookOpen,
  Check,
  ChevronDown,
  Download,
  FileText,
  FileUp,
  Inbox,
  LockKeyhole,
  LogOut,
  Moon,
  MonitorSmartphone,
  Plus,
  Printer,
  RefreshCw,
  Search,
  Settings2,
  Shield,
  Sun,
  Trash2,
  Wifi,
} from "lucide-react";
import {
  addEntry,
  current,
  dateTime,
  deleteEntry,
  emptyFields,
  fieldsSchema,
  mergeJournals,
  needsFollowUp,
  numberLabel,
  overdue,
  reviseEntry,
  updateRadio,
  workspaceSchema,
  type Fields,
  type Journal,
  type Workspace,
} from "../shared/journal";
import { listValues, opsSchema, type Ops } from "../shared/ops";
import {
  KIND_INFO,
  addLink,
  edges as allEdges,
  items as allItems,
  parseRef,
  ref,
  type Module,
  type Ref,
} from "../shared/links";
import { mergeJournal } from "../shared/sync";
import { radioSummary, type Radio } from "../shared/radio";
import { closableBy, snooze } from "../shared/workflow";
import { demoWorkspace } from "./journal/demo";
import { useWorkspace } from "./journal/useWorkspace";
import { EntryForm } from "./journal/EntryForm";
import { EntryDetail } from "./journal/EntryDetail";
import { JournalSetup } from "./journal/JournalSetup";
import { Landing, type JoinRequest } from "./journal/Landing";
import { Modal } from "./journal/Modal";
import { Privacy } from "./journal/Privacy";
import { Handover } from "./journal/Handover";
import { ExportModal, ImportModal } from "./journal/Transfer";
import { ReportDialog } from "./journal/ReportDialog";
import { RadioView } from "./radio/RadioView";
import { AutoPrint, PrintPreview, type PrintJob } from "./print/PrintPreview";
import { Clock } from "./ui/Clock";
import { Brand } from "./ui/Mark";
import { Cosmos } from "./ui/Cosmos";
import { ClickSparks, useSpotlight } from "./ui/effects";
import { Dock } from "./ui/Dock";
import { Palette, type Command } from "./ui/Palette";
import { Popover } from "./ui/Popover";
import { ModuleHead } from "./ui/ModuleHead";
import { InstallHelp, useInstall } from "./ui/Install";
import { Ctx, type AppContext, type Graph } from "./app/context";
import { MODULE_IDS, moduleInfo } from "./app/modules";
import { usePrefs } from "./app/prefs";
import { SettingsDialog, type SettingsTab } from "./app/Settings";
import { useSync } from "./sync/useSync";
import { JournalView } from "./modules/journal/JournalView";
import { Situation } from "./modules/situation/Situation";
import { Messages } from "./modules/messages/Messages";
import { Missions } from "./modules/missions/Missions";
import { Resources } from "./modules/resources/Resources";
import { Team } from "./modules/team/Team";
import { Contacts } from "./modules/contacts/Contacts";
import { Weather } from "./modules/weather/Weather";
import { Agenda } from "./modules/agenda/Agenda";
import { Docs } from "./modules/docs/Docs";

const MapModule = lazy(() => import("./modules/map/MapModule"));
const NetworkModule = lazy(() => import("./modules/network/NetworkModule"));

type Dialog =
  | "create"
  | "export"
  | "import"
  | "privacy"
  | "handover"
  | "compose"
  | "deleted"
  | "report"
  | "install"
  | null;

const moduleFromHash = (): Module => {
  const hash = location.hash.slice(1);
  if (hash.startsWith("scan=")) return "radio";
  const [name] = hash.split("/");
  return (MODULE_IDS as string[]).includes(name) ? (name as Module) : "situation";
};
const scanFromHash = () => (location.hash.startsWith("#scan=") ? location.hash : "");
const joinFromHash = () =>
  location.hash.startsWith("#join=") ? decodeURIComponent(location.hash.slice(6)) : "";

export default function App() {
  const store = useWorkspace();
  const { workspace, setWorkspace } = store;
  const [prefs, setPrefs] = usePrefs();
  useSpotlight();
  const [module, setModule] = useState<Module>(moduleFromHash);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [settings, setSettings] = useState<SettingsTab | null>(null);
  const [palette, setPalette] = useState(false);
  const [docsTopic, setDocsTopic] = useState("start");
  const [entryId, setEntryId] = useState<string | null>(null);
  const [entryMode, setEntryMode] = useState<"view" | "edit" | "delete">("view");
  const [focus, setFocus] = useState<Ref | null>(null);
  const [print, setPrint] = useState<PrintJob | null>(null);
  const [autoQueue, setAutoQueue] = useState<PrintJob[]>([]);
  const [scan, setScan] = useState(scanFromHash);
  const [joinCode] = useState(joinFromHash);
  const [joining, setJoining] = useState<JoinRequest | null>(null);
  const [joinError, setJoinError] = useState("");
  const [closeOffer, setCloseOffer] = useState<{ receipt: string; ids: string[] } | null>(
    null,
  );
  const install = useInstall();
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
  const [menu, setMenu] = useState<{ kind: "journal" | "operator"; anchor: HTMLElement } | null>(
    null,
  );
  const search = useRef<HTMLInputElement>(null);
  const journal = workspace?.journals.find((j) => j.id === workspace.activeId);
  const latestJournal = useRef(journal);
  latestJournal.current = journal;
  const selected = journal?.entries.find((e) => e.id === entryId);
  const dirty = !!journal && backups[journal.id] !== JSON.stringify(journal);
  const draftExists = draft || !!workspace?.drafts?.[workspace.activeId];
  const hasDraft = useRef(draftExists);
  hasDraft.current = draftExists;

  // ---------- Live synchronisation ----------
  const code = workspace ? (workspace.room ?? null) : (joining?.code ?? null);
  const sync = useSync({
    code,
    workspace,
    author: workspace?.author ?? joining?.author ?? "",
    module,
    localTick: store.localTick,
    takeDirty: store.takeDirty,
    applyRemote: store.applyRemote,
    onJoin: async (remote) => {
      if (!joining || !remote.journals.length) return;
      const value: Workspace = {
        version: 1,
        author: joining.author,
        journals: remote.journals,
        activeId: remote.journals[0].id,
        gone: remote.gone && Object.keys(remote.gone).length ? remote.gone : undefined,
        room: joining.code,
      };
      try {
        if (joining.password) await store.startProtected(value, joining.password);
        else store.start(value);
        setJoining(null);
        setJoinError("");
        setToast("Session rejointe. Tout est synchronisé en direct.");
        history.replaceState(null, "", location.pathname);
      } catch (err) {
        setJoinError((err as Error).message);
        setJoining(null);
      }
    },
    onRemoteEntries: (journalId, ids) => {
      if (!prefs.autoPrintRemote) return;
      // The merged journal arrives on the next render: print from it then.
      setTimeout(() => {
        const source = latestJournal.current;
        if (!source || source.id !== journalId) return;
        const entries = source.entries.filter((e) => ids.includes(e.id));
        if (entries.length)
          setAutoQueue((q) => [...q, { kind: "messages", journal: source, entries }]);
      }, 300);
    },
  });

  // ---------- Browser plumbing ----------
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    const hash = () => {
      setModule(moduleFromHash());
      setScan(scanFromHash());
    };
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
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPalette((open) => !open);
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [module, journal?.id]);

  // ---------- Derived data ----------
  const graph = useMemo<Graph>(() => {
    if (!journal) return { items: [], byRef: new Map(), edges: [], degree: new Map() };
    const list = allItems(journal);
    const links = allEdges(journal);
    const degree = new Map<string, number>();
    for (const e of links) {
      degree.set(e.a, (degree.get(e.a) ?? 0) + 1);
      degree.set(e.b, (degree.get(e.b) ?? 0) + 1);
    }
    return { items: list, byRef: new Map(list.map((i) => [i.ref, i])), edges: links, degree };
  }, [journal]);
  const follow = journal?.entries.filter(needsFollowUp) ?? [];
  const late = follow.filter((e) => overdue(e, minute));
  const suggestions = useMemo(() => {
    if (!journal) return [];
    const seen = new Map<string, string>();
    const push = (value: string) => {
      const key = value.trim().toLocaleLowerCase("fr");
      if (key && !seen.has(key)) seen.set(key, value.trim());
    };
    journal.radio.stations.forEach((s) => push(s.callsign));
    journal.ops.cells.forEach((c) => push(c.name));
    listValues(journal.ops, "recipients").forEach(push);
    [...journal.entries].reverse().forEach((e) => {
      const f = current(e);
      push(f.source);
      push(f.recipient);
      push(f.assignee);
    });
    return [...seen.values()].slice(0, 400);
  }, [journal]);
  useEffect(() => {
    document.title = late.length ? `(${late.length}) orion aic` : "orion aic";
  }, [late.length]);

  // ---------- Actions ----------
  const go = useCallback((value: Module) => {
    history.replaceState(null, "", value === "situation" ? location.pathname : `#${value}`);
    setModule(value);
    setMenu(null);
  }, []);
  function discardDraft() {
    if (
      draftExists &&
      !window.confirm("Une entrée n’est pas encore consignée. Abandonner cette saisie ?")
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
  const updateJournal = useCallback(
    (value: Journal) =>
      setWorkspace((previous) =>
        previous
          ? workspaceSchema.parse({
              ...previous,
              journals: previous.journals.map((j) => (j.id === value.id ? value : j)),
            })
          : previous,
      ),
    [setWorkspace],
  );
  const updateOps = useCallback(
    (change: (ops: Ops) => Ops) => {
      const base = latestJournal.current;
      if (!base) return;
      if (base.closedAt) throw new Error("Ce journal est clôturé. Rouvrez-le pour modifier.");
      // Validate first: an invalid change is refused with its message.
      opsSchema.parse(change(base.ops));
      setWorkspace((previous) =>
        previous
          ? {
              ...previous,
              journals: previous.journals.map((j) =>
                j.id === previous.activeId ? { ...j, ops: opsSchema.parse(change(j.ops)) } : j,
              ),
            }
          : previous,
      );
    },
    [setWorkspace],
  );
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
      previous ? { ...previous, drafts: { ...previous.drafts, [journal.id]: fields } } : previous,
    );
  }
  function queueEntryPrint(j: Journal, entryIds: string[]) {
    const entries = j.entries.filter((e) => entryIds.includes(e.id));
    if (entries.length) setAutoQueue((q) => [...q, { kind: "messages", journal: j, entries }]);
  }
  function add(fields: Fields) {
    if (!journal || !workspace) return;
    const closable = closableBy(journal, fields);
    const updated = addEntry(journal, fields, workspace.author);
    const drafts = { ...workspace.drafts };
    delete drafts[journal.id];
    setWorkspace({
      ...workspace,
      drafts,
      journals: workspace.journals.map((j) => (j.id === journal.id ? updated : j)),
    });
    setDraft(false);
    setFormGeneration((value) => value + 1);
    const entry = updated.entries.at(-1)!;
    const receipt = numberLabel(entry);
    setToast(`Entrée ${receipt} consignée.${prefs.autoPrint ? " Impression lancée." : ""}`);
    setCloseOffer(closable.length ? { receipt, ids: closable.map((e) => e.id) } : null);
    if (prefs.autoPrint) queueEntryPrint(updated, [entry.id]);
  }
  const addEntryFrom = (partial: Partial<Fields>, links: Ref[] = []) => {
    const base = latestJournal.current;
    if (!base || !workspace) return null;
    const fields = fieldsSchema.parse({ ...emptyFields(), ...partial });
    const updated = addEntry(base, fields, workspace.author);
    const entry = updated.entries.at(-1)!;
    let ops = updated.ops;
    for (const l of links) ops = addLink(ops, ref("entry", entry.id), l, "", workspace.author);
    const next = { ...updated, ops };
    updateJournal(next);
    if (prefs.autoPrint) queueEntryPrint(next, [entry.id]);
    return entry.id;
  };
  function revise(id: string, change: Partial<Fields>, reason: string) {
    if (!journal || !workspace) return;
    const entry = journal.entries.find((e) => e.id === id);
    if (!entry) return;
    updateJournal(
      reviseEntry(journal, id, { ...current(entry), ...change }, workspace.author, reason),
    );
  }
  function snoozeEntry(id: string, minutes: number) {
    const entry = journal?.entries.find((e) => e.id === id);
    if (!entry) return;
    revise(id, { dueAt: snooze(current(entry).dueAt, minutes) }, `Échéance reportée de ${minutes} min`);
    setToast(`${numberLabel(entry)} : échéance reportée de ${minutes} min.`);
  }
  function closeEntries(ids: string[], reason: string) {
    if (!journal || !workspace) return;
    let value = journal;
    for (const id of ids) {
      const entry = value.entries.find((e) => e.id === id);
      if (entry)
        value = reviseEntry(
          value,
          id,
          { ...current(entry), status: "Terminé" },
          workspace.author,
          reason,
        );
    }
    updateJournal(value);
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
    else store.start({ version: 1, author, journals: [value], activeId: value.id });
    setDialog(null);
    setEntryId(null);
    go("situation");
  }
  function importJournal(value: Journal, merge: boolean, author?: string) {
    if (workspace && journal) {
      if (merge) {
        const merged = mergeJournals(journal, value);
        // Operational records follow the synchronisation rules.
        const combined = mergeJournal(journal, value);
        updateJournal({ ...merged, ops: combined.ops, sync: combined.sync });
      } else {
        const copy = {
          ...value,
          id: workspace.journals.some((j) => j.id === value.id) ? crypto.randomUUID() : value.id,
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
    setToast(merge ? "Entrées fusionnées." : "Journal importé.");
  }
  function compose(partial?: Partial<Fields>) {
    if (latestJournal.current?.closedAt) return;
    if (partial) {
      if (!discardDraft()) return;
      setPreset({ ...emptyFields(), ...partial });
      setDialog("compose");
      return;
    }
    if (module === "journal" && matchMedia("(min-width: 1200px)").matches)
      requestAnimationFrame(() => document.getElementById("quick-message")?.focus());
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
      setSettings(null);
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
  const openEntry = useCallback((id: string, mode: "view" | "edit" | "delete" = "view") => {
    setEntryMode(mode);
    setEntryId(id);
  }, []);
  const open = useCallback(
    (target: Ref) => {
      const { kind, id } = parseRef(target);
      if (kind === "entry") {
        openEntry(id);
        return;
      }
      go(KIND_INFO[kind].module);
      setFocus(target);
    },
    [go, openEntry],
  );
  const help = useCallback(
    (topic: string) => {
      setDocsTopic(topic);
      go("docs");
    },
    [go],
  );
  function switchJournal(id: string) {
    if (!journal || id === journal.id || !discardDraft()) return;
    setWorkspace((previous) => (previous ? { ...previous, activeId: id } : previous));
    setEntryId(null);
    setMenu(null);
  }
  function removeJournal() {
    if (!workspace || !journal) return;
    if (workspace.journals.length < 2) {
      setError("Une session garde au moins un journal. Utilisez Session → Effacer la session.");
      return;
    }
    if (
      window.prompt(
        `Retirer le journal « ${journal.title} » de la session (et des postes synchronisés) ? Exportez-le d’abord. Saisissez RETIRER.`,
      ) !== "RETIRER"
    )
      return;
    const rest = workspace.journals.filter((j) => j.id !== journal.id);
    const drafts = { ...workspace.drafts };
    delete drafts[journal.id];
    setWorkspace({ ...workspace, journals: rest, activeId: rest[0].id, drafts });
    setToast(`Journal « ${journal.title} » retiré.`);
  }

  // ---------- Not unlocked yet ----------
  if (store.loading)
    return (
      <div className="boot">
        <Cosmos />
        <Brand size={40} />
      </div>
    );
  if (!workspace || !journal)
    return (
      <>
        <Cosmos />
        <ClickSparks />
        <Landing
          stored={!!store.stored}
          joinCode={joinCode}
          joining={joining}
          syncStatus={sync.status}
          relayCount={sync.relayCount}
          onJoin={(request) => {
            setJoinError("");
            setJoining(request);
          }}
          onCancelJoin={() => setJoining(null)}
          onCreate={create}
          onDemo={() => store.start(demoWorkspace())}
          onImport={openImport}
          onPrivacy={() => setDialog("privacy")}
          onUnlock={store.unlock}
          onForget={store.forget}
          theme={prefs.theme}
          onTheme={() => setPrefs({ theme: prefs.theme === "light" ? "dark" : "light" })}
          error={joinError || store.error || sync.error}
        />
        {dialog === "import" && (
          <ImportModal onClose={() => setDialog(null)} onImport={importJournal} />
        )}
        {dialog === "privacy" && <Privacy onClose={() => setDialog(null)} />}
      </>
    );

  // ---------- Session open ----------
  const radio = radioSummary(journal.radio);
  const readOnly = !!journal.closedAt;
  const unread = journal.ops.messages.filter((m) => m.status === "Nouveau").length;
  const ctx: AppContext = {
    workspace,
    journal,
    author: workspace.author,
    readOnly,
    now: minute,
    graph,
    module,
    updateJournal,
    updateOps,
    lists: (name) => listValues(journal.ops, name),
    go,
    focus,
    setFocus,
    open,
    toast: setToast,
    print: setPrint,
    queuePrint: (job) => setAutoQueue((q) => [...q, job]),
    prefs,
    setPrefs,
    help,
    addEntry: addEntryFrom,
    compose,
    openEntry,
  };
  const commands: Command[] = [
    {
      id: "new-entry",
      label: "Nouvelle entrée au journal",
      icon: <Plus size={16} />,
      run: () => compose(),
      keywords: "consigner message journal",
    },
    {
      id: "new-message",
      label: "Nouveau message reçu",
      icon: <Inbox size={16} />,
      run: () => {
        go("messages");
        setFocus("message:new" as Ref);
      },
      keywords: "réception synthèse",
    },
    {
      id: "report",
      label: "Rapport de situation A4",
      icon: <FileText size={16} />,
      run: () => setDialog("report"),
    },
    {
      id: "export",
      label: "Exporter le journal",
      icon: <Download size={16} />,
      run: () => setDialog("export"),
      keywords: "archive pdf excel word",
    },
    {
      id: "import",
      label: "Importer un fichier",
      icon: <FileUp size={16} />,
      run: openImport,
    },
    {
      id: "sync",
      label: "Synchroniser avec d’autres postes",
      icon: <Wifi size={16} />,
      run: () => setSettings("sync"),
      keywords: "partager session code qr réseau",
    },
    {
      id: "print-toggle",
      label: prefs.autoPrint
        ? "Désactiver l’impression automatique"
        : "Activer l’impression automatique",
      icon: <Printer size={16} />,
      run: () => setPrefs({ autoPrint: !prefs.autoPrint }),
    },
    {
      id: "theme",
      label: prefs.theme === "light" ? "Thème sombre" : "Thème clair",
      icon: prefs.theme === "light" ? <Moon size={16} /> : <Sun size={16} />,
      run: () => setPrefs({ theme: prefs.theme === "light" ? "dark" : "light" }),
    },
    {
      id: "settings",
      label: "Réglages et référentiels",
      icon: <Settings2 size={16} />,
      run: () => setSettings("post"),
      keywords: "listes standards destinataires modules",
    },
    {
      id: "new-journal",
      label: "Nouveau journal dans la session",
      icon: <BookOpen size={16} />,
      run: () => {
        if (discardDraft()) setDialog("create");
      },
    },
  ];
  const info = moduleInfo(module);
  const peersShown = sync.peers.slice(0, 4);
  return (
    <Ctx.Provider value={ctx}>
      <Cosmos />
      <ClickSparks />
      <div className="app">
        <a href="#main" className="skip-link">
          Aller au contenu
        </a>
        <Dock
          current={module}
          hidden={prefs.hidden}
          onGo={go}
          onLogo={() => go("situation")}
          badges={{
            journal: { value: late.length },
            messages: { value: unread, tone: "accent" },
          }}
        />
        <div className="app-main">
          <header className="bar">
            <Brand />
            <button
              className="journal-switch"
              onClick={(e) => setMenu({ kind: "journal", anchor: e.currentTarget })}
              title="Journaux de la session"
            >
              <span className={`state-dot ${journal.closedAt ? "closed" : ""}`} />
              <strong>{journal.title}</strong>
              <small>{journal.mode}</small>
              <ChevronDown size={14} />
            </button>
            <button className="command-trigger" onClick={() => setPalette(true)}>
              <Search size={15} />
              <span>
                Rechercher ou agir<span className="wide">… partout</span>
              </span>
              <kbd>⌘K</kbd>
            </button>
            <div className="bar-status">
              <button
                className={`status-chip ${sync.status === "live" ? "live" : sync.status === "retrying" ? "warn" : ""}`}
                onClick={() => setSettings("sync")}
                title={
                  sync.status === "off"
                    ? "Synchronisation désactivée : partager la session avec d’autres postes"
                    : `Synchronisation ${sync.status === "live" ? "active" : "en reconnexion"} · ${sync.relayCount} autre(s) poste(s)`
                }
              >
                <span className={`radar ${sync.status === "live" ? "" : "idle"}`} />
                {sync.status === "off"
                  ? "Seul"
                  : sync.status === "live"
                    ? `${sync.relayCount + 1} poste${sync.relayCount ? "s" : ""}`
                    : "Reconnexion"}
                {peersShown.length > 0 && (
                  <span className="avatars">
                    {peersShown.map((p) => (
                      <span
                        key={p.peer}
                        title={`${p.name} · ${moduleInfo(p.module).short}`}
                        style={{ ["--h" as string]: (p.name.charCodeAt(0) * 47) % 360 }}
                      >
                        {p.name.slice(0, 2).toUpperCase()}
                      </span>
                    ))}
                  </span>
                )}
              </button>
              <span
                className={`status-chip hide-narrow ${store.saveState === "error" ? "crit" : store.persistent ? "ok" : "warn"}`}
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
                      ? "Chiffré"
                      : "Temporaire"}
              </span>
              {!online && (
                <span className="status-chip warn hide-narrow" title="Hors ligne">
                  <span className="dot" />
                  Hors ligne
                </span>
              )}
              <Clock />
              <button
                className="icon-button"
                onClick={() => setPrefs({ theme: prefs.theme === "light" ? "dark" : "light" })}
                aria-label={prefs.theme === "light" ? "Thème sombre" : "Thème clair"}
                title={prefs.theme === "light" ? "Thème sombre" : "Thème clair"}
              >
                {prefs.theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
              </button>
              <button
                className="operator"
                onClick={(e) => setMenu({ kind: "operator", anchor: e.currentTarget })}
                title="Opérateur, réglages et session"
              >
                <span className="avatar">{workspace.author.slice(0, 2).toUpperCase()}</span>
                <span className="operator-name">{workspace.author}</span>
              </button>
            </div>
          </header>
          <main id="main" className="main">
            {updateReady && (
              <div className="banner info" role="status">
                <RefreshCw size={15} />
                <span>Nouvelle version d’orion aic disponible.</span>
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
            {(error || store.error || sync.error) && (
              <div className="banner crit" role="alert">
                <AlertTriangle size={15} />
                <span>{error || store.error || sync.error}</span>
                {error ? (
                  <button className="link" onClick={() => setError("")}>
                    Fermer
                  </button>
                ) : (
                  <button className="link" onClick={() => setDialog("export")}>
                    Exporter une copie
                  </button>
                )}
              </div>
            )}
            <div className="module reveal" key={`${module}-${journal.id}`} data-module={info.id}>
              <Suspense
                fallback={
                  <div className="empty-state">
                    <div className="orbit" />
                    <p>Chargement…</p>
                  </div>
                }
              >
                {module === "journal" ? (
                  <JournalView
                    formGeneration={formGeneration}
                    draft={workspace.drafts?.[journal.id]}
                    draftLabel={
                      workspace.drafts?.[journal.id]?.message
                        ? store.persistent
                          ? "Brouillon sauvegardé"
                          : "Brouillon non sauvegardé"
                        : ""
                    }
                    suggestions={suggestions}
                    onDraft={saveDraft}
                    onAdd={add}
                    onDialog={(d) => (d === "settings" ? setSettings("session") : setDialog(d))}
                    dirty={dirty}
                    closeOffer={closeOffer}
                    onCloseOffer={(accept) => {
                      if (accept && closeOffer) {
                        closeEntries(closeOffer.ids, `Clos par la quittance ${closeOffer.receipt}`);
                        setToast("Suivi terminé.");
                      }
                      setCloseOffer(null);
                    }}
                    onCloseEntries={closeEntries}
                    onSnooze={snoozeEntry}
                    searchRef={search}
                  />
                ) : module === "radio" ? (
                  <>
                    <ModuleHead
                      actions={
                        <button
                          onClick={() =>
                            setPrint({ kind: "radio", journal, author: workspace.author })
                          }
                        >
                          <FileText size={14} />
                          Plan A4
                        </button>
                      }
                    />
                    <RadioView
                      journal={journal}
                      author={workspace.author}
                      readOnly={readOnly}
                      at={minute}
                      onSave={saveRadio}
                      onError={setError}
                      onPrint={(terminalId, assignmentId) =>
                        setPrint({ kind: "handout", journal, terminalId, assignmentId })
                      }
                      onLabels={() => setPrint({ kind: "labels", journal })}
                      scan={scan}
                      onScanHandled={() => {
                        setScan("");
                        if (location.hash.startsWith("#scan="))
                          history.replaceState(null, "", "#radio");
                      }}
                    />
                  </>
                ) : module === "situation" ? (
                  <Situation />
                ) : module === "messages" ? (
                  <Messages />
                ) : module === "missions" ? (
                  <Missions />
                ) : module === "map" ? (
                  <MapModule />
                ) : module === "resources" ? (
                  <Resources />
                ) : module === "team" ? (
                  <Team />
                ) : module === "contacts" ? (
                  <Contacts />
                ) : module === "weather" ? (
                  <Weather />
                ) : module === "agenda" ? (
                  <Agenda />
                ) : module === "network" ? (
                  <NetworkModule />
                ) : (
                  <Docs topic={docsTopic} />
                )}
              </Suspense>
            </div>
          </main>
        </div>
      </div>
      {module === "journal" && !readOnly && (
        <button className="fab" onClick={() => compose()} aria-label="Nouvelle entrée">
          <Plus size={22} />
        </button>
      )}
      {toast && (
        <div className="toast" role="status">
          <Check size={14} />
          {toast}
        </div>
      )}
      {palette && <Palette commands={commands} onClose={() => setPalette(false)} />}
      {menu?.kind === "journal" && (
        <Popover anchor={menu.anchor} onClose={() => setMenu(null)}>
          <div className="menu-label">Journaux de la session</div>
          {workspace.journals.map((j) => (
            <button
              key={j.id}
              aria-current={j.id === journal.id ? "true" : undefined}
              onClick={() => switchJournal(j.id)}
            >
              <BookOpen size={15} />
              <span>
                {j.title}
                <small>
                  {j.closedAt ? "Clôturé" : j.mode} · {j.entries.length} entrées ·{" "}
                  {j.ops.messages.length} messages
                </small>
              </span>
            </button>
          ))}
          <hr />
          <button
            data-close
            onClick={() => {
              if (discardDraft()) setDialog("create");
            }}
          >
            <Plus size={15} />
            Nouveau journal
          </button>
          <button data-close onClick={openImport}>
            <FileUp size={15} />
            Importer un fichier
          </button>
          <button data-close onClick={() => setDialog("export")}>
            <Download size={15} />
            Exporter ce journal
            {dirty && <span className="pill warn">à faire</span>}
          </button>
          <button data-close onClick={() => setSettings("session")}>
            <Settings2 size={15} />
            Propriétés, clôture
          </button>
          <button data-close onClick={removeJournal}>
            <Trash2 size={15} />
            Retirer ce journal de la session
          </button>
        </Popover>
      )}
      {menu?.kind === "operator" && (
        <Popover anchor={menu.anchor} onClose={() => setMenu(null)} align="end">
          <div className="menu-label">{workspace.author}</div>
          <button data-close onClick={() => setSettings("post")}>
            <Settings2 size={15} />
            <span>
              Réglages du poste
              <small>Thème, modules, impression automatique</small>
            </span>
          </button>
          <button data-close onClick={() => setSettings("lists")}>
            <BookOpen size={15} />
            <span>
              Référentiels
              <small>Destinataires, catégories, grades… standards</small>
            </span>
          </button>
          <button data-close onClick={() => setSettings("sync")}>
            <Wifi size={15} />
            <span>
              Synchronisation
              <small>Travailler à plusieurs postes sur la même session</small>
            </span>
          </button>
          <button data-close onClick={() => setSettings("session")}>
            <LockKeyhole size={15} />
            <span>
              Session et sauvegarde
              <small>Opérateur, phrase de récupération, fin de session</small>
            </span>
          </button>
          <hr />
          <button data-close onClick={() => setDialog("privacy")}>
            <Shield size={15} />
            Sécurité et données
          </button>
          {!install.installed && (
            <button
              data-close
              onClick={() => (install.install ? void install.install() : setDialog("install"))}
            >
              <MonitorSmartphone size={15} />
              Installer l’application
            </button>
          )}
          <a className="menu-link" href="/source/orion-aic-source.tar.gz" download>
            <Download size={15} />
            Code source · AGPL-3.0
          </a>
          <hr />
          <button data-close onClick={() => void closeSession()}>
            {store.persistent ? <LockKeyhole size={15} /> : <LogOut size={15} />}
            {store.persistent ? "Verrouiller" : "Fermer la session"}
          </button>
          <div className="menu-label">
            orion aic 2.0 · {offlineReady ? "hors ligne prêt" : online ? "en ligne" : "hors ligne"}{" "}
            · {radio.issued}/{radio.terminals} radios
          </div>
        </Popover>
      )}
      {selected && (
        <EntryDetail
          key={`${selected.id}-${entryMode}`}
          entry={selected}
          mode={entryMode}
          entries={journal.entries}
          onOpen={(id) => openEntry(id)}
          onSnooze={(minutes) => snoozeEntry(selected.id, minutes)}
          onDelete={(reason) => {
            updateJournal(deleteEntry(journal, selected.id, workspace.author, reason));
            setEntryId(null);
            setToast(`Entrée ${numberLabel(selected)} supprimée.`);
          }}
          author={workspace.author}
          readOnly={readOnly}
          onClose={() => setEntryId(null)}
          onPrint={() => {
            setEntryId(null);
            setPrint({ kind: "messages", journal, entries: [selected] });
          }}
          onRevise={(fields, reason) => {
            updateJournal(reviseEntry(journal, selected.id, fields, workspace.author, reason));
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
      {print && (
        <PrintPreview
          job={{
            ...print,
            journal: workspace.journals.find((j) => j.id === print.journal.id) ?? print.journal,
          }}
          onClose={() => setPrint(null)}
        />
      )}
      <AutoPrint
        queue={autoQueue}
        paused={!!print}
        onDone={() => setAutoQueue((q) => q.slice(1))}
      />
      {settings && (
        <SettingsDialog
          tab={settings}
          onTab={setSettings}
          onClose={() => setSettings(null)}
          persistent={store.persistent}
          stored={!!store.stored}
          onProtect={store.protect}
          onUpdateWorkspace={(value) => setWorkspace(workspaceSchema.parse(value))}
          onJournal={(value) => {
            const reopened = { ...journal, closedAt: "" };
            const noted = addEntry(
              reopened,
              {
                ...emptyFields(),
                type: "Observation",
                message: value.closedAt ? "Clôture du journal." : "Réouverture du journal.",
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
                `Exportez d’abord une archive orion aic ou JSON de chaque journal (${unexported.length} restant${unexported.length > 1 ? "s" : ""}).`,
              );
            if (
              window.prompt(
                "Archives vérifiées ? Saisissez TERMINER pour effacer la session de ce poste.",
              ) === "TERMINER"
            ) {
              await store.finish();
              setSettings(null);
              setBackups({});
              setError("");
              setToast("Session effacée de ce poste.");
            }
          }}
          onExport={() => setDialog("export")}
          sync={sync}
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
          author={workspace.author}
          onClose={() => setDialog(null)}
          onBackup={() =>
            setBackups((prev) => ({ ...prev, [journal.id]: JSON.stringify(journal) }))
          }
        />
      )}
      {dialog === "import" && (
        <ImportModal target={journal} onClose={() => setDialog(null)} onImport={importJournal} />
      )}
      {dialog === "privacy" && <Privacy onClose={() => setDialog(null)} />}
      {dialog === "report" && (
        <ReportDialog
          journal={journal}
          onClose={() => setDialog(null)}
          onPreview={(range) => {
            setDialog(null);
            setPrint({ kind: "report", journal, author: workspace.author, range });
          }}
        />
      )}
      {dialog === "install" && <InstallHelp onClose={() => setDialog(null)} />}
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
          title={preset?.type === "Relève" ? "Consigner la relève" : "Nouvelle entrée"}
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
              suggestions={suggestions}
              onSave={(fields) => {
                add(fields);
                setDialog(null);
                setPreset(undefined);
              }}
            />
          </div>
        </Modal>
      )}
    </Ctx.Provider>
  );
}
