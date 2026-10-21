/**
 * @param {{ now?: () => number }} [options]
 * @returns {import("./types.js").CacheRepo}
 */
export const createMemoryCache = ({ now = Date.now } = {}) => {
  /** @type {Map<string, { value: any, expiresAt: number }>} */
  const entries = new Map();

  /** @param {string} key */
  const live = (key) => {
    const entry = entries.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt <= now()) {
      entries.delete(key);
      return undefined;
    }
    return entry;
  };

  return {
    kind: "memory",
    async get(key) {
      const entry = live(key);
      return entry ? structuredClone(entry.value) : null;
    },
    async set(key, value, ttlMs) {
      entries.set(key, { value: structuredClone(value), expiresAt: now() + ttlMs });
    },
    async setIfAbsent(key, value, ttlMs) {
      if (live(key)) return false;
      entries.set(key, { value, expiresAt: now() + ttlMs });
      return true;
    },
    async del(key) {
      entries.delete(key);
    },
    async incrBy(key, amount, ttlMs) {
      const entry = live(key);
      if (entry) {
        entry.value += amount;
        return entry.value;
      }
      entries.set(key, { value: amount, expiresAt: now() + ttlMs });
      return amount;
    },
  };
};
