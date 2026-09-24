import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { execFileSync } from "node:child_process";
await mkdir("public/source", { recursive: true });
// Explicit allowlist: no local databases, recovery files, certificates,
// credentials or user documents.
execFileSync(
  "tar",
  [
    "-czf",
    "public/source/orion-aic-source.tar.gz",
    ...[
      "src",
      "shared",
      "server",
      "scripts",
      "tests",
      "docs",
      "package.json",
      "package-lock.json",
      "tsconfig.json",
      "vite.config.ts",
      "index.html",
      "README.md",
      "LICENSE",
      "SECURITY.md",
      "THIRD_PARTY_NOTICES.md",
      "Dockerfile",
      ".github/workflows",
      "public/_headers",
      "public/orion.svg",
      "public/icon-192.png",
      "public/icon-512.png",
      "public/icon-maskable-512.png",
      "public/apple-touch-icon.png",
      "public/manifest.webmanifest",
      "public/fonts",
      "public/symbols",
    ].filter((path) => existsSync(path)),
  ],
  { stdio: "inherit" },
);
