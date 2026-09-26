import {
  chronological,
  current,
  needsFollowUp,
  type Entry,
  type Fields,
  type Journal,
} from "./journal.ts";
import { t } from "./i18n/workflow.ts";

// "#007", "# 7", "#007·B" (the label of an entry whose number is shared by
// entries created at the same time on two posts, see shared/journal.ts).
const LABEL = /#\s?0*(\d{1,5})(?:[·.]([A-Z]{1,3})(?![A-Za-z]))?\b/g;

/** Labels cited in the reference field, in order, without repetition. */
export function referencedLabels(fields: Pick<Fields, "reference">) {
  const seen = new Set<string>();
  const out: { number: number; suffix: string }[] = [];
  for (const m of fields.reference.matchAll(LABEL)) {
    const number = Number(m[1]);
    const suffix = m[2] ?? "";
    if (number <= 0 || seen.has(`${number}·${suffix}`)) continue;
    seen.add(`${number}·${suffix}`);
    out.push({ number, suffix });
  }
  return out;
}

/** Entry numbers cited in the reference field: "Suite de #003", "#12, #14". */
export function referencedNumbers(fields: Pick<Fields, "reference">) {
  return [...new Set(referencedLabels(fields).map((l) => l.number))];
}

/**
 * Entries a reference text designates, by label: "#007" is the entry shown
 * as #007, "#007·B" the one shown as #007·B.
 */
export function resolveReference(
  reference: string,
  entries: Entry[],
  self = "",
): Entry[] {
  const labels = referencedLabels({ reference });
  if (!labels.length) return [];
  const byLabel = new Map(
    entries.map((e) => [`${e.number}·${e.suffix ?? ""}`, e]),
  );
  return labels
    .map((l) => byLabel.get(`${l.number}·${l.suffix}`))
    .filter((e): e is Entry => !!e && e.id !== self);
}

/**
 * Entries an entry refers to: resolved when its version was written (so a
 * later collision of numbers does not change them), or read from the text
 * for versions written before 2.1.
 */
export function referencedEntries(entries: Entry[], entry: Entry): Entry[] {
  const last = entry.revisions[entry.revisions.length - 1];
  if (last.refs) {
    const byId = new Map(entries.map((e) => [e.id, e]));
    return last.refs
      .map((id) => byId.get(id))
      .filter((e): e is Entry => !!e && e.id !== entry.id);
  }
  return resolveReference(last.fields.reference, entries, entry.id);
}

/** Every entry connected to this one through references, oldest first. */
export function thread(entries: Entry[], entry: Entry): Entry[] {
  const citing = new Map<string, Entry[]>();
  const cited = new Map<string, Entry[]>();
  for (const e of entries) {
    const targets = referencedEntries(entries, e);
    cited.set(e.id, targets);
    for (const t of targets) citing.set(t.id, [...(citing.get(t.id) ?? []), e]);
  }
  const seen = new Set<string>([entry.id]);
  const queue = [entry];
  while (queue.length) {
    const next = queue.shift()!;
    const neighbours = [
      ...(cited.get(next.id) ?? referencedEntries(entries, next)),
      ...(citing.get(next.id) ?? []),
    ];
    for (const e of neighbours)
      if (!seen.has(e.id)) {
        seen.add(e.id);
        queue.push(e);
      }
  }
  return seen.size > 1
    ? chronological(entries.filter((e) => seen.has(e.id)))
    : [];
}

/** Open entries a receipt (quittance) refers to and could close. */
export function closableBy(journal: Journal, fields: Fields): Entry[] {
  if (fields.type !== "Quittance") return [];
  const cited = new Set(
    resolveReference(fields.reference, journal.entries).map((e) => e.id),
  );
  return journal.entries.filter((e) => cited.has(e.id) && needsFollowUp(e));
}

/** New due time, `minutes` after now (or after the old due time if later). */
export function snooze(dueAt: string, minutes: number, at = Date.now()) {
  const base = Math.max(at, dueAt ? Date.parse(dueAt) : 0);
  return new Date(base + minutes * 60_000).toISOString();
}

export type Template = {
  id: string;
  label: string;
  fields: Partial<Fields>;
};

// Skeletons follow the OFPP helps: demande d'aide (quoi, combien, où, quand)
// and point de situation (situation, mesures, moyens, besoins, prochain point).
export const TEMPLATES: Template[] = [
  {
    id: "situation",
    get label() {
      return t("Point de situation");
    },
    get fields(): Partial<Fields> {
      return {
        type: "Renseignement",
        message: t(
          "Point de situation.\nSituation : \nMesures prises : \nMoyens engagés : \nBesoins : \nProchain point : ",
        ),
      };
    },
  },
  {
    id: "request",
    get label() {
      return t("Demande de moyens");
    },
    get fields(): Partial<Fields> {
      return {
        type: "Demande",
        priority: "Important",
        status: "À traiter",
        message: t(
          "Demande de moyens.\nMoyens : \nQuantité : \nLieu de livraison : \nDélai : \nMotif : ",
        ),
      };
    },
  },
  {
    id: "mission",
    get label() {
      return t("Mission");
    },
    get fields(): Partial<Fields> {
      return {
        type: "Mission",
        status: "À traiter",
        message: t("Mission : "),
        action: t("Quittancer l’exécution au PC."),
      };
    },
  },
  {
    id: "decision",
    get label() {
      return t("Décision");
    },
    get fields(): Partial<Fields> {
      return {
        type: "Décision",
        status: "En cours",
        reliability: "Confirmé",
        message: t("Décision : "),
      };
    },
  },
  {
    id: "receipt",
    get label() {
      return t("Quittance");
    },
    get fields(): Partial<Fields> {
      return {
        type: "Quittance",
        reliability: "Confirmé",
        message: t("Quittance : "),
        reference: t("Suite de #"),
      };
    },
  },
  {
    id: "check",
    get label() {
      return t("Contrôle de liaison");
    },
    get fields(): Partial<Fields> {
      return {
        type: "Observation",
        channel: "Radio",
        reliability: "Confirmé",
        message: t("Contrôle de liaison : "),
        tags: ["radio"],
      };
    },
  },
];

export function applyTemplate(fields: Fields, template: Template): Fields {
  const skeleton = template.fields;
  return {
    ...fields,
    ...skeleton,
    tags: [...new Set([...fields.tags, ...(skeleton.tags ?? [])])],
  };
}
