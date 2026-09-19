import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { mkdir, open, writeFile, rm, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import express from "express";
import { openDatabase } from "../server/db.mjs";
import { createApp } from "../server/app.mjs";
import { seedDemo } from "../server/seed.mjs";

process.umask(0o077);
const root = ".data/preview";
await mkdir(root, { recursive: true, mode: 0o700 });
await readFile("dist/index.html");
const lock = await open(`${root}/running.lock`, "wx").catch(() => {
  throw new Error(
    "Une démonstration est déjà lancée, ou son verrou subsiste. Consultez docs/DEMONSTRATION.md.",
  );
});
await lock.writeFile(String(process.pid));
await lock.close();
let handler = (_req, res) => {
  res.writeHead(503);
  res.end("Démonstration en préparation.");
};
const server = createServer((req, res) => handler(req, res));
let tunnel,
  db,
  stopping = false;
async function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  tunnel?.kill("SIGTERM");
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
  if (db) await db.close();
  await rm(`${root}/running.lock`, { force: true });
  process.exit(code);
}
for (const signal of ["SIGTERM", "SIGINT"])
  process.on(signal, () => void stop());
try {
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const local = `http://127.0.0.1:${server.address().port}`;
  // Only this dedicated listener is exposed; never the local demonstration or an institutional database.
  tunnel = spawn(
    process.env.CLOUDFLARED_BIN || "cloudflared",
    ["tunnel", "--no-autoupdate", "--url", local, "--protocol", "http2"],
    { stdio: ["ignore", "pipe", "pipe"] },
  );
  const origin = await new Promise((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error("Le tunnel n’a pas démarré en 45 secondes.")),
      45000,
    );
    let log = "";
    const receive = (chunk) => {
      log = (log + chunk.toString()).slice(-12000);
      const url = log.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
      if (url) {
        clearTimeout(timeout);
        resolve(url[0]);
      }
    };
    tunnel.stdout.on("data", receive);
    tunnel.stderr.on("data", receive);
    tunnel.once("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    tunnel.once("exit", (code) => {
      clearTimeout(timeout);
      reject(new Error(`Tunnel interrompu (${code}).`));
    });
  });
  tunnel.on("exit", () => {
    if (!stopping) {
      console.error("Tunnel interrompu. Arrêt de la démonstration.");
      void stop(1);
    }
  });
  const config = {
    preview: true,
    demo: false,
    production: false,
    realOperationsEnabled: false,
    origin,
    key: randomBytes(32).toString("hex"),
    previewControlKey: randomBytes(32).toString("hex"),
    previewExpiresAt: new Date(Date.now() + 48 * 3600000).toISOString(),
  };
  db = await openDatabase({ path: `${root}/database` });
  await seedDemo(db);
  await db.transaction(async (tx) => {
    await tx.query("UPDATE preview_invitations SET revoked=TRUE");
    await tx.query(
      "UPDATE users SET active=FALSE WHERE access_expires_at IS NOT NULL",
    );
    await tx.query("DELETE FROM sessions");
  });
  const app = await createApp(db, config);
  app.use(express.static(resolve("dist"), { index: false, dotfiles: "deny" }));
  app.get("/{*path}", (_req, res) => res.sendFile(resolve("dist/index.html")));
  handler = app;
  await writeFile(
    `${root}/control.json`,
    JSON.stringify(
      {
        local,
        origin,
        controlKey: config.previewControlKey,
        expiresAt: config.previewExpiresAt,
      },
      null,
      2,
    ),
    { mode: 0o600 },
  );
  setTimeout(
    () => void stop(),
    Date.parse(config.previewExpiresAt) - Date.now(),
  );
  console.log(
    `Démonstration disponible : ${origin}\nExpiration : ${config.previewExpiresAt}\nCréer les accès : npm run preview:invite -- "Évaluateur 01"\nArrêter : Ctrl+C. Maintenir cet ordinateur éveillé et connecté.`,
  );
} catch (error) {
  console.error(error.message);
  await stop(1);
}
