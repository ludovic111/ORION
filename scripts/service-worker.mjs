import { readdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { stripTypeScriptTypes } from "node:module";
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
// The tile rules (buckets, budgets, least-recently-used eviction, shell
// versions kept) are plain functions shared with the page and the tests:
// inlined here without their types and exports.
const rules = stripTypeScriptTypes(
  await readFile("src/modules/map/tilecache.ts", "utf8"),
).replace(/^export /gm, "");
// Application assets are precached. Map tiles and symbols are kept once seen
// (bounded caches) so the map keeps working offline; offline sectors
// downloaded on purpose are never trimmed. No journal contents ever enter
// CacheStorage: sessions live in the encrypted IndexedDB only.
await writeFile(
  "dist/sw.js",
  `const CACHE = 'orion-aic-shell-${revision}';
const META = 'orion-aic-meta';
const SYMBOLS = 'orion-aic-symbols';
const LIVE = 'orion-aic-live';
const LIVE_HOSTS = ['data.geo.admin.ch'];
const FILES = ${JSON.stringify(files)};
${rules}
// A new version takes over at once; the page offers a reload. The shells of
// the previous versions stay (see shellPlan): a tab opened before the
// update keeps loading its own code-split chunks.
self.addEventListener('install', event => { event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', event => { event.waitUntil((async () => {
  try {
    const meta = await caches.open(META);
    let history = [];
    try { const hit = await meta.match('/__shells'); if (hit) history = await hit.json(); } catch {}
    if (!Array.isArray(history)) history = [];
    const plan = shellPlan(history, CACHE, await caches.keys());
    for (const name of plan.remove) await caches.delete(name);
    await meta.put('/__shells', new Response(JSON.stringify(plan.history), { headers: { 'content-type': 'application/json' } }));
  } catch {}
  await self.clients.claim();
})()); });

let sectorList = null;
let sectorAt = 0;
async function sectors() {
  if (!sectorList || Date.now() - sectorAt > 30000) {
    sectorList = (await caches.keys()).filter(n => n.startsWith(SECTOR_PREFIX));
    sectorAt = Date.now();
  }
  return sectorList;
}
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'orion-sectors-changed') sectorList = null;
});
// A tap on an alert (phones notify through the worker): bring a tab of the
// app forward and let it open the item the alert is about.
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const tag = event.notification.tag;
  event.waitUntil((async () => {
    const tabs = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const tab = tabs.find(c => 'focus' in c);
    if (tab) {
      await tab.focus();
      tab.postMessage({ type: 'orion-notification-click', tag });
    } else if (self.clients.openWindow) {
      await self.clients.openWindow('/');
    }
  })());
});
async function stamped(response) {
  const headers = new Headers(response.headers);
  headers.set(STAMP_HEADER, String(Date.now()));
  return new Response(await response.blob(), { status: response.status, statusText: response.statusText, headers });
}
const added = {};
async function trim(bucket, max) {
  const cache = await caches.open(LRU_PREFIX + bucket);
  const keys = (await cache.keys()).map(k => k.url);
  for (const url of evictionPlan(keys, max)) await cache.delete(url);
}
// A full storage never breaks the map: the tile is shown anyway and the
// bucket is halved.
async function keep(bucket, request, response) {
  const budget = TILE_BUDGETS[bucket] || 1000;
  try {
    await (await caches.open(LRU_PREFIX + bucket)).put(request, await stamped(response));
  } catch {
    try { await trim(bucket, Math.floor(budget / 2)); } catch {}
    return;
  }
  added[bucket] = (added[bucket] || 0) + 1;
  if (added[bucket] % 40 === 0) { try { await trim(bucket, budget); } catch {} }
}
async function tile(event) {
  const request = event.request;
  const bucket = tileBucket(request.url) || 'overlay';
  try {
    for (const name of await sectors()) {
      const hit = await (await caches.open(name)).match(request);
      if (hit) return hit;
    }
    const cache = await caches.open(LRU_PREFIX + bucket);
    const hit = await cache.match(request);
    if (hit) {
      // Recently used: back to the recent end of the cache.
      if (needsTouch(hit.headers.get(STAMP_HEADER), Date.now()))
        event.waitUntil(stamped(hit.clone()).then(r => cache.put(request, r)).catch(() => {}));
      return hit;
    }
    if (await caches.has(LEGACY_TILES)) {
      const legacy = await caches.open(LEGACY_TILES);
      const old = await legacy.match(request);
      if (old) {
        event.waitUntil(keep(bucket, request, old.clone()).then(() => legacy.delete(request)).catch(() => {}));
        return old;
      }
    }
  } catch {
    // CacheStorage unavailable: straight to the network.
  }
  const response = await fetch(request);
  // Opaque responses are never stored: they would weigh megabytes each.
  // A sector download (cache: 'no-store') stores its tiles itself.
  if (response.ok && response.type !== 'opaque' && request.cache !== 'no-store')
    event.waitUntil(keep(bucket, request, response.clone()).catch(() => {}));
  return response;
}
// Live data (water levels, measurements): the network first, the last
// copy when offline.
async function live(event) {
  try {
    const response = await fetch(event.request);
    if (response.ok) {
      const copy = response.clone();
      event.waitUntil(caches.open(LIVE).then(c => c.put(event.request, copy)).catch(() => {}));
    }
    return response;
  } catch (err) {
    const hit = await caches.match(event.request, { cacheName: LIVE });
    if (hit) return hit;
    throw err;
  }
}
async function cacheFirst(name, request) {
  const cache = await caches.open(name);
  const hit = await cache.match(request);
  if (hit) return hit;
  const response = await fetch(request);
  if (response.ok && response.type !== 'opaque') {
    try { await cache.put(request, response.clone()); } catch {}
  }
  return response;
}
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET') return;
  if (TILE_HOSTS.includes(url.hostname)) {
    event.respondWith(tile(event));
    return;
  }
  if (LIVE_HOSTS.includes(url.hostname)) {
    event.respondWith(live(event));
    return;
  }
  if (url.origin !== self.location.origin || url.pathname === '/sync') return;
  if (url.pathname.startsWith('/symbols/') && url.pathname.endsWith('.svg')) {
    event.respondWith(cacheFirst(SYMBOLS, event.request));
    return;
  }
  // Pages: network first so an online reload always gets the latest version.
  if ((event.request.mode === 'navigate' && !/\\.[a-z0-9]+$/i.test(url.pathname)) || url.pathname === '/' || url.pathname === '/index.html') {
    event.respondWith(fetch(event.request).catch(async () => (await caches.open(CACHE)).match('/index.html')));
    return;
  }
  // Hashed assets: this version, or a previous one still open in a tab.
  if (!FILES.includes(url.pathname) && !url.pathname.startsWith('/assets/')) return;
  event.respondWith((async () => {
    const hit = (await (await caches.open(CACHE)).match(url.pathname)) || (await caches.match(url.pathname));
    return hit || fetch(event.request);
  })());
});
`,
);
