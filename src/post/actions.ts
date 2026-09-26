import {
  defaultListValues,
  journalLang,
  upsert,
  type Ops,
} from "../../shared/ops";
import type { Ack, Broadcast } from "../../shared/conduct";
import { acksFor, type Identity } from "../../shared/diffusion";

// Writes of the conduct features, as changes of ops (for updateOps).

/**
 * A standard value of a référentiel ("Information", "Ordre d’engagement"…)
 * in the language of the journal: the value at the same place in that
 * language's default list. Any other value is returned as it is (data).
 */
export function journalDefault(
  ops: Pick<Ops, "settings">,
  list: string,
  fr: string,
): string {
  const i = defaultListValues(list, "fr").indexOf(fr);
  return (i >= 0 && defaultListValues(list, journalLang(ops))[i]) || fr;
}

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
