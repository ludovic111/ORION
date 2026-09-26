import { useEffect, useRef, useState } from "react";
import {
  Copy,
  Crosshair,
  History,
  Layers2,
  RotateCcw,
  RotateCw,
  Spline,
} from "lucide-react";
import { restoreState } from "../../../shared/history";
import { ProfilePanel } from "./ProfilePanel";
import {
  LINE_STYLES,
  upsert,
  type OpsMap,
  type Place,
} from "../../../shared/ops";
import { useApp } from "../../app/context";
import { RecordSheet, type FieldSpec } from "../../ui/records";
import { Segmented, Toggle } from "../../ui/fields";
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
import { hexColor } from "./maps";
import { formatNumber, formatWith } from "../../../shared/i18n/core.ts";
import { t, type Key } from "./i18n-2.ts";

const swatch = (value: string, name: Key) => ({
  value,
  get name() {
    return t(name);
  },
});
/** Colours offered for an object; names in the language of the post. */
export const SWATCHES: { value: string; readonly name: string }[] = [
  swatch("", "Selon le calque"),
  swatch("#e5243b", "Rouge"),
  swatch("#ff8a00", "Orange"),
  swatch("#f5c400", "Jaune"),
  swatch("#1faa59", "Vert"),
  swatch("#1f6fe0", "Bleu"),
  swatch("#7b5cff", "Violet"),
  swatch("#ff4fb3", "Rose"),
  swatch("#1a1a1a", "Noir"),
  swatch("#ffffff", "Blanc"),
];

export const SIZE_PRESETS = [
  { value: 0.7, label: "S" },
  { value: 1, label: "M" },
  { value: 1.5, label: "L" },
  { value: 2.25, label: "XL" },
] as const;
const WEIGHT_PRESETS = [
  { value: 2, label: "Fin" },
  { value: 3, label: "Normal" },
  { value: 6, label: "Épais" },
  { value: 10, label: "Très épais" },
] as const satisfies readonly { value: number; label: Key }[];
const DASH_LABELS: Record<Place["dash"], Key> = {
  solid: "Continu",
  dash: "Tirets",
  dot: "Pointillés",
};

export const clampSize = (n: number) =>
  Math.round(Math.min(8, Math.max(0.25, n)) * 100) / 100;
/** Degrees in ]-180, 180]. */
export const normalizeAngle = (deg: number) => {
  const d = ((((Math.round(deg) + 180) % 360) + 360) % 360) - 180;
  return d === -180 ? 180 : d;
};
const times = (n: number) =>
  `×${formatNumber(n, { maximumFractionDigits: 2 })}`;

