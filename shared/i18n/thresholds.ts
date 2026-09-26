import { translator, type Dict } from "./core.ts";

// Weather thresholds (shared/thresholds.ts): measured quantities, hazards,
// alerts and entries written when a threshold is crossed.
export const { t, tn, tIn, dict } = translator({
  Rafales: { de: "Böen", it: "Raffiche" },
  "Vent moyen": { de: "Mittlerer Wind", it: "Vento medio" },
  "Pluie en 1 h": { de: "Regen in 1 h", it: "Pioggia in 1 h" },
  "Pluie en 24 h": { de: "Regen in 24 h", it: "Pioggia in 24 h" },
  "Température maximale": { de: "Höchsttemperatur", it: "Temperatura massima" },
  "Température minimale": { de: "Tiefsttemperatur", it: "Temperatura minima" },
  Vent: { de: "Wind", it: "Vento" },
  "Fortes précipitations": {
    de: "Starkniederschlag",
    it: "Forti precipitazioni",
  },
  Canicule: { de: "Hitzewelle", it: "Canicola" },
  "Gel / froid": { de: "Frost / Kälte", it: "Gelo / freddo" },
  "le {day} de {from} à {to}": {
    de: "am {day} von {from} bis {to}",
    it: "il {day} dalle {from} alle {to}",
  },
  "{value} {unit} à {time}": {
    de: "{value} {unit} um {time}",
    it: "{value} {unit} alle {time}",
  },
  "{hazard} : {label}": { de: "{hazard}: {label}", it: "{hazard}: {label}" },
  "Seuil du journal · prévision {model}": {
    de: "Schwellenwert des Journals · Prognose {model}",
    it: "Soglia del diario · previsione {model}",
  },
  "{label} prévu {period}. Pic : {peak}. Prévision reçue à {time}.": {
    de: "{label} erwartet {period}. Spitze: {peak}. Prognose erhalten um {time}.",
    it: "{label} previsto {period}. Picco: {peak}. Previsione ricevuta alle {time}.",
  },
  "Prévision {model}": { de: "Prognose {model}", it: "Previsione {model}" },
  "Seuil météo franchi : {label} prévu {period} (pic {peak}).": {
    de: "Wetter-Schwellenwert überschritten: {label} erwartet {period} (Spitze {peak}).",
    it: "Soglia meteo superata: {label} previsto {period} (picco {peak}).",
  },
  "Suivre l’évolution et décider des mesures.": {
    de: "Entwicklung verfolgen und über Massnahmen entscheiden.",
    it: "Seguire l’evoluzione e decidere le misure.",
  },
  "seuil franchi": {
    de: "Schwellenwert überschritten",
    it: "soglia superata",
  },
} satisfies Dict);
