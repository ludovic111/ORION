import { readFile, mkdir, writeFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
export async function loadConfig() {
  const production = process.env.NODE_ENV === "production";
  const mode = process.env.APP_MODE ?? (production ? "institution" : "demo");
  if (!["institution", "demo", "preview"].includes(mode))
    throw new Error("APP_MODE invalide.");
  const demo = mode === "demo";
  const preview = mode === "preview";
  if (production && (demo || preview))
    throw new Error("Le mode démo est interdit en production.");
  const port = Number(process.env.PORT ?? 4311);
  const host = process.env.HOST ?? "127.0.0.1";
  if ((demo || preview) && !["127.0.0.1", "::1", "localhost"].includes(host))
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
  if (preview) {
    if (!process.env.APP_KEY)
      throw new Error("Clé dédiée obligatoire pour la démonstration partagée.");
    if (
      !/^https:\/\//.test(origin) ||
      new URL(origin).origin !== origin ||
      process.env.DATABASE_URL ||
      (process.env.DATA_DIR &&
        process.env.DATA_DIR !== ".data/preview/database")
    )
      throw new Error(
        "La démonstration partagée exige HTTPS et sa propre base locale isolée.",
      );
    if (!/^[a-f\d]{64}$/i.test(process.env.PREVIEW_CONTROL_KEY ?? ""))
      throw new Error("Clé de contrôle de démonstration obligatoire.");
    const expires = Date.parse(process.env.PREVIEW_EXPIRES_AT ?? "");
    if (
      !Number.isFinite(expires) ||
      expires <= Date.now() ||
      expires > Date.now() + 72 * 3600000
    )
      throw new Error(
        "Expiration de la démonstration requise, au maximum dans 72 heures.",
      );
  }
  return {
    production,
    preview,
    previewControlKey: process.env.PREVIEW_CONTROL_KEY,
    previewExpiresAt: process.env.PREVIEW_EXPIRES_AT,
    realOperationsEnabled:
      !demo && !preview && process.env.REAL_OPERATIONS_ENABLED === "true",
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
    path: preview
      ? ".data/preview/database"
      : (process.env.DATA_DIR ?? ".data/orion"),
  };
}
