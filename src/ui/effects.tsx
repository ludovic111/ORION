import { useEffect, useRef, useState } from "react";

/** Cards with the .spot class follow the pointer with a soft light. */
export function useSpotlight() {
  useEffect(() => {
    let last: HTMLElement | null = null;
    const move = (e: PointerEvent) => {
      const target = (e.target as HTMLElement | null)?.closest?.(".spot") as HTMLElement | null;
      if (last && last !== target) {
        last.style.removeProperty("--mx");
        last.style.removeProperty("--my");
      }
      last = target;
      if (!target) return;
      const box = target.getBoundingClientRect();
      target.style.setProperty("--mx", `${e.clientX - box.left}px`);
      target.style.setProperty("--my", `${e.clientY - box.top}px`);
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, []);
}

/** Small burst of light on every click of a primary button. */
export function ClickSparks() {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const el = canvas.current;
    const ctx = el?.getContext("2d");
    if (!el || !ctx) return;
    type Spark = { x: number; y: number; a: number; v: number; life: number; hue: number };
    let sparks: Spark[] = [];
    let frame = 0;
    const size = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      el.width = window.innerWidth * dpr;
      el.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    size();
    const tick = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      sparks = sparks.filter((s) => s.life > 0);
      for (const s of sparks) {
        const d = (1 - s.life) * s.v;
        const x = s.x + Math.cos(s.a) * d;
        const y = s.y + Math.sin(s.a) * d;
        ctx.strokeStyle = `hsla(${s.hue}, 95%, 72%, ${s.life})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.cos(s.a) * 7 * s.life, y + Math.sin(s.a) * 7 * s.life);
        ctx.stroke();
        s.life -= 0.045;
      }
      frame = sparks.length ? requestAnimationFrame(tick) : 0;
    };
    const click = (e: MouseEvent) => {
      if (document.documentElement.dataset.motion === "reduced") return;
      const target = (e.target as HTMLElement | null)?.closest?.("button.primary, .spark");
      if (!target || e.detail === 0) return;
      const hues = [190, 250, 320];
      for (let i = 0; i < 10; i++)
        sparks.push({
          x: e.clientX,
          y: e.clientY,
          a: (Math.PI * 2 * i) / 10 + Math.random() * 0.3,
          v: 26 + Math.random() * 12,
          life: 1,
          hue: hues[i % 3],
        });
      if (!frame) frame = requestAnimationFrame(tick);
    };
    window.addEventListener("click", click, true);
    window.addEventListener("resize", size);
    return () => {
      window.removeEventListener("click", click, true);
      window.removeEventListener("resize", size);
      cancelAnimationFrame(frame);
    };
  }, []);
  return <canvas ref={canvas} className="sparks" aria-hidden="true" />;
}

const GLYPHS = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#*+<>/";
/** Title that decodes itself when it appears. */
export function DecryptText({ text, speed = 28 }: { text: string; speed?: number }) {
  const [shown, setShown] = useState(text);
  useEffect(() => {
    if (document.documentElement.dataset.motion === "reduced") {
      setShown(text);
      return;
    }
    let step = 0;
    const total = text.length;
    const timer = setInterval(() => {
      step += 1;
      const done = Math.floor(step / 1.6);
      setShown(
        text
          .split("")
          .map((c, i) =>
            i < done || c === " " ? c : GLYPHS[Math.floor(Math.random() * GLYPHS.length)],
          )
          .join(""),
      );
      if (done >= total) clearInterval(timer);
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed]);
  return (
    <span className="decrypt" aria-label={text}>
      <span aria-hidden="true">{shown}</span>
    </span>
  );
}

/** Number that counts up to its value. */
export function CountUp({ value, duration = 900 }: { value: number; duration?: number }) {
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
