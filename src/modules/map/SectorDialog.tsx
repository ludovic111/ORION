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
import { overlayById } from "./overlays";
import { formatDayMonth, formatNumber } from "../../../shared/i18n/core.ts";
import { t, tn } from "./i18n-2.ts";

const BASE_CHOICES: BaseId[] = ["color", "gray", "aerial", "osm"];
const ZOOMS = Array.from({ length: 12 }, (_, i) => i + 8);

/** Name of a background or overlay of a sector, in the language of the post. */
const layerName = (l: SectorLayer) =>
  l.key in BASES
    ? BASES[l.key as BaseId].label
    : (overlayById(l.key)?.label ?? l.label);

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
  const [name, setName] = useState(() =>
    t("Secteur du {date}", { date: formatDayMonth(Date.now()) }),
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
    if (!layers.length) return setError(t("Choisissez au moins un fond."));
    const controller = new AbortController();
    abort.current = controller;
    setProgress({ done: 0, total, failed: 0, bytes: 0 });
    try {
      const saved = await downloadSector(
        { name: name.trim() || t("Secteur"), bounds, zMin, zMax, layers },
        setProgress,
        controller.signal,
      );
      if (controller.signal.aborted)
        setError(
          t(
            "Téléchargement interrompu : les tuiles déjà reçues restent disponibles.",
          ),
        );
      else if (saved.failed)
        setError(
          tn(
            saved.failed,
            "{n} tuile n’a pas pu être téléchargée (hors couverture ou réseau).",
            "{n} tuiles n’ont pas pu être téléchargées (hors couverture ou réseau).",
          ),
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
            {" · "}
            {z <= 10
              ? t("région")
              : z <= 13
                ? t("commune")
                : z <= 16
                  ? t("quartier")
                  : t("rue")}
          </option>
        ))}
      </select>
    </label>
  );

  return (
    <Modal title={t("Carte hors ligne")} onClose={onClose}>
      <div className="map-dialog map-sector-dialog">
        <p className="muted map-dialog-note">
          {t(
            "Les tuiles d’un secteur restent sur ce poste, même sans réseau, et ne sont jamais effacées automatiquement.",
          )}
        </p>
        <div className="seg" role="group" aria-label={t("Zone à télécharger")}>
          <button
            type="button"
            aria-pressed={area === "view"}
            disabled={busy}
            onClick={() => setArea("view")}
          >
            <Crosshair size={13} />
            {t("Zone affichée")}
          </button>
          <button
            type="button"
            aria-pressed={area === "box"}
            disabled={busy}
            onClick={() => (box ? setArea("box") : onDrawBox())}
          >
            <Square size={13} />
            {box ? t("Cadre tracé") : t("Tracer un cadre…")}
          </button>
        </div>
        {box && area === "box" && (
          <button
            type="button"
            className="small push-left"
            disabled={busy}
            onClick={onDrawBox}
          >
            {t("Tracer un autre cadre")}
          </button>
        )}
        <TextField
          label={t("Nom du secteur")}
          value={name}
          maxLength={80}
          onChange={setName}
        />
        <div className="map-dialog-row">
          {zoomSelect(
            zMin,
            (v) => (setZMin(v), setZMax((m) => Math.max(m, v))),
            t("Zoom de"),
          )}
          {zoomSelect(
            zMax,
            (v) => (setZMax(v), setZMin((m) => Math.min(m, v))),
            t("à (zoom)"),
          )}
        </div>
        <fieldset className="map-sector-bases" disabled={busy}>
          <legend className="map-field-label">{t("Fonds")}</legend>
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
              label={t("Couches geo.admin affichées ({n})", {
                n: overlays.length,
              })}
              checked={withOverlays}
              onChange={setWithOverlays}
            />
          )}
        </fieldset>
        <p
          className={`map-sector-estimate mono${tooMany ? " crit-text" : ""}`}
          role="status"
        >
          {t("{n} tuiles · environ {size}", {
            n: formatNumber(total),
            size: formatBytes(estimate),
          })}
          {tooMany &&
            ` · ${t("au plus {max} : réduisez la zone ou le zoom", {
              max: formatNumber(MAX_SECTOR_TILES),
            })}`}
        </p>
        {progress && (
          <div className="map-sector-progress" role="status">
            <progress max={progress.total} value={progress.done} />
            <span className="mono">
              {formatNumber(progress.done)} / {formatNumber(progress.total)} ·{" "}
              {formatBytes(progress.bytes)}
              {progress.failed > 0 &&
                ` · ${tn(progress.failed, "{n} échec", "{n} échecs")}`}
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
              {t("Annuler le téléchargement")}
            </button>
          ) : (
            <>
              <button type="button" className="push" onClick={onClose}>
                {t("Fermer")}
              </button>
              <button
                type="button"
                className="primary"
                disabled={tooMany || !layers.length || !navigator.onLine}
                title={
                  navigator.onLine
                    ? undefined
                    : t("Hors ligne : téléchargement impossible")
                }
                onClick={() => void start()}
              >
                <Download size={14} />
                {t("Télécharger")}
              </button>
            </>
          )}
        </footer>
        <section
          className="map-sector-list"
          aria-label={t("Secteurs gardés sur ce poste")}
        >
          <h4 className="label">{t("Secteurs sur ce poste")}</h4>
          {!sectors.length && (
            <p className="muted">{t("Aucun secteur téléchargé.")}</p>
          )}
          {sectors.map((s) => (
            <div key={s.id} className="map-sector-row">
              <span className="row-main">
                <strong>{s.name}</strong>
                <small className="mono">
                  {t("zoom {min}–{max}", { min: s.zMin, max: s.zMax })} ·{" "}
                  {s.layers.map(layerName).join(", ")} ·{" "}
                  {tn(s.tiles, "{n} tuile", "{n} tuiles", {
                    n: formatNumber(s.tiles),
                  })}{" "}
                  · {formatBytes(s.bytes)}
                  {!s.complete && ` · ${t("incomplet")}`}
                </small>
              </span>
              <button
                type="button"
                className="small"
                onClick={() => onShow(s.bounds)}
              >
                {t("Voir")}
              </button>
              <button
                type="button"
                className="icon-button"
                aria-label={t("Supprimer le secteur « {name} »", {
                  name: s.name,
                })}
                disabled={busy}
                onClick={() => {
                  if (
                    !window.confirm(
                      t("Supprimer « {name} » de ce poste ?", { name: s.name }),
                    )
                  )
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
              {t("Stockage du site : {used} sur {quota}", {
                used: formatBytes(storage.usage),
                quota: formatBytes(storage.quota),
              })}
              {" · "}
              {storage.persisted
                ? t("protégé contre l’effacement")
                : t(
                    "peut être effacé par le navigateur si l’appareil manque de place",
                  )}
            </p>
          )}
        </section>
      </div>
    </Modal>
  );
}
