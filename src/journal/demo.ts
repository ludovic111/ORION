import {
  addEntry,
  emptyFields,
  journalSchema,
  newJournal,
  updateRadio,
  type Workspace,
  type Fields,
  type Journal,
} from "../../shared/journal.ts";
import {
  MEMBER_STATUSES,
  RESOURCE_STATUSES,
  SWISS_EMERGENCY,
  emptyMessage,
  upsert,
  type Collection,
  type Contact,
  type Message,
  type Ops,
  type Place,
  type InputOf,
  type Resource,
} from "../../shared/ops.ts";
import { addLink, ref, type Ref } from "../../shared/links.ts";
import type { HistoryEvent } from "../../shared/events.ts";
import { zurichHour, zurichMidnight } from "../../shared/time.ts";
import { demoConduct } from "./demo-logistics.ts";
import { withDemoExercise } from "../exercise/demo.ts";
import {
  emptyRadio,
  issueTerminal,
  returnTerminal,
  terminalSeries,
  type Radio,
  type Talkgroup,
} from "../../shared/radio.ts";

import { withConductDemo } from "./demo-conduct.ts";

// Fictitious numbering: real talkgroups and RFSI come from the cantonal fleet plan.
function demoRadio(at: (minutes: number) => string): Radio {
  const group = (
    number: string,
    name: string,
    mode: Talkgroup["mode"],
    usage: Talkgroup["usage"],
    notes = "",
  ): Talkgroup => ({
    id: crypto.randomUUID(),
    number,
    name,
    mode,
    usage,
    notes,
  });
  const talkgroups = [
    group("G101", "PCi Conduite", "Groupe", "Conduite"),
    group("G102", "PCi Engagement Arve", "Groupe", "Engagement"),
    group("G103", "PCi Logistique", "Groupe", "Logistique"),
    group(
      "D481",
      "Direct secteur Acacias",
      "Direct",
      "Engagement",
      "Si couverture insuffisante sous les ponts.",
    ),
  ];
  const [cdt, eng, log, direct] = talkgroups.map((g) => g.id);
  const station = (
    callsign: string,
    role: string,
    unit: string,
    primary: string,
    fallback: string,
    notes = "",
  ) => ({
    id: crypto.randomUUID(),
    callsign,
    role,
    unit,
    primary,
    fallback,
    notes,
  });
  let radio: Radio = {
    ...terminalSeries(emptyRadio(), "R-", 1, 8, {
      kind: "Portatif",
      model: "TPH900",
    }),
    talkgroups,
    stations: [
      station(
        "PC Carouge",
        "Poste de commandement",
        "Conduite",
        cdt,
        direct,
        "Station de transit",
      ),
      station(
        "Direction exercice",
        "Direction de l’exercice",
        "Conduite",
        cdt,
        "",
      ),
      station(
        "Chef section appui",
        "Chef de section",
        "Section appui",
        eng,
        direct,
      ),
      station(
        "Patrouille Alpha",
        "Reconnaissance",
        "Section appui",
        eng,
        direct,
      ),
      station("Équipe Bravo", "Chef de groupe", "Section appui", eng, direct),
      station("Logistique", "Préposé au matériel", "Logistique", log, cdt),
    ],
  };
  radio.terminals = radio.terminals.map((t, i) => ({
    ...t,
    rfsi: `900 00 ${String(1001 + i)}`,
    serial: `FICTIF-${String(i + 1).padStart(4, "0")}`,
    condition: i === 7 ? "Défectueux" : "Opérationnel",
    notes: i === 7 ? "Écran fissuré. Retourné à l’arsenal." : "",
  }));
  const hand = [
    [
      "R-01",
      "Sgt Fictif A",
      "PC Carouge",
      "Poste de commandement",
      "Conduite",
      "Microtel, Chargeur",
    ],
    [
      "R-02",
      "Lt Fictif B",
      "Chef section appui",
      "Chef de section",
      "Section appui",
      "Batterie de rechange, Microtel",
    ],
    [
      "R-03",
      "Pionnier Fictif C",
      "Patrouille Alpha",
      "Reconnaissance",
      "Section appui",
      "Batterie de rechange",
    ],
    [
      "R-04",
      "Cpl Fictif D",
      "Équipe Bravo",
      "Chef de groupe",
      "Section appui",
      "Batterie de rechange, Housse",
    ],
    [
      "R-05",
      "Préposé Fictif E",
      "Logistique",
      "Préposé au matériel",
      "Logistique",
      "",
    ],
  ];
  hand.forEach(([label, holder, callsign, role, unit, accessories], i) => {
    const terminal = radio.terminals.find((t) => t.label === label)!;
    radio = issueTerminal(radio, terminal.id, {
      holder,
      callsign,
      role,
      unit,
      accessories,
      battery: "Pleine",
      issuedAt: at(-20 + i * 2),
      issuedBy: "Opérateur A · fictif",
      notes: "",
    });
  });
  const r05 = radio.terminals.find((t) => t.label === "R-05")!;
  radio = returnTerminal(
    radio,
    r05.id,
    at(40),
    "Opérateur B · fictif",
    "À recharger",
    "Retour complet.",
  );
  const check = (
    minutes: number,
    callsign: string,
    talkgroupId: string,
    result: "3" | "2" | "1" | "0",
    notes = "",
  ) => ({
    id: crypto.randomUUID(),
    at: at(minutes),
    by: "PC Carouge",
    callsign,
    talkgroupId,
    result,
    notes,
  });
  radio.checks = [
    check(-5, "Chef section appui", eng, "3"),
    check(-4, "Patrouille Alpha", eng, "3"),
    check(
      -3,
      "Équipe Bravo",
      eng,
      "2",
      "Passerelle de la Fontenette : réception faible.",
    ),
    check(-2, "Logistique", log, "3"),
    check(30, "Équipe Bravo", direct, "3", "Passage en mode direct D481."),
  ];
  return radio;
}
// Every name, number and position below is fictitious.
function demoOps(journal: Journal, at: (minutes: number) => string): Ops {
  const author = "Opérateur A · fictif";
  const entry = (i: number) => ref("entry", journal.entries[i].id);
  const id = () => crypto.randomUUID();
  let ops = journal.ops;
  const put = <C extends Collection>(
    collection: C,
    value: Omit<InputOf<C>, "createdAt" | "updatedAt" | "by"> & {
      id: string;
    },
  ) => {
    ops = upsert(ops, collection, value as never, author);
    return value.id;
  };
  const link = (a: Ref, b: Ref, label = "") => {
    ops = addLink(ops, a, b, label, author);
  };
  const cell = (
    name: string,
    kind: string,
    color: string,
    location: string,
    radio: string,
    order: number,
  ) =>
    put("cells", {
      id: id(),
      name,
      kind,
      color,
      location,
      phone: "",
      radio,
      notes: "",
      order,
    });
  const front = cell(
    "PC front",
    "PC front",
    "#ff72c8",
    "Quai Charles-Page",
    "PC front",
    0,
  );
  const back = cell(
    "PC arrière",
    "PC arrière",
    "#8b7bff",
    "PC Carouge",
    "PC Carouge",
    1,
  );
  const situation = cell(
    "Cellule situation",
    "Cellule",
    "#3fdcff",
    "PC Carouge",
    "",
    2,
  );
  const logistics = cell(
    "Cellule logistique",
    "Cellule",
    "#ffb35c",
    "PC Carouge",
    "Logistique",
    3,
  );
  const member = (
    grade: string,
    name: string,
    role: string,
    cellId: string,
    callsign = "",
    status: (typeof MEMBER_STATUSES)[number] = "Présent",
  ) =>
    put("members", {
      id: id(),
      name,
      grade,
      role,
      cellId,
      callsign,
      phone: "",
      email: "",
      status,
      from: at(-60),
      to: at(660),
      notes: "",
    });
  member("Cap", "Fictif Arnaud", "Chef d’intervention", back, "PC Carouge");
  member("Plt", "Fictive Bernasconi", "Chef AIC", back);
  member("Sgt", "Fictif A", "Opérateur journal", situation);
  member("Sgt", "Fictive Delacrétaz", "Synthèse des messages", situation);
  member("Cpl", "Fictif Egger", "Cartographe", situation, "", "En pause");
  member("App", "Fictive Favre", "Opérateur radio", back);
  member("Lt", "Fictif B", "Chef de section", front, "Chef section appui");
  member("Cpl", "Fictif D", "Chef de groupe", front, "Équipe Bravo");
  member(
    "Sgtm",
    "Fictif Gilliéron",
    "Chef logistique",
    logistics,
    "Logistique",
  );
  member("Sdt", "Fictive Huber", "Téléphoniste", logistics, "", "Absent");

  const resource = (
    name: string,
    kind: string,
    organization: string,
    count: number,
    status: (typeof RESOURCE_STATUSES)[number],
    extra: Partial<Resource> = {},
  ) =>
    put("resources", {
      id: id(),
      name,
      kind,
      organization,
      callsign: "",
      count,
      status,
      location: "",
      mission: "",
      eta: "",
      contact: "",
      notes: "",
      ...extra,
    });
  const bravo = resource(
    "Équipe Bravo",
    "Personnel",
    "Protection civile",
    6,
    "Engagé",
    {
      callsign: "Équipe Bravo",
      location: "Passerelle de la Fontenette",
      mission: "Sécuriser l’accès aux berges.",
    },
  );
  resource("Patrouille Alpha", "Personnel", "Protection civile", 3, "Engagé", {
    callsign: "Patrouille Alpha",
    location: "Pont des Acacias",
    mission: "Reconnaissance du niveau de l’Arve.",
  });
  const trucks = resource(
    "Camions de transport PCi",
    "Véhicule",
    "Protection civile",
    2,
    "En route",
    {
      location: "Arsenal → Point de rassemblement Acacias",
      mission: "Livrer 200 sacs de sable.",
      eta: at(115),
    },
  );
  const bags = resource(
    "Sacs de sable",
    "Matériel",
    "Protection civile",
    200,
    "En route",
    {
      location: "Camions de transport PCi",
    },
  );
  const pump = resource(
    "Tonne-pompe SIS (fictif)",
    "Véhicule",
    "Pompiers (SIS)",
    1,
    "Engagé",
    {
      location: "Quai Charles-Page",
      mission: "Pompage des caves inondées.",
    },
  );
  resource("Motopompes", "Matériel", "Protection civile", 4, "Disponible", {
    location: "PC Carouge",
  });
  resource(
    "Section appui (réserve)",
    "Personnel",
    "Protection civile",
    12,
    "Alerté",
  );

  const contact = (
    name: string,
    category: string,
    phone: string,
    extra: Partial<Contact> = {},
  ) =>
    put("contacts", {
      id: id(),
      name,
      organization: "",
      role: "",
      category,
      phone,
      phone2: "",
      email: "",
      radio: "",
      address: "",
      notes: "",
      favorite: false,
      ...extra,
    });
  SWISS_EMERGENCY.slice(0, 5).forEach((c) =>
    contact(c.name, c.category, c.phone, {
      organization: c.organization,
      notes: c.notes,
    }),
  );
  const commune = contact(
    "Permanence de la commune (fictif)",
    "Autorités",
    "022 000 00 01",
    {
      organization: "Commune de Carouge · fictif",
      role: "Permanence technique",
      favorite: true,
    },
  );
  contact("Centrale d’engagement (fictif)", "Partenaires", "022 000 00 02", {
    organization: "Protection civile · fictif",
    radio: "PC Carouge",
    favorite: true,
  });
  contact(
    "Fournisseur de sacs de sable (fictif)",
    "Fournisseurs",
    "022 000 00 03",
    {
      organization: "Entreprise fictive SA",
    },
  );

  const message = (value: Partial<Message> & Pick<Message, "body">) =>
    put("messages", { ...emptyMessage(), id: id(), ...value } as Message & {
      id: string;
    });
  const rising = message({
    receivedAt: at(8),
    from: "Patrouille Alpha",
    to: "PC arrière",
    via: "Radio",
    priority: "Important",
    category: "Renseignement",
    subject: "Niveau de l’Arve en hausse",
    body: "Niveau en hausse rapide au pont des Acacias, environ 20 cm en 30 minutes.",
    location: "Pont des Acacias",
    status: "Transmis",
    entryId: journal.entries[1].id,
    handledBy: "Fictive Delacrétaz",
  });
  const road = message({
    receivedAt: at(62),
    from: "Équipe Bravo",
    to: "PC front",
    via: "Radio",
    priority: "Urgent",
    category: "Alerte",
    subject: "Eau sur la chaussée",
    body: "Eau sur la chaussée route de Veyrier à la hauteur de la Fontenette. Circulation dangereuse.",
    location: "Route de Veyrier",
    replyNeeded: true,
    replyBy: at(80),
  });
  message({
    receivedAt: at(70),
    from: "Logistique",
    to: "PC arrière",
    via: "Téléphone",
    category: "Compte rendu",
    subject: "Sacs de sable en route",
    body: "Deux camions partis de l’arsenal avec 200 sacs. Arrivée estimée dans 45 minutes.",
    status: "En traitement",
    handledBy: "Fictive Delacrétaz",
  });
  message({
    receivedAt: at(74),
    from: "Police",
    to: "Chef d’intervention",
    via: "Téléphone",
    category: "Information",
    subject: "Fermeture du pont",
    body: "La police ferme le pont de Carouge à la circulation dès 09:30.",
    location: "Pont de Carouge",
  });

  const place = (
    label: string,
    kind: Place["kind"],
    layer: string,
    points: [number, number][],
    symbol = "",
    color = "",
    notes = "",
  ) =>
    put("places", {
      id: id(),
      label,
      kind,
      layer,
      points,
      symbol,
      color,
      notes,
    });
  const pc = place(
    "PC Carouge",
    "point",
    "Emplacements",
    [[46.1829, 6.1398]],
    "c57efe9980d514d6",
  );
  const pcFront = place(
    "PC front",
    "point",
    "Emplacements",
    [[46.1953, 6.1463]],
    "997aec2a2a12cbfc",
  );
  const flood = place(
    "Zone inondée Acacias",
    "area",
    "Effets",
    [
      [46.1941, 6.1352],
      [46.1952, 6.1391],
      [46.1938, 6.1419],
      [46.1921, 6.1402],
      [46.1918, 6.1363],
    ],
    "",
    "#3fdcff",
    "Surface estimée d’après la reconnaissance de 08:08.",
  );
  const closure = place(
    "Fermeture des berges",
    "line",
    "Mesures",
    [
      [46.1962, 6.1441],
      [46.1956, 6.1467],
      [46.1948, 6.149],
    ],
    "",
    "#34e0a1",
  );
  const pumpPlace = place(
    "Tonne-pompe SIS",
    "point",
    "Moyens",
    [[46.1949, 6.1478]],
    "7e9d403b48f7e265",
  );
  const gathering = place(
    "Point de rassemblement Acacias",
    "point",
    "Emplacements",
    [[46.1912, 6.1336]],
    "35501db9d9a6e728",
  );
  const walkway = place(
    "Passerelle de la Fontenette",
    "point",
    "Dangers",
    [[46.1843, 6.1537]],
    "b3bc72f54c8ed2e5",
    "",
    "Second accès aux berges encore ouvert.",
  );
  const roadPlace = place(
    "Route de Veyrier inondée",
    "point",
    "Effets",
    [[46.1861, 6.1548]],
    "85d41c22bf08bbff",
  );

  link(ref("place", pc), ref("cell", back), "emplacement");
  link(ref("place", pcFront), ref("cell", front), "emplacement");
  link(ref("place", flood), entry(1), "reconnaissance");
  link(ref("place", flood), ref("message", rising), "signalé par");
  link(ref("place", closure), entry(2), "décision");
  link(ref("place", closure), entry(4), "quittance");
  link(ref("place", pumpPlace), ref("resource", pump), "position");
  link(ref("place", gathering), entry(3), "livraison");
  link(ref("resource", trucks), entry(3), "répond à");
  link(ref("resource", bags), entry(3), "répond à");
  link(ref("resource", bags), ref("resource", trucks), "transporté par");
  link(ref("place", walkway), entry(5), "concerne");
  link(ref("place", walkway), ref("resource", bravo), "position");
  link(ref("place", roadPlace), ref("message", road), "signalé par");
  link(ref("contact", commune), ref("message", road), "à informer");

  const agenda = (
    minutes: number,
    title: string,
    kind: string,
    location = "PC Carouge",
    participants = "",
  ) =>
    put("agenda", {
      id: id(),
      at: at(minutes),
      minutes: 30,
      title,
      kind,
      location,
      participants,
      notes: "",
      done: minutes < 0,
    });
  agenda(
    0,
    "Orientation initiale",
    "Orientation",
    "PC Carouge",
    "Chef d’intervention, chefs de cellule",
  );
  agenda(
    120,
    "Rapport de conduite",
    "Rapport de conduite",
    "PC Carouge",
    "Chefs de cellule, chef de section",
  );
  agenda(
    210,
    "Point presse",
    "Conférence de presse",
    "Mairie de Carouge (fictif)",
  );
  agenda(
    360,
    "Rapport de conduite",
    "Rapport de conduite",
    "PC Carouge",
    "Chefs de cellule, chef de section",
  );
  agenda(660, "Relève", "Relève");

  const facts: [string, string, string, string][] = [
    ["Personnes blessées", "0", "pers.", "Personnes"],
    ["Personnes évacuées", "12", "pers.", "Personnes"],
    ["Bâtiments touchés", "3", "bât.", "Bâtiments"],
    ["Routes fermées", "2", "", "Infrastructures"],
    ["Personnel engagé", "27", "pers.", "Engagement"],
    ["Niveau de l’Arve (Acacias)", "+ 45", "cm", "Infrastructures"],
  ];
  facts.forEach(([label, value, unit, category], order) =>
    put("facts", { id: id(), label, value, unit, category, note: "", order }),
  );
  const boards: [string, string][] = [
    [
      "Situation générale",
      "Crue de l’Arve après de fortes pluies. Montée d’environ 45 cm depuis 08:00 au pont des Acacias. Caves inondées quai Charles-Page.",
    ],
    [
      "Dangers et évolution probable",
      "Pic attendu vers 13:00. Risque de débordement sur la route de Veyrier et aux accès des berges.",
    ],
    [
      "Intention / idée de manœuvre",
      "Fermer et baliser tous les accès aux berges, protéger les bâtiments du quai avec des sacs de sable, garder une réserve alertée.",
    ],
  ];
  boards.forEach(([title, body], order) =>
    put("boards", { id: id(), title, body, order }),
  );
  put("observations", {
    id: id(),
    at: at(30),
    place: "Pont des Acacias",
    temperature: "11 °C",
    wind: "SO 20 km/h",
    precipitation: "Pluie modérée",
    visibility: "Bonne",
    conditions: "Couvert, pluie continue",
    notes: "",
  });
  put("alerts", {
    id: id(),
    level: "3",
    hazard: "Fortes pluies",
    region: "Genève",
    from: at(-240),
    to: at(720),
    source: "MétéoSuisse (exemple fictif)",
    notes: "",
  });
  put("alerts", {
    id: id(),
    level: "3",
    hazard: "Crues",
    region: "Arve",
    from: at(-60),
    to: at(1440),
    source: "Canton (exemple fictif)",
    notes: "",
  });
  return {
    ...ops,
    settings: {
      ...ops.settings,
      mapCenter: { lat: 46.1905, lng: 6.1445, zoom: 15 },
      weatherPlace: { name: "Carouge (GE)", lat: 46.1839, lng: 6.1397 },
    },
  };
}
/**
 * Start of the exercise: 2 h 30 before `now`, rounded down to 5 minutes, so
 * that the story is always recent whatever the hour (also at night, then
 * over two days): the first due dates are just past, the next ones to come.
 */
