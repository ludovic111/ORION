import { cp, mkdir, rm, writeFile } from "node:fs/promises";
await rm("dist-pages", { recursive: true, force: true });
await cp("dist", "dist-pages", { recursive: true });
// A module directory keeps the gateway source identical in tests and deployment.
await mkdir("dist-pages/_worker.js/pages", { recursive: true });
await mkdir("dist-pages/_worker.js/server/cloudflare", { recursive: true });
await cp("pages/worker.mjs", "dist-pages/_worker.js/pages/worker.mjs");
await cp("server/map-tiles.mjs", "dist-pages/_worker.js/server/map-tiles.mjs");
await cp(
  "server/cloudflare/source-download.mjs",
  "dist-pages/_worker.js/server/cloudflare/source-download.mjs",
);
await writeFile(
  "dist-pages/_worker.js/index.js",
  'export { default } from "./pages/worker.mjs";\n',
);
await writeFile(
  "dist-pages/_routes.json",
  JSON.stringify({ version: 1, include: ["/*"], exclude: [] }),
);
