const getJson = async (url) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`request failed: ${res.status}`);
  return res.json();
};

const DAILY_VARS =
  "temperature_2m_max,temperature_2m_min,precipitation_sum,snowfall_sum,wind_speed_10m_max,cloud_cover_mean";

const YEARS = 30;
const WINDOW = 3;
const BATCH = 5;

const readCache = (key) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const writeCache = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
};

const dayOfYear = (y, m, d) => (Date.UTC(y, m - 1, d) - Date.UTC(y, 0, 1)) / 86400000;

const getMonthSoFar = async (place, year, month, day) => {
  if (day === 1) return null;
  const pad = (n) => String(n).padStart(2, "0");
  const params = new URLSearchParams({
    latitude: place.lat,
    longitude: place.lon,
    start_date: `${year}-${pad(month)}-01`,
    end_date: `${year}-${pad(month)}-${pad(day - 1)}`,
    daily: "temperature_2m_max,temperature_2m_min",
    timezone: "auto",
  });
  const { daily } = await getJson(`https://api.open-meteo.com/v1/forecast?${params}`);
  const values = (list) => list.filter((v) => v != null);
  return {
    high: Math.max(...values(daily.temperature_2m_max)),
    low: Math.min(...values(daily.temperature_2m_min)),
  };
};

export const getHistory = async (place, localDate) => {
  const [year, month, day] = localDate.split("-").map(Number);
  const key = `history:v1:${place.lat.toFixed(2)},${place.lon.toFixed(2)}:${localDate}`;
  const cached = readCache(key);
  if (cached) return cached;

  const iso = (d) => d.toISOString().slice(0, 10);
  const fetchYear = (y) => {
    const monthStart = new Date(Date.UTC(y, month - 1, 1));
    const monthEnd = new Date(Date.UTC(y, month, 0));
    const target = new Date(Date.UTC(y, month - 1, Math.min(day, monthEnd.getUTCDate())));
    const from = new Date(Math.min(monthStart.getTime(), target.getTime() - WINDOW * 86400000));
    const to = new Date(Math.max(monthEnd.getTime(), target.getTime() + WINDOW * 86400000));
    const params = new URLSearchParams({
      latitude: place.lat,
      longitude: place.lon,
      start_date: iso(from),
      end_date: iso(to),
      daily: DAILY_VARS,
      timezone: "auto",
    });
    return getJson(`https://archive-api.open-meteo.com/v1/archive?${params}`).then((r) => r.daily);
  };
  const chunks = [];
  for (let i = 0; i < YEARS; i += BATCH) {
    const batch = Array.from({ length: Math.min(BATCH, YEARS - i) }, (_, j) =>
      fetchYear(year - 1 - i - j),
    );
    chunks.push(...(await Promise.all(batch)));
  }
  const daily = Object.fromEntries(
    Object.keys(chunks[0]).map((k) => [k, chunks.flatMap((c) => c[k])]),
  );

  const byYear = new Map();
  const windowValues = [];
  const entry = (y) => {
    if (!byYear.has(y)) byYear.set(y, { year: y, monthHigh: -Infinity, monthLow: Infinity });
    return byYear.get(y);
  };

  daily.time.forEach((date, i) => {
    const [y, m, d] = date.split("-").map(Number);
    const high = daily.temperature_2m_max[i];
    const low = daily.temperature_2m_min[i];
    if (high == null || low == null) return;
    const targetDay = Math.min(day, new Date(Date.UTC(y, month, 0)).getUTCDate());

    if (m === month) {
      const e = entry(y);
      e.monthHigh = Math.max(e.monthHigh, high);
      e.monthLow = Math.min(e.monthLow, low);
      if (d === targetDay) {
        Object.assign(e, {
          high,
          low,
          rain: daily.precipitation_sum[i],
          snow: daily.snowfall_sum[i],
          wind: daily.wind_speed_10m_max[i],
          cloud: daily.cloud_cover_mean[i],
        });
      }
    }

    const diff = Math.abs(dayOfYear(y, m, d) - dayOfYear(y, month, targetDay));
    if (Math.min(diff, 365 - diff) <= WINDOW) windowValues.push(high);
  });

  const years = [...byYear.values()].filter((e) => e.high != null).sort((a, b) => b.year - a.year);
  if (!years.length || !windowValues.length) throw new Error("no history");

  const result = {
    normalMax: windowValues.reduce((sum, v) => sum + v, 0) / windowValues.length,
    years,
    monthSoFar: await getMonthSoFar(place, year, month, day),
  };
  writeCache(key, result);
  return result;
};
