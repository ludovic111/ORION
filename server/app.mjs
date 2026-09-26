import { readFile, stat } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";

// Static files of the built application. The server stores nothing: every
// write (POST, PUT…) is refused and journal contents never reach it.
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
// Map tiles (swisstopo, geo.admin.ch overlays), weather (Open-Meteo), place
// search, elevation profiles and feature info (api3.geo.admin.ch) and live
// hydrology / MeteoSwiss data (data.geo.admin.ch) are optional services
// queried from the browser on demand. The map tiles are listed in
// connect-src too: the service worker fetches them (to keep them offline)
// and a worker's fetch() is governed by connect-src, not img-src. Without
// it every tile fails and the map claims to be offline.
export const MAP_ORIGINS =
  "https://wmts.geo.admin.ch https://wms.geo.admin.ch https://tile.openstreetmap.org";
export const API_ORIGINS =
  "https://api.open-meteo.com https://api3.geo.admin.ch https://data.geo.admin.ch";
/**
 * Content security policy. Over HTTPS the relay is reached with wss:// only
 * and any http:// sub-request is upgraded, so browsers never flag the page
 * as "not secure".
 */
export function contentSecurityPolicy(host = "", secure = false) {
  const sockets = host
    ? secure
      ? ` wss://${host}`
      : ` wss://${host} ws://${host}`
    : "";
  return `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: ${MAP_ORIGINS}; connect-src 'self'${sockets} ${API_ORIGINS} ${MAP_ORIGINS}; font-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'; worker-src 'self'${secure ? "; upgrade-insecure-requests" : ""}`;
}

export async function handle(req, res) {
  // Behind the hosting proxy (Railway), TLS ends at the proxy.
  const proxied = String(req.headers["x-forwarded-proto"] ?? "")
    .split(",")[0]
    .trim();
  const secure = proxied === "https" || !!req.socket?.encrypted;
  res.setHeader(
    "Content-Security-Policy",
    contentSecurityPolicy(req.headers.host, secure),
  );
  // Public site: browsers must always come back over HTTPS (not sent on the
  // local-network server, whose certificate is self-signed).
  if (proxied === "https")
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains",
    );
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader(
    "Permissions-Policy",
    "camera=(self), microphone=(), geolocation=(self), payment=(), usb=()",
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
    if (path === "/healthz") {
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.setHeader("Cache-Control", "no-store");
      res.writeHead(200);
      res.end("ok");
      return;
    }
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
}
