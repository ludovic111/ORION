import test from "node:test";
import assert from "node:assert/strict";
import { toMN95, fromMN95 } from "../shared/coordinates.ts";
test("MN95 matches both independent swisstopo published numerical examples", () => {
  const p = toMN95(46 + 2 / 60 + 38.87 / 3600, 8 + 43 / 60 + 49.79 / 3600);
  assert.ok(Math.abs(p.east - 2699999.76) < 0.02);
  assert.ok(Math.abs(p.north - 1099999.97) < 0.02);
  const w = fromMN95(2700000, 1100000);
  assert.ok(Math.abs(w.lat - (46 + 2 / 60 + 38.86 / 3600)) < 0.000003);
  assert.ok(Math.abs(w.lng - (8 + 43 / 60 + 49.8 / 3600)) < 0.000003);
});
test("MN95 round trips remain within five metres across the supported Geneva area", () => {
  for (let lat = 45.8; lat <= 46.6; lat += 0.02)
    for (let lng = 5.7; lng <= 6.7; lng += 0.02) {
      const p = toMN95(lat, lng),
        w = fromMN95(p.east, p.north);
      const metres = Math.hypot(
        (w.lat - lat) * 111320,
        (w.lng - lng) * 111320 * Math.cos((lat * Math.PI) / 180),
      );
      assert.ok(metres < 5, `Round trip error: ${metres} m`);
    }
  for (const [lat, lng] of [
    [NaN, 6],
    [46, Infinity],
    [0, 0],
    [90, 180],
  ])
    assert.throws(() => toMN95(lat, lng), RangeError);
});
