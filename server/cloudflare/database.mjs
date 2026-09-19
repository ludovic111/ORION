// Only the fixed queries in ORION's server are adapted; caller values stay bound parameters.
export function sqliteQuery(sql, params = []) {
  const values = [];
  const text = sql
    .replace(
      /CURRENT_TIMESTAMP\s*([+-])\s*INTERVAL '(\d+) minutes'/g,
      (_, sign, minutes) =>
        `strftime('%Y-%m-%dT%H:%M:%fZ','now','${sign}${minutes} minutes')`,
    )
    .replace(/CURRENT_TIMESTAMP/g, "strftime('%Y-%m-%dT%H:%M:%fZ','now')")
    .replace(/\s+FOR UPDATE(?: OF \w+)?/g, "")
    .replace(/\bLEAST\(/g, "MIN(")
    .replace(/\$(\d+)/g, (_, index) => {
      const value = params[Number(index) - 1];
      if (value === undefined) throw new Error("Missing SQL parameter");
      if (typeof value === "string" && value.includes("\0")) {
        const error = new Error(
          "Le texte ne peut pas contenir de caractère nul.",
        );
        error.status = 400;
        throw error;
      }
      values.push(
        value instanceof Date
          ? value.toISOString()
          : typeof value === "boolean"
            ? Number(value)
            : value,
      );
      return "?";
    });
  return { text, values };
}
export function sqliteDatabase(storage) {
  const query = (sql, params = []) => {
    const { text, values } = sqliteQuery(sql, params);
    try {
      const cursor = storage.sql.exec(text, ...values);
      const rows = cursor.toArray().map((row) => {
        for (const key of ["data", "detail"])
          if (typeof row[key] === "string") row[key] = JSON.parse(row[key]);
        for (const key of ["active", "authenticated", "mfa_enabled", "revoked"])
          if (key in row) row[key] = !!row[key];
        return row;
      });
      return { rows };
    } catch (error) {
      if (/UNIQUE constraint failed/.test(error.message)) error.code = "23505";
      if (/FOREIGN KEY constraint failed/.test(error.message))
        error.code = "23503";
      throw error;
    }
  };
  return {
    query,
    transaction: (fn) => storage.transaction(() => fn({ query })),
    kind: "SQLite · Cloudflare · démonstration",
  };
}
