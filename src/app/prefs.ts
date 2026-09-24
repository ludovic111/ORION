import { useCallback, useEffect, useState } from "react";

// Preferences of this post (this browser). Not part of the session: another
// post keeps its own theme, printer options and visible modules.
export type Prefs = {
  theme: "dark" | "light" | "auto";
  motion: "full" | "reduced";
  /** Modules hidden from the dock. */
  hidden: string[];
  /** Print each new journal entry as soon as it is recorded. */
  autoPrint: boolean;
  /** Also print entries recorded on other synchronised posts. */
  autoPrintRemote: boolean;
  /** Print each new message of the intake. */
  autoPrintMessages: boolean;
  /** Details level of the documentation. */
  docsLevel: "short" | "guide" | "full";
};
const KEY = "orion-aic-prefs";
export const DEFAULT_PREFS: Prefs = {
  theme: "dark",
  motion: "full",
  hidden: [],
  autoPrint: false,
  autoPrintRemote: false,
  autoPrintMessages: false,
  docsLevel: "guide",
};
function read(): Prefs {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULT_PREFS, ...JSON.parse(raw) } : DEFAULT_PREFS;
  } catch {
    return DEFAULT_PREFS;
  }
}
export function usePrefs() {
  const [prefs, set] = useState<Prefs>(read);
  useEffect(() => {
    const root = document.documentElement;
    const apply = () => {
      const light =
        prefs.theme === "light" ||
        (prefs.theme === "auto" &&
          matchMedia("(prefers-color-scheme: light)").matches);
      root.dataset.theme = light ? "light" : "dark";
      root.dataset.motion =
        prefs.motion === "reduced" ||
        matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "reduced"
          : "full";
      document
        .querySelector('meta[name="theme-color"]')
        ?.setAttribute("content", light ? "#eef0f9" : "#05060d");
    };
    apply();
    const media = matchMedia("(prefers-color-scheme: light)");
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [prefs.theme, prefs.motion]);
  const setPrefs = useCallback((patch: Partial<Prefs>) => {
    set((previous) => {
      const next = { ...previous, ...patch };
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);
  return [prefs, setPrefs] as const;
}
