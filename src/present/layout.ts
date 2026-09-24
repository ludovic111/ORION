import type { Deck, Slide, Tone } from "./deck.ts";
import { clipLine, fitText, hexColor, textWidth, wrap } from "./text.ts";

// Every slide of a deck as positioned shapes on a 1920 × 1080 page: boxes
// with text, pictures and tables, with their entrance animation. The file
// writers (PowerPoint, OpenDocument, PDF, HTML) only translate these shapes,
// so all the formats look alike. No DOM: runs in node for the tests.

export const PAGE_W = 1920;
export const PAGE_H = 1080;

export type Palette = {
  dark: boolean;
  bg: string;
  surface: string;
  surface2: string;
  line: string;
  text: string;
  text2: string;
  text3: string;
  accent: string;
  cyan: string;
  pink: string;
  amber: string;
  ok: string;
  warn: string;
  crit: string;
};
export const DARK: Palette = {
  dark: true,
  bg: "070914",
  surface: "121633",
  surface2: "1A1F45",
  line: "2E3466",
  text: "ECEEFE",
  text2: "A7ABCB",
  text3: "7A80A8",
  accent: "8B7BFF",
  cyan: "3FDCFF",
  pink: "FF72C8",
  amber: "FFB35C",
  ok: "34E0A1",
  warn: "FFB547",
  crit: "FF5A7A",
};
export const LIGHT: Palette = {
  dark: false,
  bg: "F6F7FC",
  surface: "FFFFFF",
  surface2: "EEF0F9",
  line: "D5D8EA",
  text: "0F1127",
  text2: "474C72",
  text3: "6E7399",
  accent: "5C45FF",
  cyan: "0087B3",
  pink: "C52F8C",
  amber: "B86300",
  ok: "0C8A5E",
  warn: "A86400",
  crit: "D8214A",
};

export type Run = {
  text: string;
  bold?: boolean;
  color?: string;
  size?: number;
};
export type Para = {
  runs: Run[];
  size: number;
  color: string;
  bold?: boolean;
  align?: "l" | "c" | "r";
  font?: "sans" | "display" | "mono";
  /** Letter spacing in px. */
  spacing?: number;
  /** Text opacity, 0–1 (watermark). */
  alpha?: number;
  /** Space after the paragraph, px. */
  after?: number;
};
export type Effect = "fade" | "rise" | "zoom" | "wipe";
/** Entrance: start (ms after the slide appears), effect, duration. */
export type Anim = { at: number; effect: Effect; dur: number };
type Common = {
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  anim?: Anim;
};
export type BoxShape = Common & {
  type: "box";
  fill?: string;
  /** Fill opacity, 0–1. */
  alpha?: number;
  line?: string;
  lineW?: number;
  radius?: number;
  ellipse?: boolean;
  /** Soft edge (blur) radius in px, for the background glows. */
  soft?: number;
  /** Rotation in degrees, clockwise. */
  rot?: number;
  paras?: Para[];
  valign?: "t" | "m" | "b";
  pad?: number;
};
export type ImageShape = Common & {
  type: "image";
  /** Key in the images given to the writers. */
  key: string;
  radius?: number;
  /** Slow zoom while the slide stays (maps). */
  drift?: boolean;
};
export type Cell = {
  text: string;
  bold?: boolean;
  color?: string;
  align?: "l" | "c" | "r";
};
export type TableShape = Common & {
  type: "table";
  cols: number[];
  rows: Cell[][];
  rowH: number;
  size: number;
  header: boolean;
};
export type Shape = BoxShape | ImageShape | TableShape;
export type SlideLayout = {
  id: string;
  title: string;
  background: string;
  shapes: Shape[];
  notes: string;
  transition: "fade" | "push";
};

/** Freehand annotation, in px of the 1920 × 1080 page. */
export type InkStroke = {
  tool: "pen" | "marker";
  color: string;
  width: number;
  /** x, y, pressure (0–1). */
  points: [number, number, number][];
};

/** Picture handed to the writers: PNG bytes and pixel size. */
export type DeckImage = { bytes: Uint8Array; width: number; height: number };
export type DeckImages = Record<string, DeckImage>;

export type LayoutContext = {
  palette: Palette;
  /** Footer line (stamp of the export, or the operation). */
  footer: string;
  /** Images available (keys): maps, symbols, "qr". */
  images: Set<string>;
  animations: boolean;
  /** Watermark text; defaults to the deck watermark. */
  watermark?: string;
};

// ---------- Geometry ----------

const X0 = 96;
const X1 = PAGE_W - 96;
const W = X1 - X0;
const Y0 = 236;
const Y1 = 968;
const H = Y1 - Y0;
const GAP = 28;

const toneColor = (p: Palette, tone: Tone) =>
  ({
    ok: p.ok,
    warn: p.warn,
    crit: p.crit,
    accent: p.accent,
    info: p.cyan,
    muted: p.text3,
  })[tone];
const CYCLE = (p: Palette) => [p.accent, p.cyan, p.pink, p.amber];

/** Plain paragraph. */
const para = (
  text: string,
  size: number,
  color: string,
  extra: Partial<Para> = {},
): Para => ({
  runs: [{ text }],
  size,
  color,
  ...extra,
});

/** Grid of `n` cells inside a box. */
function grid(
  n: number,
  cols: number,
  x: number,
  y: number,
  w: number,
  h: number,
  gap = GAP,
) {
  const rows = Math.ceil(n / cols);
  const cw = (w - gap * (cols - 1)) / cols;
  const ch = (h - gap * (rows - 1)) / rows;
  return Array.from({ length: n }, (_, i) => ({
    x: x + (i % cols) * (cw + gap),
    y: y + Math.floor(i / cols) * (ch + gap),
    w: cw,
    h: ch,
  }));
}

