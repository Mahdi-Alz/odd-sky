<script setup>
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import CityRow from "./CityRow.vue";
import SearchInput from "./SearchInput.vue";
import UiIcon from "./UiIcon.vue";

defineProps({
  places: { type: /** @type {import("vue").PropType<any[]>} */ (Array), required: true },
  states: { type: Object, required: true },
});
const emit = defineEmits(["select", "add", "remove", "move", "open-settings", "close"]);

const { t } = useI18n();
const editing = ref(false);
</script>

<template>
  <div class="no-scrollbar fixed inset-0 z-20 overflow-y-auto bg-ink">
    <div class="safe-top safe-bottom mx-auto flex min-h-full max-w-xl flex-col gap-4 px-4">
      <header class="flex items-center justify-between gap-2 pt-2">
        <button
          v-if="places.length"
          type="button"
          class="grid size-10 place-items-center rounded-full bg-white/10 hover:bg-white/20"
          :aria-label="t('list.close')"
          @click="emit('close')"
        >
          <UiIcon name="back" class="size-5 rtl:rotate-180" />
        </button>
        <span v-else class="size-10"></span>

        <h1 class="text-lg font-semibold">{{ t("list.title") }}</h1>

        <div class="flex items-center gap-2">
          <button
            v-if="places.length"
            type="button"
            class="rounded-full bg-white/10 px-3 py-2 text-sm font-medium hover:bg-white/20"
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

      <ul v-if="places.length" class="space-y-3 pb-6">
        <CityRow
          v-for="(place, index) in places"
          :key="place.id"
          :place="place"
          :forecast="states[place.id]?.forecast"
          :editing="editing"
          :first="index === 0"
          :last="index === places.length - 1"
          @select="emit('select', index)"
          @remove="emit('remove', place.id)"
          @move="emit('move', place.id, $event)"
        />
      </ul>

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
