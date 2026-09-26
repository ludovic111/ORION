// Layers of geo.admin.ch shown over the background: natural hazards,
// cadastre, dams, live hydrology and MeteoSwiss measurements. Free public
// services without key. Ids checked against the layer catalogue
// (api3.geo.admin.ch/rest/services/api/MapServer/layersConfig).
// Pure: tested in node.

import { fromMN95, isMN95, toMN95 } from "../../../shared/coordinates.ts";

type LatLng = [number, number];
export type OverlayKind = "wmts" | "wms" | "geojson";
export type LiveStyle = "hydro" | "warn" | "wind" | "rain";
export type OverlayDef = {
  id: string;
  label: string;
  group: string;
  kind: OverlayKind;
  /** One factual line: what the layer shows. */
  hint: string;
  /** Feature info on click (api3 identify). */
  identify: boolean;
  /** Legend page on geo.admin.ch. */
  legend: boolean;
  /** Live data: style and refresh period. */
  live?: { style: LiveStyle; refresh: number };
  /** Default opacity (0–1). */
  opacity: number;
};

export const OVERLAY_GROUPS = [
  "Dangers naturels",
  "Eaux et météo en direct",
  "Infrastructures et cadastre",
] as const;

const g = OVERLAY_GROUPS;
export const OVERLAYS: OverlayDef[] = [
  {
    id: "ch.bafu.aquaprotect_100",
    label: "Zones inondables (crue centennale)",
    group: g[0],
    kind: "wmts",
    hint: "Aquaprotect, OFEV : vue d’ensemble nationale, ne remplace pas les cartes cantonales des dangers.",
    identify: false,
    legend: true,
    opacity: 0.6,
  },
  {
    id: "ch.bafu.aquaprotect_500",
    label: "Zones inondables (crue extrême, 500 ans)",
    group: g[0],
    kind: "wmts",
    hint: "Aquaprotect, OFEV : scénario rare, emprise maximale.",
    identify: false,
    legend: true,
    opacity: 0.5,
  },
  {
    id: "ch.bafu.gefaehrdungskarte-oberflaechenabfluss",
    label: "Ruissellement de surface",
    group: g[0],
    kind: "wmts",
    hint: "Carte de l’aléa ruissellement, OFEV : hauteurs d’eau en cas de pluie intense.",
    identify: false,
    legend: true,
    opacity: 0.6,
  },
  {
    id: "ch.bafu.silvaprotect-hangmuren",
    label: "Glissements superficiels et coulées de boue",
    group: g[0],
    kind: "wmts",
    hint: "SilvaProtect-CH, OFEV : indications de danger au niveau national.",
    identify: false,
    legend: true,
    opacity: 0.6,
  },
  {
    id: "ch.bafu.silvaprotect-murgang",
    label: "Laves torrentielles",
    group: g[0],
    kind: "wmts",
    hint: "SilvaProtect-CH, OFEV.",
    identify: false,
    legend: true,
    opacity: 0.6,
  },
  {
    id: "ch.bafu.silvaprotect-sturz",
    label: "Chutes de pierres",
    group: g[0],
    kind: "wmts",
    hint: "SilvaProtect-CH, OFEV : zones de transit et de dépôt.",
    identify: false,
    legend: true,
    opacity: 0.6,
  },
  {
    id: "ch.bafu.silvaprotect-lawinen",
    label: "Avalanches",
    group: g[0],
    kind: "wmts",
    hint: "SilvaProtect-CH, OFEV : avalanches partant de la forêt.",
    identify: false,
    legend: true,
    opacity: 0.6,
  },
  {
    id: "ch.swisstopo.hangneigung-ueber_30",
    label: "Pentes de plus de 30°",
    group: g[0],
    kind: "wmts",
    hint: "swisstopo : terrain propice aux avalanches.",
    identify: false,
    legend: true,
    opacity: 0.5,
  },
  {
    id: "ch.bafu.gefahren-waldbrand_warnung",
    label: "Danger d’incendie de forêt",
    group: g[0],
    kind: "wms",
    hint: "Degrés de danger publiés par les cantons et l’OFEV (mis à jour chaque jour).",
    identify: true,
    legend: true,
    opacity: 0.55,
  },
  {
    id: "ch.bafu.hydroweb-messstationen_gefahren",
    label: "Stations hydrologiques : degré de danger",
    group: g[1],
    kind: "geojson",
    hint: "OFEV, toutes les 5 minutes : niveau ou débit comparé aux degrés de danger de crue.",
    identify: false,
    legend: false,
    live: { style: "hydro", refresh: 300000 },
    opacity: 1,
  },
  {
    id: "ch.bafu.hydroweb-warnkarte_national",
    label: "Carte de vigilance crues",
    group: g[1],
    kind: "geojson",
    hint: "OFEV : degré de danger de crue par région, rivière et lac.",
    identify: false,
    legend: false,
    live: { style: "warn", refresh: 1800000 },
    opacity: 0.5,
  },
  {
    id: "ch.meteoschweiz.messwerte-windgeschwindigkeit-kmh-10min",
    label: "Vent mesuré (10 min)",
    group: g[1],
    kind: "geojson",
    hint: "MétéoSuisse, SwissMetNet : vitesse et direction, toutes les 10 minutes.",
    identify: false,
    legend: false,
    live: { style: "wind", refresh: 600000 },
    opacity: 1,
  },
  {
    id: "ch.meteoschweiz.messwerte-niederschlag-1h",
    label: "Précipitations (somme 1 h)",
    group: g[1],
    kind: "geojson",
    hint: "MétéoSuisse : millimètres tombés pendant la dernière heure.",
    identify: false,
    legend: false,
    live: { style: "rain", refresh: 600000 },
    opacity: 1,
  },
  {
    id: "ch.kantone.cadastralwebmap-farbe",
    label: "Cadastre (parcelles)",
    group: g[2],
    kind: "wmts",
    hint: "Mensuration officielle des cantons : biens-fonds et numéros (zoom rapproché).",
    identify: true,
    legend: true,
    opacity: 0.8,
  },
  {
    id: "ch.bfe.stauanlagen-bundesaufsicht",
    label: "Barrages sous surveillance fédérale",
    group: g[2],
    kind: "wmts",
    hint: "OFEN : ouvrages d’accumulation (les zones d’inondation des barrages ne sont pas publiques).",
    identify: true,
    legend: true,
    opacity: 1,
  },
  {
    id: "ch.babs.notfalltreffpunkte",
    label: "Points de rencontre d’urgence",
    group: g[2],
    kind: "wms",
    hint: "OFPP et cantons : où la population se rend en cas d’urgence.",
    identify: true,
    legend: true,
    opacity: 1,
  },
  {
    id: "ch.babs.kulturgueter",
    label: "Biens culturels protégés (PBC)",
    group: g[2],
    kind: "wmts",
    hint: "OFPP : inventaire de la protection des biens culturels.",
    identify: true,
    legend: true,
    opacity: 1,
  },
  {
    id: "ch.ensi.zonenplan-notfallschutz-kernanlagen",
    label: "Zones d’urgence des centrales nucléaires",
    group: g[2],
    kind: "wmts",
    hint: "IFSN : zones 1 et 2 autour des installations nucléaires.",
    identify: true,
    legend: true,
    opacity: 0.5,
  },
  {
    id: "ch.swisstopo.swissboundaries3d-gemeinde-flaeche.fill",
    label: "Limites de communes",
    group: g[2],
    kind: "wmts",
    hint: "swisstopo, swissBOUNDARIES3D.",
    identify: true,
    legend: false,
    opacity: 0.7,
  },
];
export const overlayById = (id: string) => OVERLAYS.find((o) => o.id === id);

