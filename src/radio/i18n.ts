import { translator, type Dict } from "../../shared/i18n/core.ts";
import { common } from "../../shared/i18n/common.ts";

// Radio module: Polycom network plan (Gesprächsgruppen / gruppi di
// conversazione), call signs (Rufnamen / nominativi), terminals (Endgeräte /
// terminali), hand-over and return (Abgabe / Rücknahme, consegna /
// restituzione), liaison checks (Verbindungskontrollen / controlli dei
// collegamenti). Audibility labels: src/print/i18n.ts (checkLabel).
export const { t, tn, dict } = translator({
  ...common,
  // RadioView
  "Lecture seule : rouvrez le journal ou revenez au direct pour remettre ou reprendre ce terminal.":
    {
      de: "Nur lesen: Öffnen Sie das Journal wieder oder kehren Sie zur Live-Ansicht zurück, um dieses Endgerät abzugeben oder zurückzunehmen.",
      it: "Sola lettura: riaprire il diario o tornare alla diretta per consegnare o riprendere questo terminale.",
    },
  "Terminal scanné introuvable dans ce journal : {label}.": {
    de: "Gescanntes Endgerät in diesem Journal nicht gefunden: {label}.",
    it: "Terminale scansionato non trovato in questo diario: {label}.",
  },
  Terminaux: { de: "Endgeräte", it: "Terminali" },
  "En service": { de: "Ausgegeben", it: "In servizio" },
  Disponibles: { de: "Verfügbar", it: "Disponibili" },
  Indisponibles: { de: "Nicht verfügbar", it: "Non disponibili" },
  "Batteries > {h} h": { de: "Akkus > {h} h", it: "Batterie > {h} h" },
  "Noms d’appel": { de: "Rufnamen", it: "Nominativi" },
  "Dernier contrôle": { de: "Letzte Kontrolle", it: "Ultimo controllo" },
  "Vues radio": { de: "Funkansichten", it: "Viste radio" },
  "Plan du réseau": { de: "Netzplan", it: "Piano della rete" },
  Remises: { de: "Abgaben", it: "Consegne" },
  Contrôles: { de: "Kontrollen", it: "Controlli" },
  Filtrer: { de: "Filtern", it: "Filtra" },
  Effacer: { de: "Leeren", it: "Cancella" },
  Groupe: { de: "Gruppe", it: "Gruppo" },
  "Nom d’appel": { de: "Rufname", it: "Nominativo" },
  "Non rendues": { de: "Nicht zurückgegeben", it: "Non restituiti" },
  Scanner: { de: "Scannen", it: "Scansiona" },
  Étiquettes: { de: "Etiketten", it: "Etichette" },
  Série: { de: "Serie", it: "Serie" },
  Terminal: { de: "Endgerät", it: "Terminale" },
  Remettre: { de: "Abgeben", it: "Consegna" },
  "Contrôle général": { de: "Gesamtkontrolle", it: "Controllo generale" },
  Contrôle: { de: "Kontrolle", it: "Controllo" },
  "Schéma de liaisons": {
    de: "Verbindungsschema",
    it: "Schema dei collegamenti",
  },
  "Sans groupe": { de: "Ohne Gruppe", it: "Senza gruppo" },
  "Non affecté": { de: "Nicht zugewiesen", it: "Non assegnato" },
  "Sans terminal": { de: "Ohne Endgerät", it: "Senza terminale" },
  "alternative (nœud)": {
    fr: "alternative",
    de: "Ausweichgruppe",
    it: "alternativa",
  },
  "Plan vide. Créez les groupes (TKG, direct, relais), puis les noms d’appel.":
    {
      de: "Leerer Plan. Erstellen Sie die Gesprächsgruppen (TKG, direkt, Relais), dann die Rufnamen.",
      it: "Piano vuoto. Creare i gruppi di conversazione (TKG, diretto, ripetitore), poi i nominativi.",
    },
  "Premier groupe": { de: "Erste Gruppe", it: "Primo gruppo" },
  "Fonction · section": { de: "Funktion · Zug", it: "Funzione · sezione" },
  Titulaire: { de: "Inhaber", it: "Titolare" },
  "Terminal · RFSI": { de: "Endgerät · RFSI", it: "Terminale · RFSI" },
  Principal: { de: "Hauptgruppe", it: "Principale" },
  Alternative: { de: "Ausweichgruppe", it: "Alternativa" },
  "Hors réseau": { de: "Nicht im Netz", it: "Fuori rete" },
  "Modifier {name}": { de: "{name} bearbeiten", it: "Modifica {name}" },
  "Groupe / canal": { de: "Gesprächsgruppe / Kanal", it: "Gruppo / canale" },
  Mode: { de: "Modus", it: "Modo" },
  Emploi: { de: "Verwendung", it: "Impiego" },
  Modèle: { de: "Modell", it: "Modello" },
  "RFSI · série": { de: "RFSI · Serie", it: "RFSI · serie" },
  Détenteur: { de: "Inhaber", it: "Detentore" },
  Remis: { de: "Abgegeben", it: "Consegnato" },
  "Batt.": { de: "Akku", it: "Batt." },
  "Remis depuis plus de {h} h": {
    de: "Seit mehr als {h} h abgegeben",
    it: "Consegnato da oltre {h} h",
  },
  "Retour (terminal)": { fr: "Retour", de: "Rücknahme", it: "Restituzione" },
  "Quittance de remise": { de: "Abgabequittung", it: "Quittanza di consegna" },
  "Quittance de remise {label}": {
    de: "Abgabequittung {label}",
    it: "Quittanza di consegna {label}",
  },
  "Quittance de remise {label} · {holder}": {
    de: "Abgabequittung {label} · {holder}",
    it: "Quittanza di consegna {label} · {holder}",
  },
  "Aucun terminal.": { de: "Kein Endgerät.", it: "Nessun terminale." },
  "Ajouter une série": { de: "Serie hinzufügen", it: "Aggiungi una serie" },
  Remise: { de: "Abgabe", it: "Consegna" },
  Accessoires: { de: "Zubehör", it: "Accessori" },
  "batt. {level}": { de: "Akku {level}", it: "batt. {level}" },
  "En cours (remise)": { fr: "En cours", de: "Ausstehend", it: "In corso" },
  "Aucune remise.": { de: "Keine Abgabe.", it: "Nessuna consegna." },
  Audibilité: { de: "Verständlichkeit", it: "Udibilità" },
  Par: { de: "Von", it: "Da" },
  "Aucun contrôle de liaison.": {
    de: "Keine Verbindungskontrolle.",
    it: "Nessun controllo dei collegamenti.",
  },
  "Audibilité : 3 bon · 2 faible · 1 insuffisant · ✕ pas de liaison": {
    de: "Verständlichkeit: 3 gut · 2 schwach · 1 ungenügend · ✕ keine Verbindung",
    it: "Udibilità: 3 buona · 2 debole · 1 insufficiente · ✕ nessun collegamento",
  },
  "Nom d’appel = fonction": {
    de: "Rufname = Funktion",
    it: "Nominativo = funzione",
  },
  // Journal entries written by the radio module (language of the post)
  "Remise du terminal {label}{rfsi} à {holder}{callsign}.": {
    de: "Abgabe des Endgeräts {label}{rfsi} an {holder}{callsign}.",
    it: "Consegna del terminale {label}{rfsi} a {holder}{callsign}.",
  },
  ", nom d’appel {callsign}": {
    de: ", Rufname {callsign}",
    it: ", nominativo {callsign}",
  },
  "Accessoires : {list}.": { de: "Zubehör: {list}.", it: "Accessori: {list}." },
  "Batterie : {level}.": { de: "Akku: {level}.", it: "Batteria: {level}." },
  "Retour du terminal {label} par {holder}. État : {condition}.": {
    de: "Rücknahme des Endgeräts {label} von {holder}. Zustand: {condition}.",
    it: "Restituzione del terminale {label} da {holder}. Stato: {condition}.",
  },
  "Contrôle de liaison {callsign} : {result}{group}.": {
    de: "Verbindungskontrolle {callsign}: {result}{group}.",
    it: "Controllo dei collegamenti {callsign}: {result}{group}.",
  },
  "sur {group}": { de: "auf {group}", it: "su {group}" },
  "Contrôle de liaison général : {n} station.": {
    de: "Allgemeine Verbindungskontrolle: {n} Station.",
    it: "Controllo generale dei collegamenti: {n} stazione.",
  },
  "Contrôle de liaison général : {n} stations.": {
    de: "Allgemeine Verbindungskontrolle: {n} Stationen.",
    it: "Controllo generale dei collegamenti: {n} stazioni.",
  },
  "{result} : {callsigns}": {
    de: "{result}: {callsigns}",
    it: "{result}: {callsigns}",
  },
  // Forms
  "Groupe {name}": { de: "Gruppe {name}", it: "Gruppo {name}" },
  "Nouveau groupe ou canal": {
    de: "Neue Gesprächsgruppe oder neuer Kanal",
    it: "Nuovo gruppo o canale",
  },
  "Désignation requise.": {
    de: "Bezeichnung erforderlich.",
    it: "Designazione obbligatoria.",
  },
  "Groupe (TKG)": { de: "Gruppe (TKG)", it: "Gruppo (TKG)" },
  "Direct (DMO)": { de: "Direkt (DMO)", it: "Diretto (DMO)" },
  "Relais (IDR)": { de: "Relais (IDR)", it: "Ripetitore (IDR)" },
  "Nouveau nom d’appel": { de: "Neuer Rufname", it: "Nuovo nominativo" },
  "Ce nom d’appel existe déjà.": {
    de: "Dieser Rufname existiert bereits.",
    it: "Questo nominativo esiste già.",
  },
  "L’alternative doit différer du groupe principal.": {
    de: "Die Ausweichgruppe muss sich von der Hauptgruppe unterscheiden.",
    it: "L’alternativa deve differire dal gruppo principale.",
  },
  "PC front, Chef sct appui": {
    de: "KP Front, Zugführer Unterstützung",
    it: "PC avanzato, capo sezione appoggio",
  },
  "Désigne la fonction, jamais la personne.": {
    de: "Bezeichnet die Funktion, nie die Person.",
    it: "Designa la funzione, mai la persona.",
  },
  "Section / élément": { de: "Zug / Element", it: "Sezione / elemento" },
  "Groupe principal": { de: "Hauptgruppe", it: "Gruppo principale" },
  "Station de transit, horaires": {
    de: "Relaisstation, Zeiten",
    it: "Stazione di transito, orari",
  },
  "Terminal {label}": { de: "Endgerät {label}", it: "Terminale {label}" },
  "Nouveau terminal": { de: "Neues Endgerät", it: "Nuovo terminale" },
  "Ce numéro de terminal existe déjà.": {
    de: "Diese Endgerätenummer existiert bereits.",
    it: "Questo numero di terminale esiste già.",
  },
  "N° interne": { de: "Interne Nr.", it: "N. interno" },
  "N° de série": { de: "Seriennummer", it: "N. di serie" },
  "Remis à {holder}. Enregistrez le retour pour clore la remise.": {
    de: "Abgegeben an {holder}. Erfassen Sie die Rücknahme, um die Abgabe abzuschliessen.",
    it: "Consegnato a {holder}. Registrare la restituzione per chiudere la consegna.",
  },
  "Terminal perdu : annoncez-le pour blocage selon la procédure cantonale.": {
    de: "Endgerät verloren: Melden Sie es zur Sperrung gemäss kantonalem Verfahren.",
    it: "Terminale perso: annunciarlo per il blocco secondo la procedura cantonale.",
  },
  "Série de terminaux": { de: "Endgeräteserie", it: "Serie di terminali" },
  "Ajouter {n}": { de: "{n} hinzufügen", it: "Aggiungi {n}" },
  Préfixe: { de: "Präfix", it: "Prefisso" },
  "Premier n°": { de: "Erste Nr.", it: "Primo n." },
  Nombre: { de: "Anzahl", it: "Quantità" },
  "numéros existants ignorés": {
    de: "bestehende Nummern übersprungen",
    it: "numeri esistenti ignorati",
  },
  "Remettre {label}": { de: "{label} abgeben", it: "Consegna {label}" },
  "Remettre un terminal": {
    de: "Endgerät abgeben",
    it: "Consegna un terminale",
  },
  "Aucun terminal disponible.": {
    de: "Kein Endgerät verfügbar.",
    it: "Nessun terminale disponibile.",
  },
  "Détenteur requis.": {
    de: "Inhaber erforderlich.",
    it: "Detentore obbligatorio.",
  },
  "Heure de remise": { de: "Abgabezeit", it: "Ora di consegna" },
  "{label} signalé à recharger.": {
    de: "{label} als aufzuladen gemeldet.",
    it: "{label} segnalato da ricaricare.",
  },
  "{callsign} détient déjà {terminal} ({holder}).": {
    de: "{callsign} hat bereits {terminal} ({holder}).",
    it: "{callsign} detiene già {terminal} ({holder}).",
  },
  "Nom d’appel absent du plan du réseau.": {
    de: "Rufname nicht im Netzplan.",
    it: "Nominativo assente dal piano della rete.",
  },
  "Grade, nom": { de: "Grad, Name", it: "Grado, nome" },
  Section: { de: "Zug", it: "Sezione" },
  "Accessoires remis": {
    de: "Abgegebenes Zubehör",
    it: "Accessori consegnati",
  },
  Batterie: { de: "Akku", it: "Batteria" },
  "Consigner la remise au journal": {
    de: "Abgabe im Journal erfassen",
    it: "Registrare la consegna nel diario",
  },
  "Imprimer la quittance de remise à signer": {
    de: "Abgabequittung zum Unterschreiben drucken",
    it: "Stampare la quittanza di consegna da firmare",
  },
  "Retour {label}": { de: "Rücknahme {label}", it: "Restituzione {label}" },
  "Enregistrer le retour": {
    de: "Rücknahme speichern",
    it: "Registra la restituzione",
  },
  "Retour incomplet. Remis : {list}.": {
    de: "Rücknahme unvollständig. Abgegeben: {list}.",
    it: "Restituzione incompleta. Consegnato: {list}.",
  },
  "aucun accessoire": { de: "kein Zubehör", it: "nessun accessorio" },
  "Heure de retour": { de: "Rücknahmezeit", it: "Ora di restituzione" },
  "État au retour": {
    de: "Zustand bei Rücknahme",
    it: "Stato alla restituzione",
  },
  "Retour complet (terminal et accessoires)": {
    de: "Rücknahme vollständig (Endgerät und Zubehör)",
    it: "Restituzione completa (terminale e accessori)",
  },
  "Annoncez la perte pour blocage du terminal selon la procédure cantonale.": {
    de: "Melden Sie den Verlust zur Sperrung des Endgeräts gemäss kantonalem Verfahren.",
    it: "Annunciare la perdita per il blocco del terminale secondo la procedura cantonale.",
  },
  "Consigner le retour au journal": {
    de: "Rücknahme im Journal erfassen",
    it: "Registrare la restituzione nel diario",
  },
  "Contrôle de liaison": {
    de: "Verbindungskontrolle",
    it: "Controllo dei collegamenti",
  },
  "Nom d’appel requis.": {
    de: "Rufname erforderlich.",
    it: "Nominativo obbligatorio.",
  },
  "Emplacement, antenne": {
    de: "Standort, Antenne",
    it: "Ubicazione, antenna",
  },
  "Consigner au journal": {
    de: "Im Journal erfassen",
    it: "Registrare nel diario",
  },
  // General check
  "Contrôle de liaison général": {
    de: "Allgemeine Verbindungskontrolle",
    it: "Controllo generale dei collegamenti",
  },
  "Groupe principal de chaque station": {
    de: "Hauptgruppe jeder Station",
    it: "Gruppo principale di ogni stazione",
  },
  "« À … de …, contrôle de liaison, répondez. » Noter l’audibilité de chaque réponse. Les stations sans réponse notée ne sont pas enregistrées.":
    {
      de: "« An … von …, Verbindungskontrolle, antworten. » Verständlichkeit jeder Antwort notieren. Stationen ohne notierte Antwort werden nicht gespeichert.",
      it: "« A … da …, controllo dei collegamenti, rispondete. » Annotare l’udibilità di ogni risposta. Le stazioni senza risposta annotata non vengono registrate.",
    },
  "Titulaire · terminal": {
    de: "Inhaber · Endgerät",
    it: "Titolare · terminale",
  },
  "Aucun nom d’appel au plan du réseau.": {
    de: "Kein Rufname im Netzplan.",
    it: "Nessun nominativo nel piano della rete.",
  },
  "Consigner le résultat au journal (une entrée de synthèse)": {
    de: "Ergebnis im Journal erfassen (ein zusammenfassender Eintrag)",
    it: "Registrare il risultato nel diario (una voce di sintesi)",
  },
  "{done} / {total} notés": {
    de: "{done} / {total} notiert",
    it: "{done} / {total} annotati",
  },
  "Enregistrer {n} contrôle": {
    de: "{n} Kontrolle speichern",
    it: "Registra {n} controllo",
  },
  "Enregistrer {n} contrôles": {
    de: "{n} Kontrollen speichern",
    it: "Registra {n} controlli",
  },
  // Scanner
  "Ouverture de la caméra…": {
    de: "Kamera wird geöffnet …",
    it: "Apertura della fotocamera…",
  },
  "Scanner un terminal": {
    de: "Endgerät scannen",
    it: "Scansiona un terminale",
  },
  "N° du terminal, ex. R-04": {
    de: "Endgerät-Nr., z. B. R-04",
    it: "N. del terminale, es. R-04",
  },
  "N° du terminal": { de: "Endgerät-Nr.", it: "N. del terminale" },
  "Lecture de QR indisponible dans ce navigateur. Saisir le numéro, ou scanner l’étiquette avec l’appareil photo du téléphone : le lien ouvre ce terminal dans orion aic.":
    {
      de: "QR-Lesen ist in diesem Browser nicht verfügbar. Nummer eingeben oder die Etikette mit der Kamera des Telefons scannen: Der Link öffnet dieses Endgerät in orion aic.",
      it: "Lettura QR non disponibile in questo browser. Inserire il numero, o scansionare l’etichetta con la fotocamera del telefono: il link apre questo terminale in orion aic.",
    },
  "QR lu, terminal inconnu : {value}": {
    de: "QR gelesen, unbekanntes Endgerät: {value}",
    it: "QR letto, terminale sconosciuto: {value}",
  },
  "Aucun terminal « {value} ».": {
    de: "Kein Endgerät « {value} ».",
    it: "Nessun terminale « {value} ».",
  },
} satisfies Dict);
