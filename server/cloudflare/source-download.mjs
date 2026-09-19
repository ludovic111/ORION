export async function sourceDownload(request, assets) {
  const url = new URL(request.url);
  const manifest = await assets.fetch(new URL("/source/manifest.json", url));
  if (!manifest.ok) return new Response("Source indisponible", { status: 503 });
  const { parts, size } = await manifest.json();
  const headers = {
    "Content-Type": "application/gzip",
    "Content-Disposition": 'attachment; filename="orion-source.tar.gz"',
    "Content-Length": String(size),
    "Cache-Control": "public, max-age=300",
    "X-Content-Type-Options": "nosniff",
  };
  if (request.method === "HEAD") return new Response(null, { headers });
  let index = 0,
    reader;
  const stream = new ReadableStream({
    async pull(controller) {
      while (true) {
        if (!reader) {
          if (index === parts.length) {
            controller.close();
            return;
          }
          const response = await assets.fetch(
            new URL(`/source/${parts[index++]}`, url),
          );
          if (!response.ok) throw new Error("Source fragment unavailable");
          reader = response.body.getReader();
        }
        const { done, value } = await reader.read();
        if (done) {
          reader.releaseLock();
          reader = undefined;
        } else {
          controller.enqueue(value);
          return;
        }
      }
    },
    async cancel(reason) {
      await reader?.cancel(reason);
    },
  });
  return new Response(stream, { headers });
}
