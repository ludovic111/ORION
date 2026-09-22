import {
  addEntry,
  emptyFields,
  newJournal,
  type Workspace,
  type Fields,
} from "../../shared/journal.ts";
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
  return {
    version: 1,
    author: "Opérateur · démo",
    journals: [journal],
    activeId: journal.id,
  };
}
