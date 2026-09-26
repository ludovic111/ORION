import { Briefcase } from "lucide-react";
import type { Topic } from "../content";
import { H, Note, Path, Steps, Table, Ui } from "../kit";

// "KP im Koffer" (German): orion aic without internet, served by a small
// computer with its own Wi-Fi. Long version (French): docs/PC-EN-VALISE.md.

const ADDRESS = "https://10.42.0.1:4443";

export const VALISE_TOPIC: Topic = {
  id: "valise",
  group: "together",
  title: "KP im Koffer (ohne Internet)",
  icon: Briefcase,
  hue: 38,
  short: (
    <p>
      Ein kleiner Computer in einem Koffer erstellt{" "}
      <strong>sein eigenes WLAN</strong>. Die Tablets, Telefone und Computer des
      KP verbinden sich damit und arbeiten gemeinsam in derselben Sitzung,{" "}
      <strong>ohne Internet</strong>. Es fehlen nur die Ortssuche, das Wetter
      und die nie angezeigten Kartenbereiche.
    </p>
  ),
  guide: (
    <>
      <H>Bei der Ankunft vor Ort</H>
      <Steps>
        <li>
          Schalten Sie den <strong>Server</strong> des Koffers ein (Raspberry Pi
          oder alter Laptop). Warten Sie eine Minute.
        </li>
        <li>
          Verbinden Sie jedes Gerät mit dem WLAN des KP, zum Beispiel{" "}
          <code>PC-ORION</code>. Meldet es « kein Internet », wählen Sie «
          verbunden bleiben ». Schalten Sie auf einem Telefon die mobilen Daten
          aus.
        </li>
        <li>
          Öffnen Sie das orion-aic-Symbol auf dem Startbildschirm oder die
          Adresse auf dem Merkblatt des Koffers, zum Beispiel{" "}
          <code>{ADDRESS}</code>. Der Server zeigt sie auch als QR-Code an.
        </li>
        <li>
          Ein Arbeitsplatz erstellt die Sitzung (
          <Path
            steps={[
              "Einstellungen",
              "Synchronisation",
              "Sitzungscode erstellen",
            ]}
          />
          ). Die anderen wählen <Ui>Beitreten</Ui> und geben den Code ein, wie
          gewohnt.
        </li>
      </Steps>
      <H>Das allererste Mal auf einem Gerät</H>
      <Steps>
        <li>
          Der Browser warnt: <em>Zertifikat nicht anerkannt</em>. Das ist
          normal: Der Server hat sein eigenes Zertifikat erstellt.
        </li>
        <li>
          Öffnen Sie die Details des Zertifikats und vergleichen Sie den{" "}
          <strong>SHA-256-Fingerabdruck</strong> mit jenem auf dem Merkblatt des
          Koffers.
        </li>
        <li>
          Ist er gleich, fahren Sie fort. Andernfalls brechen Sie ab und
          benachrichtigen Sie die für das Material verantwortliche Person.
        </li>
      </Steps>
      <Note kind="warn">
        Verwenden Sie <strong>immer dieselbe Adresse</strong>. Für den Browser
        ist eine andere Adresse eine andere Website: Die Sicherung des
        Arbeitsplatzes, die vorbereiteten Karten und das akzeptierte Zertifikat
        sind dort nicht vorhanden.
      </Note>
      <Note kind="info">
        Der Server speichert keine Daten: Jeder Arbeitsplatz hat seine
        vollständige, verschlüsselte Kopie. Fällt der Server aus, arbeitet man
        weiter; die Arbeitsplätze gleichen sich ab, wenn er zurück ist.
      </Note>
    </>
  ),
  full: (
    <>
      <H>Was ohne Internet funktioniert</H>
      <Table
        head={["Funktion", "Ohne Internet"]}
        rows={[
          ["Journal, Meldungen, Mittel, Team, Funk, Kontakte, Agenda", "Ja"],
          ["Synchronisation zwischen den Arbeitsplätzen im WLAN", "Ja"],
          ["Druck, PDF, Exporte, verschlüsselte Sicherung", "Ja"],
          ["Kartenobjekte, Import KML / KMZ / GeoJSON / GPX", "Ja"],
          [
            "Hintergrundkarte",
            "Nur die Bereiche, die auf diesem Arbeitsplatz unter dieser Adresse bereits angezeigt wurden",
          ],
          ["Ortssuche (geo.admin.ch)", "Nein: Koordinaten eingeben"],
          ["Wetter (Open-Meteo)", "Nein"],
        ]}
      />
      <H>Das Material</H>
      <p>
        Richtpreise in der Schweiz (2026), bezahlt von der Organisation. Kein
        Modell ist vorgeschrieben.
      </p>
      <Table
        head={["Element", "Wofür", "CHF"]}
        rows={[
          ["Raspberry Pi 5, 8 GB", "Der Server", "95"],
          ["Offizielles Netzteil USB-C 27 W", "Am Stromnetz", "15"],
          ["Gehäuse mit Lüfter", "Schutz, Kühlung", "15"],
          ["microSD-Karte 64 GB A2", "System und Anwendung", "15–20"],
          ["oder SSD (NVMe oder USB)", "Robuster als die microSD", "40–60"],
          [
            "RTC-Batterie des Pi 5 (optional)",
            "Behält die Uhrzeit ohne Internet",
            "5",
          ],
          ["Reise-WLAN-Router (optional)", "Mehr Geräte, Reichweite", "40–90"],
          [
            "Powerbank USB-C PD 20 000 mAh, 27 bis 45 W",
            "Ohne Stromnetz",
            "50–80",
          ],
          [
            "WLAN-Laserdrucker (oder jener des KP)",
            "Formulare und Berichte",
            "120–200",
          ],
          ["Ethernet- und USB-C-Kabel", "Vorbereitung, Anschlüsse", "10–20"],
          ["Wasserdichter Koffer mit Schaumstoff", "Transport", "50–150"],
          [
            "Etiketten, laminiertes Merkblatt",
            "WLAN, Adresse, Fingerabdruck",
            "10",
          ],
        ]}
      />
      <p>
        Total: rund <strong>CHF 250</strong> (Minimalausrüstung) bis{" "}
        <strong>CHF 750</strong> (SSD, Router, Drucker, verstärkter Koffer). Ein{" "}
        <strong>alter Laptop</strong> tut es auch, für CHF 0: Er hat bereits
        Bildschirm, Akku und WLAN. Deaktivieren Sie seinen Ruhezustand.
      </p>
      <H>Den Server installieren (einmal, mit Internet)</H>
      <Steps>
        <li>
          Mit Raspberry Pi Imager: <strong>Raspberry Pi OS Lite 64-bit</strong>,
          WLAN-Land <code>CH</code>, Benutzer <code>orion</code>.
        </li>
        <li>
          Installieren Sie Node.js 22.18 oder neuer, dann kopieren Sie orion aic
          (Archiv <code>/source/orion-aic-source.tar.gz</code> der Website oder
          git).
        </li>
        <li>
          Im Ordner: <code>npm ci</code>, dann <code>npm run lan</code>. Der
          Server zeigt seine Adressen, den Fingerabdruck des Zertifikats und
          einen QR-Code an.
        </li>
        <li>
          Damit er mit dem Pi von selbst startet: der mitgelieferte Dienst{" "}
          <code>docs/orion-aic-lan.service</code>.
        </li>
      </Steps>
      <p>
        Die Einzelheiten, Befehl für Befehl, stehen in der Anleitung{" "}
        <code>docs/PC-EN-VALISE.md</code> des Quellcodes (auf Französisch).
      </p>
      <H>Das WLAN des KP</H>
      <Table
        head={["Lösung", "Für wen", "Typische Adresse"]}
        rows={[
          [
            "Zugangspunkt des Raspberry Pi (nmcli)",
            "Ein Raum, rund zehn Geräte",
            "https://10.42.0.1:4443",
          ],
          [
            "Reiserouter + per Kabel angeschlossener Server",
            "Mehr Geräte, mehrere Räume",
            "https://192.168.8.10:4443",
          ],
          [
            "Mobiler Hotspot von Windows",
            "Alter Windows-Laptop, höchstens 8 Geräte",
            "https://192.168.137.1:4443",
          ],
        ]}
      />
      <p>
        Das WLAN hat ein Passwort mit mindestens 12 Zeichen. Es entscheidet, wer
        den Server erreichen kann; der <strong>Sitzungscode</strong>{" "}
        entscheidet, wer die Daten lesen kann.
      </p>
      <H>Die Karten vorbereiten</H>
      <p>
        Jeder Arbeitsplatz behält die Kartenkacheln, die er bereits angezeigt
        hat, bis zu <strong>4 000</strong>. Es gibt keine Schaltfläche «
        herunterladen »: Man bereitet einen Sektor vor, indem man ihn
        durchstreift.
      </p>
      <Steps>
        <li>
          Schliessen Sie den Server per Kabel ans Internet an: Die Arbeitsplätze
          im WLAN des KP haben dann Internet <em>und</em> die Adresse des
          Servers.
        </li>
        <li>
          Öffnen Sie auf jedem Arbeitsplatz die <Ui>Karte</Ui> über die Adresse
          des Servers (nicht über orionaic.xyz: das wäre ein anderer Cache).
        </li>
        <li>
          Durchstreifen Sie den Sektor in jeder nützlichen Zoomstufe, mit jeder
          nützlichen Hintergrundkarte, und lassen Sie die Bilder laden.{" "}
          <Ui>Nacht</Ui> verwendet die Kacheln von <Ui>Graue Karte</Ui>.
        </li>
        <li>
          Trennen Sie das Internet und prüfen Sie, ob alles angezeigt wird.
        </li>
      </Steps>
      <Note kind="tip">
        Ein Sektor von 3 × 3 km, von der Zoomstufe der Region bis zu jener des
        Gebäudes, braucht rund 1 100 Kacheln pro Hintergrundkarte. Vermeiden Sie
        danach, auf diesem Arbeitsplatz anderswo zu navigieren: Die neuen
        Kacheln würden die alten verdrängen.
      </Note>
      <H>Drucken</H>
      <p>
        Gedruckt wird aus dem Browser jedes Arbeitsplatzes, nicht vom Server
        aus. Am einfachsten: ein WLAN-Drucker, der mit dem WLAN des KP verbunden
        ist (AirPrint, IPP Everywhere) und von Tablets und Computern ohne
        Treiber gefunden wird. Oder ein USB-Drucker an einem Laptop, der als
        Druckarbeitsplatz dient.
      </p>
      <H>Strom und Uhrzeit</H>
      <ul>
        <li>
          Der Pi 5 verbraucht 4 bis 8 W: Eine Powerbank mit 20 000 mAh hält rund
          7 bis 12 Stunden (5 bis 8 Stunden mit einem Reiserouter).
        </li>
        <li>
          Zum Ausschalten: <code>sudo poweroff</code> oder ein kurzer Druck auf
          seine Taste, dann das Ende des grünen Blinkens abwarten. Das Kabel
          nicht herausreissen.
        </li>
        <li>
          Die Zeiten im Journal stammen von jedem Arbeitsplatz: Prüfen Sie die
          Uhrzeit der Tablets. Ohne Internet verliert der Pi die Uhrzeit: Eine
          RTC-Batterie behält sie.
        </li>
      </ul>
      <H>Vor der Abfahrt</H>
      <ul>
        <li>Alles ist geladen: Powerbank, Tablets, Telefone, Laptops.</li>
        <li>
          Vollständiger Test ohne Internet: Das WLAN erscheint, die Adresse
          öffnet sich, zwei Arbeitsplätze synchronisieren sich.
        </li>
        <li>
          Jeder Arbeitsplatz hat die Adresse einmal geöffnet und das Zertifikat
          akzeptiert.
        </li>
        <li>Die Kartensektoren sind vorbereitet und offline geprüft.</li>
        <li>
          Der Fingerabdruck des Zertifikats, der Name des WLAN und die Adresse
          stehen auf dem Merkblatt des Koffers.
        </li>
        <li>Ein Probedruck ist erfolgt; Papier und Toner sind vorhanden.</li>
        <li>
          Es ist klar, wer vor Ort die Sitzung erstellt und den Code weitergibt.
        </li>
      </ul>
      <H>Wenn es nicht funktioniert</H>
      <Table
        head={["Problem", "Was tun"]}
        rows={[
          [
            "Zertifikatswarnung bei jedem Mal",
            "Immer dieselbe Adresse. Hat sich der Fingerabdruck geändert (erneuertes Zertifikat), vergleichen Sie ihn mit dem Server und akzeptieren Sie erneut.",
          ],
          [
            "Mit dem WLAN verbunden, aber die Seite öffnet sich nicht",
            "Schalten Sie die mobilen Daten aus; geben Sie https:// und :4443 korrekt ein.",
          ],
          [
            "Das WLAN erscheint nicht",
            "WLAN-Land CH auf dem Pi; starten Sie ihn neu.",
          ],
          [
            "Arbeitsplatz « Allein », obwohl andere arbeiten",
            "Prüfen Sie den Sitzungscode; laden Sie die Seite neu. Nichts geht verloren.",
          ],
          [
            "Hintergrundkarte fehlt",
            "Bereich auf diesem Arbeitsplatz nicht vorbereitet: Arbeiten Sie mit den Objekten und den Koordinaten.",
          ],
        ]}
      />
    </>
  ),
};
