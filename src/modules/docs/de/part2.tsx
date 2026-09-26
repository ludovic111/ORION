import { mod, type Topic } from "../content";
import { Example, H, K, Note, Path, States, Steps, Table, Ui } from "../kit";

export const PART2: Topic[] = [
  {
    id: "resources",
    group: "modules",
    ...mod("resources", "Mittel öffnen"),
    short: (
      <p>
        Die Liste aller Mittel, Fahrzeuge, Teams, Material, und ihres Status:
        verfügbar, alarmiert, unterwegs, im Einsatz …
      </p>
    ),
    guide: (
      <>
        <States
          steps={[
            "Verfügbar",
            "Alarmiert",
            "Unterwegs",
            "Im Einsatz",
            "Zurück",
          ]}
          extra={["Ausser Betrieb"]}
        />
        <H>Ein Mittel hinzufügen</H>
        <Steps>
          <li>Fügen Sie ein Mittel hinzu.</li>
          <li>
            Geben Sie eine Bezeichnung ein (« Motorspritze 2 »). Alles andere
            (Typ, Organisation, Bestand …) ist freiwillig.
          </li>
          <li>
            <Ui>Speichern</Ui>.
          </li>
        </Steps>
        <H>Den Status ändern</H>
        <Steps>
          <li>
            Ziehen Sie die Karte des Mittels in die gewünschte Spalte, zum
            Beispiel von « Unterwegs » nach « Im Einsatz ».
          </li>
          <li>
            Ist die Option aktiv, wird die Änderung automatisch im Journal
            erfasst (« Motorspritze 2: Unterwegs → Im Einsatz »).
          </li>
        </Steps>
      </>
    ),
    full: (
      <>
        <H>Alle Möglichkeiten</H>
        <ul>
          <li>
            <strong>Tafel nach Status</strong> oder <strong>Liste</strong>, mit
            Filtern.
          </li>
          <li>
            Der <strong>Gesamtbestand an Personal</strong> im Einsatz wird
            berechnet.
          </li>
          <li>
            <strong>Statusänderungen im Journal erfassen</strong>: eine Option
            zum Aktivieren, um jede Bewegung festzuhalten, ohne etwas zu tippen.
          </li>
          <li>
            <Ui>Auf der Karte platzieren</Ui>: Das Mittel erscheint auf der
            Karte, verknüpft mit seinem Datenblatt.
          </li>
          <li>
            <Ui>Mittel anfordern</Ui>: öffnet eine Anforderung im Register{" "}
            <Ui>Anforderungen</Ui>, verfolgt bis zum Eintreffen (siehe «
            Mittelanforderungen »).
          </li>
          <li>
            <strong>A4-Druck</strong> der Mittelübersicht.
          </li>
          <li>
            Die vorgeschlagenen Mitteltypen und Organisationen stammen aus den
            Wertelisten; jeder freie Text wird akzeptiert.
          </li>
        </ul>
        <Note kind="tip">
          Verwenden Sie <Ui>Ausser Betrieb</Ui> für ein Fahrzeug mit Panne,
          statt es zu löschen: Es bleibt in der Historie, und man weiss, warum
          es fehlt.
        </Note>
      </>
    ),
  },
  {
    id: "team",
    group: "modules",
    ...mod("team", "Team öffnen"),
    short: (
      <p>
        Wer macht was und wer ist da: die Posten (KP Front, KP Rück, Zellen) und
        die Personen, mit ihrer Funktion und ihrer Anwesenheit.
      </p>
    ),
    guide: (
      <>
        <H>Das Team aufstellen</H>
        <Steps>
          <li>
            Keine Lust, alles selbst zu erstellen? Die{" "}
            <strong>Standardstruktur</strong> erstellt mit einem Klick die
            üblichen Posten und Zellen (KP Front, KP Rück, Zellen).
          </li>
          <li>
            Fügen Sie eine Person hinzu: Grad, Name, Funktion, Rufname, Telefon.
            Nur der Name zählt, alles andere ist freiwillig.
          </li>
          <li>
            Ziehen Sie die Person im Organigramm in ihren Posten oder ihre
            Zelle.
          </li>
          <li>
            Aktualisieren Sie ihre Anwesenheit: <Ui>Anwesend</Ui>,{" "}
            <Ui>In Pause</Ui>, <Ui>Abwesend</Ui>, <Ui>Abgelöst</Ui>.
          </li>
        </Steps>
        <Example>
          <p>
            Wm Muller, Operateur Journal, Rufname « KP Carouge », in der Zelle
            Lage des KP Rück. Um 18:00 wird er abgelöst: ein Klick auf{" "}
            <Ui>Abgelöst</Ui>, sein Nachfolger wechselt auf <Ui>Anwesend</Ui>.
          </p>
        </Example>
      </>
    ),
    full: (
      <>
        <H>Details</H>
        <ul>
          <li>
            Zwei Ansichten: das <strong>Organigramm</strong> (Ziehen und
            Ablegen) und die <strong>Liste</strong>.
          </li>
          <li>
            Für jede Person können <strong>Zeiten</strong> erfasst werden
            (Ankunft, Abgang, Ablösung).
          </li>
          <li>
            Grade, Funktionen und Postentypen werden aus den Wertelisten
            vorgeschlagen, freier Text wird immer akzeptiert.
          </li>
          <li>
            Eine Person wird automatisch mit ihrem Posten, ihrem Rufnamen und
            damit mit dem ihr abgegebenen Funkgerät verknüpft.
          </li>
          <li>
            <strong>Druck</strong> der Teamliste in A4.
          </li>
          <li>
            Dritte Ansicht <Ui>Anwesenheiten</Ui>: Ankünfte und Abgänge (Taste
            oder QR-Badge), Dienstzeit, Ablöseplan (siehe « Anwesenheiten und
            Ablösung »).
          </li>
        </ul>
        <Note kind="info">
          Die Anwesenheiten speisen die Seite Lage: Man sieht sofort, wie viele
          Personen verfügbar sind.
        </Note>
      </>
    ),
  },
  {
    id: "radio",
    group: "modules",
    ...mod("radio", "Funknetz öffnen"),
    short: (
      <p>
        Der Plan des Polycom-Funknetzes: die Gesprächsgruppen, die Rufnamen, die
        Funkgeräte, wer welches Funkgerät hat, und die Verbindungskontrollen.
      </p>
    ),
    guide: (
      <>
        <H>Das Netz vorbereiten</H>
        <Steps>
          <li>
            <strong>Gesprächsgruppen</strong>: Erstellen Sie die
            Gesprächsgruppen, zum Beispiel <code>G101</code> « ZS Führung » und{" "}
            <code>G102</code> « ZS Einsatz Arve ».
          </li>
          <li>
            <strong>Rufnamen</strong>: « KP Carouge », « Patrouille Alpha », «
            Team Bravo » … mit ihrer Hauptgruppe.
          </li>
          <li>
            <strong>Endgeräte</strong>: die Funkgeräte. <Ui>Serie</Ui> erstellt
            auf einmal <code>R-01</code> bis <code>R-20</code>.
          </li>
        </Steps>
        <H>Ein Funkgerät abgeben und zurücknehmen</H>
        <Steps>
          <li>
            Bei einem Endgerät: <Ui>Abgeben</Ui>. Wählen Sie den Rufnamen,
            erfassen Sie den Inhaber (Grad, Name) und das Zubehör.
          </li>
          <li>
            Drucken Sie die Abgabequittung und lassen Sie sie unterschreiben.
          </li>
          <li>
            Bei der Rückgabe: <Ui>Rücknahme</Ui>, Zustand des Funkgeräts,
            Zubehör zurückgegeben oder nicht.
          </li>
        </Steps>
        <H>Die Verbindungen kontrollieren</H>
        <p>
          Erfassen Sie für jede Station die Verständlichkeit:{" "}
          <strong>THREE</strong> (gut), <strong>TWO</strong> (schwach, aber
          verständlich), <strong>ONE</strong> (ungenügend) oder keine
          Verbindung. Die <Ui>Gesamtkontrolle</Ui> ruft alle Stationen der Reihe
          nach auf, ein Klick pro Station.
        </p>
        <Note kind="info">
          Ein Rufname bezeichnet <strong>eine Funktion, nie eine Person</strong>
          . Wird jemand abgelöst, bleibt der Rufname.
        </Note>
      </>
    ),
    full: (
      <>
        <H>Gesprächsgruppen und Kanäle</H>
        <Table
          head={["Feld", "Detail"]}
          rows={[
            [
              "Nr.",
              "Z. B. G101 (Gesprächsgruppe), D481 (Direktmodus), R395 (Relais)",
            ],
            ["Modus", "Gruppe (TKG), Direkt (DMO), Relais"],
            ["Bezeichnung", "Z. B. « ZS Führung »"],
            [
              "Verwendung",
              "Führung, Einsatz, Logistik, Koordination, Aufruf, Reserve",
            ],
          ]}
        />
        <p>
          Eine Gesprächsgruppe, die von einer Verbindungskontrolle verwendet
          wird, kann nicht gelöscht werden.
        </p>
        <H>Rufnamen</H>
        <p>
          Rufname (eindeutig), Funktion, Sektion, Hauptgruppe, Ausweichgruppe,
          Bemerkungen. Das <strong>Verbindungsschema</strong> zeigt pro
          Gesprächsgruppe eine Spalte mit ihren Stationen: grüne Anzeige, wenn
          ihnen ein Funkgerät abgegeben ist, Note der letzten Kontrolle, und
          gestrichelt die Stationen, die sie als Ausweichgruppe haben.
        </p>
        <H>Endgeräte</H>
        <Table
          head={["Feld", "Detail"]}
          rows={[
            ["Interne Nr.", "Z. B. R-01, eindeutig"],
            ["RFSI", "Polycom-Kennung des Endgeräts"],
            ["Modell", "TPH900, TPH700, TPM700, G2 Smart oder anderes"],
            ["Typ", "Handgerät, Fahrzeug, Fest"],
            ["Seriennummer", "Frei"],
            ["Zustand", "Einsatzbereit, Aufzuladen, Defekt, Fehlend"],
          ]}
        />
        <ul>
          <li>
            Ein Endgerät, das schon einmal abgegeben wurde, kann nicht gelöscht
            werden: Setzen Sie es auf Defekt oder Fehlend.
          </li>
          <li>
            <Ui>Nicht zurückgegeben</Ui> zeigt nur die Funkgeräte, die noch
            draussen sind: praktisch am Ende des Einsatzes.
          </li>
          <li>
            Ein Funkgerät, das seit <strong>8 Stunden oder mehr</strong>{" "}
            abgegeben ist, trägt das Badge <code>&gt; 8 h</code>: Denken Sie an
            den Akku.
          </li>
        </ul>
        <H>Abgabe und Rücknahme</H>
        <ul>
          <li>
            Abgabe: Endgerät, Zeit, Rufname (Funktion und Sektion werden
            ausgefüllt), Inhaber, Zubehör (Ersatzakku, Mikrotel, FUGA-Adapter,
            Ladegerät, Antenne, Tasche), Akkustand, Bemerkungen.
          </li>
          <li>
            Ein defektes oder fehlendes Funkgerät kann nicht abgegeben werden;
            ein bereits abgegebenes Funkgerät muss zuerst zurückgegeben werden.
          </li>
          <li>
            Rücknahme: Zeit, Zustand, vollständige Rückgabe oder nicht (sonst
            wird die Liste des abgegebenen Zubehörs erfasst). Bei einem
            fehlenden Funkgerät erscheint die Erinnerung, den Verlust zu melden,
            damit es gesperrt wird.
          </li>
          <li>
            Optionen: <Ui>Im Journal erfassen</Ui> (standardmässig aktiviert)
            und <Ui>Abgabequittung drucken</Ui>.
          </li>
          <li>
            Das Register <Ui>Abgaben</Ui> bewahrt die gesamte Historie.
          </li>
        </ul>
        <H>Abgabequittung A4</H>
        <p>
          Endgerät, Inhaber, Abgabe, Zubehör mit je einem Kästchen, Bereich für
          die Rücknahme und drei Unterschriften (Inhaber bei der Abgabe,
          Abgebender, Inhaber bei der Rückgabe).
        </p>
        <H>Gesamtkontrolle</H>
        <p>
          Wählen Sie die Gesprächsgruppe und klicken Sie dann für jede Station{" "}
          <Ui>3</Ui>, <Ui>2</Ui>, <Ui>1</Ui> oder <Ui>✕</Ui> (ein zweiter Klick
          macht es rückgängig). « Nicht im Netz » kennzeichnet eine Station ohne
          Funkgerät. <Ui>Speichern</Ui> erstellt eine Kontrolle pro bewerteter
          Station und auf Wunsch einen zusammenfassenden Eintrag im Journal
          (Priorität Wichtig, wenn eine Verbindung schlecht ist).
        </p>
        <H>QR-Etiketten und Scanner</H>
        <Steps>
          <li>
            <Ui>Etiketten</Ui>: A4-Bogen mit 21 Etiketten mit QR-Code, Nummer,
            Modell und RFSI. Kleben Sie auf jedes Funkgerät eine.
          </li>
          <li>
            <Ui>Scannen</Ui>: Die Kamera liest die Etikette. Oder scannen Sie
            mit der Kamera des Telefons, oder tippen Sie die Nummer ein (
            <code>R-04</code>).
          </li>
          <li>
            orion aic öffnet direkt die richtige Aktion: Rücknahme, wenn das
            Funkgerät draussen ist, Abgabe, wenn es verfügbar ist.
          </li>
        </Steps>
        <p>
          Die Kamera dient nur dazu, den Code zu lesen, auf dem Gerät selbst; es
          wird kein Bild gespeichert oder gesendet.
        </p>
        <H>Plan A4</H>
        <p>
          <Ui>Plan A4</Ui> druckt im Querformat den Netzplan, die
          Gesprächsgruppen, die Endgeräte, die Abgaben und die Kontrollen.
        </p>
        <Note kind="warn">
          Der Plan dokumentiert das Netz; er steuert die Funkgeräte nicht. Die
          echten Gruppennummern und RFSI stammen aus dem kantonalen Flottenplan.
          Diejenigen der Demonstration sind fiktiv.
        </Note>
      </>
    ),
  },
  {
    id: "contacts",
    group: "modules",
    ...mod("contacts", "Kontakte öffnen"),
    short: (
      <p>
        Das Verzeichnis des Ereignisses: Partner, Behörden, Lieferanten … und
        die Schweizer Notrufnummern mit einem Klick.
      </p>
    ),
    guide: (
      <>
        <H>Beginnen</H>
        <Steps>
          <li>
            Ein Klick fügt die <strong>Schweizer Notrufnummern</strong> hinzu.
          </li>
          <li>
            Fügen Sie Ihre Kontakte hinzu: Name, Organisation, Kategorie,
            Telefon, E-Mail … (nur der Name ist erforderlich).
          </li>
          <li>
            Markieren Sie die meistgebrauchten als Favoriten: Sie bleiben oben.
          </li>
          <li>
            Auf einem Telefon tippen Sie auf die Nummer, um anzurufen. Am
            Computer kopieren Sie sie mit einem Klick.
          </li>
        </Steps>
        <Table
          head={["Nummer", "Für"]}
          rows={[
            [<strong>112</strong>, "Europäische Notrufnummer"],
            [<strong>117</strong>, "Polizei"],
            [<strong>118</strong>, "Feuerwehr"],
            [<strong>144</strong>, "Sanität, medizinische Notfälle"],
            [<strong>1414</strong>, "Rega, Rettung per Helikopter"],
            [<strong>145</strong>, "Tox Info Suisse, Vergiftungen"],
            [<strong>143</strong>, "Die Dargebotene Hand, Hilfe am Telefon"],
          ]}
        />
      </>
    ),
    full: (
      <>
        <H>Details</H>
        <ul>
          <li>
            <strong>Importieren</strong> Sie Kontakte aus einer vCard-Datei (
            <code>.vcf</code>) oder CSV-Datei.
          </li>
          <li>
            <strong>Exportieren</strong> Sie das Verzeichnis als CSV, oder{" "}
            <strong>drucken</strong> Sie es in A4.
          </li>
          <li>Die vorgeschlagenen Kategorien stammen aus den Wertelisten.</li>
          <li>
            Ein Kontakt, dessen Name auch der Absender einer Meldung oder der
            Verantwortliche eines Auftrags ist, wird automatisch mit diesen
            verknüpft.
          </li>
        </ul>
        <Note kind="warn">
          Bei Lebensgefahr rufen Sie die Nummer direkt von einem Telefon aus an.
          orion aic hilft, sie zu finden, es ersetzt den Anruf nicht.
        </Note>
      </>
    ),
  },
  {
    id: "weather",
    group: "modules",
    ...mod("weather", "Wetter öffnen"),
    short: (
      <p>
        Das Wetter am Einsatzort: Prognosen von MeteoSchweiz, Beobachtungen vor
        Ort und Warnstufen.
      </p>
    ),
    guide: (
      <>
        <Steps>
          <li>
            <strong>Den Ort wählen</strong>: Suche, Kartenmitte oder Ihre
            Position.
          </li>
          <li>
            <strong>Die Prognose anfordern</strong>: Sie wird nur geladen, wenn
            Sie es wollen.
          </li>
          <li>
            Die <strong>Grafik über 48 Stunden</strong> (Temperatur, Regen,
            Wind) und die <strong>nächsten 3 Tage</strong> lesen.
          </li>
          <li>
            Eine <strong>Beobachtung vor Ort</strong> erfassen und sie bei
            Bedarf im Journal festhalten.
          </li>
          <li>
            Eine <strong>Warnung</strong> mit ihrer Stufe von 1 bis 5 erfassen.
          </li>
        </Steps>
        <Example>
          <p>
            Beobachtung um 16:20: « Anhaltender starker Regen, die Arve ist an
            der Brücke von Carouge innert einer Stunde um 20 cm gestiegen. » Im
            Journal erfasst, erscheint sie im nächsten Rapport.
          </p>
        </Example>
      </>
    ),
    full: (
      <>
        <H>Warnstufen</H>
        <Table
          head={["Stufe", "Bedeutung"]}
          rows={[
            ["1", "Keine oder geringe Gefahr"],
            ["2", "Mässige Gefahr"],
            ["3", "Erhebliche Gefahr"],
            ["4", "Grosse Gefahr"],
            ["5", "Sehr grosse Gefahr"],
          ]}
        />
        <H>Woher die Daten stammen</H>
        <ul>
          <li>
            Die Prognosen stammen aus dem Modell ICON von MeteoSchweiz, über den
            Dienst Open-Meteo. Nur die Koordinaten des Orts werden gesendet,
            nichts anderes.
          </li>
          <li>
            Ohne Internet keine Prognosen; die erfassten Beobachtungen und
            Warnungen bleiben verfügbar.
          </li>
          <li>
            Ein Link öffnet die Website von MeteoSchweiz für die offiziellen
            Warnungen.
          </li>
        </ul>
        <H>Erhaltene Prognosen: das Wetter von vorher</H>
        <ul>
          <li>
            Jede geladene Prognose wird{" "}
            <strong>in der Sitzung aufbewahrt</strong> (höchstens eine alle 5
            Minuten) und mit den synchronisierten Arbeitsplätzen geteilt: Der
            Bereich <Ui>Erhaltene Prognosen</Ui> listet sie auf, ein Klick zeigt
            diejenige der gewählten Zeit.
          </li>
          <li>
            In der <Ui>Zeitreise</Ui> zeigt das Wetter automatisch die letzte
            vor der angezeigten Zeit erhaltene Prognose: « um 14 Uhr waren 40 mm
            angesagt ».
          </li>
        </ul>
        <Note kind="warn">
          Die offiziellen Warnungen sind jene von MeteoSchweiz und der Behörden.
          orion aic hilft, sie zu erfassen und zu teilen, es ersetzt sie nicht.
        </Note>
      </>
    ),
  },
  {
    id: "agenda",
    group: "modules",
    ...mod("agenda", "Agenda öffnen"),
    short: (
      <p>
        Der Führungsrhythmus: die nächsten Rapporte, Orientierungen und
        Ablösungen, mit einem Countdown, damit nichts vergessen geht.
      </p>
    ),
    guide: (
      <>
        <H>Planen</H>
        <Steps>
          <li>
            Fügen Sie einen Termin hinzu: einen Titel, einen Typ (Rapport,
            Orientierung, Ablösung …), eine Zeit. Ort und Bemerkungen sind
            freiwillig.
          </li>
          <li>
            Für einen wiederkehrenden Termin: <Ui>Rhythmus planen</Ui>, zum
            Beispiel ein Rapport alle 2 Stunden ab 08:00.
          </li>
          <li>Der Countdown erscheint hier und auf der Seite Lage.</li>
          <li>
            Sobald der Termin stattgefunden hat:{" "}
            <Ui>Als abgehalten markieren</Ui>, und ihn im Journal erfassen.
          </li>
        </Steps>
      </>
    ),
    full: (
      <>
        <H>Details</H>
        <ul>
          <li>Die vorgeschlagenen Termintypen stammen aus den Wertelisten.</li>
          <li>
            <strong>Druck</strong> der Agenda in A4, um sie an der Wand des KP
            aufzuhängen.
          </li>
          <li>
            Jeder Termin kann mit Personen, Posten oder Einträgen des Journals
            verknüpft werden.
          </li>
        </ul>
        <Example>
          <p>
            Rhythmus: Führungsrapport um 08:00, 10:00, 12:00 … Ablösung um
            18:00. Um 11:50 zeigt die Seite Lage « Führungsrapport in 10 Min. ».
          </p>
        </Example>
      </>
    ),
  },
  {
    id: "network",
    group: "modules",
    ...mod("network", "Beziehungsnetz öffnen"),
    short: (
      <p>
        Alle Informationen und ihre Verknüpfungen, gezeichnet wie ein neuronales
        Netz: Jeder Punkt ist ein Element, jede Linie eine Verknüpfung.
      </p>
    ),
    guide: (
      <>
        <Steps>
          <li>
            <strong>Fahren Sie</strong> mit der Maus über einen Punkt: Seine
            Nachbarn leuchten auf und eine Vorschau erscheint.
          </li>
          <li>
            <strong>Klicken Sie</strong>: Ein Bereich zeigt alle seine
            Verknüpfungen. Sie können welche hinzufügen oder entfernen.
          </li>
          <li>
            <strong>Filtern Sie</strong> nach Typ (Meldungen, Einträge, Mittel,
            Personen …), um klarer zu sehen.
          </li>
          <li>
            <strong>Suchen Sie</strong> ein Element nach seinem Namen, dann{" "}
            <Ui>Neu zentrieren</Ui>, um zur Gesamtansicht zurückzukehren.
          </li>
        </Steps>
      </>
    ),
    full: (
      <>
        <H>Wozu es dient</H>
        <ul>
          <li>
            Jede Farbe entspricht einem Elementtyp, überall in orion aic
            dieselbe.
          </li>
          <li>
            Erkennen, was im Zentrum des Ereignisses steht: ein Ort, der mit
            vielen Meldungen und Mitteln verknüpft ist.
          </li>
          <li>
            Erkennen, was isoliert ist: eine Meldung, die noch niemand mit etwas
            verknüpft hat.
          </li>
          <li>
            Der Graph bewegt sich sanft. Wenn die Animation stört:{" "}
            <Path
              steps={[
                "Einstellungen",
                "Dieser Arbeitsplatz",
                "Animationen",
                "Reduziert",
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
    ...mod("trace", "Nachvollziehbarkeit öffnen"),
    short: (
      <p>
        Wer hat was wann gemacht: Jede Erstellung, Änderung und Löschung wird
        mit Autor, Zeit und Details festgehalten. Nichts wird gelöscht. Man kann
        auch zwei Zeitpunkte vergleichen, die Momentaufnahmen wiederfinden und
        die Register der Exporte und Präsentationen einsehen.
      </p>
    ),
    guide: (
      <>
        <H>Herausfinden, wer was gemacht hat</H>
        <Steps>
          <li>
            Öffnen Sie <Ui>Verlauf</Ui> in der linken Leiste (oder <K>⌘K</K> → «
            Nachvollziehbarkeit »).
          </li>
          <li>
            Das Register <Ui>Wer hat was gemacht</Ui> listet alle Änderungen
            auf, von der neuesten zur ältesten, nach Stunde gruppiert.
          </li>
          <li>
            Filtern Sie: Klicken Sie auf eine <strong>Person</strong>, wählen
            Sie ein <strong>Modul</strong>, eine Aktionsart oder einen Zeitraum,
            oder tippen Sie ein Wort ein (einen Namen, einen Wert, einen Ort).
          </li>
          <li>
            Klicken Sie auf den Namen eines Elements, um es zu öffnen, oder auf{" "}
            <Ui>Einsatz zu diesem Zeitpunkt anzeigen</Ui>, um alles so zu sehen,
            wie es damals war.
          </li>
        </Steps>
        <H>Die Historie eines einzelnen Elements</H>
        <p>
          Jedes Datenblatt (Mittel, Meldung, Kartenobjekt, Person …) zeigt
          unten: « Erstellt von … am … · geändert von … vor 5 Min. ». Die
          Schaltfläche <Ui>Verlauf</Ui> öffnet alle seine Versionen, mit dem,
          was sich geändert hat (alter Wert durchgestrichen, neuer Wert
          hervorgehoben).
        </p>
        <Example>
          <p>
            Wer hat den KP Front verschoben? Öffnen Sie das Objekt auf der Karte
            → <Ui>Verlauf</Ui>: « Kartograf hat Position / Verlauf um 09:05
            geändert ».
          </p>
        </Example>
        <H>Eine frühere Version wiederherstellen</H>
        <p>
          Im Verlauf eines Elements setzt{" "}
          <Ui>Diese Version wiederherstellen</Ui> seine früheren Werte wieder
          ein. Auch ein gelöschtes Element kann so zurückkommen. Die
          Wiederherstellung wird selbst festgehalten, mit Ihrem Namen: Die
          Historie verliert nie etwas.
        </p>
      </>
    ),
    full: (
      <>
        <H>Was nachverfolgt wird</H>
        <ul>
          <li>
            Alles, was sich in orion aic ändern lässt: Journal (seine Versionen
            und Löschungen), Meldungen, Aufträge, Karte (Objekte, Karten, eigene
            Signaturen), Mittel, Team und Posten, Funknetz, Kontakte, Wetter
            (Beobachtungen, Warnungen, erhaltene Prognosen), Agenda,
            Schlüsselinformationen, Lagetafeln, Verknüpfungen, Wertelisten,
            Eigenschaften des Journals, Momentaufnahmen, Exporte und
            Präsentationen.
          </li>
          <li>
            « Wer » ist der auf dem Arbeitsplatz angegebene Operateurname (Menü
            oben rechts). Er ist nicht signiert: Jeder Arbeitsplatz muss seinen
            echten Namen oder seine Funktion verwenden.
          </li>
          <li>
            Mehrere kleine Korrekturen derselben Person am selben Element
            innerhalb von 20 Sekunden zählen als eine einzige Version.
          </li>
          <li>
            Die Historie reist mit der Sitzung: Sie wird zwischen den
            Arbeitsplätzen synchronisiert und ist im Archiv{" "}
            <code>.orionaic</code> enthalten.
          </li>
          <li>
            Daten, die vor dieser Version von orion aic erstellt wurden,
            behalten ihr Erstellungsdatum und ihre letzte Änderung; ihre
            vollständige Historie beginnt mit der nächsten Änderung.
          </li>
        </ul>
        <H>Die Register</H>
        <Table
          head={["Register", "Inhalt"]}
          rows={[
            [
              "Wer hat was gemacht",
              "Alle Änderungen, Filter nach Person, Modul, Aktion, Zeitraum, Suche",
            ],
            [
              "Vergleichen",
              "Was zwischen zwei Zeitpunkten hinzugefügt, geändert, gelöscht wurde, nach Modul; Karten nebeneinander; Druck",
            ],
            [
              "Momentaufnahmen",
              "Die benannten Zeitpunkte: ansehen, vergleichen, präsentieren, exportieren",
            ],
            [
              "Exporte",
              "Register der erzeugten Dateien: wer, wann, was, Fingerabdruck; ein Dokument prüfen",
            ],
            [
              "Präsentationen",
              "Wer hat präsentiert, wem, wann, welche Version",
            ],
          ]}
        />
      </>
    ),
  },
];
