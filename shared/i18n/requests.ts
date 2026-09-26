import { translator, type Dict } from "./core.ts";

// Requests for resources (shared/requests.ts): buttons, journal entries
// written in the language of the post, errors shown to the operator.
export const { t, tn, tIn, dict } = translator({
  // Buttons moving a request (MOVE_LABEL)
  Redemander: { de: "Erneut anfordern", it: "Richiedere di nuovo" },
  Accordée: { de: "Bewilligt", it: "Accordata" },
  Refusée: { de: "Abgelehnt", it: "Rifiutata" },
  "En route": { de: "Unterwegs", it: "In viaggio" },
  Arrivée: { de: "Eingetroffen", it: "Arrivata" },
  Libérer: { de: "Entlassen", it: "Liberare" },
  Annuler: { de: "Annullieren", it: "Annullare" },
  // Journal entries
  "Demande de moyens : {label}": {
    de: "Mittelanforderung: {label}",
    it: "Richiesta di mezzi: {label}",
  },
  "Demandé à : {provider}": {
    de: "Angefordert bei: {provider}",
    it: "Richiesto a: {provider}",
  },
  "Lieu : {place}": { de: "Ort: {place}", it: "Luogo: {place}" },
  "Motif : {reason}": { de: "Grund: {reason}", it: "Motivo: {reason}" },
  "Demande de moyens {label} : {status}.": {
    de: "Mittelanforderung {label}: {status}.",
    it: "Richiesta di mezzi {label}: {status}.",
  },
  "Demande de moyens {label} : {status}, arrivée prévue à {time}.": {
    de: "Mittelanforderung {label}: {status}, voraussichtliche Ankunft um {time}.",
    it: "Richiesta di mezzi {label}: {status}, arrivo previsto alle {time}.",
  },
  "Suite de {n}": { de: "Folge von {n}", it: "Seguito di {n}" },
  "Demande de moyens : {status}": {
    de: "Mittelanforderung: {status}",
    it: "Richiesta di mezzi: {status}",
  },
  "Arrivée prévue modifiée": {
    de: "Voraussichtliche Ankunft geändert",
    it: "Arrivo previsto modificato",
  },
  "Arrivé le {date} sur demande de moyens.": {
    de: "Eingetroffen am {date} auf Mittelanforderung.",
    it: "Arrivato il {date} su richiesta di mezzi.",
  },
  // Errors
  "Demande introuvable.": {
    de: "Anforderung nicht gefunden.",
    it: "Richiesta non trovata.",
  },
  "Une demande « {from} » ne peut pas passer à « {to} ».": {
    de: "Eine Anforderung «{from}» kann nicht zu «{to}» wechseln.",
    it: "Una richiesta «{from}» non può passare a «{to}».",
  },
  "Moyen introuvable.": {
    de: "Mittel nicht gefunden.",
    it: "Mezzo non trovato.",
  },
} satisfies Dict);
