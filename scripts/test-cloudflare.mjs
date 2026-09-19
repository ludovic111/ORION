import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
const state = JSON.parse(
  await readFile(
    process.env.ORION_TEST_CONTROL_FILE || ".data/hosted-preview/control.json",
    "utf8",
  ),
);
const base = process.env.ORION_TEST_URL || "http://127.0.0.1:8787";
const origin = state.origin;
const remote = new URL(base).hostname !== "127.0.0.1";
const saved =
  process.env.ORION_TEST_STATE_FILE ||
  `.data/hosted-preview/${remote ? "remote" : "local"}-verification.json`;
async function call(path, method = "GET", body, client, extra = {}) {
  const response = await fetch(`${base}/api${path}`, {
    method,
    headers: {
      Origin: origin,
      "Content-Type": "application/json",
      ...(client ? { Cookie: client.cookie, "X-CSRF-Token": client.csrf } : {}),
      ...extra,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await response.json();
  return {
    status: response.status,
    data,
    headers: response.headers,
    cookie: response.headers.get("set-cookie")?.split(";")[0],
  };
}
if (process.argv.includes("--persistence")) {
  const old = JSON.parse(await readFile(saved, "utf8"));
  const response = await call(
    `/operations/${old.op}/records`,
    "GET",
    undefined,
    old.client,
  );
  assert.equal(response.status, 200, JSON.stringify(response.data));
  assert(response.data.some((x) => x.id === old.record));
  const login = await call("/preview/enter", "POST", {
    token: old.token,
    syntheticOnly: true,
  });
  assert.equal(login.status, 200);
  console.log(
    "Persistence verified: exercise record, invitation and session survived restart/redeploy.",
  );
  process.exit(0);
}
assert.equal((await call("/health")).status, 200);
assert.equal((await call("/operations")).status, 401);
assert.equal((await call("/demo", "POST", {})).status, 404);
assert.equal((await call("/login", "POST", {})).status, 403);
assert.equal(
  (await call("/preview/manage/invitations", "POST", {})).status,
  404,
);
async function invite(role, label) {
  const result = await call(
    "/preview/manage/invitations",
    "POST",
    { label, hours: 168, role },
    undefined,
    { "X-Orion-Preview-Control": state.controlKey },
  );
  assert.equal(result.status, 201, JSON.stringify(result.data));
  const token = new URL(result.data.url).hash.slice(12);
  assert.equal(
    (await call("/preview/enter", "POST", { token, syntheticOnly: false }))
      .status,
    400,
  );
  const login = await call("/preview/enter", "POST", {
    token,
    syntheticOnly: true,
  });
  assert.equal(login.status, 200, JSON.stringify(login.data));
  for (const flag of ["Secure", "HttpOnly", "SameSite=Strict"])
    assert(login.headers.get("set-cookie").includes(flag));
  return {
    id: result.data.id,
    token,
    client: { cookie: login.cookie, csrf: login.data.csrf },
  };
}
const first = await invite("command", "Vérification technique Cloudflare");
const viewer = await invite("viewer", "Vérification lecture Cloudflare");
const client = first.client;
const ops = await call("/operations", "GET", undefined, client);
assert.equal(ops.status, 200);
assert.equal(ops.data.length, 1);
const op = ops.data[0].id;
assert.equal(
  (await call(`/operations/${op}/records`, "GET", undefined, viewer.client))
    .status,
  404,
);
assert.equal(
  (await call("/admin/users", "GET", undefined, client)).status,
  403,
);
const records = await call(
  `/operations/${op}/records`,
  "GET",
  undefined,
  client,
);
assert.equal(records.status, 200);
assert(records.data.length > 15);
const stock = records.data.find((x) => x.kind === "stock");
const data = { ...stock.data, name: "Stock test hébergement indépendant" };
const create = () =>
  call(`/operations/${op}/records`, "POST", { kind: "stock", data }, client);
assert.equal(
  (
    await call(
      `/operations/${op}/records`,
      "POST",
      { kind: "stock", data },
      { ...client, csrf: "wrong" },
    )
  ).status,
  403,
);
assert.equal(
  (
    await call(
      `/operations/${op}/records`,
      "POST",
      { kind: "stock", data },
      client,
      { Origin: "https://evil.invalid" },
    )
  ).status,
  403,
);
const created = await create();
assert.equal(created.status, 201, JSON.stringify(created.data));
const update = { kind: "stock", data, version: 1 };
const edits = await Promise.all([
  call(`/operations/${op}/records/${created.data.id}`, "PUT", update, client),
  call(`/operations/${op}/records/${created.data.id}`, "PUT", update, client),
]);
assert.deepEqual(edits.map((x) => x.status).sort(), [200, 409]);
const before = (
  await call(`/operations/${op}/records`, "GET", undefined, client)
).data.length;
const imported = await call(
  `/operations/${op}/import`,
  "POST",
  {
    records: [
      { kind: "stock", data },
      { kind: "stock", data: { ...data, total: -1 } },
    ],
  },
  client,
);
assert.equal(imported.status, 400);
assert.equal(
  (await call(`/operations/${op}/records`, "GET", undefined, client)).data
    .length,
  before,
);
const ownViewerOp = (await call("/operations", "GET", undefined, viewer.client))
  .data[0].id;
assert.equal(
  (
    await call(
      `/operations/${ownViewerOp}/records`,
      "POST",
      { kind: "stock", data },
      viewer.client,
    )
  ).status,
  403,
);
assert.equal(
  (
    await call(
      `/operations/${op}/export`,
      "POST",
      { purpose: "Contrôle démonstration", recipient: "Équipe de test" },
      client,
    )
  ).status,
  200,
);
assert.equal(
  (
    await call("/preview/manage/revoke", "POST", { id: viewer.id }, undefined, {
      "X-Orion-Preview-Control": state.controlKey,
    })
  ).status,
  200,
);
assert.equal(
  (await call("/operations", "GET", undefined, viewer.client)).status,
  401,
);
await writeFile(
  saved,
  JSON.stringify({
    op,
    record: created.data.id,
    client,
    token: first.token,
    invitationId: first.id,
  }),
  { mode: 0o600 },
);
console.log(
  "Cloudflare checks passed: anonymous denial, consent, secure cookie, isolated exercises, roles, CSRF/origin, concurrent edits, atomic rollback, export and revocation.",
);
