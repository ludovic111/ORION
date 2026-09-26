import { BellRing, Cable } from "lucide-react";
import { moduleInfo } from "../../../app/modules";
import type { Module } from "../../../../shared/links";
import type { Topic } from "../content";
import { Example, Faq, H, Note, Path, States, Steps, Table, Ui } from "../kit";

// Help topics of the conduct features (German): Meine Aufgaben and the
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
    ...mod("tasks", "Meine Aufgaben öffnen"),
    short: (
      <p>
        Jeder Arbeitsplatz gibt an, welche Funktion er hat (Logistik, Telematik
        …). « Meine Aufgaben » zeigt dann nur, was ihn betrifft: Überfälliges
        zuoberst, mit einer Schaltfläche, um es als erledigt zu melden.
      </p>
    ),
    guide: (
      <>
        <H>Die Funktion dieses Arbeitsplatzes wählen</H>
        <Steps>
          <li>
            Öffnen Sie <Ui>Meine Aufgaben</Ui> (oder{" "}
            <Path steps={["Einstellungen", "Dieser Arbeitsplatz"]} />
            ).
          </li>
          <li>
            Klicken Sie auf Ihre Funktion: <Ui>Einsatzleiter</Ui>,{" "}
            <Ui>Chef Lage</Ui>, <Ui>Führungsunterstützung</Ui>,{" "}
            <Ui>Logistik</Ui>, <Ui>Telematik</Ui>,{" "}
            <Ui>Personal / Administration</Ui> oder <Ui>Verbindung</Ui>. Sie
            können auch eine andere Funktion eingeben.
          </li>
          <li>
            Beim nächsten Öffnen startet orion aic direkt mit dem Modul Ihrer
            Funktion (Mittel für die Logistik, Funk für die Telematik …). Ein
            anderes Modul wählen Sie unter{" "}
            <Path
              steps={[
                "Einstellungen",
                "Dieser Arbeitsplatz",
                "Modul beim Öffnen",
              ]}
            />
            .
          </li>
        </Steps>
        <H>Was in Meine Aufgaben erscheint</H>
        <Table
          head={["Was", "Wann"]}
          rows={[
            [
              "Ein zu verfolgender Journaleintrag",
              "Sein « Verantwortlich » ist Ihre Funktion, Ihr Name oder Ihre Zelle (« Logistik / Wm Rey » zählt für beide)",
            ],
            [
              "Ein Auftrag aus einem erlassenen Befehl",
              "Seine verantwortliche Funktion oder seine Einheit bezeichnet Sie",
            ],
            [
              "Ein zugewiesenes Element",
              "Jemand hat « Zuweisen » geklickt und Ihre Funktion oder Ihren Namen gewählt",
            ],
            [
              "Eine Verteilung",
              "Sie ist für Sie bestimmt und wartet auf Ihr « Gelesen » oder « Verstanden »",
            ],
          ]}
        />
        <H>Die Schaltflächen jeder Zeile</H>
        <ul>
          <li>
            <Ui>Erledigt</Ui>: Die Aufgabe ist erledigt (der Eintrag wechselt
            auf Erledigt, mit seinem Verlauf).
          </li>
          <li>
            <Ui>+15 Min.</Ui>: verschiebt die Frist um eine Viertelstunde.
          </li>
          <li>
            <Ui>Im Journal notieren</Ui>: öffnet einen vorausgefüllten Eintrag
            (Quittung) zum Ergänzen und Erfassen.
          </li>
        </ul>
      </>
    ),
    full: (
      <>
        <H>Details</H>
        <ul>
          <li>
            Die Funktion wird nur auf diesem Arbeitsplatz gespeichert (wie das
            Farbschema). Zwei Arbeitsplätze derselben Zelle können dieselbe
            Funktion haben: Sie sehen dieselben Aufgaben.
          </li>
          <li>
            Die Liste der Funktionen ändern Sie unter{" "}
            <Path
              steps={[
                "Einstellungen",
                "Wertelisten",
                "Funktionen der Arbeitsplätze",
              ]}
            />
            .
          </li>
          <li>
            Gross- und Kleinschreibung sowie Akzente spielen keine Rolle: «
            logistik » bezeichnet « Logistik ».
          </li>
          <li>
            Die Zahl auf dem Symbol Meine Aufgaben zählt, was überfällig ist und
            was auf Ihre Bestätigung wartet. Der Titel des Browser-Tabs « (3)
            orion aic » zählt zusätzlich die überfälligen Einträge des Journals.
          </li>
          <li>
            <Ui>Zuweisen</Ui>: Jedes Element (Eintrag, Meldung, Termin, Mittel
            …) kann einer Funktion und / oder einer Person anvertraut werden,
            mit einer Frist und einer Weisung.
          </li>
          <li>
            <Ui>Für Ihre Funktion</Ui>: Verknüpfungen zu den Modulen, die für
            Ihre Funktion am nützlichsten sind.
          </li>
        </ul>
        <Example>
          <p>
            Der Arbeitsplatz der Zelle Logistik wählt <Ui>Logistik</Ui>. Er
            sieht sofort « #004 Anforderung von 200 Sandsäcken », überfällig,
            und den Auftrag « 200 Sandsäcke liefern » aus Befehl Nr. 1.
            Lieferung erfolgt: <Ui>Erledigt</Ui>, dann{" "}
            <Ui>Im Journal notieren</Ui> für die Quittung.
          </p>
        </Example>
      </>
    ),
  },
  {
    id: "orders",
    group: "modules",
    ...mod("orders", "Befehle öffnen"),
    short: (
      <p>
        Einen Befehl im gewohnten Aufbau in fünf Punkten schreiben, ihn an die
        richtigen Personen senden und wissen, wer ihn gelesen hat. Alle müssen
        mit « Gelesen » oder « Verstanden » antworten; Sie sehen, wer es getan
        hat und um welche Zeit.
      </p>
    ),
    guide: (
      <>
        <H>Einen Befehl schreiben und erlassen</H>
        <Steps>
          <li>
            <Ui>Neuer Befehl</Ui>, dann eine Vorlage: <Ui>Einsatzbefehl</Ui>,{" "}
            <Ui>Ergänzungsbefehl</Ui>, <Ui>Vorbefehl</Ui>,{" "}
            <Ui>Ablösungsbefehl</Ui> oder leer. Lage, Gefahren, Absicht, KP,
            Funkgruppen und die nächsten Rapporte sind bereits ausgefüllt, aus
            dem, was das Journal weiss.
          </li>
          <li>
            Vervollständigen Sie die fünf Kapitel. Unter Punkt 3{" "}
            <Ui>Auftrag hinzufügen</Ui> pro Einheit oder Zelle: was sie tut, die
            verantwortliche Funktion, die Frist, und mit <Ui>Verknüpfen</Ui> die
            betroffenen Mittel oder Personen.
          </li>
          <li>
            Wählen Sie die Empfänger (Funktionen, Zellen, anderer KP, Alle),
            dann <Ui>Speichern</Ui>: Es ist ein Entwurf.
          </li>
          <li>
            <Ui>Erlassen</Ui>: Der Befehl erhält die Erlasszeit, wird im Journal
            eingetragen (« Befehl Nr. 1 erlassen ») und geht an die Empfänger,
            die mit « Verstanden » antworten müssen.
          </li>
          <li>
            <Ui>A4</Ui> druckt das Befehlsblatt mit den Bestätigungen und einem
            Visumfeld.
          </li>
        </Steps>
        <Table
          head={["Kapitel", "Was man hineinschreibt"]}
          rows={[
            [
              "1 Orientierung",
              "Lage, Gefahr und wahrscheinliche Entwicklung, Nachbarmittel",
            ],
            ["2 Absicht", "Einsatzidee: was man erreichen will"],
            ["3 Aufträge", "Wer macht was, bis wann, womit"],
            ["4 Besondere Anordnungen", "Logistik, Sanität, Sicherheit"],
            [
              "5 Standorte und Verbindungen",
              "KP, Funkkanäle, Zeiten der Rapporte",
            ],
          ]}
        />
        <H>Mit Lesebestätigung verteilen</H>
        <Steps>
          <li>
            <Ui>Verteilen</Ui> (hier, in Meine Aufgaben oder mit ⌘K): Betreff,
            Text, Empfänger, verlangte Bestätigung (<Ui>Gelesen</Ui>,{" "}
            <Ui>Verstanden</Ui> oder keine) und Antwortfrist (standardmässig 10
            Min.).
          </li>
          <li>
            Jeder betroffene Arbeitsplatz sieht oben am Bildschirm ein Banner,
            in welchem Modul er auch ist, bis er <Ui>Gelesen</Ui> oder{" "}
            <Ui>Verstanden</Ui> klickt.
          </li>
          <li>
            Unter <Ui>Verteilungen</Ui> zeigt jeder Empfänger seine Antwort und
            deren Zeit, oder « ausstehend · 12 Min. ». Nach Ablauf der Frist
            wird die Zeile rot und Ihr Arbeitsplatz wird benachrichtigt.{" "}
            <Ui>Ausstehende erinnern</Ui> sendet erneut an jene, die nicht
            geantwortet haben.
          </li>
        </Steps>
        <States steps={["Entwurf", "Erlassen"]} extra={["Annulliert"]} />
      </>
    ),
    full: (
      <>
        <H>Details</H>
        <ul>
          <li>
            Die Nummer eines Befehls wird bei seiner Erstellung vergeben und
            ändert nie; eine gelöschte Nummer wird nie wieder vergeben. Zwei
            Arbeitsplätze, die gleichzeitig einen Befehl erstellen: « Nr. 4 »
            und « Nr. 4·K ». Ein von einem anderen KP erhaltener Befehl heisst «
            KP Front Nr. 2 ».
          </li>
          <li>
            <Ui>Ergänzungsbefehl</Ui> übernimmt Standorte, Verbindungen,
            Rapporte und Empfänger des Grundbefehls und wird mit ihm verknüpft.
          </li>
          <li>
            Jede Bestätigung wird aufbewahrt: wer (Funktion und Name), wann, und
            ob sie über die Verbindung kam. Sie erscheint in der
            Nachvollziehbarkeit; sie lässt sich nicht ändern.
          </li>
          <li>
            Ein Empfänger ist mit der ersten Antwort eines Arbeitsplatzes
            erfüllt, der ihn vertritt: Für « Logistik » genügt ein einziger
            Logistik-Arbeitsplatz. « Alle » wartet auf eine Antwort irgendeines
            Arbeitsplatzes.
          </li>
          <li>
            <Ui>Verfolgung stoppen</Ui>: keine Erinnerung und keine Verspätung
            mehr für diese Verteilung.
          </li>
          <li>
            Befehle, Verteilungen und Bestätigungen gehen mit dem Teil «
            Aufträge und Pendenzen » in die Exporte.
          </li>
        </ul>
        <Faq q="Kann ein erlassener Befehl korrigiert werden?">
          Ja (<Ui>Bearbeiten</Ui>), jede Version bleibt im Verlauf erhalten. Für
          eine echte Änderung der Führung erlassen Sie besser einen{" "}
          <Ui>Ergänzungsbefehl</Ui>: Die Empfänger erhalten ihn und bestätigen
          ihn.
        </Faq>
      </>
    ),
  },
  {
    id: "alerts",
    group: "together",
    title: "Warnungen und Benachrichtigungen",
    icon: BellRing,
    hue: 20,
    module: "tasks",
    openLabel: "Meine Aufgaben öffnen",
    short: (
      <p>
        orion aic kann Sie benachrichtigen, wenn etwas geschieht, auch wenn Sie
        in einem anderen Tab sind: eine dringende Meldung, eine überschrittene
        Frist, ein Rapport in 5 Minuten, eine Aufgabe für Sie, eine zu lesende
        Verteilung.
      </p>
    ),
    guide: (
      <>
        <H>Warnungen auf diesem Arbeitsplatz aktivieren</H>
        <Steps>
          <li>
            <Path
              steps={["Einstellungen", "Dieser Arbeitsplatz", "Warnungen"]}
            />
            .
          </li>
          <li>
            <Ui>Systembenachrichtigungen</Ui>: Der Browser fragt nach der
            Erlaubnis; antworten Sie mit <Ui>Zulassen</Ui>.
          </li>
          <li>
            <Ui>Ton</Ui>, wenn Sie zusätzlich ein kurzes Tonsignal wünschen
            (zwei Töne, drei bei Dringendem). Mit <Ui>Testen</Ui> hören Sie es.
          </li>
          <li>
            Wählen Sie, was Sie interessiert und wie viele Minuten vor einem
            Rapport Sie benachrichtigt werden wollen (standardmässig 5).
          </li>
        </Steps>
        <Note kind="tip">
          In der Nacht schaltet <Ui>Ruhezeiten</Ui> (zum Beispiel 22:00 bis
          06:00) den Ton aus und lässt nur Dringendes durch. Mit dem Farbschema
          Taktische Nacht ist der Ton leiser und nichts blinkt.
        </Note>
      </>
    ),
    full: (
      <>
        <H>Details</H>
        <ul>
          <li>
            Jede Warnung ertönt auf diesem Arbeitsplatz nur einmal. Eine
            verschobene Frist (+15 Min.) ertönt zu ihrer neuen Zeit.
          </li>
          <li>
            Der Tab von orion aic muss offen bleiben (er darf im Hintergrund
            sein). Der Browser prüft mindestens einmal pro Minute.
          </li>
          <li>
            Für die Warnungen geht keine Information ins Internet: Es ist der
            Browser dieses Arbeitsplatzes, der sie anzeigt.
          </li>
          <li>
            Wenn der Browser die Benachrichtigungen abgelehnt hat: Klicken Sie
            auf das Schloss links neben der Adresse, dann Benachrichtigungen →
            Zulassen.
          </li>
          <li>
            Der Titel des Tabs zeigt die Anzahl der wartenden Dinge an: « (3)
            orion aic ».
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "liaison",
    group: "together",
    title: "Verbindung zwischen KP",
    icon: Cable,
    hue: 18,
    module: "orders",
    openLabel: "Verbindung öffnen",
    short: (
      <p>
        Der KP Front und der KP Rück haben je ihre eigene Sitzung. Die
        Verbindung erlaubt ihnen, einander Meldungen, Befehle und
        Lesebestätigungen zu senden, ohne den Rest zu vermischen.
      </p>
    ),
    guide: (
      <>
        <H>Eine Verbindung eröffnen</H>
        <Steps>
          <li>
            Auf dem ersten KP:{" "}
            <Path
              steps={[
                "Einstellungen",
                "Synchronisation",
                "Verbindung zwischen KP",
              ]}
            />{" "}
            (oder <Path steps={["Befehle", "Verbindung zwischen KP"]} />
            ). Geben Sie den Namen des anderen KP (« KP Rück ») und Ihren
            eigenen (« KP Front ») ein, dann <Ui>Verbindungscode erstellen</Ui>.
          </li>
          <li>Übermitteln Sie den Code dem anderen KP wie ein Passwort.</li>
          <li>
            Auf dem anderen KP: dieselben Namen, vertauscht, den Code eingeben
            und <Ui>Verbindung beitreten</Ui>. Der Zustand wechselt auf{" "}
            <Ui>Verbunden</Ui>.
          </li>
        </Steps>
        <H>Senden</H>
        <ul>
          <li>
            <Ui>Meldung an KP Rück</Ui>: kommt in dessen Meldungen an, mit « KP
            Front » als Absender.
          </li>
          <li>
            Eine Verteilung oder ein Befehl, bei dem ein Empfänger « KP Rück »
            ist, geht ebenfalls über die Verbindung. Der andere KP sieht sie als
            Banner und in seinen Meldungen; sein « Verstanden » kommt zu Ihnen
            zurück.
          </li>
        </ul>
        <Note kind="info">
          Wenn der andere KP nicht verbunden ist, wartet, was Sie senden («
          ausstehend »), und geht los, sobald er zurück ist. Nichts geht
          verloren, nichts kommt doppelt an.
        </Note>
      </>
    ),
    full: (
      <>
        <H>Details</H>
        <ul>
          <li>
            Der Verbindungscode sieht aus wie ein Sitzungscode, öffnet aber
            einen anderen Raum, mit einem anderen Schlüssel: Er gibt nie Zugang
            zur Sitzung des anderen KP.
          </li>
          <li>
            Alle verbundenen Arbeitsplätze eines KP sehen den Zustand der
            Verbindung; jeder von ihnen kann senden und empfangen.
          </li>
          <li>
            Die Karte der Verbindung zeigt den letzten Austausch, was wartet und
            die letzten Meldungen in jede Richtung.
          </li>
          <li>
            <Ui>Verbindung schliessen</Ui> löscht den Code; was ausgetauscht
            wurde, bleibt im Journal. Der Code wird nie exportiert.
          </li>
          <li>
            Es wird dasselbe Relais wie für die Synchronisation verwendet; es
            speichert nichts und kann nichts lesen.
          </li>
        </ul>
      </>
    ),
  },
];
