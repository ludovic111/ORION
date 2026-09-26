import {
  FileDown,
  History,
  Link2,
  MonitorPlay,
  Navigation,
  Printer,
  Wifi,
} from "lucide-react";
import { SITE, type Topic } from "../content";
import {
  Example,
  H,
  K,
  LinksFigure,
  Note,
  Path,
  Steps,
  SyncFlow,
  Table,
  Ui,
} from "../kit";

export const PART3A: Topic[] = [
  {
    id: "links",
    group: "together",
    title: "Tutto è collegato",
    icon: Link2,
    hue: 285,
    short: (
      <p>
        In orion aic tutto è collegato: un messaggio, la voce del diario che ne
        deriva, il mezzo impiegato e il punto sulla carta si ritrovano l’uno
        dall’altro.
      </p>
    ),
    guide: (
      <>
        <LinksFigure />
        <H>Vedere i collegamenti</H>
        <ul>
          <li>
            Ogni scheda ha una sezione <Ui>Collegamenti</Ui>. Ogni collegamento
            vi appare come una piccola etichetta.
          </li>
          <li>
            <strong>Passaggio del mouse</strong> su un’etichetta: un’anteprima
            dell’elemento. <strong>Clic</strong>: l’elemento si apre.
          </li>
        </ul>
        <H>Aggiungere un collegamento a mano</H>
        <Steps>
          <li>
            Nella scheda, fate clic su <Ui>Collega</Ui>.
          </li>
          <li>Cercate l’elemento da collegare digitando qualche lettera.</li>
          <li>
            Se volete, precisate la natura del collegamento (« impiegato su », «
            riguarda »…), poi confermate.
          </li>
          <li>
            Per togliere un collegamento: la <Ui>×</Ui> della sua etichetta.
          </li>
        </Steps>
      </>
    ),
    full: (
      <>
        <H>Collegamenti automatici</H>
        <p>
          orion aic crea da solo i collegamenti evidenti. Non dovete fare nulla:
        </p>
        <Table
          head={["Quando…", "… questi elementi vengono collegati"]}
          rows={[
            [
              "Compare lo stesso nominativo",
              "Persona, radio, voci e messaggi che lo utilizzano",
            ],
            [
              "Un mittente, destinatario o responsabile porta il nome di una persona, di una postazione, di un mezzo o di un contatto",
              "La voce o il messaggio e questo elemento",
            ],
            ["Una voce cita #012", "Le due voci"],
            [
              "Un messaggio viene registrato nel diario",
              "Il messaggio e la voce creata",
            ],
            [
              "Una persona è membro di una postazione",
              "La persona e la postazione",
            ],
            [
              "Un nominativo ha un gruppo di conversazione",
              "Il nominativo e il gruppo",
            ],
            ["Una radio viene consegnata", "Il terminale e il suo detentore"],
          ]}
        />
        <Note kind="info">
          Un collegamento automatico nasce dai dati stessi: per farlo sparire,
          modificate il campo che lo crea. Quando si elimina un elemento, i suoi
          collegamenti manuali spariscono con lui.
        </Note>
      </>
    ),
  },
  {
    id: "sync",
    group: "together",
    title: "Sincronizzazione tra postazioni",
    icon: Wifi,
    hue: 190,
    short: (
      <p>
        Più computer, tablet o telefoni lavorano sulla stessa sessione, in
        diretta. Nessun account: basta un <strong>codice di sessione</strong>, e
        tutto è cifrato.
      </p>
    ),
    guide: (
      <>
        <SyncFlow />
        <H>Sulla prima postazione: condividere</H>
        <Steps>
          <li>
            <Path steps={["Menu operatore", "Sincronizzazione"]} />, oppure un
            clic sull’indicatore <Ui>Da solo</Ui> in alto.
          </li>
          <li>
            <Ui>Crea un codice di sessione</Ui>. Appare un codice del tipo{" "}
            <code>ABCD-EFGH-JKMN-PQRS</code>, con un codice QR.
          </li>
          <li>
            Comunicate il codice alle altre postazioni, oppure{" "}
            <Ui>Copia il link</Ui>.
          </li>
        </Steps>
        <H>Sulle altre postazioni: unirsi</H>
        <Steps>
          <li>
            Aprite <a href={SITE}>orionaic.xyz</a> → <Ui>Unisciti</Ui>. (Oppure
            scansionate il codice QR con il telefono: il codice è già
            compilato.)
          </li>
          <li>Digitate il codice e il vostro nome o la vostra funzione.</li>
          <li>
            Se volete conservare la sessione su questa postazione, spuntate{" "}
            <Ui>Salvataggio cifrato su questa postazione</Ui> e scegliete una
            frase.
          </li>
          <li>
            <Ui>Unisciti alla sessione</Ui>. La sessione arriva non appena una
            postazione che la possiede è online.
          </li>
        </Steps>
        <p>
          In alto, l’indicatore mostra <Ui>Da solo</Ui>, <Ui>3 postazioni</Ui>{" "}
          (con le iniziali di ciascuno; al passaggio del mouse, chi si trova su
          quale modulo) oppure <Ui>Riconnessione</Ui>.
        </p>
        <Note kind="warn">
          Il codice è una <strong>password</strong>: apre l’intera sessione.
          Trasmettetelo a voce, su carta o tramite un canale sicuro, mai su un
          canale aperto.
        </Note>
      </>
    ),
    full: (
      <>
        <H>Che cosa viene sincronizzato</H>
        <p>
          Tutto il contenuto: diari e voci, messaggi, carta, mezzi, squadra,
          radio, contatti, meteo, agenda, collegamenti, elenchi di riferimento.
          Ciò che resta proprio di ogni postazione: le{" "}
          <strong>impostazioni della postazione</strong> (tema, moduli
          visualizzati, stampa automatica). Anche le{" "}
          <strong>posizioni in diretta</strong> delle squadre passano attraverso
          la sincronizzazione, ma non vengono mai registrate (vedi « Posizioni
          delle squadre in diretta »).
        </p>
        <H>Offline</H>
        <p>
          Ogni postazione conserva una copia completa. Se il collegamento cade,
          si continua a lavorare normalmente; al ritorno della connessione, le
          postazioni si scambiano ciò che è cambiato.
        </p>
        <H>Se due postazioni modificano la stessa cosa</H>
        <ul>
          <li>
            Una <strong>voce del diario</strong> modificata da entrambe le parti
            conserva le due versioni nella sua cronologia: non si perde nulla.
          </li>
          <li>Per il resto, prevale la modifica più recente.</li>
          <li>Un’eliminazione prevale su una modifica più vecchia.</li>
          <li>
            Se due voci ricevono lo stesso numero nello stesso momento (offline,
            per esempio), la più vecchia conserva il suo numero; l’altra viene
            rinumerata.
          </li>
        </ul>
        <H>Sicurezza</H>
        <ul>
          <li>
            Cifratura end-to-end AES-256-GCM, con una chiave derivata dal codice
            di sessione. Il codice non lascia mai le postazioni.
          </li>
          <li>
            Il server relè vede soltanto un identificativo di sala in forma di
            hash e messaggi illeggibili. Non memorizza nulla; quando l’ultima
            postazione se ne va, la sala scompare.
          </li>
          <li>
            La pagina deve essere in https: altrimenti la cifratura non è
            disponibile e orion aic lo segnala.
          </li>
          <li>
            Il codice evita i caratteri che si confondono (0 e O, 1 e I o L):
            meno errori di lettura.
          </li>
        </ul>
        <H>Senza internet: la rete locale</H>
        <Steps>
          <li>
            Su un computer del PC (la « postazione server »), con il codice
            sorgente di orion aic, avviate <code>npm run lan</code>.
          </li>
          <li>
            Mostra un indirizzo del tipo <code>https://192.168.1.20:4443</code>{" "}
            e l’<strong>impronta</strong> del certificato.
          </li>
          <li>
            Sulle altre postazioni collegate allo stesso Wi-Fi o alla stessa
            rete cablata, aprite questo indirizzo. Il browser segnala un
            certificato non riconosciuto: verificate che l’impronta sia la
            stessa, poi accettate (una sola volta).
          </li>
          <li>
            Utilizzate poi il codice di sessione come di consueto. Tutto resta
            nell’edificio.
          </li>
        </Steps>
        <Note kind="info">
          Il Bluetooth non è utilizzabile: i browser non lo consentono per
          questo tipo di scambio. Utilizzate la rete locale.
        </Note>
        <H>Altre impostazioni</H>
        <ul>
          <li>
            <Path steps={["Impostazioni", "Sincronizzazione"]} /> mostra lo
            stato (Connesso, Riconnessione…), le altre postazioni e il loro
            modulo, l’ora dell’ultimo scambio.
          </li>
          <li>
            <Ui>Unisciti con un codice</Ui>, da una sessione già aperta, unisce
            questa sessione a quella delle altre postazioni.
          </li>
          <li>
            <Ui>Interrompi su questa postazione</Ui> interrompe la
            sincronizzazione soltanto qui; le altre continuano.
          </li>
        </ul>
      </>
    ),
  },
];

