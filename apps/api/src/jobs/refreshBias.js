import { BIAS, biasWindow, computeBias } from "@odd-sky/core";

const DAY_MS = 86_400_000;

/**
 * @param {{
 *   history: import("../repositories/types.js").HistoryRepo,
 *   openMeteo: import("../clients/openMeteo.js").OpenMeteo,
 *   now: () => number,
 * }} deps
 * @param {{ location: import("../repositories/types.js").Location, localDate: string }} input
 */
export const refreshBias = async ({ history, openMeteo, now }, { location, localDate }) => {
  const stored = await history.getBias(location.key);
  if (stored.computedAt !== null && now() - stored.computedAt < BIAS.maxAgeDays * DAY_MS) {
    return { offsets: stored.offsets, refreshed: false };
  }
  const fields = /** @type {import("../clients/openMeteo.js").DayField[]} */ (BIAS.variables);
  const range = {
    lat: location.lat,
    lon: location.lon,
    timezone: location.timezone,
    ...biasWindow(localDate),
  };
  const [forecast, archive] = await Promise.all([
    openMeteo.forecastDays(range, fields),
    openMeteo.archiveDays(range, fields),
  ]);
  const offsets = computeBias(forecast, archive, BIAS.variables);
  await history.saveBias(location.key, offsets);
  return { offsets, refreshed: true };
};
