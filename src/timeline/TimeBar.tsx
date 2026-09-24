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
import "./timeline.css";

const SPEEDS = [
  { id: "slow", label: "Lent", ms: 1400 },
  { id: "normal", label: "Normal", ms: 650 },
  { id: "fast", label: "Rapide", ms: 220 },
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
    for (const t of steps)
      counts[Math.min(BINS - 1, Math.floor(((t - start) / span) * BINS))]++;
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
  const latest = useRef({ index, steps });
  latest.current = { index, steps };

  useEffect(() => {
    const timer = setInterval(() => setClock(Date.now()), 30_000);
    document.documentElement.dataset.past = "1";
    return () => {
      clearInterval(timer);
      delete document.documentElement.dataset.past;
    };
  }, []);
  useEffect(() => {
    if (!playing) return;
    const delay = SPEEDS.find((s) => s.id === speed)!.ms;
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

  const jump = (t: number) => setViewAt(Math.min(end, Math.max(start, t)));
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
    if (!playing && index >= steps.length) setViewAt(steps[0] ?? start);
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
        aria-label="Machine à remonter le temps"
      >
        <div className="timebar-head">
          <span className="timebar-badge">
            <History size={13} />
            <span className="wide">Version du</span>
          </span>
          <label className="timebar-when">
            <span className="sr-only">Heure affichée</span>
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
              · {pending} changement{pending > 1 ? "s" : ""} après
            </span>
          </span>
          <div className="timebar-controls">
            <button
              className="icon-button"
              onClick={previous}
              disabled={index <= 1 && at <= start}
              aria-label="Changement précédent"
              title="Changement précédent"
            >
              <ChevronsLeft size={17} />
            </button>
            <button
              className="timebar-play"
              onClick={play}
              aria-label={playing ? "Pause" : "Rejouer l’opération"}
              title={
                playing
                  ? "Pause"
                  : "Rejouer l’opération changement par changement"
              }
            >
              {playing ? <Pause size={16} /> : <Play size={16} />}
            </button>
            <button
              className="icon-button"
              onClick={next}
              disabled={index >= steps.length}
              aria-label="Changement suivant"
              title="Changement suivant"
            >
              <ChevronsRight size={17} />
            </button>
            <div
              className="seg timebar-speed"
              role="group"
              aria-label="Vitesse"
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
              title="Donner un nom à ce moment (point de situation)"
            >
              <Snowflake size={13} />
              Figer
            </button>
            <button
              className="small tb-wide"
              onClick={compare}
              title="Voir ce qui a changé entre ce moment et maintenant"
            >
              <GitCompareArrows size={13} />
              Comparer
            </button>
            <button
              className="small tb-wide"
              onClick={() => exportCenter({ viewAt: at })}
              title="Exporter cette version"
            >
              <Download size={13} />
              Exporter
            </button>
            <button
              className="small tb-wide"
              onClick={() => present("present", { viewAt: at })}
              title="Présenter cette version"
            >
              <MonitorPlay size={13} />
              Présenter
            </button>
            <button
              className="icon-button tb-narrow"
              onClick={(e) => setMore(e.currentTarget)}
              aria-label="Autres actions"
            >
              <MoreHorizontal size={17} />
            </button>
            <button className="primary small" onClick={closeMachine}>
              <X size={13} />
              <span className="wide">Retour au</span> direct
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
            const t = Date.parse(s.at);
            if (t < start || t > end) return null;
            return (
              <button
                key={s.id}
                className="timebar-flag"
                style={{ left: `${((t - start) / span) * 100}%` }}
                onClick={() => jump(t)}
                title={`${s.title} · ${dateTime(s.at)}`}
                aria-label={`Point de situation ${s.title}`}
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
            aria-label="Moment affiché"
            aria-valuetext={dateTime(iso)}
          />
          <div className="timebar-scale mono" aria-hidden="true">
            <span>{dateTime(new Date(start).toISOString())}</span>
            <span>Maintenant</span>
          </div>
        </div>
      </section>
      {more && (
        <Popover anchor={more} onClose={() => setMore(null)} align="end">
          <button data-close onClick={() => setFreeze(true)}>
            <Snowflake size={15} />
            Figer ce moment
          </button>
          <button data-close onClick={compare}>
            <GitCompareArrows size={15} />
            Comparer avec maintenant
          </button>
          <button data-close onClick={() => exportCenter({ viewAt: at })}>
            <Download size={15} />
            Exporter cette version
          </button>
          <button data-close onClick={() => present("present", { viewAt: at })}>
            <MonitorPlay size={15} />
            Présenter cette version
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
