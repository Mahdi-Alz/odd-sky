/**
 * @param {{ now?: () => number }} [options]
 * @returns {import("./types.js").HistoryRepo & { days: Map<string, import("@odd-sky/core/types").DayStats> }}
 */
export const createMemoryHistory = ({ now = Date.now } = {}) => {
  /** @type {Map<string, import("./types.js").Location>} */
  const locations = new Map();
  /** @type {Map<string, import("@odd-sky/core/types").DayStats>} */
  const days = new Map();
  /** @type {Map<string, import("./types.js").StoredBias>} */
  const bias = new Map();

  /** @param {string} key @param {string} date */
  const dayKey = (key, date) => `${key}|${date}`;

  return {
    kind: "memory",
    days,
    async saveLocation(location) {
      if (!locations.has(location.key)) locations.set(location.key, { ...location });
      return { .../** @type {import("./types.js").Location} */ (locations.get(location.key)) };
    },
    async storedDates(key, dates) {
      return dates.filter((date) => days.has(dayKey(key, date)));
    },
    async getDays(key, dates) {
      return dates
        .map((date) => days.get(dayKey(key, date)))
        .filter((day) => day !== undefined)
        .map((day) => ({ ...day }))
        .sort((a, b) => b.date.localeCompare(a.date));
    },
    async saveDays(key, list) {
      for (const day of list) {
        if (!days.has(dayKey(key, day.date))) days.set(dayKey(key, day.date), { ...day });
      }
    },
    async getBias(key) {
      return bias.get(key) ?? { offsets: [], computedAt: null };
    },
    async saveBias(key, offsets) {
      bias.set(key, { offsets: offsets.map((o) => ({ ...o })), computedAt: now() });
    },
  };
};
