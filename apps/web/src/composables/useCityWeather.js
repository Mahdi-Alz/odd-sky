import { reactive, watch } from "vue";
import { locationKey, msUntilLocalMidnight } from "@odd-sky/core";
import { getFacts } from "../services/factsService";
import { getForecast } from "../services/forecastService";
import { cache } from "../storage";

const loadFacts = async (place, state) => {
  const { localDate, timezone } = state.forecast;
  const key = `facts:${locationKey(place.lat, place.lon)}:${localDate}`;
  const cached = await cache.get(key);
  if (cached) {
    state.facts = cached.data;
    return;
  }
  try {
    const facts = await getFacts(place, localDate);
    state.facts = facts;
    await cache.set(key, facts, msUntilLocalMidnight(timezone));
  } catch {
    state.facts = null;
  }
};

export const useCityWeather = (places) => {
  const states = reactive({});

  const load = async (place) => {
    const state = reactive({ forecast: null, facts: null, loading: true, error: false });
    states[place.id] = state;
    const key = `forecast:${place.id}`;

    const cached = await cache.get(key);
    if (cached && !state.forecast) {
      state.forecast = cached.data;
      state.loading = false;
    }

    try {
      const forecast = await getForecast(place);
      state.forecast = forecast;
      state.error = false;
      await cache.set(key, forecast);
    } catch {
      if (!state.forecast) state.error = true;
    }
    state.loading = false;

    if (state.forecast && states[place.id] === state) await loadFacts(place, state);
  };

  watch(
    places,
    (list) => {
      const ids = new Set(list.map((place) => place.id));
      for (const id of Object.keys(states)) {
        if (!ids.has(id)) delete states[id];
      }
      for (const place of list) {
        if (!states[place.id]) load(place);
      }
    },
    { immediate: true },
  );

  return { states };
};
