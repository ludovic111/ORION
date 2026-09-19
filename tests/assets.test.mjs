import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
const digest = (b) => createHash("sha256").update(b).digest("hex");
test("All official SVGs match their recorded source hashes; display versions preserve all drawing content", async () => {
  const catalog = JSON.parse(
    await readFile("public/symbols/catalog.json", "utf8"),
  );
  assert.equal(catalog.length, 268);
  for (const symbol of catalog) {
    const original = await readFile(`public/symbols/${symbol.id}.svg`);
    assert.equal(digest(original), symbol.sha256, symbol.name);
    const display = await readFile(
      `public/symbols/display/${symbol.id}.svg`,
      "utf8",
    );
    assert.equal(
      original.toString().replace(/<svg\b[^>]*>/, "<svg>"),
      display.replace(/<svg\b[^>]*>/, "<svg>"),
      symbol.name,
    );
    assert.ok(
      !/<script|<foreignObject|\son\w+\s*=/i.test(display),
      symbol.name,
    );
    for (const match of display.matchAll(/(?:xlink:)?href="([^"]*)"/g))
      assert.ok(
        match[1].startsWith("#") ||
          /^data:(?:image|img)\/(?:png|jpeg|svg\+xml);base64,/.test(match[1]),
        `External resource in ${symbol.name}`,
      );
  }
});
test("Three different official base layers are locally available as JPEG", async () => {
  const hashes = [];
  for (const style of ["gray", "color", "aerial"]) {
    const tile = await readFile(`public/tiles/${style}/14/8471/5816.jpeg`);
    assert.equal(tile[0], 255);
    assert.equal(tile[1], 216);
    hashes.push(digest(tile));
  }
  assert.equal(new Set(hashes).size, 3);
});
