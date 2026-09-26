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
    title: "Erste Schritte",
    icon: Rocket,
    hue: 250,
    short: (
      <p>
        orion aic hilft einer Zelle Führungsunterstützung,{" "}
        <strong>
          alles festzuhalten, alles zu verfolgen und alles wiederzufinden
        </strong>{" "}
        – während einer Übung oder eines Einsatzes. Es läuft im Browser, ohne
        Konto: Öffnen Sie <a href={SITE}>orionaic.xyz</a> und legen Sie los.
      </p>
    ),
    guide: (
      <>
        <H>In 5 Schritten starten</H>
        <Steps>
          <li>
            <strong>Die Website öffnen</strong> <a href={SITE}>{SITE}</a> auf
            einem Computer, Tablet oder Telefon. Um ohne jedes Risiko
            auszuprobieren, klicken Sie auf <Ui>Demo-Übung öffnen</Ui>: Eine
            vollständige fiktive Übung, « Hochwasser der Arve », wird geladen.
          </li>
          <li>
            <strong>Eine Sitzung erstellen.</strong> Register{" "}
            <Ui>Neue Sitzung</Ui>: den Namen des Ereignisses (zum Beispiel «
            Hochwasser der Arve »), Ihren Namen oder Ihre Funktion und den Modus{" "}
            <Ui>Übung</Ui> oder <Ui>Einsatz</Ui>.
          </li>
          <li>
            <strong>Ihre Daten schützen.</strong> Lassen Sie{" "}
            <Ui>Verschlüsselte Sicherung auf diesem Arbeitsplatz</Ui> angekreuzt
            und wählen Sie einen <em>Wiederherstellungssatz</em> mit mindestens
            12 Zeichen. Notieren Sie ihn an einem sicheren Ort: Niemand kann ihn
            für Sie wiederfinden.
          </li>
          <li>
            <strong>Das erste Ereignis festhalten.</strong> Schreiben Sie im{" "}
            <Ui>Journal</Ui>, was geschieht, dann <Ui>Speichern</Ui> (oder{" "}
            <K>⌘↵</K> / <K>Ctrl+↵</K>). Der Eintrag erhält eine Nummer: #001.
          </li>
          <li>
            <strong>Die anderen Arbeitsplätze einladen</strong> (wenn Sie
            mehrere sind).{" "}
            <Path
              steps={[
                "Einstellungen",
                "Synchronisation",
                "Sitzungscode erstellen",
              ]}
            />
            . Auf dem anderen Arbeitsplatz: <Ui>Beitreten</Ui>, dann den Code
            eingeben. Schon arbeiten Sie zusammen.
          </li>
        </Steps>
        <Example>
          <p>
            14:05, die Patrouille Alpha meldet per Funk: « Die Arve tritt am
            Quai des Acacias über die Ufer, 30 cm Wasser auf der Strasse. » Sie
            erfassen es im Journal, Art <Ui>Nachricht</Ui>, Priorität{" "}
            <Ui>Dringend</Ui>, Absender « Patrouille Alpha ». Es ist
            gespeichert, nummeriert und auf allen Arbeitsplätzen sichtbar.
          </p>
        </Example>
        <Note kind="tip">
          Nicht mehr weiter? Die Schaltfläche <Ui>?</Ui> oben auf jeder Seite
          öffnet die Hilfe zu dieser Seite. Und <K>⌘K</K> / <K>Ctrl+K</K> findet
          alles: einen Eintrag, ein Mittel, eine Aktion.
        </Note>
      </>
    ),
    full: (
      <>
        <H>Den Umfang der Hilfe wählen</H>
        <p>
          Oben auf dieser Seite legen drei Schaltflächen den Detaillierungsgrad
          für die ganze Dokumentation fest: <Ui>Kurz</Ui> (wozu es dient, in
          zwei Sätzen), <Ui>Anleitung</Ui> (die Schritte für die wichtigsten
          Aufgaben) und <Ui>Alle Details</Ui> (jedes Feld, jede Option, jede
          Grenze). Jedes Thema hat zudem eine eigene Schaltfläche{" "}
          <Ui>Mehr Details</Ui>, um einen einzelnen Punkt zu vertiefen. Ihre
          Wahl wird auf diesem Arbeitsplatz gespeichert.
        </p>
        <H>Die Startseite</H>
        <Table
          head={["Schaltfläche", "Wann verwenden"]}
          rows={[
            [
              <Ui>Fortsetzen</Ui>,
              "Auf diesem Arbeitsplatz ist bereits eine verschlüsselte Sitzung gespeichert: Wiederherstellungssatz eingeben, dann Entsperren.",
            ],
            [<Ui>Neue Sitzung</Ui>, "Ein neues Ereignis beginnt."],
            [
              <Ui>Beitreten</Ui>,
              "Ein anderer Arbeitsplatz hat die Sitzung bereits und hat Ihnen seinen Code (oder QR-Code) gegeben.",
            ],
            [
              <Ui>Importieren</Ui>,
              "Sie haben eine Datei .orionaic, .orion, .json oder .csv erhalten.",
            ],
            [
              <Ui>Demo-Übung öffnen</Ui>,
              "Um das Werkzeug kennenzulernen oder vorzuführen, ohne Ihre Daten zu berühren.",
            ],
          ]}
        />
        <H>Was es braucht</H>
        <ul>
          <li>
            Einen aktuellen Browser: Chrome, Edge, Firefox oder Safari, auf
            Computer, Tablet oder Telefon.
          </li>
          <li>
            Eine Adresse mit <code>https://</code> (das ist bei{" "}
            <a href={SITE}>orionaic.xyz</a> der Fall): Die Verschlüsselung des
            Browsers funktioniert nur so.
          </li>
          <li>
            Internet beim ersten Laden. Danach bleibt die Anwendung auch offline
            verfügbar.
          </li>
        </ul>
        <H>Am Ende des Einsatzes</H>
        <Steps>
          <li>
            Das Journal abschliessen:{" "}
            <Path steps={["Einstellungen", "Sitzung und Journal"]} />. Es ist
            danach nur noch lesbar.
          </li>
          <li>
            Von jedem Journal ein (verschlüsseltes) Archiv{" "}
            <code>.orionaic</code> exportieren und gemäss den Regeln Ihrer
            Organisation ablegen.
          </li>
          <li>
            Die Sitzung vom Arbeitsplatz löschen:{" "}
            <Path
              steps={[
                "Einstellungen",
                "Sitzung und Journal",
                "Sitzung löschen",
              ]}
            />
            . orion aic prüft, ob ein aktuelles Archiv vorhanden ist, und
            verlangt dann die Eingabe von <code>BEENDEN</code>.
          </li>
        </Steps>
      </>
    ),
  },
  {
    id: "interface",
    group: "start",
    title: "Der Bildschirm auf einen Blick",
    icon: LayoutDashboard,
    hue: 212,
    short: (
      <p>
        Oben die Leiste: das aktive Journal, die Suche und der Zustand des
        Arbeitsplatzes. Links (auf dem Telefon unten) das <strong>Dock</strong>{" "}
        mit allen Modulen. In der Mitte die Seite des gewählten Moduls.
      </p>
    ),
    guide: (
      <>
        <ScreenMap />
        <ol className="docs-legend">
          <li>
            <strong>Logo</strong>: führt zurück zur Seite Lage.
          </li>
          <li>
            <strong>Aktives Journal</strong> (Titel und Modus). Ein Klick öffnet
            das Journalmenü: Journal wechseln, <Ui>Neues Journal</Ui>,{" "}
            <Ui>Datei importieren</Ui>, <Ui>Exportieren (alle Formate)</Ui>,{" "}
            <Ui>Eigenschaften, Abschluss</Ui>,{" "}
            <Ui>Journal aus der Sitzung entfernen</Ui>.
          </li>
          <li>
            <strong>Suchen oder handeln</strong> (<K>⌘K</K> / <K>Ctrl+K</K>):
            Tippen Sie ein paar Buchstaben, um ein Element, ein Modul oder eine
            Aktion zu finden.
          </li>
          <li>
            <strong>Synchronisation</strong>: <Ui>Allein</Ui>, wenn Sie allein
            arbeiten, <Ui>3 Plätze</Ui> mit den Initialen aller, wenn Sie
            mehrere sind, <Ui>Neu verbinden</Ui>, wenn die Verbindung
            unterbrochen ist.
          </li>
          <li>
            <strong>Sicherung</strong>: <Ui>Verschlüsselt</Ui> (grün, alles wird
            auf dem Arbeitsplatz gespeichert) oder <Ui>Temporär</Ui> (orange,
            geht beim Schliessen des Tabs verloren).
          </li>
          <li>
            <strong>Schweizer Zeit</strong> und Schaltfläche{" "}
            <strong>helles / dunkles Design</strong>.
          </li>
          <li>
            <strong>Operateur-Menü</strong> (Ihre Initialen): Einstellungen des
            Arbeitsplatzes, Wertelisten, Synchronisation, Sitzung, Sicherheit,
            Installation, Quellcode, Sperren.
          </li>
          <li>
            <strong>Dock</strong>: ein Klick = ein Modul. Ein roter Punkt{" "}
            <span className="docs-dot crit" /> zeigt überschrittene Fristen an;
            ein violetter Punkt <span className="docs-dot accent" /> neue
            Meldungen.
          </li>
          <li>
            <strong>Schaltfläche ?</strong>: die Hilfe zur Seite, auf der Sie
            sich befinden.
          </li>
        </ol>
      </>
    ),
    full: (
      <>
        <H>Nützliche Details</H>
        <ul>
          <li>
            Beim Überfahren mit der Maus zeigt jedes Symbol im Dock den Namen
            des Moduls und einen Satz, der erklärt, wozu es dient.
          </li>
          <li>
            Module, die Sie nicht verwenden, lassen sich ausblenden:{" "}
            <Path
              steps={[
                "Einstellungen",
                "Dieser Arbeitsplatz",
                "Angezeigte Module",
              ]}
            />
            . Lage, Journal und Hilfe bleiben immer sichtbar. Das Ausblenden
            eines Moduls löscht keine Daten.
          </li>
          <li>
            Fällt die Internetverbindung aus, erscheint ein Hinweis{" "}
            <Ui>Offline</Ui>. Sie können weiterarbeiten.
          </li>
          <li>
            Ist eine neue Version verfügbar, weist ein Banner darauf hin. In
            einer temporären Sitzung exportieren Sie vor dem Neuladen der Seite.
          </li>
          <li>
            Der Titel des Browser-Tabs zeigt die Anzahl überschrittener Fristen
            an, zum Beispiel <code>(3)</code>: sichtbar, auch wenn Sie in einem
            anderen Fenster sind.
          </li>
          <li>
            Mit der Tastatur bietet der erste Druck auf <K>Tab</K>{" "}
            <Ui>Zum Inhalt</Ui> an, um direkt zur Seite zu springen.
          </li>
          <li>
            Unten im Operateur-Menü: die Version, der Offline-Zustand und die
            Anzahl ausgegebener Funkgeräte.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "session",
    group: "start",
    title: "Sitzung, Journale und Sicherung",
    icon: LockKeyhole,
    hue: 200,
    short: (
      <p>
        Eine <strong>Sitzung</strong> entspricht einem Ereignis; sie enthält ein
        oder mehrere <strong>Journale</strong>. Ihre Daten bleiben in diesem
        Browser: verschlüsselt, wenn Sie einen Wiederherstellungssatz gewählt
        haben, sonst temporär.
      </p>
    ),
    guide: (
      <>
        <H>Zwei Arten, die Daten aufzubewahren</H>
        <Table
          head={["", "Verschlüsselte Sicherung", "Temporäre Sitzung"]}
          rows={[
            ["Wo?", "Im Browser, unter Verschluss", "Nur im geöffneten Tab"],
            ["Tab schliessen", "Nichts geht verloren", "Alles geht verloren"],
            [
              "Um zurückzukehren",
              "Wiederherstellungssatz",
              "Eine exportierte Datei importieren",
            ],
            [
              "Obere Leiste",
              <span className="pill ok">Verschlüsselt</span>,
              <span className="pill warn">Temporär</span>,
            ],
          ]}
        />
        <Note kind="warn">
          Der Wiederherstellungssatz wird nirgends gespeichert. Wenn Sie ihn
          vergessen, kann niemand, nicht einmal die Autoren von orion aic, die
          Sitzung wieder öffnen. Bewahren Sie zusätzlich Exporte auf.
        </Note>
        <H>Mit mehreren Journalen arbeiten</H>
        <Steps>
          <li>
            Klicken Sie oben auf dem Bildschirm auf den Titel des Journals.
          </li>
          <li>
            Wählen Sie ein Journal in der Liste, um dorthin zu wechseln, oder{" "}
            <Ui>Neues Journal</Ui>, um eines zu erstellen (zum Beispiel ein
            separates Journal für die Übung des Folgetags).
          </li>
          <li>
            Das aktive Journal ist dasjenige, das Sie sehen und ergänzen; die
            anderen bleiben unverändert.
          </li>
        </Steps>
        <H>Pause machen oder abschliessen</H>
        <ul>
          <li>
            <Ui>Sperren</Ui> (Operateur-Menü): Die Sitzung verschwindet vom
            Bildschirm und bleibt verschlüsselt auf dem Arbeitsplatz. Um
            zurückzukehren: <Ui>Fortsetzen</Ui> und der Satz.
          </li>
          <li>
            <strong>Ein Journal abschliessen</strong>:{" "}
            <Path steps={["Einstellungen", "Sitzung und Journal"]} />. Ein
            abgeschlossenes Journal lässt sich lesen, durchsuchen, drucken und
            exportieren, aber nicht mehr ändern. Es kann wieder geöffnet werden.
          </li>
        </ul>
      </>
    ),
    full: (
      <>
        <H>Eigenschaften eines Journals</H>
        <Table
          head={["Feld", "Erklärung"]}
          rows={[
            [
              "Ereignis",
              "Der Name, einziges Pflichtfeld. Z. B. « Hochwasser der Arve ».",
            ],
            ["Organisation", "Z. B. « ZS Carouge »."],
            ["Ort / Sektor", "Wo das Ereignis stattfindet."],
            ["Referenz", "Ereignis- oder Dossiernummer, falls Sie eine haben."],
            [
              "Modus",
              "Übung oder Einsatz. Sichtbar oben auf dem Bildschirm und auf den gedruckten Blättern.",
            ],
            [
              "Verteilung",
              "Intern oder Vertraulich, auf den Dokumenten vermerkt.",
            ],
          ]}
        />
        <p>
          Alles lässt sich unter{" "}
          <Path steps={["Einstellungen", "Sitzung und Journal"]} /> ändern, wo
          Sie auch den Namen des Operateurs, die verschlüsselte Sicherung, den
          Abschluss und das Wiederöffnen verwalten.
        </p>
        <H>Was im Hintergrund geschieht</H>
        <ul>
          <li>
            Jede Änderung wird eine Viertelsekunde nach dem letzten
            Tastenanschlag gespeichert, Entwürfe eingeschlossen.
          </li>
          <li>
            Dieselbe gespeicherte Sitzung kann nicht gleichzeitig in zwei Tabs
            geöffnet werden.
          </li>
          <li>
            Ein Browser bewahrt <strong>eine</strong> verschlüsselte Sitzung
            auf. Wenn Sie auf einem Arbeitsplatz, der bereits eine hat, einer
            anderen Sitzung beitreten, bleibt die neue temporär: Exportieren Sie
            sie regelmässig.
          </li>
          <li>
            Die installierte Anwendung (auf dem Startbildschirm) hat eigene
            Daten, getrennt von jenen des Browser-Tabs.
          </li>
          <li>
            Das Löschen der Browserdaten löscht die Sicherung. Eine Sicherung
            auf dem Arbeitsplatz ist kein Archiv: Exportieren Sie.
          </li>
        </ul>
        <H>Satz vergessen</H>
        <p>
          Auf der Startseite können Sie mit <Ui>Satz verloren</Ui> den
          verschlüsselten Bereich dieses Browsers löschen (dazu{" "}
          <code>LÖSCHEN</code> eingeben). Die Daten lassen sich dann nur noch
          aus einem exportierten Archiv oder von einem anderen synchronisierten
          Arbeitsplatz zurückholen, der die Sitzung hat.
        </p>
        <H>Die Sitzung löschen</H>
        <p>
          <Path
            steps={["Einstellungen", "Sitzung und Journal", "Sitzung löschen"]}
          />{" "}
          entfernt alles vom Arbeitsplatz. orion aic verlangt zuerst ein
          aktuelles Archiv jedes Journals, dann die Eingabe von{" "}
          <code>BEENDEN</code>.
        </p>
        <H>Grenzen</H>
        <p>
          10 000 Einträge pro Journal, 500 Versionen pro Eintrag, 12 000 Zeichen
          pro Meldung, importierte Dateien von höchstens 32 MB. Keine Anhänge
          (Fotos, PDF): Notieren Sie deren Referenz.
        </p>
      </>
    ),
  },

  // ---------------------------------------------------------------- modules
  {
    id: "situation",
    group: "modules",
    ...mod("situation", "Lage öffnen"),
    short: (
      <p>
        Die Startseite: das Wesentliche des Ereignisses auf einem einzigen
        Bildschirm, um die Lage in zehn Sekunden zu erfassen.
      </p>
    ),
    guide: (
      <>
        <H>Was Sie dort sehen</H>
        <ul>
          <li>
            <strong>Schlüsselinformationen</strong>: die Zahlen, die zählen
            (evakuierte Personen, betroffene Gebäude, Wasserstand …).
          </li>
          <li>
            <strong>Lagetafeln</strong>: vier kurze Texte, allgemeine Lage,
            Gefahren, Absicht, offene Punkte.
          </li>
          <li>
            Die <strong>offenen Punkte des Journals</strong> und die{" "}
            <strong>letzten Meldungen</strong>.
          </li>
          <li>
            Die <strong>Mittel</strong> nach Zustand, die{" "}
            <strong>Präsenzen</strong>, die ausgegebenen{" "}
            <strong>Funkgeräte</strong>.
          </li>
          <li>
            Die <strong>nächsten Termine</strong> mit ihrem Countdown, das{" "}
            <strong>Wetter</strong> und eine Vorschau des{" "}
            <strong>Verknüpfungsnetzes</strong>.
          </li>
        </ul>
        <H>Eine Schlüsselinformation aktualisieren</H>
        <Steps>
          <li>
            Klicken Sie auf <Ui>+</Ui> oder <Ui>−</Ui> neben der Zahl, um sie
            mit einem Klick anzupassen.
          </li>
          <li>
            Oder klicken Sie auf die Schlüsselinformation, um einen Wert, eine
            Einheit, eine Bemerkung einzugeben.
          </li>
          <li>
            Um weitere hinzuzufügen: <Ui>Hinzufügen</Ui>, oder wählen Sie unter
            den vorgeschlagenen <Ui>Standard</Ui>-Schlüsselinformationen.
          </li>
        </Steps>
        <Example>
          <p>
            Ein weiterer Evakuierungsbus verlässt das Quartier Acacias mit 14
            Personen: vierzehnmal auf <Ui>+</Ui> klicken, oder auf die Zahl
            klicken und direkt 42 eingeben.
          </p>
        </Example>
      </>
    ),
    full: (
      <>
        <H>Gute Praxis</H>
        <ul>
          <li>
            Schreiben Sie die Lagetafeln in kurzen Sätzen. Sie dienen als
            Grundlage für die Rapporte und die Ablösung.
          </li>
          <li>
            Jede Kachel ist anklickbar: Sie öffnet das entsprechende Element
            oder Modul (ein Mittel, eine Meldung, das gefilterte Journal …).
          </li>
          <li>
            Die offenen Punkte des Journals sind die Einträge, deren
            Nachverfolgung auf <Ui>Zu bearbeiten</Ui> oder{" "}
            <Ui>In Bearbeitung</Ui> steht.
          </li>
          <li>
            Die Kategorien der Schlüsselinformationen stammen aus den
            Wertelisten: <Path steps={["Einstellungen", "Wertelisten"]} />. Sie
            können auch eine beliebige Bezeichnung eingeben.
          </li>
          <li>
            Mit der Synchronisation wird die Seite auf allen Arbeitsplätzen live
            aktualisiert.
          </li>
        </ul>
        <Note kind="tip">
          Auf einem grossen Bildschirm oder einem Projektor angezeigt, dient die
          Seite Lage als Übersicht für die Führungsrapporte.
        </Note>
      </>
    ),
  },
  {
    id: "journal",
    group: "modules",
    ...mod("journal", "Journal öffnen"),
    short: (
      <p>
        Das offizielle Register: Jede Information, jeder Entscheid und jeder
        Auftrag wird darin festgehalten, <strong>nummeriert</strong> (#001, #002
        …) und mit <strong>Zeitstempel</strong> versehen. Nichts verschwindet,
        ohne eine Spur zu hinterlassen.
      </p>
    ),
    guide: (
      <>
        <H>Einen Eintrag erfassen</H>
        <Steps>
          <li>
            Öffnen Sie das Journal. Das Formular <Ui>Neuer Eintrag</Ui> ist
            bereit (auf dem Telefon: die runde Schaltfläche <Ui>+</Ui>).
          </li>
          <li>
            Wählen Sie die <strong>Art</strong> (Nachricht, Entscheid, Auftrag
            …) und die <strong>Priorität</strong> (Normal, Wichtig, Dringend).
          </li>
          <li>
            Schreiben Sie die <strong>Meldung</strong>. Das ist das einzige
            Pflichtfeld.
          </li>
          <li>
            Wenn Sie es wissen: den <strong>Absender</strong> (die Rufnamen
            werden ab den ersten Buchstaben vorgeschlagen), die Zeit des
            Ereignisses, den Ort.
          </li>
          <li>
            <Ui>Speichern</Ui>, oder <K>⌘↵</K> / <K>Ctrl+↵</K>. Der Eintrag
            erhält seine Nummer.
          </li>
        </Steps>
        <Example>
          <p>
            <span className="mono">14:05 · #012 · Nachricht · Dringend</span>
            <br />
            Absender: Patrouille Alpha. « Die Arve tritt am Quai des Acacias
            über die Ufer, 30 cm Wasser auf der Strasse. »
          </p>
        </Example>
        <H>Einen Auftrag bis zum Ende verfolgen</H>
        <Steps>
          <li>
            Setzen Sie bei einem Auftrag oder einer Anfrage die{" "}
            <strong>Nachverfolgung</strong> auf <Ui>Zu bearbeiten</Ui> und geben
            Sie einen <strong>Verantwortlichen</strong> und eine{" "}
            <strong>Frist</strong> an.
          </li>
          <li>
            Wenn die Antwort eintrifft, öffnen Sie den Eintrag und klicken auf{" "}
            <Ui>Folgeeintrag erfassen</Ui>: Eine Quittung wird vorbereitet, die
            den ursprünglichen Eintrag zitiert.
          </li>
          <li>
            Beim Speichern schlägt ein Banner vor, den Auftrag abzuschliessen:{" "}
            <Ui>Als erledigt markieren</Ui>.
          </li>
        </Steps>
        <Note kind="tip">
          Die <strong>Vorlagen</strong> über dem Formular (Lagerapport,
          Mittelanforderung, Auftrag, Entscheid, Quittung, Verbindungskontrolle)
          füllen die Art, die Priorität und ein zu ergänzendes Gerüst aus.
        </Note>
        <H>Automatischer Druck</H>
        <p>
          Unter dem Formular sendet der Schalter <Ui>Automatischer Druck</Ui>{" "}
          jeden gespeicherten Eintrag als A4-Blatt an den Drucker, sobald er
          erfasst ist.
        </p>
      </>
    ),
    full: (
      <>
        <H>Die Felder eines Eintrags</H>
        <Table
          head={["Gruppe", "Felder"]}
          rows={[
            [
              "Wesentliches",
              "Art, Priorität, Meldung (Pflichtfeld), Zeit des Ereignisses, Absender",
            ],
            [
              "Übermittlung und Ort",
              "Kanal, Bestätigung, Empfänger, Ort / Sektor, Koordinaten (LV95), Empfangszeit",
            ],
            [
              "Führung und Nachverfolgung",
              "Massnahme / Entscheid / Auftrag, Nachverfolgung, Verantwortlich, Frist, eingesetzte Mittel / Bedarf",
            ],
            [
              "Ergänzungen",
              "Referenz / verknüpfter Eintrag, Bemerkungen, Stichwörter (höchstens 20)",
            ],
            [
              "Automatisch",
              "Nummer, Autor, Zeit der Erfassung, Versionsverlauf",
            ],
          ]}
        />
        <Table
          head={["Liste", "Werte"]}
          rows={[
            [
              "Art",
              "Nachricht, Entscheid, Auftrag, Anfrage, Quittung, Beobachtung, Ablösung",
            ],
            ["Priorität", "Normal, Wichtig, Dringend"],
            [
              "Nachverfolgung",
              "Erfasst, Zu bearbeiten, In Bearbeitung, Erledigt, Annulliert",
            ],
            ["Kanal", "Funk, Telefon, Vor Ort, E-Mail, Meldung, Andere"],
            ["Bestätigung", "Unbestätigt, Bestätigt, Zu überprüfen"],
          ]}
        />
        <H>Drei verschiedene Zeiten</H>
        <p>
          Das <strong>Ereignis</strong> (wann es geschehen ist), der{" "}
          <strong>Empfang</strong> (wann die Information bei Ihnen eingetroffen
          ist) und die <strong>Erfassung</strong> (automatisch). Beispiel: Der
          Damm bricht um 13:50, die Patrouille meldet es um 14:05, Sie erfassen
          es um 14:07. Die Zeiten werden in Schweizer Zeit angezeigt.
        </p>
        <H>Vorlagen</H>
        <Table
          head={["Vorlage", "Was sie vorbereitet"]}
          rows={[
            [
              "Lagerapport",
              "Nachricht: Lage, getroffene Massnahmen, eingesetzte Mittel, Bedarf, nächster Rapport",
            ],
            [
              "Mittelanforderung",
              "Anfrage, Zu bearbeiten, Wichtig: Mittel, Menge, Lieferort, Frist, Begründung",
            ],
            [
              "Auftrag",
              "Auftrag, Zu bearbeiten, Massnahme « Ausführung dem KP quittieren »",
            ],
            ["Entscheid", "Entscheid, In Bearbeitung, Bestätigt"],
            [
              "Quittung",
              "Quittung, Bestätigt, Referenz « Folge von # » zu ergänzen",
            ],
            ["Verbindungskontrolle", "Beobachtung, Kanal Funk, Stichwort Funk"],
          ]}
        />
        <p>
          Wird bereits eine Meldung eingegeben, fragt orion aic nach, bevor sie
          ersetzt wird.
        </p>
        <H>Verknüpfte Einträge und Faden</H>
        <p>
          Ein Eintrag zitiert einen anderen mit seiner Nummer im Feld{" "}
          <Ui>Referenz / verknüpfter Eintrag</Ui>: <code>Folge von #003</code>,{" "}
          <code>#012, #014</code>. Die Zeile zeigt dann <code>↳ #003</code> an,
          und die Detailansicht zeigt den vollständigen <strong>Faden</strong>:
          Anfrage → Auftrag → Quittung, in der richtigen Reihenfolge,
          anklickbar.
        </p>
        <H>Fristen und Alarm</H>
        <ul>
          <li>
            Ein Banner listet die <strong>überschrittenen</strong> Fristen (rot)
            und jene der <strong>nächsten 15 Minuten</strong> (orange) auf.
          </li>
          <li>
            Direkte Aktionen: <Ui>+15 min</Ui> (verschiebt, mit notierter
            Begründung), <Ui>Erledigt</Ui>, oder Klick, um den Eintrag zu
            öffnen.
          </li>
          <li>
            Das Glockensymbol aktiviert einen akustischen Alarm (zwei Pieptöne)
            bei jeder neu überschrittenen Frist.
          </li>
          <li>Die Fristen werden alle 30 Sekunden geprüft.</li>
        </ul>
        <H>Ändern, annullieren, löschen</H>
        <ul>
          <li>
            <strong>Ändern</strong> (Stift): Alles lässt sich ändern. Die
            vorherige Version bleibt erhalten (Schaltfläche <Ui>Versionen</Ui>,
            Zeile markiert mit <code>v2</code>). Die Begründung ist freiwillig.
          </li>
          <li>
            Eine Information <strong>annullieren</strong>, ohne sie zu löschen:
            Setzen Sie die Nachverfolgung auf <Ui>Annulliert</Ui>. Sie bleibt
            lesbar, durchgestrichen.
          </li>
          <li>
            <strong>Löschen</strong> (Papierkorb) verlangt eine Begründung («
            Doppelt erfasst »). Es bleibt eine Spur (Nummer, Zeit, Autor,
            Begründung), einsehbar unten in der Tabelle. Die Nummer wird nie
            wiederverwendet.
          </li>
        </ul>
        <Note kind="warn">
          Ein vor dem Löschen exportiertes Archiv enthält den Eintrag weiterhin.
          Vernichten Sie es bei Bedarf.
        </Note>
        <H>Eine Information wiederfinden</H>
        <ul>
          <li>
            Filter: Alles, Pendent, Dringend, Entscheide. Filter nach Tag,
            Sortierung, Gruppierung nach Tag.
          </li>
          <li>Suche in allen Feldern, ohne Berücksichtigung von Akzenten.</li>
          <li>
            Kennzahlen: Einträge, pendente Punkte, überschrittene Fristen,
            dringende Einträge, Funkgeräte im Einsatz, Zustand des Archivs.
          </li>
        </ul>
        <H>Bericht, Ablösung, Blätter</H>
        <ul>
          <li>
            <Ui>Bericht</Ui>: Lagebericht A4 über 1 h, 4 h, 12 h, 24 h, alles
            oder einen frei gewählten Zeitraum (Zusammenfassung, wichtige
            Ereignisse, Entscheide und Aufträge, Anfragen, offene Punkte,
            Mittel, Funkzustand, Chronologie wahlweise).
          </li>
          <li>
            <Ui>Ablösung</Ui>: fasst zusammen, was zu übergeben ist (Pendenzen,
            überschrittene Fristen, zu bestätigende Informationen, ausgegebene
            Funkgeräte) und bereitet einen Eintrag der Art Ablösung vor.
          </li>
          <li>
            <Ui>A4-Blatt</Ui>: ein Blatt pro Eintrag, mit Feldern für Visum und
            Unterschrift. Kreuzen Sie mehrere Zeilen an, um mehrere Blätter zu
            drucken.
          </li>
        </ul>
        <H>Automatischer Druck im Detail</H>
        <p>
          Der Schalter unter dem Formular druckt jeden auf{" "}
          <strong>diesem</strong> Arbeitsplatz erfassten Eintrag. Für einen
          zentralen Druckarbeitsplatz aktivieren Sie zusätzlich{" "}
          <Path
            steps={[
              "Einstellungen",
              "Dieser Arbeitsplatz",
              "Auch Einträge anderer Arbeitsplätze drucken",
            ]}
          />
          : Jeder per Synchronisation empfangene Eintrag wird dort gedruckt.
          Siehe auch das Thema « Drucken ».
        </p>
      </>
    ),
  },
  {
    id: "messages",
    group: "modules",
    ...mod("messages", "Meldungen öffnen"),
    short: (
      <p>
        Der Posteingang des KP: Jede eintreffende Meldung wird hier unverändert
        erfasst und dann zu einer klaren Zusammenfassung für das Journal
        verarbeitet.
      </p>
    ),
    guide: (
      <>
        <MessageFlow />
        <H>Eine Meldung empfangen</H>
        <Steps>
          <li>
            <Ui>Neue Meldung</Ui> (oder <K>⌘K</K> → « Neue eingegangene Meldung
            »).
          </li>
          <li>
            Füllen Sie aus, was Sie wissen: <Ui>Von</Ui>, <Ui>An</Ui>,{" "}
            <Ui>Kanal</Ui>, <Ui>Priorität</Ui>, <Ui>Kategorie</Ui>. Die gängigen
            Werte werden mit einem Klick vorgeschlagen; Sie können jederzeit
            etwas anderes schreiben.
          </li>
          <li>
            Schreiben Sie den <Ui>Betreff</Ui> und die <Ui>Meldung</Ui>, wenn
            möglich wortwörtlich.
          </li>
          <li>
            <Ui>Speichern</Ui>: Die Meldung erscheint in der Spalte <Ui>Neu</Ui>
            , und im Dock erscheint ein violetter Punkt.
          </li>
        </Steps>
        <H>Eine Meldung bearbeiten</H>
        <States
          steps={["Neu", "In Bearbeitung", "Weitergeleitet", "Abgelegt"]}
        />
        <Steps>
          <li>
            <Ui>Übernehmen</Ui>: Die Meldung geht in Bearbeitung, die anderen
            Arbeitsplätze sehen, dass sich jemand darum kümmert.
          </li>
          <li>
            <Ui>Im Journal erfassen</Ui>: Ein bereits ausgefülltes
            Zusammenfassungsfenster öffnet sich. Kürzen, klären, bestätigen. Ein
            Journaleintrag wird erstellt, mit der Meldung verknüpft, die auf{" "}
            <Ui>Weitergeleitet</Ui> wechselt.
          </li>
          <li>
            <Ui>Ablegen</Ui>, wenn nichts mehr zu tun ist.
          </li>
        </Steps>
        <Example>
          <p>
            Eingegangene Meldung: « Hier Patrouille Alpha für KP Carouge, also
            wir sind am Quai, das Wasser läuft drüber, da stehen drei parkierte
            Autos, wir brauchen eine Pumpe. » Zusammenfassung im Journal: « Quai
            des Acacias überflutet, 3 Fahrzeuge gefährdet. Anfrage 1 Motorpumpe.
            »
          </p>
        </Example>
      </>
    ),
    full: (
      <>
        <H>Die Felder</H>
        <Table
          head={["Feld", "Erklärung"]}
          rows={[
            [
              "Von / An",
              "Absender und Empfänger. Standardwerte: KP Front, KP Rück, Zellen, Polizei …",
            ],
            ["Kanal", "Funk, Telefon, E-Mail, Meldeläufer, vor Ort, SMS …"],
            ["Priorität", "Um Dringendes hervorzuheben."],
            [
              "Kategorie",
              "Nachricht, Anfrage, Befehl / Auftrag, Bericht, Alarm, Quittung … mit einem Klick oder als Freitext.",
            ],
            [
              "Betreff",
              "Ein paar Worte, um die Meldung in der Liste wiederzuerkennen.",
            ],
            ["Meldung", "Der Text, wie empfangen."],
            ["Ort", "Wo es geschieht. Er kann auf der Karte platziert werden."],
            [
              "Antwort erwartet",
              "Anzukreuzen, wenn der Absender eine Rückmeldung erwartet, mit einer Frist.",
            ],
          ]}
        />
        <H>Alle Aktionen</H>
        <ul>
          <li>
            <strong>Vorlagen</strong>: Bericht, Mittelanforderung, Alarm,
            Information, Quittung … bereiten den Text vor.
          </li>
          <li>
            <strong>Tafel oder Liste</strong>: Ziehen Sie eine Meldung per Drag
            & Drop von einer Spalte in die andere, oder verwenden Sie die
            Listenansicht.
          </li>
          <li>
            <Ui>Unverändert erfassen (ohne Gegenlesen)</Ui>: erstellt den
            Journaleintrag ohne Zusammenfassung, für eine bereits klare Meldung.
          </li>
          <li>
            Eine abgelegte Meldung <Ui>Wieder öffnen</Ui>, sie{" "}
            <strong>ändern</strong> oder <strong>löschen</strong>.
          </li>
          <li>
            <Ui>A4-Blatt</Ui>: das gedruckte Meldeformular. Um jede Meldung
            gleich bei der Erfassung zu drucken:{" "}
            <Path
              steps={[
                "Einstellungen",
                "Dieser Arbeitsplatz",
                "Jede neue eingegangene Meldung drucken",
              ]}
            />
            .
          </li>
        </ul>
        <Note kind="info">
          Warum zwei Schritte? Die Meldung bewahrt die unbearbeitete Spur
          dessen, was gesagt wurde; das Journal bewahrt die klare und offizielle
          Fassung. Beide bleiben verknüpft: Von der einen gelangt man mit einem
          Klick zur anderen.
        </Note>
        <p>
          Die Standardwerte (Empfänger und Absender, Kategorien, Kanäle) werden
          unter <Path steps={["Einstellungen", "Wertelisten"]} /> geändert.
        </p>
      </>
    ),
  },
  {
    id: "missions",
    group: "modules",
    ...mod("missions", "Aufträge öffnen"),
    short: (
      <p>
        Eine Tafel, die auf einen Blick alles zeigt, was noch zu tun ist:
        Aufträge, Anfragen und pendente Punkte, nach Zustand geordnet.
      </p>
    ),
    guide: (
      <>
        <States
          steps={["Zu bearbeiten", "In Bearbeitung", "Erledigt"]}
          extra={["Annulliert"]}
        />
        <H>Einen Auftrag voranbringen</H>
        <Steps>
          <li>
            <Ui>Neuer Auftrag / Neue Anfrage</Ui>: Schreiben Sie ihn bzw. sie,
            wählen Sie einen Verantwortlichen und eine Frist. Er erscheint in{" "}
            <Ui>Zu bearbeiten</Ui>.
          </li>
          <li>
            Wenn sich jemand darum kümmert, ziehen Sie die Karte nach{" "}
            <Ui>In Bearbeitung</Ui>.
          </li>
          <li>
            Mehr Zeit nötig? <Ui>+15 min</Ui> verschiebt die Frist.
          </li>
          <li>
            Wenn die Rückmeldung eintrifft: <Ui>Folgeeintrag erfassen</Ui>, dann
            die Karte nach <Ui>Erledigt</Ui> ziehen.
          </li>
        </Steps>
        <Note kind="info">
          Jede Karte ist ein Journaleintrag. Das Verschieben ändert ihre
          Nachverfolgung im Journal, mit Verlauf.
        </Note>
      </>
    ),
    full: (
      <>
        <H>Details</H>
        <ul>
          <li>
            Filter: nach <strong>Typ</strong> (Auftrag, Anfrage …), nach{" "}
            <strong>Verantwortlichem</strong> und nur{" "}
            <strong>überfällige</strong>.
          </li>
          <li>Eine Karte mit überschrittener Frist wird rot hervorgehoben.</li>
          <li>
            Einträge, die nur « erfasst » sind (ohne Nachverfolgung), erscheinen
            hier nicht: Sie bleiben im Journal.
          </li>
          <li>
            Ein Klick auf eine Karte öffnet den vollständigen Eintrag: Text,
            Faden der verknüpften Einträge, Versionen.
          </li>
        </ul>
        <Example>
          <p>
            #015 « Gruppe Bravo: Sandsäcke an der Rue des Acacias legen, Frist
            15:00 ». Um 14:55 braucht die Gruppe eine Viertelstunde mehr:{" "}
            <Ui>+15 min</Ui>. Um 15:10 trifft die Quittung ein:{" "}
            <Ui>Folgeeintrag erfassen</Ui>, und die Karte wechselt auf Erledigt.
          </p>
        </Example>
      </>
    ),
  },
];
