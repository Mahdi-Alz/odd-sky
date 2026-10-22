export const LIMITS = {
  perMinute: 500,
  perHour: 4000,
  perDay: 8000,
  alertShare: 0.8,
};

export const RATE_LIMIT = {
  requestsPerMinute: 60,
  computesPerHour: 30,
};

export const INGEST = {
  concurrency: 6,
  lockMs: 60_000,
  waitMs: 20_000,
  pollMs: 500,
};

export const RETRY = {
  attempts: 3,
  baseDelayMs: 1000,
  maxDelayMs: 8000,
};

export const FACTS_CACHE = {
  version: "v3",
  maxTtlMs: 6 * 60 * 60 * 1000,
  partialTtlMs: 10 * 60 * 1000,
};

/** @typedef {ReturnType<typeof readConfig>} Config */

/** @param {Record<string, string | undefined>} env */
export const readConfig = (env) => ({
  databaseUrl: env.DATABASE_URL,
  redisUrl: env.UPSTASH_REDIS_REST_URL ?? env.KV_REST_API_URL,
  redisToken: env.UPSTASH_REDIS_REST_TOKEN ?? env.KV_REST_API_TOKEN,
  openMeteo: {
    apiKey: env.OPEN_METEO_API_KEY || undefined,
    archiveUrl: env.OPEN_METEO_ARCHIVE_URL ?? "https://archive-api.open-meteo.com/v1/archive",
    forecastUrl: env.OPEN_METEO_FORECAST_URL ?? "https://api.open-meteo.com/v1/forecast",
  },
});
