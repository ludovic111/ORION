import test from "node:test";
import assert from "node:assert/strict";
import {
  addEntry,
  emptyFields,
  journalSchema,
  newJournal,
} from "../shared/journal.ts";
import { opsSchema, removeRecords, upsert } from "../shared/ops.ts";
import { digest, mergeJournal, stampJournal } from "../shared/sync.ts";
import { setLocalNode } from "../shared/hlc.ts";
import {
  ackSchema,
  assignmentSchema,
  broadcastSchema,
  orderSchema,
} from "../shared/conduct.ts";
import {
  emptyOrder,
  newMission,
  nextOrderNumber,
  orderLabels,
  orderPrefill,
} from "../shared/orders.ts";
import {
  acksFor,
  assignedTo,
  attentionCount,
  designates,
  inbox,
  myTasks,
  recipientStates,
} from "../shared/diffusion.ts";
import {
  allKinds,
  computeAlarms,
  delivery,
  dueAlarms,
  inQuietHours,
  nextAlarmAt,
} from "../shared/alarms.ts";
import {
  ackEnvelope,
  applyEnvelope,
  broadcastEnvelope,
  envelopeSchema,
  liaisonKeys,
  markDelivered,
  messageEnvelope,
  outgoing,
  pendingOut,
  stableUuid,
  toForward,
} from "../shared/liaison.ts";
import { roomKeys } from "../shared/room.ts";

// ---------- Helpers ----------

const T0 = Date.UTC(2026, 8, 26, 8, 0);
const iso = (ms) => new Date(ms).toISOString();
const min = (m) => iso(T0 + m * 60_000);
const withOps = (journal, ops) => journalSchema.parse({ ...journal, ops });
const me = (role, extra = {}) => ({
  name: "Sgt Rey",
  role,
  cell: "",
  pc: "",
  ...extra,
});
const broadcast = (patch = {}) => ({
  id: crypto.randomUUID(),
  sentAt: min(0),
  title: "Route fermée",
  body: "",
  kind: "Consigne",
  priority: "Normal",
  target: "",
  recipients: ["Logistique", "Télématique"],
  ack: "Lu",
  deadline: 10,
  sender: "Chef situation",
  closedAt: "",
  source: "",
  ...patch,
});
const liaison = (patch = {}) => ({
  id: crypto.randomUUID(),
  createdAt: min(0),
  updatedAt: min(0),
  by: "A",
  name: "PC arrière",
  self: "PC front",
  code: "V7NR-J7T5-PY7K-M3P4",
  openedAt: min(0),
  closedAt: "",
  notes: "",
  ...patch,
});

function random(seed) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s ^ (s >>> 15), 2246822507) + 0x9e3779b9) >>> 0;
    s ^= s >>> 13;
    return (s >>> 0) / 4294967296;
  };
}
const choose = (r, list) => list[Math.floor(r() * list.length)];

function post(node, skew = 0) {
  let tick = 0;
  return {
    node,
    now: () => iso(T0 + skew + ++tick * 1000),
    change(before, after) {
      setLocalNode(node);
      // Stamps the changes and writes them to the history.
      return stampJournal(before, after, this.now(), node);
    },
  };
}

// ---------- Schemas ----------

test("new collections validate, with defaults, and old journals open with them empty", () => {
  const order = orderSchema.parse({
    id: crypto.randomUUID(),
    createdAt: min(0),
    updatedAt: min(0),
    by: "A",
    number: 1,
    title: "Ordre d’engagement",
  });
  assert.equal(order.status, "Brouillon");
  assert.deepEqual(order.missions, []);
  assert.equal(order.kind, "Ordre d’engagement");
  assert.throws(() =>
    broadcastSchema.parse({
      ...broadcast(),
      createdAt: min(0),
      updatedAt: min(0),
      by: "A",
      recipients: [],
    }),
  );
  assert.throws(() =>
    ackSchema.parse({
      id: crypto.randomUUID(),
      createdAt: min(0),
      updatedAt: min(0),
      by: "A",
      broadcastId: crypto.randomUUID(),
      recipient: "Logistique",
      kind: "Peut-être",
      at: min(1),
    }),
  );
  assert.throws(() =>
    assignmentSchema.parse({
      id: crypto.randomUUID(),
      createdAt: min(0),
      updatedAt: min(0),
      by: "A",
      target: "pas une référence",
    }),
  );
  const ops = opsSchema.parse({});
  for (const c of [
    "orders",
    "broadcasts",
    "acks",
    "assignments",
    "liaisons",
    "exchanges",
  ])
    assert.deepEqual(ops[c], [], c);
});

