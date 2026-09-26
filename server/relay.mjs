import { createHash, randomBytes } from "node:crypto";

// Live synchronisation relay. Posts of the same session join a room whose id
// is derived from the session code (PBKDF2 then HKDF, in the browser); the
// server never sees the code, the key or the content. It forwards opaque,
// end-to-end encrypted frames to the other posts of the room (or to one of
// them) and keeps nothing: no database, no disk, no log of content. When the
// last post leaves, the room is gone.
//
// Protocol 2 (shared/room.ts):
// - the client opens /sync (no query) and sends, as its first text message,
//   {"t":"join","room":"<64 hex>","v":2};
// - the relay answers {"t":"welcome","id":"<8 chars>","v":2} and tells every
//   post of the room how many posts are there: {"t":"peers","n":3};
// - posts send binary frames [1][to: 8 bytes][iv + ciphertext]; the relay
//   writes the sender id in place of `to` and forwards the frame to that
//   post only, or to every other post when `to` is zeros;
// - errors: {"t":"error","code":"version"|"full"|"busy"|"rate"|"room"|
//   "timeout","v":2}, then the connection closes.
// A post of protocol 1 (room in the URL) is refused with 426.
//
// Minimal WebSocket server (RFC 6455) without dependencies. Memory stays
// flat: incoming data is kept as a list of chunks, each outgoing frame is
// built once per broadcast, and a post that does not read (its send buffer
// above LIMITS.backlog) is disconnected instead of being buffered for.

const GUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";
export const PROTOCOL = 2;
const MAX_CONTROL = 4096;
const HEARTBEAT = 25_000;
export const LIMITS = {
  /** Largest frame: clients split messages into parts of 192 KiB. */
  payload: 1024 * 1024,
  peersPerRoom: 64,
  rooms: 2000,
  /** One address may be a whole command post behind one NAT. */
  socketsPerIp: 96,
  roomsPerIp: 16,
  /** Joins per address: a burst of 30, then one every 2 s. */
  joinBurst: 30,
  joinRefillMs: 2000,
  /** Bytes waiting to be sent to one post before it is disconnected. */
  backlog: 8 * 1024 * 1024,
  joinTimeout: 10_000,
};
const BROADCAST = Buffer.alloc(8);

function frame(opcode, payload = Buffer.alloc(0)) {
  const length = payload.length;
  let header;
  if (length < 126) header = Buffer.from([0x80 | opcode, length]);
  else if (length < 65536)
    header = Buffer.from([0x80 | opcode, 126, length >> 8, length & 255]);
  else {
    header = Buffer.alloc(10);
    header[0] = 0x80 | opcode;
    header[1] = 127;
    header.writeBigUInt64BE(BigInt(length), 2);
  }
  return Buffer.concat([header, payload]);
}
const text = (value) => frame(1, Buffer.from(JSON.stringify(value)));

/** Address of the client: the hosting proxy (Railway) tells it. */
export function clientAddress(req) {
  const real = req.headers["x-real-ip"];
  if (typeof real === "string" && real.trim()) return real.trim();
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.trim())
    return forwarded.split(",")[0].trim();
  return req.socket?.remoteAddress ?? "";
}

