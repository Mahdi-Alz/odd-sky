import { describe, expect, it } from "vitest";
import { isStale, pageWindow } from "./refresh.js";

const MIN = 60 * 1000;

describe("isStale", () => {
  it("is stale when never updated", () => {
    expect(isStale(null, 1000, 10 * MIN)).toBe(true);
    expect(isStale(undefined, 1000, 10 * MIN)).toBe(true);
  });

  it("becomes stale exactly at the max age", () => {
    const now = 100 * MIN;
    expect(isStale(now - 9 * MIN, now, 10 * MIN)).toBe(false);
    expect(isStale(now - 10 * MIN, now, 10 * MIN)).toBe(true);
  });
});

describe("pageWindow", () => {
  it("lists the active page first, then its neighbours", () => {
    expect(pageWindow(2, 5)).toEqual([2, 3, 1]);
  });

  it("stays inside the list at the edges", () => {
    expect(pageWindow(0, 3)).toEqual([0, 1]);
    expect(pageWindow(2, 3)).toEqual([2, 1]);
    expect(pageWindow(0, 1)).toEqual([0]);
  });

  it("clamps an out-of-range index", () => {
    expect(pageWindow(9, 3)).toEqual([2, 1]);
    expect(pageWindow(-4, 3)).toEqual([0, 1]);
  });

  it("is empty with no pages", () => {
    expect(pageWindow(0, 0)).toEqual([]);
  });
});
