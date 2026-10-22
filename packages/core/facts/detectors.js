import {
  CONTEXT,
  CONTRAST,
  DAY_STATES,
  FACT_SCORING,
  FEELS_GAP_DETECTORS,
  FIRST_DETECTORS,
  LAST_YEAR_DETECTORS,
  RARE_DETECTORS,
  RECORD_DETECTORS,
  STREAK_DETECTORS,
  STREAK_SCORING,
  USUAL_DETECTORS,
} from "../config/facts.js";
import { byYearsAgo, round1, standardDeviation, valueOf } from "./values.js";

/** @typedef {import("../types.js").DayStats} DayStats */
/** @typedef {import("../types.js").DayCondition} DayCondition */

/**
 * @param {DayStats[]} history
 * @param {import("../types.js").FactVariable} variable
 */
const pastValues = (history, variable) =>
  /** @type {number[]} */ (history.map((day) => valueOf(day, variable)).filter((v) => v !== null));

/** @param {number[]} values */
const mean = (values) => values.reduce((sum, v) => sum + v, 0) / values.length;

/**
 * @param {DayStats} day
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

/**
 * @param {DayStats} day
 * @param {DayCondition} condition
 * @param {number} [average]
 * @returns {boolean | null}
 */
export const meets = (day, condition, average) => {
  if (condition.state) {
    const state = dayState(day);
    return state === null ? null : state === condition.state;
  }
  if (!condition.variable) return null;
  const value = valueOf(day, condition.variable);
  if (value === null) return null;
  if (condition.atLeast !== undefined && value < condition.atLeast) return false;
  if (condition.atMost !== undefined && value > condition.atMost) return false;
  if (condition.aboveMean && (average === undefined || value <= average)) return false;
  if (condition.belowMean && (average === undefined || value >= average)) return false;
  return true;
};

/**
 * @param {DayStats[]} history
 * @param {import("../types.js").DetectorContext} ctx
 * @param {(day: DayStats) => boolean | null} stops
 */
