import { dateTime, needsFollowUp, type Journal } from "../../shared/journal.ts";
import { COLLECTIONS, emptyOps, type Collection } from "../../shared/ops.ts";
import { emptyRadio } from "../../shared/radio.ts";
import { journalAt } from "../../shared/history.ts";

// What an export or a presentation covers: parts of the operation, some
// items of these parts, and the moment shown (now or any past time).
// Shared by the export centre, the presentation mode and the wall display.

export const SECTIONS = [
  {
    id: "situation",
    label: "Situation",
    detail: "Renseignements clés, tableaux de situation",
  },
  {
    id: "journal",
    label: "Journal d’intervention",
    detail: "Toutes les entrées et leurs versions",
  },
  {
    id: "missions",
    label: "Missions et suivi",
    detail: "Entrées à traiter ou en cours",
  },
  { id: "messages", label: "Messages", detail: "Réception et synthèse" },
  { id: "map", label: "Cartes", detail: "Cartes, signes, zones, textes" },
  {
    id: "resources",
    label: "Moyens",
    detail: "Véhicules, personnel, matériel",
  },
  {
    id: "team",
    label: "Équipe et postes",
    detail: "Postes, cellules, personnes",
  },
  {
    id: "radio",
    label: "Réseau radio",
    detail: "Groupes, noms d’appel, terminaux",
  },
  { id: "contacts", label: "Contacts", detail: "Annuaire" },
  {
    id: "weather",
    label: "Météo",
    detail: "Prévisions reçues, observations, alertes",
  },
  {
    id: "agenda",
    label: "Rythme de conduite",
    detail: "Rapports et rendez-vous",
  },
  {
    id: "links",
    label: "Réseau des liens",
    detail: "Liens entre les éléments",
  },
  {
    id: "trace",
    label: "Traçabilité",
    detail: "Qui a fait quoi, quand : historique complet",
  },
  {
    id: "exercise",
    label: "Exercice et débriefing",
    detail: "Scénario, injects et réactions, échéances, RETEX",
  },
] as const;
export type SectionId = (typeof SECTIONS)[number]["id"];
export const SECTION_IDS = SECTIONS.map((s) => s.id) as SectionId[];
export const sectionLabel = (id: SectionId) =>
  SECTIONS.find((s) => s.id === id)?.label ?? id;

export type ExportScope = {
  /** Parts included, in this order. */
  sections: SectionId[];
  /** Optional selection of items (record or entry ids) per part. */
  items?: Partial<Record<SectionId, string[]>>;
  /** Moment shown (ms since epoch); null: now. */
  viewAt: number | null;
  /** Name of the frozen point of situation chosen, if any. */
  snapshot?: string;
};

export const fullScope = (): ExportScope => ({
  sections: [...SECTION_IDS],
  viewAt: null,
});

/** Collections owned by each part. */
const OWNED: Partial<Record<SectionId, Collection[]>> = {
  situation: ["facts", "boards", "snapshots"],
  messages: ["messages"],
  map: ["places", "maps", "symbols"],
  resources: ["resources"],
  team: ["cells", "members"],
  contacts: ["contacts"],
  weather: ["observations", "alerts", "forecasts"],
  agenda: ["agenda"],
  links: ["links"],
  trace: ["exports", "presentations"],
  exercise: ["scenarios", "injects", "retex"],
};

/** Collections whose items can be picked one by one. */
const SELECTABLE = new Set<Collection>([
  "facts",
  "boards",
  "messages",
  "places",
  "resources",
  "cells",
  "members",
  "contacts",
  "observations",
  "alerts",
  "forecasts",
  "agenda",
  "links",
  "exports",
  "presentations",
]);

/**
 * The journal restricted to a scope, at the chosen time. Parts left out are
 * emptied; a selection of items keeps only these items. The result is a
 * valid journal: it can be written to any format, even re-imported.
 */
export function scopedJournal(journal: Journal, scope: ExportScope): Journal {
  const base =
    scope.viewAt === null ? journal : journalAt(journal, scope.viewAt);
  const has = (id: SectionId) => scope.sections.includes(id);
  const pick = <T extends { id: string }>(id: SectionId, list: T[]) => {
    const chosen = scope.items?.[id];
    return chosen?.length ? list.filter((x) => chosen.includes(x.id)) : list;
  };
  const kept = new Set<Collection>();
  for (const [section, collections] of Object.entries(OWNED))
    if (has(section as SectionId)) collections!.forEach((c) => kept.add(c));
  const ops = { ...emptyOps(), settings: base.ops.settings };
  for (const c of COLLECTIONS)
    if (kept.has(c)) {
      const section = (Object.entries(OWNED).find(([, list]) =>
        list!.includes(c),
      )?.[0] ?? "") as SectionId;
      const list = base.ops[c] as { id: string }[];
      (ops as Record<string, unknown>)[c] = SELECTABLE.has(c)
        ? pick(section, list)
        : list;
    }
  let entries = has("journal") ? pick("journal", base.entries) : [];
  if (!has("journal") && has("missions"))
    entries = pick("missions", base.entries.filter(needsFollowUp));
  return {
    ...base,
    entries,
    deleted: has("journal") ? base.deleted : [],
    radio: has("radio") ? base.radio : emptyRadio(),
    ops,
    // Traceability covers what the export covers.
    history: has("trace") ? historyInScope(base.history, scope) : [],
  };
}

/** One line describing a scope, for titles, footers and the registry. */
export function describeScope(scope: ExportScope): string {
  const parts =
    scope.sections.length === SECTION_IDS.length
      ? "Opération complète"
      : scope.sections.map(sectionLabel).join(", ");
  const selected = Object.values(scope.items ?? {}).reduce(
    (n, list) => n + (list?.length ?? 0),
    0,
  );
  const when =
    scope.viewAt === null
      ? "état actuel"
      : `${scope.snapshot ? `« ${scope.snapshot} » · ` : ""}version du ${dateTime(new Date(scope.viewAt).toISOString())}`;
  return `${parts}${selected ? ` (${selected} élément${selected > 1 ? "s" : ""} choisi${selected > 1 ? "s" : ""})` : ""} · ${when}`;
}

/**
 * Part owning a history scope ("ops.resources", "radio.terminals",
 * "entries"…); null for the journal header and the référentiels, which
 * belong to every part.
 */
export function sectionOfScope(scope: string): SectionId | null {
  if (scope === "entries") return "journal";
  if (scope.startsWith("radio.")) return "radio";
  if (!scope.startsWith("ops.")) return null;
  const c = scope.slice(4) as Collection;
  const found = Object.entries(OWNED).find(([, list]) => list!.includes(c));
  return (found?.[0] as SectionId | undefined) ?? null;
}

/** Every part, no selection of items (at any time). */
export const wholeOperation = (scope: ExportScope) =>
  SECTION_IDS.every((s) => scope.sections.includes(s)) &&
  !Object.values(scope.items ?? {}).some((list) => list?.length);

/**
 * History events of the records a scope covers: parts chosen (and only the
 * items chosen), plus the journal header and the référentiels. The whole
 * operation keeps every event.
 */
export function historyInScope<T extends { scope: string; target: string }>(
  history: T[],
  scope: ExportScope,
): T[] {
  if (wholeOperation(scope)) return history;
  const has = (id: SectionId) =>
    scope.sections.includes(id) ||
    (id === "journal" && scope.sections.includes("missions"));
  return history.filter((e) => {
    const section = sectionOfScope(e.scope);
    if (!section) return true;
    if (!has(section)) return false;
    const chosen = scope.items?.[section];
    return !chosen?.length || chosen.includes(e.target);
  });
}
