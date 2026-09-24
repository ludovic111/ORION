import test from "node:test";
import assert from "node:assert/strict";
import { journalSchema, newJournal } from "../shared/journal.ts";
import { upsert } from "../shared/ops.ts";
import {
  parseGeoFile,
  parseXml,
  toGPX,
  toGeoJSON,
  toKML,
} from "../src/modules/map/geoformats.ts";
import { onMap, placesOf, simplify } from "../src/modules/map/maps.ts";

const NORTH = "11111111-1111-4111-8111-111111111111";
const MAIN = "22222222-2222-4222-8222-222222222222";

function sample() {
  let ops = newJournal("Exercice « Crue » & test").ops;
  const map = (id, name, order) => ({
    id,
    name,
    purpose: "",
    base: "color",
    lat: 46.2,
    lng: 6.14,
    zoom: 14,
    order,
    notes: "",
  });
  ops = upsert(ops, "maps", map(MAIN, "Suivi général", 0), "Alice");
  ops = upsert(ops, "maps", map(NORTH, "Secteur Nord", 1), "Alice");
  ops = upsert(
    ops,
    "places",
    {
      label: "PC front <A&B>",
      kind: "point",
      symbol: "b:pc-front",
      color: "",
      layer: "Emplacements",
      points: [[46.1953, 6.1463]],
      notes: "Accès par la rue du Lac\nsecond accès fermé",
      size: 1.5,
      rotation: 30,
    },
    "Alice",
  );
  ops = upsert(
    ops,
    "places",
    {
      label: "Fermeture des berges",
      kind: "line",
      symbol: "",
      color: "#34e0a1",
      layer: "Mesures",
      points: [
        [46.1962, 6.1441],
        [46.1956, 6.1467],
        [46.1948, 6.149],
      ],
      notes: "",
      weight: 6,
      dash: "dash",
      maps: [NORTH],
    },
    "Bruno",
  );
  ops = upsert(
    ops,
    "places",
    {
      label: "Zone inondée",
      kind: "area",
      symbol: "",
      color: "",
      layer: "Effets",
      points: [
        [46.1941, 6.1352],
        [46.1952, 6.1391],
        [46.1938, 6.1419],
      ],
      notes: "",
      maps: [MAIN],
    },
    "Bruno",
  );
  ops = upsert(
    ops,
    "places",
    {
      label: "Secteur nord",
      kind: "text",
      symbol: "",
      color: "#1a1a1a",
      layer: "Autre",
      points: [[46.2, 6.15]],
      notes: "",
      boxed: false,
    },
    "Alice",
  );
  return journalSchema.parse({
    ...newJournal("Exercice « Crue » & test"),
    ops,
  });
}

const byLabel = (features) =>
  Object.fromEntries(features.map((f) => [f.label, f]));

test("objects of a map: own objects and objects shown on every map", () => {
  const j = sample();
  const all = placesOf(j.ops.places, j.ops.maps, "");
  assert.equal(all.length, 4);
  const north = placesOf(j.ops.places, j.ops.maps, NORTH).map((p) => p.label);
  assert.deepEqual(north.sort(), [
    "Fermeture des berges",
    "PC front <A&B>",
    "Secteur nord",
  ]);
  // An object whose maps all disappeared is shown everywhere.
  assert.ok(
    onMap(
      { maps: ["33333333-3333-4333-8333-333333333333"] },
      NORTH,
      new Set([NORTH]),
    ),
  );
  assert.ok(!onMap({ maps: [MAIN] }, NORTH, new Set([NORTH, MAIN])));
});

test("GeoJSON export then import keeps geometry, order and style", () => {
  const j = sample();
  const text = toGeoJSON(j);
  const data = JSON.parse(text);
  assert.equal(data.type, "FeatureCollection");
  assert.equal(data.features.length, 4);
  const pc = data.features.find((f) => f.properties.name === "PC front <A&B>");
  // GeoJSON is [lng, lat].
  assert.deepEqual(pc.geometry.coordinates, [6.1463, 46.1953]);
  assert.equal(pc.properties.symbolName, "PC front");
  assert.equal(pc.properties.by, "Alice");
  const area = data.features.find((f) => f.geometry.type === "Polygon");
  const ring = area.geometry.coordinates[0];
  assert.deepEqual(ring[0], ring[ring.length - 1]);

  const back = parseGeoFile("carte.geojson", text);
  assert.equal(back.format, "GeoJSON");
  assert.equal(back.features.length, 4);
  const f = byLabel(back.features);
  assert.deepEqual(f["PC front <A&B>"].points, [[46.1953, 6.1463]]);
  assert.equal(f["PC front <A&B>"].symbol, "b:pc-front");
  assert.equal(f["PC front <A&B>"].size, 1.5);
  assert.equal(f["PC front <A&B>"].rotation, 30);
  assert.equal(
    f["PC front <A&B>"].notes,
    "Accès par la rue du Lac\nsecond accès fermé",
  );
  assert.equal(f["Fermeture des berges"].dash, "dash");
  assert.equal(f["Fermeture des berges"].weight, 6);
  assert.equal(f["Zone inondée"].kind, "area");
  assert.equal(f["Zone inondée"].points.length, 3);
  assert.equal(f["Secteur nord"].kind, "text");
  assert.equal(f["Secteur nord"].boxed, false);
});

