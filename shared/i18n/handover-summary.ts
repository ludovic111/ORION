import { translator, type Dict } from "./core.ts";

// Summary of a handover (shared/handover-summary.ts). Keys ending in "(1)"
// are the singular forms of a count whose French text keeps the "(s)" of
// the original wording.
export const { t, tn, tIn, dict } = translator({
  Moyen: { de: "Mittel", it: "Mezzo" },
  "{name} : ajouté ({status})": {
    de: "{name}: hinzugefügt ({status})",
    it: "{name}: aggiunto ({status})",
  },
  "{name} : retiré": { de: "{name}: entfernt", it: "{name}: rimosso" },
  "{name} : {before} → {after}": {
    de: "{name}: {before} → {after}",
    it: "{name}: {before} → {after}",
  },
  Demande: { de: "Anforderung", it: "Richiesta" },
  "{label} : {status}": { de: "{label}: {status}", it: "{label}: {status}" },
  Liste: { de: "Checkliste", it: "Lista" },
  étape: { de: "Schritt", it: "passo" },
  "{list} : {step} ({who})": {
    de: "{list}: {step} ({who})",
    it: "{list}: {step} ({who})",
  },
  Alerte: { de: "Warnung", it: "Allerta" },
  "{hazard} · degré {level}": {
    de: "{hazard} · Stufe {level}",
    it: "{hazard} · grado {level}",
  },
  " · échéance {time}": { de: " · Frist {time}", it: " · scadenza {time}" },
  // Parts
  Décisions: { de: "Entscheide", it: "Decisioni" },
  "Missions ouvertes": { de: "Eröffnete Aufträge", it: "Missioni aperte" },
  "Missions closes": { de: "Abgeschlossene Aufträge", it: "Missioni chiuse" },
  Moyens: { de: "Mittel", it: "Mezzi" },
  "Demandes de moyens": {
    de: "Mittelanforderungen",
    it: "Richieste di mezzi",
  },
  "Listes de contrôle": { de: "Checklisten", it: "Liste di controllo" },
  "Alertes météo": { de: "Wetterwarnungen", it: "Allerte meteo" },
  "En retard": { de: "Überfällig", it: "In ritardo" },
  "Points ouverts": { de: "Offene Punkte", it: "Punti aperti" },
  // Headline
  "{n} entrée(s) (1)": {
    fr: "{n} entrée(s)",
    de: "{n} Eintrag",
    it: "{n} voce",
  },
  "{n} entrée(s)": { de: "{n} Einträge", it: "{n} voci" },
  "{n} message(s) reçu(s) (1)": {
    fr: "{n} message(s) reçu(s)",
    de: "{n} Meldung empfangen",
    it: "{n} messaggio ricevuto",
  },
  "{n} message(s) reçu(s)": {
    de: "{n} Meldungen empfangen",
    it: "{n} messaggi ricevuti",
  },
  "{n} traité(s) (1)": {
    fr: "{n} traité(s)",
    de: "{n} bearbeitet",
    it: "{n} trattato",
  },
  "{n} traité(s)": { de: "{n} bearbeitet", it: "{n} trattati" },
  "{n} en attente": { de: "{n} ausstehend", it: "{n} in attesa" },
  // Text and print
  "Depuis {since} (jusqu’à {at}) : {headline}": {
    de: "Seit {since} (bis {at}): {headline}",
    it: "Dalle {since} (fino alle {at}): {headline}",
  },
  "{title} :": { de: "{title}:", it: "{title}:" },
  "Depuis {time}": { de: "Seit {time}", it: "Dalle {time}" },
  "Type d’entrée": { de: "Eintragstyp", it: "Tipo di voce" },
  Nombre: { de: "Anzahl", it: "Numero" },
  Heure: { de: "Zeit", it: "Ora" },
  Détail: { de: "Detail", it: "Dettaglio" },
  "{n} élément(s) (1)": {
    fr: "{n} élément(s)",
    de: "{n} Element",
    it: "{n} elemento",
  },
  "{n} élément(s)": { de: "{n} Elemente", it: "{n} elementi" },
} satisfies Dict);
