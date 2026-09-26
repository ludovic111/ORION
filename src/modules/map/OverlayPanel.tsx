import { useMemo, useState } from "react";
import { BookOpen, Eye, EyeOff, Search } from "lucide-react";
import { OVERLAYS, OVERLAY_GROUPS, legendUrl } from "./overlays";
import type { ActiveOverlays, LiveStatus } from "./overlayLayers";
import { normalizeSearch } from "./symbolsearch";

/**
 * Layers of geo.admin.ch (hazards, cadastre, live hydrology…): on / off,
 * opacity, link to the official legend. Choices stay on this post.
 */
export function OverlayPanel({
  active,
  status,
  online,
  onToggle,
  onOpacity,
}: {
  active: ActiveOverlays;
  status: Record<string, LiveStatus>;
  online: boolean;
  onToggle: (id: string, on: boolean) => void;
  onOpacity: (id: string, opacity: number) => void;
}) {
  const [query, setQuery] = useState("");
  const shown = useMemo(() => {
    const q = normalizeSearch(query);
    return q
      ? OVERLAYS.filter((o) =>
          normalizeSearch(`${o.label} ${o.hint} ${o.group}`).includes(q),
        )
      : OVERLAYS;
  }, [query]);
  const count = Object.keys(active).length;
  return (
    <section className="map-overlays" aria-label="Couches geo.admin.ch">
      <header className="map-overlays-head">
        <span className="label">Couches geo.admin.ch</span>
        {count > 0 && <span className="pill plain">{count}</span>}
      </header>
      {!online && (
        <p className="map-overlays-note">
          Hors ligne : seules les zones déjà vues (ou d’un secteur téléchargé)
          s’affichent.
        </p>
      )}
      <div className="search map-overlays-search">
        <Search size={14} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Crue, cadastre, vent…"
          aria-label="Chercher une couche"
        />
      </div>
      {OVERLAY_GROUPS.map((group) => {
        const list = shown.filter((o) => o.group === group);
        if (!list.length) return null;
        return (
          <div key={group} className="map-overlay-group">
            <h4 className="label">{group}</h4>
            {list.map((o) => {
              const on = o.id in active;
              const s = status[o.id];
              return (
                <div key={o.id} className={`map-overlay${on ? " on" : ""}`}>
                  <button
                    type="button"
                    className="map-overlay-toggle"
                    aria-pressed={on}
                    onClick={() => onToggle(o.id, !on)}
                  >
                    <span className="row-main">
                      <strong>{o.label}</strong>
                      <small>{o.hint}</small>
                    </span>
                    {on ? <Eye size={15} /> : <EyeOff size={15} />}
                  </button>
                  {on && (
                    <div className="map-overlay-tools">
                      <input
                        type="range"
                        min={0.1}
                        max={1}
                        step={0.05}
                        value={active[o.id]}
                        aria-label={`Opacité : ${o.label}`}
                        onChange={(e) =>
                          onOpacity(o.id, Number(e.target.value))
                        }
                      />
                      <output className="mono">
                        {Math.round(active[o.id] * 100)} %
                      </output>
                      {o.legend && (
                        <a
                          className="map-overlay-legend"
                          href={legendUrl(o.id)}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Légende officielle (geo.admin.ch)"
                        >
                          <BookOpen size={13} />
                          Légende
                        </a>
                      )}
                    </div>
                  )}
                  {on && o.live && s && (
                    <small
                      className={`map-overlay-status${s.error ? " crit-text" : ""}`}
                      role="status"
                    >
                      {s.error ??
                        `${s.count ?? 0} élément${(s.count ?? 0) > 1 ? "s" : ""}${s.at ? ` · données du ${s.at}` : ""}`}
                    </small>
                  )}
                  {on && o.identify && (
                    <small className="map-overlay-status">
                      Cliquez sur la carte pour interroger la couche.
                    </small>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
      <p className="map-overlays-note">
        Données officielles de la Confédération et des cantons, gratuites. Les
        zones d’inondation des barrages et les abris ne sont pas publics.
      </p>
    </section>
  );
}