test("export of one map only", () => {
  const j = sample();
  const data = JSON.parse(toGeoJSON(j, MAIN));
  assert.deepEqual(data.features.map((f) => f.properties.name).sort(), [
    "PC front <A&B>",
    "Secteur nord",
    "Zone inondée",
  ]);
  assert.match(data.name, /Suivi général/);
});

test("KML export then import", () => {
  const j = sample();
  const text = toKML(j);
  assert.match(text, /^<\?xml/);
  assert.match(text, /PC front &lt;A&amp;B&gt;/);
  assert.match(text, /<coordinates>6\.1463,46\.1953<\/coordinates>/);
  const back = parseGeoFile("carte.kml", text);
  assert.equal(back.format, "KML");
  const f = byLabel(back.features);
  assert.equal(back.features.length, 4);
  assert.deepEqual(f["PC front <A&B>"].points, [[46.1953, 6.1463]]);
  assert.equal(f["PC front <A&B>"].layer, "Emplacements");
  assert.equal(f["Fermeture des berges"].color, "#34e0a1");
  assert.equal(f["Zone inondée"].kind, "area");
  assert.equal(f["Zone inondée"].points.length, 3);
  assert.equal(f["Secteur nord"].kind, "text");
});

test("GPX export then import", () => {
  const j = sample();
  const text = toGPX(j);
  assert.match(text, /<wpt lat="46\.1953" lon="6\.1463">/);
  const back = parseGeoFile("trace.gpx", text);
  assert.equal(back.format, "GPX");
  const f = byLabel(back.features);
  assert.equal(back.features.length, 4);
  assert.equal(f["Fermeture des berges"].kind, "line");
  assert.equal(f["Fermeture des berges"].points.length, 3);
  assert.equal(f["Zone inondée"].kind, "area");
  assert.equal(f["Zone inondée"].points.length, 3);
  assert.equal(f["PC front <A&B>"].symbol, "b:pc-front");
  assert.equal(
    f["PC front <A&B>"].notes,
    "Accès par la rue du Lac\nsecond accès fermé",
  );
});

test("third-party KML: styles, MultiGeometry, CDATA and namespaces", () => {
  const kml = `<?xml version="1.0" encoding="UTF-8"?>
<!-- exported by a partner -->
<kml xmlns="http://www.opengis.net/kml/2.2" xmlns:gx="http://www.google.com/kml/ext/2.2">
<Document>
  <Style id="red"><LineStyle><color>ff0000ff</color><width>4</width></LineStyle></Style>
  <StyleMap id="m"><Pair><key>normal</key><styleUrl>#red</styleUrl></Pair></StyleMap>
  <Folder><name>Dossier</name>
  <Placemark><name>Secteur &amp; zone</name><styleUrl>#m</styleUrl>
    <description><![CDATA[<b>Zone</b> évacuée<br/>à 14:00]]></description>
    <MultiGeometry>
      <Point><coordinates> 7.44,46.95,0 </coordinates></Point>
      <Polygon><outerBoundaryIs><LinearRing><coordinates>
        7.1,46.1 7.2,46.1 7.2,46.2 7.1,46.1
      </coordinates></LinearRing></outerBoundaryIs></Polygon>
    </MultiGeometry>
  </Placemark>
  <Placemark><name>Trace</name><gx:Track><gx:coord>7.0 46.0 500</gx:coord><gx:coord>7.1 46.1 510</gx:coord></gx:Track></Placemark>
  <Placemark><name>Invalide</name><Point><coordinates>999,999</coordinates></Point></Placemark>
  </Folder>
</Document></kml>`;
  const r = parseGeoFile("partenaire.kml", kml);
  assert.equal(r.features.length, 3);
  assert.equal(r.skipped, 1);
  const [point, area, track] = r.features;
  assert.equal(point.label, "Secteur & zone");
  assert.equal(point.notes, "Zone évacuée\nà 14:00");
  assert.deepEqual(point.points, [[46.95, 7.44]]);
  assert.equal(area.kind, "area");
  assert.equal(area.points.length, 3);
  assert.equal(area.color, "#ff0000");
  assert.equal(area.weight, 4);
  assert.equal(track.kind, "line");
  assert.deepEqual(track.points, [
    [46, 7],
    [46.1, 7.1],
  ]);
});

