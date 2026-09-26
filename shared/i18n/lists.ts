import { translator, type Dict } from "./core.ts";

// Names of the référentiels (DEFAULT_LISTS of shared/ops.ts and
// CONDUCT_LISTS of shared/conduct.ts), shown in Réglages → Référentiels.
export const { t, dict } = translator({
  "Destinataires et émetteurs standards": {
    de: "Standard-Empfänger und -Absender",
    it: "Destinatari e mittenti standard",
  },
  "Catégories de message": {
    de: "Meldungskategorien",
    it: "Categorie di messaggio",
  },
  "Canaux de réception": { de: "Eingangskanäle", it: "Canali di ricezione" },
  "Types de poste ou de cellule": {
    de: "Arten von Posten oder Zellen",
    it: "Tipi di posto o di cellula",
  },
  Grades: { de: "Grade", it: "Gradi" },
  Fonctions: { de: "Funktionen", it: "Funzioni" },
  "Types de moyens": { de: "Mittelarten", it: "Tipi di mezzi" },
  Organisations: { de: "Organisationen", it: "Organizzazioni" },
  "Catégories de contact": {
    de: "Kontaktkategorien",
    it: "Categorie di contatto",
  },
  "Types de rendez-vous": { de: "Terminarten", it: "Tipi di appuntamento" },
  "Calques de la carte": { de: "Kartenebenen", it: "Livelli della carta" },
  "Types d’événement (listes de contrôle)": {
    de: "Ereignisarten (Checklisten)",
    it: "Tipi di evento (liste di controllo)",
  },
  "Unités des demandes de moyens": {
    de: "Einheiten der Mittelanforderungen",
    it: "Unità delle richieste di mezzi",
  },
  "Catégories de renseignements clés": {
    de: "Kategorien der Schlüsselinformationen",
    it: "Categorie delle informazioni chiave",
  },
  "Fonctions des postes": {
    de: "Funktionen der Arbeitsplätze",
    it: "Funzioni delle postazioni",
  },
  "Types d’ordre": { de: "Befehlsarten", it: "Tipi di ordine" },
  "Types de diffusion": { de: "Verteilungsarten", it: "Tipi di diffusione" },
} satisfies Dict);

/** Name of a référentiel in the language of the post. */
export const listLabel = (label: string): string =>
  Object.hasOwn(dict, label) ? t(label as keyof typeof dict) : label;
