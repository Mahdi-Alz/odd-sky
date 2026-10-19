import { describe, expect, it } from "vitest";
import {
  addHour,
  headlineReasons,
  labelFor,
  scoreActivities,
  scoreActivity,
  scoreLevel,
  scoreRange,
} from "./engine.js";

/** @param {number} value */
const pad = (value) => String(value).padStart(2, "0");

/**
 * @param {number} index
 * @param {Record<string, any>} [overrides]
 * @returns {any}
 */
const hour = (index, overrides = {}) => {
  const day = 19 + Math.floor(index / 24);
  const h = index % 24;
  return {
    time: `2026-10-${pad(day)}T${pad(h)}:00`,
    temp: 20,
    apparentTemp: 20,
    wind: 10,
    precipProbability: 0,
    precipAmount: 0,
    uv: 3,
    humidity: 40,
    cloud: 10,
    code: 0,
    isDay: h >= 6 && h < 18,
    ...overrides,
  };
};

/**
 * @param {number} count
 * @param {number} [start]
 * @param {(index: number) => Record<string, any>} [overrides]
 * @returns {any[]}
 */
const series = (count, start = 0, overrides = () => ({})) =>
  Array.from({ length: count }, (_, i) => hour(start + i, overrides(start + i)));

const LOW = -Infinity;
const HIGH = Infinity;
const DATE = "2026-10-19";

/**
 * @param {Record<string, any>} [overrides]
 * @returns {any}
 */
const probe = (overrides = {}) => ({
  id: "probe",
  light: "any",
  durationHours: 1,
  horizon: "today",
  factors: [{ source: "temp", weight: 1, ideal: [10, 20], ok: [0, 30] }],
  vetoes: [],
  ...overrides,
});

describe("scoreRange", () => {
  it.each([
    [15, 100, "ideal", "within"],
    [10, 100, "ideal", "within"],
    [20, 100, "ideal", "within"],
    [25, 75, "ok", "above"],
    [30, 50, "ok", "above"],
    [35, 25, "bad", "above"],
    [40, 0, "bad", "above"],
    [60, 0, "bad", "above"],
    [5, 75, "ok", "below"],
    [0, 50, "ok", "below"],
    [-5, 25, "bad", "below"],
    [-10, 0, "bad", "below"],
  ])("value %s scores %s (%s, %s)", (value, score, level, side) => {
    expect(scoreRange(value, [10, 20], [0, 30])).toEqual({ score, level, side });
  });

  it("treats an open end as always ideal", () => {
    expect(scoreRange(-100, [LOW, 10], [LOW, 30]).level).toBe("ideal");
    expect(scoreRange(100, [10, HIGH], [0, HIGH]).level).toBe("ideal");
  });

  it("scores zero when the ok range adds nothing beyond ideal", () => {
    expect(scoreRange(21, [10, 20], [10, 20])).toEqual({ score: 0, level: "bad", side: "above" });
  });
});

describe("labelFor", () => {
  it.each([
    [100, "great"],
    [80, "great"],
    [79, "good"],
    [60, "good"],
    [59, "fair"],
    [40, "fair"],
    [39, "poor"],
    [0, "poor"],
  ])("%s is %s", (score, label) => {
    expect(labelFor(score)).toBe(label);
  });
});

describe("scoreLevel", () => {
  it.each([
    [0, 1],
    [1, 2],
    [19, 2],
    [20, 3],
    [39, 3],
    [40, 4],
    [59, 4],
    [60, 5],
    [79, 5],
    [80, 6],
    [100, 6],
  ])("score %s is level %s", (score, level) => {
    expect(scoreLevel(score)).toBe(level);
  });
});

describe("addHour", () => {
  it("moves forward one hour", () => {
    expect(addHour("2026-10-19T09:00")).toBe("2026-10-19T10:00");
  });

  it("rolls over midnight, month and year", () => {
    expect(addHour("2026-10-19T23:00")).toBe("2026-10-20T00:00");
    expect(addHour("2026-12-31T23:00")).toBe("2027-01-01T00:00");
    expect(addHour("2028-02-28T23:00")).toBe("2028-02-29T00:00");
  });
});

