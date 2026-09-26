import { translator, type Dict } from "./core.ts";

// Structured orders: labels, templates, chapters (shared/orders.ts).
export const { t, tn, tIn, dict } = translator({
  "n° {n}": { de: "Nr. {n}", it: "n. {n}" },
  "Ordre d’engagement": { de: "Einsatzbefehl", it: "Ordine d’impiego" },
  "Les cinq chapitres, préremplis depuis la situation.": {
    de: "Die fünf Kapitel, aus der Lage vorausgefüllt.",
    it: "I cinque capitoli, precompilati dalla situazione.",
  },
  "Ordre complémentaire": {
    de: "Ergänzungsbefehl",
    it: "Ordine complementare",
  },
  "Ce qui change par rapport à un ordre émis.": {
    de: "Was sich gegenüber einem erlassenen Befehl ändert.",
    it: "Ciò che cambia rispetto a un ordine emanato.",
  },
  "Inchangée.": { de: "Unverändert.", it: "Invariata." },
  "Ordre préparatoire": { de: "Vorbefehl", it: "Ordine preparatorio" },
  "Prévenir tôt : ce qui va venir, se préparer.": {
    de: "Früh orientieren: was kommt, sich vorbereiten.",
    it: "Avvisare presto: cosa sta per arrivare, prepararsi.",
  },
  "Engagement probable. Se tenir prêts à…": {
    de: "Einsatz wahrscheinlich. Bereit sein für …",
    it: "Impiego probabile. Tenersi pronti a…",
  },
  "Ordre de relève": { de: "Ablösungsbefehl", it: "Ordine di avvicendamento" },
  "Qui relève qui, où et quand.": {
    de: "Wer löst wen ab, wo und wann.",
    it: "Chi dà il cambio a chi, dove e quando.",
  },
  "Assurer la continuité de la conduite pendant la relève.": {
    de: "Die Kontinuität der Führung während der Ablösung sicherstellen.",
    it: "Garantire la continuità della condotta durante l’avvicendamento.",
  },
  Orientation: { de: "Orientierung", it: "Orientamento" },
  Intention: { de: "Absicht", it: "Intenzione" },
  Missions: { de: "Aufträge", it: "Missioni" },
  "Dispositions particulières": {
    de: "Besondere Anordnungen",
    it: "Disposizioni particolari",
  },
  "Emplacements et liaisons": {
    de: "Standorte und Verbindungen",
    it: "Ubicazioni e collegamenti",
  },
} satisfies Dict);
