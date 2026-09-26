import test from "node:test";
import assert from "node:assert/strict";
import { newJournal } from "../shared/journal.ts";
import { upsert, opsSchema } from "../shared/ops.ts";
import { fromMN95 } from "../shared/coordinates.ts";
import {
  kmlCoordinates,
  parseGeoFile,
  toGeoJSON,
  toKML,
} from "../src/modules/map/geoformats.ts";

const kml = (body) =>
  `<?xml version="1.0"?><kml xmlns="http://www.opengis.net/kml/2.2"><Document>${body}</Document></kml>`;

test("KML coordinates: spaces after commas, empty members never read as 0", () => {
  assert.deepEqual(kmlCoordinates("7.1, 46.1 7.2, 46.2"), [
    [46.1, 7.1],
    [46.2, 7.2],
  ]);
  assert.deepEqual(kmlCoordinates("7.1,46.1,500\n\t7.2 ,46.2 ,510"), [
    [46.1, 7.1],
    [46.2, 7.2],
  ]);
  const [bad] = kmlCoordinates("7.1,");
  assert.ok(Number.isNaN(bad[0]));
  const r = parseGeoFile(
    "a.kml",
    kml(
      `<Placemark><name>Ligne</name><LineString><coordinates>7.1, 46.1 7.2, 46.2</coordinates></LineString></Placemark>` +
        `<Placemark><name>Vide</name><Point><coordinates>,46.1</coordinates></Point></Placemark>`,
    ),
  );
  assert.equal(r.features.length, 1);
  assert.deepEqual(r.features[0].points, [
    [46.1, 7.1],
    [46.2, 7.2],
  ]);
  assert.equal(r.skipped, 1);
});

test("GeoJSON: null or empty coordinates are refused, not placed at 0", () => {
  const r = parseGeoFile(
    "a.geojson",
    JSON.stringify({
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: { type: "Point", coordinates: [7.1, null] },
        },
        {
          type: "Feature",
          geometry: { type: "Point", coordinates: ["", 46.1] },
        },
        {
          type: "Feature",
          geometry: { type: "Point", coordinates: [7.1, "46.1"] },
        },
        {
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: [
              [7.1, 46.1],
              [null, 46.2],
              [7.3, 46.3],
            ],
          },
        },
      ],
    }),
  );
  assert.equal(r.skipped, 2);
  assert.deepEqual(r.features[0].points, [[46.1, 7.1]]);
  assert.equal(r.features[1].points.length, 2);
  for (const f of r.features)
    for (const [lat, lng] of f.points) assert.ok(lat !== 0 && lng !== 0);
});

test("Swiss GeoJSON: MN95 and MN03, by crs member or by magnitude", () => {
  const bern = fromMN95(2600000, 1200000);
  const point = (coordinates, crs) =>
    JSON.stringify({
      type: "FeatureCollection",
      ...(crs && { crs: { type: "name", properties: { name: crs } } }),
      features: [
        {
          type: "Feature",
          properties: { name: "Bern" },
          geometry: { type: "Point", coordinates },
        },
      ],
    });
  for (const [text, crs] of [
    [point([2600000, 1200000], "urn:ogc:def:crs:EPSG::2056"), "MN95"],
    [point([2600000, 1200000]), "MN95"],
    [point([600000, 200000], "EPSG:21781"), "MN03"],
    [point([600000, 200000]), "MN03"],
  ]) {
    const r = parseGeoFile("x.geojson", text);
    assert.equal(r.crs, crs);
    const [lat, lng] = r.features[0].points[0];
    assert.ok(
      Math.abs(lat - bern.lat) < 1e-6 && Math.abs(lng - bern.lng) < 1e-6,
    );
  }
  // geo.admin.ch style feature collection with a polygon.
  const r = parseGeoFile(
    "zones.json",
    JSON.stringify({
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: {
            type: "Polygon",
            coordinates: [
              [
                [2600000, 1200000],
                [2601000, 1200000],
                [2601000, 1201000],
                [2600000, 1200000],
              ],
            ],
          },
        },
      ],
    }),
  );
  assert.equal(r.features[0].kind, "area");
  assert.equal(r.features[0].points.length, 3);
});

