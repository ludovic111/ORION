import type { LocalizedTemplate } from "./checklist-library.ts";

// Built-in checklists in Italian (Swiss civil protection). Same keys and the
// same steps, in the same order, as the French lists of checklist-library.ts:
// step n here is step n there (id, function, timer and journal flag come
// from the French list; the event type and the functions are the Italian
// référentiel values of shared/i18n/seeds.ts).

export const TEMPLATES_IT: Record<string, LocalizedTemplate> = {
  "ouverture-pc": {
    name: "Apertura del PC",
    description:
      "Dall’allarme al primo punto della situazione: locali, energia, collegamenti, funzioni, annunci.",
    steps: [
      "Confermare la ricezione dell’allarme: ora, provenienza (centrale d’intervento, centrale d’allarme cantonale, comune), missione ricevuta",
      "Aprire il diario d’intervento e registrare la mobilitazione",
      "Controllare i locali del PC: accesso, elettricità, ventilazione, riscaldamento, acqua, servizi igienici",
      "Mettere in funzione l’alimentazione d’emergenza (gruppo elettrogeno, UPS) e testare la commutazione",
      "Mettere in funzione postazioni di lavoro, stampante, rete e sincronizzazione tra le postazioni",
      "Mettere in funzione le radio Polycom, controllo dei collegamenti con la centrale e con le forze impiegate",
      "Testare le linee fisse e mobili, diffondere i numeri del PC",
      "Esporre la carta della situazione, le tabelle della situazione e il ritmo di condotta",
      "Allestire la lista delle presenze e attribuire le funzioni (condotta, diario, radio, situazione)",
      "Annunciare l’apertura del PC (ora, numeri, nominativo): polizia, pompieri, servizio sanitario, comune, cantone",
      "Fissare l’ora del primo rapporto di condotta e il ritmo di condotta",
      "Organizzare la sussistenza e il piano di avvicendamento se l’impiego supera le 12 ore",
      "Primo punto della situazione al capo intervento",
    ],
  },
  crue: {
    name: "Piena / inondazione",
    description:
      "Seguire i livelli, proteggere le zone minacciate, chiudere le rive, preparare l’evacuazione.",
    steps: [
      "Rilevare livelli e portate (idrologia UFAM, stazioni cantonali) e le relative previsioni",
      "Riportare nel modulo Meteo le allerte piena e pioggia (MeteoSvizzera, UFAM), con il loro grado di pericolo",
      "Segnare sulla carta le zone minacciate e gli oggetti sensibili (case per anziani, scuole, campeggi, autorimesse sotterranee)",
      "Coordinarsi con i pompieri e la polizia: settori, accessi, deviazioni",
      "Ordinare la ricognizione di ponti, argini e sottopassaggi, con l’ora del rapporto",
      "Richiedere e far giungere sacchi di sabbia, motopompe, barriere mobili",
      "Far chiudere rive, passerelle e strade inondabili (sbarramenti, segnaletica)",
      "Preparare l’evacuazione preventiva di persone e animali dalla zona rossa, con luogo d’accoglienza",
      "Informare la popolazione: istruzioni di comportamento, zone da evitare (comune, Alertswiss, media)",
      "Proteggere con i gestori impianti di depurazione, stazioni di pompaggio e cabine di trasformazione",
      "Controllare l’evoluzione del livello a ogni rapporto; prevedere il calo delle acque e il pompaggio delle cantine",
      "Pianificare l’avvicendamento delle squadre impiegate",
    ],
  },
  blackout: {
    name: "Interruzione di corrente / blackout",
    description:
      "Mantenere il PC con l’alimentazione d’emergenza, proteggere le persone dipendenti, informare senza rete.",
    steps: [
      "Ottenere dal gestore di rete l’estensione e la durata probabile dell’interruzione",
      "Passare il PC sull’alimentazione d’emergenza e annotare l’autonomia di carburante",
      "Commutare i collegamenti su Polycom (e telefono satellitare) se la rete mobile cade",
      "Attivare i punti di incontro d’emergenza del comune",
      "Censire le persone dipendenti da apparecchi medici e le case per anziani; alimentazione elettrica o evacuazione",
      "Garantire il carburante dei gruppi elettrogeni (ospedale, case per anziani, impianto di depurazione, acqua potabile)",
      "Verificare con l’azienda dell’acqua la distribuzione di acqua potabile e i pompaggi",
      "Informare la popolazione con altoparlanti, manifesti e radio a batterie",
      "Pattugliare i punti sensibili: ascensori bloccati, gallerie, incroci",
      "Prevedere locali riscaldati se l’interruzione si prolunga con il freddo",
      "Preparare con il gestore di rete il ripristino graduale della corrente",
    ],
  },
  canicule: {
    name: "Canicola",
    description:
      "Proteggere le persone vulnerabili isolate, aprire luoghi freschi, adattare il lavoro del personale impiegato.",
    steps: [
      "Seguire l’allerta canicola di MeteoSvizzera (grado di pericolo, temperature notturne)",
      "Attivare il piano canicola cantonale con il medico cantonale",
      "Censire le persone vulnerabili isolate (elenchi comunali, servizi di assistenza e cura a domicilio)",
      "Organizzare telefonate o visite quotidiane alle persone isolate",
      "Aprire locali rinfrescati e punti d’acqua, diffonderne gli indirizzi",
      "Informare la popolazione: bere, restare al fresco, non lasciare bambini né animali in auto",
      "Adattare il lavoro dei militi: ore fresche, pause, acqua, protezione solare",
      "Coordinare con il servizio sanitario (144) gli interventi legati al caldo",
      "Sorvegliare il pericolo d’incendio di bosco e i divieti di accendere fuochi",
      "Registrare il bilancio della giornata: visite, interventi, incidenti",
    ],
  },
  abc: {
    name: "Incidente chimico / ABC",
    description:
      "Perimetro, vento, confinamento della popolazione, decontaminazione, cessato allarme.",
    steps: [
      "Registrare la sostanza (numero ONU, scheda di dati di sicurezza), la quantità e il luogo esatto",
      "Rilevare direzione e velocità del vento; tracciare sulla carta il settore sottovento",
      "Far rispettare il perimetro fissato dal capo intervento pompieri / difesa chimica",
      "Istruzione alla popolazione: restare al chiuso, chiudere porte e finestre, spegnere la ventilazione",
      "Informare Tox Info Suisse (145), il chimico cantonale e, se necessario, la centrale ABC",
      "Preparare con il servizio sanitario una piazza di decontaminazione e di accoglienza delle persone colpite",
      "Definire gli accessi e le vie di fuga fuori dalla nube, far chiudere le strade",
      "Controllare la protezione e l’avvicendamento del personale impiegato (apparecchi di protezione della respirazione, contaminazione)",
      "Far misurare l’evoluzione della nube o dell’inquinamento",
      "Preparare la revoca delle misure e il cessato allarme alla popolazione",
    ],
  },
  tempete: {
    name: "Tempesta",
    description:
      "Chiudere ciò che è esposto, sgomberare gli assi prioritari, censire i danni.",
    steps: [
      "Seguire l’allerta vento di MeteoSvizzera e le raffiche previste (Meteo → soglie)",
      "Far chiudere parchi, boschi, manifestazioni all’aperto e cantieri esposti",
      "Preparare le squadre di sgombero: motoseghe, potatura, teloni",
      "Stabilire con i pompieri le priorità: assi principali, accessi agli ospedali, linee elettriche",
      "Riportare sulla carta strade interrotte, alberi caduti, tetti danneggiati",
      "Informare la popolazione: evitare boschi e rive, fissare o ritirare gli oggetti",
      "Controllare l’ancoraggio delle tende e delle installazioni dell’impiego",
      "Bilancio dei danni dopo il passaggio e priorità di ripristino",
    ],
  },
  seisme: {
    name: "Terremoto",
    description:
      "Sicurezza del PC, collegamenti, triage dei danni, salvataggio, alloggio d’emergenza.",
    steps: [
      "Registrare ora, magnitudo ed epicentro (Servizio sismico svizzero)",
      "Verificare il PC (crepe, gas, elettricità) e la sicurezza della squadra; spostare il PC se necessario",
      "Stabilire i collegamenti Polycom con comuni e partner; censire gli annunci di danni",
      "Effettuare la ricognizione di ospedali, scuole, case per anziani, ponti e condotte principali",
      "Classificare i danni sulla carta: crollato, danneggiato, intatto",
      "Coordinare ricerca e salvataggio (pompieri, soccorso, cani) nei punti di danno",
      "Aprire luoghi d’accoglienza e d’alloggio d’emergenza per i senzatetto",
      "Informare la popolazione: repliche, non entrare negli edifici danneggiati",
      "Richiedere la valutazione degli edifici da parte di ingegneri",
      "Preparare il rinforzo (cantone, esercito) se i mezzi propri non bastano",
    ],
  },
  recherche: {
    name: "Ricerca di persone",
    description:
      "Connotati, settori, squadre, seguito delle zone perlustrate, a supporto della polizia.",
    steps: [
      "Registrare i connotati: nome, età, descrizione, abbigliamento, salute, ultimo luogo e ora",
      "Confermare con la polizia chi conduce la ricerca e il ruolo della protezione civile",
      "Definire sulla carta i settori di ricerca, la loro priorità e il loro responsabile",
      "Impiegare le squadre (effettivo, radio, nominativo) e fissare l’ora del rapporto",
      "Tenere la tabella dei settori perlustrati e da perlustrare",
      "Organizzare il punto di raccolta, la registrazione dei volontari e la sussistenza",
      "Coordinare cani da ricerca, drone ed elicottero (polizia, Rega)",
      "Trasmettere immediatamente ogni indizio alla polizia, senza spostarlo",
      "Avvicendamento delle squadre; fine della ricerca su decisione della polizia",
    ],
  },
  accueil: {
    name: "Accoglienza di persone evacuate",
    description:
      "Alloggio d’emergenza: aprire il luogo, registrare, alloggiare, nutrire, informare.",
    steps: [
      "Conoscere il numero di persone, i loro bisogni (mobilità, medicamenti, animali) e l’ora d’arrivo",
      "Aprire il luogo d’accoglienza (impianto di protezione, sala): chiavi, elettricità, riscaldamento, servizi igienici",
      "Allestire la registrazione: elenco nominativo, provenienza, contatto",
      "Organizzare posti letto, coperte, pasti e acqua",
      "Prevedere l’assistenza sanitaria e psicologica (servizio sanitario, care team)",
      "Prendere in carico gli animali domestici o affidarli",
      "Informare le persone accolte: durata probabile, regole, contatti",
      "Trasmettere gli elenchi alla polizia e al comune (informazioni ai familiari)",
      "Tenere aggiornato il numero di persone alloggiate (informazioni chiave)",
      "Pianificare l’avvicendamento del personale d’accoglienza e il rientro delle persone",
    ],
  },
};
