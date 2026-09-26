// Ephemeral messages: small values that live only while the posts are
// connected (positions of the teams…). They travel through the relay like
// the synchronisation messages, encrypted with the session key, but they are
// never merged into a journal, never stored, never in the history, the
// archives or the digests: a post that was not connected never sees them.
//
// Posts of the same protocol that do not know a kind (or the ephemeral
// messages at all) ignore them: no protocol change is needed to add a kind.

export const EPHEMERAL = "eph";
/** Kind of an ephemeral message: short, lowercase. */
export const KIND = /^[a-z][a-z0-9.-]{0,31}$/;
/** Largest value of an ephemeral message (JSON, characters). */
export const MAX_EPHEMERAL = 4096;

export type EphemeralWire = {
  type: typeof EPHEMERAL;
  v: number;
  /** Id of the sending post (its page), as in the other messages. */
  peer: string;
  /** Operator of the sending post. */
  name: string;
  kind: string;
  data: unknown;
};
export type Ephemeral = {
  kind: string;
  data: unknown;
  peer: string;
  name: string;
};

/** The message to send; throws when the kind or the size is invalid. */
export function ephemeralWire(
  base: { v: number; peer: string; name: string },
  kind: string,
  data: unknown,
): EphemeralWire {
  if (!KIND.test(kind)) throw new Error(`Type de message éphémère invalide.`);
  const size = JSON.stringify(data ?? null).length;
  if (size > MAX_EPHEMERAL)
    throw new Error("Message éphémère trop volumineux.");
  return {
    type: EPHEMERAL,
    v: base.v,
    peer: base.peer,
    name: base.name,
    kind,
    data,
  };
}

export const isEphemeral = (wire: unknown): boolean =>
  !!wire &&
  typeof wire === "object" &&
  (wire as { type?: unknown }).type === EPHEMERAL;

/** A received ephemeral message, checked; null when malformed. */
export function readEphemeral(wire: unknown): Ephemeral | null {
  if (!isEphemeral(wire)) return null;
  const w = wire as Partial<EphemeralWire>;
  if (typeof w.kind !== "string" || !KIND.test(w.kind)) return null;
  if (typeof w.peer !== "string" || !w.peer || w.peer.length > 64) return null;
  let size: number;
  try {
    size = JSON.stringify(w.data ?? null).length;
  } catch {
    return null;
  }
  if (size > MAX_EPHEMERAL) return null;
  return {
    kind: w.kind,
    data: w.data,
    peer: w.peer,
    name: typeof w.name === "string" ? w.name.slice(0, 120) : "",
  };
}
