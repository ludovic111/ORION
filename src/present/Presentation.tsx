import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import {
  Clock3,
  Download,
  Eraser,
  Expand,
  GripVertical,
  Highlighter,
  LayoutGrid,
  MonitorOff,
  MonitorPlay,
  MousePointer2,
  Pause,
  PenLine,
  Play,
  Presentation as PresentationIcon,
  Radio as LiveIcon,
  ScreenShare,
  Share2,
  SkipBack,
  SkipForward,
  Trash2,
  Tv,
  Undo2,
  X,
} from "lucide-react";
import { useApp } from "../app/context";
import {
  dateTime,
  numberLabel,
  current,
  type Journal,
} from "../../shared/journal";
import { fromInput, localInput } from "../ui/fields";
import {
  describeScope,
  fullScope,
  scopedJournal,
  type ExportScope,
} from "../export/scope";
import {
  arrangeDeck,
  buildDeck,
  slideLabel,
  slideInfo,
  type Deck,
  type MapSlide,
  type Slide,
} from "./deck";
import type { InkStroke } from "./layout";
import { InkLayer, INK_COLORS, type Tool } from "./Ink";
import { KIND_ICON, SlideView } from "./slides";
import {
  Mini,
  PresenterPortal,
  clock,
  elapsed,
  usePresenterWindow,
} from "./presenter";
import { mapPictures, symbolNames } from "./images";
import "./present.css";

// Presentation mode (full screen slides built from the situation, with a
// presenter view and freehand annotations) and wall display (automatic
// rotation of the live situation on a fixed screen). Owned by the
// presentation mode.

type Mode = "present" | "wall";
type Look = "dark" | "light" | "auto";
type Version =
  | { kind: "now" }
  | { kind: "snapshot"; id: string }
  | { kind: "time"; at: string };
type Settings = {
  audience: string;
  look: Look;
  order: string[];
  off: string[];
  interval: number;
};
const KEY = "orion-aic-present";
const DEFAULTS: Settings = {
  audience: "",
  look: "dark",
  order: [],
  off: [],
  interval: 20,
};
const INTERVALS = [10, 20, 30, 60];

function readSettings(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}
function writeSettings(value: Settings) {
  try {
    localStorage.setItem(KEY, JSON.stringify(value));
  } catch {
    // Private window: the choices last for this session only.
  }
}

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
const slug = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase() || "presentation";

