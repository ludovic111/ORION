import { readdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
const files = ["/", "/index.html", "/orion.svg", "/manifest.webmanifest"];
for (const directory of ["assets", "fonts"])
  for (const name of await readdir(`dist/${directory}`))
    files.push(`/${directory}/${name}`);
const revision = createHash("sha256")
  .update(await readFile("dist/index.html"))
  .digest("hex")
  .slice(0, 12);
// Only immutable application assets are cached. No journal contents enter CacheStorage.
await writeFile(
  "dist/sw.js",
  `const CACHE = 'orion-shell-${revision}';
const FILES = ${JSON.stringify(files)};
self.addEventListener('install', event => { event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES))); });
self.addEventListener('activate', event => { event.waitUntil((async () => { for (const key of await caches.keys()) if (key.startsWith('orion-shell-') && key !== CACHE) await caches.delete(key); await self.clients.claim(); })()); });
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || event.request.method !== 'GET' || !FILES.includes(url.pathname)) return;
  event.respondWith(caches.open(CACHE).then(async cache => {
    const hit = await cache.match(url.pathname);
    return hit || fetch(event.request);
  }));
});
`,
);
