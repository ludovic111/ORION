import {
  chronological,
  current,
  dateTime,
  needsFollowUp,
  numberLabel,
  overdue,
  time,
  type Entry,
  type Journal,
} from "../../shared/journal.ts";
import { ALERT_LABELS, type Place } from "../../shared/ops.ts";
import { CHECK_LABELS, radioSummary } from "../../shared/radio.ts";
import {
  changesBetween,
  firstMoment,
  journalAt,
  scopeInfo,
} from "../../shared/history.ts";
import type { SectionId } from "../export/scope.ts";
import { cssColor } from "./text.ts";

// The slides of a situation briefing, built from a journal already scoped
// to the parts and the moment chosen. Pure data: the presentation mode, the
// wall display and every file writer (PowerPoint, OpenDocument, PDF, HTML)
// draw the same deck. Empty slides are left out.

export type Tone = "ok" | "warn" | "crit" | "accent" | "info" | "muted";

export type SlideKind =
  | "title"
  | "situation"
  | "facts"
  | "map"
  | "changes"
  | "highlights"
  | "missions"
  | "resources"
  | "team"
  | "radio"
  | "weather"
  | "agenda"
  | "closing";

/** Every kind of slide, in the default order, with the parts it shows. */
export const SLIDE_INFO: {
  kind: SlideKind;
  label: string;
  detail: string;
  /** Parts of the operation shown; empty: always available. */
  sections: SectionId[];
}[] = [
  {
    kind: "title",
    label: "Titre",
    detail: "Opération, version présentée, orateur",
    sections: [],
  },
  {
    kind: "situation",
    label: "Situation générale",
    detail: "Tableaux de situation, idée de manœuvre",
    sections: ["situation"],
  },
  {
    kind: "facts",
    label: "Chiffres clés",
    detail: "Renseignements clés et évolution",
    sections: ["situation"],
  },
  {
    kind: "map",
    label: "Carte",
    detail: "Une diapositive par carte, avec légende",
    sections: ["map"],
  },
  {
    kind: "changes",
    label: "Ce qui a changé",
    detail: "Depuis le dernier point de situation",
    sections: [],
  },
  {
    kind: "highlights",
    label: "Faits marquants",
    detail: "Entrées importantes, urgentes et décisions",
    sections: ["journal"],
  },
  {
    kind: "missions",
    label: "Missions en cours",
    detail: "À traiter, en cours, en retard",
    sections: ["missions", "journal"],
  },
  {
    kind: "resources",
    label: "Moyens",
    detail: "Engagés, disponibles, par organisation",
    sections: ["resources"],
  },
  {
    kind: "team",
    label: "Organisation",
    detail: "Postes, cellules et fonctions clés",
    sections: ["team"],
  },
  {
    kind: "radio",
    label: "Réseau radio",
    detail: "Terminaux, groupes, liaisons",
    sections: ["radio"],
  },
  {
    kind: "weather",
    label: "Météo",
    detail: "Conditions, prochaines heures, alertes",
    sections: ["weather"],
  },
  {
    kind: "agenda",
    label: "Prochaines échéances",
    detail: "Rythme de conduite et délais",
    sections: ["agenda", "missions"],
  },
  {
    kind: "closing",
    label: "Questions",
    detail: "Contact et prochain point",
    sections: [],
  },
];
export const slideInfo = (kind: SlideKind) =>
  SLIDE_INFO.find((s) => s.kind === kind)!;

type Base = {
  /** Stable id: the kind, or "map:<id>" for a map. */
  id: string;
  /** Small line above the title. */
  kicker: string;
  title: string;
  /** Speaker notes (plain text, one idea per line). */
  notes: string;
};
export type Badge = { label: string; tone: Tone };

