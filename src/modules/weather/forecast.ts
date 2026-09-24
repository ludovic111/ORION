import { z } from "zod";
import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudHail,
  CloudLightning,
  CloudMoon,
  CloudRain,
  CloudRainWind,
  CloudSnow,
  CloudSun,
  Moon,
  Sun,
  type LucideIcon,
} from "lucide-react";
import { dateTime } from "../../../shared/journal";
import type { Observation, WeatherAlert } from "../../../shared/ops";

// Forecast from Open-Meteo (MétéoSuisse ICON-CH2 when available), fetched
// only on explicit request and cached per journal in this browser.

export type WeatherPlace = { name: string; lat: number; lng: number };

const series = z.array(z.number().nullable());
const responseSchema = z.object({
  current: z.object({
    time: z.number(),
    temperature_2m: z.number().nullable(),
    relative_humidity_2m: z.number().nullable(),
    precipitation: z.number().nullable(),
    weather_code: z.number().nullable(),
    wind_speed_10m: z.number().nullable(),
    wind_direction_10m: z.number().nullable(),
    wind_gusts_10m: z.number().nullable(),
  }),
  hourly: z.object({
    time: z.array(z.number()),
    temperature_2m: series,
    precipitation: series,
    precipitation_probability: series.optional(),
    weather_code: series,
    wind_speed_10m: series,
    wind_gusts_10m: series,
  }),
  daily: z.object({
    time: z.array(z.number()),
    weather_code: series,
    temperature_2m_max: series,
    temperature_2m_min: series,
    precipitation_sum: series,
    wind_gusts_10m_max: series,
    sunrise: z.array(z.number().nullable()),
    sunset: z.array(z.number().nullable()),
  }),
});
type Response = z.infer<typeof responseSchema>;

const n = z.number().nullable();
const forecastSchema = z.object({
  model: z.string(),
  current: z.object({
    at: z.number(),
    temperature: n,
    humidity: n,
    precipitation: n,
    code: n,
    wind: n,
    direction: n,
    gusts: n,
  }),
  hours: z.array(
    z.object({
      at: z.number(),
      temperature: n,
      precipitation: n,
      probability: n,
      code: n,
      wind: n,
      gusts: n,
    }),
  ),
  days: z.array(
    z.object({
      at: z.number(),
      code: n,
      max: n,
      min: n,
      precipitation: n,
      gusts: n,
      sunrise: n,
      sunset: n,
    }),
  ),
});
export type Forecast = z.infer<typeof forecastSchema>;
export type Hour = Forecast["hours"][number];
export type Day = Forecast["days"][number];

const cacheSchema = z.object({
  place: z.object({ name: z.string(), lat: z.number(), lng: z.number() }),
  fetchedAt: z.number(),
  forecast: forecastSchema,
});
export type CachedForecast = z.infer<typeof cacheSchema>;

const cacheKey = (journalId: string) => `orion-aic:weather:${journalId}`;
const autoKey = (journalId: string) => `orion-aic:weather-auto:${journalId}`;

