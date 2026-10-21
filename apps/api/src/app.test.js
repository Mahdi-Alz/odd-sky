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
    const { app } = setup({ now: Date.parse("2026-10-22T20:00:00Z") });
    const res = await app.request(tehran);
    expect((await res.json()).localDate).toBe("2026-10-22");
    expect(res.headers.get("cache-control")).toBe("private, max-age=1800");
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

  it("returns partial history with a short cache and no facts below minYears", async () => {
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
    expect(res.headers.get("cache-control")).toBe("private, max-age=600");
  });

  it("answers 503 when no history could be fetched", async () => {
    const { app, cache } = setup({ respond: () => new Response("slow down", { status: 429 }) });
    const res = await app.request(tehran);
    expect(res.status).toBe(503);
    expect(Number(res.headers.get("retry-after"))).toBeGreaterThan(0);
    expect(await cache.get("facts:35.7,51.4:2026-10-22:v1")).toBeNull();
  });

  it("counts weighted Open-Meteo calls in the quota", async () => {
    const { app } = setup();
    await app.request(tehran);
    const health = await (await app.request("/api/health")).json();
    expect(health).toMatchObject({ ok: true, history: "memory", cache: "memory" });
    expect(health.quota.day).toBeCloseTo(30 * 1.3 + 2 * (55 / 14), 1);
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
