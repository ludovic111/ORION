import { deflateSync, inflateSync } from "fflate";

// A session code joins posts together. It never leaves the posts. From it,
// PBKDF2-SHA-256 (200 000 iterations) then HKDF derive two independent
// values: the room id sent to the relay (in the first WebSocket message,
// never in the URL) and the AES-256-GCM key of the messages. Guessing a code
// from a room id costs a PBKDF2 per guess, like guessing the key.
//
// Messages are compressed, encrypted and split into parts well under the
// limit of the relay; each part travels as a binary WebSocket frame:
//
//   client → relay   [1][to: 8 bytes, zeros = everyone][iv: 12][ciphertext]
//   relay → client   [1][from: 8 bytes][iv: 12][ciphertext]
//
// The plaintext of a part starts with the id of its message, its index and
// the number of parts, all authenticated by AES-GCM.

/** Version of the synchronisation protocol (relay and messages). */
export const PROTOCOL = 2;

const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ"; // no 0/O, 1/I/L
const ITERATIONS = 200_000;

export function newRoomCode(): string {
  // Rejection sampling: every character equally likely (≈ 79 bits).
  const chars: string[] = [];
  const limit = 256 - (256 % ALPHABET.length);
  while (chars.length < 16)
    for (const b of crypto.getRandomValues(new Uint8Array(24)))
      if (b < limit && chars.length < 16)
        chars.push(ALPHABET[b % ALPHABET.length]);
  return [0, 4, 8, 12].map((i) => chars.slice(i, i + 4).join("")).join("-");
}

export function normalizeCode(value: string): string {
  const clean = value.toUpperCase().replace(/[^A-Z0-9]/g, "");
  return clean.match(/.{1,4}/g)?.join("-") ?? "";
}

/**
 * Why a typed code cannot be a session code ("" when it can): codes are
 * made by orion aic, 16 characters of its alphabet, drawn at random.
 */
export function codeProblem(value: string): string {
  const clean = normalizeCode(value).replace(/-/g, "");
  if (!clean)
    return "Saisissez le code de session : 4 groupes de 4 caractères.";
  const foreign = [...new Set(clean.replace(/[23456789A-HJKMNP-Z]/g, ""))];
  if (foreign.length)
    return `Un code de session ne contient jamais ${foreign.join(", ")} (les caractères 0, 1, I, L et O sont exclus pour éviter les confusions). Vérifiez la saisie.`;
  if (clean.length < 16)
    return `Code incomplet : ${clean.length} caractères sur 16 (4 groupes de 4).`;
  if (clean.length > 16)
    return "Code trop long : 16 caractères (4 groupes de 4).";
  // A code drawn at random (≈ 79 bits) practically never looks like these.
  let run = 1;
  let longest = 1;
  for (let i = 1; i < clean.length; i++) {
    const step = ALPHABET.indexOf(clean[i]) - ALPHABET.indexOf(clean[i - 1]);
    run = step === 1 || step === -1 || step === 0 ? run + 1 : 1;
    longest = Math.max(longest, run);
  }
  if (new Set(clean).size < 6 || longest >= 6)
    return "Ce code semble choisi à la main (trop régulier) : il serait facile à deviner. Utilisez un code créé par orion aic (Réglages → Synchronisation → Créer un code).";
  return "";
}
export const validCode = (value: string) => !codeProblem(value);

