import { describe, expect, it } from "vitest";
import { createApp } from "../app.js";
import { RATE_LIMIT } from "../config.js";
import { createTestDeps } from "../../test/helpers.js";

const setup = () => {
  const test = createTestDeps();
  return { ...test, app: createApp(test.deps) };
};

/** @param {string} ip */
const from = (ip) => ({ headers: { "x-forwarded-for": `${ip}, 10.0.0.1` } });

const city = (/** @type {number} */ i) =>
  `/api/facts?lat=${(10 + i * 0.5).toFixed(1)}&lon=20&tz=UTC`;

describe("per-IP rate limits", () => {
  it("refuses requests past the per-minute limit, per IP", async () => {
    const { app, clock } = setup();
    for (let i = 0; i < RATE_LIMIT.requestsPerMinute; i += 1) {
      expect((await app.request("/api/facts", from("1.1.1.1"))).status).toBe(400);
    }
    const refused = await app.request("/api/facts", from("1.1.1.1"));
    expect(refused.status).toBe(429);
    expect(await refused.json()).toEqual({ error: "rate-limited" });
    expect(Number(refused.headers.get("retry-after"))).toBeGreaterThan(0);
    expect((await app.request("/api/facts", from("2.2.2.2"))).status).toBe(400);
    clock.time += 60_000;
    expect((await app.request("/api/facts", from("1.1.1.1"))).status).toBe(400);
  });

  it("limits fresh computations per hour but not cache hits", async () => {
    const { app, clock } = setup();
    for (let i = 0; i < RATE_LIMIT.computesPerHour; i += 1) {
      expect((await app.request(city(i), from("3.3.3.3"))).status).toBe(200);
      clock.time += 61_000;
    }
    expect((await app.request(city(99), from("3.3.3.3"))).status).toBe(429);
    expect((await app.request(city(0), from("3.3.3.3"))).headers.get("x-cache")).toBe("hit");
    expect((await app.request(city(99), from("4.4.4.4"))).status).toBe(200);
  });

  it("does not limit the health check", async () => {
    const { app } = setup();
    for (let i = 0; i <= RATE_LIMIT.requestsPerMinute; i += 1) {
      expect((await app.request("/api/health", from("5.5.5.5"))).status).toBe(200);
    }
  });
});
