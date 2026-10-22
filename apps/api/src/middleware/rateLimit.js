const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

/** @param {import("hono").Context} c */
export const clientIp = (c) =>
  c.req.header("x-vercel-forwarded-for")?.split(",")[0].trim() ||
  c.req.header("x-real-ip")?.trim() ||
  c.req.header("x-forwarded-for")?.split(",")[0].trim() ||
  "local";

/** @param {string} ip */
const hashIp = async (ip) => {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`odd-sky:${ip}`));
  return Array.from(new Uint8Array(digest).slice(0, 8), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
};

/**
 * @param {import("../repositories/types.js").CacheRepo} cache
 * @param {{ name: string, limit: number, windowMs: number, now: () => number }} rule
 * @param {string} ip
 */
export const consume = async (cache, { name, limit, windowMs, now }, ip) => {
  const time = now();
  const window = Math.floor(time / windowMs);
  const key = `ratelimit:${name}:${await hashIp(ip)}:${window}`;
  const used = await cache.incrBy(key, 1, windowMs * 2);
  return {
    allowed: used <= limit,
    retryAfterSeconds: Math.ceil(((window + 1) * windowMs - time) / 1000),
  };
};

/**
 * @param {import("hono").Context} c
 * @param {number} retryAfterSeconds
 */
export const tooMany = (c, retryAfterSeconds) => {
  c.header("retry-after", String(retryAfterSeconds));
  return c.json({ error: "rate-limited" }, 429);
};

/**
 * @param {import("../deps.js").Deps} deps
 * @param {number} limit
 * @returns {import("hono").MiddlewareHandler}
 */
export const requestLimit = (deps, limit) => async (c, next) => {
  const result = await consume(
    deps.cache,
    { name: "requests", limit, windowMs: MINUTE, now: deps.now },
    clientIp(c),
  );
  if (!result.allowed) return tooMany(c, result.retryAfterSeconds);
  await next();
};

/**
 * @param {import("../deps.js").Deps} deps
 * @param {import("hono").Context} c
 * @param {number} limit
 */
export const computeLimit = (deps, c, limit) =>
  consume(deps.cache, { name: "computes", limit, windowMs: HOUR, now: deps.now }, clientIp(c));
