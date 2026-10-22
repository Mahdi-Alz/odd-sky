export const HISTORY = {
  years: 30,
  model: "era5",
};

export const BIAS = {
  fromDaysBack: 60,
  toDaysBack: 6,
  maxAgeDays: 7,
  minDays: 20,
  variables: ["tmax", "tmin", "appTmax", "appTmin", "rhMean"],
};

export const OPEN_METEO_WEIGHT = {
  variablesPerCall: 10,
  daysPerCall: 14,
};
