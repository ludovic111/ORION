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
