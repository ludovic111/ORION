import {
  chronological,
  current,
  dateTime,
  needsFollowUp,
  numberLabel,
  overdue,
  type Entry,
  type Fields,
  type Journal,
} from "../../shared/journal.ts";
import {
  ALERT_LABELS,
  RESOURCE_STATUSES,
  type ForecastRecord,
  type OpsMap,
  type Place,
} from "../../shared/ops.ts";
import {
  auditTrail,
  diffStates,
  journalAt,
  scopeInfo,
  stableStringify,
  type AuditItem,
} from "../../shared/history.ts";
import {
  items as graphItems,
  parseRef,
  KIND_INFO,
} from "../../shared/links.ts";
import { radioSummary } from "../../shared/radio.ts";
import { radioTables } from "../print/radio-sheet.ts";
import { debriefChapter, debriefCount } from "./debrief.ts";
import { symbolName } from "../modules/map/builtins.ts";
import {
  SECTIONS,
  describeScope,
  historyInScope,
  scopedJournal,
  type ExportScope,
  type SectionId,
} from "./scope.ts";

// One structured extraction of the operation for a scope. Every writer
// (PDF, Word, OpenDocument, spreadsheets, HTML, text…) consumes the same
// dossier, so every format carries the same content: a cover, then one
// chapter per part with a summary, tables, free texts and map references.

export type Column = {
  label: string;
  /** Relative width (default 1). */
  weight?: number;
};
export type Table = {
  /** Unique in the dossier. */
  id: string;
  title: string;
  /** Short name for a spreadsheet tab (31 characters max). */
  sheet: string;
  caption: string;
  columns: Column[];
  rows: string[][];
  /** Narrower layout for documents: same rows, merged columns. */
  compact?: { columns: Column[]; rows: string[][] };
};
export type Kpi = {
  label: string;
  value: string;
  tone?: "ok" | "warn" | "crit";
};
export type Block =
  | { kind: "table"; table: Table }
  | { kind: "text"; title: string; body: string; meta?: string }
  | {
      kind: "map";
      /** ops.maps id; "" for the main map (no map defined). */
      mapId: string;
      title: string;
      caption: string;
      objects: number;
    };
export type Chapter = {
  id: SectionId;
  number: number;
  title: string;
  /** One line: "12 moyens · 7 engagés". */
  summary: string;
  kpis: Kpi[];
  blocks: Block[];
};
export type Cover = {
  title: string;
  organization: string;
  location: string;
  reference: string;
  mode: Journal["mode"];
  classification: Journal["classification"];
  createdAt: string;
  closedAt: string;
  /** "État actuel" or "Version du 24.09.2026, 14:00". */
  shown: string;
  /** ISO time shown, "" for now. */
  viewAt: string;
  snapshot: string;
  scope: string;
  author: string;
  exportedAt: string;
};
export type Dossier = {
  cover: Cover;
  chapters: Chapter[];
  /** The journal restricted to the scope, at the time shown. */
  journal: Journal;
  scope: ExportScope;
  /** Time used for "overdue", "in force"… (ms). */
  shownAt: number;
};
export type DossierOptions = {
  author: string;
  /** Add the versions of the journal entries. */
  versions?: boolean;
  exportedAt?: string;
  onProgress?: (done: number, total: number, label: string) => void;
};

/** Let the browser breathe between two heavy steps. */
export const pause = () => new Promise<void>((r) => setTimeout(r, 0));

/**
 * The operation at the time chosen (whole) and restricted to the scope.
 * Computed once: journalAt is the expensive step.
 */
export function resolveScope(live: Journal, scope: ExportScope) {
  const base = scope.viewAt === null ? live : journalAt(live, scope.viewAt);
  return { base, journal: scopedJournal(base, { ...scope, viewAt: null }) };
}

/**
 * The journal of an archive: the scope at the chosen time, with the history
 * of the parts chosen so that the time machine replays them after import
 * (the whole history up to that time for the whole operation).
 */
export function archiveJournal(live: Journal, scope: ExportScope): Journal {
  const { base, journal } = resolveScope(live, scope);
  return { ...journal, history: historyInScope(base.history, scope) };
}

// ---------- Formatting ----------

const when = (iso: string) => (iso ? dateTime(iso) : "");
const clip = (s: string, n: number) =>
  s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s;
const lines = (...parts: (string | false | undefined)[]) =>
  parts.filter(Boolean).join("\n");
const plural = (n: number, one: string, many = `${one}s`) =>
  `${n} ${n > 1 ? many : one}`;
const KEEP = new Set([
  "en",
  "à",
  "de",
  "d’appel",
  "hors",
  "service",
  "cours",
  "retard",
  "route",
  "vigueur",
  "rendez-vous",
  "suivre",
]);
/** "renseignements clés" → "renseignement clé" for 0 or 1 item. */
const singular = (label: string) =>
  label
    .split(" ")
    .map((w) =>
      KEEP.has(w)
        ? w
        : w.endsWith("aux")
          ? w.slice(0, -1).replace(/x$/, "")
          : w.replace(/s$/, ""),
    )
    .join(" ");
const cols = (...list: [string, number?][]): Column[] =>
  list.map(([label, weight]) => ({ label, weight: weight ?? 1 }));
const hhmm = (ms: number) =>
  new Date(ms).toLocaleTimeString("fr-CH", {
    timeZone: "Europe/Zurich",
    hour: "2-digit",
    minute: "2-digit",
  });
const dayName = (ms: number) =>
  new Date(ms).toLocaleDateString("fr-CH", {
    timeZone: "Europe/Zurich",
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  });
const num = (v: number | null, unit = "", digits = 0) =>
  v === null
    ? ""
    : `${v.toLocaleString("fr-CH", { maximumFractionDigits: digits })}${unit}`;

// WMO weather codes (Open-Meteo), same wording as the weather module.
const WMO: Record<number, string> = {
  0: "Ciel dégagé",
  1: "Peu nuageux",
  2: "Partiellement nuageux",
  3: "Couvert",
  45: "Brouillard",
  48: "Brouillard givrant",
  51: "Bruine légère",
  53: "Bruine",
  55: "Bruine forte",
  56: "Bruine verglaçante",
  57: "Bruine verglaçante forte",
  61: "Pluie faible",
  63: "Pluie",
  65: "Pluie forte",
  66: "Pluie verglaçante",
  67: "Pluie verglaçante forte",
  71: "Neige faible",
  73: "Neige",
  75: "Neige forte",
  77: "Grains de neige",
  80: "Averses faibles",
  81: "Averses",
  82: "Averses violentes",
  85: "Averses de neige",
  86: "Fortes averses de neige",
  95: "Orage",
  96: "Orage avec grêle",
  99: "Orage avec forte grêle",
};
const weather = (code: number | null) =>
  code === null ? "" : (WMO[code] ?? `Code ${code}`);

