import { test } from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import { sqliteQuery, sqliteDatabase } from "../server/cloudflare/database.mjs";
function fixture(t) {
  const engine = new DatabaseSync(":memory:");
  engine.exec("PRAGMA foreign_keys=ON");
  t.after(() => engine.close());
  engine.exec(
    readFileSync(
      new URL("../server/cloudflare/schema.sql", import.meta.url),
      "utf8",
    ),
  );
  return {
    engine,
    db: sqliteDatabase({
      sql: {
        exec: (sql, ...args) => ({
          toArray: () => engine.prepare(sql).all(...args),
        }),
      },
    }),
  };
}
test("Cloudflare parameter adaptation preserves repeated/out-of-order bindings and JSON across hostile strings", (t) => {
  const { db } = fixture(t);
  const cases = [
    "$1",
    "'); DELETE FROM users;--",
    "CURRENT_TIMESTAMP FOR UPDATE",
    "é Genève 🚒",
    '"\\\n',
  ];
  for (let i = 0; i < 100; i++)
    cases.push(String.fromCodePoint(0x100 + i) + cases[i % 5].repeat(i % 5));
  for (const input of cases) {
    const row = db.query("SELECT $2 AS second,$1 AS first,$2 AS again", [
      input,
      JSON.stringify({ input }),
    ]).rows[0];
    assert.deepEqual(
      { ...row },
      {
        second: JSON.stringify({ input }),
        first: input,
        again: JSON.stringify({ input }),
      },
    );
  }
  assert.throws(() => sqliteQuery("SELECT $2", [1]), /Missing SQL parameter/);
  assert.throws(
    () => sqliteQuery("SELECT $1", ["\0"]),
    (error) => error.status === 400,
  );
});
test("Cloudflare timestamps compare instants correctly for session and invitation expiration", (t) => {
  const { db } = fixture(t);
  const old = new Date(Date.now() - 3600000),
    future = new Date(Date.now() + 3600000);
  const row = db.query(
    "SELECT $1<CURRENT_TIMESTAMP AS old,$2>CURRENT_TIMESTAMP AS future,$1<CURRENT_TIMESTAMP-INTERVAL '30 minutes' AS idle",
    [old, future],
  ).rows[0];
  assert.deepEqual({ ...row }, { old: 1, future: 1, idle: 1 });
});
test("Cloudflare SQLite enforces audit append-only, references and JSON/boolean round trips", (t) => {
  const { db, engine } = fixture(t);
  db.query(
    "INSERT INTO users(id,email,name,role,password_hash,active) VALUES($1,$2,$3,$4,$5,$6)",
    ["u", "u@preview.invalid", "Test", "command", "invitation-only", false],
  );
  assert.equal(
    db.query("SELECT active FROM users WHERE id=$1", ["u"]).rows[0].active,
    false,
  );
  assert.throws(
    () =>
      db.query("INSERT INTO memberships(operation_id,user_id) VALUES($1,$2)", [
        "absent",
        "u",
      ]),
    (e) => e.code === "23503",
  );
  const detail = { message: "Exercice Genève", number: 42 };
  db.query(
    "INSERT INTO audit(id,actor,action,detail,at,previous_hash,hash) VALUES($1,$2,$3,$4,$5,$6,$7)",
    [
      "a",
      "u",
      "test",
      JSON.stringify(detail),
      new Date().toISOString(),
      "previous",
      "hash",
    ],
  );
  assert.deepEqual(db.query("SELECT detail FROM audit").rows[0].detail, detail);
  assert.throws(
    () => engine.exec("UPDATE audit SET action='tampered'"),
    /append-only/,
  );
  assert.throws(() => engine.exec("DELETE FROM audit"), /append-only/);
});
