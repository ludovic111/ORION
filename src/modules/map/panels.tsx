import { useMemo, useState } from "react";
import {
  Eye,
  EyeOff,
  Link2,
  MapPinned,
  Pentagon,
  Search,
  Spline,
  Type,
} from "lucide-react";
import type { Place } from "../../../shared/ops";
import { useApp } from "../../app/context";
import { ref } from "../../../shared/links";
import { Glyph } from "./symbols";
import { hexColor, layerKey, toneOf } from "./maps";

export { layerKey, toneOf };

const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("fr");

const KIND_LABEL: Record<Place["kind"], string> = {
  point: "signe",
  line: "tracé",
  area: "zone",
  text: "texte",
};

export function PlaceIcon({
  place,
  size = 26,
}: {
  place: Place;
  size?: number;
}) {
  if (place.kind === "point")
    return (
      <Glyph symbol={place.symbol} color={hexColor(place.color)} size={size} />
    );
  const Icon =
    place.kind === "line" ? Spline : place.kind === "area" ? Pentagon : Type;
  return (
    <span
      className={`map-kind-icon tone-${toneOf(place.layer)}`}
      style={
        hexColor(place.color) ? { color: hexColor(place.color) } : undefined
      }
    >
      <Icon size={Math.round(size * 0.6)} />
    </span>
  );
}

/** Every object of the map, searchable. */
export function PlacesList({
  places,
  hidden,
  onPick,
  onHover,
}: {
  places: Place[];
  hidden: Set<string>;
  onPick: (place: Place) => void;
  onHover: (id: string | null) => void;
}) {
  const { graph } = useApp();
  const [query, setQuery] = useState("");
  const shown = useMemo(() => {
    const terms = norm(query).split(/\s+/).filter(Boolean);
    return [...places]
      .filter((p) => {
        if (!terms.length) return true;
        const hay = norm(
          `${p.label} ${p.layer} ${p.notes} ${KIND_LABEL[p.kind]}`,
        );
        return terms.every((t) => hay.includes(t));
      })
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [places, query]);
  return (
    <div className="map-list">
      <div className="search">
        <Search size={14} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filtrer les objets…"
          aria-label="Filtrer les objets de la carte"
        />
      </div>
      <div className="map-list-rows" onMouseLeave={() => onHover(null)}>
        {shown.map((p) => {
          const links = graph.degree.get(ref("place", p.id)) ?? 0;
          return (
            <button
              key={p.id}
              type="button"
              className={`row-item map-list-row${hidden.has(layerKey(p)) ? " dim" : ""}`}
              onClick={() => onPick(p)}
              onMouseEnter={() => onHover(p.id)}
              onFocus={() => onHover(p.id)}
            >
              <PlaceIcon place={p} />
              <span className="row-main">
                <strong>{p.label || "Objet sans nom"}</strong>
                <small>
                  {[p.layer || "Sans calque", KIND_LABEL[p.kind]].join(" · ")}
                  {hidden.has(layerKey(p)) && " · masqué"}
                </small>
              </span>
              {links > 0 && (
                <span className="pill plain" title={`${links} lien(s)`}>
                  <Link2 size={11} />
                  {links}
                </span>
              )}
            </button>
          );
        })}
        {!shown.length && (
          <div className="map-list-empty">
            <MapPinned size={22} />
            <p>
              {places.length
                ? "Aucun objet ne correspond."
                : "Aucun objet sur la carte. Choisissez « Point », « Ligne » ou « Zone » en bas de la carte pour commencer."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/** Visibility of each layer present on the map. */
export function LayersPanel({
  places,
  hidden,
  onToggle,
  onShowAll,
  ghosts,
  showGhosts,
  onGhosts,
}: {
  places: Place[];
  hidden: Set<string>;
  onToggle: (layer: string) => void;
  onShowAll: () => void;
  ghosts: number;
  showGhosts: boolean;
  onGhosts: (on: boolean) => void;
}) {
  const { lists } = useApp();
  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of places)
      map.set(layerKey(p), (map.get(layerKey(p)) ?? 0) + 1);
    const standard = lists("layers");
    return [...map.entries()].sort((a, b) => {
      const ia = standard.indexOf(a[0]);
      const ib = standard.indexOf(b[0]);
      return (
        (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) ||
        a[0].localeCompare(b[0], "fr")
      );
    });
  }, [places, lists]);
  return (
    <div className="map-layers">
      {counts.length === 0 && (
        <p className="muted map-palette-note">
          Les calques apparaissent ici dès qu’un objet est placé (Effets,
          Dangers, Moyens…).
        </p>
      )}
      {counts.map(([layer, count]) => {
        const off = hidden.has(layer);
        return (
          <button
            key={layer || "-"}
            type="button"
            className={`map-layer-row${off ? " off" : ""}`}
            aria-pressed={!off}
            onClick={() => onToggle(layer)}
          >
            <span
              className={`map-layer-dot tone-${toneOf(layer)}`}
              aria-hidden="true"
            />
            <span className="map-layer-name">{layer || "Sans calque"}</span>
            <span className="pill plain">{count}</span>
            {off ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        );
      })}
      {hidden.size > 0 && (
        <button
          type="button"
          className="small map-layers-all"
          onClick={onShowAll}
        >
          <Eye size={13} />
          Tout afficher
        </button>
      )}
      <hr />
      <button
        type="button"
        className={`map-layer-row${showGhosts ? "" : " off"}`}
        aria-pressed={showGhosts}
        onClick={() => onGhosts(!showGhosts)}
        title="Entrées et messages dont les coordonnées ne sont pas encore sur la carte"
      >
        <span className="map-layer-dot ghost" aria-hidden="true" />
        <span className="map-layer-name">Positions citées</span>
        <span className="pill plain">{ghosts}</span>
        {showGhosts ? <Eye size={15} /> : <EyeOff size={15} />}
      </button>
      <p className="muted map-layers-note">
        Coordonnées lues dans les entrées du journal et les messages, pas encore
        placées.
      </p>
    </div>
  );
}
