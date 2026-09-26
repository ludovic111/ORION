import { translator, type Dict } from "../../../shared/i18n/core.ts";
import { common } from "../../../shared/i18n/common.ts";

// Journal module (JournalView).
export const { t, tn, dict } = translator({
  ...common,
  Clôturé: { de: "Abgeschlossen", it: "Chiuso" },
  Ouvert: { de: "Offen", it: "Aperto" },
  Rapport: { de: "Bericht", it: "Rapporto" },
  "Des changements ne sont pas encore dans une archive exportée": {
    de: "Änderungen sind noch in keinem exportierten Archiv",
    it: "Alcune modifiche non sono ancora in un archivio esportato",
  },
  "Archive à jour": { de: "Archiv aktuell", it: "Archivio aggiornato" },
  "à faire": { de: "offen", it: "da fare" },
  "Journal clôturé — rouvrez-le pour écrire": {
    de: "Journal abgeschlossen – zum Schreiben wieder öffnen",
    it: "Diario chiuso — riaprirlo per scrivere",
  },
  "Lecture seule : vous consultez le passé": {
    de: "Nur lesen: Sie sehen die Vergangenheit an",
    it: "Sola lettura: consultazione del passato",
  },
  "Nouvelle entrée": { de: "Neuer Eintrag", it: "Nuova voce" },
  "Quittance {receipt} : clore {entries} ?": {
    de: "Quittung {receipt}: {entries} abschliessen?",
    it: "Quittanza {receipt}: chiudere {entries}?",
  },
  "Marquer terminé": {
    de: "Als erledigt markieren",
    it: "Segna come concluso",
  },
  Ignorer: { de: "Ignorieren", it: "Ignora" },
  "Suivi marqué terminé par l’opérateur": {
    de: "Nachverfolgung vom Operateur als erledigt markiert",
    it: "Seguito segnato come concluso dall’operatore",
  },
  "{n} terminé.": { de: "{n} erledigt.", it: "{n} concluso." },
  "Le journal en chiffres": {
    de: "Das Journal in Zahlen",
    it: "Il diario in cifre",
  },
  "À suivre": { de: "Pendent", it: "Da seguire" },
  "Échéances dépassées": {
    de: "Überschrittene Fristen",
    it: "Scadenze superate",
  },
  "Radios en service": { de: "Funkgeräte im Einsatz", it: "Radio in servizio" },
  Filtrer: { de: "Filtern", it: "Filtra" },
  Tout: { de: "Alles", it: "Tutto" },
  Décisions: { de: "Entscheide", it: "Decisioni" },
  "Rechercher dans le journal": {
    de: "Im Journal suchen",
    it: "Cerca nel diario",
  },
  "Filtrer par jour (heure suisse)": {
    de: "Nach Tag filtern (Schweizer Zeit)",
    it: "Filtra per giorno (ora svizzera)",
  },
  "Plus récentes d’abord": { de: "Neueste zuerst", it: "Più recenti prima" },
  "Ordre chronologique": {
    de: "Chronologische Reihenfolge",
    it: "Ordine cronologico",
  },
  "Afficher en ordre chronologique": {
    de: "Chronologisch anzeigen",
    it: "Mostra in ordine cronologico",
  },
  "Afficher les plus récentes d’abord": {
    de: "Neueste zuerst anzeigen",
    it: "Mostra prima le più recenti",
  },
  Sélection: { de: "Auswahl", it: "Selezione" },
  "{n} sélectionnée": { de: "{n} ausgewählt", it: "{n} selezionata" },
  "{n} sélectionnées": { de: "{n} ausgewählt", it: "{n} selezionate" },
  "Fiches A4": { de: "A4-Blätter", it: "Schede A4" },
  Désélectionner: { de: "Auswahl aufheben", it: "Deseleziona" },
  "Désélectionner les entrées affichées": {
    de: "Angezeigte Einträge abwählen",
    it: "Deseleziona le voci visualizzate",
  },
  "Sélectionner les entrées affichées": {
    de: "Angezeigte Einträge auswählen",
    it: "Seleziona le voci visualizzate",
  },
  "Heure · N°": { de: "Zeit · Nr.", it: "Ora · N." },
  Suivi: { de: "Nachverfolgung", it: "Seguito" },
  Actions: { de: "Aktionen", it: "Azioni" },
  "Aucune entrée ne correspond.": {
    de: "Kein Eintrag entspricht der Auswahl.",
    it: "Nessuna voce corrisponde.",
  },
  "Journal vide.": { de: "Leeres Journal.", it: "Diario vuoto." },
  "Retirer les filtres": { de: "Filter entfernen", it: "Rimuovi i filtri" },
  "Première entrée": { de: "Erster Eintrag", it: "Prima voce" },
  "{n} entrée": { de: "{n} Eintrag", it: "{n} voce" },
  "{n} entrées": { de: "{n} Einträge", it: "{n} voci" },
  "{n} supprimée": { de: "{n} gelöscht", it: "{n} eliminata" },
  "{n} supprimées": { de: "{n} gelöscht", it: "{n} eliminate" },
  "Afficher 100 de plus": {
    de: "100 weitere anzeigen",
    it: "Mostra altre 100",
  },
  "Journal clôturé": { de: "Journal abgeschlossen", it: "Diario chiuso" },
  "Lecture et export uniquement.": {
    de: "Nur Lesen und Export.",
    it: "Solo lettura ed esportazione.",
  },
  Rouvrir: { de: "Wieder öffnen", it: "Riapri" },
  "Impression automatique": {
    de: "Automatischer Druck",
    it: "Stampa automatica",
  },
  "Chaque entrée consignée part à l’imprimante.": {
    de: "Jeder erfasste Eintrag geht an den Drucker.",
    it: "Ogni voce registrata va alla stampante.",
  },
  "Impression automatique activée sur ce poste.": {
    de: "Automatischer Druck auf diesem Arbeitsplatz aktiviert.",
    it: "Stampa automatica attivata su questa postazione.",
  },
  "Impression automatique désactivée.": {
    de: "Automatischer Druck deaktiviert.",
    it: "Stampa automatica disattivata.",
  },
} satisfies Dict);
