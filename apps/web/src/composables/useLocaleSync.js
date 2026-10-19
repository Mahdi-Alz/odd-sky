import { watchEffect } from "vue";
import { useI18n } from "vue-i18n";
import { useSettingsStore } from "../stores/settings";

export const useLocaleSync = () => {
  const settings = useSettingsStore();
  const { locale } = useI18n();

  watchEffect(() => {
    locale.value = settings.locale;
    document.documentElement.lang = settings.locale;
    document.documentElement.dir = settings.dir;
  });
};
