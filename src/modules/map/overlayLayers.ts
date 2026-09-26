import L from "leaflet";
import { SWISS_BOUNDS } from "./bases";
import {
  LEVEL_COLOR,
  LEVEL_TEXT,
  OVERLAYS,
  WMS_URL,
  liveUrl,
  overlayById,
  readLive,
  wmtsUrl,
  type LiveFeature,
  type OverlayDef,
} from "./overlays";
import { compass } from "./geo";
import {
  formatDayMonth,
  formatNumber,
  formatTime,
  getLang,
} from "../../../shared/i18n/core.ts";
import { t } from "./i18n-2.ts";

// Leaflet side of the geo.admin.ch overlays: tile layers (WMTS, WMS) and
// live data drawn on a canvas in their own pane. The module keeps the list
// of active overlays; this class makes the map match it.

/** Overlay id → opacity (0–1). */
export type ActiveOverlays = Record<string, number>;
export type LiveStatus = { at?: string; error?: string; count?: number };
export type InfoRow = [string, string];
export type Picked = { title: string; source: string; rows: InfoRow[] };

const attribution = () =>
  `© <a href="https://www.geo.admin.ch/${getLang()}/" target="_blank" rel="noopener noreferrer">geo.admin.ch</a>`;
export const LIVE_PANE = "orion-live";

type Entry = {
  def: OverlayDef;
  layer: L.Layer;
  timer?: ReturnType<typeof setInterval>;
  abort?: AbortController;
  opacity: number;
};

const time = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : `${formatDayMonth(d)} ${formatTime(d)}`;
};

/** Text rows of a live feature for the info card. */
export function liveRows(def: OverlayDef, f: LiveFeature): InfoRow[] {
  const rows: InfoRow[] = [];
  if (
    f.level !== undefined &&
    (def.live?.style === "hydro" || def.live?.style === "warn")
  )
    rows.push([t("Danger"), LEVEL_TEXT[f.level] ?? String(f.level)]);
  if (f.value !== undefined)
    rows.push([
      def.live?.style === "wind" ? t("Vent moyen") : t("Mesure"),
      `${formatNumber(f.value)} ${f.unit ?? ""}`.trim(),
    ]);
  if (f.direction !== undefined)
    rows.push([
      t("Vient du"),
      `${compass(f.direction)} (${Math.round(f.direction)}°)`,
    ]);
  if (f.time) rows.push([t("Mesuré"), time(f.time)]);
  return rows;
}

export class OverlayManager {
  private entries = new Map<string, Entry>();
  private renderer: L.Canvas;
  constructor(
    private map: L.Map,
    private onStatus: (id: string, status: LiveStatus) => void,
    private onPick: (picked: Picked, at: L.LatLng) => void,
  ) {
    if (!map.getPane(LIVE_PANE)) {
      const pane = map.createPane(LIVE_PANE);
      pane.style.zIndex = "380";
      pane.classList.add("map-live-pane");
    }
    this.renderer = L.canvas({ pane: LIVE_PANE, padding: 0.3 });
  }

  /** Make the map show exactly the active overlays, in catalogue order. */
  sync(active: ActiveOverlays) {
    for (const [id, e] of this.entries)
      if (!(id in active)) {
        this.drop(e);
        this.entries.delete(id);
      }
    OVERLAYS.forEach((def, index) => {
      if (!(def.id in active)) return;
      const opacity = Math.max(0.1, Math.min(1, active[def.id]));
      const known = this.entries.get(def.id);
      if (known) {
        if (known.opacity !== opacity) {
          known.opacity = opacity;
          if (known.layer instanceof L.TileLayer)
            known.layer.setOpacity(opacity);
          else this.restyle(known);
        }
        return;
      }
      const entry = this.create(def, opacity, index);
      if (entry) this.entries.set(def.id, entry);
    });
  }

  destroy() {
    for (const e of this.entries.values()) this.drop(e);
    this.entries.clear();
  }

  /** Tile overlays answering feature info requests. */
  identifiable() {
    return [...this.entries.values()]
      .filter((e) => e.def.identify && e.layer instanceof L.TileLayer)
      .map((e) => e.def.id);
  }

  /** Tile templates of the active overlays (print, offline sectors). */
  tileTemplates() {
    return [...this.entries.values()]
      .filter((e) => e.def.kind === "wmts")
      .map((e) => ({
        id: e.def.id,
        url: wmtsUrl(e.def.id),
        opacity: e.opacity,
      }));
  }

  private drop(e: Entry) {
    clearInterval(e.timer);
    e.abort?.abort();
    e.layer.remove();
  }

