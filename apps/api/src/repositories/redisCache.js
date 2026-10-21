import { Redis } from "@upstash/redis";

/**
 * @param {{ url: string, token: string }} options
 * @returns {import("./types.js").CacheRepo}
 */
export const createRedisCache = ({ url, token }) => {
  const redis = new Redis({ url, token });
  return {
    kind: "redis",
    async get(key) {
      return redis.get(key);
    },
    async set(key, value, ttlMs) {
      await redis.set(key, value, { px: Math.max(1, Math.round(ttlMs)) });
    },
    async setIfAbsent(key, value, ttlMs) {
      const result = await redis.set(key, value, { px: Math.max(1, Math.round(ttlMs)), nx: true });
      return result === "OK";
    },
    async del(key) {
      await redis.del(key);
    },
    async incrBy(key, amount, ttlMs) {
      const [value] = /** @type {[number, number]} */ (
        await redis.multi().incrby(key, amount).pexpire(key, Math.round(ttlMs), "NX").exec()
      );
      return value;
    },
  };
};
