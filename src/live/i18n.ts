import { translator, type Dict } from "../../shared/i18n/core.ts";
import { common } from "../../shared/i18n/common.ts";

// Live positions of the teams (src/live/*): consent, indicator, track.
export const { t, tn, tIn, dict } = translator({
  ...common,
  "Partage de position arrêté.": {
    de: "Positionsfreigabe beendet.",
    it: "Condivisione della posizione interrotta.",
  },
  "Localisation indisponible sur cet appareil.": {
    de: "Ortung auf diesem Gerät nicht verfügbar.",
    it: "Localizzazione non disponibile su questo dispositivo.",
  },
  "Localisation refusée : autorisez-la pour ce site dans le navigateur, puis recommencez.":
    {
      de: "Ortung verweigert: Erlauben Sie sie für diese Website im Browser und versuchen Sie es erneut.",
      it: "Localizzazione rifiutata: autorizzarla per questo sito nel browser, poi riprovare.",
    },
  "Pas de signal GPS pour le moment.": {
    de: "Momentan kein GPS-Signal.",
    it: "Nessun segnale GPS al momento.",
  },
  "Position indisponible pour le moment.": {
    de: "Position momentan nicht verfügbar.",
    it: "Posizione al momento non disponibile.",
  },
  // Track saved on the map (stored texts, language of the post)
  "Trace {label} {from}–{to}": {
    de: "Spur {label} {from}–{to}",
    it: "Traccia {label} {from}–{to}",
  },
  "Trace GPS enregistrée par {author} : {distance}, de {from} à {to}.": {
    de: "GPS-Spur aufgezeichnet von {author}: {distance}, von {from} bis {to}.",
    it: "Traccia GPS registrata da {author}: {distance}, dalle {from} alle {to}.",
  },
  "Trace enregistrée sur la carte, calque {layer}.": {
    de: "Spur auf der Karte gespeichert, Ebene {layer}.",
    it: "Traccia registrata sulla carta, livello {layer}.",
  },
  "Enregistrer la trace ?": {
    de: "Spur speichern?",
    it: "Salvare la traccia?",
  },
  "La trace de « {label} » est gardée en mémoire sur ce poste seulement : {n} points, {distance}, de {from} à {to}. Enregistrée, elle devient une ligne de la carte (calque {layer}), visible de tous les postes et gardée dans l’historique.":
    {
      de: "Die Spur von « {label} » ist nur auf diesem Arbeitsplatz gespeichert: {n} Punkte, {distance}, von {from} bis {to}. Gespeichert wird sie zu einer Linie auf der Karte (Ebene {layer}), sichtbar für alle Arbeitsplätze und im Verlauf festgehalten.",
      it: "La traccia di « {label} » è conservata in memoria solo su questa postazione: {n} punti, {distance}, dalle {from} alle {to}. Registrata, diventa una linea della carta (livello {layer}), visibile da tutte le postazioni e conservata nella cronologia.",
    },
  "Trace abandonnée : rien n’a été enregistré.": {
    de: "Spur verworfen: Es wurde nichts gespeichert.",
    it: "Traccia abbandonata: non è stato registrato nulla.",
  },
  "Abandonner la trace": { de: "Spur verwerfen", it: "Abbandona la traccia" },
  "Enregistrer sur la carte": {
    de: "Auf der Karte speichern",
    it: "Registra sulla carta",
  },
  // Indicator
  "en attente du GPS": { de: "wartet auf GPS", it: "in attesa del GPS" },
  "hors ligne : personne ne la reçoit": {
    de: "offline: niemand empfängt sie",
    it: "offline: nessuno la riceve",
  },
  "envoyée {age}": { de: "gesendet {age}", it: "inviata {age}" },
  "envoi…": { de: "wird gesendet …", it: "invio…" },
  "Détails du partage de position": {
    de: "Details der Positionsfreigabe",
    it: "Dettagli della condivisione della posizione",
  },
  "Position partagée · {label}": {
    de: "Position geteilt · {label}",
    it: "Posizione condivisa · {label}",
  },
  "trace {distance}": { de: "Spur {distance}", it: "traccia {distance}" },
  Arrêter: { de: "Stoppen", it: "Ferma" },
  // Consent
  "Partager ma position": {
    de: "Meine Position teilen",
    it: "Condividi la mia posizione",
  },
  "Ce poste envoie sa <0>position GPS</0> aux postes connectés à la même session, environ toutes les 15 secondes (plus souvent en mouvement).":
    {
      de: "Dieser Arbeitsplatz sendet seine <0>GPS-Position</0> an die Arbeitsplätze, die mit derselben Sitzung verbunden sind, etwa alle 15 Sekunden (in Bewegung häufiger).",
      it: "Questa postazione invia la sua <0>posizione GPS</0> alle postazioni connesse alla stessa sessione, circa ogni 15 secondi (più spesso in movimento).",
    },
  "<0>Qui la voit :</0> seulement les postes qui ont le code de la session, sur la carte (calque « Positions en direct »). Elle est chiffrée de bout en bout : le relais ne peut pas la lire et ne garde rien.":
    {
      de: "<0>Wer sie sieht:</0> nur die Arbeitsplätze mit dem Sitzungscode, auf der Karte (Ebene « Live-Positionen »). Sie ist Ende-zu-Ende verschlüsselt: Das Relais kann sie nicht lesen und speichert nichts.",
      it: "<0>Chi la vede:</0> solo le postazioni che hanno il codice della sessione, sulla carta (livello « Posizioni in diretta »). È cifrata da un capo all’altro: il relay non può leggerla e non conserva nulla.",
    },
  "<0>Ce qui est gardé :</0> rien. Les autres postes gardent en mémoire la dernière position et le trajet des 30 dernières minutes, puis l’oublient. Rien n’entre dans le journal, l’historique ou les archives, sauf si un opérateur consigne une position exprès.":
    {
      de: "<0>Was gespeichert wird:</0> nichts. Die anderen Arbeitsplätze behalten die letzte Position und den Weg der letzten 30 Minuten im Speicher und vergessen sie dann. Nichts gelangt ins Journal, in den Verlauf oder ins Archiv, ausser ein Operateur erfasst eine Position ausdrücklich.",
      it: "<0>Cosa viene conservato:</0> nulla. Le altre postazioni tengono in memoria l’ultima posizione e il percorso degli ultimi 30 minuti, poi li dimenticano. Nulla entra nel diario, nella cronologia o negli archivi, salvo se un operatore registra appositamente una posizione.",
    },
  "<0>Quand ça s’arrête :</0> quand vous touchez « Arrêter » (toujours visible en haut de l’écran), quand vous fermez l’onglet, ou quand l’appareil se verrouille (le navigateur coupe la localisation).":
    {
      de: "<0>Wann es aufhört:</0> wenn Sie « Stoppen » antippen (immer oben am Bildschirm sichtbar), wenn Sie den Tab schliessen oder wenn sich das Gerät sperrt (der Browser schaltet die Ortung ab).",
      it: "<0>Quando si ferma:</0> quando si tocca « Ferma » (sempre visibile in alto sullo schermo), quando si chiude la scheda o quando il dispositivo si blocca (il browser interrompe la localizzazione).",
    },
  "La synchronisation n’est pas en direct : tant qu’elle ne l’est pas, seule cette page voit la position.":
    {
      de: "Die Synchronisation ist nicht live: Solange sie es nicht ist, sieht nur diese Seite die Position.",
      it: "La sincronizzazione non è in diretta: finché non lo è, solo questa pagina vede la posizione.",
    },
  "Équipe ou moyen représenté": {
    de: "Dargestelltes Team oder Mittel",
    it: "Squadra o mezzo rappresentato",
  },
  "Aucun (libellé libre)": {
    de: "Keines (freie Bezeichnung)",
    it: "Nessuno (etichetta libera)",
  },
  "Postes et cellules (Équipe)": {
    de: "Posten und Zellen (Team)",
    it: "Posti e cellule (Squadra)",
  },
  "Relie la position à sa fiche : un clic sur la carte l’ouvre.": {
    de: "Verknüpft die Position mit ihrem Datenblatt: Ein Klick auf der Karte öffnet es.",
    it: "Collega la posizione alla sua scheda: un clic sulla carta la apre.",
  },
  "Libellé sur la carte": {
    de: "Bezeichnung auf der Karte",
    it: "Etichetta sulla carta",
  },
  "Nom d’appel ou nom de l’équipe, par exemple « Patrouille 2 ».": {
    de: "Rufname oder Name des Teams, zum Beispiel « Patrouille 2 ».",
    it: "Nominativo o nome della squadra, per esempio « Pattuglia 2 ».",
  },
  "Garder l’écran allumé": {
    de: "Bildschirm eingeschaltet lassen",
    it: "Mantieni lo schermo acceso",
  },
  "Évite que le téléphone se verrouille et coupe le partage. Consomme davantage de batterie.":
    {
      de: "Verhindert, dass sich das Telefon sperrt und die Freigabe unterbricht. Verbraucht mehr Akku.",
      it: "Evita che il telefono si blocchi e interrompa la condivisione. Consuma più batteria.",
    },
  "Enregistrer la trace": { de: "Spur aufzeichnen", it: "Registra la traccia" },
  "Le trajet est gardé en mémoire sur ce poste. À l’arrêt, vous choisissez de l’enregistrer comme ligne sur la carte ou de l’abandonner.":
    {
      de: "Der Weg wird auf diesem Arbeitsplatz gespeichert. Beim Stoppen wählen Sie, ob Sie ihn als Linie auf der Karte speichern oder verwerfen.",
      it: "Il percorso è conservato in memoria su questa postazione. All’arresto si sceglie se registrarlo come linea sulla carta o abbandonarlo.",
    },
  // Sharing dialog
  "Position partagée": { de: "Geteilte Position", it: "Posizione condivisa" },
  Libellé: { de: "Bezeichnung", it: "Etichetta" },
  Depuis: { de: "Seit", it: "Da" },
  "Dernière position": { de: "Letzte Position", it: "Ultima posizione" },
  "{age}, précision ± {m} m": {
    de: "{age}, Genauigkeit ± {m} m",
    it: "{age}, precisione ± {m} m",
  },
  Envoi: { de: "Senden", it: "Invio" },
  "pas encore": { de: "noch nicht", it: "non ancora" },
  "{n} points, {distance}. À l’arrêt, vous choisissez de l’enregistrer ou de l’abandonner.":
    {
      de: "{n} Punkte, {distance}. Beim Stoppen wählen Sie, ob Sie sie speichern oder verwerfen.",
      it: "{n} punti, {distance}. All’arresto si sceglie se registrarla o abbandonarla.",
    },
  "Gardée en mémoire sur ce poste jusqu’à l’arrêt du partage. La désactiver abandonne le trajet gardé.":
    {
      de: "Bis zum Ende der Freigabe auf diesem Arbeitsplatz gespeichert. Deaktivieren verwirft den gespeicherten Weg.",
      it: "Conservata in memoria su questa postazione fino all’arresto della condivisione. Disattivarla abbandona il percorso conservato.",
    },
  "Arrêter le partage": {
    de: "Freigabe beenden",
    it: "Interrompi la condivisione",
  },
} satisfies Dict);
