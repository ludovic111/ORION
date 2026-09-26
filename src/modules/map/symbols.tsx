import {
  memo,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type CSSProperties,
} from "react";
import {
  Accessibility,
  Ambulance,
  Antenna,
  Baby,
  Ban,
  BedDouble,
  Binoculars,
  Biohazard,
  Bomb,
  BrickWall,
  BriefcaseMedical,
  Building2,
  Bus,
  Camera,
  Car,
  Cctv,
  Church,
  Clock3,
  CloudFog,
  CloudLightning,
  Construction,
  createLucideIcon,
  Cross,
  Cylinder,
  Dog,
  DoorOpen,
  Droplet,
  Droplets,
  Factory,
  FireExtinguisher,
  Flag,
  FlagTriangleRight,
  Flame,
  FlaskConical,
  Footprints,
  Fuel,
  GlassWater,
  HandHeart,
  Handshake,
  Headset,
  HeartHandshake,
  HeartPulse,
  Hospital,
  Hotel,
  House,
  ImagePlus,
  Info,
  Landmark,
  LifeBuoy,
  MapPin,
  Megaphone,
  Mountain,
  MountainSnow,
  Newspaper,
  OctagonX,
  Package,
  PawPrint,
  Pencil,
  Pill,
  Plane,
  PlugZap,
  Radiation,
  Radio,
  RadioTower,
  RouteOff,
  School,
  Search,
  Shapes,
  Shield,
  ShieldCheck,
  ShieldHalf,
  Ship,
  ShowerHead,
  Signpost,
  Siren,
  Skull,
  Snowflake,
  Sparkles,
  Split,
  SquareParking,
  Stethoscope,
  Store,
  Target,
  Tent,
  Toilet,
  Tractor,
  TrafficCone,
  TrainFront,
  Trash2,
  TriangleAlert,
  Truck,
  Users,
  UserSearch,
  UsersRound,
  UtensilsCrossed,
  Warehouse,
  Waves,
  Wind,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { CustomSymbol } from "../../../shared/ops";
import { useApp } from "../../app/context";
import { useLang, type Lang } from "../../i18n";
import {
  BUILTIN_GROUPS,
  BUILTIN_LIST,
  OFFICIAL,
  customId,
  groupLabel,
  isCustom,
  officialNames,
  type BuiltinInfo,
} from "./builtins";
import { SymbolEditor } from "./SymbolEditor";
import { symbolMatches } from "./symbolsearch";
import { hexColor, standardLayer } from "./maps";
import { symbolLabel, symbolNames, t } from "./i18n-2.ts";

// Symbols of the map: official civil symbols (signes conventionnels civils,
// OFPP) served from /symbols/<id>.svg and loaded on demand, simple markers
// drawn from an icon, and symbols added by the operators (ops.symbols).

export type SymbolInfo = {
  id: string;
  name: string;
  group: string;
  sub?: string;
  keywords?: string;
};
export type Builtin = BuiltinInfo & { Icon: LucideIcon | null };

const LUCIDE: Record<string, LucideIcon> = {
  Accessibility,
  Ambulance,
  Antenna,
  Baby,
  Ban,
  BedDouble,
  Binoculars,
  Biohazard,
  Bomb,
  BrickWall,
  BriefcaseMedical,
  Building2,
  Bus,
  Camera,
  Car,
  Cctv,
  Church,
  Clock3,
  CloudFog,
  CloudLightning,
  Construction,
  Cross,
  Cylinder,
  Dog,
  DoorOpen,
  Droplet,
  Droplets,
  Factory,
  FireExtinguisher,
  Flag,
  FlagTriangleRight,
  Flame,
  FlaskConical,
  Footprints,
  Fuel,
  GlassWater,
  HandHeart,
  Handshake,
  Headset,
  HeartHandshake,
  HeartPulse,
  Hospital,
  Hotel,
  House,
  Info,
  Landmark,
  LifeBuoy,
  MapPin,
  Megaphone,
  Mountain,
  MountainSnow,
  Newspaper,
  OctagonX,
  Package,
  PawPrint,
  Pill,
  Plane,
  PlugZap,
  Radiation,
  Radio,
  RadioTower,
  RouteOff,
  School,
  Search,
  Shield,
  ShieldCheck,
  ShieldHalf,
  Ship,
  ShowerHead,
  Signpost,
  Siren,
  Skull,
  Snowflake,
  Split,
  SquareParking,
  Stethoscope,
  Store,
  Target,
  Tent,
  Toilet,
  Tractor,
  TrafficCone,
  TrainFront,
  Trash2,
  TriangleAlert,
  Truck,
  UserSearch,
  Users,
  UsersRound,
  UtensilsCrossed,
  Warehouse,
  Waves,
  Wind,
  Wrench,
  Zap,
};

// Icons missing from lucide, drawn in the same style (24 × 24, stroke).
const EXTRA_ICONS: Record<string, LucideIcon> = {
  Helicopter: createLucideIcon("Helicopter", [
    ["path", { d: "M3 4h18", key: "rotor" }],
    ["path", { d: "M12 4v3", key: "mast" }],
    [
      "path",
      {
        d: "M5 12a5 4.5 0 0 1 5-5h2a5 4.5 0 0 1 0 9h-2a5 4.5 0 0 1-5-4Z",
        key: "body",
      },
    ],
    ["path", { d: "M17 11.5h5", key: "tail" }],
    ["path", { d: "M22 9.5v4", key: "tail-rotor" }],
    ["path", { d: "M8 20h8", key: "skid" }],
    ["path", { d: "M10 16v4M14 16v4", key: "legs" }],
  ]),
  Heliport: createLucideIcon("Heliport", [
    ["circle", { cx: "12", cy: "12", r: "10", key: "ring" }],
    ["path", { d: "M9 7v10M15 7v10M9 12h6", key: "h" }],
  ]),
  Drone: createLucideIcon("Drone", [
    ["circle", { cx: "5", cy: "5", r: "2.5", key: "a" }],
    ["circle", { cx: "19", cy: "5", r: "2.5", key: "b" }],
    ["circle", { cx: "5", cy: "19", r: "2.5", key: "c" }],
    ["circle", { cx: "19", cy: "19", r: "2.5", key: "d" }],
    ["path", { d: "m7 7 3 3m7-3-3 3m-7 7 3-3m7 3-3-3", key: "arms" }],
    [
      "rect",
      { x: "9.5", y: "9.5", width: "5", height: "5", rx: "1", key: "body" },
    ],
  ]),
  Bridge: createLucideIcon("Bridge", [
    ["path", { d: "M2 9h20", key: "deck" }],
    ["path", { d: "M4 9v11M20 9v11", key: "piers" }],
    ["path", { d: "M4 17a8 6 0 0 1 16 0", key: "arch" }],
    ["path", { d: "M2 20h4M18 20h4", key: "banks" }],
  ]),
  CivilProtection: createLucideIcon("CivilProtection", [
    ["circle", { cx: "12", cy: "12", r: "10", key: "disc" }],
    ["path", { d: "M12 5.5 18 16H6Z", key: "triangle" }],
  ]),
};

/** Icon component of a builtin (lucide name or extra icon). */
export function iconOf(name: string): LucideIcon | null {
  if (!name) return null;
  return EXTRA_ICONS[name] ?? LUCIDE[name] ?? null;
}

// Same objects as BUILTIN_LIST (not a copy): their names are getters that
// follow the language of the post.
export const BUILTINS: Builtin[] = BUILTIN_LIST.map((b) =>
  Object.assign(b, { Icon: iconOf(b.icon) }),
);
const BUILTIN = new Map(BUILTINS.map((b) => [b.id, b]));
export const builtin = (id: string) => BUILTIN.get(id);

export const symbolUrl = (id: string) =>
  OFFICIAL.test(id) ? `${import.meta.env.BASE_URL}symbols/${id}.svg` : "";

export const GROUP_LAYER: Record<string, string> = {
  Effets: "Effets",
  Dangers: "Dangers",
  Pictogrammes: "Effets",
  Formations: "Moyens",
  Véhicules: "Moyens",
  "Installations temporaires": "Mesures",
  Mouvements: "Mesures",
  "Emplacements de conduite civils": "Emplacements",
  Spéciaux: "Autre",
};

let catalog: SymbolInfo[] | null = null;
let loading: Promise<SymbolInfo[]> | null = null;
export function loadCatalog() {
  loading ??= fetch(`${import.meta.env.BASE_URL}symbols/catalog.json`)
    .then((r) =>
      r.ok ? (r.json() as Promise<SymbolInfo[]>) : Promise.reject(new Error()),
    )
    .then((list) => {
      catalog = Array.isArray(list) ? list : [];
      for (const s of catalog) officialNames.set(s.id, s.name);
      return catalog;
    })
    .catch(() => {
      loading = null;
      return [];
    });
  return loading;
}

/** Catalog of the official symbols (null while loading). */
export function useCatalog() {
  const [list, setList] = useState(catalog);
  useEffect(() => {
    if (catalog) return;
    let alive = true;
    loadCatalog().then((l) => alive && setList(l));
    return () => {
      alive = false;
    };
  }, []);
  return list;
}

/* ---------- Custom symbols ---------- */

// Kept outside React state so that hundreds of markers do not re-render on
// every change of the journal: only the glyphs of custom symbols subscribe.
let customs: CustomSymbol[] = [];
let customById = new Map<string, CustomSymbol>();
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());
export function setCustomSymbols(list: CustomSymbol[], tell = true) {
  const same =
    list.length === customs.length && list.every((s, i) => s === customs[i]);
  if (same) return;
  customs = list;
  customById = new Map(list.map((s) => [s.id, s]));
  if (tell) notify();
}
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
export const customSymbols = () => customs;
export const customSymbol = (value: string) =>
  isCustom(value) ? customById.get(customId(value)) : undefined;
