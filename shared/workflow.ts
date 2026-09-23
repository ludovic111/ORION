import {
  chronological,
  current,
  needsFollowUp,
  type Entry,
  type Fields,
  type Journal,
} from "./journal.ts";

/** Entry numbers cited in the reference field: "Suite de #003", "#12, #14". */
export function referencedNumbers(fields: Pick<Fields, "reference">) {
  return [
    ...new Set(
      [...fields.reference.matchAll(/#\s?0*(\d{1,5})\b/g)].map((m) =>
        Number(m[1]),
      ),
    ),
  ].filter((n) => n > 0);
}

/** Every entry connected to this one through references, oldest first. */
export function thread(entries: Entry[], entry: Entry): Entry[] {
  const byNumber = new Map(entries.map((e) => [e.number, e]));
  const citing = new Map<number, Entry[]>();
  for (const e of entries)
    for (const n of referencedNumbers(current(e)))
      citing.set(n, [...(citing.get(n) ?? []), e]);
  const seen = new Set<string>([entry.id]);
  const queue = [entry];
  while (queue.length) {
    const next = queue.shift()!;
    const neighbours = [
      ...referencedNumbers(current(next))
        .map((n) => byNumber.get(n))
        .filter((e): e is Entry => !!e),
      ...(citing.get(next.number) ?? []),
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
  const numbers = new Set(referencedNumbers(fields));
  return journal.entries.filter(
    (e) => numbers.has(e.number) && needsFollowUp(e),
  );
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
    label: "Point de situation",
    fields: {
      type: "Renseignement",
      message:
        "Point de situation.\nSituation : \nMesures prises : \nMoyens engagés : \nBesoins : \nProchain point : ",
    },
  },
  {
    id: "request",
    label: "Demande de moyens",
    fields: {
      type: "Demande",
      priority: "Important",
      status: "À traiter",
      message:
        "Demande de moyens.\nMoyens : \nQuantité : \nLieu de livraison : \nDélai : \nMotif : ",
    },
  },
  {
    id: "mission",
    label: "Mission",
    fields: {
      type: "Mission",
      status: "À traiter",
      message: "Mission : ",
      action: "Quittancer l’exécution au PC.",
    },
  },
  {
    id: "decision",
    label: "Décision",
    fields: {
      type: "Décision",
      status: "En cours",
      reliability: "Confirmé",
      message: "Décision : ",
    },
  },
  {
    id: "receipt",
    label: "Quittance",
    fields: {
      type: "Quittance",
      reliability: "Confirmé",
      message: "Quittance : ",
      reference: "Suite de #",
    },
  },
  {
    id: "check",
    label: "Contrôle de liaison",
    fields: {
      type: "Observation",
      channel: "Radio",
      reliability: "Confirmé",
      message: "Contrôle de liaison : ",
      tags: ["radio"],
    },
  },
];

export function applyTemplate(fields: Fields, template: Template): Fields {
  return {
    ...fields,
    ...template.fields,
    tags: [...new Set([...fields.tags, ...(template.fields.tags ?? [])])],
  };
}
