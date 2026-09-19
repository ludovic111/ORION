import { mkdir } from "node:fs/promises";
import { execFileSync } from "node:child_process";
await mkdir("public/source", { recursive: true });
// Explicit allowlist keeps deployment secrets, local databases and user files out of the download.
execFileSync(
  "tar",
  [
    "-czf",
    "public/source/orion-source.tar.gz",
    "--exclude=__pycache__",
    "src",
    "server",
    "scripts",
    "tests",
    "docs",
    "package.json",
    "package-lock.json",
    "tsconfig.json",
    "index.html",
    "README.md",
    "LICENSE",
    "SECURITY.md",
    "THIRD_PARTY_NOTICES.md",
    "Dockerfile",
    "compose.yaml",
    ".env.example",
    ".gitignore",
    ".gitattributes",
    ".dockerignore",
    ".github",
    "public/orion.svg",
    "public/import-example.json",
    "public/fonts",
    "public/symbols",
    "public/tiles",
  ],
  { stdio: "inherit" },
);