export type TitleSlide = Base & {
  kind: "title";
  operation: string;
  organization: string;
  location: string;
  reference: string;
  badges: Badge[];
  /** "Situation au …" or "Version du … (point « … »)". */
  when: string;
  presenter: string;
  audience: string;
};
export type BoardItem = { id: string; title: string; body: string };
export type SituationSlide = Base & {
  kind: "situation";
  intent: BoardItem | null;
  boards: BoardItem[];
};
export type FactItem = {
  id: string;
  label: string;
  value: string;
  unit: string;
  category: string;
  note: string;
  /** Parsed value, for the animated counters; null: not a number. */
  number: number | null;
  /** "+4", "−2", "inchangé", "nouveau" or "". */
  delta: string;
  trend: "up" | "down" | "same" | "new" | "";
};
export type FactsSlide = Base & {
  kind: "facts";
  /** "depuis 14:00" when an evolution is shown, else "". */
  since: string;
  facts: FactItem[];
};
export type LegendItem = {
  symbol: string;
  name: string;
  kind: Place["kind"];
  color: string;
  count: number;
};
export type MapSlide = Base & {
  kind: "map";
  mapId: string;
  purpose: string;
  base: string;
  objects: number;
  placeIds: string[];
  legend: { layer: string; items: LegendItem[] }[];
};
export type ChangeGroup = {
  label: string;
  created: number;
  updated: number;
  removed: number;
  highlights: string[];
};
export type ChangesSlide = Base & {
  kind: "changes";
  since: string;
  total: number;
  groups: ChangeGroup[];
};
export type TimelineItem = {
  id: string;
  time: string;
  number: string;
  type: string;
  priority: string;
  status: string;
  text: string;
  tone: Tone;
};
export type HighlightsSlide = Base & {
  kind: "highlights";
  items: TimelineItem[];
  more: number;
};
export type MissionItem = {
  id: string;
  number: string;
  text: string;
  assignee: string;
  due: string;
  status: string;
  late: boolean;
  priority: string;
};
export type MissionsSlide = Base & {
  kind: "missions";
  open: number;
  late: number;
  items: MissionItem[];
  more: number;
};
export type ResourcesSlide = Base & {
  kind: "resources";
  totals: { label: string; value: number; tone: Tone }[];
  head: string[];
  rows: string[][];
  engaged: {
    name: string;
    organization: string;
    location: string;
    mission: string;
    count: number;
  }[];
};
export type TeamCell = {
  id: string;
  name: string;
  kind: string;
  location: string;
  radio: string;
  color: string;
  members: { name: string; role: string; status: string }[];
};
export type TeamSlide = Base & {
  kind: "team";
  present: number;
  total: number;
  cells: TeamCell[];
};
export type RadioSlide = Base & {
  kind: "radio";
  stats: { label: string; value: string; tone: Tone }[];
  groups: { name: string; number: string; usage: string; mode: string }[];
  weak: { callsign: string; result: string; time: string }[];
};
export type WeatherHour = {
  time: string;
  label: string;
  code: number | null;
  temperature: string;
  precipitation: string;
  wind: string;
};
export type WeatherSlide = Base & {
  kind: "weather";
  place: string;
  source: string;
  now: {
    label: string;
    code: number | null;
    temperature: string;
    wind: string;
    precipitation: string;
    humidity: string;
  } | null;
  hours: WeatherHour[];
  alerts: {
    level: string;
    hazard: string;
    region: string;
    period: string;
    tone: Tone;
  }[];
  observation: { time: string; place: string; text: string } | null;
};
export type AgendaItem = {
  id: string;
  time: string;
  day: string;
  relative: string;
  title: string;
  detail: string;
  kind: string;
  next: boolean;
  late: boolean;
};
export type AgendaSlide = Base & { kind: "agenda"; items: AgendaItem[] };
export type ClosingSlide = Base & {
  kind: "closing";
  presenter: string;
  organization: string;
  next: string;
  contacts: { name: string; role: string; phone: string }[];
};

export type Slide =
  | TitleSlide
  | SituationSlide
  | FactsSlide
  | MapSlide
  | ChangesSlide
  | HighlightsSlide
  | MissionsSlide
  | ResourcesSlide
  | TeamSlide
  | RadioSlide
  | WeatherSlide
  | AgendaSlide
  | ClosingSlide;

export type Deck = {
  title: string;
  /** Line under the title and in the footers. */
  when: string;
  /** Moment shown, ms since epoch. */
  at: number;
  live: boolean;
  /** Diagonal mark: "EXERCICE", "CONFIDENTIEL"… or "". */
  watermark: string;
  slides: Slide[];
};

export type DeckBuildOptions = {
  /** Moment shown (ms since epoch). */
  at: number;
  /** True when the deck shows the live situation ("maintenant"). */
  live: boolean;
  presenter: string;
  audience?: string;
  /** Title of the deck (default: journal title). */
  title?: string;
  /** Name of the frozen point shown, if any. */
  snapshot?: string;
  /** Parts chosen; slides of other parts are left out (default: all). */
  sections?: SectionId[];
  /** Whole journal, unscoped, for the evolutions (history). */
  full?: Journal;
  /** Moment compared with; default: previous frozen point or presentation. */
  since?: number | null;
  /** Name of a map symbol (official catalog), when known. */
  symbolName?: (id: string) => string | undefined;
};

// ---------- Helpers ----------

const iso = (ms: number) => new Date(ms).toISOString();
const clip = (s: string, n: number) =>
  s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s;
const firstLine = (s: string) => s.split("\n")[0].trim();
const plural = (n: number, one: string, many: string) =>
  `${n} ${n > 1 ? many : one}`;
const MIN = 60_000;

/** "dans 45 min", "dans 2 h 10", "il y a 5 min", "maintenant". */
export function relative(target: number, from: number): string {
  const minutes = Math.round((target - from) / MIN);
  const abs = Math.abs(minutes);
  if (abs < 1) return "maintenant";
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  const span = h
    ? `${h} h${m ? ` ${String(m).padStart(2, "0")}` : ""}`
    : `${m} min`;
  return minutes > 0 ? `dans ${span}` : `il y a ${span}`;
}

