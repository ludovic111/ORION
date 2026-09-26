import { useState } from "react";
import { Loader2, Printer } from "lucide-react";
import { useApp } from "../../app/context";
import { Modal } from "../../journal/Modal";
import { Segmented, TextField, Toggle } from "../../ui/fields";
import { BASES, isBase, type BaseId } from "./bases";
import { formatDistance, formatPosition } from "./geo";
import {
  SCALES,
  groundOf,
  printLayout,
  scaleLabel,
  type Orientation,
  type Paper,
} from "./printscale";
import type { LatLng } from "./projection";
import { t } from "./i18n-2.ts";

async function sha256(blob: Blob) {
  const hash = await crypto.subtle.digest("SHA-256", await blob.arrayBuffer());
  return [...new Uint8Array(hash)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function save(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}

/**
 * Print to scale: paper, orientation, scale, centred on the map shown.
 * The PDF is registered like every export (SHA-256).
 */
export function PrintDialog({
  mapId,
  mapName,
  center,
  base,
  overlays,
  onClose,
}: {
  mapId: string;
  mapName: string;
  center: LatLng;
  base: BaseId;
  overlays: { url: string; opacity: number; label: string }[];
  onClose: () => void;
}) {
  const { journal, author, record, toast, viewAt } = useApp();
  const [paper, setPaper] = useState<Paper>("A4");
  const [orientation, setOrientation] = useState<Orientation>("landscape");
  const [scale, setScale] = useState<number>(25000);
  const [background, setBackground] = useState<BaseId | "none">(
    base === "night" ? "color" : base,
  );
  const [grid, setGrid] = useState(true);
  const [withOverlays, setWithOverlays] = useState(overlays.length > 0);
  const [title, setTitle] = useState(mapName);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const { frame } = printLayout(paper, orientation);
  const ground = groundOf(frame, scale);

  async function run() {
    setBusy(true);
    setError("");
    try {
      const { printMap } = await import("./printmap");
      const { blob, name } = await printMap({
        journal,
        mapId,
        mapName,
        center,
        scale,
        paper,
        orientation,
        base: background,
        overlays: withOverlays ? overlays : [],
        grid,
        title: title.trim() || mapName,
        author,
      });
      save(blob, name);
      try {
        record("exports", {
          at: new Date().toISOString(),
          format: t("Carte à l’échelle (PDF)"),
          scope: `${mapName} · ${scaleLabel(scale)} · ${paper} ${orientation === "portrait" ? t("portrait") : t("paysage")}`,
          viewAt: viewAt === null ? "" : new Date(viewAt).toISOString(),
          name,
          sha256: await sha256(blob),
          bytes: blob.size,
          fingerprint: "",
        });
      } catch {
        // The file is saved; the register is a convenience here.
      }
      toast(
        t("PDF à l’échelle {scale} enregistré.", { scale: scaleLabel(scale) }),
      );
      onClose();
    } catch (err) {
      setError(
        t("Impression impossible : {error}", {
          error: (err as Error).message || t("erreur inconnue"),
        }),
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title={t("Imprimer à l’échelle")} onClose={onClose}>
      <div className="map-dialog map-print-dialog">
        <div className="map-dialog-row">
          <span className="map-field-label">{t("Papier")}</span>
          <Segmented
            label={t("Format du papier")}
            value={paper}
            onChange={setPaper}
            options={[
              { value: "A4", label: "A4" },
              { value: "A3", label: "A3" },
            ]}
          />
          <Segmented
            label={t("Orientation")}
            value={orientation}
            onChange={setOrientation}
            options={[
              { value: "landscape", label: t("Paysage") },
              { value: "portrait", label: t("Portrait") },
            ]}
          />
        </div>
        <div className="map-dialog-row">
          <span className="map-field-label">{t("Échelle")}</span>
          <Segmented
            label={t("Échelle")}
            value={String(scale)}
            onChange={(v) => setScale(Number(v))}
            options={SCALES.map((s) => ({
              value: String(s),
              label: scaleLabel(s),
            }))}
          />
        </div>
        <p className="mono map-print-extent" role="status">
          {t("Emprise {width} × {height} · centre {centre}", {
            width: formatDistance(ground.w),
            height: formatDistance(ground.h),
            centre: formatPosition(center[0], center[1]),
          })}
        </p>
        <TextField
          label={t("Titre")}
          value={title}
          maxLength={120}
          onChange={setTitle}
        />
        <label>
          <span>{t("Fond")}</span>
          <select
            value={background}
            onChange={(e) =>
              setBackground(isBase(e.target.value) ? e.target.value : "none")
            }
          >
            {(["color", "gray", "aerial", "osm"] as BaseId[]).map((b) => (
              <option key={b} value={b}>
                {BASES[b].label}
              </option>
            ))}
            <option value="none">{t("Sans fond")}</option>
          </select>
        </label>
        <Toggle
          label={t("Quadrillage suisse (MN95)")}
          hint={t(
            "Lignes kilométriques numérotées (100 ou 250 m aux grandes échelles).",
          )}
          checked={grid}
          onChange={setGrid}
        />
        {overlays.length > 0 && (
          <Toggle
            label={t("Couches geo.admin affichées ({n})", {
              n: overlays.map((o) => o.label).join(", "),
            })}
            checked={withOverlays}
            onChange={setWithOverlays}
          />
        )}
        <p className="muted map-dialog-note">
          {t(
            "Centré sur la carte affichée. Imprimez le PDF à 100 % (sans « ajuster à la page ») pour garder l’échelle.",
          )}
        </p>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <footer className="map-dialog-foot">
          <button type="button" className="push" onClick={onClose}>
            {t("Annuler")}
          </button>
          <button
            type="button"
            className="primary"
            disabled={busy}
            onClick={() => void run()}
          >
            {busy ? (
              <Loader2 size={14} className="map-spin" />
            ) : (
              <Printer size={14} />
            )}
            {busy ? t("Préparation…") : t("Créer le PDF")}
          </button>
        </footer>
      </div>
    </Modal>
  );
}
