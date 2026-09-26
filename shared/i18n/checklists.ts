import { translator, type Dict } from "./core.ts";

// Texts of shared/checklists.ts: default names of lists, the journal entry
// written when a step is ticked, errors.

export const { t, tn, tIn, dict } = translator({
  "Liste sans nom": { de: "Liste ohne Namen", it: "Lista senza nome" },
  "{name} (copie)": { de: "{name} (Kopie)", it: "{name} (copia)" },
  "Liste de contrôle introuvable.": {
    de: "Checkliste nicht gefunden.",
    it: "Lista di controllo non trovata.",
  },
  "Étape introuvable.": {
    de: "Schritt nicht gefunden.",
    it: "Passo non trovato.",
  },
  "{title} : {step}. Contrôle à {time}.": {
    de: "{title}: {step}. Kontrolle um {time}.",
    it: "{title}: {step}. Controllo alle {time}.",
  },
  "{title} : {step}.": {
    de: "{title}: {step}.",
    it: "{title}: {step}.",
  },
  "Contrôler : {step}": {
    de: "Kontrollieren: {step}",
    it: "Controllare: {step}",
  },
  "liste de contrôle": { de: "Checkliste", it: "lista di controllo" },
} satisfies Dict);
