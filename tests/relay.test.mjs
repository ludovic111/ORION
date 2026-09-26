import { after, test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { connect } from "node:net";
import { randomBytes } from "node:crypto";
import { handle } from "../server/app.mjs";
import { attachRelay } from "../server/relay.mjs";

const servers = [];
async function relayServer(limits = {}) {
  const server = createServer(handle);
  const relay = attachRelay(server, { limits });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  servers.push({ server, relay });
  return { relay, url: `ws://127.0.0.1:${server.address().port}/sync` };
}
after(() => {
  for (const { server, relay } of servers) {
    relay.close();
    server.close();
  }
});

const room = (c) => c.repeat(64);
/** A post connected to the relay: text controls and binary frames. */
function open(url) {
  const socket = new WebSocket(url);
  socket.binaryType = "arraybuffer";
  const inbox = [];
  const waiters = [];
  const deliver = (value) => {
    const w = waiters.findIndex((x) => x.match(value));
    if (w >= 0) waiters.splice(w, 1)[0].resolve(value);
    else inbox.push(value);
  };
  socket.addEventListener("message", (e) =>
    deliver(
      typeof e.data === "string"
        ? JSON.parse(e.data)
        : { t: "frame", bytes: new Uint8Array(e.data) },
    ),
  );
  const closed = new Promise((resolve) =>
    socket.addEventListener("close", (e) => resolve(e.code)),
  );
  const next = (match = () => true) => {
    const found = inbox.findIndex(match);
    if (found >= 0) return Promise.resolve(inbox.splice(found, 1)[0]);
    return new Promise((resolve) => waiters.push({ match, resolve }));
  };
  const ready = new Promise((resolve, reject) => {
    socket.addEventListener("open", () => resolve(socket), { once: true });
    socket.addEventListener("error", reject, { once: true });
  });
  const join = async (id, v = 2) => {
    await ready;
    socket.send(JSON.stringify({ t: "join", room: id, v }));
    return next((m) => m.t === "welcome" || m.t === "error");
  };
  return { socket, next, ready, join, closed, inbox };
}
/** Binary frame of protocol 2: [1][to: 8][payload]. */
const frame = (payload, to = "") => {
  const out = new Uint8Array(9 + payload.length);
  out[0] = 1;
  if (to) out.set(new TextEncoder().encode(to), 1);
  out.set(payload, 9);
  return out;
};
const bytes = (n, fill = 7) => new Uint8Array(n).fill(fill);

test("relay forwards frames to the other posts of the same room, with the sender id", async () => {
  const { url } = await relayServer();
  const a = open(url);
  const b = open(url);
  const c = open(url);
  const other = open(url);
  const wa = await a.join(room("a"));
  const wb = await b.join(room("a"));
  await c.join(room("a"));
  await other.join(room("b"));
  assert.match(wa.id, /^[0-9a-z]{8}$/);
  assert.notEqual(wa.id, wb.id);
  assert.equal(wa.v, 2);
  await b.next((m) => m.t === "peers" && m.n === 3);
  // To everyone.
  a.socket.send(frame(bytes(40)));
  const got = await b.next((m) => m.t === "frame");
  assert.equal(got.bytes[0], 1);
  assert.equal(new TextDecoder().decode(got.bytes.subarray(1, 9)), wa.id);
  assert.deepEqual(got.bytes.subarray(9), bytes(40));
  await c.next((m) => m.t === "frame");
  // To one post only.
  a.socket.send(frame(bytes(30, 9), wb.id));
  const direct = await b.next((m) => m.t === "frame");
  assert.deepEqual(direct.bytes.subarray(9), bytes(30, 9));
  // A large frame crosses the 64 KiB boundary.
  b.socket.send(frame(bytes(300_000, 3)));
  assert.equal((await a.next((m) => m.t === "frame")).bytes.length, 300_009);
  await new Promise((r) => setTimeout(r, 50));
  assert.equal(
    c.inbox.filter((m) => m.t === "frame").length,
    1,
    "the direct frame went to b only",
  );
  assert.equal(other.inbox.filter((m) => m.t === "frame").length, 0);
  a.socket.close();
  assert.equal((await b.next((m) => m.t === "peers" && m.n === 2)).n, 2);
  for (const p of [b, c, other]) p.socket.close();
});

test("relay refuses rooms in the URL (protocol 1), bad rooms and other versions", async () => {
  const { url } = await relayServer();
  const legacy = new WebSocket(`${url}?room=${room("a")}`);
  await new Promise((resolve) => legacy.addEventListener("error", resolve));
  const bad = open(url);
  assert.deepEqual(await bad.join("short"), { t: "error", code: "room", v: 2 });
  const old = open(url);
  assert.equal((await old.join(room("c"), 1)).code, "version");
  const response = await fetch(
    url.replace("ws:", "http:").replace("/sync", "/healthz"),
  );
  assert.equal(await response.text(), "ok");
});

test("relay limits rooms and joins per address, and posts per room", async () => {
  const { url } = await relayServer({ roomsPerIp: 2, peersPerRoom: 2 });
  const posts = [open(url), open(url), open(url)];
  assert.equal((await posts[0].join(room("1"))).t, "welcome");
  assert.equal((await posts[1].join(room("2"))).t, "welcome");
  assert.equal((await posts[2].join(room("3"))).code, "busy");
  const same = open(url);
  assert.equal((await same.join(room("1"))).t, "welcome");
  const third = open(url);
  assert.equal((await third.join(room("1"))).code, "full");
  for (const p of [...posts, same, third]) p.socket.close();

  const limited = await relayServer({ joinBurst: 2, joinRefillMs: 60_000 });
  const first = open(limited.url);
  const second = open(limited.url);
  const flood = open(limited.url);
  assert.equal((await first.join(room("4"))).t, "welcome");
  assert.equal((await second.join(room("4"))).t, "welcome");
  assert.equal((await flood.join(room("4"))).code, "rate");
  for (const p of [first, second, flood]) p.socket.close();

  const few = await relayServer({ socketsPerIp: 1 });
  const one = open(few.url);
  await one.ready;
  const two = new WebSocket(few.url);
  await new Promise((resolve) => two.addEventListener("error", resolve));
  one.socket.close();
});

test("relay closes a frame above its limit and a post that does not read", async () => {
  const { url, relay } = await relayServer({
    payload: 64 * 1024,
    backlog: 256 * 1024,
  });
  const big = open(url);
  await big.join(room("d"));
  big.socket.send(frame(bytes(70 * 1024)));
  assert.equal(await big.closed, 1009);

  // A raw socket that joins, then never reads.
  const port = Number(new URL(url).port);
  const slow = connect(port, "127.0.0.1");
  await new Promise((r) => slow.once("connect", r));
  slow.write(
    "GET /sync HTTP/1.1\r\nHost: 127.0.0.1\r\nUpgrade: websocket\r\nConnection: Upgrade\r\n" +
      `Sec-WebSocket-Key: ${randomBytes(16).toString("base64")}\r\nSec-WebSocket-Version: 13\r\n\r\n`,
  );
  await new Promise((r) => slow.once("data", r));
  const join = Buffer.from(
    JSON.stringify({ t: "join", room: room("e"), v: 2 }),
  );
  const mask = Buffer.from([1, 2, 3, 4]);
  const masked = Buffer.from(join.map((b, i) => b ^ mask[i & 3]));
  slow.write(
    Buffer.concat([Buffer.from([0x81, 0x80 | join.length]), mask, masked]),
  );
  await new Promise((r) => setTimeout(r, 50));
  slow.pause();
  const fast = open(url);
  await fast.join(room("e"));
  assert.equal(relay.rooms.get(room("e")).size, 2);
  for (let i = 0; i < 400; i++) fast.socket.send(frame(bytes(60 * 1024)));
  // The relay drops the post that does not keep up instead of buffering.
  for (let i = 0; i < 200 && relay.rooms.get(room("e")).size > 1; i++)
    await new Promise((r) => setTimeout(r, 25));
  assert.equal(relay.rooms.get(room("e")).size, 1);
  slow.destroy();
  fast.socket.close();
});
