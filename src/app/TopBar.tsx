import {
  ChevronDown,
  History,
  MonitorPlay,
  Moon,
  Search,
  Sun,
} from "lucide-react";
import type { Journal } from "../../shared/journal";
import { Brand } from "../ui/Mark";
import { Clock } from "../ui/Clock";
import type { useSync } from "../sync/useSync";
import { moduleInfo } from "./modules";
import { enumLabel } from "../../shared/i18n/enums.ts";
import { t, tn } from "./i18n.ts";

type Sync = ReturnType<typeof useSync>;

/** Top bar of the shell: journal switch, search, status, operator. */
export function TopBar({
  journal,
  author,
  sync,
  saveState,
  persistent,
  online,
  viewAt,
  theme,
  onJournalMenu,
  onOperatorMenu,
  onPalette,
  onSync,
  onTimeMachine,
  onPresent,
  onTheme,
}: {
  journal: Journal;
  author: string;
  sync: Sync;
  saveState: string;
  persistent: boolean;
  online: boolean;
  viewAt: number | null;
  theme: string;
  onJournalMenu: (anchor: HTMLElement) => void;
  onOperatorMenu: (anchor: HTMLElement) => void;
  onPalette: () => void;
  onSync: () => void;
  onTimeMachine: () => void;
  onPresent: () => void;
  onTheme: () => void;
}) {
  const peersShown = sync.peers.slice(0, 4);
  return (
    <header className="bar">
      <Brand />
      <button
        className="journal-switch"
        onClick={(e) => onJournalMenu(e.currentTarget)}
        title={t("Journaux de la session")}
        aria-haspopup="menu"
      >
        <span className={`state-dot ${journal.closedAt ? "closed" : ""}`} />
        <strong>{journal.title}</strong>
        <small>
          {journal.closedAt ? t("Clôturé") : enumLabel(journal.mode)}
        </small>
        <ChevronDown size={14} />
      </button>
      <button
        className="command-trigger"
        onClick={onPalette}
        aria-label={t("Rechercher ou agir partout (⌘K)")}
      >
        <Search size={15} />
        <span>
          {t("Rechercher ou agir")}
          <span className="wide">{t("… partout")}</span>
        </span>
        <kbd>⌘K</kbd>
      </button>
      <div className="bar-status">
        <button
          className={`status-chip ${sync.status === "live" ? "live" : sync.status === "retrying" || sync.status === "outdated" ? "warn" : ""}`}
          onClick={onSync}
          title={
            sync.status === "off"
              ? t(
                  "Synchronisation désactivée : partager la session avec d’autres postes",
                )
              : sync.status === "outdated"
                ? sync.error
                : [
                    sync.status === "live"
                      ? t("Synchronisation active")
                      : t("Synchronisation en reconnexion"),
                    tn(
                      sync.relayCount,
                      "{n} autre(s) poste(s) (1)",
                      "{n} autre(s) poste(s)",
                    ),
                    ...(sync.conflictCount
                      ? [
                          tn(
                            sync.conflictCount,
                            "{n} fusion(s) à voir (1)",
                            "{n} fusion(s) à voir",
                          ),
                        ]
                      : []),
                  ].join(" · ")
          }
        >
          <span className={`radar ${sync.status === "live" ? "" : "idle"}`} />
          <span className="status-text">
            {sync.status === "off"
              ? t("Seul")
              : sync.status === "outdated"
                ? t("Recharger")
                : sync.status === "live"
                  ? tn(sync.relayCount + 1, "{n} poste", "{n} postes")
                  : t("Reconnexion")}
          </span>
          {sync.conflictCount > 0 && (
            <span className="mono">· {sync.conflictCount}</span>
          )}
          {peersShown.length > 0 && (
            <span className="avatars">
              {peersShown.map((p) => (
                <span
                  key={p.peer}
                  title={`${p.name} · ${moduleInfo(p.module).short}`}
                  style={{
                    ["--h" as string]: (p.name.charCodeAt(0) * 47) % 360,
                  }}
                >
                  {p.name.slice(0, 2).toUpperCase()}
                </span>
              ))}
            </span>
          )}
        </button>
        <span
          className={`status-chip hide-narrow ${saveState === "error" ? "crit" : persistent ? "ok" : "warn"}`}
          title={
            persistent
              ? t("Sauvegarde chiffrée sur ce poste")
              : t("Session temporaire : exportez avant de fermer")
          }
        >
          <span className="dot" />
          {saveState === "error"
            ? t("Échec sauvegarde")
            : saveState === "saving"
              ? t("Sauvegarde…")
              : persistent
                ? t("Chiffré")
                : t("Temporaire")}
        </span>
        {!online && (
          <span
            className="status-chip warn hide-narrow"
            title={t("Hors ligne")}
          >
            <span className="dot" />
            {t("Hors ligne")}
          </span>
        )}
        <Clock />
        <button
          className={`icon-button${viewAt !== null ? " active" : ""}`}
          onClick={onTimeMachine}
          aria-label={
            viewAt !== null
              ? t("Revenir à l’état actuel")
              : t("Remonter le temps")
          }
          aria-pressed={viewAt !== null}
          title={t(
            "Remonter le temps : revoir l’opération à n’importe quelle heure",
          )}
        >
          <History size={16} />
        </button>
        <button
          className="icon-button hide-narrow"
          onClick={onPresent}
          aria-label={t("Présenter la situation")}
          title={t("Présenter la situation (plein écran)")}
        >
          <MonitorPlay size={16} />
        </button>
        <button
          className="icon-button hide-phone"
          onClick={onTheme}
          aria-label={theme === "light" ? t("Thème sombre") : t("Thème clair")}
          title={theme === "light" ? t("Thème sombre") : t("Thème clair")}
        >
          {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
        </button>
        <button
          className="operator"
          onClick={(e) => onOperatorMenu(e.currentTarget)}
          title={t("Opérateur, réglages et session")}
          aria-haspopup="menu"
        >
          <span className="avatar">{author.slice(0, 2).toUpperCase()}</span>
          <span className="operator-name">{author}</span>
        </button>
      </div>
    </header>
  );
}
