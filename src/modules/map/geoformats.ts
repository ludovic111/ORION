import type { Journal } from "../../../shared/journal.ts";
import type { OpsMap, Place } from "../../../shared/ops.ts";
import {
  fromMN03,
  fromMN95,
  isMN03,
  isMN95,
  toMN95,
} from "../../../shared/coordinates.ts";
import { builtinInfo, symbolName } from "./builtins.ts";
import { TONE_COLOR, hexColor, placesOf, simplifyTo, toneOf } from "./maps.ts";
import { t, tn } from "./i18n-2.ts";

// Geographic files: export of the map objects (GeoJSON, KML, GPX) and
// import of files received from partners. Owned by the map module. Pure:
// no DOM (a small XML reader is included), so it runs in node for tests.

type LatLng = [number, number];
const MAX_POINTS = 2000;

/* ---------- Export ---------- */

const escapeXml = (s: string) =>
  s.replace(
    /[<>&"']|[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,
    (c) =>
      ({
        "<": "&lt;",
        ">": "&gt;",
        "&": "&amp;",
        '"': "&quot;",
        "'": "&apos;",
      })[c] ?? "",
  );
const coord = (n: number) => String(Math.round(n * 1e7) / 1e7);

/** Colour actually drawn: its own, the symbol's, or the layer's. */
export function effectiveColor(p: Place): string {
  return (
    hexColor(p.color) ||
    (p.kind === "point" ? (builtinInfo(p.symbol)?.color ?? "") : "") ||
    TONE_COLOR[toneOf(p.layer)]
  );
}

function context(journal: Journal, mapId: string) {
  const maps: OpsMap[] = journal.ops.maps ?? [];
  const map = maps.find((m) => m.id === mapId);
  const places = placesOf(journal.ops.places, maps, map ? mapId : "");
  const names = new Map(maps.map((m) => [m.id, m.name]));
  const title = map ? `${journal.title} · ${map.name}` : journal.title;
  return { places, names, title, map };
}

function properties(journal: Journal, p: Place, names: Map<string, string>) {
  return {
    name: p.label,
    notes: p.notes,
    kind: p.kind,
    layer: p.layer,
    symbol: p.symbol,
    symbolName: symbolName(p.symbol, journal.ops.symbols ?? []),
    color: p.color,
    size: p.size,
    rotation: p.rotation,
    frame: p.frame,
    boxed: p.boxed,
    weight: p.weight,
    dash: p.dash,
    maps: p.maps.map((id) => names.get(id) ?? id),
    by: p.by,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

const closed = (points: LatLng[]) => [...points, points[0]];
const ringsOf = (p: Place) => [p.points, ...(p.holes ?? [])];

export type GeoJSONOptions = {
  /** Coordinates in MN95 (EPSG:2056, metres) instead of WGS84. */
  crs?: "EPSG:4326" | "EPSG:2056";
};

/** GeoJSON FeatureCollection of the objects of a map ("" : every object). */
export function toGeoJSON(
  journal: Journal,
  mapId = "",
  options: GeoJSONOptions = {},
): string {
  const { places, names, title } = context(journal, mapId);
  const swiss = options.crs === "EPSG:2056";
  const xy = ([lat, lng]: LatLng) => {
    if (swiss) {
      const { east, north } = toMN95(lat, lng);
      return [Math.round(east * 100) / 100, Math.round(north * 100) / 100];
    }
    return [Math.round(lng * 1e7) / 1e7, Math.round(lat * 1e7) / 1e7];
  };
  const features = places.flatMap((p) => {
    const color = effectiveColor(p);
    let geometry: { type: string; coordinates: unknown };
    try {
      geometry =
        p.kind === "line"
          ? { type: "LineString", coordinates: p.points.map(xy) }
          : p.kind === "area"
            ? {
                type: "Polygon",
                coordinates: ringsOf(p).map((r) => closed(r).map(xy)),
              }
            : { type: "Point", coordinates: xy(p.points[0]) };
    } catch {
      // Outside the Swiss grid: not expressible in MN95.
      return [];
    }
    return {
      type: "Feature",
      id: p.id,
      geometry,
      properties: {
        ...properties(journal, p, names),
        // simplestyle, understood by most viewers.
        ...(p.kind === "line" || p.kind === "area"
          ? {
              stroke: color,
              "stroke-width": p.weight,
              ...(p.kind === "area"
                ? { fill: color, "fill-opacity": 0.16 }
                : {}),
            }
          : { "marker-color": color }),
      },
    };
  });
  return JSON.stringify(
    {
      type: "FeatureCollection",
      name: title,
      ...(swiss && {
        crs: {
          type: "name",
          properties: { name: "urn:ogc:def:crs:EPSG::2056" },
        },
      }),
      features,
    },
    null,
    1,
  );
}

/** KML colour: aabbggrr. */
const kmlColor = (hex: string, alpha = "ff") =>
  `${alpha}${hex.slice(5, 7)}${hex.slice(3, 5)}${hex.slice(1, 3)}`;

/** KML document (Google Earth) of the objects of a map. */
export function toKML(journal: Journal, mapId = ""): string {
  const { places, names, title } = context(journal, mapId);
  const byLayer = new Map<string, Place[]>();
  for (const p of places)
    byLayer.set(p.layer.trim(), [...(byLayer.get(p.layer.trim()) ?? []), p]);
  const lngLat = ([lat, lng]: LatLng) => `${coord(lng)},${coord(lat)}`;
  const placemark = (p: Place) => {
    const color = effectiveColor(p);
    const props = properties(journal, p, names);
    const data = Object.entries(props)
      .filter(([k]) => k !== "name" && k !== "notes")
      .map(
        ([k, v]) =>
          `<Data name="${k}"><value>${escapeXml(Array.isArray(v) ? v.join(", ") : String(v))}</value></Data>`,
      )
      .join("");
    const style =
      p.kind === "line" || p.kind === "area"
        ? `<LineStyle><color>${kmlColor(color)}</color><width>${p.weight}</width></LineStyle>` +
          (p.kind === "area"
            ? `<PolyStyle><color>${kmlColor(color, "40")}</color></PolyStyle>`
            : "")
        : `<IconStyle><color>${kmlColor(color)}</color><scale>${p.size}</scale><heading>${p.rotation}</heading></IconStyle><LabelStyle><color>${kmlColor(color)}</color></LabelStyle>`;
    const geometry =
      p.kind === "line"
        ? `<LineString><tessellate>1</tessellate><coordinates>${p.points.map(lngLat).join(" ")}</coordinates></LineString>`
        : p.kind === "area"
          ? `<Polygon><tessellate>1</tessellate><outerBoundaryIs><LinearRing><coordinates>${closed(p.points).map(lngLat).join(" ")}</coordinates></LinearRing></outerBoundaryIs>${(
              p.holes ?? []
            )
              .map(
                (h) =>
                  `<innerBoundaryIs><LinearRing><coordinates>${closed(h).map(lngLat).join(" ")}</coordinates></LinearRing></innerBoundaryIs>`,
              )
              .join("")}</Polygon>`
          : `<Point><coordinates>${lngLat(p.points[0])}</coordinates></Point>`;
    return (
      `<Placemark id="p-${p.id}"><name>${escapeXml(p.label)}</name>` +
      (p.notes ? `<description>${escapeXml(p.notes)}</description>` : "") +
      `<TimeStamp><when>${p.updatedAt}</when></TimeStamp>` +
      `<Style>${style}</Style><ExtendedData>${data}</ExtendedData>${geometry}</Placemark>`
    );
  };
  const folders = [...byLayer.entries()]
    .sort((a, b) => a[0].localeCompare(b[0], "fr"))
    .map(
      ([layer, list]) =>
        `<Folder><name>${escapeXml(layer || t("Sans calque"))}</name>${list.map(placemark).join("\n")}</Folder>`,
    )
    .join("\n");
  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<kml xmlns="http://www.opengis.net/kml/2.2"><Document>' +
    `<name>${escapeXml(title)}</name>` +
    `<description>${escapeXml(`orion aic · ${tn(places.length, "{n} objet", "{n} objets")}`)}</description>\n` +
    folders +
    "\n</Document></kml>\n"
  );
}

const GPX_NS = "https://orionaic.xyz/xmlns/gpx/1";

/** GPX file (GPS devices) of the objects of a map. */
export function toGPX(journal: Journal, mapId = ""): string {
  const { places, names, title } = context(journal, mapId);
  const at = ([lat, lng]: LatLng) => `lat="${coord(lat)}" lon="${coord(lng)}"`;
  const describe = (p: Place) => {
    const props = properties(journal, p, names);
    const lines = [
      p.notes,
      t("Calque : {layer}", { layer: p.layer || t("sans calque") }),
      props.symbolName && t("Signe : {name}", { name: props.symbolName }),
      t("Posé par {by} le {created}, modifié le {updated}", {
        by: p.by || "?",
        created: p.createdAt,
        updated: p.updatedAt,
      }),
    ].filter(Boolean);
    return escapeXml(lines.join("\n"));
  };
  const extensions = (p: Place) =>
    `<extensions>${(
      [
        ["kind", p.kind],
        ["layer", p.layer],
        ["symbol", p.symbol],
        ["color", p.color],
        ["size", p.size],
        ["rotation", p.rotation],
        ["frame", p.frame],
        ["boxed", p.boxed],
        ["weight", p.weight],
        ["dash", p.dash],
        ["notes", p.notes],
        ["by", p.by],
        ["createdAt", p.createdAt],
        ["updatedAt", p.updatedAt],
      ] as const
    )
      .map(([k, v]) => `<orion:${k}>${escapeXml(String(v))}</orion:${k}>`)
      .join("")}</extensions>`;
  const out: string[] = [];
  for (const p of places)
    if (p.kind === "point" || p.kind === "text")
      out.push(
        `<wpt ${at(p.points[0])}><time>${p.updatedAt}</time><name>${escapeXml(p.label)}</name><desc>${describe(p)}</desc>` +
          `<sym>${escapeXml(symbolName(p.symbol, journal.ops.symbols ?? []) || (p.kind === "text" ? t("Texte") : t("Point")))}</sym>` +
          `<type>${escapeXml(p.layer)}</type>${extensions(p)}</wpt>`,
      );
  for (const p of places)
    if (p.kind === "line" || p.kind === "area") {
      const pts = p.kind === "area" ? closed(p.points) : p.points;
      out.push(
        `<trk><name>${escapeXml(p.label)}</name><desc>${describe(p)}</desc><type>${p.kind === "area" ? "zone" : escapeXml(p.layer)}</type>${extensions(p)}` +
          `<trkseg>${pts.map((q) => `<trkpt ${at(q)}/>`).join("")}</trkseg></trk>`,
      );
    }
  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    `<gpx version="1.1" creator="orion aic" xmlns="http://www.topografix.com/GPX/1/1" xmlns:orion="${GPX_NS}">` +
    `<metadata><name>${escapeXml(title)}</name><time>${new Date().toISOString()}</time></metadata>\n` +
    out.join("\n") +
    "\n</gpx>\n"
  );
}

/* ---------- Small XML reader ---------- */

export type XmlNode = {
  /** Local name, without namespace prefix. */
  name: string;
  attrs: Record<string, string>;
  children: XmlNode[];
  text: string;
};

const ENTITIES: Record<string, string> = {
  lt: "<",
  gt: ">",
  amp: "&",
  quot: '"',
  apos: "'",
  nbsp: " ",
};
const decode = (s: string) =>
  s.replace(/&(#x[0-9a-f]+|#\d+|\w+);/gi, (all, e: string) => {
    if (e[0] === "#") {
      const n =
        e[1] === "x" || e[1] === "X"
          ? parseInt(e.slice(2), 16)
          : parseInt(e.slice(1), 10);
      return Number.isFinite(n) && n > 0 && n < 0x110000
        ? String.fromCodePoint(n)
        : "";
    }
    return ENTITIES[e.toLowerCase()] ?? all;
  });
const local = (name: string) => name.slice(name.indexOf(":") + 1);

/** Parse an XML document (enough for KML and GPX). Throws on garbage. */
export function parseXml(source: string): XmlNode {
  const root: XmlNode = { name: "#root", attrs: {}, children: [], text: "" };
  const stack: XmlNode[] = [root];
  let i = 0;
  const n = source.length;
  while (i < n) {
    const lt = source.indexOf("<", i);
    const end = lt < 0 ? n : lt;
    if (end > i) stack[stack.length - 1].text += decode(source.slice(i, end));
    if (lt < 0) break;
    if (source.startsWith("<!--", lt)) {
      const close = source.indexOf("-->", lt + 4);
      i = close < 0 ? n : close + 3;
    } else if (source.startsWith("<![CDATA[", lt)) {
      const close = source.indexOf("]]>", lt + 9);
      stack[stack.length - 1].text += source.slice(
        lt + 9,
        close < 0 ? n : close,
      );
      i = close < 0 ? n : close + 3;
    } else if (source.startsWith("<?", lt)) {
      const close = source.indexOf("?>", lt + 2);
      i = close < 0 ? n : close + 2;
    } else if (source.startsWith("<!", lt)) {
      // DOCTYPE and declarations: skipped, with an internal subset.
      let depth = 0;
      let j = lt + 2;
      for (; j < n; j++) {
        if (source[j] === "[") depth++;
        else if (source[j] === "]") depth--;
        else if (source[j] === ">" && depth <= 0) break;
      }
      i = j + 1;
    } else if (source[lt + 1] === "/") {
      const close = source.indexOf(">", lt);
      if (close < 0) throw new Error(t("XML incomplet."));
      const name = local(source.slice(lt + 2, close).trim());
      // Tolerate unbalanced documents: close up to the matching element.
      for (let k = stack.length - 1; k > 0; k--)
        if (stack[k].name === name) {
          stack.length = k;
          break;
        }
      i = close + 1;
    } else {
      // Start tag; quoted attribute values may contain ">".
      let j = lt + 1;
      let quote = "";
      for (; j < n; j++) {
        const c = source[j];
        if (quote) {
          if (c === quote) quote = "";
        } else if (c === '"' || c === "'") quote = c;
        else if (c === ">") break;
      }
      if (j >= n) throw new Error(t("XML incomplet."));
      let body = source.slice(lt + 1, j);
      const selfClosing = body.endsWith("/");
      if (selfClosing) body = body.slice(0, -1);
      const nameMatch = /^\s*([^\s/>]+)/.exec(body);
      if (!nameMatch) throw new Error(t("XML invalide."));
      const node: XmlNode = {
        name: local(nameMatch[1]),
        attrs: {},
        children: [],
        text: "",
      };
      const attr = /([^\s=]+)\s*=\s*("([^"]*)"|'([^']*)')/g;
      const rest = body.slice(nameMatch[0].length);
      for (let m = attr.exec(rest); m; m = attr.exec(rest))
        node.attrs[local(m[1])] = decode(m[3] ?? m[4] ?? "");
      stack[stack.length - 1].children.push(node);
      if (!selfClosing) stack.push(node);
      i = j + 1;
    }
  }
  const top = root.children[0];
  if (!top) throw new Error(t("Document XML vide."));
  return top;
}

