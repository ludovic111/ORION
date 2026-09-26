import { translator, type Dict } from "./core.ts";

// Tasks of a post (shared/diffusion.ts, « Mes tâches »).
export const { t, tn, tIn, dict } = translator({
  "Élément attribué": { de: "Zugewiesenes Element", it: "Elemento assegnato" },
  Mission: { de: "Auftrag", it: "Missione" },
  "Ordre {label}": { de: "Befehl {label}", it: "Ordine {label}" },
  "À quittancer ({ack})": {
    de: "Zu quittieren ({ack})",
    it: "Da quittanzare ({ack})",
  },
} satisfies Dict);
