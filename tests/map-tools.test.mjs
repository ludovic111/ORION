import test from "node:test";
import assert from "node:assert/strict";
import {
  bearingOf,
  circlePoints,
  compass,
  lengthOf,
  parseRadii,
  sectorPoints,
} from "../src/modules/map/geo.ts";
import {
  PX_PER_MM,
  clipSegment,
  gridLabel,
  gridSpacing,
  gridValues,
  groundOf,
  printLayout,
  printZoom,
  scaleBar,
  scaleLabel,
  scaleOf,
} from "../src/modules/map/printscale.ts";
import { expandTerm, symbolMatches } from "../src/modules/map/symbolsearch.ts";
import { applyChange, diffOps, mergeChange } from "../src/modules/map/undo.ts";
import { profileKey, profileStats } from "../src/modules/map/profile.ts";
import { gridLines, gridSpacingForZoom } from "../src/modules/map/swissgrid.ts";
import {
  OVERLAYS,
  identifyUrl,
  readIdentify,
  readLive,
} from "../src/modules/map/overlays.ts";
import { newJournal } from "../shared/journal.ts";
import { addLink, ref } from "../shared/links.ts";
import { opsSchema, removeRecords, upsert } from "../shared/ops.ts";
import { toMN95 } from "../shared/coordinates.ts";

test("print to scale: A4 / A3, 1:5 000 to 1:50 000", () => {
  const a4 = printLayout("A4", "landscape");
  assert.deepEqual(a4.page, { w: 297, h: 210 });
  const a3 = printLayout("A3", "portrait");
  assert.deepEqual(a3.page, { w: 297, h: 420 });
  for (const l of [a4, a3]) {
    assert.ok(l.frame.y >= l.head.y + l.head.h);
    assert.ok(l.foot.y >= l.frame.y + l.frame.h);
    assert.ok(l.foot.y + l.foot.h <= l.page.h - 5);
  }
  // 277 mm of paper at 1:25 000 = 6.925 km of ground.
  assert.ok(Math.abs(groundOf({ w: 277, h: 100 }, 25000).w - 6925) < 1e-9);
  for (const scale of [5000, 10000, 25000, 50000]) {
    const z = printZoom(46.95, scale);
    assert.ok(Math.abs(scaleOf(46.95, z) - scale) < 1e-6, String(scale));
  }
  // At 1:25 000, 4 px per mm: 6.25 m per CSS pixel, about zoom 14.06 in
  // Bern (zoom 15 tiles once drawn at twice the resolution).
  const z = printZoom(46.95, 25000, PX_PER_MM);
  assert.ok(z > 14 && z < 14.1, String(z));
  assert.equal(scaleLabel(25000), "1:25'000");
  const bar = scaleBar(25000, 50);
  assert.equal(bar.metres, 1000);
  assert.equal(bar.mm, 40);
  assert.equal(scaleBar(5000, 50).label, "200 m");
  assert.equal(gridSpacing(25000), 1000);
  assert.equal(gridSpacing(5000), 100);
  assert.deepEqual(
    gridValues(2600100, 2603050, 1000),
    [2601000, 2602000, 2603000],
  );
  assert.equal(gridLabel(2601000, 1000), "2'601");
  assert.equal(gridLabel(2601100, 100), "2'601'100");
  const r = { x: 0, y: 0, w: 10, h: 10 };
  assert.deepEqual(clipSegment([-5, 5], [15, 5], r), [
    [0, 5],
    [10, 5],
  ]);
  assert.equal(clipSegment([-5, -5], [-1, 20], r), null);
});

test("concentric rings and a plume sector hold their distances", () => {
  assert.deepEqual(parseRadii("100, 300 1000"), [100, 300, 1000]);
  assert.deepEqual(parseRadii("1 km; 500m, 2.5km, 2"), [500, 1000, 2500]);
  assert.deepEqual(parseRadii("abc"), []);
  const center = [46.2044, 6.1432];
  for (const r of [100, 300, 1000]) {
    const ring = circlePoints(center, r);
    // Vertices rounded to 1e-6° (about 10 cm).
    for (const p of ring) assert.ok(Math.abs(lengthOf([center, p]) - r) < 0.2);
  }
  const wedge = sectorPoints(center, 45, 60, 2000);
  assert.deepEqual(wedge[0], [46.2044, 6.1432]);
  const arc = wedge.slice(1);
  for (const p of arc) assert.ok(Math.abs(lengthOf([center, p]) - 2000) < 0.2);
  const first = bearingOf(center, arc[0]);
  const last = bearingOf(center, arc[arc.length - 1]);
  assert.ok(Math.abs(first - 15) < 0.01, String(first));
  assert.ok(Math.abs(last - 75) < 0.01, String(last));
  // A sector across north.
  const north = sectorPoints(center, 0, 90, 500).slice(1);
  assert.ok(Math.abs(bearingOf(center, north[0]) - 315) < 0.05);
  assert.equal(compass(0), "N");
  assert.equal(compass(225), "SO");
  assert.equal(compass(350), "N");
});

