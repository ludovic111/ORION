import { createdKey, nodeOr, suffixes } from "./journal.ts";
import type { HistoryEvent } from "./events.ts";
import type { Order, OrderMission } from "./conduct.ts";
import { t } from "./i18n/orders.ts";

// Structured orders (armée / PCi scheme): numbers, labels, templates and
// the prefill taken from the situation, the radio plan and the rhythm.

type Numbered = Pick<Order, "id" | "number" | "createdAt"> & {
  node?: string;
  source?: string;
};

/** Orders of this command post (not received through a liaison). */
const own = (o: { source?: string }) => !o.source;

/**
 * Highest order number ever given by this command post, removed orders
 * included (from the history): a number is never given twice.
 */
export function orderHighWater(j: {
  ops: { orders: Numbered[] };
  history: HistoryEvent[];
}): number {
  let top = 0;
  for (const o of j.ops.orders) if (own(o) && o.number > top) top = o.number;
  for (const e of j.history)
    if (e.scope === "ops.orders" && e.state && typeof e.state === "object") {
      const s = e.state as { number?: unknown; source?: unknown };
      if (typeof s.number === "number" && !s.source && s.number > top)
        top = s.number;
    }
  return top;
}

/** Number of a new order of this command post. */
export const nextOrderNumber = (j: Parameters<typeof orderHighWater>[0]) =>
  orderHighWater(j) + 1;

/**
 * Labels of the orders ("Ordre n° 3", "n° 3·K" when two posts gave 3 at the
 * same time, "PC front n° 2" for an order received from another command
 * post). Removed orders keep their place, so labels never move.
 */
export function orderLabels(j: {
  ops: { orders: Numbered[] };
  history: HistoryEvent[];
}): Map<string, string> {
  const items = new Map<string, Numbered>();
  for (const e of j.history)
    if (
      e.scope === "ops.orders" &&
      e.state &&
      typeof e.state === "object" &&
      !items.has(e.target)
    ) {
      const s = e.state as Numbered;
      if (typeof s.number === "number" && typeof s.createdAt === "string")
        items.set(e.target, { ...s, id: e.target });
    }
  for (const o of j.ops.orders) items.set(o.id, o);
  const extra = suffixes(
    [...items.values()].filter(own).map((o) => ({
      id: o.id,
      number: o.number,
      key: createdKey(o.createdAt),
      node: nodeOr(o.node, o.id),
    })),
  );
  const out = new Map<string, string>();
  for (const o of j.ops.orders) {
    const n = t("n° {n}", {
      n: `${o.number}${extra.has(o.id) ? `·${extra.get(o.id)}` : ""}`,
    });
    out.set(o.id, o.source ? `${o.source} ${n}` : n);
  }
  return out;
}

export const newMission = (
  patch: Partial<OrderMission> = {},
): OrderMission => ({
  id: crypto.randomUUID(),
  unit: "",
  task: "",
  role: "",
  dueAt: "",
  refs: [],
  done: false,
  ...patch,
});

export type OrderDraft = Omit<
  Order,
  "id" | "createdAt" | "updatedAt" | "by" | "number"
> & { id?: string; number?: number };

export function emptyOrder(patch: Partial<OrderDraft> = {}): OrderDraft {
  return {
    kind: "Ordre d’engagement",
    baseId: "",
    title: "",
    status: "Brouillon",
    issuedAt: "",
    issuer: "",
    situation: "",
    danger: "",
    neighbours: "",
    intention: "",
    missions: [],
    logistics: "",
    medical: "",
    safety: "",
    pc: "",
    radio: "",
    reports: "",
    distribution: [],
    broadcastId: "",
    entryId: "",
    notes: "",
    source: "",
    ...patch,
  };
}

export type OrderTemplate = {
  id: string;
  label: string;
  hint: string;
  patch: Partial<OrderDraft>;
};

