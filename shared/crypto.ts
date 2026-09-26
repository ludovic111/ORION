import { z } from "zod";
import { gunzipSync, gzipSync } from "fflate";

// Encryption of the local vault (IndexedDB) and of .orionaic archives:
// AES-256-GCM, key derived from a passphrase with PBKDF2-SHA-256.
//
// Version 2 compresses (gzip) before encrypting. The vault is stored as
// bytes (no base64); archives are JSON files with the ciphertext in base64.
// Version 1 envelopes (uncompressed, before 2.1) still open.

const ITERATIONS = 600_000;
/** Largest compressed session this post agrees to write (bytes). */
export const MAX_SEALED_BYTES = 256 * 1024 * 1024;
const common = {
  format: z.literal("orion-encrypted"),
  algorithm: z.literal("AES-GCM"),
  kdf: z.literal("PBKDF2-SHA256"),
  iterations: z.literal(ITERATIONS),
  salt: z.string().length(24),
  iv: z.string().length(16),
};
export const encryptedV1Schema = z
  .object({
    ...common,
    version: z.literal(1),
    // No upper bound on reading: a session saved by this post must always
    // open again (writing is bounded by MAX_SEALED_BYTES).
    ciphertext: z.string().min(24),
  })
  .strict();
export const encryptedV2Schema = z
  .object({
    ...common,
    version: z.literal(2),
    compression: z.literal("gzip"),
    ciphertext: z.string().min(24),
  })
  .strict();
export const encryptedSchema = z.discriminatedUnion("version", [
  encryptedV1Schema,
  encryptedV2Schema,
]);
export type Encrypted = z.infer<typeof encryptedSchema>;
/** Vault record in IndexedDB: the same envelope with raw bytes. */
export const vaultRecordSchema = z
  .object({
    format: z.literal("orion-vault"),
    version: z.literal(2),
    algorithm: z.literal("AES-GCM"),
    kdf: z.literal("PBKDF2-SHA256"),
    iterations: z.literal(ITERATIONS),
    salt: z.string().length(24),
    iv: z.instanceof(Uint8Array),
    compression: z.literal("gzip"),
    data: z.instanceof(Uint8Array),
  })
  .strict();
export type VaultRecord = z.infer<typeof vaultRecordSchema>;
export type VaultKey = { key: CryptoKey; salt: string };

/** Base64 of bytes, without a string concatenation per byte. */
export function toBase64(bytes: Uint8Array): string {
  const native = (bytes as unknown as { toBase64?: () => string }).toBase64;
  if (typeof native === "function") return native.call(bytes);
  let value = "";
  for (let i = 0; i < bytes.length; i += 0x8000)
    value += String.fromCharCode.apply(
      null,
      bytes.subarray(i, i + 0x8000) as unknown as number[],
    );
  return btoa(value);
}
export function fromBase64(value: string): Uint8Array {
  const native = (
    Uint8Array as unknown as { fromBase64?: (s: string) => Uint8Array }
  ).fromBase64;
  if (typeof native === "function") return native(value);
  const text = atob(value);
  const bytes = new Uint8Array(text.length);
  for (let i = 0; i < text.length; i++) bytes[i] = text.charCodeAt(i);
  return bytes;
}

async function stream(
  bytes: Uint8Array,
  transform: CompressionStream | DecompressionStream,
): Promise<Uint8Array> {
  const out = new Response(
    new Blob([bytes as BlobPart]).stream().pipeThrough(transform),
  );
  return new Uint8Array(await out.arrayBuffer());
}
/** gzip, off the main thread when the browser can. */
export async function gzip(bytes: Uint8Array): Promise<Uint8Array> {
  if (typeof CompressionStream === "function")
    return stream(bytes, new CompressionStream("gzip"));
  return gzipSync(bytes, { level: 6 });
}
export async function gunzip(bytes: Uint8Array): Promise<Uint8Array> {
  if (typeof DecompressionStream === "function")
    return stream(bytes, new DecompressionStream("gzip"));
  return gunzipSync(bytes);
}

