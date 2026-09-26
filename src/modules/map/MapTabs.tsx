import { useEffect, useRef, useState } from "react";
import {
  Crosshair,
  Ellipsis,
  CloudDownload,
  FileDown,
  FileJson,
  Printer,
  FileUp,
  Map as MapIcon,
  PencilLine,
  Plus,
} from "lucide-react";
import type { OpsMap } from "../../../shared/ops";
import { Popover } from "../../ui/Popover";
import { MAIN_NAME } from "./maps";

/**
 * Switcher between the maps of the operation ("Suivi général", "Secteur
 * Nord (détail)"…), scrollable on phones, with the map menu.
 */
export function MapTabs({
  maps,
  current,
  readOnly,
  onSelect,
  onNew,
  onEdit,
  onFrame,
  onImport,
  onExport,
  onPrint,
  onOffline,
  onSwissGeoJSON,
}: {
  maps: OpsMap[];
  /** Id of the map shown; "" for the implicit main map. */
  current: string;
  readOnly: boolean;
  onSelect: (id: string) => void;
  onNew: () => void;
  onEdit: () => void;
  onFrame: () => void;
  onImport: () => void;
  onExport: () => void;
  onPrint: () => void;
  onOffline: () => void;
  onSwissGeoJSON: () => void;
}) {
  const [menu, setMenu] = useState(false);
  const more = useRef<HTMLButtonElement>(null);
  const strip = useRef<HTMLDivElement>(null);
  const tabs = maps.length
    ? maps
    : [{ id: "", name: MAIN_NAME, purpose: "" } as OpsMap];

  // Keep the chosen tab in view on narrow screens.
  useEffect(() => {
    strip.current
      ?.querySelector<HTMLElement>('[aria-selected="true"]')
      ?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [current]);

  return (
    <div className="map-tabs map-glass">
      <div
        ref={strip}
        className="map-tabs-strip"
        role="tablist"
        aria-label="Cartes de l’opération"
      >
        {tabs.map((m) => (
          <button
            key={m.id || "main"}
            type="button"
            role="tab"
            aria-selected={m.id === current}
            className={`map-tab${m.id === current ? " on" : ""}`}
            title={m.purpose ? `${m.name} · ${m.purpose}` : m.name}
            onClick={() => onSelect(m.id)}
            onDoubleClick={() => !readOnly && m.id === current && onEdit()}
          >
            <MapIcon size={13} aria-hidden="true" />
            <span>{m.name}</span>
          </button>
        ))}
      </div>
      {!readOnly && (
        <button
          type="button"
          className="icon-button map-tabs-add"
          aria-label="Nouvelle carte"
          title="Nouvelle carte (ex. un secteur en détail)"
          onClick={onNew}
        >
          <Plus size={15} />
        </button>
      )}
      <button
        ref={more}
        type="button"
        className="icon-button"
        aria-label="Menu de la carte"
        title="Carte : cadrage, import, export"
        aria-haspopup="menu"
        aria-expanded={menu}
        onClick={() => setMenu((v) => !v)}
      >
        <Ellipsis size={16} />
      </button>
      {menu && (
        <Popover anchor={more.current} onClose={() => setMenu(false)}>
          {!readOnly && (
            <>
              <button type="button" role="menuitem" data-close onClick={onEdit}>
                <PencilLine size={14} />
                <span className="row-main">
                  <strong>
                    {maps.length
                      ? "Modifier cette carte"
                      : "Nommer cette carte"}
                  </strong>
                  <small className="muted">Nom, but, ordre, suppression</small>
                </span>
              </button>
              <button type="button" role="menuitem" data-close onClick={onNew}>
                <Plus size={14} />
                <span className="row-main">
                  <strong>Nouvelle carte</strong>
                  <small className="muted">
                    Un secteur en détail, une phase…
                  </small>
                </span>
              </button>
              <button
                type="button"
                role="menuitem"
                data-close
                onClick={onFrame}
              >
                <Crosshair size={14} />
                <span className="row-main">
                  <strong>Enregistrer ce cadrage pour cette carte</strong>
                  <small className="muted">
                    Elle s’ouvrira ici sur tous les postes
                  </small>
                </span>
              </button>
              <button
                type="button"
                role="menuitem"
                data-close
                onClick={onImport}
              >
                <FileUp size={14} />
                <span className="row-main">
                  <strong>Importer KML / GeoJSON / GPX</strong>
                  <small className="muted">
                    Fichier reçu d’un partenaire, trace GPS
                  </small>
                </span>
              </button>
            </>
          )}
          <button type="button" role="menuitem" data-close onClick={onExport}>
            <FileDown size={14} />
            <span className="row-main">
              <strong>Exporter ou imprimer…</strong>
              <small className="muted">Image, PDF, KML, GeoJSON, GPX</small>
            </span>
          </button>
          <button type="button" role="menuitem" data-close onClick={onPrint}>
            <Printer size={14} />
            <span className="row-main">
              <strong>Imprimer à l’échelle</strong>
              <small className="muted">
                A4 / A3, 1:5 000 à 1:50 000, quadrillage, légende
              </small>
            </span>
          </button>
          <button
            type="button"
            role="menuitem"
            data-close
            onClick={onSwissGeoJSON}
          >
            <FileJson size={14} />
            <span className="row-main">
              <strong>GeoJSON en MN95</strong>
              <small className="muted">EPSG:2056, pour les SIG suisses</small>
            </span>
          </button>
          <button type="button" role="menuitem" data-close onClick={onOffline}>
            <CloudDownload size={14} />
            <span className="row-main">
              <strong>Carte hors ligne…</strong>
              <small className="muted">
                Télécharger un secteur, voir l’espace utilisé
              </small>
            </span>
          </button>
        </Popover>
      )}
    </div>
  );
}
