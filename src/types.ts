export type Role = "admin" | "command" | "chief" | "operator" | "viewer";
export type User = {
  id: string;
  email: string;
  name: string;
  role: Role;
  mfa_enabled: boolean;
  active?: boolean;
  operationIds?: string[];
};
export type Session = {
  user: User;
  csrf: string;
  authenticated: boolean;
  demo: boolean;
  preview?: boolean;
  realOperationsEnabled?: boolean;
};
export type Operation = {
  id: string;
  name: string;
  mode: "exercise" | "real";
  nature: string;
  level: number;
  location: string;
  commander: string;
  phase: string;
  status: "active" | "closed";
  version: number;
  created_at: string;
};
export type Kind =
  "journal" | "resource" | "map" | "link" | "transmission" | "report" | "stock";
export type Oimde = {
  orientation: string;
  intention: string;
  mission: string;
  dispositions: string;
  emplacement: string;
  deadline: string;
};
export type Data = {
  observedAt?: string;
  oimde?: Oimde;
  title?: string;
  name?: string;
  type?: string;
  priority?: string;
  source?: string;
  status?: string;
  assignee?: string;
  location?: string;
  decision?: string;
  reliability?: string;
  validated?: boolean;
  organization?: string;
  specialty?: string;
  personnel?: number;
  contact?: string;
  eta?: string;
  symbol?: string;
  lat?: number;
  lng?: number;
  category?: string;
  notes?: string;
  geometry?: [number, number][];
  target?: string;
  label?: string;
  channel?: string;
  sender?: string;
  recipient?: string;
  situation?: string;
  actions?: string;
  needs?: string;
  outlook?: string;
  total?: number;
  available?: number;
};
export type RecordItem = {
  id: string;
  operation_id: string;
  kind: Kind;
  data: Data;
  version: number;
  created_by: string;
  created_at: string;
  updated_at: string;
};
export type SymbolItem = {
  id: string;
  name: string;
  group: string;
  path: string;
  sha256: string;
};
export type AuditItem = {
  seq: number;
  id: string;
  actor: string;
  action: string;
  operation_id: string | null;
  target: string | null;
  detail: unknown;
  at: string;
  previous_hash: string;
  hash: string;
};
export const roleLabels: Record<Role, string> = {
  admin: "Administrateur",
  command: "Commandement",
  chief: "Chef de cellule",
  operator: "Opérateur",
  viewer: "Lecture",
};
export const resourceStatuses = [
  "Disponible",
  "En route",
  "Engagé",
  "Repos / Indisponible",
];
export const journalStatuses = ["Ouvert", "En cours", "Traité", "Clos"];
export const recordTitle = (r: RecordItem) =>
  r.data.title ?? r.data.name ?? r.data.label ?? r.id;
export const shortId = (r: RecordItem) =>
  `${r.kind === "journal" ? "J" : "O"}-${r.id.slice(0, 6).toUpperCase()}`;
export const time = (date: string) =>
  new Date(date).toLocaleTimeString("fr-CH", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Zurich",
  });
export const dateTime = (date: string) =>
  new Date(date).toLocaleString("fr-CH", { timeZone: "Europe/Zurich" });