export async function deriveKey(
  password: string,
  salt = toBase64(crypto.getRandomValues(new Uint8Array(16))),
): Promise<VaultKey> {
  if (password.length < 12 || password.length > 256)
    throw new Error("Utilisez une phrase secrète de 12 à 256 caractères.");
  const bytes = fromBase64(salt);
  if (bytes.length !== 16) throw new Error("Sel de chiffrement invalide.");
  const material = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  const key = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: bytes as BufferSource,
      iterations: ITERATIONS,
      hash: "SHA-256",
    },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
  return { key, salt };
}

const aad = (version: 1 | 2) =>
  new TextEncoder().encode(`orion-encrypted:${version}`);
const mb = (bytes: number) => Math.ceil(bytes / (1024 * 1024));

/** JSON of a value, with a clear message when it is too large. */
function serialise(value: unknown): Uint8Array {
  try {
    return new TextEncoder().encode(JSON.stringify(value));
  } catch (err) {
    if (err instanceof RangeError)
      throw new Error(
        "Session trop volumineuse pour être enregistrée par ce navigateur. Exportez puis retirez les journaux terminés, ou les images inutiles.",
      );
    throw err;
  }
}

async function seal(value: unknown, vault: VaultKey) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const packed = await gzip(serialise(value));
  if (packed.length > MAX_SEALED_BYTES)
    throw new Error(
      `Session trop volumineuse pour être enregistrée : ${mb(packed.length)} Mo compressés, ${mb(MAX_SEALED_BYTES)} Mo au plus. Exportez puis retirez les journaux terminés, ou les images inutiles.`,
    );
  const data = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: "AES-GCM", iv, additionalData: aad(2) },
      vault.key,
      packed as BufferSource,
    ),
  );
  return { iv, data };
}

/** Encrypted envelope for a file (.orionaic): JSON with base64. */
export async function encrypt(
  value: unknown,
  vault: VaultKey,
): Promise<Encrypted> {
  const { iv, data } = await seal(value, vault);
  return {
    format: "orion-encrypted",
    version: 2,
    algorithm: "AES-GCM",
    kdf: "PBKDF2-SHA256",
    iterations: ITERATIONS,
    salt: vault.salt,
    iv: toBase64(iv),
    compression: "gzip",
    ciphertext: toBase64(data),
  };
}

/** Encrypted record for the local vault: raw bytes, no base64. */
export async function encryptVault(
  value: unknown,
  vault: VaultKey,
): Promise<VaultRecord> {
  const { iv, data } = await seal(value, vault);
  return {
    format: "orion-vault",
    version: 2,
    algorithm: "AES-GCM",
    kdf: "PBKDF2-SHA256",
    iterations: ITERATIONS,
    salt: vault.salt,
    iv,
    compression: "gzip",
    data,
  };
}

/** Open a file envelope (versions 1 and 2) or a vault record. */
export async function decrypt(
  input: unknown,
  password: string,
): Promise<{ value: unknown; vault: VaultKey }> {
  let salt: string;
  let iv: Uint8Array;
  let data: Uint8Array;
  let version: 1 | 2;
  const record = vaultRecordSchema.safeParse(input);
  if (record.success) {
    ({ salt, iv, data } = record.data);
    version = 2;
  } else {
    const envelope = encryptedSchema.safeParse(input);
    if (!envelope.success)
      throw new Error("Fichier chiffré invalide ou version inconnue.");
    salt = envelope.data.salt;
    iv = fromBase64(envelope.data.iv);
    data = fromBase64(envelope.data.ciphertext);
    version = envelope.data.version;
  }
  let vault: VaultKey;
  let plain: Uint8Array;
  try {
    vault = await deriveKey(password, salt);
    plain = new Uint8Array(
      await crypto.subtle.decrypt(
        {
          name: "AES-GCM",
          iv: iv as BufferSource,
          additionalData: aad(version),
        },
        vault.key,
        data as BufferSource,
      ),
    );
  } catch {
    throw new Error("Phrase secrète incorrecte ou fichier endommagé.");
  }
  try {
    const text = new TextDecoder().decode(
      version === 2 ? await gunzip(plain) : plain,
    );
    return { value: JSON.parse(text), vault };
  } catch {
    throw new Error("Phrase secrète incorrecte ou fichier endommagé.");
  }
}
