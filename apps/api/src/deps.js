import { createLimiter } from "./clients/limiter.js";
import { createOpenMeteo } from "./clients/openMeteo.js";
import { LIMITS, readConfig } from "./config.js";
import { createMemoryCache } from "./repositories/memoryCache.js";
import { createMemoryHistory } from "./repositories/memoryHistory.js";
import { createPostgresHistory } from "./repositories/postgresHistory.js";
import { createRedisCache } from "./repositories/redisCache.js";

/**
 * @typedef {Object} Deps
 * @property {import("./repositories/types.js").HistoryRepo} history
 * @property {import("./repositories/types.js").CacheRepo} cache
 * @property {import("./clients/limiter.js").Limiter} limiter
 * @property {import("./clients/openMeteo.js").OpenMeteo} openMeteo
 * @property {() => number} now
 * @property {(ms: number) => Promise<void>} sleep
 * @property {(message: string, error?: unknown) => void} log
 */

/**
 * @param {Record<string, string | undefined>} env
 * @param {Partial<Deps> & { fetch?: typeof fetch }} [overrides]
 * @returns {Deps}
 */
export const createDeps = (env, overrides = {}) => {
  const config = readConfig(env);
  const now = overrides.now ?? Date.now;
  const sleep = overrides.sleep ?? ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
  const history =
    overrides.history ??
    (config.databaseUrl
      ? createPostgresHistory({ url: config.databaseUrl })
      : createMemoryHistory({ now }));
  const cache =
    overrides.cache ??
    (config.redisUrl && config.redisToken
      ? createRedisCache({ url: config.redisUrl, token: config.redisToken })
      : createMemoryCache({ now }));
  const limiter = overrides.limiter ?? createLimiter({ cache, limits: LIMITS, now });
  const openMeteo =
    overrides.openMeteo ??
    createOpenMeteo({ fetch: overrides.fetch, limiter, config: config.openMeteo, sleep });
  const log = overrides.log ?? ((message, error) => console.error(message, error));
  return { history, cache, limiter, openMeteo, now, sleep, log };
};
