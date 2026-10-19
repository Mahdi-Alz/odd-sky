import { describe, expect, it } from "vitest";
import { ACTIVITIES, LABEL_BOUNDS } from "../config/activities.js";
import { FACTOR_SOURCES } from "./derive.js";
import { scoreActivity } from "./engine.js";

const WEIGHT_SOURCES = new Set(FACTOR_SOURCES);

describe("activity config", () => {
  it("has unique ids", () => {
    const ids = ACTIVITIES.map((activity) => activity.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("orders the label bounds", () => {
    expect(LABEL_BOUNDS.great).toBeGreaterThan(LABEL_BOUNDS.good);
    expect(LABEL_BOUNDS.good).toBeGreaterThan(LABEL_BOUNDS.fair);
    expect(LABEL_BOUNDS.fair).toBeGreaterThan(0);
  });

  for (const activity of ACTIVITIES) {
    describe(activity.id, () => {
      it("has factors with known sources and positive weights", () => {
        expect(activity.factors.length).toBeGreaterThan(0);
        for (const factor of activity.factors) {
          expect(WEIGHT_SOURCES.has(factor.source)).toBe(true);
          expect(factor.weight).toBeGreaterThan(0);
        }
      });

      it("has ok ranges that contain the ideal ranges", () => {
        for (const factor of activity.factors) {
          const [idealLow, idealHigh] = factor.ideal;
          const [okLow, okHigh] = factor.ok;
          expect(idealLow).toBeLessThanOrEqual(idealHigh);
          expect(okLow).toBeLessThanOrEqual(idealLow);
          expect(okHigh).toBeGreaterThanOrEqual(idealHigh);
          if (Number.isFinite(idealLow)) expect(okLow).toBeLessThan(idealLow);
          if (Number.isFinite(idealHigh)) expect(okHigh).toBeGreaterThan(idealHigh);
          if (!Number.isFinite(idealLow)) expect(okLow).toBe(idealLow);
          if (!Number.isFinite(idealHigh)) expect(okHigh).toBe(idealHigh);
        }
      });

      it("has vetoes with a known source and a bound", () => {
        for (const veto of activity.vetoes) {
          expect(WEIGHT_SOURCES.has(veto.source)).toBe(true);
          expect(veto.above != null || veto.below != null).toBe(true);
        }
      });

      it("has a whole-horizon duration only with a numeric horizon", () => {
        if (activity.durationHours == null) expect(typeof activity.horizon).toBe("number");
      });
    });
  }
});

/**
 * @param {number} count
 * @param {(index: number) => Record<string, any>} make
 * @returns {any[]}
 */
const hours = (count, make) =>
  Array.from({ length: count }, (_, i) => {
    const day = 19 + Math.floor(i / 24);
    const h = i % 24;
    return {
      time: `2026-10-${String(day).padStart(2, "0")}T${String(h).padStart(2, "0")}:00`,
      temp: 20,
      apparentTemp: 20,
      wind: 10,
      gusts: 15,
      precipProbability: 0,
      precipAmount: 0,
      uv: 3,
      humidity: 40,
      cloud: 10,
      radiation: h >= 6 && h < 18 ? 500 : 0,
      code: 0,
      isDay: h >= 6 && h < 18,
      ...make(i),
    };
  });

/** @param {string} id */
const find = (id) =>
  /** @type {import("../types").ActivityConfig} */ (
    ACTIVITIES.find((activity) => activity.id === id)
  );

describe("shipped activities", () => {
  const fine = hours(48, () => ({}));
  const morning = fine.slice(9);
  /** @param {number} i */
  const night = (i) => ({ cloud: 5, isDay: i % 24 >= 6 && i % 24 < 18 });

  it("rates a calm mild dry day as great for the daytime activities", () => {
    for (const id of ["running", "cycling", "hiking", "picnic", "laundry"]) {
      const result = scoreActivity(find(id), morning, "2026-10-19");
      expect(result.label, id).toBe("great");
      expect(result.window, id).not.toBeNull();
    }
  });

  it("rates a clear dry stretch as great for a car wash", () => {
    const result = scoreActivity(find("carWash"), fine, "2026-10-19");
    expect(result.label).toBe("great");
    expect(result.window).toBeNull();
  });

  it("rates a clear night as great for stargazing and an overcast one as poor", () => {
    const clear = scoreActivity(find("stargazing"), hours(24, night), "2026-10-19");
    expect(clear.label).toBe("great");
    const cloudy = scoreActivity(
      find("stargazing"),
      hours(24, (i) => ({ ...night(i), cloud: 100 })),
      "2026-10-19",
    );
    expect(cloudy.label).toBe("poor");
  });

  it("vetoes a thunderstorm day for every outdoor activity", () => {
    const storm = hours(48, () => ({ code: 95, precipProbability: 90, precipAmount: 4 }));
    for (const activity of ACTIVITIES) {
      const result = scoreActivity(activity, storm, "2026-10-19");
      expect(result.score, activity.id).toBe(0);
      expect(result.window, activity.id).toBeNull();
    }
  });

  it("lowers the car wash score when rain is expected on day two", () => {
    const dryNow = hours(48, (i) => (i >= 30 ? { precipProbability: 80, precipAmount: 2 } : {}));
    const result = scoreActivity(find("carWash"), dryNow, "2026-10-19");
    expect(result.score).toBeLessThan(40);
    expect(result.reasons[0].factor).toMatch(/^precip/);
  });

  it("scores only the hours starting now", () => {
    const wetMorning = hours(24, (i) => (i < 12 ? { precipProbability: 90, precipAmount: 1 } : {}));
    const now = scoreActivity(find("laundry"), wetMorning.slice(9), "2026-10-19");
    expect(now.score).toBe(0);
    expect(now.window?.start).toBeUndefined();
    const later = scoreActivity(find("laundry"), wetMorning.slice(12), "2026-10-19");
    expect(later.window).toEqual({ start: "2026-10-19T12:00", end: "2026-10-19T16:00" });
    expect(later.label).toBe("great");
  });

  it("explains that stargazing waits for dark", () => {
    const result = scoreActivity(find("stargazing"), morning, "2026-10-19");
    expect(result.score).toBe(0);
    expect(result.reasons[0].factor).toBe("darkness");
  });
});

describe("realistic conditions", () => {
  /** @param {number} i */
  const isDay = (i) => i % 24 >= 6 && i % 24 < 18;

  it("does not rule out running after dark", () => {
    const evening = hours(48, () => ({ isDay: false, radiation: 0, uv: 0 })).slice(20, 44);
    const result = scoreActivity(find("running"), evening, "2026-10-19");
    expect(result.score).toBeGreaterThan(60);
  });

  it("rates the dark lower than daylight for hiking", () => {
    const day = scoreActivity(find("hiking"), hours(24, () => ({})).slice(9), "2026-10-19");
    const dark = scoreActivity(
      find("hiking"),
      hours(24, () => ({ isDay: false, radiation: 0 })),
      "2026-10-19",
    );
    expect(dark.score).toBeLessThan(day.score - 20);
    expect(dark.score).toBeGreaterThan(0);
  });

  it("scores laundry on drying power, not daylight alone", () => {
    const sunnyDry = hours(24, () => ({})).slice(9);
    const greyHumid = hours(24, (i) => ({
      humidity: 88,
      cloud: 100,
      wind: 4,
      radiation: isDay(i) ? 120 : 0,
    })).slice(9);
    const windyNight = hours(24, () => ({
      isDay: false,
      radiation: 0,
      humidity: 30,
      wind: 25,
      temp: 22,
    }));
    const sunny = scoreActivity(find("laundry"), sunnyDry, "2026-10-19");
    const grey = scoreActivity(find("laundry"), greyHumid, "2026-10-19");
    const windy = scoreActivity(find("laundry"), windyNight, "2026-10-19");
    expect(sunny.label).toBe("great");
    expect(grey.score).toBeLessThan(40);
    expect(windy.score).toBeGreaterThan(grey.score);
    expect(windy.score).toBeGreaterThan(0);
  });

  it("marks muggy air as a problem for running", () => {
    const muggy = hours(24, () => ({ temp: 29, apparentTemp: 24, humidity: 85 }));
    const result = scoreActivity(find("running"), muggy, "2026-10-19");
    expect(result.reasons[0].factor).toBe("dewPoint");
  });

  it("penalises gusts for cycling", () => {
    const calm = scoreActivity(
      find("cycling"),
      hours(24, () => ({})),
      "2026-10-19",
    );
    const gusty = scoreActivity(
      find("cycling"),
      hours(24, () => ({ gusts: 55 })),
      "2026-10-19",
    );
    expect(gusty.score).toBeLessThan(calm.score - 15);
  });

  it("vetoes freezing rain for running and cycling", () => {
    const ice = hours(48, () => ({ code: 66 }));
    for (const id of ["running", "cycling"]) {
      expect(scoreActivity(find(id), ice, "2026-10-19").score, id).toBe(0);
    }
  });

  it("rates a full moon night lower for stargazing", () => {
    /** @param {number} day */
    const night = (day) =>
      hours(24, (i) => ({
        time: `2026-${day < 0 ? "10-26" : "11-09"}T${String(i).padStart(2, "0")}:00`,
        cloud: 5,
      }));
    const full = scoreActivity(find("stargazing"), night(-1), "2026-10-26");
    const fresh = scoreActivity(find("stargazing"), night(1), "2026-11-09");
    expect(full.score).toBeLessThan(fresh.score);
    expect(full.reasons[0].factor).toBe("moon");
  });
});
