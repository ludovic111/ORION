import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
const root = resolve("dist");
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".webmanifest": "application/manifest+json",
  ".gz": "application/gzip",
  ".png": "image/png",
};
const csp =
  "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; font-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'; worker-src 'self'";
const server = createServer(async (req, res) => {
  res.setHeader("Content-Security-Policy", csp);
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader(
    "Permissions-Policy",
    "camera=(self), microphone=(), geolocation=(), payment=(), usb=()",
  );
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405);
    res.end();
    return;
  }
  try {
    const path = decodeURIComponent(
      new URL(req.url, "http://localhost").pathname,
    );
    if (path.startsWith("/api/") || path.includes("\0")) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    const file = resolve(root, `.${path === "/" ? "/index.html" : path}`);
    if (!file.startsWith(root + sep)) {
      res.writeHead(404);
      res.end();
      return;
    }
    if (!(await stat(file)).isFile()) throw new Error("Not a file");
    res.setHeader(
      "Content-Type",
      types[extname(file)] || "application/octet-stream",
    );
    res.setHeader(
      "Cache-Control",
      path.startsWith("/assets/")
        ? "public, max-age=31536000, immutable"
        : "no-cache",
    );
    res.writeHead(200);
    res.end(req.method === "HEAD" ? undefined : await readFile(file));
  } catch {
    res.writeHead(404);
    res.end("Not found");
  }
});
server.listen(
  Number(process.env.PORT || 4311),
  process.env.HOST || "127.0.0.1",
  () =>
    console.log(
      `ORION · http://${process.env.HOST || "127.0.0.1"}:${server.address().port}`,
    ),
);
