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
import {
  formatNumber,
  formatTime,
  formatWith,
  locale,
} from "../../shared/i18n/core.ts";
import { enumLabel } from "../../shared/i18n/enums.ts";
import { t, tn, type Key } from "./i18n.ts";

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
/** Indicator counting items: singular or plural label (French: 0 and 1). */
const count = (n: number, one: Key, other: Key, tone?: Kpi["tone"]): Kpi => ({
  label: tn(n, one, other),
  value: String(n),
  ...(tone ? { tone } : {}),
});
/** Columns of a table: labels in the language of the post. */
const cols = (...list: [Key, number?][]): Column[] =>
  list.map(([label, weight]) => ({ label: t(label), weight: weight ?? 1 }));
/** "value : text", with the colon of the language. */
const labelled = (label: string, value: string) =>
  t("{label} : {value}", { label, value });
const hhmm = (ms: number) => formatTime(ms);
const dayName = (ms: number) =>
  formatWith(ms, { weekday: "short", day: "2-digit", month: "2-digit" });
const num = (v: number | null, unit = "", digits = 0) =>
  v === null
    ? ""
    : `${formatNumber(v, { maximumFractionDigits: digits })}${unit}`;
/** Sorting of texts in the language of the post. */
const byText = (a: string, b: string) => a.localeCompare(b, locale());

