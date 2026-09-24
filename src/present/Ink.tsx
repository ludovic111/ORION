import { useEffect, useRef } from "react";
import type { InkStroke } from "./layout";

// Freehand annotations over the slide (pen, highlighter, eraser) and the
// laser pointer with its fading trail. Pointer events: mouse, finger and
// stylus alike; the pressure of a stylus widens the line. Coordinates are
// those of the 1920 × 1080 stage, whatever its size on screen.

export type Tool = "none" | "pen" | "marker" | "laser" | "eraser";
export const INK_COLORS = [
  { hex: "FF3B5C", label: "Rouge" },
  { hex: "FFB020", label: "Jaune" },
  { hex: "22D39A", label: "Vert" },
  { hex: "2EA8FF", label: "Bleu" },
  { hex: "FFFFFF", label: "Blanc" },
] as const;
const W = 1920;
const H = 1080;

const widthAt = (s: InkStroke, p: number) =>
  s.tool === "marker" ? s.width : s.width * (0.35 + p * 1.3);

/** Draw strokes on a 1920 × 1080 context. */
export function drawStrokes(
  ctx: CanvasRenderingContext2D,
  strokes: InkStroke[],
) {
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (const s of strokes) {
    const pts = s.points;
    if (!pts.length) continue;
    ctx.strokeStyle = `#${s.color}`;
    ctx.fillStyle = `#${s.color}`;
    if (pts.length === 1) {
      ctx.globalAlpha = s.tool === "marker" ? 0.35 : 1;
      ctx.beginPath();
      ctx.arc(pts[0][0], pts[0][1], widthAt(s, pts[0][2]) / 2, 0, Math.PI * 2);
      ctx.fill();
      continue;
    }
    if (s.tool === "marker") {
      // One path, one opacity: the overlaps do not darken.
      ctx.globalAlpha = 0.35;
      ctx.lineWidth = s.width;
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length - 1; i++) {
        const mx = (pts[i][0] + pts[i + 1][0]) / 2;
        const my = (pts[i][1] + pts[i + 1][1]) / 2;
        ctx.quadraticCurveTo(pts[i][0], pts[i][1], mx, my);
      }
      ctx.lineTo(pts[pts.length - 1][0], pts[pts.length - 1][1]);
      ctx.stroke();
      continue;
    }
    ctx.globalAlpha = 1;
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1];
      const b = pts[i];
      const prev = pts[i - 2] ?? a;
      ctx.lineWidth = widthAt(s, (a[2] + b[2]) / 2);
      ctx.beginPath();
      ctx.moveTo((prev[0] + a[0]) / 2, (prev[1] + a[1]) / 2);
      ctx.quadraticCurveTo(a[0], a[1], (a[0] + b[0]) / 2, (a[1] + b[1]) / 2);
      if (i === pts.length - 1) ctx.lineTo(b[0], b[1]);
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
}

function near(s: InkStroke, x: number, y: number, r: number) {
  return s.points.some(
    ([px, py]) => (px - x) ** 2 + (py - y) ** 2 < (r + s.width / 2) ** 2,
  );
}