/** Tile URL template (Leaflet) of a WMTS overlay. */
export const wmtsUrl = (id: string) =>
  `https://wmts.geo.admin.ch/1.0.0/${id}/default/current/3857/{z}/{x}/{y}.png`;
export const WMS_URL = "https://wms.geo.admin.ch/";
export const legendUrl = (id: string) =>
  `https://api3.geo.admin.ch/rest/services/api/MapServer/${id}/legend?lang=fr`;
export const liveUrl = (id: string) =>
  `https://data.geo.admin.ch/${id}/${id}_fr.json`;

/* ---------- Feature info (identify) ---------- */

/**
 * Identify request for a click at `at`, the map showing `bounds` on a
 * `size` pixels screen (the tolerance is in screen pixels).
 */
export function identifyUrl(
  ids: string[],
  at: LatLng,
  bounds: [LatLng, LatLng],
  size: [number, number],
): string | null {
  try {
    const p = toMN95(at[0], at[1]);
    const sw = toMN95(bounds[0][0], bounds[0][1]);
    const ne = toMN95(bounds[1][0], bounds[1][1]);
    const q = new URLSearchParams({
      geometry: `${p.east.toFixed(1)},${p.north.toFixed(1)}`,
      geometryType: "esriGeometryPoint",
      imageDisplay: `${Math.round(size[0])},${Math.round(size[1])},96`,
      mapExtent: [sw.east, sw.north, ne.east, ne.north]
        .map((v) => v.toFixed(1))
        .join(","),
      tolerance: "8",
      layers: `all:${ids.join(",")}`,
      sr: "2056",
      lang: "fr",
      returnGeometry: "false",
      limit: "10",
    });
    return `https://api3.geo.admin.ch/rest/services/api/MapServer/identify?${q}`;
  } catch {
    return null;
  }
}

