import {
  BookOpen,
  Download,
  FileUp,
  Lightbulb,
  LockKeyhole,
  LogOut,
  MonitorSmartphone,
  Moon,
  Plus,
  Settings2,
  Shield,
  Sun,
  Trash2,
  Tv,
  Wifi,
} from "lucide-react";
import type { Journal, Workspace } from "../../shared/journal";
import { Popover } from "../ui/Popover";
import type { SettingsTab } from "./Settings";
import { enumLabel } from "../../shared/i18n/enums.ts";
import { t, tn } from "./i18n.ts";

/** Menu of the journals of the session (top bar). */
export function JournalMenu({
  anchor,
  workspace,
  journal,
  dirty,
  onClose,
  onSwitch,
  onNew,
  onImport,
  onExport,
  onSettings,
  onRemove,
}: {
  anchor: HTMLElement;
  workspace: Workspace;
  journal: Journal;
  dirty: boolean;
  onClose: () => void;
  onSwitch: (id: string) => void;
  onNew: () => void;
  onImport: () => void;
  onExport: () => void;
  onSettings: (tab: SettingsTab) => void;
  onRemove: () => void;
}) {
  return (
    <Popover anchor={anchor} onClose={onClose}>
      <div className="menu-label">{t("Journaux de la session")}</div>
      {workspace.journals.map((j) => (
        <button
          key={j.id}
          aria-current={j.id === journal.id ? "true" : undefined}
          onClick={() => (j.id === journal.id ? onClose() : onSwitch(j.id))}
        >
          <BookOpen size={15} />
          <span>
            {j.title}
            <small>
              {j.closedAt ? t("Clôturé") : enumLabel(j.mode)} ·{" "}
              {tn(j.entries.length, "{n} entrées (1)", "{n} entrées")} ·{" "}
              {tn(j.ops.messages.length, "{n} messages (1)", "{n} messages")}
            </small>
          </span>
        </button>
      ))}
      <hr />
      <button data-close onClick={onNew}>
        <Plus size={15} />
        {t("Nouveau journal")}
      </button>
      <button data-close onClick={onImport}>
        <FileUp size={15} />
        {t("Importer un fichier")}
      </button>
      <button data-close onClick={onExport}>
        <Download size={15} />
        {t("Exporter (tous formats)")}
        {dirty && <span className="pill warn">{t("à faire")}</span>}
      </button>
      <button data-close onClick={() => onSettings("session")}>
        <Settings2 size={15} />
        {t("Propriétés, clôture")}
      </button>
      <button data-close onClick={onRemove}>
        <Trash2 size={15} />
        {t("Retirer ce journal de la session")}
      </button>
    </Popover>
  );
}

/** Menu of the operator (top bar): settings, session, install, source. */
export function OperatorMenu({
  anchor,
  author,
  persistent,
  installed,
  status,
  theme,
  onClose,
  onSettings,
  onPrivacy,
  onInstall,
  onTheme,
  onEnd,
  onWall,
}: {
  anchor: HTMLElement;
  author: string;
  persistent: boolean;
  installed: boolean;
  status: string;
  theme: string;
  onClose: () => void;
  onSettings: (tab: SettingsTab) => void;
  onPrivacy: () => void;
  onInstall: () => void;
  onTheme: () => void;
  onEnd: () => void;
  /** Wall screen of the room (src/wall/WallScreen.tsx). */
  onWall?: () => void;
}) {
  return (
    <Popover anchor={anchor} onClose={onClose} align="end">
      <div className="menu-label">{author}</div>
      <button data-close onClick={() => onSettings("post")}>
        <Settings2 size={15} />
        <span>
          {t("Réglages du poste")}
          <small>{t("Thème, modules, impression automatique")}</small>
        </span>
      </button>
      <button data-close className="show-phone" onClick={onTheme}>
        {theme === "light" ? <Moon size={15} /> : <Sun size={15} />}
        {theme === "light" ? t("Thème sombre") : t("Thème clair")}
      </button>
      <button data-close onClick={() => onSettings("lists")}>
        <BookOpen size={15} />
        <span>
          {t("Référentiels")}
          <small>{t("Destinataires, catégories, grades… standards")}</small>
        </span>
      </button>
      <button data-close onClick={() => onSettings("sync")}>
        <Wifi size={15} />
        <span>
          {t("Synchronisation")}
          <small>
            {t("Travailler à plusieurs postes sur la même session")}
          </small>
        </span>
      </button>
      <button data-close onClick={() => onSettings("session")}>
        <LockKeyhole size={15} />
        <span>
          {t("Session et sauvegarde")}
          <small>
            {t("Opérateur, phrase de récupération, fin de session")}
          </small>
        </span>
      </button>
      {onWall && (
        <button data-close onClick={onWall}>
          <Tv size={15} />
          <span>
            {t("Écran mural")}
            <small>{t("Grand écran de la salle, lecture seule")}</small>
          </span>
        </button>
      )}
      <hr />
      <button data-close onClick={onPrivacy}>
        <Shield size={15} />
        {t("Sécurité et données")}
      </button>
      <button data-close onClick={() => onSettings("contact")}>
        <Lightbulb size={15} />
        <span>
          {t("Une idée, un besoin ?")}
          <small>{t("Proposer une amélioration à l’auteur")}</small>
        </span>
      </button>
      {!installed && (
        <button data-close onClick={onInstall}>
          <MonitorSmartphone size={15} />
          {t("Installer l’application")}
        </button>
      )}
      <a className="menu-link" href="/source/orion-aic-source.tar.gz" download>
        <Download size={15} />
        {t("Code source · AGPL-3.0")}
      </a>
      <hr />
      <button data-close onClick={onEnd}>
        {persistent ? <LockKeyhole size={15} /> : <LogOut size={15} />}
        {persistent ? t("Verrouiller") : t("Fermer la session")}
      </button>
      <div className="menu-label">{status}</div>
    </Popover>
  );
}
