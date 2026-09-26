import { translator, type Dict } from "../../../shared/i18n/core.ts";
import { common } from "../../../shared/i18n/common.ts";

// Texts of the rhythm of command (Agenda.tsx, Reminders.tsx, rhythm.ts).
export const { t, tn, tIn, dict } = translator({
  ...common,
  // rhythm.ts: countdowns
  "dans {when}": { de: "in {when}", it: "tra {when}" },
  "il y a {when}": { de: "vor {when}", it: "{when} fa" },
  "{d} j {h} h": { de: "{d} T. {h} h", it: "{d} g {h} h" },
  "moins d’une minute": {
    de: "weniger als einer Minute",
    it: "meno di un minuto",
  },
  "se termine {when}": { de: "endet {when}", it: "termina {when}" },
  // Agenda.tsx: fields
  "ex. Rapport de conduite": {
    de: "z. B. Führungsrapport",
    it: "es. Rapporto di condotta",
  },
  "Date et heure": { de: "Datum und Zeit", it: "Data e ora" },
  "Durée (minutes)": { de: "Dauer (Minuten)", it: "Durata (minuti)" },
  "ex. salle de conduite": {
    de: "z. B. Führungsraum",
    it: "es. sala di condotta",
  },
  Participants: { de: "Teilnehmende", it: "Partecipanti" },
  Détails: { de: "Details", it: "Dettagli" },
  "Ordre du jour / remarques": {
    de: "Traktanden / Bemerkungen",
    it: "Ordine del giorno / note",
  },
  Tenu: { de: "Abgehalten", it: "Tenuto" },
  // Agenda.tsx: module
  "Rendez-vous introuvable.": {
    de: "Termin nicht gefunden.",
    it: "Appuntamento non trovato.",
  },
  "{title} tenu à {time}": {
    de: "{title} abgehalten um {time}",
    it: "{title} tenuto alle {time}",
  },
  "Consigné au journal.": {
    de: "Im Journal erfasst.",
    it: "Registrato nel diario.",
  },
  "{n} rendez-vous": { de: "{n} Termin", it: "{n} appuntamento" },
  "{n} rendez-vous (pluriel)": {
    fr: "{n} rendez-vous",
    de: "{n} Termine",
    it: "{n} appuntamenti",
  },
  "Rendez-vous": { de: "Termin", it: "Appuntamento" },
  "Rythme de conduite": { de: "Führungsrhythmus", it: "Ritmo di condotta" },
  "{n} rendez-vous · état au {date}": {
    de: "{n} Termin · Stand {date}",
    it: "{n} appuntamento · stato al {date}",
  },
  "{n} rendez-vous · état au {date} (pluriel)": {
    fr: "{n} rendez-vous · état au {date}",
    de: "{n} Termine · Stand {date}",
    it: "{n} appuntamenti · stato al {date}",
  },
  "En cours": { de: "Läuft", it: "In corso" },
  "Pas encore tenu": { de: "Noch nicht abgehalten", it: "Non ancora tenuto" },
  "Préparer le point de situation": {
    de: "Lagerapport vorbereiten",
    it: "Prepara il punto della situazione",
  },
  "Préparer le point de situation pour « {title} »": {
    de: "Lagerapport für « {title} » vorbereiten",
    it: "Prepara il punto della situazione per « {title} »",
  },
  "Marquer « {title} » comme non tenu": {
    de: "« {title} » als nicht abgehalten markieren",
    it: "Segna « {title} » come non tenuto",
  },
  "Marquer « {title} » comme tenu": {
    de: "« {title} » als abgehalten markieren",
    it: "Segna « {title} » come tenuto",
  },
  "Marquer comme tenu": {
    de: "Als abgehalten markieren",
    it: "Segna come tenuto",
  },
  "Consigner au journal ?": {
    de: "Im Journal erfassen?",
    it: "Registrare nel diario?",
  },
  Consigner: { de: "Erfassen", it: "Registra" },
  "Ne pas consigner": { de: "Nicht erfassen", it: "Non registrare" },
  "Planifier un rythme": { de: "Rhythmus planen", it: "Pianifica un ritmo" },
  "Nouveau rendez-vous": { de: "Neuer Termin", it: "Nuovo appuntamento" },
  "Aucun rendez-vous": { de: "Keine Termine", it: "Nessun appuntamento" },
  "Planifier un rythme de rapports": {
    de: "Rapportrhythmus planen",
    it: "Pianifica un ritmo di rapporti",
  },
  "Ajouter un rendez-vous": {
    de: "Termin hinzufügen",
    it: "Aggiungi un appuntamento",
  },
  "Le rythme de conduite rassemble les rapports, orientations, relèves et points de situation, avec un compte à rebours. « Planifier un rythme » crée par exemple un rapport toutes les 2 heures en un clic.":
    {
      de: "Der Führungsrhythmus fasst Rapporte, Orientierungen, Ablösungen und Lagerapporte mit einem Countdown zusammen. « Rhythmus planen » erstellt zum Beispiel mit einem Klick alle 2 Stunden einen Rapport.",
      it: "Il ritmo di condotta riunisce rapporti, orientamenti, avvicendamenti e punti della situazione, con un conto alla rovescia. « Pianifica un ritmo » crea per esempio un rapporto ogni 2 ore con un clic.",
    },
  "Plus rien de prévu. Ajoutez le prochain rapport pour garder le rythme.": {
    de: "Nichts mehr geplant. Fügen Sie den nächsten Rapport hinzu, um den Rhythmus zu halten.",
    it: "Più niente in programma. Aggiungete il prossimo rapporto per mantenere il ritmo.",
  },
  "Prochain rendez-vous": {
    de: "Nächster Termin",
    it: "Prossimo appuntamento",
  },
  "Maintenant et à venir": {
    de: "Jetzt und demnächst",
    it: "Adesso e a breve",
  },
  "Plus tard aujourd’hui": { de: "Später heute", it: "Più tardi oggi" },
  "Jours suivants": { de: "Folgende Tage", it: "Giorni seguenti" },
  "Rien à venir.": { de: "Nichts geplant.", it: "Niente in programma." },
  "Passés et tenus": {
    de: "Vergangen und abgehalten",
    it: "Passati e tenuti",
  },
  "un rendez-vous": { de: "einen Termin", it: "un appuntamento" },
  "Indiquez un titre (un clic sur une valeur proposée suffit).": {
    de: "Geben Sie einen Titel an (ein Klick auf einen vorgeschlagenen Wert genügt).",
    it: "Indicate un titolo (basta un clic su un valore proposto).",
  },
  "Indiquez la date et l’heure.": {
    de: "Geben Sie Datum und Zeit an.",
    it: "Indicate la data e l’ora.",
  },
  "Durée maximale : 24 heures (1440 minutes).": {
    de: "Maximale Dauer: 24 Stunden (1440 Minuten).",
    it: "Durata massima: 24 ore (1440 minuti).",
  },
  "Point de situation": {
    de: "Lagerapport",
    it: "Punto della situazione",
  },
  // PlanDialog
  "Indiquez un titre.": {
    de: "Geben Sie einen Titel an.",
    it: "Indicate un titolo.",
  },
  "Vérifiez l’heure du premier rendez-vous et l’intervalle.": {
    de: "Prüfen Sie die Zeit des ersten Termins und das Intervall.",
    it: "Verificate l’ora del primo appuntamento e l’intervallo.",
  },
  "{n} rendez-vous planifié.": {
    de: "{n} Termin geplant.",
    it: "{n} appuntamento pianificato.",
  },
  "{n} rendez-vous planifiés.": {
    de: "{n} Termine geplant.",
    it: "{n} appuntamenti pianificati.",
  },
  "Premier rendez-vous": { de: "Erster Termin", it: "Primo appuntamento" },
  "Nombre de rendez-vous": {
    de: "Anzahl Termine",
    it: "Numero di appuntamenti",
  },
  "Toutes les": { de: "Alle", it: "Ogni" },
  Intervalle: { de: "Intervall", it: "Intervallo" },
  "Intervalle en heures": {
    de: "Intervall in Stunden",
    it: "Intervallo in ore",
  },
  heures: { de: "Stunden", it: "ore" },
  Aperçu: { de: "Vorschau", it: "Anteprima" },
  "Créer {n} rendez-vous": {
    de: "{n} Termin erstellen",
    it: "Crea {n} appuntamento",
  },
  "Créer {n} rendez-vous (pluriel)": {
    fr: "Créer {n} rendez-vous",
    de: "{n} Termine erstellen",
    it: "Crea {n} appuntamenti",
  },
  // Reminders.tsx
  Rappel: { de: "Erinnerung", it: "Promemoria" },
  Rappels: { de: "Erinnerungen", it: "Promemoria" },
  "ex. Exporter l’archive chiffrée": {
    de: "z. B. Verschlüsseltes Archiv exportieren",
    it: "es. Esporta l’archivio cifrato",
  },
  "Action en un clic": {
    de: "Aktion mit einem Klick",
    it: "Azione con un clic",
  },
  "Exporter l’archive": { de: "Archiv exportieren", it: "Esporta l’archivio" },
  "Imprimer la situation": { de: "Lage drucken", it: "Stampa la situazione" },
  "Toutes les (minutes, 0 = jamais)": {
    de: "Alle (Minuten, 0 = nie)",
    it: "Ogni (minuti, 0 = mai)",
  },
  "120 = toutes les 2 heures, à partir de la création du rappel.": {
    de: "120 = alle 2 Stunden, ab Erstellung der Erinnerung.",
    it: "120 = ogni 2 ore, a partire dalla creazione del promemoria.",
  },
  "Avant chaque rapport (minutes, 0 = non)": {
    de: "Vor jedem Rapport (Minuten, 0 = nein)",
    it: "Prima di ogni rapporto (minuti, 0 = no)",
  },
  "Rendez-vous dont le type ou le titre contient « rapport ».": {
    de: "Termine, deren Typ oder Titel « Rapport » enthält.",
    it: "Appuntamenti il cui tipo o titolo contiene « rapport ».",
  },
  Actif: { de: "Aktiv", it: "Attivo" },
  "toutes les {n} h": { de: "alle {n} h", it: "ogni {n} h" },
  "toutes les {n} min": { de: "alle {n} Min.", it: "ogni {n} min" },
  "{n} min avant chaque rapport": {
    de: "{n} Min. vor jedem Rapport",
    it: "{n} min prima di ogni rapporto",
  },
  "{a} et {b}": { de: "{a} und {b}", it: "{a} e {b}" },
  "jamais (à régler)": {
    de: "nie (einzustellen)",
    it: "mai (da impostare)",
  },
  "Rappels d’export et d’impression": {
    de: "Erinnerungen für Export und Druck",
    it: "Promemoria di esportazione e stampa",
  },
  "Sans serveur : le rappel s’affiche sur les postes ouverts à l’heure prévue, avec l’action en un clic. Un export ou une impression depuis le centre d’export le marque fait (registre des exports).":
    {
      de: "Ohne Server: Die Erinnerung erscheint zur vorgesehenen Zeit auf den geöffneten Arbeitsplätzen, mit der Aktion per Klick. Ein Export oder Druck aus dem Exportzentrum markiert sie als erledigt (Exportregister).",
      it: "Senza server: il promemoria appare sulle postazioni aperte all’ora prevista, con l’azione in un clic. Un’esportazione o una stampa dal centro di esportazione lo segna come fatto (registro delle esportazioni).",
    },
  "prochain {date}": { de: "nächste {date}", it: "prossimo {date}" },
  "fait {date}": { de: "erledigt {date}", it: "fatto {date}" },
  "Rappels standards ajoutés.": {
    de: "Standarderinnerungen hinzugefügt.",
    it: "Promemoria standard aggiunti.",
  },
  "Ajouter les rappels standards": {
    de: "Standarderinnerungen hinzufügen",
    it: "Aggiungi i promemoria standard",
  },
  "Nouveau rappel": { de: "Neue Erinnerung", it: "Nuovo promemoria" },
  "Indiquez le rappel.": {
    de: "Geben Sie die Erinnerung an.",
    it: "Indicate il promemoria.",
  },
  "Au plus toutes les 24 h (1440 min) et 600 min avant un rapport.": {
    de: "Höchstens alle 24 h (1440 Min.) und 600 Min. vor einem Rapport.",
    it: "Al massimo ogni 24 h (1440 min) e 600 min prima di un rapporto.",
  },
  // Standard reminders (shared/reminders.ts), written in the language of
  // the journal.
  "Exporter l’archive chiffrée": {
    de: "Verschlüsseltes Archiv exportieren",
    it: "Esporta l’archivio cifrato",
  },
  "Imprimer la situation pour le rapport": {
    de: "Lage für den Rapport drucken",
    it: "Stampa la situazione per il rapporto",
  },
  "Une archive .orionaic à jour sur une clé ou un autre poste.": {
    de: "Ein aktuelles .orionaic-Archiv auf einem Stick oder einem anderen Arbeitsplatz.",
    it: "Un archivio .orionaic aggiornato su una chiavetta o un’altra postazione.",
  },
} satisfies Dict);
