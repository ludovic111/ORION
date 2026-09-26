import {
  BookOpen,
  ClipboardCheck,
  Download,
  FileText,
  FileUp,
  History,
  Inbox,
  Lightbulb,
  ListChecks,
  Megaphone,
  ScrollText,
  Moon,
  Plus,
  Presentation,
  Printer,
  Settings2,
  Snowflake,
  Sun,
  Tv,
  UsersRound,
  Wifi,
  Palette as Swatch,
} from "lucide-react";
import type { Module, Ref } from "../../shared/links";
import type { Command } from "../ui/Palette";
import { PALETTES } from "./palettes";
import type { Prefs } from "./prefs";
import type { Overlay } from "./overlays";
import type { ExportPreset } from "./context";
import { dict, t } from "./i18n.ts";

type Key = keyof typeof dict & string;
/** Search words in the language of the post, the French ones kept too. */
const kw = (words: Key) => {
  const translated = t(words);
  return translated === words ? words : `${translated} ${words}`;
};

/** Actions of the ⌘K palette. */
export function buildCommands({
  viewAt,
  prefs,
  setPrefs,
  setViewAt,
  compose,
  go,
  setFocus,
  open,
  exportCenter,
  openImport,
  newJournal,
}: {
  viewAt: number | null;
  prefs: Prefs;
  setPrefs: (patch: Partial<Prefs>) => void;
  setViewAt: (at: number | null) => void;
  compose: () => void;
  go: (module: Module) => void;
  setFocus: (ref: Ref | null) => void;
  open: (overlay: Overlay) => void;
  exportCenter: (preset?: ExportPreset) => void;
  openImport: () => void;
  newJournal: () => void;
}): Command[] {
  const nextTheme = prefs.theme === "light" ? "dark" : "light";
  return [
    {
      id: "new-entry",
      label: t("Nouvelle entrée au journal"),
      icon: <Plus size={16} />,
      run: compose,
      keywords: kw("consigner message journal"),
    },
    {
      id: "new-message",
      label: t("Nouveau message reçu"),
      icon: <Inbox size={16} />,
      run: () => {
        go("messages");
        setFocus("message:new" as Ref);
      },
      keywords: kw("réception synthèse"),
    },
    {
      id: "new-order",
      label: t("Nouvel ordre"),
      icon: <ScrollText size={16} />,
      run: () => {
        go("orders");
        setFocus("order:new" as Ref);
      },
      keywords: kw("ordre engagement complémentaire intention missions"),
    },
    {
      id: "new-broadcast",
      label: t("Diffuser avec accusé de lecture"),
      icon: <Megaphone size={16} />,
      run: () => {
        go("orders");
        setFocus("broadcast:new" as Ref);
      },
      keywords: kw("diffusion lu compris quittance destinataires"),
    },
    {
      id: "report",
      label: t("Rapport de situation A4"),
      icon: <FileText size={16} />,
      run: () => open({ kind: "dialog", name: "report" }),
    },
    {
      id: "export",
      label: t("Exporter (tous formats)"),
      icon: <Download size={16} />,
      run: () => exportCenter(),
      keywords: kw("archive pdf excel word powerpoint pptx imprimer"),
    },
    {
      id: "checklist",
      label: t("Démarrer une liste de contrôle"),
      icon: <ListChecks size={16} />,
      run: () => {
        go("checklists");
        setFocus("checklist:new" as Ref);
      },
      keywords: kw(
        "crue black-out canicule séisme tempête abc recherche évacués ouverture pc",
      ),
    },
    {
      id: "resource-request",
      label: t("Nouvelle demande de moyens"),
      icon: <Megaphone size={16} />,
      run: () => {
        go("resources");
        setFocus("request:new" as Ref);
      },
      keywords: kw("moyens renfort matériel demandé accordé arrivé"),
    },
    {
      id: "handover",
      label: t("Relève : que s’est-il passé depuis…"),
      icon: <UsersRound size={16} />,
      run: () => open({ kind: "dialog", name: "handover" }),
      keywords: kw("résumé relève depuis passation"),
    },
    {
      id: "time-machine",
      label:
        viewAt === null ? t("Remonter le temps") : t("Revenir à l’état actuel"),
      icon: <History size={16} />,
      run: () => setViewAt(viewAt === null ? Date.now() : null),
      keywords: kw("historique versions heure rejouer replay passé"),
    },
    {
      id: "snapshot",
      label: t("Figer un point de situation"),
      icon: <Snowflake size={16} />,
      run: () => open({ kind: "dialog", name: "snapshot" }),
      keywords: kw("version nommée point situation heure"),
    },
    {
      id: "present",
      label: t("Présenter la situation"),
      icon: <Presentation size={16} />,
      run: () => open({ kind: "present", mode: "present" }),
      keywords: kw("présentation diaporama autorités visite powerpoint"),
    },
    {
      id: "wall-screen",
      label: t("Écran mural de la salle de conduite"),
      icon: <Tv size={16} />,
      run: () => open({ kind: "wall" }),
      keywords: kw(
        "mur grand écran projecteur salle kiosque tv affichage #mur",
      ),
    },
    {
      id: "wall",
      label: t("Affichage mural en diaporama"),
      icon: <Tv size={16} />,
      run: () => open({ kind: "present", mode: "wall" }),
      keywords: kw("écran projecteur salle kiosque diapositives boucle"),
    },
    {
      id: "debrief",
      label: t("Débriefing et exercice (RETEX)"),
      icon: <ClipboardCheck size={16} />,
      run: () => go("debrief"),
      keywords: kw(
        "retex retour expérience exercice inject scénario direction relecture",
      ),
    },
    {
      id: "trace",
      label: t("Traçabilité : qui a fait quoi"),
      icon: <History size={16} />,
      run: () => go("trace"),
      keywords: kw("historique audit comparer vérifier export"),
    },
    {
      id: "import",
      label: t("Importer un fichier"),
      icon: <FileUp size={16} />,
      run: openImport,
    },
    {
      id: "sync",
      label: t("Synchroniser avec d’autres postes"),
      icon: <Wifi size={16} />,
      run: () => open({ kind: "settings", tab: "sync" }),
      keywords: kw("partager session code qr réseau"),
    },
    {
      id: "print-toggle",
      label: prefs.autoPrint
        ? t("Désactiver l’impression automatique")
        : t("Activer l’impression automatique"),
      icon: <Printer size={16} />,
      run: () => setPrefs({ autoPrint: !prefs.autoPrint }),
    },
    {
      id: "theme",
      label: prefs.theme === "light" ? t("Thème sombre") : t("Thème clair"),
      icon: prefs.theme === "light" ? <Moon size={16} /> : <Sun size={16} />,
      run: () => setPrefs({ theme: nextTheme }),
    },
    ...PALETTES.map((p): Command => ({
      id: `palette-${p.id}`,
      label: t("Thème {name}", { name: p.label }),
      icon: <Swatch size={16} />,
      run: () =>
        setPrefs(
          p.mode === "light"
            ? { lightPalette: p.id, theme: "light" }
            : { darkPalette: p.id, theme: "dark" },
        ),
      keywords: `${kw("couleurs apparence")} ${p.mode === "light" ? kw("clair") : kw("sombre")} ${p.hint}`,
    })),
    {
      id: "settings",
      label: t("Réglages et référentiels"),
      icon: <Settings2 size={16} />,
      run: () => open({ kind: "settings", tab: "post" }),
      keywords: kw("listes standards destinataires modules"),
    },
    {
      id: "contact",
      label: t("Proposer une amélioration (contacter l’auteur)"),
      icon: <Lightbulb size={16} />,
      run: () => open({ kind: "settings", tab: "contact" }),
      keywords: kw("idée besoin contact email suggestion bug demande"),
    },
    {
      id: "new-journal",
      label: t("Nouveau journal dans la session"),
      icon: <BookOpen size={16} />,
      run: newJournal,
    },
  ];
}