class Builder {
  shapes: Shape[] = [];
  private step = 0;
  private count = 0;
  readonly p: Palette;
  readonly animations: boolean;
  constructor(p: Palette, animations: boolean) {
    this.p = p;
    this.animations = animations;
  }
  /** Next entrance, staggered. */
  anim(effect: Effect = "rise", gap = 140): Anim | undefined {
    if (!this.animations) return undefined;
    const at = 250 + this.step;
    this.step += gap;
    return { at, effect, dur: effect === "zoom" ? 700 : 600 };
  }
  /** Same moment as the previous entrance. */
  with(effect: Effect = "fade"): Anim | undefined {
    if (!this.animations) return undefined;
    return { at: 250 + Math.max(0, this.step - 140), effect, dur: 600 };
  }
  name(kind: string) {
    return `${kind} ${++this.count}`;
  }
  box(
    kind: string,
    x: number,
    y: number,
    w: number,
    h: number,
    props: Partial<BoxShape> = {},
  ) {
    const shape: BoxShape = {
      type: "box",
      name: this.name(kind),
      x,
      y,
      w,
      h,
      ...props,
    };
    this.shapes.push(shape);
    return shape;
  }
  card(
    x: number,
    y: number,
    w: number,
    h: number,
    props: Partial<BoxShape> = {},
  ) {
    return this.box("Carte", x, y, w, h, {
      fill: this.p.surface,
      alpha: this.p.dark ? 0.92 : 1,
      line: this.p.line,
      lineW: 2,
      radius: 22,
      pad: 32,
      ...props,
    });
  }
  text(
    x: number,
    y: number,
    w: number,
    h: number,
    paras: Para[],
    props: Partial<BoxShape> = {},
  ) {
    return this.box("Texte", x, y, w, h, {
      paras,
      pad: 0,
      valign: "t",
      ...props,
    });
  }
}

/** A paragraph fitted to a box (font size chosen, text cut if needed). */
function fitted(
  text: string,
  w: number,
  h: number,
  max: number,
  min: number,
  color: string,
  extra: Partial<Para> & { maxLines?: number } = {},
): Para {
  const { maxLines, ...rest } = extra;
  const f = fitText(text, w, h, max, min, {
    bold: rest.bold,
    lineHeight: 1.22,
    maxLines,
  });
  return para(f.text, f.size, color, rest);
}

// ---------- Common parts ----------

function background(b: Builder) {
  const p = b.p;
  b.box("Lueur", 1180, -380, 1100, 900, {
    ellipse: true,
    fill: p.accent,
    alpha: p.dark ? 0.16 : 0.08,
    soft: 260,
  });
  b.box("Lueur", -360, 640, 1000, 760, {
    ellipse: true,
    fill: p.cyan,
    alpha: p.dark ? 0.1 : 0.06,
    soft: 240,
  });
}

function heading(b: Builder, kicker: string, title: string) {
  const p = b.p;
  b.text(X0, 70, W, 34, [
    para(kicker.toUpperCase(), 24, p.accent, { bold: true, spacing: 4 }),
  ]);
  b.box("Filet", X0, 112, 72, 6, { fill: p.accent, radius: 3 });
  b.text(
    X0,
    128,
    W,
    96,
    [
      fitted(title, W, 92, 64, 40, p.text, {
        bold: true,
        font: "display",
        maxLines: 1,
      }),
    ],
    { valign: "m" },
  );
}

function footer(
  b: Builder,
  ctx: LayoutContext,
  deck: Deck,
  index: number,
  count: number,
  overlay = false,
) {
  const p = b.p;
  if (overlay)
    b.box("Bandeau", 0, PAGE_H - 84, PAGE_W, 84, { fill: p.bg, alpha: 0.78 });
  const y = PAGE_H - 62;
  b.text(X0, y, 820, 30, [para(clipLine(ctx.footer, 820, 20), 20, p.text3)]);
  b.text(X0 + 840, y, 640, 30, [
    para(clipLine(deck.when, 640, 20), 20, p.text3, { align: "c" }),
  ]);
  b.text(X1 - 200, y, 200, 30, [
    para(`${index + 1} / ${count}`, 20, p.text3, { align: "r", bold: true }),
  ]);
}

function watermark(b: Builder, text: string) {
  if (!text) return;
  const p = b.p;
  const w = 1760;
  let size = 220;
  while (size > 60 && textWidth(text, size, true) > w - 40) size -= 10;
  b.box("Filigrane", (PAGE_W - w) / 2, (PAGE_H - 300) / 2, w, 300, {
    rot: -24,
    valign: "m",
    paras: [
      para(text, size, p.text, {
        bold: true,
        align: "c",
        alpha: p.dark ? 0.07 : 0.045,
        spacing: 12,
      }),
    ],
  });
}

function pill(
  b: Builder,
  x: number,
  y: number,
  label: string,
  tone: string,
  size = 22,
  anim?: Anim,
) {
  const w = textWidth(label, size, true) + size * 1.6;
  b.box("Pastille", x, y, w, size * 1.9, {
    fill: tone,
    alpha: 0.16,
    line: tone,
    lineW: 2,
    radius: size,
    valign: "m",
    pad: 0,
    anim,
    paras: [para(label, size, tone, { bold: true, align: "c" })],
  });
  return w;
}

// ---------- Slides ----------