  private create(
    def: OverlayDef,
    opacity: number,
    index: number,
  ): Entry | null {
    const common = {
      opacity,
      crossOrigin: true as const,
      maxZoom: 20,
      zIndex: 10 + index,
      attribution: attribution(),
      bounds: L.latLngBounds(SWISS_BOUNDS),
      className: "map-overlay",
    };
    if (def.kind === "wmts") {
      const layer = L.tileLayer(wmtsUrl(def.id), {
        ...common,
        maxNativeZoom: 18,
      });
      layer.addTo(this.map);
      return { def, layer, opacity };
    }
    if (def.kind === "wms") {
      const layer = L.tileLayer.wms(WMS_URL, {
        ...common,
        layers: def.id,
        format: "image/png",
        transparent: true,
        version: "1.3.0",
      });
      layer.addTo(this.map);
      return { def, layer, opacity };
    }
    const group = L.layerGroup().addTo(this.map);
    const entry: Entry = { def, layer: group, opacity };
    const load = () => void this.load(entry);
    load();
    entry.timer = setInterval(load, def.live?.refresh ?? 600000);
    return entry;
  }

  private async load(entry: Entry) {
    const { def } = entry;
    entry.abort?.abort();
    const abort = new AbortController();
    entry.abort = abort;
    try {
      const response = await fetch(liveUrl(def.id), { signal: abort.signal });
      if (!response.ok) throw new Error(String(response.status));
      const data = await response.json();
      if (abort.signal.aborted || !this.entries.has(def.id)) return;
      const features = readLive(def.live!.style, data);
      this.draw(entry, features);
      const created = String(
        (data as { creation_time?: unknown }).creation_time ?? "",
      );
      this.onStatus(def.id, { at: created, count: features.length });
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      this.onStatus(def.id, {
        error: navigator.onLine
          ? t("Données en direct indisponibles pour le moment.")
          : t("Hors ligne : données en direct indisponibles."),
      });
    }
  }

  private restyle(entry: Entry) {
    const group = entry.layer as L.LayerGroup;
    group.eachLayer((l) => {
      if (l instanceof L.Path)
        l.setStyle({
          fillOpacity:
            entry.def.live?.style === "warn"
              ? entry.opacity * 0.55
              : 0.95 * entry.opacity,
          opacity: entry.opacity,
        });
      else if (l instanceof L.Marker) l.setOpacity(entry.opacity);
    });
  }

  private draw(entry: Entry, features: LiveFeature[]) {
    const group = entry.layer as L.LayerGroup;
    group.clearLayers();
    const { def, opacity } = entry;
    const style = def.live!.style;
    const pick = (f: LiveFeature) => (e: L.LeafletMouseEvent) => {
      L.DomEvent.stopPropagation(e);
      this.onPick(
        { title: f.title, source: def.label, rows: liveRows(def, f) },
        e.latlng,
      );
    };
    for (const f of features) {
      let layer: L.Layer | null = null;
      if (style === "warn") {
        const color = LEVEL_COLOR[f.level ?? 0] ?? LEVEL_COLOR[0];
        // Level 1 (no danger) is drawn discreetly: the eye goes to the rest.
        const faint = (f.level ?? 0) <= 1;
        if (f.rings?.length)
          layer = L.polygon(f.rings, {
            renderer: this.renderer,
            pane: LIVE_PANE,
            color,
            weight: faint ? 0.5 : 1.5,
            fillColor: color,
            fillOpacity: (faint ? 0.12 : 0.55) * opacity,
            opacity,
          });
        else if (f.paths?.length)
          layer = L.polyline(f.paths, {
            renderer: this.renderer,
            pane: LIVE_PANE,
            color,
            weight: faint ? 2 : 5,
            opacity,
          });
      } else if (f.point && style === "wind" && f.direction !== undefined) {
        // Arrow blowing downwind, speed written beside it.
        const el = document.createElement("div");
        el.className = "map-wind";
        el.style.setProperty("--dir", `${(f.direction + 180) % 360}deg`);
        const arrow = document.createElement("i");
        const label = document.createElement("span");
        label.textContent =
          f.value !== undefined ? String(Math.round(f.value)) : "";
        el.append(arrow, label);
        layer = L.marker(f.point, {
          pane: LIVE_PANE,
          opacity,
          keyboard: false,
          icon: L.divIcon({
            html: el,
            className: "map-icon",
            iconSize: [0, 0],
          }),
        });
      } else if (f.point) {
        const color =
          style === "hydro"
            ? (LEVEL_COLOR[f.level ?? 0] ?? LEVEL_COLOR[0])
            : "#1f6fe0";
        const radius =
          style === "rain"
            ? 3 + Math.min(12, Math.sqrt(Math.max(0, f.value ?? 0)) * 3)
            : (f.level ?? 0) >= 2
              ? 8
              : 5.5;
        if (style === "rain" && !(f.value && f.value > 0)) continue;
        layer = L.circleMarker(f.point, {
          renderer: this.renderer,
          pane: LIVE_PANE,
          radius,
          color: "#111427",
          weight: 1,
          fillColor: color,
          fillOpacity: 0.95 * opacity,
          opacity,
        });
      }
      if (!layer) continue;
      layer.on("click", pick(f));
      if (layer instanceof L.Path || layer instanceof L.Marker)
        layer.bindTooltip(f.title.slice(0, 120), {
          sticky: true,
          className: "map-live-tip",
        });
      group.addLayer(layer);
    }
  }
}

export const overlayLabel = (id: string) => overlayById(id)?.label ?? id;
