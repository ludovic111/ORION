import test from "node:test";
import assert from "node:assert/strict";
import {
  addEntry,
  current,
  deleteEntry,
  emptyFields,
  journalSchema,
  newJournal,
  numberLabel,
  reviseEntry,
} from "../shared/journal.ts";
import { removeRecords, upsert } from "../shared/ops.ts";
import {
  conflicts,
  digest,
  mergeJournal,
  mergeWorkspace,
  messageLabels,
  sliceJournal,
  stampJournal,
  stampWorkspace,
} from "../shared/sync.ts";
import { versionVector } from "../shared/stamps.ts";
import { setLocalNode } from "../shared/hlc.ts";
import { closableBy, thread } from "../shared/workflow.ts";

// ---------- Helpers ----------

const T0 = Date.UTC(2026, 8, 24, 10, 0);
const iso = (ms) => new Date(ms).toISOString();
const fields = (message, extra = {}) => ({
  ...emptyFields(),
  message,
  ...extra,
});
const withOps = (journal, ops) => journalSchema.parse({ ...journal, ops });
const resource = (name, status = "Disponible") => ({
  name,
  kind: "Véhicule",
  organization: "",
  callsign: "",
  count: 1,
  status,
  location: "",
  mission: "",
  eta: "",
  contact: "",
  notes: "",
});

/** A post: its own node id and a clock `skew` ms off. */
function post(node, skew = 0) {
  let minute = 0;
  return {
    node,
    now: () => iso(T0 + skew + ++minute * 1000),
    /** A local change, stamped as the app does it. */
    change(before, after) {
      setLocalNode(node);
      return stampJournal(before, after, this.now(), node);
    },
  };
}

/** Deterministic pseudo-random numbers. */
function random(seed) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s ^ (s >>> 15), 2246822507) + 0x9e3779b9) >>> 0;
    s ^= s >>> 13;
    return (s >>> 0) / 4294967296;
  };
}
const choose = (r, list) => list[Math.floor(r() * list.length)];

/** One random local change of a post. */
function randomChange(r, p, j) {
  const kind = Math.floor(r() * 9);
  const live = j.entries;
  const res = j.ops.resources;
  if (kind === 0 || (kind === 1 && !live.length))
    return p.change(j, addEntry(j, fields(`Entrée ${p.node} ${r()}`), p.node));
  if (kind === 1) {
    const e = choose(r, live);
    return p.change(
      j,
      reviseEntry(
        j,
        e.id,
        { ...current(e), message: `Version ${p.node} ${r()}` },
        p.node,
        "Correction",
      ),
    );
  }
  if (kind === 2 && live.length > 2)
    return p.change(j, deleteEntry(j, choose(r, live).id, p.node, "Erreur"));
  if (kind === 3 || !res.length)
    return p.change(
      j,
      withOps(j, upsert(j.ops, "resources", resource(`TP ${r()}`), p.node)),
    );
  if (kind === 4)
    return p.change(j, withOps(j, removeRecords(j.ops, [choose(r, res).id])));
  if (kind === 5)
    return p.change(j, {
      ...j,
      title: `Titre ${p.node} ${Math.floor(r() * 9)}`,
    });
  if (kind === 6) {
    const message = {
      ...emptyMessageFields(),
      subject: `Message ${p.node}`,
      id: crypto.randomUUID(),
      createdAt: p.now(),
      updatedAt: p.now(),
      by: p.node,
    };
    return p.change(j, withOps(j, upsert(j.ops, "messages", message, p.node)));
  }
  const target = choose(r, res);
  return p.change(
    j,
    withOps(
      j,
      upsert(
        j.ops,
        "resources",
        { ...target, status: choose(r, ["Engagé", "En route", "Alerté"]) },
        p.node,
      ),
    ),
  );
}
function emptyMessageFields() {
  return {
    receivedAt: iso(T0),
    from: "",
    to: "",
    via: "Radio",
    priority: "Normal",
    category: "",
    subject: "",
    body: "",
    location: "",
    coordinates: "",
    replyNeeded: false,
    replyBy: "",
    status: "Nouveau",
    entryId: "",
    handledBy: "",
    notes: "",
    tags: [],
  };
}

