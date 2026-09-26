import { KeyRound, Tv } from "lucide-react";
import type { Topic } from "../content";
import { moduleInfo } from "../../../app/modules";
import { Faq, H, K, Note, Path, Steps, Table, Ui } from "../kit";

// Help topics of the exercises, the debriefing, the wall screen and the
// signature of the exports (Italian).

const debrief = moduleInfo("debrief");

export const EXERCISE_TOPICS: Topic[] = [
  {
    id: "debrief",
    group: "modules",
    module: "debrief",
    icon: debrief.icon,
    hue: debrief.hue,
    title: debrief.label,
    openLabel: "Apri il debriefing",
    short: (
      <p>
        Dopo un esercizio o un intervento, si guarda che cosa è successo per
        fare meglio la volta successiva: è il debriefing (analisi
        dell’esperienza). orion aic rigioca l’operazione, calcola le cifre della
        condotta e conserva i punti da ricordare.
      </p>
    ),
    guide: (
      <>
        <H>Rigiocare l’operazione</H>
        <Steps>
          <li>
            Aprite <Ui>Debriefing ed esercizio</Ui> (icona appunti, in fondo al
            dock).
          </li>
          <li>
            Premete <Ui>Rigiocare ×60</Ui>: un minuto dell’operazione passa in
            un secondo. <Ui>Rigiocare ×10</Ui> va più lentamente.
          </li>
          <li>
            Durante la riproduzione, aprite la carta, il diario o i mezzi: tutto
            si muove insieme, come un film dell’operazione.
          </li>
          <li>
            La barra in basso mette in pausa, cambia la velocità o torna alla
            diretta (<Ui>Torna alla diretta</Ui>).
          </li>
        </Steps>
        <H>Leggere le cifre</H>
        <Table
          head={["Cifra", "Che cosa significa"]}
          rows={[
            [
              "Reazione mediana",
              "Tempo abituale tra l’arrivo di un inject e la prima reazione (esercizio).",
            ],
            [
              "Inject in ritardo",
              "Inject la cui reazione è arrivata dopo il termine previsto, o non è ancora arrivata.",
            ],
            [
              "Scadenze superate",
              "Voci del diario concluse dopo la loro scadenza, o ancora aperte dopo.",
            ],
            ["Ritardo cumulato", "Tutti i ritardi sommati."],
            [
              "Trattamento di un messaggio",
              "Tempo tra la ricezione di un messaggio e il suo trattamento: preso in carico, registrato nel diario o collegato a una voce.",
            ],
            ["Voci per ora", "Il ritmo del diario, ora per ora."],
            [
              "Chi ha fatto cosa",
              "Voci, correzioni, messaggi e altre modifiche di ogni persona.",
            ],
          ]}
        />
        <H>Annotare i punti da ricordare</H>
        <Steps>
          <li>
            In <Ui>Punti positivi</Ui>, scrivete ciò che ha funzionato bene; in{" "}
            <Ui>Da migliorare</Ui>, ciò che bisognerà fare diversamente.
          </li>
          <li>
            Il settore è facoltativo (trasmissioni, logistica…). Premete{" "}
            <Ui>Aggiungi</Ui>.
          </li>
          <li>
            I punti si aggiungono anche quando il diario è chiuso: il debriefing
            ha luogo spesso dopo.
          </li>
        </Steps>
        <H>Esportare il debriefing</H>
        <p>
          I pulsanti <Ui>PDF</Ui> e <Ui>Word</Ui> aprono il centro di
          esportazione con la parte <Ui>Esercizio e debriefing</Ui>: cifre,
          tabelle e punti da ricordare, in un documento firmato.
        </p>
      </>
    ),
    full: (
      <>
        <H>Come viene misurata la reazione</H>
        <ul>
          <li>
            Un inject arrivato in Messaggi conta come trattato non appena il suo
            messaggio lascia lo stato « Nuovo », è registrato nel diario o è
            collegato a una voce o a una missione. Conta la prima di queste ore.
          </li>
          <li>
            La direzione può anche annotare la reazione a mano (pulsante{" "}
            <Ui>Reazione</Ui>): utile per un inject letto ad alta voce o una
            reazione via radio.
          </li>
          <li>
            I giocatori vedono nel debriefing solo gli inject già giocati: i
            successivi restano una sorpresa.
          </li>
        </ul>
        <H>Tutti i calcoli</H>
        <p>
          Le cifre sono calcolate sulla postazione, a partire dalla cronologia
          del diario: sono le stesse su tutte le postazioni e negli archivi.
          Nulla viene inviato da nessuna parte.
        </p>
        <Faq q="Il debriefing esiste anche per un intervento reale?">
          Sì. Solo la scheda Direzione d’esercizio è riservata ai diari in
          modalità Esercizio; la riproduzione, le cifre e i punti da ricordare
          servono anche dopo un intervento.
        </Faq>
      </>
    ),
  },
  {
    id: "exercise",
    group: "together",
    module: "debrief",
    icon: debrief.icon,
    hue: 20,
    title: "Esercizi: scenario e inject",
    openLabel: "Apri la direzione d’esercizio",
    short: (
      <p>
        Per un esercizio, la direzione prepara uno scenario: degli « inject »,
        cioè messaggi inventati che arrivano a un’ora prevista (« la polizia
        segnala una strada chiusa »). orion aic li invia da solo al momento
        giusto e misura la reazione dei giocatori.
      </p>
    ),
    guide: (
      <>
        <Note kind="warn">
          Solo in un diario in modalità <Ui>Esercizio</Ui>. In un diario
          d’intervento non parte mai nessun inject.
        </Note>
        <H>Aprire la direzione d’esercizio</H>
        <Steps>
          <li>
            <Path
              steps={["Debriefing ed esercizio", "Direzione d’esercizio"]}
            />
            .
          </li>
          <li>
            La prima volta, scegliete un codice da 4 a 8 cifre per questa
            postazione. Sarà richiesto per tornarvi.{" "}
            <Ui>Nascondi (modalità giocatore)</Ui> chiude la vista.
          </li>
        </Steps>
        <H>Preparare lo scenario</H>
        <Steps>
          <li>
            <Ui>Esempio « Piena dell’Arve »</Ui> carica uno scenario completo
            per esercitarsi. <Ui>Importa</Ui> legge uno scenario JSON,{" "}
            <Ui>Esporta</Ui> lo salva per un altro esercizio.
          </li>
          <li>
            <Ui>Inject</Ui> ne aggiunge uno: titolo, momento (minuti dopo
            l’inizio « T+ », oppure ora fissa), mittente simulato, cellula
            destinataria, canale (messaggio, radio, telefono), contenuto,
            reazione attesa e termine.
          </li>
          <li>
            <Ui>Consegna</Ui>: l’inject arriva in Messaggi, oppure viene letto
            ad alta voce dalla direzione (al telefono, alla radio).
          </li>
          <li>
            <Ui>Effetti all’arrivo</Ui>: cambiare lo stato di un mezzo,
            aggiungere un’osservazione meteo o aggiornare un’informazione
            chiave.
          </li>
        </Steps>
        <H>Giocare</H>
        <Steps>
          <li>
            <Ui>Inizia adesso (T0)</Ui>: l’esercizio parte, il contatore T+
            gira.
          </li>
          <li>
            All’ora prevista, la postazione della direzione invia l’inject:
            appare in Messaggi su tutte le postazioni sincronizzate.
          </li>
          <li>
            Un inject da leggere appare in grande: leggetelo, poi{" "}
            <Ui>Letto e trasmesso</Ui>.
          </li>
          <li>
            <Ui>Invia</Ui> fa partire subito un inject; l’occhio barrato lo
            toglie dal programma.
          </li>
          <li>
            <Ui>Termina l’esercizio</Ui> ferma gli invii. Il debriefing mostra
            poi le reazioni.
          </li>
        </Steps>
      </>
    ),
    full: (
      <>
        <H>Buono a sapersi</H>
        <ul>
          <li>
            Gli inject partono dalla postazione della direzione: tenetela aperta
            durante l’esercizio. Se era chiusa, gli inject in ritardo partono
            non appena ritorna.
          </li>
          <li>
            Due postazioni di direzione aperte contemporaneamente non creano
            doppioni: il messaggio di un inject è lo stesso su tutte le
            postazioni.
          </li>
          <li>
            Un’ora fissa è letta all’ora di Zurigo, anche durante il cambio
            dell’ora. <Ui>Giorno dell’esercizio</Ui> 1 = il giorno dopo
            l’inizio.
          </li>
          <li>
            Il codice della direzione evita che un giocatore apra lo scenario
            per errore. Non è una protezione: lo scenario viaggia con il diario
            (sincronizzazione, archivi, tracciabilità).
          </li>
        </ul>
        <H>Formato del file di scenario</H>
        <p>
          Un file JSON leggibile: <code>format</code> «{" "}
          <code>orion-aic-scenario</code> », <code>version</code> 1,{" "}
          <code>title</code>, <code>description</code> e la lista{" "}
          <code>injects</code> (titolo, <code>timing</code> « offset » o « clock
          », <code>offset</code> in minuti, <code>clock</code> « hh:mm »,{" "}
          <code>day</code>, mittente, destinatario, canale, contenuto, consegna,
          reazione attesa, termine, effetti). Esportate l’esempio per vedere un
          file completo.
        </p>
        <H>La dimostrazione vivente</H>
        <p>
          L’esercizio dimostrativo (<Ui>Apri l’esercizio dimostrativo</Ui> sulla
          pagina iniziale) gioca questo stesso scenario: ogni pochi minuti
          arrivano un messaggio, un cambiamento di stato di un mezzo, un
          aggiornamento meteo. Lasciatelo aperto per vedere un PC che vive.
        </p>
      </>
    ),
  },
  {
    id: "wall",
    group: "together",
    icon: Tv,
    hue: 200,
    title: "Schermo murale",
    short: (
      <p>
        Un grande schermo nella sala di condotta, che tutti leggono da lontano:
        carta, punti aperti e ritardi, conto alla rovescia fino al prossimo
        rapporto, informazioni chiave, mezzi impiegati, ultime voci e l’ora. Non
        si tocca: si aggiorna da solo.
      </p>
    ),
    guide: (
      <>
        <H>Aprirlo</H>
        <Steps>
          <li>
            Su una postazione qualsiasi: <K>⌘K</K> (o <K>Ctrl K</K>) poi{" "}
            <Ui>Schermo murale della sala di condotta</Ui>, oppure il menu
            dell’operatore (il vostro nome, in alto a destra) poi{" "}
            <Ui>Schermo murale</Ui>.
          </li>
          <li>
            Su un computer collegato al grande schermo: unitevi alla sessione
            (codice di sessione), poi aggiungete <code>#mur</code> all’indirizzo
            (per esempio <code>https://orionaic.xyz/#mur</code>).
          </li>
          <li>
            Muovete il mouse: appaiono <Ui>Schermo intero</Ui> ed <Ui>Esci</Ui>.{" "}
            <K>F</K> passa a schermo intero, <K>Esc</K> esce.
          </li>
        </Steps>
      </>
    ),
    full: (
      <ul>
        <li>
          Lo schermo segue il tema di colore della postazione, compresa la notte
          tattica (tutto in rosso) per una sala buia.
        </li>
        <li>
          Lo schermo resta acceso finché lo schermo murale è visualizzato (se il
          browser lo permette).
        </li>
        <li>
          Ogni due minuti, l’immagine si sposta di qualche pixel: gli schermi
          non conservano la traccia di un’immagine fissa.
        </li>
        <li>
          Mostra sempre lo stato in diretta, anche se la macchina del tempo è
          aperta su un’altra postazione.
        </li>
      </ul>
    ),
  },
  {
    id: "signature",
    group: "reference",
    icon: KeyRound,
    hue: 160,
    title: "Firma delle esportazioni",
    short: (
      <p>
        Ogni postazione ha la propria chiave di firma. I PDF, gli archivi e i
        codici QR stampati sono firmati: si può verificare in seguito che
        nessuno abbia cambiato una sola lettera da allora.
      </p>
    ),
    guide: (
      <>
        <H>Verificare un documento</H>
        <Steps>
          <li>
            <Path steps={["Tracciabilità", "Verifica un documento"]} />.
          </li>
          <li>
            Trascinate il file (PDF, archivio .orionaic…) o incollate il testo
            del codice QR stampato.
          </li>
          <li>
            <Ui>Firma valida</Ui>: il file è intatto. <Ui>Firma non valida</Ui>:
            è stato modificato dopo la firma.
          </li>
          <li>
            Confrontate l’impronta della chiave (per esempio{" "}
            <code>A1B2-C3D4-E5F6-0718</code>) con quella stampata in fondo al
            documento o nota alla postazione che l’ha prodotto.
          </li>
        </Steps>
      </>
    ),
    full: (
      <>
        <H>Che cosa prova la firma</H>
        <ul>
          <li>
            Il file (o il contenuto stampato) è esattamente quello firmato dalla
            chiave indicata.
          </li>
          <li>
            Il registro delle esportazioni dell’operazione conserva la firma di
            ogni file: anche un file Word o Excel può essere verificato.
          </li>
        </ul>
        <H>Che cosa non prova</H>
        <ul>
          <li>
            Chi deteneva la chiave: è creata dalla postazione stessa, senza
            autorità di certificazione. Annotate l’impronta di ogni postazione
            (mostrata in <Ui>Verifica un documento</Ui>).
          </li>
          <li>
            L’ora: proviene dall’orologio della postazione che firma, non da un
            servizio di marcatura temporale.
          </li>
        </ul>
        <p>
          La chiave è conservata nella sessione cifrata della postazione. Non
          viene mai sincronizzata né esportata. Una nuova sessione crea una
          nuova chiave.
        </p>
      </>
    ),
  },
];
