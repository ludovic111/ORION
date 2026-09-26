import { translator, type Dict } from "../../../shared/i18n/core.ts";
import { common } from "../../../shared/i18n/common.ts";

// Débriefing (Debrief.tsx) and direction d’exercice (Direction.tsx).
export const { t, tn, tIn, dict } = translator({
  ...common,
  // ---------- Debrief.tsx ----------
  "Relecture, chiffres de la conduite et points à retenir. La direction d’exercice y prépare et joue le scénario.":
    {
      de: "Rückblick, Kennzahlen der Führung und Erkenntnisse. Die Übungsleitung bereitet hier das Szenario vor und spielt es ein.",
      it: "Riesame, cifre della condotta e punti da ricordare. La direzione d’esercizio vi prepara e gioca lo scenario.",
    },
  "Relecture de l’intervention, chiffres de la conduite et points à retenir (RETEX).":
    {
      de: "Rückblick auf den Einsatz, Kennzahlen der Führung und Erkenntnisse (Debriefing).",
      it: "Riesame dell’intervento, cifre della condotta e punti da ricordare (debriefing).",
    },
  "Débriefing en PDF (centre d’export)": {
    de: "Debriefing als PDF (Exportzentrum)",
    it: "Debriefing in PDF (centro di esportazione)",
  },
  "Débriefing en Word (centre d’export)": {
    de: "Debriefing als Word (Exportzentrum)",
    it: "Debriefing in Word (centro di esportazione)",
  },
  Vue: { de: "Ansicht", it: "Vista" },
  Débriefing: { de: "Debriefing", it: "Debriefing" },
  "Direction d’exercice": {
    de: "Übungsleitung",
    it: "Direzione d’esercizio",
  },
  "Chiffres de la conduite": {
    de: "Kennzahlen der Führung",
    it: "Cifre della condotta",
  },
  "injects joués": { de: "gespielte Einspielungen", it: "inject giocati" },
  "réaction médiane": { de: "Median der Reaktion", it: "reazione mediana" },
  "injects en retard": {
    de: "verspätete Einspielungen",
    it: "inject in ritardo",
  },
  "échéances dépassées": {
    de: "überschrittene Fristen",
    it: "scadenze superate",
  },
  "retard cumulé": { de: "kumulierte Verspätung", it: "ritardo cumulato" },
  "traitement médian d’un message": {
    de: "Median der Bearbeitung einer Meldung",
    it: "trattamento mediano di un messaggio",
  },
  "entrées au journal": { de: "Einträge im Journal", it: "voci nel diario" },
  "Réactions aux injects": {
    de: "Reaktionen auf Einspielungen",
    it: "Reazioni agli inject",
  },
  Joué: { de: "Gespielt", it: "Giocato" },
  Inject: { de: "Einspielung", it: "Inject" },
  Réaction: { de: "Reaktion", it: "Reazione" },
  Délai: { de: "Frist", it: "Termine" },
  "retard {delay}": { de: "Verspätung {delay}", it: "ritardo {delay}" },
  "à temps": { de: "rechtzeitig", it: "in tempo" },
  "en attente": { de: "ausstehend", it: "in attesa" },
  "Aucun inject joué pour l’instant. La réaction se mesure dès qu’un inject arrive : message traité, inscrit au journal, lié à une entrée, ou réaction marquée par la direction.":
    {
      de: "Noch keine Einspielung gespielt. Die Reaktion wird gemessen, sobald eine Einspielung eintrifft: Meldung bearbeitet, im Journal erfasst, mit einem Eintrag verknüpft oder Reaktion von der Übungsleitung markiert.",
      it: "Ancora nessun inject giocato. La reazione si misura non appena arriva un inject: messaggio trattato, registrato nel diario, collegato a una voce o reazione segnata dalla direzione.",
    },
  "Délai de traitement des messages": {
    de: "Bearbeitungszeit der Meldungen",
    it: "Tempo di trattamento dei messaggi",
  },
  "Aucun message reçu.": {
    de: "Keine Meldung eingegangen.",
    it: "Nessun messaggio ricevuto.",
  },
  "De la réception au premier traitement : message pris en charge, inscrit au journal ou lié à une entrée.":
    {
      de: "Vom Eingang bis zur ersten Bearbeitung: Meldung übernommen, im Journal erfasst oder mit einem Eintrag verknüpft.",
      it: "Dalla ricezione al primo trattamento: messaggio preso in carico, registrato nel diario o collegato a una voce.",
    },
  "Entrées au journal par heure": {
    de: "Einträge im Journal pro Stunde",
    it: "Voci nel diario per ora",
  },
  "Échéances dépassées": {
    de: "Überschrittene Fristen",
    it: "Scadenze superate",
  },
  "ouverte, +{delay}": { de: "offen, +{delay}", it: "aperta, +{delay}" },
  "Les {n} échéances ont été tenues.": {
    de: "Alle {n} Fristen wurden eingehalten.",
    it: "Tutte le {n} scadenze sono state rispettate.",
  },
  "Aucune entrée n’a d’échéance.": {
    de: "Kein Eintrag hat eine Frist.",
    it: "Nessuna voce ha una scadenza.",
  },
  "Qui a fait quoi": { de: "Wer hat was gemacht", it: "Chi ha fatto cosa" },
  Personne: { de: "Person", it: "Persona" },
  Corrections: { de: "Korrekturen", it: "Correzioni" },
  Autres: { de: "Andere", it: "Altri" },
  "Rien d’enregistré pour l’instant.": {
    de: "Noch nichts erfasst.",
    it: "Ancora nulla di registrato.",
  },
  "Rejouer l’opération": {
    de: "Einsatz erneut abspielen",
    it: "Rigiocare l’operazione",
  },
  "Toute l’application revient au début et avance seule : carte, journal, messages et moyens bougent ensemble. Changez de module pendant la relecture ; la barre du bas met en pause ou revient au direct.":
    {
      de: "Die ganze Anwendung springt an den Anfang und läuft von selbst weiter: Karte, Journal, Meldungen und Mittel bewegen sich gemeinsam. Wechseln Sie während der Wiedergabe das Modul; die untere Leiste pausiert oder kehrt zur Live-Ansicht zurück.",
      it: "Tutta l’applicazione torna all’inizio e avanza da sola: carta, diario, messaggi e mezzi si muovono insieme. Cambiare modulo durante la riproduzione; la barra in basso mette in pausa o torna alla diretta.",
    },
  "Rejouer ×{speed}": {
    de: "Abspielen ×{speed}",
    it: "Rigiocare ×{speed}",
  },
  "depuis {date}": { de: "ab {date}", it: "da {date}" },
  "Moment affiché : {date}": {
    de: "Angezeigter Zeitpunkt: {date}",
    it: "Momento visualizzato: {date}",
  },
  "Situation au moment affiché": {
    de: "Lage zum angezeigten Zeitpunkt",
    it: "Situazione al momento visualizzato",
  },
  entrées: { de: "Einträge", it: "voci" },
  "points ouverts": { de: "offene Punkte", it: "punti aperti" },
  "en retard": { de: "überfällig", it: "in ritardo" },
  "messages non lus": { de: "ungelesene Meldungen", it: "messaggi non letti" },
  "moyens engagés": { de: "Mittel im Einsatz", it: "mezzi impiegati" },
  "Aucune entrée au journal.": {
    de: "Kein Eintrag im Journal.",
    it: "Nessuna voce nel diario.",
  },
  "{hour} h : {n} entrée": {
    de: "{hour} Uhr: {n} Eintrag",
    it: "Ore {hour}: {n} voce",
  },
  "{hour} h : {n} entrées": {
    de: "{hour} Uhr: {n} Einträge",
    it: "Ore {hour}: {n} voci",
  },
  "Points positifs": { de: "Positive Punkte", it: "Punti positivi" },
  "À améliorer": { de: "Verbesserungspunkte", it: "Da migliorare" },
  "Retirer ce point": {
    de: "Diesen Punkt entfernen",
    it: "Rimuovi questo punto",
  },
  "Ce qui a bien marché et qu’il faut garder.": {
    de: "Was gut funktioniert hat und beibehalten werden soll.",
    it: "Ciò che ha funzionato bene e va mantenuto.",
  },
  "Ce qu’il faudra faire autrement la prochaine fois.": {
    de: "Was beim nächsten Mal anders gemacht werden muss.",
    it: "Ciò che la prossima volta andrà fatto diversamente.",
  },
  "Domaine (facultatif)": {
    de: "Bereich (freiwillig)",
    it: "Ambito (facoltativo)",
  },
  Domaine: { de: "Bereich", it: "Ambito" },
  "Ex. Les quittances radio ont été consignées tout de suite.": {
    de: "z. B. Die Funkquittungen wurden sofort erfasst.",
    it: "Es. Le quittanze radio sono state registrate subito.",
  },
  "Ex. Désigner plus tôt un responsable pour l’hébergement.": {
    de: "z. B. Früher einen Verantwortlichen für die Unterbringung bestimmen.",
    it: "Es. Designare prima un responsabile per l’alloggio.",
  },

  // ---------- Direction.tsx ----------
  "Réservé à la direction d’exercice": {
    de: "Der Übungsleitung vorbehalten",
    it: "Riservato alla direzione d’esercizio",
  },
  "Le scénario et les injects à venir ne sont montrés qu’aux postes de la direction.":
    {
      de: "Das Szenario und die kommenden Einspielungen werden nur an den Arbeitsplätzen der Übungsleitung angezeigt.",
      it: "Lo scenario e gli inject futuri sono mostrati solo alle postazioni della direzione.",
    },
  "Saisissez le code choisi sur ce poste.": {
    de: "Geben Sie den an diesem Arbeitsplatz gewählten Code ein.",
    it: "Inserire il codice scelto su questa postazione.",
  },
  "Choisissez un code de 4 à 8 chiffres pour ce poste : il sera demandé pour revenir ici.":
    {
      de: "Wählen Sie für diesen Arbeitsplatz einen Code mit 4 bis 8 Ziffern: Er wird verlangt, um hierher zurückzukehren.",
      it: "Scegliere un codice di 4–8 cifre per questa postazione: sarà richiesto per tornare qui.",
    },
  "Code de la direction": {
    de: "Code der Übungsleitung",
    it: "Codice della direzione",
  },
  Code: { de: "Code", it: "Codice" },
  "Choisir ce code et ouvrir": {
    de: "Diesen Code wählen und öffnen",
    it: "Scegli questo codice e apri",
  },
  "Code oublié : choisissez-en un nouveau.": {
    de: "Code vergessen: Wählen Sie einen neuen.",
    it: "Codice dimenticato: sceglierne uno nuovo.",
  },
  "Oublier le code": { de: "Code vergessen", it: "Dimentica il codice" },
  "Ce code évite qu’un joueur ouvre le scénario par mégarde. Ce n’est pas une protection : le scénario voyage avec le journal (synchronisation, archives, traçabilité) comme tout le reste.":
    {
      de: "Dieser Code verhindert, dass ein Spieler das Szenario versehentlich öffnet. Er ist kein Schutz: Das Szenario reist wie alles andere mit dem Journal mit (Synchronisation, Archive, Nachvollziehbarkeit).",
      it: "Questo codice evita che un giocatore apra lo scenario per errore. Non è una protezione: lo scenario viaggia con il diario (sincronizzazione, archivi, tracciabilità) come tutto il resto.",
    },
  "{author} · direction d’exercice": {
    de: "{author} · Übungsleitung",
    it: "{author} · direzione d’esercizio",
  },
  "Inject envoyé : {title}": {
    de: "Einspielung gesendet: {title}",
    it: "Inject inviato: {title}",
  },
  "Inject lu : {title}": {
    de: "Einspielung vorgelesen: {title}",
    it: "Inject letto: {title}",
  },
  "Remplacer les {pending} injects pas encore joués par ceux de « {title} » ({count}) ?":
    {
      de: "Die {pending} noch nicht gespielten Einspielungen durch jene von « {title} » ({count}) ersetzen?",
      it: "Sostituire i {pending} inject non ancora giocati con quelli di « {title} » ({count})?",
    },
  "Scénario « {title} » chargé depuis {name} : {count} injects.": {
    de: "Szenario « {title} » aus {name} geladen: {count} Einspielungen.",
    it: "Scenario « {title} » caricato da {name}: {count} inject.",
  },
  "l’exemple": { de: "dem Beispiel", it: "l’esempio" },
  Scénario: { de: "Szenario", it: "Scenario" },
  "Titre et description du scénario": {
    de: "Titel und Beschreibung des Szenarios",
    it: "Titolo e descrizione dello scenario",
  },
  "Pas encore commencé": {
    de: "Noch nicht begonnen",
    it: "Non ancora iniziato",
  },
  "Terminé à {time}": { de: "Beendet um {time}", it: "Terminato alle {time}" },
  "En cours · <0>{elapsed}</0>": {
    de: "Läuft · <0>{elapsed}</0>",
    it: "In corso · <0>{elapsed}</0>",
  },
  "{played} / {total} injects joués": {
    de: "{played} / {total} Einspielungen gespielt",
    it: "{played} / {total} inject giocati",
  },
  " · prochain {at} ({time}) : {title}": {
    de: " · nächste {at} ({time}): {title}",
    it: " · prossimo {at} ({time}): {title}",
  },
  "Exercice repris.": { de: "Übung fortgesetzt.", it: "Esercizio ripreso." },
  "Exercice commencé : T0 maintenant.": {
    de: "Übung begonnen: T0 jetzt.",
    it: "Esercizio iniziato: T0 adesso.",
  },
  Reprendre: { de: "Fortsetzen", it: "Riprendi" },
  "Commencer maintenant (T0)": {
    de: "Jetzt beginnen (T0)",
    it: "Inizia adesso (T0)",
  },
  "Terminer l’exercice ? Plus aucun inject ne partira.": {
    de: "Übung beenden? Es wird keine Einspielung mehr ausgelöst.",
    it: "Terminare l’esercizio? Non partirà più alcun inject.",
  },
  "Terminer l’exercice": { de: "Übung beenden", it: "Termina l’esercizio" },
  "Scénario d’exemple « Crue de l’Arve » (fictif)": {
    de: "Beispielszenario « Arve-Hochwasser » (fiktiv)",
    it: "Scenario d’esempio « Piena dell’Arve » (fittizio)",
  },
  "Exemple « Crue de l’Arve »": {
    de: "Beispiel « Arve-Hochwasser »",
    it: "Esempio « Piena dell’Arve »",
  },
  "Masquer (mode joueur)": {
    de: "Ausblenden (Spielermodus)",
    it: "Nascondi (modalità giocatore)",
  },
  "Fichier trop grand pour un scénario (4 Mo au plus).": {
    de: "Datei zu gross für ein Szenario (höchstens 4 MB).",
    it: "File troppo grande per uno scenario (al massimo 4 MB).",
  },
  "Début de l’exercice (T0)": {
    de: "Beginn der Übung (T0)",
    it: "Inizio dell’esercizio (T0)",
  },
  "Les injects « T+ » partent à partir de cette heure (heure de Zurich).": {
    de: "Die Einspielungen « T+ » werden ab dieser Zeit ausgelöst (Zürcher Zeit).",
    it: "Gli inject « T+ » partono a partire da quest’ora (ora di Zurigo).",
  },
  "Inject à lire : {title}": {
    de: "Vorzulesende Einspielung: {title}",
    it: "Inject da leggere: {title}",
  },
  "À lire maintenant : {title}": {
    de: "Jetzt vorlesen: {title}",
    it: "Da leggere adesso: {title}",
  },
  "Réaction attendue : {expected}": {
    de: "Erwartete Reaktion: {expected}",
    it: "Reazione attesa: {expected}",
  },
  "Lu et transmis": {
    de: "Vorgelesen und übermittelt",
    it: "Letto e trasmesso",
  },
  "Ne pas jouer": { de: "Nicht spielen", it: "Non giocare" },
  "Inject non joué.": {
    de: "Einspielung nicht gespielt.",
    it: "Inject non giocato.",
  },
  Injects: { de: "Einspielungen", it: "Inject" },
  "Inject remis au programme.": {
    de: "Einspielung wieder ins Programm aufgenommen.",
    it: "Inject rimesso in programma.",
  },
  "Aucun inject. Ajoutez-en un, importez un scénario JSON ou chargez l’exemple « Crue de l’Arve ».":
    {
      de: "Keine Einspielung. Fügen Sie eine hinzu, importieren Sie ein JSON-Szenario oder laden Sie das Beispiel « Arve-Hochwasser ».",
      it: "Nessun inject. Aggiungerne uno, importare uno scenario JSON o caricare l’esempio « Piena dell’Arve ».",
    },
  "Inject enregistré.": {
    de: "Einspielung gespeichert.",
    it: "Inject salvato.",
  },
  "Supprimer l’inject « {title} » ?": {
    de: "Einspielung « {title} » löschen?",
    it: "Eliminare l’inject « {title} »?",
  },
  "Inject supprimé.": { de: "Einspielung gelöscht.", it: "Inject eliminato." },
  "Réaction notée.": { de: "Reaktion notiert.", it: "Reazione annotata." },
  "{clock} (J+{day})": { de: "{clock} (Tag +{day})", it: "{clock} (G+{day})" },
  "non joué": { de: "nicht gespielt", it: "non giocato" },
  "réaction en retard · +{delay}": {
    de: "Reaktion verspätet · +{delay}",
    it: "reazione in ritardo · +{delay}",
  },
  "sans réaction · +{delay}": {
    de: "ohne Reaktion · +{delay}",
    it: "senza reazione · +{delay}",
  },
  "réaction {minutes}": { de: "Reaktion {minutes}", it: "reazione {minutes}" },
  "joué {time}": { de: "gespielt {time}", it: "giocato {time}" },
  "après le T0": { de: "nach T0", it: "dopo il T0" },
  "à lire": { de: "vorzulesen", it: "da leggere" },
  dû: { de: "fällig", it: "dovuto" },
  "dans {minutes}": { de: "in {minutes}", it: "tra {minutes}" },
  "lu par la direction": {
    de: "von der Übungsleitung vorgelesen",
    it: "letto dalla direzione",
  },
  "délai {n} min": { de: "Frist {n} Min.", it: "termine {n} min" },
  "{n} effet": { de: "{n} Wirkung", it: "{n} effetto" },
  "{n} effets": { de: "{n} Wirkungen", it: "{n} effetti" },
  "Réaction : {how}": { de: "Reaktion: {how}", it: "Reazione: {how}" },
  "Envoyer maintenant": { de: "Jetzt senden", it: "Invia adesso" },
  Lu: { de: "Vorgelesen", it: "Letto" },
  Envoyer: { de: "Senden", it: "Invia" },
  "Noter la réaction": { de: "Reaktion notieren", it: "Annota la reazione" },
  "Remettre au programme": {
    de: "Wieder ins Programm aufnehmen",
    it: "Rimetti in programma",
  },
  "Modifier l’inject": {
    de: "Einspielung bearbeiten",
    it: "Modifica l’inject",
  },
  "Nouvel inject": { de: "Neue Einspielung", it: "Nuovo inject" },
  Moment: { de: "Zeitpunkt", it: "Momento" },
  "Minutes après le début (T+)": {
    de: "Minuten nach Beginn (T+)",
    it: "Minuti dopo l’inizio (T+)",
  },
  "Heure fixe": { de: "Feste Uhrzeit", it: "Ora fissa" },
  "T+ (minutes)": { de: "T+ (Minuten)", it: "T+ (minuti)" },
  "Heure (Zurich)": { de: "Uhrzeit (Zürich)", it: "Ora (Zurigo)" },
  "Jour de l’exercice": { de: "Übungstag", it: "Giorno dell’esercizio" },
  "0 : le jour du début": {
    de: "0: der Tag des Beginns",
    it: "0: il giorno dell’inizio",
  },
  "Émetteur (joué)": { de: "Absender (gespielt)", it: "Mittente (giocato)" },
  "Destinataire (cellule visée)": {
    de: "Empfänger (betroffene Zelle)",
    it: "Destinatario (cellula interessata)",
  },
  Canal: { de: "Kanal", it: "Canale" },
  Remise: { de: "Übermittlung", it: "Consegna" },
  "Arrive dans Messages": {
    de: "Trifft in Meldungen ein",
    it: "Arriva in Messaggi",
  },
  "Lu par la direction": {
    de: "Von der Übungsleitung vorgelesen",
    it: "Letto dalla direzione",
  },
  "Réaction attendue": { de: "Erwartete Reaktion", it: "Reazione attesa" },
  "Délai de réaction (minutes)": {
    de: "Reaktionsfrist (Minuten)",
    it: "Termine di reazione (minuti)",
  },
  "0 : sans délai": { de: "0: ohne Frist", it: "0: senza termine" },
  "Effets à l’arrivée": {
    de: "Wirkungen beim Eintreffen",
    it: "Effetti all’arrivo",
  },
  "État d’un moyen": { de: "Status eines Mittels", it: "Stato di un mezzo" },
  "Observation météo": {
    de: "Wetterbeobachtung",
    it: "Osservazione meteo",
  },
  "Renseignement clé": {
    de: "Schlüsselinformation",
    it: "Informazione chiave",
  },
  "Nouvel état": { de: "Neuer Status", it: "Nuovo stato" },
  "Lieu (facultatif)": { de: "Ort (freiwillig)", it: "Luogo (facoltativo)" },
  Conditions: { de: "Verhältnisse", it: "Condizioni" },
  Précipitations: { de: "Niederschlag", it: "Precipitazioni" },
  Vent: { de: "Wind", it: "Vento" },
  "Retirer cet effet": {
    de: "Diese Wirkung entfernen",
    it: "Rimuovi questo effetto",
  },
  "— aucun élément précis —": {
    de: "— kein bestimmtes Element —",
    it: "— nessun elemento preciso —",
  },
  "Réaction à « {title} »": {
    de: "Reaktion auf « {title} »",
    it: "Reazione a « {title} »",
  },
  "Joué à {time}. La réaction automatique (message traité, inscrit au journal ou lié) est prise si elle est plus précoce.":
    {
      de: "Gespielt um {time}. Die automatische Reaktion (Meldung bearbeitet, im Journal erfasst oder verknüpft) wird übernommen, wenn sie früher ist.",
      it: "Giocato alle {time}. La reazione automatica (messaggio trattato, registrato nel diario o collegato) è presa se è anteriore.",
    },
  "Heure de la réaction (Zurich)": {
    de: "Zeit der Reaktion (Zürich)",
    it: "Ora della reazione (Zurigo)",
  },
  "Entrée du journal liée": {
    de: "Verknüpfter Journaleintrag",
    it: "Voce del diario collegata",
  },
  "Ex. Chef d’intervention informé par radio": {
    de: "z. B. Einsatzleiter per Funk informiert",
    it: "Es. Capo intervento informato via radio",
  },
  Effacer: { de: "Löschen", it: "Cancella" },
  "entrée liée par la direction": {
    de: "Eintrag von der Übungsleitung verknüpft",
    it: "voce collegata dalla direzione",
  },
  "Description (pour la direction)": {
    de: "Beschreibung (für die Übungsleitung)",
    it: "Descrizione (per la direzione)",
  },
} satisfies Dict);
