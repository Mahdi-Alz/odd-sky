import { reactive, watch } from "vue";
import { HISTORY, locationKey, msUntilLocalMidnight } from "@odd-sky/core";
import { FACTS_TTL_MS, PARTIAL_FACTS_TTL_MS } from "../config/refresh";
import { getFacts } from "../services/factsService";
import { getForecast } from "../services/forecastService";
import { cache } from "../storage";

const forecastKey = (place) => `forecast:v4:${place.id}`;

const loadFacts = async (place, state) => {
  const { localDate, timezone } = state.forecast;
  const key = `facts:v3:${locationKey(place.lat, place.lon)}:${localDate}`;
  const cached = await cache.get(key);
  if (cached) {
    state.facts = cached.data;
    return;
  }
  try {
    const facts = await getFacts(place);
    state.facts = facts;
    const untilMidnight = msUntilLocalMidnight(timezone);
    const ttl =
      facts.yearsAvailable < HISTORY.years
        ? Math.min(PARTIAL_FACTS_TTL_MS, untilMidnight)
        : Math.min(FACTS_TTL_MS, untilMidnight);
    await cache.set(key, facts, ttl);
  } catch {
    if (state.facts?.localDate !== localDate) state.facts = null;
  }
};

export const useCityWeather = (places) => {
  const states = reactive({});
  const inflight = new Map();
  const hydrations = new Map();

  const hydrate = async (place) => {
    const state = reactive({
      forecast: null,
      facts: null,
      loading: true,
      refreshing: false,
      error: false,
      updatedAt: null,
    });
    states[place.id] = state;

    const cached = await cache.get(forecastKey(place));
    if (cached && !state.forecast && states[place.id] === state) {
      state.forecast = cached.data;
      state.updatedAt = cached.savedAt;
      state.loading = false;
      await loadFacts(place, state);
    }
  };

  const fetchFresh = async (place, state) => {
    state.refreshing = true;
    try {
      const forecast = await getForecast(place);
      state.forecast = forecast;
      state.error = false;
      state.updatedAt = Date.now();
      await cache.set(forecastKey(place), forecast);
    } catch {
      state.error = true;
    }
    state.loading = false;
    state.refreshing = false;
    if (state.forecast && states[place.id] === state) await loadFacts(place, state);
  };

  const refresh = (place) => {
    const state = states[place.id];
    if (!state) return Promise.resolve();
    if (inflight.has(place.id)) return inflight.get(place.id);
    const promise = fetchFresh(place, state).finally(() => inflight.delete(place.id));
    inflight.set(place.id, promise);
    return promise;
  };

  watch(
    places,
    (list) => {
      const ids = new Set(list.map((place) => place.id));
      for (const id of Object.keys(states)) {
        if (!ids.has(id)) {
          delete states[id];
          hydrations.delete(id);
        }
      }
      for (const place of list) {
        if (!states[place.id]) hydrations.set(place.id, hydrate(place));
      }
    },
    { immediate: true },
  );

  const ready = (id) => hydrations.get(id) ?? Promise.resolve();

  return { states, refresh, ready };
};
