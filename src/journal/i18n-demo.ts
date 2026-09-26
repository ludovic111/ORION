import { translator, type Dict } from "../../shared/i18n/core.ts";

// Data of the demonstration exercise « Crue de l’Arve » (src/journal/demo.ts),
// written in the language of the post at the moment the demonstration is
// opened. Once written, it is journal data like any other (never translated
// again). Place names of Geneva (Carouge, Arve, Pont des Acacias, Quai
// Charles-Page, Route de Veyrier…) stay French; values that belong to a
// référentiel follow shared/i18n/seeds.ts (LIST_VALUES, FACTS, BOARDS).
export const { t, dict } = translator({
  // ---------- Journal ----------
  "Crue de l’Arve": { de: "Hochwasser der Arve", it: "Piena dell’Arve" },
  "PCi · Exercice de démonstration": {
    de: "ZS · Demonstrationsübung",
    it: "PCi · Esercizio dimostrativo",
  },
  "Carouge · Genève": { de: "Carouge · Genf", it: "Carouge · Ginevra" },
  Genève: { de: "Genf", it: "Ginevra" },
  "Opérateur · démo": { de: "Operateur · Demo", it: "Operatore · demo" },
  "Opérateur A · fictif": {
    de: "Operateur A · fiktiv",
    it: "Operatore A · fittizio",
  },
  "Opérateur B · fictif": {
    de: "Operateur B · fiktiv",
    it: "Operatore B · fittizio",
  },
  "Cartographe · fictif": {
    de: "Kartograf · fiktiv",
    it: "Cartografo · fittizio",
  },

  // ---------- Entries ----------
  "Ouverture du poste de conduite. Début de la tenue du journal.": {
    de: "Eröffnung des Kommandopostens. Beginn der Journalführung.",
    it: "Apertura del posto di comando. Inizio della tenuta del diario.",
  },
  "Chef de cellule": { de: "Zellenchef", it: "Capo cellula" },
  "Hausse du niveau de l’Arve signalée au pont des Acacias. Reconnaissance demandée.":
    {
      de: "Anstieg des Pegels der Arve beim Pont des Acacias gemeldet. Erkundung angefordert.",
      it: "Aumento del livello dell’Arve segnalato al Pont des Acacias. Ricognizione richiesta.",
    },
  "Vérifier le niveau sur place et transmettre un compte rendu.": {
    de: "Pegel vor Ort überprüfen und Bericht übermitteln.",
    it: "Verificare il livello sul posto e trasmettere un rapporto.",
  },
  "Fermeture préventive de l’accès aux berges décidée par la direction de l’exercice.":
    {
      de: "Vorsorgliche Sperrung des Uferzugangs durch die Übungsleitung beschlossen.",
      it: "Chiusura preventiva dell’accesso alle sponde decisa dalla direzione dell’esercizio.",
    },
  "Mettre en place le balisage. Confirmer la fermeture des accès.": {
    de: "Markierung anbringen. Sperrung der Zugänge bestätigen.",
    it: "Predisporre la segnaletica. Confermare la chiusura degli accessi.",
  },
  "Demande de 200 sacs de sable et de deux véhicules de transport.": {
    de: "Anforderung von 200 Sandsäcken und zwei Transportfahrzeugen.",
    it: "Richiesta di 200 sacchi di sabbia e di due veicoli da trasporto.",
  },
  "200 sacs de sable · 2 véhicules": {
    de: "200 Sandsäcke · 2 Fahrzeuge",
    it: "200 sacchi di sabbia · 2 veicoli",
  },
  "Balisage du premier accès terminé. Aucun civil dans le périmètre.": {
    de: "Markierung des ersten Zugangs abgeschlossen. Keine Zivilpersonen im Perimeter.",
    it: "Segnaletica del primo accesso completata. Nessun civile nel perimetro.",
  },
  "Suite de l’entrée #003": {
    de: "Folge von Eintrag #003",
    it: "Seguito della voce #003",
  },
  "Maintenir la surveillance du périmètre.": {
    de: "Überwachung des Perimeters aufrechterhalten.",
    it: "Mantenere la sorveglianza del perimetro.",
  },
  "Un second accès aux berges reste ouvert. Une équipe est requise pour sécuriser le passage.":
    {
      de: "Ein zweiter Uferzugang bleibt offen. Eine Gruppe wird benötigt, um den Durchgang zu sichern.",
      it: "Un secondo accesso alle sponde resta aperto. È richiesta una squadra per mettere in sicurezza il passaggio.",
    },
  "Faire confirmer la fermeture et consigner la quittance.": {
    de: "Sperrung bestätigen lassen und Quittung eintragen.",
    it: "Far confermare la chiusura e registrare la quittanza.",
  },
  "Niveau confirmé par la patrouille sur place": {
    de: "Pegel durch die Patrouille vor Ort bestätigt",
    it: "Livello confermato dalla pattuglia sul posto",
  },

  // ---------- Radio ----------
  "PCi Conduite": { de: "ZS Führung", it: "PCi Condotta" },
  "PCi Engagement Arve": { de: "ZS Einsatz Arve", it: "PCi Impiego Arve" },
  "PCi Logistique": { de: "ZS Logistik", it: "PCi Logistica" },
  "Direct secteur Acacias": {
    de: "Direkt Sektor Acacias",
    it: "Diretto settore Acacias",
  },
  "Si couverture insuffisante sous les ponts.": {
    de: "Bei ungenügender Abdeckung unter den Brücken.",
    it: "In caso di copertura insufficiente sotto i ponti.",
  },
  "PC Carouge": { de: "KP Carouge", it: "PC Carouge" },
  "Poste de commandement": { de: "Kommandoposten", it: "Posto di comando" },
  "Conduite (unité)": { fr: "Conduite", de: "Führung", it: "Condotta" },
  "Station de transit": { de: "Relaisstation", it: "Stazione di transito" },
  "Direction exercice": { de: "Übungsleitung", it: "Direzione esercizio" },
  "Direction de l’exercice": {
    de: "Übungsleitung",
    it: "Direzione dell’esercizio",
  },
  "Chef section appui": {
    de: "Chef Unterstützungszug",
    it: "Capo sezione appoggio",
  },
  "Chef de section": { de: "Zugführer", it: "Capo sezione" },
  "Section appui": { de: "Unterstützungszug", it: "Sezione appoggio" },
  "Patrouille Alpha": { de: "Patrouille Alpha", it: "Pattuglia Alpha" },
  Reconnaissance: { de: "Erkundung", it: "Ricognizione" },
  "Équipe Bravo": { de: "Gruppe Bravo", it: "Squadra Bravo" },
  "Chef de groupe": { de: "Gruppenführer", it: "Capogruppo" },
  Logistique: { de: "Logistik", it: "Logistica" },
  "Préposé au matériel": { de: "Materialwart", it: "Addetto al materiale" },
  FICTIF: { de: "FIKTIV", it: "FITTIZIO" },
  "Écran fissuré. Retourné à l’arsenal.": {
    de: "Display gesprungen. Ans Zeughaus zurückgegeben.",
    it: "Schermo incrinato. Restituito all’arsenale.",
  },
  Pionnier: { de: "Pionier", it: "Pioniere" },
  Préposé: { de: "Materialwart", it: "Addetto" },
  "Retour complet.": {
    de: "Vollständig zurückgegeben.",
    it: "Restituzione completa.",
  },
  "Passerelle de la Fontenette : réception faible.": {
    de: "Passerelle de la Fontenette: schwacher Empfang.",
    it: "Passerelle de la Fontenette: ricezione debole.",
  },
  "Passage en mode direct D481.": {
    de: "Wechsel in den Direktmodus D481.",
    it: "Passaggio in modalità diretta D481.",
  },

  // ---------- Grades (référentiel « grades ») ----------
  Cap: { de: "Hptm", it: "Cap" },
  Plt: { de: "Oblt", it: "I ten" },
  Sgt: { de: "Wm", it: "Sgt" },
  Cpl: { de: "Kpl", it: "Cpl" },
  App: { de: "Gfr", it: "App" },
  Lt: { de: "Lt", it: "Ten" },
  Sgtm: { de: "Fw", it: "Sgtm" },

  // ---------- Cells and people ----------
  "PC front": { de: "KP Front", it: "PC avanzato" },
  "PC arrière": { de: "KP Rück", it: "PC arretrato" },
  "Cellule situation": { de: "Zelle Lage", it: "Cellula situazione" },
  Cellule: { de: "Zelle", it: "Cellula" },
  "Cellule logistique": { de: "Zelle Logistik", it: "Cellula logistica" },
  "Chef d’intervention": { de: "Einsatzleiter", it: "Capo intervento" },
  "Chef AIC": { de: "Chef FU", it: "Capo AC" },
  "Opérateur journal": { de: "Journalführer", it: "Operatore diario" },
  "Synthèse des messages": {
    de: "Meldungssynthese",
    it: "Sintesi dei messaggi",
  },
  Cartographe: { de: "Kartograf", it: "Cartografo" },
  "Opérateur radio": { de: "Funker", it: "Operatore radio" },
  "Chef logistique": { de: "Chef Logistik", it: "Capo logistica" },
  Téléphoniste: { de: "Telefonist", it: "Telefonista" },

  // ---------- Resources ----------
  Personnel: { de: "Personal", it: "Personale" },
  Véhicule: { de: "Fahrzeug", it: "Veicolo" },
  Matériel: { de: "Material", it: "Materiale" },
  "Protection civile": { de: "Zivilschutz", it: "Protezione civile" },
  "Pompiers (SIS)": { de: "Feuerwehr", it: "Pompieri" },
  "Sécuriser l’accès aux berges.": {
    de: "Zugang zum Ufer sichern.",
    it: "Mettere in sicurezza l’accesso alle sponde.",
  },
  "Reconnaissance du niveau de l’Arve.": {
    de: "Erkundung des Pegels der Arve.",
    it: "Ricognizione del livello dell’Arve.",
  },
  "Camions de transport PCi": {
    de: "Transportlastwagen ZS",
    it: "Autocarri da trasporto PCi",
  },
  Arsenal: { de: "Zeughaus", it: "Arsenale" },
  "Point de rassemblement Acacias": {
    de: "Sammelplatz Acacias",
    it: "Punto di raccolta Acacias",
  },
  "Livrer 200 sacs de sable.": {
    de: "200 Sandsäcke liefern.",
    it: "Consegnare 200 sacchi di sabbia.",
  },
  "Sacs de sable": { de: "Sandsäcke", it: "Sacchi di sabbia" },
  "Tonne-pompe SIS (fictif)": {
    de: "Tanklöschfahrzeug SIS (fiktiv)",
    it: "Autobotte SIS (fittizia)",
  },
  "Pompage des caves inondées.": {
    de: "Auspumpen der überfluteten Keller.",
    it: "Pompaggio delle cantine allagate.",
  },
  Motopompes: { de: "Motorspritzen", it: "Motopompe" },
  "Section appui (réserve)": {
    de: "Unterstützungszug (Reserve)",
    it: "Sezione appoggio (riserva)",
  },

  // ---------- Contacts ----------
  "Permanence de la commune (fictif)": {
    de: "Pikett der Gemeinde (fiktiv)",
    it: "Picchetto del comune (fittizio)",
  },
  Autorités: { de: "Behörden", it: "Autorità" },
  "Commune de Carouge · fictif": {
    de: "Gemeinde Carouge · fiktiv",
    it: "Comune di Carouge · fittizio",
  },
  "Permanence technique": {
    de: "Technischer Pikettdienst",
    it: "Picchetto tecnico",
  },
  "Centrale d’engagement (fictif)": {
    de: "Einsatzzentrale (fiktiv)",
    it: "Centrale d’intervento (fittizia)",
  },
  Partenaires: { de: "Partner", it: "Partner" },
  "Protection civile · fictif": {
    de: "Zivilschutz · fiktiv",
    it: "Protezione civile · fittizia",
  },
  "Fournisseur de sacs de sable (fictif)": {
    de: "Sandsacklieferant (fiktiv)",
    it: "Fornitore di sacchi di sabbia (fittizio)",
  },
  Fournisseurs: { de: "Lieferanten", it: "Fornitori" },
  "Entreprise fictive SA": { de: "Fiktive Firma AG", it: "Ditta fittizia SA" },

  // ---------- Messages (same texts as the scenario, shared/scenario-arve.ts) ----------
  Radio: { de: "Funk", it: "Radio" },
  Téléphone: { de: "Telefon", it: "Telefono" },
  Renseignement: { de: "Nachricht", it: "Informazione" },
  Alerte: { de: "Alarm", it: "Allarme" },
  "Compte rendu": { de: "Bericht", it: "Rapporto" },
  Information: { de: "Information", it: "Comunicazione" },
  Police: { de: "Polizei", it: "Polizia" },
  "Niveau de l’Arve en hausse": {
    de: "Pegel der Arve steigt",
    it: "Livello dell’Arve in aumento",
  },
  "Niveau en hausse rapide au pont des Acacias, environ 20 cm en 30 minutes.": {
    de: "Pegel steigt schnell beim Pont des Acacias, rund 20 cm in 30 Minuten.",
    it: "Livello in rapido aumento al Pont des Acacias, circa 20 cm in 30 minuti.",
  },
  "Eau sur la chaussée": {
    de: "Wasser auf der Fahrbahn",
    it: "Acqua sulla carreggiata",
  },
  "Eau sur la chaussée route de Veyrier à la hauteur de la Fontenette. Circulation dangereuse.":
    {
      de: "Wasser auf der Fahrbahn der Route de Veyrier auf der Höhe der Fontenette. Verkehr gefährlich.",
      it: "Acqua sulla carreggiata della route de Veyrier all’altezza della Fontenette. Circolazione pericolosa.",
    },
  "Sacs de sable en route": {
    de: "Sandsäcke unterwegs",
    it: "Sacchi di sabbia in viaggio",
  },
  "Deux camions partis de l’arsenal avec 200 sacs. Arrivée estimée dans 45 minutes.":
    {
      de: "Zwei Lastwagen mit 200 Säcken vom Zeughaus abgefahren. Voraussichtliche Ankunft in 45 Minuten.",
      it: "Due autocarri partiti dall’arsenale con 200 sacchi. Arrivo previsto tra 45 minuti.",
    },
  "Fermeture du pont": { de: "Sperrung der Brücke", it: "Chiusura del ponte" },
  "La police ferme le pont de Carouge à la circulation dès 09:30.": {
    de: "Die Polizei sperrt den Pont de Carouge ab 09:30 für den Verkehr.",
    it: "La polizia chiude al traffico il Pont de Carouge dalle 09:30.",
  },

  // ---------- Map ----------
  Emplacements: { de: "Standorte", it: "Ubicazioni" },
  Effets: { de: "Auswirkungen", it: "Effetti" },
  Mesures: { de: "Massnahmen", it: "Misure" },
  Moyens: { de: "Mittel", it: "Mezzi" },
  Dangers: { de: "Gefahren", it: "Pericoli" },
  "Zone inondée Acacias": {
    de: "Überflutete Zone Acacias",
    it: "Zona allagata Acacias",
  },
  "Surface estimée d’après la reconnaissance de 08:08.": {
    de: "Fläche geschätzt nach der Erkundung von 08:08.",
    it: "Superficie stimata in base alla ricognizione delle 08:08.",
  },
  "Fermeture des berges": {
    de: "Sperrung der Ufer",
    it: "Chiusura delle sponde",
  },
  "Tonne-pompe SIS": { de: "Tanklöschfahrzeug SIS", it: "Autobotte SIS" },
  "Second accès aux berges encore ouvert.": {
    de: "Zweiter Uferzugang noch offen.",
    it: "Secondo accesso alle sponde ancora aperto.",
  },
  "Route de Veyrier inondée": {
    de: "Route de Veyrier überflutet",
    it: "Route de Veyrier allagata",
  },
  "Barrage provisoire quai Ernest-Ansermet": {
    de: "Provisorische Sperre Quai Ernest-Ansermet",
    it: "Sbarramento provvisorio quai Ernest-Ansermet",
  },
  "Levé après l’ouverture de la déviation.": {
    de: "Nach Öffnung der Umleitung aufgehoben.",
    it: "Rimosso dopo l’apertura della deviazione.",
  },
  "Suivi général": { de: "Allgemeine Lageverfolgung", it: "Seguito generale" },
  "Vue d’ensemble pour le rapport de conduite": {
    de: "Übersicht für den Führungsrapport",
    it: "Visione d’insieme per il rapporto di condotta",
  },
  "Secteur Acacias (détail)": {
    de: "Sektor Acacias (Detail)",
    it: "Settore Acacias (dettaglio)",
  },
  "Engagement au pont des Acacias et au quai Charles-Page": {
    de: "Einsatz beim Pont des Acacias und am Quai Charles-Page",
    it: "Impiego al Pont des Acacias e al quai Charles-Page",
  },

  // ---------- Links ----------
  emplacement: { de: "Standort", it: "ubicazione" },
  reconnaissance: { de: "Erkundung", it: "ricognizione" },
  "signalé par": { de: "gemeldet von", it: "segnalato da" },
  décision: { de: "Entscheid", it: "decisione" },
  quittance: { de: "Quittung", it: "quittanza" },
  position: { de: "Position", it: "posizione" },
  livraison: { de: "Lieferung", it: "consegna" },
  "répond à": { de: "erfüllt", it: "risponde a" },
  "transporté par": { de: "transportiert von", it: "trasportato da" },
  concerne: { de: "betrifft", it: "riguarda" },
  "à informer": { de: "zu informieren", it: "da informare" },

  // ---------- Agenda ----------
  "Orientation initiale": {
    de: "Erste Orientierung",
    it: "Orientamento iniziale",
  },
  Orientation: { de: "Orientierung", it: "Orientamento" },
  "Chef d’intervention, chefs de cellule": {
    de: "Einsatzleiter, Zellenchefs",
    it: "Capo intervento, capi cellula",
  },
  "Rapport de conduite": {
    de: "Führungsrapport",
    it: "Rapporto di condotta",
  },
  "Chefs de cellule, chef de section": {
    de: "Zellenchefs, Zugführer",
    it: "Capi cellula, capo sezione",
  },
  "Point presse": { de: "Medienorientierung", it: "Punto stampa" },
  "Conférence de presse": { de: "Medienkonferenz", it: "Conferenza stampa" },
  "Mairie de Carouge (fictif)": {
    de: "Gemeindehaus Carouge (fiktiv)",
    it: "Municipio di Carouge (fittizio)",
  },
  Relève: { de: "Ablösung", it: "Avvicendamento" },

  // ---------- Key facts (seeds.ts FACTS) ----------
  "Personnes blessées": { de: "Verletzte Personen", it: "Persone ferite" },
  "Personnes évacuées": { de: "Evakuierte Personen", it: "Persone evacuate" },
  "Bâtiments touchés": { de: "Betroffene Gebäude", it: "Edifici colpiti" },
  "Routes fermées": { de: "Gesperrte Strassen", it: "Strade chiuse" },
  "Personnel engagé": {
    de: "Eingesetztes Personal",
    it: "Personale impiegato",
  },
  "Niveau de l’Arve (Acacias)": {
    de: "Pegel der Arve (Acacias)",
    it: "Livello dell’Arve (Acacias)",
  },
  "pers.": { de: "Pers.", it: "pers." },
  "bât.": { de: "Geb.", it: "edif." },
  Personnes: { de: "Personen", it: "Persone" },
  Bâtiments: { de: "Gebäude", it: "Edifici" },
  Infrastructures: { de: "Infrastruktur", it: "Infrastrutture" },
  Engagement: { de: "Einsatz", it: "Impiego" },

  // ---------- Situation boards (seeds.ts BOARDS) ----------
  "Situation générale": { de: "Allgemeine Lage", it: "Situazione generale" },
  "Crue de l’Arve après de fortes pluies. Montée d’environ 45 cm depuis 08:00 au pont des Acacias. Caves inondées quai Charles-Page.":
    {
      de: "Hochwasser der Arve nach starken Niederschlägen. Anstieg um rund 45 cm seit 08:00 beim Pont des Acacias. Überflutete Keller am Quai Charles-Page.",
      it: "Piena dell’Arve dopo forti piogge. Aumento di circa 45 cm dalle 08:00 al Pont des Acacias. Cantine allagate al quai Charles-Page.",
    },
  "Crue de l’Arve après de fortes pluies. Montée du niveau signalée au pont des Acacias.":
    {
      de: "Hochwasser der Arve nach starken Niederschlägen. Pegelanstieg beim Pont des Acacias gemeldet.",
      it: "Piena dell’Arve dopo forti piogge. Aumento del livello segnalato al Pont des Acacias.",
    },
  "Dangers et évolution probable": {
    de: "Gefahren und mögliche Entwicklung",
    it: "Pericoli ed evoluzione probabile",
  },
  "Pic attendu vers 13:00. Risque de débordement sur la route de Veyrier et aux accès des berges.":
    {
      de: "Höchststand gegen 13:00 erwartet. Gefahr von Überflutungen auf der Route de Veyrier und bei den Uferzugängen.",
      it: "Colmo atteso verso le 13:00. Rischio di esondazione sulla route de Veyrier e agli accessi alle sponde.",
    },
  "Intention / idée de manœuvre": {
    de: "Absicht / Einsatzidee",
    it: "Intenzione / idea di manovra",
  },
  "Fermer et baliser tous les accès aux berges, protéger les bâtiments du quai avec des sacs de sable, garder une réserve alertée.":
    {
      de: "Alle Uferzugänge sperren und markieren, die Gebäude am Quai mit Sandsäcken schützen, eine alarmierte Reserve bereithalten.",
      it: "Chiudere e segnalare tutti gli accessi alle sponde, proteggere gli edifici del quai con sacchi di sabbia, mantenere una riserva allertata.",
    },

  // ---------- Weather ----------
  "SO 20 km/h": { de: "SW 20 km/h", it: "SO 20 km/h" },
  "Pluie modérée": { de: "Mässiger Regen", it: "Pioggia moderata" },
  Bonne: { de: "Gut", it: "Buona" },
  "Couvert, pluie continue": {
    de: "Bedeckt, anhaltender Regen",
    it: "Coperto, pioggia continua",
  },
  "Fortes pluies": { de: "Starke Niederschläge", it: "Forti piogge" },
  Crues: { de: "Hochwasser", it: "Piene" },
  "MétéoSuisse (exemple fictif)": {
    de: "MeteoSchweiz (fiktives Beispiel)",
    it: "MeteoSvizzera (esempio fittizio)",
  },
  "Canton (exemple fictif)": {
    de: "Kanton (fiktives Beispiel)",
    it: "Cantone (esempio fittizio)",
  },
  "MétéoSuisse ICON-CH2 (exemple fictif)": {
    de: "MeteoSchweiz ICON-CH2 (fiktives Beispiel)",
    it: "MeteoSvizzera ICON-CH2 (esempio fittizio)",
  },

  // ---------- Frozen points and presentation ----------
  "Point de situation de 08:30": {
    de: "Lagerapport von 08:30",
    it: "Punto della situazione delle 08:30",
  },
  "État transmis à la centrale d’engagement.": {
    de: "Stand an die Einsatzzentrale übermittelt.",
    it: "Stato trasmesso alla centrale d’intervento.",
  },
  "Présenté aux chefs de cellule.": {
    de: "Den Zellenchefs präsentiert.",
    it: "Presentato ai capi cellula.",
  },
  "Maire de Carouge et préfet (fictifs)": {
    de: "Gemeindepräsident von Carouge und Präfekt (fiktiv)",
    it: "Sindaco di Carouge e prefetto (fittizi)",
  },
} satisfies Dict);
