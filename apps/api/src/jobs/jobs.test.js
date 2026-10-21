import { describe, expect, it } from "vitest";
import { historyDates } from "@odd-sky/core";
import { ingestHistory } from "./ingestHistory.js";
import { refreshBias } from "./refreshBias.js";
import { createTestDeps, fixture, isArchive, isSingleDay } from "../../test/helpers.js";

const location = { key: "35.7,51.4", lat: 35.7, lon: 51.4, timezone: "Asia/Tehran" };
const localDate = "2026-10-22";
const dates = historyDates(localDate, 30).map((t) => t.date);

describe("ingestHistory", () => {
  it("fetches all 30 years once, one request per year, then nothing", async () => {
    const { deps, history, calls } = createTestDeps();
    const first = await ingestHistory(deps, { location, localDate });
    expect(first).toMatchObject({ fetched: 30, failed: 0, error: null });
    expect(calls).toHaveLength(30);
    expect(calls.every((url) => isArchive(url) && isSingleDay(url))).toBe(true);
    expect((await history.storedDates(location.key, dates)).sort()).toEqual([...dates].sort());

    const second = await ingestHistory(deps, { location, localDate });
    expect(second.fetched).toBe(0);
    expect(calls).toHaveLength(30);
  });

  it("only fetches the missing years", async () => {
    const { deps, history, calls } = createTestDeps();
    await history.saveDays(location.key, [
      { ...fixtureDay(), date: "2025-10-22" },
      { ...fixtureDay(), date: "2010-10-22" },
    ]);
    const result = await ingestHistory(deps, { location, localDate });
    expect(result.fetched).toBe(28);
    const fetched = calls.map((url) => url.searchParams.get("start_date"));
    expect(fetched).not.toContain("2025-10-22");
    expect(fetched).not.toContain("2010-10-22");
  });

  it("shares one run between concurrent callers", async () => {
    const { deps, calls } = createTestDeps();
    const [a, b] = await Promise.all([
      ingestHistory(deps, { location, localDate }),
      ingestHistory(deps, { location, localDate }),
    ]);
    expect(a).toBe(b);
    expect(calls).toHaveLength(30);
  });

  it("waits instead of fetching while another instance holds the lock", async () => {
    const { deps, cache, calls } = createTestDeps();
    await cache.set(`lock:ingest:${location.key}:10-22`, 1, 5_000);
    const result = await ingestHistory(deps, { location, localDate });
    expect(result).toMatchObject({ fetched: 0, waited: true });
    expect(calls).toHaveLength(0);
  });

  it("releases the lock and keeps what it got when some years fail", async () => {
    const { deps, cache, history } = createTestDeps({
      respond: (url) =>
        url.searchParams.get("start_date")?.startsWith("199")
          ? new Response("bad", { status: 400 })
          : undefined,
    });
    const result = await ingestHistory(deps, { location, localDate });
    expect(result.failed).toBe(4);
    expect(result.fetched).toBe(26);
    expect(await history.storedDates(location.key, dates)).toHaveLength(26);
    expect(await cache.get(`lock:ingest:${location.key}:10-22`)).toBeNull();
  });

  it("stops early when the quota runs out", async () => {
    const { deps, calls } = createTestDeps({
      respond: () => new Response("slow down", { status: 429 }),
    });
    const result = await ingestHistory(deps, { location, localDate });
    expect(result.fetched).toBe(0);
    expect(result.error?.name).toBe("QuotaError");
    expect(calls.length).toBeLessThan(30 * 3);
  });

  it("maps 29 February to 28 February in non-leap years", async () => {
    const { deps, calls } = createTestDeps();
    await ingestHistory(deps, { location, localDate: "2028-02-29" });
    const fetched = calls.map((url) => url.searchParams.get("start_date"));
    expect(fetched).toContain("2024-02-29");
    expect(fetched).toContain("2027-02-28");
    expect(fetched).not.toContain("2027-02-29");
  });
});

describe("refreshBias", () => {
  const respond = (/** @type {URL} */ url) =>
    Response.json(
      fixture(isArchive(url) ? "archive-tehran-bias.json" : "forecast-tehran-bias.json"),
    );

  it("computes offsets from recorded data and reuses them for a week", async () => {
    const { deps, calls, clock } = createTestDeps({ respond });
    const first = await refreshBias(deps, { location, localDate });
    expect(first.refreshed).toBe(true);
    expect(first.offsets.map((o) => o.variable)).toEqual([
      "tmax",
      "tmin",
      "appTmax",
      "appTmin",
      "rhMean",
    ]);
    for (const offset of first.offsets) {
      expect(offset.nDays).toBeGreaterThanOrEqual(20);
      expect(Math.abs(offset.offset)).toBeLessThan(15);
    }
    const [archiveCall] = calls.filter(isArchive);
    expect(archiveCall.searchParams.get("start_date")).toBe("2026-08-23");
    expect(archiveCall.searchParams.get("end_date")).toBe("2026-10-16");
    expect(calls).toHaveLength(2);

    clock.time += 6 * 86_400_000;
    expect((await refreshBias(deps, { location, localDate })).refreshed).toBe(false);
    clock.time += 2 * 86_400_000;
    expect((await refreshBias(deps, { location, localDate })).refreshed).toBe(true);
    expect(calls).toHaveLength(4);
  });
});

function fixtureDay() {
  return {
    date: "",
    tmax: 25,
    tmin: 15,
    appTmax: 24,
    appTmin: 13,
    precip: 0,
    rain: 0,
    snow: 0,
    precipHours: 0,
    windMax: 10,
    gustMax: 30,
    cloudMean: 10,
    rhMean: 30,
    sunshine: 36000,
  };
}
