import { QuotaError } from "../errors.js";

const UNITS = 100;
const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** @param {number} time */
const iso = (time) => new Date(time).toISOString();

/**
 * @param {{ cache: import("../repositories/types.js").CacheRepo, limits: { perMinute: number, perHour: number, perDay: number }, now?: () => number }} options
 */
export const createLimiter = ({ cache, limits, now = Date.now }) => {
  const windows = (/** @type {number} */ time) => [
    {
      key: `quota:openmeteo:${iso(time).slice(0, 10)}`,
      limit: limits.perDay,
      ttl: 2 * DAY,
      span: DAY,
    },
    {
      key: `quota:openmeteo:h:${iso(time).slice(0, 13)}`,
      limit: limits.perHour,
      ttl: 2 * HOUR,
      span: HOUR,
    },
    {
      key: `quota:openmeteo:m:${iso(time).slice(0, 16)}`,
      limit: limits.perMinute,
      ttl: 2 * MINUTE,
      span: MINUTE,
    },
  ];

  return {
    /** @param {number} weight */
    async take(weight) {
      const time = now();
      const units = Math.round(weight * UNITS);
      const taken = [];
      for (const window of windows(time)) {
        const used = await cache.incrBy(window.key, units, window.ttl);
        taken.push(window);
        if (used > window.limit * UNITS) {
          for (const done of taken) await cache.incrBy(done.key, -units, done.ttl);
          throw new QuotaError(window.span - (time % window.span));
        }
      }
    },
    async usage() {
      const time = now();
      const [day, hour, minute] = await Promise.all(
        windows(time).map(async (window) => ((await cache.get(window.key)) ?? 0) / UNITS),
      );
      return { day, hour, minute, limits };
    },
  };
};

/** @typedef {ReturnType<typeof createLimiter>} Limiter */