const child = (node: XmlNode | undefined, name: string) =>
  node?.children.find((c) => c.name === name);
const children = (node: XmlNode | undefined, name: string) =>
  node?.children.filter((c) => c.name === name) ?? [];
const textOf = (node: XmlNode | undefined, name: string) =>
  (child(node, name)?.text ?? "").trim();
function* walk(node: XmlNode): Generator<XmlNode> {
  yield node;
  for (const c of node.children) yield* walk(c);
}

/* ---------- Import ---------- */

export type ImportedFeature = {
  kind: Place["kind"];
  points: LatLng[];
  /** Holes of an area. */
  holes?: LatLng[][];
  label: string;
  notes: string;
  layer?: string;
  symbol?: string;
  color?: string;
  size?: number;
  rotation?: number;
  frame?: boolean;
  boxed?: boolean;
  weight?: number;
  dash?: Place["dash"];
};
/** Properties shared by the geometries of one feature. */
type Base = Omit<ImportedFeature, "kind" | "points"> & { kind?: Place["kind"] };
export type ImportResult = {
  format: "GeoJSON" | "KML" | "GPX";
  /** Coordinates found in the file (converted to WGS84 on import). */
  crs?: "WGS84" | "MN95" | "MN03";
  features: ImportedFeature[];
  /** Geometries left out (invalid coordinates, too few points…). */
  skipped: number;
  /** Paths reduced to 2000 points. */
  simplified: number;
};