class Peer {
  constructor(socket, ip, handlers, limits) {
    this.limits = limits;
    this.id = [...randomBytes(8)]
      .map((b) => "0123456789abcdefghijklmnopqrstuvwxyz"[b % 36])
      .join("");
    this.socket = socket;
    this.ip = ip;
    this.room = null;
    this.chunks = [];
    this.length = 0;
    this.fragments = [];
    this.fragmentBytes = 0;
    this.fragmentOpcode = 0;
    this.alive = true;
    this.closed = false;
    this.handlers = handlers;
    socket.setNoDelay(true);
    socket.on("data", (chunk) => this.read(chunk));
    socket.on("close", () => this.finish());
    socket.on("error", () => this.finish());
    this.joinTimer = setTimeout(() => {
      if (!this.room) this.fail("timeout", 1008);
    }, limits.joinTimeout);
    this.joinTimer.unref?.();
  }
  /** Send a frame built by the caller (shared between recipients). */
  write(buffer) {
    if (this.closed) return;
    this.socket.write(buffer);
    // Backpressure: a post that does not keep up is disconnected; it
    // reconnects and catches up from the others (only what it lacks).
    if (this.socket.writableLength > this.limits.backlog) this.close(1013);
  }
  send(value) {
    this.write(text(value));
  }
  fail(code, close = 1008) {
    this.send({ t: "error", code, v: PROTOCOL });
    this.close(close);
  }
  ping() {
    if (!this.alive) return this.close(1001);
    this.alive = false;
    this.write(frame(9));
  }
  close(code = 1000) {
    if (this.closed) return;
    const payload = Buffer.alloc(2);
    payload.writeUInt16BE(code);
    // end() sends the close frame after what is queued, then closes; the
    // socket is destroyed only if the other side never finishes.
    this.socket.end(frame(8, payload));
    const timer = setTimeout(() => this.socket.destroy(), 2000);
    timer.unref?.();
    this.finish(false);
  }
  finish(destroy = true) {
    if (!this.closed) {
      this.closed = true;
      clearTimeout(this.joinTimer);
      this.chunks = [];
      this.fragments = [];
      this.handlers.leave(this);
    }
    if (destroy) this.socket.destroy();
  }
  /** First `n` bytes waiting, without joining every chunk. */
  peek(n) {
    if (this.chunks[0].length >= n) return this.chunks[0];
    const parts = [];
    let size = 0;
    for (const c of this.chunks) {
      parts.push(c);
      size += c.length;
      if (size >= n) break;
    }
    return Buffer.concat(parts, size);
  }
  /** Remove and return the first `n` bytes waiting. */
  take(n) {
    const out = Buffer.allocUnsafe(n);
    let offset = 0;
    while (offset < n) {
      const c = this.chunks[0];
      const size = Math.min(c.length, n - offset);
      c.copy(out, offset, 0, size);
      offset += size;
      if (size === c.length) this.chunks.shift();
      else this.chunks[0] = c.subarray(size);
    }
    this.length -= n;
    return out;
  }
  read(chunk) {
    if (this.closed) return;
    this.chunks.push(chunk);
    this.length += chunk.length;
    while (this.length >= 2) {
      const head = this.peek(Math.min(this.length, 14));
      const first = head[0];
      const second = head[1];
      const fin = (first & 0x80) !== 0;
      const opcode = first & 0x0f;
      const masked = (second & 0x80) !== 0;
      let length = second & 0x7f;
      let offset = 2;
      if (!masked) return this.close(1002);
      if (length === 126) {
        if (head.length < 4) return;
        length = head.readUInt16BE(2);
        offset = 4;
      } else if (length === 127) {
        if (head.length < 10) return;
        const big = head.readBigUInt64BE(2);
        if (big > BigInt(this.limits.payload)) return this.close(1009);
        length = Number(big);
        offset = 10;
      }
      if (length > this.limits.payload) return this.close(1009);
      if (this.length < offset + 4 + length) return;
      const data = this.take(offset + 4 + length);
      const mask = data.subarray(offset, offset + 4);
      const payload = data.subarray(offset + 4);
      for (let i = 0; i < payload.length; i++) payload[i] ^= mask[i & 3];
      this.alive = true;
      if (opcode === 8) return this.close(1000);
      if (opcode === 9) {
        this.write(frame(10, payload));
        continue;
      }
      if (opcode === 10) continue;
      if (opcode === 0 || opcode === 1 || opcode === 2) {
        if (opcode !== 0) this.fragmentOpcode = opcode;
        this.fragments.push(payload);
        this.fragmentBytes += payload.length;
        if (this.fragmentBytes > this.limits.payload) return this.close(1009);
        if (!fin) continue;
        const message =
          this.fragments.length === 1
            ? this.fragments[0]
            : Buffer.concat(this.fragments, this.fragmentBytes);
        this.fragments = [];
        this.fragmentBytes = 0;
        if (this.fragmentOpcode === 1) this.handlers.control(this, message);
        else this.handlers.data(this, message);
        if (this.closed) return;
        continue;
      }
      return this.close(1002);
    }
  }
}

/**
 * `shared`: other upgrade handlers exist (Vite's hot reload in development).
 * `limits`: overrides of LIMITS (tests).
 */
