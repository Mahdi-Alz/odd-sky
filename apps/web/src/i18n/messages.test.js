import { describe, expect, it } from "vitest";
import { mockFixtures, weatherCodeList } from "@odd-sky/core";
import en from "./en.json";
import fa from "./fa.json";

const flatten = (object, prefix = "") =>
  Object.entries(object).flatMap(([key, value]) =>
    typeof value === "object" ? flatten(value, `${prefix}${key}.`) : [`${prefix}${key}`],
  );

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

  it("has a message for every mock fact", () => {
    for (const fact of Object.values(mockFixtures).flat()) {
      const [, key] = fact.messageKey.split(".");
      expect(en.facts[key]).toContain("{years}");
      expect(fa.facts[key]).toContain("{years}");
    }
  });

  it("keeps the same placeholders in both languages", () => {
    const placeholders = (text) => (text.match(/\{\w+\}/g) ?? []).sort();
    for (const key of flatten(en)) {
      const [group, name] = key.split(".");
      expect(placeholders(fa[group][name])).toEqual(placeholders(en[group][name]));
    }
  });
});
