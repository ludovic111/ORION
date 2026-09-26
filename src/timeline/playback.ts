// A replay asked from elsewhere (the debriefing): the time bar, mounted
// when the time machine opens, takes the request and plays at that speed.

export type ReplaySpeed = "x10" | "x60";

let pending: ReplaySpeed | null = null;
const listeners = new Set<() => void>();

/** Ask the time bar to play in real time, accelerated. */
export function requestReplay(speed: ReplaySpeed) {
  pending = speed;
  listeners.forEach((l) => l());
}

/** The pending request, once. */
export function takeReplay(): ReplaySpeed | null {
  const value = pending;
  pending = null;
  return value;
}

export function onReplay(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
