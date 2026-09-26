import { translator, type Dict } from "../../shared/i18n/core.ts";
import { common } from "../../shared/i18n/common.ts";
import { enumLabel } from "../../shared/i18n/enums.ts";

// Printed sheets: fiche message, formule de message, quittance de remise
// radio, plan du réseau radio, rapport de situation, QR labels and badges.
// Every printed label is in the language of the post; the data (entries,
// names, call signs) is printed as written.
export const { t, tn, tIn, dict } = translator({
  ...common,
  // Radio values not in shared/i18n/enums.ts
  "En service": { de: "Ausgegeben", it: "In servizio" },
  "THREE · bon": { de: "THREE · gut", it: "THREE · buona" },
  "TWO · faible": { de: "TWO · schwach", it: "TWO · debole" },
  "ONE · insuffisant": { de: "ONE · ungenügend", it: "ONE · insufficiente" },
  "Pas de liaison": { de: "Keine Verbindung", it: "Nessun collegamento" },
  // Rapport de situation
  "La période est invalide.": {
    de: "Der Zeitraum ist ungültig.",
    it: "Il periodo non è valido.",
  },
  Synthèse: { de: "Übersicht", it: "Sintesi" },
  Indicateur: { de: "Kennzahl", it: "Indicatore" },
  "Entrées sur la période": {
    de: "Einträge im Zeitraum",
    it: "Voci nel periodo",
  },
  "Points ouverts": { de: "Offene Punkte", it: "Punti aperti" },
  "Décisions et missions": {
    de: "Entscheide und Aufträge",
    it: "Decisioni e missioni",
  },
  "Échéances dépassées": {
    de: "Überschrittene Fristen",
    it: "Scadenze superate",
  },
  Demandes: { de: "Anfragen", it: "Richieste" },
  Demande: { de: "Anfrage", it: "Richiesta" },
  "Radios en service": { de: "Funkgeräte ausgegeben", it: "Radio in servizio" },
  "Entrées urgentes": { de: "Dringende Einträge", it: "Voci urgenti" },
  "Liaisons faibles ou nulles": {
    de: "Schwache oder fehlende Verbindungen",
    it: "Collegamenti deboli o assenti",
  },
  "Faits marquants": { de: "Wichtige Ereignisse", it: "Fatti salienti" },
  "Priorité importante ou urgente": {
    de: "Priorität wichtig oder dringend",
    it: "Priorità importante o urgente",
  },
  Nature: { de: "Art", it: "Tipo" },
  Suivi: { de: "Bearbeitung", it: "Seguito" },
  "Décision / mission": {
    de: "Entscheid / Auftrag",
    it: "Decisione / missione",
  },
  "{n} sur la période": { de: "{n} im Zeitraum", it: "{n} nel periodo" },
  "Moyens / besoins": { de: "Mittel / Bedarf", it: "Mezzi / fabbisogno" },
  "État à {at}": { de: "Stand {at}", it: "Stato al {at}" },
  "Message / mesure": { de: "Meldung / Massnahme", it: "Messaggio / misura" },
  DÉPASSÉE: { de: "ÜBERSCHRITTEN", it: "SUPERATA" },
  "Moyens engagés et besoins": {
    de: "Eingesetzte Mittel und Bedarf",
    it: "Mezzi impiegati e fabbisogno",
  },
  "Entrées renseignant des moyens": {
    de: "Einträge mit Angaben zu Mitteln",
    it: "Voci che indicano mezzi",
  },
  "État radio": { de: "Funkstatus", it: "Stato radio" },
  "{n} terminal remis": {
    de: "{n} Endgerät abgegeben",
    it: "{n} terminale consegnato",
  },
  "{n} terminaux remis": {
    de: "{n} Endgeräte abgegeben",
    it: "{n} terminali consegnati",
  },
  "{n} contrôle": { de: "{n} Kontrolle", it: "{n} controllo" },
  "{n} contrôles": { de: "{n} Kontrollen", it: "{n} controlli" },
  "{terminals} · {checks} sur la période": {
    de: "{terminals} · {checks} im Zeitraum",
    it: "{terminals} · {checks} nel periodo",
  },
  Terminal: { de: "Endgerät", it: "Terminale" },
  Détenteur: { de: "Inhaber", it: "Detentore" },
  "Nom d’appel": { de: "Rufname", it: "Nominativo" },
  "Remis le": { de: "Abgegeben am", it: "Consegnato il" },
  "Batterie à contrôler": {
    de: "Akku kontrollieren",
    it: "Batteria da controllare",
  },
  Liaison: { de: "Verbindung", it: "Collegamento" },
  Chronologie: { de: "Chronologie", it: "Cronologia" },
  "{n} entrée": { de: "{n} Eintrag", it: "{n} voce" },
  "{n} entrées": { de: "{n} Einträge", it: "{n} voci" },
  // Plan du réseau radio
  "Plan du réseau radio": { de: "Funknetzplan", it: "Piano della rete radio" },
  "{n} noms d’appel": { de: "{n} Rufnamen", it: "{n} nominativi" },
  Section: { de: "Zug", it: "Sezione" },
  Titulaire: { de: "Inhaber", it: "Titolare" },
  "Terminal · RFSI": { de: "Endgerät · RFSI", it: "Terminale · RFSI" },
  Principal: { de: "Hauptgruppe", it: "Principale" },
  Alternative: { de: "Ausweichgruppe", it: "Alternativa" },
  "Sur le réseau": { de: "Im Netz", it: "In rete" },
  "Dernier contrôle": { de: "Letzte Kontrolle", it: "Ultimo controllo" },
  "Groupes et canaux": {
    de: "Gesprächsgruppen und Kanäle",
    it: "Gruppi di conversazione e canali",
  },
  "TKG · mode direct · relais": {
    de: "TKG · Direktmodus · Relais",
    it: "TKG · modo diretto · ripetitore",
  },
  Mode: { de: "Modus", it: "Modo" },
  Emploi: { de: "Verwendung", it: "Impiego" },
  Terminaux: { de: "Endgeräte", it: "Terminali" },
  "{n} appareils": { de: "{n} Geräte", it: "{n} apparecchi" },
  "N° de série": { de: "Seriennummer", it: "N. di serie" },
  Batterie: { de: "Akku", it: "Batteria" },
  Accessoires: { de: "Zubehör", it: "Accessori" },
  "Registre des remises": {
    de: "Abgabeverzeichnis",
    it: "Registro delle consegne",
  },
  "{n} quittances": { de: "{n} Quittungen", it: "{n} quittanze" },
  Remise: { de: "Abgabe", it: "Consegna" },
  "Retour (terminal)": { fr: "Retour", de: "Rücknahme", it: "Restituzione" },
  "État au retour": {
    de: "Zustand bei Rücknahme",
    it: "Stato alla restituzione",
  },
  "batt. {level}": { de: "Akku {level}", it: "batt. {level}" },
  "En cours (remise)": { fr: "En cours", de: "Ausstehend", it: "In corso" },
  "Contrôles de liaison": {
    de: "Verbindungskontrollen",
    it: "Controlli dei collegamenti",
  },
  "Audibilité THREE · TWO · ONE": {
    de: "Verständlichkeit THREE · TWO · ONE",
    it: "Udibilità THREE · TWO · ONE",
  },
  "Groupe / canal": {
    de: "Gesprächsgruppe / Kanal",
    it: "Gruppo / canale",
  },
  Audibilité: { de: "Verständlichkeit", it: "Udibilità" },
  Par: { de: "Von", it: "Da" },
  // Fiche message
  "Fiche message": { de: "Meldeblatt", it: "Scheda messaggio" },
  "ENTRÉE ANNULÉE · conservée pour la traçabilité": {
    de: "EINTRAG ANNULLIERT · für die Nachvollziehbarkeit aufbewahrt",
    it: "VOCE ANNULLATA · conservata per la tracciabilità",
  },
  "VERSION {n} · état actuel ; versions antérieures dans l’archive orion aic": {
    de: "VERSION {n} · aktueller Stand; frühere Versionen im Archiv von orion aic",
    it: "VERSIONE {n} · stato attuale; versioni precedenti nell’archivio orion aic",
  },
  Visa: { de: "Visum", it: "Visto" },
  "Traité par": { de: "Bearbeitet von", it: "Trattato da" },
  "Date / heure": { de: "Datum / Zeit", it: "Data / ora" },
  Signature: { de: "Unterschrift", it: "Firma" },
  "message {n}": { de: "Meldung {n}", it: "messaggio {n}" },
  Transmission: { de: "Übermittlung", it: "Trasmissione" },
  Événement: { de: "Ereignis", it: "Evento" },
  Réception: { de: "Eingang", it: "Ricezione" },
  Enregistrement: { de: "Erfassung", it: "Registrazione" },
  Canal: { de: "Kanal", it: "Canale" },
  Localisation: { de: "Lokalisierung", it: "Localizzazione" },
  "Lieu / secteur": { de: "Ort / Sektor", it: "Luogo / settore" },
  Confirmation: { de: "Bestätigung", it: "Conferma" },
  Conduite: { de: "Führung", it: "Condotta" },
  "Mesure / décision / mission": {
    de: "Massnahme / Entscheid / Auftrag",
    it: "Misura / decisione / missione",
  },
  "Moyens engagés / besoins": {
    de: "Eingesetzte Mittel / Bedarf",
    it: "Mezzi impiegati / fabbisogno",
  },
  Compléments: { de: "Ergänzungen", it: "Complementi" },
  "Référence / entrée liée": {
    de: "Referenz / verknüpfter Eintrag",
    it: "Riferimento / voce collegata",
  },
  Observations: { de: "Bemerkungen", it: "Osservazioni" },
  Traçabilité: { de: "Nachvollziehbarkeit", it: "Tracciabilità" },
  "Saisi par": { de: "Erfasst von", it: "Inserito da" },
  Version: { de: "Version", it: "Versione" },
  "Dernière modification": { de: "Letzte Änderung", it: "Ultima modifica" },
  Motif: { de: "Grund", it: "Motivo" },
  Origine: { de: "Herkunft", it: "Origine" },
  Identifiant: { de: "Kennung", it: "Identificativo" },
  // Quittance de remise radio
  "Quittance de remise radio": {
    de: "Abgabequittung Funkgerät",
    it: "Quittanza di consegna radio",
  },
  Modèle: { de: "Modell", it: "Modello" },
  Rendu: { de: "Zurückgegeben", it: "Restituito" },
  Remis: { de: "Abgegeben", it: "Consegnato" },
  "N° interne": { de: "Interne Nr.", it: "N. interno" },
  "Grade, nom": { de: "Grad, Name", it: "Grado, nome" },
  "Groupe principal": { de: "Hauptgruppe", it: "Gruppo principale" },
  "Remis par": { de: "Abgegeben von", it: "Consegnato da" },
  "Accessoires remis": {
    de: "Abgegebenes Zubehör",
    it: "Accessori consegnati",
  },
  "Reçu par": { de: "Entgegengenommen von", it: "Ricevuto da" },
  Complet: { de: "Vollständig", it: "Completo" },
  "[  ] oui    [  ] non": {
    de: "[  ] ja    [  ] nein",
    it: "[  ] sì    [  ] no",
  },
  Signatures: { de: "Unterschriften", it: "Firme" },
  "Détenteur (remise)": { de: "Inhaber (Abgabe)", it: "Detentore (consegna)" },
  Remettant: { de: "Abgebende Person", it: "Consegnante" },
  "Détenteur (retour)": {
    de: "Inhaber (Rücknahme)",
    it: "Detentore (restituzione)",
  },
  "quittance {label} · {holder}": {
    de: "Quittung {label} · {holder}",
    it: "quittanza {label} · {holder}",
  },
  // Formule de message
  "Formule de message": { de: "Meldeformular", it: "Modulo di messaggio" },
  "RÉPONSE ATTENDUE": { de: "ANTWORT ERWARTET", it: "RISPOSTA ATTESA" },
  "RÉPONSE ATTENDUE AVANT {at}": {
    de: "ANTWORT ERWARTET BIS {at}",
    it: "RISPOSTA ATTESA ENTRO {at}",
  },
  De: { de: "Von", it: "Da" },
  À: { de: "An", it: "A" },
  "Reçu le": { de: "Empfangen am", it: "Ricevuto il" },
  Traitement: { de: "Bearbeitung", it: "Trattamento" },
  "Synthèse / journal": { de: "Synthese / Journal", it: "Sintesi / diario" },
  "Transmis à": { de: "Weitergeleitet an", it: "Trasmesso a" },
  // PDF and preview
  "Réf. {reference}": { de: "Ref. {reference}", it: "Rif. {reference}" },
  "Édité le {stamp} · Europe/Zurich": {
    de: "Erstellt am {stamp} · Europe/Zurich",
    it: "Emesso il {stamp} · Europe/Zurich",
  },
  "Édité le {stamp}": { de: "Erstellt am {stamp}", it: "Emesso il {stamp}" },
  "{label} (suite)": { de: "{label} (Fortsetzung)", it: "{label} (seguito)" },
  "{label} {number} · suite": {
    de: "{label} {number} · Fortsetzung",
    it: "{label} {number} · seguito",
  },
  "Aucun document à produire.": {
    de: "Kein Dokument zu erstellen.",
    it: "Nessun documento da produrre.",
  },
  "Aucune entrée sélectionnée.": {
    de: "Kein Eintrag ausgewählt.",
    it: "Nessuna voce selezionata.",
  },
  "{n} messages": { de: "{n} Meldungen", it: "{n} messaggi" },
  "VÉRIFIER CE DOCUMENT": {
    de: "DIESES DOKUMENT PRÜFEN",
    it: "VERIFICARE QUESTO DOCUMENTO",
  },
  "Établi par {author}": {
    de: "Erstellt von {author}",
    it: "Redatto da {author}",
  },
  "plan du réseau radio": { de: "Funknetzplan", it: "piano della rete radio" },
  "Rapport de situation": {
    de: "Lagebericht",
    it: "Rapporto sulla situazione",
  },
  "rapport de situation": {
    de: "Lagebericht",
    it: "rapporto sulla situazione",
  },
  "Aucun terminal.": { de: "Kein Endgerät.", it: "Nessun terminale." },
  "orion aic · RADIO": { de: "orion aic · FUNK", it: "orion aic · RADIO" },
  "orion aic · radio": { de: "orion aic · Funk", it: "orion aic · radio" },
  "étiquettes radio": { de: "Funk-Etiketten", it: "etichette radio" },
  "Aucun badge.": { de: "Kein Badge.", it: "Nessun badge." },
  "orion aic · PRÉSENCE": {
    de: "orion aic · PRÄSENZ",
    it: "orion aic · PRESENZA",
  },
  "orion aic · présence": {
    de: "orion aic · Präsenz",
    it: "orion aic · presenza",
  },
  "badges de présence": { de: "Präsenzbadges", it: "badge di presenza" },
  "{n} fiche message · A4 portrait": {
    de: "{n} Meldeblatt · A4 Hochformat",
    it: "{n} scheda messaggio · A4 verticale",
  },
  "{n} fiches message · A4 portrait": {
    de: "{n} Meldeblätter · A4 Hochformat",
    it: "{n} schede messaggio · A4 verticale",
  },
  "Plan du réseau radio · A4 paysage": {
    de: "Funknetzplan · A4 Querformat",
    it: "Piano della rete radio · A4 orizzontale",
  },
  "Quittance de remise radio · A4 portrait": {
    de: "Abgabequittung Funkgerät · A4 Hochformat",
    it: "Quittanza di consegna radio · A4 verticale",
  },
  "Rapport de situation · A4 portrait": {
    de: "Lagebericht · A4 Hochformat",
    it: "Rapporto sulla situazione · A4 verticale",
  },
  "{n} {title} · A4 portrait": {
    de: "{n} {title} · A4 Hochformat",
    it: "{n} {title} · A4 verticale",
  },
  "{title} · A4 portrait": {
    de: "{title} · A4 Hochformat",
    it: "{title} · A4 verticale",
  },
  "{title} · A4 paysage": {
    de: "{title} · A4 Querformat",
    it: "{title} · A4 orizzontale",
  },
  "{n} badge(s) de présence · A4 portrait": {
    de: "{n} Präsenzbadge(s) · A4 Hochformat",
    it: "{n} badge di presenza · A4 verticale",
  },
  "{n} étiquettes QR · A4 portrait": {
    de: "{n} QR-Etiketten · A4 Hochformat",
    it: "{n} etichette QR · A4 verticale",
  },
  "Aperçu avant impression": { de: "Druckvorschau", it: "Anteprima di stampa" },
  "Génération…": { de: "Wird erstellt …", it: "Generazione…" },
  "Fermer l’aperçu": { de: "Vorschau schliessen", it: "Chiudi l’anteprima" },
  // Names of the downloaded files (diacritics are removed by fileName)
  "message-{n}": { de: "meldung-{n}", it: "messaggio-{n}" },
  "Fichier : fiches": { fr: "fiches", de: "meldeblaetter", it: "schede" },
  "Fichier : quittance": { fr: "quittance", de: "quittung", it: "quittanza" },
  "Fichier : radio": { fr: "radio", de: "funknetzplan", it: "radio" },
  "Fichier : rapport": { fr: "rapport", de: "lagebericht", it: "rapporto" },
  "Fichier : badges": { fr: "badges", de: "badges", it: "badge" },
  "Fichier : etiquettes": {
    fr: "etiquettes",
    de: "etiketten",
    it: "etichette",
  },
} satisfies Dict);

const CHECK_KEYS = {
  "3": "THREE · bon",
  "2": "TWO · faible",
  "1": "ONE · insuffisant",
  "0": "Pas de liaison",
} as const;

/** Audibility of a liaison check (3, 2, 1, 0) in the language of the post. */
export const checkLabel = (result: string) =>
  result in CHECK_KEYS
    ? t(CHECK_KEYS[result as keyof typeof CHECK_KEYS])
    : result;

/** State of a terminal ("En service", "Disponible", condition). */
export const terminalStateLabel = (state: string) =>
  state === "En service" ? t("En service") : enumLabel(state);

/** Stored list of accessories ("Microtel, Chargeur") in the post language. */
export const accessoriesLabel = (list: string) =>
  list
    .split(",")
    .map((a) => a.trim())
    .filter(Boolean)
    .map((a) => enumLabel(a))
    .join(", ");
