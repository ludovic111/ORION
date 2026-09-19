import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import pg from "pg";

export async function openDatabase({
  url,
  path = ".data/orion",
  production = false,
  caFile,
  migrate = !production,
} = {}) {
  if (production && !url)
    throw new Error("DATABASE_URL est obligatoire en production.");
  let engine;
  if (url) {
    const parsed = new URL(url);
    if (
      production &&
      ["sslmode", "ssl", "sslcert", "sslkey", "sslrootcert"].some((k) =>
        parsed.searchParams.has(k),
      )
    ) {
      throw new Error(
        "Configurez TLS avec DATABASE_CA_FILE, sans paramètre SSL dans DATABASE_URL.",
      );
    }
    engine = new pg.Pool({
      connectionString: url,
      max: 10,
      connectionTimeoutMillis: 5000,
      ssl: production
        ? {
            rejectUnauthorized: true,
            ...(caFile ? { ca: await readFile(caFile, "utf8") } : {}),
          }
        : undefined,
    });
  } else engine = new PGlite(path);
  const query = (sql, params = []) => engine.query(sql, params);
  const transaction = async (fn) => {
    if (!url)
      return engine.transaction((tx) =>
        fn({ query: (sql, params = []) => tx.query(sql, params) }),
      );
    const client = await engine.connect();
    try {
      await client.query("BEGIN");
      const value = await fn(client);
      await client.query("COMMIT");
      return value;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  };
  try {
    if (migrate)
      await (url
        ? engine.query(
            await readFile(new URL("./schema.sql", import.meta.url), "utf8"),
          )
        : engine.exec(
            await readFile(new URL("./schema.sql", import.meta.url), "utf8"),
          ));
    if (production && !migrate) {
      const privilege = (
        await query(
          "SELECT r.rolsuper, r.rolcreaterole, pg_has_role(current_user,c.relowner,'MEMBER') AS owns_audit, has_table_privilege(current_user,c.oid,'UPDATE,DELETE,TRUNCATE') AS modifies_audit FROM pg_roles r JOIN pg_class c ON c.relname='audit' JOIN pg_namespace n ON n.oid=c.relnamespace AND n.nspname=current_schema() WHERE r.rolname=current_user",
        )
      ).rows[0];
      if (
        !privilege ||
        privilege.rolsuper ||
        privilege.rolcreaterole ||
        privilege.owns_audit ||
        privilege.modifies_audit
      )
        throw new Error(
          "Production : migrez le schéma puis utilisez un rôle applicatif non propriétaire, sans superuser.",
        );
    }
  } catch (error) {
    await (url ? engine.end() : engine.close());
    throw error;
  }
  return {
    query,
    transaction,
    kind: url ? "PostgreSQL" : "PostgreSQL embarqué · PGlite",
    close: () => (url ? engine.end() : engine.close()),
  };
}
