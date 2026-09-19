import express from "express";
import { existsSync } from "node:fs";
import path from "node:path";
import { loadConfig } from "./config.mjs";
import { openDatabase } from "./db.mjs";
import { createApp } from "./app.mjs";
import { seedDemo } from "./seed.mjs";
const config = await loadConfig();
const db = await openDatabase(config);
if (config.demo) await seedDemo(db);
const app = await createApp(db, config);
// Serve only the production bundle. Source files, secrets and the original design stay private.
if (!existsSync("dist/index.html"))
  throw new Error("Exécutez npm run build avant de démarrer.");
app.use(
  express.static(path.resolve("dist"), { index: false, dotfiles: "deny" }),
);
app.get("/{*path}", (req, res) =>
  res.sendFile(path.resolve("dist/index.html")),
);
const server = app.listen(config.port, config.host, () =>
  console.log(
    `ORION : ${config.origin} · ${config.demo ? "exercice local" : "institution"}`,
  ),
);
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () =>
    server.close(async () => {
      await db.close();
      process.exit(0);
    }),
  );