// ---------- Merge ----------

function randomChange(r, p, j) {
  const kind = Math.floor(r() * 7);
  const o = j.ops;
  if (kind === 0 || (!o.broadcasts.length && kind < 4))
    return p.change(
      j,
      withOps(
        j,
        upsert(
          o,
          "broadcasts",
          broadcast({ title: `B ${p.node} ${r()}` }),
          p.node,
        ),
      ),
    );
  if (kind === 1) {
    const b = choose(r, o.broadcasts);
    // Receipts are only ever added.
    return p.change(
      j,
      withOps(
        j,
        upsert(
          o,
          "acks",
          {
            broadcastId: b.id,
            recipient: choose(r, b.recipients),
            kind: choose(r, ["Lu", "Compris"]),
            at: p.now(),
            post: p.node,
            role: "",
            note: "",
            source: "",
          },
          p.node,
        ),
      ),
    );
  }
  if (kind === 2 || !o.orders.length)
    return p.change(
      j,
      withOps(
        j,
        upsert(
          o,
          "orders",
          {
            ...emptyOrder({ title: `Ordre ${p.node}` }),
            number: nextOrderNumber(j),
            node: p.node,
            missions: [newMission({ unit: "Bravo", task: "Baliser" })],
          },
          p.node,
        ),
      ),
    );
  if (kind === 3) {
    const x = choose(r, o.orders);
    return p.change(
      j,
      withOps(
        j,
        upsert(
          o,
          "orders",
          { ...x, status: "Émis", intention: `I ${r()}` },
          p.node,
        ),
      ),
    );
  }
  if (kind === 4)
    return p.change(
      j,
      withOps(
        j,
        upsert(
          o,
          "assignments",
          {
            target: `order:${choose(r, o.orders).id}`,
            role: choose(r, ["Logistique", "Télématique"]),
          },
          p.node,
        ),
      ),
    );
  if (kind === 5 && o.assignments.length) {
    const a = choose(r, o.assignments);
    return p.change(
      j,
      withOps(j, upsert(o, "assignments", { ...a, done: !a.done }, p.node)),
    );
  }
  if (o.broadcasts.length > 1)
    return p.change(
      j,
      withOps(j, removeRecords(o, [choose(r, o.broadcasts).id])),
    );
  return j;
}

