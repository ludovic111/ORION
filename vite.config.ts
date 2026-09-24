import { defineConfig, type Plugin } from "vite";
// @ts-expect-error plain JavaScript server module
import { attachRelay } from "./server/relay.mjs";

// The synchronisation relay also runs on the development server.
const relay = (): Plugin => ({
  name: "orion-aic-relay",
  configureServer(server) {
    if (server.httpServer) attachRelay(server.httpServer, { shared: true });
  },
});

export default defineConfig({
  plugins: [relay()],
  server: { host: "127.0.0.1", port: 4311 },
  preview: { host: "127.0.0.1", port: 4311 },
  build: { target: "es2022" },
});
