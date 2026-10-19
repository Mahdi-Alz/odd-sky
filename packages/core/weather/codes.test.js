import { describe, expect, it } from "vitest";
import { weatherCode, weatherCodeList } from "./codes.js";

describe("weatherCode", () => {
  it("maps a known code to an icon and a message key", () => {
    expect(weatherCode(63)).toEqual({ labelKey: "weather.63", icon: "rain" });
    expect(weatherCode(0)).toEqual({ labelKey: "weather.0", icon: "clear" });
  });

  it("falls back for unknown codes", () => {
    expect(weatherCode(1234)).toEqual({ labelKey: "weather.unknown", icon: "cloudy" });
  });

  it("lists every known code", () => {
    expect(weatherCodeList).toContain(95);
    expect(weatherCodeList).toHaveLength(28);
  });
});
