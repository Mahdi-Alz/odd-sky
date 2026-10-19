import { describe, expect, it } from "vitest";
import { skyKey, skyKeys } from "./sky.js";
import { weatherCode, weatherCodeList } from "./codes.js";

describe("skyKey", () => {
  it("combines the condition with day or night", () => {
    expect(skyKey("clear", true)).toBe("clear-day");
    expect(skyKey("snow", false)).toBe("snow-night");
  });

  it("treats drizzle as rain", () => {
    expect(skyKey("drizzle", true)).toBe("rain-day");
  });

  it("falls back to cloudy for unknown icons", () => {
    expect(skyKey("tornado", false)).toBe("cloudy-night");
  });

  it("covers every weather code with a known sky", () => {
    for (const code of weatherCodeList) {
      for (const isDay of [true, false]) {
        expect(skyKeys).toContain(skyKey(weatherCode(code).icon, isDay));
      }
    }
  });
});
