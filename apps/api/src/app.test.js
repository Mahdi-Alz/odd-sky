import { describe, expect, it } from "vitest";
import { createApp } from "./app.js";
import { createTestDeps, isArchive, isSingleDay } from "../test/helpers.js";

const tehran = "/api/facts?lat=35.6892&lon=51.389&tz=Asia%2FTehran";

const setup = (/** @type {Parameters<typeof createTestDeps>[0]} */ options = {}) => {
  const test = createTestDeps(options);
  return { ...test, app: createApp(test.deps) };
};

describe("GET /api/facts", () => {
  it.each([
    ["/api/facts", "missing everything"],
    ["/api/facts?lat=35.7&lon=51.4", "missing tz"],
    ["/api/facts?lat=91&lon=51.4&tz=UTC", "lat out of range"],
    ["/api/facts?lat=35.7&lon=abc&tz=UTC", "lon not a number"],
    ["/api/facts?lat=35.7&lon=51.4&tz=Mars%2FOlympus", "unknown time zone"],
  ])("rejects %s (%s)", async (path) => {
    const { app, calls } = setup();
    const res = await app.request(path);
    expect(res.status).toBe(400);
    expect(calls).toHaveLength(0);
  });

  it("ingests on a miss and serves the second call from cache with no Open-Meteo call", async () => {
    const { app, calls, history } = setup();
    const first = await app.request(tehran);
    expect(first.status).toBe(200);
    expect(first.headers.get("x-cache")).toBe("miss");
    const body = await first.json();
    expect(body).toMatchObject({
      locationKey: "35.7,51.4",
      localDate: "2026-10-22",
      timezone: "Asia/Tehran",
      source: "era5",
      yearsAvailable: 30,
    });
    expect(Array.isArray(body.facts)).toBe(true);
    const archiveDays = calls.filter((url) => isArchive(url) && isSingleDay(url));
    expect(archiveDays).toHaveLength(30);
    expect(archiveDays.every((url) => url.searchParams.get("latitude") === "35.7")).toBe(true);
    expect(history.days.size).toBe(30);

    const before = calls.length;
    const second = await app.request(tehran);
    expect(second.headers.get("x-cache")).toBe("hit");
    expect(await second.json()).toEqual(body);
    expect(calls).toHaveLength(before);
  });

  it("caches until local midnight in the city's time zone", async () => {
    const { app, clock } = setup({ now: Date.parse("2026-10-22T20:00:00Z") });
    const res = await app.request(tehran);
    expect((await res.json()).localDate).toBe("2026-10-22");
    expect(res.headers.get("cache-control")).toBe("private, no-cache");
    clock.time += 29 * 60_000;
    expect((await app.request(tehran)).headers.get("x-cache")).toBe("hit");
    clock.time = Date.parse("2026-10-22T20:30:00Z");
    const next = await app.request(tehran);
    expect((await next.json()).localDate).toBe("2026-10-23");
    expect(next.headers.get("x-cache")).toBe("miss");
  });

  it("recomputes after six hours so a changed forecast shows up", async () => {
    const { app, clock } = setup();
    await app.request(tehran);
    clock.time += 6 * 3600_000 - 1000;
    expect((await app.request(tehran)).headers.get("x-cache")).toBe("hit");
    clock.time += 2000;
    expect((await app.request(tehran)).headers.get("x-cache")).toBe("miss");
  });

  it("uses the city's local date, not the server's", async () => {
    const { app } = setup({ now: Date.parse("2026-10-22T21:00:00Z") });
    const res = await app.request(tehran);
    expect((await res.json()).localDate).toBe("2026-10-23");
  });

  it("lets a nearby city share the stored history", async () => {
    const { app, calls } = setup();
    await app.request(tehran);
    const before = calls.filter(isSingleDay).length;
    await app.request("/api/facts?lat=35.71&lon=51.42&tz=Asia%2FTehran");
    expect(calls.filter(isSingleDay)).toHaveLength(before);
  });

  it("returns no facts and no departure below minYears", async () => {
    const { app } = setup({
      respond: (url) =>
        isSingleDay(url) && Number(url.searchParams.get("start_date")?.slice(0, 4)) < 2022
          ? new Response("bad", { status: 400 })
          : undefined,
    });
    const res = await app.request(tehran);
    const body = await res.json();
    expect(body.yearsAvailable).toBe(4);
    expect(body.facts).toEqual([]);
    expect(body.departure).toBeNull();
  });

  it("keeps partial history in the cache for only ten minutes", async () => {
    const { app, clock } = setup({
      respond: (url) =>
        isSingleDay(url) && url.searchParams.get("start_date")?.startsWith("1999")
          ? new Response("bad", { status: 400 })
          : undefined,
    });
    expect((await (await app.request(tehran)).json()).yearsAvailable).toBe(29);
    clock.time += 9 * 60_000;
    expect((await app.request(tehran)).headers.get("x-cache")).toBe("hit");
    clock.time += 2 * 60_000;
    expect((await app.request(tehran)).headers.get("x-cache")).toBe("miss");
  });

  it("runs the fact engine on today's forecast and the stored history", async () => {
    const { app, calls } = setup({
      respond: (url) =>
        url.hostname === "api.open-meteo.com" && isSingleDay(url)
          ? Response.json({
              daily: {
                time: ["2026-10-22"],
                temperature_2m_max: [31],
                temperature_2m_min: [12],
                apparent_temperature_max: [29],
                relative_humidity_2m_mean: [40],
              },
            })
          : undefined,
    });
    const body = await (await app.request(tehran)).json();
    const today = calls.find((url) => url.hostname === "api.open-meteo.com" && isSingleDay(url));
    expect(today?.searchParams.get("start_date")).toBe("2026-10-22");
    expect(today?.searchParams.get("timezone")).toBe("Asia/Tehran");
    expect(today?.searchParams.get("daily")?.split(",")).toHaveLength(13);
    expect(body.facts[0]).toMatchObject({
      id: "tmax-high",
      years: 30,
      messageKey: "facts.tmaxHighAll",
      params: { years: 30 },
    });
    expect(body.departure).toMatchObject({ variable: "tmax", years: 30 });
    expect(body.departure.delta).toBeGreaterThan(5);
  });

  it("answers 503 when today's forecast cannot be fetched", async () => {
    const { app, cache } = setup({
      respond: (url) =>
        url.hostname === "api.open-meteo.com" && isSingleDay(url)
          ? new Response("down", { status: 500 })
          : undefined,
    });
    const res = await app.request(tehran);
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: "forecast-unavailable" });
    expect(await cache.get("facts:35.7,51.4:2026-10-22:v2")).toBeNull();
  });

  it("answers 503 when no history could be fetched", async () => {
    const { app, cache } = setup({ respond: () => new Response("slow down", { status: 429 }) });
    const res = await app.request(tehran);
    expect(res.status).toBe(503);
    expect(Number(res.headers.get("retry-after"))).toBeGreaterThan(0);
    expect(await cache.get("facts:35.7,51.4:2026-10-22:v2")).toBeNull();
  });

  it("counts weighted Open-Meteo calls in the quota", async () => {
    const { app } = setup();
    await app.request(tehran);
    const health = await (await app.request("/api/health")).json();
    expect(health).toMatchObject({ ok: true, history: "memory", cache: "memory" });
    expect(health.quota.day).toBeCloseTo(31 * 1.3 + 2 * (55 / 14), 1);
  });
});

describe("unknown routes", () => {
  it("answers 404 as JSON", async () => {
    const { app } = setup();
    const res = await app.request("/api/nope");
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "not-found" });
  });
});
