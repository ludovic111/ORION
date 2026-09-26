import {
  BellRing,
  FileText,
  Gauge,
  Megaphone,
  UserCheck,
  Waypoints,
} from "lucide-react";
import { moduleInfo } from "../../../app/modules";
import type { Topic } from "../content";
import { Example, H, Note, States, Steps, Ui } from "../kit";

// Help pages of the conduct follow-up (German): checklists, requests for
// resources, presences and shifts, weather thresholds, Lagerapport, handover
// summary and reminders.

const checklists = moduleInfo("checklists");

/** Module topics, shown with the modules (after Missions). */
export const CONDUCT_MODULE_TOPICS: Topic[] = [
  {
    id: "checklists",
    group: "modules",
    module: "checklists",
    icon: checklists.icon,
    hue: checklists.hue,
    title: checklists.label,
    openLabel: "Checklisten öffnen",
    short: (
      <p>
        Eine Liste dessen, was man bei einer Ereignisart nicht vergessen darf:
        Hochwasser, Stromausfall, Hitzewelle, Chemieunfall, Sturm, Erdbeben,
        Personensuche, Aufnahme von Evakuierten, Bezug des KP. Man hakt laufend
        ab; das Journal hält fest, wer es wann getan hat.
      </p>
    ),
    guide: (
      <>
        <H>Eine Checkliste starten</H>
        <Steps>
          <li>
            <Ui>Checkliste starten</Ui>, dann wählen Sie die Ereignisart (zum
            Beispiel « Hochwasser / Überschwemmung »).
          </li>
          <li>
            Ändern Sie den Titel, wenn Sie wollen (« Hochwasser der Arve »).
          </li>
          <li>
            <Ui>Starten</Ui>: Die Checkliste erscheint mit allen ihren
            Schritten.
          </li>
        </Steps>
        <H>Einen Schritt abhaken</H>
        <Steps>
          <li>Haken Sie das Kästchen ab, wenn der Schritt erledigt ist.</li>
          <li>
            Wichtige Schritte werden auch im Journal eingetragen. Das kleine
            Heft rechts zeigt, ob das der Fall sein wird: Ein Klick ändert es
            vor dem Abhaken.
          </li>
          <li>
            Ein Schritt mit einem Timer (« Kontrolle 60 Min. danach ») erstellt
            einen Eintrag <Ui>Zu bearbeiten</Ui> mit einer Frist: In 60 Minuten
            muss kontrolliert werden. Ist er überfällig, wird er rot.
          </li>
        </Steps>
        <Example>
          <p>
            Um 09:40 hakt Wm Muller « Pegel und Abflüsse erfassen » ab. Das
            Journal erhält « Hochwasser der Arve: Pegel und Abflüsse erfassen.
            Kontrolle um 10:40 », mit der Funktion « Lageverfolgung ». Um 10:41
            ist der Punkt auf der Seite Lage überfällig.
          </p>
        </Example>
      </>
    ),
    full: (
      <>
        <H>Vorlagen</H>
        <ul>
          <li>
            Neun Vorlagen werden mitgeliefert. Jeder Schritt hat eine
            verantwortliche Funktion und, wo sinnvoll, einen Kontroll-Timer.
          </li>
          <li>
            <Ui>Bearbeiten</Ui> einer Standardvorlage: Ihre Änderungen gelten
            für dieses Journal (und die synchronisierten Arbeitsplätze).{" "}
            <Ui>Standardvorlage wiederherstellen</Ui> kehrt zur mitgelieferten
            Vorlage zurück.
          </li>
          <li>
            <Ui>Duplizieren</Ui>, um von einer Vorlage auszugehen;{" "}
            <Ui>Neue Vorlage</Ui> für eine eigene Liste; <Ui>Ausblenden</Ui>, um
            eine Vorlage aus der Auswahl zu entfernen.
          </li>
          <li>
            Eine gestartete Checkliste behält ihre Schritte: Eine spätere
            Änderung der Vorlage ändert sie nicht. Man kann auch die Checkliste
            selbst ändern (einen vergessenen Schritt hinzufügen).
          </li>
        </ul>
        <H>Verfolgung</H>
        <ul>
          <li>
            Die Seite Lage zeigt die laufenden Checklisten, den nächsten Schritt
            und die überfälligen Kontrollen.
          </li>
          <li>
            Zwei Arbeitsplätze können gleichzeitig abhaken: Jeder Schritt wird
            separat gespeichert, bei der Synchronisation geht nichts verloren.
          </li>
          <li>
            <Ui>Drucken</Ui> liefert die Checkliste auf Papier mit den Kästchen,
            der Zeit und wer abgehakt hat. <Ui>Checkliste abschliessen</Ui> legt
            sie unter « Abgeschlossene Checklisten » ab.
          </li>
        </ul>
        <Note kind="tip">
          Das Entfernen eines Hakens löscht den bereits ins Journal
          geschriebenen Eintrag nicht: Das Journal wird nie gelöscht.
        </Note>
      </>
    ),
  },
  {
    id: "requests",
    group: "modules",
    module: "resources",
    icon: Megaphone,
    hue: 18,
    title: "Mittelanforderungen",
    openLabel: "Mittel öffnen",
    short: (
      <p>
        Eine Mittelanforderung vom Anfang bis zum Ende verfolgen: angefordert,
        bewilligt oder abgelehnt, unterwegs, eingetroffen, dann entlassen. Jeder
        Schritt wird im Journal eingetragen; beim Eintreffen erscheint das
        Mittel in der Liste der Mittel.
      </p>
    ),
    guide: (
      <>
        <States
          steps={[
            "Angefordert",
            "Bewilligt",
            "Unterwegs",
            "Eingetroffen",
            "Entlassen",
          ]}
          extra={["Abgelehnt", "Annulliert"]}
        />
        <H>Eine Anforderung stellen</H>
        <Steps>
          <li>
            Mittel → Registerkarte <Ui>Anforderungen</Ui> →{" "}
            <Ui>Neue Anforderung</Ui> (oder die Schaltfläche{" "}
            <Ui>Mittel anfordern</Ui>).
          </li>
          <li>
            Geben Sie ein, was angefordert wird (« Stromaggregat 20 kVA »), die
            Menge, bei wem (Organisation) und, falls bekannt, die erwartete
            Ankunftszeit.
          </li>
          <li>
            <Ui>Anfordern</Ui>: Ein zu bearbeitender Eintrag « Anfrage » wird
            ins Journal geschrieben.
          </li>
        </Steps>
        <H>Verfolgen</H>
        <Steps>
          <li>
            Die Schaltflächen der Anforderung bringen sie weiter:{" "}
            <Ui>Bewilligt</Ui>, <Ui>Unterwegs</Ui>, <Ui>Ankunft</Ui> … Jeder
            Klick wird im Journal notiert (« Folge von #012 »).
          </li>
          <li>
            Ist die Ankunftszeit überschritten, wird die Anforderung rot, mit
            der Verspätung (« Verspätung 25 Min. »), hier und auf der Seite
            Lage.
          </li>
          <li>
            <Ui>Ankunft</Ui> erstellt das Mittel in der Liste (oder ordnet es
            einem bestehenden Mittel zu) und schliesst den Eintrag der
            Anforderung ab.
          </li>
        </Steps>
      </>
    ),
    full: (
      <>
        <ul>
          <li>
            Mittelarten, Organisationen und Einheiten stammen aus den
            Wertelisten; freier Text wird akzeptiert.
          </li>
          <li>
            Alles bleibt änderbar (Formular der Anforderung); der Zustand ändert
            sich nur über die Schaltflächen, damit der Verlauf stimmt.
          </li>
          <li>
            Die Anforderung ist mit ihrem Eintrag, ihren Folgeeinträgen und dem
            gelieferten Mittel verknüpft (Beziehungsnetz).
          </li>
          <li>
            <Ui>Drucken</Ui> liefert die A4-Tabelle aller Anforderungen.
          </li>
        </ul>
        <Note kind="info">
          « Im Journal erfassen » kann bei einem unwichtigen Schritt abgewählt
          werden; die Anforderung behält trotzdem die Zeit und den Urheber jedes
          Schritts.
        </Note>
      </>
    ),
  },
  {
    id: "presence",
    group: "modules",
    module: "team",
    icon: UserCheck,
    hue: 330,
    title: "Anwesenheit und Ablösung",
    openLabel: "Team öffnen",
    short: (
      <p>
        Wer ist im KP, seit wann, und wer übernimmt die Ablösung. Man erfasst
        Ankunft und Abgang per Schaltfläche oder durch Scannen eines QR-Badges;
        die Anwendung warnt, wenn jemand zu lange arbeitet oder zu wenig
        geschlafen hat.
      </p>
    ),
    guide: (
      <>
        <H>Erfassen</H>
        <Steps>
          <li>
            Team → Ansicht <Ui>Anwesenheiten</Ui>.
          </li>
          <li>
            <Ui>Ankunft</Ui>, wenn die Person ankommt, <Ui>Abgang</Ui>, wenn sie
            geht. Die Dienstzeit wird rechts angezeigt.
          </li>
          <li>
            Schneller: <Ui>QR-Badges</Ui> druckt einen Badge pro Person; beim
            Eingang erfasst <Ui>Badge scannen</Ui> die Ankunft (oder den Abgang,
            wenn die Person bereits da ist).
          </li>
        </Steps>
        <H>Ablösungsplan</H>
        <Steps>
          <li>
            <Ui>Planen</Ui>: Beginnzeit, Dauer, Anzahl Ablösungen (zum Beispiel
            3 Ablösungen zu 8 Stunden).
          </li>
          <li>Öffnen Sie jede Ablösung und wählen Sie die Personen.</li>
          <li>
            Eine Person, die zu lange am Stück eingeplant ist oder zu wenig Ruhe
            zwischen zwei Ablösungen hat, wird rot markiert.
          </li>
        </Steps>
        <Example>
          <p>
            Fw Gilliéron ist gestern um 21:00 eingetroffen. Um 09:30 zeigt die
            Seite « Im Dienst seit 12 h 30 am Stück (Maximum 12 h) » an: Er muss
            abgelöst werden.
          </p>
        </Example>
      </>
    ),
    full: (
      <>
        <ul>
          <li>
            Maximale Dienstzeit (standardmässig 12 h) und minimale Ruhezeit (8
            h) werden unten im Ablösungsplan eingestellt, für das ganze Journal.
          </li>
          <li>
            Eine Pause, die kürzer als die minimale Ruhezeit ist, setzt den
            Zähler nicht auf null: Die Stunden zählen weiter, und die zu kurze
            Ruhe wird gemeldet.
          </li>
          <li>
            Die Dauern sind echte Stunden, auch in der Nacht der Zeitumstellung
            (eine Herbstnacht 20:00–08:00 zählt 13 Stunden).
          </li>
          <li>
            <Ui>Anwesenheitsliste</Ui> druckt die Anwesenden (mit einer
            Unterschriftenspalte), alle Ankünfte und Abgänge und den
            Ablösungsplan.
          </li>
          <li>
            Ein mit der Kamera eines Telefons gescannter Badge öffnet orion aic
            beim Erfassen dieser Person; es genügt zu bestätigen.
          </li>
        </ul>
        <Note kind="info">
          Das Erfassen einer Ankunft setzt die Person im Organigramm auf «
          Anwesend »; das Erfassen des Abgangs setzt sie auf « Abgelöst ».
        </Note>
      </>
    ),
  },
  {
    id: "thresholds",
    group: "modules",
    module: "weather",
    icon: Gauge,
    hue: 38,
    title: "Wetterschwellen",
    openLabel: "Wetter öffnen",
    short: (
      <p>
        Für Ihre Region gewählte Grenzwerte (Böen, Regen, Hitze, Kälte). Wenn
        die Prognose sie überschreitet, wird automatisch eine Warnung erstellt
        und, wenn Sie wollen, ein zu bearbeitender Eintrag im Journal.
      </p>
    ),
    guide: (
      <>
        <Steps>
          <li>
            Wetter → <Ui>Wetterschwellen</Ui> →{" "}
            <Ui>Standardschwellen hinzufügen</Ui> oder <Ui>Schwelle</Ui>.
          </li>
          <li>
            Wählen Sie die Grösse (Böen in km/h, Regen in 1 h oder in 24 h,
            Höchst- oder Tiefsttemperatur), den Wert und die Stufe der zu
            erstellenden Warnung.
          </li>
          <li>
            Bei jeder empfangenen Prognose werden die Schwellen für die nächsten
            48 Stunden geprüft. Die Zeile der Schwelle zeigt, ob sie
            überschritten wird und wann.
          </li>
        </Steps>
        <Example>
          <p>
            Schwelle « Regen in 1 h ≥ 6 mm ». Die Prognose von 14:00 sagt 7 mm
            um 20:00 voraus: Die Warnung « Starkregen an der Arve » erscheint im
            Wetter, und der Eintrag « Wetterschwelle überschritten … » ist zu
            bearbeiten.
          </p>
        </Example>
      </>
    ),
    full: (
      <>
        <ul>
          <li>
            Nur eine Warnung pro Schwelle und pro Tag, auch wenn die Prognose
            mehrmals neu geladen wird oder mehrere Arbeitsplätze sie empfangen:
            Sie erstellen dieselbe Warnung, die nur einmal erscheint.
          </li>
          <li>
            Eine gelöschte Warnung wird für diesen Tag nicht neu erstellt.
          </li>
          <li>
            Der Pegel der Gewässer ist nicht Teil der Prognose (Open Meteo,
            kostenlos): Erfassen Sie Hochwasserwarnungen von Hand.
          </li>
        </ul>
      </>
    ),
  },
];

/** Topics about working together (after the exports). */
export const CONDUCT_TOGETHER_TOPICS: Topic[] = [
  {
    id: "situation-point",
    group: "together",
    module: "situation",
    icon: FileText,
    hue: 250,
    title: "Vorbereiteter Lagerapport",
    openLabel: "Lage öffnen",
    short: (
      <p>
        Vor einem Führungsrapport bereitet orion aic einen Entwurf des
        Lagerapports vor, mit dem, was es bereits weiss. Sie lesen ihn durch,
        korrigieren ihn und drucken ihn dann oder schreiben ihn ins Journal.
      </p>
    ),
    guide: (
      <Steps>
        <li>
          Lage → <Ui>Lagerapport</Ui>, oder in der Agenda das Dokumentsymbol
          neben einem Führungsrapport.
        </li>
        <li>
          Der Entwurf enthält: allgemeine Lage, Schlüsselinformationen, was seit
          dem letzten Rapport geschehen ist, eingesetzte Mittel, offene und
          überfällige Aufträge, Checklisten, Mittelanforderungen, Wetter,
          Personal, nächster Rapport.
        </li>
        <li>
          Korrigieren Sie jede Rubrik; ergänzen Sie « Bedürfnisse und Entscheide
          ».
        </li>
        <li>
          <Ui>Drucken</Ui>, <Ui>Im Journal erfassen</Ui>,{" "}
          <Ui>Als Lagetafel speichern</Ui> oder{" "}
          <Ui>Momentaufnahme erstellen</Ui>.
        </li>
      </Steps>
    ),
    full: (
      <ul>
        <li>
          Nichts wird erfunden: Jede Zeile stammt aus dem Journal (keine
          künstliche Intelligenz).
        </li>
        <li>
          « Seit » geht von der Zeit des letzten Rapports aus; man kann sie
          ändern, der Entwurf wird dann neu erstellt.
        </li>
        <li>
          Der Entwurf ändert sich nicht mehr, während Sie ihn bearbeiten;{" "}
          <Ui>Entwurf neu erstellen</Ui> übernimmt den aktuellen Stand.
        </li>
      </ul>
    ),
  },
  {
    id: "handover-summary",
    group: "together",
    icon: Waypoints,
    hue: 212,
    title: "Zusammenfassung der Ablösung",
    short: (
      <p>
        « Was ist seit 14:00 geschehen? »: Das Fenster Ablösung berechnet die
        Antwort aus dem Verlauf: neue Einträge, Entscheide, Meldungen, offene
        und abgeschlossene Aufträge, Mittel, Anforderungen, abgehakte Schritte,
        Warnungen, Verspätungen.
      </p>
    ),
    guide: (
      <Steps>
        <li>
          Journal → Schaltfläche <Ui>Ablösung</Ui> (oder ⌘K « Ablösung »).
        </li>
        <li>
          Wählen Sie die Zeit « Seit » (standardmässig: die letzte erfasste
          Ablösung, sonst 8 Stunden).
        </li>
        <li>
          Ein Klick auf eine Zeile öffnet das Element.{" "}
          <Ui>Zusammenfassung drucken</Ui> oder <Ui>Kopieren</Ui>.
        </li>
        <li>
          <Ui>Mit Zusammenfassung erfassen</Ui> schreibt die Ablösung mit dieser
          Zusammenfassung ins Journal.
        </li>
      </Steps>
    ),
    full: (
      <p>
        Die Berechnung ist bei gleichen Daten immer gleich: Zwei Arbeitsplätze
        erhalten dieselbe Zusammenfassung. Sie stammt aus dem Verlauf jedes
        Elements (Zustand vorher, Zustand nachher), deshalb erscheint sogar ein
        Mittel darin, das von « Alarmiert » auf « Im Einsatz » gewechselt hat
        und dann gelöscht wurde.
      </p>
    ),
  },
  {
    id: "reminders",
    group: "together",
    module: "agenda",
    icon: BellRing,
    hue: 48,
    title: "Erinnerungen für Export und Druck",
    openLabel: "Agenda öffnen",
    short: (
      <p>
        Erinnerungen zu festen Zeiten: « alle 2 Stunden das Archiv exportieren
        », « 30 Minuten vor jedem Rapport die Lage drucken ». Die Erinnerung
        erscheint unten am Bildschirm mit der Schaltfläche, die die Aktion
        ausführt.
      </p>
    ),
    guide: (
      <Steps>
        <li>
          Agenda → <Ui>Erinnerungen für Export und Druck</Ui> →{" "}
          <Ui>Standarderinnerungen hinzufügen</Ui> (oder <Ui>Erinnerung</Ui>).
        </li>
        <li>
          Zur gegebenen Zeit erscheint ein Hinweisfeld:{" "}
          <Ui>Archiv exportieren</Ui>, <Ui>Lage drucken</Ui> oder{" "}
          <Ui>Lagerapport vorbereiten</Ui> mit einem Klick.
        </li>
        <li>
          <Ui>Erledigt</Ui> legt sie ab; die Uhr verschiebt sie um 15 Minuten.
        </li>
      </Steps>
    ),
    full: (
      <ul>
        <li>
          Kein Server: Die Erinnerung erscheint auf den Arbeitsplätzen, auf
          denen orion aic geöffnet ist.
        </li>
        <li>
          Ein Export oder ein Druck aus dem Exportzentrum wird im Exportregister
          (Nachvollziehbarkeit) eingetragen und gilt als erledigt.
        </li>
        <li>
          « Vor jedem Rapport » gilt für Termine, deren Art oder Titel « Rapport
          » enthält.
        </li>
      </ul>
    ),
  },
];
