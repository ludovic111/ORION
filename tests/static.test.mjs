import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { spawn } from "node:child_process";
let child, directory, base;
before(async () => {
  directory = await mkdtemp(join(tmpdir(), "orion-static-test-"));
  await mkdir(join(directory, "dist"));
  await writeFile(
    join(directory, "dist", "index.html"),
    "<!doctype html><title>orion aic fixture</title>",
  );
  await writeFile(join(directory, ".env"), "TEST_ONLY_SECRET=not-for-http");
  child = spawn(process.execPath, [resolve("server/index.mjs")], {
    cwd: directory,
    env: { ...process.env, PORT: "0", HOST: "127.0.0.1" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  base = await new Promise((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error("Static server did not start")),
      5000,
    );
    child.once("error", reject);
    child.stdout.on("data", (chunk) => {
      const match = chunk.toString().match(/http:\/\/127\.0\.0\.1:\d+/);
      if (match) {
        clearTimeout(timeout);
        resolve(match[0]);
      }
    });
  });
});
after(async () => {
  child?.kill();
  if (directory) await rm(directory, { recursive: true, force: true });
});
test("static server serves the application with restrictive headers and no cookies", async () => {
  const response = await fetch(base);
  assert.equal(response.status, 200);
  assert.match(await response.text(), /orion aic fixture/);
  assert.match(response.headers.get("content-type"), /text\/html/);
  assert.equal(response.headers.get("set-cookie"), null);
  for (const directive of [
    "script-src 'self'",
    "form-action 'none'",
    "frame-ancestors 'none'",
  ])
    assert.ok(
      response.headers.get("content-security-policy").includes(directive),
    );
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
});
test("static server refuses writes, old API routes and files outside the build", async () => {
  assert.equal(
    (
      await fetch(base + "/api/preview/start", {
        method: "POST",
        body: "fictional-test",
      })
    ).status,
    405,
  );
  assert.equal((await fetch(base + "/api/operations")).status, 404);
  assert.equal((await fetch(base + "/%2e%2e%2f.env")).status, 404);
  assert.equal((await fetch(base + "/.env")).status, 404);
  const head = await fetch(base, { method: "HEAD" });
  assert.equal(head.status, 200);
  assert.equal(await head.text(), "");
});

test("behind the HTTPS proxy the site enforces HTTPS", async () => {
  const secure = await fetch(`${base}/`, {
    headers: { "x-forwarded-proto": "https" },
  });
  assert.match(
    secure.headers.get("strict-transport-security") ?? "",
    /max-age=31536000/,
  );
  const policy = secure.headers.get("content-security-policy") ?? "";
  assert.match(policy, /upgrade-insecure-requests/);
  assert.doesNotMatch(policy, /ws:\/\//);
  const plain = await fetch(`${base}/`);
  assert.equal(plain.headers.get("strict-transport-security"), null);
  assert.match(plain.headers.get("content-security-policy") ?? "", /ws:\/\//);
});

test("the service worker may fetch map tiles (connect-src), in the server and in _headers", async () => {
  const { readFile } = await import("node:fs/promises");
  const hosts = ["https://wmts.geo.admin.ch", "https://tile.openstreetmap.org"];
  const directive = (policy, name) =>
    policy
      .split(";")
      .map((d) => d.trim())
      .find((d) => d.startsWith(`${name} `)) ?? "";
  const served = (await fetch(`${base}/`)).headers.get(
    "content-security-policy",
  );
  const file = (await readFile("public/_headers", "utf8")).match(
    /Content-Security-Policy: (.+)/,
  )[1];
  for (const policy of [served, file])
    for (const host of hosts) {
      assert.ok(directive(policy, "connect-src").includes(host), host);
      assert.ok(directive(policy, "img-src").includes(host), host);
    }
});
