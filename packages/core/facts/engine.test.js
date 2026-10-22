import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { historyDates } from "../dates/index.js";
import { correctToday, departureFor, runFacts, selectFacts } from "./engine.js";
import { DETECTORS, dayState } from "./detectors.js";

/** @param {string} name */
const golden = (name) =>
  JSON.parse(readFileSync(new URL(`./fixtures/${name}-2026-10-23.json`, import.meta.url), "utf8"));

/** @param {string} date @param {Partial<import("../types.js").DayStats>} [values] */
const day = (date, values = {}) => ({
  date,
  tmax: 20,
  tmin: 10,
  appTmax: 19,
  appTmin: 9,
  precip: 0,
  rain: 0,
  snow: 0,
  precipHours: 0,
  windMax: 10,
  gustMax: 25,
  cloudMean: 40,
  rhMean: 50,
  sunshine: 20000,
  ...values,
});

const localDate = "2026-10-23";

/** @param {(ago: number) => Partial<import("../types.js").DayStats>} [values] */
const history = (values = () => ({})) =>
  historyDates(localDate, 30).map(({ date }, i) => day(date, values(i + 1)));

/** @param {string} id */
const detector = (id) => {
  const found = DETECTORS.find((d) => d.id === id);
  if (!found) throw new Error(id);
  return found;
};

const ctx = { localDate, historyYears: 30 };

describe("golden facts on recorded ERA5 history and forecasts", () => {
  it("Tehran: highest feels-like temperature in 15 years, 2010 was warmer", () => {
    const f = golden("tehran");
    const result = runFacts({ today: f.today, history: f.history, bias: f.bias, localDate });
    expect(result.facts).toEqual([
      expect.objectContaining({
        id: "app-tmax-high",
        kind: "record-high",
        years: 15,
        value: 22.4,
        previous: { value: 23.4, yearsAgo: 16 },
        messageKey: "facts.appTmaxHigh",
        params: { years: 15 },
        confidence: "medium",
      }),
    ]);
    expect(result.departures).toEqual([
      { variable: "tmax", value: 24.9, mean: 21.5, delta: 3.4, years: 30 },
      expect.objectContaining({ variable: "tmin", delta: 2.8, years: 30 }),
    ]);
  });

  it("Rasht: warmest night in all 30 years, and rainy two years ago", () => {
    const f = golden("rasht");
    const { facts, departures } = runFacts({
      today: f.today,
      history: f.history,
      bias: f.bias,
      localDate,
    });
    expect(facts).toEqual([
      expect.objectContaining({
        id: "tmin-high",
        years: 30,
        value: 17.9,
        previous: null,
        messageKey: "facts.tminHighAll",
        params: { years: 30 },
      }),
      expect.objectContaining({
        id: "state-contrast",
        kind: "contrast",
        messageKey: "facts.contrastYearsAgo",
        params: { ago: 2, past: "rainy", now: "cloudy" },
      }),
    ]);
    expect(departures.map((d) => [d.variable, d.delta])).toEqual([
      ["tmax", 2.3],
      ["tmin", 3.8],
    ]);
  });

  it("Rasht without bias correction still reports the record, with the raw value", () => {
    const f = golden("rasht");
    const { facts } = runFacts({ today: f.today, history: f.history, localDate });
    expect(facts[0]).toMatchObject({ id: "tmin-high", value: 18.3, confidence: "high" });
  });

  it("Dubai: sunny as every recent year, so only the departures", () => {
    const f = golden("dubai");
    const result = runFacts({ today: f.today, history: f.history, bias: f.bias, localDate });
    expect(result.facts).toEqual([]);
    expect(result.departures.map((d) => d.variable)).toEqual(["tmax", "tmin"]);
  });

  it("Oslo: rain today where it was cloudy three years ago", () => {
    const f = golden("oslo");
    const { facts } = runFacts({ today: f.today, history: f.history, bias: f.bias, localDate });
    expect(facts).toEqual([
      expect.objectContaining({
        id: "state-contrast",
        messageKey: "facts.contrastYearsAgo",
        params: { ago: 3, past: "cloudy", now: "rainy" },
      }),
    ]);
  });

  it("returns the Fact contract for every fact", () => {
    const f = golden("tehran");
    const [fact] = runFacts({ today: f.today, history: f.history, bias: f.bias, localDate }).facts;
    expect(Object.keys(fact).sort()).toEqual(
      [
        "confidence",
        "detector",
        "family",
        "id",
        "kind",
        "messageKey",
        "params",
        "previous",
        "score",
        "unit",
        "value",
        "variable",
        "years",
      ].sort(),
    );
  });
});

