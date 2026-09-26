import {
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AlertTriangle, FileText, Plus, RefreshCw } from "lucide-react";
import {
  current,
  emptyFields,
  mergeJournals,
  needsFollowUp,
  numberLabel,
  overdue,
  workspaceSchema,
  type Fields,
  type Journal,
  type Workspace,
} from "../shared/journal";
import { listValues } from "../shared/ops";
import { KIND_INFO, parseRef, type Module, type Ref } from "../shared/links";
import { mergeJournal } from "../shared/sync";
import { radioSummary } from "../shared/radio";
import { demoWorkspace } from "./journal/demo";
import { useWorkspace } from "./journal/useWorkspace";
import { Landing, type JoinRequest } from "./journal/Landing";
import { Privacy } from "./journal/Privacy";
import { ImportModal } from "./journal/Transfer";
import { RadioView } from "./radio/RadioView";
import { AutoPrint, type PrintJob } from "./print/PrintPreview";
import { Brand } from "./ui/Mark";
import { Cosmos } from "./ui/Cosmos";
import { ClickSparks, useSpotlight } from "./ui/effects";
import { Dock } from "./ui/Dock";
import { Palette } from "./ui/Palette";
import { ModuleHead } from "./ui/ModuleHead";
import { Toast, type ToastMessage } from "./ui/Toast";
import { useInstall } from "./ui/Install";
import {
  Ctx,
  type AppContext,
  type ExportPreset,
  type Graph,
} from "./app/context";
import { MODULE_IDS, moduleInfo } from "./app/modules";
import { usePrefs } from "./app/prefs";
import { buildCommands } from "./app/commands";
import { useShortcuts } from "./app/useShortcuts";
import { useOverlays } from "./app/overlays";
import { useJournalActions } from "./app/useJournalActions";
import { useDrafts } from "./app/useDrafts";
import { TopBar } from "./app/TopBar";
import { JournalMenu, OperatorMenu } from "./app/ShellMenus";
import { OverlayHost } from "./app/OverlayHost";
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
import { MyTasks } from "./modules/tasks/MyTasks";
import { Orders } from "./modules/orders/Orders";
import { ConductLayer } from "./post/ConductLayer";
import { identityOf } from "./post/roles";
import { taskBadge } from "../shared/diffusion";
import { TimeBar } from "./timeline/TimeBar";
import { usePastJournal } from "./timeline/replay";
import { edges as allEdges, items as allItems } from "../shared/links";

const MapModule = lazy(() => import("./modules/map/MapModule"));
const NetworkModule = lazy(() => import("./modules/network/NetworkModule"));
const PresentationMode = lazy(() => import("./present/Presentation"));
const Trace = lazy(() =>
  import("./modules/trace/Trace").then((m) => ({ default: m.Trace })),
);
const ExportCenter = lazy(() =>
  import("./export/ExportCenter").then((m) => ({ default: m.ExportCenter })),
);

const DISCARD_DRAFT =
  "Une entrée n’est pas encore consignée. Abandonner cette saisie ?";

const moduleFromHash = (): Module => {
  const hash = location.hash.slice(1);
  if (hash.startsWith("scan=")) return "radio";
  const [name] = hash.split("/");
  return (MODULE_IDS as string[]).includes(name)
    ? (name as Module)
    : "situation";
};
const scanFromHash = () =>
  location.hash.startsWith("#scan=") ? location.hash : "";
const joinFromHash = () =>
  location.hash.startsWith("#join=")
    ? decodeURIComponent(location.hash.slice(6))
    : "";

