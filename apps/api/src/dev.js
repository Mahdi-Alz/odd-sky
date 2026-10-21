import { existsSync } from "node:fs";
import { serve } from "@hono/node-server";
import { createApp, createDeps } from "./index.js";

const envFile = new URL("../.env", import.meta.url);
if (existsSync(envFile)) process.loadEnvFile(envFile);

const deps = createDeps(process.env);
const port = Number(process.env.PORT ?? 8787);
serve({ fetch: createApp(deps).fetch, port }, () => {
  console.log(
    `api on http://localhost:${port} (history: ${deps.history.kind}, cache: ${deps.cache.kind})`,
  );
});
