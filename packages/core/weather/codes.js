/** @type {Record<number, string>} */
const icons = {
  0: "clear",
  1: "partly",
  2: "partly",
  3: "cloudy",
  45: "fog",
  48: "fog",
  51: "drizzle",
  53: "drizzle",
  55: "drizzle",
  56: "drizzle",
  57: "drizzle",
  61: "rain",
  63: "rain",
  65: "rain",
  66: "rain",
  67: "rain",
  71: "snow",
  73: "snow",
  75: "snow",
  77: "snow",
  80: "rain",
  81: "rain",
  82: "rain",
  85: "snow",
  86: "snow",
  95: "thunder",
  96: "thunder",
  99: "thunder",
};

/** @param {number} code */
export const weatherCode = (code) =>
  code in icons
    ? { labelKey: `weather.${code}`, icon: icons[code] }
    : { labelKey: "weather.unknown", icon: "cloudy" };

export const weatherCodeList = Object.keys(icons).map(Number);