function titleLayout(
  b: Builder,
  slide: Extract<Slide, { kind: "title" }>,
  ctx: LayoutContext,
) {
  const p = b.p;
  b.text(X0, 90, 1100, 36, [
    para("ORION AIC · POINT DE SITUATION", 24, p.accent, {
      bold: true,
      spacing: 5,
    }),
  ]);
  let x = X1;
  for (const badge of [...slide.badges].reverse()) {
    const w = textWidth(badge.label, 22, true) + 36;
    x -= w;
    pill(b, x, 80, badge.label, toneColor(p, badge.tone), 22);
    x -= 16;
  }
  const title = fitText(slide.operation, 1500, 290, 120, 64, {
    bold: true,
    lineHeight: 1.1,
  });
  b.text(
    X0,
    300,
    1560,
    300,
    [para(title.text, title.size, p.text, { bold: true, font: "display" })],
    { valign: "b", anim: b.anim("rise") },
  );
  const context = [
    slide.organization,
    slide.location,
    slide.reference && `Réf. ${slide.reference}`,
  ]
    .filter(Boolean)
    .join("  ·  ");
  if (context)
    b.text(
      X0,
      624,
      1500,
      50,
      [para(clipLine(context, 1500, 34), 34, p.text2)],
      {
        anim: b.anim("fade"),
      },
    );
  b.box("Filet", X0, 700, 180, 8, {
    fill: p.accent,
    radius: 4,
    anim: b.anim("wipe"),
  });
  b.box("Filet", X0 + 180, 700, 120, 8, {
    fill: p.cyan,
    radius: 4,
    anim: b.with("wipe"),
  });
  b.box("Filet", X0 + 300, 700, 60, 8, {
    fill: p.pink,
    radius: 4,
    anim: b.with("wipe"),
  });
  b.text(
    X0,
    736,
    1400,
    56,
    [para(clipLine(slide.when, 1400, 40, true), 40, p.text, { bold: true })],
    {
      anim: b.anim("rise"),
    },
  );
  const by = [
    slide.presenter && `Présenté par ${slide.presenter}`,
    slide.audience && `pour ${slide.audience}`,
  ]
    .filter(Boolean)
    .join("  ·  ");
  if (by)
    b.text(X0, 870, 1400, 90, [fitted(by, 1400, 90, 30, 22, p.text2)], {
      anim: b.anim("fade"),
    });
  if (ctx.images.has("qr"))
    b.shapes.push({
      type: "image",
      name: "Code de vérification",
      key: "qr",
      x: X1 - 150,
      y: PAGE_H - 250,
      w: 150,
      h: 150,
      radius: 0,
      anim: b.anim("fade"),
    });
}

function situationLayout(
  b: Builder,
  slide: Extract<Slide, { kind: "situation" }>,
) {
  const p = b.p;
  const boards = slide.boards.slice(0, slide.intent ? 3 : 4);
  const boardCard = (
    board: { title: string; body: string },
    r: { x: number; y: number; w: number; h: number },
    i: number,
  ) => {
    const inner = r.w - 64;
    b.card(r.x, r.y, r.w, r.h, {
      anim: b.anim("rise"),
      paras: [
        para(
          clipLine(board.title.toUpperCase(), inner, 24, true),
          24,
          CYCLE(p)[(i + 1) % 4],
          {
            bold: true,
            spacing: 2,
            after: 14,
          },
        ),
        fitted(board.body, inner, r.h - 64 - 50, 44, 22, p.text),
      ],
    });
  };
  if (slide.intent) {
    const left = 1040;
    grid(boards.length || 1, 1, X0, Y0, left, H).forEach(
      (r, i) => boards[i] && boardCard(boards[i], r, i),
    );
    const ix = X0 + left + GAP;
    const iw = X1 - ix;
    b.card(ix, Y0, iw, H, {
      fill: p.accent,
      alpha: p.dark ? 0.16 : 0.1,
      line: p.accent,
      lineW: 3,
      anim: b.anim("zoom"),
      paras: [
        para("IDÉE DE MANŒUVRE", 24, p.accent, {
          bold: true,
          spacing: 3,
          after: 8,
        }),
        para(clipLine(slide.intent.title, iw - 64, 28), 28, p.text2, {
          after: 22,
        }),
        fitted(slide.intent.body, iw - 64, H - 64 - 110, 54, 24, p.text, {
          bold: true,
        }),
      ],
    });
    if (!boards.length) return;
    return;
  }
  const cols = boards.length === 4 ? 2 : boards.length;
  grid(boards.length, cols, X0, Y0, W, H).forEach((r, i) =>
    boardCard(boards[i], r, i),
  );
}

function factsLayout(b: Builder, slide: Extract<Slide, { kind: "facts" }>) {
  const p = b.p;
  const facts = slide.facts.slice(0, 12);
  let top = Y0;
  if (slide.since) {
    b.text(X0, Y0 - 8, W, 40, [para(`Évolution ${slide.since}`, 26, p.text2)]);
    top += 44;
  }
  const n = facts.length;
  const cols = n <= 4 ? n : n <= 6 ? 3 : 4;
  const cells = grid(n, cols, X0, top, W, Y1 - top);
  cells.forEach((r, i) => {
    const f = facts[i];
    const color = CYCLE(p)[i % 4];
    const inner = r.w - 64;
    const labelSize = r.h > 300 ? 30 : 24;
    let size = Math.min(160, Math.floor(r.h * 0.4));
    const unitOf = (s: number) =>
      f.unit ? textWidth(` ${f.unit}`, s * 0.36) : 0;
    while (size > 36 && textWidth(f.value, size, true) + unitOf(size) > inner)
      size -= 4;
    const runs: Run[] = [{ text: f.value, bold: true, color, size }];
    if (f.unit)
      runs.push({
        text: ` ${f.unit}`,
        color: p.text2,
        size: Math.round(size * 0.36),
      });
    const paras: Para[] = [
      { runs, size, color, bold: true, font: "display", after: 6 },
      fitted(f.label, inner, labelSize * 2.6, labelSize, 18, p.text, {
        maxLines: 2,
      }),
    ];
    const card = b.card(r.x, r.y, r.w, r.h, {
      anim: b.anim("zoom", 120),
      valign: "m",
      paras,
    });
    if (f.delta && f.trend && f.trend !== "same") {
      const tone = f.trend === "new" ? p.cyan : p.amber;
      const label = f.delta;
      const pw = textWidth(label, 26, true) + 36;
      b.box("Évolution", r.x + r.w - pw - 22, r.y + 22, pw, 46, {
        fill: tone,
        alpha: 0.16,
        radius: 23,
        valign: "m",
        pad: 0,
        anim: b.with("fade"),
        paras: [para(label, 26, tone, { bold: true, align: "c" })],
      });
    }
    void card;
  });
}

