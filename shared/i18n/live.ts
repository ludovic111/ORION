import { translator, type Dict } from "./core.ts";

// Live positions of the teams (shared/live.ts).
export const { t, tn, tIn, dict } = translator({
  "à l’instant": { de: "gerade eben", it: "adesso" },
  "il y a {n} s": { de: "vor {n} s", it: "{n} s fa" },
  "il y a {n} min": { de: "vor {n} Min.", it: "{n} min fa" },
  "il y a {h} h {m}": { de: "vor {h} h {m}", it: "{h} h {m} fa" },
  Équipe: { de: "Team", it: "Squadra" },
  "Position de {label} à {time} : {where} (précision ± {acc} m, position GPS partagée en direct).":
    {
      de: "Position von {label} um {time}: {where} (Genauigkeit ± {acc} m, live geteilte GPS-Position).",
      it: "Posizione di {label} alle {time}: {where} (precisione ± {acc} m, posizione GPS condivisa in diretta).",
    },
  "Position GPS": { de: "GPS-Position", it: "Posizione GPS" },
} satisfies Dict);