export function useCustomSymbols() {
  return useSyncExternalStore(subscribe, customSymbols, customSymbols);
}
/** Publish the custom symbols of the journal shown (and of the live one). */
export function useCustomSymbolsSync(
  shown: CustomSymbol[],
  live: CustomSymbol[],
) {
  const list = useMemo(() => {
    if (shown === live) return shown;
    const ids = new Set(shown.map((s) => s.id));
    return [...shown, ...live.filter((s) => !ids.has(s.id))];
  }, [shown, live]);
  // Known during this render (names, glyphs); subscribers are told after.
  setCustomSymbols(list, false);
  useLayoutEffect(() => notify(), [list]);
}

/**
 * Name, family (both in the language of the post) and default layer of a
 * symbol value. The layer is one of the standard layers, in the language of
 * the journal when `lang` is given (journalLang(ops)), French otherwise.
 */
export function describeSymbol(
  id: string,
  list: SymbolInfo[] | null,
  lang: Lang = "fr",
) {
  const b = builtin(id);
  if (b)
    return {
      name: b.name,
      layer: standardLayer(b.layer, lang),
      group: groupLabel(b.group),
    };
  const c = customSymbol(id);
  if (c)
    return {
      name: c.name,
      layer: standardLayer("Autre", lang),
      group: c.group || t("Personnalisés"),
    };
  const s = list?.find((x) => x.id === id);
  if (s)
    return {
      name: symbolLabel(s.name),
      layer: standardLayer(GROUP_LAYER[s.group] ?? "Autre", lang),
      group: groupLabel(s.group),
    };
  return {
    name: id ? t("Signe") : t("Point"),
    layer: standardLayer("Autre", lang),
    group: "",
  };
}

