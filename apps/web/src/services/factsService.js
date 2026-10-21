import { getJson } from "./http";

const API_BASE = import.meta.env.VITE_API_BASE ?? "";

/**
 * @param {Pick<import("@odd-sky/core/types").Place, "lat" | "lon" | "timezone">} place
 * @param {AbortSignal} [signal]
 * @returns {Promise<import("@odd-sky/core/types").FactsResponse>}
 */
export const getFacts = async (place, signal) => {
  const params = new URLSearchParams({
    lat: String(place.lat),
    lon: String(place.lon),
    tz: place.timezone,
  });
  return getJson(`${API_BASE}/api/facts?${params}`, { signal });
};
