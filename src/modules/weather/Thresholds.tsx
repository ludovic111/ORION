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
} from "../../../shared/thresholds";
import { useApp } from "../../app/context";
import { type FieldSpec } from "../../ui/records";
import { SettingSheet } from "../../ui/SettingSheet";
import { ChoiceField, Toggle } from "../../ui/fields";
import { ALERT_LABELS, ALERT_LEVELS } from "../../../shared/ops";
import { enumLabel } from "../../../shared/i18n/enums.ts";
import { useLang } from "../../i18n";
import { t, tn } from "./i18n.ts";
import "../../ui/conduct.css";

/** Name of a measured quantity in the language of the post. */
const metricLabel = (m: ThresholdMetric) =>
  ({
    gusts: () => t("Rafales"),
    wind: () => t("Vent moyen"),
    rain1h: () => t("Pluie en 1 h"),
    rain24h: () => t("Pluie en 24 h"),
    tmax: () => t("Température maximale"),
    tmin: () => t("Température minimale"),
  })[m]?.() ?? METRICS[m].label;

/** "Rafales ≥ 60 km/h", in the language of the post. */
const thresholdLabel = (th: Pick<Threshold, "metric" | "value">) =>
  `${metricLabel(th.metric)} ${METRICS[th.metric].above ? "≥" : "≤"} ${th.value} ${METRICS[th.metric].unit}`;

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

const spec = (): FieldSpec[] => [
  {
    kind: "custom",
    key: "metric",
    wide: true,
    render: (value, set) => (
      <ChoiceField<ThresholdMetric>
        label={t("Grandeur")}
        value={(value.metric as ThresholdMetric) ?? "gusts"}
        onChange={(metric) => set({ metric })}
        options={THRESHOLD_METRICS.map((m) => ({
          value: m,
          label: METRICS[m].above
            ? t("{label} ({unit}, au-dessus)", {
                label: metricLabel(m),
                unit: METRICS[m].unit,
              })
            : t("{label} ({unit}, au-dessous)", {
                label: metricLabel(m),
                unit: METRICS[m].unit,
              }),
        }))}
      />
    ),
  },
  {
    kind: "custom",
    key: "value",
    render: (value, set) => (
      <label>
        <span>{t("Seuil")}</span>
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
        label={t("Degré de l’alerte créée")}
        value={String(value.level ?? "3")}
        onChange={(level) => set({ level })}
        options={ALERT_LEVELS.map((l) => ({
          value: l,
          label: enumLabel(ALERT_LABELS[l]),
        }))}
      />
    ),
  },
  {
    key: "label",
    label: t("Nom de l’alerte (facultatif)"),
    kind: "text",
    wide: true,
    max: 120,
    placeholder: t("ex. Vent fort sur les chantiers"),
  },
  { key: "region", label: t("Région"), kind: "text", wide: true, max: 200 },
  { key: "active", label: t("Actif"), kind: "toggle" },
  {
    key: "followUp",
    label: t("Créer aussi une entrée « à traiter » au journal"),
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
  useLang();
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
    <section className="card w-12" aria-label={t("Seuils météo")}>
      <div className="card-head">
        <Gauge size={15} />
        <h2>{t("Seuils météo")}</h2>
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
                      toast(t("Aucun nouveau seuil franchi."));
                      return;
                    }
                    if (
                      changeJournal(
                        (j) => applyThresholds(j, forecast, author).journal,
                      )
                    )
                      toast(
                        tn(
                          created.length,
                          "{n} alerte créée.",
                          "{n} alertes créées.",
                        ),
                      );
                  } catch (err) {
                    toast((err as Error).message);
                  }
                }}
              >
                {t("Évaluer maintenant")}
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
              {t("Seuil")}
            </button>
          </span>
        )}
      </div>
      <p className="muted" style={{ fontSize: 13, margin: "0 0 8px" }}>
        {t(
          "À chaque prévision reçue, un seuil franchi crée une alerte (une par jour et par seuil, même si plusieurs postes la voient) et, si demandé, une entrée à traiter. Le niveau des cours d’eau n’est pas dans la prévision : saisissez les alertes crue à la main.",
        )}
      </p>
      {list.map((th) => {
        const c = next.get(th.id);
        return (
          <div key={th.id} className={`th-row ${th.active ? "" : "off"}`}>
            <button
              className="row-main"
              style={{
                textAlign: "left",
                border: 0,
                background: "none",
                padding: 0,
                height: "auto",
              }}
              onClick={() => setEditing(th)}
            >
              <strong>{th.label || thresholdLabel(th)}</strong>
              <small>
                {[
                  th.label && thresholdLabel(th),
                  t("degré {level}", { level: th.level }),
                  th.followUp && t("entrée à traiter"),
                  !forecast
                    ? t("pas encore de prévision")
                    : c
                      ? t("franchi le {day} dès {time} (pic {peak} {unit})", {
                          day: c.day.split("-").reverse().join("."),
                          time: time(new Date(c.first).toISOString()),
                          peak: Math.round(c.peak * 10) / 10,
                          unit: METRICS[th.metric].unit,
                        })
                      : t("pas franchi dans la prévision"),
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </small>
            </button>
            {c && th.active && (
              <span className="pill warn">{t("Franchi")}</span>
            )}
            {!readOnly && (
              <Toggle
                label={<span className="sr-only">{t("Actif")}</span>}
                checked={th.active}
                onChange={(active) => {
                  if (!canWrite()) return;
                  updateOps((o) =>
                    upsert(o, "thresholds", { ...th, active }, author),
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
              toast(t("Seuils standards ajoutés : ajustez-les à la région."));
            } catch (err) {
              toast((err as Error).message);
            }
          }}
        >
          <Gauge size={14} />
          {t("Ajouter des seuils standards")}
        </button>
      )}
      {editing && (
        <SettingSheet
          collection="thresholds"
          eyebrow={
            <>
              <Gauge size={12} />
              {t("Seuil météo")}
            </>
          }
          title={editing.id ? thresholdLabel(editing) : t("Nouveau seuil")}
          spec={spec()}
          initial={editing as Record<string, unknown>}
          onClose={() => setEditing(null)}
        />
      )}
    </section>
  );
}
