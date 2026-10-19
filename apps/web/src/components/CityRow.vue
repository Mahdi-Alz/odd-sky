<script setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { skyKey, weatherCode } from "@odd-sky/core";
import UiIcon from "./UiIcon.vue";
import { useFormat } from "../composables/useFormat";
import { useLocalClock } from "../composables/useLocalClock";

const props = defineProps({
  place: { type: Object, required: true },
  forecast: { type: Object, default: null },
  editing: { type: Boolean, default: false },
  lifted: { type: Boolean, default: false },
});
const emit = defineEmits(["select", "remove"]);

const { t } = useI18n();
const { formatTemp, placeDetail } = useFormat();
const { label } = useLocalClock(() => props.place.timezone);

const condition = computed(() =>
  props.forecast ? weatherCode(props.forecast.current.code) : null,
);
const sky = computed(() =>
  props.forecast ? skyKey(condition.value.icon, props.forecast.current.isDay) : "cloudy-night",
);
const today = computed(() => props.forecast?.daily[0] ?? null);
</script>

<template>
  <li class="flex items-center gap-2">
    <button
      v-if="editing"
      type="button"
      class="grid size-9 shrink-0 place-items-center rounded-full bg-danger/90 text-white"
      :aria-label="t('card.remove')"
      @click="emit('remove')"
    >
      <UiIcon name="trash" class="size-4" />
    </button>

    <button
      type="button"
      class="sky flex min-w-0 flex-1 items-center justify-between gap-3 rounded-card border border-line p-4 text-start transition-[scale,box-shadow] duration-(--motion-fast) ease-out"
      :class="lifted ? 'scale-[1.02] shadow-xl shadow-black/40' : ''"
      :data-sky="sky"
      :disabled="editing"
      @click="emit('select')"
    >
      <span class="min-w-0">
        <span class="block truncate text-lg font-semibold">{{ place.name }}</span>
        <span class="block truncate text-xs text-white/70">{{ placeDetail(place) }}</span>
        <span class="mt-1 block truncate text-xs text-white/70">{{ label }}</span>
      </span>
      <span class="shrink-0 text-end">
        <template v-if="forecast">
          <span class="block text-4xl leading-none font-light" dir="ltr">
            {{ formatTemp(forecast.current.temp) }}
          </span>
          <span class="mt-1 block text-xs text-white/80" dir="ltr">
            {{ formatTemp(today.max) }} / {{ formatTemp(today.min) }}
          </span>
        </template>
        <span v-else class="block h-9 w-14 animate-pulse rounded-lg bg-white/15"></span>
      </span>
    </button>

    <button
      v-if="editing"
      type="button"
      data-drag-handle
      class="grid size-10 shrink-0 cursor-grab touch-none place-items-center rounded-lg text-white/70 select-none hover:bg-white/10 focus-visible:bg-white/10 focus-visible:outline-2 focus-visible:outline-white/60 active:cursor-grabbing"
      :aria-label="t('list.reorder', { name: place.name })"
    >
      <UiIcon name="grip" class="size-5" />
    </button>
  </li>
</template>
