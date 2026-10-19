import { getJson } from "./http";

const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";
const PLACE_URL = "https://geocoding-api.open-meteo.com/v1/get";

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

/**
 * @param {string} id
 * @param {'fa' | 'en'} locale
 * @param {AbortSignal} [signal]
 * @returns {Promise<import("@odd-sky/core/types").PlaceLabel>}
 */
export const getPlaceLabel = async (id, locale, signal) => {
  const params = new URLSearchParams({ id, language: locale });
  const data = await getJson(`${PLACE_URL}?${params}`, { signal });
  return { name: data.name, admin: data.admin1 ?? "", country: data.country ?? "" };
};
