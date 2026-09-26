import { translator, type Dict } from "../../shared/i18n/core.ts";
import { common } from "../../shared/i18n/common.ts";

// Liaison between two command posts (src/liaison/*).
export const { t, tn, tIn, dict } = translator({
  ...common,
  // States
  Arrêtée: { de: "Gestoppt", it: "Fermo" },
  "Connexion…": { de: "Verbindung wird hergestellt …", it: "Connessione…" },
  "Connectée · l’autre PC n’est pas en ligne": {
    de: "Verbunden · der andere KP ist nicht online",
    it: "Connesso · l’altro PC non è in linea",
  },
  "En liaison": { de: "Verbunden", it: "In collegamento" },
  "Reconnexion…": { de: "Erneute Verbindung …", it: "Riconnessione…" },
  "Version différente : rechargez la page": {
    de: "Andere Version: Seite neu laden",
    it: "Versione diversa: ricaricare la pagina",
  },
  // Default names (values of the référentiel « destinataires »)
  "PC arrière": { de: "KP Rück", it: "PC arretrato" },
  "PC front": { de: "KP Front", it: "PC avanzato" },
  // Panel
  "Liaison avec {name} ouverte.": {
    de: "Verbindung mit {name} geöffnet.",
    it: "Collegamento con {name} aperto.",
  },
  "Fermer la liaison avec {name} ? Le code est effacé ; ce qui a été échangé reste au journal.":
    {
      de: "Verbindung mit {name} schliessen? Der Code wird gelöscht; was ausgetauscht wurde, bleibt im Journal.",
      it: "Chiudere il collegamento con {name}? Il codice viene cancellato; ciò che è stato scambiato resta nel diario.",
    },
  "Liaison avec {name} fermée.": {
    de: "Verbindung mit {name} geschlossen.",
    it: "Collegamento con {name} chiuso.",
  },
  "Un PC front et un PC arrière travaillent chacun dans leur propre session. Une liaison les relie sans rien mélanger : seuls les messages, les diffusions (avec leur ordre) et les accusés de lecture envoyés exprès passent de l’un à l’autre, chiffrés avec le code de liaison, par le même relais qui ne garde rien.":
    {
      de: "Ein KP Front und ein KP Rück arbeiten je in ihrer eigenen Sitzung. Eine Verbindung verknüpft sie, ohne etwas zu vermischen: Nur die ausdrücklich gesendeten Meldungen, Verteilungen (mit ihrem Befehl) und Lesebestätigungen gehen von einem zum anderen, verschlüsselt mit dem Verbindungscode, über dasselbe Relais, das nichts speichert.",
      it: "Un PC avanzato e un PC arretrato lavorano ciascuno nella propria sessione. Un collegamento li unisce senza mescolare nulla: solo i messaggi, le diffusioni (con il loro ordine) e le conferme di lettura inviati appositamente passano dall’uno all’altro, cifrati con il codice di collegamento, tramite lo stesso relay che non conserva nulla.",
    },
  "Ouvrir une liaison avec un autre PC": {
    de: "Verbindung mit einem anderen KP öffnen",
    it: "Apri un collegamento con un altro PC",
  },
  "L’autre PC": { de: "Der andere KP", it: "L’altro PC" },
  "Nom sous lequel il apparaît ici (destinataire des diffusions).": {
    de: "Name, unter dem er hier erscheint (Empfänger der Verteilungen).",
    it: "Nome con cui appare qui (destinatario delle diffusioni).",
  },
  "Ce PC": { de: "Dieser KP", it: "Questo PC" },
  "Nom sous lequel l’autre PC vous voit (émetteur).": {
    de: "Name, unter dem der andere KP Sie sieht (Absender).",
    it: "Nome con cui l’altro PC vi vede (mittente).",
  },
  "Premier des deux PC : créez le code et transmettez-le à l’autre comme un mot de passe (téléphone, radio chiffrée, papier).":
    {
      de: "Erster der beiden KP: Erstellen Sie den Code und übermitteln Sie ihn dem anderen wie ein Passwort (Telefon, verschlüsselter Funk, Papier).",
      it: "Primo dei due PC: creare il codice e trasmetterlo all’altro come una password (telefono, radio cifrata, carta).",
    },
  "Créer un code de liaison": {
    de: "Verbindungscode erstellen",
    it: "Crea un codice di collegamento",
  },
  "Code de liaison reçu": {
    de: "Erhaltener Verbindungscode",
    it: "Codice di collegamento ricevuto",
  },
  "Rejoindre la liaison": {
    de: "Verbindung beitreten",
    it: "Unisciti al collegamento",
  },
  "Cette page n’est pas en HTTPS : le chiffrement est indisponible.": {
    de: "Diese Seite verwendet kein HTTPS: Die Verschlüsselung ist nicht verfügbar.",
    it: "Questa pagina non è in HTTPS: la cifratura non è disponibile.",
  },
  // Card
  "Fermée {date}": { de: "Geschlossen {date}", it: "Chiuso {date}" },
  "Code de liaison": { de: "Verbindungscode", it: "Codice di collegamento" },
  "Dernier échange": { de: "Letzter Austausch", it: "Ultimo scambio" },
  "En attente de l’autre PC": {
    de: "Wartet auf den anderen KP",
    it: "In attesa dell’altro PC",
  },
  "En ligne de l’autre côté": {
    de: "Online auf der anderen Seite",
    it: "In linea dall’altra parte",
  },
  "Derniers échanges": { de: "Letzte Austausche", it: "Ultimi scambi" },
  Envoyé: { de: "Gesendet", it: "Inviato" },
  Reçu: { de: "Empfangen", it: "Ricevuto" },
  Accusé: { de: "Lesebestätigung", it: "Conferma di lettura" },
  Diffusion: { de: "Verteilung", it: "Diffusione" },
  "reçu {time}": { de: "empfangen {time}", it: "ricevuto {time}" },
  "remis {time}": { de: "zugestellt {time}", it: "consegnato {time}" },
  "en attente": { de: "ausstehend", it: "in attesa" },
  "Message à {name}": { de: "Meldung an {name}", it: "Messaggio a {name}" },
  "Diffuser à {name}": { de: "An {name} verteilen", it: "Diffondi a {name}" },
  "Copier le code": { de: "Code kopieren", it: "Copia il codice" },
  "Fermer la liaison": {
    de: "Verbindung schliessen",
    it: "Chiudi il collegamento",
  },
  // Errors of the connection (useLiaisons.ts)
  "L’autre PC utilise une version plus récente d’orion aic — rechargez la page.":
    {
      de: "Der andere KP verwendet eine neuere Version von orion aic – laden Sie die Seite neu.",
      it: "L’altro PC usa una versione più recente di orion aic — ricaricare la pagina.",
    },
  "Chiffrement indisponible : ouvrez orion aic en HTTPS.": {
    de: "Verschlüsselung nicht verfügbar: Öffnen Sie orion aic über HTTPS.",
    it: "Cifratura non disponibile: aprire orion aic in HTTPS.",
  },
  "Version différente sur le relais : rechargez la page.": {
    de: "Andere Version auf dem Relais: Laden Sie die Seite neu.",
    it: "Versione diversa sul relay: ricaricare la pagina.",
  },
  "Message de liaison illisible : l’autre PC utilise-t-il le même code de liaison ?":
    {
      de: "Verbindungsmeldung unlesbar: Verwendet der andere KP denselben Verbindungscode?",
      it: "Messaggio di collegamento illeggibile: l’altro PC usa lo stesso codice di collegamento?",
    },
} satisfies Dict);
