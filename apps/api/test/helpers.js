import { readFileSync } from "node:fs";
import { createDeps } from "../src/deps.js";
import { createMemoryCache } from "../src/repositories/memoryCache.js";
import { createMemoryHistory } from "../src/repositories/memoryHistory.js";

/** @param {string} name */
export const fixture = (name) =>
  JSON.parse(readFileSync(new URL(`./fixtures/${name}`, import.meta.url), "utf8"));

/** @param {string} date */
const syntheticDay = (date) => {
  const year = Number(date.slice(0, 4));
  return {
    temperature_2m_max: 20 + (year % 7),
    temperature_2m_min: 10 + (year % 5),
    apparent_temperature_max: 19 + (year % 7),
    apparent_temperature_min: 8 + (year % 5),
    precipitation_sum: year % 3 === 0 ? 2.5 : 0,
    rain_sum: year % 3 === 0 ? 2.5 : 0,
    snowfall_sum: 0,
    precipitation_hours: year % 3 === 0 ? 3 : 0,
    wind_speed_10m_max: 12,
    wind_gusts_10m_max: 30,
    cloud_cover_mean: 40,
    relative_humidity_2m_mean: 45,
    sunshine_duration: 30000,
  };
};

/** @param {string} start @param {string} end */
const datesBetween = (start, end) => {
  const dates = [];
  for (
    let t = Date.parse(`${start}T00:00:00Z`);
    t <= Date.parse(`${end}T00:00:00Z`);
    t += 86_400_000
  ) {
    dates.push(new Date(t).toISOString().slice(0, 10));
  }
  return dates;
};

/**
 * @param {URL} url
 */
const synthetic = (url) => {
  const vars = (url.searchParams.get("daily") ?? "").split(",");
  const dates = datesBetween(
    /** @type {string} */ (url.searchParams.get("start_date")),
    /** @type {string} */ (url.searchParams.get("end_date")),
  );
  /** @type {Record<string, unknown[]>} */
  const daily = { time: dates };
  for (const name of vars) {
    daily[name] = dates.map(
      (date) => /** @type {Record<string, number>} */ (syntheticDay(date))[name],
    );
  }
  return { daily };
};

/**
 * @param {{ respond?: (url: URL) => Response | undefined }} [options]
 */
export const createFakeFetch = ({ respond } = {}) => {
  /** @type {URL[]} */
  const calls = [];
  /** @type {typeof fetch} */
  const fakeFetch = async (input) => {
    const url = new URL(String(input));
    calls.push(url);
    const custom = respond?.(url);
    if (custom) return custom;
    return Response.json(synthetic(url));
  };
  return { fetch: fakeFetch, calls };
};

/**
 * @param {{ now?: number, respond?: (url: URL) => Response | undefined, env?: Record<string, string> }} [options]
 */
export const createTestDeps = ({
  now = Date.parse("2026-10-22T08:00:00Z"),
  respond,
  env = {},
} = {}) => {
  const clock = { time: now };
  const nowFn = () => clock.time;
  const fake = createFakeFetch({ respond });
  const history = createMemoryHistory({ now: nowFn });
  const cache = createMemoryCache({ now: nowFn });
  /** @type {unknown[]} */
  const logs = [];
  const deps = createDeps(env, {
    fetch: fake.fetch,
    history,
    cache,
    now: nowFn,
    sleep: async (ms) => {
      clock.time += ms;
    },
    log: (message) => logs.push(message),
  });
  return { deps, history, cache, clock, calls: fake.calls, logs };
};

export const isArchive = (/** @type {URL} */ url) => url.hostname === "archive-api.open-meteo.com";
export const isSingleDay = (/** @type {URL} */ url) =>
  url.searchParams.get("start_date") === url.searchParams.get("end_date");
