import { translator, type Dict } from "./core.ts";

// Signature of the exports (shared/signature.ts).
export const { t, tn, tIn, dict } = translator({
  "Signature impossible dans ce navigateur ({reason}).": {
    de: "Signieren in diesem Browser nicht möglich ({reason}).",
    it: "Firma impossibile in questo browser ({reason}).",
  },
} satisfies Dict);