const RECENT_KEY = "orion.map.recent";
export function recentSymbols(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
    return Array.isArray(v)
      ? v.filter((x) => typeof x === "string").slice(0, 24)
      : [];
  } catch {
    return [];
  }
}
export function rememberSymbol(id: string) {
  try {
    localStorage.setItem(
      RECENT_KEY,
      JSON.stringify(
        [id, ...recentSymbols().filter((x) => x !== id)].slice(0, 24),
      ),
    );
  } catch {
    // Private mode: recent symbols are a convenience only.
  }
}

const boxStyle = (size: number, frame: boolean): CSSProperties => ({
  width: size,
  height: size,
  padding: frame ? Math.max(2, Math.round(size * 0.09)) : 0,
  borderRadius: frame ? Math.round(size * 0.26) : 0,
});

function CustomGlyph({
  value,
  size,
  frame,
}: {
  value: string;
  size: number;
  frame: boolean;
}) {
  useCustomSymbols();
  const s = customSymbol(value);
  return (
    <span
      className={`map-glyph image${frame ? " framed" : " bare"}`}
      style={boxStyle(size, frame)}
    >
      {s ? (
        <img src={s.image} alt="" draggable={false} decoding="async" />
      ) : (
        <Shapes size={Math.round(size * 0.5)} />
      )}
    </span>
  );
}

