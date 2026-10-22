import { describe, expect, it } from "vitest";
import { ACTIVITIES, DEPARTURE, DETECTORS, LABEL_BOUNDS, weatherCodeList } from "@odd-sky/core";
import en from "./en.json";
import fa from "./fa.json";

const flatten = (object, prefix = "") =>
  Object.entries(object).flatMap(([key, value]) =>
    typeof value === "object" ? flatten(value, `${prefix}${key}.`) : [`${prefix}${key}`],
  );

const lookup = (object, path) => path.split(".").reduce((value, key) => value[key], object);

describe("messages", () => {
  it("has the same keys in fa and en", () => {
    expect(flatten(fa).sort()).toEqual(flatten(en).sort());
  });

  it("has a label for every weather code", () => {
    for (const code of weatherCodeList) {
      expect(en.weather[code]).toBeTruthy();
      expect(fa.weather[code]).toBeTruthy();
    }
  });

  it("has a message for every fact a detector can return", () => {
    for (const key of DETECTORS.flatMap((detector) => detector.messageKeys)) {
      for (const messages of [en, fa]) {
        expect(lookup(messages, key)).toContain("{date}");
      }
    }
  });

  it("has no fact message that no detector uses", () => {
    const used = new Set(DETECTORS.flatMap((detector) => detector.messageKeys));
    const extra = Object.keys(en.facts)
      .map((key) => `facts.${key}`)
      .filter(
        (key) =>
          !used.has(key) &&
          ![
            "facts.title",
            "facts.footnote",
            "facts.about",
            "facts.closeAbout",
            "facts.states",
          ].includes(key),
      );
    expect(extra).toEqual([]);
  });

  it("keeps the same placeholders in both languages", () => {
    const placeholders = (text) => (text.match(/\{\w+\}/g) ?? []).sort();
    for (const key of flatten(en)) {
      expect(placeholders(lookup(fa, key))).toEqual(placeholders(lookup(en, key)));
    }
  });

  it("names every day state a contrast fact can use", () => {
    for (const state of ["snowy", "rainy", "sunny", "cloudy"]) {
      expect(en.facts.states[state]).toBeTruthy();
      expect(fa.facts.states[state]).toBeTruthy();
    }
  });

  it("names the high and low departure lines", () => {
    for (const variable of DEPARTURE.variables) {
      for (const side of ["above", "below"]) {
        expect(lookup(en, `page.departure.${variable}.${side}`)).toContain("{delta}");
        expect(lookup(fa, `page.departure.${variable}.${side}`)).toContain("{delta}");
      }
    }
  });

  it("names every activity and label", () => {
    for (const messages of [en, fa]) {
      for (const activity of ACTIVITIES)
        expect(messages.activities.names[activity.id]).toBeTruthy();
      for (const label of [...Object.keys(LABEL_BOUNDS), "poor"]) {
        expect(messages.activities.labels[label]).toBeTruthy();
      }
    }
  });

  it("explains every reason an activity can give", () => {
    const needed = new Set(["time.below", "daylight.below", "darkness.below"]);
    for (const activity of ACTIVITIES) {
      for (const factor of activity.factors) {
        needed.add(`${factor.source}.within`);
        if (Number.isFinite(factor.ideal[0])) needed.add(`${factor.source}.below`);
        if (Number.isFinite(factor.ideal[1])) needed.add(`${factor.source}.above`);
      }
      for (const veto of activity.vetoes) {
        if (veto.above != null) needed.add(`${veto.source}.above`);
        if (veto.below != null) needed.add(`${veto.source}.below`);
      }
    }
    for (const messages of [en, fa]) {
      for (const key of needed) expect(lookup(messages.activities.reasons, key), key).toBeTruthy();
    }
  });
});
