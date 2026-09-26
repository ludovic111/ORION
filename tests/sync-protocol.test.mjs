import test from "node:test";
import assert from "node:assert/strict";
import {
  addEntry,
  current,
  emptyFields,
  journalSchema,
  newJournal,
  packJournal,
  reviseEntry,
} from "../shared/journal.ts";
import { upsert } from "../shared/ops.ts";
import { digest, mergeWorkspace, stampWorkspace } from "../shared/sync.ts";
import { setLocalNode } from "../shared/hlc.ts";
import {
  FULL_INTERVAL,
  answerHello,
  localChanges,
  newMemory,
  noteReceived,
  partialIds,
  summarise,
  usable,
} from "../shared/protocol.ts";

// The synchronisation protocol, without the network: posts exchange hellos
// and (partial) states through a lossy channel, then must converge.

function random(seed) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s ^ (s >>> 15), 2246822507) + 0x9e3779b9) >>> 0;
    s ^= s >>> 13;
    return (s >>> 0) / 4294967296;
  };
}
const wireJournal = (j) =>
  journalSchema.parse(JSON.parse(JSON.stringify(packJournal(j))));

function network(count, seed) {
  const r = random(seed);
  let clock = Date.UTC(2026, 8, 24, 10);
  let bytes = 0;
  const queue = [];
  const base = newJournal("Crue");
  const posts = Array.from({ length: count }, (_, i) => ({
    name: `p${i}`,
    node: `node${String(i).padStart(4, "0")}`,
    ws: { version: 1, author: `P${i}`, journals: [base], activeId: base.id },
    announced: new Map(),
    memory: new Map(),
  }));
  const send = (from, to, message, lossy) => {
    const size = JSON.stringify(message).length;
    bytes += size;
    if (lossy && r() < 0.3) return;
    for (const p of posts)
      if (p !== from && (!to || p === to)) queue.push({ from, to: p, message });
  };
  const hello = async (p, reply, to = null, lossy = false) =>
    send(
      p,
      to,
      {
        type: "hello",
        reply,
        journals: await summarise(p.ws.journals),
        gone: p.ws.gone,
      },
      lossy,
    );
  const state = async (p, journals, to = null, lossy = false) =>
    send(
      p,
      to,
      {
        type: "state",
        journals: journals.map(packJournal),
        partial: partialIds(journals),
        gone: p.ws.gone,
        digests: Object.fromEntries(
          await Promise.all(journals.map(async (j) => [j.id, await digest(j)])),
        ),
      },
      lossy,
    );
  async function deliver(lossy) {
    let steps = 0;
    while (queue.length && steps++ < 2000) {
      const { from, to, message } = queue.shift();
      if (message.type === "hello") {
        const memory = to.memory.get(from) ?? newMemory();
        to.memory.set(from, memory);
        const { send: out, differ } = await answerHello(
          to.ws.journals,
          to.ws.gone,
          message.journals,
          memory,
          clock,
        );
        if (out.length) await state(to, out, from, lossy);
        if (!message.reply || differ) await hello(to, true, from, lossy);
      } else {
        const received = message.journals.map((j) =>
          journalSchema.parse(JSON.parse(JSON.stringify(j))),
        );
        const { journals, missing } = usable(
          to.ws.journals.map((j) => j.id),
          received,
          message.partial,
        );
        if (missing.length) await hello(to, true, from, lossy);
        to.ws = mergeWorkspace(to.ws, { journals, gone: message.gone });
        noteReceived(journals, to.announced);
        let differ = false;
        for (const [id, d] of Object.entries(message.digests)) {
          const mine = to.ws.journals.find((j) => j.id === id);
          if (mine && (await digest(mine)) !== d) differ = true;
        }
        if (differ) await hello(to, true, from, lossy);
      }
    }
  }
  function change(p) {
    setLocalNode(p.node);
    const j = p.ws.journals[0];
    const pick = r();
    let next;
    if (pick < 0.4 || !j.entries.length)
      next = addEntry(
        j,
        { ...emptyFields(), message: `${p.name} ${r()}` },
        p.name,
      );
    else if (pick < 0.7) {
      const e = j.entries[Math.floor(r() * j.entries.length)];
      next = reviseEntry(
        j,
        e.id,
        { ...current(e), message: `${p.name} révise ${r()}` },
        p.name,
        "Correction",
      );
    } else
      next = journalSchema.parse({
        ...j,
        ops: upsert(
          j.ops,
          "resources",
          {
            name: `TP ${r()}`,
            kind: "",
            organization: "",
            callsign: "",
            count: 1,
            status: "Disponible",
            location: "",
            mission: "",
            eta: "",
            contact: "",
            notes: "",
          },
          p.name,
        ),
      });
    p.ws = stampWorkspace(p.ws, { ...p.ws, journals: [next] });
    return p.ws.journals[0];
  }
  return {
    posts,
    r,
    hello,
    state,
    deliver,
    change,
    tick: (ms) => (clock += ms),
    bytes: () => bytes,
  };
}

