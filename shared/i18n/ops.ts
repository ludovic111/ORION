import { translator, type Dict } from "./core.ts";

// Texts of shared/ops.ts (validation messages shown to the operators).
export const { t, tn, tIn, dict } = translator({
  "Image invalide.": { de: "Ungültiges Bild.", it: "Immagine non valida." },
} satisfies Dict);
