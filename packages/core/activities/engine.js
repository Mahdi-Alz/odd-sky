import { ACTIVITIES, LABEL_BOUNDS, SCORING } from "../config/activities.js";
import { readSource } from "./derive.js";

/** @typedef {import("../types").HourlyPoint} HourlyPoint */
/** @typedef {import("../types").ActivityConfig} ActivityConfig */
/** @typedef {import("../types").ActivityFactor} ActivityFactor */
/** @typedef {import("../types").ActivityVeto} ActivityVeto */
/** @typedef {import("../types").ActivityReason} ActivityReason */
/** @typedef {import("../types").ActivityScore} ActivityScore */
/** @typedef {import("../types").Aggregate} Aggregate */
/** @typedef {import("../types").FactorSource} FactorSource */

/**
 * @param {number[]} values
 * @param {Aggregate} aggregate
 */
const aggregateValues = (values, aggregate) => {
  if (!values.length) return null;
  if (aggregate === "max") return Math.max(...values);
  if (aggregate === "min") return Math.min(...values);
  const sum = values.reduce((total, value) => total + value, 0);
  return aggregate === "sum" ? sum : sum / values.length;
};

/**
 * @param {HourlyPoint[]} hours
 * @param {FactorSource} source
 * @param {Aggregate} aggregate
 */
const aggregateSource = (hours, source, aggregate) =>
  aggregateValues(
    hours.map((hour) => readSource(hour, source)).filter((value) => Number.isFinite(value)),
    aggregate,
  );

/**
 * @param {number} value
 * @param {[number, number]} ideal
 * @param {[number, number]} ok
 * @returns {{ score: number, level: 'ideal' | 'ok' | 'bad', side: 'below' | 'within' | 'above' }}
 */
export const scoreRange = (value, ideal, ok) => {
  if (value >= ideal[0] && value <= ideal[1]) return { score: 100, level: "ideal", side: "within" };
  const below = value < ideal[0];
  const distance = below ? ideal[0] - value : value - ideal[1];
  const span = below ? ideal[0] - ok[0] : ok[1] - ideal[1];
  const side = below ? "below" : "above";
  if (!(span > 0)) return { score: 0, level: "bad", side };
  if (distance <= span) return { score: 100 - 50 * (distance / span), level: "ok", side };
  return { score: Math.max(0, 50 - 50 * ((distance - span) / span)), level: "bad", side };
};

/** @param {number} score */
export const labelFor = (score) => {
  if (score >= LABEL_BOUNDS.great) return "great";
  if (score >= LABEL_BOUNDS.good) return "good";
  if (score >= LABEL_BOUNDS.fair) return "fair";
  return "poor";
};

/** @param {number} score */
export const scoreLevel = (score) => (score <= 0 ? 1 : Math.min(6, 2 + Math.floor(score / 20)));

/**
 * @param {ActivityVeto} veto
 */
const vetoAggregate = (veto) => veto.aggregate ?? "max";

/**
 * @param {ActivityVeto} veto
 * @param {HourlyPoint[]} hours
 */
const isVetoed = (veto, hours) => {
  const value = aggregateSource(hours, veto.source, vetoAggregate(veto));
  if (value == null) return false;
  if (veto.above != null && value > veto.above) return true;
  if (veto.below != null && value < veto.below) return true;
  return false;
};

/**
 * @param {ActivityFactor[]} factors
 * @param {HourlyPoint[]} hours
 */
const scoreWindow = (factors, hours) => {
  let weighted = 0;
  let weights = 0;
  let heaviest = 0;
  /** @type {{ reason: ActivityReason, weight: number, score: number }[]} */
  const parts = [];
  for (const factor of factors) {
    const value = aggregateSource(hours, factor.source, factor.aggregate ?? "mean");
    if (value == null) continue;
    const result = scoreRange(value, factor.ideal, factor.ok);
    weighted += result.score * factor.weight;
    weights += factor.weight;
    heaviest = Math.max(heaviest, factor.weight);
    parts.push({
      reason: { factor: factor.source, level: result.level, side: result.side, value },
      weight: factor.weight,
      score: result.score,
    });
  }
  const order = { bad: 0, ok: 1, ideal: 2 };
  parts.sort((a, b) => order[a.reason.level] - order[b.reason.level] || b.weight - a.weight);
  if (!weights) return { score: 0, reasons: [] };
  const drag = Math.max(
    0,
    ...parts.map(
      (part) => (part.weight / heaviest) * Math.max(0, 50 - part.score) * SCORING.badFactorDrag,
    ),
  );
  const score = Math.min(100, Math.max(0, weighted / weights - drag));
  return { score, reasons: parts.map((part) => part.reason) };
};

