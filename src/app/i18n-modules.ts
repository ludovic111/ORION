import { translator, type Dict } from "../../shared/i18n/core.ts";

// Names and descriptions of the modules (src/app/modules.ts).
export const { t, tn, dict } = translator({
  Situation: { de: "Lage", it: "Situazione" },
  "Vue d’ensemble : renseignements clés, points ouverts, moyens, météo, prochains rapports.":
    {
      de: "Überblick: Schlüsselinformationen, offene Punkte, Mittel, Wetter, nächste Rapporte.",
      it: "Panoramica: informazioni chiave, punti aperti, mezzi, meteo, prossimi rapporti.",
    },
  "Journal d’intervention": {
    de: "Einsatzjournal",
    it: "Diario d’intervento",
  },
  Journal: { de: "Journal", it: "Diario" },
  "Registre chronologique et numéroté de tout ce qui se passe, se décide et se transmet.":
    {
      de: "Chronologisches, nummeriertes Verzeichnis von allem, was geschieht, entschieden und übermittelt wird.",
      it: "Registro cronologico e numerato di tutto ciò che accade, si decide e si trasmette.",
    },
  Messages: { de: "Meldungen", it: "Messaggi" },
  "Réception et synthèse des messages avant leur inscription au journal.": {
    de: "Eingang und Synthese der Meldungen vor ihrer Erfassung im Journal.",
    it: "Ricezione e sintesi dei messaggi prima della registrazione nel diario.",
  },
  "Missions et suivi": {
    de: "Aufträge und Pendenzen",
    it: "Missioni e seguito",
  },
  Missions: { de: "Aufträge", it: "Missioni" },
  "Tableau des missions, demandes et points à suivre, par état.": {
    de: "Übersicht der Aufträge, Anfragen und Pendenzen nach Status.",
    it: "Tabella delle missioni, richieste e punti da seguire, per stato.",
  },
  "Mes tâches": { de: "Meine Aufgaben", it: "I miei compiti" },
  "Ce qui est attribué à la fonction de ce poste ou à son opérateur, le plus en retard d’abord.":
    {
      de: "Was der Funktion dieses Arbeitsplatzes oder seinem Operateur zugewiesen ist, das Überfälligste zuerst.",
      it: "Ciò che è assegnato alla funzione di questa postazione o al suo operatore, prima il più in ritardo.",
    },
  "Ordres et diffusions": {
    de: "Befehle und Verteilung",
    it: "Ordini e diffusioni",
  },
  Ordres: { de: "Befehle", it: "Ordini" },
  "Ordres en cinq points, diffusions avec accusé de lecture, liaison avec l’autre PC.":
    {
      de: "Befehle in fünf Punkten, Verteilung mit Lesebestätigung, Verbindung zum anderen KP.",
      it: "Ordini in cinque punti, diffusioni con conferma di lettura, collegamento con l’altro PC.",
    },
  "Listes de contrôle": { de: "Checklisten", it: "Liste di controllo" },
  Listes: { de: "Checklisten", it: "Liste" },
  "Ce qu’il ne faut pas oublier par type d’événement : étapes, fonction responsable, contrôles à suivre.":
    {
      de: "Was je nach Ereignisart nicht vergessen werden darf: Schritte, verantwortliche Funktion, Kontrollen.",
      it: "Ciò che non va dimenticato per tipo di evento: tappe, funzione responsabile, controlli da seguire.",
    },
  "Carte de situation": {
    de: "Lagekarte",
    it: "Carta della situazione",
  },
  Carte: { de: "Karte", it: "Carta" },
  "Carte swisstopo avec signes, zones, tracés et tout ce qui y est lié.": {
    de: "swisstopo-Karte mit Signaturen, Zonen, Linien und allem, was damit verknüpft ist.",
    it: "Carta swisstopo con simboli, zone, tracciati e tutto ciò che vi è collegato.",
  },
  Moyens: { de: "Mittel", it: "Mezzi" },
  "Véhicules, personnel et matériel engagés ou disponibles, avec leur état.": {
    de: "Fahrzeuge, Personal und Material, eingesetzt oder verfügbar, mit ihrem Status.",
    it: "Veicoli, personale e materiale impiegati o disponibili, con il loro stato.",
  },
  "Équipe et postes": { de: "Team und Posten", it: "Squadra e posti" },
  Équipe: { de: "Team", it: "Squadra" },
  "Qui fait quoi : PC front, PC arrière, cellules, fonctions, grades, présences.":
    {
      de: "Wer macht was: KP Front, KP Rück, Zellen, Funktionen, Grade, Präsenzen.",
      it: "Chi fa cosa: PC avanzato, PC arretrato, cellule, funzioni, gradi, presenze.",
    },
  "Réseau radio": { de: "Funknetz", it: "Rete radio" },
  Radio: { de: "Funk", it: "Radio" },
  "Plan Polycom : groupes, noms d’appel, terminaux, remises et contrôles de liaison.":
    {
      de: "Polycom-Plan: Gesprächsgruppen, Rufnamen, Endgeräte, Abgaben und Verbindungskontrollen.",
      it: "Piano Polycom: gruppi, nominativi, terminali, consegne e controlli dei collegamenti.",
    },
  Contacts: { de: "Kontakte", it: "Contatti" },
  "Annuaire des partenaires, autorités, fournisseurs et numéros d’urgence.": {
    de: "Verzeichnis der Partner, Behörden, Lieferanten und Notrufnummern.",
    it: "Rubrica di partner, autorità, fornitori e numeri d’emergenza.",
  },
  Météo: { de: "Wetter", it: "Meteo" },
  "Prévisions, observations sur place et alertes de danger.": {
    de: "Prognosen, Beobachtungen vor Ort und Gefahrenwarnungen.",
    it: "Previsioni, osservazioni sul posto e allerte di pericolo.",
  },
  "Rythme de conduite": { de: "Führungsrhythmus", it: "Ritmo di condotta" },
  Agenda: { de: "Agenda", it: "Agenda" },
  "Rapports, orientations, relèves et rendez-vous, avec compte à rebours.": {
    de: "Rapporte, Orientierungen, Ablösungen und Termine, mit Countdown.",
    it: "Rapporti, orientamenti, avvicendamenti e appuntamenti, con conto alla rovescia.",
  },
  "Réseau des liens": { de: "Beziehungsnetz", it: "Rete dei collegamenti" },
  Liens: { de: "Bezüge", it: "Collegamenti" },
  "Toutes les informations et ce qui les relie, comme un réseau de neurones.": {
    de: "Alle Informationen und was sie verbindet, wie ein neuronales Netz.",
    it: "Tutte le informazioni e ciò che le collega, come una rete neurale.",
  },
  "Traçabilité et versions": {
    de: "Nachvollziehbarkeit und Versionen",
    it: "Tracciabilità e versioni",
  },
  Traçabilité: { de: "Verlauf", it: "Tracciabilità" },
  "Qui a fait quoi et quand, versions de tout, comparaisons, exports et présentations.":
    {
      de: "Wer hat was wann gemacht, Versionen von allem, Vergleiche, Exporte und Präsentationen.",
      it: "Chi ha fatto cosa e quando, versioni di tutto, confronti, esportazioni e presentazioni.",
    },
  "Débriefing et exercice": {
    de: "Debriefing und Übung",
    it: "Debriefing ed esercizio",
  },
  RETEX: { de: "Debriefing", it: "Debriefing" },
  "Relecture de l’opération, chiffres de la conduite, points à retenir ; scénario et injects de la direction d’exercice.":
    {
      de: "Nachbetrachtung des Einsatzes, Führungskennzahlen, Erkenntnisse; Szenario und Einspielungen der Übungsleitung.",
      it: "Rilettura dell’operazione, cifre della condotta, punti da ricordare; scenario e inject della direzione d’esercizio.",
    },
  "Aide et documentation": {
    de: "Hilfe und Dokumentation",
    it: "Aiuto e documentazione",
  },
  Aide: { de: "Hilfe", it: "Aiuto" },
  "Comment utiliser chaque fonction, en bref ou en détail.": {
    de: "Wie jede Funktion verwendet wird, kurz oder ausführlich.",
    it: "Come usare ogni funzione, in breve o in dettaglio.",
  },
} satisfies Dict);
