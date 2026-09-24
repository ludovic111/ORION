import { useEffect, useRef, useState } from "react";

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

/** Number that counts up to its value. */
export function CountUp({
  value,
  duration = 900,
}: {
  value: number;
  duration?: number;
}) {
  const [shown, setShown] = useState(value);
  const from = useRef(0);
  useEffect(() => {
    if (document.documentElement.dataset.motion === "reduced") {
      setShown(value);
      from.current = value;
      return;
    }
    const start = performance.now();
    const origin = from.current;
    let frame = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 4);
      setShown(Math.round(origin + (value - origin) * eased));
      if (p < 1) frame = requestAnimationFrame(tick);
      else from.current = value;
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, duration]);
  return <span className="num-count">{shown}</span>;
}
