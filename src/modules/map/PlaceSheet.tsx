import { useState } from "react";
import { Copy, Crosshair, Spline } from "lucide-react";
import type { Place } from "../../../shared/ops";
import { useApp } from "../../app/context";
import { RecordSheet, type FieldSpec } from "../../ui/records";
import { Modal } from "../../journal/Modal";
import {
  areaOf,
  formatArea,
  formatDistance,
  formatWgs,
  lengthOf,
  mn95Label,
  mn95Text,
} from "./geo";
import { Glyph, SymbolPalette, describeSymbol, useCatalog } from "./symbols";

export const SWATCHES: { value: string; name: string }[] = [
  { value: "", name: "Selon le calque" },
  { value: "#e5243b", name: "Rouge" },
  { value: "#ff8a00", name: "Orange" },
  { value: "#f5c400", name: "Jaune" },
  { value: "#1faa59", name: "Vert" },
  { value: "#1f6fe0", name: "Bleu" },
  { value: "#7b5cff", name: "Violet" },
  { value: "#ff4fb3", name: "Rose" },
  { value: "#1a1a1a", name: "Noir" },
];

function SymbolField({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const list = useCatalog();
  const [picking, setPicking] = useState(false);
  const info = describeSymbol(value, list);
  return (
    <div className="map-field">
      <span className="map-field-label">Signe</span>
      <div className="map-symbol-field">
        <Glyph symbol={value} size={44} />
        <span className="row-main">
          <strong>{info.name}</strong>
          {info.group && <small className="muted">{info.group}</small>}
        </span>
        <button
          type="button"
          className="small"
          onClick={() => setPicking(true)}
        >
          Changer
        </button>
      </div>
      {picking && (
        <Modal title="Choisir un signe" onClose={() => setPicking(false)} wide>
          <SymbolPalette
            value={value}
            onPick={(id) => {
              onChange(id);
              setPicking(false);
            }}
          />
        </Modal>
      )}
    </div>
  );
}

function ColorField({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const hex = /^#[0-9a-f]{6}$/i.test(value) ? value : "#8b7bff";
  return (
    <div className="map-field">
      <span className="map-field-label">Couleur</span>
      <div className="map-swatches" role="group" aria-label="Couleur">
        {SWATCHES.map((s) => (
          <button
            key={s.name}
            type="button"
            className={`map-swatch${s.value ? "" : " auto"}${value === s.value ? " on" : ""}`}
            style={s.value ? { background: s.value } : undefined}
            aria-pressed={value === s.value}
            aria-label={s.name}
            title={s.name}
            onClick={() => onChange(s.value)}
          />
        ))}
        <label className="map-swatch custom" title="Autre couleur">
          <input
            type="color"
            value={hex}
            aria-label="Autre couleur"
            onChange={(e) => onChange(e.target.value)}
          />
        </label>
        <input
          className="map-color-text"
          value={value}
          maxLength={20}
          placeholder="auto"
          aria-label="Couleur (texte libre)"
          onChange={(e) => onChange(e.target.value.trim())}
        />
      </div>
    </div>
  );
}

const KIND_NOUN: Record<Place["kind"], string> = {
  point: "Signe",
  line: "Tracé",
  area: "Zone",
  text: "Texte",
};

/** Sheet of a map object: fields, position, links. */
export function PlaceSheet({
  place,
  onClose,
  onCenter,
  onEditShape,
}: {
  place: Place;
  onClose: () => void;
  onCenter: (place: Place) => void;
  onEditShape: (place: Place) => void;
}) {
  const { toast, readOnly } = useApp();
  const spec: FieldSpec[] = [
    {
      key: "label",
      label: place.kind === "text" ? "Texte affiché" : "Nom",
      kind: "text",
      placeholder:
        place.kind === "text"
          ? "ex. Secteur nord"
          : "ex. Incendie rue du Lac, PC front…",
      wide: true,
    },
    {
      key: "layer",
      label: "Calque",
      kind: "combo",
      list: "layers",
      quick: 6,
      wide: true,
    },
    ...(place.kind === "point"
      ? [
          {
            kind: "custom",
            key: "symbol",
            wide: true,
            render: (v, set) => (
              <SymbolField
                value={String(v.symbol ?? "")}
                onChange={(symbol) => set({ symbol })}
              />
            ),
          } satisfies FieldSpec,
        ]
      : []),
    {
      kind: "custom",
      key: "color",
      wide: true,
      render: (v, set) => (
        <ColorField
          value={String(v.color ?? "")}
          onChange={(color) => set({ color })}
        />
      ),
    },
    { key: "notes", label: "Remarques", kind: "area", rows: 3 },
  ];
  const [lat, lng] = place.points[0];
  const mn95 = mn95Text(lat, lng);
  const copy = (text: string) => {
    navigator.clipboard?.writeText(text).then(
      () => toast("Coordonnées copiées."),
      () => toast("Copie impossible."),
    );
  };
  return (
    <RecordSheet
      collection="places"
      kind="place"
      noun="un objet"
      spec={spec}
      initial={place}
      onClose={onClose}
      titleOf={(v) => String(v.label || "") || KIND_NOUN[place.kind]}
    >
      {() => (
        <section className="map-sheet-geo">
          <span className="label">
            {place.kind === "line" || place.kind === "area"
              ? "Géométrie"
              : "Position"}
          </span>
          {place.kind === "point" || place.kind === "text" ? (
            <dl>
              {mn95 && (
                <>
                  <dt>MN95</dt>
                  <dd className="mono">
                    {mn95Label(lat, lng)}
                    <button
                      type="button"
                      className="icon-button"
                      aria-label="Copier les coordonnées MN95"
                      title="Copier"
                      onClick={() => copy(mn95)}
                    >
                      <Copy size={13} />
                    </button>
                  </dd>
                </>
              )}
              <dt>WGS84</dt>
              <dd className="mono">
                {formatWgs(lat, lng)}
                <button
                  type="button"
                  className="icon-button"
                  aria-label="Copier latitude et longitude"
                  title="Copier"
                  onClick={() => copy(formatWgs(lat, lng))}
                >
                  <Copy size={13} />
                </button>
              </dd>
            </dl>
          ) : (
            <dl>
              <dt>{place.kind === "area" ? "Périmètre" : "Longueur"}</dt>
              <dd className="mono">
                {formatDistance(
                  lengthOf(
                    place.kind === "area"
                      ? [...place.points, place.points[0]]
                      : place.points,
                  ),
                )}
              </dd>
              {place.kind === "area" && (
                <>
                  <dt>Surface</dt>
                  <dd className="mono">{formatArea(areaOf(place.points))}</dd>
                </>
              )}
              <dt>Sommets</dt>
              <dd className="mono">{place.points.length}</dd>
            </dl>
          )}
          <div className="map-sheet-actions">
            <button type="button" onClick={() => onCenter(place)}>
              <Crosshair size={14} />
              Centrer
            </button>
            {(place.kind === "line" || place.kind === "area") && !readOnly && (
              <button type="button" onClick={() => onEditShape(place)}>
                <Spline size={14} />
                Modifier la forme
              </button>
            )}
          </div>
        </section>
      )}
    </RecordSheet>
  );
}
