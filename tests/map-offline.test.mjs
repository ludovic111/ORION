import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { stripTypeScriptTypes } from "node:module";
import {
  LRU_PREFIX,
  TILE_BUDGETS,
  estimateBytes,
  evictionPlan,
  needsTouch,
  shellPlan,
  tileBucket,
  tileCount,
  tileRange,
  tilesOf,
  tileUrl,
} from "../src/modules/map/tilecache.ts";
import {
  latLngBounds,
  project,
  projectedBounds,
  unproject,
} from "../src/modules/map/projection.ts";
import { contentSecurityPolicy } from "../server/app.mjs";

const WMTS = (layer) =>
  `https://wmts.geo.admin.ch/1.0.0/${layer}/default/current/3857/15/17000/11500.jpeg`;

test("each background has its own tile budget", () => {
  assert.equal(tileBucket(WMTS("ch.swisstopo.pixelkarte-farbe")), "color");
  assert.equal(tileBucket(WMTS("ch.swisstopo.pixelkarte-grau")), "gray");
  assert.equal(tileBucket(WMTS("ch.swisstopo.swissimage")), "aerial");
  assert.equal(tileBucket("https://tile.openstreetmap.org/15/1/2.png"), "osm");
  assert.equal(tileBucket(WMTS("ch.bafu.aquaprotect_100")), "overlay");
  assert.equal(
    tileBucket("https://wms.geo.admin.ch/?SERVICE=WMS&LAYERS=x"),
    "overlay",
  );
  assert.equal(tileBucket("https://example.org/tile.png"), "");
  for (const b of ["color", "gray", "aerial", "osm", "overlay"])
    assert.ok(TILE_BUDGETS[b] > 500, b);
});

test("least recently used tiles go first; a touched tile moves to the end", () => {
  // Cache order: insertion order. The sector area was cached first...
  let keys = ["sector-1", "sector-2", "street-1", "street-2", "street-3"];
  // ...but it is still in use: each read past TOUCH_AFTER re-inserts it.
  const now = Date.now();
  assert.equal(needsTouch(String(now - 60_000), now), false);
  assert.equal(needsTouch(String(now - 7 * 3600_000), now), true);
  assert.equal(needsTouch(null, now), true);
  keys = [
    ...keys.filter((k) => !k.startsWith("sector")),
    "sector-1",
    "sector-2",
  ];
  assert.deepEqual(evictionPlan(keys, 3), ["street-1", "street-2"]);
  assert.deepEqual(evictionPlan(keys, 10), []);
  assert.deepEqual(evictionPlan(keys, 0), keys);
  assert.ok(LRU_PREFIX.startsWith("orion-aic-tiles-"));
});

test("the last three application versions stay available to open tabs", () => {
  let history = [];
  let existing = ["orion-aic-tiles-color", "orion-shell-old"];
  for (const v of ["a", "b", "c", "d"]) {
    const current = `orion-aic-shell-${v}`;
    existing = [...existing, current];
    const plan = shellPlan(history, current, existing);
    history = plan.history;
    existing = existing.filter((n) => !plan.remove.includes(n));
  }
  assert.deepEqual(history, [
    "orion-aic-shell-b",
    "orion-aic-shell-c",
    "orion-aic-shell-d",
  ]);
  assert.ok(existing.includes("orion-aic-tiles-color"));
  assert.ok(!existing.includes("orion-aic-shell-a"));
  assert.ok(!existing.includes("orion-shell-old"));
});

test("offline sector: tile count, list and size estimate", () => {
  const bern = [
    [46.93, 7.41],
    [46.97, 7.48],
  ];
  const r = tileRange(bern, 15);
  assert.ok(r.x1 >= r.x0 && r.y1 >= r.y0);
  const count = tileCount(bern, 12, 16);
  assert.equal(count, [...tilesOf(bern, 12, 16)].length);
  // Each zoom level has about four times the tiles of the previous one.
  assert.ok(tileCount(bern, 16, 16) > 2.5 * tileCount(bern, 15, 15));
  assert.equal(
    tileUrl("https://x/{z}/{x}/{y}.png", 3, 4, 5),
    "https://x/3/4/5.png",
  );
  assert.ok(estimateBytes(100, "aerial") > estimateBytes(100, "gray"));
});

test("the service worker inlines the shared tile rules", async () => {
  const source = await readFile("scripts/service-worker.mjs", "utf8");
  assert.match(source, /tilecache\.ts/);
  const rules = stripTypeScriptTypes(
    await readFile("src/modules/map/tilecache.ts", "utf8"),
  ).replace(/^export /gm, "");
  // Plain script, no module syntax left.
  assert.doesNotMatch(rules, /^\s*(import|export)\s/m);
  const fn = new Function(
    `${rules}; return { evictionPlan, tileBucket, shellPlan };`,
  )();
  assert.deepEqual(fn.evictionPlan(["a", "b", "c"], 1), ["a", "b"]);
});

test("bounds of 200 000 vertices without overflowing the stack", () => {
  const long = Array.from({ length: 200_000 }, (_, i) => [
    46 + (i % 1000) / 10000,
    7 + i / 1_000_000,
  ]);
  const box = projectedBounds([long, [[45.9, 6.9]]]);
  assert.ok(box && box.minX < box.maxX && box.minY < box.maxY);
  const ll = latLngBounds([long]);
  assert.deepEqual(ll[0], [46, 7]);
  assert.ok(Math.abs(ll[1][1] - (7 + 199_999 / 1_000_000)) < 1e-12);
  assert.equal(projectedBounds([]), null);
  const [lat, lng] = unproject(project([46.95, 7.44]));
  assert.ok(Math.abs(lat - 46.95) < 1e-9 && Math.abs(lng - 7.44) < 1e-9);
});

test("content policy: tiles, overlays, live data and profiles are reachable", async () => {
  const file = (await readFile("public/_headers", "utf8")).match(
    /Content-Security-Policy: (.+)/,
  )[1];
  const directive = (policy, name) =>
    policy
      .split(";")
      .map((d) => d.trim())
      .find((d) => d.startsWith(`${name} `)) ?? "";
  for (const policy of [file, contentSecurityPolicy("x", true)]) {
    for (const host of [
      "https://wmts.geo.admin.ch",
      "https://wms.geo.admin.ch",
      "https://tile.openstreetmap.org",
    ]) {
      assert.ok(directive(policy, "img-src").includes(host), host);
      assert.ok(directive(policy, "connect-src").includes(host), host);
    }
    for (const host of [
      "https://api3.geo.admin.ch",
      "https://data.geo.admin.ch",
    ])
      assert.ok(directive(policy, "connect-src").includes(host), host);
  }
});