export function InkLayer({
  tool,
  color,
  strokes,
  onAdd,
  onRemove,
}: {
  tool: Tool;
  color: string;
  strokes: InkStroke[];
  onAdd: (stroke: InkStroke) => void;
  onRemove: (index: number) => void;
}) {
  const ink = useRef<HTMLCanvasElement>(null);
  const laser = useRef<HTMLCanvasElement>(null);
  const drawing = useRef<InkStroke | null>(null);
  const trail = useRef<{ x: number; y: number; t: number }[]>([]);
  const frame = useRef(0);
  const strokesRef = useRef(strokes);
  strokesRef.current = strokes;

  const redraw = () => {
    const c = ink.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    ctx.setTransform(c.width / W, 0, 0, c.height / H, 0, 0);
    ctx.clearRect(0, 0, W, H);
    drawStrokes(
      ctx,
      drawing.current
        ? [...strokesRef.current, drawing.current]
        : strokesRef.current,
    );
  };

  useEffect(() => {
    const c = ink.current;
    if (!c) return;
    const k = Math.min(
      2,
      Math.max(
        1,
        (window.devicePixelRatio || 1) * (c.getBoundingClientRect().width / W),
      ),
    );
    c.width = Math.round(W * k);
    c.height = Math.round(H * k);
    redraw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [strokes]);

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  const point = (e: React.PointerEvent) => {
    const box = e.currentTarget.getBoundingClientRect();
    const pressure =
      e.pointerType === "pen" && e.pressure > 0 ? e.pressure : 0.5;
    return [
      ((e.clientX - box.left) / box.width) * W,
      ((e.clientY - box.top) / box.height) * H,
      pressure,
    ] as [number, number, number];
  };

  const animateLaser = () => {
    const c = laser.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    const now = performance.now();
    trail.current = trail.current.filter((p) => now - p.t < 450);
    ctx.clearRect(0, 0, W, H);
    const pts = trail.current;
    for (let i = 1; i < pts.length; i++) {
      const age = (now - pts[i].t) / 450;
      ctx.strokeStyle = `rgba(255, 106, 31, ${0.55 * (1 - age)})`;
      ctx.lineWidth = 14 * (1 - age) + 2;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(pts[i - 1].x, pts[i - 1].y);
      ctx.lineTo(pts[i].x, pts[i].y);
      ctx.stroke();
    }
    const last = pts[pts.length - 1];
    if (last && now - last.t < 1500) {
      const glow = ctx.createRadialGradient(
        last.x,
        last.y,
        0,
        last.x,
        last.y,
        34,
      );
      glow.addColorStop(0, "rgba(255, 255, 255, 1)");
      glow.addColorStop(0.25, "rgba(255, 106, 31, 1)");
      glow.addColorStop(1, "rgba(255, 106, 31, 0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(last.x, last.y, 34, 0, Math.PI * 2);
      ctx.fill();
    }
    frame.current = pts.length ? requestAnimationFrame(animateLaser) : 0;
  };

  const down = (e: React.PointerEvent) => {
    if (tool === "none" || tool === "laser") return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Pointer already gone: the stroke still starts.
    }
    const p = point(e);
    if (tool === "eraser") {
      erase(p[0], p[1]);
      return;
    }
    drawing.current = {
      tool,
      color,
      width: tool === "marker" ? 34 : 7,
      points: [p],
    };
    redraw();
  };
  const erase = (x: number, y: number) => {
    const list = strokesRef.current;
    for (let i = list.length - 1; i >= 0; i--)
      if (near(list[i], x, y, 18)) {
        onRemove(i);
        return;
      }
  };
  const move = (e: React.PointerEvent) => {
    if (tool === "laser") {
      const [x, y] = point(e);
      trail.current.push({ x, y, t: performance.now() });
      if (!frame.current) frame.current = requestAnimationFrame(animateLaser);
      return;
    }
    if (tool === "eraser" && e.buttons) {
      const [x, y] = point(e);
      erase(x, y);
      return;
    }
    const s = drawing.current;
    if (!s) return;
    // Coalesced events keep a fast stylus stroke smooth.
    const events = e.nativeEvent.getCoalescedEvents?.() ?? [e.nativeEvent];
    const box = e.currentTarget.getBoundingClientRect();
    for (const ev of events.length ? events : [e.nativeEvent]) {
      const pressure =
        ev.pointerType === "pen" && ev.pressure > 0 ? ev.pressure : 0.5;
      const x = ((ev.clientX - box.left) / box.width) * W;
      const y = ((ev.clientY - box.top) / box.height) * H;
      const last = s.points[s.points.length - 1];
      if ((last[0] - x) ** 2 + (last[1] - y) ** 2 < 4) continue;
      s.points.push([
        Math.round(x * 10) / 10,
        Math.round(y * 10) / 10,
        Math.round(pressure * 100) / 100,
      ]);
    }
    redraw();
  };
  const up = () => {
    const s = drawing.current;
    drawing.current = null;
    if (s) onAdd(s);
  };

  return (
    <>
      <canvas ref={ink} className="pm-ink" aria-hidden />
      <canvas
        ref={laser}
        className={`pm-ink-input tool-${tool}`}
        width={W}
        height={H}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        onPointerLeave={() => tool === "laser" || up()}
        aria-label={tool === "none" ? undefined : "Zone d’annotation"}
      />
    </>
  );
}
