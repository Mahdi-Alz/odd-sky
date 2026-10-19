const LOW = -Infinity;

export const LABEL_BOUNDS = { great: 80, good: 60, fair: 40 };

/** @type {import("../types").ActivityConfig[]} */
export const ACTIVITIES = [
  {
    id: "running",
    light: "day",
    durationHours: 1,
    horizon: "today",
    factors: [
      { source: "apparentTemp", weight: 3, ideal: [5, 18], ok: [-5, 27] },
      { source: "precipProbability", aggregate: "max", weight: 3, ideal: [LOW, 10], ok: [LOW, 40] },
      { source: "precipAmount", weight: 2, ideal: [LOW, 0.1], ok: [LOW, 1] },
      { source: "wind", weight: 2, ideal: [LOW, 20], ok: [LOW, 40] },
      { source: "humidity", weight: 1, ideal: [LOW, 70], ok: [LOW, 90] },
      { source: "uv", weight: 1, ideal: [LOW, 5], ok: [LOW, 8] },
    ],
    vetoes: [
      { source: "thunder", above: 0 },
      { source: "precipAmount", above: 2 },
      { source: "apparentTemp", above: 35 },
      { source: "apparentTemp", aggregate: "min", below: -15 },
    ],
  },
  {
    id: "cycling",
    light: "day",
    durationHours: 2,
    horizon: "today",
    factors: [
      { source: "apparentTemp", weight: 3, ideal: [12, 26], ok: [2, 33] },
      { source: "wind", weight: 3, ideal: [LOW, 15], ok: [LOW, 30] },
      { source: "precipProbability", aggregate: "max", weight: 3, ideal: [LOW, 10], ok: [LOW, 35] },
      { source: "precipAmount", weight: 2, ideal: [LOW, 0.1], ok: [LOW, 1] },
      { source: "uv", weight: 1, ideal: [LOW, 6], ok: [LOW, 9] },
    ],
    vetoes: [
      { source: "thunder", above: 0 },
      { source: "wind", above: 50 },
      { source: "precipAmount", above: 2 },
    ],
  },
  {
    id: "laundry",
    light: "day",
    durationHours: 4,
    horizon: "today",
    factors: [
      { source: "humidity", weight: 3, ideal: [LOW, 55], ok: [LOW, 75] },
      { source: "precipProbability", aggregate: "max", weight: 3, ideal: [LOW, 10], ok: [LOW, 30] },
      { source: "temp", weight: 2, ideal: [18, 35], ok: [8, 42] },
      { source: "wind", weight: 2, ideal: [8, 30], ok: [2, 45] },
      { source: "cloud", weight: 1, ideal: [LOW, 50], ok: [LOW, 85] },
    ],
    vetoes: [
      { source: "thunder", above: 0 },
      { source: "precipProbability", above: 60 },
      { source: "precipAmount", aggregate: "sum", above: 0.3 },
    ],
  },
  {
    id: "hiking",
    light: "day",
    durationHours: 2,
    horizon: "today",
    factors: [
      { source: "apparentTemp", weight: 3, ideal: [8, 24], ok: [-2, 32] },
      { source: "precipProbability", aggregate: "max", weight: 3, ideal: [LOW, 10], ok: [LOW, 40] },
      { source: "precipAmount", weight: 2, ideal: [LOW, 0.1], ok: [LOW, 1.5] },
      { source: "wind", weight: 2, ideal: [LOW, 25], ok: [LOW, 45] },
      { source: "uv", weight: 1, ideal: [LOW, 6], ok: [LOW, 9] },
    ],
    vetoes: [
      { source: "thunder", above: 0 },
      { source: "precipAmount", above: 3 },
      { source: "apparentTemp", above: 38 },
    ],
  },
  {
    id: "picnic",
    light: "day",
    durationHours: 3,
    horizon: "today",
    factors: [
      { source: "apparentTemp", weight: 3, ideal: [18, 28], ok: [12, 34] },
      { source: "precipProbability", aggregate: "max", weight: 3, ideal: [LOW, 5], ok: [LOW, 25] },
      { source: "wind", weight: 2, ideal: [LOW, 15], ok: [LOW, 28] },
      { source: "precipAmount", weight: 2, ideal: [LOW, 0.1], ok: [LOW, 0.5] },
      { source: "cloud", weight: 1, ideal: [LOW, 60], ok: [LOW, 90] },
      { source: "uv", weight: 1, ideal: [LOW, 6], ok: [LOW, 9] },
    ],
    vetoes: [
      { source: "thunder", above: 0 },
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
      { source: "wind", aggregate: "max", weight: 1, ideal: [LOW, 30], ok: [LOW, 50] },
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
    horizon: "today",
    factors: [
      { source: "cloud", weight: 5, ideal: [LOW, 15], ok: [LOW, 50] },
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
