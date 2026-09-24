import { z } from "zod";

// Everything an AIC cell keeps next to the journal: message intake, team,
// resources, contacts, map, rhythm, key facts, weather and the links between
// them. Every record is optional, editable and deletable. Records carry their
// own id so they survive archives, merges and live synchronisation.

const text = (max = 500) => z.string().max(max);
const instant = z.iso.datetime({ offset: true });
const optionalInstant = z.union([instant, z.literal("")]);
const optionalId = z.union([z.uuid(), z.literal("")]);
const record = {
  id: z.uuid(),
  createdAt: instant,
  updatedAt: instant,
  by: text(120),
};

export const MESSAGE_STATUSES = [
  "Nouveau",
  "En traitement",
  "Transmis",
  "Classé",
] as const;
export const MESSAGE_PRIORITIES = ["Normal", "Important", "Urgent"] as const;
export const MEMBER_STATUSES = [
  "Présent",
  "En pause",
  "Absent",
  "Relevé",
] as const;
export const RESOURCE_STATUSES = [
  "Disponible",
  "Alerté",
  "En route",
  "Engagé",
  "De retour",
  "Hors service",
] as const;
export const PLACE_KINDS = ["point", "line", "area", "text"] as const;
export const ALERT_LEVELS = ["1", "2", "3", "4", "5"] as const;
export const ALERT_LABELS: Record<(typeof ALERT_LEVELS)[number], string> = {
  "1": "Degré 1 · danger faible ou nul",
  "2": "Degré 2 · danger limité",
  "3": "Degré 3 · danger marqué",
  "4": "Degré 4 · fort danger",
  "5": "Degré 5 · très fort danger",
};

export const messageSchema = z
  .object({
    ...record,
    receivedAt: instant,
    from: text(200),
    to: text(200),
    via: text(60),
    priority: z.enum(MESSAGE_PRIORITIES),
    category: text(80),
    subject: text(300),
    body: text(12000),
    location: text(300),
    coordinates: text(150),
    replyNeeded: z.boolean(),
    replyBy: optionalInstant,
    status: z.enum(MESSAGE_STATUSES),
    entryId: optionalId,
    handledBy: text(120),
    notes: text(4000),
    tags: z.array(text(60).min(1)).max(20),
  })
  .strict();

export const cellSchema = z
  .object({
    ...record,
    name: text(120).min(1),
    kind: text(80),
    color: text(20),
    location: text(300),
    phone: text(80),
    radio: text(80),
    notes: text(2000),
    order: z.number().int(),
  })
  .strict();

export const memberSchema = z
  .object({
    ...record,
    name: text(120).min(1),
    grade: text(40),
    role: text(200),
    cellId: optionalId,
    callsign: text(60),
    phone: text(80),
    email: text(200),
    status: z.enum(MEMBER_STATUSES),
    from: optionalInstant,
    to: optionalInstant,
    notes: text(2000),
  })
  .strict();

export const resourceSchema = z
  .object({
    ...record,
    name: text(120).min(1),
    kind: text(80),
    organization: text(200),
    callsign: text(60),
    count: z.number().int().min(0).max(100000),
    status: z.enum(RESOURCE_STATUSES),
    location: text(300),
    mission: text(2000),
    eta: optionalInstant,
    contact: text(200),
    notes: text(2000),
  })
  .strict();

export const contactSchema = z
  .object({
    ...record,
    name: text(160).min(1),
    organization: text(200),
    role: text(200),
    category: text(80),
    phone: text(80),
    phone2: text(80),
    email: text(200),
    radio: text(80),
    address: text(300),
    notes: text(2000),
    favorite: z.boolean(),
  })
  .strict();

const latLng = z.tuple([
  z.number().min(-90).max(90),
  z.number().min(-180).max(180),
]);
export const placeSchema = z
  .object({
    ...record,
    label: text(200),
    kind: z.enum(PLACE_KINDS),
    symbol: text(80),
    color: text(20),
    layer: text(80),
    points: z.array(latLng).min(1).max(500),
    notes: text(4000),
  })
  .strict();

export const agendaSchema = z
  .object({
    ...record,
    at: instant,
    minutes: z
      .number()
      .int()
      .min(0)
      .max(24 * 60),
    title: text(200).min(1),
    kind: text(80),
    location: text(300),
    participants: text(1000),
    notes: text(4000),
    done: z.boolean(),
  })
  .strict();

