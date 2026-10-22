import {
  CONTRAST,
  DAY_STATES,
  DRY_DETECTORS,
  FACT_SCORING,
  FIRST_DETECTORS,
  LAST_YEAR,
  RARE_DETECTORS,
  RECORD_DETECTORS,
} from "../config/facts.js";
import { byYearsAgo, round1, standardDeviation, valueOf } from "./values.js";

/**
 * @param {import("../types.js").DayStats[]} history
 * @param {import("../types.js").DetectorContext} ctx
 * @param {import("../types.js").FactVariable} variable
 * @param {(value: number) => boolean} stops
 */
const walk = (history, ctx, variable, stops) => {
  const years = byYearsAgo(ctx.localDate, history);
  /** @type {number[]} */
  const passed = [];
  for (let ago = 1; ago <= ctx.historyYears; ago += 1) {
    const day = years.get(ago);
    const value = day ? valueOf(day, variable) : null;
    if (value === null) return { passed, stop: /** @type {const} */ ("gap"), previous: null };
    if (stops(value))
      return { passed, stop: /** @type {const} */ ("found"), previous: { value, yearsAgo: ago } };
    passed.push(value);
  }
  return { passed, stop: /** @type {const} */ ("end"), previous: null };
};

/** @param {string} key @param {boolean} all */
const keyFor = (key, all) => (all ? `${key}All` : key);

/**
 * @param {import("../types.js").RecordDetectorConfig} config
 * @returns {import("../types.js").Detector}
 */
export const recordDetector = (config) => ({
  id: config.id,
  family: config.family,
  variable: config.variable,
  messageKeys: [config.messageKey, keyFor(config.messageKey, true)],
  detect(today, history, ctx) {
    const value = valueOf(today, config.variable);
    if (value === null) return null;
    if (config.min !== undefined && value < config.min) return null;
    if (config.max !== undefined && value > config.max) return null;
    const sign = config.direction === "high" ? 1 : -1;
    const beats = (/** @type {number} */ past) => (value - past) * sign >= config.margin;
    const { passed, stop, previous } = walk(history, ctx, config.variable, (past) => !beats(past));
    if (!passed.length) return null;
    const extreme = sign > 0 ? Math.max(...passed) : Math.min(...passed);
    const gap = (value - extreme) * sign;
    const all = history.map((day) => valueOf(day, config.variable)).filter((v) => v !== null);
    const spread = standardDeviation(/** @type {number[]} */ (all));
    return {
      detector: config.id,
      family: config.family,
      kind: sign > 0 ? "record-high" : "record-low",
      variable: config.variable,
      years: passed.length,
      value: round1(value),
      previous: previous && { value: round1(previous.value), yearsAgo: previous.yearsAgo },
      unit: config.unit,
      magnitude: spread > 0 ? Math.min(FACT_SCORING.magnitudeCap, gap / spread) : 0,
      confidence: gap >= FACT_SCORING.highConfidenceMargins * config.margin ? "high" : "medium",
      messageKey: keyFor(config.messageKey, stop === "end"),
      params: { years: passed.length },
    };
  },
});

/**
 * @param {import("../types.js").FirstDetectorConfig} config
 * @returns {import("../types.js").Detector}
 */
export const firstDetector = (config) => ({
  id: config.id,
  family: config.family,
  variable: config.variable,
  messageKeys: [config.messageKey, keyFor(config.messageKey, true)],
  detect(today, history, ctx) {
    const value = valueOf(today, config.variable);
    if (value === null || value < config.threshold) return null;
    const { passed, stop, previous } = walk(
      history,
      ctx,
      config.variable,
      (past) => past >= config.threshold,
    );
    if (!passed.length) return null;
    return {
      detector: config.id,
      family: config.family,
      kind: "first-in",
      variable: config.variable,
      years: passed.length,
      value: round1(value),
      previous: previous && { value: round1(previous.value), yearsAgo: previous.yearsAgo },
      unit: config.unit,
      magnitude: Math.min(FACT_SCORING.magnitudeCap, value / config.threshold),
      confidence: "high",
      messageKey: keyFor(config.messageKey, stop === "end"),
      params: { years: passed.length },
    };
  },
});

/**
 * @param {import("../types.js").DryDetectorConfig} config
 * @returns {import("../types.js").Detector}
 */
export const dryDetector = (config) => ({
  id: config.id,
  family: config.family,
  variable: config.variable,
  messageKeys: [config.messageKey],
  detect(today, history) {
    const value = valueOf(today, config.variable);
    if (value === null || value >= config.dryBelow) return null;
    const values = /** @type {number[]} */ (
      history.map((day) => valueOf(day, config.variable)).filter((v) => v !== null)
    );
    const wet = values.filter((v) => v >= config.wetAt).length;
    if (!values.length || wet / values.length < config.minShare) return null;
    return {
      detector: config.id,
      family: config.family,
      kind: "unusual",
      variable: config.variable,
      years: values.length,
      value: round1(value),
      previous: null,
      unit: config.unit,
      magnitude: (FACT_SCORING.magnitudeCap * wet) / values.length,
      confidence: "high",
      messageKey: config.messageKey,
      params: { rainy: wet, years: values.length },
    };
  },
});

/**
 * @param {import("../types.js").RareDetectorConfig} config
 * @returns {import("../types.js").Detector}
 */
