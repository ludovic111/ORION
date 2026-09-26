import { translator, type Dict } from "../../shared/i18n/core.ts";
import { common } from "../../shared/i18n/common.ts";

// Texts of the shell: top bar, menus, settings, palette, dialogs (src/app
// and src/App.tsx). Module names live in i18n-modules.ts.
export const { t, tn, tIn, dict } = translator({
  ...common,
  // gate.ts, useJournalActions.ts
  "Lecture seule : vous consultez le passé. Revenez au direct pour écrire.": {
    de: "Nur lesen: Sie sehen die Vergangenheit. Kehren Sie zur Live-Ansicht zurück, um zu schreiben.",
    it: "Sola lettura: state consultando il passato. Tornate alla diretta per scrivere.",
  },
  "Journal clôturé — rouvrez-le pour écrire.": {
    de: "Journal abgeschlossen – öffnen Sie es wieder, um zu schreiben.",
    it: "Diario chiuso — riapritelo per scrivere.",
  },
  "Aucun journal ouvert.": {
    de: "Kein Journal geöffnet.",
    it: "Nessun diario aperto.",
  },
  "Ce journal n’est plus dans la session.": {
    de: "Dieses Journal ist nicht mehr in der Sitzung.",
    it: "Questo diario non è più nella sessione.",
  },
  "Entrée introuvable.": {
    de: "Eintrag nicht gefunden.",
    it: "Voce non trovata.",
  },
  "Échéance reportée de {n} min": {
    de: "Frist um {n} Min. verschoben",
    it: "Scadenza rinviata di {n} min",
  },
  "{entry} : échéance reportée de {n} min.": {
    de: "{entry}: Frist um {n} Min. verschoben.",
    it: "{entry}: scadenza rinviata di {n} min.",
  },
  "Consigné au journal : {message}": {
    de: "Im Journal erfasst: {message}",
    it: "Registrato nel diario: {message}",
  },
  "Clôture du journal.": {
    de: "Abschluss des Journals.",
    it: "Chiusura del diario.",
  },
  "Réouverture du journal.": {
    de: "Wiedereröffnung des Journals.",
    it: "Riapertura del diario.",
  },
  // useConductWatch.ts
  "Seuil météo franchi : {label} ({day}).": {
    de: "Wetterschwelle überschritten: {label} ({day}).",
    it: "Soglia meteo superata: {label} ({day}).",
  },
  "alerte créée": { de: "Warnung erstellt", it: "allerta creata" },
  "{n} seuils météo franchis : alertes créées dans Météo.": {
    de: "{n} Wetterschwellen überschritten: Warnungen unter Wetter erstellt.",
    it: "{n} soglie meteo superate: allerte create in Meteo.",
  },
  // contact.tsx
  "orion aic · idée ({topic})": {
    de: "orion aic · Idee ({topic})",
    it: "orion aic · idea ({topic})",
  },
  "orion aic · idée": { de: "orion aic · Idee", it: "orion aic · idea" },
  "Bonjour,": { de: "Guten Tag", it: "Buongiorno," },
  "J’utilise orion aic, module « {topic} ».": {
    de: "Ich verwende orion aic, Modul « {topic} ».",
    it: "Uso orion aic, modulo « {topic} ».",
  },
  "J’utilise orion aic.": {
    de: "Ich verwende orion aic.",
    it: "Uso orion aic.",
  },
  "Ce que je voudrais ajouter ou changer :": {
    de: "Was ich hinzufügen oder ändern möchte:",
    it: "Cosa vorrei aggiungere o cambiare:",
  },
  "Dans quelle situation cela m’aiderait :": {
    de: "In welcher Situation mir das helfen würde:",
    it: "In quale situazione mi aiuterebbe:",
  },
  "Merci !": { de: "Danke!", it: "Grazie!" },
  "Une idée, un besoin, quelque chose à changer ?": {
    de: "Eine Idee, ein Bedürfnis, etwas zu ändern?",
    it: "Un’idea, un bisogno, qualcosa da cambiare?",
  },
  "orion aic évolue avec ceux qui l’utilisent. Écrivez-moi pour demander une fonction, signaler un souci ou proposer ce qui vous faciliterait la vie : chaque message est lu.":
    {
      de: "orion aic entwickelt sich mit denen, die es nutzen. Schreiben Sie mir, um eine Funktion zu wünschen, ein Problem zu melden oder vorzuschlagen, was Ihnen die Arbeit erleichtern würde: Jede Nachricht wird gelesen.",
      it: "orion aic evolve con chi lo usa. Scrivetemi per chiedere una funzione, segnalare un problema o proporre ciò che vi semplificherebbe il lavoro: ogni messaggio viene letto.",
    },
  "Écrire à {email}": { de: "An {email} schreiben", it: "Scrivi a {email}" },
  "Adresse copiée": { de: "Adresse kopiert", it: "Indirizzo copiato" },
  "Copier l’adresse": { de: "Adresse kopieren", it: "Copia l’indirizzo" },
  "N’envoyez jamais le contenu d’un journal réel par e-mail : décrivez le besoin, pas les données.":
    {
      de: "Senden Sie nie den Inhalt eines echten Journals per E-Mail: Beschreiben Sie das Bedürfnis, nicht die Daten.",
      it: "Non inviate mai il contenuto di un diario reale per e-mail: descrivete il bisogno, non i dati.",
    },
  // palettes.ts
  Papier: { de: "Papier", it: "Carta" },
  "Crème chaude, encre graphite. Le thème par défaut.": {
    de: "Warmes Creme, Graphittinte. Das Standardthema.",
    it: "Crema caldo, inchiostro grafite. Il tema predefinito.",
  },
  Ardoise: { de: "Schiefer", it: "Ardesia" },
  "Gris bleuté et encre marine : plus froid, reposant sous néon.": {
    de: "Blaugrau und Marinetinte: kühler, angenehm unter Neonlicht.",
    it: "Grigio bluastro e inchiostro blu marino: più freddo, riposante sotto il neon.",
  },
  "Signal PC": { de: "Signal ZS", it: "Segnale PCi" },
  "Bleu et orange du signe international de la protection civile.": {
    de: "Blau und Orange des internationalen Zeichens des Zivilschutzes.",
    it: "Blu e arancione del segno internazionale della protezione civile.",
  },
  "Contraste élevé": { de: "Hoher Kontrast", it: "Contrasto elevato" },
  "Blanc pur, noir pur, traits épais. Plein soleil, vue fatiguée.": {
    de: "Reines Weiss, reines Schwarz, dicke Linien. Pralle Sonne, müde Augen.",
    it: "Bianco puro, nero puro, tratti spessi. Pieno sole, vista stanca.",
  },
  Graphite: { de: "Graphit", it: "Grafite" },
  "Le papier après la tombée de la nuit.": {
    de: "Das Papier nach Einbruch der Nacht.",
    it: "La carta dopo il calar della notte.",
  },
  Minuit: { de: "Mitternacht", it: "Mezzanotte" },
  "Bleu nuit profond, encre claire. Salle de conduite sombre.": {
    de: "Tiefes Nachtblau, helle Tinte. Dunkler Führungsraum.",
    it: "Blu notte profondo, inchiostro chiaro. Sala di condotta buia.",
  },
  "Nuit tactique": { de: "Taktische Nacht", it: "Notte tattica" },
  "Tout en rouge sur noir : préserve la vision de nuit sur le terrain.": {
    de: "Alles rot auf schwarz: schont das Nachtsehen im Gelände.",
    it: "Tutto rosso su nero: preserva la visione notturna sul terreno.",
  },
  // TopBar.tsx
  "Journaux de la session": {
    de: "Journale der Sitzung",
    it: "Diari della sessione",
  },
  Clôturé: { de: "Abgeschlossen", it: "Chiuso" },
  "Rechercher ou agir partout (⌘K)": {
    de: "Überall suchen oder handeln (⌘K)",
    it: "Cercare o agire ovunque (⌘K)",
  },
  "Rechercher ou agir": { de: "Suchen oder handeln", it: "Cerca o agisci" },
  "… partout": { de: " … überall", it: "… ovunque" },
  "Synchronisation désactivée : partager la session avec d’autres postes": {
    de: "Synchronisation deaktiviert: Sitzung mit anderen Arbeitsplätzen teilen",
    it: "Sincronizzazione disattivata: condividere la sessione con altre postazioni",
  },
  "Synchronisation active": {
    de: "Synchronisation aktiv",
    it: "Sincronizzazione attiva",
  },
  "Synchronisation en reconnexion": {
    de: "Synchronisation wird neu verbunden",
    it: "Sincronizzazione in riconnessione",
  },
  "{n} autre(s) poste(s) (1)": {
    fr: "{n} autre(s) poste(s)",
    de: "{n} weiterer Arbeitsplatz",
    it: "{n} altra postazione",
  },
  "{n} autre(s) poste(s)": {
    de: "{n} weitere Arbeitsplätze",
    it: "{n} altre postazioni",
  },
  "{n} fusion(s) à voir (1)": {
    fr: "{n} fusion(s) à voir",
    de: "{n} Zusammenführung zu prüfen",
    it: "{n} fusione da vedere",
  },
  "{n} fusion(s) à voir": {
    de: "{n} Zusammenführungen zu prüfen",
    it: "{n} fusioni da vedere",
  },
  Seul: { de: "Allein", it: "Da solo" },
  "{n} poste": { de: "{n} Platz", it: "{n} postazione" },
  "{n} postes": { de: "{n} Plätze", it: "{n} postazioni" },
  Reconnexion: { de: "Neu verbinden", it: "Riconnessione" },
  "Sauvegarde chiffrée sur ce poste": {
    de: "Verschlüsselte Speicherung auf diesem Arbeitsplatz",
    it: "Salvataggio cifrato su questa postazione",
  },
  "Session temporaire : exportez avant de fermer": {
    de: "Temporäre Sitzung: vor dem Schliessen exportieren",
    it: "Sessione temporanea: esportate prima di chiudere",
  },
  "Échec sauvegarde": {
    de: "Speichern fehlgeschlagen",
    it: "Salvataggio fallito",
  },
  "Sauvegarde…": { de: "Speichern …", it: "Salvataggio…" },
  Chiffré: { de: "Verschlüsselt", it: "Cifrato" },
  Temporaire: { de: "Temporär", it: "Temporaneo" },
  "Hors ligne": { de: "Offline", it: "Offline" },
  "Revenir à l’état actuel": {
    de: "Zum aktuellen Stand zurück",
    it: "Tornare allo stato attuale",
  },
  "Remonter le temps": { de: "Zeitreise", it: "Macchina del tempo" },
  "Remonter le temps : revoir l’opération à n’importe quelle heure": {
    de: "Zeitreise: den Einsatz zu jeder beliebigen Zeit ansehen",
    it: "Macchina del tempo: rivedere l’operazione a qualsiasi ora",
  },
  "Présenter la situation": {
    de: "Lage präsentieren",
    it: "Presentare la situazione",
  },
  "Présenter la situation (plein écran)": {
    de: "Lage präsentieren (Vollbild)",
    it: "Presentare la situazione (schermo intero)",
  },
  "Thème sombre": { de: "Dunkles Thema", it: "Tema scuro" },
  "Thème clair": { de: "Helles Thema", it: "Tema chiaro" },
  "Opérateur, réglages et session": {
    de: "Operateur, Einstellungen und Sitzung",
    it: "Operatore, impostazioni e sessione",
  },
  // ShellMenus.tsx
  "{n} entrées (1)": {
    fr: "{n} entrées",
    de: "{n} Eintrag",
    it: "{n} voce",
  },
  "{n} entrées": { de: "{n} Einträge", it: "{n} voci" },
  "{n} messages (1)": {
    fr: "{n} messages",
    de: "{n} Meldung",
    it: "{n} messaggio",
  },
  "{n} messages": { de: "{n} Meldungen", it: "{n} messaggi" },
  "Nouveau journal": { de: "Neues Journal", it: "Nuovo diario" },
  "Importer un fichier": { de: "Datei importieren", it: "Importa un file" },
  "Exporter (tous formats)": {
    de: "Exportieren (alle Formate)",
    it: "Esporta (tutti i formati)",
  },
  "à faire": { de: "ausstehend", it: "da fare" },
  "Propriétés, clôture": {
    de: "Eigenschaften, Abschluss",
    it: "Proprietà, chiusura",
  },
  "Retirer ce journal de la session": {
    de: "Journal aus der Sitzung entfernen",
    it: "Rimuovi questo diario dalla sessione",
  },
  "Réglages du poste": {
    de: "Einstellungen des Arbeitsplatzes",
    it: "Impostazioni della postazione",
  },
  "Thème, modules, impression automatique": {
    de: "Thema, Module, automatischer Druck",
    it: "Tema, moduli, stampa automatica",
  },
  Référentiels: { de: "Wertelisten", it: "Elenchi di riferimento" },
  "Destinataires, catégories, grades… standards": {
    de: "Standard-Empfänger, -Kategorien, -Grade …",
    it: "Destinatari, categorie, gradi… standard",
  },
  Synchronisation: { de: "Synchronisation", it: "Sincronizzazione" },
  "Travailler à plusieurs postes sur la même session": {
    de: "Mit mehreren Arbeitsplätzen an derselben Sitzung arbeiten",
    it: "Lavorare da più postazioni sulla stessa sessione",
  },
  "Session et sauvegarde": {
    de: "Sitzung und Speicherung",
    it: "Sessione e salvataggio",
  },
  "Opérateur, phrase de récupération, fin de session": {
    de: "Operateur, Wiederherstellungssatz, Sitzungsende",
    it: "Operatore, frase di recupero, fine della sessione",
  },
  "Écran mural": { de: "Wandanzeige", it: "Schermo murale" },
  "Grand écran de la salle, lecture seule": {
    de: "Grossbildschirm des Raums, nur lesen",
    it: "Grande schermo della sala, sola lettura",
  },
  "Sécurité et données": { de: "Sicherheit und Daten", it: "Sicurezza e dati" },
  "Une idée, un besoin ?": {
    de: "Eine Idee, ein Bedürfnis?",
    it: "Un’idea, un bisogno?",
  },
  "Proposer une amélioration à l’auteur": {
    de: "Dem Autor eine Verbesserung vorschlagen",
    it: "Proporre un miglioramento all’autore",
  },
  "Installer l’application": {
    de: "Anwendung installieren",
    it: "Installa l’applicazione",
  },
  "Code source · AGPL-3.0": {
    de: "Quellcode · AGPL-3.0",
    it: "Codice sorgente · AGPL-3.0",
  },
  Verrouiller: { de: "Sperren", it: "Blocca" },
  "Fermer la session": { de: "Sitzung schliessen", it: "Chiudi la sessione" },
  // ReminderBar.tsx
  Rappels: { de: "Erinnerungen", it: "Promemoria" },
  "Prévu à {time}": { de: "Geplant um {time}", it: "Previsto alle {time}" },
  "Plus tard (15 min)": { de: "Später (15 Min.)", it: "Più tardi (15 min)" },
  "Me le rappeler dans 15 minutes": {
    de: "In 15 Minuten erinnern",
    it: "Ricordamelo tra 15 minuti",
  },
  "Marquer comme fait": {
    de: "Als erledigt markieren",
    it: "Segna come fatto",
  },
  Fait: { de: "Erledigt", it: "Fatto" },
  // OverlayHost.tsx
  "Entrée {n} supprimée.": {
    de: "Eintrag {n} gelöscht.",
    it: "Voce {n} eliminata.",
  },
  "Modification enregistrée. Version précédente conservée.": {
    de: "Änderung gespeichert. Vorherige Version bleibt erhalten.",
    it: "Modifica salvata. Versione precedente conservata.",
  },
  "Suite de {n}": { de: "Folge von {n}", it: "Seguito di {n}" },
  "Journal clôturé.": {
    de: "Journal abgeschlossen.",
    it: "Diario chiuso.",
  },
  "Journal rouvert.": {
    de: "Journal wieder geöffnet.",
    it: "Diario riaperto.",
  },
  "Entrées supprimées": { de: "Gelöschte Einträge", it: "Voci eliminate" },
  "Supprimée le": { de: "Gelöscht am", it: "Eliminata il" },
  Par: { de: "Von", it: "Da" },
  Motif: { de: "Grund", it: "Motivo" },
  "Aucune entrée supprimée dans ce journal.": {
    de: "Keine gelöschten Einträge in diesem Journal.",
    it: "Nessuna voce eliminata in questo diario.",
  },
  "Consigner la relève": {
    de: "Ablösung erfassen",
    it: "Registra l’avvicendamento",
  },
  "Nouvelle entrée": { de: "Neuer Eintrag", it: "Nuova voce" },
  // commands.tsx (⌘K palette): labels, then search words
  "Nouvelle entrée au journal": {
    de: "Neuer Eintrag im Journal",
    it: "Nuova voce nel diario",
  },
  "Nouveau message reçu": {
    de: "Neue eingegangene Meldung",
    it: "Nuovo messaggio ricevuto",
  },
  "Nouvel ordre": { de: "Neuer Befehl", it: "Nuovo ordine" },
  "Diffuser avec accusé de lecture": {
    de: "Mit Lesebestätigung verteilen",
    it: "Diffondi con conferma di lettura",
  },
  "Rapport de situation A4": {
    de: "Lagebericht A4",
    it: "Rapporto sulla situazione A4",
  },
  "Démarrer une liste de contrôle": {
    de: "Checkliste starten",
    it: "Avvia una lista di controllo",
  },
  "Nouvelle demande de moyens": {
    de: "Neue Mittelanforderung",
    it: "Nuova richiesta di mezzi",
  },
  "Relève : que s’est-il passé depuis…": {
    de: "Ablösung: Was ist seit … passiert",
    it: "Avvicendamento: cos’è successo da…",
  },
  "Figer un point de situation": {
    de: "Momentaufnahme der Lage festhalten",
    it: "Fissa un’istantanea della situazione",
  },
  "Écran mural de la salle de conduite": {
    de: "Wandanzeige des Führungsraums",
    it: "Schermo murale della sala di condotta",
  },
  "Affichage mural en diaporama": {
    de: "Wandanzeige als Diashow",
    it: "Schermo murale in presentazione",
  },
  "Débriefing et exercice (RETEX)": {
    de: "Debriefing und Übung",
    it: "Debriefing ed esercizio",
  },
  "Traçabilité : qui a fait quoi": {
    de: "Nachvollziehbarkeit: wer hat was gemacht",
    it: "Tracciabilità: chi ha fatto cosa",
  },
  "Synchroniser avec d’autres postes": {
    de: "Mit anderen Arbeitsplätzen synchronisieren",
    it: "Sincronizza con altre postazioni",
  },
  "Désactiver l’impression automatique": {
    de: "Automatischen Druck deaktivieren",
    it: "Disattiva la stampa automatica",
  },
  "Activer l’impression automatique": {
    de: "Automatischen Druck aktivieren",
    it: "Attiva la stampa automatica",
  },
  "Thème {name}": { de: "Thema {name}", it: "Tema {name}" },
  "Réglages et référentiels": {
    de: "Einstellungen und Wertelisten",
    it: "Impostazioni ed elenchi di riferimento",
  },
  "Proposer une amélioration (contacter l’auteur)": {
    de: "Verbesserung vorschlagen (Autor kontaktieren)",
    it: "Proponi un miglioramento (contatta l’autore)",
  },
  "Nouveau journal dans la session": {
    de: "Neues Journal in der Sitzung",
    it: "Nuovo diario nella sessione",
  },
  "consigner message journal": {
    de: "erfassen meldung journal eintrag",
    it: "registrare messaggio diario voce",
  },
  "réception synthèse": { de: "eingang synthese", it: "ricezione sintesi" },
  "ordre engagement complémentaire intention missions": {
    de: "befehl einsatz ergänzend absicht aufträge",
    it: "ordine impiego complementare intenzione missioni",
  },
  "diffusion lu compris quittance destinataires": {
    de: "verteilung gelesen verstanden quittung empfänger",
    it: "diffusione letto compreso quittanza destinatari",
  },
  "archive pdf excel word powerpoint pptx imprimer": {
    de: "archiv pdf excel word powerpoint pptx drucken",
    it: "archivio pdf excel word powerpoint pptx stampare",
  },
  "crue black-out canicule séisme tempête abc recherche évacués ouverture pc": {
    de: "hochwasser strommangellage blackout hitzewelle erdbeben sturm abc suche evakuierte eröffnung kp",
    it: "piena blackout canicola terremoto tempesta abc ricerca evacuati apertura pc",
  },
  "moyens renfort matériel demandé accordé arrivé": {
    de: "mittel verstärkung material angefordert bewilligt eingetroffen",
    it: "mezzi rinforzo materiale richiesto accordato arrivato",
  },
  "résumé relève depuis passation": {
    de: "zusammenfassung ablösung seit übergabe",
    it: "riassunto avvicendamento da passaggio consegne",
  },
  "historique versions heure rejouer replay passé": {
    de: "verlauf versionen zeit zeitreise wiedergabe vergangenheit",
    it: "cronologia versioni ora macchina del tempo riproduci passato",
  },
  "version nommée point situation heure": {
    de: "benannte version momentaufnahme lage zeit",
    it: "versione nominata istantanea situazione ora",
  },
  "présentation diaporama autorités visite powerpoint": {
    de: "präsentation diashow behörden besuch powerpoint",
    it: "presentazione diapositive autorità visita powerpoint",
  },
  "mur grand écran projecteur salle kiosque tv affichage #mur": {
    de: "wand grossbildschirm beamer raum kiosk tv anzeige wandanzeige",
    it: "muro grande schermo proiettore sala chiosco tv visualizzazione murale",
  },
  "écran projecteur salle kiosque diapositives boucle": {
    de: "bildschirm beamer raum kiosk folien schleife",
    it: "schermo proiettore sala chiosco diapositive ciclo",
  },
  "retex retour expérience exercice inject scénario direction relecture": {
    de: "debriefing erfahrungen übung einspielung szenario übungsleitung auswertung",
    it: "debriefing esperienza esercizio inject scenario direzione rilettura",
  },
  "historique audit comparer vérifier export": {
    de: "verlauf audit vergleichen prüfen export",
    it: "cronologia audit confrontare verificare esportazione",
  },
  "partager session code qr réseau": {
    de: "teilen sitzung code qr netzwerk",
    it: "condividere sessione codice qr rete",
  },
  "couleurs apparence": { de: "farben aussehen", it: "colori aspetto" },
  clair: { de: "hell", it: "chiaro" },
  sombre: { de: "dunkel", it: "scuro" },
  "listes standards destinataires modules": {
    de: "listen standard empfänger module wertelisten",
    it: "elenchi standard destinatari moduli",
  },
  "idée besoin contact email suggestion bug demande": {
    de: "idee bedürfnis kontakt email vorschlag fehler anfrage",
    it: "idea bisogno contatto email suggerimento bug richiesta",
  },
  // Settings.tsx
  Rubrique: { de: "Rubrik", it: "Rubrica" },
  "Ce poste": { de: "Dieser Arbeitsplatz", it: "Questa postazione" },
  "Session et journal": { de: "Sitzung und Journal", it: "Sessione e diario" },
  "Une idée ?": { de: "Eine Idee?", it: "Un’idea?" },
  "Dictée vocale": { de: "Spracheingabe", it: "Dettatura vocale" },
  "Dicter les messages au micro": {
    de: "Meldungen per Mikrofon diktieren",
    it: "Dettare i messaggi al microfono",
  },
  "Un bouton micro apparaît à côté du texte des entrées du journal et des messages. Le micro n’est ouvert que pendant la dictée.":
    {
      de: "Neben dem Text der Journaleinträge und der Meldungen erscheint eine Mikrofontaste. Das Mikrofon ist nur während des Diktierens offen.",
      it: "Accanto al testo delle voci del diario e dei messaggi appare un pulsante microfono. Il microfono è aperto solo durante la dettatura.",
    },
  "Dans Chrome et Edge, le son est envoyé aux serveurs de Google / Microsoft pour être transcrit, et il faut une connexion internet. Safari peut transcrire sur l’appareil selon le système. Ne dictez pas d’informations confidentielles si ce n’est pas autorisé.":
    {
      de: "In Chrome und Edge wird der Ton zur Transkription an die Server von Google / Microsoft gesendet, und es braucht eine Internetverbindung. Safari kann je nach System auf dem Gerät transkribieren. Diktieren Sie keine vertraulichen Informationen, wenn dies nicht erlaubt ist.",
      it: "In Chrome ed Edge l’audio viene inviato ai server di Google / Microsoft per essere trascritto, ed è necessaria una connessione internet. Safari può trascrivere sul dispositivo a seconda del sistema. Non dettate informazioni confidenziali se non è autorizzato.",
    },
  "Non disponible dans ce navigateur. Chrome, Edge et Safari proposent la dictée vocale.":
    {
      de: "In diesem Browser nicht verfügbar. Chrome, Edge und Safari bieten Spracheingabe an.",
      it: "Non disponibile in questo browser. Chrome, Edge e Safari offrono la dettatura vocale.",
    },
  Langue: { de: "Sprache", it: "Lingua" },
  "Langue de l’interface": {
    de: "Sprache der Oberfläche",
    it: "Lingua dell’interfaccia",
  },
  "Propre à ce poste. Les textes saisis (journal, messages, référentiels) restent tels qu’ils ont été écrits, quelle que soit la langue.":
    {
      de: "Gilt nur für diesen Arbeitsplatz. Erfasste Texte (Journal, Meldungen, Wertelisten) bleiben so, wie sie geschrieben wurden, unabhängig von der Sprache.",
      it: "Propria di questa postazione. I testi inseriti (diario, messaggi, elenchi di riferimento) restano come sono stati scritti, qualunque sia la lingua.",
    },
  Apparence: { de: "Darstellung", it: "Aspetto" },
  Mode: { de: "Modus", it: "Modalità" },
  Clair: { de: "Hell", it: "Chiaro" },
  Sombre: { de: "Dunkel", it: "Scuro" },
  "Comme le système (jour / nuit)": {
    de: "Wie das System (Tag / Nacht)",
    it: "Come il sistema (giorno / notte)",
  },
  Animations: { de: "Animationen", it: "Animazioni" },
  "Réduites (poste lent, sensibilité)": {
    de: "Reduziert (langsamer Rechner, Empfindlichkeit)",
    it: "Ridotte (postazione lenta, sensibilità)",
  },
  "Le bouton soleil / lune de la barre du haut passe du thème clair au thème sombre choisis ici. Chaque poste garde son propre thème.":
    {
      de: "Die Sonne-/Mond-Taste in der oberen Leiste wechselt zwischen dem hier gewählten hellen und dunklen Thema. Jeder Arbeitsplatz behält sein eigenes Thema.",
      it: "Il pulsante sole / luna della barra in alto passa dal tema chiaro al tema scuro scelti qui. Ogni postazione mantiene il proprio tema.",
    },
  "Impression automatique": {
    de: "Automatischer Druck",
    it: "Stampa automatica",
  },
  "Imprimer chaque nouvelle entrée du journal": {
    de: "Jeden neuen Journaleintrag drucken",
    it: "Stampa ogni nuova voce del diario",
  },
  "Dès qu’une entrée est consignée sur ce poste, sa fiche A4 part à l’impression.":
    {
      de: "Sobald auf diesem Arbeitsplatz ein Eintrag erfasst wird, wird sein A4-Blatt gedruckt.",
      it: "Non appena una voce è registrata su questa postazione, la sua scheda A4 viene stampata.",
    },
  "Imprimer aussi les entrées des autres postes": {
    de: "Auch Einträge anderer Arbeitsplätze drucken",
    it: "Stampa anche le voci delle altre postazioni",
  },
  "Pour un poste d’impression central : chaque entrée reçue par synchronisation est imprimée ici.":
    {
      de: "Für einen zentralen Druckarbeitsplatz: Jeder per Synchronisation empfangene Eintrag wird hier gedruckt.",
      it: "Per una postazione di stampa centrale: ogni voce ricevuta tramite sincronizzazione viene stampata qui.",
    },
  "Imprimer chaque nouveau message reçu": {
    de: "Jede neue eingegangene Meldung drucken",
    it: "Stampa ogni nuovo messaggio ricevuto",
  },
  "Formule de message A4 pour chaque message saisi dans Messages.": {
    de: "A4-Meldeformular für jede unter Meldungen erfasste Meldung.",
    it: "Modulo di messaggio A4 per ogni messaggio inserito in Messaggi.",
  },
  "Le navigateur affiche sa fenêtre d’impression à chaque fiche. Pour imprimer sans aucune fenêtre, lancer Chrome ou Edge avec l’option <0>--kiosk-printing</0> (voir l’aide).":
    {
      de: "Der Browser zeigt bei jedem Blatt sein Druckfenster. Um ganz ohne Fenster zu drucken, Chrome oder Edge mit der Option <0>--kiosk-printing</0> starten (siehe Hilfe).",
      it: "Il browser mostra la sua finestra di stampa a ogni scheda. Per stampare senza alcuna finestra, avviare Chrome o Edge con l’opzione <0>--kiosk-printing</0> (vedi l’aiuto).",
    },
  "Modules affichés": { de: "Angezeigte Module", it: "Moduli visualizzati" },
  "Masquez ce que vous n’utilisez pas. Les données restent intactes et les autres postes gardent leur propre choix.":
    {
      de: "Blenden Sie aus, was Sie nicht verwenden. Die Daten bleiben unverändert, und die anderen Arbeitsplätze behalten ihre eigene Auswahl.",
      it: "Nascondete ciò che non usate. I dati restano intatti e le altre postazioni mantengono la propria scelta.",
    },
  toujours: { de: "immer", it: "sempre" },
  "Valeurs proposées en un clic dans les formulaires. On peut toujours taper autre chose. Les référentiels font partie du journal : ils sont partagés avec les postes synchronisés et exportés dans l’archive.":
    {
      de: "Werte, die in den Formularen mit einem Klick vorgeschlagen werden. Man kann immer auch etwas anderes eingeben. Die Wertelisten gehören zum Journal: Sie werden mit den synchronisierten Arbeitsplätzen geteilt und im Archiv exportiert.",
      it: "Valori proposti con un clic nei moduli. Si può sempre digitare altro. Gli elenchi di riferimento fanno parte del diario: sono condivisi con le postazioni sincronizzate ed esportati nell’archivio.",
    },
  Référentiel: { de: "Werteliste", it: "Elenco di riferimento" },
  "Nouvelle valeur": { de: "Neuer Wert", it: "Nuovo valore" },
  "Ajouter une valeur": { de: "Wert hinzufügen", it: "Aggiungi un valore" },
  "Modifier {value}": { de: "{value} bearbeiten", it: "Modifica {value}" },
  "Retirer {value}": { de: "{value} entfernen", it: "Rimuovi {value}" },
  "Liste vide.": { de: "Leere Liste.", it: "Elenco vuoto." },
  "Valeurs standards rétablies.": {
    de: "Standardwerte wiederhergestellt.",
    it: "Valori standard ripristinati.",
  },
  "Rétablir les valeurs standards": {
    de: "Standardwerte wiederherstellen",
    it: "Ripristina i valori standard",
  },
  "Synchronisation activée.": {
    de: "Synchronisation aktiviert.",
    it: "Sincronizzazione attivata.",
  },
  "Plusieurs ordinateurs, tablettes ou téléphones travaillent sur la même session, en direct, sans compte ni base de données : chaque poste garde toute la session et les postes s’échangent les changements, chiffrés de bout en bout avec le code de session. Le serveur ne fait que relayer des messages illisibles et ne garde rien.":
    {
      de: "Mehrere Computer, Tablets oder Telefone arbeiten live an derselben Sitzung, ohne Konto und ohne Datenbank: Jeder Arbeitsplatz hat die ganze Sitzung, und die Arbeitsplätze tauschen die Änderungen aus, Ende-zu-Ende verschlüsselt mit dem Sitzungscode. Der Server leitet nur unlesbare Nachrichten weiter und speichert nichts.",
      it: "Più computer, tablet o telefoni lavorano sulla stessa sessione, in diretta, senza account né banca dati: ogni postazione conserva tutta la sessione e le postazioni si scambiano le modifiche, cifrate da un capo all’altro con il codice di sessione. Il server si limita a inoltrare messaggi illeggibili e non conserva nulla.",
    },
  "Cette page n’est pas en HTTPS : le chiffrement est indisponible. Ouvrez orion aic en https:// (ou via <0>npm run lan</0> sur le réseau local).":
    {
      de: "Diese Seite ist nicht in HTTPS: Die Verschlüsselung ist nicht verfügbar. Öffnen Sie orion aic mit https:// (oder über <0>npm run lan</0> im lokalen Netzwerk).",
      it: "Questa pagina non è in HTTPS: la cifratura non è disponibile. Aprite orion aic in https:// (o tramite <0>npm run lan</0> sulla rete locale).",
    },
  "Code de session": { de: "Sitzungscode", it: "Codice di sessione" },
  "Sur l’autre poste : ouvrir orion aic → <0>Rejoindre</0> → saisir ce code, ou scanner le QR code. Transmettez le code comme un mot de passe : il donne accès à toute la session.":
    {
      de: "Auf dem anderen Arbeitsplatz: orion aic öffnen → <0>Beitreten</0> → diesen Code eingeben oder den QR-Code scannen. Geben Sie den Code wie ein Passwort weiter: Er gewährt Zugang zur ganzen Sitzung.",
      it: "Sull’altra postazione: aprire orion aic → <0>Unisciti</0> → inserire questo codice, o scansionare il codice QR. Trasmettete il codice come una password: dà accesso a tutta la sessione.",
    },
  "Copier le lien": { de: "Link kopieren", it: "Copia il link" },
  "Synchronisation arrêtée sur ce poste.": {
    de: "Synchronisation auf diesem Arbeitsplatz gestoppt.",
    it: "Sincronizzazione interrotta su questa postazione.",
  },
  "Arrêter sur ce poste": {
    de: "Auf diesem Arbeitsplatz stoppen",
    it: "Interrompi su questa postazione",
  },
  Connecté: { de: "Verbunden", it: "Connesso" },
  "Version différente : rechargez la page": {
    de: "Andere Version: Laden Sie die Seite neu",
    it: "Versione diversa: ricaricate la pagina",
  },
  "Reconnexion…": { de: "Neu verbinden …", it: "Riconnessione…" },
  "Connexion…": { de: "Verbinden …", it: "Connessione…" },
  Arrêté: { de: "Gestoppt", it: "Interrotto" },
  "Autres postes": { de: "Andere Arbeitsplätze", it: "Altre postazioni" },
  "Dernier échange": { de: "Letzter Austausch", it: "Ultimo scambio" },
  "QR code pour rejoindre la session": {
    de: "QR-Code, um der Sitzung beizutreten",
    it: "Codice QR per unirsi alla sessione",
  },
  "Partager cette session": {
    de: "Diese Sitzung teilen",
    it: "Condividi questa sessione",
  },
  "Crée un code unique. Les postes qui le saisissent reçoivent toute la session et restent synchronisés.":
    {
      de: "Erstellt einen eindeutigen Code. Die Arbeitsplätze, die ihn eingeben, erhalten die ganze Sitzung und bleiben synchronisiert.",
      it: "Crea un codice unico. Le postazioni che lo inseriscono ricevono tutta la sessione e restano sincronizzate.",
    },
  "Créer un code de session": {
    de: "Sitzungscode erstellen",
    it: "Crea un codice di sessione",
  },
  "Rejoindre avec un code": {
    de: "Mit einem Code beitreten",
    it: "Unisciti con un codice",
  },
  "Fusionne cette session avec celle des postes qui utilisent ce code.": {
    de: "Führt diese Sitzung mit jener der Arbeitsplätze zusammen, die diesen Code verwenden.",
    it: "Unisce questa sessione a quella delle postazioni che usano questo codice.",
  },
  Rejoindre: { de: "Beitreten", it: "Unisciti" },
  "Fusions entre postes": {
    de: "Zusammenführungen zwischen Arbeitsplätzen",
    it: "Fusioni tra postazioni",
  },
  "{n} à voir": { de: "{n} zu prüfen", it: "{n} da vedere" },
  "Liaison entre PC": {
    de: "Verbindung zwischen KP",
    it: "Collegamento tra PC",
  },
  "Sans internet : réseau local (Wi-Fi ou câble)": {
    de: "Ohne Internet: lokales Netzwerk (WLAN oder Kabel)",
    it: "Senza internet: rete locale (Wi-Fi o cavo)",
  },
  "Sur un ordinateur du poste de conduite (le « poste serveur »), lancer <0>npm run lan</0> depuis le code source. Il affiche une adresse du type <1>https://192.168.1.20:4443</1>. Les autres postes du même Wi-Fi ou réseau ouvrent cette adresse, acceptent le certificat local une fois, puis utilisent le code de session comme ci-dessus. Tout reste dans le bâtiment.":
    {
      de: "Auf einem Computer des Kommandopostens (dem « Server-Arbeitsplatz ») <0>npm run lan</0> aus dem Quellcode starten. Es zeigt eine Adresse wie <1>https://192.168.1.20:4443</1>. Die anderen Arbeitsplätze im selben WLAN oder Netzwerk öffnen diese Adresse, akzeptieren einmal das lokale Zertifikat und verwenden dann den Sitzungscode wie oben. Alles bleibt im Gebäude.",
      it: "Su un computer del posto di comando (la « postazione server »), avviare <0>npm run lan</0> dal codice sorgente. Mostra un indirizzo del tipo <1>https://192.168.1.20:4443</1>. Le altre postazioni della stessa rete Wi-Fi o rete aprono questo indirizzo, accettano una volta il certificato locale, poi usano il codice di sessione come sopra. Tutto resta nell’edificio.",
    },
  Événement: { de: "Ereignis", it: "Evento" },
  "Lieu / secteur": { de: "Ort / Sektor", it: "Luogo / settore" },
  Référence: { de: "Referenz", it: "Riferimento" },
  Diffusion: { de: "Verteilung", it: "Diffusione" },
  "Indiquez le nom de l’événement.": {
    de: "Geben Sie den Namen des Ereignisses an.",
    it: "Indicate il nome dell’evento.",
  },
  "{field} : valeur refusée (trop longue ?).": {
    de: "{field}: Wert abgelehnt (zu lang?).",
    it: "{field}: valore rifiutato (troppo lungo?).",
  },
  "Ces propriétés ne peuvent pas être enregistrées.": {
    de: "Diese Eigenschaften können nicht gespeichert werden.",
    it: "Queste proprietà non possono essere salvate.",
  },
  "Journal modifié.": { de: "Journal geändert.", it: "Diario modificato." },
  "Journal · propriétés": {
    de: "Journal · Eigenschaften",
    it: "Diario · proprietà",
  },
  "Journal clôturé : rouvrez-le (ci-dessous) pour modifier ses propriétés.": {
    de: "Journal abgeschlossen: Öffnen Sie es wieder (unten), um seine Eigenschaften zu ändern.",
    it: "Diario chiuso: riapritelo (qui sotto) per modificarne le proprietà.",
  },
  "Lecture seule : vous consultez le passé. Revenez au direct pour modifier.": {
    de: "Nur lesen: Sie sehen die Vergangenheit. Kehren Sie zur Live-Ansicht zurück, um zu ändern.",
    it: "Sola lettura: state consultando il passato. Tornate alla diretta per modificare.",
  },
  // App.tsx
  "Une nouvelle version d’orion aic est en ligne : recharger la page pour ouvrir ce module ? Une session temporaire non exportée serait perdue.":
    {
      de: "Eine neue Version von orion aic ist online: Seite neu laden, um dieses Modul zu öffnen? Eine nicht exportierte temporäre Sitzung ginge verloren.",
      it: "Una nuova versione di orion aic è online: ricaricare la pagina per aprire questo modulo? Una sessione temporanea non esportata andrebbe persa.",
    },
  "Une entrée n’est pas encore consignée. Abandonner cette saisie ?": {
    de: "Ein Eintrag ist noch nicht erfasst. Diese Eingabe verwerfen?",
    it: "Una voce non è ancora registrata. Abbandonare questo inserimento?",
  },
  "Session rejointe. Tout est synchronisé en direct.": {
    de: "Sitzung beigetreten. Alles wird live synchronisiert.",
    it: "Sessione raggiunta. Tutto è sincronizzato in diretta.",
  },
  "Entrée {n} consignée. Impression lancée.": {
    de: "Eintrag {n} erfasst. Druck gestartet.",
    it: "Voce {n} registrata. Stampa avviata.",
  },
  "Entrée {n} consignée.": {
    de: "Eintrag {n} erfasst.",
    it: "Voce {n} registrata.",
  },
  Opérateur: { de: "Operateur", it: "Operatore" },
  "Entrées fusionnées.": {
    de: "Einträge zusammengeführt.",
    it: "Voci unite.",
  },
  "Journal importé.": { de: "Journal importiert.", it: "Diario importato." },
  "Session temporaire : son contenu sera retiré de la mémoire. Vérifiez vos exports. Fermer la session ?":
    {
      de: "Temporäre Sitzung: Ihr Inhalt wird aus dem Speicher entfernt. Prüfen Sie Ihre Exporte. Sitzung schliessen?",
      it: "Sessione temporanea: il suo contenuto sarà rimosso dalla memoria. Verificate le esportazioni. Chiudere la sessione?",
    },
  "Une session garde au moins un journal. Utilisez Session → Effacer la session.":
    {
      de: "Eine Sitzung behält mindestens ein Journal. Verwenden Sie Sitzung → Sitzung löschen.",
      it: "Una sessione conserva almeno un diario. Usate Sessione → Cancella la sessione.",
    },
  RETIRER: { de: "ENTFERNEN", it: "RIMUOVI" },
  "Retirer le journal « {title} » de la session (et des postes synchronisés) ? Exportez-le d’abord. Saisissez {word}.":
    {
      de: "Journal « {title} » aus der Sitzung (und von den synchronisierten Arbeitsplätzen) entfernen? Exportieren Sie es zuerst. Geben Sie {word} ein.",
      it: "Rimuovere il diario « {title} » dalla sessione (e dalle postazioni sincronizzate)? Esportatelo prima. Digitate {word}.",
    },
  "Journal conservé : saisissez {word} pour le retirer.": {
    de: "Journal behalten: Geben Sie {word} ein, um es zu entfernen.",
    it: "Diario conservato: digitate {word} per rimuoverlo.",
  },
  "Journal « {title} » retiré.": {
    de: "Journal « {title} » entfernt.",
    it: "Diario « {title} » rimosso.",
  },
  "Aller au contenu": { de: "Zum Inhalt", it: "Vai al contenuto" },
  "Nouvelle version d’orion aic disponible.": {
    de: "Neue Version von orion aic verfügbar.",
    it: "Nuova versione di orion aic disponibile.",
  },
  "Session temporaire : recharger efface son contenu. Exportez d’abord. Recharger ?":
    {
      de: "Temporäre Sitzung: Neu laden löscht ihren Inhalt. Exportieren Sie zuerst. Neu laden?",
      it: "Sessione temporanea: ricaricare ne cancella il contenuto. Esportate prima. Ricaricare?",
    },
  "Exporter une copie": { de: "Kopie exportieren", it: "Esporta una copia" },
  "Brouillon sauvegardé": { de: "Entwurf gespeichert", it: "Bozza salvata" },
  "Brouillon non sauvegardé": {
    de: "Entwurf nicht gespeichert",
    it: "Bozza non salvata",
  },
  "Clos par la quittance {n}": {
    de: "Durch Quittung {n} abgeschlossen",
    it: "Chiuso dalla quittanza {n}",
  },
  "Suivi terminé.": { de: "Pendenz erledigt.", it: "Seguito concluso." },
  "Plan A4": { de: "Plan A4", it: "Piano A4" },
  "hors ligne prêt": { de: "offline bereit", it: "pronto offline" },
  "en ligne": { de: "online", it: "online" },
  "hors ligne": { de: "offline", it: "offline" },
  "{issued}/{terminals} radios": {
    de: "{issued}/{terminals} Funkgeräte",
    it: "{issued}/{terminals} radio",
  },
  "Exportez d’abord une archive orion aic ou JSON de chaque journal ({n} restant).":
    {
      de: "Exportieren Sie zuerst ein orion-aic- oder JSON-Archiv jedes Journals ({n} verbleibend).",
      it: "Esportate prima un archivio orion aic o JSON di ogni diario ({n} rimanente).",
    },
  "Exportez d’abord une archive orion aic ou JSON de chaque journal ({n} restants).":
    {
      de: "Exportieren Sie zuerst ein orion-aic- oder JSON-Archiv jedes Journals ({n} verbleibend).",
      it: "Esportate prima un archivio orion aic o JSON di ogni diario ({n} rimanenti).",
    },
  TERMINER: { de: "BEENDEN", it: "TERMINA" },
  "Archives vérifiées ? Saisissez {word} pour effacer la session de ce poste.":
    {
      de: "Archive geprüft? Geben Sie {word} ein, um die Sitzung von diesem Arbeitsplatz zu löschen.",
      it: "Archivi verificati? Digitate {word} per cancellare la sessione da questa postazione.",
    },
  "Session effacée de ce poste.": {
    de: "Sitzung von diesem Arbeitsplatz gelöscht.",
    it: "Sessione cancellata da questa postazione.",
  },
  "Session conservée : saisissez {word} pour l’effacer.": {
    de: "Sitzung behalten: Geben Sie {word} ein, um sie zu löschen.",
    it: "Sessione conservata: digitate {word} per cancellarla.",
  },
  "Relève. {follow} suite(s) à donner, dont {late} en retard. {radios} radio(s) en service.":
    {
      de: "Ablösung. {follow} Pendenz(en), davon {late} überfällig. {radios} Funkgerät(e) in Betrieb.",
      it: "Avvicendamento. {follow} seguito/i da dare, di cui {late} in ritardo. {radios} radio in servizio.",
    },
} satisfies Dict);
