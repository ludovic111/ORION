import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
  type ForceLink,
  type ForceManyBody,
  type Simulation,
  type SimulationNodeDatum,
} from "d3-force";

// Force-directed "neural" graph drawn on a HiDPI canvas. The simulation is
// ticked from the render loop (one loop for layout, particles and drawing),
// node positions are kept by ref across data changes.

export type NodeSpec = {
  ref: string;
  hue: number;
  title: string;
  tone: string;
  degree: number;
  /** Index of the kind cluster the node is pulled towards. */
  cluster: number;
};
export type LinkSpec = {
  a: string;
  b: string;
  explicit: boolean;
  label: string;
};

type Node = SimulationNodeDatum &
  NodeSpec & {
    x: number;
    y: number;
    r: number;
    fire: number;
    phase: number;
    adj: { node: Node; link: Link }[];
  };
type Link = {
  source: Node;
  target: Node;
  explicit: boolean;
  label: string;
  key: string;
};
type Pulse = {
  link: Link;
  from: Node;
  to: Node;
  t: number;
  speed: number;
  level: 0 | 1 | 2;
};
type View = { k: number; x: number; y: number };
type Theme = {
  dark: boolean;
  text: string;
  /** Card surface under the canvas: halo of the labels. */
  bg: string;
  crit: string;
  accent: string;
  /** Ink of the links, as "r, g, b". */
  accentRgb: string;
  /** Punctuation of emphasis: search matches. */
  ember: string;
  /** Muting of the kind hues (saturation and lightness factors). */
  kindS: number;
  kindL: number;
  font: string;
};

export type EngineEvents = {
  hover: (ref: string | null, x: number, y: number) => void;
  select: (ref: string | null) => void;
  open: (ref: string) => void;
};

const MIN_K = 0.04;
const MAX_K = 6;
const radius = (degree: number) => Math.min(24, 4 + 2.3 * Math.sqrt(degree));
const clip = (s: string, n = 30) =>
  s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s;

