import { randomUUID } from "node:crypto";
import { loadConfig } from "../server/config.mjs";
import { openDatabase } from "../server/db.mjs";
import { hashPassword, audit } from "../server/security.mjs";
const email = process.env.BOOTSTRAP_EMAIL?.trim().toLowerCase(),
  password = process.env.BOOTSTRAP_PASSWORD;
if (
  !email?.includes("@") ||
  !password ||
  password.length < 14 ||
  password.length > 128
)
  throw new Error(
    "Définissez BOOTSTRAP_EMAIL et BOOTSTRAP_PASSWORD (14–128 caractères) dans un environnement sécurisé.",
  );
const db = await openDatabase(await loadConfig());
try {
  await db.transaction(async (tx) => {
    await tx.query("SELECT id FROM audit_lock WHERE id=1 FOR UPDATE");
    if ((await tx.query("SELECT id FROM users WHERE role='admin'")).rows.length)
      throw new Error(
        "Un administrateur existe déjà ; utilisez la gestion des utilisateurs.",
      );
    const id = randomUUID();
    await tx.query(
      "INSERT INTO users(id,email,name,role,password_hash) VALUES($1,$2,$3,$4,$5)",
      [
        id,
        email,
        process.env.BOOTSTRAP_NAME ?? "Administrateur ORION",
        "admin",
        await hashPassword(password),
      ],
    );
    await audit(tx, "bootstrap", "user.created", null, id, { role: "admin" });
  });
  console.log(
    "Administrateur créé. Enrôlement TOTP obligatoire à la première connexion.",
  );
} finally {
  await db.close();
}
