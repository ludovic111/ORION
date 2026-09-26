// Offline sectors: an area downloaded on purpose, over a zoom range and a
// few backgrounds, kept in its own cache that the service worker never
// trims. The list lives on this post (the tiles are the post's, not the
// operation's).

import {
  SECTOR_PREFIX,
  tileCount,
  tilesOf,
  tileUrl,
  type Bounds,
} from "./tilecache";

export type SectorLayer = { key: string; label: string; url: string };
export type Sector = {
  id: string;
  name: string;
  bounds: Bounds;
  zMin: number;
  zMax: number;
  layers: SectorLayer[];
  tiles: number;
  bytes: number;
  failed: number;
  at: number;
  complete: boolean;
};
export type Progress = {
  done: number;
  total: number;
  failed: number;
  bytes: number;
};

const KEY = "orion.map.sectors";
export const MAX_SECTOR_TILES = 60000;

export function listSectors(): Sector[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(v)
      ? v.filter((s) => s && typeof s.id === "string")
      : [];
  } catch {
    return [];
  }
}
function saveSectors(list: Sector[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // The tiles are kept anyway; only the list is lost.
  }
}
function tellWorker() {
  navigator.serviceWorker?.controller?.postMessage({
    type: "orion-sectors-changed",
  });
}

export const sectorTiles = (
  bounds: Bounds,
  zMin: number,
  zMax: number,
  layers: number,
) => tileCount(bounds, zMin, zMax) * layers;

/** Ask the browser not to evict the storage of this site. */
export async function persistStorage(): Promise<boolean> {
  try {
    if (await navigator.storage?.persisted?.()) return true;
    return (await navigator.storage?.persist?.()) ?? false;
  } catch {
    return false;
  }
}

export async function storageInfo() {
  try {
    const [estimate, persisted] = await Promise.all([
      navigator.storage?.estimate?.(),
      navigator.storage?.persisted?.(),
    ]);
    return {
      usage: estimate?.usage ?? 0,
      quota: estimate?.quota ?? 0,
      persisted: !!persisted,
    };
  } catch {
    return null;
  }
}

/**
 * Download every tile of a sector into its cache. Six requests at a time;
 * a tile that fails is counted and skipped; a full storage stops with a
 * French message. Resolves with the sector as saved.
 */
export async function downloadSector(
  draft: Omit<Sector, "id" | "tiles" | "bytes" | "failed" | "at" | "complete">,
  onProgress: (p: Progress) => void,
  signal: AbortSignal,
): Promise<Sector> {
  if (typeof caches === "undefined")
    throw new Error(
      "Ce navigateur ne permet pas de garder des cartes hors ligne.",
    );
  const id = crypto.randomUUID();
  const total = sectorTiles(
    draft.bounds,
    draft.zMin,
    draft.zMax,
    draft.layers.length,
  );
  if (total > MAX_SECTOR_TILES)
    throw new Error(
      `Trop de tuiles (${total.toLocaleString("fr-CH")}) : réduisez la zone ou le zoom maximal.`,
    );
  void persistStorage();
  const cache = await caches.open(SECTOR_PREFIX + id);
  const sector: Sector = {
    ...draft,
    id,
    tiles: 0,
    bytes: 0,
    failed: 0,
    at: Date.now(),
    complete: false,
  };
  saveSectors([...listSectors(), sector]);
  const queue = (function* () {
    for (const layer of draft.layers)
      for (const [z, x, y] of tilesOf(draft.bounds, draft.zMin, draft.zMax))
        yield tileUrl(layer.url, z, x, y);
  })();
  const progress: Progress = { done: 0, total, failed: 0, bytes: 0 };
  let full: Error | null = null;
  let last = 0;
  const report = () => {
    const now = Date.now();
    if (now - last > 120 || progress.done === total) {
      last = now;
      onProgress({ ...progress });
    }
  };
  const worker = async () => {
    for (let next = queue.next(); !next.done; next = queue.next()) {
      if (signal.aborted || full) return;
      const url = next.value;
      try {
        if (!(await cache.match(url))) {
          // "no-store": the service worker hands the tile over without
          // keeping a second copy in its browsing cache.
          const response = await fetch(url, {
            cache: "no-store",
            mode: "cors",
            signal,
          });
          if (!response.ok) throw new Error(String(response.status));
          const blob = await response.blob();
          await cache.put(
            url,
            new Response(blob, {
              headers: {
                "content-type":
                  response.headers.get("content-type") ?? "image/png",
              },
            }),
          );
          progress.bytes += blob.size;
        }
        progress.done++;
      } catch (err) {
        if (signal.aborted) return;
        const e = err as Error;
        if (e.name === "QuotaExceededError" || /quota/i.test(e.message)) {
          full = new Error(
            "Espace de stockage plein : supprimez un secteur ou réduisez la zone.",
          );
          return;
        }
        progress.done++;
        progress.failed++;
      }
      report();
    }
  };
  await Promise.all(Array.from({ length: 6 }, worker));
  onProgress({ ...progress });
  const saved: Sector = {
    ...sector,
    tiles: progress.done - progress.failed,
    bytes: progress.bytes,
    failed: progress.failed,
    complete: !signal.aborted && !full && progress.failed === 0,
  };
  saveSectors(listSectors().map((s) => (s.id === id ? saved : s)));
  tellWorker();
  if (full) throw full;
  return saved;
}

export async function deleteSector(id: string) {
  try {
    await caches.delete(SECTOR_PREFIX + id);
  } catch {
    // Already gone.
  }
  saveSectors(listSectors().filter((s) => s.id !== id));
  tellWorker();
}

export function formatBytes(n: number) {
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} ko`;
  if (n < 1024 ** 3)
    return `${(n / 1024 / 1024).toLocaleString("fr-CH", { maximumFractionDigits: 1 })} Mo`;
  return `${(n / 1024 ** 3).toLocaleString("fr-CH", { maximumFractionDigits: 2 })} Go`;
}
