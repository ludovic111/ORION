import {
  BookA,
  CircleHelp,
  Keyboard,
  Lightbulb,
  Settings2,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import type { Topic } from "../content";
import { CONTACT_EMAIL, ContactCard, feedbackLink } from "../../../app/contact";
import { Faq, Gloss, H, K, Note, Path, Steps, Table, Ui } from "../kit";

export const PART4: Topic[] = [
  {
    id: "settings",
    group: "reference",
    title: "Einstellungen",
    icon: Settings2,
    hue: 230,
    short: (
      <p>
        Die Einstellungen finden Sie im Operateur-Menü (Ihre Initialen, oben
        rechts). Fünf Rubriken: Dieser Arbeitsplatz, Wertelisten,
        Synchronisation, Sitzung und Journal sowie « Eine Idee? », um den Autor
        zu kontaktieren.
      </p>
    ),
    guide: (
      <>
        <Table
          head={["Rubrik", "Wofür …"]}
          rows={[
            [
              <Ui>Dieser Arbeitsplatz</Ui>,
              "Thema, Animationen, automatischer Druck, angezeigte Module. Gilt nur für dieses Gerät.",
            ],
            [
              <Ui>Wertelisten</Ui>,
              "Die Listen der Standardwerte, die mit einem Klick vorgeschlagen werden. Mit den synchronisierten Arbeitsplätzen geteilt.",
            ],
            [
              <Ui>Synchronisation</Ui>,
              "Mit mehreren Arbeitsplätzen arbeiten. Siehe das Thema « Synchronisation ».",
            ],
            [
              <Ui>Sitzung und Journal</Ui>,
              "Eigenschaften des Journals, Operateur, Sicherung, Abschluss, Ende der Sitzung.",
            ],
          ]}
        />
        <H>Einen Standardwert hinzufügen</H>
        <Steps>
          <li>
            <Path steps={["Einstellungen", "Wertelisten"]} />.
          </li>
          <li>
            Wählen Sie die Liste, zum Beispiel « Standard-Empfänger und
            -Absender ».
          </li>
          <li>
            Geben Sie den neuen Wert ein (« Wetterzelle ») und klicken Sie auf{" "}
            <Ui>Hinzufügen</Ui>. Er wird überall vorgeschlagen, auf allen
            Arbeitsplätzen.
          </li>
        </Steps>
      </>
    ),
    full: (
      <>
        <H>Dieser Arbeitsplatz</H>
        <ul>
          <li>
            <strong>Modus</strong>: Hell, Dunkel oder Wie das System (tagsüber
            hell, nachts dunkel).
          </li>
          <li>
            <strong>Helles Thema</strong>: <em>Papier</em> (Creme, Standard),{" "}
            <em>Schiefer</em> (Blaugrau, kühler), <em>Signal ZS</em> (Blau und
            Orange des Zivilschutzes) oder <em>Hoher Kontrast</em> (Schwarz auf
            Weiss, dicke Linien: pralle Sonne, müde Augen).
          </li>
          <li>
            <strong>Dunkles Thema</strong>: <em>Graphit</em> (Standard),{" "}
            <em>Mitternacht</em> (Nachtblau) oder <em>Taktische Nacht</em>:
            alles rot auf schwarz, Karte inbegriffen, um im Gelände das
            Nachtsehen zu erhalten. Die Sonne-/Mond-Taste wechselt zwischen den
            beiden; die Themen lassen sich auch über die Suche ausprobieren (
            <kbd>⌘K</kbd>, « Thema »).
          </li>
          <li>
            <strong>Animationen</strong>: Alle oder Reduziert (langsamer
            Rechner, Bewegungsempfindlichkeit).
          </li>
          <li>
            <strong>Automatischer Druck</strong>: Einträge dieses
            Arbeitsplatzes, Einträge anderer Arbeitsplätze, Meldungen.
          </li>
          <li>
            <strong>Angezeigte Module</strong>: Blenden Sie aus, was Sie nicht
            benutzen. Die Daten bleiben unverändert.
          </li>
        </ul>
        <H>Wertelisten</H>
        <p>
          Empfänger und Absender, Meldungskategorien, Kanäle, Funktionstypen,
          Grade, Funktionen, Mitteltypen, Organisationen, Kontaktkategorien,
          Termintypen, Kartenebenen, Informationskategorien.
        </p>
        <ul>
          <li>Jeder Wert kann hinzugefügt, geändert oder entfernt werden.</li>
          <li>
            <Ui>Standardwerte wiederherstellen</Ui> stellt die ursprüngliche
            Liste wieder her.
          </li>
          <li>
            Diese Listen sind Vorschläge: In den Formularen können Sie immer
            auch etwas anderes schreiben.
          </li>
          <li>
            Ist das Journal abgeschlossen, lassen sich die Wertelisten nicht
            mehr ändern.
          </li>
        </ul>
        <H>Sitzung und Journal</H>
        <p>
          Eigenschaften des Journals (Ereignis, Organisation, Ort, Referenz,
          Modus, Verteilung), Name des Operateurs, verschlüsselte Sicherung,
          Abschluss und Wiedereröffnung, Löschen der Sitzung. Siehe « Sitzung,
          Journale und Sicherung ».
        </p>
      </>
    ),
  },
  {
    id: "security",
    group: "reference",
    title: "Sicherheit und Daten",
    icon: ShieldCheck,
    hue: 150,
    short: (
      <p>
        Kein Konto, keine Werbung, kein Tracking. Ihre Daten bleiben auf Ihrem
        Gerät; was zwischen den Arbeitsplätzen übertragen wird, ist
        verschlüsselt.
      </p>
    ),
    guide: (
      <>
        <H>Was das Gerät verlässt, und wann</H>
        <Table
          head={["Dienst", "Wann", "Was gesendet wird"]}
          rows={[
            [
              "Kartenhintergründe swisstopo / OpenStreetMap",
              "Wenn die Karte angezeigt wird",
              "Der betrachtete Ausschnitt (Kartenbilder)",
            ],
            [
              "Adresssuche geo.admin.ch",
              "Wenn Sie eine Adresse suchen",
              "Der gesuchte Text",
            ],
            [
              "Prognosen Open-Meteo",
              "Wenn Sie sie abrufen",
              "Nur die Koordinaten des Orts",
            ],
            [
              "Synchronisations-Relais",
              "Wenn die Synchronisation aktiv ist",
              "Verschlüsselte, unlesbare Nachrichten",
            ],
            [
              "Exportierte Dateien",
              "Wenn Sie exportieren",
              "Was Sie damit tun, entscheiden Sie",
            ],
          ]}
        />
        <H>Gute Gewohnheiten</H>
        <Steps>
          <li>
            Wählen Sie einen langen Wiederherstellungssatz: Ein kurzer Satz ist
            besser als ein kompliziertes Wort.
          </li>
          <li>
            <Ui>Sperren</Ui>, wenn Sie den Arbeitsplatz verlassen.
          </li>
          <li>
            Exportieren Sie verschlüsselt als <code>.orionaic</code>; lassen Sie
            keine unverschlüsselten Exporte herumliegen.
          </li>
          <li>
            Übermitteln Sie den Sitzungscode und die Sätze über einen separaten,
            sicheren Kanal.
          </li>
          <li>
            Am Ende des Einsatzes: archivieren, dann die Sitzung auf den
            Arbeitsplätzen löschen.
          </li>
        </Steps>
      </>
    ),
    full: (
      <>
        <H>Technische Details</H>
        <ul>
          <li>
            Sicherung auf dem Arbeitsplatz: AES-256-GCM, Schlüssel aus dem Satz
            abgeleitet (PBKDF2-SHA-256, 600’000 Iterationen). Der Satz wird nie
            gespeichert.
          </li>
          <li>
            Synchronisation: Ende-zu-Ende-Verschlüsselung AES-256-GCM, Schlüssel
            aus dem Sitzungscode abgeleitet; das Relais kennt nur eine gehashte
            Kennung.
          </li>
          <li>
            Keine Telemetrie, keine Statistik, kein Dienst mit künstlicher
            Intelligenz.
          </li>
          <li>
            Strenge Sicherheitsrichtlinie (CSP): Die Seite kann nur die oben
            aufgeführten Dienste kontaktieren.
          </li>
          <li>
            Importierte Dateien werden streng geprüft; Formeln in
            Tabellenexporten werden neutralisiert; exportiertes HTML enthält
            kein Skript.
          </li>
          <li>
            Die Namen der Operateure werden angegeben, nicht überprüft: Der
            Verlauf ist keine elektronische Signatur.
          </li>
          <li>
            Der vollständige Quellcode (Lizenz AGPL-3.0) lässt sich über das
            Operateur-Menü herunterladen.
          </li>
        </ul>
        <Note kind="warn">
          orion aic ist eine unabhängige Software, ohne Zulassung oder
          Genehmigung durch das BABS. Für echte Daten braucht es einen
          geeigneten Arbeitsplatz und die Erlaubnis Ihrer Organisation.
        </Note>
      </>
    ),
  },
  {
    id: "mobile",
    group: "reference",
    title: "Smartphone und Tablet",
    icon: Smartphone,
    hue: 175,
    short: (
      <p>
        orion aic funktioniert auch auf Smartphone und Tablet. Installieren Sie
        es wie eine App: Es öffnet sich im Vollbild und funktioniert offline.
      </p>
    ),
    guide: (
      <>
        <H>Die Anwendung installieren</H>
        <Table
          head={["Gerät", "Wie"]}
          rows={[
            [
              "Alle",
              "Operateur-Menü → Anwendung installieren (sofern der Browser es anbietet)",
            ],
            ["iPhone / iPad", "Safari → Teilen → « Zum Home-Bildschirm »"],
            ["Android", "Chrome → ⋮ → « App installieren »"],
            ["Computer", "Installationssymbol in der Adressleiste"],
          ]}
        />
        <H>Was sich auf kleinen Bildschirmen ändert</H>
        <ul>
          <li>Das Modul-Dock wandert an den unteren Bildschirmrand.</li>
          <li>
            Eine runde Schaltfläche <Ui>+</Ui> unten rechts öffnet einen neuen
            Eintrag.
          </li>
          <li>
            Die Schaltflächen sind grösser, die Eingabe erfolgt in einem eigenen
            Fenster.
          </li>
        </ul>
      </>
    ),
    full: (
      <>
        <H>Praktisch im Gelände</H>
        <ul>
          <li>
            <strong>Einer Sitzung beitreten</strong>: Scannen Sie den auf dem
            Hauptarbeitsplatz angezeigten QR-Code mit der Kamera; der Code wird
            vorausgefüllt.
          </li>
          <li>
            <strong>Funkgeräte</strong>: Scannen Sie die QR-Etikette eines
            Funkgeräts, um es abzugeben oder zurückzunehmen.
          </li>
          <li>
            <strong>Kontakte</strong>: Tippen Sie auf eine Nummer, um anzurufen.
          </li>
          <li>
            Die Felder verwenden eine Schriftgrösse, die das automatische Zoomen
            des iPhones verhindert.
          </li>
        </ul>
        <Note kind="info">
          Die installierte Anwendung speichert ihre Daten getrennt vom
          Browser-Tab: Eine in Safari geöffnete Sitzung erscheint nicht in der
          installierten App. Treten Sie der Sitzung mit ihrem Code bei oder
          importieren Sie ein Archiv.
        </Note>
      </>
    ),
  },
  {
    id: "shortcuts",
    group: "reference",
    title: "Tastenkürzel",
    icon: Keyboard,
    hue: 260,
    short: (
      <p>
        Einige Tasten sparen viel Zeit. Die nützlichste: <K>⌘K</K> (Mac) oder{" "}
        <K>Ctrl+K</K> (Windows), um alles zu finden und alles zu erledigen.
      </p>
    ),
    guide: (
      <Table
        head={["Tasten", "Wirkung"]}
        rows={[
          [
            <>
              <K>⌘K</K> / <K>Ctrl+K</K>
            </>,
            "Suchen oder handeln, von überall aus",
          ],
          [
            <>
              <K>⌘↵</K> / <K>Ctrl+↵</K>
            </>,
            "Formular speichern (Eintrag, Meldung …)",
          ],
          [<K>Esc</K>, "Ein Fenster, ein Menü, eine Karteikarte schliessen"],
          [
            <>
              <K>↑</K> <K>↓</K> dann <K>↵</K>
            </>,
            "In einer Vorschlagsliste navigieren, dann auswählen",
          ],
          [
            <>
              <K>Tab</K> / <K>Umschalt+Tab</K>
            </>,
            "Zum nächsten / vorherigen Feld wechseln",
          ],
          [<K>Tab</K>, "Ganz am Anfang der Seite: « Zum Inhalt »"],
          [
            <>
              <K>→</K> <K>Leertaste</K> / <K>←</K>
            </>,
            "Präsentation: nächste / vorherige Folie",
          ],
          [
            <>
              <K>P</K> <K>H</K> <K>E</K> <K>L</K>
            </>,
            "Präsentation: Stift, Leuchtstift, Radierer, Laserpointer",
          ],
          [
            <>
              <K>O</K> <K>B</K> <K>N</K> <K>T</K> <K>F</K>
            </>,
            "Präsentation: Übersicht, schwarzer Bildschirm, Notizen, Stoppuhr, Vollbild",
          ],
        ]}
      />
    ),
    full: (
      <>
        <H>Was « Suchen oder handeln » findet</H>
        <ul>
          <li>
            <strong>Die Module</strong>: « Gehe zu Lagekarte » …
          </li>
          <li>
            <strong>Die Aktionen</strong>: neuer Eintrag im Journal, neue
            eingegangene Meldung, Lagebericht A4, exportieren (alle Formate),
            Lage präsentieren, Wandanzeige, Zeitreise, Momentaufnahme der Lage
            festhalten, Nachvollziehbarkeit, Verbesserung vorschlagen, Datei
            importieren, mit anderen Arbeitsplätzen synchronisieren,
            automatischen Druck aktivieren oder deaktivieren, helles oder
            dunkles Thema, Einstellungen und Wertelisten, neues Journal in der
            Sitzung.
          </li>
          <li>
            <strong>Die Elemente</strong>: Einträge, Meldungen, Mittel,
            Personen, Kontakte, Kartenobjekte … Tippen Sie ein paar Buchstaben
            ein, Akzente und Umlaute spielen keine Rolle.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "contact",
    group: "reference",
    title: "Eine Idee, ein Bedürfnis?",
    icon: Lightbulb,
    hue: 45,
    short: (
      <p>
        orion aic entwickelt sich mit denen, die es benutzen. Um eine Funktion
        anzufragen, ein Problem zu melden oder vorzuschlagen, was Ihnen das
        Leben erleichtern würde, schreiben Sie an{" "}
        <a href={feedbackLink("Hilfe")}>{CONTACT_EMAIL}</a>.
      </p>
    ),
    guide: (
      <>
        <ContactCard topic="Hilfe" />
        <H>Wo Sie diesen Kontakt finden</H>
        <ul>
          <li>
            Operateur-Menü (Ihre Initialen, oben rechts) →{" "}
            <Ui>Eine Idee, ein Bedürfnis?</Ui>
          </li>
          <li>
            <Path steps={["Einstellungen", "Eine Idee?"]} />
          </li>
          <li>
            <K>⌘K</K> → « Verbesserung vorschlagen »
          </li>
          <li>Unten auf der Startseite.</li>
        </ul>
        <Note kind="tip">
          Beschreiben Sie die Situation (« während des Führungsrapports müsste
          man … ») statt der Lösung: So erhalten Sie am ehesten, was Ihnen
          wirklich hilft. Senden Sie nie den Inhalt eines echten Journals.
        </Note>
      </>
    ),
  },
  {
    id: "faq",
    group: "reference",
    title: "Häufige Fragen",
    icon: CircleHelp,
    hue: 320,
    always: true,
    short: (
      <p>
        Die Antworten auf die Fragen, die sich alle stellen. Klicken Sie auf
        eine Frage, um sie zu öffnen.
      </p>
    ),
    guide: (
      <div className="docs-faqs">
        <Faq q="Wer hat dieses Element geändert?">
          Öffnen Sie seine Karteikarte: Unten steht « Erstellt von … · geändert
          von … », und die Schaltfläche <Ui>Verlauf</Ui> zeigt alle seine
          Versionen. Für den ganzen Einsatz: Modul <Ui>Nachvollziehbarkeit</Ui>.
        </Faq>
        <Faq q="Kann man die Lage so ansehen, wie sie um 10 Uhr war?">
          Ja: die Uhr <Ui>Zeitreise</Ui> oben rechts, dann 10:00 wählen. Alle
          Module zeigen den Stand dieses Zeitpunkts, das Wetter inbegriffen.
        </Faq>
        <Faq q="Wie schlage ich eine Verbesserung vor?">
          Schreiben Sie an <a href={feedbackLink("FAQ")}>{CONTACT_EMAIL}</a>{" "}
          (Operateur-Menü → <Ui>Eine Idee, ein Bedürfnis?</Ui>).
        </Faq>
        <Faq q="Muss man ein Konto erstellen?">
          Nein. Öffnen Sie die Website, erstellen Sie eine Sitzung, das ist
          alles. Es gibt weder Konto noch Anmeldepasswort.
        </Faq>
        <Faq q="Wo sind meine Daten?">
          Im Browser Ihres Geräts. Nichts wird auf einem Server gespeichert. Um
          sie anderswo aufzubewahren, exportieren Sie ein Archiv.
        </Faq>
        <Faq q="Ich habe meinen Wiederherstellungssatz vergessen. Was tun?">
          Niemand kann ihn wiederherstellen. Sie können der Sitzung von einem
          anderen synchronisierten Arbeitsplatz aus beitreten oder ein
          exportiertes Archiv importieren. Andernfalls löscht{" "}
          <Ui>Satz verloren</Ui> den verschlüsselten Speicher, um bei null zu
          beginnen.
        </Faq>
        <Faq q="Ich habe den Tab einer temporären Sitzung geschlossen. Ist alles verloren?">
          Auf diesem Arbeitsplatz ja. Waren aber andere Arbeitsplätze
          synchronisiert, treten Sie ihnen mit dem Code bei: Die Sitzung kommt
          zurück. Andernfalls lässt sich die Arbeit nur mit einem exportierten
          Archiv wiederherstellen.
        </Faq>
        <Faq q="Wie arbeitet man zu mehreren?">
          <Path
            steps={[
              "Einstellungen",
              "Synchronisation",
              "Sitzungscode erstellen",
            ]}
          />
          , dann auf den anderen Arbeitsplätzen: <Ui>Beitreten</Ui> und der
          Code. Siehe « Synchronisation zwischen Arbeitsplätzen ».
        </Faq>
        <Faq q="Funktioniert es ohne Internet?">
          Ja, nach einem ersten Laden. Die Synchronisation braucht Internet oder
          das lokale Netzwerk (<code>npm run lan</code>). Die
          Kartenhintergründe, die Adresssuche und die Wetterprognosen brauchen
          Internet.
        </Faq>
        <Faq q="Zwei Personen ändern gleichzeitig dasselbe: Wer gewinnt?">
          Bei einem Journaleintrag werden beide Versionen im Verlauf behalten.
          Bei allem anderen setzt sich die neueste Änderung durch.
        </Faq>
        <Faq q="Ich habe mich in einem Journaleintrag geirrt.">
          Öffnen Sie ihn und klicken Sie auf den Stift: Die Korrektur wird
          gespeichert, und die alte Version bleibt einsehbar. Um den Eintrag
          ungültig zu machen, setzen Sie seine Nachverfolgung auf{" "}
          <Ui>Annulliert</Ui>. Bei einer doppelten Erfassung löschen Sie ihn mit
          einer Begründung.
        </Faq>
        <Faq q="Warum hat sich die Nummer eines Eintrags geändert?">
          Zwei Arbeitsplätze haben offline zwei Einträgen dieselbe Nummer
          gegeben: Der ältere behält die Nummer, der andere wird neu nummeriert.
          Das kommt auch beim Zusammenführen eines Archivs vor.
        </Faq>
        <Faq q="Ich kann nichts mehr ändern.">
          Das Journal ist wohl abgeschlossen (nur Lesen). Es lässt sich unter{" "}
          <Path steps={["Einstellungen", "Sitzung und Journal"]} /> wieder
          öffnen.
        </Faq>
        <Faq q="Wie drucke ich, ohne jedes Mal zu klicken?">
          Aktivieren Sie den automatischen Druck und starten Sie Chrome oder
          Edge mit der Option <code>--kiosk-printing</code>. Siehe « Drucken ».
        </Faq>
        <Faq q="Wie übergebe ich ein Journal an einen nicht synchronisierten Arbeitsplatz?">
          Exportieren Sie ein Archiv <code>.orionaic</code>, senden Sie es und
          übermitteln Sie den Satz auf einem anderen Weg. Der andere
          Arbeitsplatz importiert es.
        </Faq>
        <Faq q="Ich finde ein Modul im Dock nicht mehr.">
          Es ist vielleicht ausgeblendet:{" "}
          <Path
            steps={[
              "Einstellungen",
              "Dieser Arbeitsplatz",
              "Angezeigte Module",
            ]}
          />
          .
        </Faq>
        <Faq q="Die Farben oder die Animationen stören mich.">
          Wählen Sie ein anderes Thema (zum Beispiel <em>Hoher Kontrast</em>{" "}
          oder <em>Taktische Nacht</em>) und reduzierte Animationen unter{" "}
          <Path steps={["Einstellungen", "Dieser Arbeitsplatz"]} />.
        </Faq>
      </div>
    ),
    full: (
      <div className="docs-faqs">
        <Faq q="Was sieht der Server beim Synchronisieren?">
          Nichts Lesbares: eine gehashte Raumkennung und verschlüsselte
          Nachrichten. Er speichert nichts.
        </Faq>
        <Faq q="Der Sitzungscode ist bekannt geworden. Was tun?">
          Auf jedem Arbeitsplatz <Ui>Auf diesem Arbeitsplatz stoppen</Ui>. Dann
          erstellt ein Arbeitsplatz einen neuen Code, und die anderen treten ihm
          bei.
        </Faq>
        <Faq q="Kann man über Bluetooth synchronisieren?">
          Nein, die Browser erlauben das für diesen Zweck nicht. Ohne Internet
          verwenden Sie das lokale Netzwerk.
        </Faq>
        <Faq q="Was bedeuten die Punkte auf dem Dock?">
          Rot: Fristen sind überschritten. Violett: neue Meldungen warten auf
          Bearbeitung.
        </Faq>
        <Faq q="Welchen Browser soll ich verwenden?">
          Einen aktuellen Browser: Chrome, Edge, Firefox oder Safari. Die Seite
          muss über https laufen.
        </Faq>
        <Faq q="Ist orion aic offiziell?">
          Nein. Es ist eine unabhängige Software, ohne Zulassung durch das BABS.
          Verwenden Sie echte Daten nur mit der Erlaubnis Ihrer Organisation.
        </Faq>
        <Faq q="Kann ich einem Eintrag ein Foto anhängen?">
          Nein, orion aic speichert keine Dateianhänge. Notieren Sie die
          Referenz des Fotos oder Dokuments.
        </Faq>
      </div>
    ),
  },
  {
    id: "glossary",
    group: "reference",
    title: "Glossar",
    icon: BookA,
    hue: 45,
    always: true,
    short: <p>Die Begriffe des Fachs und der Anwendung, einfach erklärt.</p>,
    guide: (
      <dl className="docs-glossary">
        <Gloss term="Abgeschlossenes Journal">
          Ein beendetes Journal: Man kann es lesen, drucken, exportieren, aber
          nicht mehr ändern (ausser man öffnet es wieder).
        </Gloss>
        <Gloss term="Ablösung">
          Der Mannschaftswechsel: Wer geht, übergibt die Lage an die, die
          kommen.
        </Gloss>
        <Gloss term="Archiv .orionaic">
          Die verschlüsselte Datei, die ein ganzes Journal enthält. Sie dient
          zum Archivieren und Übermitteln. Die alten Archive <code>.orion</code>{" "}
          bleiben lesbar.
        </Gloss>
        <Gloss term="BABS">
          Das Bundesamt für Bevölkerungsschutz, das die Regeln und die
          Ausbildung des Zivilschutzes festlegt.
        </Gloss>
        <Gloss term="Direktmodus">
          Die Funkgeräte sprechen direkt miteinander, ohne über das Netz zu
          gehen. Kurze Reichweite, funktioniert aber überall.
        </Gloss>
        <Gloss term="Endgerät">
          Ein Funkgerät: tragbar, im Fahrzeug oder fest installiert.
        </Gloss>
        <Gloss term="Frist">
          Der Zeitpunkt, zu dem ein Auftrag oder eine Antwort erwartet wird.
        </Gloss>
        <Gloss term="FU · Führungsunterstützung">
          Das Team, das den Einsatzleiter unterstützt: Es verfolgt die Lage,
          führt das Journal, bearbeitet die Meldungen und die Verbindungen.
        </Gloss>
        <Gloss term="Führungsrhythmus">
          Das regelmässige Programm der Rapporte, Orientierungen und Ablösungen
          (zum Beispiel ein Rapport alle 2 Stunden).
        </Gloss>
        <Gloss term="KP Front">
          Der Kommandoposten, der nahe beim Ereignis im Gelände eingerichtet
          ist.
        </Gloss>
        <Gloss term="KP Rück">
          Der zurückversetzte Kommandoposten (Basis, Gebäude), der koordiniert,
          unterstützt und die Verbindung zu den Behörden sicherstellt.
        </Gloss>
        <Gloss term="LV95">
          Das Schweizer Koordinatensystem. Zwei Zahlen in Metern, zum Beispiel
          2’499’800 / 1’115’900.
        </Gloss>
        <Gloss term="Modul">
          Ein Teil von orion aic: Journal, Karte, Funk … Jedes hat sein Symbol
          im Dock.
        </Gloss>
        <Gloss term="Polycom">
          Das Schweizer Funknetz der Sicherheitsorganisationen.
        </Gloss>
        <Gloss term="Quittung">
          Die Bestätigung, dass eine Meldung empfangen oder ein Auftrag erledigt
          wurde. Auch: das bei der Abgabe von Material unterschriebene Papier.
        </Gloss>
        <Gloss term="Relais">
          Ein Gerät, das die Nachrichten wiederholt, um weiter zu reichen, dort
          wo das Netz nicht hinkommt.
        </Gloss>
        <Gloss term="RFSI">
          Die eindeutige Identifikationsnummer eines Funkgeräts im Polycom-Netz.
        </Gloss>
        <Gloss term="Rufname">
          Der am Funk verwendete Name. Er bezeichnet eine Funktion (« KP Carouge
          »), nie eine Person.
        </Gloss>
        <Gloss term="Schlüsselinformationen">
          Die wenigen Zahlen, die die Lage zusammenfassen: evakuierte Personen,
          betroffene Gebäude, eingesetzte Mittel …
        </Gloss>
        <Gloss term="Sitzung">
          Die gesamte Arbeit für ein Ereignis auf einem Arbeitsplatz: ein oder
          mehrere Journale und alles, was dazugehört.
        </Gloss>
        <Gloss term="swisstopo">
          Das Bundesamt für Landestopografie, das die Schweizer Landeskarten
          herstellt.
        </Gloss>
        <Gloss term="Synchronisation">
          Mehrere Arbeitsplätze, die dank eines Sitzungscodes live dieselbe
          Sitzung teilen.
        </Gloss>
        <Gloss term="TKG · Gesprächsgruppe">
          Eine Polycom-Gesprächsgruppe: Alle Funkgeräte der Gruppe hören sich
          über das Netz.
        </Gloss>
        <Gloss term="Verbindungskontrolle">
          Prüfen, ob man sich am Funk versteht. Antwort THREE (gut), TWO
          (schwach, aber verständlich) oder ONE (ungenügend).
        </Gloss>
        <Gloss term="Verschlüsselt">
          In unlesbaren Code umgewandelt. Nur wer den Schlüssel hat (Satz oder
          Sitzungscode), kann es wieder lesen.
        </Gloss>
        <Gloss term="Werteliste">
          Eine Liste von Standardwerten, die mit einem Klick vorgeschlagen
          werden, änderbar in den Einstellungen.
        </Gloss>
        <Gloss term="WGS84">
          Das Koordinatensystem des GPS, in Grad: Breite und Länge, zum Beispiel
          46.19, 6.14.
        </Gloss>
        <Gloss term="Wiederherstellungssatz">
          Der geheime Satz (mindestens 12 Zeichen), der die Sitzung auf dem
          Arbeitsplatz verschlüsselt. Geht er verloren, kann ihn niemand
          wiederherstellen.
        </Gloss>
        <Gloss term="Zelle">
          Eine kleine Gruppe, die für einen Bereich zuständig ist: Lage,
          Logistik, Telematik, Kommunikation …
        </Gloss>
      </dl>
    ),
  },
];
