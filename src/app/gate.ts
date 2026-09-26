/**
 * The write gate: every change to a journal (entries, module records,
 * radio, properties) asks it first. Reading a past version (time machine)
 * or a closed journal is read only; the operator is told why, never left
 * with a button that silently does nothing. Registers (exports, frozen
 * points, presentations, forecasts) are not changes of the situation and
 * skip the gate.
 */
import { t } from "./i18n.ts";

// The constants keep the French text (key of the dictionary, asserted by
// the tests); writeRefusal returns it in the language of the post.
export const PAST_READ_ONLY =
  "Lecture seule : vous consultez le passé. Revenez au direct pour écrire.";
export const CLOSED_READ_ONLY = "Journal clôturé — rouvrez-le pour écrire.";

export type GateState = {
  /** Closing time of the live journal ("" or undefined: open). */
  closedAt?: string | null;
  /** Moment shown by the time machine; null: live. */
  viewAt: number | null;
};

/** Why writing is refused now, or null when it is allowed. */
export function writeRefusal(
  state: GateState,
  { allowClosed = false }: { allowClosed?: boolean } = {},
): string | null {
  if (state.viewAt !== null) return t(PAST_READ_ONLY);
  if (state.closedAt && !allowClosed) return t(CLOSED_READ_ONLY);
  return null;
}

/** Thrown by a refused write; its message is meant for the operator. */
export class ReadOnlyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ReadOnlyError";
  }
}
