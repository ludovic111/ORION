import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { handle } from "../server/app.mjs";
import { attachRelay } from "../server/relay.mjs";

let server, relay, base;
before(async () => {
  server = createServer(handle);
  relay = attachRelay(server);
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  base = `ws://127.0.0.1:${server.address().port}/sync?room=`;
});
after(() => {
  relay.close();
  server.close();
});

const room = (c) => c.repeat(64);
function open(url) {
  const socket = new WebSocket(url);
  const inbox = [];
  const waiters = [];
  socket.addEventListener("message", (e) => {
    const value = JSON.parse(e.data);
    const waiter = waiters.findIndex((w) => w.match(value));
    if (waiter >= 0) waiters.splice(waiter, 1)[0].resolve(value);
    else inbox.push(value);
  });
  const next = (match = () => true) => {
    const found = inbox.findIndex(match);
    if (found >= 0) return Promise.resolve(inbox.splice(found, 1)[0]);
    return new Promise((resolve) => waiters.push({ match, resolve }));
  };
  const ready = new Promise((resolve, reject) => {
    socket.addEventListener("open", () => resolve(socket), { once: true });
    socket.addEventListener("error", reject, { once: true });
  });
  return { socket, next, ready };
}

test("relay forwards encrypted envelopes to the other posts of the same room only", async () => {
  const a = open(base + room("a"));
  const b = open(base + room("a"));
  const other = open(base + room("b"));
  await Promise.all([a.ready, b.ready, other.ready]);
  await b.next((m) => m.t === "peers" && m.n === 2);
  a.socket.send(JSON.stringify({ t: "box", iv: "x", d: "secret" }));
  a.socket.send("not an envelope");
  const received = await b.next((m) => m.t === "box");
  assert.deepEqual(received, { t: "box", iv: "x", d: "secret" });
  // A large message crosses the 64 KiB frame boundary.
  const big = "x".repeat(300_000);
  b.socket.send(JSON.stringify({ t: "box", iv: "y", d: big }));
  assert.equal((await a.next((m) => m.t === "box")).d.length, big.length);
  a.socket.close();
  assert.equal((await b.next((m) => m.t === "peers" && m.n === 1)).n, 1);
  b.socket.close();
  other.socket.close();
});

test("relay refuses malformed rooms and other paths", async () => {
  const bad = new WebSocket(base + "short");
  await new Promise((resolve) => bad.addEventListener("error", resolve));
  const response = await fetch(
    base.replace("ws:", "http:").replace("/sync?room=", "/healthz"),
  );
  assert.equal(await response.text(), "ok");
});
