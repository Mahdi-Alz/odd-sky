/** @type {Map<string, Intl.DateTimeFormat>} */
const dateFormatters = new Map();

/** @param {string} timeZone */
const formatterFor = (timeZone) => {
  const cached = dateFormatters.get(timeZone);
  if (cached) return cached;
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  dateFormatters.set(timeZone, formatter);
  return formatter;
};

/**
 * @param {string} timeZone
 * @param {Date} [now]
 */
export const localParts = (timeZone, now = new Date()) => {
  const parts = Object.fromEntries(
    formatterFor(timeZone)
      .formatToParts(now)
      .map((part) => [part.type, part.value]),
  );
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
  };
};

/**
 * @param {number} value
 * @param {number} [length]
 */
const pad = (value, length = 2) => String(value).padStart(length, "0");

/**
 * @param {string} timeZone
 * @param {Date} [now]
 */
export const localDateIn = (timeZone, now = new Date()) => {
  const { year, month, day } = localParts(timeZone, now);
  return `${pad(year, 4)}-${pad(month)}-${pad(day)}`;
};

/**
 * @param {string} timeZone
 * @param {Date} [now]
 */
export const msUntilLocalMidnight = (timeZone, now = new Date()) => {
  const today = localDateIn(timeZone, now);
  let low = now.getTime();
  let high = low + 26 * 3600 * 1000;
  while (high - low > 1000) {
    const mid = Math.floor((low + high) / 2);
    if (localDateIn(timeZone, new Date(mid)) === today) low = mid;
    else high = mid;
  }
  return high - now.getTime();
};

/** @param {number} year */
export const isLeapYear = (year) => (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;

/**
 * @param {string} isoDate
 * @param {number} year
 */
export const sameDayInYear = (isoDate, year) => {
  const [, month, day] = isoDate.split("-").map(Number);
  const target = month === 2 && day === 29 && !isLeapYear(year) ? 28 : day;
  return `${pad(year, 4)}-${pad(month)}-${pad(target)}`;
};

/**
 * @param {string} isoDate
 * @param {number} [count]
 */
export const historyDates = (isoDate, count = 30) => {
  const year = Number(isoDate.slice(0, 4));
  return Array.from({ length: count }, (_, index) => {
    const target = year - 1 - index;
    return { year: target, date: sameDayInYear(isoDate, target) };
  });
};

/** @param {string} locale */
export const calendarLocale = (locale) => (locale === "fa" ? "fa-IR-u-ca-persian" : "en-US");

/**
 * @param {string} isoDate
 * @param {string} locale
 * @param {Intl.DateTimeFormatOptions} [options]
 */
export const formatIsoDate = (isoDate, locale, options = {}) =>
  new Intl.DateTimeFormat(calendarLocale(locale), { ...options, timeZone: "UTC" }).format(
    new Date(`${isoDate}T12:00:00Z`),
  );

/**
 * @param {string} localIso
 * @param {string} locale
 * @param {Intl.DateTimeFormatOptions} [options]
 */
export const formatLocalIso = (localIso, locale, options = {}) =>
  new Intl.DateTimeFormat(calendarLocale(locale), { ...options, timeZone: "UTC" }).format(
    new Date(`${localIso}:00Z`),
  );

/**
 * @param {Date} instant
 * @param {string} locale
 * @param {string | undefined} timeZone
 * @param {Intl.DateTimeFormatOptions} [options]
 */
export const formatInstant = (instant, locale, timeZone, options = {}) =>
  new Intl.DateTimeFormat(calendarLocale(locale), { ...options, timeZone }).format(instant);
