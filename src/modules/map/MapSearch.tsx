import { useEffect, useId, useMemo, useState } from "react";
import { Loader2, LocateFixed, MapPin, Search, X } from "lucide-react";
import { formatPosition, parseCoordinates } from "./geo";

type Result = { label: string; lat: number; lng: number; zoom: number };

const SEARCH_URL = "https://api3.geo.admin.ch/rest/services/api/SearchServer";
const ZOOM_BY_ORIGIN: Record<string, number> = {
  address: 18,
  parcel: 18,
  sn25: 15,
  gazetteer: 15,
  zipcode: 14,
  gg25: 13,
  district: 11,
  kantone: 9,
};

/** Labels come as HTML ("<b>Genève</b> (GE)"): keep the text only. */
function plain(html: string) {
  const text =
    new DOMParser().parseFromString(html, "text/html").body.textContent ?? "";
  return text.replace(/\s+/g, " ").trim();
}

function parseResults(data: unknown): Result[] {
  const list = (data as { results?: unknown[] })?.results;
  if (!Array.isArray(list)) return [];
  const out: Result[] = [];
  for (const r of list) {
    const a = (r as { attrs?: Record<string, unknown> })?.attrs;
    const lat = Number(a?.lat);
    const lng = Number(a?.lon);
    if (!a || !Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    out.push({
      label: plain(String(a.label ?? "")) || "Lieu",
      lat,
      lng,
      zoom: ZOOM_BY_ORIGIN[String(a.origin ?? "")] ?? 15,
    });
  }
  return out;
}

/** Place search (swisstopo) and « aller à » coordinates. */
export function MapSearch({
  onGo,
}: {
  onGo: (lat: number, lng: number, zoom: number | null, label: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const listId = useId();
  const coords = useMemo(() => parseCoordinates(query), [query]);
  const text = query.trim();

  useEffect(() => {
    if (coords || text.length < 2) {
      setResults([]);
      setBusy(false);
      setError("");
      return;
    }
    const ctrl = new AbortController();
    setBusy(true);
    const timer = setTimeout(async () => {
      try {
        const url = `${SEARCH_URL}?searchText=${encodeURIComponent(text)}&type=locations&sr=4326&limit=8`;
        const res = await fetch(url, { signal: ctrl.signal });
        if (!res.ok) throw new Error(String(res.status));
        setResults(parseResults(await res.json()));
        setError("");
      } catch {
        if (ctrl.signal.aborted) return;
        setResults([]);
        setError(
          "Recherche de lieux indisponible (hors ligne ?). Les coordonnées fonctionnent toujours.",
        );
      } finally {
        if (!ctrl.signal.aborted) setBusy(false);
      }
    }, 280);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [text, coords]);

  const options: Result[] = coords
    ? [
        {
          label: formatPosition(coords[0], coords[1]),
          lat: coords[0],
          lng: coords[1],
          zoom: 17,
        },
      ]
    : results;
  const go = (r: Result | undefined) => {
    if (!r) return;
    onGo(r.lat, r.lng, r.zoom, r.label);
    setOpen(false);
  };
  return (
    <div className="map-search-wrap">
      <div className="search map-search">
        {busy ? (
          <Loader2 size={15} className="map-spin" />
        ) : (
          <Search size={15} />
        )}
        <input
          value={query}
          role="combobox"
          aria-expanded={open && options.length > 0}
          aria-controls={listId}
          aria-label="Rechercher un lieu ou aller à des coordonnées"
          placeholder="Lieu, adresse ou coordonnées (2 500 000 / 1 117 000)"
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setOpen(true);
              setActive((a) => Math.min(a + 1, options.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => Math.max(a - 1, 0));
            } else if (e.key === "Enter") {
              e.preventDefault();
              go(options[active] ?? options[0]);
            } else if (e.key === "Escape") {
              setOpen(false);
              (e.target as HTMLInputElement).blur();
            }
          }}
        />
        {query && (
          <button
            type="button"
            className="icon-button"
            aria-label="Effacer la recherche"
            onClick={() => {
              setQuery("");
              setResults([]);
            }}
          >
            <X size={14} />
          </button>
        )}
      </div>
      {open && text.length >= 2 && (options.length > 0 || error || !busy) && (
        <ul className="map-search-results" id={listId} role="listbox">
          {options.map((r, i) => (
            <li
              key={`${r.label}-${i}`}
              role="option"
              aria-selected={i === active}
            >
              <button
                type="button"
                className={i === active ? "on" : ""}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => go(r)}
              >
                {coords ? <LocateFixed size={14} /> : <MapPin size={14} />}
                <span>{coords ? `Aller à ${r.label}` : r.label}</span>
              </button>
            </li>
          ))}
          {!options.length && (
            <li className="map-search-note">{error || "Aucun lieu trouvé."}</li>
          )}
        </ul>
      )}
    </div>
  );
}
