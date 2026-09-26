import { translator, type Dict } from "./core.ts";

// Texts of the example scenario « Crue de l’Arve » (shared/scenario-arve.ts)
// and the vocabulary the demonstration shares with it: names of resources,
// key facts, message subjects and authors that the injects look up by name
// (src/journal/demo*.ts, src/exercise/demo.ts). The scenario is written in
// the language of the post when it is generated; once in a journal, it is
// data and is never translated again.

export const { t, tIn, dict } = translator({
  // ---------- Shared with the demonstration journal ----------
  // Resources, key facts and message subjects matched by name by the injects.
  "Équipe Bravo": { de: "Gruppe Bravo", it: "Squadra Bravo" },
  "Patrouille Alpha": { de: "Patrouille Alpha", it: "Pattuglia Alpha" },
  "Camions de transport PCi": {
    de: "Transportlastwagen ZS",
    it: "Autocarri da trasporto PCi",
  },
  "Sacs de sable": { de: "Sandsäcke", it: "Sacchi di sabbia" },
  "Section appui": { de: "Unterstützungszug", it: "Sezione appoggio" },
  "Section appui (réserve)": {
    de: "Unterstützungszug (Reserve)",
    it: "Sezione appoggio (riserva)",
  },
  "Niveau de l’Arve (Acacias)": {
    de: "Pegel der Arve (Acacias)",
    it: "Livello dell’Arve (Acacias)",
  },
  "Personnes évacuées": { de: "Evakuierte Personen", it: "Persone evacuate" },
  "Point de rassemblement Acacias": {
    de: "Sammelplatz Acacias",
    it: "Punto di raccolta Acacias",
  },
  "PC Carouge": { de: "KP Carouge", it: "PC Carouge" },
  "Opérateur A · fictif": {
    de: "Operateur A · fiktiv",
    it: "Operatore A · fittizio",
  },
  "Opérateur B · fictif": {
    de: "Operateur B · fiktiv",
    it: "Operatore B · fittizio",
  },
  "Chef d’intervention · fictif": {
    de: "Einsatzleiter · fiktiv",
    it: "Capo intervento · fittizio",
  },
  "Direction d’exercice · fictive": {
    de: "Übungsleitung · fiktiv",
    it: "Direzione d’esercizio · fittizia",
  },

  // Référentiel values (shared/i18n/seeds.ts).
  "PC front": { de: "KP Front", it: "PC avanzato" },
  "PC arrière": { de: "KP Rück", it: "PC arretrato" },
  "Chef d’intervention": { de: "Einsatzleiter", it: "Capo intervento" },
  "Chef AIC": { de: "Chef FU", it: "Capo AC" },
  "Cellule situation": { de: "Zelle Lage", it: "Cellula situazione" },
  "Centrale d’engagement": {
    de: "Einsatzzentrale",
    it: "Centrale d’intervento",
  },
  Téléphoniste: { de: "Telefonist", it: "Telefonista" },
  Logistique: { de: "Logistik", it: "Logistica" },
  Police: { de: "Polizei", it: "Polizia" },
  Commune: { de: "Gemeinde", it: "Comune" },
  Renseignement: { de: "Nachricht", it: "Informazione" },
  Information: { de: "Information", it: "Comunicazione" },
  Alerte: { de: "Alarm", it: "Allarme" },
  "Compte rendu": { de: "Bericht", it: "Rapporto" },
  Demande: { de: "Anfrage", it: "Richiesta" },
  "pers.": { de: "Pers.", it: "pers." },

  // ---------- Scenario ----------
  "Crue de l’Arve": { de: "Hochwasser der Arve", it: "Piena dell’Arve" },
  "Exercice de conduite fictif : crue de l’Arve à Carouge (GE). Montée des eaux, fermeture des berges, sacs de sable, évacuation d’un quartier, hébergement et information de la population. Durée prévue : 4 heures.":
    {
      de: "Fiktive Führungsübung: Hochwasser der Arve in Carouge (GE). Steigender Pegel, Sperrung der Ufer, Sandsäcke, Evakuierung eines Quartiers, Unterbringung und Information der Bevölkerung. Vorgesehene Dauer: 4 Stunden.",
      it: "Esercizio di condotta fittizio: piena dell’Arve a Carouge (GE). Innalzamento delle acque, chiusura delle sponde, sacchi di sabbia, evacuazione di un quartiere, alloggio e informazione della popolazione. Durata prevista: 4 ore.",
    },

  // Messages already in the demonstration journal (same subjects).
  "Niveau de l’Arve en hausse": {
    de: "Pegel der Arve steigt",
    it: "Livello dell’Arve in aumento",
  },
  "Niveau en hausse rapide au pont des Acacias, environ 20 cm en 30 minutes.": {
    de: "Pegel steigt rasch beim Pont des Acacias, rund 20 cm in 30 Minuten.",
    it: "Livello in rapido aumento al Pont des Acacias, circa 20 cm in 30 minuti.",
  },
  "Consigner au journal, demander une reconnaissance, informer le chef d’intervention.":
    {
      de: "Im Journal erfassen, eine Erkundung anfordern, den Einsatzleiter informieren.",
      it: "Registrare nel diario, chiedere una ricognizione, informare il capo intervento.",
    },
  "Appel d’un riverain inquiet": {
    de: "Anruf eines besorgten Anwohners",
    it: "Chiamata di un residente preoccupato",
  },
  "Riverain (joué par la direction)": {
    de: "Anwohner (gespielt von der Übungsleitung)",
    it: "Residente (interpretato dalla direzione)",
  },
  "« L’eau monte dans mon jardin au chemin de la Fontenette, est-ce qu’on doit partir ? » Répondre calmement, noter l’adresse.":
    {
      de: "« Das Wasser steigt in meinem Garten am Chemin de la Fontenette, müssen wir weg? » Ruhig antworten, Adresse notieren.",
      it: "« L’acqua sale nel mio giardino al chemin de la Fontenette, dobbiamo andarcene? » Rispondere con calma, annotare l’indirizzo.",
    },
  "Noter l’adresse, consigner au journal, transmettre à la cellule situation.":
    {
      de: "Adresse notieren, im Journal erfassen, an die Zelle Lage weiterleiten.",
      it: "Annotare l’indirizzo, registrare nel diario, trasmettere alla cellula situazione.",
    },
  "Eau sur la chaussée": {
    de: "Wasser auf der Fahrbahn",
    it: "Acqua sulla carreggiata",
  },
  "Eau sur la chaussée route de Veyrier à la hauteur de la Fontenette. Circulation dangereuse.":
    {
      de: "Wasser auf der Fahrbahn der Route de Veyrier auf der Höhe der Fontenette. Verkehr gefährdet.",
      it: "Acqua sulla carreggiata della route de Veyrier all’altezza della Fontenette. Circolazione pericolosa.",
    },
  "Demander la fermeture de la route à la police, placer l’obstacle sur la carte.":
    {
      de: "Bei der Polizei die Sperrung der Strasse beantragen, das Hindernis auf der Karte eintragen.",
      it: "Chiedere alla polizia la chiusura della strada, posizionare l’ostacolo sulla carta.",
    },
  "Sacs de sable en route": {
    de: "Sandsäcke unterwegs",
    it: "Sacchi di sabbia in viaggio",
  },
  "Deux camions partis de l’arsenal avec 200 sacs. Arrivée estimée dans 45 minutes.":
    {
      de: "Zwei Lastwagen mit 200 Säcken haben das Zeughaus verlassen. Voraussichtliche Ankunft in 45 Minuten.",
      it: "Due autocarri partiti dall’arsenale con 200 sacchi. Arrivo previsto tra 45 minuti.",
    },
  "Mettre à jour l’état des moyens.": {
    de: "Stand der Mittel nachführen.",
    it: "Aggiornare lo stato dei mezzi.",
  },
  "Fermeture du pont": { de: "Sperrung der Brücke", it: "Chiusura del ponte" },
  "La police ferme le pont de Carouge à la circulation dès 09:30.": {
    de: "Die Polizei sperrt den Pont de Carouge ab 09:30 für den Verkehr.",
    it: "La polizia chiude al traffico il Pont de Carouge dalle 09:30.",
  },
  "Informer les sections engagées de la déviation.": {
    de: "Die eingesetzten Züge über die Umleitung informieren.",
    it: "Informare le sezioni impiegate della deviazione.",
  },

  // Injects played while the visitor watches.
  "Seuil d’alerte 2 atteint": {
    de: "Warnstufe 2 erreicht",
    it: "Soglia d’allerta 2 raggiunta",
  },
  "La station hydrométrique (fictive) des Acacias indique + 60 cm depuis le début de l’événement, montée de 12 cm par heure. Seuil d’alerte 2 atteint.":
    {
      de: "Die (fiktive) hydrometrische Station Acacias meldet + 60 cm seit Ereignisbeginn, Anstieg um 12 cm pro Stunde. Warnstufe 2 erreicht.",
      it: "La stazione idrometrica (fittizia) di Acacias indica + 60 cm dall’inizio dell’evento, aumento di 12 cm all’ora. Soglia d’allerta 2 raggiunta.",
    },
  "Mettre à jour le renseignement clé, consigner, informer le chef d’intervention.":
    {
      de: "Schlüsselinformation nachführen, erfassen, den Einsatzleiter informieren.",
      it: "Aggiornare l’informazione chiave, registrare, informare il capo intervento.",
    },
  "Camions arrivés au point de rassemblement": {
    de: "Lastwagen am Sammelplatz eingetroffen",
    it: "Autocarri arrivati al punto di raccolta",
  },
  "Les deux camions sont au point de rassemblement Acacias. Déchargement des sacs en cours.":
    {
      de: "Die beiden Lastwagen sind am Sammelplatz Acacias. Die Säcke werden abgeladen.",
      it: "I due autocarri sono al punto di raccolta Acacias. Scarico dei sacchi in corso.",
    },
  "Mettre à jour l’état des moyens, quittancer.": {
    de: "Stand der Mittel nachführen, quittieren.",
    it: "Aggiornare lo stato dei mezzi, dare quittanza.",
  },
  "Fortes pluies annoncées": {
    de: "Starkregen angekündigt",
    it: "Forti piogge annunciate",
  },
  "Pluie forte sur le bassin de l’Arve pour les trois prochaines heures, 10 à 15 mm par heure, rafales à 50 km/h.":
    {
      de: "Starker Regen im Einzugsgebiet der Arve in den nächsten drei Stunden, 10 bis 15 mm pro Stunde, Böen bis 50 km/h.",
      it: "Pioggia forte sul bacino dell’Arve per le prossime tre ore, da 10 a 15 mm all’ora, raffiche a 50 km/h.",
    },
  "Consigner, mettre à jour la météo, apprécier l’évolution.": {
    de: "Erfassen, Wetter nachführen, Entwicklung beurteilen.",
    it: "Registrare, aggiornare la meteo, valutare l’evoluzione.",
  },
  "Pluie forte, rafales": {
    de: "Starker Regen, Böen",
    it: "Pioggia forte, raffiche",
  },
  "SO 35 km/h, rafales 50 km/h": {
    de: "SW 35 km/h, Böen 50 km/h",
    it: "SO 35 km/h, raffiche 50 km/h",
  },
  "Personne bloquée dans un véhicule": {
    de: "Person in einem Fahrzeug eingeschlossen",
    it: "Persona bloccata in un veicolo",
  },
  "Une conductrice est bloquée dans sa voiture, eau à mi-portière, route de Veyrier 120. Les pompiers sont demandés.":
    {
      de: "Eine Lenkerin ist in ihrem Auto eingeschlossen, Wasser bis zur halben Türhöhe, Route de Veyrier 120. Die Feuerwehr ist angefordert.",
      it: "Una conducente è bloccata nella sua auto, acqua a metà portiera, route de Veyrier 120. Sono stati chiamati i pompieri.",
    },
  "Transmettre immédiatement au SIS, engager la réserve pour sécuriser, consigner la mission.":
    {
      de: "Sofort an die Feuerwehr (SIS) weiterleiten, die Reserve zur Sicherung einsetzen, den Auftrag erfassen.",
      it: "Trasmettere immediatamente ai pompieri (SIS), impiegare la riserva per mettere in sicurezza, registrare la missione.",
    },
  "Réserve en route": { de: "Reserve unterwegs", it: "Riserva in viaggio" },
  "La section appui (réserve) quitte le PC Carouge, 12 personnes, arrivée dans 15 minutes.":
    {
      de: "Der Unterstützungszug (Reserve) verlässt den KP Carouge, 12 Personen, Ankunft in 15 Minuten.",
      it: "La sezione appoggio (riserva) lascia il PC Carouge, 12 persone, arrivo tra 15 minuti.",
    },
  "PC Carouge → Route de Veyrier": {
    de: "KP Carouge → Route de Veyrier",
    it: "PC Carouge → Route de Veyrier",
  },
  "Demande d’hébergement": {
    de: "Anfrage für Unterbringung",
    it: "Richiesta di alloggio",
  },
  "La commune demande 30 places d’hébergement pour la nuit pour les habitants évacués du quartier de la Fontenette.":
    {
      de: "Die Gemeinde verlangt 30 Übernachtungsplätze für die evakuierten Bewohner des Quartiers Fontenette.",
      it: "Il Comune chiede 30 posti letto per la notte per gli abitanti evacuati dal quartiere della Fontenette.",
    },
  "Consigner la demande, créer la mission hébergement, désigner un responsable et une échéance.":
    {
      de: "Anfrage erfassen, Auftrag Unterbringung erstellen, eine verantwortliche Person und eine Frist bestimmen.",
      it: "Registrare la richiesta, creare la missione alloggio, designare un responsabile e una scadenza.",
    },
  "Caves inondées": { de: "Überflutete Keller", it: "Cantine allagate" },
  Riverain: { de: "Anwohner", it: "Residente" },
  "Trois caves inondées rue Jacques-Dalphin, pas de blessé, demande de motopompe.":
    {
      de: "Drei überflutete Keller an der Rue Jacques-Dalphin, keine Verletzten, Motorspritze angefordert.",
      it: "Tre cantine allagate in rue Jacques-Dalphin, nessun ferito, richiesta di una motopompa.",
    },
  "Consigner, décider de l’engagement d’une motopompe.": {
    de: "Erfassen, über den Einsatz einer Motorspritze entscheiden.",
    it: "Registrare, decidere l’impiego di una motopompa.",
  },
  "Six autres personnes évacuées du quartier de la Fontenette (18 en tout), regroupées à l’école des Pervenches.":
    {
      de: "Sechs weitere Personen aus dem Quartier Fontenette evakuiert (18 insgesamt), im Schulhaus Pervenches versammelt.",
      it: "Altre sei persone evacuate dal quartiere della Fontenette (18 in tutto), raggruppate alla scuola des Pervenches.",
    },
  "Mettre à jour le renseignement clé « Personnes évacuées ».": {
    de: "Schlüsselinformation « Evakuierte Personen » nachführen.",
    it: "Aggiornare l’informazione chiave « Persone evacuate ».",
  },
  "Point presse demandé": {
    de: "Medienauskunft verlangt",
    it: "Punto stampa richiesto",
  },
  "Journaliste (joué par la direction)": {
    de: "Journalist (gespielt von der Übungsleitung)",
    it: "Giornalista (interpretato dalla direzione)",
  },
  "Un journaliste de la presse locale (fictive) demande une déclaration sur l’évacuation. Répondre selon la ligne de communication.":
    {
      de: "Ein Journalist der (fiktiven) Lokalpresse verlangt eine Stellungnahme zur Evakuierung. Gemäss Kommunikationslinie antworten.",
      it: "Un giornalista della stampa locale (fittizia) chiede una dichiarazione sull’evacuazione. Rispondere secondo la linea di comunicazione.",
    },
  "Renvoyer vers la cellule communication, consigner la demande, fixer un point presse à l’agenda.":
    {
      de: "An die Zelle Kommunikation verweisen, Anfrage erfassen, einen Medientermin in die Agenda eintragen.",
      it: "Rinviare alla cellula comunicazione, registrare la richiesta, fissare un punto stampa in agenda.",
    },
  "Niveau stabilisé": { de: "Pegel stabilisiert", it: "Livello stabilizzato" },
  "Niveau stable depuis 20 minutes au pont des Acacias, + 65 cm.": {
    de: "Pegel seit 20 Minuten stabil beim Pont des Acacias, + 65 cm.",
    it: "Livello stabile da 20 minuti al Pont des Acacias, + 65 cm.",
  },
  "Consigner, mettre à jour le renseignement clé.": {
    de: "Erfassen, Schlüsselinformation nachführen.",
    it: "Registrare, aggiornare l’informazione chiave.",
  },
  "Pluie faiblissante": {
    de: "Nachlassender Regen",
    it: "Pioggia in diminuzione",
  },
  "Les précipitations faiblissent, 2 mm par heure. Fin de l’alerte de fortes pluies attendue à 16 h.":
    {
      de: "Die Niederschläge lassen nach, 2 mm pro Stunde. Ende der Starkregenwarnung um 16 Uhr erwartet.",
      it: "Le precipitazioni diminuiscono, 2 mm all’ora. Fine dell’allerta per forti piogge prevista alle 16.",
    },
  "Mettre à jour la météo.": {
    de: "Wetter nachführen.",
    it: "Aggiornare la meteo.",
  },
  "Pluie faible": { de: "Schwacher Regen", it: "Pioggia debole" },
  "SO 15 km/h": { de: "SW 15 km/h", it: "SO 15 km/h" },
  "Équipe Bravo de retour": {
    de: "Gruppe Bravo zurück",
    it: "Squadra Bravo rientrata",
  },
  "Accès aux berges sécurisés, relevés par la section appui. Équipe Bravo de retour au PC pour la relève.":
    {
      de: "Zugänge zu den Ufern gesichert, vom Unterstützungszug abgelöst. Gruppe Bravo zurück im KP für die Ablösung.",
      it: "Accessi alle sponde messi in sicurezza, rilevati dalla sezione appoggio. Squadra Bravo rientrata al PC per l’avvicendamento.",
    },
  "Mettre à jour l’état des moyens, organiser la relève.": {
    de: "Stand der Mittel nachführen, Ablösung organisieren.",
    it: "Aggiornare lo stato dei mezzi, organizzare l’avvicendamento.",
  },
} satisfies Dict);
