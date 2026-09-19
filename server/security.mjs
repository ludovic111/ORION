import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
  createHash,
  createHmac,
  createCipheriv,
  createDecipheriv,
} from "node:crypto";
import { promisify } from "node:util";
const scrypt = promisify(scryptCallback);
const passwordCost = { N: 131072, r: 8, p: 1, maxmem: 256 * 1024 * 1024 };
export const digest = (value) =>
  createHash("sha256").update(value).digest("hex");
export async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  return `scrypt-v1$${salt}$${Buffer.from(await scrypt(password, salt, 64, passwordCost)).toString("hex")}`;
}
export async function verifyPassword(password, encoded) {
  if (!/^scrypt-v1\$[a-f0-9]{32}\$[a-f0-9]{128}$/.test(encoded)) return false;
  const [, salt, value] = encoded.split("$");
  const actual = Buffer.from(await scrypt(password, salt, 64, passwordCost));
  const expected = Buffer.from(value, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
export function newTotpSecret() {
  let bits = "";
  for (const n of randomBytes(20)) bits += n.toString(2).padStart(8, "0");
  return bits
    .match(/.{5}/g)
    .map((b) => alphabet[parseInt(b, 2)])
    .join("");
}
export function totp(secret, counter) {
  const bits = [...secret]
    .map((c) => alphabet.indexOf(c).toString(2).padStart(5, "0"))
    .join("");
  const key = Buffer.from(bits.match(/.{8}/g).map((b) => parseInt(b, 2)));
  const count = Buffer.alloc(8);
  count.writeBigUInt64BE(BigInt(counter));
  const hash = createHmac("sha1", key).update(count).digest();
  const offset = hash[19] & 15;
  return String((hash.readUInt32BE(offset) & 0x7fffffff) % 1000000).padStart(
    6,
    "0",
  );
}
export function verifyTotp(secret, code, last = -1, time = Date.now()) {
  if (!/^\d{6}$/.test(code)) return null;
  const counter = Math.floor(time / 30000);
  for (const n of [counter, counter - 1, counter + 1]) {
    if (
      n > Number(last) &&
      timingSafeEqual(Buffer.from(totp(secret, n)), Buffer.from(code))
    )
      return n;
  }
  return null;
}
export function encrypt(value, key) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", Buffer.from(key, "hex"), iv);
  const data = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), data]
    .map((x) => x.toString("hex"))
    .join(".");
}
export function decrypt(value, key) {
  const [iv, tag, data] = value.split(".").map((x) => Buffer.from(x, "hex"));
  const cipher = createDecipheriv("aes-256-gcm", Buffer.from(key, "hex"), iv);
  cipher.setAuthTag(tag);
  return Buffer.concat([cipher.update(data), cipher.final()]).toString("utf8");
}
export async function audit(
  tx,
  actor,
  action,
  operationId = null,
  target = null,
  detail = {},
) {
  await tx.query("SELECT id FROM audit_lock WHERE id=1 FOR UPDATE");
  const previous =
    (await tx.query("SELECT hash FROM audit ORDER BY seq DESC LIMIT 1")).rows[0]
      ?.hash ?? "0".repeat(64);
  const event = {
    actor,
    action,
    operation_id: operationId,
    target,
    detail,
    at: new Date().toISOString(),
    previous_hash: previous,
  };
  const hash = auditHash(event);
  await tx.query(
    "INSERT INTO audit(id,actor,action,operation_id,target,detail,at,previous_hash,hash) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)",
    [
      randomBytes(16).toString("hex"),
      actor,
      action,
      operationId,
      target,
      JSON.stringify(detail),
      event.at,
      previous,
      hash,
    ],
  );
}
function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((k) => [k, stable(value[k])]),
    );
  return value;
}
export const auditHash = (event) =>
  digest(
    JSON.stringify(
      stable({
        actor: event.actor,
        action: event.action,
        operation_id: event.operation_id,
        target: event.target,
        detail: event.detail,
        at: event.at,
        previous_hash: event.previous_hash,
      }),
    ),
  );