describe("best window", () => {
  it("picks the hour with the best score", () => {
    const hours = series(24, 0, (i) => ({ temp: i === 9 ? 15 : 28 }));
    const result = scoreActivity(probe(), hours, DATE);
    expect(result.window).toEqual({ start: "2026-10-19T09:00", end: "2026-10-19T10:00" });
    expect(result.score).toBe(100);
    expect(result.label).toBe("great");
  });

  it("takes the earliest window on a tie", () => {
    const result = scoreActivity(probe(), series(24), DATE);
    expect(result.window?.start).toBe("2026-10-19T00:00");
  });

  it("scores the mean of the values inside a multi-hour window", () => {
    const hours = series(24, 0, (i) => ({ temp: i === 5 ? 15 : i === 6 ? 25 : 15 }));
    const result = scoreActivity(probe({ durationHours: 2 }), hours, DATE);
    expect(result.window?.start).toBe("2026-10-19T00:00");
    expect(result.score).toBe(100);
    const mixed = scoreActivity(
      probe({ durationHours: 2 }),
      series(2, 5, (i) => ({ temp: i === 5 ? 25 : 35 })),
      DATE,
    );
    expect(mixed.score).toBe(50);
  });

  it("weights factors", () => {
    const activity = probe({
      factors: [
        { source: "temp", weight: 3, ideal: [10, 20], ok: [0, 30] },
        { source: "wind", weight: 1, ideal: [LOW, 10], ok: [LOW, 30] },
      ],
    });
    const result = scoreActivity(
      activity,
      series(1, 0, () => ({ temp: 30, wind: 0 })),
      DATE,
    );
    expect(result.score).toBe(63);
  });

  it("ends the window at the following hour", () => {
    const hours = series(24, 0, (i) => ({ temp: i === 23 ? 15 : 28 }));
    const result = scoreActivity(probe(), hours, DATE);
    expect(result.window).toEqual({ start: "2026-10-19T23:00", end: "2026-10-20T00:00" });
  });
});

describe("horizons", () => {
  it("looks only at the local date for today activities", () => {
    const hours = series(30, 18, (i) => ({ temp: i >= 24 ? 15 : 28 }));
    const result = scoreActivity(probe(), hours, DATE);
    expect(result.window?.start.startsWith(DATE)).toBe(true);
    expect(result.score).toBeLessThan(100);
  });

  it("uses a fixed number of hours when the horizon is a number", () => {
    const hours = series(48, 0, (i) => ({ precipAmount: i === 47 ? 20 : 0 }));
    const base = {
      light: "any",
      durationHours: null,
      factors: [
        { source: "precipAmount", aggregate: "sum", weight: 1, ideal: [LOW, 1], ok: [LOW, 4] },
      ],
      vetoes: [],
    };
    expect(scoreActivity(probe({ ...base, horizon: 48 }), hours, DATE).score).toBe(0);
    expect(scoreActivity(probe({ ...base, horizon: 47 }), hours, DATE).score).toBe(100);
  });

  it("returns no window for a whole-horizon activity", () => {
    const activity = probe({ durationHours: null, horizon: 24 });
    expect(scoreActivity(activity, series(48), DATE).window).toBeNull();
  });

  it("reports missing time when too few hours remain", () => {
    const result = scoreActivity(probe({ durationHours: 3 }), series(2, 22), DATE);
    expect(result).toMatchObject({ score: 0, label: "poor", window: null });
    expect(result.reasons[0]).toMatchObject({ factor: "time", side: "below" });
  });

  it("reports missing time when nothing is left today", () => {
    const result = scoreActivity(probe(), series(5, 24), DATE);
    expect(result.reasons[0].factor).toBe("time");
  });
});

