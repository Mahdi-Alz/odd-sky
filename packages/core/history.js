import { BIAS, OPEN_METEO_WEIGHT } from "./config/history.js";
import { addDays } from "./dates/index.js";

/**
 * @param {{ variables: number, days: number }} request
 */
export const callWeight = ({ variables, days }) =>
  Math.max(1, variables / OPEN_METEO_WEIGHT.variablesPerCall) *
  Math.max(1, days / OPEN_METEO_WEIGHT.daysPerCall);

/** @param {string} localDate */
export const biasWindow = (localDate) => ({
  start: addDays(localDate, -BIAS.fromDaysBack),
  end: addDays(localDate, -BIAS.toDaysBack),
});

/**
 * @param {import("./types.js").DayStats[]} forecastDays
 * @param {import("./types.js").DayStats[]} archiveDays
 * @param {readonly string[]} [variables]
 * @returns {import("./types.js").BiasOffset[]}
 */
export const computeBias = (forecastDays, archiveDays, variables = BIAS.variables) => {
  const archiveByDate = new Map(archiveDays.map((day) => [day.date, day]));
  return variables.flatMap((variable) => {
    let sum = 0;
    let count = 0;
    for (const day of forecastDays) {
      const other = archiveByDate.get(day.date);
      const a = day[/** @type {keyof import("./types.js").DayStats} */ (variable)];
      const b = other?.[/** @type {keyof import("./types.js").DayStats} */ (variable)];
      if (typeof a !== "number" || typeof b !== "number") continue;
      sum += a - b;
      count += 1;
    }
    if (count < BIAS.minDays) return [];
    return [{ variable, offset: Math.round((sum / count) * 100) / 100, nDays: count }];
  });
};

/**
 * @param {string} localDate
 * @param {string[]} storedDates
 * @param {number} years
 */
export const yearsAvailable = (localDate, storedDates, years) => {
  const year = Number(localDate.slice(0, 4));
  const wanted = new Set(Array.from({ length: years }, (_, i) => year - 1 - i));
  return new Set(storedDates.map((date) => Number(date.slice(0, 4))).filter((y) => wanted.has(y)))
    .size;
};
