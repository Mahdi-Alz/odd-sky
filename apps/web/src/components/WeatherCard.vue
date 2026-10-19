<script setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { weatherCode } from "@odd-sky/core";
import WeatherIcon from "./WeatherIcon.vue";
import { useFormat } from "../composables/useFormat";
import { useLocalClock } from "../composables/useLocalClock";

const props = defineProps({
  place: { type: Object, required: true },
  forecast: { type: Object, default: null },
  facts: { type: Object, default: null },
  loading: { type: Boolean, default: false },
  error: { type: Boolean, default: false },
});
const emit = defineEmits(["remove"]);

const { t } = useI18n();
const {
  formatNumber,
  formatTemp,
  tempUnit,
  formatSpeed,
  formatWeekday,
  placeDetail,
  factText,
  factTone,
  factsFootnote,
} = useFormat();
const { label: localTime } = useLocalClock(() => props.place.timezone);

const isDay = computed(() => props.forecast?.current.isDay ?? true);
const condition = computed(() =>
  props.forecast ? weatherCode(props.forecast.current.code) : null,
);

const skyGradient = computed(() =>
  isDay.value
    ? "linear-gradient(160deg, #16233f 0%, #2c4a86 55%, #6c8cff 100%)"
    : "linear-gradient(160deg, #05070d 0%, #0b1220 55%, #1b2740 100%)",
);

const dayLabel = (day, index) => (index === 0 ? t("card.today") : formatWeekday(day.date));
</script>

<template>
  <article
    class="card overflow-hidden rounded-box border border-base-300 bg-base-200 shadow-lg shadow-black/20"
  >
    <!-- sky band -->
    <div class="relative flex items-center gap-4 p-5" :style="{ background: skyGradient }">
      <div
        v-if="isDay"
        class="pointer-events-none absolute -end-6 -top-6 size-28 rounded-full bg-accent/30 blur-2xl"
      ></div>
      <button
        type="button"
        class="btn btn-ghost btn-circle btn-xs absolute end-3 top-3 text-white/70 hover:bg-white/10 hover:text-white"
        :aria-label="t('card.remove')"
        @click="emit('remove')"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
        >
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>

      <WeatherIcon
        v-if="condition"
        :icon="condition.icon"
        :is-day="isDay"
        class="size-16 shrink-0 text-white drop-shadow"
        :aria-label="t(condition.labelKey)"
        role="img"
      />
      <div v-else class="size-16 shrink-0 animate-pulse rounded-full bg-white/10"></div>
      <div class="min-w-0">
        <h2 class="truncate font-display text-lg font-semibold text-white">
          {{ place.name }}
        </h2>
        <p class="truncate text-xs text-white/60">
          {{ placeDetail(place) }}
        </p>
        <p class="truncate text-xs text-white/60" :title="t('card.localTime')">{{ localTime }}</p>
        <p v-if="condition" class="mt-1 text-sm text-white/80">{{ t(condition.labelKey) }}</p>
      </div>
    </div>

    <div v-if="!forecast" class="card-body gap-4 p-5">
      <p v-if="error" class="text-sm text-error">{{ t("card.loadError") }}</p>
      <template v-else-if="loading">
        <div class="h-14 w-32 animate-pulse rounded bg-base-300/60"></div>
        <div class="h-5 w-40 animate-pulse rounded bg-base-300/60"></div>
        <div class="h-16 animate-pulse rounded bg-base-300/60"></div>
      </template>
    </div>

    <div v-else class="card-body gap-4 p-5">
      <!-- temperature -->
      <div class="flex items-end justify-between">
        <div class="font-display text-6xl font-bold leading-none tracking-tight" dir="ltr">
          {{ formatTemp(forecast.current.temp)
          }}<span class="text-3xl text-base-content/50">{{ tempUnit }}</span>
        </div>
        <div class="text-end text-sm text-base-content/60">
          {{ t("card.feelsLike") }}<br />
          <span class="font-mono text-base text-base-content/80" dir="ltr">{{
            formatTemp(forecast.current.feelsLike)
          }}</span>
        </div>
      </div>

      <!-- facts -->
      <div v-if="facts && facts.facts.length" class="-mt-1 flex flex-col items-start gap-2 text-sm">
        <div class="flex flex-wrap gap-1.5">
          <span
            v-for="fact in facts.facts"
            :key="fact.id"
            class="badge badge-sm badge-outline"
            :class="factTone(fact)"
          >
            {{ factText(fact) }}
          </span>
        </div>
        <p class="text-[11px] leading-snug text-base-content/40">
          {{ factsFootnote(facts.yearsAvailable) }}
        </p>
      </div>

      <!-- stats -->
      <div
        class="grid grid-cols-3 gap-3 rounded-field border border-base-300 bg-base-100/60 p-3 font-mono text-xs"
      >
        <div>
          <div class="text-base-content/40 uppercase">{{ t("card.humidity") }}</div>
          <div class="mt-0.5 text-sm text-base-content/90">
            {{ formatNumber(forecast.current.humidity) }}%
          </div>
        </div>
        <div>
          <div class="text-base-content/40 uppercase">{{ t("card.wind") }}</div>
          <div class="mt-0.5 text-sm text-base-content/90">
            <bdi>{{ formatSpeed(forecast.current.wind) }}</bdi>
          </div>
        </div>
        <div>
          <div class="text-base-content/40 uppercase">{{ t("card.uv") }}</div>
          <div class="mt-0.5 text-sm text-base-content/90">
            {{ formatNumber(forecast.current.uv) }}
          </div>
        </div>
      </div>

      <!-- 7-day forecast -->
      <div class="flex items-start justify-between border-t border-base-300 pt-3">
        <div
          v-for="(day, index) in forecast.daily"
          :key="day.date"
          class="flex min-w-0 flex-1 flex-col items-center gap-1"
          :title="t(weatherCode(day.code).labelKey)"
        >
          <span class="text-[11px] text-base-content/50">{{ dayLabel(day, index) }}</span>
          <WeatherIcon :icon="weatherCode(day.code).icon" class="size-6 text-base-content/80" />
          <span class="flex flex-col items-center font-mono text-[11px] leading-tight" dir="ltr">
            <span class="text-base-content/90">{{ formatTemp(day.max) }}</span>
            <span class="text-base-content/40">{{ formatTemp(day.min) }}</span>
          </span>
        </div>
      </div>
    </div>
  </article>
</template>
