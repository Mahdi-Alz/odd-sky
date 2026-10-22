import { Hono } from "hono";
import { RATE_LIMIT } from "./config.js";
import { requestLimit } from "./middleware/rateLimit.js";
import { factsRoute } from "./routes/facts.js";

/** @param {import("./deps.js").Deps} deps */
export const createApp = (deps) => {
  const app = new Hono().basePath("/api");

  app.use("/facts", requestLimit(deps, RATE_LIMIT.requestsPerMinute));
  app.route("/facts", factsRoute(deps));

  app.get("/health", async (c) => {
    const quota = await deps.limiter.usage();
    c.header("cache-control", "no-store");
    return c.json({
      ok: quota.status !== "exhausted",
      history: deps.history.kind,
      cache: deps.cache.kind,
      quota,
    });
  });

  app.notFound((c) => c.json({ error: "not-found" }, 404));
  app.onError((error, c) => {
    deps.log("request failed", error);
    return c.json({ error: "internal" }, 500);
  });

  return app;
};
