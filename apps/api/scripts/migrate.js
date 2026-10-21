import { readdir, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { Pool } from "@neondatabase/serverless";

const root = new URL("..", import.meta.url);
const envFile = new URL(".env", root);
if (existsSync(envFile)) process.loadEnvFile(envFile);

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const pool = new Pool({ connectionString: url });
await pool.query(
  "CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())",
);
const { rows } = await pool.query("SELECT name FROM schema_migrations");
const applied = new Set(rows.map((row) => row.name));
const files = (await readdir(new URL("migrations/", root)))
  .filter((f) => f.endsWith(".sql"))
  .sort();

for (const file of files) {
  if (applied.has(file)) continue;
  const sql = await readFile(new URL(`migrations/${file}`, root), "utf8");
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(sql);
    await client.query("INSERT INTO schema_migrations (name) VALUES ($1)", [file]);
    await client.query("COMMIT");
    console.log(`applied ${file}`);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

await pool.end();
