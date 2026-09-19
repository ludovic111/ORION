const layers = {
  color: { name: "ch.swisstopo.pixelkarte-farbe", max: 19 },
  gray: { name: "ch.swisstopo.pixelkarte-grau", max: 19 },
  aerial: { name: "ch.swisstopo.swissimage", max: 20 },
};
const column = (lng, z) => Math.floor(((lng + 180) / 360) * 2 ** z);
const row = (lat, z) =>
  Math.floor(
    ((1 - Math.asinh(Math.tan((lat * Math.PI) / 180)) / Math.PI) / 2) * 2 ** z,
  );
export function tileSource(path) {
  const match =
    /^\/basemap\/(color|gray|aerial)\/(\d{2})\/(\d{1,7})\/(\d{1,7})\.jpeg$/.exec(
      path,
    );
  if (!match) return null;
  const [, style, zs, xs, ys] = match;
  const [z, x, y] = [zs, xs, ys].map(Number);
  const layer = layers[style];
  if (
    z < 11 ||
    z > layer.max ||
    x < column(5.895, z) ||
    x > column(6.355, z) ||
    y < row(46.405, z) ||
    y > row(46.095, z)
  )
    return null;
  return `https://wmts.geo.admin.ch/1.0.0/${layer.name}/default/current/3857/${z}/${x}/${y}.jpeg`;
}
const unavailable = () =>
  new Response("Fond cartographique indisponible", {
    status: 503,
    headers: { "Cache-Control": "no-store" },
  });
export async function mapTile(request, fetchTile = fetch) {
  if (!["GET", "HEAD"].includes(request.method))
    return new Response(null, { status: 405, headers: { Allow: "GET, HEAD" } });
  const source = tileSource(new URL(request.url).pathname);
  if (!source) return new Response(null, { status: 404 });
  try {
    // Reconstruct a fixed official URL without copying request headers or query parameters.
    const response = await fetchTile(source, {
      redirect: "error",
      signal: AbortSignal.timeout(8000),
      cf: { cacheEverything: true, cacheTtl: 3600 },
    });
    if (
      !response.ok ||
      !response.headers.get("content-type")?.startsWith("image/jpeg")
    ) {
      await response.body?.cancel();
      return unavailable();
    }
    const reader = response.body.getReader(),
      chunks = [];
    let size = 0;
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 1_048_576) {
        await reader.cancel();
        return unavailable();
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.length;
    }
    if (bytes[0] !== 255 || bytes[1] !== 216 || bytes[2] !== 255)
      return unavailable();
    return new Response(request.method === "HEAD" ? null : bytes, {
      headers: {
        "Content-Type": "image/jpeg",
        "Content-Length": String(size),
        "Cache-Control": "public, max-age=3600",
        "X-Content-Type-Options": "nosniff",
        "Referrer-Policy": "no-referrer",
      },
    });
  } catch {
    return unavailable();
  }
}
