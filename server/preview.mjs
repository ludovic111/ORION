import { randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { audit, digest } from "./security.mjs";
import { HttpError } from "./validation.mjs";

async function createExercise(tx, { label, role, expiresAt }) {
  const userId = randomUUID(),
    opId = randomUUID();
  const template = (
    await tx.query(
      "SELECT * FROM operations WHERE mode='exercise' AND name='EX ORION-26 · Crue de l’Arve' ORDER BY created_at LIMIT 1",
    )
  ).rows[0];
  if (!template) throw new HttpError(503, "Scénario d’exercice indisponible.");
  await tx.query(
    "INSERT INTO users(id,email,name,role,password_hash,access_expires_at) VALUES($1,$2,$3,$4,$5,$6)",
    [
      userId,
      `${userId}@preview.invalid`,
      label,
      role,
      "invitation-only",
      expiresAt,
    ],
  );
  await tx.query(
    "INSERT INTO operations(id,name,mode,nature,level,location,commander,phase) VALUES($1,$2,$3,$4,$5,$6,$7,$8)",
    [
      opId,
      `EX ORION · ${label}`,
      "exercise",
      template.nature,
      template.level,
      template.location,
      "Conduite · exercice",
      template.phase,
    ],
  );
  await tx.query(
    "INSERT INTO memberships(operation_id,user_id) VALUES($1,$2)",
    [opId, userId],
  );
  const records = (
    await tx.query("SELECT * FROM records WHERE operation_id=$1", [template.id])
  ).rows;
  const offset = Date.now() - Date.parse(template.created_at);
  const ids = new Map(records.map((r) => [r.id, randomUUID()]));
  for (const r of records) {
    const data =
      r.kind === "link"
        ? {
            ...r.data,
            source: ids.get(r.data.source),
            target: ids.get(r.data.target),
          }
        : r.data;
    await tx.query(
      "INSERT INTO records(id,operation_id,kind,data,created_by,created_at) VALUES($1,$2,$3,$4,$5,$6)",
      [
        ids.get(r.id),
        opId,
        r.kind,
        JSON.stringify(data),
        userId,
        new Date(Date.parse(r.created_at) + offset),
      ],
    );
  }
  return { userId, opId };
}

export function registerPreview(app, db, config, issueSession, limiter) {
  if (!config.preview) return;
  const manager = (req, res, next) => {
    const supplied = req.get("x-orion-preview-control") ?? "";
    if (
      !timingSafeEqual(
        Buffer.from(digest(supplied), "hex"),
        Buffer.from(digest(config.previewControlKey), "hex"),
      )
    )
      throw new HttpError(404, "Route inconnue.");
    next();
  };
  app.post("/api/preview/start", limiter, async (req, res) => {
    const { name, syntheticOnly } = z
      .object({
        name: z
          .string()
          .trim()
          .min(1)
          .max(80)
          .regex(/^[^\p{Cc}\p{Cf}]+$/u),
        syntheticOnly: z.literal(true),
      })
      .strict()
      .parse(req.body);
    const result = await db.transaction(async (tx) => {
      await tx.query("SELECT id FROM audit_lock WHERE id=1 FOR UPDATE");
      const count = (
        await tx.query(
          "SELECT COUNT(*) AS count FROM users WHERE access_expires_at IS NOT NULL",
        )
      ).rows[0].count;
      if (Number(count) >= 100)
        throw new HttpError(
          409,
          "Les 100 espaces de test sont occupés. Contactez la personne qui présente ORION.",
        );
      const expiresAt = new Date(
        Math.min(Date.now() + 8 * 3600000, Date.parse(config.previewExpiresAt)),
      ).toISOString();
      const { userId, opId } = await createExercise(tx, {
        label: name,
        role: "command",
        expiresAt,
      });
      const user = (await tx.query("SELECT * FROM users WHERE id=$1", [userId]))
        .rows[0];
      await audit(tx, userId, "preview.started", opId, null, {
        syntheticOnly,
        expiresAt,
      });
      return issueSession(tx, user, res, true);
    });
    res.status(201).json(result);
  });
  app.post("/api/preview/enter", limiter, async (req, res) => {
    const { token, syntheticOnly } = z
      .object({
        token: z.string().regex(/^[A-Za-z0-9_-]{43}$/),
        syntheticOnly: z.literal(true),
      })
      .strict()
      .parse(req.body);
    const result = await db.transaction(async (tx) => {
      const row = (
        await tx.query(
          `SELECT u.* FROM preview_invitations i JOIN users u ON u.id=i.user_id
        WHERE i.token_hash=$1 AND NOT i.revoked AND i.expires_at>CURRENT_TIMESTAMP AND u.active=TRUE AND u.access_expires_at>CURRENT_TIMESTAMP FOR UPDATE OF u`,
          [digest(token)],
        )
      ).rows[0];
      if (!row)
        throw new HttpError(401, "Invitation invalide, expirée ou révoquée.");
      await audit(tx, row.id, "preview.entered", null, null, { syntheticOnly });
      return issueSession(tx, row, res, true);
    });
    res.json(result);
  });
  app.post(
    "/api/preview/manage/invitations",
    limiter,
    manager,
    async (req, res) => {
      const input = z
        .object({
          label: z.string().trim().min(2).max(80),
          hours: z
            .number()
            .int()
            .min(1)
            .max(config.hostedPreview ? 168 : 72),
          role: z.enum(["command", "operator", "viewer"]),
        })
        .strict()
        .parse(req.body);
      const token = randomBytes(32).toString("base64url"),
        id = randomUUID();
      const expiresAt = new Date(
        Math.min(
          Date.now() + input.hours * 3600000,
          new Date(config.previewExpiresAt).getTime(),
        ),
      ).toISOString();
      await db.transaction(async (tx) => {
        await tx.query("SELECT id FROM audit_lock WHERE id=1 FOR UPDATE");
        if (
          Number(
            (
              await tx.query(
                "SELECT COUNT(*) AS count FROM preview_invitations",
              )
            ).rows[0].count,
          ) >= 30
        )
          throw new HttpError(
            409,
            "Limite de 30 invitations atteinte pour cette démonstration.",
          );
        const { userId, opId } = await createExercise(tx, {
          label: input.label,
          role: input.role,
          expiresAt,
        });
        await tx.query(
          "INSERT INTO preview_invitations(id,token_hash,user_id,label,expires_at) VALUES($1,$2,$3,$4,$5)",
          [id, digest(token), userId, input.label, expiresAt],
        );
        await audit(tx, "preview-manager", "preview.invited", opId, id, {
          role: input.role,
          expiresAt,
        });
      });
      res.status(201).json({
        id,
        label: input.label,
        expiresAt,
        url: `${config.origin}/#invitation=${token}`,
      });
    },
  );
  app.post("/api/preview/manage/revoke", manager, async (req, res) => {
    const { id } = z.object({ id: z.uuid() }).strict().parse(req.body);
    await db.transaction(async (tx) => {
      const invitation = (
        await tx.query(
          "UPDATE preview_invitations SET revoked=TRUE WHERE id=$1 RETURNING user_id",
          [id],
        )
      ).rows[0];
      if (!invitation) throw new HttpError(404, "Invitation introuvable.");
      await tx.query("UPDATE users SET active=FALSE WHERE id=$1", [
        invitation.user_id,
      ]);
      await tx.query("DELETE FROM sessions WHERE user_id=$1", [
        invitation.user_id,
      ]);
      await audit(tx, "preview-manager", "preview.revoked", null, id, {});
    });
    res.json({ ok: true });
  });
}
