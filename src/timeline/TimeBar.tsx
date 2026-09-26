import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronsLeft,
  ChevronsRight,
  Download,
  GitCompareArrows,
  History,
  MonitorPlay,
  MoreHorizontal,
  Pause,
  Play,
  Snowflake,
  X,
} from "lucide-react";
import { dateTime } from "../../shared/journal";
import { firstMoment, moments } from "../../shared/history";
import { useApp } from "../app/context";
import { localInput, fromInput } from "../ui/fields";
import { Popover } from "../ui/Popover";
import { SnapshotDialog } from "./SnapshotDialog";
import { onReplay, takeReplay } from "./playback";
import { rich } from "../i18n";
import { t, tn } from "./i18n.ts";
import "./timeline.css";

// Change by change (a step every `ms`), or in accelerated real time (the
// film of the operation: map, journal and resources move together).
const SPEEDS = [
  {
    id: "slow",
    get label() {
      return t("Lent");
    },
    ms: 1400,
    factor: 0,
  },
  {
    id: "normal",
    get label() {
      return t("Normal");
    },
    ms: 650,
    factor: 0,
  },
  {
    id: "fast",
    get label() {
      return t("Rapide");
    },
    ms: 220,
    factor: 0,
  },
  { id: "x10", label: "×10", ms: 200, factor: 10 },
  { id: "x60", label: "×60", ms: 200, factor: 60 },
] as const;
type Speed = (typeof SPEEDS)[number]["id"];
const BINS = 72;

/**
 * Time machine: the whole application shows the operation as it was at the
 * chosen moment (read only). Step through the changes, replay them like a
 * film, freeze a point of situation, compare, export or present that
 * version.
 */