// Field names shown in the change details.
const FIELD_LABELS: Record<string, string> = {
  happenedAt: "Heure de l’événement",
  receivedAt: "Réception",
  type: "Type",
  message: "Message",
  source: "Émetteur",
  recipient: "Destinataire",
  channel: "Canal",
  priority: "Priorité",
  reliability: "Confirmation",
  location: "Lieu",
  coordinates: "Coordonnées",
  action: "Mesure / décision",
  assignee: "Responsable",
  dueAt: "Échéance",
  status: "État",
  resources: "Moyens / besoins",
  reference: "Référence",
  notes: "Remarques",
  tags: "Mots-clés",
  name: "Nom",
  label: "Désignation",
  title: "Titre",
  kind: "Type",
  organization: "Organisation",
  callsign: "Nom d’appel",
  count: "Nombre",
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
  category: "Catégorie",
  value: "Valeur",
  unit: "Unité",
  body: "Texte",
  subject: "Objet",
  from: "De",
  to: "À",
  via: "Canal",
  replyNeeded: "Réponse attendue",
  replyBy: "Réponse avant",
  handledBy: "Traité par",
  points: "Position",
  symbol: "Signe",
  layer: "Calque",
  color: "Couleur",
  at: "Heure",
  minutes: "Durée",
  participants: "Participants",
  done: "Fait",
  level: "Degré",
  hazard: "Danger",
  region: "Région",
  holder: "Détenteur",
  assignments: "Remises",
  condition: "État",
  temperature: "Température",
  wind: "Vent",
  precipitation: "Précipitations",
  visibility: "Visibilité",
  conditions: "Conditions",
  place: "Lieu",
};

const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;
function showValue(v: unknown): string {
  if (v === undefined || v === null || v === "") return "∅";
  if (typeof v === "string") return ISO.test(v) ? dateTime(v) : clip(v, 70);
  if (typeof v === "boolean") return v ? "oui" : "non";
  if (typeof v === "number") return String(v);
  if (Array.isArray(v))
    return v.every((x) => typeof x === "string")
      ? clip(v.join(", "), 70) || "∅"
      : plural(v.length, "élément");
  return clip(stableStringify(v), 70);
}
/** "État : Disponible → Engagé", one line per field changed. */
export function changeDetail(before: unknown, after: unknown, max = 6) {
  const changes = diffStates(before, after);
  const out = changes
    .slice(0, max)
    .map(
      (c) =>
        `${FIELD_LABELS[c.key] ?? c.key} : ${showValue(c.before)} → ${showValue(c.after)}`,
    );
  if (changes.length > max) out.push(`… ${changes.length - max} autres champs`);
  return out.join("\n");
}

// ---------- Chapters ----------

type Ctx = {
  journal: Journal;
  base: Journal;
  scope: ExportScope;
  shownAt: number;
  options: DossierOptions;
};
type Built = { kpis: Kpi[]; blocks: Block[] };
const table = (t: Table): Block => ({ kind: "table", table: t });

function situation({ journal }: Ctx): Built {
  const { facts, boards, snapshots } = journal.ops;
  const blocks: Block[] = [];
  if (facts.length)
    blocks.push(
      table({
        id: "facts",
        title: "Renseignements clés",
        sheet: "Renseignements clés",
        caption: plural(facts.length, "renseignement"),
        columns: cols(
          ["Renseignement", 3],
          ["Valeur", 1.4],
          ["Unité", 1],
          ["Catégorie", 1.6],
          ["Remarque", 3],
        ),
        rows: [...facts]
          .sort((a, b) => a.order - b.order)
          .map((f) => [f.label, f.value, f.unit, f.category, f.note]),
      }),
    );
  for (const b of [...boards].sort((a, b) => a.order - b.order))
    blocks.push({
      kind: "text",
      title: b.title,
      body: b.body.trim() || "—",
      meta: `Mis à jour le ${when(b.updatedAt)}${b.by ? ` par ${b.by}` : ""}`,
    });
  if (snapshots.length)
    blocks.push(
      table({
        id: "snapshots",
        title: "Points de situation figés",
        sheet: "Points de situation",
        caption: plural(snapshots.length, "point"),
        columns: cols(
          ["Point de situation", 3],
          ["Heure", 1.4],
          ["Remarques", 4],
        ),
        rows: [...snapshots]
          .sort((a, b) => Date.parse(a.at) - Date.parse(b.at))
          .map((s) => [s.title, when(s.at), s.notes]),
      }),
    );
  return {
    kpis: [
      { label: "renseignements clés", value: String(facts.length) },
      { label: "tableaux de situation", value: String(boards.length) },
    ],
    blocks,
  };
}

const route = (f: Fields) =>
  f.source || f.recipient ? `${f.source || "?"} → ${f.recipient || "?"}` : "";

