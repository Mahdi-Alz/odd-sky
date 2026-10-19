import { nextTick, watchEffect } from "vue";
import { useI18n } from "vue-i18n";
import { useSettingsStore } from "../stores/settings";

const FALLBACK_MS = 400;

const reducedMotion = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export const useLocaleSync = () => {
  const settings = useSettingsStore();
  const { locale } = useI18n();

  watchEffect(() => {
    locale.value = settings.locale;
    document.documentElement.lang = settings.locale;
    document.documentElement.dir = settings.dir;
  });

  const setLocale = (next) => {
    if (next === settings.locale) return;
    if (!document.startViewTransition || reducedMotion()) {
      settings.setLocale(next);
      return;
    }
    const fallback = window.setTimeout(() => settings.setLocale(next), FALLBACK_MS);
    document.startViewTransition(async () => {
      clearTimeout(fallback);
      settings.setLocale(next);
      await nextTick();
    });
  };

  return { setLocale };
};
