import { getJson } from "./http";
import { HOURLY_POINTS } from "../config/refresh";

const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";

const CURRENT_VARS =
  "temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code,is_day,uv_index";
const HOURLY_VARS = "temperature_2m,weather_code,is_day,precipitation_probability";
const DAILY_VARS =
  "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,snowfall_sum,wind_speed_10m_max,cloud_cover_mean";

/**
 * @param {Pick<import("@odd-sky/core/types").Place, "lat" | "lon">} place
 * @param {AbortSignal} [signal]
 * @returns {Promise<import("@odd-sky/core/types").Forecast>}
 */
export const getForecast = async (place, signal) => {
  const params = new URLSearchParams({
    latitude: String(place.lat),
    longitude: String(place.lon),
    current: CURRENT_VARS,
    hourly: HOURLY_VARS,
    daily: DAILY_VARS,
    forecast_days: "7",
    forecast_hours: String(HOURLY_POINTS),
    timezone: "auto",
  });
  const { current, hourly, daily, timezone } = await getJson(`${FORECAST_URL}?${params}`, {
    signal,
  });

  return {
    timezone,
    localDate: daily.time[0],
    current: {
      time: current.time,
      temp: current.temperature_2m,
      feelsLike: current.apparent_temperature,
      humidity: current.relative_humidity_2m,
      wind: current.wind_speed_10m,
      uv: current.uv_index,
      code: current.weather_code,
      isDay: current.is_day === 1,
    },
    hourly: hourly.time.map((time, i) => ({
      time,
      temp: hourly.temperature_2m[i],
      precipProbability: hourly.precipitation_probability[i] ?? 0,
      code: hourly.weather_code[i],
      isDay: hourly.is_day[i] === 1,
    })),
    daily: daily.time.map((date, i) => ({
      date,
      code: daily.weather_code[i],
      max: daily.temperature_2m_max[i],
      min: daily.temperature_2m_min[i],
      precip: daily.precipitation_sum[i],
      snow: daily.snowfall_sum[i],
      wind: daily.wind_speed_10m_max[i],
      cloud: daily.cloud_cover_mean[i],
    })),
  };
};
