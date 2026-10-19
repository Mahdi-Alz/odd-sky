import { describe, expect, it } from "vitest";
import {
  dewPoint,
  evaporationRate,
  moonIllumination,
  readSource,
  saturationPressure,
  vapourPressureDeficit,
} from "./derive.js";

describe("saturationPressure", () => {
  it("matches reference values", () => {
    expect(saturationPressure(0)).toBeCloseTo(0.611, 2);
    expect(saturationPressure(20)).toBeCloseTo(2.34, 1);
    expect(saturationPressure(30)).toBeCloseTo(4.24, 1);
  });
});

describe("dewPoint", () => {
  it("equals the temperature in saturated air", () => {
    expect(dewPoint(18, 100)).toBeCloseTo(18, 1);
  });

  it("matches reference values", () => {
    expect(dewPoint(20, 50)).toBeCloseTo(9.3, 0);
    expect(dewPoint(30, 70)).toBeCloseTo(23.9, 0);
  });

  it("stays finite in bone-dry air", () => {
    expect(Number.isFinite(dewPoint(25, 0))).toBe(true);
  });
});

describe("vapourPressureDeficit", () => {
  it("is zero in saturated air and grows as the air dries", () => {
    expect(vapourPressureDeficit(20, 100)).toBe(0);
    expect(vapourPressureDeficit(20, 30)).toBeGreaterThan(vapourPressureDeficit(20, 60));
  });
});

describe("evaporationRate", () => {
  it("is fast on a sunny, dry, breezy day", () => {
    expect(evaporationRate(25, 40, 15, 700)).toBeGreaterThan(10);
  });

  it("is slow on a calm, humid night", () => {
    expect(evaporationRate(15, 85, 3, 0)).toBeLessThan(1);
  });

  it("still dries with wind and dry air after dark", () => {
    const calm = evaporationRate(18, 35, 2, 0);
    const breezy = evaporationRate(18, 35, 25, 0);
    expect(breezy).toBeGreaterThan(calm);
    expect(breezy).toBeGreaterThan(2);
  });

  it("rises with sunshine, wind and dry air", () => {
    const base = evaporationRate(20, 60, 10, 200);
    expect(evaporationRate(20, 60, 10, 600)).toBeGreaterThan(base);
    expect(evaporationRate(20, 60, 25, 200)).toBeGreaterThan(base);
    expect(evaporationRate(20, 30, 10, 200)).toBeGreaterThan(base);
  });

  it("is NaN when radiation is missing", () => {
    expect(evaporationRate(20, 60, 10, /** @type {any} */ (undefined))).toBeNaN();
  });
});

describe("moonIllumination", () => {
  it("is near zero at a new moon and near one at a full moon", () => {
    expect(moonIllumination("2026-11-09T12:00")).toBeLessThan(0.05);
    expect(moonIllumination("2026-10-26T04:00")).toBeGreaterThan(0.95);
  });

  it("stays between zero and one before the reference new moon", () => {
    const value = moonIllumination("1990-05-01T00:00");
    expect(value).toBeGreaterThanOrEqual(0);
    expect(value).toBeLessThanOrEqual(1);
  });
});

describe("readSource", () => {
  const hour = /** @type {any} */ ({
    time: "2026-10-19T12:00",
    temp: 20,
    humidity: 50,
    wind: 10,
    radiation: 400,
    code: 45,
    isDay: true,
    gusts: 22,
  });

  it("reads raw values", () => {
    expect(readSource(hour, "gusts")).toBe(22);
  });

  it("flags weather code groups", () => {
    expect(readSource(hour, "fog")).toBe(1);
    expect(readSource(hour, "thunder")).toBe(0);
    expect(readSource({ ...hour, code: 66 }, "freezing")).toBe(1);
    expect(readSource({ ...hour, code: 73 }, "snow")).toBe(1);
    expect(readSource({ ...hour, isDay: false }, "daylight")).toBe(0);
  });

  it("derives humidity measures", () => {
    expect(readSource(hour, "dewPoint")).toBeCloseTo(9.3, 0);
    expect(readSource(hour, "evaporation")).toBeGreaterThan(0);
  });
});
