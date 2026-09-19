import { mkdtemp, writeFile, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { parse } from "jsonc-parser";
import { randomBytes } from "node:crypto";
const directory = await mkdtemp(path.join(tmpdir(), "orion-cloudflare-"));
const port = 8789;
const base = `http://127.0.0.1:${port}`;
const origin = "https://orion-test.invalid";
const key = randomBytes(32).toString("hex");
const config = parse(await readFile("wrangler.jsonc", "utf8"));
config.main = path.resolve(config.main);
config.assets.directory = path.resolve(config.assets.directory);
config.vars = {
  ...config.vars,
  APP_ORIGIN: origin,
  APP_KEY: randomBytes(32).toString("hex"),
  PREVIEW_CONTROL_KEY: key,
  PREVIEW_EXPIRES_AT: new Date(Date.now() + 86400000).toISOString(),
};
const control = path.join(directory, "control.json");
const state = path.join(directory, "state.json");
await writeFile(path.join(directory, "wrangler.json"), JSON.stringify(config), {
  mode: 0o600,
});
await writeFile(control, JSON.stringify({ origin, controlKey: key }), {
  mode: 0o600,
});
const env = {
  ...process.env,
  ORION_TEST_URL: base,
  ORION_TEST_CONTROL_FILE: control,
  ORION_TEST_STATE_FILE: state,
  WRANGLER_SEND_METRICS: "false",
};
let server,
  log = "";
function start() {
  server = spawn(
    process.execPath,
    [
      "node_modules/wrangler/bin/wrangler.js",
      "dev",
      "--config",
      path.join(directory, "wrangler.json"),
      "--port",
      String(port),
      "--persist-to",
      path.join(directory, "storage"),
    ],
    { env, stdio: ["ignore", "pipe", "pipe"] },
  );
  server.stdout.on("data", (x) => {
    log += x;
  });
  server.stderr.on("data", (x) => {
    log += x;
  });
}
async function ready() {
  for (let i = 0; i < 120; i++) {
    if (server.exitCode !== null)
      throw new Error(`Local runtime exited: ${log}`);
    try {
      if ((await fetch(`${base}/api/health`)).ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`Local runtime did not start: ${log}`);
}
async function stop() {
  if (server?.exitCode === null) {
    const exited = once(server, "exit");
    server.kill("SIGTERM");
    await exited;
  }
}
async function run(args = []) {
  const child = spawn(
    process.execPath,
    ["scripts/test-cloudflare.mjs", ...args],
    { env, stdio: "inherit" },
  );
  const [code] = await once(child, "exit");
  if (code !== 0) throw new Error("Cloudflare integration verification failed");
}
try {
  start();
  await ready();
  await run();
  await stop();
  start();
  await ready();
  await run(["--persistence"]);
} catch (error) {
  console.error(log);
  throw error;
} finally {
  await stop();
  await rm(directory, { recursive: true, force: true });
}
