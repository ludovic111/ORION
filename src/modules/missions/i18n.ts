import { translator, type Dict } from "../../../shared/i18n/core.ts";
import { common } from "../../../shared/i18n/common.ts";

// Missions et suivi (Missions.tsx).
export const { t, tn, tIn, dict } = translator({
  ...common,
  "Inscrit, sans suivi": {
    de: "Erfasst, ohne Verfolgung",
    it: "Registrato, senza seguito",
  },
  "Pas encore commencé": {
    de: "Noch nicht begonnen",
    it: "Non ancora iniziato",
  },
  "Quelqu’un s’en occupe": {
    de: "Jemand kümmert sich darum",
    it: "Qualcuno se ne occupa",
  },
  "Fait et quittancé": {
    de: "Erledigt und quittiert",
    it: "Fatto e quittanzato",
  },
  "Abandonné ou sans objet": {
    de: "Aufgegeben oder gegenstandslos",
    it: "Abbandonato o senza oggetto",
  },
  Tout: { de: "Alles", it: "Tutto" },
  Demandes: { de: "Anfragen", it: "Richieste" },
  Décisions: { de: "Entscheide", it: "Decisioni" },
  Autres: { de: "Andere", it: "Altri" },
  "{n} min": { de: "{n} Min.", it: "{n} min" },
  "{n} j": { de: "{n} T.", it: "{n} g" },
  "échéance {time}": { de: "Frist {time}", it: "scadenza {time}" },
  "dépassée de {span}": {
    de: "überschritten um {span}",
    it: "superata di {span}",
  },
  "dans {span} · {time}": {
    de: "in {span} · {time}",
    it: "tra {span} · {time}",
  },
  "Sans responsable": { de: "Ohne Verantwortlichen", it: "Senza responsabile" },
  "Suivi : {status}": { de: "Verfolgung: {status}", it: "Seguito: {status}" },
  "{entry} : {status}.": { de: "{entry}: {status}.", it: "{entry}: {status}." },
  "Échéance reportée de {n} min": {
    de: "Frist um {n} Min. verschoben",
    it: "Scadenza rinviata di {n} min",
  },
  "{entry} : échéance reportée de {n} min.": {
    de: "{entry}: Frist um {n} Min. verschoben.",
    it: "{entry}: scadenza rinviata di {n} min.",
  },
  "Suite de {entry}": { de: "Folge von {entry}", it: "Seguito di {entry}" },
  "Nouvelle demande": { de: "Neue Anfrage", it: "Nuova richiesta" },
  "Nouvelle mission": { de: "Neuer Auftrag", it: "Nuova missione" },
  "Suivi en chiffres": {
    de: "Pendenzen in Zahlen",
    it: "Seguito in cifre",
  },
  "Prochaine échéance {when}": {
    de: "Nächste Frist {when}",
    it: "Prossima scadenza {when}",
  },
  "Aucune échéance à venir": {
    de: "Keine anstehende Frist",
    it: "Nessuna scadenza imminente",
  },
  "Aucun point à suivre": {
    de: "Keine offenen Pendenzen",
    it: "Nessun punto da seguire",
  },
  "Voir les entrées sans suivi": {
    de: "Einträge ohne Verfolgung anzeigen",
    it: "Vedere le voci senza seguito",
  },
  "Chaque entrée du journal dont l’état est « À traiter », « En cours », « Terminé » ou « Annulé » apparaît ici comme une carte. Glissez une carte d’une colonne à l’autre pour changer son état : le journal garde la trace de chaque changement.":
    {
      de: "Jeder Journaleintrag mit dem Status « Zu bearbeiten », « In Bearbeitung », « Erledigt » oder « Annulliert » erscheint hier als Karte. Ziehen Sie eine Karte in eine andere Spalte, um ihren Status zu ändern: Das Journal hält jede Änderung fest.",
      it: "Ogni voce del diario il cui stato è « Da trattare », « In corso », « Concluso » o « Annullato » compare qui come una scheda. Trascinate una scheda da una colonna all’altra per cambiarne lo stato: il diario tiene traccia di ogni cambiamento.",
    },
  "Tous les responsables": {
    de: "Alle Verantwortlichen",
    it: "Tutti i responsabili",
  },
  "Chercher…": { de: "Suchen …", it: "Cerca…" },
  "Chercher une mission": { de: "Auftrag suchen", it: "Cerca una missione" },
  "Seulement en retard": { de: "Nur überfällige", it: "Solo in ritardo" },
  "Par responsable": { de: "Nach Verantwortlichem", it: "Per responsabile" },
  "Inclure les entrées sans suivi": {
    de: "Einträge ohne Verfolgung einbeziehen",
    it: "Includere le voci senza seguito",
  },
  "Afficher {n} de plus": {
    de: "{n} weitere anzeigen",
    it: "Mostra altri {n}",
  },
  "Déposez la carte ici": {
    de: "Karte hier ablegen",
    it: "Depositate la scheda qui",
  },
  "Aucune carte ne correspond aux filtres choisis.": {
    de: "Keine Karte entspricht den gewählten Filtern.",
    it: "Nessuna scheda corrisponde ai filtri scelti.",
  },
  "{n} lien(s)": { de: "{n} Verknüpfung(en)", it: "{n} collegamento/i" },
  "Changer l’état de {entry}": {
    de: "Status von {entry} ändern",
    it: "Cambia lo stato di {entry}",
  },
  "Changer l’état": { de: "Status ändern", it: "Cambia lo stato" },
  Mesure: { de: "Massnahme", it: "Misura" },
  "Reporter l’échéance de 15 minutes": {
    de: "Frist um 15 Minuten verschieben",
    it: "Rinviare la scadenza di 15 minuti",
  },
  "+{n} min": { de: "+{n} Min.", it: "+{n} min" },
  "Consigner une suite au journal": {
    de: "Folgeeintrag im Journal erfassen",
    it: "Registrare un seguito nel diario",
  },
  "Consigner une suite": { de: "Folge erfassen", it: "Registra un seguito" },
  "Déplacer vers": { de: "Verschieben nach", it: "Sposta in" },
  "Ouvrir la fiche": { de: "Eintrag öffnen", it: "Apri la scheda" },
} satisfies Dict);
