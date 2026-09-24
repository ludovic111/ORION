import type { Journal } from "../../shared/journal";
import type { Deck } from "./deck";
import type { DeckImages } from "./layout";
import { builtin, symbolUrl } from "../modules/map/symbols";
import { qrPng } from "./png";

// Pictures of a deck, drawn in the browser: one image per map slide (map
// renderer of the map module), the official symbols of the legends, and
// the verification QR code of an export.

let names: Map<string, string> | null = null;

/** Names of the map symbols (official catalog and simple markers). */
export async function symbolNames(): Promise<
  (id: string) => string | undefined
> {
  if (!names)
    try {
      const res = await fetch(
        `${import.meta.env.BASE_URL}symbols/catalog.json`,
      );
      const list = res.ok
        ? ((await res.json()) as { id: string; name: string }[])
        : [];
      names = new Map(list.map((s) => [s.id, s.name]));
    } catch {
      names = new Map();
    }
  const known = names;
  return (id) => builtin(id)?.name ?? known.get(id);
}

async function toBytes(blob: Blob) {
  return new Uint8Array(await blob.arrayBuffer());
}

/** An SVG symbol turned into a square PNG. */
async function rasterSymbol(id: string, size = 96) {
  const url = symbolUrl(id);
  if (!url) return null;
  const img = new Image();
  img.decoding = "async";
  img.src = url;
  await img.decode();
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0, size, size);
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/png"),
  );
  return blob
    ? { bytes: await toBytes(blob), width: size, height: size }
    : null;
}

/** Map pictures, keyed by slide id, as data URLs (presentation mode). */
export async function mapPictures(
  journal: Journal,
  deck: Deck,
  // Drawn like a 960 px screen at double density: symbols and labels stay
  // readable once the slide is projected.
  size = { width: 960, height: 540 },
): Promise<Record<string, string>> {
  const { renderMap } = await import("../modules/map/render");
  const out: Record<string, string> = {};
  for (const slide of deck.slides) {
    if (slide.kind !== "map") continue;
    try {
      const image = await renderMap(journal, {
        mapId: slide.mapId || undefined,
        width: size.width,
        height: size.height,
        scale: 2,
        base: slide.base || undefined,
        fit: "objects",
        labels: true,
        // Title at the top, legend on the right, footer at the bottom.
        inset: { top: 115, right: 250, bottom: 85, left: 40 },
      });
      out[slide.id] = image.dataUrl;
    } catch {
      // Tiles out of reach: the slide says the map is missing.
    }
  }
  return out;
}

/** Every picture of a deck file: maps, legend symbols, QR code. */
export async function deckImages(
  journal: Journal,
  deck: Deck,
  qr: string,
): Promise<DeckImages> {
  const images: DeckImages = {};
  const { renderMap } = await import("../modules/map/render");
  const symbols = new Set<string>();
  for (const slide of deck.slides) {
    if (slide.kind !== "map") continue;
    try {
      const image = await renderMap(journal, {
        mapId: slide.mapId || undefined,
        width: 960,
        height: 540,
        scale: 2,
        base: slide.base || undefined,
        fit: "objects",
        labels: true,
        // Title at the top, legend on the right, footer at the bottom.
        inset: { top: 115, right: 250, bottom: 85, left: 40 },
      });
      images[slide.id] = {
        bytes: await toBytes(image.blob),
        width: image.width,
        height: image.height,
      };
    } catch {
      // Left out: the slide says the map is missing.
    }
    for (const layer of slide.legend)
      for (const item of layer.items.slice(0, 4))
        if (item.symbol) symbols.add(item.symbol);
  }
  await Promise.all(
    [...symbols].map(async (id) => {
      try {
        const png = await rasterSymbol(id);
        if (png) images[`sym:${id}`] = png;
      } catch {
        // A missing symbol keeps its coloured mark.
      }
    }),
  );
  if (qr) images.qr = qrPng(qr);
  return images;
}
