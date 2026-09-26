import {
  addEntry,
  emptyFields,
  journalSchema,
  time,
  type Journal,
} from "./journal.ts";
import {
  upsert,
  type ForecastData,
  type ForecastRecord,
  type Ops,
} from "./ops.ts";
import { stableId } from "./history.ts";
import { zurichDate } from "./time.ts";
import type { Threshold, ThresholdMetric } from "./conduct-schemas.ts";
import { t } from "./i18n/thresholds.ts";

export { THRESHOLD_METRICS } from "./conduct-schemas.ts";

// Weather thresholds of the journal, evaluated on the forecasts received
// (Open-Meteo, already used by the weather module). A threshold crossed on a
// day creates one weather alert, and optionally an entry "à suivre", once
// per threshold and Zurich day: their ids derive from the threshold and the
// day, so two posts evaluating the same forecast create the same records,
// which merge into one. A record removed by an operator is not recreated.
// Labels and the texts written are in the language of the post.

export const METRICS: Record<
  ThresholdMetric,
  { label: string; unit: string; above: boolean; hazard: string }
> = {
  gusts: {
    get label() {
      return t("Rafales");
    },
    unit: "km/h",
    above: true,
    get hazard() {
      return t("Vent");
    },
  },
  wind: {
    get label() {
      return t("Vent moyen");
    },
    unit: "km/h",
    above: true,
    get hazard() {
      return t("Vent");
    },
  },
  rain1h: {
    get label() {
      return t("Pluie en 1 h");
    },
    unit: "mm",
    above: true,
    get hazard() {
      return t("Fortes précipitations");
    },
  },
  rain24h: {
    get label() {
      return t("Pluie en 24 h");
    },
    unit: "mm",
    above: true,
    get hazard() {
      return t("Fortes précipitations");
    },
  },
  tmax: {
    get label() {
      return t("Température maximale");
    },
    unit: "°C",
    above: true,
    get hazard() {
      return t("Canicule");
    },
  },
  tmin: {
    get label() {
      return t("Température minimale");
    },
    unit: "°C",
    above: false,
    get hazard() {
      return t("Gel / froid");
    },
  },
};

export const thresholdLabel = (th: Pick<Threshold, "metric" | "value">) =>
  `${METRICS[th.metric].label} ${METRICS[th.metric].above ? "≥" : "≤"} ${th.value} ${METRICS[th.metric].unit}`;

export type Crossing = {
  /** Zurich day, "YYYY-MM-DD". */
  day: string;
  /** First and last hour (ms) of the crossing that day. */
  first: number;
  last: number;
  peak: number;
  peakAt: number;
};

const HOUR = 3_600_000;

/** Hourly series of a metric (rain over 24 h is a running sum). */
function series(
  metric: ThresholdMetric,
  data: ForecastData,
): { at: number; value: number }[] {
  const hours = [...data.hours].sort((a, b) => a.at - b.at);
  if (metric === "rain24h")
    return hours.map((h) => ({
      at: h.at,
      value: hours
        .filter((x) => x.at > h.at - 24 * HOUR && x.at <= h.at)
        .reduce((n, x) => n + (x.precipitation ?? 0), 0),
    }));
  const pick = (h: (typeof hours)[number]) =>
    metric === "gusts"
      ? h.gusts
      : metric === "wind"
        ? h.wind
        : metric === "rain1h"
          ? h.precipitation
          : h.temperature;
  return hours
    .map((h) => ({ at: h.at, value: pick(h) }))
    .filter((x): x is { at: number; value: number } => x.value !== null);
}

/** Hours of forecast looked at: the next two days. */
export const HORIZON_HOURS = 48;

/**
 * Days on which a threshold is crossed, from `from` on over the next
 * HORIZON_HOURS (hours already past are ignored).
 */
export function crossings(
  threshold: Pick<Threshold, "metric" | "value">,
  data: ForecastData,
  from: number,
  horizon = HORIZON_HOURS,
): Crossing[] {
  const { above } = METRICS[threshold.metric];
  const out = new Map<string, Crossing>();
  for (const { at, value } of series(threshold.metric, data)) {
    if (at < from - HOUR + 1 || at > from + horizon * HOUR) continue;
    const crossed = above ? value >= threshold.value : value <= threshold.value;
    if (!crossed) continue;
    const day = zurichDate(at);
    const known = out.get(day);
    if (!known)
      out.set(day, { day, first: at, last: at, peak: value, peakAt: at });
    else {
      known.last = Math.max(known.last, at);
      known.first = Math.min(known.first, at);
      if (above ? value > known.peak : value < known.peak) {
        known.peak = value;
        known.peakAt = at;
      }
    }
  }
  return [...out.values()].sort((a, b) => a.first - b.first);
}

