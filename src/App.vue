<script setup>
import { ref } from "vue";
import SearchInput from "./components/SearchInput.vue";
import WeatherCard from "./components/WeatherCard.vue";

const places = ref([]);

const placeKey = (data) =>
  `${data.location.name}-${data.location.lat}-${data.location.lon}`;

const addPlace = (data) => {
  if (places.value.some((place) => placeKey(place) === placeKey(data))) return;
  places.value.push(data);
};

const removePlace = (key) => {
  places.value = places.value.filter((place) => placeKey(place) !== key);
};

const today = new Date().toLocaleDateString("en-us", {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
});
</script>

<template>
  <main class="min-h-dvh px-6 py-16">
    <div class="mx-auto max-w-5xl">
      <!-- header -->
      <header class="mb-10 text-center">
        <h1 class="mt-2 font-display text-4xl font-bold tracking-tight text-primary/70 uppercase">Odd Sky</h1>
        <p class="mt-2 text-sm text-base-content/50">{{ today }}</p>
      </header>

      <!-- search -->
      <SearchInput @place-data="addPlace" />

      <!-- weather cards -->
      <div v-if="places.length" class="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <WeatherCard
          v-for="place in places"
          :key="placeKey(place)"
          :place="place"
          @remove="removePlace(placeKey(place))"
        />
      </div>

      <!-- empty state -->
      <div v-else class="mt-20 flex flex-col items-center gap-3 text-center text-base-content/40">
        <svg class="size-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M17.5 19a4.5 4.5 0 0 0 0-9 6 6 0 0 0-11.7-1.8A4 4 0 0 0 6.5 16" />
        </svg>
        <p class="text-sm">Search for a city to see its forecast</p>
      </div>
    </div>
  </main>
</template>
