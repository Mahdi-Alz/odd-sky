<script setup>
import { useI18n } from "vue-i18n";
import UiIcon from "./UiIcon.vue";
import { useDisclosure } from "../composables/useDisclosure";
import { useFormat } from "../composables/useFormat";

defineProps({
  facts: { type: Object, required: true },
  departure: { type: String, default: "" },
});

const { t } = useI18n();
const { factText, factTone, factsFootnote, formatFactsDate } = useFormat();
const { open: noteOpen, id: noteId, toggle: toggleNote } = useDisclosure();
</script>

<template>
  <section class="glass p-4" :aria-label="t('facts.title')">
    <header class="flex items-center justify-between gap-3">
      <h2 class="text-xs font-semibold tracking-wide text-white/70 uppercase">
        {{ t("facts.title") }}
      </h2>
      <div class="flex items-center gap-1">
        <p class="text-xs text-white/60">{{ formatFactsDate(facts.localDate) }}</p>
        <button
          type="button"
          class="-me-2 grid size-8 place-items-center rounded-full text-white/60 hover:text-white"
          :aria-label="t('facts.about')"
          :aria-expanded="noteOpen"
          :aria-controls="noteId"
          @click="toggleNote"
        >
          <UiIcon name="info" class="size-4" />
        </button>
      </div>
    </header>

    <ul v-if="facts.facts.length" class="mt-3 space-y-3">
      <li v-for="fact in facts.facts" :key="fact.id" class="flex items-start gap-3">
        <span class="mt-2 size-2 shrink-0 rounded-full" :class="factTone(fact)"></span>
        <span class="text-lg leading-snug font-medium">{{ factText(fact, facts.localDate) }}</span>
      </li>
    </ul>

    <p v-if="departure" class="mt-3 text-sm text-white/75">{{ departure }}</p>

    <p
      v-show="noteOpen"
      :id="noteId"
      class="mt-3 rounded-xl bg-white/10 p-3 text-xs leading-snug text-white/75"
    >
      {{ factsFootnote(facts.yearsAvailable) }}
    </p>
  </section>
</template>
