import { useSyncExternalStore } from "react";
import type { Fix, TrailPoint, Unit } from "../../shared/live";

// State of the live positions, shared by the host (src/live/LiveHost.tsx,
// which runs the geolocation and the messages) and the map. A small store
// outside React's tree: its updates (every few seconds) re-render only the
// components reading it, never the whole application.

export type Sharing = {
  label: string;
  ref: string;
  since: number;
  wake: boolean;
  recording: boolean;
  /** Latest fix of the device, null while waiting for the GPS. */
  fix: Fix | null;
  /** Last send (clock of this post), null before the first. */
  sentAt: number | null;
  /** The last send reached the relay (false: not connected). */
  delivered: boolean;
  error: string;
  /** Points of the recorded track (kept in memory on this post). */
  track: TrailPoint[];
};
export type LiveState = {
  /** Teams seen, this post included when it shares. */
  units: Unit[];
  /** Clock of the ages, ticking while something is shown. */
  now: number;
  sharing: Sharing | null;
  /** Live synchronisation on: the others can receive. */
  connected: boolean;
};
export type LiveActions = {
  /** Open the consent screen (or the sharing panel when sharing). */
  openShare: () => void;
  stop: () => void;
};

let state: LiveState = {
  units: [],
  now: Date.now(),
  sharing: null,
  connected: false,
};
const listeners = new Set<() => void>();
export const liveStore = {
  get: () => state,
  set(patch: Partial<LiveState>) {
    state = { ...state, ...patch };
    for (const l of listeners) l();
  },
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};
/** Replaced by the host while a session is open. */
export const liveActions: LiveActions = {
  openShare: () => {},
  stop: () => {},
};

export const useLive = () =>
  useSyncExternalStore(liveStore.subscribe, liveStore.get, liveStore.get);
