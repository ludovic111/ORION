import { test } from "node:test";
import assert from "node:assert/strict";
import { ansiQr, qrModules, terminalQr } from "../server/terminal-qr.mjs";

const URL = "https://10.42.0.1:4443";

/** Modules read back from the half blocks (true = glyph ink). */
function decode(lines) {
  const rows = [];
  for (const line of lines) {
    const chars = Array.from(line);
    rows.push(chars.map((c) => c === "▀" || c === "█"));
    rows.push(chars.map((c) => c === "▄" || c === "█"));
  }
  return rows;
}

test("the terminal QR code draws every module of the code", () => {
  const modules = qrModules(URL);
  const margin = 4;
  const lines = terminalQr(URL, { margin });
  const size = modules.length + 2 * margin;
  assert.equal(lines.length, Math.ceil(size / 2));
  for (const line of lines) {
    assert.equal(Array.from(line).length, size);
    assert.match(line, /^[ ▀▄█]+$/);
  }
  const rows = decode(lines);
  for (let r = 0; r < size; r++)
    for (let c = 0; c < size; c++) {
      const inside =
        r >= margin && c >= margin && r < size - margin && c < size - margin;
      const expected = inside ? modules[r - margin][c - margin] : false;
      assert.equal(rows[r][c], expected, `module ${r},${c}`);
    }
});

test("the quiet zone stays light, and inverted drawing marks it", () => {
  const lines = terminalQr(URL, { margin: 2 });
  assert.equal(lines[0].trim(), "");
  const inverted = terminalQr(URL, { margin: 2, invert: true });
  assert.match(inverted[0], /^█+$/);
  // Odd size: the half row under the code is background, not quiet zone.
  const size = qrModules(URL).length + 4;
  if (size % 2) assert.match(inverted[inverted.length - 1], /^▀+$/);
  const plain = decode(lines);
  const back = decode(inverted);
  for (let r = 0; r < size; r++)
    for (let c = 0; c < size; c++) assert.equal(back[r][c], !plain[r][c]);
});

test("the code is the standard one for the address", () => {
  const modules = qrModules(URL);
  // Version 2 (25 × 25) holds this address with correction level M.
  assert.equal(modules.length, 25);
  // Finder pattern in the top-left corner: dark ring, light ring, dark core.
  assert.deepEqual(modules[0].slice(0, 8), [...Array(7).fill(true), false]);
  assert.equal(modules[3][3], true);
  assert.equal(modules[1][1], false);
});

test("colour lines wrap each line in black on white", () => {
  const lines = ansiQr(["▀▄"]);
  assert.deepEqual(lines, ["\x1b[30;47m▀▄\x1b[0m"]);
});