export function demoStart(now = Date.now()): number {
  return Math.floor((now - 150 * 60_000) / 300_000) * 300_000;
}

export function demoWorkspace(now = Date.now()): Workspace {
  let journal = newJournal("Crue de l’Arve", {
    organization: "PCi · Exercice de démonstration",
    location: "Carouge · Genève",
    reference: "EX-2026-09",
    mode: "Exercice",
  });
  // The first two hours and a half are already past: the time machine has a
  // story to replay and the due dates are recent.
  const base = demoStart(now);
  const at = (minutes: number) =>
    new Date(base + minutes * 60_000).toISOString();
  const examples: Partial<Fields>[] = [
    {
      message: "Ouverture du poste de conduite. Début de la tenue du journal.",
      type: "Observation",
      source: "Chef de cellule",
      location: "PC Carouge",
      reliability: "Confirmé",
    },
    {
      message:
        "Hausse du niveau de l’Arve signalée au pont des Acacias. Reconnaissance demandée.",
      source: "Patrouille Alpha",
      location: "Pont des Acacias",
      reliability: "À vérifier",
      priority: "Important",
      status: "À traiter",
      assignee: "Chef de section",
      action: "Vérifier le niveau sur place et transmettre un compte rendu.",
      dueAt: at(65),
    },
    {
      message:
        "Fermeture préventive de l’accès aux berges décidée par la direction de l’exercice.",
      type: "Décision",
      source: "Direction de l’exercice",
      recipient: "Section appui",
      location: "Quai Charles-Page",
      reliability: "Confirmé",
      status: "En cours",
      assignee: "Section appui",
      action: "Mettre en place le balisage. Confirmer la fermeture des accès.",
    },
    {
      message:
        "Demande de 200 sacs de sable et de deux véhicules de transport.",
      type: "Demande",
      source: "Section appui",
      recipient: "Logistique",
      location: "Point de rassemblement Acacias",
      status: "À traiter",
      resources: "200 sacs de sable · 2 véhicules",
      assignee: "Logistique",
      dueAt: at(100),
    },
    {
      message:
        "Balisage du premier accès terminé. Aucun civil dans le périmètre.",
      type: "Quittance",
      source: "Équipe Bravo",
      location: "Quai Charles-Page",
      reliability: "Confirmé",
      status: "Terminé",
      reference: "Suite de l’entrée #003",
      action: "Maintenir la surveillance du périmètre.",
    },
    {
      message:
        "Un second accès aux berges reste ouvert. Une équipe est requise pour sécuriser le passage.",
      source: "Équipe Bravo",
      location: "Passerelle de la Fontenette",
      priority: "Urgent",
      reliability: "Confirmé",
      status: "À traiter",
      assignee: "Chef de section",
      dueAt: at(55),
      action: "Faire confirmer la fermeture et consigner la quittance.",
    },
  ];
  examples.forEach((example, i) => {
    journal = addEntry(
      journal,
      {
        ...emptyFields(),
        happenedAt: at(i * 9),
        receivedAt: at(i * 9 + 1),
        ...example,
      },
      i % 2 ? "Opérateur B · fictif" : "Opérateur A · fictif",
    );
  });
  journal = updateRadio(journal, demoRadio(at));
  journal = { ...journal, ops: demoOps(journal, at) };
  journal = demoHistory(journal, at);
  journal = withConductDemo(journal, at);
  journal = demoConduct(journal, at);
  // The exercise keeps going while the visitor watches (src/exercise/demo.ts).
  journal = journalSchema.parse(withDemoExercise(journal, base, now));
  return {
    version: 1,
    author: "Opérateur · démo",
    journals: [journal],
    activeId: journal.id,
  };
}

