import { HISTORY } from "../config/history.js";
import { DEPARTURE, FACT_SCORING, FAMILY_WEIGHTS } from "../config/facts.js";
import { DETECTORS } from "./detectors.js";
import { round1, valueOf } from "./values.js";

/**
 * @param {import("../types.js").DayStats} today
 * @param {import("../types.js").BiasOffset[]} bias
 * @returns {import("../types.js").DayStats}
 */
export const correctToday = (today, bias) => {
  const corrected = { ...today };
  for (const { variable, offset } of bias) {
    const key = /** @type {keyof Omit<import("../types.js").DayStats, 'date'>} */ (variable);
    const value = corrected[key];
    if (typeof value === "number") corrected[key] = value - offset;
  }
  return corrected;
};

/**
 * @param {import("../types.js").FactCandidate} candidate
 * @returns {import("../types.js").Fact}
 */
export const scoreCandidate = (candidate) => {
  const familyWeight =
    FAMILY_WEIGHTS[/** @type {keyof typeof FAMILY_WEIGHTS} */ (candidate.family)] ?? 0;
  const score =
    FACT_SCORING.rarityWeight * Math.log(candidate.years) +
    FACT_SCORING.magnitudeWeight * candidate.magnitude +
    familyWeight;
  return {
    id: candidate.detector,
    detector: candidate.detector,
    family: candidate.family,
    kind: candidate.kind,
    variable: candidate.variable,
    years: candidate.years,
    value: candidate.value,
    previous: candidate.previous,
    unit: candidate.unit,
    score: Math.round(score * 100) / 100,
    confidence: candidate.confidence,
    messageKey: candidate.messageKey,
    params: candidate.params,
  };
};

/** @param {import("../types.js").Fact[]} facts */
export const selectFacts = (facts) => {
  const sorted = [...facts].sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
  /** @type {Map<string, number>} */
  const perFamily = new Map();
  /** @type {import("../types.js").Fact[]} */
  const chosen = [];
  for (const fact of sorted) {
    if (chosen.length >= FACT_SCORING.maxFacts) break;
    const count = perFamily.get(fact.family) ?? 0;
    if (count >= FACT_SCORING.maxPerFamily) continue;
    perFamily.set(fact.family, count + 1);
    chosen.push(fact);
  }
  return chosen;
};

/**
 * @param {import("../types.js").DayStats} today
 * @param {import("../types.js").DayStats[]} history
 * @returns {import("../types.js").Departure | null}
 */
export const departureFor = (today, history) => {
  const value = valueOf(
    today,
    /** @type {import("../types.js").FactVariable} */ (DEPARTURE.variable),
  );
  const values = /** @type {number[]} */ (
    history
      .map((day) =>
        valueOf(day, /** @type {import("../types.js").FactVariable} */ (DEPARTURE.variable)),
      )
      .filter((v) => v !== null)
  );
  if (value === null || values.length < DEPARTURE.minYears) return null;
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  return {
    variable: DEPARTURE.variable,
    value: round1(value),
    mean: round1(mean),
    delta: round1(value - mean),
    years: values.length,
  };
};

/**
 * @param {{
 *   today: import("../types.js").DayStats,
 *   history: import("../types.js").DayStats[],
 *   bias?: import("../types.js").BiasOffset[],
 *   localDate: string,
 *   historyYears?: number,
 * }} input
 */
export const runFacts = ({
  today,
  history,
  bias = [],
  localDate,
  historyYears = HISTORY.years,
}) => {
  const corrected = correctToday(today, bias);
  const ctx = { localDate, historyYears };
  const candidates = [];
  for (const detector of DETECTORS) {
    const candidate = detector.detect(corrected, history, ctx);
    if (candidate && candidate.years >= FACT_SCORING.minYears) candidates.push(candidate);
  }
  return {
    facts: selectFacts(candidates.map(scoreCandidate)),
    departure: departureFor(corrected, history),
  };
};
