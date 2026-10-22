import { describe, expect, it } from "vitest";
import { createLimiter } from "./limiter.js";
import { createOpenMeteo } from "./openMeteo.js";
import { readConfig } from "../config.js";
import { QuotaError, UpstreamError } from "../errors.js";
import { createMemoryCache } from "../repositories/memoryCache.js";
import { fixture } from "../../test/helpers.js";

const range = {
  lat: 35.7,
  lon: 51.4,
  timezone: "Asia/Tehran",
  start: "2025-10-22",
  end: "2025-10-22",
};

const setup = (/** @type {(url: URL, n: number) => Response} */ respond, env = {}) => {
  /** @type {URL[]} */
  const calls = [];
  /** @type {number[]} */
  const sleeps = [];
  const cache = createMemoryCache();
  const limiter = createLimiter({
    cache,
    limits: { perMinute: 500, perHour: 4000, perDay: 8000, alertShare: 0.8 },
  });
  const client = createOpenMeteo({
    fetch: async (input) => {
      const url = new URL(String(input));
      calls.push(url);
      return respond(url, calls.length);
    },
    limiter,
    config: readConfig(env).openMeteo,
    sleep: async (ms) => {
      sleeps.push(ms);
    },
  });
  return { client, calls, sleeps, limiter };
};

describe("openMeteo archive client", () => {
  it("parses a recorded ERA5 day into DayStats", async () => {
    const { client, calls } = setup(() => Response.json(fixture("archive-tehran-2025-10-22.json")));
    const [day] = await client.archiveDays(range);
    expect(day).toEqual({
      date: "2025-10-22",
      tmax: 25.8,
      tmin: 16.9,
      appTmax: 22.8,
      appTmin: 14.3,
      precip: 0,
      rain: 0,
      snow: 0,
      precipHours: 0,
      windMax: 12,
      gustMax: 37.4,
      cloudMean: 5,
      rhMean: 28,
      sunshine: 38172.24,
    });
    const url = calls[0];
    expect(url.searchParams.get("models")).toBe("era5");
    expect(url.searchParams.get("timezone")).toBe("Asia/Tehran");
    expect(url.searchParams.get("start_date")).toBe("2025-10-22");
    expect(url.searchParams.get("end_date")).toBe("2025-10-22");
    expect(url.searchParams.get("daily")?.split(",")).toHaveLength(13);
    expect(url.searchParams.has("apikey")).toBe(false);
  });

  it("keeps 29 February from a recorded leap year", async () => {
    const { client } = setup(() => Response.json(fixture("archive-oslo-2024-02-29.json")));
    const [day] = await client.archiveDays({ ...range, start: "2024-02-29", end: "2024-02-29" });
    expect(day.date).toBe("2024-02-29");
    expect(day.tmax).toBe(5.4);
  });

  it("sends the api key and uses a custom base url", async () => {
    const { client, calls } = setup(
      () => Response.json(fixture("archive-tehran-2025-10-22.json")),
      {
        OPEN_METEO_API_KEY: "test-key",
        OPEN_METEO_ARCHIVE_URL: "https://customer-archive-api.open-meteo.com/v1/archive",
      },
    );
    await client.archiveDays(range);
    expect(calls[0].hostname).toBe("customer-archive-api.open-meteo.com");
    expect(calls[0].searchParams.get("apikey")).toBe("test-key");
  });

  it("charges the weighted cost to the limiter", async () => {
    const { client, limiter } = setup(() =>
      Response.json(fixture("archive-tehran-2025-10-22.json")),
    );
    await client.archiveDays(range);
    expect((await limiter.usage()).day).toBeCloseTo(1.3);
  });

  it("backs off on 429 and then succeeds", async () => {
    const { client, calls, sleeps } = setup((_, n) =>
      n < 3
        ? new Response("busy", { status: 429, headers: { "retry-after": "2" } })
        : Response.json(fixture("archive-tehran-2025-10-22.json")),
    );
    const [day] = await client.archiveDays(range);
    expect(day.tmax).toBe(25.8);
    expect(calls).toHaveLength(3);
    expect(sleeps).toEqual([2000, 2000]);
  });

  it("gives up after repeated 429s with a QuotaError", async () => {
    const { client, calls, sleeps } = setup(() => new Response("busy", { status: 429 }));
    await expect(client.archiveDays(range)).rejects.toBeInstanceOf(QuotaError);
    expect(calls).toHaveLength(3);
    expect(sleeps).toEqual([1000, 2000]);
  });

  it("does not retry a 400", async () => {
    const { client, calls } = setup(() => new Response("bad", { status: 400 }));
    await expect(client.archiveDays(range)).rejects.toBeInstanceOf(UpstreamError);
    expect(calls).toHaveLength(1);
  });

  it("reads the forecast past days for the bias window", async () => {
    const { client, calls } = setup(() => Response.json(fixture("forecast-tehran-bias.json")));
    const days = await client.forecastDays({ ...range, start: "2026-08-23", end: "2026-10-16" }, [
      "tmax",
      "tmin",
      "appTmax",
      "appTmin",
      "rhMean",
    ]);
    expect(days).toHaveLength(55);
    expect(calls[0].hostname).toBe("api.open-meteo.com");
    expect(calls[0].searchParams.has("models")).toBe(false);
    expect(days.every((d) => d.precip === null)).toBe(true);
  });
});
