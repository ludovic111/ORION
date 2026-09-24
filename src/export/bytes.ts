import { strToU8, zipSync, zlibSync, type Zippable } from "fflate";
import { qrMatrix, qrPath } from "../print/qr.ts";

// Small byte helpers shared by the writers: zip, base64, PNG of a QR code.
// DOM-free so that every writer runs (and is tested) in node as well.

export const XML_HEAD =
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';

/** Zip of text and binary parts, in the order given. */
export function zip(
  parts: Record<string, string | Uint8Array>,
  stored: string[] = [],
): Uint8Array {
  const files: Zippable = {};
  for (const [path, value] of Object.entries(parts)) {
    const data = typeof value === "string" ? strToU8(value) : value;
    files[path] = stored.includes(path) ? [data, { level: 0 }] : data;
  }
  return zipSync(files, { level: 6 });
}

export function base64(bytes: Uint8Array): string {
  let out = "";
  for (let i = 0; i < bytes.length; i += 0x8000)
    out += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(out);
}
export const pngDataUrl = (png: Uint8Array) =>
  `data:image/png;base64,${base64(png)}`;

export function fromDataUrl(url: string): Uint8Array {
  const data = url.slice(url.indexOf(",") + 1);
  return Uint8Array.from(atob(data), (c) => c.charCodeAt(0));
}

const CRC = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();
function crc32(bytes: Uint8Array) {
  let c = 0xffffffff;
  for (const b of bytes) c = CRC[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/** PNG (8-bit grayscale) of a matrix of dark modules. */
export function matrixPng(
  matrix: boolean[][],
  scale = 8,
  margin = 4,
): Uint8Array {
  const size = (matrix.length + margin * 2) * scale;
  const raw = new Uint8Array(size * (size + 1)).fill(255);
  for (let y = 0; y < size; y++) {
    raw[y * (size + 1)] = 0; // filter: none
    const r = Math.floor(y / scale) - margin;
    for (let x = 0; x < size; x++) {
      const c = Math.floor(x / scale) - margin;
      if (matrix[r]?.[c]) raw[y * (size + 1) + 1 + x] = 0;
    }
  }
  const chunk = (type: string, data: Uint8Array) => {
    const out = new Uint8Array(12 + data.length);
    const view = new DataView(out.buffer);
    view.setUint32(0, data.length);
    out.set(strToU8(type), 4);
    out.set(data, 8);
    view.setUint32(8 + data.length, crc32(out.subarray(4, 8 + data.length)));
    return out;
  };
  const header = new Uint8Array(13);
  const view = new DataView(header.buffer);
  view.setUint32(0, size);
  view.setUint32(4, size);
  header.set([8, 0, 0, 0, 0], 8);
  const parts = [
    new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", header),
    chunk("IDAT", zlibSync(raw, { level: 9 })),
    chunk("IEND", new Uint8Array()),
  ];
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let at = 0;
  for (const p of parts) {
    out.set(p, at);
    at += p.length;
  }
  return out;
}

export const qrPng = (text: string) => matrixPng(qrMatrix(text));

/** Inline SVG of a QR code (dark modules only, with a quiet zone). */
export function qrSvg(text: string, size = 120) {
  const matrix = qrMatrix(text);
  const n = matrix.length + 8;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-4 -4 ${n} ${n}" width="${size}" height="${size}" shape-rendering="crispEdges" role="img" aria-label="Code QR de vérification"><rect x="-4" y="-4" width="${n}" height="${n}" fill="#fff"/><path d="${qrPath(matrix)}" fill="#000"/></svg>`;
}

/** Width and height of a PNG, read from its header. */
export function pngSize(png: Uint8Array): { width: number; height: number } {
  const view = new DataView(png.buffer, png.byteOffset, png.byteLength);
  return { width: view.getUint32(16), height: view.getUint32(20) };
}
