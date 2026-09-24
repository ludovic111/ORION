import { createContext, useContext } from "react";
import type { Fields, Journal, Workspace } from "../../shared/journal";
import type { Ops } from "../../shared/ops";
import type { Edge, Item, Module, Ref } from "../../shared/links";
import type { PrintJob } from "../print/PrintPreview";
import type { Prefs } from "./prefs";

export type Graph = {
  items: Item[];
  byRef: Map<string, Item>;
  edges: Edge[];
  /** Number of links per item. */
  degree: Map<string, number>;
};

export type AppContext = {
  workspace: Workspace;
  journal: Journal;
  author: string;
  /** Journal closed: reading and exports only. */
  readOnly: boolean;
  /** Updated every 30 seconds. */
  now: number;
  graph: Graph;
  module: Module;
  updateJournal: (journal: Journal) => void;
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
