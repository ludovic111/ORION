import { translator, type Dict } from "../../../shared/i18n/core.ts";
import { common } from "../../../shared/i18n/common.ts";

// Network of the links (src/modules/network/NetworkModule.tsx).
export const { t, tn, tIn, dict } = translator({
  ...common,
  "Aucun lien pour l’instant": {
    de: "Noch keine Verknüpfungen",
    it: "Ancora nessun collegamento",
  },
  "Ouvrir le journal": { de: "Journal öffnen", it: "Apri il diario" },
  "Comment ça marche": { de: "So funktioniert es", it: "Come funziona" },
  "{n} élément(s) attendent d’être reliés.": {
    de: "{n} Element(e) warten darauf, verknüpft zu werden.",
    it: "{n} elemento/i in attesa di essere collegati.",
  },
  "Les liens apparaissent tout seuls : mêmes noms d’appel, émetteurs et destinataires, références comme « Suite de #012 », message inscrit au journal, membres d’un poste. Vous pouvez aussi relier deux éléments à la main avec le bouton « Lier » de chaque fiche.":
    {
      de: "Die Verknüpfungen entstehen von selbst: gleiche Rufnamen, Absender und Empfänger, Verweise wie « Fortsetzung von #012 », im Journal erfasste Meldung, Mitglieder eines Postens. Sie können zwei Elemente auch von Hand verknüpfen, mit der Schaltfläche « Verknüpfen » auf jedem Datenblatt.",
      it: "I collegamenti compaiono da soli: stessi nominativi, mittenti e destinatari, riferimenti come « Seguito di #012 », messaggio registrato nel diario, membri di un posto. Si possono anche collegare due elementi a mano con il pulsante « Collega » di ogni scheda.",
    },
  "Chercher dans le réseau…": {
    de: "Im Netzwerk suchen …",
    it: "Cerca nella rete…",
  },
  "Chercher dans le réseau": {
    de: "Im Netzwerk suchen",
    it: "Cerca nella rete",
  },
  "Masquer les éléments sans lien": {
    de: "Elemente ohne Verknüpfung ausblenden",
    it: "Nascondi gli elementi senza collegamento",
  },
  "<0>{nodes}</0> éléments · <1>{links}</1> liens affichés": {
    de: "<0>{nodes}</0> Elemente · <1>{links}</1> Verknüpfungen angezeigt",
    it: "<0>{nodes}</0> elementi · <1>{links}</1> collegamenti visualizzati",
  },
  "({total} au total, dont {manual} créés à la main)": {
    de: "({total} insgesamt, davon {manual} von Hand erstellt)",
    it: "({total} in totale, di cui {manual} creati a mano)",
  },
  "Types d’éléments affichés": {
    de: "Angezeigte Elementtypen",
    it: "Tipi di elementi visualizzati",
  },
  "Afficher ce type": { de: "Diesen Typ anzeigen", it: "Mostra questo tipo" },
  "Masquer ce type": {
    de: "Diesen Typ ausblenden",
    it: "Nascondi questo tipo",
  },
  "Tout afficher": { de: "Alle anzeigen", it: "Mostra tutto" },
  "Réseau de {nodes} éléments et {links} liens. Glisser pour déplacer, molette ou + et − pour zoomer.":
    {
      de: "Netzwerk aus {nodes} Elementen und {links} Verknüpfungen. Ziehen zum Verschieben, Mausrad oder + und − zum Zoomen.",
      it: "Rete di {nodes} elementi e {links} collegamenti. Trascinare per spostare, rotella o + e − per lo zoom.",
    },
  "Aucun élément affiché. Réactivez un type ci-dessus ou désactivez « Masquer les éléments sans lien ».":
    {
      de: "Kein Element angezeigt. Aktivieren Sie oben wieder einen Typ oder deaktivieren Sie « Elemente ohne Verknüpfung ausblenden ».",
      it: "Nessun elemento visualizzato. Riattivare un tipo qui sopra o disattivare « Nascondi gli elementi senza collegamento ».",
    },
  Zoomer: { de: "Vergrössern", it: "Ingrandisci" },
  Dézoomer: { de: "Verkleinern", it: "Riduci" },
  "Afficher tout le réseau": {
    de: "Ganzes Netzwerk anzeigen",
    it: "Mostra tutta la rete",
  },
  Recentrer: { de: "Neu zentrieren", it: "Ricentra" },
  Légende: { de: "Legende", it: "Legenda" },
  "lien créé à la main": {
    de: "von Hand erstellte Verknüpfung",
    it: "collegamento creato a mano",
  },
  "lien automatique": {
    de: "automatische Verknüpfung",
    it: "collegamento automatico",
  },
  urgent: { de: "dringend", it: "urgente" },
  "taille = nombre de liens": {
    de: "Grösse = Anzahl Verknüpfungen",
    it: "dimensione = numero di collegamenti",
  },
  "Élément sélectionné": {
    de: "Ausgewähltes Element",
    it: "Elemento selezionato",
  },
  Centrer: { de: "Zentrieren", it: "Centra" },
  "Les plus reliés": { de: "Am meisten verknüpft", it: "I più collegati" },
  "{n} lien": { de: "{n} Verknüpfung", it: "{n} collegamento" },
  "{n} liens": { de: "{n} Verknüpfungen", it: "{n} collegamenti" },
  "Survoler : voir les liens · Clic : détails · Double-clic : ouvrir": {
    de: "Überfahren: Verknüpfungen sehen · Klick: Details · Doppelklick: öffnen",
    it: "Passare sopra: vedere i collegamenti · Clic: dettagli · Doppio clic: aprire",
  },
} satisfies Dict);
