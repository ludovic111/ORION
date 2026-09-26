import { pick, translator, type Dict } from "../../../shared/i18n/core.ts";
import { common } from "../../../shared/i18n/common.ts";

// Map module, second dictionary: sheets and dialogs of the map objects,
// symbols, geo.admin.ch layers, offline sectors, print to scale, files.
// (MapModule.tsx and its panels have their own dictionary, i18n.ts.)

export const { t, tn, tIn, dict } = translator({
  ...common,

  // ---------- Symbols (builtins.ts, symbols.tsx) ----------
  Signe: { de: "Signatur", it: "Simbolo" },
  "Signe officiel": { de: "Offizielle Signatur", it: "Simbolo ufficiale" },
  Point: { de: "Punkt", it: "Punto" },
  Texte: { de: "Text", it: "Testo" },
  Tracé: { de: "Linie", it: "Tracciato" },
  Zone: { de: "Zone", it: "Zona" },
  Personnalisés: { de: "Eigene", it: "Personalizzati" },
  "Marqueurs simples": { de: "Einfache Marker", it: "Marcatori semplici" },
  Récents: { de: "Zuletzt verwendet", it: "Recenti" },
  "Signes personnalisés": { de: "Eigene Signaturen", it: "Simboli propri" },
  "Chercher : incendie, Feuer, frana, ambulance…": {
    de: "Suchen: Feuer, incendie, frana, Ambulanz …",
    it: "Cerca: incendio, Feuer, incendie, ambulanza…",
  },
  "Chercher un signe (français, allemand ou italien)": {
    de: "Signatur suchen (Deutsch, Französisch oder Italienisch)",
    it: "Cerca un simbolo (italiano, francese o tedesco)",
  },
  "Familles de signes": { de: "Signaturfamilien", it: "Famiglie di simboli" },
  "Ajouter un signe": { de: "Signatur hinzufügen", it: "Aggiungi un simbolo" },
  "Image PNG, SVG, JPEG ou WebP · fond rendu transparent": {
    de: "Bild PNG, SVG, JPEG oder WebP · Hintergrund wird transparent",
    it: "Immagine PNG, SVG, JPEG o WebP · sfondo reso trasparente",
  },
  "Chargement des signes…": {
    de: "Signaturen werden geladen …",
    it: "Caricamento dei simboli…",
  },
  "Modifier le signe « {name} »": {
    de: "Signatur « {name} » bearbeiten",
    it: "Modifica il simbolo « {name} »",
  },
  "Renommer, remplacer ou supprimer": {
    de: "Umbenennen, ersetzen oder löschen",
    it: "Rinomina, sostituisci o elimina",
  },
  "Aucun signe ne correspond.": {
    de: "Keine passende Signatur.",
    it: "Nessun simbolo corrispondente.",
  },
  "Aucun signe personnalisé.": {
    de: "Keine eigenen Signaturen.",
    it: "Nessun simbolo proprio.",
  },
  "Aucun signe personnalisé. Ajoutez le logo d’un partenaire, un pictogramme maison… Il sera disponible sur tous les postes.":
    {
      de: "Keine eigenen Signaturen. Fügen Sie das Logo eines Partners, ein eigenes Piktogramm … hinzu. Es steht auf allen Arbeitsplätzen zur Verfügung.",
      it: "Nessun simbolo proprio. Aggiungere il logo di un partner, un pittogramma proprio… Sarà disponibile su tutte le postazioni.",
    },
  "Aucun signe récent.": {
    de: "Keine zuletzt verwendeten Signaturen.",
    it: "Nessun simbolo recente.",
  },
  "Signes conventionnels civils · OFPP": {
    de: "Zivile Signaturen · BABS",
    it: "Simboli convenzionali civili · UFPP",
  },

  // ---------- Custom symbol editor (SymbolEditor.tsx, image.ts) ----------
  Partenaires: { de: "Partner", it: "Partner" },
  Logos: { de: "Logos", it: "Loghi" },
  Pictogrammes: { de: "Piktogramme", it: "Pittogrammi" },
  "Donnez un nom au signe.": {
    de: "Geben Sie der Signatur einen Namen.",
    it: "Dare un nome al simbolo.",
  },
  "Choisissez une image.": {
    de: "Wählen Sie ein Bild.",
    it: "Scegliere un’immagine.",
  },
  "Signe modifié.": { de: "Signatur geändert.", it: "Simbolo modificato." },
  "Signe ajouté à la palette.": {
    de: "Signatur zur Palette hinzugefügt.",
    it: "Simbolo aggiunto alla tavolozza.",
  },
  "Signe supprimé.": { de: "Signatur gelöscht.", it: "Simbolo eliminato." },
  "Modifier le signe": { de: "Signatur bearbeiten", it: "Modifica il simbolo" },
  "Aperçu du signe": {
    de: "Vorschau der Signatur",
    it: "Anteprima del simbolo",
  },
  "Choisir une image": { de: "Bild wählen", it: "Scegli un’immagine" },
  "PNG, SVG, JPEG ou WebP · 2 Mo au maximum": {
    de: "PNG, SVG, JPEG oder WebP · höchstens 2 MB",
    it: "PNG, SVG, JPEG o WebP · al massimo 2 MB",
  },
  "Remplacer l’image": { de: "Bild ersetzen", it: "Sostituisci l’immagine" },
  "Retoucher le fond": {
    de: "Hintergrund nachbearbeiten",
    it: "Ritocca lo sfondo",
  },
  "Rendre le fond transparent": {
    de: "Hintergrund transparent machen",
    it: "Rendi trasparente lo sfondo",
  },
  "Retire la couleur unie qui touche les bords de l’image.": {
    de: "Entfernt die einheitliche Farbe, die an die Bildränder grenzt.",
    it: "Rimuove il colore uniforme che tocca i bordi dell’immagine.",
  },
  Tolérance: { de: "Toleranz", it: "Tolleranza" },
  "Plus haut : retire aussi les teintes proches du fond.": {
    de: "Höher: entfernt auch Farbtöne nahe am Hintergrund.",
    it: "Più alto: rimuove anche le tinte vicine allo sfondo.",
  },
  "ex. Poste avancé Rega, logo SIS…": {
    de: "z. B. Rega-Vorposten, Logo Feuerwehr …",
    it: "p. es. Posto avanzato Rega, logo pompieri…",
  },
  Famille: { de: "Familie", it: "Famiglia" },
  "ex. Partenaires": { de: "z. B. Partner", it: "p. es. Partner" },
  "Utilisé par {n} objet de la carte.": {
    de: "Von {n} Kartenobjekt verwendet.",
    it: "Usato da {n} oggetto della carta.",
  },
  "Utilisé par {n} objets de la carte.": {
    de: "Von {n} Kartenobjekten verwendet.",
    it: "Usato da {n} oggetti della carta.",
  },
  "Aucun objet ne l’utilise pour le moment.": {
    de: "Derzeit verwendet kein Objekt diese Signatur.",
    it: "Per il momento nessun oggetto lo usa.",
  },
  "Supprimer ? {n} objet perdra son signe.": {
    de: "Löschen? {n} Objekt verliert seine Signatur.",
    it: "Eliminare? {n} oggetto perderà il suo simbolo.",
  },
  "Supprimer ? {n} objets perdront leur signe.": {
    de: "Löschen? {n} Objekte verlieren ihre Signatur.",
    it: "Eliminare? {n} oggetti perderanno il loro simbolo.",
  },
  "Supprimer ce signe ?": {
    de: "Diese Signatur löschen?",
    it: "Eliminare questo simbolo?",
  },
  "Ajouter à la palette": {
    de: "Zur Palette hinzufügen",
    it: "Aggiungi alla tavolozza",
  },
  "Ce fichier SVG est illisible.": {
    de: "Diese SVG-Datei ist nicht lesbar.",
    it: "Questo file SVG è illeggibile.",
  },
  "Ce SVG contient du code ou du contenu intégré : il est refusé.": {
    de: "Dieses SVG enthält Code oder eingebettete Inhalte: es wird abgelehnt.",
    it: "Questo SVG contiene codice o contenuti incorporati: è rifiutato.",
  },
  "Ce SVG contient des actions : il est refusé.": {
    de: "Dieses SVG enthält Aktionen: es wird abgelehnt.",
    it: "Questo SVG contiene azioni: è rifiutato.",
  },
  "Ce SVG charge des ressources externes : il est refusé.": {
    de: "Dieses SVG lädt externe Ressourcen: es wird abgelehnt.",
    it: "Questo SVG carica risorse esterne: è rifiutato.",
  },
  "Image illisible.": {
    de: "Bild nicht lesbar.",
    it: "Immagine illeggibile.",
  },
  "Image trop lourde : 2 Mo au maximum.": {
    de: "Bild zu gross: höchstens 2 MB.",
    it: "Immagine troppo pesante: al massimo 2 MB.",
  },
  "Format non pris en charge : PNG, SVG, JPEG ou WebP.": {
    de: "Format nicht unterstützt: PNG, SVG, JPEG oder WebP.",
    it: "Formato non supportato: PNG, SVG, JPEG o WebP.",
  },
  "Image vide.": { de: "Leeres Bild.", it: "Immagine vuota." },
  "Image trop détaillée pour être enregistrée.": {
    de: "Bild zu detailliert, um gespeichert zu werden.",
    it: "Immagine troppo dettagliata per essere salvata.",
  },

  // ---------- Object sheet (PlaceSheet.tsx) ----------
  "Selon le calque": { de: "Gemäss Ebene", it: "Secondo il livello" },
  Rouge: { de: "Rot", it: "Rosso" },
  Orange: { de: "Orange", it: "Arancione" },
  Jaune: { de: "Gelb", it: "Giallo" },
  Vert: { de: "Grün", it: "Verde" },
  Bleu: { de: "Blau", it: "Blu" },
  Violet: { de: "Violett", it: "Viola" },
  Rose: { de: "Rosa", it: "Rosa" },
  Noir: { de: "Schwarz", it: "Nero" },
  Blanc: { de: "Weiss", it: "Bianco" },
  Fin: { de: "Dünn", it: "Sottile" },
  Normal: { de: "Normal", it: "Normale" },
  Épais: { de: "Dick", it: "Spesso" },
  "Très épais": { de: "Sehr dick", it: "Molto spesso" },
  Continu: { de: "Durchgezogen", it: "Continuo" },
  Tirets: { de: "Gestrichelt", it: "Tratteggiato" },
  Pointillés: { de: "Gepunktet", it: "Punteggiato" },
  Changer: { de: "Ändern", it: "Cambia" },
  "Choisir un signe": { de: "Signatur wählen", it: "Scegli un simbolo" },
  Cartes: { de: "Karten", it: "Carte" },
  "Cartes montrant l’objet": {
    de: "Karten, die das Objekt zeigen",
    it: "Carte che mostrano l’oggetto",
  },
  "Toutes les cartes": { de: "Alle Karten", it: "Tutte le carte" },
  "Visible sur chaque carte de l’opération.": {
    de: "Auf jeder Karte des Einsatzes sichtbar.",
    it: "Visibile su ogni carta dell’operazione.",
  },
  "Visible seulement sur les cartes choisies.": {
    de: "Nur auf den gewählten Karten sichtbar.",
    it: "Visibile solo sulle carte scelte.",
  },
  Couleur: { de: "Farbe", it: "Colore" },
  "Autre couleur": { de: "Andere Farbe", it: "Altro colore" },
  "Couleur : #rrggbb ou un nom (rouge, bleu…)": {
    de: "Farbe: #rrggbb oder ein Name (rot, blau …)",
    it: "Colore: #rrggbb o un nome (rosso, blu…)",
  },
  "#rrggbb ou un nom : rouge, bleu, vert…": {
    de: "#rrggbb oder ein Name: rot, blau, grün …",
    it: "#rrggbb o un nome: rosso, blu, verde…",
  },
  Taille: { de: "Grösse", it: "Dimensione" },
  "Taille standard": { de: "Standardgrösse", it: "Dimensione standard" },
  "Taille {size} ({factor})": {
    de: "Grösse {size} ({factor})",
    it: "Dimensione {size} ({factor})",
  },
  Rotation: { de: "Drehung", it: "Rotazione" },
  "Tourner de 15° à gauche": {
    de: "Um 15° nach links drehen",
    it: "Ruota di 15° a sinistra",
  },
  "15° à gauche": { de: "15° nach links", it: "15° a sinistra" },
  "Rotation en degrés": { de: "Drehung in Grad", it: "Rotazione in gradi" },
  "Tourner de 15° à droite": {
    de: "Um 15° nach rechts drehen",
    it: "Ruota di 15° a destra",
  },
  "15° à droite": { de: "15° nach rechts", it: "15° a destra" },
  "Remettre droit": { de: "Gerade stellen", it: "Raddrizza" },
  "Rotation {deg}° : remettre droit": {
    de: "Drehung {deg}°: gerade stellen",
    it: "Rotazione {deg}°: raddrizza",
  },
  Apparence: { de: "Darstellung", it: "Aspetto" },
  "appliquée tout de suite": {
    de: "sofort angewendet",
    it: "applicato subito",
  },
  "Signe dans une pastille": {
    de: "Signatur in einem Kreis",
    it: "Simbolo in un bollino",
  },
  "Sinon, le signe seul sur fond transparent.": {
    de: "Sonst die Signatur allein auf transparentem Hintergrund.",
    it: "Altrimenti il simbolo da solo su sfondo trasparente.",
  },
  "Étiquette avec fond": {
    de: "Beschriftung mit Hintergrund",
    it: "Etichetta con sfondo",
  },
  "Sinon, le texte seul avec un halo.": {
    de: "Sonst der Text allein mit einem Halo.",
    it: "Altrimenti il testo da solo con un alone.",
  },
  Épaisseur: { de: "Strichstärke", it: "Spessore" },
  "Épaisseur standard": {
    de: "Standard-Strichstärke",
    it: "Spessore standard",
  },
  "Épaisseur du trait": { de: "Strichstärke", it: "Spessore del tratto" },
  Trait: { de: "Linie", it: "Tratto" },
  "Style du trait": { de: "Linienstil", it: "Stile del tratto" },
  "Remettre cet objet dans son état du {when} ? L’état actuel reste dans l’historique.":
    {
      de: "Dieses Objekt auf seinen Stand vom {when} zurücksetzen? Der aktuelle Stand bleibt im Verlauf.",
      it: "Riportare questo oggetto allo stato del {when}? Lo stato attuale rimane nella cronologia.",
    },
  "Cet objet a été supprimé depuis. Le remettre sur la carte tel qu’il était le {when} ?":
    {
      de: "Dieses Objekt wurde inzwischen gelöscht. Wieder auf die Karte setzen, wie es am {when} war?",
      it: "Questo oggetto è stato eliminato nel frattempo. Rimetterlo sulla carta com’era il {when}?",
    },
  "Objet restauré dans le journal actuel.": {
    de: "Objekt im aktuellen Journal wiederhergestellt.",
    it: "Oggetto ripristinato nel diario attuale.",
  },
  Restaurer: { de: "Wiederherstellen", it: "Ripristina" },
  "Machine à remonter le temps": { de: "Zeitreise", it: "Macchina del tempo" },
  "L’objet est aujourd’hui dans le même état.": {
    de: "Das Objekt ist heute im gleichen Zustand.",
    it: "Oggi l’oggetto è nello stesso stato.",
  },
  "L’objet a changé depuis ce moment.": {
    de: "Das Objekt hat sich seither verändert.",
    it: "L’oggetto è cambiato da quel momento.",
  },
  "L’objet n’existe plus aujourd’hui.": {
    de: "Das Objekt existiert heute nicht mehr.",
    it: "Oggi l’oggetto non esiste più.",
  },
  "Journal clôturé": { de: "Abgeschlossenes Journal", it: "Diario chiuso" },
  "Restaurer cet objet": {
    de: "Dieses Objekt wiederherstellen",
    it: "Ripristina questo oggetto",
  },
  "Texte affiché": { de: "Angezeigter Text", it: "Testo visualizzato" },
  "ex. Secteur nord": { de: "z. B. Sektor Nord", it: "p. es. Settore nord" },
  "ex. Incendie rue du Lac, PC front…": {
    de: "z. B. Brand Seestrasse, KP Front …",
    it: "p. es. Incendio via del Lago, PC avanzato…",
  },
  Calque: { de: "Ebene", it: "Livello" },
  "Coordonnées copiées.": {
    de: "Koordinaten kopiert.",
    it: "Coordinate copiate.",
  },
  "Copie impossible.": {
    de: "Kopieren nicht möglich.",
    it: "Copia impossibile.",
  },
  "un objet": { de: "ein Objekt", it: "un oggetto" },
  Géométrie: { de: "Geometrie", it: "Geometria" },
  Position: { de: "Position", it: "Posizione" },
  MN95: { de: "LV95", it: "MN95" },
  "Copier les coordonnées MN95": {
    de: "LV95-Koordinaten kopieren",
    it: "Copia le coordinate MN95",
  },
  "Copier latitude et longitude": {
    de: "Breite und Länge kopieren",
    it: "Copia latitudine e longitudine",
  },
  Périmètre: { de: "Umfang", it: "Perimetro" },
  Longueur: { de: "Länge", it: "Lunghezza" },
  Surface: { de: "Fläche", it: "Superficie" },
  Trous: { de: "Löcher", it: "Buchi" },
  Sommets: { de: "Eckpunkte", it: "Vertici" },
  Centrer: { de: "Zentrieren", it: "Centra" },
  "Modifier la forme": { de: "Form bearbeiten", it: "Modifica la forma" },

  // ---------- Offline sectors (SectorDialog.tsx, sectors.ts) ----------
  "Secteur du {date}": { de: "Sektor vom {date}", it: "Settore del {date}" },
  Secteur: { de: "Sektor", it: "Settore" },
  "Choisissez au moins un fond.": {
    de: "Wählen Sie mindestens einen Hintergrund.",
    it: "Scegliere almeno uno sfondo.",
  },
  "Téléchargement interrompu : les tuiles déjà reçues restent disponibles.": {
    de: "Download abgebrochen: die bereits erhaltenen Kacheln bleiben verfügbar.",
    it: "Scaricamento interrotto: le tessere già ricevute restano disponibili.",
  },
  "{n} tuile n’a pas pu être téléchargée (hors couverture ou réseau).": {
    de: "{n} Kachel konnte nicht heruntergeladen werden (ausserhalb der Abdeckung oder Netz).",
    it: "{n} tessera non ha potuto essere scaricata (fuori copertura o rete).",
  },
  "{n} tuiles n’ont pas pu être téléchargées (hors couverture ou réseau).": {
    de: "{n} Kacheln konnten nicht heruntergeladen werden (ausserhalb der Abdeckung oder Netz).",
    it: "{n} tessere non hanno potuto essere scaricate (fuori copertura o rete).",
  },
  région: { de: "Region", it: "regione" },
  commune: { de: "Gemeinde", it: "comune" },
  quartier: { de: "Quartier", it: "quartiere" },
  rue: { de: "Strasse", it: "strada" },
  "Carte hors ligne": { de: "Offline-Karte", it: "Carta offline" },
  "Les tuiles d’un secteur restent sur ce poste, même sans réseau, et ne sont jamais effacées automatiquement.":
    {
      de: "Die Kacheln eines Sektors bleiben auf diesem Arbeitsplatz, auch ohne Netz, und werden nie automatisch gelöscht.",
      it: "Le tessere di un settore restano su questa postazione, anche senza rete, e non vengono mai cancellate automaticamente.",
    },
  "Zone à télécharger": {
    de: "Herunterzuladendes Gebiet",
    it: "Zona da scaricare",
  },
  "Zone affichée": { de: "Angezeigtes Gebiet", it: "Zona visualizzata" },
  "Cadre tracé": { de: "Gezeichneter Rahmen", it: "Riquadro tracciato" },
  "Tracer un cadre…": { de: "Rahmen zeichnen …", it: "Traccia un riquadro…" },
  "Tracer un autre cadre": {
    de: "Anderen Rahmen zeichnen",
    it: "Traccia un altro riquadro",
  },
  "Nom du secteur": { de: "Name des Sektors", it: "Nome del settore" },
  "Zoom de": { de: "Zoom von", it: "Zoom da" },
  "à (zoom)": { fr: "à", de: "bis", it: "a" },
  Fonds: { de: "Hintergründe", it: "Sfondi" },
  "Couches geo.admin affichées ({n})": {
    de: "Angezeigte geo.admin-Ebenen ({n})",
    it: "Livelli geo.admin visualizzati ({n})",
  },
  "{n} tuiles · environ {size}": {
    de: "{n} Kacheln · etwa {size}",
    it: "{n} tessere · circa {size}",
  },
  "au plus {max} : réduisez la zone ou le zoom": {
    de: "höchstens {max}: Gebiet oder Zoom verkleinern",
    it: "al massimo {max}: ridurre la zona o lo zoom",
  },
  "{n} échec": { de: "{n} Fehler", it: "{n} errore" },
  "{n} échecs": { de: "{n} Fehler", it: "{n} errori" },
  "Annuler le téléchargement": {
    de: "Download abbrechen",
    it: "Annulla lo scaricamento",
  },
  "Hors ligne : téléchargement impossible": {
    de: "Offline: Download nicht möglich",
    it: "Offline: scaricamento impossibile",
  },
  Télécharger: { de: "Herunterladen", it: "Scarica" },
  "Secteurs gardés sur ce poste": {
    de: "Auf diesem Arbeitsplatz gespeicherte Sektoren",
    it: "Settori conservati su questa postazione",
  },
  "Secteurs sur ce poste": {
    de: "Sektoren auf diesem Arbeitsplatz",
    it: "Settori su questa postazione",
  },
  "Aucun secteur téléchargé.": {
    de: "Kein Sektor heruntergeladen.",
    it: "Nessun settore scaricato.",
  },
  "zoom {min}–{max}": { de: "Zoom {min}–{max}", it: "zoom {min}–{max}" },
  "{n} tuile": { de: "{n} Kachel", it: "{n} tessera" },
  "{n} tuiles": { de: "{n} Kacheln", it: "{n} tessere" },
  incomplet: { de: "unvollständig", it: "incompleto" },
  Voir: { de: "Anzeigen", it: "Mostra" },
  "Supprimer le secteur « {name} »": {
    de: "Sektor « {name} » löschen",
    it: "Elimina il settore « {name} »",
  },
  "Supprimer « {name} » de ce poste ?": {
    de: "« {name} » von diesem Arbeitsplatz löschen?",
    it: "Eliminare « {name} » da questa postazione?",
  },
  "Stockage du site : {used} sur {quota}": {
    de: "Speicher der Website: {used} von {quota}",
    it: "Memoria del sito: {used} su {quota}",
  },
  "protégé contre l’effacement": {
    de: "gegen Löschen geschützt",
    it: "protetto dalla cancellazione",
  },
  "peut être effacé par le navigateur si l’appareil manque de place": {
    de: "kann vom Browser gelöscht werden, wenn das Gerät zu wenig Platz hat",
    it: "può essere cancellato dal browser se il dispositivo manca di spazio",
  },
  "Ce navigateur ne permet pas de garder des cartes hors ligne.": {
    de: "Dieser Browser kann keine Karten offline speichern.",
    it: "Questo browser non permette di conservare carte offline.",
  },
  "Trop de tuiles ({n}) : réduisez la zone ou le zoom maximal.": {
    de: "Zu viele Kacheln ({n}): Verkleinern Sie das Gebiet oder den maximalen Zoom.",
    it: "Troppe tessere ({n}): ridurre la zona o lo zoom massimo.",
  },
  "Espace de stockage plein : supprimez un secteur ou réduisez la zone.": {
    de: "Speicher voll: Löschen Sie einen Sektor oder verkleinern Sie das Gebiet.",
    it: "Memoria piena: eliminare un settore o ridurre la zona.",
  },
  "{n} ko": { de: "{n} kB", it: "{n} kB" },
  "{n} Mo": { de: "{n} MB", it: "{n} MB" },
  "{n} Go": { de: "{n} GB", it: "{n} GB" },

  // ---------- Backgrounds (bases.ts, render.ts) ----------
  "Carte couleur": { de: "Farbkarte", it: "Carta a colori" },
  "Carte grise": { de: "Graue Karte", it: "Carta grigia" },
  "Vue aérienne": { de: "Luftbild", it: "Vista aerea" },
  Nuit: { de: "Nacht", it: "Notte" },
  "carte grise inversée": {
    de: "invertierte graue Karte",
    it: "carta grigia invertita",
  },
  "hors de Suisse": {
    de: "ausserhalb der Schweiz",
    it: "fuori dalla Svizzera",
  },
  "© les contributeurs d’OpenStreetMap": {
    de: "© OpenStreetMap-Mitwirkende",
    it: "© i contributori di OpenStreetMap",
  },
  "Image de carte impossible.": {
    de: "Kartenbild nicht möglich.",
    it: "Immagine della carta impossibile.",
  },
  "Carte principale": { de: "Hauptkarte", it: "Carta principale" },

  // ---------- geo.admin.ch layers (overlays.ts, overlayLayers.ts) ----------
  // Names as in the layer catalogue of map.geo.admin.ch in each language.
  "Dangers naturels": { de: "Naturgefahren", it: "Pericoli naturali" },
  "Eaux et météo en direct": {
    de: "Gewässer und Wetter live",
    it: "Acque e meteo in diretta",
  },
  "Infrastructures et cadastre": {
    de: "Infrastruktur und Kataster",
    it: "Infrastrutture e catasto",
  },
  "Zones inondables (crue centennale)": {
    de: "Überschwemmungsgebiete (100-jährliches Hochwasser)",
    it: "Zone inondabili (piena centennale)",
  },
  "Aquaprotect, OFEV : vue d’ensemble nationale, ne remplace pas les cartes cantonales des dangers.":
    {
      de: "Aquaprotect, BAFU: nationale Übersicht, ersetzt die kantonalen Gefahrenkarten nicht.",
      it: "Aquaprotect, UFAM: panoramica nazionale, non sostituisce le carte cantonali dei pericoli.",
    },
  "Zones inondables (crue extrême, 500 ans)": {
    de: "Überschwemmungsgebiete (Extremhochwasser, 500 Jahre)",
    it: "Zone inondabili (piena estrema, 500 anni)",
  },
  "Aquaprotect, OFEV : scénario rare, emprise maximale.": {
    de: "Aquaprotect, BAFU: seltenes Szenario, maximale Ausdehnung.",
    it: "Aquaprotect, UFAM: scenario raro, estensione massima.",
  },
  "Ruissellement de surface": {
    de: "Oberflächenabfluss",
    it: "Ruscellamento superficiale",
  },
  "Carte de l’aléa ruissellement, OFEV : hauteurs d’eau en cas de pluie intense.":
    {
      de: "Gefährdungskarte Oberflächenabfluss, BAFU: Wassertiefen bei Starkregen.",
      it: "Carta della pericolosità da ruscellamento, UFAM: altezze d’acqua in caso di pioggia intensa.",
    },
  "Glissements superficiels et coulées de boue": {
    de: "Hangmuren",
    it: "Scivolamenti superficiali e colate di fango",
  },
  "SilvaProtect-CH, OFEV : indications de danger au niveau national.": {
    de: "SilvaProtect-CH, BAFU: Gefahrenhinweise auf nationaler Ebene.",
    it: "SilvaProtect-CH, UFAM: indicazioni di pericolo a livello nazionale.",
  },
  "Laves torrentielles": { de: "Murgang", it: "Colate detritiche" },
  "SilvaProtect-CH, OFEV.": {
    de: "SilvaProtect-CH, BAFU.",
    it: "SilvaProtect-CH, UFAM.",
  },
  "Chutes de pierres": { de: "Sturz", it: "Crollo di sassi" },
  "SilvaProtect-CH, OFEV : zones de transit et de dépôt.": {
    de: "SilvaProtect-CH, BAFU: Transit- und Ablagerungsgebiete.",
    it: "SilvaProtect-CH, UFAM: zone di transito e di deposito.",
  },
  Avalanches: { de: "Lawinen", it: "Valanghe" },
  "SilvaProtect-CH, OFEV : avalanches partant de la forêt.": {
    de: "SilvaProtect-CH, BAFU: Lawinen mit Anriss im Wald.",
    it: "SilvaProtect-CH, UFAM: valanghe che si staccano nel bosco.",
  },
  "Pentes de plus de 30°": {
    de: "Hangneigung über 30°",
    it: "Pendii di oltre 30°",
  },
  "swisstopo : terrain propice aux avalanches.": {
    de: "swisstopo: lawinengefährdetes Gelände.",
    it: "swisstopo: terreno favorevole alle valanghe.",
  },
  "Danger d’incendie de forêt": {
    de: "Waldbrandgefahr",
    it: "Pericolo d’incendio boschivo",
  },
  "Degrés de danger publiés par les cantons et l’OFEV (mis à jour chaque jour).":
    {
      de: "Gefahrenstufen der Kantone und des BAFU (täglich aktualisiert).",
      it: "Gradi di pericolo pubblicati dai Cantoni e dall’UFAM (aggiornati ogni giorno).",
    },
  "Stations hydrologiques : degré de danger": {
    de: "Hydrologische Messstationen: Gefahrenstufe",
    it: "Stazioni idrologiche: grado di pericolo",
  },
  "OFEV, toutes les 5 minutes : niveau ou débit comparé aux degrés de danger de crue.":
    {
      de: "BAFU, alle 5 Minuten: Pegel oder Abfluss im Vergleich zu den Hochwasser-Gefahrenstufen.",
      it: "UFAM, ogni 5 minuti: livello o portata rispetto ai gradi di pericolo di piena.",
    },
  "Carte de vigilance crues": {
    de: "Hochwasser-Warnkarte",
    it: "Carta di allerta piene",
  },
  "OFEV : degré de danger de crue par région, rivière et lac.": {
    de: "BAFU: Hochwasser-Gefahrenstufe nach Region, Fluss und See.",
    it: "UFAM: grado di pericolo di piena per regione, fiume e lago.",
  },
  "Vent mesuré (10 min)": {
    de: "Gemessener Wind (10 Min.)",
    it: "Vento misurato (10 min)",
  },
  "MétéoSuisse, SwissMetNet : vitesse et direction, toutes les 10 minutes.": {
    de: "MeteoSchweiz, SwissMetNet: Geschwindigkeit und Richtung, alle 10 Minuten.",
    it: "MeteoSvizzera, SwissMetNet: velocità e direzione, ogni 10 minuti.",
  },
  "Précipitations (somme 1 h)": {
    de: "Niederschlag (1-Stunden-Summe)",
    it: "Precipitazioni (somma 1 h)",
  },
  "MétéoSuisse : millimètres tombés pendant la dernière heure.": {
    de: "MeteoSchweiz: in der letzten Stunde gefallene Millimeter.",
    it: "MeteoSvizzera: millimetri caduti nell’ultima ora.",
  },
  "Cadastre (parcelles)": {
    de: "Amtliche Vermessung (Parzellen)",
    it: "Catasto (particelle)",
  },
  "Mensuration officielle des cantons : biens-fonds et numéros (zoom rapproché).":
    {
      de: "Amtliche Vermessung der Kantone: Liegenschaften und Nummern (nahe Zoomstufe).",
      it: "Misurazione ufficiale dei Cantoni: fondi e numeri (zoom ravvicinato).",
    },
  "Barrages sous surveillance fédérale": {
    de: "Stauanlagen unter Bundesaufsicht",
    it: "Impianti di accumulazione sotto vigilanza federale",
  },
  "OFEN : ouvrages d’accumulation (les zones d’inondation des barrages ne sont pas publiques).":
    {
      de: "BFE: Stauanlagen (die Überflutungszonen der Stauanlagen sind nicht öffentlich).",
      it: "UFE: impianti di accumulazione (le zone d’inondazione delle dighe non sono pubbliche).",
    },
  "Points de rencontre d’urgence": {
    de: "Notfalltreffpunkte",
    it: "Punti di raccolta d’emergenza",
  },
  "OFPP et cantons : où la population se rend en cas d’urgence.": {
    de: "BABS und Kantone: wohin sich die Bevölkerung im Notfall begibt.",
    it: "UFPP e Cantoni: dove si reca la popolazione in caso d’emergenza.",
  },
  "Biens culturels protégés (PBC)": {
    de: "Kulturgüter (KGS)",
    it: "Beni culturali protetti (PBC)",
  },
  "OFPP : inventaire de la protection des biens culturels.": {
    de: "BABS: Inventar des Kulturgüterschutzes.",
    it: "UFPP: inventario della protezione dei beni culturali.",
  },
  "Zones d’urgence des centrales nucléaires": {
    de: "Notfallschutzzonen der Kernanlagen",
    it: "Zone d’emergenza delle centrali nucleari",
  },
  "IFSN : zones 1 et 2 autour des installations nucléaires.": {
    de: "ENSI: Zonen 1 und 2 um die Kernanlagen.",
    it: "IFSN: zone 1 e 2 attorno agli impianti nucleari.",
  },
  "Limites de communes": { de: "Gemeindegrenzen", it: "Confini comunali" },
  "swisstopo, swissBOUNDARIES3D.": {
    de: "swisstopo, swissBOUNDARIES3D.",
    it: "swisstopo, swissBOUNDARIES3D.",
  },
  Numéro: { de: "Nummer", it: "Numero" },
  EGRID: { de: "EGRID", it: "EGRID" },
  Identifiant: { de: "Kennung", it: "Identificativo" },
  Canton: { de: "Kanton", it: "Cantone" },
  Commune: { de: "Gemeinde", it: "Comune" },
  Barrage: { de: "Stauanlage", it: "Diga" },
  Installation: { de: "Anlage", it: "Impianto" },
  "N° OFS": { de: "BFS-Nr.", it: "N. UST" },
  Objet: { de: "Objekt", it: "Oggetto" },
  Station: { de: "Station", it: "Stazione" },
  "Pas de données": { de: "Keine Daten", it: "Nessun dato" },
  "Degré 1 : pas de danger ou danger faible": {
    de: "Stufe 1: keine oder geringe Gefahr",
    it: "Grado 1: nessun pericolo o pericolo debole",
  },
  "Degré 2 : danger limité": {
    de: "Stufe 2: mässige Gefahr",
    it: "Grado 2: pericolo moderato",
  },
  "Degré 3 : danger marqué": {
    de: "Stufe 3: erhebliche Gefahr",
    it: "Grado 3: pericolo marcato",
  },
  "Degré 4 : danger fort": {
    de: "Stufe 4: grosse Gefahr",
    it: "Grado 4: pericolo forte",
  },
  "Degré 5 : danger très fort": {
    de: "Stufe 5: sehr grosse Gefahr",
    it: "Grado 5: pericolo molto forte",
  },
  Danger: { de: "Gefahr", it: "Pericolo" },
  "Vent moyen": { de: "Mittlerer Wind", it: "Vento medio" },
  Mesure: { de: "Messwert", it: "Misura" },
  "Vient du": { de: "Aus", it: "Proviene da" },
  Mesuré: { de: "Gemessen", it: "Misurato" },
  "Données en direct indisponibles pour le moment.": {
    de: "Live-Daten derzeit nicht verfügbar.",
    it: "Dati in diretta momentaneamente non disponibili.",
  },
  "Hors ligne : données en direct indisponibles.": {
    de: "Offline: Live-Daten nicht verfügbar.",
    it: "Offline: dati in diretta non disponibili.",
  },

  // ---------- Elevation profile (profile.ts) ----------
  "Profil disponible en Suisse seulement (modèle swissALTI3D).": {
    de: "Profil nur in der Schweiz verfügbar (Modell swissALTI3D).",
    it: "Profilo disponibile solo in Svizzera (modello swissALTI3D).",
  },
  "Hors ligne : le profil sera calculé au retour du réseau.": {
    de: "Offline: Das Profil wird berechnet, sobald das Netz wieder da ist.",
    it: "Offline: il profilo sarà calcolato al ritorno della rete.",
  },
  "Le service de profil de swisstopo ne répond pas.": {
    de: "Der Profildienst von swisstopo antwortet nicht.",
    it: "Il servizio di profilo di swisstopo non risponde.",
  },
  "Le service de profil a refusé la ligne ({status}).": {
    de: "Der Profildienst hat die Linie abgelehnt ({status}).",
    it: "Il servizio di profilo ha rifiutato la linea ({status}).",
  },
  "Profil vide : ligne trop courte ?": {
    de: "Leeres Profil: Linie zu kurz?",
    it: "Profilo vuoto: linea troppo corta?",
  },

  // ---------- Geographic files (ImportDialog.tsx, geoformats.ts) ----------
  "Ce KMZ ne contient pas de fichier KML.": {
    de: "Diese KMZ-Datei enthält keine KML-Datei.",
    it: "Questo KMZ non contiene alcun file KML.",
  },
  "Fichier KML trop volumineux (20 Mo au maximum).": {
    de: "KML-Datei zu gross (höchstens 20 MB).",
    it: "File KML troppo voluminoso (al massimo 20 MB).",
  },
  "Fichier KML illisible ou trop volumineux.": {
    de: "KML-Datei nicht lesbar oder zu gross.",
    it: "File KML illeggibile o troppo voluminoso.",
  },
  "Fichier trop volumineux : 5 Mo au maximum.": {
    de: "Datei zu gross: höchstens 5 MB.",
    it: "File troppo voluminoso: al massimo 5 MB.",
  },
  "Aucun objet géographique lisible dans ce fichier.": {
    de: "Keine lesbaren geografischen Objekte in dieser Datei.",
    it: "Nessun oggetto geografico leggibile in questo file.",
  },
  "La carte ne peut pas dépasser {max} objets : il reste de la place pour {room}.":
    {
      de: "Die Karte darf höchstens {max} Objekte enthalten: Es ist noch Platz für {room}.",
      it: "La carta non può superare {max} oggetti: resta spazio per {room}.",
    },
  "{n} objet importé depuis « {file} ».": {
    de: "{n} Objekt aus « {file} » importiert.",
    it: "{n} oggetto importato da « {file} ».",
  },
  "{n} objets importés depuis « {file} ».": {
    de: "{n} Objekte aus « {file} » importiert.",
    it: "{n} oggetti importati da « {file} ».",
  },
  "{n} point": { de: "{n} Punkt", it: "{n} punto" },
  "{n} points": { de: "{n} Punkte", it: "{n} punti" },
  "{n} texte": { de: "{n} Text", it: "{n} testo" },
  "{n} textes": { de: "{n} Texte", it: "{n} testi" },
  "{n} ligne": { de: "{n} Linie", it: "{n} linea" },
  "{n} lignes": { de: "{n} Linien", it: "{n} linee" },
  "{n} zone": { de: "{n} Zone", it: "{n} zona" },
  "{n} zones": { de: "{n} Zonen", it: "{n} zone" },
  "Importer un fichier géographique": {
    de: "Geodatei importieren",
    it: "Importa un file geografico",
  },
  "Choisir un fichier": { de: "Datei wählen", it: "Scegli un file" },
  "KML, KMZ (Google Earth), GeoJSON, GPX · 5 Mo au maximum · WGS84, ou MN95 / MN03 (GeoJSON suisse)":
    {
      de: "KML, KMZ (Google Earth), GeoJSON, GPX · höchstens 5 MB · WGS84 oder LV95 / LV03 (Schweizer GeoJSON)",
      it: "KML, KMZ (Google Earth), GeoJSON, GPX · al massimo 5 MB · WGS84, o MN95 / MN03 (GeoJSON svizzero)",
    },
  "{crs} converti": { de: "{crs} umgerechnet", it: "{crs} convertito" },
  "Le fichier contient {total} objets : seuls les {max} premiers seront importés.":
    {
      de: "Die Datei enthält {total} Objekte: Nur die ersten {max} werden importiert.",
      it: "Il file contiene {total} oggetti: saranno importati solo i primi {max}.",
    },
  "{n} élément sans coordonnées valables ignoré.": {
    de: "{n} Element ohne gültige Koordinaten übergangen.",
    it: "{n} elemento senza coordinate valide ignorato.",
  },
  "{n} éléments sans coordonnées valables ignorés.": {
    de: "{n} Elemente ohne gültige Koordinaten übergangen.",
    it: "{n} elementi senza coordinate valide ignorati.",
  },
  "{n} tracé allégé à 2000 points.": {
    de: "{n} Linie auf 2000 Punkte vereinfacht.",
    it: "{n} tracciato alleggerito a 2000 punti.",
  },
  "{n} tracés allégés à 2000 points.": {
    de: "{n} Linien auf 2000 Punkte vereinfacht.",
    it: "{n} tracciati alleggeriti a 2000 punti.",
  },
  "Garder les calques du fichier": {
    de: "Ebenen der Datei beibehalten",
    it: "Mantieni i livelli del file",
  },
  "Un calque propre au fichier se masque d’un clic.": {
    de: "Eine eigene Ebene für die Datei lässt sich mit einem Klick ausblenden.",
    it: "Un livello proprio del file si nasconde con un clic.",
  },
  "Importer {n} objet": {
    de: "{n} Objekt importieren",
    it: "Importa {n} oggetto",
  },
  "Importer {n} objets": {
    de: "{n} Objekte importieren",
    it: "Importa {n} oggetti",
  },
  "Sans calque": { de: "Ohne Ebene", it: "Senza livello" },
  "sans calque": { de: "ohne Ebene", it: "senza livello" },
  "{n} objet": { de: "{n} Objekt", it: "{n} oggetto" },
  "{n} objets": { de: "{n} Objekte", it: "{n} oggetti" },
  "Calque : {layer}": { de: "Ebene: {layer}", it: "Livello: {layer}" },
  "Signe : {name}": { de: "Signatur: {name}", it: "Simbolo: {name}" },
  "Posé par {by} le {created}, modifié le {updated}": {
    de: "Gesetzt von {by} am {created}, geändert am {updated}",
    it: "Posato da {by} il {created}, modificato il {updated}",
  },
  "XML incomplet.": { de: "Unvollständiges XML.", it: "XML incompleto." },
  "XML invalide.": { de: "Ungültiges XML.", it: "XML non valido." },
  "Document XML vide.": {
    de: "Leeres XML-Dokument.",
    it: "Documento XML vuoto.",
  },
  "Fichier GeoJSON illisible (JSON invalide).": {
    de: "GeoJSON-Datei nicht lesbar (ungültiges JSON).",
    it: "File GeoJSON illeggibile (JSON non valido).",
  },
  "Ce fichier n’est pas du GeoJSON.": {
    de: "Diese Datei ist kein GeoJSON.",
    it: "Questo file non è GeoJSON.",
  },
  "Ce fichier n’est pas du KML.": {
    de: "Diese Datei ist kein KML.",
    it: "Questo file non è KML.",
  },
  "Ce fichier n’est pas du GPX.": {
    de: "Diese Datei ist kein GPX.",
    it: "Questo file non è GPX.",
  },
  "Format non reconnu : choisissez un fichier KML, KMZ, GeoJSON ou GPX.": {
    de: "Format nicht erkannt: Wählen Sie eine KML-, KMZ-, GeoJSON- oder GPX-Datei.",
    it: "Formato non riconosciuto: scegliere un file KML, KMZ, GeoJSON o GPX.",
  },

  // ---------- Print to scale (PrintDialog.tsx, printmap.ts) ----------
  "Carte à l’échelle (PDF)": {
    de: "Massstabsgetreue Karte (PDF)",
    it: "Carta in scala (PDF)",
  },
  portrait: { de: "Hochformat", it: "verticale" },
  paysage: { de: "Querformat", it: "orizzontale" },
  "PDF à l’échelle {scale} enregistré.": {
    de: "PDF im Massstab {scale} gespeichert.",
    it: "PDF in scala {scale} salvato.",
  },
  "Impression impossible : {error}": {
    de: "Drucken nicht möglich: {error}",
    it: "Stampa impossibile: {error}",
  },
  "erreur inconnue": { de: "unbekannter Fehler", it: "errore sconosciuto" },
  "Imprimer à l’échelle": {
    de: "Massstabsgetreu drucken",
    it: "Stampa in scala",
  },
  Papier: { de: "Papier", it: "Carta" },
  "Format du papier": { de: "Papierformat", it: "Formato della carta" },
  Orientation: { de: "Ausrichtung", it: "Orientamento" },
  Paysage: { de: "Querformat", it: "Orizzontale" },
  Portrait: { de: "Hochformat", it: "Verticale" },
  Échelle: { de: "Massstab", it: "Scala" },
  "Emprise {width} × {height} · centre {centre}": {
    de: "Ausschnitt {width} × {height} · Mitte {centre}",
    it: "Estensione {width} × {height} · centro {centre}",
  },
  Fond: { de: "Hintergrund", it: "Sfondo" },
  "Sans fond": { de: "Ohne Hintergrund", it: "Senza sfondo" },
  "Quadrillage suisse (MN95)": {
    de: "Schweizer Koordinatennetz (LV95)",
    it: "Reticolato svizzero (MN95)",
  },
  "Lignes kilométriques numérotées (100 ou 250 m aux grandes échelles).": {
    de: "Nummerierte Kilometerlinien (100 oder 250 m bei grossen Massstäben).",
    it: "Linee chilometriche numerate (100 o 250 m alle grandi scale).",
  },
  "Centré sur la carte affichée. Imprimez le PDF à 100 % (sans « ajuster à la page ») pour garder l’échelle.":
    {
      de: "Auf die angezeigte Karte zentriert. Drucken Sie das PDF mit 100 % (ohne « an Seite anpassen »), damit der Massstab stimmt.",
      it: "Centrato sulla carta visualizzata. Stampare il PDF al 100 % (senza « adatta alla pagina ») per mantenere la scala.",
    },
  "Préparation…": { de: "Vorbereitung …", it: "Preparazione…" },
  "Créer le PDF": { de: "PDF erstellen", it: "Crea il PDF" },
  "Centre E {east} · N {north}": {
    de: "Mitte E {east} · N {north}",
    it: "Centro E {east} · N {north}",
  },
  "Centre {lat}, {lng}": {
    de: "Mitte {lat}, {lng}",
    it: "Centro {lat}, {lng}",
  },
  "Quadrillage MN95 : {spacing}": {
    de: "Koordinatennetz LV95: {spacing}",
    it: "Reticolato MN95: {spacing}",
  },
  Légende: { de: "Legende", it: "Legenda" },
  "Aucun objet dans le cadre.": {
    de: "Kein Objekt im Ausschnitt.",
    it: "Nessun oggetto nel riquadro.",
  },
  "… et {n} autre": { de: "… und {n} weiteres", it: "… e {n} altro" },
  "… et {n} autres": { de: "… und {n} weitere", it: "… e altri {n}" },
  "Imprimé le {stamp}": {
    de: "Gedruckt am {stamp}",
    it: "Stampato il {stamp}",
  },
  "par {author}": { de: "von {author}", it: "da {author}" },
  "Carte : {name}": { de: "Karte: {name}", it: "Carta: {name}" },
  "{paper} portrait · imprimer à 100 %": {
    de: "{paper} Hochformat · mit 100 % drucken",
    it: "{paper} verticale · stampare al 100 %",
  },
  "{paper} paysage · imprimer à 100 %": {
    de: "{paper} Querformat · mit 100 % drucken",
    it: "{paper} orizzontale · stampare al 100 %",
  },
  "Fond {source}": { de: "Hintergrund {source}", it: "Sfondo {source}" },
  carte: { de: "karte", it: "carta" },
  situation: { de: "lage", it: "situazione" },
} satisfies Dict);

