<script setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { weatherCode } from "@odd-sky/core";
import WeatherIcon from "./WeatherIcon.vue";
import { useFormat } from "../composables/useFormat";

const props = defineProps({
  daily: { type: /** @type {import("vue").PropType<any[]>} */ (Array), required: true },
});

const { t } = useI18n();
const { formatTemp, formatWeekday } = useFormat();

const range = computed(() => {
  const min = Math.min(...props.daily.map((day) => day.min));
  const max = Math.max(...props.daily.map((day) => day.max));
  return { min, span: Math.max(max - min, 1) };
});

const barStyle = (day) => ({
  marginInlineStart: `${((day.min - range.value.min) / range.value.span) * 100}%`,
  width: `${((day.max - day.min) / range.value.span) * 100}%`,
});

const dayLabel = (day, index) => (index === 0 ? t("card.today") : formatWeekday(day.date));
</script>

<template>
  <section class="glass p-4" :aria-label="t('page.daily')">
    <h2 class="text-xs font-semibold tracking-wide text-white/70 uppercase">
      {{ t("page.daily") }}
    </h2>
    <ul class="mt-2 divide-y divide-line">
      <li
        v-for="(day, index) in daily"
        :key="day.date"
        class="grid grid-cols-[3.75rem_1.75rem_2.5rem_1fr_2.5rem] items-center gap-2 py-2.5"
      >
        <span class="truncate text-base font-medium">{{ dayLabel(day, index) }}</span>
        <WeatherIcon
          :icon="weatherCode(day.code).icon"
          class="size-6"
          role="img"
          :aria-label="t(weatherCode(day.code).labelKey)"
        />
        <span class="text-end text-base text-white/65" dir="ltr">{{ formatTemp(day.min) }}</span>
        <span class="block h-1 rounded-full bg-white/20">
          <span
            class="block h-1 rounded-full bg-linear-to-r from-cool to-warm"
            :style="barStyle(day)"
          ></span>
        </span>
        <span class="text-end text-base font-medium" dir="ltr">{{ formatTemp(day.max) }}</span>
      </li>
    </ul>
  </section>
</template>
