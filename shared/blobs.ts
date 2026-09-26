import { sha256 } from "./hash.ts";

// Content-addressed store of the images of a journal (custom map symbols,
// up to 600 KB each). An image is kept once in journal.blobs, under the
// SHA-256 of its data URL, whatever the number of versions of the symbol
// that show it. History states and stored or transmitted symbols refer to
// it as "blob:<sha256>"; in memory, live symbols carry the data URL itself
// (the same string as in the store, not a copy), so the modules display
// them directly.

export const DATA_IMAGE =
  /^data:image\/(png|svg\+xml|jpeg|webp);base64,[A-Za-z0-9+/=]+$/;
export const BLOB_REF = /^blob:[0-9a-f]{64}$/;
export const BLOB_KEY = /^[0-9a-f]{64}$/;

/** Fields holding an image, by history scope. */
export const IMAGE_FIELDS: Record<string, string[]> = {
  "ops.symbols": ["image"],
};

export type Blobs = Record<string, string>;
export const blobKey = (dataUrl: string) => sha256(dataUrl);
export const refOf = (dataUrl: string) => `blob:${blobKey(dataUrl)}`;
const keyOfRef = (ref: string) => ref.slice(5);

/** A record state with its inline images replaced by references. */
export function internState(
  scope: string,
  state: unknown,
  blobs: Blobs,
): unknown {
  const fields = IMAGE_FIELDS[scope];
  if (!fields || !state || typeof state !== "object") return state;
  let out: Record<string, unknown> | null = null;
  for (const f of fields) {
    const value = (state as Record<string, unknown>)[f];
    if (typeof value !== "string" || !value.startsWith("data:")) continue;
    const key = blobKey(value);
    blobs[key] = blobs[key] ?? value;
    out = out ?? { ...(state as Record<string, unknown>) };
    out[f] = `blob:${key}`;
  }
  return out ?? state;
}

/** A record state with its image references replaced by the images. */
export function resolveState(
  scope: string,
  state: unknown,
  blobs: Blobs,
): unknown {
  const fields = IMAGE_FIELDS[scope];
  if (!fields || !state || typeof state !== "object") return state;
  let out: Record<string, unknown> | null = null;
  for (const f of fields) {
    const value = (state as Record<string, unknown>)[f];
    if (typeof value !== "string" || !BLOB_REF.test(value)) continue;
    const image = blobs[keyOfRef(value)];
    if (!image) continue;
    out = out ?? { ...(state as Record<string, unknown>) };
    out[f] = image;
  }
  return out ?? state;
}

/** Keys of the images a state refers to (or holds inline). */
export function blobsOf(scope: string, state: unknown, into: Set<string>) {
  const fields = IMAGE_FIELDS[scope];
  if (!fields || !state || typeof state !== "object") return;
  for (const f of fields) {
    const value = (state as Record<string, unknown>)[f];
    if (typeof value !== "string") continue;
    if (BLOB_REF.test(value)) into.add(keyOfRef(value));
    else if (value.startsWith("data:")) into.add(blobKey(value));
  }
}