export function TimeBar() {
  const {
    live,
    viewAt,
    setViewAt,
    go: goModule,
    exportCenter,
    present,
    workspace,
  } = useApp();
  const [clock, setClock] = useState(Date.now());
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<Speed>("normal");
  const [freeze, setFreeze] = useState(false);
  const [more, setMore] = useState<HTMLElement | null>(null);
  const steps = useMemo(() => moments(live), [live]);
  const start = useMemo(() => Date.parse(firstMoment(live)), [live]);
  const end = Math.max(clock, steps[steps.length - 1] ?? clock);
  const at = viewAt ?? end;
  const span = Math.max(1, end - start);
  const snapshots = useMemo(
    () => [...live.ops.snapshots].sort((a, b) => a.at.localeCompare(b.at)),
    [live.ops.snapshots],
  );
  const bins = useMemo(() => {
    const counts = new Array<number>(BINS).fill(0);
    for (const step of steps)
      counts[Math.min(BINS - 1, Math.floor(((step - start) / span) * BINS))]++;
    const top = Math.max(1, ...counts);
    return counts.map((c) => c / top);
  }, [steps, start, span]);
  const index = useMemo(() => {
    // Number of change moments up to the time shown.
    let lo = 0;
    let hi = steps.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (steps[mid] <= at) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  }, [steps, at]);
  // Moments of change still to come after the time shown.
  const pending = steps.length - index;
  const latest = useRef({ index, steps, at, end });
  latest.current = { index, steps, at, end };

  useEffect(() => {
    const timer = setInterval(() => setClock(Date.now()), 30_000);
    document.documentElement.dataset.past = "1";
    return () => {
      clearInterval(timer);
      delete document.documentElement.dataset.past;
    };
  }, []);
  // A replay asked by another screen (the debriefing).
  useEffect(() => {
    const take = () => {
      const asked = takeReplay();
      if (!asked) return;
      setSpeed(asked);
      setPlaying(true);
    };
    take();
    return onReplay(take);
  }, []);
  useEffect(() => {
    if (!playing) return;
    const { ms: delay, factor } = SPEEDS.find((s) => s.id === speed)!;
    if (factor) {
      let last = performance.now();
      const timer = setInterval(() => {
        const tick = performance.now();
        const { at: shown, end: stop } = latest.current;
        const next = Math.min(stop, shown + (tick - last) * factor);
        last = tick;
        setViewAt(next);
        if (next >= stop) setPlaying(false);
      }, delay);
      return () => clearInterval(timer);
    }
    const timer = setInterval(() => {
      const { index: i, steps: list } = latest.current;
      if (i >= list.length) {
        setPlaying(false);
        return;
      }
      setViewAt(list[i]);
    }, delay);
    return () => clearInterval(timer);
  }, [playing, speed, setViewAt]);

  const jump = (ms: number) => setViewAt(Math.min(end, Math.max(start, ms)));
  const previous = () => {
    // steps[index - 1] is the last change shown: go back to it when the
    // time shown is after it, else to the change before.
    const i = index > 0 && at > steps[index - 1] ? index - 1 : index - 2;
    jump(i >= 0 ? steps[i] : start);
  };
  const next = () => {
    if (index < steps.length) jump(steps[index]);
  };
  const compare = () => {
    setPlaying(false);
    goModule("trace");
  };
  const play = () => {
    if (!playing && (index >= steps.length || at >= end))
      setViewAt(steps[0] ?? start);
    setPlaying(!playing);
  };
  const percent = ((at - start) / span) * 100;
  const iso = new Date(at).toISOString();
  const closeMachine = () => {
    setPlaying(false);
    setViewAt(null);
  };

  return (
    <>
      <section
        className={`timebar${playing ? " playing" : ""}`}
        aria-label={t("Machine à remonter le temps")}
      >
        <div className="timebar-head">
          <span className="timebar-badge">
            <History size={13} />
            <span className="wide">{t("Version du")}</span>
          </span>
          <label className="timebar-when">
            <span className="sr-only">{t("Heure affichée")}</span>
            <input
              type="datetime-local"
              step={60}
              value={localInput(iso)}
              min={localInput(new Date(start).toISOString())}
              max={localInput(new Date(end).toISOString())}
              onChange={(e) => {
                const value = fromInput(e.target.value);
                if (value) jump(Date.parse(value));
              }}
            />
          </label>
          <span className="timebar-count mono">
            {index} / {steps.length}
            <span className="wide">
              {" "}
              · {tn(pending, "{n} changement après", "{n} changements après")}
            </span>
          </span>
          <div className="timebar-controls">
            <button
              className="icon-button"
              onClick={previous}
              disabled={index <= 1 && at <= start}
              aria-label={t("Changement précédent")}
              title={t("Changement précédent")}
            >
              <ChevronsLeft size={17} />
            </button>
            <button
              className="timebar-play"
              onClick={play}
              aria-label={playing ? t("Pause") : t("Rejouer l’opération")}
              title={
                playing
                  ? t("Pause")
                  : t("Rejouer l’opération changement par changement")
              }
            >
              {playing ? <Pause size={16} /> : <Play size={16} />}
            </button>
            <button
              className="icon-button"
              onClick={next}
              disabled={index >= steps.length}
              aria-label={t("Changement suivant")}
              title={t("Changement suivant")}
            >
              <ChevronsRight size={17} />
            </button>
            <div
              className="seg timebar-speed"
              role="group"
              aria-label={t("Vitesse")}
            >
              {SPEEDS.map((s) => (
                <button
                  key={s.id}
                  aria-pressed={speed === s.id}
                  onClick={() => setSpeed(s.id)}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
          <div className="timebar-actions">
            <button
              className="small tb-wide"
              onClick={() => setFreeze(true)}
              title={t("Donner un nom à ce moment (point de situation)")}
            >
              <Snowflake size={13} />
              {t("Figer")}
            </button>
            <button
              className="small tb-wide"
              onClick={compare}
              title={t("Voir ce qui a changé entre ce moment et maintenant")}
            >
              <GitCompareArrows size={13} />
              {t("Comparer")}
            </button>
            <button
              className="small tb-wide"
              onClick={() => exportCenter({ viewAt: at })}
              title={t("Exporter cette version")}
            >
              <Download size={13} />
              {t("Exporter")}
            </button>
            <button
              className="small tb-wide"
              onClick={() => present("present", { viewAt: at })}
              title={t("Présenter cette version")}
            >
              <MonitorPlay size={13} />
              {t("Présenter")}
            </button>
            <button
              className="icon-button tb-narrow"
              onClick={(e) => setMore(e.currentTarget)}
              aria-label={t("Autres actions")}
            >
              <MoreHorizontal size={17} />
            </button>
            <button className="primary small" onClick={closeMachine}>
              <X size={13} />
              {rich(t("<0>Retour au</0> direct"), [<span className="wide" />])}
            </button>
          </div>
        </div>
        <div className="timebar-track">
          <div className="timebar-bins" aria-hidden="true">
            {bins.map((v, i) => (
              <i
                key={i}
                style={{ height: `${Math.max(v ? 12 : 0, v * 100)}%` }}
                className={(i + 0.5) / BINS <= percent / 100 ? "past" : ""}
              />
            ))}
          </div>
          {snapshots.map((s) => {
            const flagAt = Date.parse(s.at);
            if (flagAt < start || flagAt > end) return null;
            return (
              <button
                key={s.id}
                className="timebar-flag"
                style={{ left: `${((flagAt - start) / span) * 100}%` }}
                onClick={() => jump(flagAt)}
                title={`${s.title} · ${dateTime(s.at)}`}
                aria-label={t("Point de situation {title}", { title: s.title })}
              >
                <Snowflake size={10} />
              </button>
            );
          })}
          <input
            type="range"
            className="timebar-range"
            min={start}
            max={end}
            step={1000}
            value={at}
            onChange={(e) => {
              setPlaying(false);
              jump(Number(e.target.value));
            }}
            aria-label={t("Moment affiché")}
            aria-valuetext={dateTime(iso)}
          />
          <div className="timebar-scale mono" aria-hidden="true">
            <span>{dateTime(new Date(start).toISOString())}</span>
            <span>{t("Maintenant")}</span>
          </div>
        </div>
      </section>
      {more && (
        <Popover anchor={more} onClose={() => setMore(null)} align="end">
          <button data-close onClick={() => setFreeze(true)}>
            <Snowflake size={15} />
            {t("Figer ce moment")}
          </button>
          <button data-close onClick={compare}>
            <GitCompareArrows size={15} />
            {t("Comparer avec maintenant")}
          </button>
          <button data-close onClick={() => exportCenter({ viewAt: at })}>
            <Download size={15} />
            {t("Exporter cette version")}
          </button>
          <button data-close onClick={() => present("present", { viewAt: at })}>
            <MonitorPlay size={15} />
            {t("Présenter cette version")}
          </button>
        </Popover>
      )}
      {freeze && (
        <SnapshotDialog
          at={at}
          onClose={() => setFreeze(false)}
          key={workspace.activeId}
        />
      )}
    </>
  );
}
