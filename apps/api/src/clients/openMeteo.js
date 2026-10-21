import { callWeight, HISTORY } from "@odd-sky/core";
import { QuotaError, UpstreamError } from "../errors.js";
import { RETRY } from "../config.js";

export const DAILY_VARIABLES = /** @type {const} */ ({
  tmax: "temperature_2m_max",
  tmin: "temperature_2m_min",
  appTmax: "apparent_temperature_max",
  appTmin: "apparent_temperature_min",
  precip: "precipitation_sum",
  rain: "rain_sum",
  snow: "snowfall_sum",
  precipHours: "precipitation_hours",
  windMax: "wind_speed_10m_max",
  gustMax: "wind_gusts_10m_max",
  cloudMean: "cloud_cover_mean",
  rhMean: "relative_humidity_2m_mean",
  sunshine: "sunshine_duration",
});

/** @typedef {keyof typeof DAILY_VARIABLES} DayField */

const ALL_FIELDS = /** @type {DayField[]} */ (Object.keys(DAILY_VARIABLES));

/** @param {string} start @param {string} end */
const daysBetween = (start, end) =>
  Math.round((Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86_400_000) + 1;

/**
 * @param {any} daily
 * @param {readonly DayField[]} fields
 * @returns {import("@odd-sky/core/types").DayStats[]}
 */
const toDays = (daily, fields) =>
  (daily?.time ?? []).map((/** @type {string} */ date, /** @type {number} */ i) => {
    /** @type {Record<string, unknown>} */
    const day = { date };
    for (const field of ALL_FIELDS) {
      const value = fields.includes(field) ? daily[DAILY_VARIABLES[field]]?.[i] : null;
      day[field] = typeof value === "number" ? value : null;
    }
    return /** @type {import("@odd-sky/core/types").DayStats} */ (day);
  });

/** @param {Response} res */
const retryAfterMs = (res) => {
  const header = Number(res.headers.get("retry-after"));
  return Number.isFinite(header) && header > 0 ? header * 1000 : 0;
};

/**
 * @param {{
 *   fetch?: typeof fetch,
 *   limiter: import("./limiter.js").Limiter,
 *   config: import("../config.js").Config["openMeteo"],
 *   sleep?: (ms: number) => Promise<void>,
 * }} options
 */
export const createOpenMeteo = ({
  fetch: fetchImpl = fetch,
  limiter,
  config,
  sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
}) => {
  /** @param {string} url @param {number} weight */
  const request = async (url, weight) => {
    for (let attempt = 1; ; attempt += 1) {
      await limiter.take(weight);
      const res = await fetchImpl(url);
      if (res.ok) return res.json();
      const retryable = res.status === 429 || res.status >= 500;
      if (!retryable || attempt >= RETRY.attempts) {
        if (res.status === 429) throw new QuotaError(retryAfterMs(res) || RETRY.maxDelayMs);
        throw new UpstreamError(res.status);
      }
      const backoff = Math.min(RETRY.baseDelayMs * 2 ** (attempt - 1), RETRY.maxDelayMs);
      await sleep(Math.max(backoff, Math.min(retryAfterMs(res), RETRY.maxDelayMs)));
    }
  };

  /**
   * @param {string} base
   * @param {{ lat: number, lon: number, timezone: string, start: string, end: string }} range
   * @param {readonly DayField[]} fields
   * @param {Record<string, string>} [extra]
   */
  const daily = async (base, { lat, lon, timezone, start, end }, fields, extra = {}) => {
    const params = new URLSearchParams({
      latitude: String(lat),
      longitude: String(lon),
      start_date: start,
      end_date: end,
      daily: fields.map((field) => DAILY_VARIABLES[field]).join(","),
      timezone,
      ...extra,
    });
    if (config.apiKey) params.set("apikey", config.apiKey);
    const weight = callWeight({ variables: fields.length, days: daysBetween(start, end) });
    const data = await request(`${base}?${params}`, weight);
    return toDays(data.daily, fields);
  };

  return {
    /**
     * @param {{ lat: number, lon: number, timezone: string, start: string, end: string }} range
     * @param {readonly DayField[]} [fields]
     */
    archiveDays: (range, fields = ALL_FIELDS) =>
      daily(config.archiveUrl, range, fields, { models: HISTORY.model }),
    /**
     * @param {{ lat: number, lon: number, timezone: string, start: string, end: string }} range
     * @param {readonly DayField[]} fields
     */
    forecastDays: (range, fields) => daily(config.forecastUrl, range, fields),
  };
};

/** @typedef {ReturnType<typeof createOpenMeteo>} OpenMeteo */
