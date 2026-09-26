import { translator, type Dict } from "../../../shared/i18n/core.ts";
import { common } from "../../../shared/i18n/common.ts";

// Traceability module (src/modules/trace/Trace.tsx).
export const { t, tn, tIn, dict } = translator({
  ...common,
  "Remonter le temps": {
    de: "Zeitreise",
    it: "Torna indietro nel tempo",
  },
  "Figer un point": {
    de: "Momentaufnahme festhalten",
    it: "Fissa un’istantanea",
  },
  Vue: { de: "Ansicht", it: "Vista" },
  "Qui a fait quoi": { de: "Wer hat was gemacht", it: "Chi ha fatto cosa" },
  Comparer: { de: "Vergleichen", it: "Confronta" },
  "Points figés · {n}": { de: "Momentaufnahmen · {n}", it: "Istantanee · {n}" },
  "Exports · {n}": { de: "Exporte · {n}", it: "Esportazioni · {n}" },
  "Présentations · {n}": {
    de: "Präsentationen · {n}",
    it: "Presentazioni · {n}",
  },
  Inconnu: { de: "Unbekannt", it: "Sconosciuto" },
  "{day} · {hour} h": { de: "{day} · {hour} Uhr", it: "{day} · ore {hour}" },
  // Who did what
  "Aucun changement encore": {
    de: "Noch keine Änderungen",
    it: "Ancora nessuna modifica",
  },
  "Dès qu’un élément est créé, modifié ou supprimé, son auteur, l’heure et le détail apparaissent ici. Rien ne s’efface.":
    {
      de: "Sobald ein Element erstellt, geändert oder gelöscht wird, erscheinen hier Autor, Zeit und Details. Nichts wird gelöscht.",
      it: "Non appena un elemento viene creato, modificato o eliminato, qui compaiono l’autore, l’ora e il dettaglio. Nulla si cancella.",
    },
  changements: { de: "Änderungen", it: "modifiche" },
  personnes: { de: "Personen", it: "persone" },
  "dernière heure": { de: "letzte Stunde", it: "ultima ora" },
  "Dernier : {by} · {ago}": {
    de: "Zuletzt: {by} · {ago}",
    it: "Ultimo: {by} · {ago}",
  },
  "Par personne": { de: "Nach Person", it: "Per persona" },
  "Les journaux d’avant cette version ne gardent que la création et la dernière modification de chaque élément ; tout changement depuis est tracé.":
    {
      de: "Journale aus der Zeit vor dieser Version behalten nur die Erstellung und die letzte Änderung jedes Elements; jede spätere Änderung wird nachverfolgt.",
      it: "I diari precedenti a questa versione conservano solo la creazione e l’ultima modifica di ogni elemento; ogni modifica successiva è tracciata.",
    },
  "Personne, élément, valeur…": {
    de: "Person, Element, Wert …",
    it: "Persona, elemento, valore…",
  },
  "Rechercher dans l’historique": {
    de: "Im Verlauf suchen",
    it: "Cerca nella cronologia",
  },
  Module: { de: "Modul", it: "Modulo" },
  "Tous les modules": { de: "Alle Module", it: "Tutti i moduli" },
  Action: { de: "Aktion", it: "Azione" },
  "Toutes les actions": { de: "Alle Aktionen", it: "Tutte le azioni" },
  Créations: { de: "Erstellungen", it: "Creazioni" },
  Modifications: { de: "Änderungen", it: "Modifiche" },
  Suppressions: { de: "Löschungen", it: "Eliminazioni" },
  Période: { de: "Zeitraum", it: "Periodo" },
  "1 h": { de: "1 Std.", it: "1 ora" },
  "Aujourd’hui": { de: "Heute", it: "Oggi" },
  Tout: { de: "Alles", it: "Tutto" },
  "{n} changement": { de: "{n} Änderung", it: "{n} modifica" },
  "{n} changements": { de: "{n} Änderungen", it: "{n} modifiche" },
  "{n} changement de {person}": {
    de: "{n} Änderung von {person}",
    it: "{n} modifica di {person}",
  },
  "{n} changements de {person}": {
    de: "{n} Änderungen von {person}",
    it: "{n} modifiche di {person}",
  },
  "Tout afficher": { de: "Alle anzeigen", it: "Mostra tutto" },
  "Afficher plus ({n} restants)": {
    de: "Mehr anzeigen ({n} weitere)",
    it: "Mostra altro ({n} rimanenti)",
  },
  "Aucun changement ne correspond aux filtres.": {
    de: "Keine Änderung entspricht den Filtern.",
    it: "Nessuna modifica corrisponde ai filtri.",
  },
  // Compare
  "Dernière heure": { de: "Letzte Stunde", it: "Ultima ora" },
  "4 dernières heures": { de: "Letzte 4 Stunden", it: "Ultime 4 ore" },
  "Depuis le début": { de: "Seit Beginn", it: "Dall’inizio" },
  "Depuis « {title} »": { de: "Seit « {title} »", it: "Da « {title} »" },
  "Comparaison de deux moments": {
    de: "Vergleich zweier Zeitpunkte",
    it: "Confronto tra due momenti",
  },
  "Du {from} au {to} · {n} différence(s) · par {author}": {
    de: "Vom {from} bis {to} · {n} Unterschied(e) · von {author}",
    it: "Dal {from} al {to} · {n} differenza/e · da {author}",
  },
  "Du {from} au état actuel · {n} différence(s) · par {author}": {
    de: "Vom {from} bis zum aktuellen Stand · {n} Unterschied(e) · von {author}",
    it: "Dal {from} allo stato attuale · {n} differenza/e · da {author}",
  },
  comparaison: { de: "vergleich", it: "confronto" },
  "{n} différence(s)": { de: "{n} Unterschied(e)", it: "{n} differenza/e" },
  Changement: { de: "Änderung", it: "Modifica" },
  Élément: { de: "Element", it: "Elemento" },
  Détail: { de: "Detail", it: "Dettaglio" },
  Ajouté: { de: "Hinzugefügt", it: "Aggiunto" },
  Supprimé: { de: "Gelöscht", it: "Eliminato" },
  Modifié: { de: "Geändert", it: "Modificato" },
  Avant: { de: "Vorher", it: "Prima" },
  Après: { de: "Nachher", it: "Dopo" },
  "Point figé de départ": {
    de: "Ausgangs-Momentaufnahme",
    it: "Istantanea di partenza",
  },
  "Point figé…": { de: "Momentaufnahme …", it: "Istantanea…" },
  "Fin de la comparaison": {
    de: "Ende des Vergleichs",
    it: "Fine del confronto",
  },
  "Autre moment": { de: "Anderer Zeitpunkt", it: "Altro momento" },
  "Résumé de la comparaison": {
    de: "Zusammenfassung des Vergleichs",
    it: "Riepilogo del confronto",
  },
  ajouté: { de: "hinzugefügt", it: "aggiunto" },
  ajoutés: { de: "hinzugefügt", it: "aggiunti" },
  modifié: { de: "geändert", it: "modificato" },
  modifiés: { de: "geändert", it: "modificati" },
  supprimé: { de: "gelöscht", it: "eliminato" },
  supprimés: { de: "gelöscht", it: "eliminati" },
  "personne : {names}": { de: "Person: {names}", it: "persona: {names}" },
  "personnes : {names}": { de: "Personen: {names}", it: "persone: {names}" },
  "Cartes côte à côte": { de: "Karten nebeneinander", it: "Carte affiancate" },
  "Imprimer la comparaison": {
    de: "Vergleich drucken",
    it: "Stampa il confronto",
  },
  "Aucune différence": { de: "Keine Unterschiede", it: "Nessuna differenza" },
  "Rien n’a changé entre ces deux moments.": {
    de: "Zwischen diesen beiden Zeitpunkten hat sich nichts geändert.",
    it: "Nulla è cambiato tra questi due momenti.",
  },
  "Préparation des cartes…": {
    de: "Karten werden vorbereitet …",
    it: "Preparazione delle carte…",
  },
  "Carte avant": { de: "Karte vorher", it: "Carta prima" },
  "Carte après": { de: "Karte nachher", it: "Carta dopo" },
  // Frozen points
  "Aucun point de situation figé": {
    de: "Keine Momentaufnahme",
    it: "Nessuna istantanea",
  },
  "Figer maintenant": { de: "Jetzt festhalten", it: "Fissa adesso" },
  "Figez un moment (par exemple juste avant un rapport de conduite) pour le retrouver en un clic : revoir, comparer, présenter, exporter.":
    {
      de: "Halten Sie einen Zeitpunkt fest (zum Beispiel kurz vor einem Führungsrapport), um ihn mit einem Klick wiederzufinden: ansehen, vergleichen, präsentieren, exportieren.",
      it: "Fissate un momento (per esempio appena prima di un rapporto di condotta) per ritrovarlo con un clic: rivedere, confrontare, presentare, esportare.",
    },
  "Figé par {by}": { de: "Festgehalten von {by}", it: "Fissato da {by}" },
  Revoir: { de: "Ansehen", it: "Rivedi" },
  "Voir ce qui a changé depuis": {
    de: "Anzeigen, was sich seither geändert hat",
    it: "Vedi cosa è cambiato da allora",
  },
  Présenter: { de: "Präsentieren", it: "Presenta" },
  "Supprimer {title}": { de: "{title} löschen", it: "Elimina {title}" },
  "Supprimer le point « {title} » ?": {
    de: "Momentaufnahme « {title} » löschen?",
    it: "Eliminare l’istantanea « {title} »?",
  },
  // Registers
  "{n} Mo": { de: "{n} MB", it: "{n} MB" },
  "{n} ko": { de: "{n} kB", it: "{n} kB" },
  "Registre des exports": {
    de: "Exportregister",
    it: "Registro delle esportazioni",
  },
  "Nouvel export": { de: "Neuer Export", it: "Nuova esportazione" },
  Par: { de: "Von", it: "Da" },
  Format: { de: "Format", it: "Formato" },
  Fichier: { de: "Datei", it: "File" },
  Empreinte: { de: "Fingerabdruck", it: "Impronta" },
  "Chaque fichier exporté est inscrit ici avec son empreinte : on peut ensuite vérifier qu’un document reçu est authentique et intact.":
    {
      de: "Jede exportierte Datei wird hier mit ihrem Fingerabdruck eingetragen: So lässt sich später prüfen, ob ein erhaltenes Dokument echt und unverändert ist.",
      it: "Ogni file esportato è registrato qui con la sua impronta: si può poi verificare che un documento ricevuto sia autentico e intatto.",
    },
  "Vérifier un document": {
    de: "Dokument prüfen",
    it: "Verifica un documento",
  },
  "Présentations données": {
    de: "Gehaltene Präsentationen",
    it: "Presentazioni tenute",
  },
  "Présenté par": { de: "Präsentiert von", it: "Presentato da" },
  Public: { de: "Publikum", it: "Pubblico" },
  Version: { de: "Version", it: "Versione" },
  Diapositives: { de: "Folien", it: "Diapositive" },
  "État du moment": { de: "Damaliger Stand", it: "Stato del momento" },
  // Mode of a presentation (stored in French: src/present/Presentation.tsx)
  "Affichage mural": { de: "Wandanzeige", it: "Schermo murale" },
  "Chaque présentation (mode présentation ou affichage mural) est inscrite ici : qui a présenté, à qui, quand et quelle version.":
    {
      de: "Jede Präsentation (Präsentationsmodus oder Wandanzeige) wird hier eingetragen: wer präsentiert hat, wem, wann und welche Version.",
      it: "Ogni presentazione (modalità presentazione o schermo murale) è registrata qui: chi ha presentato, a chi, quando e quale versione.",
    },
} satisfies Dict);

/** Mode of a presentation, stored in French ("Présentation", "Affichage mural"). */
export function modeLabel(mode: string): string {
  if (mode === "Présentation" || mode === "Affichage mural") return t(mode);
  return mode;
}
