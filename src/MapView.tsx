import { useEffect, useRef, useState } from "react";
import L from "leaflet";
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
    [coords, setCoords] = useState("46.18500° N · 6.14000° E"),
    [tileError, setTileError] = useState(false);
  const callbacks = useRef({ onAdd, onSelect, tool });
  callbacks.current = { onAdd, onSelect, tool };
  useEffect(() => {
    if (!root.current) return;
    const m = L.map(root.current, {
      center: [46.185, 6.14],
      zoom: 14,
      minZoom: 11,
      maxZoom: 16,
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
    m.on("mousemove", (e) =>
      setCoords(
        `${e.latlng.lat.toFixed(5)}° N · ${e.latlng.lng.toFixed(5)}° E`,
      ),
    );
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
    base.current?.remove();
    setTileError(false);
    const mode = background === "dark" ? "gray" : background;
    base.current = L.tileLayer(`/tiles/${mode}/{z}/{x}/{y}.jpeg`, {
      minZoom: 11,
      maxNativeZoom: 14,
      maxZoom: 16,
      noWrap: true,
      bounds: [
        [46.1, 5.9],
        [46.4, 6.35],
      ],
      attribution:
        '© <a href="https://www.swisstopo.admin.ch/" target="_blank" rel="noreferrer">swisstopo</a> · cache local 18.09.2026',
      className: background === "dark" ? "map-dark" : "",
    }).addTo(map.current);
    base.current.on("tileerror", () => setTileError(true));
    localStorage.setItem("orion.map.background", background);
  }, [background]);
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
      <div className="map-coordinates">
        <span>WGS84</span>
        {coords}
        <span>Genève · cache local</span>
      </div>
    </div>
  );
}