async function converged(posts) {
  const all = await Promise.all(posts.map((p) => digest(p.ws.journals[0])));
  return new Set(all).size === 1;
}

test("posts converge through lost messages, partial states and heartbeats", async () => {
  for (let seed = 1; seed <= 6; seed++) {
    const net = network(3, seed);
    // Everyone joins.
    for (const p of net.posts) await net.hello(p, false);
    await net.deliver(false);
    // Work with a lossy network: local changes leave as differences.
    for (let step = 0; step < 40; step++) {
      const p = net.posts[Math.floor(net.r() * net.posts.length)];
      net.change(p);
      const list = localChanges(
        p.ws.journals,
        [p.ws.journals[0].id],
        p.announced,
      );
      await net.state(p, list, null, true);
      await net.deliver(true);
    }
    // Heartbeats without loss: converge within a few rounds.
    let rounds = 0;
    while (!(await converged(net.posts)) && rounds < 6) {
      net.tick(FULL_INTERVAL + 1000);
      for (const p of net.posts) await net.hello(p, true);
      await net.deliver(false);
      rounds++;
    }
    assert.ok(await converged(net.posts), `seed ${seed}: ${rounds} rounds`);
    // Once converged, a heartbeat triggers no answer at all.
    const before = net.bytes();
    for (const p of net.posts) await net.hello(p, true);
    const hellos = net.bytes() - before;
    await net.deliver(false);
    assert.equal(net.bytes() - before, hellos);
  }
});

test("differences cost much less than whole journals", async () => {
  const net = network(2, 99);
  const [a, b] = net.posts;
  for (let i = 0; i < 150; i++) net.change(a);
  await net.state(a, a.ws.journals);
  await net.deliver(false);
  assert.ok(await converged(net.posts));
  const whole = JSON.stringify(wireJournal(a.ws.journals[0])).length;
  a.announced.set(
    a.ws.journals[0].id,
    (await summarise(a.ws.journals))[a.ws.journals[0].id].w,
  );
  const before = net.bytes();
  net.change(a);
  const list = localChanges(a.ws.journals, [a.ws.journals[0].id], a.announced);
  assert.equal(list.length, 1);
  await net.state(a, list);
  await net.deliver(false);
  const delta = net.bytes() - before;
  assert.ok(delta * 20 < whole, `${delta} vs ${whole}`);
  assert.ok(await converged([a, b]));
});

test("a part of a journal a post lacks is not shown; the whole one follows", async () => {
  const net = network(2, 7);
  const [a, b] = net.posts;
  for (const p of net.posts) await net.hello(p, false);
  await net.deliver(false);
  // A creates a second journal while B is away, B never sees it whole.
  setLocalNode(a.node);
  const extra = newJournal("Deuxième");
  a.ws = stampWorkspace(a.ws, { ...a.ws, journals: [...a.ws.journals, extra] });
  a.announced.set(extra.id, {});
  const second = a.ws.journals.find((j) => j.id === extra.id);
  a.ws = stampWorkspace(a.ws, {
    ...a.ws,
    journals: a.ws.journals.map((j) =>
      j.id === extra.id ? { ...j, title: "Deuxième, renommé" } : j,
    ),
  });
  const list = localChanges(a.ws.journals, [second.id], a.announced);
  assert.deepEqual(partialIds(list), [second.id]);
  await net.state(a, list);
  await net.deliver(false);
  const got = b.ws.journals.find((j) => j.id === second.id);
  assert.ok(got, "the whole journal arrived after the request");
  assert.equal(
    await digest(got),
    await digest(a.ws.journals.find((j) => j.id === second.id)),
  );
  // A journal removed then added again leaves whole.
  const announced = new Map([[second.id, {}]]);
  localChanges([a.ws.journals[0]], [], announced);
  assert.equal(announced.has(second.id), false);
});