/** Three or four posts working on one journal, exchanging at random. */
function scenario(seed, count = 3, steps = 30) {
  const r = random(seed);
  const posts = Array.from({ length: count }, (_, i) =>
    post(`node000${i}`, Math.round((r() - 0.5) * 10 * 60_000)),
  );
  const base = posts[0].change(undefined, newJournal("Crue"));
  const state = posts.map(() => base);
  for (let s = 0; s < steps; s++) {
    const i = Math.floor(r() * count);
    if (r() < 0.7) state[i] = randomChange(r, posts[i], state[i]);
    else {
      const k = Math.floor(r() * count);
      if (k !== i) state[i] = mergeJournal(state[i], state[k]);
    }
  }
  return state;
}

// ---------- Properties of the merge ----------

test("merge is commutative, associative and idempotent over random posts", async () => {
  for (let seed = 1; seed <= 25; seed++) {
    const [a, b, c, d] = scenario(seed, seed % 2 ? 3 : 4);
    const ab = mergeJournal(a, b);
    assert.equal(
      await digest(ab),
      await digest(mergeJournal(b, a)),
      `ab ${seed}`,
    );
    const left = mergeJournal(ab, c);
    const right = mergeJournal(a, mergeJournal(b, c));
    assert.equal(await digest(left), await digest(right), `assoc ${seed}`);
    assert.equal(await digest(mergeJournal(left, left)), await digest(left));
    assert.equal(await digest(mergeJournal(left, b)), await digest(left));
    // Every order of arrival gives the same journal.
    const all = d ? [a, b, c, d] : [a, b, c];
    const orders = [
      [0, 1, 2, 3],
      [3, 2, 1, 0],
      [2, 0, 3, 1],
      [1, 3, 0, 2],
    ].map((o) => o.filter((i) => i < all.length));
    const results = new Set();
    for (const order of orders) {
      let acc = all[order[0]];
      for (const i of order.slice(1)) acc = mergeJournal(acc, all[i]);
      results.add(await digest(acc));
    }
    assert.equal(results.size, 1, `orders ${seed}`);
  }
});

test("merging only what a peer lacks gives the same journal as merging everything", async () => {
  for (let seed = 30; seed <= 45; seed++) {
    const [a, b, c] = scenario(seed, 3);
    const full = mergeJournal(a, b);
    const slice = sliceJournal(b, versionVector(a));
    const partial = slice ? mergeJournal(a, slice) : a;
    assert.equal(await digest(partial), await digest(full), `slice ${seed}`);
    // A slice is a valid journal, much smaller than the whole.
    if (slice) journalSchema.parse(slice);
    const cSlice = sliceJournal(c, versionVector(full));
    assert.equal(
      await digest(cSlice ? mergeJournal(full, cSlice) : full),
      await digest(mergeJournal(full, c)),
    );
  }
});

test("numbers never change and labels are the same whatever the order", async () => {
  for (let seed = 50; seed <= 60; seed++) {
    const [a, b, c] = scenario(seed, 3, 40);
    const numbers = new Map();
    for (const j of [a, b, c])
      for (const e of j.entries) {
        if (numbers.has(e.id)) assert.equal(numbers.get(e.id), e.number);
        numbers.set(e.id, e.number);
      }
    const x = mergeJournal(mergeJournal(a, b), c);
    const y = mergeJournal(c, mergeJournal(b, a));
    for (const e of x.entries) assert.equal(e.number, numbers.get(e.id));
    const labels = (j) =>
      Object.fromEntries(j.entries.map((e) => [e.id, numberLabel(e)]));
    assert.deepEqual(labels(x), labels(y));
    assert.equal(new Set(Object.values(labels(x))).size, x.entries.length);
  }
});

// ---------- Clocks 5 minutes apart ----------

test("an edit made after seeing another post's change wins, whatever the clocks", () => {
  const slow = post("slowpost", 0);
  const fast = post("fastpost", 5 * 60_000);
  let base = slow.change(undefined, newJournal("Crue"));
  base = slow.change(
    base,
    withOps(base, upsert(base.ops, "resources", resource("TP 1"), "A")),
  );
  const r = base.ops.resources[0];
  const setStatus = (p, j, status) =>
    p.change(
      j,
      withOps(
        j,
        upsert(j.ops, "resources", { ...j.ops.resources[0], status }, p.node),
      ),
    );
  // B (clock 5 min ahead) edits; A sees it, then edits: A wins.
  const b = setStatus(fast, base, "En route");
  const a = setStatus(slow, mergeJournal(base, b), "Engagé");
  assert.equal(mergeJournal(a, b).ops.resources[0].status, "Engagé");
  assert.equal(mergeJournal(b, a).ops.resources[0].status, "Engagé");
  // A deletes after seeing B's change: it stays deleted.
  const removed = slow.change(
    mergeJournal(base, b),
    withOps(mergeJournal(base, b), removeRecords(b.ops, [r.id])),
  );
  assert.equal(mergeJournal(removed, b).ops.resources.length, 0);
  assert.equal(mergeJournal(b, removed).ops.resources.length, 0);
});

