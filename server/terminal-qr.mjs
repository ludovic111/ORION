import qrcode from "qrcode-generator";

// QR code drawn in a terminal with Unicode half blocks: one character holds
// two modules stacked (▀ top, ▄ bottom, █ both), so the code keeps square
// proportions. Pure functions: no colour, no output, easy to test.

/** Dark modules of a QR code, row by row (error correction M). */
export function qrModules(text, level = "M") {
  const code = qrcode(0, level);
  code.addData(text);
  code.make();
  const size = code.getModuleCount();
  return Array.from({ length: size }, (_, r) =>
    Array.from({ length: size }, (_, c) => code.isDark(r, c)),
  );
}

const GLYPHS = [" ", "▄", "▀", "█"];

/**
 * Lines of text drawing `text` as a QR code, with a quiet zone of `margin`
 * light modules on each side. The glyphs mark dark modules; `invert` marks
 * the light ones instead, for a light-on-dark terminal without colours.
 */
export function terminalQr(text, { margin = 4, invert = false } = {}) {
  const modules = qrModules(text);
  const size = modules.length + 2 * margin;
  const dark = (r, c) => {
    // The half row under an odd-sized code is terminal background.
    if (r >= size) return false;
    const row = modules[r - margin];
    const value = !!row && !!row[c - margin];
    return invert ? !value : value;
  };
  const lines = [];
  for (let r = 0; r < size; r += 2) {
    let line = "";
    for (let c = 0; c < size; c++)
      line += GLYPHS[(dark(r, c) ? 2 : 0) + (dark(r + 1, c) ? 1 : 0)];
    lines.push(line);
  }
  return lines;
}

/** Same lines, black on a white background (ANSI), for any terminal theme. */
export const ansiQr = (lines) => lines.map((l) => `\x1b[30;47m${l}\x1b[0m`);