export const factSchema = z
  .object({
    ...record,
    label: text(120).min(1),
    value: text(120),
    unit: text(40),
    category: text(80),
    note: text(500),
    order: z.number().int(),
  })
  .strict();

export const boardSchema = z
  .object({
    ...record,
    title: text(120).min(1),
    body: text(12000),
    order: z.number().int(),
  })
  .strict();

export const observationSchema = z
  .object({
    ...record,
    at: instant,
    place: text(200),
    temperature: text(40),
    wind: text(80),
    precipitation: text(80),
    visibility: text(80),
    conditions: text(200),
    notes: text(2000),
  })
  .strict();

export const alertSchema = z
  .object({
    ...record,
    level: z.enum(ALERT_LEVELS),
    hazard: text(120).min(1),
    region: text(200),
    from: optionalInstant,
    to: optionalInstant,
    source: text(200),
    notes: text(2000),
  })
  .strict();

export const REF_KINDS = [
  "entry",
  "message",
  "place",
  "resource",
  "member",
  "cell",
  "contact",
  "agenda",
  "fact",
  "board",
  "alert",
  "observation",
  "terminal",
  "station",
  "talkgroup",
] as const;
export type RefKind = (typeof REF_KINDS)[number];
export const refSchema = z
  .string()
  .regex(
    new RegExp(
      `^(${REF_KINDS.join("|")}):[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$`,
      "i",
    ),
  );
export const linkSchema = z
  .object({
    ...record,
    a: refSchema,
    b: refSchema,
    label: text(200),
  })
  .strict();

export const settingsSchema = z
  .object({
    lists: z.record(text(40), z.array(text(120)).max(200)).default({}),
    weatherPlace: z
      .object({
        name: text(200),
        lat: z.number().min(-90).max(90),
        lng: z.number().min(-180).max(180),
      })
      .nullable()
      .default(null),
    mapCenter: z
      .object({
        lat: z.number().min(-90).max(90),
        lng: z.number().min(-180).max(180),
        zoom: z.number().min(1).max(22),
      })
      .nullable()
      .default(null),
  })
  .strict();

export const opsSchema = z
  .object({
    messages: z.array(messageSchema).max(20000).default([]),
    cells: z.array(cellSchema).max(500).default([]),
    members: z.array(memberSchema).max(5000).default([]),
    resources: z.array(resourceSchema).max(5000).default([]),
    contacts: z.array(contactSchema).max(5000).default([]),
    places: z.array(placeSchema).max(5000).default([]),
    agenda: z.array(agendaSchema).max(2000).default([]),
    facts: z.array(factSchema).max(200).default([]),
    boards: z.array(boardSchema).max(100).default([]),
    observations: z.array(observationSchema).max(5000).default([]),
    alerts: z.array(alertSchema).max(500).default([]),
    links: z.array(linkSchema).max(20000).default([]),
    settings: settingsSchema.default({
      lists: {},
      weatherPlace: null,
      mapCenter: null,
    }),
  })
  .strict();

export type Message = z.infer<typeof messageSchema>;
export type Cell = z.infer<typeof cellSchema>;
export type Member = z.infer<typeof memberSchema>;
export type Resource = z.infer<typeof resourceSchema>;
export type Contact = z.infer<typeof contactSchema>;
export type Place = z.infer<typeof placeSchema>;
export type AgendaItem = z.infer<typeof agendaSchema>;
export type Fact = z.infer<typeof factSchema>;
export type Board = z.infer<typeof boardSchema>;
export type Observation = z.infer<typeof observationSchema>;
export type WeatherAlert = z.infer<typeof alertSchema>;
export type Link = z.infer<typeof linkSchema>;
export type OpsSettings = z.infer<typeof settingsSchema>;
export type Ops = z.infer<typeof opsSchema>;

/** Collections of records with an id, in a fixed order. */
export const COLLECTIONS = [
  "messages",
  "cells",
  "members",
  "resources",
  "contacts",
  "places",
  "agenda",
  "facts",
  "boards",
  "observations",
  "alerts",
  "links",
] as const;
export type Collection = (typeof COLLECTIONS)[number];
export type RecordOf<C extends Collection> = Ops[C][number];

