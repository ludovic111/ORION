import { translator, type Dict } from "../../shared/i18n/core.ts";
import { common } from "../../shared/i18n/common.ts";
import { enumLabel } from "../../shared/i18n/enums.ts";

// Presentation mode, slide decks and their files (PowerPoint, OpenDocument,
// PDF, HTML). The deck is built in the language of the post; journal data
// (entries, boards, names, facts) stays as written.
export const { t, tn, tIn, dict } = translator({
  ...common,

  // ---------- Kinds of slides (deck.ts SLIDE_INFO) ----------
  "Opération, version présentée, orateur": {
    de: "Ereignis, präsentierte Version, Referent",
    it: "Operazione, versione presentata, relatore",
  },
  "Situation générale": { de: "Allgemeine Lage", it: "Situazione generale" },
  "Tableaux de situation, idée de manœuvre": {
    de: "Lagetafeln, Einsatzidee",
    it: "Tabelle della situazione, idea di manovra",
  },
  "Chiffres clés": { de: "Kennzahlen", it: "Cifre chiave" },
  "Renseignements clés et évolution": {
    de: "Schlüsselinformationen und Entwicklung",
    it: "Informazioni chiave ed evoluzione",
  },
  "Une diapositive par carte, avec légende": {
    de: "Eine Folie pro Karte, mit Legende",
    it: "Una diapositiva per carta, con legenda",
  },
  "Ce qui a changé": { de: "Was sich geändert hat", it: "Cosa è cambiato" },
  "Depuis le dernier point de situation": {
    de: "Seit dem letzten Lagerapport",
    it: "Dall’ultimo punto della situazione",
  },
  "Faits marquants": { de: "Wichtige Ereignisse", it: "Fatti salienti" },
  "Entrées importantes, urgentes et décisions": {
    de: "Wichtige und dringende Einträge, Entscheide",
    it: "Voci importanti, urgenti e decisioni",
  },
  "Missions en cours": { de: "Laufende Aufträge", it: "Missioni in corso" },
  "À traiter, en cours, en retard": {
    de: "Zu bearbeiten, in Bearbeitung, überfällig",
    it: "Da trattare, in corso, in ritardo",
  },
  "Engagés, disponibles, par organisation": {
    de: "Im Einsatz, verfügbar, nach Organisation",
    it: "Impiegati, disponibili, per organizzazione",
  },
  "Postes, cellules et fonctions clés": {
    de: "Posten, Zellen und Schlüsselfunktionen",
    it: "Posti, cellule e funzioni chiave",
  },
  "Réseau radio": { de: "Funknetz", it: "Rete radio" },
  "Terminaux, groupes, liaisons": {
    de: "Endgeräte, Gesprächsgruppen, Verbindungen",
    it: "Terminali, gruppi di conversazione, collegamenti",
  },
  "Conditions, prochaines heures, alertes": {
    de: "Bedingungen, nächste Stunden, Warnungen",
    it: "Condizioni, prossime ore, allerte",
  },
  "Prochaines échéances": { de: "Nächste Termine", it: "Prossime scadenze" },
  "Rythme de conduite et délais": {
    de: "Führungsrhythmus und Fristen",
    it: "Ritmo di condotta e scadenze",
  },
  Questions: { de: "Fragen", it: "Domande" },
  "Contact et prochain point": {
    de: "Kontakt und nächster Rapport",
    it: "Contatto e prossimo punto",
  },
  "Carte · {title}": { de: "Karte · {title}", it: "Carta · {title}" },

  // ---------- Times and numbers ----------
  maintenant: { de: "jetzt", it: "adesso" },
  "dans {span}": { de: "in {span}", it: "tra {span}" },
  "il y a {span}": { de: "vor {span}", it: "{span} fa" },
  "{h} h {m}": { de: "{h} Std. {m}", it: "{h} h {m}" },
  "{h} h": { de: "{h} Std.", it: "{h} h" },
  "{n} min": { de: "{n} Min.", it: "{n} min" },
  inchangé: { de: "unverändert", it: "invariato" },
  nouveau: { de: "neu", it: "nuovo" },
  "avant : {value}": { de: "vorher: {value}", it: "prima: {value}" },
  "{label} : {value}": { de: "{label}: {value}", it: "{label}: {value}" },

  // ---------- Weather (WMO codes) ----------
  "Ciel clair": { de: "Klarer Himmel", it: "Cielo sereno" },
  "Plutôt ensoleillé": {
    de: "Überwiegend sonnig",
    it: "Prevalentemente soleggiato",
  },
  "Partiellement nuageux": {
    de: "Teilweise bewölkt",
    it: "Parzialmente nuvoloso",
  },
  Couvert: { de: "Bedeckt", it: "Coperto" },
  Brouillard: { de: "Nebel", it: "Nebbia" },
  "Brouillard givrant": { de: "Gefrierender Nebel", it: "Nebbia gelata" },
  "Bruine faible": { de: "Leichter Nieselregen", it: "Pioviggine debole" },
  Bruine: { de: "Nieselregen", it: "Pioviggine" },
  "Bruine forte": { de: "Starker Nieselregen", it: "Pioviggine forte" },
  "Bruine verglaçante": {
    de: "Gefrierender Nieselregen",
    it: "Pioviggine gelata",
  },
  "Bruine verglaçante forte": {
    de: "Starker gefrierender Nieselregen",
    it: "Pioviggine gelata forte",
  },
  "Pluie faible": { de: "Leichter Regen", it: "Pioggia debole" },
  Pluie: { de: "Regen", it: "Pioggia" },
  "Pluie forte": { de: "Starker Regen", it: "Pioggia forte" },
  "Pluie verglaçante": { de: "Gefrierender Regen", it: "Pioggia gelata" },
  "Pluie verglaçante forte": {
    de: "Starker gefrierender Regen",
    it: "Pioggia gelata forte",
  },
  "Neige faible": { de: "Leichter Schneefall", it: "Neve debole" },
  Neige: { de: "Schneefall", it: "Neve" },
  "Neige forte": { de: "Starker Schneefall", it: "Neve forte" },
  "Grains de neige": { de: "Schneegriesel", it: "Granuli di neve" },
  "Averses faibles": { de: "Leichte Regenschauer", it: "Rovesci deboli" },
  Averses: { de: "Regenschauer", it: "Rovesci" },
  "Averses violentes": { de: "Heftige Regenschauer", it: "Rovesci violenti" },
  "Averses de neige": { de: "Schneeschauer", it: "Rovesci di neve" },
  "Fortes averses de neige": {
    de: "Starke Schneeschauer",
    it: "Forti rovesci di neve",
  },
  Orage: { de: "Gewitter", it: "Temporale" },
  "Orage avec grêle": {
    de: "Gewitter mit Hagel",
    it: "Temporale con grandine",
  },
  "Orage avec forte grêle": {
    de: "Gewitter mit starkem Hagel",
    it: "Temporale con forte grandine",
  },
  "Conditions inconnues": {
    de: "Unbekannte Bedingungen",
    it: "Condizioni sconosciute",
  },
  "Code {code}": { de: "Code {code}", it: "Codice {code}" },

  // ---------- Moment compared with ----------
  "depuis « {title} » ({time})": {
    de: "seit «{title}» ({time})",
    it: "da «{title}» ({time})",
  },
  "depuis la dernière présentation ({time})": {
    de: "seit der letzten Präsentation ({time})",
    it: "dall’ultima presentazione ({time})",
  },
  "depuis 3 heures ({time})": {
    de: "seit 3 Stunden ({time})",
    it: "da 3 ore ({time})",
  },
  "depuis le début ({time})": {
    de: "seit Beginn ({time})",
    it: "dall’inizio ({time})",
  },
  "depuis {time}": { de: "seit {time}", it: "dalle {time}" },
  "Situation au {stamp}": {
    de: "Lage am {stamp}",
    it: "Situazione al {stamp}",
  },
  "Version du {stamp} (point « {snapshot} »)": {
    de: "Version vom {stamp} (Momentaufnahme «{snapshot}»)",
    it: "Versione del {stamp} (istantanea «{snapshot}»)",
  },
  "Version du {stamp}": {
    de: "Version vom {stamp}",
    it: "Versione del {stamp}",
  },

  // ---------- Title slide ----------
  "VERSION PASSÉE": { de: "FRÜHERE VERSION", it: "VERSIONE PASSATA" },
  "Point de situation": { de: "Lagerapport", it: "Punto della situazione" },
  "Se présenter : {name}.": {
    de: "Sich vorstellen: {name}.",
    it: "Presentarsi: {name}.",
  },
  "nom, fonction": { de: "Name, Funktion", it: "nome, funzione" },
  "Public : {audience}.": {
    de: "Publikum: {audience}.",
    it: "Pubblico: {audience}.",
  },
  "Les chiffres sont ceux du moment : ils peuvent évoluer pendant la présentation.":
    {
      de: "Die Zahlen sind jene des Moments: Sie können sich während der Präsentation ändern.",
      it: "Le cifre sono quelle del momento: possono evolvere durante la presentazione.",
    },
  "Version passée : préciser que la situation a pu évoluer depuis.": {
    de: "Frühere Version: darauf hinweisen, dass sich die Lage seither verändert haben kann.",
    it: "Versione passata: precisare che la situazione può essere cambiata da allora.",
  },

  // ---------- Facts, map, changes ----------
  "Aucune évolution {since}.": {
    de: "Keine Entwicklung {since}.",
    it: "Nessuna evoluzione {since}.",
  },
  "Carte de situation": { de: "Lagekarte", it: "Carta della situazione" },
  Point: { de: "Punkt", it: "Punto" },
  Ligne: { de: "Linie", it: "Linea" },
  Zone: { de: "Zone", it: "Zona" },
  "{n} objet sur la carte.": {
    de: "{n} Objekt auf der Karte.",
    it: "{n} oggetto sulla carta.",
  },
  "{n} objets sur la carte.": {
    de: "{n} Objekte auf der Karte.",
    it: "{n} oggetti sulla carta.",
  },
  Évolution: { de: "Entwicklung", it: "Evoluzione" },
  Retiré: { de: "Entfernt", it: "Rimosso" },
  Nouveau: { de: "Neu", it: "Nuovo" },
  Modifié: { de: "Geändert", it: "Modificato" },
  "{n} élément a changé {since}.": {
    de: "{n} Element hat sich {since} geändert.",
    it: "{n} elemento è cambiato {since}.",
  },
  "{n} éléments ont changé {since}.": {
    de: "{n} Elemente haben sich {since} geändert.",
    it: "{n} elementi sono cambiati {since}.",
  },
  "{n} nouveau": { de: "{n} neu", it: "{n} nuovo" },
  "{n} nouveaux": { de: "{n} neu", it: "{n} nuovi" },
  "{n} modifié": { de: "{n} geändert", it: "{n} modificato" },
  "{n} modifiés": { de: "{n} geändert", it: "{n} modificati" },
  "{n} retiré": { de: "{n} entfernt", it: "{n} rimosso" },
  "{n} retirés": { de: "{n} entfernt", it: "{n} rimossi" },

  // ---------- Missions ----------
  Conduite: { de: "Führung", it: "Condotta" },
  "Missions en cours et en retard": {
    de: "Laufende und überfällige Aufträge",
    it: "Missioni in corso e in ritardo",
  },
  "{n} point ouvert": { de: "{n} offener Punkt", it: "{n} punto aperto" },
  "{n} points ouverts": { de: "{n} offene Punkte", it: "{n} punti aperti" },
  "{open}, dont {late} en retard.": {
    de: "{open}, davon {late} überfällig.",
    it: "{open}, di cui {late} in ritardo.",
  },
  "EN RETARD": { de: "ÜBERFÄLLIG", it: "IN RITARDO" },
  "{n} en retard": { de: "{n} überfällig", it: "{n} in ritardo" },
  "Mission / mesure": { de: "Auftrag / Massnahme", it: "Missione / misura" },
  "… et {n} autre au journal": {
    de: "… und {n} weiterer im Journal",
    it: "… e {n} altra nel diario",
  },
  "… et {n} autres au journal": {
    de: "… und {n} weitere im Journal",
    it: "… e {n} altre nel diario",
  },
  "… et {n} autre": { de: "… und {n} weiterer", it: "… e {n} altro" },
  "… et {n} autres": { de: "… und {n} weitere", it: "… e {n} altri" },

  // ---------- Resources, team, radio ----------
  Engagés: { de: "Im Einsatz", it: "Impiegati" },
  "Alertés / en route": {
    de: "Alarmiert / unterwegs",
    it: "Allarmati / in viaggio",
  },
  Disponibles: { de: "Verfügbar", it: "Disponibili" },
  "Hors service": { de: "Ausser Betrieb", it: "Fuori servizio" },
  "Sans organisation": { de: "Ohne Organisation", it: "Senza organizzazione" },
  Total: { de: "Total", it: "Totale" },
  "Moyens engagés et disponibles": {
    de: "Mittel im Einsatz und verfügbar",
    it: "Mezzi impiegati e disponibili",
  },
  "Sans poste": { de: "Ohne Posten", it: "Senza posto" },
  "Postes et fonctions clés": {
    de: "Posten und Schlüsselfunktionen",
    it: "Posti e funzioni chiave",
  },
  "{n} personne présente sur {total}.": {
    de: "{n} Person von {total} anwesend.",
    it: "{n} persona presente su {total}.",
  },
  "{n} personnes présentes sur {total}.": {
    de: "{n} Personen von {total} anwesend.",
    it: "{n} persone presenti su {total}.",
  },
  "{n} présent sur {total}": {
    de: "{n} von {total} anwesend",
    it: "{n} presente su {total}",
  },
  "{n} présents sur {total}": {
    de: "{n} von {total} anwesend",
    it: "{n} presenti su {total}",
  },
  "<0>{n}</0> présent sur {total}": {
    de: "<0>{n}</0> von {total} anwesend",
    it: "<0>{n}</0> presente su {total}",
  },
  "<0>{n}</0> présents sur {total}": {
    de: "<0>{n}</0> von {total} anwesend",
    it: "<0>{n}</0> presenti su {total}",
  },
  "{n} personne": { de: "{n} Person", it: "{n} persona" },
  "{n} personnes": { de: "{n} Personen", it: "{n} persone" },
  "radio {radio}": { de: "Funk {radio}", it: "radio {radio}" },
  "+ {n} autre": { de: "+ {n} weiterer", it: "+ {n} altro" },
  "+ {n} autres": { de: "+ {n} weitere", it: "+ {n} altri" },
  "Personne n’est affecté.": {
    de: "Niemand zugewiesen.",
    it: "Nessuno assegnato.",
  },
  "Terminaux en service": {
    de: "Endgeräte in Betrieb",
    it: "Terminali in servizio",
  },
  Groupes: { de: "Gesprächsgruppen", it: "Gruppi" },
  "Noms d’appel": { de: "Rufnamen", it: "Nominativi" },
  Transmissions: { de: "Übermittlung", it: "Trasmissioni" },
  "Liaisons faibles : {list}.": {
    de: "Schwache Verbindungen: {list}.",
    it: "Collegamenti deboli: {list}.",
  },
  "Aucune liaison faible au dernier contrôle.": {
    de: "Keine schwache Verbindung bei der letzten Kontrolle.",
    it: "Nessun collegamento debole all’ultimo controllo.",
  },
  Groupe: { de: "Gruppe", it: "Gruppo" },
  Usage: { de: "Verwendung", it: "Uso" },
  Mode: { de: "Modus", it: "Modalità" },
  "LIAISONS FAIBLES OU NULLES": {
    de: "SCHWACHE ODER KEINE VERBINDUNGEN",
    it: "COLLEGAMENTI DEBOLI O ASSENTI",
  },
  LIAISONS: { de: "VERBINDUNGEN", it: "COLLEGAMENTI" },
  "Liaisons faibles ou nulles": {
    de: "Schwache oder keine Verbindungen",
    it: "Collegamenti deboli o assenti",
  },
  Liaisons: { de: "Verbindungen", it: "Collegamenti" },

  // ---------- Weather slide ----------
  "dès {from}": { de: "ab {from}", it: "dal {from}" },
  "jusqu’au {to}": { de: "bis {to}", it: "fino al {to}" },
  "sans durée fixée": { de: "ohne feste Dauer", it: "senza durata fissata" },
  "Météo · {place}": { de: "Wetter · {place}", it: "Meteo · {place}" },
  "Prévision {model} reçue à {time}": {
    de: "Prognose {model} erhalten um {time}",
    it: "Previsione {model} ricevuta alle {time}",
  },
  "rafales {gusts}": { de: "Böen {gusts}", it: "raffiche {gusts}" },
  "vent {wind}": { de: "Wind {wind}", it: "vento {wind}" },
  "Actuellement : {label}, {temperature}, vent {wind}.": {
    de: "Aktuell: {label}, {temperature}, Wind {wind}.",
    it: "Attualmente: {label}, {temperature}, vento {wind}.",
  },
  "Alerte {level} : {hazard} {region} ({period}).": {
    de: "Warnung {level}: {hazard} {region} ({period}).",
    it: "Allerta {level}: {hazard} {region} ({period}).",
  },
  "Observation {time} {place} : {text}.": {
    de: "Beobachtung {time} {place}: {text}.",
    it: "Osservazione {time} {place}: {text}.",
  },
  MAINTENANT: { de: "JETZT", it: "ADESSO" },
  Vent: { de: "Wind", it: "Vento" },
  Précipitations: { de: "Niederschlag", it: "Precipitazioni" },
  Humidité: { de: "Luftfeuchtigkeit", it: "Umidità" },
  "Vent {value}": { de: "Wind {value}", it: "Vento {value}" },
  "Précipitations {value}": {
    de: "Niederschlag {value}",
    it: "Precipitazioni {value}",
  },
  "Humidité {value}": { de: "Luftfeuchtigkeit {value}", it: "Umidità {value}" },
  "Degré {level} · {period}": {
    de: "Stufe {level} · {period}",
    it: "Grado {level} · {period}",
  },
  "Observation {time} · {place}": {
    de: "Beobachtung {time} · {place}",
    it: "Osservazione {time} · {place}",
  },

  // ---------- Agenda, closing ----------
  "Rendez-vous": { de: "Termin", it: "Appuntamento" },
  Délai: { de: "Frist", it: "Scadenza" },
  "Rythme de conduite": { de: "Führungsrhythmus", it: "Ritmo di condotta" },
  " · DÉPASSÉ": { de: " · ÜBERSCHRITTEN", it: " · SUPERATO" },
  dépassé: { de: "überschritten", it: "superato" },
  "Prochain · {relative}": {
    de: "Nächster · {relative}",
    it: "Prossimo · {relative}",
  },
  "Fin du point de situation": {
    de: "Ende des Lagerapports",
    it: "Fine del punto della situazione",
  },
  "Questions ?": { de: "Fragen?", it: "Domande?" },
  "Prochain point : {title} à {time} ({relative})": {
    de: "Nächster Rapport: {title} um {time} ({relative})",
    it: "Prossimo punto: {title} alle {time} ({relative})",
  },
  "Recueillir les questions et les décisions attendues.": {
    de: "Fragen und erwartete Entscheide sammeln.",
    it: "Raccogliere le domande e le decisioni attese.",
  },
  "Annoncer le prochain point : {title} à {time}.": {
    de: "Nächsten Rapport ankündigen: {title} um {time}.",
    it: "Annunciare il prossimo punto: {title} alle {time}.",
  },

  // ---------- Slides drawn (layout.ts, slides.tsx) ----------
  "ORION AIC · POINT DE SITUATION": {
    de: "ORION AIC · LAGERAPPORT",
    it: "ORION AIC · PUNTO DELLA SITUAZIONE",
  },
  "orion aic · point de situation": {
    de: "orion aic · Lagerapport",
    it: "orion aic · punto della situazione",
  },
  "Réf. {ref}": { de: "Ref. {ref}", it: "Rif. {ref}" },
  "Présenté par {name}": {
    de: "Präsentiert von {name}",
    it: "Presentato da {name}",
  },
  "Présenté par <0>{name}</0>": {
    de: "Präsentiert von <0>{name}</0>",
    it: "Presentato da <0>{name}</0>",
  },
  "pour {audience}": { de: "für {audience}", it: "per {audience}" },
  "IDÉE DE MANŒUVRE": { de: "EINSATZIDEE", it: "IDEA DI MANOVRA" },
  "Idée de manœuvre": { de: "Einsatzidee", it: "Idea di manovra" },
  "Évolution {since}": { de: "Entwicklung {since}", it: "Evoluzione {since}" },
  "Aucune évolution {since}": {
    de: "Keine Entwicklung {since}",
    it: "Nessuna evoluzione {since}",
  },
  "Carte non disponible (hors ligne ?)": {
    de: "Karte nicht verfügbar (offline?)",
    it: "Carta non disponibile (offline?)",
  },
  "Carte en préparation…": {
    de: "Karte wird vorbereitet …",
    it: "Carta in preparazione…",
  },
  "changement {since}": { de: "Änderung {since}", it: "modifica {since}" },
  "changements {since}": { de: "Änderungen {since}", it: "modifiche {since}" },
  "<0>{n}</0> changement {since}": {
    de: "<0>{n}</0> Änderung {since}",
    it: "<0>{n}</0> modifica {since}",
  },
  "<0>{n}</0> changements {since}": {
    de: "<0>{n}</0> Änderungen {since}",
    it: "<0>{n}</0> modifiche {since}",
  },
  // Names of the shapes (selection pane of PowerPoint and LibreOffice).
  "Carte (cadre)": { fr: "Carte", de: "Karte", it: "Scheda" },
  Lueur: { de: "Schein", it: "Bagliore" },
  Filet: { de: "Linie", it: "Filetto" },
  Bandeau: { de: "Band", it: "Fascia" },
  Filigrane: { de: "Wasserzeichen", it: "Filigrana" },
  Pastille: { de: "Badge", it: "Etichetta" },
  "Code de vérification": { de: "Prüfcode", it: "Codice di verifica" },
  "Carte absente": { de: "Karte fehlt", it: "Carta mancante" },
  Signe: { de: "Signatur", it: "Simbolo" },
  Trait: { de: "Strich", it: "Tratto" },
  Marque: { de: "Markierung", it: "Marcatore" },
  Axe: { de: "Achse", it: "Asse" },
  Tableau: { de: "Tabelle", it: "Tabella" },
  Couleur: { de: "Farbe", it: "Colore" },
  Degré: { de: "Stufe", it: "Grado" },

  // ---------- Files ----------
  Vide: { de: "Leer", it: "Vuoto" },
  "Image de la diapositive": { de: "Folienbild", it: "Immagine diapositiva" },
  Notes: { de: "Notizen", it: "Note" },
  "Grand écran": { de: "Breitbild", it: "Widescreen" },
  "← → naviguer · F plein écran · N notes": {
    de: "← → navigieren · F Vollbild · N Notizen",
    it: "← → navigare · F schermo intero · N note",
  },

  // ---------- Presentation mode ----------
  "Présenter la situation": {
    de: "Lage präsentieren",
    it: "Presentazione della situazione",
  },
  "Présenté par": { de: "Präsentiert von", it: "Presentato da" },
  "Pour qui": { de: "Für wen", it: "Per chi" },
  "Autorités communales, préfet…": {
    de: "Gemeindebehörden, Regierungsstatthalter …",
    it: "Autorità comunali, prefetto…",
  },
  "Version présentée": {
    de: "Präsentierte Version",
    it: "Versione presentata",
  },
  "Aucun point de situation figé": {
    de: "Keine Momentaufnahme vorhanden",
    it: "Nessuna istantanea disponibile",
  },
  "Point figé": { de: "Momentaufnahme", it: "Istantanea" },
  "Heure précise": { de: "Bestimmte Zeit", it: "Ora precisa" },
  Apparence: { de: "Darstellung", it: "Aspetto" },
  Sombre: { de: "Dunkel", it: "Scuro" },
  Clair: { de: "Hell", it: "Chiaro" },
  Auto: { de: "Auto", it: "Auto" },
  "Clair : conseillé pour un projecteur dans une salle éclairée.": {
    de: "Hell: empfohlen für einen Projektor in einem beleuchteten Raum.",
    it: "Chiaro: consigliato per un proiettore in una sala illuminata.",
  },
  Présenter: { de: "Präsentieren", it: "Presenta" },
  "Un deuxième écran ? Présentez, puis ouvrez la vue orateur (notes, diapositive suivante, chronomètre) avec le bouton <0/> de la barre d’outils.":
    {
      de: "Ein zweiter Bildschirm? Starten Sie die Präsentation und öffnen Sie dann die Referentenansicht (Notizen, nächste Folie, Stoppuhr) mit der Schaltfläche <0/> der Symbolleiste.",
      it: "Un secondo schermo? Avvia la presentazione, poi apri la vista relatore (note, diapositiva successiva, cronometro) con il pulsante <0/> della barra degli strumenti.",
    },
  "Affichage mural en direct": {
    de: "Wandanzeige live",
    it: "Schermo murale in diretta",
  },
  "Exporter (PowerPoint, PDF…)": {
    de: "Exportieren (PowerPoint, PDF …)",
    it: "Esporta (PowerPoint, PDF…)",
  },
  Diapositives: { de: "Folien", it: "Diapositive" },
  "Glissez pour changer l’ordre · décochez pour masquer": {
    de: "Ziehen, um die Reihenfolge zu ändern · abwählen zum Ausblenden",
    it: "Trascina per cambiare l’ordine · deseleziona per nascondere",
  },
  "Déplacer (Alt + flèches)": {
    de: "Verschieben (Alt + Pfeiltasten)",
    it: "Sposta (Alt + frecce)",
  },
  "Montrer {label}": { de: "{label} anzeigen", it: "Mostra {label}" },
  "{n} tableau(x)": { de: "{n} Lagetafel(n)", it: "{n} tabella/e" },
  " · idée de manœuvre": { de: " · Einsatzidee", it: " · idea di manovra" },
  "{n} renseignement(s) clé(s)": {
    de: "{n} Schlüsselinformation(en)",
    it: "{n} informazione/i chiave",
  },
  " · évolution {since}": {
    de: " · Entwicklung {since}",
    it: " · evoluzione {since}",
  },
  "{n} objet(s) · {layers} calque(s)": {
    de: "{n} Objekt(e) · {layers} Ebene(n)",
    it: "{n} oggetto/i · {layers} livello/i",
  },
  "{n} changement(s) {since}": {
    de: "{n} Änderung(en) {since}",
    it: "{n} modifica/che {since}",
  },
  "{n} fait(s) marquant(s)": {
    de: "{n} wichtige(s) Ereignis(se)",
    it: "{n} fatto/i saliente/i",
  },
  "{n} ouverte(s)": { de: "{n} offen", it: "{n} aperta/e" },
  " · {n} en retard": { de: " · {n} überfällig", it: " · {n} in ritardo" },
  "{n} poste(s) · {present} présent(s)": {
    de: "{n} Posten · {present} anwesend",
    it: "{n} posto/i · {present} presente/i",
  },
  "{value} terminaux en service": {
    de: "{value} Endgeräte in Betrieb",
    it: "{value} terminali in servizio",
  },
  "{n} alerte(s)": { de: "{n} Warnung(en)", it: "{n} allerta/e" },
  "{n} échéance(s)": { de: "{n} Termin(e)", it: "{n} scadenza/e" },
  "Outils de présentation": {
    de: "Präsentationswerkzeuge",
    it: "Strumenti di presentazione",
  },
  Précédente: { de: "Vorherige", it: "Precedente" },
  Suivante: { de: "Nächste", it: "Successiva" },
  "→ ou espace": { de: "→ oder Leertaste", it: "→ o spazio" },
  Stylo: { de: "Stift", it: "Penna" },
  Surligneur: { de: "Textmarker", it: "Evidenziatore" },
  "Pointeur laser": { de: "Laserpointer", it: "Puntatore laser" },
  Gomme: { de: "Radierer", it: "Gomma" },
  "Annuler le dernier trait": {
    de: "Letzten Strich rückgängig machen",
    it: "Annulla l’ultimo tratto",
  },
  "Effacer les annotations de la diapositive": {
    de: "Anmerkungen der Folie löschen",
    it: "Cancella le annotazioni della diapositiva",
  },
  "Maj E": { de: "Umschalt E", it: "Maiusc E" },
  "Vue d’ensemble": { de: "Übersicht", it: "Panoramica" },
  "Écran noir": { de: "Schwarzer Bildschirm", it: "Schermo nero" },
  Chronomètre: { de: "Stoppuhr", it: "Cronometro" },
  "Vue orateur (deuxième écran)": {
    de: "Referentenansicht (zweiter Bildschirm)",
    it: "Vista relatore (secondo schermo)",
  },
  "Plein écran": { de: "Vollbild", it: "Schermo intero" },
  Échap: { de: "Esc", it: "Esc" },
  "La fenêtre de la vue orateur a été bloquée. Autorisez les fenêtres surgissantes pour ce site, ou appuyez sur N pour afficher les notes.":
    {
      de: "Das Fenster der Referentenansicht wurde blockiert. Erlauben Sie Pop-up-Fenster für diese Website oder drücken Sie N, um die Notizen anzuzeigen.",
      it: "La finestra della vista relatore è stata bloccata. Consenti le finestre pop-up per questo sito, oppure premi N per mostrare le note.",
    },
  "Notes · {label}": { de: "Notizen · {label}", it: "Note · {label}" },
  "Diapositive précédente": {
    de: "Vorherige Folie",
    it: "Diapositiva precedente",
  },
  "Diapositive suivante": { de: "Nächste Folie", it: "Diapositiva successiva" },
  "Durée {duration} · {seen} diapositive(s) montrée(s) sur {count}{extra}.": {
    de: "Dauer {duration} · {seen} von {count} Folie(n) gezeigt{extra}.",
    it: "Durata {duration} · {seen} diapositiva/e mostrata/e su {count}{extra}.",
  },
  " · annotations": { de: " · Anmerkungen", it: " · annotazioni" },
  "En cours (heure de fin provisoire).": {
    de: "Läuft (provisorische Endzeit).",
    it: "In corso (ora di fine provvisoria).",
  },
  "Fenêtre fermée pendant la présentation.": {
    de: "Fenster während der Präsentation geschlossen.",
    it: "Finestra chiusa durante la presentazione.",
  },
  "Affichage mural": { de: "Wandanzeige", it: "Schermo murale" },
  " · réf. {ref}": { de: " · Ref. {ref}", it: " · rif. {ref}" },
  "Présentation terminée": {
    de: "Präsentation beendet",
    it: "Presentazione terminata",
  },
  "{duration} · {n} diapositive montrée sur {total}": {
    de: "{duration} · {n} von {total} Folien gezeigt",
    it: "{duration} · {n} diapositiva mostrata su {total}",
  },
  "{duration} · {n} diapositives montrées sur {total}": {
    de: "{duration} · {n} von {total} Folien gezeigt",
    it: "{duration} · {n} diapositive mostrate su {total}",
  },
  "Elle est inscrite au registre des présentations (Traçabilité).": {
    de: "Sie ist im Register der Präsentationen eingetragen (Nachvollziehbarkeit).",
    it: "È registrata nel registro delle presentazioni (Tracciabilità).",
  },
  "Préparation…": { de: "Wird vorbereitet …", it: "Preparazione…" },
  "Enregistrer les annotations ({n} diapositive, PDF)": {
    de: "Anmerkungen speichern ({n} Folie, PDF)",
    it: "Salva le annotazioni ({n} diapositiva, PDF)",
  },
  "Enregistrer les annotations ({n} diapositives, PDF)": {
    de: "Anmerkungen speichern ({n} Folien, PDF)",
    it: "Salva le annotazioni ({n} diapositive, PDF)",
  },
  Reprendre: { de: "Fortsetzen", it: "Riprendi" },
  "Les annotations sont perdues à la fermeture si elles ne sont pas enregistrées.":
    {
      de: "Nicht gespeicherte Anmerkungen gehen beim Schliessen verloren.",
      it: "Le annotazioni non salvate vanno perse alla chiusura.",
    },
  "Enregistrement impossible.": {
    de: "Speichern nicht möglich.",
    it: "Salvataggio impossibile.",
  },
  "{title} · annotations": {
    de: "{title} · Anmerkungen",
    it: "{title} · annotazioni",
  },
  annotations: { de: "anmerkungen", it: "annotazioni" },
  "EN DIRECT": { de: "LIVE", it: "IN DIRETTA" },
  "Mis à jour à {time}": {
    de: "Aktualisiert um {time}",
    it: "Aggiornato alle {time}",
  },
  "Réglages de l’affichage mural": {
    de: "Einstellungen der Wandanzeige",
    it: "Impostazioni dello schermo murale",
  },
  Pause: { de: "Pause", it: "Pausa" },
  "Durée par diapositive": {
    de: "Dauer pro Folie",
    it: "Durata per diapositiva",
  },
  "{n} s": { de: "{n} s", it: "{n} s" },
  Quitter: { de: "Verlassen", it: "Esci" },

  // ---------- Presenter window, annotations ----------
  "Vue orateur · orion aic": {
    de: "Referentenansicht · orion aic",
    it: "Vista relatore · orion aic",
  },
  "Temps écoulé": { de: "Verstrichene Zeit", it: "Tempo trascorso" },
  Rallumer: { de: "Wieder einschalten", it: "Riaccendi" },
  Ensuite: { de: "Danach", it: "In seguito" },
  "Dernière diapositive.": { de: "Letzte Folie.", it: "Ultima diapositiva." },
  "Pas de notes pour cette diapositive.": {
    de: "Keine Notizen zu dieser Folie.",
    it: "Nessuna nota per questa diapositiva.",
  },
  Rouge: { de: "Rot", it: "Rosso" },
  Jaune: { de: "Gelb", it: "Giallo" },
  Vert: { de: "Grün", it: "Verde" },
  Bleu: { de: "Blau", it: "Blu" },
  Blanc: { de: "Weiss", it: "Bianco" },
  "Zone d’annotation": { de: "Anmerkungsbereich", it: "Area di annotazione" },
} satisfies Dict);

export type Key = Parameters<typeof t>[0];

/** "Libellé : valeur" with the punctuation of the language. */
export const colon = (label: string, value: string | number) =>
  t("{label} : {value}", { label, value });

/**
 * State of a mission on a slide: "En retard" (set by the deck) or a fixed
 * value of the journal (enumLabel).
 */
export const statusLabel = (status: string) =>
  status === "En retard" ? t("En retard") : enumLabel(status);
