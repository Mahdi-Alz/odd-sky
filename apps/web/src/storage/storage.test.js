import { describe, expect, it } from "vitest";
import { createCache } from "./cache";
import { createKv, localBackend } from "./kv";
import { requestPersistence } from "./persist";
import { buildTransferLink, decodeCities, encodeCities, readTransferHash } from "./transfer";

const memoryBackend = () => {
  const map = new Map();
  return {
    get: async (key) => map.get(key),
    set: async (key, value) => void map.set(key, value),
    del: async (key) => void map.delete(key),
  };
};

const brokenBackend = () => {
  const fail = () => Promise.reject(new Error("broken"));
  return { get: fail, set: fail, del: fail };
};

const fakeLocalStorage = () => {
  const map = new Map();
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => void map.set(key, String(value)),
    removeItem: (key) => void map.delete(key),
    clear: () => map.clear(),
    key: (index) => [...map.keys()][index] ?? null,
    get length() {
      return map.size;
    },
  };
};

describe("createKv", () => {
  it("reads and writes through the primary backend", async () => {
    const primary = memoryBackend();
    const kv = createKv(primary, memoryBackend());
    await kv.set("a", { n: 1 });
    expect(await kv.get("a")).toEqual({ n: 1 });
    expect(await primary.get("a")).toEqual({ n: 1 });
    await kv.del("a");
    expect(await kv.get("a")).toBeUndefined();
  });

  it("falls back when the primary backend fails", async () => {
    const kv = createKv(brokenBackend(), localBackend("test", fakeLocalStorage()));
    await kv.set("cities", [1, 2, 3]);
    expect(await kv.get("cities")).toEqual([1, 2, 3]);
    await kv.del("cities");
    expect(await kv.get("cities")).toBeUndefined();
  });
});

describe("createCache", () => {
  it("returns saved data", async () => {
    const cache = createCache(memoryBackend(), () => 1000);
    await cache.set("k", { a: 1 });
    expect(await cache.get("k")).toEqual({ data: { a: 1 }, savedAt: 1000, expiresAt: null });
  });

  it("drops entries after their ttl", async () => {
    let time = 1000;
    const kv = memoryBackend();
    const cache = createCache(kv, () => time);
    await cache.set("k", "v", 500);
    time = 1499;
    expect((await cache.get("k")).data).toBe("v");
    time = 1500;
    expect(await cache.get("k")).toBeNull();
    expect(await kv.get("k")).toBeUndefined();
  });

  it("returns null when storage fails", async () => {
    const cache = createCache(brokenBackend());
    await cache.set("k", "v");
    expect(await cache.get("k")).toBeNull();
  });
});

describe("transfer link", () => {
  const cities = [
    {
      id: "112931",
      name: "Tehran",
      admin: "Tehran",
      country: "Iran",
      lat: 35.69,
      lon: 51.42,
      timezone: "Asia/Tehran",
      order: 0,
    },
    {
      id: "1",
      name: "تهران",
      admin: "استان تهران",
      country: "ایران",
      lat: 35.7,
      lon: 51.4,
      timezone: "Asia/Tehran",
      order: 1,
    },
  ];

  it("round-trips a city list", async () => {
    expect(await decodeCities(await encodeCities(cities))).toEqual(cities);
  });

  it("builds a url-safe fragment link", async () => {
    const link = await buildTransferLink(cities, "https://example.com/");
    expect(link.startsWith("https://example.com/#import=")).toBe(true);
    expect(link.slice(link.indexOf("#import=") + 8)).toMatch(/^[A-Za-z0-9_-]+$/);
    const hash = link.slice(link.indexOf("#"));
    expect(await decodeCities(readTransferHash(hash))).toEqual(cities);
  });

  it("ignores other hashes", () => {
    expect(readTransferHash("#something")).toBeNull();
    expect(readTransferHash("")).toBeNull();
  });

  it("rejects garbage", async () => {
    await expect(decodeCities("not-valid-data")).rejects.toThrow();
  });

  it("rejects out-of-range coordinates and bad rows", async () => {
    const bad = await encodeCities([{ ...cities[0], lat: 120 }]);
    await expect(decodeCities(bad)).rejects.toThrow("invalid transfer data");
    const noZone = await encodeCities([{ ...cities[0], timezone: "" }]);
    await expect(decodeCities(noZone)).rejects.toThrow("invalid transfer data");
  });

  it("rejects too many cities", async () => {
    const many = Array.from({ length: 101 }, (_, i) => ({ ...cities[0], id: String(i) }));
    await expect(decodeCities(await encodeCities(many))).rejects.toThrow("invalid transfer data");
  });
});

describe("requestPersistence", () => {
  it("returns false when persistence is unsupported", async () => {
    expect(await requestPersistence()).toBe(false);
  });
});