export default function App() {
  const store = useWorkspace();
  const { workspace, setWorkspace } = store;
  const [prefs, setPrefs] = usePrefs();
  useSpotlight();
  const [module, setModule] = useState<Module>(moduleFromHash);
  const [docsTopic, setDocsTopic] = useState("start");
  const [focus, setFocus] = useState<Ref | null>(null);
  // Time machine: moment shown (ms), null = live.
  const [viewAt, setViewAt] = useState<number | null>(null);
  const overlays = useOverlays();
  const [autoQueue, setAutoQueue] = useState<PrintJob[]>([]);
  const [scan, setScan] = useState(scanFromHash);
  const [joinCode] = useState(joinFromHash);
  const [joining, setJoining] = useState<JoinRequest | null>(null);
  const [joinError, setJoinError] = useState("");
  const [closeOffer, setCloseOffer] = useState<{
    receipt: string;
    ids: string[];
  } | null>(null);
  const install = useInstall();
  const [online, setOnline] = useState(navigator.onLine);
  const [offlineReady, setOfflineReady] = useState(false);
  const [updateReady, setUpdateReady] = useState(false);
  const [minute, setMinute] = useState(Date.now());
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [error, setError] = useState("");
  const [formGeneration, setFormGeneration] = useState(0);
  // Journal version last exported, by journal id (compared by reference).
  const [backups, setBackups] = useState<Record<string, Journal>>({});
  const search = useRef<HTMLInputElement>(null);
  const journal = workspace?.journals.find((j) => j.id === workspace.activeId);
  // What the modules show: the live journal or its version at viewAt.
  const shown = usePastJournal(journal, viewAt);
  const latestJournal = useRef(journal);
  latestJournal.current = journal;
  const moduleRef = useRef(module);
  moduleRef.current = module;
  const prefsRef = useRef(prefs);
  prefsRef.current = prefs;
  const dirty = !!journal && backups[journal.id] !== journal;

  const notify = useCallback(
    (text: string) => setToast(text ? { text, id: Date.now() } : null),
    [],
  );
  const refuse = useCallback(
    (text: string) => setToast({ text, id: Date.now(), tone: "info" }),
    [],
  );
  const actions = useJournalActions({
    workspace,
    setWorkspace,
    viewAt,
    toast: notify,
    refuse,
  });
  const drafts = useDrafts({ workspace, setWorkspace });
  const draftExists = () => {
    const j = latestJournal.current;
    return drafts.typing || (!!j && !!drafts.get(j.id));
  };
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
        gone:
          remote.gone && Object.keys(remote.gone).length
            ? remote.gone
            : undefined,
        room: joining.code,
      };
      try {
        if (joining.password)
          await store.startProtected(value, joining.password);
        else store.start(value);
        setJoining(null);
        setJoinError("");
        notify("Session rejointe. Tout est synchronisé en direct.");
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
          setAutoQueue((q) => [
            ...q,
            { kind: "messages", journal: source, entries },
          ]);
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
    const before = (e: BeforeUnloadEvent) => {
      if (hasDraft.current() && !store.persistent) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", before);
    return () => window.removeEventListener("beforeunload", before);
  }, [store.persistent]);
  const paletteOpen = overlays.get("palette") !== undefined;
  useShortcuts({
    palette: paletteOpen,
    onPalette: (open) =>
      open ? overlays.open({ kind: "palette" }) : overlays.close("palette"),
  });
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [module, journal?.id]);

  // ---------- Derived data ----------
  const graph = useMemo<Graph>(() => {
    if (!shown)
      return { items: [], byRef: new Map(), edges: [], degree: new Map() };
    const list = allItems(shown);
    const links = allEdges(shown);
    const degree = new Map<string, number>();
    for (const e of links) {
      degree.set(e.a, (degree.get(e.a) ?? 0) + 1);
      degree.set(e.b, (degree.get(e.b) ?? 0) + 1);
    }
    return {
      items: list,
      byRef: new Map(list.map((i) => [i.ref, i])),
      edges: links,
      degree,
    };
  }, [shown]);
  const follow = useMemo(
    () => journal?.entries.filter(needsFollowUp) ?? [],
    [journal?.entries],
  );
  const late = useMemo(
    () => follow.filter((e) => overdue(e, minute)),
    [follow, minute],
  );
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
  // The page title (count of what needs attention) is set by ConductLayer.

  // ---------- Navigation ----------
  const go = useCallback(
    (value: Module) => {
      history.replaceState(
        null,
        "",
        value === "situation" ? location.pathname : `#${value}`,
      );
      setModule(value);
      overlays.close("menu");
    },
    [overlays.close],
  );
  const openEntry = useCallback(
    (id: string, mode: "view" | "edit" | "delete" = "view") =>
      overlays.open({ kind: "entry", id, mode }),
    [overlays.open],
  );
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
  const exportCenter = useCallback(
    (preset: ExportPreset = {}) =>
      overlays.open({ kind: "dialog", name: "export", preset }),
    [overlays.open],
  );
  const print = useCallback(
    (job: PrintJob) => overlays.open({ kind: "print", job }),
    [overlays.open],
  );
  const queuePrint = useCallback(
    (job: PrintJob) => setAutoQueue((q) => [...q, job]),
    [],
  );
  const present = useCallback(
    (mode: "present" | "wall" = "present", preset?: ExportPreset) =>
      overlays.open({ kind: "present", mode, preset }),
    [overlays.open],
  );
  const trace = useCallback(
    (target: string) => overlays.open({ kind: "trace", target }),
    [overlays.open],
  );
  const toggleTheme = useCallback(
    () =>
      setPrefs({
        theme: prefsRef.current.theme === "light" ? "dark" : "light",
      }),
    [setPrefs],
  );

  // ---------- Drafts and entries ----------
  /** Asks before losing an entry being typed; clears it when confirmed. */
  const discardDraft = useCallback(() => {
    if (hasDraft.current() && !window.confirm(DISCARD_DRAFT)) return false;
    const j = latestJournal.current;
    if (j) drafts.clear(j.id);
    drafts.setTyping(false);
    setFormGeneration((value) => value + 1);
    return true;
  }, [drafts]);
  const saveDraft = useCallback(
    (fields: Fields) => {
      const j = latestJournal.current;
      if (j) drafts.save(j.id, fields);
    },
    [drafts],
  );
  function queueEntryPrint(j: Journal, entryIds: string[]) {
    const entries = j.entries.filter((e) => entryIds.includes(e.id));
    if (entries.length) queuePrint({ kind: "messages", journal: j, entries });
  }
  /** The entry form was submitted. */
  function add(fields: Fields) {
    const done = actions.consign(fields);
    if (!done) return false;
    drafts.clear(done.journal.id);
    setFormGeneration((value) => value + 1);
    const receipt = numberLabel(done.entry);
    notify(
      `Entrée ${receipt} consignée.${prefs.autoPrint ? " Impression lancée." : ""}`,
    );
    setCloseOffer(
      done.closable.length ? { receipt, ids: done.closable } : null,
    );
    if (prefs.autoPrint) queueEntryPrint(done.journal, [done.entry.id]);
    return true;
  }
  const addEntry = useCallback(
    (partial: Partial<Fields>, links: Ref[] = []) => {
      const id = actions.addEntry(partial, links);
      if (id && prefsRef.current.autoPrint)
        setTimeout(() => {
          const latest = latestJournal.current;
          const entries = latest?.entries.filter((e) => e.id === id) ?? [];
          if (latest && entries.length)
            queuePrint({ kind: "messages", journal: latest, entries });
        }, 80);
      return id;
    },
    [actions, queuePrint],
  );
  /** Open the entry form (prefilled), or explain why writing is refused. */
  const compose = useCallback(
    (partial?: Partial<Fields>) => {
      if (!actions.gate()) return;
      if (partial) {
        if (!discardDraft()) return;
        overlays.open({
          kind: "dialog",
          name: "compose",
          preset: { ...emptyFields(), ...partial },
        });
        return;
      }
      if (
        moduleRef.current === "journal" &&
        matchMedia("(min-width: 1200px)").matches
      )
        requestAnimationFrame(() =>
          document.getElementById("quick-message")?.focus(),
        );
      else overlays.open({ kind: "dialog", name: "compose" });
    },
    [actions, discardDraft, overlays.open],
  );

  // ---------- Session and journals ----------
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
    overlays.closeAll();
    go("situation");
  }
  function importJournal(value: Journal, merge: boolean, author?: string) {
    if (workspace && journal) {
      if (merge) {
        const merged = mergeJournals(journal, value);
        // Operational records follow the synchronisation rules.
        const combined = mergeJournal(journal, value);
        if (
          !actions.updateJournal({
            ...merged,
            ops: combined.ops,
            sync: combined.sync,
            history: combined.history,
            blobs: combined.blobs,
          })
        )
          return;
      } else {
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
    notify(merge ? "Entrées fusionnées." : "Journal importé.");
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
    drafts.flush();
    try {
      await store.close();
      overlays.closeAll();
      setBackups({});
      drafts.setTyping(false);
      setToast(null);
    } catch (err) {
      setError((err as Error).message);
    }
  }
  const openImport = () => {
    if (discardDraft()) overlays.open({ kind: "dialog", name: "import" });
  };
  const newJournal = () => {
    if (discardDraft()) overlays.open({ kind: "dialog", name: "create" });
  };
  function switchJournal(id: string) {
    if (!journal || id === journal.id || !discardDraft()) return;
    drafts.flush();
    setWorkspace((previous) =>
      previous ? { ...previous, activeId: id } : previous,
    );
    setViewAt(null);
    overlays.closeAll();
  }
  function removeJournal() {
    if (!workspace || !journal) return;
    if (workspace.journals.length < 2) {
      setError(
        "Une session garde au moins un journal. Utilisez Session → Effacer la session.",
      );
      return;
    }
    if (
      window.prompt(
        `Retirer le journal « ${journal.title} » de la session (et des postes synchronisés) ? Exportez-le d’abord. Saisissez RETIRER.`,
      ) !== "RETIRER"
    ) {
      refuse("Journal conservé : saisissez RETIRER pour le retirer.");
      return;
    }
    const rest = workspace.journals.filter((j) => j.id !== journal.id);
    const kept = { ...workspace.drafts };
    delete kept[journal.id];
    setWorkspace({
      ...workspace,
      journals: rest,
      activeId: rest[0].id,
      drafts: kept,
    });
    notify(`Journal « ${journal.title} » retiré.`);
  }

  // ---------- Shared context (memoised: modules re-render on real changes) ----------
  const view = shown ?? journal;
  const readOnly = !!journal?.closedAt || viewAt !== null;
  const viewOps = view?.ops;
  const lists = useCallback(
    (name: string) => (viewOps ? listValues(viewOps, name) : []),
    [viewOps],
  );
  const ctx = useMemo<AppContext | null>(
    () =>
      workspace && journal && view
        ? {
            workspace,
            journal: view,
            live: journal,
            author: workspace.author,
            readOnly,
            canWrite: actions.gate,
            viewAt,
            setViewAt,
            trace,
            record: actions.record,
            exportCenter,
            present,
            now: viewAt ?? minute,
            graph,
            module,
            updateJournal: actions.updateJournal,
            updateOps: actions.updateOps,
            lists,
            go,
            focus,
            setFocus,
            open,
            toast: notify,
            print,
            queuePrint,
            prefs,
            setPrefs,
            help,
            addEntry,
            compose,
            openEntry,
          }
        : null,
    [
      workspace,
      journal,
      view,
      readOnly,
      viewAt,
      trace,
      actions,
      exportCenter,
      present,
      minute,
      graph,
      module,
      lists,
      go,
      focus,
      open,
      notify,
      print,
      queuePrint,
      prefs,
      setPrefs,
      help,
      addEntry,
      compose,
      openEntry,
    ],
  );

  // ---------- Not unlocked yet ----------
  if (store.loading)
    return (
      <div className="boot">
        <Cosmos />
        <Brand size={40} />
      </div>
    );
  const dialog = overlays.get("dialog");
  if (!workspace || !journal || !ctx || !view)
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
          onPrivacy={() => overlays.open({ kind: "dialog", name: "privacy" })}
          onUnlock={store.unlock}
          onForget={store.forget}
          theme={prefs.theme}
          onTheme={toggleTheme}
          error={joinError || store.error || sync.error}
        />
        {dialog?.name === "import" && (
          <ImportModal
            onClose={() => overlays.close("dialog")}
            onImport={importJournal}
          />
        )}
        {dialog?.name === "privacy" && (
          <Privacy onClose={() => overlays.close("dialog")} />
        )}
        <Toast message={toast} onDone={() => setToast(null)} />
      </>
    );

  // ---------- Session open ----------
  const radio = radioSummary(journal.radio);
  const unread = journal.ops.messages.filter(
    (m) => m.status === "Nouveau",
  ).length;
  const info = moduleInfo(module);
  const menu = overlays.get("menu");
  const draft = drafts.get(journal.id);
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
            tasks: {
              value: taskBadge(
                journal,
                identityOf(journal, workspace.author),
                minute,
              ),
            },
          }}
        />
        <div className="app-main">
          <TopBar
            journal={journal}
            author={workspace.author}
            sync={sync}
            saveState={store.saveState}
            persistent={store.persistent}
            online={online}
            viewAt={viewAt}
            theme={prefs.theme}
            onJournalMenu={(anchor) =>
              overlays.open({ kind: "menu", menu: "journal", anchor })
            }
            onOperatorMenu={(anchor) =>
              overlays.open({ kind: "menu", menu: "operator", anchor })
            }
            onPalette={() => overlays.open({ kind: "palette" })}
            onSync={() => overlays.open({ kind: "settings", tab: "sync" })}
            onTimeMachine={() => setViewAt(viewAt === null ? Date.now() : null)}
            onPresent={() => present("present")}
            onTheme={toggleTheme}
          />
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
                  <button className="link" onClick={() => exportCenter()}>
                    Exporter une copie
                  </button>
                )}
              </div>
            )}
            <ConductLayer />
            <div
              className="module reveal"
              key={`${module}-${journal.id}`}
              data-module={info.id}
            >
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
                    draft={draft}
                    draftLabel={
                      draft?.message
                        ? store.persistent
                          ? "Brouillon sauvegardé"
                          : "Brouillon non sauvegardé"
                        : ""
                    }
                    suggestions={suggestions}
                    onDraft={saveDraft}
                    onAdd={add}
                    onDialog={(d) =>
                      d === "settings"
                        ? overlays.open({ kind: "settings", tab: "session" })
                        : d === "export"
                          ? exportCenter()
                          : overlays.open({ kind: "dialog", name: d })
                    }
                    dirty={dirty}
                    closeOffer={closeOffer}
                    onCloseOffer={(accept) => {
                      if (
                        accept &&
                        closeOffer &&
                        actions.closeEntries(
                          closeOffer.ids,
                          `Clos par la quittance ${closeOffer.receipt}`,
                        )
                      )
                        notify("Suivi terminé.");
                      setCloseOffer(null);
                    }}
                    onCloseEntries={actions.closeEntries}
                    onSnooze={actions.snoozeEntry}
                    searchRef={search}
                  />
                ) : module === "radio" ? (
                  <>
                    <ModuleHead
                      actions={
                        <button
                          onClick={() =>
                            print({
                              kind: "radio",
                              journal,
                              author: workspace.author,
                            })
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
                      onSave={actions.saveRadio}
                      onError={setError}
                      onPrint={(terminalId, assignmentId) =>
                        print({
                          kind: "handout",
                          journal,
                          terminalId,
                          assignmentId,
                        })
                      }
                      onLabels={() => print({ kind: "labels", journal })}
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
                ) : module === "trace" ? (
                  <Trace />
                ) : module === "tasks" ? (
                  <MyTasks />
                ) : module === "orders" ? (
                  <Orders />
                ) : (
                  <Docs topic={docsTopic} />
                )}
              </Suspense>
            </div>
          </main>
        </div>
      </div>
      {module === "journal" && !readOnly && (
        <button
          className="fab"
          onClick={() => compose()}
          aria-label="Nouvelle entrée"
        >
          <Plus size={22} />
        </button>
      )}
      {paletteOpen && (
        <Palette
          commands={buildCommands({
            viewAt,
            prefs,
            setPrefs,
            setViewAt,
            compose: () => compose(),
            go,
            setFocus,
            open: overlays.open,
            exportCenter,
            openImport,
            newJournal,
          })}
          onClose={() => overlays.close("palette")}
        />
      )}
      {menu?.menu === "journal" && (
        <JournalMenu
          anchor={menu.anchor}
          workspace={workspace}
          journal={journal}
          dirty={dirty}
          onClose={() => overlays.close("menu")}
          onSwitch={switchJournal}
          onNew={newJournal}
          onImport={openImport}
          onExport={() => exportCenter()}
          onSettings={(tab) => overlays.open({ kind: "settings", tab })}
          onRemove={removeJournal}
        />
      )}
      {menu?.menu === "operator" && (
        <OperatorMenu
          anchor={menu.anchor}
          author={workspace.author}
          persistent={store.persistent}
          installed={install.installed}
          status={`orion aic 2.0 · ${
            offlineReady
              ? "hors ligne prêt"
              : online
                ? "en ligne"
                : "hors ligne"
          } · ${radio.issued}/${radio.terminals} radios`}
          theme={prefs.theme}
          onClose={() => overlays.close("menu")}
          onSettings={(tab) => overlays.open({ kind: "settings", tab })}
          onPrivacy={() => overlays.open({ kind: "dialog", name: "privacy" })}
          onInstall={() =>
            install.install
              ? void install.install()
              : overlays.open({ kind: "dialog", name: "install" })
          }
          onTheme={toggleTheme}
          onEnd={() => void closeSession()}
        />
      )}
      <OverlayHost
        overlays={overlays}
        views={{ PresentationMode, ExportCenter }}
        workspace={workspace}
        journal={journal}
        view={view}
        viewAt={viewAt}
        readOnly={readOnly}
        minute={minute}
        persistent={store.persistent}
        stored={!!store.stored}
        sync={sync}
        suggestions={suggestions}
        draft={draft}
        actions={actions}
        notify={notify}
        discardDraft={discardDraft}
        onDraft={saveDraft}
        onTyping={() => drafts.setTyping(true)}
        onAdd={add}
        onCreate={create}
        onImport={importJournal}
        onBackup={() =>
          setBackups((previous) => ({ ...previous, [journal.id]: journal }))
        }
        onProtect={store.protect}
        onUpdateWorkspace={(value) =>
          setWorkspace(workspaceSchema.parse(value))
        }
        onEnd={() => void closeSession()}
        onFinish={async () => {
          if (!discardDraft()) return;
          const unexported = workspace.journals.filter(
            (j) => backups[j.id] !== j,
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
            overlays.closeAll();
            setBackups({});
            setError("");
            notify("Session effacée de ce poste.");
          } else
            refuse("Session conservée : saisissez TERMINER pour l’effacer.");
        }}
        takeOverMessage={`Relève. ${follow.length} suite(s) à donner, dont ${late.length} en retard. ${radio.issued} radio(s) en service.`}
      />
      <AutoPrint
        queue={autoQueue}
        paused={!!overlays.get("print")}
        onDone={() => setAutoQueue((q) => q.slice(1))}
      />
      {viewAt !== null && <TimeBar />}
      <Toast message={toast} onDone={() => setToast(null)} />
    </Ctx.Provider>
  );
}