/** Number written in a key fact ("+ 45", "1’200", "12,5"); null otherwise. */
export function parseNumber(value: string): number | null {
  const cleaned = value
    .replace(/[\s’'_]/g, "")
    .replace(/−/g, "-")
    .replace(",", ".");
  const match = cleaned.match(/^[+-]?\d+(\.\d+)?$/);
  return match ? Number(cleaned) : null;
}
const signed = (n: number) => {
  const r = Math.round(n * 100) / 100;
  const s = Math.abs(r).toLocaleString("fr-CH");
  return r > 0 ? `+${s}` : r < 0 ? `−${s}` : "inchangé";
};

/** Classification mark of an operation, for every slide. */
export function watermarkFor(
  journal: Pick<Journal, "mode" | "classification">,
) {
  return [
    journal.mode === "Exercice" ? "EXERCICE" : "",
    journal.classification === "Confidentiel" ? "CONFIDENTIEL" : "",
  ]
    .filter(Boolean)
    .join(" · ");
}

// WMO weather codes (same wording as the weather module).
const WMO: Record<number, string> = {
  0: "Ciel clair",
  1: "Plutôt ensoleillé",
  2: "Partiellement nuageux",
  3: "Couvert",
  45: "Brouillard",
  48: "Brouillard givrant",
  51: "Bruine faible",
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
export const weatherText = (code: number | null) =>
  code === null ? "Conditions inconnues" : (WMO[code] ?? `Code ${code}`);
const COMPASS = "N NNE NE ENE E ESE SE SSE S SSO SO OSO O ONO NO NNO".split(
  " ",
);
const compass = (deg: number) =>
  COMPASS[Math.round((((deg % 360) + 360) % 360) / 22.5) % 16];
const num = (v: number | null, unit: string, digits = 0) =>
  v === null
    ? "—"
    : `${v.toLocaleString("fr-CH", { maximumFractionDigits: digits })}${unit}`;

const INTENT = /intention|man(œ|oe)uvre|intent/i;
const KEY_ROLE = /chef|responsable|officier|commandant|direct/i;

// ---------- Reference moment for the evolutions ----------

/** Moment compared with: previous frozen point, presentation, or 3 h. */
export function referenceMoment(
  journal: Journal,
  at: number,
): { at: number; label: string } | null {
  const before = at - MIN;
  const snapshot = [...journal.ops.snapshots]
    .filter((s) => Date.parse(s.at) < before)
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at))[0];
  if (snapshot)
    return {
      at: Date.parse(snapshot.at),
      label: `depuis « ${snapshot.title} » (${time(snapshot.at)})`,
    };
  const talk = [...journal.ops.presentations]
    .filter((p) => Date.parse(p.startedAt) < before)
    .sort((a, b) => Date.parse(b.startedAt) - Date.parse(a.startedAt))[0];
  if (talk)
    return {
      at: Date.parse(talk.startedAt),
      label: `depuis la dernière présentation (${time(talk.startedAt)})`,
    };
  const start = Date.parse(firstMoment(journal));
  const threeHours = at - 3 * 60 * MIN;
  if (!(start < at)) return null;
  return threeHours > start
    ? { at: threeHours, label: `depuis 3 heures (${time(iso(threeHours))})` }
    : { at: start, label: `depuis le début (${time(iso(start))})` };
}

// Parts owning each module of the audit trail.
const MODULE_SECTION: Record<string, SectionId> = {
  journal: "journal",
  messages: "messages",
  map: "map",
  resources: "resources",
  team: "team",
  contacts: "contacts",
  weather: "weather",
  agenda: "agenda",
  situation: "situation",
  radio: "radio",
};
const IGNORED_SCOPES = new Set([
  "settings",
  "ops.exports",
  "ops.presentations",
  "ops.snapshots",
  "ops.links",
  "ops.symbols",
]);

// ---------- Slides ----------

function titleSlide(
  journal: Journal,
  o: DeckBuildOptions,
  when: string,
): TitleSlide {
  const badges: Badge[] = [
    {
      label: journal.mode.toUpperCase(),
      tone: journal.mode === "Exercice" ? "accent" : "crit",
    },
    {
      label: journal.classification.toUpperCase(),
      tone: journal.classification === "Confidentiel" ? "crit" : "muted",
    },
  ];
  if (!o.live) badges.push({ label: "VERSION PASSÉE", tone: "warn" });
  const operation = o.title?.trim() || journal.title;
  return {
    id: "title",
    kind: "title",
    kicker: "Point de situation",
    title: operation,
    operation,
    organization: journal.organization,
    location: journal.location,
    reference: journal.reference,
    badges,
    when,
    presenter: o.presenter,
    audience: o.audience ?? "",
    notes: [
      `Se présenter : ${o.presenter || "nom, fonction"}.`,
      o.audience ? `Public : ${o.audience}.` : "",
      `${when}.`,
      o.live
        ? "Les chiffres sont ceux du moment : ils peuvent évoluer pendant la présentation."
        : "Version passée : préciser que la situation a pu évoluer depuis.",
    ]
      .filter(Boolean)
      .join("\n"),
  };
}

function situationSlide(journal: Journal): SituationSlide | null {
  const boards = [...journal.ops.boards]
    .filter((b) => b.body.trim())
    .sort((a, b) => a.order - b.order)
    .map((b) => ({ id: b.id, title: b.title, body: b.body.trim() }));
  if (!boards.length) return null;
  const intent = boards.find((b) => INTENT.test(b.title)) ?? null;
  return {
    id: "situation",
    kind: "situation",
    kicker: "Situation",
    title: "Situation générale",
    intent,
    boards: boards.filter((b) => b !== intent),
    notes: boards
      .map((b) => `${b.title} : ${clip(b.body.replace(/\s+/g, " "), 400)}`)
      .join("\n"),
  };
}

function factsSlide(
  journal: Journal,
  before: Journal | null,
  sinceLabel: string,
): FactsSlide | null {
  const facts = [...journal.ops.facts].sort((a, b) => a.order - b.order);
  if (!facts.length) return null;
  const items: FactItem[] = facts.map((f) => {
    const number = parseNumber(f.value);
    let delta = "";
    let trend: FactItem["trend"] = "";
    if (before) {
      const old = before.ops.facts.find((x) => x.id === f.id);
      if (!old) {
        delta = "nouveau";
        trend = "new";
      } else {
        const was = parseNumber(old.value);
        if (number !== null && was !== null) {
          delta = signed(number - was);
          trend = number > was ? "up" : number < was ? "down" : "same";
        } else if (old.value !== f.value) {
          delta = `avant : ${old.value || "—"}`;
          trend = "up";
        }
      }
    }
    return {
      id: f.id,
      label: f.label,
      value: f.value || "—",
      unit: f.unit,
      category: f.category,
      note: f.note,
      number,
      delta,
      trend,
    };
  });
  const moved = items.filter((i) => i.trend && i.trend !== "same");
  return {
    id: "facts",
    kind: "facts",
    kicker: "Situation",
    title: "Chiffres clés",
    since: before ? sinceLabel : "",
    facts: items,
    notes: [
      ...items.map(
        (i) =>
          `${i.label} : ${i.value}${i.unit ? ` ${i.unit}` : ""}${i.delta && i.trend !== "same" ? ` (${i.delta})` : ""}${i.note ? ` · ${i.note}` : ""}`,
      ),
      before && !moved.length ? `Aucune évolution ${sinceLabel}.` : "",
    ]
      .filter(Boolean)
      .join("\n"),
  };
}

function mapSlides(journal: Journal, o: DeckBuildOptions): MapSlide[] {
  const maps = [...journal.ops.maps].sort((a, b) => a.order - b.order);
  const list = maps.length
    ? maps.map((m) => ({
        id: m.id,
        name: m.name,
        purpose: m.purpose,
        base: m.base,
        hidden: new Set(m.hidden),
      }))
    : [
        {
          id: "",
          name: "Carte de situation",
          purpose: "",
          base: "",
          hidden: new Set<string>(),
        },
      ];
  const slides: MapSlide[] = [];
  for (const m of list) {
    const places = journal.ops.places.filter(
      (p) =>
        (!m.id || !p.maps.length || p.maps.includes(m.id)) &&
        !m.hidden.has(p.layer),
    );
    if (!places.length) continue;
    const layers = new Map<string, Map<string, LegendItem>>();
    for (const p of places) {
      const layer = p.layer || "Autre";
      const items = layers.get(layer) ?? new Map<string, LegendItem>();
      const key =
        p.kind === "point" && p.symbol
          ? p.symbol
          : `${p.kind}:${cssColor(p.color)}`;
      const item = items.get(key);
      if (item) item.count++;
      else
        items.set(key, {
          symbol: p.kind === "point" ? p.symbol : "",
          name:
            (p.kind === "point" && p.symbol && o.symbolName?.(p.symbol)) ||
            p.label ||
            { point: "Point", line: "Ligne", area: "Zone", text: "Texte" }[
              p.kind
            ],
          kind: p.kind,
          color: cssColor(p.color),
          count: 1,
        });
      layers.set(layer, items);
    }
    const legend = [...layers.entries()]
      .map(([layer, items]) => ({
        layer,
        items: [...items.values()].sort((a, b) => b.count - a.count),
      }))
      .sort((a, b) => a.layer.localeCompare(b.layer, "fr"));
    slides.push({
      id: m.id ? `map:${m.id}` : "map",
      kind: "map",
      kicker: "Carte",
      title: m.name,
      mapId: m.id,
      purpose: m.purpose,
      base: m.base,
      objects: places.length,
      placeIds: places.map((p) => p.id),
      legend,
      notes: [
        m.purpose,
        `${plural(places.length, "objet", "objets")} sur la carte.`,
        ...legend.map(
          (l) =>
            `${l.layer} : ${l.items
              .slice(0, 6)
              .map((i) => (i.count > 1 ? `${i.name} (${i.count})` : i.name))
              .join(", ")}`,
        ),
      ]
        .filter(Boolean)
        .join("\n"),
    });
  }
  return slides;
}

function changesSlide(
  full: Journal,
  from: number,
  to: number,
  sinceLabel: string,
  sections: Set<SectionId>,
): ChangesSlide | null {
  const items = changesBetween(full, from, to).filter((i) => {
    if (IGNORED_SCOPES.has(i.scope)) return false;
    const info = scopeInfo(i.scope);
    if (i.scope === "entries" || i.scope === "meta")
      return sections.has("journal") || sections.has("missions");
    const section = MODULE_SECTION[info.module];
    return !!section && sections.has(section);
  });
  if (!items.length) return null;
  // One line per record: created, changed or removed over the period.
  type Acc = {
    label: string;
    targets: Map<string, { first: string; last: string; title: string }>;
  };
  const groups = new Map<string, Acc>();
  for (const i of [...items].reverse()) {
    const label = scopeInfo(i.scope).plural;
    const group = groups.get(label) ?? { label, targets: new Map() };
    const t = group.targets.get(i.target);
    if (t) {
      t.last = i.action;
      t.title = i.title;
    } else
      group.targets.set(i.target, {
        first: i.action,
        last: i.action,
        title: i.title,
      });
    groups.set(label, group);
  }
  const result: ChangeGroup[] = [...groups.values()]
    .map((g) => {
      let created = 0,
        updated = 0,
        removed = 0;
      const highlights: string[] = [];
      for (const t of g.targets.values()) {
        const state =
          t.last === "remove"
            ? "retiré"
            : t.first === "create"
              ? "nouveau"
              : "modifié";
        if (state === "retiré") removed++;
        else if (state === "nouveau") created++;
        else updated++;
        highlights.push(
          `${state[0].toUpperCase()}${state.slice(1)} · ${t.title}`,
        );
      }
      return {
        label: g.label,
        created,
        updated,
        removed,
        highlights: highlights.reverse().slice(0, 4),
      };
    })
    .sort(
      (a, b) =>
        b.created + b.updated + b.removed - (a.created + a.updated + a.removed),
    );
  const total = result.reduce(
    (n, g) => n + g.created + g.updated + g.removed,
    0,
  );
  return {
    id: "changes",
    kind: "changes",
    kicker: "Évolution",
    title: "Ce qui a changé",
    since: sinceLabel,
    total,
    groups: result,
    notes: [
      `${plural(total, "élément a changé", "éléments ont changé")} ${sinceLabel}.`,
      ...result.map(
        (g) =>
          `${g.label} : ${[
            g.created && plural(g.created, "nouveau", "nouveaux"),
            g.updated && plural(g.updated, "modifié", "modifiés"),
            g.removed && plural(g.removed, "retiré", "retirés"),
          ]
            .filter(Boolean)
            .join(", ")}`,
      ),
    ].join("\n"),
  };
}

const entryTone = (e: Entry): Tone => {
  const f = current(e);
  if (f.priority === "Urgent") return "crit";
  if (f.type === "Décision") return "accent";
  if (f.priority === "Important") return "warn";
  return "info";
};

function highlightsSlide(journal: Journal): HighlightsSlide | null {
  const marked = chronological(journal.entries).filter((e) => {
    const f = current(e);
    return f.priority !== "Normal" || f.type === "Décision";
  });
  if (!marked.length) return null;
  const shown = marked.slice(-6);
  const items = shown.map((e) => {
    const f = current(e);
    return {
      id: e.id,
      time: time(f.happenedAt),
      number: numberLabel(e),
      type: f.type,
      priority: f.priority,
      status: f.status,
      text: clip(firstLine(f.message) || f.message, 220),
      tone: entryTone(e),
    };
  });
  return {
    id: "highlights",
    kind: "highlights",
    kicker: "Journal",
    title: "Faits marquants",
    items,
    more: marked.length - shown.length,
    notes: items
      .map((i) => `${i.time} ${i.number} ${i.type} (${i.priority}) : ${i.text}`)
      .join("\n"),
  };
}

function missionsSlide(journal: Journal, at: number): MissionsSlide | null {
  const open = journal.entries.filter(needsFollowUp);
  if (!open.length) return null;
  const late = open.filter((e) => overdue(e, at));
  const due = (e: Entry) =>
    current(e).dueAt ? Date.parse(current(e).dueAt) : Infinity;
  const sorted = [...open].sort(
    (a, b) =>
      Number(overdue(b, at)) - Number(overdue(a, at)) ||
      due(a) - due(b) ||
      a.number - b.number,
  );
  const shown = sorted.slice(0, 7);
  const items = shown.map((e) => {
    const f = current(e);
    const text = [firstLine(f.message), f.action && `→ ${firstLine(f.action)}`]
      .filter(Boolean)
      .join(" ");
    return {
      id: e.id,
      number: numberLabel(e),
      text: clip(text, 180),
      assignee: f.assignee || "—",
      due: f.dueAt
        ? `${time(f.dueAt)} · ${relative(Date.parse(f.dueAt), at)}`
        : "—",
      status: overdue(e, at) ? "En retard" : f.status,
      late: overdue(e, at),
      priority: f.priority,
    };
  });
  return {
    id: "missions",
    kind: "missions",
    kicker: "Conduite",
    title: late.length ? "Missions en cours et en retard" : "Missions en cours",
    open: open.length,
    late: late.length,
    items,
    more: open.length - shown.length,
    notes: [
      `${plural(open.length, "point ouvert", "points ouverts")}, dont ${plural(late.length, "en retard", "en retard")}.`,
      ...items.map(
        (i) =>
          `${i.number} ${i.late ? "EN RETARD " : ""}${i.text} · ${i.assignee} · ${i.due}`,
      ),
    ].join("\n"),
  };
}

function resourcesSlide(journal: Journal): ResourcesSlide | null {
  const list = journal.ops.resources;
  if (!list.length) return null;
  const count = (...statuses: string[]) =>
    list.filter((r) => statuses.includes(r.status)).length;
  const totals: ResourcesSlide["totals"] = [
    { label: "Engagés", value: count("Engagé"), tone: "accent" },
    {
      label: "Alertés / en route",
      value: count("Alerté", "En route"),
      tone: "warn",
    },
    {
      label: "Disponibles",
      value: count("Disponible", "De retour"),
      tone: "ok",
    },
    { label: "Hors service", value: count("Hors service"), tone: "crit" },
  ];
  const orgs = new Map<string, number[]>();
  for (const r of list) {
    const key = r.organization || "Sans organisation";
    const row = orgs.get(key) ?? [0, 0, 0, 0];
    const col =
      r.status === "Engagé"
        ? 0
        : r.status === "Alerté" || r.status === "En route"
          ? 1
          : r.status === "Hors service"
            ? 3
            : 2;
    row[col]++;
    orgs.set(key, row);
  }
  const rows = [...orgs.entries()]
    .sort((a, b) => b[1][0] - a[1][0] || a[0].localeCompare(b[0], "fr"))
    .map(([org, v]) => [org, ...v.map(String)]);
  if (rows.length > 1)
    rows.push(["Total", ...totals.map((t) => String(t.value))]);
  const engaged = list
    .filter((r) => r.status === "Engagé")
    .map((r) => ({
      name: r.name,
      organization: r.organization,
      location: r.location,
      mission: r.mission,
      count: r.count,
    }));
  return {
    id: "resources",
    kind: "resources",
    kicker: "Moyens",
    title: "Moyens engagés et disponibles",
    totals,
    head: [
      "Organisation",
      "Engagés",
      "Alertés / en route",
      "Disponibles",
      "Hors service",
    ],
    rows,
    engaged,
    notes: [
      totals.map((t) => `${t.label} : ${t.value}`).join(" · "),
      ...engaged.map(
        (e) =>
          `${e.name}${e.count > 1 ? ` (${e.count})` : ""}${e.location ? ` · ${e.location}` : ""}${e.mission ? ` · ${e.mission}` : ""}`,
      ),
    ].join("\n"),
  };
}

function teamSlide(journal: Journal): TeamSlide | null {
  const { cells, members } = journal.ops;
  if (!cells.length && !members.length) return null;
  const toMember = (m: (typeof members)[number]) => ({
    name: [m.grade, m.name].filter(Boolean).join(" "),
    role: m.role,
    status: m.status,
  });
  const byRole = (a: { role: string }, b: { role: string }) =>
    Number(KEY_ROLE.test(b.role)) - Number(KEY_ROLE.test(a.role));
  const out: TeamCell[] = [...cells]
    .sort((a, b) => a.order - b.order)
    .map((c) => ({
      id: c.id,
      name: c.name,
      kind: c.kind,
      location: c.location,
      radio: c.radio,
      color: cssColor(c.color),
      members: members
        .filter((m) => m.cellId === c.id && m.status !== "Relevé")
        .map(toMember)
        .sort(byRole),
    }));
  const loose = members.filter(
    (m) => !cells.some((c) => c.id === m.cellId) && m.status !== "Relevé",
  );
  if (loose.length)
    out.push({
      id: "loose",
      name: "Sans poste",
      kind: "",
      location: "",
      radio: "",
      color: "",
      members: loose.map(toMember).sort(byRole),
    });
  const active = members.filter((m) => m.status !== "Relevé");
  const present = active.filter((m) => m.status === "Présent").length;
  return {
    id: "team",
    kind: "team",
    kicker: "Organisation",
    title: "Postes et fonctions clés",
    present,
    total: active.length,
    cells: out,
    notes: [
      `${present} personne${present > 1 ? "s" : ""} présente${present > 1 ? "s" : ""} sur ${active.length}.`,
      ...out.map(
        (c) =>
          `${c.name}${c.location ? ` (${c.location})` : ""} : ${c.members
            .filter((m) => KEY_ROLE.test(m.role))
            .map((m) => `${m.role} ${m.name}`)
            .join(", ")}`,
      ),
    ].join("\n"),
  };
}

function radioSlide(journal: Journal, at: number): RadioSlide | null {
  const r = journal.radio;
  if (!r.terminals.length && !r.talkgroups.length && !r.stations.length)
    return null;
  const s = radioSummary(r);
  const recent = [...r.checks]
    .filter((c) => Date.parse(c.at) <= at)
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
  const latest = new Map<string, (typeof recent)[number]>();
  for (const c of recent)
    if (!latest.has(c.callsign.toUpperCase()))
      latest.set(c.callsign.toUpperCase(), c);
  const weak = [...latest.values()]
    .filter((c) => c.result === "1" || c.result === "0")
    .map((c) => ({
      callsign: c.callsign,
      result: CHECK_LABELS[c.result],
      time: time(c.at),
    }));
  const stats: RadioSlide["stats"] = [
    {
      label: "Terminaux en service",
      value: `${s.issued} / ${s.terminals}`,
      tone: "accent",
    },
    { label: "Disponibles", value: String(s.available), tone: "ok" },
    {
      label: "Hors service",
      value: String(s.unavailable),
      tone: s.unavailable ? "crit" : "muted",
    },
    { label: "Groupes", value: String(s.talkgroups), tone: "info" },
    { label: "Noms d’appel", value: String(s.stations), tone: "info" },
  ];
  return {
    id: "radio",
    kind: "radio",
    kicker: "Transmissions",
    title: "Réseau radio",
    stats,
    groups: r.talkgroups.map((g) => ({
      name: g.name,
      number: g.number,
      usage: g.usage,
      mode: g.mode,
    })),
    weak,
    notes: [
      stats.map((x) => `${x.label} : ${x.value}`).join(" · "),
      weak.length
        ? `Liaisons faibles : ${weak.map((w) => `${w.callsign} (${w.result})`).join(", ")}.`
        : "Aucune liaison faible au dernier contrôle.",
    ].join("\n"),
  };
}

function weatherSlide(journal: Journal, at: number): WeatherSlide | null {
  const { forecasts, alerts, observations } = journal.ops;
  const forecast = [...forecasts]
    .filter((f) => Date.parse(f.fetchedAt) <= at)
    .sort((a, b) => Date.parse(b.fetchedAt) - Date.parse(a.fetchedAt))[0];
  const inForce = alerts
    .filter(
      (a) =>
        (!a.to || Date.parse(a.to) >= at) &&
        (!a.from || Date.parse(a.from) <= at + 24 * 60 * MIN),
    )
    .sort((a, b) => Number(b.level) - Number(a.level));
  const observation = [...observations]
    .filter((o) => Date.parse(o.at) <= at)
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at))[0];
  if (!forecast && !inForce.length && !observation) return null;
  const d = forecast?.data;
  const cur = d?.current;
  const hours: WeatherHour[] = d
    ? d.hours
        .filter((h) => h.at >= at - 30 * MIN)
        .filter((_, i) => i % 2 === 0)
        .slice(0, 8)
        .map((h) => ({
          time: time(iso(h.at)),
          label: weatherText(h.code),
          code: h.code,
          temperature: num(h.temperature, "°"),
          precipitation: num(h.precipitation, " mm", 1),
          wind: h.gusts !== null ? num(h.gusts, " km/h") : num(h.wind, " km/h"),
        }))
    : [];
  const levelTone = (level: string): Tone =>
    Number(level) >= 4 ? "crit" : Number(level) === 3 ? "warn" : "info";
  const period = (from: string, to: string) =>
    from && to
      ? `${dateTime(from)} → ${dateTime(to)}`
      : from
        ? `dès ${dateTime(from)}`
        : to
          ? `jusqu’au ${dateTime(to)}`
          : "sans durée fixée";
  const slide: WeatherSlide = {
    id: "weather",
    kind: "weather",
    kicker: "Météo",
    title: forecast?.place ? `Météo · ${forecast.place}` : "Météo",
    place: forecast?.place ?? observation?.place ?? "",
    source: forecast
      ? `Prévision ${d!.model || "Open-Meteo"} reçue à ${time(forecast.fetchedAt)}`
      : "",
    now: cur
      ? {
          label: weatherText(cur.code),
          code: cur.code,
          temperature: num(cur.temperature, "°", 0),
          wind: `${cur.direction !== null ? `${compass(cur.direction)} ` : ""}${num(cur.wind, " km/h")}${cur.gusts !== null ? ` · rafales ${num(cur.gusts, " km/h")}` : ""}`,
          precipitation: num(cur.precipitation, " mm", 1),
          humidity: num(cur.humidity, " %"),
        }
      : null,
    hours,
    alerts: inForce.slice(0, 4).map((a) => ({
      level: a.level,
      hazard: a.hazard,
      region: a.region,
      period: period(a.from, a.to),
      tone: levelTone(a.level),
    })),
    observation: observation
      ? {
          time: time(observation.at),
          place: observation.place,
          text: [
            observation.conditions,
            observation.temperature,
            observation.wind && `vent ${observation.wind}`,
            observation.precipitation,
          ]
            .filter(Boolean)
            .join(" · "),
        }
      : null,
    notes: "",
  };
  slide.notes = [
    slide.now
      ? `Actuellement : ${slide.now.label}, ${slide.now.temperature}, vent ${slide.now.wind}.`
      : "",
    ...slide.alerts.map(
      (a) =>
        `Alerte ${ALERT_LABELS[a.level as "1"] ?? a.level} : ${a.hazard} ${a.region} (${a.period}).`,
    ),
    slide.observation
      ? `Observation ${slide.observation.time} ${slide.observation.place} : ${slide.observation.text}.`
      : "",
    slide.source,
  ]
    .filter(Boolean)
    .join("\n");
  return slide;
}

