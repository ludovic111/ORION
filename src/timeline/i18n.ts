import { translator, type Dict } from "../../shared/i18n/core.ts";
import { common } from "../../shared/i18n/common.ts";

// Time machine, history of a record, audit rows, frozen points
// (src/timeline/*), and the names of the record fields (format.ts).
export const { t, tn, tIn, dict } = translator({
  ...common,
  // Names of the fields (format.ts)
  Libellé: { de: "Bezeichnung", it: "Denominazione" },
  Signe: { de: "Signatur", it: "Simbolo" },
  Couleur: { de: "Farbe", it: "Colore" },
  Calque: { de: "Ebene", it: "Livello" },
  "Position / tracé": { de: "Position / Verlauf", it: "Posizione / tracciato" },
  Cartes: { de: "Karten", it: "Carte" },
  Taille: { de: "Grösse", it: "Dimensione" },
  Rotation: { de: "Drehung", it: "Rotazione" },
  Pastille: { de: "Rahmen", it: "Cornice" },
  Étiquette: { de: "Beschriftung", it: "Etichetta" },
  Épaisseur: { de: "Strichstärke", it: "Spessore" },
  "Style de trait": { de: "Linienstil", it: "Stile della linea" },
  Nombre: { de: "Anzahl", it: "Numero" },
  "Nom d’appel": { de: "Rufname", it: "Nominativo" },
  "Arrivée prévue": { de: "Voraussichtliche Ankunft", it: "Arrivo previsto" },
  Grade: { de: "Grad", it: "Grado" },
  "Téléphone 2": { de: "Telefon 2", it: "Telefono 2" },
  Favori: { de: "Favorit", it: "Preferito" },
  De: { de: "Von", it: "Da" },
  À: { de: "An", it: "A" },
  Canal: { de: "Kanal", it: "Canale" },
  "Reçu à": { de: "Empfangen um", it: "Ricevuto alle" },
  "Survenu à": { de: "Ereignet um", it: "Avvenuto alle" },
  "Réponse attendue": { de: "Antwort erwartet", it: "Risposta attesa" },
  "Réponse avant": { de: "Antwort bis", it: "Risposta entro" },
  "Entrée du journal": { de: "Journaleintrag", it: "Voce del diario" },
  "Traité par": { de: "Bearbeitet von", it: "Trattato da" },
  "Durée (min)": { de: "Dauer (Min.)", it: "Durata (min)" },
  Participants: { de: "Teilnehmende", it: "Partecipanti" },
  Fait: { de: "Erledigt", it: "Fatto" },
  Température: { de: "Temperatur", it: "Temperatura" },
  Vent: { de: "Wind", it: "Vento" },
  Précipitations: { de: "Niederschlag", it: "Precipitazioni" },
  Visibilité: { de: "Sicht", it: "Visibilità" },
  Conditions: { de: "Bedingungen", it: "Condizioni" },
  Degré: { de: "Stufe", it: "Grado" },
  Danger: { de: "Gefahr", it: "Pericolo" },
  Région: { de: "Region", it: "Regione" },
  Source: { de: "Quelle", it: "Fonte" },
  Fiabilité: { de: "Zuverlässigkeit", it: "Affidabilità" },
  "Mesure / décision": {
    de: "Massnahme / Entscheid",
    it: "Misura / decisione",
  },
  Référence: { de: "Referenz", it: "Riferimento" },
  "Élément A": { de: "Element A", it: "Elemento A" },
  "Élément B": { de: "Element B", it: "Elemento B" },
  Usage: { de: "Verwendung", it: "Uso" },
  "Fond de carte": { de: "Hintergrundkarte", it: "Carta di base" },
  Latitude: { de: "Breitengrad", it: "Latitudine" },
  Longitude: { de: "Längengrad", it: "Longitudine" },
  Zoom: { de: "Zoom", it: "Zoom" },
  "Calques masqués": { de: "Ausgeblendete Ebenen", it: "Livelli nascosti" },
  Image: { de: "Bild", it: "Immagine" },
  Groupe: { de: "Gruppe", it: "Gruppo" },
  Référentiels: { de: "Wertelisten", it: "Elenchi di riferimento" },
  "Lieu météo": { de: "Wetterort", it: "Luogo meteo" },
  "Vue de carte": { de: "Kartenansicht", it: "Vista della carta" },
  Clôture: { de: "Abschluss", it: "Chiusura" },
  Mode: { de: "Modus", it: "Modalità" },
  Classification: { de: "Klassifizierung", it: "Classificazione" },
  Numéro: { de: "Nummer", it: "Numero" },
  "Groupe principal": { de: "Hauptgruppe", it: "Gruppo principale" },
  "Groupe de repli": { de: "Ausweichgruppe", it: "Gruppo di riserva" },
  Remises: { de: "Abgaben", it: "Consegne" },
  Modèle: { de: "Modell", it: "Modello" },
  "N° de série": { de: "Seriennummer", it: "N. di serie" },
  Résultat: { de: "Ergebnis", it: "Risultato" },
  "Groupe radio": { de: "Gesprächsgruppe", it: "Gruppo di conversazione" },
  Présentateur: { de: "Präsentator", it: "Presentatore" },
  Public: { de: "Publikum", it: "Pubblico" },
  "Version présentée": {
    de: "Präsentierte Version",
    it: "Versione presentata",
  },
  Diapositives: { de: "Folien", it: "Diapositive" },
  Format: { de: "Format", it: "Formato" },
  "Empreinte SHA-256": { de: "SHA-256-Fingerabdruck", it: "Impronta SHA-256" },
  "Taille (octets)": { de: "Grösse (Bytes)", it: "Dimensione (byte)" },
  "Empreinte du contenu": {
    de: "Fingerabdruck des Inhalts",
    it: "Impronta del contenuto",
  },
  // Values (format.ts)
  image: { de: "Bild", it: "immagine" },
  "{n} points": { de: "{n} Punkte", it: "{n} punti" },
  "{n} élément": { de: "{n} Element", it: "{n} elemento" },
  "{n} éléments": { de: "{n} Elemente", it: "{n} elementi" },
  "{n} réglage(s)": { de: "{n} Einstellung(en)", it: "{n} impostazione/i" },
  "à l’instant": { de: "gerade eben", it: "proprio ora" },
  "il y a {n} min": { de: "vor {n} Min.", it: "{n} min fa" },
  "il y a {n} h": { de: "vor {n} Std.", it: "{n} h fa" },
  // Audit rows
  Inconnu: { de: "Unbekannt", it: "Sconosciuto" },
  "<0/> a créé <1/> <2/>": {
    de: "<0/> hat <1/> <2/> erstellt",
    it: "<0/> ha creato <1/> <2/>",
  },
  "<0/> a modifié <1/> <2/>": {
    de: "<0/> hat <1/> <2/> geändert",
    it: "<0/> ha modificato <1/> <2/>",
  },
  "<0/> a supprimé <1/> <2/>": {
    de: "<0/> hat <1/> <2/> gelöscht",
    it: "<0/> ha eliminato <1/> <2/>",
  },
  "<0/> a créé <1>cet élément</1>": {
    de: "<0/> hat <1>dieses Element</1> erstellt",
    it: "<0/> ha creato <1>questo elemento</1>",
  },
  "<0/> a supprimé <1>cet élément</1>": {
    de: "<0/> hat <1>dieses Element</1> gelöscht",
    it: "<0/> ha eliminato <1>questo elemento</1>",
  },
  "<0/> a modifié <1>{n} champ</1>": {
    de: "<0/> hat <1>{n} Feld</1> geändert",
    it: "<0/> ha modificato <1>{n} campo</1>",
  },
  "<0/> a modifié <1>{n} champs</1>": {
    de: "<0/> hat <1>{n} Felder</1> geändert",
    it: "<0/> ha modificato <1>{n} campi</1>",
  },
  "+ {n} autre": { de: "+ {n} weiteres", it: "+ {n} altro" },
  "+ {n} autres": { de: "+ {n} weitere", it: "+ {n} altri" },
  "Voir l’opération à ce moment": {
    de: "Einsatz zu diesem Zeitpunkt anzeigen",
    it: "Vedi l’operazione in quel momento",
  },
  "Restaurer cette version": {
    de: "Diese Version wiederherstellen",
    it: "Ripristina questa versione",
  },
  // Frozen point (SnapshotDialog)
  "Point de situation {time}": {
    de: "Lagerapport {time}",
    it: "Punto della situazione {time}",
  },
  "Donnez un nom à ce point de situation.": {
    de: "Geben Sie dieser Momentaufnahme einen Namen.",
    it: "Dare un nome a questa istantanea.",
  },
  "Un point de situation fige un moment passé ou présent.": {
    de: "Eine Momentaufnahme hält einen vergangenen oder aktuellen Zeitpunkt fest.",
    it: "Un’istantanea fissa un momento passato o presente.",
  },
  "« {title} » figé. Retrouvez-le dans la machine à remonter le temps, les exports et les présentations.":
    {
      de: "« {title} » festgehalten. Sie finden es in der Zeitreise, bei den Exporten und bei den Präsentationen.",
      it: "« {title} » fissato. Si ritrova nella macchina del tempo, nelle esportazioni e nelle presentazioni.",
    },
  "Figer un point de situation": {
    de: "Momentaufnahme festhalten",
    it: "Fissa un’istantanea",
  },
  "Donne un nom à un moment de l’opération. Il reste consultable tel quel, même si tout change ensuite, et se choisit en un clic pour présenter, comparer ou exporter.":
    {
      de: "Gibt einem Zeitpunkt des Einsatzes einen Namen. Er bleibt unverändert einsehbar, auch wenn sich danach alles ändert, und lässt sich mit einem Klick zum Präsentieren, Vergleichen oder Exportieren wählen.",
      it: "Dà un nome a un momento dell’operazione. Resta consultabile così com’è, anche se poi tutto cambia, e si sceglie con un clic per presentare, confrontare o esportare.",
    },
  "Moment figé": { de: "Festgehaltener Zeitpunkt", it: "Momento fissato" },
  "Ex. état présenté au rapport de conduite de 14 h": {
    de: "z. B. am Führungsrapport von 14 Uhr präsentierter Stand",
    it: "Es. stato presentato al rapporto di condotta delle 14",
  },
  Figer: { de: "Festhalten", it: "Fissa" },
  "Points déjà figés": {
    de: "Bereits festgehaltene Momentaufnahmen",
    it: "Istantanee già fissate",
  },
  Revoir: { de: "Ansehen", it: "Rivedi" },
  "Supprimer {title}": { de: "{title} löschen", it: "Elimina {title}" },
  "Supprimer ce point (l’historique en garde la trace)": {
    de: "Diese Momentaufnahme löschen (der Verlauf behält eine Spur davon)",
    it: "Elimina questa istantanea (la cronologia ne conserva traccia)",
  },
  // Trace line
  "Créé par {by} le {date}": {
    de: "Erstellt von {by} am {date}",
    it: "Creato da {by} il {date}",
  },
  "Créé le {date}": { de: "Erstellt am {date}", it: "Creato il {date}" },
  "Créé le {date} par {by}": {
    de: "Erstellt am {date} von {by}",
    it: "Creato il {date} da {by}",
  },
  "supprimé par {by} {ago}": {
    de: "gelöscht von {by} {ago}",
    it: "eliminato da {by} {ago}",
  },
  "modifié par {by} {ago}": {
    de: "geändert von {by} {ago}",
    it: "modificato da {by} {ago}",
  },
  "modifié le {date}": { de: "geändert am {date}", it: "modificato il {date}" },
  "{n} versions": { de: "{n} Versionen", it: "{n} versioni" },
  // History sheet
  "Restaurer la version du {date} ? L’état actuel reste dans l’historique.": {
    de: "Version vom {date} wiederherstellen? Der aktuelle Stand bleibt im Verlauf.",
    it: "Ripristinare la versione del {date}? Lo stato attuale resta nella cronologia.",
  },
  "Version restaurée. L’historique garde la trace de la restauration.": {
    de: "Version wiederhergestellt. Der Verlauf hält die Wiederherstellung fest.",
    it: "Versione ripristinata. La cronologia conserva traccia del ripristino.",
  },
  Créé: { de: "Erstellt", it: "Creato" },
  "Dernier changement": { de: "Letzte Änderung", it: "Ultima modifica" },
  Versions: { de: "Versionen", it: "Versioni" },
  "{n} personne": { de: "{n} Person", it: "{n} persona" },
  "{n} personnes": { de: "{n} Personen", it: "{n} persone" },
  "Cet élément a été supprimé le {date} par {by}. Ses versions restent consultables et restaurables.":
    {
      de: "Dieses Element wurde am {date} von {by} gelöscht. Seine Versionen bleiben einsehbar und wiederherstellbar.",
      it: "Questo elemento è stato eliminato il {date} da {by}. Le sue versioni restano consultabili e ripristinabili.",
    },
  "Aucun changement enregistré pour cet élément depuis la mise en place de l’historique. Sa création et sa dernière modification restent indiquées sur sa fiche.":
    {
      de: "Für dieses Element wurde seit der Einführung des Verlaufs keine Änderung erfasst. Seine Erstellung und seine letzte Änderung stehen weiterhin auf seinem Datenblatt.",
      it: "Nessuna modifica registrata per questo elemento dall’introduzione della cronologia. La sua creazione e la sua ultima modifica restano indicate nella sua scheda.",
    },
  // Time bar
  Lent: { de: "Langsam", it: "Lento" },
  Normal: { de: "Normal", it: "Normale" },
  Rapide: { de: "Schnell", it: "Veloce" },
  "Machine à remonter le temps": { de: "Zeitreise", it: "Macchina del tempo" },
  "Version du": { de: "Stand vom", it: "Versione del" },
  "Heure affichée": { de: "Angezeigte Zeit", it: "Ora visualizzata" },
  "{n} changement après": {
    de: "{n} Änderung danach",
    it: "{n} modifica dopo",
  },
  "{n} changements après": {
    de: "{n} Änderungen danach",
    it: "{n} modifiche dopo",
  },
  "Changement précédent": {
    de: "Vorherige Änderung",
    it: "Modifica precedente",
  },
  Pause: { de: "Pause", it: "Pausa" },
  "Rejouer l’opération": {
    de: "Einsatz abspielen",
    it: "Riproduci l’operazione",
  },
  "Rejouer l’opération changement par changement": {
    de: "Einsatz Änderung für Änderung abspielen",
    it: "Riproduci l’operazione modifica per modifica",
  },
  "Changement suivant": { de: "Nächste Änderung", it: "Modifica successiva" },
  Vitesse: { de: "Geschwindigkeit", it: "Velocità" },
  "Donner un nom à ce moment (point de situation)": {
    de: "Diesem Zeitpunkt einen Namen geben (Momentaufnahme)",
    it: "Dare un nome a questo momento (istantanea)",
  },
  "Voir ce qui a changé entre ce moment et maintenant": {
    de: "Anzeigen, was sich zwischen diesem Zeitpunkt und jetzt geändert hat",
    it: "Vedi cosa è cambiato tra questo momento e adesso",
  },
  Comparer: { de: "Vergleichen", it: "Confronta" },
  "Exporter cette version": {
    de: "Diese Version exportieren",
    it: "Esporta questa versione",
  },
  "Présenter cette version": {
    de: "Diese Version präsentieren",
    it: "Presenta questa versione",
  },
  Présenter: { de: "Präsentieren", it: "Presenta" },
  "Autres actions": { de: "Weitere Aktionen", it: "Altre azioni" },
  "<0>Retour au</0> direct": {
    de: "<0>Zurück zu</0> Live",
    it: "<0>Torna alla</0> diretta",
  },
  "Point de situation {title}": {
    de: "Momentaufnahme {title}",
    it: "Istantanea {title}",
  },
  "Moment affiché": { de: "Angezeigter Zeitpunkt", it: "Momento visualizzato" },
  "Figer ce moment": {
    de: "Diesen Zeitpunkt festhalten",
    it: "Fissa questo momento",
  },
  "Comparer avec maintenant": {
    de: "Mit jetzt vergleichen",
    it: "Confronta con adesso",
  },
} satisfies Dict);
