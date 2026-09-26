import { z } from "zod";
import {
  ackSchema,
  broadcastSchema,
  exchangeSchema,
  orderSchema,
  type Ack,
  type Broadcast,
  type Exchange,
  type Liaison,
  type Order,
} from "./conduct.ts";
import { MESSAGE_PRIORITIES, messageSchema, type Ops } from "./ops.ts";
import { norm } from "./diffusion.ts";
import { normalizeCode } from "./room.ts";

// Liaison between two command posts (PC front ↔ PC arrière), each with its
// own session. A liaison code (made like a session code) opens another room
// on the same relay, with its own key: only what an operator sends
// explicitly crosses it — messages, diffusions (with their order) and the
// receipts that answer them. Nothing else of either session is shared.
//
// Delivery is confirmed: an outgoing item (ops.exchanges, direction "out")
// is sent again at every contact until the other command post answers
// "got". An incoming item keeps the id of its envelope (and the ids of the
// records it carries), so several posts receiving it keep only one.

const text = (max = 500) => z.string().max(max);
const instant = z.iso.datetime({ offset: true });

/** Version of the liaison messages. */
export const LIAISON_VERSION = 1;

export const envelopeSchema = z
  .object({
    id: z.uuid(),
    kind: z.enum(["message", "broadcast", "ack"]),
    /** Command post that sends ("PC front"). */
    from: text(120).min(1),
    /** Operator who sent it. */
    author: text(120),
    at: instant,
    message: z
      .object({
        subject: text(300),
        body: text(12000),
        priority: z.enum(MESSAGE_PRIORITIES),
        category: text(80),
      })
      .strict()
      .optional(),
    broadcast: broadcastSchema.optional(),
    order: orderSchema.optional(),
    ack: ackSchema.optional(),
  })
  .strict();
export type Envelope = z.infer<typeof envelopeSchema>;

/** Wire messages of the liaison room (encrypted like the session ones). */
export type LiaisonWire =
  | { t: "hello"; lv: number; peer: string; pc: string; journal: string }
  | { t: "items"; lv: number; peer: string; pc: string; items: unknown[] }
  | { t: "got"; lv: number; peer: string; ids: string[] }
  | { t: "bye"; lv: number; peer: string };

// ---------- Ids ----------

/**
 * A uuid derived from a text: the same on every post, so that two posts
 * queuing the same item (a receipt to forward) produce one exchange.
 */