describe("record detectors", () => {
  it("counts the years before the first year at least as extreme", () => {
    const past = history((ago) => ({ tmax: ago === 9 ? 27 : 20 }));
    const fact = detector("tmax-high").detect(day(localDate, { tmax: 26 }), past, ctx);
    expect(fact).toMatchObject({
      years: 8,
      previous: { value: 27, yearsAgo: 9 },
      messageKey: "facts.tmaxHigh",
    });
  });

  it("treats a tie as not beaten", () => {
    const past = history((ago) => ({ tmax: ago === 7 ? 26 : 20 }));
    const fact = detector("tmax-high").detect(day(localDate, { tmax: 26 }), past, ctx);
    expect(fact?.years).toBe(6);
  });

  it("needs the margin to count a year as beaten", () => {
    const past = history((ago) => ({ tmax: ago === 3 ? 25.7 : 20 }));
    expect(detector("tmax-high").detect(day(localDate, { tmax: 26 }), past, ctx)?.years).toBe(2);
    const clear = history((ago) => ({ tmax: ago === 3 ? 25.5 : 20 }));
    expect(detector("tmax-high").detect(day(localDate, { tmax: 26 }), clear, ctx)?.years).toBe(30);
  });

  it("uses the All message only when every year was beaten", () => {
    const fact = detector("tmin-low").detect(day(localDate, { tmin: 2 }), history(), ctx);
    expect(fact).toMatchObject({
      years: 30,
      messageKey: "facts.tminLowAll",
      previous: null,
      kind: "record-low",
    });
  });

  it("stops at a missing year and does not claim more than it saw", () => {
    const past = history().filter((d) => d.date !== "2015-10-23");
    const fact = detector("tmax-high").detect(day(localDate, { tmax: 30 }), past, ctx);
    expect(fact).toMatchObject({ years: 10, messageKey: "facts.tmaxHigh", previous: null });
  });

  it("stops at a missing value too", () => {
    const past = history((ago) => ({ tmax: ago === 4 ? null : 20 }));
    expect(detector("tmax-high").detect(day(localDate, { tmax: 30 }), past, ctx)?.years).toBe(3);
  });

  it("skips when today's value is missing or outside the category bounds", () => {
    expect(detector("tmax-high").detect(day(localDate, { tmax: null }), history(), ctx)).toBeNull();
    expect(
      detector("precip-high").detect(day(localDate, { precip: 0.6 }), history(), ctx),
    ).toBeNull();
    expect(
      detector("gust-high").detect(day(localDate, { gustMax: 39 }), history(), ctx),
    ).toBeNull();
    expect(
      detector("cloud-low").detect(day(localDate, { cloudMean: 15 }), history(), ctx),
    ).toBeNull();
  });

  it("scores the day-night range from tmax and tmin", () => {
    const fact = detector("range-high").detect(
      day(localDate, { tmax: 30, tmin: 8 }),
      history(),
      ctx,
    );
    expect(fact).toMatchObject({ variable: "range", value: 22, years: 30 });
  });
});

describe("first-in and unusual detectors", () => {
  it("reports the first snow on this day in N years", () => {
    const past = history((ago) => ({ snow: ago === 12 ? 2 : 0 }));
    const fact = detector("snow-first").detect(day(localDate, { snow: 3 }), past, ctx);
    expect(fact).toMatchObject({
      kind: "first-in",
      years: 11,
      previous: { value: 2, yearsAgo: 12 },
      messageKey: "facts.snowFirst",
    });
  });

  it("ignores a dusting below the threshold", () => {
    expect(detector("snow-first").detect(day(localDate, { snow: 0.2 }), history(), ctx)).toBeNull();
  });

  it("reports a dry day where rain is usual", () => {
    const past = history((ago) => ({ precip: ago % 5 === 0 ? 0 : 4 }));
    const fact = detector("dry-unusual").detect(day(localDate, { precip: 0 }), past, ctx);
    expect(fact).toMatchObject({
      kind: "unusual",
      params: { rainy: 24, years: 30 },
      messageKey: "facts.dryUnusual",
    });
    expect(detector("dry-unusual").detect(day(localDate, { precip: 0.5 }), past, ctx)).toBeNull();
  });

  it("does not call a dry day unusual where rain is not usual", () => {
    const past = history((ago) => ({ precip: ago % 2 === 0 ? 0 : 4 }));
    expect(detector("dry-unusual").detect(day(localDate, { precip: 0 }), past, ctx)).toBeNull();
  });
});

