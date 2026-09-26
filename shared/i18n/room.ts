import { translator, type Dict } from "./core.ts";

// Session codes and synchronisation messages (shared/room.ts).
export const { t, tn, tIn, dict } = translator({
  "Saisissez le code de session : 4 groupes de 4 caractères.": {
    de: "Geben Sie den Sitzungscode ein: 4 Gruppen zu 4 Zeichen.",
    it: "Inserire il codice di sessione: 4 gruppi di 4 caratteri.",
  },
  "Un code de session ne contient jamais {chars} (les caractères 0, 1, I, L et O sont exclus pour éviter les confusions). Vérifiez la saisie.":
    {
      de: "Ein Sitzungscode enthält nie {chars} (die Zeichen 0, 1, I, L und O sind ausgeschlossen, um Verwechslungen zu vermeiden). Überprüfen Sie die Eingabe.",
      it: "Un codice di sessione non contiene mai {chars} (i caratteri 0, 1, I, L e O sono esclusi per evitare confusioni). Verificare l’inserimento.",
    },
  "Code incomplet : {n} caractères sur 16 (4 groupes de 4).": {
    de: "Unvollständiger Code: {n} von 16 Zeichen (4 Gruppen zu 4).",
    it: "Codice incompleto: {n} caratteri su 16 (4 gruppi di 4).",
  },
  "Code trop long : 16 caractères (4 groupes de 4).": {
    de: "Code zu lang: 16 Zeichen (4 Gruppen zu 4).",
    it: "Codice troppo lungo: 16 caratteri (4 gruppi di 4).",
  },
  "Ce code semble choisi à la main (trop régulier) : il serait facile à deviner. Utilisez un code créé par orion aic (Réglages → Synchronisation → Créer un code).":
    {
      de: "Dieser Code scheint von Hand gewählt (zu regelmässig): Er wäre leicht zu erraten. Verwenden Sie einen von orion aic erstellten Code (Einstellungen → Synchronisation → Sitzungscode erstellen).",
      it: "Questo codice sembra scelto a mano (troppo regolare): sarebbe facile da indovinare. Usare un codice creato da orion aic (Impostazioni → Sincronizzazione → Crea un codice di sessione).",
    },
  "Message de synchronisation trop volumineux (plus de 96 Mo compressés).": {
    de: "Synchronisationsnachricht zu gross (mehr als 96 MB komprimiert).",
    it: "Messaggio di sincronizzazione troppo voluminoso (oltre 96 MB compressi).",
  },
} satisfies Dict);