export function stableUuid(seed: string): string {
  const words: number[] = [];
  for (let round = 0; round < 4; round++) {
    let h = 0x811c9dc5 ^ (round * 0x9e3779b1);
    for (let i = 0; i < seed.length; i++) {
      h ^= seed.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    h ^= h >>> 13;
    h = Math.imul(h, 0x5bd1e995) >>> 0;
    h ^= h >>> 15;
    words.push(h >>> 0);
  }
  const hex = words.map((w) => w.toString(16).padStart(8, "0")).join("");
  // Version 5 layout (name based), variant 10.
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-5${hex.slice(13, 16)}-${(
    (parseInt(hex[16], 16) & 3) |
    8
  ).toString(16)}${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

// ---------- Keys ----------

const bytes = (s: string) => new TextEncoder().encode(s);
const hex = (buffer: ArrayBuffer) =>
  [...new Uint8Array(buffer)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

/**
 * Room id and key of a liaison code: PBKDF2-SHA-256 (200 000 iterations)
 * then HKDF, like a session code (shared/room.ts), with other labels — a
 * liaison code never opens a session room, nor the reverse.
 */
export async function liaisonKeys(
  code: string,
): Promise<{ room: string; key: CryptoKey }> {
  const material = await crypto.subtle.importKey(
    "raw",
    bytes(normalizeCode(code)),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const master = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: bytes("orion-aic/liaison/v1"),
      iterations: 200_000,
      hash: "SHA-256",
    },
    material,
    256,
  );
  const hkdf = await crypto.subtle.importKey("raw", master, "HKDF", false, [
    "deriveBits",
    "deriveKey",
  ]);
  const params = (info: string) => ({
    name: "HKDF",
    hash: "SHA-256",
    salt: bytes("orion-aic/liaison/v1"),
    info: bytes(info),
  });
  const room = hex(
    await crypto.subtle.deriveBits(
      params("orion-aic/liaison-room/v1"),
      hkdf,
      256,
    ),
  );
  const key = await crypto.subtle.deriveKey(
    params("orion-aic/liaison-key/v1"),
    hkdf,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
  return { room, key };
}

// ---------- Outgoing ----------

export const openLiaisons = (ops: Pick<Ops, "liaisons">) =>
  ops.liaisons.filter((l) => !l.closedAt && l.code);

/** Liaison whose other command post is named `recipient`, if open. */
export const liaisonFor = (ops: Pick<Ops, "liaisons">, recipient: string) =>
  openLiaisons(ops).find((l) => norm(l.name) === norm(recipient));

/** An outgoing exchange carrying `envelope`, waiting for delivery. */
export function outgoing(
  liaison: Liaison,
  envelope: Envelope,
  title: string,
  target: string,
  author: string,
  now: string,
): Exchange {
  return exchangeSchema.parse({
    id: envelope.id,
    createdAt: now,
    updatedAt: now,
    by: author,
    liaisonId: liaison.id,
    direction: "out",
    kind: envelope.kind,
    title,
    target,
    payload: JSON.stringify(envelope),
    sentAt: "",
    deliveredAt: "",
  });
}

/** A message typed for the other command post. */
export function messageEnvelope(
  liaison: Liaison,
  message: NonNullable<Envelope["message"]>,
  author: string,
  now: string,
  id: string = crypto.randomUUID(),
): Envelope {
  return envelopeSchema.parse({
    id,
    kind: "message",
    from: liaison.self,
    author,
    at: now,
    message,
  });
}

/** A diffusion (and its order) for the other command post. */
export function broadcastEnvelope(
  liaison: Liaison,
  broadcast: Broadcast,
  order: Order | undefined,
  author: string,
  now: string,
): Envelope {
  return envelopeSchema.parse({
    id: stableUuid(`${liaison.id}:broadcast:${broadcast.id}`),
    kind: "broadcast",
    from: liaison.self,
    author,
    at: now,
    broadcast,
    order,
  });
}

/** A receipt answering a diffusion received from the other command post. */
export function ackEnvelope(
  liaison: Liaison,
  ack: Ack,
  author: string,
  now: string,
): Envelope {
  return envelopeSchema.parse({
    id: stableUuid(`${liaison.id}:ack:${ack.id}`),
    kind: "ack",
    from: liaison.self,
    author,
    at: now,
    ack,
  });
}

/** Items still waiting for the other command post to confirm. */
export const pendingOut = (ops: Pick<Ops, "exchanges">, liaisonId: string) =>
  ops.exchanges.filter(
    (x) => x.liaisonId === liaisonId && x.direction === "out" && !x.deliveredAt,
  );

/**
 * What should leave and has not been queued yet: diffusions of this command
 * post addressed to an open liaison, receipts written here for diffusions
 * received from one.
 */
export function toForward(
  ops: Pick<Ops, "liaisons" | "broadcasts" | "acks" | "orders" | "exchanges">,
  author: string,
  now: string,
): Exchange[] {
  const out: Exchange[] = [];
  const queued = new Set(ops.exchanges.map((x) => x.id));
  const open = openLiaisons(ops);
  if (!open.length) return out;
  for (const b of ops.broadcasts) {
    if (b.source) continue;
    for (const l of open) {
      if (!b.recipients.some((r) => norm(r) === norm(l.name))) continue;
      // Only what was diffused once the liaison existed.
      if (b.sentAt < l.openedAt) continue;
      const order = ops.orders.find(
        (o) => o.broadcastId === b.id || b.target === `order:${o.id}`,
      );
      const env = broadcastEnvelope(l, b, order, author, now);
      if (!queued.has(env.id))
        out.push(outgoing(l, env, b.title, `broadcast:${b.id}`, author, now));
    }
  }
  for (const a of ops.acks) {
    if (a.source) continue;
    const b = ops.broadcasts.find((x) => x.id === a.broadcastId);
    if (!b?.source) continue;
    const received = ops.exchanges.find(
      (x) => x.direction === "in" && x.target === `broadcast:${b.id}`,
    );
    const l = open.find((x) => x.id === received?.liaisonId);
    if (!l) continue;
    const env = ackEnvelope(l, a, author, now);
    if (!queued.has(env.id))
      out.push(
        outgoing(l, env, `${a.kind} · ${b.title}`, `ack:${a.id}`, author, now),
      );
  }
  return out;
}

/** Mark outgoing items as delivered (the other command post confirmed). */
export function markDelivered(ops: Ops, ids: string[], at: string): Ops {
  const set = new Set(ids);
  if (
    !ops.exchanges.some(
      (x) => set.has(x.id) && x.direction === "out" && !x.deliveredAt,
    )
  )
    return ops;
  return {
    ...ops,
    exchanges: ops.exchanges.map((x) =>
      set.has(x.id) && x.direction === "out" && !x.deliveredAt
        ? { ...x, deliveredAt: at, sentAt: x.sentAt || at, updatedAt: at }
        : x,
    ),
  };
}

// ---------- Incoming ----------

/** Whether an envelope was already received (by any post of the session). */
export const received = (ops: Pick<Ops, "exchanges">, id: string) =>
  ops.exchanges.some((x) => x.id === id && x.direction === "in");

/**
 * Records created by an envelope from the other command post: a message in
 * the Messages inbox, a diffusion to acknowledge (and its order), or a
 * receipt for one of our diffusions. Idempotent: an envelope already
 * received changes nothing.
 */
export function applyEnvelope(
  ops: Ops,
  raw: unknown,
  liaison: Liaison,
  context: { author: string; now: string; messageNumber: number; node: string },
): { ops: Ops; created: string[] } {
  const parsed = envelopeSchema.safeParse(raw);
  if (!parsed.success) return { ops, created: [] };
  const env = parsed.data;
  if (received(ops, env.id)) return { ops, created: [] };
  const { now } = context;
  const stamp = { createdAt: now, updatedAt: now, by: `${env.from} · liaison` };
  const created: string[] = [];
  let next: Ops = { ...ops };
  let target = "";
  let title = "";
  const inboxMessage = (id: string, m: NonNullable<Envelope["message"]>) => {
    if (next.messages.some((x) => x.id === id)) return;
    next.messages = [
      ...next.messages,
      messageSchema.parse({
        id,
        ...stamp,
        receivedAt: now,
        from: [env.from, env.author].filter(Boolean).join(" · "),
        to: liaison.self,
        via: "Liaison",
        priority: m.priority,
        category: m.category,
        subject: m.subject,
        body: m.body,
        location: "",
        coordinates: "",
        replyNeeded: false,
        replyBy: "",
        status: "Nouveau",
        entryId: "",
        handledBy: "",
        notes: `Reçu par la liaison avec ${liaison.name}.`,
        tags: ["liaison"],
        number: context.messageNumber,
        node: context.node,
      }),
    ];
    created.push(`message:${id}`);
  };
  if (env.kind === "message" && env.message) {
    inboxMessage(env.id, env.message);
    target = `message:${env.id}`;
    title = env.message.subject || env.message.body.slice(0, 120);
  } else if (env.kind === "broadcast" && env.broadcast) {
    const b = env.broadcast;
    title = b.title;
    target = `broadcast:${b.id}`;
    if (env.order && !next.orders.some((o) => o.id === env.order!.id)) {
      next.orders = [
        ...next.orders,
        orderSchema.parse({
          ...env.order,
          ...stamp,
          createdAt: env.order.createdAt,
          source: env.from,
          broadcastId: b.id,
          entryId: "",
          distribution: [liaison.self],
        }),
      ];
      created.push(`order:${env.order.id}`);
    }
    if (!next.broadcasts.some((x) => x.id === b.id)) {
      next.broadcasts = [
        ...next.broadcasts,
        broadcastSchema.parse({
          ...b,
          ...stamp,
          createdAt: b.createdAt,
          recipients: [liaison.self],
          sender: [env.from, b.sender].filter(Boolean).join(" · "),
          source: env.from,
          target: env.order ? `order:${env.order.id}` : "",
        }),
      ];
      created.push(`broadcast:${b.id}`);
    }
    inboxMessage(b.id, {
      subject: `${b.kind || "Diffusion"} : ${b.title}`,
      body: [
        b.body,
        env.order &&
          `Ordre ${env.from} n° ${env.order.number} · ${env.order.title}`,
        b.ack !== "Aucun" && `Accusé demandé : « ${b.ack} ».`,
      ]
        .filter(Boolean)
        .join("\n\n"),
      priority: b.priority,
      category: env.order ? "Ordre / mission" : "Information",
    });
  } else if (env.kind === "ack" && env.ack) {
    const a = env.ack;
    title = `${a.kind} · ${liaison.name}`;
    target = `ack:${a.id}`;
    const ours = next.broadcasts.find((b) => b.id === a.broadcastId);
    if (ours && !next.acks.some((x) => x.id === a.id)) {
      // Their name for themselves is our recipient name for them.
      const recipient =
        ours.recipients.find((r) => norm(r) === norm(liaison.name)) ??
        liaison.name;
      next.acks = [
        ...next.acks,
        ackSchema.parse({
          ...a,
          ...stamp,
          createdAt: a.createdAt,
          recipient,
          source: env.from,
        }),
      ];
      created.push(`ack:${a.id}`);
    }
  } else return { ops, created: [] };
  next.exchanges = [
    ...next.exchanges,
    exchangeSchema.parse({
      id: env.id,
      ...stamp,
      liaisonId: liaison.id,
      direction: "in",
      kind: env.kind,
      title: title.slice(0, 300),
      target,
      payload: "",
      sentAt: env.at,
      deliveredAt: now,
    }),
  ];
  return { ops: next, created };
}

/** Last exchange with a liaison, both ways (ISO time, "" when none). */
export function lastExchange(ops: Pick<Ops, "exchanges">, liaisonId: string) {
  let last = "";
  for (const x of ops.exchanges)
    if (x.liaisonId === liaisonId) {
      const t = x.direction === "in" ? x.createdAt : x.deliveredAt;
      if (t > last) last = t;
    }
  return last;
}
