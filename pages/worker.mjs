import { sourceDownload } from "../server/cloudflare/source-download.mjs";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    // Deployment aliases must never expose the production API or invitation tokens.
    if (url.origin !== env.PUBLIC_ORIGIN) {
      return new Response(
        "Utilisez l’adresse officielle de cette démonstration ORION.",
        {
          status: 404,
          headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" },
        },
      );
    }
    if (url.pathname === "/api" || url.pathname.startsWith("/api/")) {
      return env.ORION_API.fetch(request);
    }
    if (url.pathname === "/source/orion-source.tar.gz") {
      if (!["GET", "HEAD"].includes(request.method))
        return new Response(null, {
          status: 405,
          headers: { Allow: "GET, HEAD" },
        });
      return sourceDownload(request, env.ASSETS);
    }
    return env.ASSETS.fetch(request);
  },
};
