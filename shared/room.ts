import { deflateSync, inflateSync } from "fflate";

// A session code joins posts together. It never leaves the posts: the relay
// only sees a hash of it (the room) and messages encrypted with a key derived
// from it (AES-256-GCM, PBKDF2-SHA-256).

const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ"; // no 0/O, 1/I/L
const ITERATIONS = 200_000;

export function newRoomCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  const chars = [...bytes].map((b) => ALPHABET[b % ALPHABET.length]);
  return [0, 4, 8, 12].map((i) => chars.slice(i, i + 4).join("")).join("-");
}

export function normalizeCode(value: string): string {
  const clean = value
    .toUpperCase()
    .replace(/O/g, "0")
    .replace(/[IL]/g, "1")
    .replace(/[^A-Z0-9]/g, "");
  return clean.match(/.{1,4}/g)?.join("-") ?? "";
}
export const validCode = (value: string) =>
  /^[A-Z0-9]{4}(-[A-Z0-9]{4}){3}$/.test(normalizeCode(value));

const hex = (buffer: ArrayBuffer) =>
  [...new Uint8Array(buffer)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
const encode = (bytes: Uint8Array) => {
  let value = "";
  for (let i = 0; i < bytes.length; i += 0x8000)
    value += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(value);
};
const decode = (value: string) =>
  Uint8Array.from(atob(value), (char) => char.charCodeAt(0));

export type RoomKeys = { room: string; key: CryptoKey };

export async function roomKeys(code: string): Promise<RoomKeys> {
  const normalized = normalizeCode(code);
  const room = hex(
    await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(`orion-aic/room/v1/${normalized}`),
    ),
  );
  const material = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(normalized),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  const key = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: new TextEncoder().encode("orion-aic/sync/v1"),
      iterations: ITERATIONS,
      hash: "SHA-256",
    },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
  return { room, key };
}

const AAD = new TextEncoder().encode("orion-aic-sync:1");

/** Compressed, encrypted envelope as sent through the relay. */
export async function seal(value: unknown, key: CryptoKey): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const packed = deflateSync(new TextEncoder().encode(JSON.stringify(value)), {
    level: 6,
  });
  const data = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv, additionalData: AAD },
    key,
    packed,
  );
  return JSON.stringify({
    t: "box",
    iv: encode(iv),
    d: encode(new Uint8Array(data)),
  });
}

export async function unseal(
  envelope: { iv: string; d: string },
  key: CryptoKey,
): Promise<unknown> {
  const plain = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: decode(envelope.iv), additionalData: AAD },
    key,
    decode(envelope.d),
  );
  return JSON.parse(
    new TextDecoder().decode(inflateSync(new Uint8Array(plain))),
  );
}

export const joinUrl = (origin: string, code: string) =>
  `${origin}/#join=${normalizeCode(code)}`;
