import { translator, type Dict } from "../../../shared/i18n/core.ts";
import { common } from "../../../shared/i18n/common.ts";

// Situation map: MapModule, MapDialog, MapTabs, MapSearch, OverlayPanel,
// LiveLayer, panels, ProfilePanel. (The other map files: i18n-2.ts.)
// German: « LV95 » for MN95 (Landesvermessung 1995).
export const { t, tn, tIn, dict } = translator({
  ...common,

  // ---------- Tools ----------
  Sélection: { de: "Auswahl", it: "Selezione" },
  "Sélectionner et déplacer": {
    de: "Auswählen und verschieben",
    it: "Seleziona e sposta",
  },
  Point: { de: "Punkt", it: "Punto" },
  "Placer un signe": { de: "Signatur platzieren", it: "Posiziona un simbolo" },
  Ligne: { de: "Linie", it: "Linea" },
  "Tracer une ligne ou un itinéraire": {
    de: "Linie oder Route zeichnen",
    it: "Traccia una linea o un itinerario",
  },
  Zone: { de: "Fläche", it: "Zona" },
  "Dessiner une zone": { de: "Fläche zeichnen", it: "Disegna una zona" },
  Périmètre: { de: "Perimeter", it: "Perimetro" },
  "Périmètre circulaire : un centre, un rayon": {
    de: "Kreisförmiger Perimeter: ein Zentrum, ein Radius",
    it: "Perimetro circolare: un centro, un raggio",
  },
  Panache: { de: "Fahne", it: "Pennacchio" },
  "Secteur ou panache depuis un point : direction, ouverture et longueur (vent)":
    {
      de: "Sektor oder Fahne ab einem Punkt: Richtung, Öffnung und Länge (Wind)",
      it: "Settore o pennacchio da un punto: direzione, apertura e lunghezza (vento)",
    },
  Dessin: { de: "Freihand", it: "Disegno" },
  "Dessin libre, à la souris ou au doigt": {
    de: "Freihandzeichnen, mit Maus oder Finger",
    it: "Disegno libero, con il mouse o con il dito",
  },
  "Écrire un texte sur la carte": {
    de: "Text auf die Karte schreiben",
    it: "Scrivi un testo sulla carta",
  },
  Mesurer: { de: "Messen", it: "Misura" },
  "Mesurer une distance ou une surface": {
    de: "Distanz oder Fläche messen",
    it: "Misura una distanza o una superficie",
  },

  // ---------- Handles, markers ----------
  "Rotation : glisser, ou flèches pour tourner de 15°": {
    de: "Drehung: ziehen, oder Pfeiltasten für Schritte von 15°",
    it: "Rotazione: trascinare, o frecce per ruotare di 15°",
  },
  "Glisser pour tourner (flèches : 15°)": {
    de: "Ziehen zum Drehen (Pfeiltasten: 15°)",
    it: "Trascinare per ruotare (frecce: 15°)",
  },
  "Taille : glisser, ou flèches pour agrandir ou réduire": {
    de: "Grösse: ziehen, oder Pfeiltasten zum Vergrössern oder Verkleinern",
    it: "Dimensione: trascinare, o frecce per ingrandire o ridurre",
  },
  "Glisser pour agrandir ou réduire (flèches : ±{step})": {
    de: "Ziehen zum Vergrössern oder Verkleinern (Pfeiltasten: ±{step})",
    it: "Trascinare per ingrandire o ridurre (frecce: ±{step})",
  },
  "Objet de la carte": { de: "Kartenobjekt", it: "Oggetto della carta" },
  "Position citée : {title}": {
    de: "Erwähnte Position: {title}",
    it: "Posizione citata: {title}",
  },
  "les contributeurs d’OpenStreetMap": {
    de: "OpenStreetMap-Mitwirkende",
    it: "i contributori di OpenStreetMap",
  },

  // ---------- Undo ----------
  "Lecture seule : vous consultez le passé ou un journal clôturé.": {
    de: "Nur lesen: Sie sehen die Vergangenheit oder ein abgeschlossenes Journal.",
    it: "Sola lettura: è visualizzato il passato o un diario chiuso.",
  },
  "{n} objet modifié depuis par un autre poste : laissé tel quel.": {
    de: "{n} Objekt inzwischen von einem anderen Arbeitsplatz geändert: unverändert belassen.",
    it: "{n} oggetto modificato nel frattempo da un’altra postazione: lasciato invariato.",
  },
  "{n} objets modifiés depuis par un autre poste : laissés tels quels.": {
    de: "{n} Objekte inzwischen von einem anderen Arbeitsplatz geändert: unverändert belassen.",
    it: "{n} oggetti modificati nel frattempo da un’altra postazione: lasciati invariati.",
  },
  "Rien à annuler : l’objet a été modifié depuis par un autre poste.": {
    de: "Nichts rückgängig zu machen: Das Objekt wurde inzwischen von einem anderen Arbeitsplatz geändert.",
    it: "Niente da annullare: l’oggetto è stato modificato nel frattempo da un’altra postazione.",
  },

  // ---------- Measures while drawing ----------
  "rayon {r} · surface {a}": {
    de: "Radius {r} · Fläche {a}",
    it: "raggio {r} · superficie {a}",
  },
  "vers {dir} {deg}° · {len}": {
    de: "nach {dir} {deg}° · {len}",
    it: "verso {dir} {deg}° · {len}",
  },
  "périmètre {d}": { de: "Umfang {d}", it: "perimetro {d}" },
  "surface {a}": { de: "Fläche {a}", it: "superficie {a}" },

  // ---------- Shape editing ----------
  "Sommet {i} sur {n} : glisser ou flèches pour déplacer, Entrée pour retirer":
    {
      de: "Punkt {i} von {n}: ziehen oder Pfeiltasten zum Verschieben, Enter zum Entfernen",
      it: "Vertice {i} di {n}: trascinare o frecce per spostare, Invio per rimuovere",
    },
  "Au moins {n} sommets.": {
    de: "Mindestens {n} Punkte.",
    it: "Almeno {n} vertici.",
  },
  "Ajouter un sommet après le sommet {i}": {
    de: "Punkt nach Punkt {i} hinzufügen",
    it: "Aggiungi un vertice dopo il vertice {i}",
  },
  "Glissez les sommets · cliquez un sommet pour le retirer · « + » pour en ajouter":
    {
      de: "Punkte ziehen · Punkt anklicken zum Entfernen · « + » zum Hinzufügen",
      it: "Trascinare i vertici · clic su un vertice per rimuoverlo · « + » per aggiungerne",
    },
  "Forme enregistrée.": { de: "Form gespeichert.", it: "Forma salvata." },

  // ---------- Objects created (stored in the language of the post) ----------
  // Relation labels of the links written with a new object.
  position: { de: "Position", it: "posizione" },
  périmètre: { de: "Perimeter", it: "perimetro" },
  "Périmètre {d}": { de: "Perimeter {d}", it: "Perimetro {d}" },
  "Centre {where} · rayon {r}": {
    de: "Zentrum {where} · Radius {r}",
    it: "Centro {where} · raggio {r}",
  },
  "Centre {where} · rayon {r} · anneau {i} sur {n}": {
    de: "Zentrum {where} · Radius {r} · Ring {i} von {n}",
    it: "Centro {where} · raggio {r} · anello {i} di {n}",
  },
  "Panache {dir} · {len}": {
    de: "Fahne {dir} · {len}",
    it: "Pennacchio {dir} · {len}",
  },
  "Origine {where} · direction {deg}° ({dir}) · ouverture {angle}° · longueur {len}":
    {
      de: "Ursprung {where} · Richtung {deg}° ({dir}) · Öffnung {angle}° · Länge {len}",
      it: "Origine {where} · direzione {deg}° ({dir}) · apertura {angle}° · lunghezza {len}",
    },
  "Indiquez des rayons, par exemple « 100, 300, 1000 ».": {
    de: "Geben Sie Radien an, zum Beispiel « 100, 300, 1000 ».",
    it: "Indicare dei raggi, per esempio « 100, 300, 1000 ».",
  },
  "{n} périmètres créés et reliés.": {
    de: "{n} Perimeter erstellt und verknüpft.",
    it: "{n} perimetri creati e collegati.",
  },
  "Longueur trop courte : au moins 10 m.": {
    de: "Länge zu kurz: mindestens 10 m.",
    it: "Lunghezza troppo corta: almeno 10 m.",
  },
  "Rayon trop petit : au moins 5 m.": {
    de: "Radius zu klein: mindestens 5 m.",
    it: "Raggio troppo piccolo: almeno 5 m.",
  },
  "« {title} » est placé sur la carte.": {
    de: "« {title} » ist auf der Karte platziert.",
    it: "« {title} » è posizionato sulla carta.",
  },
  "Un tracé demande au moins deux points.": {
    de: "Eine Linie braucht mindestens zwei Punkte.",
    it: "Un tracciato richiede almeno due punti.",
  },
  "Une zone demande au moins trois points.": {
    de: "Eine Fläche braucht mindestens drei Punkte.",
    it: "Una zona richiede almeno tre punti.",
  },

  // ---------- Layers of geo.admin.ch ----------
  "Hors ligne : les informations des couches ne sont pas disponibles.": {
    de: "Offline: Die Informationen der Layer sind nicht verfügbar.",
    it: "Offline: le informazioni dei layer non sono disponibili.",
  },
  "Le service d’information de geo.admin.ch ne répond pas.": {
    de: "Der Informationsdienst von geo.admin.ch antwortet nicht.",
    it: "Il servizio d’informazione di geo.admin.ch non risponde.",
  },
  "Informations de la couche": {
    de: "Informationen des Layers",
    it: "Informazioni del layer",
  },
  "Recherche…": { de: "Suche …", it: "Ricerca…" },

  // ---------- Hover, focus ----------
  "Cliquer pour ouvrir": { de: "Klicken zum Öffnen", it: "Clic per aprire" },
  "Cliquer pour ouvrir · glisser pour déplacer": {
    de: "Klicken zum Öffnen · ziehen zum Verschieben",
    it: "Clic per aprire · trascinare per spostare",
  },
  "Position citée · cliquer pour la placer": {
    de: "Erwähnte Position · klicken zum Platzieren",
    it: "Posizione citata · clic per posizionarla",
  },
  "Lecture seule : vous consultez le passé. Revenez au direct pour placer un objet.":
    {
      de: "Nur lesen: Sie sehen die Vergangenheit. Kehren Sie zur Live-Ansicht zurück, um ein Objekt zu platzieren.",
      it: "Sola lettura: è visualizzato il passato. Tornare alla diretta per posizionare un oggetto.",
    },
  "Journal clôturé : la carte est en lecture seule.": {
    de: "Journal abgeschlossen: Die Karte ist schreibgeschützt.",
    it: "Diario chiuso: la carta è in sola lettura.",
  },
  "Élément introuvable.": {
    de: "Element nicht gefunden.",
    it: "Elemento non trovato.",
  },
  "Cet objet n’est plus sur la carte.": {
    de: "Dieses Objekt ist nicht mehr auf der Karte.",
    it: "Questo oggetto non è più sulla carta.",
  },

  // ---------- View, position, framing ----------
  "Aucun objet visible à afficher.": {
    de: "Kein sichtbares Objekt anzuzeigen.",
    it: "Nessun oggetto visibile da mostrare.",
  },
  "Position indisponible sur cet appareil.": {
    de: "Position auf diesem Gerät nicht verfügbar.",
    it: "Posizione non disponibile su questo dispositivo.",
  },
  "Ma position": { de: "Meine Position", it: "La mia posizione" },
  "Position refusée : autorisez la localisation dans le navigateur.": {
    de: "Position verweigert: Erlauben Sie die Standortbestimmung im Browser.",
    it: "Posizione rifiutata: autorizzare la localizzazione nel browser.",
  },
  "Position indisponible pour le moment.": {
    de: "Position zurzeit nicht verfügbar.",
    it: "Posizione al momento non disponibile.",
  },
  "Lecture seule : le cadrage n’est pas enregistré.": {
    de: "Nur lesen: Der Ausschnitt wird nicht gespeichert.",
    it: "Sola lettura: l’inquadratura non viene salvata.",
  },
  "Cadrage enregistré pour « {name} ».": {
    de: "Ausschnitt für « {name} » gespeichert.",
    it: "Inquadratura salvata per « {name} ».",
  },
  "Vue par défaut enregistrée pour ce journal.": {
    de: "Standardansicht für dieses Journal gespeichert.",
    it: "Vista predefinita salvata per questo diario.",
  },
  "{n} objet gardé sur « {name} » seulement.": {
    de: "{n} Objekt nur auf « {name} » behalten.",
    it: "{n} oggetto mantenuto solo su « {name} ».",
  },
  "{n} objets gardés sur « {name} » seulement.": {
    de: "{n} Objekte nur auf « {name} » behalten.",
    it: "{n} oggetti mantenuti solo su « {name} ».",
  },
  Objet: { de: "Objekt", it: "Oggetto" },
  "{name} déplacé de {d} vers le nord.": {
    de: "{name} um {d} nach Norden verschoben.",
    it: "{name} spostato di {d} verso nord.",
  },
  "{name} déplacé de {d} vers le sud.": {
    de: "{name} um {d} nach Süden verschoben.",
    it: "{name} spostato di {d} verso sud.",
  },
  "{name} déplacé de {d} vers l’est.": {
    de: "{name} um {d} nach Osten verschoben.",
    it: "{name} spostato di {d} verso est.",
  },
  "{name} déplacé de {d} vers l’ouest.": {
    de: "{name} um {d} nach Westen verschoben.",
    it: "{name} spostato di {d} verso ovest.",
  },
  // Name of a downloaded file.
  carte: { de: "karte", it: "carta" },
  "GeoJSON MN95 (EPSG:2056) enregistré.": {
    de: "GeoJSON LV95 (EPSG:2056) gespeichert.",
    it: "GeoJSON MN95 (EPSG:2056) salvato.",
  },

  // ---------- Hint bar ----------
  "Cliquez sur la carte pour placer « {name} »": {
    de: "Klicken Sie auf die Karte, um « {name} » zu platzieren",
    it: "Fare clic sulla carta per posizionare « {name} »",
  },
  "Annuler le placement": {
    de: "Platzieren abbrechen",
    it: "Annulla il posizionamento",
  },
  "Dessinez à la souris ou au doigt · chaque trait devient un tracé": {
    de: "Mit Maus oder Finger zeichnen · jeder Strich wird eine Linie",
    it: "Disegnare con il mouse o con il dito · ogni tratto diventa un tracciato",
  },
  "Calque des traits": { de: "Ebene der Striche", it: "Livello dei tratti" },
  "Fermer le dessin libre": {
    de: "Freihandzeichnen schliessen",
    it: "Chiudi il disegno libero",
  },
  "Cliquez à l’endroit où écrire le texte.": {
    de: "Klicken Sie dort, wo der Text stehen soll.",
    it: "Fare clic nel punto in cui scrivere il testo.",
  },
  "Cliquez pour fixer le rayon, ou choisissez :": {
    de: "Klicken, um den Radius festzulegen, oder wählen:",
    it: "Fare clic per fissare il raggio, o scegliere:",
  },
  "Cliquez le centre du périmètre": {
    de: "Zentrum des Perimeters anklicken",
    it: "Fare clic sul centro del perimetro",
  },
  "Rayons des anneaux, en mètres (ex. 100, 300, 1000)": {
    de: "Radien der Ringe, in Metern (z. B. 100, 300, 1000)",
    it: "Raggi degli anelli, in metri (es. 100, 300, 1000)",
  },
  "Rayons des anneaux concentriques, en m (ou km)": {
    de: "Radien der konzentrischen Ringe, in m (oder km)",
    it: "Raggi degli anelli concentrici, in m (o km)",
  },
  Anneaux: { de: "Ringe", it: "Anelli" },
  "Calque du périmètre": {
    de: "Ebene des Perimeters",
    it: "Livello del perimetro",
  },
  "Fermer l’outil": { de: "Werkzeug schliessen", it: "Chiudi lo strumento" },
  "Cliquez la direction et la longueur, ou saisissez-les :": {
    de: "Richtung und Länge anklicken oder eingeben:",
    it: "Fare clic su direzione e lunghezza, o inserirle:",
  },
  "Cliquez l’origine du panache (source, foyer)": {
    de: "Ursprung der Fahne anklicken (Quelle, Brandherd)",
    it: "Fare clic sull’origine del pennacchio (sorgente, focolaio)",
  },
  Vers: { de: "Nach", it: "Verso" },
  "Direction du panache, en degrés depuis le nord": {
    de: "Richtung der Fahne, in Grad ab Norden",
    it: "Direzione del pennacchio, in gradi da nord",
  },
  "Vent de {dir} ({deg}°), {speed} km/h · prévision {place}": {
    de: "Wind aus {dir} ({deg}°), {speed} km/h · Prognose {place}",
    it: "Vento da {dir} ({deg}°), {speed} km/h · previsione {place}",
  },
  "Vent de {dir} ({deg}°) · prévision {place}": {
    de: "Wind aus {dir} ({deg}°) · Prognose {place}",
    it: "Vento da {dir} ({deg}°) · previsione {place}",
  },
  "Vent actuel": { de: "Aktueller Wind", it: "Vento attuale" },
  "Ouverture du secteur": {
    de: "Öffnung des Sektors",
    it: "Apertura del settore",
  },
  "Long.": { de: "Länge", it: "Lungh." },
  "Longueur du panache, en mètres": {
    de: "Länge der Fahne, in Metern",
    it: "Lunghezza del pennacchio, in metri",
  },
  "Cliquez le coin opposé du secteur à garder hors ligne": {
    de: "Gegenüberliegende Ecke des offline zu haltenden Sektors anklicken",
    it: "Fare clic sull’angolo opposto del settore da tenere offline",
  },
  "Cliquez un coin du secteur à garder hors ligne": {
    de: "Eine Ecke des offline zu haltenden Sektors anklicken",
    it: "Fare clic su un angolo del settore da tenere offline",
  },
  "Mesure terminée · cliquez pour recommencer": {
    de: "Messung beendet · klicken für eine neue Messung",
    it: "Misura terminata · fare clic per ricominciare",
  },
  "Double-clic pour terminer la mesure": {
    de: "Doppelklick beendet die Messung",
    it: "Doppio clic per terminare la misura",
  },
  "Cliquez des points pour mesurer": {
    de: "Punkte anklicken zum Messen",
    it: "Fare clic su dei punti per misurare",
  },
  "Double-clic ou « Terminer » pour finir · Échap pour annuler": {
    de: "Doppelklick oder « Beenden » zum Abschliessen · Esc zum Abbrechen",
    it: "Doppio clic o « Termina » per finire · Esc per annullare",
  },
  "Cliquez pour tracer la ligne, point par point": {
    de: "Klicken, um die Linie Punkt für Punkt zu zeichnen",
    it: "Fare clic per tracciare la linea, punto per punto",
  },
  "Cliquez les coins de la zone": {
    de: "Ecken der Fläche anklicken",
    it: "Fare clic sugli angoli della zona",
  },
  "Calque du nouvel objet": {
    de: "Ebene des neuen Objekts",
    it: "Livello del nuovo oggetto",
  },
  "Retirer le dernier point": {
    de: "Letzten Punkt entfernen",
    it: "Rimuovi l’ultimo punto",
  },
  "Retirer le dernier point (⌫)": {
    de: "Letzten Punkt entfernen (⌫)",
    it: "Rimuovi l’ultimo punto (⌫)",
  },

  // ---------- Map screen ----------
  "« {name} » s’ouvrira ici pour tous les postes": {
    de: "« {name} » öffnet sich für alle Arbeitsplätze hier",
    it: "« {name} » si aprirà qui per tutte le postazioni",
  },
  "La carte s’ouvrira ici pour tous les postes": {
    de: "Die Karte öffnet sich für alle Arbeitsplätze hier",
    it: "La carta si aprirà qui per tutte le postazioni",
  },
  "Enregistrer le cadrage": {
    de: "Ausschnitt speichern",
    it: "Salva l’inquadratura",
  },
  "Carte de situation": { de: "Lagekarte", it: "Carta della situazione" },
  "Panneau de la carte": {
    de: "Seitenleiste der Karte",
    it: "Pannello della carta",
  },
  Objets: { de: "Objekte", it: "Oggetti" },
  Signes: { de: "Signaturen", it: "Simboli" },
  Calques: { de: "Ebenen", it: "Livelli" },
  "Fermer le panneau": {
    de: "Seitenleiste schliessen",
    it: "Chiudi il pannello",
  },
  "{n} objet posé avant la deuxième carte s’affiche sur toutes les cartes.": {
    de: "{n} Objekt, das vor der zweiten Karte platziert wurde, erscheint auf allen Karten.",
    it: "{n} oggetto posizionato prima della seconda carta appare su tutte le carte.",
  },
  "{n} objets posés avant la deuxième carte s’affichent sur toutes les cartes.":
    {
      de: "{n} Objekte, die vor der zweiten Karte platziert wurden, erscheinen auf allen Karten.",
      it: "{n} oggetti posizionati prima della seconda carta appaiono su tutte le carte.",
    },
  "Garder sur « {name} » seulement": {
    de: "Nur auf « {name} » behalten",
    it: "Mantieni solo su « {name} »",
  },
  "C’est voulu": { de: "Ist so gewollt", it: "È voluto" },
  "Zoom avant": { de: "Vergrössern", it: "Ingrandisci" },
  "Zoom arrière": { de: "Verkleinern", it: "Riduci" },
  "Déverrouiller les objets": {
    de: "Objekte entsperren",
    it: "Sblocca gli oggetti",
  },
  "Verrouiller les objets": { de: "Objekte sperren", it: "Blocca gli oggetti" },
  "Objets verrouillés : aucun déplacement possible. Cliquer pour déverrouiller.":
    {
      de: "Objekte gesperrt: kein Verschieben möglich. Klicken zum Entsperren.",
      it: "Oggetti bloccati: nessuno spostamento possibile. Clic per sbloccare.",
    },
  "Verrouiller les objets (évite de les déplacer par erreur)": {
    de: "Objekte sperren (verhindert versehentliches Verschieben)",
    it: "Blocca gli oggetti (evita di spostarli per errore)",
  },
  "Objets verrouillés : ils ne bougent plus, même en glissant dessus.": {
    de: "Objekte gesperrt: Auch beim Ziehen bewegen sie sich nicht mehr.",
    it: "Oggetti bloccati: non si muovono più, nemmeno trascinandoli.",
  },
  "Objets déverrouillés : glisser un objet le déplace.": {
    de: "Objekte entsperrt: Ziehen verschiebt ein Objekt.",
    it: "Oggetti sbloccati: trascinare un oggetto lo sposta.",
  },
  "Voir tous les objets": {
    de: "Alle Objekte anzeigen",
    it: "Mostra tutti gli oggetti",
  },
  "Vue par défaut": { de: "Standardansicht", it: "Vista predefinita" },
  "Revenir à la vue par défaut": {
    de: "Zurück zur Standardansicht",
    it: "Torna alla vista predefinita",
  },
  "Quitter le plein écran": {
    de: "Vollbild beenden",
    it: "Esci dallo schermo intero",
  },
  "Quitter le plein écran (Échap)": {
    de: "Vollbild beenden (Esc)",
    it: "Esci dallo schermo intero (Esc)",
  },
  "Carte en plein écran": {
    de: "Karte im Vollbild",
    it: "Carta a schermo intero",
  },
  "Hors ligne : le fond de carte n’est plus téléchargé. Les objets restent visibles ; les zones déjà consultées restent en cache.":
    {
      de: "Offline: Der Kartenhintergrund wird nicht mehr heruntergeladen. Die Objekte bleiben sichtbar; bereits angesehene Gebiete bleiben im Cache.",
      it: "Offline: lo sfondo della carta non viene più scaricato. Gli oggetti restano visibili; le zone già consultate restano nella cache.",
    },
  "Le serveur du fond ({server}) ne répond pas. Les objets restent visibles.": {
    de: "Der Server des Hintergrunds ({server}) antwortet nicht. Die Objekte bleiben sichtbar.",
    it: "Il server dello sfondo ({server}) non risponde. Gli oggetti restano visibili.",
  },
  Réessayer: { de: "Erneut versuchen", it: "Riprova" },
  Masquer: { de: "Ausblenden", it: "Nascondi" },
  "Centre de la carte : cliquer pour copier (MN95 ou WGS84)": {
    de: "Kartenmitte: klicken zum Kopieren (LV95 oder WGS84)",
    it: "Centro della carta: clic per copiare (MN95 o WGS84)",
  },
  "Position du curseur : cliquer pour copier (MN95 ou WGS84)": {
    de: "Cursorposition: klicken zum Kopieren (LV95 oder WGS84)",
    it: "Posizione del cursore: clic per copiare (MN95 o WGS84)",
  },
  "Outils de la carte": { de: "Kartenwerkzeuge", it: "Strumenti della carta" },
  "Annuler la dernière opération sur la carte": {
    de: "Letzte Änderung auf der Karte rückgängig machen",
    it: "Annulla l’ultima operazione sulla carta",
  },
  "Annuler (⌘Z / Ctrl+Z) : opérations de ce poste": {
    de: "Rückgängig (⌘Z / Ctrl+Z): Änderungen dieses Arbeitsplatzes",
    it: "Annulla (⌘Z / Ctrl+Z): operazioni di questa postazione",
  },
  "Rétablir l’opération annulée": {
    de: "Rückgängig gemachte Änderung wiederherstellen",
    it: "Ripristina l’operazione annullata",
  },
  "Rétablir (⇧⌘Z / Ctrl+Y)": {
    de: "Wiederherstellen (⇧⌘Z / Ctrl+Y)",
    it: "Ripristina (⇧⌘Z / Ctrl+Y)",
  },
  "Liste des objets, signes et calques": {
    de: "Liste der Objekte, Signaturen und Ebenen",
    it: "Elenco di oggetti, simboli e livelli",
  },
  Liste: { de: "Liste", it: "Elenco" },
  "Quadrillage MN95": { de: "LV95-Gitter", it: "Reticolo MN95" },
  "1 km, 100 m en zoom rapproché": {
    de: "1 km, 100 m bei starkem Zoom",
    it: "1 km, 100 m con zoom ravvicinato",
  },
  "Réticule au centre": {
    de: "Fadenkreuz in der Mitte",
    it: "Mirino al centro",
  },
  "Coordonnées du centre, à copier": {
    de: "Koordinaten der Mitte, zum Kopieren",
    it: "Coordinate del centro, da copiare",
  },
  "Couches geo.admin.ch…": {
    de: "Layer von geo.admin.ch …",
    it: "Layer di geo.admin.ch…",
  },
  "Dangers, cadastre, crues et vent en direct": {
    de: "Gefahren, Kataster, Hochwasser und Wind live",
    it: "Pericoli, catasto, piene e vento in diretta",
  },
  "{n} affichée(s)": { de: "{n} angezeigt", it: "visualizzati: {n}" },
  "Position citée": { de: "Erwähnte Position", it: "Posizione citata" },
  "Créer un objet ici": {
    de: "Objekt hier erstellen",
    it: "Crea un oggetto qui",
  },
  "Coordonnées MN95 copiées : {text}": {
    de: "LV95-Koordinaten kopiert: {text}",
    it: "Coordinate MN95 copiate: {text}",
  },
  "Coordonnées WGS84 copiées : {text}": {
    de: "WGS84-Koordinaten kopiert: {text}",
    it: "Coordinate WGS84 copiate: {text}",
  },
  "Copie impossible.": {
    de: "Kopieren nicht möglich.",
    it: "Copia impossibile.",
  },
  MN95: { de: "LV95", it: "MN95" },

  // ---------- MapDialog ----------
  "Vue d’ensemble de l’événement": {
    de: "Übersicht des Ereignisses",
    it: "Panoramica dell’evento",
  },
  "Secteur en détail": { de: "Sektor im Detail", it: "Settore in dettaglio" },
  "Itinéraires et circulation": {
    de: "Routen und Verkehr",
    it: "Itinerari e circolazione",
  },
  "Moyens et logistique": {
    de: "Mittel und Logistik",
    it: "Mezzi e logistica",
  },
  "Information à la population": {
    de: "Information der Bevölkerung",
    it: "Informazione alla popolazione",
  },
  "Donnez un nom à la carte.": {
    de: "Geben Sie der Karte einen Namen.",
    it: "Dare un nome alla carta.",
  },
  "Carte enregistrée.": { de: "Karte gespeichert.", it: "Carta salvata." },
  "Carte nommée.": { de: "Karte benannt.", it: "Carta denominata." },
  "Carte « {name} » créée.": {
    de: "Karte « {name} » erstellt.",
    it: "Carta « {name} » creata.",
  },
  "Carte supprimée avec {n} objet.": {
    de: "Karte mit {n} Objekt gelöscht.",
    it: "Carta eliminata con {n} oggetto.",
  },
  "Carte supprimée avec {n} objets.": {
    de: "Karte mit {n} Objekten gelöscht.",
    it: "Carta eliminata con {n} oggetti.",
  },
  "Carte supprimée.": { de: "Karte gelöscht.", it: "Carta eliminata." },
  "Modifier la carte": { de: "Karte bearbeiten", it: "Modifica la carta" },
  "Nommer la carte": { de: "Karte benennen", it: "Denomina la carta" },
  "Nouvelle carte": { de: "Neue Karte", it: "Nuova carta" },
  "ex. Secteur Nord (détail)": {
    de: "z. B. Sektor Nord (Detail)",
    it: "es. Settore Nord (dettaglio)",
  },
  "But de la carte": { de: "Zweck der Karte", it: "Scopo della carta" },
  "ex. Suivi des évacuations du quartier nord": {
    de: "z. B. Verfolgung der Evakuierungen im Nordquartier",
    it: "es. Seguito delle evacuazioni del quartiere nord",
  },
  "Buts fréquents": { de: "Häufige Zwecke", it: "Scopi frequenti" },
  "La nouvelle carte part vide, du cadrage et du fond affichés. Elle garde ensuite son propre fond, son cadrage et ses calques masqués, partagés avec tous les postes.":
    {
      de: "Die neue Karte beginnt leer, mit dem angezeigten Ausschnitt und Hintergrund. Danach behält sie ihren eigenen Hintergrund, Ausschnitt und ihre ausgeblendeten Ebenen, geteilt mit allen Arbeitsplätzen.",
      it: "La nuova carta parte vuota, con l’inquadratura e lo sfondo visualizzati. Mantiene poi il proprio sfondo, la propria inquadratura e i propri livelli nascosti, condivisi con tutte le postazioni.",
    },
  "Reprendre les {n} objet de « {name} »": {
    de: "{n} Objekt von « {name} » übernehmen",
    it: "Riprendi {n} oggetto di « {name} »",
  },
  "Reprendre les {n} objets de « {name} »": {
    de: "{n} Objekte von « {name} » übernehmen",
    it: "Riprendi i {n} oggetti di « {name} »",
  },
  "Les mêmes objets, visibles sur les deux cartes. Sinon, la nouvelle carte part vide.":
    {
      de: "Dieselben Objekte, auf beiden Karten sichtbar. Sonst beginnt die neue Karte leer.",
      it: "Gli stessi oggetti, visibili sulle due carte. Altrimenti, la nuova carta parte vuota.",
    },
  "Ordre (rang)": { fr: "Ordre", de: "Reihenfolge", it: "Ordine" },
  Avant: { de: "Davor", it: "Prima" },
  Après: { de: "Danach", it: "Dopo" },
  "Supprimer cette carte ?": {
    de: "Diese Karte löschen?",
    it: "Eliminare questa carta?",
  },
  "Supprimer aussi ses {n} objet propres": {
    de: "Auch ihr {n} eigenes Objekt löschen",
    it: "Elimina anche il suo {n} oggetto proprio",
  },
  "Supprimer aussi ses {n} objets propres": {
    de: "Auch ihre {n} eigenen Objekte löschen",
    it: "Elimina anche i suoi {n} oggetti propri",
  },
  "Sinon, ils passent sur toutes les cartes.": {
    de: "Sonst erscheinen sie auf allen Karten.",
    it: "Altrimenti, passano su tutte le carte.",
  },
  "Supprimer la carte": { de: "Karte löschen", it: "Elimina la carta" },
  Nommer: { de: "Benennen", it: "Denomina" },
  "Créer la carte": { de: "Karte erstellen", it: "Crea la carta" },

  // ---------- MapTabs ----------
  "Cartes de l’opération": {
    de: "Karten des Einsatzes",
    it: "Carte dell’operazione",
  },
  "Nouvelle carte (ex. un secteur en détail)": {
    de: "Neue Karte (z. B. ein Sektor im Detail)",
    it: "Nuova carta (es. un settore in dettaglio)",
  },
  "Menu de la carte": { de: "Kartenmenü", it: "Menu della carta" },
  "Carte : cadrage, import, export": {
    de: "Karte: Ausschnitt, Import, Export",
    it: "Carta: inquadratura, importazione, esportazione",
  },
  "Modifier cette carte": {
    de: "Diese Karte bearbeiten",
    it: "Modifica questa carta",
  },
  "Nommer cette carte": {
    de: "Diese Karte benennen",
    it: "Denomina questa carta",
  },
  "Nom, but, ordre, suppression": {
    de: "Name, Zweck, Reihenfolge, Löschen",
    it: "Nome, scopo, ordine, eliminazione",
  },
  "Un secteur en détail, une phase…": {
    de: "Ein Sektor im Detail, eine Phase …",
    it: "Un settore in dettaglio, una fase…",
  },
  "Enregistrer ce cadrage pour cette carte": {
    de: "Diesen Ausschnitt für diese Karte speichern",
    it: "Salva questa inquadratura per questa carta",
  },
  "Elle s’ouvrira ici sur tous les postes": {
    de: "Sie öffnet sich hier auf allen Arbeitsplätzen",
    it: "Si aprirà qui su tutte le postazioni",
  },
  "Importer KML / GeoJSON / GPX": {
    de: "KML / GeoJSON / GPX importieren",
    it: "Importa KML / GeoJSON / GPX",
  },
  "Fichier reçu d’un partenaire, trace GPS": {
    de: "Datei eines Partners, GPS-Track",
    it: "File ricevuto da un partner, traccia GPS",
  },
  "Exporter ou imprimer…": {
    de: "Exportieren oder drucken …",
    it: "Esporta o stampa…",
  },
  "Image, PDF, KML, GeoJSON, GPX": {
    de: "Bild, PDF, KML, GeoJSON, GPX",
    it: "Immagine, PDF, KML, GeoJSON, GPX",
  },
  "Imprimer à l’échelle": {
    de: "Massstabsgetreu drucken",
    it: "Stampa in scala",
  },
  "A4 / A3, 1:5 000 à 1:50 000, quadrillage, légende": {
    de: "A4 / A3, 1:5 000 bis 1:50 000, Gitter, Legende",
    it: "A4 / A3, da 1:5 000 a 1:50 000, reticolo, legenda",
  },
  "GeoJSON en MN95": { de: "GeoJSON in LV95", it: "GeoJSON in MN95" },
  "EPSG:2056, pour les SIG suisses": {
    de: "EPSG:2056, für Schweizer GIS",
    it: "EPSG:2056, per i GIS svizzeri",
  },
  "Carte hors ligne…": { de: "Offline-Karte …", it: "Carta offline…" },
  "Télécharger un secteur, voir l’espace utilisé": {
    de: "Sektor herunterladen, belegten Speicher anzeigen",
    it: "Scarica un settore, vedi lo spazio usato",
  },

  // ---------- MapSearch ----------
  "Recherche de lieux indisponible (hors ligne ?). Les coordonnées fonctionnent toujours.":
    {
      de: "Ortssuche nicht verfügbar (offline?). Koordinaten funktionieren weiterhin.",
      it: "Ricerca di luoghi non disponibile (offline?). Le coordinate funzionano sempre.",
    },
  "Rechercher un lieu ou aller à des coordonnées": {
    de: "Ort suchen oder zu Koordinaten springen",
    it: "Cerca un luogo o vai a delle coordinate",
  },
  "Lieu, adresse ou coordonnées (2 500 000 / 1 117 000)": {
    de: "Ort, Adresse oder Koordinaten (2 500 000 / 1 117 000)",
    it: "Luogo, indirizzo o coordinate (2 500 000 / 1 117 000)",
  },
  "Aller à {label}": { de: "Gehe zu {label}", it: "Vai a {label}" },
  "Aucun lieu trouvé.": {
    de: "Kein Ort gefunden.",
    it: "Nessun luogo trovato.",
  },

  // ---------- OverlayPanel ----------
  "Couches geo.admin.ch": {
    de: "Layer von geo.admin.ch",
    it: "Layer di geo.admin.ch",
  },
  "Hors ligne : seules les zones déjà vues (ou d’un secteur téléchargé) s’affichent.":
    {
      de: "Offline: Nur bereits angesehene Gebiete (oder die eines heruntergeladenen Sektors) werden angezeigt.",
      it: "Offline: sono visualizzate solo le zone già viste (o di un settore scaricato).",
    },
  "Crue, cadastre, vent…": {
    de: "Hochwasser, Kataster, Wind …",
    it: "Piena, catasto, vento…",
  },
  "Chercher une couche": { de: "Layer suchen", it: "Cerca un layer" },
  "Opacité : {name}": { de: "Deckkraft: {name}", it: "Opacità: {name}" },
  "Légende officielle (geo.admin.ch)": {
    de: "Offizielle Legende (geo.admin.ch)",
    it: "Legenda ufficiale (geo.admin.ch)",
  },
  Légende: { de: "Legende", it: "Legenda" },
  "{n} élément": { de: "{n} Element", it: "{n} elemento" },
  "{n} éléments": { de: "{n} Elemente", it: "{n} elementi" },
  "données du {at}": { de: "Daten vom {at}", it: "dati del {at}" },
  "Cliquez sur la carte pour interroger la couche.": {
    de: "Klicken Sie auf die Karte, um den Layer abzufragen.",
    it: "Fare clic sulla carta per interrogare il layer.",
  },
  "Données officielles de la Confédération et des cantons, gratuites. Les zones d’inondation des barrages et les abris ne sont pas publics.":
    {
      de: "Offizielle Daten des Bundes und der Kantone, kostenlos. Die Überflutungszonen der Talsperren und die Schutzräume sind nicht öffentlich.",
      it: "Dati ufficiali della Confederazione e dei Cantoni, gratuiti. Le zone d’inondazione delle dighe e i rifugi non sono pubblici.",
    },

  // ---------- ProfilePanel ----------
  "Profil altimétrique": { de: "Höhenprofil", it: "Profilo altimetrico" },
  Recalculer: { de: "Neu berechnen", it: "Ricalcola" },
  Calculer: { de: "Berechnen", it: "Calcola" },
  "Altitudes le long de la ligne (swissALTI3D, swisstopo) : dénivelé, pentes, point le plus haut.":
    {
      de: "Höhen entlang der Linie (swissALTI3D, swisstopo): Höhendifferenz, Neigungen, höchster Punkt.",
      it: "Altitudini lungo la linea (swissALTI3D, swisstopo): dislivello, pendenze, punto più alto.",
    },
  "Profil : de {min} à {max} sur {len}": {
    de: "Profil: von {min} bis {max} auf {len}",
    it: "Profilo: da {min} a {max} su {len}",
  },
  Longueur: { de: "Länge", it: "Lunghezza" },
  Altitude: { de: "Höhe", it: "Altitudine" },
  Montée: { de: "Aufstieg", it: "Salita" },
  Descente: { de: "Abstieg", it: "Discesa" },
  "Pente max.": { de: "Max. Neigung", it: "Pendenza max." },
  "Pente moyenne": { de: "Mittlere Neigung", it: "Pendenza media" },
  "swissALTI3D © swisstopo · calculé le {when}": {
    de: "swissALTI3D © swisstopo · berechnet am {when}",
    it: "swissALTI3D © swisstopo · calcolato il {when}",
  },

  // ---------- LiveLayer ----------
  Équipe: { de: "Team", it: "Squadra" },
  "Position en direct : {label}": {
    de: "Live-Position: {label}",
    it: "Posizione in diretta: {label}",
  },
  "Ce poste · position partagée": {
    de: "Dieser Arbeitsplatz · geteilte Position",
    it: "Questa postazione · posizione condivisa",
  },
  "Position en direct": { de: "Live-Position", it: "Posizione in diretta" },
  Relevée: { de: "Erfasst", it: "Rilevata" },
  "(ancienne)": { de: "(veraltet)", it: "(vecchia)" },
  "Poste inconnu": {
    de: "Unbekannter Arbeitsplatz",
    it: "Postazione sconosciuta",
  },
  Précision: { de: "Genauigkeit", it: "Precisione" },
  Vitesse: { de: "Geschwindigkeit", it: "Velocità" },
  "cap {deg}°": { de: "Kurs {deg}°", it: "rotta {deg}°" },
  Centrer: { de: "Zentrieren", it: "Centra" },
  "Entrée avec les coordonnées {mn95}": {
    de: "Eintrag mit den Koordinaten {mn95}",
    it: "Voce con le coordinate {mn95}",
  },
  "Position consignée au journal.": {
    de: "Position im Journal erfasst.",
    it: "Posizione registrata nel diario.",
  },
  "Consigner au journal": {
    de: "Im Journal erfassen",
    it: "Registra nel diario",
  },
  "Créer un point ici": { de: "Punkt hier erstellen", it: "Crea un punto qui" },
  Fiche: { de: "Details", it: "Scheda" },
  "Position partagée : détails": {
    de: "Position geteilt: Details",
    it: "Posizione condivisa: dettagli",
  },
  "Partager ma position": {
    de: "Meine Position teilen",
    it: "Condividi la mia posizione",
  },
  "Position partagée en direct : détails et arrêt": {
    de: "Position live geteilt: Details und Beenden",
    it: "Posizione condivisa in diretta: dettagli e interruzione",
  },
  "Partager ma position en direct avec les autres postes": {
    de: "Meine Position live mit den anderen Arbeitsplätzen teilen",
    it: "Condividi la mia posizione in diretta con le altre postazioni",
  },

  // ---------- panels ----------
  signe: { de: "Signatur", it: "simbolo" },
  tracé: { de: "Linie", it: "tracciato" },
  zone: { de: "Fläche", it: "zona" },
  texte: { de: "Text", it: "testo" },
  "Entrée : ouvrir · flèches : déplacer de 10 m (Maj : 100 m, Alt : 1 m)": {
    de: "Enter: öffnen · Pfeiltasten: 10 m verschieben (Shift: 100 m, Alt: 1 m)",
    it: "Invio: aprire · frecce: spostare di 10 m (Maiusc: 100 m, Alt: 1 m)",
  },
  "Filtrer les objets…": { de: "Objekte filtern …", it: "Filtra gli oggetti…" },
  "Filtrer les objets de la carte": {
    de: "Objekte der Karte filtern",
    it: "Filtra gli oggetti della carta",
  },
  "Objet sans nom": { de: "Objekt ohne Namen", it: "Oggetto senza nome" },
  "Sans calque": { de: "Ohne Ebene", it: "Senza livello" },
  masqué: { de: "ausgeblendet", it: "nascosto" },
  "{n} lien(s)": { de: "{n} Verknüpfung(en)", it: "collegamenti: {n}" },
  "Aucun objet ne correspond.": {
    de: "Kein Objekt entspricht der Suche.",
    it: "Nessun oggetto corrisponde.",
  },
  "Aucun objet sur la carte. Choisissez « Point », « Ligne » ou « Zone » en bas de la carte pour commencer.":
    {
      de: "Kein Objekt auf der Karte. Wählen Sie unten auf der Karte « Punkt », « Linie » oder « Fläche », um zu beginnen.",
      it: "Nessun oggetto sulla carta. Scegliere « Punto », « Linea » o « Zona » in basso sulla carta per iniziare.",
    },
  "Les calques apparaissent ici dès qu’un objet est placé (Effets, Dangers, Moyens…).":
    {
      de: "Die Ebenen erscheinen hier, sobald ein Objekt platziert ist (Auswirkungen, Gefahren, Mittel …).",
      it: "I livelli appaiono qui non appena un oggetto è posizionato (Effetti, Pericoli, Mezzi…).",
    },
  "Tout afficher": { de: "Alle anzeigen", it: "Mostra tutto" },
  "Entrées et messages dont les coordonnées ne sont pas encore sur la carte": {
    de: "Einträge und Meldungen, deren Koordinaten noch nicht auf der Karte sind",
    it: "Voci e messaggi le cui coordinate non sono ancora sulla carta",
  },
  "Positions citées": { de: "Erwähnte Positionen", it: "Posizioni citate" },
  "Coordonnées lues dans les entrées du journal et les messages, pas encore placées.":
    {
      de: "Koordinaten aus Journaleinträgen und Meldungen, noch nicht platziert.",
      it: "Coordinate lette nelle voci del diario e nei messaggi, non ancora posizionate.",
    },
  "Équipes qui partagent leur position GPS, gardées en mémoire seulement": {
    de: "Teams, die ihre GPS-Position teilen, nur im Arbeitsspeicher gehalten",
    it: "Squadre che condividono la loro posizione GPS, tenute solo in memoria",
  },
  "Positions en direct": { de: "Live-Positionen", it: "Posizioni in diretta" },
  "Masquées dans la machine à remonter le temps : elles ne sont jamais enregistrées.":
    {
      de: "In der Zeitreise ausgeblendet: Live-Positionen werden nie gespeichert.",
      it: "Nascoste nella macchina del tempo: non vengono mai salvate.",
    },
  "Jamais enregistrées : visibles tant que les postes les partagent, 30 minutes au plus.":
    {
      de: "Nie gespeichert: sichtbar, solange die Arbeitsplätze sie teilen, höchstens 30 Minuten.",
      it: "Mai salvate: visibili finché le postazioni le condividono, al massimo 30 minuti.",
    },
} satisfies Dict);
