import { DurableObject } from "cloudflare:workers";
import { httpServerHandler } from "cloudflare:node";
import { createServer } from "node:http";
import { createApp } from "../app.mjs";
import { seedDemo } from "../seed.mjs";
import { hostedPreviewConfig } from "../hosted-preview-config.mjs";
import { sqliteDatabase } from "./database.mjs";
import { sourceDownload } from "./source-download.mjs";
import { rateLimitStore } from "./rate-limit.mjs";
import { mapTile } from "../map-tiles.mjs";
import schema from "./schema.sql";
import symbolCatalog from "../../public/symbols/catalog.json";

export class OrionDemo extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    ctx.blockConcurrencyWhile(async () => {
      const config = hostedPreviewConfig(env);
      ctx.storage.sql.exec(schema);
      ctx.storage.sql.exec(
        "CREATE TABLE IF NOT EXISTS request_limits(key TEXT PRIMARY KEY,hits INTEGER NOT NULL,expires_at INTEGER NOT NULL)",
      );
      const db = sqliteDatabase(ctx.storage);
      await seedDemo(db, { symbolCatalog, invitationOnly: true });
      const app = await createApp(db, {
        ...config,
        symbolCatalog,
        clientIpHeader: "x-orion-client-ip",
        rateLimitStore: (name) => rateLimitStore(ctx.storage, name),
      });
      this.handler = httpServerHandler(createServer(app));
    });
  }
  async fetch(request) {
    return this.handler.fetch(request);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/basemap/")) return mapTile(request);
    if (url.pathname.startsWith("/api/")) {
      const headers = new Headers(request.headers);
      headers.set(
        "x-orion-client-ip",
        request.headers.get("cf-connecting-ip") || "127.0.0.1",
      );
      headers.delete("x-forwarded-for");
      return env.ORION_DEMO.getByName("demo-v1").fetch(
        new Request(request, { headers }),
      );
    }
    if (url.pathname === "/source/orion-source.tar.gz")
      return sourceDownload(request, env.ASSETS);
    return env.ASSETS.fetch(request);
  },
};
