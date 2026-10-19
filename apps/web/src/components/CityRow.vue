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
  first: { type: Boolean, default: false },
  last: { type: Boolean, default: false },
});
const emit = defineEmits(["select", "remove", "move"]);

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
      class="sky flex min-w-0 rounded-card border border-line flex-1 items-center justify-between gap-3 p-4 text-start"
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

    <div v-if="editing" class="flex shrink-0 flex-col gap-1">
      <button
        type="button"
        class="grid size-8 place-items-center rounded-lg bg-white/10 disabled:opacity-30"
        :disabled="first"
        :aria-label="t('list.moveUp')"
        @click="emit('move', -1)"
      >
        <UiIcon name="up" class="size-4" />
      </button>
      <button
        type="button"
        class="grid size-8 place-items-center rounded-lg bg-white/10 disabled:opacity-30"
        :disabled="last"
        :aria-label="t('list.moveDown')"
        @click="emit('move', 1)"
      >
        <UiIcon name="down" class="size-4" />
      </button>
    </div>
  </li>
</template>
