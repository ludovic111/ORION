import {
  Activity,
  BookOpen,
  CalendarClock,
  CloudSun,
  Contact,
  History,
  Inbox,
  KanbanSquare,
  LifeBuoy,
  ListChecks,
  Map,
  Network,
  Radio,
  ScrollText,
  Truck,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { Module } from "../../shared/links";

export type ModuleInfo = {
  id: Module;
  label: string;
  short: string;
  icon: LucideIcon;
  hue: number;
  /** One sentence shown in the dock tooltip and module header. */
  description: string;
  group: 0 | 1 | 2 | 3;
  /** Cannot be hidden. */
  core?: boolean;
};

export const MODULES: ModuleInfo[] = [
  {
    id: "situation",
    label: "Situation",
    short: "Situation",
    icon: Activity,
    hue: 250,
    group: 0,
    core: true,
    description:
      "Vue d’ensemble : renseignements clés, points ouverts, moyens, météo, prochains rapports.",
  },
  {
    id: "journal",
    label: "Journal d’intervention",
    short: "Journal",
    icon: BookOpen,
    hue: 212,
    group: 0,
    core: true,
    description:
      "Registre chronologique et numéroté de tout ce qui se passe, se décide et se transmet.",
  },
  {
    id: "messages",
    label: "Messages",
    short: "Messages",
    icon: Inbox,
    hue: 265,
    group: 0,
    description:
      "Réception et synthèse des messages avant leur inscription au journal.",
  },
  {
    id: "missions",
    label: "Missions et suivi",
    short: "Missions",
    icon: KanbanSquare,
    hue: 30,
    group: 0,
    description: "Tableau des missions, demandes et points à suivre, par état.",
  },
  {
    id: "tasks",
    label: "Mes tâches",
    short: "Mes tâches",
    icon: ListChecks,
    hue: 140,
    group: 0,
    description:
      "Ce qui est attribué à la fonction de ce poste ou à son opérateur, le plus en retard d’abord.",
  },
  {
    id: "orders",
    label: "Ordres et diffusions",
    short: "Ordres",
    icon: ScrollText,
    hue: 18,
    group: 0,
    description:
      "Ordres en cinq points, diffusions avec accusé de lecture, liaison avec l’autre PC.",
  },
  {
    id: "map",
    label: "Carte de situation",
    short: "Carte",
    icon: Map,
    hue: 160,
    group: 1,
    description:
      "Carte swisstopo avec signes, zones, tracés et tout ce qui y est lié.",
  },
  {
    id: "resources",
    label: "Moyens",
    short: "Moyens",
    icon: Truck,
    hue: 28,
    group: 1,
    description:
      "Véhicules, personnel et matériel engagés ou disponibles, avec leur état.",
  },
  {
    id: "team",
    label: "Équipe et postes",
    short: "Équipe",
    icon: Users,
    hue: 330,
    group: 1,
    description:
      "Qui fait quoi : PC front, PC arrière, cellules, fonctions, grades, présences.",
  },
  {
    id: "radio",
    label: "Réseau radio",
    short: "Radio",
    icon: Radio,
    hue: 120,
    group: 1,
    description:
      "Plan Polycom : groupes, noms d’appel, terminaux, remises et contrôles de liaison.",
  },
  {
    id: "contacts",
    label: "Contacts",
    short: "Contacts",
    icon: Contact,
    hue: 190,
    group: 2,
    description:
      "Annuaire des partenaires, autorités, fournisseurs et numéros d’urgence.",
  },
  {
    id: "weather",
    label: "Météo",
    short: "Météo",
    icon: CloudSun,
    hue: 38,
    group: 2,
    description: "Prévisions, observations sur place et alertes de danger.",
  },
  {
    id: "agenda",
    label: "Rythme de conduite",
    short: "Agenda",
    icon: CalendarClock,
    hue: 48,
    group: 2,
    description:
      "Rapports, orientations, relèves et rendez-vous, avec compte à rebours.",
  },
  {
    id: "network",
    label: "Réseau des liens",
    short: "Liens",
    icon: Network,
    hue: 285,
    group: 3,
    description:
      "Toutes les informations et ce qui les relie, comme un réseau de neurones.",
  },
  {
    id: "trace",
    label: "Traçabilité et versions",
    short: "Traçabilité",
    icon: History,
    hue: 175,
    group: 3,
    description:
      "Qui a fait quoi et quand, versions de tout, comparaisons, exports et présentations.",
  },
  {
    id: "docs",
    label: "Aide et documentation",
    short: "Aide",
    icon: LifeBuoy,
    hue: 200,
    group: 3,
    core: true,
    description: "Comment utiliser chaque fonction, en bref ou en détail.",
  },
];
export const moduleInfo = (id: string) =>
  MODULES.find((m) => m.id === id) ?? MODULES[0];
export const MODULE_IDS = MODULES.map((m) => m.id);