const walkDays = (history, ctx, stops) => {
  const years = byYearsAgo(ctx.localDate, history);
  /** @type {DayStats[]} */
  const passed = [];
  for (let ago = 1; ago <= ctx.historyYears; ago += 1) {
    const day = years.get(ago);
    const stop = day ? stops(day) : null;
    if (!day || stop === null) return { passed, stop: /** @type {const} */ ("gap"), at: null };
    if (stop) return { passed, stop: /** @type {const} */ ("found"), at: { day, ago } };
    passed.push(day);
  }
  return { passed, stop: /** @type {const} */ ("end"), at: null };
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
    const { passed, stop, at } = walkDays(history, ctx, (day) => {
      const past = valueOf(day, config.variable);
      return past === null ? null : (value - past) * sign < config.margin;
    });
    if (!passed.length) return null;
    const beaten = pastValues(passed, config.variable);
    const extreme = sign > 0 ? Math.max(...beaten) : Math.min(...beaten);
    const gap = (value - extreme) * sign;
    const spread = standardDeviation(pastValues(history, config.variable));
    const previous = at && valueOf(at.day, config.variable);
    return {
      detector: config.id,
      family: config.family,
      kind: sign > 0 ? "record-high" : "record-low",
      bonus: config.bonus,
      variable: config.variable,
      years: passed.length,
      value: round1(value),
      previous: at && previous !== null ? { value: round1(previous), yearsAgo: at.ago } : null,
      unit: config.unit,
      magnitude: spread > 0 ? Math.min(FACT_SCORING.magnitudeCap, gap / spread) : 0,
      confidence: gap >= FACT_SCORING.highConfidenceMargins * config.margin ? "high" : "medium",
      messageKey: keyFor(config.messageKey, stop === "end"),
      params: { years: passed.length },
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
    if (config.max !== undefined && value > config.max) return null;
    const past = pastValues(history, config.variable);
    if (past.length < config.minYears) return null;
    const sign = config.direction === "high" ? 1 : -1;
    const count = past.filter((v) => (value - v) * sign < config.margin).length;
    if (count === 0 || count > config.maxCount) return null;
    return {
      detector: config.id,
      family: config.family,
      kind: sign > 0 ? "rare-high" : "rare-low",
      bonus: config.bonus,
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
 * @param {import("../types.js").FirstDetectorConfig} config
 * @returns {import("../types.js").Detector}
 */
export const firstDetector = (config) => ({
  id: config.id,
  family: config.family,
  variable: config.condition.variable ?? "precip",
  messageKeys: [config.messageKey, keyFor(config.messageKey, true)],
  detect(today, history, ctx) {
    if (meets(today, config.condition) !== true) return null;
    const { passed, stop, at } = walkDays(history, ctx, (day) => meets(day, config.condition));
    if (!passed.length) return null;
    const variable = config.condition.variable;
    const value = variable ? valueOf(today, variable) : null;
    const previous = at && variable ? valueOf(at.day, variable) : null;
    /** @type {Record<string, number | string>} */
    const params = { years: passed.length };
    if (config.threshold !== undefined) params.temp = config.threshold;
    return {
      detector: config.id,
      family: config.family,
      kind: "first-in",
      variable: variable ?? "state",
      years: passed.length,
      value: value === null ? 0 : round1(value),
      previous: at && previous !== null ? { value: round1(previous), yearsAgo: at.ago } : null,
      unit: config.unit,
      magnitude: 1,
      confidence: "high",
      messageKey: keyFor(config.messageKey, stop === "end"),
      params,
    };
  },
});

/**
 * @param {import("../types.js").UsualDetectorConfig} config
 * @returns {import("../types.js").Detector}
 */
export const usualDetector = (config) => ({
  id: config.id,
  family: config.family,
  variable: config.today.variable ?? "precip",
  messageKeys: [config.messageKey],
  detect(today, history) {
    if (meets(today, config.today) !== true) return null;
    const checked = history.map((day) => meets(day, config.past)).filter((v) => v !== null);
    if (checked.length < FACT_SCORING.minYears) return null;
    const count = checked.filter(Boolean).length;
    const share = count / checked.length;
    if (share < config.minShare) return null;
    const context = config.kind === "context";
    return {
      detector: config.id,
      family: context ? "context" : config.family,
      kind: config.kind,
      variable: config.today.variable ?? "state",
      years: checked.length,
      value: 0,
      previous: null,
      unit: "",
      magnitude: context ? FACT_SCORING.contextScore : FACT_SCORING.magnitudeCap * share,
      rarity: context ? 1 : 1 / Math.max(1 - share, 1 / checked.length),
      confidence: "high",
      messageKey: config.messageKey,
      params: { count, years: checked.length },
    };
  },
});

/**
 * @param {import("../types.js").StreakDetectorConfig} config
 * @returns {import("../types.js").Detector}
 */
export const streakDetector = (config) => ({
  id: config.id,
  family: config.family,
  variable: config.condition.variable ?? "precip",
  messageKeys: [config.messageKey],
  detect(today, history, ctx) {
    const variable = config.condition.variable;
    const needsMean = config.condition.aboveMean || config.condition.belowMean;
    const values = variable ? pastValues(history, variable) : [];
    if (needsMean && values.length < CONTEXT.minYears) return null;
    const average = needsMean ? mean(values) : undefined;
    if (meets(today, config.condition, average) !== true) return null;
    const { passed } = walkDays(history, ctx, (day) => {
      const result = meets(day, config.condition, average);
      return result === null ? null : !result;
    });
    const run = passed.length + 1;
    if (run < config.minRun) return null;
    const checked = history
      .map((day) => meets(day, config.condition, average))
      .filter((v) => v !== null);
    const share = checked.filter(Boolean).length / Math.max(1, checked.length);
    const rarity = Math.min(STREAK_SCORING.maxRarity, Math.max(1, share ** -(run - 1)));
    return {
      detector: config.id,
      family: config.family,
      kind: "streak",
      variable: variable ?? "state",
      years: run,
      value: 0,
      previous: null,
      unit: "",
      magnitude: 0.5,
      rarity,
      confidence: "high",
      messageKey: config.messageKey,
      params: { years: run },
    };
  },
});

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

/**
 * @param {import("../types.js").LastYearDetectorConfig} config
 * @returns {import("../types.js").Detector}
 */
export const lastYearDetector = (config) => ({
  id: config.id,
  family: config.family,
  variable: config.variable,
  messageKeys: [config.messageKeys.warmer, config.messageKeys.cooler],
  detect(today, history, ctx) {
    const value = valueOf(today, config.variable);
    const last = byYearsAgo(ctx.localDate, history).get(1);
    const before = last ? valueOf(last, config.variable) : null;
    if (value === null || before === null) return null;
    const delta = value - before;
    if (Math.abs(delta) < config.minDelta) return null;
    return {
      detector: config.id,
      family: config.family,
      kind: "contrast",
      variable: config.variable,
      years: 1,
      value: round1(value),
      previous: { value: round1(before), yearsAgo: 1 },
      unit: "C",
      magnitude: Math.min(FACT_SCORING.magnitudeCap, Math.abs(delta) / config.minDelta),
      rarity: 2,
      confidence: "high",
      messageKey: delta > 0 ? config.messageKeys.warmer : config.messageKeys.cooler,
      params: { tempDelta: round1(Math.abs(delta)) },
    };
  },
});

/**
 * @param {string} id
 * @param {string} messageKey
 * @param {Partial<import("../types.js").FactCandidate>} fields
 * @returns {import("../types.js").FactCandidate}
 */
const contextFact = (id, messageKey, fields) => ({
  detector: id,
  family: "context",
  kind: "context",
  variable: "tmax",
  years: 0,
  value: 0,
  previous: null,
  unit: "C",
  magnitude: FACT_SCORING.contextScore,
  rarity: 1,
  confidence: "high",
  messageKey,
  params: {},
  ...fields,
});

/**
 * @param {{ id: string, variable: import("../types.js").FactVariable, direction: 'high' | 'low', messageKey: string }} config
 * @returns {import("../types.js").Detector}
 */
export const extremeDetector = (config) => ({
  id: config.id,
  family: "context",
  variable: config.variable,
  messageKeys: [config.messageKey, `${config.messageKey}LastYear`],
  detect(today, history, ctx) {
    const years = byYearsAgo(ctx.localDate, history);
    /** @type {{ value: number, ago: number } | null} */
    let best = null;
    for (const [ago, day] of years) {
      const value = valueOf(day, config.variable);
      if (value === null) continue;
      const better =
        best === null || (config.direction === "high" ? value > best.value : value < best.value);
      if (better) best = { value, ago };
    }
    if (!best || years.size < CONTEXT.minYears) return null;
    const key = best.ago === 1 ? `${config.messageKey}LastYear` : config.messageKey;
    return contextFact(config.id, key, {
      variable: config.variable,
      years: years.size,
      value: round1(best.value),
      previous: { value: round1(best.value), yearsAgo: best.ago },
      params: { years: years.size, ago: best.ago, temp: round1(best.value) },
    });
  },
});

/**
 * @param {{ id: string, variable: import("../types.js").FactVariable, messageKeys: { warmer: string, cooler: string } }} config
 * @returns {import("../types.js").Detector}
 */
export const trendDetector = (config) => ({
  id: config.id,
  family: "context",
  variable: config.variable,
  messageKeys: [config.messageKeys.warmer, config.messageKeys.cooler],
  detect(today, history, ctx) {
    const years = byYearsAgo(ctx.localDate, history);
    if (years.size < CONTEXT.minYears) return null;
    const pick = (/** @type {number[]} */ agos) =>
      pastValues(
        /** @type {DayStats[]} */ (agos.map((ago) => years.get(ago)).filter(Boolean)),
        config.variable,
      );
    const span = CONTEXT.trendYears;
    const recent = pick(Array.from({ length: span }, (_, i) => i + 1));
    const early = pick(Array.from({ length: span }, (_, i) => ctx.historyYears - i));
    if (recent.length < span - 2 || early.length < span - 2) return null;
    const delta = mean(recent) - mean(early);
    if (Math.abs(delta) < CONTEXT.trendMinDelta) return null;
    return contextFact(
      config.id,
      delta > 0 ? config.messageKeys.warmer : config.messageKeys.cooler,
      {
        variable: config.variable,
        years: ctx.historyYears,
        value: round1(delta),
        params: { tempDelta: round1(Math.abs(delta)), span, years: ctx.historyYears },
      },
    );
  },
});

/**
 * @param {{ id: string, variable: import("../types.js").FactVariable, direction: 'high' | 'low', messageKey: string }} config
 * @returns {import("../types.js").Detector}
 */
export const nearRecordDetector = (config) => ({
  id: config.id,
  family: "context",
  variable: config.variable,
  messageKeys: [config.messageKey],
  detect(today, history) {
    const value = valueOf(today, config.variable);
    const past = pastValues(history, config.variable);
    if (value === null || past.length < CONTEXT.minYears) return null;
    const record = config.direction === "high" ? Math.max(...past) : Math.min(...past);
    const gap = config.direction === "high" ? record - value : value - record;
    if (gap <= 0 || gap > CONTEXT.nearRecordWithin) return null;
    return contextFact(config.id, config.messageKey, {
      variable: config.variable,
      years: past.length,
      value: round1(value),
      magnitude: FACT_SCORING.contextScore * 2,
      params: { tempDelta: Math.max(0.1, round1(gap)), years: past.length },
    });
  },
});

/** @type {import("../types.js").Detector} */
export const rainFrequencyDetector = {
  id: "rain-frequency",
  family: "context",
  variable: "precip",
  messageKeys: ["facts.rainFrequency", "facts.neverRains"],
  detect(today, history) {
    const past = pastValues(history, "precip");
    if (past.length < CONTEXT.minYears) return null;
    const rainy = past.filter((v) => v >= CONTEXT.rainyAt).length;
    const share = rainy / past.length;
    if (rainy === 0) {
      return contextFact("rain-frequency", "facts.neverRains", {
        variable: "precip",
        years: past.length,
        params: { years: past.length },
      });
    }
    if (share < CONTEXT.frequencyMinShare) return null;
    return contextFact("rain-frequency", "facts.rainFrequency", {
      variable: "precip",
      years: past.length,
      params: { count: rainy, years: past.length },
    });
  },
};

/**
 * @param {import("../types.js").FeelsGapDetectorConfig} config
 * @returns {import("../types.js").Detector}
 */
export const feelsGapDetector = (config) => ({
  id: config.id,
  family: "feels-like",
  variable: config.variable,
  messageKeys: [config.messageKey],
  detect(today) {
    const feels = valueOf(today, config.variable);
    const actual = valueOf(today, config.actual);
    if (feels === null || actual === null) return null;
    const gap = config.direction === "above" ? feels - actual : actual - feels;
    if (gap < config.minGap) return null;
    return contextFact(config.id, config.messageKey, {
      family: "feels-like",
      variable: config.variable,
      value: round1(feels),
      magnitude: FACT_SCORING.contextScore * 2,
      params: { tempDelta: round1(gap) },
    });
  },
});

export const DETECTORS = [
  ...RECORD_DETECTORS.map(recordDetector),
  ...RARE_DETECTORS.map(rareDetector),
  ...FIRST_DETECTORS.map(firstDetector),
  ...USUAL_DETECTORS.map(usualDetector),
  ...STREAK_DETECTORS.map(streakDetector),
  contrastDetector,
  ...LAST_YEAR_DETECTORS.map(lastYearDetector),
  extremeDetector({
    id: "warmest-ever",
    variable: "tmax",
    direction: "high",
    messageKey: "facts.warmestEver",
  }),
  extremeDetector({
    id: "coldest-night-ever",
    variable: "tmin",
    direction: "low",
    messageKey: "facts.coldestNightEver",
  }),
  trendDetector({
    id: "tmax-trend",
    variable: "tmax",
    messageKeys: { warmer: "facts.trendWarmer", cooler: "facts.trendCooler" },
  }),
  nearRecordDetector({
    id: "tmax-near-record",
    variable: "tmax",
    direction: "high",
    messageKey: "facts.nearRecordHigh",
  }),
  nearRecordDetector({
    id: "tmin-near-record",
    variable: "tmin",
    direction: "low",
    messageKey: "facts.nearRecordLow",
  }),
  rainFrequencyDetector,
  ...FEELS_GAP_DETECTORS.map(feelsGapDetector),
];
