<script setup>
import { useI18n } from "vue-i18n";
import { weatherCode } from "@odd-sky/core";
import WeatherIcon from "./WeatherIcon.vue";
import { useFormat } from "../composables/useFormat";

defineProps({
  hourly: { type: /** @type {import("vue").PropType<any[]>} */ (Array), required: true },
});

const { t } = useI18n();
const { formatHour, formatTemp, formatPercent } = useFormat();

const RAIN_SHOWN_FROM = 20;
</script>

<template>
  <section class="glass p-4" :aria-label="t('page.hourly')">
    <h2 class="text-xs font-semibold tracking-wide text-white/70 uppercase">
      {{ t("page.hourly") }}
    </h2>
    <ul class="no-scrollbar -mx-1 mt-3 flex gap-1 overflow-x-auto px-1">
      <li
        v-for="(point, index) in hourly"
        :key="point.time"
        class="flex min-w-14 flex-col items-center gap-1.5 py-1"
      >
        <span class="text-xs text-white/80">
          {{ index === 0 ? t("page.now") : formatHour(point.time) }}
        </span>
        <WeatherIcon
          :icon="weatherCode(point.code).icon"
          :is-day="point.isDay"
          class="size-7"
          role="img"
          :aria-label="t(weatherCode(point.code).labelKey)"
        />
        <span class="h-3 text-[11px] font-medium text-cool" dir="ltr">
          {{
            point.precipProbability >= RAIN_SHOWN_FROM ? formatPercent(point.precipProbability) : ""
          }}
        </span>
        <span class="text-base font-medium" dir="ltr">{{ formatTemp(point.temp) }}</span>
      </li>
    </ul>
  </section>
</template>
