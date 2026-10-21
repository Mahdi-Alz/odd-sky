import { describe, expect, it } from "vitest";
import { createLimiter } from "./limiter.js";
import { QuotaError } from "../errors.js";
import { createMemoryCache } from "../repositories/memoryCache.js";

describe("createLimiter", () => {
  const start = Date.parse("2026-10-22T08:00:30Z");

  it("refuses a call that would pass the minute budget and rolls back", async () => {
    const clock = { time: start };
    const cache = createMemoryCache({ now: () => clock.time });
    const limiter = createLimiter({
      cache,
      limits: { perMinute: 3, perHour: 100, perDay: 1000 },
      now: () => clock.time,
    });
    await limiter.take(1.3);
    await limiter.take(1.3);
    const error = await limiter.take(1.3).catch((e) => e);
    expect(error).toBeInstanceOf(QuotaError);
    expect(error.retryAfterMs).toBe(30_000);
    expect(await limiter.usage()).toMatchObject({ day: 2.6, hour: 2.6, minute: 2.6 });

    clock.time += 60_000;
    await limiter.take(1.3);
    expect(await limiter.usage()).toMatchObject({ day: 3.9, hour: 3.9, minute: 1.3 });
  });

  it("refuses once the daily budget is used up", async () => {
    const cache = createMemoryCache();
    const limiter = createLimiter({
      cache,
      limits: { perMinute: 100, perHour: 100, perDay: 2 },
      now: () => start,
    });
    await limiter.take(2);
    await expect(limiter.take(0.5)).rejects.toBeInstanceOf(QuotaError);
  });
});
