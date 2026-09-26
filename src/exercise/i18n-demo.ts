import { translator, type Dict } from "../../shared/i18n/core.ts";
import { dict as scenario } from "../../shared/i18n/scenario.ts";

// Texts of the demonstration exercise (src/exercise/demo.ts), written in the
// language of the post when the demonstration is generated.

export const { t, tIn, dict } = translator({
  ...scenario,
  "Adresse notée, transmise à la cellule situation": {
    de: "Adresse notiert, an die Zelle Lage weitergeleitet",
    it: "Indirizzo annotato, trasmesso alla cellula situazione",
  },
  "Inject joué": { de: "Einspielung ausgelöst", it: "Inject giocato" },
  "Réaction marquée": { de: "Reaktion markiert", it: "Reazione segnata" },
  "Début de l’exercice": { de: "Übungsbeginn", it: "Inizio dell’esercizio" },
  "Les quittances radio ont été consignées au journal dans les minutes qui suivaient.":
    {
      de: "Die Funkquittungen wurden innert Minuten im Journal erfasst.",
      it: "Le quittanze radio sono state registrate nel diario nei minuti successivi.",
    },
  Transmissions: { de: "Übermittlung", it: "Trasmissioni" },
  "L’alerte « Eau sur la chaussée » n’a été reliée à une mesure qu’après 34 minutes : désigner qui suit les messages urgents.":
    {
      de: "Der Alarm « Wasser auf der Fahrbahn » wurde erst nach 34 Minuten mit einer Massnahme verknüpft: bestimmen, wer die dringenden Meldungen verfolgt.",
      it: "L’allerta « Acqua sulla carreggiata » è stata collegata a una misura solo dopo 34 minuti: designare chi segue i messaggi urgenti.",
    },
  Messages: { de: "Meldungen", it: "Messaggi" },
} satisfies Dict);
