import { translator, type Dict } from "./core.ts";

// Texts of shared/conduct-links.ts: checklists, requests for resources and
// shifts as items of the link graph, and their relation labels.
export const { t, tn, tIn, dict } = translator({
  "{done}/{total} étapes": {
    de: "{done}/{total} Schritte",
    it: "{done}/{total} passi",
  },
  "close (liste)": { fr: "close", de: "abgeschlossen", it: "chiusa" },
  // French keeps "contrôle(s)" in both forms (unchanged wording).
  "{n} contrôle(s) en retard (un)": {
    fr: "{n} contrôle(s) en retard",
    de: "{n} Kontrolle überfällig",
    it: "{n} controllo in ritardo",
  },
  "{n} contrôle(s) en retard": {
    de: "{n} Kontrollen überfällig",
    it: "{n} controlli in ritardo",
  },
  "arrivée {time}": { de: "Ankunft {time}", it: "arrivo {time}" },
  "{start}–{end} · {n} pers.": {
    de: "{start}–{end} · {n} Pers.",
    it: "{start}–{end} · {n} pers.",
  },
  "étape consignée": { de: "Schritt erfasst", it: "passo registrato" },
  "moyen livré": { de: "geliefertes Mittel", it: "mezzo fornito" },
  demande: { de: "Anforderung", it: "richiesta" },
  "de relève": { de: "in Ablösung", it: "di avvicendamento" },
} satisfies Dict);