const round6 = (n: number) => Math.round(n * 1e6) / 1e6;
const validPoint = (lat: number, lng: number) =>
  Number.isFinite(lat) &&
  Number.isFinite(lng) &&
  Math.abs(lat) <= 90 &&
  Math.abs(lng) <= 180;

const plain = (html: string) =>
  decode(
    html
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n")
      .replace(/<[^>]*>/g, ""),
  )
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

const clampNumber = (v: unknown, min: number, max: number) => {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) && v !== "" && v !== null
    ? Math.min(max, Math.max(min, n))
    : undefined;
};
const bool = (v: unknown) =>
  v === true || v === "true"
    ? true
    : v === false || v === "false"
      ? false
      : undefined;

/** Our own properties, when the file comes from orion aic. */
function styleProps(props: Record<string, unknown>): Partial<ImportedFeature> {
  const out: Partial<ImportedFeature> = {};
  if (typeof props.layer === "string") out.layer = props.layer.slice(0, 80);
  if (typeof props.symbol === "string" && props.symbol.length <= 80)
    out.symbol = props.symbol;
  if (typeof props.color === "string") out.color = hexColor(props.color);
  out.size = clampNumber(props.size, 0.25, 8);
  out.rotation = clampNumber(props.rotation, -360, 360);
  out.weight = clampNumber(props.weight, 1, 24);
  out.frame = bool(props.frame);
  out.boxed = bool(props.boxed);
  if (props.dash === "solid" || props.dash === "dash" || props.dash === "dot")
    out.dash = props.dash;
  for (const k of Object.keys(out) as (keyof ImportedFeature)[])
    if (out[k] === undefined) delete out[k];
  return out;
}

