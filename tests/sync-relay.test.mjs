import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { createHash, randomBytes } from "node:crypto";
import { handle } from "../server/app.mjs";
import { attachRelay } from "../server/relay.mjs";
import { addEntry, emptyFields, newJournal } from "../shared/journal.ts";
import { mergeWorkspace } from "../shared/sync.ts";
import {
  PART_BYTES,
  PROTOCOL,
  Reassembler,
  codeProblem,
  newRoomCode,
  normalizeCode,
  roomKeys,
  sealFrames,
  validCode,
} from "../shared/room.ts";

let server, relay, port;
before(async () => {
  server = createServer(handle);
  relay = attachRelay(server);
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  port = server.address().port;
});
after(() => {
  relay.close();
  server.close();
});

/** A post: joins the room of `code` and exchanges sealed messages. */
async function post(code) {
  const keys = await roomKeys(code);
  const socket = new WebSocket(`ws://127.0.0.1:${port}/sync`);
  socket.binaryType = "arraybuffer";
  const parts = new Reassembler(keys.key);
  const received = [];
  const waiting = [];
  let id = "";
  let queue = Promise.resolve();
  const welcome = new Promise((resolve) =>
    socket.addEventListener("message", (event) => {
      if (typeof event.data === "string") {
        const data = JSON.parse(event.data);
        if (data.t === "welcome") {
          id = data.id;
          resolve();
        }
        return;
      }
      const bytes = new Uint8Array(event.data);
      queue = queue.then(async () => {
        try {
          const message = await parts.accept(bytes);
          if (!message) return;
          const w = waiting.shift();
          if (w) w(message);
          else received.push(message);
        } catch {
          received.push("unreadable");
        }
      });
    }),
  );
  await new Promise((r) => socket.addEventListener("open", r, { once: true }));
  socket.send(JSON.stringify({ t: "join", room: keys.room, v: PROTOCOL }));
  await welcome;
  return {
    socket,
    id: () => id,
    send: async (value, to = "") => {
      for (const frame of await sealFrames(value, keys.key, to))
        socket.send(frame);
    },
    next: () =>
      received.length
        ? Promise.resolve(received.shift())
        : new Promise((r) => waiting.push(r)),
    received,
  };
}

test("session codes are well formed, normalised, and hand-made ones are explained", () => {
  const code = newRoomCode();
  assert.match(code, /^[2-9A-Z]{4}(-[2-9A-Z]{4}){3}$/);
  assert.ok(validCode(code.toLowerCase().replace(/-/g, " ")));
  assert.equal(normalizeCode("abcd efgh-jkmn pqrs"), "ABCD-EFGH-JKMN-PQRS");
  assert.match(codeProblem("ABCD-EFGH"), /incomplet : 8 caractères sur 16/);
  assert.match(codeProblem("ABCD-EFGH-JKMN-PQR0"), /jamais 0/);
  assert.match(codeProblem("ABCD-EFGH-IKMN-PQRS"), /jamais I/);
  assert.match(codeProblem("AAAA-AAAA-AAAA-AAAA"), /choisi à la main/);
  assert.match(codeProblem("2345-6789-ABCD-EFGH"), /choisi à la main/);
  assert.match(codeProblem(""), /Saisissez/);
  for (let i = 0; i < 200; i++) assert.equal(codeProblem(newRoomCode()), "");
});

test("the room id is derived with PBKDF2 and HKDF, apart from the key", async () => {
  const code = newRoomCode();
  const one = await roomKeys(code);
  const two = await roomKeys(code.toLowerCase());
  assert.equal(one.room, two.room);
  assert.match(one.room, /^[0-9a-f]{64}$/);
  // Not the plain hash of protocol 1, which a proxy log would expose to a
  // fast offline search.
  const plain = createHash("sha256")
    .update(`orion-aic/room/v1/${normalizeCode(code)}`)
    .digest("hex");
  assert.notEqual(one.room, plain);
  assert.notEqual((await roomKeys(newRoomCode())).room, one.room);
  assert.equal(one.key.extractable, false);
});

test("two posts exchange a journal through the relay, a third code cannot read it", async () => {
  const code = newRoomCode();
  const a = await post(code);
  const b = await post(code);
  const journal = addEntry(
    newJournal("Crue"),
    { ...emptyFields(), message: "Hausse du niveau" },
    "Poste A",
  );
  await a.send({
    type: "state",
    v: PROTOCOL,
    peer: "a",
    name: "A",
    journals: [journal],
  });
  const message = await b.next();
  assert.equal(message.from, a.id());
  const local = {
    version: 1,
    author: "Poste B",
    journals: [newJournal("Autre")],
    activeId: "",
  };
  local.activeId = local.journals[0].id;
  const merged = mergeWorkspace(local, message.value);
  assert.equal(merged.journals.length, 2);
  assert.equal(merged.author, "Poste B");
  // A wrong key cannot read, and says so.
  const other = await roomKeys(newRoomCode());
  const [frame] = await sealFrames({ secret: 1 }, (await roomKeys(code)).key);
  const relayed = new Uint8Array(frame);
  await assert.rejects(new Reassembler(other.key).accept(relayed));
  a.socket.close();
  b.socket.close();
});

test("a message larger than the relay limit is split into parts and put back together", async () => {
  const code = newRoomCode();
  const a = await post(code);
  const b = await post(code);
  const c = await post(code);
  // Incompressible content: about 6 MB once compressed.
  const payload = randomBytes(4_500_000).toString("base64");
  await a.send({ type: "state", big: payload }, b.id());
  const message = await b.next();
  assert.equal(message.value.big, payload);
  const frames = await sealFrames({ big: payload }, (await roomKeys(code)).key);
  assert.ok(frames.length > 20);
  assert.ok(frames.every((f) => f.length < PART_BYTES + 64));
  // Sent to b only: c received nothing.
  await new Promise((r) => setTimeout(r, 100));
  assert.equal(c.received.length, 0);
  for (const p of [a, b, c]) p.socket.close();
});