// WMO weather codes (Open-Meteo), same wording as the weather module.
const WMO: Record<number, Key> = {
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
  code === null
    ? ""
    : Object.hasOwn(WMO, code)
      ? t(WMO[code])
      : t("Code {code}", { code });

// Field names shown in the change details.
const FIELD_LABELS: Record<string, Key> = {
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
  cellId: "Poste (cellule)",
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
  if (typeof v === "string")
    return ISO.test(v) ? dateTime(v) : clip(enumLabel(v), 70);
  if (typeof v === "boolean") return v ? t("oui") : t("non");
  if (typeof v === "number") return String(v);
  if (Array.isArray(v))
    return v.every((x) => typeof x === "string")
      ? clip(v.join(", "), 70) || "∅"
      : tn(v.length, "{n} élément", "{n} éléments");
  return clip(stableStringify(v), 70);
}
/** "État : Disponible → Engagé", one line per field changed. */
export function changeDetail(before: unknown, after: unknown, max = 6) {
  const changes = diffStates(before, after);
  const out = changes
    .slice(0, max)
    .map(
      (c) =>
        `${labelled(Object.hasOwn(FIELD_LABELS, c.key) ? t(FIELD_LABELS[c.key]) : c.key, showValue(c.before))} → ${showValue(c.after)}`,
    );
  if (changes.length > max)
    out.push(t("… {n} autres champs", { n: changes.length - max }));
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
        title: t("Renseignements clés"),
        sheet: t("Renseignements clés"),
        caption: tn(facts.length, "{n} renseignement", "{n} renseignements"),
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
      meta: b.by
        ? t("Mis à jour le {date} par {name}", {
            date: when(b.updatedAt),
            name: b.by,
          })
        : t("Mis à jour le {date}", { date: when(b.updatedAt) }),
    });
  if (snapshots.length)
    blocks.push(
      table({
        id: "snapshots",
        title: t("Points de situation figés"),
        sheet: t("Points de situation"),
        caption: tn(snapshots.length, "{n} point", "{n} points"),
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
      count(facts.length, "renseignement clé", "renseignements clés"),
      count(boards.length, "tableau de situation", "tableaux de situation"),
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
      title: t("Entrées du journal"),
      sheet: t("Journal"),
      caption: tn(
        entries.length,
        "{n} entrée · ordre chronologique",
        "{n} entrées · ordre chronologique",
      ),
      columns: full,
      rows: entries.map((e) => {
        const f = current(e);
        return [
          numberLabel(e),
          when(f.happenedAt),
          when(f.receivedAt),
          enumLabel(f.type),
          enumLabel(f.priority),
          enumLabel(f.reliability),
          f.message,
          f.source,
          f.recipient,
          enumLabel(f.channel),
          f.location,
          f.coordinates,
          f.action,
          f.assignee,
          when(f.dueAt),
          enumLabel(f.status),
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
              enumLabel(f.type),
              f.priority !== "Normal" && enumLabel(f.priority),
            ),
            lines(
              when(f.happenedAt),
              f.receivedAt !== f.happenedAt &&
                t("reçu {date}", { date: when(f.receivedAt) }),
            ),
            lines(
              f.message,
              f.action && labelled(t("Mesure"), f.action),
              f.location && labelled(t("Lieu"), f.location),
              f.resources && labelled(t("Moyens"), f.resources),
              e.revisions.length > 1 &&
                t("{n} versions", { n: e.revisions.length }),
            ),
            lines(route(f), enumLabel(f.channel)),
            lines(
              enumLabel(f.status),
              f.assignee,
              f.dueAt && t("Échéance {date}", { date: when(f.dueAt) }),
            ),
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
            : t("Saisie initiale"),
        ]),
      );
    blocks.push(
      table({
        id: "versions",
        title: t("Versions des entrées"),
        sheet: t("Versions"),
        caption: tn(rows.length, "{n} version", "{n} versions"),
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
        title: t("Entrées supprimées"),
        sheet: t("Supprimées"),
        caption: t("Le contenu d’une entrée supprimée n’est pas conservé"),
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
      count(entries.length, "entrée", "entrées"),
      count(
        f.filter((x) => x.priority === "Urgent").length,
        "urgente",
        "urgentes",
        "crit",
      ),
      count(
        entries.filter(needsFollowUp).length,
        "à suivre",
        "à suivre",
        "warn",
      ),
      count(
        entries.filter((e) => e.revisions.length > 1).length,
        "modifiée",
        "modifiées",
      ),
      ...(journal.deleted.length
        ? [count(journal.deleted.length, "supprimée", "supprimées")]
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
      count(open.length, "ouverte", "ouvertes"),
      count(
        open.filter((e) => current(e).status === "En cours").length,
        "en cours",
        "en cours",
      ),
      count(late.length, "en retard", "en retard", "crit"),
    ],
    blocks: [
      table({
        id: "missions",
        title: t("Missions et points ouverts"),
        sheet: t("Missions"),
        caption: t("État au {date}", {
          date: dateTime(new Date(shownAt).toISOString()),
        }),
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
            enumLabel(f.type),
            enumLabel(f.priority),
            f.message,
            f.action,
            f.assignee,
            when(f.dueAt),
            enumLabel(f.status),
            overdue(e, shownAt) ? t("EN RETARD") : "",
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
                enumLabel(f.type),
                f.priority !== "Normal" && enumLabel(f.priority),
              ),
              lines(f.message, f.action && labelled(t("Mesure"), f.action)),
              lines(f.assignee || "—", enumLabel(f.status)),
              lines(
                when(f.dueAt) || "—",
                overdue(e, shownAt) && t("EN RETARD"),
              ),
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
      count(list.length, "message", "messages"),
      count(
        list.filter((m) => m.status === "Nouveau").length,
        "nouveau",
        "nouveaux",
        "warn",
      ),
      count(
        list.filter((m) => m.priority === "Urgent").length,
        "urgent",
        "urgents",
        "crit",
      ),
      count(
        list.filter((m) => m.replyNeeded && m.status !== "Classé").length,
        "réponse attendue",
        "réponses attendues",
      ),
    ],
    blocks: [
      table({
        id: "messages",
        title: t("Messages reçus"),
        sheet: t("Messages"),
        caption: tn(list.length, "{n} message", "{n} messages"),
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
          enumLabel(m.via),
          enumLabel(m.priority),
          m.category,
          m.subject,
          m.body,
          m.location,
          enumLabel(m.status),
          m.replyNeeded ? when(m.replyBy) || t("oui") : "",
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
              enumLabel(m.via),
            ),
            lines(`${m.from || "?"} → ${m.to || "?"}`),
            lines(
              m.subject && m.subject.toUpperCase(),
              m.body,
              m.location && labelled(t("Lieu"), m.location),
            ),
            lines(
              enumLabel(m.status),
              m.priority !== "Normal" && enumLabel(m.priority),
              m.replyNeeded &&
                (m.replyBy
                  ? t("Réponse {date}", { date: when(m.replyBy) })
                  : t("Réponse attendue")),
            ),
          ]),
        },
      }),
    ],
  };
}

