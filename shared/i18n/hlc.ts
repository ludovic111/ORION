import { translator, type Dict } from "./core.ts";

// Stamps of the changes (shared/hlc.ts).
export const { t, tn, tIn, dict } = translator({
  "Horodatage invalide.": {
    de: "Ungültiger Zeitstempel.",
    it: "Marca temporale non valida.",
  },
} satisfies Dict);
