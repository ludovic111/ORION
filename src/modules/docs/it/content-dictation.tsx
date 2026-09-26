import { Mic } from "lucide-react";
import type { Topic } from "../content";
import { Example, Faq, H, K, Note, Path, Steps, Table, Ui } from "../kit";

// « Dettatura vocale » (Italian): speak instead of typing the text of an
// entry or a message.
export const DICTATION_TOPIC: Topic = {
  id: "dictation",
  group: "reference",
  title: "Dettatura vocale",
  icon: Mic,
  hue: 20,
  short: (
    <p>
      Parlate invece di digitare: il testo di una voce del diario o di un
      messaggio si scrive da solo. La dettatura è disattivata all’inizio; la si
      attiva su ogni postazione che ne ha bisogno.
    </p>
  ),
  guide: (
    <>
      <H>Attivarla su questa postazione</H>
      <Steps>
        <li>
          Aprite <Path steps={["Impostazioni", "Questa postazione"]} />.
        </li>
        <li>
          In <Ui>Dettatura vocale</Ui>, attivate{" "}
          <Ui>Dettare i messaggi al microfono</Ui>.
        </li>
        <li>
          Un piccolo microfono appare a destra della parola « Messaggio » nella
          nuova voce del diario e nell’inserimento dei messaggi.
        </li>
      </Steps>
      <Note kind="info">
        Se la rubrica indica « Non disponibile in questo browser », il browser
        non sa trascrivere la voce (Firefox, per esempio). Chrome, Edge e Safari
        lo sanno fare.
      </Note>
      <H>Dettare</H>
      <Steps>
        <li>Fate clic nel testo, là dove devono arrivare le parole.</li>
        <li>
          Premete il microfono. La prima volta, il browser chiede il permesso di
          usare il microfono: accettate.
        </li>
        <li>
          Il punto arancione e « In ascolto… » mostrano che la postazione
          ascolta. Parlate normalmente; le parole in corso di riconoscimento
          appaiono in grigio accanto al microfono.
        </li>
        <li>
          Per fermare: premete di nuovo il microfono, oppure <K>Esc</K>.
          Cambiare scheda o chiudere il modulo ferma anch’esso l’ascolto.
        </li>
        <li>
          Rileggete, correggete con la tastiera se necessario, poi salvate.
        </li>
      </Steps>
      <H>I comandi di punteggiatura</H>
      <p>
        Dite la parola della colonna di sinistra: viene sostituita dal segno.
      </p>
      <Table
        head={["Voi dite", "Ottenete"]}
        rows={[
          ["« punto »", "."],
          ["« virgola »", ","],
          ["« due punti »", ":"],
          ["« punto e virgola »", ";"],
          ["« punto interrogativo »", "?"],
          ["« punto esclamativo »", "!"],
          ["« nuova riga » o « a capo »", "un ritorno a capo"],
          ["« nuovo paragrafo »", "una riga vuota"],
        ]}
      />
      <p>
        Dopo un punto, un punto interrogativo o un ritorno a capo, la parola
        successiva prende la maiuscola. « Il punto della situazione » o « al
        punto di raccolta » restano scritti per esteso.
      </p>
      <Example>
        Voi dite: « livello dell’Arve due punti 3 virgola 2 metri punto nuova
        riga ponte di Carouge chiuso punto ». Il testo diventa: « Livello
        dell’Arve: 3,2 metri. » poi, a capo, « Ponte di Carouge chiuso. »
      </Example>
      <H>Dove va l’audio</H>
      <Note kind="warn">
        In Chrome ed Edge l’audio viene inviato ai server di Google / Microsoft
        per essere trascritto, ed è necessaria una connessione internet. Safari
        può trascrivere sul dispositivo a seconda del sistema. Non dettate
        informazioni confidenziali se non è autorizzato.
      </Note>
      <p>
        orion aic non riceve né registra alcun audio: solo il testo scritto nel
        campo fa parte del diario, come se lo aveste digitato.
      </p>
    </>
  ),
  full: (
    <>
      <H>Quando non funziona</H>
      <Table
        head={["Messaggio", "Che cosa fare"]}
        rows={[
          [
            "Microfono rifiutato",
            "Il browser ha bloccato il microfono per questo sito. Fate clic sul lucchetto a sinistra dell’indirizzo e autorizzate il microfono.",
          ],
          [
            "Nessuna connessione",
            "Chrome ed Edge trascrivono tramite internet. Senza rete, digitate con la tastiera.",
          ],
          [
            "Non si è sentito nulla",
            "La postazione non ha sentito alcuna voce. Avvicinatevi al microfono e riprovate.",
          ],
          [
            "Nessun microfono trovato",
            "Collegate un microfono o delle cuffie, poi riprovate.",
          ],
          [
            "Brave non trascrive la voce",
            "Brave non offre questo servizio: usate Chrome, Edge o Safari per dettare.",
          ],
        ]}
      />
      <H>Buono a sapersi</H>
      <ul>
        <li>
          L’impostazione è propria di ogni postazione: una postazione può
          dettare, l’altra no. Non viaggia con la sincronizzazione.
        </li>
        <li>
          La lingua è l’italiano della Svizzera (o dell’Italia se il browser
          conosce solo quest’ultimo).
        </li>
        <li>
          Su un telefono Android, ogni pressione sul microfono prende una frase.
        </li>
        <li>
          Un forte rumore di fondo (sirena, radio) disturba il riconoscimento:
          rileggete sempre prima di salvare.
        </li>
      </ul>
      <Faq q="La dettatura registra la mia voce?">
        No. orion aic conserva solo il testo. L’audio è trattato dal browser, e
        in Chrome o Edge dai server di Google o di Microsoft.
      </Faq>
      <Faq q="Posso dettare offline?">
        In Chrome ed Edge, no. Safari può talvolta trascrivere sul dispositivo,
        a seconda della versione del sistema.
      </Faq>
    </>
  ),
};
