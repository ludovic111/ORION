import {
  addEntry,
  emptyFields,
  newJournal,
  updateRadio,
  type Workspace,
  type Fields,
} from "../../shared/journal.ts";
import {
  emptyRadio,
  issueTerminal,
  returnTerminal,
  terminalSeries,
  type Radio,
  type Talkgroup,
} from "../../shared/radio.ts";

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
export function demoWorkspace(): Workspace {
  let journal = newJournal("Crue de l’Arve", {
    organization: "PCi · Exercice de démonstration",
    location: "Carouge · Genève",
    reference: "EX-2026-09",
    mode: "Exercice",
  });
  const base = new Date();
  base.setHours(8, 0, 0, 0);
  const at = (minutes: number) =>
    new Date(base.getTime() + minutes * 60_000).toISOString();
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
  return {
    version: 1,
    author: "Opérateur · démo",
    journals: [journal],
    activeId: journal.id,
  };
}
