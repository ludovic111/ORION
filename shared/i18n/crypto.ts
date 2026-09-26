import { translator, type Dict } from "./core.ts";

// Encryption of the vault and of the archives (shared/crypto.ts).
export const { t, tn, tIn, dict } = translator({
  "Utilisez une phrase secrète de 12 à 256 caractères.": {
    de: "Verwenden Sie eine Passphrase mit 12 bis 256 Zeichen.",
    it: "Usare una frase segreta di 12–256 caratteri.",
  },
  "Sel de chiffrement invalide.": {
    de: "Ungültiges Verschlüsselungs-Salt.",
    it: "Sale di cifratura non valido.",
  },
  "Session trop volumineuse pour être enregistrée par ce navigateur. Exportez puis retirez les journaux terminés, ou les images inutiles.":
    {
      de: "Die Sitzung ist zu gross, um von diesem Browser gespeichert zu werden. Exportieren und entfernen Sie abgeschlossene Journale oder unnötige Bilder.",
      it: "Sessione troppo voluminosa per essere salvata da questo browser. Esportare e poi rimuovere i diari conclusi o le immagini inutili.",
    },
  "Session trop volumineuse pour être enregistrée : {size} Mo compressés, {max} Mo au plus. Exportez puis retirez les journaux terminés, ou les images inutiles.":
    {
      de: "Die Sitzung ist zu gross, um gespeichert zu werden: {size} MB komprimiert, höchstens {max} MB. Exportieren und entfernen Sie abgeschlossene Journale oder unnötige Bilder.",
      it: "Sessione troppo voluminosa per essere salvata: {size} MB compressi, al massimo {max} MB. Esportare e poi rimuovere i diari conclusi o le immagini inutili.",
    },
  "Fichier chiffré invalide ou version inconnue.": {
    de: "Ungültige verschlüsselte Datei oder unbekannte Version.",
    it: "File cifrato non valido o versione sconosciuta.",
  },
  "Phrase secrète incorrecte ou fichier endommagé.": {
    de: "Falsche Passphrase oder beschädigte Datei.",
    it: "Frase segreta errata o file danneggiato.",
  },
} satisfies Dict);
