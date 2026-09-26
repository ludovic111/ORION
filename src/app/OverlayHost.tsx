import { Suspense, type ComponentType } from "react";
import {
  current,
  dateTime,
  emptyFields,
  numberLabel,
  type Fields,
  type Journal,
  type Workspace,
} from "../../shared/journal";
import { EntryForm } from "../journal/EntryForm";
import { EntryDetail } from "../journal/EntryDetail";
import { JournalSetup } from "../journal/JournalSetup";
import { Modal } from "../journal/Modal";
import { Privacy } from "../journal/Privacy";
import { Handover } from "../journal/Handover";
import { ImportModal } from "../journal/Transfer";
import { ReportDialog } from "../journal/ReportDialog";
import { PrintPreview } from "../print/PrintPreview";
import { InstallHelp } from "../ui/Install";
import { TraceSheet } from "../timeline/TraceSheet";
import { SnapshotDialog } from "../timeline/SnapshotDialog";
import type { ExportScope } from "../export/scope";
import type { useSync } from "../sync/useSync";
import { SettingsDialog } from "./Settings";
import type { Overlays } from "./overlays";
import type { JournalActions } from "./useJournalActions";
import type { ExportPreset } from "./context";

type Views = {
  PresentationMode: ComponentType<{
    mode: "present" | "wall";
    preset?: Partial<ExportScope>;
    onClose: () => void;
  }>;
  ExportCenter: ComponentType<{
    preset: ExportPreset;
    onClose: () => void;
    onBackup: () => void;
  }>;
};

/**
 * Renders the overlays of the shell from the overlay stack (one per kind,
 * the last opened on top): entry sheet, dialogs, settings, print preview,
 * history, presentation.
 */