/**
 * A symbol as drawn on the map and in lists. `frame`: inside a round badge
 * (lists, palette, framed objects); otherwise the symbol alone, with a halo.
 */
export const Glyph = memo(function Glyph({
  symbol,
  color,
  size = 34,
  frame = true,
}: {
  symbol: string;
  color?: string;
  size?: number;
  frame?: boolean;
}) {
  if (isCustom(symbol))
    return <CustomGlyph value={symbol} size={size} frame={frame} />;
  const url = symbolUrl(symbol);
  if (url)
    return (
      <span
        className={`map-glyph image official${frame ? " framed" : " bare"}`}
        style={boxStyle(size, frame)}
      >
        <img
          src={url}
          alt=""
          loading="lazy"
          decoding="async"
          draggable={false}
        />
      </span>
    );
  const b = builtin(symbol) ?? builtin("b:point")!;
  const Icon = b.Icon;
  return (
    <span
      className={`map-glyph simple${Icon ? "" : " dot"}${frame ? " framed" : " bare"}`}
      style={
        {
          width: size,
          height: size,
          "--c": hexColor(color ?? "") || b.color,
        } as CSSProperties
      }
    >
      {Icon && (
        <Icon
          size={Math.round(size * (frame ? 0.55 : 0.86))}
          strokeWidth={frame ? 2.2 : 2.4}
        />
      )}
    </span>
  );
});

// Tabs of the palette besides the families of the catalog (codes).
const SIMPLE = "Marqueurs simples";
const RECENT = "Récents";
const CUSTOM = "Personnalisés";
/** Title of a family or a section of the palette. */
const familyLabel = (g: string) =>
  g === SIMPLE
    ? t("Marqueurs simples")
    : g === RECENT
      ? t("Récents")
      : g === CUSTOM
        ? t("Personnalisés")
        : groupLabel(g);

const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("fr");

/**
 * Searchable palette: recent symbols, simple markers (by family), official
 * OFPP symbols (by group) and the custom symbols of the operation.
 */