export const emptyOps = (): Ops => opsSchema.parse({});

// Standard values proposed in the forms. Every list can be edited in the
// référentiels; a field always accepts free text as well.
export const DEFAULT_LISTS: Record<
  string,
  { label: string; values: string[] }
> = {
  recipients: {
    label: "Destinataires et émetteurs standards",
    values: [
      "PC front",
      "PC arrière",
      "Chef d’intervention",
      "Chef d’état-major",
      "Chef AIC",
      "Cellule situation",
      "Cellule logistique",
      "Cellule télématique",
      "Cellule sanitaire",
      "Cellule communication",
      "Centrale d’engagement",
      "EMCC",
      "Police",
      "Pompiers (SIS)",
      "Sanitaire (144)",
      "Commune",
      "Canton",
      "Tous",
    ],
  },
  categories: {
    label: "Catégories de message",
    values: [
      "Renseignement",
      "Demande",
      "Ordre / mission",
      "Compte rendu",
      "Alerte",
      "Quittance",
      "Information",
      "Autre",
    ],
  },
  channels: {
    label: "Canaux de réception",
    values: [
      "Radio",
      "Téléphone",
      "E-mail",
      "Messager",
      "Sur place",
      "SMS",
      "Autre",
    ],
  },
  cellKinds: {
    label: "Types de poste ou de cellule",
    values: [
      "PC front",
      "PC arrière",
      "Poste de commandement",
      "Cellule",
      "Équipe d’intervention",
      "Détachement",
      "Liaison",
      "Autre",
    ],
  },
  grades: {
    label: "Grades",
    values: [
      "Sdt",
      "App",
      "Cpl",
      "Sgt",
      "Sgt chef",
      "Sgtm",
      "Sgtm chef",
      "Adj sof",
      "Lt",
      "Plt",
      "Cap",
      "Maj",
      "Lt col",
      "Col",
      "Civil",
    ],
  },
  roles: {
    label: "Fonctions",
    values: [
      "Chef d’intervention",
      "Chef d’état-major",
      "Chef AIC",
      "Suivi de la situation",
      "Synthèse des messages",
      "Opérateur journal",
      "Opérateur radio",
      "Téléphoniste",
      "Cartographe",
      "Chef logistique",
      "Chef télématique",
      "Officier de liaison",
      "Secrétariat",
      "Communication / presse",
    ],
  },
  resourceKinds: {
    label: "Types de moyens",
    values: [
      "Véhicule",
      "Personnel",
      "Matériel",
      "Engin spécial",
      "Aérien",
      "Embarcation",
      "Hébergement",
      "Autre",
    ],
  },
  organizations: {
    label: "Organisations",
    values: [
      "Protection civile",
      "Pompiers (SIS)",
      "Police",
      "Sanitaire",
      "Armée",
      "Commune",
      "Canton",
      "Services techniques",
      "Privé",
    ],
  },
  contactCategories: {
    label: "Catégories de contact",
    values: [
      "Urgences",
      "Autorités",
      "Partenaires",
      "Interne",
      "Fournisseurs",
      "Médias",
      "Autre",
    ],
  },
  agendaKinds: {
    label: "Types de rendez-vous",
    values: [
      "Rapport de conduite",
      "Orientation",
      "Point de situation",
      "Relève",
      "Conférence de presse",
      "Contrôle de liaison",
      "Autre",
    ],
  },
  layers: {
    label: "Calques de la carte",
    values: ["Effets", "Dangers", "Moyens", "Mesures", "Emplacements", "Autre"],
  },
  factCategories: {
    label: "Catégories de renseignements clés",
    values: [
      "Personnes",
      "Bâtiments",
      "Infrastructures",
      "Engagement",
      "Autre",
    ],
  },
};
export type ListName = keyof typeof DEFAULT_LISTS;
export const listValues = (ops: Ops, name: string) =>
  ops.settings.lists[name] ?? DEFAULT_LISTS[name]?.values ?? [];

export const nowIso = () => new Date().toISOString();

