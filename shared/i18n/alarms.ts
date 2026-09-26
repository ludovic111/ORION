import { translator, type Dict } from "./core.ts";

// Alarms and notifications of a post (shared/alarms.ts).
export const { t, tn, tIn, dict } = translator({
  "Message urgent reçu": {
    de: "Dringende Meldung eingegangen",
    it: "Messaggio urgente ricevuto",
  },
  "Échéance dépassée (journal, mes tâches)": {
    de: "Frist überschritten (Journal, meine Aufgaben)",
    it: "Scadenza superata (diario, i miei compiti)",
  },
  "Rapport ou rendez-vous qui approche": {
    de: "Bevorstehender Rapport oder Termin",
    it: "Rapporto o appuntamento imminente",
  },
  "Nouvelle tâche pour ma fonction": {
    de: "Neue Aufgabe für meine Funktion",
    it: "Nuovo compito per la mia funzione",
  },
  "Diffusion à quittancer": {
    de: "Zu quittierende Verteilung",
    it: "Diffusione da quittanzare",
  },
  "Mes diffusions sans accusé de lecture": {
    de: "Meine Verteilungen ohne Lesebestätigung",
    it: "Le mie diffusioni senza conferma di lettura",
  },
  "Message urgent": { de: "Dringende Meldung", it: "Messaggio urgente" },
  "De {from}": { de: "Von {from}", it: "Da {from}" },
  "Échéance dépassée : {label}": {
    de: "Frist überschritten: {label}",
    it: "Scadenza superata: {label}",
  },
  "Échéance dépassée": { de: "Frist überschritten", it: "Scadenza superata" },
  "Dans {n} min : {title}": {
    de: "In {n} Min.: {title}",
    it: "Tra {n} min: {title}",
  },
  "Maintenant : {title}": { de: "Jetzt: {title}", it: "Adesso: {title}" },
  "Pour vous ({assignee}) : {label}": {
    de: "Für Sie ({assignee}): {label}",
    it: "Per voi ({assignee}): {label}",
  },
  "Nouvelle tâche pour vous": {
    de: "Neue Aufgabe für Sie",
    it: "Nuovo compito per voi",
  },
  Diffusion: { de: "Verteilung", it: "Diffusione" },
  "{kind} : {title}": { de: "{kind}: {title}", it: "{kind}: {title}" },
  "Pour {recipients}": { de: "Für {recipients}", it: "Per {recipients}" },
  "de {sender}": { de: "von {sender}", it: "da {sender}" },
  " · répondre « {ack} »": {
    de: " · mit «{ack}» antworten",
    it: " · rispondere «{ack}»",
  },
  "Sans accusé de lecture : {title}": {
    de: "Ohne Lesebestätigung: {title}",
    it: "Senza conferma di lettura: {title}",
  },
  "Après {n} min, un destinataire n’a pas répondu.": {
    de: "Nach {n} Min. hat ein Empfänger nicht geantwortet.",
    it: "Dopo {n} min, un destinatario non ha risposto.",
  },
} satisfies Dict);
