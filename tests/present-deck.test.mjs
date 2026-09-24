import test from "node:test";
import assert from "node:assert/strict";
import { newJournal } from "../shared/journal.ts";
import {
  SLIDE_INFO,
  arrangeDeck,
  buildDeck,
  parseNumber,
  relative,
  watermarkFor,
} from "../src/present/deck.ts";
import {
  DARK,
  LIGHT,
  PAGE_H,
  PAGE_W,
  layoutDeck,
} from "../src/present/layout.ts";
import { fitText, textWidth, wrap } from "../src/present/text.ts";
import { briefingJournal } from "./present-fixture.mjs";

const { journal, at } = briefingJournal();
const since = Date.parse(journal.createdAt) + 30 * 60_000;
const deck = buildDeck(journal, {
  at,
  live: true,
  presenter: "Cap Fictif",
  audience: "Autorités communales",
  full: journal,
  since,
});

test("a demo operation gives every kind of slide, in order, with notes", () => {
  const kinds = deck.slides.map((s) => s.kind);
  for (const kind of [
    "title",
    "situation",
    "facts",
    "map",
    "changes",
    "highlights",
    "missions",
    "resources",
    "team",
    "radio",
    "weather",
    "agenda",
    "closing",
  ])
    assert.ok(kinds.includes(kind), kind);
  const order = SLIDE_INFO.map((i) => i.kind);
  const ranks = kinds.map((k) => order.indexOf(k));
  assert.deepEqual(
    ranks,
    [...ranks].sort((a, b) => a - b),
  );
  assert.equal(new Set(deck.slides.map((s) => s.id)).size, deck.slides.length);
  for (const s of deck.slides) assert.ok(s.notes.trim(), `notes of ${s.id}`);
  assert.equal(deck.watermark, "EXERCICE");
  assert.match(deck.when, /^Situation au \d\d\.\d\d\.\d{4} \d\d:\d\d$/);
});

test("key facts show their evolution since the moment compared with", () => {
  const facts = deck.slides.find((s) => s.kind === "facts");
  const evacuated = facts.facts.find((f) => f.label === "Personnes évacuées");
  assert.equal(evacuated.value, "31");
  assert.equal(evacuated.number, 31);
  assert.equal(evacuated.delta, "+19");
  assert.equal(evacuated.trend, "up");
  const changes = deck.slides.find((s) => s.kind === "changes");
  assert.ok(changes.total >= 2);
  assert.ok(changes.groups.some((g) => g.label === "Moyens" && g.created >= 1));
});

test("one slide per map, with a legend by layer", () => {
  const maps = deck.slides.filter((s) => s.kind === "map");
  assert.ok(maps.length >= 1);
  for (const m of maps) {
    assert.ok(m.id === "map" || m.id.startsWith("map:"));
    assert.ok(m.objects > 0 && m.legend.length > 0);
  }
});

test("the parts chosen filter the slides; empty parts give no slide", () => {
  const onlyMap = buildDeck(journal, {
    at,
    live: true,
    presenter: "",
    sections: ["map"],
  });
  // The evolution slide keeps only the changes of the map.
  assert.deepEqual(
    [...new Set(onlyMap.slides.map((s) => s.kind))].filter(
      (k) => k !== "changes",
    ),
    ["title", "map", "closing"],
  );
  const changes = onlyMap.slides.find((s) => s.kind === "changes");
  if (changes)
    assert.ok(
      changes.groups.every((g) => g.label === "Carte" || g.label === "Cartes"),
    );
  const empty = buildDeck(newJournal("Vide"), {
    at,
    live: true,
    presenter: "",
  });
  assert.deepEqual(
    empty.slides.map((s) => s.kind),
    ["title", "closing"],
  );
  const past = buildDeck(journal, {
    at,
    live: false,
    presenter: "",
    snapshot: "Point 14:00",
  });
  assert.match(past.when, /^Version du .* \(point « Point 14:00 »\)$/);
  assert.ok(past.slides[0].badges.some((b) => b.label === "VERSION PASSÉE"));
});

test("slides can be reordered and switched off", () => {
  const arranged = arrangeDeck(
    deck,
    ["closing", "weather"],
    ["title", "radio"],
  );
  assert.equal(arranged.slides[0].id, "closing");
  assert.equal(arranged.slides[1].id, "weather");
  assert.ok(!arranged.slides.some((s) => s.id === "title" || s.id === "radio"));
  assert.equal(arranged.slides.length, deck.slides.length - 2);
});

test("helpers: numbers, relative times, classification mark", () => {
  assert.equal(parseNumber("+ 45"), 45);
  assert.equal(parseNumber("1’200"), 1200);
  assert.equal(parseNumber("12,5"), 12.5);
  assert.equal(parseNumber("env. 12"), null);
  assert.equal(relative(90 * 60_000, 0), "dans 1 h 30");
  assert.equal(relative(0, 5 * 60_000), "il y a 5 min");
  assert.equal(
    watermarkFor({ mode: "Intervention", classification: "Confidentiel" }),
    "CONFIDENTIEL",
  );
  assert.equal(
    watermarkFor({ mode: "Intervention", classification: "Interne" }),
    "",
  );
});

test("text is measured, wrapped and fitted without a browser", () => {
  assert.ok(textWidth("MMMM", 20) > textWidth("iiii", 20));
  const lines = wrap(
    "Un texte assez long pour tenir sur plusieurs lignes",
    200,
    20,
  );
  assert.ok(lines.length > 1);
  for (const l of lines) assert.ok(textWidth(l, 20) <= 200);
  const fitted = fitText("mot ".repeat(200), 400, 100, 40, 16);
  assert.equal(fitted.size, 16);
  assert.ok(fitted.text.endsWith("…"));
});

test("every slide is laid out on the 16:9 page with staggered entrances", () => {
  for (const palette of [DARK, LIGHT]) {
    const slides = layoutDeck(deck, {
      palette,
      footer: "orion aic · test",
      images: new Set(["qr"]),
      animations: true,
    });
    assert.equal(slides.length, deck.slides.length);
    for (const s of slides) {
      const names = s.shapes.map((x) => x.name);
      assert.equal(
        new Set(names).size,
        names.length,
        `unique names on ${s.id}`,
      );
      for (const x of s.shapes) {
        if (x.name.startsWith("Lueur")) continue;
        assert.ok(x.x >= -1 && x.y >= -1, `${s.id} ${x.name} inside`);
        assert.ok(
          x.x + x.w <= PAGE_W + 1 && x.y + x.h <= PAGE_H + 1,
          `${s.id} ${x.name} inside`,
        );
      }
      assert.ok(
        s.shapes.some((x) => x.anim),
        `${s.id} animated`,
      );
      assert.ok(
        s.shapes.some((x) => x.name.startsWith("Filigrane")),
        `${s.id} watermark`,
      );
    }
  }
  const still = layoutDeck(deck, {
    palette: DARK,
    footer: "",
    images: new Set(),
    animations: false,
  });
  assert.ok(still.every((s) => s.shapes.every((x) => !x.anim)));
});
