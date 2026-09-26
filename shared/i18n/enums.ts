import { pick, type Dict, type Lang } from "./core.ts";

// Fixed values of the schemas (z.enum): states, priorities, types, channels.
// They are stored in French in every journal (codes shared by all posts)
// and shown in the language of the post with enumLabel(value). Free texts
// and référentiel values are never passed here: they are data.
export const enums = {
  // Journal entries (shared/journal.ts)
  Renseignement: { de: "Nachricht", it: "Informazione" },
  Décision: { de: "Entscheid", it: "Decisione" },
  Mission: { de: "Auftrag", it: "Missione" },
  Demande: { de: "Anfrage", it: "Richiesta" },
  Quittance: { de: "Quittung", it: "Quittanza" },
  Observation: { de: "Beobachtung", it: "Osservazione" },
  Relève: { de: "Ablösung", it: "Avvicendamento" },
  Normal: { de: "Normal", it: "Normale" },
  Important: { de: "Wichtig", it: "Importante" },
  Urgent: { de: "Dringend", it: "Urgente" },
  Consigné: { de: "Erfasst", it: "Registrato" },
  "À traiter": { de: "Zu bearbeiten", it: "Da trattare" },
  "En cours": { de: "In Bearbeitung", it: "In corso" },
  Terminé: { de: "Erledigt", it: "Concluso" },
  Annulé: { de: "Annulliert", it: "Annullato" },
  Radio: { de: "Funk", it: "Radio" },
  Téléphone: { de: "Telefon", it: "Telefono" },
  "Sur place": { de: "Vor Ort", it: "Sul posto" },
  "E-mail": { de: "E-Mail", it: "E-mail" },
  Message: { de: "Meldung", it: "Messaggio" },
  Autre: { de: "Andere", it: "Altro" },
  "Non confirmé": { de: "Unbestätigt", it: "Non confermato" },
  Confirmé: { de: "Bestätigt", it: "Confermato" },
  "À vérifier": { de: "Zu überprüfen", it: "Da verificare" },
  Exercice: { de: "Übung", it: "Esercizio" },
  Intervention: { de: "Einsatz", it: "Intervento" },
  Interne: { de: "Intern", it: "Interno" },
  Confidentiel: { de: "Vertraulich", it: "Confidenziale" },
  // Messages, team, resources (shared/ops.ts)
  Nouveau: { de: "Neu", it: "Nuovo" },
  "En traitement": { de: "In Bearbeitung", it: "In elaborazione" },
  Transmis: { de: "Weitergeleitet", it: "Trasmesso" },
  Classé: { de: "Abgelegt", it: "Archiviato" },
  Présent: { de: "Anwesend", it: "Presente" },
  "En pause": { de: "In Pause", it: "In pausa" },
  Absent: { de: "Abwesend", it: "Assente" },
  Relevé: { de: "Abgelöst", it: "Avvicendato" },
  Disponible: { de: "Verfügbar", it: "Disponibile" },
  Alerté: { de: "Alarmiert", it: "Allarmato" },
  "En route": { de: "Unterwegs", it: "In viaggio" },
  Engagé: { de: "Im Einsatz", it: "Impiegato" },
  "De retour": { de: "Zurück", it: "Rientrato" },
  "Hors service": { de: "Ausser Betrieb", it: "Fuori servizio" },
  positif: { de: "positiv", it: "positivo" },
  amélioration: { de: "Verbesserung", it: "miglioramento" },
  // Orders, diffusions (shared/conduct.ts)
  Brouillon: { de: "Entwurf", it: "Bozza" },
  Émis: { de: "Erlassen", it: "Emanato" },
  Lu: { de: "Gelesen", it: "Letto" },
  Compris: { de: "Verstanden", it: "Compreso" },
  Aucun: { de: "Keine", it: "Nessuna" },
  // Recipient meaning every post (shared/diffusion.ts)
  Tous: { de: "Alle", it: "Tutti" },
  // Requests for resources (shared/conduct-schemas.ts)
  Demandé: { de: "Angefordert", it: "Richiesto" },
  Accordé: { de: "Bewilligt", it: "Accordato" },
  Refusé: { de: "Abgelehnt", it: "Rifiutato" },
  Arrivé: { de: "Eingetroffen", it: "Arrivato" },
  Libéré: { de: "Entlassen", it: "Liberato" },
  // Radio (shared/radio.ts)
  Conduite: { de: "Führung", it: "Condotta" },
  Engagement: { de: "Einsatz", it: "Impiego" },
  Logistique: { de: "Logistik", it: "Logistica" },
  Coordination: { de: "Koordination", it: "Coordinamento" },
  Appel: { de: "Aufruf", it: "Chiamata" },
  Réserve: { de: "Reserve", it: "Riserva" },
  Groupe: { de: "Gruppe", it: "Gruppo" },
  Direct: { de: "Direkt", it: "Diretto" },
  Relais: { de: "Relais", it: "Ripetitore" },
  Portatif: { de: "Handgerät", it: "Portatile" },
  Véhicule: { de: "Fahrzeug", it: "Veicolo" },
  Fixe: { de: "Fest", it: "Fisso" },
  "Batterie de rechange": { de: "Ersatzakku", it: "Batteria di riserva" },
  Microtel: { de: "Mikrotel", it: "Microtel" },
  "Adaptateur FUGA": { de: "FUGA-Adapter", it: "Adattatore FUGA" },
  Chargeur: { de: "Ladegerät", it: "Caricatore" },
  Antenne: { de: "Antenne", it: "Antenna" },
  Housse: { de: "Tasche", it: "Custodia" },
  Opérationnel: { de: "Einsatzbereit", it: "Operativo" },
  "À recharger": { de: "Aufzuladen", it: "Da ricaricare" },
  Défectueux: { de: "Defekt", it: "Difettoso" },
  Manquant: { de: "Fehlend", it: "Mancante" },
  Pleine: { de: "Voll", it: "Piena" },
  Partielle: { de: "Teilweise", it: "Parziale" },
  Faible: { de: "Schwach", it: "Debole" },
  // Weather warning levels (shared/ops.ts ALERT_LABELS)
  "Degré 1 · danger faible ou nul": {
    de: "Stufe 1 · keine oder geringe Gefahr",
    it: "Grado 1 · pericolo debole o nullo",
  },
  "Degré 2 · danger limité": {
    de: "Stufe 2 · mässige Gefahr",
    it: "Grado 2 · pericolo moderato",
  },
  "Degré 3 · danger marqué": {
    de: "Stufe 3 · erhebliche Gefahr",
    it: "Grado 3 · pericolo marcato",
  },
  "Degré 4 · fort danger": {
    de: "Stufe 4 · grosse Gefahr",
    it: "Grado 4 · forte pericolo",
  },
  "Degré 5 · très fort danger": {
    de: "Stufe 5 · sehr grosse Gefahr",
    it: "Grado 5 · pericolo molto forte",
  },
} satisfies Dict;

/**
 * A fixed value (state, priority, type…) in the language of the post; any
 * other text is returned unchanged.
 */
export function enumLabel(value: string, lang?: Lang): string {
  return Object.hasOwn(enums, value) ? pick(enums, value, lang) : value;
}
