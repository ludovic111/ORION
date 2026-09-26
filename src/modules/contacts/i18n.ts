import { translator, type Dict } from "../../../shared/i18n/core.ts";
import { common } from "../../../shared/i18n/common.ts";

// Texts of the directory (Contacts.tsx, contactFiles.ts).
export const { t, tn, tIn, dict } = translator({
  ...common,
  // contactFiles.ts
  "Autres numéros : {list}": {
    de: "Weitere Nummern: {list}",
    it: "Altri numeri: {list}",
  },
  "Autres e-mails : {list}": {
    de: "Weitere E-Mails: {list}",
    it: "Altri e-mail: {list}",
  },
  "Colonne « Nom » introuvable. La première ligne doit contenir les titres des colonnes (Nom, Organisation, Téléphone…).":
    {
      de: "Spalte « Name » nicht gefunden. Die erste Zeile muss die Spaltentitel enthalten (Name, Organisation, Telefon …).",
      it: "Colonna « Nome » non trovata. La prima riga deve contenere i titoli delle colonne (Nome, Organizzazione, Telefono…).",
    },
  "Téléphone 2": { de: "Telefon 2", it: "Telefono 2" },
  Favori: { de: "Favorit", it: "Preferito" },
  oui: { de: "ja", it: "sì" },
  // Contacts.tsx
  "Ce contact n’existe plus.": {
    de: "Dieser Kontakt existiert nicht mehr.",
    it: "Questo contatto non esiste più.",
  },
  "Sans catégorie": { de: "Ohne Kategorie", it: "Senza categoria" },
  Favoris: { de: "Favoriten", it: "Preferiti" },
  "Les numéros d’urgence suisses sont déjà dans la liste.": {
    de: "Die Schweizer Notrufnummern sind bereits in der Liste.",
    it: "I numeri d’emergenza svizzeri sono già nell’elenco.",
  },
  "{n} numéro d’urgence ajouté.": {
    de: "{n} Notrufnummer hinzugefügt.",
    it: "{n} numero d’emergenza aggiunto.",
  },
  "{n} numéros d’urgence ajoutés.": {
    de: "{n} Notrufnummern hinzugefügt.",
    it: "{n} numeri d’emergenza aggiunti.",
  },
  "{label} copié.": { de: "{label} kopiert.", it: "Copiato: {label}." },
  "Copie impossible. {label} : {text}": {
    de: "Kopieren nicht möglich. {label}: {text}",
    it: "Copia impossibile. {label}: {text}",
  },
  "Fichier trop volumineux : 2 Mo au maximum.": {
    de: "Datei zu gross: höchstens 2 MB.",
    it: "File troppo voluminoso: al massimo 2 MB.",
  },
  "Aucun contact trouvé dans ce fichier.": {
    de: "Keine Kontakte in dieser Datei gefunden.",
    it: "Nessun contatto trovato in questo file.",
  },
  "Lecture impossible : {error}": {
    de: "Lesen nicht möglich: {error}",
    it: "Lettura impossibile: {error}",
  },
  "contacts (fichier)": { fr: "contacts", de: "kontakte", it: "contatti" },
  "{n} contact exporté.": {
    de: "{n} Kontakt exportiert.",
    it: "{n} contatto esportato.",
  },
  "{n} contacts exportés.": {
    de: "{n} Kontakte exportiert.",
    it: "{n} contatti esportati.",
  },
  "{n} contact": { de: "{n} Kontakt", it: "{n} contatto" },
  "{n} contacts": { de: "{n} Kontakte", it: "{n} contatti" },
  "Fonction · organisation": {
    de: "Funktion · Organisation",
    it: "Funzione · organizzazione",
  },
  Téléphones: { de: "Telefone", it: "Telefoni" },
  "Adresse · remarques": {
    de: "Adresse · Bemerkungen",
    it: "Indirizzo · note",
  },
  "Aucun contact à imprimer.": {
    de: "Keine Kontakte zum Drucken.",
    it: "Nessun contatto da stampare.",
  },
  "Annuaire des contacts": {
    de: "Kontaktverzeichnis",
    it: "Rubrica dei contatti",
  },
  "Établi par {author}": {
    de: "Erstellt von {author}",
    it: "Redatto da {author}",
  },
  Identité: { de: "Identität", it: "Identità" },
  "Personne ou service, ex. Commune · voirie": {
    de: "Person oder Dienst, z. B. Gemeinde · Werkhof",
    it: "Persona o servizio, es. Comune · servizio stradale",
  },
  "Toujours en tête de liste": {
    de: "Immer zuoberst in der Liste",
    it: "Sempre in cima all’elenco",
  },
  Joindre: { de: "Erreichen", it: "Raggiungere" },
  "Radio / nom d’appel": { de: "Funk / Rufname", it: "Radio / nominativo" },
  Détails: { de: "Details", it: "Dettagli" },
  "Ajouter les numéros d’urgence suisses": {
    de: "Schweizer Notrufnummern hinzufügen",
    it: "Aggiungi i numeri d’emergenza svizzeri",
  },
  "Importer un fichier": { de: "Datei importieren", it: "Importa un file" },
  "vCard (.vcf) ou tableau (.csv), lu sur cet appareil": {
    de: "vCard (.vcf) oder Tabelle (.csv), auf diesem Gerät gelesen",
    it: "vCard (.vcf) o tabella (.csv), letto su questo dispositivo",
  },
  "Exporter en CSV": { de: "Als CSV exportieren", it: "Esporta in CSV" },
  "Pour Excel ou une autre application": {
    de: "Für Excel oder eine andere Anwendung",
    it: "Per Excel o un’altra applicazione",
  },
  "Imprimer l’annuaire": {
    de: "Verzeichnis drucken",
    it: "Stampa la rubrica",
  },
  "A4, classé par catégorie": {
    de: "A4, nach Kategorie geordnet",
    it: "A4, ordinata per categoria",
  },
  Plus: { de: "Mehr", it: "Altro" },
  "Nouveau contact": { de: "Neuer Kontakt", it: "Nuovo contatto" },
  "L’annuaire est vide": {
    de: "Das Verzeichnis ist leer",
    it: "La rubrica è vuota",
  },
  "Importer (.vcf, .csv)": {
    de: "Importieren (.vcf, .csv)",
    it: "Importa (.vcf, .csv)",
  },
  "Gardez sous la main les numéros des partenaires, autorités et fournisseurs. Un clic sur un numéro l’appelle depuis un téléphone.":
    {
      de: "Halten Sie die Nummern von Partnern, Behörden und Lieferanten griffbereit. Ein Klick auf eine Nummer ruft sie von einem Telefon aus an.",
      it: "Tenete a portata di mano i numeri di partner, autorità e fornitori. Un clic su un numero lo chiama da un telefono.",
    },
  "Nom, organisation, numéro…": {
    de: "Name, Organisation, Nummer …",
    it: "Nome, organizzazione, numero…",
  },
  "Rechercher un contact": { de: "Kontakt suchen", it: "Cerca un contatto" },
  Classement: { de: "Sortierung", it: "Ordinamento" },
  "Par catégorie": { de: "Nach Kategorie", it: "Per categoria" },
  "A–Z": { de: "A–Z", it: "A–Z" },
  "Filtrer par catégorie": {
    de: "Nach Kategorie filtern",
    it: "Filtra per categoria",
  },
  "Aucun contact ne correspond.": {
    de: "Kein Kontakt entspricht der Suche.",
    it: "Nessun contatto corrisponde.",
  },
  "Tout afficher": { de: "Alle anzeigen", it: "Mostra tutto" },
  "un contact": { de: "einen Kontakt", it: "un contatto" },
  "Le nom est nécessaire.": {
    de: "Der Name ist erforderlich.",
    it: "Il nome è necessario.",
  },
  "Appeler {phone}": { de: "{phone} anrufen", it: "Chiama {phone}" },
  Écrire: { de: "Schreiben", it: "Scrivi" },
  "{n} contact importé.": {
    de: "{n} Kontakt importiert.",
    it: "{n} contatto importato.",
  },
  "{n} contacts importés.": {
    de: "{n} Kontakte importiert.",
    it: "{n} contatti importati.",
  },
  Numéro: { de: "Nummer", it: "Numero" },
  "Retirer {name} des favoris": {
    de: "{name} aus den Favoriten entfernen",
    it: "Rimuovi {name} dai preferiti",
  },
  "Ajouter {name} aux favoris": {
    de: "{name} zu den Favoriten hinzufügen",
    it: "Aggiungi {name} ai preferiti",
  },
  "Retirer des favoris": {
    de: "Aus den Favoriten entfernen",
    it: "Rimuovi dai preferiti",
  },
  "Ajouter aux favoris": {
    de: "Zu den Favoriten hinzufügen",
    it: "Aggiungi ai preferiti",
  },
  "Appeler {name} au {phone}": {
    de: "{name} unter {phone} anrufen",
    it: "Chiama {name} al {phone}",
  },
  "Copier le numéro {phone}": {
    de: "Nummer {phone} kopieren",
    it: "Copia il numero {phone}",
  },
  "Copier l’adresse e-mail {email}": {
    de: "E-Mail-Adresse {email} kopieren",
    it: "Copia l’indirizzo e-mail {email}",
  },
  "Copier l’adresse {address}": {
    de: "Adresse {address} kopieren",
    it: "Copia l’indirizzo {address}",
  },
  "{n} lien": { de: "{n} Verknüpfung", it: "{n} collegamento" },
  "{n} liens": { de: "{n} Verknüpfungen", it: "{n} collegamenti" },
  Voir: { de: "Ansehen", it: "Vedi" },
  "Importer des contacts": {
    de: "Kontakte importieren",
    it: "Importa contatti",
  },
  "{n} à importer": { de: "{n} zu importieren", it: "{n} da importare" },
  "{n} déjà présent, ignoré": {
    de: "{n} bereits vorhanden, übersprungen",
    it: "{n} già presente, ignorato",
  },
  "{n} déjà présents, ignorés": {
    de: "{n} bereits vorhanden, übersprungen",
    it: "{n} già presenti, ignorati",
  },
  "{n} au-delà de la limite de 5000": {
    de: "{n} über der Grenze von 5000",
    it: "{n} oltre il limite di 5000",
  },
  "… et {n} autre.": { de: "… und {n} weiterer.", it: "… e {n} altro." },
  "… et {n} autres.": { de: "… und {n} weitere.", it: "… e altri {n}." },
  "Rien de nouveau : tous ces contacts sont déjà dans l’annuaire.": {
    de: "Nichts Neues: Alle diese Kontakte sind bereits im Verzeichnis.",
    it: "Niente di nuovo: tutti questi contatti sono già nella rubrica.",
  },
  "Le fichier est lu sur cet appareil, rien n’est envoyé sur internet.": {
    de: "Die Datei wird auf diesem Gerät gelesen, nichts wird ins Internet gesendet.",
    it: "Il file è letto su questo dispositivo, nulla viene inviato su internet.",
  },
  "Importer {n} contact": {
    de: "{n} Kontakt importieren",
    it: "Importa {n} contatto",
  },
  "Importer {n} contacts": {
    de: "{n} Kontakte importieren",
    it: "Importa {n} contatti",
  },
} satisfies Dict);
