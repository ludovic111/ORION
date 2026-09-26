import { useEffect, useRef, useState } from "react";
import { AlarmClockPlus, Bell, BellOff, Check } from "lucide-react";
import {
  current,
  needsFollowUp,
  numberLabel,
  overdue,
  time,
  type Entry,
  type Journal,
} from "../../shared/journal";
import { t, tn } from "./i18n.ts";

const SOON = 15 * 60_000;
const STORAGE = "orion-alert-sound";
let audio: AudioContext | null = null;

function beep() {
  if (!audio) return;
  const start = audio.currentTime;
  [0, 0.22].forEach((offset) => {
    const osc = audio!.createOscillator();
    const gain = audio!.createGain();
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.0001, start + offset);
    gain.gain.exponentialRampToValueAtTime(0.25, start + offset + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + offset + 0.16);
    osc.connect(gain).connect(audio!.destination);
    osc.start(start + offset);
    osc.stop(start + offset + 0.18);
  });
}

const readSound = () => {
  try {
    return localStorage.getItem(STORAGE) === "1";
  } catch {
    return false;
  }
};

function relative(ms: number) {
  const minutes = Math.round(Math.abs(ms) / 60_000);
  const label =
    minutes < 60
      ? `${minutes} min`
      : `${Math.floor(minutes / 60)} h ${minutes % 60} min`;
  return ms < 0
    ? t("dépassée de {d}", { d: label })
    : t("dans {d}", { d: label });
}

/** Due and overdue follow-ups, with snooze, completion and an audible alarm. */
export function Alerts({
  journal,
  at,
  readOnly,
  onOpen,
  onSnooze,
  onDone,
}: {
  journal: Journal;
  at: number;
  readOnly: boolean;
  onOpen: (id: string) => void;
  onSnooze: (entry: Entry, minutes: number) => void;
  onDone: (entry: Entry) => void;
}) {
  const [sound, setSound] = useState(readSound);
  const known = useRef<Set<string> | null>(null);
  const due = journal.entries
    .filter((e) => needsFollowUp(e) && current(e).dueAt)
    .filter((e) => Date.parse(current(e).dueAt) - at < SOON)
    .sort(
      (a, b) => Date.parse(current(a).dueAt) - Date.parse(current(b).dueAt),
    );
  const late = due.filter((e) => overdue(e, at));
  const lateKey = late.map((e) => e.id).join();
  useEffect(() => {
    const ids = new Set(lateKey ? lateKey.split(",") : []);
    const fresh =
      known.current && [...ids].some((id) => !known.current!.has(id));
    if (fresh && sound) beep();
    known.current = ids;
  }, [lateKey, sound]);
  useEffect(() => {
    known.current = null;
  }, [journal.id]);
  function toggleSound() {
    const next = !sound;
    if (next) {
      audio ??= new AudioContext();
      void audio.resume();
      beep();
    }
    try {
      localStorage.setItem(STORAGE, next ? "1" : "0");
    } catch {
      /* preference only */
    }
    setSound(next);
  }
  if (!due.length)
    return (
      <div className="alerts-idle">
        <button
          className="link muted"
          onClick={toggleSound}
          title={t("Signal sonore quand une échéance est dépassée")}
        >
          {sound ? <Bell size={12} /> : <BellOff size={12} />}
          {sound ? t("Alarme échéances active") : t("Alarme échéances muette")}
        </button>
      </div>
    );
  const shown = due.slice(0, 4);
  return (
    <section
      className={`alerts ${late.length ? "crit" : "warn"}`}
      aria-label={t("Échéances")}
    >
      <header>
        <span className="label">
          {late.length
            ? tn(
                late.length,
                "{n} échéance dépassée",
                "{n} échéances dépassées",
              )
            : t("Échéances proches")}
          {due.length > late.length &&
            ` · ${t("{n} dans moins de 15 min", { n: due.length - late.length })}`}
        </span>
        <button
          className="icon-button"
          onClick={toggleSound}
          aria-pressed={sound}
          title={sound ? t("Couper l’alarme") : t("Activer l’alarme sonore")}
          aria-label={
            sound ? t("Couper l’alarme") : t("Activer l’alarme sonore")
          }
        >
          {sound ? <Bell size={14} /> : <BellOff size={14} />}
        </button>
      </header>
      <ul>
        {shown.map((e) => {
          const f = current(e);
          const delta = Date.parse(f.dueAt) - at;
          return (
            <li key={e.id} className={delta < 0 ? "late" : ""}>
              <button className="alert-open" onClick={() => onOpen(e.id)}>
                <span className="mono">{numberLabel(e)}</span>
                <span className="alert-text">{f.message}</span>
              </button>
              <span className="alert-when mono">
                {time(f.dueAt)} · {relative(delta)}
              </span>
              <span className="alert-who">{f.assignee || "—"}</span>
              {!readOnly && (
                <span className="alert-actions">
                  <button className="small" onClick={() => onSnooze(e, 15)}>
                    <AlarmClockPlus size={13} />
                    +15 min
                  </button>
                  <button className="small" onClick={() => onDone(e)}>
                    <Check size={13} />
                    {t("Terminé (action)")}
                  </button>
                </span>
              )}
            </li>
          );
        })}
      </ul>
      {due.length > shown.length && (
        <footer className="muted">
          {tn(
            due.length - shown.length,
            "+ {n} autre · filtre « À suivre »",
            "+ {n} autres · filtre « À suivre »",
          )}
        </footer>
      )}
    </section>
  );
}
