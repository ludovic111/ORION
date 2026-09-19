import { readFile, mkdir, writeFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
export async function loadConfig() {
  const production = process.env.NODE_ENV === "production";
  const mode = process.env.APP_MODE ?? (production ? "institution" : "demo");
  if (!["institution", "demo"].includes(mode))
    throw new Error("APP_MODE invalide.");
  const demo = mode === "demo";
  if (production && demo)
    throw new Error("Le mode démo est interdit en production.");
  const port = Number(process.env.PORT ?? 4311);
  const host = process.env.HOST ?? "127.0.0.1";
  if (demo && !["127.0.0.1", "::1", "localhost"].includes(host))
    throw new Error("La démonstration est limitée à la boucle locale.");
  let key = process.env.APP_KEY;
  if (!key && !production) {
    await mkdir(".data", { recursive: true, mode: 0o700 });
    try {
      key = (await readFile(".data/app.key", "utf8")).trim();
    } catch (e) {
      if (e.code !== "ENOENT") throw e;
      key = randomBytes(32).toString("hex");
      await writeFile(".data/app.key", key, { mode: 0o600, flag: "wx" });
    }
  }
  if (!/^[a-f\d]{64}$/i.test(key ?? ""))
    throw new Error("APP_KEY obligatoire : 64 caractères hexadécimaux.");
  const origin = process.env.APP_ORIGIN ?? `http://127.0.0.1:${port}`;
  return {
    production,
    trustedProxies: process.env.TRUSTED_PROXIES?.split(",")
      .map((value) => value.trim())
      .filter(Boolean),
    demo,
    key,
    origin,
    host,
    port,
    url: process.env.DATABASE_URL,
    caFile: process.env.DATABASE_CA_FILE,
    path: process.env.DATA_DIR ?? ".data/orion",
  };
}
