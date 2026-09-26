import { z } from "zod";
import { t as tr } from "./i18n/signature.ts";

// Signature of the exports. Each post (session) has its own key pair,
// generated in the browser (Web Crypto) and kept in the encrypted session:
// Ed25519, or ECDSA P-256 where the browser lacks Ed25519. An export carries
// the SHA-256 of what it covers, the signature, the public key (its
// fingerprint is printed) and the time of signing.
//
// What it proves: the file (or the content printed) is exactly what the
// holder of that key signed; any change breaks the signature. What it does
// not prove: who holds the key (self-signed, no certificate), nor when it
// was signed (the time is written by the signer's clock, no trusted
// timestamp). See SECURITY.md.

export const SIGNATURE_ALGORITHMS = ["Ed25519", "ECDSA-P256"] as const;
export type SignatureAlgorithm = (typeof SIGNATURE_ALGORITHMS)[number];

const B64URL = /^[A-Za-z0-9_-]+$/;
/** Key pair kept in the session (Workspace.signing). */
export const signingKeySchema = z
  .object({
    alg: z.enum(SIGNATURE_ALGORITHMS),
    // Raw public key (32 bytes Ed25519, 65 bytes P-256), base64url.
    publicKey: z.string().max(200).regex(B64URL),
    // PKCS#8 private key, base64url.
    privateKey: z.string().max(400).regex(B64URL),
    createdAt: z.iso.datetime({ offset: true }),
  })
  .strict();
export type SigningKey = z.infer<typeof signingKeySchema>;

/** Signature block carried by an archive (and kept in the register). */
export const signatureBlockSchema = z
  .object({
    alg: z.enum(SIGNATURE_ALGORITHMS),
    key: z.string().max(200).regex(B64URL),
    sig: z.string().max(200).regex(B64URL),
    at: z.iso.datetime({ offset: true }),
  })
  .strict();
export type SignatureBlock = z.infer<typeof signatureBlockSchema>;

// ---------- Encoding ----------

