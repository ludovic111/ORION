import {
  BookA,
  CircleHelp,
  Keyboard,
  Lightbulb,
  Settings2,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import { type Topic } from "../content";
import { CONTACT_EMAIL, ContactCard, feedbackLink } from "../../../app/contact";
import { Faq, Gloss, H, K, Note, Path, Steps, Table, Ui } from "../kit";

export const PART4: Topic[] = [
  {
    id: "settings",
    group: "reference",
    title: "Impostazioni",
    icon: Settings2,
    hue: 230,
    short: (
      <p>
        Le impostazioni si trovano nel menu operatore (le vostre iniziali, in
        alto a destra). Cinque sezioni: Questa postazione, Elenchi di
        riferimento, Sincronizzazione, Sessione e diario, e «Un’idea?» per
        contattare l’autore.
      </p>
    ),
    guide: (
      <>
        <Table
          head={["Sezione", "Per…"]}
          rows={[
            [
              <Ui>Questa postazione</Ui>,
              "Tema, animazioni, stampa automatica, moduli visualizzati. Propria di questo dispositivo.",
            ],
            [
              <Ui>Elenchi di riferimento</Ui>,
              "Gli elenchi di valori standard proposti con un clic. Condivisi con le postazioni sincronizzate.",
            ],
            [
              <Ui>Sincronizzazione</Ui>,
              "Lavorare su più postazioni. Vedere l’argomento «Sincronizzazione».",
            ],
            [
              <Ui>Sessione e diario</Ui>,
              "Proprietà del diario, operatore, salvataggio, chiusura, fine della sessione.",
            ],
          ]}
        />
        <H>Aggiungere un valore standard</H>
        <Steps>
          <li>
            <Path steps={["Impostazioni", "Elenchi di riferimento"]} />.
          </li>
          <li>
            Scegliete l’elenco, per esempio «Destinatari e mittenti standard».
          </li>
          <li>
            Digitate il nuovo valore («Cellula meteo») e <Ui>Aggiungi</Ui>.
            Viene proposto ovunque, su tutte le postazioni.
          </li>
        </Steps>
      </>
    ),
    full: (
      <>
        <H>Questa postazione</H>
        <ul>
          <li>
            <strong>Modalità</strong>: Chiaro, Scuro, o Come il sistema (chiaro
            di giorno, scuro di notte).
          </li>
          <li>
            <strong>Tema chiaro</strong>: <em>Carta</em> (crema, predefinito),{" "}
            <em>Ardesia</em> (grigio bluastro, più freddo), <em>Segnale PCi</em>{" "}
            (blu e arancione della protezione civile) o{" "}
            <em>Contrasto elevato</em> (nero su bianco, tratti spessi: pieno
            sole, vista stanca).
          </li>
          <li>
            <strong>Tema scuro</strong>: <em>Grafite</em> (predefinito),{" "}
            <em>Mezzanotte</em> (blu notte) o <em>Notte tattica</em>: tutto in
            rosso su nero, carta compresa, per preservare la visione notturna
            sul terreno. Il pulsante sole / luna passa dall’uno all’altro; i
            temi si possono provare anche dalla ricerca (<kbd>⌘K</kbd>, «tema»).
          </li>
          <li>
            <strong>Animazioni</strong>: Tutte, o Ridotte (postazione lenta,
            sensibilità al movimento).
          </li>
          <li>
            <strong>Stampa automatica</strong>: voci di questa postazione, voci
            delle altre postazioni, messaggi.
          </li>
          <li>
            <strong>Moduli visualizzati</strong>: nascondete ciò che non usate.
            I dati restano intatti.
          </li>
        </ul>
        <H>Elenchi di riferimento</H>
        <p>
          Destinatari e mittenti, categorie di messaggio, canali, tipi di
          postazione, gradi, funzioni, tipi di mezzi, organizzazioni, categorie
          di contatto, tipi di appuntamento, livelli della carta, categorie di
          informazioni.
        </p>
        <ul>
          <li>Ogni valore può essere aggiunto, modificato o rimosso.</li>
          <li>
            <Ui>Ripristina i valori standard</Ui> ripristina l’elenco originale.
          </li>
          <li>
            Questi elenchi sono proposte: nei moduli potete sempre scrivere
            qualcos’altro.
          </li>
          <li>
            Quando il diario è chiuso, gli elenchi di riferimento non si possono
            più modificare.
          </li>
        </ul>
        <H>Sessione e diario</H>
        <p>
          Proprietà del diario (evento, organizzazione, luogo, riferimento,
          modalità, diffusione), nome dell’operatore, salvataggio cifrato,
          chiusura e riapertura, cancellazione della sessione. Vedere «Sessione,
          diari e salvataggio».
        </p>
      </>
    ),
  },
  {
    id: "security",
    group: "reference",
    title: "Sicurezza e dati",
    icon: ShieldCheck,
    hue: 150,
    short: (
      <p>
        Nessun account, nessuna pubblicità, nessun tracciamento. I vostri dati
        restano sul vostro dispositivo; ciò che viaggia tra le postazioni è
        cifrato.
      </p>
    ),
    guide: (
      <>
        <H>Che cosa esce dal dispositivo, e quando</H>
        <Table
          head={["Servizio", "Quando", "Che cosa viene inviato"]}
          rows={[
            [
              "Sfondi della carta swisstopo / OpenStreetMap",
              "Quando la carta viene visualizzata",
              "La zona osservata (immagini della carta)",
            ],
            [
              "Ricerca di indirizzi geo.admin.ch",
              "Quando cercate un indirizzo",
              "Il testo cercato",
            ],
            [
              "Previsioni Open-Meteo",
              "Quando le richiedete",
              "Solo le coordinate del luogo",
            ],
            [
              "Relay di sincronizzazione",
              "Se la sincronizzazione è attiva",
              "Messaggi cifrati, illeggibili",
            ],
            ["File esportati", "Quando esportate", "Ciò che decidete di farne"],
          ]}
        />
        <H>Buone abitudini</H>
        <Steps>
          <li>
            Scegliete una frase di recupero lunga: una piccola frase vale più di
            una parola complicata.
          </li>
          <li>
            <Ui>Blocca</Ui> quando lasciate la postazione.
          </li>
          <li>
            Esportate in <code>.orionaic</code> cifrato; evitate di lasciare in
            giro esportazioni in chiaro.
          </li>
          <li>
            Trasmettete il codice di sessione e le frasi attraverso un canale
            separato e sicuro.
          </li>
          <li>
            A fine impiego: archiviate, poi cancellate la sessione dalle
            postazioni.
          </li>
        </Steps>
      </>
    ),
    full: (
      <>
        <H>Dettagli tecnici</H>
        <ul>
          <li>
            Salvataggio sulla postazione: AES-256-GCM, chiave derivata dalla
            frase (PBKDF2-SHA-256, 600 000 iterazioni). La frase non viene mai
            memorizzata.
          </li>
          <li>
            Sincronizzazione: cifratura end-to-end AES-256-GCM, chiave derivata
            dal codice di sessione; il relay conosce solo un identificativo
            hash.
          </li>
          <li>
            Nessuna telemetria, nessuna statistica, nessun servizio di
            intelligenza artificiale.
          </li>
          <li>
            Politica di sicurezza rigorosa (CSP): la pagina può contattare solo
            i servizi elencati sopra.
          </li>
          <li>
            File importati verificati rigorosamente; formule neutralizzate nelle
            esportazioni per fogli di calcolo; HTML esportato senza script.
          </li>
          <li>
            I nomi degli operatori sono dichiarati, non verificati: la
            cronologia non è una firma elettronica.
          </li>
          <li>
            Il codice sorgente completo (licenza AGPL-3.0) si scarica dal menu
            operatore.
          </li>
        </ul>
        <Note kind="warn">
          orion aic è un software indipendente, senza omologazione né
          approvazione dell’UFPP. Utilizzare dati reali richiede una postazione
          adeguata e l’autorizzazione della vostra organizzazione.
        </Note>
      </>
    ),
  },
  {
    id: "mobile",
    group: "reference",
    title: "Telefono e tablet",
    icon: Smartphone,
    hue: 175,
    short: (
      <p>
        orion aic funziona anche su telefono e tablet. Installatelo come un’app:
        si apre a schermo intero e funziona offline.
      </p>
    ),
    guide: (
      <>
        <H>Installare l’applicazione</H>
        <Table
          head={["Dispositivo", "Come"]}
          rows={[
            [
              "Tutti",
              "Menu operatore → Installa l’applicazione (se il browser lo propone)",
            ],
            [
              "iPhone / iPad",
              "Safari → Condividi → «Aggiungi alla schermata Home»",
            ],
            ["Android", "Chrome → ⋮ → «Installa app»"],
            ["Computer", "Icona di installazione nella barra degli indirizzi"],
          ]}
        />
        <H>Che cosa cambia su uno schermo piccolo</H>
        <ul>
          <li>Il dock dei moduli passa in basso sullo schermo.</li>
          <li>
            Un pulsante rotondo <Ui>+</Ui> in basso a destra apre una nuova
            voce.
          </li>
          <li>
            I pulsanti sono più grandi, l’inserimento avviene in una finestra
            dedicata.
          </li>
        </ul>
      </>
    ),
    full: (
      <>
        <H>In pratica sul terreno</H>
        <ul>
          <li>
            <strong>Unirsi a una sessione</strong>: scansionate con la
            fotocamera il codice QR visualizzato sulla postazione principale; il
            codice è precompilato.
          </li>
          <li>
            <strong>Radio</strong>: scansionate l’etichetta QR di una radio per
            consegnarla o riprenderla.
          </li>
          <li>
            <strong>Contatti</strong>: toccate un numero per chiamare.
          </li>
          <li>
            I campi usano una dimensione del testo che evita lo zoom automatico
            dell’iPhone.
          </li>
        </ul>
        <Note kind="info">
          L’applicazione installata conserva i suoi dati separatamente dalla
          scheda del browser: una sessione aperta in Safari non appare nell’app
          installata. Unitevi alla sessione con il suo codice, o importate un
          archivio.
        </Note>
      </>
    ),
  },
  {
    id: "shortcuts",
    group: "reference",
    title: "Scorciatoie da tastiera",
    icon: Keyboard,
    hue: 260,
    short: (
      <p>
        Alcuni tasti fanno risparmiare molto tempo. Il più utile: <K>⌘K</K>{" "}
        (Mac) o <K>Ctrl+K</K> (Windows) per trovare tutto e fare tutto.
      </p>
    ),
    guide: (
      <Table
        head={["Tasti", "Effetto"]}
        rows={[
          [
            <>
              <K>⌘K</K> / <K>Ctrl+K</K>
            </>,
            "Cercare o agire, da qualsiasi punto",
          ],
          [
            <>
              <K>⌘↵</K> / <K>Ctrl+↵</K>
            </>,
            "Registrare il modulo (voce, messaggio…)",
          ],
          [<K>Esc</K>, "Chiudere una finestra, un menu, una scheda"],
          [
            <>
              <K>↑</K> <K>↓</K> poi <K>↵</K>
            </>,
            "Spostarsi in un elenco di proposte, poi scegliere",
          ],
          [
            <>
              <K>Tab</K> / <K>Maiusc+Tab</K>
            </>,
            "Passare al campo successivo / precedente",
          ],
          [<K>Tab</K>, "All’inizio della pagina: «Vai al contenuto»"],
          [
            <>
              <K>→</K> <K>Spazio</K> / <K>←</K>
            </>,
            "Presentazione: diapositiva successiva / precedente",
          ],
          [
            <>
              <K>P</K> <K>H</K> <K>E</K> <K>L</K>
            </>,
            "Presentazione: penna, evidenziatore, gomma, puntatore laser",
          ],
          [
            <>
              <K>O</K> <K>B</K> <K>N</K> <K>T</K> <K>F</K>
            </>,
            "Presentazione: panoramica, schermo nero, note, cronometro, schermo intero",
          ],
        ]}
      />
    ),
    full: (
      <>
        <H>Che cosa trova «Cerca o agisci»</H>
        <ul>
          <li>
            <strong>I moduli</strong>: «Vai a Carta della situazione»…
          </li>
          <li>
            <strong>Le azioni</strong>: nuova voce nel diario, nuovo messaggio
            ricevuto, rapporto sulla situazione A4, esportare (tutti i formati),
            presentare la situazione, schermo murale, macchina del tempo,
            fissare un’istantanea della situazione, tracciabilità, proporre un
            miglioramento, importare un file, sincronizzare con altre
            postazioni, attivare o disattivare la stampa automatica, tema chiaro
            o scuro, impostazioni ed elenchi di riferimento, nuovo diario nella
            sessione.
          </li>
          <li>
            <strong>Gli elementi</strong>: voci, messaggi, mezzi, persone,
            contatti, oggetti della carta… digitate alcune lettere, gli accenti
            non contano.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "contact",
    group: "reference",
    title: "Un’idea, un bisogno?",
    icon: Lightbulb,
    hue: 45,
    short: (
      <p>
        orion aic evolve con chi lo usa. Per chiedere una funzione, segnalare un
        problema o proporre ciò che vi semplificherebbe il lavoro, scrivete a{" "}
        <a href={feedbackLink("Aiuto")}>{CONTACT_EMAIL}</a>.
      </p>
    ),
    guide: (
      <>
        <ContactCard topic="Aiuto" />
        <H>Dove trovare questo contatto</H>
        <ul>
          <li>
            Menu operatore (le vostre iniziali, in alto a destra) →{" "}
            <Ui>Un’idea, un bisogno?</Ui>
          </li>
          <li>
            <Path steps={["Impostazioni", "Un’idea?"]} />
          </li>
          <li>
            <K>⌘K</K> → «Proporre un miglioramento»
          </li>
          <li>In fondo alla pagina iniziale.</li>
        </ul>
        <Note kind="tip">
          Descrivete la situazione («durante il rapporto di condotta,
          servirebbe…») piuttosto che la soluzione: è il modo migliore per
          ottenere ciò che vi aiuta davvero. Non inviate mai il contenuto di un
          diario reale.
        </Note>
      </>
    ),
  },
  {
    id: "faq",
    group: "reference",
    title: "Domande frequenti",
    icon: CircleHelp,
    hue: 320,
    always: true,
    short: (
      <p>
        Le risposte alle domande che tutti si pongono. Fate clic su una domanda
        per aprirla.
      </p>
    ),
    guide: (
      <div className="docs-faqs">
        <Faq q="Chi ha modificato questo elemento?">
          Aprite la sua scheda: in basso, «Creato da … · modificato da …», e il
          pulsante <Ui>Cronologia</Ui> mostra tutte le sue versioni. Per
          l’intera operazione: modulo <Ui>Tracciabilità</Ui>.
        </Faq>
        <Faq q="Si può rivedere la situazione com’era alle 10?">
          Sì: l’orologio <Ui>Macchina del tempo</Ui> in alto a destra, poi
          scegliete 10:00. Tutti i moduli mostrano lo stato di quel momento,
          meteo compresa.
        </Faq>
        <Faq q="Come proporre un miglioramento?">
          Scrivete a <a href={feedbackLink("FAQ")}>{CONTACT_EMAIL}</a> (menu
          operatore → <Ui>Un’idea, un bisogno?</Ui>).
        </Faq>
        <Faq q="Bisogna creare un account?">
          No. Aprite il sito, create una sessione, ed è tutto. Non ci sono né
          account né password di accesso.
        </Faq>
        <Faq q="Dove sono i miei dati?">
          Nel browser del vostro dispositivo. Niente viene memorizzato su un
          server. Per conservarli altrove, esportate un archivio.
        </Faq>
        <Faq q="Ho dimenticato la mia frase di recupero. Che cosa fare?">
          Nessuno può recuperarla. Potete unirvi alla sessione da un’altra
          postazione sincronizzata, o importare un archivio esportato.
          Altrimenti, <Ui>Frase persa</Ui> cancella lo spazio cifrato per
          ripartire da zero.
        </Faq>
        <Faq q="Ho chiuso la scheda di una sessione temporanea. È tutto perso?">
          Su questa postazione, sì. Ma se altre postazioni erano sincronizzate,
          unitevi a loro con il codice: la sessione ritorna. Altrimenti, solo un
          archivio esportato permette di recuperare il lavoro.
        </Faq>
        <Faq q="Come lavorare in più persone?">
          <Path
            steps={[
              "Impostazioni",
              "Sincronizzazione",
              "Crea un codice di sessione",
            ]}
          />
          , poi sulle altre postazioni: <Ui>Unisciti</Ui> e il codice. Vedere
          «Sincronizzazione tra postazioni».
        </Faq>
        <Faq q="Funziona senza internet?">
          Sì, dopo un primo caricamento. La sincronizzazione ha bisogno di
          internet o della rete locale (<code>npm run lan</code>). Gli sfondi
          della carta, la ricerca di indirizzi e le previsioni meteo hanno
          bisogno di internet.
        </Faq>
        <Faq q="Due persone modificano la stessa cosa nello stesso momento: chi vince?">
          Per una voce del diario, entrambe le versioni vengono conservate nella
          cronologia. Per il resto, prevale la modifica più recente.
        </Faq>
        <Faq q="Ho sbagliato in una voce del diario.">
          Apritela e fate clic sulla matita: la correzione viene registrata e la
          versione precedente resta consultabile. Per invalidare la voce,
          impostate il suo seguito su <Ui>Annullato</Ui>. Per un inserimento
          doppio, eliminatela indicando un motivo.
        </Faq>
        <Faq q="Perché il numero di una voce è cambiato?">
          Due postazioni offline hanno dato lo stesso numero a due voci: la più
          vecchia mantiene il numero, l’altra viene rinumerata. Succede anche
          durante l’unione di un archivio.
        </Faq>
        <Faq q="Non posso più modificare nulla.">
          Il diario è probabilmente chiuso (sola lettura). Si riapre in{" "}
          <Path steps={["Impostazioni", "Sessione e diario"]} />.
        </Faq>
        <Faq q="Come stampare senza fare clic ogni volta?">
          Attivate la stampa automatica e avviate Chrome o Edge con l’opzione{" "}
          <code>--kiosk-printing</code>. Vedere «Stampa».
        </Faq>
        <Faq q="Come trasmettere un diario a una postazione non sincronizzata?">
          Esportate un archivio <code>.orionaic</code>, inviatelo e comunicate
          la frase attraverso un altro canale. L’altra postazione lo importa.
        </Faq>
        <Faq q="Non trovo più un modulo nel dock.">
          Forse è nascosto:{" "}
          <Path
            steps={["Impostazioni", "Questa postazione", "Moduli visualizzati"]}
          />
          .
        </Faq>
        <Faq q="I colori o le animazioni mi disturbano.">
          Scegliete un altro tema (per esempio <em>Contrasto elevato</em> o{" "}
          <em>Notte tattica</em>) e le animazioni ridotte in{" "}
          <Path steps={["Impostazioni", "Questa postazione"]} />.
        </Faq>
      </div>
    ),
    full: (
      <div className="docs-faqs">
        <Faq q="Che cosa vede il server durante la sincronizzazione?">
          Niente di leggibile: un identificativo di sala hash e messaggi
          cifrati. Non conserva nulla.
        </Faq>
        <Faq q="Il codice di sessione è stato divulgato. Che cosa fare?">
          Su ogni postazione, <Ui>Interrompi su questa postazione</Ui>. Poi una
          postazione crea un nuovo codice e le altre si uniscono.
        </Faq>
        <Faq q="Si può sincronizzare via Bluetooth?">
          No, i browser non lo permettono per questo uso. Senza internet, usate
          la rete locale.
        </Faq>
        <Faq q="Che cosa significano i bollini sul dock?">
          Rosso: ci sono scadenze superate. Viola: nuovi messaggi attendono di
          essere trattati.
        </Faq>
        <Faq q="Quale browser usare?">
          Un browser recente: Chrome, Edge, Firefox o Safari. La pagina deve
          essere in https.
        </Faq>
        <Faq q="orion aic è ufficiale?">
          No. È un software indipendente, senza omologazione dell’UFPP.
          Utilizzate dati reali solo con l’autorizzazione della vostra
          organizzazione.
        </Faq>
        <Faq q="Posso allegare una foto a una voce?">
          No, orion aic non conserva file allegati. Annotate il riferimento
          della foto o del documento.
        </Faq>
      </div>
    ),
  },
  {
    id: "glossary",
    group: "reference",
    title: "Glossario",
    icon: BookA,
    hue: 45,
    always: true,
    short: (
      <p>Le parole del mestiere e dell’applicazione, spiegate semplicemente.</p>
    ),
    guide: (
      <dl className="docs-glossary">
        <Gloss term="AC · aiuto alla condotta">
          Il team che assiste il capo intervento: segue la situazione, tiene il
          diario, gestisce i messaggi e i collegamenti.
        </Gloss>
        <Gloss term="Archivio .orionaic">
          Il file cifrato che contiene un intero diario. Serve ad archiviare e a
          trasmettere. I vecchi archivi <code>.orion</code> restano leggibili.
        </Gloss>
        <Gloss term="Avvicendamento">
          Il cambio di squadra: chi parte trasmette la situazione a chi arriva.
        </Gloss>
        <Gloss term="Cellula">
          Un piccolo gruppo incaricato di un ambito: situazione, logistica,
          telematica, comunicazione…
        </Gloss>
        <Gloss term="Cifrato">
          Trasformato in un codice illeggibile. Solo chi ha la chiave (frase o
          codice di sessione) può rileggerlo.
        </Gloss>
        <Gloss term="Controllo dei collegamenti">
          Verificare che ci si senta alla radio. Risposta THREE (buono), TWO
          (debole ma comprensibile) o ONE (insufficiente).
        </Gloss>
        <Gloss term="Diario chiuso">
          Un diario terminato: si può leggere, stampare, esportare, ma non più
          modificare (salvo riaprirlo).
        </Gloss>
        <Gloss term="Elenco di riferimento">
          Un elenco di valori standard proposti con un clic, modificabile nelle
          impostazioni.
        </Gloss>
        <Gloss term="Frase di recupero">
          La frase segreta (almeno 12 caratteri) che cifra la sessione sulla
          postazione. Nessuno può recuperarla se viene persa.
        </Gloss>
        <Gloss term="Informazioni chiave">
          Le poche cifre che riassumono la situazione: persone evacuate, edifici
          colpiti, mezzi impiegati…
        </Gloss>
        <Gloss term="MN95">
          Il sistema di coordinate svizzero. Due numeri in metri, per esempio 2
          499 800 / 1 115 900.
        </Gloss>
        <Gloss term="Modalità diretta">
          Le radio comunicano direttamente tra loro, senza passare dalla rete.
          Portata corta, ma funziona ovunque.
        </Gloss>
        <Gloss term="Modulo">
          Una parte di orion aic: diario, carta, radio… Ognuno ha la sua icona
          nel dock.
        </Gloss>
        <Gloss term="Nominativo">
          Il nome usato alla radio. Designa una funzione («PC Carouge»), mai una
          persona.
        </Gloss>
        <Gloss term="PC arretrato">
          Il posto di comando in posizione arretrata (base, edificio), che
          coordina, sostiene e fa da collegamento con le autorità.
        </Gloss>
        <Gloss term="PC avanzato">
          Il posto di comando installato vicino all’evento, sul terreno.
        </Gloss>
        <Gloss term="Polycom">
          La rete radio svizzera delle organizzazioni di sicurezza.
        </Gloss>
        <Gloss term="Quittanza">
          La conferma che un messaggio è stato ricevuto o che una missione è
          stata eseguita. Anche: il foglio firmato alla consegna di un
          materiale.
        </Gloss>
        <Gloss term="RFSI">
          Il numero di identificazione univoco di una radio nella rete Polycom.
        </Gloss>
        <Gloss term="Ripetitore">
          Un apparecchio che ripete i messaggi per arrivare più lontano, là dove
          la rete non passa.
        </Gloss>
        <Gloss term="Ritmo di condotta">
          Il programma regolare dei rapporti, degli orientamenti e degli
          avvicendamenti (per esempio un rapporto ogni 2 ore).
        </Gloss>
        <Gloss term="Scadenza">
          L’ora alla quale è attesa una missione o una risposta.
        </Gloss>
        <Gloss term="Sessione">
          L’insieme del lavoro per un evento, su una postazione: uno o più diari
          e tutto ciò che vi è collegato.
        </Gloss>
        <Gloss term="Sincronizzazione">
          Più postazioni che condividono la stessa sessione in diretta, grazie a
          un codice di sessione.
        </Gloss>
        <Gloss term="swisstopo">
          L’Ufficio federale di topografia, che realizza le carte nazionali
          svizzere.
        </Gloss>
        <Gloss term="Terminale">Una radio: portatile, veicolare o fissa.</Gloss>
        <Gloss term="TKG · gruppo di conversazione">
          Un gruppo di conversazione Polycom: tutte le radio del gruppo si
          sentono attraverso la rete.
        </Gloss>
        <Gloss term="UFPP">
          L’Ufficio federale della protezione della popolazione, che stabilisce
          le regole e la formazione della protezione civile.
        </Gloss>
        <Gloss term="WGS84">
          Il sistema di coordinate del GPS, in gradi: latitudine e longitudine,
          per esempio 46.19, 6.14.
        </Gloss>
      </dl>
    ),
  },
];
