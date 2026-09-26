import { useCallback, useEffect, useState } from "react";
import {
  isDarkPalette,
  isLightPalette,
  paletteOf,
  type PaletteId,
} from "./palettes";

// Preferences of this post (this browser). Not part of the session: another
// post keeps its own theme, printer options and visible modules.
export type Prefs = {
  theme: "dark" | "light" | "auto";
  /** Colour theme used in light mode (see palettes.ts). */
  lightPalette: PaletteId;
  /** Colour theme used in dark mode. */
  darkPalette: PaletteId;
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
  /** Microphone button for voice dictation (off: audio may leave the post). */
  dictation: boolean;
};
const KEY = "orion-aic-prefs";
export const DEFAULT_PREFS: Prefs = {
  theme: "light",
  lightPalette: "papier",
  darkPalette: "graphite",
  motion: "full",
  hidden: [],
  autoPrint: false,
  autoPrintRemote: false,
  autoPrintMessages: false,
  docsLevel: "guide",
  dictation: false,
};
// The editorial design (cream paper) replaced the deep-space look: posts
// still on the former default dark theme switch to it once.
const DESIGN = "orion-aic-design";
function read(): Prefs {
  try {
    const raw = localStorage.getItem(KEY);
    const prefs: Prefs = raw
      ? { ...DEFAULT_PREFS, ...JSON.parse(raw) }
      : DEFAULT_PREFS;
    // A palette removed or mistyped falls back to the default of its mode.
    if (!isLightPalette(prefs.lightPalette))
      prefs.lightPalette = DEFAULT_PREFS.lightPalette;
    if (!isDarkPalette(prefs.darkPalette))
      prefs.darkPalette = DEFAULT_PREFS.darkPalette;
    if (typeof prefs.dictation !== "boolean") prefs.dictation = false;
    if (localStorage.getItem(DESIGN) !== "atelier") {
      localStorage.setItem(DESIGN, "atelier");
      if (prefs.theme === "dark") return { ...prefs, theme: "light" };
    }
    return prefs;
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
      const palette = light ? prefs.lightPalette : prefs.darkPalette;
      root.dataset.palette = palette;
      root.dataset.motion =
        prefs.motion === "reduced" ||
        matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "reduced"
          : "full";
      document
        .querySelector('meta[name="theme-color"]')
        ?.setAttribute(
          "content",
          paletteOf(palette)?.swatch[0] ?? (light ? "#e4dfd9" : "#121110"),
        );
    };
    apply();
    const media = matchMedia("(prefers-color-scheme: light)");
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [prefs.theme, prefs.motion, prefs.lightPalette, prefs.darkPalette]);
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
