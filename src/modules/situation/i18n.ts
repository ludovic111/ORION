import { translator, type Dict } from "../../../shared/i18n/core.ts";
import { common } from "../../../shared/i18n/common.ts";

// Situation page (Situation.tsx), follow-up cards (FollowCards.tsx) and the
// prepared point de situation (SituationPoint.tsx).
export const { t, tn, tIn, dict } = translator({
  ...common,
  // Record sheets
  Libellé: { de: "Bezeichnung", it: "Denominazione" },
  "ex. 12": { de: "z. B. 12", it: "p. es. 12" },
  Affichage: { de: "Anzeige", it: "Visualizzazione" },
  "Position (plus petit = en premier)": {
    de: "Position (kleiner = zuerst)",
    it: "Posizione (più piccolo = per primo)",
  },
  Position: { de: "Position", it: "Posizione" },
  "un renseignement": {
    de: "eine Schlüsselinformation",
    it: "un’informazione chiave",
  },
  "un tableau": { de: "eine Lagetafel", it: "una tabella" },
  "Indiquez un libellé.": {
    de: "Geben Sie eine Bezeichnung an.",
    it: "Indicare una denominazione.",
  },
  "Unité trop longue (40 caractères au plus).": {
    de: "Einheit zu lang (höchstens 40 Zeichen).",
    it: "Unità troppo lunga (al massimo 40 caratteri).",
  },
  "Indiquez un titre.": {
    de: "Geben Sie einen Titel an.",
    it: "Indicare un titolo.",
  },
  "Renseignement introuvable.": {
    de: "Schlüsselinformation nicht gefunden.",
    it: "Informazione chiave non trovata.",
  },
  "Tableau introuvable.": {
    de: "Lagetafel nicht gefunden.",
    it: "Tabella non trovata.",
  },
  // Header
  "Situation au {date}": { de: "Lage am {date}", it: "Situazione al {date}" },
  "Point de situation": { de: "Lagerapport", it: "Punto della situazione" },
  "Nouveau message": { de: "Neue Meldung", it: "Nuovo messaggio" },
  "Nouvelle entrée": { de: "Neuer Eintrag", it: "Nuova voce" },
  // Pulse
  "{d} j {h} h": { de: "{d} T {h} h", it: "{d} g {h} h" },
  "À suivre": { de: "Pendent", it: "Da seguire" },
  "Messages à traiter": {
    de: "Zu bearbeitende Meldungen",
    it: "Messaggi da trattare",
  },
  "Moyens engagés": { de: "Mittel im Einsatz", it: "Mezzi impiegati" },
  "Personnes présentes": { de: "Anwesende Personen", it: "Persone presenti" },
  Engagement: { de: "Einsatz", it: "Impiego" },
  "Clôturé le {date}": {
    de: "Abgeschlossen am {date}",
    it: "Chiuso il {date}",
  },
  "En cours (journal)": { fr: "En cours", de: "Laufend", it: "In corso" },
  "Engagement depuis": { de: "Im Einsatz seit", it: "Impiego da" },
  "Ouvert le {date}": { de: "Eröffnet am {date}", it: "Aperto il {date}" },
  "dernière entrée {when}": {
    de: "letzter Eintrag {when}",
    it: "ultima voce {when}",
  },
  "L’engagement en chiffres": {
    de: "Der Einsatz in Zahlen",
    it: "L’impiego in cifre",
  },
  // Key facts
  "Renseignements clés : {label} {before} → {after}": {
    de: "Schlüsselinformationen: {label} {before} → {after}",
    it: "Informazioni chiave: {label} {before} → {after}",
  },
  "Consigné au journal.": {
    de: "Im Journal erfasst.",
    it: "Registrato nel diario.",
  },
  "Renseignements standards ajoutés.": {
    de: "Standard-Schlüsselinformationen hinzugefügt.",
    it: "Informazioni chiave standard aggiunte.",
  },
  "Renseignements clés": {
    de: "Schlüsselinformationen",
    it: "Informazioni chiave",
  },
  "Renseignement (catégorie)": {
    fr: "Renseignement",
    de: "Information",
    it: "Informazione",
  },
  "Diminuer « {label} »": {
    de: "« {label} » verringern",
    it: "Diminuire « {label} »",
  },
  "Augmenter « {label} »": {
    de: "« {label} » erhöhen",
    it: "Aumentare « {label} »",
  },
  "Consigner ce changement au journal": {
    de: "Diese Änderung im Journal erfassen",
    it: "Registrare questa modifica nel diario",
  },
  "Consigner {before} → {after}": {
    de: "{before} → {after} erfassen",
    it: "Registrare {before} → {after}",
  },
  "Ne pas consigner": { de: "Nicht erfassen", it: "Non registrare" },
  "Ajouter les renseignements standards": {
    de: "Standard-Schlüsselinformationen hinzufügen",
    it: "Aggiungere le informazioni chiave standard",
  },
  "Un renseignement": {
    de: "Eine Schlüsselinformation",
    it: "Un’informazione chiave",
  },
  "Les chiffres que tout le monde demande : blessés, évacués, bâtiments touchés, personnel engagé… Mis à jour d’un clic avec « + » et « − ».":
    {
      de: "Die Zahlen, nach denen alle fragen: Verletzte, Evakuierte, betroffene Gebäude, eingesetztes Personal … Mit einem Klick auf « + » und « − » aktualisiert.",
      it: "Le cifre che tutti chiedono: feriti, evacuati, edifici colpiti, personale impiegato… Aggiornate con un clic su « + » e « − ».",
    },
  "Compléter avec les renseignements standards": {
    de: "Mit Standard-Schlüsselinformationen ergänzen",
    it: "Completare con le informazioni chiave standard",
  },
  // Open points
  "Points ouverts": { de: "Offene Punkte", it: "Punti aperti" },
  "{n} en retard": { de: "{n} überfällig", it: "{n} in ritardo" },
  "échéance {time}": { de: "Frist {time}", it: "scadenza {time}" },
  "Voir les {n} points": {
    de: "Alle {n} Punkte anzeigen",
    it: "Vedere i {n} punti",
  },
  "Aucun point ouvert. Les entrées « À traiter » ou « En cours » apparaissent ici, les échéances dépassées en premier.":
    {
      de: "Keine offenen Punkte. Einträge « Zu bearbeiten » oder « In Bearbeitung » erscheinen hier, überschrittene Fristen zuerst.",
      it: "Nessun punto aperto. Le voci « Da trattare » o « In corso » appaiono qui, prima le scadenze superate.",
    },
  // Boards
  "Rubriques standards créées.": {
    de: "Standardrubriken erstellt.",
    it: "Rubriche standard create.",
  },
  "Tableaux de situation": { de: "Lagetafeln", it: "Tabelle della situazione" },
  "Fiche « {title} » (titre, liens, suppression)": {
    de: "Blatt « {title} » (Titel, Verknüpfungen, Löschen)",
    it: "Scheda « {title} » (titolo, collegamenti, eliminazione)",
  },
  "Titre, liens, suppression": {
    de: "Titel, Verknüpfungen, Löschen",
    it: "Titolo, collegamenti, eliminazione",
  },
  "Contenu de « {title} »": {
    de: "Inhalt von « {title} »",
    it: "Contenuto di « {title} »",
  },
  "Vide.": { de: "Leer.", it: "Vuoto." },
  "Cliquez pour écrire…": {
    de: "Zum Schreiben klicken …",
    it: "Fare clic per scrivere…",
  },
  "⌘↵ ou clic ailleurs : enregistrer · Échap : annuler": {
    de: "⌘↵ oder Klick daneben: speichern · Esc: abbrechen",
    it: "⌘↵ o clic altrove: salvare · Esc: annullare",
  },
  "Mis à jour à {time}": {
    de: "Aktualisiert um {time}",
    it: "Aggiornato alle {time}",
  },
  "Créer les rubriques standards": {
    de: "Standardrubriken erstellen",
    it: "Creare le rubriche standard",
  },
  "Un tableau": { de: "Eine Lagetafel", it: "Una tabella" },
  "Des tableaux de texte libre pour la situation générale, les dangers, l’intention et les points à traiter au prochain rapport. Modifiables d’un clic, par tous les postes.":
    {
      de: "Freitext-Tafeln für die allgemeine Lage, die Gefahren, die Absicht und die Punkte für den nächsten Rapport. Mit einem Klick von allen Arbeitsplätzen bearbeitbar.",
      it: "Tabelle di testo libero per la situazione generale, i pericoli, l’intenzione e i punti da trattare al prossimo rapporto. Modificabili con un clic da tutte le postazioni.",
    },
  // Meetings
  "Prochains rendez-vous": {
    de: "Nächste Termine",
    it: "Prossimi appuntamenti",
  },
  Agenda: { de: "Agenda", it: "Agenda" },
  "en cours": { de: "läuft", it: "in corso" },
  "Prévoir le prochain rapport": {
    de: "Nächsten Rapport planen",
    it: "Pianificare il prossimo rapporto",
  },
  "Aucun rendez-vous à venir.": {
    de: "Keine anstehenden Termine.",
    it: "Nessun appuntamento in programma.",
  },
  // Messages
  "{n} nouveau": { de: "{n} neu", it: "{n} nuovo" },
  "{n} nouveaux": { de: "{n} neu", it: "{n} nuovi" },
  "De {from}": { de: "Von {from}", it: "Da {from}" },
  "à {to}": { de: "an {to}", it: "a {to}" },
  "Saisir un message reçu": {
    de: "Eingegangene Meldung erfassen",
    it: "Registrare un messaggio ricevuto",
  },
  "Aucun message en attente de traitement.": {
    de: "Keine Meldung wartet auf Bearbeitung.",
    it: "Nessun messaggio in attesa di trattamento.",
  },
  // Entries
  "Dernières entrées du journal": {
    de: "Letzte Einträge im Journal",
    it: "Ultime voci del diario",
  },
  "Dernières entrées": { de: "Letzte Einträge", it: "Ultime voci" },
  "Première entrée": { de: "Erster Eintrag", it: "Prima voce" },
  "Le journal est vide. Chaque événement, décision ou message y est consigné et numéroté.":
    {
      de: "Das Journal ist leer. Jedes Ereignis, jeder Entscheid und jede Meldung wird darin erfasst und nummeriert.",
      it: "Il diario è vuoto. Ogni evento, decisione o messaggio vi è registrato e numerato.",
    },
  // Resources
  moyen: { de: "Mittel", it: "mezzo" },
  moyens: { de: "Mittel", it: "mezzi" },
  Personnel: { de: "Personal", it: "Personale" },
  "{label} : {n}": { de: "{label}: {n}", it: "{label}: {n}" },
  "Personnel : {n}.": { de: "Personal: {n}.", it: "Personale: {n}." },
  "Saisir les moyens": { de: "Mittel erfassen", it: "Registrare i mezzi" },
  "Véhicules, personnel et matériel, avec leur état (disponible, engagé…).": {
    de: "Fahrzeuge, Personal und Material mit ihrem Status (verfügbar, im Einsatz …).",
    it: "Veicoli, personale e materiale, con il loro stato (disponibile, impiegato…).",
  },
  // Team
  Présents: { de: "Anwesend", it: "Presenti" },
  Absents: { de: "Abwesend", it: "Assenti" },
  Équipe: { de: "Team", it: "Squadra" },
  "{present}/{total} présents": {
    de: "{present}/{total} anwesend",
    it: "{present}/{total} presenti",
  },
  "Composer l’équipe": {
    de: "Team zusammenstellen",
    it: "Comporre la squadra",
  },
  "Qui est là, à quelle fonction, dans quel poste ou cellule.": {
    de: "Wer ist da, in welcher Funktion, in welchem Posten oder welcher Zelle.",
    it: "Chi c’è, con quale funzione, in quale posto o cellula.",
  },
  // Radio
  "En service": { de: "Ausgegeben", it: "In servizio" },
  Disponibles: { de: "Verfügbar", it: "Disponibili" },
  Indisponibles: { de: "Nicht verfügbar", it: "Non disponibili" },
  "{terminals} terminaux · {stations} noms d’appel · {talkgroups} groupes": {
    de: "{terminals} Endgeräte · {stations} Rufnamen · {talkgroups} Gesprächsgruppen",
    it: "{terminals} terminali · {stations} nominativi · {talkgroups} gruppi",
  },
  "Préparer le réseau radio": {
    de: "Funknetz vorbereiten",
    it: "Preparare la rete radio",
  },
  "Terminaux Polycom, noms d’appel, remises et contrôles de liaison.": {
    de: "Polycom-Endgeräte, Rufnamen, Ausgaben und Verbindungskontrollen.",
    it: "Terminali Polycom, nominativi, consegne e controlli dei collegamenti.",
  },
  // Weather
  "{n} alerte": { de: "{n} Warnung", it: "{n} allerta" },
  "{n} alertes": { de: "{n} Warnungen", it: "{n} allerte" },
  "Choisir le lieu": { de: "Ort wählen", it: "Scegliere il luogo" },
  "Prévision MétéoSuisse pour le lieu d’engagement, observations sur place et alertes de danger.":
    {
      de: "Prognose von MeteoSchweiz für den Einsatzort, Beobachtungen vor Ort und Gefahrenwarnungen.",
      it: "Previsione di MeteoSvizzera per il luogo d’impiego, osservazioni sul posto e allerte di pericolo.",
    },
  "vent {speed} km/h": { de: "Wind {speed} km/h", it: "vento {speed} km/h" },
  "vent {speed} km/h du {direction}": {
    de: "Wind {speed} km/h aus {direction}",
    it: "vento {speed} km/h da {direction}",
  },
  "rafales {speed}": { de: "Böen {speed}", it: "raffiche {speed}" },
  "{place} · données du {date}": {
    de: "{place} · Daten vom {date}",
    it: "{place} · dati del {date}",
  },
  Degré: { de: "Stufe", it: "Grado" },
  "Observation {time}": {
    de: "Beobachtung {time}",
    it: "Osservazione {time}",
  },
  Observation: { de: "Beobachtung", it: "Osservazione" },
  // Network
  "Réseau des liens": {
    de: "Netz der Verknüpfungen",
    it: "Rete dei collegamenti",
  },
  Réseau: { de: "Netz", it: "Rete" },
  "Ouvrir le réseau des liens": {
    de: "Netz der Verknüpfungen öffnen",
    it: "Aprire la rete dei collegamenti",
  },
  éléments: { de: "Elemente", it: "elementi" },
  liens: { de: "Verknüpfungen", it: "collegamenti" },
  "Les plus reliés": { de: "Am stärksten verknüpft", it: "I più collegati" },
  "{n} lien": { de: "{n} Verknüpfung", it: "{n} collegamento" },
  "{n} liens": { de: "{n} Verknüpfungen", it: "{n} collegamenti" },
  "Les éléments se relient automatiquement (noms d’appel, références #012…) ou avec « Lier » dans chaque fiche.":
    {
      de: "Die Elemente werden automatisch verknüpft (Rufnamen, Verweise #012 …) oder mit « Verknüpfen » in jedem Blatt.",
      it: "Gli elementi si collegano automaticamente (nominativi, riferimenti #012…) o con « Collega » in ogni scheda.",
    },
  // Follow-up cards
  "Listes de contrôle": { de: "Checklisten", it: "Liste di controllo" },
  Listes: { de: "Listen", it: "Liste" },
  "Prochaine : {text}": {
    de: "Nächster Schritt: {text}",
    it: "Prossima: {text}",
  },
  "Toutes les étapes sont faites": {
    de: "Alle Schritte sind erledigt",
    it: "Tutte le tappe sono concluse",
  },
  "Aucune liste en cours. Une liste par type d’événement (crue, black-out…) rappelle les étapes à ne pas oublier.":
    {
      de: "Keine laufende Checkliste. Eine Liste pro Ereignistyp (Hochwasser, Blackout …) erinnert an die Schritte, die man nicht vergessen darf.",
      it: "Nessuna lista in corso. Una lista per tipo di evento (piena, black-out…) ricorda le tappe da non dimenticare.",
    },
  "Démarrer une liste": { de: "Checkliste starten", it: "Avviare una lista" },
  "Demandes de moyens": { de: "Mittelanforderungen", it: "Richieste di mezzi" },
  Demandes: { de: "Anforderungen", it: "Richieste" },
  "arrivée {time}": { de: "Ankunft {time}", it: "arrivo {time}" },
  "retard {duration}": {
    de: "Verspätung {duration}",
    it: "ritardo {duration}",
  },
  "Aucune demande en attente.": {
    de: "Keine offene Anforderung.",
    it: "Nessuna richiesta in attesa.",
  },
  Présences: { de: "Anwesenheiten", it: "Presenze" },
  "{n} au PC": { de: "{n} im KP", it: "{n} al PC" },
  Appel: { de: "Appell", it: "Appello" },
  "{name} : {text}": { de: "{name}: {text}", it: "{name}: {text}" },
  "{title} jusqu’à {time}": {
    de: "{title} bis {time}",
    it: "{title} fino alle {time}",
  },
  "Relève en cours : {list}.": {
    de: "Laufende Ablösung: {list}.",
    it: "Avvicendamento in corso: {list}.",
  },
  "Aucune relève en cours.": {
    de: "Keine laufende Ablösung.",
    it: "Nessun avvicendamento in corso.",
  },
  " Prochaine : {title} à {time}.": {
    de: " Nächste: {title} um {time}.",
    it: " Prossimo: {title} alle {time}.",
  },
  "Le plus long service : {duration}.": {
    de: "Längster Dienst: {duration}.",
    it: "Servizio più lungo: {duration}.",
  },
  // Point de situation
  "Point de situation · {report} de {time}": {
    de: "Lagerapport · {report} von {time}",
    it: "Punto della situazione · {report} delle {time}",
  },
  "Point de situation de {time}": {
    de: "Lagerapport von {time}",
    it: "Punto della situazione delle {time}",
  },
  "Établi par {author} · état au {date} · depuis {since}": {
    de: "Erstellt von {author} · Stand {date} · seit {since}",
    it: "Redatto da {author} · stato al {date} · dalle {since}",
  },
  "point-de-situation": {
    de: "lagerapport",
    it: "punto-della-situazione",
  },
  "Point de situation consigné au journal.": {
    de: "Lagerapport im Journal erfasst.",
    it: "Punto della situazione registrato nel diario.",
  },
  "Enregistré comme tableau de situation.": {
    de: "Als Lagetafel gespeichert.",
    it: "Salvato come tabella della situazione.",
  },
  "Moment figé : retrouvez-le dans Traçabilité.": {
    de: "Momentaufnahme erstellt: Sie finden sie unter Nachvollziehbarkeit.",
    it: "Istantanea creata: la trovate in Tracciabilità.",
  },
  "Brouillon préparé à partir du journal. Relisez, corrigez et complétez chaque rubrique avant le rapport.":
    {
      de: "Aus dem Journal vorbereiteter Entwurf. Lesen, korrigieren und ergänzen Sie jede Rubrik vor dem Rapport.",
      it: "Bozza preparata a partire dal diario. Rileggere, correggere e completare ogni rubrica prima del rapporto.",
    },
  "Depuis (dernier rapport)": {
    de: "Seit (letzter Rapport)",
    it: "Dalle (ultimo rapporto)",
  },
  "Refaire le brouillon depuis cette heure ? Vos corrections seront perdues.": {
    de: "Entwurf ab dieser Zeit neu erstellen? Ihre Korrekturen gehen verloren.",
    it: "Rifare la bozza da quest’ora? Le correzioni andranno perse.",
  },
  "Refaire le brouillon ? Vos corrections seront perdues.": {
    de: "Entwurf neu erstellen? Ihre Korrekturen gehen verloren.",
    it: "Rifare la bozza? Le correzioni andranno perse.",
  },
  "Refaire le brouillon": {
    de: "Entwurf neu erstellen",
    it: "Rifare la bozza",
  },
  "Copié.": { de: "Kopiert.", it: "Copiato." },
  "Copie impossible dans ce navigateur.": {
    de: "Kopieren in diesem Browser nicht möglich.",
    it: "Copia impossibile in questo browser.",
  },
  "Figer ce moment": {
    de: "Momentaufnahme erstellen",
    it: "Creare un’istantanea",
  },
  "Enregistrer comme tableau": {
    de: "Als Lagetafel speichern",
    it: "Salvare come tabella",
  },
  "Consigner au journal": {
    de: "Im Journal erfassen",
    it: "Registrare nel diario",
  },
} satisfies Dict);