const PLACE_KIND: Record<Place["kind"], Key> = {
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
  return t("{n} points · centre {position}", {
    n: p.points.length,
    position: coordinate([lat, lng]),
  });
}
/** Maps of the operation; a main map when none is defined. */
export function mapsOf(
  journal: Journal,
): Pick<OpsMap, "id" | "name" | "purpose">[] {
  return journal.ops.maps.length
    ? [...journal.ops.maps].sort((a, b) => a.order - b.order)
    : [{ id: "", name: t("Carte de situation"), purpose: "" }];
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
      (a, b) => byText(a.layer, b.layer) || byText(a.label, b.label),
    );
    blocks.push({
      kind: "map",
      mapId: m.id,
      title: m.name,
      caption: [m.purpose, tn(places.length, "{n} objet", "{n} objets")]
        .filter(Boolean)
        .join(" · "),
      objects: places.length,
    });
    blocks.push(
      table({
        id: `places-${i + 1}`,
        title:
          maps.length > 1
            ? t("Objets · {map}", { map: m.name })
            : t("Objets de la carte"),
        sheet:
          maps.length > 1 ? t("Carte {title}", { title: m.name }) : t("Carte"),
        caption: tn(places.length, "{n} objet", "{n} objets"),
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
          p.label || t("(sans nom)"),
          t(PLACE_KIND[p.kind]),
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
      count(maps.length, "carte", "cartes"),
      count(journal.ops.places.length, "objet", "objets"),
      ...(journal.ops.symbols.length
        ? [
            count(
              journal.ops.symbols.length,
              "signe personnalisé",
              "signes personnalisés",
            ),
          ]
        : []),
    ],
    blocks,
  };
}

