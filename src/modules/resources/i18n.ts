import { getLang, translator, type Dict } from "../../../shared/i18n/core.ts";
import { common } from "../../../shared/i18n/common.ts";
import { enumLabel } from "../../../shared/i18n/enums.ts";

// Resources module: board of resources and requests for resources.
export const { t, tn, tIn, dict } = translator({
  ...common,
  // Arrival countdown
  "arrivée à {time}": { de: "Ankunft um {time}", it: "arrivo alle {time}" },
  "arrivée dans {n} min": {
    de: "Ankunft in {n} min",
    it: "arrivo tra {n} min",
  },
  "arrivée imminente": { de: "Ankunft steht bevor", it: "arrivo imminente" },
  "retard de {n} min": { de: "{n} min Verspätung", it: "ritardo di {n} min" },
  "retard de {h} h {mm}": {
    de: "{h} h {mm} Verspätung",
    it: "ritardo di {h} h {mm}",
  },
  // Resources: toasts and journal
  "Ce moyen n’existe plus.": {
    de: "Dieses Mittel existiert nicht mehr.",
    it: "Questo mezzo non esiste più.",
  },
  moyens: { de: "Mittel", it: "mezzi" },
  "moyens (fichier)": { fr: "moyens", de: "mittel", it: "mezzi" },
  "{name} : {from} → {to}": {
    de: "{name}: {from} → {to}",
    it: "{name}: {from} → {to}",
  },
  "{name} : {status}": { de: "{name}: {status}", it: "{name}: {status}" },
  "« {name} » ajouté.": {
    de: "« {name} » hinzugefügt.",
    it: "« {name} » aggiunto.",
  },
  // Print
  "{n} moyen": { de: "{n} Mittel", it: "{n} mezzo" },
  "{n} moyens": { de: "{n} Mittel", it: "{n} mezzi" },
  "{n} unité": { de: "{n} Einheit", it: "{n} unità" },
  "{n} unités": { de: "{n} Einheiten", it: "{n} unità" },
  Nb: { de: "Anz.", it: "Qtà" },
  "Nom d’appel": { de: "Rufname", it: "Nominativo" },
  Arrivée: { de: "Ankunft", it: "Arrivo" },
  "Aucun moyen à imprimer.": {
    de: "Keine Mittel zum Drucken.",
    it: "Nessun mezzo da stampare.",
  },
  "Tableau des moyens": { de: "Mittelübersicht", it: "Tabella dei mezzi" },
  "Établi par {author}": {
    de: "Erstellt von {author}",
    it: "Redatto da {author}",
  },
  // Sheet of a resource
  Identification: { de: "Identifikation", it: "Identificazione" },
  "ex. Tonne-pompe 1, Section PCi Nord": {
    de: "z. B. Tanklöschfahrzeug 1, Zug ZS Nord",
    it: "es. Autobotte 1, Sezione PCi Nord",
  },
  Nombre: { de: "Anzahl", it: "Numero" },
  "Véhicules, personnes, lots…": {
    de: "Fahrzeuge, Personen, Lose …",
    it: "Veicoli, persone, lotti…",
  },
  "Les noms d’appel du réseau radio sont proposés ici.": {
    de: "Die Rufnamen des Funknetzes werden hier vorgeschlagen.",
    it: "I nominativi della rete radio sono proposti qui.",
  },
  "Responsable, chef de groupe…": {
    de: "Verantwortlicher, Gruppenführer …",
    it: "Responsabile, capogruppo…",
  },
  Engagement: { de: "Einsatz", it: "Impiego" },
  "Lieu / position": { de: "Ort / Position", it: "Luogo / posizione" },
  "Arrivée prévue": { de: "Voraussichtliche Ankunft", it: "Arrivo previsto" },
  "Compte à rebours affiché quand le moyen est en route.": {
    de: "Countdown wird angezeigt, wenn das Mittel unterwegs ist.",
    it: "Conto alla rovescia visualizzato quando il mezzo è in viaggio.",
  },
  Détails: { de: "Details", it: "Dettagli" },
  "un moyen": { de: "ein Mittel", it: "un mezzo" },
  "La désignation est nécessaire.": {
    de: "Die Bezeichnung ist erforderlich.",
    it: "La designazione è necessaria.",
  },
  "Voir sur la carte": {
    de: "Auf der Karte anzeigen",
    it: "Vedere sulla carta",
  },
  // Module head, tabs, summary
  "Demander des moyens": { de: "Mittel anfordern", it: "Richiedere mezzi" },
  "Ajouter un moyen": { de: "Mittel hinzufügen", it: "Aggiungere un mezzo" },
  "Moyens ou demandes": {
    de: "Mittel oder Anforderungen",
    it: "Mezzi o richieste",
  },
  "Moyens · {n}": { de: "Mittel · {n}", it: "Mezzi · {n}" },
  "Demandes · {n}": { de: "Anforderungen · {n}", it: "Richieste · {n}" },
  "{n} en retard": { de: "{n} überfällig", it: "{n} in ritardo" },
  "Aucun moyen pour l’instant": {
    de: "Noch keine Mittel",
    it: "Ancora nessun mezzo",
  },
  "Notez ici les véhicules, le personnel et le matériel : leur état, leur lieu et leur mission. Glissez les cartes d’une colonne à l’autre pour changer leur état.":
    {
      de: "Erfassen Sie hier Fahrzeuge, Personal und Material: Status, Ort und Auftrag. Ziehen Sie die Karten von einer Spalte in die andere, um ihren Status zu ändern.",
      it: "Annotare qui veicoli, personale e materiale: stato, luogo e missione. Trascinare le schede da una colonna all’altra per cambiarne lo stato.",
    },
  "Résumé des moyens": {
    de: "Übersicht der Mittel",
    it: "Riepilogo dei mezzi",
  },
  personnes: { de: "Personen", it: "persone" },
  "véhicules et engins": {
    de: "Fahrzeuge und Geräte",
    it: "veicoli e macchine",
  },
  "Filtrer par état": { de: "Nach Status filtern", it: "Filtra per stato" },
  "Afficher tous les états": {
    de: "Alle Status anzeigen",
    it: "Mostra tutti gli stati",
  },
  "Afficher seulement « {status} »": {
    de: "Nur « {status} » anzeigen",
    it: "Mostra solo « {status} »",
  },
  // Toolbar
  "Rechercher un moyen, un lieu, une mission…": {
    de: "Mittel, Ort, Auftrag suchen …",
    it: "Cerca un mezzo, un luogo, una missione…",
  },
  "Rechercher un moyen": { de: "Mittel suchen", it: "Cerca un mezzo" },
  "Filtrer par type": { de: "Nach Typ filtern", it: "Filtra per tipo" },
  "Tous les types": { de: "Alle Typen", it: "Tutti i tipi" },
  "Filtrer par organisation": {
    de: "Nach Organisation filtern",
    it: "Filtra per organizzazione",
  },
  "Toutes les organisations": {
    de: "Alle Organisationen",
    it: "Tutte le organizzazioni",
  },
  Affichage: { de: "Ansicht", it: "Visualizzazione" },
  Tableau: { de: "Tafel", it: "Tabellone" },
  Liste: { de: "Liste", it: "Elenco" },
  Tuiles: { de: "Kacheln", it: "Riquadri" },
  "Consigner les changements d’état au journal": {
    de: "Statusänderungen im Journal erfassen",
    it: "Registrare i cambiamenti di stato nel diario",
  },
  "Aucun moyen ne correspond.": {
    de: "Kein Mittel entspricht der Suche.",
    it: "Nessun mezzo corrisponde.",
  },
  "Tout afficher": { de: "Alle anzeigen", it: "Mostra tutto" },
  // Board, cards, table
  "{status} : {n} moyen(s)": {
    de: "{status}: {n} Mittel",
    it: "{status}: {n} mezzi",
  },
  "{n} unité(s)": { de: "Einheiten: {n}", it: "Unità: {n}" },
  "Ajouter un moyen « {status} »": {
    de: "Mittel « {status} » hinzufügen",
    it: "Aggiungere un mezzo « {status} »",
  },
  "Ajouter ici": { de: "Hier hinzufügen", it: "Aggiungere qui" },
  "Aucun moyen": { de: "Keine Mittel", it: "Nessun mezzo" },
  "Déposez un moyen ici": {
    de: "Mittel hier ablegen",
    it: "Depositare un mezzo qui",
  },
  "État : {status}. Changer l’état": {
    de: "Status: {status}. Status ändern",
    it: "Stato: {status}. Cambiare lo stato",
  },
  "Changer l’état": { de: "Status ändern", it: "Cambiare lo stato" },
  "{n} lien(s)": { de: "Verknüpfungen: {n}", it: "Collegamenti: {n}" },
  "Voir {name} sur la carte": {
    de: "{name} auf der Karte anzeigen",
    it: "Vedere {name} sulla carta",
  },
  "Placer {name} sur la carte": {
    de: "{name} auf der Karte platzieren",
    it: "Posizionare {name} sulla carta",
  },
  Liens: { de: "Verknüpfungen", it: "Collegamenti" },
  // Requests (Requests.tsx)
  "Moyen demandé": { de: "Angefordertes Mittel", it: "Mezzo richiesto" },
  "ex. Groupe électrogène 20 kVA, section PCi, sacs de sable": {
    de: "z. B. Stromaggregat 20 kVA, Zug ZS, Sandsäcke",
    it: "es. Gruppo elettrogeno 20 kVA, sezione PCi, sacchi di sabbia",
  },
  "Type de moyen": { de: "Mitteltyp", it: "Tipo di mezzo" },
  Qui: { de: "Wer", it: "Chi" },
  Demandeur: { de: "Anforderer", it: "Richiedente" },
  "Demandé à (organisation)": {
    de: "Angefordert bei (Organisation)",
    it: "Richiesto a (organizzazione)",
  },
  "Nom, téléphone": { de: "Name, Telefon", it: "Nome, telefono" },
  "Lieu de livraison": { de: "Lieferort", it: "Luogo di consegna" },
  Quand: { de: "Wann", it: "Quando" },
  "Demandé le": { de: "Angefordert am", it: "Richiesto il" },
  "Un avertissement s’affiche quand l’heure est dépassée.": {
    de: "Eine Warnung erscheint, wenn die Zeit überschritten ist.",
    it: "Un avviso appare quando l’ora è superata.",
  },
  Motif: { de: "Grund", it: "Motivo" },
  "Cette demande n’existe plus.": {
    de: "Diese Anforderung existiert nicht mehr.",
    it: "Questa richiesta non esiste più.",
  },
  "Demandes de moyens": { de: "Mittelanforderungen", it: "Richieste di mezzi" },
  "{waiting} en attente, {late} en retard": {
    de: "{waiting} ausstehend, {late} überfällig",
    it: "{waiting} in attesa, {late} in ritardo",
  },
  "demandes-de-moyens": {
    de: "mittelanforderungen",
    it: "richieste-di-mezzi",
  },
  "{n} demande(s)": { de: "Anforderungen: {n}", it: "Richieste: {n}" },
  "Demandé à": { de: "Angefordert bei", it: "Richiesto a" },
  "Demandé (colonne)": { fr: "Demandé", de: "Angefordert", it: "Richiesto" },
  "(retard)": { de: "(verspätet)", it: "(in ritardo)" },
  "En attente": { de: "Ausstehend", it: "In attesa" },
  Arrivées: { de: "Eingetroffen", it: "Arrivate" },
  "Refusées ou annulées": {
    de: "Abgelehnt oder annulliert",
    it: "Rifiutate o annullate",
  },
  "Nouvelle demande": { de: "Neue Anforderung", it: "Nuova richiesta" },
  "Aucune demande de moyens": {
    de: "Keine Mittelanforderungen",
    it: "Nessuna richiesta di mezzi",
  },
  "Suivez chaque demande : demandée, accordée ou refusée, en route, arrivée. Chaque étape est notée au journal ; à l’arrivée, le moyen apparaît dans la liste des moyens.":
    {
      de: "Verfolgen Sie jede Anforderung: angefordert, bewilligt oder abgelehnt, unterwegs, eingetroffen. Jeder Schritt wird im Journal festgehalten; beim Eintreffen erscheint das Mittel in der Liste der Mittel.",
      it: "Seguire ogni richiesta: richiesta, accordata o rifiutata, in viaggio, arrivata. Ogni tappa è annotata nel diario; all’arrivo, il mezzo appare nell’elenco dei mezzi.",
    },
  Terminées: { de: "Abgeschlossen", it: "Concluse" },
  "pour {name}": { de: "für {name}", it: "per {name}" },
  "demandé à {name}": {
    de: "angefordert bei {name}",
    it: "richiesto a {name}",
  },
  "arrivée {time}": { de: "Ankunft {time}", it: "arrivo {time}" },
  "retard {duration}": {
    de: "Verspätung {duration}",
    it: "ritardo {duration}",
  },
  "Indiquez le moyen demandé.": {
    de: "Geben Sie das angeforderte Mittel an.",
    it: "Indicare il mezzo richiesto.",
  },
  "Demande enregistrée.": {
    de: "Anforderung gespeichert.",
    it: "Richiesta salvata.",
  },
  "Demande notée au journal.": {
    de: "Anforderung im Journal erfasst.",
    it: "Richiesta annotata nel diario.",
  },
  "Nouvelle demande de moyens": {
    de: "Neue Mittelanforderung",
    it: "Nuova richiesta di mezzi",
  },
  "Lecture seule.": { de: "Nur lesen.", it: "Sola lettura." },
  "Supprimer la demande ?": {
    de: "Anforderung löschen?",
    it: "Eliminare la richiesta?",
  },
  "Demande supprimée. Les entrées du journal restent.": {
    de: "Anforderung gelöscht. Die Journaleinträge bleiben erhalten.",
    it: "Richiesta eliminata. Le voci del diario restano.",
  },
  Demander: { de: "Anfordern", it: "Richiedere" },
  "État : <0>{status}</0> · les changements d’état se font avec les boutons de la demande.":
    {
      de: "Status: <0>{status}</0> · Statusänderungen erfolgen über die Schaltflächen der Anforderung.",
      it: "Stato: <0>{status}</0> · i cambiamenti di stato si fanno con i pulsanti della richiesta.",
    },
  "Consigner la demande au journal": {
    de: "Anforderung im Journal erfassen",
    it: "Registrare la richiesta nel diario",
  },
  "Une entrée « Demande » à traiter, close à l’arrivée ou au refus.": {
    de: "Ein Eintrag « Anfrage » zu bearbeiten, abgeschlossen beim Eintreffen oder bei Ablehnung.",
    it: "Una voce « Richiesta » da trattare, chiusa all’arrivo o al rifiuto.",
  },
  "{label} : arrivé, ajouté aux moyens.": {
    de: "{label}: eingetroffen, zu den Mitteln hinzugefügt.",
    it: "{label}: arrivato, aggiunto ai mezzi.",
  },
  "{label} : {status}.": { de: "{label}: {status}.", it: "{label}: {status}." },
  "{label} : {status}": { de: "{label}: {status}", it: "{label}: {status}" },
  "Créer le moyen « {title} »": {
    de: "Mittel « {title} » erstellen",
    it: "Creare il mezzo « {title} »",
  },
  "Rattacher à : {name}": {
    de: "Zuordnen zu: {name}",
    it: "Associare a: {name}",
  },
  "Consigner au journal": {
    de: "Im Journal erfassen",
    it: "Registrare nel diario",
  },
  // Buttons moving a request (shared/requests.ts MOVE_LABEL)
  Redemander: { de: "Erneut anfordern", it: "Richiedere di nuovo" },
  Accordée: { de: "Bewilligt", it: "Accordata" },
  Refusée: { de: "Abgelehnt", it: "Rifiutata" },
  "En route (bouton)": { fr: "En route", de: "Unterwegs", it: "In viaggio" },
  "Arrivée (bouton)": { fr: "Arrivée", de: "Eingetroffen", it: "Arrivata" },
  Libérer: { de: "Entlassen", it: "Liberare" },
  "Annuler (demande)": { fr: "Annuler", de: "Annullieren", it: "Annullare" },
} satisfies Dict);

/**
 * A fixed value in the running text of a sentence ("… : en route."): lower
 * case in French and Italian, as is in German (nouns keep their capital).
 */
export function lowerLabel(value: string): string {
  const label = enumLabel(value);
  return getLang() === "de" ? label : label.toLowerCase();
}
