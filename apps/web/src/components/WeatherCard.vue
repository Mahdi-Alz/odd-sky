<script setup>
import { computed, onMounted, ref } from "vue";
import WeatherIcon from "./WeatherIcon.vue";
import { weatherCode } from "../lib/weatherCodes";
import { getHistory } from "../lib/openMeteo";
import { buildFacts } from "../lib/facts";

const props = defineProps({
  place: { type: Object, required: true },
});
const emit = defineEmits(["remove"]);

const isDay = computed(() => props.place.current.isDay);
const condition = computed(() => weatherCode(props.place.current.code));

const skyGradient = computed(() =>
  isDay.value
    ? "linear-gradient(160deg, #16233f 0%, #2c4a86 55%, #6c8cff 100%)"
    : "linear-gradient(160deg, #05070d 0%, #0b1220 55%, #1b2740 100%)",
);

const upcoming = computed(() => props.place.daily);

const weekday = (date, index) =>
  index === 0
    ? "Today"
    : new Date(`${date}T00:00`).toLocaleDateString("en-us", { weekday: "short" });

const history = ref(null);
const historyLoading = ref(true);

onMounted(async () => {
  try {
    history.value = await getHistory(props.place.location, props.place.localDate);
  } catch {
    history.value = null;
  } finally {
    historyLoading.value = false;
  }
});

const dayLabel = computed(() =>
  new Date(`${props.place.localDate}T00:00`).toLocaleDateString("en-us", {
    month: "short",
    day: "numeric",
  }),
);

const diff = computed(() =>
  history.value ? Math.round(props.place.daily[0].max - history.value.normalMax) : null,
);

const facts = computed(() =>
  history.value
    ? buildFacts(props.place.daily[0], history.value, props.place.localDate).slice(0, 3)
    : [],
);

const toneClass = {
  warm: "badge-warning",
  cool: "badge-info",
  wet: "badge-primary",
  neutral: "",
};

const anomalyText = computed(() => {
  if (Math.abs(diff.value) <= 1) return `About usual for ${dayLabel.value}`;
  return `${diff.value > 0 ? "+" : "−"}${Math.abs(diff.value)}° vs. usual for ${dayLabel.value}`;
});

const anomalyClass = computed(() => {
  if (diff.value > 1) return "text-warning";
  if (diff.value < -1) return "text-info";
  return "text-base-content/60";
});
</script>

<template>
  <article
    class="card overflow-hidden rounded-box border border-base-300 bg-base-200 shadow-lg shadow-black/20"
  >
    <!-- sky band -->
    <div class="relative flex items-center gap-4 p-5" :style="{ background: skyGradient }">
      <div
        v-if="isDay"
        class="pointer-events-none absolute -right-6 -top-6 size-28 rounded-full bg-accent/30 blur-2xl"
      ></div>
      <button
        type="button"
        class="btn btn-ghost btn-circle btn-xs absolute right-3 top-3 text-white/70 hover:bg-white/10 hover:text-white"
        @click="emit('remove')"
        aria-label="Remove place"
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
        :icon="condition.icon"
        :is-day="isDay"
        class="size-16 shrink-0 text-white drop-shadow"
        :aria-label="condition.label"
        role="img"
      />
      <div class="min-w-0">
        <h2 class="truncate font-display text-lg font-semibold text-white">
          {{ place.location.name }}
        </h2>
        <p class="truncate text-xs text-white/60">
          {{ place.location.region ? place.location.region + ", " : ""
          }}{{ place.location.country }}
        </p>
        <p class="mt-1 text-sm text-white/80">{{ condition.label }}</p>
      </div>
    </div>

    <div class="card-body gap-4 p-5">
      <!-- temperature -->
      <div class="flex items-end justify-between">
        <div class="font-display text-6xl font-bold leading-none tracking-tight">
          {{ Math.round(place.current.temp) }}<span class="text-3xl text-base-content/50">°C</span>
        </div>
        <div class="text-right text-sm text-base-content/60">
          Feels like<br />
          <span class="font-mono text-base text-base-content/80"
            >{{ Math.round(place.current.feelsLike) }}°</span
          >
        </div>
      </div>

      <!-- vs. climate -->
      <div v-if="historyLoading" class="h-5 w-40 animate-pulse rounded bg-base-300/60"></div>
      <div v-else-if="history" class="-mt-1 flex flex-col items-start gap-2 text-sm">
        <span :class="anomalyClass">{{ anomalyText }}</span>
        <div v-if="facts.length" class="flex flex-wrap gap-1.5">
          <span
            v-for="fact in facts"
            :key="fact.group"
            class="badge badge-sm badge-outline"
            :class="toneClass[fact.tone]"
          >
            {{ fact.text }}
          </span>
        </div>
      </div>

      <!-- stats -->
      <div
        class="grid grid-cols-3 gap-3 rounded-field border border-base-300 bg-base-100/60 p-3 font-mono text-xs"
      >
        <div>
          <div class="text-base-content/40">HUMIDITY</div>
          <div class="mt-0.5 text-sm text-base-content/90">{{ place.current.humidity }}%</div>
        </div>
        <div>
          <div class="text-base-content/40">WIND</div>
          <div class="mt-0.5 text-sm text-base-content/90">
            {{ Math.round(place.current.wind) }} km/h
          </div>
        </div>
        <div>
          <div class="text-base-content/40">UV</div>
          <div class="mt-0.5 text-sm text-base-content/90">{{ Math.round(place.current.uv) }}</div>
        </div>
      </div>

      <!-- 7-day forecast -->
      <div class="flex items-start justify-between border-t border-base-300 pt-3">
        <div
          v-for="(day, index) in upcoming"
          :key="day.date"
          class="flex min-w-0 flex-1 flex-col items-center gap-1"
          :title="weatherCode(day.code).label"
        >
          <span class="text-[11px] text-base-content/50">{{ weekday(day.date, index) }}</span>
          <WeatherIcon :icon="weatherCode(day.code).icon" class="size-6 text-base-content/80" />
          <span class="flex flex-col items-center font-mono text-[11px] leading-tight">
            <span class="text-base-content/90">{{ Math.round(day.max) }}°</span>
            <span class="text-base-content/40">{{ Math.round(day.min) }}°</span>
          </span>
        </div>
      </div>
    </div>
  </article>
</template>