/** Starting points; every field stays editable. */
// The kind is a value of the référentiel « Types d’ordre » (stored in
// French); label, hint, title and intention follow the language of the post.
export const ORDER_TEMPLATES: OrderTemplate[] = [
  {
    id: "engagement",
    get label() {
      return t("Ordre d’engagement");
    },
    get hint() {
      return t("Les cinq chapitres, préremplis depuis la situation.");
    },
    get patch(): Partial<OrderDraft> {
      return { kind: "Ordre d’engagement", title: t("Ordre d’engagement") };
    },
  },
  {
    id: "complement",
    get label() {
      return t("Ordre complémentaire");
    },
    get hint() {
      return t("Ce qui change par rapport à un ordre émis.");
    },
    get patch(): Partial<OrderDraft> {
      return {
        kind: "Ordre complémentaire",
        title: t("Ordre complémentaire"),
        intention: t("Inchangée."),
      };
    },
  },
  {
    id: "preparatory",
    get label() {
      return t("Ordre préparatoire");
    },
    get hint() {
      return t("Prévenir tôt : ce qui va venir, se préparer.");
    },
    get patch(): Partial<OrderDraft> {
      return {
        kind: "Ordre préparatoire",
        title: t("Ordre préparatoire"),
        intention: t("Engagement probable. Se tenir prêts à…"),
      };
    },
  },
  {
    id: "relief",
    get label() {
      return t("Ordre de relève");
    },
    get hint() {
      return t("Qui relève qui, où et quand.");
    },
    get patch(): Partial<OrderDraft> {
      return {
        kind: "Ordre de relève",
        title: t("Ordre de relève"),
        intention: t("Assurer la continuité de la conduite pendant la relève."),
        missions: [],
      };
    },
  },
];

/** Prefill of chapters 1 and 5 from what the journal already knows. */
export function orderPrefill(
  j: {
    ops: {
      boards: { title: string; body: string }[];
      agenda: { at: string; title: string; kind: string; done: boolean }[];
      cells: { name: string; kind: string; location: string; radio: string }[];
    };
    radio: {
      talkgroups: { number: string; name: string; usage: string }[];
    };
    location: string;
  },
  now = Date.now(),
  time: (iso: string) => string = (iso) => iso.slice(11, 16),
): Partial<OrderDraft> {
  // Titles of the standard boards, in the three languages of the journals.
  const board = (...starts: string[]) =>
    j.ops.boards
      .find((b) =>
        starts.some((start) =>
          b.title.toLocaleLowerCase("fr").startsWith(start),
        ),
      )
      ?.body.trim() ?? "";
  const pcs = j.ops.cells.filter((c) =>
    /pc|poste/i.test(`${c.kind} ${c.name}`),
  );
  const reports = j.ops.agenda
    .filter((a) => !a.done && Date.parse(a.at) >= now)
    .sort((a, b) => a.at.localeCompare(b.at))
    .slice(0, 4)
    .map((a) => `${time(a.at)} ${a.title}`);
  return {
    situation: board("situation", "allgemeine lage", "situazione"),
    danger: board("dangers", "gefahren", "pericoli"),
    intention: board("intention", "absicht", "intenzione"),
    pc: pcs.length
      ? pcs
          .map((c) => [c.name, c.location].filter(Boolean).join(" : "))
          .join("\n")
      : j.location,
    radio: j.radio.talkgroups
      .map((g) =>
        [g.number, g.name, g.usage && `(${g.usage})`].filter(Boolean).join(" "),
      )
      .join("\n"),
    reports: reports.join("\n"),
  };
}

/** The five chapters, for display and print. */
export const CHAPTERS = [
  {
    n: 1,
    get title() {
      return t("Orientation");
    },
  },
  {
    n: 2,
    get title() {
      return t("Intention");
    },
  },
  {
    n: 3,
    get title() {
      return t("Missions");
    },
  },
  {
    n: 4,
    get title() {
      return t("Dispositions particulières");
    },
  },
  {
    n: 5,
    get title() {
      return t("Emplacements et liaisons");
    },
  },
] as const;