export function toB64url(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
export function fromB64url(value: string): Uint8Array {
  const b64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const s = atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4));
  return Uint8Array.from(s, (c) => c.charCodeAt(0));
}
const hex = (bytes: ArrayBuffer | Uint8Array) =>
  [...new Uint8Array(bytes)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
const utf8 = (s: string) => new TextEncoder().encode(s);

export async function sha256(data: Uint8Array | string): Promise<string> {
  const bytes = typeof data === "string" ? utf8(data) : data;
  return hex(await crypto.subtle.digest("SHA-256", bytes as BufferSource));
}

const params = (alg: SignatureAlgorithm) =>
  alg === "Ed25519"
    ? { key: { name: "Ed25519" }, sign: { name: "Ed25519" } }
    : {
        key: { name: "ECDSA", namedCurve: "P-256" },
        sign: { name: "ECDSA", hash: "SHA-256" },
      };

// ---------- Keys ----------

/** New key pair: Ed25519 when the browser has it, else ECDSA P-256. */
export async function generateSigningKey(
  prefer: SignatureAlgorithm = "Ed25519",
): Promise<SigningKey> {
  const order: SignatureAlgorithm[] =
    prefer === "Ed25519" ? ["Ed25519", "ECDSA-P256"] : ["ECDSA-P256"];
  let lastError: unknown;
  for (const alg of order) {
    try {
      const pair = (await crypto.subtle.generateKey(params(alg).key, true, [
        "sign",
        "verify",
      ])) as CryptoKeyPair;
      const [pub, priv] = await Promise.all([
        crypto.subtle.exportKey("raw", pair.publicKey),
        crypto.subtle.exportKey("pkcs8", pair.privateKey),
      ]);
      return {
        alg,
        publicKey: toB64url(new Uint8Array(pub)),
        privateKey: toB64url(new Uint8Array(priv)),
        createdAt: new Date().toISOString(),
      };
    } catch (err) {
      lastError = err;
    }
  }
  throw new Error(
    tr("Signature impossible dans ce navigateur ({reason}).", {
      reason: (lastError as Error)?.message ?? "Web Crypto",
    }),
  );
}

/** Fingerprint of a public key: SHA-256, 16 hex in groups ("A1B2-C3D4-…"). */
export async function keyFingerprint(publicKey: string): Promise<string> {
  const h = (await sha256(fromB64url(publicKey))).slice(0, 16).toUpperCase();
  return h.match(/.{4}/g)!.join("-");
}
/** Short form printed on paper: the first 8 hex ("A1B2-C3D4"). */
export const shortFingerprint = (fingerprint: string) =>
  fingerprint.slice(0, 9);

async function signBytes(key: SigningKey, message: string): Promise<string> {
  const p = params(key.alg);
  const priv = await crypto.subtle.importKey(
    "pkcs8",
    fromB64url(key.privateKey) as BufferSource,
    p.key,
    false,
    ["sign"],
  );
  return toB64url(
    new Uint8Array(await crypto.subtle.sign(p.sign, priv, utf8(message))),
  );
}

async function verifyBytes(
  alg: SignatureAlgorithm,
  publicKey: string,
  signature: string,
  message: string,
): Promise<boolean> {
  try {
    const p = params(alg);
    const pub = await crypto.subtle.importKey(
      "raw",
      fromB64url(publicKey) as BufferSource,
      p.key,
      false,
      ["verify"],
    );
    return await crypto.subtle.verify(
      p.sign,
      pub,
      fromB64url(signature) as BufferSource,
      utf8(message),
    );
  } catch {
    return false;
  }
}

// ---------- What is signed ----------

const fileMessage = (sha: string, at: string) =>
  `orion-aic/file/1\n${sha}\n${at}`;
const documentMessage = (id: string, content: string, at: string) =>
  `orion-aic/document/1\n${id}\n${content}\n${at}`;
const objectMessage = (canonical: string) => `orion-aic/object/1\n${canonical}`;

/** Signature of a file, given its SHA-256 (hex). */
export async function signFile(
  key: SigningKey,
  sha: string,
  at = new Date().toISOString(),
): Promise<SignatureBlock> {
  return {
    alg: key.alg,
    key: key.publicKey,
    sig: await signBytes(key, fileMessage(sha, at)),
    at,
  };
}
export const verifyFile = (block: SignatureBlock, sha: string) =>
  verifyBytes(block.alg, block.key, block.sig, fileMessage(sha, block.at));

/** JSON with sorted keys (same as stableStringify of shared/history.ts). */
export function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object")
    return `{${Object.keys(value)
      .sort()
      .filter((k) => (value as Record<string, unknown>)[k] !== undefined)
      .map(
        (k) =>
          `${JSON.stringify(k)}:${canonical((value as Record<string, unknown>)[k])}`,
      )
      .join(",")}}`;
  return JSON.stringify(value) ?? "null";
}

/**
 * Sign a JSON object (archive, encrypted envelope): its canonical form
 * without the `signature` field. Returns the object with its signature.
 */
export async function signObject<T extends object>(
  key: SigningKey,
  value: T,
  at = new Date().toISOString(),
): Promise<T & { signature: SignatureBlock }> {
  const { signature: _drop, ...rest } = value as T & { signature?: unknown };
  const sig = await signBytes(key, objectMessage(canonical(rest)));
  return {
    ...(rest as T),
    signature: { alg: key.alg, key: key.publicKey, sig, at },
  };
}

export type Verdict =
  | { state: "none" }
  | {
      state: "valid" | "invalid";
      alg: SignatureAlgorithm;
      fingerprint: string;
      at: string;
      /** SHA-256 signed (file or content), when known. */
      sha?: string;
    };

/** Check the signature of a JSON object signed with signObject(). */
export async function verifyObject(value: unknown): Promise<Verdict> {
  if (!value || typeof value !== "object" || !("signature" in value))
    return { state: "none" };
  const { signature, ...rest } = value as { signature: unknown };
  const block = signatureBlockSchema.safeParse(signature);
  if (!block.success) return { state: "none" };
  const ok = await verifyBytes(
    block.data.alg,
    block.data.key,
    block.data.sig,
    objectMessage(canonical(rest)),
  );
  return {
    state: ok ? "valid" : "invalid",
    alg: block.data.alg,
    fingerprint: await keyFingerprint(block.data.key),
    at: block.data.at,
  };
}

