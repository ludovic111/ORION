import {
  CHANNELS,
  STATUSES,
  TYPES,
  type Fields,
  type Journal,
} from "../../../shared/journal";
import {
  MESSAGE_PRIORITIES,
  MESSAGE_STATUSES,
  type Message,
} from "../../../shared/ops";

export type Status = (typeof MESSAGE_STATUSES)[number];
export type Priority = (typeof MESSAGE_PRIORITIES)[number];
export type Draft = Omit<Message, "id" | "createdAt" | "updatedAt" | "by">;

/** Follow-up states proposed when a message becomes a journal entry. */
export const FOLLOW_STATUSES = [
  "Consigné",
  "À traiter",
  "En cours",
] as const satisfies readonly (typeof STATUSES)[number][];

export const STATUS_TONE: Record<Status, string> = {
  Nouveau: "accent",
  "En traitement": "warn",
  Transmis: "ok",
  Classé: "muted",
};
export const PRIORITY_TONE: Record<Priority, string> = {
  Normal: "plain",
  Important: "warn",
  Urgent: "crit",
};
export const STATUS_HINT: Record<Status, string> = {
  Nouveau: "Reçus, pas encore lus",
  "En traitement": "Synthèse en cours",
  Transmis: "Inscrits au journal",
  Classé: "Sans suite au journal",
};

export const mLabel = (n: number | undefined) =>
  n ? `M${String(n).padStart(3, "0")}` : "M—";

/** 1-based number of each message, in the order of reception. */
export function numbering(messages: Message[]) {
  const sorted = [...messages].sort(
    (a, b) =>
      Date.parse(a.receivedAt) - Date.parse(b.receivedAt) ||
      a.createdAt.localeCompare(b.createdAt),
  );
  return new Map(sorted.map((m, i) => [m.id, i + 1]));
}

const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .toLocaleLowerCase("fr");

export function toType(category: string): (typeof TYPES)[number] {
  const c = norm(category);
  if (c.startsWith("demande")) return "Demande";
  if (c.startsWith("ordre") || c.startsWith("mission")) return "Mission";
  if (c.startsWith("quittance")) return "Quittance";
  if (c.startsWith("decision")) return "Décision";
  return "Renseignement";
}

export function toChannel(via: string): (typeof CHANNELS)[number] {
  const v = norm(via);
  const exact = CHANNELS.find((c) => norm(c) === v);
  if (exact) return exact;
  if (v === "sms" || v.startsWith("messager") || v.startsWith("message"))
    return "Message";
  if (v.startsWith("tel") || v.startsWith("natel")) return "Téléphone";
  if (v.startsWith("mail") || v.startsWith("courriel")) return "E-mail";
  if (v.startsWith("radio") || v.startsWith("polycom")) return "Radio";
  return "Autre";
}

export const messageText = (m: Pick<Message, "subject" | "body">) =>
  [m.subject.trim(), m.body.trim()].filter(Boolean).join(" — ");

/** Journal entry prefilled from a message (the synthesis). */
export function entryFrom(m: Message, number: number | undefined): Fields {
  const type = toType(m.category);
  const alert = norm(m.category).startsWith("alerte");
  const follow = m.replyNeeded || type === "Demande" || type === "Mission";
  return {
    happenedAt: m.receivedAt,
    receivedAt: m.receivedAt,
    type,
    message: messageText(m) || `Message ${mLabel(number)}`,
    source: m.from,
    recipient: m.to,
    channel: toChannel(m.via),
    priority: alert ? "Urgent" : m.priority,
    reliability: "Non confirmé",
    location: m.location,
    coordinates: m.coordinates,
    action: "",
    assignee: m.replyNeeded ? m.to : "",
    dueAt: m.replyNeeded ? m.replyBy : "",
    status: follow ? "À traiter" : "Consigné",
    resources: "",
    reference: `Message ${mLabel(number)}`,
    notes: m.notes,
    tags: m.tags,
  };
}

export type Skeleton = {
  id: string;
  label: string;
  category: string;
  priority?: Priority;
  replyNeeded?: boolean;
  body: string;
};
export const SKELETONS: Skeleton[] = [
  {
    id: "report",
    label: "Compte rendu",
    category: "Compte rendu",
    body: "Compte rendu.\nSituation : \nMesures prises : \nMoyens engagés : \nBesoins : ",
  },
  {
    id: "request",
    label: "Demande de moyens",
    category: "Demande",
    priority: "Important",
    replyNeeded: true,
    body: "Demande de moyens.\nMoyens : \nQuantité : \nLieu de livraison : \nDélai : \nMotif : ",
  },
  {
    id: "alert",
    label: "Alerte",
    category: "Alerte",
    priority: "Urgent",
    body: "Alerte.\nQuoi : \nOù : \nPersonnes concernées : \nMesures immédiates : ",
  },
  {
    id: "info",
    label: "Information",
    category: "Information",
    body: "Information : ",
  },
  {
    id: "receipt",
    label: "Quittance",
    category: "Quittance",
    body: "Quittance : \nSuite du message : ",
  },
];

/** Values proposed for "De" and "À": most used first, then the standards. */
export function partyOptions(
  journal: Journal,
  standards: string[],
  key: "from" | "to",
) {
  const count = new Map<string, number>();
  for (const m of journal.ops.messages) {
    const v = m[key].trim();
    if (v) count.set(v, (count.get(v) ?? 0) + 1);
  }
  const used = [...count.entries()].sort((a, b) => b[1] - a[1]).map(([v]) => v);
  return [
    ...used.slice(0, 4),
    ...standards,
    ...journal.ops.cells.map((c) => c.name),
    ...journal.radio.stations.map((s) => s.callsign),
    ...journal.ops.contacts.map((c) => c.name),
    ...used.slice(4),
  ];
}

/** "dans 12 min", "en retard de 1 h 05". */
export function countdown(iso: string, now: number) {
  const diff = Math.round((Date.parse(iso) - now) / 60000);
  const abs = Math.abs(diff);
  const text =
    abs < 60
      ? `${abs} min`
      : `${Math.floor(abs / 60)} h ${String(abs % 60).padStart(2, "0")}`;
  return {
    late: diff < 0,
    text: diff < 0 ? `en retard de ${text}` : `dans ${text}`,
  };
}
