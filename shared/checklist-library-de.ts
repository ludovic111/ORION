import type { LocalizedTemplate } from "./checklist-library.ts";

// Built-in checklists in German (Swiss civil protection). Same keys and the
// same steps, in the same order, as the French lists of checklist-library.ts:
// step n here is step n there (id, function, timer and journal flag come
// from the French list; the event type and the functions are the German
// référentiel values of shared/i18n/seeds.ts).

export const TEMPLATES_DE: Record<string, LocalizedTemplate> = {
  "ouverture-pc": {
    name: "Bezug des KP",
    description:
      "Von der Alarmierung bis zum ersten Lagerapport: Räumlichkeiten, Energie, Verbindungen, Funktionen, Meldungen.",
    steps: [
      "Alarmierung quittieren: Zeit, Herkunft (Einsatzzentrale, kantonale Alarmstelle, Gemeinde), erhaltener Auftrag",
      "Einsatzjournal eröffnen und das Aufgebot festhalten",
      "KP-Räumlichkeiten kontrollieren: Zugang, Strom, Lüftung, Heizung, Wasser, sanitäre Anlagen",
      "Notstromversorgung (Aggregat, USV) in Betrieb nehmen und die Umschaltung testen",
      "Arbeitsplätze, Drucker, Netzwerk und Synchronisation zwischen den Arbeitsplätzen in Betrieb nehmen",
      "Polycom-Funkgeräte in Betrieb nehmen, Verbindungskontrolle mit der Einsatzzentrale und den Eingesetzten",
      "Festnetz- und Mobiltelefonie testen, Telefonnummern des KP bekannt geben",
      "Lagekarte, Lagetafeln und Führungsrhythmus aushängen",
      "Präsenzliste erstellen und Funktionen zuteilen (Führung, Journal, Funk, Lage)",
      "Bezug des KP melden (Zeit, Nummern, Rufname): Polizei, Feuerwehr, Sanität, Gemeinde, Kanton",
      "Zeitpunkt des ersten Führungsrapports und den Führungsrhythmus festlegen",
      "Verpflegung und Ablösungsplan organisieren, falls der Einsatz länger als 12 h dauert",
      "Erster Lagerapport an den Einsatzleiter",
    ],
  },
  crue: {
    name: "Hochwasser / Überschwemmung",
    description:
      "Pegelstände verfolgen, gefährdete Gebiete schützen, Ufer sperren, Evakuierung vorbereiten.",
    steps: [
      "Pegelstände und Abflussmengen (Hydrologie BAFU, kantonale Messstationen) sowie deren Prognose erfassen",
      "Hochwasser- und Regenwarnungen (MeteoSchweiz, BAFU) mit ihrer Gefahrenstufe unter Wetter eintragen",
      "Gefährdete Gebiete und sensible Objekte (Alters- und Pflegeheime, Schulen, Campingplätze, Tiefgaragen) auf der Karte markieren",
      "Mit Feuerwehr und Polizei koordinieren: Sektoren, Zufahrten, Umleitungen",
      "Erkundung von Brücken, Dämmen und Unterführungen befehlen, mit Zeitpunkt der Rückmeldung",
      "Sandsäcke, Motorpumpen und mobile Hochwasserschutzelemente anfordern und zuführen",
      "Ufer, Stege und überflutungsgefährdete Strassen sperren lassen (Absperrungen, Signalisation)",
      "Präventive Evakuierung von Personen und Tieren aus der roten Zone vorbereiten, mit Betreuungsort",
      "Bevölkerung informieren: Verhaltensanweisungen, zu meidende Gebiete (Gemeinde, Alertswiss, Medien)",
      "Mit den Betreibern ARA, Pumpwerke und Transformatorenstationen schützen",
      "Pegelentwicklung an jedem Rapport kontrollieren; Rückgang und Auspumpen der Keller vorsehen",
      "Ablösung der eingesetzten Mannschaften planen",
    ],
  },
  blackout: {
    name: "Stromausfall / Blackout",
    description:
      "KP mit Notstrom betreiben, abhängige Personen schützen, ohne Netz informieren.",
    steps: [
      "Beim Netzbetreiber Ausmass und voraussichtliche Dauer des Ausfalls einholen",
      "KP auf Notstrom umstellen und die Treibstoffautonomie notieren",
      "Verbindungen auf Polycom (und Satellitentelefon) umstellen, falls das Mobilfunknetz ausfällt",
      "Notfalltreffpunkte der Gemeinde aktivieren",
      "Von medizinischen Geräten abhängige Personen sowie Alters- und Pflegeheime erfassen; Stromversorgung oder Evakuierung",
      "Treibstoff für die Notstromaggregate sicherstellen (Spital, Heime, ARA, Trinkwasser)",
      "Mit der Wasserversorgung die Trinkwasserverteilung und die Pumpwerke überprüfen",
      "Bevölkerung mit Lautsprechern, Plakaten und batteriebetriebenem Radio informieren",
      "Sensible Punkte patrouillieren: steckengebliebene Lifte, Tunnel, Kreuzungen",
      "Beheizte Räume vorsehen, falls der Ausfall bei Kälte andauert",
      "Mit dem Netzbetreiber die schrittweise Wiederherstellung der Stromversorgung vorbereiten",
    ],
  },
  canicule: {
    name: "Hitzewelle",
    description:
      "Alleinstehende verletzliche Personen schützen, kühle Orte öffnen, Arbeit der Eingesetzten anpassen.",
    steps: [
      "Hitzewarnung von MeteoSchweiz verfolgen (Gefahrenstufe, Nachttemperaturen)",
      "Kantonalen Hitzeplan mit dem Kantonsarzt aktivieren",
      "Alleinstehende verletzliche Personen erfassen (Listen der Gemeinden, Spitex)",
      "Tägliche Anrufe oder Besuche bei alleinstehenden Personen organisieren",
      "Gekühlte Räume und Wasserstellen öffnen, Adressen bekannt geben",
      "Bevölkerung informieren: viel trinken, kühl bleiben, keine Kinder oder Tiere im Auto lassen",
      "Arbeit der Schutzdienstpflichtigen anpassen: kühle Tageszeiten, Pausen, Wasser, Sonnenschutz",
      "Hitzebedingte Einsätze mit der Sanität (144) koordinieren",
      "Waldbrandgefahr und Feuerverbote überwachen",
      "Tagesbilanz festhalten: Besuche, Einsätze, Vorfälle",
    ],
  },
  abc: {
    name: "Chemieunfall / ABC",
    description:
      "Perimeter, Wind, Schutz der Bevölkerung in Gebäuden, Dekontamination, Entwarnung.",
    steps: [
      "Stoff (UN-Nummer, Sicherheitsdatenblatt), Menge und genauen Ort festhalten",
      "Windrichtung und Windgeschwindigkeit erfassen; den windabwärts liegenden Sektor auf der Karte einzeichnen",
      "Den vom Einsatzleiter Feuerwehr / Chemiewehr festgelegten Perimeter durchsetzen",
      "Verhaltensanweisung an die Bevölkerung: im Haus bleiben, Türen und Fenster schliessen, Lüftung abstellen",
      "Tox Info Suisse (145), den Kantonschemiker und bei Bedarf die ABC-Zentrale informieren",
      "Mit der Sanität einen Dekontaminationsplatz und eine Betreuungsstelle für Betroffene vorbereiten",
      "Zufahrten und Fluchtwege ausserhalb der Wolke festlegen, Strassen sperren lassen",
      "Schutz und Ablösung der Eingesetzten kontrollieren (Atemschutzgeräte, Kontamination)",
      "Entwicklung der Wolke oder der Verschmutzung messen lassen",
      "Aufhebung der Massnahmen und Entwarnung der Bevölkerung vorbereiten",
    ],
  },
  tempete: {
    name: "Sturm",
    description:
      "Exponiertes sperren, prioritäre Achsen räumen, Schäden erfassen.",
    steps: [
      "Windwarnung von MeteoSchweiz und erwartete Böen verfolgen (Wetter → Schwellenwerte)",
      "Parks, Wälder, Veranstaltungen im Freien und exponierte Baustellen schliessen lassen",
      "Räumungsteams vorbereiten: Motorsägen, Astschnitt, Blachen",
      "Mit der Feuerwehr die Prioritäten festlegen: Hauptachsen, Zufahrten zu Spitälern, Stromleitungen",
      "Gesperrte Strassen, umgestürzte Bäume und beschädigte Dächer auf der Karte eintragen",
      "Bevölkerung informieren: Wälder und Ufer meiden, Gegenstände sichern oder hereinholen",
      "Verankerung der Zelte und Einsatzinstallationen kontrollieren",
      "Schadenbilanz nach dem Durchzug und Prioritäten der Instandstellung",
    ],
  },
  seisme: {
    name: "Erdbeben",
    description:
      "Sicherheit des KP, Verbindungen, Schadentriage, Rettung, Notunterkünfte.",
    steps: [
      "Zeit, Magnitude und Epizentrum festhalten (Schweizerischer Erdbebendienst)",
      "KP (Risse, Gas, Strom) und Sicherheit des Teams überprüfen; KP bei Bedarf verlegen",
      "Polycom-Verbindungen mit Gemeinden und Partnern herstellen; Schadenmeldungen erfassen",
      "Spitäler, Schulen, Alters- und Pflegeheime, Brücken und Hauptleitungen erkunden",
      "Schäden auf der Karte triagieren: eingestürzt, beschädigt, intakt",
      "Suche und Rettung (Feuerwehr, Rettungsdienste, Hunde) an den Schadenplätzen koordinieren",
      "Betreuungsstellen und Notunterkünfte für Obdachlose öffnen",
      "Bevölkerung informieren: Nachbeben, keine beschädigten Gebäude betreten",
      "Beurteilung der Gebäude durch Ingenieure anfordern",
      "Verstärkung (Kanton, Armee) vorbereiten, falls die eigenen Mittel nicht ausreichen",
    ],
  },
  recherche: {
    name: "Personensuche",
    description:
      "Signalement, Sektoren, Teams, Übersicht der abgesuchten Gebiete, zur Unterstützung der Polizei.",
    steps: [
      "Signalement festhalten: Name, Alter, Beschreibung, Kleidung, Gesundheit, letzter Ort und Zeitpunkt",
      "Mit der Polizei klären, wer die Suche leitet und welche Rolle der Zivilschutz hat",
      "Suchsektoren, deren Priorität und Verantwortliche auf der Karte festlegen",
      "Teams einsetzen (Bestand, Funk, Rufname) und Zeitpunkt der Rückmeldung festlegen",
      "Übersicht der abgesuchten und noch abzusuchenden Sektoren führen",
      "Sammelplatz, Registrierung der Freiwilligen und Verpflegung organisieren",
      "Suchhunde, Drohne und Helikopter koordinieren (Polizei, Rega)",
      "Jeden Hinweis sofort der Polizei melden, ohne ihn zu bewegen",
      "Ablösung der Teams; Ende der Suche auf Entscheid der Polizei",
    ],
  },
  accueil: {
    name: "Betreuung evakuierter Personen",
    description:
      "Notunterkunft: Ort öffnen, registrieren, unterbringen, verpflegen, informieren.",
    steps: [
      "Anzahl Personen, ihre Bedürfnisse (Mobilität, Medikamente, Tiere) und Ankunftszeit in Erfahrung bringen",
      "Betreuungsort (Schutzanlage, Halle) öffnen: Schlüssel, Strom, Heizung, sanitäre Anlagen",
      "Registrierung einrichten: Namensliste, Herkunft, Kontakt",
      "Schlafplätze, Decken, Mahlzeiten und Wasser organisieren",
      "Sanitätsdienstliche und psychologische Betreuung vorsehen (Sanität, Care Team)",
      "Haustiere betreuen oder in Obhut geben",
      "Betreute Personen informieren: voraussichtliche Dauer, Regeln, Kontakte",
      "Listen an Polizei und Gemeinde übermitteln (Auskunft an Angehörige)",
      "Anzahl der untergebrachten Personen nachführen (Schlüsselinformationen)",
      "Ablösung des Betreuungspersonals und Rückkehr der Personen planen",
    ],
  },
};
