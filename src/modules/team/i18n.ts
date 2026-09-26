import { translator, type Dict } from "../../../shared/i18n/core.ts";
import { common } from "../../../shared/i18n/common.ts";

// Team page: organisation chart and list (Team.tsx), record sheets
// (TeamSheets.tsx) and presences, shifts (Presence.tsx).
export const { t, tn, tIn, dict } = translator({
  ...common,
  // "Poste" here is a unit of the organisation (PC front, cellule…), not a
  // computer (common "Poste").
  "Poste (unité)": { fr: "Poste", de: "Posten", it: "Posto" },
  "Sans poste": { de: "Ohne Posten", it: "Senza posto" },
  "Nouveau poste": { de: "Neuer Posten", it: "Nuovo posto" },
  "Poste / cellule": { de: "Posten / Zelle", it: "Posto / cellula" },
  "Postes et cellules": { de: "Posten und Zellen", it: "Posti e cellule" },
  "un poste ou une cellule": {
    de: "einen Posten oder eine Zelle",
    it: "un posto o una cellula",
  },
  "une personne": { de: "eine Person", it: "una persona" },
  Grade: { de: "Grad", it: "Grado" },
  "Nom d’appel": { de: "Rufname", it: "Nominativo" },
  "Nom d’appel radio": { de: "Funk-Rufname", it: "Nominativo radio" },
  "Radio / nom d’appel": { de: "Funk / Rufname", it: "Radio / nominativo" },
  Service: { de: "Dienst", it: "Servizio" },
  "Nom et prénom": { de: "Name und Vorname", it: "Cognome e nome" },
  Couleur: { de: "Farbe", it: "Colore" },
  "Couleur {color}": { de: "Farbe {color}", it: "Colore {color}" },
  "Autre couleur": { de: "Andere Farbe", it: "Altro colore" },
  Automatique: { de: "Automatisch", it: "Automatico" },
  Emplacement: { de: "Standort", it: "Ubicazione" },
  "Indiquez au moins le nom.": {
    de: "Geben Sie mindestens den Namen an.",
    it: "Indicare almeno il nome.",
  },
  "Indiquez le nom du poste ou de la cellule.": {
    de: "Geben Sie den Namen des Postens oder der Zelle an.",
    it: "Indicare il nome del posto o della cellula.",
  },
  "Supprimer ce poste ne supprime pas les personnes : elles passent « Sans poste ».":
    {
      de: "Das Löschen dieses Postens löscht die Personen nicht: Sie werden « Ohne Posten ».",
      it: "Eliminare questo posto non elimina le persone: passano « Senza posto ».",
    },
  // Team.tsx
  "dès {time}": { de: "ab {time}", it: "dalle {time}" },
  "jusqu’à {time}": { de: "bis {time}", it: "fino alle {time}" },
  "{name} → {cell}": { de: "{name} → {cell}", it: "{name} → {cell}" },
  "{name} : {status}.": { de: "{name}: {status}.", it: "{name}: {status}." },
  "Ces postes existent déjà.": {
    de: "Diese Posten existieren bereits.",
    it: "Questi posti esistono già.",
  },
  "{n} poste créé.": { de: "{n} Posten erstellt.", it: "{n} posto creato." },
  "{n} postes créés.": { de: "{n} Posten erstellt.", it: "{n} posti creati." },
  "Tél. {phone}": { de: "Tel. {phone}", it: "Tel. {phone}" },
  "Radio {radio}": { de: "Funk {radio}", it: "Radio {radio}" },
  "{present} présent(s) sur {total}": {
    de: "{present} von {total} anwesend",
    it: "{present} presenti su {total}",
  },
  "{n} personne(s)": { de: "{n} Person(en)", it: "{n} persona/e" },
  "Équipe et postes": { de: "Team und Posten", it: "Squadra e posti" },
  "Établi par {author}": {
    de: "Erstellt von {author}",
    it: "Redatto da {author}",
  },
  equipe: { de: "team", it: "squadra" },
  "Nouvelle personne": { de: "Neue Person", it: "Nuova persona" },
  "Qui fait quoi ?": { de: "Wer macht was?", it: "Chi fa cosa?" },
  "Créer PC front et PC arrière": {
    de: "KP Front und KP Rück erstellen",
    it: "Creare PC avanzato e PC arretrato",
  },
  "Structure type d’un PC": {
    de: "Standardstruktur eines KP",
    it: "Struttura tipo di un PC",
  },
  "Ajouter une personne": { de: "Person hinzufügen", it: "Aggiungi persona" },
  "Organisez l’équipe par poste (PC front, PC arrière) et par cellule : nom, grade, fonction, nom d’appel, téléphone et présence. Tout reste modifiable.":
    {
      de: "Organisieren Sie das Team nach Posten (KP Front, KP Rück) und Zelle: Name, Grad, Funktion, Rufname, Telefon und Anwesenheit. Alles bleibt änderbar.",
      it: "Organizzare la squadra per posto (PC avanzato, PC arretrato) e per cellula: nome, grado, funzione, nominativo, telefono e presenza. Tutto resta modificabile.",
    },
  Présences: { de: "Anwesenheiten", it: "Presenze" },
  Personnes: { de: "Personen", it: "Persone" },
  "Rechercher un nom, une fonction, un nom d’appel…": {
    de: "Name, Funktion, Rufname suchen …",
    it: "Cercare un nome, una funzione, un nominativo…",
  },
  "Rechercher une personne": { de: "Person suchen", it: "Cercare una persona" },
  "Compléter la structure type": {
    de: "Standardstruktur ergänzen",
    it: "Completare la struttura tipo",
  },
  Affichage: { de: "Anzeige", it: "Visualizzazione" },
  Organigramme: { de: "Organigramm", it: "Organigramma" },
  Liste: { de: "Liste", it: "Lista" },
  "Personne ne correspond à « {query} ».": {
    de: "Niemand entspricht « {query} ».",
    it: "Nessuno corrisponde a « {query} ».",
  },
  "Placer {name} plus tôt": {
    de: "{name} weiter vorne platzieren",
    it: "Spostare {name} più avanti",
  },
  "Déplacer avant": { de: "Nach vorne verschieben", it: "Spostare prima" },
  "Placer {name} plus loin": {
    de: "{name} weiter hinten platzieren",
    it: "Spostare {name} più indietro",
  },
  "Déplacer après": { de: "Nach hinten verschieben", it: "Spostare dopo" },
  "Modifier {name}": { de: "{name} bearbeiten", it: "Modificare {name}" },
  "{n} présent sur {total}": {
    de: "{n} von {total} anwesend",
    it: "{n} presente su {total}",
  },
  "{n} présents sur {total}": {
    de: "{n} von {total} anwesend",
    it: "{n} presenti su {total}",
  },
  "Personne (aucune)": { fr: "Personne", de: "Niemand", it: "Nessuno" },
  "Aucun résultat": { de: "Kein Ergebnis", it: "Nessun risultato" },
  "Glisser une personne ici": {
    de: "Person hierher ziehen",
    it: "Trascinare una persona qui",
  },
  "{status} : {n}": { de: "{status}: {n}", it: "{status}: {n}" },
  "Statut : {status}. Cliquer pour passer à « {next} ».": {
    de: "Status: {status}. Klicken, um zu « {next} » zu wechseln.",
    it: "Stato: {status}. Fare clic per passare a « {next} ».",
  },
  "Statut {status}, passer à {next}": {
    de: "Status {status}, zu {next} wechseln",
    it: "Stato {status}, passare a {next}",
  },
  "Déplacer {name} vers…": {
    de: "{name} verschieben nach …",
    it: "Spostare {name} verso…",
  },
  "Déplacer vers…": { de: "Verschieben nach …", it: "Spostare verso…" },
  "Service : {from} → {to}": {
    de: "Dienst: {from} → {to}",
    it: "Servizio: {from} → {to}",
  },
  Actions: { de: "Aktionen", it: "Azioni" },
  "Aucune personne.": { de: "Keine Personen.", it: "Nessuna persona." },
  // Presence.tsx
  "Badge inconnu dans ce journal.": {
    de: "Badge in diesem Journal unbekannt.",
    it: "Badge sconosciuto in questo diario.",
  },
  "Départ de {name} à {time}.": {
    de: "Abgang von {name} um {time}.",
    it: "Partenza di {name} alle {time}.",
  },
  "Arrivée de {name} à {time} — repos trop court (reprise prévue dès {rest}).":
    {
      de: "Ankunft von {name} um {time} — Ruhezeit zu kurz (Wiederaufnahme vorgesehen ab {rest}).",
      it: "Arrivo di {name} alle {time} — riposo troppo breve (ripresa prevista dalle {rest}).",
    },
  "Arrivée de {name} à {time}.": {
    de: "Ankunft von {name} um {time}.",
    it: "Arrivo di {name} alle {time}.",
  },
  "Liste de présence": { de: "Anwesenheitsliste", it: "Lista delle presenze" },
  "{n} présent(s) · maximum {duty} h de service, repos {rest} h": {
    de: "{n} anwesend · höchstens {duty} h Dienst, Ruhezeit {rest} h",
    it: "Presenti: {n} · massimo {duty} h di servizio, riposo {rest} h",
  },
  "liste-de-presence": {
    de: "anwesenheitsliste",
    it: "lista-delle-presenze",
  },
  "Présents maintenant": { de: "Jetzt anwesend", it: "Presenti ora" },
  Depuis: { de: "Seit", it: "Da" },
  Signature: { de: "Unterschrift", it: "Firma" },
  " (dépassé)": { de: " (überschritten)", it: " (superato)" },
  "Arrivées et départs": {
    de: "Ankünfte und Abgänge",
    it: "Arrivi e partenze",
  },
  "{n} passage(s)": { de: "{n} Durchgang/Durchgänge", it: "{n} passaggio/i" },
  Arrivée: { de: "Ankunft", it: "Arrivo" },
  Départ: { de: "Abgang", it: "Partenza" },
  Par: { de: "Durch", it: "Tramite" },
  présent: { de: "anwesend", it: "presente" },
  parti: { de: "gegangen", it: "partito" },
  Bouton: { de: "Schaltfläche", it: "Pulsante" },
  Saisie: { de: "Eingabe", it: "Inserimento" },
  "Plan de relève": { de: "Ablösungsplan", it: "Piano di avvicendamento" },
  "{n} relève(s)": { de: "{n} Ablösung(en)", it: "{n} avvicendamento/i" },
  "Présences au PC": { de: "Anwesenheiten im KP", it: "Presenze al PC" },
  "Au PC": { de: "Im KP", it: "Al PC" },
  "Temps ou repos à surveiller": {
    de: "Dienst- oder Ruhezeit beachten",
    it: "Tempo o riposo da sorvegliare",
  },
  "Relève en cours": { de: "Laufende Ablösung", it: "Avvicendamento in corso" },
  "Scanner un badge": { de: "Badge scannen", it: "Scansionare un badge" },
  "Badges QR": { de: "QR-Badges", it: "Badge QR" },
  Appel: { de: "Appell", it: "Appello" },
  "Ajoutez d’abord les personnes dans l’organigramme : chacune pourra ensuite pointer son arrivée et son départ.":
    {
      de: "Fügen Sie zuerst die Personen im Organigramm hinzu: Jede kann danach ihre Ankunft und ihren Abgang erfassen.",
      it: "Aggiungere prima le persone nell’organigramma: ognuna potrà poi registrare il proprio arrivo e la propria partenza.",
    },
  "retiré de l’équipe · {state}": {
    de: "aus dem Team entfernt · {state}",
    it: "tolto dalla squadra · {state}",
  },
  Planifier: { de: "Planen", it: "Pianifica" },
  "Relève {n}": { de: "Ablösung {n}", it: "Avvicendamento {n}" },
  "Aucune relève prévue. « Planifier » crée par exemple trois relèves de 8 heures à partir de l’heure choisie.":
    {
      de: "Keine Ablösung vorgesehen. « Planen » erstellt zum Beispiel drei Ablösungen zu 8 Stunden ab der gewählten Zeit.",
      it: "Nessun avvicendamento previsto. « Pianifica » crea per esempio tre avvicendamenti di 8 ore a partire dall’ora scelta.",
    },
  "Personne encore": { de: "Noch niemand", it: "Ancora nessuno" },
  "Service maximum (h)": {
    de: "Maximaler Dienst (h)",
    it: "Servizio massimo (h)",
  },
  "Repos minimum (h)": { de: "Minimale Ruhezeit (h)", it: "Riposo minimo (h)" },
  "Scanner un badge de présence": {
    de: "Anwesenheitsbadge scannen",
    it: "Scansionare un badge di presenza",
  },
  "Nom ou nom d’appel": { de: "Name oder Rufname", it: "Nome o nominativo" },
  "Nom de la personne": { de: "Name der Person", it: "Nome della persona" },
  "Lecture de QR indisponible dans ce navigateur. Tapez le nom, ou scannez le badge avec l’appareil photo du téléphone : le lien ouvre l’appel de cette personne.":
    {
      de: "QR-Lesen ist in diesem Browser nicht verfügbar. Geben Sie den Namen ein oder scannen Sie den Badge mit der Handykamera: Der Link öffnet den Appell dieser Person.",
      it: "Lettura QR non disponibile in questo browser. Digitare il nome, o scansionare il badge con la fotocamera del telefono: il link apre l’appello di questa persona.",
    },
  "Personne inconnue : {value}": {
    de: "Unbekannte Person: {value}",
    it: "Persona sconosciuta: {value}",
  },
  "Badge de présence": { de: "Anwesenheitsbadge", it: "Badge di presenza" },
  "Pointer le départ": { de: "Abgang erfassen", it: "Registrare la partenza" },
  "Pointer l’arrivée": { de: "Ankunft erfassen", it: "Registrare l’arrivo" },
  "au PC depuis {stay}": { de: "im KP seit {stay}", it: "al PC dalle {stay}" },
  "au PC depuis {stay}, service compté depuis {since}": {
    de: "im KP seit {stay}, Dienst gezählt ab {since}",
    it: "al PC dalle {stay}, servizio contato dalle {since}",
  },
  "parti à {time}, repos {duration}": {
    de: "gegangen um {time}, Ruhezeit {duration}",
    it: "partito alle {time}, riposo {duration}",
  },
  "parti à {time}, repos {duration} · reprise dès {rest}": {
    de: "gegangen um {time}, Ruhezeit {duration} · Wiederaufnahme ab {rest}",
    it: "partito alle {time}, riposo {duration} · ripresa dalle {rest}",
  },
  "pas encore pointé": {
    de: "noch nicht erfasst",
    it: "non ancora registrato",
  },
  "Temps de service": { de: "Dienstzeit", it: "Tempo di servizio" },
  "Badge de {name}": { de: "Badge von {name}", it: "Badge di {name}" },
  "Imprimer le badge": { de: "Badge drucken", it: "Stampa il badge" },
  "Planifier des relèves": {
    de: "Ablösungen planen",
    it: "Pianificare avvicendamenti",
  },
  "Début de la première relève": {
    de: "Beginn der ersten Ablösung",
    it: "Inizio del primo avvicendamento",
  },
  "Durée (heures)": { de: "Dauer (Stunden)", it: "Durata (ore)" },
  "Nombre de relèves": {
    de: "Anzahl Ablösungen",
    it: "Numero di avvicendamenti",
  },
  "{title} : {start} → {end}": {
    de: "{title}: {start} → {end}",
    it: "{title}: {start} → {end}",
  },
  "{n} relève(s) planifiée(s). Ajoutez les personnes.": {
    de: "{n} Ablösung(en) geplant. Fügen Sie die Personen hinzu.",
    it: "{n} avvicendamento/i pianificato/i. Aggiungere le persone.",
  },
  "Donnez un nom à la relève.": {
    de: "Geben Sie der Ablösung einen Namen.",
    it: "Dare un nome all’avvicendamento.",
  },
  "La fin doit suivre le début.": {
    de: "Das Ende muss nach dem Beginn liegen.",
    it: "La fine deve seguire l’inizio.",
  },
  "Relève enregistrée.": {
    de: "Ablösung gespeichert.",
    it: "Avvicendamento salvato.",
  },
  "Nouvelle relève": { de: "Neue Ablösung", it: "Nuovo avvicendamento" },
  "Lecture seule.": { de: "Nur lesen.", it: "Sola lettura." },
  "Supprimer cette relève ?": {
    de: "Diese Ablösung löschen?",
    it: "Eliminare questo avvicendamento?",
  },
  "Relève supprimée.": {
    de: "Ablösung gelöscht.",
    it: "Avvicendamento eliminato.",
  },
  "Personnes de la relève": {
    de: "Personen der Ablösung",
    it: "Persone dell’avvicendamento",
  },
  "Autres personnes (texte libre)": {
    de: "Weitere Personen (Freitext)",
    it: "Altre persone (testo libero)",
  },
} satisfies Dict);
