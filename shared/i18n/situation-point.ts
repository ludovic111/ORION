import { translator, type Dict } from "./core.ts";

// Point de situation prepared from the journal (shared/situation-point.ts).
// Keys ending in "(1)" are the singular forms of a count whose French text
// keeps the "(s)" of the original wording.
export const { t, tn, tIn, dict } = translator({
  // Weather outlook
  "{min} à {max} °C": { de: "{min} bis {max} °C", it: "da {min} a {max} °C" },
  "pluie {mm} mm": { de: "Regen {mm} mm", it: "pioggia {mm} mm" },
  "rafales jusqu’à {kmh} km/h": {
    de: "Böen bis {kmh} km/h",
    it: "raffiche fino a {kmh} km/h",
  },
  "Prochaines {hours} h : {parts}.": {
    de: "Nächste {hours} h: {parts}.",
    it: "Prossime {hours} h: {parts}.",
  },
  // Sections
  "Situation générale": { de: "Allgemeine Lage", it: "Situazione generale" },
  "Renseignements clés": {
    de: "Schlüsselinformationen",
    it: "Informazioni chiave",
  },
  "{label} : {value}": { de: "{label}: {value}", it: "{label}: {value}" },
  "Depuis {time}": { de: "Seit {time}", it: "Dalle {time}" },
  "{n} entrée(s) au journal (1)": {
    fr: "{n} entrée(s) au journal",
    de: "{n} Eintrag im Journal",
    it: "{n} voce nel diario",
  },
  "{n} entrée(s) au journal": {
    de: "{n} Einträge im Journal",
    it: "{n} voci nel diario",
  },
  "{n} message(s) reçu(s) (1)": {
    fr: "{n} message(s) reçu(s)",
    de: "{n} Meldung empfangen",
    it: "{n} messaggio ricevuto",
  },
  "{n} message(s) reçu(s)": {
    de: "{n} Meldungen empfangen",
    it: "{n} messaggi ricevuti",
  },
  "Décisions :": { de: "Entscheide:", it: "Decisioni:" },
  "Moyens engagés": { de: "Eingesetzte Mittel", it: "Mezzi impiegati" },
  "{n} engagé(s) (1)": {
    fr: "{n} engagé(s)",
    de: "{n} im Einsatz",
    it: "{n} impiegato",
  },
  "{n} engagé(s)": { de: "{n} im Einsatz", it: "{n} impiegati" },
  ", dont {n} personne(s) (1)": {
    fr: ", dont {n} personne(s)",
    de: ", davon {n} Person",
    it: ", di cui {n} persona",
  },
  ", dont {n} personne(s)": {
    de: ", davon {n} Personen",
    it: ", di cui {n} persone",
  },
  "{n} alerté(s) ou en route (1)": {
    fr: "{n} alerté(s) ou en route",
    de: "{n} alarmiert oder unterwegs",
    it: "{n} allarmato o in viaggio",
  },
  "{n} alerté(s) ou en route": {
    de: "{n} alarmiert oder unterwegs",
    it: "{n} allarmati o in viaggio",
  },
  "{n} disponible(s) (1)": {
    fr: "{n} disponible(s)",
    de: "{n} verfügbar",
    it: "{n} disponibile",
  },
  "{n} disponible(s)": { de: "{n} verfügbar", it: "{n} disponibili" },
  "{n} hors service": { de: "{n} ausser Betrieb", it: "{n} fuori servizio" },
  ", arrivée {time}": { de: ", Ankunft {time}", it: ", arrivo {time}" },
  "Missions et points ouverts": {
    de: "Aufträge und offene Punkte",
    it: "Missioni e punti aperti",
  },
  "{n} ouvert(s), dont {late} en retard. (1)": {
    fr: "{n} ouvert(s), dont {late} en retard.",
    de: "{n} offen, davon {late} überfällig.",
    it: "{n} aperto, di cui {late} in ritardo.",
  },
  "{n} ouvert(s), dont {late} en retard.": {
    de: "{n} offen, davon {late} überfällig.",
    it: "{n} aperti, di cui {late} in ritardo.",
  },
  " · échéance {time}": { de: " · Frist {time}", it: " · scadenza {time}" },
  " (en retard)": { de: " (überfällig)", it: " (in ritardo)" },
  "… et {n} autre(s). (1)": {
    fr: "… et {n} autre(s).",
    de: "… und {n} weiterer.",
    it: "… e {n} altro.",
  },
  "… et {n} autre(s).": { de: "… und {n} weitere.", it: "… e altri {n}." },
  "Listes de contrôle": { de: "Checklisten", it: "Liste di controllo" },
  "{title} : {done}/{total} étapes": {
    de: "{title}: {done}/{total} Schritte",
    it: "{title}: {done}/{total} passi",
  },
  ", {n} contrôle(s) en retard (1)": {
    fr: ", {n} contrôle(s) en retard",
    de: ", {n} Kontrolle überfällig",
    it: ", {n} controllo in ritardo",
  },
  ", {n} contrôle(s) en retard": {
    de: ", {n} Kontrollen überfällig",
    it: ", {n} controlli in ritardo",
  },
  " · prochaine : {step}": {
    de: " · nächster: {step}",
    it: " · prossimo: {step}",
  },
  " · terminée": { de: " · abgeschlossen", it: " · conclusa" },
  "Aucune liste en cours.": {
    de: "Keine laufende Checkliste.",
    it: "Nessuna lista in corso.",
  },
  " · retard {duration}": {
    de: " · Verspätung {duration}",
    it: " · ritardo {duration}",
  },
  "Demandes de moyens en cours": {
    de: "Laufende Mittelanforderungen",
    it: "Richieste di mezzi in corso",
  },
  "Aucune demande en attente.": {
    de: "Keine offene Anforderung.",
    it: "Nessuna richiesta in attesa.",
  },
  Météo: { de: "Wetter", it: "Meteo" },
  "{outlook} (prévision {model}, reçue à {time})": {
    de: "{outlook} (Prognose {model}, erhalten um {time})",
    it: "{outlook} (previsione {model}, ricevuta alle {time})",
  },
  "Aucune prévision reçue.": {
    de: "Keine Prognose erhalten.",
    it: "Nessuna previsione ricevuta.",
  },
  "Alertes en vigueur ou à venir :": {
    de: "Geltende oder bevorstehende Warnungen:",
    it: "Allerte in vigore o imminenti:",
  },
  "{hazard} · degré {level}": {
    de: "{hazard} · Stufe {level}",
    it: "{hazard} · grado {level}",
  },
  "Aucune alerte en vigueur.": {
    de: "Keine Warnung in Kraft.",
    it: "Nessuna allerta in vigore.",
  },
  "{n} nouvelle(s) alerte(s) depuis {time}. (1)": {
    fr: "{n} nouvelle(s) alerte(s) depuis {time}.",
    de: "{n} neue Warnung seit {time}.",
    it: "{n} nuova allerta dalle {time}.",
  },
  "{n} nouvelle(s) alerte(s) depuis {time}.": {
    de: "{n} neue Warnungen seit {time}.",
    it: "{n} nuove allerte dalle {time}.",
  },
  Personnel: { de: "Personal", it: "Personale" },
  "{n} personne(s) présente(s) au PC. (1)": {
    fr: "{n} personne(s) présente(s) au PC.",
    de: "{n} Person im KP anwesend.",
    it: "{n} persona presente al PC.",
  },
  "{n} personne(s) présente(s) au PC.": {
    de: "{n} Personen im KP anwesend.",
    it: "{n} persone presenti al PC.",
  },
  "{n} personne(s) présente(s). (1)": {
    fr: "{n} personne(s) présente(s).",
    de: "{n} Person anwesend.",
    it: "{n} persona presente.",
  },
  "{n} personne(s) présente(s).": {
    de: "{n} Personen anwesend.",
    it: "{n} persone presenti.",
  },
  "{name} : {text}": { de: "{name}: {text}", it: "{name}: {text}" },
  "À relever :": { de: "Abzulösen:", it: "Da avvicendare:" },
  "Besoins et décisions à prendre": {
    de: "Bedürfnisse und zu treffende Entscheide",
    it: "Bisogni e decisioni da prendere",
  },
  "Prochain point": { de: "Nächster Rapport", it: "Prossimo punto" },
  "{title} à {time}": { de: "{title} um {time}", it: "{title} alle {time}" },
  "Point de situation de {time}": {
    de: "Lagerapport von {time}",
    it: "Punto della situazione delle {time}",
  },
} satisfies Dict);
