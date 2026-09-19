import test from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import {
  hashPassword,
  verifyPassword,
  totp,
  verifyTotp,
  encrypt,
  decrypt,
  auditHash,
} from "../server/security.mjs";
import { schemas } from "../server/validation.mjs";

test("Password hashes use unique salts and reject the wrong password", async () => {
  const a = await hashPassword("correct horse battery staple");
  const b = await hashPassword("correct horse battery staple");
  assert.notEqual(a, b);
  assert.match(a, /^scrypt-v1\$/);
  assert.equal(await verifyPassword("correct horse battery staple", a), true);
  assert.equal(await verifyPassword("incorrect", a), false);
  assert.equal(await verifyPassword("incorrect", "malformed"), false);
});
test("TOTP matches RFC 4226 counters, rejects replay and invalid formats", () => {
  const secret = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";
  [
    "755224",
    "287082",
    "359152",
    "969429",
    "338314",
    "254676",
    "287922",
    "162583",
    "399871",
    "520489",
  ].forEach((expected, i) => assert.equal(totp(secret, i), expected));
  assert.equal(verifyTotp(secret, "287082", -1, 30000), 1);
  assert.equal(verifyTotp(secret, "287082", 1, 30000), null);
  assert.equal(verifyTotp(secret, "28 082", -1, 30000), null);
  assert.equal(verifyTotp(secret, "287082", -1, 120000), null);
});
test("MFA encryption rejects tampering and a different key", () => {
  const key = randomBytes(32).toString("hex");
  const encrypted = encrypt("SECRET", key);
  assert.equal(decrypt(encrypted, key), "SECRET");
  assert.throws(() => decrypt(encrypted, randomBytes(32).toString("hex")));
  const pieces = encrypted.split(".");
  pieces[2] = (pieces[2][0] === "0" ? "1" : "0") + pieces[2].slice(1);
  assert.throws(() => decrypt(pieces.join("."), key));
});
test("Audit hashing is canonical across JSONB key reordering", () => {
  const event = {
    actor: "a",
    action: "b",
    operation_id: null,
    target: null,
    detail: { z: 1, nested: { b: 2, a: 1 } },
    at: "now",
    previous_hash: "x",
  };
  const reordered = { ...event, detail: { nested: { a: 1, b: 2 }, z: 1 } };
  assert.equal(auditHash(event), auditHash(reordered));
  assert.notEqual(auditHash(event), auditHash({ ...event, actor: "other" }));
});
test("Stock invariants reject excess, negative and fractional quantities", () => {
  for (const [total, available] of [
    [1, 2],
    [-1, 0],
    [10, -1],
    [2.5, 1],
    [1, 0.5],
  ])
    assert.equal(
      schemas.stock.safeParse({
        name: "stock",
        total,
        available,
        location: "Genève",
      }).success,
      false,
    );
  assert.equal(
    schemas.stock.safeParse({
      name: "stock",
      total: 0,
      available: 0,
      location: "Genève",
    }).success,
    true,
  );
});
