import { locationKey } from "../location.js";

/** @type {import("../types.js").Fact} */
const warmestDay = {
  id: "tmax-high",
  detector: "tmax-high",
  family: "temperature",
  kind: "record-high",
  variable: "tmax",
  years: 14,
  value: 29,
  previous: { value: 28.4, yearsAgo: 14 },
  unit: "C",
  score: 8.4,
  confidence: "high",
  messageKey: "facts.warmestDay",
  params: { years: 14 },
};

/** @type {import("../types.js").Fact} */
const warmestNight = {
  id: "tmin-high",
  detector: "tmin-high",
  family: "night-temperature",
  kind: "record-high",
  variable: "tmin",
  years: 9,
  value: 18,
  previous: { value: 17.6, yearsAgo: 9 },
  unit: "C",
  score: 6.1,
  confidence: "medium",
  messageKey: "facts.warmestNight",
  params: { years: 9 },
};

/** @type {import("../types.js").Fact} */
const wettestDay = {
  id: "precip-high",
  detector: "precip-high",
  family: "precipitation",
  kind: "record-high",
  variable: "precip",
  years: 22,
  value: 12.4,
  previous: { value: 11.9, yearsAgo: 22 },
  unit: "mm",
  score: 7.3,
  confidence: "high",
  messageKey: "facts.wettestDay",
  params: { years: 22 },
};

/** @type {import("../types.js").Fact} */
const coolestDay = {
  id: "tmax-low",
  detector: "tmax-low",
  family: "temperature",
  kind: "record-low",
  variable: "tmax",
  years: 11,
  value: 4,
  previous: { value: 4.6, yearsAgo: 11 },
  unit: "C",
  score: 6.8,
  confidence: "high",
  messageKey: "facts.coolestDay",
  params: { years: 11 },
};

export const mockFixtures = {
  three: [warmestDay, warmestNight, wettestDay],
  one: [coolestDay],
  none: [],
};

export const mockVariants = /** @type {const} */ (["three", "one", "none"]);

/**
 * @param {number} lat
 * @param {number} lon
 */
export const mockVariantFor = (lat, lon) => {
  const seed = Math.abs(Math.round(lat * 10) + Math.round(lon * 10));
  return mockVariants[seed % mockVariants.length];
};

/**
 * @param {{ lat: number, lon: number, timezone: string, localDate: string, variant?: keyof typeof mockFixtures }} input
 * @returns {import("../types.js").FactsResponse}
 */
export const mockFactsResponse = ({ lat, lon, timezone, localDate, variant }) => ({
  locationKey: locationKey(lat, lon),
  localDate,
  timezone,
  source: "era5",
  yearsAvailable: 30,
  facts: mockFixtures[variant ?? mockVariantFor(lat, lon)].map((fact) => ({
    ...fact,
    params: { ...fact.params },
  })),
});
