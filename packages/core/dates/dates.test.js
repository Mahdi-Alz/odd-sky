import { describe, expect, it } from "vitest";
import {
  formatLocalIso,
  formatInstant,
  formatIsoDate,
  historyDates,
  isLeapYear,
  localDateIn,
  localParts,
  msUntilLocalMidnight,
  sameDayInYear,
} from "./index.js";

describe("localDateIn", () => {
  it("gives different dates for the same instant in different zones", () => {
    const instant = new Date("2026-10-19T22:00:00Z");
    expect(localDateIn("UTC", instant)).toBe("2026-10-19");
    expect(localDateIn("Asia/Tehran", instant)).toBe("2026-10-20");
    expect(localDateIn("America/Los_Angeles", instant)).toBe("2026-10-19");
    expect(localDateIn("Pacific/Kiritimati", instant)).toBe("2026-10-20");
  });

  it("rolls over exactly at local midnight", () => {
    expect(localDateIn("Asia/Tehran", new Date("2026-10-19T20:29:59Z"))).toBe("2026-10-19");
    expect(localDateIn("Asia/Tehran", new Date("2026-10-19T20:30:00Z"))).toBe("2026-10-20");
  });

  it("uses a 24 hour clock at midnight", () => {
    expect(localParts("UTC", new Date("2026-01-01T00:05:09Z"))).toMatchObject({
      hour: 0,
      minute: 5,
      second: 9,
    });
  });
});

describe("msUntilLocalMidnight", () => {
  const hour = 3600 * 1000;

  it("counts down to the next local midnight", () => {
    const instant = new Date("2026-10-19T20:00:00Z");
    expect(msUntilLocalMidnight("Asia/Tehran", instant)).toBeGreaterThanOrEqual(
      30 * 60 * 1000 - 1000,
    );
    expect(msUntilLocalMidnight("Asia/Tehran", instant)).toBeLessThanOrEqual(30 * 60 * 1000 + 1000);
  });

  it("handles the 25 hour day when clocks go back", () => {
    const instant = new Date("2026-10-25T00:00:00Z");
    const ms = msUntilLocalMidnight("Europe/London", instant);
    expect(Math.abs(ms - 24 * hour)).toBeLessThanOrEqual(1000);
  });

  it("handles the 23 hour day when clocks go forward", () => {
    const instant = new Date("2026-03-08T05:00:00Z");
    const ms = msUntilLocalMidnight("America/New_York", instant);
    expect(Math.abs(ms - 23 * hour)).toBeLessThanOrEqual(1000);
  });

  it("lands on the next date", () => {
    const instant = new Date("2026-06-15T13:17:00Z");
    const after = new Date(instant.getTime() + msUntilLocalMidnight("Europe/Oslo", instant));
    expect(localDateIn("Europe/Oslo", new Date(after.getTime() - 1000))).toBe("2026-06-15");
    expect(localDateIn("Europe/Oslo", new Date(after.getTime() + 1000))).toBe("2026-06-16");
  });
});

describe("29 February", () => {
  it("knows leap years", () => {
    expect(isLeapYear(2024)).toBe(true);
    expect(isLeapYear(2100)).toBe(false);
    expect(isLeapYear(2000)).toBe(true);
    expect(isLeapYear(2023)).toBe(false);
  });

  it("maps 29 February to 28 February in non-leap years", () => {
    expect(sameDayInYear("2028-02-29", 2027)).toBe("2027-02-28");
    expect(sameDayInYear("2028-02-29", 2024)).toBe("2024-02-29");
    expect(sameDayInYear("2028-02-29", 1900)).toBe("1900-02-28");
  });

  it("leaves other dates alone", () => {
    expect(sameDayInYear("2026-10-19", 2010)).toBe("2010-10-19");
    expect(sameDayInYear("2026-02-28", 2024)).toBe("2024-02-28");
  });
});

describe("historyDates", () => {
  it("lists the same calendar day in each of the last 30 years", () => {
    const list = historyDates("2026-10-19");
    expect(list).toHaveLength(30);
    expect(list[0]).toEqual({ year: 2025, date: "2025-10-19" });
    expect(list[29]).toEqual({ year: 1996, date: "1996-10-19" });
  });

  it("uses 28 February for non-leap years", () => {
    const list = historyDates("2028-02-29", 8);
    expect(list.find((entry) => entry.year === 2027)?.date).toBe("2027-02-28");
    expect(list.find((entry) => entry.year === 2024)?.date).toBe("2024-02-29");
  });
});

describe("formatting", () => {
  it("uses the Jalali calendar for fa", () => {
    const text = formatIsoDate("2026-10-19", "fa", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
    });
    expect(text).toContain("۱۴۰۵");
    expect(text).toContain("۲۷");
  });

  it("uses the Gregorian calendar for en", () => {
    expect(
      formatIsoDate("2026-10-19", "en", { year: "numeric", month: "long", day: "numeric" }),
    ).toBe("October 19, 2026");
  });

  it("does not shift the day for ISO dates", () => {
    expect(formatIsoDate("2026-01-01", "en", { day: "numeric", month: "numeric" })).toBe("1/1");
  });

  it("formats an instant in the city zone", () => {
    const instant = new Date("2026-10-19T20:45:00Z");
    expect(
      formatInstant(instant, "en", "Asia/Tehran", {
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      }),
    ).toBe("00:15");
  });
});

describe("formatLocalIso", () => {
  it("formats the hour exactly as written, with no zone shift", () => {
    expect(formatLocalIso("2026-10-19T16:00", "en", { hour: "numeric" })).toBe("4 PM");
    expect(formatLocalIso("2026-10-19T00:00", "en", { hour: "numeric" })).toBe("12 AM");
  });

  it("uses Persian digits for fa", () => {
    expect(
      formatLocalIso("2026-10-19T16:00", "fa", { hour: "numeric", hourCycle: "h23" }),
    ).toContain("۱۶");
  });
});
