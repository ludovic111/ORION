import { readFile, writeFile, mkdir } from "node:fs/promises";
import sharp from "sharp";
const catalog = JSON.parse(
  await readFile("public/symbols/catalog.json", "utf8"),
);
await mkdir("public/symbols/display", { recursive: true });
for (const item of catalog) {
  let source = await readFile(`public/symbols/${item.id}.svg`, "utf8");
  let viewBox = source.match(/viewBox="([^"]+)"/);
  if (!viewBox) {
    const dimensions = await sharp(Buffer.from(source)).metadata();
    source = source.replace(
      "<svg ",
      `<svg viewBox="0 0 ${dimensions.width} ${dimensions.height}" `,
    );
    viewBox = source.match(/viewBox="([^"]+)"/);
  }
  const [vx, vy, vw, vh] = viewBox[1].trim().split(/[ ,]+/).map(Number);
  const { data, info } = await sharp(Buffer.from(source), {
    limitInputPixels: 50000000,
  })
    .resize({ width: 1200, height: 1200, fit: "inside" })
    .flatten({ background: "#ffffff" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  let left = info.width,
    top = info.height,
    right = 0,
    bottom = 0;
  for (let y = 0; y < info.height; y++)
    for (let x = 0; x < info.width; x++) {
      const i = (y * info.width + x) * info.channels;
      if (Math.min(data[i], data[i + 1], data[i + 2]) < 235) {
        left = Math.min(left, x);
        right = Math.max(right, x);
        top = Math.min(top, y);
        bottom = Math.max(bottom, y);
      }
    }
  if (left > right) throw new Error(`Empty symbol: ${item.id}`);
  const padding = Math.max(
    3,
    Math.ceil(Math.max(right - left, bottom - top) * 0.035),
  );
  left = Math.max(0, left - padding);
  top = Math.max(0, top - padding);
  right = Math.min(info.width, right + padding + 1);
  bottom = Math.min(info.height, bottom + padding + 1);
  const box = [
    vx + (left / info.width) * vw,
    vy + (top / info.height) * vh,
    ((right - left) / info.width) * vw,
    ((bottom - top) / info.height) * vh,
  ].map((n) => Number(n.toFixed(4)));
  // Only the viewport changes. Official paths, fills, strokes and embedded images stay byte-for-byte intact.
  const display = source
    .replace(viewBox[0], `viewBox="${box.join(" ")}"`)
    .replace(
      /<svg\b([^>]*)>/,
      (all, attrs) =>
        `<svg${attrs.replace(/\s(?:width|height)="[^"]*"/g, "")}>`,
    );
  await writeFile(`public/symbols/display/${item.id}.svg`, display);
}
console.log(
  `Prepared ${catalog.length} official signs; original files preserved.`,
);
