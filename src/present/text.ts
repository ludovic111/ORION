// Text measurement without a browser, for the slide files: widths of Arial /
// Helvetica (AFM, 1/1000 em) with a safety margin, so a text laid out here
// fits once PowerPoint, LibreOffice or the PDF writer wraps it itself.

const ASCII = [
  278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278,
  278, 556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 278, 278, 584, 584,
  584, 556, 1015, 667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556,
  833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 278,
  278, 278, 469, 556, 333, 556, 556, 500, 556, 556, 278, 556, 556, 222, 222,
  500, 222, 833, 556, 556, 556, 556, 333, 500, 278, 556, 500, 722, 500, 500,
  500, 334, 260, 334, 584,
];
const SPECIAL: Record<string, number> = {
  "’": 222,
  "‘": 222,
  "«": 556,
  "»": 556,
  "·": 278,
  "—": 1000,
  "–": 556,
  "…": 1000,
  "→": 1000,
  "°": 400,
  "€": 556,
  œ: 944,
  Œ: 1000,
  æ: 889,
  ß: 611,
  " ": 278,
  " ": 200,
};
/** Margin for bold text and for fonts slightly wider than Arial. */
const SAFETY = 1.06;

function charWidth(ch: string): number {
  const code = ch.charCodeAt(0);
  if (code >= 32 && code < 127) return ASCII[code - 32];
  if (SPECIAL[ch] !== undefined) return SPECIAL[ch];
  const base = ch.normalize("NFD")[0];
  const b = base.charCodeAt(0);
  if (base !== ch && b >= 32 && b < 127) return ASCII[b - 32];
  return 600;
}

/** Width of a text in the unit of `size` (px of the 1920×1080 slide). */
export function textWidth(text: string, size: number, bold = false) {
  let w = 0;
  for (const ch of text) w += charWidth(ch);
  return (w / 1000) * size * SAFETY * (bold ? 1.07 : 1);
}

/** Greedy word wrap; hard line breaks are kept. */
export function wrap(
  text: string,
  width: number,
  size: number,
  bold = false,
): string[] {
  const out: string[] = [];
  for (const para of text.split("\n")) {
    const words = para.split(/ +/).filter((w, i) => w || i === 0);
    let line = "";
    for (let word of words) {
      const next = line ? `${line} ${word}` : word;
      if (textWidth(next, size, bold) <= width) {
        line = next;
        continue;
      }
      if (line) out.push(line);
      // A word longer than the line is cut.
      while (textWidth(word, size, bold) > width && word.length > 1) {
        let cut = word.length - 1;
        while (cut > 1 && textWidth(word.slice(0, cut), size, bold) > width)
          cut--;
        out.push(word.slice(0, cut));
        word = word.slice(cut);
      }
      line = word;
    }
    out.push(line);
  }
  return out;
}

export type Fitted = { size: number; text: string; lines: number };

/**
 * Largest font size (from `max` down to `min`) at which the text fits the
 * box; at `min`, the text is cut with an ellipsis.
 */
export function fitText(
  text: string,
  width: number,
  height: number,
  max: number,
  min: number,
  options: { bold?: boolean; lineHeight?: number; maxLines?: number } = {},
): Fitted {
  const lh = options.lineHeight ?? 1.2;
  const clean = text.trim();
  for (let size = max; size >= min; size -= size > 40 ? 4 : 2) {
    const lines = wrap(clean, width, size, options.bold);
    const allowed = Math.min(
      options.maxLines ?? Infinity,
      Math.floor(height / (size * lh)),
    );
    if (lines.length <= allowed)
      return { size, text: clean, lines: lines.length };
  }
  const lines = wrap(clean, width, min, options.bold);
  const allowed = Math.max(
    1,
    Math.min(options.maxLines ?? Infinity, Math.floor(height / (min * lh))),
  );
  const kept = lines.slice(0, allowed);
  let last = kept[kept.length - 1] ?? "";
  while (last && textWidth(`${last}…`, min, options.bold) > width)
    last = last.slice(0, -1);
  kept[kept.length - 1] = `${last.trimEnd()}…`;
  return { size: min, text: kept.join(" "), lines: kept.length };
}

/** One line, cut with an ellipsis to a width. */
export function clipLine(
  text: string,
  width: number,
  size: number,
  bold = false,
) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (textWidth(clean, size, bold) <= width) return clean;
  let cut = clean;
  while (cut && textWidth(`${cut}…`, size, bold) > width)
    cut = cut.slice(0, -1);
  return `${cut.trimEnd()}…`;
}

// Characters XML 1.0 does not allow, even escaped.
const INVALID = /[\u0000-\u0008\u000b\u000c\u000e-\u001f￾￿]/g;
export const esc = (value: string | number) =>
  String(value)
    .replace(INVALID, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

function parseHex(value: string | undefined | null): string | null {
  const v = (value ?? "").trim();
  if (/^#?[0-9a-f]{6}$/i.test(v)) return v.replace("#", "").toUpperCase();
  if (/^#[0-9a-f]{3}$/i.test(v))
    return [...v.slice(1)]
      .map((c) => c + c)
      .join("")
      .toUpperCase();
  return null;
}
/**
 * A colour as six upper-case hex digits (no "#"). Records hold free text
 * ("red", anything typed): only "#rrggbb", "rrggbb" and "#rgb" are kept,
 * anything else gives the fallback (itself checked).
 */
export const hexColor = (value: string | undefined | null, fallback: string) =>
  parseHex(value) ?? parseHex(fallback) ?? "808080";
/** A record colour as CSS ("#RRGGBB"), or "" when it is not a colour. */
export const cssColor = (value: string | undefined | null) => {
  const hex = parseHex(value);
  return hex ? `#${hex}` : "";
};