describe("daylight", () => {
  it("only uses daylight hours for day activities", () => {
    const hours = series(24, 0, (i) => ({ temp: i < 6 ? 15 : 28 }));
    const result = scoreActivity(probe({ light: "day" }), hours, DATE);
    expect(result.window?.start).toBe("2026-10-19T06:00");
  });

  it("only uses dark hours for night activities", () => {
    const hours = series(24, 0, (i) => ({ temp: i === 12 ? 15 : 28 }));
    const result = scoreActivity(probe({ light: "night" }), hours, DATE);
    expect(result.window?.start).not.toBe("2026-10-19T12:00");
    expect(hours[Number(result.window?.start.slice(11, 13))].isDay).toBe(false);
  });

  it("does not build a window across daylight gaps", () => {
    const hours = series(24, 0, (i) => ({ isDay: i === 8 || i === 10, temp: 15 }));
    const result = scoreActivity(probe({ light: "day", durationHours: 2 }), hours, DATE);
    expect(result.window).toBeNull();
    expect(result.reasons[0].factor).toBe("daylight");
  });

  it("reports no dark hours for night activities", () => {
    const hours = series(24, 0, () => ({ isDay: true }));
    const result = scoreActivity(probe({ light: "night" }), hours, DATE);
    expect(result.reasons[0].factor).toBe("darkness");
  });

  it("reports no daylight when only night remains", () => {
    const result = scoreActivity(probe({ light: "day" }), series(5, 19), DATE);
    expect(result.reasons[0].factor).toBe("daylight");
    expect(result.score).toBe(0);
  });
});

describe("vetoes", () => {
  it("skips windows that break a veto", () => {
    const activity = probe({ vetoes: [{ source: "wind", above: 40 }] });
    const hours = series(24, 0, (i) => ({ wind: i < 12 ? 60 : 5, temp: i < 12 ? 15 : 25 }));
    const result = scoreActivity(activity, hours, DATE);
    expect(result.window?.start).toBe("2026-10-19T12:00");
  });

  it("stays allowed exactly at the veto value", () => {
    const activity = probe({ vetoes: [{ source: "wind", above: 40 }] });
    expect(
      scoreActivity(
        activity,
        series(1, 0, () => ({ wind: 40 })),
        DATE,
      ).window,
    ).not.toBeNull();
    expect(
      scoreActivity(
        activity,
        series(1, 0, () => ({ wind: 40.1 })),
        DATE,
      ).window,
    ).toBeNull();
  });

  it("supports a lower bound", () => {
    const activity = probe({ vetoes: [{ source: "temp", below: 5 }] });
    expect(
      scoreActivity(
        activity,
        series(1, 0, () => ({ temp: 4 })),
        DATE,
      ).window,
    ).toBeNull();
    expect(
      scoreActivity(
        activity,
        series(1, 0, () => ({ temp: 5 })),
        DATE,
      ).window,
    ).not.toBeNull();
  });

  it("checks every hour of a multi-hour window by default", () => {
    const activity = probe({ durationHours: 3, vetoes: [{ source: "wind", above: 40 }] });
    const hours = series(3, 8, (i) => ({ wind: i === 9 ? 50 : 5 }));
    expect(scoreActivity(activity, hours, DATE).window).toBeNull();
  });

  it("vetoes thunderstorm codes", () => {
    const activity = probe({ vetoes: [{ source: "thunder", above: 0 }] });
    expect(
      scoreActivity(
        activity,
        series(1, 0, () => ({ code: 95 })),
        DATE,
      ).window,
    ).toBeNull();
    expect(
      scoreActivity(
        activity,
        series(1, 0, () => ({ code: 82 })),
        DATE,
      ).window,
    ).not.toBeNull();
  });

  it("explains the veto that blocked the most windows", () => {
    const activity = probe({
      vetoes: [
        { source: "wind", above: 40 },
        { source: "precipAmount", above: 2 },
      ],
    });
    const hours = series(4, 8, (i) => ({
      wind: i === 8 ? 60 : 5,
      precipAmount: i === 8 ? 0 : 5,
    }));
    const result = scoreActivity(activity, hours, DATE);
    expect(result).toMatchObject({ score: 0, label: "poor", window: null });
    expect(result.reasons).toEqual([
      { factor: "precipAmount", level: "bad", side: "above", value: 5 },
    ]);
  });

  it("uses the sum for sum-aggregated vetoes", () => {
    const activity = probe({
      durationHours: 3,
      vetoes: [{ source: "precipAmount", aggregate: "sum", above: 1 }],
    });
    const light = series(3, 8, () => ({ precipAmount: 0.3 }));
    const heavy = series(3, 8, () => ({ precipAmount: 0.4 }));
    expect(scoreActivity(activity, light, DATE).window).not.toBeNull();
    expect(scoreActivity(activity, heavy, DATE).window).toBeNull();
  });
});

