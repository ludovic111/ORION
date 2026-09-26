import { translator, type Dict } from "../../shared/i18n/core.ts";
import { dict as scenario } from "../../shared/i18n/scenario.ts";

// Data of the demonstration written by src/journal/demo-logistics.ts and
// src/journal/demo-conduct.ts (checklists, requests, presences, orders,
// diffusions), in the language of the post when the demonstration is
// generated. Names shared with the scenario and the demonstration journal
// (resources, places, authors) come from shared/i18n/scenario.ts; person
// names and Geneva places stay as they are; référentiel values follow
// shared/i18n/seeds.ts.

export const { t, dict } = translator({
  ...scenario,
  // ---------- Checklists, requests, presences (demo-logistics) ----------
  "Plt Fictive Bernasconi": {
    de: "Oblt Fictive Bernasconi",
    it: "I ten Fictive Bernasconi",
  },
  "Ouverture du PC Carouge": {
    de: "Bezug des KP Carouge",
    it: "Apertura del PC Carouge",
  },
  "Arve · Carouge et Acacias": {
    de: "Arve · Carouge und Acacias",
    it: "Arve · Carouge e Acacias",
  },
  Matériel: { de: "Material", it: "Materiale" },
  "Engin spécial": { de: "Spezialfahrzeug", it: "Mezzo speciale" },
  Hébergement: { de: "Unterkunft", it: "Alloggio" },
  "Arsenal cantonal (fictif)": {
    de: "Kantonales Zeughaus (fiktiv)",
    it: "Arsenale cantonale (fittizio)",
  },
  "Préposé au matériel": { de: "Materialwart", it: "Addetto al materiale" },
  "Protéger les bâtiments du quai Charles-Page.": {
    de: "Die Gebäude am Quai Charles-Page schützen.",
    it: "Proteggere gli edifici del quai Charles-Page.",
  },
  "Groupe électrogène 20 kVA": {
    de: "Stromaggregat 20 kVA",
    it: "Gruppo elettrogeno 20 kVA",
  },
  "Cellule télématique": { de: "Zelle Telematik", it: "Cellula telematica" },
  Canton: { de: "Kanton", it: "Cantone" },
  "Centrale cantonale d’engagement (fictif)": {
    de: "Kantonale Einsatzzentrale (fiktiv)",
    it: "Centrale cantonale d’intervento (fittizia)",
  },
  "Secours électrique du PC si le quai est coupé.": {
    de: "Notstrom für den KP, falls der Quai abgeschnitten ist.",
    it: "Alimentazione d’emergenza del PC se il quai è isolato.",
  },
  "Départ de l’arsenal, trafic ralenti route de Saint-Julien.": {
    de: "Abfahrt vom Zeughaus, stockender Verkehr auf der Route de Saint-Julien.",
    it: "Partenza dall’arsenale, traffico rallentato sulla route de Saint-Julien.",
  },
  "Tentes de 40 places": {
    de: "Zelte für 40 Personen",
    it: "Tende da 40 posti",
  },
  Armée: { de: "Armee", it: "Esercito" },
  "Accueil des évacués du quai si la salle communale ne suffit pas.": {
    de: "Aufnahme der Evakuierten vom Quai, falls der Gemeindesaal nicht ausreicht.",
    it: "Accoglienza degli evacuati del quai se la sala comunale non basta.",
  },
  "Salle communale suffisante (40 places), demande retirée.": {
    de: "Gemeindesaal ausreichend (40 Plätze), Anforderung zurückgezogen.",
    it: "Sala comunale sufficiente (40 posti), richiesta ritirata.",
  },
  "Pompes immergées": { de: "Tauchpumpen", it: "Pompe sommerse" },
  pce: { de: "Stk.", it: "pz." },
  "Pompiers (SIS)": { de: "Feuerwehr", it: "Pompieri" },
  "Protection civile": { de: "Zivilschutz", it: "Protezione civile" },
  "Caves inondées : relayer la tonne-pompe.": {
    de: "Überflutete Keller: das Tanklöschfahrzeug ablösen.",
    it: "Cantine allagate: dare il cambio all’autobotte.",
  },
  "Relève jour": { de: "Ablösung Tag", it: "Avvicendamento giorno" },
  "Relève nuit": { de: "Ablösung Nacht", it: "Avvicendamento notte" },
  "Section appui (réserve) : 2 chefs de groupe": {
    de: "Unterstützungszug (Reserve): 2 Gruppenführer",
    it: "Sezione appoggio (riserva): 2 capigruppo",
  },
  "Fictif A enchaîne deux relèves : à corriger.": {
    de: "Fictif A leistet zwei Ablösungen hintereinander: korrigieren.",
    it: "Fictif A copre due avvicendamenti di fila: da correggere.",
  },
  Genève: { de: "Genf", it: "Ginevra" },
  "Pluie intense sur l’Arve": {
    de: "Starkregen an der Arve",
    it: "Pioggia intensa sull’Arve",
  },
  "Exporter l’archive chiffrée": {
    de: "Verschlüsseltes Archiv exportieren",
    it: "Esportare l’archivio cifrato",
  },
  "Une archive .orionaic sur la clé du PC arrière.": {
    de: "Ein .orionaic-Archiv auf dem USB-Stick des KP Rück.",
    it: "Un archivio .orionaic sulla chiavetta del PC arretrato.",
  },
  "Imprimer la situation pour le rapport": {
    de: "Lage für den Rapport drucken",
    it: "Stampare la situazione per il rapporto",
  },
  "Préparer le point de situation": {
    de: "Lagerapport vorbereiten",
    it: "Preparare il punto della situazione",
  },

  // ---------- Orders and diffusions (demo-conduct) ----------
  "Ordre n° 1 émis : Ordre d’engagement · crue de l’Arve": {
    de: "Befehl Nr. 1 erlassen: Einsatzbefehl · Hochwasser der Arve",
    it: "Ordine n. 1 emanato: Ordine d’impiego · piena dell’Arve",
  },
  "Chef situation, Logistique, Télématique, PC front": {
    de: "Chef Lage, Logistik, Telematik, KP Front",
    it: "Capo situazione, Logistica, Telematica, PC avanzato",
  },
  "Fermer les accès aux berges, protéger le quai Charles-Page, garder une réserve alertée.":
    {
      de: "Zugänge zu den Ufern sperren, den Quai Charles-Page schützen, eine Reserve in Bereitschaft halten.",
      it: "Chiudere gli accessi alle sponde, proteggere il quai Charles-Page, tenere una riserva allertata.",
    },
  "Chef situation": { de: "Chef Lage", it: "Capo situazione" },
  Télématique: { de: "Telematik", it: "Telematica" },
  "Personnel / admin": {
    de: "Personal / Administration",
    it: "Personale / amministrazione",
  },
  "Ordre d’engagement": { de: "Einsatzbefehl", it: "Ordine d’impiego" },
  "Ordre complémentaire": {
    de: "Ergänzungsbefehl",
    it: "Ordine complementare",
  },
  "Ordre d’engagement · crue de l’Arve": {
    de: "Einsatzbefehl · Hochwasser der Arve",
    it: "Ordine d’impiego · piena dell’Arve",
  },
  "SIS Carouge engagé au pont des Acacias. Police : bouclage route de Veyrier.":
    {
      de: "Feuerwehr SIS Carouge im Einsatz beim Pont des Acacias. Polizei: Absperrung Route de Veyrier.",
      it: "SIS Carouge impiegato al Pont des Acacias. Polizia: sbarramento della route de Veyrier.",
    },
  "Fermer et baliser les accès aux berges du quai Charles-Page.": {
    de: "Zugänge zu den Ufern am Quai Charles-Page sperren und markieren.",
    it: "Chiudere e segnalare gli accessi alle sponde del quai Charles-Page.",
  },
  "Cellule logistique": { de: "Zelle Logistik", it: "Cellula logistica" },
  "Livrer 200 sacs de sable au point de rassemblement Acacias.": {
    de: "200 Sandsäcke zum Sammelplatz Acacias liefern.",
    it: "Consegnare 200 sacchi di sabbia al punto di raccolta Acacias.",
  },
  "Contrôle de liaison sur G102 toutes les heures, noter au journal.": {
    de: "Stündliche Verbindungskontrolle auf G102, im Journal festhalten.",
    it: "Controllo dei collegamenti su G102 ogni ora, annotare nel diario.",
  },
  "Ravitaillement au PC Carouge dès 12:00.": {
    de: "Verpflegung im KP Carouge ab 12:00.",
    it: "Vettovagliamento al PC Carouge dalle 12:00.",
  },
  "Sanitaire (144) en réserve, pas de poste sanitaire avancé.": {
    de: "Sanität (144) in Reserve, kein vorgeschobener Sanitätsposten.",
    it: "Sanitari (144) in riserva, nessun posto sanitario avanzato.",
  },
  "Gilet de sauvetage obligatoire à moins de 5 m de l’eau.": {
    de: "Rettungsweste obligatorisch näher als 5 m am Wasser.",
    it: "Giubbotto di salvataggio obbligatorio a meno di 5 m dall’acqua.",
  },
  "Ordre n° 1 : Ordre d’engagement · crue de l’Arve": {
    de: "Befehl Nr. 1: Einsatzbefehl · Hochwasser der Arve",
    it: "Ordine n. 1: Ordine d’impiego · piena dell’Arve",
  },
  "Intention : fermer et baliser les accès aux berges, protéger les bâtiments du quai, garder une réserve alertée.":
    {
      de: "Absicht: Zugänge zu den Ufern sperren und markieren, die Gebäude am Quai schützen, eine Reserve in Bereitschaft halten.",
      it: "Intenzione: chiudere e segnalare gli accessi alle sponde, proteggere gli edifici del quai, tenere una riserva allertata.",
    },
  Ordre: { de: "Befehl", it: "Ordine" },
  "Complément à l’ordre n° 1 · relève de 18:00": {
    de: "Ergänzung zum Befehl Nr. 1 · Ablösung um 18:00",
    it: "Complemento all’ordine n. 1 · avvicendamento delle 18:00",
  },
  "Inchangée.": { de: "Unverändert.", it: "Invariata." },
  "Cellule personnel": { de: "Zelle Personal", it: "Cellula personale" },
  "Préparer la relève de l’équipe Bravo (6 personnes).": {
    de: "Ablösung der Gruppe Bravo vorbereiten (6 Personen).",
    it: "Preparare l’avvicendamento della squadra Bravo (6 persone).",
  },
  "Route de Veyrier fermée dans les deux sens": {
    de: "Route de Veyrier in beiden Richtungen gesperrt",
    it: "Route de Veyrier chiusa nei due sensi",
  },
  "Déviation par la route de Troinex. Informer les équipes en déplacement.": {
    de: "Umleitung über die Route de Troinex. Die Gruppen unterwegs informieren.",
    it: "Deviazione per la route de Troinex. Informare le squadre in movimento.",
  },
  Consigne: { de: "Weisung", it: "Direttiva" },
  "Chef situation · Opérateur B · fictif": {
    de: "Chef Lage · Operateur B · fiktiv",
    it: "Capo situazione · Operatore B · fittizio",
  },
  "Faire le plein des véhicules avant la relève.": {
    de: "Fahrzeuge vor der Ablösung auftanken.",
    it: "Fare il pieno dei veicoli prima dell’avvicendamento.",
  },
} satisfies Dict);
