import {
  Activity,
  BookOpen,
  CalendarClock,
  ClipboardCheck,
  CloudSun,
  Contact,
  History,
  Inbox,
  KanbanSquare,
  LifeBuoy,
  ClipboardList,
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
import { t } from "./i18n-modules.ts";

// Labels are getters: they are read in the language of the post at the
// moment they are shown (see shared/i18n/core.ts).
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
    get label() {
      return t("Situation");
    },
    get short() {
      return t("Situation");
    },
    icon: Activity,
    hue: 250,
    group: 0,
    core: true,
    get description() {
      return t(
        "Vue d’ensemble : renseignements clés, points ouverts, moyens, météo, prochains rapports.",
      );
    },
  },
  {
    id: "journal",
    get label() {
      return t("Journal d’intervention");
    },
    get short() {
      return t("Journal");
    },
    icon: BookOpen,
    hue: 212,
    group: 0,
    core: true,
    get description() {
      return t(
        "Registre chronologique et numéroté de tout ce qui se passe, se décide et se transmet.",
      );
    },
  },
  {
    id: "messages",
    get label() {
      return t("Messages");
    },
    get short() {
      return t("Messages");
    },
    icon: Inbox,
    hue: 265,
    group: 0,
    get description() {
      return t(
        "Réception et synthèse des messages avant leur inscription au journal.",
      );
    },
  },
  {
    id: "missions",
    get label() {
      return t("Missions et suivi");
    },
    get short() {
      return t("Missions");
    },
    icon: KanbanSquare,
    hue: 30,
    group: 0,
    get description() {
      return t("Tableau des missions, demandes et points à suivre, par état.");
    },
  },
  {
    id: "tasks",
    get label() {
      return t("Mes tâches");
    },
    get short() {
      return t("Mes tâches");
    },
    icon: ListChecks,
    hue: 140,
    group: 0,
    get description() {
      return t(
        "Ce qui est attribué à la fonction de ce poste ou à son opérateur, le plus en retard d’abord.",
      );
    },
  },
  {
    id: "orders",
    get label() {
      return t("Ordres et diffusions");
    },
    get short() {
      return t("Ordres");
    },
    icon: ScrollText,
    hue: 18,
    group: 0,
    get description() {
      return t(
        "Ordres en cinq points, diffusions avec accusé de lecture, liaison avec l’autre PC.",
      );
    },
  },
  {
    id: "checklists",
    get label() {
      return t("Listes de contrôle");
    },
    get short() {
      return t("Listes");
    },
    icon: ClipboardList,
    hue: 96,
    group: 0,
    get description() {
      return t(
        "Ce qu’il ne faut pas oublier par type d’événement : étapes, fonction responsable, contrôles à suivre.",
      );
    },
  },
  {
    id: "map",
    get label() {
      return t("Carte de situation");
    },
    get short() {
      return t("Carte");
    },
    icon: Map,
    hue: 160,
    group: 1,
    get description() {
      return t(
        "Carte swisstopo avec signes, zones, tracés et tout ce qui y est lié.",
      );
    },
  },
  {
    id: "resources",
    get label() {
      return t("Moyens");
    },
    get short() {
      return t("Moyens");
    },
    icon: Truck,
    hue: 28,
    group: 1,
    get description() {
      return t(
        "Véhicules, personnel et matériel engagés ou disponibles, avec leur état.",
      );
    },
  },
  {
    id: "team",
    get label() {
      return t("Équipe et postes");
    },
    get short() {
      return t("Équipe");
    },
    icon: Users,
    hue: 330,
    group: 1,
    get description() {
      return t(
        "Qui fait quoi : PC front, PC arrière, cellules, fonctions, grades, présences.",
      );
    },
  },
  {
    id: "radio",
    get label() {
      return t("Réseau radio");
    },
    get short() {
      return t("Radio");
    },
    icon: Radio,
    hue: 120,
    group: 1,
    get description() {
      return t(
        "Plan Polycom : groupes, noms d’appel, terminaux, remises et contrôles de liaison.",
      );
    },
  },
  {
    id: "contacts",
    get label() {
      return t("Contacts");
    },
    get short() {
      return t("Contacts");
    },
    icon: Contact,
    hue: 190,
    group: 2,
    get description() {
      return t(
        "Annuaire des partenaires, autorités, fournisseurs et numéros d’urgence.",
      );
    },
  },
  {
    id: "weather",
    get label() {
      return t("Météo");
    },
    get short() {
      return t("Météo");
    },
    icon: CloudSun,
    hue: 38,
    group: 2,
    get description() {
      return t("Prévisions, observations sur place et alertes de danger.");
    },
  },
  {
    id: "agenda",
    get label() {
      return t("Rythme de conduite");
    },
    get short() {
      return t("Agenda");
    },
    icon: CalendarClock,
    hue: 48,
    group: 2,
    get description() {
      return t(
        "Rapports, orientations, relèves et rendez-vous, avec compte à rebours.",
      );
    },
  },
  {
    id: "network",
    get label() {
      return t("Réseau des liens");
    },
    get short() {
      return t("Liens");
    },
    icon: Network,
    hue: 285,
    group: 3,
    get description() {
      return t(
        "Toutes les informations et ce qui les relie, comme un réseau de neurones.",
      );
    },
  },
  {
    id: "trace",
    get label() {
      return t("Traçabilité et versions");
    },
    get short() {
      return t("Traçabilité");
    },
    icon: History,
    hue: 175,
    group: 3,
    get description() {
      return t(
        "Qui a fait quoi et quand, versions de tout, comparaisons, exports et présentations.",
      );
    },
  },
  {
    id: "debrief",
    get label() {
      return t("Débriefing et exercice");
    },
    get short() {
      return t("RETEX");
    },
    icon: ClipboardCheck,
    hue: 12,
    group: 3,
    get description() {
      return t(
        "Relecture de l’opération, chiffres de la conduite, points à retenir ; scénario et injects de la direction d’exercice.",
      );
    },
  },
  {
    id: "docs",
    get label() {
      return t("Aide et documentation");
    },
    get short() {
      return t("Aide");
    },
    icon: LifeBuoy,
    hue: 200,
    group: 3,
    core: true,
    get description() {
      return t("Comment utiliser chaque fonction, en bref ou en détail.");
    },
  },
];
export const moduleInfo = (id: string) =>
  MODULES.find((m) => m.id === id) ?? MODULES[0];
export const MODULE_IDS = MODULES.map((m) => m.id);