export function attachRelay(server, { shared = false, limits = {} } = {}) {
  const L = { ...LIMITS, ...limits };
  const rooms = new Map();
  const sockets = new Map(); // ip → open sockets
  const roomsByIp = new Map(); // ip → Map(room → posts)
  const joins = new Map(); // ip → { tokens, at }
  const count = (map, key, delta) => {
    const n = (map.get(key) ?? 0) + delta;
    if (n > 0) map.set(key, n);
    else map.delete(key);
  };
  const announce = (room) => {
    const peers = rooms.get(room);
    if (!peers) return;
    const message = text({ t: "peers", n: peers.size });
    for (const peer of peers) peer.write(message);
  };
  const allowJoin = (ip) => {
    const now = Date.now();
    const bucket = joins.get(ip) ?? { tokens: L.joinBurst, at: now };
    bucket.tokens = Math.min(
      L.joinBurst,
      bucket.tokens + (now - bucket.at) / L.joinRefillMs,
    );
    bucket.at = now;
    joins.set(ip, bucket);
    if (bucket.tokens < 1) return false;
    bucket.tokens -= 1;
    return true;
  };
  const handlers = {
    leave(peer) {
      count(sockets, peer.ip, -1);
      if (!peer.room) return;
      const peers = rooms.get(peer.room);
      const own = roomsByIp.get(peer.ip);
      if (own) {
        count(own, peer.room, -1);
        if (!own.size) roomsByIp.delete(peer.ip);
      }
      if (!peers) return;
      peers.delete(peer);
      if (!peers.size) rooms.delete(peer.room);
      else announce(peer.room);
    },
    control(peer, message) {
      if (message.length > MAX_CONTROL) return peer.close(1009);
      let value;
      try {
        value = JSON.parse(message.toString());
      } catch {
        return peer.close(1003);
      }
      if (peer.room || value?.t !== "join") return;
      if (value.v !== PROTOCOL) return peer.fail("version");
      const room = String(value.room ?? "");
      if (!/^[a-f0-9]{64}$/.test(room)) return peer.fail("room");
      if (!allowJoin(peer.ip)) return peer.fail("rate", 1013);
      const peers = rooms.get(room) ?? new Set();
      const own = roomsByIp.get(peer.ip) ?? new Map();
      if (peers.size >= L.peersPerRoom) return peer.fail("full", 1013);
      if (
        !rooms.has(room) &&
        (rooms.size >= L.rooms || own.size >= L.roomsPerIp)
      )
        return peer.fail("busy", 1013);
      clearTimeout(peer.joinTimer);
      peer.room = room;
      rooms.set(room, peers);
      peers.add(peer);
      count(own, room, 1);
      roomsByIp.set(peer.ip, own);
      peer.send({ t: "welcome", id: peer.id, v: PROTOCOL });
      announce(room);
    },
    data(peer, message) {
      // Content is opaque: only the kind and the recipient are read.
      if (!peer.room || message.length < 21 || message[0] !== 1) return;
      const to = message.subarray(1, 9);
      const everyone = to.equals(BROADCAST);
      const target = everyone ? "" : to.toString("latin1");
      message.write(peer.id, 1, 8, "latin1");
      const out = frame(2, message);
      for (const other of rooms.get(peer.room) ?? [])
        if (other !== peer && (everyone || other.id === target))
          other.write(out);
    },
  };
  server.on("upgrade", (req, socket) => {
    const reject = (status) => {
      socket.end(`HTTP/1.1 ${status}\r\nConnection: close\r\n\r\n`);
    };
    try {
      const url = new URL(req.url, "http://localhost");
      const key = req.headers["sec-websocket-key"];
      if (url.pathname !== "/sync")
        return shared ? undefined : reject("404 Not Found");
      // Protocol 1 put the room in the URL: such a page must be reloaded.
      if (url.searchParams.has("room")) return reject("426 Upgrade Required");
      if (
        typeof key !== "string" ||
        req.headers["sec-websocket-version"] !== "13" ||
        (req.headers.upgrade ?? "").toLowerCase() !== "websocket"
      )
        return reject("400 Bad Request");
      // Browsers send Origin: only pages of this site may join a room.
      const origin = req.headers.origin;
      if (origin && new URL(origin).host !== req.headers.host)
        return reject("403 Forbidden");
      const ip = clientAddress(req);
      if ((sockets.get(ip) ?? 0) >= L.socketsPerIp)
        return reject("429 Too Many Requests");
      const accept = createHash("sha1")
        .update(key + GUID)
        .digest("base64");
      socket.write(
        "HTTP/1.1 101 Switching Protocols\r\n" +
          "Upgrade: websocket\r\n" +
          "Connection: Upgrade\r\n" +
          `Sec-WebSocket-Accept: ${accept}\r\n\r\n`,
      );
      count(sockets, ip, 1);
      new Peer(socket, ip, handlers, L);
    } catch {
      reject("400 Bad Request");
    }
  });
  const timer = setInterval(() => {
    for (const peers of rooms.values()) for (const peer of peers) peer.ping();
    // Forget idle, refilled join counters.
    const now = Date.now();
    for (const [ip, bucket] of joins)
      if (now - bucket.at > L.joinBurst * L.joinRefillMs) joins.delete(ip);
  }, HEARTBEAT);
  timer.unref();
  return {
    rooms,
    stats: () => ({
      rooms: rooms.size,
      addresses: sockets.size,
      joins: joins.size,
    }),
    close() {
      clearInterval(timer);
      for (const peers of rooms.values())
        for (const peer of [...peers]) peer.close(1001);
    },
  };
}