function agendaSlide(
  journal: Journal,
  at: number,
  sections: Set<SectionId>,
): AgendaSlide | null {
  const items: (AgendaItem & { ms: number })[] = [];
  for (const a of journal.ops.agenda) {
    const ms = Date.parse(a.at);
    if (a.done || ms < at - 15 * MIN) continue;
    items.push({
      id: a.id,
      ms,
      time: time(a.at),
      day: dateTime(a.at).slice(0, 10),
      relative: relative(ms, at),
      title: a.title,
      detail: [a.kind, a.location, a.participants].filter(Boolean).join(" · "),
      kind: a.kind || "Rendez-vous",
      next: false,
      late: false,
    });
  }
  if (sections.has("missions") || sections.has("journal"))
    for (const e of journal.entries.filter(needsFollowUp)) {
      const f = current(e);
      if (!f.dueAt) continue;
      const ms = Date.parse(f.dueAt);
      if (ms > at + 12 * 60 * MIN) continue;
      items.push({
        id: e.id,
        ms,
        time: time(f.dueAt),
        day: dateTime(f.dueAt).slice(0, 10),
        relative: relative(ms, at),
        title: `${numberLabel(e)} ${clip(firstLine(f.action || f.message), 90)}`,
        detail: ["Délai", f.assignee].filter(Boolean).join(" · "),
        kind: "Délai",
        next: false,
        late: ms < at,
      });
    }
  if (!items.length) return null;
  items.sort((a, b) => a.ms - b.ms);
  const shown = items.slice(0, 7);
  const next = shown.find((i) => i.ms >= at && i.kind !== "Délai");
  if (next) next.next = true;
  return {
    id: "agenda",
    kind: "agenda",
    kicker: "Rythme de conduite",
    title: "Prochaines échéances",
    items: shown.map(({ ms: _ms, ...i }) => i),
    notes: shown
      .map(
        (i) =>
          `${i.time} (${i.relative}) ${i.title}${i.late ? " · DÉPASSÉ" : ""}`,
      )
      .join("\n"),
  };
}

