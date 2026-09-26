import { translator, type Dict } from "../../shared/i18n/core.ts";
import { common } from "../../shared/i18n/common.ts";

// Conduct features of the post: function and alerts (PostPanel.tsx,
// roles.ts, useAlerts.ts), banner of receipts (ConductLayer.tsx) and the
// dialogs Diffuser / Attribuer / Message à l’autre PC (dialogs.tsx).
export const { t, tn, tIn, dict } = translator({
  ...common,
  // Profiles of the functions (roles.ts)
  "Décide, donne les ordres, tient le rythme de conduite.": {
    de: "Entscheidet, erteilt die Befehle, hält den Führungsrhythmus.",
    it: "Decide, emana gli ordini, tiene il ritmo di condotta.",
  },
  "Suit et présente la situation, prépare les rapports.": {
    de: "Verfolgt und präsentiert die Lage, bereitet die Rapporte vor.",
    it: "Segue e presenta la situazione, prepara i rapporti.",
  },
  "Tient le journal, trie les messages, suit les échéances.": {
    de: "Führt das Journal, sortiert die Meldungen, überwacht die Fristen.",
    it: "Tiene il diario, smista i messaggi, segue le scadenze.",
  },
  "Moyens, demandes, ravitaillement, hébergement.": {
    de: "Mittel, Anforderungen, Versorgung, Unterkunft.",
    it: "Mezzi, richieste, approvvigionamento, alloggio.",
  },
  "Réseau radio, terminaux, liaisons et transmissions.": {
    de: "Funknetz, Endgeräte, Verbindungen und Übermittlung.",
    it: "Rete radio, terminali, collegamenti e trasmissioni.",
  },
  "Présences, relèves, annuaire et administration.": {
    de: "Präsenzen, Ablösungen, Verzeichnis und Administration.",
    it: "Presenze, avvicendamenti, rubrica e amministrazione.",
  },
  "Échanges avec l’autre PC et les partenaires, accusés de lecture.": {
    de: "Austausch mit dem anderen KP und den Partnern, Lesebestätigungen.",
    it: "Scambi con l’altro PC e i partner, conferme di lettura.",
  },
  // Réglages → Ce poste (PostPanel.tsx)
  "Fonction de ce poste": {
    de: "Funktion dieses Arbeitsplatzes",
    it: "Funzione di questa postazione",
  },
  "Ce qui est attribué à cette fonction apparaît dans « Mes tâches » et déclenche vos alertes. Liste modifiable dans les référentiels (Fonctions des postes).":
    {
      de: "Was dieser Funktion zugewiesen ist, erscheint in « Meine Aufgaben » und löst Ihre Alarme aus. Liste in den Wertelisten anpassbar (Funktionen der Arbeitsplätze).",
      it: "Ciò che è assegnato a questa funzione compare in « I miei compiti » e attiva i vostri avvisi. Elenco modificabile negli elenchi di riferimento (Funzioni delle postazioni).",
    },
  "Cellule ou poste (facultatif)": {
    de: "Zelle oder Arbeitsplatz (optional)",
    it: "Cellula o postazione (facoltativo)",
  },
  "Une diffusion adressée à cette cellule, à la fonction ou à « {author} » s’affiche sur ce poste.":
    {
      de: "Eine Verteilung an diese Zelle, an die Funktion oder an « {author} » wird auf diesem Arbeitsplatz angezeigt.",
      it: "Una diffusione indirizzata a questa cellula, alla funzione o a « {author} » compare su questa postazione.",
    },
  "Module à l’ouverture": {
    de: "Modul beim Öffnen",
    it: "Modulo all’apertura",
  },
  "Selon la fonction ({module})": {
    de: "Je nach Funktion ({module})",
    it: "Secondo la funzione ({module})",
  },
  "Autorisées par le navigateur.": {
    de: "Vom Browser erlaubt.",
    it: "Autorizzate dal browser.",
  },
  "Refusées par le navigateur. Pour les autoriser : cliquez sur le cadenas à gauche de l’adresse, puis Notifications → Autoriser.":
    {
      de: "Vom Browser abgelehnt. Um sie zu erlauben: Klicken Sie auf das Schloss links neben der Adresse, dann Benachrichtigungen → Zulassen.",
      it: "Rifiutate dal browser. Per autorizzarle: fate clic sul lucchetto a sinistra dell’indirizzo, poi Notifiche → Consenti.",
    },
  "Pas encore autorisées.": {
    de: "Noch nicht erlaubt.",
    it: "Non ancora autorizzate.",
  },
  "Ce navigateur n’affiche pas de notifications.": {
    de: "Dieser Browser zeigt keine Benachrichtigungen an.",
    it: "Questo browser non mostra notifiche.",
  },
  Alertes: { de: "Alarme", it: "Avvisi" },
  "Ce poste peut vous prévenir même quand orion aic est dans un autre onglet ou derrière une autre fenêtre : message urgent, échéance dépassée, rapport qui approche, tâche pour votre fonction, diffusion à quittancer. Rien ne part sur internet : c’est le navigateur de ce poste qui affiche et sonne. L’onglet doit rester ouvert.":
    {
      de: "Dieser Arbeitsplatz kann Sie warnen, auch wenn orion aic in einem anderen Tab oder hinter einem anderen Fenster ist: dringende Meldung, überschrittene Frist, bevorstehender Rapport, Aufgabe für Ihre Funktion, zu quittierende Verteilung. Nichts geht ins Internet: Der Browser dieses Arbeitsplatzes zeigt an und klingelt. Der Tab muss offen bleiben.",
      it: "Questa postazione può avvisarvi anche quando orion aic è in un’altra scheda o dietro un’altra finestra: messaggio urgente, scadenza superata, rapporto imminente, compito per la vostra funzione, diffusione da quittanzare. Niente parte su internet: è il browser di questa postazione che mostra e suona. La scheda deve restare aperta.",
    },
  "Notifications du système": {
    de: "Systembenachrichtigungen",
    it: "Notifiche di sistema",
  },
  "Les alertes de ce poste s’afficheront ainsi.": {
    de: "Die Alarme dieses Arbeitsplatzes werden so angezeigt.",
    it: "Gli avvisi di questa postazione appariranno così.",
  },
  Son: { de: "Ton", it: "Suono" },
  "Deux notes courtes, trois si c’est urgent. Plus bas et plus doux avec le thème Nuit tactique.":
    {
      de: "Zwei kurze Töne, drei wenn dringend. Tiefer und leiser mit dem Thema Taktische Nacht.",
      it: "Due note brevi, tre se è urgente. Più basse e più dolci con il tema Notte tattica.",
    },
  "Essai d’alerte": { de: "Testalarm", it: "Prova d’avviso" },
  "Voici comment ce poste vous prévient.": {
    de: "So warnt Sie dieser Arbeitsplatz.",
    it: "Ecco come questa postazione vi avvisa.",
  },
  "Essai d’alerte.": { de: "Testalarm.", it: "Prova d’avviso." },
  Essayer: { de: "Testen", it: "Prova" },
  "Prévenir avant un rapport ou rendez-vous (min)": {
    de: "Warnen vor einem Rapport oder Termin (Min.)",
    it: "Avvisare prima di un rapporto o appuntamento (min)",
  },
  "Me prévenir pour": { de: "Mich warnen bei", it: "Avvisarmi per" },
  "Heures calmes": { de: "Ruhezeiten", it: "Ore di quiete" },
  "Pendant ces heures (heure de Zurich), aucun son ; seules les alertes urgentes s’affichent.":
    {
      de: "Während dieser Zeiten (Zürcher Zeit) kein Ton; nur dringende Alarme werden angezeigt.",
      it: "Durante queste ore (ora di Zurigo) nessun suono; compaiono solo gli avvisi urgenti.",
    },
  De: { de: "Von", it: "Da" },
  À: { de: "Bis", it: "A" },
  // Alerts (useAlerts.ts)
  "orion aic · {n} alertes": {
    de: "orion aic · {n} Alarme",
    it: "orion aic · {n} avvisi",
  },
  "{n} alertes : {list}": {
    de: "{n} Alarme: {list}",
    it: "{n} avvisi: {list}",
  },
  // Banner of receipts (ConductLayer.tsx)
  "Diffusions à quittancer": {
    de: "Zu quittierende Verteilungen",
    it: "Diffusioni da quittanzare",
  },
  "Une diffusion attend votre accusé": {
    de: "Eine Verteilung wartet auf Ihre Bestätigung",
    it: "Una diffusione attende la vostra conferma",
  },
  "{n} diffusions attendent votre accusé": {
    de: "{n} Verteilungen warten auf Ihre Bestätigung",
    it: "{n} diffusioni attendono la vostra conferma",
  },
  "de {who}": { de: "von {who}", it: "da {who}" },
  "pour {recipients}": { de: "für {recipients}", it: "per {recipients}" },
  "« {ack} » envoyé : {title}.": {
    de: "« {ack} » gesendet: {title}.",
    it: "« {ack} » inviato: {title}.",
  },
  "Voir les {n} dans Mes tâches": {
    de: "Alle {n} in Meine Aufgaben anzeigen",
    it: "Vedere i {n} in I miei compiti",
  },
  // Dialogs (dialogs.tsx)
  "Autre destinataire (fonction, poste, nom)…": {
    de: "Weiterer Empfänger (Funktion, Arbeitsplatz, Name) …",
    it: "Altro destinatario (funzione, postazione, nome)…",
  },
  "Autre destinataire": { de: "Weiterer Empfänger", it: "Altro destinatario" },
  "Choisir un élément (ordre, entrée, message…)": {
    de: "Element wählen (Befehl, Eintrag, Meldung …)",
    it: "Scegliere un elemento (ordine, voce, messaggio…)",
  },
  "Diffusé à {n} destinataire.": {
    de: "An {n} Empfänger verteilt.",
    it: "Diffuso a {n} destinatario.",
  },
  "Diffusé à {n} destinataires.": {
    de: "An {n} Empfänger verteilt.",
    it: "Diffuso a {n} destinatari.",
  },
  "Accusé « {ack} » attendu.": {
    de: "Bestätigung « {ack} » erwartet.",
    it: "Conferma « {ack} » attesa.",
  },
  "Diffuser avec accusé de lecture": {
    de: "Mit Lesebestätigung verteilen",
    it: "Diffondere con conferma di lettura",
  },
  "Accusé demandé": { de: "Verlangte Bestätigung", it: "Conferma richiesta" },
  "Signaler sans réponse après (min)": {
    de: "Ohne Antwort melden nach (Min.)",
    it: "Segnalare senza risposta dopo (min)",
  },
  "0 : jamais.": { de: "0: nie.", it: "0: mai." },
  "Élément diffusé": { de: "Verteiltes Element", it: "Elemento diffuso" },
  "Part aussi par la liaison vers {names} : l’autre PC la reçoit dans ses messages et répond par son propre accusé.":
    {
      de: "Geht auch über die Verbindung an {names}: Der andere KP erhält sie in seinen Meldungen und antwortet mit seiner eigenen Bestätigung.",
      it: "Parte anche tramite il collegamento verso {names}: l’altro PC la riceve nei suoi messaggi e risponde con la propria conferma.",
    },
  "Attribué à {who}.": { de: "Zugewiesen an {who}.", it: "Assegnato a {who}." },
  "Attribuer à une fonction ou une personne": {
    de: "Einer Funktion oder Person zuweisen",
    it: "Assegnare a una funzione o a una persona",
  },
  Élément: { de: "Element", it: "Elemento" },
  Personne: { de: "Person", it: "Persona" },
  Consigne: { de: "Weisung", it: "Direttiva" },
  "Message envoyé à {name} : il part dès que la liaison répond.": {
    de: "Meldung an {name} gesendet: Sie geht weg, sobald die Verbindung antwortet.",
    it: "Messaggio inviato a {name}: parte appena il collegamento risponde.",
  },
  "Message à l’autre PC": {
    de: "Meldung an den anderen KP",
    it: "Messaggio all’altro PC",
  },
  "Aucune liaison ouverte. Réglages → Synchronisation → Liaison entre PC.": {
    de: "Keine offene Verbindung. Einstellungen → Synchronisation → Verbindung zwischen KP.",
    it: "Nessun collegamento aperto. Impostazioni → Sincronizzazione → Collegamento tra PC.",
  },
  Vers: { de: "An", it: "Verso" },
  "Arrive dans les messages de {name}, avec « {self} » comme émetteur.": {
    de: "Kommt in den Meldungen von {name} an, mit « {self} » als Absender.",
    it: "Arriva nei messaggi di {name}, con « {self} » come mittente.",
  },
  Envoyer: { de: "Senden", it: "Invia" },
} satisfies Dict);
