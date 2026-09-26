import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import {
  ArrowUp,
  CloudSun,
  Crosshair,
  Droplets,
  ExternalLink,
  History,
  LocateFixed,
  Map as MapIcon,
  MapPin,
  NotebookPen,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  Sunrise,
  Sunset,
  Thermometer,
  Umbrella,
  Wind,
} from "lucide-react";
import { dateTime, time } from "../../../shared/journal";
import {
  ALERT_LABELS,
  ALERT_LEVELS,
  upsert,
  type Observation,
  type WeatherAlert,
} from "../../../shared/ops";
import { parseRef, ref } from "../../../shared/links";
import { useApp } from "../../app/context";
import { EmptyState, ModuleHead } from "../../ui/ModuleHead";
import { RecordSheet, type FieldSpec } from "../../ui/records";
import { ComboField, DateTimeField, TextField, Toggle } from "../../ui/fields";
import { CountUp } from "../../ui/effects";
import { Modal } from "../../journal/Modal";
import {
  HAZARDS,
  alertActive,
  alertPeriod,
  observationText,
  alertUpcoming,
  compass,
  fetchForecast,
  isNight,
  readAutoRefresh,
  readCachedForecast,
  round,
  searchPlaces,
  weatherIcon,
  weatherLabel,
  weatherTone,
  writeAutoRefresh,
  type CachedForecast,
  type Day,
  type Forecast,
  type Hour,
  type WeatherPlace,
} from "./forecast";
import "./weather.css";

const HOUR = 3600000;
const AUTO_EVERY = 30 * 60000;

type ObsDraft = Omit<Observation, "id" | "createdAt" | "updatedAt" | "by"> &
  Partial<Pick<Observation, "id" | "createdAt" | "updatedAt" | "by">>;
type AlertDraft = Omit<WeatherAlert, "id" | "createdAt" | "updatedAt" | "by"> &
  Partial<Pick<WeatherAlert, "id" | "createdAt" | "updatedAt" | "by">>;

const WIND = ["Calme", "Faible", "Modéré", "Fort", "Tempête"];
const PRECIPITATION = [
  "Aucune",
  "Faibles",
  "Modérées",
  "Fortes",
  "Neige",
  "Grêle",
];
const VISIBILITY = [
  "Plus de 10 km",
  "1 à 10 km",
  "Moins de 1 km",
  "Moins de 100 m",
];
const CONDITIONS = [
  "Ensoleillé",
  "Nuageux",
  "Couvert",
  "Pluie",
  "Averses",
  "Neige",
  "Brouillard",
  "Orage",
];
const SOURCES = [
  "MétéoSuisse",
  "OFEV · crues",
  "SLF · avalanches",
  "Canton",
  "Commune",
  "Autre",
];

const blankObservation = (place = ""): ObsDraft => ({
  at: new Date().toISOString(),
  place,
  temperature: "",
  wind: "",
  precipitation: "",
  visibility: "",
  conditions: "",
  notes: "",
});
const blankAlert = (): AlertDraft => ({
  level: "3",
  hazard: "",
  region: "",
  from: new Date().toISOString(),
  to: "",
  source: "MétéoSuisse",
  notes: "",
});

const OBS_SPEC: FieldSpec[] = [
  { key: "at", label: "Heure", kind: "datetime", required: true },
  { key: "place", label: "Lieu", kind: "text" },
  {
    key: "conditions",
    label: "Conditions",
    kind: "combo",
    options: CONDITIONS,
    quick: 8,
    wide: true,
  },
  {
    key: "temperature",
    label: "Température",
    kind: "text",
    placeholder: "ex. 12 °C",
    max: 40,
  },
  { key: "wind", label: "Vent", kind: "combo", options: WIND },
  {
    key: "precipitation",
    label: "Précipitations",
    kind: "combo",
    options: PRECIPITATION,
  },
  {
    key: "visibility",
    label: "Visibilité",
    kind: "combo",
    options: VISIBILITY,
  },
  { key: "notes", label: "Remarques", kind: "area", max: 2000 },
];