function scenario(seed, count = 3, steps = 30) {
  const r = random(seed);
  const posts = Array.from({ length: count }, (_, i) =>
    post(`cnode00${i}`, Math.round((r() - 0.5) * 10 * 60_000)),
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

test("orders, diffusions, receipts and assignments merge commutatively and idempotently", async () => {
  for (let seed = 1; seed <= 20; seed++) {
    const [a, b, c] = scenario(seed);
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
    assert.equal(await digest(mergeJournal(left, a)), await digest(left));
  }
});

test("two receipts written at the same time on two posts are both kept", () => {
  const p1 = post("cnodeaaa");
  const p2 = post("cnodebbb");
  let j = p1.change(undefined, newJournal("Crue"));
  const b = broadcast();
  j = p1.change(j, withOps(j, upsert(j.ops, "broadcasts", b, "A")));
  const ack = (p, recipient) =>
    p.change(
      j,
      withOps(
        j,
        upsert(
          j.ops,
          "acks",
          {
            broadcastId: b.id,
            recipient,
            kind: "Lu",
            at: p.now(),
            post: p.node,
          },
          p.node,
        ),
      ),
    );
  const x = ack(p1, "Logistique");
  const y = ack(p2, "Télématique");
  const merged = mergeJournal(x, y);
  assert.equal(merged.ops.acks.length, 2);
  assert.ok(
    recipientStates(b, merged.ops.acks, T0 + 60_000).every((s) => s.ack),
  );
});

// ---------- Numbers of the orders ----------

test("order numbers are never given twice, removed orders included", () => {
  const p = post("cnodeccc");
  let j = p.change(undefined, newJournal("Crue"));
  const add = (title) => {
    const number = nextOrderNumber(j);
    j = p.change(
      j,
      withOps(
        j,
        upsert(
          j.ops,
          "orders",
          { ...emptyOrder({ title }), number, node: p.node },
          "A",
        ),
      ),
    );
    return j.ops.orders.find((o) => o.title === title);
  };
  add("Un");
  const two = add("Deux");
  assert.equal(two.number, 2);
  j = p.change(j, withOps(j, removeRecords(j.ops, [two.id])));
  assert.equal(add("Trois").number, 3, "the number of a removed order is kept");
  // An order received from another command post does not count.
  j = withOps(
    j,
    upsert(
      j.ops,
      "orders",
      { ...emptyOrder({ title: "Reçu", source: "PC front" }), number: 40 },
      "B",
    ),
  );
  assert.equal(nextOrderNumber(j), 4);
  const labels = orderLabels(j);
  assert.equal(
    labels.get(j.ops.orders.find((o) => o.title === "Reçu").id),
    "PC front n° 40",
  );
});

test("two posts giving the same order number keep it, told apart by a suffix", () => {
  const p1 = post("cnodeddd");
  const p2 = post("cnodeeee");
  const base = p1.change(undefined, newJournal("Crue"));
  const mk = (p, title) =>
    p.change(
      base,
      withOps(
        base,
        upsert(
          base.ops,
          "orders",
          {
            ...emptyOrder({ title }),
            number: nextOrderNumber(base),
            node: p.node,
          },
          p.node,
        ),
      ),
    );
  const x = mk(p1, "A");
  const y = mk(p2, "B");
  const merged = mergeJournal(x, y);
  const labels = [...orderLabels(merged).values()].sort();
  assert.equal(labels.length, 2);
  assert.equal(labels[0], "n° 1");
  assert.match(labels[1], /^n° 1·[A-Z]{1,3}$/);
  assert.deepEqual(orderLabels(mergeJournal(y, x)), orderLabels(merged));
});

test("an order is prefilled from the situation boards, the posts, the radio plan and the next reports", () => {
  const draft = orderPrefill(
    {
      location: "Carouge",
      ops: {
        boards: [
          { title: "Situation générale", body: "Crue." },
          { title: "Dangers et évolution probable", body: "Pic à 13:00." },
          { title: "Intention / idée de manœuvre", body: "Baliser." },
        ],
        agenda: [
          {
            at: min(60),
            title: "Rapport",
            kind: "Rapport de conduite",
            done: false,
          },
          { at: min(-60), title: "Passé", kind: "", done: false },
        ],
        cells: [
          { name: "PC front", kind: "PC front", location: "Quai", radio: "" },
        ],
      },
      radio: {
        talkgroups: [{ number: "G101", name: "Conduite", usage: "Conduite" }],
      },
    },
    T0,
  );
  assert.equal(draft.situation, "Crue.");
  assert.equal(draft.danger, "Pic à 13:00.");
  assert.equal(draft.intention, "Baliser.");
  assert.equal(draft.pc, "PC front : Quai");
  assert.equal(draft.radio, "G101 Conduite (Conduite)");
  assert.match(draft.reports, /Rapport/);
  assert.doesNotMatch(draft.reports, /Passé/);
});

// ---------- Diffusion ----------

test("a recipient designates a post by its function, operator, cell, command post or « Tous »", () => {
  const who = me("Logistique", {
    cell: "Cellule logistique",
    pc: "PC arrière",
  });
  assert.ok(designates("logistique", who));
  assert.ok(designates("Sgt  Rey", who));
  assert.ok(designates("Cellule logistique", who));
  assert.ok(designates("PC arriere", who));
  assert.ok(designates("Tous", who));
  assert.ok(!designates("Télématique", who));
  assert.ok(assignedTo("Logistique / Sgt Martin", who));
  assert.ok(assignedTo("Chef situation et Logistique", who));
  assert.ok(!assignedTo("", who));
  assert.ok(designates("Chef d'intervention", me("Chef d’intervention")));
});

test("receipts are counted per recipient and a missing one is flagged after the deadline", () => {
  const b = broadcastSchema.parse({
    ...broadcast(),
    createdAt: min(0),
    updatedAt: min(0),
    by: "A",
  });
  const acks = acksFor(b, [], me("Logistique"), "Compris", min(3)).map((a) => ({
    ...a,
    createdAt: min(3),
    updatedAt: min(3),
    by: "Sgt Rey",
  }));
  assert.equal(acks.length, 1);
  assert.equal(acks[0].recipient, "Logistique");
  const states = recipientStates(b, acks, T0 + 12 * 60_000);
  assert.equal(states[0].ack?.kind, "Compris");
  assert.equal(states[0].minutes, 3);
  assert.equal(states[1].late, true);
  assert.equal(recipientStates(b, acks, T0 + 5 * 60_000)[1].late, false);
  // Nothing more to acknowledge for Logistique.
  assert.deepEqual(acksFor(b, acks, me("Logistique"), "Lu", min(4)), []);
  const journal = { ops: { ...opsSchema.parse({}), broadcasts: [b], acks } };
  assert.equal(inbox(journal, me("Logistique")).length, 0);
  assert.equal(inbox(journal, me("Télématique")).length, 1);
  // Follow-up stopped: nobody is late, nothing waits.
  const closed = { ...b, closedAt: min(5) };
  assert.ok(
    recipientStates(closed, acks, T0 + 3_600_000).every((s) => !s.late),
  );
});

// ---------- Mes tâches ----------

function tasksJournal() {
  let j = newJournal("Crue");
  const add = (patch) => {
    j = addEntry(
      j,
      { ...emptyFields(), message: patch.message, ...patch },
      "A",
    );
    return j.entries.at(-1);
  };
  const late = add({
    message: "Sacs de sable",
    status: "À traiter",
    assignee: "Logistique",
    dueAt: min(10),
  });
  const soon = add({
    message: "Carburant",
    status: "En cours",
    assignee: "Logistique / Sgt Rey",
    dueAt: min(90),
  });
  add({
    message: "Radio",
    status: "À traiter",
    assignee: "Télématique",
    dueAt: min(5),
  });
  add({ message: "Fait", status: "Terminé", assignee: "Logistique" });
  const free = add({
    message: "Sans échéance",
    status: "À traiter",
    assignee: "Sgt Rey",
  });
  let ops = j.ops;
  ops = upsert(
    ops,
    "orders",
    {
      ...emptyOrder({ title: "Ordre", status: "Émis" }),
      number: 1,
      missions: [
        newMission({
          unit: "Cellule logistique",
          task: "Livrer",
          role: "Logistique",
          dueAt: min(30),
        }),
        newMission({ unit: "Bravo", task: "Baliser", role: "Chef situation" }),
      ],
    },
    "A",
  );
  ops = upsert(
    ops,
    "assignments",
    { target: `entry:${j.entries[2].id}`, role: "Logistique", dueAt: "" },
    "A",
  );
  ops = upsert(
    ops,
    "broadcasts",
    broadcast({ recipients: ["Logistique"], sentAt: min(40) }),
    "A",
  );
  return { journal: journalSchema.parse({ ...j, ops }), late, soon, free };
}

test("« Mes tâches » lists what is assigned to this post, late first then by due time", () => {
  const { journal, late, soon, free } = tasksJournal();
  const now = T0 + 20 * 60_000;
  const list = myTasks(journal, me("Logistique"), now);
  assert.deepEqual(
    list.map((t) => t.kind),
    ["entry", "entry", "mission", "broadcast", "entry", "entry"],
  );
  // The radio entry (due +5) is in because of its explicit assignment.
  assert.equal(list[0].title.includes("Radio"), true);
  assert.equal(list[0].late, true);
  assert.equal(list[1].id, late.id);
  assert.equal(list[1].late, true);
  assert.equal(list.find((t) => t.id === soon.id)?.late, false);
  assert.equal(list.at(-1).id, free.id, "without due time: last");
  // Another function sees other things.
  const other = myTasks(journal, { ...me("Chef situation"), name: "X" }, now);
  assert.deepEqual(
    other.map((t) => t.kind),
    ["mission"],
  );
  assert.equal(attentionCount(journal, me("Logistique"), now), 3);
});

// ---------- Alerts ----------

test("alarms ring once: scheduled ones when their time passes, events when they appear", () => {
  const { journal } = tasksJournal();
  const settings = { kinds: allKinds(), agendaLead: 5 };
  const who = me("Logistique");
  const at0 = T0;
  const alarms = computeAlarms(journal, who, settings, at0);
  // First check: learns, rings nothing.
  const first = dueAlarms(alarms, null, at0);
  assert.equal(first.ring.length, 0);
  // 11 minutes later the sand bags entry (due at +10) is late.
  const later = T0 + 11 * 60_000;
  const second = dueAlarms(
    computeAlarms(journal, who, settings, later),
    first.memory,
    later,
  );
  assert.ok(
    second.ring.some(
      (a) => a.kind === "overdue" && a.body.includes("Logistique"),
    ),
  );
  assert.ok(
    !second.ring.some((a) => a.event),
    "known events do not ring again",
  );
  // Nothing twice.
  const third = dueAlarms(
    computeAlarms(journal, who, settings, later),
    second.memory,
    later + 1000,
  );
  assert.equal(third.ring.length, 0);
  // Next one: the radio entry at +5 is another function's; the fuel at +30 (mission).
  assert.equal(nextAlarmAt(alarms, later), T0 + 30 * 60_000);
});

test("an urgent message arriving from another post rings, an agenda item rings 5 min before", () => {
  const j = newJournal("Crue");
  const settings = { kinds: allKinds(), agendaLead: 5 };
  const who = me("Logistique");
  const baseline = dueAlarms(
    computeAlarms(j, who, settings, T0),
    null,
    T0,
  ).memory;
  let ops = upsert(
    j.ops,
    "messages",
    {
      receivedAt: min(1),
      from: "Police",
      to: "",
      via: "Radio",
      priority: "Urgent",
      category: "",
      subject: "Accident",
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
      createdAt: min(1),
    },
    "B",
  );
  ops = upsert(
    ops,
    "agenda",
    {
      at: min(30),
      minutes: 30,
      title: "Rapport",
      kind: "",
      location: "",
      participants: "",
      notes: "",
      done: false,
    },
    "A",
  );
  const withMessage = { ...j, ops };
  const now = T0 + 2 * 60_000;
  const ring = dueAlarms(
    computeAlarms(withMessage, who, settings, now),
    baseline,
    now,
  ).ring;
  assert.deepEqual(
    ring.map((a) => a.kind),
    ["message"],
  );
  assert.equal(ring[0].urgent, true);
  assert.equal(
    nextAlarmAt(computeAlarms(withMessage, who, settings, now), now),
    T0 + 25 * 60_000,
  );
  // Turned off: nothing.
  const off = computeAlarms(
    withMessage,
    who,
    { ...settings, kinds: { ...allKinds(), message: false } },
    now,
  );
  assert.ok(!off.some((a) => a.kind === "message"));
});

test("quiet hours span midnight in Zurich time: no sound, urgent notifications only", () => {
  // 23:30 in Zurich on 26 September 2026 (UTC+2).
  const night = Date.UTC(2026, 8, 26, 21, 30);
  const day = Date.UTC(2026, 8, 26, 10, 0);
  assert.equal(inQuietHours(night, "22:00", "06:00"), true);
  assert.equal(inQuietHours(day, "22:00", "06:00"), false);
  assert.equal(inQuietHours(day, "11:00", "13:00"), true);
  assert.equal(inQuietHours(day, "bad", "06:00"), false);
  const options = { notify: true, sound: true };
  assert.deepEqual(delivery({ urgent: false }, true, options), {
    notify: false,
    sound: false,
  });
  assert.deepEqual(delivery({ urgent: true }, true, options), {
    notify: true,
    sound: false,
  });
  assert.deepEqual(delivery({ urgent: false }, false, options), {
    notify: true,
    sound: true,
  });
});

// ---------- Liaison ----------

const context = (n = 7) => ({
  author: "Op B",
  now: min(20),
  messageNumber: n,
  node: "zzzz0000",
});

test("a message sent through a liaison arrives once in the other command post's messages", () => {
  const front = liaison();
  const back = liaison({ name: "PC front", self: "PC arrière" });
  const env = messageEnvelope(
    front,
    {
      subject: "Besoin de 2 camions",
      body: "Au pont des Acacias",
      priority: "Urgent",
      category: "Demande",
    },
    "Op A",
    min(10),
  );
  // Travels as JSON.
  const wire = JSON.parse(JSON.stringify(env));
  assert.ok(envelopeSchema.safeParse(wire).success);
  const ops = { ...opsSchema.parse({}), liaisons: [back] };
  const { ops: once, created } = applyEnvelope(ops, wire, back, context());
  assert.deepEqual(created, [`message:${env.id}`]);
  const m = once.messages[0];
  assert.equal(m.from, "PC front · Op A");
  assert.equal(m.to, "PC arrière");
  assert.equal(m.via, "Liaison");
  assert.equal(m.priority, "Urgent");
  assert.equal(m.number, 7);
  assert.deepEqual(m.tags, ["liaison"]);
  opsSchema.parse(once);
  // Received again (another post, a resend): nothing new.
  const twice = applyEnvelope(once, wire, back, context(8));
  assert.equal(twice.ops, once);
  assert.equal(twice.ops.messages.length, 1);
  // Garbage is ignored.
  assert.equal(applyEnvelope(ops, { id: "x" }, back, context()).ops, ops);
});

test("a diffusion with its order crosses, is acknowledged there and the receipt comes back", () => {
  const front = liaison({ openedAt: min(0) });
  const back = liaison({ name: "PC front", self: "PC arrière" });
  let fops = { ...opsSchema.parse({}), liaisons: [front] };
  fops = upsert(
    fops,
    "orders",
    {
      ...emptyOrder({ title: "Ordre d’engagement", status: "Émis" }),
      number: 3,
    },
    "Chef",
  );
  const order = fops.orders[0];
  const b = broadcast({
    recipients: ["Logistique", "PC arrière"],
    target: `order:${order.id}`,
    ack: "Compris",
    sentAt: min(5),
  });
  fops = upsert(fops, "broadcasts", b, "Chef");
  fops = upsert(fops, "orders", { ...order, broadcastId: b.id }, "Chef");
  // Queued once, with the same id on every post.
  const queued = toForward(fops, "Chef", min(6));
  assert.equal(queued.length, 1);
  assert.equal(queued[0].id, toForward(fops, "Autre poste", min(7))[0].id);
  fops = { ...fops, exchanges: [...fops.exchanges, ...queued] };
  assert.equal(toForward(fops, "Chef", min(6)).length, 0);
  assert.equal(pendingOut(fops, front.id).length, 1);
  // Diffusions older than the liaison stay home.
  assert.equal(
    toForward(
      { ...fops, exchanges: [], liaisons: [{ ...front, openedAt: min(9) }] },
      "Chef",
      min(10),
    ).length,
    0,
  );

  // PC arrière receives it.
  const envelope = JSON.parse(queued[0].payload);
  let bops = { ...opsSchema.parse({}), liaisons: [back] };
  const got = applyEnvelope(bops, envelope, back, context());
  bops = got.ops;
  assert.deepEqual(
    got.created.sort(),
    [`broadcast:${b.id}`, `message:${b.id}`, `order:${order.id}`].sort(),
  );
  assert.equal(bops.orders[0].source, "PC front");
  assert.equal(bops.broadcasts[0].source, "PC front");
  assert.deepEqual(bops.broadcasts[0].recipients, ["PC arrière"]);
  const there = me("Chef", { name: "Op B", pc: "PC arrière" });
  assert.equal(inbox({ ops: bops }, there).length, 1);
  // Acknowledged there: the receipt is queued back automatically.
  for (const a of acksFor(
    bops.broadcasts[0],
    bops.acks,
    there,
    "Compris",
    min(21),
  ))
    bops = upsert(bops, "acks", a, "Op B");
  const back2 = toForward(bops, "Op B", min(21));
  assert.equal(back2.length, 1);
  assert.equal(back2[0].kind, "ack");

  // PC front: the receipt answers its recipient "PC arrière".
  fops = markDelivered(fops, [queued[0].id], min(20));
  assert.equal(pendingOut(fops, front.id).length, 0);
  const returned = applyEnvelope(
    fops,
    JSON.parse(back2[0].payload),
    front,
    context(),
  );
  const states = recipientStates(b, returned.ops.acks, T0 + 30 * 60_000);
  const arr = states.find((s) => s.recipient === "PC arrière");
  assert.equal(arr.ack.kind, "Compris");
  assert.equal(arr.ack.source, "PC arrière");
  assert.equal(states.find((s) => s.recipient === "Logistique").ack, undefined);
  // The receipt is not sent back again from PC front.
  assert.equal(
    toForward({ ...returned.ops }, "Chef", min(31)).filter(
      (x) => x.kind === "ack",
    ).length,
    0,
  );
  opsSchema.parse(returned.ops);
});

test("liaison ids are stable, envelopes are validated, liaison codes open other rooms than sessions", async () => {
  const id = stableUuid("x:broadcast:1");
  assert.equal(id, stableUuid("x:broadcast:1"));
  assert.notEqual(id, stableUuid("x:broadcast:2"));
  assert.match(
    id,
    /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
  );
  const l = liaison();
  const b = broadcastSchema.parse({
    ...broadcast(),
    createdAt: min(0),
    updatedAt: min(0),
    by: "A",
  });
  const env = broadcastEnvelope(l, b, undefined, "A", min(1));
  assert.equal(env.id, broadcastEnvelope(l, b, undefined, "B", min(2)).id);
  const x = outgoing(l, env, b.title, `broadcast:${b.id}`, "A", min(1));
  assert.equal(x.direction, "out");
  assert.equal(x.deliveredAt, "");
  const ack = ackSchema.parse({
    id: crypto.randomUUID(),
    createdAt: min(2),
    updatedAt: min(2),
    by: "B",
    broadcastId: b.id,
    recipient: "PC arrière",
    kind: "Lu",
    at: min(2),
  });
  assert.equal(ackEnvelope(l, ack, "B", min(3)).kind, "ack");
  assert.ok(!envelopeSchema.safeParse({ ...env, kind: "state" }).success);
  const code = "V7NR-J7T5-PY7K-M3P4";
  const [liaisonRoom, sessionRoom] = await Promise.all([
    liaisonKeys(code),
    roomKeys(code),
  ]);
  assert.match(liaisonRoom.room, /^[0-9a-f]{64}$/);
  assert.notEqual(liaisonRoom.room, sessionRoom.room);
  assert.equal((await liaisonKeys(code.toLowerCase())).room, liaisonRoom.room);
});
