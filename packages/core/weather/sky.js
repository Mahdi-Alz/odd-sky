const KNOWN = ["clear", "partly", "cloudy", "fog", "rain", "snow", "thunder"];

/**
 * @param {string} icon
 * @param {boolean} isDay
 */
export const skyKey = (icon, isDay) => {
  const kind = icon === "drizzle" ? "rain" : KNOWN.includes(icon) ? icon : "cloudy";
  return `${kind}-${isDay ? "day" : "night"}`;
};

export const skyKeys = KNOWN.flatMap((kind) => [`${kind}-day`, `${kind}-night`]);
