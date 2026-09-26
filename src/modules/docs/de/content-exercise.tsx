import { KeyRound, Tv } from "lucide-react";
import type { Topic } from "../content";
import { moduleInfo } from "../../../app/modules";
import { Faq, H, K, Note, Path, Steps, Table, Ui } from "../kit";

// Help topics of the exercises, the debriefing, the wall screen and the
// signature of the exports (German).

const debrief = moduleInfo("debrief");

export const EXERCISE_TOPICS: Topic[] = [
  {
    id: "debrief",
    group: "modules",
    module: "debrief",
    icon: debrief.icon,
    hue: debrief.hue,
    title: debrief.label,
    openLabel: "Debriefing öffnen",
    short: (
      <p>
        Nach einer Übung oder einem Einsatz schaut man sich an, was geschehen
        ist, um es das nächste Mal besser zu machen: das ist das Debriefing
        (Erfahrungsauswertung). orion aic spielt den Einsatz erneut ab,
        berechnet die Kennzahlen der Führung und hält die wichtigsten
        Erkenntnisse fest.
      </p>
    ),
    guide: (
      <>
        <H>Den Einsatz erneut abspielen</H>
        <Steps>
          <li>
            Öffnen Sie <Ui>Debriefing und Übung</Ui> (Klemmbrett-Symbol, unten
            im Dock).
          </li>
          <li>
            Tippen Sie auf <Ui>Abspielen ×60</Ui>: Eine Minute des Einsatzes
            vergeht in einer Sekunde. <Ui>Abspielen ×10</Ui> läuft langsamer.
          </li>
          <li>
            Öffnen Sie während der Wiedergabe die Karte, das Journal oder die
            Mittel: Alles bewegt sich zusammen, wie ein Film des Einsatzes.
          </li>
          <li>
            Die untere Leiste pausiert, ändert die Geschwindigkeit oder kehrt zu
            Live zurück (<Ui>Zurück zu Live</Ui>).
          </li>
        </Steps>
        <H>Die Kennzahlen lesen</H>
        <Table
          head={["Kennzahl", "Was sie bedeutet"]}
          rows={[
            [
              "Median der Reaktion",
              "Übliche Zeit zwischen dem Eintreffen einer Einspielung und der ersten Reaktion (Übung).",
            ],
            [
              "Verspätete Einspielungen",
              "Einspielungen, deren Reaktion nach der vorgesehenen Frist eingetroffen ist oder noch aussteht.",
            ],
            [
              "Überschrittene Fristen",
              "Journaleinträge, die nach ihrer Frist abgeschlossen wurden oder danach noch offen sind.",
            ],
            ["Kumulierte Verspätung", "Alle Verspätungen zusammengezählt."],
            [
              "Bearbeitung einer Meldung",
              "Zeit zwischen dem Empfang einer Meldung und ihrer Bearbeitung: übernommen, im Journal eingetragen oder mit einem Eintrag verknüpft.",
            ],
            [
              "Einträge pro Stunde",
              "Der Rhythmus des Journals, Stunde für Stunde.",
            ],
            [
              "Wer hat was gemacht",
              "Einträge, Korrekturen, Meldungen und andere Änderungen jeder Person.",
            ],
          ]}
        />
        <H>Die wichtigsten Erkenntnisse notieren</H>
        <Steps>
          <li>
            Schreiben Sie unter <Ui>Positive Punkte</Ui>, was gut funktioniert
            hat; unter <Ui>Verbesserungspunkte</Ui>, was man anders machen muss.
          </li>
          <li>
            Der Bereich ist freiwillig (Übermittlung, Logistik …). Tippen Sie
            auf <Ui>Hinzufügen</Ui>.
          </li>
          <li>
            Die Punkte lassen sich auch hinzufügen, wenn das Journal
            abgeschlossen ist: Das Debriefing findet oft danach statt.
          </li>
        </Steps>
        <H>Das Debriefing exportieren</H>
        <p>
          Die Schaltflächen <Ui>PDF</Ui> und <Ui>Word</Ui> öffnen das
          Exportzentrum mit dem Teil <Ui>Übung und Debriefing</Ui>: Kennzahlen,
          Tabellen und wichtigste Erkenntnisse, in einem signierten Dokument.
        </p>
      </>
    ),
    full: (
      <>
        <H>Wie die Reaktion gemessen wird</H>
        <ul>
          <li>
            Eine in den Meldungen eingetroffene Einspielung gilt als bearbeitet,
            sobald ihre Meldung den Zustand « Neu » verlässt, im Journal
            eingetragen oder mit einem Eintrag oder einem Auftrag verknüpft
            wird. Die früheste dieser Zeiten zählt.
          </li>
          <li>
            Die Übungsleitung kann die Reaktion auch von Hand erfassen
            (Schaltfläche <Ui>Reaktion</Ui>): nützlich für eine vorgelesene
            Einspielung oder eine Reaktion über Funk.
          </li>
          <li>
            Die Spieler sehen im Debriefing nur die bereits gespielten
            Einspielungen: Die folgenden bleiben eine Überraschung.
          </li>
        </ul>
        <H>Alle Berechnungen</H>
        <p>
          Die Kennzahlen werden auf dem Arbeitsplatz berechnet, aus dem Verlauf
          des Journals: Sie sind auf allen Arbeitsplätzen und in den Archiven
          dieselben. Nichts wird irgendwohin gesendet.
        </p>
        <Faq q="Gibt es das Debriefing auch für einen echten Einsatz?">
          Ja. Nur die Registerkarte Übungsleitung ist Journalen im Modus Übung
          vorbehalten; Wiedergabe, Kennzahlen und wichtigste Erkenntnisse dienen
          auch nach einem Einsatz.
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
    title: "Übungen: Szenario und Einspielungen",
    openLabel: "Übungsleitung öffnen",
    short: (
      <p>
        Für eine Übung bereitet die Übungsleitung ein Szenario vor: «
        Einspielungen », das heisst erfundene Meldungen, die zu einer
        vorgesehenen Zeit eintreffen (« die Polizei meldet eine gesperrte
        Strasse »). orion aic sendet sie selbständig zum richtigen Zeitpunkt und
        misst die Reaktion der Spieler.
      </p>
    ),
    guide: (
      <>
        <Note kind="warn">
          Nur in einem Journal im Modus <Ui>Übung</Ui>. In einem Einsatzjournal
          wird nie eine Einspielung gesendet.
        </Note>
        <H>Die Übungsleitung öffnen</H>
        <Steps>
          <li>
            <Path steps={["Debriefing und Übung", "Übungsleitung"]} />.
          </li>
          <li>
            Wählen Sie beim ersten Mal einen Code mit 4 bis 8 Ziffern für diesen
            Arbeitsplatz. Er wird verlangt, um zurückzukehren.{" "}
            <Ui>Ausblenden (Spielermodus)</Ui> schliesst die Ansicht wieder.
          </li>
        </Steps>
        <H>Das Szenario vorbereiten</H>
        <Steps>
          <li>
            <Ui>Beispiel « Arve-Hochwasser »</Ui> lädt ein vollständiges
            Szenario zum Üben. <Ui>Importieren</Ui> liest ein JSON-Szenario,{" "}
            <Ui>Exportieren</Ui> speichert es für eine andere Übung.
          </li>
          <li>
            <Ui>Einspielung</Ui> fügt eine hinzu: Titel, Zeitpunkt (Minuten nach
            dem Beginn « T+ » oder feste Uhrzeit), gespielter Absender,
            Zielzelle, Kanal (Meldung, Funk, Telefon), Inhalt, erwartete
            Reaktion und Frist.
          </li>
          <li>
            <Ui>Übermittlung</Ui>: Die Einspielung trifft in den Meldungen ein,
            oder sie wird von der Übungsleitung vorgelesen (am Telefon, über
            Funk).
          </li>
          <li>
            <Ui>Wirkungen beim Eintreffen</Ui>: den Zustand eines Mittels
            ändern, eine Wetterbeobachtung hinzufügen oder eine
            Schlüsselinformation aktualisieren.
          </li>
        </Steps>
        <H>Spielen</H>
        <Steps>
          <li>
            <Ui>Jetzt beginnen (T0)</Ui>: Die Übung beginnt, der Zähler T+
            läuft.
          </li>
          <li>
            Zur vorgesehenen Zeit sendet der Arbeitsplatz der Übungsleitung die
            Einspielung: Sie erscheint in den Meldungen auf allen
            synchronisierten Arbeitsplätzen.
          </li>
          <li>
            Eine vorzulesende Einspielung wird gross angezeigt: Lesen Sie sie
            vor, dann <Ui>Vorgelesen und übermittelt</Ui>.
          </li>
          <li>
            <Ui>Senden</Ui> schickt eine Einspielung sofort los; das
            durchgestrichene Auge nimmt sie aus dem Programm.
          </li>
          <li>
            <Ui>Übung beenden</Ui> stoppt die Sendungen. Das Debriefing zeigt
            danach die Reaktionen.
          </li>
        </Steps>
      </>
    ),
    full: (
      <>
        <H>Gut zu wissen</H>
        <ul>
          <li>
            Die Einspielungen gehen vom Arbeitsplatz der Übungsleitung aus:
            Lassen Sie ihn während der Übung offen. War er geschlossen, gehen
            die verspäteten Einspielungen los, sobald er zurück ist.
          </li>
          <li>
            Zwei gleichzeitig geöffnete Arbeitsplätze der Übungsleitung erzeugen
            keine Duplikate: Die Meldung einer Einspielung ist auf allen
            Arbeitsplätzen dieselbe.
          </li>
          <li>
            Eine feste Uhrzeit gilt nach Zürcher Zeit, auch bei der
            Zeitumstellung. <Ui>Übungstag</Ui> 1 = der Tag nach dem Beginn.
          </li>
          <li>
            Der Code der Übungsleitung verhindert, dass ein Spieler das Szenario
            versehentlich öffnet. Er ist kein Schutz: Das Szenario reist mit dem
            Journal (Synchronisation, Archive, Nachvollziehbarkeit).
          </li>
        </ul>
        <H>Format der Szenariodatei</H>
        <p>
          Eine lesbare JSON-Datei: <code>format</code> «{" "}
          <code>orion-aic-scenario</code> », <code>version</code> 1,{" "}
          <code>title</code>, <code>description</code> und die Liste{" "}
          <code>injects</code> (Titel, <code>timing</code> « offset » oder «
          clock », <code>offset</code> in Minuten, <code>clock</code> « hh:mm »,{" "}
          <code>day</code>, Absender, Empfänger, Kanal, Inhalt, Übermittlung,
          erwartete Reaktion, Frist, Wirkungen). Exportieren Sie das Beispiel,
          um eine vollständige Datei zu sehen.
        </p>
        <H>Die lebendige Demo</H>
        <p>
          Die Demo-Übung (<Ui>Demo-Übung öffnen</Ui> auf der Startseite) spielt
          dasselbe Szenario: Alle paar Minuten treffen eine Meldung, eine
          Zustandsänderung eines Mittels oder eine Wetteraktualisierung ein.
          Lassen Sie sie offen, um einen lebendigen KP zu sehen.
        </p>
      </>
    ),
  },
  {
    id: "wall",
    group: "together",
    icon: Tv,
    hue: 200,
    title: "Wandanzeige",
    short: (
      <p>
        Ein grosser Bildschirm im Führungsraum, den alle von weitem lesen:
        Karte, offene Punkte und Verspätungen, Countdown bis zum nächsten
        Rapport, Schlüsselinformationen, eingesetzte Mittel, letzte Einträge und
        die Uhrzeit. Man bedient ihn nicht: Er aktualisiert sich von selbst.
      </p>
    ),
    guide: (
      <>
        <H>Sie öffnen</H>
        <Steps>
          <li>
            Auf einem beliebigen Arbeitsplatz: <K>⌘K</K> (oder <K>Ctrl K</K>),
            dann <Ui>Wandanzeige des Führungsraums</Ui>, oder das Menü des
            Operateurs (Ihr Name, oben rechts), dann <Ui>Wandanzeige</Ui>.
          </li>
          <li>
            Auf einem Computer, der am grossen Bildschirm angeschlossen ist:
            Treten Sie der Sitzung bei (Sitzungscode), dann ergänzen Sie die
            Adresse mit <code>#mur</code> (zum Beispiel{" "}
            <code>https://orionaic.xyz/#mur</code>).
          </li>
          <li>
            Bewegen Sie die Maus: <Ui>Vollbild</Ui> und <Ui>Verlassen</Ui>{" "}
            erscheinen. <K>F</K> wechselt ins Vollbild, <K>Esc</K> beendet.
          </li>
        </Steps>
      </>
    ),
    full: (
      <ul>
        <li>
          Die Anzeige folgt dem Farbschema des Arbeitsplatzes, einschliesslich
          der Taktischen Nacht (alles in Rot) für einen abgedunkelten Raum.
        </li>
        <li>
          Der Bildschirm bleibt eingeschaltet, solange die Wandanzeige angezeigt
          wird (sofern der Browser es erlaubt).
        </li>
        <li>
          Alle zwei Minuten verschiebt sich das Bild um einige Pixel: So brennt
          sich ein Standbild nicht in die Bildschirme ein.
        </li>
        <li>
          Sie zeigt immer den Live-Zustand, auch wenn auf einem anderen
          Arbeitsplatz die Zeitreise geöffnet ist.
        </li>
      </ul>
    ),
  },
  {
    id: "signature",
    group: "reference",
    icon: KeyRound,
    hue: 160,
    title: "Signatur der Exporte",
    short: (
      <p>
        Jeder Arbeitsplatz hat seinen eigenen Signaturschlüssel. PDF, Archive
        und gedruckte QR-Codes werden signiert: Man kann später prüfen, dass
        seither niemand einen Buchstaben geändert hat.
      </p>
    ),
    guide: (
      <>
        <H>Ein Dokument prüfen</H>
        <Steps>
          <li>
            <Path steps={["Verlauf", "Dokument prüfen"]} />.
          </li>
          <li>
            Legen Sie die Datei ab (PDF, Archiv .orionaic …) oder fügen Sie den
            Text des gedruckten QR-Codes ein.
          </li>
          <li>
            <Ui>Signatur gültig</Ui>: Die Datei ist unverändert.{" "}
            <Ui>Signatur ungültig</Ui>: Sie wurde nach der Signatur geändert.
          </li>
          <li>
            Vergleichen Sie den Fingerabdruck des Schlüssels (zum Beispiel{" "}
            <code>A1B2-C3D4-E5F6-0718</code>) mit jenem, der unten auf dem
            Dokument gedruckt ist oder dem Arbeitsplatz bekannt ist, der es
            erstellt hat.
          </li>
        </Steps>
      </>
    ),
    full: (
      <>
        <H>Was die Signatur beweist</H>
        <ul>
          <li>
            Die Datei (oder der gedruckte Inhalt) ist genau jene, die mit dem
            angegebenen Schlüssel signiert wurde.
          </li>
          <li>
            Das Exportregister des Einsatzes bewahrt die Signatur jeder Datei
            auf: Selbst eine Word- oder Excel-Datei kann geprüft werden.
          </li>
        </ul>
        <H>Was sie nicht beweist</H>
        <ul>
          <li>
            Wer den Schlüssel hielt: Er wird vom Arbeitsplatz selbst erstellt,
            ohne Zertifizierungsstelle. Notieren Sie den Fingerabdruck jedes
            Arbeitsplatzes (angezeigt unter <Ui>Dokument prüfen</Ui>).
          </li>
          <li>
            Die Uhrzeit: Sie stammt von der Uhr des signierenden Arbeitsplatzes,
            nicht von einem Zeitstempeldienst.
          </li>
        </ul>
        <p>
          Der Schlüssel wird in der verschlüsselten Sitzung des Arbeitsplatzes
          aufbewahrt. Er wird nie synchronisiert oder exportiert. Eine neue
          Sitzung erstellt einen neuen Schlüssel.
        </p>
      </>
    ),
  },
];
