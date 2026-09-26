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
    title: "Alles ist verknüpft",
    icon: Link2,
    hue: 285,
    short: (
      <p>
        In orion aic ist alles verknüpft: Eine Meldung, der daraus entstandene
        Journaleintrag, das eingesetzte Mittel und der Punkt auf der Karte sind
        gegenseitig voneinander aus erreichbar.
      </p>
    ),
    guide: (
      <>
        <LinksFigure />
        <H>Verknüpfungen ansehen</H>
        <ul>
          <li>
            Jedes Detailblatt hat einen Abschnitt <Ui>Verknüpfungen</Ui>. Jede
            Verknüpfung erscheint dort als kleiner Chip.
          </li>
          <li>
            <strong>Darüberfahren</strong> mit der Maus: eine Vorschau des
            Elements. <strong>Klick</strong>: Es öffnet sich.
          </li>
        </ul>
        <H>Eine Verknüpfung von Hand hinzufügen</H>
        <Steps>
          <li>
            Klicken Sie im Detailblatt auf <Ui>Verknüpfen</Ui>.
          </li>
          <li>
            Suchen Sie das zu verknüpfende Element, indem Sie einige Buchstaben
            eingeben.
          </li>
          <li>
            Wenn Sie möchten, geben Sie die Art der Verknüpfung an (« eingesetzt
            bei », « betrifft » …) und bestätigen Sie.
          </li>
          <li>
            Um eine Verknüpfung zu entfernen: das <Ui>×</Ui> ihres Chips.
          </li>
        </Steps>
      </>
    ),
    full: (
      <>
        <H>Automatische Verknüpfungen</H>
        <p>
          orion aic erstellt die offensichtlichen Verknüpfungen selbst. Sie
          müssen nichts tun:
        </p>
        <Table
          head={["Wenn …", "… werden diese Elemente verknüpft"]}
          rows={[
            [
              "Derselbe Rufname vorkommt",
              "Person, Funkgerät, Einträge und Meldungen, die ihn verwenden",
            ],
            [
              "Ein Absender, Empfänger oder Verantwortlicher den Namen einer Person, eines Arbeitsplatzes, eines Mittels oder eines Kontakts trägt",
              "Der Eintrag oder die Meldung und dieses Element",
            ],
            ["Ein Eintrag #012 zitiert", "Die beiden Einträge"],
            [
              "Eine Meldung im Journal erfasst wird",
              "Die Meldung und der erstellte Eintrag",
            ],
            [
              "Eine Person Mitglied eines Arbeitsplatzes ist",
              "Die Person und der Arbeitsplatz",
            ],
            [
              "Ein Rufname eine Gesprächsgruppe hat",
              "Der Rufname und die Gesprächsgruppe",
            ],
            ["Ein Funkgerät abgegeben wird", "Das Endgerät und sein Inhaber"],
          ]}
        />
        <Note kind="info">
          Eine automatische Verknüpfung stammt aus den Daten selbst: Um sie zu
          entfernen, ändern Sie das Feld, das sie erzeugt. Wird ein Element
          gelöscht, verschwinden seine manuellen Verknüpfungen mit ihm.
        </Note>
      </>
    ),
  },
  {
    id: "sync",
    group: "together",
    title: "Synchronisation zwischen Arbeitsplätzen",
    icon: Wifi,
    hue: 190,
    short: (
      <p>
        Mehrere Computer, Tablets oder Telefone arbeiten live an derselben
        Sitzung. Kein Konto nötig: Ein <strong>Sitzungscode</strong> genügt, und
        alles ist verschlüsselt.
      </p>
    ),
    guide: (
      <>
        <SyncFlow />
        <H>Auf dem ersten Arbeitsplatz: teilen</H>
        <Steps>
          <li>
            <Path steps={["Operateur-Menü", "Synchronisation"]} />, oder ein
            Klick auf die Anzeige <Ui>Allein</Ui> oben.
          </li>
          <li>
            <Ui>Sitzungscode erstellen</Ui>. Ein Code wird angezeigt, etwa{" "}
            <code>ABCD-EFGH-JKMN-PQRS</code>, mit einem QR-Code.
          </li>
          <li>
            Geben Sie den Code den anderen Arbeitsplätzen weiter, oder{" "}
            <Ui>Link kopieren</Ui>.
          </li>
        </Steps>
        <H>Auf den anderen Arbeitsplätzen: beitreten</H>
        <Steps>
          <li>
            Öffnen Sie <a href={SITE}>orionaic.xyz</a> → <Ui>Beitreten</Ui>.
            (Oder scannen Sie den QR-Code mit dem Telefon: Der Code ist bereits
            ausgefüllt.)
          </li>
          <li>Geben Sie den Code und Ihren Namen oder Ihre Funktion ein.</li>
          <li>
            Wenn Sie die Sitzung auf diesem Arbeitsplatz behalten möchten,
            aktivieren Sie{" "}
            <Ui>Verschlüsselte Sicherung auf diesem Arbeitsplatz</Ui> und wählen
            Sie eine Passphrase.
          </li>
          <li>
            <Ui>Sitzung beitreten</Ui>. Die Sitzung trifft ein, sobald ein
            Arbeitsplatz, der sie hat, online ist.
          </li>
        </Steps>
        <p>
          Oben zeigt die Anzeige <Ui>Allein</Ui>, <Ui>3 Plätze</Ui> (mit den
          Initialen aller; beim Darüberfahren, wer in welchem Modul ist) oder{" "}
          <Ui>Neu verbinden</Ui>.
        </p>
        <Note kind="warn">
          Der Code ist ein <strong>Passwort</strong>: Er öffnet die ganze
          Sitzung. Übermitteln Sie ihn mündlich, auf Papier oder über einen
          sicheren Kanal, nie über einen offenen Kanal.
        </Note>
      </>
    ),
    full: (
      <>
        <H>Was synchronisiert wird</H>
        <p>
          Der ganze Inhalt: Journale und Einträge, Meldungen, Karte, Mittel,
          Team, Funk, Kontakte, Wetter, Agenda, Verknüpfungen, Wertelisten. Was
          jedem Arbeitsplatz eigen bleibt: die{" "}
          <strong>Einstellungen des Arbeitsplatzes</strong> (Thema, angezeigte
          Module, automatischer Druck). Die <strong>Live-Positionen</strong> der
          Teams laufen ebenfalls über die Synchronisation, werden aber nie
          gespeichert (siehe « Live-Positionen der Teams »).
        </p>
        <H>Offline</H>
        <p>
          Jeder Arbeitsplatz behält eine vollständige Kopie. Fällt die
          Verbindung aus, arbeitet man normal weiter; sobald die Verbindung
          zurück ist, tauschen die Arbeitsplätze aus, was sich geändert hat.
        </p>
        <H>Wenn zwei Arbeitsplätze dasselbe ändern</H>
        <ul>
          <li>
            Ein auf beiden Seiten geänderter <strong>Journaleintrag</strong>{" "}
            behält beide Versionen in seinem Verlauf: Nichts geht verloren.
          </li>
          <li>Für alles andere gilt die jüngste Änderung.</li>
          <li>Eine Löschung hat Vorrang vor einer älteren Änderung.</li>
          <li>
            Erhalten zwei Einträge gleichzeitig dieselbe Nummer (zum Beispiel
            offline), behält der ältere seine Nummer; der andere wird neu
            nummeriert.
          </li>
        </ul>
        <H>Sicherheit</H>
        <ul>
          <li>
            Ende-zu-Ende-Verschlüsselung AES-256-GCM, mit einem aus dem
            Sitzungscode abgeleiteten Schlüssel. Der Code verlässt die
            Arbeitsplätze nie.
          </li>
          <li>
            Der Relais-Server sieht nur eine gehashte Raumkennung und unlesbare
            Nachrichten. Er speichert nichts; wenn der letzte Arbeitsplatz geht,
            verschwindet der Raum.
          </li>
          <li>
            Die Seite muss über https laufen: Sonst ist die Verschlüsselung
            nicht verfügbar, und orion aic weist darauf hin.
          </li>
          <li>
            Der Code vermeidet verwechselbare Zeichen (0 und O, 1 und I oder L):
            weniger Lesefehler.
          </li>
        </ul>
        <H>Ohne Internet: das lokale Netz</H>
        <Steps>
          <li>
            Starten Sie auf einem Computer des KP (dem « Server-Arbeitsplatz »)
            mit dem Quellcode von orion aic <code>npm run lan</code>.
          </li>
          <li>
            Er zeigt eine Adresse wie <code>https://192.168.1.20:4443</code> und
            den <strong>Fingerabdruck</strong> des Zertifikats an.
          </li>
          <li>
            Öffnen Sie diese Adresse auf den anderen Arbeitsplätzen im selben
            WLAN oder kabelgebundenen Netz. Der Browser meldet ein nicht
            anerkanntes Zertifikat: Prüfen Sie, ob der Fingerabdruck
            übereinstimmt, und akzeptieren Sie dann (nur einmal).
          </li>
          <li>
            Verwenden Sie danach den Sitzungscode wie gewohnt. Alles bleibt im
            Gebäude.
          </li>
        </Steps>
        <Note kind="info">
          Bluetooth ist nicht nutzbar: Die Browser erlauben es für diese Art von
          Austausch nicht. Verwenden Sie das lokale Netz.
        </Note>
        <H>Weitere Einstellungen</H>
        <ul>
          <li>
            <Path steps={["Einstellungen", "Synchronisation"]} /> zeigt den
            Status (Verbunden, Neu verbinden …), die anderen Arbeitsplätze und
            ihr Modul sowie die Zeit des letzten Austauschs.
          </li>
          <li>
            <Ui>Mit einem Code beitreten</Ui> führt, aus einer bereits
            geöffneten Sitzung heraus, diese Sitzung mit jener der anderen
            Arbeitsplätze zusammen.
          </li>
          <li>
            <Ui>Auf diesem Arbeitsplatz stoppen</Ui> beendet die Synchronisation
            nur hier; die anderen arbeiten weiter.
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
    title: "Live-Positionen der Teams",
    icon: Navigation,
    hue: 20,
    module: "map",
    openLabel: "Karte öffnen",
    short: (
      <p>
        Ein Telefon oder Tablet einer Patrouille kann{" "}
        <strong>seine Position teilen</strong>: Der KP sieht sie live auf der
        Karte. Nichts wird gespeichert, ausser jemand verlangt es ausdrücklich.
      </p>
    ),
    guide: (
      <>
        <H>Auf dem Telefon des Teams: teilen</H>
        <Steps>
          <li>
            Treten Sie der Sitzung bei (Sitzungscode) und öffnen Sie dann die{" "}
            <Ui>Karte</Ui>.
          </li>
          <li>
            Tippen Sie auf die Pfeil-Schaltfläche <Ui>Meine Position teilen</Ui>{" "}
            (rechte Spalte, unter <Ui>Meine Position</Ui>).
          </li>
          <li>
            Lesen Sie, wer sie sieht und was gespeichert wird. Wählen Sie das
            dargestellte Team oder Mittel (Detailblatt Team oder Mittel) und die
            Bezeichnung, zum Beispiel « Patrouille 2 ».
          </li>
          <li>
            <Ui>Meine Position teilen</Ui>, dann die Standortanfrage des
            Browsers akzeptieren.
          </li>
        </Steps>
        <p>
          Solange das Teilen läuft, bleibt oben am Bildschirm ein Banner:{" "}
          <Ui>Geteilte Position</Ui>, die Zeit der letzten Übermittlung und die
          Schaltfläche <Ui>Stoppen</Ui>.
        </p>
        <H>Im KP: verfolgen</H>
        <Steps>
          <li>
            Auf der Karte hat jedes Team einen orangen Punkt, seinen Namen, das
            Alter der Position (« vor 40 s »), einen Genauigkeitskreis und
            seinen Weg der letzten 30 Minuten.
          </li>
          <li>
            Ein Klick auf den Punkt: <Ui>Zentrieren</Ui>,{" "}
            <Ui>Im Journal erfassen</Ui> (ein Eintrag mit den LV95-Koordinaten),{" "}
            <Ui>Punkt hier erstellen</Ui> (ein normales Kartenobjekt) oder{" "}
            <Ui>Details</Ui>.
          </li>
          <li>
            <Path steps={["Karte", "Ebenen", "Live-Positionen"]} /> blendet
            diese Ebene aus oder ein.
          </li>
        </Steps>
        <Note kind="info">
          Eine Position, die älter als 2 Minuten ist, wird grau; nach 30 Minuten
          ohne Nachricht verschwindet das Team von der Karte.
        </Note>
      </>
    ),
    full: (
      <>
        <H>Was gesendet wird, und an wen</H>
        <ul>
          <li>
            Breite, Länge, Genauigkeit, Richtung und Geschwindigkeit, die
            Bezeichnung und das verknüpfte Detailblatt. Sonst nichts.
          </li>
          <li>
            Etwa alle 15 Sekunden oder nach 25 m Bewegung (höchstens alle 5
            Sekunden): wenig Daten, keine zusätzlichen Kosten für das Relais.
          </li>
          <li>
            Nur an die Arbeitsplätze, die mit derselben Sitzung verbunden sind,
            wie alles andere mit dem Sitzungscode verschlüsselt. Das Relais kann
            die Position nicht lesen und behält sie nicht.
          </li>
        </ul>
        <H>Was gespeichert wird</H>
        <ul>
          <li>
            Nichts auf dem Server. Die anderen Arbeitsplätze behalten die letzte
            Position und den Weg der letzten 30 Minuten nur{" "}
            <strong>im Arbeitsspeicher</strong>: Das Schliessen des Tabs löscht
            sie.
          </li>
          <li>
            Die Positionen gelangen weder ins Journal noch in den Verlauf, noch
            in die Archive, noch in die Zeitreise (die Ebene ist dort
            ausgeblendet).
          </li>
          <li>
            Um eine Spur zu behalten, muss man es bewusst tun:{" "}
            <Ui>Im Journal erfassen</Ui> oder <Ui>Punkt hier erstellen</Ui> im
            KP, oder <Ui>Spur aufzeichnen</Ui> auf dem Arbeitsplatz, der teilt.
          </li>
        </ul>
        <H>Spur aufzeichnen</H>
        <p>
          Zu Beginn des Teilens anzukreuzen (oder in den Details des Banners).
          Der Weg bleibt auf dem Telefon. Beim Stoppen fragt orion aic:{" "}
          <Ui>Auf der Karte speichern</Ui> (eine Linie auf der Ebene Mittel, für
          alle sichtbar und im Verlauf gespeichert) oder <Ui>Spur verwerfen</Ui>
          .
        </p>
        <H>Wenn das Teilen endet</H>
        <ul>
          <li>
            Schaltfläche <Ui>Stoppen</Ui> im Banner: Die anderen Arbeitsplätze
            entfernen das Team sofort.
          </li>
          <li>
            Tab geschlossen, Seite neu geladen, Sitzung geschlossen: Das Teilen
            endet.
          </li>
          <li>
            Bildschirm gesperrt oder App im Hintergrund: Der Browser schaltet
            die Ortung ab. Die Option <Ui>Bildschirm eingeschaltet lassen</Ui>{" "}
            verhindert die Sperre (braucht mehr Akku).
          </li>
        </ul>
        <Note kind="warn">
          Die Genauigkeit hängt vom Gerät ab: In der Stadt oder in Gebäuden kann
          der Kreis mehr als 50 m betragen. Bestätigen Sie eine wichtige
          Position per Funk.
        </Note>
      </>
    ),
  },
  {
    id: "print",
    group: "together",
    title: "Drucken",
    icon: Printer,
    hue: 30,
    short: (
      <p>
        Alles lässt sich in A4 drucken: Meldeblätter, Berichte, Pläne, Tabellen.
        orion aic kann sogar jeden neuen Eintrag automatisch drucken.
      </p>
    ),
    guide: (
      <>
        <H>Ein Dokument drucken</H>
        <Steps>
          <li>
            Klicken Sie auf die Drucker-Schaltfläche oder auf <Ui>A4-Blatt</Ui>{" "}
            des Elements.
          </li>
          <li>Eine Vorschau zeigt die tatsächlichen Seiten.</li>
          <li>
            <Ui>Drucken</Ui> (Drucker), oder <Ui>PDF</Ui> für eine Datei.
          </li>
        </Steps>
        <H>Automatischer Druck</H>
        <Steps>
          <li>
            Aktivieren Sie im Journal den Schalter <Ui>Automatischer Druck</Ui>{" "}
            unter dem Formular (oder <K>⌘K</K> → « Automatischen Druck
            aktivieren »).
          </li>
          <li>
            Für weitere Optionen:{" "}
            <Path
              steps={[
                "Einstellungen",
                "Dieser Arbeitsplatz",
                "Automatischer Druck",
              ]}
            />
            .
          </li>
        </Steps>
        <Table
          head={["Option", "Wirkung"]}
          rows={[
            [
              "Jeden neuen Journaleintrag drucken",
              "Das A4-Blatt wird gleich beim Speichern gedruckt, auf diesem Arbeitsplatz.",
            ],
            [
              "Auch Einträge anderer Arbeitsplätze drucken",
              "Für einen zentralen Druckarbeitsplatz: Die per Synchronisation empfangenen Einträge werden hier gedruckt.",
            ],
            [
              "Jede neue eingegangene Meldung drucken",
              "Ein A4-Meldeformular für jede erfasste Meldung.",
            ],
          ]}
        />
      </>
    ),
    full: (
      <>
        <H>Was gedruckt wird</H>
        <Table
          head={["Dokument", "Wo zu finden"]}
          rows={[
            [
              "Meldeblatt (ein Eintrag)",
              "Journal: Details → A4-Blatt, oder mehrere angekreuzte Zeilen",
            ],
            ["Meldeformular", "Meldungen: A4-Blatt"],
            ["Lagebericht", "Journal: Bericht"],
            ["Plan des Funknetzes", "Funk: Plan A4"],
            [
              "Quittung für die Funkgeräteabgabe",
              "Funk: Druckersymbol eines Endgeräts oder einer Abgabe",
            ],
            ["QR-Etiketten", "Funk: Etiketten"],
            [
              "Tabellen",
              "Mittel, Team, Kontakte, Agenda: Schaltfläche Drucken",
            ],
          ]}
        />
        <p>
          Die PDF sind vektorbasiert: scharf in jeder Grösse, mit eingebetteten
          Schriften. Ein langer Text wird auf der nächsten Seite fortgesetzt.
        </p>
        <H>Ohne Druckfenster drucken</H>
        <p>
          Aus Sicherheitsgründen zeigt der Browser bei jedem Dokument sein
          Druckfenster. Für einen Druckarbeitsplatz, der alles ohne Klick
          ausgeben soll, starten Sie Chrome oder Edge mit der Option{" "}
          <code>--kiosk-printing</code>:
        </p>
        <Table
          head={["System", "Befehl oder Verknüpfung"]}
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
            Schliessen Sie zuerst <strong>alle</strong> Browserfenster, sonst
            wird die Option ignoriert.
          </li>
          <li>
            Unter Windows am einfachsten: eine Verknüpfung auf dem Desktop,
            deren « Ziel » den obigen Befehl enthält.
          </li>
          <li>
            Wählen Sie den Standarddrucker in den Systemeinstellungen: Er ist
            es, der druckt.
          </li>
          <li>Stellen Sie beim ersten Druck die Ränder auf null.</li>
        </Steps>
        <Note kind="warn">
          In diesem Modus geht <strong>alles</strong>, was der Browser druckt,
          direkt an den Standarddrucker. Verwenden Sie ihn nur auf dem
          Druckarbeitsplatz.
        </Note>
      </>
    ),
  },
  {
    id: "present",
    group: "together",
    title: "Lage präsentieren",
    icon: MonitorPlay,
    hue: 300,
    short: (
      <p>
        Wenn Behörden oder Gäste im KP eintreffen, zeigt der{" "}
        <strong>Präsentationsmodus</strong> die Lage im Vollbild, klar und mit
        Animationen, ohne jede Vorbereitung: Die Folien entstehen selbst aus den
        Daten. Die <strong>Wandanzeige</strong> lässt die Lage live auf einem
        fest installierten Bildschirm durchlaufen.
      </p>
    ),
    guide: (
      <>
        <H>Präsentieren in 3 Schritten</H>
        <Steps>
          <li>
            Bildschirm-Schaltfläche <Ui>Lage präsentieren</Ui> oben rechts (oder{" "}
            <K>⌘K</K> → « Präsentieren »).
          </li>
          <li>
            Bereiten Sie in wenigen Sekunden vor: Ihren Namen, das Publikum («
            Gemeindepräsident, Präfekt »), die Version (<Ui>Jetzt</Ui>, eine
            Momentaufnahme oder eine Uhrzeit), und kreuzen Sie die Folien an
            oder ziehen Sie sie in die gewünschte Reihenfolge.
          </li>
          <li>
            <Ui>Präsentieren</Ui>: Vollbild. Pfeil nach rechts, Leertaste oder
            ein Klick zum Weitergehen; Pfeil nach links zum Zurückgehen;{" "}
            <K>Esc</K> zum Beenden.
          </li>
        </Steps>
        <H>Die Folien</H>
        <p>
          Titel, allgemeine Lage und Absicht, Kennzahlen (mit ihrer Entwicklung
          seit dem letzten Lagerapport), jede Karte gross, was sich seit dem
          letzten Lagerapport geändert hat, wichtige Ereignisse aus dem Journal,
          laufende oder überfällige Aufträge, Mittel, Organisation (KP Front, KP
          Rück, Zellen), Funknetz, Wetter, nächste Termine, Fragen. Eine Folie
          ohne Daten erscheint nicht.
        </p>
        <H>Während der Präsentation zeichnen und zeigen</H>
        <ul>
          <li>
            <K>P</K> Stift (Maus, Finger oder Eingabestift), <K>H</K>{" "}
            Textmarker, <K>E</K> Radierer, <K>1</K>–<K>5</K> Farbe, <K>⌘Z</K>{" "}
            rückgängig, <K>Umschalt</K>+<K>E</K> alles löschen.
          </li>
          <li>
            <K>L</K> Laserpointer, <K>B</K> schwarzer Bildschirm, <K>O</K>{" "}
            Übersicht der Folien, <K>T</K> Stoppuhr, <K>N</K> Notizen, <K>F</K>{" "}
            Vollbild.
          </li>
          <li>
            Am Ende erzeugt <Ui>Anmerkungen speichern</Ui> ein PDF der
            kommentierten Folien.
          </li>
        </ul>
        <H>Referentenansicht</H>
        <p>
          <Ui>Referentenansicht öffnen</Ui> öffnet ein zweites Fenster (auf dem
          Computer, während der Projektor die Folien zeigt): aktuelle und
          nächste Folie, Notizen, verstrichene Zeit, Uhr. Blockiert der Browser
          das Fenster, erlauben Sie es oder verwenden Sie <K>N</K>.
        </p>
        <H>Wandanzeige</H>
        <p>
          <K>⌘K</K> → « Wandanzeige »: Die Lage läuft selbständig durch (alle
          10, 20, 30 oder 60 Sekunden), aktualisiert sich live, mit einer
          grossen Uhr und den letzten Journaleinträgen. Der Bildschirm geht
          nicht in den Ruhezustand. <K>Leertaste</K> Pause, <K>Esc</K> beenden.
        </p>
      </>
    ),
    full: (
      <>
        <H>Die Präsentation exportieren</H>
        <ul>
          <li>
            Aus dem Vorbereitungsbildschirm oder im Exportzentrum (Familie
            Präsentation): <strong>PowerPoint</strong> (.pptx) mit automatischen
            Übergängen und Einblendungen, <strong>OpenDocument</strong> (.odp),{" "}
            <strong>PDF</strong> (eine Folie pro Seite) und{" "}
            <strong>HTML</strong> (eine einzige Datei, die sich in jedem Browser
            präsentieren lässt, Taste <K>N</K> für die Notizen).
          </li>
          <li>
            Die Datei enthält die Referentennotizen, das Wasserzeichen ÜBUNG
            oder VERTRAULICH und in der Fusszeile den überprüfbaren
            Fingerabdruck.
          </li>
          <li>
            Man kann einen einzelnen Teil (zum Beispiel die Karte und die
            Mittel) oder den ganzen Einsatz exportieren, zu einer frei wählbaren
            Zeit.
          </li>
        </ul>
        <H>Register der Präsentationen</H>
        <p>
          Jede Präsentation und jede Wandanzeige wird unter{" "}
          <Path steps={["Verlauf", "Präsentationen"]} /> eingetragen: wer
          präsentiert hat, wem, wann, wie lange, welche Version und welche
          Folien.
        </p>
        <Note kind="tip">
          Halten Sie vor einem Besuch eine Momentaufnahme fest (« Besuch des
          Präfekten »): Präsentation, Export und Vergleich mit dem weiteren
          Verlauf verwenden genau dieselbe Version.
        </Note>
      </>
    ),
  },
  {
    id: "timemachine",
    group: "together",
    title: "Zeitreise",
    icon: History,
    hue: 250,
    short: (
      <p>
        Den ganzen Einsatz so wiedersehen, wie er zu einer beliebigen Uhrzeit
        war: die Karte, die Mittel, das Journal, das Wetter … Und ihn wie einen
        Film <strong>abspielen</strong>, Änderung für Änderung.
      </p>
    ),
    guide: (
      <>
        <H>Zu einer bestimmten Uhrzeit zurückkehren</H>
        <Steps>
          <li>
            Klicken Sie oben rechts auf die Uhr <Ui>Zeitreise</Ui> (oder{" "}
            <K>⌘K</K> → « Zeitreise »). Unten erscheint eine Leiste.
          </li>
          <li>
            Ziehen Sie den Schieberegler oder geben Sie ein Datum und eine
            Uhrzeit ein. Die kleinen Balken zeigen, wann viel geschehen ist; die
            Schneeflocken sind die festgehaltenen Momentaufnahmen.
          </li>
          <li>
            Gehen Sie normal durch die Module: Alles zeigt den Stand zu dieser
            Uhrzeit. In der Vergangenheit lässt sich nichts ändern.
          </li>
          <li>
            <Ui>Live</Ui> (violette Schaltfläche) kehrt zum aktuellen Stand
            zurück.
          </li>
        </Steps>
        <H>Den Einsatz abspielen</H>
        <p>
          <Ui>▶</Ui> spielt die Änderungen einzeln von Anfang an ab: Die Objekte
          erscheinen und bewegen sich auf der Karte, die Mittel wechseln ihren
          Status, die Zahlen entwickeln sich. Geschwindigkeit <Ui>Langsam</Ui>,{" "}
          <Ui>Normal</Ui> oder <Ui>Schnell</Ui>; <Ui>«</Ui> und <Ui>»</Ui>{" "}
          springen um eine Änderung weiter.
        </p>
        <H>Eine Momentaufnahme der Lage festhalten</H>
        <Steps>
          <li>
            <Ui>Festhalten</Ui> (in der Zeitleiste, im <Ui>Verlauf</Ui> oder{" "}
            <K>⌘K</K> → « Momentaufnahme der Lage festhalten »).
          </li>
          <li>
            Geben Sie einen Namen ein: « Führungsrapport 14:00 ». Vorgeschlagen
            wird die angezeigte Uhrzeit; Sie können sie ändern.
          </li>
          <li>
            Dieser Zeitpunkt lässt sich danach mit einem Klick wählen, um ihn
            wieder anzusehen, mit jetzt zu vergleichen, ihn zu präsentieren oder
            zu exportieren.
          </li>
        </Steps>
        <Example>
          <p>
            Der Präfekt trifft um 15 Uhr ein und fragt, was sich seit dem
            Rapport von 14 Uhr geändert hat: <Ui>Verlauf</Ui> →{" "}
            <Ui>Vergleichen</Ui> → « Seit Führungsrapport 14:00 ». Die Liste
            zeigt die eingesetzten Mittel, die auf der Karte platzierten Objekte
            und die neuen Einträge.
          </p>
        </Example>
      </>
    ),
    full: (
      <>
        <H>Was wiederhergestellt wird</H>
        <ul>
          <li>
            Alle Elemente: Die nach der gewählten Uhrzeit erstellten
            verschwinden, die geänderten nehmen ihre damaligen Werte wieder an,
            die seither gelöschten erscheinen wieder.
          </li>
          <li>
            Das Journal zeigt die zu dieser Uhrzeit vorhandenen Einträge in
            ihrer damaligen Version. Ein gelöschter Eintrag kehrt nicht zurück:
            Sein Inhalt wird grundsätzlich gelöscht, nur die Spur seiner
            Löschung bleibt.
          </li>
          <li>
            Das Wetter zeigt die letzte vor dieser Uhrzeit erhaltene Prognose.
          </li>
          <li>
            Aus der Zeitleiste übernehmen <Ui>Exportieren</Ui> und{" "}
            <Ui>Präsentieren</Ui> direkt die angezeigte Version.
          </li>
        </ul>
        <Note kind="info">
          Die Zeitreise ändert nichts für die anderen Arbeitsplätze: Jeder kann
          in die Vergangenheit schauen, während die anderen live weiterarbeiten.
        </Note>
      </>
    ),
  },
  {
    id: "exports",
    group: "together",
    title: "Exportieren, drucken, importieren",
    icon: FileDown,
    hue: 160,
    short: (
      <p>
        Das <strong>Exportzentrum</strong> erzeugt mit einem Klick den ganzen
        Einsatz oder Teile davon, zu einer frei wählbaren Uhrzeit, in fast 30
        Formaten: animiertes PowerPoint, PDF, Word, Excel, Karte, orion
        aic-Archiv … Alles lässt sich auch drucken. Jede Datei wird mit ihrem
        Fingerabdruck im Register eingetragen, damit sie später geprüft werden
        kann.
      </p>
    ),
    guide: (
      <>
        <H>Exportieren in drei Entscheidungen</H>
        <Steps>
          <li>
            Öffnen Sie das Exportzentrum: Titel des Journals oben →{" "}
            <Ui>Exportieren (alle Formate)</Ui>, oder <K>⌘K</K> → « Exportieren
            ».
          </li>
          <li>
            <strong>Was</strong>: <Ui>Gesamter Einsatz</Ui>, oder kreuzen Sie
            die gewünschten Teile an (Journal, Karte, Mittel, Wetter …).{" "}
            <Ui>Elemente auswählen</Ui> erlaubt, nur einige davon zu behalten
            (drei Kartenobjekte, einen Eintrag …).
          </li>
          <li>
            <strong>Wann</strong>: <Ui>Jetzt</Ui>, eine{" "}
            <strong>Momentaufnahme</strong> (« Führungsrapport 14:00 ») oder
            eine <strong>bestimmte Uhrzeit</strong>. Die Datei zeigt den Einsatz
            so, wie er zu diesem Zeitpunkt war.
          </li>
          <li>
            <strong>Format</strong>: Wählen Sie eine Karte, dann{" "}
            <Ui>Herunterladen</Ui> oder <Ui>Drucken</Ui>.
          </li>
        </Steps>
        <Example>
          <p>
            Für den Besuch des Präfekten: Was = Lage, Karte, Mittel; Wann = «
            Führungsrapport 14:00 »; Format = animiertes PowerPoint. Die
            Präsentation ist bereit, die Animationen laufen von selbst.
          </p>
        </Example>
        <H>Einen Einsatz auf einem anderen Arbeitsplatz wieder ansehen</H>
        <Steps>
          <li>
            Exportieren Sie das <strong>orion aic-Archiv</strong> (
            <code>.orionaic</code>, mit einer Passphrase verschlüsselt) des
            ganzen Einsatzes.
          </li>
          <li>
            Auf dem anderen Arbeitsplatz: Startseite → <Ui>Importieren</Ui>,
            oder Titel des Journals → <Ui>Datei importieren</Ui>, dann{" "}
            <Ui>Separates Journal</Ui>.
          </li>
          <li>
            Alles ist da, samt Verlauf: Die <Ui>Zeitreise</Ui> spielt den
            Einsatz von Anfang bis Ende ab.
          </li>
        </Steps>
        <H>Ein Dokument prüfen</H>
        <p>
          Jede Datei trägt in der Fusszeile eine Zeile « Export … ·
          Fingerabdruck … » und, wenn Platz vorhanden ist, einen QR-Code. Legen
          Sie unter <Path steps={["Verlauf", "Exporte", "Dokument prüfen"]} />{" "}
          die erhaltene Datei ab: orion aic sagt, ob sie echt ist (wer sie wann
          exportiert hat, was) oder ob sie seither verändert wurde.
        </p>
      </>
    ),
    full: (
      <>
        <H>Die Formate</H>
        <Table
          head={["Familie", "Formate", "Wozu"]}
          rows={[
            [
              "Präsentation",
              "PowerPoint .pptx animiert, OpenDocument .odp, PDF-Diashow, HTML-Diashow",
              "Die Lage präsentieren, mit automatischen Übergängen und Einblendungen",
            ],
            [
              "Druckbare Dokumente",
              "PDF-Dossier, Word .docx, OpenDocument .odt, HTML-Seite, Markdown, Text",
              "Vollständiges Dossier: Deckblatt, Inhaltsverzeichnis, Kapitel, Karten, Wasserzeichen",
            ],
            [
              "A4-Ausdrucke",
              "Meldeblätter, Journal als Tabelle, Funkplan, Etiketten",
              "Die üblichen Ausdrucke des Arbeitsplatzes",
            ],
            [
              "Tabellen und Daten",
              "Excel .xlsx, OpenDocument .ods, CSV, TSV, JSON",
              "Ein Blatt pro Teil, Filter, fixierte Kopfzeile",
            ],
            [
              "Karte",
              "PNG-Bild jeder Karte, GeoJSON, KML (Google Earth), GPX (GPS)",
              "Die Karte einem Partner oder einem Gerät übermitteln",
            ],
            [
              "Agenda und Kontakte",
              "Agenda .ics, Kontakte vCard .vcf",
              "In eine Agenda oder ein Telefon importieren",
            ],
            [
              "Archiv",
              "orion aic .orionaic (verschlüsselt), wieder importierbares JSON",
              "Den ganzen Einsatz aufbewahren oder übermitteln, samt Verlauf",
            ],
            [
              "Komplettpaket",
              ".zip",
              "Die wichtigsten Formate auf einmal, mit der Liste der Fingerabdrücke",
            ],
          ]}
        />
        <H>Optionen</H>
        <ul>
          <li>
            <strong>Wasserzeichen</strong>: « ÜBUNG » und/oder « VERTRAULICH »
            je nach Journal, auf jeder Seite und jeder Folie; es lässt sich
            entfernen.
          </li>
          <li>
            <strong>Ausrichtung</strong> des PDF (Hoch- oder Querformat),{" "}
            <strong>Versionen der Einträge</strong> (alles, was korrigiert
            wurde), <strong>Animationen</strong> der Präsentationen.
          </li>
          <li>
            Ein Teil, den ein Format nicht enthält, ist ausgegraut: Die Agenda
            .ics verlangt zum Beispiel den Teil Führungsrhythmus.
          </li>
        </ul>
        <H>Register und Fingerabdrücke</H>
        <ul>
          <li>
            Jeder Export wird unter <Path steps={["Verlauf", "Exporte"]} />{" "}
            eingetragen: wer, wann, welcher Inhalt, welche Version, Dateiname
            und SHA-256-Fingerabdruck.
          </li>
          <li>
            Eine geänderte Datei, und sei es nur um ein einziges Zeichen, hat
            nicht mehr denselben Fingerabdruck: Die Prüfung meldet es.
          </li>
          <li>
            Das Komplettpaket trägt jede enthaltene Datei ein, damit sie einzeln
            geprüft werden können.
          </li>
        </ul>
        <H>Importieren und zusammenführen</H>
        <ul>
          <li>
            Akzeptierte Dateien: <code>.orionaic</code>, <code>.orion</code>,{" "}
            <code>.json</code>, <code>.csv</code>, <code>.tsv</code>, höchstens
            32 MB. Die Datei wird auf dem Arbeitsplatz gelesen und nirgendwohin
            gesendet.
          </li>
          <li>
            <Ui>Separates Journal</Ui>: Nichts wird angetastet, der importierte
            Einsatz öffnet sich daneben.
          </li>
          <li>
            <Ui>Zusammenführen</Ui>: Die neuen Einträge werden hinzugefügt und
            neu nummeriert; exakte Duplikate werden ignoriert; anderswo
            vorgenommene Löschungen werden übernommen; die Verläufe werden
            vereint.
          </li>
          <li>
            Für die Karte werden KML-, KMZ-, GeoJSON- und GPX-Dateien über die
            Karte importiert (<Ui>⋯</Ui> → <Ui>Importieren</Ui>).
          </li>
        </ul>
        <Note kind="warn">
          Alle Formate ausser <code>.orionaic</code> sind{" "}
          <strong>unverschlüsselt</strong>. Bei einem vertraulichen Journal
          verlangt orion aic eine Bestätigung. Übermitteln Sie die Passphrase
          eines Archivs über einen <strong>anderen</strong> Weg als die Datei.
        </Note>
      </>
    ),
  },
];