export type Identified = {
  layer: string;
  title: string;
  rows: [string, string][];
};

const LABELS: Record<string, string> = {
  number: "Numéro",
  egris_egrid: "EGRID",
  identnd: "Identifiant",
  ak: "Canton",
  realestate_type: "Type",
  gemname: "Commune",
  name: "Nom",
  label: "Nom",
  damname: "Barrage",
  facility_name: "Installation",
  bfs_num: "N° OFS",
  kanton: "Canton",
};

/** Attributes of an identify answer, as text rows (never HTML). */
export function readIdentify(data: unknown): Identified[] {
  const results = (data as { results?: unknown[] })?.results;
  if (!Array.isArray(results)) return [];
  const out: Identified[] = [];
  for (const r of results.slice(0, 10)) {
    const item = r as {
      layerBodId?: unknown;
      layerName?: unknown;
      attributes?: Record<string, unknown>;
    };
    const rows: [string, string][] = [];
    for (const [k, v] of Object.entries(item.attributes ?? {})) {
      if (v === null || v === "" || typeof v === "object") continue;
      if (/url|geom|_de$|_it$|_en$|^id$/i.test(k)) continue;
      const text = String(v)
        .replace(/<(?:br|p|td|tr|li|div)\b[^>]*>/gi, " ")
        .replace(/<[^>]*>/g, "")
        .replace(/\s+/g, " ")
        .trim();
      // The same value under two names (canton code as "label"): once.
      if (text && !rows.some((r) => r[1] === text.slice(0, 200)))
        rows.push([LABELS[k] ?? k.replace(/_/g, " "), text.slice(0, 200)]);
      if (rows.length >= 12) break;
    }
    const def = overlayById(String(item.layerBodId ?? ""));
    out.push({
      layer: String(item.layerBodId ?? ""),
      title: def?.label ?? String(item.layerName ?? "Objet"),
      rows,
    });
  }
  return out;
}

/* ---------- Live data (data.geo.admin.ch) ---------- */