function journalChapter({ journal, options }: Ctx): Built {
  const entries = chronological(journal.entries);
  const blocks: Block[] = [];
  const full = cols(
    ["N°", 0.6],
    ["Événement", 1.3],
    ["Réception", 1.3],
    ["Type", 1],
    ["Priorité", 0.9],
    ["Confirmation", 1],
    ["Message", 5],
    ["Émetteur", 1.4],
    ["Destinataire", 1.4],
    ["Canal", 0.9],
    ["Lieu", 1.6],
    ["Coordonnées", 1.2],
    ["Mesure / décision", 3],
    ["Responsable", 1.4],
    ["Échéance", 1.3],
    ["Statut", 1],
    ["Moyens / besoins", 2],
    ["Référence", 1.2],
    ["Remarques", 2],
    ["Mots-clés", 1.2],
    ["Saisi par", 1.3],
    ["Versions", 0.7],
  );
  blocks.push(
    table({
      id: "entries",
      title: "Entrées du journal",
      sheet: "Journal",
      caption: `${plural(entries.length, "entrée")} · ordre chronologique`,
      columns: full,
      rows: entries.map((e) => {
        const f = current(e);
        return [
          numberLabel(e),
          when(f.happenedAt),
          when(f.receivedAt),
          f.type,
          f.priority,
          f.reliability,
          f.message,
          f.source,
          f.recipient,
          f.channel,
          f.location,
          f.coordinates,
          f.action,
          f.assignee,
          when(f.dueAt),
          f.status,
          f.resources,
          f.reference,
          f.notes,
          f.tags.join(", "),
          e.createdBy,
          String(e.revisions.length),
        ];
      }),
      compact: {
        columns: cols(
          ["N°", 1],
          ["Heure", 1.5],
          ["Message", 5.5],
          ["De → à", 1.8],
          ["Suivi", 1.8],
        ),
        rows: entries.map((e) => {
          const f = current(e);
          return [
            lines(
              numberLabel(e),
              f.type,
              f.priority !== "Normal" && f.priority,
            ),
            lines(
              when(f.happenedAt),
              f.receivedAt !== f.happenedAt && `reçu ${when(f.receivedAt)}`,
            ),
            lines(
              f.message,
              f.action && `Mesure : ${f.action}`,
              f.location && `Lieu : ${f.location}`,
              f.resources && `Moyens : ${f.resources}`,
              e.revisions.length > 1 && `${e.revisions.length} versions`,
            ),
            lines(route(f), f.channel),
            lines(f.status, f.assignee, f.dueAt && `Échéance ${when(f.dueAt)}`),
          ];
        }),
      },
    }),
  );
  if (options.versions) {
    const rows: string[][] = [];
    for (const e of entries)
      e.revisions.forEach((r, i) =>
        rows.push([
          numberLabel(e),
          String(i + 1),
          when(r.at),
          r.author,
          r.reason,
          i
            ? changeDetail(e.revisions[i - 1].fields, r.fields, 12)
            : "Saisie initiale",
        ]),
      );
    blocks.push(
      table({
        id: "versions",
        title: "Versions des entrées",
        sheet: "Versions",
        caption: plural(rows.length, "version"),
        columns: cols(
          ["N°", 0.7],
          ["Version", 0.7],
          ["Heure", 1.4],
          ["Auteur", 1.5],
          ["Motif", 2.2],
          ["Modifications", 5],
        ),
        rows,
      }),
    );
  }
  if (journal.deleted.length)
    blocks.push(
      table({
        id: "deleted",
        title: "Entrées supprimées",
        sheet: "Supprimées",
        caption: "Le contenu d’une entrée supprimée n’est pas conservé",
        columns: cols(
          ["N°", 1],
          ["Supprimée le", 1.6],
          ["Par", 2],
          ["Motif", 5],
        ),
        rows: [...journal.deleted]
          .sort((a, b) => a.number - b.number)
          .map((d) => [
            `#${String(d.number).padStart(3, "0")}`,
            when(d.at),
            d.by,
            d.reason,
          ]),
      }),
    );
  const f = entries.map(current);
  return {
    kpis: [
      { label: "entrées", value: String(entries.length) },
      {
        label: "urgentes",
        value: String(f.filter((x) => x.priority === "Urgent").length),
        tone: "crit",
      },
      {
        label: "à suivre",
        value: String(entries.filter(needsFollowUp).length),
        tone: "warn",
      },
      {
        label: "modifiées",
        value: String(entries.filter((e) => e.revisions.length > 1).length),
      },
      ...(journal.deleted.length
        ? [{ label: "supprimées", value: String(journal.deleted.length) }]
        : []),
    ],
    blocks,
  };
}

function missions({ journal, scope, shownAt }: Ctx): Built {
  const chosen = scope.items?.missions;
  const open = journal.entries
    .filter(needsFollowUp)
    .filter((e) => !chosen?.length || chosen.includes(e.id));
  const due = (e: Entry) =>
    current(e).dueAt ? Date.parse(current(e).dueAt) : Infinity;
  const sorted = [...open].sort(
    (a, b) =>
      Number(overdue(b, shownAt)) - Number(overdue(a, shownAt)) ||
      due(a) - due(b) ||
      a.number - b.number,
  );
  const late = open.filter((e) => overdue(e, shownAt));
  return {
    kpis: [
      { label: "ouvertes", value: String(open.length) },
      {
        label: "en cours",
        value: String(
          open.filter((e) => current(e).status === "En cours").length,
        ),
      },
      { label: "en retard", value: String(late.length), tone: "crit" },
    ],
    blocks: [
      table({
        id: "missions",
        title: "Missions et points ouverts",
        sheet: "Missions",
        caption: `État au ${dateTime(new Date(shownAt).toISOString())}`,
        columns: cols(
          ["N°", 0.7],
          ["Type", 1],
          ["Priorité", 0.9],
          ["Mission / demande", 4],
          ["Mesure", 3],
          ["Responsable", 1.5],
          ["Échéance", 1.4],
          ["Statut", 1],
          ["Retard", 0.9],
        ),
        rows: sorted.map((e) => {
          const f = current(e);
          return [
            numberLabel(e),
            f.type,
            f.priority,
            f.message,
            f.action,
            f.assignee,
            when(f.dueAt),
            f.status,
            overdue(e, shownAt) ? "EN RETARD" : "",
          ];
        }),
        compact: {
          columns: cols(
            ["N°", 1],
            ["Mission", 5.5],
            ["Responsable", 1.8],
            ["Échéance", 1.8],
          ),
          rows: sorted.map((e) => {
            const f = current(e);
            return [
              lines(
                numberLabel(e),
                f.type,
                f.priority !== "Normal" && f.priority,
              ),
              lines(f.message, f.action && `Mesure : ${f.action}`),
              lines(f.assignee || "—", f.status),
              lines(when(f.dueAt) || "—", overdue(e, shownAt) && "EN RETARD"),
            ];
          }),
        },
      }),
    ],
  };
}

