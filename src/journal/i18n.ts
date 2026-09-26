import { translator, type Dict } from "../../shared/i18n/core.ts";
import { common } from "../../shared/i18n/common.ts";

// Landing page, journal dialogs (entry form and detail, handover, import,
// session, report), journal exports and the local vault.
export const { t, tn, tIn, dict } = translator({
  ...common,
  // ---------- Landing ----------
  "version 2.0": { de: "Version 2.0", it: "versione 2.0" },
  "Sécurité et données": { de: "Sicherheit und Daten", it: "Sicurezza e dati" },
  "Thème sombre": { de: "Dunkles Design", it: "Tema scuro" },
  "Thème clair": { de: "Helles Design", it: "Tema chiaro" },
  "Tenir la conduite": {
    de: "Die Führung sicherstellen",
    it: "Mantenere la condotta",
  },
  "Le journal, les messages, la carte, les moyens, l’équipe et la radio d’un poste de conduite de protection civile, au même endroit. Tout reste dans le navigateur, chiffré et sans compte ; les postes d’un même PC se synchronisent en direct.":
    {
      de: "Journal, Meldungen, Karte, Mittel, Team und Funk einer Führungsstelle des Zivilschutzes an einem Ort. Alles bleibt im Browser, verschlüsselt und ohne Konto; die Arbeitsplätze desselben KP synchronisieren sich live.",
      it: "Il diario, i messaggi, la carta, i mezzi, la squadra e la radio di un posto di condotta della protezione civile, in un unico luogo. Tutto resta nel browser, cifrato e senza account; le postazioni di uno stesso PC si sincronizzano in tempo reale.",
    },
  "Main courante horodatée, suivis, retards, relèves.": {
    de: "Einsatzjournal mit Zeitstempel, Pendenzen, Verspätungen, Ablösungen.",
    it: "Registro cronologico con orario, seguiti, ritardi, avvicendamenti.",
  },
  "Formule de message, tri, synthèse et impression A4.": {
    de: "Meldeformular, Triage, Zusammenfassung und A4-Druck.",
    it: "Modulo di messaggio, smistamento, sintesi e stampa A4.",
  },
  "Fonds swisstopo, signes OFPP, zones, périmètres, mesures.": {
    de: "swisstopo-Karten, BABS-Signaturen, Zonen, Perimeter, Messungen.",
    it: "Sfondi swisstopo, simboli UFPP, zone, perimetri, misurazioni.",
  },
  "Moyens et équipe": { de: "Mittel und Team", it: "Mezzi e squadra" },
  "Engagements, états, présences et fonctions.": {
    de: "Einsätze, Status, Präsenzen und Funktionen.",
    it: "Impieghi, stati, presenze e funzioni.",
  },
  "Plan de réseau Polycom et contrôles de liaison.": {
    de: "Polycom-Netzplan und Verbindungskontrollen.",
    it: "Piano di rete Polycom e controlli dei collegamenti.",
  },
  Renseignements: { de: "Informationen", it: "Informazioni" },
  "Chiffres clés, météo, agenda et rythme de conduite.": {
    de: "Kennzahlen, Wetter, Agenda und Führungsrhythmus.",
    it: "Cifre chiave, meteo, agenda e ritmo di condotta.",
  },
  Liens: { de: "Verknüpfungen", it: "Collegamenti" },
  "Chaque élément se relie aux autres, dans les deux sens.": {
    de: "Jedes Element ist mit den anderen verknüpft, in beide Richtungen.",
    it: "Ogni elemento si collega agli altri, nei due sensi.",
  },
  "Multi-postes": { de: "Mehrere Arbeitsplätze", it: "Multipostazione" },
  "Synchronisation chiffrée entre les postes du PC.": {
    de: "Verschlüsselte Synchronisation zwischen den Arbeitsplätzen des KP.",
    it: "Sincronizzazione cifrata tra le postazioni del PC.",
  },
  "Ouvrir l’exercice de démonstration": {
    de: "Demo-Übung öffnen",
    it: "Apri l’esercizio dimostrativo",
  },
  Reprendre: { de: "Fortsetzen", it: "Riprendi" },
  "Nouvelle session": { de: "Neue Sitzung", it: "Nuova sessione" },
  Rejoindre: { de: "Beitreten", it: "Unisciti" },
  "Une session chiffrée est enregistrée sur ce poste.": {
    de: "Auf diesem Arbeitsplatz ist eine verschlüsselte Sitzung gespeichert.",
    it: "Su questa postazione è salvata una sessione cifrata.",
  },
  "Phrase de récupération": {
    de: "Wiederherstellungssatz",
    it: "Frase di recupero",
  },
  "Déchiffrement…": { de: "Wird entschlüsselt …", it: "Decifratura…" },
  Déverrouiller: { de: "Entsperren", it: "Sblocca" },
  "Phrase perdue": { de: "Satz verloren", it: "Frase persa" },
  "Irrécupérable. Reprenez depuis une archive, ou effacez l’espace local de ce navigateur.":
    {
      de: "Nicht wiederherstellbar. Fahren Sie mit einem Archiv fort oder löschen Sie den lokalen Speicher dieses Browsers.",
      it: "Non recuperabile. Riprendere da un archivio o cancellare lo spazio locale di questo browser.",
    },
  "Effacement définitif de l’espace chiffré de ce navigateur. Saisissez {word}.":
    {
      de: "Endgültiges Löschen des verschlüsselten Speichers dieses Browsers. Geben Sie {word} ein.",
      it: "Cancellazione definitiva dello spazio cifrato di questo browser. Digitare {word}.",
    },
  EFFACER: { de: "LÖSCHEN", it: "CANCELLA" },
  "Effacer l’espace local": {
    de: "Lokalen Speicher löschen",
    it: "Cancella lo spazio locale",
  },
  "Réception de la session…": {
    de: "Sitzung wird empfangen …",
    it: "Ricezione della sessione…",
  },
  "En attente d’un autre poste": {
    de: "Warten auf einen anderen Arbeitsplatz",
    it: "In attesa di un’altra postazione",
  },
  "Connexion…": { de: "Verbindung wird hergestellt …", it: "Connessione…" },
  "Code <0>{code}</0>.": {
    de: "Code <0>{code}</0>.",
    it: "Codice <0>{code}</0>.",
  },
  "Aucun poste n’a encore ouvert cette session : vérifiez le code, ou activez la synchronisation sur le poste qui a la session.":
    {
      de: "Noch kein Arbeitsplatz hat diese Sitzung geöffnet: Prüfen Sie den Code oder aktivieren Sie die Synchronisation auf dem Arbeitsplatz, der die Sitzung hat.",
      it: "Nessuna postazione ha ancora aperto questa sessione: verificare il codice o attivare la sincronizzazione sulla postazione che ha la sessione.",
    },
  "La session arrive dès qu’un poste qui l’a est en ligne.": {
    de: "Die Sitzung trifft ein, sobald ein Arbeitsplatz, der sie hat, online ist.",
    it: "La sessione arriva non appena una postazione che la possiede è in linea.",
  },
  "Les phrases de récupération ne correspondent pas.": {
    de: "Die Wiederherstellungssätze stimmen nicht überein.",
    it: "Le frasi di recupero non corrispondono.",
  },
  "Un autre poste a partagé sa session (Réglages → Synchronisation). Saisissez son code ou scannez son QR code.":
    {
      de: "Ein anderer Arbeitsplatz hat seine Sitzung geteilt (Einstellungen → Synchronisation). Geben Sie deren Code ein oder scannen Sie den QR-Code.",
      it: "Un’altra postazione ha condiviso la sua sessione (Impostazioni → Sincronizzazione). Inserire il suo codice o scansionare il codice QR.",
    },
  "Code de session": { de: "Sitzungscode", it: "Codice di sessione" },
  "Votre nom ou fonction": {
    de: "Ihr Name oder Ihre Funktion",
    it: "Nome o funzione",
  },
  "ex. Sgt Muller, opérateur journal": {
    de: "z. B. Wm Müller, Operateur Journal",
    it: "es. sgt Muller, operatore diario",
  },
  "Sauvegarde chiffrée sur ce poste": {
    de: "Verschlüsselte Sicherung auf diesem Arbeitsplatz",
    it: "Salvataggio cifrato su questa postazione",
  },
  Répéter: { de: "Wiederholen", it: "Ripeti" },
  "Une session est déjà enregistrée sur ce poste : celle-ci restera temporaire (exportez régulièrement).":
    {
      de: "Auf diesem Arbeitsplatz ist bereits eine Sitzung gespeichert: Diese hier bleibt temporär (exportieren Sie regelmässig).",
      it: "Su questa postazione è già salvata una sessione: questa resterà temporanea (esportare regolarmente).",
    },
  "Rejoindre la session": {
    de: "Sitzung beitreten",
    it: "Unisciti alla sessione",
  },
  "Fichier .orionaic, .orion, .json ou .csv": {
    de: "Datei .orionaic, .orion, .json oder .csv",
    it: "File .orionaic, .orion, .json o .csv",
  },
  "Logiciel indépendant. Sans affiliation ni homologation OFPP ou État de Genève.":
    {
      de: "Unabhängige Software. Weder mit dem BABS noch mit dem Kanton Genf verbunden oder von ihnen zugelassen.",
      it: "Software indipendente. Senza affiliazione né omologazione UFPP o dello Stato di Ginevra.",
    },
  "Une idée, un besoin ? {email}": {
    de: "Eine Idee, ein Bedürfnis? {email}",
    it: "Un’idea, un’esigenza? {email}",
  },
  "Code source · AGPL-3.0": {
    de: "Quellcode · AGPL-3.0",
    it: "Codice sorgente · AGPL-3.0",
  },
  // ---------- New journal ----------
  Événement: { de: "Ereignis", it: "Evento" },
  "Crue de l’Arve · secteur Carouge": {
    de: "Hochwasser der Arve · Sektor Carouge",
    it: "Piena dell’Arve · settore Carouge",
  },
  Opérateur: { de: "Operateur", it: "Operatore" },
  "Nom ou fonction": { de: "Name oder Funktion", it: "Nome o funzione" },
  Mode: { de: "Modus", it: "Modalità" },
  "Organisation, lieu, référence": {
    de: "Organisation, Ort, Referenz",
    it: "Organizzazione, luogo, riferimento",
  },
  "OPC / ORPC, compagnie": { de: "ZSO, Kompanie", it: "OPC, compagnia" },
  "Lieu / secteur": { de: "Ort / Sektor", it: "Luogo / settore" },
  Référence: { de: "Referenz", it: "Riferimento" },
  Diffusion: { de: "Verteilung", it: "Diffusione" },
  "12 caractères minimum": {
    de: "Mindestens 12 Zeichen",
    it: "Minimo 12 caratteri",
  },
  "Répéter la phrase": { de: "Satz wiederholen", it: "Ripeti la frase" },
  "Demandée après fermeture ou crash. Irrécupérable.": {
    de: "Wird nach dem Schliessen oder einem Absturz verlangt. Nicht wiederherstellbar.",
    it: "Richiesta dopo la chiusura o un crash. Non recuperabile.",
  },
  "Temporaire : perdu à la fermeture de l’onglet. Exportez régulièrement.": {
    de: "Temporär: geht beim Schliessen des Tabs verloren. Exportieren Sie regelmässig.",
    it: "Temporaneo: perso alla chiusura della scheda. Esportare regolarmente.",
  },
  "Engagement réel : poste et installation autorisés par votre organisation uniquement.":
    {
      de: "Echter Einsatz: nur auf Arbeitsplätzen und Installationen, die Ihre Organisation zugelassen hat.",
      it: "Intervento reale: solo postazioni e installazioni autorizzate dalla vostra organizzazione.",
    },
  "Chiffrement…": { de: "Wird verschlüsselt …", it: "Cifratura…" },
  "Ouvrir le journal": { de: "Journal öffnen", it: "Apri il diario" },
  // ---------- Security and data ----------
  "Session temporaire": { de: "Temporäre Sitzung", it: "Sessione temporanea" },
  "Mémoire de l’onglet uniquement. Perdue à la fermeture.": {
    de: "Nur im Speicher des Tabs. Geht beim Schliessen verloren.",
    it: "Solo nella memoria della scheda. Persa alla chiusura.",
  },
  "Sauvegarde locale": { de: "Lokale Sicherung", it: "Salvataggio locale" },
  "IndexedDB de ce navigateur, chiffrée. Phrase et clé jamais enregistrées.": {
    de: "IndexedDB dieses Browsers, verschlüsselt. Satz und Schlüssel werden nie gespeichert.",
    it: "IndexedDB di questo browser, cifrato. Frase e chiave mai salvate.",
  },
  "Archive .orionaic": { de: "Archiv .orionaic", it: "Archivio .orionaic" },
  "AES-256-GCM · PBKDF2-SHA-256, 600 000 itérations.": {
    de: "AES-256-GCM · PBKDF2-SHA-256, 600’000 Iterationen.",
    it: "AES-256-GCM · PBKDF2-SHA-256, 600’000 iterazioni.",
  },
  "Autres formats": { de: "Andere Formate", it: "Altri formati" },
  "En clair : PDF, Excel, Word, CSV, JSON, HTML, texte.": {
    de: "Unverschlüsselt: PDF, Excel, Word, CSV, JSON, HTML, Text.",
    it: "In chiaro: PDF, Excel, Word, CSV, JSON, HTML, testo.",
  },
  Synchronisation: { de: "Synchronisation", it: "Sincronizzazione" },
  "Facultative. Chiffrée de bout en bout avec le code de session ; le relais ne voit que des messages illisibles et ne garde rien.":
    {
      de: "Optional. Ende-zu-Ende-verschlüsselt mit dem Sitzungscode; das Relais sieht nur unlesbare Nachrichten und speichert nichts.",
      it: "Facoltativa. Cifrata end-to-end con il codice di sessione; il relè vede solo messaggi illeggibili e non conserva nulla.",
    },
  "Services externes": { de: "Externe Dienste", it: "Servizi esterni" },
  "Sur demande uniquement : tuiles swisstopo / OpenStreetMap, recherche de lieu geo.admin.ch, prévisions Open-Meteo (coordonnées seulement). Ni IA, ni statistiques, ni police distante.":
    {
      de: "Nur auf Anfrage: Kacheln swisstopo / OpenStreetMap, Ortssuche geo.admin.ch, Prognosen Open-Meteo (nur Koordinaten). Keine KI, keine Statistiken, keine externen Schriften.",
      it: "Solo su richiesta: tessere swisstopo / OpenStreetMap, ricerca di luoghi geo.admin.ch, previsioni Open-Meteo (solo coordinate). Né IA, né statistiche, né caratteri remoti.",
    },
  Hébergeur: { de: "Hosting-Anbieter", it: "Provider di hosting" },
  "Voit les requêtes de chargement (adresse IP).": {
    de: "Sieht die Ladeanfragen (IP-Adresse).",
    it: "Vede le richieste di caricamento (indirizzo IP).",
  },
  Identité: { de: "Identität", it: "Identità" },
  "Noms d’opérateur déclaratifs. Historique non signé.": {
    de: "Operateurnamen nur deklarativ. Verlauf nicht signiert.",
    it: "Nomi degli operatori dichiarativi. Cronologia non firmata.",
  },
  Limites: { de: "Grenzen", it: "Limiti" },
  "Un poste compromis ou une session déverrouillée expose les données.": {
    de: "Ein kompromittierter Arbeitsplatz oder eine entsperrte Sitzung legt die Daten offen.",
    it: "Una postazione compromessa o una sessione sbloccata espone i dati.",
  },
  "Effacer les données du navigateur efface la sauvegarde locale.": {
    de: "Das Löschen der Browserdaten löscht die lokale Sicherung.",
    it: "Cancellare i dati del browser cancella il salvataggio locale.",
  },
  "Le code de session donne accès à toute la session : le transmettre comme un mot de passe.":
    {
      de: "Der Sitzungscode gibt Zugriff auf die ganze Sitzung: wie ein Passwort weitergeben.",
      it: "Il codice di sessione dà accesso all’intera sessione: trasmetterlo come una password.",
    },
  "Conservation, destinataires et autorisation de traiter des données réelles : responsabilité de l’organisation.":
    {
      de: "Aufbewahrung, Empfänger und Bewilligung zur Bearbeitung echter Daten: Verantwortung der Organisation.",
      it: "Conservazione, destinatari e autorizzazione a trattare dati reali: responsabilità dell’organizzazione.",
    },
  "Logiciel indépendant, sans homologation OFPP ni État de Genève. Les numéros de groupes et RFSI viennent du plan de flotte cantonal.":
    {
      de: "Unabhängige Software, ohne Zulassung durch das BABS oder den Kanton Genf. Die Gruppennummern und RFSI stammen aus dem kantonalen Flottenplan.",
      it: "Software indipendente, senza omologazione UFPP né dello Stato di Ginevra. I numeri dei gruppi e RFSI provengono dal piano di flotta cantonale.",
    },
  "Documents OFPP": { de: "BABS-Dokumente", it: "Documenti UFPP" },
  // ---------- Entry form ----------
  "Vérifiez le message et les heures de l’entrée.": {
    de: "Prüfen Sie die Meldung und die Zeiten des Eintrags.",
    it: "Verificare il messaggio e gli orari della voce.",
  },
  "Modification par l’opérateur": {
    de: "Änderung durch den Operateur",
    it: "Modifica da parte dell’operatore",
  },
  "Nouvelle entrée": { de: "Neuer Eintrag", it: "Nuova voce" },
  Modèles: { de: "Vorlagen", it: "Modelli" },
  "Remplacer le message en cours ?": {
    de: "Aktuelle Meldung ersetzen?",
    it: "Sostituire il messaggio in corso?",
  },
  Nature: { de: "Art", it: "Tipo" },
  "Texte du message": { de: "Text der Meldung", it: "Testo del messaggio" },
  "Dicter le message": { de: "Meldung diktieren", it: "Detta il messaggio" },
  "Heure de l’événement": { de: "Zeit des Ereignisses", it: "Ora dell’evento" },
  "Nom d’appel, équipe": { de: "Rufname, Team", it: "Nominativo, squadra" },
  "Transmission et lieu": {
    de: "Übermittlung und Ort",
    it: "Trasmissione e luogo",
  },
  Canal: { de: "Kanal", it: "Canale" },
  Confirmation: { de: "Bestätigung", it: "Conferma" },
  "Heure de réception": { de: "Empfangszeit", it: "Ora di ricezione" },
  "Heures saisies dans le fuseau de ce poste.": {
    de: "Zeiten in der Zeitzone dieses Arbeitsplatzes erfasst.",
    it: "Orari inseriti nel fuso orario di questa postazione.",
  },
  "Conduite et suivi": {
    de: "Führung und Nachverfolgung",
    it: "Condotta e seguito",
  },
  "Mesure / décision / mission": {
    de: "Massnahme / Entscheid / Auftrag",
    it: "Misura / decisione / missione",
  },
  Suivi: { de: "Nachverfolgung", it: "Seguito" },
  "Moyens engagés / besoins": {
    de: "Eingesetzte Mittel / Bedarf",
    it: "Mezzi impiegati / bisogni",
  },
  Compléments: { de: "Ergänzungen", it: "Complementi" },
  "Référence / entrée liée": {
    de: "Referenz / verknüpfter Eintrag",
    it: "Riferimento / voce collegata",
  },
  "#012, n° de document": {
    de: "#012, Dokument-Nr.",
    it: "#012, n. di documento",
  },
  Observations: { de: "Bemerkungen", it: "Osservazioni" },
  "Entrée pour ajouter": {
    de: "Eingabetaste zum Hinzufügen",
    it: "Invio per aggiungere",
  },
  "Ajouter le mot-clé": {
    de: "Stichwort hinzufügen",
    it: "Aggiungi la parola chiave",
  },
  Retirer: { de: "Entfernen", it: "Rimuovi" },
  "Motif de la modification": {
    de: "Grund der Änderung",
    it: "Motivo della modifica",
  },
  "Confirmation reçue, erreur de lieu": {
    de: "Bestätigung erhalten, falscher Ort",
    it: "Conferma ricevuta, errore di luogo",
  },
  "Par <0>{author}</0>": {
    de: "Von <0>{author}</0>",
    it: "Da <0>{author}</0>",
  },
  "Enregistrer la modification": {
    de: "Änderung speichern",
    it: "Salva la modifica",
  },
  Consigner: { de: "Erfassen", it: "Registra" },
  // ---------- Entry detail ----------
  "Abandonner cette modification non enregistrée ?": {
    de: "Diese nicht gespeicherte Änderung verwerfen?",
    it: "Abbandonare questa modifica non salvata?",
  },
  "Fiche A4": { de: "A4-Blatt", it: "Scheda A4" },
  "Consigner une suite": {
    de: "Folgeeintrag erfassen",
    it: "Registra un seguito",
  },
  "Suivi marqué terminé par l’opérateur": {
    de: "Nachverfolgung vom Operateur als erledigt markiert",
    it: "Seguito segnato come concluso dall’operatore",
  },
  "Terminer le suivi": {
    de: "Nachverfolgung abschliessen",
    it: "Concludi il seguito",
  },
  "Reporter l’échéance de 15 minutes": {
    de: "Frist um 15 Minuten verschieben",
    it: "Rinvia la scadenza di 15 minuti",
  },
  "Échéance +15 min": { de: "Frist +15 Min.", it: "Scadenza +15 min" },
  "Échéance dans 15 min": { de: "Frist in 15 Min.", it: "Scadenza tra 15 min" },
  "{n} version": { de: "{n} Version", it: "{n} versione" },
  "{n} versions": { de: "{n} Versionen", it: "{n} versioni" },
  "Supprimer définitivement {n} ? Son contenu et son historique sont effacés ; restent au journal le numéro, l’auteur, l’heure et le motif de la suppression. Pour une information erronée, préférez « Modifier » ou le suivi « Annulé ».":
    {
      de: "{n} endgültig löschen? Inhalt und Verlauf werden gelöscht; im Journal bleiben Nummer, Autor, Zeit und Grund der Löschung. Bei einer falschen Information besser « Bearbeiten » oder die Nachverfolgung « Annulliert » verwenden.",
      it: "Eliminare definitivamente {n}? Il contenuto e la cronologia vengono cancellati; nel diario restano il numero, l’autore, l’ora e il motivo dell’eliminazione. Per un’informazione errata, preferire « Modifica » o il seguito « Annullato ».",
    },
  "Motif de la suppression": {
    de: "Grund der Löschung",
    it: "Motivo dell’eliminazione",
  },
  "Saisie en double, mauvais journal": {
    de: "Doppelt erfasst, falsches Journal",
    it: "Inserimento doppio, diario sbagliato",
  },
  "Supprimer {n}": { de: "{n} löschen", it: "Elimina {n}" },
  "Fil · {n} entrées liées": {
    de: "Verlauf · {n} verknüpfte Einträge",
    it: "Filo · {n} voci collegate",
  },
  "Versions · auteurs déclarés, non signés": {
    de: "Versionen · deklarierte Autoren, nicht signiert",
    it: "Versioni · autori dichiarati, non firmati",
  },
  "Version {n}": { de: "Version {n}", it: "Versione {n}" },
  Réception: { de: "Empfang", it: "Ricezione" },
  "Mesure / décision": {
    de: "Massnahme / Entscheid",
    it: "Misura / decisione",
  },
  "Moyens / besoins": { de: "Mittel / Bedarf", it: "Mezzi / bisogni" },
  // ---------- Journal row, alerts ----------
  "Sélectionner l’entrée {n}": {
    de: "Eintrag {n} auswählen",
    it: "Seleziona la voce {n}",
  },
  "Retard · {date}": { de: "Verspätet · {date}", it: "In ritardo · {date}" },
  "Éch. {date}": { de: "Frist {date}", it: "Scad. {date}" },
  "Modifier l’entrée {n}": {
    de: "Eintrag {n} bearbeiten",
    it: "Modifica la voce {n}",
  },
  "Supprimer l’entrée {n}": {
    de: "Eintrag {n} löschen",
    it: "Elimina la voce {n}",
  },
  "dépassée de {d}": { de: "überfällig seit {d}", it: "scaduta da {d}" },
  "dans {d}": { de: "in {d}", it: "tra {d}" },
  "Signal sonore quand une échéance est dépassée": {
    de: "Tonsignal, wenn eine Frist überschritten ist",
    it: "Segnale acustico quando una scadenza è superata",
  },
  "Alarme échéances active": {
    de: "Fristenalarm aktiv",
    it: "Allarme scadenze attivo",
  },
  "Alarme échéances muette": {
    de: "Fristenalarm stumm",
    it: "Allarme scadenze muto",
  },
  Échéances: { de: "Fristen", it: "Scadenze" },
  "{n} échéance dépassée": {
    de: "{n} Frist überschritten",
    it: "{n} scadenza superata",
  },
  "{n} échéances dépassées": {
    de: "{n} Fristen überschritten",
    it: "{n} scadenze superate",
  },
  "Échéances proches": { de: "Nahe Fristen", it: "Scadenze vicine" },
  "{n} dans moins de 15 min": {
    de: "{n} in weniger als 15 Min.",
    it: "{n} tra meno di 15 min",
  },
  "Couper l’alarme": { de: "Alarm ausschalten", it: "Disattiva l’allarme" },
  "Activer l’alarme sonore": {
    de: "Tonalarm einschalten",
    it: "Attiva l’allarme sonoro",
  },
  "Terminé (action)": { fr: "Terminé", de: "Erledigt", it: "Concluso" },
  "+ {n} autre · filtre « À suivre »": {
    de: "+ {n} weiterer · Filter « Pendent »",
    it: "+ {n} altro · filtro « Da seguire »",
  },
  "+ {n} autres · filtre « À suivre »": {
    de: "+ {n} weitere · Filter « Pendent »",
    it: "+ altri {n} · filtro « Da seguire »",
  },
  // ---------- Handover ----------
  "Suites à donner": { de: "Pendenzen", it: "Seguiti da dare" },
  "Échéances dépassées": {
    de: "Überschrittene Fristen",
    it: "Scadenze superate",
  },
  "À confirmer": { de: "Zu bestätigen", it: "Da confermare" },
  "Radios en service": { de: "Funkgeräte im Einsatz", it: "Radio in servizio" },
  "Que s’est-il passé depuis…": {
    de: "Was ist passiert seit …",
    it: "Cos’è successo da…",
  },
  Depuis: { de: "Seit", it: "Da" },
  "… et {n} autre(s)": { de: "… und {n} weitere", it: "… e altri {n}" },
  "Résumé de relève": {
    de: "Zusammenfassung der Ablösung",
    it: "Riepilogo dell’avvicendamento",
  },
  "Établi par {author}": {
    de: "Erstellt von {author}",
    it: "Redatto da {author}",
  },
  "resume-de-releve": {
    de: "zusammenfassung-abloesung",
    it: "riepilogo-avvicendamento",
  },
  "Imprimer le résumé": {
    de: "Zusammenfassung drucken",
    it: "Stampa il riepilogo",
  },
  "Résumé copié.": { de: "Zusammenfassung kopiert.", it: "Riepilogo copiato." },
  "Copie impossible dans ce navigateur.": {
    de: "Kopieren in diesem Browser nicht möglich.",
    it: "Copia impossibile in questo browser.",
  },
  "Points ouverts": { de: "Offene Punkte", it: "Punti aperti" },
  "Message · mesure": { de: "Meldung · Massnahme", it: "Messaggio · misura" },
  "Aucun.": { de: "Keine.", it: "Nessuno." },
  "Terminaux remis": {
    de: "Abgegebene Endgeräte",
    it: "Terminali consegnati",
  },
  Terminal: { de: "Endgerät", it: "Terminale" },
  Détenteur: { de: "Inhaber", it: "Detentore" },
  "Nom d’appel": { de: "Rufname", it: "Nominativo" },
  Remis: { de: "Abgegeben", it: "Consegnato" },
  "Autre poste : archive .orionaic, phrase transmise par un canal séparé.": {
    de: "Anderer Arbeitsplatz: Archiv .orionaic, Satz über einen separaten Kanal übermittelt.",
    it: "Altra postazione: archivio .orionaic, frase trasmessa tramite un canale separato.",
  },
  "Consigner la relève": {
    de: "Ablösung erfassen",
    it: "Registra l’avvicendamento",
  },
  "Consigner avec le résumé": {
    de: "Mit Zusammenfassung erfassen",
    it: "Registra con il riepilogo",
  },
  // ---------- Report ----------
  "Rapport de situation": {
    de: "Lagebericht",
    it: "Rapporto sulla situazione",
  },
  "La fin doit suivre le début.": {
    de: "Das Ende muss nach dem Beginn liegen.",
    it: "La fine deve seguire l’inizio.",
  },
  Période: { de: "Zeitraum", it: "Periodo" },
  Tout: { de: "Alles", it: "Tutto" },
  "Ajouter la chronologie complète de la période": {
    de: "Vollständige Chronologie des Zeitraums hinzufügen",
    it: "Aggiungi la cronologia completa del periodo",
  },
  "Synthèse, faits marquants, décisions et missions, demandes, points ouverts, moyens engagés, état radio.":
    {
      de: "Zusammenfassung, wichtige Ereignisse, Entscheide und Aufträge, Anfragen, offene Punkte, eingesetzte Mittel, Funkstatus.",
      it: "Sintesi, fatti salienti, decisioni e missioni, richieste, punti aperti, mezzi impiegati, stato radio.",
    },
  "Aperçu A4": { de: "A4-Vorschau", it: "Anteprima A4" },
  // ---------- Session ----------
  "Opérateur modifié. Les saisies existantes gardent leur auteur.": {
    de: "Operateur geändert. Bestehende Erfassungen behalten ihren Autor.",
    it: "Operatore modificato. Gli inserimenti esistenti mantengono il loro autore.",
  },
  Appliquer: { de: "Übernehmen", it: "Applica" },
  "Déclaratif, sans authentification.": {
    de: "Deklarativ, ohne Authentifizierung.",
    it: "Dichiarativo, senza autenticazione.",
  },
  "Active · chiffrée sur ce poste.": {
    de: "Aktiv · verschlüsselt auf diesem Arbeitsplatz.",
    it: "Attivo · cifrato su questa postazione.",
  },
  "Ne remplace pas une archive : le nettoyage du navigateur l’efface.": {
    de: "Ersetzt kein Archiv: Das Bereinigen des Browsers löscht sie.",
    it: "Non sostituisce un archivio: la pulizia del browser lo cancella.",
  },
  Verrouiller: { de: "Sperren", it: "Blocca" },
  "Un espace chiffré existe déjà sur ce poste. Exportez cette session, déverrouillez l’espace existant, puis importez.":
    {
      de: "Auf diesem Arbeitsplatz besteht bereits ein verschlüsselter Speicher. Exportieren Sie diese Sitzung, entsperren Sie den bestehenden Speicher und importieren Sie dann.",
      it: "Su questa postazione esiste già uno spazio cifrato. Esportare questa sessione, sbloccare lo spazio esistente, poi importare.",
    },
  "Les phrases secrètes ne correspondent pas.": {
    de: "Die Geheimsätze stimmen nicht überein.",
    it: "Le frasi segrete non corrispondono.",
  },
  "Reprise après crash activée.": {
    de: "Wiederherstellung nach Absturz aktiviert.",
    it: "Ripresa dopo crash attivata.",
  },
  "Session temporaire. Activez uniquement sur un poste autorisé.": {
    de: "Temporäre Sitzung. Nur auf einem zugelassenen Arbeitsplatz aktivieren.",
    it: "Sessione temporanea. Attivare solo su una postazione autorizzata.",
  },
  "Phrase de récupération · 12 caractères min.": {
    de: "Wiederherstellungssatz · mind. 12 Zeichen",
    it: "Frase di recupero · min. 12 caratteri",
  },
  "Irrécupérable. À conserver séparément des archives.": {
    de: "Nicht wiederherstellbar. Getrennt von den Archiven aufbewahren.",
    it: "Non recuperabile. Da conservare separatamente dagli archivi.",
  },
  Activer: { de: "Aktivieren", it: "Attiva" },
  "Clôture · {title}": { de: "Abschluss · {title}", it: "Chiusura · {title}" },
  "Clôturé le {date}.": {
    de: "Abgeschlossen am {date}.",
    it: "Chiuso il {date}.",
  },
  "Bloque saisies, corrections et plan radio. Lecture et export restent possibles.":
    {
      de: "Sperrt Erfassungen, Korrekturen und Funkplan. Lesen und Export bleiben möglich.",
      it: "Blocca inserimenti, correzioni e piano radio. Lettura ed esportazione restano possibili.",
    },
  "Rouvrir ce journal et autoriser de nouvelles saisies ?": {
    de: "Dieses Journal wieder öffnen und neue Erfassungen erlauben?",
    it: "Riaprire questo diario e autorizzare nuovi inserimenti?",
  },
  "Clôturer ce journal ? Vous pourrez le rouvrir depuis cet écran.": {
    de: "Dieses Journal abschliessen? Sie können es in dieser Ansicht wieder öffnen.",
    it: "Chiudere questo diario? Potrà essere riaperto da questa schermata.",
  },
  "Rouvrir le journal": { de: "Journal wieder öffnen", it: "Riapri il diario" },
  "Clôturer le journal": { de: "Journal abschliessen", it: "Chiudi il diario" },
  "Libérer le poste": {
    de: "Arbeitsplatz freigeben",
    it: "Libera la postazione",
  },
  "Efface la session et sa sauvegarde locale. Les fichiers exportés ne sont pas touchés.":
    {
      de: "Löscht die Sitzung und ihre lokale Sicherung. Exportierte Dateien bleiben unberührt.",
      it: "Cancella la sessione e il suo salvataggio locale. I file esportati non vengono toccati.",
    },
  "Effacer la session": { de: "Sitzung löschen", it: "Cancella la sessione" },
  // ---------- Import ----------
  "Ce fichier dépasse 32 Mo.": {
    de: "Diese Datei ist grösser als 32 MB.",
    it: "Questo file supera 32 MB.",
  },
  "CSV : entrées recréées sans leurs versions antérieures.": {
    de: "CSV: Einträge ohne ihre früheren Versionen neu erstellt.",
    it: "CSV: voci ricreate senza le versioni precedenti.",
  },
  "Ce fichier contient les tableaux d’un export (JSON données), pas une archive. Importez l’archive orion aic (.orionaic) ou l’archive JSON réimportable.":
    {
      de: "Diese Datei enthält die Tabellen eines Exports (JSON-Daten), kein Archiv. Importieren Sie das orion-aic-Archiv (.orionaic) oder das wieder importierbare JSON-Archiv.",
      it: "Questo file contiene le tabelle di un’esportazione (JSON dati), non un archivio. Importare l’archivio orion aic (.orionaic) o l’archivio JSON reimportabile.",
    },
  "Ce fichier n’est pas un fichier JSON / orion aic valide.": {
    de: "Diese Datei ist keine gültige JSON- / orion-aic-Datei.",
    it: "Questo file non è un file JSON / orion aic valido.",
  },
  "Une archive orion aic (.orionaic ou JSON réimportable) contient toute l’opération et son historique. Importée dans un journal séparé, elle permet à chacun de la rejouer pas à pas avec la machine à remonter le temps.":
    {
      de: "Ein orion-aic-Archiv (.orionaic oder wieder importierbares JSON) enthält den ganzen Einsatz und seinen Verlauf. In ein separates Journal importiert, kann ihn jede und jeder mit der Zeitreise Schritt für Schritt nachspielen.",
      it: "Un archivio orion aic (.orionaic o JSON reimportabile) contiene tutta l’operazione e la sua cronologia. Importato in un diario separato, permette a ciascuno di ripercorrerla passo per passo con la macchina del tempo.",
    },
  "Choisir un fichier": { de: "Datei auswählen", it: "Scegli un file" },
  ".orionaic · .orion · .json · .csv · .tsv · 32 Mo max · lu localement": {
    de: ".orionaic · .orion · .json · .csv · .tsv · max. 32 MB · lokal gelesen",
    it: ".orionaic · .orion · .json · .csv · .tsv · max 32 MB · letto localmente",
  },
  "Phrase de l’archive": { de: "Satz des Archivs", it: "Frase dell’archivio" },
  Déchiffrer: { de: "Entschlüsseln", it: "Decifra" },
  "Fichier valide": { de: "Gültige Datei", it: "File valido" },
  "{entries} entrées · {terminals} terminaux · {mode} · {classification}": {
    de: "{entries} Einträge · {terminals} Endgeräte · {mode} · {classification}",
    it: "{entries} voci · {terminals} terminali · {mode} · {classification}",
  },
  "Rejouable : {steps} moments de changement, du {from} au {to} · {events} changements d’éléments.":
    {
      de: "Nachspielbar: {steps} Änderungszeitpunkte, vom {from} bis {to} · {events} Änderungen an Elementen.",
      it: "Ripercorribile: {steps} momenti di cambiamento, dal {from} al {to} · {events} modifiche di elementi.",
    },
  "Rejouable : {steps} moments de changement, du {from} au {to} · versions des entrées seulement.":
    {
      de: "Nachspielbar: {steps} Änderungszeitpunkte, vom {from} bis {to} · nur Versionen der Einträge.",
      it: "Ripercorribile: {steps} momenti di cambiamento, dal {from} al {to} · solo versioni delle voci.",
    },
  "Aucun historique à rejouer : l’état du fichier est importé tel quel.": {
    de: "Kein Verlauf zum Nachspielen: Der Stand der Datei wird unverändert importiert.",
    it: "Nessuna cronologia da ripercorrere: lo stato del file viene importato così com’è.",
  },
  "Opérateur sur ce poste": {
    de: "Operateur auf diesem Arbeitsplatz",
    it: "Operatore su questa postazione",
  },
  "Journal séparé": { de: "Separates Journal", it: "Diario separato" },
  "Le journal actuel reste intact. Idéal pour relire ou rejouer l’opération.": {
    de: "Das aktuelle Journal bleibt unverändert. Ideal, um den Einsatz nachzulesen oder nachzuspielen.",
    it: "Il diario attuale resta intatto. Ideale per rileggere o ripercorrere l’operazione.",
  },
  "Fusionner dans « {title} »": {
    de: "In « {title} » zusammenführen",
    it: "Unisci in « {title} »",
  },
  "+{added} entrées · {duplicates} identiques · −{removed} supprimées ailleurs · {conflicts} conflits · radio +{radioAdded} / ~{radioUpdated} / {radioConflicts} conflits":
    {
      de: "+{added} Einträge · {duplicates} identisch · −{removed} anderswo gelöscht · {conflicts} Konflikte · Funk +{radioAdded} / ~{radioUpdated} / {radioConflicts} Konflikte",
      it: "+{added} voci · {duplicates} identiche · −{removed} eliminate altrove · {conflicts} conflitti · radio +{radioAdded} / ~{radioUpdated} / {radioConflicts} conflitti",
    },
  "Versions divergentes : importez en journal séparé pour comparer.": {
    de: "Abweichende Versionen: Importieren Sie in ein separates Journal, um zu vergleichen.",
    it: "Versioni divergenti: importare in un diario separato per confrontare.",
  },
  Fusionner: { de: "Zusammenführen", it: "Unisci" },
  "Lecture du fichier…": {
    de: "Datei wird gelesen …",
    it: "Lettura del file…",
  },
  // ---------- Exports ----------
  "Archive orion aic": { de: "orion-aic-Archiv", it: "Archivio orion aic" },
  "Chiffrée. Journal, versions et plan radio. Réimportable.": {
    de: "Verschlüsselt. Journal, Versionen und Funkplan. Wieder importierbar.",
    it: "Cifrato. Diario, versioni e piano radio. Reimportabile.",
  },
  "Archive JSON": { de: "JSON-Archiv", it: "Archivio JSON" },
  "En clair. Journal, versions et plan radio. Réimportable.": {
    de: "Unverschlüsselt. Journal, Versionen und Funkplan. Wieder importierbar.",
    it: "In chiaro. Diario, versioni e piano radio. Reimportabile.",
  },
  "Fiches messages A4": { de: "A4-Meldeblätter", it: "Schede messaggi A4" },
  "Une fiche par entrée, ordre chronologique.": {
    de: "Ein Blatt pro Eintrag, chronologisch.",
    it: "Una scheda per voce, ordine cronologico.",
  },
  "Journal PDF": { de: "PDF-Journal", it: "Diario PDF" },
  "Tableau chronologique paginé A4.": {
    de: "Chronologische Tabelle, A4 paginiert.",
    it: "Tabella cronologica impaginata A4.",
  },
  "Plan du réseau radio": { de: "Funknetzplan", it: "Piano della rete radio" },
  "Noms d’appel, groupes, terminaux, remises, contrôles.": {
    de: "Rufnamen, Gesprächsgruppen, Endgeräte, Abgaben, Kontrollen.",
    it: "Nominativi, gruppi, terminali, consegne, controlli.",
  },
  "Filtres, en-tête figé.": {
    de: "Filter, fixierte Kopfzeile.",
    it: "Filtri, intestazione fissa.",
  },
  "Document modifiable.": {
    de: "Bearbeitbares Dokument.",
    it: "Documento modificabile.",
  },
  "Tableur LibreOffice.": {
    de: "LibreOffice-Tabelle.",
    it: "Foglio di calcolo LibreOffice.",
  },
  "UTF-8, point-virgule.": {
    de: "UTF-8, Semikolon.",
    it: "UTF-8, punto e virgola.",
  },
  "UTF-8, tabulation.": { de: "UTF-8, Tabulator.", it: "UTF-8, tabulazione." },
  "Page autonome.": { de: "Eigenständige Seite.", it: "Pagina autonoma." },
  "Texte brut.": { de: "Reiner Text.", it: "Testo semplice." },
  "Texte structuré.": { de: "Strukturierter Text.", it: "Testo strutturato." },
  Archive: { de: "Archiv", it: "Archivio" },
  Impression: { de: "Druck", it: "Stampa" },
  Bureautique: { de: "Büro", it: "Ufficio" },
  "Réf. {reference} · Export {date} · Europe/Zurich": {
    de: "Ref. {reference} · Export {date} · Europe/Zurich",
    it: "Rif. {reference} · Esportazione {date} · Europe/Zurich",
  },
  "État actuel des entrées ; historique complet dans l’archive orion aic.": {
    de: "Aktueller Stand der Einträge; vollständiger Verlauf im orion-aic-Archiv.",
    it: "Stato attuale delle voci; cronologia completa nell’archivio orion aic.",
  },
  "{label} : {value}": { de: "{label}: {value}", it: "{label}: {value}" },
  "Cette archive dépasse la limite d’import de 32 Mo. Exportez les formats de lecture et répartissez le journal avant de créer une archive transférable.":
    {
      de: "Dieses Archiv überschreitet die Importgrenze von 32 MB. Exportieren Sie die Leseformate und teilen Sie das Journal auf, bevor Sie ein übertragbares Archiv erstellen.",
      it: "Questo archivio supera il limite d’importazione di 32 MB. Esportare i formati di lettura e suddividere il diario prima di creare un archivio trasferibile.",
    },
  "Export {date} · Europe/Zurich": {
    de: "Export {date} · Europe/Zurich",
    it: "Esportazione {date} · Europe/Zurich",
  },
  "État actuel ; historique complet dans l’archive orion aic.": {
    de: "Aktueller Stand; vollständiger Verlauf im orion-aic-Archiv.",
    it: "Stato attuale; cronologia completa nell’archivio orion aic.",
  },
  "N° / Événement": { de: "Nr. / Ereignis", it: "N. / Evento" },
  "Message et informations": {
    de: "Meldung und Informationen",
    it: "Messaggio e informazioni",
  },
  "Échéance : {date}": { de: "Frist: {date}", it: "Scadenza: {date}" },
  // ---------- Local vault ----------
  "Ce navigateur ne permet pas de sécuriser les écritures entre onglets. Utilisez le mode temporaire.":
    {
      de: "Dieser Browser kann das Schreiben zwischen Tabs nicht absichern. Verwenden Sie den temporären Modus.",
      it: "Questo browser non permette di proteggere le scritture tra schede. Usare la modalità temporanea.",
    },
  "L’espace local est déjà ouvert dans un autre onglet. Verrouillez cet onglet avant de reprendre ici.":
    {
      de: "Der lokale Speicher ist bereits in einem anderen Tab geöffnet. Sperren Sie jenen Tab, bevor Sie hier fortfahren.",
      it: "Lo spazio locale è già aperto in un’altra scheda. Bloccare quella scheda prima di riprendere qui.",
    },
  "Une session de reprise existe déjà. Reprenez-la ou exportez-la avant de créer une autre session protégée.":
    {
      de: "Es besteht bereits eine wiederherstellbare Sitzung. Setzen Sie sie fort oder exportieren Sie sie, bevor Sie eine weitere geschützte Sitzung erstellen.",
      it: "Esiste già una sessione di ripresa. Riprenderla o esportarla prima di creare un’altra sessione protetta.",
    },
  "Un espace chiffré existe déjà sur ce poste. Exportez cette session puis déverrouillez l’espace existant pour y importer le journal.":
    {
      de: "Auf diesem Arbeitsplatz besteht bereits ein verschlüsselter Speicher. Exportieren Sie diese Sitzung und entsperren Sie dann den bestehenden Speicher, um das Journal dort zu importieren.",
      it: "Su questa postazione esiste già uno spazio cifrato. Esportare questa sessione, poi sbloccare lo spazio esistente per importarvi il diario.",
    },
  "Aucun espace à sauvegarder.": {
    de: "Kein Speicher zum Sichern.",
    it: "Nessuno spazio da salvare.",
  },
  "Aucun espace local enregistré.": {
    de: "Kein lokaler Speicher vorhanden.",
    it: "Nessuno spazio locale salvato.",
  },
  "Verrouillez l’espace avant de l’effacer.": {
    de: "Sperren Sie den Speicher, bevor Sie ihn löschen.",
    it: "Bloccare lo spazio prima di cancellarlo.",
  },
  "Le navigateur refuse le stockage local. Exportez une copie avant de quitter.":
    {
      de: "Der Browser verweigert die lokale Speicherung. Exportieren Sie vor dem Verlassen eine Kopie.",
      it: "Il browser rifiuta l’archiviazione locale. Esportare una copia prima di uscire.",
    },
  "Espace de stockage du navigateur plein : la sauvegarde locale a échoué. Exportez une copie, puis libérez de l’espace (anciens journaux, images).":
    {
      de: "Browserspeicher voll: Die lokale Sicherung ist fehlgeschlagen. Exportieren Sie eine Kopie und geben Sie dann Speicher frei (alte Journale, Bilder).",
      it: "Spazio di archiviazione del browser pieno: il salvataggio locale non è riuscito. Esportare una copia, poi liberare spazio (vecchi diari, immagini).",
    },
  "Sauvegarde locale impossible. Exportez une copie avant de quitter.": {
    de: "Lokale Sicherung nicht möglich. Exportieren Sie vor dem Verlassen eine Kopie.",
    it: "Salvataggio locale impossibile. Esportare una copia prima di uscire.",
  },
} satisfies Dict);

/** Journal columns (French names) holding fixed schema values (enumLabel). */
export const ENUM_COLUMNS: ReadonlySet<string> = new Set([
  "Type",
  "Canal",
  "Priorité",
  "Confirmation",
  "Statut",
]);
