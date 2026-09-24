import { createHash, randomUUID } from "node:crypto";

// Live synchronisation relay. Posts of the same session join a room whose
// name is a hash of the session code; the server never sees the code, the
// key or the content. It forwards opaque, end-to-end encrypted messages to
// the other posts of the room and keeps nothing: no database, no disk, no log
// of content. When the last post leaves, the room is gone.
//
// Minimal WebSocket server (RFC 6455) without dependencies.

const GUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";
const MAX_PAYLOAD = 24 * 1024 * 1024;
const MAX_PEERS = 64;
const MAX_ROOMS = 2000;
const HEARTBEAT = 25_000;

function frame(opcode, payload = Buffer.alloc(0)) {
  const length = payload.length;
  const header =
    length < 126
      ? Buffer.from([0x80 | opcode, length])
      : length < 65536
        ? Buffer.from([0x80 | opcode, 126, length >> 8, length & 255])
        : Buffer.concat([
            Buffer.from([0x80 | opcode, 127]),
            (() => {
              const b = Buffer.alloc(8);
              b.writeBigUInt64BE(BigInt(length));
              return b;
            })(),
          ]);
  return Buffer.concat([header, payload]);
}

class Peer {
  constructor(socket, room, onMessage, onClose) {
    this.id = randomUUID();
    this.socket = socket;
    this.room = room;
    this.buffer = Buffer.alloc(0);
    this.fragments = [];
    this.fragmentOpcode = 0;
    this.alive = true;
    this.closed = false;
    this.onMessage = onMessage;
    this.onClose = onClose;
    socket.setNoDelay(true);
    socket.on("data", (chunk) => this.read(chunk));
    socket.on("close", () => this.finish());
    socket.on("error", () => this.finish());
  }
  send(text) {
    if (!this.closed) this.socket.write(frame(1, Buffer.from(text)));
  }
  ping() {
    if (!this.alive) return this.close(1001);
    this.alive = false;
    if (!this.closed) this.socket.write(frame(9));
  }
  close(code = 1000) {
    if (this.closed) return;
    const payload = Buffer.alloc(2);
    payload.writeUInt16BE(code);
    this.socket.end(frame(8, payload));
    this.finish();
  }
  finish() {
    if (this.closed) return;
    this.closed = true;
    this.socket.destroy();
    this.onClose(this);
  }
  read(chunk) {
    this.buffer = Buffer.concat([this.buffer, chunk]);
    while (this.buffer.length >= 2) {
      const first = this.buffer[0];
      const second = this.buffer[1];
      const fin = (first & 0x80) !== 0;
      const opcode = first & 0x0f;
      const masked = (second & 0x80) !== 0;
      let length = second & 0x7f;
      let offset = 2;
      if (!masked) return this.close(1002);
      if (length === 126) {
        if (this.buffer.length < 4) return;
        length = this.buffer.readUInt16BE(2);
        offset = 4;
      } else if (length === 127) {
        if (this.buffer.length < 10) return;
        const big = this.buffer.readBigUInt64BE(2);
        if (big > BigInt(MAX_PAYLOAD)) return this.close(1009);
        length = Number(big);
        offset = 10;
      }
      if (length > MAX_PAYLOAD) return this.close(1009);
      if (this.buffer.length < offset + 4 + length) return;
      const mask = this.buffer.subarray(offset, offset + 4);
      const payload = Buffer.from(
        this.buffer.subarray(offset + 4, offset + 4 + length),
      );
      for (let i = 0; i < payload.length; i++) payload[i] ^= mask[i & 3];
      this.buffer = this.buffer.subarray(offset + 4 + length);
      this.alive = true;
      if (opcode === 8) return this.close(1000);
      if (opcode === 9) {
        this.socket.write(frame(10, payload));
        continue;
      }
      if (opcode === 10) continue;
      if (opcode === 0 || opcode === 1 || opcode === 2) {
        if (opcode !== 0) this.fragmentOpcode = opcode;
        this.fragments.push(payload);
        const size = this.fragments.reduce((n, b) => n + b.length, 0);
        if (size > MAX_PAYLOAD) return this.close(1009);
        if (!fin) continue;
        const message = Buffer.concat(this.fragments);
        this.fragments = [];
        if (this.fragmentOpcode === 1) this.onMessage(this, message.toString());
        continue;
      }
      return this.close(1002);
    }
  }
}

export function attachRelay(server) {
  const rooms = new Map();
  const announce = (room) => {
    const peers = rooms.get(room);
    if (!peers) return;
    const text = JSON.stringify({ t: "peers", n: peers.size });
    for (const peer of peers) peer.send(text);
  };
  const leave = (peer) => {
    const peers = rooms.get(peer.room);
    if (!peers) return;
    peers.delete(peer);
    if (!peers.size) rooms.delete(peer.room);
    else announce(peer.room);
  };
  const relay = (from, text) => {
    // Content is opaque: only the envelope type is checked.
    if (!text.startsWith('{"t":"box"')) return;
    for (const peer of rooms.get(from.room) ?? [])
      if (peer !== from) peer.send(text);
  };
  server.on("upgrade", (req, socket) => {
    const reject = (status) => {
      socket.end(`HTTP/1.1 ${status}\r\nConnection: close\r\n\r\n`);
    };
    try {
      const url = new URL(req.url, "http://localhost");
      const room = url.searchParams.get("room") ?? "";
      const key = req.headers["sec-websocket-key"];
      if (url.pathname !== "/sync") return reject("404 Not Found");
      if (
        !/^[a-f0-9]{64}$/.test(room) ||
        typeof key !== "string" ||
        req.headers["sec-websocket-version"] !== "13" ||
        (req.headers.upgrade ?? "").toLowerCase() !== "websocket"
      )
        return reject("400 Bad Request");
      // Browsers send Origin: only pages of this site may join a room.
      const origin = req.headers.origin;
      if (origin && new URL(origin).host !== req.headers.host)
        return reject("403 Forbidden");
      const peers = rooms.get(room) ?? new Set();
      if (
        peers.size >= MAX_PEERS ||
        (!rooms.has(room) && rooms.size >= MAX_ROOMS)
      )
        return reject("503 Service Unavailable");
      const accept = createHash("sha1")
        .update(key + GUID)
        .digest("base64");
      socket.write(
        "HTTP/1.1 101 Switching Protocols\r\n" +
          "Upgrade: websocket\r\n" +
          "Connection: Upgrade\r\n" +
          `Sec-WebSocket-Accept: ${accept}\r\n\r\n`,
      );
      rooms.set(room, peers);
      peers.add(new Peer(socket, room, relay, leave));
      announce(room);
    } catch {
      reject("400 Bad Request");
    }
  });
  const timer = setInterval(() => {
    for (const peers of rooms.values()) for (const peer of peers) peer.ping();
  }, HEARTBEAT);
  timer.unref();
  return {
    rooms,
    close() {
      clearInterval(timer);
      for (const peers of rooms.values())
        for (const peer of [...peers]) peer.close(1001);
    },
  };
}
