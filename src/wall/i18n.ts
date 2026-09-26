import { translator, type Dict } from "../../shared/i18n/core.ts";
import { common } from "../../shared/i18n/common.ts";

// Wall screen (affichage mural): read-only big screen of the command post.
export const { t, tn, tIn, dict } = translator({
  ...common,
  "en cours": { de: "läuft", it: "in corso" },
  maintenant: { de: "jetzt", it: "adesso" },
  "dans {n} min": { de: "in {n} Min.", it: "tra {n} min" },
  "dans {h} h {m}": { de: "in {h} Std. {m}", it: "tra {h} h {m}" },
  "Écran mural": { de: "Wandanzeige", it: "Schermo murale" },
  "En direct": { de: "Live", it: "In diretta" },
  EXERCICE: { de: "ÜBUNG", it: "ESERCIZIO" },
  "Carte de situation": { de: "Lagekarte", it: "Carta della situazione" },
  "Carte indisponible (hors ligne ?)": {
    de: "Karte nicht verfügbar (offline?)",
    it: "Carta non disponibile (offline?)",
  },
  "Carte en préparation…": {
    de: "Karte wird vorbereitet …",
    it: "Carta in preparazione…",
  },
  "Aucun objet sur la carte": {
    de: "Keine Objekte auf der Karte",
    it: "Nessun oggetto sulla carta",
  },
  "Prochain rapport": { de: "Nächster Rapport", it: "Prossimo rapporto" },
  "Aucun rendez-vous prévu": {
    de: "Kein Termin geplant",
    it: "Nessun appuntamento previsto",
  },
  "points ouverts": { de: "offene Punkte", it: "punti aperti" },
  "en retard": { de: "überfällig", it: "in ritardo" },
  "moyens engagés": { de: "Mittel im Einsatz", it: "mezzi impiegati" },
  "messages non lus": { de: "ungelesene Meldungen", it: "messaggi non letti" },
  "Points ouverts": { de: "Offene Punkte", it: "Punti aperti" },
  " · retard": { de: " · überfällig", it: " · in ritardo" },
  "Aucun point ouvert": {
    de: "Keine offenen Punkte",
    it: "Nessun punto aperto",
  },
  "Renseignements clés": {
    de: "Schlüsselinformationen",
    it: "Informazioni chiave",
  },
  "Alerte {hazard} · degré {level}": {
    de: "Warnung {hazard} · Stufe {level}",
    it: "Allerta {hazard} · grado {level}",
  },
  "Moyens engagés": { de: "Mittel im Einsatz", it: "Mezzi impiegati" },
  "Aucun moyen engagé": {
    de: "Keine Mittel im Einsatz",
    it: "Nessun mezzo impiegato",
  },
  "Dernières entrées": { de: "Letzte Einträge", it: "Ultime voci" },
  "Journal vide": { de: "Journal leer", it: "Diario vuoto" },
  "Plein écran (F)": { de: "Vollbild (F)", it: "Schermo intero (F)" },
  "Plein écran": { de: "Vollbild", it: "Schermo intero" },
  "Quitter (Échap)": { de: "Verlassen (Esc)", it: "Esci (Esc)" },
  Quitter: { de: "Verlassen", it: "Esci" },
} satisfies Dict);
