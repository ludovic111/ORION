import { mod, type Topic } from "../content";
import { Example, H, Note, Steps, Table, Ui } from "../kit";

export const MAP_TOPIC: Topic = {
  id: "map",
  group: "modules",
  ...mod("map", "Karte öffnen"),
  short: (
    <p>
      Eine Schweizer Karte (swisstopo), um die Lage zu zeichnen: betroffene
      Orte, Zonen, Routen, Mittel. Fahren Sie mit der Maus über ein Objekt, um
      alles zu sehen, was damit verknüpft ist.
    </p>
  ),
  guide: (
    <>
      <H>Eine Signatur setzen</H>
      <Steps>
        <li>
          Wählen Sie das Werkzeug <Ui>Punkt</Ui>.
        </li>
        <li>
          Wählen Sie eine Signatur des Zivilschutzes oder einen einfachen
          Marker.
        </li>
        <li>Klicken Sie an der gewünschten Stelle auf die Karte.</li>
        <li>
          Geben Sie im Detailblatt, das sich öffnet, einen Namen («Damm»), eine
          Ebene und eine Bemerkung ein, dann <Ui>Speichern</Ui>.
        </li>
      </Steps>
      <H>Eine Zone oder eine Route zeichnen</H>
      <Steps>
        <li>
          Werkzeug <Ui>Zone</Ui> (Fläche) oder <Ui>Linie</Ui> (Route,
          Umleitung).
        </li>
        <li>
          Klicken Sie die Punkte nacheinander an und schliessen Sie dann ab, wie
          auf dem Bildschirm angegeben.
        </li>
        <li>Geben Sie im Detailblatt einen Namen und eine Farbe an.</li>
      </Steps>
      <H>Mehrere Karten</H>
      <Steps>
        <li>
          Die Reiter oben auf der Karte: zum Beispiel «Allgemeine Übersicht» und
          «Sektor Acacias (Detail)». Das <Ui>+</Ui> fügt eine hinzu.
        </li>
        <li>
          Jede Karte behält ihren Hintergrund, ihren Ausschnitt und ihre
          ausgeblendeten Ebenen (<Ui>⋯</Ui> →{" "}
          <Ui>Diesen Ausschnitt für diese Karte speichern</Ui>).
        </li>
        <li>
          Ein Objekt, das auf einer Karte gesetzt wird, erscheint nur auf ihr.
          In seinem Detailblatt können Sie es unter <Ui>Karten</Ui> auf anderen
          Karten zeigen, oder auf <Ui>Alle Karten</Ui>.
        </li>
        <li>
          Eine neue Karte beginnt leer; beim Erstellen können die Objekte der
          angezeigten Karte übernommen werden.
        </li>
      </Steps>
      <H>Grösse, Drehung, Text</H>
      <ul>
        <li>
          Die Signaturen werden <strong>auf transparentem Hintergrund</strong>{" "}
          gesetzt. Für den früheren runden Kreis:{" "}
          <Ui>Signatur in einem Kreis</Ui> im Detailblatt.
        </li>
        <li>
          Wählen Sie ein Objekt aus: Ziehen Sie an der <strong>Ecke</strong>, um
          es zu vergrössern, am <strong>runden Griff</strong>, um es zu drehen.
          Oder im Detailblatt, Rubrik <Ui>Darstellung</Ui>: Grösse S, M, L, XL,
          Drehung, Farbe, Dicke und Stil des Strichs.
        </li>
        <li>
          Werkzeug <Ui>Text</Ui>: Schreiben Sie direkt auf die Karte, mit oder
          ohne Etikettenhintergrund, in der gewünschten Grösse und Farbe.
        </li>
        <li>
          Werkzeug <Ui>Freihand</Ui> (Stift): Zeichnen Sie von Hand, mit der
          Maus oder dem Finger.
        </li>
      </ul>
      <H>Einen Ort finden</H>
      <ul>
        <li>
          <strong>Adresssuche</strong>: Geben Sie «Quai des Acacias, Carouge»
          ein.
        </li>
        <li>
          <Ui>Gehe zu</Ui>: Koordinaten in LV95 (
          <code>2 499 800 / 1 115 900</code>) oder GPS (<code>46.19, 6.14</code>
          ).
        </li>
        <li>
          <Ui>Meine Position</Ui>: zentriert die Karte auf Ihren Standort (wenn
          das Gerät es erlaubt).
        </li>
      </ul>
      <Example>
        <p>
          Eine blaue Zone «Überschwemmte Zone Acacias», ein Punkt «Damm», eine
          rote Linie «Umleitung Route de Veyrier». Die Motorspritze 2 wird aus
          dem Modul Mittel auf den Damm gesetzt.
        </p>
      </Example>
    </>
  ),
  full: (
    <>
      <H>Kartenhintergründe</H>
      <p>
        swisstopo farbig, grau, als Luftbild, in der Nachtversion, und
        OpenStreetMap. Wählen Sie den für den Zweck am besten lesbaren: grau,
        damit Ihre Zeichnungen hervortreten, Luftbild, um das Gelände zu sehen.
      </p>
      <p>
        Bereits angesehene Gebiete bleiben auf dem Arbeitsplatz gespeichert:
        Offline werden sie weiterhin angezeigt. Fehlt der Hintergrund, sagt ein
        Banner warum: <Ui>Offline</Ui>, wenn das Gerät kein Netz mehr hat, oder
        «der Server des Hintergrunds antwortet nicht», wenn das Internet
        funktioniert, aber swisstopo oder OpenStreetMap nicht antwortet
        (Schaltfläche <Ui>Erneut versuchen</Ui>). Sobald das Netz zurück ist,
        werden die fehlenden Kacheln von selbst nachgeladen. Die Objekte bleiben
        immer sichtbar.
      </p>
      <H>Werkzeuge</H>
      <Table
        head={["Werkzeug", "Verwendung"]}
        rows={[
          ["Punkt", "Ein Ort: zivile Signatur (BABS) oder einfacher Marker."],
          ["Linie", "Eine Route, eine Umleitung, eine Grenze."],
          ["Zone", "Eine Fläche: überschwemmte Zone, Sektor, Sperrzone."],
          [
            "Perimeter",
            "Ein Kreis um einen Punkt: Absperrung, Evakuierung, Sicherheit. Klicken Sie auf das Zentrum, dann auf den Rand, oder wählen Sie 50 m, 100 m, 200 m, 300 m, 500 m oder 1 km. Ringe: mehrere Kreise auf einmal («100, 300, 1000»), miteinander verknüpft. Jeder Perimeter wird eine normale Zone, benannt mit seinem Radius.",
          ],
          [
            "Fahne",
            "Ein Sektor ab einem Punkt (Rauch, Gas, Zone unter dem Wind): Klicken Sie auf den Ursprung, dann auf Richtung und Länge, oder geben Sie die Richtung (Grad), die Öffnung (30° bis 90°) und die Länge ein. «Aktueller Wind» übernimmt die letzte Prognose aus dem Modul Wetter.",
          ],
          ["Text", "Eine Beschriftung direkt auf der Karte."],
          ["Freihand", "Ein Strich von Hand (Maus, Finger, Stift)."],
          ["Messen", "Eine Distanz auf der Karte."],
        ]}
      />
      <H>Mit den Objekten arbeiten</H>
      <ul>
        <li>
          <strong>Verschieben</strong>: Ziehen Sie das Objekt. Ein kleines
          Ziehen von wenigen Pixeln zählt nicht (etwas zittriger Klick): Das
          Objekt bleibt genau, wo es war. Wenn ein zweiter Finger dazukommt
          (Zoomen mit zwei Fingern) oder die Karte während des Ziehens zoomt,
          kehrt das Objekt an seinen Platz zurück.
        </li>
        <li>
          <strong>Auf Tablet und Telefon</strong>: Tippen Sie zuerst auf das
          Objekt, um es auszuwählen, und ziehen Sie es dann. Wer die Karte über
          einer Signatur verschiebt oder zoomt, bewegt diese also nie.
        </li>
        <li>
          <strong>Schloss</strong> (rechts, unter dem Zoom): sperrt alle Objekte
          auf diesem Arbeitsplatz. Ziehen verschiebt dann immer die Karte, nie
          ein Objekt. Praktisch während einer Präsentation oder eines Briefings.
        </li>
        <li>
          <strong>Klick</strong>: öffnet sein Detailblatt (Name, Ebene,
          Signatur, Farbe, Bemerkungen, Verknüpfungen, löschen).
        </li>
        <li>
          <strong>Mauszeiger darüber</strong>: Eine Vorschaukarte zeigt alles,
          was damit verknüpft ist: Meldungen, Einträge, Mittel …
        </li>
        <li>
          <strong>Ebenen</strong>: Blenden Sie Objektfamilien ein oder aus. Die
          vorgeschlagenen Ebenen stammen aus den Wertelisten.
        </li>
        <li>
          <strong>Objektliste</strong>: alle gezeichneten Objekte, um sie
          schnell wiederzufinden.
        </li>
        <li>
          Unter dem Cursor werden die <strong>LV95-Koordinaten</strong> live
          angezeigt.
        </li>
        <li>
          <strong>Standardansicht</strong>: Speichern Sie den Ausschnitt des
          Ereignisses, um mit einem Klick dorthin zurückzukehren.
        </li>
      </ul>
      <H>Alle Signaturen</H>
      <ul>
        <li>
          Die 268 <strong>zivilen Signaturen des BABS</strong>, nach Gruppe.
        </li>
        <li>
          Über hundert <strong>einfache Marker</strong>: KP Front, KP Rück,
          Sammelstelle, Patientensammelstelle, Helikopterlandeplatz, Ambulanz,
          Sperre, Umleitung, Wasserbezugsort, Elektrizität, chemische Gefahren …
          Geben Sie ein Wort ein («Sammelstelle», «Heli»), um sie zu finden. Die
          Suche versteht auch Französisch und Italienisch («feu», «frana»,
          «blessés»).
        </li>
        <li>
          <Ui>Signatur hinzufügen</Ui>: ein eigenes Bild (PNG, SVG, JPEG, WebP).{" "}
          <Ui>Hintergrund transparent machen</Ui> entfernt den einfarbigen
          Hintergrund; die Signatur wird danach mit allen Arbeitsplätzen
          geteilt.
        </li>
      </ul>
      <H>Importieren und exportieren</H>
      <ul>
        <li>
          <Ui>⋯</Ui> → <Ui>KML / GeoJSON / GPX importieren</Ui>: eine KML-, KMZ-
          (Google Earth), GeoJSON- oder GPX-Datei, die Sie von einem Partner
          erhalten haben (Polizei, Feuerwehr, Geometer). Eine Vorschau zeigt,
          was hinzugefügt wird, auf welcher Karte und in welcher Ebene.
        </li>
        <li>
          Exportieren: PNG-Bild jeder Karte, GeoJSON, KML, GPX, aus dem{" "}
          <Ui>Exportzentrum</Ui>. <Ui>⋯</Ui> → <Ui>GeoJSON in LV95</Ui>: die
          Schweizer Koordinaten (EPSG:2056) für ein kantonales GIS.
        </li>
        <li>
          Dateien in Schweizer Koordinaten (GeoJSON LV95 oder LV03) werden
          erkannt und umgerechnet. Die Ordner einer KML-Datei werden zu Ebenen,
          Löcher in Zonen bleiben erhalten.
        </li>
      </ul>
      <H>Massstabsgetreu drucken</H>
      <p>
        <Ui>⋯</Ui> → <Ui>Massstabsgetreu drucken</Ui>: A4 oder A3, Hoch- oder
        Querformat, im Massstab 1:5 000, 1:10 000, 1:25 000 oder 1:50 000,
        zentriert auf die angezeigte Karte. Das PDF enthält das nummerierte
        Schweizer Koordinatennetz, die Legende der vorhandenen Signaturen, den
        Nordpfeil, den grafischen Massstab, die Uhrzeit, das Ereignis und die
        Klassifizierung. Drucken Sie es mit 100 % (ohne «an Seite anpassen»),
        damit der Massstab erhalten bleibt. Es wird im Exportregister
        eingetragen.
      </p>
      <H>Layer von geo.admin.ch</H>
      <p>
        <Ui>Ebenen</Ui> → <Ui>Layer von geo.admin.ch</Ui> (oder die
        Hintergrund-Schaltfläche): Überschwemmungsgebiete, Oberflächenabfluss,
        Rutschungen, Murgänge, Steinschlag, Lawinen, Waldbrandgefahr,
        hydrologische Messstationen mit ihrer Hochwassergefahrenstufe,
        Hochwasser-Warnkarte, von MeteoSchweiz gemessener Wind und Regen,
        Kataster, Stauanlagen, Notfalltreffpunkte, Kulturgüter,
        Notfallschutzzonen der Kernanlagen. Jeder Layer hat seine eigene
        Deckkraft und einen Link zu seiner offiziellen Legende; ein Klick auf
        die Karte zeigt, was der Layer über diesen Ort weiss (Parzelle,
        Stauanlage, Station …). Kostenlose Daten von Bund und Kantonen.
      </p>
      <H>Koordinatennetz und Koordinaten</H>
      <ul>
        <li>
          Hintergrund-Schaltfläche → <Ui>LV95-Gitter</Ui>: nummerierte
          Kilometerlinien (100 m bei starkem Zoom).
        </li>
        <li>
          <Ui>Fadenkreuz in der Mitte</Ui>: Die angezeigten Koordinaten sind die
          der Kartenmitte, praktisch bei Fingerbedienung.
        </li>
        <li>
          Ein Klick auf die Koordinaten (unten links) kopiert sie, in LV95 oder
          in WGS84.
        </li>
        <li>
          <Ui>Gehe zu</Ui> versteht auch Grad-Minuten-Sekunden (
          <code>46°56′53″N 7°26′51″E</code>), LV03 (
          <code>600 000 / 200 000</code>) und ignoriert die Höhe.
        </li>
      </ul>
      <H>Profil einer Linie</H>
      <p>
        Im Detailblatt einer Linie, <Ui>Höhenprofil</Ui>: Höhen entlang der
        Strecke (swissALTI3D), kumulierter Auf- und Abstieg, Steigungen. Das
        Profil bleibt auf dem Arbeitsplatz und wird auch offline angezeigt.
      </p>
      <H>Rückgängig, wiederherstellen, zurückholen</H>
      <ul>
        <li>
          <Ui>⌘Z</Ui> / <Ui>Ctrl+Z</Ui> macht den letzten Vorgang dieses
          Arbeitsplatzes auf der Karte rückgängig (Setzen, Verschieben,
          Darstellung, Löschen …), <Ui>⇧⌘Z</Ui> / <Ui>Ctrl+Y</Ui> stellt ihn
          wieder her; auch mit den Pfeilen der Werkzeugleiste. Ein Objekt, das
          inzwischen von einem anderen Arbeitsplatz geändert wurde, bleibt
          unberührt.
        </li>
        <li>
          Bei der Zeitreise bietet das Detailblatt eines Objekts{" "}
          <Ui>Dieses Objekt wiederherstellen</Ui> an: Es kehrt so, wie es war,
          ins aktuelle Journal zurück, und der Verlauf behält beide Zustände.
        </li>
        <li>
          Mit der Tastatur: In der Objektliste verschieben die Pfeiltasten das
          gewählte Objekt um 10 m (Shift: 100 m, Alt: 1 m).
        </li>
      </ul>
      <H>Offline</H>
      <ul>
        <li>
          Angesehene Kacheln bleiben auf dem Arbeitsplatz, mit einer Reserve pro
          Hintergrund: Die am längsten nicht mehr aufgerufenen werden zuerst
          entfernt.
        </li>
        <li>
          <Ui>⋯</Ui> → <Ui>Offline-Karte</Ui>: Laden Sie einen Sektor herunter
          (angezeigtes Gebiet oder gezeichneter Rahmen), für einen Zoombereich
          und die gewünschten Hintergründe. Anzahl Kacheln und Grösse werden
          vorher angezeigt; ein Sektor wird nie automatisch gelöscht. Die Liste
          zeigt die gespeicherten Sektoren und den belegten Speicherplatz.
        </li>
        <li>
          Auf dem Telefon füllt die Karte den ganzen Bildschirm; die
          Vollbild-Schaltfläche (rechts) blendet den Rest der Anwendung aus.
        </li>
      </ul>
      <H>Aus einem anderen Modul platzieren</H>
      <p>
        In einem Mittel oder einer Meldung öffnet die Schaltfläche{" "}
        <Ui>Auf der Karte platzieren</Ui> die Karte: Der gesetzte Punkt wird
        automatisch mit diesem Element verknüpft. Positionen, die in Einträgen
        oder Meldungen genannt werden, werden auf der Karte auch als{" "}
        <strong>Geisterobjekte</strong> vorgeschlagen, transparent: Sie müssen
        sie nur bestätigen.
      </p>
      <Note kind="info">
        Die Kartenhintergründe und die Adresssuche kommen aus dem Internet
        (swisstopo, OpenStreetMap, geo.admin.ch). Ohne Verbindung kann der
        Hintergrund ausserhalb der bereits angesehenen oder heruntergeladenen
        Gebiete fehlen, aber Ihre Objekte bleiben da. Es gibt keinen kostenlosen
        und zuverlässigen Routing-Dienst: Fahrzeiten werden nicht berechnet.
      </Note>
    </>
  ),
};
