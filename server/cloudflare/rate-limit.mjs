import { digest } from "../security.mjs";
export function rateLimitStore(storage, namespace) {
  let windowMs;
  const key = (value) => `${namespace}:${digest(value)}`;
  return {
    localKeys: false,
    prefix: namespace,
    init(options) {
      windowMs = options.windowMs;
    },
    async increment(value) {
      const now = Date.now();
      storage.sql.exec("DELETE FROM request_limits WHERE expires_at<=?", now);
      const row = storage.sql
        .exec(
          `INSERT INTO request_limits(key,hits,expires_at) VALUES(?,1,?)
        ON CONFLICT(key) DO UPDATE SET hits=hits+1 RETURNING hits,expires_at`,
          key(value),
          now + windowMs,
        )
        .one();
      return { totalHits: row.hits, resetTime: new Date(row.expires_at) };
    },
    async decrement(value) {
      storage.sql.exec(
        "UPDATE request_limits SET hits=MAX(0,hits-1) WHERE key=?",
        key(value),
      );
    },
    async resetKey(value) {
      storage.sql.exec("DELETE FROM request_limits WHERE key=?", key(value));
    },
  };
}
