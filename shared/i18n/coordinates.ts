import { translator, type Dict } from "./core.ts";

// Swiss coordinates (shared/coordinates.ts).
export const { t, tn, tIn, dict } = translator({
  "Coordonnées hors du périmètre suisse.": {
    de: "Koordinaten ausserhalb des Schweizer Gebiets.",
    it: "Coordinate al di fuori del territorio svizzero.",
  },
  "Coordonnées MN95 hors du périmètre suisse.": {
    de: "LV95-Koordinaten ausserhalb des Schweizer Gebiets.",
    it: "Coordinate MN95 al di fuori del territorio svizzero.",
  },
} satisfies Dict);
