import { open, writeFile, unlink } from "node:fs/promises";
const archive = "dist/source/orion-source.tar.gz";
const source = await open(archive);
const chunkSize = 20 * 1024 * 1024;
const parts = [];
let size = 0;
try {
  for (let index = 0; ; index++) {
    const buffer = Buffer.alloc(chunkSize);
    const { bytesRead } = await source.read(
      buffer,
      0,
      chunkSize,
      index * chunkSize,
    );
    if (!bytesRead) break;
    const name = `orion-source.part-${index}`;
    await writeFile(`dist/source/${name}`, buffer.subarray(0, bytesRead));
    parts.push(name);
    size += bytesRead;
  }
} finally {
  await source.close();
}
await writeFile("dist/source/manifest.json", JSON.stringify({ parts, size }));
await unlink(archive);
console.log(
  `Archive source : ${parts.length} fragments, ${size} octets, téléchargement reconstitué en flux.`,
);
