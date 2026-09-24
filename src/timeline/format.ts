import { dateTime } from "../../shared/journal";

// Readable names and values of record fields, for the history, the
// comparisons and the audit exports.

export const FIELD_LABELS: Record<string, string> = {
  label: "Libellé",
  name: "Nom",
  title: "Titre",
  subject: "Objet",
  body: "Texte",
  message: "Message",
  status: "État",
  priority: "Priorité",
  kind: "Type",
  type: "Type",
  category: "Catégorie",
  symbol: "Signe",
  color: "Couleur",
  layer: "Calque",
  points: "Position / tracé",
  maps: "Cartes",
  size: "Taille",
  rotation: "Rotation",
  frame: "Pastille",
  boxed: "Étiquette",
  weight: "Épaisseur",
  dash: "Style de trait",
  notes: "Remarques",
  note: "Remarque",
  value: "Valeur",
  unit: "Unité",
  order: "Ordre",
  count: "Nombre",
  organization: "Organisation",
  callsign: "Nom d’appel",
  location: "Lieu",
  coordinates: "Coordonnées",
  mission: "Mission",
  eta: "Arrivée prévue",
  contact: "Contact",
  role: "Fonction",
  grade: "Grade",
  cellId: "Poste",
  phone: "Téléphone",
  phone2: "Téléphone 2",
  email: "E-mail",
  radio: "Radio",
  address: "Adresse",
  favorite: "Favori",
  from: "De",
  to: "À",
  via: "Canal",
  receivedAt: "Reçu à",
  happenedAt: "Survenu à",
  replyNeeded: "Réponse attendue",
  replyBy: "Réponse avant",
  entryId: "Entrée du journal",
  handledBy: "Traité par",
  tags: "Mots-clés",
  at: "Heure",
  minutes: "Durée (min)",
  participants: "Participants",
  done: "Fait",
  place: "Lieu",
  temperature: "Température",
  wind: "Vent",
  precipitation: "Précipitations",
  visibility: "Visibilité",
  conditions: "Conditions",
  level: "Degré",
  hazard: "Danger",
  region: "Région",
  source: "Source",
  recipient: "Destinataire",
  channel: "Canal",
  reliability: "Fiabilité",
  action: "Mesure / décision",
  assignee: "Responsable",
  dueAt: "Échéance",
  resources: "Moyens",
  reference: "Référence",
  a: "Élément A",
  b: "Élément B",
  purpose: "Usage",
  base: "Fond de carte",
  lat: "Latitude",
  lng: "Longitude",
  zoom: "Zoom",
  hidden: "Calques masqués",
  image: "Image",
  group: "Groupe",
  lists: "Référentiels",
  weatherPlace: "Lieu météo",
  mapCenter: "Vue de carte",
  closedAt: "Clôture",
  mode: "Mode",
  classification: "Classification",
  number: "Numéro",
  usage: "Usage",
  primary: "Groupe principal",
  fallback: "Groupe de repli",
  assignments: "Remises",
  model: "Modèle",
  serial: "N° de série",
  result: "Résultat",
  talkgroupId: "Groupe radio",
  startedAt: "Début",
  endedAt: "Fin",
  presenter: "Présentateur",
  audience: "Public",
  viewAt: "Version présentée",
  slides: "Diapositives",
  format: "Format",
  scope: "Contenu",
  sha256: "Empreinte SHA-256",
  bytes: "Taille (octets)",
  fingerprint: "Empreinte du contenu",
};
export const fieldLabel = (key: string) => FIELD_LABELS[key] ?? key;

const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;

/** A field value as a short readable text. */
export function formatValue(key: string, value: unknown, max = 160): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Oui" : "Non";
  if (typeof value === "number") return String(value);
  if (typeof value === "string") {
    if (key === "image") return "image";
    const text = ISO.test(value) ? dateTime(value) : value;
    return text.length > max ? `${text.slice(0, max - 1)}…` : text;
  }
  if (Array.isArray(value)) {
    if (key === "points")
      return value.length === 1 && Array.isArray(value[0])
        ? `${Number(value[0][0]).toFixed(5)}, ${Number(value[0][1]).toFixed(5)}`
        : `${value.length} points`;
    if (!value.length) return "—";
    if (value.every((v) => typeof v === "string"))
      return formatValue(key, value.join(", "), max);
    return `${value.length} élément${value.length > 1 ? "s" : ""}`;
  }
  if (typeof value === "object") {
    const keys = Object.keys(value as object);
    return keys.length ? `${keys.length} réglage(s)` : "—";
  }
  return String(value);
}

/** Initials of a name for an avatar. */
export const initials = (name: string) =>
  name
    .split(/[\s·.-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("") || "?";

/** Hue of a person, stable across the app. */
export const personHue = (name: string) =>
  ([...name].reduce((h, c) => h + c.charCodeAt(0) * 47, 0) % 360) | 0;

/** "il y a 5 min", "il y a 2 h", or the date. */
export function ago(at: string | number, now = Date.now()): string {
  const t = typeof at === "number" ? at : Date.parse(at);
  const s = Math.round((now - t) / 1000);
  if (s < 0) return dateTime(new Date(t).toISOString());
  if (s < 45) return "à l’instant";
  if (s < 3600) return `il y a ${Math.max(1, Math.round(s / 60))} min`;
  if (s < 86400) return `il y a ${Math.round(s / 3600)} h`;
  return dateTime(new Date(t).toISOString());
}

export const ACTION_LABELS = {
  create: "a créé",
  update: "a modifié",
  remove: "a supprimé",
} as const;
