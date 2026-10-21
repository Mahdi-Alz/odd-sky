import { Hono } from "hono";
import {
  FACTS,
  HISTORY,
  historyDates,
  isValidTimeZone,
  localDateIn,
  locationKey,
  mockFactsResponse,
  msUntilLocalMidnight,
  yearsAvailable,
} from "@odd-sky/core";
import { FACTS_CACHE } from "../config.js";
import { QuotaError } from "../errors.js";
import { ingestHistory } from "../jobs/ingestHistory.js";
import { refreshBias } from "../jobs/refreshBias.js";

/** @param {string | undefined} value @param {number} limit */
const coordinate = (value, limit) => {
  if (value === undefined || value.trim() === "") return null;
  const number = Number(value);
  return Number.isFinite(number) && Math.abs(number) <= limit ? number : null;
};

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
      c.header("cache-control", `private, max-age=${Math.floor(untilMidnight / 1000)}`);
      return c.json(cached);
    }

    const location = await deps.history.saveLocation({
      key,
      lat: Number(lat.toFixed(1)),
      lon: Number(lon.toFixed(1)),
      timezone: tz,
    });
    const [ingest] = await Promise.allSettled([
      ingestHistory(deps, { location, localDate }),
      refreshBias(deps, { location, localDate }).catch((error) => {
        deps.log("bias refresh failed", error);
      }),
    ]);
    const ingestError = ingest.status === "rejected" ? ingest.reason : (ingest.value.error ?? null);
    if (ingestError) deps.log("history ingestion failed", ingestError);

    const dates = historyDates(localDate, HISTORY.years).map((target) => target.date);
    const years = yearsAvailable(
      localDate,
      await deps.history.storedDates(key, dates),
      HISTORY.years,
    );
    if (years === 0) {
      const retryAfter = ingestError instanceof QuotaError ? ingestError.retryAfterMs : 60_000;
      c.header("retry-after", String(Math.ceil(retryAfter / 1000)));
      return c.json({ error: "history-unavailable" }, 503);
    }

    const mock = mockFactsResponse({ lat, lon, timezone: tz, localDate });
    /** @type {import("@odd-sky/core/types").FactsResponse} */
    const response = {
      ...mock,
      yearsAvailable: years,
      facts: years >= FACTS.minYears ? mock.facts : [],
    };
    const ttl =
      years === HISTORY.years ? untilMidnight : Math.min(FACTS_CACHE.partialTtlMs, untilMidnight);
    await deps.cache.set(cacheKey, response, ttl);
    c.header("x-cache", "miss");
    c.header("cache-control", `private, max-age=${Math.floor(ttl / 1000)}`);
    return c.json(response);
  });

  return route;
};