/** Valid, rounded, without repeated vertices (nor the closing one). */
function cleanRing(raw: LatLng[], area: boolean): LatLng[] {
  const points: LatLng[] = [];
  for (const [lat, lng] of raw) {
    if (!validPoint(lat, lng)) continue;
    const p: LatLng = [round6(lat), round6(lng)];
    const last = points[points.length - 1];
    if (!last || last[0] !== p[0] || last[1] !== p[1]) points.push(p);
  }
  if (area && points.length > 1) {
    const [a, z] = [points[0], points[points.length - 1]];
    if (a[0] === z[0] && a[1] === z[1]) points.pop();
  }
  return points;
}

class Collector {
  features: ImportedFeature[] = [];
  skipped = 0;
  simplified = 0;
  add(
    kind: Place["kind"],
    raw: LatLng[],
    base: Base,
    rawHoles: LatLng[][] = [],
  ) {
    let points = cleanRing(raw, kind === "area");
    const min = kind === "area" ? 3 : kind === "line" ? 2 : 1;
    if (points.length < min) {
      this.skipped++;
      return;
    }
    if (kind === "point" || kind === "text") points = [points[0]];
    else if (points.length > MAX_POINTS) {
      points = simplifyTo(points, MAX_POINTS, 1e-6);
      this.simplified++;
    }
    const holes: LatLng[][] = [];
    if (kind === "area")
      for (const h of rawHoles.slice(0, 50)) {
        let ring = cleanRing(h, true);
        if (ring.length < 3) continue;
        if (ring.length > MAX_POINTS) ring = simplifyTo(ring, MAX_POINTS, 1e-6);
        holes.push(ring);
      }
    const f: ImportedFeature = {
      ...base,
      ...(base.color !== undefined && { color: hexColor(base.color) }),
      kind: base.kind === "text" && kind === "point" ? "text" : kind,
      label: base.label.slice(0, 200),
      notes: base.notes.slice(0, 4000),
      points,
      ...(holes.length && { holes }),
    };
    this.features.push(f);
  }
}

