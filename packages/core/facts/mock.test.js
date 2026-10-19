import { describe, expect, it } from "vitest";
import { mockFactsResponse, mockFixtures, mockVariantFor, mockVariants } from "./mock.js";

const base = { lat: 35.7, lon: 51.4, timezone: "Asia/Tehran", localDate: "2026-10-19" };

describe("mockFactsResponse", () => {
  it("returns the FactsResponse shape", () => {
    const response = mockFactsResponse({ ...base, variant: "three" });
    expect(response).toMatchObject({
      locationKey: "35.7,51.4",
      localDate: "2026-10-19",
      timezone: "Asia/Tehran",
      source: "era5",
      yearsAvailable: 30,
    });
    expect(response.facts).toHaveLength(3);
  });

  it("covers three facts, one fact and none", () => {
    expect(mockFixtures.three).toHaveLength(3);
    expect(mockFixtures.one).toHaveLength(1);
    expect(mockFixtures.none).toHaveLength(0);
  });

  it("never puts display text or dates in a fact", () => {
    for (const fact of Object.values(mockFixtures).flat()) {
      expect(fact.messageKey).toMatch(/^facts\./);
      expect(Object.keys(fact.params)).not.toContain("date");
      expect(Object.keys(fact.params)).not.toContain("year");
      expect(Number.isInteger(fact.years)).toBe(true);
    }
  });

  it("is deterministic for the same place", () => {
    expect(mockFactsResponse(base)).toEqual(mockFactsResponse(base));
  });

  it("spreads places across the variants", () => {
    const seen = new Set();
    for (let lat = 0; lat < 10; lat += 0.1) seen.add(mockVariantFor(lat, 0));
    expect([...seen].sort()).toEqual([...mockVariants].sort());
  });

  it("returns copies so callers cannot change the fixtures", () => {
    const response = mockFactsResponse({ ...base, variant: "one" });
    response.facts[0].params.years = 99;
    expect(mockFixtures.one[0].params.years).toBe(11);
  });
});
