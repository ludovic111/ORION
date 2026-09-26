import { test } from "node:test";
import assert from "node:assert/strict";
import {
  areaOf,
  bearingOf,
  destination,
  lengthOf,
  parseCoordinates,
} from "../src/modules/map/geo.ts";
import {
  fromMN03,
  fromMN95,
  isMN03,
  isMN95,
  toMN03,
  toMN95,
} from "../shared/coordinates.ts";

const BERN = fromMN95(2600000, 1200000);
const near = (a, b, eps = 1e-6) =>
  a && b && Math.abs(a[0] - b[0]) < eps && Math.abs(a[1] - b[1]) < eps;

test("typed coordinates: WGS84, DMS, DM, MN95 and MN03 in every usual form", () => {
  const dms = [46 + 56 / 60 + 53 / 3600, 7 + 26 / 60 + 51 / 3600];
  const table = [
    // Decimal degrees
    ["46.948, 7.447", [46.948, 7.447]],
    ["46.948 7.447", [46.948, 7.447]],
    ["46.948 7.447 520", [46.948, 7.447]], // altitude ignored
    ["46.948, 7.447, 520 m", [46.948, 7.447]],
    ["46,2044 6,1432", [46.2044, 6.1432]], // decimal commas
    ["6.1432, 46.2044", [46.2044, 6.1432]], // lng, lat (Swiss habit)
    ["46.948N 7.447E", [46.948, 7.447]],
    ["N 46.948 E 7.447", [46.948, 7.447]],
    ["7.447 E, 46.948 N", [46.948, 7.447]], // hemispheres decide
    ["-33.9, 18.4", [-33.9, 18.4]],
    ["33.9 S 18.4 E", [-33.9, 18.4]],
    // Degrees, minutes, seconds
    [`46°56'53"N 7°26'51"E`, dms],
    [`46° 56' 53" N, 7° 26' 51" E`, dms],
    ["46°56′53″N 7°26′51″E", dms], // unicode primes
    ["46°56’53”N 7°26’51”E", dms], // curly quotes
    ["N 46 56 53 E 7 26 51", dms],
    ["46 56 53 N 7 26 51 E", dms],
    [`46°56'53" 7°26'51"`, dms],
    // Degrees and decimal minutes
    ["46°56.8833'N 7°26.85'E", [46 + 56.8833 / 60, 7 + 26.85 / 60]],
    ["N 46° 56.8833' E 7° 26.85'", [46 + 56.8833 / 60, 7 + 26.85 / 60]],
    // MN95
    ["2600000 1200000", BERN],
    ["2 600 000 1 200 000", BERN],
    ["2'600'000 / 1'200'000", BERN],
    ["2’600’000 / 1’200’000", BERN],
    ["2600000-1200000", BERN],
    ["2600000/1200000", BERN],
    ["2600000, 1200000", BERN],
    ["E 2 600 000 N 1 200 000", BERN],
    ["E 2'600'000 · N 1'200'000", BERN],
    ["2600000 1200000 540", BERN], // altitude ignored
    ["MN95 2600000 1200000", BERN],
    ["LV95: 2'600'000.00 / 1'200'000.00", BERN],
    ["1200000 2600000", BERN], // north first: recognised by the ranges
    // MN03
    ["600000 200000", BERN],
    ["600 000 200 000", BERN],
    ["600'000 / 200'000", BERN],
    ["600000-200000", BERN],
    ["y = 600000, x = 200000", BERN],
    ["CH1903 600 000 / 200 000", BERN],
  ];
  for (const [input, expected] of table) {
    const got = parseCoordinates(input);
    const pair = Array.isArray(expected)
      ? expected
      : [expected.lat, expected.lng];
    assert.ok(near(got, pair, 1e-5), `${input} → ${JSON.stringify(got)}`);
  }
});

test("typed text that is not a position", () => {
  for (const input of [
    "",
    "Route de Nyon",
    "12, 5",
    "Route 12",
    "46°75'00\"N 7°10'00\"E", // 75 minutes
    "123456",
    "2600000",
    "0, 0",
    "95.5, 200.2",
  ])
    assert.equal(parseCoordinates(input), null, input);
});

test("MN03 is MN95 without the leading 2 / 1", () => {
  const a = fromMN03(600000, 200000);
  const b = fromMN95(2600000, 1200000);
  assert.deepEqual(a, b);
  const back = toMN03(a.lat, a.lng);
  assert.ok(
    Math.abs(back.east - 600000) < 1 && Math.abs(back.north - 200000) < 1,
  );
  assert.ok(isMN95(2600000, 1200000) && !isMN95(600000, 200000));
  assert.ok(isMN03(600000, 200000) && !isMN03(2600000, 1200000));
  const p = toMN95(46.2044, 6.1432);
  assert.ok(p.east > 2490000 && p.east < 2510000);
});

test("lengths and bearings are geodesics on the WGS84 ellipsoid", () => {
  // Vincenty's reference line (Flinders Peak → Buninyong): 54 972.271 m.
  const flinders = [
    -(37 + 57 / 60 + 3.7203 / 3600),
    144 + 25 / 60 + 29.5244 / 3600,
  ];
  const buninyong = [
    -(37 + 39 / 60 + 10.1561 / 3600),
    143 + 55 / 60 + 35.3839 / 3600,
  ];
  assert.ok(Math.abs(lengthOf([flinders, buninyong]) - 54972.271) < 0.01);
  assert.ok(
    Math.abs(bearingOf(flinders, buninyong) - (306 + 52 / 60 + 5.37 / 3600)) <
      1e-4,
  );
  // Bern → Zurich, about 95.5 km; destination() goes back exactly.
  const bern = [46.948, 7.4474];
  const zurich = [47.3769, 8.5417];
  const d = lengthOf([bern, zurich]);
  assert.ok(d > 94000 && d < 97000, String(d));
  const back = destination(bern, bearingOf(bern, zurich), d);
  assert.ok(near(back, zurich, 1e-7));
  // One degree of latitude at the equator is 110.574 km (not 111.32).
  assert.ok(
    Math.abs(
      lengthOf([
        [0, 0],
        [1, 0],
      ]) - 110574.4,
    ) < 1,
  );
});

test("areas: MN95 plane in Switzerland, holes removed", () => {
  const c = fromMN95(2600000, 1200000);
  const corner = (dx, dy) => {
    const p = fromMN95(2600000 + dx, 1200000 + dy);
    return [p.lat, p.lng];
  };
  const square = [
    corner(0, 0),
    corner(1000, 0),
    corner(1000, 1000),
    corner(0, 1000),
  ];
  assert.ok(Math.abs(areaOf(square) - 1e6) < 50, String(areaOf(square)));
  const hole = [
    corner(250, 250),
    corner(750, 250),
    corner(750, 750),
    corner(250, 750),
  ];
  assert.ok(Math.abs(areaOf(square, [hole]) - 750000) < 50);
  assert.ok(c.lat > 46);
});
