/** @param {number} celsius */
export const celsiusToFahrenheit = (celsius) => (celsius * 9) / 5 + 32;

/** @param {number} kmh */
export const kmhToMph = (kmh) => kmh / 1.609344;

/**
 * @param {number} celsius
 * @param {'metric' | 'imperial'} units
 */
export const toDisplayTemp = (celsius, units) =>
  units === "imperial" ? celsiusToFahrenheit(celsius) : celsius;

/**
 * @param {number} kmh
 * @param {'metric' | 'imperial'} units
 */
export const toDisplaySpeed = (kmh, units) => (units === "imperial" ? kmhToMph(kmh) : kmh);
