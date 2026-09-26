import { translator, type Dict } from "../../shared/i18n/core.ts";
import { common } from "../../shared/i18n/common.ts";

// Live synchronisation between posts (useSync.ts) and the merge report
// (ConflictPanel.tsx).
export const { t, tn, tIn, dict } = translator({
  ...common,
  // useSync.ts: errors shown to the operator
  "Un poste utilise une version plus récente d’orion aic — rechargez la page.":
    {
      de: "Ein Arbeitsplatz verwendet eine neuere Version von orion aic – laden Sie die Seite neu.",
      it: "Una postazione usa una versione più recente di orion aic — ricaricare la pagina.",
    },
  "Cette page utilise une version plus ancienne d’orion aic — rechargez la page.":
    {
      de: "Diese Seite verwendet eine ältere Version von orion aic – laden Sie die Seite neu.",
      it: "Questa pagina usa una versione meno recente di orion aic — ricaricare la pagina.",
    },
  "Chiffrement indisponible : ouvrez orion aic en HTTPS.": {
    de: "Verschlüsselung nicht verfügbar: Öffnen Sie orion aic über HTTPS.",
    it: "Cifratura non disponibile: aprire orion aic in HTTPS.",
  },
  "Relais saturé : nouvelle tentative de connexion dans quelques secondes.": {
    de: "Relais überlastet: neuer Verbindungsversuch in wenigen Sekunden.",
    it: "Relè saturo: nuovo tentativo di connessione tra pochi secondi.",
  },
  "Session complète : 64 postes au plus sur le relais.": {
    de: "Sitzung voll: höchstens 64 Arbeitsplätze auf dem Relais.",
    it: "Sessione completa: al massimo 64 postazioni sul relè.",
  },
  "Message illisible reçu : un autre poste utilise-t-il un autre code ?": {
    de: "Unlesbare Meldung empfangen: Verwendet ein anderer Arbeitsplatz einen anderen Code?",
    it: "Ricevuto un messaggio illeggibile: un’altra postazione usa un altro codice?",
  },
  // useSync.ts: data refused (sender and what was refused)
  "Poste inconnu": {
    de: "Unbekannter Arbeitsplatz",
    it: "Postazione sconosciuta",
  },
  journal: { de: "Journal", it: "diario" },
  session: { de: "Sitzung", it: "sessione" },
  message: { de: "Meldung", it: "messaggio" },
  // ConflictPanel.tsx
  "Voir les deux versions": {
    de: "Beide Versionen anzeigen",
    it: "Vedi le due versioni",
  },
  "Identique à la version affichée.": {
    de: "Identisch mit der angezeigten Version.",
    it: "Identica alla versione visualizzata.",
  },
  "Non retenue": { de: "Nicht übernommen", it: "Non mantenuta" },
  "Les deux versions restent dans l’historique (fiche de l’élément → Historique) et peuvent être restaurées.":
    {
      de: "Beide Versionen bleiben im Verlauf (Detailansicht des Elements → Verlauf) und können wiederhergestellt werden.",
      it: "Le due versioni restano nella cronologia (scheda dell’elemento → Cronologia) e possono essere ripristinate.",
    },
  "Aucune fusion à signaler : les postes n’ont rien écrit en même temps sur les mêmes éléments.":
    {
      de: "Keine Zusammenführung zu melden: Die Arbeitsplätze haben nichts gleichzeitig an denselben Elementen geschrieben.",
      it: "Nessuna fusione da segnalare: le postazioni non hanno scritto nulla contemporaneamente sugli stessi elementi.",
    },
  "Données refusées ({n})": {
    de: "Abgelehnte Daten ({n})",
    it: "Dati rifiutati ({n})",
  },
  "Ces journaux reçus d’un autre poste n’ont pas été fusionnés. Le plus souvent, ce poste utilise une autre version d’orion aic : rechargez la page sur les deux postes.":
    {
      de: "Diese von einem anderen Arbeitsplatz empfangenen Journale wurden nicht zusammengeführt. Meistens verwendet dieser Arbeitsplatz eine andere Version von orion aic: Laden Sie die Seite auf beiden Arbeitsplätzen neu.",
      it: "Questi diari ricevuti da un’altra postazione non sono stati fusi. Di solito quella postazione usa un’altra versione di orion aic: ricaricare la pagina su entrambe le postazioni.",
    },
  "{journal} · de {from}": {
    de: "{journal} · von {from}",
    it: "{journal} · da {from}",
  },
  "Effacer la liste": { de: "Liste leeren", it: "Svuota l’elenco" },
  "Numéros donnés en même temps ({n})": {
    de: "Gleichzeitig vergebene Nummern ({n})",
    it: "Numeri assegnati contemporaneamente ({n})",
  },
  "Deux postes ont donné le même numéro au même moment. Aucun numéro n’a été changé : le premier créé garde le numéro seul, les autres reçoivent une lettre (#007·B). Citez le libellé complet.":
    {
      de: "Zwei Arbeitsplätze haben im selben Moment dieselbe Nummer vergeben. Keine Nummer wurde geändert: Das zuerst erstellte Element behält die Nummer allein, die anderen erhalten einen Buchstaben (#007·B). Nennen Sie die vollständige Bezeichnung.",
      it: "Due postazioni hanno assegnato lo stesso numero nello stesso momento. Nessun numero è stato cambiato: il primo creato mantiene il numero da solo, gli altri ricevono una lettera (#007·B). Citare la designazione completa.",
    },
  "{label} : {by}, {at}": {
    de: "{label}: {by}, {at}",
    it: "{label}: {by}, {at}",
  },
  "{label} : {by}, {at} (supprimée)": {
    de: "{label}: {by}, {at} (gelöscht)",
    it: "{label}: {by}, {at} (eliminata)",
  },
  "Modifications simultanées ({n})": {
    de: "Gleichzeitige Änderungen ({n})",
    it: "Modifiche simultanee ({n})",
  },
  "Deux postes ont modifié le même élément à partir de la même version. La plus récente est affichée partout ; l’autre reste consultable.":
    {
      de: "Zwei Arbeitsplätze haben dasselbe Element ausgehend von derselben Version geändert. Die neuere wird überall angezeigt; die andere bleibt einsehbar.",
      it: "Due postazioni hanno modificato lo stesso elemento partendo dalla stessa versione. La più recente è visualizzata ovunque; l’altra resta consultabile.",
    },
  "Retenue : {kept} · non retenue : {others}": {
    de: "Übernommen: {kept} · nicht übernommen: {others}",
    it: "Mantenuta: {kept} · non mantenuta: {others}",
  },
  "Marquer comme vu": { de: "Als gesehen markieren", it: "Segna come visto" },
} satisfies Dict);