function mapLayout(
  b: Builder,
  slide: Extract<Slide, { kind: "map" }>,
  ctx: LayoutContext,
) {
  const p = b.p;
  if (ctx.images.has(slide.id))
    b.shapes.push({
      type: "image",
      name: "Carte",
      key: slide.id,
      x: 0,
      y: 0,
      w: PAGE_W,
      h: PAGE_H,
      drift: true,
      anim: ctx.animations ? { at: 0, effect: "fade", dur: 900 } : undefined,
    });
  else
    b.box("Carte absente", X0, Y0, W, H, {
      fill: p.surface2,
      radius: 22,
      valign: "m",
      paras: [
        para("Carte non disponible (hors ligne ?)", 32, p.text3, {
          align: "c",
        }),
      ],
    });
  b.box("Bandeau", 0, 0, PAGE_W, 216, { fill: p.bg, alpha: 0.8 });
  b.text(X0, 58, W, 34, [
    para(slide.kicker.toUpperCase(), 24, p.accent, { bold: true, spacing: 4 }),
  ]);
  b.text(
    X0,
    98,
    1300,
    80,
    [
      fitted(slide.title, 1300, 80, 60, 36, p.text, {
        bold: true,
        font: "display",
        maxLines: 1,
      }),
    ],
    { valign: "m" },
  );
  if (slide.purpose)
    b.text(
      X0 + 1320,
      98,
      W - 1320,
      80,
      [fitted(slide.purpose, W - 1320, 80, 24, 18, p.text2, { align: "r" })],
      {
        valign: "m",
      },
    );
  // Legend
  const lines: {
    layer?: string;
    item?: (typeof slide.legend)[number]["items"][number];
  }[] = [];
  for (const l of slide.legend) {
    lines.push({ layer: l.layer });
    for (const item of l.items.slice(0, 4)) lines.push({ item });
  }
  const shown = lines.slice(0, 15);
  if (!shown.length) return;
  const lh = 42;
  const lw = 420;
  const lx = PAGE_W - lw - 48;
  const lhTotal = shown.length * lh + 56;
  const ly = Math.max(240, PAGE_H - 110 - lhTotal);
  b.card(lx, ly, lw, lhTotal, { alpha: 0.9, anim: b.anim("rise") });
  shown.forEach((line, i) => {
    const y = ly + 28 + i * lh;
    if (line.layer) {
      b.text(
        lx + 28,
        y + 6,
        lw - 56,
        32,
        [
          para(
            clipLine(line.layer.toUpperCase(), lw - 56, 20, true),
            20,
            p.accent,
            { bold: true, spacing: 2 },
          ),
        ],
        { anim: b.with("fade") },
      );
      return;
    }
    const it = line.item!;
    const color = hexColor(it.color, p.cyan);
    const key = `sym:${it.symbol}`;
    if (it.symbol && ctx.images.has(key))
      b.shapes.push({
        type: "image",
        name: "Signe",
        key,
        x: lx + 28,
        y: y + 3,
        w: 34,
        h: 34,
        anim: b.with("fade"),
      });
    else if (it.kind === "line")
      b.box("Trait", lx + 28, y + 17, 34, 6, {
        fill: color,
        radius: 3,
        anim: b.with("fade"),
      });
    else
      b.box("Marque", lx + 32, y + 8, 26, 26, {
        fill: color,
        alpha: it.kind === "area" ? 0.5 : 1,
        line: color,
        lineW: 2,
        ellipse: it.kind === "point",
        radius: 4,
        anim: b.with("fade"),
      });
    const label = `${it.name}${it.count > 1 ? `  ×${it.count}` : ""}`;
    b.text(
      lx + 78,
      y + 4,
      lw - 106,
      34,
      [para(clipLine(label, lw - 106, 22), 22, p.text)],
      {
        anim: b.with("fade"),
      },
    );
  });
}

