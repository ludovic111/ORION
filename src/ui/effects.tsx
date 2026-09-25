// The editorial design is quiet: no pointer light, no sparks, no decoding
// titles. The hooks and components keep their signatures so the screens
// stay unchanged.

/** Formerly a pointer light on .spot cards; the design keeps cards still. */
export function useSpotlight() {}

/** Formerly a burst of light on clicks; nothing is drawn any more. */
export function ClickSparks() {
  return null;
}

/** A title, shown as is. */
export function DecryptText({ text }: { text: string; speed?: number }) {
  return <span className="decrypt">{text}</span>;
}

/**
 * A count, shown as is. Numbers no longer roll up from zero: on a
 * command post the real figure must be readable at first glance.
 */
export function CountUp({ value }: { value: number; duration?: number }) {
  return <span className="num-count">{value}</span>;
}
