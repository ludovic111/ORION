import { mkdir } from "node:fs/promises";
import { execFileSync } from "node:child_process";
await mkdir("public/source", { recursive: true });
// Explicit allowlist: no local databases, recovery files, credentials, or user documents.
execFileSync(
  "tar",
  [
    "-czf",
    "public/source/orion-source.tar.gz",
    "--exclude=.wrangler",
    "src",
    "shared",
    "server",
    "scripts",
    "tests",
    "docs",
    "pages/wrangler.jsonc",
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
    "public/manifest.webmanifest",
    "public/fonts",
  ],
  { stdio: "inherit" },
);