export const PART3B: Topic[] = [
  {
    id: "positions",
    group: "together",
    title: "Posizioni delle squadre in diretta",
    icon: Navigation,
    hue: 20,
    module: "map",
    openLabel: "Apri la carta",
    short: (
      <p>
        Un telefono o un tablet di una pattuglia può{" "}
        <strong>condividere la propria posizione</strong>: il posto di comando
        la vede sulla carta, in diretta. Non viene registrato nulla, salvo se
        qualcuno lo chiede.
      </p>
    ),
    guide: (
      <>
        <H>Sul telefono della squadra: condividere</H>
        <Steps>
          <li>
            Unitevi alla sessione (codice di sessione), poi aprite la{" "}
            <Ui>Carta</Ui>.
          </li>
          <li>
            Toccate il pulsante freccia <Ui>Condividi la mia posizione</Ui>{" "}
            (colonna di destra, sotto <Ui>La mia posizione</Ui>).
          </li>
          <li>
            Leggete chi la vede e che cosa viene conservato. Scegliete la
            squadra o il mezzo rappresentato (scheda Squadra o Mezzi) e la
            denominazione, per esempio « Pattuglia 2 ».
          </li>
          <li>
            <Ui>Condividi la mia posizione</Ui>, poi accettate la richiesta di
            localizzazione del browser.
          </li>
        </Steps>
        <p>
          Finché la condivisione è attiva, una barra resta in alto sullo
          schermo: <Ui>Posizione condivisa</Ui>, l’ora dell’ultimo invio e il
          pulsante <Ui>Ferma</Ui>.
        </p>
        <H>Al posto di comando: seguire</H>
        <Steps>
          <li>
            Sulla carta, ogni squadra ha un punto arancione, il suo nome, l’età
            della posizione (« 40 s fa »), un cerchio di precisione e il suo
            percorso degli ultimi 30 minuti.
          </li>
          <li>
            Un clic sul punto: <Ui>Centra</Ui>, <Ui>Registrare nel diario</Ui>{" "}
            (una voce con le coordinate MN95), <Ui>Crea un punto qui</Ui> (un
            normale oggetto della carta) oppure <Ui>Scheda</Ui>.
          </li>
          <li>
            <Path steps={["Carta", "Livelli", "Posizioni in diretta"]} />{" "}
            nasconde o mostra questo livello.
          </li>
        </Steps>
        <Note kind="info">
          Una posizione più vecchia di 2 minuti diventa grigia; dopo 30 minuti
          senza notizie, la squadra scompare dalla carta.
        </Note>
      </>
    ),
    full: (
      <>
        <H>Che cosa viene inviato, e a chi</H>
        <ul>
          <li>
            La latitudine, la longitudine, la precisione, la direzione e la
            velocità, la denominazione e la scheda collegata. Nient’altro.
          </li>
          <li>
            Circa ogni 15 secondi, oppure dopo 25 m di spostamento (al massimo
            ogni 5 secondi): pochi dati, nessun costo supplementare per il relè.
          </li>
          <li>
            Soltanto alle postazioni connesse alla stessa sessione, cifrata con
            il codice di sessione come il resto. Il relè non può leggere la
            posizione e non la conserva.
          </li>
        </ul>
        <H>Che cosa viene conservato</H>
        <ul>
          <li>
            Nulla sul server. Le altre postazioni conservano l’ultima posizione
            e il percorso degli ultimi 30 minuti soltanto{" "}
            <strong>in memoria</strong>: chiudere la scheda del browser li
            cancella.
          </li>
          <li>
            Le posizioni non entrano né nel diario, né nella cronologia, né
            negli archivi, né nella macchina del tempo (lì il livello è
            nascosto).
          </li>
          <li>
            Per conservare una traccia bisogna farlo di proposito:{" "}
            <Ui>Registrare nel diario</Ui> o <Ui>Crea un punto qui</Ui> al posto
            di comando, oppure <Ui>Registra la traccia</Ui> sulla postazione che
            condivide.
          </li>
        </ul>
        <H>Registrare la traccia</H>
        <p>
          Da spuntare all’inizio della condivisione (o nel dettaglio della
          barra). Il percorso resta sul telefono. All’arresto, orion aic chiede:{" "}
          <Ui>Registra sulla carta</Ui> (una linea del livello Mezzi, visibile a
          tutti e conservata nella cronologia) oppure{" "}
          <Ui>Abbandona la traccia</Ui>.
        </p>
        <H>Quando la condivisione si interrompe</H>
        <ul>
          <li>
            Pulsante <Ui>Ferma</Ui> della barra: le altre postazioni tolgono
            subito la squadra.
          </li>
          <li>
            Scheda del browser chiusa, pagina ricaricata, sessione chiusa: la
            condivisione si interrompe.
          </li>
          <li>
            Schermo bloccato o applicazione in background: il browser interrompe
            la localizzazione. L’opzione <Ui>Mantieni lo schermo acceso</Ui>{" "}
            evita il blocco (consuma più batteria).
          </li>
        </ul>
        <Note kind="warn">
          La precisione dipende dall’apparecchio: in città o all’interno, il
          cerchio può superare i 50 m. Per una posizione importante, confermate
          via radio.
        </Note>
      </>
    ),
  },
  {
    id: "print",
    group: "together",
    title: "Stampa",
    icon: Printer,
    hue: 30,
    short: (
      <p>
        Tutto si stampa in A4: schede di messaggio, rapporti, piani, tabelle.
        orion aic può persino stampare automaticamente ogni nuova voce.
      </p>
    ),
    guide: (
      <>
        <H>Stampare un documento</H>
        <Steps>
          <li>
            Fate clic sul pulsante stampante o su <Ui>Scheda A4</Ui>{" "}
            dell’elemento.
          </li>
          <li>Un’anteprima mostra le pagine reali.</li>
          <li>
            <Ui>Stampa</Ui> (stampante), oppure <Ui>PDF</Ui> per un file.
          </li>
        </Steps>
        <H>Stampa automatica</H>
        <Steps>
          <li>
            Nel diario, attivate l’interruttore <Ui>Stampa automatica</Ui> sotto
            il modulo (oppure <K>⌘K</K> → « Attiva la stampa automatica »).
          </li>
          <li>
            Per altre opzioni:{" "}
            <Path
              steps={["Impostazioni", "Questa postazione", "Stampa automatica"]}
            />
            .
          </li>
        </Steps>
        <Table
          head={["Opzione", "Effetto"]}
          rows={[
            [
              "Stampa ogni nuova voce del diario",
              "La scheda A4 parte non appena la voce è registrata, su questa postazione.",
            ],
            [
              "Stampa anche le voci delle altre postazioni",
              "Per una postazione di stampa centrale: le voci ricevute tramite sincronizzazione vengono stampate qui.",
            ],
            [
              "Stampa ogni nuovo messaggio ricevuto",
              "Un modulo di messaggio A4 per ogni messaggio inserito.",
            ],
          ]}
        />
      </>
    ),
    full: (
      <>
        <H>Che cosa si stampa</H>
        <Table
          head={["Documento", "Dove trovarlo"]}
          rows={[
            [
              "Scheda di messaggio (una voce)",
              "Diario: dettaglio → Scheda A4, oppure più righe spuntate",
            ],
            ["Modulo di messaggio", "Messaggi: Scheda A4"],
            ["Rapporto sulla situazione", "Diario: Rapporto"],
            ["Piano della rete radio", "Radio: Piano A4"],
            [
              "Quittanza di consegna radio",
              "Radio: icona stampante di un terminale o di una consegna",
            ],
            ["Etichette QR", "Radio: Etichette"],
            ["Tabelle", "Mezzi, Squadra, Contatti, Agenda: pulsante stampa"],
          ]}
        />
        <p>
          I PDF sono vettoriali: nitidi a qualsiasi dimensione, con i caratteri
          incorporati. Un testo lungo continua sulla pagina successiva.
        </p>
        <H>Stampare senza finestra di stampa</H>
        <p>
          Per sicurezza, il browser mostra la sua finestra di stampa per ogni
          documento. Per una postazione di stampa che deve stampare tutto senza
          clic, avviate Chrome o Edge con l’opzione{" "}
          <code>--kiosk-printing</code>:
        </p>
        <Table
          head={["Sistema", "Comando o collegamento"]}
          rows={[
            [
              "Windows · Chrome",
              <code>
                "C:\Program Files\Google\Chrome\Application\chrome.exe"
                --kiosk-printing {SITE}
              </code>,
            ],
            ["Windows · Edge", <code>msedge.exe --kiosk-printing {SITE}</code>],
            [
              "macOS · Chrome",
              <code>open -a "Google Chrome" --args --kiosk-printing</code>,
            ],
          ]}
        />
        <Steps>
          <li>
            Chiudete prima <strong>tutte</strong> le finestre del browser,
            altrimenti l’opzione viene ignorata.
          </li>
          <li>
            Con Windows, la soluzione più semplice: un collegamento sul desktop
            la cui « Destinazione » contiene il comando qui sopra.
          </li>
          <li>
            Scegliete la stampante predefinita nelle impostazioni del sistema: è
            quella che stamperà.
          </li>
          <li>Impostate i margini a zero durante una prima stampa.</li>
        </Steps>
        <Note kind="warn">
          In questa modalità, <strong>tutto</strong> ciò che il browser stampa
          va direttamente alla stampante predefinita. Riservatela alla
          postazione di stampa.
        </Note>
      </>
    ),
  },
  {
    id: "present",
    group: "together",
    title: "Presentare la situazione",
    icon: MonitorPlay,
    hue: 300,
    short: (
      <p>
        Quando autorità o ospiti arrivano al posto di comando, la{" "}
        <strong>modalità presentazione</strong> mostra la situazione a schermo
        intero, in modo chiaro, con animazioni, senza preparare nulla: le
        diapositive si costruiscono da sole a partire dai dati. Lo{" "}
        <strong>schermo murale</strong> fa scorrere la situazione in diretta su
        uno schermo fisso.
      </p>
    ),
    guide: (
      <>
        <H>Presentare in 3 passi</H>
        <Steps>
          <li>
            Pulsante schermo <Ui>Presentazione della situazione</Ui> in alto a
            destra (oppure <K>⌘K</K> → « Presenta »).
          </li>
          <li>
            Preparate in pochi secondi: il vostro nome, il pubblico (« Sindaco,
            prefetto »), la versione (<Ui>Adesso</Ui>, un’istantanea o un’ora),
            e spuntate o trascinate le diapositive nell’ordine desiderato.
          </li>
          <li>
            <Ui>Presenta</Ui>: schermo intero. Freccia destra, spazio o un clic
            per avanzare; freccia sinistra per tornare indietro; <K>Esc</K> per
            terminare.
          </li>
        </Steps>
        <H>Le diapositive</H>
        <p>
          Titolo, situazione generale e intenzione, cifre chiave (con la loro
          evoluzione dall’ultimo punto), ogni carta in grande, ciò che è
          cambiato dall’ultimo punto, fatti salienti del diario, missioni in
          corso o in ritardo, mezzi, organizzazione (PC avanzato, PC arretrato,
          cellule), rete radio, meteo, prossime scadenze, domande. Una
          diapositiva senza dati non appare.
        </p>
        <H>Disegnare e mostrare durante la presentazione</H>
        <ul>
          <li>
            <K>P</K> penna (mouse, dito o stilo), <K>H</K> evidenziatore,{" "}
            <K>E</K> gomma, <K>1</K>–<K>5</K> colore, <K>⌘Z</K> annulla,{" "}
            <K>Maiusc</K>+<K>E</K> cancella tutto.
          </li>
          <li>
            <K>L</K> puntatore laser, <K>B</K> schermo nero, <K>O</K> panoramica
            delle diapositive, <K>T</K> cronometro, <K>N</K> note, <K>F</K>{" "}
            schermo intero.
          </li>
          <li>
            Alla fine, <Ui>Salva le annotazioni</Ui> produce un PDF delle
            diapositive annotate.
          </li>
        </ul>
        <H>Vista relatore</H>
        <p>
          <Ui>Apri la vista relatore</Ui> apre una seconda finestra (sul
          computer, mentre il proiettore mostra le diapositive): diapositiva
          corrente e successiva, note, tempo trascorso, orologio. Se il browser
          blocca la finestra, autorizzatela oppure usate <K>N</K>.
        </p>
        <H>Schermo murale</H>
        <p>
          <K>⌘K</K> → « Schermo murale »: la situazione scorre da sola (ogni 10,
          20, 30 o 60 secondi), si aggiorna in diretta, con un grande orologio e
          le ultime voci del diario. Lo schermo non va in standby. <K>Spazio</K>{" "}
          pausa, <K>Esc</K> esci.
        </p>
      </>
    ),
    full: (
      <>
        <H>Esportare la presentazione</H>
        <ul>
          <li>
            Dalla schermata di preparazione, oppure nel centro di esportazione
            (famiglia Presentazione): <strong>PowerPoint</strong> (.pptx) con
            transizioni e apparizioni automatiche, <strong>OpenDocument</strong>{" "}
            (.odp), <strong>PDF</strong> (una diapositiva per pagina) e{" "}
            <strong>HTML</strong> (un unico file che si presenta in qualsiasi
            browser, tasto <K>N</K> per le note).
          </li>
          <li>
            Il file contiene le note del relatore, la filigrana ESERCIZIO o
            CONFIDENZIALE e, a piè di pagina, l’impronta verificabile.
          </li>
          <li>
            Si può esportare una sola parte (per esempio la carta e i mezzi)
            oppure l’intera operazione, all’ora che si preferisce.
          </li>
        </ul>
        <H>Registro delle presentazioni</H>
        <p>
          Ogni presentazione e ogni schermo murale vengono iscritti in{" "}
          <Path steps={["Tracciabilità", "Presentazioni"]} />: chi ha
          presentato, a chi, quando, per quanto tempo, quale versione e quali
          diapositive.
        </p>
        <Note kind="tip">
          Prima di una visita, fissate un’istantanea della situazione (« Visita
          del prefetto »): la presentazione, l’esportazione e il confronto con
          il seguito riprendono esattamente la stessa versione.
        </Note>
      </>
    ),
  },
  {
    id: "timemachine",
    group: "together",
    title: "Macchina del tempo",
    icon: History,
    hue: 250,
    short: (
      <p>
        Rivedere tutta l’operazione com’era a qualsiasi ora: la carta, i mezzi,
        il diario, il meteo… E <strong>riprodurla</strong> come un film,
        cambiamento dopo cambiamento.
      </p>
    ),
    guide: (
      <>
        <H>Tornare a un’ora precisa</H>
        <Steps>
          <li>
            Fate clic sull’orologio <Ui>Macchina del tempo</Ui> in alto a destra
            (oppure <K>⌘K</K> → « Macchina del tempo »). In basso appare una
            barra.
          </li>
          <li>
            Trascinate il cursore, oppure digitate una data e un’ora. Le piccole
            barre mostrano quando sono successe molte cose; i fiocchi di neve
            sono le istantanee della situazione.
          </li>
          <li>
            Consultate i moduli normalmente: tutto mostra lo stato di quell’ora.
            Nel passato non si può modificare nulla.
          </li>
          <li>
            <Ui>diretta</Ui> (pulsante viola) torna allo stato attuale.
          </li>
        </Steps>
        <H>Riprodurre l’operazione</H>
        <p>
          <Ui>▶</Ui> riproduce i cambiamenti uno per uno dall’inizio: gli
          oggetti appaiono e si spostano sulla carta, i mezzi cambiano stato, le
          cifre evolvono. Velocità <Ui>Lento</Ui>, <Ui>Normale</Ui> o{" "}
          <Ui>Veloce</Ui>; <Ui>«</Ui> e <Ui>»</Ui> avanzano di un cambiamento.
        </p>
        <H>Fissare un’istantanea della situazione</H>
        <Steps>
          <li>
            <Ui>Fissa</Ui> (nella barra del tempo, in <Ui>Tracciabilità</Ui>,
            oppure <K>⌘K</K> → « Fissa un’istantanea della situazione »).
          </li>
          <li>
            Date un nome: « Rapporto di condotta 14:00 ». L’ora proposta è
            quella visualizzata; potete cambiarla.
          </li>
          <li>
            Questo momento si sceglie poi con un clic per rivederlo,
            confrontarlo con adesso, presentarlo o esportarlo.
          </li>
        </Steps>
        <Example>
          <p>
            Il prefetto arriva alle 15 e chiede che cosa è cambiato dal rapporto
            delle 14: <Ui>Tracciabilità</Ui> → <Ui>Confronta</Ui> → « Da
            Rapporto di condotta 14:00 ». L’elenco mostra i mezzi impiegati, gli
            oggetti posati sulla carta e le nuove voci.
          </p>
        </Example>
      </>
    ),
    full: (
      <>
        <H>Che cosa viene ricostruito</H>
        <ul>
          <li>
            Tutti gli elementi: quelli creati dopo l’ora scelta scompaiono,
            quelli modificati riprendono i valori di allora, quelli eliminati
            nel frattempo ricompaiono.
          </li>
          <li>
            Il diario mostra le voci esistenti a quell’ora, nella loro versione
            di allora. Una voce eliminata non ritorna: il suo contenuto è
            cancellato per principio, resta solo la traccia della sua
            eliminazione.
          </li>
          <li>
            Il meteo mostra l’ultima previsione ricevuta prima di quell’ora.
          </li>
          <li>
            Dalla barra del tempo, <Ui>Esporta</Ui> e <Ui>Presenta</Ui>{" "}
            riprendono direttamente la versione visualizzata.
          </li>
        </ul>
        <Note kind="info">
          La macchina del tempo non cambia nulla per le altre postazioni:
          ciascuno può guardare il passato mentre gli altri continuano a
          lavorare in diretta.
        </Note>
      </>
    ),
  },
  {
    id: "exports",
    group: "together",
    title: "Esportare, stampare, importare",
    icon: FileDown,
    hue: 160,
    short: (
      <p>
        Il <strong>centro di esportazione</strong> produce con un clic tutta
        l’operazione o una parte, all’ora che scegliete, in quasi 30 formati:
        PowerPoint animato, PDF, Word, Excel, carta, archivio orion aic… Tutto è
        anche stampabile. Ogni file viene iscritto nel registro con la sua
        impronta, per poterlo verificare in seguito.
      </p>
    ),
    guide: (
      <>
        <H>Esportare in tre scelte</H>
        <Steps>
          <li>
            Aprite il centro di esportazione: titolo del diario in alto →{" "}
            <Ui>Esporta (tutti i formati)</Ui>, oppure <K>⌘K</K> → « Esporta ».
          </li>
          <li>
            <strong>Che cosa</strong>: <Ui>Tutta l’operazione</Ui>, oppure
            spuntate le parti desiderate (diario, carta, mezzi, meteo…).{" "}
            <Ui>Scegli elementi</Ui> permette di tenerne solo alcuni (tre
            oggetti della carta, una voce…).
          </li>
          <li>
            <strong>Quando</strong>: <Ui>Adesso</Ui>, un’
            <strong>istantanea</strong> (« Rapporto di condotta 14:00 ») oppure
            un’<strong>ora precisa</strong>. Il file mostra l’operazione com’era
            in quel momento.
          </li>
          <li>
            <strong>Formato</strong>: scegliete una scheda, poi <Ui>Scarica</Ui>{" "}
            o <Ui>Stampa</Ui>.
          </li>
        </Steps>
        <Example>
          <p>
            Per la visita del prefetto: Che cosa = Situazione, Carta, Mezzi;
            Quando = « Rapporto di condotta 14:00 »; Formato = PowerPoint
            animato. La presentazione è pronta, le animazioni partono da sole.
          </p>
        </Example>
        <H>Rivedere un’operazione su un’altra postazione</H>
        <Steps>
          <li>
            Esportate l’<strong>archivio orion aic</strong> (
            <code>.orionaic</code>, cifrato con una frase segreta) dell’intera
            operazione.
          </li>
          <li>
            Sull’altra postazione: pagina iniziale → <Ui>Importa</Ui>, oppure
            titolo del diario → <Ui>Importa un file</Ui>, poi{" "}
            <Ui>Diario separato</Ui>.
          </li>
          <li>
            C’è tutto, cronologia compresa: la <Ui>macchina del tempo</Ui>{" "}
            riproduce l’operazione dall’inizio alla fine.
          </li>
        </Steps>
        <H>Verificare un documento</H>
        <p>
          Ogni file porta a piè di pagina una riga « esportazione … · impronta …
          » e, quando lo spazio lo permette, un codice QR. In{" "}
          <Path
            steps={["Tracciabilità", "Esportazioni", "Verifica un documento"]}
          />
          , depositate il file ricevuto: orion aic dice se è autentico (chi lo
          ha esportato, quando, che cosa) o se è stato modificato nel frattempo.
        </p>
      </>
    ),
    full: (
      <>
        <H>I formati</H>
        <Table
          head={["Famiglia", "Formati", "A che cosa serve"]}
          rows={[
            [
              "Presentazione",
              "PowerPoint .pptx animato, OpenDocument .odp, PDF presentazione, HTML presentazione",
              "Presentare la situazione, con transizioni e apparizioni automatiche",
            ],
            [
              "Documenti stampabili",
              "PDF dossier, Word .docx, OpenDocument .odt, pagina HTML, Markdown, testo",
              "Dossier completo: copertina, indice, capitoli, carte, filigrana",
            ],
            [
              "Stampe A4",
              "Schede messaggi, diario in tabella, piano radio, etichette",
              "Le stampe abituali della postazione",
            ],
            [
              "Fogli di calcolo e dati",
              "Excel .xlsx, OpenDocument .ods, CSV, TSV, JSON",
              "Un foglio per parte, filtri, intestazione bloccata",
            ],
            [
              "Carta",
              "Immagine PNG di ogni carta, GeoJSON, KML (Google Earth), GPX (GPS)",
              "Trasmettere la carta a un partner o a un apparecchio",
            ],
            [
              "Agenda e contatti",
              "Agenda .ics, contatti vCard .vcf",
              "Importare in un’agenda o in un telefono",
            ],
            [
              "Archivio",
              "orion aic .orionaic (cifrato), JSON reimportabile",
              "Conservare o trasmettere l’intera operazione, cronologia compresa",
            ],
            [
              "Pacchetto completo",
              ".zip",
              "I formati principali in un colpo solo, con l’elenco delle impronte",
            ],
          ]}
        />
        <H>Opzioni</H>
        <ul>
          <li>
            <strong>Filigrana</strong>: « ESERCIZIO » e/o « CONFIDENZIALE » a
            seconda del diario, su ogni pagina e ogni diapositiva; si può
            togliere.
          </li>
          <li>
            <strong>Orientamento</strong> del PDF (verticale od orizzontale),{" "}
            <strong>versioni delle voci</strong> (tutto ciò che è stato
            corretto), <strong>animazioni</strong> delle presentazioni.
          </li>
          <li>
            Una parte assente da un formato è grigia: per esempio l’agenda .ics
            richiede la parte Ritmo di condotta.
          </li>
        </ul>
        <H>Registro e impronte</H>
        <ul>
          <li>
            Ogni esportazione viene iscritta in{" "}
            <Path steps={["Tracciabilità", "Esportazioni"]} />: chi, quando,
            quale contenuto, quale versione, nome del file e impronta SHA-256.
          </li>
          <li>
            Un file modificato, anche di un solo carattere, non ha più la stessa
            impronta: la verifica lo segnala.
          </li>
          <li>
            Il pacchetto completo iscrive ogni file che contiene, per poterli
            verificare separatamente.
          </li>
        </ul>
        <H>Importare e unire</H>
        <ul>
          <li>
            File accettati: <code>.orionaic</code>, <code>.orion</code>,{" "}
            <code>.json</code>, <code>.csv</code>, <code>.tsv</code>, al massimo
            32 MB. Il file viene letto sulla postazione, non viene inviato da
            nessuna parte.
          </li>
          <li>
            <Ui>Diario separato</Ui>: non viene toccato nulla, l’operazione
            importata si apre accanto.
          </li>
          <li>
            <Ui>Unisci</Ui>: le nuove voci vengono aggiunte e rinumerate; i
            doppioni esatti vengono ignorati; le eliminazioni fatte altrove si
            applicano; le cronologie vengono riunite.
          </li>
          <li>
            Per la carta, i file KML, KMZ, GeoJSON e GPX si importano dalla
            carta (<Ui>⋯</Ui> → <Ui>Importa</Ui>).
          </li>
        </ul>
        <Note kind="warn">
          Tutti i formati tranne <code>.orionaic</code> sono{" "}
          <strong>in chiaro</strong>. Per un diario confidenziale, orion aic
          chiede di confermarlo. Trasmettete la frase segreta di un archivio con
          un mezzo <strong>diverso</strong> dal file.
        </Note>
      </>
    ),
  },
];
