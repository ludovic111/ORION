import { translator, type Dict } from "./core.ts";

// Texts of shared/journal.ts: default title, first version, validation
// messages and errors shown to the operators.
export const { t, tn, tIn, dict } = translator({
  "Nouveau journal": { de: "Neues Journal", it: "Nuovo diario" },
  "Saisie initiale": { de: "Ersterfassung", it: "Registrazione iniziale" },
  "Suppressions dupliquées.": {
    de: "Doppelte Löschungen.",
    it: "Eliminazioni duplicate.",
  },
  "Une entrée supprimée figure encore au journal.": {
    de: "Ein gelöschter Eintrag steht noch im Journal.",
    it: "Una voce eliminata figura ancora nel diario.",
  },
  "Entrées avec id dupliqué.": {
    de: "Einträge mit doppelter ID.",
    it: "Voci con ID duplicato.",
  },
  "Révisions dupliquées.": {
    de: "Doppelte Versionen.",
    it: "Versioni duplicate.",
  },
  "Image invalide.": { de: "Ungültiges Bild.", it: "Immagine non valida." },
  "Brouillon sans journal.": {
    de: "Entwurf ohne Journal.",
    it: "Bozza senza diario.",
  },
  "Journal actif absent.": {
    de: "Aktives Journal fehlt.",
    it: "Diario attivo mancante.",
  },
  "Journaux dupliqués.": {
    de: "Doppelte Journale.",
    it: "Diari duplicati.",
  },
  "Ce journal est clôturé. Rouvrez-le avant de saisir une entrée.": {
    de: "Dieses Journal ist abgeschlossen. Öffnen Sie es wieder, bevor Sie einen Eintrag erfassen.",
    it: "Questo diario è chiuso. Riaprirlo prima di registrare una voce.",
  },
  "Ce journal est clôturé.": {
    de: "Dieses Journal ist abgeschlossen.",
    it: "Questo diario è chiuso.",
  },
  "Entrée introuvable.": {
    de: "Eintrag nicht gefunden.",
    it: "Voce non trovata.",
  },
  "Indiquez le motif de la modification.": {
    de: "Geben Sie den Grund der Änderung an.",
    it: "Indicare il motivo della modifica.",
  },
  "Indiquez le motif de la suppression.": {
    de: "Geben Sie den Grund der Löschung an.",
    it: "Indicare il motivo dell’eliminazione.",
  },
  "Fichier orion aic invalide ou version non prise en charge. Le journal actuel est intact.":
    {
      de: "Ungültige orion-aic-Datei oder nicht unterstützte Version. Das aktuelle Journal ist unverändert.",
      it: "File orion aic non valido o versione non supportata. Il diario attuale è intatto.",
    },
  "Rouvrez le journal avant de fusionner.": {
    de: "Öffnen Sie das Journal wieder, bevor Sie zusammenführen.",
    it: "Riaprire il diario prima di unire.",
  },
  "Des versions divergent. Importez ce fichier dans un journal séparé pour les comparer.":
    {
      de: "Einige Versionen weichen voneinander ab. Importieren Sie diese Datei in ein separates Journal, um sie zu vergleichen.",
      it: "Alcune versioni divergono. Importare questo file in un diario separato per confrontarle.",
    },
} satisfies Dict);
