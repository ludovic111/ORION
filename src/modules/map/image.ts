// Images of the custom symbols: read a file, remove a uniform background,
// trim the transparent margins, shrink and store as PNG. Everything happens
// in the browser; SVG files are rasterised so no markup is ever stored.

export const MAX_INPUT = 2 * 1024 * 1024;
export const MAX_SIDE = 256;
const MAX_DATA_URL = 600_000;
const WORK_SIDE = 1024;

const ACCEPTED = ["image/png", "image/svg+xml", "image/jpeg", "image/webp"];
export const ACCEPT_ATTR = ".png,.svg,.jpg,.jpeg,.webp," + ACCEPTED.join(",");

function kindOf(file: File) {
  const name = file.name.toLowerCase();
  if (file.type === "image/svg+xml" || name.endsWith(".svg")) return "svg";
  if (ACCEPTED.includes(file.type) || /\.(png|jpe?g|webp)$/.test(name))
    return "raster";
  return "";
}

/** Refuse SVG with scripts, embedded HTML or external resources. */
export function checkSvg(text: string) {
  const t = text.toLowerCase();
  if (!/<svg[\s>]/.test(t)) throw new Error("Ce fichier SVG est illisible.");
  if (/<script|<foreignobject|<iframe|<object|<embed/.test(t))
    throw new Error(
      "Ce SVG contient du code ou du contenu intégré : il est refusé.",
    );
  if (/\son[a-z]+\s*=/.test(t) || /javascript:/.test(t))
    throw new Error("Ce SVG contient des actions : il est refusé.");
  if (
    /(?:href|src)\s*=\s*["']\s*(?:https?:|\/\/|file:)/.test(t) ||
    /url\(\s*["']?\s*(?:https?:|\/\/)/.test(t) ||
    /@import/.test(t)
  )
    throw new Error("Ce SVG charge des ressources externes : il est refusé.");
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Image illisible."));
    img.src = src;
  });
}

/** Read a file into a canvas (longest side at most 1024 px). */
export async function readSymbolFile(file: File): Promise<HTMLCanvasElement> {
  if (file.size > MAX_INPUT)
    throw new Error("Image trop lourde : 2 Mo au maximum.");
  const kind = kindOf(file);
  if (!kind)
    throw new Error("Format non pris en charge : PNG, SVG, JPEG ou WebP.");
  let img: HTMLImageElement;
  let width = 0;
  let height = 0;
  if (kind === "svg") {
    const text = await file.text();
    checkSvg(text);
    const url = URL.createObjectURL(
      new Blob([text], { type: "image/svg+xml" }),
    );
    try {
      img = await loadImage(url);
    } finally {
      URL.revokeObjectURL(url);
    }
    // SVG without size: use the viewBox, or a square.
    width = img.naturalWidth;
    height = img.naturalHeight;
    if (!width || !height) {
      const box =
        /viewBox\s*=\s*["']\s*[-\d.]+[\s,]+[-\d.]+[\s,]+([\d.]+)[\s,]+([\d.]+)/i.exec(
          text,
        );
      width = box ? Number(box[1]) : 512;
      height = box ? Number(box[2]) : 512;
    }
    // Vector: draw large for a crisp result.
    const up = WORK_SIDE / Math.max(width, height);
    width *= up;
    height *= up;
  } else {
    const url = URL.createObjectURL(file);
    try {
      img = await loadImage(url);
    } finally {
      URL.revokeObjectURL(url);
    }
    width = img.naturalWidth;
    height = img.naturalHeight;
  }
  if (!width || !height) throw new Error("Image vide.");
  const k = Math.min(1, WORK_SIDE / Math.max(width, height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width * k));
  canvas.height = Math.max(1, Math.round(height * k));
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas;
}

/** A copy of an image given as data URL (to edit an existing symbol). */
export async function canvasFromDataUrl(src: string) {
  const img = await loadImage(src);
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth || MAX_SIDE;
  canvas.height = img.naturalHeight || MAX_SIDE;
  canvas
    .getContext("2d", { willReadFrequently: true })!
    .drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas;
}

function clone(source: HTMLCanvasElement) {
  const c = document.createElement("canvas");
  c.width = source.width;
  c.height = source.height;
  c.getContext("2d", { willReadFrequently: true })!.drawImage(source, 0, 0);
  return c;
}

/**
 * Make transparent the background colour connected to the edges (flood
 * fill), with a soft border. `tolerance`: 0 (exact colour) to 100.
 */
export function removeBackground(
  source: HTMLCanvasElement,
  tolerance: number,
): HTMLCanvasElement {
  const canvas = clone(source);
  const { width: w, height: h } = canvas;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  const image = ctx.getImageData(0, 0, w, h);
  const d = image.data;
  // Background: the most frequent opaque colour of the border.
  const counts = new Map<number, number>();
  const border: number[] = [];
  for (let x = 0; x < w; x++) border.push(x, (h - 1) * w + x);
  for (let y = 0; y < h; y++) border.push(y * w, y * w + w - 1);
  for (const i of border) {
    const o = i * 4;
    if (d[o + 3] < 128) continue;
    const key = ((d[o] >> 3) << 10) | ((d[o + 1] >> 3) << 5) | (d[o + 2] >> 3);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  if (!counts.size) return canvas;
  const best = [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
  let r = 0;
  let g = 0;
  let b = 0;
  let n = 0;
  for (const i of border) {
    const o = i * 4;
    const key = ((d[o] >> 3) << 10) | ((d[o + 1] >> 3) << 5) | (d[o + 2] >> 3);
    if (key !== best || d[o + 3] < 128) continue;
    r += d[o];
    g += d[o + 1];
    b += d[o + 2];
    n++;
  }
  r /= n;
  g /= n;
  b /= n;
  const limit = 6 + (tolerance / 100) * 160;
  const soft = limit * 1.6;
  const dist = (o: number) =>
    Math.sqrt(
      (d[o] - r) ** 2 * 0.3 +
        (d[o + 1] - g) ** 2 * 0.59 +
        (d[o + 2] - b) ** 2 * 0.11,
    ) * 1.7;
  const seen = new Uint8Array(w * h);
  const stack: number[] = [];
  for (const i of border) {
    if (seen[i]) continue;
    const o = i * 4;
    if (d[o + 3] === 0 || dist(o) <= limit) {
      seen[i] = 1;
      stack.push(i);
    }
  }
  while (stack.length) {
    const i = stack.pop()!;
    const o = i * 4;
    d[o + 3] = 0;
    const x = i % w;
    const y = (i - x) / w;
    const next = [
      x > 0 ? i - 1 : -1,
      x < w - 1 ? i + 1 : -1,
      y > 0 ? i - w : -1,
      y < h - 1 ? i + w : -1,
    ];
    for (const j of next) {
      if (j < 0 || seen[j]) continue;
      const q = j * 4;
      const e = d[q + 3] === 0 ? 0 : dist(q);
      if (e <= limit) {
        seen[j] = 1;
        stack.push(j);
      } else if (e < soft) {
        // Anti-aliased edge: partly transparent.
        seen[j] = 2;
        d[q + 3] = Math.min(
          d[q + 3],
          Math.round((255 * (e - limit)) / (soft - limit)),
        );
      }
    }
  }
  ctx.putImageData(image, 0, 0);
  return canvas;
}

/** Crop the transparent margins (keeps a 2 px border). */
export function trim(source: HTMLCanvasElement): HTMLCanvasElement {
  const { width: w, height: h } = source;
  const d = source
    .getContext("2d", { willReadFrequently: true })!
    .getImageData(0, 0, w, h).data;
  let top = h;
  let left = w;
  let right = -1;
  let bottom = -1;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++)
      if (d[(y * w + x) * 4 + 3] > 8) {
        if (x < left) left = x;
        if (x > right) right = x;
        if (y < top) top = y;
        if (y > bottom) bottom = y;
      }
  if (right < 0) return source;
  const m = 2;
  left = Math.max(0, left - m);
  top = Math.max(0, top - m);
  right = Math.min(w - 1, right + m);
  bottom = Math.min(h - 1, bottom + m);
  const c = document.createElement("canvas");
  c.width = right - left + 1;
  c.height = bottom - top + 1;
  c.getContext("2d")!.drawImage(
    source,
    left,
    top,
    c.width,
    c.height,
    0,
    0,
    c.width,
    c.height,
  );
  return c;
}

/** Shrink so that the longest side is at most `side` (by halves: smooth). */
export function shrink(source: HTMLCanvasElement, side = MAX_SIDE) {
  let c = source;
  while (Math.max(c.width, c.height) > side) {
    const k = Math.max(0.5, side / Math.max(c.width, c.height));
    const next = document.createElement("canvas");
    next.width = Math.max(1, Math.round(c.width * k));
    next.height = Math.max(1, Math.round(c.height * k));
    const ctx = next.getContext("2d")!;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(c, 0, 0, next.width, next.height);
    c = next;
  }
  return c;
}

/** Final image of a symbol: PNG data URL within the stored size. */
export function finish(
  source: HTMLCanvasElement,
  options: { transparent: boolean; tolerance: number },
): string {
  let c = options.transparent
    ? removeBackground(source, options.tolerance)
    : source;
  c = trim(c);
  for (const side of [MAX_SIDE, 192, 128, 96]) {
    const url = shrink(c, side).toDataURL("image/png");
    if (url.length <= MAX_DATA_URL) return url;
  }
  throw new Error("Image trop détaillée pour être enregistrée.");
}
