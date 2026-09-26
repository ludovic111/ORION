import { Briefcase } from "lucide-react";
import type { Topic } from "../content";
import { H, Note, Path, Steps, Table, Ui } from "../kit";

// "PC in valigia" (Italian): orion aic without internet, served by a small
// computer with its own Wi-Fi. Long version: docs/PC-EN-VALISE.md.

const ADDRESS = "https://10.42.0.1:4443";

export const VALISE_TOPIC: Topic = {
  id: "valise",
  group: "together",
  title: "PC in valigia (senza internet)",
  icon: Briefcase,
  hue: 38,
  short: (
    <p>
      Un piccolo computer in una valigia crea{" "}
      <strong>la propria rete Wi-Fi</strong>. I tablet, i telefoni e i computer
      del PC vi si connettono e lavorano insieme sulla stessa sessione,{" "}
      <strong>senza internet</strong>. Mancano solo la ricerca di luoghi, la
      meteo e le zone della carta mai visualizzate.
    </p>
  ),
  guide: (
    <>
      <H>All’arrivo sul posto</H>
      <Steps>
        <li>
          Accendete il <strong>server</strong> della valigia (Raspberry Pi o
          vecchio computer portatile). Attendete un minuto.
        </li>
        <li>
          Su ogni apparecchio, connettetevi al Wi-Fi del PC, per esempio{" "}
          <code>PC-ORION</code>. Se segnala « nessuna connessione internet »,
          scegliete « resta connesso ». Su un telefono, disattivate i dati
          mobili.
        </li>
        <li>
          Aprite l’icona di orion aic della schermata iniziale, oppure
          l’indirizzo riportato sulla scheda della valigia, per esempio{" "}
          <code>{ADDRESS}</code>. Il server lo mostra anche come codice QR.
        </li>
        <li>
          Una postazione crea la sessione (
          <Path
            steps={[
              "Impostazioni",
              "Sincronizzazione",
              "Crea un codice di sessione",
            ]}
          />
          ). Le altre scelgono <Ui>Unisciti</Ui> e digitano il codice, come al
          solito.
        </li>
      </Steps>
      <H>La primissima volta su un apparecchio</H>
      <Steps>
        <li>
          Il browser avverte: <em>certificato non riconosciuto</em>. È normale:
          il server ha fabbricato il proprio certificato.
        </li>
        <li>
          Aprite i dettagli del certificato e confrontate l’
          <strong>impronta SHA-256</strong> con quella annotata sulla scheda
          della valigia.
        </li>
        <li>
          Se è la stessa, continuate. Altrimenti fermatevi e avvisate la persona
          responsabile del materiale.
        </li>
      </Steps>
      <Note kind="warn">
        Usate <strong>sempre lo stesso indirizzo</strong>. Per il browser, un
        altro indirizzo è un altro sito: il salvataggio della postazione, le
        carte preparate e il certificato accettato non ci sono.
      </Note>
      <Note kind="info">
        Il server non conserva alcun dato: ogni postazione ha la propria copia
        completa e cifrata. Se il server si spegne, si continua a lavorare; le
        postazioni si riallineano quando ritorna.
      </Note>
    </>
  ),
  full: (
    <>
      <H>Che cosa funziona senza internet</H>
      <Table
        head={["Funzione", "Senza internet"]}
        rows={[
          ["Diario, messaggi, mezzi, squadra, radio, contatti, agenda", "Sì"],
          ["Sincronizzazione tra le postazioni del Wi-Fi", "Sì"],
          ["Stampa, PDF, esportazioni, salvataggio cifrato", "Sì"],
          ["Oggetti della carta, importazione KML / KMZ / GeoJSON / GPX", "Sì"],
          [
            "Sfondo della carta",
            "Solo le zone già visualizzate su questa postazione, a questo indirizzo",
          ],
          ["Ricerca di luoghi (geo.admin.ch)", "No: digitate delle coordinate"],
          ["Meteo (Open-Meteo)", "No"],
        ]}
      />
      <H>Il materiale</H>
      <p>
        Prezzi indicativi in Svizzera (2026), pagati dall’organizzazione. Nessun
        modello è imposto.
      </p>
      <Table
        head={["Elemento", "A che cosa serve", "CHF"]}
        rows={[
          ["Raspberry Pi 5, 8 GB", "Il server", "95"],
          ["Alimentatore ufficiale USB-C 27 W", "Dalla rete elettrica", "15"],
          ["Custodia con ventola", "Protezione, raffreddamento", "15"],
          ["Scheda microSD 64 GB A2", "Sistema e applicazione", "15–20"],
          ["oppure SSD (NVMe o USB)", "Più robusto della microSD", "40–60"],
          [
            "Batteria RTC del Pi 5 (opzione)",
            "Mantiene l’ora senza internet",
            "5",
          ],
          [
            "Router Wi-Fi da viaggio (opzione)",
            "Più apparecchi, portata",
            "40–90",
          ],
          [
            "Powerbank USB-C PD 20 000 mAh, da 27 a 45 W",
            "Senza rete elettrica",
            "50–80",
          ],
          [
            "Stampante laser Wi-Fi (o quella del PC)",
            "Schede e rapporti",
            "120–200",
          ],
          ["Cavi Ethernet e USB-C", "Preparazione, collegamenti", "10–20"],
          ["Valigia stagna con gommapiuma", "Trasporto", "50–150"],
          [
            "Etichette, scheda plastificata",
            "Wi-Fi, indirizzo, impronta",
            "10",
          ],
        ]}
      />
      <p>
        Totale: circa <strong>CHF 250</strong> (kit minimo) fino a{" "}
        <strong>CHF 750</strong> (SSD, router, stampante, valigia rinforzata).
        Va bene anche un <strong>vecchio computer portatile</strong>, per CHF 0:
        ha già schermo, batteria e Wi-Fi. Disattivatene la messa in standby.
      </p>
      <H>Installare il server (una volta, con internet)</H>
      <Steps>
        <li>
          Con Raspberry Pi Imager: <strong>Raspberry Pi OS Lite 64-bit</strong>,
          paese del Wi-Fi <code>CH</code>, utente <code>orion</code>.
        </li>
        <li>
          Installate Node.js 22.18 o più recente, poi copiate orion aic
          (archivio <code>/source/orion-aic-source.tar.gz</code> del sito, o
          git).
        </li>
        <li>
          Nella cartella: <code>npm ci</code> poi <code>npm run lan</code>. Il
          server mostra i suoi indirizzi, l’impronta del certificato e un codice
          QR.
        </li>
        <li>
          Perché si avvii da solo con il Pi: il servizio fornito{" "}
          <code>docs/orion-aic-lan.service</code>.
        </li>
      </Steps>
      <p>
        Il dettaglio, comando per comando, si trova nella guida{" "}
        <code>docs/PC-EN-VALISE.md</code> del codice sorgente.
      </p>
      <H>Il Wi-Fi del PC</H>
      <Table
        head={["Soluzione", "Per chi", "Indirizzo tipico"]}
        rows={[
          [
            "Punto di accesso del Raspberry Pi (nmcli)",
            "Una sala, una decina di apparecchi",
            "https://10.42.0.1:4443",
          ],
          [
            "Router da viaggio + server collegato via cavo",
            "Più apparecchi, più locali",
            "https://192.168.8.10:4443",
          ],
          [
            "Hotspot mobile di Windows",
            "Vecchio portatile Windows, al massimo 8 apparecchi",
            "https://192.168.137.1:4443",
          ],
        ]}
      />
      <p>
        Il Wi-Fi ha una password di almeno 12 caratteri. Decide chi può
        raggiungere il server; il <strong>codice di sessione</strong> decide chi
        può leggere i dati.
      </p>
      <H>Preparare le carte</H>
      <p>
        Ogni postazione conserva i riquadri (tile) della carta che ha già
        visualizzato, fino a <strong>4 000</strong>. Non c’è un pulsante «
        scarica »: si prepara un settore percorrendolo.
      </p>
      <Steps>
        <li>
          Collegate il server a internet via cavo: le postazioni del Wi-Fi del
          PC hanno allora internet <em>e</em> l’indirizzo del server.
        </li>
        <li>
          Su ogni postazione, aprite la <Ui>Carta</Ui> tramite l’indirizzo del
          server (non tramite orionaic.xyz: sarebbe un’altra cache).
        </li>
        <li>
          Percorrete il settore a ogni zoom utile, con ogni sfondo utile,
          lasciando caricare le immagini. <Ui>Notte</Ui> usa i riquadri della{" "}
          <Ui>Carta grigia</Ui>.
        </li>
        <li>Scollegate internet e verificate che tutto si visualizzi.</li>
      </Steps>
      <Note kind="tip">
        Un settore di 3 × 3 km, dallo zoom della regione fino a quello
        dell’edificio, richiede circa 1 100 riquadri per sfondo. In seguito,
        evitate di navigare altrove su questa postazione: i nuovi riquadri
        scaccerebbero i vecchi.
      </Note>
      <H>Stampare</H>
      <p>
        Si stampa dal browser di ogni postazione, non dal server. La soluzione
        più semplice: una stampante Wi-Fi connessa al Wi-Fi del PC (AirPrint,
        IPP Everywhere), trovata senza driver dai tablet e dai computer. Oppure
        una stampante USB su un portatile che funge da postazione di stampa.
      </p>
      <H>Corrente e ora</H>
      <ul>
        <li>
          Il Pi 5 consuma da 4 a 8 W: un powerbank da 20 000 mAh dura circa da 7
          a 12 ore (da 5 a 8 ore con un router da viaggio).
        </li>
        <li>
          Per spegnerlo: <code>sudo poweroff</code> o una breve pressione sul
          suo pulsante, poi attendere la fine del lampeggio verde. Non staccare
          il cavo di colpo.
        </li>
        <li>
          Le ore del diario provengono da ogni postazione: verificate l’ora dei
          tablet. Senza internet, il Pi perde l’ora: una batteria RTC la
          mantiene.
        </li>
      </ul>
      <H>Prima di partire</H>
      <ul>
        <li>Tutto è carico: powerbank, tablet, telefoni, portatili.</li>
        <li>
          Prova completa senza internet: il Wi-Fi appare, l’indirizzo si apre,
          due postazioni si sincronizzano.
        </li>
        <li>
          Ogni postazione ha aperto l’indirizzo una volta e accettato il
          certificato.
        </li>
        <li>I settori della carta sono preparati e verificati offline.</li>
        <li>
          L’impronta del certificato, il nome del Wi-Fi e l’indirizzo sono sulla
          scheda della valigia.
        </li>
        <li>È stata fatta una stampa di prova; carta e toner ci sono.</li>
        <li>Si sa chi crea la sessione e trasmette il codice sul posto.</li>
      </ul>
      <H>Se non funziona</H>
      <Table
        head={["Problema", "Che cosa fare"]}
        rows={[
          [
            "Avviso di certificato ogni volta",
            "Sempre lo stesso indirizzo. Se l’impronta è cambiata (certificato rinnovato), confrontatela con il server poi accettate di nuovo.",
          ],
          [
            "Connesso al Wi-Fi, ma la pagina non si apre",
            "Disattivate i dati mobili; digitate correttamente https:// e :4443.",
          ],
          ["Il Wi-Fi non appare", "Paese del Wi-Fi CH sul Pi; riavviatelo."],
          [
            "Postazione « Da solo » mentre altre lavorano",
            "Verificate il codice di sessione; ricaricate la pagina. Nulla va perso.",
          ],
          [
            "Sfondo della carta assente",
            "Zona non preparata su questa postazione: lavorate con gli oggetti e le coordinate.",
          ],
        ]}
      />
    </>
  ),
};
