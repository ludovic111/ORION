import { BellRing, Cable } from "lucide-react";
import { moduleInfo } from "../../../app/modules";
import type { Module } from "../../../../shared/links";
import type { Topic } from "../content";
import { Example, Faq, H, Note, Path, States, Steps, Table, Ui } from "../kit";

// Help topics of the conduct features (Italian): I miei compiti and the
// functions of the posts, orders and diffusions, alerts, liaison between
// command posts.

const mod = (id: Module, openLabel: string) => {
  const info = moduleInfo(id);
  return {
    module: id,
    icon: info.icon,
    hue: info.hue,
    title: info.label,
    openLabel,
  };
};

export const CONDUCT_TOPICS: Topic[] = [
  {
    id: "tasks",
    group: "modules",
    ...mod("tasks", "Apri I miei compiti"),
    short: (
      <p>
        Ogni postazione indica qual è la sua funzione (logistica, telematica…).
        « I miei compiti » mostra allora solo ciò che la riguarda: ciò che è in
        ritardo in alto, con un pulsante per dire che è fatto.
      </p>
    ),
    guide: (
      <>
        <H>Scegliere la funzione di questa postazione</H>
        <Steps>
          <li>
            Aprite <Ui>I miei compiti</Ui> (oppure{" "}
            <Path steps={["Impostazioni", "Questa postazione"]} />
            ).
          </li>
          <li>
            Fate clic sulla vostra funzione: <Ui>Capo intervento</Ui>,{" "}
            <Ui>Capo situazione</Ui>, <Ui>Aiuto alla condotta</Ui>,{" "}
            <Ui>Logistica</Ui>, <Ui>Telematica</Ui>,{" "}
            <Ui>Personale / amministrazione</Ui> o <Ui>Collegamento</Ui>. Potete
            anche scrivere un’altra funzione.
          </li>
          <li>
            Alla prossima apertura, orion aic si apre direttamente sul modulo
            della vostra funzione (Mezzi per la logistica, Radio per la
            telematica…). Potete scegliere un altro modulo in{" "}
            <Path
              steps={[
                "Impostazioni",
                "Questa postazione",
                "Modulo all’apertura",
              ]}
            />
            .
          </li>
        </Steps>
        <H>Cosa appare in I miei compiti</H>
        <Table
          head={["Cosa", "Quando"]}
          rows={[
            [
              "Una voce del diario da seguire",
              "Il suo « Responsabile » è la vostra funzione, il vostro nome o la vostra cellula (« Logistica / Sgt Rey » vale per entrambi)",
            ],
            [
              "Un compito di un ordine emanato",
              "La sua funzione responsabile o la sua unità vi designa",
            ],
            [
              "Un elemento assegnato",
              "Qualcuno ha fatto clic su « Assegna » e ha scelto la vostra funzione o il vostro nome",
            ],
            [
              "Una diffusione",
              "È destinata a voi e attende il vostro « Letto » o « Compreso »",
            ],
          ]}
        />
        <H>I pulsanti di ogni riga</H>
        <ul>
          <li>
            <Ui>Concluso</Ui>: il compito è fatto (la voce passa a Concluso, con
            la sua cronologia).
          </li>
          <li>
            <Ui>+15 min</Ui>: sposta la scadenza di un quarto d’ora.
          </li>
          <li>
            <Ui>Annota nel diario</Ui>: apre una voce precompilata (quittanza)
            da completare e registrare.
          </li>
        </ul>
      </>
    ),
    full: (
      <>
        <H>Dettagli</H>
        <ul>
          <li>
            La funzione è conservata solo su questa postazione (come il tema).
            Due postazioni della stessa cellula possono avere la stessa
            funzione: vedono gli stessi compiti.
          </li>
          <li>
            L’elenco delle funzioni si modifica in{" "}
            <Path
              steps={[
                "Impostazioni",
                "Elenchi di riferimento",
                "Funzioni delle postazioni",
              ]}
            />
            .
          </li>
          <li>
            Maiuscole e accenti non contano: « logistica » designa « Logistica
            ».
          </li>
          <li>
            Il numero sull’icona I miei compiti conta ciò che è in ritardo e ciò
            che attende la vostra conferma. Il titolo della scheda del browser «
            (3) orion aic » conta anche le voci in ritardo del diario.
          </li>
          <li>
            <Ui>Assegna</Ui>: qualsiasi elemento (voce, messaggio, appuntamento,
            mezzo…) può essere affidato a una funzione e / o a una persona, con
            una scadenza e una consegna.
          </li>
          <li>
            <Ui>Per la vostra funzione</Ui>: scorciatoie verso i moduli più
            utili alla vostra funzione.
          </li>
        </ul>
        <Example>
          <p>
            La postazione della cellula logistica sceglie <Ui>Logistica</Ui>.
            Vede subito « #004 Richiesta di 200 sacchi di sabbia », in ritardo,
            e il compito « Consegnare 200 sacchi » dell’ordine n. 1. Consegna
            fatta: <Ui>Concluso</Ui>, poi <Ui>Annota nel diario</Ui> per la
            quittanza.
          </p>
        </Example>
      </>
    ),
  },
  {
    id: "orders",
    group: "modules",
    ...mod("orders", "Apri gli ordini"),
    short: (
      <p>
        Scrivere un ordine nella sequenza abituale in cinque punti, inviarlo
        alle persone giuste e sapere chi lo ha letto. Ognuno deve rispondere «
        Letto » o « Compreso »; vedete chi lo ha fatto, e a che ora.
      </p>
    ),
    guide: (
      <>
        <H>Scrivere ed emanare un ordine</H>
        <Steps>
          <li>
            <Ui>Nuovo ordine</Ui>, poi un modello: <Ui>Ordine d’impiego</Ui>,{" "}
            <Ui>Ordine complementare</Ui>, <Ui>Ordine preparatorio</Ui>,{" "}
            <Ui>Ordine di avvicendamento</Ui> o vuoto. La situazione, i
            pericoli, l’intenzione, i PC, i gruppi radio e i prossimi rapporti
            sono già compilati con ciò che il diario sa.
          </li>
          <li>
            Completate i cinque capitoli. Al punto 3,{" "}
            <Ui>Aggiungi un compito</Ui> per unità o cellula: che cosa fa, la
            funzione responsabile, la scadenza, e <Ui>Collega</Ui> i mezzi o le
            persone interessati.
          </li>
          <li>
            Scegliete i destinatari (funzioni, cellule, altro PC, Tutti), poi{" "}
            <Ui>Salva</Ui>: è una bozza.
          </li>
          <li>
            <Ui>Emana</Ui>: l’ordine riceve l’ora di emanazione, viene
            registrato nel diario (« Ordine n. 1 emanato ») e parte verso i
            destinatari, che devono rispondere « Compreso ».
          </li>
          <li>
            <Ui>A4</Ui> stampa la scheda dell’ordine con le conferme e una
            casella per il visto.
          </li>
        </Steps>
        <Table
          head={["Capitolo", "Cosa vi si scrive"]}
          rows={[
            [
              "1 Orientamento",
              "Situazione, pericolo ed evoluzione probabile, mezzi vicini",
            ],
            ["2 Intenzione", "Idea di manovra: ciò che si vuole ottenere"],
            ["3 Compiti", "Chi fa cosa, entro quando, con che cosa"],
            ["4 Disposizioni particolari", "Logistica, sanità, sicurezza"],
            [
              "5 Ubicazioni e collegamenti",
              "PC, canali radio, orari dei rapporti",
            ],
          ]}
        />
        <H>Diffondere con conferma di lettura</H>
        <Steps>
          <li>
            <Ui>Diffondi</Ui> (qui, in I miei compiti o con ⌘K): oggetto, testo,
            destinatari, conferma richiesta (<Ui>Letto</Ui>, <Ui>Compreso</Ui> o
            nessuna) e termine di risposta (10 min per default).
          </li>
          <li>
            Ogni postazione interessata vede una fascia in alto sullo schermo,
            qualunque sia il modulo, finché non fa clic su <Ui>Letto</Ui> o{" "}
            <Ui>Compreso</Ui>.
          </li>
          <li>
            In <Ui>Diffusioni</Ui>, ogni destinatario mostra la sua risposta e
            la sua ora, oppure « in attesa · 12 min ». Scaduto il termine, la
            riga diventa rossa e la vostra postazione viene avvisata.{" "}
            <Ui>Sollecita chi manca</Ui> rinvia a chi non ha risposto.
          </li>
        </Steps>
        <States steps={["Bozza", "Emanato"]} extra={["Annullato"]} />
      </>
    ),
    full: (
      <>
        <H>Dettagli</H>
        <ul>
          <li>
            Il numero di un ordine è assegnato alla sua creazione e non cambia
            mai; un numero eliminato non viene mai riassegnato. Due postazioni
            che creano un ordine nello stesso momento: « n. 4 » e « n. 4·K ». Un
            ordine ricevuto da un altro PC si chiama « PC avanzato n. 2 ».
          </li>
          <li>
            <Ui>Ordine complementare</Ui> riprende le ubicazioni, i
            collegamenti, i rapporti e i destinatari dell’ordine di base, e vi
            si collega.
          </li>
          <li>
            Ogni conferma è conservata: chi (funzione e nome), quando, e se è
            arrivata tramite il collegamento. Appare nella tracciabilità; non si
            modifica.
          </li>
          <li>
            Un destinatario è soddisfatto dalla prima risposta di una postazione
            che lo rappresenta: per « Logistica » basta una sola postazione
            logistica. « Tutti » attende una risposta da una postazione
            qualsiasi.
          </li>
          <li>
            <Ui>Ferma il monitoraggio</Ui>: niente più solleciti né ritardi per
            questa diffusione.
          </li>
          <li>
            Gli ordini, le diffusioni e le conferme finiscono negli export con
            la parte « Missioni e seguito ».
          </li>
        </ul>
        <Faq q="Un ordine emanato si può correggere?">
          Sì (<Ui>Modifica</Ui>), ogni versione è conservata nella cronologia.
          Per un vero cambiamento di condotta, emanate piuttosto un{" "}
          <Ui>Ordine complementare</Ui>: i destinatari lo ricevono e ne
          confermano la lettura.
        </Faq>
      </>
    ),
  },
  {
    id: "alerts",
    group: "together",
    title: "Avvisi e notifiche",
    icon: BellRing,
    hue: 20,
    module: "tasks",
    openLabel: "Apri I miei compiti",
    short: (
      <p>
        orion aic può avvisarvi quando succede qualcosa, anche se siete in
        un’altra scheda: un messaggio urgente, una scadenza superata, un
        rapporto fra 5 minuti, un compito per voi, una diffusione da leggere.
      </p>
    ),
    guide: (
      <>
        <H>Attivare gli avvisi su questa postazione</H>
        <Steps>
          <li>
            <Path steps={["Impostazioni", "Questa postazione", "Avvisi"]} />.
          </li>
          <li>
            <Ui>Notifiche di sistema</Ui>: il browser chiede il permesso;
            rispondete <Ui>Consenti</Ui>.
          </li>
          <li>
            <Ui>Suono</Ui> se volete anche un breve segnale acustico (due note,
            tre se è urgente). <Ui>Prova</Ui> per sentirlo.
          </li>
          <li>
            Scegliete ciò che vi interessa e quanti minuti prima di un rapporto
            volete essere avvisati (5 per default).
          </li>
        </Steps>
        <Note kind="tip">
          Di notte, <Ui>Ore di quiete</Ui> (per esempio dalle 22:00 alle 06:00)
          disattiva il suono e lascia passare solo ciò che è urgente. Con il
          tema Notte tattica, il suono è più basso e nulla lampeggia.
        </Note>
      </>
    ),
    full: (
      <>
        <H>Dettagli</H>
        <ul>
          <li>
            Ogni avviso suona una sola volta su questa postazione. Una scadenza
            spostata (+15 min) suonerà alla sua nuova ora.
          </li>
          <li>
            La scheda di orion aic deve restare aperta (può essere in secondo
            piano). Il browser controlla almeno una volta al minuto.
          </li>
          <li>
            Per gli avvisi nessuna informazione viene inviata su internet: è il
            browser di questa postazione che li mostra.
          </li>
          <li>
            Se il browser ha rifiutato le notifiche: fate clic sul lucchetto a
            sinistra dell’indirizzo, poi Notifiche → Consenti.
          </li>
          <li>
            Il titolo della scheda mostra il numero di cose in attesa: « (3)
            orion aic ».
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "liaison",
    group: "together",
    title: "Collegamento tra PC",
    icon: Cable,
    hue: 18,
    module: "orders",
    openLabel: "Apri il collegamento",
    short: (
      <p>
        Il PC avanzato e il PC arretrato hanno ciascuno la propria sessione. Il
        collegamento permette loro di scambiarsi messaggi, ordini e conferme di
        lettura, senza mescolare il resto.
      </p>
    ),
    guide: (
      <>
        <H>Aprire un collegamento</H>
        <Steps>
          <li>
            Sul primo PC:{" "}
            <Path
              steps={[
                "Impostazioni",
                "Sincronizzazione",
                "Collegamento tra PC",
              ]}
            />{" "}
            (oppure <Path steps={["Ordini", "Collegamento tra PC"]} />
            ). Scrivete il nome dell’altro PC (« PC arretrato ») e il vostro («
            PC avanzato »), poi <Ui>Crea un codice di collegamento</Ui>.
          </li>
          <li>Trasmettete il codice all’altro PC come una password.</li>
          <li>
            Sull’altro PC: stessi nomi, invertiti, inserite il codice e{" "}
            <Ui>Unisciti al collegamento</Ui>. Lo stato passa a{" "}
            <Ui>In collegamento</Ui>.
          </li>
        </Steps>
        <H>Inviare</H>
        <ul>
          <li>
            <Ui>Messaggio a PC arretrato</Ui>: arriva nei suoi Messaggi, con «
            PC avanzato » come mittente.
          </li>
          <li>
            Una diffusione o un ordine con « PC arretrato » tra i destinatari
            parte anche tramite il collegamento. L’altro PC lo vede nella fascia
            e nei suoi Messaggi; il suo « Compreso » torna da voi.
          </li>
        </ul>
        <Note kind="info">
          Se l’altro PC non è connesso, ciò che inviate attende (« in attesa »)
          e parte non appena ritorna. Nulla va perso, nulla arriva due volte.
        </Note>
      </>
    ),
    full: (
      <>
        <H>Dettagli</H>
        <ul>
          <li>
            Il codice di collegamento assomiglia a un codice di sessione ma apre
            un’altra stanza, con un’altra chiave: non dà mai accesso alla
            sessione dell’altro PC.
          </li>
          <li>
            Tutte le postazioni connesse di un PC vedono lo stato del
            collegamento; una qualsiasi può inviare e ricevere.
          </li>
          <li>
            La scheda del collegamento mostra l’ultimo scambio, ciò che è in
            attesa e gli ultimi messaggi in ogni direzione.
          </li>
          <li>
            <Ui>Chiudi il collegamento</Ui> cancella il codice; ciò che è stato
            scambiato resta nel diario. Il codice non viene mai esportato.
          </li>
          <li>
            Viene usato lo stesso relay della sincronizzazione; non conserva
            nulla e non può leggere nulla.
          </li>
        </ul>
      </>
    ),
  },
];
