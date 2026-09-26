import { createContext, useContext } from "react";
import type { Fields, Journal, Workspace } from "../../shared/journal";
import type { InputOf, Ops } from "../../shared/ops";
import type { Edge, Item, Module, Ref } from "../../shared/links";
import type { PrintJob } from "../print/PrintPreview";
import type { Prefs } from "./prefs";
import type { ExportScope } from "../export/scope";

/** Registers written even on a closed journal or from the time machine. */
export type LogCollection =
  "exports" | "presentations" | "snapshots" | "forecasts";
export type ExportPreset = Partial<ExportScope> & {
  /** Format id selected when the export centre opens. */
  format?: string;
};

export type Graph = {
  items: Item[];
  byRef: Map<string, Item>;
  edges: Edge[];
  /** Number of links per item. */
  degree: Map<string, number>;
};

export type AppContext = {
  workspace: Workspace;
  /** Journal shown: the live one, or a past version in the time machine. */
  journal: Journal;
  /** The live journal, whatever the time machine shows. */
  live: Journal;
  author: string;
  /** Journal closed or past version shown: reading and exports only. */
  readOnly: boolean;
  /**
   * The write gate: true when writing is allowed; otherwise shows why
   * (time machine, closed journal) and returns false. Use it instead of a
   * silent `if (readOnly) return`.
   */
  canWrite: () => boolean;
  /** Moment shown by the time machine (ms since epoch); null: live. */
  viewAt: number | null;
  setViewAt: (at: number | null) => void;
  /** Show who changed a record (or entry) and when, with its versions. */
  trace: (target: string) => void;
  /**
   * Append to a register of the live journal (or of `journalId`, the journal
   * an asynchronous request was made for); returns the new id.
   */
  record: <C extends LogCollection>(
    collection: C,
    value: Omit<InputOf<C>, "id" | "createdAt" | "updatedAt" | "by"> & {
      id?: string;
    },
    journalId?: string,
  ) => string;
  /** Open the export centre, optionally preset. */
  exportCenter: (preset?: ExportPreset) => void;
  /** Start the presentation mode or the wall display. */
  present: (mode?: "present" | "wall", preset?: Partial<ExportScope>) => void;
  /** Updated every 30 seconds. */
  now: number;
  graph: Graph;
  module: Module;
  /**
   * Replace the live journal. Refused with a message (returns false) in the
   * time machine or on a closed journal: build the value from `live`.
   */
  updateJournal: (journal: Journal) => boolean;
  /** Change the module records; throws (with a message) when read only. */
  updateOps: (change: (ops: Ops) => Ops) => void;
  /** Standard values of a référentiel (editable in the settings). */
  lists: (name: string) => string[];
  go: (module: Module) => void;
  /** Item to show in its module, set by open(). The module clears it. */
  focus: Ref | null;
  setFocus: (ref: Ref | null) => void;
  /** Show an item wherever it lives. */
  open: (ref: Ref) => void;
  toast: (message: string) => void;
  print: (job: PrintJob) => void;
  /** Print without preview (impression automatique), after the current jobs. */
  queuePrint: (job: PrintJob) => void;
  prefs: Prefs;
  setPrefs: (patch: Partial<Prefs>) => void;
  /** Open the documentation at a topic. */
  help: (topic: string) => void;
  /** Record a journal entry now; returns its id. */
  addEntry: (fields: Partial<Fields>, links?: Ref[]) => string | null;
  /** Open the entry form, prefilled. */
  compose: (preset?: Partial<Fields>) => void;
  openEntry: (id: string, mode?: "view" | "edit" | "delete") => void;
};

export const Ctx = createContext<AppContext | null>(null);
export function useApp(): AppContext {
  const value = useContext(Ctx);
  if (!value) throw new Error("useApp outside of the application.");
  return value;
}
