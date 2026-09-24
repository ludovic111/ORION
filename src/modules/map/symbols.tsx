import { memo, useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  Ban,
  Clock3,
  Cross,
  Droplets,
  Flag,
  Flame,
  Info,
  Search,
  Shapes,
  TriangleAlert,
  Truck,
  Users,
  type LucideIcon,
} from "lucide-react";

// Official civil symbols (signes conventionnels civils, OFPP) are served from
// /symbols/<id>.svg and loaded on demand; a few simple markers are drawn here.

export type SymbolInfo = {
  id: string;
  name: string;
  group: string;
  sub?: string;
};
export type Builtin = {
  id: string;
  name: string;
  icon: LucideIcon | null;
  color: string;
  layer: string;
};

export const BUILTINS: Builtin[] = [
  {
    id: "b:incident",
    name: "Incident",
    icon: Flame,
    color: "#f0443a",
    layer: "Effets",
  },
  {
    id: "b:danger",
    name: "Danger",
    icon: TriangleAlert,
    color: "#f59e0b",
    layer: "Dangers",
  },
  {
    id: "b:sanitaire",
    name: "Blessés · sanitaire",
    icon: Cross,
    color: "#e11d48",
    layer: "Effets",
  },
  {
    id: "b:pc",
    name: "Poste de commandement",
    icon: Flag,
    color: "#7b5cff",
    layer: "Emplacements",
  },
  {
    id: "b:rassemblement",
    name: "Rassemblement",
    icon: Users,
    color: "#16a34a",
    layer: "Mesures",
  },
  {
    id: "b:vehicule",
    name: "Véhicule",
    icon: Truck,
    color: "#2563eb",
    layer: "Moyens",
  },
  {
    id: "b:barrage",
    name: "Barrage",
    icon: Ban,
    color: "#dc2626",
    layer: "Mesures",
  },
  {
    id: "b:eau",
    name: "Eau · hydrante",
    icon: Droplets,
    color: "#0891b2",
    layer: "Moyens",
  },
  {
    id: "b:info",
    name: "Information",
    icon: Info,
    color: "#0ea5e9",
    layer: "Autre",
  },
  {
    id: "b:point",
    name: "Point",
    icon: null,
    color: "#8b7bff",
    layer: "Autre",
  },
];
const BUILTIN = new Map(BUILTINS.map((b) => [b.id, b]));
export const builtin = (id: string) => BUILTIN.get(id);

const OFFICIAL = /^[0-9a-f]{16}$/;
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
function loadCatalog() {
  loading ??= fetch(`${import.meta.env.BASE_URL}symbols/catalog.json`)
    .then((r) =>
      r.ok ? (r.json() as Promise<SymbolInfo[]>) : Promise.reject(new Error()),
    )
    .then((list) => (catalog = Array.isArray(list) ? list : []))
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

/** Name and default layer of a symbol value. */
export function describeSymbol(id: string, list: SymbolInfo[] | null) {
  const b = builtin(id);
  if (b) return { name: b.name, layer: b.layer, group: "Marqueurs simples" };
  const s = list?.find((x) => x.id === id);
  if (s)
    return {
      name: s.name,
      layer: GROUP_LAYER[s.group] ?? "Autre",
      group: s.group,
    };
  return { name: id ? "Signe" : "Point", layer: "Autre", group: "" };
}

const RECENT_KEY = "orion.map.recent";
export function recentSymbols(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
    return Array.isArray(v)
      ? v.filter((x) => typeof x === "string").slice(0, 16)
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
        [id, ...recentSymbols().filter((x) => x !== id)].slice(0, 16),
      ),
    );
  } catch {
    // Private mode: recent symbols are a convenience only.
  }
}

