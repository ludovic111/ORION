import { useEffect, useState } from "react";
import type { AgendaItem } from "../../../shared/ops";

/** Current time, refreshed every `ms` while the page is visible. */
export function useTicker(ms = 1000, active = true) {
  const [at, setAt] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    let timer: ReturnType<typeof setInterval> | undefined;
    const start = () => {
      clearInterval(timer);
      setAt(Date.now());
      if (document.visibilityState === "visible")
        timer = setInterval(() => setAt(Date.now()), ms);
    };
    start();
    document.addEventListener("visibilitychange", start);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", start);
    };
  }, [ms, active]);
  return at;
}

const pad = (v: number) => String(v).padStart(2, "0");

/** "dans 12 min 04 s", "dans 2 h 05", "il y a 5 min". */
export function countdown(target: number, at: number, seconds = true) {
  const diff = target - at;
  const abs = Math.abs(diff);
  const s = Math.floor(abs / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  let text: string;
  if (d > 0) text = `${d} j ${h} h`;
  else if (h > 0) text = `${h} h ${pad(m)}`;
  else if (m > 0) text = seconds ? `${m} min ${pad(sec)} s` : `${m} min`;
  else text = seconds ? `${sec} s` : "moins d’une minute";
  return diff >= 0 ? `dans ${text}` : `il y a ${text}`;
}

/** Next full hour from now (at least 10 minutes ahead). */
export function nextRoundHour(at = Date.now()) {
  const d = new Date(at + 10 * 60000);
  d.setMinutes(0, 0, 0);
  d.setHours(d.getHours() + 1);
  return d.toISOString();
}

export const endOf = (item: AgendaItem) =>
  Date.parse(item.at) + item.minutes * 60000;

/** Items not done and not over, soonest first. */
export function upcoming(items: AgendaItem[], at: number) {
  return items
    .filter((i) => !i.done && endOf(i) >= at)
    .sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
}

export const zurichDay = (value: number) =>
  new Date(value).toLocaleDateString("sv-SE", { timeZone: "Europe/Zurich" });

export const dayLabel = (value: number) =>
  new Date(value).toLocaleDateString("fr-CH", {
    timeZone: "Europe/Zurich",
    weekday: "long",
    day: "numeric",
    month: "long",
  });

export const duration = (minutes: number) =>
  minutes >= 60
    ? `${Math.floor(minutes / 60)} h${minutes % 60 ? ` ${pad(minutes % 60)}` : ""}`
    : `${minutes} min`;
