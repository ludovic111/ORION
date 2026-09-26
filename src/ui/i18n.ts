import { translator, type Dict } from "../../shared/i18n/core.ts";
import { common } from "../../shared/i18n/common.ts";

// Shared interface pieces (src/ui): dock, sheets, fields, links, palette,
// dictation, install help.
export const { t, tn, tIn, dict } = translator({
  ...common,
  // Clock
  "Heure suisse": { de: "Schweizer Zeit", it: "Ora svizzera" },
  // Dictation
  "Micro refusé : autorisez-le pour ce site dans le navigateur.": {
    de: "Mikrofon verweigert: Erlauben Sie es für diese Website im Browser.",
    it: "Microfono rifiutato: autorizzarlo per questo sito nel browser.",
  },
  "Dictée refusée par le navigateur ou l’organisation.": {
    de: "Diktat vom Browser oder von der Organisation verweigert.",
    it: "Dettatura rifiutata dal browser o dall’organizzazione.",
  },
  "Pas de connexion : la dictée de ce navigateur passe par internet.": {
    de: "Keine Verbindung: Das Diktat dieses Browsers läuft über das Internet.",
    it: "Nessuna connessione: la dettatura di questo browser passa da internet.",
  },
  "Rien entendu. Appuyez sur le micro, puis parlez.": {
    de: "Nichts gehört. Tippen Sie auf das Mikrofon und sprechen Sie dann.",
    it: "Non si è sentito nulla. Premere il microfono, poi parlare.",
  },
  "Aucun micro trouvé sur ce poste.": {
    de: "Kein Mikrofon an diesem Arbeitsplatz gefunden.",
    it: "Nessun microfono trovato su questa postazione.",
  },
  "Le français n’est pas disponible pour la dictée ici.": {
    de: "Deutsch ist hier für das Diktat nicht verfügbar.",
    it: "L’italiano non è disponibile per la dettatura qui.",
  },
  "Brave ne transcrit pas la voix : utilisez Chrome, Edge ou Safari.": {
    de: "Brave transkribiert keine Sprache: Verwenden Sie Chrome, Edge oder Safari.",
    it: "Brave non trascrive la voce: usare Chrome, Edge o Safari.",
  },
  "La dictée s’est arrêtée.": {
    de: "Das Diktat wurde beendet.",
    it: "La dettatura si è interrotta.",
  },
  "La dictée n’a pas pu démarrer.": {
    de: "Das Diktat konnte nicht gestartet werden.",
    it: "Impossibile avviare la dettatura.",
  },
  "Dicter le texte": { de: "Text diktieren", it: "Detta il testo" },
  "Écoute…": { de: "Hört zu …", it: "In ascolto…" },
  "Arrêter la dictée": { de: "Diktat beenden", it: "Ferma la dettatura" },
  "Arrêter la dictée (Échap)": {
    de: "Diktat beenden (Esc)",
    it: "Ferma la dettatura (Esc)",
  },
  // Dock
  Modules: { de: "Module", it: "Moduli" },
  "Plus de modules": { de: "Weitere Module", it: "Altri moduli" },
  // Install
  "Installer orion aic": {
    de: "orion aic installieren",
    it: "Installa orion aic",
  },
  "Safari → Partager → « Sur l’écran d’accueil ».": {
    de: "Safari → Teilen → « Zum Home-Bildschirm ».",
    it: "Safari → Condividi → « Aggiungi alla schermata Home ».",
  },
  "Chrome → menu ⋮ → « Installer l’application ».": {
    de: "Chrome → Menü ⋮ → « App installieren ».",
    it: "Chrome → menu ⋮ → « Installa app ».",
  },
  Ordinateur: { de: "Computer", it: "Computer" },
  "Chrome, Edge ou Brave → icône d’installation dans la barre d’adresse.": {
    de: "Chrome, Edge oder Brave → Installationssymbol in der Adressleiste.",
    it: "Chrome, Edge o Brave → icona di installazione nella barra degli indirizzi.",
  },
  "L’app installée s’ouvre en plein écran et fonctionne hors ligne. Ses données restent propres à ce navigateur : une session ouverte dans Safari n’apparaît pas dans l’app installée, et inversement. Transférer par archive .orionaic si besoin.":
    {
      de: "Die installierte App öffnet sich im Vollbild und funktioniert offline. Ihre Daten bleiben an diesen Browser gebunden: Eine in Safari geöffnete Sitzung erscheint nicht in der installierten App und umgekehrt. Bei Bedarf per .orionaic-Archiv übertragen.",
      it: "L’app installata si apre a schermo intero e funziona offline. I suoi dati restano propri di questo browser: una sessione aperta in Safari non compare nell’app installata, e viceversa. Se necessario, trasferire tramite archivio .orionaic.",
    },
  // Module head
  "Aide sur cette page": {
    de: "Hilfe zu dieser Seite",
    it: "Aiuto su questa pagina",
  },
  // Palette
  "Aller à {module}": { de: "Gehe zu {module}", it: "Vai a {module}" },
  Actions: { de: "Aktionen", it: "Azioni" },
  Éléments: { de: "Elemente", it: "Elementi" },
  "Rechercher et agir": { de: "Suchen und handeln", it: "Cerca e agisci" },
  "Rechercher partout, ou taper une action…": {
    de: "Überall suchen oder eine Aktion eingeben …",
    it: "Cerca ovunque, o digita un’azione…",
  },
  Échap: { de: "Esc", it: "Esc" },
  "Rien trouvé pour « {query} ».": {
    de: "Nichts gefunden für « {query} ».",
    it: "Nessun risultato per « {query} ».",
  },
  "↑↓ naviguer": { de: "↑↓ navigieren", it: "↑↓ naviga" },
  ouvrir: { de: "öffnen", it: "apri" },
  "Recherche dans tout le journal actif": {
    de: "Suche im ganzen aktiven Journal",
    it: "Ricerca in tutto il diario attivo",
  },
  // Sheets, records
  "Modifications enregistrées.": {
    de: "Änderungen gespeichert.",
    it: "Modifiche salvate.",
  },
  "Ajouté.": { de: "Hinzugefügt.", it: "Aggiunto." },
  "Supprimé.": { de: "Gelöscht.", it: "Eliminato." },
  "Lecture seule.": { de: "Nur lesen.", it: "Sola lettura." },
  "Supprimer ?": { de: "Löschen?", it: "Eliminare?" },
  "Supprimer définitivement ?": {
    de: "Endgültig löschen?",
    it: "Eliminare definitivamente?",
  },
  "Lecture seule : vous consultez le passé. Revenez au direct pour écrire.": {
    de: "Nur lesen: Sie sehen die Vergangenheit. Kehren Sie zur Live-Ansicht zurück, um zu schreiben.",
    it: "Sola lettura: state consultando il passato. Tornare alla diretta per scrivere.",
  },
  "Journal clôturé — rouvrez-le pour écrire.": {
    de: "Journal abgeschlossen — öffnen Sie es wieder, um zu schreiben.",
    it: "Diario chiuso — riaprirlo per scrivere.",
  },
  "Champ obligatoire : {fields}.": {
    de: "Pflichtfeld: {fields}.",
    it: "Campo obbligatorio: {fields}.",
  },
  "Ajouter {noun}": { de: "{noun} hinzufügen", it: "Aggiungi {noun}" },
  "Version passée : lecture seule.": {
    de: "Frühere Version: nur lesen.",
    it: "Versione passata: sola lettura.",
  },
  "Journal clôturé : lecture seule.": {
    de: "Abgeschlossenes Journal: nur lesen.",
    it: "Diario chiuso: sola lettura.",
  },
  "Des modifications ne sont pas enregistrées. Fermer sans enregistrer ?": {
    de: "Änderungen sind nicht gespeichert. Ohne Speichern schliessen?",
    it: "Alcune modifiche non sono salvate. Chiudere senza salvare?",
  },
  // Fields
  "Texte libre accepté": {
    de: "Freitext möglich",
    it: "Testo libero accettato",
  },
  Effacer: { de: "Löschen", it: "Cancella" },
  "Entrée pour ajouter": {
    de: "Enter zum Hinzufügen",
    it: "Invio per aggiungere",
  },
  Retirer: { de: "Entfernen", it: "Rimuovi" },
  // Links
  "+ {n} autre lien": {
    de: "+ {n} weitere Verknüpfung",
    it: "+ {n} altro collegamento",
  },
  "+ {n} autres liens": {
    de: "+ {n} weitere Verknüpfungen",
    it: "+ {n} altri collegamenti",
  },
  "Retirer le lien vers {title}": {
    de: "Verknüpfung zu {title} entfernen",
    it: "Rimuovi il collegamento a {title}",
  },
  "Retirer ce lien": {
    de: "Diese Verknüpfung entfernen",
    it: "Rimuovi questo collegamento",
  },
  "Rechercher une entrée, un message, un moyen, une personne…": {
    de: "Einen Eintrag, eine Meldung, ein Mittel, eine Person suchen …",
    it: "Cerca una voce, un messaggio, un mezzo, una persona…",
  },
  "Aucun élément ne correspond.": {
    de: "Kein Element entspricht der Suche.",
    it: "Nessun elemento corrisponde.",
  },
  Liens: { de: "Verknüpfungen", it: "Collegamenti" },
  "Aucun lien. « Lier » relie cet élément à une entrée, un message, un moyen, une personne, un objet de la carte… Les noms d’appel, émetteurs et références (#012) sont reliés automatiquement.":
    {
      de: "Keine Verknüpfung. « Verknüpfen » verbindet dieses Element mit einem Eintrag, einer Meldung, einem Mittel, einer Person, einem Kartenobjekt … Rufnamen, Absender und Verweise (#012) werden automatisch verknüpft.",
      it: "Nessun collegamento. « Collega » unisce questo elemento a una voce, un messaggio, un mezzo, una persona, un oggetto della carta… Nominativi, mittenti e riferimenti (#012) sono collegati automaticamente.",
    },
  "Lier à…": { de: "Verknüpfen mit …", it: "Collega a…" },
  "Nature du lien (facultatif)": {
    de: "Art der Verknüpfung (optional)",
    it: "Natura del collegamento (facoltativo)",
  },
  "ex. position, demandé par, concerne": {
    de: "z. B. Standort, angefordert von, betrifft",
    it: "es. posizione, richiesto da, riguarda",
  },
} satisfies Dict);
