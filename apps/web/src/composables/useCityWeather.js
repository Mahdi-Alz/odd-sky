import { reactive, watch } from "vue";
import { HISTORY, localDateIn, locationKey, msUntilLocalMidnight } from "@odd-sky/core";
import { FACTS_GRACE_MS, FACTS_TTL_MS, PARTIAL_FACTS_TTL_MS } from "../config/refresh";
import { getFacts } from "../services/factsService";
import { getForecast } from "../services/forecastService";
import { cache } from "../storage";

const forecastKey = (place) => `forecast:v4:${place.id}`;

const factsKey = (place, localDate) => `facts:v3:${locationKey(place.lat, place.lon)}:${localDate}`;

const cachedFacts = async (place) => {
  const cached = await cache.get(factsKey(place, localDateIn(place.timezone)));
  return cached?.data ?? null;
};

const loadFacts = async (place, state) => {
  const localDate = localDateIn(place.timezone);
  const cached = await cache.get(factsKey(place, localDate));
  if (cached) {
    state.facts = cached.data;
    return;
  }
  try {
    const facts = await getFacts(place);
    state.facts = facts;
    const untilMidnight = msUntilLocalMidnight(place.timezone);
    const ttl =
      facts.yearsAvailable < HISTORY.years
        ? Math.min(PARTIAL_FACTS_TTL_MS, untilMidnight)
        : Math.min(FACTS_TTL_MS, untilMidnight);
    await cache.set(factsKey(place, facts.localDate), facts, ttl);
  } catch {
    if (state.facts?.localDate !== localDate) state.facts = null;
  }
};

const grace = (promise) =>
  Promise.race([promise, new Promise((resolve) => setTimeout(resolve, FACTS_GRACE_MS))]);

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

    const [cached, facts] = await Promise.all([cache.get(forecastKey(place)), cachedFacts(place)]);
    if (cached && !state.forecast && states[place.id] === state) {
      state.facts = facts;
      state.forecast = cached.data;
      state.updatedAt = cached.savedAt;
      state.loading = false;
    }
  };

  const fetchFresh = async (place, state) => {
    state.refreshing = true;
    const facts = loadFacts(place, state);
    try {
      const forecast = await getForecast(place);
      if (!state.forecast) await grace(facts);
      state.forecast = forecast;
      state.error = false;
      state.updatedAt = Date.now();
      await cache.set(forecastKey(place), forecast);
    } catch {
      state.error = true;
    }
    state.loading = false;
    state.refreshing = false;
    await facts;
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
