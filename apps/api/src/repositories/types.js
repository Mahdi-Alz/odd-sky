/**
 * @typedef {Object} Location
 * @property {string} key
 * @property {number} lat
 * @property {number} lon
 * @property {string} timezone
 */

/**
 * @typedef {Object} StoredBias
 * @property {import("@odd-sky/core/types").BiasOffset[]} offsets
 * @property {number | null} computedAt
 */

/**
 * @typedef {Object} HistoryRepo
 * @property {string} kind
 * @property {(location: Location) => Promise<Location>} saveLocation
 * @property {(key: string, dates: string[]) => Promise<string[]>} storedDates
 * @property {(key: string, dates: string[]) => Promise<import("@odd-sky/core/types").DayStats[]>} getDays
 * @property {(key: string, days: import("@odd-sky/core/types").DayStats[]) => Promise<void>} saveDays
 * @property {(key: string) => Promise<StoredBias>} getBias
 * @property {(key: string, offsets: import("@odd-sky/core/types").BiasOffset[]) => Promise<void>} saveBias
 */

/**
 * @typedef {Object} CacheRepo
 * @property {string} kind
 * @property {(key: string) => Promise<any>} get
 * @property {(key: string, value: unknown, ttlMs: number) => Promise<void>} set
 * @property {(key: string, value: unknown, ttlMs: number) => Promise<boolean>} setIfAbsent
 * @property {(key: string) => Promise<void>} del
 * @property {(key: string, amount: number, ttlMs: number) => Promise<number>} incrBy
 */

export {};