function closingSlide(
  journal: Journal,
  o: DeckBuildOptions,
  agenda: AgendaSlide | null,
): ClosingSlide {
  const next = agenda?.items.find((i) => i.next);
  const contacts = journal.ops.contacts
    .filter((c) => c.favorite)
    .slice(0, 4)
    .map((c) => ({
      name: c.name,
      role: [c.role, c.organization].filter(Boolean).join(" · "),
      phone: c.phone || c.radio,
    }));
  return {
    id: "closing",
    kind: "closing",
    kicker: "Fin du point de situation",
    title: "Questions ?",
    presenter: o.presenter,
    organization: journal.organization,
    next: next
      ? `Prochain point : ${next.title} à ${next.time} (${next.relative})`
      : "",
    contacts,
    notes: [
      "Recueillir les questions et les décisions attendues.",
      next ? `Annoncer le prochain point : ${next.title} à ${next.time}.` : "",
    ]
      .filter(Boolean)
      .join("\n"),
  };
}

/** Line saying which version is shown. */
export function whenLabel(at: number, live: boolean, snapshot?: string) {
  const stamp = dateTime(iso(at));
  if (live) return `Situation au ${stamp}`;
  return snapshot
    ? `Version du ${stamp} (point « ${snapshot} »)`
    : `Version du ${stamp}`;
}