export type Key = keyof typeof dict;

// ---------- Names of the symbols ----------
// Simple markers (builtins.ts) and the official civil symbols of the
// OFPP catalogue (public/symbols/catalog.json, French), with their families.
// German and Italian: the terms of the BABS / UFPP signatures.

const symbols = translator({
  // Families of the simple markers
  Conduite: { de: "Führung", it: "Condotta" },
  "Personnes et accueil": {
    de: "Personen und Betreuung",
    it: "Persone e accoglienza",
  },
  Sanitaire: { de: "Sanität", it: "Sanità" },
  "Secours et sécurité": {
    de: "Rettung und Sicherheit",
    it: "Soccorso e sicurezza",
  },
  "Dangers et effets": {
    de: "Gefahren und Auswirkungen",
    it: "Pericoli ed effetti",
  },
  Circulation: { de: "Verkehr", it: "Traffico" },
  Transports: { de: "Transport", it: "Trasporti" },
  "Logistique et réseaux": {
    de: "Logistik und Netze",
    it: "Logistica e reti",
  },
  Bâtiments: { de: "Gebäude", it: "Edifici" },
  "Observation et information": {
    de: "Beobachtung und Information",
    it: "Osservazione e informazione",
  },

  // Families of the official catalogue
  Effets: { de: "Auswirkungen", it: "Effetti" },
  Dangers: { de: "Gefahren", it: "Pericoli" },
  "Emplacements de conduite civils": {
    de: "Zivile Führungsstandorte",
    it: "Ubicazioni di condotta civili",
  },
  Formations: { de: "Formationen", it: "Formazioni" },
  "Installations temporaires": {
    de: "Temporäre Einrichtungen",
    it: "Installazioni temporanee",
  },
  Mouvements: { de: "Bewegungen", it: "Movimenti" },
  Véhicules: { de: "Fahrzeuge", it: "Veicoli" },
  Pictogrammes: { de: "Piktogramme", it: "Pittogrammi" },
  Spéciaux: { de: "Spezielle", it: "Speciali" },
  "Terrain et objectifs": {
    de: "Gelände und Objekte",
    it: "Terreno e obiettivi",
  },
  "Voies de communication": { de: "Verkehrswege", it: "Vie di comunicazione" },
  Personnes: { de: "Personen", it: "Persone" },
  Contamination: { de: "Kontamination", it: "Contaminazione" },
  "Événements naturels": { de: "Naturereignisse", it: "Eventi naturali" },
  "Événements techniques": {
    de: "Technische Ereignisse",
    it: "Eventi tecnici",
  },
  "Événements sociaux": {
    de: "Gesellschaftliche Ereignisse",
    it: "Eventi sociali",
  },
  "Sapeurs-pompiers": { de: "Feuerwehr", it: "Pompieri" },
  "Santé publique": { de: "Gesundheitswesen", it: "Sanità pubblica" },
  "Services techniques": { de: "Technische Betriebe", it: "Servizi tecnici" },
  "Partenaires sans hiérarchie": {
    de: "Partner ohne Hierarchie",
    it: "Partner senza gerarchia",
  },
  "Hiérarchies sans partenaire": {
    de: "Hierarchien ohne Partner",
    it: "Gerarchie senza partner",
  },

  // Simple markers: Conduite
  "Poste de commandement": { de: "Kommandoposten", it: "Posto di comando" },
  "PC front": { de: "KP Front", it: "PC avanzato" },
  "PC arrière": { de: "KP Rück", it: "PC arretrato" },
  "Centrale d’engagement": {
    de: "Einsatzzentrale",
    it: "Centrale d’intervento",
  },
  "Officier de liaison": {
    de: "Verbindungsoffizier",
    it: "Ufficiale di collegamento",
  },
  "Point de rencontre": { de: "Treffpunkt", it: "Punto d’incontro" },
  "Check-point": { de: "Checkpoint", it: "Check-point" },
  "Relais radio · antenne": {
    de: "Funkrelais · Antenne",
    it: "Ripetitore radio · antenna",
  },
  "Poste radio": { de: "Funkgerät", it: "Apparecchio radio" },
  // Personnes et accueil
  "Point de rassemblement": { de: "Sammelplatz", it: "Punto di raccolta" },
  "Place sinistrés": { de: "Betroffenenplatz", it: "Area sinistrati" },
  "Poste collecteur de sinistrés": {
    de: "Sammelstelle für Betroffene",
    it: "Posto di raccolta sinistrati",
  },
  "Centre d’accueil": { de: "Aufnahmezentrum", it: "Centro d’accoglienza" },
  Hébergement: { de: "Unterkunft", it: "Alloggio" },
  "Subsistance · ravitaillement": {
    de: "Verpflegung · Versorgung",
    it: "Sussistenza · vettovagliamento",
  },
  "Eau potable · boissons": {
    de: "Trinkwasser · Getränke",
    it: "Acqua potabile · bevande",
  },
  Toilettes: { de: "Toiletten", it: "Servizi igienici" },
  Douches: { de: "Duschen", it: "Docce" },
  Évacuation: { de: "Evakuierung", it: "Evacuazione" },
  "Personne disparue": { de: "Vermisste Person", it: "Persona dispersa" },
  Recherche: { de: "Suche", it: "Ricerca" },
  Enfants: { de: "Kinder", it: "Bambini" },
  "Personnes vulnérables": {
    de: "Schutzbedürftige Personen",
    it: "Persone vulnerabili",
  },
  // Sanitaire
  "Blessés · sanitaire": { de: "Verletzte · Sanität", it: "Feriti · sanità" },
  "Poste collecteur de blessés": {
    de: "Verletztensammelstelle",
    it: "Posto di raccolta feriti",
  },
  "Poste sanitaire": { de: "Sanitätsposten", it: "Posto sanitario" },
  Ambulance: { de: "Ambulanz", it: "Ambulanza" },
  Hôpital: { de: "Spital", it: "Ospedale" },
  Médecin: { de: "Arzt", it: "Medico" },
  "Pharmacie · médicaments": {
    de: "Apotheke · Medikamente",
    it: "Farmacia · medicamenti",
  },
  "Soutien psychologique": {
    de: "Psychologische Unterstützung",
    it: "Sostegno psicologico",
  },
  Décontamination: { de: "Dekontamination", it: "Decontaminazione" },
  "Dépôt mortuaire": { de: "Leichendepot", it: "Deposito salme" },
  // Secours et sécurité
  Pompiers: { de: "Feuerwehr", it: "Pompieri" },
  Police: { de: "Polizei", it: "Polizia" },
  Armée: { de: "Armee", it: "Esercito" },
  "Protection civile": { de: "Zivilschutz", it: "Protezione civile" },
  Sauvetage: { de: "Rettung", it: "Salvataggio" },
  "Chien de recherche": { de: "Suchhund", it: "Cane da ricerca" },
  "Alarme · sirène": { de: "Alarm · Sirene", it: "Allarme · sirena" },
  Véhicule: { de: "Fahrzeug", it: "Veicolo" },
  // Dangers et effets
  Incident: { de: "Ereignis", it: "Evento" },
  Danger: { de: "Gefahr", it: "Pericolo" },
  Incendie: { de: "Brand", it: "Incendio" },
  Fumée: { de: "Rauch", it: "Fumo" },
  "Explosion · explosif": {
    de: "Explosion · Sprengstoff",
    it: "Esplosione · esplosivo",
  },
  Chimique: { de: "Chemisch", it: "Chimico" },
  Radiologique: { de: "Radiologisch", it: "Radiologico" },
  Biologique: { de: "Biologisch", it: "Biologico" },
  Inondation: { de: "Überschwemmung", it: "Inondazione" },
  "Glissement de terrain": { de: "Rutschung", it: "Frana" },
  Avalanche: { de: "Lawine", it: "Valanga" },
  Tempête: { de: "Sturm", it: "Tempesta" },
  Orage: { de: "Gewitter", it: "Temporale" },
  Effondrement: { de: "Einsturz", it: "Crollo" },
  "Danger électrique": { de: "Elektrische Gefahr", it: "Pericolo elettrico" },
  "Fuite de gaz": { de: "Gasaustritt", it: "Fuga di gas" },
  Pollution: { de: "Verschmutzung", it: "Inquinamento" },
  Animaux: { de: "Tiere", it: "Animali" },
  "Neige · verglas": { de: "Schnee · Glatteis", it: "Neve · ghiaccio" },
  // Circulation
  Barrage: { de: "Sperre", it: "Sbarramento" },
  "Route coupée": { de: "Strasse unterbrochen", it: "Strada interrotta" },
  Déviation: { de: "Umleitung", it: "Deviazione" },
  "Zone interdite": { de: "Sperrzone", it: "Zona vietata" },
  "Chantier · travaux": { de: "Baustelle · Arbeiten", it: "Cantiere · lavori" },
  Balisage: { de: "Markierung", it: "Delimitazione" },
  Parking: { de: "Parkplatz", it: "Parcheggio" },
  Pont: { de: "Brücke", it: "Ponte" },
  Signalisation: { de: "Signalisation", it: "Segnaletica" },
  // Transports
  Voiture: { de: "Auto", it: "Automobile" },
  "Bus · car": { de: "Bus · Car", it: "Bus · pullman" },
  Hélicoptère: { de: "Helikopter", it: "Elicottero" },
  "Héliport · place d’atterrissage": {
    de: "Heliport · Landeplatz",
    it: "Eliporto · piazza d’atterraggio",
  },
  Avion: { de: "Flugzeug", it: "Aereo" },
  Drone: { de: "Drohne", it: "Drone" },
  Bateau: { de: "Boot", it: "Imbarcazione" },
  Train: { de: "Zug", it: "Treno" },
  "Engin de chantier": { de: "Baumaschine", it: "Macchina edile" },
  // Logistique et réseaux
  "Dépôt de matériel": { de: "Materialdepot", it: "Deposito di materiale" },
  Matériel: { de: "Material", it: "Materiale" },
  Carburant: { de: "Treibstoff", it: "Carburante" },
  Générateur: { de: "Generator", it: "Generatore" },
  Électricité: { de: "Elektrizität", it: "Elettricità" },
  Gaz: { de: "Gas", it: "Gas" },
  "Point d’eau · hydrante": {
    de: "Wasserbezugsort · Hydrant",
    it: "Punto d’acqua · idrante",
  },
  Tente: { de: "Zelt", it: "Tenda" },
  "Atelier · réparation": {
    de: "Werkstatt · Reparatur",
    it: "Officina · riparazione",
  },
  Déchets: { de: "Abfall", it: "Rifiuti" },
  Télécommunications: { de: "Telekommunikation", it: "Telecomunicazioni" },
  // Bâtiments
  Bâtiment: { de: "Gebäude", it: "Edificio" },
  Maison: { de: "Haus", it: "Casa" },
  École: { de: "Schule", it: "Scuola" },
  Église: { de: "Kirche", it: "Chiesa" },
  "Usine · industrie": { de: "Fabrik · Industrie", it: "Fabbrica · industria" },
  Hôtel: { de: "Hotel", it: "Albergo" },
  Commerce: { de: "Geschäft", it: "Negozio" },
  "Bâtiment public": { de: "Öffentliches Gebäude", it: "Edificio pubblico" },
  // Observation et information
  "Point de vue · observation": {
    de: "Aussichtspunkt · Beobachtung",
    it: "Punto panoramico · osservazione",
  },
  "Caméra · photo": { de: "Kamera · Foto", it: "Fotocamera · foto" },
  Vidéosurveillance: { de: "Videoüberwachung", it: "Videosorveglianza" },
  "Médias · presse": { de: "Medien · Presse", it: "Media · stampa" },
  "Information à la population": {
    de: "Information der Bevölkerung",
    it: "Informazione alla popolazione",
  },
  Information: { de: "Information", it: "Informazione" },
  "Heure · échéance": { de: "Zeit · Frist", it: "Ora · scadenza" },
  Objectif: { de: "Ziel", it: "Obiettivo" },
  Point: { de: "Punkt", it: "Punto" },

  // Official catalogue: Effets
  Dégât: { de: "Schaden", it: "Danno" },
  "Destruction partielle": { de: "Teilzerstörung", it: "Distruzione parziale" },
  "Destruction totale": { de: "Totalzerstörung", it: "Distruzione totale" },
  "Incendie isolé": { de: "Einzelbrand", it: "Incendio isolato" },
  "Foyer d’explosion": { de: "Explosionsherd", it: "Focolaio d’esplosione" },
  "Foyer d’explosion exemple": {
    de: "Explosionsherd Beispiel",
    it: "Focolaio d’esplosione esempio",
  },
  "Incendie d’un bâtiment isolé": {
    de: "Brand eines Einzelgebäudes",
    it: "Incendio di un edificio isolato",
  },
  "Incendie d’un bâtiment isolé exemple": {
    de: "Brand eines Einzelgebäudes Beispiel",
    it: "Incendio di un edificio isolato esempio",
  },
  "Incendie de plusieurs bâtiments": {
    de: "Brand mehrerer Gebäude",
    it: "Incendio di più edifici",
  },
  "Incendie de plusieurs bâtiments exemple": {
    de: "Brand mehrerer Gebäude Beispiel",
    it: "Incendio di più edifici esempio",
  },
  "Danger d’extension du feu exemple": {
    de: "Brandausbreitungsgefahr Beispiel",
    it: "Pericolo di propagazione del fuoco esempio",
  },
  "Extension du feu exemple": {
    de: "Brandausbreitung Beispiel",
    it: "Propagazione del fuoco esempio",
  },
  "Zone en feu": { de: "Brandgebiet", it: "Zona in fiamme" },
  "Danger d’extension du feu": {
    de: "Brandausbreitungsgefahr",
    it: "Pericolo di propagazione del fuoco",
  },
  "Extension du feu": { de: "Brandausbreitung", it: "Propagazione del fuoco" },
  "Zone sinistrée impraticable": {
    de: "Unpassierbares Schadengebiet",
    it: "Zona sinistrata impraticabile",
  },
  "Glissement de terrain avec direction": {
    de: "Rutschung mit Richtung",
    it: "Frana con direzione",
  },
  "Zone de dégâts": { de: "Schadengebiet", it: "Zona danneggiata" },
  "Zone inondée avec direction du flux": {
    de: "Überflutetes Gebiet mit Fliessrichtung",
    it: "Zona inondata con direzione del flusso",
  },
  "Zone de décombre": { de: "Trümmergebiet", it: "Zona di macerie" },
  "Zone de décombre exemple": {
    de: "Trümmergebiet Beispiel",
    it: "Zona di macerie esempio",
  },
  "Route difficilement praticable": {
    de: "Schwer passierbare Strasse",
    it: "Strada difficilmente praticabile",
  },
  "Route impraticable pour les vhc": {
    de: "Für Fahrzeuge unpassierbare Strasse",
    it: "Strada impraticabile per i veicoli",
  },
  "Route impraticable barrée": {
    de: "Unpassierbare, gesperrte Strasse",
    it: "Strada impraticabile sbarrata",
  },
  Blessés: { de: "Verletzte", it: "Feriti" },
  Disparus: { de: "Vermisste", it: "Dispersi" },
  "Sans-abri": { de: "Obdachlose", it: "Senzatetto" },
  Enfermés: { de: "Eingeschlossene", it: "Intrappolati" },
  Morts: { de: "Tote", it: "Morti" },
  "Aperçu sur le plan du sauvetage": {
    de: "Übersicht Rettungsplan",
    it: "Panoramica del piano di salvataggio",
  },
  "Aperçu sur le plan du sauvetage exemple": {
    de: "Übersicht Rettungsplan Beispiel",
    it: "Panoramica del piano di salvataggio esempio",
  },
  "Zone biologiquement contaminée": {
    de: "Biologisch verseuchtes Gebiet",
    it: "Zona contaminata biologicamente",
  },
  "Zone chimiquement contaminée sous forme liquide": {
    de: "Chemisch verseuchtes Gebiet, flüssig",
    it: "Zona contaminata chimicamente in forma liquida",
  },
  "Zone chimiquement contaminée sous forme gazeuse": {
    de: "Chemisch verseuchtes Gebiet, gasförmig",
    it: "Zona contaminata chimicamente in forma gassosa",
  },
  "Zone radioactive": {
    de: "Radioaktiv verseuchtes Gebiet",
    it: "Zona radioattiva",
  },
  // Dangers
  "Danger chimique": { de: "Chemische Gefahr", it: "Pericolo chimico" },
  "Danger d’explosion": { de: "Explosionsgefahr", it: "Pericolo d’esplosione" },
  "Danger de gaz": { de: "Gasgefahr", it: "Pericolo di gas" },
  "Danger d’accident": { de: "Unfallgefahr", it: "Pericolo d’incidente" },
  "Danger si extinction avec eau": {
    de: "Gefahr beim Löschen mit Wasser",
    it: "Pericolo in caso di spegnimento con acqua",
  },
  "Danger substances radioactives": {
    de: "Gefahr durch radioaktive Stoffe",
    it: "Pericolo sostanze radioattive",
  },
  "Danger pour les eaux de surface": {
    de: "Gefahr für Oberflächengewässer",
    it: "Pericolo per le acque di superficie",
  },
  "Plaque de danger sans numéro ONU": {
    de: "Gefahrentafel ohne UN-Nummer",
    it: "Pannello di pericolo senza numero ONU",
  },
  "Plaque de danger avec numéro ONU": {
    de: "Gefahrentafel mit UN-Nummer",
    it: "Pannello di pericolo con numero ONU",
  },
  // Emplacements de conduite civils
  "Direction d’intervention": {
    de: "Einsatzleitung",
    it: "Direzione d’intervento",
  },
  "Centrale d’engagement mobile": {
    de: "Mobile Einsatzzentrale",
    it: "Centrale d’intervento mobile",
  },
  "PC engagement": { de: "KP Einsatz", it: "PC impiego" },
  "PC opérations": { de: "KP Operationen", it: "PC operazioni" },
  "Organe de conduite civile": {
    de: "Ziviles Führungsorgan",
    it: "Organo di condotta civile",
  },
  "Organe de conduite communal": {
    de: "Kommunales Führungsorgan",
    it: "Organo di condotta comunale",
  },
  "Organe de conduite régional": {
    de: "Regionales Führungsorgan",
    it: "Organo di condotta regionale",
  },
  "Organe de conduite de district": {
    de: "Bezirksführungsorgan",
    it: "Organo di condotta distrettuale",
  },
  "Organe de conduite cantonal": {
    de: "Kantonales Führungsorgan",
    it: "Organo di condotta cantonale",
  },
  // Formations
  "Chef de groupe": { de: "Gruppenführer", it: "Capogruppo" },
  Compagnie: { de: "Kompanie", it: "Compagnia" },
  "Équipe (point)": { de: "Trupp (Punkt)", it: "Squadra (punto)" },
  "Équipe (trait)": { de: "Trupp (Strich)", it: "Squadra (tratto)" },
  "Groupe (point)": { de: "Gruppe (Punkt)", it: "Gruppo (punto)" },
  "Groupe (trait)": { de: "Gruppe (Strich)", it: "Gruppo (tratto)" },
  "Officier chef de section": {
    de: "Offizier Zugführer",
    it: "Ufficiale capo sezione",
  },
  "Section (point)": { de: "Zug (Punkt)", it: "Sezione (punto)" },
  "Section (trait)": { de: "Zug (Strich)", it: "Sezione (tratto)" },
  Bataillon: { de: "Bataillon", it: "Battaglione" },
  "Équipage (point)": { de: "Besatzung (Punkt)", it: "Equipaggio (punto)" },
  "Équipage (trait)": { de: "Besatzung (Strich)", it: "Equipaggio (tratto)" },
  "Sapeurs pompiers": { de: "Feuerwehr", it: "Pompieri" },
  // Installations temporaires
  "Poste de circulation": { de: "Verkehrsposten", it: "Posto di circolazione" },
  "Poste de conduite mobile": {
    de: "Mobiler Führungsposten",
    it: "Posto di condotta mobile",
  },
  "Poste collecteur": { de: "Sammelstelle", it: "Posto di raccolta" },
  "Poste d’assistance": { de: "Betreuungsstelle", it: "Posto d’assistenza" },
  "Poste collecteur de patients": {
    de: "Patientensammelstelle",
    it: "Posto di raccolta pazienti",
  },
  "Poste médical avancé": {
    de: "Sanitätshilfsstelle",
    it: "Posto medico avanzato",
  },
  "Place pour véhicules": { de: "Fahrzeugplatz", it: "Piazza per veicoli" },
  "Laboratoire B": { de: "B-Labor", it: "Laboratorio B" },
  "Poste de décontamination ABC": {
    de: "ABC-Dekontaminationsstelle",
    it: "Posto di decontaminazione NBC",
  },
  "Poste ou zone de rétention": {
    de: "Rückhalteposten oder -zone",
    it: "Posto o zona di trattenimento",
  },
  "Poste collecteur de morts": {
    de: "Totensammelstelle",
    it: "Posto di raccolta salme",
  },
  "Poste de distribution": {
    de: "Verteilstelle",
    it: "Posto di distribuzione",
  },
  "Station de carburant": { de: "Tankstelle", it: "Stazione di rifornimento" },
  "Poste d’information": {
    de: "Informationsstelle",
    it: "Posto d’informazione",
  },
  "Centre de presse": { de: "Medienzentrum", it: "Centro stampa" },
  "Poste de débriefing": { de: "Debriefingstelle", it: "Posto di debriefing" },
  "Poste collecteur pour les proches": {
    de: "Angehörigensammelstelle",
    it: "Posto di raccolta per i congiunti",
  },
  "Poste collecteur de cadavres d’animaux": {
    de: "Tierkadaversammelstelle",
    it: "Posto di raccolta carcasse animali",
  },
  "Poste collecteur des objets trouvés": {
    de: "Sammelstelle für Fundgegenstände",
    it: "Posto di raccolta oggetti trovati",
  },
  "Poste de distribution d’eau potable": {
    de: "Trinkwasserverteilstelle",
    it: "Posto di distribuzione d’acqua potabile",
  },
  "Point de contrôle": { de: "Kontrollpunkt", it: "Punto di controllo" },
  "Centre de contrôle": { de: "Kontrollzentrum", it: "Centro di controllo" },
  Déviations: { de: "Umleitungen", it: "Deviazioni" },
  "Porte d’accès": { de: "Zufahrtstor", it: "Porta d’accesso" },
  "Fermeture de la route": {
    de: "Strassensperrung",
    it: "Chiusura della strada",
  },
  "Barrage du secteur d’engagement exemple": {
    de: "Absperrung des Einsatzraums Beispiel",
    it: "Sbarramento del settore d’intervento esempio",
  },
  "Point de sécurité police": {
    de: "Sicherheitspunkt Polizei",
    it: "Punto di sicurezza polizia",
  },
  "Place d’atterrissage hélicoptère": {
    de: "Helikopterlandeplatz",
    it: "Piazza d’atterraggio elicotteri",
  },
  "Place d’atterrissage pour drônes": {
    de: "Drohnenlandeplatz",
    it: "Piazza d’atterraggio per droni",
  },
  "Dépôt matériel": { de: "Materialdepot", it: "Deposito materiale" },
  Observation: { de: "Beobachtung", it: "Osservazione" },
  Observer: { de: "Beobachten", it: "Osservare" },
  Surveillance: { de: "Überwachung", it: "Sorveglianza" },
  "Entrepôt d’urgence PBC": {
    de: "KGS-Notlager",
    it: "Magazzino d’emergenza PBC",
  },
  "Dépôt d’urgence PBC": { de: "KGS-Notdepot", it: "Deposito d’emergenza PBC" },
  "Point de collecte PBC": {
    de: "KGS-Sammelstelle",
    it: "Punto di raccolta PBC",
  },
  "Logo PBC": { de: "KGS-Logo", it: "Logo PBC" },
  // Mouvements
  "Mouvement prévu": { de: "Geplante Bewegung", it: "Movimento previsto" },
  "Mouvement exécuté": { de: "Ausgeführte Bewegung", it: "Movimento eseguito" },
  "Engagement prévu": { de: "Geplanter Einsatz", it: "Impiego previsto" },
  "Engagement exécuté": { de: "Ausgeführter Einsatz", it: "Impiego eseguito" },
  "Reconnaissance prévue": {
    de: "Geplante Erkundung",
    it: "Ricognizione prevista",
  },
  "Reconnaissance exécutée": {
    de: "Ausgeführte Erkundung",
    it: "Ricognizione eseguita",
  },
  Fouiller: { de: "Absuchen", it: "Perlustrare" },
  "Déplacement motorisé": {
    de: "Motorisierte Verschiebung",
    it: "Spostamento motorizzato",
  },
  "Axe de sauvetage": { de: "Rettungsachse", it: "Asse di salvataggio" },
  Surveiller: { de: "Überwachen", it: "Sorvegliare" },
  Secourir: { de: "Retten", it: "Soccorrere" },
  // Véhicules
  Motocycle: { de: "Motorrad", it: "Motociclo" },
  Embarcation: { de: "Boot", it: "Imbarcazione" },
  "Véhicule léger (voiture)": {
    de: "Leichtes Fahrzeug (Personenwagen)",
    it: "Veicolo leggero (automobile)",
  },
  "Véhicule de transport (bus)": {
    de: "Transportfahrzeug (Bus)",
    it: "Veicolo da trasporto (bus)",
  },
  "Camion poids lourd": { de: "Lastwagen", it: "Autocarro pesante" },
  Remorque: { de: "Anhänger", it: "Rimorchio" },
  "Camion à pont basculant": { de: "Kipper", it: "Autocarro ribaltabile" },
  "Camion citerne": { de: "Tanklastwagen", it: "Autocisterna" },
  "Wagon citerne": { de: "Kesselwagen", it: "Carro cisterna" },
  Excavatrice: { de: "Bagger", it: "Escavatore" },
  "Pelle chargeuse": { de: "Radlader", it: "Pala caricatrice" },
  "Camion grue": { de: "Kranwagen", it: "Autogru" },
  "Canon à eau": { de: "Wasserwerfer", it: "Cannone ad acqua" },
  "Élévateur à nacelle": { de: "Hubarbeitsbühne", it: "Piattaforma aerea" },
  "Echelle pivotante aérienne": { de: "Autodrehleiter", it: "Autoscala" },
  "Fourgon Tonne pompe": { de: "Tanklöschfahrzeug", it: "Autobotte pompa" },
  "Reconnaissance aérienne légère": {
    de: "Leichte Luftaufklärung",
    it: "Ricognizione aerea leggera",
  },
  // Pictogrammes: événements naturels
  "Fortes précipitations": {
    de: "Starkniederschlag",
    it: "Forti precipitazioni",
  },
  "Tremblement de terre": { de: "Erdbeben", it: "Terremoto" },
  Sécheresse: { de: "Trockenheit", it: "Siccità" },
  Épidémie: { de: "Epidemie", it: "Epidemia" },
  Épizootie: { de: "Tierseuche", it: "Epizoozia" },
  "Niveau d’eau monte": {
    de: "Wasserstand steigt",
    it: "Livello dell’acqua in aumento",
  },
  "Niveau d’eau descend": {
    de: "Wasserstand sinkt",
    it: "Livello dell’acqua in calo",
  },
  "Ruisseau asséché": {
    de: "Ausgetrockneter Bach",
    it: "Ruscello prosciugato",
  },
  "Grippe porcine": { de: "Schweinegrippe", it: "Influenza suina" },
  // Pictogrammes: événements techniques
  Explosion: { de: "Explosion", it: "Esplosione" },
  Embouteillage: { de: "Stau", it: "Ingorgo" },
  "Accident auto": { de: "Autounfall", it: "Incidente stradale" },
  "Accident ferroviaire": {
    de: "Eisenbahnunfall",
    it: "Incidente ferroviario",
  },
  "Catastrophe aérienne": { de: "Flugzeugabsturz", it: "Catastrofe aerea" },
  "Panne énergétique": { de: "Energieausfall", it: "Interruzione energetica" },
  "Perturbation de la communication": {
    de: "Kommunikationsstörung",
    it: "Perturbazione delle comunicazioni",
  },
  "Interruption de l’approvisionnement en eau": {
    de: "Unterbruch der Wasserversorgung",
    it: "Interruzione dell’approvvigionamento idrico",
  },
  "Égouts défectueux": {
    de: "Defekte Kanalisation",
    it: "Fognature difettose",
  },
  "Accident nucléaire": { de: "Kernkraftunfall", it: "Incidente nucleare" },
  "Accident biologique": {
    de: "Biologischer Unfall",
    it: "Incidente biologico",
  },
  "Accident chimique": { de: "Chemieunfall", it: "Incidente chimico" },
  "Pollution aux hydrocarbures": {
    de: "Ölverschmutzung",
    it: "Inquinamento da idrocarburi",
  },
  "Dommages aux infrastructures": {
    de: "Schäden an Infrastrukturen",
    it: "Danni alle infrastrutture",
  },
  "Accident navigation": {
    de: "Schiffsunfall",
    it: "Incidente di navigazione",
  },
  "Fontaine fermée": { de: "Brunnen gesperrt", it: "Fontana chiusa" },
  "Interruption des transports publics": {
    de: "Unterbruch des öffentlichen Verkehrs",
    it: "Interruzione dei trasporti pubblici",
  },
  "Immeuble effondré": { de: "Eingestürztes Gebäude", it: "Edificio crollato" },
  "Poissons déplacés": { de: "Umgesiedelte Fische", it: "Pesci trasferiti" },
  "Amphibiens déplacés": {
    de: "Umgesiedelte Amphibien",
    it: "Anfibi trasferiti",
  },
  "Pollution des eaux": {
    de: "Gewässerverschmutzung",
    it: "Inquinamento delle acque",
  },
  // Pictogrammes: événements sociaux
  Pillage: { de: "Plünderung", it: "Saccheggio" },
  Vol: { de: "Diebstahl", it: "Furto" },
  "Vol, menaces": { de: "Diebstahl, Drohungen", it: "Furto, minacce" },
  "Incident avec des extrémistes": {
    de: "Vorfall mit Extremisten",
    it: "Incidente con estremisti",
  },
  Manifestation: { de: "Demonstration", it: "Manifestazione" },
  "Manifestation avec exactions": {
    de: "Demonstration mit Ausschreitungen",
    it: "Manifestazione con violenze",
  },
  Hooligans: { de: "Hooligans", it: "Hooligan" },
  Bagarre: { de: "Schlägerei", it: "Rissa" },
  "Dégradation de biens": {
    de: "Sachbeschädigung",
    it: "Danneggiamento di beni",
  },
  Graffiti: { de: "Graffiti", it: "Graffiti" },
  Ivresse: { de: "Trunkenheit", it: "Ubriachezza" },
  "Gens du voyage": { de: "Fahrende", it: "Nomadi" },
  "Occupation illégale": {
    de: "Illegale Besetzung",
    it: "Occupazione illegale",
  },
  "Visionnage public": { de: "Public Viewing", it: "Proiezione pubblica" },
  "Evénement sportif": { de: "Sportanlass", it: "Evento sportivo" },
  Barricades: { de: "Barrikaden", it: "Barricate" },
  "Prise d’otages": { de: "Geiselnahme", it: "Presa d’ostaggi" },
  Chantage: { de: "Erpressung", it: "Ricatto" },
  "Détournement d’avion": {
    de: "Flugzeugentführung",
    it: "Dirottamento aereo",
  },
  Enlèvement: { de: "Entführung", it: "Rapimento" },
  Fusillade: { de: "Schiesserei", it: "Sparatoria" },
  AMOK: { de: "AMOK", it: "AMOK" },
  "Attentat terroriste": { de: "Terroranschlag", it: "Attentato terroristico" },
  "Menace d’attentat à la bombe": {
    de: "Bombendrohung",
    it: "Minaccia di attentato dinamitardo",
  },
  "Attentat à la bombe": { de: "Bombenanschlag", it: "Attentato dinamitardo" },
  "Effet de panique": { de: "Panik", it: "Effetto di panico" },
  "Incendie criminel": { de: "Brandstiftung", it: "Incendio doloso" },
  Sabotage: { de: "Sabotage", it: "Sabotaggio" },
  Bombes: { de: "Bomben", it: "Bombe" },
  "Menace de mines": { de: "Minengefahr", it: "Minaccia di mine" },
  Menaces: { de: "Drohungen", it: "Minacce" },
  Réfugiés: { de: "Flüchtlinge", it: "Rifugiati" },
  // Spéciaux
  "Autoroute A": { de: "Autobahn A", it: "Autostrada A" },
  "Autoroute B": { de: "Autobahn B", it: "Autostrada B" },
  "Autoroute C": { de: "Autobahn C", it: "Autostrada C" },
  "Autoroute D": { de: "Autobahn D", it: "Autostrada D" },
  "Interdiction de naviguer": {
    de: "Schifffahrtsverbot",
    it: "Divieto di navigazione",
  },
  "Interdiction de survoler": {
    de: "Überflugverbot",
    it: "Divieto di sorvolo",
  },
  "Point de rassemblement d’urgence": {
    de: "Notfalltreffpunkt",
    it: "Punto di raccolta d’emergenza",
  },
} satisfies Dict);

/** Dictionary of the names of the symbols and their families. */
export const symbolDict = symbols.dict;
export type SymbolKey = keyof typeof symbolDict;

const isSymbolKey = (name: string): name is SymbolKey =>
  Object.hasOwn(symbolDict, name);

/** Name of a symbol or a family in the language of the post (French if unknown). */
export const symbolLabel = (name: string): string =>
  isSymbolKey(name) ? symbols.t(name) : name;

/** The French, German and Italian names of a symbol, for the search. */
export const symbolNames = (name: string): string =>
  isSymbolKey(name)
    ? [
        ...new Set([
          name,
          pick(symbolDict, name, "de"),
          pick(symbolDict, name, "it"),
        ]),
      ].join(" ")
    : name;
