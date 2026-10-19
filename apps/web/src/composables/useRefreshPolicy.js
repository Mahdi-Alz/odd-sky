import { onScopeDispose, watch } from "vue";
import { isStale, pageWindow } from "@odd-sky/core";
import { ACTIVE_REFRESH_MS, STALE_AFTER_MS } from "../config/refresh";

export const useRefreshPolicy = ({
  places,
  activeIndex,
  states,
  refresh,
  ready,
  online,
  enabled,
}) => {
  const windowPlaces = () =>
    pageWindow(activeIndex.value, places.value.length).map((i) => places.value[i]);

  const canRefresh = () => enabled.value && online.value && document.visibilityState === "visible";

  const refreshStale = async () => {
    if (!canRefresh()) return;
    for (const place of windowPlaces()) {
      await ready(place.id);
      const state = states[place.id];
      if (!canRefresh()) return;
      if (
        state &&
        !state.refreshing &&
        (state.error || isStale(state.updatedAt, Date.now(), STALE_AFTER_MS))
      )
        refresh(place);
    }
  };

  const refreshActive = () => {
    if (!canRefresh()) return;
    const place = places.value[activeIndex.value];
    if (place && states[place.id]) refresh(place);
  };

  watch(
    [
      () => activeIndex.value,
      () => places.value.map((place) => place.id).join(","),
      online,
      enabled,
    ],
    refreshStale,
    { immediate: true },
  );

  const timer = setInterval(refreshActive, ACTIVE_REFRESH_MS);
  document.addEventListener("visibilitychange", refreshStale);
  window.addEventListener("online", refreshStale);
  onScopeDispose(() => {
    clearInterval(timer);
    document.removeEventListener("visibilitychange", refreshStale);
    window.removeEventListener("online", refreshStale);
  });

  return { refreshStale, refreshActive };
};
