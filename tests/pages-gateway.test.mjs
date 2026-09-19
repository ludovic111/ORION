import { test } from "node:test";
import assert from "node:assert/strict";
import gateway from "../pages/worker.mjs";
const PUBLIC_ORIGIN = "https://orion-conduite.pages.dev";

test("Pages aliases cannot reach the production service or leak invitation tokens through redirects", async () => {
  const env = {
    PUBLIC_ORIGIN,
    ORION_API: {
      fetch() {
        throw Error("must not be called");
      },
    },
    ASSETS: {
      fetch() {
        throw Error("must not be called");
      },
    },
  };
  for (const path of [
    "/",
    "/api/session",
    "/api/preview/access?token=private",
    "/source/orion-source.tar.gz",
  ]) {
    const response = await gateway.fetch(
      new Request(`https://hash.orion-conduite.pages.dev${path}`),
      env,
    );
    assert.equal(response.status, 404);
    assert.equal(response.headers.get("location"), null);
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.doesNotMatch(await response.text(), /private/);
  }
});
test("gateway forwards original origin, cookie, CSRF and body through the private binding", async () => {
  const request = new Request(`${PUBLIC_ORIGIN}/api/records`, {
    method: "POST",
    headers: {
      Origin: PUBLIC_ORIGIN,
      Cookie: "session=example",
      "X-CSRF-Token": "csrf",
      "CF-Connecting-IP": "192.0.2.1",
    },
    body: "payload",
  });
  const response = await gateway.fetch(request, {
    PUBLIC_ORIGIN,
    ORION_API: {
      async fetch(received) {
        assert.equal(received, request);
        assert.equal(await received.text(), "payload");
        return new Response("ok", {
          headers: {
            "Set-Cookie": "session=test; Secure; HttpOnly; SameSite=Strict",
          },
        });
      },
    },
  });
  assert.match(response.headers.get("set-cookie"), /Secure; HttpOnly/);
});
test("source download only accepts read methods", async () => {
  const response = await gateway.fetch(
    new Request(`${PUBLIC_ORIGIN}/source/orion-source.tar.gz`, {
      method: "POST",
    }),
    { PUBLIC_ORIGIN },
  );
  assert.equal(response.status, 405);
});