// ---------- PDF: signature appended after %%EOF ----------

const PDF_MARK = "\n%orionaic-signature ";

/**
 * Append the signature of a PDF as a comment line after its end: readers
 * ignore it, and it covers every byte before it.
 */
export async function signPdf(
  key: SigningKey,
  pdf: Uint8Array,
  at = new Date().toISOString(),
): Promise<Uint8Array> {
  const sha = await sha256(pdf);
  const block = await signFile(key, sha, at);
  const line = utf8(
    `${PDF_MARK}${JSON.stringify({ v: 1, sha256: sha, ...block })}\n`,
  );
  const out = new Uint8Array(pdf.length + line.length);
  out.set(pdf);
  out.set(line, pdf.length);
  return out;
}

/** Signature appended to a PDF, checked against the bytes before it. */
export async function verifyPdf(bytes: Uint8Array): Promise<Verdict> {
  const tail = bytes.subarray(Math.max(0, bytes.length - 4096));
  let text = "";
  for (const b of tail) text += String.fromCharCode(b);
  const at = text.lastIndexOf(PDF_MARK);
  if (at < 0) return { state: "none" };
  const start = bytes.length - tail.length + at;
  let parsed: unknown;
  try {
    parsed = JSON.parse(text.slice(at + PDF_MARK.length).trim());
  } catch {
    return { state: "none" };
  }
  const {
    v: _v,
    sha256: signedSha,
    ...rest
  } = parsed as {
    v?: number;
    sha256?: string;
  };
  const block = signatureBlockSchema.safeParse(rest);
  if (!block.success) return { state: "none" };
  const sha = await sha256(bytes.subarray(0, start));
  const ok = sha === signedSha && (await verifyFile(block.data, sha));
  return {
    state: ok ? "valid" : "invalid",
    alg: block.data.alg,
    fingerprint: await keyFingerprint(block.data.key),
    at: block.data.at,
    sha,
  };
}

// ---------- Printed documents: signed verification code ----------

/**
 * Signature of a document's content, added to the text of its QR code:
 * `…;h=<sha256 of the content>;t=<ms>;a=e|p;k=<public key>;s=<signature>`.
 * Whoever scans the code can check that the content hash was signed by
 * that key, and compare the fingerprint with the one printed.
 */
export async function signCode(
  key: SigningKey,
  code: string,
  id: string,
  contentSha: string,
  when = new Date().toISOString(),
): Promise<string> {
  // Milliseconds in the code: the time read back must be the one signed.
  const at = new Date(when).toISOString();
  const sig = await signBytes(key, documentMessage(id, contentSha, at));
  return `${code};h=${contentSha};t=${Date.parse(at)};a=${key.alg === "Ed25519" ? "e" : "p"};k=${key.publicKey};s=${sig}`;
}

export type SignedCode = {
  id: string;
  sha: string;
  at: string;
  alg: SignatureAlgorithm;
  key: string;
  sig: string;
};

/** Signed part of a verification code (null when the code is not signed). */
export function parseSignedCode(text: string): SignedCode | null {
  const t = text.trim();
  const id = t.match(
    /orionaic:verify:([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i,
  )?.[1];
  const field = (name: string) =>
    t.match(new RegExp(`;${name}=([A-Za-z0-9_-]+)`))?.[1];
  const [sha, ms, a, key, sig] = ["h", "t", "a", "k", "s"].map(field);
  if (!id || !sha || !ms || !a || !key || !sig) return null;
  if (!/^[0-9a-f]{64}$/.test(sha) || !/^\d{10,15}$/.test(ms)) return null;
  return {
    id: id.toLowerCase(),
    sha,
    at: new Date(Number(ms)).toISOString(),
    alg: a === "e" ? "Ed25519" : "ECDSA-P256",
    key,
    sig,
  };
}

export async function verifyCode(code: SignedCode): Promise<Verdict> {
  const ok = await verifyBytes(
    code.alg,
    code.key,
    code.sig,
    documentMessage(code.id, code.sha, code.at),
  );
  return {
    state: ok ? "valid" : "invalid",
    alg: code.alg,
    fingerprint: await keyFingerprint(code.key),
    at: code.at,
    sha: code.sha,
  };
}
