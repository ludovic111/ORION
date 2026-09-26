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
import { messageHighWater } from "../../../shared/journal";
import { messageLabels } from "../../../shared/sync";
import type { Lang } from "../../../shared/i18n/core.ts";
import { t, tIn } from "./i18n.ts";

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
// Getters: read in the language of the post when shown.
export const STATUS_HINT: Record<Status, string> = {
  get Nouveau() {
    return t("Reçus, pas encore lus");
  },
  get "En traitement"() {
    return t("Synthèse en cours");
  },
  get Transmis() {
    return t("Inscrits au journal");
  },
  get Classé() {
    return t("Sans suite au journal");
  },
};

/** "M013", or a label from messageLabels() ("013·B" → "M013·B"). */
export const mLabel = (n: number | string | undefined) =>
  typeof n === "string" && n
    ? `M${n}`
    : typeof n === "number" && n
      ? `M${String(n).padStart(3, "0")}`
      : "M—";

/**
 * Number of each message: given at reception and never changed (deleting
 * or back-dating a message does not renumber the others). A message not
 * numbered yet gets the number it will receive.
 */
export function numbering(messages: Message[]) {
  let top = Math.max(0, ...messages.map((m) => m.number ?? 0));
  const pending = messages
    .filter((m) => !m.number)
    .sort(
      (a, b) =>
        Date.parse(a.receivedAt) - Date.parse(b.receivedAt) ||
        a.createdAt.localeCompare(b.createdAt) ||
        a.id.localeCompare(b.id),
    );
  const next = new Map(pending.map((m) => [m.id, ++top]));
  return new Map(messages.map((m) => [m.id, m.number ?? next.get(m.id)!]));
}

/** Number for a message received now on this post (never given before). */
export const nextMessageNumber = (journal: Journal) =>
  messageHighWater(journal) + 1;

/** Labels of the messages ("013", "013·B" when two posts gave 013). */
export const messageLabelsOf = (journal: Journal) => messageLabels(journal);

const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .toLocaleLowerCase("fr");

// Categories and channels are free texts (référentiel of the journal, in
// its language): French words first, then German and Italian ones.
const starts = (text: string, words: string[]) =>
  words.some((w) => text.startsWith(w));

export function toType(category: string): (typeof TYPES)[number] {
  const c = norm(category);
  if (starts(c, ["demande", "anfrage", "anforderung", "richiesta"]))
    return "Demande";
  if (starts(c, ["ordre", "mission", "befehl", "auftrag", "ordine"]))
    return "Mission";
  if (starts(c, ["quittance", "quittung", "quittanza"])) return "Quittance";
  if (starts(c, ["decision", "entscheid", "decisione"])) return "Décision";
  return "Renseignement";
}

/** Category of an alert ("Alerte", "Alarm", "Allarme"). */
const isAlert = (category: string) =>
  starts(norm(category), ["alerte", "alarm", "allarm", "allerta"]);

export function toChannel(via: string): (typeof CHANNELS)[number] {
  const v = norm(via);
  const exact = CHANNELS.find((c) => norm(c) === v);
  if (exact) return exact;
  if (
    v === "sms" ||
    starts(v, [
      "messager",
      "message",
      "meldung",
      "melder",
      "messagg",
      "staffett",
    ])
  )
    return "Message";
  if (starts(v, ["tel", "natel"])) return "Téléphone";
  if (starts(v, ["mail", "courriel", "e-mail"])) return "E-mail";
  if (starts(v, ["radio", "polycom", "funk"])) return "Radio";
  if (starts(v, ["sur place", "vor ort", "sul posto"])) return "Sur place";
  return "Autre";
}

export const messageText = (m: Pick<Message, "subject" | "body">) =>
  [m.subject.trim(), m.body.trim()].filter(Boolean).join(" — ");

/** Journal entry prefilled from a message (the synthesis). */
export function entryFrom(m: Message, number: number | undefined): Fields {
  const type = toType(m.category);
  const alert = isAlert(m.category);
  const follow = m.replyNeeded || type === "Demande" || type === "Mission";
  return {
    happenedAt: m.receivedAt,
    receivedAt: m.receivedAt,
    type,
    message: messageText(m) || t("Message {label}", { label: mLabel(number) }),
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
    reference: t("Message {label}", { label: mLabel(number) }),
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
/**
 * Message templates: labels and text in the language of the post, the
 * category in the language of the journal (its référentiel of categories).
 */
export function skeletons(journalLang: Lang): Skeleton[] {
  const category = (key: Parameters<typeof tIn>[1]) => tIn(journalLang, key);
  return [
    {
      id: "report",
      label: t("Compte rendu"),
      category: category("Compte rendu"),
      body: t(
        "Compte rendu.\nSituation : \nMesures prises : \nMoyens engagés : \nBesoins : ",
      ),
    },
    {
      id: "request",
      label: t("Demande de moyens"),
      category: category("Demande"),
      priority: "Important",
      replyNeeded: true,
      body: t(
        "Demande de moyens.\nMoyens : \nQuantité : \nLieu de livraison : \nDélai : \nMotif : ",
      ),
    },
    {
      id: "alert",
      label: t("Alerte"),
      category: category("Alerte"),
      priority: "Urgent",
      body: t(
        "Alerte.\nQuoi : \nOù : \nPersonnes concernées : \nMesures immédiates : ",
      ),
    },
    {
      id: "info",
      label: t("Information"),
      category: category("Information"),
      body: t("Information : "),
    },
    {
      id: "receipt",
      label: t("Quittance"),
      category: category("Quittance"),
      body: t("Quittance : \nSuite du message : "),
    },
  ];
}

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

/** "dans 12 min", "en retard de 1 h 05"; span alone: "12 min", "1 h 05". */
export function countdown(iso: string, now: number) {
  const diff = Math.round((Date.parse(iso) - now) / 60000);
  const abs = Math.abs(diff);
  const span =
    abs < 60
      ? `${abs} min`
      : `${Math.floor(abs / 60)} h ${String(abs % 60).padStart(2, "0")}`;
  return {
    late: diff < 0,
    span,
    text:
      diff < 0
        ? t("en retard de {time}", { time: span })
        : t("dans {time}", { time: span }),
  };
}
