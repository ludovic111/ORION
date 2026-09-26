import {
  current,
  needsFollowUp,
  numberLabel,
  overdue,
  type Journal,
} from "./journal.ts";
import type { Ack, Broadcast } from "./conduct.ts";
import { orderLabels } from "./orders.ts";
import { enumLabel } from "./i18n/enums.ts";
import { t as tr } from "./i18n/diffusion.ts";

// Who a post is (its function, its operator, its cell, its command post),
// who a diffusion or a task is meant for, and what is still waiting.

export type Identity = {
  /** Operator of the post (workspace.author). */
  name: string;
  /** Function chosen for this post ("Logistique"). */
  role: string;
  /** Cell or post of the team ("Cellule logistique"), optional. */
  cell: string;
  /** Name of this command post for the liaisons ("PC front"), optional. */
  pc: string;
};

export const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[’']/g, "'")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("fr");

export const EVERYONE = "Tous";

/** Whether a recipient ("Logistique", "Tous", a name) designates this post. */
export function designates(recipient: string, me: Identity): boolean {
  const r = norm(recipient);
  if (!r) return false;
  if (r === norm(EVERYONE)) return true;
  return [me.role, me.name, me.cell, me.pc].some((x) => !!x && norm(x) === r);
}

/**
 * Whether a free-text "responsable" ("Logistique / Sgt Rey", "Chef
 * situation et AIC") designates this post: any of its parts does.
 */
export function assignedTo(assignee: string, me: Identity): boolean {
  if (!assignee.trim()) return false;
  if (designates(assignee, me)) return true;
  return assignee.split(/[,;/+·]| et /).some((part) => designates(part, me));
}

export type RecipientState = {
  recipient: string;
  /** First receipt for this recipient. */
  ack?: Ack;
  /** Every receipt for this recipient (several posts may answer). */
  acks: Ack[];
  /** Waiting longer than the deadline. */
  late: boolean;
  /** Minutes waited (or taken to answer). */
  minutes: number;
};

const byTime = (a: Ack, b: Ack) =>
  a.at.localeCompare(b.at) || a.id.localeCompare(b.id);

/** Receipts of a diffusion, per recipient. */
export function recipientStates(
  b: Broadcast,
  acks: Ack[],
  now = Date.now(),
): RecipientState[] {
  const mine = acks.filter((a) => a.broadcastId === b.id).sort(byTime);
  const sent = Date.parse(b.sentAt);
  return b.recipients.map((recipient) => {
    const list = mine.filter((a) => norm(a.recipient) === norm(recipient));
    const ack = list[0];
    const waited = ((ack ? Date.parse(ack.at) : now) - sent) / 60_000;
    return {
      recipient,
      ack,
      acks: list,
      late:
        !ack &&
        b.ack !== "Aucun" &&
        !b.closedAt &&
        b.deadline > 0 &&
        waited >= b.deadline,
      minutes: Math.max(0, Math.round(waited)),
    };
  });
}

/** Recipients of a diffusion this post answers for, still without receipt. */
export function awaitingFrom(
  b: Broadcast,
  acks: Ack[],
  me: Identity,
): string[] {
  if (b.ack === "Aucun" || b.closedAt) return [];
  const done = new Set(
    acks.filter((a) => a.broadcastId === b.id).map((a) => norm(a.recipient)),
  );
  return b.recipients.filter((r) => designates(r, me) && !done.has(norm(r)));
}

/** Diffusions waiting for a receipt from this post, oldest first. */
export function inbox(
  journal: Pick<Journal, "ops">,
  me: Identity,
): { broadcast: Broadcast; recipients: string[] }[] {
  return journal.ops.broadcasts
    .map((broadcast) => ({
      broadcast,
      recipients: awaitingFrom(broadcast, journal.ops.acks, me),
    }))
    .filter((x) => x.recipients.length)
    .sort((a, b) => a.broadcast.sentAt.localeCompare(b.broadcast.sentAt));
}

/** Diffusions of this post (or all) with a recipient late to answer. */
export function lateBroadcasts(
  journal: Pick<Journal, "ops">,
  now = Date.now(),
  author?: string,
): Broadcast[] {
  return journal.ops.broadcasts.filter(
    (b) =>
      (!author || b.by === author) &&
      !b.source &&
      recipientStates(b, journal.ops.acks, now).some((s) => s.late),
  );
}

/** Receipts to write when this post acknowledges a diffusion. */
export function acksFor(
  b: Broadcast,
  acks: Ack[],
  me: Identity,
  kind: Ack["kind"],
  at: string,
): Omit<Ack, "createdAt" | "updatedAt" | "by">[] {
  return awaitingFrom(b, acks, me).map((recipient) => ({
    id: crypto.randomUUID(),
    broadcastId: b.id,
    recipient,
    kind,
    at,
    post: me.name,
    role: me.role,
    note: "",
    source: "",
  }));
}

// ---------- Mes tâches ----------

export type Task = {
  key: string;
  kind: "entry" | "assignment" | "mission" | "broadcast";
  /** Item to open. */
  ref: string;
  title: string;
  detail: string;
  /** Due time (ms), null when none. */
  due: number | null;
  late: boolean;
  urgent: boolean;
  /** Record ids for the quick actions. */
  id: string;
  orderId?: string;
};

const PRIORITY = { Urgent: 0, Important: 1, Normal: 2 } as const;

/**
 * Everything assigned to this post (its function, its operator, its cell):
 * entries to follow, assignments, missions of issued orders, diffusions to
 * acknowledge. Late first, then by due time, then by priority.
 */
export function myTasks(
  journal: Pick<Journal, "entries" | "ops" | "history">,
  me: Identity,
  now = Date.now(),
): Task[] {
  const out: (Task & { rank: number })[] = [];
  const assigned = new Map<string, { role: string; person: string }[]>();
  for (const a of journal.ops.assignments)
    if (!a.done) assigned.set(a.target, [...(assigned.get(a.target) ?? []), a]);
  const entryIds = new Set<string>();
  for (const e of journal.entries) {
    if (!needsFollowUp(e)) continue;
    const f = current(e);
    const extra = assigned.get(`entry:${e.id}`) ?? [];
    if (
      !assignedTo(f.assignee, me) &&
      !extra.some((a) => assignedTo(a.role, me) || assignedTo(a.person, me))
    )
      continue;
    entryIds.add(e.id);
    const due = f.dueAt ? Date.parse(f.dueAt) : null;
    out.push({
      key: `entry:${e.id}`,
      kind: "entry",
      ref: `entry:${e.id}`,
      id: e.id,
      title: `${numberLabel(e)} ${f.message.split("\n")[0].slice(0, 140)}`,
      detail: [enumLabel(f.type), enumLabel(f.status), f.assignee]
        .filter(Boolean)
        .join(" · "),
      due,
      late: overdue(e, now),
      urgent: f.priority === "Urgent",
      rank: PRIORITY[f.priority],
    });
  }
  for (const a of journal.ops.assignments) {
    if (a.done) continue;
    if (a.target.startsWith("entry:") && entryIds.has(a.target.slice(6)))
      continue;
    if (!assignedTo(a.role, me) && !assignedTo(a.person, me)) continue;
    // A closed entry assigned explicitly is done.
    if (a.target.startsWith("entry:")) {
      const e = journal.entries.find((x) => x.id === a.target.slice(6));
      if (e && !needsFollowUp(e)) continue;
    }
    const due = a.dueAt ? Date.parse(a.dueAt) : null;
    out.push({
      key: `assignment:${a.id}`,
      kind: "assignment",
      ref: a.target,
      id: a.id,
      title: a.note.split("\n")[0] || tr("Élément attribué"),
      detail: [a.role, a.person].filter(Boolean).join(" · "),
      due,
      late: due !== null && due < now,
      urgent: false,
      rank: 2,
    });
  }
  const labels = orderLabels(journal);
  for (const o of journal.ops.orders) {
    if (o.status !== "Émis") continue;
    for (const m of o.missions) {
      if (m.done) continue;
      if (!assignedTo(m.role, me) && !assignedTo(m.unit, me)) continue;
      const due = m.dueAt ? Date.parse(m.dueAt) : null;
      out.push({
        key: `mission:${o.id}:${m.id}`,
        kind: "mission",
        ref: `order:${o.id}`,
        id: m.id,
        orderId: o.id,
        title: m.task.split("\n")[0] || tr("Mission"),
        detail: [
          tr("Ordre {label}", { label: labels.get(o.id) ?? o.number }),
          m.unit,
        ]
          .filter(Boolean)
          .join(" · "),
        due,
        late: due !== null && due < now,
        urgent: false,
        rank: 1,
      });
    }
  }
  for (const { broadcast: b, recipients } of inbox(journal, me)) {
    const due = b.deadline ? Date.parse(b.sentAt) + b.deadline * 60_000 : null;
    out.push({
      key: `broadcast:${b.id}`,
      kind: "broadcast",
      ref: `broadcast:${b.id}`,
      id: b.id,
      title: b.title,
      detail: [
        tr("À quittancer ({ack})", { ack: enumLabel(b.ack) }),
        b.sender,
        recipients.map((r) => enumLabel(r)).join(", "),
      ]
        .filter(Boolean)
        .join(" · "),
      due,
      late: due !== null && due < now,
      urgent: b.priority === "Urgent",
      rank: PRIORITY[b.priority],
    });
  }
  return out
    .sort(
      (a, b) =>
        Number(b.late) - Number(a.late) ||
        (a.due ?? Infinity) - (b.due ?? Infinity) ||
        Number(b.urgent) - Number(a.urgent) ||
        a.rank - b.rank ||
        a.key.localeCompare(b.key),
    )
    .map(({ rank: _rank, ...task }) => task);
}

/**
 * What needs this post's attention now, for the title of the page and the
 * badge of "Mes tâches": late entries of the journal, plus its own late
 * tasks and diffusions waiting for its receipt (each counted once).
 */
export function attentionCount(
  journal: Pick<Journal, "entries" | "ops" | "history">,
  me: Identity,
  now = Date.now(),
): number {
  const keys = new Set<string>();
  for (const e of journal.entries)
    if (overdue(e, now)) keys.add(`entry:${e.id}`);
  for (const t of myTasks(journal, me, now))
    if (t.late || t.kind === "broadcast") keys.add(t.ref);
  return keys.size;
}

/** Tasks of this post that are late or to acknowledge (dock badge). */
export const taskBadge = (
  journal: Pick<Journal, "entries" | "ops" | "history">,
  me: Identity,
  now = Date.now(),
) =>
  myTasks(journal, me, now).filter((t) => t.late || t.kind === "broadcast")
    .length;