describe("runFacts", () => {
  it("drops facts below minYears", () => {
    const past = history((ago) => ({ tmax: ago === 5 ? 30 : 20 }));
    const { facts } = runFacts({ today: day(localDate, { tmax: 26 }), history: past, localDate });
    expect(facts.find((f) => f.id === "tmax-high")).toBeUndefined();
    const longer = history((ago) => ({ tmax: ago === 6 ? 30 : 20 }));
    const { facts: kept } = runFacts({
      today: day(localDate, { tmax: 26 }),
      history: longer,
      localDate,
    });
    expect(kept.find((f) => f.id === "tmax-high")?.years).toBe(5);
  });

  it("keeps at most one fact per family and at most three", () => {
    const today = day(localDate, {
      tmax: 35,
      appTmax: 36,
      tmin: 25,
      appTmin: 24,
      precip: 30,
      gustMax: 90,
      rhMean: 10,
    });
    const { facts } = runFacts({ today, history: history(), localDate });
    expect(facts).toHaveLength(3);
    expect(new Set(facts.map((f) => f.family)).size).toBe(3);
    expect(facts.map((f) => f.score)).toEqual([...facts.map((f) => f.score)].sort((a, b) => b - a));
  });

  it("applies the bias before ranking", () => {
    const today = day(localDate, { tmax: 21 });
    expect(runFacts({ today, history: history(), localDate }).facts[0]?.id).toBe("tmax-high");
    const biased = runFacts({
      today,
      history: history(),
      localDate,
      bias: [{ variable: "tmax", offset: 1, nDays: 40 }],
    });
    expect(biased.facts.find((f) => f.id === "tmax-high")).toBeUndefined();
  });

  it("maps 29 February to 28 February in non-leap years", () => {
    const leapDate = "2028-02-29";
    const past = historyDates(leapDate, 30).map(({ date }) => day(date, { tmax: 5 }));
    expect(past.map((d) => d.date)).toContain("2027-02-28");
    const { facts } = runFacts({
      today: day(leapDate, { tmax: 12 }),
      history: past,
      localDate: leapDate,
    });
    expect(facts[0]).toMatchObject({ id: "tmax-high", years: 30, messageKey: "facts.tmaxHighAll" });
  });

  it("returns nothing from an empty history", () => {
    expect(runFacts({ today: day(localDate, { tmax: 40 }), history: [], localDate })).toEqual({
      facts: [],
      departures: [],
    });
  });
});

describe("helpers", () => {
  it("subtracts the forecast-minus-ERA5 offset", () => {
    expect(
      correctToday(day(localDate, { tmax: 20, rhMean: 50 }), [
        { variable: "tmax", offset: 1.5, nDays: 30 },
        { variable: "rhMean", offset: -4, nDays: 30 },
      ]),
    ).toMatchObject({ tmax: 18.5, rhMean: 54 });
  });

  it("breaks score ties by id so the order is stable", () => {
    const base = {
      detector: "",
      family: "",
      kind: "record-high",
      variable: "tmax",
      years: 5,
      value: 1,
      previous: null,
      unit: "C",
      confidence: "high",
      messageKey: "",
      params: {},
    };
    const facts = /** @type {import("../types.js").Fact[]} */ ([
      { ...base, id: "b", family: "x", score: 2 },
      { ...base, id: "a", family: "y", score: 2 },
    ]);
    expect(selectFacts(facts).map((f) => f.id)).toEqual(["a", "b"]);
  });

  it("needs enough years for a departure", () => {
    expect(departureFor(day(localDate), history().slice(0, 9), "tmax")).toBeNull();
    expect(departureFor(day(localDate, { tmax: 23 }), history(), "tmax")).toMatchObject({
      delta: 3,
      mean: 20,
    });
  });
});