/** A number, or NaN for null, "", booleans, arrays… (never 0 by default). */
function finite(v: unknown): number {
  if (typeof v === "number") return Number.isFinite(v) ? v : NaN;
  if (typeof v === "string" && v.trim() !== "") return Number(v);
  return NaN;
}

const ringArgs = (
  [outer, holes]: [LatLng[], LatLng[][]],
  base: Base,
): [LatLng[], Base, LatLng[][]] => [outer, base, holes];

/** First position of a GeoJSON document, as written ([x, y]). */
function firstPosition(node: unknown, depth = 0): [number, number] | null {
  if (depth > 60 || !node || typeof node !== "object") return null;
  if (Array.isArray(node)) {
    if (node.length >= 2 && typeof node[0] === "number")
      return [finite(node[0]), finite(node[1])];
    for (const n of node) {
      const p = firstPosition(n, depth + 1);
      if (p) return p;
    }
    return null;
  }
  const o = node as Record<string, unknown>;
  for (const k of ["coordinates", "geometry", "geometries", "features"]) {
    const p = firstPosition(o[k], depth + 1);
    if (p) return p;
  }
  return null;
}

/**
 * Swiss GeoJSON files (geo.admin.ch, cantonal portals) use MN95
 * (EPSG:2056) or MN03 (EPSG:21781): named in the "crs" member, or
 * recognisable by the size of the coordinates.
 */
