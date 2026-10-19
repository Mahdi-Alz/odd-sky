import { ref } from "vue";
import { searchPlaces } from "../services/geocodingService";
import { useSettingsStore } from "../stores/settings";

const DEBOUNCE_MS = 500;

export const useCitySearch = () => {
  const settings = useSettingsStore();
  const query = ref("");
  const results = ref(null);
  const loading = ref(false);
  const error = ref(false);
  let timer = null;
  let controller = null;

  const cancel = () => {
    clearTimeout(timer);
    controller?.abort();
    controller = null;
  };

  const clear = () => {
    cancel();
    query.value = "";
    results.value = null;
    error.value = false;
    loading.value = false;
  };

  const search = () => {
    cancel();
    error.value = false;

    if (!query.value.length) {
      results.value = null;
      loading.value = false;
      return;
    }

    loading.value = true;
    timer = setTimeout(async () => {
      controller = new AbortController();
      const { signal } = controller;
      try {
        results.value = await searchPlaces(query.value, settings.locale, signal);
      } catch {
        if (signal.aborted) return;
        results.value = [];
        error.value = true;
      }
      if (!signal.aborted) loading.value = false;
    }, DEBOUNCE_MS);
  };

  return { query, results, loading, error, search, clear };
};
