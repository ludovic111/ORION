import { translator, type Dict } from "../../shared/i18n/core.ts";

// Delivery of the injects (Runner.tsx) and the direction mode of the post
// (director.ts).
export const { t, tn, tIn, dict } = translator({
  "Direction d’exercice · fictive": {
    de: "Übungsleitung · fiktiv",
    it: "Direzione d’esercizio · fittizia",
  },
  "{author} · direction d’exercice": {
    de: "{author} · Übungsleitung",
    it: "{author} · direzione d’esercizio",
  },
  "Message reçu : {titles}": {
    de: "Meldung eingegangen: {titles}",
    it: "Messaggio ricevuto: {titles}",
  },
  "Inject envoyé : {titles}": {
    de: "Einspielung gesendet: {titles}",
    it: "Inject inviato: {titles}",
  },
  "Inject à lire maintenant : {titles} (Débriefing → Direction d’exercice)": {
    de: "Jetzt vorzulesende Einspielung: {titles} (Debriefing → Übungsleitung)",
    it: "Inject da leggere adesso: {titles} (Debriefing → Direzione d’esercizio)",
  },
  "Le code compte 4 à 8 chiffres.": {
    de: "Der Code hat 4 bis 8 Ziffern.",
    it: "Il codice conta da 4 a 8 cifre.",
  },
  "Code incorrect.": { de: "Falscher Code.", it: "Codice errato." },
} satisfies Dict);