function changesLayout(b: Builder, slide: Extract<Slide, { kind: "changes" }>) {
  const p = b.p;
  b.text(
    X0,
    Y0 - 8,
    W,
    44,
    [
      {
        runs: [
          { text: `${slide.total} `, bold: true, color: p.accent },
          { text: `changement${slide.total > 1 ? "s" : ""} ${slide.since}` },
        ],
        size: 30,
        color: p.text2,
      },
    ],
    { anim: b.anim("fade") },
  );
  const groups = slide.groups.slice(0, 6);
  const cols = groups.length <= 3 ? groups.length : 3;
  grid(groups.length, cols, X0, Y0 + 60, W, H - 60).forEach((r, i) => {
    const g = groups[i];
    const inner = r.w - 64;
    const total = g.created + g.updated + g.removed;
    const detail = [
      g.created && `${g.created} nouveau${g.created > 1 ? "x" : ""}`,
      g.updated && `${g.updated} modifié${g.updated > 1 ? "s" : ""}`,
      g.removed && `${g.removed} retiré${g.removed > 1 ? "s" : ""}`,
    ]
      .filter(Boolean)
      .join(" · ");
    const room = Math.max(
      0,
      Math.floor((r.h - 64 - 64 * 1.2 - 6 - 26 * 1.2 - 16) / (26 * 1.2 + 8)),
    );
    b.card(r.x, r.y, r.w, r.h, {
      anim: b.anim("rise"),
      paras: [
        {
          runs: [
            {
              text: String(total),
              bold: true,
              color: CYCLE(p)[i % 4],
              size: 64,
            },
            {
              text: `  ${clipLine(g.label, inner - textWidth(String(total), 64, true) - 20, 30, true)}`,
              bold: true,
              size: 30,
            },
          ],
          size: 64,
          color: p.text,
          font: "display",
          after: 6,
        },
        para(detail, 26, p.text2, { after: 16 }),
        ...g.highlights
          .slice(0, room)
          .map((h) => para(clipLine(h, inner, 26), 26, p.text, { after: 8 })),
      ],
    });
  });
}

function highlightsLayout(
  b: Builder,
  slide: Extract<Slide, { kind: "highlights" }>,
) {
  const p = b.p;
  const items = slide.items;
  const rowH = Math.min(180, (H - (slide.more ? 40 : 0)) / items.length);
  const lineX = X0 + 176;
  b.box("Axe", lineX, Y0 + 10, 4, rowH * items.length - 20, {
    fill: p.line,
    radius: 2,
  });
  items.forEach((it, i) => {
    const y = Y0 + i * rowH;
    const tone = toneColor(p, it.tone);
    b.text(
      X0,
      y + 14,
      150,
      50,
      [para(it.time, 36, p.cyan, { bold: true, font: "mono", align: "r" })],
      {
        anim: b.anim("fade", 160),
      },
    );
    b.box("Point", lineX - 10, y + 24, 24, 24, {
      ellipse: true,
      fill: tone,
      line: p.bg,
      lineW: 4,
      anim: b.with("zoom"),
    });
    const cx = lineX + 48;
    const cw = X1 - cx;
    b.card(cx, y + 4, cw, rowH - 16, {
      pad: 22,
      valign: "m",
      anim: b.with("rise"),
      paras: [
        para(
          clipLine(
            [
              it.number,
              it.type,
              it.priority !== "Normal" && it.priority,
              it.status,
            ]
              .filter(Boolean)
              .join(" · "),
            cw - 44,
            22,
            true,
          ),
          22,
          tone,
          { bold: true, after: 6 },
        ),
        fitted(it.text, cw - 44, rowH - 16 - 44 - 34, 36, 22, p.text, {
          maxLines: 2,
        }),
      ],
    });
  });
  if (slide.more)
    b.text(lineX + 48, Y1 - 36, W - 230, 36, [
      para(
        `… et ${slide.more} autre${slide.more > 1 ? "s" : ""} au journal`,
        22,
        p.text3,
      ),
    ]);
}

function missionsLayout(
  b: Builder,
  slide: Extract<Slide, { kind: "missions" }>,
) {
  const p = b.p;
  let x = X0;
  x +=
    pill(
      b,
      x,
      Y0 - 12,
      `${slide.open} point${slide.open > 1 ? "s" : ""} ouvert${slide.open > 1 ? "s" : ""}`,
      p.accent,
      24,
      b.anim("fade"),
    ) + 16;
  if (slide.late)
    pill(b, x, Y0 - 12, `${slide.late} en retard`, p.crit, 24, b.with("fade"));
  const cols = [150, 830, 290, 280, 178];
  const rows: Cell[][] = [
    ["N°", "Mission / mesure", "Responsable", "Échéance", "État"].map((t) => ({
      text: t,
      bold: true,
      color: p.text2,
    })),
    ...slide.items.map((m) => [
      { text: m.number, bold: true, color: m.late ? p.crit : p.cyan },
      { text: m.text },
      { text: m.assignee },
      { text: m.due, color: m.late ? p.crit : undefined, bold: m.late },
      { text: m.status, color: m.late ? p.crit : p.text2, bold: m.late },
    ]),
  ];
  if (slide.more)
    rows.push([
      { text: "" },
      {
        text: `… et ${slide.more} autre${slide.more > 1 ? "s" : ""}`,
        color: p.text3,
      },
      { text: "" },
      { text: "" },
      { text: "" },
    ]);
  table(b, X0, Y0 + 64, W, H - 64, cols, rows, 32);
}

/** Table fitted to a box: text size and row height chosen, cells cut. */
function table(
  b: Builder,
  x: number,
  y: number,
  w: number,
  h: number,
  widths: number[],
  rows: Cell[][],
  max = 28,
) {
  const p = b.p;
  const scale = w / widths.reduce((a, c) => a + c, 0);
  const cols = widths.map((c) => Math.round(c * scale));
  let size = max;
  let rowH = 0;
  for (; size >= 18; size -= 2) {
    const lines = rows
      .slice(1)
      .map((r) =>
        Math.min(
          2,
          Math.max(
            ...r.map((c, i) => wrap(c.text, cols[i] - 36, size, c.bold).length),
          ),
        ),
      );
    rowH = size * 1.25 * Math.max(1, ...lines) + 30;
    if (rowH * (rows.length - 1) + size * 1.25 + 30 <= h) break;
  }
  size = Math.max(18, size);
  const fittedRows = rows.map((r, ri) =>
    r.map((c, i) => ({
      ...c,
      text:
        ri === 0
          ? clipLine(c.text, cols[i] - 36, size, true)
          : fitText(c.text, cols[i] - 36, size * 1.25 * 2, size, size, {
              bold: c.bold,
              lineHeight: 1.25,
            }).text,
      color: c.color ?? p.text,
    })),
  );
  const maxRows = Math.max(2, Math.floor((h - (size * 1.25 + 30)) / rowH) + 1);
  const shape: TableShape = {
    type: "table",
    name: b.name("Tableau"),
    x,
    y,
    w,
    h: Math.min(h, rowH * Math.min(fittedRows.length, maxRows)),
    cols,
    rows: fittedRows.slice(0, maxRows),
    rowH,
    size,
    header: true,
    anim: b.anim("rise"),
  };
  b.shapes.push(shape);
  return shape;
}

