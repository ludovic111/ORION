import { test } from "node:test";
import assert from "node:assert/strict";
import { mapTile, tileSource } from "../server/map-tiles.mjs";
import { loadConfig } from "../server/config.mjs";
test("institutional maps require an explicit opt-in for external requests", async () => {
  const names = ["APP_MODE", "NODE_ENV", "APP_KEY", "APP_ORIGIN", "MAP_ONLINE"];
  const previous = Object.fromEntries(
    names.map((name) => [name, process.env[name]]),
  );
  try {
    Object.assign(process.env, {
      APP_MODE: "institution",
      NODE_ENV: "production",
      APP_KEY: "a".repeat(64),
      APP_ORIGIN: "https://orion.example",
    });
    delete process.env.MAP_ONLINE;
    assert.equal((await loadConfig()).mapOnline, false);
    process.env.MAP_ONLINE = "true";
    assert.equal((await loadConfig()).mapOnline, true);
    process.env.MAP_ONLINE = "false";
    assert.equal((await loadConfig()).mapOnline, false);
  } finally {
    for (const name of names) {
      if (previous[name] === undefined) delete process.env[name];
      else process.env[name] = previous[name];
    }
  }
});
const tilePath = (mode, z, lat = 46.185, lng = 6.14) => {
  const x = Math.floor(((lng + 180) / 360) * 2 ** z);
  const y = Math.floor(
    ((1 - Math.asinh(Math.tan((lat * Math.PI) / 180)) / Math.PI) / 2) * 2 ** z,
  );
  return `/basemap/${mode}/${z}/${x}/${y}.jpeg`;
};
test("official tiles support native high zoom including Retina and reject unsupported levels", () => {
  for (const style of ["color", "gray", "aerial"]) {
    const max = style === "aerial" ? 20 : 19;
    for (let z = 11; z <= max; z++)
      assert.match(tileSource(tilePath(style, z)), new RegExp(`/3857/${z}/`));
    assert.equal(tileSource(tilePath(style, max + 1)), null);
  }
});
test("map relay restricts layers, geography and URL shape before any network access", async () => {
  for (const path of [
    tilePath("other", 18),
    tilePath("color", 18, 48.8, 2.3),
    "/basemap/color/18/0/0.jpeg",
    "/basemap/color/18/evil/1.jpeg",
    "/basemap/color/18/1/1.png",
    "/basemap/https://example.com",
    "/basemap/gray/99/1/1.jpeg",
  ]) {
    const result = await mapTile(
      new Request(`https://orion.test${path}`),
      () => {
        throw Error("Unexpected outbound request");
      },
    );
    assert.equal(result.status, 404, path);
  }
});
test("relay strips identifying headers and query, restricts redirects, validates JPEG and bounds cache age", async () => {
  const path = tilePath("color", 18);
  const result = await mapTile(
    new Request(`https://orion.test${path}?token=private`, {
      headers: {
        Cookie: "secret",
        Referer: "private",
        Authorization: "secret",
      },
    }),
    async (url, options) => {
      assert.equal(url, tileSource(path));
      assert.equal(options.headers, undefined);
      assert.equal(options.redirect, "error");
      assert.equal(options.cf.cacheTtl, 3600);
      return new Response(new Uint8Array([255, 216, 255, 0]), {
        headers: { "Content-Type": "image/jpeg", "Set-Cookie": "upstream" },
      });
    },
  );
  assert.equal(result.status, 200);
  assert.equal(result.headers.get("set-cookie"), null);
  assert.equal(result.headers.get("cache-control"), "public, max-age=3600");
  assert.equal((await result.arrayBuffer()).byteLength, 4);
});
test("upstream failure, HTML, forged MIME and oversized bodies fail closed without caching errors", async () => {
  for (const response of [
    new Response("unavailable", { status: 503 }),
    new Response("<html>"),
    new Response("not jpeg", { headers: { "Content-Type": "image/jpeg" } }),
    new Response(new Uint8Array(1_048_577), {
      headers: { "Content-Type": "image/jpeg" },
    }),
  ]) {
    const result = await mapTile(
      new Request(`https://orion.test${tilePath("gray", 18)}`),
      async () => response,
    );
    assert.equal(result.status, 503);
    assert.equal(result.headers.get("cache-control"), "no-store");
  }
  assert.equal(
    (
      await mapTile(
        new Request(`https://orion.test${tilePath("gray", 18)}`),
        async () => {
          throw Error("timeout");
        },
      )
    ).status,
    503,
  );
});
test("tile relay is read only and supports HEAD without a body", async () => {
  const url = `https://orion.test${tilePath("aerial", 20)}`;
  assert.equal(
    (await mapTile(new Request(url, { method: "POST" }))).status,
    405,
  );
  const result = await mapTile(
    new Request(url, { method: "HEAD" }),
    async () =>
      new Response(new Uint8Array([255, 216, 255]), {
        headers: { "Content-Type": "image/jpeg" },
      }),
  );
  assert.equal(result.status, 200);
  assert.equal(await result.text(), "");
});
