import { test } from "node:test";
import assert from "node:assert/strict";
import { hostedPreviewConfig } from "../server/hosted-preview-config.mjs";
const now = Date.UTC(2026, 8, 19);
const valid = {
  APP_MODE: "hosted-preview",
  DEMO_DATA_ACK: "synthetic-only",
  APP_ORIGIN: "https://orion.example",
  APP_KEY: "a".repeat(64),
  PREVIEW_CONTROL_KEY: "b".repeat(64),
  PREVIEW_EXPIRES_AT: new Date(now + 7 * 86400000).toISOString(),
};
test("Hosted preview requires dedicated keys, explicit synthetic scope, HTTPS and no institutional database", () => {
  const config = hostedPreviewConfig(valid, now);
  assert.equal(config.hostedPreview, true);
  assert.equal(config.realOperationsEnabled, false);
  for (const change of [
    { APP_MODE: "institution" },
    { DEMO_DATA_ACK: "" },
    { DATABASE_URL: "postgresql://institution/private" },
    { APP_ORIGIN: "http://orion.example" },
    { APP_ORIGIN: "https://orion.example/path" },
    { APP_KEY: "weak" },
    { PREVIEW_CONTROL_KEY: valid.APP_KEY },
    { PREVIEW_EXPIRES_AT: new Date(now + 31 * 86400000).toISOString() },
  ])
    assert.throws(() => hostedPreviewConfig({ ...valid, ...change }, now));
});
test("Hosted preview uses a fixed expiry that does not renew on process restart", () => {
  assert.equal(
    hostedPreviewConfig(valid, now).previewExpiresAt,
    hostedPreviewConfig(valid, now + 86400000).previewExpiresAt,
  );
  assert.equal(
    hostedPreviewConfig(valid, now + 10 * 86400000).previewExpiresAt,
    valid.PREVIEW_EXPIRES_AT,
  );
});
