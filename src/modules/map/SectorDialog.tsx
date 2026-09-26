import { useEffect, useMemo, useRef, useState } from "react";
import { Crosshair, Download, Square, Trash2, X } from "lucide-react";
import { Modal } from "../../journal/Modal";
import { TextField, Toggle } from "../../ui/fields";
import { BASES, type BaseId } from "./bases";
import {
  MAX_SECTOR_TILES,
  deleteSector,
  downloadSector,
  formatBytes,
  listSectors,
  sectorTiles,
  storageInfo,
  type Progress,
  type Sector,
  type SectorLayer,
} from "./sectors";
import { TILE_BYTES, tileBucket, type Bounds } from "./tilecache";

const BASE_CHOICES: BaseId[] = ["color", "gray", "aerial", "osm"];
const ZOOMS = Array.from({ length: 12 }, (_, i) => i + 8);

/**
 * « Télécharger un secteur pour hors ligne »: an area, a zoom range and
 * backgrounds; the count and size before downloading; progress, cancel;
 * the sectors kept on this post and the storage used.
 */
export function SectorDialog({
  view,
  zoom,
  box,
  base,
  overlays,
  onDrawBox,
  onShow,
  onClose,
}: {
  /** Area shown on the map. */
  view: Bounds;
  zoom: number;
  /** Frame drawn on the map, if any. */
  box: Bounds | null;
  base: BaseId;
  /** Active geo.admin.ch tile overlays. */
  overlays: { id: string; url: string; label: string }[];
  onDrawBox: () => void;
  onShow: (bounds: Bounds) => void;
  onClose: () => void;
}) {
  const [area, setArea] = useState<"view" | "box">(box ? "box" : "view");
  const bounds = area === "box" && box ? box : view;
  const [name, setName] = useState(
    () =>
      `Secteur du ${new Date().toLocaleDateString("fr-CH", { day: "2-digit", month: "2-digit" })}`,
  );
  const [zMin, setZMin] = useState(
    Math.max(8, Math.min(15, Math.round(zoom) - 3)),
  );
  const [zMax, setZMax] = useState(
    Math.max(zMin, Math.min(17, Math.round(zoom) + 2)),
  );
  const [bases, setBases] = useState<BaseId[]>([
    base === "night" ? "gray" : base,
  ]);
  const [withOverlays, setWithOverlays] = useState(overlays.length > 0);
  const [sectors, setSectors] = useState<Sector[]>(listSectors);
  const [storage, setStorage] =
    useState<Awaited<ReturnType<typeof storageInfo>>>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [error, setError] = useState("");
  const abort = useRef<AbortController | null>(null);

  const refresh = () => {
    setSectors(listSectors());
    void storageInfo().then(setStorage);
  };
  useEffect(() => {
    refresh();
    return () => abort.current?.abort();
  }, []);

  const layers: SectorLayer[] = useMemo(
    () => [
      ...bases.map((b) => ({
        key: b,
        label: BASES[b].label,
        url: BASES[b].url,
      })),
      ...(withOverlays
        ? overlays.map((o) => ({ key: o.id, label: o.label, url: o.url }))
        : []),
    ],
    [bases, withOverlays, overlays],
  );
  const perLayer = sectorTiles(bounds, zMin, zMax, 1);
  const total = perLayer * layers.length;
  const estimate = layers.reduce(
    (sum, l) =>
      sum +
      perLayer *
        (TILE_BYTES[
          tileBucket(l.url.replace(/\{[xyz]\}/g, "0")) || "overlay"
        ] ?? 20000),
    0,
  );
  const tooMany = total > MAX_SECTOR_TILES;
  const busy = progress !== null && abort.current !== null;

  async function start() {
    setError("");
    if (!layers.length) return setError("Choisissez au moins un fond.");
    const controller = new AbortController();
    abort.current = controller;
    setProgress({ done: 0, total, failed: 0, bytes: 0 });
    try {
      const saved = await downloadSector(
        { name: name.trim() || "Secteur", bounds, zMin, zMax, layers },
        setProgress,
        controller.signal,
      );
      if (controller.signal.aborted)
        setError(
          "Téléchargement interrompu : les tuiles déjà reçues restent disponibles.",
        );
      else if (saved.failed)
        setError(
          `${saved.failed} tuile${saved.failed > 1 ? "s" : ""} n’ont pas pu être téléchargées (hors couverture ou réseau).`,
        );
    } catch (err) {
      setError((err as Error).message);
    } finally {
      abort.current = null;
      setProgress(null);
      refresh();
    }
  }

  const zoomSelect = (
    value: number,
    set: (v: number) => void,
    label: string,
  ) => (
    <label>
      <span>{label}</span>
      <select
        value={value}
        disabled={busy}
        onChange={(e) => set(Number(e.target.value))}
      >
        {ZOOMS.map((z) => (
          <option key={z} value={z}>
            {z}
            {z <= 10
              ? " · région"
              : z <= 13
                ? " · commune"
                : z <= 16
                  ? " · quartier"
                  : " · rue"}
          </option>
        ))}
      </select>
    </label>
  );

  return (
    <Modal title="Carte hors ligne" onClose={onClose}>
      <div className="map-dialog map-sector-dialog">
        <p className="muted map-dialog-note">
          Les tuiles d’un secteur restent sur ce poste, même sans réseau, et ne
          sont jamais effacées automatiquement.
        </p>
        <div className="seg" role="group" aria-label="Zone à télécharger">
          <button
            type="button"
            aria-pressed={area === "view"}
            disabled={busy}
            onClick={() => setArea("view")}
          >
            <Crosshair size={13} />
            Zone affichée
          </button>
          <button
            type="button"
            aria-pressed={area === "box"}
            disabled={busy}
            onClick={() => (box ? setArea("box") : onDrawBox())}
          >
            <Square size={13} />
            {box ? "Cadre tracé" : "Tracer un cadre…"}
          </button>
        </div>
        {box && area === "box" && (
          <button
            type="button"
            className="small push-left"
            disabled={busy}
            onClick={onDrawBox}
          >
            Tracer un autre cadre
          </button>
        )}
        <TextField
          label="Nom du secteur"
          value={name}
          maxLength={80}
          onChange={setName}
        />
        <div className="map-dialog-row">
          {zoomSelect(
            zMin,
            (v) => (setZMin(v), setZMax((m) => Math.max(m, v))),
            "Zoom de",
          )}
          {zoomSelect(
            zMax,
            (v) => (setZMax(v), setZMin((m) => Math.min(m, v))),
            "à",
          )}
        </div>
        <fieldset className="map-sector-bases" disabled={busy}>
          <legend className="map-field-label">Fonds</legend>
          {BASE_CHOICES.map((b) => (
            <label key={b} className="check">
              <input
                type="checkbox"
                checked={bases.includes(b)}
                onChange={(e) =>
                  setBases((list) =>
                    e.target.checked
                      ? [...list, b]
                      : list.filter((x) => x !== b),
                  )
                }
              />
              {BASES[b].label}
            </label>
          ))}
          {overlays.length > 0 && (
            <Toggle
              label={`Couches geo.admin affichées (${overlays.length})`}
              checked={withOverlays}
              onChange={setWithOverlays}
            />
          )}
        </fieldset>
        <p
          className={`map-sector-estimate mono${tooMany ? " crit-text" : ""}`}
          role="status"
        >
          {total.toLocaleString("fr-CH")} tuiles · environ{" "}
          {formatBytes(estimate)}
          {tooMany &&
            ` · au plus ${MAX_SECTOR_TILES.toLocaleString("fr-CH")} : réduisez la zone ou le zoom`}
        </p>
        {progress && (
          <div className="map-sector-progress" role="status">
            <progress max={progress.total} value={progress.done} />
            <span className="mono">
              {progress.done.toLocaleString("fr-CH")} /{" "}
              {progress.total.toLocaleString("fr-CH")} ·{" "}
              {formatBytes(progress.bytes)}
              {progress.failed > 0 && ` · ${progress.failed} échec(s)`}
            </span>
          </div>
        )}
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <footer className="map-dialog-foot">
          {busy ? (
            <button
              type="button"
              className="push"
              onClick={() => abort.current?.abort()}
            >
              <X size={14} />
              Annuler le téléchargement
            </button>
          ) : (
            <>
              <button type="button" className="push" onClick={onClose}>
                Fermer
              </button>
              <button
                type="button"
                className="primary"
                disabled={tooMany || !layers.length || !navigator.onLine}
                title={
                  navigator.onLine
                    ? undefined
                    : "Hors ligne : téléchargement impossible"
                }
                onClick={() => void start()}
              >
                <Download size={14} />
                Télécharger
              </button>
            </>
          )}
        </footer>
        <section
          className="map-sector-list"
          aria-label="Secteurs gardés sur ce poste"
        >
          <h4 className="label">Secteurs sur ce poste</h4>
          {!sectors.length && (
            <p className="muted">Aucun secteur téléchargé.</p>
          )}
          {sectors.map((s) => (
            <div key={s.id} className="map-sector-row">
              <span className="row-main">
                <strong>{s.name}</strong>
                <small className="mono">
                  zoom {s.zMin}–{s.zMax} ·{" "}
                  {s.layers.map((l) => l.label).join(", ")} ·{" "}
                  {s.tiles.toLocaleString("fr-CH")} tuiles ·{" "}
                  {formatBytes(s.bytes)}
                  {!s.complete && " · incomplet"}
                </small>
              </span>
              <button
                type="button"
                className="small"
                onClick={() => onShow(s.bounds)}
              >
                Voir
              </button>
              <button
                type="button"
                className="icon-button"
                aria-label={`Supprimer le secteur « ${s.name} »`}
                disabled={busy}
                onClick={() => {
                  if (!window.confirm(`Supprimer « ${s.name} » de ce poste ?`))
                    return;
                  void deleteSector(s.id).then(refresh);
                }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          {storage && storage.quota > 0 && (
            <p className="muted mono map-sector-storage">
              Stockage du site : {formatBytes(storage.usage)} sur{" "}
              {formatBytes(storage.quota)}
              {storage.persisted
                ? " · protégé contre l’effacement"
                : " · peut être effacé par le navigateur si l’appareil manque de place"}
            </p>
          )}
        </section>
      </div>
    </Modal>
  );
}
