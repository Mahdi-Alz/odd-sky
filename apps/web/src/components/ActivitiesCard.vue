<script setup>
import { useI18n } from "vue-i18n";
import { useFormat } from "../composables/useFormat";

defineProps({
  rows: { type: /** @type {import("vue").PropType<any[]>} */ (Array), required: true },
});

const { t } = useI18n();
const { activityName, activityLabel, activityReason, activityTone, formatNumber, formatWindow } =
  useFormat();
</script>

<template>
  <section class="glass p-4" :aria-label="t('activities.title')">
    <h2 class="text-xs font-semibold tracking-wide text-white/70 uppercase">
      {{ t("activities.title") }}
    </h2>

    <ul class="mt-2 divide-y divide-line">
      <li v-for="row in rows" :key="row.id" class="py-3">
        <div class="flex items-baseline justify-between gap-3">
          <h3 class="text-base font-medium">{{ activityName(row.id) }}</h3>
          <p class="shrink-0 text-sm font-medium text-white/85">
            {{ activityLabel(row.label) }}
            <span class="text-white/55" dir="ltr">{{ formatNumber(row.score) }}</span>
          </p>
        </div>

        <span class="mt-2 block h-1 rounded-full bg-white/20" aria-hidden="true">
          <span
            class="block h-1 rounded-full"
            :class="activityTone(row.label)"
            :style="{ width: `${Math.max(row.score, 3)}%` }"
          ></span>
        </span>

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
