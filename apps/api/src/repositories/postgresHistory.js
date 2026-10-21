import { neon } from "@neondatabase/serverless";
import { DAY_COLUMNS } from "./columns.js";

const selectColumns = DAY_COLUMNS.map(([field, column]) => `${column} AS "${field}"`).join(", ");
const recordColumns = DAY_COLUMNS.map(([, column]) => `${column} real`).join(", ");
const insertColumns = DAY_COLUMNS.map(([, column]) => column).join(", ");

/**
 * @param {{ url: string }} options
 * @returns {import("./types.js").HistoryRepo}
 */
export const createPostgresHistory = ({ url }) => {
  const sql = neon(url);

  return {
    kind: "postgres",
    async saveLocation(location) {
      await sql.query(
        "INSERT INTO locations (key, lat, lon, timezone) VALUES ($1, $2, $3, $4) ON CONFLICT (key) DO NOTHING",
        [location.key, location.lat, location.lon, location.timezone],
      );
      const rows = await sql.query("SELECT key, lat, lon, timezone FROM locations WHERE key = $1", [
        location.key,
      ]);
      const row = rows[0];
      return { key: row.key, lat: row.lat, lon: row.lon, timezone: row.timezone };
    },
    async storedDates(key, dates) {
      const rows = await sql.query(
        "SELECT to_char(date, 'YYYY-MM-DD') AS date FROM daily_history WHERE location_key = $1 AND date = ANY($2::date[])",
        [key, dates],
      );
      return rows.map((row) => row.date);
    },
    async getDays(key, dates) {
      const rows = await sql.query(
        `SELECT to_char(date, 'YYYY-MM-DD') AS date, ${selectColumns} FROM daily_history WHERE location_key = $1 AND date = ANY($2::date[]) ORDER BY date DESC`,
        [key, dates],
      );
      return /** @type {import("@odd-sky/core/types").DayStats[]} */ (rows);
    },
    async saveDays(key, days) {
      if (!days.length) return;
      const records = days.map((day) => ({
        location_key: key,
        date: day.date,
        ...Object.fromEntries(DAY_COLUMNS.map(([field, column]) => [column, day[field]])),
      }));
      await sql.query(
        `INSERT INTO daily_history (location_key, date, ${insertColumns})
         SELECT location_key, date, ${insertColumns}
         FROM jsonb_to_recordset($1::jsonb) AS x(location_key text, date date, ${recordColumns})
         ON CONFLICT (location_key, date) DO NOTHING`,
        [JSON.stringify(records)],
      );
    },
    async getBias(key) {
      const rows = await sql.query(
        `SELECT variable, "offset", n_days AS "nDays", computed_at AS "computedAt" FROM location_bias WHERE location_key = $1`,
        [key],
      );
      if (!rows.length) return { offsets: [], computedAt: null };
      return {
        offsets: rows.map((row) => ({
          variable: row.variable,
          offset: row.offset,
          nDays: row.nDays,
        })),
        computedAt: Math.min(...rows.map((row) => new Date(row.computedAt).getTime())),
      };
    },
    async saveBias(key, offsets) {
      await sql.transaction([
        sql.query("DELETE FROM location_bias WHERE location_key = $1", [key]),
        sql.query(
          `INSERT INTO location_bias (location_key, variable, "offset", n_days)
           SELECT $1, variable, "offset", n_days
           FROM jsonb_to_recordset($2::jsonb) AS x(variable text, "offset" real, n_days integer)`,
          [
            key,
            JSON.stringify(
              offsets.map((o) => ({ variable: o.variable, offset: o.offset, n_days: o.nDays })),
            ),
          ],
        ),
      ]);
    },
  };
};
