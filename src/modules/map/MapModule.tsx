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
  Crosshair,
  Expand,
  House,
  Layers,
  List,
  LocateFixed,
  Lock,
  LockOpen,
  MapPin,
  Minus,
  MousePointer2,
  Pencil,
  Pentagon,
  Pin,
  Plus,
  Ruler,
  Spline,
  Type,
  Undo2,
  WifiOff,
  X,
  type LucideIcon,
} from "lucide-react";
import { current } from "../../../shared/journal";
import {
  upsert,
  type InputOf,
  type OpsMap,
  type Place,
} from "../../../shared/ops";
import {
  KIND_INFO,
  addLink,
  parseRef,
  ref,
  type Ref,
} from "../../../shared/links";
import { useApp } from "../../app/context";
import { ModuleHead } from "../../ui/ModuleHead";
import { ItemPreview } from "../../ui/links";
import { Popover } from "../../ui/Popover";
import {
  areaOf,
  circlePoints,
  formatArea,
  formatDistance,
  formatPosition,
  lengthOf,
  parseCoordinates,
  type LatLng,
} from "./geo";
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
import { MAIN_MAP, hexColor, onMap, simplify, sortMaps } from "./maps";
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
  | "freehand"
  | "text"
  | "measure";
type Panel = "list" | "symbols" | "layers" | null;
type Hover = { target: Ref; x: number; y: number; hint: string };
type Ghost = { target: Ref; lat: number; lng: number; title: string };
type View = { lat: number; lng: number; zoom: number };
type Style = Pick<Place, "size" | "rotation">;
/** Background or hidden layers chosen while the journal is read-only. */
type Override = { base?: BaseId; hidden?: string[] };

const SWISSTOPO =
  '© <a href="https://www.swisstopo.admin.ch/fr/" target="_blank" rel="noopener noreferrer">swisstopo</a>';
const OSM =
  '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">les contributeurs d’OpenStreetMap</a>';

const TOOLS: {
  id: Tool;
  label: string;
  icon: LucideIcon;
  write: boolean;
  hint: string;
}[] = [
  {
    id: "select",
    label: "Sélection",
    icon: MousePointer2,
    write: false,
    hint: "Sélectionner et déplacer",
  },
  {
    id: "point",
    label: "Point",
    icon: MapPin,
    write: true,
    hint: "Placer un signe",
  },
  {
    id: "line",
    label: "Ligne",
    icon: Spline,
    write: true,
    hint: "Tracer une ligne ou un itinéraire",
  },
  {
    id: "area",
    label: "Zone",
    icon: Pentagon,
    write: true,
    hint: "Dessiner une zone",
  },
  {
    id: "circle",
    label: "Périmètre",
    icon: CircleDashed,
    write: true,
    hint: "Périmètre circulaire : un centre, un rayon",
  },
  {
    id: "freehand",
    label: "Dessin",
    icon: Pencil,
    write: true,
    hint: "Dessin libre, à la souris ou au doigt",
  },
  {
    id: "text",
    label: "Texte",
    icon: Type,
    write: true,
    hint: "Écrire un texte sur la carte",
  },
  {
    id: "measure",
    label: "Mesurer",
    icon: Ruler,
    write: false,
    hint: "Mesurer une distance ou une surface",
  },
];
const DRAWING: Tool[] = ["line", "area", "circle", "measure"];
/** Radii offered once the centre of a perimeter is placed, in metres. */
const RADII = [50, 100, 200, 300, 500, 1000];

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

const layerForKind = (kind: string) =>
  kind === "resource"
    ? "Moyens"
    : kind === "message" || kind === "entry"
      ? "Effets"
      : "Autre";
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
      knob.addEventListener("pointerdown", down);
      blocked.forEach((t) => knob.addEventListener(t, stop));
      offs.push(() => {
        knob.removeEventListener("pointerdown", down);
        blocked.forEach((t) => knob.removeEventListener(t, stop));
      });
    }
    return () => offs.forEach((off) => off());
  }, []);
  return (
    <div ref={ref} className="map-handles" aria-hidden="true">
      <span
        data-handle="rotate"
        className="map-handle rotate"
        title="Glisser pour tourner"
      />
      <span
        data-handle="size"
        className="map-handle size"
        title="Glisser pour agrandir ou réduire"
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
        {place.label || "Texte"}
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
};

