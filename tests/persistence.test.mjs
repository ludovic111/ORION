import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomBytes } from "node:crypto";
import { openDatabase } from "../server/db.mjs";
import { createApp } from "../server/app.mjs";
test("Committed data survives a full database close and reopen", async () => {
  const dir = await mkdtemp(join(tmpdir(), "orion-persistence-"));
  let db;
  try {
    db = await openDatabase({ path: join(dir, "pg") });
    await db.query(
      "INSERT INTO operations(id,name,mode,nature,level,location,commander,phase) VALUES('persist','Persistent','exercise','Test',1,'Genève','Cdt','Test')",
    );
    await db.close();
    db = await openDatabase({ path: join(dir, "pg") });
    assert.equal(
      (await db.query("SELECT name FROM operations WHERE id='persist'")).rows[0]
        .name,
      "Persistent",
    );
  } finally {
    await db?.close();
    await rm(dir, { recursive: true, force: true });
  }
});
test("Production fails closed for missing database, weak key, HTTP origin, demo or SSL overrides", async () => {
  await assert.rejects(openDatabase({ production: true }), /DATABASE_URL/);
  await assert.rejects(
    openDatabase({
      production: true,
      url: "postgresql://localhost/x?sslmode=disable",
    }),
    /TLS/,
  );
  const key = randomBytes(32).toString("hex");
  await assert.rejects(
    createApp(
      {},
      { production: true, origin: "https://orion.test", key: "weak" },
    ),
    /APP_KEY/,
  );
  await assert.rejects(
    createApp({}, { production: true, origin: "http://orion.test", key }),
    /HTTPS/,
  );
  await assert.rejects(
    createApp(
      {},
      { production: true, origin: "https://orion.test", key, demo: true },
    ),
    /interdite/,
  );
});
