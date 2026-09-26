import { translator, type Dict } from "../../../shared/i18n/core.ts";
import { common } from "../../../shared/i18n/common.ts";

// Orders and diffusions (Orders.tsx, orderSheet.ts). Swiss order scheme:
// 1 Orientierung / Orientamento, 2 Absicht / Intenzione, 3 Aufträge /
// Compiti, 4 Besondere Anordnungen / Disposizioni particolari,
// 5 Standorte und Verbindungen / Ubicazioni e collegamenti.
export const { t, tn, tIn, dict } = translator({
  ...common,
  // Inside an order, a mission is a "compito" in Italian (point 3).
  Mission: { de: "Auftrag", it: "Compito" },
  Missions: { de: "Aufträge", it: "Compiti" },
  "Nouvel ordre": { de: "Neuer Befehl", it: "Nuovo ordine" },
  "Ordres et diffusions en chiffres": {
    de: "Befehle und Verteilungen in Zahlen",
    it: "Ordini e diffusioni in cifre",
  },
  "Ordres émis": { de: "Erlassene Befehle", it: "Ordini emanati" },
  Projets: { de: "Entwürfe", it: "Bozze" },
  "Accusés attendus": {
    de: "Erwartete Bestätigungen",
    it: "Conferme attese",
  },
  "Sans accusé à temps": {
    de: "Ohne rechtzeitige Bestätigung",
    it: "Senza conferma in tempo",
  },
  "Liaisons ouvertes": { de: "Offene Verbindungen", it: "Collegamenti aperti" },
  Rubrique: { de: "Rubrik", it: "Rubrica" },
  Diffusions: { de: "Verteilungen", it: "Diffusioni" },
  "Liaison entre PC": {
    de: "Verbindung zwischen KP",
    it: "Collegamento tra PC",
  },
  "Aucun ordre": { de: "Keine Befehle", it: "Nessun ordine" },
  "Un ordre suit le schéma en cinq points : orientation, intention, missions, dispositions particulières, emplacements et liaisons. Il reçoit un numéro, part aux destinataires avec accusé de lecture et s’inscrit au journal quand il est émis.":
    {
      de: "Ein Befehl folgt dem Schema in fünf Punkten: Orientierung, Absicht, Aufträge, besondere Anordnungen, Standorte und Verbindungen. Er erhält eine Nummer, geht mit Lesebestätigung an die Empfänger und wird beim Erlass im Journal erfasst.",
      it: "Un ordine segue lo schema in cinque punti: orientamento, intenzione, compiti, disposizioni particolari, ubicazioni e collegamenti. Riceve un numero, parte ai destinatari con conferma di lettura e viene registrato nel diario quando è emanato.",
    },
  "Aucune diffusion": { de: "Keine Verteilungen", it: "Nessuna diffusione" },
  "Une diffusion envoie une information, une consigne ou un ordre à plusieurs fonctions, cellules ou PC. Chacun la voit en haut de son écran jusqu’à ce qu’il réponde « Lu » ou « Compris » ; vous voyez qui a répondu et quand.":
    {
      de: "Eine Verteilung sendet eine Information, eine Weisung oder einen Befehl an mehrere Funktionen, Zellen oder KP. Alle sehen sie oben am Bildschirm, bis sie mit « Gelesen » oder « Verstanden » antworten; Sie sehen, wer wann geantwortet hat.",
      it: "Una diffusione invia un’informazione, una direttiva o un ordine a più funzioni, cellule o PC. Ognuno la vede in alto sullo schermo finché non risponde « Letto » o « Compreso »; vedete chi ha risposto e quando.",
    },
  projet: { de: "Entwurf", it: "bozza" },
  "Ordre {label}": { de: "Befehl {label}", it: "Ordine {label}" },
  "reçu de {source}": {
    de: "erhalten von {source}",
    it: "ricevuto da {source}",
  },
  "{n} mission": { de: "{n} Auftrag", it: "{n} compito" },
  "{n} missions": { de: "{n} Aufträge", it: "{n} compiti" },
  "accusés {answered}/{total}": {
    de: "Bestätigungen {answered}/{total}",
    it: "conferme {answered}/{total}",
  },
  "de {who}": { de: "von {who}", it: "da {who}" },
  "à {recipients}": { de: "an {recipients}", it: "a {recipients}" },
  "sans accusé": { de: "ohne Bestätigung", it: "senza conferma" },
  "réponse en retard": { de: "Antwort verspätet", it: "risposta in ritardo" },
  "suivi arrêté": { de: "Verfolgung gestoppt", it: "monitoraggio fermato" },
  Accusés: { de: "Bestätigungen", it: "Conferme" },
  "Suivi des accusés arrêté.": {
    de: "Verfolgung der Bestätigungen gestoppt.",
    it: "Monitoraggio delle conferme fermato.",
  },
  "Arrêter le suivi": { de: "Verfolgung stoppen", it: "Ferma il monitoraggio" },
  "Relancer les absents": {
    de: "Ausstehende erinnern",
    it: "Sollecita chi manca",
  },
  "Supprimer cette diffusion et ses accusés ?": {
    de: "Diese Verteilung und ihre Bestätigungen löschen?",
    it: "Eliminare questa diffusione e le sue conferme?",
  },
  De: { de: "Von", it: "Da" },
  "Accusé demandé": { de: "Verlangte Bestätigung", it: "Conferma richiesta" },
  "signalé après {n} min": {
    de: "gemeldet nach {n} Min.",
    it: "segnalato dopo {n} min",
  },
  "en attente · {n} min": {
    de: "ausstehend · {n} Min.",
    it: "in attesa · {n} min",
  },
  "{who} ({kind} à {time})": {
    de: "{who} ({kind} um {time})",
    it: "{who} ({kind} alle {time})",
  },
  "{who} ({kind} à {time}, par la liaison)": {
    de: "{who} ({kind} um {time}, über die Verbindung)",
    it: "{who} ({kind} alle {time}, tramite il collegamento)",
  },
  "Choisir un modèle": { de: "Vorlage wählen", it: "Scegliere un modello" },
  "Ordre vide": { de: "Leerer Befehl", it: "Ordine vuoto" },
  "Aucun champ prérempli.": {
    de: "Keine vorausgefüllten Felder.",
    it: "Nessun campo precompilato.",
  },
  "Les modèles reprennent les tableaux de situation (situation, dangers, intention), les postes, les groupes du plan radio et les prochains rapports. Tout reste modifiable.":
    {
      de: "Die Vorlagen übernehmen die Lagetafeln (Lage, Gefahren, Absicht), die Arbeitsplätze, die Gesprächsgruppen des Funkplans und die nächsten Rapporte. Alles bleibt bearbeitbar.",
      it: "I modelli riprendono le tabelle della situazione (situazione, pericoli, intenzione), le postazioni, i gruppi di conversazione del piano radio e i prossimi rapporti. Tutto resta modificabile.",
    },
  "Mission {n}": { de: "Auftrag {n}", it: "Compito {n}" },
  "Retirer la mission {n}": {
    de: "Auftrag {n} entfernen",
    it: "Rimuovi il compito {n}",
  },
  "Unité / cellule": { de: "Einheit / Zelle", it: "Unità / cellula" },
  "Fonction responsable": {
    de: "Verantwortliche Funktion",
    it: "Funzione responsabile",
  },
  "Apparaît dans « Mes tâches » des postes de cette fonction.": {
    de: "Erscheint in « Meine Aufgaben » der Arbeitsplätze dieser Funktion.",
    it: "Compare in « I miei compiti » delle postazioni di questa funzione.",
  },
  "Moyens, personnes, entrées liés": {
    de: "Verknüpfte Mittel, Personen, Einträge",
    it: "Mezzi, persone, voci collegati",
  },
  "Ordre enregistré.": { de: "Befehl gespeichert.", it: "Ordine salvato." },
  "Projet d’ordre créé.": {
    de: "Befehlsentwurf erstellt.",
    it: "Bozza d’ordine creata.",
  },
  "Modifier l’ordre": { de: "Befehl bearbeiten", it: "Modifica l’ordine" },
  "Donné par": { de: "Erteilt von", it: "Emanato da" },
  Orientation: { de: "Orientierung", it: "Orientamento" },
  Intention: { de: "Absicht", it: "Intenzione" },
  "Dispositions particulières": {
    de: "Besondere Anordnungen",
    it: "Disposizioni particolari",
  },
  "Emplacements et liaisons": {
    de: "Standorte und Verbindungen",
    it: "Ubicazioni e collegamenti",
  },
  "Danger / évolution probable": {
    de: "Gefahr / mögliche Entwicklung",
    it: "Pericolo / evoluzione probabile",
  },
  "Moyens voisins et partenaires": {
    de: "Nachbar- und Partnermittel",
    it: "Mezzi vicini e partner",
  },
  "Idée de manœuvre": { de: "Einsatzidee", it: "Idea di manovra" },
  "Ajouter une mission": {
    de: "Auftrag hinzufügen",
    it: "Aggiungi un compito",
  },
  Logistique: { de: "Logistik", it: "Logistica" },
  Sanitaire: { de: "Sanität", it: "Sanità" },
  Sécurité: { de: "Sicherheit", it: "Sicurezza" },
  "PC / emplacements": { de: "KP / Standorte", it: "PC / ubicazioni" },
  "Liaisons radio (plan radio)": {
    de: "Funkverbindungen (Funkplan)",
    it: "Collegamenti radio (piano radio)",
  },
  "Liaisons radio": { de: "Funkverbindungen", it: "Collegamenti radio" },
  "Heures des rapports": { de: "Rapportzeiten", it: "Orari dei rapporti" },
  Distribution: { de: "Verteiler", it: "Distribuzione" },
  "Aucun destinataire : l’ordre sera émis et inscrit au journal sans diffusion. Continuer ?":
    {
      de: "Keine Empfänger: Der Befehl wird ohne Verteilung erlassen und im Journal erfasst. Fortfahren?",
      it: "Nessun destinatario: l’ordine sarà emanato e registrato nel diario senza diffusione. Continuare?",
    },
  "Ordre {label} émis : {title}": {
    de: "Befehl {label} erlassen: {title}",
    it: "Ordine {label} emanato: {title}",
  },
  "Ordre {label} : {title}": {
    de: "Befehl {label}: {title}",
    it: "Ordine {label}: {title}",
  },
  "Ordre {label} · {title}": {
    de: "Befehl {label} · {title}",
    it: "Ordine {label} · {title}",
  },
  "Intention : {text}": { de: "Absicht: {text}", it: "Intenzione: {text}" },
  "{unit} : {task}": { de: "{unit}: {task}", it: "{unit}: {task}" },
  "Ordre {label} émis, inscrit au journal.": {
    de: "Befehl {label} erlassen, im Journal erfasst.",
    it: "Ordine {label} emanato, registrato nel diario.",
  },
  "Ordre {label} émis, inscrit au journal et diffusé.": {
    de: "Befehl {label} erlassen, im Journal erfasst und verteilt.",
    it: "Ordine {label} emanato, registrato nel diario e diffuso.",
  },
  "Complément à l’ordre {label}": {
    de: "Ergänzung zu Befehl {label}",
    it: "Complemento all’ordine {label}",
  },
  "Inchangée.": { de: "Unverändert.", it: "Invariata." },
  "ordre-{n}": { de: "befehl-{n}", it: "ordine-{n}" },
  "Ordre complémentaire": {
    de: "Ergänzungsbefehl",
    it: "Ordine complementare",
  },
  Émettre: { de: "Erlassen", it: "Emana" },
  "Annuler l’ordre {label} ?": {
    de: "Befehl {label} annullieren?",
    it: "Annullare l’ordine {label}?",
  },
  "Ordre {label} annulé : {title}": {
    de: "Befehl {label} annulliert: {title}",
    it: "Ordine {label} annullato: {title}",
  },
  "Annuler l’ordre": { de: "Befehl annullieren", it: "Annulla l’ordine" },
  "Supprimer ce projet d’ordre ?": {
    de: "Diesen Befehlsentwurf löschen?",
    it: "Eliminare questa bozza d’ordine?",
  },
  "Complète <0/>": { de: "Ergänzt <0/>", it: "Completa <0/>" },
  terminée: { de: "erledigt", it: "concluso" },
  "à l’émission": { de: "bei Erlass", it: "all’emanazione" },
  "Aucun destinataire.": { de: "Keine Empfänger.", it: "Nessun destinatario." },
  "Inscrit au journal :": {
    de: "Im Journal erfasst:",
    it: "Registrato nel diario:",
  },
  // A4 form (orderSheet.ts)
  "{recipient} : {kind} {at}": {
    de: "{recipient}: {kind} {at}",
    it: "{recipient}: {kind} {at}",
  },
  "{recipient} : {kind} {at} ({post})": {
    de: "{recipient}: {kind} {at} ({post})",
    it: "{recipient}: {kind} {at} ({post})",
  },
  "{recipient} : sans accusé": {
    de: "{recipient}: ohne Bestätigung",
    it: "{recipient}: senza conferma",
  },
  "Émis le": { de: "Erlassen am", it: "Emanato il" },
  Par: { de: "Von", it: "Da" },
  "ORDRE ANNULÉ · conservé pour la traçabilité": {
    de: "BEFEHL ANNULLIERT · aufbewahrt für die Nachvollziehbarkeit",
    it: "ORDINE ANNULLATO · conservato per la tracciabilità",
  },
  "PROJET · pas encore émis": {
    de: "ENTWURF · noch nicht erlassen",
    it: "BOZZA · non ancora emanato",
  },
  "Reçu de {source} par la liaison": {
    de: "Von {source} über die Verbindung erhalten",
    it: "Ricevuto da {source} tramite il collegamento",
  },
  Complète: { de: "Ergänzt", it: "Completa" },
  "un ordre précédent": {
    de: "einen früheren Befehl",
    it: "un ordine precedente",
  },
  "Avec : {list}": { de: "Mit: {list}", it: "Con: {list}" },
  "Accusés de lecture": { de: "Lesebestätigungen", it: "Conferme di lettura" },
  Visa: { de: "Visum", it: "Visto" },
  "Chef d’intervention": { de: "Einsatzleiter", it: "Capo intervento" },
  "Date / heure": { de: "Datum / Zeit", it: "Data / ora" },
  Signature: { de: "Unterschrift", it: "Firma" },
  "ordre {label}": { de: "Befehl {label}", it: "ordine {label}" },
} satisfies Dict);
