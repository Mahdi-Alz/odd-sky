<script setup>
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import CityRow from "./CityRow.vue";
import SearchInput from "./SearchInput.vue";
import UiIcon from "./UiIcon.vue";
import { useDragReorder } from "../composables/useDragReorder";

defineProps({
  places: { type: /** @type {import("vue").PropType<any[]>} */ (Array), required: true },
  states: { type: Object, required: true },
});
const emit = defineEmits(["select", "add", "remove", "reorder", "open-settings", "close"]);

const { t } = useI18n();
const editing = ref(false);
const { draggingIndex, settling, onPointerDown, onKeyDown } = useDragReorder((from, to) =>
  emit("reorder", from, to),
);
</script>

<template>
  <div class="no-scrollbar fixed inset-0 z-20 overflow-y-auto bg-ink">
    <div class="safe-top safe-bottom mx-auto flex min-h-full max-w-xl flex-col gap-4 px-4">
      <header class="grid grid-cols-[1fr_auto_1fr] items-center gap-2 pt-2">
        <button
          v-if="places.length"
          type="button"
          class="grid size-10 justify-self-start place-items-center rounded-full bg-white/10 hover:bg-white/20"
          :aria-label="t('list.close')"
          @click="emit('close')"
        >
          <UiIcon name="back" class="size-5 rtl:rotate-180" />
        </button>
        <span v-else class="size-10"></span>

        <h1 class="text-lg font-semibold">{{ t("app.title") }}</h1>

        <div class="flex items-center gap-2 justify-self-end">
          <button
            v-if="places.length"
            type="button"
            class="min-w-16 rounded-full bg-white/10 px-3 py-2 text-sm font-medium hover:bg-white/20"
            @click="editing = !editing"
          >
            {{ editing ? t("list.done") : t("list.edit") }}
          </button>
          <button
            type="button"
            class="grid size-10 place-items-center rounded-full bg-white/10 hover:bg-white/20"
            :aria-label="t('settings.title')"
            @click="emit('open-settings')"
          >
            <UiIcon name="gear" class="size-5" />
          </button>
        </div>
      </header>

      <SearchInput @select="emit('add', $event)" />

      <TransitionGroup
        v-if="places.length"
        tag="ul"
        name="list"
        :move-class="settling ? 'list-hold' : 'list-move'"
        class="relative flex flex-col gap-3 pb-6"
        @pointerdown="onPointerDown"
        @keydown="onKeyDown"
      >
        <CityRow
          v-for="(place, index) in places"
          :key="place.id"
          :place="place"
          :forecast="states[place.id]?.forecast"
          :editing="editing"
          :lifted="draggingIndex === index"
          @select="emit('select', index)"
          @remove="emit('remove', place.id)"
        />
      </TransitionGroup>

      <div v-else class="mt-16 flex flex-col items-center gap-3 text-center text-white/50">
        <svg
          class="size-12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M17.5 19a4.5 4.5 0 0 0 0-9 6 6 0 0 0-11.7-1.8A4 4 0 0 0 6.5 16" />
        </svg>
        <p class="max-w-xs text-sm">{{ t("app.emptyState") }}</p>
      </div>
    </div>
  </div>
</template>
