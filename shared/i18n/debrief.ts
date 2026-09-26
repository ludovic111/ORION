import { translator, type Dict } from "./core.ts";

// Debriefing (RETEX) measures (shared/debrief.ts).
export const { t, tn, tIn, dict } = translator({
  "moins de 5 min": { de: "unter 5 Min.", it: "meno di 5 min" },
  "5 à 15 min": { de: "5 bis 15 Min.", it: "5–15 min" },
  "15 à 30 min": { de: "15 bis 30 Min.", it: "15–30 min" },
  "30 à 60 min": { de: "30 bis 60 Min.", it: "30–60 min" },
  "plus d’une heure": { de: "über eine Stunde", it: "oltre un’ora" },
  "pas encore traités": {
    de: "noch nicht bearbeitet",
    it: "non ancora trattati",
  },
} satisfies Dict);
