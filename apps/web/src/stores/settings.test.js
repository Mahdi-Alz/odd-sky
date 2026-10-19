import { beforeEach, describe, expect, it } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { useSettingsStore } from "./settings";

describe("settings store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("has every activity on by default", () => {
    const settings = useSettingsStore();
    expect(settings.isActivityOn("running")).toBe(true);
  });

  it("switches an activity off and on again", () => {
    const settings = useSettingsStore();
    settings.setActivity("running", false);
    expect(settings.isActivityOn("running")).toBe(false);
    expect(settings.isActivityOn("cycling")).toBe(true);
    settings.setActivity("running", true);
    expect(settings.isActivityOn("running")).toBe(true);
  });
});
