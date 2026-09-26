import { translator, type Dict } from "./core.ts";

// Exercises: injects, reactions, scenario files (shared/exercise.ts).
export const { t, tn, tIn, dict } = translator({
  "Créé par un inject d’exercice.": {
    de: "Durch eine Übungseinspielung erstellt.",
    it: "Creato da un inject d’esercizio.",
  },
  "Observation transmise par un inject d’exercice.": {
    de: "Durch eine Übungseinspielung übermittelte Beobachtung.",
    it: "Osservazione trasmessa da un inject d’esercizio.",
  },
  "message {status}": { de: "Meldung: {status}", it: "messaggio {status}" },
  "inscrit au journal": {
    de: "im Journal erfasst",
    it: "registrato nel diario",
  },
  "entrée liée": { de: "verknüpfter Eintrag", it: "voce collegata" },
  "élément lié": { de: "verknüpftes Element", it: "elemento collegato" },
  "marquée par la direction": {
    de: "von der Übungsleitung markiert",
    it: "segnata dalla direzione d’esercizio",
  },
  "Une heure (hh:mm) est requise pour un inject à heure fixe.": {
    de: "Für eine Einspielung zu fester Zeit ist eine Uhrzeit (hh:mm) erforderlich.",
    it: "Per un inject a ora fissa è richiesta un’ora (hh:mm).",
  },
  Scénario: { de: "Szenario", it: "Scenario" },
  "Ce fichier n’est pas un scénario JSON lisible.": {
    de: "Diese Datei ist kein lesbares JSON-Szenario.",
    it: "Questo file non è uno scenario JSON leggibile.",
  },
  "Ce fichier n’est pas un scénario orion aic (format « orion-aic-scenario »).":
    {
      de: "Diese Datei ist kein orion-aic-Szenario (Format «orion-aic-scenario»).",
      it: "Questo file non è uno scenario orion aic (formato «orion-aic-scenario»).",
    },
  "Scénario invalide{path} : {reason}.": {
    de: "Ungültiges Szenario{path}: {reason}.",
    it: "Scenario non valido{path}: {reason}.",
  },
  "format inconnu": { de: "unbekanntes Format", it: "formato sconosciuto" },
} satisfies Dict);
