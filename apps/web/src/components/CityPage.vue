<script setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { skyKey, weatherCode } from "@odd-sky/core";
import ActivitiesCard from "./ActivitiesCard.vue";
import DailyForecast from "./DailyForecast.vue";
import DataCredit from "./DataCredit.vue";
import DetailsGrid from "./DetailsGrid.vue";
import FactsCard from "./FactsCard.vue";
import HourlyStrip from "./HourlyStrip.vue";
import UiIcon from "./UiIcon.vue";
import { useActivities } from "../composables/useActivities";
import { useFormat } from "../composables/useFormat";
import { useLocalClock } from "../composables/useLocalClock";

const props = defineProps({
  place: { type: Object, required: true },
  forecast: { type: Object, default: null },
  facts: { type: Object, default: null },
  loading: { type: Boolean, default: false },
  error: { type: Boolean, default: false },
});
const emit = defineEmits(["retry"]);

const { t } = useI18n();
const { formatTemp, formatTempValue, placeDetail, departureLines } = useFormat();
const { label: localTime } = useLocalClock(() => props.place.timezone);
const { rows: activityRows } = useActivities(() => props.forecast);

const condition = computed(() =>
  props.forecast ? weatherCode(props.forecast.current.code) : null,
);
const sky = computed(() =>
  props.forecast ? skyKey(condition.value.icon, props.forecast.current.isDay) : "cloudy-night",
);
const today = computed(() => props.forecast?.daily[0] ?? null);
const hourly = computed(() => props.forecast?.hourly ?? []);
const departures = computed(() =>
  props.facts && props.forecast?.localDate === props.facts.localDate
    ? departureLines(props.facts.departures)
    : [],
);
const hasFacts = computed(
  () => (props.facts?.facts.length ?? 0) > 0 || departures.value.length > 0,
);
</script>

<template>
  <section
    class="no-scrollbar sky h-dvh w-full shrink-0 snap-start snap-always overflow-y-auto overscroll-y-contain"
    :data-sky="sky"
    :aria-label="place.name"
  >
    <div class="safe-top mx-auto flex min-h-full max-w-xl flex-col gap-4 px-4 pb-32">
      <header class="px-12 pt-3 text-center">
        <h1 class="text-3xl font-medium tracking-tight">{{ place.name }}</h1>
        <p class="mt-1 text-sm text-white/70">{{ placeDetail(place) }}</p>
        <p class="mt-0.5 text-xs text-white/60">{{ localTime }}</p>
      </header>

      <div v-if="!forecast && error" class="glass mt-6 p-6 text-center">
        <p class="text-white/85">{{ t("card.loadError") }}</p>
        <button
          type="button"
          class="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-ink"
          @click="emit('retry')"
        >
          <UiIcon name="retry" class="size-4" />
          {{ t("status.retry") }}
        </button>
      </div>

      <template v-else-if="!forecast">
        <div class="mx-auto mt-4 h-24 w-40 animate-pulse rounded-2xl bg-white/15"></div>
        <div class="glass h-32 animate-pulse"></div>
        <div class="glass h-40 animate-pulse"></div>
      </template>

      <template v-else>
        <div class="text-center">
          <p class="relative inline-block text-9xl leading-none font-extralight" dir="ltr">
            {{ formatTempValue(forecast.current.temp) }}
            <span class="absolute start-full top-1 text-6xl" aria-hidden="true">°</span>
          </p>
          <p class="mt-2 text-xl font-medium">{{ t(condition.labelKey) }}</p>
          <p class="mt-1 text-base text-white/85">
            <span class="me-3">
              {{ t("page.high") }} <span dir="ltr">{{ formatTemp(today.max) }}</span>
            </span>
            <span>
              {{ t("page.low") }} <span dir="ltr">{{ formatTemp(today.min) }}</span>
            </span>
          </p>
          <p v-if="error" class="mt-3 text-xs text-white/70">{{ t("status.stale") }}</p>
        </div>

        <FactsCard v-if="hasFacts" :facts="facts" :departures="departures" />
        <HourlyStrip v-if="hourly.length" :hourly="hourly" />
        <ActivitiesCard v-if="activityRows.length" :rows="activityRows" />
        <DailyForecast :daily="forecast.daily" />
        <DetailsGrid :current="forecast.current" />
        <p class="text-center text-[11px] text-white/55"><DataCredit /></p>
      </template>
    </div>
  </section>
</template>