export class NetworkEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private events: EngineEvents;
  private w = 0;
  private h = 0;
  private dpr = 1;
  private nodes: Node[] = [];
  private links: Link[] = [];
  private byRef = new Map<string, Node>();
  private memory = new Map<string, { x: number; y: number }>();
  private anchors: { x: number; y: number }[] = [];
  private labelled = new Set<Node>();
  private sim: Simulation<Node, Link>;
  private view: View = { k: 1, x: 0, y: 0 };
  private goal: View | null = null;
  private autoFit = true;
  private hovered: Node | null = null;
  private selected: Node | null = null;
  private matches = new Set<string>();
  private levels = new Map<Node, number>();
  private pulses: Pulse[] = [];
  private ambient: Pulse[] = [];
  private raf = 0;
  private last = 0;
  private lastWave = 0;
  private lastDraw = 0;
  private lastInput = 0;
  private fitTick = 0;
  private dirty = true;
  private reduced = false;
  private destroyed = false;
  private theme: Theme;
  private glow = new Map<number, HTMLCanvasElement>();
  private spark = new Map<number, HTMLCanvasElement>();
  private pointers = new Map<number, { x: number; y: number }>();
  private gesture:
    | { mode: "pan"; x: number; y: number; moved: boolean }
    | { mode: "drag"; node: Node; x: number; y: number; moved: boolean }
    | { mode: "pinch"; distance: number; k: number }
    | null = null;
  private observers: { disconnect(): void }[] = [];

  constructor(canvas: HTMLCanvasElement, events: EngineEvents) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.events = events;
    this.theme = this.readTheme();
    this.reduced = document.documentElement.dataset.motion === "reduced";
    this.sim = forceSimulation<Node, Link>([])
      .stop()
      .velocityDecay(0.36)
      .force(
        "link",
        forceLink<Node, Link>([]).distance((l) => 24 + l.source.r + l.target.r),
      )
      .force(
        "charge",
        forceManyBody<Node>()
          .strength((n) => -26 - n.r * 5)
          .distanceMax(520)
          .theta(0.9),
      )
      .force("collide", forceCollide<Node>((n) => n.r + 2.5).iterations(1))
      .force("center", forceCenter(0, 0).strength(0.04));
    this.setClusterForces();

    canvas.addEventListener("pointerdown", this.onDown);
    canvas.addEventListener("pointermove", this.onMove);
    canvas.addEventListener("pointerup", this.onUp);
    canvas.addEventListener("pointercancel", this.onUp);
    canvas.addEventListener("pointerleave", this.onLeave);
    canvas.addEventListener("dblclick", this.onDouble);
    canvas.addEventListener("wheel", this.onWheel, { passive: false });
    canvas.addEventListener("keydown", this.onKey);
    document.addEventListener("visibilitychange", this.onVisibility);

    const resize = new ResizeObserver(() => this.resize());
    resize.observe(canvas.parentElement ?? canvas);
    const attributes = new MutationObserver(() => {
      this.theme = this.readTheme();
      this.reduced = document.documentElement.dataset.motion === "reduced";
      this.glow.clear();
      this.spark.clear();
      if (this.reduced) {
        this.pulses = [];
        this.ambient = [];
      }
      this.wake();
    });
    attributes.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme", "data-motion"],
    });
    this.observers.push(resize, attributes);
    this.resize();
  }

  destroy() {
    this.destroyed = true;
    cancelAnimationFrame(this.raf);
    this.sim.stop();
    this.observers.forEach((o) => o.disconnect());
    const c = this.canvas;
    c.removeEventListener("pointerdown", this.onDown);
    c.removeEventListener("pointermove", this.onMove);
    c.removeEventListener("pointerup", this.onUp);
    c.removeEventListener("pointercancel", this.onUp);
    c.removeEventListener("pointerleave", this.onLeave);
    c.removeEventListener("dblclick", this.onDouble);
    c.removeEventListener("wheel", this.onWheel);
    c.removeEventListener("keydown", this.onKey);
    document.removeEventListener("visibilitychange", this.onVisibility);
  }

  // ---------- Data ----------

  setData(specs: NodeSpec[], linkSpecs: LinkSpec[]) {
    const first = this.nodes.length === 0;
    const previous = this.byRef;
    const next = new Map<string, Node>();
    let changed = specs.length !== previous.size;
    const clusters = Math.max(1, ...specs.map((s) => s.cluster + 1));
    const spread = 70 + 16 * Math.sqrt(specs.length);
    this.anchors = Array.from({ length: clusters }, (_, i) => {
      if (clusters === 1) return { x: 0, y: 0 };
      const a = (Math.PI * 2 * i) / clusters - Math.PI / 2;
      return { x: Math.cos(a) * spread, y: Math.sin(a) * spread };
    });
    const fresh: Node[] = [];
    for (const spec of specs) {
      let node = previous.get(spec.ref);
      if (node) Object.assign(node, spec);
      else {
        changed = true;
        const kept = this.memory.get(spec.ref);
        node = {
          ...spec,
          x: kept?.x ?? NaN,
          y: kept?.y ?? NaN,
          r: 0,
          fire: 0,
          phase: Math.random(),
          adj: [],
        };
        if (!kept) fresh.push(node);
      }
      node.r = radius(spec.degree);
      node.adj = [];
      next.set(spec.ref, node);
    }
    for (const [ref, node] of previous)
      if (!next.has(ref)) this.memory.set(ref, { x: node.x, y: node.y });

    const oldKeys = new Set(this.links.map((l) => l.key));
    const links: Link[] = [];
    for (const spec of linkSpecs) {
      const source = next.get(spec.a);
      const target = next.get(spec.b);
      if (!source || !target) continue;
      const key =
        spec.a < spec.b ? `${spec.a}|${spec.b}` : `${spec.b}|${spec.a}`;
      if (!oldKeys.has(key)) changed = true;
      const link: Link = {
        source,
        target,
        explicit: spec.explicit,
        label: spec.label,
        key,
      };
      source.adj.push({ node: target, link });
      target.adj.push({ node: source, link });
      links.push(link);
    }
    if (links.length !== this.links.length) changed = true;

    // New nodes start next to a positioned neighbour, or in their cluster.
    for (const node of fresh) {
      const near = node.adj.find((a) => Number.isFinite(a.node.x))?.node;
      const base = near ?? this.anchors[node.cluster] ?? { x: 0, y: 0 };
      const reach = (near ? 20 : 20 + spread * 0.35) * Math.sqrt(Math.random());
      const angle = Math.random() * Math.PI * 2;
      node.x = base.x + Math.cos(angle) * reach;
      node.y = base.y + Math.sin(angle) * reach;
    }

    this.byRef = next;
    this.nodes = [...next.values()];
    this.links = links;
    this.sim.nodes(this.nodes);
    (this.sim.force("link") as ForceLink<Node, Link>).links(links);
    // Coarser Barnes-Hut approximation keeps big graphs fluid.
    (this.sim.force("charge") as ForceManyBody<Node>).theta(
      this.nodes.length > 1000 ? 1.25 : 0.9,
    );
    this.setClusterForces();
    if (this.hovered && !next.has(this.hovered.ref)) this.hovered = null;
    if (this.selected && !next.has(this.selected.ref)) this.selected = null;

    const ranked = [...this.nodes]
      .filter((n) => n.degree >= 3)
      .sort((a, b) => b.degree - a.degree)
      .slice(0, this.nodes.length > 400 ? 12 : 20);
    this.labelled = new Set(ranked);

    if (changed) {
      this.pulses = [];
      this.ambient = [];
      this.sim.alpha(first ? 1 : Math.max(this.sim.alpha(), 0.35));
    }
    if (first && this.nodes.length && this.w && this.autoFit)
      this.moveTo(this.fitView(this.nodes, 2.2), false);
    this.updateLevels();
    this.wake();
  }

  private setClusterForces() {
    const anchor = (n: Node) => this.anchors[n.cluster] ?? { x: 0, y: 0 };
    const pull = (n: Node) => (n.adj.length ? 0.03 : 0.09);
    this.sim
      .force("x", forceX<Node>((n) => anchor(n).x).strength(pull))
      .force("y", forceY<Node>((n) => anchor(n).y).strength(pull));
  }

  setSelected(ref: string | null) {
    this.selected = (ref && this.byRef.get(ref)) || null;
    this.updateLevels();
    this.lastWave = 0;
    this.wake();
  }

  setMatches(refs: string[]) {
    this.matches = new Set(refs);
    this.wake();
  }

  // ---------- View ----------

  fit(refs?: string[], animate = true) {
    const list = refs?.length
      ? refs.map((r) => this.byRef.get(r)).filter((n): n is Node => !!n)
      : this.nodes;
    if (!list.length || !this.w) return;
    this.autoFit = !refs?.length;
    const goal = this.fitView(list, refs?.length === 1 ? 1.6 : 2.2);
    this.moveTo(goal, animate);
  }

  centerOn(ref: string, shift = 0) {
    const node = this.byRef.get(ref);
    if (!node) return;
    this.autoFit = false;
    const k = Math.max(this.view.k, 1.1);
    this.moveTo(
      { k, x: (this.w - shift) / 2 - node.x * k, y: this.h / 2 - node.y * k },
      true,
    );
  }

  zoomBy(factor: number) {
    this.autoFit = false;
    const base = this.goal ?? this.view;
    const k = Math.min(MAX_K, Math.max(MIN_K, base.k * factor));
    const cx = this.w / 2;
    const cy = this.h / 2;
    this.moveTo(
      {
        k,
        x: cx - ((cx - base.x) / base.k) * k,
        y: cy - ((cy - base.y) / base.k) * k,
      },
      true,
    );
  }

  private fitView(list: Node[], maxK: number): View {
    let x0 = Infinity;
    let y0 = Infinity;
    let x1 = -Infinity;
    let y1 = -Infinity;
    for (const n of list) {
      x0 = Math.min(x0, n.x - n.r);
      y0 = Math.min(y0, n.y - n.r);
      x1 = Math.max(x1, n.x + n.r);
      y1 = Math.max(y1, n.y + n.r);
    }
    const pad = Math.min(60, this.w * 0.08);
    const k = Math.min(
      maxK,
      Math.max(
        MIN_K,
        Math.min(
          (this.w - pad * 2) / Math.max(1, x1 - x0),
          (this.h - pad * 2) / Math.max(1, y1 - y0),
        ),
      ),
    );
    return {
      k,
      x: this.w / 2 - ((x0 + x1) / 2) * k,
      y: this.h / 2 - ((y0 + y1) / 2) * k,
    };
  }

  private moveTo(goal: View, animate: boolean) {
    if (!animate || this.reduced) {
      this.view = goal;
      this.goal = null;
    } else this.goal = goal;
    this.wake();
  }

  private resize() {
    const box = (
      this.canvas.parentElement ?? this.canvas
    ).getBoundingClientRect();
    const w = Math.max(1, Math.round(box.width));
    const h = Math.max(1, Math.round(box.height));
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    if (w !== this.w || h !== this.h) {
      const firstSize = !this.w;
      this.view.x += (w - this.w) / 2;
      this.view.y += (h - this.h) / 2;
      this.w = w;
      this.h = h;
      this.canvas.width = Math.round(w * this.dpr);
      this.canvas.height = Math.round(h * this.dpr);
      this.canvas.style.width = `${w}px`;
      this.canvas.style.height = `${h}px`;
      if (firstSize) this.view = { k: 1, x: w / 2, y: h / 2 };
    }
    this.wake();
  }

  // ---------- Loop ----------

  private wake() {
    this.dirty = true;
    if (!this.raf && !this.destroyed && !document.hidden)
      this.raf = requestAnimationFrame(this.loop);
  }

  private onVisibility = () => {
    if (document.hidden) {
      cancelAnimationFrame(this.raf);
      this.raf = 0;
    } else {
      this.last = 0;
      this.wake();
    }
  };

  private simActive() {
    return (
      this.sim.alpha() > this.sim.alphaMin() || this.gesture?.mode === "drag"
    );
  }

  private loop = (time: number) => {
    this.raf = 0;
    const dt = this.last ? Math.min(0.05, (time - this.last) / 1000) : 1 / 60;
    this.last = time;
    const active = this.simActive();
    if (active) {
      if (this.reduced) {
        const start = performance.now();
        do this.sim.tick();
        while (
          this.sim.alpha() > this.sim.alphaMin() &&
          performance.now() - start < 14
        );
      } else this.sim.tick();
      if (this.autoFit && this.nodes.length && this.fitTick++ % 8 === 0)
        this.moveTo(this.fitView(this.nodes, 2.2), !this.reduced);
    }
    if (this.goal) {
      const f = 1 - Math.exp(-dt * 7);
      const v = this.view;
      const g = this.goal;
      this.view = {
        k: v.k + (g.k - v.k) * f,
        x: v.x + (g.x - v.x) * f,
        y: v.y + (g.y - v.y) * f,
      };
      if (
        Math.abs(g.k - v.k) < 0.001 * g.k &&
        Math.abs(g.x - v.x) < 0.5 &&
        Math.abs(g.y - v.y) < 0.5
      ) {
        this.view = g;
        this.goal = null;
      }
    }
    if (!this.reduced) this.animate(time, dt);
    // Idle (settled, nothing focused): 30 fps is plenty for slow particles.
    const idle =
      !active &&
      !this.goal &&
      !this.levels.size &&
      time - this.lastInput > 3000 &&
      !this.dirty;
    if (this.dirty || active || this.goal || !this.reduced) {
      if (!idle || time - this.lastDraw > 32) {
        this.draw(time);
        this.lastDraw = time;
        this.dirty = false;
      }
    }
    if (
      !this.raf &&
      !document.hidden &&
      !this.destroyed &&
      (!this.reduced || this.simActive() || this.goal)
    )
      this.raf = requestAnimationFrame(this.loop);
  };

  private focus() {
    return this.hovered ?? this.selected;
  }

  private updateLevels() {
    this.levels = new Map();
    const focus = this.focus();
    if (!focus) return;
    this.levels.set(focus, 0);
    for (const a of focus.adj) this.levels.set(a.node, 1);
    let budget = 400;
    for (const a of focus.adj)
      for (const b of a.node.adj) {
        if (budget-- <= 0) return;
        if (!this.levels.has(b.node)) this.levels.set(b.node, 2);
      }
  }

  private animate(time: number, dt: number) {
    for (const n of this.nodes)
      if (n.fire > 0) n.fire = Math.max(0, n.fire - dt * 1.4);
    const focus = this.focus();

    // Signal waves from the focused node, then to second-degree neighbours.
    if (focus && focus.adj.length && time - this.lastWave > 1100) {
      this.lastWave = time;
      focus.fire = 1;
      for (const a of focus.adj.slice(0, 80))
        this.pulses.push({
          link: a.link,
          from: focus,
          to: a.node,
          t: 0,
          speed: 190,
          level: 1,
        });
    }
    const arrived: Pulse[] = [];
    for (const p of this.pulses) {
      const len = Math.max(
        24,
        Math.hypot(p.to.x - p.from.x, p.to.y - p.from.y),
      );
      p.t += (p.speed * dt) / len;
      if (p.t >= 1) arrived.push(p);
    }
    if (arrived.length) {
      this.pulses = this.pulses.filter((p) => p.t < 1);
      for (const p of arrived) {
        p.to.fire = Math.max(p.to.fire, p.level === 1 ? 1 : 0.55);
        if (p.level !== 1 || !focus || this.pulses.length > 700) continue;
        let n = 0;
        for (const b of p.to.adj) {
          if (b.node === focus || b.node === p.from) continue;
          if (++n > 10) break;
          this.pulses.push({
            link: b.link,
            from: p.to,
            to: b.node,
            t: 0,
            speed: 140,
            level: 2,
          });
        }
      }
    }

    // Ambient firing: few slow particles wandering on random links.
    const wanted = Math.min(
      this.links.length,
      30 + Math.floor(this.links.length * 0.12),
      240,
    );
    while (this.ambient.length < wanted)
      this.ambient.push(this.randomPulse(Math.random()));
    if (this.ambient.length > wanted) this.ambient.length = wanted;
    for (let i = 0; i < this.ambient.length; i++) {
      const p = this.ambient[i];
      const len = Math.max(
        24,
        Math.hypot(p.to.x - p.from.x, p.to.y - p.from.y),
      );
      p.t += (p.speed * dt) / len;
      if (p.t >= 1) {
        p.to.fire = Math.max(p.to.fire, 0.3);
        this.ambient[i] = this.randomPulse(0);
      }
    }
  }

  private randomPulse(t: number): Pulse {
    const link = this.links[Math.floor(Math.random() * this.links.length)];
    const flip = Math.random() < 0.5;
    return {
      link,
      from: flip ? link.target : link.source,
      to: flip ? link.source : link.target,
      t,
      speed: 16 + Math.random() * 22,
      level: 0,
    };
  }

  // ---------- Drawing ----------

  private readTheme(): Theme {
    const css = getComputedStyle(document.documentElement);
    const v = (name: string, fallback: string) =>
      css.getPropertyValue(name).trim() || fallback;
    return {
      dark: document.documentElement.dataset.theme !== "light",
      text: v("--text", "#050505"),
      bg: v("--bg-1", "#ffffff"),
      crit: v("--crit", "#b3261e"),
      accent: v("--accent", "#171717"),
      accentRgb: v("--accent-rgb", "23, 23, 23"),
      ember: v("--ember", "#ff6a1f"),
      kindS: parseFloat(v("--kind-s", "0.32")) || 0.32,
      kindL: parseFloat(v("--kind-l", "0.62")) || 0.62,
      font: getComputedStyle(this.canvas).fontFamily || "system-ui, sans-serif",
    };
  }

  /** Muted tint of a kind, as the item-kind dots of the interface. */
  private color(hue: number, alpha = 1) {
    const { kindS, kindL } = this.theme;
    return `hsla(${hue}, ${85 * kindS}%, ${65 * kindL}%, ${alpha})`;
  }

  private sprite(
    cache: Map<number, HTMLCanvasElement>,
    hue: number,
    core: boolean,
  ) {
    let c = cache.get(hue);
    if (c) return c;
    c = document.createElement("canvas");
    c.width = c.height = 64;
    const g = c.getContext("2d")!;
    // Flat ink-on-paper marks: a small solid dot for the pulses, a faint
    // flat halo for a node that fires. No glow.
    g.fillStyle = core
      ? this.color(hue, 1)
      : this.color(hue, this.theme.dark ? 0.22 : 0.18);
    g.beginPath();
    g.arc(32, 32, core ? 14 : 32, 0, Math.PI * 2);
    g.fill();
    cache.set(hue, c);
    return c;
  }

  private alphaOf(node: Node) {
    const level = this.levels.get(node);
    if (this.levels.size)
      return level === undefined ? 0.12 : level === 2 ? 0.55 : 1;
    if (this.matches.size) return this.matches.has(node.ref) ? 1 : 0.2;
    return 1;
  }

  private draw(time: number) {
    const { ctx, w, h, dpr, theme } = this;
    const { k, x: tx, y: ty } = this.view;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    ctx.setTransform(dpr * k, 0, 0, dpr * k, dpr * tx, dpr * ty);
    const m = 40 / k;
    const vx0 = -tx / k - m;
    const vy0 = -ty / k - m;
    const vx1 = (w - tx) / k + m;
    const vy1 = (h - ty) / k + m;
    const outside = (n: Node) =>
      n.x < vx0 || n.x > vx1 || n.y < vy0 || n.y > vy1;
    const focused = this.levels.size > 0;
    const focus = this.focus();

    // Links, in batches by style: hairlines of ink.
    const line = theme.accentRgb;
    const plain = new Path2D();
    const strong = new Path2D();
    const faint = new Path2D();
    const lit: Link[] = [];
    for (const l of this.links) {
      if (outside(l.source) && outside(l.target)) continue;
      if (focused) {
        if (l.source === focus || l.target === focus) {
          lit.push(l);
          continue;
        }
        const a = this.levels.get(l.source);
        const b = this.levels.get(l.target);
        const path = a !== undefined && b !== undefined ? plain : faint;
        path.moveTo(l.source.x, l.source.y);
        path.lineTo(l.target.x, l.target.y);
        continue;
      }
      const path = l.explicit ? strong : plain;
      path.moveTo(l.source.x, l.source.y);
      path.lineTo(l.target.x, l.target.y);
    }
    ctx.lineWidth = 1 / k;
    ctx.strokeStyle = `rgba(${line}, ${focused ? 0.04 : this.matches.size ? 0.07 : 0.14})`;
    ctx.stroke(focused ? faint : plain);
    if (focused) {
      ctx.strokeStyle = `rgba(${line}, 0.22)`;
      ctx.stroke(plain);
    } else {
      ctx.strokeStyle = `rgba(${line}, ${this.matches.size ? 0.14 : 0.32})`;
      ctx.lineWidth = 1.3 / k;
      ctx.stroke(strong);
    }
    if (focus && lit.length > 150) {
      // Hubs: one batched stroke instead of a gradient per link.
      const hub = new Path2D();
      for (const l of lit) {
        hub.moveTo(l.source.x, l.source.y);
        hub.lineTo(l.target.x, l.target.y);
      }
      ctx.strokeStyle = this.color(focus.hue, 0.6);
      ctx.lineWidth = 1.2 / k;
      ctx.stroke(hub);
    } else if (focus && lit.length) {
      for (const l of lit) {
        const other = l.source === focus ? l.target : l.source;
        const g = ctx.createLinearGradient(focus.x, focus.y, other.x, other.y);
        g.addColorStop(0, this.color(focus.hue, 0.85));
        g.addColorStop(1, this.color(other.hue, 0.55));
        ctx.strokeStyle = g;
        ctx.lineWidth = (l.explicit ? 2 : 1.4) / k;
        ctx.beginPath();
        ctx.moveTo(l.source.x, l.source.y);
        ctx.lineTo(l.target.x, l.target.y);
        ctx.stroke();
      }
    }

    // Particles.
    if (!this.reduced) {
      const dim = focused ? 0.25 : 1;
      for (const p of this.ambient)
        this.drawPulse(p, 5 / k, 0.55 * dim, outside);
      for (const p of this.pulses)
        this.drawPulse(
          p,
          (p.level === 1 ? 11 : 7) / k,
          p.level === 1 ? 1 : 0.5,
          outside,
          true,
        );
      ctx.globalCompositeOperation = "source-over";
    }

    // Nodes: halo when firing, body, nucleus, rings.
    const glowScale = 2.4;
    for (const n of this.nodes) {
      if (outside(n) || n.r * k < 1.2 || n.fire < 0.02) continue;
      const a = this.alphaOf(n);
      const s = n.r * glowScale * (1 + n.fire * 0.9);
      ctx.globalAlpha = Math.min(1, a * n.fire);
      ctx.drawImage(
        this.sprite(this.glow, n.hue, false),
        n.x - s / 2,
        n.y - s / 2,
        s,
        s,
      );
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    for (const n of this.nodes) {
      if (outside(n)) continue;
      const a = this.alphaOf(n);
      ctx.fillStyle = this.color(n.hue, a);
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fill();
      if (n.r * k > 5) {
        ctx.fillStyle = theme.dark
          ? `rgba(${theme.accentRgb}, ${a * (0.45 + n.fire * 0.4)})`
          : `rgba(255, 255, 255, ${a * 0.75})`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r * 0.42, 0, Math.PI * 2);
        ctx.fill();
      }
      if (n.tone === "crit") {
        const phase = this.reduced ? 0.35 : (time / 1500 + n.phase) % 1;
        ctx.strokeStyle = theme.crit;
        ctx.globalAlpha = a * (1 - phase) * 0.9;
        ctx.lineWidth = 1.6 / k;
        ctx.beginPath();
        ctx.arc(
          n.x,
          n.y,
          n.r + (3 + phase * 9) / k + phase * n.r * 0.4,
          0,
          Math.PI * 2,
        );
        ctx.stroke();
        ctx.globalAlpha = a;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r + 1.5 / k, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
      if (this.matches.has(n.ref)) {
        ctx.strokeStyle = theme.ember;
        ctx.lineWidth = 2 / k;
        ctx.setLineDash([3 / k, 2.5 / k]);
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r + 5 / k, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      if (n === this.selected || n === this.hovered) {
        ctx.strokeStyle = n === this.selected ? theme.text : this.color(n.hue);
        ctx.lineWidth = 2 / k;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r + 3.5 / k, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    this.drawLabels(outside, lit, focus);
  }

  private drawPulse(
    p: Pulse,
    size: number,
    alpha: number,
    outside: (n: Node) => boolean,
    trail = false,
  ) {
    if (outside(p.from) && outside(p.to)) return;
    const { ctx } = this;
    const x = p.from.x + (p.to.x - p.from.x) * p.t;
    const y = p.from.y + (p.to.y - p.from.y) * p.t;
    const hue = p.from.hue;
    if (trail) {
      const t0 = Math.max(0, p.t - 0.16);
      const x0 = p.from.x + (p.to.x - p.from.x) * t0;
      const y0 = p.from.y + (p.to.y - p.from.y) * t0;
      const g = this.ctx.createLinearGradient(x0, y0, x, y);
      g.addColorStop(0, this.color(hue, 0));
      g.addColorStop(1, this.color(hue, alpha * 0.8));
      ctx.strokeStyle = g;
      ctx.lineWidth = size * 0.28;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
    // Fade in and out at both ends of the link.
    ctx.globalAlpha = alpha * Math.min(1, p.t * 6, (1 - p.t) * 6 + 0.3);
    ctx.drawImage(
      this.sprite(this.spark, hue, true),
      x - size / 2,
      y - size / 2,
      size,
      size,
    );
    ctx.globalAlpha = 1;
  }

  private drawLabels(
    outside: (n: Node) => boolean,
    lit: Link[],
    focus: Node | null,
  ) {
    const { ctx, dpr, theme } = this;
    const { k, x: tx, y: ty } = this.view;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Relation labels along the links of the focused node.
    if (focus && lit.length <= 30 && k > 0.55) {
      ctx.font = `500 10px ${theme.font}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.lineJoin = "round";
      for (const l of lit) {
        if (!l.label) continue;
        const mx = ((l.source.x + l.target.x) / 2) * k + tx;
        const my = ((l.source.y + l.target.y) / 2) * k + ty;
        ctx.lineWidth = 3;
        ctx.strokeStyle = theme.bg;
        ctx.strokeText(l.label, mx, my);
        ctx.fillStyle = this.color(focus.hue, 0.9);
        ctx.fillText(l.label, mx, my);
      }
    }

    const candidates: { n: Node; rank: number }[] = [];
    const zoomAll = k >= 1.7 || (this.nodes.length <= 60 && k >= 0.8);
    for (const n of this.nodes) {
      if (outside(n)) continue;
      let rank = -1;
      if (n === this.hovered) rank = 6;
      else if (n === this.selected) rank = 5;
      else if (this.levels.get(n) === 1) rank = 4;
      else if (this.matches.has(n.ref)) rank = 3;
      else if (this.levels.size && !this.levels.has(n)) rank = -1;
      else if (this.labelled.has(n)) rank = 2;
      else if (zoomAll) rank = 1;
      if (rank >= 0) candidates.push({ n, rank });
    }
    candidates.sort((a, b) => b.rank - a.rank || b.n.degree - a.n.degree);
    const placed: [number, number, number, number][] = [];
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.lineJoin = "round";
    let count = 0;
    for (const { n, rank } of candidates) {
      if (count > 260) break;
      const big = rank >= 5;
      ctx.font = `${big ? 600 : 500} ${big ? 13 : 11.5}px ${theme.font}`;
      const text = clip(n.title, big ? 48 : 30);
      const tw = ctx.measureText(text).width;
      const sx = n.x * k + tx + n.r * k + 6;
      const sy = n.y * k + ty;
      const box: [number, number, number, number] = [
        sx - 2,
        sy - 8,
        sx + tw + 2,
        sy + 8,
      ];
      if (
        rank < 5 &&
        placed.some(
          (p) =>
            box[0] < p[2] && box[2] > p[0] && box[1] < p[3] && box[3] > p[1],
        )
      )
        continue;
      placed.push(box);
      count++;
      const a = this.alphaOf(n);
      ctx.globalAlpha = rank >= 3 ? 1 : Math.max(0.5, a) * 0.9;
      ctx.lineWidth = 3.5;
      ctx.strokeStyle = theme.bg;
      ctx.strokeText(text, sx, sy);
      ctx.fillStyle = theme.text;
      ctx.fillText(text, sx, sy);
    }
    ctx.globalAlpha = 1;
  }

  // ---------- Input ----------

  private point(e: { clientX: number; clientY: number }) {
    const box = this.canvas.getBoundingClientRect();
    return { x: e.clientX - box.left, y: e.clientY - box.top };
  }

  private hit(sx: number, sy: number): Node | null {
    const { k, x, y } = this.view;
    const wx = (sx - x) / k;
    const wy = (sy - y) / k;
    const found = this.sim.find(wx, wy, 40 / k + 24);
    if (!found) return null;
    const d = Math.hypot(found.x - wx, found.y - wy);
    // A few screen pixels of tolerance so small nodes stay easy to hit.
    return d <= found.r + 8 / k ? found : null;
  }

  private setHover(
    node: Node | null,
    e?: { clientX: number; clientY: number },
  ) {
    if (node === this.hovered) return;
    this.hovered = node;
    this.canvas.style.cursor = node ? "pointer" : "grab";
    this.updateLevels();
    this.lastWave = 0;
    this.events.hover(node?.ref ?? null, e?.clientX ?? 0, e?.clientY ?? 0);
    this.wake();
  }

  private onDown = (e: PointerEvent) => {
    this.lastInput = performance.now();
    this.canvas.setPointerCapture(e.pointerId);
    const p = this.point(e);
    this.pointers.set(e.pointerId, p);
    if (this.pointers.size === 2) {
      const [a, b] = [...this.pointers.values()];
      if (this.gesture?.mode === "drag") this.release(this.gesture.node);
      this.gesture = {
        mode: "pinch",
        distance: Math.hypot(a.x - b.x, a.y - b.y),
        k: this.view.k,
      };
      return;
    }
    const node = this.hit(p.x, p.y);
    this.gesture = node
      ? { mode: "drag", node, x: p.x, y: p.y, moved: false }
      : { mode: "pan", x: p.x, y: p.y, moved: false };
    if (!node) this.canvas.style.cursor = "grabbing";
  };

  private onMove = (e: PointerEvent) => {
    this.lastInput = performance.now();
    const p = this.point(e);
    const g = this.gesture;
    if (this.pointers.has(e.pointerId)) this.pointers.set(e.pointerId, p);
    if (!g) {
      if (e.pointerType !== "touch") this.setHover(this.hit(p.x, p.y), e);
      return;
    }
    if (g.mode === "pinch") {
      if (this.pointers.size < 2) return;
      const [a, b] = [...this.pointers.values()];
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      this.zoomAt(
        (a.x + b.x) / 2,
        (a.y + b.y) / 2,
        (g.k * distance) / g.distance / this.view.k,
      );
      return;
    }
    const dx = p.x - g.x;
    const dy = p.y - g.y;
    if (!g.moved && Math.hypot(dx, dy) < 4) return;
    if (g.mode === "pan") {
      g.moved = true;
      this.autoFit = false;
      this.goal = null;
      this.view = { ...this.view, x: this.view.x + dx, y: this.view.y + dy };
      g.x = p.x;
      g.y = p.y;
      this.setHover(null);
      this.wake();
      return;
    }
    if (!g.moved) {
      g.moved = true;
      this.autoFit = false;
      this.setHover(null);
      this.sim.alphaTarget(0.25);
    }
    const { k, x, y } = this.view;
    g.node.fx = (p.x - x) / k;
    g.node.fy = (p.y - y) / k;
    this.wake();
  };

  private release(node: Node) {
    node.fx = null;
    node.fy = null;
    this.sim.alphaTarget(0);
    this.sim.alpha(Math.max(this.sim.alpha(), 0.12));
  }

  private onUp = (e: PointerEvent) => {
    this.pointers.delete(e.pointerId);
    const g = this.gesture;
    if (g?.mode === "pinch") {
      if (!this.pointers.size) this.gesture = null;
      return;
    }
    this.gesture = null;
    this.canvas.style.cursor = this.hovered ? "pointer" : "grab";
    if (!g || e.type === "pointercancel") {
      if (g?.mode === "drag") this.release(g.node);
      return;
    }
    if (g.mode === "drag") {
      if (g.moved) this.release(g.node);
      else this.events.select(g.node.ref);
    } else if (!g.moved) this.events.select(null);
    this.wake();
  };

  private onLeave = () => {
    if (!this.gesture) this.setHover(null);
  };

  private onDouble = (e: MouseEvent) => {
    const p = this.point(e);
    const node = this.hit(p.x, p.y);
    if (node) this.events.open(node.ref);
    else this.zoomAt(p.x, p.y, 1.8);
  };

  private zoomAt(sx: number, sy: number, factor: number) {
    this.autoFit = false;
    this.goal = null;
    const v = this.view;
    const k = Math.min(MAX_K, Math.max(MIN_K, v.k * factor));
    this.view = {
      k,
      x: sx - ((sx - v.x) / v.k) * k,
      y: sy - ((sy - v.y) / v.k) * k,
    };
    this.wake();
  }

  private onWheel = (e: WheelEvent) => {
    e.preventDefault();
    this.lastInput = performance.now();
    const p = this.point(e);
    const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 400 : 1;
    const delta = e.deltaY * unit * (e.ctrlKey ? 2.5 : 1);
    this.zoomAt(p.x, p.y, Math.exp(-delta * 0.0016));
  };

  private onKey = (e: KeyboardEvent) => {
    const step = 60;
    const pan = (dx: number, dy: number) => {
      this.autoFit = false;
      this.goal = null;
      this.view = { ...this.view, x: this.view.x + dx, y: this.view.y + dy };
      this.wake();
    };
    const keys: Record<string, () => void> = {
      "+": () => this.zoomBy(1.3),
      "=": () => this.zoomBy(1.3),
      "-": () => this.zoomBy(1 / 1.3),
      "0": () => this.fit(),
      ArrowLeft: () => pan(step, 0),
      ArrowRight: () => pan(-step, 0),
      ArrowUp: () => pan(0, step),
      ArrowDown: () => pan(0, -step),
      Escape: () => this.events.select(null),
    };
    const run = keys[e.key];
    if (!run) return;
    e.preventDefault();
    run();
  };
}
