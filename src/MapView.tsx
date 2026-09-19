import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { formatMN95 } from "../shared/coordinates";
import { api } from "./api";
import {
  MousePointer2,
  Ruler,
  Pentagon,
  MapPin,
  LocateFixed,
  Check,
  X,
} from "lucide-react";
import type { Data, RecordItem } from "./types";
import "leaflet/dist/leaflet.css";
const backgrounds = {
  dark: "Sombre",
  color: "Carte couleur",
  gray: "Noir et blanc",
  aerial: "Vue aérienne",
};
type Background = keyof typeof backgrounds;
type Tool = "select" | "measure" | "draw" | "point";
export function MapView({
  records,
  onSelect,
  onAdd,
  selected,
  compact = false,
  categories = ["Effets", "Moyens", "Mesures", "Dangers"],
  canWrite = false,
}: {
  records: RecordItem[];
  onSelect: (r: RecordItem) => void;
  onAdd?: (data: Data) => void;
  selected?: RecordItem | null;
  compact?: boolean;
  categories?: string[];
  canWrite?: boolean;
}) {
  const root = useRef<HTMLDivElement>(null),
    map = useRef<L.Map | null>(null),
    base = useRef<L.TileLayer | null>(null),
    objects = useRef<L.LayerGroup | null>(null),
    sketch = useRef<L.LayerGroup | null>(null);
  const [background, setBackground] = useState<Background>(() =>
    (localStorage.getItem("orion.map.background") as Background) in backgrounds
      ? (localStorage.getItem("orion.map.background") as Background)
      : "dark",
  );
  const [tool, setTool] = useState<Tool>("select"),
    [points, setPoints] = useState<[number, number][]>([]),
    [coords, setCoords] = useState(formatMN95(46.185, 6.14)),
    [tileError, setTileError] = useState(false),
    [onlineAvailable, setOnlineAvailable] = useState(false),
    [online, setOnline] = useState(false),
    [fallback, setFallback] = useState(false);
  useEffect(() => {
    let active = true;
    api<{ mapOnline: boolean }>("/config")
      .then((config) => {
        if (active) {
          setOnlineAvailable(config.mapOnline);
          setOnline(config.mapOnline);
        }
      })
      .catch(() => {}); // Keep the bundled map usable if configuration cannot be reached.
    return () => {
      active = false;
    };
  }, []);
  const callbacks = useRef({ onAdd, onSelect, tool });
  callbacks.current = { onAdd, onSelect, tool };
  useEffect(() => {
    if (!root.current) return;
    const m = L.map(root.current, {
      center: [46.185, 6.14],
      zoom: 14,
      minZoom: 11,
      maxZoom: 14,
      zoomControl: false,
      attributionControl: true,
      maxBounds: [
        [46.095, 5.895],
        [46.405, 6.355],
      ],
      maxBoundsViscosity: 1,
    });
    map.current = m;
    L.control.zoom({ position: "topright" }).addTo(m);
    L.control.scale({ imperial: false, position: "bottomleft" }).addTo(m);
    objects.current = L.layerGroup().addTo(m);
    sketch.current = L.layerGroup().addTo(m);
    m.on("mousemove", (e) => setCoords(formatMN95(e.latlng.lat, e.latlng.lng)));
    m.on("click", (e) => {
      const current = callbacks.current;
      if (current.tool === "point")
        current.onAdd?.({
          lat: Number(e.latlng.lat.toFixed(6)),
          lng: Number(e.latlng.lng.toFixed(6)),
        });
      else if (current.tool === "measure" || current.tool === "draw")
        setPoints((p) =>
          p.length < 100 ? [...p, [e.latlng.lat, e.latlng.lng]] : p,
        );
    });
    const observer = new ResizeObserver(() => m.invalidateSize());
    observer.observe(root.current);
    return () => {
      observer.disconnect();
      m.remove();
      map.current = null;
    };
  }, []);
  useEffect(() => {
    if (!map.current) return;
    base.current?.off();
    base.current?.remove();
    setTileError(false);
    const mode = background === "dark" ? "gray" : background;
    const maxZoom = online ? (mode === "aerial" ? 19 : 18) : 14;
    const retina = online && L.Browser.retina;
    map.current.setMaxZoom(maxZoom);
    const layer = L.tileLayer(
      `/${online ? "basemap" : "tiles"}/${mode}/{z}/{x}/{y}.jpeg`,
      {
        minZoom: 11,
        maxNativeZoom: maxZoom,
        maxZoom,
        tileSize: retina ? 128 : 256,
        zoomOffset: retina ? 1 : 0,
        noWrap: true,
        bounds: [
          [46.1, 5.9],
          [46.4, 6.35],
        ],
        attribution:
          '© <a href="https://www.swisstopo.admin.ch/" target="_blank" rel="noreferrer">swisstopo</a>' +
          (online ? " · haute définition" : " · cache local 18.09.2026"),
        className: background === "dark" ? "map-dark" : "",
      },
    ).addTo(map.current);
    base.current = layer;
    layer.on("tileerror", () => {
      if (base.current !== layer) return;
      if (online) {
        setFallback(true);
        setOnline(false);
      } else setTileError(true);
    });
    localStorage.setItem("orion.map.background", background);
    return () => {
      layer.off();
      layer.remove();
    };
  }, [background, online]);
  useEffect(() => {
    const group = objects.current;
    if (!group) return;
    group.clearLayers();
    for (const r of records.filter(
      (r) => r.kind === "map" && categories.includes(r.data.category ?? ""),
    )) {
      const d = r.data;
      if (d.lat === undefined || d.lng === undefined) continue;
      if (d.geometry) {
        L.polygon(d.geometry, {
          color: d.category === "Dangers" ? "#FFC94A" : "#FF4A55",
          weight: 2,
          fillOpacity: 0.17,
          dashArray: "6 4",
        })
          .on("click", (e) => {
            L.DomEvent.stopPropagation(e);
            callbacks.current.onSelect(r);
          })
          .addTo(group);
      }
      const el = document.createElement("div");
      el.className = `map-marker ${selected?.id === r.id ? "selected" : ""}`;
      const img = document.createElement("img");
      img.src = `/symbols/display/${d.symbol}.svg`;
      img.alt = "";
      el.append(img);
      const label = document.createElement("span");
      label.textContent = d.name ?? "";
      el.append(label);
      const marker = L.marker([d.lat, d.lng], {
        icon: L.divIcon({
          html: el,
          className: "marker-wrapper",
          iconSize: [36, 36],
          iconAnchor: [18, 18],
        }),
        title: d.name,
        keyboard: true,
      });
      marker
        .on("click", (e) => {
          L.DomEvent.stopPropagation(e);
          callbacks.current.onSelect(r);
        })
        .addTo(group);
    }
  }, [records, categories.join("|"), selected?.id]);
  useEffect(() => {
    sketch.current?.clearLayers();
    if (points.length) {
      L.polyline(points, {
        color: "#5AA9FF",
        weight: 3,
        dashArray: tool === "draw" ? "5 5" : undefined,
      }).addTo(sketch.current!);
      for (const p of points)
        L.circleMarker(p, {
          radius: 4,
          color: "#5AA9FF",
          fillOpacity: 1,
        }).addTo(sketch.current!);
    }
  }, [points, tool]);
  const distance = points
    .slice(1)
    .reduce(
      (sum, p, i) => sum + L.latLng(points[i]).distanceTo(L.latLng(p)),
      0,
    );
  function selectTool(value: Tool) {
    setPoints([]);
    setTool(value);
  }
  return (
    <div className={`map-wrap ${compact ? "compact" : ""} tool-${tool}`}>
      <div
        className="leaflet-root"
        ref={root}
        aria-label="Carte de conduite swisstopo"
      />
      <div className="map-toolbar">
        <label className="map-base">
          <span>Fond swisstopo</span>
          <select
            aria-label="Fond de carte"
            value={background}
            onChange={(e) => setBackground(e.target.value as Background)}
          >
            {Object.entries(backgrounds).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </label>
        {onlineAvailable && (
          <button
            className={online ? "active" : ""}
            aria-pressed={online}
            title={
              online
                ? "Haute définition swisstopo. Passer au cache local."
                : "Activer les détails haute définition swisstopo."
            }
            onClick={() => {
              setFallback(false);
              setOnline((value) => !value);
            }}
          >
            {online ? "HD" : "Activer HD"}
          </button>
        )}
        {!compact && (
          <>
            <button
              aria-label="Sélection"
              title="Sélection"
              className={tool === "select" ? "active" : ""}
              onClick={() => selectTool("select")}
            >
              <MousePointer2 size={17} />
            </button>
            <button
              aria-label="Mesurer une distance"
              title="Mesurer"
              className={tool === "measure" ? "active" : ""}
              onClick={() => selectTool("measure")}
            >
              <Ruler size={17} />
            </button>
            {canWrite && (
              <>
                <button
                  aria-label="Dessiner une zone"
                  title="Dessiner une zone"
                  className={tool === "draw" ? "active" : ""}
                  onClick={() => selectTool("draw")}
                >
                  <Pentagon size={17} />
                </button>
                <button
                  aria-label="Placer un signe"
                  title="Placer un signe"
                  className={tool === "point" ? "active" : ""}
                  onClick={() => selectTool("point")}
                >
                  <MapPin size={17} />
                </button>
              </>
            )}
          </>
        )}
        <button
          aria-label="Centrer sur Carouge"
          title="Centrer sur Carouge"
          onClick={() => map.current?.setView([46.185, 6.14], 14)}
        >
          <LocateFixed size={17} />
        </button>
      </div>
      {tool !== "select" && (
        <div className="map-hint">
          {tool === "point"
            ? "Cliquez sur la carte pour placer un signe."
            : tool === "draw"
              ? `${points.length} sommets · cliquez pour dessiner une zone`
              : `${points.length} points · ${(distance / 1000).toFixed(2)} km`}
          {tool === "draw" && points.length >= 3 && (
            <button
              onClick={() => {
                onAdd?.({
                  lat: points[0][0],
                  lng: points[0][1],
                  geometry: points,
                });
                selectTool("select");
              }}
            >
              <Check size={14} />
              Terminer
            </button>
          )}
          <button
            aria-label="Annuler l’outil"
            onClick={() => selectTool("select")}
          >
            <X size={14} />
          </button>
        </div>
      )}
      {tileError && (
        <div className="map-warning" role="status">
          Fond indisponible sur une partie de cette zone. Les objets restent
          consultables.
        </div>
      )}
      {fallback && !tileError && (
        <div className="map-warning" role="status">
          Fond HD indisponible : cache local affiché, zoom limité. Utilisez «
          Activer HD » pour réessayer.
        </div>
      )}
      <div className="map-coordinates">
        <span>MN95 ≈</span>
        {coords}
        <span>{online ? "Genève · HD" : "Genève · cache local"}</span>
      </div>
    </div>
  );
}
