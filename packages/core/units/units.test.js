import { describe, expect, it } from "vitest";
import { celsiusToFahrenheit, kmhToMph, toDisplaySpeed, toDisplayTemp } from "./index.js";

describe("units", () => {
  it("converts celsius to fahrenheit", () => {
    expect(celsiusToFahrenheit(0)).toBe(32);
    expect(celsiusToFahrenheit(100)).toBe(212);
    expect(celsiusToFahrenheit(-40)).toBe(-40);
  });

  it("converts km/h to mph", () => {
    expect(kmhToMph(0)).toBe(0);
    expect(kmhToMph(1.609344)).toBeCloseTo(1, 6);
    expect(kmhToMph(100)).toBeCloseTo(62.137, 3);
  });

  it("keeps metric values untouched", () => {
    expect(toDisplayTemp(21.5, "metric")).toBe(21.5);
    expect(toDisplaySpeed(14, "metric")).toBe(14);
  });

  it("converts only for imperial display", () => {
    expect(toDisplayTemp(20, "imperial")).toBe(68);
    expect(toDisplaySpeed(16.09344, "imperial")).toBeCloseTo(10, 6);
  });
});
