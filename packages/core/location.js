/**
 * @param {number} lat
 * @param {number} lon
 */
export const locationKey = (lat, lon) => `${lat.toFixed(1)},${lon.toFixed(1)}`;
