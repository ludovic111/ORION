import { translator, type Dict } from "./core.ts";

// What a liaison with another command post writes on arrival
// (shared/liaison.ts), in the language of the post that receives it.
export const { t, tn, tIn, dict } = translator({
  "Reçu par la liaison avec {name}.": {
    de: "Über die Verbindung mit {name} erhalten.",
    it: "Ricevuto tramite il collegamento con {name}.",
  },
  Diffusion: { de: "Verteilung", it: "Diffusione" },
  "{kind} : {title}": { de: "{kind}: {title}", it: "{kind}: {title}" },
  "Ordre {from} n° {number} · {title}": {
    de: "Befehl {from} Nr. {number} · {title}",
    it: "Ordine {from} n. {number} · {title}",
  },
  "Accusé demandé : « {ack} ».": {
    de: "Verlangte Bestätigung: «{ack}».",
    it: "Conferma richiesta: «{ack}».",
  },
} satisfies Dict);
