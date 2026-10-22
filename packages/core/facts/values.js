/**
 * @param {import("../types.js").DayStats} day
 * @param {import("../types.js").FactVariable} variable
 * @returns {number | null}
 */
export const valueOf = (day, variable) => {
  if (variable === "range") {
    return day.tmax === null || day.tmin === null ? null : day.tmax - day.tmin;
  }
  const value = day[variable];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
};

/** @param {number} value */
export const round1 = (value) => Math.round(value * 10) / 10;

/**
 * @param {string} localDate
 * @param {import("../types.js").DayStats[]} history
 */
export const byYearsAgo = (localDate, history) => {
  const year = Number(localDate.slice(0, 4));
  /** @type {Map<number, import("../types.js").DayStats>} */
  const map = new Map();
  for (const day of history) {
    const ago = year - Number(day.date.slice(0, 4));
    if (ago > 0) map.set(ago, day);
  }
  return map;
};

/** @param {number[]} values */
export const standardDeviation = (values) => {
  if (values.length < 2) return 0;
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
};