function messagesChapter({ journal }: Ctx): Built {
  const list = [...journal.ops.messages].sort(
    (a, b) => Date.parse(a.receivedAt) - Date.parse(b.receivedAt),
  );
  return {
    kpis: [
      { label: "messages", value: String(list.length) },
      {
        label: "nouveaux",
        value: String(list.filter((m) => m.status === "Nouveau").length),
        tone: "warn",
      },
      {
        label: "urgents",
        value: String(list.filter((m) => m.priority === "Urgent").length),
        tone: "crit",
      },
      {
        label: "réponses attendues",
        value: String(
          list.filter((m) => m.replyNeeded && m.status !== "Classé").length,
        ),
      },
    ],
    blocks: [
      table({
        id: "messages",
        title: "Messages reçus",
        sheet: "Messages",
        caption: plural(list.length, "message"),
        columns: cols(
          ["N°", 0.6],
          ["Reçu", 1.3],
          ["De", 1.5],
          ["À", 1.5],
          ["Canal", 1],
          ["Priorité", 0.9],
          ["Catégorie", 1.3],
          ["Objet", 2.4],
          ["Texte", 5],
          ["Lieu", 1.6],
          ["Statut", 1.1],
          ["Réponse avant", 1.3],
          ["Traité par", 1.3],
          ["Remarques", 2],
        ),
        rows: list.map((m, i) => [
          `M${String(i + 1).padStart(3, "0")}`,
          when(m.receivedAt),
          m.from,
          m.to,
          m.via,
          m.priority,
          m.category,
          m.subject,
          m.body,
          m.location,
          m.status,
          m.replyNeeded ? when(m.replyBy) || "oui" : "",
          m.handledBy,
          m.notes,
        ]),
        compact: {
          columns: cols(
            ["N° / reçu", 1.5],
            ["De → à", 1.8],
            ["Message", 5.5],
            ["Suivi", 1.6],
          ),
          rows: list.map((m, i) => [
            lines(
              `M${String(i + 1).padStart(3, "0")}`,
              when(m.receivedAt),
              m.via,
            ),
            lines(`${m.from || "?"} → ${m.to || "?"}`),
            lines(
              m.subject && m.subject.toUpperCase(),
              m.body,
              m.location && `Lieu : ${m.location}`,
            ),
            lines(
              m.status,
              m.priority !== "Normal" && m.priority,
              m.replyNeeded && `Réponse ${when(m.replyBy) || "attendue"}`,
            ),
          ]),
        },
      }),
    ],
  };
}