export function SymbolPalette({
  value,
  onPick,
}: {
  value?: string;
  onPick: (id: string) => void;
}) {
  const { readOnly } = useApp();
  const lang = useLang();
  const list = useCatalog();
  const own = useCustomSymbols();
  const [query, setQuery] = useState("");
  const [recent, setRecent] = useState(recentSymbols);
  const [editing, setEditing] = useState<CustomSymbol | "new" | null>(null);
  const groups = useMemo(() => {
    const names = [...new Set((list ?? []).map((s) => s.group))];
    return [...(recent.length ? [RECENT] : []), SIMPLE, ...names, CUSTOM];
  }, [list, recent.length]);
  const [group, setGroup] = useState(() =>
    recentSymbols().length ? RECENT : SIMPLE,
  );
  // Names in the language of the post; the search also reads the French,
  // German and Italian names and the French families (keywords).
  const all = useMemo(
    () => [
      ...BUILTINS.map(
        (b) =>
          ({
            id: b.id,
            name: b.name,
            group: SIMPLE,
            sub: b.group,
            keywords: `${b.group} ${b.keywords ?? ""}`,
          }) as SymbolInfo,
      ),
      ...(list ?? []).map(
        (s) =>
          ({
            ...s,
            name: symbolLabel(s.name),
            keywords: `${symbolNames(s.name)} ${s.group} ${s.sub ?? ""} ${s.keywords ?? ""}`,
          }) as SymbolInfo,
      ),
      ...own.map(
        (s) =>
          ({
            id: `c:${s.id}`,
            name: s.name,
            group: CUSTOM,
            sub: s.group,
          }) as SymbolInfo,
      ),
    ],
    [list, own, lang],
  );
  const shown = useMemo(() => {
    if (norm(query).trim())
      // French, German or Italian: « Feuer », « frana », « incendie ».
      return all.filter((s) =>
        symbolMatches(
          `${s.name} ${familyLabel(s.group)} ${s.sub ? groupLabel(s.sub) : ""} ${s.keywords ?? ""}`,
          query,
        ),
      );
    if (group === RECENT)
      return recent
        .map((id) => all.find((s) => s.id === id))
        .filter(Boolean) as SymbolInfo[];
    return all.filter((s) => s.group === group);
  }, [all, query, group, recent]);
  const sections = useMemo(() => {
    const map = new Map<string, SymbolInfo[]>();
    if (group === SIMPLE && !query)
      for (const g of BUILTIN_GROUPS) map.set(g, []);
    for (const s of shown) {
      const key = query ? s.group : (s.sub ?? "");
      map.set(key, [...(map.get(key) ?? []), s]);
    }
    return [...map.entries()].filter(([, items]) => items.length);
  }, [shown, query, group]);
  const pick = (id: string) => {
    rememberSymbol(id);
    setRecent(recentSymbols());
    onPick(id);
  };
  const customTab = group === CUSTOM && !query;
  return (
    <div className="map-palette">
      <div className="search map-palette-search">
        <Search size={14} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("Chercher : incendie, Feuer, frana, ambulance…")}
          aria-label={t("Chercher un signe (français, allemand ou italien)")}
        />
      </div>
      {!query && (
        <div
          className="map-palette-tabs"
          role="tablist"
          aria-label={t("Familles de signes")}
        >
          {groups.map((g) => (
            <button
              key={g}
              type="button"
              role="tab"
              aria-selected={g === group}
              className={g === group ? "on" : ""}
              onClick={() => setGroup(g)}
            >
              {g === RECENT ? (
                <Clock3 size={12} />
              ) : g === SIMPLE ? (
                <Shapes size={12} />
              ) : g === CUSTOM ? (
                <Sparkles size={12} />
              ) : null}
              {g === CUSTOM ? t("Signes personnalisés") : familyLabel(g)}
              {g === CUSTOM && own.length > 0 && <small>{own.length}</small>}
            </button>
          ))}
        </div>
      )}
      <div className="map-palette-grid-wrap">
        {customTab && !readOnly && (
          <button
            type="button"
            className="map-palette-add"
            onClick={() => setEditing("new")}
          >
            <ImagePlus size={18} />
            <span>
              <strong>{t("Ajouter un signe")}</strong>
              <small>
                {t("Image PNG, SVG, JPEG ou WebP · fond rendu transparent")}
              </small>
            </span>
          </button>
        )}
        {!list &&
          group !== SIMPLE &&
          group !== RECENT &&
          group !== CUSTOM &&
          !query && (
            <p className="muted map-palette-note">
              {t("Chargement des signes…")}
            </p>
          )}
        {sections.map(([title, items]) => (
          <section key={title || "-"}>
            {title && <h4 className="label">{familyLabel(title)}</h4>}
            <div className="map-palette-grid">
              {items.map((s) => (
                <div className="map-palette-cell" key={s.id}>
                  <button
                    type="button"
                    className={`map-palette-item${s.id === value ? " on" : ""}`}
                    title={s.sub ? `${s.name} · ${groupLabel(s.sub)}` : s.name}
                    aria-pressed={s.id === value}
                    onClick={() => pick(s.id)}
                  >
                    <Glyph symbol={s.id} size={38} />
                    <span>{s.name}</span>
                  </button>
                  {customTab && !readOnly && (
                    <button
                      type="button"
                      className="icon-button map-palette-edit"
                      aria-label={t("Modifier le signe « {name} »", {
                        name: s.name,
                      })}
                      title={t("Renommer, remplacer ou supprimer")}
                      onClick={() => {
                        const c = customSymbol(s.id);
                        if (c) setEditing(c);
                      }}
                    >
                      <Pencil size={12} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>
        ))}
        {!shown.length && (list || query || group === CUSTOM) && (
          <p className="muted map-palette-note">
            {query
              ? t("Aucun signe ne correspond.")
              : group === CUSTOM
                ? readOnly
                  ? t("Aucun signe personnalisé.")
                  : t(
                      "Aucun signe personnalisé. Ajoutez le logo d’un partenaire, un pictogramme maison… Il sera disponible sur tous les postes.",
                    )
                : t("Aucun signe récent.")}
          </p>
        )}
      </div>
      <p className="map-palette-credit">
        {t("Signes conventionnels civils · OFPP")}
      </p>
      {editing && (
        <SymbolEditor
          symbol={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={(id) => {
            setGroup(CUSTOM);
            if (editing === "new") pick(`c:${id}`);
          }}
        />
      )}
    </div>
  );
}
