CREATE TABLE IF NOT EXISTS locations (
  key text PRIMARY KEY,
  lat real NOT NULL,
  lon real NOT NULL,
  timezone text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS daily_history (
  location_key text NOT NULL REFERENCES locations (key),
  date date NOT NULL,
  tmax real,
  tmin real,
  app_tmax real,
  app_tmin real,
  precip real,
  rain real,
  snow real,
  precip_hours real,
  wind_max real,
  gust_max real,
  cloud_mean real,
  rh_mean real,
  sunshine real,
  PRIMARY KEY (location_key, date)
);

CREATE TABLE IF NOT EXISTS location_bias (
  location_key text NOT NULL REFERENCES locations (key),
  variable text NOT NULL,
  "offset" real NOT NULL,
  n_days integer NOT NULL,
  computed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (location_key, variable)
);
