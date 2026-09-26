import { translator, type Dict } from "../../../shared/i18n/core.ts";

// Groups of the help topics (content.tsx). The topics themselves are
// written once per language: content*.tsx (French), de/, it/.
export const { t, dict } = translator({
  "Bien démarrer": { de: "Erste Schritte", it: "Per iniziare" },
  Modules: { de: "Module", it: "Moduli" },
  "Travailler ensemble": { de: "Zusammenarbeiten", it: "Lavorare insieme" },
  Référence: { de: "Nachschlagen", it: "Riferimento" },
} satisfies Dict);
