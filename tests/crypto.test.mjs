import test from "node:test";
import assert from "node:assert/strict";
import { decrypt, deriveKey, encrypt } from "../shared/crypto.ts";
const password = "phrase de test fictive uniquement";
test("encryption roundtrip authenticates Unicode and nested content", async () => {
  const value = {
    message: "Relève à Genève 🙂",
    revisions: [{ text: "<script> & =1+1" }],
  };
  const key = await deriveKey(password);
  const data = await encrypt(value, key);
  assert.deepEqual((await decrypt(data, password)).value, value);
  assert.ok(!JSON.stringify(data).includes("Genève"));
  assert.equal(key.key.extractable, false);
});
test("each encryption uses a fresh IV, including with the same recovery key", async () => {
  const key = await deriveKey(password);
  const one = await encrypt({ a: 1 }, key),
    two = await encrypt({ a: 1 }, key);
  assert.notEqual(one.iv, two.iv);
  assert.notEqual(one.ciphertext, two.ciphertext);
  assert.equal(one.salt, two.salt);
});
test("wrong password and ciphertext modification both fail authentication", async () => {
  const data = await encrypt({ text: "Test" }, await deriveKey(password));
  await assert.rejects(
    decrypt(data, "une autre phrase totalement fausse"),
    /incorrecte/,
  );
  const bytes = Buffer.from(data.ciphertext, "base64");
  bytes[0] ^= 1;
  await assert.rejects(
    decrypt({ ...data, ciphertext: bytes.toString("base64") }, password),
    /endommagé/,
  );
});
test("import cannot choose arbitrary expensive KDF parameters or algorithms", async () => {
  const data = await encrypt({ a: 1 }, await deriveKey(password));
  await assert.rejects(
    decrypt({ ...data, iterations: 9999999999 }, password),
    /invalide/,
  );
  await assert.rejects(
    decrypt({ ...data, algorithm: "AES-CBC" }, password),
    /invalide/,
  );
  await assert.rejects(deriveKey("court"), /12 à 256/);
});