const PLACE_KIND: Record<Place["kind"], string> = {
  point: "Signe",
  line: "Ligne",
  area: "Zone",
  text: "Texte",
};
const coordinate = ([lat, lng]: [number, number]) =>
  `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
function position(p: Place) {
  if (p.points.length === 1) return coordinate(p.points[0]);
  const lat = p.points.reduce((s, [a]) => s + a, 0) / p.points.length;
  const lng = p.points.reduce((s, [, b]) => s + b, 0) / p.points.length;
  return `${p.points.length} points · centre ${coordinate([lat, lng])}`;
}
/** Maps of the operation; a main map when none is defined. */
export function mapsOf(
  journal: Journal,
): Pick<OpsMap, "id" | "name" | "purpose">[] {
  return journal.ops.maps.length
    ? [...journal.ops.maps].sort((a, b) => a.order - b.order)
    : [{ id: "", name: "Carte de situation", purpose: "" }];
}
export const placesOn = (journal: Journal, mapId: string) =>
  journal.ops.places.filter(
    (p) => !mapId || !p.maps.length || p.maps.includes(mapId),
  );

function mapChapter({ journal, base }: Ctx): Built {
  const maps = mapsOf(journal);
  const blocks: Block[] = [];
  for (const [i, m] of maps.entries()) {
    const places = placesOn(journal, m.id).sort(
      (a, b) =>
        a.layer.localeCompare(b.layer, "fr") ||
        a.label.localeCompare(b.label, "fr"),
    );
    blocks.push({
      kind: "map",
      mapId: m.id,
      title: m.name,
      caption: [m.purpose, plural(places.length, "objet")]
        .filter(Boolean)
        .join(" · "),
      objects: places.length,
    });
    blocks.push(
      table({
        id: `places-${i + 1}`,
        title: maps.length > 1 ? `Objets · ${m.name}` : "Objets de la carte",
        sheet: maps.length > 1 ? `Carte ${m.name}` : "Carte",
        caption: plural(places.length, "objet"),
        columns: cols(
          ["Désignation", 2.6],
          ["Type", 0.9],
          ["Signe", 1.4],
          ["Calque", 1.2],
          ["Position (WGS 84)", 2.4],
          ["Remarques", 3],
          ["Modifié", 1.3],
        ),
        rows: places.map((p) => [
          p.label || "(sans nom)",
          PLACE_KIND[p.kind],
          symbolName(p.symbol, base.ops.symbols),
          p.layer,
          position(p),
          p.notes,
          when(p.updatedAt),
        ]),
      }),
    );
  }
  return {
    kpis: [
      {
        label: maps.length > 1 ? "cartes" : "carte",
        value: String(maps.length),
      },
      { label: "objets", value: String(journal.ops.places.length) },
      ...(journal.ops.symbols.length
        ? [
            {
              label: "signes personnalisés",
              value: String(journal.ops.symbols.length),
            },
          ]
        : []),
    ],
    blocks,
  };
}

function resourcesChapter({ journal }: Ctx): Built {
  const order = (s: string) => RESOURCE_STATUSES.indexOf(s as never);
  const list = [...journal.ops.resources].sort(
    (a, b) =>
      order(a.status) - order(b.status) || a.name.localeCompare(b.name, "fr"),
  );
  const count = (s: string) => list.filter((r) => r.status === s).length;
  return {
    kpis: [
      { label: "moyens", value: String(list.length) },
      { label: "engagés", value: String(count("Engagé")), tone: "ok" },
      { label: "en route", value: String(count("En route")) },
      { label: "disponibles", value: String(count("Disponible")) },
      ...(count("Hors service")
        ? [
            {
              label: "hors service",
              value: String(count("Hors service")),
              tone: "crit" as const,
            },
          ]
        : []),
    ],
    blocks: [
      table({
        id: "resources",
        title: "Moyens",
        sheet: "Moyens",
        caption: plural(list.length, "moyen"),
        columns: cols(
          ["Désignation", 2],
          ["Type", 1.2],
          ["Organisation", 1.6],
          ["Nom d’appel", 1.2],
          ["Nombre", 0.7],
          ["État", 1],
          ["Lieu", 1.8],
          ["Mission", 3],
          ["Arrivée prévue", 1.3],
          ["Contact", 1.5],
          ["Remarques", 2],
        ),
        rows: list.map((r) => [
          r.name,
          r.kind,
          r.organization,
          r.callsign,
          String(r.count),
          r.status,
          r.location,
          r.mission,
          when(r.eta),
          r.contact,
          r.notes,
        ]),
        compact: {
          columns: cols(
            ["Moyen", 2.6],
            ["Nombre", 0.8],
            ["État", 1.2],
            ["Lieu et mission", 4],
            ["Arrivée", 1.3],
          ),
          rows: list.map((r) => [
            lines(
              r.name,
              [r.kind, r.organization].filter(Boolean).join(" · "),
              r.callsign,
            ),
            String(r.count),
            r.status,
            lines(r.location, r.mission),
            when(r.eta),
          ]),
        },
      }),
    ],
  };
}

function teamChapter({ journal, base }: Ctx): Built {
  const cells = [...journal.ops.cells].sort((a, b) => a.order - b.order);
  const members = [...journal.ops.members].sort((a, b) =>
    a.name.localeCompare(b.name, "fr"),
  );
  const cellName = (id: string) =>
    base.ops.cells.find((c) => c.id === id)?.name ?? "";
  const blocks: Block[] = [];
  if (cells.length || !members.length)
    blocks.push(
      table({
        id: "cells",
        title: "Postes et cellules",
        sheet: "Postes",
        caption: plural(cells.length, "poste"),
        columns: cols(
          ["Poste", 2],
          ["Type", 1.4],
          ["Lieu", 2],
          ["Téléphone", 1.4],
          ["Radio", 1.2],
          ["Personnes", 0.9],
          ["Remarques", 2.4],
        ),
        rows: cells.map((c) => [
          c.name,
          c.kind,
          c.location,
          c.phone,
          c.radio,
          String(base.ops.members.filter((m) => m.cellId === c.id).length),
          c.notes,
        ]),
      }),
    );
  if (members.length)
    blocks.push(
      table({
        id: "members",
        title: "Personnes",
        sheet: "Équipe",
        caption: plural(members.length, "personne"),
        columns: cols(
          ["Nom", 1.8],
          ["Grade", 0.8],
          ["Fonction", 1.8],
          ["Poste", 1.4],
          ["Nom d’appel", 1.1],
          ["Téléphone", 1.3],
          ["E-mail", 1.8],
          ["État", 0.9],
          ["Depuis", 1.2],
          ["Jusqu’à", 1.2],
          ["Remarques", 1.8],
        ),
        rows: members.map((m) => [
          m.name,
          m.grade,
          m.role,
          cellName(m.cellId),
          m.callsign,
          m.phone,
          m.email,
          m.status,
          when(m.from),
          when(m.to),
          m.notes,
        ]),
        compact: {
          columns: cols(
            ["Personne", 2.4],
            ["Fonction et poste", 2.6],
            ["Joindre", 2.2],
            ["État", 1.4],
          ),
          rows: members.map((m) => [
            lines([m.grade, m.name].filter(Boolean).join(" "), m.callsign),
            lines(m.role, cellName(m.cellId)),
            lines(m.phone, m.email),
            lines(m.status, m.to && `jusqu’à ${when(m.to)}`),
          ]),
        },
      }),
    );
  return {
    kpis: [
      { label: "postes", value: String(cells.length) },
      { label: "personnes", value: String(members.length) },
      {
        label: "présentes",
        value: String(members.filter((m) => m.status === "Présent").length),
        tone: "ok",
      },
    ],
    blocks,
  };
}

const RADIO_SHEETS: Record<string, string> = {
  plan: "Radio plan",
  groups: "Radio groupes",
  terminals: "Radio terminaux",
  custody: "Radio remises",
  checks: "Radio contrôles",
};
function radioChapter({ journal }: Ctx): Built {
  const s = radioSummary(journal.radio);
  const tables = radioTables(journal.radio).filter(
    (t) => t.body.length || t.id === "plan",
  );
  return {
    kpis: [
      { label: "noms d’appel", value: String(journal.radio.stations.length) },
      { label: "groupes", value: String(journal.radio.talkgroups.length) },
      { label: "terminaux remis", value: `${s.issued} / ${s.terminals}` },
      { label: "contrôles", value: String(journal.radio.checks.length) },
    ],
    blocks: tables.map((t) =>
      table({
        id: `radio-${t.id}`,
        title: t.title,
        sheet: RADIO_SHEETS[t.id] ?? `Radio ${t.id}`,
        caption: t.caption,
        columns: t.head.map((label, i) => ({
          label,
          weight: t.widths?.[i] ?? 1,
        })),
        rows: t.body,
      }),
    ),
  };
}

function contactsChapter({ journal }: Ctx): Built {
  const list = [...journal.ops.contacts].sort(
    (a, b) =>
      Number(b.favorite) - Number(a.favorite) ||
      a.category.localeCompare(b.category, "fr") ||
      a.name.localeCompare(b.name, "fr"),
  );
  return {
    kpis: [
      { label: "contacts", value: String(list.length) },
      {
        label: "favoris",
        value: String(list.filter((c) => c.favorite).length),
      },
    ],
    blocks: [
      table({
        id: "contacts",
        title: "Annuaire",
        sheet: "Contacts",
        caption: plural(list.length, "contact"),
        columns: cols(
          ["Nom", 2],
          ["Organisation", 1.8],
          ["Fonction", 1.6],
          ["Catégorie", 1.2],
          ["Téléphone", 1.4],
          ["Téléphone 2", 1.4],
          ["E-mail", 2],
          ["Radio", 1],
          ["Adresse", 2],
          ["Remarques", 2],
        ),
        rows: list.map((c) => [
          `${c.favorite ? "★ " : ""}${c.name}`,
          c.organization,
          c.role,
          c.category,
          c.phone,
          c.phone2,
          c.email,
          c.radio,
          c.address,
          c.notes,
        ]),
        compact: {
          columns: cols(
            ["Contact", 2.8],
            ["Téléphones", 1.8],
            ["E-mail · radio", 2.2],
            ["Adresse et remarques", 2.6],
          ),
          rows: list.map((c) => [
            lines(
              `${c.favorite ? "★ " : ""}${c.name}`,
              [c.role, c.organization].filter(Boolean).join(" · "),
              c.category,
            ),
            lines(c.phone, c.phone2),
            lines(c.email, c.radio && `Radio ${c.radio}`),
            lines(c.address, c.notes),
          ]),
        },
      }),
    ],
  };
}

/** Latest forecast received at the time shown. */
export const latestForecast = (journal: Journal): ForecastRecord | undefined =>
  [...journal.ops.forecasts].sort(
    (a, b) => Date.parse(b.fetchedAt) - Date.parse(a.fetchedAt),
  )[0];

function weatherChapter({ journal, shownAt }: Ctx): Built {
  const blocks: Block[] = [];
  const forecast = latestForecast(journal);
  if (forecast) {
    const d = forecast.data;
    const c = d.current;
    blocks.push({
      kind: "text",
      title: `Prévision pour ${forecast.place}`,
      body: [
        `${weather(c.code) || "Conditions inconnues"}, ${num(c.temperature, " °C", 1)}`,
        c.wind !== null
          ? `Vent ${num(c.wind, " km/h")}${c.gusts !== null ? `, rafales ${num(c.gusts, " km/h")}` : ""}`
          : "",
        c.precipitation !== null
          ? `Précipitations ${num(c.precipitation, " mm", 1)}`
          : "",
        c.humidity !== null ? `Humidité ${num(c.humidity, " %")}` : "",
      ]
        .filter(Boolean)
        .join(" · "),
      meta: `Reçue le ${when(forecast.fetchedAt)} · modèle ${d.model || "—"} · Open-Meteo`,
    });
    const hours = d.hours
      .filter((h) => h.at >= shownAt - 3600_000)
      .slice(0, 24);
    if (hours.length)
      blocks.push(
        table({
          id: "forecast-hours",
          title: "Prochaines heures",
          sheet: "Météo heures",
          caption: `Prévision reçue le ${when(forecast.fetchedAt)}`,
          columns: cols(
            ["Heure", 1.2],
            ["Temps", 2.2],
            ["Température", 1],
            ["Précipitations", 1.1],
            ["Probabilité", 1],
            ["Vent", 0.9],
            ["Rafales", 0.9],
          ),
          rows: hours.map((h) => [
            `${dayName(h.at)} ${hhmm(h.at)}`,
            weather(h.code),
            num(h.temperature, " °C", 1),
            num(h.precipitation, " mm", 1),
            num(h.probability, " %"),
            num(h.wind, " km/h"),
            num(h.gusts, " km/h"),
          ]),
        }),
      );
    if (d.days.length)
      blocks.push(
        table({
          id: "forecast-days",
          title: "Prochains jours",
          sheet: "Météo jours",
          caption: plural(d.days.length, "jour"),
          columns: cols(
            ["Jour", 1.2],
            ["Temps", 2.2],
            ["Min", 0.8],
            ["Max", 0.8],
            ["Précipitations", 1.1],
            ["Rafales", 1],
          ),
          rows: d.days.map((x) => [
            dayName(x.at),
            weather(x.code),
            num(x.min, " °C"),
            num(x.max, " °C"),
            num(x.precipitation, " mm", 1),
            num(x.gusts, " km/h"),
          ]),
        }),
      );
  }
  const alerts = [...journal.ops.alerts].sort(
    (a, b) => Number(b.level) - Number(a.level),
  );
  const state = (a: (typeof alerts)[number]) =>
    a.from && Date.parse(a.from) > shownAt
      ? "À venir"
      : a.to && Date.parse(a.to) < shownAt
        ? "Terminée"
        : "En vigueur";
  if (alerts.length)
    blocks.push(
      table({
        id: "alerts",
        title: "Alertes météo",
        sheet: "Alertes",
        caption: plural(alerts.length, "alerte"),
        columns: cols(
          ["Danger", 1.6],
          ["Degré", 2.2],
          ["Région", 1.6],
          ["Du", 1.3],
          ["Au", 1.3],
          ["État", 1],
          ["Source", 1.3],
          ["Remarques", 2],
        ),
        rows: alerts.map((a) => [
          a.hazard,
          ALERT_LABELS[a.level],
          a.region,
          when(a.from),
          when(a.to),
          state(a),
          a.source,
          a.notes,
        ]),
      }),
    );
  const observations = [...journal.ops.observations].sort(
    (a, b) => Date.parse(b.at) - Date.parse(a.at),
  );
  if (observations.length)
    blocks.push(
      table({
        id: "observations",
        title: "Observations sur place",
        sheet: "Observations",
        caption: plural(observations.length, "observation"),
        columns: cols(
          ["Heure", 1.3],
          ["Lieu", 1.6],
          ["Conditions", 2],
          ["Température", 1],
          ["Vent", 1.2],
          ["Précipitations", 1.2],
          ["Visibilité", 1.1],
          ["Remarques", 2],
        ),
        rows: observations.map((o) => [
          when(o.at),
          o.place,
          o.conditions,
          o.temperature,
          o.wind,
          o.precipitation,
          o.visibility,
          o.notes,
        ]),
      }),
    );
  return {
    kpis: [
      {
        label: "alertes en vigueur",
        value: String(alerts.filter((a) => state(a) === "En vigueur").length),
        tone: "warn",
      },
      { label: "observations", value: String(observations.length) },
      {
        label: "prévisions reçues",
        value: String(journal.ops.forecasts.length),
      },
    ],
    blocks,
  };
}

function agendaChapter({ journal, shownAt }: Ctx): Built {
  const list = [...journal.ops.agenda].sort(
    (a, b) => Date.parse(a.at) - Date.parse(b.at),
  );
  const state = (a: (typeof list)[number]) => {
    const start = Date.parse(a.at);
    const end = start + a.minutes * 60_000;
    if (a.done) return "Fait";
    if (end < shownAt) return "Passé";
    if (start <= shownAt) return "En cours";
    return "À venir";
  };
  return {
    kpis: [
      { label: "rendez-vous", value: String(list.length) },
      {
        label: "à venir",
        value: String(list.filter((a) => state(a) === "À venir").length),
      },
    ],
    blocks: [
      table({
        id: "agenda",
        title: "Rythme de conduite",
        sheet: "Agenda",
        caption: plural(list.length, "rendez-vous", "rendez-vous"),
        columns: cols(
          ["Début", 1.3],
          ["Durée", 0.8],
          ["Titre", 2.4],
          ["Type", 1.4],
          ["Lieu", 1.6],
          ["Participants", 2.2],
          ["État", 0.9],
          ["Remarques", 2],
        ),
        rows: list.map((a) => [
          when(a.at),
          a.minutes ? `${a.minutes} min` : "",
          a.title,
          a.kind,
          a.location,
          a.participants,
          state(a),
          a.notes,
        ]),
      }),
    ],
  };
}

function linksChapter({ journal, base }: Ctx): Built {
  const known = new Map(graphItems(base).map((i) => [i.ref as string, i]));
  const name = (ref: string) => {
    const item = known.get(ref);
    if (item) return `${KIND_INFO[item.kind].label} · ${item.title}`;
    const { kind } = parseRef(ref);
    return `${KIND_INFO[kind]?.label ?? "Élément"} (absent à cette heure)`;
  };
  const list = [...journal.ops.links].sort(
    (a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt),
  );
  return {
    kpis: [{ label: "liens", value: String(list.length) }],
    blocks: [
      table({
        id: "links",
        title: "Liens entre les éléments",
        sheet: "Liens",
        caption: "Liens créés par les opérateurs",
        columns: cols(
          ["Élément", 3],
          ["Lien", 1.6],
          ["Élément lié", 3],
          ["Par", 1.3],
          ["Le", 1.3],
        ),
        rows: list.map((l) => [
          name(l.a),
          l.label,
          name(l.b),
          l.by,
          when(l.createdAt),
        ]),
      }),
    ],
  };
}

const ACTIONS: Record<AuditItem["action"], string> = {
  create: "Création",
  update: "Modification",
  remove: "Suppression",
};
function traceChapter({ journal }: Ctx): Built {
  // The trail of what this export covers (the history is already limited to
  // the parts and items chosen), entries included, up to the time shown.
  const trail = auditTrail(journal).reverse();
  const people = new Set(trail.map((t) => t.by).filter(Boolean));
  const blocks: Block[] = [
    table({
      id: "trail",
      title: "Historique des changements",
      sheet: "Traçabilité",
      caption: `${plural(trail.length, "changement")} · ordre chronologique`,
      columns: cols(
        ["Heure", 1.3],
        ["Qui", 1.4],
        ["Action", 1.1],
        ["Élément", 1.4],
        ["Désignation", 2.4],
        ["Détail", 4],
      ),
      rows: trail.map((t) => [
        when(t.at),
        t.by,
        ACTIONS[t.action],
        scopeInfo(t.scope).label,
        t.title,
        lines(
          t.note,
          t.action === "update" && changeDetail(t.previous, t.state),
        ),
      ]),
    }),
  ];
  const exports = [...journal.ops.exports].sort(
    (a, b) => Date.parse(a.at) - Date.parse(b.at),
  );
  if (exports.length)
    blocks.push(
      table({
        id: "exports",
        title: "Registre des exports",
        sheet: "Exports",
        caption: plural(exports.length, "fichier"),
        columns: cols(
          ["Heure", 1.3],
          ["Par", 1.3],
          ["Format", 1],
          ["Fichier", 2.6],
          ["Contenu", 3],
          ["Empreinte", 1.4],
          ["SHA-256", 2.4],
        ),
        rows: exports.map((e) => [
          when(e.at),
          e.by,
          e.format,
          e.name,
          e.scope,
          e.fingerprint,
          e.sha256,
        ]),
      }),
    );
  const talks = [...journal.ops.presentations].sort(
    (a, b) => Date.parse(a.startedAt) - Date.parse(b.startedAt),
  );
  if (talks.length)
    blocks.push(
      table({
        id: "presentations",
        title: "Présentations données",
        sheet: "Présentations",
        caption: plural(talks.length, "présentation"),
        columns: cols(
          ["Début", 1.3],
          ["Fin", 1.3],
          ["Présentateur", 1.6],
          ["Public", 2.4],
          ["Version", 1.3],
          ["Vues", 0.6],
          ["Mode", 1],
        ),
        rows: talks.map((p) => [
          when(p.startedAt),
          when(p.endedAt),
          p.presenter,
          p.audience,
          p.viewAt ? when(p.viewAt) : "état en direct",
          String(p.slides),
          p.mode,
        ]),
      }),
    );
  return {
    kpis: [
      { label: "changements", value: String(trail.length) },
      { label: "personnes", value: String(people.size) },
      { label: "exports", value: String(exports.length) },
    ],
    blocks,
  };
}

const BUILDERS: Record<SectionId, (ctx: Ctx) => Built> = {
  situation,
  journal: journalChapter,
  missions,
  messages: messagesChapter,
  map: mapChapter,
  resources: resourcesChapter,
  team: teamChapter,
  radio: radioChapter,
  contacts: contactsChapter,
  weather: weatherChapter,
  agenda: agendaChapter,
  links: linksChapter,
  trace: traceChapter,
  exercise: ({ base, journal, shownAt }) =>
    debriefChapter(base, journal, shownAt),
};

/** Build the dossier of an export. `live` is the live journal. */
export async function buildDossier(
  live: Journal,
  scope: ExportScope,
  options: DossierOptions,
): Promise<Dossier> {
  const sections = SECTIONS.map((s) => s.id).filter((id) =>
    scope.sections.includes(id),
  );
  const total = sections.length + 1;
  options.onProgress?.(0, total, "Reconstitution de la version choisie");
  await pause();
  const { base, journal } = resolveScope(live, scope);
  const shownAt = scope.viewAt ?? Date.now();
  const ctx: Ctx = { journal, base, scope, shownAt, options };
  const chapters: Chapter[] = [];
  for (const [i, id] of sections.entries()) {
    const title = SECTIONS.find((s) => s.id === id)!.label;
    options.onProgress?.(i + 1, total, title);
    await pause();
    const built = BUILDERS[id](ctx);
    const kpis = built.kpis.map((k) =>
      /^\d+$/.test(k.value) && Number(k.value) <= 1
        ? { ...k, label: singular(k.label) }
        : k,
    );
    const blocks = built.blocks;
    chapters.push({
      id,
      number: i + 1,
      title,
      summary: kpis.map((k) => `${k.value} ${k.label}`).join(" · "),
      kpis,
      blocks,
    });
  }
  const exportedAt = options.exportedAt ?? new Date().toISOString();
  return {
    cover: {
      title: base.title,
      organization: base.organization,
      location: base.location,
      reference: base.reference,
      mode: base.mode,
      classification: base.classification,
      createdAt: base.createdAt,
      closedAt: base.closedAt,
      shown:
        scope.viewAt === null
          ? "État actuel"
          : `Version du ${dateTime(new Date(scope.viewAt).toISOString())}`,
      viewAt: scope.viewAt === null ? "" : new Date(scope.viewAt).toISOString(),
      snapshot: scope.snapshot ?? "",
      scope: describeScope(scope),
      author: options.author,
      exportedAt,
    },
    chapters,
    journal,
    scope,
    shownAt,
  };
}

/** Key facts of the cover, as label / value pairs. */
export function coverFacts(cover: Cover): [string, string][] {
  return [
    ["Organisation", cover.organization],
    ["Lieu", cover.location],
    ["Référence", cover.reference],
    ["Mode", cover.mode],
    ["Classification", cover.classification],
    ["Journal ouvert le", when(cover.createdAt)],
    ["Journal clôturé le", when(cover.closedAt)],
    [
      "Version présentée",
      cover.snapshot ? `${cover.shown} · « ${cover.snapshot} »` : cover.shown,
    ],
    ["Contenu", cover.scope],
    ["Établi par", cover.author],
    ["Exporté le", `${dateTime(cover.exportedAt)} · heures Europe/Zurich`],
  ].filter(([, v]) => v) as [string, string][];
}

/** Every table of the dossier, in order. */
export const tablesOf = (dossier: Dossier) =>
  dossier.chapters.flatMap((c) =>
    c.blocks.flatMap((b) =>
      b.kind === "table" ? [{ chapter: c, table: b.table }] : [],
    ),
  );

// ---------- Counts and items, for the export centre ----------

/** Number of items of a part in a journal. */
export function sectionCount(journal: Journal, id: SectionId): number {
  const o = journal.ops;
  switch (id) {
    case "situation":
      return o.facts.length + o.boards.length;
    case "journal":
      return journal.entries.length;
    case "missions":
      return journal.entries.filter(needsFollowUp).length;
    case "messages":
      return o.messages.length;
    case "map":
      return o.places.length;
    case "resources":
      return o.resources.length;
    case "team":
      return o.cells.length + o.members.length;
    case "radio":
      return journal.radio.stations.length + journal.radio.terminals.length;
    case "contacts":
      return o.contacts.length;
    case "weather":
      return o.observations.length + o.alerts.length + o.forecasts.length;
    case "agenda":
      return o.agenda.length;
    case "links":
      return o.links.length;
    case "trace":
      return (
        journal.history.length +
        journal.entries.reduce((n, e) => n + e.revisions.length, 0)
      );
    case "exercise":
      return debriefCount(journal);
  }
}

export type Pickable = { id: string; title: string; detail: string };
/** Items of a part that can be chosen one by one (empty: whole part only). */
export function sectionItems(journal: Journal, id: SectionId): Pickable[] {
  const o = journal.ops;
  const entry = (e: Entry): Pickable => ({
    id: e.id,
    title: `${numberLabel(e)} ${clip(current(e).message.split("\n")[0], 90)}`,
    detail: [
      dateTime(current(e).happenedAt),
      current(e).type,
      current(e).status,
    ].join(" · "),
  });
  switch (id) {
    case "situation":
      return [
        ...o.facts.map((f) => ({
          id: f.id,
          title: f.label,
          detail: `Renseignement · ${[f.value, f.unit].filter(Boolean).join(" ") || "—"}`,
        })),
        ...o.boards.map((b) => ({
          id: b.id,
          title: b.title,
          detail: "Tableau de situation",
        })),
      ];
    case "journal":
      return chronological(journal.entries).map(entry);
    case "missions":
      return chronological(journal.entries.filter(needsFollowUp)).map(entry);
    case "messages":
      return o.messages.map((m) => ({
        id: m.id,
        title: m.subject || clip(m.body, 80) || "(sans objet)",
        detail: `${dateTime(m.receivedAt)} · ${m.from || "?"} → ${m.to || "?"}`,
      }));
    case "map":
      return o.places.map((p) => ({
        id: p.id,
        title: p.label || "(sans nom)",
        detail: [PLACE_KIND[p.kind], p.layer, symbolName(p.symbol, o.symbols)]
          .filter(Boolean)
          .join(" · "),
      }));
    case "resources":
      return o.resources.map((r) => ({
        id: r.id,
        title: r.name,
        detail: [r.kind, r.status, r.location].filter(Boolean).join(" · "),
      }));
    case "team":
      return [
        ...o.cells.map((c) => ({
          id: c.id,
          title: c.name,
          detail: `Poste · ${c.kind || "—"}`,
        })),
        ...o.members.map((m) => ({
          id: m.id,
          title: m.name,
          detail: [m.role, m.status].filter(Boolean).join(" · "),
        })),
      ];
    case "contacts":
      return o.contacts.map((c) => ({
        id: c.id,
        title: c.name,
        detail: [c.organization, c.phone].filter(Boolean).join(" · "),
      }));
    case "weather":
      return [
        ...o.alerts.map((a) => ({
          id: a.id,
          title: `${a.hazard} · degré ${a.level}`,
          detail: a.region || "Alerte",
        })),
        ...o.observations.map((x) => ({
          id: x.id,
          title: x.place || "Observation",
          detail: `Observation · ${dateTime(x.at)}`,
        })),
        ...o.forecasts.map((f) => ({
          id: f.id,
          title: `Prévision ${f.place}`,
          detail: `Reçue le ${dateTime(f.fetchedAt)}`,
        })),
      ];
    case "agenda":
      return o.agenda.map((a) => ({
        id: a.id,
        title: a.title,
        detail: `${dateTime(a.at)}${a.kind ? ` · ${a.kind}` : ""}`,
      }));
    case "links":
      return o.links.map((l) => ({
        id: l.id,
        title: l.label || "Lien",
        detail: `${KIND_INFO[parseRef(l.a).kind]?.label ?? "?"} ↔ ${KIND_INFO[parseRef(l.b).kind]?.label ?? "?"}`,
      }));
    case "trace":
      return [
        ...o.exports.map((e) => ({
          id: e.id,
          title: e.name,
          detail: `Export · ${dateTime(e.at)} · ${e.by}`,
        })),
        ...o.presentations.map((p) => ({
          id: p.id,
          title: p.audience || "Présentation",
          detail: `Présentation · ${dateTime(p.startedAt)}`,
        })),
      ];
    case "radio":
    case "exercise":
      return [];
  }
}
