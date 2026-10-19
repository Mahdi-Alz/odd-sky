<script setup>
import { useI18n } from "vue-i18n";
import { useFormat } from "../composables/useFormat";

defineProps({
  rows: { type: /** @type {import("vue").PropType<any[]>} */ (Array), required: true },
});

const { t } = useI18n();
const { activityName, activityLabel, activityReason, formatNumber, formatWindow } = useFormat();

const DOT_COLORS = ["#f87171", "#fb923c", "#fbbf24", "#a3e635", "#4ade80"];
const litDots = (score) => Math.round(score / 20);
</script>

<template>
  <section class="glass p-4" :aria-label="t('activities.title')">
    <h2 class="text-xs font-semibold tracking-wide text-white/70 uppercase">
      {{ t("activities.title") }}
    </h2>

    <ul class="mt-2 divide-y divide-line">
      <li v-for="row in rows" :key="row.id" class="py-3">
        <div class="flex items-center justify-between gap-3">
          <h3 class="text-base font-medium">{{ activityName(row.id) }}</h3>
          <p class="flex shrink-0 items-center gap-2 text-sm font-medium text-white/85">
            {{ activityLabel(row.label) }}
            <span class="sr-only">{{ formatNumber(row.score) }}</span>
            <span class="flex gap-1" dir="ltr" aria-hidden="true">
              <span
                v-for="(color, index) in DOT_COLORS"
                :key="color"
                class="size-2.5 rounded-full"
                :class="index < litDots(row.score) ? '' : 'bg-white/20'"
                :style="index < litDots(row.score) ? { backgroundColor: color } : undefined"
              ></span>
            </span>
          </p>
        </div>

        <p class="mt-2 text-sm leading-snug text-white/70">
          <template v-if="row.window"
            ><bdi>{{ formatWindow(row.window) }}</bdi> ·
          </template>
          <template v-else-if="row.whole">{{ t("activities.horizon") }} · </template>
          {{ row.headline.map(activityReason).join(" · ") }}
        </p>
      </li>
    </ul>

    <p class="mt-1 border-t border-line pt-3 text-[11px] leading-snug text-white/55">
      {{ t("activities.footnote") }}
    </p>
  </section>
</template>