function swissCrs(data: unknown): "WGS84" | "MN95" | "MN03" {
  const name = String(
    (data as { crs?: { properties?: { name?: unknown } } })?.crs?.properties
      ?.name ?? "",
  );
  if (/2056/.test(name)) return "MN95";
  if (/21781/.test(name)) return "MN03";
  const p = firstPosition(data);
  if (p && Number.isFinite(p[0]) && Number.isFinite(p[1])) {
    if (isMN95(p[0], p[1])) return "MN95";
    if (isMN03(p[0], p[1]) && p[0] > 1000) return "MN03";
  }
  return "WGS84";
}

function readGeoJSON(text: string): ImportResult {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(t("Fichier GeoJSON illisible (JSON invalide)."));
  }
  const out = new Collector();
  const crs = swissCrs(data);
  const pair = (c: unknown): LatLng => {
    if (!Array.isArray(c) || c.length < 2) return [NaN, NaN];
    const x = finite(c[0]);
    const y = finite(c[1]);
    if (crs === "WGS84") return [y, x];
    try {
      const { lat, lng } = crs === "MN95" ? fromMN95(x, y) : fromMN03(x, y);
      return [lat, lng];
    } catch {
      return [NaN, NaN];
    }
  };
  const list = (c: unknown): LatLng[] => (Array.isArray(c) ? c.map(pair) : []);
  const rings = (c: unknown): [LatLng[], LatLng[][]] =>
    Array.isArray(c) ? [list(c[0]), c.slice(1).map(list)] : [[], []];
  const geometry = (g: unknown, base: Base) => {
    const geo = g as {
      type?: string;
      coordinates?: unknown;
      geometries?: unknown;
    };
    if (!geo || typeof geo !== "object") return void out.skipped++;
    const c = geo.coordinates;
    switch (geo.type) {
      case "Point":
        return out.add("point", [pair(c)], base);
      case "MultiPoint":
        return list(c).forEach((p) => out.add("point", [p], base));
      case "LineString":
        return out.add("line", list(c), base);
      case "MultiLineString":
        return Array.isArray(c)
          ? c.forEach((l) => out.add("line", list(l), base))
          : void out.skipped++;
      case "Polygon":
        return Array.isArray(c)
          ? out.add("area", ...ringArgs(rings(c), base))
          : void out.skipped++;
      case "MultiPolygon":
        return Array.isArray(c)
          ? c.forEach((poly) =>
              Array.isArray(poly)
                ? out.add("area", ...ringArgs(rings(poly), base))
                : out.skipped++,
            )
          : void out.skipped++;
      case "GeometryCollection":
        return Array.isArray(geo.geometries)
          ? geo.geometries.forEach((x) => geometry(x, base))
          : void out.skipped++;
      default:
        out.skipped++;
    }
  };
  const feature = (f: unknown) => {
    const feat = f as { geometry?: unknown; properties?: unknown };
    const props =
      feat.properties && typeof feat.properties === "object"
        ? (feat.properties as Record<string, unknown>)
        : {};
    const str = (...keys: string[]) => {
      for (const k of keys)
        if (typeof props[k] === "string" && props[k]) return props[k] as string;
        else if (typeof props[k] === "number") return String(props[k]);
      return "";
    };
    const own = "kind" in props && "layer" in props;
    const base: Base = {
      label: str("name", "Name", "NAME", "title", "label", "nom"),
      notes: plain(
        str("notes", "description", "Description", "desc", "comment"),
      ),
      ...styleProps(props),
    };
    if (props.kind === "text") base.kind = "text";
    if (!own) {
      const color = str("stroke", "marker-color", "fill", "color");
      base.color = hexColor(color);
      const w = clampNumber(props["stroke-width"], 1, 24);
      if (w) base.weight = w;
    }
    geometry(feat.geometry, base);
  };
  const root = data as { type?: string; features?: unknown[] };
  if (root?.type === "FeatureCollection" && Array.isArray(root.features))
    root.features.forEach(feature);
  else if (root?.type === "Feature") feature(root);
  else if (root && typeof root.type === "string")
    geometry(root, { label: "", notes: "" });
  else throw new Error(t("Ce fichier n’est pas du GeoJSON."));
  return {
    format: "GeoJSON",
    crs,
    features: out.features,
    skipped: out.skipped,
    simplified: out.simplified,
  };
}

