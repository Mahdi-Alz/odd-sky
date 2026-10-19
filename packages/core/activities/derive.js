const THUNDER_FROM = 95;
const FOG_CODES = new Set([45, 48]);
const FREEZING_CODES = new Set([56, 57, 66, 67]);
const SNOW_CODES = new Set([71, 73, 75, 77, 85, 86]);

const MAGNUS_A = 0.61094;
const MAGNUS_B = 17.625;
const MAGNUS_C = 243.04;
const PSYCHROMETRIC = 0.066;
const LATENT_HEAT = 2.45;
const ALBEDO = 0.23;
const WIND_10M_TO_2M = 4.87 / Math.log(67.8 * 10 - 5.42);
const SYNODIC_MONTH = 29.530588853;
const KNOWN_NEW_MOON_MS = Date.UTC(2000, 0, 6, 18, 14);

/** @typedef {import("../types").HourlyPoint} HourlyPoint */
/** @typedef {import("../types").FactorSource} FactorSource */

/** @param {number} temp */
export const saturationPressure = (temp) =>
  MAGNUS_A * Math.exp((MAGNUS_B * temp) / (temp + MAGNUS_C));

/**
 * @param {number} temp
 * @param {number} humidity
 */
export const dewPoint = (temp, humidity) => {
  const actual = (saturationPressure(temp) * Math.max(1, Math.min(100, humidity))) / 100;
  const ratio = Math.log(actual / MAGNUS_A);
  return (MAGNUS_C * ratio) / (MAGNUS_B - ratio);
};

/**
 * @param {number} temp
 * @param {number} humidity
 */
export const vapourPressureDeficit = (temp, humidity) =>
  saturationPressure(temp) * (1 - Math.max(0, Math.min(100, humidity)) / 100);

/**
 * @param {number} temp
 * @param {number} humidity
 * @param {number} windKmh
 * @param {number} radiation
 */
export const evaporationRate = (temp, humidity, windKmh, radiation) => {
  const es = saturationPressure(temp);
  const slope = (4098 * es) / (temp + 237.3) ** 2;
  const netRadiation = 0.0864 * Math.max(0, radiation) * (1 - ALBEDO);
  const wind2m = (Math.max(0, windKmh) / 3.6) * WIND_10M_TO_2M;
  const aerodynamic = 6.43 * (1 + 0.536 * wind2m) * vapourPressureDeficit(temp, humidity);
  const energy = (slope * netRadiation + PSYCHROMETRIC * aerodynamic) / (slope + PSYCHROMETRIC);
  return Math.max(0, energy / LATENT_HEAT);
};

/** @param {string} localIso */
export const moonIllumination = (localIso) => {
  const age = (Date.parse(`${localIso}:00Z`) - KNOWN_NEW_MOON_MS) / 86400000;
  const phase = (((age % SYNODIC_MONTH) + SYNODIC_MONTH) % SYNODIC_MONTH) / SYNODIC_MONTH;
  return (1 - Math.cos(2 * Math.PI * phase)) / 2;
};

/** @type {Partial<Record<FactorSource, (hour: HourlyPoint) => number>>} */
const DERIVED = {
  thunder: (hour) => (hour.code >= THUNDER_FROM ? 1 : 0),
  fog: (hour) => (FOG_CODES.has(hour.code) ? 1 : 0),
  freezing: (hour) => (FREEZING_CODES.has(hour.code) ? 1 : 0),
  snow: (hour) => (SNOW_CODES.has(hour.code) ? 1 : 0),
  daylight: (hour) => (hour.isDay ? 1 : 0),
  dewPoint: (hour) => dewPoint(hour.temp, hour.humidity),
  evaporation: (hour) => evaporationRate(hour.temp, hour.humidity, hour.wind, hour.radiation),
  moon: (hour) => moonIllumination(hour.time),
};

/**
 * @param {HourlyPoint} hour
 * @param {FactorSource} source
 * @returns {number}
 */
export const readSource = (hour, source) => {
  const derive = DERIVED[source];
  if (derive) return derive(hour);
  return /** @type {number} */ (hour[/** @type {keyof HourlyPoint} */ (source)]);
};

export const FACTOR_SOURCES = /** @type {FactorSource[]} */ ([
  "temp",
  "apparentTemp",
  "wind",
  "gusts",
  "precipProbability",
  "precipAmount",
  "uv",
  "humidity",
  "cloud",
  ...Object.keys(DERIVED),
]);
