import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { handle } from "../server/app.mjs";
import { attachRelay } from "../server/relay.mjs";
import { addEntry, emptyFields, newJournal } from "../shared/journal.ts";
import { mergeWorkspace } from "../shared/sync.ts";
import {
  newRoomCode,
  normalizeCode,
  roomKeys,
  seal,
  unseal,
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

async function post(code) {
  const keys = await roomKeys(code);
  const socket = new WebSocket(`ws://127.0.0.1:${port}/sync?room=${keys.room}`);
  const received = [];
  const waiting = [];
  socket.addEventListener("message", async (event) => {
    const data = JSON.parse(event.data);
    if (data.t !== "box") return;
    try {
      const value = await unseal(data, keys.key);
      const w = waiting.shift();
      if (w) w(value);
      else received.push(value);
    } catch {
      received.push("unreadable");
    }
  });
  await new Promise((r) => socket.addEventListener("open", r, { once: true }));
  return {
    socket,
    send: async (value) => socket.send(await seal(value, keys.key)),
    next: () =>
      received.length
        ? Promise.resolve(received.shift())
        : new Promise((r) => waiting.push(r)),
    received,
  };
}

test("session codes are well formed and normalised", () => {
  const code = newRoomCode();
  assert.match(code, /^[2-9A-Z]{4}(-[2-9A-Z]{4}){3}$/);
  assert.ok(validCode(code.toLowerCase().replace(/-/g, " ")));
  assert.equal(normalizeCode("abcd efgh-jkmn pqrs"), "ABCD-EFGH-JKMN-PQRS");
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
  await new Promise((r) => setTimeout(r, 50));
  await a.send({ type: "state", peer: "a", name: "A", journals: [journal] });
  const message = await b.next();
  const local = {
    version: 1,
    author: "Poste B",
    journals: [newJournal("Autre")],
    activeId: "",
  };
  local.activeId = local.journals[0].id;
  const merged = mergeWorkspace(local, message);
  assert.equal(merged.journals.length, 2);
  assert.equal(merged.author, "Poste B");
  assert.equal(
    merged.journals.find((j) => j.id === journal.id).entries.length,
    1,
  );
  // Same room hash is impossible to guess; a wrong key cannot decrypt.
  const keys = await roomKeys(code);
  const other = await roomKeys(newRoomCode());
  const box = JSON.parse(await seal({ secret: 1 }, keys.key));
  await assert.rejects(unseal(box, other.key));
  a.socket.close();
  b.socket.close();
});