function reducedMotion() {
  return (
    document.documentElement.dataset.motion === "reduced" ||
    matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}
function resolveLook(look: Look): "dark" | "light" {
  if (look !== "auto") return look;
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

/** Value refreshed at most every `ms` (live data on a wall display). */
function useThrottled<T>(value: T, ms: number) {
  const [shown, setShown] = useState(value);
  const last = useRef(0);
  useEffect(() => {
    const wait = Math.max(0, last.current + ms - Date.now());
    const timer = setTimeout(() => {
      last.current = Date.now();
      setShown(value);
    }, wait);
    return () => clearTimeout(timer);
  }, [value, ms]);
  return shown;
}

/** Ticks every second. */
function useSeconds() {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  return now;
}

/** 1920 × 1080 stage scaled to its box, letterboxed. */
function Stage({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [k, setK] = useState(0);
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const fit = () =>
      setK(Math.min(el.clientWidth / 1920, el.clientHeight / 1080));
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return (
    <div className={`pm-viewport ${className}`} ref={box}>
      <div
        className="pm-stage"
        style={{ transform: `translate(-50%, -50%) scale(${k})` }}
      >
        {children}
      </div>
    </div>
  );
}

const VARIANTS = {
  enter: (dir: number) => ({
    opacity: 0,
    x: dir * 90,
    scale: 0.985,
    filter: "blur(6px)",
  }),
  center: { opacity: 1, x: 0, scale: 1, filter: "blur(0px)" },
  exit: (dir: number) => ({
    opacity: 0,
    x: dir * -90,
    scale: 0.985,
    filter: "blur(6px)",
  }),
};

function Slides({
  deck,
  index,
  dir,
  maps,
  footer,
}: {
  deck: Deck;
  index: number;
  dir: number;
  maps: Record<string, string>;
  footer: string;
}) {
  const slide = deck.slides[index];
  return (
    <AnimatePresence initial custom={dir}>
      {slide && (
        <motion.div
          key={slide.id}
          className="pm-slide"
          custom={dir}
          variants={VARIANTS}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <SlideView
            deck={deck}
            slide={slide}
            index={index}
            count={deck.slides.length}
            maps={maps}
            footer={footer}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** What a map picture depends on: its objects, its record, its base. */
function mapSignature(journal: Journal, slide: MapSlide) {
  const record = journal.ops.maps.find((m) => m.id === slide.mapId);
  const ids = new Set(slide.placeIds);
  return [
    slide.base,
    record?.updatedAt ?? "",
    ...journal.ops.places
      .filter((p) => ids.has(p.id))
      .map((p) => `${p.id}@${p.updatedAt}`),
  ].join("|");
}

/**
 * Map pictures of a deck. A map is drawn again only when its own objects
 * or its record change, not at every change of the operation.
 */
function useMaps(journal: Journal, deck: Deck) {
  const [maps, setMaps] = useState<Record<string, string>>({});
  const drawn = useRef(new Map<string, string>());
  const wanted = useMemo(() => {
    const out = new Map<string, { slide: MapSlide; signature: string }>();
    for (const slide of deck.slides)
      if (slide.kind === "map")
        out.set(slide.id, { slide, signature: mapSignature(journal, slide) });
    return out;
  }, [deck, journal]);
  const key = [...wanted].map(([id, w]) => `${id}#${w.signature}`).join("\n");
  const latest = useRef({ journal, deck, wanted });
  latest.current = { journal, deck, wanted };
  useEffect(() => {
    let alive = true;
    const timer = setTimeout(async () => {
      const { journal, deck, wanted } = latest.current;
      for (const [id, { slide, signature }] of wanted) {
        if (drawn.current.get(id) === signature) continue;
        try {
          const pictures = await mapPictures(journal, {
            ...deck,
            slides: [slide],
          });
          if (!alive) return;
          if (pictures[id]) {
            drawn.current.set(id, signature);
            setMaps((old) => ({ ...old, [id]: pictures[id] }));
          }
        } catch {
          // The slide keeps its previous picture, or says it is missing.
        }
      }
    }, 300);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [key]);
  return maps;
}

// ---------- Register of the presentations ----------

type Register = {
  id: string;
  startedAt: string;
  mode: "Présentation" | "Affichage mural";
  presenter: string;
  audience: string;
  viewAt: string;
  slides: number;
};

/**
 * One record per presentation in the register, written when it starts and
 * kept up to date: its end time moves forward every minute while the
 * presentation runs, so a closed tab or a crash leaves at most one minute
 * of error; the real end is written when it ends. record() upserts by id
 * and works on closed journals and while the time machine shows the past.
 */
function useRegister() {
  const { record } = useApp();
  const current = useRef<Register | null>(null);
  const recordRef = useRef(record);
  recordRef.current = record;

  const write = useCallback((endedAt: string, notes: string) => {
    const r = current.current;
    if (!r) return;
    try {
      recordRef.current("presentations", {
        id: r.id,
        startedAt: r.startedAt,
        endedAt,
        presenter: r.presenter.slice(0, 120),
        audience: r.audience.slice(0, 500),
        viewAt: r.viewAt,
        slides: r.slides,
        mode: r.mode,
        notes: notes.slice(0, 4000),
      });
    } catch {
      // The register stays as it was: the presentation goes on.
    }
  }, []);

  const begin = useCallback(
    (value: Omit<Register, "id" | "startedAt">) => {
      if (current.current) return;
      const startedAt = new Date().toISOString();
      current.current = { ...value, id: crypto.randomUUID(), startedAt };
      write(startedAt, "");
    },
    [write],
  );

  const finish = useCallback(
    (notes = "") => {
      if (!current.current) return;
      write(new Date().toISOString(), notes);
      current.current = null;
    },
    [write],
  );

  useEffect(() => {
    const beat = setInterval(() => {
      if (current.current)
        write(new Date().toISOString(), "En cours (heure de fin provisoire).");
    }, 60_000);
    const leave = () => finish("Fenêtre fermée pendant la présentation.");
    window.addEventListener("pagehide", leave);
    return () => {
      clearInterval(beat);
      window.removeEventListener("pagehide", leave);
      finish();
    };
  }, [finish, write]);
  return { begin, finish, active: () => current.current };
}

// ---------- Main ----------

export default function PresentationMode({
  mode: initialMode,
  preset,
  onClose,
}: {
  mode: "present" | "wall";
  preset?: Partial<ExportScope>;
  onClose: () => void;
}) {
  const app = useApp();
  const { live, author, now: appNow } = app;
  const [mode, setMode] = useState<Mode>(initialMode);
  const [settings, setSettingsState] = useState<Settings>(readSettings);
  const setSettings = (patch: Partial<Settings>) =>
    setSettingsState((s) => {
      const next = { ...s, ...patch };
      writeSettings(next);
      return next;
    });
  const [presenter, setPresenter] = useState(author);
  const snapshots = useMemo(
    () =>
      [...live.ops.snapshots].sort(
        (a, b) => Date.parse(b.at) - Date.parse(a.at),
      ),
    [live.ops.snapshots],
  );
  const [version, setVersion] = useState<Version>(() => {
    const at = preset?.viewAt !== undefined ? preset.viewAt : app.viewAt;
    if (at === null || at === undefined) return { kind: "now" };
    const snap = live.ops.snapshots.find(
      (s) =>
        Date.parse(s.at) === at &&
        (!preset?.snapshot || s.title === preset.snapshot),
    );
    return snap
      ? { kind: "snapshot", id: snap.id }
      : { kind: "time", at: localInput(new Date(at).toISOString()) };
  });
  const [flash, setFlash] = useState("");
  useEffect(() => {
    if (!flash) return;
    const timer = setTimeout(() => setFlash(""), 5000);
    return () => clearTimeout(timer);
  }, [flash]);

  // Version shown (the wall always shows the live situation).
  const snapshot =
    version.kind === "snapshot"
      ? snapshots.find((s) => s.id === version.id)
      : undefined;
  const viewAt =
    mode === "wall"
      ? null
      : version.kind === "snapshot" && snapshot
        ? Date.parse(snapshot.at)
        : version.kind === "time"
          ? Date.parse(fromInput(version.at)) || null
          : null;
  const scope: ExportScope = useMemo(
    () => ({
      ...fullScope(),
      ...(preset?.sections ? { sections: preset.sections } : {}),
      ...(preset?.items ? { items: preset.items } : {}),
      viewAt,
      snapshot: snapshot?.title,
    }),
    [preset?.sections, preset?.items, viewAt, snapshot?.title],
  );

  const source = useThrottled(live, 2000);
  const [names, setNames] = useState<
    ((id: string) => string | undefined) | undefined
  >();
  useEffect(() => {
    symbolNames().then((fn) => setNames(() => fn));
  }, []);
  const scoped = useMemo(() => scopedJournal(source, scope), [source, scope]);
  const deck = useMemo(
    () =>
      buildDeck(scoped, {
        at: viewAt ?? appNow,
        live: viewAt === null,
        presenter,
        audience: settings.audience,
        snapshot: snapshot?.title,
        sections: scope.sections,
        full: source,
        symbolName: names,
      }),
    [
      scoped,
      viewAt,
      appNow,
      presenter,
      settings.audience,
      snapshot?.title,
      scope.sections,
      source,
      names,
    ],
  );
  const shown = useMemo(
    () =>
      mode === "wall"
        ? (() => {
            const d = arrangeDeck(deck, settings.order, ["title", "closing"]);
            return d.slides.length ? d : deck;
          })()
        : arrangeDeck(deck, settings.order, settings.off),
    [deck, mode, settings.order, settings.off],
  );
  const maps = useMaps(scoped, deck);
  const footer = `orion aic · ${deck.title}${live.reference ? ` · réf. ${live.reference}` : ""}`;
  const look = resolveLook(settings.look);
  const register = useRegister();

  const [phase, setPhase] = useState<"setup" | "show" | "end">(
    initialMode === "wall" ? "show" : "setup",
  );
  const root = useRef<HTMLDivElement>(null);

  const fullscreen = (on: boolean) => {
    try {
      if (on && !document.fullscreenElement)
        void root.current?.requestFullscreen?.().catch(() => {});
      if (!on && document.fullscreenElement)
        void document.exitFullscreen().catch(() => {});
    } catch {
      // Not available (iPhone): the overlay already fills the screen.
    }
  };

  const start = (as: Mode) => {
    setMode(as);
    setPhase("show");
    fullscreen(true);
    register.begin({
      mode: as === "wall" ? "Affichage mural" : "Présentation",
      presenter: as === "wall" ? author : presenter,
      audience: as === "wall" ? "Affichage mural" : settings.audience,
      viewAt:
        as === "wall" || viewAt === null ? "" : new Date(viewAt).toISOString(),
      slides: shown.slides.length,
    });
  };
  // The wall starts at once.
  useEffect(() => {
    if (initialMode === "wall") start("wall");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const quit = (notes?: string) => {
    fullscreen(false);
    register.finish(notes);
    onClose();
  };
  // Échap closes the setup screen (the show and the wall have their own keys).
  const quitRef = useRef(quit);
  quitRef.current = quit;
  useEffect(() => {
    if (phase !== "setup") return;
    const key = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      e.stopPropagation();
      quitRef.current();
    };
    window.addEventListener("keydown", key, true);
    return () => window.removeEventListener("keydown", key, true);
  }, [phase]);

  return (
    <MotionConfig reducedMotion={reducedMotion() ? "always" : "user"}>
      <div
        ref={root}
        className={`pm pm-look-${look} pm-phase-${phase}`}
        role="dialog"
        aria-modal="true"
        aria-label={mode === "wall" ? "Affichage mural" : "Présentation"}
      >
        {phase === "setup" && (
          <Setup
            deck={deck}
            shown={shown}
            maps={maps}
            footer={footer}
            settings={settings}
            setSettings={setSettings}
            presenter={presenter}
            setPresenter={setPresenter}
            version={version}
            setVersion={setVersion}
            snapshots={snapshots}
            scope={scope}
            onPresent={() => start("present")}
            onWall={() => start("wall")}
            onExport={() => {
              onClose();
              app.exportCenter({ ...scope, format: "pptx" });
            }}
            onClose={() => quit()}
            flash={flash}
            setFlash={setFlash}
          />
        )}
        {phase !== "setup" && mode === "present" && (
          <Show
            deck={shown}
            scoped={scoped}
            maps={maps}
            footer={footer}
            look={look}
            ended={phase === "end"}
            onEnd={() => {
              fullscreen(false);
              setPhase("end");
            }}
            onResume={() => {
              setPhase("show");
              fullscreen(true);
            }}
            onQuit={quit}
            setFlash={setFlash}
          />
        )}
        {phase !== "setup" && mode === "wall" && (
          <Wall
            deck={shown}
            live={source}
            maps={maps}
            footer={footer}
            settings={settings}
            setSettings={setSettings}
            onFullscreen={() => fullscreen(!document.fullscreenElement)}
            onQuit={() => quit()}
          />
        )}
        {flash && phase !== "setup" && <div className="pm-flash">{flash}</div>}
      </div>
    </MotionConfig>
  );
}

// ---------- Setup ----------

function Setup({
  deck,
  shown,
  maps,
  footer,
  settings,
  setSettings,
  presenter,
  setPresenter,
  version,
  setVersion,
  snapshots,
  scope,
  onPresent,
  onWall,
  onExport,
  onClose,
  flash,
}: {
  deck: Deck;
  shown: Deck;
  maps: Record<string, string>;
  footer: string;
  settings: Settings;
  setSettings: (patch: Partial<Settings>) => void;
  presenter: string;
  setPresenter: (v: string) => void;
  version: Version;
  setVersion: (v: Version) => void;
  snapshots: { id: string; title: string; at: string }[];
  scope: ExportScope;
  onPresent: () => void;
  onWall: () => void;
  onExport: () => void;
  onClose: () => void;
  flash: string;
  setFlash: (v: string) => void;
}) {
  // Every slide of the deck, in the chosen order, switched on or off.
  const all = arrangeDeck(deck, settings.order).slides;
  const [dragging, setDragging] = useState<string | null>(null);
  const rows = useRef(new Map<string, HTMLLIElement>());
  const move = (id: string, to: number) => {
    const ids = all.map((s) => s.id);
    const from = ids.indexOf(id);
    if (from < 0 || to < 0 || to >= ids.length || from === to) return;
    ids.splice(from, 1);
    ids.splice(to, 0, id);
    setSettings({ order: ids });
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    let target = all.length - 1;
    for (const [i, s] of all.entries()) {
      const el = rows.current.get(s.id);
      if (!el) continue;
      const box = el.getBoundingClientRect();
      if (e.clientY < box.top + box.height / 2) {
        target = i;
        break;
      }
    }
    const from = all.findIndex((s) => s.id === dragging);
    move(dragging, target > from ? target - 1 : target);
  };
  const toggle = (id: string) =>
    setSettings({
      off: settings.off.includes(id)
        ? settings.off.filter((x) => x !== id)
        : [...settings.off, id],
    });
  const on = all.length - all.filter((s) => settings.off.includes(s.id)).length;

  return (
    <div className="pm-setup">
      <header className="pm-setup-head">
        <div>
          <span className="pm-eyebrow">Présenter la situation</span>
          <h1>{deck.title}</h1>
          <p>{describeScope(scope)}</p>
        </div>
        <button
          className="icon-button pm-close"
          onClick={onClose}
          aria-label="Fermer"
        >
          <X size={22} />
        </button>
      </header>
      <div className="pm-setup-body">
        <form
          className="pm-setup-form"
          onSubmit={(e) => {
            e.preventDefault();
            onPresent();
          }}
        >
          <label>
            <span>Présenté par</span>
            <input
              value={presenter}
              onChange={(e) => setPresenter(e.target.value)}
              maxLength={120}
            />
          </label>
          <label>
            <span>Pour qui</span>
            <input
              value={settings.audience}
              onChange={(e) => setSettings({ audience: e.target.value })}
              placeholder="Autorités communales, préfet…"
              maxLength={500}
            />
          </label>
          <fieldset>
            <legend>Version présentée</legend>
            <div className="seg">
              <button
                type="button"
                aria-pressed={version.kind === "now"}
                onClick={() => setVersion({ kind: "now" })}
              >
                Maintenant
              </button>
              <button
                type="button"
                aria-pressed={version.kind === "snapshot"}
                disabled={!snapshots.length}
                title={
                  snapshots.length ? undefined : "Aucun point de situation figé"
                }
                onClick={() =>
                  snapshots[0] &&
                  setVersion({ kind: "snapshot", id: snapshots[0].id })
                }
              >
                Point figé
              </button>
              <button
                type="button"
                aria-pressed={version.kind === "time"}
                onClick={() =>
                  setVersion({
                    kind: "time",
                    at: localInput(new Date().toISOString()),
                  })
                }
              >
                Heure précise
              </button>
            </div>
            {version.kind === "snapshot" && (
              <select
                value={version.id}
                onChange={(e) =>
                  setVersion({ kind: "snapshot", id: e.target.value })
                }
              >
                {snapshots.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title} · {dateTime(s.at)}
                  </option>
                ))}
              </select>
            )}
            {version.kind === "time" && (
              <input
                type="datetime-local"
                value={version.at}
                onChange={(e) =>
                  setVersion({ kind: "time", at: e.target.value })
                }
              />
            )}
            <small>{deck.when}</small>
          </fieldset>
          <fieldset>
            <legend>Apparence</legend>
            <div className="seg">
              {(
                [
                  ["dark", "Sombre"],
                  ["light", "Clair"],
                  ["auto", "Auto"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={settings.look === id}
                  onClick={() => setSettings({ look: id })}
                >
                  {label}
                </button>
              ))}
            </div>
            <small>
              Clair : conseillé pour un projecteur dans une salle éclairée.
            </small>
          </fieldset>
          <div className="pm-setup-actions">
            <button type="submit" className="primary pm-go" disabled={!on}>
              <Play size={18} /> Présenter
            </button>
            <p className="pm-hint">
              Un deuxième écran ? Présentez, puis ouvrez la vue orateur (notes,
              diapositive suivante, chronomètre) avec le bouton{" "}
              <ScreenShare size={13} /> de la barre d’outils.
            </p>
            <button type="button" onClick={onWall}>
              <Tv size={16} /> Affichage mural en direct
            </button>
            <button type="button" onClick={onExport}>
              <Share2 size={16} /> Exporter (PowerPoint, PDF…)
            </button>
          </div>
          {flash && <p className="pm-notice">{flash}</p>}
        </form>
        <section className="pm-setup-slides" aria-label="Diapositives">
          <div className="pm-setup-slides-head">
            <h2>
              Diapositives{" "}
              <span>
                {on} / {all.length}
              </span>
            </h2>
            <small>Glissez pour changer l’ordre · décochez pour masquer</small>
          </div>
          <ol
            className="pm-slide-list"
            onPointerMove={onPointerMove}
            onPointerUp={() => setDragging(null)}
            onPointerCancel={() => setDragging(null)}
          >
            {all.map((s, i) => {
              const Icon = KIND_ICON[s.kind];
              const off = settings.off.includes(s.id);
              const position = shown.slides.findIndex((x) => x.id === s.id);
              return (
                <li
                  key={s.id}
                  ref={(el) => {
                    if (el) rows.current.set(s.id, el);
                    else rows.current.delete(s.id);
                  }}
                  className={`pm-slide-row${off ? " off" : ""}${dragging === s.id ? " dragging" : ""}`}
                  style={{ "--i": i } as React.CSSProperties}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.altKey && e.key === "ArrowUp") move(s.id, i - 1);
                    else if (e.altKey && e.key === "ArrowDown")
                      move(s.id, i + 1);
                    else if (e.key === " ") toggle(s.id);
                    else return;
                    e.preventDefault();
                  }}
                >
                  <span
                    className="pm-grip"
                    onPointerDown={(e) => {
                      e.preventDefault();
                      (
                        e.currentTarget.closest("ol") as HTMLElement
                      ).setPointerCapture(e.pointerId);
                      setDragging(s.id);
                    }}
                    aria-label="Déplacer (Alt + flèches)"
                  >
                    <GripVertical size={18} />
                  </span>
                  <input
                    type="checkbox"
                    checked={!off}
                    onChange={() => toggle(s.id)}
                    aria-label={`Montrer ${slideLabel(s)}`}
                  />
                  <div
                    className={`pm-thumb pm-look-${resolveLook(settings.look)}`}
                    onClick={() => toggle(s.id)}
                  >
                    <Mini width={176}>
                      <SlideView
                        deck={deck}
                        slide={s}
                        index={Math.max(0, position)}
                        count={shown.slides.length}
                        maps={maps}
                        footer={footer}
                        still
                      />
                    </Mini>
                  </div>
                  <div className="pm-slide-text">
                    <b>
                      <Icon size={15} /> {off ? "" : `${position + 1}. `}
                      {slideLabel(s)}
                    </b>
                    <small>{slideDetail(s)}</small>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      </div>
    </div>
  );
}

function slideDetail(s: Slide): string {
  switch (s.kind) {
    case "title":
      return s.when;
    case "situation":
      return `${s.boards.length + (s.intent ? 1 : 0)} tableau(x)${s.intent ? " · idée de manœuvre" : ""}`;
    case "facts":
      return `${s.facts.length} renseignement(s) clé(s)${s.since ? ` · évolution ${s.since}` : ""}`;
    case "map":
      return `${s.objects} objet(s) · ${s.legend.length} calque(s)`;
    case "changes":
      return `${s.total} changement(s) ${s.since}`;
    case "highlights":
      return `${s.items.length} fait(s) marquant(s)`;
    case "missions":
      return `${s.open} ouverte(s)${s.late ? ` · ${s.late} en retard` : ""}`;
    case "resources":
      return s.totals
        .map((t) => `${t.value} ${t.label.toLowerCase()}`)
        .join(" · ");
    case "team":
      return `${s.cells.length} poste(s) · ${s.present} présent(s)`;
    case "radio":
      return s.stats[0] ? `${s.stats[0].value} terminaux en service` : "";
    case "weather":
      return [s.now?.label, s.alerts.length && `${s.alerts.length} alerte(s)`]
        .filter(Boolean)
        .join(" · ");
    case "agenda":
      return `${s.items.length} échéance(s)`;
    case "closing":
      return s.next || slideInfo(s.kind).detail;
  }
}

// ---------- Show ----------

function Toolbar({
  children,
  visible,
}: {
  children: ReactNode;
  visible: boolean;
}) {
  return (
    <div
      className="pm-toolbar"
      data-visible={visible || undefined}
      role="toolbar"
      aria-label="Outils de présentation"
    >
      {children}
    </div>
  );
}

function ToolButton({
  label,
  keyHint,
  pressed,
  onClick,
  children,
  className = "",
}: {
  label: string;
  keyHint?: string;
  pressed?: boolean;
  onClick: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={`pm-tool ${className}`}
      aria-pressed={pressed}
      aria-label={label}
      title={keyHint ? `${label} (${keyHint})` : label}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      {children}
    </button>
  );
}

const isField = (t: EventTarget | null) =>
  t instanceof HTMLElement &&
  !!t.closest("input, textarea, select, [contenteditable=true]");

function Show({
  deck,
  scoped,
  maps,
  footer,
  look,
  ended,
  onEnd,
  onResume,
  onQuit,
  setFlash,
}: {
  deck: Deck;
  scoped: Journal;
  maps: Record<string, string>;
  footer: string;
  look: "dark" | "light";
  ended: boolean;
  onEnd: () => void;
  onResume: () => void;
  onQuit: (notes?: string) => void;
  setFlash: (v: string) => void;
}) {
  const count = deck.slides.length;
  // The slide shown is followed by id: the live deck may gain or lose
  // slides (a new map object, a new key fact) while it is presented.
  const [shownId, setShownId] = useState(deck.slides[0]?.id ?? "");
  const lastIndex = useRef(0);
  const found = deck.slides.findIndex((s) => s.id === shownId);
  const index =
    found >= 0 ? found : Math.max(0, Math.min(lastIndex.current, count - 1));
  lastIndex.current = index;
  const [dir, setDir] = useState(1);
  const [tool, setTool] = useState<Tool>("none");
  const [color, setColor] = useState<string>(INK_COLORS[0].hex);
  const [strokes, setStrokes] = useState<Record<string, InkStroke[]>>({});
  const [black, setBlack] = useState(false);
  const [overview, setOverview] = useState(false);
  const [timer, setTimer] = useState(false);
  const [notes, setNotes] = useState(false);
  const [idle, setIdle] = useState(false);
  const [startedAt] = useState(Date.now());
  const seen = useRef(new Set<string>());
  const now = useSeconds();
  const slide = deck.slides[index];
  if (slide) seen.current.add(slide.id);
  // The slide shown disappeared: stay at the same place in the deck.
  useEffect(() => {
    if (found < 0 && slide) setShownId(slide.id);
  }, [found, slide]);

  const deckRef = useRef(deck);
  deckRef.current = deck;
  const indexRef = useRef(index);
  indexRef.current = index;
  const go = useCallback((to: number) => {
    const slides = deckRef.current.slides;
    if (!slides.length) return;
    const next = Math.max(0, Math.min(slides.length - 1, to));
    if (next !== indexRef.current) setDir(next > indexRef.current ? 1 : -1);
    setShownId(slides[next].id);
    setBlack(false);
  }, []);

  const current = slide ? (strokes[slide.id] ?? []) : [];
  const setCurrent = (list: InkStroke[]) =>
    slide && setStrokes((s) => ({ ...s, [slide.id]: list }));
  const annotated = Object.values(strokes).some((l) => l.length);
  const pick = (t: Tool) => setTool((old) => (old === t ? "none" : t));

  const presenterWin = usePresenterWindow((e) => key(e));
  const openPresenter = () => {
    if (!presenterWin.open())
      setFlash(
        "La fenêtre de la vue orateur a été bloquée. Autorisez les fenêtres surgissantes pour ce site, ou appuyez sur N pour afficher les notes.",
      );
  };

  const key = (e: KeyboardEvent) => {
    if (isField(e.target) || ended) return;
    const k = e.key;
    const mod = e.metaKey || e.ctrlKey;
    let handled = true;
    if (mod && k.toLowerCase() === "z") setCurrent(current.slice(0, -1));
    else if (mod || e.altKey) handled = false;
    else if (["ArrowRight", "ArrowDown", "PageDown", " ", "Enter"].includes(k))
      go(index + 1);
    else if (["ArrowLeft", "ArrowUp", "PageUp", "Backspace"].includes(k))
      go(index - 1);
    else if (k === "Home") go(0);
    else if (k === "End") go(count - 1);
    else if (k === "Escape") {
      if (black) setBlack(false);
      else if (overview) setOverview(false);
      else if (tool !== "none") setTool("none");
      else onEnd();
    } else if (k === "o" || k === "O") setOverview((v) => !v);
    else if (k === "b" || k === "B" || k === ".") setBlack((v) => !v);
    else if (k === "l" || k === "L") pick("laser");
    else if (k === "p" || k === "P") pick("pen");
    else if (k === "h" || k === "H") pick("marker");
    else if (k === "E") setCurrent([]);
    else if (k === "e") pick("eraser");
    else if (k === "t" || k === "T") setTimer((v) => !v);
    else if (k === "n" || k === "N") setNotes((v) => !v);
    else if (k === "f" || k === "F") {
      if (document.fullscreenElement)
        void document.exitFullscreen().catch(() => {});
      else
        void document
          .querySelector<HTMLElement>(".pm")
          ?.requestFullscreen?.()
          .catch(() => {});
    } else if (/^[1-5]$/.test(k)) {
      setColor(INK_COLORS[Number(k) - 1].hex);
      if (tool !== "pen" && tool !== "marker") setTool("pen");
    } else handled = false;
    if (handled) {
      e.preventDefault();
      e.stopPropagation();
    }
  };
  const keyRef = useRef(key);
  keyRef.current = key;
  useEffect(() => {
    const listener = (e: KeyboardEvent) => keyRef.current(e);
    window.addEventListener("keydown", listener, true);
    return () => window.removeEventListener("keydown", listener, true);
  }, []);

  // Controls fade out when the pointer rests.
  useEffect(() => {
    let timer = setTimeout(() => setIdle(true), 2500);
    const wake = () => {
      setIdle(false);
      clearTimeout(timer);
      timer = setTimeout(() => setIdle(true), 2500);
    };
    window.addEventListener("pointermove", wake);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("pointermove", wake);
    };
  }, []);

  // Swipe on touch screens (when no drawing tool is active).
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const swiped = useRef(false);

  const summary = () =>
    `Durée ${elapsed(Date.now() - startedAt)} · ${seen.current.size} diapositive(s) montrée(s) sur ${count}${annotated ? " · annotations" : ""}.`;

  if (ended)
    return (
      <EndScreen
        deck={deck}
        maps={maps}
        footer={footer}
        look={look}
        strokes={strokes}
        duration={elapsed(Date.now() - startedAt)}
        seen={seen.current.size}
        onResume={onResume}
        onQuit={() => onQuit(summary())}
        scoped={scoped}
      />
    );

  return (
    <div
      className={`pm-show${idle && tool === "none" ? " idle" : ""}`}
      data-tool={tool}
    >
      <Stage>
        <Slides
          deck={deck}
          index={index}
          dir={dir}
          maps={maps}
          footer={footer}
        />
        {tool === "none" && (
          <div
            className="pm-zones"
            onPointerDown={(e) => {
              swiped.current = false;
              if (e.pointerType === "touch")
                swipe.current = { x: e.clientX, y: e.clientY };
            }}
            onPointerUp={(e) => {
              const s = swipe.current;
              swipe.current = null;
              if (!s) return;
              const dx = e.clientX - s.x;
              if (
                Math.abs(dx) > 60 &&
                Math.abs(dx) > Math.abs(e.clientY - s.y)
              ) {
                swiped.current = true;
                go(index + (dx < 0 ? 1 : -1));
              }
            }}
          >
            <button
              className="pm-zone prev"
              aria-label="Diapositive précédente"
              onClick={() => !swiped.current && go(index - 1)}
            />
            <button
              className="pm-zone next"
              aria-label="Diapositive suivante"
              onClick={() => !swiped.current && go(index + 1)}
            />
          </div>
        )}
        <InkLayer
          tool={tool}
          color={color}
          strokes={current}
          onAdd={(s) => setCurrent([...current, s])}
          onRemove={(i) => setCurrent(current.filter((_, k) => k !== i))}
        />
      </Stage>

      <div className="pm-progress" aria-hidden>
        <i style={{ width: `${((index + 1) / Math.max(1, count)) * 100}%` }} />
      </div>
      <div className="pm-hud">
        <span>{clock(now)}</span>
        {timer && <span className="pm-timer">{elapsed(now - startedAt)}</span>}
      </div>

      <Toolbar visible={!idle || tool !== "none"}>
        <ToolButton
          label="Précédente"
          keyHint="←"
          onClick={() => go(index - 1)}
        >
          <SkipBack size={18} />
        </ToolButton>
        <ToolButton
          label="Suivante"
          keyHint="→ ou espace"
          onClick={() => go(index + 1)}
        >
          <SkipForward size={18} />
        </ToolButton>
        <span className="pm-sep" />
        <ToolButton
          label="Stylo"
          keyHint="P"
          pressed={tool === "pen"}
          onClick={() => pick("pen")}
        >
          <PenLine size={18} />
        </ToolButton>
        <ToolButton
          label="Surligneur"
          keyHint="H"
          pressed={tool === "marker"}
          onClick={() => pick("marker")}
        >
          <Highlighter size={18} />
        </ToolButton>
        <ToolButton
          label="Pointeur laser"
          keyHint="L"
          pressed={tool === "laser"}
          onClick={() => pick("laser")}
        >
          <MousePointer2 size={18} />
        </ToolButton>
        <ToolButton
          label="Gomme"
          keyHint="E"
          pressed={tool === "eraser"}
          onClick={() => pick("eraser")}
        >
          <Eraser size={18} />
        </ToolButton>
        {(tool === "pen" || tool === "marker") &&
          INK_COLORS.map((c, i) => (
            <button
              key={c.hex}
              type="button"
              className="pm-swatch"
              style={{ "--c": `#${c.hex}` } as React.CSSProperties}
              aria-pressed={color === c.hex}
              aria-label={c.label}
              title={`${c.label} (${i + 1})`}
              onClick={(e) => {
                e.stopPropagation();
                setColor(c.hex);
              }}
            />
          ))}
        <ToolButton
          label="Annuler le dernier trait"
          keyHint="Ctrl Z"
          onClick={() => setCurrent(current.slice(0, -1))}
        >
          <Undo2 size={18} />
        </ToolButton>
        <ToolButton
          label="Effacer les annotations de la diapositive"
          keyHint="Maj E"
          onClick={() => setCurrent([])}
        >
          <Trash2 size={18} />
        </ToolButton>
        <span className="pm-sep" />
        <ToolButton
          label="Vue d’ensemble"
          keyHint="O"
          pressed={overview}
          onClick={() => setOverview((v) => !v)}
        >
          <LayoutGrid size={18} />
        </ToolButton>
        <ToolButton
          label="Écran noir"
          keyHint="B"
          pressed={black}
          onClick={() => setBlack((v) => !v)}
        >
          <MonitorOff size={18} />
        </ToolButton>
        <ToolButton
          label="Chronomètre"
          keyHint="T"
          pressed={timer}
          onClick={() => setTimer((v) => !v)}
        >
          <Clock3 size={18} />
        </ToolButton>
        <ToolButton
          label="Vue orateur (deuxième écran)"
          pressed={!!presenterWin.target}
          onClick={openPresenter}
        >
          <ScreenShare size={18} />
        </ToolButton>
        <ToolButton
          label="Plein écran"
          keyHint="F"
          onClick={() =>
            keyRef.current(new KeyboardEvent("keydown", { key: "f" }))
          }
        >
          <Expand size={18} />
        </ToolButton>
        <ToolButton
          label="Terminer"
          keyHint="Échap"
          className="end"
          onClick={onEnd}
        >
          <X size={18} />
        </ToolButton>
      </Toolbar>

      {notes && slide && (
        <aside className="pm-notes">
          <b>Notes · {slideLabel(slide)}</b>
          {slide.notes.split("\n").map((l, i) => (
            <p key={i}>{l}</p>
          ))}
        </aside>
      )}
      <AnimatePresence>
        {black && (
          <motion.div
            className="pm-black"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setBlack(false)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {overview && (
          <motion.div
            className={`pm-overview pm-look-${look}`}
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.04 }}
            transition={{ duration: 0.3 }}
          >
            <h2>Vue d’ensemble</h2>
            <div className="pm-overview-grid">
              {deck.slides.map((s, i) => (
                <button
                  key={s.id}
                  className={`pm-overview-item${i === index ? " current" : ""}`}
                  style={{ "--i": i } as React.CSSProperties}
                  onClick={() => {
                    go(i);
                    setOverview(false);
                  }}
                >
                  <Mini width={300}>
                    <SlideView
                      deck={deck}
                      slide={s}
                      index={i}
                      count={count}
                      maps={maps}
                      footer={footer}
                      still
                    />
                  </Mini>
                  <span>
                    {i + 1}. {slideLabel(s)}
                    {(strokes[s.id]?.length ?? 0) > 0 && <PenLine size={13} />}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {presenterWin.target && (
        <PresenterPortal
          target={presenterWin.target}
          deck={deck}
          index={index}
          maps={maps}
          footer={footer}
          look={look}
          startedAt={startedAt}
          now={now}
          black={black}
          onGo={go}
          onBlack={() => setBlack((v) => !v)}
          onEnd={onEnd}
        />
      )}
    </div>
  );
}

// ---------- End ----------

function EndScreen({
  deck,
  maps,
  footer,
  look,
  strokes,
  duration,
  seen,
  onResume,
  onQuit,
}: {
  deck: Deck;
  scoped: Journal;
  maps: Record<string, string>;
  footer: string;
  look: "dark" | "light";
  strokes: Record<string, InkStroke[]>;
  duration: string;
  seen: number;
  onResume: () => void;
  onQuit: () => void;
}) {
  const annotated = deck.slides.filter((s) => strokes[s.id]?.length);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const holders = useRef(new Map<string, HTMLDivElement>());
  const save = async () => {
    setBusy(true);
    setError("");
    try {
      const { captureSlide, annotationsPdf } = await import("./capture");
      const bg = look === "light" ? "#e4dfd9" : "#121110";
      const pages: HTMLCanvasElement[] = [];
      for (const s of annotated) {
        const node = holders.current.get(s.id)
          ?.firstElementChild as HTMLElement | null;
        if (node) pages.push(await captureSlide(node, strokes[s.id], bg));
      }
      const blob = await annotationsPdf(pages, `${deck.title} · annotations`);
      download(
        blob,
        `${slug(deck.title)}-annotations-${new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-")}.pdf`,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Enregistrement impossible.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="pm-end">
      <motion.div
        className="pm-end-card"
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <PresentationIcon size={40} className="pm-end-icon" />
        <h1>Présentation terminée</h1>
        <p>
          {duration} · {seen} diapositive{seen > 1 ? "s" : ""} montrée
          {seen > 1 ? "s" : ""} sur {deck.slides.length}
        </p>
        <p className="pm-hint">
          Elle est inscrite au registre des présentations (Traçabilité).
        </p>
        {annotated.length > 0 && (
          <button className="primary pm-go" onClick={save} disabled={busy}>
            <Download size={18} />
            {busy
              ? "Préparation…"
              : `Enregistrer les annotations (${annotated.length} diapositive${annotated.length > 1 ? "s" : ""}, PDF)`}
          </button>
        )}
        {error && <p className="pm-notice">{error}</p>}
        <div className="pm-end-actions">
          <button onClick={onResume}>
            <MonitorPlay size={16} /> Reprendre
          </button>
          <button
            className={annotated.length ? "" : "primary"}
            onClick={onQuit}
          >
            Fermer
          </button>
        </div>
        {annotated.length > 0 && (
          <p className="pm-hint">
            Les annotations sont perdues à la fermeture si elles ne sont pas
            enregistrées.
          </p>
        )}
      </motion.div>
      {/* Slides drawn off screen for the capture of the annotations. */}
      <div className={`pm-capture pm-look-${look}`} aria-hidden>
        {annotated.map((s) => (
          <div
            key={s.id}
            ref={(el) => {
              if (el) holders.current.set(s.id, el);
              else holders.current.delete(s.id);
            }}
          >
            <SlideView
              deck={deck}
              slide={s}
              index={deck.slides.indexOf(s)}
              count={deck.slides.length}
              maps={maps}
              footer={footer}
              still
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------- Wall display ----------

function Wall({
  deck,
  live,
  maps,
  footer,
  settings,
  setSettings,
  onFullscreen,
  onQuit,
}: {
  deck: Deck;
  live: Journal;
  maps: Record<string, string>;
  footer: string;
  settings: Settings;
  setSettings: (patch: Partial<Settings>) => void;
  onFullscreen: () => void;
  onQuit: () => void;
}) {
  const count = deck.slides.length;
  const [id, setId] = useState(deck.slides[0]?.id ?? "");
  const [paused, setPaused] = useState(false);
  const [idle, setIdle] = useState(true);
  const [changed, setChanged] = useState(0);
  const now = useSeconds();
  const lastIndex = useRef(0);
  const found = deck.slides.findIndex((s) => s.id === id);
  const index =
    found >= 0 ? found : Math.max(0, Math.min(lastIndex.current, count - 1));
  lastIndex.current = index;
  const currentId = deck.slides[index]?.id ?? "";
  // The deck is rebuilt with the live data (every few seconds): the
  // navigation reads it from a ref so that it stays stable.
  const deckRef = useRef(deck);
  deckRef.current = deck;
  const indexRef = useRef(index);
  indexRef.current = index;
  const step = useCallback((delta: number) => {
    const slides = deckRef.current.slides;
    const n = slides.length;
    if (!n) return;
    setId(slides[(((indexRef.current + delta) % n) + n) % n].id);
  }, []);

  // Rotation: restarts only when the slide, the pause or the pace changes.
  const [cycle, setCycle] = useState(0);
  const many = count > 1;
  useEffect(() => {
    if (paused || !many) return;
    const timer = setTimeout(() => step(1), settings.interval * 1000);
    return () => clearTimeout(timer);
  }, [currentId, paused, many, settings.interval, cycle, step]);

  // Live updates: a short sign when the situation changes (the registers
  // of exports and presentations do not count).
  const signature = useMemo(
    () =>
      [
        live.entries.reduce((n, e) => n + e.revisions.length, 0),
        live.deleted.length,
        live.history.filter(
          (h) => h.scope !== "ops.presentations" && h.scope !== "ops.exports",
        ).length,
      ].join(":"),
    [live],
  );
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setChanged(Date.now());
  }, [signature]);

  // Keep the screen awake. The lock drops when the page is hidden: it is
  // asked again when the page comes back, the previous one released.
  useEffect(() => {
    type Lock = { release: () => Promise<void> };
    const nav = navigator as Navigator & {
      wakeLock?: { request: (t: "screen") => Promise<Lock> };
    };
    let alive = true;
    let lock: Lock | null = null;
    const release = () => {
      void lock?.release().catch(() => {});
      lock = null;
    };
    const request = () => {
      if (document.visibilityState !== "visible" || !nav.wakeLock) return;
      release();
      nav.wakeLock
        .request("screen")
        .then((l) => {
          if (alive) lock = l;
          else void l.release().catch(() => {});
        })
        .catch(() => {});
    };
    request();
    document.addEventListener("visibilitychange", request);
    return () => {
      alive = false;
      document.removeEventListener("visibilitychange", request);
      release();
    };
  }, []);

  const actions = useRef({ onQuit, onFullscreen });
  actions.current = { onQuit, onFullscreen };
  useEffect(() => {
    let timer = setTimeout(() => setIdle(true), 3000);
    const wake = () => {
      setIdle(false);
      clearTimeout(timer);
      timer = setTimeout(() => setIdle(true), 3000);
    };
    const key = (e: KeyboardEvent) => {
      if (isField(e.target)) return;
      let handled = true;
      if (e.key === "Escape") actions.current.onQuit();
      else if (e.key === "ArrowRight" || e.key === "PageDown") {
        step(1);
        setCycle((c) => c + 1);
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        step(-1);
        setCycle((c) => c + 1);
      } else if (e.key === " ") setPaused((p) => !p);
      else if (e.key === "f" || e.key === "F") actions.current.onFullscreen();
      else handled = false;
      if (handled) {
        e.preventDefault();
        e.stopPropagation();
      }
      wake();
    };
    window.addEventListener("pointermove", wake);
    window.addEventListener("keydown", key, true);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("pointermove", wake);
      window.removeEventListener("keydown", key, true);
    };
  }, [step]);

  const ticker = useMemo(
    () =>
      [...live.entries]
        .sort(
          (a, b) =>
            Date.parse(current(b).happenedAt) -
            Date.parse(current(a).happenedAt),
        )
        .slice(0, 12)
        .map((e) => ({
          id: e.id,
          time: clock(Date.parse(current(e).happenedAt)),
          number: numberLabel(e),
          text: current(e).message.split("\n")[0],
          tone:
            current(e).priority === "Urgent"
              ? "crit"
              : current(e).priority === "Important"
                ? "warn"
                : "",
        })),
    [live.entries],
  );
  const fresh = Date.now() - changed < 8000;

  return (
    <div className={`pm-wall${idle ? " idle" : ""}`}>
      <header className="pm-wall-head">
        <div className="pm-wall-title">
          <span className="pm-live">
            <LiveIcon size={16} /> EN DIRECT
          </span>
          <b>{deck.title}</b>
          {live.location && <small>{live.location}</small>}
        </div>
        {fresh && (
          <span className="pm-updated">Mis à jour à {clock(changed)}</span>
        )}
        <div className="pm-wall-clock">
          <b>
            {new Date(now).toLocaleTimeString("fr-CH", {
              timeZone: "Europe/Zurich",
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          </b>
          <small>
            {new Date(now).toLocaleDateString("fr-CH", {
              timeZone: "Europe/Zurich",
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </small>
        </div>
      </header>
      <Stage className="pm-wall-stage">
        <Slides deck={deck} index={index} dir={1} maps={maps} footer={footer} />
      </Stage>
      <div className="pm-wall-progress" aria-hidden>
        {deck.slides.map((s, i) => (
          <i
            key={s.id}
            className={i < index ? "done" : i === index ? "now" : ""}
          >
            {i === index && (
              <b
                key={`${s.id}-${cycle}-${paused}`}
                style={{
                  animationDuration: `${settings.interval}s`,
                  animationPlayState: paused ? "paused" : "running",
                }}
              />
            )}
          </i>
        ))}
      </div>
      {ticker.length > 0 && (
        <footer className="pm-ticker">
          <span className="pm-ticker-label">Journal</span>
          <div className="pm-ticker-track">
            <div
              className="pm-ticker-run"
              style={{
                animationDuration: `${Math.max(40, ticker.length * 9)}s`,
              }}
            >
              {[0, 1].map((copy) => (
                <span key={copy} aria-hidden={copy === 1 || undefined}>
                  {ticker.map((t) => (
                    <span key={t.id} className={`pm-tick ${t.tone}`}>
                      <time>{t.time}</time> <b>{t.number}</b> {t.text}
                    </span>
                  ))}
                </span>
              ))}
            </div>
          </div>
        </footer>
      )}
      <div
        className="pm-wall-controls"
        role="toolbar"
        aria-label="Réglages de l’affichage mural"
      >
        <button
          onClick={() => (step(-1), setCycle((c) => c + 1))}
          aria-label="Précédente"
        >
          <SkipBack size={16} />
        </button>
        <button
          onClick={() => setPaused((p) => !p)}
          aria-label={paused ? "Reprendre" : "Pause"}
        >
          {paused ? <Play size={16} /> : <Pause size={16} />}
        </button>
        <button
          onClick={() => (step(1), setCycle((c) => c + 1))}
          aria-label="Suivante"
        >
          <SkipForward size={16} />
        </button>
        <div className="seg" aria-label="Durée par diapositive">
          {INTERVALS.map((s) => (
            <button
              key={s}
              aria-pressed={settings.interval === s}
              onClick={() => setSettings({ interval: s })}
            >
              {s} s
            </button>
          ))}
        </div>
        <div className="seg" aria-label="Apparence">
          {(
            [
              ["dark", "Sombre"],
              ["light", "Clair"],
            ] as const
          ).map(([look, label]) => (
            <button
              key={look}
              aria-pressed={settings.look === look}
              onClick={() => setSettings({ look })}
            >
              {label}
            </button>
          ))}
        </div>
        <button onClick={onFullscreen} aria-label="Plein écran">
          <Expand size={16} />
        </button>
        <button onClick={onQuit}>
          <X size={16} /> Quitter
        </button>
      </div>
    </div>
  );
}