test("third-party GeoJSON and GPX", () => {
  const geo = JSON.stringify({
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: { name: "Route", stroke: "#00f" },
        geometry: {
          type: "MultiLineString",
          coordinates: [
            [
              [6, 46],
              [6.1, 46.1],
            ],
            [
              [6.2, 46.2],
              [6.3, 46.3],
            ],
          ],
        },
      },
      {
        type: "Feature",
        properties: null,
        geometry: {
          type: "MultiPoint",
          coordinates: [
            [6, 46],
            [7, 47],
          ],
        },
      },
      { type: "Feature", properties: {}, geometry: null },
    ],
  });
  const g = parseGeoFile("x.json", geo);
  assert.equal(g.features.length, 4);
  assert.equal(g.skipped, 1);
  assert.equal(g.features[0].color, "#0000ff");
  assert.deepEqual(g.features[2].points, [[46, 6]]);

  const gpx = `<?xml version="1.0"?><gpx version="1.1" xmlns="http://www.topografix.com/GPX/1/1">
<wpt lat="46.5" lon="6.6"><name>Refuge</name><desc>Point d’eau</desc></wpt>
<rte><name>Itinéraire</name><rtept lat="46.5" lon="6.6"/><rtept lat="46.6" lon="6.7"/></rte>
<trk><name>Patrouille</name><trkseg><trkpt lat="46.1" lon="6.1"></trkpt><trkpt lat="46.2" lon="6.2"></trkpt></trkseg></trk>
</gpx>`;
  const r = parseGeoFile("x.gpx", gpx);
  assert.deepEqual(
    r.features.map((f) => [f.kind, f.label]),
    [
      ["point", "Refuge"],
      ["line", "Itinéraire"],
      ["line", "Patrouille"],
    ],
  );
  assert.equal(r.features[0].notes, "Point d’eau");
});

test("very long paths are reduced to 2000 points", () => {
  const coords = Array.from({ length: 5000 }, (_, i) => [
    6 + i / 10000,
    46 + Math.sin(i / 50) / 100,
  ]);
  const r = parseGeoFile(
    "long.geojson",
    JSON.stringify({ type: "LineString", coordinates: coords }),
  );
  assert.equal(r.features.length, 1);
  assert.ok(r.features[0].points.length <= 2000);
  assert.equal(r.simplified, 1);
});

test("Douglas–Peucker keeps the ends and the corners", () => {
  const pts = [
    [0, 0],
    [1, 0.01],
    [2, 0],
    [2, 2],
    [2.01, 3],
    [2, 4],
  ];
  assert.deepEqual(simplify(pts, 0.1), [
    [0, 0],
    [2, 0],
    [2, 4],
  ]);
});

test("XML reader: entities, attributes with '>' and unknown formats", () => {
  const x = parseXml(`<a b="1 &gt; 0" c='x>y'><c:d>&#233;t&#xE9;</c:d></a>`);
  assert.equal(x.attrs.b, "1 > 0");
  assert.equal(x.attrs.c, "x>y");
  assert.equal(x.children[0].name, "d");
  assert.equal(x.children[0].text, "été");
  assert.throws(
    () => parseGeoFile("note.txt", "bonjour"),
    /Format non reconnu/,
  );
});

test("colours are normalised to #rrggbb on import", async () => {
  const { hexColor } = await import("../src/modules/map/maps.ts");
  assert.equal(hexColor("#ABC"), "#aabbcc");
  assert.equal(hexColor("rouge"), "#e5243b");
  assert.equal(hexColor('a"b'), "");
  assert.equal(hexColor(undefined), "");
  const geo = JSON.stringify({
    type: "Feature",
    properties: {
      name: "x",
      kind: "point",
      layer: "Autre",
      color: 'red" onload="x',
    },
    geometry: { type: "Point", coordinates: [6, 46] },
  });
  assert.equal(parseGeoFile("x.geojson", geo).features[0].color, "");
  const kml = `<kml><Placemark><name>a</name><ExtendedData><Data name="kind"><value>point</value></Data><Data name="layer"><value>A</value></Data><Data name="color"><value>blue</value></Data></ExtendedData><Point><coordinates>6,46</coordinates></Point></Placemark></kml>`;
  assert.equal(parseGeoFile("x.kml", kml).features[0].color, "#0000ff");
});