// ---------- History of the demonstration ----------

type Step = { m: number; by: string; patch?: object; note?: string };
const OPERATOR_A = "Opérateur A · fictif";
const OPERATOR_B = "Opérateur B · fictif";
const MAPPER = "Cartographe · fictif";

/** Forecast as received at a time, rain increasing with `wet`. */
function demoForecast(fetched: number, wet: number) {
  const hour = 3_600_000;
  const start = Math.floor(fetched / hour) * hour;
  const hours = Array.from({ length: 72 }, (_, i) => {
    const t = start + i * hour;
    const h = zurichHour(t);
    const rain = Math.max(
      0,
      wet * (1.6 + Math.sin(i / 5)) - (i > 30 ? 1.5 : 0),
    );
    return {
      at: t,
      temperature:
        Math.round((10 + 3 * Math.sin(((h - 9) / 24) * 2 * Math.PI)) * 10) / 10,
      precipitation: Math.round(rain * 10) / 10,
      probability: Math.min(100, Math.round(40 + rain * 18)),
      code: rain > 3 ? 65 : rain > 1 ? 63 : rain > 0.1 ? 61 : 3,
      wind: Math.round(12 + wet * 4 + (i % 7)),
      gusts: Math.round(28 + wet * 9 + (i % 11)),
    };
  });
  const day = 86_400_000;
  const midnight = new Date(zurichMidnight(start));
  const days = [0, 1, 2].map((d) => {
    const list = hours.filter(
      (h) =>
        h.at >= midnight.getTime() + d * day &&
        h.at < midnight.getTime() + (d + 1) * day,
    );
    const temps = list.map((h) => h.temperature);
    return {
      at: midnight.getTime() + d * day,
      code: d === 0 ? 63 : d === 1 ? 61 : 3,
      max: temps.length ? Math.max(...temps) : 12,
      min: temps.length ? Math.min(...temps) : 7,
      precipitation:
        Math.round(list.reduce((n, h) => n + h.precipitation, 0) * 10) / 10,
      gusts: list.length ? Math.max(...list.map((h) => h.gusts)) : 40,
      sunrise: midnight.getTime() + d * day + 7.3 * hour,
      sunset: midnight.getTime() + d * day + 19.4 * hour,
    };
  });
  return {
    model: "MétéoSuisse ICON-CH2 (exemple fictif)",
    current: {
      at: fetched,
      temperature: hours[0].temperature,
      humidity: 88,
      precipitation: hours[0].precipitation,
      code: hours[0].code,
      wind: hours[0].wind,
      direction: 225,
      gusts: hours[0].gusts,
    },
    hours,
    days,
  };
}

