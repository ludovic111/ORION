import { useMemo, useState } from "react";
import { Gauge, Plus } from "lucide-react";
import { time } from "../../../shared/journal";
import { upsert } from "../../../shared/ops";
import {
  THRESHOLD_METRICS,
  type Threshold,
  type ThresholdMetric,
} from "../../../shared/conduct-schemas";
import {
  METRICS,
  applyThresholds,
  crossings,
  latestForecast,
  thresholdLabel,
} from "../../../shared/thresholds";
import { useApp } from "../../app/context";
import { type FieldSpec } from "../../ui/records";
import { SettingSheet } from "../../ui/SettingSheet";
import { ChoiceField, Toggle } from "../../ui/fields";
import { ALERT_LABELS, ALERT_LEVELS } from "../../../shared/ops";
import "../../ui/conduct.css";

type Draft = Omit<Threshold, "id" | "createdAt" | "updatedAt" | "by"> &
  Partial<Pick<Threshold, "id" | "createdAt" | "updatedAt" | "by">>;

const STANDARD: Draft[] = [
  {
    metric: "gusts",
    value: 60,
    level: "2",
    label: "",
    region: "",
    active: true,
    followUp: false,
  },
  {
    metric: "gusts",
    value: 90,
    level: "3",
    label: "",
    region: "",
    active: true,
    followUp: true,
  },
  {
    metric: "rain1h",
    value: 15,
    level: "3",
    label: "",
    region: "",
    active: true,
    followUp: true,
  },
  {
    metric: "rain24h",
    value: 50,
    level: "3",
    label: "",
    region: "",
    active: true,
    followUp: true,
  },
  {
    metric: "tmax",
    value: 33,
    level: "3",
    label: "",
    region: "",
    active: true,
    followUp: false,
  },
  {
    metric: "tmin",
    value: -10,
    level: "2",
    label: "",
    region: "",
    active: true,
    followUp: false,
  },
];

const SPEC: FieldSpec[] = [
  {
    kind: "custom",
    key: "metric",
    wide: true,
    render: (value, set) => (
      <ChoiceField<ThresholdMetric>
        label="Grandeur"
        value={(value.metric as ThresholdMetric) ?? "gusts"}
        onChange={(metric) => set({ metric })}
        options={THRESHOLD_METRICS.map((m) => ({
          value: m,
          label: `${METRICS[m].label} (${METRICS[m].unit}, ${METRICS[m].above ? "au-dessus" : "au-dessous"})`,
        }))}
      />
    ),
  },
  {
    kind: "custom",
    key: "value",
    render: (value, set) => (
      <label>
        <span>Seuil</span>
        <input
          type="number"
          inputMode="decimal"
          step="any"
          value={String(value.value ?? 0)}
          onChange={(e) => {
            const v = Number(e.target.value);
            set({
              value: Number.isFinite(v) ? Math.max(-60, Math.min(1000, v)) : 0,
            });
          }}
        />
      </label>
    ),
  },
  {
    kind: "custom",
    key: "level",
    render: (value, set) => (
      <ChoiceField
        label="Degré de l’alerte créée"
        value={String(value.level ?? "3")}
        onChange={(level) => set({ level })}
        options={ALERT_LEVELS.map((l) => ({
          value: l,
          label: ALERT_LABELS[l],
        }))}
      />
    ),
  },
  {
    key: "label",
    label: "Nom de l’alerte (facultatif)",
    kind: "text",
    wide: true,
    max: 120,
    placeholder: "ex. Vent fort sur les chantiers",
  },
  { key: "region", label: "Région", kind: "text", wide: true, max: 200 },
  { key: "active", label: "Actif", kind: "toggle" },
  {
    key: "followUp",
    label: "Créer aussi une entrée « à traiter » au journal",
    kind: "toggle",
    wide: true,
  },
];