/** Deduplication key of the alert of a threshold on a day. */
export const alertKey = (thresholdId: string, day: string) =>
  `seuil|${thresholdId}|${day}`;
export const alertIdFor = (thresholdId: string, day: string) =>
  stableId(alertKey(thresholdId, day));
export const entryIdFor = (thresholdId: string, day: string) =>
  stableId(`seuil-entree|${thresholdId}|${day}`);
const linkIdFor = (thresholdId: string, day: string) =>
  stableId(`seuil-lien|${thresholdId}|${day}`);

/** The latest forecast received for the weather place of the journal. */
export function latestForecast(
  ops: Pick<Ops, "forecasts" | "settings">,
): ForecastRecord | undefined {
  const place = ops.settings.weatherPlace?.name;
  return [...ops.forecasts]
    .filter((f) => !place || f.place === place)
    .sort((a, b) => b.fetchedAt.localeCompare(a.fetchedAt))[0];
}

const round = (v: number) => Math.round(v * 10) / 10;
const dayLabel = (day: string) => {
  const [y, m, d] = day.split("-");
  return `${d}.${m}.${y}`;
};

export type Created = {
  threshold: Threshold;
  crossing: Crossing;
  entry: boolean;
};

/**
 * Alerts (and entries "à suivre") for the thresholds crossed by a forecast.
 * Returns the journal unchanged when there is nothing new.
 */
export function applyThresholds(
  journal: Journal,
  forecast: ForecastRecord,
  author: string,
  at = Date.now(),
): { journal: Journal; created: Created[] } {
  const created: Created[] = [];
  let next = journal;
  const removed = journal.sync.removed;
  const deleted = new Set(journal.deleted.map((d) => d.id));
  for (const th of journal.ops.thresholds) {
    if (!th.active) continue;
    const info = METRICS[th.metric];
    for (const c of crossings(th, forecast.data, at)) {
      const alertId = alertIdFor(th.id, c.day);
      if (removed[alertId] || next.ops.alerts.some((a) => a.id === alertId))
        continue;
      const period = t("le {day} de {from} à {to}", {
        day: dayLabel(c.day),
        from: time(new Date(c.first).toISOString()),
        to: time(new Date(c.last + HOUR).toISOString()),
      });
      const peak = t("{value} {unit} à {time}", {
        value: round(c.peak),
        unit: info.unit,
        time: time(new Date(c.peakAt).toISOString()),
      });
      const label = thresholdLabel(th);
      let ops = upsert(
        next.ops,
        "alerts",
        {
          id: alertId,
          level: th.level,
          hazard: (
            th.label || t("{hazard} : {label}", { hazard: info.hazard, label })
          ).slice(0, 120),
          region: (th.region || forecast.place).slice(0, 200),
          from: new Date(c.first).toISOString(),
          to: new Date(c.last + HOUR).toISOString(),
          source: t("Seuil du journal · prévision {model}", {
            model: forecast.data.model,
          }).slice(0, 200),
          notes: t(
            "{label} prévu {period}. Pic : {peak}. Prévision reçue à {time}.",
            { label, period, peak, time: time(forecast.fetchedAt) },
          ),
        },
        author,
      );
      next = { ...next, ops };
      const entryId = entryIdFor(th.id, c.day);
      const writes =
        th.followUp &&
        !deleted.has(entryId) &&
        !next.entries.some((e) => e.id === entryId);
      if (writes) {
        const onset = Math.max(c.first, at + 30 * 60_000);
        const added = addEntry(
          next,
          {
            ...emptyFields(),
            happenedAt: new Date(at).toISOString(),
            receivedAt: new Date(at).toISOString(),
            type: "Renseignement",
            priority: Number(th.level) >= 4 ? "Important" : "Normal",
            status: "À traiter",
            channel: "Autre",
            reliability: "Non confirmé",
            source: t("Prévision {model}", { model: forecast.data.model }),
            message: t(
              "Seuil météo franchi : {label} prévu {period} (pic {peak}).",
              { label, period, peak },
            ),
            action: t("Suivre l’évolution et décider des mesures."),
            location: th.region || forecast.place,
            dueAt: new Date(onset).toISOString(),
            // Tags stay French: shared by every post, like a code.
            tags: ["météo", "seuil"],
          },
          author,
        );
        const entries = added.entries.map((e, i, all) =>
          i === all.length - 1 ? { ...e, id: entryId } : e,
        );
        ops = upsert(
          added.ops,
          "links",
          {
            id: linkIdFor(th.id, c.day),
            a: `entry:${entryId}`,
            b: `alert:${alertId}`,
            label: t("seuil franchi"),
          },
          author,
        );
        next = { ...added, entries, ops };
      }
      created.push({ threshold: th, crossing: c, entry: !!writes });
    }
  }
  return {
    journal: created.length ? journalSchema.parse(next) : journal,
    created,
  };
}
