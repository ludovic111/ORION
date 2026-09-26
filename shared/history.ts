import {
  current,
  journalSchema,
  type Entry,
  type Fields,
  type Journal,
} from "./journal.ts";
import {
  checkSchema,
  stationSchema,
  talkgroupSchema,
  terminalSchema,
} from "./radio.ts";
import {
  COLLECTIONS,
  RECORD_SCHEMAS,
  settingsSchema,
  type Collection,
} from "./ops.ts";
import {
  COMPACT_FROM,
  MAX_HISTORY,
  capHistory,
  thinHistory,
  type HistoryEvent,
} from "./events.ts";
import type { Module } from "./links.ts";
import { internState, resolveState } from "./blobs.ts";
import { canonicalStamp, later, nodeOf, tick } from "./hlc.ts";
import { nextStamp } from "./stamps.ts";

export type { HistoryEvent } from "./events.ts";

// Traceability and versions of everything.
//
// Every local change of a record (map object, message, resource, weather
// observation, référentiel, journal header…) appends an event to
// journal.history: who, when, what, and the full state of the record after
// the change. Journal entries keep their own versions (revisions) and
// deletions; they are merged into the same trail for display.
//
// With these events, journalAt() rebuilds the whole operation as it was at
// any time: the time machine, the replay, the comparisons and the exports
// "version of 14:00" all rely on it.

/** Scopes never recorded: forecasts are themselves immutable versions. */
const UNTRACKED = new Set(["ops.forecasts"]);
/** Quick successive edits of one record by one person fold into one event. */
const FOLD_MS = 20_000;

export type ScopeInfo = { label: string; plural: string; module: Module };
const RADIO_SCOPES: Record<string, ScopeInfo> = {
  "radio.talkgroups": {
    label: "Groupe radio",
    plural: "Groupes radio",
    module: "radio",
  },
  "radio.stations": {
    label: "Nom d’appel",
    plural: "Noms d’appel",
    module: "radio",
  },
  "radio.terminals": {
    label: "Terminal radio",
    plural: "Terminaux radio",
    module: "radio",
  },
  "radio.checks": {
    label: "Contrôle de liaison",
    plural: "Contrôles de liaison",
    module: "radio",
  },
};
const OPS_SCOPES: Record<Collection, ScopeInfo> = {
  messages: { label: "Message", plural: "Messages", module: "messages" },
  cells: { label: "Poste", plural: "Postes / cellules", module: "team" },
  members: { label: "Personne", plural: "Équipe", module: "team" },
  resources: { label: "Moyen", plural: "Moyens", module: "resources" },
  contacts: { label: "Contact", plural: "Contacts", module: "contacts" },
  places: { label: "Objet de carte", plural: "Carte", module: "map" },
  agenda: { label: "Rendez-vous", plural: "Agenda", module: "agenda" },
  facts: {
    label: "Renseignement clé",
    plural: "Renseignements clés",
    module: "situation",
  },
  boards: {
    label: "Tableau de situation",
    plural: "Tableaux de situation",
    module: "situation",
  },
  observations: {
    label: "Observation météo",
    plural: "Observations météo",
    module: "weather",
  },
  alerts: { label: "Alerte météo", plural: "Alertes météo", module: "weather" },
  links: { label: "Lien", plural: "Liens", module: "network" },
  maps: { label: "Carte", plural: "Cartes", module: "map" },
  symbols: {
    label: "Signe personnalisé",
    plural: "Signes personnalisés",
    module: "map",
  },
  snapshots: {
    label: "Point de situation figé",
    plural: "Points de situation figés",
    module: "situation",
  },
  exports: { label: "Export", plural: "Exports", module: "trace" },
  presentations: {
    label: "Présentation",
    plural: "Présentations",
    module: "trace",
  },
  forecasts: {
    label: "Prévision météo",
    plural: "Prévisions météo",
    module: "weather",
  },
  orders: { label: "Ordre", plural: "Ordres", module: "orders" },
  broadcasts: { label: "Diffusion", plural: "Diffusions", module: "orders" },
  acks: {
    label: "Accusé de lecture",
    plural: "Accusés de lecture",
    module: "orders",
  },
  assignments: {
    label: "Attribution",
    plural: "Attributions",
    module: "tasks",
  },
  liaisons: {
    label: "Liaison entre PC",
    plural: "Liaisons entre PC",
    module: "orders",
  },
  exchanges: {
    label: "Échange de liaison",
    plural: "Échanges de liaison",
    module: "orders",
  },
  checklistTemplates: {
    label: "Modèle de liste de contrôle",
    plural: "Modèles de listes de contrôle",
    module: "checklists",
  },
  checklists: {
    label: "Liste de contrôle",
    plural: "Listes de contrôle",
    module: "checklists",
  },
  checklistTicks: {
    label: "Étape cochée",
    plural: "Étapes cochées",
    module: "checklists",
  },
  requests: {
    label: "Demande de moyens",
    plural: "Demandes de moyens",
    module: "resources",
  },
  presences: { label: "Présence", plural: "Présences", module: "team" },
  shifts: { label: "Relève", plural: "Plan de relève", module: "team" },
  thresholds: {
    label: "Seuil météo",
    plural: "Seuils météo",
    module: "weather",
  },
  reminders: { label: "Rappel", plural: "Rappels", module: "agenda" },
};
export const SCOPES: Record<string, ScopeInfo> = {
  entries: { label: "Entrée", plural: "Journal", module: "journal" },
  meta: {
    label: "Propriétés du journal",
    plural: "Propriétés du journal",
    module: "journal",
  },
  settings: {
    label: "Référentiels et réglages",
    plural: "Référentiels et réglages",
    module: "situation",
  },
  ...RADIO_SCOPES,
  ...Object.fromEntries(COLLECTIONS.map((c) => [`ops.${c}`, OPS_SCOPES[c]])),
};
export const scopeInfo = (scope: string): ScopeInfo =>
  SCOPES[scope] ?? { label: "Élément", plural: "Éléments", module: "trace" };

