import { translator, type Dict } from "../../../shared/i18n/core.ts";
import { common } from "../../../shared/i18n/common.ts";

// Texts of the weather module (Weather.tsx, forecast.ts, Thresholds.tsx).
const weather = {
  ...common,
  // forecast.ts: services
  "Service météo indisponible (HTTP {status}).": {
    de: "Wetterdienst nicht verfügbar (HTTP {status}).",
    it: "Servizio meteo non disponibile (HTTP {status}).",
  },
  "Le service météo ne répond pas.": {
    de: "Der Wetterdienst antwortet nicht.",
    it: "Il servizio meteo non risponde.",
  },
  "Recherche indisponible (HTTP {status}).": {
    de: "Suche nicht verfügbar (HTTP {status}).",
    it: "Ricerca non disponibile (HTTP {status}).",
  },
  MétéoSuisse: { de: "MeteoSchweiz", it: "MeteoSvizzera" },
  "meilleur modèle": { de: "bestes Modell", it: "miglior modello" },
  "exemple fictif": { de: "fiktives Beispiel", it: "esempio fittizio" },
  "https://www.meteosuisse.admin.ch": {
    de: "https://www.meteoschweiz.admin.ch",
    it: "https://www.meteosvizzera.admin.ch",
  },
  // WMO weather codes
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
  Neige: { de: "Schnee", it: "Neve" },
  "Neige forte": { de: "Starker Schneefall", it: "Neve forte" },
  "Grains de neige": { de: "Schneegriesel", it: "Neve granulosa" },
  "Averses faibles": { de: "Leichte Schauer", it: "Rovesci deboli" },
  Averses: { de: "Schauer", it: "Rovesci" },
  "Averses violentes": { de: "Heftige Schauer", it: "Rovesci violenti" },
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
  // Hazards
  Orages: { de: "Gewitter", it: "Temporali" },
  "Fortes pluies": { de: "Starkregen", it: "Forti piogge" },
  Vent: { de: "Wind", it: "Vento" },
  Verglas: { de: "Glätte", it: "Ghiaccio" },
  Canicule: { de: "Hitzewelle", it: "Canicola" },
  Crues: { de: "Hochwasser", it: "Piene" },
  Avalanches: { de: "Lawinen", it: "Valanghe" },
  "Incendies de forêt": { de: "Waldbrände", it: "Incendi boschivi" },
  // Observations
  "température {v}": { de: "Temperatur {v}", it: "temperatura {v}" },
  "vent {v}": { de: "Wind {v}", it: "vento {v}" },
  "précipitations {v}": { de: "Niederschlag {v}", it: "precipitazioni {v}" },
  "visibilité {v}": { de: "Sicht {v}", it: "visibilità {v}" },
  "du {from} au {to}": { de: "vom {from} bis {to}", it: "dal {from} al {to}" },
  "dès le {from}": { de: "ab {from}", it: "dal {from}" },
  "jusqu’au {to}": { de: "bis {to}", it: "fino al {to}" },
  "sans durée fixée": { de: "ohne feste Dauer", it: "senza durata fissata" },
  // Weather.tsx: lists
  Calme: { de: "Windstill", it: "Calmo" },
  Faible: { de: "Schwach", it: "Debole" },
  Modéré: { de: "Mässig", it: "Moderato" },
  Fort: { de: "Stark", it: "Forte" },
  Tempête: { de: "Sturm", it: "Tempesta" },
  Faibles: { de: "Schwach", it: "Deboli" },
  Modérées: { de: "Mässig", it: "Moderate" },
  Fortes: { de: "Stark", it: "Forti" },
  Grêle: { de: "Hagel", it: "Grandine" },
  "Plus de 10 km": { de: "Über 10 km", it: "Oltre 10 km" },
  "1 à 10 km": { de: "1 bis 10 km", it: "Da 1 a 10 km" },
  "Moins de 1 km": { de: "Unter 1 km", it: "Meno di 1 km" },
  "Moins de 100 m": { de: "Unter 100 m", it: "Meno di 100 m" },
  Ensoleillé: { de: "Sonnig", it: "Soleggiato" },
  Nuageux: { de: "Bewölkt", it: "Nuvoloso" },
  "OFEV · crues": { de: "BAFU · Hochwasser", it: "UFAM · piene" },
  "SLF · avalanches": { de: "SLF · Lawinen", it: "SLF · valanghe" },
  Canton: { de: "Kanton", it: "Cantone" },
  Commune: { de: "Gemeinde", it: "Comune" },
  // Weather.tsx: fields
  Conditions: { de: "Bedingungen", it: "Condizioni" },
  Température: { de: "Temperatur", it: "Temperatura" },
  "ex. 12 °C": { de: "z. B. 12 °C", it: "es. 12 °C" },
  Précipitations: { de: "Niederschlag", it: "Precipitazioni" },
  Visibilité: { de: "Sicht", it: "Visibilità" },
  Danger: { de: "Gefahr", it: "Pericolo" },
  Région: { de: "Region", it: "Regione" },
  "ex. Valais central": {
    de: "z. B. Mittelwallis",
    it: "es. Vallese centrale",
  },
  Source: { de: "Quelle", it: "Fonte" },
  "Remarques / comportements recommandés": {
    de: "Bemerkungen / Verhaltensempfehlungen",
    it: "Note / comportamenti raccomandati",
  },
  // Weather.tsx: module
  "Hors ligne : la dernière prévision reste affichée.": {
    de: "Offline: Die letzte Prognose bleibt angezeigt.",
    it: "Offline: resta visualizzata l’ultima previsione.",
  },
  "Impossible de joindre le service météo.": {
    de: "Der Wetterdienst ist nicht erreichbar.",
    it: "Impossibile raggiungere il servizio meteo.",
  },
  "Alerte introuvable.": {
    de: "Warnung nicht gefunden.",
    it: "Allerta non trovata.",
  },
  "Observation introuvable.": {
    de: "Beobachtung nicht gefunden.",
    it: "Osservazione non trovata.",
  },
  "Observation météo ({place}) : {text}": {
    de: "Wetterbeobachtung ({place}): {text}",
    it: "Osservazione meteo ({place}): {text}",
  },
  "Observation météo : {text}": {
    de: "Wetterbeobachtung: {text}",
    it: "Osservazione meteo: {text}",
  },
  "voir remarques": { de: "siehe Bemerkungen", it: "vedi note" },
  "Observation consignée au journal.": {
    de: "Beobachtung im Journal erfasst.",
    it: "Osservazione registrata nel diario.",
  },
  "Lieu météo : {name}. Appuyez sur « Actualiser » pour la prévision.": {
    de: "Wetterort: {name}. Drücken Sie « Aktualisieren » für die Prognose.",
    it: "Luogo meteo: {name}. Premete « Aggiorna » per la previsione.",
  },
  "Carte des dangers MétéoSuisse": {
    de: "Gefahrenkarte MeteoSchweiz",
    it: "Carta dei pericoli MeteoSvizzera",
  },
  "Actualisation…": { de: "Wird aktualisiert …", it: "Aggiornamento…" },
  Actualiser: { de: "Aktualisieren", it: "Aggiorna" },
  "Lieu de la prévision": {
    de: "Ort der Prognose",
    it: "Luogo della previsione",
  },
  "Lieu sans nom": { de: "Ort ohne Namen", it: "Luogo senza nome" },
  "Changer de lieu": { de: "Ort ändern", it: "Cambia luogo" },
  "Prévision reçue le {date}": {
    de: "Prognose erhalten am {date}",
    it: "Previsione ricevuta il {date}",
  },
  "Données du {date}": { de: "Daten vom {date}", it: "Dati del {date}" },
  "Pas encore de prévision": {
    de: "Noch keine Prognose",
    it: "Ancora nessuna previsione",
  },
  "Hors ligne": { de: "Offline", it: "Offline" },
  "Actualiser toutes les 30 min": {
    de: "Alle 30 Min. aktualisieren",
    it: "Aggiorna ogni 30 min",
  },
  "Pour obtenir la prévision, les coordonnées du lieu sont envoyées à open-meteo.com (rien d’autre). Sans actualisation, aucune donnée ne quitte ce poste.":
    {
      de: "Für die Prognose werden die Koordinaten des Ortes an open-meteo.com gesendet (sonst nichts). Ohne Aktualisierung verlassen keine Daten diesen Arbeitsplatz.",
      it: "Per ottenere la previsione, le coordinate del luogo sono inviate a open-meteo.com (nient’altro). Senza aggiornamento, nessun dato lascia questa postazione.",
    },
  "Aucun lieu météo défini pour ce journal.": {
    de: "Für dieses Journal ist kein Wetterort festgelegt.",
    it: "Nessun luogo meteo definito per questo diario.",
  },
  "Où faut-il la météo ?": {
    de: "Für welchen Ort wird das Wetter benötigt?",
    it: "Per quale luogo serve il meteo?",
  },
  "Cherchez une localité, reprenez la vue de la carte ou votre position. La prévision MétéoSuisse (modèle ICON-CH2) est ensuite chargée sur demande.":
    {
      de: "Suchen Sie eine Ortschaft, übernehmen Sie die Kartenansicht oder Ihre Position. Die Prognose von MeteoSchweiz (Modell ICON-CH2) wird dann auf Anfrage geladen.",
      it: "Cercate una località, riprendete la vista della carta o la vostra posizione. La previsione MeteoSvizzera (modello ICON-CH2) viene poi caricata su richiesta.",
    },
  "Prévision sur 48 heures": {
    de: "Prognose über 48 Stunden",
    it: "Previsione su 48 ore",
  },
  "48 heures": { de: "48 Stunden", it: "48 ore" },
  Rafales: { de: "Böen", it: "Raffiche" },
  "Prévisions reçues": { de: "Erhaltene Prognosen", it: "Previsioni ricevute" },
  "Version du moment": {
    de: "Stand zu diesem Zeitpunkt",
    it: "Versione del momento",
  },
  "Dernière prévision": { de: "Letzte Prognose", it: "Ultima previsione" },
  "Chaque prévision chargée est gardée : on retrouve ce qui était annoncé à chaque heure.":
    {
      de: "Jede geladene Prognose wird aufbewahrt: So sieht man, was zu jeder Stunde angekündigt war.",
      it: "Ogni previsione caricata viene conservata: si ritrova ciò che era annunciato a ogni ora.",
    },
  "{place} · {model} · reçue par {by}": {
    de: "{place} · {model} · erhalten von {by}",
    it: "{place} · {model} · ricevuta da {by}",
  },
  "Charger la prévision": { de: "Prognose laden", it: "Carica la previsione" },
  "La prévision pour {place} est chargée uniquement quand vous le demandez.": {
    de: "Die Prognose für {place} wird nur auf Ihre Anfrage geladen.",
    it: "La previsione per {place} viene caricata solo quando lo richiedete.",
  },
  "ce lieu": { de: "diesen Ort", it: "questo luogo" },
  Alertes: { de: "Warnungen", it: "Allerte" },
  "Alertes de danger": { de: "Gefahrenwarnungen", it: "Allerte di pericolo" },
  "{n} en vigueur": { de: "{n} in Kraft", it: "{n} in vigore" },
  Alerte: { de: "Warnung", it: "Allerta" },
  "En vigueur": { de: "In Kraft", it: "In vigore" },
  "À venir": { de: "Bevorstehend", it: "Imminente" },
  Terminée: { de: "Beendet", it: "Terminata" },
  "Aucune alerte saisie. Reportez ici les avis de MétéoSuisse (degrés 1 à 5) qui concernent la région.":
    {
      de: "Keine Warnung erfasst. Tragen Sie hier die Warnungen von MeteoSchweiz (Stufen 1 bis 5) ein, die die Region betreffen.",
      it: "Nessuna allerta registrata. Riportate qui gli avvisi di MeteoSvizzera (gradi da 1 a 5) che riguardano la regione.",
    },
  "Saisir une alerte": { de: "Warnung erfassen", it: "Registra un’allerta" },
  "Observations sur place": {
    de: "Beobachtungen vor Ort",
    it: "Osservazioni sul posto",
  },
  Observation: { de: "Beobachtung", it: "Osservazione" },
  "Consigner au journal": {
    de: "Im Journal erfassen",
    it: "Registra nel diario",
  },
  "Consigner cette observation au journal": {
    de: "Diese Beobachtung im Journal erfassen",
    it: "Registra questa osservazione nel diario",
  },
  Consigner: { de: "Erfassen", it: "Registra" },
  "Aucune observation. Notez ce que l’on voit sur place : c’est souvent plus parlant que la prévision.":
    {
      de: "Keine Beobachtung. Notieren Sie, was vor Ort zu sehen ist: Das sagt oft mehr als die Prognose.",
      it: "Nessuna osservazione. Annotate ciò che si vede sul posto: spesso dice più della previsione.",
    },
  "Retirer le lieu": { de: "Ort entfernen", it: "Rimuovi il luogo" },
  "une observation": { de: "eine Beobachtung", it: "un’osservazione" },
  "Indiquez l’heure.": { de: "Geben Sie die Zeit an.", it: "Indicate l’ora." },
  "une alerte": { de: "eine Warnung", it: "un’allerta" },
  "{hazard} · degré {level}": {
    de: "{hazard} · Stufe {level}",
    it: "{hazard} · grado {level}",
  },
  "Indiquez le danger (un clic sur une valeur proposée suffit).": {
    de: "Geben Sie die Gefahr an (ein Klick auf einen vorgeschlagenen Wert genügt).",
    it: "Indicate il pericolo (basta un clic su un valore proposto).",
  },
  "La fin précède le début.": {
    de: "Das Ende liegt vor dem Beginn.",
    it: "La fine precede l’inizio.",
  },
  "Degré ": { de: "Stufe ", it: "Grado " },
  "Degré de danger": { de: "Gefahrenstufe", it: "Grado di pericolo" },
  // PlacePicker
  "Recherche impossible (hors ligne ?).": {
    de: "Suche nicht möglich (offline?).",
    it: "Ricerca impossibile (offline?).",
  },
  "Position indisponible sur cet appareil.": {
    de: "Position auf diesem Gerät nicht verfügbar.",
    it: "Posizione non disponibile su questo dispositivo.",
  },
  "Ma position": { de: "Meine Position", it: "La mia posizione" },
  "Accès à la position refusé.": {
    de: "Zugriff auf die Position verweigert.",
    it: "Accesso alla posizione negato.",
  },
  "Position introuvable.": {
    de: "Position nicht gefunden.",
    it: "Posizione non trovata.",
  },
  "Localité, adresse, lieu-dit…": {
    de: "Ortschaft, Adresse, Flurname …",
    it: "Località, indirizzo, toponimo…",
  },
  "Rechercher un lieu en Suisse": {
    de: "Einen Ort in der Schweiz suchen",
    it: "Cerca un luogo in Svizzera",
  },
  "La recherche passe par geo.admin.ch (swisstopo).": {
    de: "Die Suche läuft über geo.admin.ch (swisstopo).",
    it: "La ricerca passa da geo.admin.ch (swisstopo).",
  },
  "Centre de la carte de situation": {
    de: "Mitte der Lagekarte",
    it: "Centro della carta della situazione",
  },
  "Ouvrez d’abord la carte": {
    de: "Öffnen Sie zuerst die Karte",
    it: "Aprite prima la carta",
  },
  "Vue de la carte": { de: "Kartenansicht", it: "Vista della carta" },
  "Utiliser la vue de la carte": {
    de: "Kartenansicht verwenden",
    it: "Usa la vista della carta",
  },
  "Localisation…": { de: "Ortung …", it: "Localizzazione…" },
  "Saisir des coordonnées": {
    de: "Koordinaten eingeben",
    it: "Inserisci coordinate",
  },
  Latitude: { de: "Breitengrad", it: "Latitudine" },
  Longitude: { de: "Längengrad", it: "Longitudine" },
  "Utiliser ces coordonnées": {
    de: "Diese Koordinaten verwenden",
    it: "Usa queste coordinate",
  },
  // QuickObservation
  "Observation ajoutée.": {
    de: "Beobachtung hinzugefügt.",
    it: "Osservazione aggiunta.",
  },
  "du {dir}": { de: "aus {dir}", it: "da {dir}" },
  "rafales {v} km/h": { de: "Böen {v} km/h", it: "raffiche {v} km/h" },
  "rafales {v}": { de: "Böen {v}", it: "raffiche {v}" },
  "Noter une observation": {
    de: "Beobachtung notieren",
    it: "Annota un’osservazione",
  },
  "Reprendre les valeurs de la prévision actuelle": {
    de: "Werte der aktuellen Prognose übernehmen",
    it: "Riprendi i valori della previsione attuale",
  },
  "Reprendre la prévision": {
    de: "Prognose übernehmen",
    it: "Riprendi la previsione",
  },
  "Consigner aussi au journal": {
    de: "Auch im Journal erfassen",
    it: "Registra anche nel diario",
  },
  // Current, days, chart
  "Conditions actuelles": {
    de: "Aktuelle Bedingungen",
    it: "Condizioni attuali",
  },
  "Ancien lieu": { de: "Früherer Ort", it: "Luogo precedente" },
  Humidité: { de: "Feuchtigkeit", it: "Umidità" },
  "Aujourd’hui": { de: "Heute", it: "Oggi" },
  Demain: { de: "Morgen", it: "Domani" },
  "Prévision sur 3 jours": {
    de: "Prognose über 3 Tage",
    it: "Previsione su 3 giorni",
  },
  "La prévision est trop ancienne : actualisez pour voir les 48 prochaines heures.":
    {
      de: "Die Prognose ist zu alt: Aktualisieren Sie, um die nächsten 48 Stunden zu sehen.",
      it: "La previsione è troppo vecchia: aggiornate per vedere le prossime 48 ore.",
    },
  "Température de {min} à {max} °C, précipitations cumulées {rain} mm, rafales jusqu’à {gusts} km/h.":
    {
      de: "Temperatur von {min} bis {max} °C, Niederschlag gesamt {rain} mm, Böen bis {gusts} km/h.",
      it: "Temperatura da {min} a {max} °C, precipitazioni cumulate {rain} mm, raffiche fino a {gusts} km/h.",
    },
  "Prévision sur 48 heures. {summary} Flèches gauche et droite pour lire heure par heure.":
    {
      de: "Prognose über 48 Stunden. {summary} Pfeiltasten links und rechts, um Stunde für Stunde zu lesen.",
      it: "Previsione su 48 ore. {summary} Frecce sinistra e destra per leggere ora per ora.",
    },
  "maintenant (graphique)": { fr: "maintenant", de: "jetzt", it: "adesso" },
  // Thresholds.tsx
  "Vent moyen": { de: "Mittlerer Wind", it: "Vento medio" },
  "Pluie en 1 h": { de: "Regen in 1 h", it: "Pioggia in 1 h" },
  "Pluie en 24 h": { de: "Regen in 24 h", it: "Pioggia in 24 h" },
  "Température maximale": {
    de: "Höchsttemperatur",
    it: "Temperatura massima",
  },
  "Température minimale": {
    de: "Tiefsttemperatur",
    it: "Temperatura minima",
  },
  "{label} ({unit}, au-dessus)": {
    de: "{label} ({unit}, darüber)",
    it: "{label} ({unit}, al di sopra)",
  },
  "{label} ({unit}, au-dessous)": {
    de: "{label} ({unit}, darunter)",
    it: "{label} ({unit}, al di sotto)",
  },
  Grandeur: { de: "Messgrösse", it: "Grandezza" },
  Seuil: { de: "Schwelle", it: "Soglia" },
  "Degré de l’alerte créée": {
    de: "Stufe der erstellten Warnung",
    it: "Grado dell’allerta creata",
  },
  "Nom de l’alerte (facultatif)": {
    de: "Name der Warnung (optional)",
    it: "Nome dell’allerta (facoltativo)",
  },
  "ex. Vent fort sur les chantiers": {
    de: "z. B. Starker Wind auf den Baustellen",
    it: "es. Vento forte sui cantieri",
  },
  Actif: { de: "Aktiv", it: "Attivo" },
  "Créer aussi une entrée « à traiter » au journal": {
    de: "Auch einen Eintrag « zu bearbeiten » im Journal erstellen",
    it: "Crea anche una voce « da trattare » nel diario",
  },
  "Seuils météo": { de: "Wetterschwellen", it: "Soglie meteo" },
  "Aucun nouveau seuil franchi.": {
    de: "Keine neue Schwelle überschritten.",
    it: "Nessuna nuova soglia superata.",
  },
  "{n} alerte créée.": {
    de: "{n} Warnung erstellt.",
    it: "{n} allerta creata.",
  },
  "{n} alertes créées.": {
    de: "{n} Warnungen erstellt.",
    it: "{n} allerte create.",
  },
  "Évaluer maintenant": { de: "Jetzt auswerten", it: "Valuta ora" },
  "À chaque prévision reçue, un seuil franchi crée une alerte (une par jour et par seuil, même si plusieurs postes la voient) et, si demandé, une entrée à traiter. Le niveau des cours d’eau n’est pas dans la prévision : saisissez les alertes crue à la main.":
    {
      de: "Bei jeder erhaltenen Prognose erstellt eine überschrittene Schwelle eine Warnung (eine pro Tag und Schwelle, auch wenn mehrere Arbeitsplätze sie sehen) und auf Wunsch einen zu bearbeitenden Eintrag. Der Pegel der Gewässer ist nicht in der Prognose: Erfassen Sie Hochwasserwarnungen von Hand.",
      it: "A ogni previsione ricevuta, una soglia superata crea un’allerta (una al giorno e per soglia, anche se più postazioni la vedono) e, se richiesto, una voce da trattare. Il livello dei corsi d’acqua non è nella previsione: registrate a mano le allerte di piena.",
    },
  "degré {level}": { de: "Stufe {level}", it: "grado {level}" },
  "entrée à traiter": {
    de: "Eintrag zu bearbeiten",
    it: "voce da trattare",
  },
  "pas encore de prévision": {
    de: "noch keine Prognose",
    it: "ancora nessuna previsione",
  },
  "franchi le {day} dès {time} (pic {peak} {unit})": {
    de: "überschritten am {day} ab {time} (Spitze {peak} {unit})",
    it: "superata il {day} dalle {time} (picco {peak} {unit})",
  },
  "pas franchi dans la prévision": {
    de: "in der Prognose nicht überschritten",
    it: "non superata nella previsione",
  },
  Franchi: { de: "Überschritten", it: "Superata" },
  "Seuils standards ajoutés : ajustez-les à la région.": {
    de: "Standardschwellen hinzugefügt: Passen Sie sie an die Region an.",
    it: "Soglie standard aggiunte: adattatele alla regione.",
  },
  "Ajouter des seuils standards": {
    de: "Standardschwellen hinzufügen",
    it: "Aggiungi soglie standard",
  },
  "Seuil météo": { de: "Wetterschwelle", it: "Soglia meteo" },
  "Nouveau seuil": { de: "Neue Schwelle", it: "Nuova soglia" },
} satisfies Dict;

export const { t, tn, tIn, dict } = translator(weather);
export type WeatherKey = keyof typeof weather & string;
