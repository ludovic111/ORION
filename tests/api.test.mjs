import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID, randomBytes } from "node:crypto";
import { openDatabase } from "../server/db.mjs";
import { createApp } from "../server/app.mjs";
import { hashPassword, totp, digest } from "../server/security.mjs";
let db, server, base, admin, operator, viewer, opA, opB, journal;
const origin = "http://orion.test",
  password = "Test-only-password-2026!";
async function call(path, method = "GET", body, client, overrides = {}) {
  const headers = {
    Origin: origin,
    ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
    ...(client ? { Cookie: client.cookie, "X-CSRF-Token": client.csrf } : {}),
    ...overrides,
  };
  const response = await fetch(base + "/api" + path, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const data = await response.json();
  const cookie = response.headers.getSetCookie()?.[0]?.split(";")[0];
  return { status: response.status, data, headers: response.headers, cookie };
}
async function enroll(email) {
  const login = await call("/login", "POST", { email, password, code: "" });
  assert.equal(login.status, 200);
  assert.equal(login.data.authenticated, false);
  const client = { cookie: login.cookie, csrf: login.data.csrf };
  const setup = await call("/mfa/setup", "POST", {}, client);
  assert.equal(setup.status, 200);
  const confirm = await call(
    "/mfa/confirm",
    "POST",
    { code: totp(setup.data.secret, Math.floor(Date.now() / 30000)) },
    client,
  );
  assert.equal(confirm.status, 200);
  return {
    cookie: confirm.cookie,
    csrf: confirm.data.csrf,
    id: confirm.data.user.id,
  };
}
before(async () => {
  db = await openDatabase({
    url: process.env.TEST_DATABASE_URL,
    path: "memory://",
  });
  const id = randomUUID();
  await db.query(
    "INSERT INTO users(id,email,name,role,password_hash) VALUES($1,$2,$3,$4,$5)",
    [id, "admin@test.local", "Admin", "admin", await hashPassword(password)],
  );
  const app = await createApp(db, {
    origin,
    key: randomBytes(32).toString("hex"),
    demo: false,
  });
  server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  if (db) await db.close();
});
test("Unauthenticated access and demo bypass are rejected", async () => {
  assert.equal((await call("/operations")).status, 401);
  assert.equal((await call("/demo", "POST", {})).status, 404);
});
test("Origin enforcement, CSP and secret-free error responses", async () => {
  const response = await call(
    "/login",
    "POST",
    { email: "admin@test.local", password, code: "" },
    null,
    { Origin: "https://evil.example" },
  );
  assert.equal(response.status, 403);
  assert.match(
    response.headers.get("content-security-policy"),
    /script-src 'self'/,
  );
  assert.match(
    response.headers.get("content-security-policy"),
    /frame-ancestors 'none'/,
  );
  assert.equal(
    (
      await call("/login", "POST", {
        email: "missing@test.local",
        password,
        code: "",
      })
    ).status,
    401,
  );
});
test("First login must enroll MFA before accessing operational records", async () => {
  const r = await call("/login", "POST", {
    email: "admin@test.local",
    password,
    code: "",
  });
  const client = { cookie: r.cookie, csrf: r.data.csrf };
  assert.equal(
    (await call("/operations", "GET", undefined, client)).status,
    403,
  );
  admin = await enroll("admin@test.local");
  assert.equal(
    (await call("/operations", "GET", undefined, client)).status,
    401,
  );
});
test("Create independent dossiers and accounts with explicit membership", async () => {
  const operation = {
    name: "Exercice A",
    mode: "exercise",
    nature: "Crue",
    level: 2,
    location: "Genève",
    commander: "Cdt exercice",
    phase: "Évaluation",
  };
  const a = await call("/operations", "POST", operation, admin),
    b = await call(
      "/operations",
      "POST",
      { ...operation, name: "Exercice B" },
      admin,
    );
  assert.equal(a.status, 201);
  assert.equal(b.status, 201);
  opA = a.data.id;
  opB = b.data.id;
  for (const role of ["operator", "viewer"]) {
    assert.equal(
      (
        await call(
          "/admin/users",
          "POST",
          {
            email: `${role}@test.local`,
            password,
            name: role,
            role,
            operationIds: [opA],
          },
          admin,
        )
      ).status,
      201,
    );
  }
  operator = await enroll("operator@test.local");
  viewer = await enroll("viewer@test.local");
});
test("Operation membership blocks enumeration and cross-dossier writes", async () => {
  const r = await call("/operations", "GET", undefined, operator);
  assert.equal(r.data.length, 1);
  assert.equal(r.data[0].id, opA);
  assert.equal(
    (await call(`/operations/${opB}/records`, "GET", undefined, operator))
      .status,
    404,
  );
  assert.equal(
    (
      await call(
        `/operations/${opB}/records`,
        "POST",
        {
          kind: "stock",
          data: { name: "x", total: 1, available: 1, location: "x" },
        },
        operator,
      )
    ).status,
    404,
  );
});
test("Operator can create reports of observations but cannot issue orders", async () => {
  const data = {
    title: "Renseignement terrain",
    type: "Rapport",
    priority: "P2",
    source: "Poste terrain",
    status: "Ouvert",
    assignee: "",
    location: "Carouge",
    decision: "",
    reliability: "Non confirmé",
    validated: false,
  };
  const created = await call(
    `/operations/${opA}/records`,
    "POST",
    { kind: "journal", data },
    operator,
  );
  assert.equal(created.status, 201);
  journal = { id: created.data.id, data };
  assert.equal(
    (
      await call(
        `/operations/${opA}/records`,
        "POST",
        { kind: "journal", data: { ...data, type: "Ordre" } },
        operator,
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await call(
        `/operations/${opA}/records`,
        "POST",
        { kind: "journal", data: { ...data, validated: true } },
        operator,
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await call(
        `/operations/${opA}/records`,
        "POST",
        { kind: "report", data: { title: "a", situation: "b" } },
        operator,
      )
    ).status,
    403,
  );
});
test("Read-only users cannot write or access administration", async () => {
  assert.equal(
    (
      await call(
        `/operations/${opA}/records`,
        "POST",
        { kind: "journal", data: journal.data },
        viewer,
      )
    ).status,
    403,
  );
  assert.equal(
    (await call("/admin/users", "GET", undefined, viewer)).status,
    403,
  );
  assert.equal(
    (
      await call(
        `/operations/${opA}/export`,
        "POST",
        { purpose: "Exercice de test", recipient: "Conduite" },
        viewer,
      )
    ).status,
    403,
  );
});
test("CSRF token required and spoofed body fields rejected", async () => {
  assert.equal(
    (
      await call(
        `/operations/${opA}/records`,
        "POST",
        { kind: "journal", data: journal.data },
        operator,
        { "X-CSRF-Token": "bad" },
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await call(
        `/operations/${opA}/records`,
        "POST",
        { kind: "journal", data: { ...journal.data, created_by: admin.id } },
        operator,
      )
    ).status,
    400,
  );
  assert.equal(
    (
      await call(
        `/operations/${opA}/records`,
        "POST",
        { kind: "__proto__", data: {} },
        admin,
      )
    ).status,
    400,
  );
});
test("Concurrent edits cannot silently overwrite one another", async () => {
  const path = `/operations/${opA}/records/${journal.id}`;
  const results = await Promise.all([
    call(
      path,
      "PUT",
      { kind: "journal", data: { ...journal.data, decision: "A" }, version: 1 },
      operator,
    ),
    call(
      path,
      "PUT",
      { kind: "journal", data: { ...journal.data, decision: "B" }, version: 1 },
      operator,
    ),
  ]);
  assert.deepEqual(results.map((r) => r.status).sort(), [200, 409]);
  const row = (
    await call(`/operations/${opA}/records`, "GET", undefined, operator)
  ).data.find((r) => r.id === journal.id);
  assert.equal(row.version, 2);
});
test("A validated journal entry cannot be unvalidated by an operator", async () => {
  assert.equal(
    (
      await call(
        `/operations/${opA}/records/${journal.id}`,
        "PUT",
        {
          kind: "journal",
          data: { ...journal.data, validated: true },
          version: 2,
        },
        admin,
      )
    ).status,
    200,
  );
  assert.equal(
    (
      await call(
        `/operations/${opA}/records/${journal.id}`,
        "PUT",
        {
          kind: "journal",
          data: { ...journal.data, validated: false },
          version: 3,
        },
        operator,
      )
    ).status,
    403,
  );
});
test("Batch imports are atomic when any row fails validation", async () => {
  const rows = (
    await call(`/operations/${opA}/records`, "GET", undefined, admin)
  ).data.length;
  const result = await call(
    `/operations/${opA}/import`,
    "POST",
    {
      records: [
        {
          kind: "stock",
          data: { name: "Valid", total: 2, available: 1, location: "A" },
        },
        {
          kind: "stock",
          data: { name: "Invalid", total: 2, available: 5, location: "A" },
        },
      ],
    },
    admin,
  );
  assert.equal(result.status, 400);
  assert.equal(
    (await call(`/operations/${opA}/records`, "GET", undefined, admin)).data
      .length,
    rows,
  );
});
test("Map signs, coordinates and links are validated against the dossier", async () => {
  assert.equal(
    (
      await call(
        `/operations/${opA}/records`,
        "POST",
        {
          kind: "map",
          data: {
            name: "A",
            symbol: "fake",
            lat: 46.2,
            lng: 6.1,
            organization: "PCi",
            category: "Effets",
            notes: "",
          },
        },
        operator,
      )
    ).status,
    400,
  );
  const stock = await call(
    `/operations/${opB}/records`,
    "POST",
    {
      kind: "stock",
      data: { name: "B", total: 1, available: 1, location: "B" },
    },
    admin,
  );
  assert.equal(
    (
      await call(
        `/operations/${opA}/records`,
        "POST",
        {
          kind: "link",
          data: {
            source: journal.id,
            target: stock.data.id,
            label: "cross tenant",
          },
        },
        operator,
      )
    ).status,
    400,
  );
});
test("Audit chain verifies; direct UPDATE DELETE and TRUNCATE fail", async () => {
  const check = await call("/admin/audit/verify", "GET", undefined, admin);
  assert.equal(check.status, 200);
  assert.equal(check.data.valid, true);
  assert.ok(check.data.entries > 10);
  await assert.rejects(
    db.query("UPDATE audit SET action='tampered' WHERE seq=1"),
    /append-only/,
  );
  await assert.rejects(
    db.query("DELETE FROM audit WHERE seq=1"),
    /append-only/,
  );
  await assert.rejects(db.query("TRUNCATE audit"), /append-only/);
});
test("Exports are authenticated, scoped, and audited", async () => {
  const result = await call(
    `/operations/${opA}/export`,
    "POST",
    { purpose: "Exercice de test", recipient: "Conduite" },
    admin,
  );
  assert.equal(result.status, 200);
  assert.equal(result.data.operation.id, opA);
  assert.ok(result.data.records.every((r) => r.operation_id === opA));
  assert.ok(!JSON.stringify(result.data).includes("password_hash"));
  const audit = (await call("/admin/audit", "GET", undefined, admin)).data;
  assert.equal(audit[0].action, "operation.exported");
});
test("Closed operations reject all writes until explicitly reopened", async () => {
  assert.equal(
    (
      await call(
        `/operations/${opA}`,
        "PATCH",
        { status: "closed", version: 1 },
        admin,
      )
    ).status,
    200,
  );
  assert.equal(
    (
      await call(
        `/operations/${opA}/records`,
        "POST",
        { kind: "journal", data: journal.data },
        operator,
      )
    ).status,
    409,
  );
  assert.equal(
    (await call(`/operations/${opA}/records`, "GET", undefined, viewer)).status,
    200,
  );
  assert.equal(
    (
      await call(
        `/operations/${opA}`,
        "PATCH",
        { status: "active", version: 2 },
        admin,
      )
    ).status,
    200,
  );
});
test("Suspension and access changes revoke existing sessions immediately", async () => {
  assert.equal(
    (
      await call(
        `/admin/users/${operator.id}`,
        "PATCH",
        { active: false, role: "operator", operationIds: [opA] },
        admin,
      )
    ).status,
    200,
  );
  assert.equal(
    (await call("/operations", "GET", undefined, operator)).status,
    401,
  );
  assert.equal(
    (
      await call(
        `/admin/users/${admin.id}`,
        "PATCH",
        { active: false, role: "viewer", operationIds: [] },
        admin,
      )
    ).status,
    400,
  );
});
test("Background polling does not defeat idle expiry; logout revokes server session", async () => {
  const token = viewer.cookie.split("=")[1];
  await db.query(
    "UPDATE sessions SET last_seen=CURRENT_TIMESTAMP-INTERVAL '29 minutes' WHERE token_hash=$1",
    [digest(token)],
  );
  const before = (
    await db.query("SELECT last_seen FROM sessions WHERE token_hash=$1", [
      digest(token),
    ])
  ).rows[0].last_seen;
  assert.equal(
    (await call("/operations", "GET", undefined, viewer)).status,
    200,
  );
  assert.equal(
    String(
      (
        await db.query("SELECT last_seen FROM sessions WHERE token_hash=$1", [
          digest(token),
        ])
      ).rows[0].last_seen,
    ),
    String(before),
  );
  await db.query(
    "UPDATE sessions SET last_seen=CURRENT_TIMESTAMP-INTERVAL '31 minutes' WHERE token_hash=$1",
    [digest(token)],
  );
  assert.equal(
    (await call("/operations", "GET", undefined, viewer)).status,
    401,
  );
  assert.equal((await call("/logout", "POST", {}, admin)).status, 200);
  assert.equal(
    (await call("/operations", "GET", undefined, admin)).status,
    401,
  );
});