/** Weather thresholds of the journal, evaluated on each forecast received. */
export function ThresholdsCard() {
  const {
    journal,
    now,
    readOnly,
    canWrite,
    updateOps,
    changeJournal,
    author,
    toast,
  } = useApp();
  const [editing, setEditing] = useState<Draft | null>(null);
  const list = journal.ops.thresholds;
  const forecast = latestForecast(journal.ops);
  const next = useMemo(
    () =>
      new Map(
        list.map((t) => [
          t.id,
          forecast ? crossings(t, forecast.data, now)[0] : undefined,
        ]),
      ),
    [list, forecast, now],
  );
  return (
    <section className="card w-12" aria-label="Seuils météo">
      <div className="card-head">
        <Gauge size={15} />
        <h2>Seuils météo</h2>
        {!readOnly && (
          <span className="cd-toolbar" style={{ margin: 0 }}>
            {forecast && list.some((t) => t.active) && (
              <button
                className="small"
                onClick={() => {
                  try {
                    const { created } = applyThresholds(
                      journal,
                      forecast,
                      author,
                    );
                    if (!created.length) {
                      toast("Aucun nouveau seuil franchi.");
                      return;
                    }
                    if (
                      changeJournal(
                        (j) => applyThresholds(j, forecast, author).journal,
                      )
                    )
                      toast(`${created.length} alerte(s) créée(s).`);
                  } catch (err) {
                    toast((err as Error).message);
                  }
                }}
              >
                Évaluer maintenant
              </button>
            )}
            <button
              className="small"
              onClick={() =>
                setEditing({
                  metric: "gusts",
                  value: 60,
                  level: "3",
                  label: "",
                  region: "",
                  active: true,
                  followUp: true,
                })
              }
            >
              <Plus size={13} />
              Seuil
            </button>
          </span>
        )}
      </div>
      <p className="muted" style={{ fontSize: 13, margin: "0 0 8px" }}>
        À chaque prévision reçue, un seuil franchi crée une alerte (une par jour
        et par seuil, même si plusieurs postes la voient) et, si demandé, une
        entrée à traiter. Le niveau des cours d’eau n’est pas dans la prévision
        : saisissez les alertes crue à la main.
      </p>
      {list.map((t) => {
        const c = next.get(t.id);
        return (
          <div key={t.id} className={`th-row ${t.active ? "" : "off"}`}>
            <button
              className="row-main"
              style={{
                textAlign: "left",
                border: 0,
                background: "none",
                padding: 0,
                height: "auto",
              }}
              onClick={() => setEditing(t)}
            >
              <strong>{t.label || thresholdLabel(t)}</strong>
              <small>
                {[
                  t.label && thresholdLabel(t),
                  `degré ${t.level}`,
                  t.followUp && "entrée à traiter",
                  !forecast
                    ? "pas encore de prévision"
                    : c
                      ? `franchi le ${c.day.split("-").reverse().join(".")} dès ${time(new Date(c.first).toISOString())} (pic ${Math.round(c.peak * 10) / 10} ${METRICS[t.metric].unit})`
                      : "pas franchi dans la prévision",
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </small>
            </button>
            {c && t.active && <span className="pill warn">Franchi</span>}
            {!readOnly && (
              <Toggle
                label={<span className="sr-only">Actif</span>}
                checked={t.active}
                onChange={(active) => {
                  if (!canWrite()) return;
                  updateOps((o) =>
                    upsert(o, "thresholds", { ...t, active }, author),
                  );
                }}
              />
            )}
          </div>
        );
      })}
      {!list.length && !readOnly && (
        <button
          onClick={() => {
            if (!canWrite()) return;
            try {
              updateOps((o) =>
                STANDARD.reduce(
                  (acc, t) => upsert(acc, "thresholds", t, author),
                  o,
                ),
              );
              toast("Seuils standards ajoutés : ajustez-les à la région.");
            } catch (err) {
              toast((err as Error).message);
            }
          }}
        >
          <Gauge size={14} />
          Ajouter des seuils standards
        </button>
      )}
      {editing && (
        <SettingSheet
          collection="thresholds"
          eyebrow={
            <>
              <Gauge size={12} />
              Seuil météo
            </>
          }
          title={editing.id ? thresholdLabel(editing) : "Nouveau seuil"}
          spec={SPEC}
          initial={editing as Record<string, unknown>}
          onClose={() => setEditing(null)}
        />
      )}
    </section>
  );
}
