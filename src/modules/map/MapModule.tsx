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
  Crosshair,
  Expand,
  House,
  Layers,
  List,
  LocateFixed,
  MapPin,
  Minus,
  MousePointer2,
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
import { upsert, type Place } from "../../../shared/ops";
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
  formatArea,
  formatDistance,
  formatPosition,
  lengthOf,
  parseCoordinates,
  type LatLng,
} from "./geo";
import { MapSearch } from "./MapSearch";
import { PlaceSheet } from "./PlaceSheet";
import { LayersPanel, PlacesList, layerKey, toneOf } from "./panels";
import {
  Glyph,
  SymbolPalette,
  describeSymbol,
  recentSymbols,
  rememberSymbol,
  useCatalog,
} from "./symbols";
import "./map.css";

// Situation map: swisstopo background, official civil symbols, lines and
// areas, and everything linked to each object on hover. Leaflet is driven
// imperatively; marker contents are React portals so they follow the data
// without rebuilding the map.

type Tool = "select" | "point" | "line" | "area" | "text" | "measure";
type Panel = "list" | "symbols" | "layers" | null;
type BaseId = keyof typeof BASES;
type Hover = { target: Ref; x: number; y: number; hint: string };
type Ghost = { target: Ref; lat: number; lng: number; title: string };

const WMTS = (layer: string) =>
  `https://wmts.geo.admin.ch/1.0.0/${layer}/default/current/3857/{z}/{x}/{y}.jpeg`;
const SWISSTOPO =
  '© <a href="https://www.swisstopo.admin.ch/fr/" target="_blank" rel="noopener noreferrer">swisstopo</a>';
const OSM =
  '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">les contributeurs d’OpenStreetMap</a>';
const SWISS_BOUNDS: L.LatLngBoundsExpression = [
  [45.3, 5.0],
  [48.4, 11.6],
];
const BASES = {
  color: {
    label: "Carte couleur",
    hint: "swisstopo",
    url: WMTS("ch.swisstopo.pixelkarte-farbe"),
    native: 19,
    swiss: true,
    className: "",
  },
  gray: {
    label: "Carte grise",
    hint: "swisstopo",
    url: WMTS("ch.swisstopo.pixelkarte-grau"),
    native: 19,
    swiss: true,
    className: "",
  },
  aerial: {
    label: "Vue aérienne",
    hint: "SWISSIMAGE",
    url: WMTS("ch.swisstopo.swissimage"),
    native: 20,
    swiss: true,
    className: "",
  },
  night: {
    label: "Nuit",
    hint: "carte grise inversée",
    url: WMTS("ch.swisstopo.pixelkarte-grau"),
    native: 19,
    swiss: true,
    className: "map-night",
  },
  osm: {
    label: "OpenStreetMap",
    hint: "hors de Suisse",
    url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    native: 19,
    swiss: false,
    className: "",
  },
} as const;

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
const DRAWING: Tool[] = ["line", "area", "measure"];
const GENEVA = { lat: 46.2044, lng: 6.1432, zoom: 13 };

const round6 = (n: number) => Math.round(n * 1e6) / 1e6;
const reducedMotion = () =>
  document.documentElement.dataset.motion === "reduced" ||
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
const narrow = () => window.innerWidth <= 900;

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

