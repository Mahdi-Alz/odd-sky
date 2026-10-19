/**
 * @param {number | null | undefined} updatedAt
 * @param {number} now
 * @param {number} maxAgeMs
 */
export const isStale = (updatedAt, now, maxAgeMs) =>
  updatedAt == null || now - updatedAt >= maxAgeMs;

/**
 * @param {number} activeIndex
 * @param {number} count
 */
export const pageWindow = (activeIndex, count) => {
  if (count <= 0) return [];
  const active = Math.min(Math.max(activeIndex, 0), count - 1);
  return [active, active + 1, active - 1].filter((index) => index >= 0 && index < count);
};
