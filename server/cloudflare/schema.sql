CREATE TABLE IF NOT EXISTS users (
 id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, name TEXT NOT NULL,
 role TEXT NOT NULL CHECK(role IN ('admin','command','chief','operator','viewer')),
 password_hash TEXT NOT NULL, active BOOLEAN NOT NULL DEFAULT TRUE,
 mfa_secret TEXT, mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE, last_totp BIGINT NOT NULL DEFAULT -1,
 failures INTEGER NOT NULL DEFAULT 0, locked_until TEXT, access_expires_at TEXT,
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE TABLE IF NOT EXISTS sessions (
 token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), csrf TEXT NOT NULL,
 authenticated BOOLEAN NOT NULL DEFAULT FALSE,
 expires_at TEXT NOT NULL, last_seen TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE TABLE IF NOT EXISTS operations (
 id TEXT PRIMARY KEY, name TEXT NOT NULL, mode TEXT NOT NULL CHECK(mode IN ('exercise','real')),
 nature TEXT NOT NULL, level INTEGER NOT NULL CHECK(level BETWEEN 1 AND 4), location TEXT NOT NULL,
 commander TEXT NOT NULL, phase TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','closed')),
 version INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE TABLE IF NOT EXISTS memberships (
 operation_id TEXT NOT NULL REFERENCES operations(id), user_id TEXT NOT NULL REFERENCES users(id),
 PRIMARY KEY (operation_id,user_id)
);
CREATE TABLE IF NOT EXISTS records (
 id TEXT PRIMARY KEY, operation_id TEXT NOT NULL REFERENCES operations(id),
 kind TEXT NOT NULL CHECK(kind IN ('journal','resource','map','link','transmission','report','stock')),
 data TEXT NOT NULL, version INTEGER NOT NULL DEFAULT 1, created_by TEXT NOT NULL REFERENCES users(id),
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')), updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 UNIQUE(operation_id,id)
);
CREATE INDEX IF NOT EXISTS records_operation ON records(operation_id,kind,created_at);
CREATE TABLE IF NOT EXISTS audit_lock (id INTEGER PRIMARY KEY CHECK(id=1));
INSERT INTO audit_lock(id) VALUES(1) ON CONFLICT DO NOTHING;
CREATE TABLE IF NOT EXISTS audit (
 seq INTEGER PRIMARY KEY AUTOINCREMENT, id TEXT NOT NULL UNIQUE,
 actor TEXT NOT NULL, action TEXT NOT NULL, operation_id TEXT, target TEXT,
 detail TEXT NOT NULL, at TEXT NOT NULL, previous_hash TEXT NOT NULL, hash TEXT NOT NULL
);
CREATE TRIGGER IF NOT EXISTS audit_no_update BEFORE UPDATE ON audit BEGIN SELECT RAISE(ABORT, 'Audit records are append-only'); END;
CREATE TRIGGER IF NOT EXISTS audit_no_delete BEFORE DELETE ON audit BEGIN SELECT RAISE(ABORT, 'Audit records are append-only'); END;

CREATE TABLE IF NOT EXISTS operation_governance (
 operation_id TEXT PRIMARY KEY REFERENCES operations(id),
 data TEXT NOT NULL, version INTEGER NOT NULL DEFAULT 1,
 reviewed_by TEXT REFERENCES users(id), reviewed_at TEXT,
 updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE TABLE IF NOT EXISTS preview_invitations (
 id TEXT PRIMARY KEY, token_hash TEXT NOT NULL UNIQUE,
 user_id TEXT NOT NULL REFERENCES users(id), label TEXT NOT NULL,
 expires_at TEXT NOT NULL, revoked BOOLEAN NOT NULL DEFAULT FALSE,
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
