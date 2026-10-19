import { defineStore } from "pinia";

const detectLocale = () =>
  typeof navigator !== "undefined" && navigator.language?.toLowerCase().startsWith("fa")
    ? "fa"
    : "en";

export const useSettingsStore = defineStore("settings", {
  state: () => ({
    locale: /** @type {'fa' | 'en'} */ (detectLocale()),
    installHintDismissed: false,
    units: /** @type {'metric' | 'imperial'} */ ("metric"),
    activities: /** @type {Record<string, boolean>} */ ({}),
    thresholds: /** @type {Record<string, Record<string, number>>} */ ({}),
  }),
  getters: {
    dir: (state) => (state.locale === "fa" ? "rtl" : "ltr"),
  },
  actions: {
    setLocale(locale) {
      this.locale = locale;
    },
    setUnits(units) {
      this.units = units;
    },
    dismissInstallHint() {
      this.installHintDismissed = true;
    },
  },
  persist: { key: "settings" },
});
