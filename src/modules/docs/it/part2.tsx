import { mod, type Topic } from "../content";
import { Example, H, K, Note, Path, States, Steps, Table, Ui } from "../kit";

export const PART2: Topic[] = [
  {
    id: "map",
    group: "modules",
    ...mod("map", "Apri la carta"),
    short: (
      <p>
        Una carta svizzera (swisstopo) per disegnare la situazione: luoghi
        colpiti, zone, itinerari, mezzi. Passate il mouse su un oggetto per
        vedere tutto ciò che vi è collegato.
      </p>
    ),
    guide: (
      <>
        <H>Posizionare un simbolo</H>
        <Steps>
          <li>
            Scegliete lo strumento <Ui>Punto</Ui>.
          </li>
          <li>
            Scegliete un simbolo convenzionale della protezione civile, o un
            marcatore semplice.
          </li>
          <li>Fate clic sulla carta, nel punto desiderato.</li>
          <li>
            Nella scheda che si apre, indicate un nome (« Diga »), un livello,
            un’osservazione, poi <Ui>Salva</Ui>.
          </li>
        </Steps>
        <H>Disegnare una zona o un tragitto</H>
        <Steps>
          <li>
            Strumento <Ui>Zona</Ui> (superficie) o <Ui>Linea</Ui> (tragitto,
            deviazione).
          </li>
          <li>
            Fate clic sui punti uno dopo l’altro, poi terminate come indicato
            sullo schermo.
          </li>
          <li>Indicate un nome e un colore nella scheda.</li>
        </Steps>
        <H>Più carte</H>
        <Steps>
          <li>
            Le schede in alto sulla carta: per esempio « Seguito generale » e «
            Settore Acacias (dettaglio) ». Il <Ui>+</Ui> ne aggiunge una.
          </li>
          <li>
            Ogni carta conserva il proprio sfondo, la propria inquadratura e i
            propri livelli nascosti (<Ui>⋯</Ui> →{" "}
            <Ui>Salva questa inquadratura per questa carta</Ui>).
          </li>
          <li>
            Un oggetto posizionato su una carta appare solo su di essa. Nella
            sua scheda, <Ui>Carte</Ui> permette di mostrarlo su altre carte, o
            su <Ui>Tutte le carte</Ui>.
          </li>
          <li>
            Una nuova carta parte vuota; al momento della creazione si possono
            riprendere gli oggetti della carta visualizzata.
          </li>
        </Steps>
        <H>Dimensione, rotazione, testo</H>
        <ul>
          <li>
            I simboli sono posizionati <strong>su sfondo trasparente</strong>.
            Per il vecchio bollino rotondo: <Ui>Bollino</Ui> nella scheda.
          </li>
          <li>
            Selezionate un oggetto: trascinate l’<strong>angolo</strong> per
            ingrandirlo, la <strong>maniglia rotonda</strong> per ruotarlo.
            Oppure nella scheda, sezione <Ui>Aspetto</Ui>: dimensione S, M, L,
            XL, rotazione, colore, spessore e stile del tratto.
          </li>
          <li>
            Strumento <Ui>Testo</Ui>: scrivete direttamente sulla carta, con o
            senza sfondo dell’etichetta, nella dimensione e nel colore
            desiderati.
          </li>
          <li>
            Strumento <Ui>Disegno</Ui> (matita): tracciate a mano libera, con il
            mouse o con il dito.
          </li>
        </ul>
        <H>Trovare un luogo</H>
        <ul>
          <li>
            <strong>Ricerca di indirizzi</strong>: digitate « Quai des Acacias,
            Carouge ».
          </li>
          <li>
            <Ui>Vai a</Ui>: coordinate MN95 (<code>2 499 800 / 1 115 900</code>)
            o GPS (<code>46.19, 6.14</code>).
          </li>
          <li>
            <Ui>La mia posizione</Ui>: centra la carta dove vi trovate (se
            l’apparecchio lo consente).
          </li>
        </ul>
        <Example>
          <p>
            Una zona blu « Zona inondata Acacias », un punto « Diga », una linea
            rossa « Deviazione route de Veyrier ». La motopompa 2 è posizionata
            sulla diga dal modulo Mezzi.
          </p>
        </Example>
      </>
    ),
    full: (
      <>
        <H>Sfondi della carta</H>
        <p>
          swisstopo a colori, in grigio, in foto aerea, in versione notturna, e
          OpenStreetMap. Scegliete il più leggibile per l’uso: grigio per far
          risaltare i vostri disegni, aereo per vedere il terreno.
        </p>
        <p>
          Le zone già visualizzate sono conservate sulla postazione: offline,
          restano visibili. Se lo sfondo manca, un banner ne indica il motivo:{" "}
          <Ui>Offline</Ui> quando l’apparecchio non ha più rete, oppure « il
          server dello sfondo non risponde » quando internet funziona ma
          swisstopo o OpenStreetMap non risponde (pulsante <Ui>Riprova</Ui>).
          Appena la rete ritorna, le tessere mancanti si ricaricano da sole. Gli
          oggetti restano sempre visibili.
        </p>
        <H>Strumenti</H>
        <Table
          head={["Strumento", "Uso"]}
          rows={[
            [
              "Punto",
              "Un luogo: simbolo convenzionale civile (UFPP) o marcatore semplice.",
            ],
            ["Linea", "Un tragitto, una deviazione, un limite."],
            ["Zona", "Una superficie: zona inondata, settore, zona vietata."],
            [
              "Perimetro",
              "Un cerchio attorno a un punto: sbarramento, evacuazione, sicurezza. Fate clic sul centro, poi sul bordo, oppure scegliete 50 m, 100 m, 200 m, 300 m, 500 m o 1 km. Anelli: più cerchi in una volta (« 100, 300, 1000 »), collegati tra loro. Ogni perimetro diventa una zona normale, denominata con il suo raggio.",
            ],
            [
              "Pennacchio",
              "Un settore a partire da un punto (fumo, gas, zona sottovento): fate clic sull’origine, poi sulla direzione e la lunghezza, oppure inserite la direzione (gradi), l’apertura (da 30° a 90°) e la lunghezza. « Vento attuale » riprende l’ultima previsione del modulo Meteo.",
            ],
            ["Testo", "Un’etichetta scritta direttamente sulla carta."],
            ["Disegno", "Un tratto a mano libera (mouse, dito, stilo)."],
            ["Misura", "Una distanza sulla carta."],
          ]}
        />
        <H>Lavorare con gli oggetti</H>
        <ul>
          <li>
            <strong>Spostare</strong>: trascinate l’oggetto. Un piccolo
            trascinamento di pochi pixel non conta (clic un po’ tremolante):
            l’oggetto resta esattamente dov’era. Se si appoggia un secondo dito
            (pizzicare per zoomare) o se la carta zooma durante il
            trascinamento, l’oggetto torna al suo posto.
          </li>
          <li>
            <strong>Su tablet e telefono</strong>: toccate prima l’oggetto per
            selezionarlo, poi trascinatelo. Spostare o pizzicare la carta sopra
            un simbolo non lo sposta quindi mai.
          </li>
          <li>
            <strong>Lucchetto</strong> (a destra, sotto lo zoom): blocca tutti
            gli oggetti su questa postazione. Il trascinamento sposta allora
            sempre la carta, mai un oggetto. Pratico durante una presentazione o
            un briefing.
          </li>
          <li>
            <strong>Clic</strong>: apre la sua scheda (nome, livello, simbolo,
            colore, osservazioni, collegamenti, eliminare).
          </li>
          <li>
            <strong>Passaggio del mouse</strong>: una scheda di anteprima mostra
            tutto ciò che vi è collegato: messaggi, voci, mezzi…
          </li>
          <li>
            <strong>Livelli</strong>: mostrate o nascondete famiglie di oggetti.
            I livelli proposti provengono dagli elenchi di riferimento.
          </li>
          <li>
            <strong>Elenco degli oggetti</strong>: tutti gli oggetti disegnati,
            per ritrovarli rapidamente.
          </li>
          <li>
            Sotto il cursore, le <strong>coordinate MN95</strong> sono
            visualizzate in tempo reale.
          </li>
          <li>
            <strong>Vista predefinita</strong>: salvate l’inquadratura
            dell’evento per tornarvi con un clic.
          </li>
        </ul>
        <H>Tutti i simboli</H>
        <ul>
          <li>
            I 268 <strong>simboli convenzionali civili UFPP</strong>, per
            gruppo.
          </li>
          <li>
            Oltre un centinaio di <strong>marcatori semplici</strong>: PC
            avanzato, PC arretrato, posto di raccolta, punto di raccolta
            sinistrati, eliporto, ambulanza, sbarramento, deviazione, punto
            d’acqua, elettricità, pericoli chimici… Digitate una parola («
            raccolta », « elicottero ») per trovarli. La ricerca comprende anche
            il tedesco e il francese (« Feuer », « incendie », « Verletzte »).
          </li>
          <li>
            <Ui>Aggiungi un simbolo</Ui>: un’immagine vostra (PNG, SVG, JPEG,
            WebP). <Ui>Rendi lo sfondo trasparente</Ui> cancella lo sfondo
            uniforme; il simbolo è poi condiviso con tutte le postazioni.
          </li>
        </ul>
        <H>Importare ed esportare</H>
        <ul>
          <li>
            <Ui>⋯</Ui> → <Ui>Importa</Ui>: un file KML, KMZ (Google Earth),
            GeoJSON o GPX ricevuto da un partner (polizia, pompieri, geometra).
            Un’anteprima mostra ciò che verrà aggiunto, su quale carta e su
            quale livello.
          </li>
          <li>
            Esportare: immagine PNG di ogni carta, GeoJSON, KML, GPX, dal{" "}
            <Ui>centro di esportazione</Ui>. <Ui>⋯</Ui> →{" "}
            <Ui>GeoJSON in MN95</Ui>: le coordinate svizzere (EPSG:2056) per un
            SIG cantonale.
          </li>
          <li>
            I file in coordinate svizzere (GeoJSON MN95 o MN03) sono
            riconosciuti e convertiti. Le cartelle di un KML diventano livelli,
            i buchi delle zone sono conservati.
          </li>
        </ul>
        <H>Stampare in scala</H>
        <p>
          <Ui>⋯</Ui> → <Ui>Stampa in scala</Ui>: A4 o A3, verticale o
          orizzontale, a 1:5 000, 1:10 000, 1:25 000 o 1:50 000, centrato sulla
          carta visualizzata. Il PDF riporta il reticolo svizzero numerato, la
          legenda dei simboli presenti, la freccia del nord, la scala grafica,
          l’ora, l’evento e la classificazione. Stampatelo al 100 % (senza «
          adatta alla pagina ») per mantenere la scala. È iscritto nel registro
          delle esportazioni.
        </p>
        <H>Layer di geo.admin.ch</H>
        <p>
          <Ui>Livelli</Ui> → <Ui>Layer di geo.admin.ch</Ui> (o il pulsante dello
          sfondo): zone inondabili, ruscellamento, scivolamenti, colate
          detritiche, cadute di sassi, valanghe, pericolo d’incendio boschivo,
          stazioni idrologiche con il loro grado di pericolo di piena, carta di
          allerta piene, vento e pioggia misurati da MeteoSvizzera, catasto,
          dighe, punti d’incontro d’emergenza, beni culturali, zone d’emergenza
          nucleari. Ogni layer ha la sua opacità e un link alla sua legenda
          ufficiale; un clic sulla carta mostra ciò che il layer sa del luogo
          (particella, diga, stazione…). Dati gratuiti della Confederazione e
          dei Cantoni.
        </p>
        <H>Reticolo e coordinate</H>
        <ul>
          <li>
            Pulsante dello sfondo → <Ui>Reticolo MN95</Ui>: linee chilometriche
            numerate (100 m con zoom ravvicinato).
          </li>
          <li>
            <Ui>Mirino al centro</Ui>: le coordinate visualizzate sono quelle
            del centro, pratico con il dito.
          </li>
          <li>
            Un clic sulle coordinate (in basso a sinistra) le copia, in MN95 o
            in WGS84.
          </li>
          <li>
            <Ui>Vai a</Ui> comprende anche i gradi-minuti-secondi (
            <code>46°56′53″N 7°26′51″E</code>), MN03 (
            <code>600 000 / 200 000</code>) e ignora l’altitudine.
          </li>
        </ul>
        <H>Profilo di una linea</H>
        <p>
          Nella scheda di una linea, <Ui>Profilo altimetrico</Ui>: altitudini
          lungo il tracciato (swissALTI3D), salita e discesa cumulate, pendenze.
          Il profilo resta sulla postazione ed è visualizzato anche offline.
        </p>
        <H>Annullare, ripristinare, recuperare</H>
        <ul>
          <li>
            <Ui>⌘Z</Ui> / <Ui>Ctrl+Z</Ui> annulla l’ultima operazione di questa
            postazione sulla carta (posizionamento, spostamento, aspetto,
            eliminazione…), <Ui>⇧⌘Z</Ui> / <Ui>Ctrl+Y</Ui> la ripristina; anche
            con le frecce della barra degli strumenti. Un oggetto modificato nel
            frattempo da un’altra postazione non viene toccato.
          </li>
          <li>
            Risalendo nel tempo, la scheda di un oggetto propone{" "}
            <Ui>Ripristina questo oggetto</Ui>: ritorna nel diario attuale così
            com’era, e la cronologia conserva entrambi gli stati.
          </li>
          <li>
            Da tastiera: nell’elenco degli oggetti, le frecce spostano l’oggetto
            scelto di 10 m (Maiusc: 100 m, Alt: 1 m).
          </li>
        </ul>
        <H>Offline</H>
        <ul>
          <li>
            Le tessere visualizzate restano sulla postazione, con una riserva
            per sfondo: quelle consultate meno di recente vengono eliminate per
            prime.
          </li>
          <li>
            <Ui>⋯</Ui> → <Ui>Carta offline</Ui>: scaricate un settore (zona
            visualizzata o riquadro tracciato), su un intervallo di zoom e per
            gli sfondi desiderati. Il numero di tessere e la dimensione sono
            indicati prima; un settore non viene mai cancellato automaticamente.
            L’elenco mostra i settori conservati e lo spazio utilizzato.
          </li>
          <li>
            Sul telefono, la carta occupa tutto lo schermo; il pulsante schermo
            intero (a destra) nasconde il resto dell’applicazione.
          </li>
        </ul>
        <H>Posizionare da un altro modulo</H>
        <p>
          In un mezzo o in un messaggio, il pulsante{" "}
          <Ui>Posiziona sulla carta</Ui> apre la carta: il punto posizionato è
          automaticamente collegato a quell’elemento. Le posizioni citate nelle
          voci o nei messaggi sono anche proposte sulla carta come{" "}
          <strong>oggetti fantasma</strong>, trasparenti: basta confermarli.
        </p>
        <Note kind="info">
          Gli sfondi della carta e la ricerca di indirizzi provengono da
          internet (swisstopo, OpenStreetMap, geo.admin.ch). Senza connessione,
          lo sfondo può mancare al di fuori delle zone già visualizzate o
          scaricate, ma i vostri oggetti restano. Non esiste un servizio
          gratuito e affidabile di itinerari: i tempi di percorrenza non sono
          calcolati.
        </Note>
      </>
    ),
  },
  {
    id: "resources",
    group: "modules",
    ...mod("resources", "Apri i mezzi"),
    short: (
      <p>
        L’elenco di tutti i mezzi, veicoli, squadre, materiale, e del loro
        stato: disponibile, allarmato, in viaggio, impiegato…
      </p>
    ),
    guide: (
      <>
        <States
          steps={[
            "Disponibile",
            "Allarmato",
            "In viaggio",
            "Impiegato",
            "Rientrato",
          ]}
          extra={["Fuori servizio"]}
        />
        <H>Aggiungere un mezzo</H>
        <Steps>
          <li>Aggiungete un mezzo.</li>
          <li>
            Indicate una designazione (« Motopompa 2 »). Il resto (tipo,
            organizzazione, effettivo…) è facoltativo.
          </li>
          <li>
            <Ui>Salva</Ui>.
          </li>
        </Steps>
        <H>Cambiare lo stato</H>
        <Steps>
          <li>
            Trascinate la scheda del mezzo nella colonna desiderata, per esempio
            da « In viaggio » a « Impiegato ».
          </li>
          <li>
            Se l’opzione è attiva, il cambiamento è registrato automaticamente
            nel diario (« Motopompa 2: In viaggio → Impiegato »).
          </li>
        </Steps>
      </>
    ),
    full: (
      <>
        <H>Tutte le possibilità</H>
        <ul>
          <li>
            <strong>Tabellone per stato</strong> o <strong>elenco</strong>, con
            filtri.
          </li>
          <li>
            Il <strong>totale del personale</strong> impiegato viene calcolato.
          </li>
          <li>
            <strong>Registrare i cambiamenti di stato nel diario</strong>:
            un’opzione da attivare, per tenere traccia di ogni movimento senza
            digitare nulla.
          </li>
          <li>
            <Ui>Posiziona sulla carta</Ui>: il mezzo appare sulla carta,
            collegato alla sua scheda.
          </li>
          <li>
            <Ui>Richiedere mezzi</Ui>: apre una richiesta nella scheda{" "}
            <Ui>Richieste</Ui>, seguita fino all’arrivo (vedere « Richieste di
            mezzi »).
          </li>
          <li>
            <strong>Stampa A4</strong> del tabellone dei mezzi.
          </li>
          <li>
            I tipi di mezzi e le organizzazioni proposti provengono dagli
            elenchi di riferimento; qualsiasi testo libero è accettato.
          </li>
        </ul>
        <Note kind="tip">
          Usate <Ui>Fuori servizio</Ui> per un veicolo in panne invece di
          eliminarlo: resta nella cronologia, e si sa perché manca.
        </Note>
      </>
    ),
  },
  {
    id: "team",
    group: "modules",
    ...mod("team", "Apri la squadra"),
    short: (
      <p>
        Chi fa cosa e chi è presente: i posti (PC avanzato, PC arretrato,
        cellule) e le persone, con la loro funzione e la loro presenza.
      </p>
    ),
    guide: (
      <>
        <H>Organizzare la squadra</H>
        <Steps>
          <li>
            Non volete creare tutto? La <strong>struttura tipo</strong> crea con
            un clic i posti e le cellule abituali (PC avanzato, PC arretrato,
            cellule).
          </li>
          <li>
            Aggiungete una persona: grado, nome, funzione, nominativo, telefono.
            Conta solo il nome, il resto è facoltativo.
          </li>
          <li>
            Nell’organigramma, trascinate la persona nel suo posto o nella sua
            cellula.
          </li>
          <li>
            Aggiornate la sua presenza: <Ui>Presente</Ui>, <Ui>In pausa</Ui>,{" "}
            <Ui>Assente</Ui>, <Ui>Avvicendato</Ui>.
          </li>
        </Steps>
        <Example>
          <p>
            Sgt Muller, operatore diario, nominativo « PC Carouge », nella
            cellula situazione del PC arretrato. Alle 18:00 viene avvicendato:
            un clic su <Ui>Avvicendato</Ui>, il suo sostituto passa a{" "}
            <Ui>Presente</Ui>.
          </p>
        </Example>
      </>
    ),
    full: (
      <>
        <H>Dettagli</H>
        <ul>
          <li>
            Due viste: l’<strong>organigramma</strong> (trascina e rilascia) e
            l’<strong>elenco</strong>.
          </li>
          <li>
            Per ogni persona si possono annotare degli <strong>orari</strong>{" "}
            (arrivo, partenza, avvicendamento).
          </li>
          <li>
            Gradi, funzioni e tipi di posti sono proposti dagli elenchi di
            riferimento, e il testo libero è sempre accettato.
          </li>
          <li>
            Una persona è collegata automaticamente al suo posto, al suo
            nominativo e quindi alla radio che le è consegnata.
          </li>
          <li>
            <strong>Stampa</strong> dell’elenco della squadra in A4.
          </li>
          <li>
            Terza vista <Ui>Presenze</Ui>: arrivi e partenze (pulsante o badge
            QR), tempo di servizio, piano degli avvicendamenti (vedere «
            Presenze e avvicendamento »).
          </li>
        </ul>
        <Note kind="info">
          Le presenze alimentano la pagina Situazione: si vede subito quante
          persone sono disponibili.
        </Note>
      </>
    ),
  },
  {
    id: "radio",
    group: "modules",
    ...mod("radio", "Apri la rete radio"),
    short: (
      <p>
        Il piano della rete radio Polycom: i gruppi di conversazione, i
        nominativi, le radio, chi ha quale radio, e i controlli dei
        collegamenti.
      </p>
    ),
    guide: (
      <>
        <H>Preparare la rete</H>
        <Steps>
          <li>
            <strong>Gruppi</strong>: create i gruppi di conversazione, per
            esempio <code>G101</code> « PCi Condotta » e <code>G102</code> « PCi
            Impiego Arve ».
          </li>
          <li>
            <strong>Nominativi</strong>: « PC Carouge », « Pattuglia Alpha », «
            Squadra Bravo »… con il loro gruppo principale.
          </li>
          <li>
            <strong>Terminali</strong>: le radio. <Ui>Serie</Ui> crea in una
            volta da <code>R-01</code> a <code>R-20</code>.
          </li>
        </Steps>
        <H>Consegnare e riprendere una radio</H>
        <Steps>
          <li>
            Su un terminale: <Ui>Consegna</Ui>. Scegliete il nominativo,
            annotate il detentore (grado, nome) e gli accessori.
          </li>
          <li>Stampate la quittanza di consegna e fatela firmare.</li>
          <li>
            Al ritorno: <Ui>Restituzione</Ui>, stato della radio, accessori resi
            o no.
          </li>
        </Steps>
        <H>Controllare i collegamenti</H>
        <p>
          Per ogni stazione, annotate l’udibilità: <strong>THREE</strong>{" "}
          (buona), <strong>TWO</strong> (debole ma comprensibile),{" "}
          <strong>ONE</strong> (insufficiente) o nessun collegamento. Il{" "}
          <Ui>Controllo generale</Ui> chiama tutte le stazioni in ordine, un
          clic per stazione.
        </p>
        <Note kind="info">
          Un nominativo designa <strong>una funzione, mai una persona</strong>.
          Quando qualcuno viene avvicendato, il nominativo resta.
        </Note>
      </>
    ),
    full: (
      <>
        <H>Gruppi e canali</H>
        <Table
          head={["Campo", "Dettaglio"]}
          rows={[
            ["N.", "Es. G101 (gruppo), D481 (modo diretto), R395 (ripetitore)"],
            ["Modo", "Gruppo (TKG), Diretto (DMO), Ripetitore"],
            ["Designazione", "Es. « PCi Condotta »"],
            [
              "Impiego",
              "Condotta, Impiego, Logistica, Coordinamento, Chiamata, Riserva",
            ],
          ]}
        />
        <p>
          Un gruppo utilizzato da un controllo dei collegamenti non può essere
          eliminato.
        </p>
        <H>Nominativi</H>
        <p>
          Nominativo (unico), funzione, sezione, gruppo principale, gruppo di
          riserva, osservazioni. Lo <strong>schema dei collegamenti</strong>{" "}
          mostra una colonna per gruppo con le sue stazioni: spia verde se è
          stata loro consegnata una radio, nota dell’ultimo controllo, e
          tratteggiate le stazioni che lo hanno come riserva.
        </p>
        <H>Terminali</H>
        <Table
          head={["Campo", "Dettaglio"]}
          rows={[
            ["N. interno", "Es. R-01, unico"],
            ["RFSI", "Identificativo Polycom del terminale"],
            ["Modello", "TPH900, TPH700, TPM700, G2 Smart o altro"],
            ["Tipo", "Portatile, Veicolo, Fisso"],
            ["N. di serie", "Libero"],
            ["Stato", "Operativo, Da ricaricare, Difettoso, Mancante"],
          ]}
        />
        <ul>
          <li>
            Un terminale già consegnato una volta non può essere eliminato:
            impostatelo su Difettoso o Mancante.
          </li>
          <li>
            <Ui>Non restituiti</Ui> mostra solo le radio ancora fuori: pratico a
            fine impiego.
          </li>
          <li>
            Una radio consegnata da <strong>8 ore o più</strong> porta il badge{" "}
            <code>&gt; 8 h</code>: pensate alla batteria.
          </li>
        </ul>
        <H>Consegna e restituzione</H>
        <ul>
          <li>
            Consegna: terminale, ora, nominativo (funzione e sezione si
            compilano da sole), detentore, accessori (batteria di riserva,
            microtel, adattatore FUGA, caricatore, antenna, custodia), stato
            della batteria, osservazioni.
          </li>
          <li>
            Una radio Difettosa o Mancante non può essere consegnata; una radio
            già consegnata deve prima essere restituita.
          </li>
          <li>
            Restituzione: ora, stato, restituzione completa o no (altrimenti
            viene annotato l’elenco degli accessori consegnati). Per una radio
            Mancante viene ricordato di annunciarne la perdita per farla
            bloccare.
          </li>
          <li>
            Opzioni: <Ui>Registra nel diario</Ui> (selezionata per default) e{" "}
            <Ui>Stampa la quittanza</Ui>.
          </li>
          <li>
            La scheda <Ui>Consegne</Ui> conserva tutta la cronologia.
          </li>
        </ul>
        <H>Quittanza di consegna A4</H>
        <p>
          Terminale, detentore, consegna, accessori con una casella ciascuno,
          zona di restituzione e tre firme (detentore alla consegna,
          consegnante, detentore alla restituzione).
        </p>
        <H>Controllo generale</H>
        <p>
          Scegliete il gruppo, poi per ogni stazione fate clic su <Ui>3</Ui>,{" "}
          <Ui>2</Ui>, <Ui>1</Ui> o <Ui>✕</Ui> (un secondo clic annulla). « Fuori
          rete » segnala una stazione senza radio. <Ui>Salva</Ui> crea un
          controllo per ogni stazione valutata e, come opzione, una voce di
          sintesi nel diario (priorità Importante se un collegamento è cattivo).
        </p>
        <H>Etichette QR e scanner</H>
        <Steps>
          <li>
            <Ui>Etichette</Ui>: foglio A4 di 21 etichette con codice QR, numero,
            modello e RFSI. Incollatene una su ogni radio.
          </li>
          <li>
            <Ui>Scansiona</Ui>: la fotocamera legge l’etichetta. Oppure
            scansionate con la fotocamera del telefono, o digitate il numero (
            <code>R-04</code>).
          </li>
          <li>
            orion aic apre direttamente l’azione giusta: restituzione se la
            radio è fuori, consegna se è disponibile.
          </li>
        </Steps>
        <p>
          La fotocamera serve solo a leggere il codice, sull’apparecchio;
          nessuna immagine viene conservata né inviata.
        </p>
        <H>Piano A4</H>
        <p>
          <Ui>Piano A4</Ui> stampa in formato orizzontale il piano della rete, i
          gruppi, i terminali, le consegne e i controlli.
        </p>
        <Note kind="warn">
          Il piano documenta la rete; non comanda le radio. I veri numeri dei
          gruppi e gli RFSI provengono dal piano della flotta cantonale. Quelli
          della dimostrazione sono fittizi.
        </Note>
      </>
    ),
  },
  {
    id: "contacts",
    group: "modules",
    ...mod("contacts", "Apri i contatti"),
    short: (
      <p>
        La rubrica dell’evento: partner, autorità, fornitori… e i numeri
        d’emergenza svizzeri con un clic.
      </p>
    ),
    guide: (
      <>
        <H>Iniziare</H>
        <Steps>
          <li>
            Un clic aggiunge i <strong>numeri d’emergenza svizzeri</strong>.
          </li>
          <li>
            Aggiungete i vostri contatti: nome, organizzazione, categoria,
            telefono, e-mail… (è richiesto solo il nome).
          </li>
          <li>Contrassegnate i più usati come preferiti: restano in alto.</li>
          <li>
            Su un telefono, toccate il numero per chiamare. Sul computer,
            copiatelo con un clic.
          </li>
        </Steps>
        <Table
          head={["Numero", "Per"]}
          rows={[
            [<strong>112</strong>, "Numero d’emergenza europeo"],
            [<strong>117</strong>, "Polizia"],
            [<strong>118</strong>, "Pompieri"],
            [<strong>144</strong>, "Ambulanza, emergenze sanitarie"],
            [<strong>1414</strong>, "Rega, soccorso con elicottero"],
            [<strong>145</strong>, "Tox Info Suisse, intossicazioni"],
            [<strong>143</strong>, "Telefono Amico, aiuto telefonico"],
          ]}
        />
      </>
    ),
    full: (
      <>
        <H>Dettagli</H>
        <ul>
          <li>
            <strong>Importare</strong> contatti da un file vCard (
            <code>.vcf</code>) o CSV.
          </li>
          <li>
            <strong>Esportare</strong> la rubrica in CSV, o{" "}
            <strong>stamparla</strong> in A4.
          </li>
          <li>
            Le categorie proposte provengono dagli elenchi di riferimento.
          </li>
          <li>
            Un contatto il cui nome è anche il mittente di un messaggio o il
            responsabile di una missione vi è collegato automaticamente.
          </li>
        </ul>
        <Note kind="warn">
          In caso di emergenza vitale, chiamate direttamente il numero da un
          telefono. orion aic aiuta a ritrovarlo, non sostituisce la chiamata.
        </Note>
      </>
    ),
  },
  {
    id: "weather",
    group: "modules",
    ...mod("weather", "Apri la meteo"),
    short: (
      <p>
        La meteo del luogo dell’intervento: previsioni MeteoSvizzera,
        osservazioni fatte sul posto e livelli di allerta.
      </p>
    ),
    guide: (
      <>
        <Steps>
          <li>
            <strong>Scegliere il luogo</strong>: ricerca, centro della carta, o
            la vostra posizione.
          </li>
          <li>
            <strong>Richiedere le previsioni</strong>: vengono caricate solo
            quando lo volete voi.
          </li>
          <li>
            Leggere il <strong>grafico su 48 ore</strong> (temperatura, pioggia,
            vento) e i <strong>prossimi 3 giorni</strong>.
          </li>
          <li>
            Annotare un’<strong>osservazione sul posto</strong> e, se utile,
            registrarla nel diario.
          </li>
          <li>
            Annotare un’<strong>allerta</strong> con il suo grado, da 1 a 5.
          </li>
        </Steps>
        <Example>
          <p>
            Osservazione alle 16:20: « Pioggia forte continua, l’Arve è salita
            di 20 cm in un’ora al ponte di Carouge. » Registrata nel diario,
            sarà nel prossimo rapporto.
          </p>
        </Example>
      </>
    ),
    full: (
      <>
        <H>Gradi di pericolo</H>
        <Table
          head={["Grado", "Significato"]}
          rows={[
            ["1", "Nessun pericolo o pericolo debole"],
            ["2", "Pericolo moderato"],
            ["3", "Pericolo marcato"],
            ["4", "Forte pericolo"],
            ["5", "Pericolo molto forte"],
          ]}
        />
        <H>Da dove provengono i dati</H>
        <ul>
          <li>
            Le previsioni provengono dal modello ICON di MeteoSvizzera, tramite
            il servizio Open-Meteo. Vengono inviate solo le coordinate del
            luogo, nient’altro.
          </li>
          <li>
            Senza internet, nessuna previsione; le osservazioni e le allerte
            annotate restano disponibili.
          </li>
          <li>
            Un link apre il sito di MeteoSvizzera per le allerte ufficiali.
          </li>
        </ul>
        <H>Previsioni ricevute: la meteo di prima</H>
        <ul>
          <li>
            Ogni previsione caricata è{" "}
            <strong>conservata nella sessione</strong> (al massimo una ogni 5
            minuti) e condivisa con le postazioni sincronizzate: la sezione{" "}
            <Ui>Previsioni ricevute</Ui> le elenca, un clic mostra quella
            dell’ora scelta.
          </li>
          <li>
            Nella <Ui>Macchina del tempo</Ui>, la meteo mostra automaticamente
            l’ultima previsione ricevuta prima dell’ora visualizzata: « alle 14,
            si annunciavano 40 mm ».
          </li>
        </ul>
        <Note kind="warn">
          Le allerte ufficiali sono quelle di MeteoSvizzera e delle autorità.
          orion aic aiuta ad annotarle e a condividerle, non le sostituisce.
        </Note>
      </>
    ),
  },
  {
    id: "agenda",
    group: "modules",
    ...mod("agenda", "Apri l’agenda"),
    short: (
      <p>
        Il ritmo di condotta: i prossimi rapporti, orientamenti e
        avvicendamenti, con un conto alla rovescia per non dimenticare nulla.
      </p>
    ),
    guide: (
      <>
        <H>Pianificare</H>
        <Steps>
          <li>
            Aggiungete un appuntamento: un titolo, un tipo (rapporto,
            orientamento, avvicendamento…), un’ora. Il luogo e le osservazioni
            sono facoltativi.
          </li>
          <li>
            Per un appuntamento ricorrente: <Ui>Pianifica un ritmo</Ui>, per
            esempio un rapporto ogni 2 ore a partire dalle 08:00.
          </li>
          <li>
            Il conto alla rovescia è visualizzato qui e sulla pagina Situazione.
          </li>
          <li>
            Una volta svolto l’appuntamento: <Ui>Segna come tenuto</Ui>, e
            registratelo nel diario.
          </li>
        </Steps>
      </>
    ),
    full: (
      <>
        <H>Dettagli</H>
        <ul>
          <li>
            I tipi di appuntamento proposti provengono dagli elenchi di
            riferimento.
          </li>
          <li>
            <strong>Stampa</strong> dell’agenda in A4, per affiggerla al muro
            del PC.
          </li>
          <li>
            Ogni appuntamento può essere collegato a persone, posti o voci del
            diario.
          </li>
        </ul>
        <Example>
          <p>
            Ritmo: rapporto di condotta alle 08:00, 10:00, 12:00… Avvicendamento
            alle 18:00. Alle 11:50, la pagina Situazione mostra « Rapporto di
            condotta tra 10 min ».
          </p>
        </Example>
      </>
    ),
  },
  {
    id: "network",
    group: "modules",
    ...mod("network", "Apri la rete dei collegamenti"),
    short: (
      <p>
        Tutte le informazioni e i loro collegamenti, disegnati come una rete
        neurale: ogni punto è un elemento, ogni tratto un collegamento.
      </p>
    ),
    guide: (
      <>
        <Steps>
          <li>
            <strong>Passate il mouse</strong> su un punto: i suoi vicini si
            accendono e appare un’anteprima.
          </li>
          <li>
            <strong>Fate clic</strong>: un pannello mostra tutti i suoi
            collegamenti. Potete aggiungerne o rimuoverne.
          </li>
          <li>
            <strong>Filtrate</strong> per tipo (messaggi, voci, mezzi, persone…)
            per vederci più chiaro.
          </li>
          <li>
            <strong>Cercate</strong> un elemento per nome, poi <Ui>Ricentra</Ui>{" "}
            per tornare alla vista d’insieme.
          </li>
        </Steps>
      </>
    ),
    full: (
      <>
        <H>A cosa serve</H>
        <ul>
          <li>
            Ogni colore corrisponde a un tipo di elemento, lo stesso ovunque in
            orion aic.
          </li>
          <li>
            Individuare ciò che è al centro dell’evento: un luogo collegato a
            molti messaggi e mezzi.
          </li>
          <li>
            Individuare ciò che è isolato: un messaggio che nessuno ha ancora
            collegato a nulla.
          </li>
          <li>
            Il grafo si muove lentamente. Se l’animazione disturba:{" "}
            <Path
              steps={[
                "Impostazioni",
                "Questa postazione",
                "Animazioni",
                "Ridotte",
              ]}
            />
            .
          </li>
        </ul>
      </>
    ),
  },

  {
    id: "trace",
    group: "modules",
    ...mod("trace", "Apri la tracciabilità"),
    short: (
      <p>
        Chi ha fatto cosa, e quando: ogni creazione, modifica ed eliminazione è
        annotata con il suo autore, l’ora e il dettaglio. Nulla si cancella. Si
        possono anche confrontare due momenti, ritrovare le istantanee e i
        registri delle esportazioni e delle presentazioni.
      </p>
    ),
    guide: (
      <>
        <H>Ritrovare chi ha fatto cosa</H>
        <Steps>
          <li>
            Aprite <Ui>Tracciabilità</Ui> nella barra a sinistra (oppure{" "}
            <K>⌘K</K> → « Tracciabilità »).
          </li>
          <li>
            La scheda <Ui>Chi ha fatto cosa</Ui> elenca tutte le modifiche,
            dalla più recente alla più vecchia, raggruppate per ora.
          </li>
          <li>
            Filtrate: fate clic su una <strong>persona</strong>, scegliete un{" "}
            <strong>modulo</strong>, un tipo di azione o un periodo, oppure
            digitate una parola (un nome, un valore, un luogo).
          </li>
          <li>
            Fate clic sul nome di un elemento per aprirlo, oppure su{" "}
            <Ui>Vedi l’operazione in quel momento</Ui> per rivedere tutto
            com’era.
          </li>
        </Steps>
        <H>La cronologia di un solo elemento</H>
        <p>
          Ogni scheda (mezzo, messaggio, oggetto della carta, persona…) mostra
          in basso: « Creato da … il … · modificato da … 5 min fa ». Il pulsante{" "}
          <Ui>Cronologia</Ui> apre tutte le sue versioni, con ciò che è cambiato
          (vecchio valore barrato, nuovo valore evidenziato).
        </p>
        <Example>
          <p>
            Chi ha spostato il PC avanzato? Aprite l’oggetto sulla carta →{" "}
            <Ui>Cronologia</Ui>: « Cartografo ha modificato Posizione /
            tracciato alle 09:05 ».
          </p>
        </Example>
        <H>Ripristinare una vecchia versione</H>
        <p>
          Nella cronologia di un elemento, <Ui>Ripristina questa versione</Ui>{" "}
          rimette i suoi vecchi valori. Un elemento eliminato può tornare così.
          Anche il ripristino viene annotato, con il vostro nome: la cronologia
          non perde mai nulla.
        </p>
      </>
    ),
    full: (
      <>
        <H>Cosa viene tracciato</H>
        <ul>
          <li>
            Tutto ciò che si modifica in orion aic: diario (le sue versioni ed
            eliminazioni), messaggi, missioni, carta (oggetti, carte, simboli
            personalizzati), mezzi, squadra e posti, rete radio, contatti, meteo
            (osservazioni, allerte, previsioni ricevute), agenda, informazioni
            chiave, tabelle della situazione, collegamenti, elenchi di
            riferimento, proprietà del diario, istantanee, esportazioni e
            presentazioni.
          </li>
          <li>
            « Chi » è il nome dell’operatore dichiarato sulla postazione (menu
            in alto a destra). Non è firmato: ogni postazione deve usare il suo
            vero nome o la sua funzione.
          </li>
          <li>
            Più piccoli ritocchi di una stessa persona sullo stesso elemento in
            meno di 20 secondi contano come una sola versione.
          </li>
          <li>
            La cronologia viaggia con la sessione: è sincronizzata tra le
            postazioni e inclusa nell’archivio <code>.orionaic</code>.
          </li>
          <li>
            I dati creati prima di questa versione di orion aic conservano la
            loro data di creazione e la loro ultima modifica; la loro cronologia
            completa inizia dalla prima modifica successiva.
          </li>
        </ul>
        <H>Le schede</H>
        <Table
          head={["Scheda", "Contenuto"]}
          rows={[
            [
              "Chi ha fatto cosa",
              "Tutte le modifiche, filtri per persona, modulo, azione, periodo, ricerca",
            ],
            [
              "Confronta",
              "Ciò che è stato aggiunto, modificato, eliminato tra due momenti, per modulo; carte affiancate; stampa",
            ],
            [
              "Istantanee",
              "I momenti con un nome: rivedere, confrontare, presentare, esportare",
            ],
            [
              "Esportazioni",
              "Registro dei file prodotti: chi, quando, cosa, impronta; verificare un documento",
            ],
            [
              "Presentazioni",
              "Chi ha presentato, a chi, quando, quale versione",
            ],
          ]}
        />
      </>
    ),
  },
];
