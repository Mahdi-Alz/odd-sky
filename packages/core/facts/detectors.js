import { DRY_DETECTORS, FACT_SCORING, FIRST_DETECTORS, RECORD_DETECTORS } from "../config/facts.js";
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

export const DETECTORS = [
  ...RECORD_DETECTORS.map(recordDetector),
  ...FIRST_DETECTORS.map(firstDetector),
  ...DRY_DETECTORS.map(dryDetector),
];
