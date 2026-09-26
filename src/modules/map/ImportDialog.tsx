import { useMemo, useRef, useState } from "react";
import { FileUp, Loader2, MapPin, Pentagon, Spline, Type } from "lucide-react";
import { upsert, type OpsMap } from "../../../shared/ops";
import { useApp } from "../../app/context";
import { Modal } from "../../journal/Modal";
import { ComboField, Toggle } from "../../ui/fields";
import { parseGeoFile, type ImportResult } from "./geoformats";
import { ColorField, SymbolField } from "./PlaceSheet";
import { MAIN_NAME, hexColor } from "./maps";

const MAX_BYTES = 5 * 1024 * 1024;
const MAX_OBJECTS = 2000;
const MAX_PLACES = 5000;

type LatLng = [number, number];

const MAX_KML = 20 * 1024 * 1024;

async function readFile(file: File): Promise<string> {
  if (/\.kmz$/i.test(file.name)) {
    // KMZ: a zip holding doc.kml (and pictures, ignored). Only one entry is
    // ever inflated, and only when its declared size is reasonable: a
    // "zip bomb" never expands in memory.
    const { unzipSync, strFromU8 } = await import("fflate");
    const bytes = new Uint8Array(await file.arrayBuffer());
    const kml: { name: string; originalSize: number }[] = [];
    unzipSync(bytes, {
      filter: (f) => {
        if (/\.kml$/i.test(f.name)) kml.push(f);
        return false;
      },
    });
    const entry = kml.find((f) => /(^|\/)doc\.kml$/i.test(f.name)) ?? kml[0];
    if (!entry) throw new Error("Ce KMZ ne contient pas de fichier KML.");
    if (entry.originalSize > MAX_KML)
      throw new Error("Fichier KML trop volumineux (20 Mo au maximum).");
    const files = unzipSync(bytes, {
      filter: (f) => f.name === entry.name && f.originalSize <= MAX_KML,
    });
    const data = files[entry.name];
    if (!data || data.length > MAX_KML)
      throw new Error("Fichier KML illisible ou trop volumineux.");
    return strFromU8(data);
  }
  return file.text();
}

/**
 * Import a KML / KMZ / GeoJSON / GPX file received from a partner: preview,
 * target map, layer and colour, then every object in one change.
 */
