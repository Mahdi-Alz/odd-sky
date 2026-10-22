import { Hono } from "hono";
import {
  HISTORY,
  historyDates,
  isValidTimeZone,
  localDateIn,
  locationKey,
  msUntilLocalMidnight,
  runFacts,
  yearsAvailable,
} from "@odd-sky/core";
import { FACTS_CACHE, RATE_LIMIT } from "../config.js";
import { QuotaError } from "../errors.js";
import { ingestHistory } from "../jobs/ingestHistory.js";
import { refreshBias } from "../jobs/refreshBias.js";
import { computeLimit, tooMany } from "../middleware/rateLimit.js";

/** @param {string | undefined} value @param {number} limit */
const coordinate = (value, limit) => {
  if (value === undefined || value.trim() === "") return null;
  const number = Number(value);
  return Number.isFinite(number) && Math.abs(number) <= limit ? number : null;
};

/** @param {unknown} reason */
const retryAfterSeconds = (reason) =>
  Math.ceil((reason instanceof QuotaError ? reason.retryAfterMs : 60_000) / 1000);

/** @param {import("../deps.js").Deps} deps */
export const factsRoute = (deps) => {
  const route = new Hono();

  route.get("/", async (c) => {
    const lat = coordinate(c.req.query("lat"), 90);
    const lon = coordinate(c.req.query("lon"), 180);
    const tz = c.req.query("tz") ?? "";
    if (lat === null || lon === null || !isValidTimeZone(tz)) {
      return c.json({ error: "bad-request" }, 400);
    }

    const now = new Date(deps.now());
    const key = locationKey(lat, lon);
    const localDate = localDateIn(tz, now);
    const cacheKey = `facts:${key}:${localDate}:${FACTS_CACHE.version}`;
    const untilMidnight = msUntilLocalMidnight(tz, now);

    const cached = await deps.cache.get(cacheKey);
    if (cached) {
      c.header("x-cache", "hit");
      c.header("cache-control", "private, no-cache");
      return c.json(cached);
    }

    const budget = await computeLimit(deps, c, RATE_LIMIT.computesPerHour);
    if (!budget.allowed) return tooMany(c, budget.retryAfterSeconds);

    const location = await deps.history.saveLocation({
      key,
      lat: Number(lat.toFixed(1)),
      lon: Number(lon.toFixed(1)),
      timezone: tz,
    });
    const [ingest, bias, today] = await Promise.allSettled([
      ingestHistory(deps, { location, localDate }),
      refreshBias(deps, { location, localDate }),
      deps.openMeteo.forecastDays({
        lat: location.lat,
        lon: location.lon,
        timezone: tz,
        start: localDate,
        end: localDate,
      }),
    ]);
    const ingestError = ingest.status === "rejected" ? ingest.reason : ingest.value.error;
    if (ingestError) deps.log("history ingestion failed", ingestError);
    if (bias.status === "rejected") deps.log("bias refresh failed", bias.reason);

    const dates = historyDates(localDate, HISTORY.years).map((target) => target.date);
    const history = await deps.history.getDays(key, dates);
    const years = yearsAvailable(
      localDate,
      history.map((day) => day.date),
      HISTORY.years,
    );
    const todayStats = today.status === "fulfilled" ? today.value[0] : undefined;
    if (years === 0 || !todayStats) {
      if (today.status === "rejected") deps.log("today's forecast failed", today.reason);
      const reason = today.status === "rejected" ? today.reason : ingestError;
      c.header("retry-after", String(retryAfterSeconds(reason)));
      return c.json({ error: years === 0 ? "history-unavailable" : "forecast-unavailable" }, 503);
    }

    const offsets =
      bias.status === "fulfilled" ? bias.value.offsets : (await deps.history.getBias(key)).offsets;
    const { facts, departure } = runFacts({ today: todayStats, history, bias: offsets, localDate });
    /** @type {import("@odd-sky/core/types").FactsResponse} */
    const response = {
      locationKey: key,
      localDate,
      timezone: tz,
      source: "era5",
      yearsAvailable: years,
      facts,
      departure,
    };
    const ttl = Math.min(
      years === HISTORY.years ? FACTS_CACHE.maxTtlMs : FACTS_CACHE.partialTtlMs,
      untilMidnight,
    );
    await deps.cache.set(cacheKey, response, ttl);
    c.header("x-cache", "miss");
    c.header("cache-control", "private, no-cache");
    return c.json(response);
  });

  return route;
};
