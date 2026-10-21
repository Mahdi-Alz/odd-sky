import { HISTORY, historyDates } from "@odd-sky/core";
import { INGEST } from "../config.js";
import { QuotaError } from "../errors.js";

/** @type {Map<string, Promise<IngestResult>>} */
const running = new Map();

/**
 * @typedef {Object} IngestResult
 * @property {number} fetched
 * @property {number} failed
 * @property {boolean} waited
 * @property {Error | null} error
 */

/**
 * @template T
 * @param {T[]} items
 * @param {number} limit
 * @param {(item: T) => Promise<void>} work
 */
const eachLimited = async (items, limit, work) => {
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) await work(items[next++]);
  });
  await Promise.all(workers);
};

/**
 * @param {{ cache: import("../repositories/types.js").CacheRepo, sleep: (ms: number) => Promise<void>, now: () => number }} deps
 * @param {string} lockKey
 */
const waitForLock = async ({ cache, sleep, now }, lockKey) => {
  const until = now() + INGEST.waitMs;
  while (now() < until) {
    await sleep(INGEST.pollMs);
    if ((await cache.get(lockKey)) === null) return;
  }
};

/**
 * @param {{
 *   history: import("../repositories/types.js").HistoryRepo,
 *   cache: import("../repositories/types.js").CacheRepo,
 *   openMeteo: import("../clients/openMeteo.js").OpenMeteo,
 *   sleep: (ms: number) => Promise<void>,
 *   now: () => number,
 * }} deps
 * @param {{ location: import("../repositories/types.js").Location, localDate: string }} input
 * @returns {Promise<IngestResult>}
 */
export const ingestHistory = (deps, { location, localDate }) => {
  const lockKey = `lock:ingest:${location.key}:${localDate.slice(5)}`;
  const current = running.get(lockKey);
  if (current) return current;
  const promise = ingest(deps, location, localDate, lockKey).finally(() => running.delete(lockKey));
  running.set(lockKey, promise);
  return promise;
};

/**
 * @param {Parameters<typeof ingestHistory>[0]} deps
 * @param {import("../repositories/types.js").Location} location
 * @param {string} localDate
 * @param {string} lockKey
 * @returns {Promise<IngestResult>}
 */
const ingest = async (deps, location, localDate, lockKey) => {
  const { history, cache, openMeteo } = deps;
  const targets = historyDates(localDate, HISTORY.years).map((target) => target.date);
  const stored = new Set(await history.storedDates(location.key, targets));
  const missing = targets.filter((date) => !stored.has(date));
  if (!missing.length) return { fetched: 0, failed: 0, waited: false, error: null };

  if (!(await cache.setIfAbsent(lockKey, 1, INGEST.lockMs))) {
    await waitForLock(deps, lockKey);
    return { fetched: 0, failed: 0, waited: true, error: null };
  }

  /** @type {import("@odd-sky/core/types").DayStats[]} */
  const rows = [];
  let failed = 0;
  /** @type {Error | null} */
  let error = null;
  try {
    await eachLimited(missing, INGEST.concurrency, async (date) => {
      if (error instanceof QuotaError) {
        failed += 1;
        return;
      }
      try {
        const days = await openMeteo.archiveDays({
          lat: location.lat,
          lon: location.lon,
          timezone: location.timezone,
          start: date,
          end: date,
        });
        const day = days.find((d) => d.date === date);
        if (day && day.tmax !== null) rows.push(day);
        else failed += 1;
      } catch (cause) {
        failed += 1;
        error = /** @type {Error} */ (cause);
      }
    });
    await history.saveDays(location.key, rows);
  } finally {
    await cache.del(lockKey);
  }
  return { fetched: rows.length, failed, waited: false, error };
};