function kpis(
  b: Builder,
  items: { label: string; value: string; tone: string }[],
  y: number,
  h: number,
) {
  const p = b.p;
  grid(items.length, items.length, X0, y, W, h).forEach((r, i) => {
    const it = items[i];
    let size = Math.min(96, h * 0.46);
    while (size > 36 && textWidth(it.value, size, true) > r.w - 64) size -= 4;
    b.card(r.x, r.y, r.w, r.h, {
      valign: "m",
      anim: b.anim("zoom", 110),
      paras: [
        para(it.value, size, it.tone, {
          bold: true,
          font: "display",
          after: 4,
        }),
        para(clipLine(it.label, r.w - 64, 24), 24, p.text2),
      ],
    });
  });
}

function resourcesLayout(
  b: Builder,
  slide: Extract<Slide, { kind: "resources" }>,
) {
  const p = b.p;
  kpis(
    b,
    slide.totals.map((t) => ({
      label: t.label,
      value: String(t.value),
      tone: toneColor(p, t.tone),
    })),
    Y0,
    210,
  );
  const rows: Cell[][] = [
    slide.head.map((t, i) => ({
      text: t,
      bold: true,
      color: p.text2,
      align: i ? "c" : "l",
    })),
    ...slide.rows.map((r) =>
      r.map((t, i) => ({
        text: i && t === "0" ? "—" : t,
        bold: r[0] === "Total" || (i === 1 && t !== "0"),
        align: (i ? "c" : "l") as Cell["align"],
        color:
          i === 0 || t === "0"
            ? undefined
            : [p.accent, p.warn, p.ok, p.crit][i - 1],
      })),
    ),
  ];
  table(b, X0, Y0 + 240, W, H - 240, [620, 277, 277, 277, 277], rows, 30);
}

function teamLayout(b: Builder, slide: Extract<Slide, { kind: "team" }>) {
  const p = b.p;
  const cells = slide.cells.slice(0, 6);
  const cols = cells.length <= 3 ? cells.length : 3;
  b.text(
    X0,
    Y0 - 8,
    W,
    40,
    [
      para(
        `${slide.present} présent${slide.present > 1 ? "s" : ""} sur ${slide.total} personne${slide.total > 1 ? "s" : ""}`,
        26,
        p.text2,
      ),
    ],
    { anim: b.anim("fade") },
  );
  grid(cells.length, cols, X0, Y0 + 48, W, H - 48).forEach((r, i) => {
    const c = cells[i];
    const color = hexColor(c.color, CYCLE(p)[i % 4]);
    const inner = r.w - 72;
    const detail = [
      c.kind !== c.name && c.kind,
      c.location,
      c.radio && `radio ${c.radio}`,
    ]
      .filter(Boolean)
      .join(" · ");
    const room = Math.max(
      1,
      Math.floor((r.h - 72 - 46 - (detail ? 40 : 0) - 10) / 40),
    );
    const members = c.members.slice(
      0,
      c.members.length > room ? room - 1 : room,
    );
    const paras: Para[] = [
      para(clipLine(c.name, inner, 36, true), 36, p.text, {
        bold: true,
        font: "display",
        after: 4,
      }),
    ];
    if (detail)
      paras.push(para(clipLine(detail, inner, 22), 22, p.text2, { after: 14 }));
    for (const m of members)
      paras.push({
        runs: [
          {
            text: clipLine(m.role || "—", inner * 0.52, 26, true),
            bold: true,
            color: m.status === "Présent" ? p.text : p.text3,
          },
          {
            text: `  ${clipLine(m.name, inner * 0.48 - 24, 26)}`,
            color: p.text2,
          },
        ],
        size: 26,
        color: p.text,
        after: 10,
      });
    if (c.members.length > members.length)
      paras.push(
        para(
          `+ ${c.members.length - members.length} autre${c.members.length - members.length > 1 ? "s" : ""}`,
          22,
          p.text3,
        ),
      );
    if (!c.members.length)
      paras.push(para("Personne n’est affecté.", 24, p.text3));
    b.card(r.x, r.y, r.w, r.h, { anim: b.anim("rise"), pad: 36, paras });
    b.box("Couleur", r.x, r.y + 24, 8, r.h - 48, {
      fill: color,
      radius: 4,
      anim: b.with("fade"),
    });
  });
}

