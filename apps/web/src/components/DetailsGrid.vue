<script setup>
import { useI18n } from "vue-i18n";
import { useFormat } from "../composables/useFormat";

defineProps({
  current: { type: Object, required: true },
});

const { t } = useI18n();
const { formatTemp, formatPercent, formatSpeed, formatNumber } = useFormat();
</script>

<template>
  <section class="grid grid-cols-2 gap-3" :aria-label="t('page.details')">
    <div class="glass p-4">
      <h2 class="text-xs font-semibold tracking-wide text-white/70 uppercase">
        {{ t("card.feelsLike") }}
      </h2>
      <p class="mt-2 text-3xl font-light" dir="ltr">{{ formatTemp(current.feelsLike) }}</p>
    </div>
    <div class="glass p-4">
      <h2 class="text-xs font-semibold tracking-wide text-white/70 uppercase">
        {{ t("card.humidity") }}
      </h2>
      <p class="mt-2 text-3xl font-light" dir="ltr">{{ formatPercent(current.humidity) }}</p>
    </div>
    <div class="glass p-4">
      <h2 class="text-xs font-semibold tracking-wide text-white/70 uppercase">
        {{ t("card.wind") }}
      </h2>
      <p class="mt-2 text-3xl font-light">
        <bdi>{{ formatSpeed(current.wind) }}</bdi>
      </p>
    </div>
    <div class="glass p-4">
      <h2 class="text-xs font-semibold tracking-wide text-white/70 uppercase">
        {{ t("card.uv") }}
      </h2>
      <p class="mt-2 text-3xl font-light">{{ formatNumber(current.uv) }}</p>
    </div>
  </section>
</template>
