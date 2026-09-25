import { test } from "node:test";
import assert from "node:assert/strict";
import { areaOf, circlePoints, lengthOf } from "../src/modules/map/geo.ts";

test("a perimeter keeps its radius in every direction", () => {
  for (const [center, radius] of [
    [[46.2044, 6.1432], 300],
    [[47.3769, 8.5417], 1000],
    [[45.9, 7.0], 50],
  ]) {
    const points = circlePoints(center, radius);
    assert.equal(points.length, 72);
    for (const p of points) {
      const d = lengthOf([center, p]);
      assert.ok(Math.abs(d - radius) < 0.5, `${d} ≠ ${radius}`);
    }
    // 72 sides: within 0.2 % of the true disc.
    const disc = Math.PI * radius * radius;
    assert.ok(Math.abs(areaOf(points) - disc) / disc < 0.002);
  }
});
