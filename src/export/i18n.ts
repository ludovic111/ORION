import { translator, type Dict } from "../../shared/i18n/core.ts";
import { common } from "../../shared/i18n/common.ts";

// Export centre, verification and every document written (PDF, Word,
// OpenDocument, spreadsheets, HTML, text, calendar): labels in the language
// of the post; journal data stays as written.
export const { t, tn, tIn, dict } = translator({
  ...common,

  // ---------- Parts of an export (scope.ts) ----------
  "Renseignements clés, tableaux de situation": {
    de: "Schlüsselinformationen, Lagetafeln",
    it: "Informazioni chiave, quadri della situazione",
  },
  "Journal d’intervention": { de: "Einsatzjournal", it: "Diario d’intervento" },
  "Toutes les entrées et leurs versions": {
    de: "Alle Einträge und ihre Versionen",
    it: "Tutte le voci e le loro versioni",
  },
  "Missions et suivi": {
    de: "Aufträge und Pendenzen",
    it: "Missioni e seguito",
  },
  "Entrées à traiter ou en cours": {
    de: "Einträge zu bearbeiten oder in Bearbeitung",
    it: "Voci da trattare o in corso",
  },
  "Réception et synthèse": {
    de: "Eingang und Synthese",
    it: "Ricezione e sintesi",
  },
  Cartes: { de: "Karten", it: "Carte" },
  "Cartes, signes, zones, textes": {
    de: "Karten, Signaturen, Zonen, Texte",
    it: "Carte, simboli, zone, testi",
  },
  "Véhicules, personnel, matériel": {
    de: "Fahrzeuge, Personal, Material",
    it: "Veicoli, personale, materiale",
  },
  "Équipe et postes": { de: "Team und Posten", it: "Squadra e posti" },
  "Postes, cellules, personnes": {
    de: "Posten, Zellen, Personen",
    it: "Posti, cellule, persone",
  },
  "Réseau radio": { de: "Funknetz", it: "Rete radio" },
  "Groupes, noms d’appel, terminaux": {
    de: "Gesprächsgruppen, Rufnamen, Endgeräte",
    it: "Gruppi di conversazione, nominativi, terminali",
  },
  "Prévisions reçues, observations, alertes": {
    de: "Erhaltene Prognosen, Beobachtungen, Warnungen",
    it: "Previsioni ricevute, osservazioni, allerte",
  },
  "Rythme de conduite": { de: "Führungsrhythmus", it: "Ritmo di condotta" },
  "Rapports et rendez-vous": {
    de: "Rapporte und Termine",
    it: "Rapporti e appuntamenti",
  },
  "Réseau des liens": { de: "Beziehungsnetz", it: "Rete dei collegamenti" },
  "Liens entre les éléments": {
    de: "Verknüpfungen zwischen den Elementen",
    it: "Collegamenti tra gli elementi",
  },
  Traçabilité: { de: "Nachvollziehbarkeit", it: "Tracciabilità" },
  "Qui a fait quoi, quand : historique complet": {
    de: "Wer hat was wann getan: vollständiger Verlauf",
    it: "Chi ha fatto cosa, quando: cronologia completa",
  },
  "Exercice et débriefing": {
    de: "Übung und Debriefing",
    it: "Esercizio e debriefing",
  },
  "Scénario, injects et réactions, échéances, RETEX": {
    de: "Szenario, Einspielungen und Reaktionen, Fristen, Debriefing",
    it: "Scenario, inject e reazioni, scadenze, RETEX",
  },
  "Opération complète": { de: "Ganzer Einsatz", it: "Operazione completa" },
  "état actuel": { de: "aktueller Stand", it: "stato attuale" },
  "version du {date}": { de: "Version vom {date}", it: "versione del {date}" },
  "{n} élément choisi": {
    de: "{n} Element ausgewählt",
    it: "{n} elemento scelto",
  },
  "{n} éléments choisis": {
    de: "{n} Elemente ausgewählt",
    it: "{n} elementi scelti",
  },

  // ---------- Stamp (stamp.ts) ----------
  // Lower case in the footer label; verification reads every language.
  "empreinte {fingerprint}": {
    de: "Fingerabdruck {fingerprint}",
    it: "impronta {fingerprint}",
  },
  "clé {key}": { de: "Schlüssel {key}", it: "chiave {key}" },
  EXERCICE: { de: "ÜBUNG", it: "ESERCIZIO" },
  CONFIDENTIEL: { de: "VERTRAULICH", it: "CONFIDENZIALE" },

  // ---------- Formats (formats.ts) ----------
  "Documents imprimables": {
    de: "Druckbare Dokumente",
    it: "Documenti stampabili",
  },
  "Tableurs et données": {
    de: "Tabellen und Daten",
    it: "Fogli di calcolo e dati",
  },
  "Agenda et contacts": { de: "Agenda und Kontakte", it: "Agenda e contatti" },
  Archive: { de: "Archiv", it: "Archivio" },
  "Pack complet": { de: "Komplettpaket", it: "Pacchetto completo" },
  "PowerPoint animé": { de: "PowerPoint animiert", it: "PowerPoint animato" },
  "Diapositives animées, notes, code de vérification.": {
    de: "Animierte Folien, Notizen, Prüfcode.",
    it: "Diapositive animate, note, codice di verifica.",
  },
  "Présentation OpenDocument": {
    de: "OpenDocument-Präsentation",
    it: "Presentazione OpenDocument",
  },
  "LibreOffice Impress, mêmes diapositives.": {
    de: "LibreOffice Impress, gleiche Folien.",
    it: "LibreOffice Impress, stesse diapositive.",
  },
  "PDF diaporama": { de: "PDF-Folien", it: "PDF presentazione" },
  "Une diapositive par page, pour projeter partout.": {
    de: "Eine Folie pro Seite, zum Projizieren überall.",
    it: "Una diapositiva per pagina, da proiettare ovunque.",
  },
  "HTML diaporama": { de: "HTML-Folien", it: "HTML presentazione" },
  "Diaporama autonome, s’ouvre dans tout navigateur.": {
    de: "Eigenständige Präsentation, öffnet sich in jedem Browser.",
    it: "Presentazione autonoma, si apre in qualsiasi browser.",
  },
  "PDF dossier": { de: "PDF-Dossier", it: "PDF dossier" },
  "Couverture, sommaire paginé, chapitres, cartes.": {
    de: "Deckblatt, Inhaltsverzeichnis mit Seiten, Kapitel, Karten.",
    it: "Copertina, indice con pagine, capitoli, carte.",
  },
  "Titres, sommaire, tableaux et cartes, modifiable.": {
    de: "Titel, Inhaltsverzeichnis, Tabellen und Karten, bearbeitbar.",
    it: "Titoli, indice, tabelle e carte, modificabile.",
  },
  "OpenDocument texte": { de: "OpenDocument-Text", it: "OpenDocument testo" },
  "LibreOffice Writer, même contenu que Word.": {
    de: "LibreOffice Writer, gleicher Inhalt wie Word.",
    it: "LibreOffice Writer, stesso contenuto di Word.",
  },
  "Page HTML": { de: "HTML-Seite", it: "Pagina HTML" },
  "Un seul fichier, lisible sur téléphone, imprimable.": {
    de: "Eine einzige Datei, auf dem Telefon lesbar, druckbar.",
    it: "Un solo file, leggibile sul telefono, stampabile.",
  },
  "Texte structuré, titres et tableaux.": {
    de: "Strukturierter Text, Titel und Tabellen.",
    it: "Testo strutturato, titoli e tabelle.",
  },
  "Texte brut": { de: "Reiner Text", it: "Testo semplice" },
  "Lisible partout, une fiche par ligne de tableau.": {
    de: "Überall lesbar, ein Blatt pro Tabellenzeile.",
    it: "Leggibile ovunque, una scheda per riga di tabella.",
  },
  "Fiches messages A4": { de: "Meldeblätter A4", it: "Schede messaggi A4" },
  "Une fiche par entrée du journal.": {
    de: "Ein Blatt pro Journaleintrag.",
    it: "Una scheda per voce del diario.",
  },
  "Journal PDF (tableau)": {
    de: "Journal PDF (Tabelle)",
    it: "Diario PDF (tabella)",
  },
  "Tableau chronologique A4 paysage.": {
    de: "Chronologische Tabelle A4 quer.",
    it: "Tabella cronologica A4 orizzontale.",
  },
  "Plan du réseau radio": { de: "Funknetzplan", it: "Piano della rete radio" },
  "Noms d’appel, groupes, terminaux, remises.": {
    de: "Rufnamen, Gesprächsgruppen, Endgeräte, Ausgaben.",
    it: "Nominativi, gruppi, terminali, consegne.",
  },
  "Étiquettes radio": { de: "Funketiketten", it: "Etichette radio" },
  "Une étiquette QR par terminal, A4.": {
    de: "Eine QR-Etikette pro Endgerät, A4.",
    it: "Un’etichetta QR per terminale, A4.",
  },
  "Une feuille par tableau, filtres, en-tête figé.": {
    de: "Ein Blatt pro Tabelle, Filter, fixierte Kopfzeile.",
    it: "Un foglio per tabella, filtri, intestazione bloccata.",
  },
  "OpenDocument tableur": {
    de: "OpenDocument-Tabelle",
    it: "OpenDocument foglio di calcolo",
  },
  "LibreOffice Calc, mêmes feuilles.": {
    de: "LibreOffice Calc, gleiche Blätter.",
    it: "LibreOffice Calc, stessi fogli.",
  },
  "Un fichier par tableau, point-virgule, UTF-8.": {
    de: "Eine Datei pro Tabelle, Semikolon, UTF-8.",
    it: "Un file per tabella, punto e virgola, UTF-8.",
  },
  "Un fichier par tableau, tabulation, UTF-8.": {
    de: "Eine Datei pro Tabelle, Tabulator, UTF-8.",
    it: "Un file per tabella, tabulazione, UTF-8.",
  },
  "JSON données": { de: "JSON-Daten", it: "JSON dati" },
  "Tableaux structurés, pour d’autres outils.": {
    de: "Strukturierte Tabellen, für andere Werkzeuge.",
    it: "Tabelle strutturate, per altri strumenti.",
  },
  "Image de la carte": { de: "Kartenbild", it: "Immagine della carta" },
  "Chaque carte avec ses objets, haute définition.": {
    de: "Jede Karte mit ihren Objekten, hohe Auflösung.",
    it: "Ogni carta con i suoi oggetti, alta definizione.",
  },
  "SIG (QGIS, ArcGIS), coordonnées WGS 84.": {
    de: "GIS (QGIS, ArcGIS), Koordinaten WGS 84.",
    it: "SIG (QGIS, ArcGIS), coordinate WGS 84.",
  },
  "Google Earth et cartes en ligne.": {
    de: "Google Earth und Online-Karten.",
    it: "Google Earth e carte online.",
  },
  "Appareils GPS : points et traces.": {
    de: "GPS-Geräte: Punkte und Tracks.",
    it: "Apparecchi GPS: punti e tracce.",
  },
  Agenda: { de: "Agenda", it: "Agenda" },
  "Rendez-vous du rythme de conduite, tout agenda.": {
    de: "Termine des Führungsrhythmus, für jede Agenda.",
    it: "Appuntamenti del ritmo di condotta, per ogni agenda.",
  },
  "vCard 4.0 pour téléphone et messagerie.": {
    de: "vCard 4.0 für Telefon und E-Mail-Programm.",
    it: "vCard 4.0 per telefono e posta elettronica.",
  },
  "Archive orion aic chiffrée": {
    de: "Verschlüsseltes orion aic-Archiv",
    it: "Archivio orion aic cifrato",
  },
  "Tout l’historique : rejouable après import.": {
    de: "Der ganze Verlauf: nach dem Import erneut abspielbar.",
    it: "Tutta la cronologia: riproducibile dopo l’importazione.",
  },
  "Archive JSON réimportable": {
    de: "Wieder importierbares JSON-Archiv",
    it: "Archivio JSON reimportabile",
  },
  "En clair, historique compris, réimportable.": {
    de: "Unverschlüsselt, mit Verlauf, wieder importierbar.",
    it: "In chiaro, cronologia compresa, reimportabile.",
  },
  "PDF, Word, Excel, HTML, archive, carte, agenda, contacts, PowerPoint et empreintes.":
    {
      de: "PDF, Word, Excel, HTML, Archiv, Karte, Agenda, Kontakte, PowerPoint und Fingerabdrücke.",
      it: "PDF, Word, Excel, HTML, archivio, carta, agenda, contatti, PowerPoint e impronte.",
    },

  // ---------- Every document ----------
  "dossier de l’opération": {
    de: "Dossier des Einsatzes",
    it: "dossier dell’operazione",
  },
  "{title} · dossier orion aic": {
    de: "{title} · orion aic-Dossier",
    it: "{title} · dossier orion aic",
  },
  "{label} : {value}": { de: "{label}: {value}", it: "{label}: {value}" },
  "Document n°": { de: "Dokument Nr.", it: "Documento n." },
  Empreinte: { de: "Fingerabdruck", it: "Impronta" },
  "Empreinte du contenu": {
    de: "Fingerabdruck des Inhalts",
    it: "Impronta del contenuto",
  },
  Sommaire: { de: "Inhaltsverzeichnis", it: "Indice" },
  "Partie {n}": { de: "Teil {n}", it: "Parte {n}" },
  "Carte · {title}": { de: "Karte · {title}", it: "Carta · {title}" },
  "Carte {title}": { de: "Karte {title}", it: "Carta {title}" },
  "… {n} lignes de plus dans les exports tableur.": {
    de: "… {n} weitere Zeilen in den Tabellen-Exporten.",
    it: "… {n} righe in più negli export in fogli di calcolo.",
  },
  "… {n} lignes de plus dans les exports tableur (Excel, OpenDocument, CSV).": {
    de: "… {n} weitere Zeilen in den Tabellen-Exporten (Excel, OpenDocument, CSV).",
    it: "… {n} righe in più negli export in fogli di calcolo (Excel, OpenDocument, CSV).",
  },
  Propriété: { de: "Eigenschaft", it: "Proprietà" },
  "QR de vérification": { de: "Prüf-QR-Code", it: "QR di verifica" },
  "Code QR de vérification": {
    de: "QR-Code zur Überprüfung",
    it: "Codice QR di verifica",
  },
  "Vérification : ce code identifie l’export et l’empreinte de son contenu. Dans orion aic, Traçabilité → Vérifier un document.":
    {
      de: "Überprüfung: Dieser Code bezeichnet den Export und den Fingerabdruck seines Inhalts. In orion aic: Nachvollziehbarkeit → Dokument prüfen.",
      it: "Verifica: questo codice identifica l’export e l’impronta del suo contenuto. In orion aic, Tracciabilità → Verifica un documento.",
    },
  "Vérification de ce document": {
    de: "Überprüfung dieses Dokuments",
    it: "Verifica di questo documento",
  },
  "Ce document a été produit par orion aic. Son contenu a l’empreinte {fingerprint} ; l’export porte le numéro {id}. L’empreinte SHA-256 du fichier est inscrite au registre des exports de l’opération. Pour vérifier un exemplaire, déposez le fichier dans orion aic (Traçabilité → Vérifier un document) ou scannez le code ci-dessous.":
    {
      de: "Dieses Dokument wurde von orion aic erstellt. Sein Inhalt hat den Fingerabdruck {fingerprint}; der Export trägt die Nummer {id}. Der SHA-256-Fingerabdruck der Datei ist im Exportregister des Einsatzes eingetragen. Um ein Exemplar zu prüfen, legen Sie die Datei in orion aic ab (Nachvollziehbarkeit → Dokument prüfen) oder scannen Sie den Code unten.",
      it: "Questo documento è stato prodotto da orion aic. Il suo contenuto ha l’impronta {fingerprint}; l’export porta il numero {id}. L’impronta SHA-256 del file è iscritta nel registro degli export dell’operazione. Per verificare un esemplare, depositare il file in orion aic (Tracciabilità → Verifica un documento) o scansionare il codice qui sotto.",
    },
  "Vérifier ce document": {
    de: "Dieses Dokument prüfen",
    it: "Verifica questo documento",
  },
  "Vérifier ce document : orion aic → Traçabilité → Vérifier un document.": {
    de: "Dieses Dokument prüfen: orion aic → Nachvollziehbarkeit → Dokument prüfen.",
    it: "Verifica questo documento: orion aic → Tracciabilità → Verifica un documento.",
  },
  "Ce code identifie l’export n° {id}, l’empreinte SHA-256 de son contenu et sa signature par la clé {key} ({alg}). Le fichier PDF est signé lui aussi. Dans orion aic, Traçabilité → Vérifier un document : déposer le PDF ou saisir le texte de ce code.":
    {
      de: "Dieser Code bezeichnet den Export Nr. {id}, den SHA-256-Fingerabdruck seines Inhalts und seine Signatur mit dem Schlüssel {key} ({alg}). Auch die PDF-Datei ist signiert. In orion aic, Nachvollziehbarkeit → Dokument prüfen: das PDF ablegen oder den Text dieses Codes eingeben.",
      it: "Questo codice identifica l’export n. {id}, l’impronta SHA-256 del suo contenuto e la sua firma con la chiave {key} ({alg}). Anche il file PDF è firmato. In orion aic, Tracciabilità → Verifica un documento: depositare il PDF o inserire il testo di questo codice.",
    },
  "Ce code identifie l’export n° {id} et l’empreinte de son contenu ({fingerprint}). L’empreinte SHA-256 du fichier est inscrite au registre des exports de l’opération : dans orion aic, Traçabilité → Vérifier un document.":
    {
      de: "Dieser Code bezeichnet den Export Nr. {id} und den Fingerabdruck seines Inhalts ({fingerprint}). Der SHA-256-Fingerabdruck der Datei ist im Exportregister des Einsatzes eingetragen: in orion aic, Nachvollziehbarkeit → Dokument prüfen.",
      it: "Questo codice identifica l’export n. {id} e l’impronta del suo contenuto ({fingerprint}). L’impronta SHA-256 del file è iscritta nel registro degli export dell’operazione: in orion aic, Tracciabilità → Verifica un documento.",
    },
  Page: { de: "Seite", it: "Pagina" },
  "Vérification : {code}": {
    de: "Überprüfung: {code}",
    it: "Verifica: {code}",
  },
  "{caption}. Image et données géographiques : exports PNG, GeoJSON, KML ou GPX.":
    {
      de: "{caption}. Bild und Geodaten: Exporte PNG, GeoJSON, KML oder GPX.",
      it: "{caption}. Immagine e dati geografici: export PNG, GeoJSON, KML o GPX.",
    },
  tableau: { de: "tabelle", it: "tabella" },
  "Un fichier par tableau, UTF-8, séparateur point-virgule.": {
    de: "Eine Datei pro Tabelle, UTF-8, Trennzeichen Semikolon.",
    it: "Un file per tabella, UTF-8, separatore punto e virgola.",
  },
  "Un fichier par tableau, UTF-8, séparateur tabulation.": {
    de: "Eine Datei pro Tabelle, UTF-8, Trennzeichen Tabulator.",
    it: "Un file per tabella, UTF-8, separatore tabulazione.",
  },
  "LISEZMOI.txt": { de: "LIESMICH.txt", it: "LEGGIMI.txt" },

  // ---------- Spreadsheets (sheets.ts) ----------
  Feuille: { de: "Blatt", it: "Foglio" },
  Historique: { de: "Verlauf", it: "Cronologia" },
  Couverture: { de: "Deckblatt", it: "Copertina" },
  Opération: { de: "Einsatz", it: "Operazione" },
  Vérification: { de: "Überprüfung", it: "Verifica" },
  Mention: { de: "Vermerk", it: "Menzione" },
  Feuilles: { de: "Blätter", it: "Fogli" },

  // ---------- Cover (dossier.ts) ----------
  "Reconstitution de la version choisie": {
    de: "Gewählte Version wird wiederhergestellt",
    it: "Ricostruzione della versione scelta",
  },
  "État actuel": { de: "Aktueller Stand", it: "Stato attuale" },
  "Version du {date}": { de: "Version vom {date}", it: "Versione del {date}" },
  Référence: { de: "Referenz", it: "Riferimento" },
  Mode: { de: "Modus", it: "Modalità" },
  Classification: { de: "Klassifizierung", it: "Classificazione" },
  "Journal ouvert le": { de: "Journal eröffnet am", it: "Diario aperto il" },
  "Journal clôturé le": {
    de: "Journal abgeschlossen am",
    it: "Diario chiuso il",
  },
  "Version présentée": { de: "Gezeigte Version", it: "Versione presentata" },
  "Établi par": { de: "Erstellt von", it: "Redatto da" },
  "Exporté le": { de: "Exportiert am", it: "Esportato il" },
  "{date} · heures Europe/Zurich": {
    de: "{date} · Zeiten Europe/Zurich",
    it: "{date} · orari Europe/Zurich",
  },

  // ---------- Chapters (dossier.ts) ----------
  "Code {code}": { de: "Code {code}", it: "Codice {code}" },
  oui: { de: "ja", it: "sì" },
  non: { de: "nein", it: "no" },
  "… {n} autres champs": {
    de: "… {n} weitere Felder",
    it: "… altri {n} campi",
  },
  "{n} élément": { de: "{n} Element", it: "{n} elemento" },
  "{n} éléments": { de: "{n} Elemente", it: "{n} elementi" },
  "Renseignements clés": {
    de: "Schlüsselinformationen",
    it: "Informazioni chiave",
  },
  "{n} renseignement": { de: "{n} Information", it: "{n} informazione" },
  "{n} renseignements": { de: "{n} Informationen", it: "{n} informazioni" },
  Renseignement: { de: "Information", it: "Informazione" },
  "Mis à jour le {date} par {name}": {
    de: "Aktualisiert am {date} von {name}",
    it: "Aggiornato il {date} da {name}",
  },
  "Mis à jour le {date}": {
    de: "Aktualisiert am {date}",
    it: "Aggiornato il {date}",
  },
  "Points de situation figés": {
    de: "Festgehaltene Lagerapporte",
    it: "Punti della situazione fissati",
  },
  "Points de situation": { de: "Lagerapporte", it: "Punti della situazione" },
  "Point de situation": { de: "Lagerapport", it: "Punto della situazione" },
  "{n} point": { de: "{n} Punkt", it: "{n} punto" },
  "{n} points": { de: "{n} Punkte", it: "{n} punti" },
  "Tableau de situation": { de: "Lagetafel", it: "Quadro della situazione" },
  "renseignement clé": {
    de: "Schlüsselinformation",
    it: "informazione chiave",
  },
  "renseignements clés": {
    de: "Schlüsselinformationen",
    it: "informazioni chiave",
  },
  "tableau de situation": { de: "Lagetafel", it: "quadro della situazione" },
  "tableaux de situation": {
    de: "Lagetafeln",
    it: "quadri della situazione",
  },
  "Entrées du journal": { de: "Journaleinträge", it: "Voci del diario" },
  "{n} entrée · ordre chronologique": {
    de: "{n} Eintrag · chronologisch",
    it: "{n} voce · ordine cronologico",
  },
  "{n} entrées · ordre chronologique": {
    de: "{n} Einträge · chronologisch",
    it: "{n} voci · ordine cronologico",
  },
  Événement: { de: "Ereignis", it: "Evento" },
  Réception: { de: "Eingang", it: "Ricezione" },
  Confirmation: { de: "Bestätigung", it: "Conferma" },
  Canal: { de: "Kanal", it: "Canale" },
  "Mesure / décision": {
    de: "Massnahme / Entscheid",
    it: "Misura / decisione",
  },
  "Moyens / besoins": { de: "Mittel / Bedarf", it: "Mezzi / fabbisogno" },
  "Saisi par": { de: "Erfasst von", it: "Registrato da" },
  Versions: { de: "Versionen", it: "Versioni" },
  "De → à": { de: "Von → an", it: "Da → a" },
  Suivi: { de: "Nachverfolgung", it: "Seguito" },
  "reçu {date}": { de: "empfangen {date}", it: "ricevuto {date}" },
  Mesure: { de: "Massnahme", it: "Misura" },
  "{n} versions": { de: "{n} Versionen", it: "{n} versioni" },
  "Échéance {date}": { de: "Frist {date}", it: "Scadenza {date}" },
  "Saisie initiale": { de: "Ersterfassung", it: "Registrazione iniziale" },
  "Versions des entrées": {
    de: "Versionen der Einträge",
    it: "Versioni delle voci",
  },
  "{n} version": { de: "{n} Version", it: "{n} versione" },
  Version: { de: "Version", it: "Versione" },
  Motif: { de: "Grund", it: "Motivo" },
  Modifications: { de: "Änderungen", it: "Modifiche" },
  "Entrées supprimées": { de: "Gelöschte Einträge", it: "Voci eliminate" },
  Supprimées: { de: "Gelöscht", it: "Eliminate" },
  "Le contenu d’une entrée supprimée n’est pas conservé": {
    de: "Der Inhalt eines gelöschten Eintrags wird nicht aufbewahrt",
    it: "Il contenuto di una voce eliminata non è conservato",
  },
  "Supprimée le": { de: "Gelöscht am", it: "Eliminata il" },
  Par: { de: "Von", it: "Da" },
  entrée: { de: "Eintrag", it: "voce" },
  entrées: { de: "Einträge", it: "voci" },
  urgente: { de: "dringend", it: "urgente" },
  urgentes: { de: "dringend", it: "urgenti" },
  "à suivre": { de: "offen", it: "da seguire" },
  modifiée: { de: "geändert", it: "modificata" },
  modifiées: { de: "geändert", it: "modificate" },
  supprimée: { de: "gelöscht", it: "eliminata" },
  supprimées: { de: "gelöscht", it: "eliminate" },
  "Missions et points ouverts": {
    de: "Aufträge und offene Punkte",
    it: "Missioni e punti aperti",
  },
  "État au {date}": { de: "Stand am {date}", it: "Stato al {date}" },
  "Mission / demande": { de: "Auftrag / Anfrage", it: "Missione / richiesta" },
  Retard: { de: "Verspätung", it: "Ritardo" },
  "EN RETARD": { de: "VERSPÄTET", it: "IN RITARDO" },
  ouverte: { de: "offen", it: "aperta" },
  ouvertes: { de: "offen", it: "aperte" },
  "en cours": { de: "in Bearbeitung", it: "in corso" },
  "en retard": { de: "verspätet", it: "in ritardo" },
  "Messages reçus": { de: "Empfangene Meldungen", it: "Messaggi ricevuti" },
  "{n} message": { de: "{n} Meldung", it: "{n} messaggio" },
  "{n} messages": { de: "{n} Meldungen", it: "{n} messaggi" },
  Reçu: { de: "Empfangen", it: "Ricevuto" },
  De: { de: "Von", it: "Da" },
  À: { de: "An", it: "A" },
  "Réponse avant": { de: "Antwort bis", it: "Risposta entro" },
  "Traité par": { de: "Bearbeitet von", it: "Trattato da" },
  "N° / reçu": { de: "Nr. / empfangen", it: "N. / ricevuto" },
  "Réponse {date}": { de: "Antwort {date}", it: "Risposta {date}" },
  "Réponse attendue": { de: "Antwort erwartet", it: "Risposta attesa" },
  message: { de: "Meldung", it: "messaggio" },
  messages: { de: "Meldungen", it: "messaggi" },
  nouveau: { de: "neu", it: "nuovo" },
  nouveaux: { de: "neu", it: "nuovi" },
  urgent: { de: "dringend", it: "urgente" },
  urgents: { de: "dringend", it: "urgenti" },
  "réponse attendue": { de: "Antwort erwartet", it: "risposta attesa" },
  "réponses attendues": { de: "Antworten erwartet", it: "risposte attese" },
  "{n} points · centre {position}": {
    de: "{n} Punkte · Mitte {position}",
    it: "{n} punti · centro {position}",
  },
  "Carte de situation": { de: "Lagekarte", it: "Carta della situazione" },
  "{n} objet": { de: "{n} Objekt", it: "{n} oggetto" },
  "{n} objets": { de: "{n} Objekte", it: "{n} oggetti" },
  "Objets · {map}": { de: "Objekte · {map}", it: "Oggetti · {map}" },
  "Objets de la carte": { de: "Objekte der Karte", it: "Oggetti della carta" },
  Signe: { de: "Signatur", it: "Simbolo" },
  Calque: { de: "Ebene", it: "Livello" },
  "Position (WGS 84)": { de: "Position (WGS 84)", it: "Posizione (WGS 84)" },
  Modifié: { de: "Geändert", it: "Modificato" },
  "(sans nom)": { de: "(ohne Namen)", it: "(senza nome)" },
  Ligne: { de: "Linie", it: "Linea" },
  Zone: { de: "Zone", it: "Zona" },
  carte: { de: "Karte", it: "carta" },
  cartes: { de: "Karten", it: "carte" },
  objet: { de: "Objekt", it: "oggetto" },
  objets: { de: "Objekte", it: "oggetti" },
  "signe personnalisé": {
    de: "eigene Signatur",
    it: "simbolo personalizzato",
  },
  "signes personnalisés": {
    de: "eigene Signaturen",
    it: "simboli personalizzati",
  },
  "{n} moyen": { de: "{n} Mittel", it: "{n} mezzo" },
  "{n} moyens": { de: "{n} Mittel", it: "{n} mezzi" },
  "Nom d’appel": { de: "Rufname", it: "Nominativo" },
  Nombre: { de: "Anzahl", it: "Numero" },
  "Arrivée prévue": { de: "Ankunft geplant", it: "Arrivo previsto" },
  Arrivée: { de: "Ankunft", it: "Arrivo" },
  "Lieu et mission": { de: "Ort und Auftrag", it: "Luogo e missione" },
  moyen: { de: "Mittel", it: "mezzo" },
  moyens: { de: "Mittel", it: "mezzi" },
  engagé: { de: "im Einsatz", it: "impiegato" },
  engagés: { de: "im Einsatz", it: "impiegati" },
  "en route": { de: "unterwegs", it: "in viaggio" },
  disponible: { de: "verfügbar", it: "disponibile" },
  disponibles: { de: "verfügbar", it: "disponibili" },
  "hors service": { de: "ausser Betrieb", it: "fuori servizio" },
  "Postes et cellules": { de: "Posten und Zellen", it: "Posti e cellule" },
  Postes: { de: "Posten", it: "Posti" },
  "Poste (cellule)": { fr: "Poste", de: "Posten", it: "Posto" },
  "{n} poste": { de: "{n} Posten", it: "{n} posto" },
  "{n} postes": { de: "{n} Posten", it: "{n} posti" },
  Personnes: { de: "Personen", it: "Persone" },
  Personne: { de: "Person", it: "Persona" },
  "{n} personne": { de: "{n} Person", it: "{n} persona" },
  "{n} personnes": { de: "{n} Personen", it: "{n} persone" },
  Équipe: { de: "Team", it: "Squadra" },
  Grade: { de: "Grad", it: "Grado" },
  Depuis: { de: "Seit", it: "Da" },
  "Jusqu’à": { de: "Bis", it: "Fino a" },
  "jusqu’à {date}": { de: "bis {date}", it: "fino al {date}" },
  "Fonction et poste": { de: "Funktion und Posten", it: "Funzione e posto" },
  Joindre: { de: "Erreichbarkeit", it: "Recapiti" },
  poste: { de: "Posten", it: "posto" },
  postes: { de: "Posten", it: "posti" },
  personne: { de: "Person", it: "persona" },
  personnes: { de: "Personen", it: "persone" },
  présente: { de: "anwesend", it: "presente" },
  présentes: { de: "anwesend", it: "presenti" },
  "terminaux remis": { de: "Endgeräte ausgegeben", it: "terminali consegnati" },
  "nom d’appel": { de: "Rufname", it: "nominativo" },
  "noms d’appel": { de: "Rufnamen", it: "nominativi" },
  groupe: { de: "Gesprächsgruppe", it: "gruppo" },
  groupes: { de: "Gesprächsgruppen", it: "gruppi" },
  contrôle: { de: "Kontrolle", it: "controllo" },
  contrôles: { de: "Kontrollen", it: "controlli" },
  "Radio plan": { de: "Funk Plan", it: "Radio piano" },
  "Radio groupes": { de: "Funk Gruppen", it: "Radio gruppi" },
  "Radio terminaux": { de: "Funk Endgeräte", it: "Radio terminali" },
  "Radio remises": { de: "Funk Ausgaben", it: "Radio consegne" },
  "Radio contrôles": { de: "Funk Kontrollen", it: "Radio controlli" },
  "Radio {id}": { de: "Funk {id}", it: "Radio {id}" },
  Annuaire: { de: "Verzeichnis", it: "Rubrica" },
  "{n} contact": { de: "{n} Kontakt", it: "{n} contatto" },
  "{n} contacts": { de: "{n} Kontakte", it: "{n} contatti" },
  "Téléphone 2": { de: "Telefon 2", it: "Telefono 2" },
  Téléphones: { de: "Telefone", it: "Telefoni" },
  "E-mail · radio": { de: "E-Mail · Funk", it: "E-mail · radio" },
  "Adresse et remarques": {
    de: "Adresse und Bemerkungen",
    it: "Indirizzo e note",
  },
  contact: { de: "Kontakt", it: "contatto" },
  contacts: { de: "Kontakte", it: "contatti" },
  favori: { de: "Favorit", it: "preferito" },
  favoris: { de: "Favoriten", it: "preferiti" },
  "Prévision pour {place}": {
    de: "Prognose für {place}",
    it: "Previsione per {place}",
  },
  "Conditions inconnues": {
    de: "Unbekannte Verhältnisse",
    it: "Condizioni sconosciute",
  },
  "Vent {wind}, rafales {gusts}": {
    de: "Wind {wind}, Böen {gusts}",
    it: "Vento {wind}, raffiche {gusts}",
  },
  "Vent {wind}": { de: "Wind {wind}", it: "Vento {wind}" },
  "Précipitations {value}": {
    de: "Niederschlag {value}",
    it: "Precipitazioni {value}",
  },
  "Humidité {value}": { de: "Feuchtigkeit {value}", it: "Umidità {value}" },
  "Reçue le {date} · modèle {model} · Open-Meteo": {
    de: "Erhalten am {date} · Modell {model} · Open-Meteo",
    it: "Ricevuta il {date} · modello {model} · Open-Meteo",
  },
  "Prochaines heures": { de: "Nächste Stunden", it: "Prossime ore" },
  "Météo heures": { de: "Wetter Stunden", it: "Meteo ore" },
  "Prévision reçue le {date}": {
    de: "Prognose erhalten am {date}",
    it: "Previsione ricevuta il {date}",
  },
  "Prochains jours": { de: "Nächste Tage", it: "Prossimi giorni" },
  "Météo jours": { de: "Wetter Tage", it: "Meteo giorni" },
  "{n} jour": { de: "{n} Tag", it: "{n} giorno" },
  "{n} jours": { de: "{n} Tage", it: "{n} giorni" },
  Temps: { de: "Wetter", it: "Tempo" },
  Température: { de: "Temperatur", it: "Temperatura" },
  Précipitations: { de: "Niederschlag", it: "Precipitazioni" },
  Probabilité: { de: "Wahrscheinlichkeit", it: "Probabilità" },
  Vent: { de: "Wind", it: "Vento" },
  Rafales: { de: "Böen", it: "Raffiche" },
  Jour: { de: "Tag", it: "Giorno" },
  Min: { de: "Min.", it: "Min." },
  Max: { de: "Max.", it: "Max." },
  "Alertes météo": { de: "Wetterwarnungen", it: "Allerte meteo" },
  Alertes: { de: "Warnungen", it: "Allerte" },
  Alerte: { de: "Warnung", it: "Allerta" },
  "{n} alerte": { de: "{n} Warnung", it: "{n} allerta" },
  "{n} alertes": { de: "{n} Warnungen", it: "{n} allerte" },
  Danger: { de: "Gefahr", it: "Pericolo" },
  Degré: { de: "Stufe", it: "Grado" },
  Région: { de: "Region", it: "Regione" },
  Du: { de: "Von", it: "Dal" },
  Au: { de: "Bis", it: "Al" },
  Source: { de: "Quelle", it: "Fonte" },
  "À venir": { de: "Bevorstehend", it: "In arrivo" },
  Terminée: { de: "Beendet", it: "Terminata" },
  "En vigueur": { de: "In Kraft", it: "In vigore" },
  "Observations sur place": {
    de: "Beobachtungen vor Ort",
    it: "Osservazioni sul posto",
  },
  Observations: { de: "Beobachtungen", it: "Osservazioni" },
  Observation: { de: "Beobachtung", it: "Osservazione" },
  "{n} observation": { de: "{n} Beobachtung", it: "{n} osservazione" },
  "{n} observations": { de: "{n} Beobachtungen", it: "{n} osservazioni" },
  Conditions: { de: "Verhältnisse", it: "Condizioni" },
  Visibilité: { de: "Sicht", it: "Visibilità" },
  "alerte en vigueur": { de: "Warnung in Kraft", it: "allerta in vigore" },
  "alertes en vigueur": {
    de: "Warnungen in Kraft",
    it: "allerte in vigore",
  },
  observation: { de: "Beobachtung", it: "osservazione" },
  observations: { de: "Beobachtungen", it: "osservazioni" },
  "prévision reçue": { de: "Prognose erhalten", it: "previsione ricevuta" },
  "prévisions reçues": {
    de: "Prognosen erhalten",
    it: "previsioni ricevute",
  },
  "Prévision {place}": { de: "Prognose {place}", it: "Previsione {place}" },
  "Reçue le {date}": { de: "Erhalten am {date}", it: "Ricevuta il {date}" },
  "{n} rendez-vous": { de: "{n} Termine", it: "{n} appuntamenti" },
  "{n} rendez-vous (un)": {
    fr: "{n} rendez-vous",
    de: "{n} Termin",
    it: "{n} appuntamento",
  },
  Participants: { de: "Teilnehmende", it: "Partecipanti" },
  Fait: { de: "Erledigt", it: "Fatto" },
  Passé: { de: "Vorbei", it: "Passato" },
  "En cours": { de: "Läuft", it: "In corso" },
  "rendez-vous": { de: "Termine", it: "appuntamenti" },
  "rendez-vous (un)": { fr: "rendez-vous", de: "Termin", it: "appuntamento" },
  "à venir": { de: "bevorstehend", it: "in arrivo" },
  "{kind} (absent à cette heure)": {
    de: "{kind} (zu dieser Zeit nicht vorhanden)",
    it: "{kind} (assente a quest’ora)",
  },
  Élément: { de: "Element", it: "Elemento" },
  "Élément lié": { de: "Verknüpftes Element", it: "Elemento collegato" },
  Lien: { de: "Verknüpfung", it: "Collegamento" },
  Liens: { de: "Verknüpfungen", it: "Collegamenti" },
  Le: { de: "Datum", it: "Data" },
  "Liens créés par les opérateurs": {
    de: "Von den Operateuren erstellte Verknüpfungen",
    it: "Collegamenti creati dagli operatori",
  },
  lien: { de: "Verknüpfung", it: "collegamento" },
  liens: { de: "Verknüpfungen", it: "collegamenti" },
  Création: { de: "Erstellung", it: "Creazione" },
  Modification: { de: "Änderung", it: "Modifica" },
  Suppression: { de: "Löschung", it: "Eliminazione" },
  "Historique des changements": {
    de: "Verlauf der Änderungen",
    it: "Cronologia delle modifiche",
  },
  "{n} changement · ordre chronologique": {
    de: "{n} Änderung · chronologisch",
    it: "{n} modifica · ordine cronologico",
  },
  "{n} changements · ordre chronologique": {
    de: "{n} Änderungen · chronologisch",
    it: "{n} modifiche · ordine cronologico",
  },
  Qui: { de: "Wer", it: "Chi" },
  Action: { de: "Aktion", it: "Azione" },
  Détail: { de: "Detail", it: "Dettaglio" },
  "Registre des exports": { de: "Exportregister", it: "Registro degli export" },
  Exports: { de: "Exporte", it: "Export" },
  Export: { de: "Export", it: "Export" },
  "{n} fichier": { de: "{n} Datei", it: "{n} file" },
  "{n} fichiers": { de: "{n} Dateien", it: "{n} file" },
  Format: { de: "Format", it: "Formato" },
  Fichier: { de: "Datei", it: "File" },
  "SHA-256": { de: "SHA-256", it: "SHA-256" },
  "Présentations données": {
    de: "Gehaltene Präsentationen",
    it: "Presentazioni tenute",
  },
  Présentations: { de: "Präsentationen", it: "Presentazioni" },
  "{n} présentation": { de: "{n} Präsentation", it: "{n} presentazione" },
  "{n} présentations": { de: "{n} Präsentationen", it: "{n} presentazioni" },
  Présentateur: { de: "Präsentator", it: "Relatore" },
  Public: { de: "Publikum", it: "Pubblico" },
  Vues: { de: "Folien", it: "Diapositive" },
  "état en direct": { de: "Live-Stand", it: "stato in diretta" },
  "Affichage mural": { de: "Wandanzeige", it: "Schermo murale" },
  changement: { de: "Änderung", it: "modifica" },
  changements: { de: "Änderungen", it: "modifiche" },
  export: { de: "Export", it: "export" },
  exports: { de: "Exporte", it: "export" },
  "{hazard} · degré {level}": {
    de: "{hazard} · Stufe {level}",
    it: "{hazard} · grado {level}",
  },
  "(sans objet)": { de: "(ohne Betreff)", it: "(senza oggetto)" },
  "Heure de l’événement": { de: "Zeit des Ereignisses", it: "Ora dell’evento" },
  Position: { de: "Position", it: "Posizione" },
  Couleur: { de: "Farbe", it: "Colore" },
  Détenteur: { de: "Inhaber", it: "Detentore" },
  Remises: { de: "Ausgaben", it: "Consegne" },

  // Weather codes (WMO), as in the weather module.
  "Ciel dégagé": { de: "Klarer Himmel", it: "Cielo sereno" },
  "Peu nuageux": { de: "Leicht bewölkt", it: "Poco nuvoloso" },
  "Partiellement nuageux": {
    de: "Teilweise bewölkt",
    it: "Parzialmente nuvoloso",
  },
  Couvert: { de: "Bedeckt", it: "Coperto" },
  Brouillard: { de: "Nebel", it: "Nebbia" },
  "Brouillard givrant": { de: "Gefrierender Nebel", it: "Nebbia gelata" },
  "Bruine légère": { de: "Leichter Nieselregen", it: "Pioviggine leggera" },
  Bruine: { de: "Nieselregen", it: "Pioviggine" },
  "Bruine forte": { de: "Starker Nieselregen", it: "Pioviggine forte" },
  "Bruine verglaçante": {
    de: "Gefrierender Nieselregen",
    it: "Pioviggine gelata",
  },
  "Bruine verglaçante forte": {
    de: "Starker gefrierender Nieselregen",
    it: "Pioviggine gelata forte",
  },
  "Pluie faible": { de: "Leichter Regen", it: "Pioggia debole" },
  Pluie: { de: "Regen", it: "Pioggia" },
  "Pluie forte": { de: "Starker Regen", it: "Pioggia forte" },
  "Pluie verglaçante": { de: "Gefrierender Regen", it: "Pioggia gelata" },
  "Pluie verglaçante forte": {
    de: "Starker gefrierender Regen",
    it: "Pioggia gelata forte",
  },
  "Neige faible": { de: "Leichter Schneefall", it: "Neve debole" },
  Neige: { de: "Schneefall", it: "Neve" },
  "Neige forte": { de: "Starker Schneefall", it: "Neve forte" },
  "Grains de neige": { de: "Schneegriesel", it: "Granuli di neve" },
  "Averses faibles": { de: "Leichte Regenschauer", it: "Rovesci deboli" },
  Averses: { de: "Regenschauer", it: "Rovesci" },
  "Averses violentes": { de: "Heftige Regenschauer", it: "Rovesci violenti" },
  "Averses de neige": { de: "Schneeschauer", it: "Rovesci di neve" },
  "Fortes averses de neige": {
    de: "Starke Schneeschauer",
    it: "Forti rovesci di neve",
  },
  Orage: { de: "Gewitter", it: "Temporale" },
  "Orage avec grêle": {
    de: "Gewitter mit Hagel",
    it: "Temporale con grandine",
  },
  "Orage avec forte grêle": {
    de: "Gewitter mit starkem Hagel",
    it: "Temporale con forte grandine",
  },

  // ---------- Exercise and debriefing (debrief.ts) ----------
  "Scénario : {title}": { de: "Szenario: {title}", it: "Scenario: {title}" },
  "Début (T0) {date}": { de: "Beginn (T0) {date}", it: "Inizio (T0) {date}" },
  "Pas encore commencé": {
    de: "Noch nicht begonnen",
    it: "Non ancora iniziato",
  },
  "fin {date}": { de: "Ende {date}", it: "fine {date}" },
  "inject joué": { de: "Einspielung gespielt", it: "inject giocato" },
  "injects joués": { de: "Einspielungen gespielt", it: "inject giocati" },
  "inject en retard": { de: "Einspielung verspätet", it: "inject in ritardo" },
  "injects en retard": {
    de: "Einspielungen verspätet",
    it: "inject in ritardo",
  },
  "réaction médiane": { de: "Median der Reaktion", it: "reazione mediana" },
  "Injects et réactions": {
    de: "Einspielungen und Reaktionen",
    it: "Inject e reazioni",
  },
  Injects: { de: "Einspielungen", it: "Inject" },
  "{n} joués sur {total}": {
    de: "{n} von {total} gespielt",
    it: "{n} giocati su {total}",
  },
  Prévu: { de: "Geplant", it: "Previsto" },
  Inject: { de: "Einspielung", it: "Inject" },
  "Émetteur → destinataire": {
    de: "Absender → Empfänger",
    it: "Mittente → destinatario",
  },
  "Réaction attendue": { de: "Erwartete Reaktion", it: "Reazione attesa" },
  Joué: { de: "Gespielt", it: "Giocato" },
  Réaction: { de: "Reaktion", it: "Reazione" },
  "{title} (lu par la direction)": {
    de: "{title} (von der Übungsleitung vorgelesen)",
    it: "{title} (letto dalla direzione)",
  },
  "{expected} (délai {n} min)": {
    de: "{expected} (Frist {n} Min.)",
    it: "{expected} (termine {n} min)",
  },
  "non joué": { de: "nicht gespielt", it: "non giocato" },
  "en retard de {delay}": {
    de: "{delay} verspätet",
    it: "in ritardo di {delay}",
  },
  "à temps": { de: "rechtzeitig", it: "in tempo" },
  "sans réaction": { de: "ohne Reaktion", it: "senza reazione" },
  "échéance dépassée": { de: "Frist überschritten", it: "scadenza superata" },
  "échéances dépassées": {
    de: "Fristen überschritten",
    it: "scadenze superate",
  },
  "retard cumulé": { de: "kumulierte Verspätung", it: "ritardo cumulato" },
  "traitement médian des messages": {
    de: "Median der Meldungsbearbeitung",
    it: "trattamento mediano dei messaggi",
  },
  Échéances: { de: "Fristen", it: "Scadenze" },
  "{n} dépassée sur {total} · retard cumulé {delay}": {
    de: "{n} von {total} überschritten · kumulierte Verspätung {delay}",
    it: "{n} superata su {total} · ritardo cumulato {delay}",
  },
  "{n} dépassées sur {total} · retard cumulé {delay}": {
    de: "{n} von {total} überschritten · kumulierte Verspätung {delay}",
    it: "{n} superate su {total} · ritardo cumulato {delay}",
  },
  Close: { de: "Abgeschlossen", it: "Chiusa" },
  "Temps de traitement des messages": {
    de: "Bearbeitungszeit der Meldungen",
    it: "Tempo di trattamento dei messaggi",
  },
  Traitement: { de: "Bearbeitung", it: "Trattamento" },
  "{n} traités sur {total} · médiane {median}": {
    de: "{n} von {total} bearbeitet · Median {median}",
    it: "{n} trattati su {total} · mediana {median}",
  },
  "Délai entre réception et traitement": {
    de: "Zeit zwischen Eingang und Bearbeitung",
    it: "Tempo tra ricezione e trattamento",
  },
  "Entrées au journal par heure": {
    de: "Journaleinträge pro Stunde",
    it: "Voci del diario per ora",
  },
  "Par heure": { de: "Pro Stunde", it: "Per ora" },
  "{n} entrées": { de: "{n} Einträge", it: "{n} voci" },
  "Heure (Zurich)": { de: "Stunde (Zürich)", it: "Ora (Zurigo)" },
  "{hour} h": { de: "{hour} Uhr", it: "{hour} h" },
  "Qui a fait quoi": { de: "Wer hat was getan", it: "Chi ha fatto cosa" },
  Corrections: { de: "Korrekturen", it: "Correzioni" },
  "Autres changements": { de: "Andere Änderungen", it: "Altre modifiche" },
  "Points positifs": { de: "Positive Punkte", it: "Punti positivi" },
  "Points à améliorer": {
    de: "Verbesserungspunkte",
    it: "Punti da migliorare",
  },
  "suivi : {name}": { de: "Nachverfolgung: {name}", it: "seguito: {name}" },

  // ---------- Calendar and address book (calendar.ts) ----------
  "Type : {kind}": { de: "Typ: {kind}", it: "Tipo: {kind}" },
  "Participants : {list}": {
    de: "Teilnehmende: {list}",
    it: "Partecipanti: {list}",
  },
  "{title} · rythme de conduite": {
    de: "{title} · Führungsrhythmus",
    it: "{title} · ritmo di condotta",
  },
  "Radio : {radio}": { de: "Funk: {radio}", it: "Radio: {radio}" },
  "Exporté par orion aic · {stamp}": {
    de: "Exportiert von orion aic · {stamp}",
    it: "Esportato da orion aic · {stamp}",
  },

  // ---------- Production (produce.ts) ----------
  "Cette archive dépasse la limite d’import de 32 Mo. Choisissez moins de parties, ou les formats de lecture.":
    {
      de: "Dieses Archiv überschreitet die Importgrenze von 32 MB. Wählen Sie weniger Teile oder die Leseformate.",
      it: "Questo archivio supera il limite d’importazione di 32 MB. Scegliere meno parti o i formati di lettura.",
    },
  "Carte {n} / {total}": {
    de: "Karte {n} / {total}",
    it: "Carta {n} / {total}",
  },
  "Écriture du fichier": {
    de: "Datei wird geschrieben",
    it: "Scrittura del file",
  },
  Chiffrement: { de: "Verschlüsselung", it: "Cifratura" },
  "Empreinte du fichier": {
    de: "Fingerabdruck der Datei",
    it: "Impronta del file",
  },
  "Aucun tableau dans ce contenu.": {
    de: "Keine Tabelle in diesem Inhalt.",
    it: "Nessuna tabella in questo contenuto.",
  },
  "Aucune entrée du journal à cette heure.": {
    de: "Kein Journaleintrag zu dieser Zeit.",
    it: "Nessuna voce del diario a quest’ora.",
  },
  "Aucune entrée du journal dans ce contenu.": {
    de: "Kein Journaleintrag in diesem Inhalt.",
    it: "Nessuna voce del diario in questo contenuto.",
  },
  "La carte n’a pas pu être dessinée.": {
    de: "Die Karte konnte nicht gezeichnet werden.",
    it: "Non è stato possibile disegnare la carta.",
  },
  "Aucun rendez-vous à cette heure.": {
    de: "Kein Termin zu dieser Zeit.",
    it: "Nessun appuntamento a quest’ora.",
  },
  "Aucun contact dans ce contenu.": {
    de: "Kein Kontakt in diesem Inhalt.",
    it: "Nessun contatto in questo contenuto.",
  },
  "{n} messages · export {id} · {fingerprint}": {
    de: "{n} Meldungen · Export {id} · {fingerprint}",
    it: "{n} messaggi · export {id} · {fingerprint}",
  },
  "Export n° {id} · empreinte du contenu {content} · signé par la clé {key} ({alg}) le {date}. Vérifier : orion aic, Traçabilité → Vérifier un document (déposer ce PDF ou scanner ce code).":
    {
      de: "Export Nr. {id} · Fingerabdruck des Inhalts {content} · signiert mit dem Schlüssel {key} ({alg}) am {date}. Prüfen: orion aic, Nachvollziehbarkeit → Dokument prüfen (dieses PDF ablegen oder diesen Code scannen).",
      it: "Export n. {id} · impronta del contenuto {content} · firmato con la chiave {key} ({alg}) il {date}. Verificare: orion aic, Tracciabilità → Verifica un documento (depositare questo PDF o scansionare questo codice).",
    },
  "Export n° {id} · empreinte du contenu {fingerprint}. Vérifier : orion aic, Traçabilité → Vérifier un document.":
    {
      de: "Export Nr. {id} · Fingerabdruck des Inhalts {fingerprint}. Prüfen: orion aic, Nachvollziehbarkeit → Dokument prüfen.",
      it: "Export n. {id} · impronta del contenuto {fingerprint}. Verificare: orion aic, Tracciabilità → Verifica un documento.",
    },
  "Établi par {name}": { de: "Erstellt von {name}", it: "Redatto da {name}" },
  "plan radio · export {id} · {fingerprint}": {
    de: "Funkplan · Export {id} · {fingerprint}",
    it: "piano radio · export {id} · {fingerprint}",
  },
  "Pack : {format}": { de: "Paket: {format}", it: "Pacchetto: {format}" },
  "{format} · {n} octets": {
    de: "{format} · {n} Bytes",
    it: "{format} · {n} byte",
  },
  "pack complet": { de: "Komplettpaket", it: "pacchetto completo" },
  "Exporté le {date} par {name} (heures Europe/Zurich)": {
    de: "Exportiert am {date} von {name} (Zeiten Europe/Zurich)",
    it: "Esportato il {date} da {name} (orari Europe/Zurich)",
  },
  "Document n° {id} · empreinte du contenu {fingerprint}": {
    de: "Dokument Nr. {id} · Fingerabdruck des Inhalts {fingerprint}",
    it: "Documento n. {id} · impronta del contenuto {fingerprint}",
  },
  "Fichiers et empreintes SHA-256 (vérifiables dans orion aic, Traçabilité → Vérifier un document) :":
    {
      de: "Dateien und SHA-256-Fingerabdrücke (prüfbar in orion aic, Nachvollziehbarkeit → Dokument prüfen):",
      it: "File e impronte SHA-256 (verificabili in orion aic, Tracciabilità → Verifica un documento):",
    },
  "Non inclus :": { de: "Nicht enthalten:", it: "Non inclusi:" },
  "L’archive JSON se réimporte dans orion aic (Importer → journal séparé) : la machine à remonter le temps rejoue alors toute l’opération.":
    {
      de: "Das JSON-Archiv lässt sich wieder in orion aic importieren (Importieren → separates Journal): Die Zeitreise spielt dann den ganzen Einsatz erneut ab.",
      it: "L’archivio JSON si reimporta in orion aic (Importa → diario separato): la macchina del tempo riproduce allora tutta l’operazione.",
    },
  "L’impression n’a pas démarré. Téléchargez la page HTML et imprimez-la.": {
    de: "Der Druck ist nicht gestartet. Laden Sie die HTML-Seite herunter und drucken Sie sie.",
    it: "La stampa non è partita. Scaricare la pagina HTML e stamparla.",
  },
  "Impression impossible dans ce navigateur.": {
    de: "Drucken in diesem Browser nicht möglich.",
    it: "Stampa impossibile in questo browser.",
  },
  // Names of the files written (no accent, no space).
  "fichier:dossier": { fr: "dossier", de: "dossier", it: "dossier" },
  "fichier:donnees": { fr: "donnees", de: "daten", it: "dati" },
  "fichier:tableaux": { fr: "tableaux", de: "tabellen", it: "tabelle" },
  "fichier:tableau": { fr: "tableau", de: "tabelle", it: "tabella" },
  "fichier:tableaux-{format}": {
    fr: "tableaux-{format}",
    de: "tabellen-{format}",
    it: "tabelle-{format}",
  },
  "fichier:archive": { fr: "archive", de: "archiv", it: "archivio" },
  "fichier:fiches": { fr: "fiches", de: "meldeblaetter", it: "schede" },
  "fichier:journal": { fr: "journal", de: "journal", it: "diario" },
  "fichier:radio": { fr: "radio", de: "funk", it: "radio" },
  "fichier:etiquettes-radio": {
    fr: "etiquettes-radio",
    de: "funketiketten",
    it: "etichette-radio",
  },
  "fichier:carte": { fr: "carte", de: "karte", it: "carta" },
  "fichier:cartes-png": { fr: "cartes-png", de: "karten-png", it: "carte-png" },
  "fichier:cartes-{format}": {
    fr: "cartes-{format}",
    de: "karten-{format}",
    it: "carte-{format}",
  },
  "fichier:agenda": { fr: "agenda", de: "agenda", it: "agenda" },
  "fichier:contacts": { fr: "contacts", de: "kontakte", it: "contatti" },
  "fichier:presentation": {
    fr: "presentation",
    de: "praesentation",
    it: "presentazione",
  },
  "fichier:pack": { fr: "pack", de: "paket", it: "pacchetto" },

  // ---------- Export centre (ExportCenter.tsx) ----------
  "Rechercher un élément": { de: "Element suchen", it: "Cerca un elemento" },
  Tout: { de: "Alle", it: "Tutto" },
  "{n} de plus : affinez la recherche.": {
    de: "{n} weitere: Suche verfeinern.",
    it: "Altri {n}: affinare la ricerca.",
  },
  "{n} choisi sur {total}": {
    de: "{n} von {total} ausgewählt",
    it: "{n} scelto su {total}",
  },
  "{n} choisis sur {total}": {
    de: "{n} von {total} ausgewählt",
    it: "{n} scelti su {total}",
  },
  "Aucun choix : toute la partie ({total})": {
    de: "Keine Auswahl: ganzer Teil ({total})",
    it: "Nessuna scelta: tutta la parte ({total})",
  },
  "Ajoutez : {parts}": { de: "Hinzufügen: {parts}", it: "Aggiungere: {parts}" },
  " ou ": { de: " oder ", it: " o " },
  "Choisissez au moins une partie.": {
    de: "Wählen Sie mindestens einen Teil.",
    it: "Scegliere almeno una parte.",
  },
  "Choisissez un point de situation.": {
    de: "Wählen Sie einen Lagerapport.",
    it: "Scegliere un punto della situazione.",
  },
  "Phrase secrète : 12 caractères au minimum.": {
    de: "Passphrase: mindestens 12 Zeichen.",
    it: "Frase segreta: almeno 12 caratteri.",
  },
  "Les deux phrases secrètes ne correspondent pas.": {
    de: "Die beiden Passphrasen stimmen nicht überein.",
    it: "Le due frasi segrete non corrispondono.",
  },
  "Confirmez la conservation du fichier en clair.": {
    de: "Bestätigen Sie die Aufbewahrung der unverschlüsselten Datei.",
    it: "Confermare la conservazione del file in chiaro.",
  },
  Préparation: { de: "Vorbereitung", it: "Preparazione" },
  "Préparation…": { de: "Vorbereitung …", it: "Preparazione…" },
  "Export impossible : {message}": {
    de: "Export nicht möglich: {message}",
    it: "Export impossibile: {message}",
  },
  "Export impossible. Réessayez avec moins de parties ou un autre format.": {
    de: "Export nicht möglich. Versuchen Sie es mit weniger Teilen oder einem anderen Format.",
    it: "Export impossibile. Riprovare con meno parti o un altro formato.",
  },
  "Vérifier un document": {
    de: "Dokument prüfen",
    it: "Verifica un documento",
  },
  "journal clôturé": {
    de: "abgeschlossenes Journal",
    it: "diario chiuso",
  },
  "Retour à l’export": { de: "Zurück zum Export", it: "Torna all’export" },
  Quoi: { de: "Was", it: "Cosa" },
  "Les parties de l’opération à inclure": {
    de: "Die einzubeziehenden Teile des Einsatzes",
    it: "Le parti dell’operazione da includere",
  },
  "Toute l’opération": { de: "Ganzer Einsatz", it: "Tutta l’operazione" },
  Choisir: { de: "Auswählen", it: "Scegli" },
  "Toutes les parties, tous les éléments, état actuel.": {
    de: "Alle Teile, alle Elemente, aktueller Stand.",
    it: "Tutte le parti, tutti gli elementi, stato attuale.",
  },
  "Toutes les parties, tous les éléments, à l’heure choisie.": {
    de: "Alle Teile, alle Elemente, zur gewählten Zeit.",
    it: "Tutte le parti, tutti gli elementi, all’ora scelta.",
  },
  "Tout cocher": { de: "Alle auswählen", it: "Seleziona tutto" },
  "Tout décocher": { de: "Alle abwählen", it: "Deseleziona tutto" },
  "Maintenant : {n}": { de: "Jetzt: {n}", it: "Adesso: {n}" },
  "Choisir des éléments": { de: "Elemente auswählen", it: "Scegli elementi" },
  Quand: { de: "Wann", it: "Quando" },
  "L’état actuel ou une version passée": {
    de: "Der aktuelle Stand oder eine frühere Version",
    it: "Lo stato attuale o una versione passata",
  },
  Moment: { de: "Zeitpunkt", it: "Momento" },
  "Point figé": { de: "Momentaufnahme", it: "Istantanea" },
  "Heure précise": { de: "Genaue Zeit", it: "Ora precisa" },
  "État actuel, en direct : {date}.": {
    de: "Aktueller Stand, live: {date}.",
    it: "Stato attuale, in diretta: {date}.",
  },
  "Aucun point de situation figé. Figez l’état depuis la barre du temps ou la Situation, ou choisissez une heure précise.":
    {
      de: "Keine Momentaufnahme. Halten Sie den Stand über die Zeitleiste oder die Lage fest, oder wählen Sie eine genaue Zeit.",
      it: "Nessuna istantanea. Fissare lo stato dalla barra del tempo o dalla Situazione, oppure scegliere un’ora precisa.",
    },
  "Date et heure": { de: "Datum und Zeit", it: "Data e ora" },
  "Moment de l’opération": {
    de: "Zeitpunkt des Einsatzes",
    it: "Momento dell’operazione",
  },
  maintenant: { de: "jetzt", it: "adesso" },
  "<0>{n}</0> moment de changement jusqu’à cette heure, sur {total}.": {
    de: "<0>{n}</0> Änderungszeitpunkt bis zu dieser Zeit, von {total}.",
    it: "<0>{n}</0> momento di modifica fino a quest’ora, su {total}.",
  },
  "<0>{n}</0> moments de changement jusqu’à cette heure, sur {total}.": {
    de: "<0>{n}</0> Änderungszeitpunkte bis zu dieser Zeit, von {total}.",
    it: "<0>{n}</0> momenti di modifica fino a quest’ora, su {total}.",
  },
  "Cette version contient": {
    de: "Diese Version enthält",
    it: "Questa versione contiene",
  },
  "→ nombre actuel, quand il diffère.": {
    de: "→ aktuelle Anzahl, wenn sie abweicht.",
    it: "→ numero attuale, quando differisce.",
  },
  "Présentation, document, tableur, carte, archive…": {
    de: "Präsentation, Dokument, Tabelle, Karte, Archiv …",
    it: "Presentazione, documento, foglio di calcolo, carta, archivio…",
  },
  Filigrane: { de: "Wasserzeichen", it: "Filigrana" },
  "Aucun filigrane": { de: "Kein Wasserzeichen", it: "Nessuna filigrana" },
  "Selon le mode et la classification du journal": {
    de: "Gemäss Modus und Klassifizierung des Journals",
    it: "Secondo la modalità e la classificazione del diario",
  },
  Auto: { de: "Auto", it: "Auto" },
  Orientation: { de: "Ausrichtung", it: "Orientamento" },
  Portrait: { de: "Hochformat", it: "Verticale" },
  Paysage: { de: "Querformat", it: "Orizzontale" },
  "Chaque modification, qui, quand, pourquoi": {
    de: "Jede Änderung, wer, wann, warum",
    it: "Ogni modifica, chi, quando, perché",
  },
  Animations: { de: "Animationen", it: "Animazioni" },
  "Transitions et apparitions": {
    de: "Übergänge und Einblendungen",
    it: "Transizioni e comparse",
  },
  "Phrase secrète": { de: "Passphrase", it: "Frase segreta" },
  "Répéter la phrase": { de: "Passphrase wiederholen", it: "Ripeti la frase" },
  "12 caractères min. Transmise par un autre canal que le fichier. Irrécupérable. Après import, la machine à remonter le temps rejoue l’opération.":
    {
      de: "Mind. 12 Zeichen. Über einen anderen Kanal als die Datei übermitteln. Nicht wiederherstellbar. Nach dem Import spielt die Zeitreise den Einsatz erneut ab.",
      it: "Min. 12 caratteri. Trasmessa tramite un canale diverso dal file. Irrecuperabile. Dopo l’importazione, la macchina del tempo riproduce l’operazione.",
    },
  "Journal confidentiel, fichier en clair : je choisis où il est conservé.": {
    de: "Vertrauliches Journal, unverschlüsselte Datei: Ich wähle, wo sie aufbewahrt wird.",
    it: "Diario confidenziale, file in chiaro: scelgo dove viene conservato.",
  },
  "Envoyé à l’impression": {
    de: "An den Drucker gesendet",
    it: "Inviato alla stampa",
  },
  "{name} · vérifiez le dossier de téléchargement": {
    de: "{name} · prüfen Sie den Download-Ordner",
    it: "{name} · controllare la cartella dei download",
  },
  "Inscrit au registre · document {id} · SHA-256 {sha}…": {
    de: "Im Register eingetragen · Dokument {id} · SHA-256 {sha} …",
    it: "Iscritto nel registro · documento {id} · SHA-256 {sha}…",
  },
  "non inclus : {list}": {
    de: "nicht enthalten: {list}",
    it: "non inclusi: {list}",
  },
  "Imprimer le dossier (même contenu que la page HTML)": {
    de: "Dossier drucken (gleicher Inhalt wie die HTML-Seite)",
    it: "Stampa il dossier (stesso contenuto della pagina HTML)",
  },
  Télécharger: { de: "Herunterladen", it: "Scarica" },

  // ---------- Verification (Verify.tsx) ----------
  "{n} o": { de: "{n} B", it: "{n} B" },
  "{n} ko": { de: "{n} kB", it: "{n} kB" },
  "{n} Mo": { de: "{n} MB", it: "{n} MB" },
  "Impression (HTML)": { de: "Druck (HTML)", it: "Stampa (HTML)" },
  "{format} · exporté par {name} le {date} · {size}": {
    de: "{format} · exportiert von {name} am {date} · {size}",
    it: "{format} · esportato da {name} il {date} · {size}",
  },
  "document {id} · empreinte {fingerprint}": {
    de: "Dokument {id} · Fingerabdruck {fingerprint}",
    it: "documento {id} · impronta {fingerprint}",
  },
  "ce poste": { de: "dieser Arbeitsplatz", it: "questa postazione" },
  "{label} : signature valide": {
    de: "{label}: gültige Signatur",
    it: "{label}: firma valida",
  },
  "{label} : signature invalide": {
    de: "{label}: ungültige Signatur",
    it: "{label}: firma non valida",
  },
  "Rien n’a changé depuis la signature du {date} (heure du poste signataire).":
    {
      de: "Nichts hat sich seit der Signatur vom {date} geändert (Zeit des signierenden Arbeitsplatzes).",
      it: "Nulla è cambiato dalla firma del {date} (ora della postazione firmataria).",
    },
  "Le contenu a été modifié après la signature, ou la signature a été altérée.":
    {
      de: "Der Inhalt wurde nach der Signatur geändert, oder die Signatur wurde verfälscht.",
      it: "Il contenuto è stato modificato dopo la firma, oppure la firma è stata alterata.",
    },
  "Clé {key} · {alg}": {
    de: "Schlüssel {key} · {alg}",
    it: "Chiave {key} · {alg}",
  },
  "connue : {who}": { de: "bekannt: {who}", it: "nota: {who}" },
  "clé inconnue de cette opération": {
    de: "diesem Einsatz unbekannter Schlüssel",
    it: "chiave sconosciuta a questa operazione",
  },
  "Ce fichier n’a pas pu être lu.": {
    de: "Diese Datei konnte nicht gelesen werden.",
    it: "Non è stato possibile leggere questo file.",
  },
  "Code non reconnu. Il commence par « orionaic:verify: » (texte du code QR).":
    {
      de: "Code nicht erkannt. Er beginnt mit « orionaic:verify: » (Text des QR-Codes).",
      it: "Codice non riconosciuto. Inizia con « orionaic:verify: » (testo del codice QR).",
    },
  "Déposer un document à vérifier": {
    de: "Zu prüfendes Dokument ablegen",
    it: "Depositare un documento da verificare",
  },
  "PDF, Word, Excel, archive… · calcul local, rien n’est envoyé": {
    de: "PDF, Word, Excel, Archiv … · lokale Berechnung, nichts wird gesendet",
    it: "PDF, Word, Excel, archivio… · calcolo locale, nulla viene inviato",
  },
  "Ou le texte du code QR": {
    de: "Oder der Text des QR-Codes",
    it: "Oppure il testo del codice QR",
  },
  Vérifier: { de: "Prüfen", it: "Verifica" },
  "Calcul de l’empreinte…": {
    de: "Fingerabdruck wird berechnet …",
    it: "Calcolo dell’impronta…",
  },
  "Document modifié": { de: "Dokument geändert", it: "Documento modificato" },
  "Document authentique": { de: "Dokument echt", it: "Documento autentico" },
  "Document intact, signé": {
    de: "Dokument unverändert, signiert",
    it: "Documento intatto, firmato",
  },
  "Document inconnu": { de: "Dokument unbekannt", it: "Documento sconosciuto" },
  "La signature ne correspond plus au fichier : il a été modifié après avoir été signé.":
    {
      de: "Die Signatur passt nicht mehr zur Datei: Sie wurde nach der Signatur geändert.",
      it: "La firma non corrisponde più al file: è stato modificato dopo essere stato firmato.",
    },
  "Ce fichier est exactement celui produit par orion aic et inscrit au registre de cette opération.":
    {
      de: "Diese Datei ist genau jene, die orion aic erstellt und im Register dieses Einsatzes eingetragen hat.",
      it: "Questo file è esattamente quello prodotto da orion aic e iscritto nel registro di questa operazione.",
    },
  "Ce fichier n’est pas au registre de cette opération, mais il porte une signature valide : il n’a pas changé depuis qu’il a été signé par la clé ci-dessous.":
    {
      de: "Diese Datei ist nicht im Register dieses Einsatzes, trägt aber eine gültige Signatur: Sie hat sich nicht verändert, seit sie mit dem Schlüssel unten signiert wurde.",
      it: "Questo file non è nel registro di questa operazione, ma porta una firma valida: non è cambiato da quando è stato firmato con la chiave qui sotto.",
    },
  "Ce fichier n’a pas été produit par cette session, ou il a été modifié depuis (même d’un seul caractère).":
    {
      de: "Diese Datei wurde nicht in dieser Sitzung erstellt, oder sie wurde seither geändert (und sei es nur ein Zeichen).",
      it: "Questo file non è stato prodotto da questa sessione, oppure è stato modificato da allora (anche di un solo carattere).",
    },
  Registre: { de: "Register", it: "Registro" },
  "Signature invalide": { de: "Ungültige Signatur", it: "Firma non valida" },
  "Export connu": { de: "Bekannter Export", it: "Export noto" },
  "Contenu connu": { de: "Bekannter Inhalt", it: "Contenuto noto" },
  "Code signé": { de: "Signierter Code", it: "Codice firmato" },
  "Code inconnu": { de: "Unbekannter Code", it: "Codice sconosciuto" },
  "Ce code a été modifié après sa signature.": {
    de: "Dieser Code wurde nach seiner Signatur geändert.",
    it: "Questo codice è stato modificato dopo la sua firma.",
  },
  "Ce code correspond à un export inscrit au registre. Pour certifier un fichier précis, déposez-le ci-dessus.":
    {
      de: "Dieser Code entspricht einem im Register eingetragenen Export. Um eine bestimmte Datei zu bestätigen, legen Sie sie oben ab.",
      it: "Questo codice corrisponde a un export iscritto nel registro. Per certificare un file preciso, depositarlo qui sopra.",
    },
  "Ce document n’est pas au registre, mais le même contenu a été exporté.": {
    de: "Dieses Dokument ist nicht im Register, aber der gleiche Inhalt wurde exportiert.",
    it: "Questo documento non è nel registro, ma lo stesso contenuto è stato esportato.",
  },
  "Ce code n’est pas au registre de cette opération, mais sa signature est valide : l’empreinte du contenu a bien été signée par la clé ci-dessous. Comparez-la avec celle imprimée sur le document.":
    {
      de: "Dieser Code ist nicht im Register dieses Einsatzes, aber seine Signatur ist gültig: Der Fingerabdruck des Inhalts wurde tatsächlich mit dem Schlüssel unten signiert. Vergleichen Sie ihn mit jenem, der auf dem Dokument gedruckt ist.",
      it: "Questo codice non è nel registro di questa operazione, ma la sua firma è valida: l’impronta del contenuto è stata effettivamente firmata con la chiave qui sotto. Confrontarla con quella stampata sul documento.",
    },
  "Aucun export de cette opération ne porte ce code.": {
    de: "Kein Export dieses Einsatzes trägt diesen Code.",
    it: "Nessun export di questa operazione porta questo codice.",
  },
  Code: { de: "Code", it: "Codice" },
  "Clé de signature de ce poste : <0>{key}</0>.": {
    de: "Signaturschlüssel dieses Arbeitsplatzes: <0>{key}</0>.",
    it: "Chiave di firma di questa postazione: <0>{key}</0>.",
  },
  "{n} fichier au registre des exports de « {title} ».": {
    de: "{n} Datei im Exportregister von « {title} ».",
    it: "{n} file nel registro degli export di « {title} ».",
  },
  "{n} fichiers au registre des exports de « {title} ».": {
    de: "{n} Dateien im Exportregister von « {title} ».",
    it: "{n} file nel registro degli export di « {title} ».",
  },
} satisfies Dict);

/** A text of this dictionary (labels kept in tables, then translated). */
export type Key = keyof typeof dict & string;
