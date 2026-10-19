<script setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import SearchInput from "./components/SearchInput.vue";
import SettingsBar from "./components/SettingsBar.vue";
import WeatherCard from "./components/WeatherCard.vue";
import { useCityWeather } from "./composables/useCityWeather";
import { useFormat } from "./composables/useFormat";
import { useLocaleSync } from "./composables/useLocaleSync";
import { useTransfer } from "./composables/useTransfer";
import { useCitiesStore } from "./stores/cities";
import { useSettingsStore } from "./stores/settings";

const { t } = useI18n();
const settings = useSettingsStore();
const cities = useCitiesStore();
const { formatLongDate } = useFormat();
const { status: copyStatus, copyLink } = useTransfer();
const { states } = useCityWeather(computed(() => cities.sorted));

useLocaleSync();

const today = computed(() => formatLongDate(new Date()));
</script>

<template>
  <main class="min-h-dvh px-6 py-16">
    <div class="mx-auto max-w-5xl">
      <!-- header -->
      <header class="mb-10 text-center">
        <h1 class="mt-2 font-display text-4xl font-bold tracking-tight text-primary/70 uppercase">
          {{ t("app.title") }}
        </h1>
        <p class="mt-2 text-sm text-base-content/50">{{ today }}</p>
      </header>

      <!-- search -->
      <SearchInput @select="cities.add" />

      <SettingsBar
        :locale="settings.locale"
        :units="settings.units"
        :copy-status="copyStatus"
        @update:locale="settings.setLocale"
        @update:units="settings.setUnits"
        @copy-link="copyLink"
      />

      <!-- weather cards -->
      <div
        v-if="cities.sorted.length"
        class="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
      >
        <WeatherCard
          v-for="place in cities.sorted"
          :key="place.id"
          :place="place"
          :forecast="states[place.id]?.forecast"
          :facts="states[place.id]?.facts"
          :loading="states[place.id]?.loading"
          :error="states[place.id]?.error"
          @remove="cities.remove(place.id)"
        />
      </div>

      <!-- empty state -->
      <div v-else class="mt-20 flex flex-col items-center gap-3 text-center text-base-content/40">
        <svg
          class="size-10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M17.5 19a4.5 4.5 0 0 0 0-9 6 6 0 0 0-11.7-1.8A4 4 0 0 0 6.5 16" />
        </svg>
        <p class="text-sm">{{ t("app.emptyState") }}</p>
      </div>

      <footer class="mt-16 text-center text-xs text-base-content/40">
        {{ t("app.dataBy") }}
        <a href="https://open-meteo.com/" target="_blank" rel="noopener" class="link link-hover"
          >Open-Meteo</a
        >
      </footer>
    </div>
  </main>
</template>
