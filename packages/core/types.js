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
 * @property {Partial<Record<'fa' | 'en', PlaceLabel>>} [labels]
 */

/**
 * @typedef {Object} PlaceLabel
 * @property {string} name
 * @property {string} admin
 * @property {string} country
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
 * @property {number} apparentTemp
 * @property {number} wind
 * @property {number} gusts
 * @property {number} precipProbability
 * @property {number} precipAmount
 * @property {number} uv
 * @property {number} humidity
 * @property {number} cloud
 * @property {number} radiation
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
 * @typedef {Object} BiasOffset
 * @property {string} variable
 * @property {number} offset
 * @property {number} nDays
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
 * @typedef {Object} Departure
 * @property {string} variable
 * @property {number} value
 * @property {number} mean
 * @property {number} delta
 * @property {number} years
 */

/**
 * @typedef {Object} FactsResponse
 * @property {string} locationKey
 * @property {string} localDate
 * @property {string} timezone
 * @property {'era5'} source
 * @property {number} yearsAvailable
 * @property {Fact[]} facts
 * @property {Departure | null} departure
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
 * @typedef {keyof Omit<DayStats, 'date'> | 'range'} FactVariable
 */

/**
 * @typedef {Object} DetectorContext
 * @property {string} localDate
 * @property {number} historyYears
 */

/**
 * @typedef {Object} Detector
 * @property {string} id
 * @property {string} family
 * @property {FactVariable} variable
 * @property {string[]} messageKeys
 * @property {(today: DayStats, history: DayStats[], ctx: DetectorContext) => FactCandidate | null} detect
 */

/**
 * @typedef {Object} RecordDetectorConfig
 * @property {string} id
 * @property {string} family
 * @property {FactVariable} variable
 * @property {'high' | 'low'} direction
 * @property {number} margin
 * @property {string} unit
 * @property {number} [min]
 * @property {number} [max]
 * @property {string} messageKey
 */

/**
 * @typedef {Object} FirstDetectorConfig
 * @property {string} id
 * @property {string} family
 * @property {FactVariable} variable
 * @property {number} threshold
 * @property {string} unit
 * @property {string} messageKey
 */

/**
 * @typedef {Object} DryDetectorConfig
 * @property {string} id
 * @property {string} family
 * @property {FactVariable} variable
 * @property {number} wetAt
 * @property {number} dryBelow
 * @property {number} minShare
 * @property {string} unit
 * @property {string} messageKey
 */

/**
 * @typedef {'temp' | 'apparentTemp' | 'wind' | 'gusts' | 'precipProbability' | 'precipAmount' | 'uv' | 'humidity' | 'cloud' | 'thunder' | 'fog' | 'freezing' | 'snow' | 'daylight' | 'dewPoint' | 'evaporation' | 'moon'} FactorSource
 */

/**
 * @typedef {'mean' | 'max' | 'min' | 'sum'} Aggregate
 */

/**
 * @typedef {Object} ActivityFactor
 * @property {FactorSource} source
 * @property {Aggregate} [aggregate]
 * @property {number} weight
 * @property {[number, number]} ideal
 * @property {[number, number]} ok
 */

/**
 * @typedef {Object} ActivityVeto
 * @property {FactorSource} source
 * @property {Aggregate} [aggregate]
 * @property {number} [above]
 * @property {number} [below]
 */

/**
 * @typedef {Object} ActivityConfig
 * @property {string} id
 * @property {'any' | 'day' | 'night'} light
 * @property {number | null} durationHours
 * @property {'today' | number} horizon
 * @property {ActivityFactor[]} factors
 * @property {ActivityVeto[]} vetoes
 */

/**
 * @typedef {Object} ActivityReason
 * @property {string} factor
 * @property {'ideal' | 'ok' | 'bad'} level
 * @property {'below' | 'within' | 'above'} side
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
 * @property {boolean} installHintDismissed
 * @property {'metric' | 'imperial'} units
 * @property {Record<string, boolean>} activities
 * @property {Record<string, Record<string, number>>} thresholds
 */

export {};
