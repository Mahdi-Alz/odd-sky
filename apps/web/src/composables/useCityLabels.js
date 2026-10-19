import { watch } from "vue";
import { getPlaceLabel } from "../services/geocodingService";
import { useCitiesStore } from "../stores/cities";
import { useSettingsStore } from "../stores/settings";

export const useCityLabels = () => {
  const cities = useCitiesStore();
  const settings = useSettingsStore();
  const pending = new Set();

  const sync = () => {
    const locale = settings.locale;
    for (const id of cities.applyLocale(locale)) {
      const key = `${id}:${locale}`;
      if (pending.has(key)) continue;
      pending.add(key);
      getPlaceLabel(id, locale)
        .then((label) => cities.setLabel(id, locale, label, settings.locale === locale))
        .catch(() => {})
        .finally(() => pending.delete(key));
    }
  };

  watch([() => settings.locale, () => cities.items.map((item) => item.id).join(",")], sync, {
    immediate: true,
  });
};