export const rareDetector = (config) => ({
  id: config.id,
  family: config.family,
  variable: config.variable,
  messageKeys: [config.messageKey],
  detect(today, history) {
    const value = valueOf(today, config.variable);
    if (value === null) return null;
    if (config.min !== undefined && value < config.min) return null;
    const past = /** @type {number[]} */ (
      history.map((day) => valueOf(day, config.variable)).filter((v) => v !== null)
    );
    if (past.length < config.minYears) return null;
    const sign = config.direction === "high" ? 1 : -1;
    const count = past.filter((v) => (value - v) * sign < config.margin).length;
    if (count === 0 || count > config.maxCount) return null;
    return {
      detector: config.id,
      family: config.family,
      kind: sign > 0 ? "rare-high" : "rare-low",
      variable: config.variable,
      years: past.length,
      value: round1(value),
      previous: null,
      unit: config.unit,
      magnitude: 0,
      rarity: past.length / (count + 1),
      confidence: "medium",
      messageKey: config.messageKey,
      params: { count, years: past.length },
    };
  },
});

/**
 * @param {import("../types.js").DayStats} day
 * @returns {import("../types.js").DayState | null}
 */
export const dayState = (day) => {
  const snow = valueOf(day, "snow");
  const precip = valueOf(day, "precip");
  const cloud = valueOf(day, "cloudMean");
  const sunshine = valueOf(day, "sunshine");
  if (snow !== null && snow >= DAY_STATES.snowyFrom) return "snowy";
  if (precip !== null && precip >= DAY_STATES.rainyFrom) return "rainy";
  if (precip === null || cloud === null) return null;
  if (
    cloud <= DAY_STATES.sunnyCloudMax &&
    precip < DAY_STATES.sunnyPrecipMax &&
    sunshine !== null &&
    sunshine >= DAY_STATES.sunnySunshineMin
  ) {
    return "sunny";
  }
  if (cloud >= DAY_STATES.cloudyCloudMin) return "cloudy";
  return null;
};

/** @type {import("../types.js").Detector} */
export const contrastDetector = {
  id: CONTRAST.id,
  family: CONTRAST.family,
  variable: "precip",
  messageKeys: ["facts.contrastLastYear", "facts.contrastYearsAgo", "facts.contrastRun"],
  detect(today, history, ctx) {
    const now = dayState(today);
    if (!now) return null;
    const years = byYearsAgo(ctx.localDate, history);
    const stateAt = (/** @type {number} */ ago) => {
      const day = years.get(ago);
      return day ? dayState(day) : null;
    };
    const first = stateAt(1);
    let run = 0;
    if (first && first !== now) {
      while (run < CONTRAST.maxRun && stateAt(run + 1) === first) run += 1;
    }
    /** @type {{ past: import("../types.js").DayState, ago: number, key: string, params: Record<string, number | string> } | null} */
    let found = null;
    if (first && run >= CONTRAST.minRun) {
      found = { past: first, ago: run, key: "facts.contrastRun", params: { years: run } };
    } else {
      for (let ago = 1; ago <= CONTRAST.lookbackYears; ago += 1) {
        const past = stateAt(ago);
        if (past && past !== now) {
          const key = ago === 1 ? "facts.contrastLastYear" : "facts.contrastYearsAgo";
          found = { past, ago, key, params: { ago } };
          break;
        }
      }
    }
    if (!found) return null;
    const involvesSnow = found.past === "snowy" || now === "snowy";
    return {
      detector: CONTRAST.id,
      family: CONTRAST.family,
      kind: "contrast",
      variable: "state",
      years: found.ago,
      value: 0,
      previous: null,
      unit: "",
      magnitude: involvesSnow ? 1 : 0.5,
      rarity: found.key === "facts.contrastRun" ? found.ago + 1 : 2 / found.ago + 0.5,
      confidence: "high",
      messageKey: found.key,
      params: { ...found.params, past: found.past, now },
    };
  },
};

/** @type {import("../types.js").Detector} */
export const lastYearDetector = {
  id: LAST_YEAR.id,
  family: LAST_YEAR.family,
  variable: LAST_YEAR.variable,
  messageKeys: ["facts.warmerThanLastYear", "facts.coolerThanLastYear"],
  detect(today, history, ctx) {
    const value = valueOf(today, LAST_YEAR.variable);
    const last = byYearsAgo(ctx.localDate, history).get(1);
    const before = last ? valueOf(last, LAST_YEAR.variable) : null;
    if (value === null || before === null) return null;
    const delta = value - before;
    if (Math.abs(delta) < LAST_YEAR.minDelta) return null;
    return {
      detector: LAST_YEAR.id,
      family: LAST_YEAR.family,
      kind: "contrast",
      variable: LAST_YEAR.variable,
      years: 1,
      value: round1(value),
      previous: { value: round1(before), yearsAgo: 1 },
      unit: "C",
      magnitude: Math.min(FACT_SCORING.magnitudeCap, Math.abs(delta) / LAST_YEAR.minDelta),
      rarity: 2,
      confidence: "high",
      messageKey: delta > 0 ? "facts.warmerThanLastYear" : "facts.coolerThanLastYear",
      params: { tempDelta: round1(Math.abs(delta)) },
    };
  },
};

export const DETECTORS = [
  ...RECORD_DETECTORS.map(recordDetector),
  ...FIRST_DETECTORS.map(firstDetector),
  ...DRY_DETECTORS.map(dryDetector),
  ...RARE_DETECTORS.map(rareDetector),
  contrastDetector,
  lastYearDetector,
];
