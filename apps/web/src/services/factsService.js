import { mockFactsResponse } from "@odd-sky/core";

/**
 * @param {Pick<import("@odd-sky/core/types").Place, "lat" | "lon" | "timezone">} place
 * @param {string} localDate
 * @returns {Promise<import("@odd-sky/core/types").FactsResponse>}
 */
export const getFacts = async (place, localDate) =>
  mockFactsResponse({
    lat: place.lat,
    lon: place.lon,
    timezone: place.timezone,
    localDate,
  });
