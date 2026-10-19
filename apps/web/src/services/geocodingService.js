import { getJson } from "./http";

const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";

/**
 * @param {string} query
 * @param {'fa' | 'en'} locale
 * @param {AbortSignal} [signal]
 * @returns {Promise<Omit<import("@odd-sky/core/types").Place, "order">[]>}
 */
export const searchPlaces = async (query, locale, signal) => {
  const params = new URLSearchParams({ name: query, count: "8", language: locale });
  const data = await getJson(`${GEOCODING_URL}?${params}`, { signal });
  return (data.results ?? [])
    .filter((r) => r.timezone)
    .map((r) => ({
      id: String(r.id),
      name: r.name,
      admin: r.admin1 ?? "",
      country: r.country ?? "",
      lat: r.latitude,
      lon: r.longitude,
      timezone: r.timezone,
    }));
};
