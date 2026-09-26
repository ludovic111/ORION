import {
  BellRing,
  FileText,
  Gauge,
  Megaphone,
  UserCheck,
  Waypoints,
} from "lucide-react";
import { moduleInfo } from "../../../app/modules";
import type { Topic } from "../content";
import { Example, H, Note, States, Steps, Ui } from "../kit";

// Help pages of the conduct follow-up (Italian): checklists, requests for
// resources, presences and shifts, weather thresholds, punto della
// situazione, handover summary and reminders.

const checklists = moduleInfo("checklists");

/** Module topics, shown with the modules (after Missions). */
export const CONDUCT_MODULE_TOPICS: Topic[] = [
  {
    id: "checklists",
    group: "modules",
    module: "checklists",
    icon: checklists.icon,
    hue: checklists.hue,
    title: checklists.label,
    openLabel: "Apri le liste",
    short: (
      <p>
        Un elenco di ciò che non bisogna dimenticare per un tipo di evento:
        piena, interruzione di corrente, canicola, incidente chimico, tempesta,
        terremoto, ricerca di persone, accoglienza di evacuati, apertura del PC.
        Si spunta man mano; il diario annota chi l’ha fatto e quando.
      </p>
    ),
    guide: (
      <>
        <H>Avviare una lista</H>
        <Steps>
          <li>
            <Ui>Avvia una lista</Ui>, poi scegliete il tipo di evento (per
            esempio « Piena / inondazione »).
          </li>
          <li>Cambiate il titolo se volete (« Piena dell’Arve »).</li>
          <li>
            <Ui>Avvia</Ui>: la lista appare con tutte le sue tappe.
          </li>
        </Steps>
        <H>Spuntare una tappa</H>
        <Steps>
          <li>Spuntate la casella quando la tappa è fatta.</li>
          <li>
            Le tappe importanti vengono scritte anche nel diario. Il piccolo
            quaderno a destra mostra se sarà così: un clic lo cambia prima di
            spuntare.
          </li>
          <li>
            Una tappa con un timer (« controllo 60 min dopo ») crea una voce{" "}
            <Ui>Da trattare</Ui> con una scadenza: fra 60 minuti bisognerà
            verificare. In ritardo, diventa rossa.
          </li>
        </Steps>
        <Example>
          <p>
            Alle 09:40, il sgt Muller spunta « Rilevare livelli e portate ». Il
            diario riceve « Piena dell’Arve: Rilevare livelli e portate.
            Controllo alle 10:40 », con la funzione « Monitoraggio della
            situazione ». Alle 10:41, il punto è in ritardo sulla pagina
            Situazione.
          </p>
        </Example>
      </>
    ),
    full: (
      <>
        <H>Modelli</H>
        <ul>
          <li>
            Sono forniti nove modelli. Ogni tappa ha una funzione responsabile
            e, se utile, un timer di controllo.
          </li>
          <li>
            <Ui>Modifica</Ui> un modello standard: le vostre modifiche valgono
            per questo diario (e per le postazioni sincronizzate).{" "}
            <Ui>Ripristina</Ui> torna al modello fornito.
          </li>
          <li>
            <Ui>Duplica</Ui> per partire da un modello; <Ui>Nuovo modello</Ui>{" "}
            per una lista vostra; <Ui>Nascondi</Ui> per togliere un modello
            dalla scelta.
          </li>
          <li>
            Una lista avviata conserva le sue tappe: modificare il modello in
            seguito non la cambia. Si può anche modificare la lista stessa
            (aggiungere una tappa dimenticata).
          </li>
        </ul>
        <H>Seguito</H>
        <ul>
          <li>
            La pagina Situazione mostra le liste in corso, la tappa successiva e
            i controlli in ritardo.
          </li>
          <li>
            Due postazioni possono spuntare contemporaneamente: ogni tappa è
            registrata a parte, nulla va perso con la sincronizzazione.
          </li>
          <li>
            <Ui>Stampa</Ui> fornisce la lista su carta con le caselle, l’ora e
            chi ha spuntato. <Ui>Chiudi la lista</Ui> la sposta in « Liste
            chiuse ».
          </li>
        </ul>
        <Note kind="tip">
          Togliere la spunta a una tappa non elimina la voce già scritta nel
          diario: il diario non si cancella mai.
        </Note>
      </>
    ),
  },
  {
    id: "requests",
    group: "modules",
    module: "resources",
    icon: Megaphone,
    hue: 18,
    title: "Richieste di mezzi",
    openLabel: "Apri i mezzi",
    short: (
      <p>
        Seguire una richiesta di mezzi dall’inizio alla fine: richiesta,
        accordata o rifiutata, in viaggio, arrivata, poi liberata. Ogni tappa è
        scritta nel diario; all’arrivo, il mezzo appare nella lista dei mezzi.
      </p>
    ),
    guide: (
      <>
        <States
          steps={[
            "Richiesto",
            "Accordato",
            "In viaggio",
            "Arrivato",
            "Liberato",
          ]}
          extra={["Rifiutato", "Annullato"]}
        />
        <H>Fare una richiesta</H>
        <Steps>
          <li>
            Mezzi → scheda <Ui>Richieste</Ui> → <Ui>Nuova richiesta</Ui> (oppure
            il pulsante <Ui>Richiedere mezzi</Ui>).
          </li>
          <li>
            Scrivete che cosa si richiede (« Gruppo elettrogeno 20 kVA »), la
            quantità, a chi (organizzazione) e, se la si conosce, l’ora di
            arrivo prevista.
          </li>
          <li>
            <Ui>Richiedere</Ui>: una voce « Richiesta » da trattare viene
            scritta nel diario.
          </li>
        </Steps>
        <H>Seguire</H>
        <Steps>
          <li>
            I pulsanti della richiesta la fanno avanzare: <Ui>Accordata</Ui>,{" "}
            <Ui>In viaggio</Ui>, <Ui>Arrivata</Ui>… Ogni clic è annotato nel
            diario (« seguito di #012 »).
          </li>
          <li>
            Se l’ora di arrivo è superata, la richiesta diventa rossa con il
            ritardo (« ritardo 25 min »), qui e sulla pagina Situazione.
          </li>
          <li>
            <Ui>Arrivata</Ui> crea il mezzo nella lista (o lo collega a un mezzo
            esistente) e conclude la voce della richiesta.
          </li>
        </Steps>
      </>
    ),
    full: (
      <>
        <ul>
          <li>
            Tipi di mezzi, organizzazioni e unità provengono dagli elenchi di
            riferimento; il testo libero è accettato.
          </li>
          <li>
            Tutto resta modificabile (scheda della richiesta); lo stato cambia
            solo tramite i pulsanti, per mantenere una cronologia corretta.
          </li>
          <li>
            La richiesta è collegata alla sua voce, ai suoi seguiti e al mezzo
            consegnato (rete dei collegamenti).
          </li>
          <li>
            <Ui>Stampa</Ui> fornisce la tabella A4 di tutte le richieste.
          </li>
        </ul>
        <Note kind="info">
          « Registrare nel diario » può essere disattivato per una tappa senza
          importanza; la richiesta conserva comunque l’ora e l’autore di ogni
          tappa.
        </Note>
      </>
    ),
  },
  {
    id: "presence",
    group: "modules",
    module: "team",
    icon: UserCheck,
    hue: 330,
    title: "Presenze e avvicendamento",
    openLabel: "Apri la squadra",
    short: (
      <p>
        Chi è al PC, da quando, e chi dà il cambio. Si registrano l’arrivo e la
        partenza con un pulsante o scansionando un badge QR; l’applicazione
        avvisa quando qualcuno lavora troppo a lungo o non ha dormito
        abbastanza.
      </p>
    ),
    guide: (
      <>
        <H>Registrare arrivi e partenze</H>
        <Steps>
          <li>
            Squadra → vista <Ui>Presenze</Ui>.
          </li>
          <li>
            <Ui>Arrivo</Ui> quando la persona arriva, <Ui>Partenza</Ui> quando
            se ne va. Il tempo di servizio appare a destra.
          </li>
          <li>
            Più rapido: <Ui>Badge QR</Ui> stampa un badge per persona;
            all’entrata, <Ui>Scansionare un badge</Ui> registra l’arrivo (o la
            partenza se la persona è già presente).
          </li>
        </Steps>
        <H>Piano di avvicendamento</H>
        <Steps>
          <li>
            <Ui>Pianifica</Ui>: ora d’inizio, durata, numero di turni (per
            esempio 3 turni di 8 ore).
          </li>
          <li>Aprite ogni turno e scegliete le persone.</li>
          <li>
            Una persona prevista troppo a lungo di seguito, o con troppo poco
            riposo fra due turni, è segnalata in rosso.
          </li>
        </Steps>
        <Example>
          <p>
            Il sgtm Gilliéron è arrivato ieri alle 21:00. Alle 09:30, la pagina
            mostra « In servizio da 12 h 30 di seguito (massimo 12 h) »: bisogna
            dargli il cambio.
          </p>
        </Example>
      </>
    ),
    full: (
      <>
        <ul>
          <li>
            Servizio massimo (12 h per default) e riposo minimo (8 h) si
            impostano in fondo al piano di avvicendamento, per tutto il diario.
          </li>
          <li>
            Una pausa più corta del riposo minimo non azzera il contatore: le
            ore continuano a contare, e il riposo troppo breve è segnalato.
          </li>
          <li>
            Le durate sono ore reali, anche nella notte del cambio dell’ora (una
            notte d’autunno 20:00–08:00 conta 13 ore).
          </li>
          <li>
            <Ui>Lista delle presenze</Ui> stampa i presenti (con una colonna per
            la firma), tutti gli arrivi e le partenze, e il piano di
            avvicendamento.
          </li>
          <li>
            Un badge scansionato con la fotocamera di un telefono apre orion aic
            sulla registrazione di quella persona; basta confermare.
          </li>
        </ul>
        <Note kind="info">
          Registrare un arrivo mette la persona « Presente » nell’organigramma;
          registrare la partenza la mette « Avvicendato ».
        </Note>
      </>
    ),
  },
  {
    id: "thresholds",
    group: "modules",
    module: "weather",
    icon: Gauge,
    hue: 38,
    title: "Soglie meteo",
    openLabel: "Apri la meteo",
    short: (
      <p>
        Limiti scelti per la vostra regione (raffiche, pioggia, caldo, freddo).
        Quando la previsione li supera, viene creata automaticamente un’allerta
        e, se lo desiderate, una voce da trattare nel diario.
      </p>
    ),
    guide: (
      <>
        <Steps>
          <li>
            Meteo → <Ui>Soglie meteo</Ui> → <Ui>Aggiungi soglie standard</Ui> o{" "}
            <Ui>Soglia</Ui>.
          </li>
          <li>
            Scegliete la grandezza (raffiche in km/h, pioggia in 1 h o in 24 h,
            temperatura massima o minima), il valore e il grado dell’allerta da
            creare.
          </li>
          <li>
            A ogni previsione ricevuta, le soglie vengono verificate sulle 48
            ore successive. La riga della soglia indica se è superata e quando.
          </li>
        </Steps>
        <Example>
          <p>
            Soglia « Pioggia in 1 h ≥ 6 mm ». La previsione delle 14:00 annuncia
            7 mm alle 20:00: l’allerta « Pioggia intensa sull’Arve » appare in
            Meteo, e la voce « Soglia meteo superata… » è da trattare.
          </p>
        </Example>
      </>
    ),
    full: (
      <>
        <ul>
          <li>
            Una sola allerta per soglia e per giorno, anche se la previsione
            viene ricaricata più volte o se più postazioni la ricevono: creano
            la stessa allerta, che appare una sola volta.
          </li>
          <li>Un’allerta eliminata non viene ricreata per quel giorno.</li>
          <li>
            Il livello dei corsi d’acqua non fa parte della previsione (Open
            Meteo, gratuita): inserite a mano le allerte di piena.
          </li>
        </ul>
      </>
    ),
  },
];

/** Topics about working together (after the exports). */
export const CONDUCT_TOGETHER_TOPICS: Topic[] = [
  {
    id: "situation-point",
    group: "together",
    module: "situation",
    icon: FileText,
    hue: 250,
    title: "Punto della situazione preparato",
    openLabel: "Apri la situazione",
    short: (
      <p>
        Prima di un rapporto di condotta, orion aic prepara una bozza del punto
        della situazione con ciò che sa già. La rileggete, la correggete, poi la
        stampate o la registrate nel diario.
      </p>
    ),
    guide: (
      <Steps>
        <li>
          Situazione → <Ui>Punto della situazione</Ui>, oppure nell’agenda
          l’icona documento accanto a un rapporto di condotta.
        </li>
        <li>
          La bozza contiene: situazione generale, informazioni chiave, ciò che è
          successo dall’ultimo rapporto, mezzi impiegati, compiti aperti e in
          ritardo, liste di controllo, richieste di mezzi, meteo, personale,
          prossimo punto.
        </li>
        <li>Correggete ogni rubrica; completate « Bisogni e decisioni ».</li>
        <li>
          <Ui>Stampa</Ui>, <Ui>Registrare nel diario</Ui>,{" "}
          <Ui>Salvare come tabella</Ui> o <Ui>Creare un’istantanea</Ui>.
        </li>
      </Steps>
    ),
    full: (
      <ul>
        <li>
          Nulla è inventato: ogni riga proviene dal diario (nessuna intelligenza
          artificiale).
        </li>
        <li>
          « Da » parte dall’ora dell’ultimo rapporto; la si può cambiare, e la
          bozza viene allora rifatta.
        </li>
        <li>
          La bozza non cambia più mentre la scrivete; <Ui>Rifare la bozza</Ui>{" "}
          riprende lo stato attuale.
        </li>
      </ul>
    ),
  },
  {
    id: "handover-summary",
    group: "together",
    icon: Waypoints,
    hue: 212,
    title: "Riepilogo dell’avvicendamento",
    short: (
      <p>
        « Che cosa è successo dalle 14:00? »: la finestra Avvicendamento calcola
        la risposta a partire dalla cronologia: nuove voci, decisioni, messaggi,
        compiti aperti e chiusi, mezzi, richieste, tappe spuntate, allerte,
        ritardi.
      </p>
    ),
    guide: (
      <Steps>
        <li>
          Diario → pulsante <Ui>Avvicendamento</Ui> (o ⌘K « Avvicendamento »).
        </li>
        <li>
          Scegliete l’ora « Da » (per default: l’ultimo avvicendamento
          registrato, altrimenti 8 ore).
        </li>
        <li>
          Un clic su una riga apre l’elemento. <Ui>Stampa il riepilogo</Ui> o{" "}
          <Ui>Copia</Ui>.
        </li>
        <li>
          <Ui>Registra con il riepilogo</Ui> scrive l’avvicendamento nel diario
          con questo riepilogo.
        </li>
      </Steps>
    ),
    full: (
      <p>
        Il calcolo è sempre lo stesso per gli stessi dati: due postazioni
        ottengono lo stesso riepilogo. Proviene dalla cronologia di ogni
        elemento (stato prima, stato dopo), quindi vi figura anche un mezzo
        passato da « Allarmato » a « Impiegato » e poi eliminato.
      </p>
    ),
  },
  {
    id: "reminders",
    group: "together",
    module: "agenda",
    icon: BellRing,
    hue: 48,
    title: "Promemoria di esportazione e stampa",
    openLabel: "Apri l’agenda",
    short: (
      <p>
        Promemoria a ore fisse: « ogni 2 ore, esportare l’archivio », « 30
        minuti prima di ogni rapporto, stampare la situazione ». Il promemoria
        appare in basso sullo schermo con il pulsante che esegue l’azione.
      </p>
    ),
    guide: (
      <Steps>
        <li>
          Agenda → <Ui>Promemoria di esportazione e stampa</Ui> →{" "}
          <Ui>Aggiungi i promemoria standard</Ui> (o <Ui>Promemoria</Ui>).
        </li>
        <li>
          All’ora stabilita appare un riquadro: <Ui>Esporta l’archivio</Ui>,{" "}
          <Ui>Stampa la situazione</Ui> o{" "}
          <Ui>Prepara il punto della situazione</Ui> con un clic.
        </li>
        <li>
          <Ui>Fatto</Ui> lo chiude; l’orologio lo rinvia di 15 minuti.
        </li>
      </Steps>
    ),
    full: (
      <ul>
        <li>
          Nessun server: il promemoria appare sulle postazioni dove orion aic è
          aperto.
        </li>
        <li>
          Un’esportazione o una stampa dal centro di esportazione viene scritta
          nel registro delle esportazioni (Tracciabilità) e conta come fatta.
        </li>
        <li>
          « Prima di ogni rapporto » vale per gli appuntamenti il cui tipo o
          titolo contiene « rapporto ».
        </li>
      </ul>
    ),
  },
];