export function MapModule() {
  const {
    journal,
    live,
    viewAt,
    author,
    readOnly,
    graph,
    updateOps,
    lists,
    focus,
    setFocus,
    open,
    toast,
    exportCenter,
  } = useApp();
  const catalog = useCatalog();
  useCustomSymbolsSync(journal.ops.symbols, live.ops.symbols);
  const allPlaces = journal.ops.places;
  const settingsCenter = journal.ops.settings.mapCenter;

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
  const [drawLayer, setDrawLayer] = useState(() =>
    readStore("orion.map.drawLayer", "Effets", (v) => typeof v === "string"),
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
      // or editing in progress.
      setTool("select");
      setDraft([]);
      setMeasureDone(false);
      setShapeEdit(null);
      setPending(null);
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
  });
  state.current = {
    tool,
    draft,
    measureDone,
    readOnly,
    canDrag,
    byId,
    mapId,
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
      if (coordsEl.current)
        coordsEl.current.textContent = formatPosition(lat, lng);
      drawSketch(e.latlng);
    });
    m.on("mouseout", () => drawSketch(null));
    m.on("moveend", () => {
      const c = m.getCenter().wrap();
      writeStore(viewKey(state.current.mapId), {
        lat: round6(c.lat),
        lng: round6(c.lng),
        zoom: m.getZoom(),
      });
      if (narrow()) showCenter();
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
    const registryMap = registry.current;
    return () => {
      observer.disconnect();
      registryMap.clear();
      groups.current = null;
      map.current = null;
      m.remove();
    };
  }, []);

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
      attribution: b.swiss ? SWISSTOPO : OSM,
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
  });

  function makeShape(p: Place) {
    const tone = toneOf(p.layer);
    const w = p.weight;
    const color = hexColor(p.color);
    const options: L.PolylineOptions = {
      className: `map-shape tone-${tone}${color ? " custom" : ""}${p.kind === "area" ? " area" : ""}`,
      weight: w,
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
      ...(color ? { color, fillColor: color } : {}),
    };
    const shape =
      p.kind === "area"
        ? L.polygon(p.points, options)
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
        state.current.byId.get(p.id)?.label || "Objet de la carte",
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
        const m = map.current;
        if (!m || !from) return;
        const to = marker.getLatLng();
        const moved = m
          .latLngToContainerPoint(to)
          .distanceTo(m.latLngToContainerPoint(from));
        if (cancelled || moved < DRAG_THRESHOLD) marker.setLatLng(from);
        else handlers.current.placeMoved(p.id, to);
      });
    });
    return { marker, el };
  }

  const moving = useRef(
    new WeakMap<HTMLElement, ReturnType<typeof setTimeout>>(),
  ).current;
  useEffect(() => {
    const g = groups.current;
    if (!g) return;
    const reg = registry.current;
    const seen = new Set<string>();
    let changed = false;
    for (const p of visible) {
      seen.add(p.id);
      const known = reg.get(p.id);
      if (known && known.updatedAt === p.updatedAt && known.kind === p.kind)
        continue;
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
          ?.setAttribute("aria-label", p.label || "Objet de la carte");
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
        marker.addTo(g.objects);
        reg.set(p.id, {
          layer: marker,
          el,
          updatedAt: p.updatedAt,
          kind: p.kind,
        });
        changed = true;
      } else {
        const shape = makeShape(p).addTo(g.objects);
        reg.set(p.id, { layer: shape, updatedAt: p.updatedAt, kind: p.kind });
      }
    }
    for (const [id, e] of reg)
      if (!seen.has(id)) {
        e.layer.remove();
        reg.delete(id);
        changed ||= !!e.el;
      }
    if (changed)
      setSlots(
        [...reg].filter(([, e]) => e.el).map(([id, e]) => ({ id, el: e.el! })),
      );
  }, [visible]);

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
  useEffect(() => {
    for (const [id, e] of registry.current) {
      if (e.el) continue;
      const path = (e.layer as L.Polyline).getElement();
      path?.classList.toggle(
        "hot",
        id === highlight || id === sheetId || id === hot,
      );
    }
  }, [highlight, sheetId, hot, visible]);

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
          ?.setAttribute("aria-label", `Position citée : ${ghost.title}`);
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
    const { tool: t, draft: pts, measureDone: done } = state.current;
    const drawing = DRAWING.includes(t);
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
    if (t === "circle") {
      const center = pts[0];
      const r = cursor && !done ? lengthOf([center, live[live.length - 1]]) : 0;
      g.line.setLatLngs([]);
      g.poly.setLatLngs(r ? circlePoints(center, r) : []);
      g.rubber.setLatLngs(r ? [center, live[live.length - 1]] : []);
      if (liveEl.current)
        liveEl.current.textContent = r
          ? `rayon ${formatDistance(r)} · surface ${formatArea(Math.PI * r * r)}`
          : "";
      return;
    }
    if (t === "area") {
      g.line.setLatLngs([]);
      g.poly.setLatLngs(live);
    } else {
      g.line.setLatLngs(pts);
      g.poly.setLatLngs(t === "measure" && live.length >= 3 ? live : []);
    }
    const last = pts[pts.length - 1];
    g.rubber.setLatLngs(
      cursor && !done
        ? t === "area" && pts.length > 1
          ? [last, [cursor.lat, cursor.lng], pts[0]]
          : [last, [cursor.lat, cursor.lng]]
        : [],
    );
    if (liveEl.current) {
      const parts: string[] = [];
      if (t !== "area" || live.length < 3)
        parts.push(formatDistance(lengthOf(live)));
      else
        parts.push(`périmètre ${formatDistance(lengthOf([...live, live[0]]))}`);
      if (live.length >= 3 && t !== "line")
        parts.push(`surface ${formatArea(areaOf(live))}`);
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
  }, [draft, tool, measureDone]);

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
    pts.forEach((p, i) => {
      const v = L.marker(p, {
        icon: handle("", 16),
        draggable: true,
        keyboard: false,
      }).addTo(g.edit);
      v.on("drag", () => {
        const at = v.getLatLng();
        pts[i] = [round6(at.lat), round6(at.lng)];
        shape.setLatLngs(pts);
      });
      v.on("dragend", () =>
        setShapeEdit((s) => (s ? { ...s, points: [...pts] } : s)),
      );
      v.on("click", () => {
        if (pts.length <= min) return toast(`Au moins ${min} sommets.`);
        setShapeEdit((s) =>
          s ? { ...s, points: pts.filter((_, j) => j !== i) } : s,
        );
      });
    });
    const segments = area ? pts.length : pts.length - 1;
    for (let i = 0; i < segments; i++) {
      const a = pts[i];
      const b = pts[(i + 1) % pts.length];
      const mid: LatLng = [
        round6((a[0] + b[0]) / 2),
        round6((a[1] + b[1]) / 2),
      ];
      const add = L.marker(mid, {
        icon: handle("mid", 12),
        keyboard: false,
      }).addTo(g.edit);
      add.on("click", () =>
        setShapeEdit((s) =>
          s && s.points.length < 500
            ? {
                ...s,
                points: [...pts.slice(0, i + 1), mid, ...pts.slice(i + 1)],
              }
            : s,
        ),
      );
    }
  }, [shapeEdit, editKind, toast]);

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
    // Drawn on a given map: belongs to it (while there are several maps).
    const own = maps.length > 1 && currentMap ? [currentMap.id] : [];
    try {
      updateOps((ops) => {
        const next = upsert(ops, "places", { maps: own, ...place, id }, author);
        return link
          ? addLink(next, ref("place", id), link, "position", author)
          : next;
      });
      return id;
    } catch (err) {
      toast((err as Error).message);
      return null;
    }
  }

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
    const info = describeSymbol(armed, catalog);
    const target = pending?.target;
    const id = create(
      {
        label: (pending?.title ?? info.name).slice(0, 200),
        kind: "point",
        symbol: armed,
        color: "",
        layer: target ? layerForKind(parseRef(target).kind) : info.layer,
        points: [[round6(at.lat), round6(at.lng)]],
        notes: "",
      },
      target,
    );
    if (!id) return;
    rememberSymbol(armed);
    if (pending) toast(`« ${pending.title} » est placé sur la carte.`);
    setPending(null);
    chooseTool("select");
    setSheetId(id);
  }

  function finish() {
    const m = map.current;
    const { tool: t, draft: raw, readOnly: locked } = state.current;
    if (
      !m ||
      !DRAWING.includes(t) ||
      t === "circle" ||
      (locked && t !== "measure")
    )
      return;
    // A double click adds the same vertex twice.
    const pts = raw.filter((p, i) => {
      if (!i) return true;
      const a = m.latLngToContainerPoint(raw[i - 1]);
      return a.distanceTo(m.latLngToContainerPoint(p)) > 5;
    });
    if (t === "measure") {
      setDraft(pts);
      setMeasureDone(true);
      return;
    }
    if (t === "line" && pts.length < 2)
      return toast("Un tracé demande au moins deux points.");
    if (t === "area" && pts.length < 3)
      return toast("Une zone demande au moins trois points.");
    const id = create({
      label: "",
      kind: t === "area" ? "area" : "line",
      symbol: "",
      color: "",
      layer: drawLayer,
      points: pts.slice(0, 500),
      notes: "",
    });
    if (!id) return;
    chooseTool("select");
    setSheetId(id);
  }

  /** A perimeter: an area drawn as a circle, labelled with its radius. */
  function createCircle(center: LatLng, radius: number) {
    if (radius < 5) return toast("Rayon trop petit : au moins 5 m.");
    const id = create({
      label: `Périmètre ${formatDistance(radius)}`,
      kind: "area",
      symbol: "",
      color: "",
      layer: drawLayer,
      points: circlePoints(center, radius),
      notes: `Centre ${formatPosition(center[0], center[1])} · rayon ${formatDistance(radius)}`,
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
      toast("Forme enregistrée.");
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
        layer: layerForKind(kind),
        points: [[round6(g.lat), round6(g.lng)]],
        notes: "",
      },
      g.target,
    );
    setGhostMenu(null);
    if (id) setSheetId(id);
  }

  handlers.current = {
    mapClick: (at) => {
      setGhostMenu(null);
      // The sheet of an object stays beside the map: a click elsewhere
      // on the map closes it.
      if (tool === "select") return setSheetId(null);
      if (tool === "freehand") return;
      if (readOnly && tool !== "measure") return;
      const pt: LatLng = [round6(at.lat), round6(at.wrap().lng)];
      if (tool === "point") placePoint(at.wrap());
      else if (tool === "text") {
        const id = create({
          label: "Texte",
          kind: "text",
          symbol: "",
          color: "",
          layer: "Autre",
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
                  ? "Cliquer pour ouvrir"
                  : "Cliquer pour ouvrir · glisser pour déplacer"
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
            hint: "Position citée · cliquer pour la placer",
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
        return toast("Journal clôturé : la carte est en lecture seule.");
      if (!item) return toast("Élément introuvable.");
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
    else toast("Cet objet n’est plus sur la carte.");
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
      if (document.querySelector(".sheet-panel, dialog[open]")) return;
      if (e.key === "Escape") {
        if (ghostMenu) setGhostMenu(null);
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
    if (!pts.length) return toast("Aucun objet visible à afficher.");
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
      return toast("Position indisponible sur cet appareil.");
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        goTo(pos.coords.latitude, pos.coords.longitude, 16, "Ma position"),
      (err) =>
        toast(
          err.code === err.PERMISSION_DENIED
            ? "Position refusée : autorisez la localisation dans le navigateur."
            : "Position indisponible pour le moment.",
        ),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 },
    );
  }

  /** Framing of the map shown, for every post. */
  function saveFraming() {
    const m = map.current;
    if (!m) return;
    if (readOnly)
      return toast("Lecture seule : le cadrage n’est pas enregistré.");
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
          ? `Cadrage enregistré pour « ${currentMap.name} ».`
          : "Vue par défaut enregistrée pour ce journal.",
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

  const armedInfo = describeSymbol(armed, catalog);
  const drawing = DRAWING.includes(tool);
  const tools = TOOLS.filter((t) => !readOnly || !t.write);
  const layerOptions = lists("layers");

  let hint: ReactNode = null;
  if (shapeEdit)
    hint = (
      <>
        <span>
          Glissez les sommets · cliquez un sommet pour le retirer · « + » pour
          en ajouter
        </span>
        <button type="button" className="small primary" onClick={saveShape}>
          <Check size={13} />
          Enregistrer
        </button>
        <button
          type="button"
          className="small"
          onClick={() => setShapeEdit(null)}
        >
          Annuler
        </button>
      </>
    );
  else if (tool === "point")
    hint = (
      <>
        <Glyph symbol={armed} size={24} />
        <span>
          {pending
            ? `Cliquez sur la carte pour placer « ${pending.title} »`
            : `Cliquez sur la carte pour placer « ${armedInfo.name} »`}
        </span>
        <button
          type="button"
          className="icon-button"
          aria-label="Annuler le placement"
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
          Dessinez à la souris ou au doigt · chaque trait devient un tracé
        </span>
        <select
          className="map-hint-layer"
          value={drawLayer}
          aria-label="Calque des traits"
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
          aria-label="Fermer le dessin libre"
          onClick={() => chooseTool("select")}
        >
          <X size={15} />
        </button>
      </>
    );
  else if (tool === "text")
    hint = (
      <>
        <span>Cliquez à l’endroit où écrire le texte.</span>
        <button
          type="button"
          className="icon-button"
          aria-label="Annuler"
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
            ? "Cliquez pour fixer le rayon, ou choisissez :"
            : "Cliquez le centre du périmètre"}
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
                {r < 1000 ? `${r} m` : `${r / 1000} km`}
              </button>
            ))}
            <strong className="mono map-live" ref={liveEl} />
          </>
        )}
        <select
          className="map-hint-layer"
          value={drawLayer}
          aria-label="Calque du périmètre"
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
          aria-label="Fermer l’outil"
          onClick={() => chooseTool("select")}
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
              ? "Mesure terminée · cliquez pour recommencer"
              : draft.length
                ? "Double-clic pour terminer la mesure"
                : "Cliquez des points pour mesurer"
            : draft.length
              ? "Double-clic ou « Terminer » pour finir · Échap pour annuler"
              : tool === "line"
                ? "Cliquez pour tracer la ligne, point par point"
                : "Cliquez les coins de la zone"}
        </span>
        <strong className="mono map-live" ref={liveEl} />
        {tool !== "measure" && (
          <select
            className="map-hint-layer"
            value={drawLayer}
            aria-label="Calque du nouvel objet"
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
            aria-label="Retirer le dernier point"
            title="Retirer le dernier point (⌫)"
            onClick={() => setDraft((d) => d.slice(0, -1))}
          >
            <Undo2 size={15} />
          </button>
        )}
        {tool !== "measure" && draft.length >= (tool === "area" ? 3 : 2) && (
          <button type="button" className="small primary" onClick={finish}>
            <Check size={13} />
            Terminer
          </button>
        )}
        <button
          type="button"
          className="icon-button"
          aria-label="Fermer l’outil"
          onClick={() => chooseTool("select")}
        >
          <X size={15} />
        </button>
      </>
    );

  return (
    <>
      <ModuleHead
        actions={
          !readOnly && (
            <button
              type="button"
              onClick={saveFraming}
              title={`${currentMap ? `« ${currentMap.name} »` : "La carte"} s’ouvrira ici pour tous les postes`}
            >
              <Pin size={14} />
              Enregistrer le cadrage
            </button>
          )
        }
      />
      <div
        ref={shell}
        className={`map-shell tool-${tool}${base === "night" ? " night dark-base" : base === "aerial" ? " dark-base" : ""}${panel ? " with-panel" : ""}${hint ? " has-hint" : ""}${viewAt !== null ? " past" : ""}`}
        style={{ height }}
      >
        <div
          ref={root}
          className="map-canvas"
          role="application"
          aria-label="Carte de situation"
        />

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
          />
          <MapSearch onGo={goTo} />
          {panel && (
            <aside
              className="map-panel map-glass"
              aria-label="Panneau de la carte"
            >
              <header className="map-panel-head">
                <div className="seg" role="tablist">
                  <button
                    type="button"
                    aria-pressed={panel === "list"}
                    onClick={() => setPanel("list")}
                  >
                    Objets <small>{places.length}</small>
                  </button>
                  {!readOnly && (
                    <button
                      type="button"
                      aria-pressed={panel === "symbols"}
                      onClick={() => setPanel("symbols")}
                    >
                      Signes
                    </button>
                  )}
                  <button
                    type="button"
                    aria-pressed={panel === "layers"}
                    onClick={() => setPanel("layers")}
                  >
                    Calques
                  </button>
                </div>
                <button
                  type="button"
                  className="icon-button"
                  aria-label="Fermer le panneau"
                  onClick={() => setPanel(null)}
                >
                  <X size={16} />
                </button>
              </header>
              <div className="map-panel-body">
                {panel === "list" && (
                  <PlacesList
                    places={places}
                    hidden={hidden}
                    onHover={setHighlight}
                    onPick={(p) => {
                      if (narrow()) setPanel(null);
                      showPlace(p, true);
                    }}
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
                    showGhosts={showGhosts}
                    onGhosts={(on) => {
                      setShowGhosts(on);
                      writeStore("orion.map.ghosts", on);
                    }}
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
              aria-label="Zoom avant"
              title="Zoom avant"
              onClick={() => map.current?.zoomIn()}
            >
              <Plus size={17} />
            </button>
            <button
              type="button"
              className="icon-button"
              aria-label="Zoom arrière"
              title="Zoom arrière"
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
                  locked ? "Déverrouiller les objets" : "Verrouiller les objets"
                }
                title={
                  locked
                    ? "Objets verrouillés : aucun déplacement possible. Cliquer pour déverrouiller."
                    : "Verrouiller les objets (évite de les déplacer par erreur)"
                }
                onClick={() => {
                  const next = !locked;
                  setLocked(next);
                  writeStore("orion.map.locked", next);
                  toast(
                    next
                      ? "Objets verrouillés : ils ne bougent plus, même en glissant dessus."
                      : "Objets déverrouillés : glisser un objet le déplace.",
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
              aria-label="Voir tous les objets"
              title="Voir tous les objets"
              onClick={fitAll}
            >
              <Expand size={16} />
            </button>
            <button
              type="button"
              className="icon-button"
              aria-label="Ma position"
              title="Ma position"
              onClick={locate}
            >
              <LocateFixed size={16} />
            </button>
            <button
              type="button"
              className="icon-button"
              aria-label="Vue par défaut"
              title="Revenir à la vue par défaut"
              onClick={home}
            >
              <House size={16} />
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
                ? "Hors ligne : le fond de carte n’est plus téléchargé. Les objets restent visibles ; les zones déjà consultées restent en cache."
                : `Le serveur du fond (${BASES[base].swiss ? "swisstopo" : "OpenStreetMap"}) ne répond pas. Les objets restent visibles.`}
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
                Réessayer
              </button>
            )}
            <button
              type="button"
              className="icon-button"
              aria-label="Masquer"
              onClick={() => setTileError(null)}
            >
              <X size={14} />
            </button>
          </div>
        )}

        <div className="map-bottom">
          <div
            className="map-coords map-glass"
            title="Position du curseur (MN95 en Suisse)"
          >
            <Crosshair size={13} />
            <span ref={coordsEl} className="mono" />
          </div>
          <nav
            className="map-toolbar map-glass"
            aria-label="Outils de la carte"
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
            <button
              type="button"
              className={`map-tool${panel ? " on" : ""}`}
              aria-pressed={!!panel}
              title="Liste des objets, signes et calques"
              onClick={() => setPanel(panel ? null : "list")}
            >
              <List size={18} />
              <span>Liste</span>
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
        </Popover>
      )}

      {hover && !sheetPlace && <MapHover hover={hover} />}

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
            aria-label="Position citée"
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
                  Créer un objet ici
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
                Ouvrir
              </button>
              <button
                type="button"
                className="icon-button"
                aria-label="Fermer"
                onClick={() => setGhostMenu(null)}
              >
                <X size={14} />
              </button>
            </div>
          </div>,
          document.body,
        )}

      {sheetPlace && (
        <PlaceSheet
          key={sheetPlace.id}
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
    </>
  );
}
export default MapModule;