/** Build the slides of a journal already scoped to the parts and moment. */
export function buildDeck(journal: Journal, options: DeckBuildOptions): Deck {
  const { at } = options;
  const sections = new Set<SectionId>(
    options.sections ?? [
      "situation",
      "journal",
      "missions",
      "messages",
      "map",
      "resources",
      "team",
      "radio",
      "contacts",
      "weather",
      "agenda",
      "links",
    ],
  );
  const when = whenLabel(at, options.live, options.snapshot);
  const full = options.full ?? journal;
  const reference =
    options.since != null
      ? {
          at: options.since,
          label: `depuis ${time(iso(options.since))}`,
        }
      : referenceMoment(full, at);
  const hasHistory = full.history.length > 0 || full.entries.length > 0;
  const before =
    reference && hasHistory && reference.at < at
      ? journalAt(full, reference.at)
      : null;
  const has = (...ids: SectionId[]) => ids.some((id) => sections.has(id));
  const agenda = has("agenda", "missions", "journal")
    ? agendaSlide(journal, at, sections)
    : null;
  const slides: (Slide | null)[] = [
    titleSlide(journal, options, when),
    has("situation") ? situationSlide(journal) : null,
    has("situation")
      ? factsSlide(
          journal,
          before && full.history.length ? before : null,
          reference?.label ?? "",
        )
      : null,
    ...(has("map") ? mapSlides(journal, options) : []),
    reference && hasHistory
      ? changesSlide(full, reference.at, at, reference.label, sections)
      : null,
    has("journal") ? highlightsSlide(journal) : null,
    has("missions", "journal") ? missionsSlide(journal, at) : null,
    has("resources") ? resourcesSlide(journal) : null,
    has("team") ? teamSlide(journal) : null,
    has("radio") ? radioSlide(journal, at) : null,
    has("weather") ? weatherSlide(journal, at) : null,
    agenda,
    closingSlide(journal, options, agenda),
  ];
  return {
    title: options.title?.trim() || journal.title,
    when,
    at,
    live: options.live,
    watermark: watermarkFor(journal),
    slides: slides.filter((s): s is Slide => !!s),
  };
}

/** Slides in a chosen order, without the ones switched off. */
export function arrangeDeck(
  deck: Deck,
  order: string[] = [],
  off: string[] = [],
): Deck {
  const rank = (id: string) => {
    const i = order.indexOf(id);
    return i < 0 ? order.length + deck.slides.findIndex((s) => s.id === id) : i;
  };
  return {
    ...deck,
    slides: deck.slides
      .filter((s) => !off.includes(s.id))
      .sort((a, b) => rank(a.id) - rank(b.id)),
  };
}

/** Short label of a slide, for lists and the overview. */
export function slideLabel(slide: Slide) {
  if (slide.kind === "map") return `Carte · ${slide.title}`;
  return slideInfo(slide.kind).label;
}