export function Weather() {
  const {
    journal,
    readOnly,
    focus,
    setFocus,
    updateOps,
    addEntry,
    toast,
    now,
    viewAt,
    record,
    live,
  } = useApp();
  const place = journal.ops.settings.weatherPlace;
  const [fetched, setData] = useState<CachedForecast | null>(() =>
    readCachedForecast(journal.id),
  );
  // Every forecast received is kept in the journal (and synchronised): the
  // time machine shows the forecast known at that time.
  const received = useMemo(
    () =>
      [...journal.ops.forecasts].sort((a, b) =>
        b.fetchedAt.localeCompare(a.fetchedAt),
      ),
    [journal.ops.forecasts],
  );
  const [picked, setPicked] = useState<string | null>(null);
  const asCached = (f: (typeof received)[number]): CachedForecast => ({
    place: { name: f.place, lat: f.lat, lng: f.lng },
    fetchedAt: Date.parse(f.fetchedAt),
    forecast: f.data as Forecast,
  });
  const chosen = picked ? received.find((f) => f.id === picked) : undefined;
  const data: CachedForecast | null = chosen
    ? asCached(chosen)
    : viewAt !== null
      ? received[0]
        ? asCached(received[0])
        : null
      : received[0] &&
          Date.parse(received[0].fetchedAt) > (fetched?.fetchedAt ?? 0)
        ? asCached(received[0])
        : fetched;
  const archived = !!chosen || viewAt !== null;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [auto, setAuto] = useState(() => readAutoRefresh(journal.id));
  const [picking, setPicking] = useState(false);
  const [obs, setObs] = useState<ObsDraft | null>(null);
  const [alert, setAlert] = useState<AlertDraft | null>(null);
  const [pendingLog, setPendingLog] = useState<string | null>(null);
  const [online, setOnline] = useState(() => navigator.onLine);

  useEffect(() => {
    setData(readCachedForecast(journal.id));
    setAuto(readAutoRefresh(journal.id));
    setError("");
  }, [journal.id]);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  const busy = useRef(false);
  // The module is remounted per journal: a request still running when the
  // operator switches journal must not touch the new one.
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const liveForecasts = useRef(live.ops.forecasts);
  liveForecasts.current = live.ops.forecasts;
  const refresh = useCallback(async () => {
    if (!place || busy.current) return;
    // Captured at request time: the forecast belongs to this journal.
    const journalId = journal.id;
    busy.current = true;
    setLoading(true);
    setError("");
    try {
      const result = await fetchForecast(journalId, place);
      if (mounted.current) {
        setData(result);
        setPicked(null);
      }
      const last = liveForecasts.current.reduce<string>(
        (top, f) =>
          f.place === result.place.name && f.fetchedAt > top
            ? f.fetchedAt
            : top,
        "",
      );
      // Keep at most one version every 5 minutes per place.
      if (!last || result.fetchedAt - Date.parse(last) > 5 * 60_000)
        record(
          "forecasts",
          {
            fetchedAt: new Date(result.fetchedAt).toISOString(),
            place: result.place.name.slice(0, 200),
            lat: result.place.lat,
            lng: result.place.lng,
            data: result.forecast,
          },
          journalId,
        );
    } catch (err) {
      if (!mounted.current) return;
      setError(
        !navigator.onLine
          ? "Hors ligne : la dernière prévision reste affichée."
          : err instanceof TypeError
            ? "Impossible de joindre le service météo."
            : (err as Error).message,
      );
    } finally {
      busy.current = false;
      if (mounted.current) setLoading(false);
    }
  }, [journal.id, place, record]);

  // Opt-in automatic refresh, only while the page is visible.
  const fetchedAt = data?.fetchedAt ?? 0;
  useEffect(() => {
    if (!auto || !place || viewAt !== null) return;
    const check = () => {
      if (
        document.visibilityState === "visible" &&
        navigator.onLine &&
        Date.now() - fetchedAt > AUTO_EVERY
      )
        void refresh();
    };
    check();
    const timer = setInterval(check, 60000);
    document.addEventListener("visibilitychange", check);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", check);
    };
  }, [auto, place, fetchedAt, refresh, viewAt]);

  useEffect(() => {
    if (!focus) return;
    const { kind, id } = parseRef(focus);
    if (kind !== "alert" && kind !== "observation") return;
    if (kind === "alert") {
      if (id === "new") {
        if (!readOnly) setAlert(blankAlert());
      } else {
        const found = journal.ops.alerts.find((a) => a.id === id);
        if (found) setAlert(found);
        else toast("Alerte introuvable.");
      }
    } else {
      if (id === "new") {
        if (!readOnly) setObs(blankObservation(place?.name));
      } else {
        const found = journal.ops.observations.find((o) => o.id === id);
        if (found) setObs(found);
        else toast("Observation introuvable.");
      }
    }
    setFocus(null);
  }, [
    focus,
    journal.ops.alerts,
    journal.ops.observations,
    readOnly,
    setFocus,
    toast,
    place?.name,
  ]);

  // Journal entry for a new observation, once it exists in the journal.
  useEffect(() => {
    if (!pendingLog) return;
    const o = journal.ops.observations.find((x) => x.id === pendingLog);
    if (!o) return;
    setPendingLog(null);
    logObservation(o);
  }, [pendingLog, journal.ops.observations]);

  function logObservation(o: Observation) {
    try {
      const text = observationText(o);
      const id = addEntry(
        {
          type: "Observation",
          happenedAt: o.at,
          location: o.place,
          message: `Observation météo${o.place ? ` (${o.place})` : ""} : ${text || "voir remarques"}${o.notes ? `. ${o.notes}` : ""}`,
          tags: ["météo"],
        },
        [ref("observation", o.id)],
      );
      if (id) toast("Observation consignée au journal.");
    } catch (err) {
      toast((err as Error).message);
    }
  }

  function setPlace(value: WeatherPlace | null) {
    try {
      updateOps((ops) => ({
        ...ops,
        settings: { ...ops.settings, weatherPlace: value },
      }));
      setPicking(false);
      if (value)
        toast(
          `Lieu météo : ${value.name}. Appuyez sur « Actualiser » pour la prévision.`,
        );
    } catch (err) {
      toast((err as Error).message);
    }
  }

  const alerts = useMemo(() => {
    const rank = (a: WeatherAlert) =>
      alertActive(a, now) ? 0 : alertUpcoming(a, now) ? 1 : 2;
    return [...journal.ops.alerts].sort(
      (a, b) =>
        rank(a) - rank(b) ||
        Number(b.level) - Number(a.level) ||
        (b.from > a.from ? 1 : -1),
    );
  }, [journal.ops.alerts, now]);
  const observations = useMemo(
    () =>
      [...journal.ops.observations].sort(
        (a, b) => Date.parse(b.at) - Date.parse(a.at),
      ),
    [journal.ops.observations],
  );
  const forecast = data?.forecast;
  const otherPlace =
    data &&
    place &&
    (Math.abs(data.place.lat - place.lat) > 0.001 ||
      Math.abs(data.place.lng - place.lng) > 0.001);

  return (
    <>
      <ModuleHead
        actions={
          <>
            <a
              className="button weather-extlink"
              href="https://www.meteosuisse.admin.ch"
              target="_blank"
              rel="noreferrer"
            >
              <ExternalLink size={14} />
              Carte des dangers MétéoSuisse
            </a>
            {place && viewAt === null && (
              <button
                className="primary"
                onClick={() => void refresh()}
                disabled={loading}
              >
                <RefreshCw
                  size={14}
                  className={loading ? "weather-spin" : ""}
                />
                {loading ? "Actualisation…" : "Actualiser"}
              </button>
            )}
          </>
        }
      />
      <div className="bento stagger">
        <section
          className="card w-12 weather-place"
          aria-label="Lieu de la prévision"
        >
          {place ? (
            <>
              <div className="weather-place-main">
                <MapPin size={18} />
                <div>
                  <strong>{place.name || "Lieu sans nom"}</strong>
                  <small className="mono">
                    {place.lat.toFixed(4)}, {place.lng.toFixed(4)}
                  </small>
                </div>
                {!readOnly && (
                  <button className="small" onClick={() => setPicking(true)}>
                    Changer de lieu
                  </button>
                )}
              </div>
              <div className="weather-place-status">
                {data && archived ? (
                  <span className="pill accent">
                    <History size={11} />
                    Prévision reçue le{" "}
                    {dateTime(new Date(data.fetchedAt).toISOString())}
                  </span>
                ) : data ? (
                  <span
                    className={`pill ${Date.now() - data.fetchedAt > 3 * HOUR ? "warn" : "ok"}`}
                  >
                    Données du{" "}
                    {dateTime(new Date(data.fetchedAt).toISOString())}
                  </span>
                ) : (
                  <span className="pill muted">Pas encore de prévision</span>
                )}
                {!online && <span className="pill warn">Hors ligne</span>}
                {data && <span className="muted">{data.forecast.model}</span>}
                <Toggle
                  label="Actualiser toutes les 30 min"
                  checked={auto}
                  onChange={(value) => {
                    setAuto(value);
                    writeAutoRefresh(journal.id, value);
                  }}
                />
              </div>
              <p className="weather-privacy">
                Pour obtenir la prévision, les coordonnées du lieu sont envoyées
                à open-meteo.com (rien d’autre). Sans actualisation, aucune
                donnée ne quitte ce poste.
              </p>
              {error && (
                <p className="error" role="alert">
                  {error}
                </p>
              )}
            </>
          ) : readOnly ? (
            <p className="muted">Aucun lieu météo défini pour ce journal.</p>
          ) : (
            <div className="weather-setup">
              <div className="weather-setup-intro">
                <CloudSun size={26} />
                <div>
                  <h2>Où faut-il la météo ?</h2>
                  <p>
                    Cherchez une localité, reprenez la vue de la carte ou votre
                    position. La prévision MétéoSuisse (modèle ICON-CH2) est
                    ensuite chargée sur demande.
                  </p>
                </div>
              </div>
              <PlacePicker onPick={setPlace} />
            </div>
          )}
        </section>

        {forecast && data && (
          <>
            <Current
              forecast={forecast}
              name={data.place.name}
              other={!!otherPlace}
            />
            <Days days={forecast.days} />
            <section
              className="card w-12 weather-chart-card"
              aria-label="Prévision sur 48 heures"
            >
              <div className="card-head">
                <Thermometer size={15} />
                <h2>48 heures</h2>
                <span className="weather-legend">
                  <i className="t" /> Température
                  <i className="p" /> Précipitations
                  <i className="g" /> Rafales
                </span>
              </div>
              <Chart key={data.fetchedAt} hours={forecast.hours} at={now} />
            </section>
          </>
        )}
        {received.length > 0 && (
          <section
            className="card w-12 weather-versions"
            aria-label="Prévisions reçues"
          >
            <div className="card-head">
              <History size={15} />
              <h2>Prévisions reçues</h2>
              <span className="pill plain">{received.length}</span>
              {picked && (
                <button className="small" onClick={() => setPicked(null)}>
                  {viewAt !== null ? "Version du moment" : "Dernière prévision"}
                </button>
              )}
            </div>
            <p className="muted weather-versions-intro">
              Chaque prévision chargée est gardée : on retrouve ce qui était
              annoncé à chaque heure.
            </p>
            <div className="weather-version-list">
              {received.slice(0, 48).map((f) => {
                const d = f.data as Forecast;
                const rain = d.hours
                  .filter(
                    (h) =>
                      h.at >= Date.parse(f.fetchedAt) &&
                      h.at < Date.parse(f.fetchedAt) + 24 * HOUR,
                  )
                  .reduce((sum, h) => sum + (h.precipitation ?? 0), 0);
                const Icon = weatherIcon(d.current.code, false);
                const active = data?.fetchedAt === Date.parse(f.fetchedAt);
                return (
                  <button
                    key={f.id}
                    className={`weather-version${active ? " active" : ""}`}
                    onClick={() => setPicked(f.id)}
                    title={`${f.place} · ${d.model} · reçue par ${f.by || "—"}`}
                  >
                    <span className="mono">{time(f.fetchedAt)}</span>
                    <Icon size={18} />
                    <strong>{round(d.current.temperature)}°</strong>
                    <small>
                      {round(rain)} mm/24 h · {round(d.current.gusts)} km/h
                    </small>
                    <small className="muted">
                      {new Date(f.fetchedAt).toLocaleDateString("fr-CH", {
                        day: "2-digit",
                        month: "2-digit",
                      })}{" "}
                      · {f.by || "—"}
                    </small>
                  </button>
                );
              })}
            </div>
          </section>
        )}
        {place && !forecast && (
          <section className="card w-12">
            <EmptyState
              icon={<CloudSun size={28} />}
              title="Pas encore de prévision"
              actions={
                <button
                  className="primary"
                  onClick={() => void refresh()}
                  disabled={loading}
                >
                  <RefreshCw
                    size={14}
                    className={loading ? "weather-spin" : ""}
                  />
                  Charger la prévision
                </button>
              }
            >
              La prévision pour {place.name || "ce lieu"} est chargée uniquement
              quand vous le demandez.
            </EmptyState>
          </section>
        )}

        <section className="card w-5 weather-alerts" aria-label="Alertes">
          <div className="card-head">
            <ShieldAlert size={15} />
            <h2>Alertes de danger</h2>
            <span className="pill plain">
              {alerts.filter((a) => alertActive(a, now)).length} en vigueur
            </span>
            {!readOnly && (
              <button className="small" onClick={() => setAlert(blankAlert())}>
                <Plus size={13} />
                Alerte
              </button>
            )}
          </div>
          {alerts.length ? (
            <div className="weather-alert-list">
              {alerts.map((a) => {
                const active = alertActive(a, now);
                const soon = alertUpcoming(a, now);
                return (
                  <button
                    key={a.id}
                    className={`weather-alert lvl-${a.level} ${active ? "active" : soon ? "" : "ended"}`}
                    onClick={() => setAlert(a)}
                  >
                    <LevelBadge level={a.level} />
                    <span className="weather-alert-main">
                      <strong>{a.hazard}</strong>
                      <small>
                        {[a.region, alertPeriod(a), a.source]
                          .filter(Boolean)
                          .join(" · ")}
                      </small>
                    </span>
                    <span
                      className={`pill ${active ? "crit" : soon ? "warn" : "muted"}`}
                    >
                      {active ? "En vigueur" : soon ? "À venir" : "Terminée"}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="weather-empty">
              <p>
                Aucune alerte saisie. Reportez ici les avis de MétéoSuisse
                (degrés 1 à 5) qui concernent la région.
              </p>
              {!readOnly && (
                <button onClick={() => setAlert(blankAlert())}>
                  <Plus size={14} />
                  Saisir une alerte
                </button>
              )}
            </div>
          )}
        </section>

        <section
          className="card w-7 weather-obs"
          aria-label="Observations sur place"
        >
          <div className="card-head">
            <Crosshair size={15} />
            <h2>Observations sur place</h2>
            <span className="pill plain">{observations.length}</span>
          </div>
          {!readOnly && (
            <QuickObservation
              key={journal.id}
              defaultPlace={place?.name ?? ""}
              forecast={forecast}
              onAdded={(id, log) => log && setPendingLog(id)}
            />
          )}
          {observations.length > 0 ? (
            <div className="rows weather-obs-list">
              {observations.slice(0, 30).map((o) => (
                <div className="row-item" key={o.id}>
                  <span className="mono weather-obs-time">{time(o.at)}</span>
                  <button
                    className="weather-obs-open"
                    onClick={() => setObs(o)}
                  >
                    <span className="row-main">
                      <strong>
                        {observationText(o) || o.notes || "Observation"}
                      </strong>
                      <small>
                        {[
                          dateTime(o.at),
                          o.place,
                          o.notes && observationText(o) ? o.notes : "",
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </small>
                    </span>
                  </button>
                  {!readOnly && (
                    <button
                      className="small"
                      title="Consigner au journal"
                      aria-label="Consigner cette observation au journal"
                      onClick={() => logObservation(o)}
                    >
                      <NotebookPen size={13} />
                      <span className="weather-hide-narrow">Consigner</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="muted weather-obs-none">
              Aucune observation. Notez ce que l’on voit sur place : c’est
              souvent plus parlant que la prévision.
            </p>
          )}
        </section>
      </div>

      {picking && (
        <Modal title="Lieu de la prévision" onClose={() => setPicking(false)}>
          <PlacePicker onPick={setPlace} />
          {place && (
            <div className="weather-picker-foot">
              <button className="danger" onClick={() => setPlace(null)}>
                Retirer le lieu
              </button>
            </div>
          )}
        </Modal>
      )}
      {obs && (
        <RecordSheet
          collection="observations"
          kind="observation"
          noun="une observation"
          spec={OBS_SPEC}
          initial={obs as Record<string, unknown>}
          onClose={() => setObs(null)}
          validate={(v) => (!v.at ? "Indiquez l’heure." : "")}
          footer={
            obs.id && !readOnly ? (
              <button
                onClick={() => {
                  const found = journal.ops.observations.find(
                    (o) => o.id === obs.id,
                  );
                  if (found) logObservation(found);
                }}
              >
                <NotebookPen size={14} />
                Consigner
              </button>
            ) : undefined
          }
        />
      )}
      {alert && (
        <RecordSheet
          collection="alerts"
          kind="alert"
          noun="une alerte"
          spec={ALERT_SPEC}
          initial={alert as Record<string, unknown>}
          onClose={() => setAlert(null)}
          titleOf={(v) =>
            v.id && v.hazard
              ? `${String(v.hazard)} · degré ${String(v.level)}`
              : ""
          }
          validate={(v) =>
            !String(v.hazard ?? "").trim()
              ? "Indiquez le danger (un clic sur une valeur proposée suffit)."
              : v.from &&
                  v.to &&
                  Date.parse(String(v.to)) < Date.parse(String(v.from))
                ? "La fin précède le début."
                : ""
          }
        />
      )}
    </>
  );
}
export default Weather;

const ALERT_SPEC: FieldSpec[] = [
  {
    kind: "custom",
    key: "level",
    wide: true,
    render: (v, set) => (
      <LevelPicker
        value={String(v.level ?? "3") as WeatherAlert["level"]}
        onChange={(level) => set({ level })}
      />
    ),
  },
  {
    key: "hazard",
    label: "Danger",
    kind: "combo",
    options: HAZARDS,
    quick: 10,
    required: true,
    wide: true,
  },
  {
    key: "region",
    label: "Région",
    kind: "text",
    placeholder: "ex. Valais central",
  },
  { key: "source", label: "Source", kind: "combo", options: SOURCES },
  { key: "from", label: "Début", kind: "datetime" },
  { key: "to", label: "Fin", kind: "datetime" },
  {
    key: "notes",
    label: "Remarques / comportements recommandés",
    kind: "area",
    max: 2000,
  },
];

function LevelBadge({ level }: { level: WeatherAlert["level"] }) {
  return (
    <span className={`weather-level lvl-${level}`} title={ALERT_LABELS[level]}>
      <span className="sr-only">Degré </span>
      {level}
    </span>
  );
}

function LevelPicker({
  value,
  onChange,
}: {
  value: WeatherAlert["level"];
  onChange: (level: WeatherAlert["level"]) => void;
}) {
  return (
    <div className="weather-level-picker">
      <span className="label">Degré de danger</span>
      <div role="radiogroup" aria-label="Degré de danger">
        {ALERT_LEVELS.map((l) => (
          <button
            type="button"
            key={l}
            role="radio"
            aria-checked={value === l}
            className={`weather-level lvl-${l}`}
            onClick={() => onChange(l)}
            title={ALERT_LABELS[l]}
          >
            {l}
          </button>
        ))}
      </div>
      <small>{ALERT_LABELS[value]}</small>
    </div>
  );
}

/** Find a place: swisstopo search, map view, device position or coordinates. */
function PlacePicker({ onPick }: { onPick: (place: WeatherPlace) => void }) {
  const { journal, toast } = useApp();
  const center = journal.ops.settings.mapCenter;
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<WeatherPlace[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  const [manual, setManual] = useState({ name: "", lat: "", lng: "" });
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setError("");
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        setResults(await searchPlaces(q, controller.signal));
        setError("");
      } catch (err) {
        if ((err as Error).name !== "AbortError")
          setError(
            err instanceof TypeError
              ? "Recherche impossible (hors ligne ?)."
              : (err as Error).message,
          );
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  function locate() {
    if (!navigator.geolocation)
      return toast("Position indisponible sur cet appareil.");
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        onPick({
          name: "Ma position",
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      (err) => {
        setLocating(false);
        toast(
          err.code === 1
            ? "Accès à la position refusé."
            : "Position introuvable.",
        );
      },
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 },
    );
  }
  const lat = Number(manual.lat.replace(",", "."));
  const lng = Number(manual.lng.replace(",", "."));
  const manualOk =
    manual.lat.trim() !== "" &&
    manual.lng.trim() !== "" &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180;

  return (
    <div className="weather-picker">
      <div className="search" style={{ maxWidth: "none" }}>
        <Search size={14} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Localité, adresse, lieu-dit…"
          aria-label="Rechercher un lieu en Suisse"
          maxLength={120}
        />
        {searching && <RefreshCw size={13} className="weather-spin" />}
      </div>
      {error && <p className="error">{error}</p>}
      {results.length > 0 && (
        <div className="weather-results" role="list">
          {results.map((r, i) => (
            <button
              key={`${r.lat}-${r.lng}-${i}`}
              className="row-item"
              role="listitem"
              onClick={() => onPick(r)}
            >
              <MapPin size={14} />
              <span className="row-main">
                <strong>{r.name}</strong>
                <small className="mono">
                  {r.lat.toFixed(4)}, {r.lng.toFixed(4)}
                </small>
              </span>
            </button>
          ))}
        </div>
      )}
      <p className="weather-privacy">
        La recherche passe par geo.admin.ch (swisstopo).
      </p>
      <div className="weather-picker-actions">
        <button
          disabled={!center}
          title={
            center
              ? "Centre de la carte de situation"
              : "Ouvrez d’abord la carte"
          }
          onClick={() =>
            center &&
            onPick({
              name: "Vue de la carte",
              lat: center.lat,
              lng: center.lng,
            })
          }
        >
          <MapIcon size={14} />
          Utiliser la vue de la carte
        </button>
        <button onClick={locate} disabled={locating}>
          <LocateFixed size={14} />
          {locating ? "Localisation…" : "Ma position"}
        </button>
      </div>
      <details className="weather-manual">
        <summary>Saisir des coordonnées</summary>
        <div className="form-grid">
          <TextField
            className="span-2"
            label="Nom"
            value={manual.name}
            onChange={(name) => setManual({ ...manual, name })}
            maxLength={200}
          />
          <TextField
            label="Latitude"
            value={manual.lat}
            onChange={(v) => setManual({ ...manual, lat: v })}
            placeholder="46.2044"
            maxLength={20}
          />
          <TextField
            label="Longitude"
            value={manual.lng}
            onChange={(v) => setManual({ ...manual, lng: v })}
            placeholder="6.1432"
            maxLength={20}
          />
        </div>
        <button
          className="primary"
          disabled={!manualOk}
          onClick={() =>
            onPick({
              name:
                manual.name.trim() || `${lat.toFixed(3)}, ${lng.toFixed(3)}`,
              lat,
              lng,
            })
          }
        >
          Utiliser ces coordonnées
        </button>
      </details>
    </div>
  );
}

function QuickObservation({
  defaultPlace,
  forecast,
  onAdded,
}: {
  defaultPlace: string;
  forecast?: Forecast;
  onAdded: (id: string, log: boolean) => void;
}) {
  const { updateOps, author, toast } = useApp();
  const [draft, setDraft] = useState<ObsDraft>(() =>
    blankObservation(defaultPlace),
  );
  const [log, setLog] = useState(true);
  const [open, setOpen] = useState(false);
  const set = (patch: Partial<ObsDraft>) =>
    setDraft((d) => ({ ...d, ...patch }));
  const empty = !observationText(draft) && !draft.notes.trim();
  function add() {
    const id = crypto.randomUUID();
    try {
      updateOps((ops) =>
        upsert(
          ops,
          "observations",
          { ...draft, id, at: draft.at || new Date().toISOString() },
          author,
        ),
      );
      onAdded(id, log);
      toast("Observation ajoutée.");
      setDraft(blankObservation(draft.place));
      setOpen(false);
    } catch (err) {
      toast((err as Error).message);
    }
  }
  function fromForecast() {
    if (!forecast) return;
    const c = forecast.current;
    set({
      temperature:
        c.temperature === null ? "" : `${round(c.temperature, 1)} °C`,
      wind:
        c.wind === null
          ? ""
          : `${round(c.wind)} km/h${c.direction === null ? "" : ` du ${compass(c.direction)}`}${c.gusts ? `, rafales ${round(c.gusts)} km/h` : ""}`,
      conditions: weatherLabel(c.code),
      precipitation: c.precipitation
        ? `${round(c.precipitation, 1)} mm/h`
        : "Aucune",
    });
  }
  if (!open)
    return (
      <div className="weather-quick-closed">
        <button
          className="primary"
          onClick={() => {
            set({ at: new Date().toISOString() });
            setOpen(true);
          }}
        >
          <Plus size={14} />
          Noter une observation
        </button>
      </div>
    );
  return (
    <div className="weather-quick reveal">
      <ComboField
        label="Conditions"
        value={draft.conditions}
        onChange={(conditions) => set({ conditions })}
        options={CONDITIONS}
        quick={8}
        maxLength={200}
      />
      <div className="weather-quick-grid">
        <TextField
          label="Température"
          value={draft.temperature}
          onChange={(temperature) => set({ temperature })}
          placeholder="ex. 12 °C"
          maxLength={40}
        />
        <ComboField
          label="Vent"
          value={draft.wind}
          onChange={(wind) => set({ wind })}
          options={WIND}
          maxLength={80}
        />
        <ComboField
          label="Précipitations"
          value={draft.precipitation}
          onChange={(precipitation) => set({ precipitation })}
          options={PRECIPITATION}
          maxLength={80}
        />
        <ComboField
          label="Visibilité"
          value={draft.visibility}
          onChange={(visibility) => set({ visibility })}
          options={VISIBILITY}
          maxLength={80}
        />
        <TextField
          label="Lieu"
          value={draft.place}
          onChange={(p) => set({ place: p })}
          maxLength={200}
        />
        <DateTimeField
          label="Heure"
          value={draft.at}
          onChange={(at) => set({ at })}
        />
      </div>
      <TextField
        label="Remarques"
        value={draft.notes}
        onChange={(notes) => set({ notes })}
        rows={2}
        maxLength={2000}
      />
      <div className="weather-quick-actions">
        {forecast && (
          <button
            onClick={fromForecast}
            title="Reprendre les valeurs de la prévision actuelle"
          >
            <CloudSun size={14} />
            Reprendre la prévision
          </button>
        )}
        <Toggle
          label="Consigner aussi au journal"
          checked={log}
          onChange={setLog}
        />
        <span className="weather-push" />
        <button onClick={() => setOpen(false)}>Annuler</button>
        <button className="primary" disabled={empty} onClick={add}>
          Ajouter
        </button>
      </div>
    </div>
  );
}

function Current({
  forecast,
  name,
  other,
}: {
  forecast: Forecast;
  name: string;
  other: boolean;
}) {
  const c = forecast.current;
  const Icon = weatherIcon(c.code, isNight(forecast, c.at));
  return (
    <section
      className="card spot w-5 weather-now"
      aria-label="Conditions actuelles"
    >
      <div className="weather-now-top">
        <span className="label">Maintenant · {name}</span>
        {other && <span className="pill warn">Ancien lieu</span>}
      </div>
      <div className="weather-now-main">
        <span
          className="weather-now-icon"
          style={{ color: weatherTone(c.code) }}
        >
          <Icon size={64} strokeWidth={1.4} />
        </span>
        <div>
          <div className="weather-temp">
            {c.temperature === null ? (
              "—"
            ) : (
              <CountUp value={Math.round(c.temperature)} />
            )}
            <span>°C</span>
          </div>
          <div className="weather-now-label">{weatherLabel(c.code)}</div>
        </div>
      </div>
      <dl className="weather-now-facts">
        <div>
          <dt>Vent</dt>
          <dd>
            {c.direction !== null && (
              <ArrowUp
                size={16}
                className="weather-arrow"
                style={{ transform: `rotate(${c.direction + 180}deg)` }}
                aria-hidden="true"
              />
            )}
            {round(c.wind)} km/h
            {c.direction !== null && <small> du {compass(c.direction)}</small>}
          </dd>
        </div>
        <div>
          <dt>Rafales</dt>
          <dd className={c.gusts !== null && c.gusts >= 60 ? "warn" : ""}>
            <Wind size={15} />
            {round(c.gusts)} km/h
          </dd>
        </div>
        <div>
          <dt>Humidité</dt>
          <dd>
            <Droplets size={15} />
            {round(c.humidity)} %
          </dd>
        </div>
        <div>
          <dt>Précipitations</dt>
          <dd>
            <Umbrella size={15} />
            {round(c.precipitation, 1)} mm
          </dd>
        </div>
      </dl>
    </section>
  );
}

const dayName = (d: Day, index: number) =>
  index === 0
    ? "Aujourd’hui"
    : index === 1
      ? "Demain"
      : new Date(d.at).toLocaleDateString("fr-CH", {
          timeZone: "Europe/Zurich",
          weekday: "long",
        });

function Days({ days }: { days: Day[] }) {
  return (
    <section className="w-7 weather-days" aria-label="Prévision sur 3 jours">
      {days.slice(0, 3).map((d, i) => {
        const Icon = weatherIcon(d.code);
        return (
          <article className="card spot weather-day" key={d.at}>
            <header>
              <strong>{dayName(d, i)}</strong>
              <small>
                {new Date(d.at).toLocaleDateString("fr-CH", {
                  timeZone: "Europe/Zurich",
                  day: "numeric",
                  month: "short",
                })}
              </small>
            </header>
            <span
              className="weather-day-icon"
              style={{ color: weatherTone(d.code) }}
            >
              <Icon size={40} strokeWidth={1.5} />
            </span>
            <span className="weather-day-label">{weatherLabel(d.code)}</span>
            <div className="weather-range">
              <span className="min">{round(d.min)}°</span>
              <span className="bar" aria-hidden="true" />
              <span className="max">{round(d.max)}°</span>
            </div>
            <ul>
              <li>
                <Umbrella size={13} />
                {round(d.precipitation, 1)} mm
              </li>
              <li className={d.gusts !== null && d.gusts >= 60 ? "warn" : ""}>
                <Wind size={13} />
                rafales {round(d.gusts)} km/h
              </li>
              <li>
                <Sunrise size={13} />
                {d.sunrise ? time(new Date(d.sunrise).toISOString()) : "—"}
                <Sunset size={13} />
                {d.sunset ? time(new Date(d.sunset).toISOString()) : "—"}
              </li>
            </ul>
          </article>
        );
      })}
    </section>
  );
}

const zurichHour = (at: number) =>
  Number(
    new Date(at).toLocaleString("en-GB", {
      timeZone: "Europe/Zurich",
      hour: "2-digit",
      hourCycle: "h23",
    }),
  );

/** Temperature, precipitation and gusts over 48 hours. */
function Chart({ hours, at }: { hours: Hour[]; at: number }) {
  const list = useMemo(() => {
    const start = at - 3 * HOUR;
    return hours.filter((h) => h.at >= start && h.at <= start + 48 * HOUR);
  }, [hours, at]);
  const [index, setIndex] = useState<number | null>(null);
  const box = useRef<SVGSVGElement>(null);
  if (list.length < 2)
    return (
      <p className="muted">
        La prévision est trop ancienne : actualisez pour voir les 48 prochaines
        heures.
      </p>
    );

  const W = 760;
  const H = 250;
  const left = 36;
  const right = 40;
  const top = 14;
  const bottom = 200;
  const t0 = list[0].at;
  const t1 = list[list.length - 1].at;
  const x = (t: number) => left + ((t - t0) / (t1 - t0)) * (W - left - right);
  const temps = list
    .map((h) => h.temperature)
    .filter((v): v is number => v !== null);
  const tMin = Math.floor((temps.length ? Math.min(...temps) : 0) - 1);
  const tMax = Math.ceil((temps.length ? Math.max(...temps) : 10) + 1);
  const yT = (t: number) =>
    top + ((tMax - t) / Math.max(1, tMax - tMin)) * (bottom - top);
  const gMax = Math.max(40, ...list.map((h) => h.gusts ?? 0)) * 1.1;
  const yG = (g: number) => top + (1 - g / gMax) * (bottom - top);
  const pMax = Math.max(4, ...list.map((h) => h.precipitation ?? 0));
  const pHeight = (p: number) => (p / pMax) * (bottom - top) * 0.4;
  const line = (
    value: (h: Hour) => number | null,
    y: (v: number) => number,
  ) => {
    let d = "";
    let pen = false;
    for (const h of list) {
      const v = value(h);
      if (v === null) {
        pen = false;
        continue;
      }
      d += `${pen ? "L" : "M"}${x(h.at).toFixed(1)},${y(v).toFixed(1)}`;
      pen = true;
    }
    return d;
  };
  const tempPath = line((h) => h.temperature, yT);
  const withTemp = list.filter((h) => h.temperature !== null);
  const area = withTemp.length
    ? `${tempPath}L${x(withTemp[withTemp.length - 1].at).toFixed(1)},${bottom}L${x(withTemp[0].at).toFixed(1)},${bottom}Z`
    : "";
  const gustPath = line((h) => h.gusts, yG);
  const barWidth = Math.max(3, ((W - left - right) / list.length) * 0.62);
  const ticks = list.filter((h) => zurichHour(h.at) % 6 === 0);
  const nowX = at >= t0 && at <= t1 ? x(at) : null;
  const picked = index === null ? null : list[index];

  function pick(clientX: number) {
    const rect = box.current?.getBoundingClientRect();
    if (!rect) return;
    const vx = ((clientX - rect.left) / rect.width) * W;
    const t = t0 + ((vx - left) / (W - left - right)) * (t1 - t0);
    let best = 0;
    list.forEach((h, i) => {
      if (Math.abs(h.at - t) < Math.abs(list[best].at - t)) best = i;
    });
    setIndex(best);
  }
  function key(e: KeyboardEvent) {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    const base = index ?? list.findIndex((h) => h.at >= at);
    const next = Math.max(
      0,
      Math.min(list.length - 1, base + (e.key === "ArrowLeft" ? -1 : 1)),
    );
    setIndex(next);
  }
  const summary = `Température de ${round(tMin + 1)} à ${round(tMax - 1)} °C, précipitations cumulées ${round(
    list.reduce((s, h) => s + (h.precipitation ?? 0), 0),
    1,
  )} mm, rafales jusqu’à ${round(Math.max(0, ...list.map((h) => h.gusts ?? 0)))} km/h.`;

  return (
    <div className="weather-chart">
      <svg
        ref={box}
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`Prévision sur 48 heures. ${summary} Flèches gauche et droite pour lire heure par heure.`}
        tabIndex={0}
        onPointerMove={(e) => pick(e.clientX)}
        onPointerDown={(e) => pick(e.clientX)}
        onPointerLeave={(e) => e.pointerType === "mouse" && setIndex(null)}
        onKeyDown={key}
        onBlur={() => setIndex(null)}
      >
        <defs>
          <linearGradient id="weather-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--amber)" stopOpacity="0.38" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="weather-line" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--amber)" />
            <stop offset="50%" stopColor="var(--pink)" />
            <stop offset="100%" stopColor="var(--accent)" />
          </linearGradient>
        </defs>
        {[tMin, (tMin + tMax) / 2, tMax].map((t) => (
          <g key={t}>
            <line
              className="weather-grid"
              x1={left}
              x2={W - right}
              y1={yT(t)}
              y2={yT(t)}
            />
            <text
              className="weather-axis"
              x={left - 6}
              y={yT(t) + 4}
              textAnchor="end"
            >
              {Math.round(t)}°
            </text>
          </g>
        ))}
        <text className="weather-axis g" x={W - right + 6} y={top + 8}>
          {Math.round(gMax)}
        </text>
        <text className="weather-axis g" x={W - right + 6} y={top + 20}>
          km/h
        </text>
        {ticks.map((h) => {
          const hour = zurichHour(h.at);
          return (
            <g key={h.at}>
              {hour === 0 && (
                <line
                  className="weather-midnight"
                  x1={x(h.at)}
                  x2={x(h.at)}
                  y1={top}
                  y2={bottom}
                />
              )}
              <text
                className={`weather-axis ${hour === 0 ? "day" : ""}`}
                x={x(h.at)}
                y={bottom + 18}
                textAnchor="middle"
              >
                {hour === 0
                  ? new Date(h.at).toLocaleDateString("fr-CH", {
                      timeZone: "Europe/Zurich",
                      weekday: "short",
                    })
                  : `${hour} h`}
              </text>
            </g>
          );
        })}
        <g className="weather-bars">
          {list.map((h, i) =>
            h.precipitation ? (
              <rect
                key={h.at}
                x={x(h.at) - barWidth / 2}
                y={bottom - pHeight(h.precipitation)}
                width={barWidth}
                height={pHeight(h.precipitation)}
                rx={2}
                style={{ animationDelay: `${i * 12}ms` }}
              />
            ) : null,
          )}
        </g>
        {area && (
          <path className="weather-area" d={area} fill="url(#weather-area)" />
        )}
        <path className="weather-gust" d={gustPath} pathLength={1} />
        <path
          className="weather-temp-line"
          d={tempPath}
          pathLength={1}
          stroke="url(#weather-line)"
        />
        {nowX !== null && (
          <g className="weather-now-marker">
            <line x1={nowX} x2={nowX} y1={top - 4} y2={bottom} />
            <text x={nowX} y={H - 8} textAnchor="middle">
              maintenant
            </text>
          </g>
        )}
        {picked && (
          <g className="weather-cursor">
            <line x1={x(picked.at)} x2={x(picked.at)} y1={top} y2={bottom} />
            {picked.temperature !== null && (
              <circle cx={x(picked.at)} cy={yT(picked.temperature)} r={4.5} />
            )}
            {picked.gusts !== null && (
              <circle
                className="g"
                cx={x(picked.at)}
                cy={yG(picked.gusts)}
                r={3.5}
              />
            )}
          </g>
        )}
      </svg>
      {picked && (
        <div
          className="weather-tip"
          style={{
            left: `${Math.min(82, Math.max(18, (x(picked.at) / W) * 100))}%`,
          }}
          role="status"
        >
          <strong>
            {new Date(picked.at).toLocaleString("fr-CH", {
              timeZone: "Europe/Zurich",
              weekday: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </strong>
          <span>{weatherLabel(picked.code)}</span>
          <span>
            <Thermometer size={12} /> {round(picked.temperature, 1)} °C
          </span>
          <span>
            <Umbrella size={12} /> {round(picked.precipitation, 1)} mm
            {picked.probability !== null && ` · ${round(picked.probability)} %`}
          </span>
          <span>
            <Wind size={12} /> {round(picked.wind)} km/h · rafales{" "}
            {round(picked.gusts)}
          </span>
        </div>
      )}
    </div>
  );
}