export type LiveFeature = {
  id: string;
  /** Point, or rings / paths of an area or a river. */
  point?: LatLng;
  rings?: LatLng[][];
  paths?: LatLng[][];
  title: string;
  /** Hazard level 1–5 (0: no data), or a measured value. */
  level?: number;
  value?: number;
  unit?: string;
  direction?: number;
  time?: string;
};

export const LEVEL_TEXT = [
  "Pas de données",
  "Degré 1 : pas de danger ou danger faible",
  "Degré 2 : danger limité",
  "Degré 3 : danger marqué",
  "Degré 4 : danger fort",
  "Degré 5 : danger très fort",
];
/** Colours of the official danger levels (map content). */
export const LEVEL_COLOR = [
  "#9aa0a6",
  "#6cbf4a",
  "#f2cf00",
  "#ff8c00",
  "#e3001b",
  "#8b0000",
];

const plainText = (html: unknown) =>
  String(html ?? "")
    .replace(/<(?:br|p|td|tr|li|div)\b[^>]*>/gi, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

function toLatLng(c: unknown): LatLng | null {
  if (!Array.isArray(c) || c.length < 2) return null;
  const x = Number(c[0]);
  const y = Number(c[1]);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  if (isMN95(x, y)) {
    try {
      const { lat, lng } = fromMN95(x, y);
      return [lat, lng];
    } catch {
      return null;
    }
  }
  return Math.abs(y) <= 90 && Math.abs(x) <= 180 ? [y, x] : null;
}
const ring = (c: unknown): LatLng[] =>
  Array.isArray(c) ? (c.map(toLatLng).filter(Boolean) as LatLng[]) : [];

/** Features of a live layer, coordinates in WGS84, text only. */
export function readLive(style: LiveStyle, data: unknown): LiveFeature[] {
  const features = (data as { features?: unknown[] })?.features;
  if (!Array.isArray(features)) return [];
  const out: LiveFeature[] = [];
  for (const f of features) {
    const feat = f as {
      id?: unknown;
      geometry?: { type?: string; coordinates?: unknown };
      properties?: Record<string, unknown>;
    };
    const p = feat.properties ?? {};
    const geo = feat.geometry;
    if (!geo) continue;
    const base = { id: String(feat.id ?? out.length) };
    if (style === "warn") {
      const level = Number(String(p["ws-class"] ?? "").split(".")[1]);
      const title = plainText(p.description) || plainText(p.text);
      const c = geo.coordinates as unknown[];
      if (geo.type === "MultiPolygon" && Array.isArray(c))
        out.push({
          ...base,
          title,
          level: Number.isFinite(level) ? level : 0,
          rings: c.flatMap((poly) =>
            Array.isArray(poly) ? poly.map(ring) : [],
          ),
        });
      else if (geo.type === "Polygon" && Array.isArray(c))
        out.push({ ...base, title, level, rings: c.map(ring) });
      else if (geo.type === "MultiLineString" && Array.isArray(c))
        out.push({
          ...base,
          title,
          level: Number.isFinite(level) ? level : 0,
          paths: c.map(ring),
        });
      else if (geo.type === "LineString")
        out.push({ ...base, title, level, paths: [ring(c)] });
      continue;
    }
    if (geo.type !== "Point") continue;
    const point = toLatLng(geo.coordinates);
    if (!point) continue;
    if (style === "hydro")
      out.push({
        ...base,
        point,
        title: plainText(p.name) || "Station",
        level: Number(p["quant-class"]) || 0,
      });
    else {
      const value = Number(p.value);
      out.push({
        ...base,
        point,
        title: plainText(p.station_name) || "Station",
        value: Number.isFinite(value) ? value : undefined,
        unit: plainText(p.unit),
        direction:
          style === "wind" && Number.isFinite(Number(p.wind_direction))
            ? Number(p.wind_direction)
            : undefined,
        time: plainText(p.reference_ts) || undefined,
      });
    }
  }
  return out;
}
