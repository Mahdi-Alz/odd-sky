<script setup>
import { useI18n } from "vue-i18n";
import { scoreLevel } from "@odd-sky/core";
import { useFormat } from "../composables/useFormat";

defineProps({
  rows: { type: /** @type {import("vue").PropType<any[]>} */ (Array), required: true },
});

const { t } = useI18n();
const { activityName, activityLabel, activityReason, formatNumber, formatWindow } = useFormat();

const LEVEL_COLORS = ["#f87171", "#fb923c", "#fbbf24", "#bef264", "#86e57f", "#4ade80"];
const dots = (score) => {
  const level = scoreLevel(score);
  return LEVEL_COLORS.map((_, index) =>
    index < level ? { id: index, color: LEVEL_COLORS[level - 1] } : { id: index, color: null },
  );
};
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
                v-for="dot in dots(row.score)"
                :key="dot.id"
                class="size-2.5 rounded-full"
                :class="dot.color ? '' : 'bg-white/20'"
                :style="dot.color ? { backgroundColor: dot.color } : undefined"
              ></span>
            </span>
          </p>
        </div>

        <p class="mt-2 text-sm leading-snug text-white/70">
          <template v-if="row.window"
            ><bdi>{{ formatWindow(row.window, row.tomorrow) }}</bdi> ·
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
