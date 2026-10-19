<script setup>
import { useI18n } from "vue-i18n";
import UiIcon from "./UiIcon.vue";
import { useCitySearch } from "../composables/useCitySearch";
import { useFormat } from "../composables/useFormat";

const emit = defineEmits(["select"]);

const { t } = useI18n();
const { listSeparator, placeDetail } = useFormat();
const { query, results, loading, error, search, clear } = useCitySearch();

const choose = (place) => {
  emit("select", place);
  clear();
};
</script>

<template>
  <div class="relative w-full">
    <form role="search" @submit.prevent>
      <label
        class="flex items-center gap-3 rounded-xl border border-line bg-white/10 px-4 py-3 backdrop-blur focus-within:border-white/50"
      >
        <UiIcon name="search" class="size-5 shrink-0 text-white/60" />
        <input
          v-model="query"
          type="search"
          enterkeyhint="search"
          autocomplete="off"
          :placeholder="t('search.placeholder')"
          class="min-w-0 grow bg-transparent text-base text-white outline-none placeholder:text-white/50"
          @input="search"
        />
        <span
          v-if="loading"
          class="size-4 shrink-0 animate-spin rounded-full border-2 border-white/30 border-t-white"
        ></span>
        <button
          v-else-if="query"
          type="button"
          class="grid size-6 shrink-0 place-items-center rounded-full text-white/60 hover:text-white"
          :aria-label="t('search.clear')"
          @click="clear"
        >
          <UiIcon name="close" class="size-4" />
        </button>
      </label>
    </form>

    <ul
      v-if="results !== null"
      class="absolute inset-x-0 z-10 mt-2 max-h-80 overflow-y-auto rounded-xl border border-line bg-ink-soft p-1 shadow-2xl shadow-black/50"
    >
      <li v-if="error" class="px-3 py-3 text-sm text-danger">{{ t("search.error") }}</li>
      <li v-else-if="results.length === 0" class="px-3 py-3 text-sm text-white/60">
        {{ t("search.noResults") }}
      </li>
      <li v-for="place in results" :key="place.id">
        <button
          type="button"
          class="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-start hover:bg-white/10"
          @click="choose(place)"
        >
          <UiIcon name="pin" class="size-4 shrink-0 text-white/50" />
          <span class="truncate"
            >{{ place.name
            }}<span class="text-white/55">{{
              placeDetail(place) ? listSeparator + placeDetail(place) : ""
            }}</span></span
          >
        </button>
      </li>
    </ul>
  </div>
</template>
