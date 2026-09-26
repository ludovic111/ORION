import { translator, type Dict } from "./core.ts";

// Export and print reminders (shared/reminders.ts).
export const { t, tn, tIn, dict } = translator({
  "Exporter l’archive": { de: "Archiv exportieren", it: "Esporta l’archivio" },
  "Imprimer la situation": { de: "Lage drucken", it: "Stampa la situazione" },
  "Préparer le point de situation": {
    de: "Lagerapport vorbereiten",
    it: "Prepara il punto della situazione",
  },
  Autre: { de: "Andere", it: "Altro" },
  "toutes les {n} h": { de: "alle {n} h", it: "ogni {n} h" },
  "toutes les {n} min": { de: "alle {n} Min.", it: "ogni {n} min" },
  "avant « {title} » de {time}": {
    de: "vor «{title}» um {time}",
    it: "prima di «{title}» delle {time}",
  },
  "Exporter l’archive chiffrée": {
    de: "Verschlüsseltes Archiv exportieren",
    it: "Esporta l’archivio cifrato",
  },
  "Une archive .orionaic à jour sur une clé ou un autre poste.": {
    de: "Ein aktuelles .orionaic-Archiv auf einem USB-Stick oder einem anderen Arbeitsplatz.",
    it: "Un archivio .orionaic aggiornato su una chiavetta o su un’altra postazione.",
  },
  "Imprimer la situation pour le rapport": {
    de: "Lage für den Rapport drucken",
    it: "Stampa la situazione per il rapporto",
  },
} satisfies Dict);