/** Create or replace a record; timestamps and author are filled in. */
export function upsert<C extends Collection>(
  ops: Ops,
  collection: C,
  value: Omit<RecordOf<C>, "id" | "createdAt" | "updatedAt" | "by"> &
    Partial<Pick<RecordOf<C>, "id" | "createdAt" | "by">>,
  author: string,
): Ops {
  const at = nowIso();
  const list = ops[collection] as RecordOf<C>[];
  const previous = value.id ? list.find((r) => r.id === value.id) : undefined;
  const next = {
    ...value,
    id: value.id ?? crypto.randomUUID(),
    createdAt: previous?.createdAt ?? value.createdAt ?? at,
    updatedAt: at,
    by: previous?.by ?? value.by ?? author,
  } as RecordOf<C>;
  return {
    ...ops,
    [collection]: previous
      ? list.map((r) => (r.id === next.id ? next : r))
      : [...list, next],
  };
}

/** Remove records and every explicit link that points to them. */
export function removeRecords(ops: Ops, ids: string[]): Ops {
  const gone = new Set(ids);
  const next = { ...ops } as Ops;
  for (const collection of COLLECTIONS)
    (next as Record<Collection, { id: string }[]>)[collection] = ops[
      collection
    ].filter((r) => !gone.has(r.id));
  next.links = next.links.filter(
    (l) => !gone.has(l.a.split(":")[1]) && !gone.has(l.b.split(":")[1]),
  );
  // A member keeps its data when its cell disappears.
  next.members = next.members.map((m) =>
    gone.has(m.cellId) ? { ...m, cellId: "" } : m,
  );
  next.messages = next.messages.map((m) =>
    gone.has(m.entryId) ? { ...m, entryId: "" } : m,
  );
  return next;
}

export function findRecord(ops: Ops, id: string) {
  for (const collection of COLLECTIONS) {
    const found = (ops[collection] as { id: string }[]).find(
      (r) => r.id === id,
    );
    if (found) return { collection, record: found };
  }
  return undefined;
}

export function emptyMessage(
  author = "",
): Omit<Message, "id" | "createdAt" | "updatedAt" | "by"> {
  return {
    receivedAt: nowIso(),
    from: "",
    to: "",
    via: "Radio",
    priority: "Normal",
    category: "",
    subject: "",
    body: "",
    location: "",
    coordinates: "",
    replyNeeded: false,
    replyBy: "",
    status: "Nouveau",
    entryId: "",
    handledBy: author ? "" : "",
    notes: "",
    tags: [],
  };
}

export const SWISS_EMERGENCY: Pick<
  Contact,
  "name" | "phone" | "category" | "organization" | "notes"
>[] = [
  {
    name: "Urgences (numéro européen)",
    phone: "112",
    category: "Urgences",
    organization: "",
    notes: "",
  },
  {
    name: "Police",
    phone: "117",
    category: "Urgences",
    organization: "",
    notes: "",
  },
  {
    name: "Pompiers",
    phone: "118",
    category: "Urgences",
    organization: "",
    notes: "",
  },
  {
    name: "Ambulance · urgences sanitaires",
    phone: "144",
    category: "Urgences",
    organization: "",
    notes: "",
  },
  {
    name: "Rega · sauvetage aérien",
    phone: "1414",
    category: "Urgences",
    organization: "Rega",
    notes: "Depuis l’étranger : +41 333 333 333",
  },
  {
    name: "Tox Info Suisse · intoxications",
    phone: "145",
    category: "Urgences",
    organization: "Tox Info Suisse",
    notes: "",
  },
  {
    name: "La Main Tendue · aide psychologique",
    phone: "143",
    category: "Urgences",
    organization: "",
    notes: "",
  },
];

export const STANDARD_FACTS: Pick<Fact, "label" | "unit" | "category">[] = [
  { label: "Personnes blessées", unit: "pers.", category: "Personnes" },
  { label: "Personnes décédées", unit: "pers.", category: "Personnes" },
  { label: "Personnes disparues", unit: "pers.", category: "Personnes" },
  { label: "Personnes évacuées", unit: "pers.", category: "Personnes" },
  { label: "Personnes hébergées", unit: "pers.", category: "Personnes" },
  { label: "Bâtiments touchés", unit: "bât.", category: "Bâtiments" },
  { label: "Routes fermées", unit: "", category: "Infrastructures" },
  { label: "Personnel engagé", unit: "pers.", category: "Engagement" },
];

export const STANDARD_BOARDS = [
  "Situation générale",
  "Dangers et évolution probable",
  "Intention / idée de manœuvre",
  "Points ouverts pour le prochain rapport",
];
