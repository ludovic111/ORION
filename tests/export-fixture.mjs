import {
  emptyFields,
  journalSchema,
  makeEntry,
  newJournal,
} from "../shared/journal.ts";
import { upsert } from "../shared/ops.ts";
import { stampJournal } from "../shared/sync.ts";

// A small operation with a history, shared by the export tests: entries with
// versions and a deletion, resources that change state, two maps, contacts
// and rendez-vous with characters to escape, a forecast and a frozen point.

export const at = (minute) =>
  new Date(Date.UTC(2026, 8, 20, 8, minute)).toISOString();

const entry = (number, minute, fields, author = "Opérateur A") => {
  const e = makeEntry(
    number,
    "Test",
    {
      ...emptyFields(),
      happenedAt: at(minute),
      receivedAt: at(minute),
      ...fields,
    },
    author,
  );
  return {
    ...e,
    createdAt: at(minute),
    revisions: e.revisions.map((r) => ({ ...r, at: at(minute) })),
  };
};

export function operation() {
  let j = stampJournal(
    undefined,
    newJournal("Crue ; test, « Arve »", {
      organization: "PCi Genève",
      location: "Carouge",
      reference: "EX-1",
      mode: "Exercice",
      classification: "Confidentiel",
    }),
    at(0),
    "Chef",
  );
  j = { ...j, createdAt: at(0) };
  const step = (minute, by, change) => {
    const next = journalSchema.parse(change(j));
    j = stampJournal(j, next, at(minute), by);
  };
  const ids = {
    tp: crypto.randomUUID(),
    pio: crypto.randomUUID(),
    map1: crypto.randomUUID(),
    map2: crypto.randomUUID(),
    place: crypto.randomUUID(),
  };
  step(1, "Alice", (x) => ({
    ...x,
    ops: upsert(
      upsert(
        x.ops,
        "resources",
        {
          id: ids.tp,
          name: "Tonne-pompe 1",
          kind: "Véhicule",
          organization: "SIS",
          callsign: "TP1",
          count: 1,
          status: "Disponible",
          location: "Caserne",
          mission: "",
          eta: "",
          contact: "",
          notes: "=SUM(A1)",
        },
        "Alice",
      ),
      "resources",
      {
        id: ids.pio,
        name: "Pionniers",
        kind: "Personnel",
        organization: "PCi",
        callsign: "",
        count: 12,
        status: "Alerté",
        location: "",
        mission: "",
        eta: "",
        contact: "",
        notes: "",
      },
      "Alice",
    ),
  }));
  step(2, "Alice", (x) => ({
    ...x,
    entries: [
      entry(1, 2, {
        message: "Ouverture du poste. <b>Début</b> & suite",
        source: "PC",
        recipient: "Tous",
      }),
      entry(2, 3, {
        message: "Reconnaissance du pont | niveau à vérifier",
        status: "À traiter",
        priority: "Urgent",
        assignee: "Section 1",
        dueAt: at(20),
        type: "Mission",
      }),
      entry(3, 4, { message: "Entrée supprimée ensuite" }),
    ],
  }));
  step(5, "Bob", (x) => ({
    ...x,
    ops: upsert(
      upsert(
        upsert(
          x.ops,
          "maps",
          {
            id: ids.map1,
            name: "Suivi général",
            purpose: "Vue d’ensemble",
            base: "color",
            lat: 46.18,
            lng: 6.14,
            zoom: 13,
            hidden: [],
            order: 0,
            notes: "",
          },
          "Bob",
        ),
        "maps",
        {
          id: ids.map2,
          name: "Secteur : pont [nord]",
          purpose: "",
          base: "aerial",
          lat: 46.19,
          lng: 6.15,
          zoom: 16,
          hidden: [],
          order: 1,
          notes: "",
        },
        "Bob",
      ),
      "places",
      {
        id: ids.place,
        label: "PC front",
        kind: "point",
        symbol: "b:pc",
        color: "",
        layer: "Emplacements",
        points: [[46.1853, 6.1412]],
        notes: "",
        maps: [ids.map2],
      },
      "Bob",
    ),
  }));
  step(10, "Bob", (x) => ({
    ...x,
    ops: upsert(
      x.ops,
      "resources",
      { ...x.ops.resources[0], status: "Engagé", location: "Pont" },
      "Bob",
    ),
  }));
  step(12, "Alice", (x) => ({
    ...x,
    entries: x.entries.map((e) =>
      e.number === 2
        ? {
            ...e,
            revisions: [
              ...e.revisions,
              {
                id: crypto.randomUUID(),
                at: at(12),
                author: "Alice",
                reason: "Précision",
                fields: { ...e.revisions[0].fields, status: "En cours" },
              },
            ],
          }
        : e,
    ),
  }));
  step(14, "Alice", (x) => ({
    ...x,
    entries: x.entries.filter((e) => e.number !== 3),
    deleted: [
      {
        id: x.entries.find((e) => e.number === 3).id,
        number: 3,
        at: at(14),
        by: "Alice",
        reason: "Doublon",
      },
    ],
  }));
  step(15, "Chef", (x) => {
    let ops = upsert(
      x.ops,
      "contacts",
      {
        name: "Dupont, Jean; chef",
        organization: "Commune, voirie",
        role: "Chef",
        category: "Autorités",
        phone: "+41 22 000 00 00",
        phone2: "",
        email: "jean@example.ch",
        radio: "PIO 1",
        address: "Rue du Pont 1, 1227 Carouge",
        notes:
          "Ligne 1\nLigne 2 avec un texte assez long pour dépasser soixante-quinze octets et être replié",
        favorite: true,
      },
      "Chef",
    );
    ops = upsert(
      ops,
      "agenda",
      {
        at: at(30),
        minutes: 30,
        title:
          "Rapport de conduite, point ; décisions — très long titre pour vérifier le repli des lignes à soixante-quinze octets",
        kind: "Rapport de conduite",
        location: "PC",
        participants: "Chefs de cellule",
        notes: "",
        done: false,
      },
      "Chef",
    );
    ops = upsert(
      ops,
      "facts",
      {
        label: "Personnes évacuées",
        value: "12",
        unit: "pers.",
        category: "Personnes",
        note: "",
        order: 0,
      },
      "Chef",
    );
    ops = upsert(
      ops,
      "boards",
      {
        title: "Situation générale",
        body: "Crue en cours.\nDeuxième ligne.",
        order: 0,
      },
      "Chef",
    );
    ops = upsert(
      ops,
      "snapshots",
      { title: "Point 08:12", at: at(12), notes: "" },
      "Chef",
    );
    ops = upsert(
      ops,
      "forecasts",
      {
        fetchedAt: at(11),
        place: "Carouge",
        lat: 46.18,
        lng: 6.14,
        data: {
          model: "ICON-CH2",
          current: {
            at: Date.parse(at(11)),
            temperature: 11.2,
            humidity: 88,
            precipitation: 3.4,
            code: 63,
            wind: 22,
            direction: 200,
            gusts: 45,
          },
          hours: [0, 1, 2].map((h) => ({
            at: Date.parse(at(11)) + h * 3600_000,
            temperature: 11,
            precipitation: 2,
            probability: 90,
            code: 63,
            wind: 20,
            gusts: 40,
          })),
          days: [
            {
              at: Date.parse(at(0)),
              code: 63,
              max: 13,
              min: 8,
              precipitation: 40,
              gusts: 50,
              sunrise: null,
              sunset: null,
            },
          ],
        },
      },
      "Chef",
    );
    return { ...x, ops };
  });
  return { journal: j, ids };
}