/** Last forecast fetched on this device for the journal, if any. */
export function readCachedForecast(journalId: string): CachedForecast | null {
  try {
    const raw = localStorage.getItem(cacheKey(journalId));
    if (!raw) return null;
    const parsed = cacheSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
function writeCache(journalId: string, value: CachedForecast) {
  try {
    localStorage.setItem(cacheKey(journalId), JSON.stringify(value));
  } catch {
    // Storage full or disabled: the forecast is still shown.
  }
}
export function readAutoRefresh(journalId: string) {
  try {
    return localStorage.getItem(autoKey(journalId)) === "1";
  } catch {
    return false;
  }
}
export function writeAutoRefresh(journalId: string, on: boolean) {
  try {
    if (on) localStorage.setItem(autoKey(journalId), "1");
    else localStorage.removeItem(autoKey(journalId));
  } catch {
    // ignore
  }
}

const VARIABLES =
  "&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m" +
  "&hourly=temperature_2m,precipitation,precipitation_probability,weather_code,wind_speed_10m,wind_gusts_10m" +
  "&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_gusts_10m_max,sunrise,sunset" +
  "&timezone=Europe%2FZurich&forecast_days=3&timeformat=unixtime";

async function request(place: WeatherPlace, model: boolean): Promise<Response> {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${place.lat.toFixed(4)}&longitude=${place.lng.toFixed(4)}` +
    VARIABLES +
    (model ? "&models=meteoswiss_icon_ch2" : "");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      referrerPolicy: "no-referrer",
      credentials: "omit",
    });
    if (!res.ok)
      throw new Error(`Service météo indisponible (HTTP ${res.status}).`);
    return responseSchema.parse(await res.json());
  } finally {
    clearTimeout(timer);
  }
}

const seconds = (v: number | null) => (v === null ? null : v * 1000);

function normalize(r: Response, model: string): Forecast {
  const h = r.hourly;
  const d = r.daily;
  return {
    model,
    current: {
      at: r.current.time * 1000,
      temperature: r.current.temperature_2m,
      humidity: r.current.relative_humidity_2m,
      precipitation: r.current.precipitation,
      code: r.current.weather_code,
      wind: r.current.wind_speed_10m,
      direction: r.current.wind_direction_10m,
      gusts: r.current.wind_gusts_10m,
    },
    hours: h.time.map((t, i) => ({
      at: t * 1000,
      temperature: h.temperature_2m[i] ?? null,
      precipitation: h.precipitation[i] ?? null,
      probability: h.precipitation_probability?.[i] ?? null,
      code: h.weather_code[i] ?? null,
      wind: h.wind_speed_10m[i] ?? null,
      gusts: h.wind_gusts_10m[i] ?? null,
    })),
    days: d.time.map((t, i) => ({
      at: t * 1000,
      code: d.weather_code[i] ?? null,
      max: d.temperature_2m_max[i] ?? null,
      min: d.temperature_2m_min[i] ?? null,
      precipitation: d.precipitation_sum[i] ?? null,
      gusts: d.wind_gusts_10m_max[i] ?? null,
      sunrise: seconds(d.sunrise[i] ?? null),
      sunset: seconds(d.sunset[i] ?? null),
    })),
  };
}

/**
 * Fetch the forecast: MétéoSuisse ICON-CH2 first, the Open-Meteo best model
 * when it fails or does not cover the place. The result is cached.
 */
export async function fetchForecast(journalId: string, place: WeatherPlace) {
  let forecast: Forecast;
  try {
    const r = await request(place, true);
    if (r.current.temperature_2m === null)
      throw new Error("Hors du domaine ICON-CH2.");
    forecast = normalize(r, "MétéoSuisse ICON-CH2");
  } catch (err) {
    if ((err as Error).name === "AbortError")
      throw new Error("Le service météo ne répond pas.");
    forecast = normalize(
      await request(place, false),
      "Open-Meteo (meilleur modèle)",
    );
  }
  const value: CachedForecast = { place, fetchedAt: Date.now(), forecast };
  writeCache(journalId, value);
  return value;
}

// WMO weather codes.
const WMO: Record<number, [string, LucideIcon]> = {
  0: ["Ciel clair", Sun],
  1: ["Plutôt ensoleillé", CloudSun],
  2: ["Partiellement nuageux", CloudSun],
  3: ["Couvert", Cloud],
  45: ["Brouillard", CloudFog],
  48: ["Brouillard givrant", CloudFog],
  51: ["Bruine faible", CloudDrizzle],
  53: ["Bruine", CloudDrizzle],
  55: ["Bruine forte", CloudDrizzle],
  56: ["Bruine verglaçante", CloudDrizzle],
  57: ["Bruine verglaçante forte", CloudDrizzle],
  61: ["Pluie faible", CloudRain],
  63: ["Pluie", CloudRain],
  65: ["Pluie forte", CloudRain],
  66: ["Pluie verglaçante", CloudRain],
  67: ["Pluie verglaçante forte", CloudRain],
  71: ["Neige faible", CloudSnow],
  73: ["Neige", CloudSnow],
  75: ["Neige forte", CloudSnow],
  77: ["Grains de neige", CloudSnow],
  80: ["Averses faibles", CloudRain],
  81: ["Averses", CloudRain],
  82: ["Averses violentes", CloudRainWind],
  85: ["Averses de neige", CloudSnow],
  86: ["Fortes averses de neige", CloudSnow],
  95: ["Orage", CloudLightning],
  96: ["Orage avec grêle", CloudHail],
  99: ["Orage avec forte grêle", CloudHail],
};
export function weatherLabel(code: number | null) {
  return code === null
    ? "Conditions inconnues"
    : (WMO[code]?.[0] ?? `Code ${code}`);
}
export function weatherIcon(code: number | null, night = false): LucideIcon {
  if (night && code === 0) return Moon;
  if (night && (code === 1 || code === 2)) return CloudMoon;
  return code === null ? Cloud : (WMO[code]?.[1] ?? Cloud);
}
/** Hue used to tint a weather icon. */
export function weatherTone(code: number | null) {
  if (code === null) return "var(--text-2)";
  if (code <= 1) return "var(--amber)";
  if (code >= 95) return "var(--pink)";
  if (code >= 71 && code <= 86 && code !== 80 && code !== 81 && code !== 82)
    return "var(--rigel)";
  if (code >= 51) return "var(--cyan)";
  return "var(--text-2)";
}

const COMPASS = [
  "N",
  "NNE",
  "NE",
  "ENE",
  "E",
  "ESE",
  "SE",
  "SSE",
  "S",
  "SSO",
  "SO",
  "OSO",
  "O",
  "ONO",
  "NO",
  "NNO",
];
/** Direction the wind comes from, in French compass points. */
export const compass = (degrees: number) =>
  COMPASS[Math.round((((degrees % 360) + 360) % 360) / 22.5) % 16];

export const round = (v: number | null, digits = 0) =>
  v === null
    ? "—"
    : v.toLocaleString("fr-CH", {
        maximumFractionDigits: digits,
        minimumFractionDigits: digits,
      });

export function isNight(forecast: Forecast, at: number) {
  const day = forecast.days.find(
    (d) => d.sunrise && d.sunset && at >= d.at && at < d.at + 86400000,
  );
  if (!day || !day.sunrise || !day.sunset) return false;
  return at < day.sunrise || at > day.sunset;
}

/** In force now: started (or no start) and not ended (or no end). */
export const alertActive = (a: WeatherAlert, at: number) =>
  (!a.from || Date.parse(a.from) <= at) && (!a.to || Date.parse(a.to) >= at);
export const alertUpcoming = (a: WeatherAlert, at: number) =>
  !!a.from && Date.parse(a.from) > at;

export function activeAlerts(alerts: WeatherAlert[], at: number) {
  return alerts
    .filter((a) => alertActive(a, at))
    .sort((a, b) => Number(b.level) - Number(a.level));
}

export const HAZARDS = [
  "Orages",
  "Fortes pluies",
  "Vent",
  "Neige",
  "Verglas",
  "Canicule",
  "Crues",
  "Avalanches",
  "Incendies de forêt",
  "Brouillard",
];

/** Search a Swiss place (swisstopo). Labels come as HTML: reduced to text. */
export async function searchPlaces(
  query: string,
  signal?: AbortSignal,
): Promise<WeatherPlace[]> {
  const url = `https://api3.geo.admin.ch/rest/services/api/SearchServer?searchText=${encodeURIComponent(query)}&type=locations&sr=4326&limit=8`;
  const res = await fetch(url, {
    signal,
    referrerPolicy: "no-referrer",
    credentials: "omit",
  });
  if (!res.ok) throw new Error(`Recherche indisponible (HTTP ${res.status}).`);
  const data = z
    .object({
      results: z.array(
        z.object({
          attrs: z.object({
            label: z.string(),
            lat: z.number(),
            lon: z.number(),
          }),
        }),
      ),
    })
    .parse(await res.json());
  return data.results.map((r) => ({
    name: htmlToText(r.attrs.label).slice(0, 200),
    lat: r.attrs.lat,
    lng: r.attrs.lon,
  }));
}

function htmlToText(html: string) {
  // DOMParser documents are inert: no script runs, no resource loads.
  const doc = new DOMParser().parseFromString(html, "text/html");
  return (doc.body.textContent ?? "").replace(/\s+/g, " ").trim();
}

export function observationText(
  o: Pick<
    Observation,
    "conditions" | "temperature" | "wind" | "precipitation" | "visibility"
  >,
) {
  return [
    o.conditions,
    o.temperature && `température ${o.temperature}`,
    o.wind && `vent ${o.wind}`,
    o.precipitation && `précipitations ${o.precipitation}`,
    o.visibility && `visibilité ${o.visibility}`,
  ]
    .filter(Boolean)
    .join(", ");
}

export function alertPeriod(a: WeatherAlert) {
  if (a.from && a.to) return `du ${dateTime(a.from)} au ${dateTime(a.to)}`;
  if (a.from) return `dès le ${dateTime(a.from)}`;
  if (a.to) return `jusqu’au ${dateTime(a.to)}`;
  return "sans durée fixée";
}