/**
 * "lng,lat[,alt] lng,lat…", tolerating spaces around the commas
 * ("7.1, 46.1 7.2, 46.2"). A tuple with an empty or non-numeric member is
 * invalid (NaN), never read as 0.
 */
export const kmlCoordinates = (s: string): LatLng[] =>
  s
    .trim()
    .replace(/\s*,\s*/g, ",")
    .split(/\s+/)
    .filter(Boolean)
    .map((t) => {
      const [lng, lat] = t.split(",").map(finite);
      return [lat ?? NaN, lng ?? NaN] as LatLng;
    });
const fromKmlColor = (s: string) => {
  const v = s.trim().toLowerCase();
  return /^[0-9a-f]{8}$/.test(v)
    ? `#${v.slice(6, 8)}${v.slice(4, 6)}${v.slice(2, 4)}`
    : "";
};

function readKML(text: string): ImportResult {
  const root = parseXml(text);
  if (root.name !== "kml" && root.name !== "Document")
    throw new Error(t("Ce fichier n’est pas du KML."));
  const out = new Collector();
  type Style = { line?: string; poly?: string; icon?: string; width?: number };
  const readStyle = (s: XmlNode | undefined): Style => ({
    line: fromKmlColor(textOf(child(s, "LineStyle"), "color")) || undefined,
    width: clampNumber(textOf(child(s, "LineStyle"), "width"), 1, 24),
    poly: fromKmlColor(textOf(child(s, "PolyStyle"), "color")) || undefined,
    icon: fromKmlColor(textOf(child(s, "IconStyle"), "color")) || undefined,
  });
  const styles = new Map<string, Style>();
  const maps = new Map<string, string>();
  for (const node of walk(root)) {
    if (node.name === "Style" && node.attrs.id)
      styles.set(node.attrs.id, readStyle(node));
    if (node.name === "StyleMap" && node.attrs.id) {
      const normal = children(node, "Pair").find(
        (p) => textOf(p, "key") === "normal",
      );
      if (normal) maps.set(node.attrs.id, textOf(normal, "styleUrl"));
    }
  }
  const styleOf = (pm: XmlNode): Style => {
    const inline = child(pm, "Style");
    if (inline) return readStyle(inline);
    let url = textOf(pm, "styleUrl").replace(/^.*#/, "");
    if (maps.has(url)) url = maps.get(url)!.replace(/^.*#/, "");
    return styles.get(url) ?? {};
  };
  // Placemarks with the name of their folder: a folder becomes a layer.
  const placemarks: { pm: XmlNode; folder: string }[] = [];
  const visit = (node: XmlNode, folder: string, depth: number) => {
    if (depth > 200) return;
    for (const c of node.children) {
      if (c.name === "Placemark") placemarks.push({ pm: c, folder });
      else if (c.name === "Folder")
        visit(c, textOf(c, "name").slice(0, 80) || folder, depth + 1);
      else visit(c, folder, depth + 1);
    }
  };
  visit(root, "", 0);
  for (const { pm, folder } of placemarks) {
    const data: Record<string, unknown> = {};
    for (const d of children(child(pm, "ExtendedData"), "Data"))
      if (d.attrs.name) data[d.attrs.name] = textOf(d, "value");
    const own = "kind" in data && "layer" in data;
    const style = styleOf(pm);
    const base: Base = {
      label: textOf(pm, "name"),
      notes: plain(textOf(pm, "description")),
      ...(folder && !own && { layer: folder }),
      ...styleProps(data),
    };
    if (data.kind === "text") base.kind = "text";
    const geometry = (g: XmlNode) => {
      const colorFor = (kind: Place["kind"]) =>
        own
          ? base.color
          : (kind === "area"
              ? style.line || style.poly
              : kind === "line"
                ? style.line
                : style.icon) || "";
      const add = (kind: Place["kind"], pts: LatLng[], holes?: LatLng[][]) =>
        out.add(
          kind,
          pts,
          {
            ...base,
            color: colorFor(kind),
            ...(!own && style.width && kind !== "point"
              ? { weight: style.width }
              : {}),
          },
          holes,
        );
      switch (g.name) {
        case "Point":
          return add("point", kmlCoordinates(textOf(g, "coordinates")));
        case "LineString":
          return add("line", kmlCoordinates(textOf(g, "coordinates")));
        case "LinearRing":
          return add("area", kmlCoordinates(textOf(g, "coordinates")));
        case "Polygon": {
          const ring = child(child(g, "outerBoundaryIs"), "LinearRing");
          const holes = children(g, "innerBoundaryIs").flatMap((inner) =>
            children(inner, "LinearRing").map((r) =>
              kmlCoordinates(textOf(r, "coordinates")),
            ),
          );
          return add(
            "area",
            kmlCoordinates(textOf(ring, "coordinates")),
            holes,
          );
        }
        case "MultiGeometry":
          return g.children.forEach(geometry);
        case "Track":
          return add(
            "line",
            children(g, "coord").map((c) => {
              const [lng, lat] = c.text.trim().split(/\s+/).map(finite);
              return [lat ?? NaN, lng ?? NaN] as LatLng;
            }),
          );
        case "MultiTrack":
          return g.children.forEach(geometry);
      }
    };
    const before = out.features.length + out.skipped;
    pm.children.forEach(geometry);
    if (out.features.length + out.skipped === before) out.skipped++;
  }
  return {
    format: "KML",
    features: out.features,
    skipped: out.skipped,
    simplified: out.simplified,
  };
}

function readGPX(text: string): ImportResult {
  const root = parseXml(text);
  if (root.name !== "gpx") throw new Error(t("Ce fichier n’est pas du GPX."));
  const out = new Collector();
  const at = (n: XmlNode): LatLng => [Number(n.attrs.lat), Number(n.attrs.lon)];
  const own = (n: XmlNode) => {
    const ext = child(n, "extensions");
    const data: Record<string, unknown> = {};
    for (const c of ext?.children ?? []) data[c.name] = c.text.trim();
    return data;
  };
  const base = (n: XmlNode) => {
    const data = own(n);
    const mine = "kind" in data && "layer" in data;
    const b: Base = {
      label: textOf(n, "name"),
      notes: mine
        ? String(data.notes ?? "")
        : plain(
            [textOf(n, "desc"), textOf(n, "cmt")].filter(Boolean).join("\n"),
          ),
      ...styleProps(data),
    };
    if (data.kind === "text") b.kind = "text";
    return { b, kind: data.kind as string | undefined };
  };
  for (const w of children(root, "wpt")) out.add("point", [at(w)], base(w).b);
  for (const r of children(root, "rte")) {
    const { b } = base(r);
    out.add("line", children(r, "rtept").map(at), b);
  }
  for (const t of children(root, "trk")) {
    const { b, kind } = base(t);
    const area = kind ? kind === "area" : textOf(t, "type") === "zone";
    for (const seg of children(t, "trkseg"))
      out.add(area ? "area" : "line", children(seg, "trkpt").map(at), b);
  }
  return {
    format: "GPX",
    features: out.features,
    skipped: out.skipped,
    simplified: out.simplified,
  };
}

/** Read a GeoJSON, KML or GPX file (by name, then by content). */
export function parseGeoFile(name: string, text: string): ImportResult {
  const ext = name.toLowerCase().split(".").pop() ?? "";
  const head = text.slice(0, 2000).trimStart().replace(/^﻿/, "");
  if (ext === "geojson" || ext === "json" || head.startsWith("{"))
    return readGeoJSON(text.replace(/^﻿/, ""));
  if (ext === "gpx" || /<gpx[\s>]/.test(head)) return readGPX(text);
  if (ext === "kml" || /<kml[\s>]/.test(head)) return readKML(text);
  throw new Error(
    t("Format non reconnu : choisissez un fichier KML, KMZ, GeoJSON ou GPX."),
  );
}
