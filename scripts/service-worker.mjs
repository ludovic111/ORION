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
// Application assets are precached. Map tiles and symbols are kept once seen
// (bounded caches) so the map keeps working offline. No journal contents
// ever enter CacheStorage: sessions live in the encrypted IndexedDB only.
await writeFile(
  "dist/sw.js",
  `const CACHE = 'orion-aic-shell-${revision}';
const TILES = 'orion-aic-tiles';
const SYMBOLS = 'orion-aic-symbols';
const FILES = ${JSON.stringify(files)};
const TILE_HOSTS = ['wmts.geo.admin.ch', 'tile.openstreetmap.org'];
const MAX_TILES = 4000;
// A new version takes over at once; the page offers a reload.
self.addEventListener('install', event => { event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', event => { event.waitUntil((async () => { for (const key of await caches.keys()) if ((key.startsWith('orion-shell-') || key.startsWith('orion-aic-shell-')) && key !== CACHE) await caches.delete(key); await self.clients.claim(); })()); });
async function trim(name, max) {
  const cache = await caches.open(name);
  const keys = await cache.keys();
  for (const key of keys.slice(0, Math.max(0, keys.length - max))) await cache.delete(key);
}
async function cacheFirst(name, request, max) {
  const cache = await caches.open(name);
  const hit = await cache.match(request);
  if (hit) return hit;
  const response = await fetch(request);
  // Opaque responses are never stored: they would weigh megabytes each.
  if (response.ok && response.type !== 'opaque') {
    await cache.put(request, response.clone());
    if (max && Math.random() < 0.05) trim(name, max);
  }
  return response;
}
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET') return;
  if (TILE_HOSTS.includes(url.hostname)) {
    event.respondWith(cacheFirst(TILES, event.request, MAX_TILES));
    return;
  }
  if (url.origin !== self.location.origin || url.pathname === '/sync') return;
  if (url.pathname.startsWith('/symbols/')) {
    event.respondWith(cacheFirst(SYMBOLS, event.request));
    return;
  }
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