function resourcesChapter({ journal }: Ctx): Built {
  const order = (s: string) => RESOURCE_STATUSES.indexOf(s as never);
  const list = [...journal.ops.resources].sort(
    (a, b) => order(a.status) - order(b.status) || byText(a.name, b.name),
  );
  const inState = (s: string) => list.filter((r) => r.status === s).length;
  return {
    kpis: [
      count(list.length, "moyen", "moyens"),
      count(inState("Engagé"), "engagé", "engagés", "ok"),
      count(inState("En route"), "en route", "en route"),
      count(inState("Disponible"), "disponible", "disponibles"),
      ...(inState("Hors service")
        ? [
            count(
              inState("Hors service"),
              "hors service",
              "hors service",
              "crit",
            ),
          ]
        : []),
    ],
    blocks: [
      table({
        id: "resources",
        title: t("Moyens"),
        sheet: t("Moyens"),
        caption: tn(list.length, "{n} moyen", "{n} moyens"),
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
          enumLabel(r.status),
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
            enumLabel(r.status),
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
    byText(a.name, b.name),
  );
  const cellName = (id: string) =>
    base.ops.cells.find((c) => c.id === id)?.name ?? "";
  const blocks: Block[] = [];
  if (cells.length || !members.length)
    blocks.push(
      table({
        id: "cells",
        title: t("Postes et cellules"),
        sheet: t("Postes"),
        caption: tn(cells.length, "{n} poste", "{n} postes"),
        columns: cols(
          ["Poste (cellule)", 2],
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
        title: t("Personnes"),
        sheet: t("Équipe"),
        caption: tn(members.length, "{n} personne", "{n} personnes"),
        columns: cols(
          ["Nom", 1.8],
          ["Grade", 0.8],
          ["Fonction", 1.8],
          ["Poste (cellule)", 1.4],
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
          enumLabel(m.status),
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
            lines(
              enumLabel(m.status),
              m.to && t("jusqu’à {date}", { date: when(m.to) }),
            ),
          ]),
        },
      }),
    );
  return {
    kpis: [
      count(cells.length, "poste", "postes"),
      count(members.length, "personne", "personnes"),
      count(
        members.filter((m) => m.status === "Présent").length,
        "présente",
        "présentes",
        "ok",
      ),
    ],
    blocks,
  };
}

const RADIO_SHEETS: Record<string, Key> = {
  plan: "Radio plan",
  groups: "Radio groupes",
  terminals: "Radio terminaux",
  custody: "Radio remises",
  checks: "Radio contrôles",
};
function radioChapter({ journal }: Ctx): Built {
  const s = radioSummary(journal.radio);
  const tables = radioTables(journal.radio).filter(
    (r) => r.body.length || r.id === "plan",
  );
  return {
    kpis: [
      count(journal.radio.stations.length, "nom d’appel", "noms d’appel"),
      count(journal.radio.talkgroups.length, "groupe", "groupes"),
      { label: t("terminaux remis"), value: `${s.issued} / ${s.terminals}` },
      count(journal.radio.checks.length, "contrôle", "contrôles"),
    ],
    blocks: tables.map((r) =>
      table({
        id: `radio-${r.id}`,
        title: r.title,
        sheet: Object.hasOwn(RADIO_SHEETS, r.id)
          ? t(RADIO_SHEETS[r.id])
          : t("Radio {id}", { id: r.id }),
        caption: r.caption,
        columns: r.head.map((label, i) => ({
          label,
          weight: r.widths?.[i] ?? 1,
        })),
        rows: r.body,
      }),
    ),
  };
}

function contactsChapter({ journal }: Ctx): Built {
  const list = [...journal.ops.contacts].sort(
    (a, b) =>
      Number(b.favorite) - Number(a.favorite) ||
      byText(a.category, b.category) ||
      byText(a.name, b.name),
  );
  return {
    kpis: [
      count(list.length, "contact", "contacts"),
      count(list.filter((c) => c.favorite).length, "favori", "favoris"),
    ],
    blocks: [
      table({
        id: "contacts",
        title: t("Annuaire"),
        sheet: t("Contacts"),
        caption: tn(list.length, "{n} contact", "{n} contacts"),
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
            lines(c.email, c.radio && t("Radio {id}", { id: c.radio })),
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
      title: t("Prévision pour {place}", { place: forecast.place }),
      body: [
        `${weather(c.code) || t("Conditions inconnues")}, ${num(c.temperature, " °C", 1)}`,
        c.wind !== null
          ? c.gusts !== null
            ? t("Vent {wind}, rafales {gusts}", {
                wind: num(c.wind, " km/h"),
                gusts: num(c.gusts, " km/h"),
              })
            : t("Vent {wind}", { wind: num(c.wind, " km/h") })
          : "",
        c.precipitation !== null
          ? t("Précipitations {value}", {
              value: num(c.precipitation, " mm", 1),
            })
          : "",
        c.humidity !== null
          ? t("Humidité {value}", { value: num(c.humidity, " %") })
          : "",
      ]
        .filter(Boolean)
        .join(" · "),
      meta: t("Reçue le {date} · modèle {model} · Open-Meteo", {
        date: when(forecast.fetchedAt),
        model: d.model || "—",
      }),
    });
    const hours = d.hours
      .filter((h) => h.at >= shownAt - 3600_000)
      .slice(0, 24);
    if (hours.length)
      blocks.push(
        table({
          id: "forecast-hours",
          title: t("Prochaines heures"),
          sheet: t("Météo heures"),
          caption: t("Prévision reçue le {date}", {
            date: when(forecast.fetchedAt),
          }),
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
          title: t("Prochains jours"),
          sheet: t("Météo jours"),
          caption: tn(d.days.length, "{n} jour", "{n} jours"),
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
  const stateLabel = (a: (typeof alerts)[number]) => t(state(a));
  if (alerts.length)
    blocks.push(
      table({
        id: "alerts",
        title: t("Alertes météo"),
        sheet: t("Alertes"),
        caption: tn(alerts.length, "{n} alerte", "{n} alertes"),
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
          enumLabel(ALERT_LABELS[a.level]),
          a.region,
          when(a.from),
          when(a.to),
          stateLabel(a),
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
        title: t("Observations sur place"),
        sheet: t("Observations"),
        caption: tn(observations.length, "{n} observation", "{n} observations"),
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
      count(
        alerts.filter((a) => state(a) === "En vigueur").length,
        "alerte en vigueur",
        "alertes en vigueur",
        "warn",
      ),
      count(observations.length, "observation", "observations"),
      count(
        journal.ops.forecasts.length,
        "prévision reçue",
        "prévisions reçues",
      ),
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
      count(list.length, "rendez-vous (un)", "rendez-vous"),
      count(
        list.filter((a) => state(a) === "À venir").length,
        "à venir",
        "à venir",
      ),
    ],
    blocks: [
      table({
        id: "agenda",
        title: t("Rythme de conduite"),
        sheet: t("Agenda"),
        caption: tn(list.length, "{n} rendez-vous (un)", "{n} rendez-vous"),
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
          t(state(a)),
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
    return t("{kind} (absent à cette heure)", {
      kind: KIND_INFO[kind]?.label ?? t("Élément"),
    });
  };
  const list = [...journal.ops.links].sort(
    (a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt),
  );
  return {
    kpis: [count(list.length, "lien", "liens")],
    blocks: [
      table({
        id: "links",
        title: t("Liens entre les éléments"),
        sheet: t("Liens"),
        caption: t("Liens créés par les opérateurs"),
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

const ACTIONS: Record<AuditItem["action"], Key> = {
  create: "Création",
  update: "Modification",
  remove: "Suppression",
};
/** Mode of a presentation (fixed values written by the presentation mode). */
const presentationMode = (mode: string) =>
  mode === "Présentation" || mode === "Affichage mural" ? t(mode) : mode;
function traceChapter({ journal }: Ctx): Built {
  // The trail of what this export covers (the history is already limited to
  // the parts and items chosen), entries included, up to the time shown.
  const trail = auditTrail(journal).reverse();
  const people = new Set(trail.map((x) => x.by).filter(Boolean));
  const blocks: Block[] = [
    table({
      id: "trail",
      title: t("Historique des changements"),
      sheet: t("Traçabilité"),
      caption: tn(
        trail.length,
        "{n} changement · ordre chronologique",
        "{n} changements · ordre chronologique",
      ),
      columns: cols(
        ["Heure", 1.3],
        ["Qui", 1.4],
        ["Action", 1.1],
        ["Élément", 1.4],
        ["Désignation", 2.4],
        ["Détail", 4],
      ),
      rows: trail.map((x) => [
        when(x.at),
        x.by,
        t(ACTIONS[x.action]),
        scopeInfo(x.scope).label,
        x.title,
        lines(
          x.note,
          x.action === "update" && changeDetail(x.previous, x.state),
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
        title: t("Registre des exports"),
        sheet: t("Exports"),
        caption: tn(exports.length, "{n} fichier", "{n} fichiers"),
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
        title: t("Présentations données"),
        sheet: t("Présentations"),
        caption: tn(talks.length, "{n} présentation", "{n} présentations"),
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
          p.viewAt ? when(p.viewAt) : t("état en direct"),
          String(p.slides),
          presentationMode(p.mode),
        ]),
      }),
    );
  return {
    kpis: [
      count(trail.length, "changement", "changements"),
      count(people.size, "personne", "personnes"),
      count(exports.length, "export", "exports"),
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
  options.onProgress?.(0, total, t("Reconstitution de la version choisie"));
  await pause();
  const { base, journal } = resolveScope(live, scope);
  const shownAt = scope.viewAt ?? Date.now();
  const ctx: Ctx = { journal, base, scope, shownAt, options };
  const chapters: Chapter[] = [];
  for (const [i, id] of sections.entries()) {
    const title = SECTIONS.find((s) => s.id === id)!.label;
    options.onProgress?.(i + 1, total, title);
    await pause();
    const { kpis, blocks } = BUILDERS[id](ctx);
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
          ? t("État actuel")
          : t("Version du {date}", {
              date: dateTime(new Date(scope.viewAt).toISOString()),
            }),
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
    [t("Organisation"), cover.organization],
    [t("Lieu"), cover.location],
    [t("Référence"), cover.reference],
    [t("Mode"), enumLabel(cover.mode)],
    [t("Classification"), enumLabel(cover.classification)],
    [t("Journal ouvert le"), when(cover.createdAt)],
    [t("Journal clôturé le"), when(cover.closedAt)],
    [
      t("Version présentée"),
      cover.snapshot ? `${cover.shown} · « ${cover.snapshot} »` : cover.shown,
    ],
    [t("Contenu"), cover.scope],
    [t("Établi par"), cover.author],
    [
      t("Exporté le"),
      t("{date} · heures Europe/Zurich", {
        date: dateTime(cover.exportedAt),
      }),
    ],
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
      enumLabel(current(e).type),
      enumLabel(current(e).status),
    ].join(" · "),
  });
  switch (id) {
    case "situation":
      return [
        ...o.facts.map((f) => ({
          id: f.id,
          title: f.label,
          detail: `${t("Renseignement")} · ${[f.value, f.unit].filter(Boolean).join(" ") || "—"}`,
        })),
        ...o.boards.map((b) => ({
          id: b.id,
          title: b.title,
          detail: t("Tableau de situation"),
        })),
      ];
    case "journal":
      return chronological(journal.entries).map(entry);
    case "missions":
      return chronological(journal.entries.filter(needsFollowUp)).map(entry);
    case "messages":
      return o.messages.map((m) => ({
        id: m.id,
        title: m.subject || clip(m.body, 80) || t("(sans objet)"),
        detail: `${dateTime(m.receivedAt)} · ${m.from || "?"} → ${m.to || "?"}`,
      }));
    case "map":
      return o.places.map((p) => ({
        id: p.id,
        title: p.label || t("(sans nom)"),
        detail: [
          t(PLACE_KIND[p.kind]),
          p.layer,
          symbolName(p.symbol, o.symbols),
        ]
          .filter(Boolean)
          .join(" · "),
      }));
    case "resources":
      return o.resources.map((r) => ({
        id: r.id,
        title: r.name,
        detail: [r.kind, enumLabel(r.status), r.location]
          .filter(Boolean)
          .join(" · "),
      }));
    case "team":
      return [
        ...o.cells.map((c) => ({
          id: c.id,
          title: c.name,
          detail: `${t("Poste (cellule)")} · ${c.kind || "—"}`,
        })),
        ...o.members.map((m) => ({
          id: m.id,
          title: m.name,
          detail: [m.role, enumLabel(m.status)].filter(Boolean).join(" · "),
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
          title: t("{hazard} · degré {level}", {
            hazard: a.hazard,
            level: a.level,
          }),
          detail: a.region || t("Alerte"),
        })),
        ...o.observations.map((x) => ({
          id: x.id,
          title: x.place || t("Observation"),
          detail: `${t("Observation")} · ${dateTime(x.at)}`,
        })),
        ...o.forecasts.map((f) => ({
          id: f.id,
          title: t("Prévision {place}", { place: f.place }),
          detail: t("Reçue le {date}", { date: dateTime(f.fetchedAt) }),
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
        title: l.label || t("Lien"),
        detail: `${KIND_INFO[parseRef(l.a).kind]?.label ?? "?"} ↔ ${KIND_INFO[parseRef(l.b).kind]?.label ?? "?"}`,
      }));
    case "trace":
      return [
        ...o.exports.map((e) => ({
          id: e.id,
          title: e.name,
          detail: `${t("Export")} · ${dateTime(e.at)} · ${e.by}`,
        })),
        ...o.presentations.map((p) => ({
          id: p.id,
          title: p.audience || t("Présentation"),
          detail: `${t("Présentation")} · ${dateTime(p.startedAt)}`,
        })),
      ];
    case "radio":
    case "exercise":
      return [];
  }
}
