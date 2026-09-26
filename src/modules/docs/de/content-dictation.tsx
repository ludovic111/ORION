import { Mic } from "lucide-react";
import type { Topic } from "../content";
import { Example, Faq, H, K, Note, Path, Steps, Table, Ui } from "../kit";

// « Spracheingabe » (German): speak instead of typing the text of an entry or
// a message. Recognition in Swiss German (de-CH), German voice commands.
export const DICTATION_TOPIC: Topic = {
  id: "dictation",
  group: "reference",
  title: "Spracheingabe",
  icon: Mic,
  hue: 20,
  short: (
    <p>
      Sprechen statt tippen: Der Text eines Journaleintrags oder einer Meldung
      schreibt sich von selbst. Die Spracheingabe ist anfangs ausgeschaltet; man
      schaltet sie auf jedem Arbeitsplatz ein, der sie braucht.
    </p>
  ),
  guide: (
    <>
      <H>Sie auf diesem Arbeitsplatz einschalten</H>
      <Steps>
        <li>
          Öffnen Sie <Path steps={["Einstellungen", "Dieser Arbeitsplatz"]} />.
        </li>
        <li>
          Aktivieren Sie unter <Ui>Spracheingabe</Ui> die Option{" "}
          <Ui>Meldungen per Mikrofon diktieren</Ui>.
        </li>
        <li>
          Ein kleines Mikrofon erscheint rechts neben dem Wort « Meldung » im
          neuen Journaleintrag und in der Erfassung der Meldungen.
        </li>
      </Steps>
      <Note kind="info">
        Zeigt die Rubrik « In diesem Browser nicht verfügbar » an, kann der
        Browser keine Sprache transkribieren (Firefox zum Beispiel). Chrome,
        Edge und Safari können es.
      </Note>
      <H>Diktieren</H>
      <Steps>
        <li>
          Klicken Sie in den Text, dorthin, wo die Wörter hinkommen sollen.
        </li>
        <li>
          Tippen Sie auf das Mikrofon. Beim ersten Mal fragt der Browser nach
          der Erlaubnis, das Mikrofon zu verwenden: Stimmen Sie zu.
        </li>
        <li>
          Der orange Punkt und « Hört zu … » zeigen, dass der Arbeitsplatz
          zuhört. Sprechen Sie normal auf Hochdeutsch; die Wörter, die gerade
          erkannt werden, erscheinen grau neben dem Mikrofon.
        </li>
        <li>
          Zum Beenden: Tippen Sie erneut auf das Mikrofon oder drücken Sie{" "}
          <K>Esc</K>. Ein Wechsel des Tabs oder das Schliessen des Formulars
          beendet das Zuhören ebenfalls.
        </li>
        <li>
          Lesen Sie durch, korrigieren Sie wenn nötig über die Tastatur, dann
          speichern Sie.
        </li>
      </Steps>
      <H>Die Befehle für die Satzzeichen</H>
      <p>
        Sagen Sie das Wort aus der linken Spalte, es wird durch das Zeichen
        ersetzt.
      </p>
      <Table
        head={["Sie sagen", "Sie erhalten"]}
        rows={[
          ["« Punkt »", "."],
          ["« Komma »", ","],
          ["« Doppelpunkt »", ":"],
          ["« Semikolon » oder « Strichpunkt »", ";"],
          ["« Fragezeichen »", "?"],
          ["« Ausrufezeichen »", "!"],
          ["« neue Zeile » oder « Zeilenumbruch »", "einen Zeilenumbruch"],
          ["« neuer Absatz »", "eine Leerzeile"],
        ]}
      />
      <p>
        Nach einem Punkt, einem Fragezeichen oder einem Zeilenumbruch beginnt
        das nächste Wort mit einem Grossbuchstaben. « Der Punkt » oder « am
        Punkt » bleiben ausgeschrieben.
      </p>
      <Example>
        Sie sagen: « Pegel der Arve Doppelpunkt 3 Komma 2 Meter Punkt neue Zeile
        Brücke von Carouge gesperrt Punkt ». Der Text wird zu: « Pegel der Arve:
        3,2 Meter. » und dann, auf einer neuen Zeile, « Brücke von Carouge
        gesperrt. »
      </Example>
      <H>Wohin der Ton geht</H>
      <Note kind="warn">
        In Chrome und Edge wird der Ton zur Transkription an die Server von
        Google / Microsoft gesendet, und es braucht eine Internetverbindung.
        Safari kann je nach System auf dem Gerät transkribieren. Diktieren Sie
        keine vertraulichen Informationen, wenn dies nicht erlaubt ist.
      </Note>
      <p>
        orion aic empfängt und speichert keinen Ton: Nur der ins Feld
        geschriebene Text gehört zum Journal, als ob Sie ihn getippt hätten.
      </p>
    </>
  ),
  full: (
    <>
      <H>Wenn es nicht funktioniert</H>
      <Table
        head={["Meldung", "Was tun"]}
        rows={[
          [
            "Mikrofon verweigert",
            "Der Browser hat das Mikrofon für diese Website blockiert. Klicken Sie auf das Schloss links neben der Adresse und erlauben Sie das Mikrofon.",
          ],
          [
            "Keine Verbindung",
            "Chrome und Edge transkribieren über das Internet. Ohne Netz tippen Sie über die Tastatur.",
          ],
          [
            "Nichts gehört",
            "Der Arbeitsplatz hat keine Stimme gehört. Gehen Sie näher ans Mikrofon und versuchen Sie es erneut.",
          ],
          [
            "Kein Mikrofon gefunden",
            "Schliessen Sie ein Mikrofon oder ein Headset an und versuchen Sie es erneut.",
          ],
          [
            "Brave transkribiert keine Sprache",
            "Brave bietet diesen Dienst nicht an: Verwenden Sie zum Diktieren Chrome, Edge oder Safari.",
          ],
        ]}
      />
      <H>Gut zu wissen</H>
      <ul>
        <li>
          Die Einstellung gilt für jeden Arbeitsplatz einzeln: Ein Arbeitsplatz
          kann diktieren, der andere nicht. Sie wird nicht mitsynchronisiert.
        </li>
        <li>
          Die Sprache ist Deutsch (Schweiz), oder Deutsch (Deutschland), wenn
          der Browser nur diese Variante kennt. Sprechen Sie Hochdeutsch:
          Mundart wird nicht zuverlässig erkannt.
        </li>
        <li>
          Auf einem Android-Telefon nimmt jedes Tippen auf das Mikrofon einen
          Satz auf.
        </li>
        <li>
          Starke Hintergrundgeräusche (Sirene, Funk) stören die Erkennung: Lesen
          Sie vor dem Speichern immer durch.
        </li>
      </ul>
      <Faq q="Nimmt die Spracheingabe meine Stimme auf?">
        Nein. orion aic behält nur den Text. Der Ton wird vom Browser
        verarbeitet, und in Chrome oder Edge von den Servern von Google oder
        Microsoft.
      </Faq>
      <Faq q="Kann ich offline diktieren?">
        In Chrome und Edge nicht. Safari kann je nach Systemversion manchmal auf
        dem Gerät transkribieren.
      </Faq>
    </>
  ),
};
