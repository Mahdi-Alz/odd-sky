<script setup>
import { useI18n } from "vue-i18n";
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
  <div class="relative mx-auto w-full max-w-xl">
    <form @submit.prevent>
      <label
        class="input input-lg w-full items-center gap-3 rounded-box border-base-300 bg-base-200/80 shadow-lg shadow-black/20 backdrop-blur focus-within:border-primary/60"
      >
        <svg
          class="size-5 shrink-0 text-base-content/50"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>

        <input
          v-model="query"
          type="text"
          :placeholder="t('search.placeholder')"
          class="grow"
          @input="search"
        />

        <span v-if="loading" class="loading loading-spinner loading-sm text-base-content/40"></span>
        <button
          v-else-if="query"
          type="button"
          class="btn btn-ghost btn-circle btn-xs text-base-content/50 hover:text-base-content"
          :aria-label="t('search.clear')"
          @click="clear"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
          >
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </label>
    </form>

    <!-- search suggestions -->
    <ul
      v-if="results !== null"
      class="menu absolute z-10 mt-2 w-full rounded-box border border-base-300 bg-base-200/95 p-2 shadow-xl shadow-black/30 backdrop-blur"
    >
      <li v-if="error" class="px-3 py-2 text-sm text-error">
        {{ t("search.error") }}
      </li>
      <li v-else-if="results.length === 0" class="px-3 py-2 text-sm text-base-content/50">
        {{ t("search.noResults") }}
      </li>
      <li v-for="place in results" :key="place.id">
        <button type="button" class="rounded-field" @click="choose(place)">
          <svg
            class="size-4 shrink-0 text-base-content/40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M12 21s-7-6.1-7-11a7 7 0 0 1 14 0c0 4.9-7 11-7 11Z" />
            <circle cx="12" cy="10" r="2.5" />
          </svg>
          <span class="truncate"
            >{{ place.name
            }}<span class="text-base-content/50">{{
              placeDetail(place) ? listSeparator + placeDetail(place) : ""
            }}</span></span
          >
        </button>
      </li>
    </ul>
  </div>
</template>
