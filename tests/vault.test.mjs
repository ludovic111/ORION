import test from "node:test";
import assert from "node:assert/strict";
import { randomBytes, webcrypto } from "node:crypto";
import {
  decrypt,
  deriveKey,
  encrypt,
  encryptVault,
  fromBase64,
  toBase64,
} from "../shared/crypto.ts";
import {
  archive,
  newJournal,
  packWorkspace,
  parseArchive,
  workspaceSchema,
} from "../shared/journal.ts";

const password = "phrase de test fictive uniquement";

/** An envelope as written before 2.1: no compression, AAD version 1. */
async function legacyEnvelope(value) {
  const salt = toBase64(webcrypto.getRandomValues(new Uint8Array(16)));
  const vault = await deriveKey(password, salt);
  const iv = webcrypto.getRandomValues(new Uint8Array(12));
  const data = await webcrypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv,
      additionalData: new TextEncoder().encode("orion-encrypted:1"),
    },
    vault.key,
    new TextEncoder().encode(JSON.stringify(value)),
  );
  return {
    format: "orion-encrypted",
    version: 1,
    algorithm: "AES-GCM",
    kdf: "PBKDF2-SHA256",
    iterations: 600000,
    salt,
    iv: toBase64(iv),
    ciphertext: toBase64(new Uint8Array(data)),
  };
}

test("vaults and archives written before 2.1 still open", async () => {
  const value = { journals: ["Relève à Genève"], n: 3 };
  const old = await legacyEnvelope(value);
  assert.deepEqual((await decrypt(old, password)).value, value);
  // No size limit on reading any more: a large envelope is read (here it
  // fails authentication), not refused as invalid.
  const large = { ...old, ciphertext: "A".repeat(48_000_004) };
  await assert.rejects(
    decrypt(large, password),
    /incorrecte ou fichier endommagé/,
  );
});

test("the vault is compressed and stored as bytes, and opens again", async () => {
  const key = await deriveKey(password);
  const text = "Relève du poste de conduite. ".repeat(20_000);
  const record = await encryptVault({ text }, key);
  assert.equal(record.format, "orion-vault");
  assert.ok(record.data instanceof Uint8Array);
  assert.ok(record.data.length < text.length / 20, "compressed");
  assert.deepEqual((await decrypt(record, password)).value, { text });
  // Tampering is detected.
  const bad = { ...record, data: record.data.slice() };
  bad.data[5] ^= 1;
  await assert.rejects(decrypt(bad, password), /endommagé/);
  await assert.rejects(
    decrypt(record, "une autre phrase bien fausse"),
    /incorrecte/,
  );
});

test("archives are compressed, version 2, with a fast base64", async () => {
  const key = await deriveKey(password);
  const envelope = await encrypt({ text: "x".repeat(1_000_000) }, key);
  assert.equal(envelope.version, 2);
  assert.equal(envelope.compression, "gzip");
  assert.ok(envelope.ciphertext.length < 100_000);
  const bytes = new Uint8Array(randomBytes(300_001));
  assert.deepEqual(fromBase64(toBase64(bytes)), bytes);
  assert.equal(toBase64(bytes), Buffer.from(bytes).toString("base64"));
});

test("a session too large to be written is refused with a clear message", async () => {
  const key = await deriveKey(password);
  const huge = {
    toJSON() {
      throw new RangeError("Invalid string length");
    },
  };
  await assert.rejects(encryptVault(huge, key), /trop volumineuse/);
});

test("a packed workspace keeps each image once and parses back to the same", () => {
  const image = `data:image/png;base64,${Buffer.alloc(3000, 1).toString("base64")}`;
  const j = newJournal("Carte");
  const symbol = {
    id: crypto.randomUUID(),
    createdAt: j.createdAt,
    updatedAt: j.createdAt,
    by: "A",
    name: "Poste",
    group: "",
    image,
  };
  const parsed = workspaceSchema.parse({
    version: 1,
    author: "A",
    activeId: j.id,
    journals: [{ ...j, ops: { ...j.ops, symbols: [symbol] } }],
  });
  const packed = JSON.parse(JSON.stringify(packWorkspace(parsed)));
  assert.match(packed.journals[0].ops.symbols[0].image, /^blob:[0-9a-f]{64}$/);
  assert.equal(JSON.stringify(packed).split(image).length - 1, 1);
  assert.deepEqual(workspaceSchema.parse(packed), parsed);
  // Archives too.
  const file = JSON.parse(JSON.stringify(archive(parsed.journals[0])));
  assert.equal(JSON.stringify(file).split(image).length - 1, 1);
  assert.deepEqual(parseArchive(file).journal, parsed.journals[0]);
});
