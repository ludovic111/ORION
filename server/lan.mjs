import { createServer } from "node:https";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { networkInterfaces } from "node:os";
import { handle } from "./app.mjs";
import { attachRelay } from "./relay.mjs";

// Local network mode: one computer serves orion aic over HTTPS on the Wi-Fi
// or cable network; the other posts open the printed address. Works without
// internet. The certificate is self-signed: each browser asks once to accept
// it (Web Crypto requires HTTPS outside localhost).

const port = Number(process.env.PORT || 4443);
const addresses = Object.values(networkInterfaces())
  .flat()
  .filter((a) => a && a.family === "IPv4" && !a.internal)
  .map((a) => a.address);

async function certificate() {
  const dir = ".lan";
  const cached = `${dir}/certificate.json`;
  try {
    const saved = JSON.parse(await readFile(cached, "utf8"));
    if (addresses.every((a) => saved.addresses.includes(a))) return saved;
  } catch {}
  const { generate } = await import("selfsigned");
  const notAfterDate = new Date();
  notAfterDate.setFullYear(notAfterDate.getFullYear() + 2);
  const pems = await generate(
    [{ name: "commonName", value: "orion aic local" }],
    {
      keyType: "ec",
      algorithm: "sha256",
      notAfterDate,
      extensions: [
        {
          name: "subjectAltName",
          altNames: [
            { type: 2, value: "localhost" },
            { type: 7, ip: "127.0.0.1" },
            ...addresses.map((ip) => ({ type: 7, ip })),
          ],
        },
      ],
    },
  );
  const saved = {
    key: pems.private,
    cert: pems.cert,
    fingerprint: pems.fingerprint,
    addresses,
  };
  await mkdir(dir, { recursive: true });
  await writeFile(cached, JSON.stringify(saved), { mode: 0o600 });
  return saved;
}

const { key, cert, fingerprint } = await certificate();
const server = createServer({ key, cert }, handle);
attachRelay(server);
server.listen(port, "0.0.0.0", () => {
  console.log("\n  orion aic · réseau local\n");
  console.log(`  Ce poste      https://localhost:${port}`);
  for (const a of addresses)
    console.log(`  Autres postes https://${a}:${port}`);
  console.log(`\n  Empreinte du certificat : ${fingerprint}`);
  console.log(
    "  Au premier accès, le navigateur signale un certificat non reconnu :",
  );
  console.log("  vérifier l’empreinte puis continuer. Ctrl+C pour arrêter.\n");
});
