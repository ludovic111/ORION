import test from "node:test";
import assert from "node:assert/strict";
import {
  generateSigningKey,
  keyFingerprint,
  parseSignedCode,
  shortFingerprint,
  signCode,
  signFile,
  signObject,
  signPdf,
  signingKeySchema,
  verifyCode,
  verifyFile,
  verifyObject,
  verifyPdf,
  sha256,
} from "../shared/signature.ts";
import {
  archive,
  archiveSchema,
  newJournal,
  workspaceSchema,
} from "../shared/journal.ts";
import {
  deriveKey,
  encrypt,
  encryptedSchema,
  decrypt,
} from "../shared/crypto.ts";
import { makeStamp, parseVerify, signStamp } from "../src/export/stamp.ts";

const ALGORITHMS = ["Ed25519", "ECDSA-P256"];

for (const alg of ALGORITHMS)
  test(`${alg}: key pair, fingerprint, file signature`, async () => {
    const key = await generateSigningKey(alg);
    assert.equal(key.alg, alg);
    signingKeySchema.parse(key);
    const fp = await keyFingerprint(key.publicKey);
    assert.match(fp, /^[0-9A-F]{4}(-[0-9A-F]{4}){3}$/);
    assert.equal(shortFingerprint(fp), fp.slice(0, 9));
    const sha = await sha256("contenu");
    const block = await signFile(key, sha, "2026-09-26T10:00:00.000Z");
    assert.equal(await verifyFile(block, sha), true);
    assert.equal(await verifyFile(block, await sha256("contenu!")), false);
    assert.equal(
      await verifyFile({ ...block, at: "2026-09-26T11:00:00.000Z" }, sha),
      false,
      "the time is signed too",
    );
  });

test("a signed PDF verifies, and any changed byte breaks it", async () => {
  const key = await generateSigningKey();
  const pdf = new TextEncoder().encode(
    "%PDF-1.7\n1 0 obj << /Type /Catalog >> endobj\ntrailer << >>\n%%EOF\n",
  );
  const signed = await signPdf(key, pdf, "2026-09-26T10:00:00.000Z");
  const ok = await verifyPdf(signed);
  assert.equal(ok.state, "valid");
  assert.equal(ok.fingerprint, await keyFingerprint(key.publicKey));
  assert.equal(ok.at, "2026-09-26T10:00:00.000Z");
  // Tampered content.
  const tampered = signed.slice();
  tampered[12] ^= 1;
  assert.equal((await verifyPdf(tampered)).state, "invalid");
  // Tampered signature line.
  const text = new TextDecoder()
    .decode(signed)
    .replace('"at":"2026', '"at":"2027');
  assert.equal(
    (await verifyPdf(new TextEncoder().encode(text))).state,
    "invalid",
  );
  // Unsigned PDF.
  assert.equal((await verifyPdf(pdf)).state, "none");
});

test("archives: the signed envelope and the signed JSON archive", async () => {
  const key = await generateSigningKey();
  const journal = newJournal("Signé", { mode: "Exercice" });
  // Clear archive.
  const plain = await signObject(key, archive(journal));
  archiveSchema.parse(JSON.parse(JSON.stringify(plain)));
  assert.equal(
    (await verifyObject(JSON.parse(JSON.stringify(plain)))).state,
    "valid",
  );
  const changed = JSON.parse(JSON.stringify(plain));
  changed.journal.title = "Autre";
  assert.equal((await verifyObject(changed)).state, "invalid");
  // Encrypted envelope: still opens with the passphrase.
  const vault = await deriveKey("phrase de test longue");
  const envelope = await signObject(
    key,
    await encrypt(archive(journal), vault),
  );
  const read = JSON.parse(JSON.stringify(envelope));
  encryptedSchema.parse(read);
  assert.equal((await verifyObject(read)).state, "valid");
  const opened = await decrypt(read, "phrase de test longue");
  assert.equal(opened.value.journal.title, "Signé");
  read.ciphertext = `A${read.ciphertext.slice(1)}`;
  assert.equal((await verifyObject(read)).state, "invalid");
  assert.equal((await verifyObject({ a: 1 })).state, "none");
});

test("printed code: the QR text carries a signed content hash", async () => {
  const key = await generateSigningKey();
  const id = crypto.randomUUID();
  const content = await sha256("journal canonique");
  const stamp = await signStamp(
    makeStamp(
      id,
      content.slice(0, 16),
      "Opérateur",
      "2026-09-26T10:00:00.000Z",
    ),
    key,
    content,
    "2026-09-26T10:00:00.000Z",
  );
  assert.match(stamp.label, /clé [0-9A-F]{4}-[0-9A-F]{4}$/);
  // The old reader still finds the document id and fingerprint.
  assert.deepEqual(parseVerify(stamp.qr), {
    id,
    fingerprint: content.slice(0, 16),
  });
  const code = parseSignedCode(stamp.qr);
  assert.equal(code.sha, content);
  assert.equal((await verifyCode(code)).state, "valid");
  assert.equal(
    (await verifyCode({ ...code, sha: await sha256("autre") })).state,
    "invalid",
  );
  assert.equal(
    parseSignedCode(`orionaic:verify:${id}:${content.slice(0, 16)}`),
    null,
  );
  // Short enough for a QR code printed on paper.
  assert.ok(stamp.qr.length < 400);
  const direct = await signCode(key, "orionaic:verify:x", id, content);
  assert.ok(direct.includes(";s="));
});

test("the key stays in the session, never in the journal", async () => {
  const key = await generateSigningKey();
  const journal = newJournal("Poste", {});
  const ws = workspaceSchema.parse({
    version: 1,
    author: "Op",
    journals: [journal],
    activeId: journal.id,
    signing: key,
  });
  assert.equal(ws.signing.publicKey, key.publicKey);
  assert.ok(!JSON.stringify(archive(ws.journals[0])).includes(key.privateKey));
});
