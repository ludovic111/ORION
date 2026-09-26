import {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Check,
  CircleDashed,
  Copy,
  Crosshair,
  Expand,
  Grid3x3,
  House,
  Layers,
  List,
  LocateFixed,
  Lock,
  LockOpen,
  MapPin,
  Maximize2,
  Minimize2,
  Minus,
  MousePointer2,
  Pencil,
  Pentagon,
  Pin,
  Plus,
  Redo2,
  Ruler,
  Spline,
  Type,
  Undo2,
  WifiOff,
  Wind,
  X,
  type LucideIcon,
} from "lucide-react";
import { current } from "../../../shared/journal";
import {
  defaultListValues,
  journalLang,
  listValues,
  upsert,
  type InputOf,
  type Ops,
  type OpsMap,
  type Place,
} from "../../../shared/ops";
import { formatNumber, getLang } from "../../../shared/i18n/core.ts";
import { t, tn } from "./i18n.ts";
import {
  KIND_INFO,
  addLink,
  parseRef,
  ref,
  type Ref,
} from "../../../shared/links";
import { formatMN95, fromMN95, toMN95 } from "../../../shared/coordinates";
import { Ctx, useApp } from "../../app/context";
import { ModuleHead } from "../../ui/ModuleHead";
import { ItemPreview } from "../../ui/links";
import { Popover } from "../../ui/Popover";
import {
  areaOf,
  bearingOf,
  circlePoints,
  compass,
  formatArea,
  formatDistance,
  formatPosition,
  formatWgs,
  lengthOf,
  mn95Text,
  parseCoordinates,
  parseRadii,
  sectorPoints,
  type LatLng,
} from "./geo";
import { applyChange, diffOps, mergeChange, type Change } from "./undo";
import {
  OverlayManager,
  type ActiveOverlays,
  type LiveStatus,
} from "./overlayLayers";
import { OverlayPanel } from "./OverlayPanel";
import { LiveLayer, LiveShareButton } from "./LiveLayer";
import type { Unit } from "../../../shared/live";
import { identifyUrl, overlayById, readIdentify } from "./overlays";
import { gridLines, gridSpacingForZoom } from "./swissgrid";
import { gridLabel } from "./printscale";
import { SectorDialog } from "./SectorDialog";
import { PrintDialog } from "./PrintDialog";
import { persistStorage } from "./sectors";
import { toGeoJSON } from "./geoformats";
import { TONE_COLOR, strayObjects } from "./maps";
import type { Bounds } from "./tilecache";
import { MapSearch } from "./MapSearch";
import { PlaceSheet, clampSize, normalizeAngle } from "./PlaceSheet";
import { LayersPanel, PlacesList, layerKey, toneOf } from "./panels";
import {
  Glyph,
  SymbolPalette,
  describeSymbol,
  recentSymbols,
  rememberSymbol,
  useCatalog,
  useCustomSymbolsSync,
} from "./symbols";
import { BASES, GENEVA, SWISS_BOUNDS, isBase, type BaseId } from "./bases";
import {
  MAIN_MAP,
  MAIN_NAME,
  hexColor,
  onMap,
  simplify,
  sortMaps,
} from "./maps";
import { MapTabs } from "./MapTabs";
import { MapDialog } from "./MapDialog";
import { ImportDialog } from "./ImportDialog";
import "./map.css";

// Situation map: swisstopo background, official civil symbols, lines and
// areas, and everything linked to each object on hover. Leaflet is driven
// imperatively; marker contents are React portals so they follow the data
// without rebuilding the map.

type Tool =
  | "select"
  | "point"
  | "line"
  | "area"
  | "circle"
  | "sector"
  | "freehand"
  | "text"
  | "measure"
  // Frame of an offline sector (two corners); not in the tool bar.
  | "box";
/** Information card: a live measurement or the answer of a layer. */
type Info = {
  x: number;
  y: number;
  items: { title: string; source: string; rows: [string, string][] }[];
  loading?: boolean;
  error?: string;
};
type Plume = { bearing: number; angle: number; length: number };
type Panel = "list" | "symbols" | "layers" | null;
type Hover = { target: Ref; x: number; y: number; hint: string };
type Ghost = { target: Ref; lat: number; lng: number; title: string };
type View = { lat: number; lng: number; zoom: number };
type Style = Pick<Place, "size" | "rotation">;
/** Background or hidden layers chosen while the journal is read-only. */
type Override = { base?: BaseId; hidden?: string[] };

const SWISSTOPO = () =>
  `© <a href="https://www.swisstopo.admin.ch/${getLang()}/" target="_blank" rel="noopener noreferrer">swisstopo</a>`;
const OSM = () =>
  `© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">${t("les contributeurs d’OpenStreetMap")}</a>`;

const TOOLS: {
  id: Tool;
  readonly label: string;
  icon: LucideIcon;
  write: boolean;
  readonly hint: string;
}[] = [
  {
    id: "select",
    get label() {
      return t("Sélection");
    },
    icon: MousePointer2,
    write: false,
    get hint() {
      return t("Sélectionner et déplacer");
    },
  },
  {
    id: "point",
    get label() {
      return t("Point");
    },
    icon: MapPin,
    write: true,
    get hint() {
      return t("Placer un signe");
    },
  },
  {
    id: "line",
    get label() {
      return t("Ligne");
    },
    icon: Spline,
    write: true,
    get hint() {
      return t("Tracer une ligne ou un itinéraire");
    },
  },
  {
    id: "area",
    get label() {
      return t("Zone");
    },
    icon: Pentagon,
    write: true,
    get hint() {
      return t("Dessiner une zone");
    },
  },
  {
    id: "circle",
    get label() {
      return t("Périmètre");
    },
    icon: CircleDashed,
    write: true,
    get hint() {
      return t("Périmètre circulaire : un centre, un rayon");
    },
  },
  {
    id: "sector",
    get label() {
      return t("Panache");
    },
    icon: Wind,
    write: true,
    get hint() {
      return t(
        "Secteur ou panache depuis un point : direction, ouverture et longueur (vent)",
      );
    },
  },
  {
    id: "freehand",
    get label() {
      return t("Dessin");
    },
    icon: Pencil,
    write: true,
    get hint() {
      return t("Dessin libre, à la souris ou au doigt");
    },
  },
  {
    id: "text",
    get label() {
      return t("Texte");
    },
    icon: Type,
    write: true,
    get hint() {
      return t("Écrire un texte sur la carte");
    },
  },
  {
    id: "measure",
    get label() {
      return t("Mesurer");
    },
    icon: Ruler,
    write: false,
    get hint() {
      return t("Mesurer une distance ou une surface");
    },
  },
];
const DRAWING: Tool[] = ["line", "area", "circle", "sector", "measure", "box"];
/** Radii offered once the centre of a perimeter is placed, in metres. */
const RADII = [50, 100, 200, 300, 500, 1000];
const PLUME_ANGLES = [30, 45, 60, 90];
/** Vertex handles shown at once when editing a long line. */
const MAX_HANDLES = 120;
const isRecord = (v: unknown) =>
  !!v && typeof v === "object" && !Array.isArray(v);

const round6 = (n: number) => Math.round(n * 1e6) / 1e6;
const reducedMotion = () =>
  document.documentElement.dataset.motion === "reduced" ||
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
const narrow = () => window.innerWidth <= 900;
/** Touch screen: an object is moved only once selected. */
const coarse = () =>
  typeof matchMedia === "function" && matchMedia("(pointer: coarse)").matches;
/**
 * Below this distance (screen pixels) a drag is a shaky click, not a move:
 * the object stays exactly where it was.
 */
const DRAG_THRESHOLD = 8;
const isView = (v: unknown): v is View =>
  !!v &&
  typeof v === "object" &&
  Number.isFinite((v as View).lat) &&
  Number.isFinite((v as View).lng) &&
  Number.isFinite((v as View).zoom);

function readStore<T>(
  key: string,
  fallback: T,
  ok: (v: unknown) => boolean,
): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    const v = JSON.parse(raw);
    return ok(v) ? (v as T) : fallback;
  } catch {
    return fallback;
  }
}
function writeStore(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage unavailable: preferences simply are not remembered.
  }
}

/**
 * Standard layers of the journal (référentiel « layers »), in its language:
 * the first one (Effets) is the default layer of the drawings.
 */
function standardLayers(ops: Ops) {
  const defaults = defaultListValues("layers", journalLang(ops));
  return {
    effects: listValues(ops, "layers")[0] ?? "Effets",
    dangers: defaults[1] ?? "Dangers",
    means: defaults[2] ?? "Moyens",
    other: defaults[5] ?? "Autre",
  };
}
type Layers = ReturnType<typeof standardLayers>;
const layerForKind = (kind: string, layers: Layers) =>
  kind === "resource"
    ? layers.means
    : kind === "message" || kind === "entry"
      ? layers.effects
      : layers.other;
const symbolForKind = (kind: string) =>
  kind === "resource"
    ? "b:vehicule"
    : kind === "message" || kind === "entry"
      ? "b:incident"
      : "b:point";

/**
 * Direct manipulation of a selected symbol or text: drag the corner to
 * resize, the knob to rotate. Native listeners, so that neither the marker
 * nor the map starts dragging (pointer events work with mouse and touch).
 */