/** Content of a point or text marker, rendered into Leaflet's icon element. */
const PinBody = memo(function PinBody({
  place,
  hot,
  links,
}: {
  place: Place;
  hot: boolean;
  links: number;
}) {
  if (place.kind === "text")
    return (
      <div
        className={`map-text${hot ? " hot" : ""}`}
        style={
          place.color ? ({ "--c": place.color } as CSSProperties) : undefined
        }
      >
        {place.label || "Texte"}
      </div>
    );
  return (
    <div
      className={`map-pin${hot ? " hot" : ""}`}
      style={
        place.color ? ({ "--ring": place.color } as CSSProperties) : undefined
      }
    >
      <Glyph symbol={place.symbol} color={place.color} size={36} />
      {links > 0 && <span className="map-pin-badge">{links}</span>}
      {place.label && <span className="map-pin-label">{place.label}</span>}
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
    author,
    readOnly,
    graph,
    updateOps,
    lists,
    focus,
    setFocus,
    open,
    toast,
  } = useApp();
  const catalog = useCatalog();
  const places = journal.ops.places;
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
  const [base, setBase] = useState<BaseId>(() =>
    readStore<BaseId>(
      "orion.map.base",
      "color",
      (v) => typeof v === "string" && v in BASES,
    ),
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
  const [hidden, setHidden] = useState<Set<string>>(
    () =>
      new Set(
        readStore<string[]>("orion.map.hidden", [], (v) =>
          Array.isArray(v),
        ).filter((x) => typeof x === "string"),
      ),
  );
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
  const [tileError, setTileError] = useState(false);
  const [slots, setSlots] = useState<{ id: string; el: HTMLElement }[]>([]);
  const hoverTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const byId = useMemo(() => new Map(places.map((p) => [p.id, p])), [places]);
  const sheetPlace = sheetId ? byId.get(sheetId) : undefined;
  const visible = useMemo(
    () =>
      places.filter((p) => !hidden.has(layerKey(p)) && p.id !== shapeEdit?.id),
    [places, hidden, shapeEdit?.id],
  );
  const canDrag = tool === "select" && !readOnly;

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
  const state = useRef({ tool, draft, measureDone, readOnly, canDrag, byId });
  state.current = { tool, draft, measureDone, readOnly, canDrag, byId };

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
  const viewKey = `orion.map.view.${journal.id}`;
  // Created once per journal (the module remounts on a journal switch).
  useEffect(() => {
    if (!root.current) return;
    const saved = readStore<{ lat: number; lng: number; zoom: number } | null>(
      viewKey,
      null,
      (v) =>
        !!v &&
        typeof v === "object" &&
        Number.isFinite((v as { lat: number }).lat) &&
        Number.isFinite((v as { lng: number }).lng) &&
        Number.isFinite((v as { zoom: number }).zoom),
    );
    const start = saved ?? settingsCenter ?? GENEVA;
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
      writeStore(viewKey, {
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

  /* ---------- Base layer ---------- */
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    const b = BASES[base];
    setTileError(false);
    let loaded = 0;
    let failed = 0;
    const layer = L.tileLayer(b.url, {
      maxZoom: 20,
      maxNativeZoom: b.native,
      crossOrigin: true,
      className: b.className,
      attribution: b.swiss ? SWISSTOPO : OSM,
      ...(b.swiss ? { bounds: SWISS_BOUNDS } : {}),
    });
    layer.on("loading", () => {
      loaded = 0;
      failed = 0;
    });
    layer.on("tileload", () => {
      loaded++;
      setTileError(false);
    });
    layer.on("tileerror", () => {
      failed++;
      if (!navigator.onLine || (failed >= 2 && loaded === 0))
        setTileError(true);
    });
    layer.addTo(m);
    layer.bringToBack();
    writeStore("orion.map.base", base);
    return () => {
      layer.off();
      layer.remove();
    };
  }, [base]);

  /* ---------- Objects ---------- */
  const handlers = useRef({
    mapClick: (_: L.LatLng) => {},
    finish: () => {},
    placeClick: (_id: string, _at: L.LatLng) => {},
    placeOver: (_id: string, _e: MouseEvent) => {},
    placeOut: () => {},
    placeMoved: (_id: string, _at: L.LatLng) => {},
    ghostOver: (_g: Ghost, _e: MouseEvent) => {},
    ghostClick: (_g: Ghost, _e: MouseEvent) => {},
  });

  function makeShape(p: Place) {
    const tone = toneOf(p.layer);
    const options: L.PolylineOptions = {
      className: `map-shape tone-${tone}${p.color ? " custom" : ""}${p.kind === "area" ? " area" : ""}`,
      weight: p.kind === "area" ? 2.5 : 4,
      opacity: 0.95,
      fillOpacity: 0.16,
      lineCap: "round",
      lineJoin: "round",
      dashArray: tone === "danger" ? "10 8" : undefined,
      ...(p.color ? { color: p.color, fillColor: p.color } : {}),
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
    const marker = L.marker(p.points[0], {
      icon: L.divIcon({
        html: el,
        className: text ? "map-icon text" : "map-icon",
        iconSize: text ? [0, 0] : [40, 40],
        iconAnchor: text ? [0, 0] : [20, 20],
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
    marker.on("dragstart", () => handlers.current.placeOut());
    marker.on("dragend", () =>
      handlers.current.placeMoved(p.id, marker.getLatLng()),
    );
    return { marker, el };
  }

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

  // Dragging only with the selection tool.
  useEffect(() => {
    for (const e of registry.current.values()) {
      const dragging = (e.layer as L.Marker).dragging;
      if (!e.el || !dragging) continue;
      if (canDrag) dragging.enable();
      else dragging.disable();
    }
  }, [canDrag, slots]);

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
      if (hidden.has(layerKey(p)))
        setHidden((h) => {
          const next = new Set(h);
          next.delete(layerKey(p));
          writeStore("orion.map.hidden", [...next]);
          return next;
        });
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
    [hidden],
  );

  function create(
    place: Omit<Place, "id" | "createdAt" | "updatedAt" | "by">,
    link?: Ref,
  ) {
    const id = crypto.randomUUID();
    try {
      updateOps((ops) => {
        const next = upsert(ops, "places", { ...place, id }, author);
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
    const { tool: t, draft: raw } = state.current;
    if (!m || !DRAWING.includes(t)) return;
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

  function saveShape() {
    if (!shapeEdit) return;
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
      if (tool === "select") return;
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
      } else if (tool === "measure" && measureDone) {
        setDraft([pt]);
        setMeasureDone(false);
      } else if (draft.length < 500) setDraft((d) => [...d, pt]);
    },
    finish,
    placeClick: (id, at) => {
      if (tool === "select") {
        clearTimeout(hoverTimer.current);
        setHover(null);
        setSheetId(id);
      } else handlers.current.mapClick(at);
    },
    placeOver: (id, e) => {
      if (DRAWING.includes(tool) && draft.length) return;
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
                ? readOnly
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
      const t = e.target as HTMLElement;
      if (t.closest("input, textarea, select, [contenteditable=true]")) return;
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

  /* ---------- Misc ---------- */
  const toggleLayer = (layer: string) =>
    setHidden((h) => {
      const next = new Set(h);
      if (next.has(layer)) next.delete(layer);
      else next.add(layer);
      writeStore("orion.map.hidden", [...next]);
      return next;
    });

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
    const c = settingsCenter ?? GENEVA;
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

  function saveDefaultView() {
    const m = map.current;
    if (!m) return;
    const c = m.getCenter().wrap();
    try {
      updateOps((ops) => ({
        ...ops,
        settings: {
          ...ops.settings,
          mapCenter: {
            lat: round6(c.lat),
            lng: round6(c.lng),
            zoom: Math.min(22, Math.max(1, m.getZoom())),
          },
        },
      }));
      toast("Vue par défaut enregistrée pour ce journal.");
    } catch (err) {
      toast((err as Error).message);
    }
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
              onClick={saveDefaultView}
              title="La carte s’ouvrira ici pour tous les postes"
            >
              <Pin size={14} />
              Vue par défaut
            </button>
          )
        }
      />
      <div
        ref={shell}
        className={`map-shell tool-${tool}${base === "night" ? " night dark-base" : base === "aerial" ? " dark-base" : ""}${panel ? " with-panel" : ""}${hint ? " has-hint" : ""}`}
        style={{ height }}
      >
        <div
          ref={root}
          className="map-canvas"
          role="application"
          aria-label="Carte de situation"
        />

        <div className="map-top-left">
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
                    onShowAll={() => {
                      setHidden(new Set());
                      writeStore("orion.map.hidden", []);
                    }}
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
              Fond indisponible hors ligne. Les objets restent visibles ; les
              zones déjà consultées restent en cache.
            </span>
            <button
              type="button"
              className="icon-button"
              aria-label="Masquer"
              onClick={() => setTileError(false)}
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
              onClick={() => setBase(id)}
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
    </>
  );
}
export default MapModule;
