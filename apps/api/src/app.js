import { Hono } from "hono";
import { factsRoute } from "./routes/facts.js";

/** @param {import("./deps.js").Deps} deps */
export const createApp = (deps) => {
  const app = new Hono().basePath("/api");

  app.route("/facts", factsRoute(deps));

  app.get("/health", async (c) =>
    c.json({
      ok: true,
      history: deps.history.kind,
      cache: deps.cache.kind,
      quota: await deps.limiter.usage(),
    }),
  );

  app.notFound((c) => c.json({ error: "not-found" }, 404));
  app.onError((error, c) => {
    deps.log("request failed", error);
    return c.json({ error: "internal" }, 500);
  });

  return app;
};