describe("rare detectors", () => {
  it("says how few years were this warm when it is not a record", () => {
    const past = history((ago) => ({ tmax: ago === 2 || ago === 9 ? 30 : 20 }));
    const fact = detector("tmax-rare-high").detect(day(localDate, { tmax: 26 }), past, ctx);
    expect(fact).toMatchObject({
      kind: "rare-high",
      params: { count: 2, years: 30 },
      messageKey: "facts.tmaxRareHigh",
    });
  });

  it("leaves records to the record detector and skips common values", () => {
    expect(
      detector("tmax-rare-high").detect(day(localDate, { tmax: 26 }), history(), ctx),
    ).toBeNull();
    const many = history((ago) => ({ tmax: ago <= 4 ? 30 : 20 }));
    expect(detector("tmax-rare-high").detect(day(localDate, { tmax: 26 }), many, ctx)).toBeNull();
  });

  it("needs enough years", () => {
    const past = history((ago) => ({ tmax: ago === 2 ? 30 : 20 })).slice(0, 19);
    expect(detector("tmax-rare-high").detect(day(localDate, { tmax: 26 }), past, ctx)).toBeNull();
  });
});

describe("day states", () => {
  it.each([
    [{ snow: 2, precip: 5 }, "snowy"],
    [{ precip: 3 }, "rainy"],
    [{ cloudMean: 10, sunshine: 30000, precip: 0 }, "sunny"],
    [{ cloudMean: 90, precip: 0.5 }, "cloudy"],
    [{ cloudMean: 50, precip: 0 }, null],
    [{ cloudMean: 10, sunshine: 10000, precip: 0 }, null],
  ])("classifies %o as %s", (values, expected) => {
    expect(dayState(day(localDate, values))).toBe(expected);
  });
});

describe("contrast detector", () => {
  const sunny = { cloudMean: 10, sunshine: 30000, precip: 0 };
  const rainy = { precip: 6, cloudMean: 90 };
  const snowy = { snow: 3, precip: 4, cloudMean: 95 };

  it("compares with last year", () => {
    const past = history((ago) => (ago === 1 ? rainy : sunny));
    const fact = detector("state-contrast").detect(day(localDate, sunny), past, ctx);
    expect(fact).toMatchObject({
      messageKey: "facts.contrastLastYear",
      params: { ago: 1, past: "rainy", now: "sunny" },
    });
  });

  it("reports a run of years with the same other state", () => {
    const past = history((ago) => (ago <= 3 ? { cloudMean: 90, precip: 0 } : sunny));
    const fact = detector("state-contrast").detect(day(localDate, sunny), past, ctx);
    expect(fact).toMatchObject({
      messageKey: "facts.contrastRun",
      params: { years: 3, past: "cloudy", now: "sunny" },
    });
  });

  it("looks back a few years for the nearest different day", () => {
    const past = history((ago) => (ago === 2 ? snowy : sunny));
    const fact = detector("state-contrast").detect(day(localDate, sunny), past, ctx);
    expect(fact).toMatchObject({
      messageKey: "facts.contrastYearsAgo",
      params: { ago: 2, past: "snowy", now: "sunny" },
    });
  });

  it("says nothing when recent years looked the same or today is mixed", () => {
    expect(
      detector("state-contrast").detect(
        day(localDate, sunny),
        history(() => sunny),
        ctx,
      ),
    ).toBeNull();
    expect(
      detector("state-contrast").detect(
        day(localDate, { cloudMean: 50 }),
        history(() => rainy),
        ctx,
      ),
    ).toBeNull();
  });

  it("is kept even though it covers fewer than minYears", () => {
    const past = history((ago) => (ago === 1 ? rainy : sunny));
    const { facts } = runFacts({ today: day(localDate, sunny), history: past, localDate });
    expect(facts.map((f) => f.id)).toContain("state-contrast");
  });
});

describe("last-year detector", () => {
  it("reports a big change in the high since last year", () => {
    const past = history((ago) => (ago === 1 ? { tmax: 12 } : { tmax: 20 }));
    expect(
      detector("tmax-last-year").detect(day(localDate, { tmax: 19 }), past, ctx),
    ).toMatchObject({
      messageKey: "facts.warmerThanLastYear",
      params: { tempDelta: 7 },
      previous: { value: 12, yearsAgo: 1 },
    });
    const cold = history((ago) => (ago === 1 ? { tmax: 27 } : { tmax: 20 }));
    expect(
      detector("tmax-last-year").detect(day(localDate, { tmax: 20 }), cold, ctx)?.messageKey,
    ).toBe("facts.coolerThanLastYear");
  });

  it("ignores small changes and a missing last year", () => {
    expect(
      detector("tmax-last-year").detect(day(localDate, { tmax: 25 }), history(), ctx),
    ).toBeNull();
    const gap = history().filter((d) => !d.date.startsWith("2025"));
    expect(detector("tmax-last-year").detect(day(localDate, { tmax: 40 }), gap, ctx)).toBeNull();
  });
});