function radioLayout(b: Builder, slide: Extract<Slide, { kind: "radio" }>) {
  const p = b.p;
  kpis(
    b,
    slide.stats.map((s) => ({
      label: s.label,
      value: s.value,
      tone: toneColor(p, s.tone),
    })),
    Y0,
    190,
  );
  const top = Y0 + 220;
  const left = slide.groups.length ? 1060 : 0;
  if (slide.groups.length) {
    const rows: Cell[][] = [
      ["Groupe", "N°", "Usage", "Mode"].map((t) => ({
        text: t,
        bold: true,
        color: p.text2,
      })),
      ...slide.groups.map((g) => [
        { text: g.name, bold: true },
        { text: g.number || "—", color: p.cyan },
        { text: g.usage },
        { text: g.mode, color: p.text2 },
      ]),
    ];
    table(b, X0, top, left, Y1 - top, [440, 160, 260, 200], rows, 28);
  }
  const x = X0 + (left ? left + GAP : 0);
  const w = X1 - x;
  const weak = slide.weak.slice(0, 7);
  b.card(x, top, w, Math.min(Y1 - top, 110 + Math.max(1, weak.length) * 52), {
    anim: b.anim("rise"),
    fill: weak.length ? p.crit : p.ok,
    alpha: 0.1,
    line: weak.length ? p.crit : p.ok,
    paras: [
      para(
        weak.length ? "LIAISONS FAIBLES OU NULLES" : "LIAISONS",
        22,
        weak.length ? p.crit : p.ok,
        {
          bold: true,
          spacing: 2,
          after: 16,
        },
      ),
      ...(weak.length
        ? weak.map((c) => ({
            runs: [
              { text: `${c.time}  `, color: p.text3 },
              { text: clipLine(c.callsign, w * 0.45, 26, true), bold: true },
              {
                text: `  ${clipLine(c.result, w * 0.4, 22)}`,
                color: p.crit,
                size: 22,
              },
            ],
            size: 26,
            color: p.text,
            after: 12,
          }))
        : [para("Aucune liaison faible au dernier contrôle.", 26, p.text)]),
    ],
  });
}

function weatherLayout(b: Builder, slide: Extract<Slide, { kind: "weather" }>) {
  const p = b.p;
  let x = X0;
  if (slide.now) {
    const w = 600;
    b.card(X0, Y0, w, H, {
      anim: b.anim("zoom"),
      valign: "m",
      paras: [
        para("MAINTENANT", 22, p.accent, { bold: true, spacing: 3, after: 12 }),
        para(slide.now.temperature, 170, p.amber, {
          bold: true,
          font: "display",
          after: 0,
        }),
        fitted(slide.now.label, w - 64, 110, 44, 28, p.text, {
          bold: true,
          after: 24,
        }),
        para(`Vent ${slide.now.wind}`, 26, p.text2, { after: 10 }),
        para(`Précipitations ${slide.now.precipitation}`, 26, p.text2, {
          after: 10,
        }),
        para(`Humidité ${slide.now.humidity}`, 26, p.text2, { after: 24 }),
        para(clipLine(slide.source, w - 64, 18), 18, p.text3),
      ],
    });
    x += w + GAP;
  }
  const w = X1 - x;
  let y = Y0;
  if (slide.hours.length) {
    const n = slide.hours.length;
    grid(n, n, x, y, w, 300, 14).forEach((r, i) => {
      const h = slide.hours[i];
      b.card(r.x, r.y, r.w, r.h, {
        pad: 14,
        radius: 18,
        valign: "m",
        anim: b.anim("rise", 80),
        paras: [
          para(h.time, 24, p.cyan, {
            bold: true,
            font: "mono",
            align: "c",
            after: 10,
          }),
          para(h.temperature, 52, p.text, { bold: true, align: "c", after: 8 }),
          fitted(h.label, r.w - 28, 60, 19, 14, p.text2, {
            align: "c",
            maxLines: 2,
            after: 8,
          }),
          para(h.precipitation, 19, p.text3, { align: "c" }),
        ],
      });
    });
    y += 300 + GAP;
  }
  const alerts = slide.alerts.slice(0, slide.observation ? 3 : 4);
  const ah = 116;
  alerts.forEach((a) => {
    const tone = toneColor(p, a.tone);
    b.card(x, y, w, ah, {
      fill: tone,
      alpha: 0.1,
      line: tone,
      anim: b.anim("rise"),
      pad: 0,
    });
    b.box("Degré", x + 20, y + 18, 80, 80, {
      fill: tone,
      radius: 16,
      valign: "m",
      anim: b.with("zoom"),
      paras: [para(a.level, 48, p.bg, { bold: true, align: "c" })],
    });
    b.text(
      x + 124,
      y + 16,
      w - 150,
      ah - 32,
      [
        para(
          clipLine(
            `${a.hazard}${a.region ? ` · ${a.region}` : ""}`,
            w - 150,
            30,
            true,
          ),
          30,
          p.text,
          { bold: true, after: 6 },
        ),
        para(
          clipLine(`Degré ${a.level} · ${a.period}`, w - 150, 22),
          22,
          p.text2,
        ),
      ],
      { valign: "m", anim: b.with("fade") },
    );
    y += ah + 18;
  });
  if (slide.observation && y + 100 <= Y1) {
    b.card(x, y, w, Math.min(150, Y1 - y), {
      anim: b.anim("rise"),
      paras: [
        para(
          clipLine(
            `OBSERVATION ${slide.observation.time} · ${slide.observation.place}`.toUpperCase(),
            w - 64,
            20,
            true,
          ),
          20,
          p.cyan,
          {
            bold: true,
            spacing: 2,
            after: 8,
          },
        ),
        fitted(
          slide.observation.text,
          w - 64,
          Math.min(150, Y1 - y) - 100,
          28,
          18,
          p.text,
        ),
      ],
    });
  }
}