describe("reasons", () => {
  const activity = probe({
    factors: [
      { source: "temp", weight: 1, ideal: [10, 20], ok: [0, 30] },
      { source: "wind", weight: 3, ideal: [LOW, 10], ok: [LOW, 20] },
      { source: "humidity", weight: 2, ideal: [LOW, 50], ok: [LOW, 80] },
      { source: "cloud", weight: 1, ideal: [LOW, 20], ok: [LOW, 50] },
    ],
  });
  const hours = series(1, 12, () => ({ temp: 15, wind: 40, humidity: 65, cloud: 5 }));

  it("lists bad, then ok, then ideal reasons, heavier factors first", () => {
    const result = scoreActivity(activity, hours, DATE);
    expect(result.reasons.map((r) => [r.factor, r.level, r.side])).toEqual([
      ["wind", "bad", "above"],
      ["humidity", "ok", "above"],
      ["temp", "ideal", "within"],
      ["cloud", "ideal", "within"],
    ]);
    expect(result.reasons[0].value).toBe(40);
  });

  it("shows the problems for a weak score", () => {
    const result = scoreActivity(activity, hours, DATE);
    expect(result.label).not.toBe("great");
    expect(headlineReasons(result).map((r) => r.factor)).toEqual(["wind"]);
  });

  it("shows the strengths for a strong score", () => {
    const calm = series(1, 12, () => ({ temp: 15, wind: 5, humidity: 30, cloud: 5 }));
    const result = scoreActivity(activity, calm, DATE);
    expect(result.label).toBe("great");
    expect(headlineReasons(result).map((r) => r.factor)).toEqual(["wind", "humidity"]);
    expect(headlineReasons(result, 1)).toHaveLength(1);
  });

  it("falls back to ok reasons when nothing is ideal or bad", () => {
    const only = probe({
      factors: [{ source: "temp", weight: 1, ideal: [10, 20], ok: [0, 30] }],
    });
    const result = scoreActivity(
      only,
      series(1, 12, () => ({ temp: 25 })),
      DATE,
    );
    expect(result.label).toBe("good");
    expect(headlineReasons(result)).toHaveLength(1);
  });
});

describe("missing data", () => {
  it("ignores a factor with no finite values", () => {
    const hours = series(1, 12, () => ({ uv: Number.NaN }));
    const activity = probe({
      factors: [
        { source: "temp", weight: 1, ideal: [10, 20], ok: [0, 30] },
        { source: "uv", weight: 5, ideal: [LOW, 3], ok: [LOW, 6] },
      ],
    });
    const result = scoreActivity(activity, hours, DATE);
    expect(result.score).toBe(100);
    expect(result.reasons.map((r) => r.factor)).toEqual(["temp"]);
  });

  it("averages only the finite hours", () => {
    const hours = series(2, 12, (i) => ({ temp: i === 12 ? 15 : Number.NaN }));
    const result = scoreActivity(probe({ durationHours: 2 }), hours, DATE);
    expect(result.score).toBe(100);
  });

  it("does not crash on an empty forecast", () => {
    const result = scoreActivity(probe(), [], DATE);
    expect(result.reasons[0].factor).toBe("time");
  });
});

describe("scoreActivities", () => {
  const hours = series(24, 0, () => ({}));
  const list = [probe({ id: "a" }), probe({ id: "b" }), probe({ id: "c" })];

  it("scores every activity in order", () => {
    const results = scoreActivities(hours, DATE, { activities: list });
    expect(results.map((r) => r.activity)).toEqual(["a", "b", "c"]);
  });

  it("skips switched-off activities", () => {
    const results = scoreActivities(hours, DATE, {
      activities: list,
      enabled: { b: false, c: true },
    });
    expect(results.map((r) => r.activity)).toEqual(["a", "c"]);
  });

  it("uses the shipped activities by default", () => {
    const results = scoreActivities(hours, DATE);
    expect(results.map((r) => r.activity)).toContain("carWash");
  });
});
