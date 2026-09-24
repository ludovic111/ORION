import { demoWorkspace } from "../src/journal/demo.ts";
import { journalSchema } from "../shared/journal.ts";
import { emptyOps, upsert } from "../shared/ops.ts";
import { emptyRadio } from "../shared/radio.ts";
import { stampJournal } from "../shared/sync.ts";
import { encodePng } from "../src/present/png.ts";

// A demo-like operation for the presentation tests: the demonstration
// journal, one hour of recorded history (a key fact that moved, a new
// resource), a second map and a forecast.

export function briefingJournal() {
  const base = demoWorkspace().journals[0];
  const t0 = Date.parse(base.createdAt);
  const at = (minutes) => new Date(t0 + minutes * 60_000).toISOString();
  // Everything of the demonstration recorded as created at t0 + 1 min.
  const start = { ...base, history: [], sync: { clock: {}, removed: {} } };
  const blank = journalSchema.parse({
    ...start,
    entries: [],
    ops: { ...emptyOps(), settings: start.ops.settings },
    radio: emptyRadio(),
  });
  let journal = stampJournal(blank, start, at(1), "Opérateur A");
  const facts = journal.ops.facts.map((f) =>
    f.label === "Personnes évacuées" ? { ...f, value: "31" } : f,
  );
  let ops = { ...journal.ops, facts };
  ops = upsert(
    ops,
    "resources",
    {
      name: "Détachement sanitaire",
      kind: "Personnel",
      organization: "Sanitaire",
      callsign: "San 1",
      count: 4,
      status: "Engagé",
      location: "Point de rassemblement Acacias",
      mission: "Soutien sanitaire des évacués.",
      eta: "",
      contact: "",
      notes: "",
    },
    "Opérateur B",
  );
  ops = upsert(
    ops,
    "maps",
    {
      name: "Secteur Acacias",
      purpose: "Détail du secteur inondé",
      base: "aerial",
      lat: 46.194,
      lng: 6.139,
      zoom: 16,
      hidden: [],
      order: 1,
      notes: "",
    },
    "Opérateur B",
  );
  ops = upsert(
    ops,
    "forecasts",
    {
      fetchedAt: at(2),
      place: "Carouge (GE)",
      lat: 46.18,
      lng: 6.14,
      data: {
        model: "ICON-CH2",
        current: {
          at: t0,
          temperature: 11.4,
          humidity: 92,
          precipitation: 1.8,
          code: 63,
          wind: 22,
          direction: 225,
          gusts: 48,
        },
        hours: Array.from({ length: 24 }, (_, i) => ({
          at: t0 + i * 3_600_000,
          temperature: 11 + Math.sin(i / 3),
          precipitation: i < 8 ? 2.1 : 0.2,
          probability: 80,
          code: i < 8 ? 63 : 3,
          wind: 20,
          gusts: 45,
        })),
        days: [],
      },
    },
    "Opérateur B",
  );
  journal = stampJournal(
    journal,
    journalSchema.parse({ ...journal, ops }),
    at(90),
    "Opérateur B",
  );
  return { journal, at: t0 + 100 * 60_000 };
}

/** A small grey PNG standing for a rendered map. */
export function fakeMap(width = 480, height = 270) {
  const px = new Uint8Array(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    const x = i % width;
    const y = Math.floor(i / width);
    px.set(
      [200 + ((x >> 4) & 1) * 20, 214, 228 - ((y >> 4) & 1) * 20, 255],
      i * 4,
    );
  }
  return { bytes: encodePng(width, height, px, 4), width, height };
}
