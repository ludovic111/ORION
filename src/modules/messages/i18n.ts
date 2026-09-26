import { getLang, translator, type Dict } from "../../../shared/i18n/core.ts";
import { common } from "../../../shared/i18n/common.ts";
import { enumLabel } from "../../../shared/i18n/enums.ts";

// Messages module: intake form, board, list, sheet and synthesis.
export const { t, tn, tIn, dict } = translator({
  ...common,
  // Hints of the states (model.ts)
  "Reçus, pas encore lus": {
    de: "Empfangen, noch nicht gelesen",
    it: "Ricevuti, non ancora letti",
  },
  "Synthèse en cours": { de: "Synthese läuft", it: "Sintesi in corso" },
  "Inscrits au journal": {
    de: "Im Journal erfasst",
    it: "Registrati nel diario",
  },
  "Sans suite au journal": {
    de: "Ohne Folge im Journal",
    it: "Senza seguito nel diario",
  },
  // Generated journal text (stored in the language of the post)
  "Message {label}": { de: "Meldung {label}", it: "Messaggio {label}" },
  // Message templates: button labels and categories
  "Compte rendu": { de: "Bericht", it: "Rapporto" },
  "Demande de moyens": { de: "Mittelanforderung", it: "Richiesta di mezzi" },
  Alerte: { de: "Alarm", it: "Allarme" },
  Information: { de: "Information", it: "Comunicazione" },
  Demande: { de: "Anfrage", it: "Richiesta" },
  // Message templates: text inserted in the message
  "Compte rendu.\nSituation : \nMesures prises : \nMoyens engagés : \nBesoins : ":
    {
      de: "Bericht.\nLage: \nGetroffene Massnahmen: \nEingesetzte Mittel: \nBedarf: ",
      it: "Rapporto.\nSituazione: \nMisure adottate: \nMezzi impiegati: \nNecessità: ",
    },
  "Demande de moyens.\nMoyens : \nQuantité : \nLieu de livraison : \nDélai : \nMotif : ":
    {
      de: "Mittelanforderung.\nMittel: \nMenge: \nLieferort: \nFrist: \nGrund: ",
      it: "Richiesta di mezzi.\nMezzi: \nQuantità: \nLuogo di consegna: \nTermine: \nMotivo: ",
    },
  "Alerte.\nQuoi : \nOù : \nPersonnes concernées : \nMesures immédiates : ": {
    de: "Alarm.\nWas: \nWo: \nBetroffene Personen: \nSofortmassnahmen: ",
    it: "Allarme.\nCosa: \nDove: \nPersone coinvolte: \nMisure immediate: ",
  },
  "Information : ": { de: "Information: ", it: "Comunicazione: " },
  "Quittance : \nSuite du message : ": {
    de: "Quittung: \nZu Meldung: ",
    it: "Quittanza: \nSeguito al messaggio: ",
  },
  // Countdown of a reply
  "Réponse dans {time}": { de: "Antwort in {time}", it: "Risposta tra {time}" },
  "Réponse en retard de {time}": {
    de: "Antwort seit {time} überfällig",
    it: "Risposta in ritardo di {time}",
  },
  "dans {time}": { de: "in {time}", it: "tra {time}" },
  "en retard de {time}": {
    de: "seit {time} überfällig",
    it: "in ritardo di {time}",
  },
  "Réponse attendue avant {time}": {
    de: "Antwort erwartet bis {time}",
    it: "Risposta attesa entro {time}",
  },
  // Toasts (actions.ts)
  "{label} : {status}.": { de: "{label}: {status}.", it: "{label}: {status}." },
  "{label} pris en charge.": {
    de: "{label} übernommen.",
    it: "{label} preso in carico.",
  },
  "{label} classé.": { de: "{label} abgelegt.", it: "{label} archiviato." },
  "{label} rouvert.": {
    de: "{label} wieder geöffnet.",
    it: "{label} riaperto.",
  },
  "Inscrit au journal : #{n}": {
    de: "Im Journal erfasst: #{n}",
    it: "Registrato nel diario: #{n}",
  },
  "Formules de message": { de: "Meldeformulare", it: "Moduli di messaggio" },
  "Formule de message": { de: "Meldeformular", it: "Modulo di messaggio" },
  "messages (fichier)": { fr: "messages", de: "meldungen", it: "messaggi" },
  "message (fichier)": { fr: "message", de: "meldung", it: "messaggio" },
  "message-{label}": { de: "meldung-{label}", it: "messaggio-{label}" },
  // Intake form (Capture.tsx)
  "Écrivez au moins l’objet ou le texte du message.": {
    de: "Geben Sie mindestens den Betreff oder den Text der Meldung ein.",
    it: "Scrivere almeno l’oggetto o il testo del messaggio.",
  },
  "Message {label} reçu.": {
    de: "Meldung {label} empfangen.",
    it: "Messaggio {label} ricevuto.",
  },
  "Message {label} reçu · impression lancée.": {
    de: "Meldung {label} empfangen · Druck gestartet.",
    it: "Messaggio {label} ricevuto · stampa avviata.",
  },
  "Nouveau message": { de: "Neue Meldung", it: "Nuovo messaggio" },
  "Heure de réception : fixée au début de la saisie, modifiable dans « Plus de détails »":
    {
      de: "Empfangszeit: beim Beginn der Eingabe festgelegt, änderbar unter « Weitere Details »",
      it: "Ora di ricezione: fissata all’inizio dell’inserimento, modificabile in « Altri dettagli »",
    },
  "Reçu {time}": { de: "Empfangen {time}", it: "Ricevuto {time}" },
  "Heure automatique": { de: "Automatische Zeit", it: "Ora automatica" },
  "Modèles de message": { de: "Meldungsvorlagen", it: "Modelli di messaggio" },
  Modèle: { de: "Vorlage", it: "Modello" },
  De: { de: "Von", it: "Da" },
  "Émetteur, nom d’appel…": {
    de: "Absender, Rufname …",
    it: "Mittente, nominativo…",
  },
  À: { de: "An", it: "A" },
  Canal: { de: "Kanal", it: "Canale" },
  "En quelques mots": { de: "In wenigen Worten", it: "In poche parole" },
  "Texte tel que reçu": { de: "Text wie empfangen", it: "Testo come ricevuto" },
  "Dicter le message": { de: "Meldung diktieren", it: "Dettare il messaggio" },
  "Adresse, secteur, lieu-dit": {
    de: "Adresse, Sektor, Flurname",
    it: "Indirizzo, settore, località",
  },
  "Réponse attendue": { de: "Antwort erwartet", it: "Risposta attesa" },
  "Délai de réponse": { de: "Antwortfrist", it: "Termine di risposta" },
  "Plus de détails": { de: "Weitere Details", it: "Altri dettagli" },
  "Reçu le": { de: "Empfangen am", it: "Ricevuto il" },
  "Vide : heure du début de la saisie.": {
    de: "Leer: Zeit des Eingabebeginns.",
    it: "Vuoto: ora d’inizio dell’inserimento.",
  },
  "ex. 2 600 000 / 1 200 000": {
    de: "z. B. 2 600 000 / 1 200 000",
    it: "es. 2 600 000 / 1 200 000",
  },
  "Impression automatique": {
    de: "Automatischer Druck",
    it: "Stampa automatica",
  },
  "Enregistrer le message": {
    de: "Meldung speichern",
    it: "Salva il messaggio",
  },
  "Journal clôturé : lecture seule.": {
    de: "Abgeschlossenes Journal: nur lesen.",
    it: "Diario chiuso: sola lettura.",
  },
  // Module (Messages.tsx)
  "Une fiche A4 par message affiché": {
    de: "Ein A4-Blatt pro angezeigte Meldung",
    it: "Una scheda A4 per messaggio visualizzato",
  },
  "Fiches A4": { de: "A4-Blätter", it: "Schede A4" },
  "Fiche A4": { de: "A4-Blatt", it: "Scheda A4" },
  "Messages par état": {
    de: "Meldungen nach Status",
    it: "Messaggi per stato",
  },
  "Réponses en retard": {
    de: "Überfällige Antworten",
    it: "Risposte in ritardo",
  },
  "Échéance dépassée": { de: "Frist überschritten", it: "Scadenza superata" },
  "Messages reçus": { de: "Empfangene Meldungen", it: "Messaggi ricevuti" },
  "Aucun message pour l’instant": {
    de: "Noch keine Meldungen",
    it: "Ancora nessun messaggio",
  },
  "Saisir le premier message": {
    de: "Erste Meldung erfassen",
    it: "Inserire il primo messaggio",
  },
  "Chaque message reçu (radio, téléphone, messager…) est d’abord saisi ici en quelques secondes. Une autre personne le relit et l’inscrit au journal.":
    {
      de: "Jede empfangene Meldung (Funk, Telefon, Melder …) wird zuerst hier in wenigen Sekunden erfasst. Eine andere Person liest sie gegen und erfasst sie im Journal.",
      it: "Ogni messaggio ricevuto (radio, telefono, staffetta…) viene dapprima inserito qui in pochi secondi. Un’altra persona lo rilegge e lo registra nel diario.",
    },
  Déroulement: { de: "Ablauf", it: "Svolgimento" },
  Réception: { de: "Empfang", it: "Ricezione" },
  "Saisie rapide : de, à, canal, texte": {
    de: "Schnellerfassung: von, an, Kanal, Text",
    it: "Inserimento rapido: da, a, canale, testo",
  },
  Synthèse: { de: "Synthese", it: "Sintesi" },
  "Relecture, mise en forme, priorité": {
    de: "Gegenlesen, Aufbereitung, Priorität",
    it: "Rilettura, formattazione, priorità",
  },
  "Entrée numérotée, reliée au message": {
    de: "Nummerierter Eintrag, mit der Meldung verknüpft",
    it: "Voce numerata, collegata al messaggio",
  },
  "Rechercher (M012, émetteur, texte…)": {
    de: "Suchen (M012, Absender, Text …)",
    it: "Cerca (M012, mittente, testo…)",
  },
  "Rechercher un message": { de: "Meldung suchen", it: "Cerca un messaggio" },
  "Toutes priorités": { de: "Alle Prioritäten", it: "Tutte le priorità" },
  "Tous destinataires": { de: "Alle Empfänger", it: "Tutti i destinatari" },
  "Non traités": { de: "Unbearbeitet", it: "Non trattati" },
  Affichage: { de: "Ansicht", it: "Visualizzazione" },
  Tableau: { de: "Tafel", it: "Tabellone" },
  Liste: { de: "Liste", it: "Elenco" },
  "{n} message sur {total}": {
    de: "{n} Meldung von {total}",
    it: "{n} messaggio su {total}",
  },
  "{n} messages sur {total}": {
    de: "{n} Meldungen von {total}",
    it: "{n} messaggi su {total}",
  },
  "Tout afficher": { de: "Alle anzeigen", it: "Mostra tutto" },
  "Afficher les {n} autres": {
    de: "Die übrigen {n} anzeigen",
    it: "Mostra gli altri {n}",
  },
  "Aucun message": { de: "Keine Meldung", it: "Nessun messaggio" },
  "Glisser un message ici": {
    de: "Meldung hierher ziehen",
    it: "Trascinare un messaggio qui",
  },
  "De → À": { de: "Von → An", it: "Da → A" },
  Suite: { de: "Folge", it: "Seguito" },
  Actions: { de: "Aktionen", it: "Azioni" },
  "Afficher {more} de plus · {n} restant": {
    de: "{more} weitere anzeigen · {n} übrig",
    it: "Mostra altri {more} · {n} rimanente",
  },
  "Afficher {more} de plus · {n} restants": {
    de: "{more} weitere anzeigen · {n} übrig",
    it: "Mostra altri {more} · {n} rimanenti",
  },
  "Aucun message ne correspond aux filtres.": {
    de: "Keine Meldung entspricht den Filtern.",
    it: "Nessun messaggio corrisponde ai filtri.",
  },
  // Card and buttons (MessageCard.tsx)
  "Prendre en charge": { de: "Übernehmen", it: "Prendere in carico" },
  "Inscrire tel quel au journal, sans relecture": {
    de: "Unverändert im Journal erfassen, ohne Gegenlesen",
    it: "Registrare così com’è nel diario, senza rilettura",
  },
  "Inscrire tel quel (sans relecture)": {
    de: "Unverändert erfassen (ohne Gegenlesen)",
    it: "Registrare così com’è (senza rilettura)",
  },
  Rouvrir: { de: "Wieder öffnen", it: "Riaprire" },
  "Autres actions": { de: "Weitere Aktionen", it: "Altre azioni" },
  Classer: { de: "Ablegen", it: "Archiviare" },
  "sans inscription au journal": {
    de: "ohne Erfassung im Journal",
    it: "senza registrazione nel diario",
  },
  "Voir la fiche": { de: "Blatt anzeigen", it: "Vedere la scheda" },
  "Modifier ou supprimer": {
    de: "Bearbeiten oder löschen",
    it: "Modificare o eliminare",
  },
  "Traité par": { de: "Bearbeitet von", it: "Trattato da" },
  // Sheet (MessageSheet.tsx)
  "Échéance de la réponse": {
    de: "Antwortfrist",
    it: "Scadenza della risposta",
  },
  Traitement: { de: "Bearbeitung", it: "Trattamento" },
  "un message": { de: "eine Meldung", it: "un messaggio" },
  "Écrivez au moins l’objet ou le texte.": {
    de: "Geben Sie mindestens den Betreff oder den Text ein.",
    it: "Scrivere almeno l’oggetto o il testo.",
  },
  "au journal": { de: "im Journal", it: "nel diario" },
  // Synthesis (Synthesis.tsx)
  "Le texte de l’entrée est obligatoire.": {
    de: "Der Text des Eintrags ist obligatorisch.",
    it: "Il testo della voce è obbligatorio.",
  },
  "Inscrire au journal · {label}": {
    de: "Im Journal erfassen · {label}",
    it: "Registra nel diario · {label}",
  },
  "Message reçu": { de: "Empfangene Meldung", it: "Messaggio ricevuto" },
  "canal inconnu": { de: "Kanal unbekannt", it: "canale sconosciuto" },
  "Lieu : {value}": { de: "Ort: {value}", it: "Luogo: {value}" },
  "Remarques : {value}": { de: "Bemerkungen: {value}", it: "Note: {value}" },
  Nature: { de: "Art", it: "Natura" },
  "Texte de l’entrée": { de: "Text des Eintrags", it: "Testo della voce" },
  "Heure de l’événement": {
    de: "Zeitpunkt des Ereignisses",
    it: "Ora dell’evento",
  },
  "Heure de réception": { de: "Empfangszeit", it: "Ora di ricezione" },
  "Mesure / décision": {
    de: "Massnahme / Entscheid",
    it: "Misura / decisione",
  },
  "Ce qui est décidé ou entrepris (facultatif)": {
    de: "Was entschieden oder unternommen wird (optional)",
    it: "Ciò che viene deciso o intrapreso (facoltativo)",
  },
  Suivi: { de: "Nachverfolgung", it: "Seguito" },
} satisfies Dict);

/**
 * A fixed value in the running text of a sentence ("M012 : en traitement."):
 * lower case in French and Italian, as is in German (nouns keep their
 * capital).
 */
export function lowerLabel(value: string): string {
  const label = enumLabel(value);
  return getLang() === "de" ? label : label.toLowerCase();
}