test("symbol search understands German and Italian", () => {
  assert.ok(expandTerm("Feuer").includes("incendie"));
  assert.ok(expandTerm("frana").includes("glissement"));
  assert.ok(symbolMatches("Incendie isolé · Effets", "Feuer"));
  assert.ok(symbolMatches("Incendie isolé · Effets", "incendio"));
  assert.ok(symbolMatches("Blessés · Personnes", "Verletzte"));
  assert.ok(symbolMatches("Blessés · Personnes", "feriti"));
  assert.ok(symbolMatches("Zone inondée avec direction du flux", "Hochwasser"));
  assert.ok(symbolMatches("Glissement de terrain avec direction", "Erdrutsch"));
  assert.ok(symbolMatches("Ambulance · Véhicules", "Krankenwagen"));
  assert.ok(symbolMatches("Poste de commandement · Conduite", "posto comando"));
  assert.ok(symbolMatches("Hélicoptère", "helico"));
  assert.ok(!symbolMatches("Bateau", "Hochwasser"));
  assert.ok(!symbolMatches("Incendie isolé", "Verletzte"));
});

test("undo / redo of map changes, never over another post's change", () => {
  let ops = newJournal("x").ops;
  const place = (label) => ({
    label,
    kind: "point",
    symbol: "b:pc",
    color: "",
    layer: "Effets",
    notes: "",
    points: [[46.2, 6.14]],
  });
  // Create a place linked to an entry.
  const before = ops;
  const id = crypto.randomUUID();
  ops = upsert(ops, "places", { ...place("PC"), id }, "Alice");
  ops = addLink(
    ops,
    ref("place", id),
    ref("entry", crypto.randomUUID()),
    "position",
    "Alice",
  );
  const created = { at: 1, items: diffOps(before, ops) };
  assert.equal(created.items.length, 2);
  // Undo removes both; redo brings both back, schema-valid.
  const undone = applyChange(ops, created, "undo", "2026-01-01T10:00:00.000Z");
  assert.equal(undone.applied, 2);
  assert.equal(undone.ops.places.length, 0);
  assert.equal(undone.ops.links.length, 0);
  const redone = applyChange(
    undone.ops,
    undone.change,
    "redo",
    "2026-01-01T10:00:01.000Z",
  );
  assert.equal(redone.ops.places.length, 1);
  assert.equal(redone.ops.links.length, 1);
  opsSchema.parse(redone.ops);
  // A move, then another post renames the object: undo leaves it alone.
  let now = redone.ops;
  const moved = upsert(
    now,
    "places",
    { ...now.places[0], points: [[46.3, 6.2]] },
    "Alice",
  );
  const move = { at: 2, items: diffOps(now, moved) };
  now = {
    ...moved,
    places: moved.places.map((p) => ({
      ...p,
      label: "PC front",
      updatedAt: "2099-01-01T00:00:00.000Z",
    })),
  };
  const blocked = applyChange(now, move, "undo");
  assert.equal(blocked.conflicts, 1);
  assert.equal(blocked.ops.places[0].label, "PC front");
  // Removal undone.
  const removed = removeRecords(moved, [id]);
  const removal = { at: 3, items: diffOps(moved, removed) };
  const back = applyChange(removed, removal, "undo");
  assert.equal(back.ops.places.length, 1);
  assert.deepEqual(back.ops.places[0].points, [[46.3, 6.2]]);
  // Successive touches of the same object merge into one step.
  const a = {
    at: 10,
    items: [{ collection: "places", id, before: null, after: null }],
  };
  const b = {
    at: 11,
    items: [{ collection: "places", id, before: null, after: { id } }],
  };
  assert.equal(mergeChange(a, b).items[0].after.id, id);
  assert.equal(mergeChange(a, { ...b, at: 5000 }), null);
});

test("elevation profile statistics", () => {
  const s = profileStats([
    { dist: 0, alt: 500 },
    { dist: 100, alt: 520 },
    { dist: 200, alt: 510 },
    { dist: 300, alt: 560 },
  ]);
  assert.equal(s.length, 300);
  assert.equal(s.min, 500);
  assert.equal(s.max, 560);
  assert.equal(s.climb, 70);
  assert.equal(s.descent, 10);
  assert.equal(s.maxSlope, 50);
  assert.ok(Math.abs(s.meanSlope - 20) < 1e-9);
  assert.equal(profileStats([]).length, 0);
  assert.equal(
    profileKey([
      [46.1, 7.1],
      [46.2, 7.2],
    ]),
    profileKey([
      [46.1, 7.1],
      [46.2, 7.2],
    ]),
  );
  assert.notEqual(profileKey([[46.1, 7.1]]), profileKey([[46.1, 7.2]]));
});

test("Swiss grid lines follow the zoom and carry their MN95 value", () => {
  assert.equal(gridSpacingForZoom(17), 100);
  assert.equal(gridSpacingForZoom(13), 1000);
  assert.equal(gridSpacingForZoom(5), null);
  const lines = gridLines(
    [
      [46.93, 7.41],
      [46.97, 7.48],
    ],
    1000,
  );
  const east = lines.filter((l) => l.axis === "east");
  assert.ok(east.length >= 4);
  for (const l of east) {
    assert.equal(l.value % 1000, 0);
    for (const [lat, lng] of l.points)
      assert.ok(Math.abs(toMN95(lat, lng).east - l.value) < 1);
  }
  assert.deepEqual(
    gridLines(
      [
        [10, 10],
        [11, 11],
      ],
      1000,
    ),
    [],
  );
});

