import { computed, toValue } from "vue";
import { ACTIVITIES, headlineReasons, scoreActivities } from "@odd-sky/core";
import { useSettingsStore } from "../stores/settings";

export const useActivities = (forecast) => {
  const settings = useSettingsStore();

  const rows = computed(() => {
    const value = toValue(forecast);
    if (!value?.hourly?.length) return [];
    return scoreActivities(value.hourly, value.localDate, { enabled: settings.activities })
      .map((result, index) => ({
        ...result,
        id: result.activity,
        whole:
          ACTIVITIES.find((activity) => activity.id === result.activity)?.durationHours == null,
        headline: headlineReasons(result),
        index,
      }))
      .sort((a, b) => b.score - a.score || a.index - b.index);
  });

  return { rows };
};