export function OverlayHost({
  overlays,
  views: { PresentationMode, ExportCenter },
  workspace,
  journal,
  view,
  viewAt,
  readOnly,
  minute,
  persistent,
  stored,
  sync,
  suggestions,
  draft,
  actions,
  notify,
  discardDraft,
  onDraft,
  onTyping,
  onAdd,
  onCreate,
  onImport,
  onBackup,
  onProtect,
  onUpdateWorkspace,
  onEnd,
  onFinish,
  takeOverMessage,
}: {
  overlays: Overlays;
  views: Views;
  workspace: Workspace;
  /** Live journal. */
  journal: Journal;
  /** Journal shown (a past version in the time machine). */
  view: Journal;
  viewAt: number | null;
  readOnly: boolean;
  minute: number;
  persistent: boolean;
  stored: boolean;
  sync: ReturnType<typeof useSync>;
  suggestions: string[];
  draft: Fields | undefined;
  actions: JournalActions;
  notify: (message: string) => void;
  discardDraft: () => boolean;
  onDraft: (fields: Fields) => void;
  onTyping: () => void;
  onAdd: (fields: Fields) => boolean;
  onCreate: (value: Journal, author: string, password?: string) => void;
  onImport: (value: Journal, merge: boolean, author?: string) => void;
  onBackup: () => void;
  onProtect: (password: string) => Promise<void>;
  onUpdateWorkspace: (value: Workspace) => void;
  onEnd: () => void;
  onFinish: () => Promise<void>;
  takeOverMessage: string;
}) {
  const { get, open, close, update } = overlays;
  const entry = get("entry");
  // In the time machine, an entry opens in its version of that time.
  const selected = entry && view.entries.find((e) => e.id === entry.id);
  const print = get("print");
  const settings = get("settings");
  const trace = get("trace");
  const present = get("present");
  const dialog = get("dialog");
  const closeDialog = () => close("dialog");
  const author = workspace.author;
  const composeWith = (preset: Fields) => {
    if (!discardDraft()) return;
    open({ kind: "dialog", name: "compose", preset });
  };

  return (
    <>
      {selected && entry && (
        <EntryDetail
          key={`${selected.id}-${entry.mode}`}
          entry={selected}
          mode={entry.mode}
          entries={view.entries}
          onOpen={(id) => open({ kind: "entry", id, mode: "view" })}
          onSnooze={(minutes) => actions.snoozeEntry(selected.id, minutes)}
          onDelete={(reason) => {
            if (!actions.removeEntry(selected.id, reason)) return;
            close("entry");
            notify(`Entrée ${numberLabel(selected)} supprimée.`);
          }}
          author={author}
          readOnly={readOnly}
          onClose={() => close("entry")}
          onPrint={() => {
            close("entry");
            open({
              kind: "print",
              job: { kind: "messages", journal: view, entries: [selected] },
            });
          }}
          onRevise={(fields, reason) => {
            if (actions.revise(selected.id, fields, reason))
              notify("Modification enregistrée. Version précédente conservée.");
          }}
          onReply={() => {
            if (!actions.gate()) return;
            close("entry");
            composeWith({
              ...emptyFields(),
              type: "Quittance",
              source: author,
              recipient: current(selected).source,
              location: current(selected).location,
              reference: `Suite de ${numberLabel(selected)}`,
            });
          }}
        />
      )}
      {print && (
        <PrintPreview
          job={{
            ...print.job,
            // A past version (time machine) is printed as it was.
            journal:
              viewAt !== null
                ? print.job.journal
                : (workspace.journals.find(
                    (j) => j.id === print.job.journal.id,
                  ) ?? print.job.journal),
          }}
          onClose={() => close("print")}
        />
      )}
      {settings && (
        <SettingsDialog
          tab={settings.tab}
          onTab={(tab) => update({ kind: "settings", tab })}
          onClose={() => close("settings")}
          persistent={persistent}
          stored={stored}
          onProtect={onProtect}
          onUpdateWorkspace={onUpdateWorkspace}
          onJournal={(value) => {
            if (actions.setClosed(value.closedAt))
              notify(value.closedAt ? "Journal clôturé." : "Journal rouvert.");
          }}
          onEnd={onEnd}
          onFinish={onFinish}
          onExport={() => open({ kind: "dialog", name: "export", preset: {} })}
          sync={sync}
        />
      )}
      {dialog?.name === "create" && (
        <Modal title="Nouveau journal" onClose={closeDialog}>
          <JournalSetup author={author} onCreate={onCreate} />
        </Modal>
      )}
      {dialog?.name === "export" && (
        <Suspense fallback={null}>
          <ExportCenter
            preset={dialog.preset}
            onClose={closeDialog}
            onBackup={onBackup}
          />
        </Suspense>
      )}
      {dialog?.name === "snapshot" && <SnapshotDialog onClose={closeDialog} />}
      {trace && (
        <TraceSheet target={trace.target} onClose={() => close("trace")} />
      )}
      {present && (
        <Suspense fallback={null}>
          <PresentationMode
            mode={present.mode}
            preset={present.preset}
            onClose={() => close("present")}
          />
        </Suspense>
      )}
      {dialog?.name === "import" && (
        <ImportModal
          target={journal}
          onClose={closeDialog}
          onImport={onImport}
        />
      )}
      {dialog?.name === "privacy" && <Privacy onClose={closeDialog} />}
      {dialog?.name === "report" && (
        <ReportDialog
          journal={view}
          onClose={closeDialog}
          onPreview={(range) => {
            closeDialog();
            open({
              kind: "print",
              job: { kind: "report", journal: view, author, range },
            });
          }}
        />
      )}
      {dialog?.name === "install" && <InstallHelp onClose={closeDialog} />}
      {dialog?.name === "deleted" && (
        <Modal title="Entrées supprimées" onClose={closeDialog}>
          {journal.deleted.length ? (
            <div className="table-scroll">
              <table className="grid dense">
                <thead>
                  <tr>
                    <th>N°</th>
                    <th>Supprimée le</th>
                    <th>Par</th>
                    <th>Motif</th>
                  </tr>
                </thead>
                <tbody>
                  {[...journal.deleted].reverse().map((d) => (
                    <tr key={d.id}>
                      <td className="mono">
                        #{String(d.number).padStart(3, "0")}
                      </td>
                      <td className="mono">{dateTime(d.at)}</td>
                      <td>{d.by}</td>
                      <td>{d.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="muted">Aucune entrée supprimée dans ce journal.</p>
          )}
        </Modal>
      )}
      {dialog?.name === "handover" && (
        <Handover
          journal={journal}
          at={minute}
          onClose={closeDialog}
          onExport={() => open({ kind: "dialog", name: "export", preset: {} })}
          onOpen={(id) => {
            closeDialog();
            open({ kind: "entry", id, mode: "view" });
          }}
          onTakeOver={() => {
            if (!actions.gate()) return;
            composeWith({
              ...emptyFields(),
              type: "Relève",
              reliability: "Confirmé",
              message: takeOverMessage,
            });
          }}
        />
      )}
      {dialog?.name === "compose" && (
        <Modal
          title={
            dialog.preset?.type === "Relève"
              ? "Consigner la relève"
              : "Nouvelle entrée"
          }
          onClose={() => {
            if (discardDraft()) closeDialog();
          }}
        >
          <div onInput={onTyping}>
            <EntryForm
              key={dialog.preset?.reference || dialog.preset?.type || "new"}
              author={author}
              preset={dialog.preset ?? draft}
              onDraft={onDraft}
              suggestions={suggestions}
              onSave={(fields) => {
                if (onAdd(fields)) closeDialog();
              }}
            />
          </div>
        </Modal>
      )}
    </>
  );
}
