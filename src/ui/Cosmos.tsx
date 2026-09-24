import { useEffect, useRef } from "react";
import { ORION_LINES, ORION_STARS } from "./Mark";

// Background: a slowly drifting star field with the Orion constellation, a
// few shooting stars and the pointer's gentle parallax. Drawn on a canvas,
// paused when the tab is hidden, still when motion is reduced.
export function Cosmos() {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const el = canvas.current;
    const ctx = el?.getContext("2d");
    if (!el || !ctx) return;
    const reduced = () =>
      document.documentElement.dataset.motion === "reduced" ||
      matchMedia("(prefers-reduced-motion: reduce)").matches;
    const light = () => document.documentElement.dataset.theme === "light";
    let w = 0,
      h = 0,
      dpr = 1,
      frame = 0,
      t = 0;
    let stars: { x: number; y: number; z: number; r: number; p: number }[] = [];
    const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    let meteor: {
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
    } | null = null;
    function resize() {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      w = el!.clientWidth;
      h = el!.clientHeight;
      el!.width = w * dpr;
      el!.height = h * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round(Math.min(420, (w * h) / 5200));
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        z: Math.random() * 0.8 + 0.2,
        r: Math.random() * 1.1 + 0.2,
        p: Math.random() * Math.PI * 2,
      }));
    }
    function draw() {
      t += 1;
      pointer.x += (pointer.tx - pointer.x) * 0.04;
      pointer.y += (pointer.ty - pointer.y) * 0.04;
      ctx!.clearRect(0, 0, w, h);
      const ink = light() ? "40, 44, 110" : "220, 226, 255";
      for (const s of stars) {
        const twinkle = 0.55 + 0.45 * Math.sin(t * 0.02 * s.z + s.p);
        const x = (s.x + pointer.x * 14 * s.z + t * 0.02 * s.z) % w;
        const y = s.y + pointer.y * 10 * s.z;
        ctx!.fillStyle = `rgba(${ink}, ${(light() ? 0.25 : 0.75) * twinkle * s.z})`;
        ctx!.beginPath();
        ctx!.arc(x < 0 ? x + w : x, y, s.r * s.z, 0, Math.PI * 2);
        ctx!.fill();
      }
      // Orion, top right, large and faint.
      const size = Math.min(w, h) * 0.55;
      const ox = w - size * 0.95 + pointer.x * 22;
      const oy = h * 0.06 + pointer.y * 16;
      const at = (i: number) => ({
        x: ox + (ORION_STARS[i].x / 32) * size,
        y: oy + (ORION_STARS[i].y / 32) * size,
      });
      ctx!.strokeStyle = light()
        ? "rgba(92, 69, 255, 0.14)"
        : "rgba(157, 170, 255, 0.16)";
      ctx!.lineWidth = 1;
      ctx!.setLineDash([2, 6]);
      ctx!.beginPath();
      for (const [a, b] of ORION_LINES) {
        const p = at(a),
          q = at(b);
        ctx!.moveTo(p.x, p.y);
        ctx!.lineTo(q.x, q.y);
      }
      ctx!.stroke();
      ctx!.setLineDash([]);
      ORION_STARS.forEach((s, i) => {
        const p = at(i);
        const pulse = 0.8 + 0.2 * Math.sin(t * 0.03 + i);
        const color =
          i === 0
            ? "255, 179, 92"
            : i === 7
              ? "157, 193, 255"
              : light()
                ? "92, 69, 255"
                : "230, 234, 255";
        const glow = ctx!.createRadialGradient(p.x, p.y, 0, p.x, p.y, s.r * 9);
        glow.addColorStop(0, `rgba(${color}, ${0.55 * pulse})`);
        glow.addColorStop(1, `rgba(${color}, 0)`);
        ctx!.fillStyle = glow;
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, s.r * 9, 0, Math.PI * 2);
        ctx!.fill();
        ctx!.fillStyle = `rgba(${color}, ${0.95 * pulse})`;
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, s.r * 1.1, 0, Math.PI * 2);
        ctx!.fill();
      });
      if (!meteor && Math.random() < 0.0025 && !light())
        meteor = {
          x: Math.random() * w * 0.8,
          y: Math.random() * h * 0.3,
          vx: 7 + Math.random() * 4,
          vy: 2.5 + Math.random() * 2,
          life: 1,
        };
      if (meteor) {
        const m = meteor;
        const grad = ctx!.createLinearGradient(
          m.x,
          m.y,
          m.x - m.vx * 14,
          m.y - m.vy * 14,
        );
        grad.addColorStop(0, `rgba(255,255,255,${m.life})`);
        grad.addColorStop(1, "rgba(139,123,255,0)");
        ctx!.strokeStyle = grad;
        ctx!.lineWidth = 1.5;
        ctx!.beginPath();
        ctx!.moveTo(m.x, m.y);
        ctx!.lineTo(m.x - m.vx * 14, m.y - m.vy * 14);
        ctx!.stroke();
        m.x += m.vx;
        m.y += m.vy;
        m.life -= 0.012;
        if (m.life <= 0) meteor = null;
      }
      if (!reduced() && !document.hidden) frame = requestAnimationFrame(draw);
      else frame = 0;
    }
    const move = (e: PointerEvent) => {
      pointer.tx = e.clientX / window.innerWidth - 0.5;
      pointer.ty = e.clientY / window.innerHeight - 0.5;
    };
    const wake = () => {
      if (!frame && !document.hidden) frame = requestAnimationFrame(draw);
    };
    resize();
    draw();
    const observer = new ResizeObserver(() => {
      resize();
      if (!frame) draw();
    });
    observer.observe(el);
    window.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("visibilitychange", wake);
    const themeWatch = new MutationObserver(() => {
      if (!frame) draw();
      wake();
    });
    themeWatch.observe(document.documentElement, { attributes: true });
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      themeWatch.disconnect();
      window.removeEventListener("pointermove", move);
      document.removeEventListener("visibilitychange", wake);
    };
  }, []);
  return (
    <div className="cosmos" aria-hidden="true">
      <div className="aurora">
        <span />
        <span />
        <span />
      </div>
      <canvas ref={canvas} />
    </div>
  );
}
