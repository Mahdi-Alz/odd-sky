export const createCache = (kv, now = () => Date.now()) => ({
  async get(key) {
    let entry;
    try {
      entry = await kv.get(key);
    } catch {
      return null;
    }
    if (!entry) return null;
    if (entry.expiresAt != null && entry.expiresAt <= now()) {
      kv.del(key).catch(() => {});
      return null;
    }
    return entry;
  },
  async set(key, data, ttlMs) {
    const savedAt = now();
    try {
      await kv.set(key, { data, savedAt, expiresAt: ttlMs == null ? null : savedAt + ttlMs });
    } catch {
      return;
    }
  },
});
