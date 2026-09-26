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
        title="Journaux de la session"
        aria-haspopup="menu"
      >
        <span className={`state-dot ${journal.closedAt ? "closed" : ""}`} />
        <strong>{journal.title}</strong>
        <small>{journal.closedAt ? "Clôturé" : journal.mode}</small>
        <ChevronDown size={14} />
      </button>
      <button
        className="command-trigger"
        onClick={onPalette}
        aria-label="Rechercher ou agir partout (⌘K)"
      >
        <Search size={15} />
        <span>
          Rechercher ou agir<span className="wide">… partout</span>
        </span>
        <kbd>⌘K</kbd>
      </button>
      <div className="bar-status">
        <button
          className={`status-chip ${sync.status === "live" ? "live" : sync.status === "retrying" || sync.status === "outdated" ? "warn" : ""}`}
          onClick={onSync}
          title={
            sync.status === "off"
              ? "Synchronisation désactivée : partager la session avec d’autres postes"
              : sync.status === "outdated"
                ? sync.error
                : `Synchronisation ${sync.status === "live" ? "active" : "en reconnexion"} · ${sync.relayCount} autre(s) poste(s)${sync.conflictCount ? ` · ${sync.conflictCount} fusion(s) à voir` : ""}`
          }
        >
          <span className={`radar ${sync.status === "live" ? "" : "idle"}`} />
          <span className="status-text">
            {sync.status === "off"
              ? "Seul"
              : sync.status === "outdated"
                ? "Recharger"
                : sync.status === "live"
                  ? `${sync.relayCount + 1} poste${sync.relayCount ? "s" : ""}`
                  : "Reconnexion"}
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
              ? "Sauvegarde chiffrée sur ce poste"
              : "Session temporaire : exportez avant de fermer"
          }
        >
          <span className="dot" />
          {saveState === "error"
            ? "Échec sauvegarde"
            : saveState === "saving"
              ? "Sauvegarde…"
              : persistent
                ? "Chiffré"
                : "Temporaire"}
        </span>
        {!online && (
          <span className="status-chip warn hide-narrow" title="Hors ligne">
            <span className="dot" />
            Hors ligne
          </span>
        )}
        <Clock />
        <button
          className={`icon-button${viewAt !== null ? " active" : ""}`}
          onClick={onTimeMachine}
          aria-label={
            viewAt !== null ? "Revenir à l’état actuel" : "Remonter le temps"
          }
          aria-pressed={viewAt !== null}
          title="Remonter le temps : revoir l’opération à n’importe quelle heure"
        >
          <History size={16} />
        </button>
        <button
          className="icon-button hide-narrow"
          onClick={onPresent}
          aria-label="Présenter la situation"
          title="Présenter la situation (plein écran)"
        >
          <MonitorPlay size={16} />
        </button>
        <button
          className="icon-button hide-phone"
          onClick={onTheme}
          aria-label={theme === "light" ? "Thème sombre" : "Thème clair"}
          title={theme === "light" ? "Thème sombre" : "Thème clair"}
        >
          {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
        </button>
        <button
          className="operator"
          onClick={(e) => onOperatorMenu(e.currentTarget)}
          title="Opérateur, réglages et session"
          aria-haspopup="menu"
        >
          <span className="avatar">{author.slice(0, 2).toUpperCase()}</span>
          <span className="operator-name">{author}</span>
        </button>
      </div>
    </header>
  );
}