/** @param {string} localIso */
export const addHour = (localIso) => {
  const next = new Date(`${localIso}:00Z`);
  next.setUTCHours(next.getUTCHours() + 1);
  return next.toISOString().slice(0, 16);
};

/**
 * @param {HourlyPoint[]} hours
 * @param {ActivityConfig} activity
 * @param {string} localDate
 */
const horizonHours = (hours, activity, localDate) => {
  if (activity.horizon === "today") return hours.filter((hour) => hour.time.startsWith(localDate));
  return hours.slice(0, activity.horizon);
};

/**
 * @param {HourlyPoint} hour
 * @param {ActivityConfig["light"]} light
 */
const matchesLight = (hour, light) =>
  light === "any" || (light === "day" ? hour.isDay : !hour.isDay);

/**
 * @param {string} activity
 * @param {ActivityReason["factor"]} factor
 * @param {number} value
 * @returns {ActivityScore}
 */
const unavailable = (activity, factor, value) => ({
  activity,
  score: 0,
  label: "poor",
  reasons: [{ factor, level: "bad", side: "below", value }],
  window: null,
});

/**
 * @param {ActivityConfig} activity
 * @param {HourlyPoint[]} hours
 * @param {string} localDate
 * @returns {ActivityScore}
 */
export const scoreActivity = (activity, hours, localDate) => {
  const pool = horizonHours(hours, activity, localDate);
  const whole = activity.durationHours == null;
  const length = whole ? pool.length : activity.durationHours;

  if (!length || pool.length < length) return unavailable(activity.id, "time", pool.length);

  /** @type {{ hours: HourlyPoint[] }[]} */
  const windows = [];
  if (whole) {
    if (pool.every((hour) => matchesLight(hour, activity.light))) windows.push({ hours: pool });
  } else {
    for (let start = 0; start + length <= pool.length; start += 1) {
      const slice = pool.slice(start, start + length);
      if (slice.every((hour) => matchesLight(hour, activity.light))) windows.push({ hours: slice });
    }
  }

  if (!windows.length) {
    const factor = activity.light === "night" ? "darkness" : "daylight";
    return unavailable(activity.id, factor, 0);
  }

  /** @type {Map<number, number>} */
  const vetoCounts = new Map();
  /** @type {{ score: number, reasons: ActivityReason[], hours: HourlyPoint[] } | null} */
  let best = null;
  for (const window of windows) {
    const vetoIndex = activity.vetoes.findIndex((veto) => isVetoed(veto, window.hours));
    if (vetoIndex >= 0) {
      vetoCounts.set(vetoIndex, (vetoCounts.get(vetoIndex) ?? 0) + 1);
      continue;
    }
    const result = scoreWindow(activity.factors, window.hours);
    if (!best || result.score > best.score) best = { ...result, hours: window.hours };
  }

  if (!best) {
    const [vetoIndex] = [...vetoCounts.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0];
    const veto = activity.vetoes[vetoIndex];
    const value = aggregateSource(pool, veto.source, vetoAggregate(veto)) ?? 0;
    return {
      activity: activity.id,
      score: 0,
      label: "poor",
      reasons: [
        { factor: veto.source, level: "bad", side: veto.below != null ? "below" : "above", value },
      ],
      window: null,
    };
  }

  const score = Math.round(best.score);
  const last = best.hours[best.hours.length - 1];
  return {
    activity: activity.id,
    score,
    label: labelFor(score),
    reasons: best.reasons,
    window: whole ? null : { start: best.hours[0].time, end: addHour(last.time) },
  };
};

/**
 * @param {HourlyPoint[]} hours
 * @param {string} localDate
 * @param {{ activities?: ActivityConfig[], enabled?: Record<string, boolean> }} [options]
 * @returns {ActivityScore[]}
 */
export const scoreActivities = (hours, localDate, options = {}) => {
  const { activities = ACTIVITIES, enabled = {} } = options;
  return activities
    .filter((activity) => enabled[activity.id] !== false)
    .map((activity) => scoreActivity(activity, hours, localDate));
};

/**
 * @param {ActivityScore} result
 * @param {number} [max]
 * @returns {ActivityReason[]}
 */
export const headlineReasons = (result, max = 2) => {
  const positive = result.label === "great" || result.label === "good";
  const preferred = result.reasons.filter((reason) =>
    positive ? reason.level === "ideal" : reason.level === "bad",
  );
  const fallback = result.reasons.filter((reason) => reason.level !== "ok");
  const pool = preferred.length ? preferred : fallback.length ? fallback : result.reasons;
  return pool.slice(0, max);
};
