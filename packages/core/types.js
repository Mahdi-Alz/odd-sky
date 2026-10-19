/**
 * @typedef {Object} Place
 * @property {string} id
 * @property {string} name
 * @property {string} admin
 * @property {string} country
 * @property {number} lat
 * @property {number} lon
 * @property {string} timezone
 * @property {number} order
 */

/**
 * @typedef {Object} Current
 * @property {string} time
 * @property {number} temp
 * @property {number} feelsLike
 * @property {number} humidity
 * @property {number} wind
 * @property {number} uv
 * @property {number} code
 * @property {boolean} isDay
 */

/**
 * @typedef {Object} HourlyPoint
 * @property {string} time
 * @property {number} temp
 * @property {number} feelsLike
 * @property {number} humidity
 * @property {number} precipProbability
 * @property {number} precip
 * @property {number} wind
 * @property {number} gust
 * @property {number} cloud
 * @property {number} uv
 * @property {number} code
 * @property {boolean} isDay
 */

/**
 * @typedef {Object} DailyPoint
 * @property {string} date
 * @property {number} code
 * @property {number} max
 * @property {number} min
 * @property {number} precip
 * @property {number} snow
 * @property {number} wind
 * @property {number} cloud
 * @property {string} sunrise
 * @property {string} sunset
 */

/**
 * @typedef {Object} DayStats
 * @property {string} date
 * @property {number | null} tmax
 * @property {number | null} tmin
 * @property {number | null} appTmax
 * @property {number | null} appTmin
 * @property {number | null} precip
 * @property {number | null} rain
 * @property {number | null} snow
 * @property {number | null} precipHours
 * @property {number | null} windMax
 * @property {number | null} gustMax
 * @property {number | null} cloudMean
 * @property {number | null} rhMean
 * @property {number | null} sunshine
 */

/**
 * @typedef {Object} Forecast
 * @property {string} timezone
 * @property {string} localDate
 * @property {Current} current
 * @property {HourlyPoint[]} hourly
 * @property {DailyPoint[]} daily
 */

/**
 * @typedef {'record-high' | 'record-low' | 'first-in' | 'unusual'} FactKind
 */

/**
 * @typedef {Object} FactPrevious
 * @property {number} value
 * @property {number} yearsAgo
 */

/**
 * @typedef {Object} Fact
 * @property {string} id
 * @property {string} detector
 * @property {string} family
 * @property {FactKind} kind
 * @property {string} variable
 * @property {number} years
 * @property {number} value
 * @property {FactPrevious | null} previous
 * @property {string} unit
 * @property {number} score
 * @property {'high' | 'medium'} confidence
 * @property {string} messageKey
 * @property {Record<string, number | string>} params
 */

/**
 * @typedef {Object} FactsResponse
 * @property {string} locationKey
 * @property {string} localDate
 * @property {string} timezone
 * @property {'era5'} source
 * @property {number} yearsAvailable
 * @property {Fact[]} facts
 */

/**
 * @typedef {Object} FactCandidate
 * @property {string} detector
 * @property {string} family
 * @property {FactKind} kind
 * @property {string} variable
 * @property {number} years
 * @property {number} value
 * @property {FactPrevious | null} previous
 * @property {string} unit
 * @property {number} magnitude
 * @property {'high' | 'medium'} confidence
 * @property {string} messageKey
 * @property {Record<string, number | string>} params
 */

/**
 * @typedef {Object} DetectorContext
 * @property {string} localDate
 * @property {string} timezone
 * @property {Record<string, number>} bias
 * @property {Record<string, number>} stdDev
 */

/**
 * @typedef {Object} Detector
 * @property {string} id
 * @property {string} family
 * @property {string} variable
 * @property {'high' | 'low'} direction
 * @property {number} minYears
 * @property {number} margin
 * @property {(today: DayStats) => boolean} [when]
 * @property {(today: DayStats, history: DayStats[], ctx: DetectorContext) => FactCandidate | null} detect
 */

/**
 * @typedef {Object} ActivityReason
 * @property {string} factor
 * @property {'ideal' | 'ok' | 'bad'} level
 * @property {number} value
 */

/**
 * @typedef {Object} ActivityScore
 * @property {string} activity
 * @property {number} score
 * @property {'great' | 'good' | 'fair' | 'poor'} label
 * @property {ActivityReason[]} reasons
 * @property {{ start: string, end: string } | null} window
 */

/**
 * @typedef {Object} Settings
 * @property {'fa' | 'en'} locale
 * @property {'metric' | 'imperial'} units
 * @property {Record<string, boolean>} activities
 * @property {Record<string, Record<string, number>>} thresholds
 */

export {};
