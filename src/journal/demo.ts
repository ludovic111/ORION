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
  emptyMessage,
  swissEmergency,
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
import { t } from "./i18n-demo.ts";

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
    group("G101", t("PCi Conduite"), "Groupe", "Conduite"),
    group("G102", t("PCi Engagement Arve"), "Groupe", "Engagement"),
    group("G103", t("PCi Logistique"), "Groupe", "Logistique"),
    group(
      "D481",
      t("Direct secteur Acacias"),
      "Direct",
      "Engagement",
      t("Si couverture insuffisante sous les ponts."),
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
  const pcCarouge = t("PC Carouge");
  const command = t("Conduite (unité)");
  const chiefCall = t("Chef section appui");
  const chief = t("Chef de section");
  const support = t("Section appui");
  const alpha = t("Patrouille Alpha");
  const bravo = t("Équipe Bravo");
  const groupChief = t("Chef de groupe");
  const logistics = t("Logistique");
  const keeper = t("Préposé au matériel");
  const operatorA = t("Opérateur A · fictif");
  const operatorB = t("Opérateur B · fictif");
  let radio: Radio = {
    ...terminalSeries(emptyRadio(), "R-", 1, 8, {
      kind: "Portatif",
      model: "TPH900",
    }),
    talkgroups,
    stations: [
      station(
        pcCarouge,
        t("Poste de commandement"),
        command,
        cdt,
        direct,
        t("Station de transit"),
      ),
      station(
        t("Direction exercice"),
        t("Direction de l’exercice"),
        command,
        cdt,
        "",
      ),
      station(chiefCall, chief, support, eng, direct),
      station(alpha, t("Reconnaissance"), support, eng, direct),
      station(bravo, groupChief, support, eng, direct),
      station(logistics, keeper, logistics, log, cdt),
    ],
  };
  radio.terminals = radio.terminals.map((terminal, i) => ({
    ...terminal,
    rfsi: `900 00 ${String(1001 + i)}`,
    serial: `${t("FICTIF")}-${String(i + 1).padStart(4, "0")}`,
    condition: i === 7 ? "Défectueux" : "Opérationnel",
    notes: i === 7 ? t("Écran fissuré. Retourné à l’arsenal.") : "",
  }));
  const hand = [
    [
      "R-01",
      `${t("Sgt")} Fictif A`,
      pcCarouge,
      t("Poste de commandement"),
      command,
      "Microtel, Chargeur",
    ],
    [
      "R-02",
      `${t("Lt")} Fictif B`,
      chiefCall,
      chief,
      support,
      "Batterie de rechange, Microtel",
    ],
    [
      "R-03",
      `${t("Pionnier")} Fictif C`,
      alpha,
      t("Reconnaissance"),
      support,
      "Batterie de rechange",
    ],
    [
      "R-04",
      `${t("Cpl")} Fictif D`,
      bravo,
      groupChief,
      support,
      "Batterie de rechange, Housse",
    ],
    ["R-05", `${t("Préposé")} Fictif E`, logistics, keeper, logistics, ""],
  ];
  hand.forEach(([label, holder, callsign, role, unit, accessories], i) => {
    const terminal = radio.terminals.find((x) => x.label === label)!;
    radio = issueTerminal(radio, terminal.id, {
      holder,
      callsign,
      role,
      unit,
      accessories,
      battery: "Pleine",
      issuedAt: at(-20 + i * 2),
      issuedBy: operatorA,
      notes: "",
    });
  });
  const r05 = radio.terminals.find((x) => x.label === "R-05")!;
  radio = returnTerminal(
    radio,
    r05.id,
    at(40),
    operatorB,
    "À recharger",
    t("Retour complet."),
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
    by: pcCarouge,
    callsign,
    talkgroupId,
    result,
    notes,
  });
  radio.checks = [
    check(-5, chiefCall, eng, "3"),
    check(-4, alpha, eng, "3"),
    check(
      -3,
      bravo,
      eng,
      "2",
      t("Passerelle de la Fontenette : réception faible."),
    ),
    check(-2, logistics, log, "3"),
    check(30, bravo, direct, "3", t("Passage en mode direct D481.")),
  ];
  return radio;
}
// Every name, number and position below is fictitious.
function demoOps(journal: Journal, at: (minutes: number) => string): Ops {
  const author = t("Opérateur A · fictif");
  const pcCarouge = t("PC Carouge");
  const pcFrontName = t("PC front");
  const bravoName = t("Équipe Bravo");
  const alphaName = t("Patrouille Alpha");
  const logisticsName = t("Logistique");
  const civil = t("Protection civile");
  const staff = t("Personnel");
  const vehicle = t("Véhicule");
  const material = t("Matériel");
  const sites = t("Emplacements");
  const effects = t("Effets");
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
    pcFrontName,
    pcFrontName,
    "#ff72c8",
    "Quai Charles-Page",
    pcFrontName,
    0,
  );
  const back = cell(
    t("PC arrière"),
    t("PC arrière"),
    "#8b7bff",
    pcCarouge,
    pcCarouge,
    1,
  );
  const situation = cell(
    t("Cellule situation"),
    t("Cellule"),
    "#3fdcff",
    pcCarouge,
    "",
    2,
  );
  const logistics = cell(
    t("Cellule logistique"),
    t("Cellule"),
    "#ffb35c",
    pcCarouge,
    logisticsName,
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
  member(t("Cap"), "Fictif Arnaud", t("Chef d’intervention"), back, pcCarouge);
  member(t("Plt"), "Fictive Bernasconi", t("Chef AIC"), back);
  member(t("Sgt"), "Fictif A", t("Opérateur journal"), situation);
  member(t("Sgt"), "Fictive Delacrétaz", t("Synthèse des messages"), situation);
  member(t("Cpl"), "Fictif Egger", t("Cartographe"), situation, "", "En pause");
  member(t("App"), "Fictive Favre", t("Opérateur radio"), back);
  member(
    t("Lt"),
    "Fictif B",
    t("Chef de section"),
    front,
    t("Chef section appui"),
  );
  member(t("Cpl"), "Fictif D", t("Chef de groupe"), front, bravoName);
  member(
    t("Sgtm"),
    "Fictif Gilliéron",
    t("Chef logistique"),
    logistics,
    logisticsName,
  );
  member("Sdt", "Fictive Huber", t("Téléphoniste"), logistics, "", "Absent");

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
  const bravo = resource(bravoName, staff, civil, 6, "Engagé", {
    callsign: bravoName,
    location: "Passerelle de la Fontenette",
    mission: t("Sécuriser l’accès aux berges."),
  });
  resource(alphaName, staff, civil, 3, "Engagé", {
    callsign: alphaName,
    location: "Pont des Acacias",
    mission: t("Reconnaissance du niveau de l’Arve."),
  });
  const trucks = resource(
    t("Camions de transport PCi"),
    vehicle,
    civil,
    2,
    "En route",
    {
      location: `${t("Arsenal")} → ${t("Point de rassemblement Acacias")}`,
      mission: t("Livrer 200 sacs de sable."),
      eta: at(115),
    },
  );
  const bags = resource(t("Sacs de sable"), material, civil, 200, "En route", {
    location: t("Camions de transport PCi"),
  });
  const pump = resource(
    t("Tonne-pompe SIS (fictif)"),
    vehicle,
    t("Pompiers (SIS)"),
    1,
    "Engagé",
    {
      location: "Quai Charles-Page",
      mission: t("Pompage des caves inondées."),
    },
  );
  resource(t("Motopompes"), material, civil, 4, "Disponible", {
    location: pcCarouge,
  });
  resource(t("Section appui (réserve)"), staff, civil, 12, "Alerté");

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
  swissEmergency(ops)
    .slice(0, 5)
    .forEach((c) =>
      contact(c.name, c.category, c.phone, {
        organization: c.organization,
        notes: c.notes,
      }),
    );
  const commune = contact(
    t("Permanence de la commune (fictif)"),
    t("Autorités"),
    "022 000 00 01",
    {
      organization: t("Commune de Carouge · fictif"),
      role: t("Permanence technique"),
      favorite: true,
    },
  );
  contact(
    t("Centrale d’engagement (fictif)"),
    t("Partenaires"),
    "022 000 00 02",
    {
      organization: t("Protection civile · fictif"),
      radio: pcCarouge,
      favorite: true,
    },
  );
  contact(
    t("Fournisseur de sacs de sable (fictif)"),
    t("Fournisseurs"),
    "022 000 00 03",
    {
      organization: t("Entreprise fictive SA"),
    },
  );

  const message = (value: Partial<Message> & Pick<Message, "body">) =>
    put("messages", { ...emptyMessage(), id: id(), ...value } as Message & {
      id: string;
    });
  const rising = message({
    receivedAt: at(8),
    from: alphaName,
    to: t("PC arrière"),
    via: t("Radio"),
    priority: "Important",
    category: t("Renseignement"),
    subject: t("Niveau de l’Arve en hausse"),
    body: t(
      "Niveau en hausse rapide au pont des Acacias, environ 20 cm en 30 minutes.",
    ),
    location: "Pont des Acacias",
    status: "Transmis",
    entryId: journal.entries[1].id,
    handledBy: "Fictive Delacrétaz",
  });
  const road = message({
    receivedAt: at(62),
    from: bravoName,
    to: pcFrontName,
    via: t("Radio"),
    priority: "Urgent",
    category: t("Alerte"),
    subject: t("Eau sur la chaussée"),
    body: t(
      "Eau sur la chaussée route de Veyrier à la hauteur de la Fontenette. Circulation dangereuse.",
    ),
    location: "Route de Veyrier",
    replyNeeded: true,
    replyBy: at(80),
  });
  message({
    receivedAt: at(70),
    from: logisticsName,
    to: t("PC arrière"),
    via: t("Téléphone"),
    category: t("Compte rendu"),
    subject: t("Sacs de sable en route"),
    body: t(
      "Deux camions partis de l’arsenal avec 200 sacs. Arrivée estimée dans 45 minutes.",
    ),
    status: "En traitement",
    handledBy: "Fictive Delacrétaz",
  });
  message({
    receivedAt: at(74),
    from: t("Police"),
    to: t("Chef d’intervention"),
    via: t("Téléphone"),
    category: t("Information"),
    subject: t("Fermeture du pont"),
    body: t("La police ferme le pont de Carouge à la circulation dès 09:30."),
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
    pcCarouge,
    "point",
    sites,
    [[46.1829, 6.1398]],
    "c57efe9980d514d6",
  );
  const pcFront = place(
    pcFrontName,
    "point",
    sites,
    [[46.1953, 6.1463]],
    "997aec2a2a12cbfc",
  );
  const flood = place(
    t("Zone inondée Acacias"),
    "area",
    effects,
    [
      [46.1941, 6.1352],
      [46.1952, 6.1391],
      [46.1938, 6.1419],
      [46.1921, 6.1402],
      [46.1918, 6.1363],
    ],
    "",
    "#3fdcff",
    t("Surface estimée d’après la reconnaissance de 08:08."),
  );
  const closure = place(
    t("Fermeture des berges"),
    "line",
    t("Mesures"),
    [
      [46.1962, 6.1441],
      [46.1956, 6.1467],
      [46.1948, 6.149],
    ],
    "",
    "#34e0a1",
  );
  const pumpPlace = place(
    t("Tonne-pompe SIS"),
    "point",
    t("Moyens"),
    [[46.1949, 6.1478]],
    "7e9d403b48f7e265",
  );
  const gathering = place(
    t("Point de rassemblement Acacias"),
    "point",
    sites,
    [[46.1912, 6.1336]],
    "35501db9d9a6e728",
  );
  const walkway = place(
    "Passerelle de la Fontenette",
    "point",
    t("Dangers"),
    [[46.1843, 6.1537]],
    "b3bc72f54c8ed2e5",
    "",
    t("Second accès aux berges encore ouvert."),
  );
  const roadPlace = place(
    t("Route de Veyrier inondée"),
    "point",
    effects,
    [[46.1861, 6.1548]],
    "85d41c22bf08bbff",
  );

  link(ref("place", pc), ref("cell", back), t("emplacement"));
  link(ref("place", pcFront), ref("cell", front), t("emplacement"));
  link(ref("place", flood), entry(1), t("reconnaissance"));
  link(ref("place", flood), ref("message", rising), t("signalé par"));
  link(ref("place", closure), entry(2), t("décision"));
  link(ref("place", closure), entry(4), t("quittance"));
  link(ref("place", pumpPlace), ref("resource", pump), t("position"));
  link(ref("place", gathering), entry(3), t("livraison"));
  link(ref("resource", trucks), entry(3), t("répond à"));
  link(ref("resource", bags), entry(3), t("répond à"));
  link(ref("resource", bags), ref("resource", trucks), t("transporté par"));
  link(ref("place", walkway), entry(5), t("concerne"));
  link(ref("place", walkway), ref("resource", bravo), t("position"));
  link(ref("place", roadPlace), ref("message", road), t("signalé par"));
  link(ref("contact", commune), ref("message", road), t("à informer"));

  const agenda = (
    minutes: number,
    title: string,
    kind: string,
    location = pcCarouge,
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
  const report = t("Rapport de conduite");
  agenda(
    0,
    t("Orientation initiale"),
    t("Orientation"),
    pcCarouge,
    t("Chef d’intervention, chefs de cellule"),
  );
  agenda(
    120,
    report,
    report,
    pcCarouge,
    t("Chefs de cellule, chef de section"),
  );
  agenda(
    210,
    t("Point presse"),
    t("Conférence de presse"),
    t("Mairie de Carouge (fictif)"),
  );
  agenda(
    360,
    report,
    report,
    pcCarouge,
    t("Chefs de cellule, chef de section"),
  );
  agenda(660, t("Relève"), t("Relève"));

  const facts: [string, string, string, string][] = [
    [t("Personnes blessées"), "0", t("pers."), t("Personnes")],
    [t("Personnes évacuées"), "12", t("pers."), t("Personnes")],
    [t("Bâtiments touchés"), "3", t("bât."), t("Bâtiments")],
    [t("Routes fermées"), "2", "", t("Infrastructures")],
    [t("Personnel engagé"), "27", t("pers."), t("Engagement")],
    [t("Niveau de l’Arve (Acacias)"), "+ 45", "cm", t("Infrastructures")],
  ];
  facts.forEach(([label, value, unit, category], order) =>
    put("facts", { id: id(), label, value, unit, category, note: "", order }),
  );
  const boards: [string, string][] = [
    [
      t("Situation générale"),
      t(
        "Crue de l’Arve après de fortes pluies. Montée d’environ 45 cm depuis 08:00 au pont des Acacias. Caves inondées quai Charles-Page.",
      ),
    ],
    [
      t("Dangers et évolution probable"),
      t(
        "Pic attendu vers 13:00. Risque de débordement sur la route de Veyrier et aux accès des berges.",
      ),
    ],
    [
      t("Intention / idée de manœuvre"),
      t(
        "Fermer et baliser tous les accès aux berges, protéger les bâtiments du quai avec des sacs de sable, garder une réserve alertée.",
      ),
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
    wind: t("SO 20 km/h"),
    precipitation: t("Pluie modérée"),
    visibility: t("Bonne"),
    conditions: t("Couvert, pluie continue"),
    notes: "",
  });
  put("alerts", {
    id: id(),
    level: "3",
    hazard: t("Fortes pluies"),
    region: t("Genève"),
    from: at(-240),
    to: at(720),
    source: t("MétéoSuisse (exemple fictif)"),
    notes: "",
  });
  put("alerts", {
    id: id(),
    level: "3",
    hazard: t("Crues"),
    region: "Arve",
    from: at(-60),
    to: at(1440),
    source: t("Canton (exemple fictif)"),
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
  // Written in the language of this post (newJournal also records it in
  // ops.settings.lang, so the référentiels match the demonstration).
  let journal = newJournal(t("Crue de l’Arve"), {
    organization: t("PCi · Exercice de démonstration"),
    location: t("Carouge · Genève"),
    reference: "EX-2026-09",
    mode: "Exercice",
  });
  // The first two hours and a half are already past: the time machine has a
  // story to replay and the due dates are recent.
  const base = demoStart(now);
  const at = (minutes: number) =>
    new Date(base + minutes * 60_000).toISOString();
  const alpha = t("Patrouille Alpha");
  const bravo = t("Équipe Bravo");
  const chief = t("Chef de section");
  const support = t("Section appui");
  const logistics = t("Logistique");
  const examples: Partial<Fields>[] = [
    {
      message: t(
        "Ouverture du poste de conduite. Début de la tenue du journal.",
      ),
      type: "Observation",
      source: t("Chef de cellule"),
      location: t("PC Carouge"),
      reliability: "Confirmé",
    },
    {
      message: t(
        "Hausse du niveau de l’Arve signalée au pont des Acacias. Reconnaissance demandée.",
      ),
      source: alpha,
      location: "Pont des Acacias",
      reliability: "À vérifier",
      priority: "Important",
      status: "À traiter",
      assignee: chief,
      action: t("Vérifier le niveau sur place et transmettre un compte rendu."),
      dueAt: at(65),
    },
    {
      message: t(
        "Fermeture préventive de l’accès aux berges décidée par la direction de l’exercice.",
      ),
      type: "Décision",
      source: t("Direction de l’exercice"),
      recipient: support,
      location: "Quai Charles-Page",
      reliability: "Confirmé",
      status: "En cours",
      assignee: support,
      action: t(
        "Mettre en place le balisage. Confirmer la fermeture des accès.",
      ),
    },
    {
      message: t(
        "Demande de 200 sacs de sable et de deux véhicules de transport.",
      ),
      type: "Demande",
      source: support,
      recipient: logistics,
      location: t("Point de rassemblement Acacias"),
      status: "À traiter",
      resources: t("200 sacs de sable · 2 véhicules"),
      assignee: logistics,
      dueAt: at(100),
    },
    {
      message: t(
        "Balisage du premier accès terminé. Aucun civil dans le périmètre.",
      ),
      type: "Quittance",
      source: bravo,
      location: "Quai Charles-Page",
      reliability: "Confirmé",
      status: "Terminé",
      reference: t("Suite de l’entrée #003"),
      action: t("Maintenir la surveillance du périmètre."),
    },
    {
      message: t(
        "Un second accès aux berges reste ouvert. Une équipe est requise pour sécuriser le passage.",
      ),
      source: bravo,
      location: "Passerelle de la Fontenette",
      priority: "Urgent",
      reliability: "Confirmé",
      status: "À traiter",
      assignee: chief,
      dueAt: at(55),
      action: t("Faire confirmer la fermeture et consigner la quittance."),
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
      i % 2 ? t("Opérateur B · fictif") : t("Opérateur A · fictif"),
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
    author: t("Opérateur · démo"),
    journals: [journal],
    activeId: journal.id,
  };
}

// ---------- History of the demonstration ----------

type Step = { m: number; by: string; patch?: object; note?: string };

/** Forecast as received at a time, rain increasing with `wet`. */
function demoForecast(fetched: number, wet: number) {
  const hour = 3_600_000;
  const start = Math.floor(fetched / hour) * hour;
  const hours = Array.from({ length: 72 }, (_, i) => {
    const time = start + i * hour;
    const h = zurichHour(time);
    const rain = Math.max(
      0,
      wet * (1.6 + Math.sin(i / 5)) - (i > 30 ? 1.5 : 0),
    );
    return {
      at: time,
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
    model: t("MétéoSuisse ICON-CH2 (exemple fictif)"),
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
  const OPERATOR_A = t("Opérateur A · fictif");
  const OPERATOR_B = t("Opérateur B · fictif");
  const MAPPER = t("Cartographe · fictif");
  const pcCarouge = t("PC Carouge");
  const arsenal = t("Arsenal");
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
    const time = Date.parse(iso);
    const start = Date.parse(at(0));
    return Number.isNaN(time)
      ? fallback
      : Math.min(130, Math.round((time - start) / 60_000));
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
    const received = at(i * 9 + 1);
    const revisions = e.revisions.map((r) => ({ ...r, at: received }));
    if (i === 1)
      revisions.push({
        ...revisions[0],
        id: crypto.randomUUID(),
        at: at(40),
        author: OPERATOR_B,
        reason: t("Niveau confirmé par la patrouille sur place"),
        fields: {
          ...revisions[0].fields,
          reliability: "Confirmé",
          status: "En cours",
        },
      });
    return { ...e, createdAt: received, revisions };
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
    [t("Équipe Bravo")]: [
      {
        m: -15,
        by: OPERATOR_B,
        patch: { status: "Disponible", location: pcCarouge, mission: "" },
      },
      {
        m: 10,
        by: OPERATOR_B,
        patch: { status: "Alerté", location: pcCarouge, mission: "" },
      },
      {
        m: 25,
        by: OPERATOR_B,
        patch: {
          status: "En route",
          mission: t("Sécuriser l’accès aux berges."),
        },
      },
      { m: 45, by: OPERATOR_A },
    ],
    [t("Patrouille Alpha")]: [
      { m: -15, by: OPERATOR_B, patch: { status: "Alerté" } },
      { m: 5, by: OPERATOR_B },
    ],
    [t("Camions de transport PCi")]: [
      {
        m: -15,
        by: OPERATOR_B,
        patch: {
          status: "Disponible",
          location: arsenal,
          mission: "",
          eta: "",
        },
      },
      {
        m: 50,
        by: OPERATOR_A,
        patch: { status: "Alerté", location: arsenal },
      },
      { m: 70, by: OPERATOR_B },
    ],
    [t("Sacs de sable")]: [
      {
        m: -15,
        by: OPERATOR_B,
        patch: { status: "Disponible", location: arsenal },
      },
      { m: 70, by: OPERATOR_B },
    ],
    [t("Tonne-pompe SIS (fictif)")]: [
      { m: 30, by: OPERATOR_A, patch: { status: "Alerté", mission: "" } },
      { m: 60, by: OPERATOR_A },
    ],
    [t("Section appui (réserve)")]: [
      { m: -15, by: OPERATOR_B, patch: { status: "Disponible" } },
      { m: 100, by: OPERATOR_A },
    ],
  };
  const resources = o.resources.map((r) =>
    track("ops.resources", r, statuses[r.name] ?? [{ m: -15, by: OPERATOR_B }]),
  );
  const factSteps: Record<string, Step[]> = {
    [t("Personnes évacuées")]: [
      { m: -10, by: OPERATOR_A, patch: { value: "0" } },
      { m: 35, by: OPERATOR_A, patch: { value: "5" } },
      { m: 85, by: OPERATOR_B },
    ],
    [t("Niveau de l’Arve (Acacias)")]: [
      { m: -10, by: OPERATOR_A, patch: { value: "+ 10" } },
      { m: 30, by: OPERATOR_B, patch: { value: "+ 25" } },
      { m: 90, by: OPERATOR_B },
    ],
    [t("Personnel engagé")]: [
      { m: -10, by: OPERATOR_A, patch: { value: "12" } },
      { m: 40, by: OPERATOR_A, patch: { value: "20" } },
      { m: 95, by: OPERATOR_A },
    ],
    [t("Bâtiments touchés")]: [
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
                body: t(
                  "Crue de l’Arve après de fortes pluies. Montée du niveau signalée au pont des Acacias.",
                ),
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
        name: t("Suivi général"),
        purpose: t("Vue d’ensemble pour le rapport de conduite"),
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
        name: t("Secteur Acacias (détail)"),
        purpose: t("Engagement au pont des Acacias et au quai Charles-Page"),
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
    if (p.label === t("PC front"))
      return [
        { m: 20, by: MAPPER, patch: { points: [[46.1962, 6.1432]] } },
        { m: 65, by: MAPPER, note: "" },
      ];
    if (p.label === t("Zone inondée Acacias"))
      return [
        { m: 15, by: MAPPER, patch: { points: shrink(p.points, 0.55) } },
        { m: 40, by: MAPPER, patch: { points: shrink(p.points, 0.8) } },
        { m: 88, by: MAPPER },
      ];
    if (p.label === t("Tonne-pompe SIS")) return [{ m: 62, by: MAPPER }];
    if (p.label === t("Route de Veyrier inondée"))
      return [{ m: 72, by: OPERATOR_B }];
    return [{ m: 8 + i * 5, by: MAPPER }];
  };
  const onMaps: Record<string, string[]> = {
    [pcCarouge]: [general],
    [t("Route de Veyrier inondée")]: [general],
    [t("Point de rassemblement Acacias")]: [detail],
    [t("Tonne-pompe SIS")]: [detail],
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
    label: t("Barrage provisoire quai Ernest-Ansermet"),
    kind: "point",
    layer: t("Mesures"),
    symbol: "b:barrage",
    color: "",
    points: [[46.1931, 6.1449]],
    notes: t("Levé après l’ouverture de la déviation."),
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
          title: t("Point de situation de 08:30"),
          at: at(30),
          notes: t("État transmis à la centrale d’engagement."),
        },
        [{ m: 31, by: OPERATOR_A }],
      ),
      track(
        "ops.snapshots",
        {
          id: crypto.randomUUID(),
          title: t("Rapport de conduite"),
          at: at(120),
          notes: t("Présenté aux chefs de cellule."),
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
          audience: t("Maire de Carouge et préfet (fictifs)"),
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
