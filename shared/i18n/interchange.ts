import { translator, type Dict } from "./core.ts";

// Texts of shared/interchange.ts: columns of the journal exports (CSV, XLSX,
// ODS, text, HTML), import errors and notices. The CSV import accepts the
// column names in the three languages (a German export imports on a French
// post), see headerKey() in shared/interchange.ts.
export const { t, tn, tIn, dict } = translator({
  // Columns
  "N°": { de: "Nr.", it: "N." },
  "Événement (ISO)": { de: "Ereignis (ISO)", it: "Evento (ISO)" },
  "Réception (ISO)": { de: "Eingang (ISO)", it: "Ricezione (ISO)" },
  Type: { de: "Typ", it: "Tipo" },
  Message: { de: "Meldung", it: "Messaggio" },
  Émetteur: { de: "Absender", it: "Mittente" },
  Destinataire: { de: "Empfänger", it: "Destinatario" },
  Canal: { de: "Kanal", it: "Canale" },
  Priorité: { de: "Priorität", it: "Priorità" },
  Confirmation: { de: "Bestätigung", it: "Conferma" },
  Lieu: { de: "Ort", it: "Luogo" },
  Coordonnées: { de: "Koordinaten", it: "Coordinate" },
  "Mesure / décision": {
    de: "Massnahme / Entscheid",
    it: "Misura / decisione",
  },
  Responsable: { de: "Verantwortlich", it: "Responsabile" },
  "Échéance (ISO)": { de: "Frist (ISO)", it: "Scadenza (ISO)" },
  Statut: { de: "Status", it: "Stato" },
  "Moyens / besoins": { de: "Mittel / Bedarf", it: "Mezzi / fabbisogno" },
  Référence: { de: "Referenz", it: "Riferimento" },
  Notes: { de: "Notizen", it: "Note" },
  "Mots-clés": { de: "Schlagwörter", it: "Parole chiave" },
  "Saisi par": { de: "Erfasst von", it: "Registrato da" },
  "Enregistré (ISO)": { de: "Gespeichert (ISO)", it: "Salvato (ISO)" },
  Origine: { de: "Herkunft", it: "Origine" },
  Identifiant: { de: "Kennung", it: "Identificativo" },
  Révisions: { de: "Revisionen", it: "Revisioni" },
  "Modifié par": { de: "Geändert von", it: "Modificato da" },
  "Modifié (ISO)": { de: "Geändert (ISO)", it: "Modificato (ISO)" },
  Motif: { de: "Grund", it: "Motivo" },

  // Reading a CSV file
  "Fichier trop volumineux (32 Mo maximum).": {
    de: "Datei zu gross (höchstens 32 MB).",
    it: "File troppo grande (massimo 32 MB).",
  },
  "Trop de colonnes.": { de: "Zu viele Spalten.", it: "Troppe colonne." },
  "10 000 entrées maximum par import.": {
    de: "Höchstens 10 000 Einträge pro Import.",
    it: "Al massimo 10 000 voci per importazione.",
  },
  "Guillemets CSV invalides.": {
    de: "Ungültige Anführungszeichen im CSV.",
    it: "Virgolette CSV non valide.",
  },
  "Une cellule dépasse 20 000 caractères.": {
    de: "Eine Zelle überschreitet 20 000 Zeichen.",
    it: "Una cella supera i 20 000 caratteri.",
  },
  "Le fichier CSV contient un champ non terminé.": {
    de: "Die CSV-Datei enthält ein nicht abgeschlossenes Feld.",
    it: "Il file CSV contiene un campo non terminato.",
  },
  "Colonnes « Message » et « Événement (ISO) » requises. Utilisez le modèle CSV orion aic.":
    {
      de: "Spalten « Meldung » und « Ereignis (ISO) » erforderlich. Verwenden Sie die CSV-Vorlage von orion aic.",
      it: "Colonne « Messaggio » e « Evento (ISO) » obbligatorie. Usare il modello CSV di orion aic.",
    },
  "Le CSV comporte des colonnes dupliquées.": {
    de: "Das CSV enthält doppelte Spalten.",
    it: "Il CSV contiene colonne duplicate.",
  },
  "Ligne {n} : nombre de colonnes incorrect.": {
    de: "Zeile {n}: falsche Anzahl Spalten.",
    it: "Riga {n}: numero di colonne errato.",
  },
  "Ligne {n} : vérifiez les dates ISO, le message et les valeurs de statut/priorité.":
    {
      de: "Zeile {n}: Prüfen Sie die ISO-Daten, die Meldung und die Werte von Status/Priorität.",
      it: "Riga {n}: verificare le date ISO, il messaggio e i valori di stato/priorità.",
    },
  "Import CSV": { de: "CSV-Import", it: "Importazione CSV" },

  // Import of an ORION 0.3 export or of an archive
  "Journal importé · ORION 0.3": {
    de: "Importiertes Journal · ORION 0.3",
    it: "Diario importato · ORION 0.3",
  },
  "Entrée importée": { de: "Importierter Eintrag", it: "Voce importata" },
  "Import ORION 0.3": {
    de: "Import ORION 0.3",
    it: "Importazione ORION 0.3",
  },
  "Ancien format : seules les entrées du journal sont reprises. Les autres modules et leur historique ne sont pas importés.":
    {
      de: "Altes Format: Nur die Einträge des Journals werden übernommen. Die anderen Module und ihre Historie werden nicht importiert.",
      it: "Vecchio formato: vengono riprese solo le voci del diario. Gli altri moduli e la loro cronologia non vengono importati.",
    },
  "Les auteurs, dates et révisions sont conservés. Un fichier importé ne certifie pas l’identité de son auteur.":
    {
      de: "Autoren, Daten und Revisionen bleiben erhalten. Eine importierte Datei bestätigt nicht die Identität ihres Autors.",
      it: "Autori, date e revisioni sono conservati. Un file importato non certifica l’identità del suo autore.",
    },

  // Text and HTML exports
  "{label} : {value}": { de: "{label}: {value}", it: "{label}: {value}" },
  "Réf. {reference}": { de: "Ref. {reference}", it: "Rif. {reference}" },
  "Export du {date} · Heures Europe/Zurich": {
    de: "Export vom {date} · Zeiten Europe/Zurich",
    it: "Esportazione del {date} · Ore Europe/Zurich",
  },
  "État actuel des entrées ; historique complet dans l’archive orion aic.": {
    de: "Aktueller Stand der Einträge; vollständige Historie im Archiv von orion aic.",
    it: "Stato attuale delle voci; cronologia completa nell’archivio di orion aic.",
  },
  "Référence : {reference} · Export du {date} · Europe/Zurich": {
    de: "Referenz: {reference} · Export vom {date} · Europe/Zurich",
    it: "Riferimento: {reference} · Esportazione del {date} · Europe/Zurich",
  },
  "État actuel des entrées. Historique complet dans l’archive orion aic.": {
    de: "Aktueller Stand der Einträge. Vollständige Historie im Archiv von orion aic.",
    it: "Stato attuale delle voci. Cronologia completa nell’archivio di orion aic.",
  },
} satisfies Dict);

export type Key = keyof typeof dict & string;
