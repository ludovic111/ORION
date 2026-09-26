import { upsert, type Ops } from "../../shared/ops";
import type { Ack, Broadcast } from "../../shared/conduct";
import { acksFor, type Identity } from "../../shared/diffusion";

// Writes of the conduct features, as changes of ops (for updateOps).

export type BroadcastDraft = Pick<
  Broadcast,
  | "title"
  | "body"
  | "kind"
  | "priority"
  | "target"
  | "recipients"
  | "ack"
  | "deadline"
>;

export const senderOf = (me: Identity) =>
  [me.role, me.name].filter(Boolean).join(" · ");

/** A new diffusion, sent now. */
export function addBroadcast(
  ops: Ops,
  draft: BroadcastDraft,
  me: Identity,
  id: string = crypto.randomUUID(),
): Ops {
  return upsert(
    ops,
    "broadcasts",
    {
      ...draft,
      id,
      sentAt: new Date().toISOString(),
      sender: senderOf(me),
      closedAt: "",
      source: "",
    },
    me.name,
  );
}

/** This post acknowledges a diffusion for every recipient it answers for. */
export function acknowledge(
  ops: Ops,
  broadcast: Broadcast,
  me: Identity,
  kind: Ack["kind"],
): Ops {
  let next = ops;
  for (const a of acksFor(
    broadcast,
    ops.acks,
    me,
    kind,
    new Date().toISOString(),
  ))
    next = upsert(next, "acks", a, me.name);
  return next;
}
