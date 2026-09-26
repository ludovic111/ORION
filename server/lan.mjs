import { createServer } from "node:https";
import { X509Certificate } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { networkInterfaces } from "node:os";
import { parseArgs } from "node:util";
import { handle } from "./app.mjs";
import { attachRelay } from "./relay.mjs";
import { ansiQr, terminalQr } from "./terminal-qr.mjs";

// Local network mode: one computer serves orion aic over HTTPS on the Wi-Fi
// or cable network; the other posts open the printed address. Works without
// internet. The certificate is self-signed: each browser asks once to accept
// it (Web Crypto requires HTTPS outside localhost).
//
//   node server/lan.mjs [--port 4443] [--no-qr]
//
// `npm run lan` builds first; `npm run lan:serve` (or a systemd unit) serves
// the existing dist/ at once.

const { values: options } = parseArgs({
  options: {
    port: { type: "string" },
    "no-qr": { type: "boolean", default: false },
  },
  strict: false,
});
const wanted =
  (typeof options.port === "string" && options.port) || process.env.PORT;
const port = Number(wanted || 4443);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  console.error(`\n  Port invalide : ${wanted}\n`);
  process.exit(1);
}
if (!existsSync("dist/index.html")) {
  console.error(
    "\n  Application non construite (dist/ absent) : lancer d’abord npm run build,\n  ou npm run lan qui construit puis démarre.\n",
  );
  process.exit(1);
}

const addresses = Object.values(networkInterfaces())
  .flat()
  .filter((a) => a && a.family === "IPv4" && !a.internal)
  .map((a) => a.address);

// Still valid in a week: an expired certificate is replaced at start.
function fresh(cert) {
  try {
    const end = Date.parse(new X509Certificate(cert).validTo);
    return end > Date.now() + 7 * 24 * 3600 * 1000;
  } catch {
    return false;
  }
}

async function certificate() {
  const dir = ".lan";
  const cached = `${dir}/certificate.json`;
  let known = [];
  try {
    const saved = JSON.parse(await readFile(cached, "utf8"));
    known = Array.isArray(saved.addresses) ? saved.addresses : [];
    if (addresses.every((a) => known.includes(a)) && fresh(saved.cert))
      return saved;
  } catch {}
  // A new certificate also covers the addresses of the previous one: moving
  // between the hotspot and a cable does not change the fingerprint again.
  const all = [...new Set([...known, ...addresses])];
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
            ...all.map((ip) => ({ type: 7, ip })),
          ],
        },
      ],
    },
  );
  const saved = {
    key: pems.private,
    cert: pems.cert,
    fingerprint: pems.fingerprint,
    addresses: all,
  };
  await mkdir(dir, { recursive: true });
  await writeFile(cached, JSON.stringify(saved), { mode: 0o600 });
  return saved;
}

const { key, cert } = await certificate();
const x509 = new X509Certificate(cert);
// SHA-256 as shown by browsers (certificate viewer), in two halves.
const sha256 = x509.fingerprint256.split(":");
const color = process.stdout.isTTY && !process.env.NO_COLOR;

const server = createServer({ key, cert }, handle);
attachRelay(server);
server.on("error", (error) => {
  console.error(
    error.code === "EADDRINUSE"
      ? `\n  Le port ${port} est déjà utilisé (orion aic déjà lancé ?). Choisir un autre port : --port 4444\n`
      : error.code === "EACCES"
        ? `\n  Port ${port} réservé à l’administrateur : choisir un port au-dessus de 1024.\n`
        : `\n  ${error.message}\n`,
  );
  process.exit(1);
});
server.listen(port, "0.0.0.0", () => {
  console.log("\n  orion aic · réseau local\n");
  console.log(`  Ce poste      https://localhost:${port}`);
  for (const a of addresses)
    console.log(`  Autres postes https://${a}:${port}`);
  if (!addresses.length)
    console.log("  Aucun réseau : activer le Wi-Fi ou brancher un câble.");
  console.log("\n  Empreinte SHA-256 du certificat :");
  console.log(`    ${sha256.slice(0, 16).join(":")}`);
  console.log(`    ${sha256.slice(16).join(":")}`);
  console.log(
    `  Valable jusqu’au ${new Date(x509.validTo).toLocaleDateString("fr-CH")}`,
  );
  console.log(
    "\n  Au premier accès, le navigateur signale un certificat non reconnu :",
  );
  console.log("  vérifier l’empreinte puis continuer. Ctrl+C pour arrêter.");
  if (!options["no-qr"])
    for (const a of addresses) {
      const url = `https://${a}:${port}`;
      // Colours: black on white whatever the theme. Without them, the light
      // modules are drawn, for the usual light-on-dark console.
      const lines = color
        ? ansiQr(terminalQr(url))
        : terminalQr(url, { invert: true });
      console.log(`\n  ${url}\n`);
      for (const line of lines) console.log(`  ${line}`);
    }
  console.log("");
});
