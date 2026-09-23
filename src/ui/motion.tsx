import { useLayoutEffect, useRef } from "react";

/** Sliding indicator under the pressed / current child (transitions.dev "Tabs sliding"). */
export function useSlider<T extends HTMLElement>(active: unknown) {
  const ref = useRef<T>(null);
  const pill = useRef<HTMLSpanElement>(null);
  const placed = useRef(false);
  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;
    const place = (animate: boolean) => {
      const p = pill.current;
      const target = root.querySelector<HTMLElement>(
        '[aria-pressed="true"],[aria-current="page"],[aria-selected="true"]',
      );
      if (!p) return;
      if (!target) {
        p.style.width = "0";
        return;
      }
      if (!animate) p.style.transition = "none";
      p.style.transform = `translateX(${target.offsetLeft}px)`;
      p.style.width = `${target.offsetWidth}px`;
      if (!animate) {
        void p.offsetWidth;
        p.style.transition = "";
      }
    };
    place(placed.current);
    placed.current = true;
    const observer = new ResizeObserver(() => place(false));
    observer.observe(root);
    return () => observer.disconnect();
  }, [active]);
  return { ref, pill };
}

/** Value that pops in when it changes (transitions.dev "Number pop-in"). */
export function Num({ value }: { value: number | string }) {
  return (
    <span className="num" key={String(value)}>
      {value}
    </span>
  );
}
