<script setup>
import { useI18n } from "vue-i18n";
import { useFormat } from "../composables/useFormat";

defineProps({
  facts: { type: Object, required: true },
  departure: { type: String, default: "" },
});

const { t } = useI18n();
const { factText, factTone, factsFootnote, formatFactsDate } = useFormat();
</script>

<template>
  <section class="glass p-4" :aria-label="t('facts.title')">
    <header class="flex items-baseline justify-between gap-3">
      <h2 class="text-xs font-semibold tracking-wide text-white/70 uppercase">
        {{ t("facts.title") }}
      </h2>
      <p class="text-xs text-white/60">{{ formatFactsDate(facts.localDate) }}</p>
    </header>

    <ul v-if="facts.facts.length" class="mt-3 space-y-3">
      <li v-for="fact in facts.facts" :key="fact.id" class="flex items-start gap-3">
        <span class="mt-2 size-2 shrink-0 rounded-full" :class="factTone(fact)"></span>
        <span class="text-lg leading-snug font-medium">{{ factText(fact, facts.localDate) }}</span>
      </li>
    </ul>

    <p v-if="departure" class="mt-3 text-sm text-white/75">{{ departure }}</p>

    <p class="mt-4 border-t border-line pt-3 text-[11px] leading-snug text-white/55">
      {{ factsFootnote(facts.yearsAvailable) }}
    </p>
  </section>
</template>
