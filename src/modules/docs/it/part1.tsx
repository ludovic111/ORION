import { LayoutDashboard, LockKeyhole, Rocket } from "lucide-react";
import { mod, SITE, type Topic } from "../content";
import {
  Example,
  H,
  K,
  MessageFlow,
  Note,
  Path,
  ScreenMap,
  States,
  Steps,
  Table,
  Ui,
} from "../kit";

export const PART1: Topic[] = [
  // ---------------------------------------------------------------- start
  {
    id: "start",
    group: "start",
    title: "Primi passi",
    icon: Rocket,
    hue: 250,
    short: (
      <p>
        orion aic aiuta una cellula d’aiuto alla condotta a{" "}
        <strong>annotare tutto, seguire tutto e ritrovare tutto</strong> durante
        un esercizio o un intervento. Funziona nel browser, senza account:
        aprite <a href={SITE}>orionaic.xyz</a> e cominciate.
      </p>
    ),
    guide: (
      <>
        <H>Iniziare in 5 passi</H>
        <Steps>
          <li>
            <strong>Aprite il sito</strong> <a href={SITE}>{SITE}</a> su un
            computer, un tablet o un telefono. Per scoprirlo senza alcun
            rischio, fate clic su <Ui>Apri l’esercizio dimostrativo</Ui>: si
            carica un esercizio fittizio completo, «Piena dell’Arve».
          </li>
          <li>
            <strong>Create una sessione.</strong> Scheda <Ui>Nuova sessione</Ui>
            : il nome dell’evento (ad esempio «Piena dell’Arve»), il vostro nome
            o la vostra funzione, e la modalità <Ui>Esercizio</Ui> o{" "}
            <Ui>Intervento</Ui>.
          </li>
          <li>
            <strong>Proteggete i vostri dati.</strong> Lasciate selezionato{" "}
            <Ui>Salvataggio cifrato su questa postazione</Ui> e scegliete una{" "}
            <em>frase di recupero</em> di almeno 12 caratteri. Scrivetela in un
            luogo sicuro: nessuno potrà ritrovarla al posto vostro.
          </li>
          <li>
            <strong>Annotate il primo evento.</strong> Nel <Ui>Diario</Ui>,
            scrivete ciò che accade, poi <Ui>Salva</Ui> (oppure <K>⌘↵</K> /{" "}
            <K>Ctrl+↵</K>). La voce riceve un numero: #001.
          </li>
          <li>
            <strong>Invitate le altre postazioni</strong> (se siete in più).{" "}
            <Path
              steps={[
                "Impostazioni",
                "Sincronizzazione",
                "Crea un codice di sessione",
              ]}
            />
            . Sull’altra postazione: <Ui>Unisciti</Ui>, poi il codice. Ecco,
            lavorate insieme.
          </li>
        </Steps>
        <Example>
          <p>
            Ore 14:05, la Pattuglia Alpha annuncia via radio: «L’Arve straripa
            al quai des Acacias, 30 cm d’acqua sulla strada.» Lo scrivete nel
            diario, tipo <Ui>Informazione</Ui>, priorità <Ui>Urgente</Ui>,
            mittente «Pattuglia Alpha». È salvato, numerato e visibile su tutte
            le postazioni.
          </p>
        </Example>
        <Note kind="tip">
          Vi siete persi? Il pulsante <Ui>?</Ui> in alto su ogni pagina apre
          l’aiuto di quella pagina. E <K>⌘K</K> / <K>Ctrl+K</K> trova qualsiasi
          cosa: una voce, un mezzo, un’azione.
        </Note>
      </>
    ),
    full: (
      <>
        <H>Scegliere quanto aiuto</H>
        <p>
          In alto in questa pagina, tre pulsanti regolano il livello di
          dettaglio per tutta la documentazione: <Ui>In breve</Ui> (a cosa
          serve, in due frasi), <Ui>Guida</Ui> (i passi per i compiti
          principali) e <Ui>Tutti i dettagli</Ui> (ogni campo, ogni opzione,
          ogni limite). Ogni argomento ha anche il proprio pulsante{" "}
          <Ui>Più dettagli</Ui> per approfondire un solo punto. La vostra scelta
          viene memorizzata su questa postazione.
        </p>
        <H>La pagina iniziale</H>
        <Table
          head={["Pulsante", "Quando usarlo"]}
          rows={[
            [
              <Ui>Riprendi</Ui>,
              "Una sessione cifrata è già salvata su questa postazione: digitate la frase di recupero, poi Sblocca.",
            ],
            [<Ui>Nuova sessione</Ui>, "Inizia un nuovo evento."],
            [
              <Ui>Unisciti</Ui>,
              "Un’altra postazione ha già la sessione e vi ha dato il suo codice (o il suo codice QR).",
            ],
            [
              <Ui>Importa</Ui>,
              "Avete ricevuto un file .orionaic, .orion, .json o .csv.",
            ],
            [
              <Ui>Apri l’esercizio dimostrativo</Ui>,
              "Per imparare o mostrare lo strumento, senza toccare i vostri dati.",
            ],
          ]}
        />
        <H>Che cosa serve</H>
        <ul>
          <li>
            Un browser recente: Chrome, Edge, Firefox o Safari, su computer,
            tablet o telefono.
          </li>
          <li>
            Un indirizzo in <code>https://</code> (è il caso di{" "}
            <a href={SITE}>orionaic.xyz</a>): la cifratura del browser funziona
            solo così.
          </li>
          <li>
            Internet al primo caricamento. In seguito, l’applicazione resta
            disponibile offline.
          </li>
        </ul>
        <H>A fine impiego</H>
        <Steps>
          <li>
            Chiudete il diario:{" "}
            <Path steps={["Impostazioni", "Sessione e diario"]} />. Passa in
            sola lettura.
          </li>
          <li>
            Esportate un archivio <code>.orionaic</code> (cifrato) di ogni
            diario e conservatelo secondo le regole della vostra organizzazione.
          </li>
          <li>
            Cancellate la sessione dalla postazione:{" "}
            <Path
              steps={[
                "Impostazioni",
                "Sessione e diario",
                "Cancella la sessione",
              ]}
            />
            . orion aic verifica che esista un archivio recente, poi chiede di
            digitare <code>TERMINA</code>.
          </li>
        </Steps>
      </>
    ),
  },
  {
    id: "interface",
    group: "start",
    title: "Lo schermo in un colpo d’occhio",
    icon: LayoutDashboard,
    hue: 212,
    short: (
      <p>
        In alto, la barra: il diario attivo, la ricerca e lo stato della
        postazione. A sinistra (in basso sul telefono), il <strong>dock</strong>{" "}
        con tutti i moduli. Al centro, la pagina del modulo scelto.
      </p>
    ),
    guide: (
      <>
        <ScreenMap />
        <ol className="docs-legend">
          <li>
            <strong>Logo</strong>: torna alla pagina Situazione.
          </li>
          <li>
            <strong>Diario attivo</strong> (titolo e modalità). Un clic apre il
            menu dei diari: cambiare diario, <Ui>Nuovo diario</Ui>,{" "}
            <Ui>Importa un file</Ui>, <Ui>Esporta (tutti i formati)</Ui>,{" "}
            <Ui>Proprietà, chiusura</Ui>,{" "}
            <Ui>Rimuovi questo diario dalla sessione</Ui>.
          </li>
          <li>
            <strong>Cerca o agisci</strong> (<K>⌘K</K> / <K>Ctrl+K</K>):
            digitate qualche lettera per trovare un elemento, un modulo o
            un’azione.
          </li>
          <li>
            <strong>Sincronizzazione</strong>: <Ui>Da solo</Ui> quando lavorate
            da soli, <Ui>3 postazioni</Ui> con le iniziali di ciascuno quando
            siete in più, <Ui>Riconnessione</Ui> se il collegamento è
            interrotto.
          </li>
          <li>
            <strong>Salvataggio</strong>: <Ui>Cifrato</Ui> (verde, tutto è
            conservato sulla postazione) o <Ui>Temporaneo</Ui> (arancione, perso
            alla chiusura della scheda).
          </li>
          <li>
            <strong>Ora svizzera</strong> e pulsante{" "}
            <strong>tema chiaro / scuro</strong>.
          </li>
          <li>
            <strong>Menu operatore</strong> (le vostre iniziali): impostazioni
            della postazione, elenchi di riferimento, sincronizzazione,
            sessione, sicurezza, installazione, codice sorgente, blocco.
          </li>
          <li>
            <strong>Dock</strong>: un clic = un modulo. Un pallino{" "}
            <span className="docs-dot crit" /> rosso segnala scadenze superate;
            un pallino <span className="docs-dot accent" /> viola, nuovi
            messaggi.
          </li>
          <li>
            <strong>Pulsante ?</strong>: l’aiuto sulla pagina in cui vi trovate.
          </li>
        </ol>
      </>
    ),
    full: (
      <>
        <H>Dettagli utili</H>
        <ul>
          <li>
            Al passaggio del mouse, ogni icona del dock mostra il nome del
            modulo e una frase che spiega a cosa serve.
          </li>
          <li>
            I moduli che non usate possono essere nascosti:{" "}
            <Path
              steps={[
                "Impostazioni",
                "Questa postazione",
                "Moduli visualizzati",
              ]}
            />
            . Situazione, Diario e Aiuto restano sempre visibili. Nascondere un
            modulo non elimina alcun dato.
          </li>
          <li>
            Se la connessione internet cade, compare l’indicatore{" "}
            <Ui>Offline</Ui>. Potete continuare a lavorare.
          </li>
          <li>
            Quando è disponibile una nuova versione, un banner lo segnala. In
            sessione temporanea, esportate prima di ricaricare la pagina.
          </li>
          <li>
            Il titolo della scheda del browser mostra il numero di scadenze
            superate, ad esempio <code>(3)</code>: visibile anche quando siete
            in un’altra finestra.
          </li>
          <li>
            Da tastiera, la prima pressione su <K>Tab</K> propone{" "}
            <Ui>Vai al contenuto</Ui> per saltare direttamente alla pagina.
          </li>
          <li>
            In fondo al menu operatore: la versione, lo stato offline e il
            numero di radio consegnate.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "session",
    group: "start",
    title: "Sessione, diari e salvataggio",
    icon: LockKeyhole,
    hue: 200,
    short: (
      <p>
        Una <strong>sessione</strong> corrisponde a un evento; contiene uno o
        più <strong>diari</strong>. I vostri dati restano in questo browser:
        cifrati se avete scelto una frase di recupero, altrimenti temporanei.
      </p>
    ),
    guide: (
      <>
        <H>Due modi di conservare i dati</H>
        <Table
          head={["", "Salvataggio cifrato", "Sessione temporanea"]}
          rows={[
            ["Dove?", "Nel browser, sotto chiave", "Solo nella scheda aperta"],
            ["Chiudere la scheda", "Non si perde nulla", "Si perde tutto"],
            ["Per tornare", "Frase di recupero", "Importare un file esportato"],
            [
              "Barra in alto",
              <span className="pill ok">Cifrato</span>,
              <span className="pill warn">Temporaneo</span>,
            ],
          ]}
        />
        <Note kind="warn">
          La frase di recupero non è registrata da nessuna parte. Se la
          dimenticate, nessuno, nemmeno gli autori di orion aic, può riaprire la
          sessione. Conservate anche delle esportazioni.
        </Note>
        <H>Lavorare con più diari</H>
        <Steps>
          <li>Fate clic sul titolo del diario, in alto sullo schermo.</li>
          <li>
            Scegliete un diario nell’elenco per passarvi, oppure{" "}
            <Ui>Nuovo diario</Ui> per crearne uno (ad esempio un diario separato
            per l’esercizio del giorno dopo).
          </li>
          <li>
            Il diario attivo è quello che vedete e completate; gli altri restano
            intatti.
          </li>
        </Steps>
        <H>Fare una pausa o terminare</H>
        <ul>
          <li>
            <Ui>Blocca</Ui> (menu operatore): la sessione lascia lo schermo e
            resta cifrata sulla postazione. Per tornare: <Ui>Riprendi</Ui> e la
            frase.
          </li>
          <li>
            <strong>Chiudere un diario</strong>:{" "}
            <Path steps={["Impostazioni", "Sessione e diario"]} />. Un diario
            chiuso si legge, si consulta, si stampa e si esporta, ma non si
            modifica più. Lo si può riaprire.
          </li>
        </ul>
      </>
    ),
    full: (
      <>
        <H>Proprietà di un diario</H>
        <Table
          head={["Campo", "Spiegazione"]}
          rows={[
            [
              "Evento",
              "Il nome, unico campo obbligatorio. Es. «Piena dell’Arve».",
            ],
            ["Organizzazione", "Es. «PCi Carouge»."],
            ["Luogo / settore", "Dove si svolge l’evento."],
            [
              "Riferimento",
              "Numero dell’evento o della pratica, se ne avete uno.",
            ],
            [
              "Modalità",
              "Esercizio o Intervento. Visibile in alto sullo schermo e sulle schede stampate.",
            ],
            [
              "Diffusione",
              "Interno o Confidenziale, richiamato sui documenti.",
            ],
          ]}
        />
        <p>
          Tutto si modifica in{" "}
          <Path steps={["Impostazioni", "Sessione e diario"]} />, dove cambiate
          anche il nome dell’operatore, il salvataggio cifrato, la chiusura e la
          riapertura.
        </p>
        <H>Che cosa succede dietro le quinte</H>
        <ul>
          <li>
            Ogni modifica è salvata un quarto di secondo dopo l’ultima
            battitura, bozza compresa.
          </li>
          <li>
            La stessa sessione salvata non può essere aperta in due schede
            contemporaneamente.
          </li>
          <li>
            Un browser conserva <strong>una</strong> sessione cifrata. Se vi
            unite a un’altra sessione su una postazione che ne ha già una, la
            nuova resta temporanea: esportatela regolarmente.
          </li>
          <li>
            L’applicazione installata (sulla schermata iniziale) ha i propri
            dati, separati da quelli della scheda del browser.
          </li>
          <li>
            Cancellare i dati del browser cancella il salvataggio. Un
            salvataggio sulla postazione non è un archivio: esportate.
          </li>
        </ul>
        <H>Frase dimenticata</H>
        <p>
          Nella pagina iniziale, <Ui>Frase persa</Ui> permette di cancellare lo
          spazio cifrato di questo browser (occorre digitare{" "}
          <code>CANCELLA</code>). I dati tornano allora solo da un archivio
          esportato, o da un’altra postazione sincronizzata che ha la sessione.
        </p>
        <H>Cancellare la sessione</H>
        <p>
          <Path
            steps={[
              "Impostazioni",
              "Sessione e diario",
              "Cancella la sessione",
            ]}
          />{" "}
          elimina tutto dalla postazione. orion aic esige prima un archivio
          recente di ogni diario, poi l’immissione di <code>TERMINA</code>.
        </p>
        <H>Limiti</H>
        <p>
          10 000 voci per diario, 500 versioni per voce, 12 000 caratteri per
          messaggio, file importati di 32 MB al massimo. Niente allegati (foto,
          PDF): annotatene il riferimento.
        </p>
      </>
    ),
  },

  // ---------------------------------------------------------------- modules
  {
    id: "situation",
    group: "modules",
    ...mod("situation", "Apri la situazione"),
    short: (
      <p>
        La pagina principale: l’essenziale dell’evento su un solo schermo, per
        capire la situazione in dieci secondi.
      </p>
    ),
    guide: (
      <>
        <H>Che cosa vi vedete</H>
        <ul>
          <li>
            <strong>Informazioni chiave</strong>: le cifre che contano (persone
            evacuate, edifici colpiti, livello dell’acqua…).
          </li>
          <li>
            <strong>Tabelle della situazione</strong>: quattro testi brevi,
            situazione generale, pericoli, intenzione, punti aperti.
          </li>
          <li>
            I <strong>punti aperti del diario</strong> e gli{" "}
            <strong>ultimi messaggi</strong>.
          </li>
          <li>
            I <strong>mezzi</strong> per stato, le <strong>presenze</strong>, le{" "}
            <strong>radio</strong> consegnate.
          </li>
          <li>
            I <strong>prossimi appuntamenti</strong> con il loro conto alla
            rovescia, il <strong>meteo</strong> e un’anteprima della{" "}
            <strong>rete dei collegamenti</strong>.
          </li>
        </ul>
        <H>Aggiornare un’informazione chiave</H>
        <Steps>
          <li>
            Fate clic su <Ui>+</Ui> o <Ui>−</Ui> accanto alla cifra per
            regolarla in un attimo.
          </li>
          <li>
            Oppure fate clic sull’informazione per inserire un valore, un’unità,
            un’osservazione.
          </li>
          <li>
            Per aggiungerne: <Ui>Aggiungi</Ui>, oppure scegliete tra le
            informazioni <Ui>standard</Ui> proposte.
          </li>
        </Steps>
        <Example>
          <p>
            Un nuovo bus di evacuazione parte dal quartiere des Acacias con 14
            persone: un clic su <Ui>+</Ui> quattordici volte, oppure un clic
            sulla cifra per digitare direttamente 42.
          </p>
        </Example>
      </>
    ),
    full: (
      <>
        <H>Buon uso</H>
        <ul>
          <li>
            Scrivete le tabelle della situazione in frasi brevi. Servono da base
            per i rapporti e per l’avvicendamento.
          </li>
          <li>
            Ogni riquadro è cliccabile: apre l’elemento o il modulo
            corrispondente (un mezzo, un messaggio, il diario filtrato…).
          </li>
          <li>
            I punti aperti del diario sono le voci il cui seguito è{" "}
            <Ui>Da trattare</Ui> o <Ui>In corso</Ui>.
          </li>
          <li>
            Le categorie di informazioni provengono dagli elenchi di
            riferimento:{" "}
            <Path steps={["Impostazioni", "Elenchi di riferimento"]} />. Potete
            anche digitare qualsiasi etichetta.
          </li>
          <li>
            Con la sincronizzazione, la pagina si aggiorna in diretta su tutte
            le postazioni.
          </li>
        </ul>
        <Note kind="tip">
          Visualizzata su un grande schermo o un proiettore, la pagina
          Situazione funge da cruscotto per i rapporti di condotta.
        </Note>
      </>
    ),
  },
  {
    id: "journal",
    group: "modules",
    ...mod("journal", "Apri il diario"),
    short: (
      <p>
        Il registro ufficiale: ogni informazione, decisione o missione vi è
        annotata, <strong>numerata</strong> (#001, #002…) e{" "}
        <strong>datata</strong> con l’ora. Nulla scompare senza lasciare
        traccia.
      </p>
    ),
    guide: (
      <>
        <H>Registrare una voce</H>
        <Steps>
          <li>
            Aprite il diario. Il modulo <Ui>Nuova voce</Ui> è pronto (sul
            telefono: il pulsante rotondo <Ui>+</Ui>).
          </li>
          <li>
            Scegliete il <strong>tipo</strong> (Informazione, Decisione,
            Missione…) e la <strong>priorità</strong> (Normale, Importante,
            Urgente).
          </li>
          <li>
            Scrivete il <strong>messaggio</strong>. È l’unico campo
            obbligatorio.
          </li>
          <li>
            Se lo sapete: il <strong>mittente</strong> (i nominativi sono
            proposti fin dalle prime lettere), l’ora dell’evento, il luogo.
          </li>
          <li>
            <Ui>Salva</Ui>, oppure <K>⌘↵</K> / <K>Ctrl+↵</K>. La voce riceve il
            suo numero.
          </li>
        </Steps>
        <Example>
          <p>
            <span className="mono">14:05 · #012 · Informazione · Urgente</span>
            <br />
            Mittente: Pattuglia Alpha. «L’Arve straripa al quai des Acacias, 30
            cm d’acqua sulla strada.»
          </p>
        </Example>
        <H>Seguire una missione fino in fondo</H>
        <Steps>
          <li>
            Per una missione o una richiesta, impostate il{" "}
            <strong>seguito</strong> su <Ui>Da trattare</Ui>, indicate un{" "}
            <strong>responsabile</strong> e una <strong>scadenza</strong>.
          </li>
          <li>
            Quando arriva la risposta, aprite la voce e fate clic su{" "}
            <Ui>Registra un seguito</Ui>: viene preparata una quittanza che cita
            la voce d’origine.
          </li>
          <li>
            Al salvataggio, un banner propone di chiudere la missione:{" "}
            <Ui>Segna come concluso</Ui>.
          </li>
        </Steps>
        <Note kind="tip">
          I <strong>modelli</strong> sopra il modulo (Punto della situazione,
          Richiesta di mezzi, Missione, Decisione, Quittanza, Controllo dei
          collegamenti) compilano il tipo, la priorità e uno schema da
          completare.
        </Note>
        <H>Stampa automatica</H>
        <p>
          Sotto il modulo, l’interruttore <Ui>Stampa automatica</Ui> invia ogni
          voce salvata alla stampante, come scheda A4, non appena è registrata.
        </p>
      </>
    ),
    full: (
      <>
        <H>I campi di una voce</H>
        <Table
          head={["Gruppo", "Campi"]}
          rows={[
            [
              "Essenziale",
              "Tipo, priorità, messaggio (obbligatorio), ora dell’evento, mittente",
            ],
            [
              "Trasmissione e luogo",
              "Canale, conferma, destinatario, luogo / settore, coordinate (MN95), ora di ricezione",
            ],
            [
              "Condotta e seguito",
              "Misura / decisione / missione, seguito, responsabile, scadenza, mezzi impiegati / bisogni",
            ],
            [
              "Complementi",
              "Riferimento / voce collegata, osservazioni, parole chiave (20 al massimo)",
            ],
            [
              "Automatico",
              "Numero, autore, ora di registrazione, cronologia delle versioni",
            ],
          ]}
        />
        <Table
          head={["Elenco", "Valori"]}
          rows={[
            [
              "Tipo",
              "Informazione, Decisione, Missione, Richiesta, Quittanza, Osservazione, Avvicendamento",
            ],
            ["Priorità", "Normale, Importante, Urgente"],
            [
              "Seguito",
              "Registrato, Da trattare, In corso, Concluso, Annullato",
            ],
            ["Canale", "Radio, Telefono, Sul posto, E-mail, Messaggio, Altro"],
            ["Conferma", "Non confermato, Confermato, Da verificare"],
          ]}
        />
        <H>Tre orari diversi</H>
        <p>
          L’<strong>evento</strong> (quando è successo), la{" "}
          <strong>ricezione</strong> (quando l’informazione vi è giunta) e la{" "}
          <strong>registrazione</strong> (automatica). Esempio: la diga cede
          alle 13:50, la pattuglia lo annuncia alle 14:05, voi lo scrivete alle
          14:07. Gli orari sono visualizzati all’ora svizzera.
        </p>
        <H>Modelli</H>
        <Table
          head={["Modello", "Che cosa prepara"]}
          rows={[
            [
              "Punto della situazione",
              "Informazione: situazione, misure adottate, mezzi impiegati, bisogni, prossimo punto",
            ],
            [
              "Richiesta di mezzi",
              "Richiesta, Da trattare, Importante: mezzi, quantità, luogo di consegna, termine, motivo",
            ],
            [
              "Missione",
              "Missione, Da trattare, misura «Quittanzare l’esecuzione al PC»",
            ],
            ["Decisione", "Decisione, In corso, Confermato"],
            [
              "Quittanza",
              "Quittanza, Confermato, riferimento «Seguito di #» da completare",
            ],
            [
              "Controllo dei collegamenti",
              "Osservazione, canale Radio, parola chiave radio",
            ],
          ]}
        />
        <p>
          Se un messaggio è già in corso di immissione, orion aic chiede
          conferma prima di sostituirlo.
        </p>
        <H>Voci collegate e filo</H>
        <p>
          Una voce ne cita un’altra con il suo numero in{" "}
          <Ui>Riferimento / voce collegata</Ui>: <code>Seguito di #003</code>,{" "}
          <code>#012, #014</code>. La riga mostra allora <code>↳ #003</code>, e
          il dettaglio mostra il <strong>filo</strong> completo: richiesta →
          missione → quittanza, in ordine, cliccabile.
        </p>
        <H>Scadenze e allarme</H>
        <ul>
          <li>
            Un banner elenca le scadenze <strong>superate</strong> (rosso) e
            quelle dei <strong>prossimi 15 minuti</strong> (arancione).
          </li>
          <li>
            Azioni dirette: <Ui>+15 min</Ui> (rinvia, con un motivo annotato),{" "}
            <Ui>Concluso</Ui>, oppure clic per aprire la voce.
          </li>
          <li>
            L’icona della campanella attiva un allarme sonoro (due bip) a ogni
            nuova scadenza superata.
          </li>
          <li>Le scadenze sono verificate ogni 30 secondi.</li>
        </ul>
        <H>Modificare, annullare, eliminare</H>
        <ul>
          <li>
            <strong>Modificare</strong> (matita): tutto si può modificare. La
            versione precedente è conservata (pulsante <Ui>Versioni</Ui>, riga
            contrassegnata <code>v2</code>). Il motivo è facoltativo.
          </li>
          <li>
            <strong>Annullare</strong> un’informazione senza cancellarla:
            impostate il seguito su <Ui>Annullato</Ui>. Resta leggibile,
            barrata.
          </li>
          <li>
            <strong>Eliminare</strong> (cestino) richiede un motivo («Immissione
            doppia»). Resta una traccia (numero, ora, autore, motivo)
            consultabile in fondo alla tabella. Il numero non viene mai
            riutilizzato.
          </li>
        </ul>
        <Note kind="warn">
          Un archivio esportato prima dell’eliminazione contiene sempre la voce.
          Distruggetelo se necessario.
        </Note>
        <H>Ritrovare un’informazione</H>
        <ul>
          <li>
            Filtri: Tutto, Da seguire, Urgente, Decisioni. Filtro per giorno,
            ordinamento, raggruppamento per giorno.
          </li>
          <li>Ricerca in tutti i campi, senza tenere conto degli accenti.</li>
          <li>
            Indicatori: voci, punti da seguire, scadenze superate, urgenze,
            radio in servizio, stato dell’archivio.
          </li>
        </ul>
        <H>Rapporto, avvicendamento, schede</H>
        <ul>
          <li>
            <Ui>Rapporto</Ui>: rapporto sulla situazione A4 su 1 h, 4 h, 12 h,
            24 h, tutto o un periodo libero (sintesi, fatti salienti, decisioni
            e missioni, richieste, punti aperti, mezzi, stato radio, cronologia
            facoltativa).
          </li>
          <li>
            <Ui>Avvicendamento</Ui>: riassume ciò che occorre trasmettere
            (seguiti da dare, scadenze superate, informazioni da confermare,
            radio consegnate) e prepara una voce di tipo Avvicendamento.
          </li>
          <li>
            <Ui>Scheda A4</Ui>: una scheda per voce, con caselle per il visto e
            la firma. Selezionate più righe per stampare più schede.
          </li>
        </ul>
        <H>Stampa automatica, in dettaglio</H>
        <p>
          L’interruttore sotto il modulo stampa ogni voce registrata su{" "}
          <strong>questa</strong> postazione. Per una postazione di stampa
          centrale, attivate anche{" "}
          <Path
            steps={[
              "Impostazioni",
              "Questa postazione",
              "Stampa anche le voci delle altre postazioni",
            ]}
          />
          : ogni voce ricevuta tramite sincronizzazione vi viene stampata.
          Vedere anche l’argomento «Stampa».
        </p>
      </>
    ),
  },
  {
    id: "messages",
    group: "modules",
    ...mod("messages", "Apri i messaggi"),
    short: (
      <p>
        La casella di posta in arrivo del PC: vi si inserisce ogni messaggio che
        arriva, così com’è, poi se ne fa una sintesi chiara per il diario.
      </p>
    ),
    guide: (
      <>
        <MessageFlow />
        <H>Ricevere un messaggio</H>
        <Steps>
          <li>
            <Ui>Nuovo messaggio</Ui> (oppure <K>⌘K</K> → «Nuovo messaggio
            ricevuto»).
          </li>
          <li>
            Compilate ciò che sapete: <Ui>Da</Ui>, <Ui>A</Ui>, <Ui>Canale</Ui>,{" "}
            <Ui>Priorità</Ui>, <Ui>Categoria</Ui>. I valori abituali sono
            proposti con un clic; potete sempre scrivere qualcos’altro.
          </li>
          <li>
            Scrivete l’<Ui>Oggetto</Ui> e il <Ui>Messaggio</Ui>, parola per
            parola se possibile.
          </li>
          <li>
            <Ui>Salva</Ui>: il messaggio arriva nella colonna <Ui>Nuovo</Ui>, e
            un pallino viola compare sul dock.
          </li>
        </Steps>
        <H>Trattare un messaggio</H>
        <States
          steps={["Nuovo", "In elaborazione", "Trasmesso", "Archiviato"]}
        />
        <Steps>
          <li>
            <Ui>Prendere in carico</Ui>: il messaggio passa in elaborazione, le
            altre postazioni vedono che qualcuno se ne occupa.
          </li>
          <li>
            <Ui>Registra nel diario</Ui>: si apre una finestra di sintesi, già
            compilata. Accorciate, chiarite, confermate. Viene creata una voce
            del diario, collegata al messaggio, che passa a <Ui>Trasmesso</Ui>.
          </li>
          <li>
            <Ui>Archiviare</Ui> quando non c’è più nulla da fare.
          </li>
        </Steps>
        <Example>
          <p>
            Messaggio ricevuto: «Qui Pattuglia Alpha per PC Carouge, allora
            siamo al quai, l’acqua passa sopra, ci sono tre auto parcheggiate,
            abbiamo bisogno di una pompa.» Sintesi nel diario: «Quai des Acacias
            inondato, 3 veicoli minacciati. Richiesta 1 motopompa.»
          </p>
        </Example>
      </>
    ),
    full: (
      <>
        <H>I campi</H>
        <Table
          head={["Campo", "Spiegazione"]}
          rows={[
            [
              "Da / A",
              "Mittente e destinatario. Valori standard: PC avanzato, PC arretrato, cellule, polizia…",
            ],
            ["Canale", "Radio, telefono, e-mail, messaggero, sul posto, SMS…"],
            ["Priorità", "Per far risaltare ciò che è urgente."],
            [
              "Categoria",
              "Informazione, richiesta, ordine / missione, resoconto, allerta, quittanza… con un clic, o testo libero.",
            ],
            [
              "Oggetto",
              "Qualche parola per riconoscere il messaggio nell’elenco.",
            ],
            ["Messaggio", "Il testo, così come ricevuto."],
            ["Luogo", "Dove succede. Potrà essere posizionato sulla carta."],
            [
              "Risposta attesa",
              "Da selezionare se il mittente attende un riscontro, con una scadenza.",
            ],
          ]}
        />
        <H>Tutte le azioni</H>
        <ul>
          <li>
            <strong>Modelli</strong>: resoconto, richiesta di mezzi, allerta,
            informazione, quittanza… preparano il testo.
          </li>
          <li>
            <strong>Tabella o elenco</strong>: trascinate un messaggio da una
            colonna all’altra, oppure usate la vista a elenco.
          </li>
          <li>
            <Ui>Registrare così com’è</Ui>: crea la voce del diario senza
            passare dalla sintesi, per un messaggio già chiaro.
          </li>
          <li>
            <Ui>Riaprire</Ui> un messaggio archiviato,{" "}
            <strong>modificarlo</strong> o <strong>eliminarlo</strong>.
          </li>
          <li>
            <Ui>Scheda A4</Ui>: il modulo del messaggio stampato. Per stampare
            ogni messaggio non appena inserito:{" "}
            <Path
              steps={[
                "Impostazioni",
                "Questa postazione",
                "Stampa ogni nuovo messaggio ricevuto",
              ]}
            />
            .
          </li>
        </ul>
        <Note kind="info">
          Perché due passaggi? Il messaggio conserva la traccia grezza di ciò
          che è stato detto; il diario conserva la versione chiara e ufficiale.
          I due restano collegati: dall’uno si ritrova l’altro con un clic.
        </Note>
        <p>
          I valori standard (destinatari e mittenti, categorie, canali) si
          modificano in{" "}
          <Path steps={["Impostazioni", "Elenchi di riferimento"]} />.
        </p>
      </>
    ),
  },
  {
    id: "missions",
    group: "modules",
    ...mod("missions", "Apri le missioni"),
    short: (
      <p>
        Una tabella che mostra in un colpo d’occhio tutto ciò che resta da fare:
        missioni, richieste e punti da seguire, ordinati per stato.
      </p>
    ),
    guide: (
      <>
        <States
          steps={["Da trattare", "In corso", "Concluso"]}
          extra={["Annullato"]}
        />
        <H>Far avanzare una missione</H>
        <Steps>
          <li>
            <Ui>Nuova missione / richiesta</Ui>: scrivetela, scegliete un
            responsabile e una scadenza. Compare in <Ui>Da trattare</Ui>.
          </li>
          <li>
            Quando qualcuno se ne fa carico, trascinate la scheda in{" "}
            <Ui>In corso</Ui>.
          </li>
          <li>
            Serve più tempo? <Ui>+15 min</Ui> posticipa la scadenza.
          </li>
          <li>
            Quando arriva il resoconto: <Ui>Registra un seguito</Ui>, poi
            trascinate la scheda in <Ui>Concluso</Ui>.
          </li>
        </Steps>
        <Note kind="info">
          Ogni scheda è una voce del diario. Spostarla cambia il suo seguito nel
          diario, con la sua cronologia.
        </Note>
      </>
    ),
    full: (
      <>
        <H>Dettagli</H>
        <ul>
          <li>
            Filtri: per <strong>tipo</strong> (missione, richiesta…), per{" "}
            <strong>responsabile</strong>, e solo <strong>in ritardo</strong>.
          </li>
          <li>Una scheda la cui scadenza è superata risalta in rosso.</li>
          <li>
            Le voci semplicemente «registrate» (senza seguito) non compaiono
            qui: restano nel diario.
          </li>
          <li>
            Un clic su una scheda apre la voce completa: testo, filo delle voci
            collegate, versioni.
          </li>
        </ul>
        <Example>
          <p>
            #015 «Squadra Bravo: posare sacchi di sabbia in rue des Acacias,
            scadenza 15:00». Alle 14:55 la squadra ha bisogno di un quarto
            d’ora: <Ui>+15 min</Ui>. Alle 15:10, quittanza ricevuta:{" "}
            <Ui>Registra un seguito</Ui>, e la scheda passa a Concluso.
          </p>
        </Example>
      </>
    ),
  },
];
