import { loadConfig } from "../server/config.mjs";
import { openDatabase } from "../server/db.mjs";
const config = await loadConfig();
const db = await openDatabase({
  ...config,
  url: process.env.MIGRATION_DATABASE_URL ?? config.url,
  migrate: true,
});
console.log("Schéma ORION initialisé.");
await db.close();