export function SymbolField({
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
      <span className="map-field-label">{t("Signe")}</span>
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
          {t("Changer")}
        </button>
      </div>
      {picking && (
        <Modal
          title={t("Choisir un signe")}
          onClose={() => setPicking(false)}
          wide
        >
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

/** "Toutes les cartes" or a selection of maps. */
function MapsField({
  value,
  maps,
  onChange,
}: {
  value: string[];
  maps: OpsMap[];
  onChange: (v: string[]) => void;
}) {
  const known = value.filter((id) => maps.some((m) => m.id === id));
  const all = known.length === 0;
  return (
    <div className="map-field">
      <span className="map-field-label">{t("Cartes")}</span>
      <div
        className="map-chips"
        role="group"
        aria-label={t("Cartes montrant l’objet")}
      >
        <button
          type="button"
          className={`map-chip${all ? " on" : ""}`}
          aria-pressed={all}
          onClick={() => onChange([])}
        >
          <Layers2 size={13} />
          {t("Toutes les cartes")}
        </button>
        {maps.map((m) => {
          const on = known.includes(m.id);
          return (
            <button
              key={m.id}
              type="button"
              className={`map-chip${on ? " on" : ""}`}
              aria-pressed={on}
              title={m.purpose || m.name}
              onClick={() =>
                onChange(
                  on ? known.filter((id) => id !== m.id) : [...known, m.id],
                )
              }
            >
              {m.name}
            </button>
          );
        })}
      </div>
      <small className="muted">
        {all
          ? t("Visible sur chaque carte de l’opération.")
          : t("Visible seulement sur les cartes choisies.")}
      </small>
    </div>
  );
}

export function ColorField({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const hex = hexColor(value) || "#8b7bff";
  // Free text is only applied once it reads as a colour (#rgb, #rrggbb or
  // a name such as « rouge »); anything else is dropped on leaving.
  const [text, setText] = useState(value);
  useEffect(() => setText(value), [value]);
  return (
    <div className="map-field">
      <span className="map-field-label">{t("Couleur")}</span>
      <div className="map-swatches" role="group" aria-label={t("Couleur")}>
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
        <label className="map-swatch custom" title={t("Autre couleur")}>
          <input
            type="color"
            value={hex}
            aria-label={t("Autre couleur")}
            onChange={(e) => onChange(hexColor(e.target.value))}
          />
        </label>
        <input
          className="map-color-text"
          value={text}
          maxLength={20}
          placeholder="auto"
          aria-label={t("Couleur : #rrggbb ou un nom (rouge, bleu…)")}
          title={t("#rrggbb ou un nom : rouge, bleu, vert…")}
          onChange={(e) => {
            const typed = e.target.value;
            setText(typed);
            const c = hexColor(typed);
            if (c || !typed.trim()) onChange(c);
          }}
          onBlur={() => setText(value)}
        />
      </div>
    </div>
  );
}

type Style = Pick<
  Place,
  "color" | "size" | "rotation" | "frame" | "boxed" | "weight" | "dash"
>;
const STYLE_KEYS = [
  "color",
  "size",
  "rotation",
  "frame",
  "boxed",
  "weight",
  "dash",
  "points",
] as const;

/**
 * Keeps the form of the sheet in step with changes applied directly to the
 * object (appearance, handles on the map, position dragged): saving the
 * form never brings back an older size or position.
 */
function LiveSync({
  place,
  value,
  set,
}: {
  place: Place;
  value: Record<string, unknown>;
  set: (patch: Record<string, unknown>) => void;
}) {
  useEffect(() => {
    const patch: Record<string, unknown> = {};
    for (const k of STYLE_KEYS)
      if (JSON.stringify(value[k]) !== JSON.stringify(place[k]))
        patch[k] = place[k];
    if (Object.keys(patch).length) set(patch);
    // Only when the object itself changes.
  }, [place.updatedAt]);
  return null;
}

/** Appearance of the object, applied at once (visible on the map). */
function Appearance({ place }: { place: Place }) {
  const { updateOps, author, toast, readOnly } = useApp();
  const [draft, setDraft] = useState<Partial<Style>>({});
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const pending = useRef<Partial<Style>>({});
  const latest = useRef(place);
  latest.current = place;
  const v: Style = { ...place, ...draft };

  const commit = () => {
    clearTimeout(timer.current);
    const patch = pending.current;
    pending.current = {};
    if (patch.color !== undefined) patch.color = hexColor(patch.color);
    if (!Object.keys(patch).length) return;
    try {
      const id = latest.current.id;
      updateOps((ops) =>
        // Deleted meanwhile: do not bring it back.
        ops.places.some((p) => p.id === id)
          ? upsert(ops, "places", { ...latest.current, ...patch }, author)
          : ops,
      );
    } catch (err) {
      toast((err as Error).message);
    }
    setDraft({});
  };
  const set = (patch: Partial<Style>, now = true) => {
    pending.current = { ...pending.current, ...patch };
    setDraft((d) => ({ ...d, ...patch }));
    clearTimeout(timer.current);
    timer.current = setTimeout(commit, now ? 0 : 220);
  };
  // Leaving the sheet: nothing is lost.
  useEffect(() => () => commit(), []);

  const symbolic = place.kind === "point" || place.kind === "text";
  const sizeRange = (
    <div className="map-style-row">
      <span className="map-field-label">{t("Taille")}</span>
      <div className="map-style-controls">
        <div
          className="seg map-seg"
          role="group"
          aria-label={t("Taille standard")}
        >
          {SIZE_PRESETS.map((s) => (
            <button
              key={s.label}
              type="button"
              aria-pressed={Math.abs(v.size - s.value) < 0.01}
              title={t("Taille {size} ({factor})", {
                size: s.label,
                factor: times(s.value),
              })}
              onClick={() => set({ size: s.value })}
            >
              {s.label}
            </button>
          ))}
        </div>
        <input
          type="range"
          min={0.25}
          max={6}
          step={0.05}
          value={v.size}
          aria-label={t("Taille")}
          onChange={(e) =>
            set({ size: clampSize(Number(e.target.value)) }, false)
          }
          onPointerUp={commit}
        />
        <output className="mono">{times(v.size)}</output>
      </div>
    </div>
  );
  const rotation = (
    <div className="map-style-row">
      <span className="map-field-label">{t("Rotation")}</span>
      <div className="map-style-controls">
        <button
          type="button"
          className="icon-button"
          aria-label={t("Tourner de 15° à gauche")}
          title={t("15° à gauche")}
          onClick={() => set({ rotation: normalizeAngle(v.rotation - 15) })}
        >
          <RotateCcw size={15} />
        </button>
        <input
          type="range"
          min={-180}
          max={180}
          step={1}
          value={v.rotation}
          aria-label={t("Rotation en degrés")}
          onChange={(e) =>
            set({ rotation: normalizeAngle(Number(e.target.value)) }, false)
          }
          onPointerUp={commit}
        />
        <button
          type="button"
          className="icon-button"
          aria-label={t("Tourner de 15° à droite")}
          title={t("15° à droite")}
          onClick={() => set({ rotation: normalizeAngle(v.rotation + 15) })}
        >
          <RotateCw size={15} />
        </button>
        <button
          type="button"
          className="map-angle mono"
          title={t("Remettre droit")}
          aria-label={t("Rotation {deg}° : remettre droit", {
            deg: v.rotation,
          })}
          onClick={() => set({ rotation: 0 })}
        >
          {v.rotation}°
        </button>
      </div>
    </div>
  );

  return (
    <section className="map-sheet-style" aria-label={t("Apparence")}>
      <header>
        <span className="label">{t("Apparence")}</span>
        <small className="muted">{t("appliquée tout de suite")}</small>
      </header>
      <fieldset disabled={readOnly}>
        <ColorField
          value={v.color}
          onChange={(color) => set({ color }, false)}
        />
        {symbolic && sizeRange}
        {symbolic && rotation}
        {place.kind === "point" && (
          <Toggle
            label={t("Signe dans une pastille")}
            hint={t("Sinon, le signe seul sur fond transparent.")}
            checked={v.frame}
            onChange={(frame) => set({ frame })}
          />
        )}
        {place.kind === "text" && (
          <Toggle
            label={t("Étiquette avec fond")}
            hint={t("Sinon, le texte seul avec un halo.")}
            checked={v.boxed}
            onChange={(boxed) => set({ boxed })}
          />
        )}
        {!symbolic && (
          <>
            <div className="map-style-row">
              <span className="map-field-label">{t("Épaisseur")}</span>
              <div className="map-style-controls">
                <div
                  className="seg map-seg"
                  role="group"
                  aria-label={t("Épaisseur standard")}
                >
                  {WEIGHT_PRESETS.map((w) => (
                    <button
                      key={w.value}
                      type="button"
                      aria-pressed={v.weight === w.value}
                      onClick={() => set({ weight: w.value })}
                    >
                      {t(w.label)}
                    </button>
                  ))}
                </div>
                <input
                  type="range"
                  min={1}
                  max={24}
                  step={1}
                  value={v.weight}
                  aria-label={t("Épaisseur du trait")}
                  onChange={(e) =>
                    set({ weight: Number(e.target.value) }, false)
                  }
                  onPointerUp={commit}
                />
                <output className="mono">{v.weight} px</output>
              </div>
            </div>
            <div className="map-style-row">
              <span className="map-field-label">{t("Trait")}</span>
              <Segmented
                label={t("Style du trait")}
                value={v.dash}
                onChange={(dash) => set({ dash })}
                options={LINE_STYLES.map((d) => ({
                  value: d,
                  label: (
                    <>
                      <svg
                        width="26"
                        height="8"
                        viewBox="0 0 26 8"
                        aria-hidden="true"
                      >
                        <line
                          x1="2"
                          y1="4"
                          x2="24"
                          y2="4"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeDasharray={
                            d === "dash"
                              ? "6 4"
                              : d === "dot"
                                ? "0.1 5"
                                : undefined
                          }
                        />
                      </svg>
                      {t(DASH_LABELS[d])}
                    </>
                  ),
                }))}
              />
            </div>
          </>
        )}
      </fieldset>
    </section>
  );
}

/**
 * Time machine: bring this object, as it was at the moment shown, back
 * into the live journal (a new, signed change; the current state stays in
 * the history).
 */
function RestorePast({ place, viewAt }: { place: Place; viewAt: number }) {
  const { live, author, updateJournal, toast } = useApp();
  const now = live.ops.places.find((p) => p.id === place.id);
  const same =
    !!now &&
    JSON.stringify({ ...now, updatedAt: "" }) ===
      JSON.stringify({ ...place, updatedAt: "" });
  const when = formatWith(viewAt, {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  function restore() {
    if (
      !window.confirm(
        now
          ? t(
              "Remettre cet objet dans son état du {when} ? L’état actuel reste dans l’historique.",
              { when },
            )
          : t(
              "Cet objet a été supprimé depuis. Le remettre sur la carte tel qu’il était le {when} ?",
              { when },
            ),
      )
    )
      return;
    try {
      updateJournal(
        restoreState(
          live,
          {
            scope: "ops.places",
            target: place.id,
            state: place,
            at: new Date(viewAt).toISOString(),
          },
          author,
        ),
      );
      toast(t("Objet restauré dans le journal actuel."));
    } catch (err) {
      toast((err as Error).message);
    }
  }
  return (
    <section className="map-sheet-restore" aria-label={t("Restaurer")}>
      <span className="label">{t("Machine à remonter le temps")}</span>
      <p className="muted">
        {same
          ? t("L’objet est aujourd’hui dans le même état.")
          : now
            ? t("L’objet a changé depuis ce moment.")
            : t("L’objet n’existe plus aujourd’hui.")}
      </p>
      <button
        type="button"
        disabled={same || !!live.closedAt}
        title={live.closedAt ? t("Journal clôturé") : undefined}
        onClick={restore}
      >
        <History size={14} />
        {t("Restaurer cet objet")}
      </button>
    </section>
  );
}

const KIND_NOUN: Record<Place["kind"], Key> = {
  point: "Signe",
  line: "Tracé",
  area: "Zone",
  text: "Texte",
};

/** Sheet of a map object: fields, appearance, position, links. */
export function PlaceSheet({
  place,
  maps,
  onClose,
  onCenter,
  onEditShape,
}: {
  place: Place;
  /** Maps of the operation (none: one implicit map). */
  maps: OpsMap[];
  onClose: () => void;
  onCenter: (place: Place) => void;
  onEditShape: (place: Place) => void;
}) {
  const { toast, readOnly, viewAt } = useApp();
  const spec: FieldSpec[] = [
    {
      key: "label",
      label: place.kind === "text" ? t("Texte affiché") : t("Nom"),
      kind: place.kind === "text" ? "area" : "text",
      rows: 2,
      max: 200,
      placeholder:
        place.kind === "text"
          ? t("ex. Secteur nord")
          : t("ex. Incendie rue du Lac, PC front…"),
      wide: true,
    } as FieldSpec,
    {
      key: "layer",
      label: t("Calque"),
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
    ...(maps.length > 1 || place.maps.length
      ? [
          {
            kind: "custom",
            key: "maps",
            wide: true,
            render: (v, set) => (
              <MapsField
                value={(v.maps as string[]) ?? []}
                maps={maps}
                onChange={(next) => set({ maps: next })}
              />
            ),
          } satisfies FieldSpec,
        ]
      : []),
    { key: "notes", label: t("Remarques"), kind: "area", rows: 3 },
    {
      kind: "custom",
      key: "live",
      wide: true,
      render: (v, set) => <LiveSync place={place} value={v} set={set} />,
    },
  ];
  const [lat, lng] = place.points[0];
  const mn95 = mn95Text(lat, lng);
  const copy = (text: string) => {
    navigator.clipboard?.writeText(text).then(
      () => toast(t("Coordonnées copiées.")),
      () => toast(t("Copie impossible.")),
    );
  };
  return (
    <RecordSheet
      collection="places"
      kind="place"
      noun={t("un objet")}
      spec={spec}
      initial={place}
      onClose={onClose}
      titleOf={(v) => String(v.label || "") || t(KIND_NOUN[place.kind])}
    >
      {() => (
        <>
          <Appearance place={place} />
          <section className="map-sheet-geo">
            <span className="label">
              {place.kind === "line" || place.kind === "area"
                ? t("Géométrie")
                : t("Position")}
            </span>
            {place.kind === "point" || place.kind === "text" ? (
              <dl>
                {mn95 && (
                  <>
                    <dt>{t("MN95")}</dt>
                    <dd className="mono">
                      {mn95Label(lat, lng)}
                      <button
                        type="button"
                        className="icon-button"
                        aria-label={t("Copier les coordonnées MN95")}
                        title={t("Copier")}
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
                    aria-label={t("Copier latitude et longitude")}
                    title={t("Copier")}
                    onClick={() => copy(formatWgs(lat, lng))}
                  >
                    <Copy size={13} />
                  </button>
                </dd>
              </dl>
            ) : (
              <dl>
                <dt>
                  {place.kind === "area" ? t("Périmètre") : t("Longueur")}
                </dt>
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
                    <dt>{t("Surface")}</dt>
                    <dd className="mono">
                      {formatArea(areaOf(place.points, place.holes))}
                    </dd>
                  </>
                )}
                {!!place.holes?.length && (
                  <>
                    <dt>{t("Trous")}</dt>
                    <dd className="mono">{place.holes.length}</dd>
                  </>
                )}
                <dt>{t("Sommets")}</dt>
                <dd className="mono">{place.points.length}</dd>
              </dl>
            )}
            <div className="map-sheet-actions">
              <button type="button" onClick={() => onCenter(place)}>
                <Crosshair size={14} />
                {t("Centrer")}
              </button>
              {(place.kind === "line" || place.kind === "area") &&
                !readOnly && (
                  <button type="button" onClick={() => onEditShape(place)}>
                    <Spline size={14} />
                    {t("Modifier la forme")}
                  </button>
                )}
            </div>
          </section>
          {place.kind === "line" && <ProfilePanel points={place.points} />}
          {viewAt !== null && <RestorePast place={place} viewAt={viewAt} />}
        </>
      )}
    </RecordSheet>
  );
}