const hex = (buffer: ArrayBuffer) =>
  [...new Uint8Array(buffer)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
const text = (s: string) => new TextEncoder().encode(s);

export type RoomKeys = { room: string; key: CryptoKey };

export async function roomKeys(code: string): Promise<RoomKeys> {
  const normalized = normalizeCode(code);
  const material = await crypto.subtle.importKey(
    "raw",
    text(normalized),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const master = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: text("orion-aic/sync/v1"),
      iterations: ITERATIONS,
      hash: "SHA-256",
    },
    material,
    256,
  );
  const hkdf = await crypto.subtle.importKey("raw", master, "HKDF", false, [
    "deriveBits",
    "deriveKey",
  ]);
  const params = (info: string) => ({
    name: "HKDF",
    hash: "SHA-256",
    salt: text("orion-aic/sync/v2"),
    info: text(info),
  });
  const room = hex(
    await crypto.subtle.deriveBits(params("orion-aic/room/v2"), hkdf, 256),
  );
  const key = await crypto.subtle.deriveKey(
    params("orion-aic/key/v2"),
    hkdf,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
  return { room, key };
}

const AAD = text("orion-aic-sync:2");
/** Size of a part before encryption: far under the relay limit (1 MiB). */
export const PART_BYTES = 192 * 1024;
/** Largest message (compressed): 512 parts of 192 KiB. */
export const MAX_PARTS = 512;
export const PEER_ID = /^[0-9a-z]{8}$/;
const HEADER = 12; // message id (8), index (2), count (2)
const FRAME = 1 + 8 + 12; // kind, peer, iv

async function transform(
  bytes: Uint8Array,
  stream: CompressionStream | DecompressionStream,
) {
  const out = new Response(
    new Blob([bytes as BlobPart]).stream().pipeThrough(stream),
  );
  return new Uint8Array(await out.arrayBuffer());
}
const deflate = (bytes: Uint8Array) =>
  typeof CompressionStream === "function"
    ? transform(bytes, new CompressionStream("deflate-raw"))
    : Promise.resolve(deflateSync(bytes, { level: 6 }));
const inflate = (bytes: Uint8Array) =>
  typeof DecompressionStream === "function"
    ? transform(bytes, new DecompressionStream("deflate-raw"))
    : Promise.resolve(inflateSync(bytes));

const peerBytes = (peer: string) => {
  const out = new Uint8Array(8);
  if (PEER_ID.test(peer)) out.set(text(peer));
  return out;
};

/**
 * A value as binary frames for the relay: compressed, encrypted, split into
 * parts. `to`: relay id of the only recipient ("" for every post).
 */
export async function sealFrames(
  value: unknown,
  key: CryptoKey,
  to = "",
): Promise<Uint8Array[]> {
  const packed = await deflate(text(JSON.stringify(value)));
  const count = Math.max(1, Math.ceil(packed.length / PART_BYTES));
  if (count > MAX_PARTS)
    throw new Error(
      "Message de synchronisation trop volumineux (plus de 96 Mo compressés).",
    );
  const id = crypto.getRandomValues(new Uint8Array(8));
  const target = peerBytes(to);
  const frames: Uint8Array[] = [];
  for (let index = 0; index < count; index++) {
    const chunk = packed.subarray(index * PART_BYTES, (index + 1) * PART_BYTES);
    const plain = new Uint8Array(HEADER + chunk.length);
    plain.set(id);
    new DataView(plain.buffer).setUint16(8, index);
    new DataView(plain.buffer).setUint16(10, count);
    plain.set(chunk, HEADER);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const data = new Uint8Array(
      await crypto.subtle.encrypt(
        { name: "AES-GCM", iv, additionalData: AAD },
        key,
        plain,
      ),
    );
    const frame = new Uint8Array(FRAME + data.length);
    frame[0] = 1;
    frame.set(target, 1);
    frame.set(iv, 9);
    frame.set(data, FRAME);
    frames.push(frame);
  }
  return frames;
}

/** Relay id of the sender (or the recipient) written in a frame. */
export const framePeer = (frame: Uint8Array) =>
  new TextDecoder().decode(frame.subarray(1, 9)).replace(/\0+$/, "");

type Pending = { parts: (Uint8Array | undefined)[]; got: number; at: number };
/** Largest total of parts waiting for the rest of their message. */
const MAX_PENDING = 128 * 1024 * 1024;
const EXPIRY = 120_000;

/**
 * Collects the parts of the messages of every sender and gives back each
 * message once complete. Parts that do not decrypt are refused (another
 * code, or altered).
 */
export class Reassembler {
  private pending = new Map<string, Pending>();
  private bytes = 0;
  private key: CryptoKey;
  constructor(key: CryptoKey) {
    this.key = key;
  }

  /** The message completed by this frame, or undefined. */
  async accept(
    frame: Uint8Array,
  ): Promise<{ from: string; value: unknown } | undefined> {
    if (frame.length < FRAME + 16 + HEADER || frame[0] !== 1)
      throw new Error("Trame invalide.");
    const from = framePeer(frame);
    const plain = new Uint8Array(
      await crypto.subtle.decrypt(
        {
          name: "AES-GCM",
          iv: frame.subarray(9, 21) as BufferSource,
          additionalData: AAD,
        },
        this.key,
        frame.subarray(FRAME) as BufferSource,
      ),
    );
    const view = new DataView(plain.buffer, plain.byteOffset);
    const index = view.getUint16(8);
    const count = view.getUint16(10);
    if (!count || count > MAX_PARTS || index >= count)
      throw new Error("Trame invalide.");
    const data = plain.subarray(HEADER);
    if (count === 1) return { from, value: await this.open(data) };
    this.expire();
    const id = `${from}:${hex(plain.slice(0, 8).buffer)}`;
    let entry = this.pending.get(id);
    if (!entry) {
      entry = { parts: new Array(count), got: 0, at: Date.now() };
      this.pending.set(id, entry);
    }
    if (entry.parts.length !== count || entry.parts[index]) return;
    if (this.bytes + data.length > MAX_PENDING) {
      this.drop(id);
      throw new Error("Message trop volumineux.");
    }
    entry.parts[index] = data;
    entry.got++;
    this.bytes += data.length;
    if (entry.got < count) return;
    const parts = entry.parts as Uint8Array[];
    this.drop(id);
    const whole = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
    let offset = 0;
    for (const p of parts) {
      whole.set(p, offset);
      offset += p.length;
    }
    return { from, value: await this.open(whole) };
  }
  private async open(bytes: Uint8Array) {
    return JSON.parse(new TextDecoder().decode(await inflate(bytes)));
  }
  private drop(id: string) {
    const entry = this.pending.get(id);
    if (!entry) return;
    for (const p of entry.parts) if (p) this.bytes -= p.length;
    this.pending.delete(id);
  }
  private expire() {
    const now = Date.now();
    for (const [id, entry] of this.pending)
      if (now - entry.at > EXPIRY) this.drop(id);
  }
  /** Forget what a sender that left had started. */
  forget(from: string) {
    for (const id of [...this.pending.keys()])
      if (id.startsWith(`${from}:`)) this.drop(id);
  }
}

export const joinUrl = (origin: string, code: string) =>
  `${origin}/#join=${normalizeCode(code)}`;
