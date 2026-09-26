import { useEffect, useRef, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import L from "leaflet";
import {
  BookPlus,
  Crosshair,
  ExternalLink,
  MapPin,
  Navigation,
  X,
} from "lucide-react";
import {
  ageText,
  freshness,
  mn95Of,
  positionEntry,
  type Unit,
} from "../../../shared/live";
import { formatMN95 } from "../../../shared/coordinates";
import type { Ref } from "../../../shared/links";
import { useApp } from "../../app/context";
import { liveActions, useLive } from "../../live/store";

// Layer « Positions en direct »: the teams sharing their position (kept in
// memory by src/live/LiveHost.tsx), each with its label, accuracy circle,
// age and trail of the last 30 minutes. Old positions turn grey after
// 2 minutes and leave after 30. Hidden in the time machine: the past has no
// live positions. Nothing here writes, except the explicit actions of the
// card (journal entry, map point), through the write gate.

const escape = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[c]!,
  );

type Drawn = {
  marker: L.Marker;
  circle: L.Circle;
  trail: L.Polyline;
  html: string;
};

function iconHtml(u: Unit, now: number) {
  const state = freshness(u.t, now);
  const heading =
    u.hdg !== null && state === "live"
      ? `<i class="map-team-heading" style="transform:rotate(${u.hdg}deg)"></i>`
      : "";
  return `<div class="map-team${state === "stale" ? " stale" : ""}${u.self ? " self" : ""}">${heading}<span class="map-team-dot"></span><span class="map-team-label"><b>${escape(u.label || u.name || "Équipe")}</b><small>${ageText(now - u.t)}</small></span></div>`;
}

