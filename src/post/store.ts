import { useSyncExternalStore } from "react";
import { allKinds, type AlarmKind } from "../../shared/alarms";
import type { Module } from "../../shared/links";

// Settings of this post (this browser) for the conduct features: its
// function, its cell, where it lands, how alerts reach it. Kept apart from
// src/app/prefs.ts (appearance and printing) and never part of the session:
// each post of the command post chooses its own.

export type PostSettings = {
  /** Function of this post ("Logistique"); "" = not chosen. */
  role: string;
  /** Cell or post of the team this post belongs to. */
  cell: string;
  /** Module opened when the session opens ("" = from the function). */
  landing: Module | "";
  /** Browser notifications (permission asked when turned on). */
  notify: boolean;
  /** Short tone made by the browser (no sound file). */
  sound: boolean;
  /** Minutes before a rendez-vous (rapport). */
  agendaLead: number;
  kinds: Record<AlarmKind, boolean>;
  /** Quiet hours: no sound, only urgent notifications. */
  quiet: boolean;
  quietFrom: string;
  quietTo: string;
};

const KEY = "orion-aic-post";
export const DEFAULT_POST: PostSettings = {
  role: "",
  cell: "",
  landing: "",
  notify: false,
  sound: false,
  agendaLead: 5,
  kinds: allKinds(),
  quiet: false,
  quietFrom: "22:00",
  quietTo: "06:00",
};

function read(): PostSettings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_POST;
    const value = JSON.parse(raw) as Partial<PostSettings>;
    return {
      ...DEFAULT_POST,
      ...value,
      kinds: { ...allKinds(), ...(value.kinds ?? {}) },
    };
  } catch {
    return DEFAULT_POST;
  }
}

let state: PostSettings | null = null;
const listeners = new Set<() => void>();

/** Settings of this post, outside React (pure functions, services). */
export const readPost = (): PostSettings => (state ??= read());

export function setPost(patch: Partial<PostSettings>) {
  state = { ...readPost(), ...patch };
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Private window: kept until the page closes.
  }
  listeners.forEach((l) => l());
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  const storage = (e: StorageEvent) => {
    if (e.key === KEY) {
      state = read();
      listener();
    }
  };
  window.addEventListener("storage", storage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", storage);
  };
};

export function usePost(): [PostSettings, typeof setPost] {
  const value = useSyncExternalStore(subscribe, readPost, readPost);
  return [value, setPost];
}
