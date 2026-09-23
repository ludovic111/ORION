import { readdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
const files = [
  "/",
  "/index.html",
  "/orion.svg",
  "/manifest.webmanifest",
  "/icon-192.png",
  "/icon-512.png",
  "/icon-maskable-512.png",
  "/apple-touch-icon.png",
];
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
// A new version takes over at once; the page offers a reload.
self.addEventListener('install', event => { event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', event => { event.waitUntil((async () => { for (const key of await caches.keys()) if (key.startsWith('orion-shell-') && key !== CACHE) await caches.delete(key); await self.clients.claim(); })()); });
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || event.request.method !== 'GET') return;
  // Pages: network first so an online reload always gets the latest version.
  if ((event.request.mode === 'navigate' && !/\\.[a-z0-9]+$/i.test(url.pathname)) || url.pathname === '/' || url.pathname === '/index.html') {
    event.respondWith(fetch(event.request).catch(async () => (await caches.open(CACHE)).match('/index.html')));
    return;
  }
  if (!FILES.includes(url.pathname)) return;
  event.respondWith(caches.open(CACHE).then(async cache => {
    const hit = await cache.match(url.pathname);
    return hit || fetch(event.request);
  }));
});
`,
);
