import { test } from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { openDatabase } from "../server/db.mjs";
import { createApp } from "../server/app.mjs";
import { schemas } from "../server/validation.mjs";
import { governanceReady } from "../server/governance.mjs";
import { seedDemo } from "../server/seed.mjs";

async function fixture(t, preview = false, hosted = false) {
  const db = await openDatabase({ path: "memory://" });
  await seedDemo(db);
  const config = {
    origin: preview ? "https://preview.test" : "http://local.test",
    key: randomBytes(32).toString("hex"),
    demo: !preview,
    preview,
    hostedPreview: hosted,
    previewControlKey: randomBytes(32).toString("hex"),
    previewExpiresAt: new Date(Date.now() + 3600000).toISOString(),
  };
  const app = await createApp(db, config);
  const server = app.listen(0, "127.0.0.1");
  await new Promise((r) => server.once("listening", r));
  t.after(async () => {
    await new Promise((r) => server.close(r));
    await db.close();
  });
  const call = async (path, method = "GET", body, client, headers = {}) => {
    const res = await fetch(
      `http://127.0.0.1:${server.address().port}/api${path}`,
      {
        method,
        headers: {
          Origin: config.origin,
          "Content-Type": "application/json",
          ...(client
            ? { Cookie: client.cookie, "X-CSRF-Token": client.csrf }
            : {}),
          ...headers,
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      },
    );
    return {
      status: res.status,
      data: await res.json(),
      cookie: res.headers.get("set-cookie")?.split(";")[0],
      headers: res.headers,
    };
  };
  return { db, config, call };
}
const journal = {
  title: "Observation fictive confidentielle",
  type: "Rapport",
  source: "Poste exercice",
  priority: "P3",
  status: "Ouvert",
  reliability: "Confirmé",
  location: "Carouge",
  assignee: "Équipe 1",
  decision: "",
  validated: false,
};
test("Governance blocks real writes and exports until reviewed; withdrawal, version conflicts and audit minimization", async (t) => {
  const { db, call } = await fixture(t);
  const login = await call("/demo", "POST", {});
  assert.equal(login.status, 200);
  const client = { cookie: login.cookie, csrf: login.data.csrf };
  const op = (await call("/operations", "GET", undefined, client)).data[0];
  const root = `/operations/${op.id}`;
  const real = await call(
    "/operations",
    "POST",
    {
      name: "Engagement réel",
      mode: "real",
      nature: "Inondation",
      level: 3,
      location: "Genève",
      commander: "Conduite",
      phase: "Engagement",
    },
    client,
  );
  assert.equal(real.status, 403);
  assert.match(real.data.error, /pas activés/);
  await db.query("UPDATE operations SET mode='real' WHERE id=$1", [op.id]);
  assert.equal(
    (
      await call(
        `${root}/records`,
        "POST",
        { kind: "journal", data: journal },
        client,
      )
    ).status,
    409,
  );
  assert.equal(
    (
      await call(
        `${root}/export`,
        "POST",
        { purpose: "Test de diffusion", recipient: "Équipe fictive" },
        client,
      )
    ).status,
    409,
  );
  const policy = Object.fromEntries(
    [
      "controller",
      "purpose",
      "legalBasis",
      "dataCategories",
      "recipients",
      "retentionRule",
      "archiveDecision",
      "privacyContact",
      "impactAssessment",
      "accessReview",
    ].map((k) => [k, "Cadre fictif pour validation"]),
  );
  policy.reviewDate = "2099-01-01";
  policy.approved = true;
  assert.equal(
    (
      await call(
        `${root}/governance`,
        "PUT",
        { version: 0, data: policy },
        client,
      )
    ).status,
    200,
  );
  assert.equal(
    (
      await call(
        `${root}/governance`,
        "PUT",
        { version: 0, data: policy },
        client,
      )
    ).status,
    409,
  );
  const made = await call(
    `${root}/records`,
    "POST",
    { kind: "journal", data: journal },
    client,
  );
  assert.equal(made.status, 201, JSON.stringify(made.data));
  assert.equal((await call(`${root}/export`, "POST", {}, client)).status, 400);
  assert.equal(
    (
      await call(
        `${root}/export`,
        "POST",
        { purpose: "Exercice de diffusion", recipient: "Équipe fictive" },
        client,
      )
    ).status,
    200,
  );
  await call(`${root}/records`, "GET", undefined, client);
  const logs = (
    await db.query("SELECT action,detail FROM audit WHERE operation_id=$1", [
      op.id,
    ])
  ).rows;
  assert.ok(logs.some((r) => r.action === "records.read"));
  assert.ok(
    logs.some(
      (r) =>
        r.action === "operation.exported" &&
        r.detail.recipient === "Équipe fictive",
    ),
  );
  const changed = logs.find(
    (r) => r.detail.afterHash && r.detail.fields?.includes("title"),
  );
  assert.ok(changed);
  assert.ok(!JSON.stringify(changed).includes(journal.title));
  assert.equal(
    (
      await call(
        `${root}/governance`,
        "PUT",
        { version: 1, data: { ...policy, approved: false } },
        client,
      )
    ).status,
    200,
  );
  assert.equal(
    (
      await call(
        `${root}/records`,
        "POST",
        { kind: "journal", data: journal },
        client,
      )
    ).status,
    409,
  );
});
test("Preview invitations isolate exercises and enforce consent, role, expiry, revocation, CSRF and secure sessions", async (t) => {
  const { db, call, config } = await fixture(t, true);
  const management = { "X-Orion-Preview-Control": config.previewControlKey };
  const create = (label) =>
    call(
      "/preview/manage/invitations",
      "POST",
      { label, hours: 1, role: "command" },
      undefined,
      management,
    );
  assert.equal(
    (
      await call("/preview/manage/invitations", "POST", {
        label: "Intrus",
        hours: 1,
        role: "admin",
      })
    ).status,
    404,
  );
  assert.equal(
    (
      await call(
        "/preview/manage/invitations",
        "POST",
        { label: "Intrus", hours: 1, role: "admin" },
        undefined,
        management,
      )
    ).status,
    400,
  );
  assert.equal((await call("/demo", "POST", {})).status, 404);
  assert.equal((await call("/login", "POST", {})).status, 403);
  const a = await create("Testeur A"),
    b = await create("Testeur B");
  assert.equal(a.status, 201, JSON.stringify(a.data));
  assert.equal(b.status, 201);
  const tokenA = new URL(a.data.url).hash.slice(12),
    tokenB = new URL(b.data.url).hash.slice(12);
  assert.equal(
    (
      await call("/preview/enter", "POST", {
        token: tokenA,
        syntheticOnly: false,
      })
    ).status,
    400,
  );
  const entered = await call("/preview/enter", "POST", {
    token: tokenA,
    syntheticOnly: true,
  });
  assert.equal(entered.status, 200);
  assert.match(entered.headers.get("set-cookie"), /Secure/);
  assert.match(entered.headers.get("set-cookie"), /HttpOnly/);
  const ca = { cookie: entered.cookie, csrf: entered.data.csrf };
  const eb = await call("/preview/enter", "POST", {
    token: tokenB,
    syntheticOnly: true,
  });
  const cb = { cookie: eb.cookie, csrf: eb.data.csrf };
  const oa = (await call("/operations", "GET", undefined, ca)).data,
    ob = (await call("/operations", "GET", undefined, cb)).data;
  assert.equal(oa.length, 1);
  assert.equal(ob.length, 1);
  assert.notEqual(oa[0].id, ob[0].id);
  assert.equal(
    (await call(`/operations/${ob[0].id}/records`, "GET", undefined, ca))
      .status,
    404,
  );
  assert.equal(
    (
      await call(
        `/operations/${oa[0].id}/records`,
        "POST",
        { kind: "journal", data: journal },
        { ...ca, csrf: "wrong" },
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await call(
        `/operations/${oa[0].id}/records`,
        "POST",
        { kind: "journal", data: journal },
        ca,
      )
    ).status,
    201,
  );
  const rb = (
    await call(`/operations/${ob[0].id}/records`, "GET", undefined, cb)
  ).data;
  assert.ok(!rb.some((r) => r.data.title === journal.title));
  assert.equal((await call("/admin/users", "GET", undefined, ca)).status, 403);
  assert.equal(
    (
      await call(
        "/preview/manage/revoke",
        "POST",
        { id: a.data.id },
        undefined,
        management,
      )
    ).status,
    200,
  );
  assert.equal((await call("/operations", "GET", undefined, ca)).status, 401);
  assert.equal(
    (
      await call("/preview/enter", "POST", {
        token: tokenA,
        syntheticOnly: true,
      })
    ).status,
    401,
  );
  await db.query(
    "UPDATE users SET access_expires_at=CURRENT_TIMESTAMP-INTERVAL '1 second' WHERE id=$1",
    [eb.data.user.id],
  );
  assert.equal((await call("/operations", "GET", undefined, cb)).status, 401);
  config.previewExpiresAt = new Date(Date.now() - 1000).toISOString();
  assert.equal((await call("/operations", "GET", undefined, cb)).status, 410);
});

test("OIMDE requires five complete sections and an order; governance expires on the review boundary", () => {
  const oimde = {
    orientation: "Crue fictive",
    intention: "Protéger le secteur",
    mission: "Équipe 1 contrôle le quai avant midi",
    dispositions: "Radio exercice uniquement",
    emplacement: "PC exercice",
    deadline: "2026-09-20T12:00:00+02:00",
  };
  assert.equal(
    schemas.journal.safeParse({ ...journal, type: "Ordre", oimde }).success,
    true,
  );
  assert.equal(schemas.journal.safeParse({ ...journal, oimde }).success, false);
  for (const field of Object.keys(oimde)) {
    const incomplete = { ...oimde };
    delete incomplete[field];
    assert.equal(
      schemas.journal.safeParse({
        ...journal,
        type: "Ordre",
        oimde: incomplete,
      }).success,
      false,
    );
  }
  const row = {
    reviewed_at: "2026-09-19T08:00:00Z",
    data: { approved: true, reviewDate: "2026-09-20" },
  };
  assert.equal(governanceReady(row, "2026-09-20"), true);
  assert.equal(governanceReady(row, "2026-09-21"), false);
});

test("Hosted invitations can last seven days, remain capped by instance expiry, and preserve access checks", async (t) => {
  const { call, config } = await fixture(t, true, true);
  const created = await call(
    "/preview/manage/invitations",
    "POST",
    { label: "Hébergé fictif", hours: 168, role: "viewer" },
    undefined,
    { "X-Orion-Preview-Control": config.previewControlKey },
  );
  assert.equal(created.status, 201, JSON.stringify(created.data));
  assert.equal(created.data.expiresAt, config.previewExpiresAt);
  const login = await call("/preview/enter", "POST", {
    token: new URL(created.data.url).hash.slice(12),
    syntheticOnly: true,
  });
  assert.equal(login.status, 200);
  const client = { cookie: login.cookie, csrf: login.data.csrf };
  assert.equal(
    (await call("/admin/users", "GET", undefined, client)).status,
    403,
  );
  assert.equal((await call("/config")).data.hostedPreview, true);
});

test("Name-only preview creates independent command exercises, with session persistence and no identity lookup", async (t) => {
  const { db, call, config } = await fixture(t, true, true);
  const start = () =>
    call("/preview/start", "POST", { name: "  Alex  ", syntheticOnly: true });
  const [a, b] = await Promise.all([start(), start()]);
  for (const login of [a, b]) {
    assert.equal(login.status, 201, JSON.stringify(login.data));
    assert.equal(login.data.user.name, "Alex");
    assert.equal(login.data.user.role, "command");
    for (const flag of ["HttpOnly", "Secure", "SameSite=Strict"])
      assert.ok(login.headers.get("set-cookie").includes(flag));
  }
  assert.notEqual(a.data.user.id, b.data.user.id);
  const ca = { cookie: a.cookie, csrf: a.data.csrf };
  const cb = { cookie: b.cookie, csrf: b.data.csrf };
  const oa = (await call("/operations", "GET", undefined, ca)).data;
  const ob = (await call("/operations", "GET", undefined, cb)).data;
  assert.equal(oa.length, 1);
  assert.equal(ob.length, 1);
  assert.equal(oa[0].mode, "exercise");
  assert.notEqual(oa[0].id, ob[0].id);
  const root = `/operations/${oa[0].id}`;
  const records = (await call(`${root}/records`, "GET", undefined, ca)).data;
  assert.ok(records.length > 15);
  const ids = new Set(records.map((r) => r.id));
  for (const link of records.filter((r) => r.kind === "link")) {
    assert.ok(ids.has(link.data.source));
    assert.ok(ids.has(link.data.target));
  }
  assert.ok(
    records.every((r) => Date.parse(r.created_at) > Date.now() - 86400000),
  );
  assert.equal(
    (await call(`${root}/records`, "GET", undefined, cb)).status,
    404,
  );
  assert.equal((await call("/admin/users", "GET", undefined, ca)).status, 403);
  const body = { kind: "journal", data: journal };
  assert.equal(
    (await call(`${root}/records`, "POST", body, { ...ca, csrf: "wrong" }))
      .status,
    403,
  );
  const written = await call(`${root}/records`, "POST", body, ca);
  assert.equal(written.status, 201);
  assert.ok(
    (await call(`${root}/records`, "GET", undefined, ca)).data.some(
      (r) => r.id === written.data.id,
    ),
  );
  const draft = {
    name: "EX nouveau dossier",
    mode: "exercise",
    nature: "Inondation",
    level: 2,
    location: "Genève",
    commander: "Conduite fictive",
    phase: "Évaluation initiale",
  };
  assert.equal(
    (await call("/operations", "POST", { ...draft, mode: "real" }, ca)).status,
    403,
  );
  const empty = await call("/operations", "POST", draft, ca);
  assert.equal(empty.status, 201);
  assert.deepEqual(
    (await call(`/operations/${empty.data.id}/records`, "GET", undefined, ca))
      .data,
    [],
  );
  assert.equal((await call("/operations", "POST", draft, ca)).status, 201);
  assert.equal((await call("/operations", "POST", draft, ca)).status, 409);
  const expiry = (
    await db.query("SELECT access_expires_at FROM users WHERE id=$1", [
      a.data.user.id,
    ])
  ).rows[0].access_expires_at;
  assert.equal(new Date(expiry).toISOString(), config.previewExpiresAt);
  await call("/logout", "POST", {}, ca);
  assert.equal((await call("/operations", "GET", undefined, ca)).status, 401);
  const fresh = await start();
  assert.equal(fresh.status, 201);
  assert.notEqual(fresh.data.user.id, a.data.user.id);
});

test("Name-only entry validates scope, name, origin, expiry, capacity and rate limits", async (t) => {
  const { db, call, config } = await fixture(t, true, true);
  const valid = { name: "É", syntheticOnly: true };
  for (const body of [
    { ...valid, name: "   " },
    { ...valid, name: "a".repeat(81) },
    { ...valid, name: "Alex\u0000test" },
    { ...valid, name: "Alex\u202Etest" },
    { ...valid, syntheticOnly: false },
    { name: "Alex" },
    { ...valid, role: "admin" },
  ])
    assert.equal((await call("/preview/start", "POST", body)).status, 400);
  assert.equal(
    (
      await call("/preview/start", "POST", valid, undefined, {
        Origin: "https://other.invalid",
      })
    ).status,
    403,
  );
  assert.equal(
    Number(
      (
        await db.query(
          "SELECT COUNT(*) AS count FROM users WHERE access_expires_at IS NOT NULL",
        )
      ).rows[0].count,
    ),
    0,
  );
  for (let i = 0; i < 99; i++)
    await db.query(
      "INSERT INTO users(id,email,name,role,password_hash,access_expires_at) VALUES($1,$2,$3,$4,$5,$6)",
      [
        crypto.randomUUID(),
        `capacity-${i}@preview.invalid`,
        "Capacité",
        "command",
        "invitation-only",
        config.previewExpiresAt,
      ],
    );
  const concurrent = await Promise.all([
    call("/preview/start", "POST", valid),
    call("/preview/start", "POST", valid),
  ]);
  assert.deepEqual(concurrent.map((r) => r.status).sort(), [201, 409]);
  assert.equal(
    Number(
      (
        await db.query(
          "SELECT COUNT(*) AS count FROM users WHERE access_expires_at IS NOT NULL",
        )
      ).rows[0].count,
    ),
    100,
  );
  let limited;
  for (let i = 0; i < 12; i++)
    limited = await call("/preview/start", "POST", valid);
  assert.equal(limited.status, 429);
  config.previewExpiresAt = new Date(Date.now() - 1000).toISOString();
  assert.equal((await call("/preview/start", "POST", valid)).status, 410);
});

test("Name-only preview is unavailable in the local administrator demo", async (t) => {
  const { call } = await fixture(t);
  assert.equal(
    (
      await call("/preview/start", "POST", {
        name: "Alex",
        syntheticOnly: true,
      })
    ).status,
    401,
  );
});