// ---------- Helpers ----------

/** JSON with sorted keys: equal values give equal strings. */
export function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object")
    return `{${Object.keys(value)
      .sort()
      .filter((k) => (value as Record<string, unknown>)[k] !== undefined)
      .map(
        (k) =>
          `${JSON.stringify(k)}:${stableStringify((value as Record<string, unknown>)[k])}`,
      )
      .join(",")}}`;
  return JSON.stringify(value) ?? "null";
}

/** UUID (version 8) derived from a text: the same on every post. */
export function stableId(seed: string): string {
  const hash = (salt: number) => {
    let h1 = 0xdeadbeef ^ salt;
    let h2 = 0x41c6ce57 ^ salt;
    for (let i = 0; i < seed.length; i++) {
      const c = seed.charCodeAt(i);
      h1 = Math.imul(h1 ^ c, 2654435761);
      h2 = Math.imul(h2 ^ c, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
    h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
    h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (
      (h2 >>> 0).toString(16).padStart(8, "0") +
      (h1 >>> 0).toString(16).padStart(8, "0")
    );
  };
  const hex = (hash(1) + hash(2)).split("");
  hex[12] = "8";
  hex[16] = "89ab"[parseInt(hex[16], 16) & 3];
  const s = hex.join("");
  return `${s.slice(0, 8)}-${s.slice(8, 12)}-${s.slice(12, 16)}-${s.slice(16, 20)}-${s.slice(20, 32)}`;
}

const ms = (iso: string) => {
  const t = Date.parse(iso);
  return Number.isNaN(t) ? 0 : t;
};

const keyOf = (e: HistoryEvent) => e.hlc ?? canonicalStamp(e.at);
/**
 * Order of two events of the same record: the later stamp (hybrid logical
 * clock, or time for events before 2.1), then the higher revision, wins.
 */
function newer(a: HistoryEvent, b: HistoryEvent) {
  const ka = keyOf(a);
  const kb = keyOf(b);
  if (ka !== kb) return ka > kb;
  if (a.rev !== b.rev) return a.rev > b.rev;
  return a.id > b.id;
}

const indexes = new WeakMap<HistoryEvent[], Map<string, HistoryEvent>>();
/** Latest event of each record. */
export function latestIndex(history: HistoryEvent[]) {
  let index = indexes.get(history);
  if (!index) {
    index = new Map();
    for (const e of history) {
      const known = index.get(e.target);
      if (!known || newer(e, known)) index.set(e.target, e);
    }
    indexes.set(history, index);
  }
  return index;
}

/** Events of one record, oldest first. */
export function eventsOf(history: HistoryEvent[], target: string) {
  return history
    .filter((e) => e.target === target)
    .sort((a, b) => (newer(a, b) ? 1 : -1));
}

// ---------- Recording ----------

export type Change = {
  scope: string;
  target: string;
  /** State before the change (undefined: new record). */
  prior: unknown;
  /** State after the change (null: removed). */
  item: unknown;
  /** Stamp of the record before the change ("" for a new record). */
  base?: string;
};

/** Watermark of the compaction for a history of this size at `at`. */
function watermark(size: number, at: string): string | undefined {
  if (size <= COMPACT_FROM) return undefined;
  const hour = 3_600_000;
  // A large history keeps every version of the last day; beyond the limit,
  // of the last hour only.
  const keep = size > MAX_HISTORY ? hour : 24 * hour;
  const t = Math.floor((ms(at) - keep) / hour) * hour;
  return t > 0 ? new Date(t).toISOString() : undefined;
}

const knownAt = (value: unknown, fallback: string): string => {
  const v = (value ?? {}) as Record<string, unknown>;
  for (const key of ["updatedAt", "createdAt", "at", "issuedAt"])
    if (typeof v[key] === "string" && v[key] && ms(v[key] as string))
      return v[key] as string;
  return fallback;
};
const authorOf = (value: unknown): string => {
  const v = (value ?? {}) as Record<string, unknown>;
  return typeof v.by === "string" ? v.by.slice(0, 120) : "";
};

/**
 * Append the events of local changes. A record changed for the first time
 * since the history exists gets a baseline event with its previous state,
 * with an id derived from the record so that two posts agree on it.
 */
export function appendHistory(
  journal: Journal,
  changes: Change[],
  at: string,
  by: string,
  stamp = "",
): Journal {
  const tracked = changes.filter((c) => !UNTRACKED.has(c.scope));
  if (!tracked.length) return journal;
  // Baselines take the stamp of the change, the change the next one: both
  // are new for the peers, the baseline stays older than the change.
  const hlc = stamp ? tick(stamp, at, nodeOf(stamp) || undefined) : undefined;
  const baselineHlc = stamp || undefined;
  let blobs = journal.blobs;
  const intern = (scope: string, state: unknown) => {
    const fresh: Record<string, string> = {};
    const out = internState(scope, state, fresh);
    for (const [k, v] of Object.entries(fresh))
      if (blobs[k] === undefined) {
        if (blobs === journal.blobs) blobs = { ...journal.blobs };
        blobs[k] = v;
      }
    return out;
  };
  let history = [...journal.history];
  const index = new Map(latestIndex(journal.history));
  const position = new Map<string, number>();
  const find = (id: string) => {
    const known = position.get(id);
    if (known !== undefined) return known;
    for (let i = history.length - 1; i >= 0; i--)
      if (history[i].id === id) return i;
    return -1;
  };
  const push = (event: HistoryEvent) => {
    position.set(event.id, history.length);
    history.push(event);
    index.set(event.target, event);
  };
  const author = by.slice(0, 120);
  let changed = false;
  for (const c of tracked) {
    let last = index.get(c.target);
    if (!last && c.prior !== undefined && c.prior !== null) {
      const baseline: HistoryEvent = {
        id: stableId(`${journal.id}:${c.target}:baseline`),
        // Strictly before the change, so that the change always wins.
        at: new Date(
          Math.min(ms(knownAt(c.prior, journal.createdAt)), ms(at) - 1),
        ).toISOString(),
        by: authorOf(c.prior),
        action: "create",
        scope: c.scope,
        target: c.target,
        state: intern(c.scope, c.prior),
        rev: 0,
        note: "État connu avant le début de l’historique",
        ...(baselineHlc ? { hlc: baselineHlc } : {}),
      };
      push(baseline);
      last = baseline;
      changed = true;
    }
    if (c.item === null) {
      if (!last || last.action === "remove") continue;
      push({
        id: crypto.randomUUID(),
        at,
        by: author,
        action: "remove",
        scope: c.scope,
        target: c.target,
        state: null,
        rev: 0,
        note: "",
        ...(hlc ? { hlc } : {}),
        ...(c.base !== undefined ? { base: c.base } : {}),
      });
      changed = true;
      continue;
    }
    const state = intern(c.scope, c.item);
    if (
      last &&
      last.action !== "remove" &&
      stableStringify(last.state) === stableStringify(state)
    )
      continue;
    const alive = !!last && last.action !== "remove";
    // Quick retouches fold into the previous update (never into a creation,
    // whose time must stay the time the record appeared).
    if (
      alive &&
      last!.action === "update" &&
      last!.by === author &&
      !last!.note &&
      ms(at) - ms(last!.at) >= 0 &&
      ms(at) - ms(last!.at) < FOLD_MS
    ) {
      const i = find(last!.id);
      if (i >= 0) {
        const folded: HistoryEvent = {
          ...last!,
          at,
          state,
          rev: last!.rev + 1,
          ...(hlc ? { hlc } : {}),
        };
        history[i] = folded;
        index.set(c.target, folded);
        changed = true;
        continue;
      }
    }
    push({
      id: crypto.randomUUID(),
      at,
      by: author,
      action: alive ? "update" : "create",
      scope: c.scope,
      target: c.target,
      state,
      rev: 0,
      note: "",
      ...(hlc ? { hlc } : {}),
      ...(c.base !== undefined ? { base: c.base } : {}),
    });
    changed = true;
  }
  if (!changed) return journal;
  // Compaction: large histories are thinned before a watermark that only
  // moves forward (merged as a maximum, see shared/events.ts).
  let sync = journal.sync;
  const mark = watermark(history.length, at);
  if (mark) {
    const compacted = later(sync.compacted, canonicalStamp(mark));
    if (compacted !== sync.compacted) sync = { ...sync, compacted };
    const thinned = thinHistory(history, compacted);
    if (thinned !== history) history = thinned;
  }
  if (history.length > MAX_HISTORY) history = capHistory(history);
  indexes.set(history, index);
  return { ...journal, history, sync, blobs };
}

/** Union of two histories. Commutative and idempotent. */
export function mergeHistory(
  a: HistoryEvent[],
  b: HistoryEvent[],
): HistoryEvent[] {
  if (a === b || !b.length) return a;
  if (!a.length) return b;
  const byId = new Map<string, HistoryEvent>();
  for (const e of a) byId.set(e.id, e);
  let added = false;
  for (const e of b) {
    const known = byId.get(e.id);
    if (!known) {
      byId.set(e.id, e);
      added = true;
    } else if (known !== e) {
      const winner =
        known.rev !== e.rev
          ? known.rev > e.rev
            ? known
            : e
          : ms(known.at) !== ms(e.at)
            ? ms(known.at) > ms(e.at)
              ? known
              : e
            : stableStringify(known) >= stableStringify(e)
              ? known
              : e;
      if (winner !== known) {
        byId.set(e.id, winner);
        added = true;
      }
    }
  }
  if (!added && byId.size === a.length) return a;
  return [...byId.values()].sort(
    (x, y) => ms(x.at) - ms(y.at) || x.id.localeCompare(y.id),
  );
}

// ---------- Time machine ----------

const RADIO_SCHEMAS = {
  talkgroups: talkgroupSchema,
  stations: stationSchema,
  terminals: terminalSchema,
  checks: checkSchema,
} as const;
type RadioKey = keyof typeof RADIO_SCHEMAS;

/** First moment known of the operation. */
export function firstMoment(journal: Journal): string {
  let first = journal.createdAt;
  const consider = (iso: string) => {
    if (iso && ms(iso) && ms(iso) < ms(first)) first = iso;
  };
  for (const e of journal.history) consider(e.at);
  for (const e of journal.entries) consider(e.createdAt);
  return first;
}

/**
 * The journal as it was at a given time. Records created later disappear,
 * modified ones come back to their state of that time, removed ones come
 * back. Entries keep only their versions of that time. Deleted entries lose
 * their content by design: they cannot come back.
 */
export function journalAt(journal: Journal, at: string | number): Journal {
  const t = typeof at === "number" ? at : ms(at);
  const latest = new Map<string, HistoryEvent>();
  const known = new Set<string>();
  const history: HistoryEvent[] = [];
  for (const e of journal.history) {
    known.add(e.target);
    if (ms(e.at) > t) continue;
    history.push(e);
    const k = latest.get(e.target);
    if (!k || newer(e, k)) latest.set(e.target, e);
  }
  const byScope = new Map<string, HistoryEvent[]>();
  for (const e of latest.values()) {
    const list = byScope.get(e.scope) ?? [];
    list.push(e);
    byScope.set(e.scope, list);
  }
  const rebuild = <T extends { id: string }>(
    scope: string,
    list: T[],
    parse: (v: unknown) => T | null,
    createdOf: (v: T) => string,
  ): T[] => {
    const out: T[] = [];
    const seen = new Set<string>();
    for (const item of list) {
      seen.add(item.id);
      if (known.has(item.id)) {
        const e = latest.get(item.id);
        if (e && e.action !== "remove") {
          const v = parse(e.state);
          if (v) out.push(v);
        }
      } else if (ms(createdOf(item) || journal.createdAt) <= t) out.push(item);
    }
    for (const e of byScope.get(scope) ?? [])
      if (!seen.has(e.target) && e.action !== "remove") {
        const v = parse(e.state);
        if (v && v.id === e.target) out.push(v);
      }
    return out;
  };
  type Checker = {
    safeParse: (v: unknown) => { success: boolean; data?: unknown };
  };
  const parser =
    (schema: Checker, scope = "") =>
    (v: unknown): { id: string } | null => {
      const r = schema.safeParse(resolveState(scope, v, journal.blobs));
      return r.success ? (r.data as { id: string }) : null;
    };
  const created = (v: unknown) =>
    ((v as { createdAt?: string }).createdAt ??
      (v as { at?: string }).at ??
      "") as string;

  const ops = { ...journal.ops } as Journal["ops"];
  for (const c of COLLECTIONS) {
    if (c === "forecasts") continue;
    (ops as Record<string, unknown>)[c] = rebuild(
      `ops.${c}`,
      journal.ops[c] as { id: string }[],
      parser(RECORD_SCHEMAS[c] as Checker, `ops.${c}`),
      created,
    );
  }
  ops.forecasts = journal.ops.forecasts.filter((f) => ms(f.fetchedAt) <= t);
  const settings = latest.get("settings");
  if (settings && settings.action !== "remove" && settings.state) {
    const parsed = settingsSchema.safeParse(settings.state);
    if (parsed.success) ops.settings = parsed.data;
  }

  const radio = { ...journal.radio } as Journal["radio"];
  for (const k of Object.keys(RADIO_SCHEMAS) as RadioKey[])
    (radio as Record<string, unknown>)[k] = rebuild(
      `radio.${k}`,
      journal.radio[k] as { id: string }[],
      parser(RADIO_SCHEMAS[k] as Checker),
      created,
    );

  const entries: Entry[] = [];
  for (const e of journal.entries) {
    if (ms(e.createdAt) > t) continue;
    const revisions = e.revisions.filter((r) => ms(r.at) <= t);
    if (revisions.length) entries.push({ ...e, revisions });
  }
  const meta = latest.get("meta");
  const header =
    meta && meta.action !== "remove" && meta.state
      ? (meta.state as Partial<Journal>)
      : {};
  const value: Journal = {
    ...journal,
    ...header,
    id: journal.id,
    entries,
    deleted: journal.deleted.filter((d) => ms(d.at) <= t),
    radio,
    ops,
    history,
  };
  const parsed = journalSchema.safeParse(value);
  return parsed.success ? parsed.data : value;
}

// ---------- Audit trail ----------

export type AuditItem = {
  id: string;
  at: string;
  by: string;
  action: "create" | "update" | "remove";
  scope: string;
  target: string;
  /** State after the change (null when removed). */
  state: unknown;
  /** State before the change (null for a creation). */
  previous: unknown;
  note: string;
  title: string;
};

const clip = (s: string, n = 80) =>
  s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s;

/** Human title of a record state, whatever its kind. */
export function titleOf(scope: string, state: unknown): string {
  if (!state || typeof state !== "object") return scopeInfo(scope).label;
  const v = state as Record<string, unknown>;
  if (scope === "entries")
    return `#${String(v.number ?? "").padStart(3, "0")} ${clip(String(v.message ?? "").split("\n")[0], 70)}`;
  if (scope === "meta") return String(v.title ?? "Journal");
  if (scope === "settings") return "Référentiels et réglages";
  if (scope === "ops.presentations")
    return clip(
      [v.presenter, v.audience].filter(Boolean).join(" → ") || "Présentation",
    );
  if (scope === "ops.exports")
    return clip(String(v.name || v.format || "Export"));
  for (const key of ["label", "name", "title", "subject", "callsign", "hazard"])
    if (typeof v[key] === "string" && v[key]) return clip(v[key] as string);
  if (scope === "ops.observations")
    return clip(
      [v.place, v.conditions, v.temperature].filter(Boolean).join(" · ") ||
        "Observation",
    );
  if (scope === "ops.links")
    return clip(`Lien ${String(v.label ?? "")}`.trim());
  return scopeInfo(scope).label;
}

const entryState = (e: Entry, f: Fields) => ({
  number: e.number,
  createdBy: e.createdBy,
  ...f,
});

/**
 * Every change of the journal, newest first: history events plus the
 * versions and deletions of the entries.
 */
export function auditTrail(journal: Journal): AuditItem[] {
  const out: AuditItem[] = [];
  const byTarget = new Map<string, HistoryEvent[]>();
  for (const e of journal.history) {
    const list = byTarget.get(e.target) ?? [];
    list.push(e);
    byTarget.set(e.target, list);
  }
  for (const list of byTarget.values()) {
    list.sort((a, b) => (newer(a, b) ? 1 : -1));
    let previous: unknown = null;
    for (const e of list) {
      out.push({
        id: e.id,
        at: e.at,
        by: e.by,
        action: e.action,
        scope: e.scope,
        target: e.target,
        state: e.state ?? null,
        previous,
        note: e.note,
        title: titleOf(e.scope, e.state ?? previous),
      });
      previous = e.action === "remove" ? null : e.state;
    }
  }
  for (const e of journal.entries) {
    let previous: unknown = null;
    e.revisions.forEach((r, i) => {
      const state = entryState(e, r.fields);
      out.push({
        id: r.id,
        at: r.at,
        by: r.author,
        action: i === 0 ? "create" : "update",
        scope: "entries",
        target: e.id,
        state,
        previous,
        note: i === 0 ? "" : r.reason,
        title: titleOf("entries", state),
      });
      previous = state;
    });
  }
  for (const d of journal.deleted)
    out.push({
      id: `${d.id}:deleted`,
      at: d.at,
      by: d.by,
      action: "remove",
      scope: "entries",
      target: d.id,
      state: null,
      previous: { number: d.number },
      note: d.reason,
      title: `#${String(d.number).padStart(3, "0")} (contenu supprimé)`,
    });
  return out.sort((a, b) => ms(b.at) - ms(a.at) || b.id.localeCompare(a.id));
}

/** Changes of one record (or entry), newest first. */
export function trailOf(journal: Journal, target: string): AuditItem[] {
  return auditTrail(journal).filter((i) => i.target === target);
}

/** Changes made after `from` and up to `to` (both included for `to`). */
export function changesBetween(
  journal: Journal,
  from: string | number,
  to: string | number,
): AuditItem[] {
  const a = typeof from === "number" ? from : ms(from);
  const b = typeof to === "number" ? to : ms(to);
  return auditTrail(journal).filter((i) => ms(i.at) > a && ms(i.at) <= b);
}

const HIDDEN_FIELDS = new Set(["id", "createdAt", "updatedAt", "by"]);
export type FieldChange = { key: string; before: unknown; after: unknown };
/** Fields that differ between two states of a record. */
export function diffStates(before: unknown, after: unknown): FieldChange[] {
  const a = (before ?? {}) as Record<string, unknown>;
  const b = (after ?? {}) as Record<string, unknown>;
  const keys = [...new Set([...Object.keys(a), ...Object.keys(b)])];
  return keys
    .filter((k) => !HIDDEN_FIELDS.has(k))
    .filter((k) => stableStringify(a[k]) !== stableStringify(b[k]))
    .map((k) => ({ key: k, before: a[k], after: b[k] }));
}

/** Sorted distinct moments of change: the steps of a replay. */
export function moments(journal: Journal): number[] {
  const set = new Set<number>();
  for (const e of journal.history) set.add(ms(e.at));
  for (const e of journal.entries)
    for (const r of e.revisions) set.add(ms(r.at));
  for (const d of journal.deleted) set.add(ms(d.at));
  for (const f of journal.ops.forecasts) set.add(ms(f.fetchedAt));
  set.delete(0);
  return [...set].sort((a, b) => a - b);
}

/**
 * Put back a previous state of a record, as a new change signed by the
 * operator. The event carries a note; stamping then sees nothing new.
 */
export function restoreState(
  journal: Journal,
  item: Pick<AuditItem, "scope" | "target" | "state" | "at">,
  by: string,
  now = new Date().toISOString(),
): Journal {
  if (!item.state || typeof item.state !== "object")
    throw new Error("Cette version ne peut pas être restaurée.");
  const note = `Restauration de la version du ${new Date(
    item.at,
  ).toLocaleString("fr-CH", {
    timeZone: "Europe/Zurich",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })}`;
  let next: Journal;
  let state: unknown;
  if (item.scope.startsWith("ops.")) {
    const c = item.scope.slice(4) as Collection;
    if (!COLLECTIONS.includes(c)) throw new Error("Élément inconnu.");
    const parsed = RECORD_SCHEMAS[c].safeParse({
      ...(resolveState(item.scope, item.state, journal.blobs) as object),
      updatedAt: now,
    });
    if (!parsed.success)
      throw new Error("Cette version n’est plus compatible.");
    state = parsed.data;
    const list = journal.ops[c] as { id: string }[];
    const exists = list.some((r) => r.id === item.target);
    next = {
      ...journal,
      ops: {
        ...journal.ops,
        [c]: exists
          ? list.map((r) => (r.id === item.target ? state : r))
          : [...list, state],
      },
    };
  } else if (item.scope.startsWith("radio.")) {
    const k = item.scope.slice(6) as RadioKey;
    const parsed = RADIO_SCHEMAS[k]?.safeParse(item.state);
    if (!parsed?.success)
      throw new Error("Cette version n’est plus compatible.");
    state = parsed.data;
    const list = journal.radio[k] as { id: string }[];
    const exists = list.some((r) => r.id === item.target);
    next = {
      ...journal,
      radio: {
        ...journal.radio,
        [k]: exists
          ? list.map((r) => (r.id === item.target ? state : r))
          : [...list, state],
      },
    };
  } else if (item.scope === "settings") {
    const parsed = settingsSchema.safeParse(item.state);
    if (!parsed.success)
      throw new Error("Cette version n’est plus compatible.");
    state = parsed.data;
    next = {
      ...journal,
      ops: { ...journal.ops, settings: parsed.data },
    };
  } else throw new Error("Cette version se restaure depuis son module.");
  // The whole journal must stay valid (e.g. a call sign taken since).
  const valid = journalSchema.safeParse(next);
  if (!valid.success)
    throw new Error(
      `Impossible de restaurer : ${valid.error.issues[0]?.message ?? "version incompatible"}. Modifiez d’abord l’élément en conflit.`,
    );
  const index = latestIndex(journal.history);
  const last = index.get(item.target);
  const blobs = { ...journal.blobs };
  const event: HistoryEvent = {
    id: crypto.randomUUID(),
    at: now,
    by: by.slice(0, 120),
    action: last && last.action !== "remove" ? "update" : "create",
    scope: item.scope,
    target: item.target,
    state: internState(item.scope, state, blobs),
    rev: 0,
    note,
    hlc: nextStamp(journal, now),
    base: journal.sync.clock[item.target] ?? "",
  };
  return { ...next, blobs, history: [...journal.history, event] };
}

/** Current fields of an entry at a time, if it existed. */
export function entryAt(entry: Entry, at: number): Fields | null {
  const revisions = entry.revisions.filter((r) => ms(r.at) <= at);
  return revisions.length
    ? revisions[revisions.length - 1].fields
    : at >= ms(entry.createdAt)
      ? current(entry)
      : null;
}

// ---------- Comparison of two versions ----------

export type Difference = {
  scope: string;
  target: string;
  kind: "added" | "removed" | "modified";
  title: string;
  before: unknown;
  after: unknown;
  fields: FieldChange[];
};

const REF_OF_SCOPE: Record<string, string> = {
  entries: "entry",
  "ops.messages": "message",
  "ops.cells": "cell",
  "ops.members": "member",
  "ops.resources": "resource",
  "ops.contacts": "contact",
  "ops.places": "place",
  "ops.agenda": "agenda",
  "ops.facts": "fact",
  "ops.boards": "board",
  "ops.observations": "observation",
  "ops.alerts": "alert",
  "radio.terminals": "terminal",
  "radio.stations": "station",
  "radio.talkgroups": "talkgroup",
};
/** Link reference ("resource:<id>") of a record, when it has one. */
export const refOf = (scope: string, target: string) =>
  REF_OF_SCOPE[scope] ? `${REF_OF_SCOPE[scope]}:${target}` : null;

/** Records of a journal by scope, as comparable states. */
function statesOf(journal: Journal): Map<string, Map<string, unknown>> {
  const out = new Map<string, Map<string, unknown>>();
  const put = (scope: string, list: { id: string }[]) =>
    out.set(scope, new Map(list.map((x) => [x.id, x])));
  put(
    "entries",
    journal.entries.map((e) => ({ id: e.id, ...entryState(e, current(e)) })),
  );
  for (const c of COLLECTIONS)
    if (c !== "forecasts") put(`ops.${c}`, journal.ops[c] as { id: string }[]);
  for (const k of Object.keys(RADIO_SCHEMAS) as RadioKey[])
    put(`radio.${k}`, journal.radio[k] as { id: string }[]);
  return out;
}

/** What differs between two versions of a journal, record by record. */
export function compareVersions(before: Journal, after: Journal): Difference[] {
  const a = statesOf(before);
  const b = statesOf(after);
  const out: Difference[] = [];
  for (const [scope, next] of b) {
    const prev = a.get(scope) ?? new Map();
    for (const [id, state] of next) {
      const old = prev.get(id);
      if (old === undefined)
        out.push({
          scope,
          target: id,
          kind: "added",
          title: titleOf(scope, state),
          before: null,
          after: state,
          fields: [],
        });
      else if (old !== state) {
        const fields = diffStates(old, state);
        if (fields.length)
          out.push({
            scope,
            target: id,
            kind: "modified",
            title: titleOf(scope, state),
            before: old,
            after: state,
            fields,
          });
      }
    }
    for (const [id, state] of prev)
      if (!next.has(id))
        out.push({
          scope,
          target: id,
          kind: "removed",
          title: titleOf(scope, state),
          before: state,
          after: null,
          fields: [],
        });
  }
  return out;
}
