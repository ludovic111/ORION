import EmbeddedPostgres from "embedded-postgres";
import { mkdtemp, readFile, chmod, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync, spawn } from "node:child_process";
import { createServer } from "node:net";
import { randomBytes } from "node:crypto";
import assert from "node:assert/strict";
import { openDatabase } from "../server/db.mjs";
const dir = await mkdtemp(join(tmpdir(), "orion-pg-"));
const password = randomBytes(20).toString("hex");
const listener = createServer();
await new Promise((resolve) => listener.listen(0, "127.0.0.1", resolve));
const port = listener.address().port;
await new Promise((resolve) => listener.close(resolve));
execFileSync(
  "openssl",
  [
    "req",
    "-x509",
    "-newkey",
    "rsa:2048",
    "-nodes",
    "-keyout",
    join(dir, "server.key"),
    "-out",
    join(dir, "server.crt"),
    "-days",
    "1",
    "-subj",
    "/CN=localhost",
    "-addext",
    "subjectAltName=DNS:localhost,IP:127.0.0.1",
  ],
  { stdio: "ignore" },
);
await chmod(join(dir, "server.key"), 0o600);
const pg = new EmbeddedPostgres({
  databaseDir: join(dir, "data"),
  user: "orion_test",
  password,
  port,
  persistent: false,
  authMethod: "scram-sha-256",
  postgresFlags: [
    "-h",
    "127.0.0.1",
    "-c",
    "ssl=on",
    "-c",
    `ssl_cert_file=${join(dir, "server.crt")}`,
    "-c",
    `ssl_key_file=${join(dir, "server.key")}`,
  ],
  onLog: () => {},
  onError: () => {},
});
let running = false;
try {
  await pg.initialise();
  await pg.start();
  running = true;
  await pg.createDatabase("orion");
  const url = `postgresql://orion_test:${password}@127.0.0.1:${port}/orion`;
  const code = await new Promise((resolve) => {
    const child = spawn(
      process.execPath,
      ["--test", "--test-concurrency=1", "tests/api.test.mjs"],
      {
        cwd: new URL("../", import.meta.url),
        env: { ...process.env, TEST_DATABASE_URL: url },
        stdio: "inherit",
      },
    );
    child.on("error", () => resolve(1));
    child.on("exit", resolve);
  });
  assert.equal(code, 0);
  const owner = await openDatabase({
    url,
    production: true,
    caFile: join(dir, "server.crt"),
    migrate: true,
  });
  await owner.query(`CREATE ROLE orion_app LOGIN PASSWORD '${password}'`);
  await owner.query(
    await readFile(
      new URL("../docs/postgres-grants.sql", import.meta.url),
      "utf8",
    ),
  );
  await owner.close();
  const appUrl = `postgresql://orion_app:${password}@127.0.0.1:${port}/orion`;
  const app = await openDatabase({
    url: appUrl,
    production: true,
    caFile: join(dir, "server.crt"),
  });
  assert.equal(
    (await app.query("SELECT ssl FROM pg_stat_ssl WHERE pid=pg_backend_pid()"))
      .rows[0].ssl,
    true,
  );
  await assert.rejects(
    app.query("UPDATE audit SET action='tampered' WHERE seq=1"),
    /permission denied/,
  );
  await assert.rejects(app.query("DROP TABLE audit"), /must be owner/);
  await assert.rejects(
    app.query("ALTER TABLE audit DISABLE TRIGGER audit_append_only"),
    /must be owner/,
  );
  await app.close();
  await assert.rejects(
    openDatabase({ url, production: true, caFile: join(dir, "server.crt") }),
    /non propriétaire/,
  );
  await assert.rejects(
    openDatabase({ url: appUrl, production: true }),
    /self-signed|certificate/,
  );
  console.log(
    "Native PostgreSQL: 17 API scenarios passed; verified TLS, CA rejection, owner rejection, audit privileges and trigger protection.",
  );
} finally {
  if (running) await pg.stop();
  await rm(dir, { recursive: true, force: true });
}
