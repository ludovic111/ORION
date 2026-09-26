import { translator, type Dict } from "./core.ts";

// Radio plan, terminals and link checks (shared/radio.ts).
export const { t, tn, tIn, dict } = translator({
  "THREE · bon": { de: "THREE · gut", it: "THREE · buono" },
  "TWO · faible": { de: "TWO · schwach", it: "TWO · debole" },
  "ONE · insuffisant": { de: "ONE · ungenügend", it: "ONE · insufficiente" },
  "Pas de liaison": { de: "Keine Verbindung", it: "Nessun collegamento" },
  "{label} dupliqués.": {
    de: "{label} doppelt vorhanden.",
    it: "{label} duplicati.",
  },
  Groupes: { de: "Gesprächsgruppen", it: "Gruppi di conversazione" },
  "Noms d’appel": { de: "Rufnamen", it: "Nominativi" },
  Terminaux: { de: "Endgeräte", it: "Terminali" },
  Contrôles: { de: "Kontrollen", it: "Controlli" },
  "N° de terminaux": { de: "Endgerätenummern", it: "Numeri dei terminali" },
  "Groupe radio introuvable.": {
    de: "Gesprächsgruppe nicht gefunden.",
    it: "Gruppo di conversazione non trovato.",
  },
  Remises: { de: "Ausgaben", it: "Consegne" },
  "Terminal {label} remis deux fois sans retour.": {
    de: "Endgerät {label} zweimal ohne Rücknahme ausgegeben.",
    it: "Terminale {label} consegnato due volte senza restituzione.",
  },
  "Terminal introuvable.": {
    de: "Endgerät nicht gefunden.",
    it: "Terminale non trovato.",
  },
  "{label} est déjà remis. Enregistrez son retour.": {
    de: "{label} ist bereits ausgegeben. Erfassen Sie zuerst die Rücknahme.",
    it: "{label} è già consegnato. Registrare prima la restituzione.",
  },
  "{label} est signalé {condition}.": {
    de: "{label} ist als {condition} gemeldet.",
    it: "{label} è segnalato {condition}.",
  },
  "Aucune remise en cours.": {
    de: "Keine laufende Ausgabe.",
    it: "Nessuna consegna in corso.",
  },
  "Le retour précède la remise.": {
    de: "Die Rücknahme liegt vor der Ausgabe.",
    it: "La restituzione precede la consegna.",
  },
  "Ce groupe figure dans des contrôles de liaison. Il reste au plan.": {
    de: "Diese Gesprächsgruppe kommt in Verbindungskontrollen vor. Sie bleibt im Plan.",
    it: "Questo gruppo figura in controlli dei collegamenti. Rimane nel piano.",
  },
  "Ce terminal a un historique de remise. Marquez-le hors service plutôt que de le supprimer.":
    {
      de: "Dieses Endgerät hat eine Ausgabegeschichte. Markieren Sie es als ausser Betrieb, statt es zu löschen.",
      it: "Questo terminale ha uno storico di consegne. Segnarlo fuori servizio invece di eliminarlo.",
    },
  "De 1 à 200 terminaux.": {
    de: "1 bis 200 Endgeräte.",
    it: "Da 1 a 200 terminali.",
  },
} satisfies Dict);
