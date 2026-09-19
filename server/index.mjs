import express from "express";
import { existsSync } from "node:fs";
import path from "node:path";
import { loadConfig } from "./config.mjs";
import { openDatabase } from "./db.mjs";
import { createApp } from "./app.mjs";
import { seedDemo } from "./seed.mjs";
import { mapTile } from "./map-tiles.mjs";
const config = await loadConfig();
const db = await openDatabase(config);
if (config.demo || config.preview) await seedDemo(db);
const app = await createApp(db, config);
app.use("/basemap", async (req, res) => {
  if (!config.mapOnline) return res.sendStatus(404);
  const result = await mapTile(
    new Request(new URL(req.originalUrl, config.origin), {
      method: req.method,
    }),
  );
  res.status(result.status);
  result.headers.forEach((value, key) => res.setHeader(key, value));
  res.end(Buffer.from(await result.arrayBuffer()));
});
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
    `ORION : ${config.origin} · ${config.preview ? "démonstration partagée" : config.demo ? "exercice local" : "institution"}`,
  ),
);
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () =>
    server.close(async () => {
      await db.close();
      process.exit(0);
    }),
  );
