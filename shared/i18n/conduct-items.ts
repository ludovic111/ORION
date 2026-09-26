import { translator, type Dict } from "./core.ts";

// Texts of shared/conduct-items.ts: orders and diffusions as items of the
// link graph, and their relation labels.
export const { t, tn, tIn, dict } = translator({
  "Ordre {number} · {title}": {
    de: "Befehl {number} · {title}",
    it: "Ordine {number} · {title}",
  },
  "de {source}": { de: "von {source}", it: "da {source}" },
  "sans accusé": { de: "ohne Lesebestätigung", it: "senza conferma" },
  "{n} sans accusé": {
    de: "{n} ohne Lesebestätigung",
    it: "{n} senza conferma",
  },
  "tous ont répondu": {
    de: "alle haben geantwortet",
    it: "tutti hanno risposto",
  },
  "inscrit au journal": {
    de: "im Journal erfasst",
    it: "registrato nel diario",
  },
  complète: { de: "ergänzt", it: "completa" },
  diffusé: { de: "verteilt", it: "diffuso" },
  mission: { de: "Auftrag", it: "missione" },
  diffuse: { de: "verteilt an", it: "diffonde" },
} satisfies Dict);