export function ImportDialog({
  maps,
  current,
  onClose,
  onDone,
}: {
  maps: OpsMap[];
  /** Map shown ("" : implicit main map). */
  current: string;
  onClose: () => void;
  onDone: (points: LatLng[]) => void;
}) {
  const { journal, updateOps, author, toast, lists } = useApp();
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState("");
  const [result, setResult] = useState<ImportResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [target, setTarget] = useState(
    // Imported objects belong to the map shown, like drawn ones.
    maps.length ? current || maps[0].id : "",
  );
  const [layer, setLayer] = useState("");
  const [keepLayers, setKeepLayers] = useState(true);
  const [color, setColor] = useState("");
  const [symbol, setSymbol] = useState("b:point");

  const counts = useMemo(() => {
    const c = { point: 0, line: 0, area: 0, text: 0 };
    for (const f of result?.features ?? []) c[f.kind]++;
    return c;
  }, [result]);
  const own = result?.features.some((f) => f.layer !== undefined) ?? false;
  const total = result?.features.length ?? 0;
  const kept = Math.min(total, MAX_OBJECTS);
  const room = MAX_PLACES - journal.ops.places.length;

  async function choose(f: File | undefined) {
    if (!f) return;
    setError("");
    setResult(null);
    if (f.size > MAX_BYTES)
      return setError("Fichier trop volumineux : 5 Mo au maximum.");
    setBusy(true);
    try {
      const text = await readFile(f);
      const r = parseGeoFile(f.name.replace(/\.kmz$/i, ".kml"), text);
      if (!r.features.length)
        throw new Error("Aucun objet géographique lisible dans ce fichier.");
      setResult(r);
      setFile(f.name);
      setLayer(
        f.name
          .replace(/\.[^.]+$/, "")
          .replace(/[_]+/g, " ")
          .slice(0, 80),
      );
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function run() {
    if (!result) return;
    const list = result.features.slice(0, MAX_OBJECTS);
    if (list.length > room)
      return setError(
        `La carte ne peut pas dépasser ${MAX_PLACES} objets : il reste de la place pour ${Math.max(0, room)}.`,
      );
    try {
      updateOps((ops) => {
        let next = ops;
        for (const f of list)
          next = upsert(
            next,
            "places",
            {
              label: f.label,
              kind: f.kind,
              notes: f.notes,
              points: f.points,
              ...(f.holes && { holes: f.holes }),
              layer: ((keepLayers && f.layer) || layer || "Autre").slice(0, 80),
              symbol: f.kind === "point" ? f.symbol || symbol : "",
              color: hexColor(color) || hexColor(f.color),
              maps: target ? [target] : [],
              ...(f.size !== undefined && { size: f.size }),
              ...(f.rotation !== undefined && { rotation: f.rotation }),
              ...(f.frame !== undefined && { frame: f.frame }),
              ...(f.boxed !== undefined && { boxed: f.boxed }),
              ...(f.weight !== undefined && { weight: f.weight }),
              ...(f.dash !== undefined && { dash: f.dash }),
            },
            author,
          );
        return next;
      });
      toast(
        `${list.length} objet${list.length > 1 ? "s" : ""} importé${list.length > 1 ? "s" : ""} depuis « ${file} ».`,
      );
      onDone(list.flatMap((f) => f.points));
      onClose();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  const kinds = [
    { n: counts.point, label: "points", Icon: MapPin },
    { n: counts.text, label: "textes", Icon: Type },
    { n: counts.line, label: "lignes", Icon: Spline },
    { n: counts.area, label: "zones", Icon: Pentagon },
  ].filter((k) => k.n);

  return (
    <Modal title="Importer un fichier géographique" onClose={onClose}>
      <div className="map-dialog">
        <button
          type="button"
          className="map-drop"
          onClick={() => input.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            void choose(e.dataTransfer.files[0]);
          }}
        >
          {busy ? (
            <Loader2 size={24} className="map-spin" />
          ) : (
            <FileUp size={24} />
          )}
          <strong>{file || "Choisir un fichier"}</strong>
          <small>
            KML, KMZ (Google Earth), GeoJSON, GPX · 5 Mo au maximum · WGS84, ou
            MN95 / MN03 (GeoJSON suisse)
          </small>
        </button>
        <input
          ref={input}
          type="file"
          hidden
          accept=".kml,.kmz,.geojson,.json,.gpx,application/vnd.google-earth.kml+xml,application/geo+json,application/gpx+xml"
          onChange={(e) => {
            void choose(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        {result && (
          <>
            <div className="map-import-summary" role="status">
              <span className="pill accent">{result.format}</span>
              {result.crs && result.crs !== "WGS84" && (
                <span className="pill plain">{result.crs} converti</span>
              )}
              {kinds.map(({ n, label, Icon }) => (
                <span key={label} className="pill plain">
                  <Icon size={12} />
                  {n} {label}
                </span>
              ))}
            </div>
            {total > MAX_OBJECTS && (
              <p className="map-warn">
                Le fichier contient {total} objets : seuls les {MAX_OBJECTS}{" "}
                premiers seront importés.
              </p>
            )}
            {result.skipped > 0 && (
              <p className="muted">
                {result.skipped} élément{result.skipped > 1 ? "s" : ""} sans
                coordonnées valables ignoré{result.skipped > 1 ? "s" : ""}.
              </p>
            )}
            {result.simplified > 0 && (
              <p className="muted">
                {result.simplified} tracé{result.simplified > 1 ? "s" : ""}{" "}
                allégé{result.simplified > 1 ? "s" : ""} à 2000 points.
              </p>
            )}
            {maps.length > 1 && (
              <label>
                <span>Carte</span>
                <select
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                >
                  <option value="">Toutes les cartes</option>
                  {maps.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name || MAIN_NAME}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {own && (
              <Toggle
                label="Garder les calques du fichier"
                checked={keepLayers}
                onChange={setKeepLayers}
              />
            )}
            {(!own || !keepLayers) && (
              <ComboField
                label="Calque"
                value={layer}
                onChange={setLayer}
                options={lists("layers")}
                quick={6}
                maxLength={80}
                hint="Un calque propre au fichier se masque d’un clic."
              />
            )}
            <ColorField value={color} onChange={setColor} />
            {counts.point > 0 && (
              <SymbolField value={symbol} onChange={setSymbol} />
            )}
          </>
        )}
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <footer className="map-dialog-foot">
          <button type="button" className="push" onClick={onClose}>
            Annuler
          </button>
          <button
            type="button"
            className="primary"
            disabled={!result || busy}
            onClick={run}
          >
            {result
              ? `Importer ${kept} objet${kept > 1 ? "s" : ""}`
              : "Importer"}
          </button>
        </footer>
      </div>
    </Modal>
  );
}