/** Leaflet drawing of the live units; the card of the one clicked. */
export function LiveLayer({
  mapRef,
  show,
  onCreatePoint,
}: {
  mapRef: RefObject<L.Map | null>;
  /** Layer on and live view (not the time machine). */
  show: boolean;
  onCreatePoint: (unit: Unit) => void;
}) {
  const { units, now } = useLive();
  const { readOnly, addEntry, open, toast } = useApp();
  const group = useRef<L.LayerGroup | null>(null);
  const drawn = useRef(new Map<string, Drawn>());
  const [ready, setReady] = useState(false);
  const [menu, setMenu] = useState<{
    peer: string;
    x: number;
    y: number;
  } | null>(null);
  const onClick = useRef((peer: string, e: MouseEvent) =>
    setMenu({ peer, x: e.clientX, y: e.clientY }),
  );

  // The map is created by the parent's effect, after this one: wait for it.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let layer: L.LayerGroup | null = null;
    const drawnMap = drawn.current;
    const attach = () => {
      const m = mapRef.current;
      if (!m) {
        // (a timer, not a frame: frames wait while the tab is hidden)
        timer = setTimeout(attach, 30);
        return;
      }
      if (!m.getPane("orion-teams")) {
        const pane = m.createPane("orion-teams");
        pane.style.zIndex = "630";
      }
      layer = L.layerGroup().addTo(m);
      group.current = layer;
      setReady(true);
    };
    attach();
    return () => {
      clearTimeout(timer);
      layer?.remove();
      drawnMap.clear();
      group.current = null;
    };
  }, [mapRef]);

  useEffect(() => {
    const g = group.current;
    if (!g || !ready) return;
    const seen = new Set<string>();
    for (const u of show ? units : []) {
      if (freshness(u.t, now) === "gone") continue;
      seen.add(u.peer);
      const at: L.LatLngExpression = [u.lat, u.lng];
      const html = iconHtml(u, now);
      const stale = freshness(u.t, now) === "stale";
      const trail = u.trail.map(([lat, lng]) => [lat, lng] as [number, number]);
      const d = drawn.current.get(u.peer);
      if (d) {
        d.marker.setLatLng(at);
        if (d.html !== html) {
          d.marker.setIcon(icon(html));
          d.html = html;
        }
        d.circle.setLatLng(at).setRadius(Math.max(1, u.acc));
        d.trail.setLatLngs(trail);
        d.circle.getElement()?.classList.toggle("stale", stale);
        d.trail.getElement()?.classList.toggle("stale", stale);
        continue;
      }
      const circle = L.circle(at, {
        radius: Math.max(1, u.acc),
        className: `map-team-acc${stale ? " stale" : ""}`,
        interactive: false,
        pane: "orion-teams",
      }).addTo(g);
      const line = L.polyline(trail, {
        className: `map-team-trail${stale ? " stale" : ""}`,
        interactive: false,
        pane: "orion-teams",
      }).addTo(g);
      const marker = L.marker(at, {
        icon: icon(html),
        keyboard: true,
        pane: "orion-teams",
        zIndexOffset: 1000,
      });
      const peer = u.peer;
      marker.on("add", () =>
        marker
          .getElement()
          ?.setAttribute("aria-label", `Position en direct : ${u.label}`),
      );
      marker.on("click", (e: L.LeafletMouseEvent) =>
        onClick.current(peer, e.originalEvent),
      );
      marker.addTo(g);
      drawn.current.set(peer, { marker, circle, trail: line, html });
    }
    for (const [peer, d] of drawn.current)
      if (!seen.has(peer)) {
        d.marker.remove();
        d.circle.remove();
        d.trail.remove();
        drawn.current.delete(peer);
      }
  }, [units, now, show, ready]);

  const unit = menu ? units.find((u) => u.peer === menu.peer) : undefined;
  useEffect(() => {
    if (menu && (!unit || !show)) setMenu(null);
  }, [menu, unit, show]);
  useEffect(() => {
    if (!menu) return;
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenu(null);
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [menu]);

  if (!menu || !unit || !show) return null;
  const mn95 = mn95Of(unit.lat, unit.lng);
  let grid = "";
  try {
    grid = formatMN95(unit.lat, unit.lng);
  } catch {
    grid = `${unit.lat.toFixed(5)}, ${unit.lng.toFixed(5)}`;
  }
  const stale = freshness(unit.t, now) === "stale";
  return createPortal(
    <div
      className="hovercard map-info-card map-team-card"
      style={{
        left: Math.max(8, Math.min(menu.x + 12, window.innerWidth - 336)),
        top: Math.max(8, Math.min(menu.y + 12, window.innerHeight - 360)),
      }}
      role="dialog"
      aria-label={`Position en direct : ${unit.label}`}
    >
      <header>
        <span className="label">
          {unit.self ? "Ce poste · position partagée" : "Position en direct"}
        </span>
        <button
          type="button"
          className="icon-button"
          aria-label="Fermer"
          onClick={() => setMenu(null)}
        >
          <X size={14} />
        </button>
      </header>
      <strong>{unit.label || unit.name}</strong>
      <dl>
        <div>
          <dt>Relevée</dt>
          <dd className={stale ? "crit-text" : undefined}>
            {ageText(now - unit.t)}
            {stale && " (ancienne)"}
          </dd>
        </div>
        <div>
          <dt>Poste</dt>
          <dd>{unit.name || "Poste inconnu"}</dd>
        </div>
        <div>
          <dt>MN95</dt>
          <dd className="mono">{grid}</dd>
        </div>
        <div>
          <dt>Précision</dt>
          <dd>± {Math.round(unit.acc)} m</dd>
        </div>
        {unit.spd !== null && (
          <div>
            <dt>Vitesse</dt>
            <dd>
              {Math.round(unit.spd * 3.6)} km/h
              {unit.hdg !== null && ` · cap ${Math.round(unit.hdg)}°`}
            </dd>
          </div>
        )}
      </dl>
      <div className="map-ghost-actions">
        <button
          type="button"
          className="small"
          onClick={() =>
            mapRef.current?.flyTo(
              [unit.lat, unit.lng],
              Math.max(mapRef.current.getZoom(), 16),
              { duration: 0.6 },
            )
          }
        >
          <Crosshair size={13} />
          Centrer
        </button>
        {!readOnly && (
          <button
            type="button"
            className="small"
            title={mn95 ? `Entrée avec les coordonnées ${mn95}` : undefined}
            onClick={() => {
              const id = addEntry(
                positionEntry(unit),
                unit.ref ? [unit.ref as Ref] : [],
              );
              if (id) {
                toast("Position consignée au journal.");
                setMenu(null);
              }
            }}
          >
            <BookPlus size={13} />
            Consigner au journal
          </button>
        )}
        {!readOnly && (
          <button
            type="button"
            className="small"
            onClick={() => {
              setMenu(null);
              onCreatePoint(unit);
            }}
          >
            <MapPin size={13} />
            Créer un point ici
          </button>
        )}
        {unit.ref && (
          <button
            type="button"
            className="small"
            onClick={() => {
              setMenu(null);
              open(unit.ref as Ref);
            }}
          >
            <ExternalLink size={13} />
            Fiche
          </button>
        )}
      </div>
    </div>,
    document.body,
  );
}

const icon = (html: string) =>
  L.divIcon({
    html,
    className: "map-icon map-team-icon",
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });

/** Map control: share this post's position, or see the sharing. */
export function LiveShareButton() {
  const { sharing } = useLive();
  return (
    <button
      type="button"
      className="icon-button"
      aria-pressed={!!sharing}
      aria-label={
        sharing ? "Position partagée : détails" : "Partager ma position"
      }
      title={
        sharing
          ? "Position partagée en direct : détails et arrêt"
          : "Partager ma position en direct avec les autres postes"
      }
      onClick={() => liveActions.openShare()}
    >
      <Navigation size={16} />
    </button>
  );
}