test("geo.admin.ch overlays: identify and live data read as text", () => {
  const ids = new Set(OVERLAYS.map((o) => o.id));
  assert.equal(ids.size, OVERLAYS.length);
  for (const o of OVERLAYS) assert.match(o.id, /^ch\.[a-z0-9.\-_]+$/);
  const url = identifyUrl(
    ["ch.kantone.cadastralwebmap-farbe"],
    [46.95, 7.44],
    [
      [46.94, 7.43],
      [46.96, 7.45],
    ],
    [800, 600],
  );
  assert.match(url, /identify\?/);
  assert.match(url, /sr=2056/);
  const rows = readIdentify({
    results: [
      {
        layerBodId: "ch.kantone.cadastralwebmap-farbe",
        attributes: {
          number: "823",
          egris_egrid: "CH294676423526",
          geoportal_url: "https://x",
          label: "<b>BE</b>",
        },
      },
    ],
  });
  assert.equal(rows[0].title, "Cadastre (parcelles)");
  assert.deepEqual(
    rows[0].rows.find((r) => r[0] === "Nom"),
    ["Nom", "BE"],
  );
  assert.ok(!rows[0].rows.some((r) => /url/i.test(r[0])));
  const hydro = readLive("hydro", {
    crs: { type: "name", properties: { name: "EPSG:2056" } },
    features: [
      {
        id: "2416",
        geometry: { type: "Point", coordinates: [2661390, 1230220] },
        properties: { name: "Aabach - Hitzkirch", "quant-class": 3 },
      },
    ],
  });
  assert.equal(hydro[0].level, 3);
  assert.ok(hydro[0].point[0] > 47 && hydro[0].point[1] > 8);
  const wind = readLive("wind", {
    features: [
      {
        id: "ARO",
        geometry: { type: "Point", coordinates: [2771036.8, 1184825.9] },
        properties: {
          station_name: "Arosa",
          value: 5.4,
          wind_direction: 332,
          unit: "km/h",
        },
      },
    ],
  });
  assert.equal(wind[0].direction, 332);
  assert.equal(wind[0].value, 5.4);
  const warn = readLive("warn", {
    features: [
      {
        id: 1,
        geometry: {
          type: "MultiLineString",
          coordinates: [
            [
              [2600000, 1200000],
              [2601000, 1201000],
            ],
          ],
        },
        properties: {
          "ws-class": "River.2",
          description: "<b>Aar</b>: Degré 2",
        },
      },
    ],
  });
  assert.equal(warn[0].level, 2);
  assert.equal(warn[0].title, "Aar: Degré 2");
});

test("a new map starts empty; objects of the first map stay on it", async () => {
  const { mapsForNewMap, strayObjects, onMap } =
    await import("../src/modules/map/maps.ts");
  const MAIN = "11111111-1111-4111-8111-111111111111";
  const NORTH = "22222222-2222-4222-8222-222222222222";
  const OTHER = "33333333-3333-4333-8333-333333333333";
  const place = (id, maps, createdAt = "2026-01-01T10:00:00.000Z") => ({
    id,
    maps,
    createdAt,
  });
  // One map named, objects drawn on it (maps: [] in earlier versions).
  const before = [place("a", []), place("b", [MAIN])];
  const after = mapsForNewMap(before, [MAIN], NORTH, null);
  assert.deepEqual(after[0].maps, [MAIN]);
  assert.equal(after[1], before[1]);
  const known = new Set([MAIN, NORTH]);
  assert.ok(after.every((p) => !onMap(p, NORTH, known)));
  assert.ok(after.every((p) => onMap(p, MAIN, known)));
  // Taking the objects along: shown on both maps.
  const along = mapsForNewMap(before, [MAIN], NORTH, MAIN);
  assert.ok(
    along.every((p) => onMap(p, NORTH, known) && onMap(p, MAIN, known)),
  );
  // Several maps: "every map" was chosen on purpose and stays.
  const shared = mapsForNewMap([place("c", [])], [MAIN, OTHER], NORTH, null);
  assert.deepEqual(shared[0].maps, []);
  // Objects left on every map by the earlier versions are recognised.
  const maps = [
    { id: MAIN, createdAt: "2026-01-01T09:00:00.000Z", order: 0 },
    { id: NORTH, createdAt: "2026-01-01T11:00:00.000Z", order: 1 },
  ];
  const strays = strayObjects(
    [
      place("old", [], "2026-01-01T10:00:00.000Z"),
      place("chosen", [], "2026-01-01T12:00:00.000Z"),
      place("own", [MAIN], "2026-01-01T10:00:00.000Z"),
    ],
    maps,
  );
  assert.equal(strays.home.id, MAIN);
  assert.deepEqual(
    strays.places.map((p) => p.id),
    ["old"],
  );
});
