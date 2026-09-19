import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
// Exercise the same workerd runtime supplied by our pinned Wrangler version.
const require = createRequire(import.meta.url);
const { Miniflare, convertV4MiniflareOptions } = require(
  require.resolve("miniflare", { paths: [require.resolve("wrangler")] }),
);

test("Cloudflare runtime fetches a native tile and rejects redirects without following them", async () => {
  const requests = [];
  const runtime = new Miniflare(
    convertV4MiniflareOptions({
      compatibilityDate: "2026-09-19",
      modules: [
        {
          type: "ESModule",
          path: path.resolve(".data/map-test-entry.mjs"),
          contents:
            'import {mapTile} from "../server/map-tiles.mjs"; export default {fetch: request => mapTile(request)};',
        },
        {
          type: "ESModule",
          path: path.resolve("server/map-tiles.mjs"),
          contents: await readFile("server/map-tiles.mjs", "utf8"),
        },
      ],
      outboundService: async (request) => {
        requests.push(request.url);
        assert.equal(new URL(request.url).hostname, "wmts.geo.admin.ch");
        assert.equal(request.headers.get("cookie"), null);
        if (request.url.includes("pixelkarte-grau"))
          return new Response(null, {
            status: 302,
            headers: { Location: "https://untrusted.invalid" },
          });
        return new Response(new Uint8Array([255, 216, 255, 0]), {
          headers: { "Content-Type": "image/jpeg" },
        });
      },
    }),
  );
  try {
    const response = await runtime.dispatchFetch(
      "https://orion.test/basemap/color/19/271085/186156.jpeg",
      { headers: { Cookie: "private" } },
    );
    assert.equal(
      response.status,
      200,
      response.headers.get("x-orion-map-status"),
    );
    assert.equal((await response.arrayBuffer()).byteLength, 4);
    assert.equal(
      (
        await runtime.dispatchFetch(
          "https://orion.test/basemap/gray/19/271085/186156.jpeg",
        )
      ).status,
      503,
    );
    assert.equal(requests.length, 2);
  } finally {
    await runtime.dispose();
  }
});
