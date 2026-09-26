import { useCallback, useSyncExternalStore } from "react";
import { t } from "./i18n.ts";

// « Direction d’exercice » on this post: shows the scenario and delivers the
// injects. Kept in this browser only (localStorage), per journal, behind a
// short code chosen by the direction. It keeps the players from opening the
// scenario by mistake; it is not a security measure (the scenario travels
// with the journal, like every other record).

type Stored = { on: boolean; pin: string };
const KEY = (journalId: string) => `orion-aic-direction:${journalId}`;
const EVENT = "orion-aic-direction";

function read(journalId: string): Stored | null {
  try {
    const raw = localStorage.getItem(KEY(journalId));
    if (!raw) return null;
    const value = JSON.parse(raw) as Partial<Stored>;
    return typeof value.pin === "string"
      ? { on: !!value.on, pin: value.pin }
      : null;
  } catch {
    return null;
  }
}
function write(journalId: string, value: Stored | null) {
  try {
    if (value) localStorage.setItem(KEY(journalId), JSON.stringify(value));
    else localStorage.removeItem(KEY(journalId));
  } catch {
    // Private window without storage: the mode lasts until reload.
    memory.set(journalId, value);
  }
  window.dispatchEvent(new Event(EVENT));
}
const memory = new Map<string, Stored | null>();
const current = (journalId: string) =>
  memory.has(journalId) ? memory.get(journalId)! : read(journalId);

async function hash(journalId: string, pin: string) {
  const bytes = new TextEncoder().encode(
    `orion-aic-direction:${journalId}:${pin.trim()}`,
  );
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export const PIN_RULE = /^\d{4,8}$/;

/** Direction mode of this post for a journal. */
export function useDirector(journalId: string) {
  const snapshot = useSyncExternalStore(
    (change) => {
      window.addEventListener(EVENT, change);
      window.addEventListener("storage", change);
      return () => {
        window.removeEventListener(EVENT, change);
        window.removeEventListener("storage", change);
      };
    },
    () => JSON.stringify(current(journalId)),
  );
  const state = JSON.parse(snapshot) as Stored | null;
  /** First time: choose the code. Then: the code opens the mode. */
  const enter = useCallback(
    async (pin: string): Promise<string | null> => {
      if (!PIN_RULE.test(pin.trim()))
        return t("Le code compte 4 à 8 chiffres.");
      const digest = await hash(journalId, pin);
      const stored = current(journalId);
      if (stored && stored.pin !== digest) return t("Code incorrect.");
      write(journalId, { on: true, pin: digest });
      return null;
    },
    [journalId],
  );
  const leave = useCallback(() => {
    const stored = current(journalId);
    if (stored) write(journalId, { ...stored, on: false });
  }, [journalId]);
  /** Forget the code (asked again next time), with the code. */
  const forget = useCallback(
    async (pin: string): Promise<string | null> => {
      const stored = current(journalId);
      if (stored && stored.pin !== (await hash(journalId, pin)))
        return t("Code incorrect.");
      write(journalId, null);
      return null;
    },
    [journalId],
  );
  return {
    on: !!state?.on,
    hasPin: !!state,
    enter,
    leave,
    forget,
  };
}