/**
 * Give the demonstration a believable past: records created one after the
 * other by several operators, statuses that evolve, a PC that moves, an
 * area that grows, a road block placed then lifted, forecasts received
 * every hour, two frozen points and a presentation.
 */
function demoHistory(
  journal: Journal,
  at: (minutes: number) => string,
): Journal {
  const events: HistoryEvent[] = [];
  const push = (
    scope: string,
    target: string,
    state: unknown,
    minutes: number,
    by: string,
    action: HistoryEvent["action"],
    note = "",
  ) =>
    events.push({
      id: crypto.randomUUID(),
      at: at(minutes),
      by,
      action,
      scope,
      target,
      state,
      rev: 0,
      note,
    });
  /** Record the steps of a record; returns its final state. */
  const track = <T extends { id: string }>(
    scope: string,
    record: T,
    steps: Step[],
  ): T => {
    const createdAt = at(steps[0].m);
    let state = record;
    steps.forEach((step, i) => {
      state = {
        ...record,
        ...(step.patch ?? {}),
        createdAt,
        updatedAt: at(step.m),
        by: steps[0].by,
      };
      push(
        scope,
        record.id,
        state,
        step.m,
        step.by,
        i ? "update" : "create",
        step.note,
      );
    });
    return state;
  };
  const minutesOf = (iso: string, fallback: number) => {
    const t = Date.parse(iso);
    const start = Date.parse(at(0));
    return Number.isNaN(t)
      ? fallback
      : Math.min(130, Math.round((t - start) / 60_000));
  };

  // Journal header and entries: created when received.
  push(
    "meta",
    "meta",
    {
      title: journal.title,
      organization: journal.organization,
      location: journal.location,
      reference: journal.reference,
      mode: journal.mode,
      classification: journal.classification,
      createdAt: at(-30),
      closedAt: "",
    },
    -30,
    OPERATOR_A,
    "create",
  );
  const entries = journal.entries.map((e, i) => {
    const t = at(i * 9 + 1);
    const revisions = e.revisions.map((r) => ({ ...r, at: t }));
    if (i === 1)
      revisions.push({
        ...revisions[0],
        id: crypto.randomUUID(),
        at: at(40),
        author: OPERATOR_B,
        reason: "Niveau confirmé par la patrouille sur place",
        fields: {
          ...revisions[0].fields,
          reliability: "Confirmé",
          status: "En cours",
        },
      });
    return { ...e, createdAt: t, revisions };
  });

  // Records of the modules.
  const o = journal.ops;
  const simple = <T extends { id: string }>(
    scope: string,
    list: T[],
    minute: (r: T, i: number) => number,
    by: string,
  ) => list.map((r, i) => track(scope, r, [{ m: minute(r, i), by }]));
  const statuses: Record<string, Step[]> = {
    "Équipe Bravo": [
      {
        m: -15,
        by: OPERATOR_B,
        patch: { status: "Disponible", location: "PC Carouge", mission: "" },
      },
      {
        m: 10,
        by: OPERATOR_B,
        patch: { status: "Alerté", location: "PC Carouge", mission: "" },
      },
      {
        m: 25,
        by: OPERATOR_B,
        patch: { status: "En route", mission: "Sécuriser l’accès aux berges." },
      },
      { m: 45, by: OPERATOR_A },
    ],
    "Patrouille Alpha": [
      { m: -15, by: OPERATOR_B, patch: { status: "Alerté" } },
      { m: 5, by: OPERATOR_B },
    ],
    "Camions de transport PCi": [
      {
        m: -15,
        by: OPERATOR_B,
        patch: {
          status: "Disponible",
          location: "Arsenal",
          mission: "",
          eta: "",
        },
      },
      {
        m: 50,
        by: OPERATOR_A,
        patch: { status: "Alerté", location: "Arsenal" },
      },
      { m: 70, by: OPERATOR_B },
    ],
    "Sacs de sable": [
      {
        m: -15,
        by: OPERATOR_B,
        patch: { status: "Disponible", location: "Arsenal" },
      },
      { m: 70, by: OPERATOR_B },
    ],
    "Tonne-pompe SIS (fictif)": [
      { m: 30, by: OPERATOR_A, patch: { status: "Alerté", mission: "" } },
      { m: 60, by: OPERATOR_A },
    ],
    "Section appui (réserve)": [
      { m: -15, by: OPERATOR_B, patch: { status: "Disponible" } },
      { m: 100, by: OPERATOR_A },
    ],
  };
  const resources = o.resources.map((r) =>
    track("ops.resources", r, statuses[r.name] ?? [{ m: -15, by: OPERATOR_B }]),
  );
  const factSteps: Record<string, Step[]> = {
    "Personnes évacuées": [
      { m: -10, by: OPERATOR_A, patch: { value: "0" } },
      { m: 35, by: OPERATOR_A, patch: { value: "5" } },
      { m: 85, by: OPERATOR_B },
    ],
    "Niveau de l’Arve (Acacias)": [
      { m: -10, by: OPERATOR_A, patch: { value: "+ 10" } },
      { m: 30, by: OPERATOR_B, patch: { value: "+ 25" } },
      { m: 90, by: OPERATOR_B },
    ],
    "Personnel engagé": [
      { m: -10, by: OPERATOR_A, patch: { value: "12" } },
      { m: 40, by: OPERATOR_A, patch: { value: "20" } },
      { m: 95, by: OPERATOR_A },
    ],
    "Bâtiments touchés": [
      { m: -10, by: OPERATOR_A, patch: { value: "0" } },
      { m: 55, by: OPERATOR_B },
    ],
  };
  const facts = o.facts.map((f) =>
    track("ops.facts", f, factSteps[f.label] ?? [{ m: -10, by: OPERATOR_A }]),
  );
  const boards = o.boards.map((b, i) =>
    track(
      "ops.boards",
      b,
      i === 0
        ? [
            {
              m: 0,
              by: OPERATOR_A,
              patch: {
                body: "Crue de l’Arve après de fortes pluies. Montée du niveau signalée au pont des Acacias.",
              },
            },
            { m: 75, by: OPERATOR_A },
          ]
        : [{ m: 5 + i * 10, by: OPERATOR_A }],
    ),
  );

  // Maps: a general follow-up map and a detailed sector map.
  const general = crypto.randomUUID();
  const detail = crypto.randomUUID();
  const maps = [
    track(
      "ops.maps",
      {
        id: general,
        name: "Suivi général",
        purpose: "Vue d’ensemble pour le rapport de conduite",
        base: "gray",
        lat: 46.1895,
        lng: 6.1445,
        zoom: 15,
        hidden: [],
        order: 0,
        notes: "",
      },
      [{ m: -20, by: MAPPER }],
    ),
    track(
      "ops.maps",
      {
        id: detail,
        name: "Secteur Acacias (détail)",
        purpose: "Engagement au pont des Acacias et au quai Charles-Page",
        base: "color",
        lat: 46.1938,
        lng: 6.1415,
        zoom: 17,
        hidden: [],
        order: 1,
        notes: "",
      },
      [{ m: 12, by: MAPPER }],
    ),
  ];
  const shrink = (points: [number, number][], k: number) => {
    const lat = points.reduce((n, p) => n + p[0], 0) / points.length;
    const lng = points.reduce((n, p) => n + p[1], 0) / points.length;
    return points.map(
      ([a, b]) =>
        [lat + (a - lat) * k, lng + (b - lng) * k] as [number, number],
    );
  };
  const placeSteps = (p: (typeof o.places)[number], i: number): Step[] => {
    if (p.label === "PC front")
      return [
        { m: 20, by: MAPPER, patch: { points: [[46.1962, 6.1432]] } },
        { m: 65, by: MAPPER, note: "" },
      ];
    if (p.label === "Zone inondée Acacias")
      return [
        { m: 15, by: MAPPER, patch: { points: shrink(p.points, 0.55) } },
        { m: 40, by: MAPPER, patch: { points: shrink(p.points, 0.8) } },
        { m: 88, by: MAPPER },
      ];
    if (p.label === "Tonne-pompe SIS") return [{ m: 62, by: MAPPER }];
    if (p.label === "Route de Veyrier inondée")
      return [{ m: 72, by: OPERATOR_B }];
    return [{ m: 8 + i * 5, by: MAPPER }];
  };
  const onMaps: Record<string, string[]> = {
    "PC Carouge": [general],
    "Route de Veyrier inondée": [general],
    "Point de rassemblement Acacias": [detail],
    "Tonne-pompe SIS": [detail],
  };
  const places = o.places.map((p, i) =>
    track(
      "ops.places",
      { ...p, maps: onMaps[p.label] ?? [] },
      placeSteps(p, i),
    ),
  );
  // A road block placed, then lifted: only the history remembers it.
  const block = crypto.randomUUID();
  const blockState = {
    ...o.places[0],
    id: block,
    label: "Barrage provisoire quai Ernest-Ansermet",
    kind: "point",
    layer: "Mesures",
    symbol: "b:barrage",
    color: "",
    points: [[46.1931, 6.1449]],
    notes: "Levé après l’ouverture de la déviation.",
    maps: [],
  };
  track("ops.places", blockState, [{ m: 25, by: MAPPER }]);
  push("ops.places", block, null, 78, OPERATOR_B, "remove");

  const own = (r: { receivedAt?: string; at?: string }, fallback: number) =>
    minutesOf(r.receivedAt ?? r.at ?? "", fallback);
  const ops = {
    ...o,
    cells: simple("ops.cells", o.cells, (_, i) => -26 + i, OPERATOR_A),
    members: simple("ops.members", o.members, (_, i) => -24 + i, OPERATOR_A),
    contacts: simple("ops.contacts", o.contacts, () => -28, OPERATOR_A),
    messages: simple("ops.messages", o.messages, (r) => own(r, 10), OPERATOR_B),
    agenda: simple("ops.agenda", o.agenda, () => -20, OPERATOR_A),
    observations: simple(
      "ops.observations",
      o.observations,
      (r) => own(r, 30),
      OPERATOR_B,
    ),
    alerts: simple("ops.alerts", o.alerts, (_, i) => -5 + i * 50, OPERATOR_B),
    links: simple("ops.links", o.links, () => 96, OPERATOR_A),
    resources,
    facts,
    boards,
    maps,
    places,
    snapshots: [
      track(
        "ops.snapshots",
        {
          id: crypto.randomUUID(),
          title: "Point de situation de 08:30",
          at: at(30),
          notes: "État transmis à la centrale d’engagement.",
        },
        [{ m: 31, by: OPERATOR_A }],
      ),
      track(
        "ops.snapshots",
        {
          id: crypto.randomUUID(),
          title: "Rapport de conduite",
          at: at(120),
          notes: "Présenté aux chefs de cellule.",
        },
        [{ m: 121, by: OPERATOR_A }],
      ),
    ],
    presentations: [
      track(
        "ops.presentations",
        {
          id: crypto.randomUUID(),
          startedAt: at(122),
          endedAt: at(134),
          presenter: "Fictive Bernasconi",
          audience: "Maire de Carouge et préfet (fictifs)",
          viewAt: at(120),
          slides: 9,
          mode: "Présentation",
          notes: "",
        },
        [{ m: 134, by: OPERATOR_A }],
      ),
    ],
    forecasts: [-15, 45, 105].map((m, i) => ({
      id: crypto.randomUUID(),
      createdAt: at(m),
      updatedAt: at(m),
      by: OPERATOR_B,
      fetchedAt: at(m),
      place: "Carouge (GE)",
      lat: 46.1839,
      lng: 6.1397,
      data: demoForecast(Date.parse(at(m)), 0.8 + i * 0.9),
    })),
  };
  push("settings", "settings", ops.settings, -30, OPERATOR_A, "create");
  for (const [k, list] of Object.entries(journal.radio) as [
    string,
    { id: string; at?: string }[],
  ][])
    for (const r of list)
      push(
        `radio.${k}`,
        r.id,
        r,
        r.at ? minutesOf(r.at, -25) : -25,
        OPERATOR_A,
        "create",
      );
  events.sort((a, b) => a.at.localeCompare(b.at) || a.id.localeCompare(b.id));
  return journalSchema.parse({
    ...journal,
    createdAt: at(-30),
    entries,
    ops,
    history: events,
  });
}