function agendaLayout(b: Builder, slide: Extract<Slide, { kind: "agenda" }>) {
  const p = b.p;
  const items = slide.items;
  const rowH = Math.min(116, H / items.length);
  items.forEach((it, i) => {
    const y = Y0 + i * rowH;
    const tone = it.late ? p.crit : it.next ? p.accent : p.line;
    b.card(X0, y, W, rowH - 16, {
      pad: 0,
      fill: it.next || it.late ? tone : p.surface,
      alpha: it.next || it.late ? 0.14 : p.dark ? 0.92 : 1,
      line: tone,
      lineW: it.next ? 3 : 2,
      anim: b.anim("rise"),
    });
    const mid = rowH - 16;
    b.text(
      X0 + 32,
      y,
      170,
      mid,
      [
        para(it.time, 40, it.late ? p.crit : p.cyan, {
          bold: true,
          font: "mono",
        }),
      ],
      {
        valign: "m",
        anim: b.with("fade"),
      },
    );
    const tw = W - 32 - 190 - 330;
    b.text(
      X0 + 222,
      y,
      tw,
      mid,
      [
        para(clipLine(it.title, tw, 32, true), 32, p.text, {
          bold: true,
          after: 4,
        }),
        para(clipLine(it.detail, tw, 22), 22, p.text2),
      ],
      { valign: "m", anim: b.with("fade") },
    );
    const label = it.late
      ? "dépassé"
      : it.next
        ? `Prochain · ${it.relative}`
        : it.relative;
    const pw = textWidth(label, 22, true) + 40;
    b.box("Délai", X1 - 32 - pw, y + (mid - 44) / 2, pw, 44, {
      fill: it.late ? p.crit : it.next ? p.accent : p.text3,
      alpha: 0.16,
      radius: 22,
      valign: "m",
      pad: 0,
      anim: b.with("fade"),
      paras: [
        para(label, 22, it.late ? p.crit : it.next ? p.accent : p.text2, {
          bold: true,
          align: "c",
        }),
      ],
    });
  });
}

function closingLayout(
  b: Builder,
  slide: Extract<Slide, { kind: "closing" }>,
  ctx: LayoutContext,
) {
  const p = b.p;
  b.text(X0, 90, W, 36, [
    para(slide.kicker.toUpperCase(), 24, p.accent, {
      bold: true,
      spacing: 5,
      align: "c",
    }),
  ]);
  b.text(
    X0,
    200,
    W,
    220,
    [
      para(slide.title, 170, p.text, {
        bold: true,
        font: "display",
        align: "c",
      }),
    ],
    {
      valign: "m",
      anim: b.anim("zoom"),
    },
  );
  const who = [slide.presenter, slide.organization]
    .filter(Boolean)
    .join("  ·  ");
  if (who)
    b.text(
      X0,
      440,
      W,
      50,
      [para(clipLine(who, W, 34), 34, p.text2, { align: "c" })],
      { anim: b.anim("fade") },
    );
  if (slide.next)
    b.text(
      X0,
      510,
      W,
      50,
      [
        para(clipLine(slide.next, W, 32, true), 32, p.cyan, {
          bold: true,
          align: "c",
        }),
      ],
      {
        anim: b.anim("fade"),
      },
    );
  const contacts = slide.contacts;
  if (contacts.length) {
    const cw = Math.min(
      520,
      (W - GAP * (contacts.length - 1)) / contacts.length,
    );
    const total = cw * contacts.length + GAP * (contacts.length - 1);
    const x0 = (PAGE_W - total) / 2;
    contacts.forEach((c, i) => {
      b.card(x0 + i * (cw + GAP), 630, cw, 220, {
        anim: b.anim("rise"),
        valign: "m",
        paras: [
          fitted(c.name, cw - 64, 64, 28, 22, p.text, {
            bold: true,
            after: 6,
            maxLines: 2,
          }),
          para(clipLine(c.role || " ", cw - 64, 22), 22, p.text2, {
            after: 12,
          }),
          para(clipLine(c.phone || "—", cw - 64, 32, true), 32, p.accent, {
            bold: true,
            font: "mono",
          }),
        ],
      });
    });
  }
  if (ctx.images.has("qr"))
    b.shapes.push({
      type: "image",
      name: "Code de vérification",
      key: "qr",
      x: X1 - 130,
      y: PAGE_H - 260,
      w: 130,
      h: 130,
      anim: b.anim("fade"),
    });
}

/** Shapes of every slide of a deck. */
export function layoutDeck(deck: Deck, ctx: LayoutContext): SlideLayout[] {
  const count = deck.slides.length;
  return deck.slides.map((slide, index) => {
    const b = new Builder(ctx.palette, ctx.animations);
    background(b);
    const full = slide.kind === "title" || slide.kind === "closing";
    if (!full && slide.kind !== "map") heading(b, slide.kicker, slide.title);
    switch (slide.kind) {
      case "title":
        titleLayout(b, slide, ctx);
        break;
      case "situation":
        situationLayout(b, slide);
        break;
      case "facts":
        factsLayout(b, slide);
        break;
      case "map":
        mapLayout(b, slide, ctx);
        break;
      case "changes":
        changesLayout(b, slide);
        break;
      case "highlights":
        highlightsLayout(b, slide);
        break;
      case "missions":
        missionsLayout(b, slide);
        break;
      case "resources":
        resourcesLayout(b, slide);
        break;
      case "team":
        teamLayout(b, slide);
        break;
      case "radio":
        radioLayout(b, slide);
        break;
      case "weather":
        weatherLayout(b, slide);
        break;
      case "agenda":
        agendaLayout(b, slide);
        break;
      case "closing":
        closingLayout(b, slide, ctx);
        break;
    }
    if (slide.kind !== "title")
      footer(b, ctx, deck, index, count, slide.kind === "map");
    else
      b.text(X0, PAGE_H - 62, 1400, 30, [
        para(clipLine(ctx.footer, 1400, 20), 20, ctx.palette.text3),
      ]);
    watermark(b, ctx.watermark ?? deck.watermark);
    return {
      id: slide.id,
      title: slide.title,
      background: ctx.palette.bg,
      shapes: b.shapes,
      notes: slide.notes,
      transition:
        slide.kind === "title" || slide.kind === "map" ? "fade" : "push",
    };
  });
}
