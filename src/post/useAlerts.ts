import { useEffect, useMemo, useRef } from "react";
import type { Journal } from "../../shared/journal";
import type { Identity } from "../../shared/diffusion";
import {
  computeAlarms,
  delivery,
  dueAlarms,
  inQuietHours,
  nextAlarmAt,
  type Alarm,
  type AlarmMemory,
} from "../../shared/alarms";
import type { Ref } from "../../shared/links";
import { playTone, showNotification } from "./notify";
import type { PostSettings } from "./store";

// Schedules the alerts of this post (shared/alarms.ts): a timer until the
// next one, a check every 30 s and at every change of the journal (an
// urgent message arriving from another post). Works with the tab in the
// background: browsers slow the timers down to about once a minute there,
// which is enough for due times given to the minute.

const memoryKey = (journalId: string) => `orion-aic-alarms:${journalId}`;
function loadMemory(journalId: string): AlarmMemory | null {
  try {
    const raw = localStorage.getItem(memoryKey(journalId));
    if (!raw) return null;
    const value = JSON.parse(raw) as AlarmMemory;
    return typeof value.since === "number" && Array.isArray(value.known)
      ? value
      : null;
  } catch {
    return null;
  }
}
function saveMemory(journalId: string, memory: AlarmMemory) {
  try {
    localStorage.setItem(memoryKey(journalId), JSON.stringify(memory));
  } catch {
    // Private window: the memory lasts until the page closes.
  }
}

export function useAlerts({
  journal,
  me,
  post,
  now,
  open,
  toast,
}: {
  journal: Journal;
  me: Identity;
  post: PostSettings;
  now: number;
  open: (ref: Ref) => void;
  toast: (text: string) => void;
}) {
  const alarms = useMemo(
    () =>
      computeAlarms(
        journal,
        me,
        { kinds: post.kinds, agendaLead: post.agendaLead },
        // Recomputed each minute (overdue states), not at each render.
        now,
      ),
    [journal, me, post.kinds, post.agendaLead, now],
  );
  const state = useRef({ alarms, post, open, toast, journalId: journal.id });
  state.current = { alarms, post, open, toast, journalId: journal.id };
  const memory = useRef<{ id: string; value: AlarmMemory | null } | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const check = () => {
      const s = state.current;
      if (memory.current?.id !== s.journalId)
        memory.current = { id: s.journalId, value: loadMemory(s.journalId) };
      const at = Date.now();
      const { ring, memory: next } = dueAlarms(
        s.alarms,
        memory.current.value,
        at,
      );
      memory.current.value = next;
      saveMemory(s.journalId, next);
      if (ring.length) deliver(ring, s.post, s.open, s.toast, at);
      clearTimeout(timer);
      const upcoming = nextAlarmAt(s.alarms, at);
      if (upcoming !== null)
        timer = setTimeout(
          check,
          Math.min(Math.max(250, upcoming - at + 50), 2 ** 31 - 1),
        );
    };
    check();
    const interval = setInterval(check, 30_000);
    const visible = () => document.visibilityState === "visible" && check();
    document.addEventListener("visibilitychange", visible);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
      document.removeEventListener("visibilitychange", visible);
    };
  }, [alarms]);
}

function deliver(
  ring: Alarm[],
  post: PostSettings,
  open: (ref: Ref) => void,
  toast: (text: string) => void,
  at: number,
) {
  const quiet = post.quiet && inQuietHours(at, post.quietFrom, post.quietTo);
  const hidden = document.visibilityState !== "visible";
  let sound = false;
  let urgentSound = false;
  const notify: Alarm[] = [];
  for (const a of ring) {
    const how = delivery(a, quiet, { notify: post.notify, sound: post.sound });
    if (how.notify) notify.push(a);
    if (how.sound) {
      sound = true;
      urgentSound ||= a.urgent;
    }
  }
  if (notify.length > 3) {
    void showNotification(
      `orion aic · ${notify.length} alertes`,
      notify
        .slice(0, 4)
        .map((a) => a.title)
        .join("\n"),
      "orion-aic-batch",
      () => open(notify[0].ref as Ref),
    );
  } else
    for (const a of notify)
      void showNotification(a.title, a.body, a.key, () => open(a.ref as Ref));
  if (sound) playTone(urgentSound);
  // In the page, one short line (the notification may be turned off).
  if (!hidden)
    toast(
      ring.length === 1
        ? `${ring[0].title}${ring[0].body ? ` — ${ring[0].body}` : ""}`
        : `${ring.length} alertes : ${ring
            .slice(0, 3)
            .map((a) => a.title)
            .join(" · ")}`,
    );
}