test("KML folders become layers; polygon holes are kept", () => {
  const ring = (pts) => pts.map(([lng, lat]) => `${lng},${lat}`).join(" ");
  const outer = [
    [7.0, 46.0],
    [7.1, 46.0],
    [7.1, 46.1],
    [7.0, 46.1],
    [7.0, 46.0],
  ];
  const inner = [
    [7.02, 46.02],
    [7.05, 46.02],
    [7.05, 46.05],
    [7.02, 46.02],
  ];
  const r = parseGeoFile(
    "zones.kml",
    kml(
      `<Folder><name>Dangers</name>` +
        `<Folder><name>Zone rouge</name><Placemark><name>Z1</name><Polygon><outerBoundaryIs><LinearRing><coordinates>${ring(outer)}</coordinates></LinearRing></outerBoundaryIs><innerBoundaryIs><LinearRing><coordinates>${ring(inner)}</coordinates></LinearRing></innerBoundaryIs></Polygon></Placemark></Folder>` +
        `<Placemark><name>P</name><Point><coordinates>7.05,46.05</coordinates></Point></Placemark>` +
        `</Folder><Placemark><name>Hors dossier</name><Point><coordinates>7.2,46.2</coordinates></Point></Placemark>`,
    ),
  );
  const byName = new Map(r.features.map((f) => [f.label, f]));
  assert.equal(byName.get("Z1").layer, "Zone rouge");
  assert.equal(byName.get("P").layer, "Dangers");
  assert.equal(byName.get("Hors dossier").layer, undefined);
  assert.equal(byName.get("Z1").points.length, 4);
  assert.equal(byName.get("Z1").holes.length, 1);
  assert.equal(byName.get("Z1").holes[0].length, 3);
});

test("holes survive the journal, GeoJSON and KML; GeoJSON also in MN95", () => {
  const j = newJournal("Crue");
  let ops = upsert(
    j.ops,
    "places",
    {
      label: "Zone",
      kind: "area",
      symbol: "",
      color: "",
      layer: "Effets",
      notes: "",
      points: [
        [46.0, 7.0],
        [46.0, 7.1],
        [46.1, 7.1],
        [46.1, 7.0],
      ],
      holes: [
        [
          [46.02, 7.02],
          [46.02, 7.05],
          [46.05, 7.05],
        ],
      ],
    },
    "Alice",
  );
  ops = upsert(
    ops,
    "places",
    {
      label: "Berne",
      kind: "point",
      symbol: "b:pc",
      color: "",
      layer: "Emplacements",
      notes: "",
      points: [[46.95108, 7.43864]],
    },
    "Alice",
  );
  ops = opsSchema.parse(ops);
  const journal = { ...j, ops };
  const back = parseGeoFile("x.geojson", toGeoJSON(journal));
  assert.equal(back.features[0].holes.length, 1);
  const fromKml = parseGeoFile("x.kml", toKML(journal));
  assert.equal(fromKml.features.find((f) => f.kind === "area").holes.length, 1);
  const swiss = JSON.parse(toGeoJSON(journal, "", { crs: "EPSG:2056" }));
  assert.match(swiss.crs.properties.name, /2056/);
  const pc = swiss.features.find((f) => f.properties.name === "Berne");
  assert.ok(Math.abs(pc.geometry.coordinates[0] - 2600000) < 5);
  assert.ok(Math.abs(pc.geometry.coordinates[1] - 1200000) < 5);
  const again = parseGeoFile("x.geojson", JSON.stringify(swiss));
  assert.equal(again.crs, "MN95");
  assert.equal(again.features.length, 2);
});
