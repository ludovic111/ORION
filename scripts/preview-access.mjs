import { readFile, appendFile, chmod } from "node:fs/promises";
const [action, value, role = "command"] = process.argv.slice(2);
if (!["invite", "revoke"].includes(action) || !value)
  throw new Error(
    'Usage : npm run preview:invite -- "Évaluateur 01" [command|operator|viewer], ou npm run preview:revoke -- UUID',
  );
const state = JSON.parse(
  await readFile(
    process.env.ORION_PREVIEW_CONTROL_FILE || ".data/preview/control.json",
    "utf8",
  ),
);
const response = await fetch(
  `${state.local}/api/preview/manage/${action === "invite" ? "invitations" : "revoke"}`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: state.origin,
      "X-Orion-Preview-Control": state.controlKey,
    },
    body: JSON.stringify(
      action === "invite"
        ? { label: value, hours: state.hosted ? 168 : 48, role }
        : { id: value },
    ),
    signal: AbortSignal.timeout(10000),
  },
);
const data = await response.json();
if (!response.ok) throw new Error(data.error ?? `Erreur ${response.status}`);
if (action === "invite") {
  const file = state.hosted
    ? ".data/hosted-preview/INVITATIONS.md"
    : ".data/preview/INVITATIONS.md";
  await appendFile(
    file,
    `\n## ${data.label.replace(/[\r\n#]/g, " ")}\n\n- Accès personnel : ${data.url}\n- Expiration : ${data.expiresAt}\n- Révocation : ${state.hosted ? "ORION_PREVIEW_CONTROL_FILE=.data/hosted-preview/control.json " : ""}npm run preview:revoke -- ${data.id}\n`,
    { mode: 0o600 },
  );
  await chmod(file, 0o600);
  console.log(
    `Invitation créée. Lien privé enregistré dans ${file}. Transmettre un accès distinct par personne.`,
  );
} else
  console.log(
    "Invitation révoquée ; les sessions correspondantes sont fermées.",
  );
