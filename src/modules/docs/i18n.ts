import { translator, type Dict } from "../../../shared/i18n/core.ts";
import { common } from "../../../shared/i18n/common.ts";

// Frame of the built-in help (Docs.tsx) and its building blocks and
// diagrams (kit.tsx). The help pages themselves are in content*.tsx and in
// de/ and it/.
export const { t, tn, tIn, dict } = translator({
  ...common,
  // Levels
  "En bref": { de: "Kurz", it: "In breve" },
  Guide: { de: "Anleitung", it: "Guida" },
  "Tout le détail": { de: "Alle Details", it: "Tutti i dettagli" },
  "Pas à pas": { de: "Schritt für Schritt", it: "Passo per passo" },
  "Plus de détail": { de: "Mehr Details", it: "Più dettagli" },
  "Moins de détail": { de: "Weniger Details", it: "Meno dettagli" },
  "Niveau de détail": { de: "Detailgrad", it: "Livello di dettaglio" },
  "Comment utiliser orion aic, fonction par fonction. Choisissez la quantité de détail : en bref, pas à pas, ou tout.":
    {
      de: "Wie man orion aic benutzt, Funktion für Funktion. Wählen Sie den Detailgrad: kurz, Schritt für Schritt oder alles.",
      it: "Come usare orion aic, funzione per funzione. Scegliete il livello di dettaglio: in breve, passo per passo o tutto.",
    },
  // Search and table of contents
  "Sommaire de l’aide": {
    de: "Inhaltsverzeichnis der Hilfe",
    it: "Sommario dell’aiuto",
  },
  "Chercher dans l’aide…": {
    de: "In der Hilfe suchen …",
    it: "Cerca nell’aiuto…",
  },
  "Chercher dans l’aide": { de: "In der Hilfe suchen", it: "Cerca nell’aiuto" },
  "Aller au sujet": { de: "Zum Thema", it: "Vai all’argomento" },
  "Aucun résultat": { de: "Keine Ergebnisse", it: "Nessun risultato" },
  "{n} sujet pour « {q} »": {
    de: "{n} Thema für « {q} »",
    it: "{n} argomento per « {q} »",
  },
  "{n} sujets pour « {q} »": {
    de: "{n} Themen für « {q} »",
    it: "{n} argomenti per « {q} »",
  },
  "Essayez un autre mot, plus court, ou parcourez le sommaire. Les accents ne comptent pas.":
    {
      de: "Versuchen Sie ein anderes, kürzeres Wort oder blättern Sie im Inhaltsverzeichnis. Akzente spielen keine Rolle.",
      it: "Provate un’altra parola, più corta, o scorrete il sommario. Gli accenti non contano.",
    },
  // Callouts and examples (kit.tsx)
  Astuce: { de: "Tipp", it: "Suggerimento" },
  Attention: { de: "Achtung", it: "Attenzione" },
  "Bon à savoir": { de: "Gut zu wissen", it: "Buono a sapersi" },
  "Crue de l’Arve": { de: "Hochwasser der Arve", it: "Piena dell’Arve" },
  "Exemple · {title}": { de: "Beispiel · {title}", it: "Esempio · {title}" },
  // Path of a message
  Réception: { de: "Eingang", it: "Ricezione" },
  "Le message arrive tel quel : « Ici Patrouille Alpha, l’eau passe par-dessus le quai… »":
    {
      de: "Die Meldung kommt unverändert an: « Hier Patrouille Alpha, das Wasser fliesst über den Quai … »",
      it: "Il messaggio arriva così com’è: « Qui Pattuglia Alpha, l’acqua passa sopra la banchina… »",
    },
  "on résume": { de: "zusammenfassen", it: "si riassume" },
  Synthèse: { de: "Synthese", it: "Sintesi" },
  "On garde l’essentiel, en une ou deux phrases claires.": {
    de: "Das Wesentliche wird in ein oder zwei klaren Sätzen festgehalten.",
    it: "Si tiene l’essenziale, in una o due frasi chiare.",
  },
  "on inscrit": { de: "erfassen", it: "si registra" },
  "#012 : numéroté, à l’heure, relié au message d’origine.": {
    de: "#012: nummeriert, mit Zeit, mit der ursprünglichen Meldung verknüpft.",
    it: "#012: numerata, con l’ora, collegata al messaggio d’origine.",
  },
  "Le chemin d’un message : du texte brut à l’entrée officielle du journal.": {
    de: "Der Weg einer Meldung: vom Rohtext zum offiziellen Journaleintrag.",
    it: "Il percorso di un messaggio: dal testo grezzo alla voce ufficiale del diario.",
  },
  // Synchronisation
  "Poste A": { de: "Arbeitsplatz A", it: "Postazione A" },
  "Poste B": { de: "Arbeitsplatz B", it: "Postazione B" },
  "PC front · copie complète de la session": {
    de: "KP Front · vollständige Kopie der Sitzung",
    it: "PC avanzato · copia completa della sessione",
  },
  "PC arrière · copie complète de la session": {
    de: "KP Rück · vollständige Kopie der Sitzung",
    it: "PC arretrato · copia completa della sessione",
  },
  chiffré: { de: "verschlüsselt", it: "cifrato" },
  Relais: { de: "Relais", it: "Relay" },
  "Ne voit rien : il transmet des messages illisibles et ne garde rien.": {
    de: "Sieht nichts: Es leitet unlesbare Meldungen weiter und speichert nichts.",
    it: "Non vede nulla: trasmette messaggi illeggibili e non conserva nulla.",
  },
  "Chaque poste garde tout. Le relais ne fait que passer des enveloppes scellées : seuls les postes qui connaissent le code peuvent les ouvrir.":
    {
      de: "Jeder Arbeitsplatz behält alles. Das Relais reicht nur versiegelte Umschläge weiter: Nur die Arbeitsplätze, die den Code kennen, können sie öffnen.",
      it: "Ogni postazione conserva tutto. Il relay si limita a passare buste sigillate: solo le postazioni che conoscono il codice possono aprirle.",
    },
  // Links
  "Patrouille Alpha": { de: "Patrouille Alpha", it: "Pattuglia Alpha" },
  signale: { de: "meldet", it: "segnala" },
  "Entrée #012": { de: "Eintrag #012", it: "Voce #012" },
  consigné: { de: "erfasst", it: "registrato" },
  "Motopompe 2": { de: "Motorspritze 2", it: "Motopompa 2" },
  "engagé sur": { de: "eingesetzt bei", it: "impiegato su" },
  "Un objet de la carte relié à un message, une entrée du journal et un moyen":
    {
      de: "Ein Kartenobjekt, verknüpft mit einer Meldung, einem Journaleintrag und einem Mittel",
      it: "Un oggetto della carta collegato a un messaggio, a una voce del diario e a un mezzo",
    },
  Digue: { de: "Damm", it: "Argine" },
  "objet de la carte": { de: "Kartenobjekt", it: "oggetto della carta" },
  "Survolez la digue sur la carte : le message qui l’a signalée, l’entrée du journal et la motopompe engagée apparaissent aussitôt.":
    {
      de: "Fahren Sie auf der Karte über den Damm: Die Meldung, die ihn gemeldet hat, der Journaleintrag und die eingesetzte Motorspritze erscheinen sofort.",
      it: "Passate sopra l’argine sulla carta: il messaggio che lo ha segnalato, la voce del diario e la motopompa impiegata compaiono subito.",
    },
  // Screen
  "Rechercher ou agir…": { de: "Suchen oder handeln …", it: "Cerca o agisci…" },
  "{n} postes": { de: "{n} Arbeitsplätze", it: "{n} postazioni" },
  Chiffré: { de: "Verschlüsselt", it: "Cifrato" },
  "L’écran d’orion aic, simplifié. Les numéros renvoient à la liste ci-dessous.":
    {
      de: "Der Bildschirm von orion aic, vereinfacht. Die Nummern verweisen auf die Liste unten.",
      it: "Lo schermo di orion aic, semplificato. I numeri rimandano all’elenco qui sotto.",
    },
} satisfies Dict);
