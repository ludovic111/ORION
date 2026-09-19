import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import { randomBytes, randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { z } from "zod";
import {
  hashPassword,
  verifyPassword,
  digest,
  encrypt,
  decrypt,
  newTotpSecret,
  verifyTotp,
  audit,
  auditHash,
} from "./security.mjs";
import {
  operationSchema,
  schemas,
  userSchema,
  loginSchema,
  roles,
  HttpError,
  requireRole,
} from "./validation.mjs";

export async function createApp(db, config) {
  const app = express();
  const {
    production = false,
    demo = false,
    origin = "http://127.0.0.1:4311",
    key,
  } = config;
  if (!/^[a-f\d]{64}$/i.test(key ?? ""))
    throw new Error("APP_KEY doit contenir 32 octets hexadécimaux.");
  if (production && (demo || !origin.startsWith("https://")))
    throw new Error("Production : HTTPS requis, démonstration interdite.");
  app.disable("x-powered-by");
  if (config.trustedProxies?.length)
    app.set("trust proxy", config.trustedProxies);
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "blob:"],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          frameAncestors: ["'none'"],
          upgradeInsecureRequests: production ? [] : null,
        },
      },
      hsts: production ? { maxAge: 31536000 } : false,
    }),
  );
  app.use(express.json({ limit: "256kb" }));
  app.use(cookieParser());
  app.use("/api", (req, res, next) => {
    res.setHeader("Cache-Control", "no-store");
    next();
  });
  app.use(
    "/api",
    rateLimit({
      windowMs: 60000,
      limit: 600,
      standardHeaders: "draft-8",
      legacyHeaders: false,
    }),
  );
  app.use("/api", (req, res, next) => {
    if (
      !["GET", "HEAD", "OPTIONS"].includes(req.method) &&
      req.get("origin") !== origin
    )
      return res.status(403).json({ error: "Origine de la requête refusée." });
    next();
  });
  const cookie = {
    httpOnly: true,
    secure: production,
    sameSite: "strict",
    path: "/",
    maxAge: 8 * 3600 * 1000,
  };
  const dummyHash = await hashPassword(randomBytes(32).toString("hex"));
  const catalog = JSON.parse(
    await readFile(
      new URL("../public/symbols/catalog.json", import.meta.url),
      "utf8",
    ),
  );
  const symbolIds = new Set(catalog.map((s) => s.id));
  async function session(req, res, next) {
    const hash = digest(req.cookies.orion_session ?? "");
    const row = (
      await db.query(
        `SELECT u.id,u.email,u.name,u.role,u.mfa_enabled,s.csrf,s.authenticated,s.token_hash FROM sessions s JOIN users u ON u.id=s.user_id
      WHERE s.token_hash=$1 AND u.active=TRUE AND s.expires_at>CURRENT_TIMESTAMP AND s.last_seen>CURRENT_TIMESTAMP-INTERVAL '30 minutes'`,
        [hash],
      )
    ).rows[0];
    if (!row) throw new HttpError(401, "Session expirée. Reconnectez-vous.");
    if (
      !["GET", "HEAD"].includes(req.method) &&
      req.get("x-csrf-token") !== row.csrf
    )
      throw new HttpError(403, "Jeton de session invalide.");
    if (!["GET", "HEAD"].includes(req.method))
      await db.query(
        "UPDATE sessions SET last_seen=CURRENT_TIMESTAMP WHERE token_hash=$1",
        [hash],
      );
    req.user = row;
    next();
  }
  function authenticated(req, res, next) {
    if (!req.user.authenticated)
      throw new HttpError(
        403,
        "Activez le second facteur avant de consulter les données.",
      );
    next();
  }
  async function issueSession(tx, user, res, full) {
    const token = randomBytes(32).toString("hex"),
      csrf = randomBytes(32).toString("hex");
    await tx.query(
      "DELETE FROM sessions WHERE expires_at<CURRENT_TIMESTAMP OR last_seen<CURRENT_TIMESTAMP-INTERVAL '30 minutes'",
    );
    await tx.query(
      "INSERT INTO sessions(token_hash,user_id,csrf,authenticated,expires_at) VALUES($1,$2,$3,$4,$5)",
      [digest(token), user.id, csrf, full, new Date(Date.now() + 8 * 3600000)],
    );
    res.cookie("orion_session", token, cookie);
    return { user: publicUser(user), csrf, authenticated: full, demo };
  }
  function publicUser(u) {
    return {
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      mfa_enabled: u.mfa_enabled,
    };
  }
  app.get("/api/health", async (req, res) => {
    await db.query("SELECT 1");
    res.json({ status: "ok" });
  });
  app.get("/api/config", (req, res) => res.json({ demo, version: "0.1.0" }));
  const loginLimiter = rateLimit({
    windowMs: 15 * 60000,
    limit: 20,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { error: "Trop de tentatives. Réessayez dans 15 minutes." },
  });
  app.post("/api/login", loginLimiter, async (req, res) => {
    const input = loginSchema.parse(req.body);
    const result = await db.transaction(async (tx) => {
      const user = (
        await tx.query("SELECT * FROM users WHERE email=$1 FOR UPDATE", [
          input.email,
        ])
      ).rows[0];
      const validPassword = await verifyPassword(
        input.password,
        user?.password_hash ?? dummyHash,
      );
      const locked =
        user?.locked_until && new Date(user.locked_until) > new Date();
      let counter = null;
      if (user?.mfa_enabled && validPassword && !locked)
        counter = verifyTotp(
          decrypt(user.mfa_secret, key),
          input.code,
          user.last_totp,
        );
      if (
        !user?.active ||
        locked ||
        !validPassword ||
        (user.mfa_enabled && counter === null)
      ) {
        if (user && !locked)
          await tx.query(
            `UPDATE users SET failures=failures+1,locked_until=CASE WHEN failures+1>=5 THEN CURRENT_TIMESTAMP+INTERVAL '15 minutes' ELSE locked_until END WHERE id=$1`,
            [user.id],
          );
        await audit(tx, user?.id ?? "anonymous", "auth.failed", null, null, {});
        return null;
      }
      await tx.query(
        "UPDATE users SET failures=0,locked_until=NULL,last_totp=COALESCE($2,last_totp) WHERE id=$1",
        [user.id, counter],
      );
      await audit(tx, user.id, "auth.login");
      return issueSession(tx, user, res, user.mfa_enabled);
    });
    if (!result)
      throw new HttpError(
        401,
        "Identifiants ou code invalides, ou compte temporairement verrouillé.",
      );
    res.json(result);
  });
  app.post("/api/demo", loginLimiter, async (req, res) => {
    if (!demo) throw new HttpError(404, "Route inconnue.");
    const user = (
      await db.query(
        "SELECT * FROM users WHERE email='demo@orion.local' AND active=TRUE",
      )
    ).rows[0];
    const result = await db.transaction(async (tx) => {
      await audit(tx, user.id, "auth.demo");
      return issueSession(tx, user, res, true);
    });
    res.json(result);
  });
  app.get("/api/session", session, (req, res) =>
    res.json({
      user: publicUser(req.user),
      csrf: req.user.csrf,
      authenticated: req.user.authenticated,
      demo,
    }),
  );
  app.post("/api/logout", session, async (req, res) => {
    await db.transaction(async (tx) => {
      await tx.query("DELETE FROM sessions WHERE token_hash=$1", [
        req.user.token_hash,
      ]);
      await audit(tx, req.user.id, "auth.logout");
    });
    res.clearCookie("orion_session", { ...cookie, maxAge: undefined });
    res.json({ ok: true });
  });
  app.post("/api/mfa/setup", session, async (req, res) => {
    const secret = await db.transaction(async (tx) => {
      const user = (
        await tx.query("SELECT * FROM users WHERE id=$1 FOR UPDATE", [
          req.user.id,
        ])
      ).rows[0];
      if (user.mfa_enabled)
        throw new HttpError(409, "Second facteur déjà actif.");
      const secret = user.mfa_secret
        ? decrypt(user.mfa_secret, key)
        : newTotpSecret();
      if (!user.mfa_secret)
        await tx.query("UPDATE users SET mfa_secret=$1 WHERE id=$2", [
          encrypt(secret, key),
          user.id,
        ]);
      return secret;
    });
    res.json({
      secret,
      uri: `otpauth://totp/ORION:${encodeURIComponent(req.user.email)}?secret=${secret}&issuer=ORION&algorithm=SHA1&digits=6&period=30`,
    });
  });
  app.post("/api/mfa/confirm", loginLimiter, session, async (req, res) => {
    const { code } = z
      .object({ code: z.string().regex(/^\d{6}$/) })
      .strict()
      .parse(req.body);
    const result = await db.transaction(async (tx) => {
      const user = (
        await tx.query("SELECT * FROM users WHERE id=$1 FOR UPDATE", [
          req.user.id,
        ])
      ).rows[0];
      if (!user.mfa_secret || user.mfa_enabled)
        throw new HttpError(409, "Configuration MFA indisponible.");
      const counter = verifyTotp(
        decrypt(user.mfa_secret, key),
        code,
        user.last_totp,
      );
      if (counter === null) throw new HttpError(400, "Code invalide.");
      await tx.query(
        "UPDATE users SET mfa_enabled=TRUE,last_totp=$1 WHERE id=$2",
        [counter, user.id],
      );
      await tx.query("DELETE FROM sessions WHERE user_id=$1", [user.id]);
      await audit(tx, user.id, "auth.mfa.enabled");
      return issueSession(tx, { ...user, mfa_enabled: true }, res, true);
    });
    res.json(result);
  });
  app.use("/api", session, authenticated);
  app.post("/api/activity", (req, res) => res.json({ ok: true }));
  app.get("/api/operations", async (req, res) =>
    res.json(
      (
        await db.query(
          `SELECT * FROM operations WHERE $1='admin' OR id IN (SELECT operation_id FROM memberships WHERE user_id=$2) ORDER BY status,created_at DESC`,
          [req.user.role, req.user.id],
        )
      ).rows,
    ),
  );
  app.post("/api/operations", async (req, res) => {
    requireRole(req.user, ["admin", "command", "chief"]);
    const input = operationSchema.parse(req.body);
    if (demo && input.mode === "real")
      throw new HttpError(
        400,
        "Le mode démonstration accepte uniquement les exercices.",
      );
    const id = randomUUID();
    await db.transaction(async (tx) => {
      await tx.query(
        "INSERT INTO operations(id,name,mode,nature,level,location,commander,phase) VALUES($1,$2,$3,$4,$5,$6,$7,$8)",
        [
          id,
          input.name,
          input.mode,
          input.nature,
          input.level,
          input.location,
          input.commander,
          input.phase,
        ],
      );
      await tx.query(
        "INSERT INTO memberships(operation_id,user_id) VALUES($1,$2)",
        [id, req.user.id],
      );
      await audit(tx, req.user.id, "operation.created", id, id, input);
    });
    res.status(201).json({ id });
  });
  async function operationAccess(req, res, next) {
    const operation = (
      await db.query(
        `SELECT * FROM operations WHERE id=$1 AND ($2='admin' OR id IN (SELECT operation_id FROM memberships WHERE user_id=$3))`,
        [req.params.op, req.user.role, req.user.id],
      )
    ).rows[0];
    if (!operation) throw new HttpError(404, "Dossier introuvable.");
    req.operation = operation;
    next();
  }
  app.patch("/api/operations/:op", operationAccess, async (req, res) => {
    requireRole(req.user, ["admin", "command"]);
    const data = z
      .object({
        status: z.enum(["active", "closed"]),
        version: z.number().int().positive(),
      })
      .strict()
      .parse(req.body);
    await db.transaction(async (tx) => {
      const result = await tx.query(
        "UPDATE operations SET status=$1,version=version+1 WHERE id=$2 AND version=$3 RETURNING id",
        [data.status, req.operation.id, data.version],
      );
      if (!result.rows.length)
        throw new HttpError(
          409,
          "Le dossier a été modifié. Actualisez la page.",
        );
      await audit(
        tx,
        req.user.id,
        "operation.status",
        req.operation.id,
        req.operation.id,
        { status: data.status },
      );
    });
    res.json({ ok: true });
  });
  app.get("/api/operations/:op/records", operationAccess, async (req, res) =>
    res.json(
      (
        await db.query(
          "SELECT * FROM records WHERE operation_id=$1 ORDER BY created_at DESC,id",
          [req.operation.id],
        )
      ).rows,
    ),
  );
  async function writeRecord(req, tx, id, version, input, kind) {
    const op = (
      await tx.query("SELECT status FROM operations WHERE id=$1 FOR UPDATE", [
        req.operation.id,
      ])
    ).rows[0];
    if (op.status === "closed")
      throw new HttpError(409, "Ce dossier est clôturé.");
    requireRole(req.user, ["admin", "command", "chief", "operator"]);
    if (!schemas[kind]) throw new HttpError(400, "Type inconnu.");
    const data = schemas[kind].parse(input);
    const before = id
      ? (
          await tx.query(
            "SELECT * FROM records WHERE id=$1 AND operation_id=$2 FOR UPDATE",
            [id, req.operation.id],
          )
        ).rows[0]
      : null;
    if (id && (!before || before.kind !== kind))
      throw new HttpError(404, "Objet introuvable.");
    if (before && before.version !== version)
      throw new HttpError(
        409,
        "Cet objet a été modifié par un autre utilisateur. Fermez puis rouvrez sa fiche.",
      );
    if (
      (kind === "journal" &&
        (data.type === "Ordre" || before?.data.type === "Ordre")) ||
      kind === "report"
    )
      requireRole(req.user, ["admin", "command", "chief"]);
    if (data.validated || before?.data.validated)
      requireRole(req.user, ["admin", "command", "chief"]);
    if (kind === "map" && !symbolIds.has(data.symbol))
      throw new HttpError(400, "Signe OFPP inconnu.");
    if (kind === "link") {
      if (data.source === data.target)
        throw new HttpError(400, "Choisissez deux objets distincts.");
      const objects = (
        await tx.query(
          "SELECT id FROM records WHERE operation_id=$1 AND id IN ($2,$3) AND kind NOT IN ('link','report')",
          [req.operation.id, data.source, data.target],
        )
      ).rows;
      if (objects.length !== 2)
        throw new HttpError(
          400,
          "Les objets doivent appartenir au même dossier.",
        );
    }
    const recordId = id ?? randomUUID();
    if (before)
      await tx.query(
        "UPDATE records SET data=$1,version=version+1,updated_at=CURRENT_TIMESTAMP WHERE id=$2",
        [JSON.stringify(data), recordId],
      );
    else
      await tx.query(
        "INSERT INTO records(id,operation_id,kind,data,created_by) VALUES($1,$2,$3,$4,$5)",
        [recordId, req.operation.id, kind, JSON.stringify(data), req.user.id],
      );
    await audit(
      tx,
      req.user.id,
      `${kind}.${before ? "updated" : "created"}`,
      req.operation.id,
      recordId,
      { before: before?.data ?? null, after: data },
    );
    return { id: recordId };
  }
  app.post("/api/operations/:op/records", operationAccess, async (req, res) => {
    const { kind, data } = z
      .object({ kind: z.enum(Object.keys(schemas)), data: z.unknown() })
      .strict()
      .parse(req.body);
    res
      .status(201)
      .json(
        await db.transaction((tx) =>
          writeRecord(req, tx, null, null, data, kind),
        ),
      );
  });
  app.put(
    "/api/operations/:op/records/:id",
    operationAccess,
    async (req, res) => {
      const { kind, data, version } = z
        .object({
          kind: z.enum(Object.keys(schemas)),
          data: z.unknown(),
          version: z.number().int().positive(),
        })
        .strict()
        .parse(req.body);
      res.json(
        await db.transaction((tx) =>
          writeRecord(req, tx, req.params.id, version, data, kind),
        ),
      );
    },
  );
  app.post("/api/operations/:op/import", operationAccess, async (req, res) => {
    requireRole(req.user, ["admin", "command", "chief"]);
    const batch = z
      .object({
        records: z
          .array(
            z
              .object({
                kind: z.enum(["resource", "stock", "map"]),
                data: z.unknown(),
              })
              .strict(),
          )
          .min(1)
          .max(200),
      })
      .strict()
      .parse(req.body);
    const ids = await db.transaction(async (tx) => {
      const results = [];
      for (const row of batch.records)
        results.push(
          await writeRecord(req, tx, null, null, row.data, row.kind),
        );
      return results;
    });
    res.status(201).json({ imported: ids.length });
  });
  app.get("/api/operations/:op/export", operationAccess, async (req, res) => {
    requireRole(req.user, ["admin", "command", "chief"]);
    const records = await db.transaction(async (tx) => {
      await audit(
        tx,
        req.user.id,
        "operation.exported",
        req.operation.id,
        req.operation.id,
      );
      return (
        await tx.query(
          "SELECT * FROM records WHERE operation_id=$1 ORDER BY created_at",
          [req.operation.id],
        )
      ).rows;
    });
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="orion-${req.operation.id}.json"`,
    );
    res.json({
      format: "orion-export-v1",
      exportedAt: new Date().toISOString(),
      operation: req.operation,
      records,
    });
  });
  app.get("/api/admin/status", async (req, res) => {
    requireRole(req.user, ["admin"]);
    const start = performance.now();
    await db.query("SELECT 1");
    res.json({
      database: db.kind,
      latencyMs: Math.round(performance.now() - start),
      tls: production,
      mode: demo ? "Démonstration locale" : "Institution",
      mfaRequired: !demo,
      sessionIdleMinutes: 30,
      audit: "Ajout seul · chaîne SHA-256",
      externalConnectors: [],
      version: "0.1.0",
    });
  });
  app.get("/api/admin/users", async (req, res) => {
    requireRole(req.user, ["admin"]);
    const users = (
      await db.query(
        "SELECT id,email,name,role,active,mfa_enabled,created_at FROM users ORDER BY name",
      )
    ).rows;
    const memberships = (await db.query("SELECT * FROM memberships")).rows;
    res.json(
      users.map((u) => ({
        ...u,
        operationIds: memberships
          .filter((m) => m.user_id === u.id)
          .map((m) => m.operation_id),
      })),
    );
  });
  app.post("/api/admin/users", async (req, res) => {
    requireRole(req.user, ["admin"]);
    const user = userSchema.parse(req.body);
    const id = randomUUID();
    const hash = await hashPassword(user.password);
    await db.transaction(async (tx) => {
      await tx.query(
        "INSERT INTO users(id,email,name,role,password_hash) VALUES($1,$2,$3,$4,$5)",
        [id, user.email, user.name, user.role, hash],
      );
      for (const op of user.operationIds)
        await tx.query(
          "INSERT INTO memberships(operation_id,user_id) VALUES($1,$2)",
          [op, id],
        );
      await audit(tx, req.user.id, "user.created", null, id, {
        email: user.email,
        role: user.role,
        operationIds: user.operationIds,
      });
    });
    res.status(201).json({ id });
  });
  app.patch("/api/admin/users/:id", async (req, res) => {
    requireRole(req.user, ["admin"]);
    const input = z
      .object({
        active: z.boolean(),
        role: z.enum(roles),
        operationIds: z.array(z.string()).max(100),
      })
      .strict()
      .parse(req.body);
    if (req.params.id === req.user.id)
      throw new HttpError(
        400,
        "Un administrateur ne peut pas modifier ses propres droits.",
      );
    await db.transaction(async (tx) => {
      const result = await tx.query(
        "UPDATE users SET active=$1,role=$2 WHERE id=$3 RETURNING id",
        [input.active, input.role, req.params.id],
      );
      if (!result.rows.length) throw new HttpError(404, "Compte introuvable.");
      await tx.query("DELETE FROM memberships WHERE user_id=$1", [
        req.params.id,
      ]);
      for (const op of input.operationIds)
        await tx.query(
          "INSERT INTO memberships(operation_id,user_id) VALUES($1,$2)",
          [op, req.params.id],
        );
      await tx.query("DELETE FROM sessions WHERE user_id=$1", [req.params.id]);
      await audit(
        tx,
        req.user.id,
        "user.access.updated",
        null,
        req.params.id,
        input,
      );
    });
    res.json({ ok: true });
  });
  app.get("/api/admin/audit", async (req, res) => {
    requireRole(req.user, ["admin"]);
    res.json(
      (await db.query("SELECT * FROM audit ORDER BY seq DESC LIMIT 500")).rows,
    );
  });
  app.get("/api/admin/audit/verify", async (req, res) => {
    requireRole(req.user, ["admin"]);
    const entries = (await db.query("SELECT * FROM audit ORDER BY seq")).rows;
    let previous = "0".repeat(64);
    let valid = true;
    for (const e of entries) {
      if (e.previous_hash !== previous || auditHash(e) !== e.hash) {
        valid = false;
        break;
      }
      previous = e.hash;
    }
    res.json({
      valid,
      entries: entries.length,
      head: previous,
      verifiedAt: new Date().toISOString(),
    });
  });
  app.use("/api", (req, res) =>
    res.status(404).json({ error: "Route inconnue." }),
  );
  app.use((error, req, res, next) => {
    if (error instanceof z.ZodError)
      return res.status(400).json({
        error: "Vérifiez les champs du formulaire.",
        details: error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
      });
    if (error.code === "23505")
      return res.status(409).json({ error: "Cette donnée existe déjà." });
    if (error.code === "23503")
      return res
        .status(400)
        .json({ error: "Un objet référencé est introuvable." });
    if (error.type === "entity.parse.failed")
      return res.status(400).json({ error: "JSON invalide." });
    if (error.type === "entity.too.large")
      return res
        .status(413)
        .json({ error: "Fichier trop volumineux (256 Ko maximum)." });
    if (!error.status)
      console.error("Request failed", error.name, error.code ?? "");
    res.status(error.status ?? 500).json({
      error: error.status
        ? error.message
        : "Erreur interne. Aucune modification confirmée.",
    });
  });
  return app;
}