/** A symbol as drawn on the map and in lists. */
export const Glyph = memo(function Glyph({
  symbol,
  color,
  size = 34,
}: {
  symbol: string;
  color?: string;
  size?: number;
}) {
  const url = symbolUrl(symbol);
  if (url)
    return (
      <span
        className="map-glyph official"
        style={{ width: size, height: size }}
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
  const Icon = b.icon;
  return (
    <span
      className={`map-glyph simple${Icon ? "" : " dot"}`}
      style={
        { width: size, height: size, "--c": color || b.color } as CSSProperties
      }
    >
      {Icon && <Icon size={Math.round(size * 0.55)} strokeWidth={2.2} />}
    </span>
  );
});

const SIMPLE = "Marqueurs simples";
const RECENT = "Récents";

/** Searchable palette of simple markers and official symbols. */
export function SymbolPalette({
  value,
  onPick,
}: {
  value?: string;
  onPick: (id: string) => void;
}) {
  const list = useCatalog();
  const [query, setQuery] = useState("");
  const [recent, setRecent] = useState(recentSymbols);
  const groups = useMemo(() => {
    const names = [...new Set((list ?? []).map((s) => s.group))];
    return [...(recent.length ? [RECENT] : []), SIMPLE, ...names];
  }, [list, recent.length]);
  const [group, setGroup] = useState(() =>
    recentSymbols().length ? RECENT : SIMPLE,
  );
  const all = useMemo(
    () => [
      ...BUILTINS.map(
        (b) => ({ id: b.id, name: b.name, group: SIMPLE }) as SymbolInfo,
      ),
      ...(list ?? []),
    ],
    [list],
  );
  const shown = useMemo(() => {
    const norm = (s: string) =>
      s
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .toLocaleLowerCase("fr");
    const terms = norm(query).split(/\s+/).filter(Boolean);
    if (terms.length)
      return all.filter((s) => {
        const hay = norm(`${s.name} ${s.group} ${s.sub ?? ""}`);
        return terms.every((t) => hay.includes(t));
      });
    if (group === RECENT)
      return recent
        .map((id) => all.find((s) => s.id === id))
        .filter(Boolean) as SymbolInfo[];
    return all.filter((s) => s.group === group);
  }, [all, query, group, recent]);
  const sections = useMemo(() => {
    const map = new Map<string, SymbolInfo[]>();
    for (const s of shown) {
      const key = query ? s.group : (s.sub ?? "");
      map.set(key, [...(map.get(key) ?? []), s]);
    }
    return [...map.entries()];
  }, [shown, query]);
  const pick = (id: string) => {
    rememberSymbol(id);
    setRecent(recentSymbols());
    onPick(id);
  };
  return (
    <div className="map-palette">
      <div className="search map-palette-search">
        <Search size={14} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Chercher un signe : incendie, ambulance…"
          aria-label="Chercher un signe"
        />
      </div>
      {!query && (
        <div
          className="map-palette-tabs"
          role="tablist"
          aria-label="Familles de signes"
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
              ) : null}
              {g}
            </button>
          ))}
        </div>
      )}
      <div className="map-palette-grid-wrap">
        {!list && group !== SIMPLE && group !== RECENT && !query && (
          <p className="muted map-palette-note">Chargement des signes…</p>
        )}
        {sections.map(([title, items]) => (
          <section key={title || "-"}>
            {title && <h4 className="label">{title}</h4>}
            <div className="map-palette-grid">
              {items.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={`map-palette-item${s.id === value ? " on" : ""}`}
                  title={s.sub ? `${s.name} · ${s.sub}` : s.name}
                  aria-pressed={s.id === value}
                  onClick={() => pick(s.id)}
                >
                  <Glyph symbol={s.id} size={38} />
                  <span>{s.name}</span>
                </button>
              ))}
            </div>
          </section>
        ))}
        {!shown.length && (list || query) && (
          <p className="muted map-palette-note">
            {query ? "Aucun signe ne correspond." : "Aucun signe récent."}
          </p>
        )}
      </div>
      <p className="map-palette-credit">Signes conventionnels civils · OFPP</p>
    </div>
  );
}
