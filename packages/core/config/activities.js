const LOW = -Infinity;
const HIGH = Infinity;

export const LABEL_BOUNDS = { great: 80, good: 60, fair: 40 };

export const SCORING = { badFactorDrag: 0.8 };

/** @type {import("../types").ActivityConfig[]} */
export const ACTIVITIES = [
  {
    id: "running",
    light: "any",
    durationHours: 1,
    horizon: 1,
    factors: [
      { source: "apparentTemp", weight: 3, ideal: [6, 17], ok: [-4, 26] },
      { source: "dewPoint", weight: 2, ideal: [LOW, 13], ok: [LOW, 20] },
      { source: "precipProbability", aggregate: "max", weight: 2, ideal: [LOW, 15], ok: [LOW, 50] },
      { source: "precipAmount", weight: 2, ideal: [LOW, 0.2], ok: [LOW, 1.5] },
      { source: "wind", weight: 1, ideal: [LOW, 20], ok: [LOW, 40] },
      { source: "gusts", aggregate: "max", weight: 1, ideal: [LOW, 35], ok: [LOW, 60] },
      { source: "uv", aggregate: "max", weight: 1, ideal: [LOW, 5], ok: [LOW, 8] },
      { source: "snow", weight: 1, ideal: [LOW, 0], ok: [LOW, 1] },
      { source: "daylight", weight: 1, ideal: [1, HIGH], ok: [0, HIGH] },
    ],
    vetoes: [
      { source: "thunder", above: 0 },
      { source: "freezing", above: 0 },
      { source: "precipAmount", above: 4 },
      { source: "gusts", above: 75 },
      { source: "apparentTemp", above: 35 },
      { source: "apparentTemp", aggregate: "min", below: -20 },
    ],
  },
  {
    id: "cycling",
    light: "any",
    durationHours: 2,
    horizon: 2,
    factors: [
      { source: "apparentTemp", weight: 3, ideal: [12, 25], ok: [2, 32] },
      { source: "wind", weight: 3, ideal: [LOW, 15], ok: [LOW, 30] },
      { source: "precipProbability", aggregate: "max", weight: 3, ideal: [LOW, 10], ok: [LOW, 35] },
      { source: "gusts", aggregate: "max", weight: 3, ideal: [LOW, 25], ok: [LOW, 45] },
      { source: "precipAmount", weight: 2, ideal: [LOW, 0.1], ok: [LOW, 1] },
      { source: "daylight", weight: 2, ideal: [1, HIGH], ok: [0, HIGH] },
      { source: "fog", weight: 2, ideal: [LOW, 0], ok: [LOW, 1] },
      { source: "snow", weight: 2, ideal: [LOW, 0], ok: [LOW, 0.5] },
      { source: "dewPoint", weight: 1, ideal: [LOW, 15], ok: [LOW, 21] },
      { source: "uv", aggregate: "max", weight: 1, ideal: [LOW, 6], ok: [LOW, 9] },
    ],
    vetoes: [
      { source: "thunder", above: 0 },
      { source: "freezing", above: 0 },
      { source: "wind", above: 50 },
      { source: "gusts", above: 60 },
      { source: "precipAmount", above: 3 },
    ],
  },
  {
    id: "laundry",
    light: "any",
    durationHours: 4,
    horizon: 4,
    factors: [
      { source: "evaporation", weight: 6, ideal: [8, HIGH], ok: [5, HIGH] },
      { source: "precipProbability", aggregate: "max", weight: 3, ideal: [LOW, 10], ok: [LOW, 30] },
      { source: "temp", aggregate: "min", weight: 1, ideal: [5, HIGH], ok: [-2, HIGH] },
      { source: "gusts", aggregate: "max", weight: 1, ideal: [LOW, 35], ok: [LOW, 55] },
    ],
    vetoes: [
      { source: "thunder", above: 0 },
      { source: "precipProbability", above: 60 },
      { source: "precipAmount", aggregate: "sum", above: 0.3 },
    ],
  },
  {
    id: "hiking",
    light: "any",
    durationHours: 3,
    horizon: 3,
    factors: [
      { source: "apparentTemp", weight: 3, ideal: [8, 24], ok: [-2, 32] },
      { source: "precipProbability", aggregate: "max", weight: 3, ideal: [LOW, 10], ok: [LOW, 40] },
      { source: "daylight", weight: 3, ideal: [1, HIGH], ok: [0.5, HIGH] },
      { source: "precipAmount", weight: 2, ideal: [LOW, 0.1], ok: [LOW, 1.5] },
      { source: "gusts", aggregate: "max", weight: 2, ideal: [LOW, 40], ok: [LOW, 65] },
      { source: "fog", weight: 1, ideal: [LOW, 0], ok: [LOW, 1] },
      { source: "dewPoint", weight: 1, ideal: [LOW, 16], ok: [LOW, 22] },
      { source: "uv", aggregate: "max", weight: 1, ideal: [LOW, 6], ok: [LOW, 9] },
    ],
    vetoes: [
      { source: "thunder", above: 0 },
      { source: "freezing", above: 0 },
      { source: "precipAmount", above: 3 },
      { source: "gusts", above: 80 },
      { source: "apparentTemp", above: 38 },
    ],
  },
  {
    id: "picnic",
    light: "any",
    durationHours: 3,
    horizon: 3,
    factors: [
      { source: "daylight", weight: 4, ideal: [1, HIGH], ok: [0.5, HIGH] },
      { source: "apparentTemp", weight: 3, ideal: [18, 28], ok: [12, 34] },
      { source: "precipProbability", aggregate: "max", weight: 3, ideal: [LOW, 5], ok: [LOW, 25] },
      { source: "wind", weight: 2, ideal: [LOW, 15], ok: [LOW, 28] },
      { source: "precipAmount", weight: 2, ideal: [LOW, 0.1], ok: [LOW, 0.5] },
      { source: "gusts", aggregate: "max", weight: 1, ideal: [LOW, 30], ok: [LOW, 50] },
      { source: "cloud", weight: 1, ideal: [LOW, 60], ok: [LOW, 90] },
      { source: "dewPoint", weight: 1, ideal: [LOW, 16], ok: [LOW, 21] },
      { source: "uv", aggregate: "max", weight: 1, ideal: [LOW, 6], ok: [LOW, 9] },
    ],
    vetoes: [
      { source: "thunder", above: 0 },
      { source: "freezing", above: 0 },
      { source: "precipProbability", above: 60 },
      { source: "wind", above: 40 },
    ],
  },
  {
    id: "carWash",
    light: "any",
    durationHours: null,
    horizon: 48,
    factors: [
      { source: "precipProbability", aggregate: "max", weight: 3, ideal: [LOW, 10], ok: [LOW, 35] },
      { source: "precipAmount", aggregate: "sum", weight: 3, ideal: [LOW, 0.2], ok: [LOW, 1.5] },
      { source: "temp", aggregate: "min", weight: 1, ideal: [5, HIGH], ok: [-2, HIGH] },
      { source: "gusts", aggregate: "max", weight: 1, ideal: [LOW, 40], ok: [LOW, 70] },
    ],
    vetoes: [
      { source: "thunder", above: 0 },
      { source: "precipAmount", aggregate: "sum", above: 3 },
    ],
  },
  {
    id: "stargazing",
    light: "night",
    durationHours: 2,
    horizon: 2,
    factors: [
      { source: "cloud", weight: 5, ideal: [LOW, 15], ok: [LOW, 50] },
      { source: "fog", weight: 3, ideal: [LOW, 0], ok: [LOW, 1] },
      { source: "moon", weight: 2, ideal: [LOW, 0.3], ok: [LOW, 0.75] },
      { source: "precipProbability", aggregate: "max", weight: 2, ideal: [LOW, 5], ok: [LOW, 25] },
      { source: "humidity", weight: 1, ideal: [LOW, 70], ok: [LOW, 90] },
      { source: "wind", weight: 1, ideal: [LOW, 20], ok: [LOW, 40] },
      { source: "apparentTemp", weight: 1, ideal: [5, 28], ok: [-5, 35] },
    ],
    vetoes: [
      { source: "thunder", above: 0 },
      { source: "precipProbability", above: 60 },
      { source: "cloud", aggregate: "mean", above: 85 },
    ],
  },
];
