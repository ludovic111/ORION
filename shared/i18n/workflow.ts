import { translator, type Dict } from "./core.ts";

// Skeletons of journal entries (shared/workflow.ts TEMPLATES). The texts
// fill the form of a new entry, in the language of the post.
export const { t, tn, tIn, dict } = translator({
  "Point de situation": { de: "Lagerapport", it: "Punto della situazione" },
  "Point de situation.\nSituation : \nMesures prises : \nMoyens engagés : \nBesoins : \nProchain point : ":
    {
      de: "Lagerapport.\nLage: \nGetroffene Massnahmen: \nEingesetzte Mittel: \nBedürfnisse: \nNächster Rapport: ",
      it: "Punto della situazione.\nSituazione: \nMisure adottate: \nMezzi impiegati: \nBisogni: \nProssimo punto: ",
    },
  "Demande de moyens": { de: "Mittelanforderung", it: "Richiesta di mezzi" },
  "Demande de moyens.\nMoyens : \nQuantité : \nLieu de livraison : \nDélai : \nMotif : ":
    {
      de: "Mittelanforderung.\nMittel: \nMenge: \nLieferort: \nFrist: \nBegründung: ",
      it: "Richiesta di mezzi.\nMezzi: \nQuantità: \nLuogo di consegna: \nTermine: \nMotivo: ",
    },
  Mission: { de: "Auftrag", it: "Missione" },
  "Mission : ": { de: "Auftrag: ", it: "Missione: " },
  "Quittancer l’exécution au PC.": {
    de: "Ausführung dem KP quittieren.",
    it: "Quittanzare l’esecuzione al PC.",
  },
  Décision: { de: "Entscheid", it: "Decisione" },
  "Décision : ": { de: "Entscheid: ", it: "Decisione: " },
  Quittance: { de: "Quittung", it: "Quittanza" },
  "Quittance : ": { de: "Quittung: ", it: "Quittanza: " },
  "Suite de #": { de: "Folge von #", it: "Seguito di #" },
  "Contrôle de liaison": {
    de: "Verbindungskontrolle",
    it: "Controllo dei collegamenti",
  },
  "Contrôle de liaison : ": {
    de: "Verbindungskontrolle: ",
    it: "Controllo dei collegamenti: ",
  },
} satisfies Dict);