test("a version written after seeing another post's version is the current one", () => {
  const slow = post("slowpos2", 0);
  const fast = post("fastpos2", 5 * 60_000);
  const base = slow.change(
    undefined,
    addEntry(newJournal("Crue"), fields("Départ"), "A"),
  );
  const id = base.entries[0].id;
  const b = fast.change(
    base,
    reviseEntry(base, id, fields("Version B"), "B", "Précision"),
  );
  const seen = mergeJournal(base, b);
  const a = slow.change(
    seen,
    reviseEntry(seen, id, fields("Version A"), "A", "Correction"),
  );
  assert.equal(current(mergeJournal(a, b).entries[0]).message, "Version A");
  assert.equal(current(mergeJournal(b, a).entries[0]).message, "Version A");
  // The versions follow causality, not the clocks.
  const revs = mergeJournal(a, b).entries[0].revisions;
  assert.deepEqual(
    revs.map((r) => r.author),
    ["A", "B", "A"],
  );
  assert.ok(revs.at(-1).hlc > revs.at(-2).hlc);
});

// ---------- Numbering ----------

const pause = () => new Promise((r) => setTimeout(r, 3));

test("entries created at the same time on two posts keep their number, with a suffix", async () => {
  const pa = post("postaaaa", 0);
  const pb = post("postbbbb", 60_000);
  const base = pa.change(undefined, newJournal("Crue"));
  const a = pa.change(base, addEntry(base, fields("Poste A"), "A"));
  await pause();
  const b = pb.change(base, addEntry(base, fields("Poste B"), "B"));
  assert.equal(a.entries[0].number, 1);
  assert.equal(b.entries[0].number, 1);
  const ab = mergeJournal(a, b);
  const ba = mergeJournal(b, a);
  const labels = (j) =>
    Object.fromEntries(
      j.entries.map((e) => [current(e).message, numberLabel(e)]),
    );
  assert.deepEqual(labels(ab), labels(ba));
  // The earlier one keeps #001 as printed; the other is told apart.
  assert.equal(labels(ab)["Poste A"], "#001");
  assert.match(labels(ab)["Poste B"], /^#001·[A-Z]$/);
  assert.deepEqual(
    ab.entries.map((e) => e.number),
    [1, 1],
  );
  // A third post at the same time does not change the first two labels.
  const pc = post("postcccc", 120_000);
  await pause();
  const c = pc.change(base, addEntry(base, fields("Poste C"), "C"));
  const abc = mergeJournal(ab, c);
  assert.equal(labels(abc)["Poste A"], labels(ab)["Poste A"]);
  assert.equal(labels(abc)["Poste B"], labels(ab)["Poste B"]);
  assert.equal(new Set(Object.values(labels(abc))).size, 3);
  // Deleting the first one does not move the others' labels either.
  const gone = pa.change(
    abc,
    deleteEntry(
      abc,
      abc.entries.find((e) => current(e).message === "Poste A").id,
      "A",
      "Doublon",
    ),
  );
  assert.equal(labels(gone)["Poste B"], labels(ab)["Poste B"]);
  // The collision is reported.
  const found = conflicts(abc).filter((c) => c.kind === "collision");
  assert.equal(found.length, 1);
  assert.equal(found[0].items.length, 3);
  // New entries follow the highest number.
  const next = pa.change(abc, addEntry(abc, fields("Suite"), "A"));
  assert.equal(next.entries.at(-1).number, 2);
});

test("a reference written before a collision keeps pointing to the same entry", async () => {
  const pa = post("refaaaaa", 0);
  const pb = post("refbbbbb", 60_000);
  const base = pa.change(undefined, newJournal("Crue"));
  const a = pa.change(
    base,
    addEntry(
      base,
      fields("Mission A", { type: "Mission", status: "À traiter" }),
      "A",
    ),
  );
  await pause();
  let b = pb.change(
    base,
    addEntry(
      base,
      fields("Mission B", { type: "Mission", status: "À traiter" }),
      "B",
    ),
  );
  b = pb.change(
    b,
    addEntry(b, fields("Question", { reference: "Suite de #001" }), "B"),
  );
  const merged = mergeJournal(a, b);
  const missionB = merged.entries.find(
    (e) => current(e).message === "Mission B",
  );
  const question = merged.entries.find(
    (e) => current(e).message === "Question",
  );
  assert.notEqual(numberLabel(missionB), "#001");
  assert.deepEqual(
    thread(merged.entries, question)
      .map((e) => e.id)
      .sort(),
    [missionB.id, question.id].sort(),
  );
  // "close #001·X" offers the right entry.
  const receipt = fields("Fait", {
    type: "Quittance",
    reference: `Suite de ${numberLabel(missionB)}`,
  });
  assert.deepEqual(
    closableBy(merged, receipt).map((e) => e.id),
    [missionB.id],
  );
});

test("messages keep the number given at reception", () => {
  const pa = post("msgaaaaa", 0);
  const pb = post("msgbbbbb", 30_000);
  let j = pa.change(undefined, newJournal("Crue"));
  const add = (p, journal, subject, receivedAt) =>
    p.change(
      journal,
      withOps(
        journal,
        upsert(
          journal.ops,
          "messages",
          {
            ...emptyMessageFields(),
            subject,
            receivedAt,
            id: crypto.randomUUID(),
            createdAt: p.now(),
            updatedAt: p.now(),
            by: p.node,
          },
          p.node,
        ),
      ),
    );
  j = add(pa, j, "Premier", iso(T0 + 60_000));
  j = add(pa, j, "Deuxième", iso(T0 + 120_000));
  const label = (journal, subject) =>
    messageLabels(journal).get(
      journal.ops.messages.find((m) => m.subject === subject).id,
    );
  assert.equal(label(j, "Premier"), "001");
  assert.equal(label(j, "Deuxième"), "002");
  // Back-dating a message does not renumber the others.
  j = add(pa, j, "Reçu plus tôt", iso(T0));
  assert.equal(label(j, "Reçu plus tôt"), "003");
  assert.equal(label(j, "Premier"), "001");
  // Deleting one does not either, and its number is not given again.
  const first = j.ops.messages.find((m) => m.subject === "Premier");
  j = pa.change(j, withOps(j, removeRecords(j.ops, [first.id])));
  assert.equal(label(j, "Deuxième"), "002");
  j = add(pa, j, "Nouveau", iso(T0 + 300_000));
  assert.equal(label(j, "Nouveau"), "004");
  // Two posts receiving at the same time: both keep 005, told apart.
  const a = add(pa, j, "Sur A", iso(T0 + 400_000));
  const b = add(pb, j, "Sur B", iso(T0 + 400_000));
  const ab = mergeJournal(a, b);
  const ba = mergeJournal(b, a);
  assert.equal(label(ab, "Sur A"), label(ba, "Sur A"));
  assert.equal(label(ab, "Sur B"), label(ba, "Sur B"));
  assert.notEqual(label(ab, "Sur A"), label(ab, "Sur B"));
  assert.match(label(ab, "Sur A"), /^005/);
  assert.match(label(ab, "Sur B"), /^005/);
});

test("messages of sessions before 2.1 get the numbers they were shown with", () => {
  const j = newJournal("Crue");
  const legacy = (subject, minute) => ({
    ...emptyMessageFields(),
    subject,
    receivedAt: iso(T0 + minute * 60_000),
    id: crypto.randomUUID(),
    createdAt: iso(T0),
    updatedAt: iso(T0),
    by: "A",
  });
  const parsed = journalSchema.parse({
    ...j,
    ops: {
      ...j.ops,
      messages: [legacy("C", 3), legacy("A", 1), legacy("B", 2)],
    },
  });
  const numbers = Object.fromEntries(
    parsed.ops.messages.map((m) => [m.subject, m.number]),
  );
  assert.deepEqual(numbers, { A: 1, B: 2, C: 3 });
  assert.deepEqual(journalSchema.parse(parsed), parsed);
});

// ---------- Revisions, deletions, journals ----------

test("merged versions keep the first one and the latest ones", () => {
  const p = post("revspost", 0);
  let j = p.change(undefined, addEntry(newJournal("Crue"), fields("v0"), "A"));
  const id = j.entries[0].id;
  let other = j;
  for (let i = 1; i <= 260; i++)
    j = reviseEntry(j, id, fields(`a${i}`), "A", "Correction");
  for (let i = 1; i <= 260; i++)
    other = reviseEntry(other, id, fields(`b${i}`), "B", "Correction");
  const merged = mergeJournal(j, other);
  const revisions = merged.entries[0].revisions;
  assert.equal(revisions.length, 500);
  assert.equal(revisions[0].fields.message, "v0");
  assert.equal(revisions[0].reason, "Saisie initiale");
});

test("a deleted journal imported again comes back on every post", () => {
  const pa = post("gonepsta", 0);
  const one = pa.change(undefined, newJournal("Un"));
  const two = pa.change(undefined, newJournal("Deux"));
  const start = {
    version: 1,
    author: "A",
    journals: [one, two],
    activeId: one.id,
  };
  const removed = stampWorkspace(start, { ...start, journals: [one] });
  assert.ok(removed.gone[two.id]);
  // Another post still has "Deux": it does not come back.
  assert.equal(
    mergeWorkspace(removed, { journals: [one, two] }).journals.length,
    1,
  );
  // Imported again from its archive (same id): it stays, here and there.
  const again = stampWorkspace(removed, {
    ...removed,
    journals: [one, two],
  });
  assert.equal(
    mergeWorkspace(again, { journals: [one], gone: removed.gone }).journals
      .length,
    2,
  );
  const elsewhere = {
    ...start,
    author: "B",
    gone: removed.gone,
    journals: [one],
  };
  const received = mergeWorkspace(elsewhere, again);
  assert.deepEqual(received.journals.map((x) => x.title).sort(), [
    "Deux",
    "Un",
  ]);
});

test("a removal of every journal is recorded and applied once another arrives", () => {
  const pa = post("allgonea", 0);
  const one = pa.change(undefined, newJournal("Un"));
  const two = pa.change(undefined, newJournal("Deux"));
  const here = { version: 1, author: "B", journals: [one], activeId: one.id };
  const there = stampWorkspace(
    { version: 1, author: "A", journals: [one, two], activeId: one.id },
    { version: 1, author: "A", journals: [two], activeId: two.id },
  );
  const partial = mergeWorkspace(here, { journals: [], gone: there.gone });
  assert.equal(partial.journals.length, 1);
  assert.ok(partial.gone[one.id]);
  const complete = mergeWorkspace(partial, { journals: [two] });
  assert.deepEqual(
    complete.journals.map((j) => j.title),
    ["Deux"],
  );
});

test("concurrent edits of a record are reported with both versions", () => {
  const pa = post("concaaaa", 0);
  const pb = post("concbbbb", 1000);
  let base = pa.change(undefined, newJournal("Crue"));
  base = pa.change(
    base,
    withOps(base, upsert(base.ops, "resources", resource("TP 1"), "A")),
  );
  const edit = (p, status) =>
    p.change(
      base,
      withOps(
        base,
        upsert(
          base.ops,
          "resources",
          { ...base.ops.resources[0], status },
          p.node,
        ),
      ),
    );
  const merged = mergeJournal(edit(pa, "Engagé"), edit(pb, "En route"));
  const found = conflicts(merged).filter((c) => c.kind === "concurrent");
  assert.equal(found.length, 1);
  assert.equal(found[0].overwritten.length, 1);
  assert.equal(found[0].kept.state.status, merged.ops.resources[0].status);
  // Sequential edits are not concurrent.
  const later = pb.change(
    merged,
    withOps(
      merged,
      upsert(
        merged.ops,
        "resources",
        { ...merged.ops.resources[0], status: "De retour" },
        "B",
      ),
    ),
  );
  assert.equal(
    conflicts(later).filter((c) => c.kind === "concurrent").length,
    1,
  );
});

test("stamps written before 2.1 still merge", async () => {
  const legacy = journalSchema.parse({
    ...newJournal("Ancien"),
    sync: {
      clock: { meta: "2026-09-24T10:00:00+02:00" },
      removed: {
        "0b1a4c64-8b7e-4c4c-9e0e-1a2b3c4d5e6f": "2026-09-24T08:05:00Z",
      },
    },
  });
  assert.equal(legacy.sync.clock.meta, "2026-09-24T08:00:00.000Z");
  assert.equal(
    legacy.sync.removed["0b1a4c64-8b7e-4c4c-9e0e-1a2b3c4d5e6f"],
    "2026-09-24T08:05:00.000Z",
  );
  const p = post("legacyps", 0);
  const next = p.change(legacy, { ...legacy, title: "Renommé" });
  assert.ok(next.sync.clock.meta > legacy.sync.clock.meta);
  assert.equal(mergeJournal(legacy, next).title, "Renommé");
  assert.equal(
    await digest(mergeJournal(next, legacy)),
    await digest(mergeJournal(legacy, next)),
  );
});
