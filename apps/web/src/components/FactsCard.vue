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
const { open: noteOpen, id: noteId, toggle: toggleNote, close: closeNote } = useDisclosure();
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

    <Teleport to="body">
      <Transition name="toast">
        <div
          v-if="noteOpen"
          :id="noteId"
          role="status"
          class="glass fixed inset-x-4 bottom-[calc(4.25rem+env(safe-area-inset-bottom))] z-30 mx-auto flex max-w-md items-start gap-3 bg-black/70 p-4 text-sm leading-snug text-white/90 shadow-lg"
        >
          <p class="flex-1">{{ factsFootnote(facts.yearsAvailable) }}</p>
          <button
            type="button"
            class="-me-2 -mt-2 grid size-8 shrink-0 place-items-center rounded-full text-white/70 hover:text-white"
            :aria-label="t('facts.closeAbout')"
            @click="closeNote"
          >
            <UiIcon name="close" class="size-4" />
          </button>
        </div>
      </Transition>
    </Teleport>
  </section>
</template>
