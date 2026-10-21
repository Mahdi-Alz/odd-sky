import { describe, expect, it } from "vitest";
import { addDays, isValidTimeZone } from "./dates/index.js";
import { biasWindow, callWeight, computeBias, yearsAvailable } from "./history.js";

/** @param {string} date @param {Partial<import("./types.js").DayStats>} values */
const day = (date, values) => ({
  date,
  tmax: null,
  tmin: null,
  appTmax: null,
  appTmin: null,
  precip: null,
  rain: null,
  snow: null,
  precipHours: null,
  windMax: null,
  gustMax: null,
  cloudMean: null,
  rhMean: null,
  sunshine: null,
  ...values,
});

describe("callWeight", () => {
  it.each([
    [{ variables: 5, days: 1 }, 1],
    [{ variables: 13, days: 1 }, 1.3],
    [{ variables: 15, days: 1 }, 1.5],
    [{ variables: 10, days: 28 }, 2],
    [{ variables: 5, days: 55 }, 55 / 14],
  ])("weighs %o as %d calls", (request, expected) => {
    expect(callWeight(request)).toBeCloseTo(expected);
  });
});

describe("addDays", () => {
  it("crosses months, years and leap days", () => {
    expect(addDays("2026-10-22", -60)).toBe("2026-08-23");
    expect(addDays("2024-02-28", 1)).toBe("2024-02-29");
    expect(addDays("2025-02-28", 1)).toBe("2025-03-01");
    expect(addDays("2026-01-01", -1)).toBe("2025-12-31");
  });
});

describe("isValidTimeZone", () => {
  it("accepts IANA names and rejects junk", () => {
    expect(isValidTimeZone("Asia/Tehran")).toBe(true);
    expect(isValidTimeZone("UTC")).toBe(true);
    expect(isValidTimeZone("Mars/Olympus")).toBe(false);
    expect(isValidTimeZone("")).toBe(false);
  });
});

describe("biasWindow", () => {
  it("runs from 60 to 6 days back", () => {
    expect(biasWindow("2026-10-22")).toEqual({ start: "2026-08-23", end: "2026-10-16" });
  });
});

describe("computeBias", () => {
  const dates = Array.from({ length: 30 }, (_, i) => addDays("2026-09-01", i));

  it("averages forecast minus archive per variable", () => {
    const forecast = dates.map((date, i) => day(date, { tmax: 30 + (i % 2), rhMean: 40 }));
    const archive = dates.map((date) => day(date, { tmax: 29, rhMean: 42 }));
    expect(computeBias(forecast, archive, ["tmax", "rhMean"])).toEqual([
      { variable: "tmax", offset: 1.5, nDays: 30 },
      { variable: "rhMean", offset: -2, nDays: 30 },
    ]);
  });

  it("skips days missing on either side and drops thin variables", () => {
    const forecast = dates.map((date, i) => day(date, { tmax: i < 10 ? null : 20, tmin: 5 }));
    const archive = dates.map((date) => day(date, { tmax: 19, tmin: 4 }));
    expect(computeBias(forecast, archive, ["tmax", "tmin"])).toEqual([
      { variable: "tmax", offset: 1, nDays: 20 },
      { variable: "tmin", offset: 1, nDays: 30 },
    ]);
    const thin = forecast.slice(0, 25);
    expect(computeBias(thin, archive, ["tmax"])).toEqual([]);
  });
});

describe("yearsAvailable", () => {
  it("counts distinct years inside the window", () => {
    expect(yearsAvailable("2026-10-22", ["2025-10-22", "2024-10-22", "1990-10-22"], 30)).toBe(2);
    expect(yearsAvailable("2026-10-22", [], 30)).toBe(0);
  });
});
