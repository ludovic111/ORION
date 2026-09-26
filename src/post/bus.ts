import { useSyncExternalStore } from "react";

// Dialogs of the conduct features that any screen may open (a "Diffuser"
// button on a message, an entry, an order…) without going through the
// shell: the request is kept here and shown by ConductLayer.

export type DiffusionPreset = {
  title?: string;
  body?: string;
  kind?: string;
  priority?: "Normal" | "Important" | "Urgent";
  target?: string;
  recipients?: string[];
  ack?: "Lu" | "Compris" | "Aucun";
  /** Called with the id of the diffusion once sent. */
  onSent?: (id: string) => void;
};
export type AssignPreset = { target?: string; role?: string; note?: string };

type Request =
  | { kind: "diffusion"; preset: DiffusionPreset }
  | { kind: "assign"; preset: AssignPreset }
  | { kind: "liaison-message"; liaisonId?: string }
  | null;

let current: Request = null;
const listeners = new Set<() => void>();
const set = (value: Request) => {
  current = value;
  listeners.forEach((l) => l());
};

export const openDiffusion = (preset: DiffusionPreset = {}) =>
  set({ kind: "diffusion", preset });
export const openAssign = (preset: AssignPreset = {}) =>
  set({ kind: "assign", preset });
export const openLiaisonMessage = (liaisonId?: string) =>
  set({ kind: "liaison-message", liaisonId });
export const closeRequest = () => set(null);

export function useRequest(): Request {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => current,
    () => current,
  );
}