function Handles({
  value,
  onPreview,
  onCommit,
}: {
  value: Style;
  onPreview: (v: Style | null) => void;
  onCommit: (v: Style) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const latest = useRef({ value, onPreview, onCommit });
  latest.current = { value, onPreview, onCommit };
  useEffect(() => {
    const root = ref.current;
    const host = root?.parentElement;
    if (!root || !host) return;
    const stop = (e: Event) => e.stopPropagation();
    const blocked = ["mousedown", "touchstart", "click", "dblclick"];
    const knobs = [...root.querySelectorAll<HTMLElement>("[data-handle]")];
    const offs: (() => void)[] = [];
    for (const knob of knobs) {
      const mode = knob.dataset.handle;
      const down = (e: PointerEvent) => {
        if (e.button > 0) return;
        e.stopPropagation();
        e.preventDefault();
        const box = host.getBoundingClientRect();
        const cx = box.left + box.width / 2;
        const cy = box.top + box.height / 2;
        const start = latest.current.value;
        const d0 = Math.max(8, Math.hypot(e.clientX - cx, e.clientY - cy));
        const a0 = (Math.atan2(e.clientY - cy, e.clientX - cx) * 180) / Math.PI;
        let last: Style | null = null;
        knob.setPointerCapture?.(e.pointerId);
        root.classList.add("active");
        const move = (ev: PointerEvent) => {
          ev.stopPropagation();
          const dx = ev.clientX - cx;
          const dy = ev.clientY - cy;
          if (mode === "size") {
            const k = Math.hypot(dx, dy) / d0;
            last = {
              ...start,
              size: clampSize(Math.round(start.size * k * 20) / 20),
            };
          } else {
            let deg =
              start.rotation + (Math.atan2(dy, dx) * 180) / Math.PI - a0;
            // Snap to 15° steps when close: straight lines are easy.
            const snap = Math.round(deg / 15) * 15;
            if (Math.abs(deg - snap) < 4 || ev.shiftKey) deg = snap;
            last = { ...start, rotation: normalizeAngle(deg) };
          }
          latest.current.onPreview(last);
        };
        const up = (ev: PointerEvent) => {
          ev.stopPropagation();
          knob.removeEventListener("pointermove", move);
          knob.removeEventListener("pointerup", up);
          knob.removeEventListener("pointercancel", up);
          root.classList.remove("active");
          if (last && ev.type === "pointerup") latest.current.onCommit(last);
          else latest.current.onPreview(null);
        };
        knob.addEventListener("pointermove", move);
        knob.addEventListener("pointerup", up);
        knob.addEventListener("pointercancel", up);
      };
      // Keyboard: arrows turn by 15° or resize by a tenth.
      const key = (e: KeyboardEvent) => {
        const v = latest.current.value;
        const up = e.key === "ArrowUp" || e.key === "ArrowRight";
        const downKey = e.key === "ArrowDown" || e.key === "ArrowLeft";
        if (!up && !downKey) return;
        e.preventDefault();
        e.stopPropagation();
        latest.current.onCommit(
          mode === "size"
            ? { ...v, size: clampSize(v.size + (up ? 0.1 : -0.1)) }
            : { ...v, rotation: normalizeAngle(v.rotation + (up ? 15 : -15)) },
        );
      };
      knob.addEventListener("pointerdown", down);
      knob.addEventListener("keydown", key);
      blocked.forEach((t) => knob.addEventListener(t, stop));
      offs.push(() => {
        knob.removeEventListener("pointerdown", down);
        knob.removeEventListener("keydown", key);
        blocked.forEach((t) => knob.removeEventListener(t, stop));
      });
    }
    return () => offs.forEach((off) => off());
  }, []);
  return (
    <div ref={ref} className="map-handles">
      <span
        data-handle="rotate"
        className="map-handle rotate"
        role="slider"
        tabIndex={0}
        aria-label={t("Rotation : glisser, ou flèches pour tourner de 15°")}
        aria-valuemin={-180}
        aria-valuemax={180}
        aria-valuenow={value.rotation}
        aria-valuetext={`${value.rotation}°`}
        title={t("Glisser pour tourner (flèches : 15°)")}
      />
      <span
        data-handle="size"
        className="map-handle size"
        role="slider"
        tabIndex={0}
        aria-label={t("Taille : glisser, ou flèches pour agrandir ou réduire")}
        aria-valuemin={0.25}
        aria-valuemax={8}
        aria-valuenow={value.size}
        aria-valuetext={`×${value.size}`}
        title={t("Glisser pour agrandir ou réduire (flèches : ±{step})", {
          step: formatNumber(0.1),
        })}
      />
    </div>
  );
}

/** Content of a point or text marker, rendered into Leaflet's icon element. */
const PinBody = memo(function PinBody({
  place,
  hot,
  links,
  editable,
  onStyle,
}: {
  place: Place;
  hot: boolean;
  links: number;
  /** Selected and editable: resize and rotate handles. */
  editable: boolean;
  onStyle: (id: string, style: Style) => void;
}) {
  const [draft, setDraft] = useState<Style | null>(null);
  // A saved change (or a change from another post) replaces the preview.
  useEffect(() => setDraft(null), [place.updatedAt]);
  const size = draft?.size ?? place.size;
  const color = hexColor(place.color);
  const rotation = draft?.rotation ?? place.rotation;
  const handles = editable && (
    <Handles
      value={{ size, rotation }}
      onPreview={setDraft}
      onCommit={(v) => {
        setDraft(v);
        onStyle(place.id, v);
      }}
    />
  );
  if (place.kind === "text")
    return (
      <div
        className={`map-text${place.boxed ? " boxed" : ""}${hot ? " hot" : ""}${editable ? " editing" : ""}`}
        style={
          {
            ...(color ? { "--c": color } : {}),
            "--rot": `${rotation}deg`,
            fontSize: `${15 * size}px`,
            maxWidth: `${Math.round(280 * Math.max(1, size))}px`,
          } as CSSProperties
        }
      >
        {place.label || t("Texte")}
        {handles}
      </div>
    );
  const box = Math.round(34 * size);
  return (
    <div
      className={`map-pin${hot ? " hot" : ""}${place.frame ? " framed" : ""}${editable ? " editing" : ""}`}
      style={
        {
          "--box": `${box}px`,
          ...(color ? { "--ring": color } : {}),
        } as CSSProperties
      }
    >
      <div
        className="map-pin-symbol"
        style={{ transform: rotation ? `rotate(${rotation}deg)` : undefined }}
      >
        <Glyph
          symbol={place.symbol}
          color={color}
          size={box}
          frame={place.frame}
        />
        {handles}
      </div>
      {links > 0 && <span className="map-pin-badge">{links}</span>}
      {place.label && (
        <span
          className="map-pin-label"
          style={
            size > 1.2
              ? { fontSize: `${11.5 * Math.min(2, size * 0.85)}px` }
              : undefined
          }
        >
          {place.label}
        </span>
      )}
    </div>
  );
});

function MapHover({ hover }: { hover: Hover }) {
  const left = Math.max(8, Math.min(hover.x + 18, window.innerWidth - 336));
  const top =
    hover.y + 300 > window.innerHeight
      ? Math.max(8, hover.y - 300)
      : hover.y + 18;
  return createPortal(
    <div
      className="hovercard map-hovercard"
      style={{ left, top }}
      role="tooltip"
    >
      <ItemPreview target={hover.target} limit={10} />
      {hover.hint && <footer>{hover.hint}</footer>}
    </div>,
    document.body,
  );
}

type Entry = {
  layer: L.Marker | L.Polyline | L.Polygon;
  el?: HTMLElement;
  updatedAt: string;
  kind: Place["kind"];
  /** Colours of the theme a shape was drawn with (canvas: no CSS). */
  theme?: string;
  /** Marker currently on the map (markers far outside the view are not). */
  shown?: boolean;
};

/** Colour of each layer family in the current theme (CSS variables). */
function toneColors(el: Element | null): Record<string, string> {
  const style = el ? getComputedStyle(el) : null;
  const out: Record<string, string> = {};
  for (const tone of Object.keys(TONE_COLOR))
    out[tone] =
      style?.getPropertyValue(`--map-${tone}`).trim() ||
      TONE_COLOR[tone as keyof typeof TONE_COLOR];
  return out;
}

/**
 * Same objects as long as nothing changed: an edit elsewhere in the
 * journal re-validates every record (new objects), which would redraw
 * every symbol on the map.
 */
function useStablePlaces(list: Place[]): Place[] {
  const memo = useRef<{ list: Place[]; byId: Map<string, Place> }>({
    list: [],
    byId: new Map(),
  });
  return useMemo(() => {
    const previous = memo.current;
    const byId = new Map<string, Place>();
    let same = list.length === previous.list.length;
    const out = list.map((p, i) => {
      const old = previous.byId.get(p.id);
      const keep =
        old && old.updatedAt === p.updatedAt && old.kind === p.kind ? old : p;
      byId.set(p.id, keep);
      if (keep !== previous.list[i]) same = false;
      return keep;
    });
    const result = same ? previous.list : out;
    memo.current = { list: result, byId };
    return result;
  }, [list]);
}

export function MapModule() {
  const app = useApp();
  const {
    journal,
    live,
    viewAt,
    author,
    readOnly,
    graph,
    updateOps: updateOpsRaw,
    lists,
    focus,
    setFocus,
    open,
    toast,
    exportCenter,
  } = app;
  const catalog = useCatalog();
  useCustomSymbolsSync(journal.ops.symbols, live.ops.symbols);
  const allPlaces = useStablePlaces(journal.ops.places);
  const settingsCenter = journal.ops.settings.mapCenter;

  /* ---------- Undo / redo (this post, this session) ---------- */
  const liveOps = useRef(live.ops);
  liveOps.current = live.ops;
  const history = useRef<{ undo: Change[]; redo: Change[] }>({
    undo: [],
    redo: [],
  });
  const [, setHistoryTick] = useState(0);
  // Every change of the map module (sheet, dialogs included) goes through
  // here: the state of each object before and after is remembered.
  const updateOps = useCallback(
    (change: (ops: Ops) => Ops) => {
      const before = liveOps.current;
      let items: Change["items"] = [];
      try {
        items = diffOps(before, change(before));
      } catch {
        // The store reports the error below.
      }
      updateOpsRaw(change);
      if (!items.length) return;
      const h = history.current;
      const next: Change = { at: Date.now(), items };
      const merged = mergeChange(h.undo[h.undo.length - 1], next);
      if (merged) h.undo[h.undo.length - 1] = merged;
      else h.undo = [...h.undo, next].slice(-100);
      h.redo = [];
      setHistoryTick((t) => t + 1);
    },
    [updateOpsRaw],
  );
  const mapApp = useMemo(() => ({ ...app, updateOps }), [app, updateOps]);
  const step = useCallback(
    (direction: "undo" | "redo") => {
      const h = history.current;
      const from = direction === "undo" ? h.undo : h.redo;
      const change = from[from.length - 1];
      if (!change) return;
      if (readOnlyRef.current)
        return toast(
          t("Lecture seule : vous consultez le passé ou un journal clôturé."),
        );
      const now = new Date().toISOString();
      let result: ReturnType<typeof applyChange> | null = null;
      try {
        updateOpsRaw((ops) => {
          result = applyChange(ops, change, direction, now);
          return result.ops;
        });
      } catch (err) {
        return toast((err as Error).message);
      }
      const done = result as ReturnType<typeof applyChange> | null;
      if (!done) return;
      from.pop();
      (direction === "undo" ? h.redo : h.undo).push(done.change);
      setHistoryTick((t) => t + 1);
      if (done.conflicts)
        toast(
          done.applied
            ? tn(
                done.conflicts,
                "{n} objet modifié depuis par un autre poste : laissé tel quel.",
                "{n} objets modifiés depuis par un autre poste : laissés tels quels.",
              )
            : t(
                "Rien à annuler : l’objet a été modifié depuis par un autre poste.",
              ),
        );
    },
    [updateOpsRaw, toast],
  );
  const readOnlyRef = useRef(readOnly);
  readOnlyRef.current = readOnly;
  const canUndo = history.current.undo.length > 0 && !readOnly;
  const canRedo = history.current.redo.length > 0 && !readOnly;

  const shell = useRef<HTMLDivElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const groups = useRef<{
    objects: L.LayerGroup;
    ghosts: L.LayerGroup;
    sketch: L.LayerGroup;
    dots: L.LayerGroup;
    edit: L.LayerGroup;
    line: L.Polyline;
    poly: L.Polygon;
    rubber: L.Polyline;
  } | null>(null);
  const registry = useRef(new Map<string, Entry>());
  const coordsEl = useRef<HTMLSpanElement>(null);
  const liveEl = useRef<HTMLElement>(null);
  const flashMarker = useRef<L.Layer | null>(null);
  const baseButton = useRef<HTMLButtonElement>(null);

  const [height, setHeight] = useState(560);
  // Background of the implicit main map (before any map record).
  const [localBase, setLocalBase] = useState<BaseId>(() =>
    readStore<BaseId>("orion.map.base", "color", isBase),
  );
  const [baseMenu, setBaseMenu] = useState(false);
  const [tool, setTool] = useState<Tool>("select");
  const [armed, setArmed] = useState(() => recentSymbols()[0] ?? "b:incident");
  const [pending, setPending] = useState<{ target: Ref; title: string } | null>(
    null,
  );
  const [draft, setDraft] = useState<LatLng[]>([]);
  const [measureDone, setMeasureDone] = useState(false);
  // Standard layers in the language of the journal (Effets, Auswirkungen…).
  const layers = standardLayers(journal.ops);
  const [drawLayer, setDrawLayer] = useState(() =>
    readStore(
      "orion.map.drawLayer",
      layers.effects,
      (v) => typeof v === "string",
    ),
  );
  const [panel, setPanel] = useState<Panel>(() => (narrow() ? null : "list"));
  const [sheetId, setSheetId] = useState<string | null>(null);
  const [hover, setHover] = useState<Hover | null>(null);
  const [highlight, setHighlight] = useState<string | null>(null);
  const [localHidden, setLocalHidden] = useState<string[]>(() =>
    readStore<string[]>("orion.map.hidden", [], (v) => Array.isArray(v)).filter(
      (x) => typeof x === "string",
    ),
  );
  const [overrides, setOverrides] = useState<Record<string, Override>>({});
  const [chosenMap, setChosenMap] = useState(() =>
    readStore(
      `orion.map.current.${journal.id}`,
      MAIN_MAP,
      (v) => typeof v === "string",
    ),
  );
  const [mapDialog, setMapDialog] = useState<"new" | "edit" | null>(null);
  const [importing, setImporting] = useState(false);
  const [showGhosts, setShowGhosts] = useState(() =>
    readStore("orion.map.ghosts", true, (v) => typeof v === "boolean"),
  );
  // Live positions of the teams (never stored, hidden in the past).
  const [showLive, setShowLive] = useState(() =>
    readStore("orion.map.live", true, (v) => typeof v === "boolean"),
  );
  const [ghostMenu, setGhostMenu] = useState<
    (Ghost & { x: number; y: number }) | null
  >(null);
  const [shapeEdit, setShapeEdit] = useState<{
    id: string;
    points: LatLng[];
  } | null>(null);
  // Objects locked in place (this browser): no accidental move while
  // panning or zooming.
  const [locked, setLocked] = useState(() =>
    readStore("orion.map.locked", false, (v) => typeof v === "boolean"),
  );
  // Why the background is missing: the device is offline, or it is online
  // but the tile server does not answer.
  const [tileError, setTileError] = useState<"offline" | "unreachable" | null>(
    null,
  );
  const baseLayer = useRef<L.TileLayer | null>(null);
  const [slots, setSlots] = useState<{ id: string; el: HTMLElement }[]>([]);
  const hoverTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  // geo.admin.ch overlays chosen on this post.
  const [overlays, setOverlays] = useState<ActiveOverlays>(() => {
    const v = readStore<ActiveOverlays>("orion.map.overlays", {}, isRecord);
    const out: ActiveOverlays = {};
    for (const [id, o] of Object.entries(v))
      if (overlayById(id) && typeof o === "number") out[id] = o;
    return out;
  });
  const [liveStatus, setLiveStatus] = useState<Record<string, LiveStatus>>({});
  const overlayManager = useRef<OverlayManager | null>(null);
  const [info, setInfo] = useState<Info | null>(null);
  const [online, setOnline] = useState(() => navigator.onLine);
  const [showGrid, setShowGrid] = useState(() =>
    readStore("orion.map.grid", false, (v) => typeof v === "boolean"),
  );
  const [crosshair, setCrosshair] = useState(false);
  const [coordsMenu, setCoordsMenu] = useState<LatLng | null>(null);
  const coordsButton = useRef<HTMLButtonElement>(null);
  const lastCursor = useRef<LatLng | null>(null);
  const [full, setFull] = useState(false);
  const [sectorDialog, setSectorDialog] = useState(false);
  const [sectorBox, setSectorBox] = useState<Bounds | null>(null);
  const [printing, setPrinting] = useState(false);
  const [ringsText, setRingsText] = useState(() =>
    readStore(
      "orion.map.rings",
      "100, 300, 1000",
      (v) => typeof v === "string",
    ),
  );
  const [plume, setPlume] = useState<Plume>(() =>
    readStore<Plume>(
      "orion.map.plume",
      { bearing: 45, angle: 45, length: 1000 },
      (v) =>
        isRecord(v) &&
        Number.isFinite((v as Plume).bearing) &&
        Number.isFinite((v as Plume).angle) &&
        Number.isFinite((v as Plume).length),
    ),
  );
  const renderer = useRef<L.Canvas | null>(null);
  const [themeKey, setThemeKey] = useState(0);
  const dragging = useRef(new Set<string>());
  const [nudged, setNudged] = useState("");

  /* ---------- Maps of the operation ---------- */
  const maps = useMemo(() => sortMaps(journal.ops.maps), [journal.ops.maps]);
  const known = useMemo(() => new Set(maps.map((m) => m.id)), [maps]);
  const currentMap: OpsMap | null =
    maps.find((m) => m.id === chosenMap) ?? maps[0] ?? null;
  const mapId = currentMap?.id ?? MAIN_MAP;
  const override = overrides[mapId];
  const base: BaseId = currentMap
    ? (override?.base ?? (isBase(currentMap.base) ? currentMap.base : "color"))
    : localBase;
  const hiddenList = currentMap
    ? (override?.hidden ?? currentMap.hidden)
    : localHidden;
  const hidden = useMemo(() => new Set(hiddenList), [hiddenList]);
  // Back to the present: the records speak again.
  useEffect(() => {
    if (!readOnly) setOverrides({});
    else {
      // Entering the time machine (or a closed journal): drop any drawing
      // or editing in progress, and close the dialogs that write.
      setTool("select");
      setDraft([]);
      setMeasureDone(false);
      setShapeEdit(null);
      setPending(null);
      setMapDialog(null);
      setImporting(false);
      setPanel((p) => (p === "symbols" ? (narrow() ? null : "list") : p));
    }
  }, [readOnly]);

  const places = useMemo(
    () => (mapId ? allPlaces.filter((p) => onMap(p, mapId, known)) : allPlaces),
    [allPlaces, mapId, known],
  );
  const byId = useMemo(
    () => new Map(allPlaces.map((p) => [p.id, p])),
    [allPlaces],
  );
  const sheetPlace = sheetId ? byId.get(sheetId) : undefined;
  const visible = useMemo(
    () =>
      places.filter((p) => !hidden.has(layerKey(p)) && p.id !== shapeEdit?.id),
    [places, hidden, shapeEdit?.id],
  );
  const canDrag = tool === "select" && !readOnly && !locked;

  // Items citing coordinates that no map object stands for yet.
  const ghosts = useMemo(() => {
    const placed = new Set<string>();
    for (const e of graph.edges) {
      if (e.a.startsWith("place:")) placed.add(e.b);
      if (e.b.startsWith("place:")) placed.add(e.a);
    }
    const out: Ghost[] = [];
    const consider = (target: Ref, text: string) => {
      if (!text.trim() || placed.has(target)) return;
      const item = graph.byRef.get(target);
      const at = parseCoordinates(text);
      if (item && at)
        out.push({ target, lat: at[0], lng: at[1], title: item.title });
    };
    for (const e of journal.entries)
      consider(ref("entry", e.id), current(e).coordinates);
    for (const m of journal.ops.messages)
      consider(ref("message", m.id), m.coordinates);
    return out;
  }, [graph, journal.entries, journal.ops.messages]);

  const panelOpen = useRef(false);
  panelOpen.current = !!panel;

  // Latest state for Leaflet callbacks registered once.
  const state = useRef({
    tool,
    draft,
    measureDone,
    readOnly,
    canDrag,
    byId,
    mapId,
    crosshair,
    showGrid,
    plume,
  });
  state.current = {
    tool,
    draft,
    measureDone,
    readOnly,
    canDrag,
    byId,
    mapId,
    crosshair,
    showGrid,
    plume,
  };

  /* ---------- Layout ---------- */
  useLayoutEffect(() => {
    const el = shell.current;
    if (!el) return;
    const fit = () => {
      const top = el.getBoundingClientRect().top + window.scrollY;
      setHeight(
        Math.max(
          380,
          Math.round(window.innerHeight - top - (narrow() ? 92 : 18)),
        ),
      );
    };
    fit();
    const late = setTimeout(fit, 450);
    const observer = new ResizeObserver(fit);
    const main = el.closest("main");
    if (main) observer.observe(main);
    window.addEventListener("resize", fit);
    return () => {
      clearTimeout(late);
      observer.disconnect();
      window.removeEventListener("resize", fit);
    };
  }, []);

  /* ---------- Map ---------- */
  // Last view of each map in this browser; the saved framing of the map
  // (shared by every post) otherwise.
  const viewKey = (id: string) =>
    id ? `orion.map.view.${journal.id}.${id}` : `orion.map.view.${journal.id}`;
  const framingOf = (m: OpsMap | null): View | null =>
    m ? { lat: m.lat, lng: m.lng, zoom: m.zoom } : settingsCenter;
  const viewOf = (m: OpsMap | null): View =>
    readStore<View | null>(viewKey(m?.id ?? MAIN_MAP), null, isView) ??
    framingOf(m) ??
    GENEVA;
  // Created once per journal (the module remounts on a journal switch).
  useEffect(() => {
    if (!root.current) return;
    const start = viewOf(currentMap);
    const m = L.map(root.current, {
      center: [start.lat, start.lng],
      zoom: start.zoom,
      minZoom: 3,
      maxZoom: 20,
      zoomControl: false,
      attributionControl: true,
      worldCopyJump: true,
    });
    m.attributionControl.setPrefix(
      '<a href="https://leafletjs.com" target="_blank" rel="noopener noreferrer">Leaflet</a>',
    );
    L.control
      .scale({ imperial: false, position: "bottomleft", maxWidth: 120 })
      .addTo(m);
    // Lines and areas on one canvas: thousands of vertices stay fluid.
    renderer.current = L.canvas({ padding: 0.5, tolerance: 6 });
    const gridPane = m.createPane("orion-grid");
    gridPane.style.zIndex = "360";
    gridPane.style.pointerEvents = "none";
    gridPane.classList.add("map-grid-pane");
    overlayManager.current = new OverlayManager(
      m,
      (id, status) => setLiveStatus((s) => ({ ...s, [id]: status })),
      (picked, at) => {
        const p = m.latLngToContainerPoint(at);
        const box = m.getContainer().getBoundingClientRect();
        setInfo({ x: box.left + p.x, y: box.top + p.y, items: [picked] });
      },
    );
    const objects = L.layerGroup().addTo(m);
    const ghostsGroup = L.layerGroup().addTo(m);
    const sketch = L.layerGroup().addTo(m);
    const edit = L.layerGroup().addTo(m);
    const dots = L.layerGroup().addTo(sketch);
    const line = L.polyline([], {
      className: "map-sketch",
      weight: 3,
      interactive: false,
    }).addTo(sketch);
    const poly = L.polygon([], {
      className: "map-sketch area",
      weight: 2,
      interactive: false,
    }).addTo(sketch);
    const rubber = L.polyline([], {
      className: "map-sketch rubber",
      weight: 2,
      dashArray: "4 6",
      interactive: false,
    }).addTo(sketch);
    groups.current = {
      objects,
      ghosts: ghostsGroup,
      sketch,
      dots,
      edit,
      line,
      poly,
      rubber,
    };
    map.current = m;

    const showCenter = () => {
      const c = m.getCenter();
      if (coordsEl.current)
        coordsEl.current.textContent = formatPosition(c.lat, c.wrap().lng);
    };
    showCenter();
    m.on("mousemove", (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng.wrap();
      lastCursor.current = [lat, lng];
      if (coordsEl.current && !state.current.crosshair)
        coordsEl.current.textContent = formatPosition(lat, lng);
      drawSketch(e.latlng);
    });
    m.on("mouseout", () => drawSketch(null));
    m.on("move", () => {
      if (state.current.crosshair) showCenter();
    });
    m.on("moveend", () => {
      const c = m.getCenter().wrap();
      writeStore(viewKey(state.current.mapId), {
        lat: round6(c.lat),
        lng: round6(c.lng),
        zoom: m.getZoom(),
      });
      if (narrow() || state.current.crosshair) showCenter();
      handlers.current.moved();
    });
    m.on("click", (e: L.LeafletMouseEvent) =>
      handlers.current.mapClick(e.latlng),
    );
    m.on("dblclick", () => handlers.current.finish());
    m.on("movestart", () => setGhostMenu(null));
    // A glide in progress would fight the zoom animation: land at once.
    m.on("zoomstart", () => {
      for (const el of m
        .getContainer()
        .querySelectorAll<HTMLElement>(".map-moving"))
        el.classList.remove("map-moving");
    });

    const observer = new ResizeObserver(() => m.invalidateSize());
    observer.observe(root.current);
    // Another colour theme: the canvas shapes take its layer colours.
    const themes = new MutationObserver(() => setThemeKey((k) => k + 1));
    themes.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme", "data-palette"],
    });
    const registryMap = registry.current;
    return () => {
      observer.disconnect();
      themes.disconnect();
      overlayManager.current?.destroy();
      overlayManager.current = null;
      registryMap.clear();
      groups.current = null;
      map.current = null;
      m.remove();
    };
  }, []);

  /* ---------- geo.admin.ch overlays ---------- */
  useEffect(() => {
    overlayManager.current?.sync(overlays);
    writeStore("orion.map.overlays", overlays);
  }, [overlays]);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  /* ---------- Swiss grid ---------- */
  const gridGroup = useRef<L.LayerGroup | null>(null);
  function drawGrid() {
    const m = map.current;
    gridGroup.current?.remove();
    gridGroup.current = null;
    if (!m || !state.current.showGrid) return;
    const spacing = gridSpacingForZoom(m.getZoom());
    if (!spacing) return;
    const b = m.getBounds().pad(0.05);
    const lines = gridLines(
      [
        [b.getSouth(), b.getWest()],
        [b.getNorth(), b.getEast()],
      ],
      spacing,
    );
    const group = L.layerGroup();
    // Labels along the top edge (east values) and along the right edge,
    // beside the controls (north values): the left edge has the panel.
    const size = m.getSize();
    const top = m.containerPointToLatLng([size.x / 2, 34]);
    const left = m.containerPointToLatLng([
      Math.max(40, size.x - (narrow() ? 90 : 110)),
      size.y / 2,
    ]);
    let edge: { north: number; east: number };
    try {
      edge = {
        north: toMN95(top.lat, top.lng).north,
        east: toMN95(left.lat, left.lng).east,
      };
    } catch {
      return;
    }
    for (const line of lines) {
      L.polyline(line.points, {
        pane: "orion-grid",
        className: `map-grid-line${line.value % (spacing * 10) === 0 ? " major" : ""}`,
        weight: 1,
        interactive: false,
      }).addTo(group);
      let anchor: LatLng;
      try {
        const p =
          line.axis === "east"
            ? fromMN95(line.value, edge.north)
            : fromMN95(edge.east, line.value);
        anchor = [p.lat, p.lng];
      } catch {
        continue;
      }
      const el = document.createElement("span");
      el.className = `map-grid-label ${line.axis}`;
      el.textContent = gridLabel(line.value, spacing);
      L.marker(anchor, {
        pane: "orion-grid",
        interactive: false,
        keyboard: false,
        icon: L.divIcon({ html: el, className: "map-icon", iconSize: [0, 0] }),
      }).addTo(group);
    }
    group.addTo(m);
    gridGroup.current = group;
  }
  useEffect(() => {
    drawGrid();
    writeStore("orion.map.grid", showGrid);
  }, [showGrid]);
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    const c = m.getCenter();
    if (coordsEl.current)
      coordsEl.current.textContent = formatPosition(c.lat, c.wrap().lng);
  }, [crosshair]);

  // Another map chosen: its own view.
  const shownMap = useRef(mapId);
  useEffect(() => {
    if (shownMap.current === mapId) return;
    shownMap.current = mapId;
    const m = map.current;
    if (!m) return;
    const v = viewOf(currentMap);
    if (reducedMotion()) m.setView([v.lat, v.lng], v.zoom);
    else m.flyTo([v.lat, v.lng], v.zoom, { duration: 0.8 });
    setDraft([]);
    setShapeEdit(null);
  }, [mapId]);

  /* ---------- Base layer ---------- */
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    const b = BASES[base];
    setTileError(null);
    let loaded = 0;
    let failed = 0;
    const layer = L.tileLayer(b.url, {
      maxZoom: 20,
      maxNativeZoom: b.native,
      crossOrigin: true,
      className: b.className,
      attribution: b.swiss ? SWISSTOPO() : OSM(),
      ...(b.swiss ? { bounds: L.latLngBounds(SWISS_BOUNDS) } : {}),
    });
    layer.on("loading", () => {
      loaded = 0;
      failed = 0;
    });
    layer.on("tileload", () => {
      loaded++;
      setTileError(null);
    });
    layer.on("tileerror", () => {
      failed++;
      if (!navigator.onLine) setTileError("offline");
      // A few isolated misses (edge of the coverage) are not an outage.
      else if (failed >= 4 && loaded === 0) setTileError("unreachable");
    });
    // Back online: fetch the missing tiles again at once.
    const online = () => {
      setTileError(null);
      layer.redraw();
    };
    const offline = () => setTileError("offline");
    window.addEventListener("online", online);
    window.addEventListener("offline", offline);
    layer.addTo(m);
    layer.bringToBack();
    baseLayer.current = layer;
    return () => {
      window.removeEventListener("online", online);
      window.removeEventListener("offline", offline);
      baseLayer.current = null;
      layer.off();
      layer.remove();
    };
  }, [base]);

  /* ---------- Objects ---------- */
  const handlers = useRef({
    mapClick: (_: L.LatLng) => {},
    finish: () => {},
    freehand: (_points: LatLng[]) => {},
    style: (_id: string, _style: Style) => {},
    placeClick: (_id: string, _at: L.LatLng) => {},
    placeOver: (_id: string, _e: MouseEvent) => {},
    placeOut: () => {},
    placeMoved: (_id: string, _at: L.LatLng) => {},
    ghostOver: (_g: Ghost, _e: MouseEvent) => {},
    ghostClick: (_g: Ghost, _e: MouseEvent) => {},
    moved: () => {},
  });

  function makeShape(p: Place, tones: Record<string, string>) {
    const tone = toneOf(p.layer);
    const w = p.weight;
    const color = hexColor(p.color) || tones[tone] || TONE_COLOR[tone];
    const options: L.PolylineOptions = {
      renderer: renderer.current ?? undefined,
      className: `map-shape tone-${tone}${p.kind === "area" ? " area" : ""}`,
      weight: w,
      color,
      fillColor: color,
      opacity: 0.95,
      fillOpacity: 0.16,
      lineCap: "round",
      lineJoin: "round",
      dashArray:
        p.dash === "dash"
          ? `${w * 3} ${w * 2.2}`
          : p.dash === "dot"
            ? `0.1 ${w * 2}`
            : undefined,
    };
    const shape =
      p.kind === "area"
        ? L.polygon(
            p.holes?.length ? [p.points, ...p.holes] : p.points,
            options,
          )
        : L.polyline(p.points, options);
    if (p.label) {
      const tip = document.createElement("span");
      tip.textContent = p.label;
      shape.bindTooltip(tip, {
        permanent: true,
        direction: "center",
        className: "map-shape-label",
        interactive: false,
      });
    }
    shape.on("click", (e: L.LeafletMouseEvent) => {
      if (state.current.tool !== "select") return;
      L.DomEvent.stopPropagation(e);
      handlers.current.placeClick(p.id, e.latlng);
    });
    shape.on("mouseover", (e: L.LeafletMouseEvent) =>
      handlers.current.placeOver(p.id, e.originalEvent),
    );
    shape.on("mouseout", () => handlers.current.placeOut());
    return shape;
  }

  function makeMarker(p: Place) {
    const el = document.createElement("div");
    el.className = "map-pin-host";
    const text = p.kind === "text";
    // Zero-sized anchor: the content is centred on the point by CSS, so a
    // new size or rotation never rebuilds the marker.
    const marker = L.marker(p.points[0], {
      icon: L.divIcon({
        html: el,
        className: text ? "map-icon text" : "map-icon",
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      }),
      draggable: state.current.canDrag,
      keyboard: true,
      riseOnHover: true,
      autoPan: true,
    });
    marker.on("add", () => {
      const icon = marker.getElement();
      icon?.setAttribute("role", "button");
      icon?.setAttribute(
        "aria-label",
        state.current.byId.get(p.id)?.label || t("Objet de la carte"),
      );
    });
    marker.on("click", (e: L.LeafletMouseEvent) =>
      handlers.current.placeClick(p.id, e.latlng),
    );
    marker.on("mouseover", (e: L.LeafletMouseEvent) =>
      handlers.current.placeOver(p.id, e.originalEvent),
    );
    marker.on("mouseout", () => handlers.current.placeOut());
    // A drag moves the object only when it is deliberate: a shaky click,
    // a second finger (pinch to zoom) or a zoom during the drag puts the
    // object back exactly where it was.
    let origin: L.LatLng | null = null;
    let cancelled = false;
    const cancel = () => {
      cancelled = true;
    };
    const touch = (e: TouchEvent) => {
      if (e.touches.length > 1) cancel();
    };
    marker.on("dragstart", () => {
      handlers.current.placeOut();
      origin = marker.getLatLng();
      cancelled = false;
      // Positions arriving from other posts wait until the drop.
      dragging.current.add(p.id);
      document.addEventListener("touchstart", touch, true);
      map.current?.on("zoomstart", cancel);
    });
    marker.on("dragend", () => {
      document.removeEventListener("touchstart", touch, true);
      map.current?.off("zoomstart", cancel);
      const from = origin;
      origin = null;
      // Leaflet may still apply the last pointer position in the next
      // animation frame: decide once it has.
      requestAnimationFrame(() => {
        dragging.current.delete(p.id);
        const m = map.current;
        if (!m || !from) return;
        const to = marker.getLatLng();
        const moved = m
          .latLngToContainerPoint(to)
          .distanceTo(m.latLngToContainerPoint(from));
        if (cancelled || moved < DRAG_THRESHOLD) {
          // Back to the latest known position (maybe moved meanwhile by
          // another post), not to where the drag started.
          const latest = state.current.byId.get(p.id)?.points[0];
          marker.setLatLng(latest ?? from);
        } else handlers.current.placeMoved(p.id, to);
      });
    });
    return { marker, el };
  }

  const moving = useRef(
    new WeakMap<HTMLElement, ReturnType<typeof setTimeout>>(),
  ).current;
  const selected = useRef(sheetId);
  selected.current = sheetId;
  /**
   * Symbols far outside the view are taken off the map (hundreds of
   * symbols on the whole canton would otherwise weigh on every pan).
   */
  function cull(): boolean {
    const m = map.current;
    const g = groups.current;
    if (!m || !g) return false;
    const view = m.getBounds().pad(0.6);
    let changed = false;
    for (const [id, e] of registry.current) {
      if (!e.el) continue;
      const marker = e.layer as L.Marker;
      const inside =
        view.contains(marker.getLatLng()) ||
        id === selected.current ||
        dragging.current.has(id);
      if (inside && !e.shown) {
        marker.addTo(g.objects);
        e.shown = true;
        changed = true;
      } else if (!inside && e.shown) {
        marker.remove();
        e.shown = false;
        changed = true;
      }
    }
    return changed;
  }
  const publishSlots = () =>
    setSlots(
      [...registry.current]
        .filter(([, e]) => e.el && e.shown)
        .map(([id, e]) => ({ id, el: e.el! })),
    );
  useEffect(() => {
    const g = groups.current;
    if (!g) return;
    const reg = registry.current;
    const seen = new Set<string>();
    const theme = String(themeKey);
    // Layer colours of the theme shown (read here: the shell exists).
    const tones = toneColors(shell.current);
    let changed = false;
    for (const p of visible) {
      seen.add(p.id);
      const known = reg.get(p.id);
      if (
        known &&
        known.updatedAt === p.updatedAt &&
        known.kind === p.kind &&
        (known.el || known.theme === theme)
      )
        continue;
      // Being dragged here: a position from another post waits for the drop.
      if (known && dragging.current.has(p.id)) continue;
      if (known && known.kind === p.kind && known.el) {
        const marker = known.layer as L.Marker;
        const was = marker.getLatLng();
        const [lat, lng] = p.points[0];
        const icon = marker.getElement();
        // Moved by another post or by the replay: glide to the new place.
        // A move made here (drag) is already in place: no glide, or the
        // symbol would lag behind the map during the next zoom.
        const m = map.current;
        const far =
          !!m &&
          m
            .latLngToContainerPoint(was)
            .distanceTo(m.latLngToContainerPoint([lat, lng])) > 2;
        if (
          icon &&
          far &&
          !icon.classList.contains("leaflet-drag-target") &&
          !reducedMotion()
        ) {
          icon.classList.add("map-moving");
          clearTimeout(moving.get(icon));
          moving.set(
            icon,
            setTimeout(() => icon.classList.remove("map-moving"), 700),
          );
        }
        marker.setLatLng(p.points[0]);
        marker
          .getElement()
          ?.setAttribute("aria-label", p.label || t("Objet de la carte"));
        known.updatedAt = p.updatedAt;
        continue;
      }
      if (known) {
        known.layer.remove();
        reg.delete(p.id);
        changed ||= !!known.el;
      }
      if (p.kind === "point" || p.kind === "text") {
        const { marker, el } = makeMarker(p);
        reg.set(p.id, {
          layer: marker,
          el,
          updatedAt: p.updatedAt,
          kind: p.kind,
          shown: false,
        });
        changed = true;
      } else {
        const shape = makeShape(p, tones).addTo(g.objects);
        reg.set(p.id, {
          layer: shape,
          updatedAt: p.updatedAt,
          kind: p.kind,
          theme,
        });
      }
    }
    for (const [id, e] of reg)
      if (!seen.has(id)) {
        e.layer.remove();
        reg.delete(id);
        changed ||= !!e.el;
      }
    if (cull()) changed = true;
    if (changed) publishSlots();
  }, [visible, themeKey]);

  // Dragging only with the selection tool, objects unlocked; on a touch
  // screen only the selected object, so that panning or pinching over a
  // symbol never moves it.
  useEffect(() => {
    const touch = coarse();
    for (const [id, e] of registry.current) {
      const dragging = (e.layer as L.Marker).dragging;
      if (!e.el || !dragging) continue;
      if (canDrag && (!touch || id === sheetId)) dragging.enable();
      else dragging.disable();
    }
  }, [canDrag, slots, sheetId]);

  // Hovered or opened object stands out.
  const hot = hover?.target.startsWith("place:")
    ? parseRef(hover.target).id
    : null;
  const hotShapes = useRef(new Set<string>());
  useEffect(() => {
    // Canvas shapes: a thicker, opaque stroke instead of a CSS class.
    const next = new Set<string>();
    for (const id of [highlight, sheetId, hot])
      if (id && registry.current.get(id) && !registry.current.get(id)!.el)
        next.add(id);
    for (const id of new Set([...hotShapes.current, ...next])) {
      const e = registry.current.get(id);
      const p = byId.get(id);
      if (!e || e.el || !p) continue;
      const on = next.has(id);
      (e.layer as L.Polyline).setStyle({
        weight: on ? p.weight + 2.5 : p.weight,
        opacity: on ? 1 : 0.95,
        fillOpacity: on ? 0.26 : 0.16,
      });
      if (on) (e.layer as L.Polyline).bringToFront();
    }
    hotShapes.current = next;
  }, [highlight, sheetId, hot, visible, byId]);

  /* ---------- Ghosts ---------- */
  useEffect(() => {
    const g = groups.current;
    if (!g) return;
    g.ghosts.clearLayers();
    if (!showGhosts) return;
    for (const ghost of ghosts) {
      const hue = KIND_INFO[parseRef(ghost.target).kind].hue;
      const marker = L.marker([ghost.lat, ghost.lng], {
        icon: L.divIcon({
          html: `<div class="map-ghost" style="--h:${hue}"><i></i></div>`,
          className: "map-icon",
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        }),
        keyboard: true,
      });
      marker.on("add", () => {
        marker
          .getElement()
          ?.setAttribute(
            "aria-label",
            t("Position citée : {title}", { title: ghost.title }),
          );
      });
      marker.on("mouseover", (e: L.LeafletMouseEvent) =>
        handlers.current.ghostOver(ghost, e.originalEvent),
      );
      marker.on("mouseout", () => handlers.current.placeOut());
      marker.on("click", (e: L.LeafletMouseEvent) =>
        handlers.current.ghostClick(ghost, e.originalEvent),
      );
      marker.addTo(g.ghosts);
    }
  }, [ghosts, showGhosts]);

  /* ---------- Sketch (drawing and measuring) ---------- */
  function drawSketch(cursor: L.LatLng | null) {
    const g = groups.current;
    if (!g) return;
    const { tool: tl, draft: pts, measureDone: done } = state.current;
    const drawing = DRAWING.includes(tl);
    const live =
      drawing && !done && cursor
        ? [...pts, [cursor.lat, cursor.lng] as LatLng]
        : pts;
    if (!drawing || !pts.length) {
      g.line.setLatLngs([]);
      g.poly.setLatLngs([]);
      g.rubber.setLatLngs([]);
      if (liveEl.current) liveEl.current.textContent = "";
      return;
    }
    if (tl === "circle") {
      const center = pts[0];
      const r = cursor && !done ? lengthOf([center, live[live.length - 1]]) : 0;
      g.line.setLatLngs([]);
      g.poly.setLatLngs(r ? circlePoints(center, r) : []);
      g.rubber.setLatLngs(r ? [center, live[live.length - 1]] : []);
      if (liveEl.current)
        liveEl.current.textContent = r
          ? t("rayon {r} · surface {a}", {
              r: formatDistance(r),
              a: formatArea(Math.PI * r * r),
            })
          : "";
      return;
    }
    if (tl === "sector") {
      // The cursor sets direction and length; without it, the values typed.
      const apex = pts[0];
      const end = cursor && !done ? live[live.length - 1] : null;
      const { plume: pl } = state.current;
      const bearing = end ? bearingOf(apex, end) : pl.bearing;
      const length = end ? Math.max(10, lengthOf([apex, end])) : pl.length;
      g.line.setLatLngs([]);
      g.poly.setLatLngs(sectorPoints(apex, bearing, pl.angle, length));
      g.rubber.setLatLngs(end ? [apex, end] : []);
      if (liveEl.current)
        liveEl.current.textContent = t("vers {dir} {deg}° · {len}", {
          dir: compass(bearing),
          deg: Math.round(bearing),
          len: formatDistance(length),
        });
      return;
    }
    if (tl === "box") {
      const a = pts[0];
      const b = cursor ? live[live.length - 1] : null;
      g.line.setLatLngs([]);
      g.rubber.setLatLngs([]);
      g.poly.setLatLngs(
        b
          ? [
              [a[0], a[1]],
              [a[0], b[1]],
              [b[0], b[1]],
              [b[0], a[1]],
            ]
          : [],
      );
      if (liveEl.current && b)
        liveEl.current.textContent = `${formatDistance(lengthOf([a, [a[0], b[1]]]))} × ${formatDistance(lengthOf([a, [b[0], a[1]]]))}`;
      return;
    }
    if (tl === "area") {
      g.line.setLatLngs([]);
      g.poly.setLatLngs(live);
    } else {
      g.line.setLatLngs(pts);
      g.poly.setLatLngs(tl === "measure" && live.length >= 3 ? live : []);
    }
    const last = pts[pts.length - 1];
    g.rubber.setLatLngs(
      cursor && !done
        ? tl === "area" && pts.length > 1
          ? [last, [cursor.lat, cursor.lng], pts[0]]
          : [last, [cursor.lat, cursor.lng]]
        : [],
    );
    if (liveEl.current) {
      const parts: string[] = [];
      if (tl !== "area" || live.length < 3)
        parts.push(formatDistance(lengthOf(live)));
      else
        parts.push(
          t("périmètre {d}", {
            d: formatDistance(lengthOf([...live, live[0]])),
          }),
        );
      if (live.length >= 3 && tl !== "line")
        parts.push(t("surface {a}", { a: formatArea(areaOf(live)) }));
      liveEl.current.textContent = parts.join(" · ");
    }
  }

  useEffect(() => {
    const g = groups.current;
    const m = map.current;
    if (!g || !m) return;
    g.dots.clearLayers();
    if (DRAWING.includes(tool))
      draft.forEach((p, i) =>
        L.circleMarker(p, {
          radius: i === 0 ? 6 : 4.5,
          className: `map-sketch-dot${i === 0 ? " first" : ""}`,
          interactive: false,
        }).addTo(g.dots),
      );
    drawSketch(null);
    if (DRAWING.includes(tool)) m.doubleClickZoom.disable();
    else m.doubleClickZoom.enable();
  }, [draft, tool, measureDone, plume]);

  /* ---------- Freehand drawing ---------- */
  useEffect(() => {
    const m = map.current;
    const g = groups.current;
    if (!m || !g || tool !== "freehand") return;
    const el = m.getContainer();
    m.dragging.disable();
    m.doubleClickZoom.disable();
    el.classList.add("map-drawing");
    let pointer: number | null = null;
    let pts: L.Point[] = [];
    let stroke: L.Polyline | null = null;
    const reset = () => {
      pointer = null;
      pts = [];
      stroke?.remove();
      stroke = null;
    };
    const down = (e: PointerEvent) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      // A second finger: pinch to zoom, not a stroke.
      if (pointer !== null) return reset();
      pointer = e.pointerId;
      pts = [m.mouseEventToContainerPoint(e as unknown as MouseEvent)];
      stroke = L.polyline([m.containerPointToLatLng(pts[0])], {
        className: "map-sketch freehand",
        weight: 3,
        interactive: false,
      }).addTo(g.sketch);
      el.setPointerCapture?.(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      if (e.pointerId !== pointer || !stroke) return;
      const p = m.mouseEventToContainerPoint(e as unknown as MouseEvent);
      if (p.distanceTo(pts[pts.length - 1]) < 2) return;
      pts.push(p);
      stroke.addLatLng(m.containerPointToLatLng(p));
    };
    const up = (e: PointerEvent) => {
      if (e.pointerId !== pointer) return;
      const drawn = pts;
      reset();
      if (e.type !== "pointerup" || drawn.length < 2) return;
      let simple = simplify(
        drawn.map((p) => [p.x, p.y] as [number, number]),
        1.4,
      );
      if (simple.length > 2000) simple = simplify(simple, 4).slice(0, 2000);
      const latlngs = simple.map(([x, y]) => {
        const at = m.containerPointToLatLng([x, y]).wrap();
        return [round6(at.lat), round6(at.lng)] as LatLng;
      });
      const length = Math.hypot(
        drawn[drawn.length - 1].x - drawn[0].x,
        drawn[drawn.length - 1].y - drawn[0].y,
      );
      if (latlngs.length < 2 || (latlngs.length === 2 && length < 6)) return;
      handlers.current.freehand(latlngs);
    };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    return () => {
      reset();
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
      el.classList.remove("map-drawing");
      m.dragging.enable();
      m.doubleClickZoom.enable();
    };
  }, [tool]);

  /* ---------- Shape editing ---------- */
  const editKind = shapeEdit ? byId.get(shapeEdit.id)?.kind : undefined;
  // Handles of a long line follow the view.
  const [editView, setEditView] = useState(0);
  const refocus = useRef<number | null>(null);
  const longEdit = useRef(false);
  longEdit.current = !!shapeEdit && shapeEdit.points.length > MAX_HANDLES;
  useEffect(() => {
    if (cull()) publishSlots();
  }, [sheetId]);
  useEffect(() => {
    const g = groups.current;
    if (!g) return;
    g.edit.clearLayers();
    if (!shapeEdit) return;
    if (!editKind) return;
    const pts = shapeEdit.points.map((p) => [...p] as LatLng);
    const area = editKind === "area";
    const shape = (area ? L.polygon(pts) : L.polyline(pts)).setStyle({
      className: `map-sketch editing${area ? " area" : ""}`,
      weight: 3,
      interactive: false,
    });
    shape.addTo(g.edit);
    const min = area ? 3 : 2;
    const handle = (cls: string, size: number) =>
      L.divIcon({
        className: `map-vertex ${cls}`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });
    // A long line (2000 points) would need 4000 handles: only the
    // vertices in view, nearest to the centre first, are editable at once.
    const m = map.current;
    let editable = pts.map((_, i) => i);
    if (m && pts.length > MAX_HANDLES) {
      const view = m.getBounds();
      const c = m.getCenter();
      editable = editable
        .filter((i) => view.contains(pts[i]))
        .sort((a, b) => c.distanceTo(pts[a]) - c.distanceTo(pts[b]))
        .slice(0, MAX_HANDLES)
        .sort((a, b) => a - b);
    }
    const shown = new Set(editable);
    const nudge = (v: L.Marker, e: KeyboardEvent) => {
      const step = e.shiftKey ? 20 : 4;
      const d =
        e.key === "ArrowUp"
          ? [0, -step]
          : e.key === "ArrowDown"
            ? [0, step]
            : e.key === "ArrowLeft"
              ? [-step, 0]
              : e.key === "ArrowRight"
                ? [step, 0]
                : null;
      if (!d || !m) return false;
      e.preventDefault();
      e.stopPropagation();
      const p = m.latLngToContainerPoint(v.getLatLng()).add(d as L.PointTuple);
      v.setLatLng(m.containerPointToLatLng(p));
      v.fire("drag");
      v.fire("dragend");
      return true;
    };
    for (const i of editable) {
      const v = L.marker(pts[i], {
        icon: handle("", 16),
        draggable: true,
        keyboard: true,
      }).addTo(g.edit);
      v.on("add", () => {
        const el = v.getElement();
        el?.setAttribute(
          "aria-label",
          t(
            "Sommet {i} sur {n} : glisser ou flèches pour déplacer, Entrée pour retirer",
            { i: i + 1, n: pts.length },
          ),
        );
        el?.addEventListener("keydown", (e) => {
          if (nudge(v, e)) refocus.current = i;
        });
        // Rebuilt after a keyboard move: the focus stays on the vertex.
        if (refocus.current === i) {
          refocus.current = null;
          el?.focus();
        }
      });
      v.on("drag", () => {
        const at = v.getLatLng();
        pts[i] = [round6(at.lat), round6(at.lng)];
        shape.setLatLngs(pts);
      });
      v.on("dragend", () =>
        setShapeEdit((s) => (s ? { ...s, points: [...pts] } : s)),
      );
      v.on("click", () => {
        if (pts.length <= min)
          return toast(t("Au moins {n} sommets.", { n: min }));
        setShapeEdit((s) =>
          s ? { ...s, points: pts.filter((_, j) => j !== i) } : s,
        );
      });
    }
    const segments = area ? pts.length : pts.length - 1;
    for (let i = 0; i < segments; i++) {
      const j = (i + 1) % pts.length;
      if (!shown.has(i) || !shown.has(j)) continue;
      const a = pts[i];
      const b = pts[j];
      const mid: LatLng = [
        round6((a[0] + b[0]) / 2),
        round6((a[1] + b[1]) / 2),
      ];
      const add = L.marker(mid, {
        icon: handle("mid", 12),
        keyboard: true,
      }).addTo(g.edit);
      add.on("add", () =>
        add
          .getElement()
          ?.setAttribute(
            "aria-label",
            t("Ajouter un sommet après le sommet {i}", { i: i + 1 }),
          ),
      );
      add.on("click", () =>
        setShapeEdit((s) =>
          s && s.points.length < 2000
            ? {
                ...s,
                points: [...pts.slice(0, i + 1), mid, ...pts.slice(i + 1)],
              }
            : s,
        ),
      );
    }
  }, [shapeEdit, editKind, toast, editView]);

  /* ---------- Actions ---------- */
  const flash = useCallback((lat: number, lng: number, label: string) => {
    const m = map.current;
    if (!m) return;
    flashMarker.current?.remove();
    const el = document.createElement("div");
    el.className = "map-flash";
    const span = document.createElement("span");
    span.textContent = label;
    el.append(document.createElement("i"), span);
    const marker = L.marker([lat, lng], {
      icon: L.divIcon({
        html: el,
        className: "map-icon",
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      }),
      interactive: false,
    }).addTo(m);
    flashMarker.current = marker;
    setTimeout(() => {
      if (flashMarker.current === marker) {
        marker.remove();
        flashMarker.current = null;
      }
    }, 9000);
  }, []);

  const goTo = useCallback(
    (lat: number, lng: number, zoom: number | null, label: string) => {
      const m = map.current;
      if (!m) return;
      const z = zoom ?? Math.max(m.getZoom(), 16);
      if (reducedMotion()) m.setView([lat, lng], z);
      else m.flyTo([lat, lng], z, { duration: 0.9 });
      if (label) flash(lat, lng, label);
    },
    [flash],
  );

  const showPlace = useCallback(
    (p: Place, withSheet: boolean) => {
      const m = map.current;
      if (!m) return;
      // Not on this map: open a map that shows it.
      if (mapId && !onMap(p, mapId, known)) {
        const other = p.maps.find((id) => known.has(id));
        if (other) {
          shownMap.current = other;
          selectMap(other);
        }
      } else if (hidden.has(layerKey(p))) setLayerHidden(layerKey(p), false);
      // Keep the object in the part of the map not covered by the side
      // panel and the sheet.
      const size = m.getSize();
      const wide = !narrow();
      const right = withSheet && wide ? Math.min(560, size.x * 0.6) : 0;
      let left = wide && panelOpen.current ? 384 : 0;
      if (size.x - left - right < 220) left = 0;
      const below = withSheet && !wide ? size.y * 0.55 : 0;
      const animate = !reducedMotion();
      if (p.kind === "line" || p.kind === "area") {
        const bounds = L.latLngBounds(p.points);
        const options = {
          paddingTopLeft: [50 + left, 60] as L.PointTuple,
          paddingBottomRight: [50 + right, 90 + below] as L.PointTuple,
          maxZoom: 17,
        };
        if (animate) m.flyToBounds(bounds, { ...options, duration: 0.9 });
        else m.fitBounds(bounds, options);
      } else {
        const z = Math.max(m.getZoom(), 16);
        const target = m.unproject(
          m.project(p.points[0], z).add([(right - left) / 2, below / 2]),
          z,
        );
        if (animate) m.flyTo(target, z, { duration: 0.9 });
        else m.setView(target, z);
      }
      if (withSheet) setSheetId(p.id);
    },
    [hidden, mapId, known],
  );

  function create(
    place: Omit<InputOf<"places">, "id" | "createdAt" | "updatedAt" | "by">,
    link?: Ref,
  ) {
    // Past version or closed journal: nothing is written.
    if (state.current.readOnly) return null;
    const id = crypto.randomUUID();
    // Drawn on a named map: belongs to it, even while it is the only one
    // (a map created later starts empty).
    const own = currentMap ? [currentMap.id] : [];
    try {
      updateOps((ops) => {
        const next = upsert(ops, "places", { maps: own, ...place, id }, author);
        return link
          ? addLink(next, ref("place", id), link, t("position"), author)
          : next;
      });
      return id;
    } catch (err) {
      toast((err as Error).message);
      return null;
    }
  }

  /**
   * Several areas in one change (concentric rings), each linked to the
   * first so that hovering one shows the others.
   */
  function createMany(
    list: Omit<InputOf<"places">, "id" | "createdAt" | "updatedAt" | "by">[],
  ) {
    if (state.current.readOnly || !list.length) return [];
    const own = currentMap ? [currentMap.id] : [];
    const ids = list.map(() => crypto.randomUUID());
    try {
      updateOps((ops) => {
        let next = ops;
        list.forEach((place, i) => {
          next = upsert(
            next,
            "places",
            { maps: own, ...place, id: ids[i] },
            author,
          );
          if (i)
            next = addLink(
              next,
              ref("place", ids[0]),
              ref("place", ids[i]),
              t("périmètre"),
              author,
            );
        });
        return next;
      });
      return ids;
    } catch (err) {
      toast((err as Error).message);
      return [];
    }
  }

  /** Concentric perimeters (e.g. 100 / 300 / 1000 m) around a point. */
  function createRings(center: LatLng, radii: number[]) {
    if (!radii.length)
      return toast(t("Indiquez des rayons, par exemple « 100, 300, 1000 »."));
    const where = formatPosition(center[0], center[1]);
    const ids = createMany(
      radii.map((r, i) => ({
        label: t("Périmètre {d}", { d: formatDistance(r) }),
        kind: "area" as const,
        symbol: "",
        color: "",
        layer: drawLayer,
        points: circlePoints(center, r),
        notes: t("Centre {where} · rayon {r} · anneau {i} sur {n}", {
          where,
          r: formatDistance(r),
          i: i + 1,
          n: radii.length,
        }),
        dash: i ? ("dash" as const) : ("solid" as const),
      })),
    );
    if (!ids.length) return;
    toast(t("{n} périmètres créés et reliés.", { n: ids.length }));
    chooseTool("select");
    setSheetId(ids[0]);
  }

  /** Plume or wind sector from a point, as a normal area. */
  function createSector(apex: LatLng, bearing: number, length: number) {
    if (length < 10) return toast(t("Longueur trop courte : au moins 10 m."));
    const b = ((Math.round(bearing) % 360) + 360) % 360;
    const { angle } = state.current.plume;
    const id = create({
      label: t("Panache {dir} · {len}", {
        dir: compass(b),
        len: formatDistance(length),
      }),
      kind: "area",
      symbol: "",
      color: "",
      layer: drawLayer === layers.effects ? layers.dangers : drawLayer,
      points: sectorPoints(apex, b, angle, length),
      notes: t(
        "Origine {where} · direction {deg}° ({dir}) · ouverture {angle}° · longueur {len}",
        {
          where: formatPosition(apex[0], apex[1]),
          deg: b,
          dir: compass(b),
          angle,
          len: formatDistance(length),
        },
      ),
    });
    if (!id) return;
    const next = {
      ...state.current.plume,
      bearing: b,
      length: Math.round(length),
    };
    setPlume(next);
    writeStore("orion.map.plume", next);
    chooseTool("select");
    setSheetId(id);
  }

  /** Wind of the latest forecast (weather module), blowing towards. */
  const wind = useMemo(() => {
    let latest: (typeof journal.ops.forecasts)[number] | null = null;
    for (const f of journal.ops.forecasts)
      if (!latest || f.fetchedAt > latest.fetchedAt) latest = f;
    const c = latest?.data.current;
    if (!latest || !c || c.direction === null || c.direction === undefined)
      return null;
    return {
      towards: (c.direction + 180) % 360,
      from: c.direction,
      speed: c.wind,
      place: latest.place,
      at: latest.fetchedAt,
    };
  }, [journal.ops.forecasts]);

  function chooseTool(next: Tool) {
    setDraft([]);
    setMeasureDone(false);
    setShapeEdit(null);
    setGhostMenu(null);
    if (next !== "point") setPending(null);
    setTool(next);
    if (next === "point") setPanel("symbols");
    else if (panel === "symbols") setPanel(narrow() ? null : "list");
  }

  function placePoint(at: L.LatLng) {
    const info = describeSymbol(armed, catalog, journalLang(journal.ops));
    const target = pending?.target;
    const id = create(
      {
        label: (pending?.title ?? info.name).slice(0, 200),
        kind: "point",
        symbol: armed,
        color: "",
        layer: target
          ? layerForKind(parseRef(target).kind, layers)
          : info.layer,
        points: [[round6(at.lat), round6(at.lng)]],
        notes: "",
      },
      target,
    );
    if (!id) return;
    rememberSymbol(armed);
    if (pending)
      toast(t("« {title} » est placé sur la carte.", { title: pending.title }));
    setPending(null);
    chooseTool("select");
    setSheetId(id);
  }

  function finish() {
    const m = map.current;
    const { tool: tl, draft: raw, readOnly: locked } = state.current;
    if (
      !m ||
      !DRAWING.includes(tl) ||
      tl === "circle" ||
      tl === "sector" ||
      tl === "box" ||
      (locked && tl !== "measure")
    )
      return;
    // A double click adds the same vertex twice.
    const pts = raw.filter((p, i) => {
      if (!i) return true;
      const a = m.latLngToContainerPoint(raw[i - 1]);
      return a.distanceTo(m.latLngToContainerPoint(p)) > 5;
    });
    if (tl === "measure") {
      setDraft(pts);
      setMeasureDone(true);
      return;
    }
    if (tl === "line" && pts.length < 2)
      return toast(t("Un tracé demande au moins deux points."));
    if (tl === "area" && pts.length < 3)
      return toast(t("Une zone demande au moins trois points."));
    const id = create({
      label: "",
      kind: tl === "area" ? "area" : "line",
      symbol: "",
      color: "",
      layer: drawLayer,
      points: pts.slice(0, 2000),
      notes: "",
    });
    if (!id) return;
    chooseTool("select");
    setSheetId(id);
  }

  /** A perimeter: an area drawn as a circle, labelled with its radius. */
  function createCircle(center: LatLng, radius: number) {
    if (radius < 5) return toast(t("Rayon trop petit : au moins 5 m."));
    const id = create({
      label: t("Périmètre {d}", { d: formatDistance(radius) }),
      kind: "area",
      symbol: "",
      color: "",
      layer: drawLayer,
      points: circlePoints(center, radius),
      notes: t("Centre {where} · rayon {r}", {
        where: formatPosition(center[0], center[1]),
        r: formatDistance(radius),
      }),
    });
    if (!id) return;
    chooseTool("select");
    setSheetId(id);
  }

  function saveShape() {
    if (!shapeEdit) return;
    if (readOnly) return setShapeEdit(null);
    const p = byId.get(shapeEdit.id);
    if (!p) return setShapeEdit(null);
    try {
      updateOps((ops) =>
        upsert(ops, "places", { ...p, points: shapeEdit.points }, author),
      );
      toast(t("Forme enregistrée."));
    } catch (err) {
      toast((err as Error).message);
    }
    setShapeEdit(null);
  }

  function createFromGhost(g: Ghost) {
    const kind = parseRef(g.target).kind;
    const id = create(
      {
        label: g.title.slice(0, 200),
        kind: "point",
        symbol: symbolForKind(kind),
        color: "",
        layer: layerForKind(kind, layers),
        points: [[round6(g.lat), round6(g.lng)]],
        notes: "",
      },
      g.target,
    );
    setGhostMenu(null);
    if (id) setSheetId(id);
  }

  /** « Créer un point ici » from a live position: an ordinary object. */
  function createFromLive(u: Unit) {
    const kind = u.ref ? parseRef(u.ref as Ref).kind : "";
    const id = create(
      {
        label: (u.label || u.name).slice(0, 200),
        kind: "point",
        symbol: symbolForKind(kind),
        color: "",
        layer: layers.means,
        points: [[round6(u.lat), round6(u.lng)]],
        notes: "",
      },
      u.ref ? (u.ref as Ref) : undefined,
    );
    if (id) setSheetId(id);
  }

  const identifying = useRef(0);
  /** Feature info of the geo.admin.ch layers shown, at a click. */
  async function identify(at: L.LatLng) {
    const m = map.current;
    const ids = overlayManager.current?.identifiable() ?? [];
    if (!m || !ids.length) return;
    const b = m.getBounds();
    const size = m.getSize();
    const url = identifyUrl(
      ids,
      [at.lat, at.lng],
      [
        [b.getSouth(), b.getWest()],
        [b.getNorth(), b.getEast()],
      ],
      [size.x, size.y],
    );
    if (!url) return;
    const p = m.latLngToContainerPoint(at);
    const box = m.getContainer().getBoundingClientRect();
    const where = { x: box.left + p.x, y: box.top + p.y };
    const request = ++identifying.current;
    if (!navigator.onLine)
      return setInfo({
        ...where,
        items: [],
        error: t(
          "Hors ligne : les informations des couches ne sont pas disponibles.",
        ),
      });
    setInfo({ ...where, items: [], loading: true });
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(String(response.status));
      const items = readIdentify(await response.json()).map((i) => ({
        title: i.title,
        source: "geo.admin.ch",
        rows: i.rows,
      }));
      if (request !== identifying.current) return;
      setInfo(items.length ? { ...where, items } : null);
    } catch {
      if (request !== identifying.current) return;
      setInfo({
        ...where,
        items: [],
        error: t("Le service d’information de geo.admin.ch ne répond pas."),
      });
    }
  }

  handlers.current = {
    moved: () => {
      if (cull()) publishSlots();
      drawGrid();
      if (longEdit.current) setEditView((v) => v + 1);
    },
    mapClick: (at) => {
      setGhostMenu(null);
      setInfo(null);
      // The sheet of an object stays beside the map: a click elsewhere
      // on the map closes it; the layers shown may say what is there.
      if (tool === "select") {
        setSheetId(null);
        void identify(at);
        return;
      }
      if (tool === "freehand") return;
      if (readOnly && tool !== "measure" && tool !== "box") return;
      const pt: LatLng = [round6(at.lat), round6(at.wrap().lng)];
      if (tool === "box") {
        if (!draft.length) return setDraft([pt]);
        const a = draft[0];
        setSectorBox([
          [Math.min(a[0], pt[0]), Math.min(a[1], pt[1])],
          [Math.max(a[0], pt[0]), Math.max(a[1], pt[1])],
        ]);
        chooseTool("select");
        setSectorDialog(true);
        return;
      }
      if (tool === "sector") {
        if (!draft.length) return setDraft([pt]);
        createSector(
          draft[0],
          bearingOf(draft[0], pt),
          lengthOf([draft[0], pt]),
        );
        return;
      }
      if (tool === "point") placePoint(at.wrap());
      else if (tool === "text") {
        const id = create({
          label: t("Texte"),
          kind: "text",
          symbol: "",
          color: "",
          layer: layers.other,
          points: [pt],
          notes: "",
        });
        if (id) {
          chooseTool("select");
          setSheetId(id);
        }
      } else if (tool === "circle") {
        if (!draft.length) setDraft([pt]);
        else createCircle(draft[0], lengthOf([draft[0], pt]));
      } else if (tool === "measure" && measureDone) {
        setDraft([pt]);
        setMeasureDone(false);
      } else if (draft.length < 500) setDraft((d) => [...d, pt]);
    },
    finish,
    freehand: (points) => {
      if (readOnly) return;
      create({
        label: "",
        kind: "line",
        symbol: "",
        color: "",
        layer: drawLayer,
        points,
        notes: "",
      });
    },
    style: (id, style) => {
      const p = byId.get(id);
      if (!p || readOnly) return;
      try {
        updateOps((ops) => upsert(ops, "places", { ...p, ...style }, author));
      } catch (err) {
        toast((err as Error).message);
      }
    },
    placeClick: (id, at) => {
      if (tool === "select") {
        clearTimeout(hoverTimer.current);
        setHover(null);
        setSheetId(id);
      } else handlers.current.mapClick(at);
    },
    placeOver: (id, e) => {
      if ((DRAWING.includes(tool) && draft.length) || tool === "freehand")
        return;
      clearTimeout(hoverTimer.current);
      const x = e.clientX;
      const y = e.clientY;
      hoverTimer.current = setTimeout(
        () =>
          setHover({
            target: ref("place", id),
            x,
            y,
            hint:
              tool === "select"
                ? readOnly || locked
                  ? t("Cliquer pour ouvrir")
                  : t("Cliquer pour ouvrir · glisser pour déplacer")
                : "",
          }),
        120,
      );
    },
    placeOut: () => {
      clearTimeout(hoverTimer.current);
      hoverTimer.current = setTimeout(() => setHover(null), 60);
    },
    placeMoved: (id, at) => {
      const p = byId.get(id);
      if (!p || readOnly) return;
      try {
        updateOps((ops) =>
          upsert(
            ops,
            "places",
            { ...p, points: [[round6(at.lat), round6(at.wrap().lng)]] },
            author,
          ),
        );
      } catch (err) {
        toast((err as Error).message);
      }
    },
    ghostOver: (g, e) => {
      clearTimeout(hoverTimer.current);
      const { clientX: x, clientY: y } = e;
      hoverTimer.current = setTimeout(
        () =>
          setHover({
            target: g.target,
            x,
            y,
            hint: t("Position citée · cliquer pour la placer"),
          }),
        120,
      );
    },
    ghostClick: (g, e) => {
      clearTimeout(hoverTimer.current);
      setHover(null);
      setGhostMenu({ ...g, x: e.clientX, y: e.clientY });
    },
  };

  /* ---------- Focus from other modules ---------- */
  useEffect(() => {
    if (!focus) return;
    const { kind, id } = parseRef(focus);
    if (kind !== "place") return;
    setFocus(null);
    if (id.startsWith("new:")) {
      const target = id.slice(4) as Ref;
      const item = graph.byRef.get(target);
      if (readOnly)
        return toast(
          viewAt !== null
            ? t(
                "Lecture seule : vous consultez le passé. Revenez au direct pour placer un objet.",
              )
            : t("Journal clôturé : la carte est en lecture seule."),
        );
      if (!item) return toast(t("Élément introuvable."));
      setDraft([]);
      setShapeEdit(null);
      setTool("point");
      setPanel("symbols");
      setArmed(symbolForKind(item.kind));
      setPending({ target, title: item.title });
      return;
    }
    const p = byId.get(id);
    if (p) showPlace(p, true);
    else toast(t("Cet objet n’est plus sur la carte."));
  }, [focus, setFocus, graph.byRef, byId, readOnly, showPlace, toast]);

  /* ---------- Keyboard ---------- */
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const t = e.target;
      if (
        t instanceof Element &&
        t.closest("input, textarea, select, [contenteditable=true]")
      )
        return;
      // Undo / redo of the map operations of this post (also with the
      // sheet of an object open, outside its fields).
      const undoKey =
        (e.metaKey || e.ctrlKey) && !e.altKey && e.key.toLowerCase() === "z";
      const redoKey = e.ctrlKey && !e.metaKey && e.key.toLowerCase() === "y";
      if ((undoKey || redoKey) && !document.querySelector("dialog[open]")) {
        e.preventDefault();
        step(redoKey || e.shiftKey ? "redo" : "undo");
        return;
      }
      if (document.querySelector(".sheet-panel, dialog[open]")) return;
      if (e.key === "Escape") {
        if (info) setInfo(null);
        else if (ghostMenu) setGhostMenu(null);
        else if (shapeEdit) setShapeEdit(null);
        else if (draft.length && !measureDone) setDraft([]);
        else if (tool !== "select") chooseTool("select");
        else return;
        e.preventDefault();
      } else if (e.key === "Enter" && DRAWING.includes(tool) && draft.length) {
        e.preventDefault();
        finish();
      } else if (
        (e.key === "Backspace" || e.key === "Delete") &&
        draft.length &&
        !measureDone
      ) {
        e.preventDefault();
        setDraft((d) => d.slice(0, -1));
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  });

  /* ---------- Maps, backgrounds, layers ---------- */
  function selectMap(id: string) {
    setChosenMap(id);
    writeStore(`orion.map.current.${journal.id}`, id);
    setSheetId(null);
  }

  function updateMap(m: OpsMap, patch: Partial<OpsMap>) {
    try {
      updateOps((ops) => upsert(ops, "maps", { ...m, ...patch }, author));
    } catch (err) {
      toast((err as Error).message);
    }
  }

  // Past versions and closed journals: changes stay on this screen.
  function chooseBase(id: BaseId) {
    if (!currentMap) {
      setLocalBase(id);
      writeStore("orion.map.base", id);
    } else if (readOnly)
      setOverrides((o) => ({ ...o, [mapId]: { ...o[mapId], base: id } }));
    else updateMap(currentMap, { base: id });
  }

  function setHiddenLayers(next: string[]) {
    if (!currentMap) {
      setLocalHidden(next);
      writeStore("orion.map.hidden", next);
    } else if (readOnly)
      setOverrides((o) => ({ ...o, [mapId]: { ...o[mapId], hidden: next } }));
    else updateMap(currentMap, { hidden: next.slice(0, 50) });
  }
  function setLayerHidden(layer: string, off: boolean) {
    const next = new Set(hiddenList);
    if (off) next.add(layer);
    else next.delete(layer);
    setHiddenLayers([...next]);
  }
  const toggleLayer = (layer: string) =>
    setLayerHidden(layer, !hidden.has(layer));

  const onStyle = useCallback(
    (id: string, style: Style) => handlers.current.style(id, style),
    [],
  );

  function fitAll() {
    const m = map.current;
    const pts = visible.flatMap((p) => p.points);
    if (!m) return;
    if (!pts.length) return toast(t("Aucun objet visible à afficher."));
    m.fitBounds(L.latLngBounds(pts), {
      padding: [60, 60],
      maxZoom: 17,
      animate: !reducedMotion(),
    });
  }

  function home() {
    const c = framingOf(currentMap) ?? GENEVA;
    map.current?.setView([c.lat, c.lng], c.zoom, { animate: !reducedMotion() });
  }

  function locate() {
    if (!navigator.geolocation)
      return toast(t("Position indisponible sur cet appareil."));
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        goTo(pos.coords.latitude, pos.coords.longitude, 16, t("Ma position")),
      (err) =>
        toast(
          err.code === err.PERMISSION_DENIED
            ? t(
                "Position refusée : autorisez la localisation dans le navigateur.",
              )
            : t("Position indisponible pour le moment."),
        ),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 },
    );
  }

  /** Framing of the map shown, for every post. */
  function saveFraming() {
    const m = map.current;
    if (!m) return;
    if (readOnly)
      return toast(t("Lecture seule : le cadrage n’est pas enregistré."));
    const c = m.getCenter().wrap();
    const view = {
      lat: round6(c.lat),
      lng: round6(c.lng),
      zoom: Math.min(22, Math.max(1, m.getZoom())),
    };
    try {
      if (currentMap) updateMap(currentMap, view);
      else
        updateOps((ops) => ({
          ...ops,
          settings: { ...ops.settings, mapCenter: view },
        }));
      toast(
        currentMap
          ? t("Cadrage enregistré pour « {name} ».", { name: currentMap.name })
          : t("Vue par défaut enregistrée pour ce journal."),
      );
    } catch (err) {
      toast((err as Error).message);
    }
  }

  function fitPoints(points: LatLng[]) {
    const m = map.current;
    if (!m || !points.length) return;
    m.fitBounds(L.latLngBounds(points), {
      padding: [60, 60],
      maxZoom: 17,
      animate: !reducedMotion(),
    });
  }

  /* ---------- Objects left on every map by earlier versions ---------- */
  const strayKey = `orion.map.strays.${journal.id}`;
  const [strayDismissed, setStrayDismissed] = useState(() =>
    readStore(strayKey, false, (v) => typeof v === "boolean"),
  );
  const strays = useMemo(
    () =>
      strayDismissed
        ? { places: [] as Place[], home: null }
        : strayObjects(allPlaces, maps),
    [allPlaces, maps, strayDismissed],
  );
  function fixStrays() {
    const { home, places: list } = strays;
    if (!home || !list.length) return;
    const ids = new Set(list.map((p) => p.id));
    try {
      updateOps((ops) => ({
        ...ops,
        places: ops.places.map((p) =>
          ids.has(p.id) && !p.maps.length
            ? { ...p, maps: [home.id], updatedAt: new Date().toISOString() }
            : p,
        ),
      }));
      toast(
        tn(
          list.length,
          "{n} objet gardé sur « {name} » seulement.",
          "{n} objets gardés sur « {name} » seulement.",
          { name: home.name },
        ),
      );
    } catch (err) {
      toast((err as Error).message);
    }
  }
  function keepStrays() {
    setStrayDismissed(true);
    writeStore(strayKey, true);
  }

  /** Keyboard move from the list of objects: metres east / north. */
  function nudge(p: Place, east: number, north: number) {
    if (readOnly || locked) return;
    const shift = ([lat, lng]: LatLng): LatLng => [
      round6(lat + north / 111320),
      round6(lng + east / (111320 * Math.cos((lat * Math.PI) / 180))),
    ];
    try {
      updateOps((ops) =>
        upsert(
          ops,
          "places",
          {
            ...p,
            points: p.points.map(shift),
            ...(p.holes && { holes: p.holes.map((h) => h.map(shift)) }),
          },
          author,
        ),
      );
      const d = Math.hypot(east, north);
      const params = { name: p.label || t("Objet"), d: formatDistance(d) };
      setNudged(
        north > 0
          ? t("{name} déplacé de {d} vers le nord.", params)
          : north < 0
            ? t("{name} déplacé de {d} vers le sud.", params)
            : east > 0
              ? t("{name} déplacé de {d} vers l’est.", params)
              : t("{name} déplacé de {d} vers l’ouest.", params),
      );
    } catch (err) {
      toast((err as Error).message);
    }
  }

  /** GeoJSON of the map shown in MN95 (EPSG:2056), for Swiss GIS. */
  function exportSwissGeoJSON() {
    try {
      const text = toGeoJSON(journal, mapId, { crs: "EPSG:2056" });
      const blob = new Blob([text], { type: "application/geo+json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const name = (currentMap?.name ?? journal.title)
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .replace(/[^a-z0-9]+/gi, "-")
        .replace(/^-|-$/g, "")
        .toLowerCase();
      a.href = url;
      a.download = `${name || t("carte")}-mn95.geojson`;
      document.body.append(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 30000);
      toast(t("GeoJSON MN95 (EPSG:2056) enregistré."));
    } catch (err) {
      toast((err as Error).message);
    }
  }

  // Map tiles kept offline: ask the browser, once, not to evict the
  // storage of the site (Chrome decides alone; Firefox asks the user).
  useEffect(() => {
    if (readStore("orion.map.persist", false, (v) => typeof v === "boolean"))
      return;
    writeStore("orion.map.persist", true);
    void persistStorage();
  }, []);
  // Escape leaves the full screen map.
  useEffect(() => {
    if (!full) return;
    const key = (e: KeyboardEvent) => {
      if (
        e.key === "Escape" &&
        !document.querySelector("dialog[open], .sheet-panel")
      )
        setFull(false);
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [full]);

  const armedInfo = describeSymbol(armed, catalog, journalLang(journal.ops));
  const drawing = DRAWING.includes(tool);
  const tools = TOOLS.filter((t) => !readOnly || !t.write);
  const layerOptions = lists("layers");

  let hint: ReactNode = null;
  if (shapeEdit)
    hint = (
      <>
        <span>
          {t(
            "Glissez les sommets · cliquez un sommet pour le retirer · « + » pour en ajouter",
          )}
        </span>
        <button type="button" className="small primary" onClick={saveShape}>
          <Check size={13} />
          {t("Enregistrer")}
        </button>
        <button
          type="button"
          className="small"
          onClick={() => setShapeEdit(null)}
        >
          {t("Annuler")}
        </button>
      </>
    );
  else if (tool === "point")
    hint = (
      <>
        <Glyph symbol={armed} size={24} />
        <span>
          {t("Cliquez sur la carte pour placer « {name} »", {
            name: pending ? pending.title : armedInfo.name,
          })}
        </span>
        <button
          type="button"
          className="icon-button"
          aria-label={t("Annuler le placement")}
          onClick={() => chooseTool("select")}
        >
          <X size={15} />
        </button>
      </>
    );
  else if (tool === "freehand")
    hint = (
      <>
        <Pencil size={15} aria-hidden="true" />
        <span>
          {t(
            "Dessinez à la souris ou au doigt · chaque trait devient un tracé",
          )}
        </span>
        <select
          className="map-hint-layer"
          value={drawLayer}
          aria-label={t("Calque des traits")}
          onChange={(e) => {
            setDrawLayer(e.target.value);
            writeStore("orion.map.drawLayer", e.target.value);
          }}
        >
          {[...new Set([...layerOptions, drawLayer])].map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="icon-button"
          aria-label={t("Fermer le dessin libre")}
          onClick={() => chooseTool("select")}
        >
          <X size={15} />
        </button>
      </>
    );
  else if (tool === "text")
    hint = (
      <>
        <span>{t("Cliquez à l’endroit où écrire le texte.")}</span>
        <button
          type="button"
          className="icon-button"
          aria-label={t("Annuler")}
          onClick={() => chooseTool("select")}
        >
          <X size={15} />
        </button>
      </>
    );
  else if (tool === "circle")
    hint = (
      <>
        <span>
          {draft.length
            ? t("Cliquez pour fixer le rayon, ou choisissez :")
            : t("Cliquez le centre du périmètre")}
        </span>
        {draft.length > 0 && (
          <>
            {RADII.map((r) => (
              <button
                key={r}
                type="button"
                className="small"
                onClick={() => createCircle(draft[0], r)}
              >
                {r < 1000
                  ? `${formatNumber(r)} m`
                  : `${formatNumber(r / 1000)} km`}
              </button>
            ))}
            <strong className="mono map-live" ref={liveEl} />
            <span className="map-hint-rings">
              <input
                className="mono"
                value={ringsText}
                size={14}
                aria-label={t(
                  "Rayons des anneaux, en mètres (ex. 100, 300, 1000)",
                )}
                title={t("Rayons des anneaux concentriques, en m (ou km)")}
                onChange={(e) => {
                  setRingsText(e.target.value);
                  writeStore("orion.map.rings", e.target.value);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter")
                    createRings(draft[0], parseRadii(ringsText));
                }}
              />
              <button
                type="button"
                className="small primary"
                onClick={() => createRings(draft[0], parseRadii(ringsText))}
              >
                {t("Anneaux")}
              </button>
            </span>
          </>
        )}
        <select
          className="map-hint-layer"
          value={drawLayer}
          aria-label={t("Calque du périmètre")}
          onChange={(e) => {
            setDrawLayer(e.target.value);
            writeStore("orion.map.drawLayer", e.target.value);
          }}
        >
          {[...new Set([...layerOptions, drawLayer])].map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="icon-button"
          aria-label={t("Fermer l’outil")}
          onClick={() => chooseTool("select")}
        >
          <X size={15} />
        </button>
      </>
    );
  else if (tool === "sector") {
    const setPl = (patch: Partial<Plume>) => {
      const next = { ...plume, ...patch };
      setPlume(next);
      writeStore("orion.map.plume", next);
    };
    hint = (
      <>
        <span>
          {draft.length
            ? t("Cliquez la direction et la longueur, ou saisissez-les :")
            : t("Cliquez l’origine du panache (source, foyer)")}
        </span>
        <label className="map-hint-field">
          <span>{t("Vers")}</span>
          <input
            type="number"
            className="mono"
            min={0}
            max={359}
            value={plume.bearing}
            aria-label={t("Direction du panache, en degrés depuis le nord")}
            onChange={(e) =>
              setPl({ bearing: ((Number(e.target.value) % 360) + 360) % 360 })
            }
          />
          °
        </label>
        {wind && (
          <button
            type="button"
            className="small"
            title={
              wind.speed !== null
                ? t(
                    "Vent de {dir} ({deg}°), {speed} km/h · prévision {place}",
                    {
                      dir: compass(wind.from),
                      deg: Math.round(wind.from),
                      speed: Math.round(wind.speed),
                      place: wind.place || "",
                    },
                  )
                : t("Vent de {dir} ({deg}°) · prévision {place}", {
                    dir: compass(wind.from),
                    deg: Math.round(wind.from),
                    place: wind.place || "",
                  })
            }
            onClick={() => setPl({ bearing: Math.round(wind.towards) })}
          >
            <Wind size={13} />
            {t("Vent actuel")}
          </button>
        )}
        <select
          className="map-hint-layer"
          value={plume.angle}
          aria-label={t("Ouverture du secteur")}
          onChange={(e) => setPl({ angle: Number(e.target.value) })}
        >
          {[...new Set([...PLUME_ANGLES, plume.angle])].map((a) => (
            <option key={a} value={a}>
              {a}°
            </option>
          ))}
        </select>
        <label className="map-hint-field">
          <span>{t("Long.")}</span>
          <input
            type="number"
            className="mono"
            min={10}
            max={50000}
            step={50}
            value={plume.length}
            aria-label={t("Longueur du panache, en mètres")}
            onChange={(e) =>
              setPl({
                length: Math.max(
                  10,
                  Math.min(50000, Number(e.target.value) || 0),
                ),
              })
            }
          />
          m
        </label>
        {draft.length > 0 && (
          <>
            <strong className="mono map-live" ref={liveEl} />
            <button
              type="button"
              className="small primary"
              onClick={() =>
                createSector(draft[0], plume.bearing, plume.length)
              }
            >
              <Check size={13} />
              {t("Créer")}
            </button>
          </>
        )}
        <button
          type="button"
          className="icon-button"
          aria-label={t("Fermer l’outil")}
          onClick={() => chooseTool("select")}
        >
          <X size={15} />
        </button>
      </>
    );
  } else if (tool === "box")
    hint = (
      <>
        <span>
          {draft.length
            ? t("Cliquez le coin opposé du secteur à garder hors ligne")
            : t("Cliquez un coin du secteur à garder hors ligne")}
        </span>
        <strong className="mono map-live" ref={liveEl} />
        <button
          type="button"
          className="icon-button"
          aria-label={t("Annuler")}
          onClick={() => {
            chooseTool("select");
            setSectorDialog(true);
          }}
        >
          <X size={15} />
        </button>
      </>
    );
  else if (drawing)
    hint = (
      <>
        <span>
          {tool === "measure"
            ? measureDone
              ? t("Mesure terminée · cliquez pour recommencer")
              : draft.length
                ? t("Double-clic pour terminer la mesure")
                : t("Cliquez des points pour mesurer")
            : draft.length
              ? t("Double-clic ou « Terminer » pour finir · Échap pour annuler")
              : tool === "line"
                ? t("Cliquez pour tracer la ligne, point par point")
                : t("Cliquez les coins de la zone")}
        </span>
        <strong className="mono map-live" ref={liveEl} />
        {tool !== "measure" && (
          <select
            className="map-hint-layer"
            value={drawLayer}
            aria-label={t("Calque du nouvel objet")}
            onChange={(e) => {
              setDrawLayer(e.target.value);
              writeStore("orion.map.drawLayer", e.target.value);
            }}
          >
            {[...new Set([...layerOptions, drawLayer])].map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        )}
        {draft.length > 0 && !measureDone && (
          <button
            type="button"
            className="icon-button"
            aria-label={t("Retirer le dernier point")}
            title={t("Retirer le dernier point (⌫)")}
            onClick={() => setDraft((d) => d.slice(0, -1))}
          >
            <Undo2 size={15} />
          </button>
        )}
        {tool !== "measure" && draft.length >= (tool === "area" ? 3 : 2) && (
          <button type="button" className="small primary" onClick={finish}>
            <Check size={13} />
            {t("Terminer")}
          </button>
        )}
        <button
          type="button"
          className="icon-button"
          aria-label={t("Fermer l’outil")}
          onClick={() => chooseTool("select")}
        >
          <X size={15} />
        </button>
      </>
    );

  return (
    <Ctx.Provider value={mapApp}>
      <ModuleHead
        actions={
          !readOnly && (
            <button
              type="button"
              onClick={saveFraming}
              title={
                currentMap
                  ? t("« {name} » s’ouvrira ici pour tous les postes", {
                      name: currentMap.name,
                    })
                  : t("La carte s’ouvrira ici pour tous les postes")
              }
            >
              <Pin size={14} />
              {t("Enregistrer le cadrage")}
            </button>
          )
        }
      />
      <div
        ref={shell}
        className={`map-shell tool-${tool}${base === "night" ? " night dark-base" : base === "aerial" ? " dark-base" : ""}${panel ? " with-panel" : ""}${hint ? " has-hint" : ""}${viewAt !== null ? " past" : ""}${full ? " full" : ""}`}
        style={full ? undefined : { height }}
      >
        <div
          ref={root}
          className="map-canvas"
          role="application"
          aria-label={t("Carte de situation")}
        />
        {crosshair && <div className="map-reticle" aria-hidden="true" />}

        <div className="map-top-left">
          <MapTabs
            maps={maps}
            current={mapId}
            readOnly={readOnly}
            onSelect={selectMap}
            onNew={() => setMapDialog("new")}
            onEdit={() => setMapDialog("edit")}
            onFrame={saveFraming}
            onImport={() => setImporting(true)}
            onExport={() => exportCenter({ sections: ["map"], viewAt })}
            onPrint={() => setPrinting(true)}
            onOffline={() => setSectorDialog(true)}
            onSwissGeoJSON={exportSwissGeoJSON}
          />
          <MapSearch onGo={goTo} />
          {panel && (
            <aside
              className="map-panel map-glass"
              aria-label={t("Panneau de la carte")}
            >
              <header className="map-panel-head">
                <div className="seg" role="tablist">
                  <button
                    type="button"
                    aria-pressed={panel === "list"}
                    onClick={() => setPanel("list")}
                  >
                    {t("Objets")} <small>{places.length}</small>
                  </button>
                  {!readOnly && (
                    <button
                      type="button"
                      aria-pressed={panel === "symbols"}
                      onClick={() => setPanel("symbols")}
                    >
                      {t("Signes")}
                    </button>
                  )}
                  <button
                    type="button"
                    aria-pressed={panel === "layers"}
                    onClick={() => setPanel("layers")}
                  >
                    {t("Calques")}
                  </button>
                </div>
                <button
                  type="button"
                  className="icon-button"
                  aria-label={t("Fermer le panneau")}
                  onClick={() => setPanel(null)}
                >
                  <X size={16} />
                </button>
              </header>
              <div className="map-panel-body">
                {panel === "list" &&
                  strays.places.length > 0 &&
                  strays.home &&
                  !readOnly && (
                    <div className="map-stray" role="note">
                      <p>
                        {tn(
                          strays.places.length,
                          "{n} objet posé avant la deuxième carte s’affiche sur toutes les cartes.",
                          "{n} objets posés avant la deuxième carte s’affichent sur toutes les cartes.",
                        )}
                      </p>
                      <div className="map-dialog-row">
                        <button
                          type="button"
                          className="small primary"
                          onClick={fixStrays}
                        >
                          {t("Garder sur « {name} » seulement", {
                            name: strays.home.name,
                          })}
                        </button>
                        <button
                          type="button"
                          className="small"
                          onClick={keepStrays}
                        >
                          {t("C’est voulu")}
                        </button>
                      </div>
                    </div>
                  )}
                {panel === "list" && (
                  <PlacesList
                    places={places}
                    hidden={hidden}
                    onHover={setHighlight}
                    onPick={(p) => {
                      if (narrow()) setPanel(null);
                      showPlace(p, true);
                    }}
                    onNudge={readOnly || locked ? undefined : nudge}
                    announce={nudged}
                  />
                )}
                {panel === "symbols" && (
                  <SymbolPalette
                    value={tool === "point" ? armed : undefined}
                    onPick={(id) => {
                      setArmed(id);
                      if (tool !== "point") {
                        setTool("point");
                        setDraft([]);
                      }
                      if (narrow()) setPanel(null);
                    }}
                  />
                )}
                {panel === "layers" && (
                  <LayersPanel
                    places={places}
                    hidden={hidden}
                    onToggle={toggleLayer}
                    onShowAll={() => setHiddenLayers([])}
                    ghosts={ghosts.length}
                    live={{
                      on: showLive,
                      past: viewAt !== null,
                      onToggle: (on) => {
                        setShowLive(on);
                        writeStore("orion.map.live", on);
                      },
                    }}
                    showGhosts={showGhosts}
                    onGhosts={(on) => {
                      setShowGhosts(on);
                      writeStore("orion.map.ghosts", on);
                    }}
                  />
                )}
                {panel === "layers" && (
                  <OverlayPanel
                    active={overlays}
                    status={liveStatus}
                    online={online}
                    onToggle={(id, on) =>
                      setOverlays((o) => {
                        const next = { ...o };
                        if (on) next[id] = overlayById(id)?.opacity ?? 0.7;
                        else delete next[id];
                        return next;
                      })
                    }
                    onOpacity={(id, opacity) =>
                      setOverlays((o) => ({ ...o, [id]: opacity }))
                    }
                  />
                )}
              </div>
            </aside>
          )}
        </div>

        <div className="map-controls">
          <button
            ref={baseButton}
            type="button"
            className="map-glass map-base-button"
            aria-haspopup="menu"
            aria-expanded={baseMenu}
            onClick={() => setBaseMenu((v) => !v)}
          >
            <Layers size={15} />
            <span>{BASES[base].label}</span>
          </button>
          <div className="map-glass map-control-stack">
            <button
              type="button"
              className="icon-button"
              aria-label={t("Zoom avant")}
              title={t("Zoom avant")}
              onClick={() => map.current?.zoomIn()}
            >
              <Plus size={17} />
            </button>
            <button
              type="button"
              className="icon-button"
              aria-label={t("Zoom arrière")}
              title={t("Zoom arrière")}
              onClick={() => map.current?.zoomOut()}
            >
              <Minus size={17} />
            </button>
          </div>
          {!readOnly && (
            <div className="map-glass map-control-stack">
              <button
                type="button"
                className="icon-button"
                aria-pressed={locked}
                aria-label={
                  locked
                    ? t("Déverrouiller les objets")
                    : t("Verrouiller les objets")
                }
                title={
                  locked
                    ? t(
                        "Objets verrouillés : aucun déplacement possible. Cliquer pour déverrouiller.",
                      )
                    : t(
                        "Verrouiller les objets (évite de les déplacer par erreur)",
                      )
                }
                onClick={() => {
                  const next = !locked;
                  setLocked(next);
                  writeStore("orion.map.locked", next);
                  toast(
                    next
                      ? t(
                          "Objets verrouillés : ils ne bougent plus, même en glissant dessus.",
                        )
                      : t(
                          "Objets déverrouillés : glisser un objet le déplace.",
                        ),
                  );
                }}
              >
                {locked ? <Lock size={16} /> : <LockOpen size={16} />}
              </button>
            </div>
          )}
          <div className="map-glass map-control-stack">
            <button
              type="button"
              className="icon-button"
              aria-label={t("Voir tous les objets")}
              title={t("Voir tous les objets")}
              onClick={fitAll}
            >
              <Expand size={16} />
            </button>
            <button
              type="button"
              className="icon-button"
              aria-label={t("Ma position")}
              title={t("Ma position")}
              onClick={locate}
            >
              <LocateFixed size={16} />
            </button>
            <LiveShareButton />
            <button
              type="button"
              className="icon-button"
              aria-label={t("Vue par défaut")}
              title={t("Revenir à la vue par défaut")}
              onClick={home}
            >
              <House size={16} />
            </button>
            <button
              type="button"
              className="icon-button"
              aria-pressed={full}
              aria-label={
                full ? t("Quitter le plein écran") : t("Carte en plein écran")
              }
              title={
                full
                  ? t("Quitter le plein écran (Échap)")
                  : t("Carte en plein écran")
              }
              onClick={() => setFull((v) => !v)}
            >
              {full ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
          </div>
        </div>

        {hint && (
          <div className="map-hint map-glass" role="status">
            {hint}
          </div>
        )}
        {tileError && (
          <div className="map-offline map-glass" role="status">
            <WifiOff size={15} />
            <span>
              {tileError === "offline"
                ? t(
                    "Hors ligne : le fond de carte n’est plus téléchargé. Les objets restent visibles ; les zones déjà consultées restent en cache.",
                  )
                : t(
                    "Le serveur du fond ({server}) ne répond pas. Les objets restent visibles.",
                    {
                      server: BASES[base].swiss ? "swisstopo" : "OpenStreetMap",
                    },
                  )}
            </span>
            {tileError === "unreachable" && (
              <button
                type="button"
                className="small"
                onClick={() => {
                  setTileError(null);
                  baseLayer.current?.redraw();
                }}
              >
                {t("Réessayer")}
              </button>
            )}
            <button
              type="button"
              className="icon-button"
              aria-label={t("Masquer")}
              onClick={() => setTileError(null)}
            >
              <X size={14} />
            </button>
          </div>
        )}

        <div className="map-bottom">
          <button
            ref={coordsButton}
            type="button"
            className="map-coords map-glass"
            title={
              crosshair
                ? t("Centre de la carte : cliquer pour copier (MN95 ou WGS84)")
                : t("Position du curseur : cliquer pour copier (MN95 ou WGS84)")
            }
            aria-haspopup="menu"
            aria-expanded={!!coordsMenu}
            onClick={() => {
              const m = map.current;
              if (!m) return;
              const c = m.getCenter().wrap();
              setCoordsMenu(
                crosshair || !lastCursor.current || narrow()
                  ? [c.lat, c.lng]
                  : lastCursor.current,
              );
            }}
          >
            <Crosshair size={13} />
            <span ref={coordsEl} className="mono" />
            <Copy size={12} className="map-coords-copy" />
          </button>
          <nav
            className="map-toolbar map-glass"
            aria-label={t("Outils de la carte")}
          >
            {tools.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  type="button"
                  className={`map-tool${tool === t.id ? " on" : ""}`}
                  aria-pressed={tool === t.id}
                  title={t.hint}
                  onClick={() =>
                    chooseTool(
                      tool === t.id && t.id !== "select" ? "select" : t.id,
                    )
                  }
                >
                  <Icon size={18} />
                  <span>{t.label}</span>
                </button>
              );
            })}
            <i className="map-toolbar-sep" aria-hidden="true" />
            {!readOnly && (
              <>
                <button
                  type="button"
                  className="map-tool icon"
                  aria-label={t("Annuler la dernière opération sur la carte")}
                  title={t("Annuler (⌘Z / Ctrl+Z) : opérations de ce poste")}
                  disabled={!canUndo}
                  onClick={() => step("undo")}
                >
                  <Undo2 size={18} />
                </button>
                <button
                  type="button"
                  className="map-tool icon"
                  aria-label={t("Rétablir l’opération annulée")}
                  title={t("Rétablir (⇧⌘Z / Ctrl+Y)")}
                  disabled={!canRedo}
                  onClick={() => step("redo")}
                >
                  <Redo2 size={18} />
                </button>
                <i className="map-toolbar-sep" aria-hidden="true" />
              </>
            )}
            <button
              type="button"
              className={`map-tool${panel ? " on" : ""}`}
              aria-pressed={!!panel}
              title={t("Liste des objets, signes et calques")}
              onClick={() => setPanel(panel ? null : "list")}
            >
              <List size={18} />
              <span>{t("Liste")}</span>
            </button>
          </nav>
        </div>
      </div>

      {slots.map((s) => {
        const p = byId.get(s.id);
        if (!p) return null;
        return createPortal(
          <PinBody
            place={p}
            hot={s.id === highlight || s.id === sheetId || s.id === hot}
            links={graph.degree.get(ref("place", p.id)) ?? 0}
            editable={s.id === sheetId && canDrag}
            onStyle={onStyle}
          />,
          s.el,
          s.id,
        );
      })}

      {baseMenu && (
        <Popover
          anchor={baseButton.current}
          onClose={() => setBaseMenu(false)}
          align="end"
        >
          {(Object.keys(BASES) as BaseId[]).map((id) => (
            <button
              key={id}
              type="button"
              role="menuitemradio"
              aria-checked={base === id}
              data-close
              className={base === id ? "active" : ""}
              onClick={() => chooseBase(id)}
            >
              <span className={`map-base-swatch ${id}`} aria-hidden="true" />
              <span className="row-main">
                <strong>{BASES[id].label}</strong>
                <small className="muted">{BASES[id].hint}</small>
              </span>
              {base === id && <Check size={14} />}
            </button>
          ))}
          <hr />
          <button
            type="button"
            role="menuitemcheckbox"
            aria-checked={showGrid}
            onClick={() => setShowGrid((v) => !v)}
          >
            <Grid3x3 size={16} />
            <span className="row-main">
              <strong>{t("Quadrillage MN95")}</strong>
              <small className="muted">
                {t("1 km, 100 m en zoom rapproché")}
              </small>
            </span>
            {showGrid && <Check size={14} />}
          </button>
          <button
            type="button"
            role="menuitemcheckbox"
            aria-checked={crosshair}
            onClick={() => setCrosshair((v) => !v)}
          >
            <Crosshair size={16} />
            <span className="row-main">
              <strong>{t("Réticule au centre")}</strong>
              <small className="muted">
                {t("Coordonnées du centre, à copier")}
              </small>
            </span>
            {crosshair && <Check size={14} />}
          </button>
          <button
            type="button"
            role="menuitem"
            data-close
            onClick={() => {
              setPanel("layers");
              setBaseMenu(false);
            }}
          >
            <Layers size={16} />
            <span className="row-main">
              <strong>{t("Couches geo.admin.ch…")}</strong>
              <small className="muted">
                {t("Dangers, cadastre, crues et vent en direct")}
                {Object.keys(overlays).length
                  ? ` · ${t("{n} affichée(s)", { n: Object.keys(overlays).length })}`
                  : ""}
              </small>
            </span>
          </button>
        </Popover>
      )}

      {hover && !sheetPlace && <MapHover hover={hover} />}

      <LiveLayer
        mapRef={map}
        show={showLive && viewAt === null}
        onCreatePoint={createFromLive}
      />

      {ghostMenu &&
        createPortal(
          <div
            className="hovercard map-ghost-card"
            style={{
              left: Math.max(
                8,
                Math.min(ghostMenu.x + 12, window.innerWidth - 336),
              ),
              top: Math.max(
                8,
                Math.min(ghostMenu.y + 12, window.innerHeight - 320),
              ),
            }}
            role="dialog"
            aria-label={t("Position citée")}
          >
            <ItemPreview target={ghostMenu.target} limit={5} />
            <p className="map-ghost-where mono">
              {formatPosition(ghostMenu.lat, ghostMenu.lng)}
            </p>
            <div className="map-ghost-actions">
              {!readOnly && (
                <button
                  type="button"
                  className="small primary"
                  onClick={() => createFromGhost(ghostMenu)}
                >
                  <MapPin size={13} />
                  {t("Créer un objet ici")}
                </button>
              )}
              <button
                type="button"
                className="small"
                onClick={() => {
                  setGhostMenu(null);
                  open(ghostMenu.target);
                }}
              >
                {t("Ouvrir")}
              </button>
              <button
                type="button"
                className="icon-button"
                aria-label={t("Fermer")}
                onClick={() => setGhostMenu(null)}
              >
                <X size={14} />
              </button>
            </div>
          </div>,
          document.body,
        )}

      {info &&
        createPortal(
          <div
            className="hovercard map-info-card"
            style={{
              left: Math.max(8, Math.min(info.x + 12, window.innerWidth - 336)),
              top: Math.max(8, Math.min(info.y + 12, window.innerHeight - 340)),
            }}
            role="dialog"
            aria-label={t("Informations de la couche")}
          >
            <header>
              <span className="label">
                {info.loading
                  ? t("Recherche…")
                  : (info.items[0]?.source ?? "geo.admin.ch")}
              </span>
              <button
                type="button"
                className="icon-button"
                aria-label={t("Fermer")}
                onClick={() => setInfo(null)}
              >
                <X size={14} />
              </button>
            </header>
            {info.error && <p className="muted">{info.error}</p>}
            {info.items.map((item, i) => (
              <section key={i}>
                <strong>{item.title}</strong>
                {item.rows.length > 0 && (
                  <dl>
                    {item.rows.map(([k, v], j) => (
                      <div key={j}>
                        <dt>{k}</dt>
                        <dd>{v}</dd>
                      </div>
                    ))}
                  </dl>
                )}
              </section>
            ))}
          </div>,
          document.body,
        )}

      {coordsMenu && (
        <Popover
          anchor={coordsButton.current}
          onClose={() => setCoordsMenu(null)}
        >
          {(() => {
            const [lat, lng] = coordsMenu;
            const mn95 = mn95Text(lat, lng);
            const copy = (
              text: string,
              done:
                | "Coordonnées MN95 copiées : {text}"
                | "Coordonnées WGS84 copiées : {text}",
            ) => {
              navigator.clipboard?.writeText(text).then(
                () => toast(t(done, { text })),
                () => toast(t("Copie impossible.")),
              );
            };
            return (
              <>
                {mn95 && (
                  <button
                    type="button"
                    role="menuitem"
                    data-close
                    onClick={() =>
                      copy(mn95, "Coordonnées MN95 copiées : {text}")
                    }
                  >
                    <Copy size={14} />
                    <span className="row-main">
                      <strong>{t("MN95")}</strong>
                      <small className="mono">{formatMN95(lat, lng)}</small>
                    </span>
                  </button>
                )}
                <button
                  type="button"
                  role="menuitem"
                  data-close
                  onClick={() =>
                    copy(
                      formatWgs(lat, lng),
                      "Coordonnées WGS84 copiées : {text}",
                    )
                  }
                >
                  <Copy size={14} />
                  <span className="row-main">
                    <strong>WGS84</strong>
                    <small className="mono">{formatWgs(lat, lng)}</small>
                  </span>
                </button>
              </>
            );
          })()}
        </Popover>
      )}

      {sheetPlace && (
        <PlaceSheet
          key={`${sheetPlace.id}${readOnly ? ":ro" : ""}`}
          place={sheetPlace}
          maps={maps}
          onClose={() => setSheetId(null)}
          onCenter={(p) => showPlace(p, true)}
          onEditShape={(p) => {
            setSheetId(null);
            chooseTool("select");
            setShapeEdit({
              id: p.id,
              points: p.points.map((x) => [...x] as LatLng),
            });
            showPlace(p, false);
          }}
        />
      )}

      {mapDialog && (
        <MapDialog
          map={mapDialog === "edit" ? currentMap : null}
          main={mapDialog === "edit" && !currentMap}
          current={{
            base,
            hidden: hiddenList,
            view: (() => {
              const m = map.current;
              if (!m) return viewOf(currentMap);
              const c = m.getCenter().wrap();
              return { lat: c.lat, lng: c.lng, zoom: m.getZoom() };
            })(),
          }}
          shown={mapId}
          onClose={() => setMapDialog(null)}
          onSelect={(id) => {
            // A new map starts from the view shown: no flight.
            if (!known.has(id)) shownMap.current = id;
            selectMap(id);
          }}
        />
      )}
      {importing && (
        <ImportDialog
          maps={maps}
          current={mapId}
          onClose={() => setImporting(false)}
          onDone={fitPoints}
        />
      )}
      {sectorDialog && map.current && (
        <SectorDialog
          view={(() => {
            const b = map.current!.getBounds();
            return [
              [b.getSouth(), b.getWest()],
              [b.getNorth(), b.getEast()],
            ] as Bounds;
          })()}
          zoom={map.current.getZoom()}
          box={sectorBox}
          base={base}
          overlays={(overlayManager.current?.tileTemplates() ?? []).map(
            (o) => ({
              id: o.id,
              url: o.url,
              label: overlayById(o.id)?.label ?? o.id,
            }),
          )}
          onDrawBox={() => {
            setSectorDialog(false);
            chooseTool("box");
          }}
          onShow={(b) => {
            setSectorDialog(false);
            fitPoints([b[0], b[1]]);
          }}
          onClose={() => setSectorDialog(false)}
        />
      )}
      {printing && map.current && (
        <PrintDialog
          mapId={mapId}
          mapName={currentMap?.name ?? MAIN_NAME}
          center={(() => {
            const c = map.current!.getCenter().wrap();
            return [c.lat, c.lng] as LatLng;
          })()}
          base={base}
          overlays={(overlayManager.current?.tileTemplates() ?? []).map(
            (o) => ({
              url: o.url,
              opacity: o.opacity,
              label: overlayById(o.id)?.label ?? o.id,
            }),
          )}
          onClose={() => setPrinting(false)}
        />
      )}
    </Ctx.Provider>
  );
}
export default MapModule;
